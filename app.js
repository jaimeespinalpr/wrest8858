// ==============================
// Wrestling Performance Lab
// Role-based views + training experience
// ==============================

// ---------- PROFILE / ONBOARDING ----------
const PROFILE_KEY = "wpl_profile";
const AUTH_USER_KEY = "wpl_auth_user";
const DEFAULT_LANG = "en";
const SUPPORTED_LANGS = new Set(["en", "es", "uz", "ru"]);
let currentLang = DEFAULT_LANG;
let langChangeLocked = false;
let profileTagState = new Set();

// ---------- STORAGE SYNC ----------
const STORAGE_PREFIX = "wpl_";
const STORAGE_API = "api/storage.php";
let storageSyncEnabled = true;
let storageHydrated = false;
let suppressStorageSync = false;
let storageSyncAttached = false;

const FIREBASE_USERS_COLLECTION = window.FIREBASE_USERS_COLLECTION || "users";
let firebaseAuthInstance = null;
let firebaseFirestoreInstance = null;

function initFirebaseClient() {
  if (typeof firebase === "undefined" || !window.FIREBASE_CONFIG) return null;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    const auth = firebase.auth();
    const firestore = firebase.firestore ? firebase.firestore() : null;
    return { auth, firestore };
  } catch (err) {
    console.warn("Firebase init failed:", err);
    return null;
  }
}

(function setupFirebase() {
  const client = initFirebaseClient();
  firebaseAuthInstance = client?.auth ?? null;
  firebaseFirestoreInstance = client?.firestore ?? null;
})();

function shouldSyncKey(key) {
  return typeof key === "string" && key.startsWith(STORAGE_PREFIX);
}

function syncStorageSet(key, value) {
  if (!storageSyncEnabled || !storageHydrated || suppressStorageSync || !shouldSyncKey(key)) return;
  fetch(STORAGE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value })
  }).catch(() => {});
}

function syncStorageDelete(key) {
  if (!storageSyncEnabled || !storageHydrated || suppressStorageSync || !shouldSyncKey(key)) return;
  fetch(STORAGE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", key })
  }).catch(() => {});
}

async function syncAllLocalToServer() {
  if (!storageSyncEnabled) return;
  const entries = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!shouldSyncKey(key)) continue;
    entries[key] = localStorage.getItem(key);
  }
  if (!Object.keys(entries).length) return;
  try {
    await fetch(STORAGE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries })
    });
  } catch {
    storageSyncEnabled = false;
  }
}

function attachStorageSync() {
  if (storageSyncAttached || typeof localStorage === "undefined") return;
  const rawSetItem = localStorage.setItem.bind(localStorage);
  const rawRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = (key, value) => {
    rawSetItem(key, value);
    syncStorageSet(key, value);
  };

  localStorage.removeItem = (key) => {
    rawRemoveItem(key);
    syncStorageDelete(key);
  };

  storageSyncAttached = true;
}

async function initServerStorage() {
  attachStorageSync();
  if (!storageSyncEnabled) {
    storageHydrated = true;
    return;
  }

  try {
    const res = await fetch(`${STORAGE_API}?all=1`, { cache: "no-store" });
    if (!res.ok) throw new Error("storage_fetch_failed");
    const payload = await res.json();
    const serverData = payload && payload.data && typeof payload.data === "object" ? payload.data : {};
    const hasServerData = Object.keys(serverData).length > 0;

    if (hasServerData) {
      suppressStorageSync = true;
      const serverKeys = new Set(Object.keys(serverData));
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (shouldSyncKey(key) && !serverKeys.has(key)) {
          localStorage.removeItem(key);
        }
      }
      Object.entries(serverData).forEach(([key, value]) => {
        if (shouldSyncKey(key)) {
          localStorage.setItem(key, value);
        }
      });
    } else {
      await syncAllLocalToServer();
    }
  } catch (err) {
    storageSyncEnabled = false;
    console.warn("Storage sync disabled:", err);
  } finally {
    suppressStorageSync = false;
    storageHydrated = true;
  }
}

const onboarding = document.getElementById("onboarding");
const appRoot = document.getElementById("appRoot");
const onboardingCard = document.querySelector(".onboarding-card");
const profileForm = document.getElementById("profileForm");
const loginForm = document.getElementById("loginForm");
const skipBtn = document.getElementById("skipBtn");
const doneProfileBtn = document.getElementById("doneProfileBtn");
const quickContinueBtn = document.getElementById("quickContinueBtn");
const quickSkipBtn = document.getElementById("quickSkipBtn");
const guestAthleteBtn = document.getElementById("guestAthleteBtn");
const guestCoachBtn = document.getElementById("guestCoachBtn");
const viewSwitchBtn = document.getElementById("viewSwitchBtn");
const viewMenu = document.getElementById("viewMenu");
const currentViewLabel = document.getElementById("currentViewLabel");
const headerMenu = document.getElementById("headerMenu");
const userMeta = document.getElementById("userMeta");
const roleMeta = document.getElementById("roleMeta");
const nowMeta = document.getElementById("nowMeta");
const editProfileBtn = document.getElementById("editProfileBtn");
const headerLang = document.getElementById("headerLang");
const headerFlag = document.getElementById("headerFlag");
const authChoice = document.getElementById("authChoice");
const loginOptionBtn = document.getElementById("loginOptionBtn");
const createOptionBtn = document.getElementById("createOptionBtn");
const authForms = document.getElementById("authForms");
const loginFormWrap = document.getElementById("loginFormWrap");
const profileFormWrap = document.getElementById("profileFormWrap");
const authBackBtn = document.getElementById("authBackBtn");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const AUTH_STRICT = false;
let headerMenuOpen = false;
let viewMenuOpen = false;
let currentView = "athlete";
const headerViewButtons = Array.from(document.querySelectorAll("#headerMenu button[data-action^='view-']"));

const VIEW_OPTIONS = ["athlete", "coach", "admin", "parent"];
const VIEW_LABELS = {
  athlete: {
    en: "Athlete view",
    es: "Vista atleta",
    uz: "Sportchi rejimi",
    ru: "Просмотр спортсмена"
  },
  coach: {
    en: "Coach view",
    es: "Vista entrenador",
    uz: "Murabbiy rejimi",
    ru: "Просмотр тренера"
  },
  admin: {
    en: "Administrative view",
    es: "Vista administrativa",
    uz: "Ma'muriy rejimi",
    ru: "Административный вид"
  },
  parent: {
    en: "Parent view",
    es: "Vista padres",
    uz: "Ota-ona rejimi",
    ru: "Родительский вид"
  }
};
const VIEW_META_TEXT = {
  athlete: {
    en: "Athlete View",
    es: "Vista atleta",
    uz: "Sportchi ko'rinishi",
    ru: "Вид спортсмена"
  },
  coach: {
    en: "Coach Dashboard",
    es: "Panel entrenador",
    uz: "Murabbiy paneli",
    ru: "Панель тренера"
  },
  admin: {
    en: "Administrative Desk",
    es: "Mesa administrativa",
    uz: "Ma'muriy stol",
    ru: "Административный стол"
  },
  parent: {
    en: "Parent View",
    es: "Vista padres",
    uz: "Ota-ona ko'rinishi",
    ru: "Вид родителя"
  }
};
const VIEW_ROLE_MAP = {
  athlete: "athlete",
  coach: "coach",
  admin: "coach",
  parent: "athlete"
};

function enforceStrictAuthUI() {
  if (!AUTH_STRICT) return;
  [skipBtn, quickSkipBtn].forEach((btn) => {
    if (!btn) return;
    btn.hidden = true;
    btn.disabled = true;
  });
}

function toggleHeaderMenu(forceState) {
  if (!headerMenu) return;
  if (typeof forceState === "boolean") {
    headerMenuOpen = forceState;
  } else {
    headerMenuOpen = !headerMenuOpen;
  }
  headerMenu.classList.toggle("hidden", !headerMenuOpen);
}

function closeHeaderMenu() {
  if (!headerMenuOpen) return;
  toggleHeaderMenu(false);
}

function handleHeaderMenuAction(action) {
  if (!action) return;
  closeHeaderMenu();
  if (action === "profile") {
    const role = getProfile()?.role || "athlete";
    showTab(role === "coach" ? "coach-profile" : "athlete-profile");
    return;
  }
  if (action === "logout") {
    firebaseAuthInstance?.signOut().catch(() => {});
    setProfile(null);
    setAuthUser(null);
    showOnboarding(null);
    showAuthChoice();
    setView("athlete");
    return;
  }
  if (action.startsWith("view-")) {
    const targetView = action.replace(/^view-/, "");
    setView(targetView);
    return;
  }
  if (action === "switch") {
    firebaseAuthInstance?.signOut().catch(() => {});
    setProfile(null);
    setAuthUser(null);
    showOnboarding(null);
    showAuthChoice();
    setView("athlete");
  }
}

function toggleViewMenu(forceState) {
  if (!viewMenu) return;
  if (typeof forceState === "boolean") {
    viewMenuOpen = forceState;
  } else {
    viewMenuOpen = !viewMenuOpen;
  }
  viewMenu.classList.toggle("hidden", !viewMenuOpen);
}

function closeViewMenu() {
  if (!viewMenuOpen) return;
  toggleViewMenu(false);
}

function updateViewMenuLabel(view) {
  if (!currentViewLabel) return;
  currentViewLabel.textContent = pickCopy(VIEW_LABELS[view]) || VIEW_LABELS.athlete.en;
  viewSwitchBtn?.setAttribute("aria-label", currentViewLabel.textContent);
}

function refreshHeaderViewButtons() {
  headerViewButtons.forEach((btn) => {
    const action = String(btn.dataset.action || "");
    if (!action.startsWith("view-")) return;
    const view = action.replace(/^view-/, "");
    btn.textContent = pickCopy(VIEW_LABELS[view]) || VIEW_LABELS[view]?.en || VIEW_LABELS.athlete.en;
  });
}

function setView(view) {
  const normalized = VIEW_OPTIONS.includes(view) ? view : "athlete";
  currentView = normalized;
  updateViewMenuLabel(normalized);
  const roleName = VIEW_ROLE_MAP[normalized] || "athlete";
  setRoleUI(roleName, normalized);
}

const pEmail = document.getElementById("pEmail");
const pPassword = document.getElementById("pPassword");
const pPasswordConfirm = document.getElementById("pPasswordConfirm");
const pName = document.getElementById("pName");
const pRole = document.getElementById("pRole");
const pLevel = document.getElementById("pLevel");
const pWeight = document.getElementById("pWeight");
const pCurrentWeight = document.getElementById("pCurrentWeight");
const pGoal = document.getElementById("pGoal");
const pLang = document.getElementById("pLang");
const pPhoto = document.getElementById("pPhoto");
const pCountry = document.getElementById("pCountry");
const pCity = document.getElementById("pCity");
const pSchoolClub = document.getElementById("pSchoolClub");
const pInstitution = document.getElementById("pInstitution");
const pStyle = document.getElementById("pStyle");
const pPosition = document.getElementById("pPosition");
const pStrategy = document.getElementById("pStrategy");
const pYears = document.getElementById("pYears");
const pNeutralOther = document.getElementById("pNeutralOther");
const pTopOther = document.getElementById("pTopOther");
const pBottomOther = document.getElementById("pBottomOther");
const pDefenseOther = document.getElementById("pDefenseOther");
const pInternational = document.getElementById("pInternational");
const pInternationalEvents = document.getElementById("pInternationalEvents");
const pInternationalYears = document.getElementById("pInternationalYears");
const pCoachCues = document.getElementById("pCoachCues");
const pCueNotes = document.getElementById("pCueNotes");
const pInjuryNotes = document.getElementById("pInjuryNotes");
const pPreferredMoves = document.getElementById("pPreferredMoves");
const pExperienceYears = document.getElementById("pExperienceYears");
const pStance = document.getElementById("pStance");
const pWeightClass = document.getElementById("pWeightClass");
const pNotes = document.getElementById("pNotes");
const athleteOnlySections = Array.from(document.querySelectorAll(".role-athlete"));
const athleteOnlyControls = Array.from(
  document.querySelectorAll(".role-athlete input, .role-athlete select, .role-athlete textarea")
);

athleteOnlyControls.forEach((control) => {
  if (control.required) control.dataset.wasRequired = "true";
});

function updateRoleSections(role) {
  if (!athleteOnlySections.length) return;
  const isAthlete = role !== "coach";
  athleteOnlySections.forEach((section) => section.classList.toggle("hidden", !isAthlete));
  athleteOnlyControls.forEach((control) => {
    control.disabled = !isAthlete;
    control.required = isAthlete && control.dataset.wasRequired === "true";
  });
}

const LANG_KEY = "wpl_lang_pref";
const LANG_RESET_KEY = "wpl_lang_reset_v1";

const ROLE_LABELS = {
  en: { athlete: "Athlete", coach: "Coach" },
  es: { athlete: "Atleta", coach: "Entrenador" },
  uz: { athlete: "Sportchi", coach: "Murabbiy" },
  ru: { athlete: "Спортсмен", coach: "Тренер" }
};

const LEVEL_LABELS = {
  en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
  es: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" },
  uz: { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Yuqori" },
  ru: { beginner: "Начальный", intermediate: "Средний", advanced: "Продвинутый" }
};

const INTENSITY_LABELS = {
  en: { Low: "Low", Medium: "Medium", High: "High" },
  es: { Low: "Baja", Medium: "Media", High: "Alta" },
  uz: { Low: "Past", Medium: "O'rta", High: "Yuqori" },
  ru: { Low: "Низкая", Medium: "Средняя", High: "Высокая" }
};

const LANGUAGE_CONFIRM = {
  es: "Cambiar toda la aplicacion a Espanol?",
  uz: "Butun ilovani O'zbek tiliga o'zgartirishga rozimisiz?",
  ru: "Перевести все приложение на русский язык?"
};

const GUEST_COPY = {
  athlete: {
    name: {
      en: "Guest",
      es: "Invitado",
      uz: "Mehmon",
      ru: "Гость"
    },
    goal: {
      en: "Get better every day",
      es: "Mejorar cada día",
      uz: "Har kuni yaxshilanish",
      ru: "Становитесь лучше каждый день"
    },
    routines: {
      en: "AM mat, PM film",
      es: "Mañana en tapiz, tarde film",
      uz: "Kunduz mat, kechki film",
      ru: "Утренний ковёр, вечерний фильм"
    },
    focus: {
      en: "Mat technique",
      es: "Técnica en el tapiz",
      uz: "Kurash texnikasi",
      ru: "Техника ковра"
    },
    volume: {
      en: "6 sessions / 10 hours weekly",
      es: "6 sesiones / 10 horas semanales",
      uz: "Haftada 6 mashgʻulot / 10 soat",
      ru: "6 тренировок / 10 часов в неделю"
    }
  },
  coach: {
    name: {
      en: "Coach Guest",
      es: "Coach Invitado",
      uz: "Murabbiy Mehmon",
      ru: "Приглашенный тренер"
    },
    goal: {
      en: "Plan training sessions and watch film",
      es: "Planifica sesiones y revisa film",
      uz: "Mashg'ulotlarni rejalashtiring va filmni tomosha qiling",
      ru: "Планируйте тренировки и смотрите видео"
    },
    routines: {
      en: "Review film, build sessions",
      es: "Revisar film, planear sesiones",
      uz: "Filmni ko'rib chiqish, mashg'ulotlar tuzish",
      ru: "Просмотр видео, планирование сессий"
    },
    focus: {
      en: "Team planning & match prep",
      es: "Planificación y preparación",
      uz: "Jamoa rejasi va bellashuv tayyorgarligi",
      ru: "Планирование команды и подготовка к поединку"
    },
    volume: {
      en: "Design 6 sessions per week",
      es: "Diseña 6 sesiones por semana",
      uz: "Haftada 6 mashg'ulotni tuzing",
      ru: "Составьте 6 тренировок в неделю"
    },
    tactics: {
      en: "Control the mat, pressure transitions",
      es: "Controla el tapiz y transiciones",
      uz: "Kovrdan nazorat, o'tishlarda bosim",
      ru: "Контролируйте ковер, давите в переходах"
    }
  }
};

function resolveLang(lang) {
  return SUPPORTED_LANGS.has(lang) ? lang : DEFAULT_LANG;
}

function getPreferredLang() {
  const authUser = getAuthUser?.();
  const stored = localStorage.getItem(LANG_KEY);
  if (!authUser) {
    const resetDone = localStorage.getItem(LANG_RESET_KEY) === "1";
    if (!resetDone && stored && stored !== DEFAULT_LANG) {
      localStorage.setItem(LANG_KEY, DEFAULT_LANG);
      localStorage.setItem(LANG_RESET_KEY, "1");
      return DEFAULT_LANG;
    }
  }
  const profileLang = getProfile()?.lang;
  if (profileLang && SUPPORTED_LANGS.has(profileLang)) return profileLang;
  return stored && SUPPORTED_LANGS.has(stored) ? stored : DEFAULT_LANG;
}

function getRoleLabel(role, lang = currentLang) {
  const table = ROLE_LABELS[resolveLang(lang)] || ROLE_LABELS.en;
  return table[role] || table.athlete;
}

function getLevelLabel(level, lang = currentLang) {
  if (!level) return "";
  const key = String(level).toLowerCase();
  const table = LEVEL_LABELS[resolveLang(lang)] || LEVEL_LABELS.en;
  return table[key] || level;
}

function getIntensityLabel(intensity, lang = currentLang) {
  const table = INTENSITY_LABELS[resolveLang(lang)] || INTENSITY_LABELS.en;
  return table[intensity] || intensity;
}

function renderUserMeta(profile) {
  if (!profile) {
    userMeta.textContent = currentLang === "es" ? "Vista atleta" : "Athlete View";
    roleMeta.textContent =
      currentLang === "es" ? "Enfoque: Tecnica en el tapiz" : "Training Focus: Mat Technique";
    return;
  }
  const name = profile.name || (currentLang === "es" ? "Usuario" : "User");
  const role = profile.role || "athlete";
  const team = profile.team ? ` - ${profile.team}` : "";
  const levelValue = getLevelLabel(profile.level, currentLang);
  const level = levelValue ? ` - ${levelValue}` : "";
  userMeta.textContent = `${name} - ${getRoleLabel(role, currentLang)}${level}${team}`;
}

let clockStarted = false;
let lastClockDayKey = toDateKey(new Date());

function formatNowLabel(date) {
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  const datePart = date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit"
  });
  const label = currentLang === "es" ? "Hoy" : "Today";
  return `${label}: ${datePart} - ${timePart}`;
}

function refreshNowMeta() {
  const now = new Date();
  if (nowMeta) {
    nowMeta.textContent = formatNowLabel(now);
  }

  const dayKey = toDateKey(now);
  if (dayKey === lastClockDayKey) return;
  lastClockDayKey = dayKey;

  renderToday(now.getDay());
  renderPlanGrid(now.getDay());
  renderCalendar(dayKey);
  if (getProfile()?.role === "coach") {
    renderCalendarManager();
  }
}

function startClock() {
  if (clockStarted) return;
  refreshNowMeta();
  const msToNextMinute = 60000 - (Date.now() % 60000);
  setTimeout(() => {
    refreshNowMeta();
    setInterval(refreshNowMeta, 60000);
  }, msToNextMinute);
  clockStarted = true;
}

function refreshLanguageUI() {
  const profile = getProfile();
  renderUserMeta(profile);
  const activeRole = profile?.role || "athlete";
  updateViewMenuLabel(currentView);
  refreshHeaderViewButtons();
  refreshNowMeta();
  enforceStrictAuthUI();
  applyStaticTranslations();
  if (profile?.role === "athlete") {
    fillAthleteProfileForm(profile);
    renderCompetitionPreview(profile);
  }
  const role = (profile || {}).role || "athlete";
  updateRoleSections(role);
  renderToday();
  renderFeelingScale();
  renderPlanGrid();
  renderCalendar();
  renderCalendarManager();
  renderMedia();
  renderAnnouncements();
  renderDashboard();
  renderCoachProfile();
  renderAthleteManagement();
  renderJournalMonitor();
  renderPermissions();
  renderMessages();
  renderSkills();
  if (typeof coachMatchSelect !== "undefined" && coachMatchSelect && coachMatchSelect.value) {
    renderCoachMatchView(coachMatchSelect.value);
  }
  initializePlanSelectors();
}

function setLanguage(lang, { source = "system", skipConfirm = false, refresh = true } = {}) {
  const nextLang = resolveLang(lang);
  if (nextLang === currentLang && !skipConfirm) {
    setHeaderLang(nextLang);
    return true;
  }

  if (!skipConfirm && source === "header" && nextLang !== "en" && nextLang !== currentLang) {
    const confirmMsg = LANGUAGE_CONFIRM[nextLang] || LANGUAGE_CONFIRM.es;
    if (!window.confirm(confirmMsg)) {
      langChangeLocked = true;
      setHeaderLang(currentLang);
      langChangeLocked = false;
      return false;
    }
  }

  currentLang = nextLang;
  document.documentElement.lang = nextLang;
  localStorage.setItem(LANG_KEY, nextLang);
  setHeaderLang(nextLang);

  const profile = getProfile();
  if (profile) {
    profile.lang = nextLang;
    setProfile(profile);
  }

  if (refresh) refreshLanguageUI();
  return true;
}

function parseStoredJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAuthUser() {
  const auth = parseStoredJson(AUTH_USER_KEY);
  if (!auth || typeof auth !== "object") return null;
  const id = auth.id ? String(auth.id).trim() : "";
  if (!id) return null;
  return {
    id,
    email: String(auth.email || ""),
    role: auth.role === "coach" ? "coach" : "athlete"
  };
}

function setAuthUser(authUser) {
  if (!authUser) {
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  const payload = {
    id: String(authUser.id || ""),
    email: String(authUser.email || ""),
    role: authUser.role === "coach" ? "coach" : "athlete"
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
}

function profileStorageKey(userId) {
  const id = userId ? String(userId) : "";
  if (!id) return PROFILE_KEY;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `wpl_profile_user_${safeId}`;
}

function normalizeProfileForAuth(profile, authUser) {
  const base = profile && typeof profile === "object" ? { ...profile } : {};
  if (authUser?.id) base.user_id = authUser.id;
  if (authUser?.email) base.email = authUser.email;
  if (authUser?.role) base.role = authUser.role;
  if (!base.lang) {
    const storedLang = localStorage.getItem(LANG_KEY);
    base.lang = storedLang && SUPPORTED_LANGS.has(storedLang) ? storedLang : DEFAULT_LANG;
  }
  return base;
}

function getProfile() {
  const authUser = getAuthUser();
  if (authUser?.id) {
    const userProfile = parseStoredJson(profileStorageKey(authUser.id));
    if (userProfile) {
      return normalizeProfileForAuth(userProfile, authUser);
    }
  }
  const fallback = parseStoredJson(PROFILE_KEY);
  return fallback ? normalizeProfileForAuth(fallback, authUser) : null;
}

function setProfile(profile) {
  const authUser = getAuthUser();
  const normalized = normalizeProfileForAuth(profile, authUser);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  if (authUser?.id) {
    localStorage.setItem(profileStorageKey(authUser.id), JSON.stringify(normalized));
  }
}

async function applyProfile(profile) {
  if (!profile) {
    setLanguage(getPreferredLang(), { skipConfirm: true, refresh: false });
    setView("athlete");
    refreshLanguageUI();
    return;
  }

  const view = profile.view || (profile.role === "coach" ? "coach" : "athlete");
  setLanguage(profile.lang || getPreferredLang(), { skipConfirm: true, refresh: false });
  setView(view);
  if (view === "coach") {
    await loadSavedPdfTemplate();
  }
  refreshLanguageUI();
}

const LANG_FLAGS = {
  en: "🇺🇸",
  es: "🇵🇷",
  uz: "🇺🇿",
  ru: "🇷🇺"
};

function setHeaderLang(lang) {
  if (!headerLang || !headerFlag) return;
  const nextLang = resolveLang(lang);
  headerLang.value = nextLang;
  headerFlag.textContent = LANG_FLAGS[nextLang] || LANG_FLAGS.en;
}

const AUTH_TEXT = {
  en: {
    createTab: "Create",
    loginTab: "Log In",
    createTitle: "Create your profile",
    createSubtitle: "This takes 30 seconds. You can edit it later.",
    loginTitle: "Log in",
    loginSubtitle: "Use your email to continue.",
    welcomeTitle: "Welcome",
    welcomeSubtitle: "Log in or create your account to continue.",
    welcomeCardTitle: "Welcome to Wrestling Performance Lab",
    welcomeCardSubtitle: "Choose how you want to continue.",
    createAccount: "Create account",
    logIn: "Log in",
    welcomeFootnote: "Your info is stored in the app database."
  },
  es: {
    createTab: "Crear",
    loginTab: "Entrar",
    createTitle: "Crea tu perfil",
    createSubtitle: "Esto toma 30 segundos. Puedes editarlo luego.",
    loginTitle: "Iniciar sesion",
    loginSubtitle: "Usa tu correo para continuar.",
    welcomeTitle: "Bienvenido",
    welcomeSubtitle: "Inicia sesion o crea tu cuenta para continuar.",
    welcomeCardTitle: "Bienvenido a Wrestling Performance Lab",
    welcomeCardSubtitle: "Elige como quieres continuar.",
    createAccount: "Crear cuenta",
    logIn: "Iniciar sesion",
    welcomeFootnote: "Tu informacion se guarda en la base de datos."
  }
};

function authText(key) {
  const table = AUTH_TEXT[resolveLang(currentLang)] || AUTH_TEXT.en;
  return table[key] || AUTH_TEXT.en[key] || "";
}

let activeAuthMode = null;

function updateAuthHeading(titleKey, subtitleKey) {
  if (authTitle) authTitle.textContent = authText(titleKey);
  if (authSubtitle) authSubtitle.textContent = authText(subtitleKey);
}

function showAuthChoice() {
  activeAuthMode = null;
  authChoice?.classList.remove("hidden");
  authForms?.classList.add("hidden");
  loginFormWrap?.classList.add("hidden");
  profileFormWrap?.classList.add("hidden");
  authBackBtn?.classList.add("hidden");
  updateAuthHeading("welcomeTitle", "welcomeSubtitle");
}

function showAuthForm(mode) {
  activeAuthMode = mode;
  authChoice?.classList.add("hidden");
  authForms?.classList.remove("hidden");
  authBackBtn?.classList.remove("hidden");
  if (mode === "login") {
    loginFormWrap?.classList.remove("hidden");
    profileFormWrap?.classList.add("hidden");
    updateAuthHeading("loginTitle", "loginSubtitle");
  } else {
    loginFormWrap?.classList.add("hidden");
    profileFormWrap?.classList.remove("hidden");
    updateAuthHeading("createTitle", "createSubtitle");
  }
}

function showOnboarding(prefillProfile = null) {
  onboarding.classList.remove("hidden");
  appRoot.classList.add("blurred", "hidden");
}

function hideOnboarding() {
  onboarding.classList.add("hidden");
  appRoot.classList.remove("blurred");
  appRoot.classList.remove("hidden");
}

async function bootProfile() {
  showOnboarding(null);
  showAuthChoice();
}

const HEADER_COPY = {
  en: "Wrestling Performance Lab",
  es: "Laboratorio de Rendimiento de Lucha",
  uz: "Kurash Performans Laboratoriyasi",
  ru: "Лаборатория производительности борьбы"
};

const LANG_NAME_COPY = {
  en: { en: "English", es: "Spanish", uz: "Uzbek", ru: "Russian" },
  es: { en: "Ingles", es: "Espanol", uz: "Uzbeko", ru: "Ruso" },
  uz: { en: "Inglizcha", es: "Ispancha", uz: "O'zbekcha", ru: "Ruscha" },
  ru: { en: "Английский", es: "Испанский", uz: "Узбекский", ru: "Русский" }
};

const QUICK_HELP_COPY = {
  en: "Only name and main goal are required.",
  es: "Solo el nombre y la meta principal son obligatorios.",
  uz: "Faqat ism va asosiy maqsad majburiy.",
  ru: "Требуются только имя и основная цель."
};

const PROFILE_FOOTNOTE_COPY = {
  en: "Your profile is stored in the app database.",
  es: "Tu perfil se guarda en la base de datos de la app.",
  uz: "Profilingiz ilovaning bazasida saqlanadi.",
  ru: "Ваш профиль хранится в базе приложения."
};

const LOGIN_FOOTNOTE_COPY = {
  en: "Use a registered email and password to log in.",
  es: "Usa un correo y contrasena registrados para entrar.",
  uz: "Kirish uchun ro'yxatdan o'tgan elektron pochta va paroldan foydalaning.",
  ru: "Используйте зарегистрированный email и пароль для входа."
};

const FIELD_COPY = {
  pName: {
    label: { en: "Full name", es: "Nombre completo" },
    placeholder: { en: "e.g., Jaime Espinal", es: "ej., Jaime Espinal" }
  },
  pRole: { label: { en: "Role", es: "Rol" } },
  pPhoto: {
    label: { en: "Profile photo (optional)", es: "Foto de perfil (opcional)" },
    placeholder: { en: "Add a photo URL", es: "Agrega una URL de foto" }
  },
  pCountry: {
    label: { en: "Country (optional)", es: "Pais (opcional)" },
    placeholder: { en: "e.g., United States", es: "ej., Estados Unidos" }
  },
  pCity: {
    label: { en: "City/State (optional)", es: "Ciudad/Estado (opcional)" },
    placeholder: { en: "e.g., Lincoln, NE", es: "ej., Lincoln, NE" }
  },
  pSchoolClub: { label: { en: "School or club?", es: "Escuela o club?" } },
  pInstitution: {
    label: { en: "School, club or institution", es: "Nombre de escuela, club o institucion" },
    placeholder: { en: "e.g., Lincoln West / Midwest Grapplers", es: "ej., Lincoln West / Midwest Grapplers" }
  },
  pLevel: { label: { en: "Level", es: "Nivel" } },
  pStyle: { label: { en: "Primary wrestling style", es: "Estilo principal de lucha" } },
  pPosition: { label: { en: "Preferred position", es: "Posicion preferida" } },
  pStrategy: { label: { en: "Match strategy preference", es: "Estrategia preferida" } },
  pYears: {
    label: { en: "Years of experience", es: "Anos de experiencia" },
    placeholder: { en: "e.g., 4", es: "ej., 4" }
  },
  pWeight: {
    label: { en: "Weight class (optional)", es: "Categoria de peso (opcional)" },
    placeholder: { en: "e.g., 157 / 72kg", es: "ej., 157 / 72kg" }
  },
  pCurrentWeight: {
    label: { en: "Current weight (optional)", es: "Peso actual (opcional)" },
    placeholder: { en: "e.g., 157 lb", es: "ej., 157 lb" }
  },
  pLang: { label: { en: "Language", es: "Idioma" } },
  pGoal: {
    label: { en: "Main goal", es: "Meta principal" },
    placeholder: { en: "e.g., Improve bottom escapes / get in shape", es: "ej., Mejorar escapes / estar en forma" }
  },
  pNeutralOther: {
    placeholder: { en: "Other (optional)", es: "Otro (opcional)" }
  },
  pTopOther: {
    placeholder: { en: "Other (optional)", es: "Otro (opcional)" }
  },
  pBottomOther: {
    placeholder: { en: "Other (optional)", es: "Otro (opcional)" }
  },
  pDefenseOther: {
    placeholder: { en: "Other (optional)", es: "Otro (opcional)" }
  },
  pInternational: { label: { en: "International competition?", es: "Competencia internacional?" } },
  pInternationalEvents: {
    label: { en: "Countries / events (optional)", es: "Paises / eventos (opcional)" },
    placeholder: { en: "e.g., Pan-Am, Canada Open", es: "ej., Pan-Am, Canada Open" }
  },
  pInternationalYears: {
    label: { en: "Years (optional)", es: "Anos (opcional)" },
    placeholder: { en: "e.g., 2 years", es: "ej., 2 anos" }
  },
  pCoachCues: { label: { en: "Coach cue preference", es: "Preferencia de indicaciones" } },
  pCueNotes: {
    label: { en: "What helps you most? (optional)", es: "Que te ayuda mas? (opcional)" },
    placeholder: { en: "e.g., Simple reminders between periods", es: "ej., Recordatorios simples" }
  },
  pInjuryNotes: {
    label: { en: "Injuries or limitations (optional)", es: "Lesiones o limitaciones (opcional)" },
    placeholder: { en: "e.g., Left shoulder caution", es: "ej., Cuidar hombro izquierdo" }
  },
  loginEmail: {
    label: { en: "Email", es: "Correo" },
    placeholder: { en: "you@email.com", es: "tu@correo.com" }
  },
  loginPassword: {
    label: { en: "Password", es: "Contrasena" },
    placeholder: { en: "••••••••", es: "••••••••" }
  },
  aName: { label: { en: "Full name", es: "Nombre completo" } },
  aPhoto: {
    label: { en: "Profile photo (optional)", es: "Foto de perfil (opcional)" },
    placeholder: { en: "Add a photo URL", es: "Agrega una URL de foto" }
  },
  aCountry: { label: { en: "Country (optional)", es: "Pais (opcional)" } },
  aCity: { label: { en: "City/State (optional)", es: "Ciudad/Estado (opcional)" } },
  aSchoolClub: { label: { en: "School or club?", es: "Escuela o club?" } },
  aSchool: { label: { en: "School name (optional)", es: "Nombre de escuela (opcional)" } },
  aClub: { label: { en: "Club name (optional)", es: "Nombre de club (opcional)" } },
  aTrainingRoutines: {
    label: { en: "Training routines", es: "Rutinas de entrenamiento" },
    placeholder: { en: "e.g., AM lift, PM mat, recovery", es: "ej., Pesas AM, lucha PM, recuperacion" }
  },
  aTrainingVolume: {
    label: { en: "Weekly volume", es: "Volumen semanal" },
    placeholder: { en: "e.g., 6 sessions, 10 hours", es: "ej., 6 sesiones, 10 horas" }
  },
  aTrainingFocus: {
    label: { en: "Technique worked most", es: "Tecnica mas trabajada" },
    placeholder: { en: "e.g., Single leg finish chain", es: "ej., Cadena de finalizacion de pierna simple" }
  },
  aStyle: { label: { en: "Primary wrestling style", es: "Estilo principal de lucha" } },
  aWeight: {
    label: { en: "Current weight", es: "Peso actual" },
    placeholder: { en: "e.g., 157 lb", es: "ej., 157 lb" }
  },
  aWeightClass: {
    label: { en: "Weight class", es: "Categoria de peso" },
    placeholder: { en: "e.g., 157", es: "ej., 157" }
  },
  aYears: { label: { en: "Years of experience", es: "Anos de experiencia" } },
  aLevel: { label: { en: "Experience level", es: "Nivel de experiencia" } },
  aPosition: { label: { en: "Preferred position", es: "Posicion preferida" } },
  aStrategy: { label: { en: "Match strategy preference", es: "Estrategia preferida" } },
  aStrategyA: {
    label: { en: "Strategy A", es: "Estrategia A" },
    placeholder: { en: "Primary scoring plan", es: "Plan principal para puntuar" }
  },
  aStrategyB: {
    label: { en: "Strategy B", es: "Estrategia B" },
    placeholder: { en: "Adjustment if plan A stalls", es: "Ajuste si el plan A se estanca" }
  },
  aStrategyC: {
    label: { en: "Strategy C", es: "Estrategia C" },
    placeholder: { en: "Emergency plan / late match", es: "Plan de emergencia / final del combate" }
  },
  aSafeMoves: {
    label: { en: "Safe moves", es: "Movimientos seguros" },
    placeholder: { en: "Moves you can trust under pressure", es: "Movimientos confiables bajo presion" }
  },
  aRiskyMoves: {
    label: { en: "Risky moves", es: "Movimientos arriesgados" },
    placeholder: { en: "High reward but high risk", es: "Alta recompensa pero alto riesgo" }
  },
  aResultsHistory: {
    label: { en: "Recent results / key notes", es: "Resultados recientes / notas clave" },
    placeholder: { en: "e.g., 3-1 at State. Lost to lefty single leg.", es: "ej., 3-1 en estatal. Perdio con pierna simple zurda." }
  },
  aInternational: { label: { en: "International competition?", es: "Competencia internacional?" } },
  aInternationalEvents: {
    label: { en: "Countries / events (optional)", es: "Paises / eventos (opcional)" },
    placeholder: { en: "e.g., Pan-Am, Canada Open", es: "ej., Pan-Am, Canada Open" }
  },
  aInternationalYears: {
    label: { en: "Years (optional)", es: "Anos (opcional)" },
    placeholder: { en: "e.g., 2 years", es: "ej., 2 anos" }
  },
  aCoachCues: { label: { en: "Coach cue preference", es: "Preferencia de indicaciones" } },
  aCueNotes: {
    label: { en: "What helps you most? (optional)", es: "Que te ayuda mas? (opcional)" },
    placeholder: { en: "e.g., Simple reminders between periods", es: "ej., Recordatorios simples" }
  },
  aInjuryNotes: {
    label: { en: "Injuries or limitations (optional)", es: "Lesiones o limitaciones (opcional)" },
    placeholder: { en: "e.g., Left shoulder caution", es: "ej., Cuidar hombro izquierdo" }
  },
  aFavoritePosition: { label: { en: "Favorite competition position", es: "Posicion favorita en competencia" } },
  aPsychTendency: { label: { en: "Psychological tendency", es: "Tendencia psicologica" } },
  aPressureError: {
    label: { en: "Common error under pressure", es: "Error comun bajo presion" },
    placeholder: { en: "e.g., Reaching on ties", es: "ej., Alcanzar en los amarres" }
  },
  aCoachSignal: {
    label: { en: "Coach key signal", es: "Senal clave del coach" },
    placeholder: { en: "If X happens -> do Y", es: "Si pasa X -> haz Y" }
  },
  aArchetype: { label: { en: "Archetype", es: "Arquetipo" } },
  aBodyType: { label: { en: "Body type", es: "Tipo de cuerpo" } }
};

const SELECT_COPY = {
  headerLang: {
    en: { en: "English", es: "Spanish", uz: "Uzbek", ru: "Russian" },
    es: { en: "Ingles", es: "Espanol", uz: "Uzbeko", ru: "Ruso" },
    uz: { en: "Inglizcha", es: "Ispancha", uz: "O'zbekcha", ru: "Ruscha" },
    ru: { en: "Английский", es: "Испанский", uz: "Узбекский", ru: "Русский" }
  },
  pRole: {
    en: { athlete: "Athlete", coach: "Coach" },
    es: { athlete: "Atleta", coach: "Entrenador" }
  },
  pSchoolClub: {
    en: { no: "No", yes: "Yes" },
    es: { no: "No", yes: "Si" }
  },
  aSchoolClub: {
    en: { no: "No", yes: "Yes" },
    es: { no: "No", yes: "Si" }
  },
  pLevel: {
    en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    es: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" }
  },
  aLevel: {
    en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    es: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" }
  },
  pStyle: {
    en: { freestyle: "Freestyle", "greco-roman": "Greco-Roman", folkstyle: "Folkstyle" },
    es: { freestyle: "Estilo libre", "greco-roman": "Greco-Romana", folkstyle: "Folkstyle" }
  },
  aStyle: {
    en: { freestyle: "Freestyle", "greco-roman": "Greco-Roman", folkstyle: "Folkstyle" },
    es: { freestyle: "Estilo libre", "greco-roman": "Greco-Romana", folkstyle: "Folkstyle" }
  },
  pPosition: {
    en: { neutral: "Neutral", top: "Top", bottom: "Bottom" },
    es: { neutral: "Neutral", top: "Arriba", bottom: "Abajo" }
  },
  aPosition: {
    en: { neutral: "Neutral", top: "Top", bottom: "Bottom" },
    es: { neutral: "Neutral", top: "Arriba", bottom: "Abajo" }
  },
  pStrategy: {
    en: { balanced: "Balanced", offensive: "Offensive", defensive: "Defensive", counter: "Counter-based" },
    es: { balanced: "Balanceado", offensive: "Ofensivo", defensive: "Defensivo", counter: "Contraataque" }
  },
  aStrategy: {
    en: { balanced: "Balanced", offensive: "Offensive", defensive: "Defensive", counter: "Counter-based" },
    es: { balanced: "Balanceado", offensive: "Ofensivo", defensive: "Defensivo", counter: "Contraataque" }
  },
  aFavoritePosition: {
    en: { neutral: "Neutral", top: "Top", bottom: "Bottom" },
    es: { neutral: "Neutral", top: "Arriba", bottom: "Abajo" }
  },
  aPsychTendency: {
    en: { aggressive: "Aggressive", conservative: "Conservative", counterattack: "Counterattack" },
    es: { aggressive: "Agresivo", conservative: "Conservador", counterattack: "Contraataque" }
  },
  pInternational: {
    en: { no: "No", yes: "Yes" },
    es: { no: "No", yes: "Si" }
  },
  aInternational: {
    en: { no: "No", yes: "Yes" },
    es: { no: "No", yes: "Si" }
  },
  pCoachCues: {
    en: {
      short: "Short cues only",
      calm: "Stay calm tone",
      energy: "High energy cues",
      specific: "Specific instruction only"
    },
    es: {
      short: "Solo indicaciones cortas",
      calm: "Tono calmado",
      energy: "Indicaciones con energia",
      specific: "Solo instrucciones especificas"
    }
  },
  aCoachCues: {
    en: {
      short: "Short cues only",
      calm: "Stay calm tone",
      energy: "High energy cues",
      specific: "Specific instruction only"
    },
    es: {
      short: "Solo indicaciones cortas",
      calm: "Tono calmado",
      energy: "Indicaciones con energia",
      specific: "Solo instrucciones especificas"
    }
  },
  onePagerCues: {
    en: {
      short: "Short cues only",
      calm: "Stay calm tone",
      energy: "High energy push",
      specific: "Specific instruction only"
    },
    es: {
      short: "Solo indicaciones cortas",
      calm: "Tono calmado",
      energy: "Impulso con energia",
      specific: "Solo instrucciones especificas"
    }
  },
  aArchetype: {
    en: {
      "": "Select archetype",
      technician: "Technician",
      scrambler: "Scrambler",
      pummler: "Pummeler",
      "counter-wrestler": "Counter-wrestler",
      "chain-wrestler": "Chain-wrestler"
    },
    es: {
      "": "Selecciona arquetipo",
      technician: "Técnico",
      scrambler: "Scrambler",
      pummler: "Pummeler",
      "counter-wrestler": "Contraatacante",
      "chain-wrestler": "Cadena"
    }
  },
  aBodyType: {
    en: {
      "": "Select body type",
      compact: "Compact/Powerful",
      long: "Long/Lanky",
      balanced: "Balanced/Athletic"
    },
    es: {
      "": "Selecciona tipo de cuerpo",
      compact: "Compacto/potente",
      long: "Largo/atlético",
      balanced: "Equilibrado/atlético"
    }
  }
};

const TECHNIQUE_LABELS = {
  "Single Leg": { en: "Single Leg", es: "Pierna simple" },
  "Double Leg": { en: "Double Leg", es: "Doble pierna" },
  "High Crotch": { en: "High Crotch", es: "High crotch" },
  "Snap Down": { en: "Snap Down", es: "Snap down" },
  "Body Lock": { en: "Body Lock", es: "Body lock" },
  "Arm Throw": { en: "Arm Throw", es: "Proyeccion de brazo" },
  "Ankle Pick": { en: "Ankle Pick", es: "Ankle pick" },
  "Half Nelson": { en: "Half Nelson", es: "Medio nelson" },
  Breakdown: { en: "Breakdown", es: "Breakdown" },
  Tilt: { en: "Tilt", es: "Giro" },
  "Stand-Up": { en: "Stand-Up", es: "Pararse" },
  Switch: { en: "Switch", es: "Switch" },
  "Sit-Out": { en: "Sit-Out", es: "Sit-out" },
  Sprawl: { en: "Sprawl", es: "Sprawl" },
  Whizzer: { en: "Whizzer", es: "Whizzer" },
  "Hand Fighting": { en: "Hand Fighting", es: "Pelea de manos" }
};

const TAB_COPY = {
  today: {
    en: "Today",
    es: "Hoy",
    uz: "Bugun",
    ru: "Сегодня"
  },
  "athlete-profile": {
    en: "Profile",
    es: "Perfil",
    uz: "Profil",
    ru: "Профиль"
  },
  training: {
    en: "Training Plan",
    es: "Plan de entrenamiento",
    uz: "Trening rejasi",
    ru: "План тренировок"
  },
  calendar: {
    en: "Calendar",
    es: "Calendario",
    uz: "Taqvim",
    ru: "Календарь"
  },
  media: {
    en: "Media",
    es: "Multimedia",
    uz: "Media",
    ru: "Медиа"
  },
  journal: {
    en: "Journal",
    es: "Diario",
    uz: "Kundalik",
    ru: "Дневник"
  },
  favorites: {
    en: "Favorites",
    es: "Favoritos",
    uz: "Sevimlilar",
    ru: "Избранное"
  },
  announcements: {
    en: "Announcements",
    es: "Avisos",
    uz: "E'lonlar",
    ru: "Объявления"
  },
  dashboard: {
    en: "Dashboard",
    es: "Panel",
    uz: "Panel",
    ru: "Панель"
  },
  "coach-profile": {
    en: "Coach Profile",
    es: "Perfil entrenador",
    uz: "Murabbiy profili",
    ru: "Профиль тренера"
  },
  athletes: {
    en: "Athletes",
    es: "Atletas",
    uz: "Sportchilar",
    ru: "Спортсмены"
  },
  "coach-match": {
    en: "Athlete Summary",
    es: "Resumen atleta",
    uz: "Sportchi xulosasi",
    ru: "Сводка спортсмена"
  },
  plans: {
    en: "Create Plans",
    es: "Crear planes",
    uz: "Rejalar yaratish",
    ru: "Создать планы"
  },
  "calendar-manager": {
    en: "Calendar Manager",
    es: "Gestion calendario",
    uz: "Taqvim boshqaruvi",
    ru: "Управление календарём"
  },
  "media-library": {
    en: "Media Library",
    es: "Biblioteca",
    uz: "Media kutubxonasi",
    ru: "Медиатека"
  },
  "athlete-notes": {
    en: "Athlete Notes",
    es: "Notas atletas",
    uz: "Sportchi eslatmalari",
    ru: "Заметки спортсмена"
  },
  skills: {
    en: "Skills Tracker",
    es: "Tecnicas",
    uz: "Ko'nikmalar kuzatuvchisi",
    ru: "Трекер навыков"
  },
  "journal-monitor": {
    en: "Journal Monitor",
    es: "Monitor diario",
    uz: "Kundalik kuzatuvi",
    ru: "Монитор дневника"
  },
  messages: {
    en: "Messages",
    es: "Mensajes",
    uz: "Xabarlar",
    ru: "Сообщения"
  },
  permissions: {
    en: "Permissions",
    es: "Permisos",
    uz: "Ruxsatlar",
    ru: "Разрешения"
  }
};

const PLAN_RANGE_COPY = {
  heading: {
    en: "Plan range",
    es: "Rango del plan",
    uz: "Reja oralig'i",
    ru: "Диапазон плана"
  },
  start: {
    en: "Start",
    es: "Inicio",
    uz: "Boshlanish",
    ru: "Начало"
  },
  end: {
    en: "End",
    es: "Fin",
    uz: "Tugash",
    ru: "Конец"
  }
};

const PLAN_RANGE_HINT = {
  day: {
    en: "Select a single day on the calendar to lock this plan.",
    es: "Selecciona un solo día en el calendario para fijar el plan."
  },
  week: {
    en: "Pick start and end dates to capture the week span.",
    es: "Elige fecha de inicio y fin para cubrir la semana."
  },
  month: {
    en: "Choose a start and end date that span the month.",
    es: "Selecciona fechas de inicio y fin que cubran el mes."
  },
  season: {
    en: "Enter the season window by selecting start and end dates.",
    es: "Define la ventana de temporada con fechas de inicio y fin."
  }
};

const PROFILE_SUBTAB_COPY = {
  training: {
    en: "Training",
    es: "Entrenamiento",
    uz: "Trening",
    ru: "Тренировка"
  },
  competition: {
    en: "Competition",
    es: "Competencia",
    uz: "Musobaqa",
    ru: "Соревнования"
  },
  coaching: {
    en: "Coaching Quick",
    es: "Coaching rapido",
    uz: "Murabbiylik tezkor",
    ru: "Быстрая коуч-сессия"
  }
};

const PROFILE_SECTION_COPY = {
  aStrategyPlansHeading: {
    en: "Strategy A / B / C",
    es: "Estrategia A / B / C",
    uz: "A / B / C strategiyasi",
    ru: "Стратегия A / B / C"
  },
  aStrategyPlansHint: {
    en: "Have a primary plan plus two adjustments.",
    es: "Ten un plan principal y dos ajustes.",
    uz: "Asosiy rejani va ikkita sozlamani belgilang.",
    ru: "Имейте основной план и две корректировки."
  },
  aRiskHeading: {
    en: "Safe vs Risky Moves",
    es: "Movimientos seguros vs arriesgados",
    uz: "Xavfsiz vs xavfli harakatlar",
    ru: "Безопасные vs рискованные приемы"
  },
  aResultsHeading: {
    en: "Results History",
    es: "Historial de resultados",
    uz: "Natijalar tarixi",
    ru: "История результатов"
  },
  aTagsHeading: {
    en: "Smart Tags",
    es: "Tags inteligentes",
    uz: "Aqlli teglar",
    ru: "Умные метки"
  },
  aTagsHint: {
    en: "Coaches can filter athletes by these tags.",
    es: "Los coaches pueden filtrar atletas por estos tags.",
    uz: "Murabbiylar bu teglar orqali sportchilarni saralashi mumkin.",
    ru: "Тренеры могут фильтровать спортсменов по этим меткам."
  },
  aCoachQuickHeading: {
    en: "Coaching Quick",
    es: "Coaching rapido",
    uz: "Murabbiylik tezkor",
    ru: "Быстрая коуч-сессия"
  },
  aCoachQuickHint: {
    en: "Build a match-side cheat sheet for the corner.",
    es: "Crea un cheat sheet rapido para la esquina.",
    uz: "Raqobatga tezkor eslatma tayyorlang.",
    ru: "Составьте шпаргалку для угла."
  },
  aTopMovesHeading: {
    en: "Top 3 Moves",
    es: "Top 3 movimientos",
    uz: "Top 3 usul",
    ru: "Топ 3 приема"
  },
  aOffenseHeading: {
    en: "Offense",
    es: "Ofensiva",
    uz: "Hujum",
    ru: "Атака"
  },
  aDefenseHeading: {
    en: "Defense",
    es: "Defensa",
    uz: "Himoya",
    ru: "Защита"
  },
  coachQuickPreviewHeading: {
    en: "Coaching Quick Summary",
    es: "Resumen rapido",
    uz: "Murabbiylik tezkor xulosasi",
    ru: "Краткое резюме коучинга"
  }
};

const PANEL_COPY = {
  "panel-training": {
    title: {
      en: "Training Plan",
      es: "Plan de entrenamiento",
      uz: "Trening rejasi",
      ru: "План тренировок"
    },
    chip: {
      en: "Week 3 - Pre-Tournament",
      es: "Semana 3 - Pre torneo",
      uz: "3-hafta - Turnirdan oldin",
      ru: "Неделя 3 - Предтурнир"
    }
  },
  "panel-athlete-profile": {
    title: {
      en: "Athlete Profile",
      es: "Perfil atleta",
      uz: "Sportchi profili",
      ru: "Профиль спортсмена"
    },
    chip: {
      en: "Create & Edit",
      es: "Crear y editar",
      uz: "Yaratish va tahrirlash",
      ru: "Создать и редактировать"
    }
  },
  "panel-competition-preview": {
    title: {
      en: "Competition Summary Preview",
      es: "Resumen de competencia",
      uz: "Musobaqa xulosasi ko‘rinishi",
      ru: "Предварительный обзор соревнования"
    },
    chip: {
      en: "Coach view",
      es: "Vista entrenador",
      uz: "Murabbiy ko'rinishi",
      ru: "Вид тренера"
    }
  },
  "panel-calendar": {
    title: {
      en: "Calendar",
      es: "Calendario",
      uz: "Taqvim",
      ru: "Календарь"
    },
    chip: {
      en: "Next tournament in 12 days",
      es: "Proximo torneo en 12 dias",
      uz: "Keyingi turnir 12 kunda",
      ru: "Следующий турнир через 12 дней"
    }
  },
  "panel-media": {
    title: {
      en: "Media",
      es: "Multimedia",
      uz: "Media",
      ru: "Медиа"
    },
    chip: {
      en: "Assigned for Today",
      es: "Asignado para hoy",
      uz: "Bugun uchun tayinlangan",
      ru: "Назначено на сегодня"
    }
  },
  "panel-journal": {
    title: {
      en: "Daily Check-in",
      es: "Chequeo diario",
      uz: "Kunlik qayd",
      ru: "Ежедневная проверка"
    }
  },
  "panel-favorites": {
    title: {
      en: "Favorites",
      es: "Favoritos",
      uz: "Sevimlilar",
      ru: "Избранное"
    }
  },
  "panel-announcements": {
    title: {
      en: "Messages & Announcements",
      es: "Mensajes y avisos",
      uz: "Xabarlar va e'lonlar",
      ru: "Сообщения и объявления"
    },
    chip: {
      en: "Coach Broadcast",
      es: "Aviso entrenador",
      uz: "Murabbiy efiri",
      ru: "Трансляция тренера"
    }
  },
  "panel-dashboard": {
    title: {
      en: "Team Dashboard",
      es: "Panel del equipo",
      uz: "Jamoa paneli",
      ru: "Командная панель"
    },
    chip: {
      en: "Alerts: 3",
      es: "Alertas: 3",
      uz: "Ogohlantirishlar: 3",
      ru: "Оповещения: 3"
    }
  },
  "panel-coach-profile": {
    title: {
      en: "Coach Account & Profile",
      es: "Cuenta y perfil entrenador",
      uz: "Murabbiy hisobi va profili",
      ru: "Аккаунт и профиль тренера"
    },
    chip: {
      en: "Secure access",
      es: "Acceso seguro",
      uz: "Xavfsiz kirish",
      ru: "Безопасный доступ"
    }
  },
  "panel-athletes": {
    title: {
      en: "Athlete Management",
      es: "Gestion de atletas",
      uz: "Sportchilarni boshqarish",
      ru: "Управление спортсменами"
    },
    chip: {
      en: "Roster",
      es: "Plantel",
      uz: "Ro'yxat",
      ru: "Состав"
    }
  },
  "panel-coach-match": {
    title: {
      en: "Athlete Summary",
      es: "Resumen atleta",
      uz: "Sportchi xulosasi",
      ru: "Сводка спортсмена"
    },
    chip: {
      en: "Real-time corner view",
      es: "Vista en tiempo real",
      uz: "Jonli burchak ko'rinishi",
      ru: "Просмотр в реальном времени"
    }
  },
  "panel-plans": {
    title: {
      en: "Create Training Plans",
      es: "Crear planes de entrenamiento",
      uz: "Trening rejalarini yaratish",
      ru: "Создание тренировочных планов"
    }
  },
  "panel-calendar-manager": {
    title: {
      en: "Calendar Manager",
      es: "Gestion de calendario",
      uz: "Taqvim boshqaruvi",
      ru: "Управление календарем"
    },
    chip: {
      en: "Create events + reminders",
      es: "Crear eventos y recordatorios",
      uz: "Tadbirlar va eslatmalar yarating",
      ru: "Создайте события и напоминания"
    }
  },
  "panel-media-library": {
    title: {
      en: "Media Library",
      es: "Biblioteca multimedia",
      uz: "Media kutubxonasi",
      ru: "Медиатека"
    },
    chip: {
      en: "Upload - Tag - Assign",
      es: "Subir - Etiquetar - Asignar",
      uz: "Yuklash - Teg qo'yish - Belgilash",
      ru: "Загрузить - Тег - Назначить"
    }
  },
  "panel-athlete-notes": {
    title: {
      en: "Athlete Notes",
      es: "Notas de atletas",
      uz: "Sportchi eslatmalari",
      ru: "Заметки спортсмена"
    },
    chip: {
      en: "Private coach notes",
      es: "Notas privadas",
      uz: "Shaxsiy murabbiy eslatmalari",
      ru: "Личные заметки тренера"
    }
  },
  "panel-skills": {
    title: {
      en: "Skills Tracker",
      es: "Seguimiento de tecnicas",
      uz: "Ko'nikmalar kuzatuvchisi",
      ru: "Трекер навыков"
    },
    chip: {
      en: "Best clips by move",
      es: "Mejores clips por tecnica",
      uz: "Harakat bo'yicha eng yaxshi kliplar",
      ru: "Лучшие клипы по приему"
    }
  },
  "panel-journal-monitor": {
    title: {
      en: "Athlete Journal Monitoring",
      es: "Monitoreo del diario",
      uz: "Sportchi kundaligini kuzatish",
      ru: "Мониторинг дневника спортсмена"
    },
    chip: {
      en: "Readiness signals",
      es: "Senales de disponibilidad",
      uz: "Tayyorlik signallari",
      ru: "Сигналы готовности"
    }
  },
  "panel-messages": {
    title: {
      en: "Coach Messages",
      es: "Mensajes del entrenador",
      uz: "Murabbiy xabarlari",
      ru: "Сообщения тренера"
    },
    chip: {
      en: "1:1 + tags",
      es: "1:1 + etiquetas",
      uz: "1:1 + teglar",
      ru: "1:1 + метки"
    }
  },
  "panel-permissions": {
    title: {
      en: "Permissions & Control",
      es: "Permisos y control",
      uz: "Ruxsatlar va nazorat",
      ru: "Разрешения и контроль"
    },
    chip: {
      en: "Role based access",
      es: "Acceso por rol",
      uz: "Rol asosida kirish",
      ru: "Доступ по ролям"
    }
  }
};

const BUTTON_COPY = {
  quickContinueBtn: {
    en: "Save & Continue",
    es: "Guardar y continuar",
    uz: "Saqlash va davom etish",
    ru: "Сохранить и продолжить"
  },
  quickSkipBtn: {
    en: "Skip",
    es: "Omitir",
    uz: "Oʻtkazib yuborish",
    ru: "Пропустить"
  },
  doneProfileBtn: {
    en: "Done",
    es: "Listo",
    uz: "Tayyor",
    ru: "Готово"
  },
  skipBtn: {
    en: "Skip (use default)",
    es: "Omitir (usar por defecto)",
    uz: "Oʻtkazib yuborish (standart)",
    ru: "Пропустить (использовать по умолчанию)"
  },
  loginGuestBtn: {
    en: "Continue as Guest",
    es: "Continuar como invitado",
    uz: "Mehmon sifatida davom etish",
    ru: "Продолжить как гость"
  },
  startSessionBtn: {
    en: "Start Session",
    es: "Iniciar sesion",
    uz: "Mashgʻulotni boshlash",
    ru: "Начать сессию"
  },
  watchFilmBtn: {
    en: "Watch Assigned Film",
    es: "Ver video asignado",
    uz: "Belgilangan filmni ko‘rish",
    ru: "Смотреть назначенное видео"
  },
  logCompletionBtn: {
    en: "Log Completion",
    es: "Registrar completado",
    uz: "Tugallanishni qayd etish",
    ru: "Зарегистрировать завершение"
  },
  previewProfileBtn: {
    en: "Preview Competition Summary",
    es: "Ver resumen de competencia",
    uz: "Musobaqa xulosasini ko‘rib chiqish",
    ru: "Просмотреть сводку соревнования"
  },
  openCoachMatchBtn: {
    en: "Open Athlete Summary",
    es: "Abrir resumen atleta",
    uz: "Sportchi xulosasini ochish",
    ru: "Открыть сводку спортсмена"
  },
  openCompetitionPreviewBtn: {
    en: "Open Competition Preview",
    es: "Abrir resumen de competencia",
    uz: "Musobaqa ko‘rinishini ochish",
    ru: "Открыть предварительный просмотр соревнования"
  },
  backToProfileBtn: {
    en: "Back to Profile",
    es: "Volver al perfil",
    uz: "Profilga qaytish",
    ru: "Вернуться к профилю"
  },
  saveJournalBtn: {
    en: "Save entry",
    es: "Guardar entrada",
    uz: "Yozuvni saqlash",
    ru: "Сохранить запись"
  },
  saveOnePagerPlan: {
    en: "Save Plan",
    es: "Guardar plan",
    uz: "Rejani saqlash",
    ru: "Сохранить план"
  },
  saveOnePagerDos: {
    en: "Save Do/Don't",
    es: "Guardar hacer/no hacer",
    uz: "Qilish/qoʻymaslikni saqlash",
    ru: "Сохранить делай/не делай"
  },
  saveOnePagerCues: {
    en: "Save Cues",
    es: "Guardar indicaciones",
    uz: "Ko‘rsatmalarni saqlash",
    ru: "Сохранить подсказки"
  },
  saveOnePagerSafety: {
    en: "Save Safety Notes",
    es: "Guardar notas de seguridad",
    uz: "Xavfsizlik eslatmalarini saqlash",
    ru: "Сохранить заметки по безопасности"
  },
  messageAthleteBtn: {
    en: "Message Athlete",
    es: "Mensaje al atleta",
    uz: "Sportchiga xabar yuborish",
    ru: "Отправить сообщение спортсмену"
  },
  openTrainingBtn: {
    en: "Open Today's Training",
    es: "Abrir entrenamiento de hoy",
    uz: "Bugungi mashg‘ulotni ochish",
    ru: "Открыть сегодняшнюю тренировку"
  },
  openTournamentBtn: {
    en: "Open Tournament Event",
    es: "Abrir evento de torneo",
    uz: "Turnir tadbirini ochish",
    ru: "Открыть событие турнира"
  },
  addQuickNoteBtn: {
    en: "Add Quick Note",
    es: "Agregar nota rapida",
    uz: "Tez eslatma qo‘shish",
    ru: "Добавить заметку"
  },
  templatesBtn: {
    en: "Templates",
    es: "Plantillas",
    uz: "Shablonlar",
    ru: "Шаблоны"
  },
  templateGoBtn: {
    en: "Go ahead",
    es: "Continuar",
    uz: "Davom etish",
    ru: "Продолжить"
  },
  templateNoBtn: {
    en: "Nevermind",
    es: "Cancelar",
    uz: "Bekor qilish",
    ru: "Не сейчас"
  },
  doneDailyPlan: {
    en: "Done",
    es: "Listo",
    uz: "Tugallandi",
    ru: "Готово"
  },
  saveDailyPlan: {
    en: "Save",
    es: "Guardar",
    uz: "Saqlash",
    ru: "Сохранить"
  },
  shareDailyPlan: {
    en: "Share",
    es: "Compartir",
    uz: "Baham ko‘rish",
    ru: "Поделиться"
  },
  printTemplatePlan: {
    en: "Print from Template",
    es: "Imprimir desde plantilla",
    uz: "Shablondan chop etish",
    ru: "Распечатать из шаблона"
  },
  uploadTemplateBtn: {
    en: "Upload PDF",
    es: "Subir PDF",
    uz: "PDF yuklash",
    ru: "Загрузить PDF"
  },
  generateTemplateBtn: {
    en: "Fill PDF Template",
    es: "Llenar plantilla PDF",
    uz: "PDF shablonini to‘ldirish",
    ru: "Заполнить PDF-шаблон"
  },
  templateHelpBtn: {
    en: "Template",
    es: "Plantilla",
    uz: "Shablon",
    ru: "Шаблон"
  }
};

const PLACEHOLDER_COPY = [
  {
    selector: ".search-input",
    value: {
      en: "Search athletes by name",
      es: "Buscar atletas por nombre",
      uz: "Sportchilarni ismi bilan qidirish",
      ru: "Искать спортсменов по имени"
    }
  },
  {
    selector: "#journalInput",
    value: {
      en: "Notes (text or voice summary)...",
      es: "Notas (texto o voz)...",
      uz: "Eslatmalar (matn yoki ovoz)...",
      ru: "Заметки (текст или голос)..."
    }
  },
  {
    selector: "#injuryInput",
    value: {
      en: "Knee soreness, right side",
      es: "Dolor de rodilla, lado derecho",
      uz: "Tizza og‘rig‘i, o‘ng tomonda",
      ru: "Боль в колене, правая сторона"
    }
  }
];

const MONTH_NAMES_BY_LANG = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],
  es: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ]
  ,
  uz: [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr"
  ],
  ru: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
  ]
};

const DAY_ABBR_BY_LANG = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  es: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
  ,
  uz: ["Yak", "Dush", "Sal", "Chor", "Pay", "Jum", "Shan"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
};

function pickCopy(copy) {
  if (!copy) return "";
  if (typeof copy === "string") return copy;
  return copy[currentLang] || copy.en || "";
}

function setTextContent(selector, copy) {
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!el) return;
  el.textContent = pickCopy(copy);
}

function setLabelAndPlaceholder(id, copy) {
  const input = document.getElementById(id);
  if (!input || !copy) return;
  const labelSpan = input.closest("label")?.querySelector("span");
  if (labelSpan && copy.label) labelSpan.textContent = pickCopy(copy.label);
  if (copy.placeholder && "placeholder" in input) {
    input.placeholder = pickCopy(copy.placeholder);
  }
}

function updateSelectOptions(id, valuesByLang) {
  const select = document.getElementById(id);
  if (!select || !valuesByLang) return;
  const map = valuesByLang[currentLang] || valuesByLang.en || {};
  Array.from(select.options).forEach((opt) => {
    if (map[opt.value]) opt.textContent = map[opt.value];
  });
}

function updateTechniqueLabels(selector) {
  const inputs = Array.from(document.querySelectorAll(selector));
  inputs.forEach((input) => {
    const label = input.closest("label");
    if (!label) return;
    const copy = TECHNIQUE_LABELS[input.value];
    if (!copy) return;
    const target = pickCopy(copy);
    const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = ` ${target}`;
    } else {
      label.appendChild(document.createTextNode(` ${target}`));
    }
  });
}

function updateTechniqueSection(neutralOtherId, topOtherId, bottomOtherId, defenseOtherId) {
  const neutralOther = document.getElementById(neutralOtherId);
  const section = neutralOther?.closest(".form-section");
  if (!section) return;
  const heading = section.querySelector("h3");
  const hint = section.querySelector("p.small");
  if (heading) heading.textContent = currentLang === "es" ? "Tecnicas predeterminadas" : "Default Techniques";
  if (hint) hint.textContent = currentLang === "es" ? "Elige 2-4 por posicion." : "Pick 2-4 per position.";

  const cards = section.querySelectorAll(".mini-card");
  const titles = currentLang === "es"
    ? ["Neutral", "Arriba", "Abajo", "Defensa"]
    : ["Neutral", "Top", "Bottom", "Defense"];
  cards.forEach((card, idx) => {
    const h4 = card.querySelector("h4");
    if (h4 && titles[idx]) h4.textContent = titles[idx];
  });

  setLabelAndPlaceholder(neutralOtherId, FIELD_COPY[neutralOtherId]);
  setLabelAndPlaceholder(topOtherId, FIELD_COPY[topOtherId]);
  setLabelAndPlaceholder(bottomOtherId, FIELD_COPY[bottomOtherId]);
  setLabelAndPlaceholder(defenseOtherId, FIELD_COPY[defenseOtherId]);
}

function updateSectionHeading(inputId, headingCopy) {
  const input = document.getElementById(inputId);
  const section = input?.closest(".form-section");
  if (!section) return;
  const heading = section.querySelector("h3");
  if (heading) heading.textContent = pickCopy(headingCopy);
}

function applyStaticTranslations() {
  const headerTitle = document.querySelector(".header-text h1");
  setTextContent(headerTitle, HEADER_COPY);
  document.title = pickCopy(HEADER_COPY);

  updateSelectOptions("headerLang", SELECT_COPY.headerLang);
  setTextContent(".quick-help", QUICK_HELP_COPY);

  const profileFootnote = document.querySelector("#profileForm > p.small.muted:last-of-type");
  setTextContent(profileFootnote, PROFILE_FOOTNOTE_COPY);
  const loginFootnote = document.querySelector("#loginForm > p.small.muted:last-of-type");
  setTextContent(loginFootnote, LOGIN_FOOTNOTE_COPY);

  const profileSubmit = document.querySelector('#profileForm button[type="submit"]');
  if (profileSubmit) {
    profileSubmit.textContent = currentLang === "es" ? "Crear perfil" : "Create Profile";
  }

  Object.entries(FIELD_COPY).forEach(([id, copy]) => setLabelAndPlaceholder(id, copy));
  Object.entries(SELECT_COPY).forEach(([id, copy]) => updateSelectOptions(id, copy));
  PLACEHOLDER_COPY.forEach(({ selector, value }) => {
    const el = document.querySelector(selector);
    if (el && "placeholder" in el) el.placeholder = pickCopy(value);
  });

  updateTechniqueSection("pNeutralOther", "pTopOther", "pBottomOther", "pDefenseOther");
  updateTechniqueSection("aNeutralOther", "aTopOther", "aBottomOther", "aDefenseOther");
  updateTechniqueLabels(".tech-grid .check input");
  updateTechniqueLabels(".a-tech-grid input, .tech-grid input");

  updateSectionHeading("pInternational", {
    en: "International Experience",
    es: "Experiencia internacional"
  });
  updateSectionHeading("aInternational", {
    en: "International Experience",
    es: "Experiencia internacional"
  });
  updateSectionHeading("pCoachCues", {
    en: "Competition Notes",
    es: "Notas de competencia"
  });
  updateSectionHeading("aCoachCues", {
    en: "Competition Notes",
    es: "Notas de competencia"
  });

  setTextContent("#profileSubtabTraining", PROFILE_SUBTAB_COPY.training);
  setTextContent("#profileSubtabCompetition", PROFILE_SUBTAB_COPY.competition);
  setTextContent("#profileSubtabCoaching", PROFILE_SUBTAB_COPY.coaching);
  Object.entries(PROFILE_SECTION_COPY).forEach(([id, copy]) => {
    setTextContent(`#${id}`, copy);
  });
  setTextContent("#planRangeHeading", PLAN_RANGE_COPY.heading);
  setTextContent("#planRangeStartTitle", PLAN_RANGE_COPY.start);
  setTextContent("#planRangeEndTitle", PLAN_RANGE_COPY.end);
  document.querySelectorAll(".tab").forEach((tab) => {
    const key = tab.dataset.tab;
    if (key && TAB_COPY[key]) tab.textContent = pickCopy(TAB_COPY[key]);
  });

  Object.entries(PANEL_COPY).forEach(([panelId, copy]) => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const h2 = panel.querySelector("h2");
    if (h2 && copy.title) h2.textContent = pickCopy(copy.title);
    const chip = panel.querySelector(".chip");
    if (chip && copy.chip) chip.textContent = pickCopy(copy.chip);
  });

  Object.entries(BUTTON_COPY).forEach(([id, copy]) => {
    const btn = document.getElementById(id);
    if (btn) btn.textContent = pickCopy(copy);
  });

  if (editProfileBtn) {
    editProfileBtn.title = currentLang === "es" ? "Editar perfil" : "Edit profile";
  }

  if (activeAuthMode === "login" || activeAuthMode === "create") {
    showAuthForm(activeAuthMode);
  } else {
    showAuthChoice();
  }
}

function authErrorMessage(code, fallback = "") {
  const map = currentLang === "es"
    ? {
        invalid_credentials: "Correo o contrasena incorrectos.",
        role_mismatch: "Ese usuario no tiene ese rol.",
        email_exists: "Ese correo ya esta registrado.",
        password_too_short: "La contrasena debe tener al menos 8 caracteres.",
        missing_fields: "Faltan campos obligatorios.",
        invalid_email: "Correo invalido.",
        db_error: "Error de base de datos.",
        "auth/user-not-found": "No encontramos una cuenta con ese correo.",
        "auth/wrong-password": "Correo o contrasena incorrectos.",
        "auth/email-already-in-use": "Ese correo ya esta registrado.",
        "auth/invalid-email": "Correo invalido.",
        "auth/weak-password": "La contrasena es muy debil.",
        password_mismatch: "Las contrasenas deben coincidir.",
        firebase_not_configured: "Firebase no esta configurado.",
        "auth/network-request-failed": "Revise su conexion e intente de nuevo."
      }
    : {
        invalid_credentials: "Incorrect email or password.",
        role_mismatch: "That account does not match the selected role.",
        email_exists: "That email is already registered.",
        password_too_short: "Password must be at least 8 characters.",
        missing_fields: "Required fields are missing.",
        invalid_email: "Invalid email.",
        db_error: "Database error.",
        "auth/user-not-found": "We couldn't find an account with that email.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/email-already-in-use": "That email is already registered.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password is too weak.",
        password_mismatch: "Passwords must match.",
        firebase_not_configured: "Firebase is not configured.",
        "auth/network-request-failed": "Network error. Check connectivity."
      };
  return map[code] || fallback || String(code || "");
}

function blankAthleteFields(profile) {
  profile.weightClass = "";
  profile.currentWeight = "";
  profile.style = "";
  profile.position = "";
  profile.strategy = "";
  profile.years = "";
  profile.trainingRoutines = "";
  profile.trainingVolume = "";
  profile.trainingFocus = "";
  profile.strategyA = "";
  profile.strategyB = "";
  profile.strategyC = "";
  profile.safeMoves = "";
  profile.riskyMoves = "";
  profile.resultsHistory = "";
  profile.tags = [];
  profile.favoritePosition = "";
  profile.psychTendency = "";
  profile.pressureError = "";
  profile.coachSignal = "";
  profile.offenseTop3 = [];
  profile.defenseTop3 = [];
  profile.international = "no";
  profile.internationalEvents = "";
  profile.internationalYears = "";
  profile.coachCues = "";
  profile.cueNotes = "";
  profile.injuryNotes = "";
  profile.techniques = {
    neutral: [],
    top: [],
    bottom: [],
    defense: [],
    neutralOther: "",
    topOther: "",
    bottomOther: "",
    defenseOther: ""
  };
}

function buildProfileFromForm({ email, role, userId = null } = {}) {
  const neutralTech = collectTechniques(".tech-neutral");
  const topTech = collectTechniques(".tech-top");
  const bottomTech = collectTechniques(".tech-bottom");
  const defenseTech = collectTechniques(".tech-defense");
  const profile = {
    user_id: userId,
    email: email || pEmail.value.trim(),
    name: pName.value.trim(),
    role: role || pRole.value,
    team: pInstitution?.value.trim(),
    institution: pInstitution?.value.trim(),
    level: pLevel.value,
    weightClass: pWeight.value.trim(),
    goal: pGoal.value.trim(),
    lang: resolveLang(pLang.value || getPreferredLang()),
    currentWeight: pCurrentWeight.value.trim(),
    style: pStyle.value,
    position: pPosition.value,
    strategy: pStrategy.value,
    years: pYears.value.trim(),
    photo: pPhoto.value.trim(),
    country: pCountry.value.trim(),
    city: pCity.value.trim(),
    schoolClub: pSchoolClub.value,
    schoolName: pInstitution?.value.trim(),
    clubName: pInstitution?.value.trim(),
    international: pInternational.value,
    internationalEvents: pInternationalEvents.value.trim(),
    internationalYears: pInternationalYears.value.trim(),
    coachCues: pCoachCues.value,
    cueNotes: pCueNotes.value.trim(),
    injuryNotes: pInjuryNotes.value.trim(),
    trainingRoutines: "",
    trainingVolume: "",
    trainingFocus: "",
    strategyA: "",
    strategyB: "",
    strategyC: "",
    safeMoves: "",
    riskyMoves: "",
    resultsHistory: "",
    tags: [],
    favoritePosition: pPosition.value,
    archetype: aArchetype?.value || "",
    bodyType: aBodyType?.value || "",
    psychTendency: strategyToTendency(pStrategy.value),
    pressureError: "",
    coachSignal: "",
    cueWords: [aCueWord1?.value.trim(), aCueWord2?.value.trim(), aCueWord3?.value.trim()].filter(Boolean),
    offenseTop3: neutralTech.slice(0, 3),
    defenseTop3: defenseTech.slice(0, 3),
    techniques: {
      neutral: neutralTech,
      top: topTech,
      bottom: bottomTech,
      defense: defenseTech,
      neutralOther: pNeutralOther.value.trim(),
      topOther: pTopOther.value.trim(),
      bottomOther: pBottomOther.value.trim(),
      defenseOther: pDefenseOther.value.trim()
    },
    defaultTechniques: {
      leadLeg: aLeadLeg?.value || "",
      leftAttack: aLeftAttack?.value.trim() || "",
      rightAttack: aRightAttack?.value.trim() || "",
      preferredTies: aPreferredTies?.value.trim() || "",
      miscNotes: aMiscNotes?.value.trim() || ""
    }
  };

  if (profile.role !== "athlete") {
    blankAthleteFields(profile);
  }

  return profile;
}

function buildGuestProfile(role) {
  const isCoach = role === "coach";
  const copy = GUEST_COPY[role] || GUEST_COPY.athlete;
  const profile = {
    name: pickCopy(copy.name),
    role,
    team: isCoach ? pickCopy({ en: "Guest Team", es: "Equipo invitado" }) : "",
    level: "intermediate",
    lang: currentLang,
    goal: pickCopy(copy.goal),
    trainingRoutines: pickCopy(copy.routines),
    trainingVolume: pickCopy(copy.volume),
    trainingFocus: pickCopy(copy.focus),
    international: "no",
    coachCues: "specific",
    tags: [],
    techniques: {
      neutral: [],
      top: [],
      bottom: [],
    defense: [],
    neutralOther: "",
    topOther: "",
    bottomOther: "",
    defenseOther: ""
  }
};
  profile.view = role;
  profile.archetype = "technician";
  profile.bodyType = "balanced";
  profile.defaultTechniques = {
  leadLeg: "left",
  leftAttack: "",
  rightAttack: "",
  preferredTies: ""
};

  if (!isCoach) {
    profile.position = "neutral";
    profile.style = "freestyle";
    profile.currentWeight = "";
    profile.weightClass = "";
    profile.goal = pickCopy(copy.goal) || "Get better every day";
    profile.techniques = {
      neutral: ["Single Leg", "Double Leg"],
      top: ["Half Nelson"],
      bottom: ["Stand-Up"],
      defense: ["Sprawl"],
      neutralOther: "",
      topOther: "",
      bottomOther: "",
      defenseOther: ""
    };
  } else {
    profile.strategy = "planning";
    profile.strategyA = pickCopy({ en: "Attack high crotch", es: "Ataca con high crotch" });
    profile.strategyB = pickCopy({ en: "Control the pace", es: "Controla el ritmo" });
    profile.strategyC = pickCopy({ en: "Pressure transitions", es: "Presiona transiciones" });
    profile.safeMoves = pickCopy({ en: "Maintain base and claw ties", es: "Mantén base y controla muñecas" });
    profile.riskyMoves = pickCopy({ en: "Explosive throws", es: "Tiradas explosivas" });
    profile.resultsHistory = pickCopy({ en: "Demo summary: 3-0", es: "Resumen demo: 3-0" });
    profile.team = profile.team || pickCopy({ en: "Guest Team", es: "Equipo invitado" });
    profile.notes = pickCopy({ en: "Review sessions scheduled for later", es: "Revisa las sesiones planeadas" });
    profile.tags = ["planning", "match-prep", "guest"];
    profile.trainingFocus = pickCopy(copy.focus);
    profile.techniques = {
      neutral: [],
      top: [],
      bottom: [],
      defense: [],
      neutralOther: "",
      topOther: "",
      bottomOther: "",
      defenseOther: ""
    };
  }

  return profile;
}

async function continueAsGuest(role) {
  const profile = buildGuestProfile(role);
  setAuthUser(null);
  setProfile(profile);
  await applyProfile(profile);
  hideOnboarding();
}

if (guestAthleteBtn) {
  guestAthleteBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await continueAsGuest("athlete");
  });
}

if (guestCoachBtn) {
  guestCoachBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await continueAsGuest("coach");
  });
}
if (editProfileBtn) {
  editProfileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleHeaderMenu();
  });
}

if (headerMenu) {
  headerMenu.addEventListener("click", (event) => {
    event.stopPropagation();
    const action = event.target?.dataset?.action;
    handleHeaderMenuAction(action);
  });
}

if (viewSwitchBtn) {
  viewSwitchBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleViewMenu();
  });
}

if (viewMenu) {
  viewMenu.addEventListener("click", (event) => {
    event.stopPropagation();
    const targetElement = event.target instanceof Element
      ? event.target
      : event.target?.parentElement;
    const targetBtn = targetElement?.closest("button[data-view]");
    const view = targetBtn?.dataset?.view;
    if (view) {
      setView(view);
      closeViewMenu();
    }
  });
}

document.addEventListener("click", () => {
  closeHeaderMenu();
  closeViewMenu();
});

function buildAuthUser(userPayload) {
  if (!userPayload || !userPayload.id) return null;
  const id = String(userPayload.id);
  if (!id) return null;
  return {
    id,
    email: String(userPayload.email || ""),
    role: userPayload.role === "coach" ? "coach" : "athlete"
  };
}

async function fetchFirebaseProfile(uid) {
  if (!firebaseFirestoreInstance) return null;
  try {
    const doc = await firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (err) {
    console.warn("Failed to load Firebase profile", err);
    return null;
  }
}

async function persistFirebaseProfile(uid, data) {
  if (!firebaseFirestoreInstance) return;
  try {
    await firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(uid).set(data, { merge: true });
  } catch (err) {
    console.warn("Failed to persist Firebase profile", err);
  }
}

async function loginWithCredentials({ email, password }) {
  if (!firebaseAuthInstance) {
    throw new Error("firebase_not_configured");
  }
  const credential = await firebaseAuthInstance.signInWithEmailAndPassword(email, password);
  const { user } = credential;
  const remoteProfile = await fetchFirebaseProfile(user.uid);
  const resolvedRole = remoteProfile?.role || "athlete";
  const profile = {
    user_id: user.uid,
    email: user.email || email,
    name: remoteProfile?.name || user.displayName || "",
    role: resolvedRole,
    lang: remoteProfile?.lang || currentLang,
    createdAt: remoteProfile?.createdAt || new Date().toISOString()
  };
  return { user: { id: user.uid, email: user.email || email, role: resolvedRole }, profile };
}

async function registerWithFirebase({
  email,
  password,
  name,
  role,
  lang,
  preferredMoves = "",
  experienceYears = "",
  stance = "",
  weightClass = "",
  notes = ""
}) {
  if (!firebaseAuthInstance) {
    throw new Error("firebase_not_configured");
  }
  const credential = await firebaseAuthInstance.createUserWithEmailAndPassword(email, password);
  const { user } = credential;
  if (name && user.updateProfile) {
    try {
      await user.updateProfile({ displayName: name });
    } catch {
      // ignore profile update errors
    }
  }
  const profilePayload = {
    user_id: user.uid,
    email,
    name,
    role: role === "coach" ? "coach" : "athlete",
    lang: resolveLang(lang || currentLang),
    preferred_moves: preferredMoves,
    experience_years: experienceYears,
    stance,
    weight_class: weightClass,
    notes,
    createdAt: new Date().toISOString()
  };
  await persistFirebaseProfile(user.uid, profilePayload);
  return { user: { id: user.uid, email, role: profilePayload.role }, profile: profilePayload };
}

async function handleSuccessfulAuth(result) {
  const authUser = buildAuthUser(result.user);
  if (!authUser) {
    throw new Error("invalid_credentials");
  }
  setAuthUser(authUser);
  const profile = normalizeProfileForAuth(result.profile || {}, authUser);
  setProfile(profile);
  await applyProfile(profile);
  hideOnboarding();
}

if (pRole) {
  pRole.addEventListener("change", () => updateRoleSections(pRole.value));
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      const result = await loginWithCredentials({ email, password });
      await handleSuccessfulAuth(result);
    } catch (err) {
      const code = err?.code || err?.message || "auth_error";
      alert(authErrorMessage(code, err?.message || String(err)));
    }
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = pName.value.trim();
    const email = pEmail.value.trim();
    const password = pPassword.value;
    const confirm = pPasswordConfirm.value;
    const role = pRole.value;
    const lang = pLang?.value || currentLang;

    if (!name || !email || !password || !confirm) {
      alert("Please fill all fields.");
      return;
    }
    if (password.length < 8) {
      alert(authErrorMessage("password_too_short", "Password must be at least 8 characters."));
      return;
    }
    if (password !== confirm) {
      alert(authErrorMessage("password_mismatch", "Passwords must match."));
      return;
    }

    const preferredMoves = pPreferredMoves?.value.trim() || "";
    const experienceYears = pExperienceYears?.value.trim() || "";
    const stance = pStance?.value || "";
    const weightClass = pWeightClass?.value.trim() || "";
    const notes = pNotes?.value.trim() || "";

    try {
      const payload = await registerWithFirebase({
        email,
        password,
        name,
        role,
        lang,
        preferredMoves,
        experienceYears,
        stance,
        weightClass,
        notes
      });
      await handleSuccessfulAuth(payload);
    } catch (err) {
      const code = err?.code || err?.message || "auth_error";
      alert(authErrorMessage(code, err?.message || String(err)));
    }
  });
}

if (loginOptionBtn) {
  loginOptionBtn.addEventListener("click", () => showAuthForm("login"));
}

if (createOptionBtn) {
  createOptionBtn.addEventListener("click", () => showAuthForm("create"));
}

if (authBackBtn) {
  authBackBtn.addEventListener("click", showAuthChoice);
}

// Edit profile later
editProfileBtn.addEventListener("click", () => {
  const existing = getProfile();
  showOnboarding(existing);
});

// ---------- AUDIO ----------
let muted = false;
let voices = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function pickVoice() {
  const profile = getProfile();
  const langPref = profile?.lang || "en";
  const langMatch = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPref));
  return langMatch || voices[0];
}

function speak(text) {
  if (muted) return;
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;

  u.rate = 0.95;
  u.pitch = 1;

  speechSynthesis.speak(u);
}

if (headerLang) {
  headerLang.addEventListener("change", () => {
    if (langChangeLocked) return;
    const selected = resolveLang(headerLang.value);
    setLanguage(selected, { source: "header" });
  });
}

// ---------- DATA ----------
const WEEK_PLAN = [
  {
    day: "Sunday",
    focus: "Active Recovery",
    intensity: "Low",
    total: "60 min",
    blocks: [
      { label: "Warm-up", detail: "10 min flow + hip mobility" },
      { label: "Recovery", detail: "20 min bike + stretching" },
      { label: "Film Study", detail: "20 min: Single leg entries" },
      { label: "Cooldown", detail: "10 min breathing + reset" }
    ],
    details: [
      "Goal: Restore body and sharpen technique",
      "Drills: Shadow shots + stance motion",
      "Conditioning: Light bike intervals",
      "Homework: Watch \"Single Leg Finish\""
    ]
  },
  {
    day: "Monday",
    focus: "Mat Technique",
    intensity: "Medium",
    total: "90 min",
    blocks: [
      { label: "Warm-up", detail: "15 min dynamic + stance motion" },
      { label: "Technique", detail: "25 min: Single leg to shelf" },
      { label: "Drilling", detail: "20 min: Chain wrestling reps" },
      { label: "Situations", detail: "15 min: Top/bottom starts" },
      { label: "Cooldown", detail: "15 min stretch + breath" }
    ],
    details: [
      "Goal: Build single leg chain",
      "Live rounds: 4 x 2:00",
      "Strength: 4x6 squat + pull",
      "Homework: Watch \"Finish to shelf\""
    ]
  },
  {
    day: "Tuesday",
    focus: "Strength Training",
    intensity: "High",
    total: "75 min",
    blocks: [
      { label: "Warm-up", detail: "10 min band activation" },
      { label: "Strength", detail: "35 min: Squat + hinge" },
      { label: "Accessory", detail: "15 min: Core + grip" },
      { label: "Cooldown", detail: "15 min mobility" }
    ],
    details: [
      "Goal: Build lower body power",
      "Strength: 5x5 squat + RDL",
      "Conditioning: 6 x 30s assault bike",
      "Homework: 10 min hip mobility"
    ]
  },
  {
    day: "Wednesday",
    focus: "Conditioning",
    intensity: "High",
    total: "70 min",
    blocks: [
      { label: "Warm-up", detail: "10 min jump rope + movement" },
      { label: "Intervals", detail: "25 min: 10 x 30s sprint" },
      { label: "Mat Goes", detail: "20 min: Shark tank" },
      { label: "Cooldown", detail: "15 min stretch" }
    ],
    details: [
      "Goal: Match pace for 3 periods",
      "Live rounds: 6 x 1:00",
      "Conditioning: 10 x 30s sprint",
      "Homework: Watch \"Pressure ride\""
    ]
  },
  {
    day: "Thursday",
    focus: "Mat Technique",
    intensity: "Medium",
    total: "90 min",
    blocks: [
      { label: "Warm-up", detail: "15 min stance motion" },
      { label: "Technique", detail: "25 min: Half nelson series" },
      { label: "Drilling", detail: "20 min: Top breakdowns" },
      { label: "Situations", detail: "15 min: Ride out" },
      { label: "Cooldown", detail: "15 min stretch" }
    ],
    details: [
      "Goal: Improve top control",
      "Live rounds: 4 x 2:00",
      "Homework: Watch \"Half nelson finish\""
    ]
  },
  {
    day: "Friday",
    focus: "Film Study",
    intensity: "Low",
    total: "50 min",
    blocks: [
      { label: "Film", detail: "30 min: Opponent tendencies" },
      { label: "Walk-through", detail: "15 min: Key setups" },
      { label: "Cooldown", detail: "5 min breathing" }
    ],
    details: [
      "Goal: Prepare for tournament",
      "Homework: Visualize 3 openings",
      "Checklist: Pack gear + ID"
    ]
  },
  {
    day: "Saturday",
    focus: "Tournament Day",
    intensity: "High",
    total: "All day",
    blocks: [
      { label: "Weigh-in", detail: "Check-in + hydration" },
      { label: "Warm-up", detail: "20 min movement + shots" },
      { label: "Matches", detail: "Stay ready between bouts" },
      { label: "Recovery", detail: "Cool down + refuel" }
    ],
    details: [
      "Goal: Compete with pace",
      "Reminder: Bring singlet + ID",
      "Coach notes: Focus on first contact"
    ]
  }
];

const WEEK_PLAN_ES = [
  {
    day: "Domingo",
    focus: "Recuperacion activa",
    intensity: "Low",
    total: "60 min",
    blocks: [
      { label: "Calentamiento", detail: "10 min flujo + movilidad de cadera" },
      { label: "Recuperacion", detail: "20 min bici + estiramientos" },
      { label: "Estudio de video", detail: "20 min: Entradas a pierna simple" },
      { label: "Vuelta a la calma", detail: "10 min respiracion + reset" }
    ],
    details: [
      "Objetivo: Restaurar el cuerpo y afinar tecnica",
      "Repeticiones: Sombras + movimiento de postura",
      "Acondicionamiento: Intervalos ligeros en bici",
      "Tarea: Ver \"Final de pierna simple\""
    ]
  },
  {
    day: "Lunes",
    focus: "Tecnica en el tapiz",
    intensity: "Medium",
    total: "90 min",
    blocks: [
      { label: "Calentamiento", detail: "15 min dinamico + movimiento de postura" },
      { label: "Tecnica", detail: "25 min: Pierna simple a la repisa" },
      { label: "Repeticiones", detail: "20 min: Cadena de lucha" },
      { label: "Situaciones", detail: "15 min: Arriba/abajo desde posiciones" },
      { label: "Vuelta a la calma", detail: "15 min estirar + respirar" }
    ],
    details: [
      "Objetivo: Construir la cadena de pierna simple",
      "Rondas en vivo: 4 x 2:00",
      "Fuerza: 4x6 sentadilla + jalon",
      "Tarea: Ver \"Final a la repisa\""
    ]
  },
  {
    day: "Martes",
    focus: "Entrenamiento de fuerza",
    intensity: "High",
    total: "75 min",
    blocks: [
      { label: "Calentamiento", detail: "10 min activacion con banda" },
      { label: "Fuerza", detail: "35 min: Sentadilla + bisagra" },
      { label: "Accesorios", detail: "15 min: Core + agarre" },
      { label: "Vuelta a la calma", detail: "15 min movilidad" }
    ],
    details: [
      "Objetivo: Construir potencia de piernas",
      "Fuerza: 5x5 sentadilla + RDL",
      "Acondicionamiento: 6 x 30s assault bike",
      "Tarea: 10 min movilidad de cadera"
    ]
  },
  {
    day: "Miercoles",
    focus: "Acondicionamiento",
    intensity: "High",
    total: "70 min",
    blocks: [
      { label: "Calentamiento", detail: "10 min cuerda + movimiento" },
      { label: "Intervalos", detail: "25 min: 10 x 30s sprint" },
      { label: "Rondas en el tapiz", detail: "20 min: Shark tank" },
      { label: "Vuelta a la calma", detail: "15 min estirar" }
    ],
    details: [
      "Objetivo: Ritmo de combate por 3 periodos",
      "Rondas en vivo: 6 x 1:00",
      "Acondicionamiento: 10 x 30s sprint",
      "Tarea: Ver \"Pressure ride\""
    ]
  },
  {
    day: "Jueves",
    focus: "Tecnica en el tapiz",
    intensity: "Medium",
    total: "90 min",
    blocks: [
      { label: "Calentamiento", detail: "15 min movimiento de postura" },
      { label: "Tecnica", detail: "25 min: Serie de medio nelson" },
      { label: "Repeticiones", detail: "20 min: Desarmes arriba" },
      { label: "Situaciones", detail: "15 min: Mantener control" },
      { label: "Vuelta a la calma", detail: "15 min estirar" }
    ],
    details: [
      "Objetivo: Mejorar el control arriba",
      "Rondas en vivo: 4 x 2:00",
      "Tarea: Ver \"Final de medio nelson\""
    ]
  },
  {
    day: "Viernes",
    focus: "Estudio de video",
    intensity: "Low",
    total: "50 min",
    blocks: [
      { label: "Video", detail: "30 min: Tendencias del oponente" },
      { label: "Repaso", detail: "15 min: Preparaciones clave" },
      { label: "Vuelta a la calma", detail: "5 min respiracion" }
    ],
    details: [
      "Objetivo: Prepararse para el torneo",
      "Tarea: Visualizar 3 aperturas",
      "Checklist: Empacar equipo + ID"
    ]
  },
  {
    day: "Sabado",
    focus: "Dia de torneo",
    intensity: "High",
    total: "Todo el dia",
    blocks: [
      { label: "Pesaje", detail: "Registro + hidratacion" },
      { label: "Calentamiento", detail: "20 min movimiento + tiros" },
      { label: "Combates", detail: "Mantente listo entre peleas" },
      { label: "Recuperacion", detail: "Bajar ritmo + recargar" }
    ],
    details: [
      "Objetivo: Competir con ritmo",
      "Recordatorio: Trae singlet + ID",
      "Notas del coach: Enfocate en el primer contacto"
    ]
  }
];

const CALENDAR_EVENTS = {};
const CALENDAR_EVENTS_ES = {};
const CALENDAR_EVENTS_KEY = "wpl_calendar_events";
const MEDIA_TREE_KEY = "wpl_media_tree";

const MEDIA_ITEMS = [
  { title: "Single Leg Finish", type: "Video", tag: "Single Leg", assigned: "Today" },
  { title: "Half Nelson Series", type: "Video", tag: "Top Control", assigned: "This week" },
  { title: "Bottom Escape Drill", type: "Clip", tag: "Bottom", assigned: "Today" },
  { title: "Hand Fight Notes", type: "Link", tag: "Neutral", assigned: "Optional" }
];

const MEDIA_ITEMS_ES = [
  { title: "Final de pierna simple", type: "Video", tag: "Pierna simple", assigned: "Hoy" },
  { title: "Serie de medio nelson", type: "Video", tag: "Control arriba", assigned: "Esta semana" },
  { title: "Drill de escape abajo", type: "Clip", tag: "Abajo", assigned: "Hoy" },
  { title: "Notas de pelea de manos", type: "Enlace", tag: "Neutral", assigned: "Opcional" }
];

const ANNOUNCEMENTS = [
  { title: "Team meeting at 3:30 PM", detail: "Bring your notebook.", time: "Today" },
  { title: "Schedule change", detail: "Practice moved to 5:00 PM.", time: "Tomorrow" },
  { title: "Urgent update", detail: "Bus leaves at 1:30 PM sharp.", time: "Friday" },
  { title: "Tournament gear check", detail: "Singlet, shoes, ID.", time: "Friday" },
  { title: "Motivation", detail: "Win the first contact today.", time: "Tonight" }
];

const ANNOUNCEMENTS_ES = [
  { title: "Reunion del equipo a las 3:30 PM", detail: "Trae tu libreta.", time: "Hoy" },
  { title: "Cambio de horario", detail: "La practica pasa a las 5:00 PM.", time: "Manana" },
  { title: "Actualizacion urgente", detail: "El bus sale a la 1:30 PM en punto.", time: "Viernes" },
  { title: "Chequeo de equipo para torneo", detail: "Singlet, zapatos, ID.", time: "Viernes" },
  { title: "Motivacion", detail: "Gana el primer contacto hoy.", time: "Esta noche" }
];

const TEAM_STATS = [
  { title: "Check-ins Today", value: "5/7", note: "2 athletes missing" },
  { title: "Average Energy", value: "3.6", note: "Steady from last week" },
  { title: "Compliance Rate", value: "84%", note: "Goal: 90%" },
  { title: "Upcoming Events", value: "4", note: "2 in next 7 days" }
];

const TEAM_STATS_ES = [
  { title: "Chequeos hoy", value: "5/7", note: "Faltan 2 atletas" },
  { title: "Energia promedio", value: "3.6", note: "Estable desde la semana pasada" },
  { title: "Tasa de cumplimiento", value: "84%", note: "Meta: 90%" },
  { title: "Eventos proximos", value: "4", note: "2 en los proximos 7 dias" }
];

const TEAM_OVERVIEW = [
  "Athletes: 7 active",
  "Training plans: 3 running",
  "Upcoming tournaments: 2",
  "Alerts flagged: 3"
];

const TEAM_OVERVIEW_ES = [
  "Atletas: 7 activos",
  "Planes de entrenamiento: 3 en curso",
  "Torneos proximos: 2",
  "Alertas marcadas: 3"
];

const QUICK_ACTIONS = [
  "Create training plan",
  "Add calendar event",
  "Upload media",
  "View athlete profiles"
];

const QUICK_ACTIONS_ES = [
  "Crear plan de entrenamiento",
  "Agregar evento al calendario",
  "Subir multimedia",
  "Ver perfiles de atletas"
];

const ALERTS = [
  "2 athletes reported high soreness (4+).",
  "Low sleep detected for 3 athletes.",
  "Weight check needed for 125 lb class."
];

const ALERTS_ES = [
  "2 atletas reportaron dolor alto (4+).",
  "Se detecto poco sueno en 3 atletas.",
  "Se necesita chequeo de peso para 125 lb."
];

const COACH_ACCOUNT = [
  "Email: coach@wrestlingapp.com",
  "Password: ********",
  "Role: Coach (fixed)",
  "Secure access: Role-based permissions"
];

const COACH_ACCOUNT_ES = [
  "Correo: coach@wrestlingapp.com",
  "Contrasena: ********",
  "Rol: Entrenador (fijo)",
  "Acceso seguro: Permisos por rol"
];

const COACH_PROFILE = [
  "Name: Coach Morgan Hill",
  "Profile photo: Uploaded",
  "Country: United States",
  "City/State: Lincoln, NE",
  "Team type: School and club",
  "Primary discipline: Mixed",
  "School: Lincoln West (optional)",
  "Club: Midwest Grapplers (optional)"
];

const COACH_PROFILE_ES = [
  "Nombre: Coach Morgan Hill",
  "Foto de perfil: Subida",
  "Pais: Estados Unidos",
  "Ciudad/Estado: Lincoln, NE",
  "Tipo de equipo: Escuela y club",
  "Disciplina principal: Mixto",
  "Escuela: Lincoln West (opcional)",
  "Club: Midwest Grapplers (opcional)"
];

const COACH_DISCIPLINE = ["Freestyle", "Greco-Roman", "Folkstyle", "Mixed"];
const COACH_DISCIPLINE_ES = ["Estilo libre", "Greco-Romana", "Folkstyle", "Mixto"];
const COACH_STYLE = ["Technical", "Conditioning", "Strategy", "Balanced"];
const COACH_STYLE_ES = ["Tecnico", "Acondicionamiento", "Estrategia", "Balanceado"];

const COACH_INTERNATIONAL = [
  "International coaching: Yes",
  "Countries: Japan, Turkey, Canada",
  "Events: U23 Worlds, Pan-Am",
  "Experience: 6 years"
];

const COACH_INTERNATIONAL_ES = [
  "Coaching internacional: Si",
  "Paises: Japon, Turquia, Canada",
  "Eventos: Mundiales U23, Pan-Am",
  "Experiencia: 6 anos"
];

const ATHLETE_FILTERS = ["Weight class", "Wrestling style", "Availability", "Search by name"];

const ATHLETE_FILTERS_ES = ["Categoria de peso", "Estilo de lucha", "Disponibilidad", "Buscar por nombre"];

const SMART_TAGS = [
  { id: "aggressive", icon: "🔥", label: { en: "Aggressive", es: "Agresivo" } },
  { id: "solid-defense", icon: "🧱", label: { en: "Solid defense", es: "Defensa solida" } },
  { id: "fast", icon: "⚡", label: { en: "Fast", es: "Rapido" } },
  { id: "tires-opponent", icon: "⏱️", label: { en: "Tires opponent", es: "Cansa al rival" } },
  { id: "avoid-scramble", icon: "❌", label: { en: "Avoid scramble", es: "Evita scramble" } }
];

const ATHLETES = [
  {
    name: "Jaime Espinal",
    weight: "157 lb",
    style: "Freestyle",
    availability: "Available",
    preferred: "Single leg, snap down",
    international: "Pan-Am events",
    history: "Training history: 4 years",
    currentWeight: "157 lb",
    weightClass: "157",
    level: "Advanced",
    position: "Neutral",
    strategy: "Offensive",
    experienceYears: 8,
    favoritePosition: "neutral",
    offenseTop3: ["Single Leg", "High Crotch", "Snap Down"],
    defenseTop3: ["Sprawl", "Whizzer", "Hand Fighting"],
    psychTendency: "aggressive",
    tags: ["aggressive", "fast", "tires-opponent"],
    pressureError: "Reaching with the lead hand",
    coachSignal: "If they stall -> fake, snap, and re-attack",
    techniques: {
      neutral: ["Single Leg", "High Crotch", "Snap Down"],
      top: ["Half Nelson", "Tilt"],
      bottom: ["Stand-Up", "Switch"],
      defense: ["Sprawl", "Whizzer"]
    },
    notes: "Focus: Single leg chain"
  },
  {
    name: "Maya Cruz",
    weight: "123 lb",
    style: "Folkstyle",
    availability: "Limited",
    preferred: "Ankle pick, switch",
    international: "None",
    history: "Training history: 2 years",
    currentWeight: "123 lb",
    weightClass: "123",
    level: "Intermediate",
    position: "Bottom",
    strategy: "Balanced",
    experienceYears: 4,
    favoritePosition: "bottom",
    offenseTop3: ["Double Leg", "Switch", "Snap Down"],
    defenseTop3: ["Hand Fighting", "Sprawl", "Whizzer"],
    psychTendency: "conservative",
    tags: ["solid-defense", "avoid-scramble"],
    pressureError: "Backing straight up on shots",
    coachSignal: "If they shoot deep -> hip down and circle",
    techniques: {
      neutral: ["Double Leg", "Snap Down"],
      top: ["Breakdown"],
      bottom: ["Switch", "Sit-Out"],
      defense: ["Hand Fighting"]
    },
    notes: "Injury: ankle rehab"
  },
  {
    name: "Liam Park",
    weight: "141 lb",
    style: "Greco-Roman",
    availability: "Available",
    preferred: "Body lock, arm throw",
    international: "U23 camp",
    history: "Training history: 5 years",
    currentWeight: "141 lb",
    weightClass: "141",
    level: "Advanced",
    position: "Top",
    strategy: "Counter-based",
    experienceYears: 7,
    favoritePosition: "top",
    offenseTop3: ["Snap Down", "Body Lock", "Arm Throw"],
    defenseTop3: ["Whizzer", "Hand Fighting", "Sprawl"],
    psychTendency: "counterattack",
    tags: ["solid-defense", "avoid-scramble"],
    pressureError: "Waiting too long on ties",
    coachSignal: "If they pressure in -> lock and throw",
    techniques: {
      neutral: ["Snap Down"],
      top: ["Half Nelson", "Breakdown"],
      bottom: ["Stand-Up"],
      defense: ["Whizzer", "Hand Fighting"]
    },
    notes: "Top control emphasis"
  },
  {
    name: "Olivia Chen",
    weight: "170 lb",
    style: "Freestyle",
    availability: "Travel",
    preferred: "Double leg, half nelson",
    international: "Junior Worlds",
    history: "Training history: 6 years",
    currentWeight: "170 lb",
    weightClass: "170",
    level: "Advanced",
    position: "Neutral",
    strategy: "Balanced",
    experienceYears: 9,
    favoritePosition: "neutral",
    offenseTop3: ["Double Leg", "Single Leg", "Snap Down"],
    defenseTop3: ["Sprawl", "Whizzer", "Hand Fighting"],
    psychTendency: "aggressive",
    tags: ["aggressive", "fast"],
    pressureError: "Shooting from too far out",
    coachSignal: "If score is tied -> control center and score late",
    techniques: {
      neutral: ["Double Leg", "Single Leg"],
      top: ["Half Nelson"],
      bottom: ["Stand-Up"],
      defense: ["Sprawl", "Whizzer"]
    },
    notes: "Tournament prep"
  },
  {
    name: "Carlos Vega",
    weight: "133 lb",
    style: "Folkstyle",
    availability: "Available",
    preferred: "Single leg, ankle pick",
    international: "None",
    history: "Training history: 3 years",
    currentWeight: "133 lb",
    weightClass: "133",
    level: "Intermediate",
    position: "Neutral",
    strategy: "Balanced",
    experienceYears: 5,
    favoritePosition: "neutral",
    offenseTop3: ["Single Leg", "Double Leg", "Ankle Pick"],
    defenseTop3: ["Sprawl", "Hand Fighting", "Whizzer"],
    psychTendency: "conservative",
    tags: ["fast", "tires-opponent"],
    pressureError: "Overcommitting on the first shot",
    coachSignal: "If first shot fails -> immediately reshoot",
    techniques: {
      neutral: ["Single Leg", "Double Leg"],
      top: ["Breakdown"],
      bottom: ["Stand-Up", "Switch"],
      defense: ["Sprawl"]
    },
    notes: "Focus: chain attacks"
  },
  {
    name: "Sophia Reyes",
    weight: "115 lb",
    style: "Freestyle",
    availability: "Available",
    preferred: "High crotch, snap down",
    international: "Cadet camp",
    history: "Training history: 4 years",
    currentWeight: "115 lb",
    weightClass: "115",
    level: "Intermediate",
    position: "Top",
    strategy: "Offensive",
    experienceYears: 6,
    favoritePosition: "top",
    offenseTop3: ["High Crotch", "Snap Down", "Tilt"],
    defenseTop3: ["Whizzer", "Hand Fighting", "Sprawl"],
    psychTendency: "aggressive",
    tags: ["aggressive", "fast"],
    pressureError: "Forcing turns without control",
    coachSignal: "If you get to top -> secure wrist, then turn",
    techniques: {
      neutral: ["High Crotch", "Snap Down"],
      top: ["Half Nelson", "Tilt"],
      bottom: ["Sit-Out"],
      defense: ["Whizzer", "Hand Fighting"]
    },
    notes: "Improve top turns"
  },
  {
    name: "Ethan Brooks",
    weight: "189 lb",
    style: "Greco-Roman",
    availability: "Limited",
    preferred: "Body lock, arm throw",
    international: "Pan-Am trials",
    history: "Training history: 5 years",
    currentWeight: "189 lb",
    weightClass: "189",
    level: "Advanced",
    position: "Top",
    strategy: "Counter-based",
    experienceYears: 8,
    favoritePosition: "top",
    offenseTop3: ["Body Lock", "Snap Down", "Arm Throw"],
    defenseTop3: ["Whizzer", "Sprawl", "Hand Fighting"],
    psychTendency: "counterattack",
    tags: ["solid-defense", "tires-opponent"],
    pressureError: "Pausing after defending",
    coachSignal: "If they reset slow -> go right away",
    techniques: {
      neutral: ["Snap Down"],
      top: ["Breakdown"],
      bottom: ["Stand-Up"],
      defense: ["Whizzer"]
    },
    notes: "Manage conditioning load"
  }
];

const JOURNAL_INSIGHTS = [
  "Readiness average: 3.7/5 this week",
  "Soreness trend: down 8%",
  "Sleep trend: down 0.6 hours"
];

const JOURNAL_INSIGHTS_ES = [
  "Promedio de disponibilidad: 3.7/5 esta semana",
  "Tendencia de dolor: baja 8%",
  "Tendencia de sueno: baja 0.6 horas"
];

const JOURNAL_FLAGS = [
  "2 athletes with soreness 4+",
  "Low sleep alert for 3 athletes",
  "Weight cut week flag for 125 lb class",
  "Overtraining risk: 1 athlete",
  "Readiness dip ahead of tournament"
];

const JOURNAL_FLAGS_ES = [
  "2 atletas con dolor 4+",
  "Alerta de poco sueno para 3 atletas",
  "Semana de corte de peso para 125 lb",
  "Riesgo de sobreentrenamiento: 1 atleta",
  "Baja de disponibilidad antes del torneo"
];

const JOURNAL_ATHLETES = [
  {
    name: "Jaime Espinal",
    sleep: "7.2 hrs",
    energy: "4/5",
    soreness: "2/5",
    mood: "3/5",
    weight: "Stable"
  },
  {
    name: "Maya Cruz",
    sleep: "6.0 hrs",
    energy: "3/5",
    soreness: "4/5",
    mood: "2/5",
    weight: "Down 1.5 lb"
  },
  {
    name: "Liam Park",
    sleep: "7.8 hrs",
    energy: "4/5",
    soreness: "3/5",
    mood: "4/5",
    weight: "Stable"
  },
  {
    name: "Olivia Chen",
    sleep: "6.4 hrs",
    energy: "3/5",
    soreness: "3/5",
    mood: "3/5",
    weight: "Cut plan"
  },
  {
    name: "Carlos Vega",
    sleep: "7.0 hrs",
    energy: "4/5",
    soreness: "2/5",
    mood: "4/5",
    weight: "Stable"
  },
  {
    name: "Sophia Reyes",
    sleep: "6.6 hrs",
    energy: "3/5",
    soreness: "3/5",
    mood: "3/5",
    weight: "On track"
  },
  {
    name: "Ethan Brooks",
    sleep: "6.2 hrs",
    energy: "3/5",
    soreness: "4/5",
    mood: "2/5",
    weight: "Stable"
  }
];

const JOURNAL_ATHLETES_ES = [
  {
    name: "Jaime Espinal",
    sleep: "7.2 hrs",
    energy: "4/5",
    soreness: "2/5",
    mood: "3/5",
    weight: "Estable"
  },
  {
    name: "Maya Cruz",
    sleep: "6.0 hrs",
    energy: "3/5",
    soreness: "4/5",
    mood: "2/5",
    weight: "Bajo 1.5 lb"
  },
  {
    name: "Liam Park",
    sleep: "7.8 hrs",
    energy: "4/5",
    soreness: "3/5",
    mood: "4/5",
    weight: "Estable"
  },
  {
    name: "Olivia Chen",
    sleep: "6.4 hrs",
    energy: "3/5",
    soreness: "3/5",
    mood: "3/5",
    weight: "Plan de corte"
  },
  {
    name: "Carlos Vega",
    sleep: "7.0 hrs",
    energy: "4/5",
    soreness: "2/5",
    mood: "4/5",
    weight: "Estable"
  },
  {
    name: "Sophia Reyes",
    sleep: "6.6 hrs",
    energy: "3/5",
    soreness: "3/5",
    mood: "3/5",
    weight: "En camino"
  },
  {
    name: "Ethan Brooks",
    sleep: "6.2 hrs",
    energy: "3/5",
    soreness: "4/5",
    mood: "2/5",
    weight: "Estable"
  }
];

const SKILLS = [
  { name: "Single Leg", rating: "Strong", updated: "2 days ago", clip: "Finish to shelf", notes: "Keep head tight to hip." },
  { name: "Half Nelson", rating: "Developing", updated: "1 week ago", clip: "Top control series", notes: "Improve hand placement." },
  { name: "Stand-Up", rating: "Strong", updated: "3 days ago", clip: "Explosive stand-up", notes: "Explode on whistle." },
  { name: "Sprawl", rating: "Needs work", updated: "5 days ago", clip: "Defense drill", notes: "Drop hips faster." },
  { name: "Hand Fight", rating: "Developing", updated: "Yesterday", clip: "Inside control", notes: "Win wrist control first." },
  { name: "Double Leg", rating: "Developing", updated: "4 days ago", clip: "Finish to corner", notes: "Cut the corner earlier." }
];

const SKILLS_ES = [
  { name: "Pierna simple", rating: "Fuerte", updated: "Hace 2 dias", clip: "Final a la repisa", notes: "Mantener la cabeza pegada a la cadera." },
  { name: "Medio nelson", rating: "En desarrollo", updated: "Hace 1 semana", clip: "Serie de control arriba", notes: "Mejorar la colocacion de manos." },
  { name: "Pararse", rating: "Fuerte", updated: "Hace 3 dias", clip: "Parada explosiva", notes: "Explota al silbato." },
  { name: "Sprawl", rating: "Necesita trabajo", updated: "Hace 5 dias", clip: "Drill de defensa", notes: "Bajar la cadera mas rapido." },
  { name: "Pelea de manos", rating: "En desarrollo", updated: "Ayer", clip: "Control interno", notes: "Ganar el control de muneca primero." },
  { name: "Doble pierna", rating: "En desarrollo", updated: "Hace 4 dias", clip: "Final a la esquina", notes: "Cortar la esquina antes." }
];

const PERMISSIONS = {
  can: [
    "Create and edit training plans",
    "View athlete profiles and journals",
    "Assign media and evaluate skills",
    "Send announcements and updates",
    "Edit competition summary coaching notes"
  ],
  cannot: [
    "Edit athlete self-reported journal entries",
    "Edit athlete account credentials",
    "Access other teams without permission",
    "Edit athlete core profile data"
  ]
};

const PERMISSIONS_ES = {
  can: [
    "Crear y editar planes de entrenamiento",
    "Ver perfiles y diarios de atletas",
    "Asignar multimedia y evaluar tecnicas",
    "Enviar avisos y actualizaciones",
    "Editar notas del resumen de competencia"
  ],
  cannot: [
    "Editar entradas del diario reportadas por el atleta",
    "Editar credenciales de la cuenta del atleta",
    "Acceder a otros equipos sin permiso",
    "Editar datos base del perfil del atleta"
  ]
};

const COACH_DESIGN = [
  "Desktop-first efficiency",
  "Fast navigation",
  "Data-rich but clean UI",
  "Minimal friction for daily work"
];

const COACH_DESIGN_ES = [
  "Eficiencia primero en escritorio",
  "Navegacion rapida",
  "UI con muchos datos pero limpia",
  "Minima friccion para el trabajo diario"
];

const COACH_MESSAGES = [
  {
    athlete: "Jaime Espinal",
    tag: "Tournament Info",
    text: "Weigh-ins at 7:00 AM. Bring singlet and ID.",
    time: "Today"
  },
  {
    athlete: "Maya Cruz",
    tag: "Training Update",
    text: "Recovery session after school. 30 minutes bike + stretch.",
    time: "Yesterday"
  },
  {
    athlete: "Liam Park",
    tag: "Reminder",
    text: "Watch single leg finish video before practice.",
    time: "Today"
  }
];

const COACH_MESSAGES_ES = [
  {
    athlete: "Jaime Espinal",
    tag: "Info de torneo",
    text: "Pesajes a las 7:00 AM. Trae singlet y ID.",
    time: "Hoy"
  },
  {
    athlete: "Maya Cruz",
    tag: "Actualizacion de entrenamiento",
    text: "Sesion de recuperacion despues de clases. 30 minutos bici + estirar.",
    time: "Ayer"
  },
  {
    athlete: "Liam Park",
    tag: "Recordatorio",
    text: "Mira el video de final de pierna simple antes de la practica.",
    time: "Hoy"
  }
];

const VALUE_TRANSLATIONS_ES = {
  Freestyle: "Estilo libre",
  "Greco-Roman": "Greco-Romana",
  Folkstyle: "Folkstyle",
  Mixed: "Mixto",
  Available: "Disponible",
  Limited: "Limitado",
  Travel: "Viaje",
  "Single leg, snap down": "Pierna simple, snap down",
  "Ankle pick, switch": "Ankle pick, switch",
  "Body lock, arm throw": "Body lock, arm throw",
  "Double leg, half nelson": "Doble pierna, medio nelson",
  "Single leg, ankle pick": "Pierna simple, ankle pick",
  "High crotch, snap down": "High crotch, snap down",
  "Pan-Am events": "Eventos Pan-Am",
  None: "Ninguna",
  "U23 camp": "Campamento U23",
  "Junior Worlds": "Mundiales junior",
  "Cadet camp": "Campamento cadete",
  "Pan-Am trials": "Pruebas Pan-Am",
  "Training history: 4 years": "Historial de entrenamiento: 4 anos",
  "Training history: 2 years": "Historial de entrenamiento: 2 anos",
  "Training history: 5 years": "Historial de entrenamiento: 5 anos",
  "Training history: 6 years": "Historial de entrenamiento: 6 anos",
  "Training history: 3 years": "Historial de entrenamiento: 3 anos",
  "Focus: Single leg chain": "Enfoque: Cadena de pierna simple",
  "Injury: ankle rehab": "Lesion: rehab de tobillo",
  "Top control emphasis": "Enfoque: Control arriba",
  "Tournament prep": "Preparacion para torneo",
  "Focus: chain attacks": "Enfoque: Ataques en cadena",
  "Improve top turns": "Mejorar giros arriba",
  "Manage conditioning load": "Manejar carga de acondicionamiento",
  Strong: "Fuerte",
  Developing: "En desarrollo",
  "Needs work": "Necesita trabajo",
  Yesterday: "Ayer",
  Today: "Hoy",
  Tomorrow: "Manana",
  Tonight: "Esta noche",
  Stable: "Estable",
  Aggressive: "Agresivo",
  Conservative: "Conservador",
  Counterattack: "Contraataque",
  aggressive: "Agresivo",
  conservative: "Conservador",
  counterattack: "Contraataque"
};

function translateOptionValue(selectId, value) {
  if (!value) return value;
  const table = SELECT_COPY[selectId];
  if (!table) return value;
  const map = table[currentLang] || table.en;
  return map?.[value] || value;
}

function translateValue(value) {
  if (currentLang !== "es") return value;
  return VALUE_TRANSLATIONS_ES[value] || value;
}

function translateTechnique(name) {
  const copy = TECHNIQUE_LABELS[name];
  if (!copy) return name;
  return pickCopy(copy);
}

function translateTechniqueList(list) {
  return (list || []).map((item) => translateTechnique(item));
}

function getWeekPlanData() {
  return currentLang === "es" ? WEEK_PLAN_ES : WEEK_PLAN;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateKey(key) {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueNames(list) {
  const seen = new Set();
  const result = [];
  (list || []).forEach((name) => {
    const key = normalizeName(name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(String(name).trim());
  });
  return result;
}

function defaultAudience() {
  return { all: false, athletes: [] };
}

function normalizeAudience(audience) {
  const base = defaultAudience();
  if (!audience || typeof audience !== "object") return base;
  return {
    all: audience.all === true,
    athletes: uniqueNames(audience.athletes)
  };
}

function normalizeCalendarEntry(entry) {
  if (Array.isArray(entry)) {
    return {
      items: entry.map((item) => String(item).trim()).filter(Boolean),
      audience: { all: true, athletes: [] }
    };
  }

  if (!entry || typeof entry !== "object") {
    return { items: [], audience: defaultAudience() };
  }

  const items = Array.isArray(entry.items)
    ? entry.items.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const audience = normalizeAudience(entry.audience);
  return { items, audience };
}

function mergeCalendarEntries(a, b) {
  const left = normalizeCalendarEntry(a);
  const right = normalizeCalendarEntry(b);
  const items = [...left.items, ...right.items];
  const audience = {
    all: left.audience.all || right.audience.all,
    athletes: uniqueNames([...(left.audience.athletes || []), ...(right.audience.athletes || [])])
  };
  return { items, audience };
}

function migrateLegacyCalendarEvents(events) {
  if (!events || typeof events !== "object") return { events: {}, changed: false };
  const next = {};
  let changed = false;
  const weekStart = startOfWeek(new Date());

  Object.entries(events).forEach(([key, value]) => {
    if (isDateKey(key)) {
      const normalized = normalizeCalendarEntry(value);
      if (normalized.items.length) {
        next[key] = next[key] ? mergeCalendarEntries(next[key], normalized) : normalized;
      } else {
        changed = true;
      }
      return;
    }

    const dayIdx = Number.parseInt(key, 10);
    if (Number.isFinite(dayIdx) && dayIdx >= 0 && dayIdx < 7) {
      const dateKey = toDateKey(addDays(weekStart, dayIdx));
      const normalized = normalizeCalendarEntry(value);
      if (normalized.items.length) {
        next[dateKey] = next[dateKey] ? mergeCalendarEntries(next[dateKey], normalized) : normalized;
      }
      changed = true;
      return;
    }

    changed = true;
  });

  return { events: next, changed };
}

function getStoredCalendarEvents() {
  try {
    const raw = localStorage.getItem(CALENDAR_EVENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const { events, changed } = migrateLegacyCalendarEvents(parsed);
    if (changed) setStoredCalendarEvents(events);
    return events;
  } catch {
    return {};
  }
}

function setStoredCalendarEvents(events) {
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events || {}));
}

function getCalendarEventsData() {
  const stored = getStoredCalendarEvents();
  if (Object.keys(stored).length) return stored;
  return currentLang === "es" ? CALENDAR_EVENTS_ES : CALENDAR_EVENTS;
}

function getMediaItemsData() {
  return currentLang === "es" ? MEDIA_ITEMS_ES : MEDIA_ITEMS;
}

function getAnnouncementsData() {
  return currentLang === "es" ? ANNOUNCEMENTS_ES : ANNOUNCEMENTS;
}

function getTeamStatsData() {
  return currentLang === "es" ? TEAM_STATS_ES : TEAM_STATS;
}

function getTeamOverviewData() {
  return currentLang === "es" ? TEAM_OVERVIEW_ES : TEAM_OVERVIEW;
}

function getQuickActionsData() {
  return currentLang === "es" ? QUICK_ACTIONS_ES : QUICK_ACTIONS;
}

function getAlertsData() {
  return currentLang === "es" ? ALERTS_ES : ALERTS;
}

function getCoachAccountData() {
  return currentLang === "es" ? COACH_ACCOUNT_ES : COACH_ACCOUNT;
}

function getCoachProfileData() {
  return currentLang === "es" ? COACH_PROFILE_ES : COACH_PROFILE;
}

function getCoachDisciplineData() {
  return currentLang === "es" ? COACH_DISCIPLINE_ES : COACH_DISCIPLINE;
}

function getCoachStyleData() {
  return currentLang === "es" ? COACH_STYLE_ES : COACH_STYLE;
}

function getCoachInternationalData() {
  return currentLang === "es" ? COACH_INTERNATIONAL_ES : COACH_INTERNATIONAL;
}

function getAthleteFiltersData() {
  return currentLang === "es" ? ATHLETE_FILTERS_ES : ATHLETE_FILTERS;
}

function getSmartTagDef(tagId) {
  return SMART_TAGS.find((tag) => tag.id === tagId) || null;
}

function smartTagLabel(tagId) {
  const def = getSmartTagDef(tagId);
  if (!def) return tagId;
  return pickCopy(def.label);
}

function formatSmartTag(tagId) {
  const def = getSmartTagDef(tagId);
  if (!def) return tagId;
  return `${def.icon} ${pickCopy(def.label)}`;
}

function normalizeSmartTags(tags) {
  if (!Array.isArray(tags)) return [];
  const allowed = new Set(SMART_TAGS.map((tag) => tag.id));
  return tags.filter((tag) => allowed.has(tag));
}

function localizeAthlete(athlete) {
  if (currentLang !== "es") return athlete;
  return {
    ...athlete,
    style: translateValue(athlete.style),
    availability: translateValue(athlete.availability),
    preferred: translateValue(athlete.preferred),
    international: translateValue(athlete.international),
    history: translateValue(athlete.history),
    level: getLevelLabel(athlete.level),
    position: translateOptionValue("pPosition", athlete.position),
    strategy: translateOptionValue("pStrategy", athlete.strategy),
    notes: translateValue(athlete.notes),
    tags: normalizeSmartTags(athlete.tags)
  };
}

function getAthletesData() {
  const profile = getProfile();
  const merged = ATHLETES.map((athlete) => {
    if (!profile || profile.role !== "athlete" || !profile.name || profile.name !== athlete.name) {
      return { ...athlete, tags: normalizeSmartTags(athlete.tags) };
    }
    const profileTags = normalizeSmartTags(profile.tags);
    return {
      ...athlete,
      ...profile,
      tags: profileTags.length ? profileTags : normalizeSmartTags(athlete.tags),
      favoritePosition: profile.favoritePosition || athlete.favoritePosition,
      psychTendency: profile.psychTendency || athlete.psychTendency,
      offenseTop3: Array.isArray(profile.offenseTop3) && profile.offenseTop3.length
        ? profile.offenseTop3
        : athlete.offenseTop3,
      defenseTop3: Array.isArray(profile.defenseTop3) && profile.defenseTop3.length
        ? profile.defenseTop3
        : athlete.defenseTop3
    };
  });
  const profileName = profile?.role === "athlete" ? profile.name : "";
  const hasProfileMatch = profileName && merged.some((athlete) => athlete.name === profileName);
  if (profileName && !hasProfileMatch) {
    const profileTags = normalizeSmartTags(profile.tags);
    const styleEnglish = SELECT_COPY.aStyle?.en?.[profile.style] || profile.style || "";
    const preferred = profile.trainingFocus || profile.offenseTop3?.[0] || "";
    const years = profile.years ? String(profile.years) : "";
    merged.push({
      ...profile,
      name: profileName,
      weight: profile.currentWeight || "",
      style: styleEnglish,
      availability: "Available",
      preferred,
      international: profile.internationalEvents || (profile.international === "yes" ? "International" : "None"),
      history: years ? `Training history: ${years} years` : "",
      notes: profile.resultsHistory || "",
      experienceYears: years || profile.experienceYears || "",
      favoritePosition: profile.favoritePosition || profile.position || "neutral",
      psychTendency: profile.psychTendency || strategyToTendency(profile.strategy),
      offenseTop3: Array.isArray(profile.offenseTop3) ? profile.offenseTop3 : [],
      defenseTop3: Array.isArray(profile.defenseTop3) ? profile.defenseTop3 : [],
      tags: profileTags
    });
  }
  return currentLang === "es" ? merged.map((athlete) => localizeAthlete(athlete)) : merged;
}

function getJournalInsightsData() {
  return currentLang === "es" ? JOURNAL_INSIGHTS_ES : JOURNAL_INSIGHTS;
}

function getJournalFlagsData() {
  return currentLang === "es" ? JOURNAL_FLAGS_ES : JOURNAL_FLAGS;
}

function getJournalAthletesData() {
  return currentLang === "es" ? JOURNAL_ATHLETES_ES : JOURNAL_ATHLETES;
}

function getSkillsData() {
  return currentLang === "es" ? SKILLS_ES : SKILLS;
}

function getPermissionsData() {
  return currentLang === "es" ? PERMISSIONS_ES : PERMISSIONS;
}

function getCoachDesignData() {
  return currentLang === "es" ? COACH_DESIGN_ES : COACH_DESIGN;
}

function getCoachMessagesData() {
  return currentLang === "es" ? COACH_MESSAGES_ES : COACH_MESSAGES;
}

function getMonthNames() {
  return MONTH_NAMES_BY_LANG[currentLang] || MONTH_NAMES_BY_LANG.en;
}

function getDayAbbr() {
  return DAY_ABBR_BY_LANG[currentLang] || DAY_ABBR_BY_LANG.en;
}

// ---------- TABS ----------
const tabBtns = Array.from(document.querySelectorAll(".tab"));
const panels = {
  today: document.getElementById("panel-today"),
  "athlete-profile": document.getElementById("panel-athlete-profile"),
  training: document.getElementById("panel-training"),
  calendar: document.getElementById("panel-calendar"),
  media: document.getElementById("panel-media"),
  journal: document.getElementById("panel-journal"),
  favorites: document.getElementById("panel-favorites"),
  announcements: document.getElementById("panel-announcements"),
  dashboard: document.getElementById("panel-dashboard"),
  "coach-profile": document.getElementById("panel-coach-profile"),
  athletes: document.getElementById("panel-athletes"),
  "coach-match": document.getElementById("panel-coach-match"),
  plans: document.getElementById("panel-plans"),
  "calendar-manager": document.getElementById("panel-calendar-manager"),
  "media-library": document.getElementById("panel-media-library"),
  "athlete-notes": document.getElementById("panel-athlete-notes"),
  skills: document.getElementById("panel-skills"),
  "journal-monitor": document.getElementById("panel-journal-monitor"),
  messages: document.getElementById("panel-messages"),
  permissions: document.getElementById("panel-permissions"),
  future: document.getElementById("panel-future"),
  "competition-preview": document.getElementById("panel-competition-preview")
};

async function showTab(name) {
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  Object.entries(panels).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", k !== name);
  });

  if (name === "plans" && templatePdfBytes && window.PDFLib) {
    await generateFilledPdf({ download: false });
  }

  if (name === "coach-match" && coachMatchSelect?.value) {
    renderCoachMatchView(coachMatchSelect.value);
  }

  if (name === "calendar-manager") {
    renderCalendarManager();
  }
}

function setRoleUI(role, view = "athlete") {
  const roleName = role === "coach" ? "coach" : "athlete";
  tabBtns.forEach((btn) => {
    const viewAttr = btn.dataset.views;
    let visible = true;
    if (viewAttr) {
      const allowedViews = viewAttr.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
      visible = allowedViews.includes(view);
    } else if (btn.dataset.role) {
      const allowedRoles = (btn.dataset.role || "").split(" ");
      visible = allowedRoles.includes(roleName);
    }
    btn.hidden = !visible;
    if (!visible) btn.classList.remove("active");
  });

  if (view === "admin" || view === "parent" || roleName === "coach") {
    const key = view === "admin" ? "admin" : view === "parent" ? "parent" : "coach";
    const text =
      currentLang === "es" ? VIEW_META_TEXT[key].es : VIEW_META_TEXT[key].en;
    roleMeta.textContent = text;
  } else {
    roleMeta.textContent = currentLang === "es"
      ? VIEW_META_TEXT.athlete.es
      : VIEW_META_TEXT.athlete.en;
  }

  const defaultTab = view === "admin"
    ? "dashboard"
    : view === "parent"
      ? "athlete-notes"
      : roleName === "coach"
        ? "dashboard"
        : "today";
  showTab(defaultTab);
}

tabBtns.forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tab)));
setView(currentView);
refreshHeaderViewButtons();

// ---------- PLAN SUBTABS ----------
const subtabButtons = Array.from(document.querySelectorAll(".subtab"));
const subpanels = Array.from(document.querySelectorAll(".subpanel"));

function showSubtab(name) {
  subtabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.subtab === name));
  subpanels.forEach((panel) => panel.classList.toggle("hidden", panel.id !== name));
}

subtabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    showSubtab(btn.dataset.subtab);
    updatePlanRangeType(btn.dataset.subtab);
  });
});

if (subtabButtons.length) {
  const initial = subtabButtons[0].dataset.subtab;
  showSubtab(initial);
  updatePlanRangeType(initial);
}

// ---------- DAILY PLAN SELECTIONS ----------
const selectionBlocks = Array.from(document.querySelectorAll(".selection-block"));
const accordionToggles = Array.from(document.querySelectorAll(".accordion-toggle"));
const accordionPanels = Array.from(document.querySelectorAll(".accordion-panel"));
const doneDailyPlan = document.getElementById("doneDailyPlan");
const saveDailyPlan = document.getElementById("saveDailyPlan");
const shareDailyPlan = document.getElementById("shareDailyPlan");
const printDailyPlan = document.getElementById("printDailyPlan");
const templateFile = document.getElementById("templateFile");
const uploadTemplateBtn = document.getElementById("uploadTemplateBtn");
const generateTemplateBtn = document.getElementById("generateTemplateBtn");
const printTemplatePlan = document.getElementById("printTemplatePlan");
const templateStatus = document.getElementById("templateStatus");
const templateHelpBtn = document.getElementById("templateHelpBtn");
const templateHelpPanel = document.getElementById("templateHelpPanel");
const templatePreview = document.getElementById("templatePreview");
const templatePreviewFrame = document.getElementById("templatePreviewFrame");
const templatesBtn = document.getElementById("templatesBtn");
const templateConfirm = document.getElementById("templateConfirm");
const templateGoBtn = document.getElementById("templateGoBtn");
const templateNoBtn = document.getElementById("templateNoBtn");
const templateDropzone = document.getElementById("templateDropzone");
let templatePdfBytes = null;
let lastFilledPdfUrl = null;
let pendingTemplatePrint = false;

const planCalendarContainer = document.getElementById("planCalendarContainer");
const seasonYearSelect = document.getElementById("season-year-select");
const planRangeStartInput = document.getElementById("planRangeStart");
const planRangeEndInput = document.getElementById("planRangeEnd");
const planRangeEndWrapper = document.getElementById("planRangeEndWrapper");
const planRangeHint = document.getElementById("planRangeHint");
const planRangeHeading = document.getElementById("planRangeHeading");
const planRangeStartTitle = document.getElementById("planRangeStartTitle");
const planRangeEndTitle = document.getElementById("planRangeEndTitle");
let planRangeType = "day";
let planRangeSelection = { start: new Date(), end: new Date() };
let planCalendarYear = new Date().getFullYear();
let planCalendarMonth = new Date().getMonth();
const PLAN_RANGE_KEY_MAP = {
  "plan-daily": "day",
  "plan-weekly": "week",
  "plan-monthly": "month",
  "plan-season": "season"
};

const planMonthlySelection = document.getElementById("planMonthlySelection");
const planMonthlyNotes = document.getElementById("planMonthlyNotes");
const planMonthlyClear = document.getElementById("planMonthlyClear");
const planMonthlySave = document.getElementById("planMonthlySave");

const planMonthPrevBtn = document.getElementById("planMonthPrev");
const planMonthNextBtn = document.getElementById("planMonthNext");
const planCalendarLabel = document.getElementById("planCalendarLabel");

function getCalendarContainers() {
    return [planCalendarContainer].filter(Boolean);
}

function formatMonthlySelection(date) {
    if (!date) return "";
    const locale = currentLang === "es" ? "es-ES" : "en-US";
    return new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function updateMonthlySelectionLabel() {
    if (!planMonthlySelection) return;
    if (!planRangeSelection.start) {
        planMonthlySelection.textContent = "Selecciona un día para comenzar.";
        return;
    }
    planMonthlySelection.textContent = `Día seleccionado: ${formatMonthlySelection(planRangeSelection.start)}`;
}

function updateCalendarLabels() {
    if (planCalendarLabel) {
        const name = getMonthNames()[planCalendarMonth] || "";
        planCalendarLabel.textContent = `${name} ${planCalendarYear}`;
    }
}

if (planMonthlyClear) {
    planMonthlyClear.addEventListener("click", () => {
        if (planMonthlyNotes) planMonthlyNotes.value = "";
        toast(currentLang === "es" ? "Notas borradas." : "Notes cleared.");
    });
}

if (planMonthlySave) {
    planMonthlySave.addEventListener("click", () => {
        const targetDate = planRangeSelection.start;
        if (!targetDate) {
            toast(currentLang === "es" ? "Selecciona un día primero." : "Select a day first.");
            return;
        }
        const formatted = formatMonthlySelection(targetDate);
        toast(
            currentLang === "es"
                ? `Plan guardado para ${formatted}.`
                : `Plan saved for ${formatted}.`
        );
    });
}

if (planMonthPrevBtn) {
    planMonthPrevBtn.addEventListener("click", () => {
        const newDate = new Date(planCalendarYear, planCalendarMonth - 1, 1);
        renderPlanCalendar(newDate.getFullYear(), newDate.getMonth());
    });
}

if (planMonthNextBtn) {
    planMonthNextBtn.addEventListener("click", () => {
        const newDate = new Date(planCalendarYear, planCalendarMonth + 1, 1);
        renderPlanCalendar(newDate.getFullYear(), newDate.getMonth());
    });
}

function renderPlanCalendar(year, month) {
    const containers = getCalendarContainers();
    if (!containers.length) return;
    planCalendarYear = year;
    planCalendarMonth = month;
    const monthNames = getMonthNames();
    const daysOfWeek = getDayAbbr();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const buildCalendarHtml = () => {
        let html = '<div class="calendar-grid-days">';
        daysOfWeek.forEach(day => {
            html += `<div class="calendar-day-name">${day}</div>`;
        });

        for (let i = 0; i < startDayOfWeek; i++) {
            html += `<div></div>`;
        }

        for (let i = 1; i <= numDays; i++) {
            const todayMark = (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) ? 'today' : '';
            html += `<div class="calendar-day ${todayMark}" data-day="${i}">${i}</div>`;
        }

        html += '</div>';
        return html;
    };

    containers.forEach((container) => {
        container.innerHTML = buildCalendarHtml();
        container.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => handlePlanDayClick(dayEl));
        });
    });

    updateCalendarLabels();
    highlightPlanRange();
}

function initializePlanSelectors() {
    if (!document.getElementById('panel-plans')) return;
    const today = new Date();
    renderPlanCalendar(today.getFullYear(), today.getMonth());
    updateRangeInputsFromSelection();
}

function toIsoDate(date) {
    if (!date || Number.isNaN(date.getTime())) return "";
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function parseDateInput(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function updateRangeInputsFromSelection() {
    if (planRangeStartInput) {
        planRangeStartInput.value = toIsoDate(planRangeSelection.start);
    }
    if (planRangeEndInput) {
        planRangeEndInput.value = planRangeType === "day"
            ? toIsoDate(planRangeSelection.start)
            : toIsoDate(planRangeSelection.end);
    }
    highlightPlanRange();
}

function updateSelectionFromInputs() {
    const startValue = parseDateInput(planRangeStartInput?.value);
    const endValue = parseDateInput(planRangeEndInput?.value);
    if (planRangeType === "day") {
        planRangeSelection.start = startValue || planRangeSelection.start;
        planRangeSelection.end = planRangeSelection.start;
    } else {
        planRangeSelection.start = startValue || planRangeSelection.start;
        planRangeSelection.end = endValue;
        if (
            planRangeSelection.start &&
            planRangeSelection.end &&
            planRangeSelection.end < planRangeSelection.start
        ) {
            [planRangeSelection.start, planRangeSelection.end] = [
                planRangeSelection.end,
                planRangeSelection.start
            ];
        }
    }
    highlightPlanRange();
}

function highlightPlanRange() {
    const containers = getCalendarContainers();
    if (!containers.length) return;
    const start = planRangeSelection.start;
    const end = planRangeType === "day"
        ? start
        : planRangeSelection.end;
    containers.forEach((container) => {
        const days = Array.from(container.querySelectorAll(".calendar-day"));
        days.forEach((dayEl) => {
            const dayNum = Number(dayEl.dataset.day);
            if (!dayNum) {
                dayEl.classList.remove("range-start", "range-end", "range-between");
                return;
            }
            const date = new Date(planCalendarYear, planCalendarMonth, dayNum);
            dayEl.classList.remove("range-start", "range-between", "range-end");
            if (start && date.getTime() === start.getTime()) {
                dayEl.classList.add("range-start");
            }
            if (end && date.getTime() === end.getTime()) {
                dayEl.classList.add("range-end");
            }
            if (start && end && date > start && date < end) {
                dayEl.classList.add("range-between");
            }
        });
    });
    updateMonthlySelectionLabel();
}

function handlePlanDayClick(dayEl) {
    const dayValue = Number(dayEl.dataset.day);
    if (!dayValue) return;
    const clicked = new Date(planCalendarYear, planCalendarMonth, dayValue);
    if (planRangeType === "day") {
        planRangeSelection.start = clicked;
        planRangeSelection.end = clicked;
    } else if (!planRangeSelection.start || (planRangeSelection.start && planRangeSelection.end)) {
        planRangeSelection.start = clicked;
        planRangeSelection.end = null;
    } else {
        planRangeSelection.end = clicked;
        if (planRangeSelection.end < planRangeSelection.start) {
            [planRangeSelection.start, planRangeSelection.end] = [
                planRangeSelection.end,
                planRangeSelection.start
            ];
        }
    }
    updateRangeInputsFromSelection();
}

function updatePlanRangeType(subtabKey) {
    const nextType = PLAN_RANGE_KEY_MAP[subtabKey] || "day";
    planRangeType = nextType;
    if (planRangeEndWrapper) {
        planRangeEndWrapper.classList.toggle("hidden", planRangeType === "day");
    }
    if (planRangeType === "day") {
        planRangeSelection.end = planRangeSelection.start;
    }
    updateRangeInputsFromSelection();
    highlightPlanRange();
    if (planRangeHint) {
        planRangeHint.textContent = pickCopy(PLAN_RANGE_HINT[planRangeType]);
    }
}

if (planRangeStartInput) {
    planRangeStartInput.addEventListener("change", () => updateSelectionFromInputs());
}
if (planRangeEndInput) {
    planRangeEndInput.addEventListener("change", () => updateSelectionFromInputs());
}

function addChosenItem(listEl, value) {
  if (!value) return;
  const exists = Array.from(listEl.children).some((li) => li.dataset.value === value);
  if (exists) return;
  const li = document.createElement("li");
  li.dataset.value = value;
  li.textContent = value;
  listEl.appendChild(li);
}

function getCoachKey() {
  const profile = getProfile();
  if (!profile || profile.role !== "coach") return "coach";
  return (profile.name || "coach").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getCustomOptions() {
  const key = `wpl_custom_options_${getCoachKey()}`;
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch { return {}; }
}

function setCustomOptions(data) {
  const key = `wpl_custom_options_${getCoachKey()}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function addCustomOption(blockKey, value) {
  if (!blockKey || !value) return;
  const data = getCustomOptions();
  const list = data[blockKey] || [];
  if (!list.includes(value)) {
    data[blockKey] = [...list, value];
    setCustomOptions(data);
  }
}

function loadCustomOptions() {
  const data = getCustomOptions();
  selectionBlocks.forEach((block) => {
    const blockKey = block.dataset.block;
    const options = block.querySelector(".option-list");
    const customList = data[blockKey] || [];
    customList.forEach((value) => {
      const exists = Array.from(options.children).some((li) => li.dataset.value === value);
      if (exists) return;
      const li = document.createElement("li");
      li.dataset.value = value;
      li.textContent = value;
      options.appendChild(li);
    });
  });
}

selectionBlocks.forEach((block) => {
  const options = block.querySelector(".option-list");
  const chosen = block.querySelector(".chosen-list");
  const customInput = block.querySelector(".custom-input");
  const addBtn = block.querySelector(".add-custom-btn");

  if (options && chosen) {
    options.addEventListener("click", (e) => {
      const target = e.target.closest("li");
      if (!target) return;
      addChosenItem(chosen, target.dataset.value || target.textContent.trim());
    });

    chosen.addEventListener("click", (e) => {
      const target = e.target.closest("li");
      if (!target) return;
      target.remove();
    });
  }

  if (addBtn && customInput && chosen) {
    addBtn.addEventListener("click", () => {
      const value = customInput.value.trim();
      if (!value) return;
      addChosenItem(chosen, value);
      addCustomOption(block.dataset.block, value);
      const optionsList = block.querySelector(".option-list");
      const exists = Array.from(optionsList.children).some((li) => li.dataset.value === value);
      if (!exists) {
        const li = document.createElement("li");
        li.dataset.value = value;
        li.textContent = value;
        optionsList.appendChild(li);
      }
      customInput.value = "";
    });
  }
});

function showAccordion(name) {
  accordionToggles.forEach((btn) => btn.classList.toggle("active", btn.dataset.accordion === name));
  accordionPanels.forEach((panel) => panel.classList.toggle("hidden", panel.id !== name));
}

accordionToggles.forEach((btn) => {
  btn.addEventListener("click", () => showAccordion(btn.dataset.accordion));
});

if (accordionToggles.length) {
  showAccordion(accordionToggles[0].dataset.accordion);
}

function collectDailySelections() {
  const data = {};
  selectionBlocks.forEach((block) => {
    const key = block.dataset.block;
    const chosen = Array.from(block.querySelectorAll(".chosen-list li")).map((li) => li.textContent.trim());
    data[key] = chosen;
  });
  return data;
}

function getDailyPlanData() {
  const data = collectDailySelections();
  const hasSelections = Object.values(data).some((items) => items && items.length);
  if (hasSelections) return data;
  try {
    return JSON.parse(localStorage.getItem("wpl_daily_plan") || "null") || data;
  } catch {
    return data;
  }
}

function formatPdfField(items) {
  if (!items || !items.length) return "";
  return items.join("\n");
}

function updateTemplatePrintButton() {
  if (printTemplatePlan) printTemplatePlan.disabled = !templatePdfBytes;
}

function showTemplatePreview(url) {
  if (!templatePreview || !templatePreviewFrame) return;
  templatePreviewFrame.src = url;
  templatePreview.classList.remove("hidden");
}

function getPdfTemplateKey() {
  return `wpl_pdf_template_${getCoachKey()}`;
}

function savePdfTemplate(dataUrl) {
  localStorage.setItem(getPdfTemplateKey(), dataUrl);
}

function getPdfTemplate() {
  return localStorage.getItem(getPdfTemplateKey());
}

async function dataURLToArrayBuffer(dataUrl) {
  const res = await fetch(dataUrl);
  return res.arrayBuffer();
}

async function loadSavedPdfTemplate() {
  const savedTemplate = getPdfTemplate();
  if (savedTemplate) {
    try {
      templatePdfBytes = await dataURLToArrayBuffer(savedTemplate);
      if (templateStatus) {
        templateStatus.textContent = pickCopy({
          en: "Saved PDF template loaded.",
          es: "Plantilla PDF guardada cargada."
        });
      }
      updateTemplatePrintButton();
    } catch (e) {
      console.error("Failed to load saved PDF template:", e);
      if (templateStatus) {
        templateStatus.textContent = pickCopy({
          en: "Could not load saved template.",
          es: "No se pudo cargar la plantilla guardada."
        });
      }
    }
  }
}

function handleTemplateFile(file) {
  if (!file) {
    if (templateStatus) {
      templateStatus.textContent = pickCopy({
        en: "Select a PDF file first.",
        es: "Selecciona un PDF primero."
      });
    }
    return;
  }
  if (file.type !== "application/pdf") {
    if (templateStatus) {
      templateStatus.textContent = pickCopy({
        en: "Only PDF files are allowed.",
        es: "Solo se permiten archivos PDF."
      });
    }
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    savePdfTemplate(dataUrl); // Save to localStorage
    templatePdfBytes = await dataURLToArrayBuffer(dataUrl);

    if (templateStatus) {
      templateStatus.textContent = pickCopy({
        en: "PDF template loaded and saved.",
        es: "Plantilla PDF cargada y guardada."
      });
    }
    if (pendingTemplatePrint) {
      pendingTemplatePrint = false;
      await generateFilledPdf({ download: false });
      await printFilledPdf();
    } else {
      await generateFilledPdf({ download: false });
    }
  };
  reader.onerror = () => {
    if (templateStatus) {
      templateStatus.textContent = pickCopy({
        en: "Could not read file.",
        es: "No se pudo leer el archivo."
      });
    }
  };
  reader.readAsDataURL(file);
}

async function generateFilledPdf({ download } = {}) {
  if (!templatePdfBytes) {
    if (templateStatus) {
      templateStatus.textContent = pickCopy({
        en: "Upload a PDF template first.",
        es: "Sube una plantilla PDF primero."
      });
    }
    return null;
  }
  if (!window.PDFLib) {
    if (templateStatus) {
      templateStatus.textContent = pickCopy({
        en: "PDF library not available.",
        es: "La libreria PDF no esta disponible."
      });
    }
    return null;
  }
  const data = getDailyPlanData();
  const pdfDoc = await PDFLib.PDFDocument.load(templatePdfBytes);
  const form = pdfDoc.getForm();
  const fields = {
    intro: formatPdfField(data.intro),
    warmup: formatPdfField(data.warmup),
    drills: formatPdfField(data.drills),
    live: formatPdfField(data.live),
    cooldown: formatPdfField(data.cooldown),
    announcements: formatPdfField(data.announcements),
    date: new Date().toLocaleDateString()
  };

  Object.entries(fields).forEach(([key, value]) => {
    try {
      form.getTextField(key).setText(value);
    } catch {
      // ignore missing fields
    }
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  if (lastFilledPdfUrl) URL.revokeObjectURL(lastFilledPdfUrl);
  lastFilledPdfUrl = URL.createObjectURL(blob);
  updateTemplatePrintButton();
  showTemplatePreview(lastFilledPdfUrl);

  if (download) {
    const link = document.createElement("a");
    link.href = lastFilledPdfUrl;
    link.download = "daily-training-plan.pdf";
    link.click();
  }
  return lastFilledPdfUrl;
}

function formatDailyPlanText(data) {
  const titleMap = currentLang === "es"
    ? {
        intro: "Introduccion",
        warmup: "Calentamiento",
        drills: "Repeticiones + introduccion tecnica",
        live: "En vivo / ritmo alto + acondicionamiento",
        cooldown: "Visualizacion + vuelta a la calma",
        announcements: "Avisos"
      }
    : {
        intro: "Introduction",
        warmup: "Warm-up",
        drills: "Drills + Technique Intro",
        live: "Live / Hard Pace + Conditioning",
        cooldown: "Visualization + Cool Down",
        announcements: "Announcements"
      };
  const lines = [currentLang === "es" ? "Plan diario de entrenamiento" : "Daily Training Plan"];
  Object.keys(titleMap).forEach((key) => {
    const items = data[key] || [];
    lines.push(`\n${titleMap[key]}:`);
    if (!items.length) {
      lines.push(currentLang === "es" ? "- (nada seleccionado)" : "- (none selected)");
    } else {
      items.forEach((item) => lines.push(`- ${item}`));
    }
  });
  return lines.join("\n");
}

if (saveDailyPlan) {
  saveDailyPlan.addEventListener("click", () => {
    const data = collectDailySelections();
    localStorage.setItem("wpl_daily_plan", JSON.stringify(data));
    toast(pickCopy({ en: "Daily plan saved.", es: "Plan diario guardado." }));
  });
}

if (doneDailyPlan) {
  doneDailyPlan.addEventListener("click", async () => {
    const data = collectDailySelections();
    localStorage.setItem("wpl_daily_plan", JSON.stringify(data));
    if (templatePdfBytes && window.PDFLib) {
      await generateFilledPdf({ download: false });
      toast(
        pickCopy({
          en: "Daily plan saved. Template ready.",
          es: "Plan diario guardado. Plantilla lista."
        })
      );
    } else {
      toast(pickCopy({ en: "Daily plan saved.", es: "Plan diario guardado." }));
    }
    const role = (getProfile() || {}).role || "athlete";
    showTab(role === "coach" ? "dashboard" : "today");
  });
}

if (shareDailyPlan) {
  shareDailyPlan.addEventListener("click", async () => {
    const data = collectDailySelections();
    const text = formatDailyPlanText(data);
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentLang === "es" ? "Plan diario de entrenamiento" : "Daily Training Plan",
          text
        });
        toast(pickCopy({ en: "Shared.", es: "Compartido." }));
        return;
      } catch {
        // fall through
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast(pickCopy({ en: "Copied to clipboard.", es: "Copiado al portapapeles." }));
    } else {
      toast(
        pickCopy({
          en: "Copy not supported on this device.",
          es: "Copiar no es compatible en este dispositivo."
        })
      );
    }
  });
}

if (printDailyPlan) {
  printDailyPlan.addEventListener("click", () => {
    const data = collectDailySelections();
    const text = formatDailyPlanText(data);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<pre>${text}</pre>`);
    win.document.close();
    win.focus();
    win.print();
  });
}

// ---------- TEMPLATE UPLOAD ----------
if (uploadTemplateBtn && templateFile) {
  uploadTemplateBtn.addEventListener("click", () => {
    const file = templateFile.files && templateFile.files[0];
    handleTemplateFile(file);
  });
}

if (generateTemplateBtn) {
  generateTemplateBtn.addEventListener("click", async () => {
    const url = await generateFilledPdf({ download: true });
    if (url && templateStatus) templateStatus.textContent = "Filled PDF downloaded.";
  });
}

if (templateHelpBtn && templateHelpPanel) {
  templateHelpBtn.addEventListener("click", () => {
    templateHelpPanel.classList.toggle("hidden");
  });
}

function setTemplateControlsEnabled(enabled) {
  if (templateFile) templateFile.disabled = !enabled;
  if (uploadTemplateBtn) uploadTemplateBtn.disabled = !enabled;
  if (generateTemplateBtn) generateTemplateBtn.disabled = !enabled;
  updateTemplatePrintButton();
}

if (templatesBtn && templateConfirm) {
  templatesBtn.addEventListener("click", () => {
    templateConfirm.classList.toggle("hidden");
  });
}

if (templateGoBtn) {
  templateGoBtn.addEventListener("click", () => {
    setTemplateControlsEnabled(true);
    if (templateConfirm) templateConfirm.classList.add("hidden");
    if (templateFile) templateFile.click();
  });
}

if (templateNoBtn) {
  templateNoBtn.addEventListener("click", () => {
    setTemplateControlsEnabled(false);
    if (templateConfirm) templateConfirm.classList.add("hidden");
  });
}

if (templateDropzone) {
  const setActive = (active) => templateDropzone.classList.toggle("active", active);
  templateDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    setActive(true);
  });
  templateDropzone.addEventListener("dragleave", () => setActive(false));
  templateDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    setActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      if (templateStatus) {
        templateStatus.textContent = pickCopy({
          en: "Only PDF files are allowed.",
          es: "Solo se permiten archivos PDF."
        });
      }
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    if (templateFile) templateFile.files = dt.files;
    if (templateStatus) {
      const selectedLabel = currentLang === "es" ? "Seleccionado" : "Selected";
      templateStatus.textContent = `${selectedLabel}: ${file.name}`;
    }
    handleTemplateFile(file);
  });
}

if (templateFile) {
  templateFile.addEventListener("change", () => {
    const file = templateFile.files && templateFile.files[0];
    handleTemplateFile(file);
  });
}

async function printFilledPdf() {
  if (!lastFilledPdfUrl) {
    toast(pickCopy({ en: "No filled PDF to print.", es: "No hay PDF lleno para imprimir." }));
    return;
  }

  // Clean up any previous iframe
  const oldFrame = document.getElementById("print-frame");
  if (oldFrame) oldFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "print-frame";
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = lastFilledPdfUrl;

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error("Print failed:", e);
      toast(
        pickCopy({
          en: "Could not open print dialog. Please try printing from the preview.",
          es: "No se pudo abrir el dialogo de impresion. Intenta imprimir desde la vista previa."
        })
      );
    }
  };

  document.body.appendChild(iframe);
}

if (printTemplatePlan) {
  printTemplatePlan.addEventListener("click", async () => {
    if (!templatePdfBytes) {
      if (templateStatus) {
        templateStatus.textContent = pickCopy({
          en: "Upload a PDF template first.",
          es: "Sube una plantilla PDF primero."
        });
      }
      setTemplateControlsEnabled(true);
      if (templateConfirm) templateConfirm.classList.add("hidden");
      pendingTemplatePrint = true;
      if (templateFile) templateFile.click();
      return;
    }
    const url = await generateFilledPdf({ download: false });
    if (!url) return;
    await printFilledPdf();
  });
}

// ---------- ATHLETE PROFILE ----------
const athleteProfileForm = document.getElementById("athleteProfileForm");
const previewProfileBtn = document.getElementById("previewProfileBtn");
const backToProfileBtn = document.getElementById("backToProfileBtn");
const competitionPreview = document.getElementById("competitionPreview");
const openCoachMatchBtn = document.getElementById("openCoachMatchBtn");
const openCompetitionPreviewBtn = document.getElementById("openCompetitionPreviewBtn");
const coachQuickPreview = document.getElementById("coachQuickPreview");

const profileSubtabButtons = Array.from(document.querySelectorAll(".profile-subtab"));
const profileSubpanels = Array.from(document.querySelectorAll(".profile-subpanel"));
let currentProfileSubtab = "training";

const aName = document.getElementById("aName");
const aPhoto = document.getElementById("aPhoto");
const aCountry = document.getElementById("aCountry");
const aCity = document.getElementById("aCity");
const aSchoolClub = document.getElementById("aSchoolClub");
const aSchool = document.getElementById("aSchool");
const aClub = document.getElementById("aClub");
const aTrainingRoutines = document.getElementById("aTrainingRoutines");
const aTrainingVolume = document.getElementById("aTrainingVolume");
const aTrainingFocus = document.getElementById("aTrainingFocus");
const aStyle = document.getElementById("aStyle");
const aWeight = document.getElementById("aWeight");
const aWeightClass = document.getElementById("aWeightClass");
const aYears = document.getElementById("aYears");
const aLevel = document.getElementById("aLevel");
const aPosition = document.getElementById("aPosition");
const aStrategy = document.getElementById("aStrategy");
const aStrategyA = document.getElementById("aStrategyA");
const aStrategyB = document.getElementById("aStrategyB");
const aStrategyC = document.getElementById("aStrategyC");
const aSafeMoves = document.getElementById("aSafeMoves");
const aRiskyMoves = document.getElementById("aRiskyMoves");
const aResultsHistory = document.getElementById("aResultsHistory");
const aTags = document.getElementById("aTags");
const aFavoritePosition = document.getElementById("aFavoritePosition");
const aPsychTendency = document.getElementById("aPsychTendency");
const aPressureError = document.getElementById("aPressureError");
const aCoachSignal = document.getElementById("aCoachSignal");
const aOffense1 = document.getElementById("aOffense1");
const aOffense2 = document.getElementById("aOffense2");
const aOffense3 = document.getElementById("aOffense3");
const aDefense1 = document.getElementById("aDefense1");
const aDefense2 = document.getElementById("aDefense2");
const aDefense3 = document.getElementById("aDefense3");
const aNeutralOther = document.getElementById("aNeutralOther");
const aTopOther = document.getElementById("aTopOther");
const aBottomOther = document.getElementById("aBottomOther");
const aDefenseOther = document.getElementById("aDefenseOther");
const aLeadLeg = document.getElementById("aLeadLeg");
const aLeftAttack = document.getElementById("aLeftAttack");
const aRightAttack = document.getElementById("aRightAttack");
const aPreferredTies = document.getElementById("aPreferredTies");
const aMiscNotes = document.getElementById("aMiscNotes");
const aInternational = document.getElementById("aInternational");
const aInternationalEvents = document.getElementById("aInternationalEvents");
const aInternationalYears = document.getElementById("aInternationalYears");
const aCoachCues = document.getElementById("aCoachCues");
const aCueNotes = document.getElementById("aCueNotes");
const aInjuryNotes = document.getElementById("aInjuryNotes");
const aArchetype = document.getElementById("aArchetype");
const aBodyType = document.getElementById("aBodyType");
const aCueWord1 = document.getElementById("aCueWord1");
const aCueWord2 = document.getElementById("aCueWord2");
const aCueWord3 = document.getElementById("aCueWord3");

function collectTechniques(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((el) => el.checked)
    .map((el) => el.value);
}

function fillTechniques(selector, values = []) {
  document.querySelectorAll(selector).forEach((el) => {
    el.checked = values.includes(el.value);
  });
}

function normalizeTopThree(list = []) {
  return list.filter(Boolean).map((item) => String(item).trim()).filter(Boolean).slice(0, 3);
}

function topThreeFromInputs(inputs = []) {
  return normalizeTopThree(inputs.map((input) => input?.value || ""));
}

function showProfileSubtab(name) {
  if (!profileSubtabButtons.length || !profileSubpanels.length) return;
  const next = name || currentProfileSubtab || "training";
  currentProfileSubtab = next;
  profileSubtabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.profileTab === next);
  });
  profileSubpanels.forEach((panel) => {
    const isActive = panel.dataset.profilePanel === next;
    panel.classList.toggle("hidden", !isActive);
  });
}

function renderProfileTagPicker(tags = profileTagState) {
  if (!aTags) return;
  const selected = new Set(normalizeSmartTags(Array.from(tags)));
  aTags.innerHTML = "";
  SMART_TAGS.forEach((tag) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-chip";
    btn.dataset.tagId = tag.id;
    btn.textContent = `${tag.icon} ${pickCopy(tag.label)}`;
    btn.classList.toggle("active", selected.has(tag.id));
    btn.addEventListener("click", () => {
      if (selected.has(tag.id)) selected.delete(tag.id);
      else selected.add(tag.id);
      profileTagState = selected;
      renderProfileTagPicker(selected);
      renderCoachQuickPreview(readAthleteProfileForm(getProfile() || {}));
    });
    aTags.appendChild(btn);
  });
  profileTagState = selected;
}

function setProfileTags(tags) {
  profileTagState = new Set(normalizeSmartTags(tags));
  renderProfileTagPicker(profileTagState);
}

function getProfileTags() {
  return normalizeSmartTags(Array.from(profileTagState));
}

function tendencyFallback(strategy) {
  return strategyToTendency(strategy);
}

function readAthleteProfileForm(existing = {}) {
  const neutralTech = collectTechniques(".a-tech-neutral");
  const defenseTech = collectTechniques(".a-tech-defense");
  const offenseTop3 = topThreeFromInputs([aOffense1, aOffense2, aOffense3]);
  const defenseTop3 = topThreeFromInputs([aDefense1, aDefense2, aDefense3]);
  const tendency = aPsychTendency?.value || tendencyFallback(aStrategy?.value);
  return {
    ...existing,
    name: aName?.value.trim() || "",
    photo: aPhoto?.value.trim() || "",
    country: aCountry?.value.trim() || "",
    city: aCity?.value.trim() || "",
    schoolClub: aSchoolClub?.value || "no",
    schoolName: aSchool?.value.trim() || "",
    clubName: aClub?.value.trim() || "",
    trainingRoutines: aTrainingRoutines?.value.trim() || "",
    trainingVolume: aTrainingVolume?.value.trim() || "",
    trainingFocus: aTrainingFocus?.value.trim() || "",
    style: aStyle?.value || "freestyle",
    currentWeight: aWeight?.value.trim() || "",
    weightClass: aWeightClass?.value.trim() || "",
    years: aYears?.value.trim() || "",
    level: aLevel?.value || "intermediate",
    position: aPosition?.value || "neutral",
    strategy: aStrategy?.value || "balanced",
    strategyA: aStrategyA?.value.trim() || "",
    strategyB: aStrategyB?.value.trim() || "",
    strategyC: aStrategyC?.value.trim() || "",
    safeMoves: aSafeMoves?.value.trim() || "",
    riskyMoves: aRiskyMoves?.value.trim() || "",
    resultsHistory: aResultsHistory?.value.trim() || "",
    tags: getProfileTags(),
    favoritePosition: aFavoritePosition?.value || aPosition?.value || "neutral",
    psychTendency: tendency || tendencyFallback(aStrategy?.value),
    pressureError: aPressureError?.value.trim() || "",
    coachSignal: aCoachSignal?.value.trim() || "",
    offenseTop3: offenseTop3.length ? offenseTop3 : neutralTech.slice(0, 3),
    defenseTop3: defenseTop3.length ? defenseTop3 : defenseTech.slice(0, 3),
    techniques: {
      neutral: neutralTech,
      top: collectTechniques(".a-tech-top"),
      bottom: collectTechniques(".a-tech-bottom"),
      defense: defenseTech,
      neutralOther: aNeutralOther?.value.trim() || "",
      topOther: aTopOther?.value.trim() || "",
      bottomOther: aBottomOther?.value.trim() || "",
      defenseOther: aDefenseOther?.value.trim() || ""
    },
    international: aInternational?.value || "no",
    internationalEvents: aInternationalEvents?.value.trim() || "",
    internationalYears: aInternationalYears?.value.trim() || "",
    coachCues: aCoachCues?.value || "specific",
    cueNotes: aCueNotes?.value.trim() || "",
    injuryNotes: aInjuryNotes?.value.trim() || "",
    archetype: aArchetype?.value || "",
    bodyType: aBodyType?.value || ""
  };
}

function renderCoachQuickPreview(profile) {
  if (!coachQuickPreview) return;
  if (!profile) {
    coachQuickPreview.innerHTML = "";
    return;
  }
  const na = currentLang === "es" ? "N/D" : "N/A";
  const favoritePosition = translateOptionValue("aFavoritePosition", profile.favoritePosition || profile.position) || na;
  const tendencyKey = profile.psychTendency || tendencyFallback(profile.strategy);
  const tendency = translateOptionValue("aPsychTendency", tendencyKey) || translateValue(tendencyKey) || na;
  const offense = translateTechniqueList(profile.offenseTop3 || []).join(", ") || na;
  const defense = translateTechniqueList(profile.defenseTop3 || []).join(", ") || na;
  const signal = profile.coachSignal || na;
  const pressureError = profile.pressureError || na;
  const tags = normalizeSmartTags(profile.tags).map((tag) => formatSmartTag(tag)).join(" • ") || na;
  const labels = currentLang === "es"
    ? {
        position: "Posicion",
        tendency: "Tendencia",
        error: "Error bajo presion",
        signal: "Senal clave",
        offense: "Top ofensivo",
        defense: "Top defensivo",
        tags: "Tags"
      }
    : {
        position: "Position",
        tendency: "Tendency",
        error: "Common error",
        signal: "Coach signal",
        offense: "Top offense",
        defense: "Top defense",
        tags: "Tags"
      };
  coachQuickPreview.innerHTML = `
    <div class="coach-quick-line"><strong>${labels.position}:</strong> ${favoritePosition}</div>
    <div class="coach-quick-line"><strong>${labels.tendency}:</strong> ${tendency}</div>
    <div class="coach-quick-line"><strong>${labels.error}:</strong> ${pressureError}</div>
    <div class="coach-quick-line"><strong>${labels.signal}:</strong> ${signal}</div>
    <div class="coach-quick-line"><strong>${labels.offense}:</strong> ${offense}</div>
    <div class="coach-quick-line"><strong>${labels.defense}:</strong> ${defense}</div>
    <div class="coach-quick-line tags"><strong>${labels.tags}:</strong> ${tags}</div>
  `;
}

function fillAthleteProfileForm(profile) {
  if (!athleteProfileForm || !profile) return;
  aName.value = profile.name || "";
  aPhoto.value = profile.photo || "";
  aCountry.value = profile.country || "";
  aCity.value = profile.city || "";
  aSchoolClub.value = profile.schoolClub || "no";
  aSchool.value = profile.schoolName || "";
  aClub.value = profile.clubName || "";
  if (aTrainingRoutines) aTrainingRoutines.value = profile.trainingRoutines || "";
  if (aTrainingVolume) aTrainingVolume.value = profile.trainingVolume || "";
  if (aTrainingFocus) aTrainingFocus.value = profile.trainingFocus || "";
  aStyle.value = profile.style || "freestyle";
  aWeight.value = profile.currentWeight || "";
  aWeightClass.value = profile.weightClass || "";
  aYears.value = profile.years || profile.experienceYears || "";
  aLevel.value = profile.level || "intermediate";
  aPosition.value = profile.position || "neutral";
  aStrategy.value = profile.strategy || "balanced";
  if (aStrategyA) aStrategyA.value = profile.strategyA || "";
  if (aStrategyB) aStrategyB.value = profile.strategyB || "";
  if (aStrategyC) aStrategyC.value = profile.strategyC || "";
  if (aSafeMoves) aSafeMoves.value = profile.safeMoves || "";
  if (aRiskyMoves) aRiskyMoves.value = profile.riskyMoves || "";
  if (aResultsHistory) aResultsHistory.value = profile.resultsHistory || "";
  if (aFavoritePosition) aFavoritePosition.value = profile.favoritePosition || profile.position || "neutral";
  if (aArchetype) aArchetype.value = profile.archetype || "";
  if (aBodyType) aBodyType.value = profile.bodyType || "";
  if (aPsychTendency) aPsychTendency.value = profile.psychTendency || tendencyFallback(profile.strategy) || "conservative";
  if (aPressureError) aPressureError.value = profile.pressureError || "";
  if (aCoachSignal) aCoachSignal.value = profile.coachSignal || "";
  const offense = normalizeTopThree(profile.offenseTop3 || profile.techniques?.neutral || []);
  const defense = normalizeTopThree(profile.defenseTop3 || profile.techniques?.defense || []);
  if (aOffense1) aOffense1.value = offense[0] || "";
  if (aOffense2) aOffense2.value = offense[1] || "";
  if (aOffense3) aOffense3.value = offense[2] || "";
  if (aDefense1) aDefense1.value = defense[0] || "";
  if (aDefense2) aDefense2.value = defense[1] || "";
  if (aDefense3) aDefense3.value = defense[2] || "";
  aNeutralOther.value = profile.techniques?.neutralOther || "";
  aTopOther.value = profile.techniques?.topOther || "";
  aBottomOther.value = profile.techniques?.bottomOther || "";
  aDefenseOther.value = profile.techniques?.defenseOther || "";
  aInternational.value = profile.international || "no";
  aInternationalEvents.value = profile.internationalEvents || "";
  aInternationalYears.value = profile.internationalYears || "";
  aCoachCues.value = profile.coachCues || "specific";
  aCueNotes.value = profile.cueNotes || "";
  aInjuryNotes.value = profile.injuryNotes || "";
  if (aCueWord1) aCueWord1.value = (profile.cueWords || [])[0] || "";
  if (aCueWord2) aCueWord2.value = (profile.cueWords || [])[1] || "";
  if (aCueWord3) aCueWord3.value = (profile.cueWords || [])[2] || "";
  if (aLeadLeg) aLeadLeg.value = profile.defaultTechniques?.leadLeg || "left";
  if (aLeftAttack) aLeftAttack.value = profile.defaultTechniques?.leftAttack || "";
  if (aRightAttack) aRightAttack.value = profile.defaultTechniques?.rightAttack || "";
  if (aPreferredTies) aPreferredTies.value = profile.defaultTechniques?.preferredTies || "";
  if (aMiscNotes) aMiscNotes.value = profile.defaultTechniques?.miscNotes || "";

  fillTechniques(".a-tech-neutral", profile.techniques?.neutral || []);
  fillTechniques(".a-tech-top", profile.techniques?.top || []);
  fillTechniques(".a-tech-bottom", profile.techniques?.bottom || []);
  fillTechniques(".a-tech-defense", profile.techniques?.defense || []);

  setProfileTags(profile.tags || []);
  renderCoachQuickPreview(profile);
}

function buildCompetitionPreview(profile) {
  if (!profile) return [];
  const na = currentLang === "es" ? "N/D" : "N/A";
  const none = currentLang === "es" ? "Ninguna" : "None";
  const unknown = currentLang === "es" ? "Desconocido" : "Unknown";
  const yearsLabel = currentLang === "es" ? "anos" : "years";
  const style = profile.style
    ? translateOptionValue("aStyle", profile.style) || translateValue(profile.style)
    : na;
  const weight = profile.currentWeight || na;
  const weightClass = profile.weightClass || na;
  const years = profile.years || profile.experienceYears || na;
  const level = getLevelLabel(profile.level) || na;
  const position = profile.position ? translateOptionValue("pPosition", profile.position) : na;
  const strategy = profile.strategy ? translateOptionValue("pStrategy", profile.strategy) : na;
  const intl = profile.international ? translateOptionValue("pInternational", profile.international) : na;
  const coachCues = profile.coachCues ? translateOptionValue("pCoachCues", profile.coachCues) : na;
  const neutralList = translateTechniqueList(profile.techniques?.neutral);
  const topList = translateTechniqueList(profile.techniques?.top);
  const bottomList = translateTechniqueList(profile.techniques?.bottom);
  const defenseList = translateTechniqueList(profile.techniques?.defense);
  const tendencyKey = profile.psychTendency || tendencyFallback(profile.strategy);
  const tendency = translateOptionValue("aPsychTendency", tendencyKey) || translateValue(tendencyKey) || na;
  const favoritePosition = translateOptionValue("aFavoritePosition", profile.favoritePosition || profile.position) || na;
  const offense = translateTechniqueList(profile.offenseTop3 || []).join(", ") || na;
  const defense = translateTechniqueList(profile.defenseTop3 || []).join(", ") || na;
  const tags = normalizeSmartTags(profile.tags).map((tag) => formatSmartTag(tag)).join(" • ") || na;
  const strategyPlans = [profile.strategyA, profile.strategyB, profile.strategyC].filter(Boolean);
  return [
    {
      title: currentLang === "es" ? "Datos del atleta" : "Athlete Basics",
      lines: [
        `${currentLang === "es" ? "Nombre" : "Name"}: ${profile.name || unknown}`,
        `${currentLang === "es" ? "Estilo" : "Style"}: ${style}`,
        `${currentLang === "es" ? "Peso" : "Weight"}: ${weight} (${weightClass})`,
        `${currentLang === "es" ? "Experiencia" : "Experience"}: ${years} ${yearsLabel} - ${level}`,
        `${currentLang === "es" ? "Posicion preferida" : "Preferred position"}: ${position}`,
        `${currentLang === "es" ? "Estrategia" : "Strategy"}: ${strategy}`
      ]
    },
    {
      title: currentLang === "es" ? "Entrenamiento" : "Training",
      lines: [
        `${currentLang === "es" ? "Rutinas" : "Routines"}: ${profile.trainingRoutines || na}`,
        `${currentLang === "es" ? "Volumen" : "Volume"}: ${profile.trainingVolume || na}`,
        `${currentLang === "es" ? "Tecnica foco" : "Technique focus"}: ${profile.trainingFocus || na}`
      ]
    },
    {
      title: currentLang === "es" ? "Plan de competencia" : "Competition Plan",
      lines: [
        `${currentLang === "es" ? "Estrategia A/B/C" : "Strategy A/B/C"}: ${strategyPlans.join(" | ") || na}`,
        `${currentLang === "es" ? "Seguros" : "Safe moves"}: ${profile.safeMoves || na}`,
        `${currentLang === "es" ? "Arriesgados" : "Risky moves"}: ${profile.riskyMoves || na}`,
        `${currentLang === "es" ? "Resultados" : "Results"}: ${profile.resultsHistory || na}`
      ]
    },
    {
      title: currentLang === "es" ? "Tecnicas predeterminadas" : "Default Techniques",
      lines: [
        `${currentLang === "es" ? "Neutral" : "Neutral"}: ${neutralList.join(", ") || na}`,
        `${currentLang === "es" ? "Arriba" : "Top"}: ${topList.join(", ") || na}`,
        `${currentLang === "es" ? "Abajo" : "Bottom"}: ${bottomList.join(", ") || na}`,
        `${currentLang === "es" ? "Defensa" : "Defense"}: ${defenseList.join(", ") || na}`,
        `${currentLang === "es" ? "Otro" : "Other"}: ${[
          profile.techniques?.neutralOther,
          profile.techniques?.topOther,
          profile.techniques?.bottomOther,
          profile.techniques?.defenseOther
        ].filter(Boolean).join(" - ") || na}`
      ]
    },
    {
      title: currentLang === "es" ? "Coaching rapido" : "Coaching Quick",
      lines: [
        `${currentLang === "es" ? "Posicion favorita" : "Favorite position"}: ${favoritePosition}`,
        `${currentLang === "es" ? "Tendencia" : "Tendency"}: ${tendency}`,
        `${currentLang === "es" ? "Error bajo presion" : "Common error"}: ${profile.pressureError || na}`,
        `${currentLang === "es" ? "Senal clave" : "Coach signal"}: ${profile.coachSignal || na}`,
        `${currentLang === "es" ? "Top ofensivo" : "Top offense"}: ${offense}`,
        `${currentLang === "es" ? "Top defensivo" : "Top defense"}: ${defense}`,
        `Tags: ${tags}`
      ]
    },
    {
      title: currentLang === "es" ? "Experiencia internacional" : "International Experience",
      lines: [
        `${currentLang === "es" ? "Competencia internacional" : "International competition"}: ${intl}`,
        `${currentLang === "es" ? "Paises/eventos" : "Countries/events"}: ${profile.internationalEvents || na}`,
        `${currentLang === "es" ? "Anos" : "Years"}: ${profile.internationalYears || na}`,
        `${currentLang === "es" ? "Indicaciones" : "Coach cues"}: ${coachCues}`,
        `${currentLang === "es" ? "Que ayuda" : "What helps"}: ${profile.cueNotes || na}`,
        `${currentLang === "es" ? "Lesiones/limites" : "Injuries/limits"}: ${profile.injuryNotes || none}`
      ]
    }
  ];
}

function renderCompetitionPreview(profile) {
  if (!competitionPreview) return;
  competitionPreview.innerHTML = "";
  const sections = buildCompetitionPreview(profile);
  sections.forEach((section) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `<h3>${section.title}</h3>`;
    const list = document.createElement("ul");
    list.className = "list";
    section.lines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      list.appendChild(li);
    });
    card.appendChild(list);
    competitionPreview.appendChild(card);
  });
}

if (profileSubtabButtons.length) {
  profileSubtabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showProfileSubtab(btn.dataset.profileTab));
  });
  showProfileSubtab(currentProfileSubtab);
}

if (athleteProfileForm) {
  athleteProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const existing = getProfile() || {};
    const updated = readAthleteProfileForm(existing);
    setProfile(updated);
    applyProfile(updated);
    renderCoachQuickPreview(updated);
    toast(pickCopy({ en: "Profile saved.", es: "Perfil guardado." }));
  });
}

if (previewProfileBtn) {
  previewProfileBtn.addEventListener("click", () => {
    const draft = readAthleteProfileForm(getProfile() || {});
    renderCompetitionPreview(draft);
    showTab("competition-preview");
  });
}

if (openCompetitionPreviewBtn) {
  openCompetitionPreviewBtn.addEventListener("click", () => {
    const draft = readAthleteProfileForm(getProfile() || {});
    renderCompetitionPreview(draft);
    showTab("competition-preview");
  });
}

if (openCoachMatchBtn) {
  openCoachMatchBtn.addEventListener("click", () => {
    const draft = readAthleteProfileForm(getProfile() || {});
    renderCoachQuickPreview(draft);
    const role = (draft.role || getProfile()?.role || "athlete");
    if (role === "coach") {
      if (coachMatchSelect && draft.name) coachMatchSelect.value = draft.name;
      renderCoachMatchView(coachMatchSelect?.value || draft.name);
      showTab("coach-match");
    } else {
      renderCompetitionPreview(draft);
      showTab("competition-preview");
    }
  });
}

if (backToProfileBtn) {
  backToProfileBtn.addEventListener("click", () => showTab("athlete-profile"));
}

const coachQuickInputs = [
  aFavoritePosition,
  aPsychTendency,
  aPressureError,
  aCoachSignal,
  aOffense1,
  aOffense2,
  aOffense3,
  aDefense1,
  aDefense2,
  aDefense3,
  aStrategyA,
  aStrategyB,
  aStrategyC,
  aSafeMoves,
  aRiskyMoves,
  aResultsHistory
].filter(Boolean);
coachQuickInputs.forEach((input) => {
  input.addEventListener("input", () => {
    renderCoachQuickPreview(readAthleteProfileForm(getProfile() || {}));
  });
});

renderProfileTagPicker(profileTagState);
renderCoachQuickPreview(getProfile());

// ---------- FAVORITES ----------
const FAV_KEY = "wpl_favorites";
const favoritesList = document.getElementById("favoritesList");

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); }
  catch { return []; }
}

function setFavorites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function renderFavorites() {
  const favs = getFavorites();
  favoritesList.innerHTML = "";

  if (favs.length === 0) {
    const li = document.createElement("li");
    li.textContent = pickCopy({ en: "No favorites yet.", es: "Aun no hay favoritos." });
    favoritesList.appendChild(li);
    return;
  }

  favs.forEach((f, idx) => {
    const li = document.createElement("li");
    li.textContent = f;

    const del = document.createElement("button");
    del.textContent = pickCopy({ en: "Remove", es: "Eliminar" });
    del.style.marginLeft = "10px";

    del.addEventListener("click", () => {
      const updated = getFavorites().filter((_, i) => i !== idx);
      setFavorites(updated);
      renderFavorites();
    });

    li.appendChild(del);
    favoritesList.appendChild(li);
  });
}
// ---------- TODAY ----------
const todayTitle = document.getElementById("todayTitle");
const todaySubtitle = document.getElementById("todaySubtitle");
const todayType = document.getElementById("todayType");
const sessionBlocks = document.getElementById("sessionBlocks");
const startSessionBtn = document.getElementById("startSessionBtn");
const watchFilmBtn = document.getElementById("watchFilmBtn");
const logCompletionBtn = document.getElementById("logCompletionBtn");
const feelingScale = document.getElementById("feelingScale");
const dailyStatus = document.getElementById("dailyStatus");

function toast(msg) {
  dailyStatus.textContent = msg;
  setTimeout(() => (dailyStatus.textContent = ""), 1600);
}

function renderToday(dayIndex = new Date().getDay()) {
  const weekPlan = getWeekPlanData();
  const plan = weekPlan[dayIndex];
  if (!plan) return;

  todayTitle.textContent = plan.focus;
  const totalLabel = currentLang === "es" ? "Tiempo total" : "Total time";
  const intensityLabel = currentLang === "es" ? "Intensidad" : "Intensity";
  const intensity = getIntensityLabel(plan.intensity);
  todaySubtitle.textContent = `${totalLabel}: ${plan.total} - ${intensityLabel}: ${intensity}`;
  todayType.textContent = plan.focus;
  if (getProfile()?.role !== "coach") {
    const focusLabel = currentLang === "es" ? "Enfoque" : "Training Focus";
    roleMeta.textContent = `${focusLabel}: ${plan.focus}`;
  }

  sessionBlocks.innerHTML = "";
  plan.blocks.forEach((block) => {
    const row = document.createElement("div");
    row.className = "session-block";
    row.innerHTML = `<strong>${block.label}</strong><span>${block.detail}</span>`;
    sessionBlocks.appendChild(row);
  });
}

function renderFeelingScale() {
  feelingScale.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      const msg = currentLang === "es" ? `Chequeo guardado: ${i}/5` : `Check-in saved: ${i}/5`;
      toast(msg);
    });
    feelingScale.appendChild(btn);
  }
}

startSessionBtn.addEventListener("click", () => {
  const plan = getWeekPlanData()[new Date().getDay()];
  const intro = currentLang === "es"
    ? `Sesion de ${plan.focus}. ${plan.blocks[0]?.label || ""}.`
    : `${plan.focus} session. ${plan.blocks[0]?.label || ""}.`;
  speak(intro);
  toast(currentLang === "es" ? "Sesion iniciada. Mantente enfocado." : "Session started. Stay focused.");
});

watchFilmBtn.addEventListener("click", () => {
  toast(currentLang === "es" ? "Video asignado: Final de pierna simple" : "Film assigned: Single Leg Finish");
});

logCompletionBtn.addEventListener("click", () => {
  toast(currentLang === "es" ? "Sesion registrada. Buen trabajo." : "Session logged. Great work.");
});

// ---------- TRAINING PLAN ----------
const planGrid = document.getElementById("planGrid");
const planDayTitle = document.getElementById("planDayTitle");
const planDayDetail = document.getElementById("planDayDetail");

function renderPlanGrid(selectedDay = new Date().getDay()) {
  planGrid.innerHTML = "";
  const weekPlan = getWeekPlanData();
  weekPlan.forEach((plan, idx) => {
    const card = document.createElement("div");
    card.className = "plan-card" + (idx === selectedDay ? " active" : "");
    const intensity = getIntensityLabel(plan.intensity);
    card.innerHTML = `
      <strong>${plan.day}</strong>
      <div class="small">${plan.focus} - ${intensity}</div>
    `;
    card.addEventListener("click", () => {
      renderPlanGrid(idx);
      renderPlanDetails(idx);
    });
    planGrid.appendChild(card);
  });
  renderPlanDetails(selectedDay);
}

function renderPlanDetails(dayIndex) {
  const plan = getWeekPlanData()[dayIndex];
  if (!plan) return;
  planDayTitle.textContent = currentLang === "es" ? `Plan de ${plan.day}` : `${plan.day} Plan`;
  planDayDetail.innerHTML = "";
  plan.details.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    planDayDetail.appendChild(li);
  });
}

// ---------- CALENDAR ----------
const calendarGrid = document.getElementById("calendarMonthGrid");
const calendarDayNames = document.getElementById("calendarDayNames");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarPrevBtn = document.getElementById("calendarPrevBtn");
const calendarNextBtn = document.getElementById("calendarNextBtn");
const calendarTitle = document.getElementById("calendarTitle");
const calendarChip = document.getElementById("calendarChip");
const calTitle = document.getElementById("calTitle");
const calDrills = document.getElementById("calDrills");
const calAudience = document.getElementById("calAudience");
const calendarCoachEditor = document.getElementById("calendarCoachEditor");
const calendarCoachTitle = document.getElementById("calendarCoachTitle");
const calendarCoachHint = document.getElementById("calendarCoachHint");
const calendarCoachItemsLabel = document.getElementById("calendarCoachItemsLabel");
const calendarCoachItems = document.getElementById("calendarCoachItems");
const calendarCoachAll = document.getElementById("calendarCoachAll");
const calendarCoachAllLabel = document.getElementById("calendarCoachAllLabel");
const calendarCoachAthletes = document.getElementById("calendarCoachAthletes");
const calendarCoachSaveBtn = document.getElementById("calendarCoachSaveBtn");
const calendarCoachClearBtn = document.getElementById("calendarCoachClearBtn");

const CALENDAR_COPY = {
  title: {
    en: "Calendar",
    es: "Calendario",
    uz: "Taqvim",
    ru: "Календарь"
  },
  chip: {
    en: "Month view",
    es: "Vista mensual",
    uz: "Oy ko‘rinishi",
    ru: "Вид месяца"
  }
};

const CALENDAR_AUDIENCE_COPY = {
  assigned: {
    en: "Assigned",
    es: "Asignado",
    uz: "Tayinlangan",
    ru: "Назначено"
  },
  team: {
    en: "Entire team",
    es: "Todo el equipo",
    uz: "Butun jamoa",
    ru: "Вся команда"
  },
  you: {
    en: "You",
    es: "Tu",
    uz: "Siz",
    ru: "Вы"
  },
  unset: {
    en: "No athletes assigned yet.",
    es: "Aun no hay atletas asignados.",
    uz: "Hali sportchilar tayinlanmagan.",
    ru: "Спортсмены еще не назначены."
  },
  hidden: {
    en: "This day is not assigned to you yet.",
    es: "Este dia aun no esta asignado para ti.",
    uz: "Bu kun hali sizga tayinlanmagan.",
    ru: "Этот день еще не назначен вам."
  }
};

const CALENDAR_COACH_COPY = {
  title: {
    en: "Coach plan for this day",
    es: "Plan del coach para este dia",
    uz: "Bu kun uchun murabbiy rejasi",
    ru: "План тренера на этот день"
  },
  hint: {
    en: "Add the plan, then assign athletes or send to the full team.",
    es: "Agrega el plan, luego asigna atletas o envialo a todo el equipo.",
    uz: "Rejani qo‘shing, keyin sportchilarni tayinlang yoki butun jamoaga yuboring.",
    ru: "Добавьте план, затем назначьте спортсменов или отправьте всей команде."
  },
  itemsLabel: {
    en: "Training plan (one item per line)",
    es: "Plan de entrenamiento (una linea por punto)",
    uz: "Trening rejasi (har qatorda bitta nuqta)",
    ru: "План тренировки (по одному пункту в строке)"
  },
  allLabel: {
    en: "Send to entire team",
    es: "Enviar a todo el equipo",
    uz: "Butun jamoaga yuborish",
    ru: "Отправить всей команде"
  },
  saveBtn: {
    en: "Save day plan",
    es: "Guardar plan del dia",
    uz: "Kun rejani saqlash",
    ru: "Сохранить план дня"
  },
  clearBtn: {
    en: "Clear day",
    es: "Limpiar dia",
    uz: "Kunni tozalash",
    ru: "Очистить день"
  },
  saveToast: {
    en: "Day plan saved.",
    es: "Plan del dia guardado.",
    uz: "Kun rejasi saqlandi.",
    ru: "План дня сохранен."
  },
  clearToast: {
    en: "Day cleared.",
    es: "Dia limpiado.",
    uz: "Kun tozalandi.",
    ru: "День очищен."
  },
  needAudience: {
    en: "Select athletes or choose entire team.",
    es: "Selecciona atletas o elige todo el equipo.",
    uz: "Sportchilarni tanlang yoki butun jamoani tanlang.",
    ru: "Выберите спортсменов или всю команду."
  },
  needItems: {
    en: "Add at least one training item.",
    es: "Agrega al menos un punto del entrenamiento.",
    uz: "Kamida bitta mashg‘ulot punktini qo‘shing.",
    ru: "Добавьте хотя бы один элемент тренировки."
  },
  clearConfirm: {
    en: "Clear the plan and assignments for this date?",
    es: "Borrar el plan y asignaciones de esta fecha?",
    uz: "Bu sana uchun rejani va tayinlarni tozalaysizmi?",
    ru: "Очистить план и назначения на эту дату?"
  }
};

const CALENDAR_COACH_PLACEHOLDERS = {
  en: "Warm-up - 15 min\nTechnique - Single leg chain\nLive - 4 x 2:00",
  es: "Calentamiento - 15 min\nTecnica - Cadena de pierna simple\nEn vivo - 4 x 2:00",
  uz: "Isinish - 15 min\nTexnika - Bir oyoqli zanjir\nJonli - 4 x 2:00",
  ru: "Разминка - 15 мин\nТехника - Цепочка одинарного захвата\nСпарринг - 4 х 2:00"
};

let calendarViewDate = new Date();
let calendarSelectedKey = toDateKey(new Date());
let calendarNavBound = false;
let calendarCoachBound = false;

function dateFromKey(key) {
  if (!isDateKey(key)) return new Date();
  const [year, month, day] = key.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function normalizeDateKey(value) {
  if (isDateKey(value)) return value;
  return toDateKey(new Date());
}

function getAthleteNamesBase() {
  return ATHLETES.map((athlete) => athlete.name);
}

function getCalendarEntry(dateKey) {
  const key = normalizeDateKey(dateKey);
  const events = getStoredCalendarEvents();
  return normalizeCalendarEntry(events[key]);
}

function setCalendarEntry(dateKey, entry) {
  const key = normalizeDateKey(dateKey);
  const events = getStoredCalendarEvents();
  const normalized = normalizeCalendarEntry(entry);
  if (normalized.items.length) {
    events[key] = normalized;
  } else {
    delete events[key];
  }
  setStoredCalendarEvents(events);
  return normalized;
}

function getEventsForDateKey(dateKey) {
  return getCalendarEntry(dateKey).items;
}

function setEventsForDateKey(dateKey, list) {
  const key = normalizeDateKey(dateKey);
  const entry = getCalendarEntry(key);
  entry.items = Array.isArray(list) ? list.map((item) => String(item).trim()).filter(Boolean) : [];
  setCalendarEntry(key, entry);
}

function nameListIncludes(list, name) {
  const target = normalizeName(name);
  if (!target) return false;
  return (list || []).some((item) => normalizeName(item) === target);
}

function isEntryAssignedToProfile(entry, profile) {
  if (!entry.items.length) return false;
  if (!profile || profile.role === "coach") return true;
  if (entry.audience.all) return true;
  if (!entry.audience.athletes.length) return true;
  return nameListIncludes(entry.audience.athletes, profile.name);
}

function getVisibleItemsForDate(dateKey, profile = getProfile()) {
  const entry = getCalendarEntry(dateKey);
  return isEntryAssignedToProfile(entry, profile) ? entry.items : [];
}

function getAudienceText(entry, profile) {
  const isCoach = profile?.role === "coach";
  if (entry.audience.all) return pickCopy(CALENDAR_AUDIENCE_COPY.team);
  if (entry.audience.athletes.length) {
    if (isCoach) return entry.audience.athletes.join(", ");
    return nameListIncludes(entry.audience.athletes, profile?.name)
      ? pickCopy(CALENDAR_AUDIENCE_COPY.you)
      : pickCopy(CALENDAR_AUDIENCE_COPY.hidden);
  }
  return pickCopy(CALENDAR_AUDIENCE_COPY.unset);
}

function getAudienceLabel(entry, profile) {
  const assigned = pickCopy(CALENDAR_AUDIENCE_COPY.assigned);
  return `${assigned}: ${getAudienceText(entry, profile)}`;
}

function shiftCalendarMonth(delta) {
  const next = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + delta, 1);
  calendarViewDate = next;
  const selectedDate = dateFromKey(calendarSelectedKey);
  if (selectedDate.getFullYear() !== next.getFullYear() || selectedDate.getMonth() !== next.getMonth()) {
    calendarSelectedKey = toDateKey(next);
  }
  renderCalendar(calendarSelectedKey);
}

function bindCalendarNav() {
  if (calendarNavBound) return;
  if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener("click", () => shiftCalendarMonth(-1));
  }
  if (calendarNextBtn) {
    calendarNextBtn.addEventListener("click", () => shiftCalendarMonth(1));
  }
  calendarNavBound = true;
}

function renderCalendar(selectedKey = calendarSelectedKey) {
  if (!calendarGrid || !calendarDayNames || !calendarMonthLabel) return;
  bindCalendarNav();

  calendarSelectedKey = normalizeDateKey(selectedKey);
  const selectedDate = dateFromKey(calendarSelectedKey);
  calendarViewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

  if (calendarTitle) calendarTitle.textContent = pickCopy(CALENDAR_COPY.title);
  if (calendarChip) calendarChip.textContent = pickCopy(CALENDAR_COPY.chip);

  const monthNames = getMonthNames();
  const dayNames = getDayAbbr();
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const todayKey = toDateKey(new Date());
  const profile = getProfile();

  calendarMonthLabel.textContent = `${monthNames[month]} ${year}`;
  calendarDayNames.innerHTML = dayNames.map((day) => `<div class="month-day-name">${day}</div>`).join("");
  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDayOfWeek; i += 1) {
    const empty = document.createElement("div");
    empty.className = "month-cell empty";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= numDays; day += 1) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    const visibleCount = getVisibleItemsForDate(key, profile).length;
    const cell = document.createElement("button");
    cell.type = "button";
    const isToday = key === todayKey;
    const isSelected = key === calendarSelectedKey;
    cell.className = `month-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}`;
    cell.dataset.key = key;
    cell.innerHTML = `
      <div class="month-day-number">${day}</div>
      ${visibleCount ? `<div class="month-count">${visibleCount}</div>` : ""}
    `;
    cell.addEventListener("click", () => {
      calendarSelectedKey = key;
      renderCalendar(key);
      renderCalendarDetails(key);
      if (calendarManagerDate) {
        calendarManagerDate.value = key;
        renderCalendarManager();
      }
    });
    calendarGrid.appendChild(cell);
  }

  renderCalendarDetails(calendarSelectedKey);
}

function renderCalendarDetails(dateKey) {
  const key = normalizeDateKey(dateKey);
  const date = dateFromKey(key);
  const profile = getProfile();
  const entry = getCalendarEntry(key);
  const visibleItems = getVisibleItemsForDate(key, profile);
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  const label = date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const focus = getWeekPlanData()[date.getDay()]?.focus;
  calTitle.textContent = focus ? `${label} - ${focus}` : label;
  calDrills.innerHTML = "";

  visibleItems.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    calDrills.appendChild(li);
  });

  if (calAudience) {
    const assignedToProfile = isEntryAssignedToProfile(entry, profile);
    const hasItems = entry.items.length > 0;
    if (!hasItems) {
      calAudience.textContent = "";
      calAudience.hidden = true;
    } else if (profile?.role === "coach") {
      calAudience.textContent = getAudienceLabel(entry, profile);
      calAudience.hidden = false;
    } else if (assignedToProfile) {
      calAudience.textContent = getAudienceLabel(entry, profile);
      calAudience.hidden = false;
    } else {
      calAudience.textContent = pickCopy(CALENDAR_AUDIENCE_COPY.hidden);
      calAudience.hidden = false;
    }
  }

  renderCalendarCoachEditor(key, entry, profile);
}

function splitCoachItems(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getSelectedCoachAthletes() {
  if (!calendarCoachAthletes) return [];
  const checked = Array.from(calendarCoachAthletes.querySelectorAll('input[type="checkbox"]:checked'));
  return uniqueNames(checked.map((input) => input.value));
}

function setCoachAthleteDisabled(disabled) {
  if (!calendarCoachAthletes) return;
  calendarCoachAthletes.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.disabled = disabled;
    const label = input.closest("label");
    if (label) label.classList.toggle("disabled", disabled);
  });
}

function renderCoachAthleteList(entry) {
  if (!calendarCoachAthletes) return;
  const selected = new Set((entry.audience.athletes || []).map((name) => normalizeName(name)));
  const names = getAthleteNamesBase();
  calendarCoachAthletes.innerHTML = "";
  names.forEach((name) => {
    const label = document.createElement("label");
    label.className = "calendar-athlete-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = name;
    input.checked = selected.has(normalizeName(name));
    const text = document.createElement("span");
    text.textContent = name;
    label.appendChild(input);
    label.appendChild(text);
    calendarCoachAthletes.appendChild(label);
  });
  setCoachAthleteDisabled(entry.audience.all);
}

function saveCalendarCoachPlan() {
  const profile = getProfile();
  if (profile?.role !== "coach") return;
  const key = calendarSelectedKey;
  const items = splitCoachItems(calendarCoachItems?.value);
  if (!items.length) {
    toast(pickCopy(CALENDAR_COACH_COPY.needItems));
    return;
  }
  const sendAll = calendarCoachAll?.checked === true;
  const athletes = sendAll ? [] : getSelectedCoachAthletes();
  if (!sendAll && athletes.length === 0) {
    toast(pickCopy(CALENDAR_COACH_COPY.needAudience));
    return;
  }

  const entry = {
    items,
    audience: {
      all: sendAll,
      athletes
    }
  };

  setCalendarEntry(key, entry);
  renderCalendar(key);
  if (calendarManagerDate) {
    calendarManagerDate.value = key;
    renderCalendarManager();
  }
  toast(pickCopy(CALENDAR_COACH_COPY.saveToast));
}

function clearCalendarCoachPlan() {
  const profile = getProfile();
  if (profile?.role !== "coach") return;
  if (!confirm(pickCopy(CALENDAR_COACH_COPY.clearConfirm))) return;
  const key = calendarSelectedKey;
  setCalendarEntry(key, { items: [], audience: defaultAudience() });
  if (calendarCoachItems) calendarCoachItems.value = "";
  if (calendarCoachAll) calendarCoachAll.checked = false;
  renderCalendar(key);
  if (calendarManagerDate) {
    calendarManagerDate.value = key;
    renderCalendarManager();
  }
  toast(pickCopy(CALENDAR_COACH_COPY.clearToast));
}

function bindCalendarCoachEditor() {
  if (calendarCoachBound) return;
  if (calendarCoachAll) {
    calendarCoachAll.addEventListener("change", () => {
      setCoachAthleteDisabled(calendarCoachAll.checked);
    });
  }
  if (calendarCoachSaveBtn) {
    calendarCoachSaveBtn.addEventListener("click", () => saveCalendarCoachPlan());
  }
  if (calendarCoachClearBtn) {
    calendarCoachClearBtn.addEventListener("click", () => clearCalendarCoachPlan());
  }
  calendarCoachBound = true;
}

function renderCalendarCoachEditor(dateKey, entry, profile) {
  if (!calendarCoachEditor) return;
  const isCoach = profile?.role === "coach";
  calendarCoachEditor.classList.toggle("hidden", !isCoach);
  if (!isCoach) return;

  bindCalendarCoachEditor();
  const key = normalizeDateKey(dateKey);
  calendarSelectedKey = key;

  if (calendarCoachTitle) calendarCoachTitle.textContent = pickCopy(CALENDAR_COACH_COPY.title);
  if (calendarCoachHint) calendarCoachHint.textContent = pickCopy(CALENDAR_COACH_COPY.hint);
  if (calendarCoachItemsLabel) calendarCoachItemsLabel.textContent = pickCopy(CALENDAR_COACH_COPY.itemsLabel);
  if (calendarCoachAllLabel) calendarCoachAllLabel.textContent = pickCopy(CALENDAR_COACH_COPY.allLabel);
  if (calendarCoachSaveBtn) calendarCoachSaveBtn.textContent = pickCopy(CALENDAR_COACH_COPY.saveBtn);
  if (calendarCoachClearBtn) calendarCoachClearBtn.textContent = pickCopy(CALENDAR_COACH_COPY.clearBtn);

  if (calendarCoachItems) {
    calendarCoachItems.placeholder = currentLang === "es"
      ? CALENDAR_COACH_PLACEHOLDERS.es
      : CALENDAR_COACH_PLACEHOLDERS.en;
    calendarCoachItems.value = (entry.items || []).join("\n");
  }

  if (calendarCoachAll) {
    calendarCoachAll.checked = entry.audience.all;
  }

  renderCoachAthleteList(entry);
}

// ---------- CALENDAR MANAGER ----------
const calendarManagerTitle = document.getElementById("calendarManagerTitle");
const calendarManagerChip = document.getElementById("calendarManagerChip");
const calendarManagerFormTitle = document.getElementById("calendarManagerFormTitle");
const calendarManagerForm = document.getElementById("calendarManagerForm");
const calendarManagerDateLabel = document.getElementById("calendarManagerDateLabel");
const calendarManagerDate = document.getElementById("calendarManagerDate");
const calendarManagerEventLabel = document.getElementById("calendarManagerEventLabel");
const calendarManagerTitleInput = document.getElementById("calendarManagerTitleInput");
const calendarManagerTimeLabel = document.getElementById("calendarManagerTimeLabel");
const calendarManagerTimeInput = document.getElementById("calendarManagerTimeInput");
const calendarManagerNoteLabel = document.getElementById("calendarManagerNoteLabel");
const calendarManagerNoteInput = document.getElementById("calendarManagerNoteInput");
const calendarManagerAddBtn = document.getElementById("calendarManagerAddBtn");
const calendarManagerClearBtn = document.getElementById("calendarManagerClearBtn");
const calendarManagerListTitle = document.getElementById("calendarManagerListTitle");
const calendarManagerEmpty = document.getElementById("calendarManagerEmpty");
const calendarManagerList = document.getElementById("calendarManagerList");
const calendarManagerActionsTitle = document.getElementById("calendarManagerActionsTitle");
const calendarManagerTypesTitle = document.getElementById("calendarManagerTypesTitle");
const calendarManagerDetailsTitle = document.getElementById("calendarManagerDetailsTitle");
const calendarManagerNotificationsTitle = document.getElementById("calendarManagerNotificationsTitle");

const CALENDAR_MANAGER_COPY = {
  title: {
    en: "Calendar Manager",
    es: "Gestion de calendario",
    uz: "Taqvim boshqaruvi",
    ru: "Управление календарём"
  },
  chip: {
    en: "Create events + reminders",
    es: "Crear eventos y recordatorios",
    uz: "Tadbirlar va eslatmalar yarating",
    ru: "Создайте события и напоминания"
  },
  formTitle: {
    en: "Create Event",
    es: "Crear evento",
    uz: "Tadbir yaratish",
    ru: "Создать событие"
  },
  dateLabel: {
    en: "Date",
    es: "Fecha",
    uz: "Sana",
    ru: "Дата"
  },
  eventLabel: {
    en: "Event",
    es: "Evento",
    uz: "Tadbir",
    ru: "Событие"
  },
  timeLabel: {
    en: "Time",
    es: "Hora",
    uz: "Vaqt",
    ru: "Время"
  },
  noteLabel: {
    en: "Note",
    es: "Nota",
    uz: "Eslatma",
    ru: "Заметка"
  },
  addBtn: {
    en: "Add event",
    es: "Agregar evento",
    uz: "Tadbir qo‘shish",
    ru: "Добавить событие"
  },
  clearBtn: {
    en: "Clear date",
    es: "Limpiar fecha",
    uz: "Sanani tozalash",
    ru: "Очистить дату"
  },
  listTitle: {
    en: "Events on this date",
    es: "Eventos en esta fecha",
    uz: "Bu sanadagi tadbirlar",
    ru: "События на эту дату"
  },
  empty: {
    en: "No events yet.",
    es: "Aun no hay eventos.",
    uz: "Hozircha tadbirlar yo‘q.",
    ru: "Еще нет событий."
  },
  actionsTitle: {
    en: "Coach Actions",
    es: "Acciones del coach",
    uz: "Murabbiy harakatlari",
    ru: "Действия тренера"
  },
  typesTitle: {
    en: "Event Types",
    es: "Tipos de evento",
    uz: "Tadbir turlari",
    ru: "Типы событий"
  },
  detailsTitle: {
    en: "Event Details",
    es: "Detalles del evento",
    uz: "Tadbir tafsilotlari",
    ru: "Детали события"
  },
  notificationsTitle: {
    en: "Notifications",
    es: "Notificaciones",
    uz: "Bildirishnomalar",
    ru: "Уведомления"
  },
  removeBtn: {
    en: "Remove",
    es: "Quitar",
    uz: "O‘chirish",
    ru: "Удалить"
  },
  clearConfirm: {
    en: "Clear all events for this date?",
    es: "Borrar todos los eventos de esta fecha?",
    uz: "Bu sanadagi barcha tadbirlarni tozalaysizmi?",
    ru: "Очистить все события на эту дату?"
  },
  savedToast: {
    en: "Event saved.",
    es: "Evento guardado.",
    uz: "Tadbir saqlandi.",
    ru: "Событие сохранено."
  },
  clearedToast: {
    en: "Date cleared.",
    es: "Fecha limpiada.",
    uz: "Sana tozalandi.",
    ru: "Дата очищена."
  },
  removedToast: {
    en: "Event removed.",
    es: "Evento quitado.",
    uz: "Tadbir o‘chirildi.",
    ru: "Событие удалено."
  }
};

const CALENDAR_MANAGER_PLACEHOLDERS = {
  title: {
    en: "Team practice",
    es: "Practica del equipo",
    uz: "Jamoa mashg'uloti",
    ru: "Тренировка команды"
  },
  time: {
    en: "3:30 PM",
    es: "3:30 PM",
    uz: "15:30",
    ru: "15:30"
  },
  note: {
    en: "Mat 2",
    es: "Tapiz 2",
    uz: "2-mat",
    ru: "Мат 2"
  }
};

function calendarCopy(key) {
  return pickCopy(CALENDAR_MANAGER_COPY[key] || { en: key, es: key });
}

function getManagerDateKey() {
  const fallback = calendarSelectedKey || toDateKey(new Date());
  return normalizeDateKey(calendarManagerDate?.value || fallback);
}

function setManagerDateKey(key) {
  if (!calendarManagerDate) return;
  calendarManagerDate.value = normalizeDateKey(key);
}

function formatCalendarEvent(title, time, note) {
  const parts = [title];
  if (time) parts.push(time);
  if (note) parts.push(note);
  return parts.join(" - ");
}

function removeCalendarEvent(dateKey, eventIndex) {
  const key = normalizeDateKey(dateKey);
  const entry = getCalendarEntry(key);
  const list = [...entry.items];
  if (eventIndex < 0 || eventIndex >= list.length) return;
  list.splice(eventIndex, 1);
  entry.items = list;
  setCalendarEntry(key, entry);
  calendarSelectedKey = key;
  renderCalendar(key);
  setManagerDateKey(key);
  renderCalendarManager();
  toast(calendarCopy("removedToast"));
}

function renderCalendarManager() {
  if (!calendarManagerForm) return;

  if (calendarManagerTitle) calendarManagerTitle.textContent = calendarCopy("title");
  if (calendarManagerChip) calendarManagerChip.textContent = calendarCopy("chip");
  if (calendarManagerFormTitle) calendarManagerFormTitle.textContent = calendarCopy("formTitle");
  if (calendarManagerDateLabel) calendarManagerDateLabel.textContent = calendarCopy("dateLabel");
  if (calendarManagerEventLabel) calendarManagerEventLabel.textContent = calendarCopy("eventLabel");
  if (calendarManagerTimeLabel) calendarManagerTimeLabel.textContent = calendarCopy("timeLabel");
  if (calendarManagerNoteLabel) calendarManagerNoteLabel.textContent = calendarCopy("noteLabel");
  if (calendarManagerAddBtn) calendarManagerAddBtn.textContent = calendarCopy("addBtn");
  if (calendarManagerClearBtn) calendarManagerClearBtn.textContent = calendarCopy("clearBtn");
  if (calendarManagerListTitle) calendarManagerListTitle.textContent = calendarCopy("listTitle");
  if (calendarManagerEmpty) calendarManagerEmpty.textContent = calendarCopy("empty");
  if (calendarManagerActionsTitle) calendarManagerActionsTitle.textContent = calendarCopy("actionsTitle");
  if (calendarManagerTypesTitle) calendarManagerTypesTitle.textContent = calendarCopy("typesTitle");
  if (calendarManagerDetailsTitle) calendarManagerDetailsTitle.textContent = calendarCopy("detailsTitle");
  if (calendarManagerNotificationsTitle) calendarManagerNotificationsTitle.textContent = calendarCopy("notificationsTitle");

  if (calendarManagerTitleInput) {
    calendarManagerTitleInput.placeholder = pickCopy(CALENDAR_MANAGER_PLACEHOLDERS.title);
  }
  if (calendarManagerTimeInput) {
    calendarManagerTimeInput.placeholder = pickCopy(CALENDAR_MANAGER_PLACEHOLDERS.time);
  }
  if (calendarManagerNoteInput) {
    calendarManagerNoteInput.placeholder = pickCopy(CALENDAR_MANAGER_PLACEHOLDERS.note);
  }

  const dateKey = getManagerDateKey();
  setManagerDateKey(dateKey);
  const entry = getCalendarEntry(dateKey);
  const events = entry.items;
  calendarManagerList.innerHTML = "";
  if (calendarManagerEmpty) calendarManagerEmpty.hidden = events.length > 0;

  events.forEach((text, idx) => {
    const li = document.createElement("li");
    li.className = "manager-event";
    const label = document.createElement("span");
    label.textContent = text;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.dataset.index = String(idx);
    removeBtn.textContent = calendarCopy("removeBtn");
    removeBtn.addEventListener("click", () => removeCalendarEvent(dateKey, idx));
    li.appendChild(label);
    li.appendChild(removeBtn);
    calendarManagerList.appendChild(li);
  });
}

if (calendarManagerDate) {
  calendarManagerDate.addEventListener("change", () => {
    const key = getManagerDateKey();
    calendarSelectedKey = key;
    renderCalendar(key);
    renderCalendarManager();
  });
}

if (calendarManagerForm) {
  calendarManagerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const dateKey = getManagerDateKey();
    const title = calendarManagerTitleInput.value.trim();
    const time = calendarManagerTimeInput.value.trim();
    const note = calendarManagerNoteInput.value.trim();
    if (!title) return;
    const entry = getCalendarEntry(dateKey);
    entry.items = [...entry.items, formatCalendarEvent(title, time, note)];
    if (!entry.audience.all && entry.audience.athletes.length === 0) {
      entry.audience.all = true;
    }
    setCalendarEntry(dateKey, entry);
    calendarManagerForm.reset();
    calendarSelectedKey = dateKey;
    setManagerDateKey(dateKey);
    renderCalendar(dateKey);
    renderCalendarManager();
    toast(calendarCopy("savedToast"));
  });
}

if (calendarManagerClearBtn) {
  calendarManagerClearBtn.addEventListener("click", () => {
    const dateKey = getManagerDateKey();
    if (!confirm(calendarCopy("clearConfirm"))) return;
    setCalendarEntry(dateKey, { items: [], audience: defaultAudience() });
    calendarSelectedKey = dateKey;
    setManagerDateKey(dateKey);
    renderCalendar(dateKey);
    renderCalendarManager();
    toast(calendarCopy("clearedToast"));
  });
}

// ---------- MEDIA ----------
const mediaBreadcrumb = document.getElementById("mediaBreadcrumb");
const mediaSectionList = document.getElementById("mediaSectionList");
const mediaItemList = document.getElementById("mediaItemList");
const mediaEmpty = document.getElementById("mediaEmpty");
const mediaCoachTools = document.getElementById("mediaCoachTools");
const mediaAddSectionTitle = document.getElementById("mediaAddSectionTitle");
const mediaNewSectionLabel = document.getElementById("mediaNewSectionLabel");
const mediaNewSectionName = document.getElementById("mediaNewSectionName");
const mediaAddSectionBtn = document.getElementById("mediaAddSectionBtn");
const mediaAddItemTitle = document.getElementById("mediaAddItemTitle");
const mediaNewItemLabel = document.getElementById("mediaNewItemLabel");
const mediaNewItemTitle = document.getElementById("mediaNewItemTitle");
const mediaNewItemTypeLabel = document.getElementById("mediaNewItemTypeLabel");
const mediaNewItemType = document.getElementById("mediaNewItemType");
const mediaNewItemAssignedLabel = document.getElementById("mediaNewItemAssignedLabel");
const mediaNewItemAssigned = document.getElementById("mediaNewItemAssigned");
const mediaNewItemNoteLabel = document.getElementById("mediaNewItemNoteLabel");
const mediaNewItemNote = document.getElementById("mediaNewItemNote");
const mediaAddItemBtn = document.getElementById("mediaAddItemBtn");

const MEDIA_COPY = {
  root: {
    en: "All media",
    es: "Toda la multimedia",
    uz: "Barcha media",
    ru: "Все медиа"
  },
  sectionsLabel: {
    en: "Sections",
    es: "Secciones",
    uz: "Bo‘limlar",
    ru: "Разделы"
  },
  itemsLabel: {
    en: "Videos",
    es: "Videos",
    uz: "Videolar",
    ru: "Видео"
  },
  empty: {
    en: "No media here yet. Create a section like \"Double leg\" and add videos inside.",
    es: "Aun no hay contenido. Crea una seccion como \"Double leg\" y agrega videos dentro.",
    uz: "Bu yerda hali media yo‘q. Masalan, “Double leg” bo‘limini yarating va videolar qo‘shing.",
    ru: "Здесь пока нет медиа. Создайте раздел, например «Double leg», и добавьте видео."
  },
  emptySections: {
    en: "No sections yet.",
    es: "Aun no hay secciones.",
    uz: "Hali bo‘limlar yo‘q.",
    ru: "Пока нет разделов."
  },
  emptyItems: {
    en: "No videos in this section yet.",
    es: "Aun no hay videos en esta seccion.",
    uz: "Bu bo‘limda hali videolar yo‘q.",
    ru: "В этом разделе пока нет видео."
  },
  addSectionTitle: {
    en: "Add Section",
    es: "Agregar seccion",
    uz: "Bo‘lim qo‘shish",
    ru: "Добавить раздел"
  },
  addSectionLabel: {
    en: "Section name",
    es: "Nombre de la seccion",
    uz: "Bo‘lim nomi",
    ru: "Название раздела"
  },
  addSectionBtn: {
    en: "Add section",
    es: "Agregar seccion",
    uz: "Bo‘lim qo‘shish",
    ru: "Добавить раздел"
  },
  addItemTitle: {
    en: "Add Video",
    es: "Agregar video",
    uz: "Video qo‘shish",
    ru: "Добавить видео"
  },
  addItemLabel: {
    en: "Video title",
    es: "Titulo del video",
    uz: "Video sarlavhasi",
    ru: "Название видео"
  },
  addItemTypeLabel: {
    en: "Type",
    es: "Tipo",
    uz: "Tur",
    ru: "Тип"
  },
  addItemAssignedLabel: {
    en: "Assigned",
    es: "Asignado",
    uz: "Tayinlangan",
    ru: "Назначено"
  },
  addItemNoteLabel: {
    en: "Notes",
    es: "Notas",
    uz: "Eslatmalar",
    ru: "Заметки"
  },
  addItemBtn: {
    en: "Add video",
    es: "Agregar video",
    uz: "Video qo‘shish",
    ru: "Добавить видео"
  },
  assigned: {
    en: "Assigned",
    es: "Asignado",
    uz: "Tayinlangan",
    ru: "Назначено"
  },
  sectionsCount: {
    en: "sections",
    es: "secciones",
    uz: "bo‘limlar",
    ru: "разделов"
  },
  itemsCount: {
    en: "videos",
    es: "videos",
    uz: "videolar",
    ru: "видео"
  },
  saveFav: {
    en: "Save to Favorites",
    es: "Guardar en favoritos",
    uz: "Sevimlilarga saqlash",
    ru: "Сохранить в избранное"
  },
  addSectionToast: {
    en: "Section added.",
    es: "Seccion agregada.",
    uz: "Bo‘lim qo‘shildi.",
    ru: "Раздел добавлен."
  },
  addItemToast: {
    en: "Video added.",
    es: "Video agregado.",
    uz: "Video qo‘shildi.",
    ru: "Видео добавлено."
  },
  needSectionName: {
    en: "Add a section name.",
    es: "Agrega un nombre de seccion.",
    uz: "Bo‘lim nomini kiriting.",
    ru: "Добавьте название раздела."
  },
  needItemTitle: {
    en: "Add a video title.",
    es: "Agrega un titulo de video.",
    uz: "Video sarlavhasini kiriting.",
    ru: "Добавьте название видео."
  }
};

const MEDIA_PLACEHOLDERS = {
  section: {
    en: "e.g., Double leg",
    es: "ej., Double leg",
    uz: "mas., Double leg",
    ru: "напр., Double leg"
  },
  item: {
    en: "e.g., Double leg finish",
    es: "ej., Final de double leg",
    uz: "mas., Double leg finish",
    ru: "напр., Double leg finish"
  },
  assigned: {
    en: "Today",
    es: "Hoy",
    uz: "Bugun",
    ru: "Сегодня"
  },
  note: {
    en: "Optional note",
    es: "Nota opcional",
    uz: "Ixtiyoriy eslatma",
    ru: "Дополнительная заметка"
  }
};

let mediaActiveSectionId = null;
let mediaToolsBound = false;

function mediaCopy(key) {
  return pickCopy(MEDIA_COPY[key] || { en: key, es: key });
}

function makeMediaId(prefix) {
  const seed = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${seed}`;
}

function buildDefaultMediaTree() {
  const items = getMediaItemsData();
  const nodes = [];
  const sectionIds = new Map();

  items.forEach((item) => {
    const sectionName = item.tag || mediaCopy("root");
    let sectionId = sectionIds.get(sectionName);
    if (!sectionId) {
      sectionId = makeMediaId("sec");
      sectionIds.set(sectionName, sectionId);
      nodes.push({
        id: sectionId,
        type: "section",
        name: sectionName,
        parentId: null
      });
    }

    nodes.push({
      id: makeMediaId("item"),
      type: "item",
      title: item.title,
      mediaType: item.type,
      assigned: item.assigned,
      note: "",
      parentId: sectionId
    });
  });

  return { nodes };
}

function normalizeMediaNode(node) {
  if (!node || typeof node !== "object") return null;
  const type = node.type === "item" ? "item" : "section";
  const id = String(node.id || makeMediaId(type === "item" ? "item" : "sec"));
  const parentId = node.parentId ? String(node.parentId) : null;

  if (type === "section") {
    const name = String(node.name || "").trim();
    if (!name) return null;
    return { id, type, name, parentId };
  }

  const title = String(node.title || "").trim();
  if (!title) return null;
  return {
    id,
    type,
    title,
    mediaType: String(node.mediaType || node.typeLabel || "Video"),
    assigned: String(node.assigned || ""),
    note: String(node.note || ""),
    parentId
  };
}

function normalizeMediaTree(tree) {
  if (!tree || typeof tree !== "object") return { nodes: [] };
  const rawNodes = Array.isArray(tree.nodes) ? tree.nodes : [];
  const nodes = rawNodes.map((node) => normalizeMediaNode(node)).filter(Boolean);
  return { nodes };
}

function getStoredMediaTree() {
  try {
    const raw = localStorage.getItem(MEDIA_TREE_KEY);
    if (!raw) {
      const seeded = buildDefaultMediaTree();
      localStorage.setItem(MEDIA_TREE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    const normalized = normalizeMediaTree(parsed);
    if (!normalized.nodes.length) {
      const seeded = buildDefaultMediaTree();
      localStorage.setItem(MEDIA_TREE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalized;
  } catch {
    const seeded = buildDefaultMediaTree();
    localStorage.setItem(MEDIA_TREE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function setStoredMediaTree(tree) {
  const normalized = normalizeMediaTree(tree);
  localStorage.setItem(MEDIA_TREE_KEY, JSON.stringify(normalized));
  return normalized;
}

function getMediaNodes() {
  return getStoredMediaTree().nodes;
}

function setMediaNodes(nodes) {
  return setStoredMediaTree({ nodes }).nodes;
}

function findMediaNode(nodes, id) {
  return nodes.find((node) => node.id === id) || null;
}

function getMediaChildren(nodes, parentId, type) {
  return nodes.filter((node) => node.parentId === parentId && (!type || node.type === type));
}

function ensureMediaActiveSection(nodes) {
  if (!mediaActiveSectionId) return;
  const active = findMediaNode(nodes, mediaActiveSectionId);
  if (!active || active.type !== "section") {
    mediaActiveSectionId = null;
  }
}

function getMediaPath(nodes, sectionId) {
  const path = [];
  let current = sectionId ? findMediaNode(nodes, sectionId) : null;
  while (current && current.type === "section") {
    path.unshift(current);
    current = current.parentId ? findMediaNode(nodes, current.parentId) : null;
  }
  return path;
}

function countSectionChildren(nodes, sectionId) {
  const sections = getMediaChildren(nodes, sectionId, "section").length;
  const items = getMediaChildren(nodes, sectionId, "item").length;
  return { sections, items };
}

function sectionMetaText(counts) {
  const sectionsWord = mediaCopy("sectionsCount");
  const itemsWord = mediaCopy("itemsCount");
  return `${counts.sections} ${sectionsWord} - ${counts.items} ${itemsWord}`;
}

function renderMediaBreadcrumb(nodes) {
  if (!mediaBreadcrumb) return;
  mediaBreadcrumb.innerHTML = "";

  const rootBtn = document.createElement("button");
  rootBtn.type = "button";
  rootBtn.className = "media-crumb" + (!mediaActiveSectionId ? " active" : "");
  rootBtn.textContent = mediaCopy("root");
  rootBtn.addEventListener("click", () => {
    mediaActiveSectionId = null;
    renderMedia();
  });
  mediaBreadcrumb.appendChild(rootBtn);

  const path = getMediaPath(nodes, mediaActiveSectionId);
  path.forEach((section) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = section.id === mediaActiveSectionId;
    btn.className = "media-crumb" + (isActive ? " active" : "");
    btn.textContent = section.name;
    btn.disabled = isActive;
    btn.addEventListener("click", () => {
      mediaActiveSectionId = section.id;
      renderMedia();
    });
    mediaBreadcrumb.appendChild(btn);
  });
}

function renderMediaSections(nodes) {
  if (!mediaSectionList) return;
  const sections = getMediaChildren(nodes, mediaActiveSectionId, "section");
  mediaSectionList.innerHTML = "";

  if (!sections.length) {
    const empty = document.createElement("div");
    empty.className = "media-empty";
    empty.textContent = mediaCopy("emptySections");
    mediaSectionList.appendChild(empty);
    return;
  }

  sections.forEach((section) => {
    const counts = countSectionChildren(nodes, section.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "media-section-card";
    btn.innerHTML = `
      <strong>${section.name}</strong>
      <div class="small">${sectionMetaText(counts)}</div>
    `;
    btn.addEventListener("click", () => {
      mediaActiveSectionId = section.id;
      renderMedia();
    });
    mediaSectionList.appendChild(btn);
  });
}

function mediaFavoriteLabel(item) {
  const parent = item.parentName ? ` - ${item.parentName}` : "";
  return `${item.title}${parent}`;
}

function renderMediaItems(nodes) {
  if (!mediaItemList) return;
  const items = getMediaChildren(nodes, mediaActiveSectionId, "item");
  const assignedLabel = mediaCopy("assigned");
  const saveFavLabel = mediaCopy("saveFav");
  const parent = mediaActiveSectionId ? findMediaNode(nodes, mediaActiveSectionId) : null;
  const parentName = parent?.type === "section" ? parent.name : "";

  mediaItemList.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "media-item-card";
    card.innerHTML = `
      <h4>${item.title}</h4>
      <div class="small">${item.mediaType}</div>
      ${item.assigned ? `<div class="small">${assignedLabel}: ${item.assigned}</div>` : ""}
      ${item.note ? `<div class="small">${item.note}</div>` : ""}
    `;

    const btn = document.createElement("button");
    btn.textContent = saveFavLabel;
    btn.addEventListener("click", () => {
      const favs = getFavorites();
      const label = mediaFavoriteLabel({ ...item, parentName });
      if (!favs.includes(label)) {
        favs.unshift(label);
        setFavorites(favs);
        renderFavorites();
      }
    });

    card.appendChild(btn);
    mediaItemList.appendChild(card);
  });

  return items.length;
}

function renderMediaEmptyState(sectionCount, itemCount) {
  if (!mediaEmpty) return;
  const isEmpty = sectionCount === 0 && itemCount === 0;
  mediaEmpty.hidden = !isEmpty;
  mediaEmpty.textContent = isEmpty ? mediaCopy("empty") : "";
}

function bindMediaTools() {
  if (mediaToolsBound) return;

  if (mediaAddSectionBtn) {
    mediaAddSectionBtn.addEventListener("click", () => {
      const name = mediaNewSectionName?.value.trim();
      if (!name) {
        toast(mediaCopy("needSectionName"));
        return;
      }
      const nodes = getMediaNodes();
      nodes.push({
        id: makeMediaId("sec"),
        type: "section",
        name,
        parentId: mediaActiveSectionId
      });
      setMediaNodes(nodes);
      if (mediaNewSectionName) mediaNewSectionName.value = "";
      toast(mediaCopy("addSectionToast"));
      renderMedia();
    });
  }

  if (mediaAddItemBtn) {
    mediaAddItemBtn.addEventListener("click", () => {
      const title = mediaNewItemTitle?.value.trim();
      if (!title) {
        toast(mediaCopy("needItemTitle"));
        return;
      }
      const nodes = getMediaNodes();
      nodes.push({
        id: makeMediaId("item"),
        type: "item",
        title,
        mediaType: mediaNewItemType?.value || "Video",
        assigned: mediaNewItemAssigned?.value.trim() || "",
        note: mediaNewItemNote?.value.trim() || "",
        parentId: mediaActiveSectionId
      });
      setMediaNodes(nodes);
      if (mediaNewItemTitle) mediaNewItemTitle.value = "";
      if (mediaNewItemAssigned) mediaNewItemAssigned.value = "";
      if (mediaNewItemNote) mediaNewItemNote.value = "";
      toast(mediaCopy("addItemToast"));
      renderMedia();
    });
  }

  mediaToolsBound = true;
}

function renderMediaCoachTools(isCoach) {
  if (!mediaCoachTools) return;
  mediaCoachTools.classList.toggle("hidden", !isCoach);
  if (!isCoach) return;

  bindMediaTools();

  if (mediaAddSectionTitle) mediaAddSectionTitle.textContent = mediaCopy("addSectionTitle");
  if (mediaNewSectionLabel) mediaNewSectionLabel.textContent = mediaCopy("addSectionLabel");
  if (mediaAddSectionBtn) mediaAddSectionBtn.textContent = mediaCopy("addSectionBtn");
  if (mediaAddItemTitle) mediaAddItemTitle.textContent = mediaCopy("addItemTitle");
  if (mediaNewItemLabel) mediaNewItemLabel.textContent = mediaCopy("addItemLabel");
  if (mediaNewItemTypeLabel) mediaNewItemTypeLabel.textContent = mediaCopy("addItemTypeLabel");
  if (mediaNewItemAssignedLabel) mediaNewItemAssignedLabel.textContent = mediaCopy("addItemAssignedLabel");
  if (mediaNewItemNoteLabel) mediaNewItemNoteLabel.textContent = mediaCopy("addItemNoteLabel");
  if (mediaAddItemBtn) mediaAddItemBtn.textContent = mediaCopy("addItemBtn");

  if (mediaNewSectionName) mediaNewSectionName.placeholder = pickCopy(MEDIA_PLACEHOLDERS.section);
  if (mediaNewItemTitle) mediaNewItemTitle.placeholder = pickCopy(MEDIA_PLACEHOLDERS.item);
  if (mediaNewItemAssigned) mediaNewItemAssigned.placeholder = pickCopy(MEDIA_PLACEHOLDERS.assigned);
  if (mediaNewItemNote) mediaNewItemNote.placeholder = pickCopy(MEDIA_PLACEHOLDERS.note);
}

function renderMedia() {
  const nodes = getMediaNodes();
  ensureMediaActiveSection(nodes);
  const profile = getProfile();
  const isCoach = profile?.role === "coach";

  renderMediaBreadcrumb(nodes);
  renderMediaSections(nodes);
  const itemCount = renderMediaItems(nodes) || 0;
  const sectionCount = getMediaChildren(nodes, mediaActiveSectionId, "section").length;
  renderMediaEmptyState(sectionCount, itemCount);
  renderMediaCoachTools(isCoach);
}

// ---------- ANNOUNCEMENTS ----------
const announcementList = document.getElementById("announcementList");

function renderAnnouncements() {
  announcementList.innerHTML = "";
  getAnnouncementsData().forEach((note) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${note.title}</strong><div class="small">${note.detail} - ${note.time}</div>`;
    announcementList.appendChild(li);
  });
}
// ---------- DASHBOARD ----------
const teamStats = document.getElementById("teamStats");
const alertList = document.getElementById("alertList");
const teamOverview = document.getElementById("teamOverview");
const quickActions = document.getElementById("quickActions");

function renderDashboard() {
  teamStats.innerHTML = "";
  getTeamStatsData().forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<h3>${stat.value}</h3><p>${stat.title} - ${stat.note}</p>`;
    teamStats.appendChild(card);
  });

  teamOverview.innerHTML = "";
  getTeamOverviewData().forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    teamOverview.appendChild(li);
  });

  quickActions.innerHTML = "";
  getQuickActionsData().forEach((action) => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = action;
    quickActions.appendChild(btn);
  });

  alertList.innerHTML = "";
  getAlertsData().forEach((alert) => {
    const div = document.createElement("div");
    div.className = "alert";
    div.textContent = alert;
    alertList.appendChild(div);
  });
}

// ---------- COACH PROFILE ----------
const coachAccount = document.getElementById("coachAccount");
const coachProfile = document.getElementById("coachProfile");
const coachDiscipline = document.getElementById("coachDiscipline");
const coachStyle = document.getElementById("coachStyle");
const coachInternational = document.getElementById("coachInternational");

function renderCoachProfile() {
  coachAccount.innerHTML = "";
  getCoachAccountData().forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachAccount.appendChild(li);
  });

  coachProfile.innerHTML = "";
  getCoachProfileData().forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachProfile.appendChild(li);
  });

  coachDiscipline.innerHTML = "";
  getCoachDisciplineData().forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    coachDiscipline.appendChild(tag);
  });

  coachStyle.innerHTML = "";
  getCoachStyleData().forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    coachStyle.appendChild(tag);
  });

  coachInternational.innerHTML = "";
  getCoachInternationalData().forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachInternational.appendChild(li);
  });
}

// ---------- ATHLETE MANAGEMENT ----------
const athleteFilters = document.getElementById("athleteFilters");
const athleteList = document.getElementById("athleteList");
let selectedCoachTags = new Set();

function athleteMatchesTagFilter(tags = []) {
  const normalized = normalizeSmartTags(tags);
  if (!selectedCoachTags.size) return true;
  return normalized.some((tag) => selectedCoachTags.has(tag));
}

function renderAthleteFilters() {
  if (!athleteFilters) return;
  const filterLabel = currentLang === "es" ? "Filtrar por tags:" : "Filter by tags:";
  const clearLabel = currentLang === "es" ? "Limpiar" : "Clear";
  athleteFilters.innerHTML = "";

  const label = document.createElement("span");
  label.className = "filter-label";
  label.textContent = filterLabel;
  athleteFilters.appendChild(label);

  SMART_TAGS.forEach((tag) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-chip filter-tag";
    btn.textContent = `${tag.icon} ${pickCopy(tag.label)}`;
    btn.classList.toggle("active", selectedCoachTags.has(tag.id));
    btn.addEventListener("click", () => {
      if (selectedCoachTags.has(tag.id)) selectedCoachTags.delete(tag.id);
      else selectedCoachTags.add(tag.id);
      renderAthleteManagement();
    });
    athleteFilters.appendChild(btn);
  });

  if (selectedCoachTags.size) {
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "tag-chip clear-tag";
    clearBtn.textContent = clearLabel;
    clearBtn.addEventListener("click", () => {
      selectedCoachTags = new Set();
      renderAthleteManagement();
    });
    athleteFilters.appendChild(clearBtn);
  }
}

function renderAthleteManagement() {
  if (!athleteFilters || !athleteList) return;
  renderAthleteFilters();

  athleteList.innerHTML = "";
  const statusLabel = currentLang === "es" ? "Estado" : "Status";
  const preferredLabel = currentLang === "es" ? "Preferido" : "Preferred";
  const intlLabel = currentLang === "es" ? "Internacional" : "International";
  const athleteSummaryLabel = currentLang === "es" ? "Abrir resumen" : "Open athlete summary";
  const emptyLabel = currentLang === "es"
    ? "No hay atletas con esos tags."
    : "No athletes match those tags.";
  const athletes = getAthletesData();
  const filtered = athletes.filter((athlete) => athleteMatchesTagFilter(athlete.tags));

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "mini-card";
    empty.innerHTML = `<h3>${emptyLabel}</h3>`;
    athleteList.appendChild(empty);
    return;
  }

  filtered.forEach((athlete) => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    const tags = normalizeSmartTags(athlete.tags);
    const tagRow = tags.length
      ? `<div class="tag-row smart-tags">${tags
          .map((tag) => `<span class="tag smart-tag">${formatSmartTag(tag)}</span>`)
          .join("")}</div>`
      : "";
    card.innerHTML = `
      <h4>${athlete.name}</h4>
      <div class="small">${athlete.weight} - ${athlete.style}</div>
      <div class="small">${statusLabel}: ${athlete.availability}</div>
      <div class="small">${preferredLabel}: ${athlete.preferred}</div>
      <div class="small">${intlLabel}: ${athlete.international}</div>
      <div class="small">${athlete.history}</div>
      <div class="small">${athlete.notes}</div>
      ${tagRow}
    `;
    const btn = document.createElement("button");
    btn.textContent = athleteSummaryLabel;
    btn.addEventListener("click", () => {
      selectCoachMatchAthlete(athlete.name);
      showTab("coach-match");
    });
    card.appendChild(btn);
    athleteList.appendChild(card);
  });
}

// ---------- JOURNAL MONITOR ----------
const journalInsights = document.getElementById("journalInsights");
const journalFlags = document.getElementById("journalFlags");
const journalAthletes = document.getElementById("journalAthletes");

function renderJournalMonitor() {
  journalInsights.innerHTML = "";
  getJournalInsightsData().forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    journalInsights.appendChild(li);
  });

  journalFlags.innerHTML = "";
  getJournalFlagsData().forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    journalFlags.appendChild(li);
  });

  journalAthletes.innerHTML = "";
  const sleepLabel = currentLang === "es" ? "Sueno" : "Sleep";
  const energyLabel = currentLang === "es" ? "Energia" : "Energy";
  const sorenessLabel = currentLang === "es" ? "Dolor" : "Soreness";
  const moodLabel = currentLang === "es" ? "Animo" : "Mood";
  const weightLabel = currentLang === "es" ? "Tendencia de peso" : "Weight trend";
  getJournalAthletesData().forEach((athlete) => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    card.innerHTML = `
      <h4>${athlete.name}</h4>
      <div class="small">${sleepLabel}: ${athlete.sleep} - ${energyLabel}: ${athlete.energy}</div>
      <div class="small">${sorenessLabel}: ${athlete.soreness} - ${moodLabel}: ${athlete.mood}</div>
      <div class="small">${weightLabel}: ${athlete.weight}</div>
    `;
    journalAthletes.appendChild(card);
  });
}

// ---------- PERMISSIONS ----------
const permissionsCan = document.getElementById("permissionsCan");
const permissionsCannot = document.getElementById("permissionsCannot");

function renderPermissions() {
  permissionsCan.innerHTML = "";
  const permissions = getPermissionsData();
  permissions.can.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    permissionsCan.appendChild(li);
  });

  permissionsCannot.innerHTML = "";
  permissions.cannot.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    permissionsCannot.appendChild(li);
  });
}

// ---------- ONE-PAGER ----------
const onePagerHeader = document.getElementById("onePagerHeader");
const onePagerIdentity = document.getElementById("onePagerIdentity");
const onePagerTechniques = document.getElementById("onePagerTechniques");
const onePagerPlan = document.getElementById("onePagerPlan");
const onePagerDo = document.getElementById("onePagerDo");
const onePagerDont = document.getElementById("onePagerDont");
const onePagerCues = document.getElementById("onePagerCues");
const onePagerCueNotes = document.getElementById("onePagerCueNotes");
const onePagerSafety = document.getElementById("onePagerSafety");
const saveOnePagerPlan = document.getElementById("saveOnePagerPlan");
const saveOnePagerDos = document.getElementById("saveOnePagerDos");
const saveOnePagerCues = document.getElementById("saveOnePagerCues");
const saveOnePagerSafety = document.getElementById("saveOnePagerSafety");
const messageAthleteBtn = document.getElementById("messageAthleteBtn");
const openTrainingBtn = document.getElementById("openTrainingBtn");
const openTournamentBtn = document.getElementById("openTournamentBtn");
const addQuickNoteBtn = document.getElementById("addQuickNoteBtn");

function onePagerStorageKey(name) {
  return `wpl_onepager_${name || "athlete"}`;
}

function getOnePagerData(name) {
  try {
    return JSON.parse(localStorage.getItem(onePagerStorageKey(name)) || "null");
  } catch {
    return null;
  }
}

function setOnePagerData(name, data) {
  localStorage.setItem(onePagerStorageKey(name), JSON.stringify(data));
}

function buildOnePagerBase(athlete) {
  if (!athlete) return null;
  return {
    name: athlete.name,
    photo: athlete.photo || "",
    style: athlete.style,
    currentWeight: athlete.currentWeight || athlete.weight,
    weightClass: athlete.weightClass || athlete.weight,
    school: athlete.schoolName || "",
    club: athlete.clubName || "",
    years: athlete.years || athlete.level || "",
    international: athlete.international || "no",
    internationalEvents: athlete.internationalEvents || "",
    position: athlete.position || "neutral",
    strategy: athlete.strategy || "balanced",
    techniques: athlete.techniques || {
      neutral: [],
      top: [],
      bottom: [],
      defense: []
    },
    coachCues: athlete.coachCues || "specific",
    cueNotes: athlete.cueNotes || "",
    injuryNotes: athlete.injuryNotes || ""
  };
}

function renderOnePager(athleteName) {
  const defaultName = athleteName
    || (typeof coachMatchSelect !== "undefined" ? coachMatchSelect?.value : undefined)
    || getProfile()?.name
    || getAthletesData()[0]?.name;
  const athlete = getAthletesData().find((a) => a.name === defaultName) || getProfile();
  if (!athlete) return;
  const base = buildOnePagerBase(athlete);
  const saved = getOnePagerData(base.name) || {};
  const defaultPlan =
    currentLang === "es"
      ? "Puntua primero con pierna simple. Mantente pesado arriba."
      : "Score first with single leg. Stay heavy on top.";
  const defaultDo =
    currentLang === "es"
      ? "Empuja el ritmo temprano. Mantener codos cerrados."
      : "Push pace early. Keep elbows tight.";
  const defaultDont =
    currentLang === "es"
      ? "Sobre extenderse en tiros. Colgarse en el underhook."
      : "Overextend on shots. Hang in underhook.";
  const merged = {
    ...base,
    plan: saved.plan || defaultPlan,
    do: saved.do || defaultDo,
    dont: saved.dont || defaultDont,
    coachCues: saved.coachCues || base.coachCues,
    cueNotes: saved.cueNotes || base.cueNotes,
    injuryNotes: saved.injuryNotes || base.injuryNotes
  };
  const na = currentLang === "es" ? "N/D" : "N/A";
  const schoolNA = currentLang === "es" ? "Escuela N/D" : "School N/A";
  const yearsValue = merged.years || "";
  const yearsDisplay = yearsValue ? getLevelLabel(yearsValue) || yearsValue : na;
  const styleDisplay = merged.style
    ? translateOptionValue("aStyle", merged.style) || translateValue(merged.style)
    : na;
  const positionDisplay = translateOptionValue("pPosition", merged.position) || na;
  const strategyDisplay = translateOptionValue("pStrategy", merged.strategy) || na;
  const internationalDisplay = translateOptionValue("pInternational", merged.international) || na;
  const intlEventsDisplay =
    merged.internationalEvents ||
    (currentLang === "es" ? "No hay eventos internacionales" : "No international events listed");
  const neutralTech = translateTechniqueList(merged.techniques.neutral);
  const topTech = translateTechniqueList(merged.techniques.top);
  const bottomTech = translateTechniqueList(merged.techniques.bottom);
  const defenseTech = translateTechniqueList(merged.techniques.defense);

  if (onePagerHeader) {
    const initials = merged.name ? merged.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "AT";
    onePagerHeader.innerHTML = `
      <div class="onepager-avatar">${initials}</div>
      <div>
        <h3>${merged.name}</h3>
        <div class="small">${styleDisplay} - ${merged.currentWeight} (${merged.weightClass})</div>
        <div class="small">${merged.school || schoolNA} ${merged.club ? "- " + merged.club : ""}</div>
      </div>
    `;
  }

  if (onePagerIdentity) {
    onePagerIdentity.innerHTML = `
      <h3>${currentLang === "es" ? "Experiencia e identidad" : "Experience & Identity"}</h3>
      <ul class="list">
        <li>${currentLang === "es" ? "Experiencia" : "Experience"}: ${yearsDisplay}</li>
        <li>${currentLang === "es" ? "Internacional" : "International"}: ${internationalDisplay}</li>
        <li>${intlEventsDisplay}</li>
        <li>${currentLang === "es" ? "Posicion preferida" : "Preferred position"}: ${positionDisplay}</li>
        <li>${currentLang === "es" ? "Estrategia" : "Strategy"}: ${strategyDisplay}</li>
      </ul>
    `;
  }

  if (onePagerTechniques) {
    onePagerTechniques.innerHTML = `
      <h3>${currentLang === "es" ? "Tecnicas predeterminadas" : "Default Techniques"}</h3>
      <ul class="list">
        <li>${currentLang === "es" ? "Neutral" : "Neutral"}: ${neutralTech.join(", ") || na}</li>
        <li>${currentLang === "es" ? "Arriba" : "Top"}: ${topTech.join(", ") || na}</li>
        <li>${currentLang === "es" ? "Abajo" : "Bottom"}: ${bottomTech.join(", ") || na}</li>
        <li>${currentLang === "es" ? "Defensa" : "Defense"}: ${defenseTech.join(", ") || na}</li>
      </ul>
    `;
  }

  if (onePagerPlan) onePagerPlan.value = merged.plan;
  if (onePagerDo) onePagerDo.value = merged.do;
  if (onePagerDont) onePagerDont.value = merged.dont;
  if (onePagerCues) onePagerCues.value = merged.coachCues;
  if (onePagerCueNotes) onePagerCueNotes.value = merged.cueNotes;
  if (onePagerSafety) onePagerSafety.value = merged.injuryNotes;
}

function saveOnePagerField(field, value) {
  const name = coachMatchSelect?.value || "Athlete";
  const current = getOnePagerData(name) || {};
  setOnePagerData(name, { ...current, [field]: value });
  toast(pickCopy({ en: "One-pager saved.", es: "Resumen guardado." }));
}

if (saveOnePagerPlan) {
  saveOnePagerPlan.addEventListener("click", () => {
    saveOnePagerField("plan", onePagerPlan.value.trim());
  });
}

if (saveOnePagerDos) {
  saveOnePagerDos.addEventListener("click", () => {
    saveOnePagerField("do", onePagerDo.value.trim());
    saveOnePagerField("dont", onePagerDont.value.trim());
  });
}

if (saveOnePagerCues) {
  saveOnePagerCues.addEventListener("click", () => {
    saveOnePagerField("coachCues", onePagerCues.value);
    saveOnePagerField("cueNotes", onePagerCueNotes.value.trim());
  });
}

if (saveOnePagerSafety) {
  saveOnePagerSafety.addEventListener("click", () => {
    saveOnePagerField("injuryNotes", onePagerSafety.value.trim());
  });
}

if (messageAthleteBtn) {
  messageAthleteBtn.addEventListener("click", () => {
    showTab("messages");
  });
}

if (openTrainingBtn) {
  openTrainingBtn.addEventListener("click", () => {
    showTab("plans");
  });
}

if (openTournamentBtn) {
  openTournamentBtn.addEventListener("click", () => {
    showTab("calendar-manager");
  });
}

if (addQuickNoteBtn) {
  addQuickNoteBtn.addEventListener("click", () => {
    showTab("athlete-notes");
  });
}

// ---------- COACH MATCH VIEW ----------
const coachMatchSelect = document.getElementById("coachMatchSelect");
const coachMatchSelectLabel = document.getElementById("coachMatchSelectLabel");
const coachMatchAvatar = document.getElementById("coachMatchAvatar");
const coachMatchName = document.getElementById("coachMatchName");
const coachMatchMeta = document.getElementById("coachMatchMeta");
const coachMatchBasics = document.getElementById("coachMatchBasics");
const coachMatchPosition = document.getElementById("coachMatchPosition");
const coachMatchOffense = document.getElementById("coachMatchOffense");
const coachMatchDefense = document.getElementById("coachMatchDefense");
const coachMatchPsych = document.getElementById("coachMatchPsych");
const coachMatchGoal = document.getElementById("coachMatchGoal");
const coachMatchCue = document.getElementById("coachMatchCue");
const coachMatchArchetype = document.getElementById("coachMatchArchetype");
const coachMatchBodyType = document.getElementById("coachMatchBodyType");
const coachMatchCueWords = document.getElementById("coachMatchCueWords");

const MATCH_VIEW_COPY = {
  en: {
    selectAthlete: "Select athlete",
    snapshot: "Match Snapshot",
    style: "Style",
    experience: "Years of experience",
    weight: "Current weight",
    category: "Weight category",
    positionalStrengthTitle: "Positional Strength (1-10)",
    positionalStrengthFallback: "Strength details not set yet",
    offenseTitle: "Top 3 Offensive Moves",
    defenseTitle: "Top 3 Defensive Moves",
    psychTitle: "Psychological Tendency",
    tendency: "Tendency",
    error: "Common error under pressure",
    cueWordsTitle: "Cue Words",
    cueWordsHint: "Short, intentional reminders that help the athlete focus, reset, or return to core principles.",
    cueWordsEmpty: "No cue words saved yet.",
    archetypeTitle: "Archetype",
    archetypeFallback: "No archetype chosen yet",
    cueTitle: "Coach Key Signal",
    cueHint: "If X happens -> do Y",
    bodyTypeTitle: "Body Type",
    bodyTypeFallback: "Body type not set yet",
    goalTitle: "Athlete Goal",
    goalFallback: "Goal not set yet",
    yearsUnit: "years"
  },
  es: {
    selectAthlete: "Seleccionar atleta",
    snapshot: "Vista rapida",
    style: "Estilo",
    experience: "Anos de experiencia",
    weight: "Peso actual",
    category: "Categoria",
    positionalStrengthTitle: "Fuerza posicional (1-10)",
    positionalStrengthFallback: "Aun no registramos la fuerza",
    offenseTitle: "Top 3 ofensivos",
    defenseTitle: "Top 3 defensivos",
    psychTitle: "Tendencia psicologica",
    tendency: "Tendencia",
    error: "Error comun bajo presion",
    cueWordsTitle: "Cue Words",
    cueWordsHint: "Recordatorios cortos e intencionales que ayudan al atleta a enfocarse, resetearse o volver a los principios.",
    cueWordsEmpty: "Todavia no hay cue words guardadas.",
    archetypeTitle: "Arquetipo",
    archetypeFallback: "Aun no se selecciono un arquetipo",
    cueTitle: "Senal clave del coach",
    cueHint: "Si pasa X -> haz Y",
    bodyTypeTitle: "Tipo de cuerpo",
    bodyTypeFallback: "Tipo de cuerpo sin registrar",
    goalTitle: "Meta del atleta",
    goalFallback: "Meta aun no registrada",
    yearsUnit: "anos"
  },
  uz: {
    selectAthlete: "Sportchini tanlang",
    snapshot: "Match qisqacha ko‘rinish",
    style: "Uslub",
    experience: "Tajriba yillari",
    weight: "Hozirgi vazn",
    category: "Vazn toifasi",
    positionalStrengthTitle: "Pozitsion kuch (1-10)",
    positionalStrengthFallback: "Kuch tafsilotlari hali yo‘q",
    offenseTitle: "Top 3 hujum harakati",
    defenseTitle: "Top 3 mudofaa harakati",
    psychTitle: "Psixologik moyillik",
    tendency: "Moyillik",
    error: "Bosim ostidagi keng tarqalgan xato",
    cueWordsTitle: "Cue so‘zlar",
    cueWordsHint: "Sportchini fokusga keltiruvchi qisqa eslatmalar.",
    cueWordsEmpty: "Hech qanday cue so‘zlar saqlanmadi.",
    archetypeTitle: "Arketip",
    archetypeFallback: "Arketip hali tanlanmagan",
    cueTitle: "Murabbiy signal",
    cueHint: "Agar X sodir bo‘lsa -> Y qiling",
    bodyTypeTitle: "Jismoniy tip",
    bodyTypeFallback: "Jismoniy tip hali mavjud emas",
    goalTitle: "Sportchi maqsadi",
    goalFallback: "Maqsad hali mavjud emas",
    yearsUnit: "yil"
  },
  ru: {
    selectAthlete: "Выберите спортсмена",
    snapshot: "Снимок матча",
    style: "Стиль",
    experience: "Лет опыта",
    weight: "Текущий вес",
    category: "Весовая категория",
    positionalStrengthTitle: "Уровень позиций (1-10)",
    positionalStrengthFallback: "Данные о силе еще не заданы",
    offenseTitle: "Топ-3 атакующих приемов",
    defenseTitle: "Топ-3 защитных приемов",
    psychTitle: "Психологическая склонность",
    tendency: "Склонность",
    error: "Типичная ошибка под давлением",
    cueWordsTitle: "Подсказки",
    cueWordsHint: "Короткие напоминания, помогающие спортсмену сосредоточиться.",
    cueWordsEmpty: "Подсказки пока не сохранены.",
    archetypeTitle: "Архетип",
    archetypeFallback: "Архетип не выбран",
    cueTitle: "Ключевой сигнал тренера",
    cueHint: "Если X происходит -> делай Y",
    bodyTypeTitle: "Тип телосложения",
    bodyTypeFallback: "Тип тела не задан",
    goalTitle: "Цель спортсмена",
    goalFallback: "Цель не задана",
    yearsUnit: "лет"
  }
};

function matchCopy(key) {
  const table = MATCH_VIEW_COPY[resolveLang(currentLang)] || MATCH_VIEW_COPY.en;
  return table[key] || MATCH_VIEW_COPY.en[key] || key;
}

function normalizePositionKey(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.startsWith("top") || raw.startsWith("arr")) return "top";
  if (raw.startsWith("bot") || raw.startsWith("aba")) return "bottom";
  return "neutral";
}

function extractExperienceYears(athlete) {
  if (!athlete) return "";
  if (athlete.experienceYears) return String(athlete.experienceYears);
  if (athlete.years) return String(athlete.years);
  const history = String(athlete.history || "");
  const match = history.match(/(\d+)\s*(year|ano)/i);
  return match ? match[1] : "";
}

function topThree(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(Boolean).slice(0, 3);
}

function createPositionStrengths(athlete) {
  if (!athlete) return [];
  const provided = athlete.positionStrengths || athlete.positionalStrength;
  if (Array.isArray(provided) && provided.length) {
    return provided
      .filter((entry) => entry && (entry.name || entry.position))
      .map((entry) => ({
        name: entry.name || entry.position,
        strength: Math.min(10, Math.max(0, Number(entry.strength ?? entry.value ?? 0)))
      }));
  }

  const favorite = (athlete.favoritePosition || athlete.position || "").trim().toLowerCase();
  const baseStats = [
    { name: "Neutral", strength: 7 },
    { name: "Top", strength: 6 },
    { name: "Bottom", strength: 6 }
  ];

  return baseStats.map((entry) => {
    const key = entry.name.toLowerCase();
    const boost = favorite && (favorite === key || favorite.startsWith(key)) ? 2 : 0;
    return {
      name: entry.name,
      strength: Math.min(10, entry.strength + boost)
    };
  });
}

function strategyToTendency(strategy) {
  const key = String(strategy || "").toLowerCase();
  if (key.includes("offensive")) return "aggressive";
  if (key.includes("defensive")) return "conservative";
  if (key.includes("counter")) return "counterattack";
  return "conservative";
}

function buildCoachMatchData(athleteName) {
  const athlete =
    getAthletesData().find((a) => a.name === athleteName) ||
    ATHLETES.find((a) => a.name === athleteName) ||
    getProfile();
  if (!athlete) return null;
  const saved = getOnePagerData(athlete.name) || {};
  const positionKey = normalizePositionKey(athlete.favoritePosition || athlete.position);
  const offense = topThree(athlete.offenseTop3 || athlete.techniques?.neutral || []);
  const defense = topThree(athlete.defenseTop3 || athlete.techniques?.defense || []);
  const tendency = athlete.psychTendency || strategyToTendency(athlete.strategy);
  const coachSignal = saved.cueNotes || athlete.coachSignal || saved.plan || "";
  const goalText = saved.goal || athlete.goal || athlete.mainGoal || "";
  const archetype = saved.archetype || athlete.archetype || athlete.profile?.archetype || "";
  const bodyType = saved.bodyType || athlete.bodyType || athlete.profile?.bodyType || "";
  const cueWords = saved.cueWords || athlete.cueWords || athlete.profile?.cueWords || [];
  return {
    name: athlete.name,
    style: athlete.style,
    experienceYears: extractExperienceYears(athlete),
    currentWeight: athlete.currentWeight || athlete.weight || "",
    weightClass: athlete.weightClass || "",
    goal: goalText,
    archetype,
    bodyType,
    cueWords,
    positionStrengths: createPositionStrengths(athlete),
    positionKey,
    offense,
    defense,
    tendency,
    pressureError: athlete.pressureError || saved.dont || "",
    coachSignal
  };
}

function renderCoachMatchView(athleteName) {
  if (!coachMatchSelect) return;
  const data = buildCoachMatchData(athleteName);
  if (!data) return;
  const na = currentLang === "es" ? "N/D" : "N/A";
  const initials = data.name
    ? data.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AT";
  const styleDisplay = data.style
    ? translateOptionValue("aStyle", data.style) || translateValue(data.style)
    : na;
  const experienceDisplay = data.experienceYears
    ? `${data.experienceYears} ${matchCopy("yearsUnit")}`
    : na;
  const weightDisplay = data.currentWeight || na;
  const categoryDisplay = data.weightClass || na;
  const positionStrengthList = data.positionStrengths || [];
  const offenseDisplay = translateTechniqueList(data.offense).join(", ") || na;
  const defenseDisplay = translateTechniqueList(data.defense).join(", ") || na;
  const tendencyDisplay =
    translateOptionValue("aPsychTendency", data.tendency) ||
    translateValue(data.tendency) ||
    na;
  const errorDisplay = data.pressureError || na;
  const archetypeDisplay =
    translateOptionValue("aArchetype", data.archetype) ||
    translateValue(data.archetype) ||
    matchCopy("archetypeFallback");
  const bodyTypeDisplay =
    translateOptionValue("aBodyType", data.bodyType) ||
    translateValue(data.bodyType) ||
    matchCopy("bodyTypeFallback");
  const cueDisplay = data.coachSignal || matchCopy("cueHint");
  const cueWordsList = (data.cueWords || []).filter(Boolean);
  const cueWordsHtml = cueWordsList.length
    ? `<ul class="list tight cue-word-list">${cueWordsList.map((word) => `<li>${word}</li>`).join("")}</ul>`
    : `<div class="small muted">${matchCopy("cueWordsEmpty")}</div>`;
  const goalDisplay = data.goal || matchCopy("goalFallback");

  if (coachMatchSelectLabel) coachMatchSelectLabel.textContent = matchCopy("selectAthlete");
  if (coachMatchAvatar) coachMatchAvatar.textContent = initials;
  if (coachMatchName) coachMatchName.textContent = data.name;
  if (coachMatchMeta) coachMatchMeta.textContent = `${styleDisplay} - ${weightDisplay} (${categoryDisplay})`;

  if (coachMatchBasics) {
    coachMatchBasics.innerHTML = `
      <h3>${matchCopy("snapshot")}</h3>
      <ul class="list tight">
        <li>${matchCopy("style")}: ${styleDisplay}</li>
        <li>${matchCopy("experience")}: ${experienceDisplay}</li>
        <li>${matchCopy("weight")}: ${weightDisplay}</li>
        <li>${matchCopy("category")}: ${categoryDisplay}</li>
      </ul>
    `;
  }

  if (coachMatchPosition) {
    const strengthItems = positionStrengthList.length
      ? positionStrengthList
          .map(
            (entry) =>
              `<li>${translateValue(entry.name)}: ${entry.strength}/10</li>`
          )
          .join("")
      : `<li>${matchCopy("positionalStrengthFallback")}</li>`;
    coachMatchPosition.innerHTML = `
      <h3>${matchCopy("positionalStrengthTitle")}</h3>
      <ul class="list tight">
        ${strengthItems}
      </ul>
    `;
  }

  if (coachMatchOffense) {
    coachMatchOffense.innerHTML = `
      <h3>${matchCopy("offenseTitle")}</h3>
      <div class="match-highlight">${offenseDisplay}</div>
    `;
  }

  if (coachMatchDefense) {
    coachMatchDefense.innerHTML = `
      <h3>${matchCopy("defenseTitle")}</h3>
      <div class="match-highlight">${defenseDisplay}</div>
    `;
  }

  if (coachMatchPsych) {
    coachMatchPsych.innerHTML = `
      <h3>${matchCopy("psychTitle")}</h3>
      <ul class="list tight">
        <li>${matchCopy("tendency")}: ${tendencyDisplay}</li>
        <li>${matchCopy("error")}: ${errorDisplay}</li>
      </ul>
    `;
  }

  if (coachMatchArchetype) {
    coachMatchArchetype.innerHTML = `
      <h3>${matchCopy("archetypeTitle")}</h3>
      <div class="match-highlight">${archetypeDisplay}</div>
    `;
  }

  if (coachMatchCueWords) {
    coachMatchCueWords.innerHTML = `
      <h3>${matchCopy("cueWordsTitle")}</h3>
      <p class="small muted">${matchCopy("cueWordsHint")}</p>
      ${cueWordsHtml}
    `;
  }

  if (coachMatchBodyType) {
    coachMatchBodyType.innerHTML = `
      <h3>${matchCopy("bodyTypeTitle")}</h3>
      <div class="match-highlight">${bodyTypeDisplay}</div>
    `;
  }

  if (coachMatchGoal) {
    coachMatchGoal.innerHTML = `
      <h3>${matchCopy("goalTitle")}</h3>
      <div class="match-highlight">${goalDisplay}</div>
    `;
  }

  if (coachMatchCue) {
    coachMatchCue.innerHTML = `
      <h3>${matchCopy("cueTitle")}</h3>
      <div class="match-cue">${cueDisplay}</div>
    `;
  }
  renderOnePager(data.name);
}

function selectCoachMatchAthlete(name) {
  if (!coachMatchSelect) return;
  coachMatchSelect.value = name;
  renderCoachMatchView(name);
}

if (coachMatchSelect) {
  coachMatchSelect.innerHTML = "";
  getAthletesData().forEach((athlete) => {
    const option = document.createElement("option");
    option.value = athlete.name;
    option.textContent = athlete.name;
    coachMatchSelect.appendChild(option);
  });
  coachMatchSelect.addEventListener("change", () => renderCoachMatchView(coachMatchSelect.value));
  const defaultName = getAthletesData()[0]?.name;
  if (defaultName) selectCoachMatchAthlete(defaultName);
}

// ---------- MESSAGES ----------
const messageList = document.getElementById("messageList");

function renderMessages() {
  if (!messageList) return;
  messageList.innerHTML = "";
  getCoachMessagesData().forEach((msg) => {
    const card = document.createElement("div");
    card.className = "message-card";
    card.innerHTML = `
      <div class="tag-pill">${msg.tag}</div>
      <h4>${msg.athlete}</h4>
      <div class="small">${msg.text}</div>
      <div class="small">${msg.time}</div>
    `;
    messageList.appendChild(card);
  });
}

// ---------- SKILLS ----------
const skillsGrid = document.getElementById("skillsGrid");

function renderSkills() {
  skillsGrid.innerHTML = "";
  const bestClipLabel = currentLang === "es" ? "Mejor clip" : "Best clip";
  const notesLabel = currentLang === "es" ? "Notas" : "Notes";
  const updatedLabel = currentLang === "es" ? "Actualizado" : "Updated";
  getSkillsData().forEach((skill) => {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <h3>${skill.name}</h3>
      <div class="rating">${skill.rating}</div>
      <div class="small">${bestClipLabel}: ${skill.clip}</div>
      <div class="small">${notesLabel}: ${skill.notes}</div>
      <div class="small">${updatedLabel}: ${skill.updated}</div>
    `;
    skillsGrid.appendChild(card);
  });
}

// ---------- JOURNAL ----------
const journalInput = document.getElementById("journalInput");
const saveJournalBtn = document.getElementById("saveJournalBtn");
const journalStatus = document.getElementById("journalStatus");
const journalEntries = document.getElementById("journalEntries");
const JOURNAL_ENTRIES_KEY = "wpl_journal_entries";

function getJournalEntries() {
  const saved = localStorage.getItem(JOURNAL_ENTRIES_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatJournalDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const locale = currentLang === "es" ? "es-PR" : "en-US";
  return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function renderJournalEntries() {
  if (!journalEntries) return;
  const entries = getJournalEntries();
  if (!entries.length) {
    journalEntries.innerHTML = `<p class="small muted">${pickCopy({ en: "No journal entries yet.", es: "Todavia no hay entradas de diario." })}</p>`;
    return;
  }
  journalEntries.innerHTML = entries
    .slice()
    .reverse()
    .map((entry) => {
      const date = formatJournalDate(entry.date);
      return `
        <div class="journal-entry-card">
          <div class="journal-entry-date">${date || pickCopy({ en: "Unknown time", es: "Hora desconocida" })}</div>
          <p>${entry.note.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>
      `;
    })
    .join("");
}

function saveJournalEntry() {
  if (!journalInput) return;
  const note = journalInput.value.trim();
  if (!note) {
    journalStatus.textContent = pickCopy({ en: "Write something before saving.", es: "Escribe algo antes de guardar." });
    setTimeout(() => (journalStatus.textContent = ""), 1600);
    return;
  }
  const entries = getJournalEntries();
  entries.push({ date: new Date().toISOString(), note });
  localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
  journalInput.value = "";
  journalStatus.textContent = pickCopy({ en: "Entry saved.", es: "Entrada guardada." });
  setTimeout(() => (journalStatus.textContent = ""), 1600);
  renderJournalEntries();
}

if (saveJournalBtn) {
  saveJournalBtn.addEventListener("click", saveJournalEntry);
}

async function startApp() {
  renderJournalEntries();
  await bootProfile();
  renderToday();
  renderFeelingScale();
  renderPlanGrid();
  renderCalendar();
  renderCalendarManager();
  renderMedia();
  renderAnnouncements();
  renderDashboard();
  renderCoachProfile();
  renderAthleteManagement();
  renderJournalMonitor();
  renderPermissions();
  renderMessages();
  renderSkills();
  initializePlanSelectors();
}

startApp();
