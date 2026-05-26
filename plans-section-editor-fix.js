(function () {
  "use strict";

  if (!/\/plans\/?(?:$|[?#])/.test(window.location.pathname + window.location.search)) return;

  var CATEGORIES_KEY = "planner_wrestling_categories";
  var CATEGORY_NAMES_KEY = "planner_category_names";
  var DEFAULT_CATEGORIES = [
    { id: "roll_call", name: "Roll Call and Announcements" },
    { id: "warm_up", name: "Warm Up" },
    { id: "techniques", name: "Introduction of New Techniques or drills" },
    { id: "live_wrestling", name: "Live wrestling (High pace drills)" },
    { id: "strength", name: "Strength and Skill Based Activities" },
    { id: "cool_down", name: "Cool Down Closing and Visualization" },
    { id: "announcements", name: "Announcements" }
  ];

  function slug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 42) || "section";
  }

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function normalizeCategories(list) {
    var source = Array.isArray(list) && list.length ? list : DEFAULT_CATEGORIES;
    var used = {};
    return source.map(function (item, index) {
      var name = String((item && (item.name || item.label)) || DEFAULT_CATEGORIES[index]?.name || ("Section " + (index + 1))).trim();
      var base = slug((item && item.id) || name || ("section_" + (index + 1)));
      var id = base;
      var counter = 2;
      while (used[id]) {
        id = base + "_" + counter;
        counter += 1;
      }
      used[id] = true;
      return { id: id, name: name || ("Section " + (index + 1)) };
    });
  }

  function getCategories() {
    var saved = normalizeCategories(readJson(CATEGORIES_KEY, []));
    var names = readJson(CATEGORY_NAMES_KEY, {});
    if (names && typeof names === "object") {
      saved = saved.map(function (category) {
        var customName = String(names[category.id] || "").trim();
        return customName ? { id: category.id, name: customName } : category;
      });
    }
    return saved;
  }

  function saveCategories(categories) {
    var normalized = normalizeCategories(categories);
    var names = {};
    normalized.forEach(function (category) {
      names[category.id] = category.name;
    });
    writeJson(CATEGORIES_KEY, normalized);
    writeJson(CATEGORY_NAMES_KEY, names);
    window.dispatchEvent(new CustomEvent("wpl:planner-sections-updated", { detail: { categories: normalized } }));
    window.dispatchEvent(new StorageEvent("storage", { key: CATEGORIES_KEY, newValue: JSON.stringify(normalized) }));
    return normalized;
  }

  function findMount() {
    return document.getElementById("coachPlannerApp") ||
      document.getElementById("panel-plans") ||
      document.getElementById("panel-coach-plans") ||
      document.querySelector(".panel:not(.hidden)") ||
      document.body;
  }

  function render() {
    if (document.getElementById("wplSectionEditorFix")) return;
    var mount = findMount();
    if (!mount) return;

    var box = document.createElement("section");
    box.id = "wplSectionEditorFix";
    box.className = "mini-card wpl-section-editor-fix";
    box.innerHTML = [
      '<div class="card-header">',
      '<div>',
      '<h3>Edit Wrestling Plan Sections</h3>',
      '<p class="small muted">Rename sections and move them up or down. Press Save, then reload the planner if the order does not update immediately.</p>',
      '</div>',
      '<button type="button" class="ghost" data-wpl-section-action="reload">Reload planner</button>',
      '</div>',
      '<div class="wpl-section-editor-list" data-wpl-section-list></div>',
      '<div class="row">',
      '<button type="button" class="primary" data-wpl-section-action="save">Save section names/order</button>',
      '<button type="button" class="ghost" data-wpl-section-action="add">Add section</button>',
      '<button type="button" class="ghost" data-wpl-section-action="reset">Reset default sections</button>',
      '<span class="small muted" data-wpl-section-status></span>',
      '</div>'
    ].join("");

    if (mount.firstChild) mount.insertBefore(box, mount.firstChild);
    else mount.appendChild(box);
    drawList();
  }

  function drawList() {
    var box = document.getElementById("wplSectionEditorFix");
    if (!box) return;
    var list = box.querySelector("[data-wpl-section-list]");
    if (!list) return;
    var categories = getCategories();
    list.innerHTML = categories.map(function (category, index) {
      return [
        '<div class="wpl-section-editor-row" data-section-id="' + category.id + '">',
        '<span class="chip">' + (index + 1) + '</span>',
        '<input type="text" value="' + category.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") + '" data-section-name>',
        '<button type="button" class="ghost" data-wpl-section-action="up" ' + (index === 0 ? "disabled" : "") + '>Up</button>',
        '<button type="button" class="ghost" data-wpl-section-action="down" ' + (index === categories.length - 1 ? "disabled" : "") + '>Down</button>',
        '<button type="button" class="ghost" data-wpl-section-action="delete">Delete</button>',
        '</div>'
      ].join("");
    }).join("");
  }

  function collectRows() {
    var rows = Array.prototype.slice.call(document.querySelectorAll("#wplSectionEditorFix [data-section-id]"));
    return rows.map(function (row, index) {
      var id = String(row.getAttribute("data-section-id") || "").trim() || ("section_" + (index + 1));
      var input = row.querySelector("[data-section-name]");
      var name = String(input && input.value || "").trim() || ("Section " + (index + 1));
      return { id: id, name: name };
    });
  }

  function setStatus(text) {
    var status = document.querySelector("#wplSectionEditorFix [data-wpl-section-status]");
    if (status) status.textContent = text || "";
  }

  function getSectionInput(target) {
    return target && target.closest && target.closest("#wplSectionEditorFix [data-section-name]");
  }

  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest && event.target.closest("#wplSectionEditorFix [data-wpl-section-action]");
    if (!button) return;
    var action = button.getAttribute("data-wpl-section-action");
    var categories = collectRows();
    var row = button.closest("[data-section-id]");
    var index = row ? Array.prototype.indexOf.call(row.parentNode.children, row) : -1;

    if (action === "up" && index > 0) {
      var itemUp = categories.splice(index, 1)[0];
      categories.splice(index - 1, 0, itemUp);
      saveCategories(categories);
      drawList();
      setStatus("Moved up. Press Save to confirm.");
      return;
    }
    if (action === "down" && index >= 0 && index < categories.length - 1) {
      var itemDown = categories.splice(index, 1)[0];
      categories.splice(index + 1, 0, itemDown);
      saveCategories(categories);
      drawList();
      setStatus("Moved down. Press Save to confirm.");
      return;
    }
    if (action === "delete" && index >= 0) {
      categories.splice(index, 1);
      saveCategories(categories);
      drawList();
      setStatus("Section removed. Press Save to confirm.");
      return;
    }
    if (action === "add") {
      var name = window.prompt("New section name", "New Section");
      if (!name) return;
      categories.push({ id: slug(name), name: String(name).trim() });
      saveCategories(categories);
      drawList();
      setStatus("Section added.");
      return;
    }
    if (action === "reset") {
      saveCategories(DEFAULT_CATEGORIES);
      drawList();
      setStatus("Default sections restored.");
      return;
    }
    if (action === "save") {
      saveCategories(categories);
      setStatus("Saved. Reload the planner if the order does not update instantly.");
      return;
    }
    if (action === "reload") {
      window.location.reload();
    }
  });

  document.addEventListener("input", function (event) {
    if (!event.target || !event.target.matches("#wplSectionEditorFix [data-section-name]")) return;
    event.stopPropagation();
    saveCategories(collectRows());
    setStatus("Saved locally.");
  }, true);

  ["pointerdown", "mousedown", "touchstart", "click", "keydown"].forEach(function (eventName) {
    document.addEventListener(eventName, function (event) {
      if (!getSectionInput(event.target)) return;
      event.stopPropagation();
    }, true);
  });

  function boot() {
    render();
    setTimeout(render, 800);
    setTimeout(render, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}());
