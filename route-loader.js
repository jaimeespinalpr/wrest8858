(function loadWplRoute() {
  var routeName = String(window.WPL_ROUTE_TAB || "").trim();
  if (!routeName) {
    var parts = window.location.pathname.split("/").filter(Boolean);
    routeName = parts[parts.length - 1] || "today";
    window.WPL_ROUTE_TAB = routeName;
  }

  window.WPL_ROUTED_BOOTSTRAP = true;

  var ROUTE_PANEL_MAP = {
    today: ["panel-today"],
    profile: ["panel-athlete-profile"],
    training: ["panel-training", "panel-plans", "panel-assignments"],
    calendar: ["panel-calendar", "panel-calendar-manager"],
    media: ["panel-media"],
    journal: ["panel-journal", "panel-journal-monitor"],
    favorites: ["panel-favorites"],
    announcements: ["panel-announcements"],
    competition: ["panel-competition-preview", "panel-coach-match"],
    tournament: ["panel-tournament-view", "panel-competition-preview"],
    parent: ["panel-parent-home"],
    scouting: ["panel-parent-scouting"],
    home: ["panel-dashboard", "panel-coach-profile", "panel-parent-home", "panel-today"],
    athletes: ["panel-athletes", "panel-coach-match", "panel-journal-monitor", "panel-athlete-notes"],
    plans: ["panel-plans", "panel-coach-plans", "panel-assignments", "panel-completion-tracking", "panel-training"],
    messages: ["panel-messages"],
    "coach-profile": ["panel-coach-profile"],
    permissions: ["panel-permissions"]
  };

  function getAppRootUrl() {
    try {
      return new URL("../", window.location.href).href;
    } catch {
      return "../";
    }
  }

  function resolveAppAssetUrl(rawValue) {
    var raw = String(rawValue || "").trim();
    if (!raw) return raw;
    try {
      return new URL(raw, getAppRootUrl()).href;
    } catch {
      return raw;
    }
  }

  function runScripts(scripts, index) {
    if (index >= scripts.length) {
      pruneRoutePanels(document);
      return;
    }
    var original = scripts[index];
    var script = document.createElement("script");
    Array.prototype.forEach.call(original.attributes || [], function(attr) {
      if (attr.name !== "src") script.setAttribute(attr.name, attr.value);
    });
    script.onload = function() { runScripts(scripts, index + 1); };
    script.onerror = function() {
      console.warn("WPL route script failed to load", original.getAttribute("src") || "inline-script");
      runScripts(scripts, index + 1);
    };
    if (original.src || original.getAttribute("src")) {
      script.src = resolveAppAssetUrl(original.getAttribute("src") || original.src);
      document.head.appendChild(script);
      return;
    }
    script.textContent = original.textContent || "";
    document.head.appendChild(script);
    runScripts(scripts, index + 1);
  }

  function normalizeHeadAssetUrls(doc) {
    Array.prototype.forEach.call(doc.querySelectorAll("link[href]"), function(link) {
      var href = link.getAttribute("href");
      if (!href || /^(?:https?:|data:|mailto:|tel:|#)/i.test(href)) return;
      link.setAttribute("href", resolveAppAssetUrl(href));
    });
  }

  function pruneRoutePanels(doc) {
    var keepList = ROUTE_PANEL_MAP[routeName] || [];
    if (!keepList.length) return;
    var keep = new Set(keepList);
    var removed = 0;
    Array.prototype.forEach.call(doc.querySelectorAll(".panel[id]"), function(panel) {
      if (keep.has(panel.id)) return;
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
        removed += 1;
      }
    });
    window.WPL_ROUTED_PANEL_PRUNING = true;
    window.WPL_ROUTE_PRESERVED_PANELS = keepList.slice();
    window.WPL_ROUTE_REMOVED_PANEL_COUNT = removed;
  }

  fetch(resolveAppAssetUrl("index.html"), { cache: "no-store" })
    .then(function(response) {
      if (!response.ok) throw new Error("route_index_fetch_failed");
      return response.text();
    })
    .then(function(html) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, "text/html");
      var base = doc.createElement("base");
      base.setAttribute("href", getAppRootUrl());
      doc.head.insertBefore(base, doc.head.firstChild);
      normalizeHeadAssetUrls(doc);
      document.title = doc.title || document.title;
      document.head.innerHTML = doc.head.innerHTML;
      document.body.innerHTML = doc.body.innerHTML;
      var scripts = Array.prototype.slice.call(document.querySelectorAll("script"));
      scripts.forEach(function(script) {
        if (script.parentNode) script.parentNode.removeChild(script);
      });
      runScripts(scripts, 0);
    })
    .catch(function(error) {
      console.error(error);
      window.location.replace(resolveAppAssetUrl("index.html?openTab=" + encodeURIComponent(routeName)));
    });
}());
