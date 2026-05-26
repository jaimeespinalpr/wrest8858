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

  function injectStyle() {
    if (document.getElementById("wplSectionMobileFixStyle")) return;
    var style = document.createElement("style");
    style.id = "wplSectionMobileFixStyle";
    style.textContent = [
      "#wplSectionMobileFix{position:relative;z-index:2147483647;margin:12px;padding:14px;border-radius:18px;background:#ffffff;color:#0f172a;box-shadow:0 18px 50px rgba(15,23,42,.28);border:1px solid rgba(15,23,42,.12);pointer-events:auto;touch-action:manipulation;-webkit-transform:translateZ(0);transform:translateZ(0)}",
      "#wplSectionMobileFix *{box-sizing:border-box;pointer-events:auto;touch-action:manipulation}",
      "#wplSectionMobileFix h3{margin:0;font-size:18px;line-height:1.15;color:#0f172a}",
      "#wplSectionMobileFix p{margin:4px 0 0;color:#475569;font-size:13px;line-height:1.25}",
      "#wplSectionMobileFix .wpl-mobile-header{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;margin-bottom:12px}",
      "#wplSectionMobileFix .wpl-mobile-list{display:grid;gap:10px;max-height:52vh;overflow:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px}",
      "#wplSectionMobileFix .wpl-mobile-row{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center;padding:10px;border:1px solid rgba(15,23,42,.12);border-radius:14px;background:#f8fafc}",
      "#wplSectionMobileFix .wpl-mobile-number{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#0f172a;color:#fff;font-size:13px;font-weight:800}",
      "#wplSectionMobileFix input{grid-column:2;width:100%;min-height:46px;border:1px solid rgba(15,23,42,.24);border-radius:12px;background:#fff;color:#0f172a;font-size:16px!important;line-height:1.2;padding:10px 12px;-webkit-user-select:text;user-select:text;outline:none;appearance:none;-webkit-appearance:none}",
      "#wplSectionMobileFix input:focus{border-color:#0d6b4a;box-shadow:0 0 0 3px rgba(13,107,74,.18)}",
      "#wplSectionMobileFix .wpl-mobile-actions{grid-column:1 / -1;display:flex;gap:8px;flex-wrap:wrap;margin-top:2px}",
      "#wplSectionMobileFix button{min-height:40px;border:1px solid rgba(15,23,42,.18);border-radius:12px;background:#fff;color:#0f172a;font-size:14px;font-weight:700;padding:8px 10px;cursor:pointer;appearance:none;-webkit-appearance:none}",
      "#wplSectionMobileFix button.primary{background:#0d6b4a;color:#fff;border-color:#0d6b4a}",
      "#wplSectionMobileFix button:disabled{opacity:.45}",
      "#wplSectionMobileFix .wpl-mobile-footer{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}",
      "#wplSectionMobileFix .wpl-mobile-status{font-size:13px;color:#475569;font-weight:700}",
      "body.wpl-section-editor-open #wplSectionMobileFix{position:fixed;left:0;right:0;top:env(safe-area-inset-top,0);max-height:calc(100vh - env(safe-area-inset-top,0) - 10px);overflow:auto}",
      "#wplSectionFloatingBtn{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0));z-index:2147483646;border:0;border-radius:999px;background:#0d6b4a;color:#fff;font-weight:900;padding:13px 16px;box-shadow:0 12px 32px rgba(15,23,42,.32);font-size:14px;pointer-events:auto}",
      "@media(max-width:720px){#wplSectionMobileFix{margin:8px;border-radius:16px}#wplSectionMobileFix .wpl-mobile-header{flex-direction:column}#wplSectionMobileFix button{font-size:14px}body.wpl-section-editor-open{overflow:hidden}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function slug(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 42) || "section";
  }

  function escapeAttr(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function normalizeCategories(list) {
    var source = Array.isArray(list) && list.length ? list : DEFAULT_CATEGORIES;
    var used = {};
    return source.map(function (item, index) {
      var name = String((item && (item.name || item.label)) || (DEFAULT_CATEGORIES[index] && DEFAULT_CATEGORIES[index].name) || ("Section " + (index + 1))).trim();
      var base = slug((item && item.id) || name || ("section_" + (index + 1)));
      var id = base;
      var n = 2;
      while (used[id]) { id = base + "_" + n; n += 1; }
      used[id] = true;
      return { id: id, name: name || ("Section " + (index + 1)) };
    });
  }

  function getCategories() {
    var categories = normalizeCategories(readJson(CATEGORIES_KEY, []));
    var names = readJson(CATEGORY_NAMES_KEY, {});
    if (names && typeof names === "object") {
      categories = categories.map(function (category) {
        var custom = String(names[category.id] || "").trim();
        return custom ? { id: category.id, name: custom } : category;
      });
    }
    return categories;
  }

  function saveCategories(categories) {
    var normalized = normalizeCategories(categories);
    var names = {};
    normalized.forEach(function (category) { names[category.id] = category.name; });
    writeJson(CATEGORIES_KEY, normalized);
    writeJson(CATEGORY_NAMES_KEY, names);
    try { window.dispatchEvent(new CustomEvent("wpl:planner-sections-updated", { detail: { categories: normalized } })); } catch (_) {}
    try { window.dispatchEvent(new StorageEvent("storage", { key: CATEGORIES_KEY, newValue: JSON.stringify(normalized) })); } catch (_) {}
    return normalized;
  }

  function collect() {
    return Array.prototype.slice.call(document.querySelectorAll("#wplSectionMobileFix [data-section-id]")).map(function (row, index) {
      var id = row.getAttribute("data-section-id") || ("section_" + (index + 1));
      var input = row.querySelector("input[data-section-name]");
      var name = String(input && input.value || "").trim() || ("Section " + (index + 1));
      return { id: id, name: name };
    });
  }

  function setStatus(text) {
    var status = document.querySelector("#wplSectionMobileFix [data-status]");
    if (status) status.textContent = text || "";
  }

  function buildEditor() {
    injectStyle();
    var old = document.getElementById("wplSectionEditorFix");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var editor = document.getElementById("wplSectionMobileFix");
    if (!editor) {
      editor = document.createElement("section");
      editor.id = "wplSectionMobileFix";
      var target = document.getElementById("appRoot") || document.body;
      if (target && target.firstChild) target.insertBefore(editor, target.firstChild);
      else document.body.insertBefore(editor, document.body.firstChild);
    }

    var categories = getCategories();
    editor.innerHTML = [
      '<div class="wpl-mobile-header">',
      '<div><h3>Edit Wrestling Plan Sections</h3><p>Tap a name to edit. Use Up/Down to reorder. This editor is placed above other panels so the keyboard can open.</p></div>',
      '<button type="button" data-action="toggle">Mobile Focus Mode</button>',
      '</div>',
      '<div class="wpl-mobile-list">',
      categories.map(function (category, index) {
        return [
          '<div class="wpl-mobile-row" data-section-id="' + escapeAttr(category.id) + '">',
          '<span class="wpl-mobile-number">' + (index + 1) + '</span>',
          '<input data-section-name type="text" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" value="' + escapeAttr(category.name) + '">',
          '<div class="wpl-mobile-actions">',
          '<button type="button" data-action="up" ' + (index === 0 ? 'disabled' : '') + '>Up</button>',
          '<button type="button" data-action="down" ' + (index === categories.length - 1 ? 'disabled' : '') + '>Down</button>',
          '<button type="button" data-action="delete">Delete</button>',
          '</div>',
          '</div>'
        ].join('');
      }).join(''),
      '</div>',
      '<div class="wpl-mobile-footer">',
      '<button type="button" class="primary" data-action="save">Save</button>',
      '<button type="button" data-action="add">Add Section</button>',
      '<button type="button" data-action="reset">Reset</button>',
      '<button type="button" data-action="reload">Reload</button>',
      '<span class="wpl-mobile-status" data-status></span>',
      '</div>'
    ].join('');

    ensureFloatingButton();
  }

  function ensureFloatingButton() {
    if (document.getElementById("wplSectionFloatingBtn")) return;
    var btn = document.createElement("button");
    btn.id = "wplSectionFloatingBtn";
    btn.type = "button";
    btn.textContent = "Edit Sections";
    btn.addEventListener("click", function () {
      buildEditor();
      document.body.classList.add("wpl-section-editor-open");
      var input = document.querySelector("#wplSectionMobileFix input");
      if (input) setTimeout(function () { input.focus(); }, 80);
    });
    document.body.appendChild(btn);
  }

  document.addEventListener("pointerdown", function (event) {
    var input = event.target && event.target.closest && event.target.closest("#wplSectionMobileFix input[data-section-name]");
    if (!input) return;
    input.style.pointerEvents = "auto";
    setTimeout(function () {
      input.focus();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
    }, 30);
  }, true);

  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest && event.target.closest("#wplSectionMobileFix [data-action]");
    if (!button) return;
    var action = button.getAttribute("data-action");
    var categories = collect();
    var row = button.closest("[data-section-id]");
    var rows = Array.prototype.slice.call(document.querySelectorAll("#wplSectionMobileFix [data-section-id]"));
    var index = row ? rows.indexOf(row) : -1;

    if (action === "toggle") { document.body.classList.toggle("wpl-section-editor-open"); setStatus(document.body.classList.contains("wpl-section-editor-open") ? "Focus mode on." : "Focus mode off."); return; }
    if (action === "up" && index > 0) { var itemUp = categories.splice(index, 1)[0]; categories.splice(index - 1, 0, itemUp); saveCategories(categories); buildEditor(); setStatus("Moved up and saved."); return; }
    if (action === "down" && index >= 0 && index < categories.length - 1) { var itemDown = categories.splice(index, 1)[0]; categories.splice(index + 1, 0, itemDown); saveCategories(categories); buildEditor(); setStatus("Moved down and saved."); return; }
    if (action === "delete" && index >= 0) { categories.splice(index, 1); saveCategories(categories); buildEditor(); setStatus("Deleted and saved."); return; }
    if (action === "add") { categories.push({ id: "section_" + Date.now(), name: "New Section" }); saveCategories(categories); buildEditor(); setStatus("Added. Tap the name to edit."); var inputs = document.querySelectorAll("#wplSectionMobileFix input"); var last = inputs[inputs.length - 1]; if (last) setTimeout(function () { last.focus(); last.select(); }, 80); return; }
    if (action === "reset") { saveCategories(DEFAULT_CATEGORIES); buildEditor(); setStatus("Reset and saved."); return; }
    if (action === "save") { saveCategories(categories); setStatus("Saved."); return; }
    if (action === "reload") { window.location.reload(); return; }
  }, true);

  document.addEventListener("input", function (event) {
    if (!event.target || !event.target.matches("#wplSectionMobileFix input[data-section-name]")) return;
    saveCategories(collect());
    setStatus("Saved locally.");
  }, true);

  function boot() {
    buildEditor();
    setTimeout(buildEditor, 800);
    setTimeout(buildEditor, 1800);
    setTimeout(buildEditor, 3000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}());
