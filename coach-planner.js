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
    daily: "planner_daily_state"
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
    exerciseLibrary: readJson(STORAGE_KEYS.library, INITIAL_LIBRARY),
    schedule: dailyState.schedule && typeof dailyState.schedule === "object" ? dailyState.schedule : {},
    categoryTimes: {
      ...INITIAL_TIMES,
      ...(dailyState.categoryTimes && typeof dailyState.categoryTimes === "object" ? dailyState.categoryTimes : {})
    },
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
    printBtn: document.getElementById("plannerPrintBtn"),
    dateInput: document.getElementById("plannerDateInput"),
    totalTimeInput: document.getElementById("plannerTotalTimeInput"),
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
    libraryGroups: document.getElementById("plannerLibraryGroups")
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

  function getUsedTime() {
    return CATEGORIES.reduce((total, category) => total + parseTimeValue(state.categoryTimes[category.id]), 0);
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
    const exists = state.exerciseLibrary.some((entry) => {
      return entry.categoryId === categoryId && entry.name.toLowerCase() === cleanName.toLowerCase();
    });
    if (exists) return;
    state.exerciseLibrary = [...state.exerciseLibrary, { id: makeId(), name: cleanName, categoryId }];
    persistLibrary();
  }

  function saveExerciseToLibrary() {
    const name = String(els.newExerciseNameInput?.value || "").trim();
    const categoryId = String(els.newExerciseCategorySelect?.value || CATEGORIES[0].id);
    if (!name) return;
    state.exerciseLibrary = [...state.exerciseLibrary, { id: makeId(), name, categoryId }];
    persistLibrary();
    renderRows();
    renderLibraryGroups();
    if (els.newExerciseNameInput) els.newExerciseNameInput.value = "";
    triggerToast("Exercise saved to library!");
  }

  function deleteExerciseFromLibrary(id) {
    state.exerciseLibrary = state.exerciseLibrary.filter((entry) => entry.id !== id);
    persistLibrary();
    renderRows();
    renderLibraryGroups();
  }

  function renderCategorySelectOptions() {
    if (!els.newExerciseCategorySelect) return;
    els.newExerciseCategorySelect.innerHTML = CATEGORIES
      .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
      .join("");
  }

  function renderLibraryGroups() {
    if (!els.libraryGroups) return;
    const groupsHtml = CATEGORIES.map((category) => {
      const items = state.exerciseLibrary.filter((entry) => entry.categoryId === category.id);
      if (!items.length) {
        return `
          <section class="planner-library-group">
            <header>${escapeHtml(category.name)} <span>0</span></header>
            <p class="small muted">No exercises saved yet.</p>
          </section>
        `;
      }
      return `
        <section class="planner-library-group">
          <header>${escapeHtml(category.name)} <span>${items.length}</span></header>
          <ul>
            ${items
              .map((item) => `<li><span>${escapeHtml(item.name)}</span><button type="button" class="ghost" data-action="delete-library" data-id="${item.id}">Delete</button></li>`)
              .join("")}
          </ul>
        </section>
      `;
    }).join("");
    els.libraryGroups.innerHTML = groupsHtml;
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
              <button type="button" class="ghost" data-action="remove-item" data-category="${category.id}" data-item-id="${item.id}">Delete</button>
            </li>
          `;
        })
        .join("");

      return `
        <tr>
          <td>
            <div class="planner-category-title">${escapeHtml(category.name)}</div>
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
    updateFooter();
    updateLogos();
    renderCategorySelectOptions();
    renderRows();
    renderLibraryGroups();
    updateTimeStatus();
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

    if (target === els.dateInput) {
      state.docInfo.date = String(els.dateInput.value || "");
      persistDaily();
      return;
    }

    if (target === els.totalTimeInput) {
      state.docInfo.totalTime = String(els.totalTimeInput.value || "90");
      persistDaily();
      updateTimeStatus();
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
    if (!target.matches("textarea[data-action='item-input']")) return;
    const categoryId = target.dataset.category;
    if (!categoryId) return;
    ensureItemInLibrary(categoryId, target.value);
    renderRows();
  }

  function bindStaticEvents() {
    root.addEventListener("click", handleRootClick);
    root.addEventListener("change", handleRootChange);
    root.addEventListener("input", handleRootInput);
    root.addEventListener("blur", handleRootBlur, true);

    els.printBtn?.addEventListener("click", () => window.print());

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

    root.querySelectorAll(".planner-modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", () => {
        const dismiss = backdrop.dataset.dismiss;
        if (dismiss === "settings") closeSettingsModal();
        if (dismiss === "library") closeLibraryModal();
      });
    });
  }

  bindStaticEvents();
  render();
})();
