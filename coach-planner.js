(() => {
  const root = document.getElementById("coachPlannerApp");
  if (!root) return;

  const CATEGORIES = [
    { id: "roll_call", name: "Roll Call and Announcements" },
    { id: "warm_up", name: "Warm Up" },
    { id: "techniques", name: "Introduction of New Techniques or drills" },
    { id: "live_wrestling", name: "Live wrestling (High pace drills)" },
    { id: "strength", name: "Strength and Skill Based Activities" },
    { id: "cool_down", name: "Cool Down Closing and Visualization" },
    { id: "announcements", name: "Announcements" }
  ];

  const INITIAL_LIBRARY = [
    { id: "1", name: "Jogging & Dynamic Stretching", categoryId: "warm_up" },
    { id: "2", name: "Takedown setups", categoryId: "techniques" },
    { id: "3", name: "3x3 min Live matches", categoryId: "live_wrestling" }
  ];

  const INITIAL_TIMES = {
    roll_call: "10",
    warm_up: "20",
    techniques: "20",
    live_wrestling: "10",
    strength: "15",
    cool_down: "10",
    announcements: "5"
  };

  const DEFAULT_LIFTING_LIBRARY = {
    "Explosives / Power": [
      "Clean Pull", "Power Clean", "Hang Clean", "Power Pull", "Snatch",
      "Clean Pull Jumps", "Push Jerk", "Push Press", "Split Jerk"
    ],
    Legs: [
      "Barbell Squat", "Front Squat", "Pause Squat", "RDL (Romanian Deadlift)",
      "Dumbbell Lunges", "Dumbbell Step-ups", "Bulgarian Split Squat"
    ],
    "Push (Upper Body)": [
      "Bench Press", "Pause Bench Press", "Dumbbell Bench Press",
      "Incline Dumbbell Bench Press", "Shoulder Press", "Dumbbell Shoulder Press"
    ],
    "Pull (Upper Body)": [
      "Wide Grip Pull-ups", "Chin-ups", "Explosive Pull-ups",
      "Barbell Bent Over Rows", "Reverse Grip BB Row", "Dumbbell Rows"
    ],
    "Plyometrics / Bodyweight": [
      "Squat Jumps", "Split Squat Jumps", "Clap Push-ups", "Explosive Push-ups",
      "Burpees", "Knee Tucks", "Lateral Skater Hops", "Med Ball Slams", "Box Jumps"
    ],
    Accessories: [
      "Calf Raises", "Glute Bridge Holds", "Bicep Curls", "Hammer Curls",
      "Bench Dips", "Tricep Extensions", "Forearm Curls", "Shrugs"
    ]
  };

  function buildDefaultLiftingPlan() {
    return {
      id: "",
      name: "New 7-Day Cycle",
      weeks: "1-4",
      purpose: "Full week metabolic conditioning and strength base.",
      benefits: "Optimized recovery and specific wrestling movements.",
      days: Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        name: `Day ${index + 1}`,
        exercises: []
      }))
    };
  }

  const DEFAULT_PLANNER_LOGO_URL = "https://united-wc.com/assets/uwc-logo.png";
  const LEGACY_PLANNER_CLUB_NAME = "ARCHMERE AUKS";
  const LEGACY_PLANNER_COACH_NAME = "Coach Espinal";
  const LEGACY_PLANNER_SEASON = "Season 2025-2026";

  const STORAGE_KEYS = {
    settings: "planner_template_settings",
    library: "archmere_exercise_library",
    daily: "planner_daily_state",
    categoryNames: "planner_category_names",
    track: "planner_active_track",
    liftingDraft: "planner_lifting_draft",
    mentalDraft: "planner_mental_draft",
    liftingPlan: "planner_lifting_plan",
    liftingLibraryData: "planner_lifting_library_data",
    liftingActiveDay: "planner_lifting_active_day",
    liftingActiveTab: "planner_lifting_active_tab"
  };

  const TRACKS = ["wrestling", "lifting", "mental"];
  const LIFTING_TABS = ["overview", "editor", "program"];

  function normalizeTrack(value) {
    const raw = String(value || "").trim().toLowerCase();
    return TRACKS.includes(raw) ? raw : "wrestling";
  }

  function normalizeLiftingTab(value) {
    const raw = String(value || "").trim().toLowerCase();
    return LIFTING_TABS.includes(raw) ? raw : "editor";
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore localStorage errors
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function makeId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function getDefaultCategoryNames() {
    return CATEGORIES.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }

  function normalizeCategoryId(value) {
    const raw = String(value || "").trim();
    return CATEGORIES.some((category) => category.id === raw) ? raw : CATEGORIES[0].id;
  }

  function normalizeLibraryEntries(entries = []) {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry) => {
        const name = String(entry?.name || "").trim();
        const categoryId = normalizeCategoryId(entry?.categoryId);
        if (!name) return null;
        return {
          id: String(entry?.id || makeId()),
          name,
          categoryId
        };
      })
      .filter(Boolean);
  }

  function normalizeLiftingLibraryMap(raw = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    const result = {};
    Object.entries(source).forEach(([key, value]) => {
      const category = String(key || "").trim();
      if (!category) return;
      const list = Array.isArray(value) ? value : [];
      const normalized = Array.from(new Set(
        list
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      ));
      result[category] = normalized;
    });
    if (!Object.keys(result).length) {
      return JSON.parse(JSON.stringify(DEFAULT_LIFTING_LIBRARY));
    }
    return result;
  }

  function normalizeLiftingExercise(raw = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    const name = String(source.name || "").trim();
    if (!name) return null;
    return {
      id: String(source.id || makeId()),
      name,
      sets: String(source.sets || "3").trim() || "3",
      reps: String(source.reps || "10").trim() || "10",
      intensity: String(source.intensity || "70%").trim() || "70%"
    };
  }

  function normalizeLiftingPlan(raw = {}) {
    const fallback = buildDefaultLiftingPlan();
    const source = raw && typeof raw === "object" ? raw : {};
    const baseDays = Array.isArray(source.days) && source.days.length ? source.days : fallback.days;
    const days = baseDays.slice(0, 7).map((day, index) => {
      const daySource = day && typeof day === "object" ? day : {};
      const exercises = Array.isArray(daySource.exercises) ? daySource.exercises : [];
      return {
        id: index + 1,
        name: String(daySource.name || `Day ${index + 1}`).trim() || `Day ${index + 1}`,
        exercises: exercises.map(normalizeLiftingExercise).filter(Boolean)
      };
    });
    while (days.length < 7) {
      days.push({ id: days.length + 1, name: `Day ${days.length + 1}`, exercises: [] });
    }
    return {
      id: String(source.id || "").trim(),
      name: String(source.name || fallback.name).trim() || fallback.name,
      weeks: String(source.weeks || fallback.weeks).trim() || fallback.weeks,
      purpose: String(source.purpose || fallback.purpose).trim() || fallback.purpose,
      benefits: String(source.benefits || fallback.benefits).trim() || fallback.benefits,
      updatedAt: String(source.updatedAt || "").trim(),
      days
    };
  }

  function normalizeLiftingPlanSummary(id, raw = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      id: String(id || source.id || "").trim(),
      name: String(source.name || "Untitled Protocol").trim() || "Untitled Protocol",
      weeks: String(source.weeks || "").trim(),
      updatedAt: String(source.updatedAt || source.createdAt || "").trim()
    };
  }

  function getDefaultPlannerCoachName() {
    const profile = (typeof getProfile === "function" ? getProfile() : null) || {};
    const authUser = (typeof getAuthUser === "function" ? getAuthUser() : null) || {};
    const fromProfile = String(profile?.name || "").trim();
    const fromAuthName = String(authUser?.name || "").trim();
    const fromAuthEmail = String(authUser?.email || "").trim();
    return fromProfile || fromAuthName || fromAuthEmail || "Coach";
  }

  function buildPlannerDefaultSettings() {
    return {
      clubName: "United Wrestling Club",
      coach: getDefaultPlannerCoachName(),
      season: LEGACY_PLANNER_SEASON,
      logoUrl: DEFAULT_PLANNER_LOGO_URL
    };
  }

  function shouldUseDefaultClubName(value) {
    const clean = String(value || "").trim();
    return !clean || clean === LEGACY_PLANNER_CLUB_NAME;
  }

  function shouldUseDefaultCoachName(value) {
    const clean = String(value || "").trim();
    return !clean || clean === LEGACY_PLANNER_COACH_NAME;
  }

  function shouldUseDefaultSeason(value) {
    const clean = String(value || "").trim();
    return !clean || clean === LEGACY_PLANNER_SEASON;
  }

  function normalizePlannerSettings(raw = {}, { migrateLegacy = false } = {}) {
    const defaults = buildPlannerDefaultSettings();
    const source = raw && typeof raw === "object" ? raw : {};
    const next = {
      clubName: String(source.clubName || "").trim(),
      coach: String(source.coach || "").trim(),
      season: String(source.season || "").trim(),
      logoUrl: String(source.logoUrl || "").trim()
    };

    if (migrateLegacy) {
      if (shouldUseDefaultClubName(next.clubName)) next.clubName = defaults.clubName;
      if (shouldUseDefaultCoachName(next.coach)) next.coach = defaults.coach;
      if (shouldUseDefaultSeason(next.season)) next.season = defaults.season;
      if (!next.logoUrl) next.logoUrl = defaults.logoUrl;
    } else {
      next.clubName = next.clubName || defaults.clubName;
      next.coach = next.coach || defaults.coach;
      next.season = next.season || defaults.season;
      next.logoUrl = next.logoUrl || defaults.logoUrl;
    }

    return next;
  }

  const profilePlannerSettings = (() => {
    const profile = getPlannerProfile() || {};
    return profile?.plannerTemplateSettings && typeof profile.plannerTemplateSettings === "object"
      ? profile.plannerTemplateSettings
      : {};
  })();

  const dailyState = readJson(STORAGE_KEYS.daily, {});

  const state = {
    activeTrack: normalizeTrack(readJson(STORAGE_KEYS.track, "wrestling")),
    docInfo: {
      date: String(dailyState.date || ""),
      totalTime: String(dailyState.totalTime || "90")
    },
    settings: normalizePlannerSettings({
      ...(readJson(STORAGE_KEYS.settings, buildPlannerDefaultSettings()) || {}),
      ...profilePlannerSettings
    }, { migrateLegacy: true }),
    tempSettings: null,
    categoryNames: {
      ...getDefaultCategoryNames(),
      ...(readJson(STORAGE_KEYS.categoryNames, {}) || {})
    },
    exerciseLibrary: normalizeLibraryEntries(readJson(STORAGE_KEYS.library, INITIAL_LIBRARY)),
    schedule: dailyState.schedule && typeof dailyState.schedule === "object" ? dailyState.schedule : {},
    categoryTimes: {
      ...INITIAL_TIMES,
      ...(dailyState.categoryTimes && typeof dailyState.categoryTimes === "object" ? dailyState.categoryTimes : {})
    },
    coachLibraries: [],
    coachLibrariesStatus: "Loading coach libraries...",
    coachLibrariesUnsub: null,
    coachLibrariesReady: false,
    librarySyncTimer: null,
    settingsSyncTimer: null,
    categoryDrafts: {},
    pendingLibraryFocus: "",
    templateRecords: [],
    activeTemplateId: "",
    activeTemplateName: "",
    templateSaveBusy: false,
    assignAthletes: [],
    selectedAthleteIds: [],
    assignSearch: "",
    assignDueDate: "",
    assignModalBusy: false,
    liftingDraft: readJson(STORAGE_KEYS.liftingDraft, {}) || {},
    mentalDraft: readJson(STORAGE_KEYS.mentalDraft, {}) || {},
    liftingTab: normalizeLiftingTab(readJson(STORAGE_KEYS.liftingActiveTab, "editor") || "editor"),
    liftingActiveDay: Math.max(0, Math.min(6, parseInt(String(readJson(STORAGE_KEYS.liftingActiveDay, 0) || 0), 10) || 0)),
    liftingPlan: normalizeLiftingPlan(readJson(STORAGE_KEYS.liftingPlan, buildDefaultLiftingPlan()) || buildDefaultLiftingPlan()),
    liftingLibrary: normalizeLiftingLibraryMap(readJson(STORAGE_KEYS.liftingLibraryData, DEFAULT_LIFTING_LIBRARY) || DEFAULT_LIFTING_LIBRARY),
    liftingSearch: "",
    liftingPlans: [],
    liftingPlansUnsub: null,
    liftingLibraryUnsub: null,
    liftingBusy: false,
    lastSavedTemplateId: "",
    lastSentPlanId: "",
    toastTimer: null,
    pendingFocus: null
  };

  CATEGORIES.forEach((category) => {
    if (!Array.isArray(state.schedule[category.id])) {
      state.schedule[category.id] = [];
    }
    if (state.categoryTimes[category.id] == null) {
      state.categoryTimes[category.id] = INITIAL_TIMES[category.id] || "0";
    }
  });

  const els = {
    headerTitle: document.getElementById("plannerHeaderTitle"),
    headerSubtitle: document.getElementById("plannerHeaderSubtitle"),
    trackSwitch: document.getElementById("plannerTrackSwitch"),
    trackButtons: Array.from(root.querySelectorAll("[data-planner-track]")),
    trackPanels: Array.from(root.querySelectorAll("[data-planner-track-panel]")),
    wrestlingOnly: Array.from(root.querySelectorAll(".planner-track-wrestling-only")),
    timeBadge: document.getElementById("plannerTimeBadge"),
    timeLabel: document.getElementById("plannerTimeLabel"),
    openSettingsBtn: document.getElementById("plannerOpenSettingsBtn"),
    openLibraryBtn: document.getElementById("plannerOpenLibraryBtn"),
    loadTemplateBtn: document.getElementById("plannerLoadTemplateBtn"),
    saveTemplateTopBtn: document.getElementById("plannerSaveTemplateTopBtn"),
    sendAthletesTopBtn: document.getElementById("plannerSendAthletesTopBtn"),
    printBtn: document.getElementById("plannerPrintBtn"),
    dateInput: document.getElementById("plannerDateInput"),
    datePrintValue: document.getElementById("plannerDatePrintValue"),
    totalTimeInput: document.getElementById("plannerTotalTimeInput"),
    totalTimeDownBtn: document.getElementById("plannerTotalTimeDownBtn"),
    totalTimeUpBtn: document.getElementById("plannerTotalTimeUpBtn"),
    totalTimePrintValue: document.getElementById("plannerTotalTimePrintValue"),
    rows: document.getElementById("plannerRows"),
    footerClub: document.getElementById("plannerFooterClub"),
    footerCoach: document.getElementById("plannerFooterCoach"),
    footerSeason: document.getElementById("plannerFooterSeason"),
    logoPreview: document.getElementById("plannerLogoPreview"),
    logoPlaceholder: document.getElementById("plannerLogoPlaceholder"),
    toast: document.getElementById("plannerToast"),
    overtimeAlert: document.getElementById("plannerOvertimeAlert"),

    settingsModal: document.getElementById("plannerSettingsModal"),
    settingsCloseBtn: document.getElementById("plannerSettingsCloseBtn"),
    settingsCancelBtn: document.getElementById("plannerSettingsCancelBtn"),
    settingsSaveBtn: document.getElementById("plannerSettingsSaveBtn"),
    settingsClubInput: document.getElementById("plannerSettingsClubInput"),
    settingsCoachInput: document.getElementById("plannerSettingsCoachInput"),
    settingsSeasonInput: document.getElementById("plannerSettingsSeasonInput"),
    settingsLogoInput: document.getElementById("plannerSettingsLogoInput"),
    settingsLogoPreview: document.getElementById("plannerSettingsLogoPreview"),
    settingsLogoPlaceholder: document.getElementById("plannerSettingsLogoPlaceholder"),
    settingsRemoveLogoBtn: document.getElementById("plannerSettingsRemoveLogoBtn"),

    libraryModal: document.getElementById("plannerLibraryModal"),
    libraryCloseBtn: document.getElementById("plannerLibraryCloseBtn"),
    libraryCancelBtn: document.getElementById("plannerLibraryCancelBtn"),
    newExerciseNameInput: document.getElementById("plannerNewExerciseNameInput"),
    newExerciseCategorySelect: document.getElementById("plannerNewExerciseCategorySelect"),
    saveLibraryItemBtn: document.getElementById("plannerSaveLibraryItemBtn"),
    libraryGroups: document.getElementById("plannerLibraryGroups"),
    coachLibrariesStatus: document.getElementById("plannerCoachLibrariesStatus"),
    coachLibraries: document.getElementById("plannerCoachLibraries"),
    saveTemplateBtn: document.getElementById("plannerSaveTemplateBtn"),
    sendAthletesBtn: document.getElementById("plannerSendAthletesBtn"),
    bottomStatus: document.getElementById("plannerBottomStatus"),
    templatesModal: document.getElementById("plannerTemplatesModal"),
    templatesCloseBtn: document.getElementById("plannerTemplatesCloseBtn"),
    templatesCancelBtn: document.getElementById("plannerTemplatesCancelBtn"),
    templatesRefreshBtn: document.getElementById("plannerTemplatesRefreshBtn"),
    templatesStatus: document.getElementById("plannerTemplatesStatus"),
    templatesList: document.getElementById("plannerTemplatesList"),
    assignModal: document.getElementById("plannerAssignModal"),
    assignCloseBtn: document.getElementById("plannerAssignCloseBtn"),
    assignCancelBtn: document.getElementById("plannerAssignCancelBtn"),
    assignSendBtn: document.getElementById("plannerAssignSendBtn"),
    assignList: document.getElementById("plannerAssignList"),
    assignStatus: document.getElementById("plannerAssignStatus"),
    assignSearchInput: document.getElementById("plannerAssignSearchInput"),
    assignSelectAllBtn: document.getElementById("plannerAssignSelectAllBtn"),
    assignClearBtn: document.getElementById("plannerAssignClearBtn"),
    assignDueDateInput: document.getElementById("plannerAssignDueDateInput"),
    liftingTitleInput: document.getElementById("plannerLiftingTitle"),
    liftingDateInput: document.getElementById("plannerLiftingDate"),
    liftingTotalTimeInput: document.getElementById("plannerLiftingTotalTime"),
    liftingWarmupInput: document.getElementById("plannerLiftingWarmup"),
    liftingMainLiftsInput: document.getElementById("plannerLiftingMainLifts"),
    liftingAccessoryInput: document.getElementById("plannerLiftingAccessory"),
    liftingConditioningInput: document.getElementById("plannerLiftingConditioning"),
    liftingRecoveryInput: document.getElementById("plannerLiftingRecovery"),
    liftingSaveBtn: document.getElementById("plannerLiftingSaveBtn"),
    liftingClearBtn: document.getElementById("plannerLiftingClearBtn"),
    liftingStatus: document.getElementById("plannerLiftingStatus"),
    mentalTitleInput: document.getElementById("plannerMentalTitle"),
    mentalDateInput: document.getElementById("plannerMentalDate"),
    mentalTotalTimeInput: document.getElementById("plannerMentalTotalTime"),
    mentalBreathingInput: document.getElementById("plannerMentalBreathing"),
    mentalVisualizationInput: document.getElementById("plannerMentalVisualization"),
    mentalIqInput: document.getElementById("plannerMentalIq"),
    mentalConfidenceInput: document.getElementById("plannerMentalConfidence"),
    mentalReflectionInput: document.getElementById("plannerMentalReflection"),
    mentalSaveBtn: document.getElementById("plannerMentalSaveBtn"),
    mentalClearBtn: document.getElementById("plannerMentalClearBtn"),
    mentalStatus: document.getElementById("plannerMentalStatus"),
    liftingShell: document.getElementById("plannerLiftingShell"),
    liftingTabs: Array.from(root.querySelectorAll("[data-lifting-tab]")),
    liftingViews: Array.from(root.querySelectorAll("[data-lifting-view]")),
    liftingPrintBtn: document.getElementById("plannerLiftingPrintBtn"),
    liftingSaveProtocolBtn: document.getElementById("plannerLiftingSaveProtocolBtn"),
    liftingStatus: document.getElementById("plannerLiftingStatus"),
    liftingPlanNameInput: document.getElementById("plannerLiftingPlanNameInput"),
    liftingPlanWeeksInput: document.getElementById("plannerLiftingPlanWeeksInput"),
    liftingPlanPurposeInput: document.getElementById("plannerLiftingPlanPurposeInput"),
    liftingPlanBenefitsInput: document.getElementById("plannerLiftingPlanBenefitsInput"),
    liftingDayTabs: document.getElementById("plannerLiftingDayTabs"),
    liftingActiveDayNameInput: document.getElementById("plannerLiftingActiveDayNameInput"),
    liftingExerciseList: document.getElementById("plannerLiftingExerciseList"),
    liftingCategorySelect: document.getElementById("plannerLiftingCategorySelect"),
    liftingNewCategoryInput: document.getElementById("plannerLiftingNewCategoryInput"),
    liftingAddCategoryBtn: document.getElementById("plannerLiftingAddCategoryBtn"),
    liftingNewExerciseInput: document.getElementById("plannerLiftingNewExerciseInput"),
    liftingAddExerciseBtn: document.getElementById("plannerLiftingAddExerciseBtn"),
    liftingSearchInput: document.getElementById("plannerLiftingSearchInput"),
    liftingLibraryGroups: document.getElementById("plannerLiftingLibraryGroups"),
    liftingSavedList: document.getElementById("plannerLiftingSavedList"),
    liftingProtocolsCount: document.getElementById("plannerLiftingProtocolsCount"),
    liftingExercisesCount: document.getElementById("plannerLiftingExercisesCount"),
    liftingActiveDayLabel: document.getElementById("plannerLiftingActiveDayLabel"),
    liftingProgramMeta: document.getElementById("plannerLiftingProgramMeta"),
    liftingProgramKpis: document.getElementById("plannerLiftingProgramKpis"),
    liftingProgramDayChart: document.getElementById("plannerLiftingProgramDayChart"),
    liftingProgramCategoryChart: document.getElementById("plannerLiftingProgramCategoryChart"),
    liftingProgramIntensity: document.getElementById("plannerLiftingProgramIntensity")
  };

  function persistDaily() {
    writeJson(STORAGE_KEYS.daily, {
      date: state.docInfo.date,
      totalTime: state.docInfo.totalTime,
      schedule: state.schedule,
      categoryTimes: state.categoryTimes
    });
  }

  function persistSettings() {
    writeJson(STORAGE_KEYS.settings, state.settings);
  }

  function mergePlannerSettings(nextSettings = {}, { sync = false } = {}) {
    const normalized = normalizePlannerSettings(nextSettings, { migrateLegacy: true });
    state.settings = normalized;
    persistSettings();
    updateFooter();
    updateLogos();
    if (sync) {
      queuePlannerSettingsSync();
    }
  }

  function persistLibrary() {
    writeJson(STORAGE_KEYS.library, state.exerciseLibrary);
  }

  function persistCategoryNames() {
    writeJson(STORAGE_KEYS.categoryNames, state.categoryNames);
  }

  function getCategoryNameById(categoryId) {
    const fallback = CATEGORIES.find((category) => category.id === categoryId)?.name || "Category";
    return String(state.categoryNames?.[categoryId] || fallback).trim() || fallback;
  }

  function isDuplicateLibraryEntry(name, categoryId) {
    const cleanName = String(name || "").trim().toLowerCase();
    const safeCategoryId = normalizeCategoryId(categoryId);
    if (!cleanName) return false;
    return state.exerciseLibrary.some((entry) => {
      return normalizeCategoryId(entry.categoryId) === safeCategoryId
        && String(entry.name || "").trim().toLowerCase() === cleanName;
    });
  }

  function triggerToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 2500);
  }

  function parseTimeValue(value) {
    const parsed = parseInt(String(value || "0"), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatDateForPrint(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function getUsedTime() {
    return CATEGORIES.reduce((total, category) => total + parseTimeValue(state.categoryTimes[category.id]), 0);
  }

  function normalizeTotalTime(rawValue) {
    const parsed = parseInt(String(rawValue || "").trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 90;
    return parsed;
  }

  function updatePrintMetaValues() {
    if (els.datePrintValue) {
      els.datePrintValue.textContent = formatDateForPrint(state.docInfo.date);
    }
    if (els.totalTimePrintValue) {
      const total = Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"));
      els.totalTimePrintValue.textContent = `${total} min`;
    }
  }

  function setTotalTime(nextValue) {
    const normalized = normalizeTotalTime(nextValue);
    state.docInfo.totalTime = String(normalized);
    if (els.totalTimeInput) {
      els.totalTimeInput.value = state.docInfo.totalTime;
    }
    persistDaily();
    updatePrintMetaValues();
    updateTimeStatus();
  }

  function updateTimeStatus() {
    const used = getUsedTime();
    const planned = Math.max(1, parseTimeValue(state.docInfo.totalTime));
    if (els.timeLabel) {
      els.timeLabel.textContent = `${used}/${planned} min`;
    }
    if (els.timeBadge) {
      els.timeBadge.classList.remove("is-over", "is-perfect", "is-under");
      if (used > planned) {
        els.timeBadge.classList.add("is-over");
      } else if (used === planned) {
        els.timeBadge.classList.add("is-perfect");
      } else {
        els.timeBadge.classList.add("is-under");
      }
    }
    if (els.overtimeAlert) {
      if (used > planned) {
        els.overtimeAlert.textContent = `Time exceeded: ${used} / ${planned} min. Adjust category times.`;
        els.overtimeAlert.classList.remove("hidden");
      } else {
        els.overtimeAlert.classList.add("hidden");
      }
    }
  }

  function updateFooter() {
    const defaults = buildPlannerDefaultSettings();
    if (els.footerClub) els.footerClub.textContent = state.settings.clubName || defaults.clubName;
    if (els.footerCoach) els.footerCoach.textContent = state.settings.coach || defaults.coach;
    if (els.footerSeason) els.footerSeason.textContent = state.settings.season || defaults.season;
  }

  function getTrackUiCopy(track) {
    if (track === "lifting") {
      return {
        title: "Lifting & Conditioning Lab",
        subtitle: "Build 7-day strength protocols with a live exercise library."
      };
    }
    if (track === "mental") {
      return {
        title: "",
        subtitle: ""
      };
    }
    return {
      title: "Wrestling Training Planner",
      subtitle: "Build and assign wrestling practice plans."
    };
  }

  function focusPlannerWindow(target = null, { smooth = false } = {}) {
    const focusFn = typeof window.wplFocusOpenedWindow === "function" ? window.wplFocusOpenedWindow : null;
    if (focusFn) {
      focusFn(target || root, { smooth });
      window.setTimeout(() => focusFn(target || root, { smooth }), 120);
      return;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const node = target instanceof Element ? target : root;
      node?.scrollIntoView?.({ behavior: smooth ? "smooth" : "auto", block: "start", inline: "nearest" });
    }
  }

  function renderTrackPanels() {
    const activeTrack = normalizeTrack(state.activeTrack);
    state.activeTrack = activeTrack;
    writeJson(STORAGE_KEYS.track, activeTrack);
    const copy = getTrackUiCopy(activeTrack);
    if (els.headerTitle) els.headerTitle.textContent = copy.title;
    if (els.headerSubtitle) els.headerSubtitle.textContent = copy.subtitle;
    els.trackButtons.forEach((btn) => {
      const track = normalizeTrack(btn.dataset.plannerTrack);
      const isActive = track === activeTrack;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    els.trackPanels.forEach((panel) => {
      const panelTrack = normalizeTrack(panel.dataset.plannerTrackPanel);
      panel.classList.toggle("hidden", panelTrack !== activeTrack);
    });
    const wrestlingMode = activeTrack === "wrestling";
    els.wrestlingOnly.forEach((node) => {
      node.classList.toggle("hidden", !wrestlingMode);
    });
  }

  function getTrackDraftElements(track) {
    if (track === "lifting") {
      return {
        title: els.liftingTitleInput,
        date: els.liftingDateInput,
        totalTime: els.liftingTotalTimeInput,
        block1: els.liftingWarmupInput,
        block2: els.liftingMainLiftsInput,
        block3: els.liftingAccessoryInput,
        block4: els.liftingConditioningInput,
        block5: els.liftingRecoveryInput,
        status: els.liftingStatus
      };
    }
    if (track === "mental") {
      return {
        title: els.mentalTitleInput,
        date: els.mentalDateInput,
        totalTime: els.mentalTotalTimeInput,
        block1: els.mentalBreathingInput,
        block2: els.mentalVisualizationInput,
        block3: els.mentalIqInput,
        block4: els.mentalConfidenceInput,
        block5: els.mentalReflectionInput,
        status: els.mentalStatus
      };
    }
    return null;
  }

  function getTrackDraftState(track) {
    if (track === "lifting") return state.liftingDraft || {};
    if (track === "mental") return state.mentalDraft || {};
    return {};
  }

  function setTrackDraftState(track, draft) {
    if (track === "lifting") {
      state.liftingDraft = draft;
      writeJson(STORAGE_KEYS.liftingDraft, draft);
      return;
    }
    if (track === "mental") {
      state.mentalDraft = draft;
      writeJson(STORAGE_KEYS.mentalDraft, draft);
    }
  }

  function fillTrackDraftInputs(track) {
    const elements = getTrackDraftElements(track);
    if (!elements) return;
    const draft = getTrackDraftState(track);
    Object.entries(elements).forEach(([key, input]) => {
      if (!input || key === "status") return;
      input.value = String(draft?.[key] || "");
    });
  }

  function collectTrackDraftInputs(track) {
    const elements = getTrackDraftElements(track);
    if (!elements) return {};
    const draft = {};
    Object.entries(elements).forEach(([key, input]) => {
      if (!input || key === "status") return;
      draft[key] = String(input.value || "").trim();
    });
    return draft;
  }

  function setTrackDraftStatus(track, message = "", { isError = false } = {}) {
    const elements = getTrackDraftElements(track);
    if (!elements?.status) return;
    elements.status.textContent = message;
    elements.status.classList.toggle("planner-status-error", Boolean(isError));
  }

  function saveTrackDraft(track) {
    const draft = collectTrackDraftInputs(track);
    setTrackDraftState(track, draft);
    const message = track === "mental"
      ? "Mind & focus draft saved."
      : "Lifting & conditioning draft saved.";
    setTrackDraftStatus(track, message);
    triggerToast(message);
  }

  function clearTrackDraft(track) {
    setTrackDraftState(track, {});
    fillTrackDraftInputs(track);
    const message = track === "mental"
      ? "Mind & focus draft cleared."
      : "Lifting & conditioning draft cleared.";
    setTrackDraftStatus(track, message);
  }

  function persistLiftingPlanLocal() {
    writeJson(STORAGE_KEYS.liftingPlan, state.liftingPlan);
  }

  function persistLiftingLibraryLocal() {
    writeJson(STORAGE_KEYS.liftingLibraryData, state.liftingLibrary);
  }

  function persistLiftingUiLocal() {
    writeJson(STORAGE_KEYS.liftingActiveDay, state.liftingActiveDay);
    writeJson(STORAGE_KEYS.liftingActiveTab, state.liftingTab);
  }

  function setLiftingStatus(message, isError = false) {
    if (!els.liftingStatus) return;
    els.liftingStatus.textContent = String(message || "");
    els.liftingStatus.classList.toggle("planner-status-error", Boolean(isError));
  }

  function getLiftingProtocolsRef() {
    return getPlannerWorkspaceCollectionRef("lifting_protocols");
  }

  function getLiftingLibraryDocRef() {
    const settingsRef = getPlannerWorkspaceCollectionRef("lifting_settings");
    if (!settingsRef) return null;
    return settingsRef.doc("library");
  }

  function renderLiftingTabs() {
    state.liftingTab = normalizeLiftingTab(state.liftingTab);
    persistLiftingUiLocal();
    els.liftingTabs.forEach((button) => {
      const tab = normalizeLiftingTab(button.dataset.liftingTab);
      const isActive = tab === state.liftingTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    els.liftingViews.forEach((view) => {
      const viewTab = normalizeLiftingTab(view.dataset.liftingView);
      view.classList.toggle("hidden", viewTab !== state.liftingTab);
    });
  }

  function getActiveLiftingDay() {
    const index = Math.max(0, Math.min(6, state.liftingActiveDay));
    state.liftingActiveDay = index;
    return state.liftingPlan.days[index];
  }

  function renderLiftingDayTabs() {
    if (!els.liftingDayTabs) return;
    const html = state.liftingPlan.days.map((day, index) => {
      const isActive = index === state.liftingActiveDay;
      const count = Array.isArray(day.exercises) ? day.exercises.length : 0;
      return `
        <button
          type="button"
          class="planner-lifting-day-tab${isActive ? " active" : ""}"
          data-action="lifting-switch-day"
          data-day-index="${index}"
        >
          ${escapeHtml(day.name || `Day ${index + 1}`)}${count ? ` (${count})` : ""}
        </button>
      `;
    }).join("");
    els.liftingDayTabs.innerHTML = html;
  }

  function renderLiftingExerciseList() {
    if (!els.liftingExerciseList) return;
    const day = getActiveLiftingDay();
    if (!day || !Array.isArray(day.exercises) || !day.exercises.length) {
      els.liftingExerciseList.innerHTML = `<p class="planner-lifting-empty">No exercises yet. Add movements from the library.</p>`;
      return;
    }
    const html = day.exercises.map((exercise) => {
      return `
        <article class="planner-lifting-exercise-row">
          <div class="planner-lifting-exercise-row-main">
            <strong>${escapeHtml(exercise.name)}</strong>
            <button
              type="button"
              class="ghost"
              data-action="lifting-remove-exercise"
              data-exercise-id="${escapeHtml(exercise.id)}"
            >Delete</button>
          </div>
          <div class="planner-lifting-exercise-fields">
            <label>
              <span>Sets</span>
              <input
                type="text"
                value="${escapeHtml(exercise.sets)}"
                data-action="lifting-update-exercise-field"
                data-exercise-id="${escapeHtml(exercise.id)}"
                data-field="sets"
              >
            </label>
            <label>
              <span>Reps</span>
              <input
                type="text"
                value="${escapeHtml(exercise.reps)}"
                data-action="lifting-update-exercise-field"
                data-exercise-id="${escapeHtml(exercise.id)}"
                data-field="reps"
              >
            </label>
            <label>
              <span>% RM</span>
              <input
                type="text"
                value="${escapeHtml(exercise.intensity)}"
                data-action="lifting-update-exercise-field"
                data-exercise-id="${escapeHtml(exercise.id)}"
                data-field="intensity"
              >
            </label>
          </div>
        </article>
      `;
    }).join("");
    els.liftingExerciseList.innerHTML = html;
  }

  function renderLiftingCategorySelect() {
    if (!els.liftingCategorySelect) return;
    const categories = Object.keys(state.liftingLibrary || {});
    if (!categories.length) {
      state.liftingLibrary = normalizeLiftingLibraryMap(DEFAULT_LIFTING_LIBRARY);
    }
    const safeCategories = Object.keys(state.liftingLibrary || {});
    const selected = String(els.liftingCategorySelect.value || safeCategories[0] || "").trim();
    els.liftingCategorySelect.innerHTML = safeCategories.map((category) => {
      return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
    }).join("");
    if (safeCategories.includes(selected)) {
      els.liftingCategorySelect.value = selected;
    } else if (safeCategories.length) {
      els.liftingCategorySelect.value = safeCategories[0];
    }
  }

  function getFilteredLiftingLibrary() {
    const filter = String(state.liftingSearch || "").trim().toLowerCase();
    if (!filter) return state.liftingLibrary;
    const output = {};
    Object.entries(state.liftingLibrary || {}).forEach(([category, items]) => {
      const matches = (Array.isArray(items) ? items : []).filter((entry) => String(entry || "").toLowerCase().includes(filter));
      if (matches.length) output[category] = matches;
    });
    return output;
  }

  function renderLiftingLibraryGroups() {
    if (!els.liftingLibraryGroups) return;
    const filtered = getFilteredLiftingLibrary();
    const categories = Object.keys(filtered);
    if (!categories.length) {
      els.liftingLibraryGroups.innerHTML = `<p class="small muted">No matches in library.</p>`;
      return;
    }
    els.liftingLibraryGroups.innerHTML = categories.map((category) => {
      const items = filtered[category] || [];
      return `
        <article class="planner-lifting-library-group">
          <h6>${escapeHtml(category)}</h6>
          <div class="planner-lifting-library-items">
            ${items.map((exercise) => `
              <button
                type="button"
                class="planner-lifting-library-item"
                data-action="lifting-add-exercise-to-day"
                data-exercise-name="${escapeHtml(exercise)}"
              >+ ${escapeHtml(exercise)}</button>
            `).join("")}
          </div>
        </article>
      `;
    }).join("");
  }

  function formatLiftingUpdatedAt(value) {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) return "No date";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function renderLiftingSavedList() {
    if (!els.liftingSavedList) return;
    if (!state.liftingPlans.length) {
      els.liftingSavedList.innerHTML = `<p class="small muted">No saved protocols yet.</p>`;
      return;
    }
    els.liftingSavedList.innerHTML = state.liftingPlans.map((plan) => {
      const isActive = plan.id && plan.id === state.liftingPlan.id;
      return `
        <article class="planner-lifting-saved-item${isActive ? " active" : ""}">
          <div>
            <strong>${escapeHtml(plan.name)}</strong>
            <p class="small muted">${escapeHtml(formatLiftingUpdatedAt(plan.updatedAt))}</p>
          </div>
          <div class="planner-inline-buttons">
            <button type="button" class="ghost" data-action="lifting-load-plan" data-plan-id="${escapeHtml(plan.id)}">Load</button>
            <button type="button" class="ghost" data-action="lifting-delete-plan" data-plan-id="${escapeHtml(plan.id)}">Delete</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderLiftingOverview() {
    if (els.liftingProtocolsCount) {
      els.liftingProtocolsCount.textContent = String(state.liftingPlans.length);
    }
    if (els.liftingExercisesCount) {
      const total = Object.values(state.liftingLibrary || {}).reduce((sum, list) => {
        return sum + (Array.isArray(list) ? list.length : 0);
      }, 0);
      els.liftingExercisesCount.textContent = String(total);
    }
    if (els.liftingActiveDayLabel) {
      const day = getActiveLiftingDay();
      els.liftingActiveDayLabel.textContent = day?.name || `Day ${state.liftingActiveDay + 1}`;
    }
  }

  function parseLiftingNumber(value, fallback = 0) {
    const match = String(value || "").match(/-?\d+(\.\d+)?/);
    if (!match) return fallback;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function parseLiftingRepsValue(value) {
    const numbers = String(value || "")
      .match(/\d+(\.\d+)?/g);
    if (!numbers || !numbers.length) return 0;
    if (numbers.length === 1) return Number(numbers[0]) || 0;
    const sum = numbers.reduce((acc, item) => acc + (Number(item) || 0), 0);
    return sum / numbers.length;
  }

  function parseLiftingIntensityValue(value) {
    const parsed = parseLiftingNumber(value, 0);
    if (parsed <= 0) return 0;
    if (parsed <= 1) return parsed * 100;
    return parsed;
  }

  function resolveLiftingExerciseCategoryName(exerciseName = "") {
    const target = String(exerciseName || "").trim().toLowerCase();
    if (!target) return "Uncategorized";
    const libraryEntries = Object.entries(state.liftingLibrary || {});
    for (const [categoryName, exerciseList] of libraryEntries) {
      const found = (Array.isArray(exerciseList) ? exerciseList : []).some((item) => {
        return String(item || "").trim().toLowerCase() === target;
      });
      if (found) return categoryName;
    }
    return "Uncategorized";
  }

  function buildLiftingBlueprintMetrics() {
    const safePlan = normalizeLiftingPlan(state.liftingPlan || buildDefaultLiftingPlan());
    const dayRows = safePlan.days.map((day, index) => {
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      let totalSets = 0;
      let totalVolume = 0;
      let intensityWeighted = 0;
      let intensityCount = 0;
      exercises.forEach((exercise) => {
        const sets = Math.max(0, parseLiftingNumber(exercise.sets, 0));
        const reps = Math.max(0, parseLiftingRepsValue(exercise.reps));
        const intensity = Math.max(0, parseLiftingIntensityValue(exercise.intensity));
        const volume = sets * reps;
        totalSets += sets;
        totalVolume += volume;
        if (intensity > 0) {
          intensityWeighted += intensity;
          intensityCount += 1;
        }
      });
      return {
        index,
        name: day.name || `Day ${index + 1}`,
        exercises,
        exerciseCount: exercises.length,
        totalSets,
        totalVolume,
        avgIntensity: intensityCount ? (intensityWeighted / intensityCount) : 0,
        loadScore: totalVolume * ((intensityCount ? (intensityWeighted / intensityCount) : 70) / 100)
      };
    });

    const allExercises = dayRows.flatMap((day) => day.exercises.map((exercise) => ({ day, exercise })));
    const categoryMap = new Map();
    const intensityBuckets = {
      low: 0,
      moderate: 0,
      high: 0
    };
    let totalSets = 0;
    let totalVolume = 0;
    let intensitySum = 0;
    let intensityCount = 0;

    allExercises.forEach(({ exercise }) => {
      const category = resolveLiftingExerciseCategoryName(exercise.name);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      const sets = Math.max(0, parseLiftingNumber(exercise.sets, 0));
      const reps = Math.max(0, parseLiftingRepsValue(exercise.reps));
      const intensity = Math.max(0, parseLiftingIntensityValue(exercise.intensity));
      totalSets += sets;
      totalVolume += sets * reps;
      if (intensity > 0) {
        intensitySum += intensity;
        intensityCount += 1;
        if (intensity < 65) intensityBuckets.low += 1;
        else if (intensity <= 80) intensityBuckets.moderate += 1;
        else intensityBuckets.high += 1;
      }
    });

    const categoryRows = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count);

    const maxDayLoad = Math.max(1, ...dayRows.map((day) => day.loadScore || 0));
    const maxCategoryCount = Math.max(1, ...categoryRows.map((row) => row.count || 0));

    return {
      plan: safePlan,
      dayRows,
      totalExercises: allExercises.length,
      activeDays: dayRows.filter((day) => day.exerciseCount > 0).length,
      totalSets,
      totalVolume,
      avgIntensity: intensityCount ? (intensitySum / intensityCount) : 0,
      maxDayLoad,
      categoryRows,
      maxCategoryCount,
      intensityBuckets
    };
  }

  function renderLiftingProgramKpis(metrics) {
    if (!els.liftingProgramKpis) return;
    const cards = [
      { label: "Total exercises", value: String(metrics.totalExercises) },
      { label: "Active days", value: `${metrics.activeDays}/7` },
      { label: "Total sets", value: String(Math.round(metrics.totalSets)) },
      { label: "Volume reps", value: String(Math.round(metrics.totalVolume)) }
    ];
    els.liftingProgramKpis.innerHTML = cards.map((card) => {
      return `
        <article class="planner-lifting-program-kpi">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
        </article>
      `;
    }).join("");
  }

  function renderLiftingProgramDayChart(metrics) {
    if (!els.liftingProgramDayChart) return;
    if (!metrics.totalExercises) {
      els.liftingProgramDayChart.innerHTML = `<p class="planner-lifting-program-empty">Add exercises and save the protocol to view day-by-day load.</p>`;
      return;
    }
    els.liftingProgramDayChart.innerHTML = metrics.dayRows.map((day) => {
      const percent = Math.max(3, Math.round(((day.loadScore || 0) / metrics.maxDayLoad) * 100));
      return `
        <div class="planner-lifting-program-bar">
          <div class="planner-lifting-program-bar-head">
            <span>${escapeHtml(day.name)}</span>
            <span>${Math.round(day.totalVolume)} reps-load</span>
          </div>
          <div class="planner-lifting-program-bar-track">
            <div class="planner-lifting-program-bar-fill" style="width:${percent}%"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderLiftingProgramCategoryChart(metrics) {
    if (!els.liftingProgramCategoryChart) return;
    if (!metrics.categoryRows.length) {
      els.liftingProgramCategoryChart.innerHTML = `<p class="planner-lifting-program-empty">Category distribution will appear after adding exercises.</p>`;
      return;
    }
    els.liftingProgramCategoryChart.innerHTML = metrics.categoryRows.slice(0, 6).map((row) => {
      const percent = Math.max(6, Math.round((row.count / metrics.maxCategoryCount) * 100));
      return `
        <div class="planner-lifting-program-bar">
          <div class="planner-lifting-program-bar-head">
            <span>${escapeHtml(row.name)}</span>
            <span>${row.count}</span>
          </div>
          <div class="planner-lifting-program-bar-track">
            <div class="planner-lifting-program-bar-fill" style="width:${percent}%"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderLiftingProgramIntensity(metrics) {
    if (!els.liftingProgramIntensity) return;
    const avg = metrics.avgIntensity > 0 ? `${Math.round(metrics.avgIntensity)}%` : "--";
    els.liftingProgramIntensity.innerHTML = `
      <div class="planner-lifting-intensity-main">
        <strong>${avg}</strong>
        <span>Average intensity</span>
      </div>
      <div class="planner-lifting-intensity-breakdown">
        <div class="planner-lifting-intensity-breakdown-row"><span>Low (&lt;65%)</span><span>${metrics.intensityBuckets.low}</span></div>
        <div class="planner-lifting-intensity-breakdown-row"><span>Moderate (65-80%)</span><span>${metrics.intensityBuckets.moderate}</span></div>
        <div class="planner-lifting-intensity-breakdown-row"><span>High (&gt;80%)</span><span>${metrics.intensityBuckets.high}</span></div>
      </div>
    `;
  }

  function renderLiftingProgramBlueprint() {
    const metrics = buildLiftingBlueprintMetrics();
    if (els.liftingProgramMeta) {
      const updatedLabel = metrics.plan.updatedAt ? formatLiftingUpdatedAt(metrics.plan.updatedAt) : "No date";
      els.liftingProgramMeta.textContent = `${metrics.plan.name} • Weeks ${metrics.plan.weeks || "--"} • Updated ${updatedLabel}`;
    }
    renderLiftingProgramKpis(metrics);
    renderLiftingProgramDayChart(metrics);
    renderLiftingProgramCategoryChart(metrics);
    renderLiftingProgramIntensity(metrics);
  }

  function renderLiftingPlanFields() {
    if (els.liftingPlanNameInput) els.liftingPlanNameInput.value = state.liftingPlan.name || "";
    if (els.liftingPlanWeeksInput) els.liftingPlanWeeksInput.value = state.liftingPlan.weeks || "";
    if (els.liftingPlanPurposeInput) els.liftingPlanPurposeInput.value = state.liftingPlan.purpose || "";
    if (els.liftingPlanBenefitsInput) els.liftingPlanBenefitsInput.value = state.liftingPlan.benefits || "";
    const day = getActiveLiftingDay();
    if (els.liftingActiveDayNameInput) {
      els.liftingActiveDayNameInput.value = day?.name || "";
    }
  }

  function renderLiftingLab() {
    if (!els.liftingShell) return;
    state.liftingTab = normalizeLiftingTab(state.liftingTab);
    if (els.liftingSearchInput && els.liftingSearchInput.value !== state.liftingSearch) {
      els.liftingSearchInput.value = state.liftingSearch;
    }
    renderLiftingTabs();
    renderLiftingPlanFields();
    renderLiftingDayTabs();
    renderLiftingExerciseList();
    renderLiftingCategorySelect();
    renderLiftingLibraryGroups();
    renderLiftingSavedList();
    renderLiftingOverview();
    renderLiftingProgramBlueprint();
  }

  function setLiftingTab(tab) {
    state.liftingTab = normalizeLiftingTab(tab);
    persistLiftingUiLocal();
    renderLiftingLab();
  }

  function setLiftingActiveDay(index) {
    const safeIndex = Math.max(0, Math.min(6, parseInt(String(index || 0), 10) || 0));
    state.liftingActiveDay = safeIndex;
    persistLiftingUiLocal();
    renderLiftingLab();
  }

  function updateLiftingPlanMetaField(field, value) {
    if (!["name", "weeks", "purpose", "benefits"].includes(field)) return;
    state.liftingPlan[field] = String(value || "");
    persistLiftingPlanLocal();
    renderLiftingOverview();
  }

  function updateLiftingDayName(value) {
    const day = getActiveLiftingDay();
    if (!day) return;
    day.name = String(value || "").trim() || `Day ${state.liftingActiveDay + 1}`;
    persistLiftingPlanLocal();
    renderLiftingDayTabs();
    renderLiftingOverview();
  }

  function addLiftingExerciseToActiveDay(name) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return;
    const day = getActiveLiftingDay();
    if (!day) return;
    day.exercises.push({
      id: makeId(),
      name: cleanName,
      sets: "3",
      reps: "10",
      intensity: "70%"
    });
    persistLiftingPlanLocal();
    renderLiftingExerciseList();
    renderLiftingDayTabs();
    renderLiftingOverview();
  }

  function updateLiftingExerciseField(exerciseId, field, value) {
    const safeId = String(exerciseId || "").trim();
    if (!safeId || !["sets", "reps", "intensity"].includes(field)) return;
    const day = getActiveLiftingDay();
    if (!day) return;
    day.exercises = day.exercises.map((exercise) => {
      if (exercise.id !== safeId) return exercise;
      return { ...exercise, [field]: String(value || "").trim() };
    });
    persistLiftingPlanLocal();
  }

  function removeLiftingExercise(exerciseId) {
    const safeId = String(exerciseId || "").trim();
    if (!safeId) return;
    const day = getActiveLiftingDay();
    if (!day) return;
    day.exercises = day.exercises.filter((exercise) => exercise.id !== safeId);
    persistLiftingPlanLocal();
    renderLiftingExerciseList();
    renderLiftingDayTabs();
    renderLiftingOverview();
  }

  function addLiftingCategory() {
    const value = String(els.liftingNewCategoryInput?.value || "").trim();
    if (!value) {
      setLiftingStatus("Enter a category name first.", true);
      return;
    }
    if (!state.liftingLibrary[value]) {
      state.liftingLibrary[value] = [];
    }
    persistLiftingLibraryLocal();
    syncLiftingLibraryToCloud().catch(() => {});
    if (els.liftingNewCategoryInput) els.liftingNewCategoryInput.value = "";
    renderLiftingCategorySelect();
    renderLiftingLibraryGroups();
    setLiftingStatus(`Category added: ${value}`);
  }

  function addLiftingExerciseToLibrary() {
    const exercise = String(els.liftingNewExerciseInput?.value || "").trim();
    const category = String(els.liftingCategorySelect?.value || "").trim();
    if (!exercise) {
      setLiftingStatus("Enter an exercise name first.", true);
      return;
    }
    if (!category) {
      setLiftingStatus("Select a category first.", true);
      return;
    }
    if (!state.liftingLibrary[category]) {
      state.liftingLibrary[category] = [];
    }
    const exists = state.liftingLibrary[category].some((item) => item.toLowerCase() === exercise.toLowerCase());
    if (!exists) {
      state.liftingLibrary[category].push(exercise);
    }
    persistLiftingLibraryLocal();
    syncLiftingLibraryToCloud().catch(() => {});
    if (els.liftingNewExerciseInput) els.liftingNewExerciseInput.value = "";
    renderLiftingLibraryGroups();
    renderLiftingOverview();
    setLiftingStatus(`Exercise added to ${category}.`);
  }

  function loadLiftingPlanFromList(planId) {
    const safeId = String(planId || "").trim();
    if (!safeId) return;
    const record = state.liftingPlans.find((entry) => entry.id === safeId);
    if (!record) {
      setLiftingStatus("Protocol not found.", true);
      return;
    }
    const normalized = normalizeLiftingPlan(record);
    normalized.id = safeId;
    state.liftingPlan = normalized;
    state.liftingActiveDay = 0;
    persistLiftingPlanLocal();
    persistLiftingUiLocal();
    renderLiftingLab();
    setLiftingStatus(`Loaded protocol: ${normalized.name}`);
  }

  async function saveLiftingProtocol() {
    const name = String(state.liftingPlan.name || "").trim();
    if (!name) {
      setLiftingStatus("Protocol name is required.", true);
      return;
    }
    if (state.liftingBusy) return;
    state.liftingBusy = true;
    if (els.liftingSaveProtocolBtn) els.liftingSaveProtocolBtn.disabled = true;
    const safeId = String(state.liftingPlan.id || "").trim() || `lifting_${Date.now()}`;
    const payload = normalizeLiftingPlan({
      ...state.liftingPlan,
      id: safeId,
      updatedAt: new Date().toISOString()
    });
    state.liftingPlan = payload;
    persistLiftingPlanLocal();
    try {
      const protocolsRef = getLiftingProtocolsRef();
      if (protocolsRef) {
        await protocolsRef.doc(safeId).set(payload, { merge: true });
      }
      const existingIndex = state.liftingPlans.findIndex((item) => item.id === safeId);
      if (existingIndex >= 0) {
        state.liftingPlans[existingIndex] = normalizeLiftingPlan(payload);
      } else {
        state.liftingPlans.unshift(normalizeLiftingPlan(payload));
      }
      state.liftingPlans.sort((left, right) => Number(new Date(right.updatedAt || 0)) - Number(new Date(left.updatedAt || 0)));
      renderLiftingSavedList();
      renderLiftingOverview();
      setLiftingStatus(`Saved protocol: ${payload.name}`);
      triggerToast("Lifting protocol saved.");
      setLiftingTab("program");
      focusPlannerWindow(root, { smooth: true });
    } catch (err) {
      console.warn("Failed to save lifting protocol", err);
      setLiftingStatus("Could not save protocol right now.", true);
    } finally {
      state.liftingBusy = false;
      if (els.liftingSaveProtocolBtn) els.liftingSaveProtocolBtn.disabled = false;
    }
  }

  async function deleteLiftingPlan(planId) {
    const safeId = String(planId || "").trim();
    if (!safeId) return;
    try {
      const protocolsRef = getLiftingProtocolsRef();
      if (protocolsRef) {
        await protocolsRef.doc(safeId).delete();
      }
      state.liftingPlans = state.liftingPlans.filter((entry) => entry.id !== safeId);
      if (state.liftingPlan.id === safeId) {
        state.liftingPlan = normalizeLiftingPlan(buildDefaultLiftingPlan());
        state.liftingActiveDay = 0;
        persistLiftingPlanLocal();
      }
      renderLiftingLab();
      setLiftingStatus("Protocol deleted.");
    } catch (err) {
      console.warn("Failed to delete lifting protocol", err);
      setLiftingStatus("Could not delete protocol right now.", true);
    }
  }

  async function syncLiftingLibraryToCloud() {
    const libraryDoc = getLiftingLibraryDocRef();
    if (!libraryDoc) return;
    await libraryDoc.set({
      data: state.liftingLibrary,
      updatedAt: getPlannerTimestamp()
    }, { merge: true });
  }

  function syncLiftingPlansFromSnapshot(snapshot) {
    state.liftingPlans = snapshot.docs
      .map((recordDoc) => normalizeLiftingPlan({ ...(recordDoc.data() || {}), id: recordDoc.id }))
      .filter((entry) => entry.id)
      .sort((left, right) => Number(new Date(right.updatedAt || 0)) - Number(new Date(left.updatedAt || 0)));
    renderLiftingSavedList();
    renderLiftingOverview();
  }

  function setupLiftingRealtimeSync() {
    if (state.liftingPlansUnsub) {
      try { state.liftingPlansUnsub(); } catch {}
      state.liftingPlansUnsub = null;
    }
    if (state.liftingLibraryUnsub) {
      try { state.liftingLibraryUnsub(); } catch {}
      state.liftingLibraryUnsub = null;
    }

    const protocolsRef = getLiftingProtocolsRef();
    if (protocolsRef?.onSnapshot) {
      state.liftingPlansUnsub = protocolsRef.onSnapshot((snapshot) => {
        syncLiftingPlansFromSnapshot(snapshot);
      }, (err) => {
        console.warn("Lifting protocol snapshot failed", err);
      });
    }

    const libraryDoc = getLiftingLibraryDocRef();
    if (libraryDoc?.onSnapshot) {
      state.liftingLibraryUnsub = libraryDoc.onSnapshot((docSnap) => {
        if (docSnap.exists()) {
          state.liftingLibrary = normalizeLiftingLibraryMap(docSnap.data()?.data || DEFAULT_LIFTING_LIBRARY);
          persistLiftingLibraryLocal();
          renderLiftingCategorySelect();
          renderLiftingLibraryGroups();
          renderLiftingOverview();
          return;
        }
        syncLiftingLibraryToCloud().catch(() => {});
      }, (err) => {
        console.warn("Lifting library snapshot failed", err);
      });
    }
  }

  function updateLogos() {
    const hasLogo = Boolean(state.settings.logoUrl);
    if (els.logoPreview && els.logoPlaceholder) {
      if (hasLogo) {
        els.logoPreview.src = state.settings.logoUrl;
        els.logoPreview.classList.remove("hidden");
        els.logoPlaceholder.classList.add("hidden");
      } else {
        els.logoPreview.removeAttribute("src");
        els.logoPreview.classList.add("hidden");
        els.logoPlaceholder.classList.remove("hidden");
      }
    }
  }

  function getPlannerAuthUser() {
    if (typeof getAuthUser === "function") {
      try {
        return getAuthUser();
      } catch {
        return null;
      }
    }
    return null;
  }

  function getPlannerProfile() {
    if (typeof getProfile === "function") {
      try {
        return getProfile();
      } catch {
        return null;
      }
    }
    return null;
  }

  function getPlannerWorkspaceCollectionRef(name) {
    if (!name) return null;
    if (typeof getCoachWorkspaceCollectionRef === "function") {
      try {
        const ref = getCoachWorkspaceCollectionRef(name, getPlannerAuthUser()?.id);
        if (ref) return ref;
      } catch {
        // fallback below
      }
    }
    try {
      const uid = String(getPlannerAuthUser()?.id || "").trim();
      if (!uid || typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
      const root = typeof FIREBASE_COACH_WORKSPACES_COLLECTION === "string" && FIREBASE_COACH_WORKSPACES_COLLECTION
        ? FIREBASE_COACH_WORKSPACES_COLLECTION
        : "coach_workspaces";
      return firebaseFirestoreInstance.collection(root).doc(uid).collection(name);
    } catch {
      return null;
    }
  }

  function getPlannerTimestamp() {
    try {
      if (typeof getFirestoreServerTimestamp === "function") {
        return getFirestoreServerTimestamp();
      }
    } catch {
      // fallback below
    }
    try {
      if (typeof firebase !== "undefined" && firebase?.firestore?.FieldValue?.serverTimestamp) {
        return firebase.firestore.FieldValue.serverTimestamp();
      }
    } catch {
      // fallback below
    }
    return new Date().toISOString();
  }

  function getTodayDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizeDateKeyValue(value) {
    const raw = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return getTodayDateKey();
    return date.toISOString().slice(0, 10);
  }

  function formatDateLabel(value) {
    const safe = normalizeDateKeyValue(value);
    const date = new Date(`${safe}T00:00:00`);
    if (Number.isNaN(date.getTime())) return safe;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function toSimpleSlug(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return `item-${Date.now()}`;
    return raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
  }

  function setBottomStatus(message, isError = false) {
    if (!els.bottomStatus) return;
    els.bottomStatus.textContent = String(message || "");
    els.bottomStatus.classList.toggle("planner-status-error", Boolean(isError));
  }

  function getBottomStatusDefaultMessage() {
    if (state.activeTemplateName) {
      return `Editing template: ${state.activeTemplateName}`;
    }
    return "Save as template or share this plan with athletes and coaches.";
  }

  function setAssignStatus(message, isError = false) {
    if (!els.assignStatus) return;
    els.assignStatus.textContent = String(message || "");
    els.assignStatus.classList.toggle("planner-status-error", Boolean(isError));
  }

  function getScheduleItemsByCategory(categoryId) {
    return (state.schedule[normalizeCategoryId(categoryId)] || [])
      .map((entry) => String(entry?.name || "").trim())
      .filter(Boolean);
  }

  function buildPlanItemsFromPlanner() {
    const intro = [
      ...getScheduleItemsByCategory("roll_call")
    ];
    const warmup = [
      ...getScheduleItemsByCategory("warm_up")
    ];
    const drills = [
      ...getScheduleItemsByCategory("techniques"),
      ...getScheduleItemsByCategory("strength")
    ];
    const live = [
      ...getScheduleItemsByCategory("live_wrestling")
    ];
    const cooldown = [
      ...getScheduleItemsByCategory("cool_down")
    ];
    const announcements = [
      ...getScheduleItemsByCategory("announcements")
    ];
    return { intro, warmup, drills, live, cooldown, announcements };
  }

  function serializePlannerSchedule() {
    const next = {};
    CATEGORIES.forEach((category) => {
      next[category.id] = (state.schedule[category.id] || [])
        .map((entry) => String(entry?.name || "").trim())
        .filter(Boolean);
    });
    return next;
  }

  function normalizeTemplateScheduleValue(value) {
    const next = {};
    CATEGORIES.forEach((category) => {
      const list = Array.isArray(value?.[category.id]) ? value[category.id] : [];
      next[category.id] = list
        .map((item) => {
          if (typeof item === "string") return item.trim();
          return String(item?.name || "").trim();
        })
        .filter(Boolean)
        .map((name) => ({ id: makeId(), name }));
    });
    return next;
  }

  function mapTemplateItemsToSchedule(items = {}) {
    const categoryLists = {
      roll_call: Array.isArray(items.intro) ? items.intro : [],
      warm_up: Array.isArray(items.warmup) ? items.warmup : [],
      techniques: Array.isArray(items.drills) ? items.drills : [],
      live_wrestling: Array.isArray(items.live) ? items.live : [],
      strength: [],
      cool_down: Array.isArray(items.cooldown) ? items.cooldown : [],
      announcements: Array.isArray(items.announcements) ? items.announcements : []
    };
    return normalizeTemplateScheduleValue(categoryLists);
  }

  function normalizeTemplateTimesValue(value) {
    const base = { ...INITIAL_TIMES };
    if (!value || typeof value !== "object") return base;
    CATEGORIES.forEach((category) => {
      const raw = String(value?.[category.id] ?? "").trim();
      if (raw) base[category.id] = raw;
    });
    return base;
  }

  function normalizeTemplateCategoryNamesValue(value) {
    const base = getDefaultCategoryNames();
    if (!value || typeof value !== "object") return base;
    CATEGORIES.forEach((category) => {
      const label = String(value?.[category.id] || "").trim();
      if (label) base[category.id] = label;
    });
    return base;
  }

  function normalizeTemplateItemsValue(value) {
    const normalized = {
      intro: [],
      warmup: [],
      drills: [],
      live: [],
      cooldown: [],
      announcements: []
    };
    Object.keys(normalized).forEach((key) => {
      normalized[key] = Array.isArray(value?.[key]) ? value[key].map((item) => String(item || "").trim()).filter(Boolean) : [];
    });
    return normalized;
  }

  function normalizeTemplateDateValue(value) {
    if (!value) return "";
    if (typeof value?.toDate === "function") {
      try {
        return value.toDate().toISOString();
      } catch {
        return "";
      }
    }
    const raw = String(value || "").trim();
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString();
  }

  function normalizePlannerTemplateRecord(id, data = {}) {
    const name = String(data?.name || "").trim();
    if (!name) return null;
    const items = normalizeTemplateItemsValue(data?.items || {});
    const schedule = data?.plannerSchedule && typeof data.plannerSchedule === "object"
      ? normalizeTemplateScheduleValue(data.plannerSchedule)
      : mapTemplateItemsToSchedule(items);
    return {
      id: String(id || "").trim(),
      name,
      type: String(data?.type || "day").trim(),
      items,
      schedule,
      categoryTimes: normalizeTemplateTimesValue(data?.plannerCategoryTimes || {}),
      categoryNames: normalizeTemplateCategoryNamesValue(data?.plannerCategoryNames || {}),
      totalTime: String(data?.plannerTotalTime || "").trim(),
      savedDate: String(data?.plannerDate || "").trim(),
      updatedAt: normalizeTemplateDateValue(data?.updatedAt),
      createdAt: normalizeTemplateDateValue(data?.createdAt)
    };
  }

  function formatTemplateUpdatedLabel(record) {
    const raw = record?.updatedAt || record?.createdAt || "";
    if (!raw) return "No date";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "No date";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function setTemplatesStatus(message, isError = false) {
    if (!els.templatesStatus) return;
    els.templatesStatus.textContent = String(message || "");
    els.templatesStatus.classList.toggle("planner-status-error", Boolean(isError));
  }

  function renderTemplateList() {
    if (!els.templatesList) return;
    if (!state.templateRecords.length) {
      els.templatesList.innerHTML = `<p class="small muted">No templates found yet.</p>`;
      return;
    }
    const html = state.templateRecords.map((template) => {
      const isActive = template.id && template.id === state.activeTemplateId;
      return `
        <article class="planner-template-card${isActive ? " active" : ""}">
          <div>
            <strong>${escapeHtml(template.name)}</strong>
            <p class="small muted">Updated: ${escapeHtml(formatTemplateUpdatedLabel(template))}</p>
          </div>
          <button
            type="button"
            class="primary"
            data-action="load-template-record"
            data-template-id="${escapeHtml(template.id)}"
          >Load</button>
        </article>
      `;
    }).join("");
    els.templatesList.innerHTML = html;
  }

  async function loadPlannerTemplates() {
    const templatesRef = getPlannerWorkspaceCollectionRef("templates");
    if (!templatesRef) {
      state.templateRecords = [];
      renderTemplateList();
      setTemplatesStatus("Template storage is not available.", true);
      return;
    }
    try {
      setTemplatesStatus("Loading templates...");
      const snap = await templatesRef.get();
      state.templateRecords = snap.docs
        .map((doc) => normalizePlannerTemplateRecord(doc.id, doc.data() || {}))
        .filter(Boolean)
        .sort((left, right) => {
          const leftDate = Number(new Date(left.updatedAt || left.createdAt || 0));
          const rightDate = Number(new Date(right.updatedAt || right.createdAt || 0));
          return rightDate - leftDate;
        });
      renderTemplateList();
      setTemplatesStatus(state.templateRecords.length ? `${state.templateRecords.length} templates loaded.` : "No templates found.");
    } catch (err) {
      console.warn("Failed to load planner templates", err);
      state.templateRecords = [];
      renderTemplateList();
      setTemplatesStatus("Could not load templates right now.", true);
    }
  }

  function openTemplatesModal() {
    els.templatesModal?.classList.remove("hidden");
    focusPlannerWindow(els.templatesModal, { smooth: true });
    loadPlannerTemplates().catch(() => {});
  }

  function closeTemplatesModal() {
    els.templatesModal?.classList.add("hidden");
  }

  function applyTemplateToPlanner(templateId) {
    const targetId = String(templateId || "").trim();
    const template = state.templateRecords.find((record) => record.id === targetId);
    if (!template) {
      setTemplatesStatus("Template not found.", true);
      return;
    }
    state.activeTemplateId = template.id;
    state.activeTemplateName = template.name;
    state.schedule = normalizeTemplateScheduleValue(template.schedule || {});
    state.categoryTimes = normalizeTemplateTimesValue(template.categoryTimes || {});
    state.categoryNames = normalizeTemplateCategoryNamesValue(template.categoryNames || {});
    if (template.totalTime) {
      state.docInfo.totalTime = String(template.totalTime).trim();
    }
    persistDaily();
    persistCategoryNames();
    render();
    closeTemplatesModal();
    triggerToast(`Template loaded: ${template.name}`);
    setBottomStatus(`Loaded template: ${template.name}`);
  }

  function getPlannerTitle() {
    const dateKey = normalizeDateKeyValue(state.docInfo.date || getTodayDateKey());
    return `Daily Training Plan - ${formatDateLabel(dateKey)}`;
  }

  function normalizeRecipientRecord(id, data = {}, fallbackType = "athlete") {
    const name = String(data?.name || "").trim();
    if (!name) return null;
    const role = String(data?.role || fallbackType).trim().toLowerCase();
    const recipientType = isCoachLikeRole(role) ? "coach" : "athlete";
    const recipientUid = String(data?.athleteUid || data?.uid || "").trim();
    const recipientEmail = String(data?.athleteEmail || data?.email || "").trim();
    return {
      id: String(id || toSimpleSlug(name)).trim() || toSimpleSlug(name),
      name,
      recipientType,
      role,
      recipientUid,
      recipientEmail
    };
  }

  function renderAssignAthleteList() {
    if (!els.assignList) return;
    const filter = String(state.assignSearch || "").trim().toLowerCase();
    const filtered = state.assignAthletes.filter((athlete) => {
      if (!filter) return true;
      return athlete.name.toLowerCase().includes(filter)
        || athlete.id.toLowerCase().includes(filter)
        || athlete.recipientEmail.toLowerCase().includes(filter);
    });
    if (!filtered.length) {
      els.assignList.innerHTML = `<p class="small muted">No recipients found.</p>`;
      return;
    }
    const html = filtered.map((athlete) => {
      const isSelected = state.selectedAthleteIds.includes(athlete.id);
      const roleLabel = athlete.recipientType === "coach" ? "Coach" : "Athlete";
      return `
        <button
          type="button"
          class="planner-assign-athlete${isSelected ? " active" : ""}"
          data-action="toggle-assign-athlete"
          data-athlete-id="${escapeHtml(athlete.id)}"
        >
          <strong>${escapeHtml(athlete.name)} <small>(${roleLabel})</small></strong>
          <span>${escapeHtml(athlete.recipientEmail || athlete.id)}</span>
        </button>
      `;
    }).join("");
    els.assignList.innerHTML = html;
  }

  async function loadPlannerAthletesForAssignment() {
    const athletesRef = getPlannerWorkspaceCollectionRef("athletes");
    if (!athletesRef) {
      state.assignAthletes = [];
      state.selectedAthleteIds = [];
      renderAssignAthleteList();
      setAssignStatus("Planner recipients are not available right now.", true);
      return;
    }

    try {
      setAssignStatus("Loading recipients...");
      const snap = await athletesRef.get();
      let athleteRecords = snap.docs
        .map((doc) => normalizeRecipientRecord(doc.id, doc.data() || {}, "athlete"))
        .filter(Boolean)
        .filter((record) => record.recipientType === "athlete")
        .sort((left, right) => left.name.localeCompare(right.name));

      const usersRef = getPlannerUsersCollectionRef();
      let coachRecords = [];
      if (usersRef) {
        const usersSnap = await usersRef.get();
        const seenCoachUid = new Set();
        usersSnap.docs.forEach((doc) => {
          const record = normalizeRecipientRecord(doc.id, doc.data() || {}, "athlete");
          if (!record || record.recipientType !== "coach") return;
          const uidKey = String(record.recipientUid || record.id).trim();
          if (!uidKey || seenCoachUid.has(uidKey)) return;
          seenCoachUid.add(uidKey);
          coachRecords.push(record);
        });

        if (!athleteRecords.length) {
          athleteRecords = usersSnap.docs
            .map((doc) => normalizeRecipientRecord(doc.id, doc.data() || {}, "athlete"))
            .filter(Boolean)
            .filter((record) => record.recipientType === "athlete")
            .sort((left, right) => left.name.localeCompare(right.name));
        }
      }

      const records = [...athleteRecords, ...coachRecords]
        .reduce((acc, record) => {
          if (!acc.some((entry) => entry.id === record.id)) acc.push(record);
          return acc;
        }, [])
        .sort((left, right) => {
          if (left.recipientType !== right.recipientType) {
            return left.recipientType === "athlete" ? -1 : 1;
          }
          return left.name.localeCompare(right.name);
        });

      state.assignAthletes = records;
      state.selectedAthleteIds = state.selectedAthleteIds.filter((athleteId) => records.some((item) => item.id === athleteId));
      renderAssignAthleteList();
      if (!records.length) {
        setAssignStatus("No recipients available yet. Register users first.");
      } else {
        const athletesCount = records.filter((record) => record.recipientType === "athlete").length;
        const coachesCount = records.filter((record) => record.recipientType === "coach").length;
        setAssignStatus(`${athletesCount} athletes + ${coachesCount} coaches available.`);
      }
    } catch (err) {
      console.warn("Failed to load recipients for planner assignment", err);
      state.assignAthletes = [];
      state.selectedAthleteIds = [];
      renderAssignAthleteList();
      setAssignStatus("Could not load recipients. Try again.", true);
    }
  }

  function openAssignModal() {
    const nextDue = normalizeDateKeyValue(state.docInfo.date || getTodayDateKey());
    state.assignDueDate = nextDue;
    state.assignSearch = "";
    if (els.assignDueDateInput) els.assignDueDateInput.value = nextDue;
    if (els.assignSearchInput) els.assignSearchInput.value = "";
    els.assignModal?.classList.remove("hidden");
    focusPlannerWindow(els.assignModal, { smooth: true });
    setAssignStatus("Choose recipients, then share.");
    loadPlannerAthletesForAssignment().catch(() => {});
  }

  function closeAssignModal() {
    els.assignModal?.classList.add("hidden");
  }

  async function savePlannerAsTemplate() {
    if (state.templateSaveBusy || state.assignModalBusy) return;
    const templatesRef = getPlannerWorkspaceCollectionRef("templates");
    if (!templatesRef) {
      setBottomStatus("Template storage is not available.", true);
      return;
    }

    let saveAsNew = true;
    let targetId = "";
    let defaultName = `Template - ${formatDateLabel(state.docInfo.date || getTodayDateKey())}`;

    if (state.activeTemplateId) {
      const useCurrent = window.confirm(`Save changes to current template "${state.activeTemplateName}"?\nPress Cancel to save as a new template.`);
      if (useCurrent) {
        saveAsNew = false;
        targetId = state.activeTemplateId;
        defaultName = state.activeTemplateName || defaultName;
      } else if (state.activeTemplateName) {
        defaultName = `${state.activeTemplateName} copy`;
      }
    }

    const namePrompt = saveAsNew ? "Template name (new)" : "Template name";
    const nextName = window.prompt(namePrompt, defaultName);
    if (nextName == null) return;
    const cleanName = String(nextName || "").trim();
    if (!cleanName) {
      setBottomStatus("Template name is required.", true);
      return;
    }

    state.templateSaveBusy = true;
    const timestamp = getPlannerTimestamp();
    const payload = {
      name: cleanName,
      type: "day",
      focus: `${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min practice flow`,
      coachNotes: "Saved from Coach Planner.",
      items: buildPlanItemsFromPlanner(),
      plannerSchedule: serializePlannerSchedule(),
      plannerCategoryTimes: { ...state.categoryTimes },
      plannerCategoryNames: { ...state.categoryNames },
      plannerTotalTime: String(state.docInfo.totalTime || "90"),
      plannerDate: String(state.docInfo.date || ""),
      monthlyNotes: "",
      seasonYear: String(state.settings?.season || "").trim(),
      system: false,
      updatedAt: timestamp
    };
    if (saveAsNew) {
      payload.createdAt = timestamp;
    }

    try {
      const ref = saveAsNew ? templatesRef.doc() : templatesRef.doc(targetId);
      await ref.set(payload, { merge: true });
      state.activeTemplateId = ref.id;
      state.activeTemplateName = cleanName;
      state.lastSavedTemplateId = ref.id;
      const message = saveAsNew
        ? `Template saved as new: ${cleanName}`
        : `Template updated: ${cleanName}`;
      setBottomStatus(message);
      triggerToast("Template saved.");
      if (!els.templatesModal?.classList.contains("hidden")) {
        loadPlannerTemplates().catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to save planner template", err);
      setBottomStatus("Could not save template.", true);
    } finally {
      state.templateSaveBusy = false;
    }
  }

  async function sendPlannerTrainingToAthletes() {
    if (state.assignModalBusy) return;
    const selected = state.assignAthletes.filter((athlete) => state.selectedAthleteIds.includes(athlete.id));
    if (!selected.length) {
      setAssignStatus("Select at least one recipient.", true);
      return;
    }

    const plansRef = getPlannerWorkspaceCollectionRef("plans");
    const assignmentsRef = getPlannerWorkspaceCollectionRef("assignments");
    if (!plansRef || !assignmentsRef || typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) {
      setAssignStatus("Plan/assignment storage is not available.", true);
      return;
    }

    state.assignModalBusy = true;
    if (els.assignSendBtn) {
      els.assignSendBtn.disabled = true;
      els.assignSendBtn.textContent = "Sharing...";
    }
    setAssignStatus("Saving plan and assignments...");

    const dueDateKey = normalizeDateKeyValue(state.assignDueDate || state.docInfo.date || getTodayDateKey());
    const timestamp = getPlannerTimestamp();
    const authUser = getPlannerAuthUser();
    const profile = getPlannerProfile();
    const createdBy = String(profile?.name || authUser?.email || "Coach").trim();
    const planTitle = getPlannerTitle();
    const athleteRecipients = selected.filter((athlete) => athlete.recipientType !== "coach");
    const coachRecipients = selected.filter((athlete) => athlete.recipientType === "coach");
    const athleteNames = athleteRecipients.map((athlete) => athlete.name);
    const athleteIds = athleteRecipients.map((athlete) => athlete.id);
    const athleteUids = athleteRecipients.map((athlete) => athlete.recipientUid).filter(Boolean);
    const coachNames = coachRecipients.map((coach) => coach.name);
    const coachIds = coachRecipients.map((coach) => coach.id);
    const coachUids = coachRecipients.map((coach) => coach.recipientUid).filter(Boolean);
    const audienceMode = selected.length > 1 ? "multi" : "single";
    const note = `Coach planner session (${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min total).`;

    try {
      const planRef = plansRef.doc();
      const planPayload = {
        title: planTitle,
        type: "day",
        focus: note,
        coachNotes: note,
        sourceMode: "scratch",
        sourceRefId: "",
        sourceLabel: "Coach Planner",
        range: {
          startKey: dueDateKey,
          endKey: dueDateKey
        },
        items: buildPlanItemsFromPlanner(),
        monthlyNotes: "",
        seasonYear: String(state.settings?.season || "").trim(),
        audience: {
          mode: audienceMode,
          recipientNames: selected.map((item) => item.name),
          recipientIds: selected.map((item) => item.id),
          recipientUids: selected.map((item) => item.recipientUid).filter(Boolean),
          athleteNames,
          athleteIds,
          athleteUids,
          coachNames,
          coachIds,
          coachUids,
          groupId: "",
          groupName: ""
        },
        createdBy,
        updatedBy: createdBy,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await planRef.set(planPayload, { merge: true });

      const dueLabel = formatDateLabel(dueDateKey);
      const batch = firebaseFirestoreInstance.batch();
      const createdAssignments = [];
      selected.forEach((athlete) => {
        const assignmentRef = assignmentsRef.doc();
        const isCoach = athlete.recipientType === "coach";
        const assignmentPayload = {
          title: planTitle,
          assigneeType: isCoach ? "coach" : "athlete",
          assigneeId: athlete.id,
          assigneeName: athlete.name,
          assigneeNames: [athlete.name],
          recipientType: isCoach ? "coach" : "athlete",
          recipientUid: athlete.recipientUid || "",
          athleteIds: isCoach ? [] : [athlete.id],
          athleteUids: isCoach ? [] : (athlete.recipientUid ? [athlete.recipientUid] : []),
          coachIds: isCoach ? [athlete.id] : [],
          coachUids: isCoach ? (athlete.recipientUid ? [athlete.recipientUid] : []) : [],
          type: "Daily Plan",
          dueDateKey,
          dueLabel,
          status: "not_started",
          note,
          source: "Coach Planner",
          planId: planRef.id,
          planType: "day",
          notificationStatus: "pending",
          createdAt: timestamp,
          updatedAt: timestamp
        };
        batch.set(assignmentRef, assignmentPayload);
        createdAssignments.push({
          id: assignmentRef.id,
          ...assignmentPayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      state.lastSentPlanId = planRef.id;

      if (typeof sendCoachAssignmentNotification === "function") {
        Promise.all(createdAssignments.map((assignment) => sendCoachAssignmentNotification(assignment))).catch((err) => {
          console.warn("Planner assignment notifications failed", err);
        });
      }

      const successMessage = `Plan shared with ${selected.length} recipient${selected.length === 1 ? "" : "s"}.`;
      setAssignStatus(successMessage);
      setBottomStatus(successMessage);
      triggerToast(successMessage);
      closeAssignModal();
    } catch (err) {
      console.warn("Failed to share planner assignments", err);
      setAssignStatus("Could not share plan. Try again.", true);
    } finally {
      state.assignModalBusy = false;
      if (els.assignSendBtn) {
        els.assignSendBtn.disabled = false;
        els.assignSendBtn.textContent = "Share plan";
      }
    }
  }

  function getPlannerUsersCollectionRef() {
    try {
      if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
      const collectionName = typeof FIREBASE_USERS_COLLECTION === "string" && FIREBASE_USERS_COLLECTION
        ? FIREBASE_USERS_COLLECTION
        : "users";
      return firebaseFirestoreInstance.collection(collectionName);
    } catch {
      return null;
    }
  }

  function queuePlannerSettingsSync() {
    if (state.settingsSyncTimer) {
      clearTimeout(state.settingsSyncTimer);
      state.settingsSyncTimer = null;
    }
    state.settingsSyncTimer = window.setTimeout(() => {
      syncPlannerSettingsNow().catch(() => {});
    }, 650);
  }

  async function syncPlannerSettingsNow() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    if (!usersRef || !uid) return;
    const settingsPayload = normalizePlannerSettings(state.settings, { migrateLegacy: true });
    try {
      await usersRef.doc(uid).set({
        plannerTemplateSettings: settingsPayload,
        plannerTemplateSettingsUpdatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Planner settings sync failed", err);
    }
  }

  async function hydratePlannerSettingsFromCloud() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    if (!usersRef || !uid) {
      persistSettings();
      return;
    }
    try {
      const doc = await usersRef.doc(uid).get();
      const raw = doc.exists ? (doc.data() || {}) : {};
      const remoteSettings = normalizePlannerSettings(raw?.plannerTemplateSettings || {}, { migrateLegacy: true });
      const localSettings = normalizePlannerSettings(state.settings, { migrateLegacy: true });
      const remoteSerialized = JSON.stringify(remoteSettings);
      const localSerialized = JSON.stringify(localSettings);
      if (remoteSerialized !== localSerialized) {
        if (raw?.plannerTemplateSettings && typeof raw.plannerTemplateSettings === "object" && Object.keys(raw.plannerTemplateSettings).length) {
          mergePlannerSettings(remoteSettings, { sync: false });
          render();
        } else {
          mergePlannerSettings(localSettings, { sync: true });
        }
      } else {
        persistSettings();
      }
    } catch (err) {
      console.warn("Planner settings cloud hydrate failed", err);
      persistSettings();
    }
  }

  function isCoachLikeRole(value) {
    const role = String(value || "").trim().toLowerCase();
    return role === "coach" || role === "admin" || role === "administrator" || role === "head_coach";
  }

  function setCoachLibrariesStatus(message = "") {
    state.coachLibrariesStatus = String(message || "");
    if (els.coachLibrariesStatus) {
      els.coachLibrariesStatus.textContent = state.coachLibrariesStatus;
    }
  }

  function normalizeCoachLibraryFromUserDoc(uid, data = {}) {
    const role = String(data?.role || "").trim().toLowerCase();
    if (!isCoachLikeRole(role)) return null;
    const entries = normalizeLibraryEntries(data?.plannerLibrary || data?.coachPlannerLibrary || []);
    const incomingCategoryNames = data?.plannerCategoryNames && typeof data.plannerCategoryNames === "object"
      ? data.plannerCategoryNames
      : {};
    const categoryNames = CATEGORIES.reduce((acc, category) => {
      const candidate = String(incomingCategoryNames?.[category.id] || "").trim();
      if (candidate) acc[category.id] = candidate;
      return acc;
    }, {});
    return {
      uid: String(uid || "").trim(),
      name: String(data?.name || "").trim() || String(data?.email || "").trim() || "Coach",
      email: String(data?.email || "").trim(),
      entries,
      categoryNames,
      updatedAt: String(data?.plannerLibraryUpdatedAt || data?.updatedAt || "").trim()
    };
  }

  function renderCoachLibraries() {
    if (!els.coachLibraries) return;
    if (!state.coachLibraries.length) {
      els.coachLibraries.innerHTML = `<p class=\"small muted\">No coach libraries available yet.</p>`;
      return;
    }
    const cardsHtml = state.coachLibraries.map((coach) => {
      const grouped = CATEGORIES.map((category) => {
        const entries = coach.entries.filter((entry) => normalizeCategoryId(entry.categoryId) === category.id);
        if (!entries.length) return "";
        const label = String(coach.categoryNames?.[category.id] || getCategoryNameById(category.id)).trim() || getCategoryNameById(category.id);
        const items = entries.map((entry) => (
          `<li>
            <span>${escapeHtml(entry.name)}</span>
            <button type=\"button\" class=\"ghost\" data-action=\"import-coach-item\" data-coach-uid=\"${escapeHtml(coach.uid)}\" data-item-id=\"${escapeHtml(entry.id)}\" title=\"Add to current library\">+</button>
          </li>`
        )).join("");
        return `
          <div class=\"planner-coach-category\">
            <strong>${escapeHtml(label)}</strong>
            <ul>${items}</ul>
          </div>
        `;
      }).join("");
      return `
        <article class=\"planner-coach-card\">
          <header>
            <strong>${escapeHtml(coach.name)}</strong>
            <span>${escapeHtml(coach.email || "coach")}</span>
          </header>
          ${grouped || `<p class=\"small muted\">No exercises shared yet.</p>`}
        </article>
      `;
    }).join("");
    els.coachLibraries.innerHTML = cardsHtml;
  }

  function importCoachLibraryEntry(coachUid, itemId) {
    const coach = state.coachLibraries.find((entry) => entry.uid === String(coachUid || "").trim());
    if (!coach) return;
    const item = coach.entries.find((entry) => entry.id === String(itemId || "").trim());
    if (!item) return;
    if (isDuplicateLibraryEntry(item.name, item.categoryId)) {
      triggerToast("Exercise already exists in this category.");
      return;
    }
    state.exerciseLibrary = [
      ...state.exerciseLibrary,
      {
        id: makeId(),
        name: String(item.name || "").trim(),
        categoryId: normalizeCategoryId(item.categoryId)
      }
    ];
    persistLibrary();
    queuePlannerLibrarySync();
    renderRows();
    renderLibraryGroups();
    triggerToast(`Added from ${coach.name}`);
  }

  async function syncPlannerLibraryNow() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    if (!usersRef || !uid) return;
    try {
      await usersRef.doc(uid).set({
        plannerLibrary: normalizeLibraryEntries(state.exerciseLibrary),
        plannerCategoryNames: { ...state.categoryNames },
        plannerLibraryUpdatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Planner library sync failed", err);
    }
  }

  function queuePlannerLibrarySync() {
    if (state.librarySyncTimer) {
      clearTimeout(state.librarySyncTimer);
      state.librarySyncTimer = null;
    }
    state.librarySyncTimer = window.setTimeout(() => {
      syncPlannerLibraryNow().catch(() => {});
    }, 650);
  }

  function subscribeCoachLibraries() {
    const usersRef = getPlannerUsersCollectionRef();
    if (!usersRef) {
      setCoachLibrariesStatus("Coach libraries available after Firebase connects.");
      renderCoachLibraries();
      return;
    }
    if (state.coachLibrariesUnsub) return;
    setCoachLibrariesStatus("Syncing coach libraries...");
    state.coachLibrariesUnsub = usersRef.onSnapshot((snapshot) => {
      const rows = snapshot.docs
        .map((doc) => normalizeCoachLibraryFromUserDoc(doc.id, doc.data() || {}))
        .filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name));
      state.coachLibraries = rows;
      state.coachLibrariesReady = true;
      setCoachLibrariesStatus(rows.length ? `${rows.length} coach libraries loaded.` : "No coach libraries yet.");
      renderCoachLibraries();
    }, (err) => {
      console.warn("Failed to load coach libraries", err);
      setCoachLibrariesStatus("Could not load coach libraries right now.");
      renderCoachLibraries();
    });
  }

  function ensureCoachLibrariesSync() {
    subscribeCoachLibraries();
  }

  function openSettingsModal() {
    state.tempSettings = { ...state.settings };
    if (els.settingsClubInput) els.settingsClubInput.value = state.tempSettings.clubName || "";
    if (els.settingsCoachInput) els.settingsCoachInput.value = state.tempSettings.coach || "";
    if (els.settingsSeasonInput) els.settingsSeasonInput.value = state.tempSettings.season || "";
    renderSettingsLogoPreview();
    els.settingsModal?.classList.remove("hidden");
    focusPlannerWindow(els.settingsModal, { smooth: true });
  }

  function closeSettingsModal() {
    els.settingsModal?.classList.add("hidden");
  }

  function renderSettingsLogoPreview() {
    if (!els.settingsLogoPreview || !els.settingsLogoPlaceholder) return;
    const logo = state.tempSettings?.logoUrl || "";
    if (logo) {
      els.settingsLogoPreview.src = logo;
      els.settingsLogoPreview.classList.remove("hidden");
      els.settingsLogoPlaceholder.classList.add("hidden");
    } else {
      els.settingsLogoPreview.removeAttribute("src");
      els.settingsLogoPreview.classList.add("hidden");
      els.settingsLogoPlaceholder.classList.remove("hidden");
    }
  }

  function saveSettings() {
    if (!state.tempSettings) return;
    mergePlannerSettings(state.tempSettings, { sync: true });
    closeSettingsModal();
    triggerToast("Template settings saved!");
  }

  function openLibraryModal() {
    els.libraryModal?.classList.remove("hidden");
    focusPlannerWindow(els.libraryModal, { smooth: true });
    renderLibraryGroups();
    renderCoachLibraries();
    ensureCoachLibrariesSync();
    queuePlannerLibrarySync();
    els.newExerciseNameInput?.focus();
  }

  function closeLibraryModal() {
    els.libraryModal?.classList.add("hidden");
  }

  function addToSchedule(categoryId, exerciseName) {
    const cleanName = String(exerciseName || "");
    const nextItem = { id: makeId(), name: cleanName };
    state.schedule[categoryId] = [...(state.schedule[categoryId] || []), nextItem];
    state.pendingFocus = cleanName.trim() ? null : { categoryId, itemId: nextItem.id };
    persistDaily();
    renderRows();
  }

  function removeFromSchedule(categoryId, itemId) {
    state.schedule[categoryId] = (state.schedule[categoryId] || []).filter((item) => item.id !== itemId);
    persistDaily();
    renderRows();
  }

  function updateScheduleItem(categoryId, itemId, nextName) {
    state.schedule[categoryId] = (state.schedule[categoryId] || []).map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, name: nextName };
    });
    persistDaily();
  }

  function ensureItemInLibrary(categoryId, itemName) {
    const cleanName = String(itemName || "").trim();
    if (!cleanName) return;
    if (isDuplicateLibraryEntry(cleanName, categoryId)) return;
    state.exerciseLibrary = [...state.exerciseLibrary, { id: makeId(), name: cleanName, categoryId: normalizeCategoryId(categoryId) }];
    persistLibrary();
    queuePlannerLibrarySync();
  }

  function saveExerciseToLibrary() {
    const name = String(els.newExerciseNameInput?.value || "").trim();
    const categoryId = normalizeCategoryId(els.newExerciseCategorySelect?.value || CATEGORIES[0].id);
    if (!name) {
      triggerToast("Write an exercise name first.");
      els.newExerciseNameInput?.focus();
      return;
    }
    if (isDuplicateLibraryEntry(name, categoryId)) {
      triggerToast("Exercise already exists in this category.");
      return;
    }
    state.exerciseLibrary = [...state.exerciseLibrary, { id: makeId(), name, categoryId }];
    persistLibrary();
    queuePlannerLibrarySync();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
    if (els.newExerciseNameInput) els.newExerciseNameInput.value = "";
    els.newExerciseNameInput?.focus();
    triggerToast("Exercise saved to library!");
  }

  function deleteExerciseFromLibrary(id) {
    state.exerciseLibrary = state.exerciseLibrary.filter((entry) => entry.id !== id);
    persistLibrary();
    queuePlannerLibrarySync();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
  }

  function updateCategoryName(categoryId, name) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const cleanName = String(name || "").trim();
    state.categoryNames[safeCategoryId] = cleanName || CATEGORIES.find((category) => category.id === safeCategoryId)?.name || safeCategoryId;
    persistCategoryNames();
    queuePlannerLibrarySync();
    renderCategorySelectOptions();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
  }

  function updateLibraryDraft(categoryId, value) {
    state.categoryDrafts[normalizeCategoryId(categoryId)] = String(value || "");
  }

  function addDraftExerciseToLibrary(categoryId) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const draftName = String(state.categoryDrafts[safeCategoryId] || "").trim();
    if (!draftName) {
      triggerToast("Write an exercise name first.");
      return;
    }
    if (isDuplicateLibraryEntry(draftName, safeCategoryId)) {
      triggerToast("Exercise already exists in this category.");
      return;
    }
    state.exerciseLibrary = [
      ...state.exerciseLibrary,
      { id: makeId(), name: draftName, categoryId: safeCategoryId }
    ];
    state.categoryDrafts[safeCategoryId] = "";
    persistLibrary();
    queuePlannerLibrarySync();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
    triggerToast("Exercise added.");
  }

  function getNextDefaultLibraryName(categoryId) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const baseName = "New exercise";
    const normalized = state.exerciseLibrary
      .filter((entry) => normalizeCategoryId(entry.categoryId) === safeCategoryId)
      .map((entry) => String(entry.name || "").trim().toLowerCase());
    if (!normalized.includes(baseName.toLowerCase())) return baseName;
    let index = 2;
    while (normalized.includes(`${baseName.toLowerCase()} ${index}`)) {
      index += 1;
    }
    return `${baseName} ${index}`;
  }

  function quickAddLibraryItem(categoryId) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const itemId = makeId();
    const name = getNextDefaultLibraryName(safeCategoryId);
    state.exerciseLibrary = [
      ...state.exerciseLibrary,
      { id: itemId, name, categoryId: safeCategoryId }
    ];
    state.pendingLibraryFocus = itemId;
    persistLibrary();
    queuePlannerLibrarySync();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
    triggerToast("Exercise added. Edit the name.");
  }

  function updateLibraryItemName(itemId, categoryId, nextName) {
    const safeItemId = String(itemId || "").trim();
    const safeCategoryId = normalizeCategoryId(categoryId);
    const cleanName = String(nextName || "").trim();
    if (!safeItemId) return;
    if (cleanName) {
      const duplicate = state.exerciseLibrary.some((entry) => {
        if (entry.id === safeItemId) return false;
        return normalizeCategoryId(entry.categoryId) === safeCategoryId
          && String(entry.name || "").trim().toLowerCase() === cleanName.toLowerCase();
      });
      if (duplicate) {
        triggerToast("Exercise already exists in this category.");
        renderLibraryGroups();
        return;
      }
    }
    state.exerciseLibrary = state.exerciseLibrary.map((entry) => {
      if (entry.id !== safeItemId) return entry;
      return {
        ...entry,
        categoryId: safeCategoryId,
        name: cleanName || entry.name
      };
    });
    persistLibrary();
    queuePlannerLibrarySync();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
  }

  function setLibraryItemDraft(itemId, categoryId, nextName) {
    const safeItemId = String(itemId || "").trim();
    if (!safeItemId) return;
    state.exerciseLibrary = state.exerciseLibrary.map((entry) => {
      if (entry.id !== safeItemId) return entry;
      return {
        ...entry,
        categoryId: normalizeCategoryId(categoryId),
        name: String(nextName || "")
      };
    });
  }

  function addLibraryItemToPlan(itemId, categoryId) {
    const safeItemId = String(itemId || "").trim();
    const safeCategoryId = normalizeCategoryId(categoryId);
    const item = state.exerciseLibrary.find((entry) => entry.id === safeItemId);
    if (!item) return;
    addToSchedule(safeCategoryId, item.name);
    triggerToast("Added to current plan.");
  }

  function renderCategorySelectOptions() {
    if (!els.newExerciseCategorySelect) return;
    els.newExerciseCategorySelect.innerHTML = CATEGORIES
      .map((category) => `<option value="${category.id}">${escapeHtml(getCategoryNameById(category.id))}</option>`)
      .join("");
  }

  function renderLibraryGroups() {
    if (!els.libraryGroups) return;
    const groupsHtml = CATEGORIES.map((category) => {
      const items = state.exerciseLibrary.filter((entry) => entry.categoryId === category.id);
      const draft = String(state.categoryDrafts[category.id] || "");
      const itemsHtml = items.length
        ? `<ul>
            ${items
              .map((item) => `
                <li>
                  <input
                    type="text"
                    value="${escapeHtml(item.name)}"
                    data-action="edit-library-item"
                    data-id="${item.id}"
                    data-category="${category.id}"
                  >
                  <div class="planner-library-item-actions">
                    <button type="button" class="ghost" data-action="add-library-item-to-plan" data-id="${item.id}" data-category="${category.id}" title="Add to plan">+</button>
                    <button type="button" class="ghost" data-action="delete-library" data-id="${item.id}">Delete</button>
                  </div>
                </li>
              `)
              .join("")}
          </ul>`
        : `<p class="small muted">No exercises saved yet.</p>`;
      return `
        <section class="planner-library-group">
          <header>
            <input
              type="text"
              class="planner-library-category-input"
              value="${escapeHtml(getCategoryNameById(category.id))}"
              data-action="edit-category-name"
              data-category="${category.id}"
            >
            <div class="planner-library-header-actions">
              <button type="button" class="ghost planner-library-plus" data-action="quick-add-library-item" data-category="${category.id}" title="Add exercise">+</button>
              <span>${items.length}</span>
            </div>
          </header>
          <div class="planner-library-quick-add">
            <input
              type="text"
              placeholder="Add new movement/exercise"
              value="${escapeHtml(draft)}"
              data-action="library-draft-input"
              data-category="${category.id}"
            >
            <button type="button" class="primary" data-action="save-library-draft" data-category="${category.id}">Add +</button>
          </div>
          ${itemsHtml}
        </section>
      `;
    }).join("");
    els.libraryGroups.innerHTML = groupsHtml;
    if (state.pendingLibraryFocus) {
      const target = els.libraryGroups.querySelector(`input[data-action="edit-library-item"][data-id="${state.pendingLibraryFocus}"]`);
      if (target && target instanceof HTMLInputElement) {
        target.focus();
        target.select();
      }
      state.pendingLibraryFocus = "";
    }
  }

  function autoResizeAllTextareas() {
    root.querySelectorAll("textarea[data-action='item-input']").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }

  function renderRows() {
    if (!els.rows) return;
    const rowsHtml = CATEGORIES.map((category) => {
      const items = state.schedule[category.id] || [];
      const options = state.exerciseLibrary
        .filter((entry) => entry.categoryId === category.id)
        .map((entry) => `<option value="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</option>`)
        .join("");
      const itemsHtml = items
        .map((item) => {
          return `
            <li>
              <textarea
                data-action="item-input"
                data-category="${category.id}"
                data-item-id="${item.id}"
                rows="1"
                placeholder="Type drill here..."
              >${escapeHtml(item.name)}</textarea>
              <div class="planner-item-print-text">${escapeHtml(item.name || "-")}</div>
              <button type="button" class="ghost" data-action="remove-item" data-category="${category.id}" data-item-id="${item.id}">Delete</button>
            </li>
          `;
        })
        .join("");

      return `
        <tr>
          <td>
            <div class="planner-category-title">${escapeHtml(getCategoryNameById(category.id))}</div>
            <div class="planner-row-controls">
              <select data-action="pick-library" data-category="${category.id}">
                <option value="">Choose saved drill...</option>
                ${options}
              </select>
              <button type="button" class="ghost" data-action="add-manual" data-category="${category.id}">+ Type</button>
            </div>
            <ul class="planner-items-list">${itemsHtml}</ul>
          </td>
          <td class="planner-time-cell">
            <input
              type="number"
              min="0"
              data-action="time-input"
              data-category="${category.id}"
              value="${escapeHtml(state.categoryTimes[category.id] || "0")}" />
            <div class="planner-time-print-text">${escapeHtml(state.categoryTimes[category.id] || "0")} min</div>
          </td>
        </tr>
      `;
    }).join("");

    els.rows.innerHTML = rowsHtml;
    autoResizeAllTextareas();

    if (state.pendingFocus) {
      const selector = `textarea[data-category='${state.pendingFocus.categoryId}'][data-item-id='${state.pendingFocus.itemId}']`;
      const target = root.querySelector(selector);
      if (target) {
        target.focus();
      }
      state.pendingFocus = null;
    }
  }

  function render() {
    if (els.dateInput) els.dateInput.value = state.docInfo.date || "";
    if (els.totalTimeInput) els.totalTimeInput.value = state.docInfo.totalTime || "90";
    updatePrintMetaValues();
    updateFooter();
    updateLogos();
    renderCategorySelectOptions();
    renderRows();
    renderLibraryGroups();
    updateTimeStatus();
    setBottomStatus(getBottomStatusDefaultMessage());
    renderTrackPanels();
    renderLiftingLab();
  }

  function handleRootClick(event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const action = trigger.dataset.action;
    if (action === "add-manual") {
      addToSchedule(trigger.dataset.category, "");
      return;
    }
    if (action === "remove-item") {
      removeFromSchedule(trigger.dataset.category, trigger.dataset.itemId);
      return;
    }
    if (action === "delete-library") {
      deleteExerciseFromLibrary(trigger.dataset.id);
      return;
    }
    if (action === "save-library-draft") {
      const safeCategoryId = normalizeCategoryId(trigger.dataset.category);
      const draftInput = root.querySelector(`input[data-action="library-draft-input"][data-category="${safeCategoryId}"]`);
      if (draftInput && draftInput instanceof HTMLInputElement) {
        updateLibraryDraft(safeCategoryId, draftInput.value);
      }
      addDraftExerciseToLibrary(trigger.dataset.category);
      return;
    }
    if (action === "add-library-item-to-plan") {
      addLibraryItemToPlan(trigger.dataset.id, trigger.dataset.category);
      return;
    }
    if (action === "import-coach-item") {
      importCoachLibraryEntry(trigger.dataset.coachUid, trigger.dataset.itemId);
      return;
    }
    if (action === "toggle-assign-athlete") {
      const athleteId = String(trigger.dataset.athleteId || "").trim();
      if (!athleteId) return;
      if (state.selectedAthleteIds.includes(athleteId)) {
        state.selectedAthleteIds = state.selectedAthleteIds.filter((id) => id !== athleteId);
      } else {
        state.selectedAthleteIds = [...state.selectedAthleteIds, athleteId];
      }
      renderAssignAthleteList();
      return;
    }
    if (action === "quick-add-library-item") {
      quickAddLibraryItem(trigger.dataset.category);
      return;
    }
    if (action === "lifting-switch-day") {
      setLiftingActiveDay(trigger.dataset.dayIndex);
      return;
    }
    if (action === "lifting-add-exercise-to-day") {
      addLiftingExerciseToActiveDay(trigger.dataset.exerciseName);
      return;
    }
    if (action === "lifting-remove-exercise") {
      removeLiftingExercise(trigger.dataset.exerciseId);
      return;
    }
    if (action === "lifting-load-plan") {
      loadLiftingPlanFromList(trigger.dataset.planId);
      return;
    }
    if (action === "lifting-delete-plan") {
      deleteLiftingPlan(trigger.dataset.planId).catch(() => {});
      return;
    }
    if (action === "load-template-record") {
      applyTemplateToPlanner(trigger.dataset.templateId);
    }
  }

  function handleRootChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("select[data-action='pick-library']")) {
      const categoryId = target.dataset.category;
      const value = target.value;
      if (categoryId && value) {
        addToSchedule(categoryId, value);
      }
      target.value = "";
      return;
    }

    if (target.matches("input[data-action='time-input']")) {
      const categoryId = target.dataset.category;
      if (!categoryId) return;
      state.categoryTimes[categoryId] = String(target.value || "0");
      persistDaily();
      updateTimeStatus();
      return;
    }

    if (target.matches("input[data-action='library-draft-input']")) {
      updateLibraryDraft(target.dataset.category, target.value);
      return;
    }

    if (target.matches("input[data-action='edit-category-name']")) {
      updateCategoryName(target.dataset.category, target.value);
      return;
    }

    if (target.matches("input[data-action='edit-library-item']")) {
      updateLibraryItemName(target.dataset.id, target.dataset.category, target.value);
    }
  }

  function handleRootInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("input[data-action='lifting-update-exercise-field']")) {
      updateLiftingExerciseField(target.dataset.exerciseId, target.dataset.field, target.value);
      return;
    }

    if (target === els.liftingPlanNameInput) {
      updateLiftingPlanMetaField("name", els.liftingPlanNameInput.value || "");
      return;
    }

    if (target === els.liftingPlanWeeksInput) {
      updateLiftingPlanMetaField("weeks", els.liftingPlanWeeksInput.value || "");
      return;
    }

    if (target === els.liftingPlanPurposeInput) {
      updateLiftingPlanMetaField("purpose", els.liftingPlanPurposeInput.value || "");
      return;
    }

    if (target === els.liftingPlanBenefitsInput) {
      updateLiftingPlanMetaField("benefits", els.liftingPlanBenefitsInput.value || "");
      return;
    }

    if (target === els.liftingActiveDayNameInput) {
      updateLiftingDayName(els.liftingActiveDayNameInput.value || "");
      return;
    }

    if (target === els.liftingSearchInput) {
      state.liftingSearch = String(els.liftingSearchInput.value || "");
      renderLiftingLibraryGroups();
      return;
    }

    if (target.matches("textarea[data-action='item-input']")) {
      const categoryId = target.dataset.category;
      const itemId = target.dataset.itemId;
      if (!categoryId || !itemId) return;
      updateScheduleItem(categoryId, itemId, target.value);
      target.style.height = "auto";
      target.style.height = `${target.scrollHeight}px`;
      return;
    }

    if (target.matches("input[data-action='library-draft-input']")) {
      updateLibraryDraft(target.dataset.category, target.value);
      return;
    }

    if (target.matches("input[data-action='edit-category-name']")) {
      const categoryId = normalizeCategoryId(target.dataset.category);
      state.categoryNames[categoryId] = target.value;
      return;
    }

    if (target.matches("input[data-action='edit-library-item']")) {
      setLibraryItemDraft(target.dataset.id, target.dataset.category, target.value);
      return;
    }

    if (target === els.assignSearchInput) {
      state.assignSearch = String(els.assignSearchInput.value || "");
      renderAssignAthleteList();
      return;
    }

    if (target === els.assignDueDateInput) {
      state.assignDueDate = normalizeDateKeyValue(els.assignDueDateInput.value || "");
      return;
    }

    if (target === els.dateInput) {
      state.docInfo.date = String(els.dateInput.value || "");
      persistDaily();
      updatePrintMetaValues();
      return;
    }

    if (target === els.totalTimeInput) {
      setTotalTime(els.totalTimeInput.value || "90");
      return;
    }

    if (target === els.settingsClubInput && state.tempSettings) {
      state.tempSettings.clubName = target.value;
      return;
    }
    if (target === els.settingsCoachInput && state.tempSettings) {
      state.tempSettings.coach = target.value;
      return;
    }
    if (target === els.settingsSeasonInput && state.tempSettings) {
      state.tempSettings.season = target.value;
    }
  }

  function handleRootBlur(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("textarea[data-action='item-input']")) {
      const categoryId = target.dataset.category;
      if (!categoryId) return;
      ensureItemInLibrary(categoryId, target.value);
      renderRows();
      return;
    }
    if (target.matches("input[data-action='edit-category-name']")) {
      updateCategoryName(target.dataset.category, target.value);
      return;
    }
    if (target.matches("input[data-action='edit-library-item']")) {
      updateLibraryItemName(target.dataset.id, target.dataset.category, target.value);
    }
  }

  function handleRootKeydown(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("input[data-action='library-draft-input']")) return;
    if (event.key !== "Enter") return;
    event.preventDefault();
    addDraftExerciseToLibrary(target.dataset.category);
  }

  function bindStaticEvents() {
    root.addEventListener("click", handleRootClick);
    root.addEventListener("change", handleRootChange);
    root.addEventListener("input", handleRootInput);
    root.addEventListener("blur", handleRootBlur, true);
    root.addEventListener("keydown", handleRootKeydown);

    els.trackButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeTrack = normalizeTrack(btn.dataset.plannerTrack);
        renderTrackPanels();
        focusPlannerWindow(root, { smooth: true });
      });
    });

    els.liftingTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        setLiftingTab(btn.dataset.liftingTab);
      });
    });

    els.liftingPrintBtn?.addEventListener("click", () => window.print());
    els.liftingSaveProtocolBtn?.addEventListener("click", () => {
      saveLiftingProtocol().catch(() => {});
    });
    els.liftingAddCategoryBtn?.addEventListener("click", () => {
      addLiftingCategory();
    });
    els.liftingAddExerciseBtn?.addEventListener("click", () => {
      addLiftingExerciseToLibrary();
    });
    els.liftingNewCategoryInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addLiftingCategory();
    });
    els.liftingNewExerciseInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addLiftingExerciseToLibrary();
    });

    els.printBtn?.addEventListener("click", () => window.print());

    els.totalTimeDownBtn?.addEventListener("click", () => {
      const current = normalizeTotalTime(state.docInfo.totalTime);
      setTotalTime(Math.max(1, current - 5));
    });
    els.totalTimeUpBtn?.addEventListener("click", () => {
      const current = normalizeTotalTime(state.docInfo.totalTime);
      setTotalTime(current + 5);
    });
    els.totalTimeInput?.addEventListener("change", () => {
      setTotalTime(els.totalTimeInput.value || "90");
    });

    els.openSettingsBtn?.addEventListener("click", openSettingsModal);
    els.settingsCloseBtn?.addEventListener("click", closeSettingsModal);
    els.settingsCancelBtn?.addEventListener("click", closeSettingsModal);
    els.settingsSaveBtn?.addEventListener("click", saveSettings);
    els.settingsRemoveLogoBtn?.addEventListener("click", () => {
      if (!state.tempSettings) return;
      state.tempSettings.logoUrl = null;
      renderSettingsLogoPreview();
    });
    els.settingsLogoInput?.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file || !state.tempSettings) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        state.tempSettings.logoUrl = String(reader.result || "");
        renderSettingsLogoPreview();
      };
      reader.readAsDataURL(file);
    });

    els.openLibraryBtn?.addEventListener("click", openLibraryModal);
    els.loadTemplateBtn?.addEventListener("click", openTemplatesModal);
    els.libraryCloseBtn?.addEventListener("click", closeLibraryModal);
    els.libraryCancelBtn?.addEventListener("click", closeLibraryModal);
    els.templatesCloseBtn?.addEventListener("click", closeTemplatesModal);
    els.templatesCancelBtn?.addEventListener("click", closeTemplatesModal);
    els.templatesRefreshBtn?.addEventListener("click", () => {
      loadPlannerTemplates().catch(() => {});
    });
    els.saveLibraryItemBtn?.addEventListener("click", saveExerciseToLibrary);
    els.newExerciseNameInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      saveExerciseToLibrary();
    });
    els.saveTemplateBtn?.addEventListener("click", () => {
      savePlannerAsTemplate().catch(() => {});
    });
    els.sendAthletesBtn?.addEventListener("click", openAssignModal);
    els.saveTemplateTopBtn?.addEventListener("click", () => {
      savePlannerAsTemplate().catch(() => {});
    });
    els.sendAthletesTopBtn?.addEventListener("click", openAssignModal);
    els.assignCloseBtn?.addEventListener("click", closeAssignModal);
    els.assignCancelBtn?.addEventListener("click", closeAssignModal);
    els.assignSendBtn?.addEventListener("click", () => {
      sendPlannerTrainingToAthletes().catch(() => {});
    });
    els.assignSelectAllBtn?.addEventListener("click", () => {
      state.selectedAthleteIds = state.assignAthletes.map((athlete) => athlete.id);
      renderAssignAthleteList();
    });
    els.assignClearBtn?.addEventListener("click", () => {
      state.selectedAthleteIds = [];
      renderAssignAthleteList();
    });
    els.liftingSaveBtn?.addEventListener("click", () => saveTrackDraft("lifting"));
    els.liftingClearBtn?.addEventListener("click", () => clearTrackDraft("lifting"));
    els.mentalSaveBtn?.addEventListener("click", () => saveTrackDraft("mental"));
    els.mentalClearBtn?.addEventListener("click", () => clearTrackDraft("mental"));

    root.querySelectorAll(".planner-modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", () => {
        const dismiss = backdrop.dataset.dismiss;
        if (dismiss === "settings") closeSettingsModal();
        if (dismiss === "library") closeLibraryModal();
        if (dismiss === "templates") closeTemplatesModal();
        if (dismiss === "assign") closeAssignModal();
      });
    });
  }

  bindStaticEvents();
  state.liftingPlan = normalizeLiftingPlan(state.liftingPlan || buildDefaultLiftingPlan());
  state.liftingLibrary = normalizeLiftingLibraryMap(state.liftingLibrary || DEFAULT_LIFTING_LIBRARY);
  persistLiftingPlanLocal();
  persistLiftingLibraryLocal();
  persistLiftingUiLocal();
  setupLiftingRealtimeSync();
  fillTrackDraftInputs("lifting");
  fillTrackDraftInputs("mental");
  render();
  persistSettings();
  hydratePlannerSettingsFromCloud().catch(() => {});
})();
