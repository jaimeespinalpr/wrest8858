// ==============================
// Wrestling Performance Lab
// Role-based views + training experience
// ==============================

// ---------- PROFILE / ONBOARDING ----------
const PROFILE_KEY = "wpl_profile";
const AUTH_USER_KEY = "wpl_auth_user";
const DEFAULT_LANG = "en";
const APP_TIMEZONE = "America/New_York";
const SUPPORTED_LANGS = new Set(["en", "es", "uz", "ru"]);
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
const FIREBASE_SHARED_COLLECTION = window.FIREBASE_SHARED_COLLECTION || "shared_app";
const FIREBASE_MEDIA_TREE_DOC = window.FIREBASE_MEDIA_TREE_DOC || "media_tree";
const FIREBASE_MESSAGE_THREADS_COLLECTION = "message_threads";
const FIREBASE_COACH_WORKSPACES_COLLECTION = "coach_workspaces";
const WPL_MEDIA_UPLOADS_ROOT = String(window.WPL_MEDIA_UPLOADS_ROOT || "media_uploads").trim().replace(/^\/+|\/+$/g, "");
let firebaseAuthInstance = null;
let firebaseFirestoreInstance = null;
let firebaseStorageInstance = null;
let profileSyncTimeout = null;
const FIREBASE_OP_TIMEOUT_MS = 12000;
const MEDIA_BASE_URL = String(window.WPL_MEDIA_BASE_URL || "").trim().replace(/\/+$/, "");
const TEST_USER_DEFAULTS = {
  "coach.test@wpl.app": { role: "coach", name: "Coach Demo" },
  "athlete.test@wpl.app": { role: "athlete", name: "Athlete Demo" },
  "gmunch@united-wc.com": { role: "admin", name: "System Admin" }
};
const FORCED_ADMIN_EMAILS = new Set(["gmunch@united-wc.com"]);
const OFFICIAL_COACH_EMAILS = new Set([
  "jespinal@united-wc.com",
  "avalencia@united-wc.com",
  "gmunch@united-wc.com",
  "cwitte@united-wc.com",
  "smunch@united-wc.com",
  "zspence@united-wc.com",
  "csizemore@united-wc.com"
]);
const SIGNUP_ALLOWED_ROLES = new Set(["athlete", "coach", "parent"]);
let coachWorkspaceRealtimeUserId = "";
let coachWorkspaceUnsubs = [];
let coachPlansCache = [];
let coachTemplatesCache = [];
let coachAssignmentsCache = [];
let coachGroupsCache = [];
let coachCalendarEntriesCache = {};
let coachAthletesCache = [];
let coachNotesCache = [];
let coachJournalEntriesCache = [];
let coachCompletionCache = [];
let coachMatchAnalysisCache = [];
let coachParentApprovalsCache = [];
let coachDirectoryCache = [];
let coachParentScoutingCache = [];
let coachWorkspaceSeedPromise = null;
let coachCalendarSyncTimeout = null;
let coachCompletionSyncTimeout = null;
let coachPlanSyncState = {
  lastSavedId: "",
  lastSavedType: "",
  saving: false
};
let currentEditingCoachPlanId = "";
let parentPortalUserUnsub = null;
let parentPortalDataUnsubs = [];
let parentPortalAthleteCache = null;
let parentPortalTeamCache = [];
let parentPortalAssignmentsCache = [];
let parentPortalPlansCache = [];
let parentPortalJournalCache = [];
let parentPortalScoutingCache = [];
let parentPortalPlanFetchKey = "";
let parentScoutingRecorder = null;
let parentScoutingStream = null;
let parentScoutingAudioChunks = [];
let parentScoutingAudioBlob = null;
let parentScoutingAudioUrl = "";
const PARENT_INLINE_MEDIA_MAX_BYTES = 240 * 1024;

function initFirebaseClient() {
  if (typeof firebase === "undefined" || !window.FIREBASE_CONFIG) return null;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    const auth = firebase.auth();
    const firestore = firebase.firestore ? firebase.firestore() : null;
    const storage = firebase.storage ? firebase.storage() : null;
    return { auth, firestore, storage };
  } catch (err) {
    console.warn("Firebase init failed:", err);
    return null;
  }
}

(function setupFirebase() {
  const client = initFirebaseClient();
  firebaseAuthInstance = client?.auth ?? null;
  firebaseFirestoreInstance = client?.firestore ?? null;
  firebaseStorageInstance = client?.storage ?? null;
})();

function withTimeout(promise, ms, code = "operation_timeout") {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(code);
      err.code = code;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

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
const viewSwitchWrap = viewSwitchBtn?.closest(".view-switch");
const currentViewLabel = document.getElementById("currentViewLabel");
const headerMenu = document.getElementById("headerMenu");
const userMeta = document.getElementById("userMeta");
const roleMeta = document.getElementById("roleMeta");
const nowMeta = document.getElementById("nowMeta");
const editProfileBtn = document.getElementById("editProfileBtn");
const headerLang = document.getElementById("headerLang");
const headerFlag = document.getElementById("headerFlag");
const loginFormWrap = document.getElementById("loginFormWrap");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const createAccountBtn = document.getElementById("createAccountBtn");
const registerModal = document.getElementById("registerModal");
const registerCloseBtn = document.getElementById("registerCloseBtn");
const registerSigninBtn = document.getElementById("registerSigninBtn");
const adminUsersTitle = document.getElementById("adminUsersTitle");
const adminUsersStatus = document.getElementById("adminUsersStatus");
const adminUsersList = document.getElementById("adminUsersList");
const adminUsersReloadBtn = document.getElementById("adminUsersReloadBtn");
let athleteProfileForm;
let competitionPreview;
const parentViewNotice = document.getElementById("parentViewNotice");
const parentViewNoticeTitle = document.getElementById("parentViewNoticeTitle");
const parentViewNoticeSubtitle = document.getElementById("parentViewNoticeSubtitle");
const todayTitle = document.getElementById("todayTitle");
const todaySubtitle = document.getElementById("todaySubtitle");
const todayType = document.getElementById("todayType");
const sessionBlocks = document.getElementById("sessionBlocks");
const startSessionBtn = document.getElementById("startSessionBtn");
const watchFilmBtn = document.getElementById("watchFilmBtn");
const logCompletionBtn = document.getElementById("logCompletionBtn");
const feelingScale = document.getElementById("feelingScale");
const dailyStatus = document.getElementById("dailyStatus");
const planGrid = document.getElementById("planGrid");
const planDayTitle = document.getElementById("planDayTitle");
const planDayDetail = document.getElementById("planDayDetail");
const calendarGrid = document.getElementById("calendarMonthGrid");
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
const MONTHS_VISIBLE = 4;
const AUTH_STRICT = true;
let calendarViewDate = startOfMonth(getCurrentAppDate());
let calendarSelectedKey = getCurrentAppDateKey();
let calendarNavBound = false;
let calendarCoachBound = false;
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
const PARENT_VIEW_NOTICE_COPY = {
  title: {
    en: "Parent view is active",
    es: "La vista de padres está activa",
    uz: "Ota-ona ko'rinishi faol",
    ru: "Родительский вид активен"
  },
  message: {
    en: "Parents can review schedule, media, notes, and coach communication from this view.",
    es: "Los padres pueden revisar calendario, multimedia, notas y comunicación del coach desde esta vista.",
    uz: "Ota-onalar ushbu ko'rinishdan jadval, media, eslatmalar va murabbiy xabarlarini ko'rishi mumkin.",
    ru: "Из этого режима родители могут смотреть расписание, медиа, заметки и сообщения тренера."
  }
};
const VIEW_ROLE_MAP = {
  athlete: "athlete",
  coach: "coach",
  admin: "admin",
  parent: "parent"
};

const ROLE_ALLOWED_VIEWS = {
  athlete: ["athlete"],
  coach: ["coach"],
  admin: ["admin", "coach", "athlete", "parent"],
  parent: ["parent"]
};

function isAdminRole(role) {
  return normalizeAuthRole(role) === "admin";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isForcedAdminEmail(email) {
  return FORCED_ADMIN_EMAILS.has(normalizeEmail(email));
}

function getFirebaseSessionSnapshot() {
  const user = firebaseAuthInstance?.currentUser;
  if (!user?.uid) return null;
  return {
    id: String(user.uid || "").trim(),
    email: normalizeEmail(user.email || "")
  };
}

function hasTrustedAdminSession({ email = "", userId = "" } = {}) {
  const targetEmail = normalizeEmail(email);
  if (!isForcedAdminEmail(targetEmail)) return false;
  const session = getFirebaseSessionSnapshot();
  if (!session) return false;
  if (targetEmail && session.email !== targetEmail) return false;
  const targetId = String(userId || "").trim();
  if (targetId && session.id !== targetId) return false;
  return true;
}

function isCoachRole(role) {
  const normalized = normalizeAuthRole(role);
  return normalized === "coach" || normalized === "admin";
}

function enforceStrictAuthUI() {
  if (!AUTH_STRICT) return;
  const activeRole = getActiveRoleForView();
  if (activeRole === "admin") {
    [skipBtn, quickSkipBtn, quickContinueBtn, guestAthleteBtn, guestCoachBtn].forEach((btn) => {
      if (!btn) return;
      btn.hidden = true;
      btn.disabled = true;
    });
    if (viewSwitchWrap) viewSwitchWrap.classList.remove("hidden");
    if (viewMenu) viewMenu.classList.remove("hidden");
    headerViewButtons.forEach((btn) => {
      btn.hidden = false;
      btn.disabled = false;
    });
    const headerViewSection = headerMenu?.querySelector(".header-menu-section");
    if (headerViewSection) headerViewSection.classList.remove("hidden");
    return;
  }
  [skipBtn, quickSkipBtn, quickContinueBtn, guestAthleteBtn, guestCoachBtn].forEach((btn) => {
    if (!btn) return;
    btn.hidden = true;
    btn.disabled = true;
  });
  if (viewSwitchWrap) viewSwitchWrap.classList.add("hidden");
  if (viewMenu) viewMenu.classList.add("hidden");
  headerViewButtons.forEach((btn) => {
    btn.hidden = true;
    btn.disabled = true;
  });
  const headerViewSection = headerMenu?.querySelector(".header-menu-section");
  if (headerViewSection) headerViewSection.classList.add("hidden");
}

function getDefaultViewForRole(role) {
  const normalizedRole = normalizeAuthRole(role);
  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "coach") return "coach";
  if (normalizedRole === "parent") return "parent";
  return "athlete";
}

function getActiveRoleForView() {
  const profileRole = getProfile()?.role;
  if (profileRole) return normalizeAuthRole(profileRole);
  const authRole = getAuthUser()?.role;
  if (authRole) return normalizeAuthRole(authRole);
  return "athlete";
}

function resolveViewForRole(role, requestedView) {
  const normalizedRole = normalizeAuthRole(role);
  const roleDefault = getDefaultViewForRole(normalizedRole);
  const allowedViews = ROLE_ALLOWED_VIEWS[normalizedRole] || ROLE_ALLOWED_VIEWS.athlete;
  const candidate = VIEW_OPTIONS.includes(requestedView) ? requestedView : roleDefault;
  return allowedViews.includes(candidate) ? candidate : roleDefault;
}

function canManageAllAccounts() {
  const authUser = getAuthUser();
  const session = getFirebaseSessionSnapshot();
  const email = authUser?.email || session?.email || "";
  const userId = authUser?.id || session?.id || "";
  return hasTrustedAdminSession({ email, userId });
}

function resolveCoachDashboardTab(role = getProfile()?.role) {
  return isCoachRole(role) ? "dashboard" : "today";
}

function resolveProfileShortcutTab(role = getProfile()?.role) {
  const normalized = normalizeAuthRole(role);
  if (normalized === "admin") return "permissions";
  if (normalized === "coach") return "coach-profile";
  if (normalized === "parent") return "parent-home";
  return "athlete-profile";
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
    const role = normalizeAuthRole(getProfile()?.role || "athlete");
    showTab(resolveProfileShortcutTab(role));
    return;
  }
  if (action === "logout") {
    firebaseAuthInstance?.signOut().catch(() => {});
    stopMediaRealtimeSync();
    stopCoachWorkspaceRealtimeSync();
    stopParentPortalRealtimeSync();
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
    stopMediaRealtimeSync();
    stopCoachWorkspaceRealtimeSync();
    stopParentPortalRealtimeSync();
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
  const requested = VIEW_OPTIONS.includes(view) ? view : "athlete";
  const activeRole = getActiveRoleForView();
  const normalized = resolveViewForRole(activeRole, requested);
  currentView = normalized;
  updateViewMenuLabel(normalized);
  const roleName = VIEW_ROLE_MAP[normalized] || activeRole || "athlete";
  setRoleUI(roleName, normalized);
}

function toggleParentViewNotice(view) {
  const isParentView = view === "parent";
  if (parentViewNotice) {
    parentViewNotice.classList.toggle("hidden", !isParentView);
    parentViewNotice.setAttribute("aria-hidden", (!isParentView).toString());
  }
  if (appRoot) {
    appRoot.classList.toggle("parent-view-active", isParentView);
  }
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
const pParentAthleteName = document.getElementById("pParentAthleteName");
const parentAthleteField = document.getElementById("parentAthleteField");
const parentVerificationText = document.getElementById("parentVerificationText");
const registerAthleteExtras = [
  pPreferredMoves?.closest("label"),
  pExperienceYears?.closest("label"),
  pStance?.closest("label"),
  pWeightClass?.closest("label"),
  pNotes?.closest("label")
].filter(Boolean);

function updateRoleSections(role) {
  const normalizedRole = normalizeAuthRole(role);
  const isParent = normalizedRole === "parent";
  registerAthleteExtras.forEach((section) => {
    section.classList.toggle("hidden", isParent);
    section.querySelectorAll("input, select, textarea").forEach((control) => {
      control.disabled = isParent;
    });
  });
  if (parentAthleteField) parentAthleteField.classList.toggle("hidden", !isParent);
  if (parentVerificationText) parentVerificationText.classList.toggle("hidden", !isParent);
  if (pParentAthleteName) {
    pParentAthleteName.disabled = !isParent;
    pParentAthleteName.required = isParent;
  }
}

const LANG_KEY = "wpl_lang_pref";
const LANG_RESET_KEY = "wpl_lang_reset_v1";

const ROLE_LABELS = {
  en: { athlete: "Athlete", coach: "Coach", admin: "Admin", parent: "Parent" },
  es: { athlete: "Atleta", coach: "Entrenador", admin: "Administrador", parent: "Padre/Madre" },
  uz: { athlete: "Sportchi", coach: "Murabbiy", admin: "Admin", parent: "Ota-ona" },
  ru: { athlete: "Спортсмен", coach: "Тренер", admin: "Администратор", parent: "Родитель" }
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
let lastClockDayKey = getCurrentAppDateKey();

function formatNowLabel(date) {
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  const datePart = date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIMEZONE
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIMEZONE
  });
  const label = currentLang === "es" ? "Hoy (ET)" : "Today (ET)";
  return `${label}: ${datePart} - ${timePart}`;
}

function refreshNowMeta() {
  const now = new Date();
  if (nowMeta) {
    nowMeta.textContent = formatNowLabel(now);
  }

  const dayKey = getCurrentAppDateKey(now);
  if (dayKey === lastClockDayKey) return;
  lastClockDayKey = dayKey;

  const dayIndex = getCurrentAppDayIndex(now);
  renderToday(dayIndex);
  renderPlanGrid(dayIndex);
  renderCalendar(dayKey);
  if (isCoachRole(getProfile()?.role)) {
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
  const currentDayIndex = getCurrentAppDayIndex();
  const currentDayKey = getCurrentAppDateKey();
  updateRoleSections(role);
  renderToday(currentDayIndex);
  renderFeelingScale();
  renderPlanGrid(currentDayIndex);
  renderCalendar(currentDayKey);
  renderCalendarManager();
  renderMedia();
  renderAnnouncements();
  renderCoachAssignments();
  renderCompletionTracking();
  renderDashboard();
  renderCoachProfile();
  renderParentHome();
  renderParentScouting();
  renderAthleteManagement();
  renderAthleteNotes();
  renderJournalMonitor();
  renderPermissions();
  renderMessages();
  renderSkills();
  renderTemplatesPanel();
  if (typeof coachMatchSelect !== "undefined" && coachMatchSelect && coachMatchSelect.value) {
    renderCoachMatchView(coachMatchSelect.value);
  }
  initializePlanSelectors();
  updateParentFab();
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

function clearLegacyRegisteredUsersCache() {
  localStorage.removeItem("wpl_registered_users_cache");
}

function getAuthUser() {
  const auth = parseStoredJson(AUTH_USER_KEY);
  if (!auth || typeof auth !== "object") return null;
  const id = auth.id ? String(auth.id).trim() : "";
  if (!id) return null;
  const email = normalizeEmail(auth.email || "");
  const requestedRole = normalizeAuthRole(auth.role);
  const role = (requestedRole === "admin" || isForcedAdminEmail(email))
    ? (hasTrustedAdminSession({ email, userId: id }) ? "admin" : "athlete")
    : requestedRole;
  return {
    id,
    email,
    role
  };
}

function setAuthUser(authUser) {
  if (!authUser) {
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  const id = String(authUser.id || "");
  const email = normalizeEmail(authUser.email || "");
  const requestedRole = normalizeAuthRole(authUser.role);
  const role = (requestedRole === "admin" || isForcedAdminEmail(email))
    ? (hasTrustedAdminSession({ email, userId: id }) ? "admin" : "athlete")
    : requestedRole;
  const payload = {
    id,
    email,
    role
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
  const email = normalizeEmail(base.email || authUser?.email || "");
  if (email) base.email = email;
  const requestedRole = normalizeAuthRole(authUser?.role || base.role);
  const allowAdmin = hasTrustedAdminSession({ email, userId: authUser?.id || base.user_id });
  const role = (requestedRole === "admin" || isForcedAdminEmail(email))
    ? (allowAdmin ? "admin" : "athlete")
    : requestedRole;
  base.role = role;
  base.view = resolveViewForRole(role, base.view);
  if (role === "parent") {
    base.status = normalizeParentVerificationStatus(base.status);
    base.athleteName = getParentLinkedAthleteName(base);
    base.linkedAthleteId = getParentLinkedAthleteId(base);
    base.linkedCoachUid = getParentLinkedCoachUid(base);
    base.linkedCoachName = getParentLinkedCoachName(base);
  }
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

function setProfile(profile, { sync = true } = {}) {
  const authUser = getAuthUser();
  if (!profile || typeof profile !== "object") {
    localStorage.removeItem(PROFILE_KEY);
    if (authUser?.id) {
      localStorage.removeItem(profileStorageKey(authUser.id));
    }
    return;
  }
  const normalized = normalizeProfileForAuth(profile, authUser);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  if (authUser?.id) {
    localStorage.setItem(profileStorageKey(authUser.id), JSON.stringify(normalized));
    if (sync) {
      queueFirebaseProfileSync(authUser.id, normalized);
    }
  }
}

async function applyProfile(profile) {
  if (!profile) {
    stopCoachWorkspaceRealtimeSync();
    stopParentPortalRealtimeSync();
    setLanguage(getPreferredLang(), { skipConfirm: true, refresh: false });
    setView("athlete");
    refreshLanguageUI();
    return;
  }

  const role = normalizeAuthRole(profile.role);
  const view = resolveViewForRole(role, profile.view);
  setLanguage(profile.lang || getPreferredLang(), { skipConfirm: true, refresh: false });
  setView(view);
  if (view === "coach") {
    await loadSavedPdfTemplate();
  }
  if (isCoachRole(role)) {
    startCoachWorkspaceRealtimeSync();
  } else {
    stopCoachWorkspaceRealtimeSync();
  }
  if (role === "parent") {
    startParentPortalRealtimeSync();
  } else {
    stopParentPortalRealtimeSync();
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

function updateAuthHeading(titleKey, subtitleKey) {
  if (authTitle) authTitle.textContent = authText(titleKey);
  if (authSubtitle) authSubtitle.textContent = authText(subtitleKey);
}

function hideRegisterModal() {
  registerModal?.classList.add("hidden");
}

function showRegisterModal() {
  registerModal?.classList.remove("hidden");
  loginFormWrap?.classList.add("hidden");
  const firstField = registerModal?.querySelector("input, select, textarea");
  firstField?.focus();
}

function showAuthChoice() {
  hideRegisterModal();
  updateAuthHeading("loginTitle", "loginSubtitle");
  loginFormWrap?.classList.remove("hidden");
  loginEmail?.focus();
}

function showOnboarding(prefillProfile = null) {
  onboarding.classList.remove("hidden");
  appRoot.classList.add("blurred", "hidden");
  enforceStrictAuthUI();
  showAuthChoice();
}

function hideOnboarding() {
  hideRegisterModal();
  onboarding.classList.add("hidden");
  appRoot.classList.remove("blurred");
  appRoot.classList.remove("hidden");
}

async function bootProfile() {
  const firebaseUser = await waitForInitialFirebaseUser();
  if (firebaseUser) {
    try {
      const result = await buildAuthResultFromFirebaseUser(firebaseUser, { fallbackEmail: firebaseUser.email || "" });
      await handleSuccessfulAuth(result);
      return;
    } catch (err) {
      console.warn("Failed to restore Firebase session", err);
      firebaseAuthInstance?.signOut().catch(() => {});
    }
  }
  showOnboarding(null);
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
  aRole: { label: { en: "Role", es: "Rol" } },
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
    en: { athlete: "Athlete", coach: "Coach", parent: "Parent" },
    es: { athlete: "Atleta", coach: "Entrenador", parent: "Padre/Madre" },
    uz: { athlete: "Sportchi", coach: "Murabbiy", parent: "Ota-ona" },
    ru: { athlete: "Спортсмен", coach: "Тренер", parent: "Родитель" }
  },
  aRole: {
    en: { athlete: "Athlete", coach: "Coach", parent: "Parent" },
    es: { athlete: "Atleta", coach: "Entrenador", parent: "Padre/Madre" },
    uz: { athlete: "Sportchi", coach: "Murabbiy", parent: "Ota-ona" },
    ru: { athlete: "Спортсмен", coach: "Тренер", parent: "Родитель" }
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
  "coach-home": {
    en: "Home",
    es: "Inicio",
    uz: "Bosh sahifa",
    ru: "Главная"
  },
  "coach-athletes": {
    en: "Athletes",
    es: "Atletas",
    uz: "Sportchilar",
    ru: "Спортсмены"
  },
  "coach-plans": {
    en: "Plans & Assignments",
    es: "Planes y asignaciones",
    uz: "Rejalar va topshiriqlar",
    ru: "Планы и назначения"
  },
  "coach-competition": {
    en: "Competition",
    es: "Competencia",
    uz: "Musobaqa",
    ru: "Соревнование"
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
    en: "Create Plan",
    es: "Crear plan",
    uz: "Rejalar yaratish",
    ru: "Создать планы"
  },
  templates: {
    en: "Templates",
    es: "Plantillas",
    uz: "Shablonlar",
    ru: "Шаблоны"
  },
  assignments: {
    en: "Assignments",
    es: "Asignaciones",
    uz: "Topshiriqlar",
    ru: "Назначения"
  },
  "calendar-manager": {
    en: "Calendar",
    es: "Calendario",
    uz: "Taqvim boshqaruvi",
    ru: "Управление календарём"
  },
  "completion-tracking": {
    en: "Completion Tracking",
    es: "Seguimiento",
    uz: "Yakun kuzatuvi",
    ru: "Отслеживание выполнения"
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

const TEXT_TRANSLATIONS = {
  "Jump right in": {
    en: "Jump right in",
    es: "Empieza ahora",
    uz: "Jump right in",
    ru: "Jump right in"
  },
  "No account required. Choose the view you want to explore.": {
    en: "No account required. Choose the view you want to explore.",
    es: "No necesitas cuenta. Elige la vista que quieres explorar.",
    uz: "No account required. Choose the view you want to explore.",
    ru: "No account required. Choose the view you want to explore."
  },
  "Securely access your Wrestling Performance Lab workspace.": {
    en: "Securely access your Wrestling Performance Lab workspace.",
    es: "Accede de forma segura a tu espacio en Wrestling Performance Lab.",
    uz: "Securely access your Wrestling Performance Lab workspace.",
    ru: "Securely access your Wrestling Performance Lab workspace."
  },
  "Only email and password are needed to continue.": {
    en: "Only email and password are needed to continue.",
    es: "Solo necesitas correo y contraseña para continuar.",
    uz: "Only email and password are needed to continue.",
    ru: "Only email and password are needed to continue."
  },
  "Back to choice": {
    en: "Back to choice",
    es: "Volver a opciones",
    uz: "Back to choice",
    ru: "Back to choice"
  },
  "Log In": {
    en: "Log In",
    es: "Entrar",
    uz: "Log In",
    ru: "Log In"
  },
  "Create account": {
    en: "Create account",
    es: "Crear cuenta",
    uz: "Create account",
    ru: "Create account"
  },
  "Back to Sign in": {
    en: "Back to Sign in",
    es: "Volver a iniciar sesion",
    uz: "Back to Sign in",
    ru: "Back to Sign in"
  },
  "Athlete Can": {
    en: "Athlete Can",
    es: "El atleta puede",
    uz: "Athlete Can",
    ru: "Athlete Can"
  },
  "Athlete Cannot": {
    en: "Athlete Cannot",
    es: "El atleta no puede",
    uz: "Athlete Cannot",
    ru: "Athlete Cannot"
  },
  "Edit own profile fields": {
    en: "Edit own profile fields",
    es: "Edita tus propios campos de perfil",
    uz: "Edit own profile fields",
    ru: "Edit own profile fields"
  },
  "Edit preferred techniques": {
    en: "Edit preferred techniques",
    es: "Edita tus tecnicas preferidas",
    uz: "Edit preferred techniques",
    ru: "Edit preferred techniques"
  },
  "Update experience and style": {
    en: "Update experience and style",
    es: "Actualiza tu experiencia y estilo",
    uz: "Update experience and style",
    ru: "Update experience and style"
  },
  "Update optional competition notes": {
    en: "Update optional competition notes",
    es: "Actualiza notas opcionales de competencia",
    uz: "Update optional competition notes",
    ru: "Update optional competition notes"
  },
  "Edit coach-only notes": {
    en: "Edit coach-only notes",
    es: "Edita notas solo del coach",
    uz: "Edit coach-only notes",
    ru: "Edit coach-only notes"
  },
  "Edit coach strategy plans": {
    en: "Edit coach strategy plans",
    es: "Edita planes estrategicos del coach",
    uz: "Edit coach strategy plans",
    ru: "Edit coach strategy plans"
  },
  "Edit other athlete accounts": {
    en: "Edit other athlete accounts",
    es: "Edita cuentas de otros atletas",
    uz: "Edit other athlete accounts",
    ru: "Edit other athlete accounts"
  },
  "Coach Can": {
    en: "Coach Can",
    es: "El coach puede",
    uz: "Coach Can",
    ru: "Coach Can"
  },
  "Coach Cannot": {
    en: "Coach Cannot",
    es: "El coach no puede",
    uz: "Coach Cannot",
    ru: "Coach Cannot"
  },
  "Add the plan, then assign athletes or send to the full team.": {
    en: "Add the plan, then assign athletes or send to the full team.",
    es: "Agrega el plan, luego asigna atletas o envialo a todo el equipo.",
    uz: "Add the plan, then assign athletes or send to the full team.",
    ru: "Add the plan, then assign athletes or send to the full team."
  },
  "Training plan (one item per line)": {
    en: "Training plan (one item per line)",
    es: "Plan de entrenamiento (una linea por punto)",
    uz: "Training plan (one item per line)",
    ru: "Training plan (one item per line)"
  },
  "Send to entire team": {
    en: "Send to entire team",
    es: "Enviar a todo el equipo",
    uz: "Send to entire team",
    ru: "Send to entire team"
  },
  "Save day plan": {
    en: "Save day plan",
    es: "Guardar plan del dia",
    uz: "Save day plan",
    ru: "Save day plan"
  },
  "Clear day": {
    en: "Clear day",
    es: "Limpiar dia",
    uz: "Clear day",
    ru: "Clear day"
  },
  "Create Event": {
    en: "Create Event",
    es: "Crear evento",
    uz: "Create Event",
    ru: "Create Event"
  },
  "Coach Actions": {
    en: "Coach Actions",
    es: "Acciones del coach",
    uz: "Coach Actions",
    ru: "Coach Actions"
  },
  "Event Types": {
    en: "Event Types",
    es: "Tipos de evento",
    uz: "Event Types",
    ru: "Event Types"
  },
  "Event Details": {
    en: "Event Details",
    es: "Detalles del evento",
    uz: "Event Details",
    ru: "Event Details"
  },
  "Notifications": {
    en: "Notifications",
    es: "Notificaciones",
    uz: "Notifications",
    ru: "Notifications"
  },
  "Events this day": {
    en: "Events this day",
    es: "Eventos de este dia",
    uz: "Events this day",
    ru: "Events this day"
  },
  "No events yet.": {
    en: "No events yet.",
    es: "Aun no hay eventos.",
    uz: "No events yet.",
    ru: "No events yet."
  },
  "Add event": {
    en: "Add event",
    es: "Agregar evento",
    uz: "Add event",
    ru: "Add event"
  },
  "Add Section": {
    en: "Add Section",
    es: "Agregar sección",
    uz: "Add Section",
    ru: "Add Section"
  },
  "Add Video": {
    en: "Add Video",
    es: "Agregar video",
    uz: "Add Video",
    ru: "Add Video"
  },
  "Upload - Tag - Assign": {
    en: "Upload - Tag - Assign",
    es: "Sube, etiqueta y asigna",
    uz: "Upload - Tag - Assign",
    ru: "Upload - Tag - Assign"
  },
  "Firebase Auth keeps your account backed on the server.": {
    en: "Firebase Auth keeps your account backed on the server.",
    es: "Firebase Auth mantiene tu cuenta respaldada en el servidor.",
    uz: "Firebase Auth keeps your account backed on the server.",
    ru: "Firebase Auth keeps your account backed on the server."
  }
};

const TEXT_TRANSLATION_KEYS = new WeakMap();

function applyTextTranslations(root = document.body) {
  if (!root) return;
  const filter = {
    acceptNode(node) {
      const parentTag = node.parentElement?.tagName?.toLowerCase();
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (parentTag && ["script", "style", "noscript", "template"].includes(parentTag)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter, false);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parentTag = node.parentElement?.tagName?.toLowerCase();
    if (parentTag && ["script", "style", "noscript", "template"].includes(parentTag)) continue;
    const baseKey = TEXT_TRANSLATION_KEYS.get(node) || node.nodeValue.trim();
    const entry = TEXT_TRANSLATIONS[baseKey];
    if (!entry) continue;
    TEXT_TRANSLATION_KEYS.set(node, baseKey);
    const localized = pickCopy(entry);
    if (localized && node.nodeValue !== localized) {
      node.nodeValue = localized;
    }
  }
}

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
      en: "Competition / Corner View",
      es: "Competencia / Vista de esquina",
      uz: "Musobaqa xulosasi ko‘rinishi",
      ru: "Предварительный обзор соревнования"
    },
    chip: {
      en: "Match-day tools",
      es: "Herramientas de competencia",
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
      en: "Coach Home",
      es: "Inicio del entrenador",
      uz: "Jamoa paneli",
      ru: "Командная панель"
    },
    chip: {
      en: "Quick dashboard",
      es: "Panel rapido",
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
      en: "Athletes",
      es: "Atletas",
      uz: "Sportchilarni boshqarish",
      ru: "Управление спортсменами"
    },
    chip: {
      en: "Roster & profiles",
      es: "Roster y perfiles",
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
      en: "Weekly + competition view",
      es: "Vista semanal + competencia",
      uz: "Jonli burchak ko'rinishi",
      ru: "Просмотр в реальном времени"
    }
  },
  "panel-plans": {
    title: {
      en: "Create Plan",
      es: "Crear plan",
      uz: "Trening rejalarini yaratish",
      ru: "Создание тренировочных планов"
    }
  },
  "panel-templates": {
    title: {
      en: "Templates",
      es: "Plantillas",
      uz: "Shablonlar",
      ru: "Шаблоны"
    },
    chip: {
      en: "Reusable structures",
      es: "Estructuras reutilizables",
      uz: "Qayta ishlatiladigan tuzilmalar",
      ru: "Повторно используемые структуры"
    }
  },
  "panel-calendar-manager": {
    title: {
      en: "Calendar",
      es: "Calendario",
      uz: "Taqvim boshqaruvi",
      ru: "Управление календарем"
    },
    chip: {
      en: "Schedule plans + assignments",
      es: "Programa planes y asignaciones",
      uz: "Tadbirlar va eslatmalar yarating",
      ru: "Создайте события и напоминания"
    }
  },
  "panel-assignments": {
    title: {
      en: "Assignments",
      es: "Asignaciones",
      uz: "Topshiriqlar",
      ru: "Назначения"
    },
    chip: {
      en: "Send work to athletes",
      es: "Enviar trabajo a atletas",
      uz: "Topshiriqlarni sportchilarga yuborish",
      ru: "Отправляйте задания спортсменам"
    }
  },
  "panel-completion-tracking": {
    title: {
      en: "Completion Tracking",
      es: "Seguimiento de cumplimiento",
      uz: "Bajarilishni kuzatish",
      ru: "Отслеживание выполнения"
    },
    chip: {
      en: "Follow-up by athlete",
      es: "Seguimiento por atleta",
      uz: "Sportchi bo'yicha kuzatish",
      ru: "Контроль по спортсмену"
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
      en: "Messages",
      es: "Mensajes",
      uz: "Xabarlar",
      ru: "Сообщения"
    },
    chip: {
      en: "Private coach threads",
      es: "Chats privados con coaches",
      uz: "Murabbiylar bilan shaxsiy chatlar",
      ru: "Личные чаты с тренерами"
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
    en: "Open Templates",
    es: "Abrir plantillas",
    uz: "Shablonlar",
    ru: "Шаблоны"
  },
  templateGoBtn: {
    en: "Pick a PDF",
    es: "Elegir PDF",
    uz: "Davom etish",
    ru: "Продолжить"
  },
  templateNoBtn: {
    en: "Hide tips",
    es: "Ocultar ayuda",
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
  setTextContent("#parentViewNoticeTitle", PARENT_VIEW_NOTICE_COPY.title);
  setTextContent("#parentViewNoticeSubtitle", PARENT_VIEW_NOTICE_COPY.message);

  if (editProfileBtn) {
    editProfileBtn.title = currentLang === "es" ? "Editar perfil" : "Edit profile";
  }

  applyTextTranslations();
}

function authErrorMessage(code, fallback = "") {
  const map = currentLang === "es"
    ? {
        invalid_credentials: "Correo o contrasena incorrectos.",
        role_mismatch: "Ese usuario no tiene ese rol.",
        email_exists: "Ese correo ya esta registrado.",
        admin_signup_forbidden: "No se puede crear cuenta de administrador desde el sitio web.",
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
        firestore_not_configured: "Firestore no esta configurado.",
        "permission-denied": "No hay permisos para guardar el perfil en Firestore.",
        unavailable: "Firestore no esta disponible. Intente de nuevo.",
        "auth/network-request-failed": "Revise su conexion e intente de nuevo."
      }
    : {
        invalid_credentials: "Incorrect email or password.",
        role_mismatch: "That account does not match the selected role.",
        email_exists: "That email is already registered.",
        admin_signup_forbidden: "Administrator accounts cannot be created from the website.",
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
        firestore_not_configured: "Firestore is not configured.",
        "permission-denied": "Not enough permissions to save the profile in Firestore.",
        unavailable: "Firestore is unavailable. Please retry.",
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
  const isCoach = isCoachRole(role);
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
  if (AUTH_STRICT) {
    showOnboarding(null);
    showAuthChoice();
    return;
  }
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
  const email = normalizeEmail(userPayload.email || "");
  const requestedRole = normalizeAuthRole(userPayload.role);
  const role = (requestedRole === "admin" || isForcedAdminEmail(email))
    ? (hasTrustedAdminSession({ email, userId: id }) ? "admin" : "athlete")
    : requestedRole;
  return {
    id,
    email,
    role
  };
}

function normalizeAuthRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value === "admin" || value === "administrator") return "admin";
  if (value === "coach") return "coach";
  if (value === "parent") return "parent";
  return "athlete";
}

function normalizeSignupRole(role) {
  const normalized = normalizeAuthRole(role);
  return SIGNUP_ALLOWED_ROLES.has(normalized) ? normalized : "athlete";
}

function normalizeParentVerificationStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  return value === "verified" ? "verified" : "pending_verification";
}

function isParentRole(role = getProfile()?.role || getAuthUser()?.role) {
  return normalizeAuthRole(role) === "parent";
}

function isParentVerified(profile = getProfile()) {
  return isParentRole(profile?.role) && normalizeParentVerificationStatus(profile?.status) === "verified";
}

function getParentLinkedAthleteName(profile = getProfile()) {
  return String(profile?.athleteName || profile?.linkedAthleteName || "").trim();
}

function getParentLinkedAthleteId(profile = getProfile()) {
  const explicitId = String(profile?.linkedAthleteId || "").trim();
  return explicitId || slugifyKey(getParentLinkedAthleteName(profile));
}

function getParentLinkedCoachUid(profile = getProfile()) {
  return String(profile?.linkedCoachUid || "").trim();
}

function getParentLinkedCoachName(profile = getProfile()) {
  return String(profile?.linkedCoachName || "").trim();
}

function canVerifyParentAccounts() {
  const authUser = getAuthUser();
  const profile = getProfile();
  if (!authUser?.id) return false;
  return isCoachRole(profile?.role || authUser.role);
}

function stripUndefinedDeep(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, item]) => {
      const cleaned = stripUndefinedDeep(item);
      if (cleaned !== undefined) out[key] = cleaned;
    });
    return out;
  }
  return value;
}

async function fetchFirebaseProfile(uid) {
  if (!firebaseFirestoreInstance) return null;
  try {
    const doc = await withTimeout(
      firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(uid).get(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_profile_read_timeout"
    );
    if (!doc.exists) return null;
    return doc.data();
  } catch (err) {
    console.warn("Failed to load Firebase profile", err);
    return null;
  }
}

async function persistFirebaseProfile(uid, data, { required = false } = {}) {
  if (!firebaseFirestoreInstance) {
    if (required) {
      const err = new Error("firestore_not_configured");
      err.code = "firestore_not_configured";
      throw err;
    }
    return;
  }
  const payload = stripUndefinedDeep(data);
  try {
    await withTimeout(
      firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(uid).set(payload, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_profile_write_timeout"
    );
  } catch (err) {
    if (required) throw err;
    console.warn("Failed to persist Firebase profile", err);
  }
}

function getCoachWorkspaceDocRef(uid = getAuthUser()?.id) {
  const safeUid = String(uid || "").trim();
  if (!firebaseFirestoreInstance || !safeUid) return null;
  return firebaseFirestoreInstance.collection(FIREBASE_COACH_WORKSPACES_COLLECTION).doc(safeUid);
}

function getCoachWorkspaceCollectionRef(name, uid = getAuthUser()?.id) {
  const docRef = getCoachWorkspaceDocRef(uid);
  if (!docRef || !name) return null;
  return docRef.collection(name);
}

function isCoachWorkspaceActive() {
  const authUser = getAuthUser();
  const profile = getProfile();
  return Boolean(
    firebaseFirestoreInstance
    && authUser?.id
    && isCoachRole(profile?.role || authUser.role)
  );
}

function coachWorkspaceSortByUpdated(items = []) {
  return [...items].sort((a, b) => {
    const left = Number(new Date(b.updatedAt || b.createdAt || 0));
    const right = Number(new Date(a.updatedAt || a.createdAt || 0));
    return left - right;
  });
}

function normalizePlanType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "daily" || raw === "day") return "day";
  if (raw === "weekly" || raw === "week") return "week";
  if (raw === "monthly" || raw === "month") return "month";
  if (raw === "season") return "season";
  return "day";
}

function normalizePlanItems(items) {
  const keys = ["intro", "warmup", "drills", "live", "cooldown", "announcements"];
  const next = {};
  keys.forEach((key) => {
    next[key] = Array.isArray(items?.[key])
      ? items[key].map((item) => String(item).trim()).filter(Boolean)
      : [];
  });
  return next;
}

function normalizePlanAudience(record = {}) {
  const mode = ["single", "multi", "group"].includes(record.mode) ? record.mode : "single";
  return {
    mode,
    athleteNames: uniqueNames(record.athleteNames || []),
    groupId: String(record.groupId || "").trim(),
    groupName: String(record.groupName || "").trim()
  };
}

function normalizeCoachPlanRecord(id, data = {}) {
  const type = normalizePlanType(data.type);
  return {
    id,
    title: String(data.title || "").trim() || defaultPlanTitle(type),
    type,
    focus: String(data.focus || "").trim(),
    coachNotes: String(data.coachNotes || "").trim(),
    sourceMode: ["scratch", "template", "duplicate"].includes(data.sourceMode) ? data.sourceMode : "scratch",
    sourceRefId: String(data.sourceRefId || "").trim(),
    sourceLabel: String(data.sourceLabel || "").trim(),
    range: {
      startKey: normalizeDateKey(data.range?.startKey || data.startKey || getCurrentAppDateKey()),
      endKey: normalizeDateKey(data.range?.endKey || data.endKey || data.range?.startKey || data.startKey || getCurrentAppDateKey())
    },
    items: normalizePlanItems(data.items),
    monthlyNotes: String(data.monthlyNotes || "").trim(),
    seasonYear: String(data.seasonYear || "").trim(),
    audience: normalizePlanAudience(data.audience),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || ""),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || ""),
    createdBy: String(data.createdBy || "").trim(),
    updatedBy: String(data.updatedBy || "").trim()
  };
}

function normalizeCoachTemplateRecord(id, data = {}) {
  return {
    id,
    name: String(data.name || "").trim(),
    type: normalizePlanType(data.type || data.recommendedType),
    focus: String(data.focus || "").trim(),
    coachNotes: String(data.coachNotes || "").trim(),
    items: normalizePlanItems(data.items),
    monthlyNotes: String(data.monthlyNotes || "").trim(),
    seasonYear: String(data.seasonYear || "").trim(),
    system: data.system === true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || ""),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "")
  };
}

function normalizeCoachGroupRecord(id, data = {}) {
  return {
    id,
    name: String(data.name || "").trim(),
    memberNames: uniqueNames(data.memberNames || data.members || []),
    system: data.system === true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || ""),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "")
  };
}

function normalizeCoachAthleteRecord(id, data = {}) {
  return {
    id,
    name: String(data.name || "").trim(),
    weight: String(data.weight || data.currentWeight || "").trim(),
    currentWeight: String(data.currentWeight || data.weight || "").trim(),
    weightClass: String(data.weightClass || "").trim(),
    style: String(data.style || "").trim(),
    availability: String(data.availability || "Available").trim(),
    preferred: String(data.preferred || "").trim(),
    international: String(data.international || "None").trim(),
    history: String(data.history || "").trim(),
    notes: String(data.notes || "").trim(),
    experienceYears: data.experienceYears ?? data.years ?? "",
    level: String(data.level || "").trim(),
    position: String(data.position || "").trim(),
    strategy: String(data.strategy || "").trim(),
    favoritePosition: String(data.favoritePosition || data.position || "").trim(),
    psychTendency: String(data.psychTendency || "").trim(),
    offenseTop3: Array.isArray(data.offenseTop3) ? data.offenseTop3.map((item) => String(item).trim()).filter(Boolean) : [],
    defenseTop3: Array.isArray(data.defenseTop3) ? data.defenseTop3.map((item) => String(item).trim()).filter(Boolean) : [],
    pressureError: String(data.pressureError || "").trim(),
    coachSignal: String(data.coachSignal || "").trim(),
    tags: normalizeSmartTags(data.tags || []),
    injuryNotes: String(data.injuryNotes || "").trim(),
    cueNotes: String(data.cueNotes || "").trim(),
    safeMoves: String(data.safeMoves || "").trim(),
    riskyMoves: String(data.riskyMoves || "").trim(),
    strategyA: String(data.strategyA || "").trim(),
    strategyB: String(data.strategyB || "").trim(),
    strategyC: String(data.strategyC || "").trim(),
    resultsHistory: String(data.resultsHistory || "").trim(),
    internationalEvents: String(data.internationalEvents || "").trim(),
    internationalYears: String(data.internationalYears || "").trim(),
    techniques: {
      neutral: Array.isArray(data.techniques?.neutral) ? data.techniques.neutral.map((item) => String(item).trim()).filter(Boolean) : [],
      top: Array.isArray(data.techniques?.top) ? data.techniques.top.map((item) => String(item).trim()).filter(Boolean) : [],
      bottom: Array.isArray(data.techniques?.bottom) ? data.techniques.bottom.map((item) => String(item).trim()).filter(Boolean) : [],
      defense: Array.isArray(data.techniques?.defense) ? data.techniques.defense.map((item) => String(item).trim()).filter(Boolean) : [],
      neutralOther: String(data.techniques?.neutralOther || "").trim(),
      topOther: String(data.techniques?.topOther || "").trim(),
      bottomOther: String(data.techniques?.bottomOther || "").trim(),
      defenseOther: String(data.techniques?.defenseOther || "").trim()
    },
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || ""),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "")
  };
}

function normalizeCoachNoteRecord(id, data = {}) {
  return {
    id,
    athleteName: String(data.athleteName || data.name || "").trim(),
    nextFocus: Array.isArray(data.nextFocus) ? data.nextFocus.map((item) => String(item).trim()).filter(Boolean) : [],
    recentNotes: Array.isArray(data.recentNotes) ? data.recentNotes.map((item) => String(item).trim()).filter(Boolean) : [],
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "")
  };
}

function normalizeCoachJournalRecord(id, data = {}) {
  return {
    id,
    athleteName: String(data.athleteName || data.name || "").trim(),
    entryDate: isDateKey(data.entryDate) ? data.entryDate : getCurrentAppDateKey(),
    sleep: String(data.sleep || "").trim(),
    energy: String(data.energy || "").trim(),
    soreness: String(data.soreness || "").trim(),
    mood: String(data.mood || "").trim(),
    weight: String(data.weight || "").trim(),
    note: String(data.note || "").trim(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || ""),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || "")
  };
}

function normalizeCoachCompletionRecord(id, data = {}) {
  return {
    id,
    athleteName: String(data.athleteName || data.name || "").trim(),
    status: String(data.status || "").trim(),
    plan: String(data.plan || "").trim(),
    progress: String(data.progress || "").trim(),
    followUp: String(data.followUp || "").trim(),
    pendingCount: Number.isFinite(Number(data.pendingCount)) ? Number(data.pendingCount) : 0,
    journalState: String(data.journalState || "").trim(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "")
  };
}

function normalizeMatchAnalysisEntry(entry = {}) {
  return {
    timestamp: String(entry.timestamp || "").trim(),
    note: String(entry.note || "").trim()
  };
}

function normalizeCoachMatchAnalysisRecord(id, data = {}) {
  return {
    id,
    mediaId: String(data.mediaId || "").trim(),
    mediaTitle: String(data.mediaTitle || "").trim(),
    mediaAssetPath: String(data.mediaAssetPath || "").trim(),
    athleteName: String(data.athleteName || "").trim(),
    groupId: String(data.groupId || "").trim(),
    summary: String(data.summary || "").trim(),
    entries: Array.isArray(data.entries) ? data.entries.map((entry) => normalizeMatchAnalysisEntry(entry)).filter((entry) => entry.timestamp || entry.note) : [],
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || ""),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || "")
  };
}

function normalizeParentScoutingRecord(id, data = {}) {
  return {
    id,
    parentUid: String(data.parentUid || "").trim(),
    parentName: String(data.parentName || "").trim(),
    parentEmail: normalizeEmail(data.parentEmail || ""),
    athleteName: String(data.athleteName || "").trim(),
    athleteId: String(data.athleteId || "").trim(),
    subjectType: String(data.subjectType || "athlete").trim(),
    targetAthleteName: String(data.targetAthleteName || "").trim(),
    text: String(data.text || "").trim(),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    audioAttachment: data.audioAttachment || null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || ""),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || "")
  };
}

function normalizeAssignmentStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
  if (raw === "review" || raw === "in_progress" || raw === "in-progress" || raw === "progress") return "in_progress";
  if (raw === "complete" || raw === "completed") return "completed";
  if (raw === "overdue") return "overdue";
  return "not_started";
}

function normalizeCoachAssignmentRecord(id, data = {}) {
  const dueDateKey = isDateKey(data.dueDateKey) ? data.dueDateKey : "";
  const normalizedStatus = normalizeAssignmentStatus(data.status);
  const derivedStatus = dueDateKey && dueDateKey < getCurrentAppDateKey() && normalizedStatus !== "completed"
    ? "overdue"
    : normalizedStatus;
  return {
    id,
    title: String(data.title || "").trim(),
    assigneeType: String(data.assigneeType || "athlete").trim(),
    assigneeName: String(data.assigneeName || "").trim(),
    assigneeNames: uniqueNames(data.assigneeNames || []),
    assigneeId: String(data.assigneeId || "").trim(),
    type: String(data.type || "Training Plan").trim(),
    dueDateKey,
    dueLabel: String(data.dueLabel || "").trim(),
    status: derivedStatus,
    note: String(data.note || "").trim(),
    source: String(data.source || "").trim(),
    planId: String(data.planId || "").trim(),
    planType: normalizePlanType(data.planType || "day"),
    mediaId: String(data.mediaId || "").trim(),
    mediaTitle: String(data.mediaTitle || "").trim(),
    mediaAssetPath: String(data.mediaAssetPath || "").trim(),
    notifiedAt: data.notifiedAt?.toDate ? data.notifiedAt.toDate().toISOString() : String(data.notifiedAt || ""),
    notificationStatus: String(data.notificationStatus || "").trim(),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || ""),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || "")
  };
}

function defaultPlanTitle(type = planRangeType) {
  const map = {
    day: { en: "Daily Training Plan", es: "Plan diario de entrenamiento" },
    week: { en: "Weekly Training Plan", es: "Plan semanal de entrenamiento" },
    month: { en: "Monthly Training Plan", es: "Plan mensual de entrenamiento" },
    season: { en: "Season Training Plan", es: "Plan de temporada" }
  };
  return pickCopy(map[normalizePlanType(type)] || map.day);
}

function slugifyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

function getBuiltinCoachTemplateSeeds() {
  return [
    {
      id: "technical-day",
      name: "Technical Day",
      type: "day",
      focus: "Sharpen high-percentage offense and clean positional repetition.",
      coachNotes: "Keep volume technical early, then finish with live goes tied to the main skill.",
      items: {
        intro: ["Review today's scoring focus", "Highlight one competition carryover cue"],
        warmup: ["Dynamic movement and mobility", "Stance motion and footwork"],
        drills: ["Single leg finish chain", "Snap to score series", "Short offense entries"],
        live: ["3 x 1:00 situational goes", "3 x 1:00 live from neutral"],
        cooldown: ["Breathing reset", "Mental rep of main finish"],
        announcements: ["Log journal after practice"]
      },
      monthlyNotes: "Use as the anchor technical session when the room needs clean repetition."
    },
    {
      id: "competition-prep",
      name: "Competition Prep",
      type: "week",
      focus: "Build match readiness, sharp scoring volume, and competition confidence.",
      coachNotes: "Keep intensity high but control total volume. Every session should connect to match execution.",
      items: {
        intro: ["Outline the week's match priorities"],
        warmup: ["Dynamic movement and mobility", "Light hand-fighting"],
        drills: ["Primary attack chain", "Counter to common reactions", "Finish under pressure"],
        live: ["Short, intense live rounds", "Match-start scenarios", "End-of-period situations"],
        cooldown: ["Recovery reset", "Review weight and travel checklist"],
        announcements: ["Confirm competition logistics"]
      },
      monthlyNotes: "Good weekly build heading into a competition block."
    },
    {
      id: "recovery-rehab",
      name: "Recovery / Rehab",
      type: "day",
      focus: "Protect the athlete while keeping movement quality and technical intent.",
      coachNotes: "Scale intensity down. Emphasize mobility, safe drilling, and readiness feedback.",
      items: {
        intro: ["Review physical limitations and session goal"],
        warmup: ["Mobility circuit", "Low-impact activation"],
        drills: ["Technique walkthrough", "Partner positioning", "Controlled reps only"],
        live: ["No full live", "Short guided situations if cleared"],
        cooldown: ["Soft tissue and breathing reset"],
        announcements: ["Complete rehab notes in journal"]
      },
      monthlyNotes: "Use when load needs to be modified without removing technical intent."
    },
    {
      id: "film-study",
      name: "Film Study",
      type: "day",
      focus: "Improve tactical understanding and pattern recognition from match film.",
      coachNotes: "Keep the assignment specific. One clip, one theme, one takeaway.",
      items: {
        intro: ["Set the tactical question for the film block"],
        warmup: ["Short movement prep", "Stance motion and visualization"],
        drills: ["Replay key sequence", "Walk through better reaction", "Partner shadow reps"],
        live: ["Situational goes from the film position"],
        cooldown: ["Write 3 takeaways"],
        announcements: ["Upload notes before next practice"]
      },
      monthlyNotes: "Best paired with an assignment asking for written analysis."
    },
    {
      id: "strength-wrestling",
      name: "Strength + Wrestling",
      type: "month",
      focus: "Blend mat-specific strength work with wrestling development across the block.",
      coachNotes: "Track fatigue closely and alternate loading days with technical emphasis.",
      items: {
        intro: ["Review the monthly training emphasis"],
        warmup: ["Dynamic prep and activation"],
        drills: ["Main technical chain for the block", "Finish series under fatigue"],
        live: ["Progressive live intensity by week"],
        cooldown: ["Mobility and recovery"],
        announcements: ["Track lifting numbers and readiness weekly"]
      },
      monthlyNotes: "Monthly block with strength priorities layered into wrestling work."
    },
    {
      id: "pre-tournament-week",
      name: "Pre-Tournament Week",
      type: "week",
      focus: "Taper volume, keep speed, and dial in the competition plan.",
      coachNotes: "Protect freshness. Short sessions, sharp scoring, zero wasted volume.",
      items: {
        intro: ["Review tournament goals and expected pace"],
        warmup: ["Fast dynamic prep", "Reaction starts"],
        drills: ["Top 3 attacks", "Top 3 setups", "Best finish reactions"],
        live: ["Short burst goes", "Score-first situations only"],
        cooldown: ["Weight check and mental reset"],
        announcements: ["Travel, weigh-in, and match schedule reminders"]
      },
      monthlyNotes: "Use the week before tournament travel or a major event."
    },
    {
      id: "post-match-review",
      name: "Post-Match Review",
      type: "season",
      focus: "Capture lessons from recent competition and turn them into the next block.",
      coachNotes: "Identify what carries forward, what needs fixing, and the next priority cycle.",
      items: {
        intro: ["Review tournament outcomes and key moments"],
        warmup: ["Low-volume movement reset"],
        drills: ["Recreate missed positions", "Correct late-match errors"],
        live: ["Short scenario reviews only"],
        cooldown: ["Write the next competition cue"],
        announcements: ["Assign film and journal follow-up"]
      },
      monthlyNotes: "Use as a season checkpoint after a tournament stretch."
    }
  ].map((item) => ({
    ...item,
    items: normalizePlanItems(item.items)
  }));
}

function getDefaultCoachGroupSeeds() {
  const advanced = ATHLETES.filter((athlete) => String(athlete.level || "").toLowerCase() === "advanced").map((athlete) => athlete.name);
  const intermediate = ATHLETES.filter((athlete) => String(athlete.level || "").toLowerCase() === "intermediate").map((athlete) => athlete.name);
  const competition = ATHLETES.filter((athlete) => (
    String(athlete.international || "").toLowerCase() !== "none"
      || String(athlete.availability || "").toLowerCase() === "travel"
      || String(athlete.level || "").toLowerCase() === "advanced"
  )).map((athlete) => athlete.name);
  const rehab = ATHLETES.filter((athlete) => String(athlete.availability || "").toLowerCase() === "limited").map((athlete) => athlete.name);
  const remote = ATHLETES.filter((athlete) => String(athlete.availability || "").toLowerCase() === "travel").map((athlete) => athlete.name);

  return [
    { id: "varsity", name: "Varsity", memberNames: uniqueNames(advanced) },
    { id: "jv", name: "JV", memberNames: uniqueNames(intermediate) },
    { id: "beginners", name: "Beginners", memberNames: [] },
    { id: "competition-team", name: "Competition Team", memberNames: uniqueNames(competition) },
    { id: "rehab-return-to-play", name: "Rehab / Return to Play", memberNames: uniqueNames(rehab) },
    { id: "remote-athletes", name: "Remote Athletes", memberNames: uniqueNames(remote) },
    { id: "private-clients", name: "Private Clients", memberNames: [] }
  ];
}

function getSeedCoachWorkspacePlans() {
  const today = getCurrentAppDate();
  const todayKey = toDateKey(today);
  const weekStart = startOfWeek(today);
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(addDays(weekStart, 6));
  const seasonYear = String(today.getFullYear());

  return [
    {
      id: "seed-daily-finish-film",
      title: "Daily Finish + Film Review",
      type: "day",
      focus: "Score cleaner off the single leg and connect the technique block to Friday opponent film.",
      coachNotes: "Keep the room short and sharp. Carlos finishes every rep with head position to the hip and a clean shelf finish.",
      sourceMode: "template",
      sourceRefId: "technical-day",
      sourceLabel: "Technical Day",
      range: { startKey: todayKey, endKey: todayKey },
      items: normalizePlanItems({
        intro: ["Review Friday dual scoring priority", "Set one match cue for the room"],
        warmup: ["Dynamic movement and mobility", "Stance motion and footwork"],
        drills: ["Single leg shelf finish", "Re-shot to finish", "Hand fight to clean entry"],
        live: ["3 x 1:00 neutral goes", "2 x 30s finish-on-the-edge situations"],
        cooldown: ["Breathing reset", "Quick film notes before dismissal"],
        announcements: ["Carlos Vega opponent film due tonight"]
      }),
      monthlyNotes: "Use this as the standard single-leg finish day when a competition is close.",
      seasonYear,
      audience: {
        mode: "single",
        athleteNames: ["Carlos Vega"],
        groupId: "",
        groupName: ""
      }
    },
    {
      id: "seed-weekly-pre-tournament",
      title: "Pre-Tournament Week - Competition Team",
      type: "week",
      focus: "Taper volume, sharpen top 3 attacks, and lock in match-day decision making for the competition team.",
      coachNotes: "Short sessions, clean reps, and no wasted volume. Everyone leaves with plan A/B/C and travel expectations clear.",
      sourceMode: "template",
      sourceRefId: "pre-tournament-week",
      sourceLabel: "Pre-Tournament Week",
      range: { startKey: weekStartKey, endKey: weekEndKey },
      items: normalizePlanItems({
        intro: ["Review tournament goals and top 3 attacks", "Confirm weigh-in and travel plan"],
        warmup: ["Fast dynamic prep", "Reaction starts", "Short hand-fight exchanges"],
        drills: ["Top 3 setup chains", "Front-headlock finish review", "Score-first scenarios"],
        live: ["Short burst goes", "Start-on-the-whistle rounds", "Late-period closeout situations"],
        cooldown: ["Recovery reset", "Mental rehearsal", "Corner cue review"],
        announcements: ["Competition Team match analysis due before Thursday"]
      }),
      monthlyNotes: "Pre-tournament block for wrestlers traveling or projected in the varsity lineup.",
      seasonYear,
      audience: {
        mode: "group",
        athleteNames: [],
        groupId: "competition-team",
        groupName: "Competition Team"
      }
    }
  ];
}

function getSeedCoachWorkspaceAssignments() {
  const today = getCurrentAppDate();
  const todayKey = toDateKey(today);
  const tomorrowKey = toDateKey(addDays(today, 1));
  const weekEndKey = toDateKey(addDays(startOfWeek(today), 6));

  return [
    {
      id: "seed-assignment-video",
      title: "Lincoln 157 opponent film",
      assigneeType: "athlete",
      assigneeName: "Carlos Vega",
      assigneeNames: ["Carlos Vega"],
      assigneeId: "carlos-vega",
      type: "Video review",
      dueDateKey: todayKey,
      dueLabel: formatPlanDateLabel(todayKey),
      status: "not_started",
      note: "Watch the first attack sequence and write back 3 scoring reads.",
      source: "Media - Match Analysis",
      planId: "seed-daily-finish-film",
      planType: "day",
      notificationStatus: "notified:1"
    },
    {
      id: "seed-assignment-drill",
      title: "Single leg finish drill - 30 reps each side",
      assigneeType: "athlete",
      assigneeName: "Maya Cruz",
      assigneeNames: ["Maya Cruz"],
      assigneeId: "maya-cruz",
      type: "Technique / Drill",
      dueDateKey: tomorrowKey,
      dueLabel: formatPlanDateLabel(tomorrowKey),
      status: "overdue",
      note: "Use ankle-safe entries and send completion before the next live session.",
      source: "Modified rehab block",
      planId: "",
      planType: "day",
      notificationStatus: "pending"
    },
    {
      id: "seed-assignment-match-analysis",
      title: "Top-turn match analysis - 3 scoring reads",
      assigneeType: "group",
      assigneeName: "Competition Team",
      assigneeNames: getDefaultCoachGroupSeeds().find((group) => group.id === "competition-team")?.memberNames || [],
      assigneeId: "competition-team",
      type: "Match analysis",
      dueDateKey: weekEndKey,
      dueLabel: formatPlanDateLabel(weekEndKey),
      status: "in_progress",
      note: "Reply with 3 scoring reads and one corner cue for the weekend event.",
      source: "Pre-Tournament Week",
      planId: "seed-weekly-pre-tournament",
      planType: "week",
      notificationStatus: "logged"
    }
  ];
}

function getSeedCoachCalendarEntries() {
  const today = getCurrentAppDate();
  const dualDate = addDays(startOfWeek(today), 5);
  const filmDate = addDays(today, 1);
  const dualKey = toDateKey(dualDate);
  const filmKey = toDateKey(filmDate);

  return {
    [filmKey]: {
      items: [
        "Competition Team film review - 4:15 PM",
        "Carlos Vega opponent film due before evening practice"
      ],
      audience: { all: false, athletes: ["Carlos Vega", "Jaime Espinal", "Olivia Chen"] }
    },
    [dualKey]: {
      items: [
        "Friday Night Dual - Lincoln High - 6:00 PM",
        "Weigh-in check - 4:30 PM",
        "Competition Team arrival - 5:15 PM"
      ],
      audience: { all: true, athletes: [] }
    }
  };
}

function getSeedCopyValue(value) {
  if (value && typeof value === "object") {
    return String(value.en || value.es || Object.values(value)[0] || "").trim();
  }
  return String(value || "").trim();
}

function getCoachAthleteRecords() {
  if (coachAthletesCache.length) return coachAthletesCache;
  return ATHLETES.map((athlete) => normalizeCoachAthleteRecord(slugifyKey(athlete.name), athlete));
}

function getCoachNoteRecords() {
  if (coachNotesCache.length) return coachNotesCache;
  return Object.entries(COACH_ATHLETE_NOTE_BOARD).map(([athleteName, data]) => normalizeCoachNoteRecord(slugifyKey(athleteName), {
    athleteName,
    nextFocus: Array.isArray(data?.nextFocus) ? data.nextFocus.map((item) => getSeedCopyValue(item)).filter(Boolean) : [],
    recentNotes: Array.isArray(data?.recentNotes) ? data.recentNotes.map((item) => getSeedCopyValue(item)).filter(Boolean) : []
  }));
}

function getCoachNoteRecord(athleteName) {
  const target = normalizeName(athleteName);
  return getCoachNoteRecords().find((item) => normalizeName(item.athleteName) === target) || null;
}

function getCoachJournalRecords() {
  return coachWorkspaceSortByUpdated(coachJournalEntriesCache);
}

function getCoachJournalRecordSetForAthlete(athleteName) {
  const target = normalizeName(athleteName);
  return getCoachJournalRecords()
    .filter((entry) => normalizeName(entry.athleteName) === target)
    .sort((left, right) => {
      const leftScore = Date.parse(left.updatedAt || left.createdAt || `${left.entryDate}T23:59:59`);
      const rightScore = Date.parse(right.updatedAt || right.createdAt || `${right.entryDate}T23:59:59`);
      return rightScore - leftScore;
    });
}

function getLatestCoachJournalRecord(athleteName) {
  return getCoachJournalRecordSetForAthlete(athleteName)[0] || null;
}

function getCoachCompletionRecord(athleteName) {
  const target = normalizeName(athleteName);
  return coachCompletionCache.find((item) => normalizeName(item.athleteName) === target) || null;
}

function getCoachMatchAnalysisRecords() {
  return coachWorkspaceSortByUpdated(coachMatchAnalysisCache);
}

function getLatestCoachMatchAnalysisForAthlete(athleteName) {
  const target = normalizeName(athleteName);
  return getCoachMatchAnalysisRecords().find((item) => normalizeName(item.athleteName) === target) || null;
}

function getCoachMatchAnalysisRecordForMediaTarget({ mediaId = "", mediaAssetPath = "", athleteName = "", groupId = "" } = {}) {
  const targetMediaId = String(mediaId || "").trim();
  const targetMediaAssetPath = normalizeMediaAssetPath(mediaAssetPath);
  const targetAthlete = normalizeName(athleteName);
  const targetGroup = String(groupId || "").trim();
  return getCoachMatchAnalysisRecords().find((record) => (
    (
      (targetMediaId && String(record.mediaId || "").trim() === targetMediaId)
        || (targetMediaAssetPath && normalizeMediaAssetPath(record.mediaAssetPath) === targetMediaAssetPath)
    )
      && normalizeName(record.athleteName) === targetAthlete
      && String(record.groupId || "").trim() === targetGroup
  )) || null;
}

function getSeedCoachAthleteRecords() {
  return ATHLETES.map((athlete) => ({
    id: slugifyKey(athlete.name),
    ...normalizeCoachAthleteRecord(slugifyKey(athlete.name), athlete)
  }));
}

function getSeedCoachNoteRecords() {
  return Object.entries(COACH_ATHLETE_NOTE_BOARD).map(([athleteName, data]) => ({
    id: slugifyKey(athleteName),
    athleteName,
    nextFocus: Array.isArray(data?.nextFocus) ? data.nextFocus.map((item) => getSeedCopyValue(item)).filter(Boolean) : [],
    recentNotes: Array.isArray(data?.recentNotes) ? data.recentNotes.map((item) => getSeedCopyValue(item)).filter(Boolean) : []
  }));
}

function getSeedCoachJournalRecords() {
  const today = getCurrentAppDate();
  const offsets = {
    "Jaime Espinal": 0,
    "Carlos Vega": 0,
    "Maya Cruz": 2
  };
  return JOURNAL_ATHLETES.map((entry, index) => {
    const offset = Object.prototype.hasOwnProperty.call(offsets, entry.name) ? offsets[entry.name] : (index % 2);
    const dateKey = toDateKey(addDays(today, -offset));
    return {
      id: `${slugifyKey(entry.name)}-${dateKey}`,
      athleteName: entry.name,
      entryDate: dateKey,
      sleep: entry.sleep,
      energy: entry.energy,
      soreness: entry.soreness,
      mood: entry.mood,
      weight: entry.weight,
      note: entry.name === "Carlos Vega"
        ? "Film week. Good pace today and the re-shot looked sharper once the hand-fight opened up."
        : entry.name === "Maya Cruz"
          ? "Ankle tolerated modified drilling. Keep live volume short and prioritize journal follow-up."
          : "General readiness check-in captured by the coach."
    };
  });
}

function getSeedCoachMatchAnalysisRecords() {
  const mediaItem = getMediaItemsData().find((item) => String(item.title || "").toLowerCase().includes("world-class takedown"))
    || getMediaItemsData()[0]
    || { title: "Opponent film", assetPath: "" };
  return [
    {
      id: "seed-match-analysis-carlos-vega",
      mediaId: slugifyKey(mediaItem.title),
      mediaTitle: mediaItem.title,
      mediaAssetPath: mediaItem.assetPath || "",
      athleteName: "Carlos Vega",
      groupId: "",
      summary: "Inside control to re-shot is the cleanest scoring read. The second finish is there when he keeps his head on the hip and runs through contact.",
      entries: [
        { timestamp: "00:18", note: "Inside control wins the angle before the first committed shot." },
        { timestamp: "01:24", note: "Best finish comes after the re-shot, not the first reach." },
        { timestamp: "02:42", note: "Stay under the hips when the edge gets crowded." }
      ]
    }
  ];
}

function getAssignmentStatusCounts(records = getCoachAssignmentRecords()) {
  const counts = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  };
  records.forEach((record) => {
    const key = normalizeAssignmentStatus(record.status);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function getCoachJournalState(athleteName) {
  const latest = getLatestCoachJournalRecord(athleteName);
  if (!latest?.entryDate) return getCoachCompletionRecord(athleteName)?.journalState || "stale";
  const diff = Math.floor((dateFromKey(getCurrentAppDateKey()) - dateFromKey(latest.entryDate)) / (1000 * 60 * 60 * 24));
  return diff > 1 ? "stale" : "fresh";
}

function buildCoachCompletionSnapshot(athlete) {
  const fallback = COACH_COMPLETION_ROWS[athlete.name] || {};
  const assignments = getPlanAssignmentsForAthlete(athlete.name);
  const alerts = getAthleteAlerts(athlete);
  const latestPlan = getLatestCoachPlanForAthlete(athlete.name);
  const counts = getAssignmentStatusCounts(assignments);
  const board = getAthleteTaskBoard(athlete.name);
  const availabilityKey = normalizeAvailabilityKey(getRawAthleteRecord(athlete.name)?.availability || athlete.availability);

  let status = "ontrack";
  if (availabilityKey === "limited" || alerts.some((item) => String(item).toLowerCase().includes("injury") || String(item).toLowerCase().includes("lesion"))) {
    status = "limited";
  } else if (counts.overdue > 0) {
    status = "overdue";
  } else if (counts.not_started > 0 || counts.in_progress > 0 || board.journalState === "stale") {
    status = "followup";
  }

  const progress = assignments.length
    ? (currentLang === "es" ? `${counts.completed}/${assignments.length} completadas` : `${counts.completed}/${assignments.length} completed`)
    : pickCopy(fallback.progress || {
        en: "No assignments yet",
        es: "Todavia no hay asignaciones"
      });

  let followUp = "";
  if (status === "limited") {
    followUp = currentLang === "es"
      ? "Revisa limitaciones fisicas y ajusta la carga."
      : "Review physical limitations and adjust load.";
  } else if (status === "overdue") {
    followUp = currentLang === "es"
      ? "Hay tareas atrasadas que requieren seguimiento."
      : "There are overdue tasks that need follow-up.";
  } else if (counts.in_progress > 0) {
    followUp = currentLang === "es"
      ? "Confirma el avance y deja feedback sobre las tareas activas."
      : "Confirm progress and leave feedback on active work.";
  } else if (board.journalState === "stale") {
    followUp = currentLang === "es"
      ? "Pide una actualizacion del journal."
      : "Request a journal update.";
  } else if (counts.not_started > 0) {
    followUp = currentLang === "es"
      ? "Recuerda al atleta que inicie la tarea asignada."
      : "Remind the athlete to start the assigned work.";
  } else {
    followUp = pickCopy(fallback.followUp || {
      en: "No urgent follow-up.",
      es: "No hay seguimiento urgente."
    });
  }

  return {
    athleteName: athlete.name,
    status,
    plan: latestPlan?.title || assignments[0]?.title || pickCopy(fallback.plan || {
      en: "No saved plan yet",
      es: "Todavia no hay plan guardado"
    }),
    progress,
    followUp,
    pendingCount: counts.not_started + counts.in_progress + counts.overdue,
    journalState: board.journalState
  };
}

function scheduleCoachCompletionSync() {
  if (!isCoachWorkspaceActive()) return;
  if (coachCompletionSyncTimeout) clearTimeout(coachCompletionSyncTimeout);
  coachCompletionSyncTimeout = setTimeout(() => {
    syncCoachCompletionStatus().catch((err) => {
      console.warn("Completion sync failed", err);
    });
  }, 250);
}

async function syncCoachCompletionStatus() {
  const authUser = getAuthUser();
  const completionRef = getCoachWorkspaceCollectionRef("completion_status", authUser?.id);
  if (!completionRef || !firebaseFirestoreInstance) return;
  const athletes = getCoachAthleteRecords();
  if (!athletes.length) return;
  const batch = firebaseFirestoreInstance.batch();
  const timestamp = getFirestoreServerTimestamp();
  athletes.forEach((athlete) => {
    const payload = buildCoachCompletionSnapshot(athlete);
    batch.set(completionRef.doc(slugifyKey(athlete.name)), stripUndefinedDeep({
      ...payload,
      updatedAt: timestamp
    }), { merge: true });
  });
  await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_completion_write_timeout");
}

function scheduleCoachAssignmentStatusSync() {
  if (!isCoachWorkspaceActive()) return;
  setTimeout(() => {
    syncDerivedAssignmentStatuses().catch((err) => {
      console.warn("Assignment status sync failed", err);
    });
  }, 50);
}

async function syncDerivedAssignmentStatuses() {
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments");
  if (!assignmentsRef || !firebaseFirestoreInstance) return;
  const todayKey = getCurrentAppDateKey();
  const stale = coachAssignmentsCache.filter((assignment) => (
    assignment.status !== "completed"
      && assignment.status !== "overdue"
      && assignment.dueDateKey
      && assignment.dueDateKey < todayKey
  ));
  if (!stale.length) return;
  const batch = firebaseFirestoreInstance.batch();
  stale.forEach((assignment) => {
    batch.set(assignmentsRef.doc(assignment.id), {
      status: "overdue",
      updatedAt: getFirestoreServerTimestamp()
    }, { merge: true });
  });
  await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_assignment_status_sync_timeout");
}

function getCoachTemplateOptionsForType(type = planRangeType) {
  const targetType = normalizePlanType(type);
  const seedTemplates = getBuiltinCoachTemplateSeeds();
  const liveByType = coachTemplatesCache.filter((item) => item.type === targetType);
  const fallbackByType = seedTemplates.filter((item) => item.type === targetType);
  const live = liveByType.length ? liveByType : coachTemplatesCache;
  const fallback = fallbackByType.length ? fallbackByType : seedTemplates;
  const source = live.length ? live : fallback;
  return source.map((item) => ({
    value: item.id,
    label: { en: item.name, es: item.name },
    record: item
  }));
}

function getDuplicatePlanOptionsForType(type = planRangeType) {
  const targetType = normalizePlanType(type);
  const live = coachWorkspaceSortByUpdated(coachPlansCache).filter((item) => item.type === targetType);
  return live.map((item) => ({
    value: item.id,
    label: {
      en: `${item.title} - ${item.range.startKey}`,
      es: `${item.title} - ${item.range.startKey}`
    },
    record: item
  }));
}

function getCoachAssignmentRecords() {
  if (isCoachWorkspaceActive() && coachWorkspaceRealtimeUserId === getAuthUser()?.id) {
    return coachWorkspaceSortByUpdated(coachAssignmentsCache);
  }
  if (coachAssignmentsCache.length) return coachWorkspaceSortByUpdated(coachAssignmentsCache);
  return COACH_ASSIGNMENT_ITEMS.map((item, idx) => normalizeCoachAssignmentRecord(`seed-${idx + 1}`, {
    title: pickCopy(item.title),
    assigneeName: pickCopy(item.assignee),
    assigneeType: String(pickCopy(item.assignee)).includes("Team") || String(pickCopy(item.assignee)).includes("Grupo") ? "group" : "athlete",
    type: pickCopy(item.type),
    dueLabel: pickCopy(item.dueDate),
    dueDateKey: getCurrentAppDateKey(),
    source: pickCopy(item.source),
    note: pickCopy(item.note),
    status: item.status
  }));
}

function getCoachGroupRecords() {
  return coachGroupsCache.length ? coachGroupsCache : getDefaultCoachGroupSeeds();
}

function getPlanAssignmentsForAthlete(name) {
  const target = normalizeName(name);
  if (!target) return [];
  return getCoachAssignmentRecords().filter((assignment) => {
    if (assignment.assigneeType === "athlete") {
      return normalizeName(assignment.assigneeName) === target;
    }
    if (assignment.assigneeType === "group") {
      const group = getCoachGroupRecords().find((item) => item.id === assignment.assigneeId || normalizeName(item.name) === normalizeName(assignment.assigneeName));
      if (!group) return false;
      return group.memberNames.some((member) => normalizeName(member) === target);
    }
    if (assignment.assigneeNames.length) {
      return assignment.assigneeNames.some((member) => normalizeName(member) === target);
    }
    if (assignment.assigneeType === "team") {
      return true;
    }
    return false;
  });
}

function stopCoachWorkspaceRealtimeSync() {
  if (coachCalendarSyncTimeout) {
    clearTimeout(coachCalendarSyncTimeout);
    coachCalendarSyncTimeout = null;
  }
  if (coachCompletionSyncTimeout) {
    clearTimeout(coachCompletionSyncTimeout);
    coachCompletionSyncTimeout = null;
  }
  coachWorkspaceUnsubs.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // ignore unsubscribe errors
    }
  });
  coachWorkspaceUnsubs = [];
  coachWorkspaceRealtimeUserId = "";
  coachPlansCache = [];
  coachTemplatesCache = [];
  coachAssignmentsCache = [];
  coachGroupsCache = [];
  coachCalendarEntriesCache = {};
  coachAthletesCache = [];
  coachNotesCache = [];
  coachJournalEntriesCache = [];
  coachCompletionCache = [];
  coachMatchAnalysisCache = [];
  coachParentApprovalsCache = [];
  coachDirectoryCache = [];
  coachParentScoutingCache = [];
  currentEditingCoachPlanId = "";
}

async function ensureCoachWorkspaceSeeded() {
  if (!isCoachWorkspaceActive()) return;
  if (coachWorkspaceSeedPromise) return coachWorkspaceSeedPromise;
  const authUser = getAuthUser();
  const profile = getProfile();
  const workspaceRef = getCoachWorkspaceDocRef(authUser.id);
  if (!workspaceRef) return;
  coachWorkspaceSeedPromise = (async () => {
    await withTimeout(
      workspaceRef.set({
        ownerUid: authUser.id,
        ownerEmail: normalizeEmail(authUser.email || profile?.email || ""),
        ownerName: String(profile?.name || "").trim(),
        updatedAt: getFirestoreServerTimestamp()
      }, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_workspace_seed_timeout"
    );

    const [templatesSnap, groupsSnap, plansSnap, assignmentsSnap, calendarSnap, athletesSnap, notesSnap, journalSnap, matchAnalysisSnap] = await Promise.all([
      withTimeout(getCoachWorkspaceCollectionRef("templates", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_templates_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("groups", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_groups_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("plans", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_plans_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("assignments", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_assignments_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("calendar_entries", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_calendar_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("athletes", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_athletes_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("coach_notes", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_notes_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("journal_entries", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_journal_seed_timeout"),
      withTimeout(getCoachWorkspaceCollectionRef("match_analysis", authUser.id).get(), FIREBASE_OP_TIMEOUT_MS, "firestore_match_analysis_seed_timeout")
    ]);

    if (templatesSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getBuiltinCoachTemplateSeeds().forEach((template) => {
        const ref = getCoachWorkspaceCollectionRef("templates", authUser.id).doc(template.id);
        batch.set(ref, {
          ...template,
          system: true,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_templates_seed_commit_timeout");
    }

    if (groupsSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getDefaultCoachGroupSeeds().forEach((group) => {
        const ref = getCoachWorkspaceCollectionRef("groups", authUser.id).doc(group.id);
        batch.set(ref, {
          ...group,
          system: true,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_groups_seed_commit_timeout");
    }

    if (plansSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getSeedCoachWorkspacePlans().forEach((plan) => {
        const ref = getCoachWorkspaceCollectionRef("plans", authUser.id).doc(plan.id);
        batch.set(ref, {
          ...plan,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_plans_seed_commit_timeout");
    }

    if (assignmentsSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getSeedCoachWorkspaceAssignments().forEach((assignment) => {
        const ref = getCoachWorkspaceCollectionRef("assignments", authUser.id).doc(assignment.id);
        batch.set(ref, {
          ...assignment,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_assignments_seed_commit_timeout");
    }

    if (calendarSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      Object.entries(getSeedCoachCalendarEntries()).forEach(([dateKey, entry]) => {
        const ref = getCoachWorkspaceCollectionRef("calendar_entries", authUser.id).doc(dateKey);
        batch.set(ref, {
          ...entry,
          dateKey,
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_calendar_seed_commit_timeout");
    }

    if (athletesSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getSeedCoachAthleteRecords().forEach((athlete) => {
        const ref = getCoachWorkspaceCollectionRef("athletes", authUser.id).doc(athlete.id);
        batch.set(ref, {
          ...athlete,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_athletes_seed_commit_timeout");
    }

    if (notesSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getSeedCoachNoteRecords().forEach((noteRecord) => {
        const ref = getCoachWorkspaceCollectionRef("coach_notes", authUser.id).doc(noteRecord.id);
        batch.set(ref, {
          ...noteRecord,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_notes_seed_commit_timeout");
    }

    if (journalSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getSeedCoachJournalRecords().forEach((entry) => {
        const ref = getCoachWorkspaceCollectionRef("journal_entries", authUser.id).doc(entry.id);
        batch.set(ref, {
          ...entry,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_journal_seed_commit_timeout");
    }

    if (matchAnalysisSnap.empty) {
      const batch = firebaseFirestoreInstance.batch();
      getSeedCoachMatchAnalysisRecords().forEach((analysisRecord) => {
        const ref = getCoachWorkspaceCollectionRef("match_analysis", authUser.id).doc(analysisRecord.id);
        batch.set(ref, {
          ...analysisRecord,
          createdAt: getFirestoreServerTimestamp(),
          updatedAt: getFirestoreServerTimestamp()
        }, { merge: true });
      });
      await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_match_analysis_seed_commit_timeout");
    }

    await syncCoachCompletionStatus();
  })().finally(() => {
    coachWorkspaceSeedPromise = null;
  });
  return coachWorkspaceSeedPromise;
}

async function startCoachWorkspaceRealtimeSync() {
  const authUser = getAuthUser();
  if (!isCoachWorkspaceActive()) {
    stopCoachWorkspaceRealtimeSync();
    return;
  }
  if (coachWorkspaceRealtimeUserId === authUser.id && coachWorkspaceUnsubs.length) return;
  stopCoachWorkspaceRealtimeSync();
  coachWorkspaceRealtimeUserId = authUser.id;
  try {
    await ensureCoachWorkspaceSeeded();
  } catch (err) {
    console.warn("Failed to seed coach workspace", err);
  }

  const plansRef = getCoachWorkspaceCollectionRef("plans", authUser.id);
  const templatesRef = getCoachWorkspaceCollectionRef("templates", authUser.id);
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments", authUser.id);
  const groupsRef = getCoachWorkspaceCollectionRef("groups", authUser.id);
  const calendarRef = getCoachWorkspaceCollectionRef("calendar_entries", authUser.id);
  const athletesRef = getCoachWorkspaceCollectionRef("athletes", authUser.id);
  const notesRef = getCoachWorkspaceCollectionRef("coach_notes", authUser.id);
  const journalRef = getCoachWorkspaceCollectionRef("journal_entries", authUser.id);
  const completionRef = getCoachWorkspaceCollectionRef("completion_status", authUser.id);
  const matchAnalysisRef = getCoachWorkspaceCollectionRef("match_analysis", authUser.id);
  const parentScoutingRef = getCoachWorkspaceCollectionRef("parent_scouting", authUser.id);
  const usersRef = firebaseFirestoreInstance?.collection(FIREBASE_USERS_COLLECTION) || null;
  if (!plansRef || !templatesRef || !assignmentsRef || !groupsRef || !calendarRef || !athletesRef || !notesRef || !journalRef || !completionRef || !matchAnalysisRef || !parentScoutingRef) return;

  coachWorkspaceUnsubs.push(
    plansRef.onSnapshot((snapshot) => {
      coachPlansCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachPlanRecord(doc.id, doc.data()))
      );
      renderPlanSourceControls();
      renderCompletionTracking();
      renderDashboard();
      renderAthleteNotes();
      renderCompetitionPreview(getAthletesData().find((item) => item.name === getSelectedCoachAthleteName()) || getAthletesData()[0] || null);
      scheduleCoachCompletionSync();
    }, (err) => console.warn("Plan sync failed", err)),
    templatesRef.onSnapshot((snapshot) => {
      coachTemplatesCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachTemplateRecord(doc.id, doc.data()))
      );
      renderPlanSourceControls();
      renderTemplatesPanel();
    }, (err) => console.warn("Template sync failed", err)),
    assignmentsRef.onSnapshot((snapshot) => {
      coachAssignmentsCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachAssignmentRecord(doc.id, doc.data()))
      );
      renderCoachAssignments();
      renderCompletionTracking();
      renderDashboard();
      renderAthleteManagement();
      renderAthleteNotes();
      renderCompetitionPreview(getAthletesData().find((item) => item.name === getSelectedCoachAthleteName()) || getAthletesData()[0] || null);
      scheduleCoachAssignmentStatusSync();
      scheduleCoachCompletionSync();
    }, (err) => console.warn("Assignment sync failed", err)),
    groupsRef.onSnapshot((snapshot) => {
      coachGroupsCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachGroupRecord(doc.id, doc.data()))
      );
      renderPlanAssignControls();
      renderCoachAssignments();
      renderCompletionTracking();
      renderAthleteManagement();
      renderAthleteNotes();
      renderMedia();
      scheduleCoachCompletionSync();
    }, (err) => console.warn("Group sync failed", err)),
    calendarRef.onSnapshot((snapshot) => {
      const next = {};
      snapshot.docs.forEach((doc) => {
        next[doc.id] = normalizeCalendarEntry(doc.data());
      });
      coachCalendarEntriesCache = next;
      localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(next));
      renderCalendar(calendarSelectedKey);
      renderCalendarManager();
      renderDashboard();
    }, (err) => console.warn("Calendar sync failed", err)),
    athletesRef.onSnapshot((snapshot) => {
      coachAthletesCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachAthleteRecord(doc.id, doc.data()))
      );
      syncCoachMatchAthleteSelect();
      renderAthleteManagement();
      renderAthleteNotes();
      renderJournalMonitor();
      renderCompletionTracking();
      renderDashboard();
      renderCompetitionPreview(getAthletesData().find((item) => item.name === getSelectedCoachAthleteName()) || getAthletesData()[0] || null);
      scheduleCoachCompletionSync();
    }, (err) => console.warn("Athlete sync failed", err)),
    notesRef.onSnapshot((snapshot) => {
      coachNotesCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachNoteRecord(doc.id, doc.data()))
      );
      renderAthleteNotes();
      renderCoachAthleteProfile(getSelectedCoachAthleteName());
      renderCoachMatchView(getSelectedCoachAthleteName());
      renderCompetitionPreview(getAthletesData().find((item) => item.name === getSelectedCoachAthleteName()) || getAthletesData()[0] || null);
    }, (err) => console.warn("Coach note sync failed", err)),
    journalRef.onSnapshot((snapshot) => {
      coachJournalEntriesCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachJournalRecord(doc.id, doc.data()))
      );
      renderJournalMonitor();
      renderAthleteManagement();
      renderCoachAthleteProfile(getSelectedCoachAthleteName());
      renderCoachMatchView(getSelectedCoachAthleteName());
      renderCompetitionPreview(getAthletesData().find((item) => item.name === getSelectedCoachAthleteName()) || getAthletesData()[0] || null);
      renderCompletionTracking();
      renderDashboard();
      scheduleCoachCompletionSync();
    }, (err) => console.warn("Journal sync failed", err)),
    completionRef.onSnapshot((snapshot) => {
      coachCompletionCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachCompletionRecord(doc.id, doc.data()))
      );
      renderCompletionTracking();
      renderDashboard();
      renderAthleteManagement();
    }, (err) => console.warn("Completion sync failed", err)),
    matchAnalysisRef.onSnapshot((snapshot) => {
      coachMatchAnalysisCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachMatchAnalysisRecord(doc.id, doc.data()))
      );
      renderMedia();
      renderCoachMatchView(getSelectedCoachAthleteName());
      renderCompetitionPreview(getAthletesData().find((item) => item.name === getSelectedCoachAthleteName()) || getAthletesData()[0] || null);
    }, (err) => console.warn("Match analysis sync failed", err)),
    parentScoutingRef.onSnapshot((snapshot) => {
      coachParentScoutingCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeParentScoutingRecord(doc.id, doc.data() || {}))
      );
      renderDashboard();
    }, (err) => console.warn("Parent scouting feed sync failed", err))
  );

  if (canVerifyParentAccounts() && usersRef) {
    coachWorkspaceUnsubs.push(
      usersRef.where("role", "==", "parent").onSnapshot((snapshot) => {
        coachParentApprovalsCache = snapshot.docs.map((doc) => normalizeManagedUserRecord(doc.id, doc.data() || {}));
        renderDashboard();
      }, (err) => console.warn("Parent approval sync failed", err)),
      usersRef.where("role", "==", "coach").onSnapshot((snapshot) => {
        coachDirectoryCache = snapshot.docs
          .map((doc) => normalizeManagedUserRecord(doc.id, doc.data() || {}))
          .filter((record) => Boolean(record.uid))
          .sort((a, b) => a.name.localeCompare(b.name || "", undefined, { sensitivity: "base" }));
        renderDashboard();
      }, (err) => console.warn("Coach directory sync failed", err))
    );
  }
}

function getSharedMediaTreeDocRef() {
  if (!firebaseFirestoreInstance) return null;
  return firebaseFirestoreInstance.collection(FIREBASE_SHARED_COLLECTION).doc(FIREBASE_MEDIA_TREE_DOC);
}

async function fetchSharedMediaTreeDoc() {
  const ref = getSharedMediaTreeDocRef();
  if (!ref) return null;
  try {
    const doc = await withTimeout(
      ref.get(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_media_read_timeout"
    );
    if (!doc.exists) return null;
    return doc.data();
  } catch (err) {
    console.warn("Failed to load shared media tree", err);
    return null;
  }
}

async function persistSharedMediaTreeDoc(payload, { required = false } = {}) {
  const ref = getSharedMediaTreeDocRef();
  if (!ref) {
    if (required) {
      const err = new Error("firestore_not_configured");
      err.code = "firestore_not_configured";
      throw err;
    }
    return;
  }

  try {
    await withTimeout(
      ref.set(stripUndefinedDeep(payload), { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_media_write_timeout"
    );
  } catch (err) {
    if (required) throw err;
    console.warn("Failed to persist shared media tree", err);
  }
}

function queueFirebaseProfileSync(uid, profile) {
  if (!uid || !profile || !firebaseFirestoreInstance) return;
  if (profileSyncTimeout) clearTimeout(profileSyncTimeout);
  profileSyncTimeout = setTimeout(() => {
    if (getAuthUser()?.id !== uid) return;
    persistFirebaseProfile(uid, {
      ...profile,
      updatedAt: new Date().toISOString()
    }).catch((err) => {
      console.warn("Background Firebase profile sync failed", err);
    });
  }, 350);
}

async function buildAuthResultFromFirebaseUser(user, { fallbackEmail = "" } = {}) {
  if (!user || !user.uid) {
    throw new Error("invalid_credentials");
  }
  const remoteProfile = await fetchFirebaseProfile(user.uid);
  const email = normalizeEmail(user.email || fallbackEmail || remoteProfile?.email || "");
  const defaults = TEST_USER_DEFAULTS[String(email).toLowerCase()] || null;
  const forcedRole = isForcedAdminEmail(email)
    ? "admin"
    : (defaults?.role ? normalizeAuthRole(defaults.role) : "");
  const resolvedRole = forcedRole || normalizeAuthRole(remoteProfile?.role);
  const resolvedView = forcedRole
    ? getDefaultViewForRole(resolvedRole)
    : resolveViewForRole(resolvedRole, remoteProfile?.view);
  const now = new Date().toISOString();
  const profile = stripUndefinedDeep({
    ...remoteProfile,
    user_id: user.uid,
    email,
    name: remoteProfile?.name || user.displayName || defaults?.name || "",
    role: resolvedRole,
    view: resolvedView,
    lang: resolveLang(remoteProfile?.lang || currentLang),
    createdAt: remoteProfile?.createdAt || now,
    updatedAt: now
  });
  return {
    user: { id: user.uid, email, role: resolvedRole },
    profile
  };
}

function waitForInitialFirebaseUser(timeoutMs = 2000) {
  if (!firebaseAuthInstance?.onAuthStateChanged) {
    return Promise.resolve(firebaseAuthInstance?.currentUser || null);
  }
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = null;
    let unsubscribe = null;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
      resolve(user || null);
    };
    timeoutId = setTimeout(() => finish(firebaseAuthInstance?.currentUser || null), timeoutMs);
    unsubscribe = firebaseAuthInstance.onAuthStateChanged((user) => finish(user));
    if (settled && unsubscribe) unsubscribe();
  });
}

async function loginWithCredentials({ email, password }) {
  if (!firebaseAuthInstance) {
    throw new Error("firebase_not_configured");
  }
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const credential = await firebaseAuthInstance.signInWithEmailAndPassword(normalizedEmail, password);
  return buildAuthResultFromFirebaseUser(credential.user, { fallbackEmail: normalizedEmail });
}

async function registerWithFirebase({
  email,
  password,
  name,
  role,
  lang,
  athleteName = "",
  preferredMoves = "",
  experienceYears = "",
  stance = "",
  weightClass = "",
  notes = ""
}) {
  if (!firebaseAuthInstance) {
    throw new Error("firebase_not_configured");
  }
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (isForcedAdminEmail(normalizedEmail)) {
    const err = new Error("admin_signup_forbidden");
    err.code = "admin_signup_forbidden";
    throw err;
  }
  const normalizedRole = normalizeAuthRole(role);
  if (normalizedRole === "admin") {
    const err = new Error("admin_signup_forbidden");
    err.code = "admin_signup_forbidden";
    throw err;
  }
  const signupRole = normalizeSignupRole(role);
  const credential = await firebaseAuthInstance.createUserWithEmailAndPassword(normalizedEmail, password);
  const { user } = credential;
  if (name && user.updateProfile) {
    try {
      await user.updateProfile({ displayName: name });
    } catch {
      // ignore profile update errors
    }
  }
  const now = new Date().toISOString();
  const resolvedRole = signupRole;
  const cleanAthleteName = String(athleteName || "").trim();
  const profilePayload = {
    user_id: user.uid,
    email: normalizedEmail,
    name,
    role: resolvedRole,
    view: getDefaultViewForRole(resolvedRole),
    lang: resolveLang(lang || currentLang),
    athleteName: resolvedRole === "parent" ? cleanAthleteName : "",
    linkedAthleteId: resolvedRole === "parent" ? slugifyKey(cleanAthleteName) : "",
    linkedCoachUid: "",
    linkedCoachName: "",
    linkedCoachEmail: "",
    status: resolvedRole === "parent" ? "pending_verification" : "verified",
    preferredMoves,
    preferred_moves: preferredMoves,
    experienceYears,
    experience_years: experienceYears,
    stance,
    weightClass,
    weight_class: weightClass,
    notes,
    createdAt: now,
    updatedAt: now
  };
  await persistFirebaseProfile(user.uid, profilePayload, { required: true });
  return { user: { id: user.uid, email: normalizedEmail, role: profilePayload.role }, profile: profilePayload };
}

async function handleSuccessfulAuth(result) {
  const authUser = buildAuthUser(result.user);
  if (!authUser) {
    throw new Error("invalid_credentials");
  }
  const resolvedRole = normalizeAuthRole(result?.profile?.role || authUser.role);
  const resolvedAuthUser = { ...authUser, role: resolvedRole };
  const targetView = resolveViewForRole(resolvedRole, result?.profile?.view);
  setAuthUser(resolvedAuthUser);
  const profile = normalizeProfileForAuth(
    { ...(result.profile || {}), role: resolvedRole, view: targetView },
    resolvedAuthUser
  );
  if (resolvedRole !== "parent") {
    await persistFirebaseProfile(resolvedAuthUser.id, {
      ...profile,
      user_id: resolvedAuthUser.id,
      updatedAt: new Date().toISOString()
    }, { required: true });
  }
  setProfile(profile, { sync: resolvedRole !== "parent" });
  try {
    await hydrateMediaTreeFromSharedStore();
    startMediaRealtimeSync();
  } catch (err) {
    console.warn("Failed to hydrate shared media after auth", err);
  }
  startCoachWorkspaceRealtimeSync();
  hideOnboarding();
  try {
    await applyProfile(profile);
  } catch (err) {
    console.warn("Failed to apply profile after auth", err);
    setView(targetView);
    refreshLanguageUI();
  }
}

if (pRole) {
  pRole.addEventListener("change", () => updateRoleSections(pRole.value));
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
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

if (createAccountBtn) {
  createAccountBtn.addEventListener("click", showRegisterModal);
}

if (registerCloseBtn) {
  registerCloseBtn.addEventListener("click", showAuthChoice);
}

if (registerSigninBtn) {
  registerSigninBtn.addEventListener("click", showAuthChoice);
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = pName.value.trim();
    const email = pEmail.value.trim().toLowerCase();
    const password = pPassword.value;
    const confirm = pPasswordConfirm.value;
    const role = pRole.value;
    const lang = pLang?.value || currentLang;
    const athleteName = String(pParentAthleteName?.value || "").trim();

    if (!name || !email || !password || !confirm) {
      alert("Please fill all fields.");
      return;
    }
    if (normalizeAuthRole(role) === "parent" && !athleteName) {
      alert(currentLang === "es" ? "Ingresa el nombre del atleta vinculado." : "Enter the linked athlete name.");
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
        athleteName,
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
  {
    title: "Single Leg Finish - Coach Chewy",
    type: "Video",
    tag: "Technique Library",
    assigned: "This week",
    note: "Use with the single-leg finish assignment for Carlos Vega.",
    assetPath: "https://www.flowrestling.org/training?playing=7965907"
  },
  {
    title: "World-Class Takedown Breakdown",
    type: "Link",
    tag: "Match Analysis",
    assigned: "Today",
    note: "Film-study example for reading chained re-attacks.",
    assetPath: "https://www.jiujitsubrotherhood.com/blogs/blog/wrestling-takedowns"
  },
  {
    title: "Single Leg Trip Finish - Nathan Tomasello",
    type: "Link",
    tag: "Drill Library",
    assigned: "Today",
    note: "Use as the reference clip for a finish drill block.",
    assetPath: "https://coachesinsider.com/wrestling/single-leg-trip-finish-with-nathan-tomasello-usa-wrestling/"
  },
  {
    title: "Hand Fight Notes - Inside Control to Shot",
    type: "Link",
    tag: "Coach Notes",
    assigned: "Optional",
    note: "Quick read before live goes or a short neutral session.",
    assetPath: "https://coachesinsider.com/wrestling/takedown-setups-with-nathan-tomasello-usa-wrestling/"
  },
  {
    title: "Takedown to Breakdown",
    type: "Link",
    tag: "Featured",
    assigned: "Today",
    note: "Featured film-study clip for transition scoring.",
    assetPath: "https://www.flowrestling.org/video/6370427-takedown-to-breakdown"
  }
];

const MEDIA_ITEMS_ES = [
  {
    title: "Final de pierna simple - Coach Chewy",
    type: "Video",
    tag: "Biblioteca tecnica",
    assigned: "Esta semana",
    note: "Usalo con la asignacion de finalizacion de single para Carlos Vega.",
    assetPath: "https://www.flowrestling.org/training?playing=7965907"
  },
  {
    title: "Analisis de derribos de nivel mundial",
    type: "Enlace",
    tag: "Analisis de combate",
    assigned: "Hoy",
    note: "Ejemplo de film study para leer re-ataques encadenados.",
    assetPath: "https://www.jiujitsubrotherhood.com/blogs/blog/wrestling-takedowns"
  },
  {
    title: "Final con trip de single - Nathan Tomasello",
    type: "Enlace",
    tag: "Biblioteca de drills",
    assigned: "Hoy",
    note: "Referencia para un bloque de drill de finalizacion.",
    assetPath: "https://coachesinsider.com/wrestling/single-leg-trip-finish-with-nathan-tomasello-usa-wrestling/"
  },
  {
    title: "Notas de pelea de manos - inside control a tiro",
    type: "Enlace",
    tag: "Notas del coach",
    assigned: "Opcional",
    note: "Lectura rapida antes de sparring neutral o trabajo en vivo.",
    assetPath: "https://coachesinsider.com/wrestling/takedown-setups-with-nathan-tomasello-usa-wrestling/"
  },
  {
    title: "Takedown to Breakdown",
    type: "Enlace",
    tag: "Destacado",
    assigned: "Hoy",
    note: "Clip destacado de film study para transiciones a control.",
    assetPath: "https://www.flowrestling.org/video/6370427-takedown-to-breakdown"
  }
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
  { title: "Active Athletes", value: "7", note: "5 ready for full training today" },
  { title: "Pending Tasks", value: "6", note: "3 need coach follow-up before Friday" },
  { title: "Upcoming Competitions", value: "2", note: "Next dual is Saturday, March 14" },
  { title: "Recent Trainings", value: "4", note: "Sessions logged in the last 7 days" }
];

const TEAM_STATS_ES = [
  { title: "Atletas activos", value: "7", note: "5 listos para entrenar hoy" },
  { title: "Tareas pendientes", value: "6", note: "3 necesitan seguimiento antes del viernes" },
  { title: "Competencias proximas", value: "2", note: "El proximo dual es el sabado 14 de marzo" },
  { title: "Entrenamientos recientes", value: "4", note: "Sesiones registradas en los ultimos 7 dias" }
];

const TEAM_OVERVIEW = [
  "Review Maya Cruz ankle rehab update before today's session.",
  "Finalize Saturday, March 14 dual lineup for 157 lb and 189 lb.",
  "Send film assignment to Carlos Vega and Sophia Reyes.",
  "Confirm Olivia Chen travel status for the weekend event."
];

const TEAM_OVERVIEW_ES = [
  "Revisar la actualizacion del tobillo de Maya Cruz antes de la practica de hoy.",
  "Cerrar la alineacion del dual del sabado 14 de marzo para 157 lb y 189 lb.",
  "Enviar la asignacion de video a Carlos Vega y Sophia Reyes.",
  "Confirmar el estatus de viaje de Olivia Chen para el evento del fin de semana."
];

const QUICK_ACTIONS = [
  "Add Athlete",
  "Create Plan",
  "Send Assignment",
  "Open Competition Mode"
];

const QUICK_ACTIONS_ES = [
  "Agregar atleta",
  "Crear plan",
  "Enviar asignacion",
  "Abrir modo competencia"
];

const HOME_COMPETITIONS = [
  { title: "Friday Night Dual", detail: "Lincoln High - Saturday, March 14 - 6:00 PM" },
  { title: "Junior Worlds Prep Scrimmage", detail: "United WC room - Tuesday, March 17 - 4:30 PM" }
];

const HOME_COMPETITIONS_ES = [
  { title: "Dual de viernes por la noche", detail: "Lincoln High - Sabado 14 de marzo - 6:00 PM" },
  { title: "Scrimmage preparatorio Junior Worlds", detail: "United WC room - Martes 17 de marzo - 4:30 PM" }
];

const HOME_RECENT_TRAININGS = [
  { title: "Chain wrestling", detail: "Completed by 6 athletes - Thursday, March 12" },
  { title: "Top control review", detail: "Completed by 5 athletes - Wednesday, March 11" },
  { title: "Conditioning circuit", detail: "Modified for 2 athletes - Tuesday, March 10" }
];

const HOME_RECENT_TRAININGS_ES = [
  { title: "Cadena de lucha", detail: "Completado por 6 atletas - Jueves 12 de marzo" },
  { title: "Revision de control arriba", detail: "Completado por 5 atletas - Miercoles 11 de marzo" },
  { title: "Circuito de acondicionamiento", detail: "Modificado para 2 atletas - Martes 10 de marzo" }
];

const ALERTS = [
  "Maya Cruz reported ankle soreness after Thursday's session.",
  "Ethan Brooks still needs a weight check before Saturday, March 14.",
  "Olivia Chen remains marked as travel for the weekend competition."
];

const ALERTS_ES = [
  "Maya Cruz reporto dolor en el tobillo despues de la sesion del jueves.",
  "Ethan Brooks todavia necesita chequeo de peso antes del sabado 14 de marzo.",
  "Olivia Chen sigue marcada como viaje para la competencia del fin de semana."
];

const ATHLETE_TASK_BOARD = {
  "Jaime Espinal": {
    tasks: [
      { en: "Review Friday opponent film", es: "Revisar video del rival del viernes" }
    ],
    journal: {
      state: "fresh",
      label: { en: "Updated today", es: "Actualizado hoy" }
    }
  },
  "Maya Cruz": {
    tasks: [
      { en: "Adjust ankle rehab warm-up", es: "Ajustar el warm-up de rehabilitacion del tobillo" },
      { en: "Send modified drill assignment", es: "Enviar la asignacion modificada de drills" }
    ],
    journal: {
      state: "stale",
      label: { en: "Journal missing since yesterday", es: "Falta el journal desde ayer" }
    }
  },
  "Liam Park": {
    tasks: [],
    journal: {
      state: "fresh",
      label: { en: "Updated this morning", es: "Actualizado esta manana" }
    }
  },
  "Olivia Chen": {
    tasks: [
      { en: "Confirm weekend travel schedule", es: "Confirmar el horario de viaje del fin de semana" }
    ],
    journal: {
      state: "stale",
      label: { en: "No journal in the last 2 days", es: "No hay journal en los ultimos 2 dias" }
    }
  },
  "Carlos Vega": {
    tasks: [
      { en: "Complete assigned film review", es: "Completar la revision del video asignado" }
    ],
    journal: {
      state: "fresh",
      label: { en: "Updated today", es: "Actualizado hoy" }
    }
  },
  "Sophia Reyes": {
    tasks: [
      { en: "Send top-turn clip before Friday", es: "Enviar el clip de turns arriba antes del viernes" }
    ],
    journal: {
      state: "fresh",
      label: { en: "Updated this afternoon", es: "Actualizado esta tarde" }
    }
  },
  "Ethan Brooks": {
    tasks: [
      { en: "Schedule weight check", es: "Programar el chequeo de peso" },
      { en: "Adjust conditioning load", es: "Ajustar la carga de acondicionamiento" }
    ],
    journal: {
      state: "stale",
      label: { en: "Journal overdue by 1 day", es: "El journal tiene 1 dia de atraso" }
    }
  }
};

const COACH_ASSIGNMENT_ITEMS = [
  {
    title: { en: "Friday opponent film", es: "Video del rival del viernes" },
    assignee: { en: "Carlos Vega", es: "Carlos Vega" },
    type: { en: "Video review", es: "Revision de video" },
    dueDate: { en: "Today - 5:00 PM", es: "Hoy - 5:00 PM" },
    source: { en: "Film library", es: "Biblioteca de video" },
    note: { en: "Required before evening practice.", es: "Obligatorio antes de la practica de la tarde." },
    status: "not_started"
  },
  {
    title: { en: "Top-turn breakdown", es: "Analisis de turns arriba" },
    assignee: { en: "Competition squad", es: "Grupo de competencia" },
    type: { en: "Match analysis", es: "Analisis de combate" },
    dueDate: { en: "Tomorrow - 10:00 AM", es: "Manana - 10:00 AM" },
    source: { en: "Coach clip set", es: "Clips del coach" },
    note: { en: "Reply with 3 scoring reads.", es: "Responder con 3 lecturas de puntuacion." },
    status: "in_progress"
  },
  {
    title: { en: "Ankle-safe motion drill", es: "Drill de movimiento seguro para el tobillo" },
    assignee: { en: "Maya Cruz", es: "Maya Cruz" },
    type: { en: "Drill", es: "Drill" },
    dueDate: { en: "Overdue - Thursday", es: "Atrasado - jueves" },
    source: { en: "Modified rehab block", es: "Bloque modificado de rehab" },
    note: { en: "Complete before the next live session.", es: "Completar antes de la siguiente sesion en vivo." },
    status: "overdue"
  },
  {
    title: { en: "Travel checklist + coach notes", es: "Checklist de viaje + notas del coach" },
    assignee: { en: "Travel group", es: "Grupo de viaje" },
    type: { en: "Coach notes", es: "Notas del coach" },
    dueDate: { en: "Completed - Friday", es: "Completado - viernes" },
    source: { en: "Competition packet", es: "Paquete de competencia" },
    note: { en: "Travel details already confirmed.", es: "Los detalles de viaje ya estan confirmados." },
    status: "completed"
  },
  {
    title: { en: "Journal + weight check", es: "Journal + chequeo de peso" },
    assignee: { en: "Ethan Brooks", es: "Ethan Brooks" },
    type: { en: "Journal task", es: "Tarea de journal" },
    dueDate: { en: "Today - before 7:00 PM", es: "Hoy - antes de las 7:00 PM" },
    source: { en: "Readiness check", es: "Chequeo de readiness" },
    note: { en: "Needs coach review before Saturday lineup.", es: "Necesita revision del coach antes de la alineacion del sabado." },
    status: "not_started"
  }
];

const COACH_ASSIGNMENT_TYPES = [
  {
    title: { en: "Video", es: "Video" },
    detail: { en: "Watch a clip set or full match and send back coach takeaways.", es: "Ver clips o un combate completo y devolver ideas al coach." },
    examples: [
      { en: "Opponent study", es: "Estudio del rival" },
      { en: "Technique demo", es: "Demo tecnica" }
    ]
  },
  {
    title: { en: "Match Analysis", es: "Analisis de combate" },
    detail: { en: "Break down sequences, scoring windows, and tactical reads.", es: "Desglosar secuencias, ventanas de puntuacion y lecturas tacticas." },
    examples: [
      { en: "3 scoring moments", es: "3 momentos de puntuacion" },
      { en: "Missed counters", es: "Contras perdidas" }
    ]
  },
  {
    title: { en: "Drill", es: "Drill" },
    detail: { en: "Send movement, rehab, or technical reps to complete off-mat or before practice.", es: "Enviar movimientos, rehab o repeticiones tecnicas para completar fuera del mat o antes de la practica." },
    examples: [
      { en: "Footwork block", es: "Bloque de footwork" },
      { en: "Rehab sequence", es: "Secuencia de rehab" }
    ]
  },
  {
    title: { en: "Coach Notes", es: "Notas del coach" },
    detail: { en: "Push reminders, scouting notes, travel info, or mental cues.", es: "Enviar recordatorios, scouting, viaje o claves mentales." },
    examples: [
      { en: "Travel packet", es: "Paquete de viaje" },
      { en: "Corner reminders", es: "Recordatorios de esquina" }
    ]
  },
  {
    title: { en: "Journal", es: "Journal" },
    detail: { en: "Request reflection, readiness check-in, or written match prep.", es: "Pedir reflexion, readiness o preparacion escrita de competencia." },
    examples: [
      { en: "Daily check-in", es: "Chequeo diario" },
      { en: "Tournament focus", es: "Enfoque para torneo" }
    ]
  }
];

const COACH_ASSIGNMENT_RESOURCES = [
  {
    en: "Attach video, PDF notes, drill blocks, or coach comments from the same assignment flow.",
    es: "Adjunta video, notas en PDF, bloques de drills o comentarios del coach desde el mismo flujo."
  },
  {
    en: "Assign by athlete, small group, weight class, or full team.",
    es: "Asigna por atleta, grupo pequeno, peso o equipo completo."
  },
  {
    en: "Set due date, required vs optional, and whether coach review is needed.",
    es: "Define fecha, si es obligatorio u opcional, y si requiere revision del coach."
  },
  {
    en: "Keep film, match study, drill, notes, and journal tasks under one queue.",
    es: "Mantiene video, analisis, drills, notas y journal dentro de una sola cola."
  }
];

const COACH_ASSIGNMENT_WORKFLOW = [
  {
    en: "Create the plan first when the assignment belongs to a structured practice block.",
    es: "Crea primero el plan cuando la asignacion pertenece a un bloque estructurado."
  },
  {
    en: "Send the assignment with athlete, due date, and completion expectation.",
    es: "Enviala con atleta, fecha y expectativa de cumplimiento."
  },
  {
    en: "Place it on the calendar if it belongs to a practice day, tournament week, or travel window.",
    es: "Ponla en el calendario si pertenece a un dia de practica, semana de torneo o viaje."
  },
  {
    en: "Use Completion Tracking for late work, missing journals, and coach follow-up.",
    es: "Usa Seguimiento para trabajo tarde, journals faltantes y seguimiento del coach."
  }
];

const COACH_COMPLETION_STATUS_COPY = {
  ontrack: { en: "On track", es: "En camino" },
  followup: { en: "Needs follow-up", es: "Necesita seguimiento" },
  overdue: { en: "Overdue", es: "Atrasado" },
  limited: { en: "Modified load", es: "Carga modificada" }
};

const COACH_COMPLETION_ROWS = {
  "Jaime Espinal": {
    plan: { en: "Competition prep week", es: "Semana de preparacion competitiva" },
    progress: { en: "3 of 4 assignments completed", es: "3 de 4 asignaciones completadas" },
    followUp: { en: "Review opponent notes tonight.", es: "Revisar las notas del rival esta noche." },
    status: "ontrack"
  },
  "Maya Cruz": {
    plan: { en: "Modified rehab week", es: "Semana modificada de rehabilitacion" },
    progress: { en: "1 of 3 assignments completed", es: "1 de 3 asignaciones completadas" },
    followUp: { en: "Check ankle-safe drill before next live session.", es: "Revisar el drill seguro para el tobillo antes de la proxima sesion en vivo." },
    status: "limited"
  },
  "Olivia Chen": {
    plan: { en: "Travel + competition week", es: "Semana de viaje + competencia" },
    progress: { en: "Travel notes completed, journal still missing", es: "Notas de viaje completadas, journal aun pendiente" },
    followUp: { en: "Confirm journal before departure.", es: "Confirmar journal antes de salir." },
    status: "followup"
  },
  "Carlos Vega": {
    plan: { en: "Film and finish week", es: "Semana de video y finalizacion" },
    progress: { en: "Film assignment due today", es: "La asignacion de video vence hoy" },
    followUp: { en: "Coach review right after practice.", es: "Revision del coach justo despues de la practica." },
    status: "followup"
  },
  "Ethan Brooks": {
    plan: { en: "Weight management block", es: "Bloque de manejo de peso" },
    progress: { en: "Journal and weight check overdue", es: "Journal y chequeo de peso atrasados" },
    followUp: { en: "Clear before Saturday lineup lock.", es: "Resolver antes de cerrar la alineacion del sabado." },
    status: "overdue"
  }
};

const COACH_ATHLETE_NOTE_BOARD = {
  "Jaime Espinal": {
    nextFocus: [
      { en: "Start the single leg with cleaner head position.", es: "Iniciar el single leg con mejor posicion de cabeza." },
      { en: "Score off the re-attack instead of forcing the first shot.", es: "Anotar en el re-ataque en vez de forzar el primer tiro." },
      { en: "Own center mat after the first score.", es: "Dominar el centro despues de la primera anotacion." }
    ],
    recentNotes: [
      { en: "Mar 12: Won neutral pace in live and finished better to the shelf.", es: "12 mar: Gano el ritmo en neutral y finalizo mejor a la shelf." },
      { en: "Mar 10: Reached with lead hand when the pace sped up.", es: "10 mar: Extendio la mano adelantada cuando subio el ritmo." },
      { en: "Mar 8: Responded well to short-go competition scenarios.", es: "8 mar: Respondio bien a escenarios cortos de competencia." }
    ]
  },
  "Maya Cruz": {
    nextFocus: [
      { en: "Keep the ankle safe and finish short matches clean.", es: "Proteger el tobillo y cerrar combates cortos con limpieza." },
      { en: "Hand fight first, then ankle pick off a real reaction.", es: "Pelear manos primero y luego ankle pick sobre una reaccion real." },
      { en: "Journal every day during rehab week.", es: "Completar el journal todos los dias durante la semana de rehab." }
    ],
    recentNotes: [
      { en: "Mar 12: Modified live went well; no swelling increase after practice.", es: "12 mar: La sesion modificada salio bien; no aumento de inflamacion." },
      { en: "Mar 11: Needs a faster first move from bottom.", es: "11 mar: Necesita una primera salida mas rapida desde abajo." },
      { en: "Mar 9: Good discipline on position, but too cautious late.", es: "9 mar: Buena disciplina de posicion, pero demasiado cauta al final." }
    ]
  },
  "Carlos Vega": {
    nextFocus: [
      { en: "Finish the single leg immediately when the leg is collected.", es: "Finalizar el single leg de inmediato cuando recoge la pierna." },
      { en: "Keep chain attacks alive after the first reshot.", es: "Mantener la cadena ofensiva despues del primer reshot." },
      { en: "Turn Friday opponent film into three clear scoring reads.", es: "Convertir el video del rival del viernes en tres lecturas claras." }
    ],
    recentNotes: [
      { en: "Mar 12: Best pace of the room in chain wrestling block.", es: "12 mar: Mejor ritmo del room en el bloque de chain wrestling." },
      { en: "Mar 10: Still pauses after the first defended shot.", es: "10 mar: Todavia se detiene despues del primer tiro defendido." },
      { en: "Mar 8: Weight and recovery both looked on target.", es: "8 mar: Peso y recuperacion se vieron encaminados." }
    ]
  }
};

const ATHLETE_CORNER_PLANS = {
  "Jaime Espinal": {
    setups: [
      { en: "Heavy collar tie to single", es: "Collar tie pesado a single" },
      { en: "Inside control to snap", es: "Control interno a snap" },
      { en: "Level change off fake step", es: "Cambio de nivel despues de fake step" }
    ],
    planA: { en: "Score first from single leg and keep center pressure.", es: "Anotar primero desde single leg y mantener presion en el centro." },
    planB: { en: "Go snap-down to front headlock if the shot gets blocked.", es: "Ir a snap-down y front headlock si bloquean el tiro." },
    planC: { en: "Win ties, hand fight, and score late off re-attack.", es: "Ganar los ties, pelear manos y anotar tarde con re-ataque." },
    coachCues: [
      { en: "Head to hip", es: "Cabeza a la cadera" },
      { en: "Stay under him", es: "Mantente debajo de el" },
      { en: "Re-attack fast", es: "Re-ataca rapido" }
    ],
    pressureErrors: [
      { en: "Reaches with lead hand before moving feet.", es: "Extiende la mano adelantada antes de mover los pies." }
    ],
    physicalLimitations: [
      { en: "Monitor lower-back fatigue late in match.", es: "Vigilar la fatiga lumbar al final del combate." }
    ],
    safetyWarnings: [
      { en: "Do not hang on the shot if the head position is lost.", es: "No colgarse del tiro si pierde la posicion de la cabeza." }
    ],
    mentalReminders: [
      { en: "First contact wins the pace.", es: "El primer contacto gana el ritmo." },
      { en: "Stay patient after the first shot.", es: "Mantente paciente despues del primer tiro." }
    ]
  },
  "Maya Cruz": {
    setups: [
      { en: "Short drag to ankle pick", es: "Short drag a ankle pick" },
      { en: "Opponent reach to outside step", es: "Si extiende la mano, paso por fuera" },
      { en: "Bottom explode on whistle", es: "Desde abajo explotar al silbato" }
    ],
    planA: { en: "Keep the match clean, score from ankle pick, and avoid extended scrambles.", es: "Mantener el combate limpio, anotar con ankle pick y evitar scrambles largos." },
    planB: { en: "If neutral is slow, create offense from bottom with first-move urgency.", es: "Si el neutral esta lento, crear ofensiva desde abajo con urgencia." },
    planC: { en: "Close the match with position and mat control, not risk.", es: "Cerrar el combate con posicion y control de mat, no con riesgo." },
    coachCues: [
      { en: "Short steps", es: "Pasos cortos" },
      { en: "Hip down first", es: "Cadera abajo primero" },
      { en: "Score and settle", es: "Anota y estabiliza" }
    ],
    pressureErrors: [
      { en: "Backs straight up when the pace rises.", es: "Retrocede en linea recta cuando sube el ritmo." }
    ],
    physicalLimitations: [
      { en: "Protect the recovering ankle on long scrambles.", es: "Proteger el tobillo en recuperacion en scrambles largos." }
    ],
    safetyWarnings: [
      { en: "Avoid extended knee-on-ankle pressure in bad positions.", es: "Evitar presion prolongada sobre el tobillo en malas posiciones." }
    ],
    mentalReminders: [
      { en: "Small wins every exchange.", es: "Pequenas victorias en cada intercambio." },
      { en: "No rush after defending.", es: "No apresurarse despues de defender." }
    ]
  },
  "Liam Park": {
    setups: [
      { en: "Head position before body lock", es: "Posicion de cabeza antes del body lock" },
      { en: "Snap to underhook", es: "Snap a underhook" },
      { en: "Upper-body fake to throw window", es: "Fake de torso a ventana de lanzamiento" }
    ],
    planA: { en: "Control ties and attack from upper-body pressure.", es: "Controlar ties y atacar desde la presion del torso." },
    planB: { en: "If they square up, create scores off snap-downs and go-behinds.", es: "Si se cuadran, anotar con snap-downs y go-behinds." },
    planC: { en: "Win every restart with position and heavy hands.", es: "Ganar cada reinicio con posicion y manos pesadas." },
    coachCues: [
      { en: "Head first", es: "Cabeza primero" },
      { en: "Elbows in", es: "Codos adentro" },
      { en: "Lock and move", es: "Traba y mueve" }
    ],
    pressureErrors: [
      { en: "Waits too long before converting ties to offense.", es: "Espera demasiado para convertir los ties en ofensiva." }
    ],
    physicalLimitations: [],
    safetyWarnings: [
      { en: "Do not force throws when hips are behind the opponent.", es: "No forzar lanzamientos cuando las caderas estan detras del rival." }
    ],
    mentalReminders: [
      { en: "Position before power.", es: "Posicion antes que fuerza." }
    ]
  },
  "Olivia Chen": {
    setups: [
      { en: "Snap to double", es: "Snap a doble" },
      { en: "Fake single to re-shot", es: "Fake de single a re-shot" },
      { en: "Circle to open lane", es: "Circular para abrir la linea" }
    ],
    planA: { en: "Push pace early and score before the opponent settles.", es: "Subir el ritmo temprano y anotar antes de que el rival se acomode." },
    planB: { en: "If tied late, own center and finish the best re-attack.", es: "Si esta empatada al final, dominar el centro y finalizar el mejor re-ataque." },
    planC: { en: "When travel fatigue shows, stay efficient and win position by position.", es: "Si aparece fatiga por viaje, ser eficiente y ganar posicion por posicion." },
    coachCues: [
      { en: "Center first", es: "Centro primero" },
      { en: "Hands then hips", es: "Manos y luego caderas" },
      { en: "Finish clean", es: "Final limpio" }
    ],
    pressureErrors: [
      { en: "Shoots from too far away under stress.", es: "Tira desde muy lejos cuando siente presion." }
    ],
    physicalLimitations: [
      { en: "Monitor recovery if travel schedule is tight.", es: "Monitorear la recuperacion si el viaje es ajustado." }
    ],
    safetyWarnings: [
      { en: "Do not chase low-percentage shots late if balance is off.", es: "No perseguir tiros de bajo porcentaje al final si el balance no esta bien." }
    ],
    mentalReminders: [
      { en: "Own the center.", es: "Domina el centro." },
      { en: "Late points come from calm pressure.", es: "Los puntos tardios salen de una presion calmada." }
    ]
  },
  "Carlos Vega": {
    setups: [
      { en: "Inside tie to ankle pick", es: "Inside tie a ankle pick" },
      { en: "Level fake to double", es: "Fake de nivel a doble" },
      { en: "Reshot off first defense", es: "Reshot despues de la primera defensa" }
    ],
    planA: { en: "Chain the first attack into the second attack immediately.", es: "Encadenar el primer ataque con el segundo inmediatamente." },
    planB: { en: "If the first score does not come, build with hand fight and reshot.", es: "Si no llega el primer punto, construir con pelea de manos y reshot." },
    planC: { en: "In close matches, trust short offense and clean finishes.", es: "En combates cerrados, confiar en ofensiva corta y finales limpios." },
    coachCues: [
      { en: "First shot, second shot", es: "Primer tiro, segundo tiro" },
      { en: "Stay on the leg", es: "Sigue en la pierna" }
    ],
    pressureErrors: [
      { en: "Stops after the first defended attack.", es: "Se detiene despues del primer ataque defendido." }
    ],
    physicalLimitations: [],
    safetyWarnings: [
      { en: "Do not dive across the body on ankle picks.", es: "No lanzarse cruzado en los ankle picks." }
    ],
    mentalReminders: [
      { en: "One more attack wins the exchange.", es: "Un ataque mas gana el intercambio." }
    ]
  },
  "Sophia Reyes": {
    setups: [
      { en: "Inside tie to high crotch", es: "Inside tie a high crotch" },
      { en: "Snap to angle change", es: "Snap a cambio de angulo" },
      { en: "Top wrist to turn", es: "Control de muneca arriba para girar" }
    ],
    planA: { en: "Create offense early and look for top turns once she scores.", es: "Crear ofensiva temprano y buscar turns arriba despues de anotar." },
    planB: { en: "If top turns are not there, ride and build pressure for the next opening.", es: "Si no salen los turns, montar y construir presion para la siguiente apertura." },
    planC: { en: "Use short go pace and do not force the turn without control.", es: "Usar ritmo corto y no forzar el turn sin control." },
    coachCues: [
      { en: "Wrist first", es: "Muneca primero" },
      { en: "Short motion", es: "Movimiento corto" },
      { en: "Turn when set", es: "Gira cuando este listo" }
    ],
    pressureErrors: [
      { en: "Forces turns before controlling hips and wrist.", es: "Fuerza los turns antes de controlar cadera y muneca." }
    ],
    physicalLimitations: [],
    safetyWarnings: [
      { en: "Avoid rolling through if position is not sealed.", es: "Evitar rodar si la posicion no esta asegurada." }
    ],
    mentalReminders: [
      { en: "Control creates the turn.", es: "El control crea el turn." }
    ]
  },
  "Ethan Brooks": {
    setups: [
      { en: "Snap to body lock", es: "Snap a body lock" },
      { en: "Short drag to upper-body tie", es: "Short drag a tie de torso" },
      { en: "Heavy hands on restart", es: "Manos pesadas al reiniciar" }
    ],
    planA: { en: "Win ties, slow the match, then score from upper-body control.", es: "Ganar ties, bajar el ritmo del combate y anotar desde el control de torso." },
    planB: { en: "If pace rises, defend first and counter right away.", es: "Si sube el ritmo, defender primero y contraatacar enseguida." },
    planC: { en: "Protect gas tank and win late with position.", es: "Proteger la gasolina y ganar tarde con posicion." },
    coachCues: [
      { en: "Heavy hands", es: "Manos pesadas" },
      { en: "Short offense", es: "Ofensiva corta" },
      { en: "Counter now", es: "Contra ahora" }
    ],
    pressureErrors: [
      { en: "Pauses after defending instead of countering.", es: "Se pausa despues de defender en vez de contraatacar." }
    ],
    physicalLimitations: [
      { en: "Manage conditioning load between periods.", es: "Manejar la carga fisica entre periodos." }
    ],
    safetyWarnings: [
      { en: "Avoid forcing big throws when fatigued.", es: "Evitar forzar grandes lanzamientos cuando este fatigado." }
    ],
    mentalReminders: [
      { en: "Stay composed in hand fight.", es: "Mantente compuesto en la pelea de manos." },
      { en: "Position before explosion.", es: "Posicion antes de explotar." }
    ]
  }
};

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

const PERMISSIONS_ADMIN = {
  can: [
    "Access athlete, coach, parent and admin views",
    "Edit account profile data (name, role, language, default view)",
    "Review all registered user profiles",
    "Maintain team-wide settings and content"
  ],
  cannot: [
    "Read or recover user passwords",
    "Bypass Firebase Authentication requirements",
    "Manage users if Firestore access is restricted by security rules"
  ]
};

const PERMISSIONS_ADMIN_ES = {
  can: [
    "Acceder a vistas atleta, coach, padre/madre y admin",
    "Editar datos del perfil de cuentas (nombre, rol, idioma, vista)",
    "Revisar todos los perfiles registrados",
    "Mantener configuraciones y contenido del equipo"
  ],
  cannot: [
    "Leer o recuperar contrasenas de usuarios",
    "Saltar requisitos de Firebase Authentication",
    "Gestionar usuarios si Firestore restringe acceso por reglas de seguridad"
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

function getDatePartsInAppTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const map = {};
  parts.forEach(({ type, value }) => {
    if (type !== "literal") map[type] = value;
  });
  return {
    year: Number.parseInt(map.year, 10),
    month: Number.parseInt(map.month, 10),
    day: Number.parseInt(map.day, 10)
  };
}

function getCurrentAppDate(date = new Date()) {
  const { year, month, day } = getDatePartsInAppTime(date);
  return new Date(year, month - 1, day);
}

function getCurrentAppDateKey(date = new Date()) {
  const { year, month, day } = getDatePartsInAppTime(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCurrentAppDayIndex(date = new Date()) {
  return getCurrentAppDate(date).getDay();
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
  if (isCoachWorkspaceActive() && coachWorkspaceRealtimeUserId === getAuthUser()?.id) {
    return coachCalendarEntriesCache;
  }
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

function getHomeCompetitionsData() {
  return currentLang === "es" ? HOME_COMPETITIONS_ES : HOME_COMPETITIONS;
}

function getHomeRecentTrainingsData() {
  return currentLang === "es" ? HOME_RECENT_TRAININGS_ES : HOME_RECENT_TRAININGS;
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
  const sourceAthletes = isCoachRole(profile?.role) && getCoachAthleteRecords().length
    ? getCoachAthleteRecords()
    : ATHLETES;
  const merged = sourceAthletes.map((athlete) => {
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
  if (coachJournalEntriesCache.length) {
    const latestEntries = getAthletesData().map((athlete) => getLatestCoachJournalRecord(athlete.name)).filter(Boolean);
    return latestEntries.map((entry) => ({
      name: entry.athleteName,
      sleep: entry.sleep,
      energy: entry.energy,
      soreness: entry.soreness,
      mood: entry.mood,
      weight: entry.weight,
      note: entry.note,
      entryDate: entry.entryDate
    }));
  }
  return currentLang === "es" ? JOURNAL_ATHLETES_ES : JOURNAL_ATHLETES;
}

function getSkillsData() {
  return currentLang === "es" ? SKILLS_ES : SKILLS;
}

function getPermissionsData(role = getProfile()?.role) {
  if (isAdminRole(role)) {
    return currentLang === "es" ? PERMISSIONS_ADMIN_ES : PERMISSIONS_ADMIN;
  }
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
  "parent-home": document.getElementById("panel-parent-home"),
  "parent-scouting": document.getElementById("panel-parent-scouting"),
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
  templates: document.getElementById("panel-templates"),
  assignments: document.getElementById("panel-assignments"),
  "calendar-manager": document.getElementById("panel-calendar-manager"),
  "completion-tracking": document.getElementById("panel-completion-tracking"),
  "athlete-notes": document.getElementById("panel-athlete-notes"),
  skills: document.getElementById("panel-skills"),
  "journal-monitor": document.getElementById("panel-journal-monitor"),
  messages: document.getElementById("panel-messages"),
  permissions: document.getElementById("panel-permissions"),
  future: document.getElementById("panel-future"),
  "competition-preview": document.getElementById("panel-competition-preview")
};
const COACH_ROUTE_PANELS = {
  "coach-home": ["dashboard", "coach-profile"],
  "coach-athletes": ["athletes", "coach-match", "skills", "journal-monitor", "athlete-notes", "messages"],
  "coach-plans": ["plans", "templates", "media", "assignments", "calendar-manager", "calendar", "completion-tracking"],
  "coach-competition": ["competition-preview"]
};
const COACH_ROUTE_DEFAULT_PANEL = {
  "coach-home": "dashboard",
  "coach-athletes": "athletes",
  "coach-plans": "plans",
  "coach-competition": "competition-preview"
};
const COACH_ROUTE_BY_PANEL = Object.entries(COACH_ROUTE_PANELS).reduce((acc, [route, keys]) => {
  keys.forEach((key) => {
    acc[key] = route;
  });
  return acc;
}, {});

function isCoachRouteContext() {
  return currentView === "coach" || currentView === "admin";
}

function resolveRouteTabRequest(name) {
  if (!isCoachRouteContext()) {
    return { tab: name, focusPanel: "" };
  }
  if (COACH_ROUTE_PANELS[name]) {
    return { tab: name, focusPanel: COACH_ROUTE_DEFAULT_PANEL[name] || "" };
  }
  const route = COACH_ROUTE_BY_PANEL[name];
  if (route) {
    return { tab: route, focusPanel: name };
  }
  return { tab: name, focusPanel: "" };
}

async function showTab(name) {
  const resolved = resolveRouteTabRequest(name);
  const targetBtn = tabBtns.find((btn) => btn.dataset.tab === resolved.tab && !btn.hidden);
  const fallbackTab = tabBtns.find((btn) => !btn.hidden)?.dataset.tab;
  const hasContent = Boolean(COACH_ROUTE_PANELS[resolved.tab] || panels[resolved.tab]);
  const safeTab = targetBtn ? resolved.tab : (hasContent ? resolved.tab : (fallbackTab || resolved.tab));
  const visiblePanels = COACH_ROUTE_PANELS[safeTab] || [safeTab];
  const focusPanel = visiblePanels.includes(resolved.focusPanel)
    ? resolved.focusPanel
    : (COACH_ROUTE_DEFAULT_PANEL[safeTab] || "");

  tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === safeTab));
  Object.entries(panels).forEach(([k, el]) => {
    if (!el) return;
    const orderIndex = visiblePanels.indexOf(k);
    el.style.order = orderIndex >= 0 ? String(orderIndex + 1) : "999";
    el.classList.toggle("hidden", orderIndex === -1);
  });

  if (visiblePanels.includes("plans") && templatePdfBytes && window.PDFLib) {
    await generateFilledPdf({ download: false });
  }

  if (visiblePanels.includes("coach-match") && coachMatchSelect?.value) {
    renderCoachMatchView(coachMatchSelect.value);
  }

  if (visiblePanels.includes("competition-preview")) {
    const selectedAthlete = getAthletesData().find((athlete) => athlete.name === coachMatchSelect?.value) || getAthletesData()[0] || getProfile();
    if (selectedAthlete) {
      renderCompetitionPreview(selectedAthlete);
    }
  }

  if (visiblePanels.includes("calendar-manager")) {
    renderCalendarManager();
  }

  if (visiblePanels.includes("permissions")) {
    maybeRefreshAdminUsers();
  }

  if (visiblePanels.includes("messages")) {
    ensureMessagesSession().catch((err) => {
      console.warn("Failed to open messages tab", err);
      setMessagesStatus(MESSAGES_COPY.loadError, "error");
      renderMessages();
    });
  }

  if (focusPanel && panels[focusPanel]) {
    requestAnimationFrame(() => {
      panels[focusPanel]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function setRoleUI(role, view = "athlete") {
  const roleName = normalizeAuthRole(role);
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
    ? "permissions"
    : view === "parent"
      ? "parent-home"
      : view === "coach" || isCoachRole(roleName)
        ? "coach-home"
        : "today";
  toggleParentViewNotice(view);
  enforceStrictAuthUI();
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

const initialPlanSubtab = subtabButtons.length ? subtabButtons[0].dataset.subtab : null;
if (initialPlanSubtab) {
  showSubtab(initialPlanSubtab);
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
const templateLibraryList = document.getElementById("templateLibraryList");
const templateWorkflowList = document.getElementById("templateWorkflowList");
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
let planRangeSelection = { start: getCurrentAppDate(), end: getCurrentAppDate() };
const initialPlanStart = startOfMonth(getCurrentAppDate());
let planCalendarYear = initialPlanStart.getFullYear();
let planCalendarMonth = initialPlanStart.getMonth();
const PLAN_MONTHS_VISIBLE = 4;
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
const planSourceButtons = Array.from(document.querySelectorAll("[data-plan-source]"));
const planBuildTitle = document.getElementById("planBuildTitle");
const planBuildSubtitle = document.getElementById("planBuildSubtitle");
const planSourceSelectWrapper = document.getElementById("planSourceSelectWrapper");
const planSourceSelectLabel = document.getElementById("planSourceSelectLabel");
const planSourceSelect = document.getElementById("planSourceSelect");
const planSourceSummary = document.getElementById("planSourceSummary");
const planAssignModeButtons = Array.from(document.querySelectorAll("[data-plan-assign-mode]"));
const planAssignTitle = document.getElementById("planAssignTitle");
const planAssignSubtitle = document.getElementById("planAssignSubtitle");
const planAssignGroupWrapper = document.getElementById("planAssignGroupWrapper");
const planAssignGroupLabel = document.getElementById("planAssignGroupLabel");
const planAssignGroup = document.getElementById("planAssignGroup");
const planAssignSelectAll = document.getElementById("planAssignSelectAll");
const planAssignHint = document.getElementById("planAssignHint");
const planAssignAthletes = document.getElementById("planAssignAthletes");
const planAssignSummary = document.getElementById("planAssignSummary");
const planQuickSummary = document.getElementById("planQuickSummary");
const planTitleInput = document.getElementById("planTitleInput");
const planFocusInput = document.getElementById("planFocusInput");
const planNotesInput = document.getElementById("planNotesInput");
const planSaveStatus = document.getElementById("planSaveStatus");
const savePlanBtn = document.getElementById("savePlanBtn");
const savePlanAssignBtn = document.getElementById("savePlanAssignBtn");
let planSourceMode = "scratch";
let planSourceSelection = "";
let planAssignMode = "single";
let planAssignedAthletes = [];
let planAssignedGroup = "varsity";

const PLAN_SOURCE_LIBRARY = {
  scratch: {
    label: { en: "From scratch", es: "Desde cero" },
    summary: {
      en: "Starting from scratch. Build the plan structure directly in this screen.",
      es: "Empiezas desde cero. Construye el plan directamente en esta pantalla."
    },
    selectLabel: { en: "", es: "" },
    options: []
  },
  template: {
    label: { en: "From template", es: "Desde plantilla" },
    summary: {
      en: "Use a reusable template, then edit the plan details here.",
      es: "Usa una plantilla reutilizable y luego ajusta los detalles aqui."
    },
    selectLabel: { en: "Template", es: "Plantilla" },
    options: [
      { value: "daily-tech", label: { en: "Daily technical session", es: "Sesion tecnica diaria" } },
      { value: "high-volume-week", label: { en: "High-volume chain wrestling week", es: "Semana de alto volumen en cadena" } },
      { value: "competition-taper", label: { en: "Competition taper week", es: "Semana de descarga competitiva" } }
    ]
  },
  duplicate: {
    label: { en: "Duplicate previous", es: "Duplicar anterior" },
    summary: {
      en: "Start from a recent plan and adjust dates, volume, or targets.",
      es: "Parte de un plan reciente y ajusta fechas, volumen o destinatarios."
    },
    selectLabel: { en: "Previous plan", es: "Plan anterior" },
    options: [
      { value: "last-daily", label: { en: "Yesterday - Daily mat session", es: "Ayer - Sesion diaria de mat" } },
      { value: "last-weekly", label: { en: "Last week - Competition prep", es: "Semana pasada - Preparacion competitiva" } },
      { value: "last-season", label: { en: "Last season block - Strength phase", es: "Bloque anterior - Fase de fuerza" } }
    ]
  }
};

function getPlanScopeLabel() {
  const scopeCopy = {
    day: { en: "Daily plan", es: "Plan diario" },
    week: { en: "Weekly plan", es: "Plan semanal" },
    month: { en: "Monthly plan", es: "Plan mensual" },
    season: { en: "Season plan", es: "Plan de temporada" }
  };
  return pickCopy(scopeCopy[planRangeType] || scopeCopy.day);
}

function getPlanTargetSummary() {
  if (planAssignMode === "group") {
    const group = getCoachGroupRecords().find((item) => item.id === planAssignedGroup) || getCoachGroupRecords()[0];
    const groupName = group?.name || (currentLang === "es" ? "grupo" : "group");
    return currentLang === "es"
      ? `Asignado a ${groupName}`
      : `Assigned to ${groupName}`;
  }
  if (!planAssignedAthletes.length) {
    return currentLang === "es" ? "Sin destino seleccionado" : "No target selected yet";
  }
  if (planAssignMode === "single") {
    return currentLang === "es"
      ? `Asignado a ${planAssignedAthletes[0]}`
      : `Assigned to ${planAssignedAthletes[0]}`;
  }
  return currentLang === "es"
    ? `Asignado a ${planAssignedAthletes.length} atletas`
    : `Assigned to ${planAssignedAthletes.length} athletes`;
}

function getPlanSourceConfig(mode = planSourceMode) {
  const source = PLAN_SOURCE_LIBRARY[mode] || PLAN_SOURCE_LIBRARY.scratch;
  if (mode === "template") {
    return { ...source, options: getCoachTemplateOptionsForType(planRangeType) };
  }
  if (mode === "duplicate") {
    return { ...source, options: getDuplicatePlanOptionsForType(planRangeType) };
  }
  return { ...source, options: [] };
}

function ensurePlanSourceSelection(mode = planSourceMode) {
  const source = getPlanSourceConfig(mode);
  if (!source.options.length) {
    planSourceSelection = "";
    return;
  }
  if (!source.options.some((option) => option.value === planSourceSelection)) {
    planSourceSelection = source.options[0]?.value || "";
  }
}

function getSelectedPlanSourceRecord() {
  const source = getPlanSourceConfig(planSourceMode);
  return source.options.find((option) => option.value === planSourceSelection)?.record || null;
}

function getPlanAssignGroupOptions() {
  return [
    ...getCoachGroupRecords().map((group) => ({
      value: group.id,
      label: { en: group.name, es: group.name },
      record: group
    })),
    {
      value: "__create_new_group__",
      label: {
        en: "+ Create New Group",
        es: "+ Crear grupo nuevo"
      }
    }
  ];
}

function setPlanSaveStatusMessage(message, { error = false } = {}) {
  if (!planSaveStatus) return;
  planSaveStatus.textContent = message || "";
  planSaveStatus.classList.toggle("error", error);
}

function clearPlanSaveStatus() {
  setPlanSaveStatusMessage("");
}

function updatePlanQuickSummary() {
  if (!planQuickSummary) return;
  const source = PLAN_SOURCE_LIBRARY[planSourceMode];
  const sourceLabel = pickCopy(source?.label || PLAN_SOURCE_LIBRARY.scratch.label);
  planQuickSummary.textContent = `${getPlanScopeLabel()} • ${sourceLabel} • ${getPlanTargetSummary()}`;
  if (planAssignSummary) {
    planAssignSummary.textContent = getPlanTargetSummary();
  }
}

function renderPlanSourceControls() {
  if (planBuildTitle) planBuildTitle.textContent = currentLang === "es" ? "Inicia el plan" : "Start the plan";
  if (planBuildSubtitle) {
    planBuildSubtitle.textContent = currentLang === "es"
      ? "Elige el tipo de plan y si empiezas desde cero, desde plantilla o duplicando uno anterior."
      : "Choose the plan type, then decide whether to start from zero, a template, or a previous plan.";
  }
  planSourceButtons.forEach((btn) => {
    const copy = {
      scratch: { en: "From scratch", es: "Desde cero" },
      template: { en: "From template", es: "Desde plantilla" },
      duplicate: { en: "Duplicate previous", es: "Duplicar anterior" }
    };
    btn.textContent = pickCopy(copy[btn.dataset.planSource] || copy.scratch);
    btn.classList.toggle("active", btn.dataset.planSource === planSourceMode);
  });
  const source = getPlanSourceConfig(planSourceMode);
  ensurePlanSourceSelection(planSourceMode);
  if (planSourceSummary) {
    const selection = source.options.find((item) => item.value === planSourceSelection);
    if (selection) {
      planSourceSummary.textContent = `${pickCopy(source.summary)} ${pickCopy(selection.label)}.`;
    } else if (planSourceMode === "template") {
      planSourceSummary.textContent = pickCopy({
        en: "No templates are available for this plan type yet. You can still build the plan here and save it.",
        es: "Todavia no hay plantillas para este tipo de plan. Aun puedes construir el plan aqui y guardarlo."
      });
    } else if (planSourceMode === "duplicate") {
      planSourceSummary.textContent = pickCopy({
        en: "No previous plans of this type yet. Save one first, then duplicate it here.",
        es: "Todavia no hay planes anteriores de este tipo. Guarda uno primero y luego duplicalo aqui."
      });
    } else {
      planSourceSummary.textContent = pickCopy(source.summary);
    }
  }
  if (!planSourceSelectWrapper || !planSourceSelect || !planSourceSelectLabel) {
    updatePlanQuickSummary();
    return;
  }
  const hasOptions = source.options.length > 0;
  planSourceSelectWrapper.classList.toggle("hidden", !hasOptions);
  if (!hasOptions) {
    updatePlanQuickSummary();
    return;
  }
  planSourceSelectLabel.textContent = pickCopy(source.selectLabel);
  planSourceSelect.innerHTML = "";
  source.options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = pickCopy(option.label);
    planSourceSelect.appendChild(el);
  });
  planSourceSelect.value = planSourceSelection;
  updatePlanQuickSummary();
}

function renderPlanAssignControls() {
  if (planAssignMode === "single" && planAssignedAthletes.length > 1) {
    planAssignedAthletes = planAssignedAthletes.slice(0, 1);
  }
  planAssignModeButtons.forEach((btn) => {
    const copy = {
      single: { en: "Single athlete", es: "Un atleta" },
      multi: { en: "Multiple athletes", es: "Varios atletas" },
      group: { en: "Group", es: "Grupo" }
    };
    btn.textContent = pickCopy(copy[btn.dataset.planAssignMode] || copy.single);
    btn.classList.toggle("active", btn.dataset.planAssignMode === planAssignMode);
  });
  if (planAssignTitle) planAssignTitle.textContent = currentLang === "es" ? "Asigna este plan" : "Assign this plan";
  if (planAssignSubtitle) {
    planAssignSubtitle.textContent = currentLang === "es"
      ? "Envialo a un atleta, varios atletas o un grupo completo sin salir de Create Plan."
      : "Send it to one athlete, several athletes, or a full group without leaving Create Plan.";
  }
  if (planAssignGroupLabel) {
    planAssignGroupLabel.textContent = currentLang === "es" ? "Grupo" : "Group";
  }
  if (planAssignSelectAll) {
    planAssignSelectAll.hidden = planAssignMode !== "multi";
    planAssignSelectAll.textContent = currentLang === "es" ? "Seleccionar equipo completo" : "Select full team";
  }
  if (planAssignHint) {
    const hintMap = {
      single: { en: "Pick one athlete.", es: "Elige un atleta." },
      multi: { en: "Pick several athletes.", es: "Elige varios atletas." },
      group: { en: "Pick a full group.", es: "Elige un grupo completo." }
    };
    planAssignHint.textContent = pickCopy(hintMap[planAssignMode] || hintMap.single);
  }
  if (planAssignGroupWrapper && planAssignGroup) {
    planAssignGroupWrapper.classList.toggle("hidden", planAssignMode !== "group");
    planAssignGroup.innerHTML = "";
    const options = getPlanAssignGroupOptions();
    options.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.value;
      option.textContent = pickCopy(group.label);
      planAssignGroup.appendChild(option);
    });
    if (!options.some((group) => group.value === planAssignedGroup)) {
      planAssignedGroup = options[0]?.value || "varsity";
    }
    planAssignGroup.value = planAssignedGroup;
  }
  if (planAssignAthletes) {
    planAssignAthletes.classList.toggle("hidden", planAssignMode === "group");
    planAssignAthletes.innerHTML = "";
    getAthletesData().forEach((athlete) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `plan-athlete-option${planAssignedAthletes.includes(athlete.name) ? " active" : ""}`;
      btn.innerHTML = `<strong>${athlete.name}</strong><span>${athlete.weight} - ${athlete.style}</span>`;
      btn.addEventListener("click", () => {
        if (planAssignMode === "single") {
          planAssignedAthletes = [athlete.name];
        } else if (planAssignMode === "multi") {
          if (planAssignedAthletes.includes(athlete.name)) {
            planAssignedAthletes = planAssignedAthletes.filter((name) => name !== athlete.name);
          } else {
            planAssignedAthletes = [...planAssignedAthletes, athlete.name];
          }
        }
        renderPlanAssignControls();
      });
      planAssignAthletes.appendChild(btn);
    });
  }
  updatePlanQuickSummary();
}

function formatPlanDateLabel(dateKey) {
  const key = normalizeDateKey(dateKey);
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  return dateFromKey(key).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatPlanRangeLabel(range) {
  if (!range?.startKey) return "";
  if (!range.endKey || range.endKey === range.startKey) {
    return formatPlanDateLabel(range.startKey);
  }
  return `${formatPlanDateLabel(range.startKey)} - ${formatPlanDateLabel(range.endKey)}`;
}

function populateSeasonYearSelect() {
  if (!seasonYearSelect || seasonYearSelect.options.length) return;
  const currentYear = getCurrentAppDate().getFullYear();
  for (let year = currentYear - 1; year <= currentYear + 3; year += 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    seasonYearSelect.appendChild(option);
  }
  seasonYearSelect.value = String(currentYear);
}

function clearDailyPlanSelections() {
  selectionBlocks.forEach((block) => {
    const chosen = block.querySelector(".chosen-list");
    if (chosen) chosen.innerHTML = "";
  });
}

function applyDailyPlanSelections(items = {}) {
  clearDailyPlanSelections();
  selectionBlocks.forEach((block) => {
    const key = block.dataset.block;
    const chosen = block.querySelector(".chosen-list");
    if (!chosen) return;
    (items[key] || []).forEach((value) => addChosenItem(chosen, value));
  });
}

function setPlanEditorRange(range = {}) {
  const startKey = normalizeDateKey(range.startKey || getCurrentAppDateKey());
  const endKey = normalizeDateKey(range.endKey || startKey);
  planRangeSelection.start = dateFromKey(startKey);
  planRangeSelection.end = dateFromKey(planRangeType === "day" ? startKey : endKey);
  updateRangeInputsFromSelection();
}

function resetCoachPlanEditor() {
  currentEditingCoachPlanId = "";
  if (planTitleInput) planTitleInput.value = defaultPlanTitle(planRangeType);
  if (planFocusInput) planFocusInput.value = "";
  if (planNotesInput) planNotesInput.value = "";
  if (planMonthlyNotes) planMonthlyNotes.value = "";
  populateSeasonYearSelect();
  if (seasonYearSelect) seasonYearSelect.value = String(getCurrentAppDate().getFullYear());
  clearDailyPlanSelections();
  clearPlanSaveStatus();
  updatePlanQuickSummary();
}

function applyCoachPlanRecordToEditor(record, { clearEditingId = true } = {}) {
  if (!record) return;
  if (clearEditingId) currentEditingCoachPlanId = "";
  if (planTitleInput) planTitleInput.value = record.title || defaultPlanTitle(planRangeType);
  if (planFocusInput) planFocusInput.value = record.focus || "";
  if (planNotesInput) planNotesInput.value = record.coachNotes || "";
  if (planMonthlyNotes) planMonthlyNotes.value = record.monthlyNotes || "";
  populateSeasonYearSelect();
  if (seasonYearSelect) {
    seasonYearSelect.value = String(record.seasonYear || seasonYearSelect.value || getCurrentAppDate().getFullYear());
  }
  applyDailyPlanSelections(record.items || {});
  if (record.range?.startKey) {
    setPlanEditorRange(record.range);
  }
  if (record.audience?.mode) {
    planAssignMode = record.audience.mode;
    planAssignedAthletes = [...(record.audience.athleteNames || [])];
    planAssignedGroup = record.audience.groupId || planAssignedGroup;
    renderPlanAssignControls();
  }
  clearPlanSaveStatus();
}

function applySelectedPlanSource() {
  const record = getSelectedPlanSourceRecord();
  if (!record) {
    if (planSourceMode === "scratch") {
      resetCoachPlanEditor();
    }
    return;
  }
  applyCoachPlanRecordToEditor(record);
}

function buildCurrentPlanRange() {
  const startKey = normalizeDateKey(planRangeStartInput?.value || toDateKey(planRangeSelection.start));
  const rawEndKey = planRangeEndInput?.value || toDateKey(planRangeSelection.end || planRangeSelection.start);
  const endKey = normalizeDateKey(planRangeType === "day" ? startKey : rawEndKey);
  if (planRangeType !== "day" && !planRangeEndInput?.value && (!planRangeSelection.end || endKey === startKey)) {
    return null;
  }
  return { startKey, endKey };
}

function getPlanSourceDescriptor() {
  if (planSourceMode === "scratch") {
    return {
      sourceMode: "scratch",
      sourceRefId: "",
      sourceLabel: pickCopy(PLAN_SOURCE_LIBRARY.scratch.label)
    };
  }
  const source = getPlanSourceConfig(planSourceMode);
  const selection = source.options.find((option) => option.value === planSourceSelection);
  return {
    sourceMode: planSourceMode,
    sourceRefId: selection?.record?.id || planSourceSelection,
    sourceLabel: selection ? pickCopy(selection.label) : pickCopy(source.label)
  };
}

function getCurrentPlanAudience() {
  if (planAssignMode === "group") {
    const group = getCoachGroupRecords().find((item) => item.id === planAssignedGroup) || null;
    return {
      mode: "group",
      athleteNames: [],
      groupId: group?.id || "",
      groupName: group?.name || ""
    };
  }
  return {
    mode: planAssignMode,
    athleteNames: uniqueNames(planAssignedAthletes),
    groupId: "",
    groupName: ""
  };
}

function buildCoachPlanDraft() {
  const range = buildCurrentPlanRange();
  if (!range) {
    return {
      error: pickCopy({
        en: "Choose a start and end date for this plan.",
        es: "Elige una fecha de inicio y una fecha final para este plan."
      })
    };
  }

  const sourceDescriptor = getPlanSourceDescriptor();
  const title = String(planTitleInput?.value || "").trim() || defaultPlanTitle(planRangeType);
  const sourceRecord = getSelectedPlanSourceRecord();

  return normalizeCoachPlanRecord(currentEditingCoachPlanId || slugifyKey(`${title}-${range.startKey}`), {
    title,
    type: planRangeType,
    focus: String(planFocusInput?.value || "").trim(),
    coachNotes: String(planNotesInput?.value || "").trim(),
    sourceMode: sourceDescriptor.sourceMode,
    sourceRefId: sourceDescriptor.sourceRefId,
    sourceLabel: sourceDescriptor.sourceLabel,
    range,
    items: normalizePlanItems(collectDailySelections()),
    monthlyNotes: String(planMonthlyNotes?.value || "").trim() || String(sourceRecord?.monthlyNotes || "").trim(),
    seasonYear: String(seasonYearSelect?.value || "").trim(),
    audience: getCurrentPlanAudience(),
    createdBy: String(getProfile()?.name || getAuthUser()?.email || "").trim(),
    updatedBy: String(getProfile()?.name || getAuthUser()?.email || "").trim()
  });
}

function getPlanAssignmentTypeLabel(type) {
  const copy = {
    day: { en: "Daily Plan", es: "Plan diario" },
    week: { en: "Weekly Plan", es: "Plan semanal" },
    month: { en: "Monthly Plan", es: "Plan mensual" },
    season: { en: "Season Plan", es: "Plan de temporada" }
  };
  return pickCopy(copy[normalizePlanType(type)] || copy.day);
}

function getAssignmentTargetsFromPlan(plan) {
  if (!plan?.audience) return [];
  if (plan.audience.mode === "group") {
    const group = getCoachGroupRecords().find((item) => item.id === plan.audience.groupId) || null;
    if (!group) return [];
    return [{
      assigneeType: "group",
      assigneeId: group.id,
      assigneeName: group.name,
      assigneeNames: [...group.memberNames]
    }];
  }
  return uniqueNames(plan.audience.athleteNames).map((name) => ({
    assigneeType: "athlete",
    assigneeId: slugifyKey(name),
    assigneeName: name,
    assigneeNames: [name]
  }));
}

async function replaceAssignmentsForPlan(plan) {
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments");
  if (!assignmentsRef || !plan?.id) return 0;
  const targets = getAssignmentTargetsFromPlan(plan);
  if (!targets.length) {
    throw new Error("plan_assignment_target_required");
  }

  const existingSnap = await withTimeout(
    assignmentsRef.where("planId", "==", plan.id).get(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_assignments_fetch_timeout"
  );

  const batch = firebaseFirestoreInstance.batch();
  existingSnap.forEach((doc) => batch.delete(doc.ref));
  const timestamp = getFirestoreServerTimestamp();
  const dueDateKey = plan.range?.endKey || plan.range?.startKey || getCurrentAppDateKey();
  const dueLabel = formatPlanDateLabel(dueDateKey);

  targets.forEach((target) => {
    const ref = assignmentsRef.doc();
    batch.set(ref, stripUndefinedDeep({
      title: plan.title,
      assigneeType: target.assigneeType,
      assigneeId: target.assigneeId,
      assigneeName: target.assigneeName,
      assigneeNames: target.assigneeNames,
      type: getPlanAssignmentTypeLabel(plan.type),
      dueDateKey,
      dueLabel,
      status: "not_started",
      note: plan.focus || plan.coachNotes || "",
      source: plan.sourceLabel || getPlanScopeLabel(),
      planId: plan.id,
      planType: plan.type,
      notificationStatus: "pending",
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  });

  await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_assignments_write_timeout");
  return targets.length;
}

async function saveCoachPlan({ createAssignments = false, navigateAfterSave = false } = {}) {
  if (coachPlanSyncState.saving) return;
  if (!isCoachWorkspaceActive()) {
    setPlanSaveStatusMessage(pickCopy({
      en: "Coach workspace is not available for this account.",
      es: "El espacio del coach no esta disponible para esta cuenta."
    }), { error: true });
    return;
  }

  const draft = buildCoachPlanDraft();
  if (draft.error) {
    setPlanSaveStatusMessage(draft.error, { error: true });
    return;
  }

  if (createAssignments && getAssignmentTargetsFromPlan(draft).length === 0) {
    setPlanSaveStatusMessage(pickCopy({
      en: "Choose an athlete or group before sending assignments.",
      es: "Elige un atleta o grupo antes de enviar asignaciones."
    }), { error: true });
    return;
  }

  const plansRef = getCoachWorkspaceCollectionRef("plans");
  if (!plansRef) {
    setPlanSaveStatusMessage(pickCopy({
      en: "Plan storage is not configured.",
      es: "El almacenamiento de planes no esta configurado."
    }), { error: true });
    return;
  }

  coachPlanSyncState.saving = true;
  setPlanSaveStatusMessage(pickCopy({
    en: "Saving plan...",
    es: "Guardando plan..."
  }));

  try {
    const planRef = currentEditingCoachPlanId ? plansRef.doc(currentEditingCoachPlanId) : plansRef.doc();
    const timestamp = getFirestoreServerTimestamp();
    await withTimeout(
      planRef.set(stripUndefinedDeep({
        ...draft,
        id: undefined,
        createdAt: currentEditingCoachPlanId ? undefined : timestamp,
        updatedAt: timestamp
      }), { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_plan_write_timeout"
    );

    currentEditingCoachPlanId = planRef.id;
    coachPlanSyncState.lastSavedId = planRef.id;
    coachPlanSyncState.lastSavedType = draft.type;

    let assignmentCount = 0;
    if (createAssignments) {
      assignmentCount = await replaceAssignmentsForPlan({ ...draft, id: planRef.id });
    }

    localStorage.setItem("wpl_daily_plan", JSON.stringify(draft.items));

    const successMessage = createAssignments
      ? pickCopy({
          en: `Plan saved and ${assignmentCount} assignment${assignmentCount === 1 ? "" : "s"} sent.`,
          es: `Plan guardado y ${assignmentCount} asignacion${assignmentCount === 1 ? "" : "es"} enviada${assignmentCount === 1 ? "" : "s"}.`
        })
      : pickCopy({
          en: `Plan saved for ${formatPlanRangeLabel(draft.range)}.`,
          es: `Plan guardado para ${formatPlanRangeLabel(draft.range)}.`
        });
    setPlanSaveStatusMessage(successMessage);
    toast(successMessage);
    if (navigateAfterSave) {
      showTab("coach-home");
    }
  } catch (err) {
    console.warn("Failed to save coach plan", err);
    setPlanSaveStatusMessage(pickCopy({
      en: "Could not save the plan. Check Firebase and try again.",
      es: "No se pudo guardar el plan. Revisa Firebase y vuelve a intentarlo."
    }), { error: true });
  } finally {
    coachPlanSyncState.saving = false;
  }
}

async function createNewCoachGroup() {
  const namePrompt = pickCopy({
    en: "New group name",
    es: "Nombre del nuevo grupo"
  });
  const name = window.prompt(namePrompt, "");
  if (name == null) return null;
  const cleanName = String(name || "").trim();
  if (!cleanName) return null;

  const membersPrompt = pickCopy({
    en: "Optional athlete names separated by commas",
    es: "Nombres de atletas opcionales separados por comas"
  });
  const membersRaw = window.prompt(membersPrompt, planAssignedAthletes.join(", "));
  const memberNames = uniqueNames(String(membersRaw || "").split(",").map((item) => item.trim()).filter(Boolean));
  const id = slugifyKey(cleanName);
  const payload = {
    name: cleanName,
    memberNames,
    system: false,
    updatedAt: getFirestoreServerTimestamp(),
    createdAt: getFirestoreServerTimestamp()
  };

  const groupsRef = getCoachWorkspaceCollectionRef("groups");
  if (groupsRef) {
    await withTimeout(
      groupsRef.doc(id).set(stripUndefinedDeep(payload), { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_group_write_timeout"
    );
  } else {
    coachGroupsCache = coachWorkspaceSortByUpdated([
      normalizeCoachGroupRecord(id, { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      ...coachGroupsCache
    ]);
  }

  return id;
}

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
    if (!planCalendarLabel) return;
    const monthNames = getMonthNames();
    const startDate = new Date(planCalendarYear, planCalendarMonth, 1);
    const endDate = new Date(planCalendarYear, planCalendarMonth + PLAN_MONTHS_VISIBLE - 1, 1);
    const startLabel = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
    const endLabel = `${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    planCalendarLabel.textContent = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
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
    const todayKey = getCurrentAppDateKey();
    const dayNamesRow = `<div class="calendar-grid-days">${daysOfWeek.map((day) => `<div class="calendar-day-name">${day}</div>`).join("")}</div>`;

    const buildMonthPanel = (panelYear, panelMonth) => {
        const firstDay = new Date(panelYear, panelMonth, 1);
        const numDays = new Date(panelYear, panelMonth + 1, 0).getDate();
        const startDayOfWeek = firstDay.getDay();
        let html = `<div class="plan-month-panel"><div class="plan-month-panel-label">${monthNames[panelMonth]} ${panelYear}</div>`;
        html += dayNamesRow;
        html += '<div class="plan-month-grid">';
        for (let i = 0; i < startDayOfWeek; i += 1) {
            html += '<span class="calendar-day empty"></span>';
        }
        for (let day = 1; day <= numDays; day += 1) {
            const date = new Date(panelYear, panelMonth, day);
            const key = toDateKey(date);
            const todayClass = key === todayKey ? " today" : "";
            html += `<button type="button" class="calendar-day${todayClass}" data-date="${key}">${day}</button>`;
        }
        html += '</div></div>';
        return html;
    };

    const multiMonthHtml = Array.from({ length: PLAN_MONTHS_VISIBLE }, (_, idx) => {
        const panelDate = new Date(year, month + idx, 1);
        return buildMonthPanel(panelDate.getFullYear(), panelDate.getMonth());
    }).join("");

    containers.forEach((container) => {
        container.innerHTML = `<div class="plan-multi-months">${multiMonthHtml}</div>`;
        container.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => handlePlanDayClick(dayEl));
        });
    });

    updateCalendarLabels();
    highlightPlanRange();
}

function initializePlanSelectors() {
    if (!document.getElementById('panel-plans')) return;
    const today = getCurrentAppDate();
    populateSeasonYearSelect();
    renderPlanCalendar(today.getFullYear(), today.getMonth());
    if (planTitleInput && !planTitleInput.value.trim()) {
      planTitleInput.value = defaultPlanTitle(planRangeType);
    }
    updateRangeInputsFromSelection();
    renderPlanSourceControls();
    renderPlanAssignControls();
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
            const isoDate = dayEl.dataset.date;
            if (!isoDate) {
                dayEl.classList.remove("range-start", "range-end", "range-between");
                return;
            }
            const date = dateFromKey(isoDate);
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
    const dateKey = dayEl.dataset.date;
    if (!dateKey) return;
    const clicked = dateFromKey(dateKey);
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
  if (planSourceMode === "scratch" && planTitleInput && !currentEditingCoachPlanId) {
    planTitleInput.value = defaultPlanTitle(planRangeType);
  }
  renderPlanSourceControls();
  if (planSourceMode !== "scratch") {
    applySelectedPlanSource();
  }
  updatePlanQuickSummary();
}

if (initialPlanSubtab) {
    updatePlanRangeType(initialPlanSubtab);
}

if (planRangeStartInput) {
    planRangeStartInput.addEventListener("change", () => updateSelectionFromInputs());
}
if (planRangeEndInput) {
  planRangeEndInput.addEventListener("change", () => updateSelectionFromInputs());
}

planSourceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextMode = btn.dataset.planSource || "scratch";
    planSourceMode = nextMode;
    ensurePlanSourceSelection(nextMode);
    if (nextMode === "scratch") {
      resetCoachPlanEditor();
    } else {
      applySelectedPlanSource();
    }
    renderPlanSourceControls();
  });
});

if (planSourceSelect) {
  planSourceSelect.addEventListener("change", () => {
    planSourceSelection = planSourceSelect.value;
    applySelectedPlanSource();
    renderPlanSourceControls();
  });
}

planAssignModeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    planAssignMode = btn.dataset.planAssignMode || "single";
    if (planAssignMode === "single" && planAssignedAthletes.length > 1) {
      planAssignedAthletes = planAssignedAthletes.slice(0, 1);
    }
    renderPlanAssignControls();
  });
});

if (planAssignGroup) {
  planAssignGroup.addEventListener("change", async () => {
    const selectedValue = planAssignGroup.value;
    if (selectedValue === "__create_new_group__") {
      const previous = planAssignedGroup;
      try {
        const newGroupId = await createNewCoachGroup();
        planAssignedGroup = newGroupId || previous;
      } catch (err) {
        console.warn("Failed to create group", err);
        toast(pickCopy({
          en: "Could not create group.",
          es: "No se pudo crear el grupo."
        }));
        planAssignedGroup = previous;
      }
      renderPlanAssignControls();
      return;
    }
    planAssignedGroup = selectedValue;
    clearPlanSaveStatus();
    updatePlanQuickSummary();
  });
}

if (planAssignSelectAll) {
  planAssignSelectAll.addEventListener("click", () => {
    planAssignMode = "multi";
    planAssignedAthletes = getAthletesData().map((athlete) => athlete.name);
    renderPlanAssignControls();
  });
}

[planTitleInput, planFocusInput, planNotesInput, planMonthlyNotes, seasonYearSelect].forEach((input) => {
  if (!input) return;
  input.addEventListener("input", () => clearPlanSaveStatus());
  input.addEventListener("change", () => clearPlanSaveStatus());
});

if (savePlanBtn) {
  savePlanBtn.addEventListener("click", async () => {
    await saveCoachPlan({ createAssignments: false });
  });
}

if (savePlanAssignBtn) {
  savePlanAssignBtn.addEventListener("click", async () => {
    await saveCoachPlan({ createAssignments: true });
  });
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
  if (!profile || !isCoachRole(profile.role)) return "coach";
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

function renderTemplatesPanel() {
  if (templateLibraryList) {
    const templates = coachTemplatesCache.length
      ? coachWorkspaceSortByUpdated(coachTemplatesCache)
      : getBuiltinCoachTemplateSeeds();
    templateLibraryList.innerHTML = templates.slice(0, 7).map((template) => {
      const typeLabel = getPlanAssignmentTypeLabel(template.type);
      const detail = template.focus || template.monthlyNotes || "";
      return `<li><strong>${template.name}</strong> - ${typeLabel}${detail ? ` - ${detail}` : ""}</li>`;
    }).join("");
  }

  if (templateWorkflowList) {
    const workflowItems = [
      pickCopy({
        en: "Start from a built-in wrestling template, then edit scope, dates, and audience in Create Plan.",
        es: "Empieza desde una plantilla base de wrestling y luego ajusta alcance, fechas y audiencia en Create Plan."
      }),
      pickCopy({
        en: "Duplicate the last plan of the same type when you want continuity instead of a blank draft.",
        es: "Duplica el ultimo plan del mismo tipo cuando quieras continuidad en vez de empezar en blanco."
      }),
      pickCopy({
        en: `Assign templates directly to ${getCoachGroupRecords()[0]?.name || "Varsity"} or to selected athletes without leaving the route.`,
        es: `Asigna plantillas directamente a ${getCoachGroupRecords()[0]?.name || "Varsity"} o a atletas seleccionados sin salir de la ruta.`
      }),
      pickCopy({
        en: "Use the PDF tools only when staff needs a printable version for practice or travel.",
        es: "Usa las herramientas PDF solo cuando el staff necesite una version imprimible para practica o viaje."
      })
    ];
    templateWorkflowList.innerHTML = workflowItems.map((item) => `<li>${item}</li>`).join("");
  }
}

if (saveDailyPlan) {
  saveDailyPlan.addEventListener("click", async () => {
    localStorage.setItem("wpl_daily_plan", JSON.stringify(collectDailySelections()));
    await saveCoachPlan({ createAssignments: false });
  });
}

if (doneDailyPlan) {
  doneDailyPlan.addEventListener("click", async () => {
    localStorage.setItem("wpl_daily_plan", JSON.stringify(collectDailySelections()));
    if (templatePdfBytes && window.PDFLib) {
      await generateFilledPdf({ download: false });
    }
    await saveCoachPlan({ createAssignments: false, navigateAfterSave: true });
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

if (templatesBtn) {
  templatesBtn.addEventListener("click", () => {
    showTab("templates");
    if (templateConfirm && templateFile?.disabled) {
      templateConfirm.classList.remove("hidden");
    }
  });
}

if (templateGoBtn) {
  templateGoBtn.addEventListener("click", () => {
    if (templateConfirm) templateConfirm.classList.add("hidden");
    if (templateFile) templateFile.click();
  });
}

if (templateNoBtn) {
  templateNoBtn.addEventListener("click", () => {
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
athleteProfileForm = document.getElementById("athleteProfileForm");
const previewProfileBtn = document.getElementById("previewProfileBtn");
const backToProfileBtn = document.getElementById("backToProfileBtn");
competitionPreview = document.getElementById("competitionPreview");
const openCoachMatchBtn = document.getElementById("openCoachMatchBtn");
const openCompetitionPreviewBtn = document.getElementById("openCompetitionPreviewBtn");
const coachQuickPreview = document.getElementById("coachQuickPreview");

const profileSubtabButtons = Array.from(document.querySelectorAll(".profile-subtab"));
const profileSubpanels = Array.from(document.querySelectorAll(".profile-subpanel"));
let currentProfileSubtab = "training";

const aName = document.getElementById("aName");
const aRole = document.getElementById("aRole");
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
    role: normalizeAuthRole(aRole?.value || existing.role),
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
  if (aRole) aRole.value = normalizeAuthRole(profile.role);
  aPhoto.value = profile.photo || "";
  aCountry.value = profile.country || "";
  aCity.value = profile.city || "";
  if (aSchoolClub) aSchoolClub.value = profile.schoolClub || "no";
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
  if (aNeutralOther) aNeutralOther.value = profile.techniques?.neutralOther || "";
  if (aTopOther) aTopOther.value = profile.techniques?.topOther || "";
  if (aBottomOther) aBottomOther.value = profile.techniques?.bottomOther || "";
  if (aDefenseOther) aDefenseOther.value = profile.techniques?.defenseOther || "";
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
  const latestPlan = profile.name ? getLatestCoachPlanForAthlete(profile.name) : null;
  const liveAssignments = profile.name ? getPlanAssignmentsForAthlete(profile.name) : [];
  const latestJournal = profile.name ? getLatestCoachJournalRecord(profile.name) : null;
  const latestNotes = profile.name ? getCoachNoteRecord(profile.name) : null;
  const latestAnalysis = profile.name ? getLatestCoachMatchAnalysisForAthlete(profile.name) : null;
  const cornerPlan = getAthleteCornerPlan(getRawAthleteRecord(profile.name) || profile);
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
      title: currentLang === "es" ? "Resumen de torneo" : "Tournament Snapshot",
      lines: [
        `${currentLang === "es" ? "Plan activo" : "Active plan"}: ${latestPlan?.title || na}`,
        `${currentLang === "es" ? "Siguiente tarea" : "Next assignment"}: ${liveAssignments[0]?.title || na}`,
        `${currentLang === "es" ? "Competition cue" : "Competition cue"}: ${cornerPlan?.competitionCue || profile.coachSignal || na}`,
        `${currentLang === "es" ? "Advertencia principal" : "Primary warning"}: ${cornerPlan?.safetyWarnings?.[0] || profile.injuryNotes || none}`,
        `${currentLang === "es" ? "Journal" : "Journal"}: ${latestJournal?.entryDate ? `${formatPlanDateLabel(latestJournal.entryDate)} - ${latestJournal.energy || na}` : na}`
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
        `Tags: ${tags}`,
        `${currentLang === "es" ? "Focus actual" : "Current focus"}: ${(latestNotes?.nextFocus || []).slice(0, 2).join(" | ") || na}`,
        `${currentLang === "es" ? "Ultimo match analysis" : "Latest match analysis"}: ${latestAnalysis?.summary || na}`
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
    const nextRole = normalizeAuthRole(updated.role || existing.role);
    updated.role = nextRole;
    updated.view = resolveViewForRole(nextRole, updated.view);
    const authUser = getAuthUser();
    if (authUser && normalizeAuthRole(authUser.role) !== nextRole) {
      setAuthUser({ ...authUser, role: nextRole });
    }
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
    if (isCoachRole(role)) {
      openAthleteSummaryView(draft.name);
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

function toast(msg) {
  dailyStatus.textContent = msg;
  setTimeout(() => (dailyStatus.textContent = ""), 1600);
}

function renderToday(dayIndex = getCurrentAppDayIndex()) {
  const weekPlan = getWeekPlanData();
  const plan = weekPlan[dayIndex];
  if (!plan) return;

  todayTitle.textContent = plan.focus;
  const totalLabel = currentLang === "es" ? "Tiempo total" : "Total time";
  const intensityLabel = currentLang === "es" ? "Intensidad" : "Intensity";
  const intensity = getIntensityLabel(plan.intensity);
  todaySubtitle.textContent = `${totalLabel}: ${plan.total} - ${intensityLabel}: ${intensity}`;
  todayType.textContent = plan.focus;
  if (!isCoachRole(getProfile()?.role)) {
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
  const plan = getWeekPlanData()[getCurrentAppDayIndex()];
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

function renderPlanGrid(selectedDay = getCurrentAppDayIndex()) {
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

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateFromKey(key) {
  if (!isDateKey(key)) return new Date();
  const [year, month, day] = key.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function normalizeDateKey(value) {
  if (isDateKey(value)) return value;
  return getCurrentAppDateKey();
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
  if (isCoachWorkspaceActive()) {
    if (coachCalendarSyncTimeout) clearTimeout(coachCalendarSyncTimeout);
    coachCalendarSyncTimeout = setTimeout(async () => {
      const calendarRef = getCoachWorkspaceCollectionRef("calendar_entries");
      if (!calendarRef) return;
      try {
        if (normalized.items.length) {
          await withTimeout(
            calendarRef.doc(key).set(stripUndefinedDeep({
              ...normalized,
              dateKey: key,
              updatedAt: getFirestoreServerTimestamp()
            }), { merge: true }),
            FIREBASE_OP_TIMEOUT_MS,
            "firestore_calendar_write_timeout"
          );
        } else {
          await withTimeout(
            calendarRef.doc(key).delete(),
            FIREBASE_OP_TIMEOUT_MS,
            "firestore_calendar_delete_timeout"
          );
        }
      } catch (err) {
        console.warn("Failed to sync calendar entry", err);
      }
    }, 250);
  }
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
  if (!profile || isCoachRole(profile.role)) return true;
  if (entry.audience.all) return true;
  if (!entry.audience.athletes.length) return true;
  return nameListIncludes(entry.audience.athletes, profile.name);
}

function getVisibleItemsForDate(dateKey, profile = getProfile()) {
  const entry = getCalendarEntry(dateKey);
  return isEntryAssignedToProfile(entry, profile) ? entry.items : [];
}

function getAudienceText(entry, profile) {
  const isCoach = isCoachRole(profile?.role);
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

function ensureCalendarViewIncludesDate(date) {
  if (!date) return;
  const startIndex = calendarViewDate.getFullYear() * 12 + calendarViewDate.getMonth();
  const selectedIndex = date.getFullYear() * 12 + date.getMonth();
  if (selectedIndex < startIndex) {
    calendarViewDate = startOfMonth(date);
    return;
  }
  const endIndex = startIndex + MONTHS_VISIBLE - 1;
  if (selectedIndex > endIndex) {
    calendarViewDate = startOfMonth(new Date(date.getFullYear(), date.getMonth() - (MONTHS_VISIBLE - 1), 1));
  }
}

function shiftCalendarMonth(delta) {
  const next = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() + delta * MONTHS_VISIBLE,
    1
  );
  calendarViewDate = startOfMonth(next);
  calendarSelectedKey = toDateKey(calendarViewDate);
  renderCalendar(calendarSelectedKey, { alignToSelection: false });
  if (calendarManagerDate) {
    calendarManagerDate.value = calendarSelectedKey;
    renderCalendarManager();
  }
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

function renderCalendar(selectedKey, options = {}) {
  if (!calendarGrid || !calendarMonthLabel) return;
  bindCalendarNav();

  const fallbackKey = calendarSelectedKey || getCurrentAppDateKey();
  const resolvedKey = selectedKey ?? fallbackKey;
  calendarSelectedKey = normalizeDateKey(resolvedKey);
  const selectedDate = dateFromKey(calendarSelectedKey);
  const { alignToSelection = true } = options;
  if (alignToSelection) {
    ensureCalendarViewIncludesDate(selectedDate);
  }
  calendarViewDate = startOfMonth(calendarViewDate);

  if (calendarTitle) calendarTitle.textContent = pickCopy(CALENDAR_COPY.title);
  if (calendarChip) calendarChip.textContent = pickCopy(CALENDAR_COPY.chip);

  const monthNames = getMonthNames();
  const dayNames = getDayAbbr();
  const todayKey = getCurrentAppDateKey();
  const profile = getProfile();

  const rangeStart = calendarViewDate;
  const rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + MONTHS_VISIBLE - 1, 1);
  const startLabel = `${monthNames[rangeStart.getMonth()]} ${rangeStart.getFullYear()}`;
  const endLabel = `${monthNames[rangeEnd.getMonth()]} ${rangeEnd.getFullYear()}`;
  calendarMonthLabel.textContent = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  calendarGrid.innerHTML = "";
  const dayNamesMarkup = dayNames.map((day) => `<div class="month-day-name">${day}</div>`).join("");

  for (let offset = 0; offset < MONTHS_VISIBLE; offset += 1) {
    const panelDate = startOfMonth(new Date(rangeStart.getFullYear(), rangeStart.getMonth() + offset, 1));
    const panelYear = panelDate.getFullYear();
    const panelMonth = panelDate.getMonth();
    const firstDay = new Date(panelYear, panelMonth, 1);
    const startDayOfWeek = firstDay.getDay();
    const numDays = new Date(panelYear, panelMonth + 1, 0).getDate();

    const panel = document.createElement("div");
    panel.className = "multi-month-panel";

    const header = document.createElement("div");
    header.className = "multi-month-panel-header";
    header.textContent = `${monthNames[panelMonth]} ${panelYear}`;

    const dayRow = document.createElement("div");
    dayRow.className = "month-day-names";
    dayRow.innerHTML = dayNamesMarkup;

    const grid = document.createElement("div");
    grid.className = "month-grid";

    for (let i = 0; i < startDayOfWeek; i += 1) {
      const empty = document.createElement("div");
      empty.className = "month-cell empty";
      grid.appendChild(empty);
    }

    for (let day = 1; day <= numDays; day += 1) {
      const date = new Date(panelYear, panelMonth, day);
      const key = toDateKey(date);
      const visibleCount = getVisibleItemsForDate(key, profile).length;
      const cell = document.createElement("button");
      cell.type = "button";
      const isToday = key === todayKey;
      const isSelected = key === calendarSelectedKey;
      const hasItems = visibleCount > 0;
      cell.className = `month-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}${hasItems ? " has-items" : ""}`;
      cell.dataset.key = key;
      cell.innerHTML = `
        <div class="month-day-top">
          <div class="month-day-number">${day}</div>
          ${visibleCount ? `<div class="month-count">${visibleCount}</div>` : '<div class="month-dot" aria-hidden="true"></div>'}
        </div>
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
      grid.appendChild(cell);
    }

    panel.appendChild(header);
    panel.appendChild(dayRow);
    panel.appendChild(grid);
    calendarGrid.appendChild(panel);
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
    } else if (isCoachRole(profile?.role)) {
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
  if (!isCoachRole(profile?.role)) return;
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
  if (!isCoachRole(profile?.role)) return;
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
  const isCoach = isCoachRole(profile?.role);
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
    en: "Calendar",
    es: "Calendario",
    uz: "Taqvim boshqaruvi",
    ru: "Управление календарём"
  },
  chip: {
    en: "Schedule plans + assignments",
    es: "Programa planes y asignaciones",
    uz: "Tadbirlar va eslatmalar yarating",
    ru: "Создайте события и напоминания"
  },
  formTitle: {
    en: "Schedule Item",
    es: "Programar elemento",
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
    en: "Item",
    es: "Elemento",
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
    en: "Add to calendar",
    es: "Agregar al calendario",
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
    en: "Scheduled on this date",
    es: "Programado en esta fecha",
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
    en: "Scheduling Actions",
    es: "Acciones de programacion",
    uz: "Murabbiy harakatlari",
    ru: "Действия тренера"
  },
  typesTitle: {
    en: "Schedule Types",
    es: "Tipos de programacion",
    uz: "Tadbir turlari",
    ru: "Типы событий"
  },
  detailsTitle: {
    en: "What to Attach",
    es: "Que adjuntar",
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
    en: "Team practice or assignment",
    es: "Practica del equipo o asignacion",
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
    en: "Mat 2 / due before weigh-in",
    es: "Tapiz 2 / vence antes del pesaje",
    uz: "2-mat",
    ru: "Мат 2"
  }
};

function calendarCopy(key) {
  return pickCopy(CALENDAR_MANAGER_COPY[key] || { en: key, es: key });
}

function getManagerDateKey() {
  const fallback = calendarSelectedKey || getCurrentAppDateKey();
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
const mediaNewItemAssetPathLabel = document.getElementById("mediaNewItemAssetPathLabel");
const mediaNewItemAssetPath = document.getElementById("mediaNewItemAssetPath");
const mediaNewItemFileLabel = document.getElementById("mediaNewItemFileLabel");
const mediaNewItemFile = document.getElementById("mediaNewItemFile");
const mediaNewItemThumbPathLabel = document.getElementById("mediaNewItemThumbPathLabel");
const mediaNewItemThumbPath = document.getElementById("mediaNewItemThumbPath");
const mediaNewItemDurationLabel = document.getElementById("mediaNewItemDurationLabel");
const mediaNewItemDuration = document.getElementById("mediaNewItemDuration");
const mediaNewItemTypeLabel = document.getElementById("mediaNewItemTypeLabel");
const mediaNewItemType = document.getElementById("mediaNewItemType");
const mediaNewItemAssignedLabel = document.getElementById("mediaNewItemAssignedLabel");
const mediaNewItemAssigned = document.getElementById("mediaNewItemAssigned");
const mediaNewItemNoteLabel = document.getElementById("mediaNewItemNoteLabel");
const mediaNewItemNote = document.getElementById("mediaNewItemNote");
const mediaAddItemBtn = document.getElementById("mediaAddItemBtn");
const mediaAssignmentTitle = document.getElementById("mediaAssignmentTitle");
const mediaSelectedItemLabel = document.getElementById("mediaSelectedItemLabel");
const mediaAssignmentMode = document.getElementById("mediaAssignmentMode");
const mediaAssignmentTarget = document.getElementById("mediaAssignmentTarget");
const mediaAssignmentType = document.getElementById("mediaAssignmentType");
const mediaAssignmentDueDate = document.getElementById("mediaAssignmentDueDate");
const mediaAssignmentTitleInput = document.getElementById("mediaAssignmentTitleInput");
const mediaAssignmentNote = document.getElementById("mediaAssignmentNote");
const mediaAssignBtn = document.getElementById("mediaAssignBtn");
const mediaAssignmentStatus = document.getElementById("mediaAssignmentStatus");
const mediaAnalysisTitle = document.getElementById("mediaAnalysisTitle");
const mediaAnalysisSelectedLabel = document.getElementById("mediaAnalysisSelectedLabel");
const mediaAnalysisMode = document.getElementById("mediaAnalysisMode");
const mediaAnalysisTarget = document.getElementById("mediaAnalysisTarget");
const mediaAnalysisSummary = document.getElementById("mediaAnalysisSummary");
const mediaAnalysisTimestamp = document.getElementById("mediaAnalysisTimestamp");
const mediaAnalysisNote = document.getElementById("mediaAnalysisNote");
const mediaAnalysisAddBtn = document.getElementById("mediaAnalysisAddBtn");
const mediaAnalysisEntries = document.getElementById("mediaAnalysisEntries");
const mediaAnalysisStatus = document.getElementById("mediaAnalysisStatus");

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
  addItemAssetPathLabel: {
    en: "NAS path or URL",
    es: "Ruta o URL en NAS",
    uz: "NAS yo'li yoki URL",
    ru: "Путь NAS или URL"
  },
  addItemFileLabel: {
    en: "Upload video file (optional)",
    es: "Subir archivo de video (opcional)",
    uz: "Video fayl yuklash (ixtiyoriy)",
    ru: "Загрузить видеофайл (необязательно)"
  },
  addItemThumbLabel: {
    en: "Thumbnail path (optional)",
    es: "Ruta de miniatura (opcional)",
    uz: "Miniatura yo'li (ixtiyoriy)",
    ru: "Путь миниатюры (необязательно)"
  },
  addItemDurationLabel: {
    en: "Duration (optional)",
    es: "Duracion (opcional)",
    uz: "Davomiyligi (ixtiyoriy)",
    ru: "Длительность (необязательно)"
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
  openMedia: {
    en: "Open Media",
    es: "Abrir recurso",
    uz: "Medianı ochish",
    ru: "Открыть медиа"
  },
  missingAsset: {
    en: "Missing NAS path",
    es: "Falta ruta NAS",
    uz: "NAS yo'li yo'q",
    ru: "Путь NAS отсутствует"
  },
  duration: {
    en: "Duration",
    es: "Duracion",
    uz: "Davomiyligi",
    ru: "Длительность"
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
  },
  needItemAssetPath: {
    en: "Add a NAS path or URL.",
    es: "Agrega una ruta o URL del NAS.",
    uz: "NAS yo'li yoki URL kiriting.",
    ru: "Добавьте путь NAS или URL."
  },
  uploadingVideo: {
    en: "Uploading video...",
    es: "Subiendo video...",
    uz: "Video yuklanmoqda...",
    ru: "Загрузка видео..."
  },
  uploadFailed: {
    en: "Video upload failed. Try again.",
    es: "No se pudo subir el video. Intenta otra vez.",
    uz: "Video yuklanmadi. Qayta urinib ko‘ring.",
    ru: "Не удалось загрузить видео. Попробуйте снова."
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
  assetPath: {
    en: "e.g., wrestling/drills/double-leg.mp4",
    es: "ej., wrestling/drills/double-leg.mp4",
    uz: "mas., wrestling/drills/double-leg.mp4",
    ru: "напр., wrestling/drills/double-leg.mp4"
  },
  thumbPath: {
    en: "e.g., wrestling/thumbnails/double-leg.jpg",
    es: "ej., wrestling/thumbnails/double-leg.jpg",
    uz: "mas., wrestling/thumbnails/double-leg.jpg",
    ru: "напр., wrestling/thumbnails/double-leg.jpg"
  },
  duration: {
    en: "e.g., 03:45",
    es: "ej., 03:45",
    uz: "mas., 03:45",
    ru: "напр., 03:45"
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
let selectedMediaItemId = "";
let mediaTreeCache = null;
let mediaSyncTimeout = null;
let mediaRealtimeUnsub = null;
let mediaRealtimeUserId = "";

function mediaCopy(key) {
  return pickCopy(MEDIA_COPY[key] || { en: key, es: key });
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function normalizeMediaAssetPath(value) {
  return String(value || "").trim();
}

function joinMediaUrl(base, path) {
  const normalizedBase = String(base || "").trim().replace(/\/+$/, "");
  const normalizedPath = String(path || "").trim().replace(/^\/+/, "");
  if (!normalizedBase || !normalizedPath) return "";
  return `${normalizedBase}/${normalizedPath}`;
}

function resolveMediaLocation(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isAbsoluteUrl(raw)) return raw;
  return joinMediaUrl(MEDIA_BASE_URL, raw);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
      assetPath: normalizeMediaAssetPath(item.assetPath || item.assetUrl || item.url || ""),
      thumbnailPath: normalizeMediaAssetPath(item.thumbnailPath || item.thumbnailUrl || ""),
      duration: String(item.duration || ""),
      assigned: item.assigned,
      note: String(item.note || ""),
      parentId: sectionId
    });
  });

  return { nodes };
}

function ensureYoutubeMediaNode(nodes) {
  const working = Array.isArray(nodes) ? nodes.slice() : [];
  const targetUrl = "https://www.flowrestling.org/training?playing=7965907";
  const normalizedTarget = normalizeMediaAssetPath(targetUrl);
  const exists = working.some(
    (node) =>
      node.type === "item" &&
      normalizeMediaAssetPath(node.assetPath || node.assetUrl || node.url || "") === normalizedTarget
  );
  if (exists) return working;

  const normalizeText = (value) => String(value || "").trim().toLowerCase();
  const sectionNames = new Set(["featured", "destacado"]);
  let section = working.find(
    (node) => node.type === "section" && node.parentId === null && sectionNames.has(normalizeText(node.name))
  );

  if (!section) {
    section = {
      id: makeMediaId("sec"),
      type: "section",
      name: currentLang === "es" ? "Destacado" : "Featured",
      parentId: null
    };
    working.push(section);
  }

  working.push({
    id: makeMediaId("item"),
    type: "item",
    title: currentLang === "es" ? "Final de pierna simple - Coach Chewy" : "Single Leg Finish - Coach Chewy",
    mediaType: currentLang === "es" ? "Video" : "Video",
    assetPath: targetUrl,
    thumbnailPath: "",
    duration: "",
    assigned: currentLang === "es" ? "Esta semana" : "This week",
    note: currentLang === "es"
      ? "Recurso destacado para finalizacion de single leg."
      : "Featured resource for single-leg finishes.",
    parentId: section.id
  });

  return working;
}

function ensureDemoMediaNodes(nodes) {
  const legacyTarget = normalizeMediaAssetPath("https://www.youtube.com/watch?v=FHHOgZ3QTSY");
  const working = (Array.isArray(nodes) ? nodes : []).filter((node) => {
    if (node?.type !== "item") return true;
    const asset = normalizeMediaAssetPath(node.assetPath || node.assetUrl || node.url || "");
    const title = String(node.title || "").toLowerCase();
    return asset !== legacyTarget && !title.includes("trailer oficial");
  });

  const sectionIds = new Map();
  working.forEach((node) => {
    if (node?.type === "section") {
      sectionIds.set(String(node.name || "").trim().toLowerCase(), node.id);
    }
  });

  getMediaItemsData().forEach((item) => {
    const normalizedAsset = normalizeMediaAssetPath(item.assetPath || item.assetUrl || item.url || "");
    const exists = working.some((node) => {
      if (node?.type !== "item") return false;
      const nodeAsset = normalizeMediaAssetPath(node.assetPath || node.assetUrl || node.url || "");
      return String(node.title || "").trim() === String(item.title || "").trim()
        || (normalizedAsset && nodeAsset === normalizedAsset);
    });
    if (exists) return;

    const sectionName = String(item.tag || mediaCopy("root")).trim();
    const sectionKey = sectionName.toLowerCase();
    let sectionId = sectionIds.get(sectionKey);
    if (!sectionId) {
      sectionId = makeMediaId("sec");
      sectionIds.set(sectionKey, sectionId);
      working.push({
        id: sectionId,
        type: "section",
        name: sectionName,
        parentId: null
      });
    }

    working.push({
      id: makeMediaId("item"),
      type: "item",
      title: item.title,
      mediaType: item.type,
      assetPath: normalizedAsset,
      thumbnailPath: normalizeMediaAssetPath(item.thumbnailPath || item.thumbnailUrl || ""),
      duration: String(item.duration || ""),
      assigned: item.assigned,
      note: String(item.note || ""),
      parentId: sectionId
    });
  });

  return working;
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
  const rawAssetPath = node.assetPath || node.assetUrl || node.url || "";
  const rawThumbnailPath = node.thumbnailPath || node.thumbnailUrl || "";
  return {
    id,
    type,
    title,
    mediaType: String(node.mediaType || node.typeLabel || "Video"),
    assetPath: normalizeMediaAssetPath(rawAssetPath),
    thumbnailPath: normalizeMediaAssetPath(rawThumbnailPath),
    duration: String(node.duration || ""),
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

function sanitizeMediaFileName(name) {
  const raw = String(name || "").trim().toLowerCase();
  const replaced = raw.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  return replaced.replace(/^-+|-+$/g, "") || `video-${Date.now()}.mp4`;
}

function inferMediaTitleFromFile(file) {
  if (!file?.name) return "";
  return file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function getMediaTreeFromLocalStorage() {
  try {
    const raw = localStorage.getItem(MEDIA_TREE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeMediaTree(parsed);
  } catch {
    return null;
  }
}

function cacheAndPersistMediaTreeLocally(tree) {
  const normalized = normalizeMediaTree(tree);
  const mergedNodes = ensureDemoMediaNodes(ensureYoutubeMediaNode(normalized.nodes));
  const ready = mergedNodes.length ? { nodes: mergedNodes } : buildDefaultMediaTree();
  mediaTreeCache = ready;
  localStorage.setItem(MEDIA_TREE_KEY, JSON.stringify(ready));
  return ready;
}

function stopMediaRealtimeSync() {
  if (mediaRealtimeUnsub) {
    mediaRealtimeUnsub();
    mediaRealtimeUnsub = null;
  }
  mediaRealtimeUserId = "";
}

async function hydrateMediaTreeFromSharedStore() {
  const authUser = getAuthUser();
  if (!firebaseFirestoreInstance || !authUser?.id) {
    if (mediaTreeCache) return mediaTreeCache;
    const local = getMediaTreeFromLocalStorage();
    if (local) return cacheAndPersistMediaTreeLocally(local);
    return cacheAndPersistMediaTreeLocally(buildDefaultMediaTree());
  }

  const remote = await fetchSharedMediaTreeDoc();
  if (remote && Array.isArray(remote.nodes) && remote.nodes.length) {
    return cacheAndPersistMediaTreeLocally({ nodes: remote.nodes });
  }

  const local = getMediaTreeFromLocalStorage();
  const seeded = cacheAndPersistMediaTreeLocally(local || buildDefaultMediaTree());
  await persistSharedMediaTreeDoc(
    {
      nodes: seeded.nodes,
      updatedAt: new Date().toISOString(),
      updatedBy: authUser.id
    },
    { required: false }
  );
  return seeded;
}

function queueSharedMediaTreeSync(tree) {
  const authUser = getAuthUser();
  if (!firebaseFirestoreInstance || !authUser?.id) return;
  if (mediaSyncTimeout) clearTimeout(mediaSyncTimeout);
  mediaSyncTimeout = setTimeout(() => {
    persistSharedMediaTreeDoc(
      {
        nodes: tree.nodes,
        updatedAt: new Date().toISOString(),
        updatedBy: authUser.id
      },
      { required: false }
    ).catch((err) => {
      console.warn("Background media tree sync failed", err);
    });
  }, 350);
}

function startMediaRealtimeSync() {
  const authUser = getAuthUser();
  if (!firebaseFirestoreInstance || !authUser?.id) {
    stopMediaRealtimeSync();
    return;
  }

  if (mediaRealtimeUnsub && mediaRealtimeUserId === authUser.id) return;
  stopMediaRealtimeSync();
  mediaRealtimeUserId = authUser.id;

  const ref = getSharedMediaTreeDocRef();
  if (!ref) return;
  mediaRealtimeUnsub = ref.onSnapshot(
    (doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      if (!data || !Array.isArray(data.nodes)) return;
      cacheAndPersistMediaTreeLocally({ nodes: data.nodes });
      if (!appRoot?.classList.contains("hidden")) {
        renderMedia();
      }
    },
    (err) => {
      console.warn("Media realtime sync listener failed", err);
    }
  );
}

function getMediaUploadPath(fileName) {
  const root = WPL_MEDIA_UPLOADS_ROOT || "media_uploads";
  const coachKey = getCoachKey();
  const safeName = sanitizeMediaFileName(fileName);
  return `${root}/${coachKey}/${Date.now()}-${safeName}`;
}

async function uploadMediaFileToFirebase(file) {
  if (!firebaseStorageInstance) {
    throw new Error("storage_not_configured");
  }
  if (!file) {
    throw new Error("missing_file");
  }
  const uploadPath = getMediaUploadPath(file.name);
  const ref = firebaseStorageInstance.ref().child(uploadPath);
  const taskSnapshot = await withTimeout(
    ref.put(file, { contentType: file.type || "video/mp4" }),
    FIREBASE_OP_TIMEOUT_MS * 4,
    "storage_upload_timeout"
  );
  return taskSnapshot.ref.getDownloadURL();
}

function getStoredMediaTree() {
  if (mediaTreeCache) return mediaTreeCache;
  const local = getMediaTreeFromLocalStorage();
  if (local) return cacheAndPersistMediaTreeLocally(local);
  return cacheAndPersistMediaTreeLocally(buildDefaultMediaTree());
}

function setStoredMediaTree(tree) {
  const normalized = cacheAndPersistMediaTreeLocally(tree);
  queueSharedMediaTreeSync(normalized);
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

function syncSelectedMediaNode(nodes = getMediaNodes()) {
  const selected = findMediaNode(nodes, selectedMediaItemId);
  if (selected?.type === "item") return selected;
  const sectionItems = getMediaChildren(nodes, mediaActiveSectionId, "item");
  const fallback = sectionItems[0] || nodes.find((node) => node.type === "item") || null;
  selectedMediaItemId = fallback?.id || "";
  return fallback;
}

function getMediaAssignmentTargetOptions(mode = mediaAssignmentMode?.value || "athlete") {
  if (mode === "group") {
    return getCoachGroupRecords().map((group) => ({
      value: group.id,
      label: group.name
    }));
  }
  return getAthletesData().map((athlete) => ({
    value: athlete.name,
    label: athlete.name
  }));
}

function populateMediaTargetSelect(selectEl, mode, selectedValue = "") {
  if (!selectEl) return;
  const options = getMediaAssignmentTargetOptions(mode);
  selectEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
  if (!options.length) return;
  selectEl.value = options.some((option) => option.value === selectedValue) ? selectedValue : options[0].value;
}

function buildMediaAnalysisRecordId(mediaNode, mode, targetValue) {
  const suffix = mode === "group" ? targetValue : slugifyKey(targetValue);
  return `${mediaNode.id}-${suffix}`;
}

function getMediaAnalysisTargetLabel(mode, targetValue) {
  if (mode === "group") {
    return getCoachGroupRecords().find((group) => group.id === targetValue)?.name || targetValue;
  }
  return targetValue;
}

function renderMediaAnalysisEntries(mediaNode) {
  if (!mediaAnalysisEntries) return;
  const mode = mediaAnalysisMode?.value || "athlete";
  const targetValue = mediaAnalysisTarget?.value || "";
  const targetLabel = getMediaAnalysisTargetLabel(mode, targetValue);
  const record = getCoachMatchAnalysisRecordForMediaTarget({
    mediaId: mediaNode?.id || "",
    mediaAssetPath: mediaNode?.assetPath || "",
    athleteName: mode === "athlete" ? targetValue : "",
    groupId: mode === "group" ? targetValue : ""
  });
  const entries = record?.entries || [];
  mediaAnalysisEntries.innerHTML = "";
  if (!mediaNode || !entries.length) {
    mediaAnalysisEntries.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "Todavia no hay analisis guardado para este video." : "No match analysis saved for this media yet."}</p></div>`;
    return;
  }
  const summaryCard = document.createElement("div");
  summaryCard.className = "mini-card";
  summaryCard.innerHTML = `
    <h4>${record.mediaTitle || mediaNode.title}</h4>
    <div class="small">${targetLabel}</div>
    <p class="small">${record.summary || (currentLang === "es" ? "Sin resumen todavia." : "No summary yet.")}</p>
  `;
  mediaAnalysisEntries.appendChild(summaryCard);
  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `<strong>${entry.timestamp || "--:--"}</strong><p class="small">${entry.note || ""}</p>`;
    mediaAnalysisEntries.appendChild(card);
  });
}

function renderMediaCoachActions(nodes = getMediaNodes()) {
  const selectedMedia = syncSelectedMediaNode(nodes);
  const selectedLabel = selectedMedia
    ? `${currentLang === "es" ? "Seleccionado" : "Selected"}: ${selectedMedia.title}`
    : (currentLang === "es" ? "Selecciona un media para crear la tarea." : "Select a media item to create the assignment.");
  if (mediaSelectedItemLabel) mediaSelectedItemLabel.textContent = selectedLabel;
  if (mediaAnalysisSelectedLabel) mediaAnalysisSelectedLabel.textContent = selectedLabel;
  if (mediaAssignmentDueDate && !mediaAssignmentDueDate.value) mediaAssignmentDueDate.value = getCurrentAppDateKey();
  if (mediaAssignmentTitleInput && selectedMedia && !mediaAssignmentTitleInput.value.trim()) {
    mediaAssignmentTitleInput.value = selectedMedia.title;
  }
  populateMediaTargetSelect(mediaAssignmentTarget, mediaAssignmentMode?.value || "athlete", mediaAssignmentTarget?.value || getSelectedCoachAthleteName());
  populateMediaTargetSelect(mediaAnalysisTarget, mediaAnalysisMode?.value || "athlete", mediaAnalysisTarget?.value || getSelectedCoachAthleteName());
  const existingAnalysis = getCoachMatchAnalysisRecordForMediaTarget({
    mediaId: selectedMedia?.id || "",
    mediaAssetPath: selectedMedia?.assetPath || "",
    athleteName: (mediaAnalysisMode?.value || "athlete") === "athlete" ? (mediaAnalysisTarget?.value || "") : "",
    groupId: (mediaAnalysisMode?.value || "athlete") === "group" ? (mediaAnalysisTarget?.value || "") : ""
  });
  if (mediaAnalysisSummary && existingAnalysis && !mediaAnalysisSummary.value.trim()) {
    mediaAnalysisSummary.value = existingAnalysis.summary || "";
  }
  renderMediaAnalysisEntries(selectedMedia);
}

async function createAssignmentFromSelectedMedia() {
  const mediaNode = syncSelectedMediaNode(getMediaNodes());
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments");
  if (!mediaNode || !assignmentsRef) {
    throw new Error("media_assignment_requires_selection");
  }
  const mode = mediaAssignmentMode?.value || "athlete";
  const targetValue = mediaAssignmentTarget?.value || "";
  const dueDateKey = normalizeDateKey(mediaAssignmentDueDate?.value || getCurrentAppDateKey());
  const type = String(mediaAssignmentType?.value || "Video review").trim();
  const title = String(mediaAssignmentTitleInput?.value || mediaNode.title || "").trim();
  const note = String(mediaAssignmentNote?.value || mediaNode.note || "").trim();
  if (!targetValue || !title) {
    throw new Error("media_assignment_target_required");
  }
  const payload = {
    title,
    assigneeType: mode,
    assigneeId: mode === "group" ? targetValue : slugifyKey(targetValue),
    assigneeName: getMediaAnalysisTargetLabel(mode, targetValue),
    assigneeNames: mode === "group"
      ? (getCoachGroupRecords().find((group) => group.id === targetValue)?.memberNames || [])
      : [targetValue],
    type,
    dueDateKey,
    dueLabel: formatPlanDateLabel(dueDateKey),
    status: "not_started",
    note,
    source: `Media - ${mediaNode.mediaType || "Video"}`,
    mediaId: mediaNode.id,
    mediaTitle: mediaNode.title,
    mediaAssetPath: mediaNode.assetPath || "",
    notificationStatus: "pending"
  };
  const ref = assignmentsRef.doc();
  await withTimeout(
    ref.set(stripUndefinedDeep({
      ...payload,
      createdAt: getFirestoreServerTimestamp(),
      updatedAt: getFirestoreServerTimestamp()
    }), { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_media_assignment_timeout"
  );
}

async function saveSelectedMediaAnalysis() {
  const mediaNode = syncSelectedMediaNode(getMediaNodes());
  const analysisRef = getCoachWorkspaceCollectionRef("match_analysis");
  if (!mediaNode || !analysisRef) {
    throw new Error("media_analysis_requires_selection");
  }
  const mode = mediaAnalysisMode?.value || "athlete";
  const targetValue = mediaAnalysisTarget?.value || "";
  const targetLabel = getMediaAnalysisTargetLabel(mode, targetValue);
  const summary = String(mediaAnalysisSummary?.value || "").trim();
  const timestamp = String(mediaAnalysisTimestamp?.value || "").trim();
  const note = String(mediaAnalysisNote?.value || "").trim();
  if (!targetValue || (!summary && !timestamp && !note)) {
    throw new Error("media_analysis_target_required");
  }
  const existing = getCoachMatchAnalysisRecordForMediaTarget({
    mediaId: mediaNode.id,
    mediaAssetPath: mediaNode.assetPath || "",
    athleteName: mode === "athlete" ? targetValue : "",
    groupId: mode === "group" ? targetValue : ""
  });
  const recordId = existing?.id || buildMediaAnalysisRecordId(mediaNode, mode, targetValue);
  const nextEntries = [...(existing?.entries || [])];
  if (timestamp || note) {
    nextEntries.push({
      timestamp,
      note
    });
  }
  await withTimeout(
    analysisRef.doc(recordId).set(stripUndefinedDeep({
      mediaId: mediaNode.id,
      mediaTitle: mediaNode.title,
      mediaAssetPath: mediaNode.assetPath || "",
      athleteName: mode === "athlete" ? targetLabel : "",
      groupId: mode === "group" ? targetValue : "",
      summary: summary || existing?.summary || "",
      entries: nextEntries,
      createdAt: existing ? undefined : getFirestoreServerTimestamp(),
      updatedAt: getFirestoreServerTimestamp()
    }), { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_match_analysis_write_timeout"
  );
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
  const durationLabel = mediaCopy("duration");
  const saveFavLabel = mediaCopy("saveFav");
  const openMediaLabel = mediaCopy("openMedia");
  const selectMediaLabel = currentLang === "es" ? "Seleccionar" : "Select";
  const missingAssetLabel = mediaCopy("missingAsset");
  const parent = mediaActiveSectionId ? findMediaNode(nodes, mediaActiveSectionId) : null;
  const parentName = parent?.type === "section" ? parent.name : "";
  const selectedNode = syncSelectedMediaNode(nodes);

  mediaItemList.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = `media-item-card${selectedNode?.id === item.id ? " active" : ""}`;
    const assetPath = normalizeMediaAssetPath(item.assetPath || item.assetUrl || item.url || "");
    const thumbnailPath = normalizeMediaAssetPath(item.thumbnailPath || item.thumbnailUrl || "");
    const assetUrl = resolveMediaLocation(assetPath);
    const thumbnailUrl = resolveMediaLocation(thumbnailPath);
    const safeTitle = escapeHtml(item.title);
    const safeType = escapeHtml(item.mediaType);
    const safeAssigned = escapeHtml(item.assigned);
    const safeDuration = escapeHtml(item.duration);
    const safeNote = escapeHtml(item.note);
    const safePath = escapeHtml(assetPath);
    const missingClass = assetUrl ? "" : " media-item-missing";
    card.innerHTML = `
      ${thumbnailUrl ? `<img class="media-item-thumb" src="${escapeHtml(thumbnailUrl)}" alt="${safeTitle}" loading="lazy">` : ""}
      <h4>${safeTitle}</h4>
      <div class="small">${safeType}</div>
      ${assetPath ? `<div class="small media-item-path">${safePath}</div>` : `<div class="small${missingClass}">${missingAssetLabel}</div>`}
      ${item.assigned ? `<div class="small">${assignedLabel}: ${safeAssigned}</div>` : ""}
      ${item.duration ? `<div class="small">${durationLabel}: ${safeDuration}</div>` : ""}
      ${item.note ? `<div class="small">${safeNote}</div>` : ""}
    `;

    const actions = document.createElement("div");
    actions.className = "media-item-actions";
    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = selectedNode?.id === item.id ? "ghost" : "";
    selectBtn.textContent = selectMediaLabel;
    selectBtn.addEventListener("click", () => {
      selectedMediaItemId = item.id;
      if (mediaAssignmentTitleInput) mediaAssignmentTitleInput.value = item.title || "";
      if (mediaAssignmentNote && !mediaAssignmentNote.value.trim()) mediaAssignmentNote.value = item.note || "";
      renderMedia();
    });
    actions.appendChild(selectBtn);
    if (assetUrl) {
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "ghost";
      openBtn.textContent = openMediaLabel;
      openBtn.addEventListener("click", () => {
        window.open(assetUrl, "_blank", "noopener,noreferrer");
      });
      actions.appendChild(openBtn);
    }

    const btn = document.createElement("button");
    btn.type = "button";
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
    actions.appendChild(btn);

    card.appendChild(actions);
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
    mediaAddItemBtn.addEventListener("click", async () => {
      const file = mediaNewItemFile?.files?.[0] || null;
      const inferredTitle = inferMediaTitleFromFile(file);
      const title = mediaNewItemTitle?.value.trim() || inferredTitle;
      let assetPath = normalizeMediaAssetPath(mediaNewItemAssetPath?.value || "");
      if (!title) {
        toast(mediaCopy("needItemTitle"));
        return;
      }
      if (file) {
        try {
          toast(mediaCopy("uploadingVideo"));
          assetPath = await uploadMediaFileToFirebase(file);
          if (mediaNewItemAssetPath) mediaNewItemAssetPath.value = assetPath;
        } catch (err) {
          console.warn("Video upload failed", err);
          toast(mediaCopy("uploadFailed"));
          return;
        }
      }
      if (!assetPath) {
        toast(mediaCopy("needItemAssetPath"));
        return;
      }
      const nodes = getMediaNodes();
      nodes.push({
        id: makeMediaId("item"),
        type: "item",
        title,
        mediaType: mediaNewItemType?.value || "Video",
        assetPath,
        thumbnailPath: normalizeMediaAssetPath(mediaNewItemThumbPath?.value || ""),
        duration: mediaNewItemDuration?.value.trim() || "",
        assigned: mediaNewItemAssigned?.value.trim() || "",
        note: mediaNewItemNote?.value.trim() || "",
        parentId: mediaActiveSectionId
      });
      setMediaNodes(nodes);
      if (mediaNewItemTitle) mediaNewItemTitle.value = "";
      if (mediaNewItemAssetPath) mediaNewItemAssetPath.value = "";
      if (mediaNewItemThumbPath) mediaNewItemThumbPath.value = "";
      if (mediaNewItemDuration) mediaNewItemDuration.value = "";
      if (mediaNewItemAssigned) mediaNewItemAssigned.value = "";
      if (mediaNewItemNote) mediaNewItemNote.value = "";
      if (mediaNewItemFile) mediaNewItemFile.value = "";
      toast(mediaCopy("addItemToast"));
      renderMedia();
    });
  }

  if (mediaNewItemFile) {
    mediaNewItemFile.addEventListener("change", () => {
      const file = mediaNewItemFile.files?.[0];
      if (!file || !mediaNewItemTitle) return;
      if (!mediaNewItemTitle.value.trim()) {
        mediaNewItemTitle.value = inferMediaTitleFromFile(file);
      }
    });
  }

  if (mediaAssignmentMode) {
    mediaAssignmentMode.addEventListener("change", () => {
      populateMediaTargetSelect(mediaAssignmentTarget, mediaAssignmentMode.value, "");
      renderMediaCoachActions();
    });
  }

  if (mediaAnalysisMode) {
    mediaAnalysisMode.addEventListener("change", () => {
      populateMediaTargetSelect(mediaAnalysisTarget, mediaAnalysisMode.value, "");
      renderMediaCoachActions();
    });
  }

  if (mediaAnalysisTarget) {
    mediaAnalysisTarget.addEventListener("change", () => {
      renderMediaCoachActions();
    });
  }

  if (mediaAssignBtn) {
    mediaAssignBtn.addEventListener("click", async () => {
      if (mediaAssignmentStatus) mediaAssignmentStatus.textContent = "";
      try {
        await createAssignmentFromSelectedMedia();
        if (mediaAssignmentStatus) {
          mediaAssignmentStatus.textContent = currentLang === "es"
            ? "Asignacion creada desde Media."
            : "Assignment created from Media.";
        }
        toast(currentLang === "es" ? "Asignacion creada." : "Assignment created.");
        renderCoachAssignments();
      } catch (err) {
        console.warn("Media assignment create failed", err);
        if (mediaAssignmentStatus) {
          mediaAssignmentStatus.textContent = currentLang === "es"
            ? "No se pudo crear la asignacion."
            : "Could not create the assignment.";
        }
      }
    });
  }

  if (mediaAnalysisAddBtn) {
    mediaAnalysisAddBtn.addEventListener("click", async () => {
      if (mediaAnalysisStatus) mediaAnalysisStatus.textContent = "";
      try {
        await saveSelectedMediaAnalysis();
        if (mediaAnalysisTimestamp) mediaAnalysisTimestamp.value = "";
        if (mediaAnalysisNote) mediaAnalysisNote.value = "";
        if (mediaAnalysisStatus) {
          mediaAnalysisStatus.textContent = currentLang === "es"
            ? "Analisis guardado."
            : "Analysis saved.";
        }
        renderMediaCoachActions();
      } catch (err) {
        console.warn("Media analysis save failed", err);
        if (mediaAnalysisStatus) {
          mediaAnalysisStatus.textContent = currentLang === "es"
            ? "No se pudo guardar el analisis."
            : "Could not save the analysis.";
        }
      }
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
  if (mediaNewItemAssetPathLabel) mediaNewItemAssetPathLabel.textContent = mediaCopy("addItemAssetPathLabel");
  if (mediaNewItemFileLabel) mediaNewItemFileLabel.textContent = mediaCopy("addItemFileLabel");
  if (mediaNewItemThumbPathLabel) mediaNewItemThumbPathLabel.textContent = mediaCopy("addItemThumbLabel");
  if (mediaNewItemDurationLabel) mediaNewItemDurationLabel.textContent = mediaCopy("addItemDurationLabel");
  if (mediaNewItemTypeLabel) mediaNewItemTypeLabel.textContent = mediaCopy("addItemTypeLabel");
  if (mediaNewItemAssignedLabel) mediaNewItemAssignedLabel.textContent = mediaCopy("addItemAssignedLabel");
  if (mediaNewItemNoteLabel) mediaNewItemNoteLabel.textContent = mediaCopy("addItemNoteLabel");
  if (mediaAddItemBtn) mediaAddItemBtn.textContent = mediaCopy("addItemBtn");

  if (mediaNewSectionName) mediaNewSectionName.placeholder = pickCopy(MEDIA_PLACEHOLDERS.section);
  if (mediaNewItemTitle) mediaNewItemTitle.placeholder = pickCopy(MEDIA_PLACEHOLDERS.item);
  if (mediaNewItemAssetPath) mediaNewItemAssetPath.placeholder = pickCopy(MEDIA_PLACEHOLDERS.assetPath);
  if (mediaNewItemThumbPath) mediaNewItemThumbPath.placeholder = pickCopy(MEDIA_PLACEHOLDERS.thumbPath);
  if (mediaNewItemDuration) mediaNewItemDuration.placeholder = pickCopy(MEDIA_PLACEHOLDERS.duration);
  if (mediaNewItemAssigned) mediaNewItemAssigned.placeholder = pickCopy(MEDIA_PLACEHOLDERS.assigned);
  if (mediaNewItemNote) mediaNewItemNote.placeholder = pickCopy(MEDIA_PLACEHOLDERS.note);
  if (mediaAssignmentTitle) mediaAssignmentTitle.textContent = currentLang === "es" ? "Asignar tarea desde media" : "Assign Media Task";
  if (mediaAnalysisTitle) mediaAnalysisTitle.textContent = currentLang === "es" ? "Analisis de combate" : "Match Analysis";
  if (mediaAssignBtn) mediaAssignBtn.textContent = currentLang === "es" ? "Crear asignacion" : "Create assignment";
  if (mediaAnalysisAddBtn) mediaAnalysisAddBtn.textContent = currentLang === "es" ? "Guardar analisis" : "Save analysis";
  renderMediaCoachActions();
}

function renderMedia() {
  const nodes = getMediaNodes();
  ensureMediaActiveSection(nodes);
  const profile = getProfile();
  const isCoach = isCoachRole(profile?.role);

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

// ---------- COACH: ASSIGNMENTS + COMPLETION ----------
const assignmentStats = document.getElementById("assignmentStats");
const assignmentList = document.getElementById("assignmentList");
const assignmentTypeGrid = document.getElementById("assignmentTypeGrid");
const assignmentQueueTitle = document.getElementById("assignmentQueueTitle");
const assignmentTypesTitle = document.getElementById("assignmentTypesTitle");
const assignmentResourceTitle = document.getElementById("assignmentResourceTitle");
const assignmentResourceList = document.getElementById("assignmentResourceList");
const assignmentWorkflowTitle = document.getElementById("assignmentWorkflowTitle");
const assignmentWorkflowList = document.getElementById("assignmentWorkflowList");
const assignmentFilterAthlete = document.getElementById("assignmentFilterAthlete");
const assignmentFilterStatus = document.getElementById("assignmentFilterStatus");
const assignmentFilterType = document.getElementById("assignmentFilterType");
const assignmentFilterDate = document.getElementById("assignmentFilterDate");
const assignmentFilterClear = document.getElementById("assignmentFilterClear");
const completionStats = document.getElementById("completionStats");
const completionList = document.getElementById("completionList");
const completionRowsTitle = document.getElementById("completionRowsTitle");
const completionAlertsTitle = document.getElementById("completionAlertsTitle");
const completionAlertsList = document.getElementById("completionAlertsList");
let assignmentFilterState = {
  athlete: "",
  status: "",
  type: "",
  date: ""
};

function getAssignmentStatusMeta(status) {
  const copy = {
    not_started: { en: "Not started", es: "Sin empezar" },
    in_progress: { en: "In progress", es: "En progreso" },
    overdue: { en: "Overdue", es: "Atrasado" },
    completed: { en: "Completed", es: "Completado" }
  };
  const classes = {
    not_started: "status-pill-pending",
    in_progress: "status-pill-journal",
    overdue: "status-pill-alert",
    completed: "status-pill-active"
  };
  const key = normalizeAssignmentStatus(status);
  return {
    label: pickCopy(copy[key] || copy.not_started),
    className: classes[key] || "status-pill-pending"
  };
}

function getCompletionStatusMeta(status) {
  const classes = {
    ontrack: "status-pill-active",
    followup: "status-pill-pending",
    overdue: "status-pill-alert",
    limited: "status-pill-limited"
  };
  return {
    label: pickCopy(COACH_COMPLETION_STATUS_COPY[status] || COACH_COMPLETION_STATUS_COPY.ontrack),
    className: classes[status] || "status-pill-active"
  };
}

function getCoachAssignmentAssigneeLabel(record) {
  if (!record) return "";
  if (record.assigneeType === "group") return record.assigneeName || record.assigneeId;
  if (record.assigneeNames.length > 1) return record.assigneeNames.join(", ");
  return record.assigneeName || record.assigneeNames[0] || record.assigneeId;
}

function isPlanAssignedToAthlete(plan, athleteName) {
  const target = normalizeName(athleteName);
  if (!plan?.audience || !target) return false;
  if (plan.audience.mode === "group") {
    const group = getCoachGroupRecords().find((item) => item.id === plan.audience.groupId || normalizeName(item.name) === normalizeName(plan.audience.groupName));
    return group ? group.memberNames.some((member) => normalizeName(member) === target) : false;
  }
  return (plan.audience.athleteNames || []).some((name) => normalizeName(name) === target);
}

function getLatestCoachPlanForAthlete(athleteName) {
  return coachWorkspaceSortByUpdated(coachPlansCache).find((plan) => isPlanAssignedToAthlete(plan, athleteName)) || null;
}

function getCoachCompletionRow(athlete) {
  const saved = getCoachCompletionRecord(athlete.name);
  const live = buildCoachCompletionSnapshot(athlete);
  if (saved) {
    return {
      ...live,
      status: saved.status || live.status,
      pendingCount: saved.pendingCount ?? live.pendingCount,
      journalState: saved.journalState || live.journalState
    };
  }
  return live;
}

function getCoachUpcomingCompetitionRows(limit = 3) {
  const todayKey = getCurrentAppDateKey();
  const keywords = ["competition", "tournament", "dual", "match", "meet", "weigh", "competencia", "torneo"];
  const entries = Object.entries(getStoredCalendarEvents())
    .map(([dateKey, entry]) => ({ dateKey, entry: normalizeCalendarEntry(entry) }))
    .filter(({ dateKey, entry }) => dateKey >= todayKey && entry.items.length)
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  const matches = entries.filter(({ entry }) => entry.items.some((item) => {
    const text = String(item || "").toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  }));
  const source = matches.length ? matches : entries;

  return source.slice(0, limit).map(({ dateKey, entry }) => ({
    title: entry.items[0],
    detail: `${formatPlanDateLabel(dateKey)} • ${entry.items.length} ${currentLang === "es" ? "item(s)" : "item(s)"}`
  }));
}

function getCoachRecentTrainingRows(limit = 3) {
  if (coachPlansCache.length) {
    return coachWorkspaceSortByUpdated(coachPlansCache).slice(0, limit).map((plan) => ({
      title: plan.title,
      detail: `${formatPlanRangeLabel(plan.range)} • ${plan.focus || getPlanAssignmentTypeLabel(plan.type)}`
    }));
  }
  return getHomeRecentTrainingsData();
}

function getCoachHomeAlerts(limit = 4) {
  const alerts = [];
  getAthletesData().forEach((athlete) => {
    const row = getCoachCompletionRow(athlete);
    if (row.status !== "ontrack") {
      alerts.push(`${athlete.name}: ${row.followUp}`);
    }
    getAthleteAlerts(athlete).forEach((alert) => {
      alerts.push(`${athlete.name}: ${alert}`);
    });
  });
  return Array.from(new Set(alerts)).slice(0, limit);
}

function getCoachAssignmentResourceRows(limit = 4) {
  const mediaRows = getMediaNodes()
    .filter((node) => node.type === "item")
    .slice(0, limit)
    .map((node) => `${node.mediaType}: ${node.title}${node.note ? ` - ${node.note}` : ""}`);
  if (mediaRows.length) return mediaRows;
  return COACH_ASSIGNMENT_RESOURCES.map((item) => pickCopy(item));
}

function renderAssignmentFilters(records = getCoachAssignmentRecords()) {
  if (!assignmentFilterAthlete || !assignmentFilterStatus || !assignmentFilterType || !assignmentFilterDate) return;
  const assignees = Array.from(new Set(records.map((record) => getCoachAssignmentAssigneeLabel(record)).filter(Boolean))).sort();
  const types = Array.from(new Set(records.map((record) => record.type).filter(Boolean))).sort();
  const statuses = ["not_started", "in_progress", "completed", "overdue"];
  const statusMeta = Object.fromEntries(statuses.map((status) => [status, getAssignmentStatusMeta(status)]));

  assignmentFilterAthlete.innerHTML = [`<option value="">${currentLang === "es" ? "Todos" : "All"}</option>`]
    .concat(assignees.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`))
    .join("");
  assignmentFilterStatus.innerHTML = [`<option value="">${currentLang === "es" ? "Todos" : "All"}</option>`]
    .concat(statuses.map((status) => `<option value="${status}">${escapeHtml(statusMeta[status].label)}</option>`))
    .join("");
  assignmentFilterType.innerHTML = [`<option value="">${currentLang === "es" ? "Todos" : "All"}</option>`]
    .concat(types.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`))
    .join("");
  assignmentFilterAthlete.value = assignmentFilterState.athlete;
  assignmentFilterStatus.value = assignmentFilterState.status;
  assignmentFilterType.value = assignmentFilterState.type;
  assignmentFilterDate.value = assignmentFilterState.date;
}

function getFilteredCoachAssignments(records = getCoachAssignmentRecords()) {
  return records.filter((record) => {
    if (assignmentFilterState.athlete && getCoachAssignmentAssigneeLabel(record) !== assignmentFilterState.athlete) return false;
    if (assignmentFilterState.status && normalizeAssignmentStatus(record.status) !== assignmentFilterState.status) return false;
    if (assignmentFilterState.type && record.type !== assignmentFilterState.type) return false;
    if (assignmentFilterState.date && record.dueDateKey !== assignmentFilterState.date) return false;
    return true;
  });
}

function getAssignmentNotificationText(record) {
  const raw = String(record?.notificationStatus || "").trim().toLowerCase();
  if (!raw || raw === "pending") {
    return currentLang === "es" ? "Notificacion pendiente" : "Notification pending";
  }
  if (raw === "logged") {
    return currentLang === "es" ? "Notificacion registrada en el task flow" : "Notification logged in the task flow";
  }
  if (raw.startsWith("notified:")) {
    const count = Number.parseInt(raw.split(":")[1], 10) || 1;
    return currentLang === "es"
      ? `Notificado a ${count} atleta${count === 1 ? "" : "s"}`
      : `Notified ${count} athlete${count === 1 ? "" : "s"}`;
  }
  return raw;
}

async function updateCoachAssignmentStatus(assignmentId, status) {
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments");
  if (!assignmentsRef || !assignmentId) return;
  await withTimeout(
    assignmentsRef.doc(assignmentId).set({
      status: normalizeAssignmentStatus(status),
      updatedAt: getFirestoreServerTimestamp()
    }, { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_assignment_update_timeout"
  );
}

async function findFirebaseUserByName(name) {
  if (!firebaseFirestoreInstance || !name) return null;
  const snapshot = await withTimeout(
    firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).where("name", "==", name).limit(1).get(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_user_lookup_timeout"
  );
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return normalizeManagedUserRecord(doc.id, doc.data() || {});
}

async function sendCoachAssignmentNotification(assignment) {
  const current = getMessagesCurrentUser();
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments");
  const threadsRef = getMessageThreadsCollectionRef();
  if (!assignment?.id || !assignmentsRef) return;

  const targetNames = assignment.assigneeType === "group"
    ? uniqueNames(assignment.assigneeNames)
    : uniqueNames(assignment.assigneeNames.length ? assignment.assigneeNames : [assignment.assigneeName]);
  let notifiedCount = 0;

  if (current?.uid && threadsRef && isCoachMessagingUser(current)) {
    for (const targetName of targetNames) {
      const user = await findFirebaseUserByName(targetName);
      if (!user?.uid) continue;
      const threadId = buildDirectMessageThreadId(current.uid, user.uid);
      const threadRef = threadsRef.doc(threadId);
      const message = `${assignment.title} - ${currentLang === "es" ? "vence" : "due"} ${assignment.dueLabel || formatPlanDateLabel(assignment.dueDateKey || getCurrentAppDateKey())}. ${assignment.note || ""}`.trim();

      await withTimeout(
        threadRef.set({
          participantIds: [current.uid, user.uid].sort(),
          participants: {
            [current.uid]: true,
            [user.uid]: true
          },
          coachUid: current.uid,
          coachName: current.name,
          userUid: user.uid,
          userName: user.name || targetName,
          userRole: normalizeAuthRole(user.role || "athlete"),
          updatedAt: getFirestoreServerTimestamp(),
          lastMessageAt: getFirestoreServerTimestamp(),
          lastMessageText: message,
          lastSenderUid: current.uid
        }, { merge: true }),
        FIREBASE_OP_TIMEOUT_MS,
        "firestore_assignment_thread_timeout"
      );
      await withTimeout(
        threadRef.collection("messages").add({
          threadId,
          text: message,
          senderUid: current.uid,
          senderName: current.name,
          senderRole: current.role,
          createdAt: getFirestoreServerTimestamp()
        }),
        FIREBASE_OP_TIMEOUT_MS,
        "firestore_assignment_message_timeout"
      );
      notifiedCount += 1;
    }
  }

  await withTimeout(
    assignmentsRef.doc(assignment.id).set({
      notificationStatus: notifiedCount ? `notified:${notifiedCount}` : "logged",
      notifiedAt: getFirestoreServerTimestamp(),
      updatedAt: getFirestoreServerTimestamp()
    }, { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_assignment_notify_timeout"
  );
}

function renderCoachAssignments() {
  if (!assignmentStats || !assignmentList || !assignmentTypeGrid) return;

  if (assignmentQueueTitle) assignmentQueueTitle.textContent = currentLang === "es" ? "Cola de asignaciones" : "Assignment Queue";
  if (assignmentTypesTitle) assignmentTypesTitle.textContent = currentLang === "es" ? "Tipos de asignacion" : "Assignment Types";
  if (assignmentResourceTitle) assignmentResourceTitle.textContent = currentLang === "es" ? "Biblioteca de recursos" : "Resource Library";
  if (assignmentWorkflowTitle) assignmentWorkflowTitle.textContent = currentLang === "es" ? "Flujo de asignacion" : "Assignment Workflow";

  const assignmentRecords = getCoachAssignmentRecords();
  const counts = getAssignmentStatusCounts(assignmentRecords);
  renderAssignmentFilters(assignmentRecords);
  const visibleAssignments = getFilteredCoachAssignments(assignmentRecords);
  const stats = [
    {
      title: currentLang === "es" ? "Sin empezar" : "Not started",
      value: String(counts.not_started),
      note: currentLang === "es" ? "Tareas aun sin abrir" : "Assignments still waiting to start"
    },
    {
      title: currentLang === "es" ? "En progreso" : "In progress",
      value: String(counts.in_progress),
      note: currentLang === "es" ? "Trabajo que sigue abierto" : "Work that is currently active"
    },
    {
      title: currentLang === "es" ? "Atrasadas" : "Overdue",
      value: String(counts.overdue),
      note: currentLang === "es" ? "Requieren seguimiento inmediato" : "Needs immediate follow-up"
    },
    {
      title: currentLang === "es" ? "Completadas" : "Completed",
      value: String(counts.completed),
      note: currentLang === "es" ? "Cerradas esta semana" : "Closed out this week"
    }
  ];

  assignmentStats.innerHTML = "";
  stats.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<p class="small">${stat.title}</p><h3>${stat.value}</h3><p>${stat.note}</p>`;
    assignmentStats.appendChild(card);
  });

  assignmentList.innerHTML = "";
  if (!assignmentRecords.length) {
    assignmentList.innerHTML = `<div class="mini-card"><h3>${currentLang === "es" ? "Todavia no hay asignaciones." : "No assignments sent yet."}</h3><p class="small muted">${currentLang === "es" ? "Guarda un plan y usa Save Plan + Assign para empezar." : "Save a plan and use Save Plan + Assign to start sending work."}</p></div>`;
  }
  if (assignmentRecords.length && !visibleAssignments.length) {
    assignmentList.innerHTML = `<div class="mini-card"><h3>${currentLang === "es" ? "No hay resultados para esos filtros." : "No assignments match those filters."}</h3></div>`;
  }
  visibleAssignments.forEach((item) => {
    const status = getAssignmentStatusMeta(item.status);
    const assignedLabel = currentLang === "es" ? "Asignado a" : "Assigned to";
    const typeLabel = currentLang === "es" ? "Tipo" : "Type";
    const dueLabel = currentLang === "es" ? "Entrega" : "Due";
    const sourceLabel = currentLang === "es" ? "Origen" : "Source";
    const notifyLabel = currentLang === "es" ? "Notificar atleta" : "Notify athlete";
    const updateLabel = currentLang === "es" ? "Actualizar estado" : "Update status";
    const mediaLabel = currentLang === "es" ? "Abrir media" : "Open media";
    const statusOptions = ["not_started", "in_progress", "completed", "overdue"]
      .map((option) => {
        const meta = getAssignmentStatusMeta(option);
        const selected = normalizeAssignmentStatus(item.status) === option ? " selected" : "";
        return `<option value="${option}"${selected}>${escapeHtml(meta.label)}</option>`;
      })
      .join("");
    const notificationText = getAssignmentNotificationText(item);
    const card = document.createElement("article");
    card.className = "assignment-card";
    card.innerHTML = `
      <div class="assignment-card-top">
        <div>
          <strong>${item.title}</strong>
        </div>
        <span class="status-pill ${status.className}">${status.label}</span>
      </div>
      <div class="assignment-card-fields">
        <div class="assignment-field">
          <span class="assignment-field-label">${assignedLabel}</span>
          <strong>${getCoachAssignmentAssigneeLabel(item)}</strong>
        </div>
        <div class="assignment-field">
          <span class="assignment-field-label">${typeLabel}</span>
          <strong>${item.type}</strong>
        </div>
        <div class="assignment-field">
          <span class="assignment-field-label">${dueLabel}</span>
          <strong>${item.dueLabel || formatPlanDateLabel(item.dueDateKey || getCurrentAppDateKey())}</strong>
        </div>
      </div>
      <div class="assignment-card-meta">${sourceLabel}: ${item.source || getPlanAssignmentTypeLabel(item.planType)}</div>
      <p class="small">${item.note || (currentLang === "es" ? "Sin nota adicional." : "No additional note.")}</p>
      <div class="assignment-card-meta">${notificationText}</div>
    `;
    const actions = document.createElement("div");
    actions.className = "assignment-card-actions";
    const statusSelect = document.createElement("select");
    statusSelect.className = "assignment-status-select";
    statusSelect.innerHTML = statusOptions;
    actions.appendChild(statusSelect);
    const updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.className = "ghost";
    updateBtn.textContent = updateLabel;
    updateBtn.addEventListener("click", async () => {
      try {
        await updateCoachAssignmentStatus(item.id, statusSelect.value);
        toast(currentLang === "es" ? "Estado actualizado." : "Status updated.");
      } catch (err) {
        console.warn("Assignment status update failed", err);
        toast(currentLang === "es" ? "No se pudo actualizar el estado." : "Could not update the status.");
      }
    });
    actions.appendChild(updateBtn);
    const notifyBtn = document.createElement("button");
    notifyBtn.type = "button";
    notifyBtn.textContent = notifyLabel;
    notifyBtn.addEventListener("click", async () => {
      try {
        await sendCoachAssignmentNotification(item);
        toast(currentLang === "es" ? "Notificacion registrada." : "Notification recorded.");
      } catch (err) {
        console.warn("Assignment notification failed", err);
        toast(currentLang === "es" ? "No se pudo notificar." : "Could not notify athlete.");
      }
    });
    actions.appendChild(notifyBtn);
    if (item.mediaAssetPath) {
      const mediaBtn = document.createElement("button");
      mediaBtn.type = "button";
      mediaBtn.className = "ghost";
      mediaBtn.textContent = mediaLabel;
      mediaBtn.addEventListener("click", () => {
        const url = resolveMediaLocation(item.mediaAssetPath);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
      actions.appendChild(mediaBtn);
    }
    card.appendChild(actions);
    assignmentList.appendChild(card);
  });

  assignmentTypeGrid.innerHTML = "";
  COACH_ASSIGNMENT_TYPES.forEach((item) => {
    const card = document.createElement("article");
    card.className = "assignment-type-card";
    card.innerHTML = `
      <h4>${pickCopy(item.title)}</h4>
      <p class="small">${pickCopy(item.detail)}</p>
      <div class="tag-row">
        ${item.examples.map((example) => `<span class="tag">${pickCopy(example)}</span>`).join("")}
      </div>
    `;
    assignmentTypeGrid.appendChild(card);
  });

  if (assignmentResourceList) {
    assignmentResourceList.innerHTML = "";
    getCoachAssignmentResourceRows().forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      assignmentResourceList.appendChild(li);
    });
  }

  if (assignmentWorkflowList) {
    assignmentWorkflowList.innerHTML = "";
    COACH_ASSIGNMENT_WORKFLOW.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = pickCopy(item);
      assignmentWorkflowList.appendChild(li);
    });
  }
}

function renderCompletionTracking() {
  if (!completionStats || !completionList || !completionAlertsList) return;

  if (completionRowsTitle) completionRowsTitle.textContent = currentLang === "es" ? "Seguimiento por atleta" : "Athlete Follow-Up";
  if (completionAlertsTitle) completionAlertsTitle.textContent = currentLang === "es" ? "Siguiente accion del coach" : "Coach Follow-Up";

  const trackedAthletes = getAthletesData();
  const followUpCount = trackedAthletes.filter((athlete) => {
    const status = getCoachCompletionRow(athlete).status;
    return status === "followup" || status === "overdue" || status === "limited";
  }).length;
  const staleJournalCount = trackedAthletes.filter((athlete) => getAthleteTaskBoard(athlete.name).journalState === "stale").length;
  const assignmentRecords = getCoachAssignmentRecords();

  const stats = [
    {
      title: currentLang === "es" ? "Atletas al dia" : "Athletes on track",
      value: String(trackedAthletes.filter((athlete) => getCoachCompletionRow(athlete).status === "ontrack").length),
      note: currentLang === "es" ? "Sin bloqueos urgentes esta semana" : "No urgent blockers this week"
    },
    {
      title: currentLang === "es" ? "Seguimiento abierto" : "Follow-up open",
      value: String(followUpCount),
      note: currentLang === "es" ? "Requieren mensaje, ajuste o revision" : "Need message, adjustment, or review"
    },
    {
      title: currentLang === "es" ? "Journal pendiente" : "Journal stale",
      value: String(staleJournalCount),
      note: currentLang === "es" ? "Afecta readiness y visibilidad" : "Impacts readiness and visibility"
    },
    {
      title: currentLang === "es" ? "Assignments activos" : "Active assignments",
      value: String(assignmentRecords.filter((item) => item.status === "in_progress" || item.status === "not_started").length),
      note: currentLang === "es" ? "Trabajo abierto que sigue en curso" : "Open work that still needs coach visibility"
    }
  ];

  completionStats.innerHTML = "";
  stats.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<p class="small">${stat.title}</p><h3>${stat.value}</h3><p>${stat.note}</p>`;
    completionStats.appendChild(card);
  });

  completionList.innerHTML = "";
  trackedAthletes.forEach((athlete) => {
    const taskBoard = getAthleteTaskBoard(athlete.name);
    const row = getCoachCompletionRow(athlete);
    const status = getCompletionStatusMeta(row.status);
    const card = document.createElement("article");
    card.className = "completion-card";
    card.innerHTML = `
      <div class="completion-card-top">
        <div>
          <strong>${athlete.name}</strong>
          <div class="small">${athlete.weight} - ${pickCopy(row.plan)}</div>
        </div>
        <span class="status-pill ${status.className}">${status.label}</span>
      </div>
      <div class="completion-card-meta">
        <span>${pickCopy(row.progress)}</span>
        <span>${currentLang === "es" ? `Pendientes: ${taskBoard.tasks.length}` : `Pending: ${taskBoard.tasks.length}`}</span>
        <span>${taskBoard.journalLabel}</span>
      </div>
      <p class="small">${pickCopy(row.followUp)}</p>
    `;
    completionList.appendChild(card);
  });

  completionAlertsList.innerHTML = "";
  trackedAthletes
    .filter((athlete) => getCoachCompletionRow(athlete).status !== "ontrack" || getAthleteTaskBoard(athlete.name).journalState === "stale")
    .forEach((athlete) => {
      const taskBoard = getAthleteTaskBoard(athlete.name);
      const row = getCoachCompletionRow(athlete);
      const li = document.createElement("li");
      li.textContent = `${athlete.name}: ${pickCopy(row.followUp)} ${taskBoard.journalState === "stale" ? `(${taskBoard.journalLabel})` : ""}`.trim();
      completionAlertsList.appendChild(li);
    });
}

if (assignmentFilterAthlete) {
  assignmentFilterAthlete.addEventListener("change", () => {
    assignmentFilterState.athlete = assignmentFilterAthlete.value;
    renderCoachAssignments();
  });
}

if (assignmentFilterStatus) {
  assignmentFilterStatus.addEventListener("change", () => {
    assignmentFilterState.status = assignmentFilterStatus.value;
    renderCoachAssignments();
  });
}

if (assignmentFilterType) {
  assignmentFilterType.addEventListener("change", () => {
    assignmentFilterState.type = assignmentFilterType.value;
    renderCoachAssignments();
  });
}

if (assignmentFilterDate) {
  assignmentFilterDate.addEventListener("change", () => {
    assignmentFilterState.date = assignmentFilterDate.value;
    renderCoachAssignments();
  });
}

if (assignmentFilterClear) {
  assignmentFilterClear.addEventListener("click", () => {
    assignmentFilterState = { athlete: "", status: "", type: "", date: "" };
    renderCoachAssignments();
  });
}

function getParentVerificationMeta(status) {
  const key = normalizeParentVerificationStatus(status);
  if (key === "verified") {
    return {
      label: currentLang === "es" ? "Verificado" : "Verified",
      className: "status-pill status-pill-active"
    };
  }
  return {
    label: currentLang === "es" ? "Pendiente" : "Pending",
    className: "status-pill status-pill-pending"
  };
}

function resolveParentApprovalAthleteRecord(athleteName, fallbackCoachUid = getAuthUser()?.id) {
  const target = normalizeName(athleteName);
  const athlete = getCoachAthleteRecords().find((entry) => normalizeName(entry.name) === target)
    || ATHLETES.find((entry) => normalizeName(entry.name) === target)
    || null;
  if (!athlete) return null;
  return {
    athleteName: athlete.name,
    linkedAthleteId: athlete.id || slugifyKey(athlete.name),
    linkedCoachUid: String(athlete.coachUid || fallbackCoachUid || "").trim(),
    linkedCoachName: String(athlete.coachName || "").trim(),
    linkedCoachEmail: normalizeEmail(athlete.coachEmail || "")
  };
}

function getCoachDirectoryOptions() {
  return coachDirectoryCache.length
    ? coachDirectoryCache
    : [{
        uid: String(getAuthUser()?.id || "").trim(),
        name: String(getProfile()?.name || getAuthUser()?.email || "").trim() || "Coach",
        email: normalizeEmail(getAuthUser()?.email || "")
      }];
}

async function updateParentVerificationRequest(parentRecord, {
  status = "verified",
  coachUid = "",
  coachName = "",
  coachEmail = ""
} = {}) {
  if (!parentRecord?.uid) return;
  const nextStatus = normalizeParentVerificationStatus(status);
  const resolvedAthlete = resolveParentApprovalAthleteRecord(parentRecord.athleteName, coachUid || getAuthUser()?.id);
  if (!resolvedAthlete) {
    throw new Error("parent_athlete_not_found");
  }
  const nextCoachUid = String(coachUid || resolvedAthlete.linkedCoachUid || getAuthUser()?.id || "").trim();
  const nextCoachName = String(coachName || resolvedAthlete.linkedCoachName || getProfile()?.name || "").trim();
  const nextCoachEmail = normalizeEmail(coachEmail || resolvedAthlete.linkedCoachEmail || getAuthUser()?.email || "");
  await persistFirebaseProfile(parentRecord.uid, {
    status: nextStatus,
    athleteName: resolvedAthlete.athleteName,
    linkedAthleteId: resolvedAthlete.linkedAthleteId,
    linkedCoachUid: nextCoachUid,
    linkedCoachName: nextCoachName,
    linkedCoachEmail: nextCoachEmail,
    view: "parent",
    updatedAt: new Date().toISOString()
  }, { required: true });
}

function renderParentApprovalList() {
  if (!parentApprovalList) return;
  parentApprovalList.innerHTML = "";
  if (!canVerifyParentAccounts()) {
    parentApprovalList.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "Solo coach y admin pueden verificar accesos de padres." : "Only coach and admin users can verify parent access."}</p></div>`;
    return;
  }

  if (homeParentApprovalsTitle) {
    homeParentApprovalsTitle.textContent = currentLang === "es" ? "Solicitudes de acceso de padres" : "Parent Access Requests";
  }

  const requests = coachParentApprovalsCache
    .slice()
    .sort((a, b) => parseIsoTimestamp(b.updatedAt || b.createdAt) - parseIsoTimestamp(a.updatedAt || a.createdAt));

  if (!requests.length) {
    parentApprovalList.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "No hay cuentas de padres registradas todavia." : "No parent accounts have registered yet."}</p></div>`;
    return;
  }

  requests.forEach((request) => {
    const card = document.createElement("article");
    card.className = "completion-card";
    const statusMeta = getParentVerificationMeta(request.status);
    const coachOptions = getCoachDirectoryOptions();
    const selectedCoachUid = coachOptions.some((item) => item.uid === request.linkedCoachUid)
      ? request.linkedCoachUid
      : (normalizeAuthRole(getProfile()?.role) === "admin" ? coachOptions[0]?.uid || "" : String(getAuthUser()?.id || ""));
    card.innerHTML = `
      <div class="completion-card-top">
        <div>
          <strong>${escapeHtml(request.name || request.email)}</strong>
          <div class="small">${escapeHtml(request.email)}</div>
        </div>
        <span class="${statusMeta.className}">${statusMeta.label}</span>
      </div>
      <div class="completion-card-meta">
        <span>${currentLang === "es" ? "Atleta" : "Athlete"}: ${escapeHtml(request.athleteName || "-")}</span>
        <span>${currentLang === "es" ? "Coach" : "Coach"}: ${escapeHtml(request.linkedCoachName || coachOptions.find((item) => item.uid === selectedCoachUid)?.name || "-")}</span>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "assignment-card-actions";

    if (normalizeAuthRole(getProfile()?.role) === "admin") {
      const select = document.createElement("select");
      select.className = "assignment-status-select";
      select.innerHTML = coachOptions.map((coach) => (
        `<option value="${escapeHtml(coach.uid)}"${coach.uid === selectedCoachUid ? " selected" : ""}>${escapeHtml(coach.name)}</option>`
      )).join("");
      actions.appendChild(select);
      card.dataset.selectedCoachUid = selectedCoachUid;
      select.addEventListener("change", () => {
        card.dataset.selectedCoachUid = select.value;
      });
    }

    const verifyBtn = document.createElement("button");
    verifyBtn.type = "button";
    verifyBtn.className = "primary";
    verifyBtn.textContent = request.status === "verified"
      ? (currentLang === "es" ? "Re-verificar" : "Re-verify")
      : (currentLang === "es" ? "Verificar acceso" : "Verify access");
    verifyBtn.addEventListener("click", async () => {
      verifyBtn.disabled = true;
      try {
        const selectedUid = card.dataset.selectedCoachUid || selectedCoachUid || String(getAuthUser()?.id || "");
        const selectedCoach = coachOptions.find((coach) => coach.uid === selectedUid) || null;
        await updateParentVerificationRequest(request, {
          status: "verified",
          coachUid: selectedCoach?.uid || selectedUid,
          coachName: selectedCoach?.name || "",
          coachEmail: selectedCoach?.email || ""
        });
        toast(currentLang === "es" ? "Acceso de padre verificado." : "Parent access verified.");
      } catch (err) {
        console.warn("Parent verification failed", err);
        toast(
          err?.message === "parent_athlete_not_found"
            ? (currentLang === "es" ? "No se encontro el atleta para esta solicitud." : "Could not find the athlete for this request.")
            : (currentLang === "es" ? "No se pudo verificar el acceso del padre." : "Could not verify parent access.")
        );
      } finally {
        verifyBtn.disabled = false;
      }
    });
    actions.appendChild(verifyBtn);

    if (request.status === "verified") {
      const pendingBtn = document.createElement("button");
      pendingBtn.type = "button";
      pendingBtn.className = "ghost";
      pendingBtn.textContent = currentLang === "es" ? "Volver a pendiente" : "Set pending";
      pendingBtn.addEventListener("click", async () => {
        pendingBtn.disabled = true;
        try {
          await persistFirebaseProfile(request.uid, {
            status: "pending_verification",
            updatedAt: new Date().toISOString()
          }, { required: true });
          toast(currentLang === "es" ? "Solicitud devuelta a pendiente." : "Request returned to pending.");
        } catch (err) {
          console.warn("Parent request reset failed", err);
          toast(currentLang === "es" ? "No se pudo actualizar la solicitud." : "Could not update the request.");
        } finally {
          pendingBtn.disabled = false;
        }
      });
      actions.appendChild(pendingBtn);
    }

    card.appendChild(actions);
    parentApprovalList.appendChild(card);
  });
}

function renderParentScoutingFeed() {
  if (!homeParentScoutingList) return;
  homeParentScoutingList.innerHTML = "";
  if (homeParentScoutingTitle) {
    homeParentScoutingTitle.textContent = currentLang === "es" ? "Scouting de padres" : "Parent Scouting Feed";
  }
  if (!coachParentScoutingCache.length) {
    homeParentScoutingList.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "Todavia no hay scouting enviado por padres." : "No parent scouting has been submitted yet."}</p></div>`;
    return;
  }

  coachWorkspaceSortByUpdated(coachParentScoutingCache).slice(0, 4).forEach((entry) => {
    const card = document.createElement("article");
    card.className = "completion-card";
    const attachments = Array.isArray(entry.attachments) ? entry.attachments : [];
    const audioCount = entry.audioAttachment?.url ? 1 : 0;
    const targetLabel = entry.subjectType === "teammate"
      ? `${currentLang === "es" ? "Companero" : "Teammate"}: ${entry.targetAthleteName || "-"}`
      : `${currentLang === "es" ? "Atleta" : "Athlete"}: ${entry.athleteName || entry.targetAthleteName || "-"}`;
    card.innerHTML = `
      <div class="completion-card-top">
        <div>
          <strong>${escapeHtml(entry.parentName || entry.parentEmail || "Parent")}</strong>
          <div class="small">${escapeHtml(targetLabel)} - ${escapeHtml(formatAdminTimestamp(entry.updatedAt || entry.createdAt))}</div>
        </div>
        <span class="status-pill status-pill-active">${currentLang === "es" ? "Nuevo" : "New"}</span>
      </div>
      <p class="small">${escapeHtml(entry.text || (currentLang === "es" ? "Sin texto adicional." : "No extra text added."))}</p>
      <div class="completion-card-meta">
        <span>${currentLang === "es" ? "Fotos / video" : "Photos / video"}: ${attachments.length}</span>
        <span>${currentLang === "es" ? "Audio" : "Audio"}: ${audioCount}</span>
      </div>
    `;
    if (attachments.length || audioCount) {
      const actions = document.createElement("div");
      actions.className = "assignment-card-actions";
      attachments.slice(0, 3).forEach((file) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ghost";
        button.textContent = file.type?.startsWith("video")
          ? (currentLang === "es" ? "Abrir video" : "Open video")
          : (currentLang === "es" ? "Abrir foto" : "Open photo");
        button.addEventListener("click", () => {
          if (file.url) window.open(file.url, "_blank", "noopener,noreferrer");
        });
        actions.appendChild(button);
      });
      if (entry.audioAttachment?.url) {
        const audioButton = document.createElement("button");
        audioButton.type = "button";
        audioButton.className = "ghost";
        audioButton.textContent = currentLang === "es" ? "Escuchar audio" : "Play audio";
        audioButton.addEventListener("click", () => {
          window.open(entry.audioAttachment.url, "_blank", "noopener,noreferrer");
        });
        actions.appendChild(audioButton);
      }
      card.appendChild(actions);
    }
    homeParentScoutingList.appendChild(card);
  });
}

// ---------- DASHBOARD ----------
const teamStats = document.getElementById("teamStats");
const alertList = document.getElementById("alertList");
const teamOverview = document.getElementById("teamOverview");
const quickActions = document.getElementById("quickActions");
const homeTasksTitle = document.getElementById("homeTasksTitle");
const homeActionsTitle = document.getElementById("homeActionsTitle");
const homeCompetitionsTitle = document.getElementById("homeCompetitionsTitle");
const homeRecentTrainingTitle = document.getElementById("homeRecentTrainingTitle");
const homeAlertsTitle = document.getElementById("homeAlertsTitle");
const homeParentApprovalsTitle = document.getElementById("homeParentApprovalsTitle");
const homeParentScoutingTitle = document.getElementById("homeParentScoutingTitle");
const homeCompetitions = document.getElementById("homeCompetitions");
const homeRecentTrainings = document.getElementById("homeRecentTrainings");
const parentApprovalList = document.getElementById("parentApprovalList");
const homeParentScoutingList = document.getElementById("homeParentScoutingList");

function renderDashboard() {
  if (homeTasksTitle) homeTasksTitle.textContent = currentLang === "es" ? "Tareas pendientes" : "Pending Tasks";
  if (homeActionsTitle) homeActionsTitle.textContent = currentLang === "es" ? "Accesos rapidos" : "Quick Actions";
  if (homeCompetitionsTitle) homeCompetitionsTitle.textContent = currentLang === "es" ? "Competencias proximas" : "Upcoming Competitions";
  if (homeRecentTrainingTitle) homeRecentTrainingTitle.textContent = currentLang === "es" ? "Entrenamientos recientes" : "Recent Trainings";
  if (homeAlertsTitle) homeAlertsTitle.textContent = currentLang === "es" ? "Alertas importantes" : "Important Alerts";
  if (homeParentApprovalsTitle) homeParentApprovalsTitle.textContent = currentLang === "es" ? "Solicitudes de acceso de padres" : "Parent Access Requests";
  if (homeParentScoutingTitle) homeParentScoutingTitle.textContent = currentLang === "es" ? "Scouting de padres" : "Parent Scouting Feed";

  const athletes = getAthletesData();
  const assignmentRecords = getCoachAssignmentRecords();
  const activeAthletes = athletes.filter((athlete) => normalizeAvailabilityKey(athlete.availability) !== "other").length || athletes.length;
  const pendingTaskCount = assignmentRecords.filter((item) => item.status !== "completed").length
    + athletes.filter((athlete) => getAthleteTaskBoard(athlete.name).journalState === "stale").length;
  const competitionRows = getCoachUpcomingCompetitionRows(3);
  const recentTrainingRows = getCoachRecentTrainingRows(3);
  const dashboardStats = isCoachWorkspaceActive()
    ? [
        {
          title: currentLang === "es" ? "Atletas activos" : "Active athletes",
          value: String(activeAthletes),
          note: currentLang === "es" ? "Roster visible para el coach" : "Roster currently visible to the coach"
        },
        {
          title: currentLang === "es" ? "Tareas pendientes" : "Pending tasks",
          value: String(pendingTaskCount),
          note: currentLang === "es" ? "Asignaciones abiertas + journals pendientes" : "Open assignments plus stale journals"
        },
        {
          title: currentLang === "es" ? "Competencias proximas" : "Upcoming competitions",
          value: String(competitionRows.length),
          note: currentLang === "es" ? "Eventos futuros en calendario" : "Future events on the calendar"
        },
        {
          title: currentLang === "es" ? "Entrenamientos recientes" : "Recent trainings",
          value: String(coachPlansCache.length),
          note: currentLang === "es" ? "Planes guardados en el workspace" : "Plans saved in the workspace"
        }
      ]
    : getTeamStatsData();

  teamStats.innerHTML = "";
  dashboardStats.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<p class="small">${stat.title}</p><h3>${stat.value}</h3><p>${stat.note}</p>`;
    teamStats.appendChild(card);
  });

  teamOverview.innerHTML = "";
  const overviewLines = isCoachWorkspaceActive()
    ? [
        `${coachPlansCache.length} ${currentLang === "es" ? "planes guardados" : "saved plans"}`,
        `${getCoachGroupRecords().length} ${currentLang === "es" ? "grupos listos para asignar" : "groups ready for assignment"}`,
        `${(coachTemplatesCache.length || getBuiltinCoachTemplateSeeds().length)} ${currentLang === "es" ? "plantillas disponibles" : "templates available"}`
      ]
    : getTeamOverviewData();
  overviewLines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    teamOverview.appendChild(li);
  });

  quickActions.innerHTML = "";
  const quickActionTargets = ["coach-athletes", "plans", "assignments", "coach-competition"];
  getQuickActionsData().forEach((action, index) => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = action;
    btn.addEventListener("click", () => showTab(quickActionTargets[index] || "coach-home"));
    quickActions.appendChild(btn);
  });

  if (homeCompetitions) {
    homeCompetitions.innerHTML = "";
    const items = isCoachWorkspaceActive() ? competitionRows : getHomeCompetitionsData();
    items.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.title}</strong><div class="small">${item.detail}</div>`;
      homeCompetitions.appendChild(li);
    });
  }

  if (homeRecentTrainings) {
    homeRecentTrainings.innerHTML = "";
    const items = isCoachWorkspaceActive() ? recentTrainingRows : getHomeRecentTrainingsData();
    items.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.title}</strong><div class="small">${item.detail}</div>`;
      homeRecentTrainings.appendChild(li);
    });
  }

  alertList.innerHTML = "";
  const alerts = isCoachWorkspaceActive() ? getCoachHomeAlerts() : getAlertsData();
  alerts.forEach((alert) => {
    const div = document.createElement("div");
    div.className = "alert";
    div.textContent = alert;
    alertList.appendChild(div);
  });

  renderParentApprovalList();
  renderParentScoutingFeed();
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

// ---------- PARENT PORTAL ----------
const parentStatusChip = document.getElementById("parentStatusChip");
const parentStatusCard = document.getElementById("parentStatusCard");
const parentTrainingCard = document.getElementById("parentTrainingCard");
const parentReadinessCard = document.getElementById("parentReadinessCard");
const parentCoachCard = document.getElementById("parentCoachCard");
const parentAssignmentsCard = document.getElementById("parentAssignmentsCard");
const parentScoutingForm = document.getElementById("parentScoutingForm");
const parentScoutingSubjectType = document.getElementById("parentScoutingSubjectType");
const parentScoutingTargetWrap = document.getElementById("parentScoutingTargetWrap");
const parentScoutingTarget = document.getElementById("parentScoutingTarget");
const parentScoutingFiles = document.getElementById("parentScoutingFiles");
const parentScoutingText = document.getElementById("parentScoutingText");
const parentScoutingSaveBtn = document.getElementById("parentScoutingSaveBtn");
const parentScoutingStatus = document.getElementById("parentScoutingStatus");
const parentScoutingList = document.getElementById("parentScoutingList");
const parentAudioStartBtn = document.getElementById("parentAudioStartBtn");
const parentAudioStopBtn = document.getElementById("parentAudioStopBtn");
const parentAudioClearBtn = document.getElementById("parentAudioClearBtn");
const parentAudioStatus = document.getElementById("parentAudioStatus");
const parentAudioPreview = document.getElementById("parentAudioPreview");
const parentFab = document.getElementById("parentFab");

function clearParentPortalDataListeners() {
  parentPortalDataUnsubs.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // ignore unsubscribe errors
    }
  });
  parentPortalDataUnsubs = [];
}

function resetParentPortalCaches() {
  parentPortalAthleteCache = null;
  parentPortalTeamCache = [];
  parentPortalAssignmentsCache = [];
  parentPortalPlansCache = [];
  parentPortalJournalCache = [];
  parentPortalScoutingCache = [];
  parentPortalPlanFetchKey = "";
}

function stopParentAudioTracks() {
  if (!parentScoutingStream) return;
  parentScoutingStream.getTracks().forEach((track) => track.stop());
  parentScoutingStream = null;
}

function clearParentAudioDraft() {
  if (parentScoutingAudioUrl) {
    URL.revokeObjectURL(parentScoutingAudioUrl);
  }
  parentScoutingAudioUrl = "";
  parentScoutingAudioBlob = null;
  parentScoutingAudioChunks = [];
  if (parentAudioPreview) {
    parentAudioPreview.pause();
    parentAudioPreview.removeAttribute("src");
    parentAudioPreview.classList.add("hidden");
  }
  if (parentAudioStatus) {
    parentAudioStatus.textContent = currentLang === "es" ? "Todavia no hay nota de audio grabada." : "No audio note recorded yet.";
  }
}

function stopParentPortalRealtimeSync() {
  if (parentPortalUserUnsub) {
    try {
      parentPortalUserUnsub();
    } catch {
      // ignore unsubscribe errors
    }
    parentPortalUserUnsub = null;
  }
  clearParentPortalDataListeners();
  resetParentPortalCaches();
  if (parentScoutingRecorder && parentScoutingRecorder.state !== "inactive") {
    parentScoutingRecorder.stop();
  }
  parentScoutingRecorder = null;
  stopParentAudioTracks();
  clearParentAudioDraft();
  renderParentHome();
  renderParentScouting();
  updateParentFab();
}

function getParentPortalLinkedAthlete() {
  if (parentPortalAthleteCache) return parentPortalAthleteCache;
  const athleteName = getParentLinkedAthleteName();
  if (!athleteName) return null;
  return getAthletesData().find((entry) => normalizeName(entry.name) === normalizeName(athleteName))
    || ATHLETES.find((entry) => normalizeName(entry.name) === normalizeName(athleteName))
    || null;
}

function getParentPortalCoachRecord() {
  const linkedCoachUid = getParentLinkedCoachUid();
  return getCoachDirectoryOptions().find((item) => item.uid === linkedCoachUid) || {
    uid: linkedCoachUid,
    name: getParentLinkedCoachName() || "Coach",
    email: getProfile()?.linkedCoachEmail || ""
  };
}

function getParentPortalLatestJournal() {
  return coachWorkspaceSortByUpdated(parentPortalJournalCache)[0] || null;
}

function getParentPortalActiveAssignments() {
  return coachWorkspaceSortByUpdated(parentPortalAssignmentsCache).filter((item) => item.status !== "completed");
}

function getParentPortalPrimaryAssignment() {
  const todayKey = getCurrentAppDateKey();
  const assignments = getParentPortalActiveAssignments();
  return assignments.find((item) => item.dueDateKey === todayKey)
    || assignments.find((item) => item.planId)
    || assignments[0]
    || coachWorkspaceSortByUpdated(parentPortalAssignmentsCache)[0]
    || null;
}

function renderParentAssignmentSummary(record) {
  if (!record) {
    return `<p class="small muted">${currentLang === "es" ? "Todavia no hay trabajo asignado para este atleta." : "No assigned work is available for this athlete yet."}</p>`;
  }
  const status = getAssignmentStatusMeta(record.status);
  const linkedPlan = parentPortalPlansCache.find((plan) => plan.id === record.planId) || null;
  const planLists = linkedPlan
    ? Object.entries(linkedPlan.items || {})
        .filter(([, values]) => Array.isArray(values) && values.length)
        .slice(0, 4)
        .map(([key, values]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(values.join(", "))}</li>`)
        .join("")
    : "";
  return `
    <div class="parent-summary-stack">
      <div class="completion-card-top">
        <div>
          <strong>${escapeHtml(record.title)}</strong>
          <div class="small">${escapeHtml(record.type)} - ${escapeHtml(record.dueLabel || formatPlanDateLabel(record.dueDateKey || getCurrentAppDateKey()))}</div>
        </div>
        <span class="status-pill ${status.className}">${escapeHtml(status.label)}</span>
      </div>
      <p class="small">${escapeHtml(record.note || (currentLang === "es" ? "Sin nota adicional." : "No extra note attached."))}</p>
      ${linkedPlan ? `<div class="small muted">${escapeHtml(linkedPlan.focus || linkedPlan.coachNotes || "")}</div>` : ""}
      ${planLists ? `<ul class="list tight">${planLists}</ul>` : ""}
    </div>
  `;
}

function renderParentReadinessSummary(entry) {
  if (!entry) {
    return `<p class="small muted">${currentLang === "es" ? "Todavia no hay check-in reciente del atleta." : "No recent athlete check-in is available yet."}</p>`;
  }
  const metrics = [
    { label: currentLang === "es" ? "Sueno" : "Sleep", value: entry.sleep || "-" },
    { label: currentLang === "es" ? "Energia" : "Energy", value: entry.energy || "-" },
    { label: currentLang === "es" ? "Fatiga / dolor" : "Fatigue / soreness", value: entry.soreness || "-" },
    { label: currentLang === "es" ? "Animo" : "Mood", value: entry.mood || "-" }
  ];
  return `
    <div class="parent-readiness-grid">
      ${metrics.map((metric) => `
        <div class="parent-readiness-metric">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </div>
      `).join("")}
    </div>
    <p class="small">${escapeHtml(entry.note || (currentLang === "es" ? "Sin observacion adicional del coach." : "No extra coach observation added."))}</p>
  `;
}

function renderParentHome() {
  if (!parentStatusCard || !parentTrainingCard || !parentReadinessCard || !parentCoachCard || !parentAssignmentsCard) return;
  const profile = getProfile() || {};
  const verified = isParentVerified(profile);
  const statusMeta = getParentVerificationMeta(profile.status);
  const athleteName = getParentLinkedAthleteName(profile);
  const coachRecord = getParentPortalCoachRecord();
  const primaryAssignment = getParentPortalPrimaryAssignment();
  const latestJournal = getParentPortalLatestJournal();

  if (parentStatusChip) parentStatusChip.textContent = statusMeta.label;
  if (parentStatusChip) parentStatusChip.className = statusMeta.className;

  if (!verified) {
    parentStatusCard.innerHTML = `
      <h3>${currentLang === "es" ? "Acceso pendiente de verificacion" : "Access pending verification"}</h3>
      <p class="small">${currentLang === "es" ? "La cuenta del padre esta vinculada al atleta indicado, pero el coach debe verificarla antes de desbloquear los datos." : "This parent account is linked to the athlete you entered, but a coach must verify the relationship before athlete data unlocks."}</p>
      <ul class="list tight">
        <li>${currentLang === "es" ? "Atleta solicitado" : "Requested athlete"}: ${escapeHtml(athleteName || "-")}</li>
        <li>${currentLang === "es" ? "Estado" : "Status"}: ${escapeHtml(statusMeta.label)}</li>
      </ul>
    `;
    parentTrainingCard.innerHTML = `<p class="small muted">${currentLang === "es" ? "El plan de hoy aparecera aqui en cuanto el coach verifique el acceso." : "Today's training will appear here as soon as the coach verifies access."}</p>`;
    parentReadinessCard.innerHTML = `<p class="small muted">${currentLang === "es" ? "El readiness snapshot se mostrara aqui despues de la verificacion." : "The readiness snapshot will show here after verification."}</p>`;
    parentCoachCard.innerHTML = `<p class="small muted">${currentLang === "es" ? "Usa Messaging para avisarle al coach que ya solicitaste acceso." : "Use Messaging to let the coach know the parent account is waiting for approval."}</p>`;
    parentAssignmentsCard.innerHTML = `<p class="small muted">${currentLang === "es" ? "Las tareas abiertas del atleta se desbloquean cuando la cuenta este verificada." : "Open athlete work unlocks once the account is verified."}</p>`;
    updateParentFab();
    return;
  }

  parentStatusCard.innerHTML = `
    <h3>${escapeHtml(athleteName || (currentLang === "es" ? "Atleta vinculado" : "Linked athlete"))}</h3>
    <p class="small">${currentLang === "es" ? "Solo lectura del entrenamiento y readiness del atleta, mas un canal rapido para scouting y mensajes." : "Read-only training and readiness access for the athlete, plus a quick scouting and messaging channel."}</p>
    <ul class="list tight">
      <li>${currentLang === "es" ? "Coach vinculado" : "Linked coach"}: ${escapeHtml(coachRecord.name || "-")}</li>
      <li>${currentLang === "es" ? "Estado" : "Status"}: ${escapeHtml(statusMeta.label)}</li>
    </ul>
  `;
  parentTrainingCard.innerHTML = renderParentAssignmentSummary(primaryAssignment);
  parentReadinessCard.innerHTML = renderParentReadinessSummary(latestJournal);
  parentCoachCard.innerHTML = `
    <div class="parent-summary-stack">
      <strong>${escapeHtml(coachRecord.name || "Coach")}</strong>
      <p class="small">${currentLang === "es" ? "Este es el coach conectado a la cuenta del padre. Usa Messaging para enviar fotos, video y preguntas del torneo." : "This is the coach linked to the parent account. Use Messaging to send tournament photos, video, and questions."}</p>
      <div class="row">
        <button type="button" id="parentCoachMessageBtn">${currentLang === "es" ? "Abrir Messaging" : "Open Messaging"}</button>
      </div>
    </div>
  `;
  const openAssignments = getParentPortalActiveAssignments().slice(0, 4);
  parentAssignmentsCard.innerHTML = openAssignments.length
    ? `<ul class="list tight">${openAssignments.map((item) => `<li><strong>${escapeHtml(item.title)}</strong> - ${escapeHtml(getAssignmentStatusMeta(item.status).label)}</li>`).join("")}</ul>`
    : `<p class="small muted">${currentLang === "es" ? "No hay tareas abiertas para este atleta." : "No open tasks for this athlete right now."}</p>`;
  document.getElementById("parentCoachMessageBtn")?.addEventListener("click", async () => {
    showTab("messages");
    if (coachRecord.uid) {
      await openDirectMessageThreadWithRetry(coachRecord.uid);
    }
  });
  updateParentFab();
}

function getParentPortalTeammates() {
  const linkedAthleteId = getParentLinkedAthleteId();
  return parentPortalTeamCache.filter((athlete) => athlete.id !== linkedAthleteId && normalizeName(athlete.name) !== normalizeName(getParentLinkedAthleteName()));
}

function renderParentScouting() {
  if (!parentScoutingList || !parentScoutingTarget || !parentScoutingTargetWrap) return;
  const verified = isParentVerified();
  const teammates = getParentPortalTeammates();
  [
    parentScoutingSubjectType,
    parentScoutingTarget,
    parentScoutingFiles,
    parentScoutingText,
    parentScoutingSaveBtn,
    parentAudioStartBtn,
    parentAudioStopBtn,
    parentAudioClearBtn
  ].filter(Boolean).forEach((control) => {
    control.disabled = !verified;
  });
  if (parentScoutingTargetWrap) {
    parentScoutingTargetWrap.classList.toggle("hidden", (parentScoutingSubjectType?.value || "athlete") !== "teammate");
  }
  parentScoutingTarget.innerHTML = teammates.length
    ? teammates.map((athlete) => `<option value="${escapeHtml(athlete.name)}">${escapeHtml(athlete.name)}</option>`).join("")
    : `<option value="">${currentLang === "es" ? "No hay companeros disponibles" : "No teammates available"}</option>`;
  if (!verified) {
    if (parentScoutingStatus) {
      parentScoutingStatus.textContent = currentLang === "es" ? "Scouting se desbloquea cuando el coach verifique la cuenta." : "Scouting unlocks after the coach verifies the parent account.";
    }
    parentScoutingList.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "La subida de fotos, videos y audio estara disponible una vez la cuenta quede verificada." : "Photo, video, and audio uploads become available once the parent account is verified."}</p></div>`;
    return;
  }

  if (parentScoutingStatus && !parentScoutingStatus.textContent) {
    parentScoutingStatus.textContent = "";
  }
  parentScoutingList.innerHTML = "";
  if (!parentPortalScoutingCache.length) {
    parentScoutingList.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "Todavia no hay scouting notes subidas desde esta cuenta." : "No scouting notes have been uploaded from this account yet."}</p></div>`;
    return;
  }

  coachWorkspaceSortByUpdated(parentPortalScoutingCache).forEach((item) => {
    const card = document.createElement("article");
    card.className = "completion-card";
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    const targetLabel = item.subjectType === "teammate"
      ? `${currentLang === "es" ? "Companero" : "Teammate"}: ${item.targetAthleteName || "-"}`
      : `${currentLang === "es" ? "Mi atleta" : "My athlete"}: ${item.targetAthleteName || getParentLinkedAthleteName()}`;
    card.innerHTML = `
      <div class="completion-card-top">
        <div>
          <strong>${escapeHtml(targetLabel)}</strong>
          <div class="small">${escapeHtml(formatAdminTimestamp(item.updatedAt || item.createdAt))}</div>
        </div>
        <span class="status-pill status-pill-active">${currentLang === "es" ? "Enviado" : "Sent"}</span>
      </div>
      <p class="small">${escapeHtml(item.text || (currentLang === "es" ? "Sin texto adicional." : "No extra text added."))}</p>
      <div class="completion-card-meta">
        <span>${currentLang === "es" ? "Adjuntos" : "Attachments"}: ${attachments.length}</span>
        <span>${currentLang === "es" ? "Audio" : "Audio"}: ${item.audioAttachment?.url ? "1" : "0"}</span>
      </div>
    `;
    if (attachments.length || item.audioAttachment?.url) {
      const links = document.createElement("div");
      links.className = "assignment-card-actions";
      attachments.forEach((file) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ghost";
        btn.textContent = file.type?.startsWith("video") ? (currentLang === "es" ? "Abrir video" : "Open video") : (currentLang === "es" ? "Abrir foto" : "Open photo");
        btn.addEventListener("click", () => window.open(file.url, "_blank", "noopener,noreferrer"));
        links.appendChild(btn);
      });
      if (item.audioAttachment?.url) {
        const audioBtn = document.createElement("button");
        audioBtn.type = "button";
        audioBtn.className = "ghost";
        audioBtn.textContent = currentLang === "es" ? "Escuchar audio" : "Play audio";
        audioBtn.addEventListener("click", () => window.open(item.audioAttachment.url, "_blank", "noopener,noreferrer"));
        links.appendChild(audioBtn);
      }
      card.appendChild(links);
    }
    parentScoutingList.appendChild(card);
  });
}

async function refreshParentPortalPlansFromAssignments() {
  const coachUid = getParentLinkedCoachUid();
  const planIds = Array.from(new Set(parentPortalAssignmentsCache.map((item) => item.planId).filter(Boolean))).sort();
  const nextKey = `${coachUid}:${planIds.join("|")}`;
  if (nextKey === parentPortalPlanFetchKey) return;
  parentPortalPlanFetchKey = nextKey;
  if (!coachUid || !planIds.length) {
    parentPortalPlansCache = [];
    renderParentHome();
    return;
  }
  const plansRef = getCoachWorkspaceCollectionRef("plans", coachUid);
  if (!plansRef) {
    parentPortalPlansCache = [];
    renderParentHome();
    return;
  }
  const snapshots = await Promise.all(planIds.map((planId) => withTimeout(
    plansRef.doc(planId).get(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_parent_plan_read_timeout"
  ).catch(() => null)));
  parentPortalPlansCache = snapshots
    .filter((snapshot) => snapshot?.exists)
    .map((snapshot) => normalizeCoachPlanRecord(snapshot.id, snapshot.data() || {}));
  renderParentHome();
}

function refreshParentPortalDataSync() {
  clearParentPortalDataListeners();
  resetParentPortalCaches();
  const profile = getProfile();
  const authUser = getAuthUser();
  if (!isParentRole(profile?.role) || !authUser?.id || !firebaseFirestoreInstance) {
    renderParentHome();
    renderParentScouting();
    updateParentFab();
    return;
  }
  if (!isParentVerified(profile) || !getParentLinkedCoachUid(profile) || !getParentLinkedAthleteName(profile)) {
    renderParentHome();
    renderParentScouting();
    updateParentFab();
    return;
  }
  const coachUid = getParentLinkedCoachUid(profile);
  const athleteId = getParentLinkedAthleteId(profile);
  const athleteName = getParentLinkedAthleteName(profile);
  const workspaceAthletesRef = getCoachWorkspaceCollectionRef("athletes", coachUid);
  const assignmentsRef = getCoachWorkspaceCollectionRef("assignments", coachUid);
  const journalRef = getCoachWorkspaceCollectionRef("journal_entries", coachUid);
  const scoutingRef = getCoachWorkspaceCollectionRef("parent_scouting", coachUid);
  if (!workspaceAthletesRef || !assignmentsRef || !journalRef || !scoutingRef) return;

  parentPortalDataUnsubs.push(
    workspaceAthletesRef.doc(athleteId).onSnapshot((snapshot) => {
      parentPortalAthleteCache = snapshot.exists
        ? normalizeCoachAthleteRecord(snapshot.id, snapshot.data() || {})
        : null;
      renderParentHome();
      renderParentScouting();
    }, (err) => console.warn("Parent athlete sync failed", err)),
    workspaceAthletesRef.onSnapshot((snapshot) => {
      parentPortalTeamCache = snapshot.docs.map((doc) => normalizeCoachAthleteRecord(doc.id, doc.data() || {}));
      renderParentScouting();
    }, (err) => console.warn("Parent teammate sync failed", err)),
    assignmentsRef.where("assigneeNames", "array-contains", athleteName).onSnapshot((snapshot) => {
      parentPortalAssignmentsCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachAssignmentRecord(doc.id, doc.data() || {}))
      );
      refreshParentPortalPlansFromAssignments().catch((err) => console.warn("Parent plan refresh failed", err));
      renderParentHome();
    }, (err) => console.warn("Parent assignment sync failed", err)),
    journalRef.where("athleteName", "==", athleteName).onSnapshot((snapshot) => {
      parentPortalJournalCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeCoachJournalRecord(doc.id, doc.data() || {}))
      );
      renderParentHome();
    }, (err) => console.warn("Parent journal sync failed", err)),
    scoutingRef.where("parentUid", "==", authUser.id).onSnapshot((snapshot) => {
      parentPortalScoutingCache = coachWorkspaceSortByUpdated(
        snapshot.docs.map((doc) => normalizeParentScoutingRecord(doc.id, doc.data() || {}))
      );
      renderParentScouting();
    }, (err) => console.warn("Parent scouting sync failed", err))
  );

  renderParentHome();
  renderParentScouting();
  updateParentFab();
}

function startParentPortalRealtimeSync() {
  const authUser = getAuthUser();
  const profile = getProfile();
  if (!isParentRole(profile?.role) || !authUser?.id || !firebaseFirestoreInstance) {
    stopParentPortalRealtimeSync();
    return;
  }
  if (parentPortalUserUnsub) return;
  parentPortalUserUnsub = firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(authUser.id).onSnapshot((snapshot) => {
    if (!snapshot.exists) return;
    const currentProfile = getProfile() || {};
    const nextProfile = normalizeProfileForAuth({ ...currentProfile, ...snapshot.data() }, authUser);
    const shouldRefresh = normalizeParentVerificationStatus(currentProfile.status) !== normalizeParentVerificationStatus(nextProfile.status)
      || getParentLinkedCoachUid(currentProfile) !== getParentLinkedCoachUid(nextProfile)
      || getParentLinkedAthleteName(currentProfile) !== getParentLinkedAthleteName(nextProfile);
    setProfile(nextProfile, { sync: false });
    if (shouldRefresh) {
      refreshParentPortalDataSync();
      renderMessages();
    }
    renderParentHome();
    renderParentScouting();
    updateParentFab();
  }, (err) => console.warn("Parent profile sync failed", err));
  refreshParentPortalDataSync();
}

async function uploadParentScoutingAssets(files = []) {
  const uploads = [];
  for (const file of files) {
    if (file.size <= PARENT_INLINE_MEDIA_MAX_BYTES) {
      const inlineUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("parent_inline_media_read_failed"));
        reader.readAsDataURL(file);
      });
      uploads.push({
        name: file.name,
        type: file.type,
        url: inlineUrl,
        storage: "firestore_inline",
        size: file.size
      });
      continue;
    }
    const url = await uploadMediaFileToFirebase(file);
    uploads.push({
      name: file.name,
      type: file.type,
      url,
      storage: "firebase_storage",
      size: file.size
    });
  }
  return uploads;
}

async function saveParentScoutingNote(event) {
  event?.preventDefault?.();
  const profile = getProfile();
  const authUser = getAuthUser();
  if (!isParentVerified(profile) || !authUser?.id) {
    if (parentScoutingStatus) {
      parentScoutingStatus.textContent = currentLang === "es" ? "El coach debe verificar esta cuenta primero." : "A coach must verify this account first.";
    }
    return;
  }
  const coachUid = getParentLinkedCoachUid(profile);
  const scoutingRef = getCoachWorkspaceCollectionRef("parent_scouting", coachUid);
  if (!scoutingRef) return;
  const subjectType = parentScoutingSubjectType?.value || "athlete";
  const targetAthleteName = subjectType === "teammate"
    ? String(parentScoutingTarget?.value || "").trim()
    : getParentLinkedAthleteName(profile);
  const text = String(parentScoutingText?.value || "").trim();
  const files = Array.from(parentScoutingFiles?.files || []);
  if (!targetAthleteName || (!text && !files.length && !parentScoutingAudioBlob)) {
    if (parentScoutingStatus) {
      parentScoutingStatus.textContent = currentLang === "es" ? "Agrega texto, fotos, video o audio antes de enviar." : "Add text, photos, video, or audio before sending.";
    }
    return;
  }
  if (parentScoutingSaveBtn) parentScoutingSaveBtn.disabled = true;
  if (parentScoutingStatus) {
    parentScoutingStatus.textContent = currentLang === "es" ? "Subiendo scouting note..." : "Uploading scouting note...";
  }
  try {
    const attachments = await uploadParentScoutingAssets(files);
    let audioAttachment = null;
    if (parentScoutingAudioBlob) {
      const audioFile = new File([parentScoutingAudioBlob], `parent-audio-${Date.now()}.webm`, { type: parentScoutingAudioBlob.type || "audio/webm" });
      audioAttachment = (await uploadParentScoutingAssets([audioFile]))[0] || null;
    }
    await withTimeout(
      scoutingRef.add(stripUndefinedDeep({
        parentUid: authUser.id,
        parentName: String(profile.name || "").trim(),
        parentEmail: normalizeEmail(profile.email || authUser.email || ""),
        athleteName: getParentLinkedAthleteName(profile),
        athleteId: getParentLinkedAthleteId(profile),
        subjectType,
        targetAthleteName,
        text,
        attachments,
        audioAttachment,
        createdAt: getFirestoreServerTimestamp(),
        updatedAt: getFirestoreServerTimestamp()
      })),
      FIREBASE_OP_TIMEOUT_MS * 4,
      "firestore_parent_scouting_write_timeout"
    );
    if (parentScoutingText) parentScoutingText.value = "";
    if (parentScoutingFiles) parentScoutingFiles.value = "";
    clearParentAudioDraft();
    if (parentScoutingStatus) {
      parentScoutingStatus.textContent = currentLang === "es" ? "Scouting note enviada al coach." : "Scouting note sent to the coach.";
    }
  } catch (err) {
    console.warn("Parent scouting save failed", err);
    if (parentScoutingStatus) {
      const detail = String(err?.code || err?.message || "");
      parentScoutingStatus.textContent = /storage|cors|network|failed/i.test(detail)
        ? (currentLang === "es"
            ? "La subida grande necesita Firebase Storage. Usa una foto o clip mas pequeno, o entra desde la app publicada."
            : "Large uploads need Firebase Storage. Use a smaller photo or clip, or upload from the published app.")
        : (currentLang === "es" ? "No se pudo enviar la scouting note." : "Could not send the scouting note.");
    }
  } finally {
    if (parentScoutingSaveBtn) parentScoutingSaveBtn.disabled = false;
  }
}

async function startParentAudioRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("audio_recording_not_supported");
  }
  clearParentAudioDraft();
  stopParentAudioTracks();
  parentScoutingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  parentScoutingAudioChunks = [];
  parentScoutingRecorder = new MediaRecorder(parentScoutingStream);
  parentScoutingRecorder.addEventListener("dataavailable", (event) => {
    if (event.data?.size) {
      parentScoutingAudioChunks.push(event.data);
    }
  });
  parentScoutingRecorder.addEventListener("stop", () => {
    const mimeType = parentScoutingRecorder?.mimeType || "audio/webm";
    parentScoutingAudioBlob = new Blob(parentScoutingAudioChunks, { type: mimeType });
    parentScoutingAudioUrl = URL.createObjectURL(parentScoutingAudioBlob);
    if (parentAudioPreview) {
      parentAudioPreview.src = parentScoutingAudioUrl;
      parentAudioPreview.classList.remove("hidden");
    }
    if (parentAudioStatus) {
      parentAudioStatus.textContent = currentLang === "es" ? "Nota de audio lista para enviar." : "Audio note ready to send.";
    }
    stopParentAudioTracks();
    parentScoutingRecorder = null;
  });
  parentScoutingRecorder.start();
  if (parentAudioStatus) {
    parentAudioStatus.textContent = currentLang === "es" ? "Grabando audio..." : "Recording audio...";
  }
}

function stopParentAudioRecording() {
  if (parentScoutingRecorder && parentScoutingRecorder.state !== "inactive") {
    parentScoutingRecorder.stop();
  } else {
    stopParentAudioTracks();
  }
}

function updateParentFab() {
  if (!parentFab) return;
  const showFab = currentView === "parent" && isParentVerified();
  parentFab.classList.toggle("hidden", !showFab);
}

if (parentScoutingSubjectType) {
  parentScoutingSubjectType.addEventListener("change", () => {
    renderParentScouting();
  });
}

if (parentScoutingForm) {
  parentScoutingForm.addEventListener("submit", saveParentScoutingNote);
}

if (parentAudioStartBtn) {
  parentAudioStartBtn.addEventListener("click", async () => {
    try {
      await startParentAudioRecording();
    } catch (err) {
      console.warn("Parent audio recording failed", err);
      if (parentAudioStatus) {
        parentAudioStatus.textContent = currentLang === "es" ? "No se pudo iniciar la grabacion de audio." : "Could not start audio recording.";
      }
    }
  });
}

if (parentAudioStopBtn) {
  parentAudioStopBtn.addEventListener("click", () => {
    stopParentAudioRecording();
  });
}

if (parentAudioClearBtn) {
  parentAudioClearBtn.addEventListener("click", () => {
    clearParentAudioDraft();
  });
}

if (parentFab) {
  parentFab.addEventListener("click", () => {
    if (!isParentVerified()) {
      showTab("parent-home");
      parentStatusCard?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    showTab("parent-scouting");
    if (parentScoutingFiles) {
      parentScoutingFiles.click();
    }
  });
}

// ---------- ATHLETE MANAGEMENT ----------
const athleteFilters = document.getElementById("athleteFilters");
const athleteList = document.getElementById("athleteList");
const athleteSearchInput = document.getElementById("athleteSearchInput");
const coachAthleteProfileCardTitle = document.querySelector("#coachAthleteProfileCard .card-header h2");
const coachAthleteProfileCardChip = document.querySelector("#coachAthleteProfileCard .card-header .chip");
const coachAthleteProfileAvatar = document.getElementById("coachAthleteProfileAvatar");
const coachAthleteProfileName = document.getElementById("coachAthleteProfileName");
const coachAthleteProfileMeta = document.getElementById("coachAthleteProfileMeta");
const coachAthleteProfileStatus = document.getElementById("coachAthleteProfileStatus");
const coachAthleteProfileContent = document.getElementById("coachAthleteProfileContent");
const coachAthleteProfileTabButtons = Array.from(document.querySelectorAll("[data-coach-profile-tab]"));
let selectedCoachTags = new Set();
let athleteSearchQuery = "";
let currentCoachAthleteProfileTab = "identity";

const COACH_ATHLETE_PROFILE_TAB_COPY = {
  identity: { en: "Identity", es: "Identidad" },
  style: { en: "Style", es: "Estilo" },
  performance: { en: "Performance", es: "Rendimiento" },
  notes: { en: "Coach Notes", es: "Notas del entrenador" },
  corner: { en: "Corner View", es: "Vista de esquina" }
};

function athleteMatchesTagFilter(tags = []) {
  const normalized = normalizeSmartTags(tags);
  if (!selectedCoachTags.size) return true;
  return normalized.some((tag) => selectedCoachTags.has(tag));
}

function getRawAthleteRecord(name) {
  return getCoachAthleteRecords().find((athlete) => athlete.name === name) || ATHLETES.find((athlete) => athlete.name === name) || null;
}

function getRawJournalEntry(name) {
  return getLatestCoachJournalRecord(name) || JOURNAL_ATHLETES.find((entry) => entry.name === name) || null;
}

function getLocalizedJournalEntry(name) {
  const live = getLatestCoachJournalRecord(name);
  if (live) {
    return {
      name: live.athleteName,
      sleep: live.sleep,
      energy: live.energy,
      soreness: live.soreness,
      mood: live.mood,
      weight: live.weight,
      note: live.note,
      entryDate: live.entryDate
    };
  }
  return getJournalAthletesData().find((entry) => entry.name === name) || null;
}

function parseScoreValue(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function parseHoursValue(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function normalizeAvailabilityKey(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.startsWith("avail") || raw.startsWith("disp")) return "available";
  if (raw.startsWith("limit")) return "limited";
  if (raw.startsWith("travel") || raw.startsWith("via")) return "travel";
  return "other";
}

function getAthleteTaskBoard(name) {
  const entry = ATHLETE_TASK_BOARD[name] || {};
  const liveAssignments = getPlanAssignmentsForAthlete(name);
  const pendingAssignments = liveAssignments
    .filter((assignment) => assignment.status !== "completed")
    .map((assignment) => assignment.title || assignment.type)
    .filter(Boolean);
  const journalState = getCoachJournalState(name) || entry.journal?.state || "fresh";
  return {
    tasks: uniqueNames([
      ...(entry.tasks || []).map((item) => pickCopy(item)),
      ...pendingAssignments
    ]),
    journalState,
    journalLabel: journalState === "stale"
      ? pickCopy({
          en: "Journal overdue by 1 day",
          es: "El journal tiene 1 dia de atraso"
        })
      : pickCopy(entry.journal?.label || {
          en: "Updated today",
          es: "Actualizado hoy"
        })
  };
}

function localizeCornerItems(items = [], { translateMoves = false } = {}) {
  return items
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") {
        return translateMoves ? translateTechnique(item) : item;
      }
      return pickCopy(item);
    })
    .filter(Boolean);
}

function getAthleteCornerPlan(athlete) {
  if (!athlete) return null;
  const saved = getOnePagerData(athlete.name) || {};
  const plan = ATHLETE_CORNER_PLANS[athlete.name] || {};
  const attacks = topThree(athlete.offenseTop3 || athlete.techniques?.neutral || []);
  const setups = localizeCornerItems(plan.setups || [], { translateMoves: true });
  const cuesFromSaved = localizeCornerItems(saved.cueWords || []);
  const coachCues = cuesFromSaved.length
    ? cuesFromSaved
    : localizeCornerItems(plan.coachCues || []);
  const mentalReminders = localizeCornerItems(plan.mentalReminders || []);
  const planA = saved.plan || pickCopy(plan.planA || { en: athlete.strategyA || athlete.coachSignal || "", es: athlete.strategyA || athlete.coachSignal || "" });
  const planB = pickCopy(plan.planB || { en: athlete.strategyB || athlete.preferred || "", es: athlete.strategyB || athlete.preferred || "" });
  const planC = pickCopy(plan.planC || { en: athlete.strategyC || athlete.notes || "", es: athlete.strategyC || athlete.notes || "" });
  const pressureErrors = [
    athlete.pressureError,
    ...localizeCornerItems(plan.pressureErrors || [])
  ].filter(Boolean);
  const physicalLimitations = [
    athlete.injuryNotes,
    ...localizeCornerItems(plan.physicalLimitations || [])
  ].filter(Boolean);
  const safetyWarnings = [
    saved.injuryNotes,
    ...localizeCornerItems(plan.safetyWarnings || [])
  ].filter(Boolean);
  const competitionCue = saved.cueNotes || athlete.coachSignal || coachCues[0] || "";

  return {
    attacks: localizeCornerItems(attacks, { translateMoves: true }),
    setups,
    planA,
    planB,
    planC,
    coachCues,
    pressureErrors: Array.from(new Set(pressureErrors)),
    physicalLimitations: Array.from(new Set(physicalLimitations)),
    safetyWarnings: Array.from(new Set(safetyWarnings)),
    mentalReminders,
    competitionCue
  };
}

function getAthleteAlerts(athlete) {
  const rawAthlete = getRawAthleteRecord(athlete.name) || athlete;
  const rawJournal = getRawJournalEntry(athlete.name);
  const alerts = [];
  const availability = normalizeAvailabilityKey(rawAthlete.availability);
  const rawNotes = String(rawAthlete.notes || "").toLowerCase();
  const soreness = parseScoreValue(rawJournal?.soreness);
  const sleep = parseHoursValue(rawJournal?.sleep);
  const weightTrend = String(rawJournal?.weight || "").toLowerCase();

  if (availability === "limited" || rawNotes.includes("injury")) {
    alerts.push(currentLang === "es" ? "Lesion o limitacion activa" : "Injury or limitation active");
  }
  if (availability === "travel") {
    alerts.push(currentLang === "es" ? "Viaje o competencia fuera del club" : "Travel or away from club");
  }
  if (soreness >= 4) {
    alerts.push(currentLang === "es" ? "Dolor alto reportado en journal" : "High soreness reported in journal");
  }
  if (sleep && sleep < 6.5) {
    alerts.push(currentLang === "es" ? "Sueno bajo en los ultimos reportes" : "Low sleep in recent check-ins");
  }
  if (weightTrend.includes("cut") || weightTrend.includes("down")) {
    alerts.push(currentLang === "es" ? "Seguimiento de peso requerido" : "Weight management follow-up");
  }

  return Array.from(new Set(alerts)).slice(0, 3);
}

function buildAthleteIndicatorBadges(athlete, board, alerts) {
  const availabilityKey = normalizeAvailabilityKey(getRawAthleteRecord(athlete.name)?.availability || athlete.availability);
  const badges = [];

  if (availabilityKey === "available") {
    badges.push({
      label: currentLang === "es" ? "Activo" : "Active",
      className: "status-pill status-pill-active"
    });
  } else if (availabilityKey === "limited") {
    badges.push({
      label: currentLang === "es" ? "Limitado" : "Limited",
      className: "status-pill status-pill-limited"
    });
  } else if (availabilityKey === "travel") {
    badges.push({
      label: currentLang === "es" ? "Viaje" : "Travel",
      className: "status-pill status-pill-travel"
    });
  }

  if (board.tasks.length) {
    badges.push({
      label: currentLang === "es" ? `${board.tasks.length} pendientes` : `${board.tasks.length} pending`,
      className: "status-pill status-pill-pending"
    });
  }

  if (board.journalState === "stale") {
    badges.push({
      label: currentLang === "es" ? "Journal sin actualizar" : "Journal stale",
      className: "status-pill status-pill-journal"
    });
  }

  if (alerts.length) {
    badges.push({
      label: currentLang === "es" ? `${alerts.length} alertas` : `${alerts.length} alerts`,
      className: "status-pill status-pill-alert"
    });
  }

  return badges;
}

function athleteMatchesSearch(athlete) {
  const board = getAthleteTaskBoard(athlete.name);
  const alerts = getAthleteAlerts(athlete);
  if (!athleteSearchQuery) return true;
  const haystack = [
    athlete.name,
    athlete.weight,
    athlete.weightClass,
    athlete.style,
    athlete.availability,
    athlete.preferred,
    athlete.notes,
    board.tasks.join(" "),
    alerts.join(" ")
  ].join(" ").toLowerCase();
  return haystack.includes(athleteSearchQuery);
}

function syncCoachMatchAthleteSelect() {
  if (!coachMatchSelect) return;
  const athletes = getAthletesData();
  const currentValue = coachMatchSelect.value;
  coachMatchSelect.innerHTML = "";
  athletes.forEach((athlete) => {
    const option = document.createElement("option");
    option.value = athlete.name;
    option.textContent = athlete.name;
    coachMatchSelect.appendChild(option);
  });
  const nextValue = athletes.some((athlete) => athlete.name === currentValue) ? currentValue : athletes[0]?.name || "";
  coachMatchSelect.value = nextValue;
}

function getSelectedCoachAthleteName() {
  return coachMatchSelect?.value || getAthletesData()[0]?.name || "";
}

function renderCoachAthleteProfile(athleteName = getSelectedCoachAthleteName()) {
  if (!coachAthleteProfileName || !coachAthleteProfileMeta || !coachAthleteProfileContent) return;

  if (coachAthleteProfileCardTitle) {
    coachAthleteProfileCardTitle.textContent = currentLang === "es" ? "Perfil del atleta" : "Athlete Profile";
  }
  if (coachAthleteProfileCardChip) {
    coachAthleteProfileCardChip.textContent = currentLang === "es" ? "Atleta seleccionado" : "Selected athlete";
  }
  coachAthleteProfileTabButtons.forEach((btn) => {
    const tabKey = btn.dataset.coachProfileTab;
    if (!tabKey) return;
    btn.textContent = pickCopy(COACH_ATHLETE_PROFILE_TAB_COPY[tabKey] || { en: tabKey, es: tabKey });
    btn.classList.toggle("active", tabKey === currentCoachAthleteProfileTab);
  });

  const athlete = getAthletesData().find((item) => item.name === athleteName);
  const notSet = currentLang === "es" ? "No definido" : "Not set";
  const selectPrompt = currentLang === "es" ? "Selecciona un atleta" : "Select an athlete";
  const selectHint = currentLang === "es"
    ? "Elige un atleta de la lista para ver su perfil centralizado."
    : "Choose an athlete from the list to view the centralized profile.";

  if (!athlete) {
    if (coachAthleteProfileAvatar) coachAthleteProfileAvatar.textContent = "AT";
    coachAthleteProfileName.textContent = selectPrompt;
    coachAthleteProfileMeta.textContent = selectHint;
    if (coachAthleteProfileStatus) coachAthleteProfileStatus.innerHTML = "";
    coachAthleteProfileContent.innerHTML = `<div class="mini-card"><h3>${selectPrompt}</h3><p class="small muted">${selectHint}</p></div>`;
    return;
  }

  const board = getAthleteTaskBoard(athlete.name);
  const localizedJournal = getLocalizedJournalEntry(athlete.name);
  const alerts = getAthleteAlerts(athlete);
  const badges = buildAthleteIndicatorBadges(athlete, board, alerts);
  const rawAthlete = getRawAthleteRecord(athlete.name) || athlete;
  const cornerPlan = getAthleteCornerPlan(rawAthlete);
  const noteBoard = getCoachNoteRecord(athlete.name);
  const latestAnalysis = getLatestCoachMatchAnalysisForAthlete(athlete.name);
  const initials = athlete.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AT";
  const experienceYears = athlete.experienceYears
    ? `${athlete.experienceYears} ${currentLang === "es" ? "anos" : athlete.experienceYears === 1 ? "year" : "years"}`
    : notSet;
  const favoritePosition = translateOptionValue("aFavoritePosition", rawAthlete.favoritePosition) || athlete.favoritePosition || notSet;
  const offense = translateTechniqueList(rawAthlete.offenseTop3 || []).join(", ") || notSet;
  const defense = translateTechniqueList(rawAthlete.defenseTop3 || []).join(", ") || notSet;
  const tags = normalizeSmartTags(rawAthlete.tags).map((tag) => formatSmartTag(tag)).join(" • ") || notSet;
  const meta = [athlete.weight, `${currentLang === "es" ? "Cat." : "Class"} ${athlete.weightClass || notSet}`, athlete.style].filter(Boolean).join(" • ");
  const taskListHtml = board.tasks.length
    ? `<ul class="list tight">${board.tasks.map((task) => `<li>${task}</li>`).join("")}</ul>`
    : `<p class="small muted">${currentLang === "es" ? "No hay tareas pendientes." : "No pending tasks."}</p>`;
  const alertListHtml = alerts.length
    ? `<ul class="list tight">${alerts.map((alert) => `<li>${alert}</li>`).join("")}</ul>`
    : `<p class="small muted">${currentLang === "es" ? "Sin alertas activas." : "No active alerts."}</p>`;
  const readinessListHtml = localizedJournal
    ? `
      <ul class="list tight">
        <li><strong>${currentLang === "es" ? "Sueno" : "Sleep"}:</strong> ${localizedJournal.sleep || notSet}</li>
        <li><strong>${currentLang === "es" ? "Energia" : "Energy"}:</strong> ${localizedJournal.energy || notSet}</li>
        <li><strong>${currentLang === "es" ? "Dolor" : "Soreness"}:</strong> ${localizedJournal.soreness || notSet}</li>
        <li><strong>${currentLang === "es" ? "Animo" : "Mood"}:</strong> ${localizedJournal.mood || notSet}</li>
        <li><strong>${currentLang === "es" ? "Tendencia de peso" : "Weight trend"}:</strong> ${localizedJournal.weight || notSet}</li>
      </ul>
    `
    : `<p class="small muted">${currentLang === "es" ? "No hay journal reciente." : "No recent journal update."}</p>`;

  if (coachAthleteProfileAvatar) coachAthleteProfileAvatar.textContent = initials;
  coachAthleteProfileName.textContent = athlete.name;
  coachAthleteProfileMeta.textContent = meta || selectHint;

  if (coachAthleteProfileStatus) {
    coachAthleteProfileStatus.innerHTML = badges
      .map((badge) => `<span class="${badge.className}">${badge.label}</span>`)
      .join("");
  }

  const profileSections = {
    identity: `
      <div class="coach-profile-section-grid">
        <div class="mini-card">
          <h3>${pickCopy(COACH_ATHLETE_PROFILE_TAB_COPY.identity)}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Nombre" : "Name"}:</strong> ${athlete.name || notSet}</li>
            <li><strong>${currentLang === "es" ? "Peso actual" : "Current weight"}:</strong> ${athlete.weight || notSet}</li>
            <li><strong>${currentLang === "es" ? "Categoria" : "Weight class"}:</strong> ${athlete.weightClass || notSet}</li>
            <li><strong>${currentLang === "es" ? "Nivel" : "Level"}:</strong> ${athlete.level || notSet}</li>
            <li><strong>${currentLang === "es" ? "Estado actual" : "Current status"}:</strong> ${athlete.availability || notSet}</li>
          </ul>
        </div>
        <div class="mini-card">
          <h3>${currentLang === "es" ? "Estado rapido" : "Quick status"}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Journal" : "Journal"}:</strong> ${board.journalLabel}</li>
            <li><strong>${currentLang === "es" ? "Tareas pendientes" : "Pending tasks"}:</strong> ${board.tasks.length}</li>
            <li><strong>${currentLang === "es" ? "Alertas activas" : "Active alerts"}:</strong> ${alerts.length}</li>
            <li><strong>${currentLang === "es" ? "Experiencia" : "Experience"}:</strong> ${experienceYears}</li>
            <li><strong>${currentLang === "es" ? "Historial" : "History"}:</strong> ${athlete.history || notSet}</li>
          </ul>
        </div>
      </div>
    `,
    style: `
      <div class="coach-profile-section-grid">
        <div class="mini-card">
          <h3>${pickCopy(COACH_ATHLETE_PROFILE_TAB_COPY.style)}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Estilo" : "Style"}:</strong> ${athlete.style || notSet}</li>
            <li><strong>${currentLang === "es" ? "Posicion favorita" : "Favorite position"}:</strong> ${favoritePosition}</li>
            <li><strong>${currentLang === "es" ? "Estrategia" : "Strategy"}:</strong> ${athlete.strategy || notSet}</li>
            <li><strong>${currentLang === "es" ? "Ataques preferidos" : "Preferred attacks"}:</strong> ${athlete.preferred || notSet}</li>
          </ul>
        </div>
        <div class="mini-card">
          <h3>${currentLang === "es" ? "Movimientos clave" : "Key movements"}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Top offense" : "Top offense"}:</strong> ${offense}</li>
            <li><strong>${currentLang === "es" ? "Top defense" : "Top defense"}:</strong> ${defense}</li>
            <li><strong>${currentLang === "es" ? "Internacional" : "International"}:</strong> ${athlete.international || notSet}</li>
            <li><strong>${currentLang === "es" ? "Tags" : "Tags"}:</strong> ${tags}</li>
          </ul>
        </div>
      </div>
    `,
    performance: `
      <div class="coach-profile-section-grid">
        <div class="mini-card">
          <h3>${currentLang === "es" ? "Journal y readiness" : "Journal and readiness"}</h3>
          ${readinessListHtml}
        </div>
        <div class="mini-card">
          <h3>${pickCopy(COACH_ATHLETE_PROFILE_TAB_COPY.performance)}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Experiencia" : "Experience"}:</strong> ${experienceYears}</li>
            <li><strong>${currentLang === "es" ? "Nivel" : "Level"}:</strong> ${athlete.level || notSet}</li>
            <li><strong>${currentLang === "es" ? "Posicion base" : "Base position"}:</strong> ${athlete.position || notSet}</li>
            <li><strong>${currentLang === "es" ? "Historial reciente" : "Recent history"}:</strong> ${athlete.history || notSet}</li>
          </ul>
        </div>
      </div>
    `,
    notes: `
      <div class="coach-profile-section-grid">
        <div class="mini-card">
          <h3>${pickCopy(COACH_ATHLETE_PROFILE_TAB_COPY.notes)}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Enfoque actual" : "Current focus"}:</strong> ${(noteBoard?.nextFocus || []).slice(0, 3).join(" • ") || athlete.notes || notSet}</li>
            <li><strong>${currentLang === "es" ? "Coach signal" : "Coach signal"}:</strong> ${rawAthlete.coachSignal || notSet}</li>
            <li><strong>${currentLang === "es" ? "Journal" : "Journal"}:</strong> ${board.journalLabel}</li>
            <li><strong>${currentLang === "es" ? "Ultimo match analysis" : "Latest match analysis"}:</strong> ${latestAnalysis?.summary || notSet}</li>
          </ul>
        </div>
        <div class="mini-card">
          <h3>${currentLang === "es" ? "Pendientes y alertas" : "Pending work and alerts"}</h3>
          <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Tareas pendientes" : "Pending tasks"}</p>
          ${taskListHtml}
          <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Alertas" : "Alerts"}</p>
          ${alertListHtml}
          <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Notas recientes" : "Recent notes"}</p>
          ${(noteBoard?.recentNotes || []).length ? `<ul class="list tight">${noteBoard.recentNotes.slice(0, 3).map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p class="small muted">${currentLang === "es" ? "No hay notas recientes." : "No recent notes yet."}</p>`}
        </div>
      </div>
    `,
    corner: `
      <div class="coach-profile-section-grid">
        <div class="mini-card">
          <h3>${pickCopy(COACH_ATHLETE_PROFILE_TAB_COPY.corner)}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Top 3 ataques" : "Top 3 attacks"}:</strong> ${cornerPlan?.attacks.join(", ") || offense}</li>
            <li><strong>${currentLang === "es" ? "Top 3 setups" : "Top 3 setups"}:</strong> ${cornerPlan?.setups.join(", ") || notSet}</li>
            <li><strong>Plan A:</strong> ${cornerPlan?.planA || notSet}</li>
            <li><strong>Plan B:</strong> ${cornerPlan?.planB || notSet}</li>
            <li><strong>Plan C:</strong> ${cornerPlan?.planC || notSet}</li>
          </ul>
        </div>
        <div class="mini-card">
          <h3>${currentLang === "es" ? "Cues y seguridad" : "Cues and safety"}</h3>
          <ul class="list tight">
            <li><strong>${currentLang === "es" ? "Cues del coach" : "Coach cues"}:</strong> ${cornerPlan?.coachCues.join(", ") || notSet}</li>
            <li><strong>${currentLang === "es" ? "Errores bajo presion" : "Pressure errors"}:</strong> ${cornerPlan?.pressureErrors.join(" - ") || notSet}</li>
            <li><strong>${currentLang === "es" ? "Limitaciones fisicas" : "Physical limitations"}:</strong> ${cornerPlan?.physicalLimitations.join(" - ") || notSet}</li>
            <li><strong>${currentLang === "es" ? "Advertencias de seguridad" : "Safety warnings"}:</strong> ${cornerPlan?.safetyWarnings.join(" - ") || notSet}</li>
            <li><strong>${currentLang === "es" ? "Recordatorios mentales" : "Mental reminders"}:</strong> ${cornerPlan?.mentalReminders.join(" - ") || notSet}</li>
          </ul>
          <p class="small muted">${currentLang === "es" ? "Abre la vista completa de corner o entra directo a Competition." : "Open the full corner view or jump straight into Competition."}</p>
          <div class="row">
            <button type="button" id="coachProfileOpenSummaryBtn" class="primary">${currentLang === "es" ? "Abrir Athlete Summary" : "Open Athlete Summary"}</button>
            <button type="button" id="coachProfileOpenCompetitionBtn">${currentLang === "es" ? "Abrir Competition" : "Open Competition"}</button>
          </div>
        </div>
      </div>
    `
  };

  coachAthleteProfileContent.innerHTML = profileSections[currentCoachAthleteProfileTab] || profileSections.identity;

  const coachProfileOpenSummaryBtn = document.getElementById("coachProfileOpenSummaryBtn");
  if (coachProfileOpenSummaryBtn) {
    coachProfileOpenSummaryBtn.addEventListener("click", () => openAthleteSummaryView(athlete.name));
  }

  const coachProfileOpenCompetitionBtn = document.getElementById("coachProfileOpenCompetitionBtn");
  if (coachProfileOpenCompetitionBtn) {
    coachProfileOpenCompetitionBtn.addEventListener("click", () => {
      selectCoachMatchAthlete(athlete.name);
      showTab("coach-competition");
    });
  }
}

coachAthleteProfileTabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextTab = btn.dataset.coachProfileTab;
    if (!nextTab) return;
    currentCoachAthleteProfileTab = nextTab;
    renderCoachAthleteProfile(getSelectedCoachAthleteName());
  });
});

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
  if (athleteSearchInput && athleteSearchInput.value !== athleteSearchQuery) {
    athleteSearchInput.value = athleteSearchQuery;
  }

  athleteList.innerHTML = "";
  const athleteSummaryLabel = currentLang === "es" ? "Abrir resumen" : "Open athlete summary";
  const emptyLabel = currentLang === "es"
    ? "No hay atletas con esos filtros."
    : "No athletes match those filters.";
  const athletes = getAthletesData();
  const filtered = athletes.filter((athlete) => athleteMatchesTagFilter(athlete.tags) && athleteMatchesSearch(athlete));

  let selectedName = getSelectedCoachAthleteName();
  if (filtered.length && !filtered.some((athlete) => athlete.name === selectedName)) {
    selectedName = filtered[0].name;
    if (coachMatchSelect) coachMatchSelect.value = selectedName;
  }

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "mini-card";
    empty.innerHTML = `<h3>${emptyLabel}</h3>`;
    athleteList.appendChild(empty);
    renderCoachAthleteProfile("");
    return;
  }

  filtered.forEach((athlete) => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    card.classList.toggle("active", athlete.name === selectedName);
    const board = getAthleteTaskBoard(athlete.name);
    const alerts = getAthleteAlerts(athlete);
    const badges = buildAthleteIndicatorBadges(athlete, board, alerts);
    const taskSummary = board.tasks.length
      ? board.tasks.slice(0, 2).join(" - ")
      : (currentLang === "es" ? "Sin tareas pendientes" : "No pending tasks");
    const alertSummary = alerts.length
      ? alerts.slice(0, 2).join(" - ")
      : (currentLang === "es" ? "Sin alertas activas" : "No active alerts");
    const meta = [athlete.weight, `${currentLang === "es" ? "Cat." : "Class"} ${athlete.weightClass || "-"}`, athlete.style].join(" • ");
    card.innerHTML = `
      <div class="athlete-card-header">
        <div>
          <h4>${athlete.name}</h4>
          <div class="small athlete-card-meta">${meta}</div>
        </div>
        <div class="athlete-card-status">
          ${badges.map((badge) => `<span class="${badge.className}">${badge.label}</span>`).join("")}
        </div>
      </div>
      <div class="athlete-card-section">
        <span class="small athlete-card-label">${currentLang === "es" ? "Estado actual" : "Current status"}</span>
        <p class="small">${athlete.availability}</p>
      </div>
      <div class="athlete-card-section">
        <span class="small athlete-card-label">${currentLang === "es" ? "Tareas pendientes" : "Pending tasks"}</span>
        <p class="small">${taskSummary}</p>
      </div>
      <div class="athlete-card-section">
        <span class="small athlete-card-label">${currentLang === "es" ? "Journal" : "Journal"}</span>
        <p class="small">${board.journalLabel}</p>
      </div>
      <div class="athlete-card-section">
        <span class="small athlete-card-label">${currentLang === "es" ? "Alertas" : "Alerts"}</span>
        <p class="small">${alertSummary}</p>
      </div>
    `;
    card.addEventListener("click", () => {
      selectCoachMatchAthlete(athlete.name);
    });
    const btn = document.createElement("button");
    btn.textContent = athleteSummaryLabel;
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openAthleteSummaryView(athlete.name);
    });
    card.appendChild(btn);
    athleteList.appendChild(card);
  });

  renderCoachAthleteProfile(selectedName);
  const selectedAthlete = athletes.find((athlete) => athlete.name === selectedName);
  if (selectedName) {
    renderCoachMatchView(selectedName);
  }
  if (selectedAthlete) {
    renderCompetitionPreview(selectedAthlete);
  }
}

if (athleteSearchInput) {
  athleteSearchInput.addEventListener("input", () => {
    athleteSearchQuery = athleteSearchInput.value.trim().toLowerCase();
    renderAthleteManagement();
  });
}

const athleteNotesFocus = document.getElementById("athleteNotesFocus");
const athleteNotesRecent = document.getElementById("athleteNotesRecent");
const athleteNotesSelectedAthlete = document.getElementById("athleteNotesSelectedAthlete");
const coachAthleteNotesForm = document.getElementById("coachAthleteNotesForm");
const coachAthleteFocus1 = document.getElementById("coachAthleteFocus1");
const coachAthleteFocus2 = document.getElementById("coachAthleteFocus2");
const coachAthleteFocus3 = document.getElementById("coachAthleteFocus3");
const coachAthleteRecentNote = document.getElementById("coachAthleteRecentNote");
const coachAthleteNotesStatus = document.getElementById("coachAthleteNotesStatus");
const coachAthleteNotesClearBtn = document.getElementById("coachAthleteNotesClearBtn");

function renderAthleteNotes() {
  if (!athleteNotesFocus || !athleteNotesRecent) return;
  const athleteName = getSelectedCoachAthleteName();
  const athlete = getAthletesData().find((item) => item.name === athleteName) || getAthletesData()[0];
  const noteBoard = getCoachNoteRecord(athlete?.name) || getCoachNoteRecord("Jaime Espinal");
  const latestPlan = athlete ? getLatestCoachPlanForAthlete(athlete.name) : null;
  const openAssignments = athlete ? getPlanAssignmentsForAthlete(athlete.name).filter((item) => item.status !== "completed") : [];

  const focusItems = [
    ...(noteBoard?.nextFocus || []).map((item) => getSeedCopyValue(item)),
    latestPlan
      ? `${currentLang === "es" ? "Plan activo" : "Active plan"}: ${latestPlan.title}`
      : "",
    openAssignments[0]
      ? `${currentLang === "es" ? "Siguiente tarea" : "Next task"}: ${openAssignments[0].title}`
      : ""
  ].filter(Boolean).slice(0, 4);

  const recentItems = (noteBoard?.recentNotes || []).map((item) => getSeedCopyValue(item)).slice(0, 3);

  athleteNotesFocus.innerHTML = focusItems
    .map((line) => `<li>${line}</li>`)
    .join("");
  athleteNotesRecent.innerHTML = recentItems
    .map((line) => `<li>${line}</li>`)
    .join("");
  if (athleteNotesSelectedAthlete) {
    athleteNotesSelectedAthlete.textContent = athlete?.name
      ? `${currentLang === "es" ? "Atleta seleccionado" : "Selected athlete"}: ${athlete.name}`
      : (currentLang === "es" ? "Selecciona un atleta." : "Select an athlete.");
  }
  const editableFocus = (noteBoard?.nextFocus || []).map((item) => getSeedCopyValue(item));
  if (coachAthleteFocus1) coachAthleteFocus1.value = editableFocus[0] || "";
  if (coachAthleteFocus2) coachAthleteFocus2.value = editableFocus[1] || "";
  if (coachAthleteFocus3) coachAthleteFocus3.value = editableFocus[2] || "";
}

// ---------- JOURNAL MONITOR ----------
const journalInsights = document.getElementById("journalInsights");
const journalFlags = document.getElementById("journalFlags");
const journalAthletes = document.getElementById("journalAthletes");
const coachJournalSelectedAthlete = document.getElementById("coachJournalSelectedAthlete");
const coachJournalForm = document.getElementById("coachJournalForm");
const coachJournalSleep = document.getElementById("coachJournalSleep");
const coachJournalEnergy = document.getElementById("coachJournalEnergy");
const coachJournalSoreness = document.getElementById("coachJournalSoreness");
const coachJournalMood = document.getElementById("coachJournalMood");
const coachJournalWeight = document.getElementById("coachJournalWeight");
const coachJournalNote = document.getElementById("coachJournalNote");
const coachJournalStatus = document.getElementById("coachJournalStatus");
const coachJournalClearBtn = document.getElementById("coachJournalClearBtn");
const coachJournalRecentList = document.getElementById("coachJournalRecentList");

function renderJournalMonitor() {
  if (!journalInsights || !journalFlags || !journalAthletes) return;
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

  const selectedAthleteName = getSelectedCoachAthleteName();
  const selectedJournal = getLatestCoachJournalRecord(selectedAthleteName);
  if (coachJournalSelectedAthlete) {
    coachJournalSelectedAthlete.textContent = selectedAthleteName
      ? `${currentLang === "es" ? "Atleta seleccionado" : "Selected athlete"}: ${selectedAthleteName}`
      : (currentLang === "es" ? "Selecciona un atleta." : "Select an athlete.");
  }
  if (coachJournalSleep) coachJournalSleep.value = selectedJournal?.sleep || "";
  if (coachJournalEnergy) coachJournalEnergy.value = selectedJournal?.energy || "";
  if (coachJournalSoreness) coachJournalSoreness.value = selectedJournal?.soreness || "";
  if (coachJournalMood) coachJournalMood.value = selectedJournal?.mood || "";
  if (coachJournalWeight) coachJournalWeight.value = selectedJournal?.weight || "";
  if (coachJournalNote) coachJournalNote.value = selectedJournal?.note || "";

  if (coachJournalRecentList) {
    coachJournalRecentList.innerHTML = "";
    const recentEntries = selectedAthleteName ? getCoachJournalRecordSetForAthlete(selectedAthleteName).slice(0, 4) : [];
    if (!recentEntries.length) {
      coachJournalRecentList.innerHTML = `<div class="mini-card"><p class="small muted">${currentLang === "es" ? "Todavia no hay entradas guardadas." : "No readiness entries saved yet."}</p></div>`;
    } else {
      recentEntries.forEach((entry) => {
        const card = document.createElement("article");
        card.className = "completion-card";
        card.innerHTML = `
          <div class="completion-card-top">
            <div>
              <strong>${formatPlanDateLabel(entry.entryDate)}</strong>
              <div class="small">${sleepLabel}: ${entry.sleep || "-"} • ${energyLabel}: ${entry.energy || "-"}</div>
            </div>
            <span class="status-pill ${getCoachJournalState(selectedAthleteName) === "stale" ? "status-pill-journal" : "status-pill-active"}">${getCoachJournalState(selectedAthleteName) === "stale" ? (currentLang === "es" ? "Atrasado" : "Stale") : (currentLang === "es" ? "Al dia" : "Fresh")}</span>
          </div>
          <div class="completion-card-meta">
            <span>${sorenessLabel}: ${entry.soreness || "-"}</span>
            <span>${moodLabel}: ${entry.mood || "-"}</span>
            <span>${weightLabel}: ${entry.weight || "-"}</span>
          </div>
          <p class="small">${entry.note || (currentLang === "es" ? "Sin nota adicional." : "No additional note.")}</p>
        `;
        coachJournalRecentList.appendChild(card);
      });
    }
  }
}

async function saveCoachAthleteNotes(event) {
  event?.preventDefault?.();
  const athleteName = getSelectedCoachAthleteName();
  const notesRef = getCoachWorkspaceCollectionRef("coach_notes");
  if (!athleteName || !notesRef) return;
  const nextFocus = [coachAthleteFocus1?.value, coachAthleteFocus2?.value, coachAthleteFocus3?.value]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const newNote = String(coachAthleteRecentNote?.value || "").trim();
  const existing = getCoachNoteRecord(athleteName);
  const recentNotes = uniqueNames([
    newNote,
    ...(existing?.recentNotes || [])
  ]).slice(0, 6);
  try {
    await withTimeout(
      notesRef.doc(slugifyKey(athleteName)).set(stripUndefinedDeep({
        athleteName,
        nextFocus,
        recentNotes,
        updatedAt: getFirestoreServerTimestamp(),
        createdAt: existing ? undefined : getFirestoreServerTimestamp()
      }), { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_note_write_timeout"
    );
    if (coachAthleteRecentNote) coachAthleteRecentNote.value = "";
    if (coachAthleteNotesStatus) {
      coachAthleteNotesStatus.textContent = currentLang === "es" ? "Notas guardadas." : "Notes saved.";
    }
  } catch (err) {
    console.warn("Coach notes save failed", err);
    if (coachAthleteNotesStatus) {
      coachAthleteNotesStatus.textContent = currentLang === "es" ? "No se pudieron guardar las notas." : "Could not save notes.";
    }
  }
}

async function saveCoachJournalEntry(event) {
  event?.preventDefault?.();
  const athleteName = getSelectedCoachAthleteName();
  const journalRef = getCoachWorkspaceCollectionRef("journal_entries");
  if (!athleteName || !journalRef) return;
  const entryDate = getCurrentAppDateKey();
  const payload = {
    athleteName,
    entryDate,
    sleep: String(coachJournalSleep?.value || "").trim(),
    energy: String(coachJournalEnergy?.value || "").trim(),
    soreness: String(coachJournalSoreness?.value || "").trim(),
    mood: String(coachJournalMood?.value || "").trim(),
    weight: String(coachJournalWeight?.value || "").trim(),
    note: String(coachJournalNote?.value || "").trim()
  };
  try {
    await withTimeout(
      journalRef.doc(`${slugifyKey(athleteName)}-${entryDate}`).set({
        ...payload,
        updatedAt: getFirestoreServerTimestamp(),
        createdAt: getFirestoreServerTimestamp()
      }, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_journal_write_timeout"
    );
    if (coachJournalStatus) {
      coachJournalStatus.textContent = currentLang === "es" ? "Journal guardado." : "Journal entry saved.";
    }
  } catch (err) {
    console.warn("Coach journal save failed", err);
    if (coachJournalStatus) {
      coachJournalStatus.textContent = currentLang === "es" ? "No se pudo guardar el journal." : "Could not save the journal entry.";
    }
  }
}

if (coachAthleteNotesForm) {
  coachAthleteNotesForm.addEventListener("submit", saveCoachAthleteNotes);
}

if (coachAthleteNotesClearBtn) {
  coachAthleteNotesClearBtn.addEventListener("click", () => {
    [coachAthleteFocus1, coachAthleteFocus2, coachAthleteFocus3, coachAthleteRecentNote].forEach((field) => {
      if (field) field.value = "";
    });
  });
}

if (coachJournalForm) {
  coachJournalForm.addEventListener("submit", saveCoachJournalEntry);
}

if (coachJournalClearBtn) {
  coachJournalClearBtn.addEventListener("click", () => {
    [coachJournalSleep, coachJournalEnergy, coachJournalSoreness, coachJournalMood, coachJournalWeight, coachJournalNote].forEach((field) => {
      if (field) field.value = "";
    });
  });
}

// ---------- PERMISSIONS ----------
const permissionsCan = document.getElementById("permissionsCan");
const permissionsCannot = document.getElementById("permissionsCannot");
const ADMIN_EDITABLE_ROLES = ["coach", "athlete", "parent"];
let adminUsersCache = [];
let adminUsersLoading = false;
let adminUsersLoadedOnce = false;

const ADMIN_USERS_COPY = {
  title: { en: "Registered users", es: "Usuarios registrados" },
  reload: { en: "Refresh list", es: "Actualizar lista" },
  loading: { en: "Loading registered users...", es: "Cargando usuarios registrados..." },
  hint: { en: "Only admins can edit user accounts.", es: "Solo admins pueden editar cuentas de usuarios." },
  sessionExpired: {
    en: "Admin session expired. Please log out and log in again.",
    es: "La sesion de admin expiro. Cierra sesion e inicia nuevamente."
  },
  empty: { en: "No registered users found.", es: "No se encontraron usuarios registrados." },
  save: { en: "Save", es: "Save" },
  saving: { en: "Saving...", es: "Saving..." },
  saved: { en: "User updated.", es: "User updated." },
  loadError: {
    en: "Could not load users. Check Firestore rules/config.",
    es: "No se pudieron cargar usuarios. Revisa reglas/configuracion de Firestore."
  },
  saveError: { en: "Could not save this user.", es: "No se pudo guardar este usuario." },
  name: { en: "Name", es: "Nombre" },
  email: { en: "Email", es: "Correo" },
  role: { en: "Role", es: "Role" },
  language: { en: "Language", es: "Idioma" },
  view: { en: "Default view", es: "Vista por defecto" },
  updated: { en: "Updated", es: "Actualizado" },
  uid: { en: "UID", es: "UID" }
};

function parseIsoTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : 0;
}

function formatAdminTimestamp(value) {
  const ts = parseIsoTimestamp(value);
  if (!ts) return currentLang === "es" ? "Sin fecha" : "No date";
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function setAdminUsersStatus(message, { type = "" } = {}) {
  if (!adminUsersStatus) return;
  adminUsersStatus.textContent = message || "";
  adminUsersStatus.classList.remove("admin-users-status-error", "admin-users-status-ok");
  if (type === "error") adminUsersStatus.classList.add("admin-users-status-error");
  if (type === "ok") adminUsersStatus.classList.add("admin-users-status-ok");
}

function normalizeManagedUserRecord(uid, data = {}) {
  const role = normalizeAuthRole(data.role);
  const lang = resolveLang(data.lang || DEFAULT_LANG);
  const view = resolveViewForRole(role, data.view || getDefaultViewForRole(role));
  return {
    uid: String(uid || "").trim(),
    email: String(data.email || "").trim().toLowerCase(),
    name: String(data.name || "").trim(),
    role,
    lang,
    view,
    status: normalizeParentVerificationStatus(data.status),
    athleteName: String(data.athleteName || data.linkedAthleteName || "").trim(),
    linkedAthleteId: String(data.linkedAthleteId || "").trim(),
    linkedCoachUid: String(data.linkedCoachUid || "").trim(),
    linkedCoachName: String(data.linkedCoachName || "").trim(),
    linkedCoachEmail: normalizeEmail(data.linkedCoachEmail || ""),
    updatedAt: String(data.updatedAt || ""),
    createdAt: String(data.createdAt || "")
  };
}

function makeOptionsHtml(values, selected, getLabel) {
  return values
    .map((value) => {
      const isSelected = value === selected ? " selected" : "";
      const label = escapeHtml(getLabel(value));
      return `<option value="${escapeHtml(value)}"${isSelected}>${label}</option>`;
    })
    .join("");
}

function getRoleLabelEnglish(role) {
  const labels = {
    coach: "Coach",
    athlete: "Athlete",
    parent: "Parent"
  };
  return labels[normalizeAuthRole(role)] || "Athlete";
}

function getAdminEditableRolesForUser() {
  return ADMIN_EDITABLE_ROLES;
}

function getAdminEditableViewsForRole(role) {
  const normalizedRole = normalizeAuthRole(role);
  return ROLE_ALLOWED_VIEWS[normalizedRole] || ROLE_ALLOWED_VIEWS.athlete;
}

async function fetchRegisteredFirebaseUsers() {
  if (!firebaseFirestoreInstance) {
    const err = new Error("firestore_not_configured");
    err.code = "firestore_not_configured";
    throw err;
  }
  const snapshot = await withTimeout(
    firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).get(),
    FIREBASE_OP_TIMEOUT_MS * 2,
    "firestore_users_read_timeout"
  );
  const users = snapshot.docs
    .map((doc) => normalizeManagedUserRecord(doc.id, doc.data() || {}))
    .filter((user) => Boolean(user.uid));
  users.sort((a, b) => parseIsoTimestamp(b.updatedAt || b.createdAt) - parseIsoTimestamp(a.updatedAt || a.createdAt));
  return users;
}

function getLangLabel(lang) {
  const map = LANG_NAME_COPY[resolveLang(currentLang)] || LANG_NAME_COPY.en;
  return map[lang] || lang;
}

function getViewLabel(view) {
  return VIEW_LABELS[view]?.[resolveLang(currentLang)] || VIEW_LABELS[view]?.en || view;
}

function renderAdminUsersList() {
  if (!adminUsersList) return;
  adminUsersList.innerHTML = "";

  if (!adminUsersCache.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(ADMIN_USERS_COPY.empty);
    adminUsersList.appendChild(empty);
    return;
  }

  const labels = {
    name: pickCopy(ADMIN_USERS_COPY.name),
    email: pickCopy(ADMIN_USERS_COPY.email),
    role: pickCopy(ADMIN_USERS_COPY.role),
    language: pickCopy(ADMIN_USERS_COPY.language),
    view: pickCopy(ADMIN_USERS_COPY.view),
    save: pickCopy(ADMIN_USERS_COPY.save),
    updated: pickCopy(ADMIN_USERS_COPY.updated),
    uid: pickCopy(ADMIN_USERS_COPY.uid)
  };

  adminUsersCache.forEach((user) => {
    const row = document.createElement("div");
    row.className = "admin-user-row";
    row.dataset.uid = user.uid;

    const roleOptions = makeOptionsHtml(getAdminEditableRolesForUser(), user.role, (value) => getRoleLabelEnglish(value));
    const langOptions = makeOptionsHtml(Array.from(SUPPORTED_LANGS), user.lang, (value) => getLangLabel(value));
    const viewOptions = makeOptionsHtml(getAdminEditableViewsForRole(user.role), user.view, (value) => getViewLabel(value));
    const updated = formatAdminTimestamp(user.updatedAt || user.createdAt);

    row.innerHTML = `
      <div class="admin-user-cell">
        <label>${escapeHtml(labels.name)}</label>
        <input type="text" data-field="name" value="${escapeHtml(user.name)}" placeholder="${escapeHtml(labels.name)}">
        <div class="admin-user-meta">${escapeHtml(labels.uid)}: ${escapeHtml(user.uid)}</div>
      </div>
      <div class="admin-user-cell">
        <label>${escapeHtml(labels.email)}</label>
        <input type="email" data-field="email" value="${escapeHtml(user.email)}" readonly>
        <div class="admin-user-meta">${escapeHtml(labels.updated)}: ${escapeHtml(updated)}</div>
      </div>
      <div class="admin-user-cell">
        <label>${escapeHtml(labels.role)}</label>
        <select data-field="role">${roleOptions}</select>
      </div>
      <div class="admin-user-cell">
        <label>${escapeHtml(labels.language)}</label>
        <select data-field="lang">${langOptions}</select>
      </div>
      <div class="admin-user-cell">
        <label>${escapeHtml(labels.view)}</label>
        <select data-field="view">${viewOptions}</select>
      </div>
      <div class="admin-user-actions">
        <button type="button" class="primary" data-field="save">${escapeHtml(labels.save)}</button>
      </div>
    `;

    const roleSelect = row.querySelector('select[data-field="role"]');
    const viewSelect = row.querySelector('select[data-field="view"]');
    if (roleSelect && viewSelect) {
      roleSelect.addEventListener("change", () => {
        const nextRole = normalizeAuthRole(roleSelect.value);
        const allowedViews = getAdminEditableViewsForRole(nextRole);
        const fallbackView = getDefaultViewForRole(nextRole);
        const nextViewValue = allowedViews.includes(viewSelect.value) ? viewSelect.value : fallbackView;
        viewSelect.innerHTML = makeOptionsHtml(allowedViews, nextViewValue, (value) => getViewLabel(value));
        viewSelect.value = nextViewValue;
      });
    }

    const saveBtn = row.querySelector('button[data-field="save"]');
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (!canManageAllAccounts()) {
          setAdminUsersStatus(pickCopy(ADMIN_USERS_COPY.sessionExpired), { type: "error" });
          return;
        }
        const nameInput = row.querySelector('input[data-field="name"]');
        const emailInput = row.querySelector('input[data-field="email"]');
        const langSelectEl = row.querySelector('select[data-field="lang"]');
        const nextRole = normalizeAuthRole(roleSelect?.value || user.role);
        const nextView = resolveViewForRole(nextRole, viewSelect?.value || user.view);
        const nextName = String(nameInput?.value || "").trim();
        const nextEmail = String(emailInput?.value || user.email).trim().toLowerCase();
        const nextLang = resolveLang(langSelectEl?.value || user.lang);
        const now = new Date().toISOString();

        saveBtn.disabled = true;
        saveBtn.textContent = pickCopy(ADMIN_USERS_COPY.saving);
        try {
          await persistFirebaseProfile(user.uid, {
            name: nextName,
            email: nextEmail,
            role: nextRole,
            lang: nextLang,
            view: nextView,
            updatedAt: now
          }, { required: true });

          adminUsersCache = adminUsersCache.map((item) => (
            item.uid === user.uid
              ? { ...item, name: nextName, email: nextEmail, role: nextRole, lang: nextLang, view: nextView, updatedAt: now }
              : item
          ));

          const authUser = getAuthUser();
          if (authUser?.id === user.uid) {
            const nextAuthUser = { ...authUser, role: nextRole, email: nextEmail };
            setAuthUser(nextAuthUser);
            const currentProfile = getProfile() || {};
            const nextProfile = normalizeProfileForAuth(
              { ...currentProfile, name: nextName, email: nextEmail, role: nextRole, lang: nextLang, view: nextView },
              nextAuthUser
            );
            setProfile(nextProfile);
            await applyProfile(nextProfile);
          }

          setAdminUsersStatus(pickCopy(ADMIN_USERS_COPY.saved), { type: "ok" });
          await refreshAdminUsers({ force: true });
          renderPermissions();
        } catch (err) {
          console.warn("Failed to save managed user profile", err);
          const code = err?.code || err?.message || "";
          const detail = authErrorMessage(code, "");
          const base = pickCopy(ADMIN_USERS_COPY.saveError);
          setAdminUsersStatus(detail ? `${base} ${detail}` : base, { type: "error" });
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = pickCopy(ADMIN_USERS_COPY.save);
        }
      });
    }

    adminUsersList.appendChild(row);
  });
}

async function refreshAdminUsers({ force = false } = {}) {
  if (!canManageAllAccounts()) {
    adminUsersCache = [];
    adminUsersLoadedOnce = false;
    if (adminUsersList) adminUsersList.innerHTML = "";
    setAdminUsersStatus(pickCopy(ADMIN_USERS_COPY.hint));
    return;
  }
  if (adminUsersLoading) return;
  if (adminUsersLoadedOnce && !force) {
    renderAdminUsersList();
    return;
  }

  adminUsersLoading = true;
  setAdminUsersStatus(pickCopy(ADMIN_USERS_COPY.loading));
  try {
    adminUsersCache = await fetchRegisteredFirebaseUsers();
    adminUsersLoadedOnce = true;
    renderAdminUsersList();
    setAdminUsersStatus(`${adminUsersCache.length} ${pickCopy(ADMIN_USERS_COPY.title).toLowerCase()}`, { type: "ok" });
  } catch (err) {
    console.warn("Failed to load registered users", err);
    setAdminUsersStatus(pickCopy(ADMIN_USERS_COPY.loadError), { type: "error" });
    if (adminUsersList) adminUsersList.innerHTML = "";
  } finally {
    adminUsersLoading = false;
  }
}

function maybeRefreshAdminUsers({ force = false } = {}) {
  refreshAdminUsers({ force }).catch((err) => {
    console.warn("Unexpected admin user refresh failure", err);
  });
}

if (adminUsersReloadBtn) {
  adminUsersReloadBtn.addEventListener("click", () => {
    maybeRefreshAdminUsers({ force: true });
  });
}

function renderPermissions() {
  if (!permissionsCan || !permissionsCannot) return;
  const role = getProfile()?.role;
  const permissions = getPermissionsData(role);
  const isAdmin = isAdminRole(role);

  const canTitle = permissionsCan.closest(".mini-card")?.querySelector("h3");
  const cannotTitle = permissionsCannot.closest(".mini-card")?.querySelector("h3");
  if (canTitle) canTitle.textContent = isAdmin
    ? (currentLang === "es" ? "Admin puede" : "Admin Can")
    : (currentLang === "es" ? "Coach puede" : "Coach Can");
  if (cannotTitle) cannotTitle.textContent = isAdmin
    ? (currentLang === "es" ? "Admin no puede" : "Admin Cannot")
    : (currentLang === "es" ? "Coach no puede" : "Coach Cannot");

  permissionsCan.innerHTML = "";
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

  if (adminUsersTitle) adminUsersTitle.textContent = pickCopy(ADMIN_USERS_COPY.title);
  if (adminUsersReloadBtn) adminUsersReloadBtn.textContent = pickCopy(ADMIN_USERS_COPY.reload);
  if (!canManageAllAccounts()) {
    if (adminUsersList) adminUsersList.innerHTML = "";
    setAdminUsersStatus(pickCopy(ADMIN_USERS_COPY.hint));
  } else {
    maybeRefreshAdminUsers();
  }
}

// ---------- ONE-PAGER ----------
const onePagerHeader = document.getElementById("onePagerHeader");
const summaryWeeklyBoard = document.getElementById("summaryWeeklyBoard");
const summaryCornerBoard = document.getElementById("summaryCornerBoard");
const summarySafetyBoard = document.getElementById("summarySafetyBoard");
const summaryMentalBoard = document.getElementById("summaryMentalBoard");
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
  const taskBoard = getAthleteTaskBoard(athlete.name);
  const alerts = getAthleteAlerts(athlete);
  const journalEntry = getLocalizedJournalEntry(athlete.name);
  const latestAnalysis = getLatestCoachMatchAnalysisForAthlete(athlete.name);
  const cornerPlan = getAthleteCornerPlan(ATHLETES.find((a) => a.name === athlete.name) || athlete);
  const na = currentLang === "es" ? "N/D" : "N/A";
  const styleDisplay = base.style
    ? translateOptionValue("aStyle", base.style) || translateValue(base.style)
    : na;
  const journalSummary = journalEntry
    ? `
      <ul class="list tight">
        <li>${currentLang === "es" ? "Journal" : "Journal"}: ${taskBoard.journalLabel}</li>
        <li>${currentLang === "es" ? "Sueno" : "Sleep"}: ${journalEntry.sleep || na}</li>
        <li>${currentLang === "es" ? "Energia" : "Energy"}: ${journalEntry.energy || na}</li>
        <li>${currentLang === "es" ? "Dolor" : "Soreness"}: ${journalEntry.soreness || na}</li>
        <li>${currentLang === "es" ? "Peso" : "Weight trend"}: ${journalEntry.weight || na}</li>
      </ul>
    `
    : `<p class="small muted">${currentLang === "es" ? "Sin actualizacion reciente de journal." : "No recent journal update."}</p>`;
  const tasksSummary = taskBoard.tasks.length
    ? `<ul class="list tight">${taskBoard.tasks.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<p class="small muted">${currentLang === "es" ? "Sin tareas pendientes." : "No pending tasks."}</p>`;
  const alertsSummary = alerts.length
    ? `<ul class="list tight">${alerts.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<p class="small muted">${currentLang === "es" ? "Sin alertas activas." : "No active alerts."}</p>`;
  const plansSummary = `
    <ul class="list tight">
      <li><strong>Plan A:</strong> ${cornerPlan?.planA || na}</li>
      <li><strong>Plan B:</strong> ${cornerPlan?.planB || na}</li>
      <li><strong>Plan C:</strong> ${cornerPlan?.planC || na}</li>
    </ul>
  `;
  const cornerSummary = `
    <ul class="list tight">
      <li><strong>${currentLang === "es" ? "Ataques" : "Attacks"}:</strong> ${cornerPlan?.attacks.join(", ") || na}</li>
      <li><strong>${currentLang === "es" ? "Setups" : "Setups"}:</strong> ${cornerPlan?.setups.join(", ") || na}</li>
      <li><strong>${currentLang === "es" ? "Cues" : "Cues"}:</strong> ${cornerPlan?.coachCues.join(", ") || na}</li>
    </ul>
  `;
  const safetySummary = `
    <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Limitaciones fisicas" : "Physical limitations"}</p>
    ${cornerPlan?.physicalLimitations.length ? `<ul class="list tight">${cornerPlan.physicalLimitations.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p class="small muted">${currentLang === "es" ? "Sin limitaciones registradas." : "No physical limitations recorded."}</p>`}
    <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Advertencias de seguridad" : "Safety warnings"}</p>
    ${cornerPlan?.safetyWarnings.length ? `<ul class="list tight">${cornerPlan.safetyWarnings.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p class="small muted">${currentLang === "es" ? "Sin advertencias de seguridad." : "No safety warnings recorded."}</p>`}
  `;
  const mentalSummary = `
    <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Errores bajo presion" : "Pressure errors"}</p>
    ${cornerPlan?.pressureErrors.length ? `<ul class="list tight">${cornerPlan.pressureErrors.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p class="small muted">${na}</p>`}
    <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Recordatorios mentales" : "Mental reminders"}</p>
    ${cornerPlan?.mentalReminders.length ? `<ul class="list tight">${cornerPlan.mentalReminders.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p class="small muted">${na}</p>`}
    <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Competition call" : "Competition call"}</p>
    <div class="match-cue">${cornerPlan?.competitionCue || athlete.coachSignal || na}</div>
  `;

  if (onePagerHeader) {
    const initials = athlete.name ? athlete.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "AT";
    onePagerHeader.innerHTML = `
      <div class="onepager-avatar">${initials}</div>
      <div>
        <h3>${athlete.name}</h3>
        <div class="small">${styleDisplay} - ${athlete.currentWeight || athlete.weight || na} (${athlete.weightClass || na})</div>
        <div class="small">${currentLang === "es" ? "Usar para seguimiento semanal y consulta rapida en torneo." : "Use for weekly follow-up and fast tournament consultation."}</div>
      </div>
    `;
  }

  if (summaryWeeklyBoard) {
    summaryWeeklyBoard.innerHTML = `
      <h3>${currentLang === "es" ? "Seguimiento semanal" : "Weekly Follow-Up"}</h3>
      ${journalSummary}
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Pendientes" : "Pending"}</p>
      ${tasksSummary}
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Alertas" : "Alerts"}</p>
      ${alertsSummary}
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Ultimo match analysis" : "Latest match analysis"}</p>
      <p class="small">${latestAnalysis?.summary || (currentLang === "es" ? "Sin analisis guardado." : "No saved analysis yet.")}</p>
    `;
  }

  if (summaryCornerBoard) {
    summaryCornerBoard.innerHTML = `
      <h3>${currentLang === "es" ? "Quick Corner" : "Quick Corner"}</h3>
      ${cornerSummary}
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Planes" : "Plans"}</p>
      ${plansSummary}
    `;
  }

  if (summarySafetyBoard) {
    summarySafetyBoard.innerHTML = `
      <h3>${currentLang === "es" ? "Seguridad y limitaciones" : "Safety and Limitations"}</h3>
      ${safetySummary}
    `;
  }

  if (summaryMentalBoard) {
    summaryMentalBoard.innerHTML = `
      <h3>${currentLang === "es" ? "Notas mentales y de presion" : "Mental and Pressure Notes"}</h3>
      ${mentalSummary}
    `;
  }
}

function saveOnePagerField(field, value) {
  const name = coachMatchSelect?.value || "Athlete";
  const current = getOnePagerData(name) || {};
  setOnePagerData(name, { ...current, [field]: value });
  toast(pickCopy({ en: "One-pager saved.", es: "Resumen guardado." }));
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
const athleteSummaryCard = document.getElementById("athleteSummaryCard");
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
  const taskBoard = getAthleteTaskBoard(athlete.name);
  const journalEntry = getLocalizedJournalEntry(athlete.name);
  const alerts = getAthleteAlerts(athlete);
  const cornerPlan = getAthleteCornerPlan(ATHLETES.find((a) => a.name === athlete.name) || athlete);
  const latestAnalysis = getLatestCoachMatchAnalysisForAthlete(athlete.name);
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
    taskBoard,
    journalEntry,
    alerts,
    cornerPlan,
    latestAnalysis,
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
  const board = data.taskBoard || { tasks: [], journalLabel: na };
  const weeklyAlerts = data.alerts || [];
  const latestAnalysis = data.latestAnalysis || null;
  const cornerPlan = data.cornerPlan || {
    attacks: [],
    setups: [],
    planA: "",
    planB: "",
    planC: "",
    coachCues: [],
    pressureErrors: [],
    physicalLimitations: [],
    safetyWarnings: [],
    mentalReminders: []
  };
  const journalEntry = data.journalEntry || null;
  const tasksHtml = board.tasks.length
    ? `<ul class="list tight">${board.tasks.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${currentLang === "es" ? "No hay pendientes esta semana." : "No pending work this week."}</div>`;
  const weeklyAlertsHtml = weeklyAlerts.length
    ? `<ul class="list tight">${weeklyAlerts.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${currentLang === "es" ? "Sin alertas activas." : "No active alerts."}</div>`;
  const topAttacksHtml = cornerPlan.attacks.length
    ? `<ul class="list tight">${cornerPlan.attacks.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${na}</div>`;
  const topSetupsHtml = cornerPlan.setups.length
    ? `<ul class="list tight">${cornerPlan.setups.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${na}</div>`;
  const coachCuesHtml = cornerPlan.coachCues.length
    ? `<ul class="list tight">${cornerPlan.coachCues.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : cueWordsHtml;
  const pressureErrorsHtml = cornerPlan.pressureErrors.length
    ? `<ul class="list tight">${cornerPlan.pressureErrors.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${errorDisplay}</div>`;
  const physicalLimitsHtml = cornerPlan.physicalLimitations.length
    ? `<ul class="list tight">${cornerPlan.physicalLimitations.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${currentLang === "es" ? "Sin limitaciones registradas." : "No physical limitations recorded."}</div>`;
  const safetyWarningsHtml = cornerPlan.safetyWarnings.length
    ? `<ul class="list tight">${cornerPlan.safetyWarnings.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<div class="small muted">${currentLang === "es" ? "Sin advertencias de seguridad." : "No safety warnings recorded."}</div>`;
  const mentalRemindersHtml = cornerPlan.mentalReminders.length
    ? `<ul class="list tight">${cornerPlan.mentalReminders.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : cueWordsHtml;
  const weeklyReadinessHtml = journalEntry
    ? `
      <ul class="list tight">
        <li>${currentLang === "es" ? "Journal" : "Journal"}: ${board.journalLabel}</li>
        <li>${currentLang === "es" ? "Sueno" : "Sleep"}: ${journalEntry.sleep || na}</li>
        <li>${currentLang === "es" ? "Energia" : "Energy"}: ${journalEntry.energy || na}</li>
        <li>${currentLang === "es" ? "Dolor" : "Soreness"}: ${journalEntry.soreness || na}</li>
        <li>${currentLang === "es" ? "Peso" : "Weight trend"}: ${journalEntry.weight || na}</li>
      </ul>
    `
    : `<div class="small muted">${currentLang === "es" ? "Sin journal reciente." : "No recent journal update."}</div>`;

  if (coachMatchSelectLabel) coachMatchSelectLabel.textContent = matchCopy("selectAthlete");
  if (coachMatchAvatar) coachMatchAvatar.textContent = initials;
  if (coachMatchName) coachMatchName.textContent = data.name;
  if (coachMatchMeta) coachMatchMeta.textContent = `${styleDisplay} - ${weightDisplay} (${categoryDisplay})`;

  if (coachMatchBasics) {
    coachMatchBasics.innerHTML = `
      <h3>${currentLang === "es" ? "Lectura rapida" : "Fast Read"}</h3>
      <ul class="list tight">
        <li>${matchCopy("style")}: ${styleDisplay}</li>
        <li>${matchCopy("experience")}: ${experienceDisplay}</li>
        <li>${matchCopy("weight")}: ${weightDisplay}</li>
        <li>${matchCopy("category")}: ${categoryDisplay}</li>
        <li>${currentLang === "es" ? "Pendientes" : "Pending"}: ${board.tasks.length}</li>
        <li>${currentLang === "es" ? "Alertas" : "Alerts"}: ${weeklyAlerts.length}</li>
      </ul>
    `;
  }

  if (coachMatchPosition) {
    coachMatchPosition.innerHTML = `
      <h3>${currentLang === "es" ? "Seguimiento semanal" : "Weekly Snapshot"}</h3>
      ${weeklyReadinessHtml}
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Ultimo match analysis" : "Latest match analysis"}</p>
      <p class="small">${latestAnalysis?.summary || (currentLang === "es" ? "Sin analisis guardado." : "No saved analysis yet.")}</p>
    `;
  }

  if (coachMatchOffense) {
    coachMatchOffense.innerHTML = `
      <h3>${currentLang === "es" ? "Top 3 ataques" : "Top 3 Attacks"}</h3>
      ${topAttacksHtml}
    `;
  }

  if (coachMatchDefense) {
    coachMatchDefense.innerHTML = `
      <h3>${currentLang === "es" ? "Top 3 setups" : "Top 3 Setups"}</h3>
      ${topSetupsHtml}
    `;
  }

  if (coachMatchPsych) {
    coachMatchPsych.innerHTML = `
      <h3>${currentLang === "es" ? "Planes de competencia" : "Competition Plans"}</h3>
      <ul class="list tight">
        <li><strong>Plan A:</strong> ${cornerPlan.planA || goalDisplay}</li>
        <li><strong>Plan B:</strong> ${cornerPlan.planB || na}</li>
        <li><strong>Plan C:</strong> ${cornerPlan.planC || na}</li>
      </ul>
    `;
  }

  if (coachMatchArchetype) {
    coachMatchArchetype.innerHTML = `
      <h3>${currentLang === "es" ? "Cues rapidos del coach" : "Coach Quick Cues"}</h3>
      ${coachCuesHtml}
    `;
  }

  if (coachMatchCueWords) {
    coachMatchCueWords.innerHTML = `
      <h3>${currentLang === "es" ? "Recordatorios mentales" : "Mental Reminders"}</h3>
      ${mentalRemindersHtml}
    `;
  }

  if (coachMatchBodyType) {
    coachMatchBodyType.innerHTML = `
      <h3>${currentLang === "es" ? "Errores bajo presion" : "Pressure Errors"}</h3>
      ${pressureErrorsHtml}
    `;
  }

  if (coachMatchGoal) {
    coachMatchGoal.innerHTML = `
      <h3>${currentLang === "es" ? "Limitaciones y seguridad" : "Limitations and Safety"}</h3>
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Limitaciones fisicas" : "Physical limitations"}</p>
      ${physicalLimitsHtml}
      <p class="small coach-athlete-profile-label">${currentLang === "es" ? "Advertencias de seguridad" : "Safety warnings"}</p>
      ${safetyWarningsHtml}
    `;
  }

  if (coachMatchCue) {
    coachMatchCue.innerHTML = `
      <h3>${currentLang === "es" ? "Llamado de competencia" : "Competition Call"}</h3>
      <div class="match-cue">${cornerPlan.competitionCue || cueDisplay}</div>
      <p class="small muted">${currentLang === "es" ? "Lo que el coach debe repetir en la esquina." : "What the coach should repeat mat-side."}</p>
    `;
  }
  renderOnePager(data.name);
}

function selectCoachMatchAthlete(name) {
  const athletes = getAthletesData();
  const selectedAthlete = athletes.find((athlete) => athlete.name === name) || athletes[0];
  if (!selectedAthlete) return;
  if (coachMatchSelect) coachMatchSelect.value = selectedAthlete.name;
  renderCoachAthleteProfile(selectedAthlete.name);
  renderCoachMatchView(selectedAthlete.name);
  renderCompetitionPreview(selectedAthlete);
  renderAthleteManagement();
  renderAthleteNotes();
  renderJournalMonitor();
  renderMedia();
}

function openAthleteSummaryView(name = "") {
  if (name) {
    selectCoachMatchAthlete(name);
  } else if (coachMatchSelect?.value) {
    selectCoachMatchAthlete(coachMatchSelect.value);
  }
  Promise.resolve(showTab("coach-match")).finally(() => {
    athleteSummaryCard?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (coachMatchSelect) {
  syncCoachMatchAthleteSelect();
  coachMatchSelect.addEventListener("change", () => selectCoachMatchAthlete(coachMatchSelect.value));
  const defaultName = getAthletesData()[0]?.name;
  if (defaultName) selectCoachMatchAthlete(defaultName);
}

// ---------- MESSAGES ----------
const messageList = document.getElementById("messageList");
const messagesCoachList = document.getElementById("messagesCoachList");
const messagesPanelTitle = document.getElementById("messagesPanelTitle");
const messagesPanelSubtitle = document.getElementById("messagesPanelSubtitle");
const messagesPanelChip = document.getElementById("messagesPanelChip");
const messagesSidebarTitle = document.getElementById("messagesSidebarTitle");
const messagesSidebarHint = document.getElementById("messagesSidebarHint");
const messagesEmptyState = document.getElementById("messagesEmptyState");
const messagesEmptyTitle = document.getElementById("messagesEmptyTitle");
const messagesEmptyBody = document.getElementById("messagesEmptyBody");
const messagesThreadView = document.getElementById("messagesThreadView");
const messagesThreadTitle = document.getElementById("messagesThreadTitle");
const messagesThreadMeta = document.getElementById("messagesThreadMeta");
const messagesThreadBadge = document.getElementById("messagesThreadBadge");
const messagesStatus = document.getElementById("messagesStatus");
const messagesFeed = document.getElementById("messagesFeed");
const messageComposer = document.getElementById("messageComposer");
const messageComposerLabel = document.getElementById("messageComposerLabel");
const messageComposerInput = document.getElementById("messageComposerInput");
const messageSendBtn = document.getElementById("messageSendBtn");

const MESSAGES_COPY = {
  title: { en: "Messages", es: "Mensajes" },
  subtitle: {
    en: "Private 1:1 communication between athletes, parents, and coaches.",
    es: "Comunicacion privada 1:1 entre atletas, padres y entrenadores."
  },
  chip: { en: "Private threads", es: "Chats privados" },
  sidebarTitle: { en: "Conversations", es: "Conversaciones" },
  sidebarHintCoach: {
    en: "Open any athlete or parent thread and reply directly from here.",
    es: "Abre cualquier chat de atleta o padre y responde directamente aqui."
  },
  sidebarHintUser: {
    en: "Start a private thread with any coach, then continue the conversation here.",
    es: "Comienza un chat privado con cualquier coach y sigue la conversacion aqui."
  },
  emptyTitle: { en: "No conversation selected", es: "No hay una conversacion seleccionada" },
  emptyBodyUser: {
    en: "Choose a coach from the left column to open a private thread.",
    es: "Selecciona un coach en la columna izquierda para abrir un chat privado."
  },
  emptyBodyCoach: {
    en: "As soon as an athlete or parent writes to you, the thread will appear here.",
    es: "Tan pronto un atleta o padre te escriba, el chat aparecera aqui."
  },
  emptyBodyAuth: {
    en: "Sign in to load private coach conversations.",
    es: "Inicia sesion para cargar las conversaciones privadas con coaches."
  },
  emptyBodyNoCoaches: {
    en: "No coach accounts are available yet. Provision the coach roster first.",
    es: "Todavia no hay cuentas de coach disponibles. Primero crea el roster de coaches."
  },
  composerLabel: { en: "Message", es: "Mensaje" },
  composerPlaceholder: { en: "Write your message here", es: "Escribe tu mensaje aqui" },
  send: { en: "Send message", es: "Enviar mensaje" },
  sending: { en: "Sending...", es: "Enviando..." },
  loading: { en: "Loading conversations...", es: "Cargando conversaciones..." },
  loadingFeed: { en: "Loading thread...", es: "Cargando chat..." },
  loadError: {
    en: "Could not load messages. Check Firebase rules and auth.",
    es: "No se pudieron cargar los mensajes. Revisa reglas de Firebase y autenticacion."
  },
  sendError: {
    en: "Could not send this message.",
    es: "No se pudo enviar este mensaje."
  },
  sentToast: { en: "Message sent.", es: "Mensaje enviado." },
  noMessages: {
    en: "No messages yet. Start the conversation below.",
    es: "Todavia no hay mensajes. Empieza la conversacion abajo."
  },
  noThreads: {
    en: "No threads yet.",
    es: "Todavia no hay chats."
  },
  coachesHeader: { en: "Coaches", es: "Coaches" },
  threadsHeader: { en: "Active threads", es: "Chats activos" },
  startThread: { en: "Start thread", es: "Abrir chat" },
  openThread: { en: "Open thread", es: "Ver chat" },
  coachAvailable: { en: "Coach account ready", es: "Cuenta de coach lista" },
  privateBadge: { en: "Private", es: "Privado" },
  you: { en: "You", es: "Tu" },
  needText: { en: "Write a message before sending.", es: "Escribe un mensaje antes de enviar." },
  signedOut: { en: "Signed out", es: "Sesion cerrada" }
};

let messagesThreadRows = [];
let messagesCoachRows = [];
let messagesFeedRows = [];
let messagesThreadsUnsub = null;
let messagesFeedUnsub = null;
let messagesSessionUid = "";
let messagesSelectedThreadId = "";
let messagesBound = false;
let messagesFeedLoading = false;
let messagesStatusCopy = "";
let messagesStatusType = "";
let messagesAutoOpeningCoachUid = "";

function getMessagesCurrentUser() {
  const authUser = getAuthUser();
  if (!authUser?.id) return null;
  const profile = getProfile() || {};
  const role = normalizeAuthRole(profile.role || authUser.role);
  return {
    uid: String(authUser.id || "").trim(),
    email: normalizeEmail(authUser.email || profile.email || ""),
    role,
    name: String(profile.name || authUser.email || "").trim() || "User"
  };
}

function isCoachMessagingUser(user) {
  if (!user) return false;
  return normalizeAuthRole(user.role) === "coach" || OFFICIAL_COACH_EMAILS.has(normalizeEmail(user.email));
}

function getMessageThreadsCollectionRef() {
  if (!firebaseFirestoreInstance) return null;
  return firebaseFirestoreInstance.collection(FIREBASE_MESSAGE_THREADS_COLLECTION);
}

function getFirestoreServerTimestamp() {
  if (typeof firebase !== "undefined" && firebase.firestore?.FieldValue?.serverTimestamp) {
    return firebase.firestore.FieldValue.serverTimestamp();
  }
  return new Date().toISOString();
}

function getFirestoreArrayUnion(...values) {
  if (typeof firebase !== "undefined" && firebase.firestore?.FieldValue?.arrayUnion) {
    return firebase.firestore.FieldValue.arrayUnion(...values);
  }
  return values;
}

function messageTimestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return parseIsoTimestamp(value);
}

function formatMessageTimestamp(value) {
  const ms = messageTimestampToMillis(value);
  if (!ms) return "";
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  return new Date(ms).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIMEZONE
  });
}

function buildDirectMessageThreadId(uidA, uidB) {
  return [String(uidA || "").trim(), String(uidB || "").trim()].filter(Boolean).sort().join("__");
}

function normalizeMessageCoachRecord(uid, data = {}) {
  return normalizeManagedUserRecord(uid, { ...data, role: "coach", view: "coach" });
}

function normalizeMessageData(data = {}, id = "") {
  return {
    id,
    text: String(data.text || "").trim(),
    senderUid: String(data.senderUid || "").trim(),
    senderName: String(data.senderName || "").trim() || "User",
    senderRole: normalizeAuthRole(data.senderRole || "athlete"),
    createdAt: data.createdAt || data.updatedAt || ""
  };
}

function normalizeMessageThreadRecord(doc) {
  const data = doc.data() || {};
  const participantIds = Array.isArray(data.participantIds)
    ? data.participantIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  return {
    id: doc.id,
    participantIds,
    participants: data.participants && typeof data.participants === "object" ? data.participants : {},
    coachUid: String(data.coachUid || "").trim(),
    coachName: String(data.coachName || "").trim() || "Coach",
    userUid: String(data.userUid || "").trim(),
    userName: String(data.userName || "").trim() || "User",
    userRole: normalizeAuthRole(data.userRole || "athlete"),
    lastMessageText: String(data.lastMessageText || "").trim(),
    lastMessageAt: data.lastMessageAt || data.updatedAt || data.createdAt || "",
    lastSenderUid: String(data.lastSenderUid || "").trim(),
    messageHistory: Array.isArray(data.messageHistory)
      ? data.messageHistory
          .map((entry, index) => normalizeMessageData(entry || {}, `history-${index + 1}`))
          .filter((entry) => entry.text)
      : [],
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || data.lastMessageAt || data.createdAt || ""
  };
}

function normalizeMessageEntry(doc) {
  return normalizeMessageData(doc.data() || {}, doc.id);
}

function getSelectedMessageThread() {
  return messagesThreadRows.find((thread) => thread.id === messagesSelectedThreadId) || null;
}

function getMessageOtherParticipant(thread, currentUid) {
  if (!thread) return { uid: "", name: "", role: "athlete" };
  if (thread.coachUid === currentUid) {
    return {
      uid: thread.userUid,
      name: thread.userName || "User",
      role: normalizeAuthRole(thread.userRole)
    };
  }
  return {
    uid: thread.coachUid,
    name: thread.coachName || "Coach",
    role: "coach"
  };
}

function setMessagesStatus(copy, type = "") {
  messagesStatusCopy = copy;
  messagesStatusType = type;
  if (!messagesStatus) return;
  messagesStatus.textContent = pickCopy(copy);
  messagesStatus.dataset.state = type || "";
}

function resetMessagesStatus() {
  setMessagesStatus("", "");
}

function teardownMessagesSession({ preserveSelection = false } = {}) {
  if (messagesThreadsUnsub) {
    messagesThreadsUnsub();
    messagesThreadsUnsub = null;
  }
  if (messagesFeedUnsub) {
    messagesFeedUnsub();
    messagesFeedUnsub = null;
  }
  messagesSessionUid = "";
  messagesThreadRows = [];
  messagesCoachRows = [];
  messagesFeedRows = [];
  messagesFeedLoading = false;
  messagesAutoOpeningCoachUid = "";
  if (!preserveSelection) messagesSelectedThreadId = "";
  resetMessagesStatus();
}

function sortMessageThreads(items = []) {
  return items.slice().sort((a, b) => {
    return messageTimestampToMillis(b.updatedAt) - messageTimestampToMillis(a.updatedAt);
  });
}

async function loadCoachDirectoryForMessages() {
  const current = getMessagesCurrentUser();
  if (!current || !firebaseFirestoreInstance) {
    messagesCoachRows = [];
    return;
  }

  try {
    const [coachSnapshot, adminCoachSnapshot] = await withTimeout(
      Promise.all([
        firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).where("role", "==", "coach").get(),
        firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).where("email", "==", "gmunch@united-wc.com").get()
      ]),
      FIREBASE_OP_TIMEOUT_MS * 2,
      "firestore_coach_directory_timeout"
    );
    const byUid = new Map();
    [...coachSnapshot.docs, ...adminCoachSnapshot.docs].forEach((doc) => {
      const normalized = normalizeMessageCoachRecord(doc.id, doc.data() || {});
      if (normalized.uid) byUid.set(normalized.uid, normalized);
    });
    messagesCoachRows = Array.from(byUid.values())
      .filter((coach) => coach.uid && coach.uid !== current.uid)
      .filter((coach) => OFFICIAL_COACH_EMAILS.has(normalizeEmail(coach.email)))
      .sort((a, b) => a.name.localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    if (isParentRole(getProfile()?.role) && getParentLinkedCoachUid()) {
      messagesCoachRows = messagesCoachRows.filter((coach) => coach.uid === getParentLinkedCoachUid());
    }
  } catch (err) {
    console.warn("Failed to load coach directory", err);
    messagesCoachRows = [];
    setMessagesStatus(MESSAGES_COPY.loadError, "error");
  }
}

function subscribeToMessageFeed(threadId) {
  if (messagesFeedUnsub) {
    messagesFeedUnsub();
    messagesFeedUnsub = null;
  }
  messagesFeedRows = [];
  if (!threadId) return;

  const threadsRef = getMessageThreadsCollectionRef();
  if (!threadsRef) return;
  messagesFeedLoading = true;
  setMessagesStatus(MESSAGES_COPY.loadingFeed, "");
  messagesFeedUnsub = threadsRef
    .doc(threadId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      messagesFeedRows = snapshot.docs.map((doc) => normalizeMessageEntry(doc));
      messagesFeedLoading = false;
      resetMessagesStatus();
      renderMessages();
      if (messagesFeed) {
        requestAnimationFrame(() => {
          messagesFeed.scrollTop = messagesFeed.scrollHeight;
        });
      }
    }, (err) => {
      console.warn("Failed to subscribe to message feed", err);
      messagesFeedLoading = false;
      setMessagesStatus(MESSAGES_COPY.loadError, "error");
      renderMessages();
    });
}

function selectMessageThread(threadId) {
  if (!threadId || messagesSelectedThreadId === threadId) return;
  messagesSelectedThreadId = threadId;
  subscribeToMessageFeed(threadId);
  renderMessages();
}

function ensureSelectedMessageThread() {
  if (messagesSelectedThreadId && messagesThreadRows.some((thread) => thread.id === messagesSelectedThreadId)) {
    return;
  }
  const firstThread = messagesThreadRows[0];
  messagesSelectedThreadId = firstThread?.id || "";
  subscribeToMessageFeed(messagesSelectedThreadId);
}

function subscribeToMessageThreads(current) {
  const threadsRef = getMessageThreadsCollectionRef();
  const uid = String(current?.uid || "").trim();
  if (!threadsRef || !uid) return;
  if (messagesThreadsUnsub) {
    messagesThreadsUnsub();
    messagesThreadsUnsub = null;
  }

  const inboxField = isCoachMessagingUser(current) ? "coachUid" : "userUid";
  setMessagesStatus(MESSAGES_COPY.loading, "");
  messagesThreadsUnsub = threadsRef
    .where(inboxField, "==", uid)
    .onSnapshot((snapshot) => {
      messagesThreadRows = sortMessageThreads(snapshot.docs.map((doc) => normalizeMessageThreadRecord(doc)));
      ensureSelectedMessageThread();
      resetMessagesStatus();
      renderMessages();
    }, (err) => {
      console.warn("Failed to subscribe to threads", err);
      messagesThreadRows = [];
      setMessagesStatus(MESSAGES_COPY.loadError, "error");
      renderMessages();
    });
}

async function ensureMessagesSession() {
  const current = getMessagesCurrentUser();
  if (!current || !firebaseFirestoreInstance) {
    teardownMessagesSession();
    renderMessages();
    return;
  }

  if (messagesSessionUid === current.uid) return;

  teardownMessagesSession();
  messagesSessionUid = current.uid;
  renderMessages();
  await loadCoachDirectoryForMessages();
  subscribeToMessageThreads(current);
  renderMessages();
}

async function ensureDirectMessageThread(coach) {
  const current = getMessagesCurrentUser();
  const threadsRef = getMessageThreadsCollectionRef();
  if (!current || !threadsRef || !coach?.uid) {
    throw new Error("firestore_not_configured");
  }

  const threadId = buildDirectMessageThreadId(current.uid, coach.uid);
  const threadRef = threadsRef.doc(threadId);
  let existing = null;
  try {
    existing = await withTimeout(threadRef.get(), FIREBASE_OP_TIMEOUT_MS, "firestore_thread_read_timeout");
  } catch (err) {
    const code = String(err?.code || err?.message || "");
    if (!code.includes("permission-denied")) {
      throw err;
    }
  }
  if (!existing?.exists) {
    await withTimeout(
      threadRef.set({
        participantIds: [current.uid, coach.uid].sort(),
        participants: {
          [current.uid]: true,
          [coach.uid]: true
        },
        coachUid: coach.uid,
        coachName: coach.name,
        userUid: current.uid,
        userName: current.name,
        userRole: current.role,
        createdAt: getFirestoreServerTimestamp(),
        updatedAt: getFirestoreServerTimestamp(),
        lastMessageText: "",
        lastSenderUid: "",
        messageHistory: []
      }, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_thread_write_timeout"
    );
  }
  return threadId;
}

async function openMessageThreadForCoach(coachUid) {
  let coach = messagesCoachRows.find((item) => item.uid === coachUid);
  if (!coach && firebaseFirestoreInstance && coachUid) {
    try {
      const snapshot = await withTimeout(
        firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(coachUid).get(),
        FIREBASE_OP_TIMEOUT_MS,
        "firestore_coach_profile_timeout"
      );
      if (snapshot.exists) {
        coach = normalizeMessageCoachRecord(snapshot.id, snapshot.data() || {});
        if (coach?.uid && !messagesCoachRows.some((item) => item.uid === coach.uid)) {
          messagesCoachRows = [...messagesCoachRows, coach].sort((a, b) => a.name.localeCompare(b.name || "", undefined, { sensitivity: "base" }));
        }
      }
    } catch (err) {
      console.warn("Failed to load coach profile for direct thread", err);
    }
  }
  if (!coach) return;
  try {
    const existingThread = messagesThreadRows.find((thread) => thread.coachUid === coach.uid);
    const threadId = existingThread?.id || await ensureDirectMessageThread(coach);
    selectMessageThread(threadId);
  } catch (err) {
    console.warn("Failed to open direct coach thread", err);
    setMessagesStatus(MESSAGES_COPY.loadError, "error");
    renderMessages();
  }
}

async function openDirectMessageThreadWithRetry(coachUid, attempts = 5) {
  const safeCoachUid = String(coachUid || "").trim();
  if (!safeCoachUid) return false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await ensureMessagesSession().catch(() => {});
    await loadCoachDirectoryForMessages().catch(() => {});
    await openMessageThreadForCoach(safeCoachUid);
    const selected = getSelectedMessageThread();
    if (selected?.coachUid === safeCoachUid) {
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return false;
}

function renderMessagesCoachList(current) {
  if (!messagesCoachList) return;
  messagesCoachList.innerHTML = "";
  const isCoach = isCoachMessagingUser(current);
  messagesCoachList.hidden = isCoach;
  if (isCoach) return;

  const title = document.createElement("div");
  title.className = "small muted";
  title.textContent = pickCopy(MESSAGES_COPY.coachesHeader);
  messagesCoachList.appendChild(title);

  if (!messagesCoachRows.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(MESSAGES_COPY.emptyBodyNoCoaches);
    messagesCoachList.appendChild(empty);
    return;
  }

  messagesCoachRows.forEach((coach) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "messages-coach-card";
    const linkedThread = messagesThreadRows.find((thread) => thread.coachUid === coach.uid);
    if (linkedThread && linkedThread.id === messagesSelectedThreadId) {
      card.classList.add("active");
    }
    card.innerHTML = `
      <h4>${escapeHtml(coach.name || coach.email || "Coach")}</h4>
      <small>${escapeHtml(coach.email || "")}</small>
      <small>${escapeHtml(linkedThread ? pickCopy(MESSAGES_COPY.openThread) : pickCopy(MESSAGES_COPY.coachAvailable))}</small>
    `;
    card.addEventListener("click", () => {
      openMessageThreadForCoach(coach.uid);
    });
    messagesCoachList.appendChild(card);
  });
}

function renderMessagesThreadList(current) {
  if (!messageList) return;
  messageList.innerHTML = "";

  const title = document.createElement("div");
  title.className = "small muted";
  title.textContent = pickCopy(MESSAGES_COPY.threadsHeader);
  messageList.appendChild(title);

  if (!current) return;

  if (!messagesThreadRows.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(MESSAGES_COPY.noThreads);
    messageList.appendChild(empty);
    return;
  }

  messagesThreadRows.forEach((thread) => {
    const other = getMessageOtherParticipant(thread, current.uid);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "message-thread-card";
    if (thread.id === messagesSelectedThreadId) {
      card.classList.add("active");
    }
    const preview = thread.lastMessageText || pickCopy(MESSAGES_COPY.noMessages);
    const meta = formatMessageTimestamp(thread.lastMessageAt || thread.updatedAt);
    card.innerHTML = `
      <h4>${escapeHtml(other.name || "Conversation")}</h4>
      <small>${escapeHtml(meta || other.role)}</small>
      <span class="message-thread-preview">${escapeHtml(preview)}</span>
    `;
    card.addEventListener("click", () => {
      selectMessageThread(thread.id);
    });
    messageList.appendChild(card);
  });
}

function renderMessagesFeed(current) {
  if (!messagesFeed) return;
  messagesFeed.innerHTML = "";
  const selectedThread = getSelectedMessageThread();
  const rows = messagesFeedRows.length ? messagesFeedRows : (selectedThread?.messageHistory || []);
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(MESSAGES_COPY.noMessages);
    messagesFeed.appendChild(empty);
    return;
  }

  rows.forEach((entry) => {
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    if (entry.senderUid === current?.uid) {
      bubble.classList.add("own");
    }

    const header = document.createElement("div");
    header.className = "message-bubble-header";
    const sender = document.createElement("strong");
    sender.textContent = entry.senderUid === current?.uid
      ? pickCopy(MESSAGES_COPY.you)
      : entry.senderName;
    const time = document.createElement("span");
    time.textContent = formatMessageTimestamp(entry.createdAt);
    header.appendChild(sender);
    header.appendChild(time);

    const body = document.createElement("div");
    body.className = "message-bubble-body";
    body.textContent = entry.text;

    bubble.appendChild(header);
    bubble.appendChild(body);
    messagesFeed.appendChild(bubble);
  });
}

function renderMessages() {
  if (!messageList) return;

  setTextContent(messagesPanelTitle, MESSAGES_COPY.title);
  setTextContent(messagesPanelSubtitle, MESSAGES_COPY.subtitle);
  setTextContent(messagesPanelChip, MESSAGES_COPY.chip);
  setTextContent(messagesSidebarTitle, MESSAGES_COPY.sidebarTitle);
  setTextContent(messageComposerLabel, MESSAGES_COPY.composerLabel);
  if (messageComposerInput) {
    messageComposerInput.placeholder = pickCopy(MESSAGES_COPY.composerPlaceholder);
  }
  if (messageSendBtn) {
    messageSendBtn.textContent = pickCopy(MESSAGES_COPY.send);
  }

  const current = getMessagesCurrentUser();
  const isCoach = isCoachMessagingUser(current);
  setTextContent(messagesSidebarHint, isCoach ? MESSAGES_COPY.sidebarHintCoach : MESSAGES_COPY.sidebarHintUser);

  if (!current || !firebaseFirestoreInstance) {
    setTextContent(messagesEmptyTitle, MESSAGES_COPY.emptyTitle);
    setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyAuth);
    messagesEmptyState?.classList.remove("hidden");
    messagesThreadView?.classList.add("hidden");
    if (messagesCoachList) messagesCoachList.innerHTML = "";
    if (messageList) messageList.innerHTML = "";
    if (messagesStatus) messagesStatus.textContent = pickCopy(MESSAGES_COPY.signedOut);
    return;
  }

  if (messagesSessionUid !== current.uid) {
    ensureMessagesSession().catch((err) => {
      console.warn("Failed to initialize messages session", err);
      setMessagesStatus(MESSAGES_COPY.loadError, "error");
      renderMessages();
    });
  }

  renderMessagesCoachList(current);
  renderMessagesThreadList(current);

  const selectedThread = getSelectedMessageThread();
  if (!selectedThread) {
    const parentAutoCoachUid = isParentRole(current?.role) && messagesCoachRows.length === 1
      ? messagesCoachRows[0].uid
      : "";
    if (parentAutoCoachUid && messagesAutoOpeningCoachUid !== parentAutoCoachUid) {
      messagesAutoOpeningCoachUid = parentAutoCoachUid;
      openDirectMessageThreadWithRetry(parentAutoCoachUid)
        .catch((err) => {
          console.warn("Failed to auto-open parent coach thread", err);
        })
        .finally(() => {
          messagesAutoOpeningCoachUid = "";
        });
    }
    setTextContent(messagesEmptyTitle, MESSAGES_COPY.emptyTitle);
    if (!isCoach && !messagesCoachRows.length) {
      setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyNoCoaches);
    } else {
      setTextContent(messagesEmptyBody, isCoach ? MESSAGES_COPY.emptyBodyCoach : MESSAGES_COPY.emptyBodyUser);
    }
    messagesEmptyState?.classList.remove("hidden");
    messagesThreadView?.classList.add("hidden");
    if (messagesFeed) messagesFeed.innerHTML = "";
    return;
  }

  const other = getMessageOtherParticipant(selectedThread, current.uid);
  messagesEmptyState?.classList.add("hidden");
  messagesThreadView?.classList.remove("hidden");
  if (messagesThreadTitle) messagesThreadTitle.textContent = other.name || pickCopy(MESSAGES_COPY.title);
  if (messagesThreadMeta) {
    const metaBits = [other.role === "coach" ? "Coach" : getRoleLabelEnglish(other.role)];
    if (selectedThread.lastMessageAt) {
      metaBits.push(formatMessageTimestamp(selectedThread.lastMessageAt));
    }
    messagesThreadMeta.textContent = metaBits.filter(Boolean).join(" - ");
  }
  if (messagesThreadBadge) messagesThreadBadge.textContent = pickCopy(MESSAGES_COPY.privateBadge);
  if (messagesStatus) {
    messagesStatus.textContent = pickCopy(messagesStatusCopy);
    messagesStatus.dataset.state = messagesStatusType || "";
  }
  renderMessagesFeed(current);
}

async function handleMessageComposerSubmit(event) {
  event.preventDefault();
  const current = getMessagesCurrentUser();
  const selectedThread = getSelectedMessageThread();
  const threadsRef = getMessageThreadsCollectionRef();
  const text = String(messageComposerInput?.value || "").trim();

  if (!text) {
    toast(pickCopy(MESSAGES_COPY.needText));
    return;
  }
  if (!current || !selectedThread || !threadsRef) {
    setMessagesStatus(MESSAGES_COPY.loadError, "error");
    return;
  }

  if (messageSendBtn) {
    messageSendBtn.disabled = true;
    messageSendBtn.textContent = pickCopy(MESSAGES_COPY.sending);
  }

  try {
    const localMessage = {
      text,
      senderUid: current.uid,
      senderName: current.name,
      senderRole: current.role,
      createdAt: new Date().toISOString()
    };
    const threadRef = threadsRef.doc(selectedThread.id);
    await withTimeout(
      threadRef.collection("messages").add({
        threadId: selectedThread.id,
        text,
        senderUid: current.uid,
        senderName: current.name,
        senderRole: current.role,
        createdAt: getFirestoreServerTimestamp()
      }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_write_timeout"
    );
    await withTimeout(
      threadRef.set({
        updatedAt: getFirestoreServerTimestamp(),
        lastMessageAt: getFirestoreServerTimestamp(),
        lastMessageText: text,
        lastSenderUid: current.uid,
        coachName: selectedThread.coachName,
        userName: selectedThread.userName,
        messageHistory: getFirestoreArrayUnion(localMessage)
      }, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_thread_touch_timeout"
    );
    if (messageComposerInput) messageComposerInput.value = "";
    toast(pickCopy(MESSAGES_COPY.sentToast));
    resetMessagesStatus();
  } catch (err) {
    console.warn("Failed to send message", err);
    setMessagesStatus(MESSAGES_COPY.sendError, "error");
    renderMessages();
  } finally {
    if (messageSendBtn) {
      messageSendBtn.disabled = false;
      messageSendBtn.textContent = pickCopy(MESSAGES_COPY.send);
    }
  }
}

if (messageComposer && !messagesBound) {
  messageComposer.addEventListener("submit", handleMessageComposerSubmit);
  messagesBound = true;
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

function ensureSeedJournalEntries() {
  const existing = getJournalEntries();
  if (existing.length) return existing;
  const seeded = [
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      note: "Sleep was solid. Best feel today was on single-leg finishes after the re-shot. Need to stay patient when the first attack gets blocked."
    }
  ];
  localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(seeded));
  return seeded;
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
  clearLegacyRegisteredUsersCache();
  ensureSeedJournalEntries();
  renderJournalEntries();
  await bootProfile();
  startClock();
  const currentDayIndex = getCurrentAppDayIndex();
  const currentDayKey = getCurrentAppDateKey();
  renderToday(currentDayIndex);
  renderFeelingScale();
  renderPlanGrid(currentDayIndex);
  renderCalendar(currentDayKey);
  renderCalendarManager();
  renderMedia();
  renderAnnouncements();
  renderCoachAssignments();
  renderCompletionTracking();
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
