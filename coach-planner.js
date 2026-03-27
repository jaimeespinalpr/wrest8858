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

  const STORAGE_KEYS = {
    settings: "planner_template_settings",
    library: "archmere_exercise_library",
    daily: "planner_daily_state",
    categoryNames: "planner_category_names"
  };

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

  const dailyState = readJson(STORAGE_KEYS.daily, {});

  const state = {
    docInfo: {
      date: String(dailyState.date || ""),
      totalTime: String(dailyState.totalTime || "90")
    },
    settings: readJson(STORAGE_KEYS.settings, {
      clubName: "ARCHMERE AUKS",
      coach: "Coach Espinal",
      season: "Season 2025-2026",
      logoUrl: null
    }),
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
    categoryDrafts: {},
    pendingLibraryFocus: "",
    assignAthletes: [],
    selectedAthleteIds: [],
    assignSearch: "",
    assignDueDate: "",
    assignModalBusy: false,
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
    timeBadge: document.getElementById("plannerTimeBadge"),
    timeLabel: document.getElementById("plannerTimeLabel"),
    openSettingsBtn: document.getElementById("plannerOpenSettingsBtn"),
    openLibraryBtn: document.getElementById("plannerOpenLibraryBtn"),
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
    assignModal: document.getElementById("plannerAssignModal"),
    assignCloseBtn: document.getElementById("plannerAssignCloseBtn"),
    assignCancelBtn: document.getElementById("plannerAssignCancelBtn"),
    assignSendBtn: document.getElementById("plannerAssignSendBtn"),
    assignList: document.getElementById("plannerAssignList"),
    assignStatus: document.getElementById("plannerAssignStatus"),
    assignSearchInput: document.getElementById("plannerAssignSearchInput"),
    assignSelectAllBtn: document.getElementById("plannerAssignSelectAllBtn"),
    assignClearBtn: document.getElementById("plannerAssignClearBtn"),
    assignDueDateInput: document.getElementById("plannerAssignDueDateInput")
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
    if (els.footerClub) els.footerClub.textContent = state.settings.clubName || "ARCHMERE AUKS";
    if (els.footerCoach) els.footerCoach.textContent = state.settings.coach || "Coach Espinal";
    if (els.footerSeason) els.footerSeason.textContent = state.settings.season || "Season";
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

  function getPlannerTitle() {
    const dateKey = normalizeDateKeyValue(state.docInfo.date || getTodayDateKey());
    return `Daily Training Plan - ${formatDateLabel(dateKey)}`;
  }

  function normalizeAthleteRecord(id, data = {}) {
    const name = String(data?.name || "").trim();
    if (!name) return null;
    const athleteUid = String(data?.athleteUid || data?.uid || "").trim();
    const athleteEmail = String(data?.athleteEmail || data?.email || "").trim();
    return {
      id: String(id || toSimpleSlug(name)).trim() || toSimpleSlug(name),
      name,
      athleteUid,
      athleteEmail
    };
  }

  function renderAssignAthleteList() {
    if (!els.assignList) return;
    const filter = String(state.assignSearch || "").trim().toLowerCase();
    const filtered = state.assignAthletes.filter((athlete) => {
      if (!filter) return true;
      return athlete.name.toLowerCase().includes(filter)
        || athlete.id.toLowerCase().includes(filter)
        || athlete.athleteEmail.toLowerCase().includes(filter);
    });
    if (!filtered.length) {
      els.assignList.innerHTML = `<p class="small muted">No athletes found.</p>`;
      return;
    }
    const html = filtered.map((athlete) => {
      const isSelected = state.selectedAthleteIds.includes(athlete.id);
      return `
        <button
          type="button"
          class="planner-assign-athlete${isSelected ? " active" : ""}"
          data-action="toggle-assign-athlete"
          data-athlete-id="${escapeHtml(athlete.id)}"
        >
          <strong>${escapeHtml(athlete.name)}</strong>
          <span>${escapeHtml(athlete.athleteEmail || athlete.id)}</span>
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
      setAssignStatus("Coach workspace is not available right now.", true);
      return;
    }

    try {
      setAssignStatus("Loading athletes...");
      const snap = await athletesRef.get();
      let records = snap.docs
        .map((doc) => normalizeAthleteRecord(doc.id, doc.data() || {}))
        .filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name));

      if (!records.length) {
        const usersRef = getPlannerUsersCollectionRef();
        if (usersRef) {
          const usersSnap = await usersRef.where("role", "==", "athlete").get();
          records = usersSnap.docs
            .map((doc) => normalizeAthleteRecord(doc.id, doc.data() || {}))
            .filter(Boolean)
            .sort((left, right) => left.name.localeCompare(right.name));
        }
      }

      state.assignAthletes = records;
      state.selectedAthleteIds = state.selectedAthleteIds.filter((athleteId) => records.some((item) => item.id === athleteId));
      renderAssignAthleteList();
      if (!records.length) {
        setAssignStatus("No athletes available yet. Register athletes first.");
      } else {
        setAssignStatus(`${records.length} athletes available.`);
      }
    } catch (err) {
      console.warn("Failed to load athletes for planner assignment", err);
      state.assignAthletes = [];
      state.selectedAthleteIds = [];
      renderAssignAthleteList();
      setAssignStatus("Could not load athletes. Try again.", true);
    }
  }

  function openAssignModal() {
    const nextDue = normalizeDateKeyValue(state.docInfo.date || getTodayDateKey());
    state.assignDueDate = nextDue;
    state.assignSearch = "";
    if (els.assignDueDateInput) els.assignDueDateInput.value = nextDue;
    if (els.assignSearchInput) els.assignSearchInput.value = "";
    els.assignModal?.classList.remove("hidden");
    setAssignStatus("Choose athletes, then send.");
    loadPlannerAthletesForAssignment().catch(() => {});
  }

  function closeAssignModal() {
    els.assignModal?.classList.add("hidden");
  }

  async function savePlannerAsTemplate() {
    if (state.assignModalBusy) return;
    const templatesRef = getPlannerWorkspaceCollectionRef("templates");
    if (!templatesRef) {
      setBottomStatus("Template storage is not available.", true);
      return;
    }

    const defaultName = `Template - ${formatDateLabel(state.docInfo.date || getTodayDateKey())}`;
    const nextName = window.prompt("Template name", defaultName);
    if (nextName == null) return;
    const cleanName = String(nextName || "").trim();
    if (!cleanName) {
      setBottomStatus("Template name is required.", true);
      return;
    }

    const timestamp = getPlannerTimestamp();
    const payload = {
      name: cleanName,
      type: "day",
      focus: `${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min practice flow`,
      coachNotes: "Saved from Coach Planner.",
      items: buildPlanItemsFromPlanner(),
      monthlyNotes: "",
      seasonYear: String(state.settings?.season || "").trim(),
      system: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      const ref = templatesRef.doc();
      await ref.set(payload, { merge: true });
      state.lastSavedTemplateId = ref.id;
      setBottomStatus(`Template saved: ${cleanName}`);
      triggerToast("Template saved.");
    } catch (err) {
      console.warn("Failed to save planner template", err);
      setBottomStatus("Could not save template.", true);
    }
  }

  async function sendPlannerTrainingToAthletes() {
    if (state.assignModalBusy) return;
    const selected = state.assignAthletes.filter((athlete) => state.selectedAthleteIds.includes(athlete.id));
    if (!selected.length) {
      setAssignStatus("Select at least one athlete.", true);
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
      els.assignSendBtn.textContent = "Sending...";
    }
    setAssignStatus("Saving plan and assignments...");

    const dueDateKey = normalizeDateKeyValue(state.assignDueDate || state.docInfo.date || getTodayDateKey());
    const timestamp = getPlannerTimestamp();
    const authUser = getPlannerAuthUser();
    const profile = getPlannerProfile();
    const createdBy = String(profile?.name || authUser?.email || "Coach").trim();
    const planTitle = getPlannerTitle();
    const athleteNames = selected.map((athlete) => athlete.name);
    const athleteIds = selected.map((athlete) => athlete.id);
    const athleteUids = selected.map((athlete) => athlete.athleteUid).filter(Boolean);
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
          athleteNames,
          athleteIds,
          athleteUids,
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
        const assignmentPayload = {
          title: planTitle,
          assigneeType: "athlete",
          assigneeId: athlete.id,
          assigneeName: athlete.name,
          assigneeNames: [athlete.name],
          athleteIds: [athlete.id],
          athleteUids: athlete.athleteUid ? [athlete.athleteUid] : [],
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

      const successMessage = `Training sent to ${selected.length} athlete${selected.length === 1 ? "" : "s"}.`;
      setAssignStatus(successMessage);
      setBottomStatus(successMessage);
      triggerToast(successMessage);
      closeAssignModal();
    } catch (err) {
      console.warn("Failed to send planner training assignments", err);
      setAssignStatus("Could not send training. Try again.", true);
    } finally {
      state.assignModalBusy = false;
      if (els.assignSendBtn) {
        els.assignSendBtn.disabled = false;
        els.assignSendBtn.textContent = "Send training";
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
    state.settings = {
      ...state.tempSettings,
      clubName: String(state.tempSettings.clubName || "").trim() || "ARCHMERE AUKS",
      coach: String(state.tempSettings.coach || "").trim() || "Coach Espinal",
      season: String(state.tempSettings.season || "").trim() || "Season 2025-2026"
    };
    persistSettings();
    updateFooter();
    updateLogos();
    closeSettingsModal();
    triggerToast("Template settings saved!");
  }

  function openLibraryModal() {
    els.libraryModal?.classList.remove("hidden");
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
    setBottomStatus("Save as template or send this training to athletes.");
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
    els.libraryCloseBtn?.addEventListener("click", closeLibraryModal);
    els.libraryCancelBtn?.addEventListener("click", closeLibraryModal);
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

    root.querySelectorAll(".planner-modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", () => {
        const dismiss = backdrop.dataset.dismiss;
        if (dismiss === "settings") closeSettingsModal();
        if (dismiss === "library") closeLibraryModal();
        if (dismiss === "assign") closeAssignModal();
      });
    });
  }

  bindStaticEvents();
  render();
})();
