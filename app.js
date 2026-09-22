(function forceWplEnglishUi() {
  "use strict";

  var ENGLISH_KEYS = [
    "lang",
    "language",
    "currentLang",
    "preferredLang",
    "preferredLanguage",
    "locale"
  ];

  var TEXT_MAP = {
    "Iniciar sesión": "Log in",
    "Inicia sesión": "Log in",
    "Crear cuenta": "Create account",
    "Crear una cuenta": "Create an account",
    "Cerrar": "Close",
    "Cancelar": "Cancel",
    "Guardar": "Save",
    "Guardar cambios": "Save changes",
    "Eliminar": "Delete",
    "Quitar": "Remove",
    "Cambiar": "Change",
    "Personalizar": "Customize",
    "Libreria": "Library",
    "Biblioteca": "Library",
    "Agregar": "Add",
    "Agregar +": "Add +",
    "+ Agregar seccion": "+ Add section",
    "Nueva seccion": "New Section",
    "Nombre del ejercicio": "Exercise name",
    "Nombre de categoria nueva": "New category name",
    "Buscar movimiento": "Search movement",
    "Plan guardado": "Plan saved",
    "Plan cargado": "Plan loaded",
    "Planificador de Entrenamiento de Lucha": "Wrestling Training Planner",
    "Crea y asigna planes de practica de lucha.": "Build and assign wrestling practice plans.",
    "Entrenamiento de Lucha": "Wrestling Training",
    "Lifting y Conditioning": "Lifting & Conditioning",
    "Entrenamiento Mental y Enfoque": "Mind & Focus Training",
    "Lista y anuncios": "Roll Call and Announcements",
    "Calentamiento": "Warm Up",
    "Introduccion de nuevas tecnicas o ejercicios": "Introduction of New Techniques or drills",
    "Lucha en vivo (ejercicios de alto ritmo)": "Live wrestling (High pace drills)",
    "Actividades de fuerza y habilidad": "Strength and Skill Based Activities",
    "Vuelta a la calma, cierre y visualizacion": "Cool Down Closing and Visualization",
    "Anuncios": "Announcements",
    "Actividad": "Activity",
    "Tiempo": "Time",
    "Elige ejercicio guardado...": "Choose saved drill...",
    "Escribe el ejercicio aqui...": "Type drill here...",
    "Entrenador": "Coach",
    "Atleta": "Athlete",
    "Padre/Madre": "Parent",
    "Seleccionar todo": "Select all",
    "Limpiar": "Clear",
    "Compartir plan": "Share plan",
    "Guardar plan": "Save plan",
    "Abrir planes guardados": "Open saved plans",
    "Imprimir": "Print",
    "Cargando planes guardados...": "Loading saved plans...",
    "Cargando librerias de entrenadores...": "Loading coach libraries...",
    "Entrenamiento y tareas por hacer": "Training and Tasks to Do",
    "Vista de solo lectura para atletas.": "Athlete read-only view of coach plans.",
    "Modo solo lectura: el atleta solo puede ver los planes del entrenador.": "Read-only mode: athlete can view coach plans only.",
    "Seccion agregada.": "Section added.",
    "Seccion eliminada.": "Section removed.",
    "Ejercicio agregado.": "Exercise added.",
    "Ejercicio guardado en la libreria.": "Exercise saved to library.",
    "Ejercicio ya existe en esta categoria.": "Exercise already exists in this category.",
    "Ese ejercicio ya existe en esta categoria.": "Exercise already exists in this category.",
    "Escribe primero el nombre del ejercicio.": "Write an exercise name first.",
    "Agregado al plan actual.": "Added to current plan.",
    "Catalogo compartido del planificador cargado.": "Shared planner catalog loaded.",
    "Catalogo compartido del planificador sincronizado.": "Shared planner catalog synced."
  };

  var PLACEHOLDER_MAP = {
    "Escribe el ejercicio aqui...": "Type drill here...",
    "Nombre del ejercicio": "Exercise name",
    "Nombre de categoria nueva": "New category name",
    "Buscar movimiento": "Search movement",
    "Escribe nombre de atleta o entrenador": "Type athlete or coach name",
    "Agregar nuevo movimiento/ejercicio": "Add new movement/exercise",
    "Nombre del plan": "Plan name",
    "Numero de semanas": "Number of weeks",
    "Objetivo principal": "Primary objective",
    "Notas o beneficios esperados": "Notes or expected benefits",
    "Nombre del dia": "Day Name"
  };

  function forceLanguageFields(value) {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      value.forEach(forceLanguageFields);
      return value;
    }
    Object.keys(value).forEach(function(key) {
      var lower = String(key || "").toLowerCase();
      if (ENGLISH_KEYS.some(function(token) { return lower === token.toLowerCase(); })) {
        value[key] = "en";
      } else if (value[key] && typeof value[key] === "object") {
        forceLanguageFields(value[key]);
      }
    });
    return value;
  }

  function forceLocalStorageEnglish() {
    try {
      localStorage.setItem("wpl_force_english_ui", "1");
      localStorage.setItem("wpl_language", "en");
      localStorage.setItem("currentLang", "en");
      localStorage.setItem("preferredLang", "en");
      localStorage.setItem("preferredLanguage", "en");

      Object.keys(localStorage).forEach(function(key) {
        var lowerKey = String(key || "").toLowerCase();
        var raw = localStorage.getItem(key);
        if (!raw) return;
        if (lowerKey.includes("lang") || lowerKey.includes("language") || lowerKey.includes("locale")) {
          localStorage.setItem(key, "en");
          return;
        }
        if (!/("lang"|"language"|"preferredLang"|"preferredLanguage"|"locale")/.test(raw)) return;
        try {
          var parsed = JSON.parse(raw);
          forceLanguageFields(parsed);
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch (err) {
          // Non-JSON values are ignored.
        }
      });
    } catch (err) {
      // localStorage can be unavailable in private modes.
    }
  }

  function forceGlobalsEnglish() {
    window.WPL_FORCE_ENGLISH_UI = true;
    window.WPL_DEFAULT_LANGUAGE = "en";
    window.WPL_ROUTE_LANG = "en";
    window.currentLang = "en";
    document.documentElement.setAttribute("lang", "en");
  }

  function replaceTextNode(node) {
    var original = String(node.nodeValue || "");
    var trimmed = original.trim();
    if (!trimmed) return;
    var direct = TEXT_MAP[trimmed];
    if (direct) {
      node.nodeValue = original.replace(trimmed, direct);
      return;
    }
    var next = original;
    Object.keys(TEXT_MAP).forEach(function(spanish) {
      if (next.includes(spanish)) {
        next = next.split(spanish).join(TEXT_MAP[spanish]);
      }
    });
    if (next !== original) node.nodeValue = next;
  }

  function translateAttributes(root) {
    var scope = root && root.querySelectorAll ? root : document;
    Array.prototype.forEach.call(scope.querySelectorAll("input, textarea, button, option, [title], [aria-label]"), function(node) {
      if (node.placeholder && PLACEHOLDER_MAP[node.placeholder]) {
        node.placeholder = PLACEHOLDER_MAP[node.placeholder];
      }
      if (node.title && TEXT_MAP[node.title]) {
        node.title = TEXT_MAP[node.title];
      }
      var aria = node.getAttribute && node.getAttribute("aria-label");
      if (aria && TEXT_MAP[aria]) {
        node.setAttribute("aria-label", TEXT_MAP[aria]);
      }
    });
  }

  function translateVisibleText(root) {
    var scope = root || document.body;
    if (!scope) return;
    translateAttributes(scope);
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        var parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = String(parent.nodeName || "").toLowerCase();
        if (["script", "style", "noscript"].includes(tag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }

  function runEnglishPass() {
    forceLocalStorageEnglish();
    forceGlobalsEnglish();
    translateVisibleText(document.body);
    try {
      window.dispatchEvent(new CustomEvent("wpl:language-changed", { detail: { lang: "en", forced: true } }));
    } catch (err) {
      // Older browsers can ignore the event.
    }
  }

  forceLocalStorageEnglish();
  forceGlobalsEnglish();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runEnglishPass, { once: true });
  } else {
    runEnglishPass();
  }

  var observer = new MutationObserver(function(mutations) {
    var shouldRun = mutations.some(function(mutation) {
      return mutation.type === "childList" && mutation.addedNodes && mutation.addedNodes.length;
    });
    if (shouldRun) {
      window.requestAnimationFrame(function() {
        forceGlobalsEnglish();
        translateVisibleText(document.body);
      });
    }
  });

  try {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch (err) {
    // Ignore observer failures.
  }

  window.setInterval(function() {
    forceLocalStorageEnglish();
    forceGlobalsEnglish();
  }, 2500);
}());
