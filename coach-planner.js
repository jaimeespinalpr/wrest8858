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
  const BASE_WRESTLING_CATEGORIES = CATEGORIES.map((category) => ({ ...category }));
  const SHARED_WRESTLING_PLANNER_DOC_ID = "uwc_wrestling_planner_catalog";

  const CATEGORY_NAME_TRANSLATIONS = {
    roll_call: { en: "Roll Call and Announcements", es: "Lista y anuncios" },
    warm_up: { en: "Warm Up", es: "Calentamiento" },
    techniques: { en: "Introduction of New Techniques or drills", es: "Introduccion de nuevas tecnicas o ejercicios" },
    live_wrestling: { en: "Live wrestling (High pace drills)", es: "Lucha en vivo (ejercicios de alto ritmo)" },
    strength: { en: "Strength and Skill Based Activities", es: "Actividades de fuerza y habilidad" },
    cool_down: { en: "Cool Down Closing and Visualization", es: "Vuelta a la calma, cierre y visualizacion" },
    announcements: { en: "Announcements", es: "Anuncios" }
  };

  let runtimeWrestlingCategories = BASE_WRESTLING_CATEGORIES.map((category) => ({ ...category }));

  function slugifyPlannerCategoryId(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    return raw
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 42);
  }

  function makeUniquePlannerCategoryId(seed, used = new Set()) {
    const base = slugifyPlannerCategoryId(seed) || "section";
    let next = base;
    let suffix = 2;
    while (used.has(next)) {
      next = `${base}_${suffix}`;
      suffix += 1;
    }
    return next;
  }

  function normalizePlannerCategoryCollection(value = []) {
    const source = Array.isArray(value) ? value : [];
    const used = new Set();
    const normalized = [];
    source.forEach((entry, index) => {
      const safeEntry = entry && typeof entry === "object" ? entry : {};
      const fallbackName = String(BASE_WRESTLING_CATEGORIES[index]?.name || "").trim() || `Section ${index + 1}`;
      const name = String(safeEntry.name || safeEntry.label || fallbackName).trim() || fallbackName;
      const seed = String(safeEntry.id || name || `section_${index + 1}`).trim();
      const id = makeUniquePlannerCategoryId(seed, used);
      used.add(id);
      normalized.push({ id, name });
    });
    if (normalized.length) return normalized;
    return BASE_WRESTLING_CATEGORIES.map((category) => ({ ...category }));
  }

  function mergePlannerCategoryCollections(...sources) {
    const merged = [];
    const seenIds = new Set();
    sources.forEach((source) => {
      const rawList = Array.isArray(source) ? source : [];
      if (!rawList.length) return;
      normalizePlannerCategoryCollection(rawList).forEach((category) => {
        const id = String(category?.id || "").trim();
        if (!id || seenIds.has(id)) return;
        seenIds.add(id);
        merged.push({
          id,
          name: String(category?.name || "").trim() || id
        });
      });
    });
    return normalizePlannerCategoryCollection(merged);
  }

  const INITIAL_LIBRARY = [];

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
    "Explosives / Power": [],
    Legs: [],
    "Push (Upper Body)": [],
    "Pull (Upper Body)": [],
    "Plyometrics / Bodyweight": [],
    Accessories: []
  };

  const MENTAL_GAME_KEYS = {
    GO_NO_GO: "go_no_go",
    MEMORY: "memory_sequence",
    DECISION: "quick_decision",
    SCORE: "score_awareness",
    SWITCH: "rule_switch"
  };

  const MENTAL_GAME_META = {
    [MENTAL_GAME_KEYS.GO_NO_GO]: {
      title: "Go / No-Go",
      titleEs: "Go / No-Go",
      subtitle: "Reflejos + control de impulsos",
      subtitleEs: "Reflejos + control de impulsos",
      ruleBrief: "Tap GREEN only. Ignore RED.",
      ruleBriefEs: "Toca solo VERDE. Ignora ROJO.",
      duration: 30,
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(20, 184, 166, 0.92))",
      cue: "Tap GREEN. Do not tap RED.",
      cueEs: "Toca VERDE. No toques ROJO."
    },
    [MENTAL_GAME_KEYS.MEMORY]: {
      title: "Memory Sequence",
      titleEs: "Secuencia de Memoria",
      subtitle: "Memoria de trabajo y enfoque",
      subtitleEs: "Memoria de trabajo y enfoque",
      ruleBrief: "Watch the sequence, then repeat in exact order.",
      ruleBriefEs: "Mira la secuencia y repitela en el mismo orden.",
      duration: 60,
      gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(217, 70, 239, 0.92))",
      cue: "Memorize, then repeat in order.",
      cueEs: "Memoriza y luego repite en orden."
    },
    [MENTAL_GAME_KEYS.DECISION]: {
      title: "Quick Decision",
      titleEs: "Decision Rapida",
      subtitle: "Decisiones tacticas bajo presion",
      subtitleEs: "Decisiones tacticas bajo presion",
      ruleBrief: "Read fast and choose the best tactical option.",
      ruleBriefEs: "Lee rapido y elige la mejor opcion tactica.",
      duration: 45,
      gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(249, 115, 22, 0.92))",
      cue: "Choose the best option quickly.",
      cueEs: "Elige la mejor opcion con rapidez."
    },
    [MENTAL_GAME_KEYS.SCORE]: {
      title: "Score Awareness",
      titleEs: "Lectura de Puntuacion",
      subtitle: "Lectura de score en tiempo real",
      subtitleEs: "Lectura de score en tiempo real",
      ruleBrief: "Track each scoring action and identify who leads.",
      ruleBriefEs: "Sigue cada accion de puntuacion e identifica quien va ganando.",
      duration: 45,
      gradient: "linear-gradient(135deg, rgba(14, 165, 233, 0.95), rgba(59, 130, 246, 0.92))",
      cue: "Track every point sequence.",
      cueEs: "Sigue cada secuencia de puntos."
    },
    [MENTAL_GAME_KEYS.SWITCH]: {
      title: "Rule Switch",
      titleEs: "Cambio de Regla",
      subtitle: "Adaptacion mental instantanea",
      subtitleEs: "Adaptacion mental instantanea",
      ruleBrief: "Follow the active rule and adapt on every switch.",
      ruleBriefEs: "Sigue la regla activa y adaptate en cada cambio.",
      duration: 40,
      gradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.95), rgba(236, 72, 153, 0.92))",
      cue: "Read the rule before tapping.",
      cueEs: "Lee la regla antes de tocar."
    }
  };
  const GLOBAL_MENTAL_LEADERBOARD_LIMIT = 10;

  const MENTAL_COLORS = [
    { key: "red", name: "Red", nameEs: "Rojo" },
    { key: "blue", name: "Blue", nameEs: "Azul" },
    { key: "green", name: "Green", nameEs: "Verde" },
    { key: "yellow", name: "Yellow", nameEs: "Amarillo" }
  ];
  const MEMORY_SEQUENCE_SHOW_MS = 5000;
  const MEMORY_SEQUENCE_RESPONSE_MS = 10000;
  const MEMORY_SEQUENCE_WRONG_FEEDBACK_MS = 1100;
  const MEMORY_SEQUENCE_CORRECT_FEEDBACK_MS = 650;

  const MENTAL_DECISION_SCENARIOS = [
    {
      prompt: "You are losing by 1 with 15 seconds left in neutral.",
      options: ["Attack a clean single", "Back away", "Hold center only", "Force a big throw"],
      answer: "Attack a clean single",
      promptEs: "Vas perdiendo por 1 con 15 segundos en neutral.",
      optionsEs: ["Ataca un single limpio", "Alejate", "Solo controla el centro", "Fuerza un lanzamiento grande"],
      answerEs: "Ataca un single limpio"
    },
    {
      prompt: "You are up by 2 with 12 seconds left and your opponent is pressing.",
      options: ["Take a risky shot", "Control position and circle", "Jump to upper body", "Stay flat-footed"],
      answer: "Control position and circle",
      promptEs: "Vas ganando por 2 con 12 segundos y tu oponente esta presionando.",
      optionsEs: ["Haz un ataque arriesgado", "Controla posicion y circula", "Salta a upper body", "Quedate plano"],
      answerEs: "Controla posicion y circula"
    },
    {
      prompt: "Opponent is heavy on the head and leaning forward.",
      options: ["Snap and go behind", "Stand straight up", "Reach from too far", "Pause and wait"],
      answer: "Snap and go behind",
      promptEs: "El oponente carga la cabeza y se inclina hacia adelante.",
      optionsEs: ["Haz snap y pasa atras", "Parate recto", "Alcanza desde muy lejos", "Pausa y espera"],
      answerEs: "Haz snap y pasa atras"
    },
    {
      prompt: "Bottom position, tied late in the match.",
      options: ["Secure a fast stand-up", "Lay flat", "Try a slow roll", "Look at the clock only"],
      answer: "Secure a fast stand-up",
      promptEs: "Posicion abajo, empate al final del combate.",
      optionsEs: ["Asegura un stand-up rapido", "Quedate plano", "Intenta un giro lento", "Mira solo el reloj"],
      answerEs: "Asegura un stand-up rapido"
    }
  ];

  const MENTAL_SCORE_EVENTS = [
    { text: "Red takedown", textEs: "Rojo derribo", delta: { red: 3, green: 0 } },
    { text: "Green escape", textEs: "Verde escape", delta: { red: 0, green: 1 } },
    { text: "Red stall point", textEs: "Rojo punto por pasividad", delta: { red: 1, green: 0 } },
    { text: "Green reversal", textEs: "Verde reversa", delta: { red: 0, green: 2 } },
    { text: "Red escape", textEs: "Rojo escape", delta: { red: 1, green: 0 } },
    { text: "Green takedown", textEs: "Verde derribo", delta: { red: 0, green: 3 } },
    { text: "Red reversal", textEs: "Rojo reversa", delta: { red: 2, green: 0 } }
  ];

  const MENTAL_SWITCH_RULES = [
    {
      id: "higher",
      label: "Tap the higher number",
      labelEs: "Toca el numero mas alto",
      evaluate: (a, b) => (a > b ? "left" : "right")
    },
    {
      id: "lower",
      label: "Tap the lower number",
      labelEs: "Toca el numero mas bajo",
      evaluate: (a, b) => (a < b ? "left" : "right")
    },
    {
      id: "even",
      label: "Tap the even number",
      labelEs: "Toca el numero par",
      evaluate: (a, b) => (a % 2 === 0 ? "left" : "right")
    }
  ];

  function getLocalizedMentalMeta(gameKey) {
    const base = MENTAL_GAME_META[gameKey] || MENTAL_GAME_META[MENTAL_GAME_KEYS.GO_NO_GO] || {};
    const isSpanish = getPlannerLang() === "es";
    return {
      ...base,
      title: isSpanish ? (base.titleEs || base.title || "") : (base.title || base.titleEs || ""),
      subtitle: isSpanish ? (base.subtitleEs || base.subtitle || "") : (base.subtitle || base.subtitleEs || ""),
      ruleBrief: isSpanish ? (base.ruleBriefEs || base.ruleBrief || "") : (base.ruleBrief || base.ruleBriefEs || ""),
      cue: isSpanish ? (base.cueEs || base.cue || "") : (base.cue || base.cueEs || "")
    };
  }

  function getMentalColorLabel(name) {
    const color = MENTAL_COLORS.find((entry) => String(entry.name || "").toLowerCase() === String(name || "").toLowerCase());
    if (!color) return String(name || "");
    return getPlannerLang() === "es" ? String(color.nameEs || color.name || "") : String(color.name || color.nameEs || "");
  }

  function getMentalColorMeta(name) {
    return MENTAL_COLORS.find((entry) => String(entry.name || "").toLowerCase() === String(name || "").toLowerCase()) || null;
  }

  function getMentalColorSurfaceStyle(name, { placeholder = false } = {}) {
    const colorKey = String(getMentalColorMeta(name)?.key || "").trim();
    if (!colorKey || placeholder) {
      return "background: rgba(18, 33, 59, 0.82); color: #cbd5e1; border-color: rgba(126, 156, 207, 0.32);";
    }
    if (colorKey === "red") return "background: #ef4444; color: #fff7f7; border-color: rgba(254, 202, 202, 0.55);";
    if (colorKey === "blue") return "background: #3b82f6; color: #eff6ff; border-color: rgba(191, 219, 254, 0.55);";
    if (colorKey === "green") return "background: #22c55e; color: #f0fdf4; border-color: rgba(187, 247, 208, 0.55);";
    if (colorKey === "yellow") return "background: #facc15; color: #1e293b; border-color: rgba(254, 240, 138, 0.65);";
    return "background: rgba(18, 33, 59, 0.82); color: #e2e8f0; border-color: rgba(126, 156, 207, 0.32);";
  }

  function getMentalPhaseSecondsLeft(session) {
    const endsAt = Number(session?.roundPhaseEndsAt || 0);
    if (!Number.isFinite(endsAt) || endsAt <= 0) return 0;
    return Math.max(0, Math.ceil((endsAt - performance.now()) / 1000));
  }

  function getLocalizedDecisionScenario(scenario = {}) {
    const isSpanish = getPlannerLang() === "es";
    if (!isSpanish) {
      return {
        prompt: String(scenario.prompt || "").trim(),
        options: Array.isArray(scenario.options) ? scenario.options.map((item) => String(item || "").trim()).filter(Boolean) : [],
        answer: String(scenario.answer || "").trim()
      };
    }
    const options = Array.isArray(scenario.optionsEs)
      ? scenario.optionsEs.map((item) => String(item || "").trim()).filter(Boolean)
      : (Array.isArray(scenario.options) ? scenario.options.map((item) => String(item || "").trim()).filter(Boolean) : []);
    return {
      prompt: String(scenario.promptEs || scenario.prompt || "").trim(),
      options,
      answer: String(scenario.answerEs || scenario.answer || "").trim()
    };
  }

  function getLocalizedScoreEvent(baseEvent = {}) {
    const isSpanish = getPlannerLang() === "es";
    return {
      ...baseEvent,
      text: String((isSpanish ? baseEvent.textEs : baseEvent.text) || baseEvent.text || baseEvent.textEs || "").trim()
    };
  }

  function getMentalRuleLabel(rule = {}) {
    const isSpanish = getPlannerLang() === "es";
    return String((isSpanish ? rule.labelEs : rule.label) || rule.label || rule.labelEs || "").trim();
  }

  function getMentalRoleLabel(role) {
    const safeRole = normalizeMentalLeaderboardRole(role);
    if (safeRole === "coach" || safeRole === "admin") return tr({ en: "Coach", es: "Entrenador" });
    if (safeRole === "parent") return tr({ en: "Parent", es: "Padre/Madre" });
    return tr({ en: "Athlete", es: "Atleta" });
  }

  function getMentalScoreLeadLabel(color, margin) {
    const safeMargin = Math.max(1, parseInt(String(margin || 1), 10) || 1);
    const safeColor = String(color || "red").toLowerCase() === "green" ? "green" : "red";
    return tr({
      en: `${safeColor === "red" ? "Red" : "Green"} by ${safeMargin}`,
      es: `${safeColor === "red" ? "Rojo" : "Verde"} por ${safeMargin}`
    });
  }

  function getMentalScoreTiedLabel() {
    return tr({ en: "Tied", es: "Empate" });
  }

  function getMentalScoreExactLabel(red, green) {
    const safeRed = Math.max(0, parseInt(String(red || 0), 10) || 0);
    const safeGreen = Math.max(0, parseInt(String(green || 0), 10) || 0);
    return tr({
      en: `Red ${safeRed} - Green ${safeGreen}`,
      es: `Rojo ${safeRed} - Verde ${safeGreen}`
    });
  }

  function buildDefaultMentalScores() {
    return {
      totalSessions: 0,
      totalMentalScore: 0,
      bestMentalScore: 0,
      lastPlayed: null,
      gameStats: {}
    };
  }

  function buildDefaultMentalLeaderboard() {
    const entries = {};
    Object.keys(MENTAL_GAME_META).forEach((gameKey) => {
      entries[gameKey] = [];
    });
    return entries;
  }

  function normalizeMentalScoreValue(raw = {}) {
    const defaults = buildDefaultMentalScores();
    const source = raw && typeof raw === "object" ? raw : {};
    const gameStatsRaw = source.gameStats && typeof source.gameStats === "object" ? source.gameStats : {};
    const gameStats = {};
    Object.keys(MENTAL_GAME_META).forEach((key) => {
      const item = gameStatsRaw[key] && typeof gameStatsRaw[key] === "object" ? gameStatsRaw[key] : {};
      const plays = Math.max(0, parseInt(String(item.plays || 0), 10) || 0);
      const bestScore = Math.max(0, parseInt(String(item.bestScore || 0), 10) || 0);
      const averageScore = Math.max(0, parseInt(String(item.averageScore || 0), 10) || 0);
      const lastScore = Math.max(0, parseInt(String(item.lastScore || 0), 10) || 0);
      const averageReactionMs = Math.max(0, parseInt(String(item.averageReactionMs || 0), 10) || 0);
      const lastReactionMs = Math.max(0, parseInt(String(item.lastReactionMs || 0), 10) || 0);
      gameStats[key] = {
        plays,
        bestScore,
        averageScore,
        lastScore,
        averageReactionMs,
        lastReactionMs,
        details: item.details && typeof item.details === "object" ? item.details : {}
      };
    });
    return {
      totalSessions: Math.max(0, parseInt(String(source.totalSessions || defaults.totalSessions), 10) || defaults.totalSessions),
      totalMentalScore: Math.max(0, parseInt(String(source.totalMentalScore || defaults.totalMentalScore), 10) || defaults.totalMentalScore),
      bestMentalScore: Math.max(0, parseInt(String(source.bestMentalScore || defaults.bestMentalScore), 10) || defaults.bestMentalScore),
      lastPlayed: source.lastPlayed ? String(source.lastPlayed) : null,
      gameStats
    };
  }

  function buildDefaultLiftingPlan() {
    return {
      id: "",
      name: "",
      weeks: "",
      purpose: "",
      benefits: "",
      days: Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        name: tr({ en: `Day ${index + 1}`, es: `Dia ${index + 1}` }),
        exercises: []
      }))
    };
  }

  // Resolve against the coach-planner.js script URL, not the page URL: the app
  // rewrites the address to routes like /plans/, which would break relative paths.
  const DEFAULT_PLANNER_LOGO_URL = (() => {
    try {
      const scriptSrc = Array.from(document.scripts || [])
        .map((script) => script.src || "")
        .find((src) => /coach-planner\.js/.test(src)) || window.location.href;
      return new URL("uwc-logo.png", scriptSrc).href;
    } catch {
      return "uwc-logo.png";
    }
  })();
  const DEFAULT_PRINT_BORDER_COLOR = "#0d6b4a";
  const DEFAULT_PRINT_TEXT_COLOR = "#0d6b4a";
  const MAX_LOGO_DATA_URL_LENGTH = 600000;
  const LEGACY_PLANNER_CLUB_NAME = "ARCHMERE AUKS";
  const LEGACY_PLANNER_COACH_NAME = "Coach Espinal";
  const LEGACY_PLANNER_SEASON = "Season 2025-2026";

  const STORAGE_KEYS = {
    settings: "planner_template_settings",
    library: "archmere_exercise_library",
    daily: "planner_daily_state",
    categoryNames: "planner_category_names",
    categories: "planner_wrestling_categories",
    track: "planner_active_track",
    liftingDraft: "planner_lifting_draft",
    mentalDraft: "planner_mental_draft",
    mentalScores: "planner_mental_scores",
    mentalAudioMuted: "planner_mental_audio_muted",
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
    if ([
      STORAGE_KEYS.liftingDraft,
      STORAGE_KEYS.mentalDraft,
      STORAGE_KEYS.mentalScores,
      STORAGE_KEYS.mentalAudioMuted,
      STORAGE_KEYS.liftingPlan,
      STORAGE_KEYS.liftingActiveDay,
      STORAGE_KEYS.liftingActiveTab
    ].includes(key)) {
      queuePlannerClientStateSync();
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeHexColor(value, fallback = "#0d6b4a") {
    const raw = String(value || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      const r = raw[1];
      const g = raw[2];
      const b = raw[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return String(fallback || "#0d6b4a").trim().toLowerCase();
  }

  function isInlineImageDataUrl(value) {
    return /^data:image\//i.test(String(value || "").trim());
  }

  function sanitizePlannerLogoUrl(value, fallback = DEFAULT_PLANNER_LOGO_URL) {
    const clean = String(value || "").trim();
    if (
      !clean ||
      clean === "uwc-logo.png" ||
      clean === "https://united-wc.com/assets/uwc-logo.png" ||
      clean === "https://www.united-wc.com/assets/uwc-logo.png"
    ) {
      return String(fallback || "").trim();
    }
    if (isInlineImageDataUrl(clean) && clean.length > MAX_LOGO_DATA_URL_LENGTH) {
      return String(fallback || "").trim() || DEFAULT_PLANNER_LOGO_URL;
    }
    return clean;
  }

  function hexToRgb(value) {
    const hex = normalizeHexColor(value, "#0d6b4a");
    const intValue = parseInt(hex.slice(1), 16);
    return {
      r: (intValue >> 16) & 255,
      g: (intValue >> 8) & 255,
      b: intValue & 255
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function mixHexColors(colorA, colorB, ratio = 0.5) {
    const safeRatio = clamp(Number(ratio), 0, 1);
    const a = hexToRgb(colorA);
    const b = hexToRgb(colorB);
    return rgbToHex(
      a.r + (b.r - a.r) * safeRatio,
      a.g + (b.g - a.g) * safeRatio,
      a.b + (b.b - a.b) * safeRatio
    );
  }

  function luminanceFromHex(color) {
    const { r, g, b } = hexToRgb(color);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function ensureDarkPrintColor(color, fallback = "#0d6b4a") {
    let candidate = normalizeHexColor(color, fallback);
    let luminance = luminanceFromHex(candidate);
    let attempts = 0;
    while (luminance > 0.45 && attempts < 6) {
      candidate = mixHexColors(candidate, "#000000", 0.18);
      luminance = luminanceFromHex(candidate);
      attempts += 1;
    }
    return candidate;
  }

  function loadImageForPalette(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (!String(src || "").startsWith("data:")) {
        image.crossOrigin = "anonymous";
      }
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("logo_read_failed"));
      reader.readAsDataURL(file);
    });
  }

  async function readOptimizedLogoDataUrl(file) {
    const rawDataUrl = await readFileAsDataUrl(file);
    if (!rawDataUrl) return "";
    if (rawDataUrl.length <= MAX_LOGO_DATA_URL_LENGTH) {
      return rawDataUrl;
    }
    try {
      const image = await loadImageForPalette(rawDataUrl);
      const maxEdge = 480;
      const sourceWidth = Math.max(1, Number(image.naturalWidth || image.width || 0));
      const sourceHeight = Math.max(1, Number(image.naturalHeight || image.height || 0));
      const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      const qualities = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52];
      let bestCandidate = "";
      for (const quality of qualities) {
        const candidate = canvas.toDataURL("image/jpeg", quality);
        if (!candidate) continue;
        if (!bestCandidate || candidate.length < bestCandidate.length) {
          bestCandidate = candidate;
        }
        if (candidate.length <= MAX_LOGO_DATA_URL_LENGTH) {
          return candidate;
        }
      }
      if (bestCandidate.length <= MAX_LOGO_DATA_URL_LENGTH) {
        return bestCandidate;
      }
    } catch {
      // If optimization fails, reject below with empty payload.
    }
    return "";
  }

  async function derivePrintPaletteFromLogo(logoSrc = "") {
    const cleanSrc = String(logoSrc || "").trim();
    if (!cleanSrc) {
      return {
        borderColor: DEFAULT_PRINT_BORDER_COLOR,
        textColor: DEFAULT_PRINT_TEXT_COLOR
      };
    }

    try {
      const image = await loadImageForPalette(cleanSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("palette ctx unavailable");
      const size = 48;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumWeight = 0;
      let darkR = 0;
      let darkG = 0;
      let darkB = 0;
      let darkWeight = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        if (alpha < 0.14) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        if (lum > 0.97) continue;
        if (sat < 0.05 && lum > 0.75) continue;

        const weight = alpha * (0.3 + sat * 1.7);
        sumR += r * weight;
        sumG += g * weight;
        sumB += b * weight;
        sumWeight += weight;

        const darkFactor = Math.max(0, 0.95 - lum);
        const darkPixelWeight = weight * darkFactor;
        darkR += r * darkPixelWeight;
        darkG += g * darkPixelWeight;
        darkB += b * darkPixelWeight;
        darkWeight += darkPixelWeight;
      }

      if (!sumWeight || sumWeight < 1) {
        throw new Error("palette insufficient pixels");
      }

      const accentColor = rgbToHex(sumR / sumWeight, sumG / sumWeight, sumB / sumWeight);
      const borderColor = ensureDarkPrintColor(accentColor, DEFAULT_PRINT_BORDER_COLOR);
      const textBase = darkWeight > 0.1
        ? rgbToHex(darkR / darkWeight, darkG / darkWeight, darkB / darkWeight)
        : mixHexColors(borderColor, "#000000", 0.26);
      const textColor = ensureDarkPrintColor(textBase, borderColor);

      return {
        borderColor,
        textColor
      };
    } catch {
      return {
        borderColor: DEFAULT_PRINT_BORDER_COLOR,
        textColor: DEFAULT_PRINT_TEXT_COLOR
      };
    }
  }

  async function refreshStoredPrintPaletteFromLogo({ sync = false } = {}) {
    if (!state?.settings?.printAutoColors) return;
    const logoUrl = String(state.settings.logoUrl || "").trim();
    const palette = await derivePrintPaletteFromLogo(logoUrl);
    if (!state?.settings?.printAutoColors) return;

    const nextBorderColor = normalizeHexColor(palette.borderColor, DEFAULT_PRINT_BORDER_COLOR);
    const nextTextColor = ensureDarkPrintColor(palette.textColor, nextBorderColor);
    const currentBorder = normalizeHexColor(state.settings.printBorderColor, DEFAULT_PRINT_BORDER_COLOR);
    const currentText = ensureDarkPrintColor(state.settings.printTextColor, currentBorder);
    if (nextBorderColor === currentBorder && nextTextColor === currentText) return;

    state.settings = normalizePlannerSettings({
      ...state.settings,
      printBorderColor: nextBorderColor,
      printTextColor: nextTextColor
    }, { migrateLegacy: true });
    persistSettings();
    updateFooter();
    updateLogos();
    if (sync) {
      queuePlannerSettingsSync();
    }
  }

  function shuffleList(list = []) {
    const copy = Array.isArray(list) ? [...list] : [];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // Declared early so helpers used during state construction do not hit TDZ.
  let state = null;

  function getPlannerCategories() {
    if (state && Array.isArray(state.wrestlingCategories) && state.wrestlingCategories.length) {
      return state.wrestlingCategories;
    }
    if (Array.isArray(runtimeWrestlingCategories) && runtimeWrestlingCategories.length) {
      return runtimeWrestlingCategories;
    }
    return BASE_WRESTLING_CATEGORIES;
  }

  function getFirstPlannerCategoryId() {
    return getPlannerCategories()[0]?.id || BASE_WRESTLING_CATEGORIES[0]?.id || "section";
  }

  function getDefaultCategoryNames() {
    return getPlannerCategories().reduce((acc, category) => {
      const localized = CATEGORY_NAME_TRANSLATIONS[category.id] || { en: category.name, es: category.name };
      acc[category.id] = getPlannerLang() === "es" ? localized.es : localized.en;
      return acc;
    }, {});
  }

  function syncCategoryNamesForLanguage() {
    const lang = getPlannerLang();
    let changed = false;
    getPlannerCategories().forEach((category) => {
      const localized = CATEGORY_NAME_TRANSLATIONS[category.id] || { en: category.name, es: category.name };
      const target = lang === "es" ? localized.es : localized.en;
      const current = String(state.categoryNames?.[category.id] || "").trim();
      if (!current || current === localized.en || current === localized.es) {
        if (current !== target) {
          state.categoryNames[category.id] = target;
          changed = true;
        }
      }
    });
    if (changed) persistCategoryNames();
  }

  function normalizeCategoryId(value) {
    const raw = String(value || "").trim();
    return getPlannerCategories().some((category) => category.id === raw) ? raw : getFirstPlannerCategoryId();
  }

  function normalizeLibraryEntries(entries = [], { dropUnknownCategory = false, categories = null } = {}) {
    if (!Array.isArray(entries)) return [];
    const baseCategories = Array.isArray(categories) && categories.length ? categories : getPlannerCategories();
    const validIds = new Set(baseCategories.map((category) => category.id));
    const fallbackCategoryId = baseCategories[0]?.id || getFirstPlannerCategoryId();
    return entries
      .map((entry) => {
        const name = String(entry?.name || "").trim();
        const rawCategoryId = String(entry?.categoryId || "").trim();
        if (dropUnknownCategory && rawCategoryId && !validIds.has(rawCategoryId)) return null;
        const categoryId = validIds.has(rawCategoryId) ? rawCategoryId : fallbackCategoryId;
        if (!name) return null;
        return {
          id: String(entry?.id || makeId()),
          name,
          categoryId
        };
      })
      .filter(Boolean);
  }

  function mergePlannerLibraryEntries(...sources) {
    const merged = [];
    const seen = new Set();
    sources.forEach((source) => {
      normalizeLibraryEntries(source || []).forEach((entry) => {
        const key = `${entry.categoryId}::${String(entry.name || "").trim().toLowerCase()}`;
        if (!key || seen.has(key)) return;
        seen.add(key);
        merged.push({
          id: String(entry.id || makeId()),
          name: String(entry.name || "").trim(),
          categoryId: normalizeCategoryId(entry.categoryId)
        });
      });
    });
    return merged;
  }

  function normalizePlannerScheduleState(value = {}, categories = getPlannerCategories()) {
    const source = value && typeof value === "object" ? value : {};
    const next = {};
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      const list = Array.isArray(source?.[category.id]) ? source[category.id] : [];
      next[category.id] = list
        .map((item) => {
          if (typeof item === "string") {
            const name = item.trim();
            return name ? { id: makeId(), name } : null;
          }
          const name = String(item?.name || "").trim();
          if (!name) return null;
          return {
            id: String(item?.id || makeId()),
            name
          };
        })
        .filter(Boolean);
    });
    return next;
  }

  function normalizePlannerCategoryTimesState(value = {}, categories = getPlannerCategories()) {
    const source = value && typeof value === "object" ? value : {};
    const next = {};
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      const raw = String(source?.[category.id] ?? "").trim();
      next[category.id] = raw || INITIAL_TIMES[category.id] || "0";
    });
    return next;
  }

  function normalizePlannerCategoryNamesState(value = {}, categories = getPlannerCategories()) {
    const source = value && typeof value === "object" ? value : {};
    const next = {};
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      const localized = CATEGORY_NAME_TRANSLATIONS[category.id] || { en: category.name, es: category.name };
      const fallback = getPlannerLang() === "es" ? localized.es : localized.en;
      next[category.id] = String(source?.[category.id] || "").trim() || fallback || category.name || category.id;
    });
    return next;
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

  function mergeLiftingLibraryMaps(...sources) {
    const merged = {};
    sources.forEach((source) => {
      const normalized = normalizeLiftingLibraryMap(source || {});
      Object.entries(normalized).forEach(([category, values]) => {
        const safeCategory = String(category || "").trim();
        if (!safeCategory) return;
        if (!Array.isArray(merged[safeCategory])) merged[safeCategory] = [];
        const seen = new Set(merged[safeCategory].map((item) => String(item || "").trim().toLowerCase()));
        (Array.isArray(values) ? values : []).forEach((item) => {
          const safeItem = String(item || "").trim();
          if (!safeItem) return;
          const key = safeItem.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          merged[safeCategory].push(safeItem);
        });
      });
    });
    return normalizeLiftingLibraryMap(merged);
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
      const fallbackDayName = tr({ en: `Day ${index + 1}`, es: `Dia ${index + 1}` });
      return {
        id: index + 1,
        name: String(daySource.name || fallbackDayName).trim() || fallbackDayName,
        exercises: exercises.map(normalizeLiftingExercise).filter(Boolean)
      };
    });
    while (days.length < 7) {
      days.push({
        id: days.length + 1,
        name: tr({ en: `Day ${days.length + 1}`, es: `Dia ${days.length + 1}` }),
        exercises: []
      });
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
      name: String(source.name || tr({ en: "Untitled Protocol", es: "Protocolo sin titulo" })).trim() || tr({ en: "Untitled Protocol", es: "Protocolo sin titulo" }),
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
    return fromProfile || fromAuthName || fromAuthEmail || tr({ en: "Coach", es: "Entrenador" });
  }

  function buildPlannerDefaultSettings() {
    return {
      clubName: "United Wrestling Club",
      coach: getDefaultPlannerCoachName(),
      season: LEGACY_PLANNER_SEASON,
      logoUrl: DEFAULT_PLANNER_LOGO_URL,
      footerMessage: "",
      printAutoColors: false,
      printBorderColor: DEFAULT_PRINT_BORDER_COLOR,
      printTextColor: DEFAULT_PRINT_TEXT_COLOR
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
      logoUrl: sanitizePlannerLogoUrl(source.logoUrl, defaults.logoUrl),
      footerMessage: String(source.footerMessage || "").trim(),
      printAutoColors: false,
      printBorderColor: normalizeHexColor(source.printBorderColor, defaults.printBorderColor),
      printTextColor: normalizeHexColor(source.printTextColor, defaults.printTextColor)
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
      next.footerMessage = next.footerMessage || defaults.footerMessage;
      next.printBorderColor = normalizeHexColor(next.printBorderColor, defaults.printBorderColor);
      next.printTextColor = normalizeHexColor(next.printTextColor, defaults.printTextColor);
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
  const persistedWrestlingCategories = normalizePlannerCategoryCollection(
    readJson(STORAGE_KEYS.categories, runtimeWrestlingCategories)
  );
  runtimeWrestlingCategories = persistedWrestlingCategories.map((category) => ({ ...category }));
  const persistedCategoryNames = readJson(STORAGE_KEYS.categoryNames, {}) || {};

  state = {
    activeTrack: normalizeTrack(readJson(STORAGE_KEYS.track, "wrestling")),
    lastRenderedTrack: normalizeTrack(readJson(STORAGE_KEYS.track, "wrestling")),
    docInfo: {
      date: String(dailyState.date || ""),
      totalTime: String(dailyState.totalTime || "90")
    },
    settings: normalizePlannerSettings({
      ...(readJson(STORAGE_KEYS.settings, buildPlannerDefaultSettings()) || {}),
      ...profilePlannerSettings
    }, { migrateLegacy: true }),
    tempSettings: null,
    wrestlingCategories: persistedWrestlingCategories,
    categoryNames: {
      ...getDefaultCategoryNames(),
      ...persistedCategoryNames
    },
    exerciseLibrary: normalizeLibraryEntries(readJson(STORAGE_KEYS.library, INITIAL_LIBRARY)),
    schedule: normalizePlannerScheduleState(dailyState.schedule || {}, persistedWrestlingCategories),
    categoryTimes: normalizePlannerCategoryTimesState(dailyState.categoryTimes || {}, persistedWrestlingCategories),
    coachLibraries: [],
    coachLibrariesStatus: tr({ en: "Loading coach libraries...", es: "Cargando librerias de entrenadores..." }),
    coachLibrariesUnsub: null,
    coachLibrariesReady: false,
    plannerAuthUnsub: null,
    plannerHydratedUid: "",
    librarySyncTimer: null,
    plannerCatalogSyncTimer: null,
    plannerCatalogUnsub: null,
    plannerCatalogReady: false,
    plannerCatalogStatus: "",
    settingsSyncTimer: null,
    dailySyncTimer: null,
    dailyDraftUpdatedAt: String(dailyState.updatedAt || ""),
    categoryDrafts: {},
    pendingLibraryFocus: "",
    pendingCategoryFocus: "",
    templateRecords: [],
    activeLoadedSourceKey: "",
    activeTemplateId: "",
    activeTemplateName: "",
    templateSaveBusy: false,
    assignAthletes: [],
    assignFallbackRecipients: [],
    selectedAthleteIds: [],
    assignSearch: "",
    assignDueDate: "",
    assignScheduleMode: "day",
    assignWeekCount: 1,
    assignModalBusy: false,
    assignDirectoryUnsubs: [],
    assignDirectoryRoleRecords: {},
    assignDirectoryReady: false,
    assignContext: {
      track: "wrestling",
      mentalGameKey: ""
    },
    liftingDraft: readJson(STORAGE_KEYS.liftingDraft, {}) || {},
    mentalDraft: readJson(STORAGE_KEYS.mentalDraft, {}) || {},
    mentalScores: normalizeMentalScoreValue(readJson(STORAGE_KEYS.mentalScores, buildDefaultMentalScores()) || buildDefaultMentalScores()),
    mentalLeaderboard: buildDefaultMentalLeaderboard(),
    mentalLeaderboardStatus: tr({ en: "Loading global leaderboard...", es: "Cargando leaderboard global..." }),
    mentalLeaderboardReady: false,
    mentalLeaderboardLoadedKeys: {},
    mentalLeaderboardUnsubs: [],
    mentalView: "home",
    mentalActiveGame: "",
    mentalSession: null,
    mentalResult: null,
    mentalTimers: [],
    mentalAudioContext: null,
    mentalAudioMuted: Boolean(readJson(STORAGE_KEYS.mentalAudioMuted, false)),
    liftingTab: normalizeLiftingTab(readJson(STORAGE_KEYS.liftingActiveTab, "editor") || "editor"),
    liftingActiveDay: Math.max(0, Math.min(6, parseInt(String(readJson(STORAGE_KEYS.liftingActiveDay, 0) || 0), 10) || 0)),
    liftingPlan: normalizeLiftingPlan(readJson(STORAGE_KEYS.liftingPlan, buildDefaultLiftingPlan()) || buildDefaultLiftingPlan()),
    liftingLibrary: normalizeLiftingLibraryMap(readJson(STORAGE_KEYS.liftingLibraryData, DEFAULT_LIFTING_LIBRARY) || DEFAULT_LIFTING_LIBRARY),
    liftingSearch: "",
    liftingPlans: [],
    liftingPlansUnsub: null,
    liftingLibraryUnsub: null,
    liftingLibraryRetryTimer: null,
    liftingLibraryRetryAttempt: 0,
    liftingAuthUnsub: null,
    liftingBusy: false,
    lastSavedTemplateId: "",
    lastSentPlanId: "",
    toastTimer: null,
    pendingFocus: null,
    readOnly: false
  };

  reconcilePlannerDataForCategories();

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
    dateInput: document.getElementById("wtpPlanDate"),
    datePrintValue: document.getElementById("plannerDatePrintValue"),
    totalTimeInput: document.getElementById("wtpTotalMinutes"),
    totalTimeDownBtn: document.getElementById("plannerTotalTimeDownBtn"),
    totalTimeUpBtn: document.getElementById("plannerTotalTimeUpBtn"),
    totalTimePrintValue: document.getElementById("plannerTotalTimePrintValue"),
    rows: document.getElementById("plannerRows"),
    addSectionBtn: document.getElementById("plannerAddSectionBtn"),
    footerClub: document.getElementById("plannerFooterClub"),
    footerCoach: document.getElementById("plannerFooterCoach"),
    footerSeason: document.getElementById("plannerFooterSeason"),
    logoPreview: document.getElementById("wtpLogoPreview"),
    logoPlaceholder: document.getElementById("plannerLogoPlaceholder"),
    toast: document.getElementById("plannerToast"),
    overtimeAlert: document.getElementById("plannerOvertimeAlert"),

    settingsModal: document.getElementById("plannerSettingsModal"),
    settingsCloseBtn: document.getElementById("plannerSettingsCloseBtn"),
    settingsCancelBtn: document.getElementById("plannerSettingsCancelBtn"),
    settingsSaveBtn: document.getElementById("plannerSettingsSaveBtn"),
    settingsClubInput: document.getElementById("wtpClubName"),
    settingsCoachInput: document.getElementById("wtpCoachName"),
    settingsSeasonInput: document.getElementById("wtpSeasonName"),
    settingsFooterInput: document.getElementById("wtpFooterMessage"),
    settingsPrintBorderInput: document.getElementById("wtpPrintBorderColor"),
    settingsPrintTextInput: document.getElementById("wtpPrintTextColor"),
    settingsLogoInput: document.getElementById("plannerSettingsLogoInput"),
    settingsLogoPreview: document.getElementById("plannerSettingsLogoPreview"),
    settingsLogoPlaceholder: document.getElementById("plannerSettingsLogoPlaceholder"),
    settingsRemoveLogoBtn: document.getElementById("plannerSettingsRemoveLogoBtn"),

    libraryModal: document.getElementById("plannerLibraryModal"),
    libraryCloseBtn: document.getElementById("plannerLibraryCloseBtn"),
    libraryCancelBtn: document.getElementById("plannerLibraryCancelBtn"),
    newExerciseNameInput: document.getElementById("plannerNewExerciseNameInput"),
    newExerciseCategorySelect: document.getElementById("plannerNewExerciseCategorySelect"),
    addCategoryBtn: document.getElementById("plannerAddCategoryBtn"),
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
    assignTitle: document.getElementById("plannerAssignTitle"),
    assignCloseBtn: document.getElementById("plannerAssignCloseBtn"),
    assignCancelBtn: document.getElementById("plannerAssignCancelBtn"),
    assignSendBtn: document.getElementById("plannerAssignSendBtn"),
    assignList: document.getElementById("plannerAssignList"),
    assignStatus: document.getElementById("plannerAssignStatus"),
    assignWeekHint: document.getElementById("plannerAssignWeekHint"),
    assignSearchInput: document.getElementById("plannerAssignSearchInput"),
    assignSelectAllBtn: document.getElementById("plannerAssignSelectAllBtn"),
    assignClearBtn: document.getElementById("plannerAssignClearBtn"),
    assignDueDateLabel: document.getElementById("plannerAssignDueDateLabel"),
    assignDueDateInput: document.getElementById("plannerAssignDueDateInput"),
    assignScheduleModeWrapper: document.getElementById("plannerAssignScheduleModeWrapper"),
    assignScheduleModeInput: document.getElementById("plannerAssignScheduleModeInput"),
    assignWeekCountWrapper: document.getElementById("plannerAssignWeekCountWrapper"),
    assignWeekCountInput: document.getElementById("plannerAssignWeekCountInput"),
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
    mentalShell: document.getElementById("plannerMentalShell"),
    mentalContent: document.getElementById("plannerMentalContent"),
    liftingShell: document.getElementById("plannerLiftingShell"),
    liftingTabs: Array.from(root.querySelectorAll("[data-lifting-tab]")),
    liftingViews: Array.from(root.querySelectorAll("[data-lifting-view]")),
    liftingShareBtn: document.getElementById("plannerLiftingShareBtn"),
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

  function persistDaily({ syncCloud = true, updatedAt = "" } = {}) {
    const safeUpdatedAt = String(updatedAt || "").trim() || new Date().toISOString();
    state.dailyDraftUpdatedAt = safeUpdatedAt;
    writeJson(STORAGE_KEYS.daily, {
      date: state.docInfo.date,
      totalTime: state.docInfo.totalTime,
      schedule: state.schedule,
      categoryTimes: state.categoryTimes,
      updatedAt: safeUpdatedAt
    });
    if (syncCloud) {
      queuePlannerDailySync();
    }
  }

  function persistSettings() {
    writeJson(STORAGE_KEYS.settings, state.settings);
  }

  function mergePlannerSettings(nextSettings = {}, { sync = false } = {}) {
    const previous = normalizePlannerSettings(state.settings || {}, { migrateLegacy: true });
    const normalized = normalizePlannerSettings(nextSettings, { migrateLegacy: true });
    state.settings = normalized;
    persistSettings();
    updateFooter();
    updateLogos();
    const shouldRefreshAutoPalette = Boolean(normalized.printAutoColors)
      && String(normalized.logoUrl || "").trim() !== String(previous.logoUrl || "").trim();
    if (shouldRefreshAutoPalette) {
      refreshStoredPrintPaletteFromLogo({ sync }).catch(() => {});
    }
    if (sync) {
      queuePlannerSettingsSync();
    }
  }

  function persistLibrary() {
    writeJson(STORAGE_KEYS.library, state.exerciseLibrary);
  }

  function persistCategories() {
    runtimeWrestlingCategories = normalizePlannerCategoryCollection(state.wrestlingCategories || []);
    state.wrestlingCategories = runtimeWrestlingCategories.map((category) => ({ ...category }));
    writeJson(STORAGE_KEYS.categories, state.wrestlingCategories);
  }

  function persistCategoryNames() {
    writeJson(STORAGE_KEYS.categoryNames, state.categoryNames);
  }

  function reconcilePlannerDataForCategories({ keepLibraryUnknown = false } = {}) {
    const categories = normalizePlannerCategoryCollection(state.wrestlingCategories || []);
    state.wrestlingCategories = categories;
    runtimeWrestlingCategories = categories.map((category) => ({ ...category }));
    state.schedule = normalizePlannerScheduleState(state.schedule || {}, categories);
    state.categoryTimes = normalizePlannerCategoryTimesState(state.categoryTimes || {}, categories);
    state.categoryNames = normalizePlannerCategoryNamesState(state.categoryNames || {}, categories);
    state.exerciseLibrary = normalizeLibraryEntries(
      state.exerciseLibrary || [],
      { dropUnknownCategory: !keepLibraryUnknown }
    );

    const validIds = new Set(categories.map((category) => category.id));
    const nextDrafts = {};
    Object.entries(state.categoryDrafts || {}).forEach(([categoryId, draftValue]) => {
      if (!validIds.has(categoryId)) return;
      nextDrafts[categoryId] = String(draftValue || "");
    });
    state.categoryDrafts = nextDrafts;
  }

  function getCategoryNameById(categoryId) {
    const fallback = (CATEGORY_NAME_TRANSLATIONS[categoryId] && (getPlannerLang() === "es"
      ? CATEGORY_NAME_TRANSLATIONS[categoryId].es
      : CATEGORY_NAME_TRANSLATIONS[categoryId].en))
      || getPlannerCategories().find((category) => category.id === categoryId)?.name
      || tr({ en: "Category", es: "Categoria" });
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
    const raw = String(value || "").trim();
    const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = isoDateMatch
      ? new Date(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))
      : new Date(raw);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function getUsedTime() {
    return getPlannerCategories().reduce((total, category) => total + parseTimeValue(state.categoryTimes[category.id]), 0);
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

  function escapePrintHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function q(selector, scope = document) {
    if (!scope || typeof scope.querySelector !== "function") return null;
    return scope.querySelector(selector);
  }

  function qa(selector, scope = document) {
    if (!scope || typeof scope.querySelectorAll !== "function") return [];
    return Array.from(scope.querySelectorAll(selector));
  }

  function text(node) {
    if (!node) return "";
    return String(node.value ?? node.textContent ?? "").trim();
  }

  function getSettings(plannerRoot) {
    void plannerRoot;
    const usingTempSettings = Boolean(state.tempSettings && els.settingsModal && !els.settingsModal.classList.contains("hidden"));
    const sourceSettings = usingTempSettings ? state.tempSettings : state.settings;
    const clubValue = String(sourceSettings?.clubName || "").trim() || text(document.getElementById("wtpClubName")) || "United Wrestling Club";
    const coachValue = String(sourceSettings?.coach || "").trim() || text(document.getElementById("wtpCoachName")) || "Coach";
    const seasonValue = String(sourceSettings?.season || "").trim() || text(document.getElementById("wtpSeasonName")) || "Season 2025-2026";
    const footerCustom = String(sourceSettings?.footerMessage || "").trim() || text(document.getElementById("wtpFooterMessage"));
    const borderColor = normalizeHexColor(
      String(sourceSettings?.printBorderColor || "").trim() || DEFAULT_PRINT_BORDER_COLOR,
      DEFAULT_PRINT_BORDER_COLOR
    );
    const textColor = ensureDarkPrintColor(
      String(sourceSettings?.printTextColor || "").trim() || borderColor,
      borderColor
    );
    return {
      club: clubValue,
      coach: coachValue,
      season: seasonValue,
      date: text(document.getElementById("wtpPlanDate")) || String(state.docInfo?.date || "").trim(),
      totalTime: text(document.getElementById("wtpTotalMinutes")) || String(state.docInfo?.totalTime || "").trim() || "90",
      footerMessage: footerCustom || `${coachValue}  ${seasonValue}`.trim(),
      logoSrc: document.getElementById("wtpLogoPreview")?.src || String(sourceSettings?.logoUrl || state.settings?.logoUrl || "").trim(),
      borderColor,
      textColor
    };
  }

  function getRows() {
    return qa("[data-plan-row]").map((row) => {
      const noteLines = qa(".wtp-notes", row).map((node) => text(node)).filter(Boolean);
      return {
        activity: text(q(".wtp-activity", row)) || "Activity",
        notes: noteLines,
        time: text(q(".wtp-time", row)) || ""
      };
    }).filter((entry) => entry.activity || entry.notes.length || entry.time);
  }

  function buildWrestlingBasicPrintMarkup() {
    const clubLabel = tr({ en: "Club / School", es: "Club / Escuela" });
    const coachLabel = tr({ en: "Coach", es: "Entrenador" });
    const seasonLabel = tr({ en: "Season", es: "Temporada" });
    const totalTimeLabel = tr({ en: "Total Time", es: "Tiempo Total" });
    const activityLabel = "ACTIVITY";
    const timeLabel = "TIME";
    const minutesLabel = tr({ en: "min", es: "min" });
    const noDataLabel = tr({ en: "No data", es: "Sin datos" });
    const noItemsLabel = tr({ en: "No plan sections saved yet.", es: "Todavia no hay secciones del plan guardadas." });

    const settings = getSettings(root);
    const printDateLabel = formatDateForPrint(settings.date || "");
    const baseTitleLabel = String(state.activeTemplateName || "").trim()
      || tr({ en: "Daily Schedule", es: "Horario Diario" });
    const titleLabel = printDateLabel && printDateLabel !== "--" && !baseTitleLabel.includes(printDateLabel)
      ? `${baseTitleLabel} - ${printDateLabel}`
      : baseTitleLabel;
    const rows = getRows();
    const borderColor = ensureDarkPrintColor(settings.borderColor, DEFAULT_PRINT_BORDER_COLOR);
    const textColor = ensureDarkPrintColor(settings.textColor, borderColor);
    const lineColor = mixHexColors(borderColor, "#ffffff", 0.72);
    const watermarkMarkup = settings.logoSrc
      ? `<div class="wtp-print-watermark"><img src="${escapePrintHtml(settings.logoSrc)}" alt=""></div>`
      : "";

    const rowsMarkup = rows.length
      ? rows.map((row) => {
        const noteMarkup = row.notes.length
          ? `<div class="wtp-print-notes-list">${row.notes.map((line) => `<div class="wtp-print-note-line">${escapePrintHtml(line)}</div>`).join("")}</div>`
          : `<div class="wtp-print-note-line wtp-print-note-line-empty">&nbsp;</div>`;
        const timeValue = row.time ? `${row.time} ${minutesLabel}` : "--";
        return `
        <tr>
          <td>
            <div class="wtp-print-activity">${escapePrintHtml(row.activity || noDataLabel)}</div>
            ${noteMarkup}
          </td>
          <td class="wtp-print-time">${escapePrintHtml(timeValue)}</td>
        </tr>
      `;
      }).join("")
      : `
        <tr>
          <td>
            <div class="wtp-print-activity">${escapePrintHtml(noDataLabel)}</div>
            <div class="wtp-print-note-line">${escapePrintHtml(noItemsLabel)}</div>
          </td>
          <td class="wtp-print-time">--</td>
        </tr>
      `;

    return `
      <div class="wtp-print-sheet" style="--wtp-print-border: ${escapePrintHtml(borderColor)}; --wtp-print-text: ${escapePrintHtml(textColor)}; --wtp-print-line: ${escapePrintHtml(lineColor)};">
        <div class="wtp-print-header-box">
          ${watermarkMarkup}
          <div class="wtp-print-title">${escapePrintHtml(titleLabel)}</div>

          <div class="wtp-print-topline">
            <div class="wtp-print-subtitle">
              <strong>${escapePrintHtml(settings.club || clubLabel)}</strong>
            </div>

            <div class="wtp-print-field">
              <span class="wtp-print-field-label">${escapePrintHtml(totalTimeLabel)}</span>
              <span class="wtp-print-field-line">${escapePrintHtml(String(settings.totalTime || "90"))} ${escapePrintHtml(minutesLabel)}</span>
            </div>
          </div>

          <table class="wtp-print-table">
            <thead>
              <tr>
                <th>${escapePrintHtml(activityLabel)}</th>
                <th>${escapePrintHtml(timeLabel)}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsMarkup}
            </tbody>
          </table>
        </div>

        <div class="wtp-print-footer">${escapePrintHtml(settings.footerMessage || [settings.coach || coachLabel, settings.season || seasonLabel].filter(Boolean).join(" • ") || noDataLabel)}</div>
      </div>
    `;
  }

  function getPlannerBasicPrintStyles() {
    return `
      /* ===== WRESTLING TRAINING PLANNER - PRINT TEMPLATE ===== */
      .wtp-print-sheet {
        --wtp-print-border: #0d6b4a;
        --wtp-print-text: #0d6b4a;
        --wtp-print-line: #c7d2cf;
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        padding: 0.35in 0.35in 0.25in 0.35in;
        box-sizing: border-box;
        background: #fff;
        color: #1f2937;
        font-family: Arial, Helvetica, sans-serif;
      }

      .wtp-print-logo-wrap {
        text-align: center;
        margin-bottom: 14px;
      }

      .wtp-print-logo {
        max-width: 260px;
        max-height: 110px;
        object-fit: contain;
      }

      .wtp-print-header-box {
        border: 5px solid var(--wtp-print-border);
        border-radius: 10px;
        padding: 14px 16px 12px 16px;
        position: relative;
        overflow: hidden;
      }

      .wtp-print-watermark {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0.08;
      }

      .wtp-print-watermark img {
        max-width: 88%;
        max-height: 88%;
        object-fit: contain;
      }

      .wtp-print-topline {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(150px, 0.8fr);
        gap: 10px;
        align-items: end;
        margin-bottom: 10px;
        font-size: 14px;
      }

      .wtp-print-title {
        font-size: 28px;
        font-weight: 800;
        color: var(--wtp-print-text);
        letter-spacing: 0.4px;
        margin-bottom: 4px;
      }

      .wtp-print-subtitle {
        font-size: 13px;
        color: #374151;
      }

      .wtp-print-field {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .wtp-print-field-label {
        font-weight: 700;
        color: var(--wtp-print-text);
      }

      .wtp-print-field-line {
        border-bottom: 1px solid var(--wtp-print-line);
        min-height: 18px;
        flex: 1;
        padding: 0 4px 1px 4px;
        font-weight: 600;
      }

      .wtp-print-table {
        position: relative;
        z-index: 2;
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 13px;
        border: 2px solid var(--wtp-print-border);
      }

      .wtp-print-table thead th {
        text-align: left;
        padding: 6px 8px;
        border: 1.25px solid var(--wtp-print-border);
        background: #f3f7f6;
        color: var(--wtp-print-text);
        font-size: 13px;
      }

      .wtp-print-table thead th:last-child {
        width: 82px;
        text-align: center;
      }

      .wtp-print-table tbody td {
        padding: 7px 8px;
        vertical-align: top;
        border: 1.25px solid var(--wtp-print-line);
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .wtp-print-table tbody td:last-child {
        text-align: center;
        width: 82px;
      }

      .wtp-print-activity {
        font-weight: 700;
        color: var(--wtp-print-text);
        margin-bottom: 4px;
      }

      .wtp-print-notes-list {
        display: grid;
        gap: 3px;
      }

      .wtp-print-note-line {
        white-space: pre-wrap;
        color: #1f2937;
        line-height: 1.35;
        min-height: 18px;
        overflow-wrap: anywhere;
      }

      .wtp-print-note-line + .wtp-print-note-line {
        border-top: 1px solid rgba(31, 41, 55, 0.14);
        padding-top: 3px;
      }

      .wtp-print-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 14px;
        font-weight: 800;
        color: var(--wtp-print-text);
        font-size: 14px;
      }

      @page {
        size: Letter portrait;
        margin: 0.2in;
      }

      @media (max-width: 760px) {
        .wtp-print-sheet {
          width: 100%;
          min-height: 0;
          padding: 12px;
        }
        .wtp-print-topline {
          grid-template-columns: 1fr;
          align-items: start;
        }
      }

      /* Keep legacy print styles for lifting/mental print pages */
      html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.35; }
      body { padding: 8px; -webkit-print-color-adjust: economy; print-color-adjust: economy; }
      header { border-bottom: 1px solid #111; padding-bottom: 6px; margin-bottom: 8px; }
      h1 { margin: 0; font-size: 18px; }
      h2 { margin: 0; font-size: 14px; }
      p { margin: 4px 0; }
      .meta { border: 1px solid #111; padding: 6px; margin-bottom: 8px; display: grid; gap: 2px; }
      .section { border: 1px solid #111; padding: 6px; margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid; }
      .section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
      ul { margin: 0; padding-left: 18px; }
      li { margin: 0 0 2px 0; }
      .muted { color: #444; font-style: italic; }
    `;
  }

  function captureLiveLiftingPlanSnapshot() {
    const snapshot = normalizeLiftingPlan(state.liftingPlan || buildDefaultLiftingPlan());
    snapshot.name = String(els.liftingPlanNameInput?.value || snapshot.name || "").trim() || snapshot.name;
    snapshot.weeks = String(els.liftingPlanWeeksInput?.value || snapshot.weeks || "").trim() || snapshot.weeks;
    snapshot.purpose = String(els.liftingPlanPurposeInput?.value || snapshot.purpose || "").trim();
    snapshot.benefits = String(els.liftingPlanBenefitsInput?.value || snapshot.benefits || "").trim();

    const activeIndex = Math.max(0, Math.min(6, parseInt(String(state.liftingActiveDay || 0), 10) || 0));
    const activeDay = snapshot.days[activeIndex];
    if (activeDay && els.liftingActiveDayNameInput) {
      activeDay.name = String(els.liftingActiveDayNameInput.value || activeDay.name || "").trim() || activeDay.name;
    }

    const rowNodes = Array.from(root.querySelectorAll("#plannerLiftingExerciseList .planner-lifting-exercise-row"));
    if (activeDay && rowNodes.length) {
      const liveExercises = rowNodes.map((row) => {
        const name = String(row.querySelector("strong")?.textContent || "").replace(/\s+/g, " ").trim();
        const sets = String(
          row.querySelector("input[data-action='lifting-update-exercise-field'][data-field='sets']")?.value || ""
        ).trim();
        const reps = String(
          row.querySelector("input[data-action='lifting-update-exercise-field'][data-field='reps']")?.value || ""
        ).trim();
        const intensity = String(
          row.querySelector("input[data-action='lifting-update-exercise-field'][data-field='intensity']")?.value || ""
        ).trim();
        if (!name) return null;
        return {
          id: makeId(),
          name,
          sets: sets || "0",
          reps: reps || "-",
          intensity: intensity || "-"
        };
      }).filter(Boolean);
      if (liveExercises.length) {
        activeDay.exercises = liveExercises;
      }
    }

    return snapshot;
  }

  function buildLiftingBasicPrintMarkup() {
    const title = tr({ en: "Lifting & Conditioning Plan", es: "Plan de Lifting y Conditioning" });
    const generatedLabel = tr({ en: "Generated", es: "Generado" });
    const noItemsLabel = tr({ en: "No exercises added.", es: "No hay ejercicios agregados." });
    const weeksLabel = tr({ en: "Weeks", es: "Semanas" });
    const purposeLabel = tr({ en: "Purpose", es: "Objetivo" });
    const benefitsLabel = tr({ en: "Benefits", es: "Beneficios" });
    const dayLabel = tr({ en: "Day", es: "Dia" });
    const setsLabel = tr({ en: "Sets", es: "Series" });
    const repsLabel = tr({ en: "Reps", es: "Reps" });
    const intensityLabel = tr({ en: "% RM", es: "% RM" });
    const totalExercisesLabel = tr({ en: "Total exercises", es: "Ejercicios totales" });
    const totalSetsLabel = tr({ en: "Total sets", es: "Series totales" });
    const dateRaw = String(els.dateInput?.value || state.docInfo.date || "").trim();
    const dateLabel = formatDateForPrint(dateRaw || "");

    const plan = captureLiveLiftingPlanSnapshot();
    const days = Array.isArray(plan.days) ? plan.days.slice(0, 7) : [];
    const totalExercises = days.reduce((sum, day) => sum + ((Array.isArray(day.exercises) ? day.exercises.length : 0)), 0);
    const totalSets = days.reduce((sum, day) => {
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      return sum + exercises.reduce((inner, exercise) => inner + Math.max(0, parseLiftingNumber(exercise.sets, 0)), 0);
    }, 0);

    const daySections = days.map((day, index) => {
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      const safeDayName = String(day?.name || "").trim() || `${dayLabel} ${index + 1}`;
      const rows = exercises.length
        ? `<ul>${exercises.map((exercise, exerciseIndex) => {
            const safeName = String(exercise?.name || "").trim() || `${tr({ en: "Exercise", es: "Ejercicio" })} ${exerciseIndex + 1}`;
            const sets = String(exercise?.sets || "").trim() || "0";
            const reps = String(exercise?.reps || "").trim() || "-";
            const intensity = String(exercise?.intensity || "").trim() || "-";
            return `<li><strong>${escapePrintHtml(safeName)}</strong> • ${escapePrintHtml(setsLabel)}: ${escapePrintHtml(sets)} • ${escapePrintHtml(repsLabel)}: ${escapePrintHtml(reps)} • ${escapePrintHtml(intensityLabel)}: ${escapePrintHtml(intensity)}</li>`;
          }).join("")}</ul>`
        : `<p class="muted">${escapePrintHtml(noItemsLabel)}</p>`;
      return `
        <section class="section">
          <div class="section-head">
            <h2>${index + 1}. ${escapePrintHtml(safeDayName)}</h2>
            <span>${exercises.length}</span>
          </div>
          ${rows}
        </section>
      `;
    }).join("");

    return `
      <header>
        <h1>${escapePrintHtml(title)}</h1>
        <p>${escapePrintHtml(dateLabel || "--")}</p>
      </header>
      <section class="meta">
        <div><strong>${escapePrintHtml(tr({ en: "Plan", es: "Plan" }))}:</strong> ${escapePrintHtml(plan.name || "-")}</div>
        <div><strong>${escapePrintHtml(weeksLabel)}:</strong> ${escapePrintHtml(plan.weeks || "-")}</div>
        <div><strong>${escapePrintHtml(purposeLabel)}:</strong> ${escapePrintHtml(plan.purpose || "-")}</div>
        <div><strong>${escapePrintHtml(benefitsLabel)}:</strong> ${escapePrintHtml(plan.benefits || "-")}</div>
        <div><strong>${escapePrintHtml(totalExercisesLabel)}:</strong> ${escapePrintHtml(String(totalExercises))}</div>
        <div><strong>${escapePrintHtml(totalSetsLabel)}:</strong> ${escapePrintHtml(String(Math.round(totalSets)))}</div>
        <div><strong>${escapePrintHtml(generatedLabel)}:</strong> ${escapePrintHtml(new Date().toLocaleString())}</div>
      </section>
      ${daySections || `<p class="muted">${escapePrintHtml(noItemsLabel)}</p>`}
    `;
  }

  function isLikelyMobilePrintFlow() {
    const ua = String(window.navigator?.userAgent || "").toLowerCase();
    const mobileUa = /iphone|ipad|ipod|android|mobile/.test(ua);
    const narrowViewport = window.matchMedia?.("(max-width: 900px)")?.matches;
    return Boolean(mobileUa || narrowViewport);
  }

  function requestNativePrintIfAvailable(html, title) {
    const nativeHandler = window.webkit?.messageHandlers?.nativePrint;
    if (!nativeHandler || typeof nativeHandler.postMessage !== "function") return false;
    try {
      nativeHandler.postMessage({
        html: String(html || ""),
        title: String(title || "")
      });
      return true;
    } catch {
      return false;
    }
  }

  let inlinePrintCleanupTimer = null;
  let inlinePrintAfterprintHandler = null;

  function ensureInlinePrintHost() {
    let host = document.getElementById("wtp-print-root") || document.getElementById("plannerBasicPrintHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "wtp-print-root";
      host.setAttribute("aria-hidden", "true");
      host.style.display = "none";
      document.body.appendChild(host);
    } else if (host.id !== "wtp-print-root") {
      host.id = "wtp-print-root";
    }
    return host;
  }

  function clearInlinePrintMode() {
    if (inlinePrintCleanupTimer) {
      clearTimeout(inlinePrintCleanupTimer);
      inlinePrintCleanupTimer = null;
    }
    if (inlinePrintAfterprintHandler) {
      window.removeEventListener("afterprint", inlinePrintAfterprintHandler);
      inlinePrintAfterprintHandler = null;
    }
    document.body.removeAttribute("data-basic-print");
    document.body.classList.remove("wtp-print-mode");
    const host = document.getElementById("wtp-print-root") || document.getElementById("plannerBasicPrintHost");
    if (host) {
      host.innerHTML = "";
      host.setAttribute("aria-hidden", "true");
      host.style.display = "none";
    }
  }

  if (typeof window !== "undefined") {
    window.clearInlinePrintMode = clearInlinePrintMode;
  }

  function printInlineBasicDocument(bodyMarkup, documentTitle) {
    void documentTitle;
    clearInlinePrintMode();
    const host = ensureInlinePrintHost();
    host.innerHTML = `
      <style>${getPlannerBasicPrintStyles()}</style>
      <article class="planner-basic-print-paper">
        ${bodyMarkup}
      </article>
    `;
    host.setAttribute("aria-hidden", "false");
    host.style.display = "block";
    document.body.setAttribute("data-basic-print", "true");
    document.body.classList.add("wtp-print-mode");
    inlinePrintAfterprintHandler = () => {
      window.setTimeout(clearInlinePrintMode, 250);
    };
    window.addEventListener("afterprint", inlinePrintAfterprintHandler, { once: true });
    inlinePrintCleanupTimer = window.setTimeout(() => {
      clearInlinePrintMode();
    }, 60000);
    try {
      // Keep print call inside the same user gesture turn for iOS Safari/WebView reliability.
      void host.offsetHeight;
      window.print();
    } catch {
      clearInlinePrintMode();
    }
    return true;
  }

  function openBasicPrintWindow(track = "wrestling") {
    const safeTrack = normalizeTrack(track);
    const bodyMarkup = safeTrack === "lifting"
      ? buildLiftingBasicPrintMarkup()
      : buildWrestlingBasicPrintMarkup();
    const documentTitle = safeTrack === "lifting"
      ? tr({ en: "Lifting Plan - Print", es: "Plan Lifting - Imprimir" })
      : tr({ en: "Wrestling Plan - Print", es: "Plan de Lucha - Imprimir" });
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${escapePrintHtml(documentTitle)}</title>
          <style>${getPlannerBasicPrintStyles()}</style>
        </head>
        <body>${bodyMarkup}</body>
      </html>
    `;

    if (requestNativePrintIfAvailable(html, documentTitle)) {
      return true;
    }
    return printInlineBasicDocument(bodyMarkup, documentTitle);
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
        els.overtimeAlert.textContent = tr({
          en: `Time exceeded: ${used} / ${planned} min. Adjust category times.`,
          es: `Tiempo excedido: ${used} / ${planned} min. Ajusta los tiempos por categoria.`
        });
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
        title: tr({ en: "Lifting & Conditioning Lab", es: "Laboratorio de Lifting y Conditioning" }),
        subtitle: tr({ en: "Build 7-day strength protocols with a live exercise library.", es: "Crea protocolos de fuerza de 7 dias con libreria de ejercicios en vivo." })
      };
    }
    if (track === "mental") {
      return {
        title: tr({ en: "Mind & Focus Lab", es: "Laboratorio de Mente y Enfoque" }),
        subtitle: tr({ en: "Visual games for reaction, tactical decisions, and competitive focus.", es: "Juegos visuales para reaccion, decisiones tacticas y enfoque competitivo." })
      };
    }
    return {
      title: tr({ en: "Wrestling Training Planner", es: "Planificador de Entrenamiento de Lucha" }),
      subtitle: tr({ en: "Build and assign wrestling practice plans.", es: "Crea y asigna planes de practica de lucha." })
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

  function clearBlockingPlannerOverlays() {
    try {
      if (typeof window.clearInlinePrintMode === "function") {
        window.clearInlinePrintMode();
      } else {
        document.body.removeAttribute("data-basic-print");
        document.body.classList.remove("wtp-print-mode");
        const printHost = document.getElementById("wtp-print-root") || document.getElementById("plannerBasicPrintHost");
        if (printHost) {
          printHost.innerHTML = "";
          printHost.setAttribute("aria-hidden", "true");
          printHost.style.display = "none";
        }
      }
    } catch {}

    // The profile cropper is a user-controlled modal shared across views.
    // Planner rerenders can happen while it is open, so leave it mounted.
  }

  function renderTrackPanels() {
    clearBlockingPlannerOverlays();
    const previousTrack = normalizeTrack(state.lastRenderedTrack || state.activeTrack);
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
    if (previousTrack === "mental" && activeTrack !== "mental" && state.mentalView === "game") {
      clearMentalTimers();
      stopMentalNarration();
      state.mentalSession = null;
      state.mentalResult = null;
      state.mentalView = "home";
    }
    if (activeTrack === "mental") {
      renderMentalApp();
    }
    state.lastRenderedTrack = activeTrack;
  }

  function setPlannerActiveTrack(track, { focus = false } = {}) {
    const nextTrack = normalizeTrack(track);
    const changed = nextTrack !== normalizeTrack(state.activeTrack);
    state.activeTrack = nextTrack;
    if (changed || state.lastRenderedTrack !== nextTrack) {
      renderTrackPanels();
    }
    if (focus) {
      focusPlannerWindow(root, { smooth: true });
    }
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

  function persistMentalScores() {
    state.mentalScores = normalizeMentalScoreValue(state.mentalScores || buildDefaultMentalScores());
    writeJson(STORAGE_KEYS.mentalScores, state.mentalScores);
  }

  function normalizeMentalLeaderboardRole(role) {
    const raw = String(role || "").trim().toLowerCase();
    if (!raw) return "athlete";
    if (raw === "administrator" || raw === "head_coach") return "coach";
    if (raw === "coach" || raw === "admin" || raw === "athlete" || raw === "parent") return raw;
    return "athlete";
  }

  function getMentalLeaderboardRoleLabel(role) {
    return getMentalRoleLabel(role);
  }

  function getPlannerSharedCollectionName() {
    const value = typeof FIREBASE_SHARED_COLLECTION === "string" ? FIREBASE_SHARED_COLLECTION : "";
    return value || "shared_app";
  }

  function getMentalLeaderboardEntriesRef(gameKey) {
    const safeKey = String(gameKey || "").trim().toLowerCase();
    if (!safeKey) return null;
    if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
    try {
      const docId = `mental_game_leaderboard_${safeKey}`;
      return firebaseFirestoreInstance
        .collection(getPlannerSharedCollectionName())
        .doc(docId)
        .collection("entries");
    } catch {
      return null;
    }
  }

  function normalizeMentalLeaderboardEntry(raw = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    const uid = String(source.uid || source.id || "").trim();
    const score = Math.max(0, parseInt(String(source.bestScore ?? source.mentalScore ?? 0), 10) || 0);
    const plays = Math.max(0, parseInt(String(source.plays || 0), 10) || 0);
    const name = String(source.name || source.email || "").trim() || (uid ? `${tr({ en: "User", es: "Usuario" })} ${uid.slice(0, 6)}` : tr({ en: "User", es: "Usuario" }));
    return {
      uid,
      name,
      role: normalizeMentalLeaderboardRole(source.role),
      bestScore: score,
      plays,
      updatedAtIso: String(source.updatedAtIso || "").trim()
    };
  }

  function getMentalLeaderboardRows(gameKey) {
    const safeKey = String(gameKey || "").trim().toLowerCase();
    const rows = Array.isArray(state.mentalLeaderboard?.[safeKey]) ? state.mentalLeaderboard[safeKey] : [];
    return rows
      .map((item) => normalizeMentalLeaderboardEntry(item))
      .filter(Boolean)
      .sort((left, right) => right.bestScore - left.bestScore)
      .slice(0, GLOBAL_MENTAL_LEADERBOARD_LIMIT);
  }

  function upsertLocalMentalLeaderboardEntry(gameKey, entry = {}) {
    const safeKey = String(gameKey || "").trim().toLowerCase();
    if (!safeKey || !MENTAL_GAME_META[safeKey]) return;
    const normalized = normalizeMentalLeaderboardEntry(entry);
    if (!normalized.uid) return;
    const currentRows = Array.isArray(state.mentalLeaderboard?.[safeKey]) ? state.mentalLeaderboard[safeKey] : [];
    const nextRows = currentRows
      .map((item) => normalizeMentalLeaderboardEntry(item))
      .filter((item) => item.uid && item.uid !== normalized.uid);
    nextRows.push(normalized);
    state.mentalLeaderboard[safeKey] = nextRows
      .sort((left, right) => right.bestScore - left.bestScore)
      .slice(0, GLOBAL_MENTAL_LEADERBOARD_LIMIT);
  }

  function renderMentalLeaderboardRows(gameKey) {
    const rows = getMentalLeaderboardRows(gameKey);
    if (!rows.length) {
      return `<li class="planner-mental-leader-empty">${escapeHtml(tr({ en: "No scores yet.", es: "Aun no hay puntuaciones." }))}</li>`;
    }
    return rows.map((entry, index) => `
      <li class="planner-mental-leader-row">
        <span class="planner-mental-leader-rank">#${index + 1}</span>
        <div class="planner-mental-leader-user">
          <strong>${escapeHtml(entry.name)}</strong>
          <span>${escapeHtml(getMentalLeaderboardRoleLabel(entry.role))}</span>
        </div>
        <strong class="planner-mental-leader-score">${escapeHtml(entry.bestScore)}</strong>
      </li>
    `).join("");
  }

  function renderMentalLeaderboardSection() {
    const cards = Object.entries(MENTAL_GAME_META).map(([gameKey, meta]) => {
      const localizedMeta = getLocalizedMentalMeta(gameKey);
      return `
      <article class="planner-mental-leader-game">
        <header>
          <h5>${escapeHtml(localizedMeta.title)}</h5>
          <span>${escapeHtml(localizedMeta.duration)}s</span>
        </header>
        <ol class="planner-mental-leader-list">${renderMentalLeaderboardRows(gameKey)}</ol>
      </article>
    `;
    }).join("");
    const status = String(state.mentalLeaderboardStatus || "").trim() || tr({ en: "Loading global leaderboard...", es: "Cargando leaderboard global..." });
    return `
      <section class="planner-mental-card planner-mental-leaderboard-card">
        <div class="planner-mental-game-header">
          <div>
            <h4>${escapeHtml(tr({ en: "Global Leaderboard", es: "Leaderboard Global" }))}</h4>
            <p class="small muted">${escapeHtml(tr({ en: "Top 10 records per game across all users.", es: "Top 10 por juego entre todos los usuarios." }))}</p>
          </div>
          <span class="planner-mental-game-badge">${escapeHtml(tr({ en: "Top 10", es: "Top 10" }))}</span>
        </div>
        <p class="small muted planner-mental-leader-status">${escapeHtml(status)}</p>
        <div class="planner-mental-leader-grid">${cards}</div>
      </section>
    `;
  }

  function stopMentalLeaderboardSync() {
    const unsubs = Array.isArray(state.mentalLeaderboardUnsubs) ? state.mentalLeaderboardUnsubs : [];
    unsubs.forEach((unsub) => {
      if (typeof unsub !== "function") return;
      try {
        unsub();
      } catch {
        // ignore unsubscribe errors
      }
    });
    state.mentalLeaderboardUnsubs = [];
    state.mentalLeaderboardLoadedKeys = {};
  }

  function startMentalLeaderboardSync() {
    stopMentalLeaderboardSync();
    state.mentalLeaderboard = buildDefaultMentalLeaderboard();
    state.mentalLeaderboardReady = false;
    state.mentalLeaderboardStatus = tr({ en: "Loading global leaderboard...", es: "Cargando leaderboard global..." });
    const gameKeys = Object.keys(MENTAL_GAME_META);
    if (!gameKeys.length) {
      state.mentalLeaderboardReady = true;
      state.mentalLeaderboardStatus = tr({ en: "No games available.", es: "No hay juegos disponibles." });
      return;
    }
    if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) {
      state.mentalLeaderboardReady = true;
      state.mentalLeaderboardStatus = tr({ en: "Leaderboard unavailable while Firebase is offline.", es: "El leaderboard no esta disponible mientras Firebase esta fuera de linea." });
      renderMentalApp();
      return;
    }
    if (!getPlannerAuthUser()?.id) {
      state.mentalLeaderboardReady = true;
      state.mentalLeaderboardStatus = tr({ en: "Sign in to load leaderboard data.", es: "Inicia sesion para cargar los datos del leaderboard." });
      renderMentalApp();
      return;
    }
    let loadedCount = 0;
    const markLoaded = (gameKey) => {
      if (state.mentalLeaderboardLoadedKeys[gameKey]) return;
      state.mentalLeaderboardLoadedKeys[gameKey] = true;
      loadedCount += 1;
    };
    gameKeys.forEach((gameKey) => {
      const entriesRef = getMentalLeaderboardEntriesRef(gameKey);
      if (!entriesRef) {
        state.mentalLeaderboard[gameKey] = [];
        markLoaded(gameKey);
        return;
      }
      const unsub = entriesRef
        .orderBy("bestScore", "desc")
        .limit(GLOBAL_MENTAL_LEADERBOARD_LIMIT)
        .onSnapshot((snapshot) => {
          const rows = snapshot.docs
            .map((doc) => normalizeMentalLeaderboardEntry({ id: doc.id, ...(doc.data() || {}) }))
            .filter(Boolean)
            .sort((left, right) => right.bestScore - left.bestScore)
            .slice(0, GLOBAL_MENTAL_LEADERBOARD_LIMIT);
          state.mentalLeaderboard[gameKey] = rows;
          markLoaded(gameKey);
          const totalRows = gameKeys.reduce((sum, key) => sum + getMentalLeaderboardRows(key).length, 0);
          state.mentalLeaderboardReady = loadedCount >= gameKeys.length;
          if (state.mentalLeaderboardReady) {
            state.mentalLeaderboardStatus = totalRows
              ? tr({ en: "Live leaderboard synced across all users.", es: "Leaderboard en vivo sincronizado para todos los usuarios." })
              : tr({ en: "No scores yet. Complete a game to set the first records.", es: "Aun no hay puntuaciones. Completa un juego para registrar los primeros records." });
          } else {
            state.mentalLeaderboardStatus = tr({
              en: `Loading global leaderboard (${loadedCount}/${gameKeys.length})...`,
              es: `Cargando leaderboard global (${loadedCount}/${gameKeys.length})...`
            });
          }
          renderMentalApp();
        }, (err) => {
          console.warn("Mental leaderboard sync failed", err);
          state.mentalLeaderboard[gameKey] = [];
          markLoaded(gameKey);
          state.mentalLeaderboardReady = loadedCount >= gameKeys.length;
          state.mentalLeaderboardStatus = tr({ en: "Could not sync leaderboard right now.", es: "No se pudo sincronizar el leaderboard ahora." });
          renderMentalApp();
        });
      state.mentalLeaderboardUnsubs.push(unsub);
    });
  }

  async function publishMentalLeaderboardResult(gameKey, result) {
    const safeGameKey = String(gameKey || "").trim().toLowerCase();
    if (!safeGameKey || !MENTAL_GAME_META[safeGameKey]) return;
    const entriesRef = getMentalLeaderboardEntriesRef(safeGameKey);
    const authUser = getPlannerAuthUser();
    if (!entriesRef || !authUser?.id) return;
    const uid = String(authUser.id || "").trim();
    if (!uid) return;
    const profile = getPlannerProfile() || {};
    const name = String(profile?.name || authUser?.email || "").trim() || `${tr({ en: "User", es: "Usuario" })} ${uid.slice(0, 6)}`;
    const role = normalizeMentalLeaderboardRole(profile?.role || authUser?.role);
    const score = Math.max(0, parseInt(String(result?.mentalScore || 0), 10) || 0);
    const accuracy = Math.max(0, parseInt(String(result?.accuracy || 0), 10) || 0);
    const speedScore = Math.max(0, parseInt(String(result?.speedScore || 0), 10) || 0);
    const controlScore = Math.max(
      0,
      parseInt(String(result?.controlScore ?? result?.consistencyScore ?? 0), 10) || 0
    );
    const entryRef = entriesRef.doc(uid);
    try {
      const existingSnap = await entryRef.get();
      const existing = existingSnap.exists ? (existingSnap.data() || {}) : {};
      const previousBest = Math.max(0, parseInt(String(existing.bestScore ?? existing.mentalScore ?? 0), 10) || 0);
      const previousPlays = Math.max(0, parseInt(String(existing.plays || 0), 10) || 0);
      const bestScore = Math.max(previousBest, score);
      const isNewBest = score >= previousBest;
      const payload = {
        uid,
        gameKey: safeGameKey,
        name,
        email: String(profile?.email || authUser?.email || existing.email || "").trim(),
        role,
        bestScore,
        lastScore: score,
        plays: previousPlays + 1,
        updatedAt: getPlannerTimestamp(),
        updatedAtIso: new Date().toISOString()
      };
      if (isNewBest) {
        payload.bestAt = getPlannerTimestamp();
        payload.bestAccuracy = accuracy;
        payload.bestSpeedScore = speedScore;
        payload.bestControlScore = controlScore;
      } else {
        payload.bestAt = existing.bestAt || existing.updatedAt || getPlannerTimestamp();
        payload.bestAccuracy = Math.max(0, parseInt(String(existing.bestAccuracy || 0), 10) || 0);
        payload.bestSpeedScore = Math.max(0, parseInt(String(existing.bestSpeedScore || 0), 10) || 0);
        payload.bestControlScore = Math.max(0, parseInt(String(existing.bestControlScore || 0), 10) || 0);
      }
      if (!existingSnap.exists) {
        payload.createdAt = getPlannerTimestamp();
      }
      await entryRef.set(payload, { merge: true });
      upsertLocalMentalLeaderboardEntry(safeGameKey, {
        uid,
        name,
        role,
        bestScore,
        plays: previousPlays + 1,
        updatedAtIso: payload.updatedAtIso
      });
      const totalRows = Object.keys(MENTAL_GAME_META).reduce((sum, key) => sum + getMentalLeaderboardRows(key).length, 0);
      if (totalRows > 0) {
        state.mentalLeaderboardStatus = tr({ en: "Live leaderboard synced across all users.", es: "Leaderboard en vivo sincronizado para todos los usuarios." });
      }
      if (state.mentalView === "home" || state.mentalView === "progress") {
        renderMentalApp();
      }
    } catch (err) {
      console.warn("Failed to publish mental leaderboard result", err);
      state.mentalLeaderboardStatus = tr({ en: "Could not publish leaderboard result right now.", es: "No se pudo publicar el resultado del leaderboard ahora." });
    }
  }

  function getMentalGameStats(gameKey) {
    return state.mentalScores?.gameStats?.[gameKey] || {
      plays: 0,
      bestScore: 0,
      averageScore: 0,
      lastScore: 0,
      averageReactionMs: 0,
      lastReactionMs: 0,
      details: {}
    };
  }

  function getMentalAverageScore() {
    const sessions = Math.max(0, parseInt(String(state.mentalScores?.totalSessions || 0), 10) || 0);
    if (!sessions) return 0;
    return Math.round((parseInt(String(state.mentalScores?.totalMentalScore || 0), 10) || 0) / sessions);
  }

  function formatReactionSecondsLabel(milliseconds = 0) {
    const ms = Math.max(0, parseInt(String(milliseconds || 0), 10) || 0);
    if (!ms) return "-";
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getMentalAverageChipLabel(gameKey) {
    if (gameKey === MENTAL_GAME_KEYS.GO_NO_GO) {
      return tr({ en: "Avg reaction", es: "Reaccion prom." });
    }
    return tr({ en: "Average", es: "Promedio" });
  }

  function getMentalAverageChipValue(gameKey, stats = {}) {
    if (gameKey === MENTAL_GAME_KEYS.GO_NO_GO) {
      const fallbackMs = Math.max(0, parseInt(String(stats?.details?.avgRT || 0), 10) || 0);
      return formatReactionSecondsLabel(stats.averageReactionMs || fallbackMs);
    }
    return String(stats.averageScore || 0);
  }

  function clearMentalTimers() {
    (state.mentalTimers || []).forEach((timerId) => {
      clearTimeout(timerId);
      clearInterval(timerId);
    });
    state.mentalTimers = [];
  }

  function trackMentalTimer(timerId) {
    if (!timerId && timerId !== 0) return timerId;
    if (!Array.isArray(state.mentalTimers)) state.mentalTimers = [];
    state.mentalTimers.push(timerId);
    return timerId;
  }

  function supportsMentalNarration() {
    return Boolean(
      typeof window !== "undefined"
      && window.speechSynthesis
      && typeof window.speechSynthesis.speak === "function"
      && typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  }

  const MENTAL_NARRATION_VOICE_HINTS = {
    en: ["aria", "jenny", "samantha", "allison", "ava", "emma", "guy", "davis", "david", "alex", "google us english", "google uk english"],
    es: ["helena", "elvira", "paulina", "monica", "marta", "sabina", "google español", "google spanish"],
    any: ["microsoft", "google", "premium", "neural", "natural"]
  };
  const MENTAL_NARRATION_AVOID_TOKENS = ["whisper", "novelty", "child", "kid", "junior", "robot"];

  function scoreMentalNarrationVoice(voice, langPrefix = "en") {
    if (!voice) return -1;
    const name = String(voice.name || "").toLowerCase();
    const lang = String(voice.lang || "").toLowerCase();
    let score = 0;
    if (lang.startsWith(langPrefix)) score += 120;
    if (langPrefix === "es" && lang.startsWith("es")) score += 30;
    if (langPrefix === "en" && lang.startsWith("en")) score += 30;
    if (voice.localService === true) score += 12;
    if (voice.default === true) score += 8;
    if (MENTAL_NARRATION_VOICE_HINTS.any.some((token) => name.includes(token))) score += 24;
    const hints = langPrefix === "es" ? MENTAL_NARRATION_VOICE_HINTS.es : MENTAL_NARRATION_VOICE_HINTS.en;
    hints.forEach((token, index) => {
      if (name.includes(token)) score += 70 - (index * 2);
    });
    if (MENTAL_NARRATION_AVOID_TOKENS.some((token) => name.includes(token))) score -= 80;
    return score;
  }

  function getMentalNarrationVoice() {
    if (!supportsMentalNarration()) return null;
    const synth = window.speechSynthesis;
    const voices = typeof synth.getVoices === "function" ? synth.getVoices() : [];
    if (!Array.isArray(voices) || !voices.length) return null;
    const langPrefix = getPlannerLang() === "es" ? "es" : "en";
    const sorted = [...voices].sort((left, right) => (
      scoreMentalNarrationVoice(right, langPrefix) - scoreMentalNarrationVoice(left, langPrefix)
    ));
    return sorted[0] || null;
  }

  function stopMentalNarration() {
    if (!supportsMentalNarration()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Speech cancellation is optional.
    }
  }

  function speakMentalNarration(text, { interrupt = true } = {}) {
    const script = String(text || "").replace(/\s+/g, " ").trim();
    if (!script || state.mentalAudioMuted || !supportsMentalNarration()) return;
    try {
      if (interrupt) stopMentalNarration();
      const utterance = new SpeechSynthesisUtterance(script);
      const voice = getMentalNarrationVoice();
      if (voice) utterance.voice = voice;
      if (voice?.lang) {
        utterance.lang = voice.lang;
      } else {
        utterance.lang = getPlannerLang() === "es" ? "es-ES" : "en-US";
      }
      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Narration is optional.
    }
  }

  function setMentalAudioMuted(nextValue) {
    const muted = Boolean(nextValue);
    state.mentalAudioMuted = muted;
    writeJson(STORAGE_KEYS.mentalAudioMuted, muted);
    if (muted) stopMentalNarration();
  }

  function getMentalAudioToggleLabel() {
    return state.mentalAudioMuted
      ? tr({ en: "Unmute audio", es: "Activar audio" })
      : tr({ en: "Mute audio", es: "Silenciar audio" });
  }

  function getMentalAudioContext() {
    if (state.mentalAudioContext) return state.mentalAudioContext;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      state.mentalAudioContext = new Context();
      return state.mentalAudioContext;
    } catch {
      return null;
    }
  }

  function playMentalTone(frequency = 440, duration = 0.12, gainValue = 0.045) {
    if (state.mentalAudioMuted) return;
    const ctx = getMentalAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.004, gainValue), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    } catch {
      // Audio is optional.
    }
  }

  function playMentalCue(type = "ok") {
    if (type === "correct") {
      playMentalTone(780, 0.09, 0.05);
      trackMentalTimer(setTimeout(() => playMentalTone(980, 0.09, 0.04), 80));
      return;
    }
    if (type === "wrong") {
      playMentalTone(240, 0.14, 0.05);
      return;
    }
    if (type === "complete") {
      playMentalTone(660, 0.1, 0.05);
      trackMentalTimer(setTimeout(() => playMentalTone(880, 0.12, 0.05), 95));
      trackMentalTimer(setTimeout(() => playMentalTone(1100, 0.15, 0.045), 190));
      return;
    }
    playMentalTone(520, 0.07, 0.03);
  }

  function createMentalSession(gameKey) {
    return {
      id: makeId(),
      gameKey,
      phase: "countdown",
      countdown: 3,
      timeLeft: MENTAL_GAME_META[gameKey]?.duration || 30
    };
  }

  function isActiveMentalSession(session) {
    return Boolean(
      session
      && state.mentalView === "game"
      && state.mentalSession
      && session.id
      && state.mentalSession.id === session.id
      && state.mentalActiveGame === session.gameKey
    );
  }

  function saveMentalGameResult(gameKey, result) {
    if (!gameKey || !result || typeof result !== "object") return;
    const current = normalizeMentalScoreValue(state.mentalScores || buildDefaultMentalScores());
    const previous = current.gameStats?.[gameKey] || {
      plays: 0,
      bestScore: 0,
      averageScore: 0,
      lastScore: 0,
      averageReactionMs: 0,
      lastReactionMs: 0
    };
    const score = Math.max(0, parseInt(String(result.mentalScore || 0), 10) || 0);
    const plays = previous.plays + 1;
    const averageScore = Math.round(((previous.averageScore * previous.plays) + score) / plays);
    const reactionMs = Math.max(0, parseInt(String(result.avgRT || result.averageReactionMs || 0), 10) || 0);
    const averageReactionMs = Math.round(((previous.averageReactionMs || 0) * previous.plays + reactionMs) / plays);
    current.totalSessions += 1;
    current.totalMentalScore += score;
    current.bestMentalScore = Math.max(current.bestMentalScore, score);
    current.lastPlayed = new Date().toISOString();
    current.gameStats[gameKey] = {
      plays,
      bestScore: Math.max(previous.bestScore, score),
      averageScore,
      lastScore: score,
      averageReactionMs,
      lastReactionMs: reactionMs,
      details: {
        ...result,
        updatedAt: current.lastPlayed
      }
    };
    state.mentalScores = current;
    persistMentalScores();
  }

  function resetMentalScores() {
    state.mentalScores = buildDefaultMentalScores();
    persistMentalScores();
    triggerToast(tr({ en: "Mind & Focus progress reset.", es: "Progreso de Mente y Enfoque reiniciado." }));
    renderMentalApp();
  }

  function renderMentalHome() {
    const average = getMentalAverageScore();
    const cards = Object.entries(MENTAL_GAME_META).map(([gameKey]) => {
      const meta = getLocalizedMentalMeta(gameKey);
      const stats = getMentalGameStats(gameKey);
      const averageLabel = getMentalAverageChipLabel(gameKey);
      const averageValue = getMentalAverageChipValue(gameKey, stats);
      return `
        <article class="planner-mental-game-card">
          <span class="planner-mental-game-badge" style="background:${meta.gradient};color:#f8fafc;border-color:rgba(248,250,252,0.35);">
            ${escapeHtml(meta.duration)}s
          </span>
          <h5>${escapeHtml(meta.title)}</h5>
          <p class="small muted">${escapeHtml(meta.subtitle)}</p>
          <p class="small planner-mental-rule">${escapeHtml(meta.ruleBrief || meta.cue || "")}</p>
          <div class="planner-mental-game-meta">
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Best", es: "Mejor" }))}</span><strong>${escapeHtml(stats.bestScore || 0)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Last", es: "Ultimo" }))}</span><strong>${escapeHtml(stats.lastScore || 0)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(averageLabel)}</span><strong>${escapeHtml(averageValue)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Plays", es: "Partidas" }))}</span><strong>${escapeHtml(stats.plays || 0)}</strong></div>
          </div>
          <div class="planner-mental-actions">
            <button type="button" class="primary" data-action="mental-open-game" data-game="${escapeHtml(gameKey)}">${escapeHtml(tr({ en: "Play now", es: "Jugar ahora" }))}</button>
            <button type="button" class="ghost" data-action="mental-assign-game" data-game="${escapeHtml(gameKey)}">${escapeHtml(tr({ en: "Assign game", es: "Asignar juego" }))}</button>
          </div>
        </article>
      `;
    }).join("");

    return `
      <div class="planner-mental-grid">
        <div class="planner-mental-home-grid">
          <section class="planner-mental-hero">
            <span class="planner-mental-game-badge">${escapeHtml(tr({ en: "Coach + Athlete Mode", es: "Modo Entrenador + Atleta" }))}</span>
            <h4>${escapeHtml(tr({ en: "Train the mind like you train on the mat.", es: "Entrena la mente igual que entrenas en el tapiz." }))}</h4>
            <p class="small muted">${escapeHtml(tr({ en: "Reaction speed, tactical reads, score memory, and adaptability. Fast rounds built for wrestling performance.", es: "Velocidad de reaccion, lectura tactica, memoria de puntuacion y adaptabilidad. Rondas rapidas para rendimiento en lucha." }))}</p>
            <div class="planner-mental-actions">
              <button type="button" class="primary" data-action="mental-open-game" data-game="${escapeHtml(MENTAL_GAME_KEYS.GO_NO_GO)}">${escapeHtml(tr({ en: "Start training", es: "Comenzar entrenamiento" }))}</button>
              <button type="button" class="ghost" data-action="mental-open-progress">${escapeHtml(tr({ en: "View progress", es: "Ver progreso" }))}</button>
            </div>
          </section>
          <section class="planner-mental-card">
            <h4>${escapeHtml(tr({ en: "Athlete Snapshot", es: "Resumen del Atleta" }))}</h4>
            <div class="planner-mental-snapshot">
              <div class="planner-mental-stat"><span>${escapeHtml(tr({ en: "Sessions completed", es: "Sesiones completadas" }))}</span><strong>${escapeHtml(state.mentalScores.totalSessions || 0)}</strong></div>
              <div class="planner-mental-stat"><span>${escapeHtml(tr({ en: "Best mental score", es: "Mejor puntuacion mental" }))}</span><strong>${escapeHtml(state.mentalScores.bestMentalScore || 0)}</strong></div>
              <div class="planner-mental-stat"><span>${escapeHtml(tr({ en: "Average mental score", es: "Puntuacion mental promedio" }))}</span><strong>${escapeHtml(average)}</strong></div>
              <div class="planner-mental-stat"><span>${escapeHtml(tr({ en: "Games active", es: "Juegos activos" }))}</span><strong>${escapeHtml(Object.keys(MENTAL_GAME_META).length)}</strong></div>
            </div>
          </section>
        </div>
        <div class="planner-mental-games">${cards}</div>
        ${renderMentalLeaderboardSection()}
      </div>
    `;
  }

  function renderMentalProgress() {
    const average = getMentalAverageScore();
    const rows = Object.entries(MENTAL_GAME_META).map(([gameKey]) => {
      const meta = getLocalizedMentalMeta(gameKey);
      const stats = getMentalGameStats(gameKey);
      const averageLabel = getMentalAverageChipLabel(gameKey);
      const averageValue = getMentalAverageChipValue(gameKey, stats);
      return `
        <article class="planner-mental-card">
          <div class="planner-mental-game-header">
            <div>
              <h4>${escapeHtml(meta.title)}</h4>
              <p class="small muted">${escapeHtml(meta.subtitle)}</p>
            </div>
            <span class="planner-mental-game-badge">${escapeHtml(stats.plays || 0)} ${escapeHtml(tr({ en: "plays", es: "partidas" }))}</span>
          </div>
          <div class="planner-mental-game-meta">
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Best", es: "Mejor" }))}</span><strong>${escapeHtml(stats.bestScore || 0)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(averageLabel)}</span><strong>${escapeHtml(averageValue)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Last", es: "Ultimo" }))}</span><strong>${escapeHtml(stats.lastScore || 0)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Duration", es: "Duracion" }))}</span><strong>${escapeHtml(meta.duration)}s</strong></div>
          </div>
        </article>
      `;
    }).join("");

    return `
      <div class="planner-mental-grid">
        <section class="planner-mental-card">
          <div class="planner-mental-game-header">
            <div>
              <h4>${escapeHtml(tr({ en: "Performance Overview", es: "Resumen de Rendimiento" }))}</h4>
              <p class="small muted">${escapeHtml(tr({ en: "Track reaction, memory, tactical awareness, and adaptability progress.", es: "Da seguimiento al progreso en reaccion, memoria, lectura tactica y adaptabilidad." }))}</p>
            </div>
            <div class="planner-mental-actions">
              <button type="button" class="ghost" data-action="mental-open-home">${escapeHtml(tr({ en: "Home", es: "Inicio" }))}</button>
              <button type="button" class="ghost" data-action="mental-reset-progress">${escapeHtml(tr({ en: "Reset data", es: "Reiniciar datos" }))}</button>
            </div>
          </div>
          <div class="planner-mental-game-meta">
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Total sessions", es: "Sesiones totales" }))}</span><strong>${escapeHtml(state.mentalScores.totalSessions || 0)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Best mental score", es: "Mejor puntuacion mental" }))}</span><strong>${escapeHtml(state.mentalScores.bestMentalScore || 0)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Average score", es: "Puntuacion promedio" }))}</span><strong>${escapeHtml(average)}</strong></div>
            <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Games tracked", es: "Juegos registrados" }))}</span><strong>${escapeHtml(Object.keys(MENTAL_GAME_META).length)}</strong></div>
          </div>
        </section>
        ${renderMentalLeaderboardSection()}
        ${rows}
      </div>
    `;
  }

  function renderMentalResult() {
    const gameKey = state.mentalActiveGame;
    const meta = getLocalizedMentalMeta(gameKey);
    const result = state.mentalResult;
    if (!meta || !result) {
      return `<div class="planner-mental-empty">${escapeHtml(tr({ en: "No result available yet.", es: "Aun no hay resultado disponible." }))}</div>`;
    }
    const breakdownRows = Array.isArray(result.breakdown) ? result.breakdown : [];
    const breakdownHtml = breakdownRows.map((item) => {
      const value = clamp(parseInt(String(item?.value || 0), 10) || 0, 0, 100);
      return `
        <div class="planner-mental-break-row">
          <div class="planner-mental-break-row-head">
            <span>${escapeHtml(item?.label || "Metric")}</span>
            <span>${escapeHtml(value)}%</span>
          </div>
          <div class="planner-mental-progress">
            <div class="planner-mental-progress-fill" style="width:${value}%;"></div>
          </div>
        </div>
      `;
    }).join("");
    return `
      <div class="planner-mental-result">
        <span class="planner-mental-game-badge" style="background:${meta.gradient};color:#f8fafc;border-color:rgba(248,250,252,0.35);">${escapeHtml(tr({ en: "Session complete", es: "Sesion completada" }))}</span>
        <h4>${escapeHtml(meta.title)}</h4>
        <p class="small muted">${escapeHtml(result.feedback || tr({ en: "Solid round. Keep building consistency.", es: "Buena ronda. Sigue construyendo consistencia." }))}</p>
        <div class="planner-mental-game-meta">
          <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Mental score", es: "Puntuacion mental" }))}</span><strong>${escapeHtml(result.mentalScore || 0)}</strong></div>
          <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Accuracy", es: "Precision" }))}</span><strong>${escapeHtml(result.accuracy || 0)}%</strong></div>
          <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Speed", es: "Velocidad" }))}</span><strong>${escapeHtml(result.speedScore || 0)}</strong></div>
          <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Control", es: "Control" }))}</span><strong>${escapeHtml(result.controlScore ?? result.consistencyScore ?? 0)}</strong></div>
        </div>
        <div class="planner-mental-breakdown">${breakdownHtml}</div>
        <div class="planner-mental-actions">
          <button type="button" class="primary" data-action="mental-retry-game">${escapeHtml(tr({ en: "Play again", es: "Jugar otra vez" }))}</button>
          <button type="button" class="ghost" data-action="mental-assign-game" data-game="${escapeHtml(gameKey)}">${escapeHtml(tr({ en: "Assign game", es: "Asignar juego" }))}</button>
          <button type="button" class="ghost" data-action="mental-open-home">${escapeHtml(tr({ en: "Back home", es: "Volver al inicio" }))}</button>
        </div>
      </div>
    `;
  }

  function renderMentalCountdown(session) {
    return `
      <div class="planner-mental-countdown">
        <div>
          <span class="small muted">${escapeHtml(tr({ en: "Starting in", es: "Comienza en" }))}</span>
          <strong>${escapeHtml(session.countdown || 0)}</strong>
          <div class="planner-mental-actions">
            <button type="button" class="ghost" data-action="mental-toggle-audio">${escapeHtml(getMentalAudioToggleLabel())}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderMentalGameShell(meta, session, content, sidebar = "") {
    const duration = meta?.duration || 1;
    const progress = clamp(Math.round(((duration - (session.timeLeft || 0)) / duration) * 100), 0, 100);
    return `
      <div class="planner-mental-grid">
        <section class="planner-mental-card">
          <div class="planner-mental-game-header">
            <div>
              <h4>${escapeHtml(meta.title)}</h4>
              <p class="small muted">${escapeHtml(meta.cue || meta.subtitle || "")}</p>
            </div>
            <div class="planner-mental-actions">
              <span class="planner-mental-timer">${escapeHtml(session.timeLeft || 0)}s</span>
              <button type="button" class="ghost" data-action="mental-toggle-audio">${escapeHtml(getMentalAudioToggleLabel())}</button>
              <button type="button" class="ghost" data-action="mental-exit-game">${escapeHtml(tr({ en: "Exit", es: "Salir" }))}</button>
            </div>
          </div>
          <div class="planner-mental-progress-wrap">
            <div class="planner-mental-progress">
              <div class="planner-mental-progress-fill" style="width:${progress}%;"></div>
            </div>
          </div>
          <div class="planner-mental-play-grid">
            <div class="planner-mental-stage">${content}</div>
            <aside class="planner-mental-side">${sidebar}</aside>
          </div>
        </section>
      </div>
    `;
  }

  function renderGoNoGoGame(meta, session) {
    const stimulusClass = session.stimulusType === "go"
      ? "go"
      : session.stimulusType === "no"
        ? "no"
        : "wait";
    const label = session.stimulusType === "go"
      ? tr({ en: "GREEN", es: "VERDE" })
      : session.stimulusType === "no"
        ? tr({ en: "RED", es: "ROJO" })
        : tr({ en: "WAIT", es: "ESPERA" });
    const avgReaction = session.reactionTimes?.length
      ? Math.round(session.reactionTimes.reduce((sum, value) => sum + value, 0) / session.reactionTimes.length)
      : 0;
    const content = `
      <div
        class="planner-mental-stimulus planner-mental-stimulus-hitbox planner-mental-go-zone ${stimulusClass}"
        data-action="mental-go-tap"
        role="button"
        tabindex="0"
        aria-label="${escapeHtml(tr({ en: "Tap anywhere in this color area", es: "Toca en cualquier parte de esta area de color" }))}"
      >
        <strong>${escapeHtml(label)}</strong>
        <span class="planner-mental-go-helper">${escapeHtml(tr({ en: "Tap anywhere in the color area", es: "Toca en cualquier parte del area de color" }))}</span>
      </div>
    `;
    const sidebar = `
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Correct taps", es: "Toques correctos" }))}</span><strong>${escapeHtml(session.hits || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Missed greens", es: "Verdes perdidos" }))}</span><strong>${escapeHtml(session.misses || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "False taps", es: "Toques falsos" }))}</span><strong>${escapeHtml(session.falseTaps || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Avg reaction", es: "Reaccion prom." }))}</span><strong>${avgReaction ? `${escapeHtml(avgReaction)} ms` : "-"}</strong></div>
    `;
    return renderMentalGameShell(meta, session, content, sidebar);
  }

  function renderMemoryGame(meta, session) {
    const canAnswer = session.roundPhase === "answer" && !session.showingSequence;
    const phaseSecondsLeft = getMentalPhaseSecondsLeft(session);
    const phaseLabel = session.roundPhase === "show"
      ? tr({ en: "Watch the full sequence", es: "Mira la secuencia completa" })
      : session.roundPhase === "feedback"
        ? tr({ en: "Round complete", es: "Ronda completada" })
        : tr({ en: "Repeat from memory", es: "Repite de memoria" });
    const phaseTimerLabel = phaseSecondsLeft
      ? tr({
          en: `${phaseSecondsLeft}s left in this phase`,
          es: `${phaseSecondsLeft}s restantes en esta fase`
        })
      : "";
    const sequenceHtml = (
      session.showingSequence
        ? (session.sequence || []).map((name, index) => {
            const active = session.showingSequence && index === session.showIndex;
            return `
              <span
                class="planner-mental-seq-item${active ? " active" : ""}"
                style="${getMentalColorSurfaceStyle(name)}"
              >${escapeHtml(getMentalColorLabel(name))}</span>
            `;
          })
        : Array.from({ length: (session.sequence || []).length || Math.max((session.input || []).length, 1) }, (_, index) => {
            const inputColor = session.input?.[index] || "";
            const hasSelection = Boolean(inputColor);
            const label = hasSelection
              ? getMentalColorLabel(inputColor)
              : tr({ en: `Step ${index + 1}`, es: `Paso ${index + 1}` });
            return `
              <span
                class="planner-mental-seq-item${hasSelection ? " active" : ""}"
                style="${getMentalColorSurfaceStyle(inputColor, { placeholder: !hasSelection })}"
              >${escapeHtml(label)}</span>
            `;
          })
    ).join("");
    const wrongFeedback = session.feedbackState === "wrong"
      ? `
        <div class="planner-mental-chip planner-status-error">
          <span>${escapeHtml(tr({ en: "Feedback", es: "Feedback" }))}</span>
          <strong>${escapeHtml(session.feedbackMessage || tr({ en: "[X] Wrong sequence", es: "[X] Secuencia incorrecta" }))}</strong>
        </div>
      `
      : "";
    const colorButtons = MENTAL_COLORS.map((color) => `
      <button
        type="button"
        class="planner-mental-color-btn ${escapeHtml(color.key)}"
        data-action="mental-memory-tap"
        data-color="${escapeHtml(color.name)}"
        ${canAnswer ? "" : "disabled"}
      >${escapeHtml(getMentalColorLabel(color.name))}</button>
    `).join("");
    const content = `
      <div class="planner-mental-actions">
        <span class="planner-mental-game-badge">${escapeHtml(tr({ en: "Level", es: "Nivel" }))} ${escapeHtml(session.level || 1)}</span>
        <span class="small muted">${escapeHtml(phaseLabel)}${phaseTimerLabel ? ` - ${escapeHtml(phaseTimerLabel)}` : ""}</span>
      </div>
      ${wrongFeedback}
      <div class="planner-mental-seq">${sequenceHtml || `<span class="small muted">${escapeHtml(tr({ en: "Preparing sequence...", es: "Preparando secuencia..." }))}</span>`}</div>
      <div class="planner-mental-color-grid">${colorButtons}</div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Current input", es: "Entrada actual" }))}</span><strong>${escapeHtml((session.input || []).map((value) => getMentalColorLabel(value)).join(" • ") || tr({ en: "Waiting...", es: "Esperando..." }))}</strong></div>
    `;
    const sidebar = `
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Correct rounds", es: "Rondas correctas" }))}</span><strong>${escapeHtml(session.correctRounds || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Wrong rounds", es: "Rondas incorrectas" }))}</span><strong>${escapeHtml(session.wrongRounds || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Max level", es: "Nivel maximo" }))}</span><strong>${escapeHtml(session.maxLevel || 1)}</strong></div>
    `;
    return renderMentalGameShell(meta, session, content, sidebar);
  }

  function renderDecisionGame(meta, session) {
    const current = session.currentQuestion;
    const options = (current?.options || []).map((option, index) => `
      <button type="button" class="ghost" data-action="mental-decision-answer" data-option-index="${index}">${escapeHtml(option)}</button>
    `).join("");
    const averageTime = session.times?.length
      ? Math.round(session.times.reduce((sum, value) => sum + value, 0) / session.times.length)
      : 0;
    const content = current ? `
      <div class="planner-mental-card">
        <span class="small muted">${escapeHtml(tr({ en: "Scenario", es: "Escenario" }))}</span>
        <h4>${escapeHtml(current.prompt)}</h4>
      </div>
      <div class="planner-mental-options">${options}</div>
    ` : `<div class="planner-mental-empty">${escapeHtml(tr({ en: "Loading scenario...", es: "Cargando escenario..." }))}</div>`;
    const sidebar = `
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Questions", es: "Preguntas" }))}</span><strong>${escapeHtml(session.questions || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Correct", es: "Correctas" }))}</span><strong>${escapeHtml(session.correct || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Avg time", es: "Tiempo prom." }))}</span><strong>${averageTime ? `${escapeHtml(averageTime)} ms` : "-"}</strong></div>
    `;
    return renderMentalGameShell(meta, session, content, sidebar);
  }

  function renderScoreGame(meta, session) {
    const averageTime = session.times?.length
      ? Math.round(session.times.reduce((sum, value) => sum + value, 0) / session.times.length)
      : 0;
    const sequenceHtml = (session.sequence || []).map((item, index) => `
      <div class="planner-mental-seq-item active">${escapeHtml(index + 1)}. ${escapeHtml(item.text)}</div>
    `).join("");
    const sequenceBlock = `
      <div class="planner-mental-card">
        <span class="small muted">${escapeHtml(session.showingSequence ? tr({ en: "Memorize sequence", es: "Memoriza la secuencia" }) : tr({ en: "Score sequence (always visible)", es: "Secuencia de score (siempre visible)" }))}</span>
        <div class="planner-mental-grid">${sequenceHtml || `<span class="small muted">${escapeHtml(tr({ en: "Preparing sequence...", es: "Preparando secuencia..." }))}</span>`}</div>
      </div>
    `;
    let content = "";
    if (session.showingSequence) {
      content = sequenceBlock;
    } else if (session.question) {
      const options = (session.question.options || []).map((option, index) => `
        <button type="button" class="ghost" data-action="mental-score-answer" data-option-index="${index}">${escapeHtml(option)}</button>
      `).join("");
      content = `
        ${sequenceBlock}
        <div class="planner-mental-card">
          <span class="small muted">${escapeHtml(tr({ en: "Question", es: "Pregunta" }))}</span>
          <h4>${escapeHtml(tr({ en: "Who is winning after that sequence?", es: "Quien va ganando despues de esa secuencia?" }))}</h4>
        </div>
        <div class="planner-mental-options">${options}</div>
      `;
    } else {
      content = `<div class="planner-mental-empty">${escapeHtml(tr({ en: "Preparing sequence...", es: "Preparando secuencia..." }))}</div>`;
    }
    const sidebar = `
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Questions", es: "Preguntas" }))}</span><strong>${escapeHtml(session.questions || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Correct", es: "Correctas" }))}</span><strong>${escapeHtml(session.correct || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Avg time", es: "Tiempo prom." }))}</span><strong>${averageTime ? `${escapeHtml(averageTime)} ms` : "-"}</strong></div>
    `;
    return renderMentalGameShell(meta, session, content, sidebar);
  }

  function renderSwitchGame(meta, session) {
    const pair = Array.isArray(session.pair) ? session.pair : [0, 0];
    const averageTime = session.times?.length
      ? Math.round(session.times.reduce((sum, value) => sum + value, 0) / session.times.length)
      : 0;
    const content = `
      <div class="planner-mental-card">
        <span class="small muted">${escapeHtml(tr({ en: "Active rule", es: "Regla activa" }))}</span>
        <h4>${escapeHtml(getMentalRuleLabel(session.rule || MENTAL_SWITCH_RULES[0]) || tr({ en: "Tap the higher number", es: "Toca el numero mas alto" }))}</h4>
      </div>
      <div class="planner-mental-switch-grid">
        <button type="button" class="primary planner-mental-switch-btn" data-action="mental-switch-choice" data-choice="left">${escapeHtml(pair[0])}</button>
        <button type="button" class="ghost planner-mental-switch-btn" data-action="mental-switch-choice" data-choice="right">${escapeHtml(pair[1])}</button>
      </div>
    `;
    const sidebar = `
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Correct", es: "Correctas" }))}</span><strong>${escapeHtml(session.correct || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Wrong", es: "Incorrectas" }))}</span><strong>${escapeHtml(session.wrong || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Rule changes", es: "Cambios de regla" }))}</span><strong>${escapeHtml(session.switches || 0)}</strong></div>
      <div class="planner-mental-chip"><span>${escapeHtml(tr({ en: "Avg time", es: "Tiempo prom." }))}</span><strong>${averageTime ? `${escapeHtml(averageTime)} ms` : "-"}</strong></div>
    `;
    return renderMentalGameShell(meta, session, content, sidebar);
  }

  function renderMentalGame() {
    const session = state.mentalSession;
    const gameKey = state.mentalActiveGame;
    const meta = getLocalizedMentalMeta(gameKey);
    if (!session || !meta) {
      return `<div class="planner-mental-empty">${escapeHtml(tr({ en: "No game selected.", es: "No hay juego seleccionado." }))}</div>`;
    }
    if (session.phase === "countdown") {
      return renderMentalCountdown(session);
    }
    if (gameKey === MENTAL_GAME_KEYS.GO_NO_GO) return renderGoNoGoGame(meta, session);
    if (gameKey === MENTAL_GAME_KEYS.MEMORY) return renderMemoryGame(meta, session);
    if (gameKey === MENTAL_GAME_KEYS.DECISION) return renderDecisionGame(meta, session);
    if (gameKey === MENTAL_GAME_KEYS.SCORE) return renderScoreGame(meta, session);
    if (gameKey === MENTAL_GAME_KEYS.SWITCH) return renderSwitchGame(meta, session);
    return `<div class="planner-mental-empty">${escapeHtml(tr({ en: "Game unavailable.", es: "Juego no disponible." }))}</div>`;
  }

  function renderMentalApp() {
    if (!els.mentalContent) return;
    if (!state.mentalLeaderboardUnsubs.length
      && typeof firebaseFirestoreInstance !== "undefined"
      && firebaseFirestoreInstance
      && getPlannerAuthUser()?.id) {
      startMentalLeaderboardSync();
    }
    if (!MENTAL_GAME_META[state.mentalActiveGame]) {
      state.mentalActiveGame = MENTAL_GAME_KEYS.GO_NO_GO;
    }
    let html = "";
    if (state.mentalView === "progress") {
      html = renderMentalProgress();
    } else if (state.mentalView === "game") {
      html = renderMentalGame();
    } else if (state.mentalView === "result") {
      html = renderMentalResult();
    } else {
      html = renderMentalHome();
    }
    els.mentalContent.innerHTML = html;
  }

  function openMentalHome() {
    clearMentalTimers();
    stopMentalNarration();
    state.mentalSession = null;
    state.mentalResult = null;
    state.mentalView = "home";
    renderMentalApp();
  }

  function openMentalProgress() {
    clearMentalTimers();
    stopMentalNarration();
    state.mentalSession = null;
    state.mentalResult = null;
    state.mentalView = "progress";
    renderMentalApp();
  }

  function buildGoNoGoResult(session) {
    const attempts = (session.hits || 0) + (session.misses || 0) + (session.falseTaps || 0);
    const accuracy = attempts ? Math.round(((session.hits || 0) / attempts) * 100) : 0;
    const avgReaction = session.reactionTimes?.length
      ? Math.round(session.reactionTimes.reduce((sum, value) => sum + value, 0) / session.reactionTimes.length)
      : 1000;
    const speedScore = clamp(Math.round(100 - ((avgReaction - 250) / 7)), 10, 100);
    const controlScore = clamp(100 - (session.falseTaps || 0) * 12, 0, 100);
    const mentalScore = Math.round((accuracy * 0.45) + (speedScore * 0.35) + (controlScore * 0.2));
    return {
      mentalScore,
      accuracy,
      speedScore,
      controlScore,
      feedback: (session.falseTaps || 0) > 3
        ? tr({ en: "Fast hands, but too impulsive. Slow down just enough to read the cue.", es: "Manos rapidas, pero muy impulsivo. Baja un poco para leer mejor la senal." })
        : accuracy > 80
          ? tr({ en: "Strong control and sharp reactions.", es: "Buen control y reacciones rapidas." })
          : tr({ en: "Good speed, now improve visual control under pressure.", es: "Buena velocidad; ahora mejora el control visual bajo presion." }),
      breakdown: [
        { label: tr({ en: "Accuracy", es: "Precision" }), value: accuracy },
        { label: tr({ en: "Speed", es: "Velocidad" }), value: speedScore },
        { label: tr({ en: "Impulse Control", es: "Control de impulso" }), value: controlScore }
      ]
    };
  }

  function buildMemoryResult(session) {
    const totalRounds = (session.correctRounds || 0) + (session.wrongRounds || 0);
    const accuracy = totalRounds ? Math.round(((session.correctRounds || 0) / totalRounds) * 100) : 0;
    const speedScore = clamp(40 + ((session.maxLevel || 1) * 10), 0, 100);
    const consistencyScore = clamp(accuracy + ((session.maxLevel || 1) * 4), 0, 100);
    const mentalScore = Math.round((accuracy * 0.4) + (speedScore * 0.25) + (consistencyScore * 0.35));
    return {
      mentalScore,
      accuracy,
      speedScore,
      consistencyScore,
      controlScore: consistencyScore,
      feedback: (session.maxLevel || 1) >= 5
        ? tr({ en: "Excellent memory depth under time pressure.", es: "Excelente profundidad de memoria bajo presion de tiempo." })
        : (session.wrongRounds || 0) > (session.correctRounds || 0)
          ? tr({ en: "Good effort, reduce rushing and lock the order first.", es: "Buen esfuerzo; reduce la prisa y fija primero el orden." })
          : tr({ en: "Solid memory work. Keep pushing one level higher.", es: "Buen trabajo de memoria. Sigue subiendo un nivel." }),
      breakdown: [
        { label: tr({ en: "Accuracy", es: "Precision" }), value: accuracy },
        { label: tr({ en: "Memory Depth", es: "Profundidad de memoria" }), value: clamp((session.maxLevel || 1) * 16, 0, 100) },
        { label: tr({ en: "Consistency", es: "Consistencia" }), value: consistencyScore }
      ]
    };
  }

  function buildDecisionResult(session) {
    const accuracy = session.questions ? Math.round(((session.correct || 0) / session.questions) * 100) : 0;
    const avgTime = session.times?.length
      ? Math.round(session.times.reduce((sum, value) => sum + value, 0) / session.times.length)
      : 3000;
    const speedScore = clamp(Math.round(100 - ((avgTime - 900) / 20)), 10, 100);
    const controlScore = clamp(accuracy + 10, 0, 100);
    const mentalScore = Math.round((accuracy * 0.5) + (speedScore * 0.3) + (controlScore * 0.2));
    return {
      mentalScore,
      accuracy,
      speedScore,
      controlScore,
      feedback: accuracy >= 80
        ? tr({ en: "Strong tactical reading under pressure.", es: "Buena lectura tactica bajo presion." })
        : avgTime < 1200
          ? tr({ en: "You are deciding fast, now improve option quality.", es: "Estas decidiendo rapido; ahora mejora la calidad de la opcion." })
          : tr({ en: "You see the position well; commit faster to the best option.", es: "Lees bien la posicion; comprometete mas rapido con la mejor opcion." }),
      breakdown: [
        { label: tr({ en: "Decision Accuracy", es: "Precision de decision" }), value: accuracy },
        { label: tr({ en: "Decision Speed", es: "Velocidad de decision" }), value: speedScore },
        { label: tr({ en: "Control", es: "Control" }), value: controlScore }
      ]
    };
  }

  function buildScoreResult(session) {
    const accuracy = session.questions ? Math.round(((session.correct || 0) / session.questions) * 100) : 0;
    const avgTime = session.times?.length
      ? Math.round(session.times.reduce((sum, value) => sum + value, 0) / session.times.length)
      : 3000;
    const speedScore = clamp(Math.round(100 - ((avgTime - 800) / 18)), 10, 100);
    const consistencyScore = clamp(accuracy + ((session.correct || 0) * 5), 0, 100);
    const mentalScore = Math.round((accuracy * 0.45) + (speedScore * 0.25) + (consistencyScore * 0.3));
    return {
      mentalScore,
      accuracy,
      speedScore,
      consistencyScore,
      controlScore: consistencyScore,
      feedback: accuracy >= 75
        ? tr({ en: "Excellent tactical memory. You tracked the sequence well.", es: "Excelente memoria tactica. Seguiste bien la secuencia." })
        : tr({ en: "Good start, track each score event with more focus.", es: "Buen inicio; sigue cada accion de puntuacion con mas enfoque." }),
      breakdown: [
        { label: tr({ en: "Score Accuracy", es: "Precision de score" }), value: accuracy },
        { label: tr({ en: "Recall Speed", es: "Velocidad de recuerdo" }), value: speedScore },
        { label: tr({ en: "Consistency", es: "Consistencia" }), value: consistencyScore }
      ]
    };
  }

  function buildSwitchResult(session) {
    const total = (session.correct || 0) + (session.wrong || 0);
    const accuracy = total ? Math.round(((session.correct || 0) / total) * 100) : 0;
    const avgTime = session.times?.length
      ? Math.round(session.times.reduce((sum, value) => sum + value, 0) / session.times.length)
      : 3000;
    const speedScore = clamp(Math.round(100 - ((avgTime - 700) / 18)), 10, 100);
    const controlScore = clamp(accuracy + Math.min((session.switches || 0) * 4, 20), 0, 100);
    const mentalScore = Math.round((accuracy * 0.45) + (speedScore * 0.25) + (controlScore * 0.3));
    return {
      mentalScore,
      accuracy,
      speedScore,
      controlScore,
      feedback: accuracy >= 80
        ? tr({ en: "Excellent adaptation between changing rules.", es: "Excelente adaptacion entre reglas cambiantes." })
        : (session.wrong || 0) > (session.correct || 0) / 2
          ? tr({ en: "Read the rule before reacting to improve control.", es: "Lee la regla antes de reaccionar para mejorar el control." })
          : tr({ en: "Good adaptability. Keep pushing cleaner transitions.", es: "Buena adaptabilidad. Sigue mejorando transiciones mas limpias." }),
      breakdown: [
        { label: tr({ en: "Accuracy", es: "Precision" }), value: accuracy },
        { label: tr({ en: "Adapt Speed", es: "Velocidad de adaptacion" }), value: speedScore },
        { label: tr({ en: "Rule Control", es: "Control de regla" }), value: controlScore }
      ]
    };
  }

  function buildMentalResultFromSession(session) {
    if (!session) return null;
    if (session.gameKey === MENTAL_GAME_KEYS.GO_NO_GO) return buildGoNoGoResult(session);
    if (session.gameKey === MENTAL_GAME_KEYS.MEMORY) return buildMemoryResult(session);
    if (session.gameKey === MENTAL_GAME_KEYS.DECISION) return buildDecisionResult(session);
    if (session.gameKey === MENTAL_GAME_KEYS.SCORE) return buildScoreResult(session);
    if (session.gameKey === MENTAL_GAME_KEYS.SWITCH) return buildSwitchResult(session);
    return null;
  }

  function finishMentalGame(session) {
    if (!isActiveMentalSession(session)) return;
    if (session.phase === "done") return;
    session.phase = "done";
    clearMentalTimers();
    stopMentalNarration();
    const result = buildMentalResultFromSession(session);
    if (!result) {
      openMentalHome();
      return;
    }
    saveMentalGameResult(session.gameKey, result);
    publishMentalLeaderboardResult(session.gameKey, result).catch((err) => {
      console.warn("Mental leaderboard publish failed", err);
    });
    state.mentalResult = result;
    state.mentalView = "result";
    playMentalCue("complete");
    renderMentalApp();
  }

  function beginMentalGameClock(session) {
    if (!isActiveMentalSession(session)) return;
    const meta = MENTAL_GAME_META[session.gameKey] || { duration: 30 };
    session.phase = "playing";
    session.timeLeft = meta.duration;
    const intervalId = setInterval(() => {
      if (!isActiveMentalSession(session)) return;
      session.timeLeft = Math.max(0, (session.timeLeft || 0) - 1);
      if (session.timeLeft <= 0) {
        finishMentalGame(session);
        return;
      }
      renderMentalApp();
    }, 1000);
    trackMentalTimer(intervalId);
  }

  function initGoNoGoSession(session) {
    session.stimulusType = "wait";
    session.expectedGo = false;
    session.waiting = false;
    session.rounds = 0;
    session.hits = 0;
    session.misses = 0;
    session.falseTaps = 0;
    session.reactionTimes = [];
    speakMentalNarration(tr({
      en: "Go No-Go. Tap green. Do not tap red. Stay calm and precise.",
      es: "Go No-Go. Toca verde. No toques rojo. Mantente calmado y preciso."
    }));

    const spawnStimulus = () => {
      if (!isActiveMentalSession(session) || session.phase !== "playing") return;
      const isGo = Math.random() > 0.35;
      session.expectedGo = isGo;
      session.stimulusType = isGo ? "go" : "no";
      session.waiting = true;
      session.stimulusStartedAt = performance.now();
      session.rounds += 1;
      renderMentalApp();
      trackMentalTimer(setTimeout(() => {
        if (!isActiveMentalSession(session) || session.phase !== "playing") return;
        if (session.waiting && session.expectedGo) {
          session.misses += 1;
          playMentalCue("wrong");
        }
        session.waiting = false;
        session.stimulusType = "wait";
        renderMentalApp();
        trackMentalTimer(setTimeout(spawnStimulus, 350 + Math.random() * 550));
      }, 650));
    };

    trackMentalTimer(setTimeout(spawnStimulus, 520));
  }

  function startMentalMemoryRound(session, roundLevel) {
    if (!isActiveMentalSession(session) || session.phase !== "playing") return;
    const safeLevel = Math.max(1, parseInt(String(roundLevel || 1), 10) || 1);
    session.level = safeLevel;
    session.sequence = Array.from({ length: safeLevel + 2 }, () => {
      const color = MENTAL_COLORS[Math.floor(Math.random() * MENTAL_COLORS.length)];
      return color.name;
    });
    session.input = [];
    session.showIndex = -1;
    session.showingSequence = true;
    session.feedbackState = "";
    session.feedbackMessage = "";
    session.roundPhase = "show";
    session.roundPhaseEndsAt = performance.now() + MEMORY_SEQUENCE_SHOW_MS;
    const roundToken = makeId();
    session.roundToken = roundToken;
    renderMentalApp();
    trackMentalTimer(setTimeout(() => {
      if (!isActiveMentalSession(session) || session.phase !== "playing" || session.roundToken !== roundToken) return;
      session.showIndex = session.sequence.length;
      session.showingSequence = false;
      session.roundPhase = "answer";
      session.roundPhaseEndsAt = performance.now() + MEMORY_SEQUENCE_RESPONSE_MS;
      renderMentalApp();
      trackMentalTimer(setTimeout(() => {
        if (!isActiveMentalSession(session) || session.phase !== "playing" || session.roundToken !== roundToken) return;
        session.wrongRounds += 1;
        playMentalCue("wrong");
        const currentLevel = Math.max(1, parseInt(String(session.level || safeLevel), 10) || safeLevel);
        const nextLevel = Math.max(1, currentLevel - 1);
        session.level = nextLevel;
        session.maxLevel = Math.max(session.maxLevel || 1, currentLevel);
        queueMentalMemoryRoundFeedback(session, {
          type: "wrong",
          message: tr({ en: "[X] Time expired", es: "[X] Se acabo el tiempo" }),
          nextLevel,
          delay: MEMORY_SEQUENCE_WRONG_FEEDBACK_MS
        });
      }, MEMORY_SEQUENCE_RESPONSE_MS));
    }, MEMORY_SEQUENCE_SHOW_MS));
  }

  function initMemorySession(session) {
    session.level = 1;
    session.correctRounds = 0;
    session.wrongRounds = 0;
    session.maxLevel = 1;
    session.sequence = [];
    session.input = [];
    session.showIndex = -1;
    session.showingSequence = true;
    speakMentalNarration(tr({
      en: "Memory Sequence. Memorize the color order, then repeat it exactly.",
      es: "Secuencia de Memoria. Memoriza el orden de colores y luego repitelo exactamente."
    }));
    startMentalMemoryRound(session, 1);
  }

  function queueMentalMemoryRoundFeedback(session, {
    type = "",
    message = "",
    nextLevel = session.level || 1,
    delay = MEMORY_SEQUENCE_WRONG_FEEDBACK_MS
  } = {}) {
    if (!isActiveMentalSession(session) || session.phase !== "playing") return;
    const feedbackToken = makeId();
    session.roundToken = feedbackToken;
    session.showingSequence = false;
    session.roundPhase = "feedback";
    session.roundPhaseEndsAt = performance.now() + delay;
    session.feedbackState = type;
    session.feedbackMessage = message;
    renderMentalApp();
    trackMentalTimer(setTimeout(() => {
      if (!isActiveMentalSession(session) || session.phase !== "playing" || session.roundToken !== feedbackToken) return;
      startMentalMemoryRound(session, nextLevel);
    }, delay));
  }

  function startMentalDecisionQuestion(session) {
    if (!isActiveMentalSession(session) || session.phase !== "playing") return;
    const localizedScenarios = MENTAL_DECISION_SCENARIOS.map((scenario) => getLocalizedDecisionScenario(scenario)).filter((scenario) => scenario.prompt && scenario.options?.length && scenario.answer);
    const scenarios = localizedScenarios.length ? localizedScenarios : MENTAL_DECISION_SCENARIOS.map((scenario) => getLocalizedDecisionScenario(scenario));
    const random = scenarios[Math.floor(Math.random() * scenarios.length)];
    session.currentQuestion = random;
    session.questionStartedAt = performance.now();
    speakMentalNarration(tr({
      en: `Quick Decision. ${random.prompt} Options: ${random.options.join(", ")}.`,
      es: `Decision Rapida. ${random.prompt} Opciones: ${random.options.join(", ")}.`
    }));
    renderMentalApp();
  }

  function initDecisionSession(session) {
    session.questions = 0;
    session.correct = 0;
    session.times = [];
    session.currentQuestion = null;
    startMentalDecisionQuestion(session);
  }

  function startMentalScoreRound(session) {
    if (!isActiveMentalSession(session) || session.phase !== "playing") return;
    const sequenceLength = 3 + Math.floor(Math.random() * 2);
    session.sequence = Array.from({ length: sequenceLength }, () => (
      getLocalizedScoreEvent(MENTAL_SCORE_EVENTS[Math.floor(Math.random() * MENTAL_SCORE_EVENTS.length)])
    ));
    session.showingSequence = true;
    session.question = null;
    if (session.sequence.length) {
      const sequenceCall = session.sequence.map((item, index) => `${index + 1}. ${item.text}`).join(". ");
      speakMentalNarration(tr({
        en: `Score Awareness. Track this sequence: ${sequenceCall}.`,
        es: `Lectura de Puntuacion. Sigue esta secuencia: ${sequenceCall}.`
      }));
    }
    renderMentalApp();
    trackMentalTimer(setTimeout(() => {
      if (!isActiveMentalSession(session) || session.phase !== "playing") return;
      let red = 0;
      let green = 0;
      session.sequence.forEach((item) => {
        red += item.delta.red;
        green += item.delta.green;
      });
      const answer = red === green
        ? getMentalScoreTiedLabel()
        : (red > green ? getMentalScoreLeadLabel("red", red - green) : getMentalScoreLeadLabel("green", green - red));
      const optionsPool = [
        answer,
        red === green ? getMentalScoreLeadLabel("red", 1) : getMentalScoreTiedLabel(),
        red > green ? getMentalScoreLeadLabel("green", red - green) : getMentalScoreLeadLabel("red", Math.max(1, green - red)),
        getMentalScoreExactLabel(red, green)
      ];
      const uniqueOptions = Array.from(new Set(optionsPool));
      while (uniqueOptions.length < 4) {
        uniqueOptions.push(getMentalScoreLeadLabel("red", Math.max(1, uniqueOptions.length)));
      }
      const options = shuffleList(uniqueOptions).slice(0, 4);
      if (!options.includes(answer)) options[0] = answer;
      session.question = {
        answer,
        options
      };
      session.showingSequence = false;
      session.questionStartedAt = performance.now();
      speakMentalNarration(tr({
        en: `Who is winning after that sequence? Options: ${options.join(", ")}.`,
        es: `Quien va ganando despues de esa secuencia? Opciones: ${options.join(", ")}.`
      }));
      renderMentalApp();
    }, 2400));
  }

  function initScoreSession(session) {
    session.questions = 0;
    session.correct = 0;
    session.times = [];
    session.sequence = [];
    session.showingSequence = true;
    session.question = null;
    startMentalScoreRound(session);
  }

  function startMentalSwitchRound(session, force = false) {
    if (!isActiveMentalSession(session) || session.phase !== "playing") return;
    const left = 1 + Math.floor(Math.random() * 9);
    let right = 1 + Math.floor(Math.random() * 9);
    while (right === left) right = 1 + Math.floor(Math.random() * 9);
    session.pair = [left, right];
    let ruleChanged = false;
    if (force || Math.random() > 0.65) {
      const nextRule = MENTAL_SWITCH_RULES[Math.floor(Math.random() * MENTAL_SWITCH_RULES.length)];
      if (force) {
        session.rule = nextRule;
        ruleChanged = true;
      } else {
        if (session.rule && nextRule.id !== session.rule.id) {
          session.switches += 1;
          ruleChanged = true;
        }
        session.rule = nextRule;
      }
    }
    if (force || ruleChanged) {
      const ruleLabel = getMentalRuleLabel(session.rule || MENTAL_SWITCH_RULES[0]) || tr({ en: "Tap the higher number", es: "Toca el numero mas alto" });
      speakMentalNarration(tr({
        en: `Rule Switch. ${ruleLabel}. Left ${left}. Right ${right}.`,
        es: `Cambio de Regla. ${ruleLabel}. Izquierda ${left}. Derecha ${right}.`
      }));
    }
    session.roundStartedAt = performance.now();
    renderMentalApp();
  }

  function initSwitchSession(session) {
    session.correct = 0;
    session.wrong = 0;
    session.switches = 0;
    session.times = [];
    session.rule = MENTAL_SWITCH_RULES[0];
    session.pair = [2, 7];
    startMentalSwitchRound(session, true);
  }

  function startMentalGameplay(session) {
    if (!isActiveMentalSession(session)) return;
    beginMentalGameClock(session);
    if (session.gameKey === MENTAL_GAME_KEYS.GO_NO_GO) {
      initGoNoGoSession(session);
    } else if (session.gameKey === MENTAL_GAME_KEYS.MEMORY) {
      initMemorySession(session);
    } else if (session.gameKey === MENTAL_GAME_KEYS.DECISION) {
      initDecisionSession(session);
    } else if (session.gameKey === MENTAL_GAME_KEYS.SCORE) {
      initScoreSession(session);
    } else if (session.gameKey === MENTAL_GAME_KEYS.SWITCH) {
      initSwitchSession(session);
    }
    renderMentalApp();
  }

  function startMentalCountdown(session) {
    if (!isActiveMentalSession(session)) return;
    session.phase = "countdown";
    session.countdown = 3;
    renderMentalApp();
    const tick = () => {
      if (!isActiveMentalSession(session)) return;
      session.countdown = Math.max(0, (session.countdown || 0) - 1);
      if (session.countdown <= 0) {
        playMentalCue("ok");
        startMentalGameplay(session);
        return;
      }
      playMentalCue("ok");
      renderMentalApp();
      trackMentalTimer(setTimeout(tick, 1000));
    };
    trackMentalTimer(setTimeout(tick, 1000));
  }

  function openMentalGame(gameKey) {
    const normalized = MENTAL_GAME_META[gameKey] ? gameKey : MENTAL_GAME_KEYS.GO_NO_GO;
    clearMentalTimers();
    stopMentalNarration();
    state.mentalActiveGame = normalized;
    state.mentalResult = null;
    state.mentalView = "game";
    state.mentalSession = createMentalSession(normalized);
    const localizedMeta = getLocalizedMentalMeta(normalized);
    speakMentalNarration(`${localizedMeta?.title || tr({ en: "Mind game", es: "Juego mental" })}. ${localizedMeta?.cue || ""}`);
    renderMentalApp();
    startMentalCountdown(state.mentalSession);
    focusPlannerWindow(els.mentalShell || root, { smooth: true });
  }

  function handleMentalGoNoGoTap() {
    const session = state.mentalSession;
    if (!isActiveMentalSession(session) || session.gameKey !== MENTAL_GAME_KEYS.GO_NO_GO || session.phase !== "playing") return;
    if (!session.waiting || session.stimulusType === "wait") return;
    const reaction = Math.round(performance.now() - (session.stimulusStartedAt || performance.now()));
    if (session.expectedGo) {
      session.hits += 1;
      if (Number.isFinite(reaction) && reaction > 0) {
        session.reactionTimes.push(reaction);
      }
      playMentalCue("correct");
    } else {
      session.falseTaps += 1;
      playMentalCue("wrong");
    }
    session.waiting = false;
    session.stimulusType = "wait";
    renderMentalApp();
  }

  function handleMentalMemoryTap(colorName) {
    const session = state.mentalSession;
    if (!isActiveMentalSession(session) || session.gameKey !== MENTAL_GAME_KEYS.MEMORY || session.phase !== "playing") return;
    if (session.showingSequence || session.roundPhase !== "answer") return;
    const selected = String(colorName || "").trim();
    if (!selected) return;
    const nextInput = [...(session.input || []), selected];
    session.input = nextInput;
    const index = nextInput.length - 1;
    if (session.sequence[index] !== selected) {
      session.wrongRounds += 1;
      const currentLevel = Math.max(1, parseInt(String(session.level || 1), 10) || 1);
      const nextLevel = Math.max(1, currentLevel - 1);
      session.level = nextLevel;
      session.maxLevel = Math.max(session.maxLevel || 1, currentLevel);
      playMentalCue("wrong");
      queueMentalMemoryRoundFeedback(session, {
        type: "wrong",
        message: tr({ en: "[X] Wrong sequence", es: "[X] Secuencia incorrecta" }),
        nextLevel,
        delay: MEMORY_SEQUENCE_WRONG_FEEDBACK_MS
      });
      return;
    }
    if (nextInput.length === session.sequence.length) {
      session.correctRounds += 1;
      const nextLevel = (session.level || 1) + 1;
      session.level = nextLevel;
      session.maxLevel = Math.max(session.maxLevel || 1, nextLevel);
      playMentalCue("correct");
      queueMentalMemoryRoundFeedback(session, {
        type: "correct",
        message: "",
        nextLevel,
        delay: MEMORY_SEQUENCE_CORRECT_FEEDBACK_MS
      });
      return;
    }
    renderMentalApp();
  }

  function handleMentalDecisionAnswer(optionIndex) {
    const session = state.mentalSession;
    if (!isActiveMentalSession(session) || session.gameKey !== MENTAL_GAME_KEYS.DECISION || session.phase !== "playing") return;
    const index = parseInt(String(optionIndex || ""), 10);
    if (!Number.isFinite(index) || index < 0 || !session.currentQuestion?.options?.[index]) return;
    const selectedOption = session.currentQuestion.options[index];
    const elapsed = Math.round(performance.now() - (session.questionStartedAt || performance.now()));
    session.times.push(Math.max(0, elapsed));
    session.questions += 1;
    if (selectedOption === session.currentQuestion.answer) {
      session.correct += 1;
      playMentalCue("correct");
    } else {
      playMentalCue("wrong");
    }
    session.currentQuestion = null;
    renderMentalApp();
    trackMentalTimer(setTimeout(() => startMentalDecisionQuestion(session), 240));
  }

  function handleMentalScoreAnswer(optionIndex) {
    const session = state.mentalSession;
    if (!isActiveMentalSession(session) || session.gameKey !== MENTAL_GAME_KEYS.SCORE || session.phase !== "playing") return;
    const index = parseInt(String(optionIndex || ""), 10);
    if (!Number.isFinite(index) || index < 0 || !session.question?.options?.[index]) return;
    const selectedOption = session.question.options[index];
    const elapsed = Math.round(performance.now() - (session.questionStartedAt || performance.now()));
    session.times.push(Math.max(0, elapsed));
    session.questions += 1;
    if (selectedOption === session.question.answer) {
      session.correct += 1;
      playMentalCue("correct");
    } else {
      playMentalCue("wrong");
    }
    session.question = null;
    session.sequence = [];
    renderMentalApp();
    trackMentalTimer(setTimeout(() => startMentalScoreRound(session), 280));
  }

  function handleMentalSwitchChoice(choice) {
    const session = state.mentalSession;
    if (!isActiveMentalSession(session) || session.gameKey !== MENTAL_GAME_KEYS.SWITCH || session.phase !== "playing") return;
    const selected = String(choice || "").trim();
    if (!selected || !session.rule?.evaluate || !Array.isArray(session.pair)) return;
    const elapsed = Math.round(performance.now() - (session.roundStartedAt || performance.now()));
    session.times.push(Math.max(0, elapsed));
    const expected = session.rule.evaluate(session.pair[0], session.pair[1]);
    if (selected === expected) {
      session.correct += 1;
      playMentalCue("correct");
    } else {
      session.wrong += 1;
      playMentalCue("wrong");
    }
    startMentalSwitchRound(session);
  }

  function handleMentalAction(action, trigger) {
    if (!String(action || "").startsWith("mental-")) return false;
    if (action === "mental-open-home") {
      openMentalHome();
      return true;
    }
    if (action === "mental-open-progress") {
      openMentalProgress();
      return true;
    }
    if (action === "mental-open-game") {
      openMentalGame(trigger?.dataset?.game);
      return true;
    }
    if (action === "mental-toggle-audio") {
      setMentalAudioMuted(!state.mentalAudioMuted);
      triggerToast(state.mentalAudioMuted
        ? tr({ en: "Mental game audio muted.", es: "Audio de juegos mentales silenciado." })
        : tr({ en: "Mental game audio enabled.", es: "Audio de juegos mentales activado." }));
      renderMentalApp();
      return true;
    }
    if (action === "mental-assign-game") {
      const gameKey = String(trigger?.dataset?.game || state.mentalActiveGame || MENTAL_GAME_KEYS.GO_NO_GO).trim().toLowerCase();
      openAssignModal({
        track: "mental",
        mentalGameKey: gameKey
      });
      return true;
    }
    if (action === "mental-retry-game") {
      openMentalGame(state.mentalActiveGame || MENTAL_GAME_KEYS.GO_NO_GO);
      return true;
    }
    if (action === "mental-exit-game") {
      openMentalHome();
      return true;
    }
    if (action === "mental-reset-progress") {
      const shouldReset = window.confirm("Reset all Mind & Focus progress data?");
      if (shouldReset) resetMentalScores();
      return true;
    }
    if (action === "mental-go-tap") {
      handleMentalGoNoGoTap();
      return true;
    }
    if (action === "mental-memory-tap") {
      handleMentalMemoryTap(trigger?.dataset?.color);
      return true;
    }
    if (action === "mental-decision-answer") {
      handleMentalDecisionAnswer(trigger?.dataset?.optionIndex);
      return true;
    }
    if (action === "mental-score-answer") {
      handleMentalScoreAnswer(trigger?.dataset?.optionIndex);
      return true;
    }
    if (action === "mental-switch-choice") {
      handleMentalSwitchChoice(trigger?.dataset?.choice);
      return true;
    }
    return false;
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

  function getSharedLiftingLibraryDocRef() {
    try {
      if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
      return firebaseFirestoreInstance.collection("shared_app").doc("uwc_lifting_library");
    } catch {
      return null;
    }
  }

  function getLegacyLiftingLibraryDocRef() {
    const settingsRef = getPlannerWorkspaceCollectionRef("lifting_settings");
    if (!settingsRef) return null;
    return settingsRef.doc("library");
  }

  function getLiftingLibraryDocRef() {
    return getSharedLiftingLibraryDocRef() || getLegacyLiftingLibraryDocRef();
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
          ${escapeHtml(day.name || tr({ en: `Day ${index + 1}`, es: `Dia ${index + 1}` }))}${count ? ` (${count})` : ""}
        </button>
      `;
    }).join("");
    els.liftingDayTabs.innerHTML = html;
  }

  function renderLiftingExerciseList() {
    if (!els.liftingExerciseList) return;
    const day = getActiveLiftingDay();
    if (!day || !Array.isArray(day.exercises) || !day.exercises.length) {
      els.liftingExerciseList.innerHTML = `<p class="planner-lifting-empty">${escapeHtml(tr({ en: "No exercises yet. Add movements from the library.", es: "Aun no hay ejercicios. Agrega movimientos desde la libreria." }))}</p>`;
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
            >${escapeHtml(tr({ en: "Delete", es: "Eliminar" }))}</button>
          </div>
          <div class="planner-lifting-exercise-fields">
            <label>
              <span>${escapeHtml(tr({ en: "Sets", es: "Series" }))}</span>
              <input
                type="text"
                value="${escapeHtml(exercise.sets)}"
                data-action="lifting-update-exercise-field"
                data-exercise-id="${escapeHtml(exercise.id)}"
                data-field="sets"
              >
            </label>
            <label>
              <span>${escapeHtml(tr({ en: "Reps", es: "Reps" }))}</span>
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
      els.liftingLibraryGroups.innerHTML = `<p class="small muted">${escapeHtml(tr({ en: "No matches in library.", es: "No hay coincidencias en la libreria." }))}</p>`;
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
    let date = null;
    if (value && typeof value.toDate === "function") {
      try {
        date = value.toDate();
      } catch {
        date = null;
      }
    }
    if (!(date instanceof Date)) {
      date = new Date(String(value || ""));
    }
    if (Number.isNaN(date.getTime())) return tr({ en: "No date", es: "Sin fecha" });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function renderLiftingSavedList() {
    if (!els.liftingSavedList) return;
    if (!state.liftingPlans.length) {
      els.liftingSavedList.innerHTML = `<p class="small muted">${escapeHtml(tr({ en: "No saved protocols yet.", es: "Aun no hay protocolos guardados." }))}</p>`;
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
            <button type="button" class="ghost" data-action="lifting-load-plan" data-plan-id="${escapeHtml(plan.id)}">${escapeHtml(tr({ en: "Load", es: "Cargar" }))}</button>
            <button type="button" class="ghost" data-action="lifting-delete-plan" data-plan-id="${escapeHtml(plan.id)}">${escapeHtml(tr({ en: "Delete", es: "Eliminar" }))}</button>
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
      els.liftingActiveDayLabel.textContent = day?.name || tr({ en: `Day ${state.liftingActiveDay + 1}`, es: `Dia ${state.liftingActiveDay + 1}` });
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
      { label: tr({ en: "Total exercises", es: "Ejercicios totales" }), value: String(metrics.totalExercises) },
      { label: tr({ en: "Active days", es: "Dias activos" }), value: `${metrics.activeDays}/7` },
      { label: tr({ en: "Total sets", es: "Series totales" }), value: String(Math.round(metrics.totalSets)) },
      { label: tr({ en: "Volume reps", es: "Volumen reps" }), value: String(Math.round(metrics.totalVolume)) }
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
      els.liftingProgramDayChart.innerHTML = `<p class="planner-lifting-program-empty">${escapeHtml(tr({ en: "Add exercises and save the protocol to view day-by-day load.", es: "Agrega ejercicios y guarda el protocolo para ver la carga por dia." }))}</p>`;
      return;
    }
    els.liftingProgramDayChart.innerHTML = metrics.dayRows.map((day) => {
      const percent = Math.max(3, Math.round(((day.loadScore || 0) / metrics.maxDayLoad) * 100));
      return `
        <div class="planner-lifting-program-bar">
          <div class="planner-lifting-program-bar-head">
            <span>${escapeHtml(day.name)}</span>
            <span>${Math.round(day.totalVolume)} ${escapeHtml(tr({ en: "reps-load", es: "reps-carga" }))}</span>
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
      els.liftingProgramCategoryChart.innerHTML = `<p class="planner-lifting-program-empty">${escapeHtml(tr({ en: "Category distribution will appear after adding exercises.", es: "La distribucion por categoria aparecera luego de agregar ejercicios." }))}</p>`;
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
        <span>${escapeHtml(tr({ en: "Average intensity", es: "Intensidad promedio" }))}</span>
      </div>
      <div class="planner-lifting-intensity-breakdown">
        <div class="planner-lifting-intensity-breakdown-row"><span>${escapeHtml(tr({ en: "Low (<65%)", es: "Baja (<65%)" }))}</span><span>${metrics.intensityBuckets.low}</span></div>
        <div class="planner-lifting-intensity-breakdown-row"><span>${escapeHtml(tr({ en: "Moderate (65-80%)", es: "Moderada (65-80%)" }))}</span><span>${metrics.intensityBuckets.moderate}</span></div>
        <div class="planner-lifting-intensity-breakdown-row"><span>${escapeHtml(tr({ en: "High (>80%)", es: "Alta (>80%)" }))}</span><span>${metrics.intensityBuckets.high}</span></div>
      </div>
    `;
  }

  function renderLiftingProgramBlueprint() {
    const metrics = buildLiftingBlueprintMetrics();
    if (els.liftingProgramMeta) {
      const updatedLabel = metrics.plan.updatedAt ? formatLiftingUpdatedAt(metrics.plan.updatedAt) : tr({ en: "No date", es: "Sin fecha" });
      els.liftingProgramMeta.textContent = tr({
        en: `${metrics.plan.name} • Weeks ${metrics.plan.weeks || "--"} • Updated ${updatedLabel}`,
        es: `${metrics.plan.name} • Semanas ${metrics.plan.weeks || "--"} • Actualizado ${updatedLabel}`
      });
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
      setLiftingStatus(tr({ en: "Enter a category name first.", es: "Ingresa primero un nombre de categoria." }), true);
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
    setLiftingStatus(tr({
      en: `Category added and shared with coaches: ${value}`,
      es: `Categoria agregada y compartida con entrenadores: ${value}`
    }));
  }

  function addLiftingExerciseToLibrary() {
    const exercise = String(els.liftingNewExerciseInput?.value || "").trim();
    const category = String(els.liftingCategorySelect?.value || "").trim();
    if (!exercise) {
      setLiftingStatus(tr({ en: "Enter an exercise name first.", es: "Ingresa primero un nombre de ejercicio." }), true);
      return;
    }
    if (!category) {
      setLiftingStatus(tr({ en: "Select a category first.", es: "Selecciona primero una categoria." }), true);
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
    setLiftingStatus(tr({
      en: `Exercise shared in ${category} for all coaches.`,
      es: `Ejercicio compartido en ${category} para todos los entrenadores.`
    }));
  }

  function loadLiftingPlanFromList(planId) {
    const safeId = String(planId || "").trim();
    if (!safeId) return;
    const record = state.liftingPlans.find((entry) => entry.id === safeId);
    if (!record) {
      setLiftingStatus(tr({ en: "Protocol not found.", es: "Protocolo no encontrado." }), true);
      return;
    }
    const normalized = normalizeLiftingPlan(record);
    normalized.id = safeId;
    state.liftingPlan = normalized;
    state.liftingActiveDay = 0;
    persistLiftingPlanLocal();
    persistLiftingUiLocal();
    renderLiftingLab();
    setLiftingStatus(tr({ en: `Loaded protocol: ${normalized.name}`, es: `Protocolo cargado: ${normalized.name}` }));
  }

  async function saveLiftingProtocol() {
    const name = String(state.liftingPlan.name || "").trim();
    if (!name) {
      setLiftingStatus(tr({ en: "Protocol name is required.", es: "El nombre del protocolo es obligatorio." }), true);
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
      setLiftingStatus(tr({ en: `Saved protocol: ${payload.name}`, es: `Protocolo guardado: ${payload.name}` }));
      triggerToast(tr({ en: "Lifting protocol saved.", es: "Protocolo de lifting guardado." }));
      setLiftingTab("program");
      focusPlannerWindow(root, { smooth: true });
    } catch (err) {
      console.warn("Failed to save lifting protocol", err);
      setLiftingStatus(tr({ en: "Could not save protocol right now.", es: "No se pudo guardar el protocolo ahora." }), true);
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
      setLiftingStatus(tr({ en: "Protocol deleted.", es: "Protocolo eliminado." }));
    } catch (err) {
      console.warn("Failed to delete lifting protocol", err);
      setLiftingStatus(tr({ en: "Could not delete protocol right now.", es: "No se pudo eliminar el protocolo ahora." }), true);
    }
  }

  async function syncLiftingLibraryToCloud(nextLibrary = null) {
    const libraryDoc = getLiftingLibraryDocRef();
    if (!libraryDoc || !canWriteSharedLiftingLibrary()) return;
    const safeLibrary = normalizeLiftingLibraryMap(nextLibrary || state.liftingLibrary || DEFAULT_LIFTING_LIBRARY);
    const authUser = getPlannerAuthUser();
    const profile = getPlannerProfile();
    let mergedLibrary = safeLibrary;
    try {
      if (libraryDoc.get) {
        const snapshot = await libraryDoc.get();
        if (snapshot?.exists) {
          mergedLibrary = mergeLiftingLibraryMaps(
            DEFAULT_LIFTING_LIBRARY,
            snapshot.data()?.data || {},
            safeLibrary
          );
        }
      }
    } catch (err) {
      console.warn("Lifting library pre-sync read failed", err);
    }
    state.liftingLibrary = mergedLibrary;
    persistLiftingLibraryLocal();
    await libraryDoc.set({
      data: mergedLibrary,
      updatedAt: getPlannerTimestamp(),
      scope: "all_coaches",
      updatedByUid: String(authUser?.id || "").trim(),
      updatedByName: String(profile?.name || authUser?.email || "Coach").trim()
    }, { merge: true });
    setLiftingStatus(tr({
      en: "Shared lifting library updated for all coaches.",
      es: "Libreria de lifting actualizada para todos los entrenadores."
    }));
  }

  function syncLiftingPlansFromSnapshot(snapshot) {
    state.liftingPlans = snapshot.docs
      .map((recordDoc) => normalizeLiftingPlan({ ...(recordDoc.data() || {}), id: recordDoc.id }))
      .filter((entry) => entry.id)
      .sort((left, right) => Number(new Date(right.updatedAt || 0)) - Number(new Date(left.updatedAt || 0)));
    renderLiftingSavedList();
    renderLiftingOverview();
  }

  function getFirebasePlannerSessionUser() {
    const normalizePlannerAuthUser = (value = null) => {
      if (!value || typeof value !== "object") return null;
      const id = String(value.uid || value.id || "").trim();
      if (!id) return null;
      return {
        id,
        email: String(value.email || "").trim().toLowerCase(),
        role: String(value.role || "").trim().toLowerCase()
      };
    };
    try {
      if (typeof firebaseAuthInstance !== "undefined" && firebaseAuthInstance?.currentUser) {
        const fromFirebaseInstance = normalizePlannerAuthUser(firebaseAuthInstance.currentUser);
        if (fromFirebaseInstance?.id) return fromFirebaseInstance;
      }
    } catch {
      // fallback below
    }
    try {
      if (typeof firebase !== "undefined" && typeof firebase?.auth === "function") {
        const fromFirebase = normalizePlannerAuthUser(firebase.auth().currentUser);
        if (fromFirebase?.id) return fromFirebase;
      }
    } catch {
      // ignore fallback errors
    }
    return null;
  }

  function hasPlannerAuthSession() {
    const firebaseSession = getFirebasePlannerSessionUser();
    if (firebaseSession?.id) return true;
    const hasFirebaseAuthLayer = Boolean(
      (typeof firebaseAuthInstance !== "undefined" && firebaseAuthInstance?.onAuthStateChanged)
      || (typeof firebase !== "undefined" && typeof firebase?.auth === "function")
    );
    if (hasFirebaseAuthLayer) return false;
    return Boolean(String(getPlannerAuthUser()?.id || "").trim());
  }

  function clearLiftingRealtimeRetry() {
    if (!state.liftingLibraryRetryTimer) return;
    window.clearTimeout(state.liftingLibraryRetryTimer);
    state.liftingLibraryRetryTimer = null;
  }

  function scheduleLiftingRealtimeRetry() {
    if (state.liftingLibraryRetryTimer) return;
    state.liftingLibraryRetryAttempt = Math.min(100, (state.liftingLibraryRetryAttempt || 0) + 1);
    const delay = state.liftingLibraryRetryAttempt <= 6 ? 700 : 1800;
    state.liftingLibraryRetryTimer = window.setTimeout(() => {
      state.liftingLibraryRetryTimer = null;
      setupLiftingRealtimeSync();
    }, delay);
  }

  function ensureLiftingAuthWatcher() {
    if (state.liftingAuthUnsub) return;
    try {
      if (typeof firebase === "undefined" || !firebase?.auth) return;
      state.liftingAuthUnsub = firebase.auth().onAuthStateChanged(() => {
        if (!hasPlannerAuthSession()) return;
        state.liftingLibraryRetryAttempt = 0;
        clearLiftingRealtimeRetry();
        setupLiftingRealtimeSync();
        startSharedPlannerCatalogSync({ force: true });
        startPlannerAssignDirectorySync({ force: true });
      });
    } catch {
      // ignore auth watcher errors
    }
  }

  function syncPlannerCloudStateAfterAuth() {
    if (!hasPlannerAuthSession()) return;
    const uid = String(getPlannerAuthUser()?.id || "").trim();
    if (!uid) return;
    if (state.plannerHydratedUid === uid) {
      startSharedPlannerCatalogSync({ force: true });
      startPlannerAssignDirectorySync({ force: true });
      startPlannerClientStateSync({ force: true });
      return;
    }
    state.plannerHydratedUid = uid;
    startSharedPlannerCatalogSync({ force: true });
    startPlannerAssignDirectorySync({ force: true });
    startPlannerClientStateSync({ force: true });
    hydratePlannerSettingsFromCloud().catch(() => {});
    hydratePlannerDailyFromCloud().catch(() => {});
  }

  function ensurePlannerAuthWatcher() {
    if (state.plannerAuthUnsub) return;
    try {
      if (typeof firebaseAuthInstance !== "undefined" && firebaseAuthInstance?.onAuthStateChanged) {
        state.plannerAuthUnsub = firebaseAuthInstance.onAuthStateChanged((user) => {
          if (!user) {
            state.plannerHydratedUid = "";
            stopPlannerClientStateSync();
            return;
          }
          syncPlannerCloudStateAfterAuth();
        });
        return;
      }
      if (typeof firebase !== "undefined" && firebase?.auth) {
        state.plannerAuthUnsub = firebase.auth().onAuthStateChanged((user) => {
          if (!user) {
            state.plannerHydratedUid = "";
            stopPlannerClientStateSync();
            return;
          }
          syncPlannerCloudStateAfterAuth();
        });
      }
    } catch {
      // ignore auth watcher errors
    }
  }

  function setupLiftingRealtimeSync() {
    ensureLiftingAuthWatcher();
    if (state.liftingPlansUnsub) {
      try { state.liftingPlansUnsub(); } catch {}
      state.liftingPlansUnsub = null;
    }
    if (state.liftingLibraryUnsub) {
      try { state.liftingLibraryUnsub(); } catch {}
      state.liftingLibraryUnsub = null;
    }

    if (!hasPlannerAuthSession()) {
      setLiftingStatus(tr({
        en: "Waiting for sign-in to sync the shared lifting library...",
        es: "Esperando inicio de sesion para sincronizar la libreria compartida de lifting..."
      }));
      scheduleLiftingRealtimeRetry();
      return;
    }

    state.liftingLibraryRetryAttempt = 0;
    clearLiftingRealtimeRetry();

    const protocolsRef = getLiftingProtocolsRef();
    if (protocolsRef?.onSnapshot) {
      state.liftingPlansUnsub = protocolsRef.onSnapshot((snapshot) => {
        runWhenPlannerIdle("lifting-plans", () => syncLiftingPlansFromSnapshot(snapshot));
      }, (err) => {
        console.warn("Lifting protocol snapshot failed", err);
      });
    }

    const libraryDoc = getLiftingLibraryDocRef();
    if (libraryDoc?.onSnapshot) {
      state.liftingLibraryUnsub = libraryDoc.onSnapshot(async (docSnap) => {
        // Ignore the local echo of our own pending writes; the UI is already current.
        if (docSnap?.metadata?.hasPendingWrites) return;
        const hasSnapshotData = typeof docSnap?.exists === "function" ? docSnap.exists() : !!docSnap?.exists;
        if (hasSnapshotData) {
          const payload = docSnap.data() || {};
          runWhenPlannerIdle("lifting-library", () => {
            state.liftingLibrary = mergeLiftingLibraryMaps(
              DEFAULT_LIFTING_LIBRARY,
              payload.data || {}
            );
            persistLiftingLibraryLocal();
            renderLiftingCategorySelect();
            renderLiftingLibraryGroups();
            renderLiftingOverview();
          });
          const updatedBy = String(payload.updatedByName || "").trim();
          const updatedAt = formatLiftingUpdatedAt(payload.updatedAt);
          setLiftingStatus(updatedBy
            ? tr({
              en: `Shared library synced (${updatedBy} • ${updatedAt}).`,
              es: `Libreria compartida sincronizada (${updatedBy} • ${updatedAt}).`
            })
            : tr({
              en: `Shared library synced (${updatedAt}).`,
              es: `Libreria compartida sincronizada (${updatedAt}).`
            }));
          return;
        }

        const mergedLocal = mergeLiftingLibraryMaps(
          DEFAULT_LIFTING_LIBRARY,
          state.liftingLibrary || {}
        );
        state.liftingLibrary = mergedLocal;
        persistLiftingLibraryLocal();
        renderLiftingCategorySelect();
        renderLiftingLibraryGroups();
        renderLiftingOverview();

        const legacyDoc = getLegacyLiftingLibraryDocRef();
        if (legacyDoc?.get) {
          try {
            const legacySnap = await legacyDoc.get();
            if (legacySnap?.exists) {
              state.liftingLibrary = mergeLiftingLibraryMaps(
                DEFAULT_LIFTING_LIBRARY,
                mergedLocal,
                legacySnap.data()?.data || {}
              );
              persistLiftingLibraryLocal();
              renderLiftingCategorySelect();
              renderLiftingLibraryGroups();
              renderLiftingOverview();
            }
          } catch (err) {
            console.warn("Lifting legacy library read failed", err);
          }
        }
        syncLiftingLibraryToCloud(state.liftingLibrary).catch(() => {});
      }, (err) => {
        console.warn("Lifting library snapshot failed", err);
        const errorCode = String(err?.code || "").trim().toLowerCase();
        if (errorCode.includes("permission-denied") && !hasPlannerAuthSession()) {
          setLiftingStatus(tr({
            en: "Waiting for sign-in to sync the shared lifting library...",
            es: "Esperando inicio de sesion para sincronizar la libreria compartida de lifting..."
          }));
          scheduleLiftingRealtimeRetry();
          return;
        }
        const projectId = String((typeof window !== "undefined" && window.FIREBASE_CONFIG?.projectId) || "").trim();
        setLiftingStatus(tr({
          en: projectId
            ? `Shared lifting library sync failed (${projectId}). Check Firestore rules for /shared_app/uwc_lifting_library.`
            : "Shared lifting library sync failed. Check Firebase connection/rules.",
          es: projectId
            ? `Fallo la sincronizacion de la libreria compartida (${projectId}). Revisa las reglas de Firestore para /shared_app/uwc_lifting_library.`
            : "Fallo la sincronizacion de la libreria compartida. Revisa Firebase/reglas."
        }), true);
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
    const normalizePlannerAuthUser = (value = null) => {
      if (!value || typeof value !== "object") return null;
      const id = String(value.id || value.uid || "").trim();
      if (!id) return null;
      return {
        id,
        email: String(value.email || "").trim().toLowerCase(),
        role: String(value.role || "").trim().toLowerCase()
      };
    };
    const firebaseSession = getFirebasePlannerSessionUser();
    if (firebaseSession?.id) return firebaseSession;

    const hasFirebaseAuthLayer = Boolean(
      (typeof firebaseAuthInstance !== "undefined" && firebaseAuthInstance?.onAuthStateChanged)
      || (typeof firebase !== "undefined" && typeof firebase?.auth === "function")
    );
    if (hasFirebaseAuthLayer) return null;
    if (typeof getAuthUser === "function") {
      try {
        const fromApp = normalizePlannerAuthUser(getAuthUser());
        if (fromApp?.id) return fromApp;
      } catch {
        // fallback below
      }
    }
    if (typeof getProfile === "function") {
      try {
        const profile = getProfile();
        const fromProfile = normalizePlannerAuthUser({
          id: profile?.user_id || "",
          email: profile?.email || "",
          role: profile?.role || ""
        });
        if (fromProfile?.id) return fromProfile;
      } catch {
        // fallback below
      }
    }
    return null;
  }

  function waitForPlannerAuthReady(timeoutMs = 5500) {
    const existing = getPlannerAuthUser();
    if (existing?.id) return Promise.resolve(existing);
    return new Promise((resolve) => {
      let settled = false;
      let timerId = null;
      let unsubscribe = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (timerId) clearTimeout(timerId);
        if (typeof unsubscribe === "function") {
          try { unsubscribe(); } catch {}
        }
        resolve(getPlannerAuthUser());
      };
      timerId = window.setTimeout(finish, timeoutMs);
      try {
        if (typeof firebaseAuthInstance !== "undefined" && firebaseAuthInstance?.onAuthStateChanged) {
          unsubscribe = firebaseAuthInstance.onAuthStateChanged(() => finish());
          return;
        }
        if (typeof firebase !== "undefined" && firebase?.auth) {
          unsubscribe = firebase.auth().onAuthStateChanged(() => finish());
          return;
        }
      } catch {
        // fallback to timeout
      }
    });
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

  function getPlannerLang() {
    try {
      if (typeof currentLang === "string" && currentLang) {
        return String(currentLang).toLowerCase().startsWith("es") ? "es" : "en";
      }
    } catch {
      // fall through
    }
    const profile = getPlannerProfile() || {};
    return String(profile?.lang || "en").toLowerCase().startsWith("es") ? "es" : "en";
  }

  function tr(copy = {}) {
    if (typeof copy === "string") return copy;
    const lang = getPlannerLang();
    if (lang === "es") return String(copy.es || copy.en || "").trim();
    return String(copy.en || copy.es || "").trim();
  }

  function getTodayDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function dateFromDateKey(value) {
    const safeKey = normalizeDateKeyValue(value || getTodayDateKey());
    const date = new Date(`${safeKey}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function dateToDateKey(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return getTodayDateKey();
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getWeekStartDateKey(value) {
    const date = dateFromDateKey(value || getTodayDateKey());
    if (!date) return getTodayDateKey();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - start.getDay());
    return dateToDateKey(start);
  }

  function addDaysToDateKey(value, days = 0) {
    const date = dateFromDateKey(value || getTodayDateKey());
    if (!date) return getTodayDateKey();
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + (Number(days) || 0));
    return dateToDateKey(next);
  }

  function normalizeAssignWeekCount(value) {
    const parsed = parseInt(String(value || 1), 10);
    if (Number.isNaN(parsed)) return 1;
    return clamp(parsed, 1, 12);
  }

  function isWrestlingWeeklyMode() {
    return getAssignContextTrack() === "wrestling" && state.assignScheduleMode === "week";
  }

  function getWeeklyScheduleWindow(anchorDateKey = state.assignDueDate || getTodayDateKey(), weekCount = state.assignWeekCount) {
    const safeWeekCount = normalizeAssignWeekCount(weekCount);
    const startKey = getWeekStartDateKey(anchorDateKey);
    const endKey = addDaysToDateKey(startKey, (safeWeekCount * 7) - 1);
    return {
      startKey,
      endKey,
      weekCount: safeWeekCount
    };
  }

  function getWeeklyScheduleLabel(windowValue) {
    const safeWindow = windowValue && typeof windowValue === "object" ? windowValue : getWeeklyScheduleWindow();
    const weekNoun = tr({
      en: safeWindow.weekCount === 1 ? "week" : "weeks",
      es: safeWindow.weekCount === 1 ? "semana" : "semanas"
    });
    return tr({
      en: `Sun-Sat range: ${formatDateLabel(safeWindow.startKey)} to ${formatDateLabel(safeWindow.endKey)} (${safeWindow.weekCount} ${weekNoun})`,
      es: `Rango Dom-Sab: ${formatDateLabel(safeWindow.startKey)} a ${formatDateLabel(safeWindow.endKey)} (${safeWindow.weekCount} ${weekNoun})`
    });
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
      return `${tr({ en: "Editing saved plan", es: "Editando plan guardado" })}: ${state.activeTemplateName}`;
    }
    return tr({
      en: "Save this plan or share it with athletes and coaches.",
      es: "Guarda este plan o compartelo con atletas y entrenadores."
    });
  }

  function setAssignStatus(message, isError = false) {
    if (!els.assignStatus) return;
    els.assignStatus.textContent = String(message || "");
    els.assignStatus.classList.toggle("planner-status-error", Boolean(isError));
  }

  function getScheduleItemsByCategory(categoryId) {
    const safeCategoryId = String(categoryId || "").trim();
    if (!getPlannerCategories().some((category) => category.id === safeCategoryId)) return [];
    return (state.schedule[safeCategoryId] || [])
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
    getPlannerCategories().forEach((category) => {
      next[category.id] = (state.schedule[category.id] || [])
        .map((entry) => String(entry?.name || "").trim())
        .filter(Boolean);
    });
    return next;
  }

  function normalizeTemplateScheduleValue(value, categories = getPlannerCategories()) {
    const next = {};
    (Array.isArray(categories) ? categories : []).forEach((category) => {
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

  function normalizeTemplateTimesValue(value, categories = getPlannerCategories()) {
    const base = {};
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      base[category.id] = INITIAL_TIMES[category.id] || "0";
    });
    if (!value || typeof value !== "object") return base;
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      const raw = String(value?.[category.id] ?? "").trim();
      if (raw) base[category.id] = raw;
    });
    return base;
  }

  function normalizeTemplateCategoryNamesValue(value, categories = getPlannerCategories()) {
    const base = normalizePlannerCategoryNamesState({}, categories);
    if (!value || typeof value !== "object") return base;
    (Array.isArray(categories) ? categories : []).forEach((category) => {
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

  function normalizeTemplateCategoriesValue(value, fallbackSchedule = {}) {
    const scheduleSource = fallbackSchedule && typeof fallbackSchedule === "object" ? fallbackSchedule : {};
    const scheduleKeys = Object.keys(scheduleSource);
    const fromSchedule = scheduleKeys.map((categoryId) => ({
      id: categoryId,
      name: String(state.categoryNames?.[categoryId] || getCategoryNameById(categoryId) || categoryId).trim() || categoryId
    }));
    if (!Array.isArray(value) || !value.length) {
      if (fromSchedule.length) return normalizePlannerCategoryCollection(fromSchedule);
      return normalizePlannerCategoryCollection(getPlannerCategories());
    }
    return normalizePlannerCategoryCollection(value);
  }

  function getPlannerRecordSourceKey(sourceKind = "plan", id = "") {
    return `${String(sourceKind || "plan").trim() || "plan"}:${String(id || "").trim()}`;
  }

  function inferPlannerTotalTimeValue(data = {}) {
    const directValue = String(data?.plannerTotalTime || data?.totalTime || "").trim();
    if (directValue) return directValue;
    const source = data?.plannerCategoryTimes && typeof data.plannerCategoryTimes === "object"
      ? data.plannerCategoryTimes
      : {};
    const total = Object.values(source).reduce((sum, value) => sum + parseTimeValue(value), 0);
    return total > 0 ? String(total) : "";
  }

  function normalizePlannerTemplateRecord(id, data = {}, { sourceKind = "plan" } = {}) {
    const track = String(data?.trainingTrack || data?.track || "").trim().toLowerCase();
    if (track && track !== "wrestling") return null;
    const name = String(data?.name || data?.title || "").trim();
    if (!name) return null;
    const items = normalizeTemplateItemsValue(data?.items || {});
    const rawSchedule = data?.plannerSchedule && typeof data.plannerSchedule === "object"
      ? data.plannerSchedule
      : mapTemplateItemsToSchedule(items);
    const categories = normalizeTemplateCategoriesValue(data?.plannerCategories || [], rawSchedule);
    const schedule = normalizeTemplateScheduleValue(rawSchedule, categories);
    return {
      id: String(id || "").trim(),
      sourceKind: String(sourceKind || "plan").trim() || "plan",
      sourceKey: getPlannerRecordSourceKey(sourceKind, id),
      name,
      type: String(data?.type || "day").trim(),
      categories,
      items,
      schedule,
      categoryTimes: normalizeTemplateTimesValue(data?.plannerCategoryTimes || {}, categories),
      categoryNames: normalizeTemplateCategoryNamesValue(data?.plannerCategoryNames || {}, categories),
      totalTime: inferPlannerTotalTimeValue(data),
      savedDate: String(data?.plannerDate || data?.range?.startKey || data?.startKey || "").trim(),
      updatedAt: normalizeTemplateDateValue(data?.updatedAt),
      createdAt: normalizeTemplateDateValue(data?.createdAt)
    };
  }

  function formatTemplateUpdatedLabel(record) {
    const raw = record?.updatedAt || record?.createdAt || "";
    if (!raw) return tr({ en: "No date", es: "Sin fecha" });
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return tr({ en: "No date", es: "Sin fecha" });
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

  function hasPlannerScheduleEntries(schedule = {}, categories = getPlannerCategories()) {
    return (Array.isArray(categories) ? categories : []).some((category) => (
      Array.isArray(schedule?.[category.id])
      && schedule[category.id].some((item) => String(typeof item === "string" ? item : item?.name || "").trim())
    ));
  }

  function hasMeaningfulPlannerCategoryTimes(value = {}, categories = getPlannerCategories()) {
    return (Array.isArray(categories) ? categories : []).some((category) => {
      const current = String(value?.[category.id] ?? "").trim();
      const baseline = String(INITIAL_TIMES[category.id] || "0").trim();
      return Boolean(current && current !== baseline);
    });
  }

  function hasMeaningfulPlannerDraft(value = {}, categories = getPlannerCategories()) {
    const safeCategories = normalizeTemplateCategoriesValue(
      value?.plannerCategories || value?.categories || [],
      value?.plannerSchedule || value?.schedule || {}
    );
    const resolvedCategories = safeCategories.length ? safeCategories : categories;
    const safeSchedule = normalizePlannerScheduleState(
      value?.plannerSchedule || value?.schedule || {},
      resolvedCategories
    );
    const safeTimes = normalizePlannerCategoryTimesState(
      value?.plannerCategoryTimes || value?.categoryTimes || {},
      resolvedCategories
    );
    const safeDate = normalizeDateKeyValue(value?.plannerDate || value?.date || "");
    const safeTotalTime = String(value?.plannerTotalTime || value?.totalTime || "").trim();
    return Boolean(
      safeDate
      || hasPlannerScheduleEntries(safeSchedule, resolvedCategories)
      || hasMeaningfulPlannerCategoryTimes(safeTimes, resolvedCategories)
      || (safeTotalTime && safeTotalTime !== "90")
    );
  }

  function applyPlannerRecord(record = null, {
    syncCloud = true,
    statusMessage = "",
    statusIsError = false,
    toastMessage = "",
    closeTemplates = false
  } = {}) {
    if (!record) return false;
    state.activeLoadedSourceKey = String(record.sourceKey || getPlannerRecordSourceKey(record.sourceKind, record.id)).trim();
    state.activeTemplateId = record.sourceKind === "plan" ? String(record.id || "").trim() : "";
    state.activeTemplateName = String(record.name || "").trim();
    state.wrestlingCategories = normalizePlannerCategoryCollection(record.categories || getPlannerCategories());
    state.schedule = normalizeTemplateScheduleValue(record.schedule || {}, state.wrestlingCategories);
    state.categoryTimes = normalizeTemplateTimesValue(record.categoryTimes || {}, state.wrestlingCategories);
    state.categoryNames = normalizeTemplateCategoryNamesValue(record.categoryNames || {}, state.wrestlingCategories);
    reconcilePlannerDataForCategories({ keepLibraryUnknown: false });
    const nextDate = normalizeDateKeyValue(record.savedDate || state.docInfo.date || getTodayDateKey());
    if (nextDate) {
      state.docInfo.date = nextDate;
    }
    state.docInfo.totalTime = String(record.totalTime || state.docInfo.totalTime || "90").trim() || "90";
    persistDaily({ syncCloud });
    persistCategories();
    persistCategoryNames();
    persistLibrary();
    render();
    queuePlannerLibrarySync();
    if (closeTemplates) closeTemplatesModal();
    if (statusMessage) setBottomStatus(statusMessage, statusIsError);
    if (toastMessage) triggerToast(toastMessage);
    return true;
  }

  async function fetchPlannerSavedRecords({ includeTemplates = true, includePlans = true } = {}) {
    const authUser = await waitForPlannerAuthReady(5500);
    if (!authUser?.id) {
      return {
        authReady: false,
        hadSource: false,
        hadError: false,
        records: []
      };
    }
    const sourceDefs = [];
    if (includeTemplates) {
      const templatesRef = getPlannerWorkspaceCollectionRef("templates");
      if (templatesRef) {
        sourceDefs.push({
          sourceKind: "template",
          label: "templates",
          ref: templatesRef
        });
      }
    }
    if (includePlans) {
      const plansRef = getPlannerWorkspaceCollectionRef("plans");
      if (plansRef) {
        sourceDefs.push({
          sourceKind: "plan",
          label: "plans",
          ref: plansRef
        });
      }
    }
    if (!sourceDefs.length) {
      return {
        authReady: true,
        hadSource: false,
        hadError: false,
        records: []
      };
    }

    const settled = await Promise.allSettled(sourceDefs.map((source) => source.ref.get()));
    const records = [];
    let hadError = false;
    settled.forEach((result, index) => {
      const source = sourceDefs[index];
      if (result.status !== "fulfilled") {
        hadError = true;
        console.warn(`Failed to load planner ${source.label}`, result.reason);
        return;
      }
      result.value.docs
        .map((doc) => normalizePlannerTemplateRecord(doc.id, doc.data() || {}, { sourceKind: source.sourceKind }))
        .filter(Boolean)
        .forEach((record) => records.push(record));
    });

    records.sort((left, right) => {
      const leftDate = Number(new Date(left.updatedAt || left.createdAt || 0));
      const rightDate = Number(new Date(right.updatedAt || right.createdAt || 0));
      return rightDate - leftDate;
    });

    return {
      authReady: true,
      hadSource: true,
      hadError,
      records
    };
  }

  async function hydratePlannerFromLatestWorkspacePlan({ syncCloud = true } = {}) {
    const result = await fetchPlannerSavedRecords({ includeTemplates: true, includePlans: true });
    if (!result.authReady || !result.records.length) return false;
    const latestRecord = result.records[0];
    if (!latestRecord) return false;
    return applyPlannerRecord(latestRecord, {
      syncCloud,
      statusMessage: tr({
        en: `Loaded latest saved plan: ${latestRecord.name}`,
        es: `Se cargo el ultimo plan guardado: ${latestRecord.name}`
      })
    });
  }

  function renderTemplateList() {
    if (!els.templatesList) return;
    if (!state.templateRecords.length) {
      els.templatesList.innerHTML = `<p class="small muted">${escapeHtml(tr({ en: "No saved plans found yet.", es: "Todavia no hay planes guardados." }))}</p>`;
      return;
    }
    const html = state.templateRecords.map((template) => {
      const isActive = template.sourceKey && template.sourceKey === state.activeLoadedSourceKey;
      const sourceLabel = tr({ en: "Saved plan", es: "Plan guardado" });
      return `
        <article class="planner-template-card${isActive ? " active" : ""}">
          <div>
            <strong>${escapeHtml(template.name)}</strong>
            <p class="small muted">${escapeHtml(sourceLabel)} • ${escapeHtml(tr({ en: "Updated", es: "Actualizado" }))}: ${escapeHtml(formatTemplateUpdatedLabel(template))}</p>
          </div>
          <button
            type="button"
            class="primary"
            data-action="load-template-record"
            data-template-key="${escapeHtml(template.sourceKey)}"
          >${escapeHtml(tr({ en: "Load", es: "Cargar" }))}</button>
        </article>
      `;
    }).join("");
    els.templatesList.innerHTML = html;
  }

  async function loadPlannerTemplates() {
    setTemplatesStatus(tr({ en: "Loading saved plans...", es: "Cargando planes guardados..." }));
    const result = await fetchPlannerSavedRecords({ includeTemplates: true, includePlans: true });
    if (!result.authReady) {
      state.templateRecords = [];
      renderTemplateList();
      setTemplatesStatus(tr({
        en: "Sign in again to load saved plans.",
        es: "Inicia sesion de nuevo para cargar planes guardados."
      }), true);
      return;
    }
    if (!result.hadSource) {
      state.templateRecords = [];
      renderTemplateList();
      setTemplatesStatus(tr({
        en: "Plan storage is not available.",
        es: "El almacenamiento de planes no esta disponible."
      }), true);
      return;
    }
    state.templateRecords = result.records;
    renderTemplateList();
    if (result.hadError && !state.templateRecords.length) {
      setTemplatesStatus(tr({
        en: "Could not load saved plans right now.",
        es: "No se pudieron cargar los planes guardados ahora."
      }), true);
      return;
    }
    setTemplatesStatus(state.templateRecords.length
      ? tr({ en: `${state.templateRecords.length} saved plans loaded.`, es: `${state.templateRecords.length} planes guardados cargados.` })
      : tr({ en: "No saved plans found.", es: "No se encontraron planes guardados." }));
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
    const template = state.templateRecords.find((record) => record.sourceKey === targetId || record.id === targetId);
    if (!template) {
      setTemplatesStatus(tr({ en: "Saved plan not found.", es: "Plan guardado no encontrado." }), true);
      return;
    }
    applyPlannerRecord(template, {
      syncCloud: true,
      closeTemplates: true,
      toastMessage: tr({
        en: `Plan loaded: ${template.name}`,
        es: `Plan cargado: ${template.name}`
      }),
      statusMessage: tr({
        en: `Loaded saved plan: ${template.name}`,
        es: `Se cargo el plan guardado: ${template.name}`
      })
    });
  }

  function getPlannerTitle() {
    const dateKey = normalizeDateKeyValue(state.docInfo.date || getTodayDateKey());
    return tr({
      en: `Daily Training Plan - ${formatDateLabel(dateKey)}`,
      es: `Plan diario de entrenamiento - ${formatDateLabel(dateKey)}`
    });
  }

  function getAssignContextTrack() {
    const rawTrack = String(state.assignContext?.track || state.activeTrack || "wrestling").trim().toLowerCase();
    return normalizeTrack(rawTrack);
  }

  function getAssignContextMeta(track = getAssignContextTrack(), mentalGameKey = state.assignContext?.mentalGameKey || "") {
    if (track === "lifting") {
      return {
        modalTitle: tr({ en: "Share lifting plan", es: "Compartir plan de lifting" }),
        sendLabel: tr({ en: "Share lifting", es: "Compartir lifting" }),
        sendingLabel: tr({ en: "Sharing lifting...", es: "Compartiendo lifting..." }),
        statusHint: tr({ en: "Choose recipients for the lifting plan.", es: "Selecciona destinatarios para el plan de lifting." }),
        successNoun: tr({ en: "Lifting plan", es: "Plan de lifting" })
      };
    }
    if (track === "mental") {
      const key = String(mentalGameKey || "").trim().toLowerCase();
      const gameMeta = getLocalizedMentalMeta(key || MENTAL_GAME_KEYS.GO_NO_GO);
      return {
        modalTitle: `${tr({ en: "Assign mind task", es: "Asignar tarea mental" })}: ${gameMeta.title}`,
        sendLabel: tr({ en: "Assign game", es: "Asignar juego" }),
        sendingLabel: tr({ en: "Assigning game...", es: "Asignando juego..." }),
        statusHint: tr({ en: "Choose recipients for this mind & focus game.", es: "Selecciona destinatarios para este juego de mente y enfoque." }),
        successNoun: tr({ en: "Mind task", es: "Tarea mental" })
      };
    }
    return {
      modalTitle: tr({ en: "Share wrestling plan", es: "Compartir plan de lucha" }),
      sendLabel: tr({ en: "Share plan", es: "Compartir plan" }),
      sendingLabel: tr({ en: "Sharing...", es: "Compartiendo..." }),
      statusHint: tr({ en: "Choose recipients, then share.", es: "Selecciona destinatarios y luego comparte." }),
      successNoun: tr({ en: "Wrestling plan", es: "Plan de lucha" })
    };
  }

  function applyAssignContextUi() {
    const meta = getAssignContextMeta();
    if (els.assignTitle) els.assignTitle.textContent = meta.modalTitle;
    if (els.assignSendBtn && !state.assignModalBusy) {
      els.assignSendBtn.textContent = meta.sendLabel;
    }
    const isWrestling = getAssignContextTrack() === "wrestling";
    const isWeekly = isWrestling && state.assignScheduleMode === "week";
    els.assignScheduleModeWrapper?.classList.toggle("hidden", !isWrestling);
    els.assignWeekCountWrapper?.classList.toggle("hidden", !isWeekly);
    if (els.assignScheduleModeInput) {
      els.assignScheduleModeInput.value = isWrestling ? state.assignScheduleMode : "day";
    }
    if (els.assignWeekCountInput) {
      els.assignWeekCountInput.value = String(normalizeAssignWeekCount(state.assignWeekCount));
    }
    if (els.assignDueDateLabel) {
      els.assignDueDateLabel.textContent = isWeekly
        ? tr({ en: "Week start date", es: "Fecha de inicio de semana" })
        : tr({ en: "Due date", es: "Fecha de entrega" });
    }
    if (els.assignWeekHint) {
      if (!isWrestling) {
        els.assignWeekHint.textContent = tr({ en: "Choose recipients, then share.", es: "Selecciona destinatarios y luego comparte." });
      } else if (isWeekly) {
        els.assignWeekHint.textContent = getWeeklyScheduleLabel();
      } else {
        els.assignWeekHint.textContent = tr({
          en: "Single-day assignment. Switch to Weekly to repeat this plan for multiple weeks.",
          es: "Asignacion de un dia. Cambia a Semanal para repetir este plan varias semanas."
        });
      }
    }
  }

  function getLiftingDayExerciseLines(day = null) {
    const safeDay = day || getActiveLiftingDay();
    const exercises = Array.isArray(safeDay?.exercises) ? safeDay.exercises : [];
    return exercises
      .map((exercise) => {
        const name = String(exercise?.name || "").trim();
        if (!name) return "";
        const sets = String(exercise?.sets || "").trim();
        const reps = String(exercise?.reps || "").trim();
        const intensity = String(exercise?.intensity || "").trim();
        const volume = [sets, reps].filter(Boolean).join("x");
        const pieces = [name];
        if (volume) pieces.push(volume);
        if (intensity) pieces.push(intensity);
        return pieces.join(" ");
      })
      .filter(Boolean);
  }

  function buildLiftingPlanItemsForShare(day = null) {
    const safeDay = day || getActiveLiftingDay();
    const exerciseLines = getLiftingDayExerciseLines(safeDay);
    return {
      intro: [tr({
        en: `Cycle: ${state.liftingPlan.name || "Lifting cycle"}`,
        es: `Ciclo: ${state.liftingPlan.name || "Ciclo de lifting"}`
      })],
      warmup: [String(state.liftingPlan.purpose || "").trim()].filter(Boolean),
      drills: exerciseLines.length ? exerciseLines : [tr({ en: "Coach will update exercise blocks.", es: "El entrenador actualizara los bloques de ejercicios." })],
      live: [],
      cooldown: [String(state.liftingPlan.benefits || "").trim()].filter(Boolean),
      announcements: [tr({
        en: `Assigned day: ${safeDay?.name || `Day ${state.liftingActiveDay + 1}`}`,
        es: `Dia asignado: ${safeDay?.name || `Dia ${state.liftingActiveDay + 1}`}`
      })]
    };
  }

  function normalizeRecipientRole(value = "", fallbackType = "athlete") {
    const raw = String(value || fallbackType || "").trim().toLowerCase();
    if (!raw) return fallbackType;
    if (raw === "administrator" || raw === "head_coach") return "coach";
    if (raw === "admin" || raw === "coach" || raw === "athlete" || raw === "parent") return raw;
    if (raw.includes("coach")) return "coach";
    return "athlete";
  }

  function normalizeRecipientDisplayName(data = {}, fallbackId = "") {
    let name = String(data?.name || "").trim();
    if (!name) {
      const first = String(data?.firstName || data?.first_name || "").trim();
      const last = String(data?.lastName || data?.last_name || "").trim();
      name = [first, last].filter(Boolean).join(" ").trim();
    }
    if (!name) {
      name = String(data?.athleteName || data?.linkedAthleteName || "").trim();
    }
    const email = String(data?.email || data?.athleteEmail || "").trim().toLowerCase();
    if (!name && email.includes("@")) {
      const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
      if (local) {
        name = local.replace(/\b\w/g, (char) => char.toUpperCase());
      }
    }
    if (!name) {
      const suffix = String(fallbackId || "").trim().slice(0, 6) || "User";
      name = `${tr({ en: "User", es: "Usuario" })} ${suffix}`;
    }
    if (typeof stripUserDisplayNumber === "function") {
      try {
        name = stripUserDisplayNumber(name);
      } catch {
        // keep sanitized fallback
      }
    }
    return String(name || "").trim();
  }

  function normalizeRecipientRecord(id, data = {}, fallbackType = "athlete") {
    const role = normalizeRecipientRole(data?.role, fallbackType);
    const recipientType = isCoachLikeRole(role) ? "coach" : "athlete";
    const candidateId = String(id || "").trim();
    const name = normalizeRecipientDisplayName(data, candidateId);
    if (!name) return null;
    const recipientEmail = String(
      data?.athleteEmail
      || data?.email
      || data?.contactEmail
      || data?.linkedCoachEmail
      || ""
    ).trim().toLowerCase();
    const recipientUid = String(
      data?.athleteUid
      || data?.uid
      || data?.user_id
      || data?.linkedAthleteUid
      || candidateId
    ).trim();
    return {
      id: candidateId || toSimpleSlug(name),
      name,
      recipientType,
      role,
      recipientUid,
      recipientEmail
    };
  }

  function mergeRecipientCollections(primary = [], fallback = []) {
    const merged = new Map();
    const pushRecord = (record = {}) => {
      if (!record || !record.name) return;
      const key = record.recipientUid
        ? `uid:${record.recipientUid}`
        : (record.recipientEmail ? `email:${record.recipientEmail}` : `id:${record.id}`);
      if (!key) return;
      const previous = merged.get(key);
      if (!previous) {
        merged.set(key, { ...record });
        return;
      }
      merged.set(key, {
        ...previous,
        ...record,
        id: String(record.id || previous.id || "").trim(),
        name: String(record.name || previous.name || "").trim(),
        recipientUid: String(record.recipientUid || previous.recipientUid || "").trim(),
        recipientEmail: String(record.recipientEmail || previous.recipientEmail || "").trim().toLowerCase()
      });
    };

    fallback.forEach(pushRecord);
    primary.forEach(pushRecord);
    return Array.from(merged.values());
  }

  function applyAssignRecipients(records = [], { fromRealtime = false } = {}) {
    const safe = Array.isArray(records) ? records : [];
    const filtered = safe
      .filter((record) => record && record.name && (record.recipientType === "athlete" || record.recipientType === "coach"))
      .sort((left, right) => {
        if (left.recipientType !== right.recipientType) {
          return left.recipientType === "athlete" ? -1 : 1;
        }
        return String(left.name || "").localeCompare(String(right.name || ""), undefined, { sensitivity: "base" });
      });
    state.assignAthletes = filtered;
    state.assignDirectoryReady = true;
    state.selectedAthleteIds = state.selectedAthleteIds.filter((athleteId) => filtered.some((entry) => entry.id === athleteId));
    renderAssignAthleteList();
    if (els.assignModal?.classList.contains("hidden")) return;
    if (!filtered.length) {
      setAssignStatus(tr({
        en: "No athletes or coaches found in the users directory yet.",
        es: "Aun no hay atletas o entrenadores en el directorio de usuarios."
      }), !fromRealtime);
      return;
    }
    const athletesCount = filtered.filter((record) => record.recipientType === "athlete").length;
    const coachesCount = filtered.filter((record) => record.recipientType === "coach").length;
    setAssignStatus(tr({
      en: `${athletesCount} athletes + ${coachesCount} coaches (shared users directory).`,
      es: `${athletesCount} atletas + ${coachesCount} entrenadores (directorio compartido de usuarios).`
    }));
  }

  async function resolveAthleteRecipientUserDocId(recipient = null) {
    const usersRef = getPlannerUsersCollectionRef();
    if (!usersRef || !recipient) return "";
    const directUid = String(recipient.recipientUid || "").trim();
    if (directUid) return directUid;

    const byEmail = String(recipient.recipientEmail || "").trim().toLowerCase();
    if (byEmail) {
      try {
        const emailSnap = await usersRef.where("email", "==", byEmail).limit(3).get();
        if (!emailSnap.empty) {
          const athleteDoc = emailSnap.docs.find((doc) => String(doc.data()?.role || "").trim().toLowerCase() === "athlete");
          return String((athleteDoc || emailSnap.docs[0])?.id || "").trim();
        }
      } catch {
        // ignore lookup errors and continue with id fallback
      }
    }

    const athleteId = String(recipient.id || "").trim();
    if (athleteId) {
      try {
        const idSnap = await usersRef.where("linkedAthleteId", "==", athleteId).limit(3).get();
        if (!idSnap.empty) {
          const athleteDoc = idSnap.docs.find((doc) => String(doc.data()?.role || "").trim().toLowerCase() === "athlete");
          return String((athleteDoc || idSnap.docs[0])?.id || "").trim();
        }
      } catch {
        // ignore fallback lookup errors
      }
    }
    return "";
  }

  async function ensureAthleteRecipientLinks(recipients = []) {
    const safeRecipients = Array.isArray(recipients) ? recipients : [];
    if (!safeRecipients.length || typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) {
      return 0;
    }
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const profile = getPlannerProfile();
    if (!usersRef || !authUser?.id) return 0;

    const coachUid = String(authUser.id || "").trim();
    const coachName = String(profile?.name || authUser?.email || "Coach").trim();
    const coachEmail = String(authUser?.email || profile?.email || "").trim().toLowerCase();
    if (!coachUid) return 0;

    const batch = firebaseFirestoreInstance.batch();
    let updates = 0;
    for (const recipient of safeRecipients) {
      const userDocId = await resolveAthleteRecipientUserDocId(recipient);
      if (!userDocId) continue;
      const athleteId = String(recipient.id || "").trim();
      batch.set(usersRef.doc(userDocId), stripUndefinedDeep({
        linkedCoachUid: coachUid,
        linkedCoachName: coachName,
        linkedCoachEmail: coachEmail,
        linkedAthleteId: athleteId || undefined,
        linkedAthleteUid: userDocId,
        updatedAt: new Date().toISOString()
      }), { merge: true });
      updates += 1;
    }
    if (!updates) return 0;
    await batch.commit();
    return updates;
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
      els.assignList.innerHTML = `<p class="small muted">${escapeHtml(tr({ en: "No recipients found.", es: "No se encontraron destinatarios." }))}</p>`;
      return;
    }
    const html = filtered.map((athlete) => {
      const isSelected = state.selectedAthleteIds.includes(athlete.id);
      const roleLabel = athlete.recipientType === "coach"
        ? tr({ en: "Coach", es: "Entrenador" })
        : tr({ en: "Athlete", es: "Atleta" });
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

  function stopPlannerAssignDirectorySync() {
    if (Array.isArray(state.assignDirectoryUnsubs) && state.assignDirectoryUnsubs.length) {
      state.assignDirectoryUnsubs.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch {
          // ignore unsubscribe errors
        }
      });
    }
    state.assignDirectoryUnsubs = [];
    state.assignDirectoryRoleRecords = {};
  }

  async function loadPlannerRecipientsFallback({ apply = true } = {}) {
    const authReady = hasPlannerAuthSession();
    const usersRef = authReady ? getPlannerUsersCollectionRef() : null;
    const athletesRef = authReady ? getPlannerWorkspaceCollectionRef("athletes") : null;
    const sources = [];
    let hadAtLeastOneSource = false;

    if (usersRef) {
      hadAtLeastOneSource = true;
      try {
        const usersSnap = await usersRef.get();
        const usersRecords = usersSnap.docs
          .map((doc) => normalizeRecipientRecord(doc.id, doc.data() || {}, "athlete"))
          .filter(Boolean)
          .filter((record) => record.role !== "parent");
        sources.push(...usersRecords);
      } catch (err) {
        const errorCode = String(err?.code || "").trim().toLowerCase();
        if (!errorCode.includes("permission-denied") && !errorCode.includes("unauthenticated")) {
          console.warn("Planner fallback users directory load failed", err);
        }
      }
    }

    if (athletesRef) {
      hadAtLeastOneSource = true;
      try {
        const athletesSnap = await athletesRef.get();
        const athleteRecords = athletesSnap.docs
          .map((doc) => normalizeRecipientRecord(doc.id, doc.data() || {}, "athlete"))
          .filter(Boolean)
          .filter((record) => record.recipientType === "athlete");
        sources.push(...athleteRecords);
      } catch (err) {
        const errorCode = String(err?.code || "").trim().toLowerCase();
        if (!errorCode.includes("permission-denied") && !errorCode.includes("unauthenticated")) {
          console.warn("Planner fallback athletes load failed", err);
        }
      }
    }

    if (!sources.length && typeof getAthletesData === "function") {
      try {
        const localAthletes = (getAthletesData() || [])
          .map((athlete) => normalizeRecipientRecord(
            athlete?.id || athlete?.name || "",
            {
              ...athlete,
              role: "athlete",
              email: athlete?.athleteEmail || athlete?.email || "",
              linkedAthleteId: athlete?.id || athlete?.linkedAthleteId || ""
            },
            "athlete"
          ))
          .filter(Boolean);
        sources.push(...localAthletes);
      } catch {
        // ignore local roster fallback errors
      }
    }

    if (!hadAtLeastOneSource) {
      state.assignFallbackRecipients = [];
      if (apply) applyAssignRecipients([], { fromRealtime: false });
      return [];
    }

    const records = mergeRecipientCollections(sources, [])
      .filter((record) => record.recipientType === "athlete" || record.recipientType === "coach");

    state.assignFallbackRecipients = records;
    if (apply) applyAssignRecipients(records, { fromRealtime: false });
    return records;
  }

  function startPlannerAssignDirectorySync({ force = false } = {}) {
    if (Array.isArray(state.assignDirectoryUnsubs) && state.assignDirectoryUnsubs.length && !force) {
      if (state.assignDirectoryReady) {
        renderAssignAthleteList();
        return;
      }
      stopPlannerAssignDirectorySync();
    }
    if (force) stopPlannerAssignDirectorySync();
    if (!hasPlannerAuthSession()) {
      state.assignDirectoryReady = false;
      if (!els.assignModal?.classList.contains("hidden")) {
        setAssignStatus(tr({
          en: "Waiting for sign-in to load recipients...",
          es: "Esperando inicio de sesion para cargar destinatarios..."
        }), true);
      }
      waitForPlannerAuthReady(5500).then((user) => {
        if (user?.id) {
          startPlannerAssignDirectorySync({ force: true });
        }
      }).catch(() => {});
      loadPlannerRecipientsFallback().catch(() => {});
      return;
    }
    const sharedDirectoryRef = getPlannerSharedUserDirectoryRef();
    if (!sharedDirectoryRef?.onSnapshot) {
      state.assignDirectoryReady = false;
      if (!els.assignModal?.classList.contains("hidden")) {
        setAssignStatus(tr({
          en: "Shared users directory unavailable. Loading fallback recipients...",
          es: "Directorio compartido de usuarios no disponible. Cargando destinatarios de respaldo..."
        }), true);
      }
      loadPlannerRecipientsFallback().catch(() => {});
      return;
    }

    state.assignDirectoryReady = false;
    if (!els.assignModal?.classList.contains("hidden")) {
      setAssignStatus(tr({ en: "Loading recipients from shared users directory...", es: "Cargando destinatarios desde el directorio compartido..." }));
    }

    loadPlannerRecipientsFallback({ apply: false }).then((fallbackRecords) => {
      state.assignFallbackRecipients = fallbackRecords;
      const sharedRecords = Array.isArray(state.assignDirectoryRoleRecords?.shared)
        ? state.assignDirectoryRoleRecords.shared
        : [];
      if (sharedRecords.length || fallbackRecords.length) {
        applyAssignRecipients(mergeRecipientCollections(sharedRecords, fallbackRecords), { fromRealtime: true });
      }
    }).catch(() => {});

    state.assignDirectoryUnsubs = [
      sharedDirectoryRef.onSnapshot((snapshot) => {
        const records = snapshot.docs
          .map((doc) => normalizeRecipientRecord(doc.id, doc.data() || {}, "athlete"))
          .filter(Boolean)
          .filter((record) => record.role !== "parent");
        state.assignDirectoryRoleRecords.shared = records;
        applyAssignRecipients(
          mergeRecipientCollections(records, state.assignFallbackRecipients || []),
          { fromRealtime: true }
        );
      }, async (err) => {
        console.warn("Planner shared users directory sync failed", err);
        stopPlannerAssignDirectorySync();
        if (!els.assignModal?.classList.contains("hidden")) {
          setAssignStatus(tr({
            en: "Shared users sync failed. Loading fallback recipients...",
            es: "Fallo la sincronizacion de usuarios compartidos. Cargando destinatarios de respaldo..."
          }), true);
        }
        state.assignDirectoryReady = false;
        await loadPlannerRecipientsFallback({ apply: true });
      })
    ];
  }

  function openAssignModal(options = {}) {
    const nextTrack = normalizeTrack(options.track || state.activeTrack || "wrestling");
    const nextMentalGameKey = String(options.mentalGameKey || "").trim().toLowerCase();
    if (nextTrack !== "wrestling") {
      state.assignScheduleMode = "day";
      state.assignWeekCount = 1;
    } else {
      const requestedMode = String(options.scheduleMode || state.assignScheduleMode || "day").trim().toLowerCase();
      state.assignScheduleMode = requestedMode === "week" ? "week" : "day";
      state.assignWeekCount = normalizeAssignWeekCount(options.weekCount || state.assignWeekCount || 1);
    }
    state.assignContext = {
      track: nextTrack,
      mentalGameKey: nextTrack === "mental"
        ? (nextMentalGameKey || state.mentalActiveGame || MENTAL_GAME_KEYS.GO_NO_GO)
        : ""
    };
    const dueSeed = nextTrack === "wrestling"
      ? (state.docInfo.date || getTodayDateKey())
      : getTodayDateKey();
    let nextDue = normalizeDateKeyValue(options.dueDate || state.assignDueDate || dueSeed);
    if (nextTrack === "wrestling" && state.assignScheduleMode === "week") {
      nextDue = getWeekStartDateKey(nextDue);
    }
    state.assignDueDate = nextDue;
    state.assignSearch = "";
    if (els.assignDueDateInput) els.assignDueDateInput.value = nextDue;
    if (els.assignSearchInput) els.assignSearchInput.value = "";
    applyAssignContextUi();
    els.assignModal?.classList.remove("hidden");
    focusPlannerWindow(els.assignModal, { smooth: true });
    setAssignStatus(getAssignContextMeta().statusHint);
    startPlannerAssignDirectorySync();
    if (!state.assignDirectoryReady && !state.assignAthletes.length) {
      setAssignStatus(tr({ en: "Loading recipients from shared users directory...", es: "Cargando destinatarios desde el directorio compartido..." }));
    }
    renderAssignAthleteList();
  }

  function closeAssignModal() {
    els.assignModal?.classList.add("hidden");
  }

  async function savePlannerAsTemplate() {
    const authUser = await waitForPlannerAuthReady(5500);
    if (!authUser?.id) {
      setBottomStatus(tr({
        en: "Session not ready. Sign in again and retry.",
        es: "La sesion no esta lista. Inicia sesion de nuevo e intenta otra vez."
      }), true);
      return;
    }
    if (state.templateSaveBusy || state.assignModalBusy) return;
    const plansRef = getPlannerWorkspaceCollectionRef("plans");
    if (!plansRef) {
      setBottomStatus(tr({ en: "Plan storage is not available.", es: "El almacenamiento de planes no esta disponible." }), true);
      return;
    }

    const loadedPlanId = String(state.activeLoadedSourceKey || "").startsWith("plan:")
      ? String(state.activeLoadedSourceKey || "").replace(/^plan:/, "").trim()
      : "";
    let saveAsNew = !loadedPlanId;
    let targetId = loadedPlanId;
    let defaultName = String(state.activeTemplateName || getPlannerTitle()).trim() || getPlannerTitle();

    if (loadedPlanId) {
      const updateCurrent = window.confirm(tr({
        en: `Save changes to current plan "${state.activeTemplateName}"?\nPress Cancel to save as a new plan.`,
        es: `Guardar cambios en el plan actual "${state.activeTemplateName}"?\nPresiona Cancelar para guardar como un plan nuevo.`
      }));
      if (!updateCurrent) {
        saveAsNew = true;
        targetId = "";
        defaultName = `${defaultName} copy`;
      }
    }

    const namePrompt = saveAsNew
      ? tr({ en: "Plan name", es: "Nombre del plan" })
      : tr({ en: "Plan name", es: "Nombre del plan" });
    const nextName = window.prompt(namePrompt, defaultName);
    if (nextName == null) return;
    const cleanName = String(nextName || "").trim();
    if (!cleanName) {
      setBottomStatus(tr({ en: "Plan name is required.", es: "El nombre del plan es obligatorio." }), true);
      return;
    }

    state.templateSaveBusy = true;
    const timestamp = getPlannerTimestamp();
    const profile = getPlannerProfile();
    const createdBy = String(profile?.name || authUser?.email || "Coach").trim();
    const payload = {
      title: cleanName,
      type: "day",
      focus: `${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min training flow`,
      coachNotes: tr({ en: "Saved from Coach Planner.", es: "Guardado desde Coach Planner." }),
      items: buildPlanItemsFromPlanner(),
      sourceMode: "coach_planner",
      sourceRefId: "",
      sourceLabel: tr({ en: "Coach Planner", es: "Coach Planner" }),
      range: {
        startKey: normalizeDateKeyValue(state.docInfo.date || getTodayDateKey()),
        endKey: normalizeDateKeyValue(state.docInfo.date || getTodayDateKey())
      },
      plannerCategories: getPlannerCategories().map((category) => ({ id: category.id, name: getCategoryNameById(category.id) })),
      plannerSchedule: serializePlannerSchedule(),
      plannerCategoryTimes: { ...state.categoryTimes },
      plannerCategoryNames: { ...state.categoryNames },
      plannerTotalTime: String(state.docInfo.totalTime || "90"),
      plannerDate: String(state.docInfo.date || ""),
      monthlyNotes: "",
      seasonYear: String(state.settings?.season || "").trim(),
      audience: {
        mode: "single",
        recipientNames: [],
        recipientIds: [],
        recipientUids: [],
        athleteNames: [],
        athleteIds: [],
        athleteUids: [],
        coachNames: [],
        coachIds: [],
        coachUids: [],
        groupId: "",
        groupName: ""
      },
      createdBy,
      updatedBy: createdBy,
      updatedAt: timestamp
    };
    if (saveAsNew) {
      payload.createdAt = timestamp;
    }

    try {
      const ref = saveAsNew ? plansRef.doc() : plansRef.doc(targetId);
      await ref.set(payload, { merge: true });
      state.activeLoadedSourceKey = getPlannerRecordSourceKey("plan", ref.id);
      state.activeTemplateId = "";
      state.activeTemplateName = cleanName;
      state.lastSavedTemplateId = ref.id;
      const message = saveAsNew
        ? tr({ en: `Plan saved as new: ${cleanName}`, es: `Plan guardado como nuevo: ${cleanName}` })
        : tr({ en: `Plan updated: ${cleanName}`, es: `Plan actualizado: ${cleanName}` });
      setBottomStatus(message);
      triggerToast(tr({ en: "Plan saved.", es: "Plan guardado." }));
      if (!els.templatesModal?.classList.contains("hidden")) {
        loadPlannerTemplates().catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to save planner plan", err);
      const errorCode = String(err?.code || "").trim();
      const detail = errorCode ? ` (${errorCode})` : "";
      setBottomStatus(tr({
        en: `Could not save plan${detail}.`,
        es: `No se pudo guardar el plan${detail}.`
      }), true);
    } finally {
      state.templateSaveBusy = false;
    }
  }

  async function sendPlannerTrainingToAthletes() {
    const authUserReady = await waitForPlannerAuthReady(5500);
    if (!authUserReady?.id) {
      setAssignStatus(tr({
        en: "Session not ready. Sign in again and retry.",
        es: "La sesion no esta lista. Inicia sesion de nuevo e intenta otra vez."
      }), true);
      return;
    }
    if (state.assignModalBusy) return;
    const selected = state.assignAthletes.filter((athlete) => state.selectedAthleteIds.includes(athlete.id));
    if (!selected.length) {
      setAssignStatus(tr({ en: "Select at least one recipient.", es: "Selecciona al menos un destinatario." }), true);
      return;
    }

    const contextTrack = getAssignContextTrack();
    const contextMeta = getAssignContextMeta(contextTrack, state.assignContext?.mentalGameKey);
    const plansRef = getPlannerWorkspaceCollectionRef("plans");
    const assignmentsRef = getPlannerWorkspaceCollectionRef("assignments");
    const needsPlanDoc = contextTrack !== "mental";
    if ((!plansRef && needsPlanDoc) || !assignmentsRef || typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) {
      const projectId = String((typeof window !== "undefined" && window.FIREBASE_CONFIG?.projectId) || "").trim() || "n/a";
      const uid = String(authUserReady?.id || "").trim() || "n/a";
      const detail = `[project:${projectId} uid:${uid}]`;
      setAssignStatus(tr({
        en: `Plan/assignment storage is not available ${detail}.`,
        es: `El almacenamiento de planes/asignaciones no esta disponible ${detail}.`
      }), true);
      return;
    }

    state.assignModalBusy = true;
    if (els.assignSendBtn) {
      els.assignSendBtn.disabled = true;
      els.assignSendBtn.textContent = contextMeta.sendingLabel;
    }
    setAssignStatus(tr({ en: "Saving assignments...", es: "Guardando asignaciones..." }));

    const scheduleTrack = getAssignContextTrack();
    const weeklyMode = scheduleTrack === "wrestling" && state.assignScheduleMode === "week";
    let dueDateKey = normalizeDateKeyValue(state.assignDueDate || getTodayDateKey());
    let dueLabel = formatDateLabel(dueDateKey);
    let wrestlingWindow = null;
    if (weeklyMode) {
      wrestlingWindow = getWeeklyScheduleWindow(dueDateKey, state.assignWeekCount);
      dueDateKey = wrestlingWindow.endKey;
      dueLabel = getWeeklyScheduleLabel(wrestlingWindow);
    }
    const wrestlingSchedulePayload = weeklyMode && wrestlingWindow
      ? {
          scheduleMode: "week",
          weekCount: wrestlingWindow.weekCount,
          weekStartKey: wrestlingWindow.startKey,
          weekEndKey: wrestlingWindow.endKey
        }
      : {
          scheduleMode: "day",
          weekCount: 1,
          weekStartKey: dueDateKey,
          weekEndKey: dueDateKey
        };
    const timestamp = getPlannerTimestamp();
    const authUser = getPlannerAuthUser();
    const profile = getPlannerProfile();
    const createdBy = String(profile?.name || authUser?.email || "Coach").trim();
    const athleteRecipients = selected.filter((athlete) => athlete.recipientType !== "coach");
    const coachRecipients = selected.filter((athlete) => athlete.recipientType === "coach");
    const athleteNames = athleteRecipients.map((athlete) => athlete.name);
    const athleteIds = athleteRecipients.map((athlete) => athlete.id);
    const athleteUids = athleteRecipients.map((athlete) => athlete.recipientUid).filter(Boolean);
    const coachNames = coachRecipients.map((coach) => coach.name);
    const coachIds = coachRecipients.map((coach) => coach.id);
    const coachUids = coachRecipients.map((coach) => coach.recipientUid).filter(Boolean);
    const audienceMode = selected.length > 1 ? "multi" : "single";

    try {
      await ensureAthleteRecipientLinks(athleteRecipients);

      let planId = "";
      let assignmentTitle = getPlannerTitle();
      let assignmentType = tr({ en: "Daily Plan", es: "Plan Diario" });
      let assignmentNote = tr({
        en: `Coach planner session (${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min total).`,
        es: `Sesion del planificador del entrenador (${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min total).`
      });
      let assignmentSource = tr({ en: "Coach Planner", es: "Planificador del Entrenador" });
      let assignmentPlanType = "day";
      let trackPayload = { trainingTrack: "wrestling" };
      const wrestlingPlanPayloadDetails = {
        plannerCategories: getPlannerCategories().map((category) => ({ id: category.id, name: getCategoryNameById(category.id) })),
        plannerSchedule: serializePlannerSchedule(),
        plannerCategoryTimes: { ...state.categoryTimes },
        plannerCategoryNames: { ...state.categoryNames }
      };

      if (contextTrack === "lifting") {
        const activeDay = getActiveLiftingDay();
        const dayLines = getLiftingDayExerciseLines(activeDay);
        assignmentTitle = `${state.liftingPlan.name || tr({ en: "Lifting Cycle", es: "Ciclo de Lifting" })} - ${activeDay?.name || tr({ en: `Day ${state.liftingActiveDay + 1}`, es: `Dia ${state.liftingActiveDay + 1}` })}`;
        assignmentType = tr({ en: "Lifting Plan", es: "Plan de Lifting" });
        assignmentNote = dayLines.length
          ? tr({
            en: `Complete ${activeDay?.name || "today's lifting"}: ${dayLines.join(" - ")}`,
            es: `Completa ${activeDay?.name || "el lifting de hoy"}: ${dayLines.join(" - ")}`
          })
          : tr({
            en: `Complete ${activeDay?.name || "today's lifting"} and log completion.`,
            es: `Completa ${activeDay?.name || "el lifting de hoy"} y registra la finalizacion.`
          });
        assignmentSource = tr({ en: "Lifting & Conditioning", es: "Lifting y Conditioning" });
        assignmentPlanType = "week";
        trackPayload = {
          trainingTrack: "lifting",
          liftingProtocolId: String(state.liftingPlan.id || "").trim(),
          liftingProtocolName: String(state.liftingPlan.name || "").trim(),
          liftingDayName: String(activeDay?.name || "").trim()
        };
        const planPayload = {
          title: assignmentTitle,
          type: "week",
          focus: String(state.liftingPlan.purpose || assignmentNote).trim(),
          coachNotes: String(state.liftingPlan.benefits || "").trim(),
          sourceMode: "lifting",
          sourceRefId: String(state.liftingPlan.id || "").trim(),
          sourceLabel: tr({ en: "Lifting & Conditioning", es: "Lifting y Conditioning" }),
          range: {
            startKey: dueDateKey,
            endKey: dueDateKey
          },
          items: buildLiftingPlanItemsForShare(activeDay),
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
        const planRef = plansRef.doc();
        await planRef.set(planPayload, { merge: true });
        planId = planRef.id;
      } else if (contextTrack === "mental") {
        const mentalKey = String(state.assignContext?.mentalGameKey || state.mentalActiveGame || MENTAL_GAME_KEYS.GO_NO_GO).trim().toLowerCase();
        const gameMeta = getLocalizedMentalMeta(mentalKey || MENTAL_GAME_KEYS.GO_NO_GO);
        assignmentTitle = tr({
          en: `Mind & Focus - ${gameMeta.title}`,
          es: `Mente y Enfoque - ${gameMeta.title}`
        });
        assignmentType = tr({ en: "Mind Game", es: "Juego Mental" });
        assignmentNote = `${gameMeta.cue} (${gameMeta.duration}s).`;
        assignmentSource = tr({ en: "Mind & Focus", es: "Mente y Enfoque" });
        assignmentPlanType = "day";
        trackPayload = {
          trainingTrack: "mental",
          mentalGameKey: mentalKey,
          mentalGameTitle: gameMeta.title,
          mentalGameDuration: gameMeta.duration
        };
      } else {
        if (weeklyMode && wrestlingWindow) {
          assignmentTitle = tr({
            en: `Weekly Training Plan (${wrestlingWindow.weekCount} ${wrestlingWindow.weekCount === 1 ? "week" : "weeks"})`,
            es: `Plan Semanal de Entrenamiento (${wrestlingWindow.weekCount} ${wrestlingWindow.weekCount === 1 ? "semana" : "semanas"})`
          });
          assignmentType = tr({ en: "Weekly Plan", es: "Plan Semanal" });
          assignmentPlanType = "week";
          assignmentNote = tr({
            en: `Coach planner session (${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min total). Repeat this same plan for ${wrestlingWindow.weekCount} ${wrestlingWindow.weekCount === 1 ? "week" : "weeks"}, Sunday to Saturday.`,
            es: `Sesion del planificador del entrenador (${Math.max(1, parseTimeValue(state.docInfo.totalTime || "90"))} min total). Repite este mismo plan por ${wrestlingWindow.weekCount} ${wrestlingWindow.weekCount === 1 ? "semana" : "semanas"}, de domingo a sabado.`
          });
        }
        const planRef = plansRef.doc();
        const planPayload = {
          title: assignmentTitle,
          type: assignmentPlanType,
          focus: assignmentNote,
          coachNotes: assignmentNote,
          sourceMode: "scratch",
          sourceRefId: "",
          sourceLabel: tr({ en: "Coach Planner", es: "Planificador del Entrenador" }),
          range: {
            startKey: weeklyMode && wrestlingWindow ? wrestlingWindow.startKey : dueDateKey,
            endKey: weeklyMode && wrestlingWindow ? wrestlingWindow.endKey : dueDateKey
          },
          items: buildPlanItemsFromPlanner(),
          ...wrestlingPlanPayloadDetails,
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
          updatedAt: timestamp,
          ...wrestlingSchedulePayload
        };
        await planRef.set(planPayload, { merge: true });
        planId = planRef.id;
      }

      const batch = firebaseFirestoreInstance.batch();
      const createdAssignments = [];
      selected.forEach((athlete) => {
        const assignmentRef = assignmentsRef.doc();
        const isCoach = athlete.recipientType === "coach";
        const initialStatus = "pending";
        const startDateKey = contextTrack === "wrestling" && weeklyMode && wrestlingWindow
          ? wrestlingWindow.startKey
          : dueDateKey;
        const endDateKey = contextTrack === "wrestling" && weeklyMode && wrestlingWindow
          ? wrestlingWindow.endKey
          : dueDateKey;
        const assignmentPayload = {
          title: assignmentTitle,
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
          type: assignmentType,
          startDateKey,
          endDateKey,
          dueDateKey,
          dueLabel,
          status: initialStatus,
          note: assignmentNote,
          source: assignmentSource,
          planId,
          planType: assignmentPlanType,
          ...trackPayload,
          ...(contextTrack === "wrestling" ? wrestlingPlanPayloadDetails : {}),
          ...(contextTrack === "wrestling" ? wrestlingSchedulePayload : {}),
          notificationStatus: "assignment_only",
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
      if (planId) state.lastSentPlanId = planId;

      const successMessage = tr({
        en: `${contextMeta.successNoun} shared with ${selected.length} recipient${selected.length === 1 ? "" : "s"}.`,
        es: `${contextMeta.successNoun} compartido con ${selected.length} destinatario${selected.length === 1 ? "" : "s"}.`
      });
      setAssignStatus(successMessage);
      setBottomStatus(successMessage);
      triggerToast(successMessage);
      closeAssignModal();
    } catch (err) {
      console.warn("Failed to share planner assignments", err);
      const errorCode = String(err?.code || "").trim();
      const detail = errorCode ? ` (${errorCode})` : "";
      setAssignStatus(tr({
        en: `Could not share plan${detail}. Try again.`,
        es: `No se pudo compartir el plan${detail}. Intenta de nuevo.`
      }), true);
    } finally {
      state.assignModalBusy = false;
      if (els.assignSendBtn) {
        els.assignSendBtn.disabled = false;
        els.assignSendBtn.textContent = getAssignContextMeta().sendLabel;
      }
    }
  }

  function getPlannerUsersCollectionRef() {
    try {
      if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
      const collectionName = "users";
      return firebaseFirestoreInstance.collection(collectionName);
    } catch {
      return null;
    }
  }

  function getPlannerClientStateDocRef() {
    try {
      const usersRef = getPlannerUsersCollectionRef();
      const authUser = getPlannerAuthUser();
      const uid = String(authUser?.id || "").trim();
      if (!usersRef || !uid) return null;
      return usersRef.doc(uid).collection("client_state").doc("planner_state");
    } catch {
      return null;
    }
  }

  function buildPlannerClientStatePayload() {
    return {
      liftingDraft: state.liftingDraft || {},
      mentalDraft: state.mentalDraft || {},
      mentalScores: normalizeMentalScoreValue(state.mentalScores || buildDefaultMentalScores()),
      mentalAudioMuted: Boolean(state.mentalAudioMuted),
      liftingPlan: normalizeLiftingPlan(state.liftingPlan || buildDefaultLiftingPlan()),
      liftingActiveDay: Math.max(0, Math.min(6, parseInt(String(state.liftingActiveDay || 0), 10) || 0)),
      liftingActiveTab: normalizeLiftingTab(state.liftingTab || "editor"),
      updatedAt: new Date().toISOString()
    };
  }

  function applyPlannerClientStatePayload(payload = {}) {
    const safe = payload && typeof payload === "object" ? payload : {};
    state.plannerClientStateApplying = true;
    state.liftingDraft = safe.liftingDraft && typeof safe.liftingDraft === "object" ? safe.liftingDraft : (state.liftingDraft || {});
    state.mentalDraft = safe.mentalDraft && typeof safe.mentalDraft === "object" ? safe.mentalDraft : (state.mentalDraft || {});
    state.mentalScores = normalizeMentalScoreValue(safe.mentalScores || state.mentalScores || buildDefaultMentalScores());
    state.mentalAudioMuted = Boolean(
      typeof safe.mentalAudioMuted === "boolean" ? safe.mentalAudioMuted : state.mentalAudioMuted
    );
    state.liftingPlan = normalizeLiftingPlan(safe.liftingPlan || state.liftingPlan || buildDefaultLiftingPlan());
    state.liftingActiveDay = Math.max(0, Math.min(6, parseInt(String(safe.liftingActiveDay ?? state.liftingActiveDay ?? 0), 10) || 0));
    state.liftingTab = normalizeLiftingTab(safe.liftingActiveTab || state.liftingTab || "editor");
    writeJson(STORAGE_KEYS.liftingDraft, state.liftingDraft);
    writeJson(STORAGE_KEYS.mentalDraft, state.mentalDraft);
    writeJson(STORAGE_KEYS.mentalScores, state.mentalScores);
    writeJson(STORAGE_KEYS.mentalAudioMuted, state.mentalAudioMuted);
    writeJson(STORAGE_KEYS.liftingPlan, state.liftingPlan);
    writeJson(STORAGE_KEYS.liftingActiveDay, state.liftingActiveDay);
    writeJson(STORAGE_KEYS.liftingActiveTab, state.liftingTab);
    state.plannerClientStateApplying = false;
  }

  function queuePlannerClientStateSync() {
    if (state.plannerClientStateApplying) return;
    if (state.plannerClientStateSyncTimer) {
      clearTimeout(state.plannerClientStateSyncTimer);
      state.plannerClientStateSyncTimer = null;
    }
    state.plannerClientStateSyncTimer = window.setTimeout(() => {
      syncPlannerClientStateNow().catch(() => {});
    }, 500);
  }

  async function syncPlannerClientStateNow() {
    const docRef = getPlannerClientStateDocRef();
    if (!docRef) return;
    try {
      await docRef.set(buildPlannerClientStatePayload(), { merge: true });
    } catch (err) {
      console.warn("Planner client state sync failed", err);
    }
  }

  function stopPlannerClientStateSync() {
    if (state.plannerClientStateSyncTimer) {
      clearTimeout(state.plannerClientStateSyncTimer);
      state.plannerClientStateSyncTimer = null;
    }
    if (typeof state.plannerClientStateUnsub === "function") {
      try {
        state.plannerClientStateUnsub();
      } catch {
        // ignore unsubscribe errors
      }
    }
    state.plannerClientStateUnsub = null;
    state.plannerClientStateReady = false;
  }

  function startPlannerClientStateSync({ force = false } = {}) {
    if (force) stopPlannerClientStateSync();
    if (state.plannerClientStateUnsub) return;
    const docRef = getPlannerClientStateDocRef();
    if (!docRef?.onSnapshot) return;
    state.plannerClientStateUnsub = docRef.onSnapshot((docSnap) => {
      // Ignore the local echo of our own pending writes: state is already current,
      // and re-rendering here destroys the field the coach is typing in.
      if (docSnap?.metadata?.hasPendingWrites) return;
      const exists = typeof docSnap?.exists === "function" ? docSnap.exists() : Boolean(docSnap?.exists);
      if (!exists) {
        state.plannerClientStateReady = true;
        syncPlannerClientStateNow().catch(() => {});
        return;
      }
      state.plannerClientStateReady = true;
      runWhenPlannerIdle("planner-client-state", () => {
        applyPlannerClientStatePayload(docSnap.data() || {});
        render();
      });
    }, (err) => {
      console.warn("Planner client state snapshot failed", err);
      state.plannerClientStateReady = false;
    });
  }

  function getPlannerSharedUserDirectoryRef() {
    try {
      if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
      return firebaseFirestoreInstance
        .collection(getPlannerSharedCollectionName())
        .doc("global_user_directory")
        .collection("items");
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

  function queuePlannerDailySync() {
    if (state.dailySyncTimer) {
      clearTimeout(state.dailySyncTimer);
      state.dailySyncTimer = null;
    }
    state.dailySyncTimer = window.setTimeout(() => {
      syncPlannerDailyNow().catch(() => {});
    }, 700);
  }

  async function syncPlannerDailyNow() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    if (!usersRef || !uid) return;
    const payload = {
      date: String(state.docInfo.date || "").trim(),
      totalTime: String(state.docInfo.totalTime || "90").trim(),
      schedule: normalizePlannerScheduleState(state.schedule || {}, getPlannerCategories()),
      categoryTimes: normalizePlannerCategoryTimesState(state.categoryTimes || {}, getPlannerCategories())
    };
    const updatedAt = String(state.dailyDraftUpdatedAt || "").trim() || new Date().toISOString();
    try {
      await usersRef.doc(uid).set({
        plannerDailyDraft: payload,
        plannerDailyDraftUpdatedAt: updatedAt
      }, { merge: true });
    } catch (err) {
      console.warn("Planner daily draft sync failed", err);
    }
  }

  async function hydratePlannerDailyFromCloud() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    const localSnapshot = {
      date: state.docInfo.date,
      totalTime: state.docInfo.totalTime,
      schedule: state.schedule,
      categoryTimes: state.categoryTimes,
      plannerCategories: getPlannerCategories()
    };
    const localHasData = hasMeaningfulPlannerDraft(localSnapshot, getPlannerCategories());
    if (!usersRef || !uid) {
      if (localHasData) {
        persistDaily({ syncCloud: false, updatedAt: state.dailyDraftUpdatedAt });
      }
      return;
    }
    try {
      const doc = await usersRef.doc(uid).get();
      const raw = doc.exists ? (doc.data() || {}) : {};
      const remoteDraft = raw?.plannerDailyDraft && typeof raw.plannerDailyDraft === "object"
        ? raw.plannerDailyDraft
        : {};
      const remoteUpdatedAt = String(
        raw?.plannerDailyDraftUpdatedAt || remoteDraft?.updatedAt || ""
      ).trim();
      const localUpdatedAt = String(state.dailyDraftUpdatedAt || "").trim();
      const remoteMs = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : 0;
      const localMs = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
      const remoteHasData = hasMeaningfulPlannerDraft(remoteDraft, getPlannerCategories());
      if (!remoteHasData) {
        if (localHasData) {
          persistDaily({ syncCloud: true, updatedAt: state.dailyDraftUpdatedAt });
          return;
        }
        const hydratedFromWorkspace = await hydratePlannerFromLatestWorkspacePlan({ syncCloud: true });
        if (!hydratedFromWorkspace) {
          persistDaily({ syncCloud: false, updatedAt: state.dailyDraftUpdatedAt });
        }
        return;
      }
      if (!localHasData || remoteMs > localMs + 1000) {
        runWhenPlannerIdle("daily-draft-hydrate", () => {
          state.docInfo.date = String(remoteDraft?.date || "").trim();
          state.docInfo.totalTime = String(remoteDraft?.totalTime || "90").trim() || "90";
          state.schedule = normalizePlannerScheduleState(remoteDraft?.schedule || {}, getPlannerCategories());
          state.categoryTimes = normalizePlannerCategoryTimesState(remoteDraft?.categoryTimes || {}, getPlannerCategories());
          persistDaily({ syncCloud: false, updatedAt: remoteUpdatedAt || new Date().toISOString() });
          render();
        });
      } else {
        persistDaily({ syncCloud: true, updatedAt: state.dailyDraftUpdatedAt });
      }
    } catch (err) {
      console.warn("Planner daily draft cloud hydrate failed", err);
      if (localHasData) {
        persistDaily({ syncCloud: true, updatedAt: state.dailyDraftUpdatedAt });
        return;
      }
      const hydratedFromWorkspace = await hydratePlannerFromLatestWorkspacePlan({ syncCloud: false });
      if (!hydratedFromWorkspace) {
        persistDaily({ syncCloud: false, updatedAt: state.dailyDraftUpdatedAt });
      }
    }
  }

  async function syncPlannerSettingsNow() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    if (!usersRef || !uid) return;
    const settingsPayload = normalizePlannerSettings(state.settings, { migrateLegacy: true });
    state.settings = settingsPayload;
    persistSettings();
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
      const rawRemoteLogo = String(raw?.plannerTemplateSettings?.logoUrl || "").trim();
      const remoteLogoWasSanitized = isInlineImageDataUrl(rawRemoteLogo)
        && rawRemoteLogo.length > MAX_LOGO_DATA_URL_LENGTH;
      const remoteSerialized = JSON.stringify(remoteSettings);
      const localSerialized = JSON.stringify(localSettings);
      if (remoteSerialized !== localSerialized) {
        if (raw?.plannerTemplateSettings && typeof raw.plannerTemplateSettings === "object" && Object.keys(raw.plannerTemplateSettings).length) {
          runWhenPlannerIdle("settings-hydrate", () => {
            mergePlannerSettings(remoteSettings, { sync: false });
            render();
          });
        } else {
          mergePlannerSettings(localSettings, { sync: true });
        }
      } else if (remoteLogoWasSanitized) {
        mergePlannerSettings(localSettings, { sync: true });
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

  function canWriteSharedLiftingLibrary() {
    if (state.readOnly) return false;
    const authUser = getPlannerAuthUser();
    if (!String(authUser?.id || "").trim()) return false;
    return isCoachLikeRole(getPlannerProfile()?.role || authUser?.role || "");
  }

  function getPlannerCurrentView() {
    if (typeof window !== "undefined" && typeof window.wplGetCurrentView === "function") {
      try {
        return String(window.wplGetCurrentView() || "").trim().toLowerCase();
      } catch {
        return "";
      }
    }
    return "";
  }

  function isCoachPlannerRouteActive() {
    try {
      return Boolean(document.querySelector(
        ".tab.active[data-tab='coach-home'], .tab.active[data-tab='coach-athletes'], .tab.active[data-tab='coach-plans'], .tab.active[data-tab='coach-competition'], .tab.active[data-tab='coach-messages']"
      ));
    } catch {
      return false;
    }
  }

  function isPlansEditRouteRequest() {
    try {
      const path = String(window.location?.pathname || "");
      const params = new URLSearchParams(window.location?.search || "");
      const routeTab = String(window.WPL_ROUTE_TAB || "").trim();
      const launchTab = String(window.APP_LAUNCH_CONFIG?.tab || "").trim();
      return (
        /\/plans\/?$/.test(path)
        || routeTab === "plans"
        || launchTab === "coach-plans"
        || params.get("openTab") === "coach-plans"
        || params.get("guestPlans") === "1"
      );
    } catch {
      return false;
    }
  }

  function isPlannerReadOnlyMode() {
    const coachPlansPanel = document.getElementById("panel-coach-plans") || document.getElementById("panel-plans");
    const coachPlansTabActive = Boolean(document.querySelector(".tab.active[data-tab='coach-plans']"));
    const profileRole = String(getPlannerProfile()?.role || "").trim().toLowerCase();
    const authRole = String(getPlannerAuthUser()?.role || "").trim().toLowerCase();
    const effectiveRole = profileRole || authRole;

    if (isCoachLikeRole(effectiveRole) || coachPlansTabActive) {
      if ((coachPlansPanel && !coachPlansPanel.classList.contains("hidden")) || coachPlansTabActive) {
        return false;
      }
    }

    if (isCoachLikeRole(profileRole) || isCoachLikeRole(authRole)) return false;
    if (isPlansEditRouteRequest() && (coachPlansPanel && !coachPlansPanel.classList.contains("hidden"))) return false;
    const view = getPlannerCurrentView();
    if (view === "coach" || view === "admin") return false;
    if (isCoachPlannerRouteActive()) return false;
    if (view === "athlete" || view === "parent") return true;
    if (!effectiveRole) return false;
    return !isCoachLikeRole(effectiveRole);
  }

  function applyPlannerAccessMode() {
    const readOnly = isPlannerReadOnlyMode();
    state.readOnly = readOnly;
    root.classList.toggle("planner-readonly", readOnly);

    const controls = Array.from(root.querySelectorAll("input, select, textarea, button"));
    controls.forEach((control) => {
      const keepEnabled = !readOnly || control.matches("[data-planner-track], [data-lifting-tab]");
      control.disabled = !keepEnabled;
      control.setAttribute("aria-disabled", keepEnabled ? "false" : "true");
    });

    if (readOnly) {
      if (els.headerTitle) {
        els.headerTitle.textContent = tr({
          en: "Training and Tasks to Do",
          es: "Entrenamiento y tareas por hacer"
        });
      }
      if (els.headerSubtitle) {
        els.headerSubtitle.textContent = tr({
          en: "Athlete read-only view of coach plans.",
          es: "Vista de solo lectura para atletas."
        });
      }
      closeSettingsModal();
      closeLibraryModal();
      closeTemplatesModal();
      closeAssignModal();
      setBottomStatus(tr({
        en: "Read-only mode: athlete can view coach plans only.",
        es: "Modo solo lectura: el atleta solo puede ver los planes del entrenador."
      }));
      return;
    }

    setBottomStatus(getBottomStatusDefaultMessage());
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
    const incomingCategories = Array.isArray(data?.plannerCategories) ? normalizePlannerCategoryCollection(data.plannerCategories) : [];
    const incomingCategoryNames = data?.plannerCategoryNames && typeof data.plannerCategoryNames === "object"
      ? data.plannerCategoryNames
      : {};
    const categoryNames = getPlannerCategories().reduce((acc, category) => {
      const candidate = String(incomingCategoryNames?.[category.id] || "").trim();
      if (candidate) acc[category.id] = candidate;
      return acc;
    }, {});
    incomingCategories.forEach((category) => {
      const id = String(category?.id || "").trim();
      if (!id || categoryNames[id]) return;
      categoryNames[id] = String(category?.name || id).trim() || id;
    });
    return {
      uid: String(uid || "").trim(),
      name: String(data?.name || "").trim() || String(data?.email || "").trim() || tr({ en: "Coach", es: "Entrenador" }),
      email: String(data?.email || "").trim(),
      entries,
      categoryNames,
      updatedAt: String(data?.plannerLibraryUpdatedAt || data?.updatedAt || "").trim()
    };
  }

  function renderCoachLibraries() {
    if (!els.coachLibraries) return;
    if (!state.coachLibraries.length) {
      els.coachLibraries.innerHTML = `<p class=\"small muted\">${escapeHtml(tr({ en: "No coach libraries available yet.", es: "Aun no hay librerias de entrenadores disponibles." }))}</p>`;
      return;
    }
    const cardsHtml = state.coachLibraries.map((coach) => {
      const grouped = getPlannerCategories().map((category) => {
        const entries = coach.entries.filter((entry) => normalizeCategoryId(entry.categoryId) === category.id);
        if (!entries.length) return "";
        const label = String(coach.categoryNames?.[category.id] || getCategoryNameById(category.id)).trim() || getCategoryNameById(category.id);
        const items = entries.map((entry) => (
          `<li>
            <span>${escapeHtml(entry.name)}</span>
            <button type=\"button\" class=\"ghost\" data-action=\"import-coach-item\" data-coach-uid=\"${escapeHtml(coach.uid)}\" data-item-id=\"${escapeHtml(entry.id)}\" title=\"${escapeHtml(tr({ en: "Add to current library", es: "Agregar a la libreria actual" }))}\">+</button>
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
            <span>${escapeHtml(coach.email || tr({ en: "coach", es: "entrenador" }))}</span>
          </header>
          ${grouped || `<p class=\"small muted\">${escapeHtml(tr({ en: "No exercises shared yet.", es: "Aun no hay ejercicios compartidos." }))}</p>`}
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
      triggerToast(tr({ en: "Exercise already exists in this category.", es: "Ese ejercicio ya existe en esta categoria." }));
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
    triggerToast(tr({ en: `Added from ${coach.name}`, es: `Agregado desde ${coach.name}` }));
  }

  async function syncPlannerLibraryNow() {
    const usersRef = getPlannerUsersCollectionRef();
    const authUser = getPlannerAuthUser();
    const uid = String(authUser?.id || "").trim();
    if (!usersRef || !uid) return;
    try {
      await usersRef.doc(uid).set({
        plannerCategories: getPlannerCategories().map((category) => ({ id: category.id, name: getCategoryNameById(category.id) })),
        plannerLibrary: normalizeLibraryEntries(state.exerciseLibrary),
        plannerCategoryNames: { ...state.categoryNames },
        plannerLibraryUpdatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Planner library sync failed", err);
    }
  }

  function getSharedPlannerCatalogDocRef() {
    try {
      if (typeof firebaseFirestoreInstance === "undefined" || !firebaseFirestoreInstance) return null;
      return firebaseFirestoreInstance
        .collection(getPlannerSharedCollectionName())
        .doc(SHARED_WRESTLING_PLANNER_DOC_ID);
    } catch {
      return null;
    }
  }

  function canWriteSharedPlannerCatalog() {
    if (state.readOnly) return false;
    const authUser = getPlannerAuthUser();
    if (!String(authUser?.id || "").trim()) return false;
    return isCoachLikeRole(getPlannerProfile()?.role || authUser?.role || "");
  }

  function buildSharedPlannerCatalogPayload() {
    return {
      categories: getPlannerCategories().map((category) => ({
        id: category.id,
        name: getCategoryNameById(category.id)
      })),
      categoryNames: { ...state.categoryNames },
      categoryTimes: { ...state.categoryTimes },
      exerciseLibrary: normalizeLibraryEntries(state.exerciseLibrary || []),
      updatedAt: getPlannerTimestamp(),
      updatedByUid: String(getPlannerAuthUser()?.id || "").trim(),
      updatedByName: String(getPlannerProfile()?.name || getPlannerAuthUser()?.email || "Coach").trim()
    };
  }

  function applySharedPlannerCatalogData(rawData = {}, { mergeLocal = true } = {}) {
    const payload = rawData && typeof rawData === "object" ? rawData : {};
    const hasIncomingCategories = Array.isArray(payload.categories) && payload.categories.length > 0;
    const incomingCategories = hasIncomingCategories
      ? normalizePlannerCategoryCollection(payload.categories)
      : [];
    const mergedCategories = hasIncomingCategories
      ? (mergeLocal
        ? mergePlannerCategoryCollections(incomingCategories, getPlannerCategories())
        : incomingCategories)
      : normalizePlannerCategoryCollection(getPlannerCategories());
    state.wrestlingCategories = mergedCategories;
    runtimeWrestlingCategories = mergedCategories.map((category) => ({ ...category }));
    const hasSharedNames = payload.categoryNames && typeof payload.categoryNames === "object";
    const incomingNames = payload.categoryNames && typeof payload.categoryNames === "object" ? payload.categoryNames : {};
    const mergedNames = {
      ...(mergeLocal || !hasSharedNames ? state.categoryNames : {}),
      ...incomingNames
    };
    const hasSharedTimes = payload.categoryTimes && typeof payload.categoryTimes === "object";
    const incomingTimes = payload.categoryTimes && typeof payload.categoryTimes === "object" ? payload.categoryTimes : {};
    const mergedTimes = {
      ...(mergeLocal || !hasSharedTimes ? state.categoryTimes : {}),
      ...incomingTimes
    };
    const hasSharedLibrary = Array.isArray(payload.exerciseLibrary);
    const incomingLibrary = normalizeLibraryEntries(payload.exerciseLibrary || [], { dropUnknownCategory: false });
    const mergedLibrary = (mergeLocal || !hasSharedLibrary)
      ? mergePlannerLibraryEntries(incomingLibrary, state.exerciseLibrary || [])
      : incomingLibrary;
    state.categoryNames = mergedNames;
    state.categoryTimes = mergedTimes;
    state.exerciseLibrary = mergedLibrary;
    reconcilePlannerDataForCategories({ keepLibraryUnknown: false });
    persistCategories();
    persistCategoryNames();
    persistDaily();
    persistLibrary();
  }

  async function syncSharedPlannerCatalogNow() {
    if (!canWriteSharedPlannerCatalog()) return;
    const docRef = getSharedPlannerCatalogDocRef();
    if (!docRef) return;
    try {
      await docRef.set(buildSharedPlannerCatalogPayload(), { merge: true });
      state.plannerCatalogReady = true;
      state.plannerCatalogStatus = tr({
        en: "Shared planner catalog synced.",
        es: "Catalogo compartido del planificador sincronizado."
      });
    } catch (err) {
      console.warn("Shared planner catalog sync failed", err);
      state.plannerCatalogStatus = tr({
        en: "Shared planner catalog sync failed.",
        es: "Fallo la sincronizacion del catalogo compartido."
      });
    }
  }

  function stopSharedPlannerCatalogSync() {
    if (state.plannerCatalogSyncTimer) {
      clearTimeout(state.plannerCatalogSyncTimer);
      state.plannerCatalogSyncTimer = null;
    }
    if (typeof state.plannerCatalogUnsub === "function") {
      try {
        state.plannerCatalogUnsub();
      } catch {
        // ignore unsubscribe errors
      }
    }
    state.plannerCatalogUnsub = null;
  }

  function startSharedPlannerCatalogSync({ force = false } = {}) {
    if (force) stopSharedPlannerCatalogSync();
    if (state.plannerCatalogUnsub) return;
    if (!hasPlannerAuthSession()) {
      state.plannerCatalogReady = false;
      state.plannerCatalogStatus = tr({
        en: "Waiting for sign-in to load shared planner catalog...",
        es: "Esperando inicio de sesion para cargar el catalogo compartido..."
      });
      waitForPlannerAuthReady(5500).then((user) => {
        if (user?.id) {
          startSharedPlannerCatalogSync({ force: true });
        }
      }).catch(() => {});
      return;
    }
    const docRef = getSharedPlannerCatalogDocRef();
    if (!docRef?.onSnapshot) return;
    state.plannerCatalogStatus = tr({
      en: "Loading shared planner catalog...",
      es: "Cargando catalogo compartido del planificador..."
    });
    state.plannerCatalogUnsub = docRef.onSnapshot((docSnap) => {
      // Ignore the local echo of our own pending writes; re-rendering on it
      // rebuilds the planner DOM mid-keystroke and breaks editing.
      if (docSnap?.metadata?.hasPendingWrites) return;
      const exists = typeof docSnap?.exists === "function" ? docSnap.exists() : Boolean(docSnap?.exists);
      if (!exists) {
        state.plannerCatalogReady = false;
        if (canWriteSharedPlannerCatalog()) {
          syncSharedPlannerCatalogNow().catch(() => {});
        }
        return;
      }
      const data = docSnap.data() || {};
      runWhenPlannerIdle("planner-catalog", () => {
        const hasSharedCategories = Array.isArray(data?.categories) && data.categories.length > 0;
        applySharedPlannerCatalogData(data, { mergeLocal: !hasSharedCategories });
        state.plannerCatalogReady = true;
        state.plannerCatalogStatus = tr({
          en: "Shared planner catalog loaded.",
          es: "Catalogo compartido del planificador cargado."
        });
        renderCategorySelectOptions();
        renderRows();
        renderLibraryGroups();
        renderCoachLibraries();
        updateTimeStatus();
      });
    }, (err) => {
      console.warn("Shared planner catalog snapshot failed", err);
      state.plannerCatalogStatus = tr({
        en: "Shared planner catalog unavailable.",
        es: "Catalogo compartido no disponible."
      });
    });
  }

  function queuePlannerLibrarySync() {
    if (state.librarySyncTimer) {
      clearTimeout(state.librarySyncTimer);
      state.librarySyncTimer = null;
    }
    state.librarySyncTimer = window.setTimeout(() => {
      syncPlannerLibraryNow().catch(() => {});
      syncSharedPlannerCatalogNow().catch(() => {});
    }, 650);
  }

  function subscribeCoachLibraries() {
    if (!hasPlannerAuthSession()) {
      setCoachLibrariesStatus(tr({
        en: "Waiting for sign-in to load coach libraries...",
        es: "Esperando inicio de sesion para cargar las librerias de entrenadores..."
      }));
      renderCoachLibraries();
      waitForPlannerAuthReady(5500).then((user) => {
        if (user?.id) subscribeCoachLibraries();
      }).catch(() => {});
      return;
    }
    const usersRef = getPlannerUsersCollectionRef();
    if (!usersRef) {
      setCoachLibrariesStatus(tr({ en: "Coach libraries available after Firebase connects.", es: "Las librerias de entrenadores estaran disponibles cuando Firebase conecte." }));
      renderCoachLibraries();
      return;
    }
    if (state.coachLibrariesUnsub) return;
    setCoachLibrariesStatus(tr({ en: "Syncing coach libraries...", es: "Sincronizando librerias de entrenadores..." }));
    state.coachLibrariesUnsub = usersRef.onSnapshot((snapshot) => {
      const rows = snapshot.docs
        .map((doc) => normalizeCoachLibraryFromUserDoc(doc.id, doc.data() || {}))
        .filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name));
      runWhenPlannerIdle("coach-libraries", () => {
        state.coachLibraries = rows;
        state.coachLibrariesReady = true;
        setCoachLibrariesStatus(rows.length
          ? tr({ en: `${rows.length} coach libraries loaded.`, es: `${rows.length} librerias de entrenadores cargadas.` })
          : tr({ en: "No coach libraries yet.", es: "Aun no hay librerias de entrenadores." }));
        renderCoachLibraries();
      });
    }, (err) => {
      console.warn("Failed to load coach libraries", err);
      setCoachLibrariesStatus(tr({ en: "Could not load coach libraries right now.", es: "No se pudieron cargar las librerias de entrenadores ahora." }));
      renderCoachLibraries();
    });
  }

  function ensureCoachLibrariesSync() {
    subscribeCoachLibraries();
  }

  function renderSettingsPrintColorInputs() {
    if (!state.tempSettings) return;
    if (els.settingsPrintBorderInput) {
      els.settingsPrintBorderInput.value = normalizeHexColor(
        state.tempSettings.printBorderColor,
        DEFAULT_PRINT_BORDER_COLOR
      );
      els.settingsPrintBorderInput.disabled = false;
    }
    if (els.settingsPrintTextInput) {
      els.settingsPrintTextInput.value = normalizeHexColor(
        state.tempSettings.printTextColor,
        DEFAULT_PRINT_TEXT_COLOR
      );
      els.settingsPrintTextInput.disabled = false;
    }
    qa(".planner-print-preset", els.settingsModal || root).forEach((button) => {
      const presetBorder = normalizeHexColor(button.dataset.border, DEFAULT_PRINT_BORDER_COLOR);
      const presetText = normalizeHexColor(button.dataset.text, DEFAULT_PRINT_TEXT_COLOR);
      const currentBorder = normalizeHexColor(state.tempSettings.printBorderColor, DEFAULT_PRINT_BORDER_COLOR);
      const currentText = normalizeHexColor(state.tempSettings.printTextColor, DEFAULT_PRINT_TEXT_COLOR);
      const active = presetBorder === currentBorder && presetText === currentText;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyTempManualPrintColor(field, value) {
    if (!state.tempSettings) return;
    const safeField = field === "text" ? "text" : "border";
    state.tempSettings.printAutoColors = false;
    if (safeField === "border") {
      state.tempSettings.printBorderColor = normalizeHexColor(value, DEFAULT_PRINT_BORDER_COLOR);
      state.tempSettings.printTextColor = ensureDarkPrintColor(
        state.tempSettings.printTextColor,
        state.tempSettings.printBorderColor
      );
    } else {
      state.tempSettings.printTextColor = normalizeHexColor(value, DEFAULT_PRINT_TEXT_COLOR);
    }
    renderSettingsPrintColorInputs();
  }

  function applyTempPrintPreset(borderColor, textColor) {
    if (!state.tempSettings) return;
    const safeBorder = normalizeHexColor(borderColor, DEFAULT_PRINT_BORDER_COLOR);
    const safeText = ensureDarkPrintColor(
      normalizeHexColor(textColor, DEFAULT_PRINT_TEXT_COLOR),
      safeBorder
    );
    state.tempSettings.printAutoColors = false;
    state.tempSettings.printBorderColor = safeBorder;
    state.tempSettings.printTextColor = safeText;
    renderSettingsPrintColorInputs();
  }

  function openSettingsModal() {
    state.tempSettings = { ...state.settings };
    state.tempSettings.printAutoColors = false;
    if (els.settingsClubInput) els.settingsClubInput.value = state.tempSettings.clubName || "";
    if (els.settingsCoachInput) els.settingsCoachInput.value = state.tempSettings.coach || "";
    if (els.settingsSeasonInput) els.settingsSeasonInput.value = state.tempSettings.season || "";
    if (els.settingsFooterInput) els.settingsFooterInput.value = state.tempSettings.footerMessage || "";
    renderSettingsPrintColorInputs();
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

  async function saveSettings() {
    if (!state.tempSettings) return;
    state.tempSettings.printAutoColors = false;
    const draft = normalizePlannerSettings(state.tempSettings, { migrateLegacy: true });
    mergePlannerSettings(draft, { sync: true });
    closeSettingsModal();
    triggerToast(tr({ en: "Plan settings saved!", es: "Configuracion del plan guardada." }));
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
    const safeCategoryId = normalizeCategoryId(categoryId);
    const cleanName = String(exerciseName || "");
    const nextItem = { id: makeId(), name: cleanName };
    state.schedule[safeCategoryId] = [...(state.schedule[safeCategoryId] || []), nextItem];
    state.pendingFocus = cleanName.trim() ? null : { categoryId: safeCategoryId, itemId: nextItem.id };
    persistDaily();
    renderRows();
  }

  function removeFromSchedule(categoryId, itemId) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    state.schedule[safeCategoryId] = (state.schedule[safeCategoryId] || []).filter((item) => item.id !== itemId);
    persistDaily();
    renderRows();
  }

  function moveScheduleItem(categoryId, itemId, direction) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const list = [...(state.schedule[safeCategoryId] || [])];
    const idx = list.findIndex((item) => item.id === itemId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[nextIdx];
    list[nextIdx] = temp;
    state.schedule[safeCategoryId] = list;
    persistDaily();
    renderRows();
  }

  function updateScheduleItem(categoryId, itemId, nextName) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    state.schedule[safeCategoryId] = (state.schedule[safeCategoryId] || []).map((item) => {
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
    const categoryId = normalizeCategoryId(els.newExerciseCategorySelect?.value || getFirstPlannerCategoryId());
    if (!name) {
      triggerToast(tr({ en: "Write an exercise name first.", es: "Escribe primero el nombre del ejercicio." }));
      els.newExerciseNameInput?.focus();
      return;
    }
    if (isDuplicateLibraryEntry(name, categoryId)) {
      triggerToast(tr({ en: "Exercise already exists in this category.", es: "Ese ejercicio ya existe en esta categoria." }));
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
    triggerToast(tr({ en: "Exercise saved to library!", es: "Ejercicio guardado en la libreria." }));
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
    const defaults = CATEGORY_NAME_TRANSLATIONS[safeCategoryId] || { en: safeCategoryId, es: safeCategoryId };
    const fallback = getPlannerLang() === "es" ? defaults.es : defaults.en;
    const resolved = cleanName || fallback || safeCategoryId;
    state.categoryNames[safeCategoryId] = resolved;
    state.wrestlingCategories = getPlannerCategories().map((category) => {
      if (category.id !== safeCategoryId) return { ...category };
      return { ...category, name: resolved };
    });
    persistCategories();
    persistCategoryNames();
    queuePlannerLibrarySync();
    renderCategorySelectOptions();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
  }

  function getNextPlannerCategoryName() {
    const baseName = tr({ en: "New Section", es: "Nueva seccion" });
    const existing = new Set(
      getPlannerCategories().map((category) => String(getCategoryNameById(category.id) || "").trim().toLowerCase())
    );
    if (!existing.has(baseName.toLowerCase())) return baseName;
    let index = 2;
    while (existing.has(`${baseName.toLowerCase()} ${index}`)) {
      index += 1;
    }
    return `${baseName} ${index}`;
  }

  function addPlannerCategory(name = "") {
    const categories = getPlannerCategories();
    const cleanName = String(name || "").trim() || getNextPlannerCategoryName();
    const usedIds = new Set(categories.map((category) => category.id));
    const categoryId = makeUniquePlannerCategoryId(cleanName, usedIds);
    state.wrestlingCategories = [...categories, { id: categoryId, name: cleanName }];
    state.categoryNames[categoryId] = cleanName;
    state.schedule[categoryId] = [];
    state.categoryTimes[categoryId] = "0";
    state.categoryDrafts[categoryId] = "";
    state.pendingCategoryFocus = categoryId;
    reconcilePlannerDataForCategories({ keepLibraryUnknown: false });
    persistCategories();
    persistCategoryNames();
    persistDaily();
    persistLibrary();
    queuePlannerLibrarySync();
    renderCategorySelectOptions();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
    triggerToast(tr({ en: "Section added.", es: "Seccion agregada." }));
  }

  function movePlannerCategory(categoryId, direction) {
    const safeCategoryId = String(categoryId || "").trim();
    if (!safeCategoryId) return;
    const categories = getPlannerCategories();
    const idx = categories.findIndex((c) => c.id === safeCategoryId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= categories.length) return;
    const next = [...categories];
    const temp = next[idx];
    next[idx] = next[nextIdx];
    next[nextIdx] = temp;
    state.wrestlingCategories = next;
    persistCategories();
    persistCategoryNames();
    renderRows();
    renderLibraryGroups();
    renderCategorySelectOptions();
  }

  function removePlannerCategory(categoryId) {
    const safeCategoryId = String(categoryId || "").trim();
    if (!safeCategoryId) return;
    const categories = getPlannerCategories();
    const target = categories.find((category) => category.id === safeCategoryId);
    if (!target) return;
    if (categories.length <= 1) {
      triggerToast(tr({
        en: "At least one section is required.",
        es: "Se requiere al menos una seccion."
      }));
      return;
    }
    const confirmed = window.confirm(tr({
      en: `Delete section "${getCategoryNameById(safeCategoryId)}" and its exercises?`,
      es: `Eliminar la seccion "${getCategoryNameById(safeCategoryId)}" y sus ejercicios?`
    }));
    if (!confirmed) return;
    state.wrestlingCategories = categories.filter((category) => category.id !== safeCategoryId);
    state.exerciseLibrary = (state.exerciseLibrary || []).filter((entry) => String(entry?.categoryId || "").trim() !== safeCategoryId);
    delete state.schedule[safeCategoryId];
    delete state.categoryTimes[safeCategoryId];
    delete state.categoryNames[safeCategoryId];
    delete state.categoryDrafts[safeCategoryId];
    reconcilePlannerDataForCategories({ keepLibraryUnknown: false });
    persistCategories();
    persistCategoryNames();
    persistDaily();
    persistLibrary();
    queuePlannerLibrarySync();
    renderCategorySelectOptions();
    renderRows();
    renderLibraryGroups();
    renderCoachLibraries();
    triggerToast(tr({ en: "Section removed.", es: "Seccion eliminada." }));
  }

  function updateLibraryDraft(categoryId, value) {
    state.categoryDrafts[normalizeCategoryId(categoryId)] = String(value || "");
  }

  function addDraftExerciseToLibrary(categoryId) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const draftName = String(state.categoryDrafts[safeCategoryId] || "").trim();
    if (!draftName) {
      triggerToast(tr({ en: "Write an exercise name first.", es: "Escribe primero el nombre del ejercicio." }));
      return;
    }
    if (isDuplicateLibraryEntry(draftName, safeCategoryId)) {
      triggerToast(tr({ en: "Exercise already exists in this category.", es: "Ese ejercicio ya existe en esta categoria." }));
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
    triggerToast(tr({ en: "Exercise added.", es: "Ejercicio agregado." }));
  }

  function getNextDefaultLibraryName(categoryId) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const baseName = tr({ en: "New exercise", es: "Nuevo ejercicio" });
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
    triggerToast(tr({ en: "Exercise added. Edit the name.", es: "Ejercicio agregado. Edita el nombre." }));
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
        triggerToast(tr({ en: "Exercise already exists in this category.", es: "Ese ejercicio ya existe en esta categoria." }));
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
    triggerToast(tr({ en: "Added to current plan.", es: "Agregado al plan actual." }));
  }

  function renderCategorySelectOptions() {
    if (!els.newExerciseCategorySelect) return;
    const categories = getPlannerCategories();
    els.newExerciseCategorySelect.innerHTML = categories
      .map((category) => `<option value="${category.id}">${escapeHtml(getCategoryNameById(category.id))}</option>`)
      .join("");
    const current = normalizeCategoryId(els.newExerciseCategorySelect.value || getFirstPlannerCategoryId());
    els.newExerciseCategorySelect.value = current;
  }

  function renderLibraryGroups() {
    if (!els.libraryGroups) return;
    const activeSnapshot = getActivePlannerLibraryEditSnapshot();
    applyPlannerLibraryEditSnapshotToState(activeSnapshot);
    const categories = getPlannerCategories();
    const addToPlanLabel = tr({ en: "Add to plan", es: "Agregar al plan" });
    const deleteLabel = tr({ en: "Delete", es: "Eliminar" });
    const deleteCategoryLabel = tr({ en: "Delete section", es: "Eliminar seccion" });
    const noExercisesLabel = tr({ en: "No exercises saved yet.", es: "Aun no hay ejercicios guardados." });
    const addExerciseTitle = tr({ en: "Add exercise", es: "Agregar ejercicio" });
    const addExercisePlaceholder = tr({ en: "Add new movement/exercise", es: "Agregar nuevo movimiento/ejercicio" });
    const addLabel = tr({ en: "Add +", es: "Agregar +" });
    const groupsHtml = categories.map((category) => {
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
                    <button type="button" class="ghost" data-action="add-library-item-to-plan" data-id="${item.id}" data-category="${category.id}" title="${escapeHtml(addToPlanLabel)}">+</button>
                    <button type="button" class="ghost" data-action="delete-library" data-id="${item.id}">${escapeHtml(deleteLabel)}</button>
                  </div>
                </li>
              `)
              .join("")}
          </ul>`
        : `<p class="small muted">${escapeHtml(noExercisesLabel)}</p>`;
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
              <button type="button" class="ghost planner-library-plus" data-action="quick-add-library-item" data-category="${category.id}" title="${escapeHtml(addExerciseTitle)}">+</button>
              <button type="button" class="ghost planner-library-trash" data-action="delete-category" data-category="${category.id}" title="${escapeHtml(deleteCategoryLabel)}">X</button>
              <span>${items.length}</span>
            </div>
          </header>
          <div class="planner-library-quick-add">
            <input
              type="text"
              placeholder="${escapeHtml(addExercisePlaceholder)}"
              value="${escapeHtml(draft)}"
              data-action="library-draft-input"
              data-category="${category.id}"
            >
            <button type="button" class="primary" data-action="save-library-draft" data-category="${category.id}">${escapeHtml(addLabel)}</button>
          </div>
          ${itemsHtml}
        </section>
      `;
    }).join("");
    els.libraryGroups.innerHTML = groupsHtml;
    if (restorePlannerLibraryEditSnapshot(activeSnapshot)) {
      state.pendingLibraryFocus = "";
      state.pendingCategoryFocus = "";
      return;
    }
    if (state.pendingLibraryFocus) {
      const target = els.libraryGroups.querySelector(`input[data-action="edit-library-item"][data-id="${state.pendingLibraryFocus}"]`);
      if (target && target instanceof HTMLInputElement) {
        focusPlannerTextTarget(target, getPlannerEditSelection(target), { select: true });
      }
      state.pendingLibraryFocus = "";
    }
    if (state.pendingCategoryFocus) {
      const categoryInput = els.libraryGroups.querySelector(`input[data-action="edit-category-name"][data-category="${state.pendingCategoryFocus}"]`);
      if (categoryInput && categoryInput instanceof HTMLInputElement) {
        focusPlannerTextTarget(categoryInput, getPlannerEditSelection(categoryInput), { select: true });
      }
      state.pendingCategoryFocus = "";
    }
  }

  function autoResizeAllTextareas() {
    root.querySelectorAll("textarea[data-action='item-input']").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }

  function escapePlannerSelectorValue(value) {
    const raw = String(value || "");
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(raw);
    }
    return raw.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

  function getPlannerEditSelection(target) {
    const value = String(target?.value || "");
    const fallback = value.length;
    const start = Number.isFinite(target?.selectionStart) ? target.selectionStart : fallback;
    const end = Number.isFinite(target?.selectionEnd) ? target.selectionEnd : start;
    return {
      value,
      selectionStart: Math.max(0, Math.min(start, value.length)),
      selectionEnd: Math.max(0, Math.min(end, value.length))
    };
  }

  function focusPlannerTextTarget(target, snapshot, { select = false } = {}) {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
    if (!target.isConnected) return false;
    if (snapshot && target.value !== snapshot.value) {
      target.value = snapshot.value;
    }
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
    const restoreSelection = () => {
      if (!target.isConnected) return;
      if (select) {
        try {
          target.select();
        } catch {
          // ignore selection errors
        }
      } else if (snapshot) {
        try {
          const length = String(target.value || "").length;
          const start = Math.max(0, Math.min(snapshot.selectionStart, length));
          const end = Math.max(0, Math.min(snapshot.selectionEnd, length));
          target.setSelectionRange(start, end);
        } catch {
          // ignore selection errors
        }
      }
      if (target instanceof HTMLTextAreaElement) {
        target.style.height = "auto";
        target.style.height = `${target.scrollHeight}px`;
      }
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(restoreSelection);
    } else {
      window.setTimeout(restoreSelection, 0);
    }
    return true;
  }

  function getActivePlannerRowsEditSnapshot() {
    const active = document.activeElement;
    if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return null;
    if (!els.rows || !els.rows.contains(active)) return null;
    const selection = getPlannerEditSelection(active);
    if (active.matches("textarea[data-action='item-input']")) {
      return {
        ...selection,
        action: "item-input",
        categoryId: normalizeCategoryId(active.dataset.category),
        itemId: String(active.dataset.itemId || "").trim()
      };
    }
    if (active.matches("input[data-action='edit-category-name']")) {
      return {
        ...selection,
        action: "edit-category-name",
        categoryId: normalizeCategoryId(active.dataset.category)
      };
    }
    return null;
  }

  function getActivePlannerLibraryEditSnapshot() {
    const active = document.activeElement;
    if (!(active instanceof HTMLInputElement)) return null;
    if (!els.libraryGroups || !els.libraryGroups.contains(active)) return null;
    const selection = getPlannerEditSelection(active);
    if (active.matches("input[data-action='edit-category-name']")) {
      return {
        ...selection,
        action: "edit-category-name",
        categoryId: normalizeCategoryId(active.dataset.category)
      };
    }
    if (active.matches("input[data-action='library-draft-input']")) {
      return {
        ...selection,
        action: "library-draft-input",
        categoryId: normalizeCategoryId(active.dataset.category)
      };
    }
    if (active.matches("input[data-action='edit-library-item']")) {
      return {
        ...selection,
        action: "edit-library-item",
        categoryId: normalizeCategoryId(active.dataset.category),
        itemId: String(active.dataset.id || "").trim()
      };
    }
    return null;
  }

  function setPlannerCategoryNameDraft(categoryId, nextValue) {
    const safeCategoryId = normalizeCategoryId(categoryId);
    const value = String(nextValue || "");
    let changed = String(state.categoryNames?.[safeCategoryId] || "") !== value;
    state.categoryNames[safeCategoryId] = value;
    state.wrestlingCategories = getPlannerCategories().map((category) => {
      if (category.id !== safeCategoryId) return { ...category };
      if (category.name !== value) changed = true;
      return { ...category, name: value };
    });
    return changed;
  }

  function applyPlannerRowsEditSnapshotToState(snapshot) {
    if (!snapshot) return;
    if (snapshot.action === "item-input") {
      const safeCategoryId = normalizeCategoryId(snapshot.categoryId);
      const safeItemId = String(snapshot.itemId || "").trim();
      if (!safeItemId) return;
      let changed = false;
      state.schedule[safeCategoryId] = (state.schedule[safeCategoryId] || []).map((item) => {
        if (item.id !== safeItemId) return item;
        if (item.name === snapshot.value) return item;
        changed = true;
        return { ...item, name: snapshot.value };
      });
      if (changed) persistDaily();
      return;
    }
    if (snapshot.action === "edit-category-name" && setPlannerCategoryNameDraft(snapshot.categoryId, snapshot.value)) {
      persistCategories();
      persistCategoryNames();
      queuePlannerLibrarySync();
    }
  }

  function applyPlannerLibraryEditSnapshotToState(snapshot) {
    if (!snapshot) return;
    if (snapshot.action === "edit-category-name" && setPlannerCategoryNameDraft(snapshot.categoryId, snapshot.value)) {
      persistCategories();
      persistCategoryNames();
      queuePlannerLibrarySync();
      return;
    }
    if (snapshot.action === "library-draft-input") {
      state.categoryDrafts[normalizeCategoryId(snapshot.categoryId)] = snapshot.value;
      return;
    }
    if (snapshot.action === "edit-library-item") {
      const safeItemId = String(snapshot.itemId || "").trim();
      if (!safeItemId) return;
      state.exerciseLibrary = state.exerciseLibrary.map((entry) => {
        if (entry.id !== safeItemId) return entry;
        return {
          ...entry,
          categoryId: normalizeCategoryId(snapshot.categoryId),
          name: snapshot.value
        };
      });
    }
  }

  function restorePlannerRowsEditSnapshot(snapshot) {
    if (!snapshot || !els.rows) return false;
    const categoryId = escapePlannerSelectorValue(snapshot.categoryId);
    let target = null;
    if (snapshot.action === "item-input") {
      const itemId = escapePlannerSelectorValue(snapshot.itemId);
      target = els.rows.querySelector(`textarea[data-action="item-input"][data-category="${categoryId}"][data-item-id="${itemId}"]`);
    } else if (snapshot.action === "edit-category-name") {
      target = els.rows.querySelector(`input[data-action="edit-category-name"][data-category="${categoryId}"]`);
    }
    return focusPlannerTextTarget(target, snapshot);
  }

  function restorePlannerLibraryEditSnapshot(snapshot) {
    if (!snapshot || !els.libraryGroups) return false;
    const categoryId = escapePlannerSelectorValue(snapshot.categoryId);
    let target = null;
    if (snapshot.action === "edit-category-name") {
      target = els.libraryGroups.querySelector(`input[data-action="edit-category-name"][data-category="${categoryId}"]`);
    } else if (snapshot.action === "library-draft-input") {
      target = els.libraryGroups.querySelector(`input[data-action="library-draft-input"][data-category="${categoryId}"]`);
    } else if (snapshot.action === "edit-library-item") {
      const itemId = escapePlannerSelectorValue(snapshot.itemId);
      target = els.libraryGroups.querySelector(`input[data-action="edit-library-item"][data-id="${itemId}"][data-category="${categoryId}"]`);
    }
    return focusPlannerTextTarget(target, snapshot);
  }

  function renderRows() {
    if (!els.rows) return;
    const activeSnapshot = getActivePlannerRowsEditSnapshot();
    applyPlannerRowsEditSnapshotToState(activeSnapshot);
    const categories = getPlannerCategories();
    const activityLabel = tr({ en: "Activity", es: "Actividad" });
    const timeLabel = tr({ en: "Time", es: "Tiempo" });
    const chooseDrillLabel = tr({ en: "Choose saved drill...", es: "Elige ejercicio guardado..." });
    const addTypeLabel = "+";
    const addTypeTitle = tr({ en: "Add typed drill", es: "Agregar ejercicio escrito" });
    const typeDrillPlaceholder = tr({ en: "Type drill here...", es: "Escribe el ejercicio aqui..." });
    const deleteLabel = tr({ en: "Delete", es: "Eliminar" });
    const deleteSectionLabel = tr({ en: "Delete section", es: "Eliminar seccion" });
    if (els.rows?.previousElementSibling?.tagName === "THEAD") {
      const ths = Array.from(els.rows.previousElementSibling.querySelectorAll("th"));
      if (ths[0]) ths[0].textContent = activityLabel;
      if (ths[1]) ths[1].textContent = timeLabel;
    } else {
      const table = els.rows.closest("table");
      const ths = Array.from(table?.querySelectorAll("thead th") || []);
      if (ths[0]) ths[0].textContent = activityLabel;
      if (ths[1]) ths[1].textContent = timeLabel;
    }
    const rowsHtml = categories.map((category) => {
      const items = state.schedule[category.id] || [];
      const options = state.exerciseLibrary
        .filter((entry) => entry.categoryId === category.id)
        .map((entry) => `<option value="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</option>`)
        .join("");
      const itemsHtml = items
        .map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;
          return `
            <li>
              <div class="planner-item-move-btns">
                <button type="button" class="ghost planner-move-btn" data-action="move-item-up" data-category="${category.id}" data-item-id="${item.id}" ${isFirst ? "disabled" : ""} title="Move up">▲</button>
                <button type="button" class="ghost planner-move-btn" data-action="move-item-down" data-category="${category.id}" data-item-id="${item.id}" ${isLast ? "disabled" : ""} title="Move down">▼</button>
              </div>
              <textarea
                class="wtp-notes"
                name="notes"
                data-action="item-input"
                data-category="${category.id}"
                data-item-id="${item.id}"
                rows="1"
                placeholder="${escapeHtml(typeDrillPlaceholder)}"
              >${escapeHtml(item.name)}</textarea>
              <div class="planner-item-print-text">${escapeHtml(item.name || "-")}</div>
              <button type="button" class="ghost planner-remove-item-btn" data-action="remove-item" data-category="${category.id}" data-item-id="${item.id}" aria-label="${escapeHtml(deleteLabel)}">-</button>
            </li>
          `;
        })
        .join("");

      const categoryIndex = categories.indexOf(category);
      const isCatFirst = categoryIndex === 0;
      const isCatLast = categoryIndex === categories.length - 1;

      return `
        <tr class="planner-row" data-plan-row>
          <td>
            <div class="planner-category-title">
              <div class="planner-section-move-btns">
                <button type="button" class="ghost planner-move-btn" data-action="move-category-up" data-category="${category.id}" ${isCatFirst ? "disabled" : ""} title="Move section up">▲</button>
                <button type="button" class="ghost planner-move-btn" data-action="move-category-down" data-category="${category.id}" ${isCatLast ? "disabled" : ""} title="Move section down">▼</button>
              </div>
              <input
                type="text"
                class="planner-library-category-input planner-row-category-input wtp-activity"
                name="activity"
                value="${escapeHtml(getCategoryNameById(category.id))}"
                data-action="edit-category-name"
                data-category="${category.id}"
              >
              <button type="button" class="ghost planner-row-category-delete" data-action="delete-category" data-category="${category.id}" title="${escapeHtml(deleteSectionLabel)}">X</button>
            </div>
            <div class="planner-row-controls">
              <select data-action="pick-library" data-category="${category.id}">
                <option value="">${escapeHtml(chooseDrillLabel)}</option>
                ${options}
              </select>
              <button type="button" class="ghost planner-add-manual-btn" data-action="add-manual" data-category="${category.id}" aria-label="${escapeHtml(addTypeTitle)}">${escapeHtml(addTypeLabel)}</button>
            </div>
            <ul class="planner-items-list">${itemsHtml}</ul>
          </td>
          <td class="planner-time-cell">
            <input
              type="number"
              class="wtp-time"
              name="time"
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

    if (restorePlannerRowsEditSnapshot(activeSnapshot)) {
      state.pendingFocus = null;
      state.pendingCategoryFocus = "";
      return;
    }

    if (state.pendingFocus) {
      const selector = `textarea[data-category='${state.pendingFocus.categoryId}'][data-item-id='${state.pendingFocus.itemId}']`;
      const target = root.querySelector(selector);
      if (target) {
        focusPlannerTextTarget(target, getPlannerEditSelection(target));
      }
      state.pendingFocus = null;
    }
    if (state.pendingCategoryFocus) {
      const selector = `input[data-action='edit-category-name'][data-category='${state.pendingCategoryFocus}']`;
      const categoryInput = root.querySelector(selector);
      if (categoryInput && categoryInput instanceof HTMLInputElement) {
        focusPlannerTextTarget(categoryInput, getPlannerEditSelection(categoryInput), { select: true });
      }
      state.pendingCategoryFocus = "";
    }
  }

  function applyPlannerLanguageToStaticDom() {
    if (els.openSettingsBtn) els.openSettingsBtn.textContent = tr({ en: "Customize", es: "Personalizar" });
    if (els.openLibraryBtn) els.openLibraryBtn.textContent = tr({ en: "Library", es: "Libreria" });
    if (els.loadTemplateBtn) els.loadTemplateBtn.textContent = tr({ en: "Open saved plans", es: "Abrir planes guardados" });
    if (els.saveTemplateTopBtn) els.saveTemplateTopBtn.textContent = tr({ en: "Save plan", es: "Guardar plan" });
    if (els.sendAthletesTopBtn) els.sendAthletesTopBtn.textContent = tr({ en: "Share plan", es: "Compartir plan" });
    if (els.addSectionBtn) els.addSectionBtn.textContent = tr({ en: "+ Add section", es: "+ Agregar seccion" });
    if (els.printBtn) els.printBtn.textContent = tr({ en: "Print", es: "Imprimir" });
    if (els.saveTemplateBtn) els.saveTemplateBtn.textContent = tr({ en: "Save plan", es: "Guardar plan" });
    if (els.sendAthletesBtn) els.sendAthletesBtn.textContent = tr({ en: "Share plan", es: "Compartir plan" });
    if (els.assignCloseBtn) els.assignCloseBtn.textContent = tr({ en: "Close", es: "Cerrar" });
    if (els.assignCancelBtn) els.assignCancelBtn.textContent = tr({ en: "Cancel", es: "Cancelar" });
    if (els.assignSelectAllBtn) els.assignSelectAllBtn.textContent = tr({ en: "Select all", es: "Seleccionar todo" });
    if (els.assignClearBtn) els.assignClearBtn.textContent = tr({ en: "Clear", es: "Limpiar" });
    if (els.assignSearchInput) els.assignSearchInput.placeholder = tr({ en: "Type athlete or coach name", es: "Escribe nombre de atleta o entrenador" });
    if (els.templatesCloseBtn) els.templatesCloseBtn.textContent = tr({ en: "Close", es: "Cerrar" });
    if (els.templatesCancelBtn) els.templatesCancelBtn.textContent = tr({ en: "Close", es: "Cerrar" });
    if (els.templatesRefreshBtn) els.templatesRefreshBtn.textContent = tr({ en: "Refresh", es: "Actualizar" });
    if (els.libraryCloseBtn) els.libraryCloseBtn.textContent = tr({ en: "Close", es: "Cerrar" });
    if (els.libraryCancelBtn) els.libraryCancelBtn.textContent = tr({ en: "Close", es: "Cerrar" });
    if (els.saveLibraryItemBtn) els.saveLibraryItemBtn.textContent = tr({ en: "Save", es: "Guardar" });
    if (els.addCategoryBtn) els.addCategoryBtn.textContent = tr({ en: "+ Add section", es: "+ Agregar seccion" });
    if (els.newExerciseNameInput) els.newExerciseNameInput.placeholder = tr({ en: "Exercise name", es: "Nombre del ejercicio" });
    if (els.settingsCloseBtn) els.settingsCloseBtn.textContent = tr({ en: "Close", es: "Cerrar" });
    if (els.settingsCancelBtn) els.settingsCancelBtn.textContent = tr({ en: "Cancel", es: "Cancelar" });
    if (els.settingsSaveBtn) els.settingsSaveBtn.textContent = tr({ en: "Save changes", es: "Guardar cambios" });
    if (els.settingsRemoveLogoBtn) els.settingsRemoveLogoBtn.textContent = tr({ en: "Remove logo", es: "Quitar logo" });
    if (els.liftingShareBtn) els.liftingShareBtn.textContent = tr({ en: "Share plan", es: "Compartir plan" });
    if (els.liftingPrintBtn) els.liftingPrintBtn.textContent = tr({ en: "Print", es: "Imprimir" });
    if (els.liftingSaveProtocolBtn) els.liftingSaveProtocolBtn.textContent = tr({ en: "Save Protocol", es: "Guardar Protocolo" });
    if (els.liftingAddCategoryBtn) els.liftingAddCategoryBtn.textContent = tr({ en: "+ Category", es: "+ Categoria" });
    if (els.liftingAddExerciseBtn) els.liftingAddExerciseBtn.textContent = tr({ en: "+ Exercise", es: "+ Ejercicio" });
    if (els.liftingNewCategoryInput) els.liftingNewCategoryInput.placeholder = tr({ en: "New category name", es: "Nombre de categoria nueva" });
    if (els.liftingNewExerciseInput) els.liftingNewExerciseInput.placeholder = tr({ en: "Exercise name", es: "Nombre del ejercicio" });
    if (els.liftingSearchInput) els.liftingSearchInput.placeholder = tr({ en: "Search movement", es: "Buscar movimiento" });
    if (els.liftingPlanNameInput) els.liftingPlanNameInput.placeholder = tr({ en: "Plan name", es: "Nombre del plan" });
    if (els.liftingPlanWeeksInput) els.liftingPlanWeeksInput.placeholder = tr({ en: "Number of weeks", es: "Numero de semanas" });
    if (els.liftingPlanPurposeInput) els.liftingPlanPurposeInput.placeholder = tr({ en: "Primary objective", es: "Objetivo principal" });
    if (els.liftingPlanBenefitsInput) els.liftingPlanBenefitsInput.placeholder = tr({ en: "Notes or expected benefits", es: "Notas o beneficios esperados" });
    if (els.liftingActiveDayNameInput) els.liftingActiveDayNameInput.placeholder = tr({ en: "Day Name", es: "Nombre del dia" });
    if (els.templatesStatus && String(els.templatesStatus.textContent || "").trim() === "Loading saved plans...") {
      els.templatesStatus.textContent = tr({ en: "Loading saved plans...", es: "Cargando planes guardados..." });
    }
    if (els.coachLibrariesStatus && String(els.coachLibrariesStatus.textContent || "").trim() === "Loading coach libraries...") {
      els.coachLibrariesStatus.textContent = tr({ en: "Loading coach libraries...", es: "Cargando librerias de entrenadores..." });
    }
    if (els.bottomStatus && !String(els.bottomStatus.textContent || "").trim()) {
      els.bottomStatus.textContent = getBottomStatusDefaultMessage();
    }

    const trackBtnLabels = {
      wrestling: tr({ en: "Wrestling Training", es: "Entrenamiento de Lucha" }),
      lifting: tr({ en: "Lifting & Conditioning", es: "Lifting y Conditioning" }),
      mental: tr({ en: "Mind & Focus Training", es: "Entrenamiento Mental y Enfoque" })
    };
    els.trackButtons.forEach((btn) => {
      const key = normalizeTrack(btn.dataset.plannerTrack);
      if (trackBtnLabels[key]) btn.textContent = trackBtnLabels[key];
    });

    const assignModeSelect = els.assignScheduleModeInput;
    if (assignModeSelect) {
      const dayOption = assignModeSelect.querySelector("option[value='day']");
      const weekOption = assignModeSelect.querySelector("option[value='week']");
      if (dayOption) dayOption.textContent = tr({ en: "Single day", es: "Un solo dia" });
      if (weekOption) weekOption.textContent = tr({ en: "Weekly (Sun-Sat)", es: "Semanal (Dom-Sab)" });
    }
    const weekCountSelect = els.assignWeekCountInput;
    if (weekCountSelect) {
      Array.from(weekCountSelect.options || []).forEach((option) => {
        const count = parseInt(String(option.value || "0"), 10) || 0;
        option.textContent = tr({
          en: `${count} ${count === 1 ? "week" : "weeks"}`,
          es: `${count} ${count === 1 ? "semana" : "semanas"}`
        });
      });
    }
  }

  function render() {
    syncCategoryNamesForLanguage();
    applyPlannerLanguageToStaticDom();
    clearBlockingPlannerOverlays();
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
    renderMentalApp();
    applyPlannerAccessMode();
  }

  function handleRootClick(event) {
    if (state.readOnly) return;
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const action = trigger.dataset.action;
    if (handleMentalAction(action, trigger)) {
      return;
    }
    if (action === "add-manual") {
      addToSchedule(trigger.dataset.category, "");
      return;
    }
    if (action === "add-category") {
      addPlannerCategory("");
      return;
    }
    if (action === "delete-category") {
      removePlannerCategory(trigger.dataset.category);
      return;
    }
    if (action === "remove-item") {
      removeFromSchedule(trigger.dataset.category, trigger.dataset.itemId);
      return;
    }
    if (action === "move-item-up") {
      moveScheduleItem(trigger.dataset.category, trigger.dataset.itemId, -1);
      return;
    }
    if (action === "move-item-down") {
      moveScheduleItem(trigger.dataset.category, trigger.dataset.itemId, 1);
      return;
    }
    if (action === "move-category-up") {
      movePlannerCategory(trigger.dataset.category, -1);
      return;
    }
    if (action === "move-category-down") {
      movePlannerCategory(trigger.dataset.category, 1);
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
      applyTemplateToPlanner(trigger.dataset.templateKey || trigger.dataset.templateId);
      return;
    }
    if (action === "apply-print-preset") {
      applyTempPrintPreset(trigger.dataset.border, trigger.dataset.text);
    }
  }

  function handleRootChange(event) {
    if (state.readOnly) return;
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
      return;
    }

    if (target === els.settingsPrintBorderInput && state.tempSettings) {
      applyTempManualPrintColor("border", target.value);
      return;
    }

    if (target === els.settingsPrintTextInput && state.tempSettings) {
      applyTempManualPrintColor("text", target.value);
    }
  }

  function handleRootInput(event) {
    if (state.readOnly) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("input[data-action='time-input']")) {
      const categoryId = target.dataset.category;
      if (!categoryId) return;
      state.categoryTimes[categoryId] = String(target.value || "0");
      persistDaily();
      updateTimeStatus();
      return;
    }

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
      setPlannerCategoryNameDraft(target.dataset.category, target.value);
      persistCategories();
      persistCategoryNames();
      queuePlannerLibrarySync();
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

    if (target === els.assignScheduleModeInput) {
      const nextMode = String(els.assignScheduleModeInput.value || "day").trim().toLowerCase();
      state.assignScheduleMode = nextMode === "week" ? "week" : "day";
      if (state.assignScheduleMode === "week") {
        state.assignDueDate = getWeekStartDateKey(state.assignDueDate || getTodayDateKey());
      }
      if (els.assignDueDateInput) {
        els.assignDueDateInput.value = state.assignDueDate;
      }
      applyAssignContextUi();
      return;
    }

    if (target === els.assignWeekCountInput) {
      state.assignWeekCount = normalizeAssignWeekCount(els.assignWeekCountInput.value || 1);
      applyAssignContextUi();
      return;
    }

    if (target === els.assignDueDateInput) {
      const rawDueDate = normalizeDateKeyValue(els.assignDueDateInput.value || "");
      state.assignDueDate = isWrestlingWeeklyMode() ? getWeekStartDateKey(rawDueDate) : rawDueDate;
      if (els.assignDueDateInput && els.assignDueDateInput.value !== state.assignDueDate) {
        els.assignDueDateInput.value = state.assignDueDate;
      }
      applyAssignContextUi();
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
      return;
    }
    if (target === els.settingsFooterInput && state.tempSettings) {
      state.tempSettings.footerMessage = target.value;
      return;
    }
    if (target === els.settingsPrintBorderInput && state.tempSettings) {
      applyTempManualPrintColor("border", target.value);
      return;
    }
    if (target === els.settingsPrintTextInput && state.tempSettings) {
      applyTempManualPrintColor("text", target.value);
    }
  }

  function handleRootBlur(event) {
    if (state.readOnly) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("textarea[data-action='item-input']")) {
      const categoryId = target.dataset.category;
      if (!categoryId) return;
      ensureItemInLibrary(categoryId, target.value);
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
    if (state.readOnly) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("[data-action='mental-go-tap']") && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      handleMentalGoNoGoTap();
      return;
    }
    if (!target.matches("input[data-action='library-draft-input']")) return;
    if (event.key !== "Enter") return;
    event.preventDefault();
    addDraftExerciseToLibrary(target.dataset.category);
  }

  function handleRootPointerDown(event) {
    if (state.readOnly) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tapZone = target.closest("[data-action='mental-go-tap']");
    if (!tapZone) return;
    event.preventDefault();
    handleMentalGoNoGoTap();
  }

  const deferredPlannerWork = new Map();

  function isPlannerEditingActive() {
    const active = document.activeElement;
    if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return false;
    return Boolean(root && root.contains(active));
  }

  function flushDeferredPlannerWork() {
    if (isPlannerEditingActive()) return;
    if (!deferredPlannerWork.size) return;
    const jobs = Array.from(deferredPlannerWork.values());
    deferredPlannerWork.clear();
    jobs.forEach((job) => {
      try {
        Promise.resolve(job()).catch((err) => console.warn("Deferred planner update failed", err));
      } catch (err) {
        console.warn("Deferred planner update failed", err);
      }
    });
  }

  function runWhenPlannerIdle(tag, job) {
    if (!isPlannerEditingActive()) {
      job();
      return;
    }
    deferredPlannerWork.set(tag, job);
  }

  function isPlannerTextEditTarget(target) {
    return target instanceof HTMLElement && Boolean(target.closest([
      "input[data-action='edit-category-name']",
      "textarea[data-action='item-input']",
      "input[data-action='library-draft-input']",
      "input[data-action='edit-library-item']"
    ].join(",")));
  }

  function protectPlannerTextFocus(event) {
    const input = isPlannerTextEditTarget(event.target) ? event.target.closest("input, textarea") : null;
    if (!input) return;
    if (event.type === "keydown" || event.type === "touchstart") return;
    window.setTimeout(() => {
      if (input.isConnected && document.activeElement !== input) {
        input.focus();
      }
    }, 0);
  }

  function focusPlannerFieldFromContainer(event) {
    if (state.readOnly) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("button, select, input, textarea")) return;
    const categoryTitle = target.closest(".planner-category-title");
    const categoryInput = categoryTitle?.querySelector("input[data-action='edit-category-name']");
    if (categoryInput instanceof HTMLInputElement) {
      categoryInput.focus();
      return;
    }
    const itemRow = target.closest(".planner-items-list li");
    const itemTextarea = itemRow?.querySelector("textarea[data-action='item-input']");
    if (itemTextarea instanceof HTMLTextAreaElement) {
      itemTextarea.focus();
    }
  }

  function bindStaticEvents() {
    ["pointerdown", "mousedown", "touchstart", "click", "keydown"].forEach((eventName) => {
      document.addEventListener(eventName, protectPlannerTextFocus, true);
    });
    root.addEventListener("click", focusPlannerFieldFromContainer, true);
    root.addEventListener("click", handleRootClick);
    root.addEventListener("pointerdown", handleRootPointerDown);
    root.addEventListener("change", handleRootChange);
    root.addEventListener("input", handleRootInput);
    root.addEventListener("blur", handleRootBlur, true);
    root.addEventListener("focusout", () => {
      window.setTimeout(flushDeferredPlannerWork, 120);
    });
    root.addEventListener("keydown", handleRootKeydown);

    const handleTrackActivation = (btn, event) => {
      if (!btn) return;
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (btn.dataset.trackActivationLock === "1") return;
      btn.dataset.trackActivationLock = "1";
      window.setTimeout(() => {
        delete btn.dataset.trackActivationLock;
      }, 250);
      setPlannerActiveTrack(btn.dataset.plannerTrack, { focus: false });
    };

    if (els.trackSwitch) {
      const resolveTrackButton = (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return null;
        return target.closest("[data-planner-track]");
      };
      els.trackSwitch.addEventListener("pointerdown", (event) => {
        const btn = resolveTrackButton(event);
        if (!btn) return;
        handleTrackActivation(btn, event);
      }, true);
      els.trackSwitch.addEventListener("touchend", (event) => {
        const btn = resolveTrackButton(event);
        if (!btn) return;
        handleTrackActivation(btn, event);
      }, { capture: true, passive: false });
      els.trackSwitch.addEventListener("click", (event) => {
        const btn = resolveTrackButton(event);
        if (!btn) return;
        handleTrackActivation(btn, event);
      }, true);
    }

    els.trackButtons.forEach((btn) => {
      const activate = (event) => {
        handleTrackActivation(btn, event);
      };

      btn.addEventListener("pointerup", activate);
      btn.addEventListener("touchend", activate, { passive: false });
      btn.addEventListener("click", activate);
      btn.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        activate(event);
      });
    });

    els.liftingTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        setLiftingTab(btn.dataset.liftingTab);
      });
    });

    els.liftingPrintBtn?.addEventListener("click", () => {
      if (!openBasicPrintWindow("lifting")) {
        window.print();
      }
    });
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

    els.printBtn?.addEventListener("click", () => {
      if (!openBasicPrintWindow("wrestling")) {
        window.print();
      }
    });

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
      state.tempSettings.logoUrl = sanitizePlannerLogoUrl("", DEFAULT_PLANNER_LOGO_URL);
      renderSettingsLogoPreview();
    });
    els.settingsLogoInput?.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file || !state.tempSettings) return;
      void readOptimizedLogoDataUrl(file).then((nextLogo) => {
        if (!nextLogo) {
          triggerToast(tr({
            en: "Logo is too large. Use a smaller image.",
            es: "El logo es muy grande. Usa una imagen mas pequena."
          }));
          return;
        }
        state.tempSettings.logoUrl = sanitizePlannerLogoUrl(nextLogo, state.settings?.logoUrl || DEFAULT_PLANNER_LOGO_URL);
        renderSettingsLogoPreview();
      }).catch(() => {
        triggerToast(tr({
          en: "Could not load logo file. Try another image.",
          es: "No se pudo cargar el logo. Intenta con otra imagen."
        }));
      });
    });

    els.openLibraryBtn?.addEventListener("click", openLibraryModal);
    els.addSectionBtn?.addEventListener("click", () => addPlannerCategory(""));
    els.loadTemplateBtn?.addEventListener("click", openTemplatesModal);
    els.libraryCloseBtn?.addEventListener("click", closeLibraryModal);
    els.libraryCancelBtn?.addEventListener("click", closeLibraryModal);
    els.templatesCloseBtn?.addEventListener("click", closeTemplatesModal);
    els.templatesCancelBtn?.addEventListener("click", closeTemplatesModal);
    els.templatesRefreshBtn?.addEventListener("click", () => {
      loadPlannerTemplates().catch(() => {});
    });
    els.saveLibraryItemBtn?.addEventListener("click", saveExerciseToLibrary);
    els.addCategoryBtn?.addEventListener("click", () => addPlannerCategory(""));
    els.newExerciseNameInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      saveExerciseToLibrary();
    });
    els.saveTemplateBtn?.addEventListener("click", () => {
      savePlannerAsTemplate().catch(() => {});
    });
    els.sendAthletesBtn?.addEventListener("click", () => {
      openAssignModal({ track: "wrestling" });
    });
    els.saveTemplateTopBtn?.addEventListener("click", () => {
      savePlannerAsTemplate().catch(() => {});
    });
    els.sendAthletesTopBtn?.addEventListener("click", () => {
      openAssignModal({ track: "wrestling" });
    });
    els.liftingShareBtn?.addEventListener("click", () => {
      openAssignModal({ track: "lifting" });
    });
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

    if (typeof window !== "undefined") {
      window.addEventListener("beforeprint", () => {
        updatePrintMetaValues();
        renderRows();
      });
      window.addEventListener("afterprint", () => {
        clearInlinePrintMode();
      });
      window.addEventListener("wpl:view-changed", () => {
        applyPlannerAccessMode();
      });
      const plansPanel = document.getElementById("panel-plans");
      if (plansPanel) {
        try {
          const observer = new MutationObserver(() => {
            applyPlannerAccessMode();
          });
          observer.observe(plansPanel, { attributes: true, attributeFilter: ["class"] });
        } catch (err) {
          console.warn("Planner MutationObserver failed", err);
        }
      }
      window.addEventListener("wpl:language-changed", () => {
        if (state.mentalView === "game") {
          stopMentalNarration();
        }
        if (!state.mentalLeaderboardReady) {
          state.mentalLeaderboardStatus = tr({ en: "Loading global leaderboard...", es: "Cargando leaderboard global..." });
        }
        render();
        applyAssignContextUi();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "hidden") return;
        syncPlannerDailyNow().catch(() => {});
        syncPlannerSettingsNow().catch(() => {});
        syncPlannerLibraryNow().catch(() => {});
        syncSharedPlannerCatalogNow().catch(() => {});
        syncPlannerClientStateNow().catch(() => {});
      });
    }
  }

  bindStaticEvents();
  ensurePlannerAuthWatcher();
  persistCategories();
  persistCategoryNames();
  persistLibrary();
  state.liftingPlan = normalizeLiftingPlan(state.liftingPlan || buildDefaultLiftingPlan());
  state.liftingLibrary = normalizeLiftingLibraryMap(state.liftingLibrary || DEFAULT_LIFTING_LIBRARY);
  persistLiftingPlanLocal();
  persistLiftingLibraryLocal();
  persistLiftingUiLocal();
  startSharedPlannerCatalogSync();
  setupLiftingRealtimeSync();
  startPlannerAssignDirectorySync();
  startMentalLeaderboardSync();
  fillTrackDraftInputs("lifting");
  fillTrackDraftInputs("mental");
  render();
  persistSettings();
  refreshStoredPrintPaletteFromLogo({ sync: false }).catch(() => {});
  persistMentalScores();
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      stopMentalLeaderboardSync();
      clearLiftingRealtimeRetry();
      if (state.liftingAuthUnsub) {
        try { state.liftingAuthUnsub(); } catch {}
        state.liftingAuthUnsub = null;
      }
      if (state.plannerAuthUnsub) {
        try { state.plannerAuthUnsub(); } catch {}
        state.plannerAuthUnsub = null;
      }
      stopPlannerAssignDirectorySync();
      stopSharedPlannerCatalogSync();
      if (state.dailySyncTimer) {
        clearTimeout(state.dailySyncTimer);
        state.dailySyncTimer = null;
      }
    });
  }
  syncPlannerCloudStateAfterAuth();
})();
