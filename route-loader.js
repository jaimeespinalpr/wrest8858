(function loadWplRoute() {
  var routeName = String(window.WPL_ROUTE_TAB || "").trim();
  if (!routeName) {
    var parts = window.location.pathname.split("/").filter(Boolean);
    routeName = parts[parts.length - 1] || "today";
    window.WPL_ROUTE_TAB = routeName;
  }

  window.WPL_ROUTED_BOOTSTRAP = true;

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
    if (index >= scripts.length) return;
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
