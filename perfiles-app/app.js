/* Wrestling Performance Lab — standalone "Crear Perfil de Atleta".
   Usa el mismo proyecto de Firebase que la app principal (ver
   firebase-config.public.js) y escribe en la colección canónica "users",
   de modo que los perfiles creados aquí aparecen para los coaches en la
   app principal. Esta app es autónoma: no depende del código original. */

const FIREBASE_USERS_COLLECTION = window.FIREBASE_USERS_COLLECTION || "users";
const PROFILE_PHOTO_MAX_BYTES = 25 * 1024 * 1024;
const PROFILE_PHOTO_MAX_DATA_URL_CHARS = 420000;

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------- DOM refs ----------

const els = {};
[
  "authCard", "authForm", "authTitle", "authTabRegister", "authTabLogin",
  "acNameField", "acName", "acEmail", "acPassword", "authStatus", "authSubmitBtn",
  "signOutBtn", "stepper",
  "profileCard", "athleteProfileForm", "profileStatus", "profileSubmitBtn", "profileIdentity",
  "profileProgressLabel", "profileProgressFill",
  "doneCard", "doneSummary", "editAgainBtn",
  "aPhotoPreview", "aPhotoFile", "aPhotoChooseBtn", "aPhotoEditBtn", "aPhotoClearBtn", "aPhotoUrl", "aPhotoStatus",
  "aName", "aAge", "aWeight", "aCountry", "aCity", "aSchool", "aClub", "aSchoolGrade",
  "aTrainingRoutines", "aTrainingVolume", "aTrainingFocus",
  "aPreferredMoves", "aStance", "aQuestionnaireNotes",
  "aLeadLeg", "aLeftAttack", "aRightAttack", "aPreferredTies", "aMiscNotes",
  "aChallengeOne", "aChallengeTwo", "aChallengeThree",
  "aStyle", "aWeightClass", "aYears", "aLevel", "aPosition", "aArchetype", "aBodyType", "aStrategy",
  "aStrategyA", "aStrategyB", "aStrategyC", "aSafeMoves", "aRiskyMoves", "aResultsHistory",
  "aInternational", "aInternationalEvents", "aInternationalYears",
  "aCoachCues", "aCueNotes", "aInjuryNotes",
  "aFavoritePosition", "aPsychTendency", "aPressureError", "aCoachSignal",
  "aCueWord1", "aCueWord2", "aCueWord3",
  "aSetup1", "aSetup2", "aSetup3", "aCornerCue1", "aCornerCue2", "aCornerCue3",
  "aMentalReminder1", "aMentalReminder2", "aMentalReminder3",
  "aSafetyWarning1", "aSafetyWarning2", "aPhysicalLimitation1", "aPhysicalLimitation2",
  "aCompetitionCue", "aOffense1", "aOffense2", "aOffense3", "aDefense1", "aDefense2", "aDefense3",
  "profilePhotoCropModal", "profilePhotoCropCloseBtn", "profilePhotoCropViewport",
  "profilePhotoCropImage", "profilePhotoCropZoom", "profilePhotoCropZoomLabel",
  "profilePhotoCropCancelBtn", "profilePhotoCropResetBtn", "profilePhotoCropSaveBtn",
  "pwCurrent", "pwNew", "pwConfirm", "pwStatus", "pwBtn",
  "toastStack"
].forEach((id) => { els[id] = document.getElementById(id); });

// ---------- state ----------

let currentUid = "";
let currentEmail = "";
let existingProfile = null;   // doc actual en Firestore (si el usuario ya tenía perfil)
let photoValue = "";          // foto activa (data URL recortada o URL pegada)
let authMode = "register";    // "register" | "login"

// ---------- helpers ----------

function slugifyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `athlete-${Date.now()}`;
}

function normalizeTopThree(list = []) {
  return list.filter(Boolean).map((item) => String(item).trim()).filter(Boolean).slice(0, 3);
}

function topThreeFromInputs(inputs = []) {
  return normalizeTopThree(inputs.map((input) => input?.value || ""));
}

function stripUndefinedDeep(value) {
  if (Array.isArray(value)) return value.map(stripUndefinedDeep);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined) out[key] = stripUndefinedDeep(value[key]);
    });
    return out;
  }
  return value;
}

const PROFILE_AUDIT_SKIP_KEYS = new Set(["updatedAt", "createdAt", "user_id"]);

function computeChangedKeys(prev = {}, next = {}) {
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  const changed = [];
  keys.forEach((key) => {
    if (PROFILE_AUDIT_SKIP_KEYS.has(key)) return;
    try {
      if (JSON.stringify((prev || {})[key] ?? null) !== JSON.stringify((next || {})[key] ?? null)) changed.push(key);
    } catch { /* ignore */ }
  });
  return changed.slice(0, 25);
}

// Registro de auditoría: el supervisor de Wrestling Performance Lab ve cada
// cambio de perfil en su panel de actividad. Nunca se registran contraseñas.
function logAuditEvent(action, { targetName = "", changedKeys = [] } = {}) {
  try {
    if (!currentUid) return;
    db.collection("profile_audit").doc().set({
      actorUid: currentUid,
      actorName: targetName || "",
      actorRole: "athlete",
      targetUid: currentUid,
      targetName: targetName || "",
      targetRole: "athlete",
      action,
      changedKeys: changedKeys.slice(0, 25),
      source: "perfiles-app",
      createdAt: firebase.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
      createdAtIso: new Date().toISOString()
    }).catch((err) => console.warn("Audit log failed", err));
  } catch (err) {
    console.warn("Audit log failed", err);
  }
}

function toast(message, tone = "") {
  if (!els.toastStack) return;
  const node = document.createElement("div");
  node.className = `toast ${tone}`.trim();
  node.textContent = message;
  els.toastStack.appendChild(node);
  window.setTimeout(() => node.remove(), 4200);
}

function setStatus(target, message, tone = "") {
  if (!target) return;
  target.textContent = message || "";
  target.classList.remove("ok", "error");
  if (tone) target.classList.add(tone);
}

function initialsFromName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function renderAvatar(target, { photo = "", name = "", fallback = "AT" } = {}) {
  if (!target) return;
  if (photo) {
    target.style.backgroundImage = `url("${photo}")`;
    target.textContent = "";
  } else {
    target.style.backgroundImage = "";
    target.textContent = initialsFromName(name) || fallback;
  }
}

// ---------- steps / views ----------

function showStep(step) {
  els.authCard.classList.toggle("hidden", step !== "auth");
  els.profileCard.classList.toggle("hidden", step !== "profile");
  els.doneCard.classList.toggle("hidden", step !== "done");
  els.signOutBtn.classList.toggle("hidden", step === "auth");
  const order = ["auth", "profile", "done"];
  const activeIndex = order.indexOf(step);
  document.querySelectorAll(".stepper-item").forEach((item) => {
    const itemIndex = order.indexOf(item.dataset.step);
    item.classList.toggle("active", itemIndex === activeIndex);
    item.classList.toggle("complete", itemIndex < activeIndex);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- auth: tabs ----------

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  els.authTabRegister.classList.toggle("active", isRegister);
  els.authTabLogin.classList.toggle("active", !isRegister);
  els.acNameField.classList.toggle("hidden", !isRegister);
  els.acName.required = isRegister;
  els.acPassword.autocomplete = isRegister ? "new-password" : "current-password";
  els.authTitle.textContent = isRegister ? "Crear cuenta" : "Iniciar sesión";
  els.authSubmitBtn.textContent = isRegister ? "Crear cuenta y continuar" : "Entrar y continuar";
  setStatus(els.authStatus, "");
}

els.authTabRegister.addEventListener("click", () => setAuthMode("register"));
els.authTabLogin.addEventListener("click", () => setAuthMode("login"));

// ---------- auth: submit ----------

function describeAuthError(err) {
  const code = String(err?.code || "");
  if (code === "auth/email-already-in-use") return "Ese correo ya tiene una cuenta. Usa la pestaña \"Ya tengo cuenta\".";
  if (code === "auth/invalid-email") return "Correo electrónico inválido.";
  if (code === "auth/weak-password") return "La contraseña debe tener al menos 6 caracteres.";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
    return "Correo o contraseña incorrectos.";
  }
  if (code === "auth/too-many-requests") return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
  if (code === "auth/network-request-failed") return "Sin conexión. Revisa tu internet e intenta de nuevo.";
  return "No se pudo completar la operación. Intenta de nuevo.";
}

els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = els.acName.value.trim();
  const email = els.acEmail.value.trim().toLowerCase();
  const password = els.acPassword.value;
  if (!email || !password || (authMode === "register" && !name)) {
    setStatus(els.authStatus, "Completa los campos requeridos.", "error");
    return;
  }

  els.authSubmitBtn.disabled = true;
  setStatus(els.authStatus, authMode === "register" ? "Creando cuenta..." : "Iniciando sesión...");
  try {
    if (authMode === "register") {
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      if (credential.user?.updateProfile) {
        try { await credential.user.updateProfile({ displayName: name }); } catch { /* no crítico */ }
      }
      await enterProfileStep(credential.user, { defaultName: name });
      toast("Cuenta creada. Ahora completa tu perfil.", "ok");
    } else {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      await enterProfileStep(credential.user);
      toast("Sesión iniciada.", "ok");
    }
  } catch (err) {
    console.error(err);
    setStatus(els.authStatus, describeAuthError(err), "error");
  } finally {
    els.authSubmitBtn.disabled = false;
  }
});

// ---------- auth: session resume / sign out ----------

let initialAuthResolved = false;
auth.onAuthStateChanged(async (user) => {
  if (initialAuthResolved) return;
  initialAuthResolved = true;
  if (!user) return;
  try {
    await enterProfileStep(user);
    toast("Sesión recuperada. Puedes seguir editando tu perfil.", "ok");
  } catch (err) {
    console.warn("No se pudo reanudar la sesión", err);
  }
});

els.signOutBtn.addEventListener("click", async () => {
  try { await auth.signOut(); } catch { /* sin conexión: igual limpiamos la vista */ }
  currentUid = "";
  currentEmail = "";
  existingProfile = null;
  photoValue = "";
  els.athleteProfileForm.reset();
  renderAvatar(els.aPhotoPreview, {});
  setAuthMode("login");
  showStep("auth");
  toast("Sesión cerrada.");
});

// ---------- profile step: load + prefill ----------

async function enterProfileStep(user, { defaultName = "" } = {}) {
  currentUid = user.uid;
  currentEmail = String(user.email || "").trim().toLowerCase();
  els.profileIdentity.textContent = currentEmail;

  existingProfile = null;
  try {
    const snapshot = await db.collection(FIREBASE_USERS_COLLECTION).doc(currentUid).get();
    if (snapshot.exists) existingProfile = snapshot.data() || null;
  } catch (err) {
    console.warn("No se pudo leer el perfil existente", err);
  }

  prefillProfileForm(existingProfile, { defaultName: defaultName || user.displayName || "" });
  showProfileSubtab("training");
  showStep("profile");
  updateProfileProgress();
}

function setValue(input, value) {
  if (input && value != null && value !== "") input.value = String(value);
}

function prefillProfileForm(profile, { defaultName = "" } = {}) {
  els.athleteProfileForm.reset();
  photoValue = "";
  const p = profile || {};

  setValue(els.aName, p.name || defaultName);
  setValue(els.aAge, p.age);
  setValue(els.aWeight, p.currentWeight);
  setValue(els.aCountry, p.country);
  setValue(els.aCity, p.city);
  setValue(els.aSchool, p.schoolName);
  setValue(els.aClub, p.clubName);
  setValue(els.aSchoolGrade, p.schoolGrade);
  setValue(els.aTrainingRoutines, p.trainingRoutines);
  setValue(els.aTrainingVolume, p.trainingVolume);
  setValue(els.aTrainingFocus, p.trainingFocus);
  setValue(els.aPreferredMoves, p.preferredMoves);
  setValue(els.aStance, p.stance);
  setValue(els.aQuestionnaireNotes, p.questionnaireNotes);

  const dt = p.defaultTechniques || {};
  setValue(els.aLeadLeg, dt.leadLeg);
  setValue(els.aLeftAttack, dt.leftAttack);
  setValue(els.aRightAttack, dt.rightAttack);
  setValue(els.aPreferredTies, dt.preferredTies);
  setValue(els.aMiscNotes, dt.miscNotes);

  setValue(els.aChallengeOne, p.challengeOne);
  setValue(els.aChallengeTwo, p.challengeTwo);
  setValue(els.aChallengeThree, p.challengeThree);

  setValue(els.aStyle, p.style);
  setValue(els.aWeightClass, p.weightClass);
  setValue(els.aYears, p.years);
  setValue(els.aLevel, p.level);
  setValue(els.aPosition, p.position);
  setValue(els.aArchetype, p.archetype);
  setValue(els.aBodyType, p.bodyType);
  setValue(els.aStrategy, p.strategy);
  setValue(els.aStrategyA, p.strategyA);
  setValue(els.aStrategyB, p.strategyB);
  setValue(els.aStrategyC, p.strategyC);
  setValue(els.aSafeMoves, p.safeMoves);
  setValue(els.aRiskyMoves, p.riskyMoves);
  setValue(els.aResultsHistory, p.resultsHistory);
  setValue(els.aInternational, p.international);
  setValue(els.aInternationalEvents, p.internationalEvents);
  setValue(els.aInternationalYears, p.internationalYears);
  setValue(els.aCoachCues, p.coachCues);
  setValue(els.aCueNotes, p.cueNotes);
  setValue(els.aInjuryNotes, p.injuryNotes);

  setValue(els.aFavoritePosition, p.favoritePosition);
  setValue(els.aPsychTendency, p.psychTendency);
  setValue(els.aPressureError, p.pressureError);
  setValue(els.aCoachSignal, p.coachSignal);

  const cueWords = Array.isArray(p.cueWords) ? p.cueWords : [];
  setValue(els.aCueWord1, cueWords[0]);
  setValue(els.aCueWord2, cueWords[1]);
  setValue(els.aCueWord3, cueWords[2]);

  const setups = Array.isArray(p.setupsTop3) ? p.setupsTop3 : [];
  setValue(els.aSetup1, setups[0]);
  setValue(els.aSetup2, setups[1]);
  setValue(els.aSetup3, setups[2]);

  const cornerCues = Array.isArray(p.cornerCoachCues) ? p.cornerCoachCues : [];
  setValue(els.aCornerCue1, cornerCues[0]);
  setValue(els.aCornerCue2, cornerCues[1]);
  setValue(els.aCornerCue3, cornerCues[2]);

  const reminders = Array.isArray(p.mentalReminders) ? p.mentalReminders : [];
  setValue(els.aMentalReminder1, reminders[0]);
  setValue(els.aMentalReminder2, reminders[1]);
  setValue(els.aMentalReminder3, reminders[2]);

  const warnings = Array.isArray(p.safetyWarnings) ? p.safetyWarnings : [];
  setValue(els.aSafetyWarning1, warnings[0]);
  setValue(els.aSafetyWarning2, warnings[1]);

  const limitations = Array.isArray(p.physicalLimitations) ? p.physicalLimitations : [];
  setValue(els.aPhysicalLimitation1, limitations[0]);
  setValue(els.aPhysicalLimitation2, limitations[1]);

  setValue(els.aCompetitionCue, p.competitionCue);

  const offense = Array.isArray(p.offenseTop3) ? p.offenseTop3 : [];
  setValue(els.aOffense1, offense[0]);
  setValue(els.aOffense2, offense[1]);
  setValue(els.aOffense3, offense[2]);

  const defense = Array.isArray(p.defenseTop3) ? p.defenseTop3 : [];
  setValue(els.aDefense1, defense[0]);
  setValue(els.aDefense2, defense[1]);
  setValue(els.aDefense3, defense[2]);

  photoValue = String(p.photo || "").trim();
  renderAvatar(els.aPhotoPreview, { photo: photoValue, name: els.aName.value });
  els.aPhotoEditBtn.disabled = !photoValue;
  setStatus(els.aPhotoStatus, photoValue ? "Foto cargada desde tu perfil." : "Opcional. Imagen cuadrada recomendada.", photoValue ? "ok" : "");
}

// ---------- tabs + panel navigation ----------

function showProfileSubtab(name) {
  document.querySelectorAll(".profile-subtab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.profileTab === name);
  });
  document.querySelectorAll(".profile-subpanel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.profilePanel !== name);
  });
}

document.querySelectorAll(".profile-subtab").forEach((btn) => {
  btn.addEventListener("click", () => showProfileSubtab(btn.dataset.profileTab));
});

document.querySelectorAll(".panel-next").forEach((btn) => {
  btn.addEventListener("click", () => showProfileSubtab(btn.dataset.goto));
});

// ---------- progress ----------

const progressFields = Array.from(document.querySelectorAll("[data-progress]"));

function updateProfileProgress() {
  const total = progressFields.length + 1; // +1 por la foto
  let filled = photoValue ? 1 : 0;
  progressFields.forEach((field) => {
    if (String(field.value || "").trim()) filled += 1;
  });
  const percent = total ? Math.round((filled / total) * 100) : 0;
  els.profileProgressLabel.textContent = `${percent}% · ${filled} de ${total} campos`;
  els.profileProgressFill.style.width = `${percent}%`;
}

els.athleteProfileForm.addEventListener("input", updateProfileProgress);
els.athleteProfileForm.addEventListener("change", updateProfileProgress);

// ---------- photo: choose / URL / clear ----------

function getProfilePhotoErrorMessage(err) {
  const code = String(err?.message || err?.code || "");
  if (code === "profile_photo_file_too_large") return "La foto es demasiado grande. Usa una imagen menor de 25MB.";
  if (code === "profile_photo_data_too_large") return "La foto no se pudo reducir lo suficiente. Intenta otra imagen.";
  if (code === "profile_photo_remote_not_editable") return "Esa URL no se pudo cargar como imagen editable. Descarga la imagen y súbela desde tu dispositivo.";
  return "No se pudo procesar la foto. Intenta otra imagen.";
}

function applyCroppedPhoto(dataUrl) {
  photoValue = dataUrl;
  els.aPhotoUrl.value = "";
  renderAvatar(els.aPhotoPreview, { photo: photoValue, name: els.aName.value });
  els.aPhotoEditBtn.disabled = false;
  setStatus(els.aPhotoStatus, "Foto lista. Se guardará con tu perfil.", "ok");
  updateProfileProgress();
}

els.aPhotoChooseBtn.addEventListener("click", () => els.aPhotoFile.click());

els.aPhotoFile.addEventListener("change", async () => {
  const file = els.aPhotoFile.files?.[0];
  els.aPhotoFile.value = "";
  if (!file) return;
  try {
    await openProfilePhotoCropModal(file);
  } catch (err) {
    setStatus(els.aPhotoStatus, getProfilePhotoErrorMessage(err), "error");
  }
});

els.aPhotoEditBtn.addEventListener("click", async () => {
  if (!photoValue) return;
  try {
    await openProfilePhotoCropModal(photoValue);
  } catch (err) {
    setStatus(els.aPhotoStatus, getProfilePhotoErrorMessage(err), "error");
  }
});

els.aPhotoUrl.addEventListener("change", () => {
  const url = els.aPhotoUrl.value.trim();
  if (!url) return;
  photoValue = url;
  renderAvatar(els.aPhotoPreview, { photo: url, name: els.aName.value });
  els.aPhotoEditBtn.disabled = false;
  setStatus(els.aPhotoStatus, "URL aplicada. Usa \"Editar foto actual\" para recortarla.", "ok");
  updateProfileProgress();
});

els.aPhotoClearBtn.addEventListener("click", () => {
  photoValue = "";
  els.aPhotoUrl.value = "";
  renderAvatar(els.aPhotoPreview, { name: els.aName.value });
  els.aPhotoEditBtn.disabled = true;
  setStatus(els.aPhotoStatus, "Opcional. Imagen cuadrada recomendada.");
  updateProfileProgress();
});

// ---------- photo crop modal ----------

let cropSession = null;
let dragPointer = null;

function clampCropState(state) {
  const displayWidth = state.naturalWidth * state.scale;
  const displayHeight = state.naturalHeight * state.scale;
  if (displayWidth <= state.viewportSize) {
    state.x = Math.round((state.viewportSize - displayWidth) / 2);
  } else {
    state.x = Math.max(state.viewportSize - displayWidth, Math.min(0, state.x));
  }
  if (displayHeight <= state.viewportSize) {
    state.y = Math.round((state.viewportSize - displayHeight) / 2);
  } else {
    state.y = Math.max(state.viewportSize - displayHeight, Math.min(0, state.y));
  }
}

function renderCropState() {
  const state = cropSession?.state;
  if (!state) return;
  els.profilePhotoCropImage.style.width = `${Math.max(1, Math.round(state.naturalWidth * state.scale))}px`;
  els.profilePhotoCropImage.style.height = `${Math.max(1, Math.round(state.naturalHeight * state.scale))}px`;
  els.profilePhotoCropImage.style.left = `${Math.round(state.x)}px`;
  els.profilePhotoCropImage.style.top = `${Math.round(state.y)}px`;
  els.profilePhotoCropZoom.value = String(state.zoom);
  els.profilePhotoCropZoomLabel.textContent = `Zoom (${Math.round(state.zoom * 100)}%)`;
}

function centerCropState() {
  const state = cropSession?.state;
  if (!state) return;
  state.x = Math.round((state.viewportSize - state.naturalWidth * state.scale) / 2);
  state.y = Math.round((state.viewportSize - state.naturalHeight * state.scale) / 2);
  clampCropState(state);
  renderCropState();
}

function setCropZoom(nextZoom) {
  const state = cropSession?.state;
  if (!state) return;
  const safeZoom = Math.max(state.minZoom, Math.min(state.maxZoom, Number(nextZoom) || state.zoom));
  const oldScale = state.scale;
  const focusX = ((state.viewportSize / 2) - state.x) / oldScale;
  const focusY = ((state.viewportSize / 2) - state.y) / oldScale;
  state.zoom = safeZoom;
  state.scale = state.baseScale * state.zoom;
  state.x = Math.round((state.viewportSize / 2) - (focusX * state.scale));
  state.y = Math.round((state.viewportSize / 2) - (focusY * state.scale));
  clampCropState(state);
  renderCropState();
}

async function resolveCropSource(source) {
  // Archivo local → object URL directo.
  if (typeof source !== "string") {
    const mimeType = String(source.type || "").toLowerCase();
    if (!mimeType.startsWith("image/")) throw new Error("profile_photo_invalid_type");
    if (Number(source.size || 0) > PROFILE_PHOTO_MAX_BYTES) throw new Error("profile_photo_file_too_large");
    const objectUrl = URL.createObjectURL(source);
    return { src: objectUrl, objectUrl };
  }
  const raw = source.trim();
  if (!raw) throw new Error("profile_photo_invalid_type");
  // Data URL (foto ya recortada) → usable directamente sin contaminar el canvas.
  if (raw.startsWith("data:image/")) return { src: raw, objectUrl: "" };
  // URL remota → descargar vía CORS para poder exportar el canvas después.
  try {
    const response = await fetch(raw, { mode: "cors" });
    if (!response.ok) throw new Error("profile_photo_remote_fetch_failed");
    const blob = await response.blob();
    if (!String(blob?.type || "").toLowerCase().startsWith("image/")) {
      throw new Error("profile_photo_remote_invalid_type");
    }
    const objectUrl = URL.createObjectURL(blob);
    return { src: objectUrl, objectUrl };
  } catch (err) {
    const nextErr = new Error("profile_photo_remote_not_editable");
    nextErr.cause = err;
    throw nextErr;
  }
}

async function openProfilePhotoCropModal(source) {
  const { src, objectUrl } = await resolveCropSource(source);

  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("profile_photo_invalid_type"));
      image.src = src;
    });
  } catch (err) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw err;
  }

  const viewportSize = els.profilePhotoCropViewport.clientWidth || 260;
  const baseScale = viewportSize / Math.min(image.naturalWidth, image.naturalHeight);
  cropSession = {
    objectUrl,
    state: {
      image,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      viewportSize,
      baseScale,
      scale: baseScale,
      zoom: 1,
      minZoom: 1,
      maxZoom: 3,
      x: 0,
      y: 0
    }
  };
  els.profilePhotoCropImage.src = src;
  centerCropState();
  els.profilePhotoCropModal.classList.remove("hidden");
}

function closeCropModal() {
  if (!cropSession) return;
  const session = cropSession;
  cropSession = null;
  dragPointer = null;
  els.profilePhotoCropModal.classList.add("hidden");
  els.profilePhotoCropViewport.classList.remove("dragging");
  if (session.objectUrl) URL.revokeObjectURL(session.objectUrl);
}

els.profilePhotoCropZoom.addEventListener("input", (event) => setCropZoom(event.target.value));
els.profilePhotoCropResetBtn.addEventListener("click", () => {
  if (!cropSession) return;
  cropSession.state.zoom = 1;
  cropSession.state.scale = cropSession.state.baseScale;
  centerCropState();
});
els.profilePhotoCropCancelBtn.addEventListener("click", closeCropModal);
els.profilePhotoCropCloseBtn.addEventListener("click", closeCropModal);
els.profilePhotoCropModal.addEventListener("click", (event) => {
  if (event.target === els.profilePhotoCropModal) closeCropModal();
});

els.profilePhotoCropViewport.addEventListener("pointerdown", (event) => {
  if (!cropSession) return;
  dragPointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: cropSession.state.x,
    originY: cropSession.state.y
  };
  els.profilePhotoCropViewport.classList.add("dragging");
  els.profilePhotoCropViewport.setPointerCapture(event.pointerId);
});
els.profilePhotoCropViewport.addEventListener("pointermove", (event) => {
  if (!dragPointer || !cropSession || event.pointerId !== dragPointer.id) return;
  const state = cropSession.state;
  state.x = dragPointer.originX + (event.clientX - dragPointer.startX);
  state.y = dragPointer.originY + (event.clientY - dragPointer.startY);
  clampCropState(state);
  renderCropState();
});
["pointerup", "pointercancel"].forEach((type) => {
  els.profilePhotoCropViewport.addEventListener(type, () => {
    dragPointer = null;
    els.profilePhotoCropViewport.classList.remove("dragging");
  });
});

function buildCropDataUrl() {
  const state = cropSession?.state;
  if (!state) return "";
  const canvas = document.createElement("canvas");
  const attempts = [
    { size: 1024, quality: 0.92 }, { size: 896, quality: 0.88 }, { size: 768, quality: 0.84 },
    { size: 640, quality: 0.8 }, { size: 512, quality: 0.76 }
  ];
  const srcSize = state.viewportSize / state.scale;
  const srcX = Math.max(0, Math.min(state.naturalWidth - srcSize, -state.x / state.scale));
  const srcY = Math.max(0, Math.min(state.naturalHeight - srcSize, -state.y / state.scale));
  let lastDataUrl = "";
  for (const attempt of attempts) {
    canvas.width = attempt.size;
    canvas.height = attempt.size;
    const context = canvas.getContext("2d");
    if (!context) continue;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, attempt.size, attempt.size);
    context.drawImage(state.image, srcX, srcY, srcSize, srcSize, 0, 0, attempt.size, attempt.size);
    lastDataUrl = canvas.toDataURL("image/jpeg", attempt.quality);
    if (lastDataUrl.length <= PROFILE_PHOTO_MAX_DATA_URL_CHARS) return lastDataUrl;
  }
  if (lastDataUrl.length <= PROFILE_PHOTO_MAX_DATA_URL_CHARS) return lastDataUrl;
  throw new Error("profile_photo_data_too_large");
}

els.profilePhotoCropSaveBtn.addEventListener("click", () => {
  try {
    const dataUrl = buildCropDataUrl();
    applyCroppedPhoto(dataUrl);
    closeCropModal();
  } catch (err) {
    toast(getProfilePhotoErrorMessage(err), "error");
  }
});

// ---------- profile form: read + save ----------

function readAthleteProfileForm() {
  const offenseTop3 = topThreeFromInputs([els.aOffense1, els.aOffense2, els.aOffense3]);
  const defenseTop3 = topThreeFromInputs([els.aDefense1, els.aDefense2, els.aDefense3]);
  const setupsTop3 = topThreeFromInputs([els.aSetup1, els.aSetup2, els.aSetup3]);
  const cornerCoachCues = topThreeFromInputs([els.aCornerCue1, els.aCornerCue2, els.aCornerCue3]);
  const mentalReminders = topThreeFromInputs([els.aMentalReminder1, els.aMentalReminder2, els.aMentalReminder3]);
  const safetyWarnings = [els.aSafetyWarning1.value.trim(), els.aSafetyWarning2.value.trim()].filter(Boolean);
  const physicalLimitations = [els.aPhysicalLimitation1.value.trim(), els.aPhysicalLimitation2.value.trim()].filter(Boolean);

  return {
    name: els.aName.value.trim(),
    role: "athlete",
    view: "athlete",
    age: els.aAge.value.trim(),
    photo: photoValue,
    country: els.aCountry.value.trim(),
    city: els.aCity.value.trim(),
    currentWeight: els.aWeight.value.trim(),
    schoolName: els.aSchool.value.trim(),
    clubName: els.aClub.value.trim(),
    schoolGrade: els.aSchoolGrade.value.trim(),
    trainingRoutines: els.aTrainingRoutines.value.trim(),
    trainingVolume: els.aTrainingVolume.value.trim(),
    trainingFocus: els.aTrainingFocus.value.trim(),
    preferredMoves: els.aPreferredMoves.value.trim(),
    preferred_moves: els.aPreferredMoves.value.trim(),
    stance: els.aStance.value,
    questionnaireNotes: els.aQuestionnaireNotes.value.trim(),
    style: els.aStyle.value || "freestyle",
    weightClass: els.aWeightClass.value.trim(),
    years: els.aYears.value.trim(),
    level: els.aLevel.value || "intermediate",
    position: els.aPosition.value || "neutral",
    archetype: els.aArchetype.value,
    bodyType: els.aBodyType.value,
    strategy: els.aStrategy.value || "balanced",
    strategyA: els.aStrategyA.value.trim(),
    strategyB: els.aStrategyB.value.trim(),
    strategyC: els.aStrategyC.value.trim(),
    safeMoves: els.aSafeMoves.value.trim(),
    riskyMoves: els.aRiskyMoves.value.trim(),
    resultsHistory: els.aResultsHistory.value.trim(),
    international: els.aInternational.value || "no",
    internationalEvents: els.aInternationalEvents.value.trim(),
    internationalYears: els.aInternationalYears.value.trim(),
    coachCues: els.aCoachCues.value || "specific",
    cueNotes: els.aCueNotes.value.trim(),
    injuryNotes: els.aInjuryNotes.value.trim(),
    favoritePosition: els.aFavoritePosition.value || els.aPosition.value || "neutral",
    psychTendency: els.aPsychTendency.value,
    pressureError: els.aPressureError.value.trim(),
    coachSignal: els.aCoachSignal.value.trim(),
    offenseTop3,
    defenseTop3,
    cueWords: [els.aCueWord1.value.trim(), els.aCueWord2.value.trim(), els.aCueWord3.value.trim()].filter(Boolean),
    setupsTop3,
    cornerCoachCues,
    mentalReminders,
    safetyWarnings,
    physicalLimitations,
    competitionCue: els.aCompetitionCue.value.trim(),
    challenges: [els.aChallengeOne.value.trim(), els.aChallengeTwo.value.trim(), els.aChallengeThree.value.trim()].filter(Boolean),
    challengeOne: els.aChallengeOne.value.trim(),
    challengeTwo: els.aChallengeTwo.value.trim(),
    challengeThree: els.aChallengeThree.value.trim(),
    defaultTechniques: {
      leadLeg: els.aLeadLeg.value || "left",
      leftAttack: els.aLeftAttack.value.trim(),
      rightAttack: els.aRightAttack.value.trim(),
      preferredTies: els.aPreferredTies.value.trim(),
      miscNotes: els.aMiscNotes.value.trim()
    }
  };
}

els.athleteProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUid) {
    toast("Crea tu cuenta o inicia sesión primero.", "error");
    showStep("auth");
    return;
  }
  if (!els.aName.value.trim()) {
    showProfileSubtab("training");
    els.aName.focus();
    setStatus(els.profileStatus, "El nombre completo es requerido.", "error");
    return;
  }

  els.profileSubmitBtn.disabled = true;
  setStatus(els.profileStatus, "Guardando perfil...");

  try {
    const formData = readAthleteProfileForm();
    const now = new Date().toISOString();
    const payload = stripUndefinedDeep({
      ...formData,
      user_id: currentUid,
      email: currentEmail,
      status: existingProfile?.status || "verified",
      linkedAthleteId: existingProfile?.linkedAthleteId || slugifyKey(formData.name),
      linkedAthleteUid: currentUid,
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now
    });

    await db.collection(FIREBASE_USERS_COLLECTION).doc(currentUid).set(payload, { merge: true });
    logAuditEvent(existingProfile ? "profile_updated" : "profile_created", {
      targetName: payload.name,
      changedKeys: computeChangedKeys(existingProfile || {}, payload)
    });
    existingProfile = { ...(existingProfile || {}), ...payload };

    els.doneSummary.textContent = `El perfil de ${payload.name} se guardó correctamente. Tu coach podrá verlo en Wrestling Performance Lab.`;
    showStep("done");
    toast("Perfil guardado.", "ok");
  } catch (err) {
    console.error(err);
    const offline = String(err?.code || "").includes("unavailable");
    setStatus(
      els.profileStatus,
      offline
        ? "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo."
        : "No se pudo guardar el perfil. Intenta de nuevo.",
      "error"
    );
    toast("No se pudo guardar el perfil.", "error");
  } finally {
    els.profileSubmitBtn.disabled = false;
  }
});

// ---------- done step ----------

els.editAgainBtn.addEventListener("click", () => {
  showStep("profile");
  updateProfileProgress();
});

// ---------- change own password ----------

els.pwBtn?.addEventListener("click", async () => {
  const currentPassword = els.pwCurrent?.value || "";
  const newPassword = els.pwNew?.value || "";
  const confirmPassword = els.pwConfirm?.value || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    setStatus(els.pwStatus, "Completa los tres campos.", "error");
    return;
  }
  if (newPassword.length < 6) {
    setStatus(els.pwStatus, "La nueva contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    setStatus(els.pwStatus, "La nueva contraseña y su confirmación no coinciden.", "error");
    return;
  }
  if (newPassword === currentPassword) {
    setStatus(els.pwStatus, "La nueva contraseña debe ser diferente a la actual.", "error");
    return;
  }

  const user = auth.currentUser;
  if (!user || !user.email) {
    setStatus(els.pwStatus, "No hay sesión activa. Vuelve a iniciar sesión.", "error");
    return;
  }

  els.pwBtn.disabled = true;
  setStatus(els.pwStatus, "Actualizando contraseña...");
  try {
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
    els.pwCurrent.value = "";
    els.pwNew.value = "";
    els.pwConfirm.value = "";
    setStatus(els.pwStatus, "Contraseña actualizada correctamente.", "ok");
    toast("Contraseña actualizada.", "ok");
    logAuditEvent("password_changed", { targetName: existingProfile?.name || els.aName?.value || "" });
  } catch (err) {
    console.warn("Password change failed", err);
    const code = String(err?.code || "");
    let msg;
    if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
      msg = "La contraseña actual es incorrecta.";
    } else if (code === "auth/weak-password") {
      msg = "La nueva contraseña es demasiado débil.";
    } else if (code === "auth/requires-recent-login") {
      msg = "Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.";
    } else if (code === "auth/network-request-failed") {
      msg = "Sin conexión. Revisa tu internet e intenta de nuevo.";
    } else {
      msg = "No se pudo actualizar la contraseña.";
    }
    setStatus(els.pwStatus, msg, "error");
  } finally {
    els.pwBtn.disabled = false;
  }
});

// ---------- init ----------

setAuthMode("register");
showStep("auth");
