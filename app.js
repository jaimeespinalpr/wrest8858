// ==============================
// Wrestling Performance Lab
// Role-based views + training experience
// ==============================

// ---------- PROFILE / ONBOARDING ----------
const PROFILE_KEY = "wpl_profile";

const onboarding = document.getElementById("onboarding");
const appRoot = document.getElementById("appRoot");
const profileForm = document.getElementById("profileForm");
const skipBtn = document.getElementById("skipBtn");
const doneProfileBtn = document.getElementById("doneProfileBtn");
const userMeta = document.getElementById("userMeta");
const roleMeta = document.getElementById("roleMeta");
const editProfileBtn = document.getElementById("editProfileBtn");
const headerLang = document.getElementById("headerLang");
const headerFlag = document.getElementById("headerFlag");

// form fields
const pName = document.getElementById("pName");
const pRole = document.getElementById("pRole");
const pTeam = document.getElementById("pTeam");
const pLevel = document.getElementById("pLevel");
const pWeight = document.getElementById("pWeight");
const pCurrentWeight = document.getElementById("pCurrentWeight");
const pGoal = document.getElementById("pGoal");
const pLang = document.getElementById("pLang");
const pPhoto = document.getElementById("pPhoto");
const pCountry = document.getElementById("pCountry");
const pCity = document.getElementById("pCity");
const pSchoolClub = document.getElementById("pSchoolClub");
const pSchool = document.getElementById("pSchool");
const pClub = document.getElementById("pClub");
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

function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); }
  catch { return null; }
}

function setProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

async function applyProfile(profile) {
  if (!profile) {
    userMeta.textContent = "Athlete View";
    roleMeta.textContent = "Training Focus: Mat Technique";
    setRoleUI("athlete");
    setHeaderLang("en");
    return;
  }

  const name = profile.name || "User";
  const role = profile.role || "athlete";
  const team = profile.team ? ` - ${profile.team}` : "";
  const level = profile.level ? ` - ${profile.level}` : "";
  const roleTitle = role === "coach" ? "Coach" : "Athlete";
  userMeta.textContent = `${name} - ${roleTitle}${level}${team}`;
  setRoleUI(role);
  if (role === "athlete") {
    fillAthleteProfileForm(profile);
    renderCompetitionPreview(profile);
  }
  if (role === "coach") {
    await loadSavedPdfTemplate();
  }
  setHeaderLang(profile.lang || "en");
}

function setHeaderLang(lang) {
  if (!headerLang || !headerFlag) return;
  headerLang.value = lang;
  headerFlag.textContent = lang === "es" ? "🇪🇸" : "🇺🇸";
}

function showOnboarding(prefillProfile = null) {
  onboarding.classList.remove("hidden");
  appRoot.classList.add("blurred");

  // prefill if editing
  if (prefillProfile) {
    pName.value = prefillProfile.name || "";
    pRole.value = prefillProfile.role || "athlete";
    pTeam.value = prefillProfile.team || "";
    pLevel.value = prefillProfile.level || "intermediate";
    pWeight.value = prefillProfile.weightClass || "";
    pCurrentWeight.value = prefillProfile.currentWeight || "";
    pGoal.value = prefillProfile.goal || "";
    pLang.value = prefillProfile.lang || "en";
    pPhoto.value = prefillProfile.photo || "";
    pCountry.value = prefillProfile.country || "";
    pCity.value = prefillProfile.city || "";
    pSchoolClub.value = prefillProfile.schoolClub || "no";
    pSchool.value = prefillProfile.schoolName || "";
    pClub.value = prefillProfile.clubName || "";
    pStyle.value = prefillProfile.style || "freestyle";
    pPosition.value = prefillProfile.position || "neutral";
    pStrategy.value = prefillProfile.strategy || "balanced";
    pYears.value = prefillProfile.years || "";
    pNeutralOther.value = prefillProfile.techniques?.neutralOther || "";
    pTopOther.value = prefillProfile.techniques?.topOther || "";
    pBottomOther.value = prefillProfile.techniques?.bottomOther || "";
    pDefenseOther.value = prefillProfile.techniques?.defenseOther || "";
    pInternational.value = prefillProfile.international || "no";
    pInternationalEvents.value = prefillProfile.internationalEvents || "";
    pInternationalYears.value = prefillProfile.internationalYears || "";
    pCoachCues.value = prefillProfile.coachCues || "specific";
    pCueNotes.value = prefillProfile.cueNotes || "";
    pInjuryNotes.value = prefillProfile.injuryNotes || "";

    fillTechniques(".tech-neutral", prefillProfile.techniques?.neutral || []);
    fillTechniques(".tech-top", prefillProfile.techniques?.top || []);
    fillTechniques(".tech-bottom", prefillProfile.techniques?.bottom || []);
    fillTechniques(".tech-defense", prefillProfile.techniques?.defense || []);
  } else {
    // defaults
    pRole.value = "athlete";
    pLevel.value = "intermediate";
    pLang.value = "en";
    pStyle.value = "freestyle";
    pPosition.value = "neutral";
    pStrategy.value = "balanced";
    pSchoolClub.value = "no";
    pInternational.value = "no";
    pCoachCues.value = "specific";
    pCurrentWeight.value = "";
    fillTechniques(".tech-neutral", []);
    fillTechniques(".tech-top", []);
    fillTechniques(".tech-bottom", []);
    fillTechniques(".tech-defense", []);
  }
}

function hideOnboarding() {
  onboarding.classList.add("hidden");
  appRoot.classList.remove("blurred");
}

async function bootProfile() {
  const existing = getProfile();
  if (!existing) {
    showOnboarding(null);
  } else {
    hideOnboarding();
    await applyProfile(existing);
  }
}

// Create profile
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const neutral = Array.from(document.querySelectorAll(".tech-neutral:checked")).map((el) => el.value);
  const top = Array.from(document.querySelectorAll(".tech-top:checked")).map((el) => el.value);
  const bottom = Array.from(document.querySelectorAll(".tech-bottom:checked")).map((el) => el.value);
  const defense = Array.from(document.querySelectorAll(".tech-defense:checked")).map((el) => el.value);

  const profile = {
    name: pName.value.trim(),
    role: pRole.value,
    team: pTeam.value.trim(),
    level: pLevel.value,
    weightClass: pWeight.value.trim(),
    currentWeight: pCurrentWeight.value.trim(),
    goal: pGoal.value.trim(),
    lang: pLang.value,
    photo: pPhoto.value.trim(),
    country: pCountry.value.trim(),
    city: pCity.value.trim(),
    schoolClub: pSchoolClub.value,
    schoolName: pSchool.value.trim(),
    clubName: pClub.value.trim(),
    style: pStyle.value,
    position: pPosition.value,
    strategy: pStrategy.value,
    years: pYears.value,
    techniques: {
      neutral,
      top,
      bottom,
      defense,
      neutralOther: pNeutralOther.value.trim(),
      topOther: pTopOther.value.trim(),
      bottomOther: pBottomOther.value.trim(),
      defenseOther: pDefenseOther.value.trim()
    },
    international: pInternational.value,
    internationalEvents: pInternationalEvents.value.trim(),
    internationalYears: pInternationalYears.value.trim(),
    coachCues: pCoachCues.value,
    cueNotes: pCueNotes.value.trim(),
    injuryNotes: pInjuryNotes.value.trim()
  };

  // minimal sanity
  if (!profile.name || !profile.goal) return;

  setProfile(profile);
  await applyProfile(profile);
  hideOnboarding();
});

// Skip profile (use default)
skipBtn.addEventListener("click", async () => {
  const profile = {
    name: "Guest",
    role: "athlete",
    team: "",
    level: "intermediate",
    weightClass: "",
    goal: "Get better every day",
    lang: "en",
    currentWeight: "",
    style: "freestyle",
    position: "neutral",
    strategy: "balanced",
    techniques: {
      neutral: ["Single Leg", "Double Leg"],
      top: ["Half Nelson"],
      bottom: ["Stand-Up"],
      defense: ["Sprawl"]
    },
    international: "no",
    coachCues: "specific"
  };
  setProfile(profile);
  await applyProfile(profile);
  hideOnboarding();
});

if (doneProfileBtn) {
  doneProfileBtn.addEventListener("click", () => {
    if (!pName.value.trim()) pName.value = "Athlete";
    if (!pGoal.value.trim()) pGoal.value = "Get better every day";
    if (profileForm.requestSubmit) {
      profileForm.requestSubmit();
    } else {
      profileForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });
}

// Edit profile later
editProfileBtn.addEventListener("click", () => {
  const existing = getProfile();
  showOnboarding(existing);
});

// ---------- AUDIO ----------
let muted = false;
let voices = [];

const muteBtn = document.getElementById("muteBtn");

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

muteBtn.addEventListener("click", () => {
  muted = !muted;
  speechSynthesis.cancel();
  muteBtn.textContent = muted ? "🔇" : "🔊";
});

if (headerLang) {
  headerLang.addEventListener("change", () => {
    const profile = getProfile() || { role: "athlete" };
    profile.lang = headerLang.value;
    setProfile(profile);
    setHeaderLang(profile.lang);
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

const CALENDAR_EVENTS = {
  1: ["Team practice - 3:30 PM", "Lift session - 6:00 PM"],
  3: ["Team meeting - 4:15 PM"],
  5: ["Travel day - Bus at 2:00 PM"],
  6: ["Weigh-ins - 7:00 AM", "Tournament - 9:00 AM"]
};

const MEDIA_ITEMS = [
  { title: "Single Leg Finish", type: "Video", tag: "Single Leg", assigned: "Today" },
  { title: "Half Nelson Series", type: "Video", tag: "Top Control", assigned: "This week" },
  { title: "Bottom Escape Drill", type: "Clip", tag: "Bottom", assigned: "Today" },
  { title: "Hand Fight Notes", type: "Link", tag: "Neutral", assigned: "Optional" }
];

const ANNOUNCEMENTS = [
  { title: "Team meeting at 3:30 PM", detail: "Bring your notebook.", time: "Today" },
  { title: "Schedule change", detail: "Practice moved to 5:00 PM.", time: "Tomorrow" },
  { title: "Urgent update", detail: "Bus leaves at 1:30 PM sharp.", time: "Friday" },
  { title: "Tournament gear check", detail: "Singlet, shoes, ID.", time: "Friday" },
  { title: "Motivation", detail: "Win the first contact today.", time: "Tonight" }
];

const TEAM_STATS = [
  { title: "Check-ins Today", value: "5/7", note: "2 athletes missing" },
  { title: "Average Energy", value: "3.6", note: "Steady from last week" },
  { title: "Compliance Rate", value: "84%", note: "Goal: 90%" },
  { title: "Upcoming Events", value: "4", note: "2 in next 7 days" }
];

const TEAM_OVERVIEW = [
  "Athletes: 7 active",
  "Training plans: 3 running",
  "Upcoming tournaments: 2",
  "Alerts flagged: 3"
];

const QUICK_ACTIONS = [
  "Create training plan",
  "Add calendar event",
  "Upload media",
  "View athlete profiles"
];

const ALERTS = [
  "2 athletes reported high soreness (4+).",
  "Low sleep detected for 3 athletes.",
  "Weight check needed for 125 lb class."
];

const COACH_ACCOUNT = [
  "Email: coach@wrestlingapp.com",
  "Password: ********",
  "Role: Coach (fixed)",
  "Secure access: Role-based permissions"
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

const COACH_DISCIPLINE = ["Freestyle", "Greco-Roman", "Folkstyle", "Mixed"];
const COACH_STYLE = ["Technical", "Conditioning", "Strategy", "Balanced"];

const COACH_INTERNATIONAL = [
  "International coaching: Yes",
  "Countries: Japan, Turkey, Canada",
  "Events: U23 Worlds, Pan-Am",
  "Experience: 6 years"
];

const ATHLETE_FILTERS = ["Weight class", "Wrestling style", "Availability", "Search by name"];

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

const JOURNAL_FLAGS = [
  "2 athletes with soreness 4+",
  "Low sleep alert for 3 athletes",
  "Weight cut week flag for 125 lb class",
  "Overtraining risk: 1 athlete",
  "Readiness dip ahead of tournament"
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

const SKILLS = [
  { name: "Single Leg", rating: "Strong", updated: "2 days ago", clip: "Finish to shelf", notes: "Keep head tight to hip." },
  { name: "Half Nelson", rating: "Developing", updated: "1 week ago", clip: "Top control series", notes: "Improve hand placement." },
  { name: "Stand-Up", rating: "Strong", updated: "3 days ago", clip: "Explosive stand-up", notes: "Explode on whistle." },
  { name: "Sprawl", rating: "Needs work", updated: "5 days ago", clip: "Defense drill", notes: "Drop hips faster." },
  { name: "Hand Fight", rating: "Developing", updated: "Yesterday", clip: "Inside control", notes: "Win wrist control first." },
  { name: "Double Leg", rating: "Developing", updated: "4 days ago", clip: "Finish to corner", notes: "Cut the corner earlier." }
];

const PERMISSIONS = {
  can: [
    "Create and edit training plans",
    "View athlete profiles and journals",
    "Assign media and evaluate skills",
    "Send announcements and updates",
    "Edit competition one-pager coaching notes"
  ],
  cannot: [
    "Edit athlete self-reported journal entries",
    "Edit athlete account credentials",
    "Access other teams without permission",
    "Edit athlete core profile data"
  ]
};

const FUTURE_ADDONS = [
  "Web-only advanced dashboard",
  "Video annotation tools",
  "Match scouting reports",
  "Team comparison metrics",
  "Multi-coach collaboration"
];

const COACH_DESIGN = [
  "Desktop-first efficiency",
  "Fast navigation",
  "Data-rich but clean UI",
  "Minimal friction for daily work"
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

// ---------- TABS ----------
const tabBtns = Array.from(document.querySelectorAll(".tab"));
const panels = {
  today: document.getElementById("panel-today"),
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
  "one-pager": document.getElementById("panel-one-pager"),
  plans: document.getElementById("panel-plans"),
  "calendar-manager": document.getElementById("panel-calendar-manager"),
  "media-library": document.getElementById("panel-media-library"),
  "athlete-notes": document.getElementById("panel-athlete-notes"),
  skills: document.getElementById("panel-skills"),
  "journal-monitor": document.getElementById("panel-journal-monitor"),
  reports: document.getElementById("panel-reports"),
  messages: document.getElementById("panel-messages"),
  permissions: document.getElementById("panel-permissions"),
  future: document.getElementById("panel-future"),
  "competition-preview": document.getElementById("panel-competition-preview")
};

async function showTab(name) {
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  Object.entries(panels).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", k !== name);
  });

  if (name === "plans" && templatePdfBytes && window.PDFLib) {
    await generateFilledPdf({ download: false });
  }
}

function setRoleUI(role) {
  const roleName = role === "coach" ? "coach" : "athlete";
  tabBtns.forEach((btn) => {
    const allowedRoles = (btn.dataset.role || "").split(" ");
    const allowed = allowedRoles.includes(roleName);
    btn.hidden = !allowed;
    if (!allowed) btn.classList.remove("active");
  });

  roleMeta.textContent = roleName === "coach"
    ? "Coach Dashboard - Team overview"
    : roleMeta.textContent;

  const defaultTab = roleName === "coach" ? "dashboard" : "today";
  showTab(defaultTab);
}

tabBtns.forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tab)));

// ---------- PLAN SUBTABS ----------
const subtabButtons = Array.from(document.querySelectorAll(".subtab"));
const subpanels = Array.from(document.querySelectorAll(".subpanel"));

function showSubtab(name) {
  subtabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.subtab === name));
  subpanels.forEach((panel) => panel.classList.toggle("hidden", panel.id !== name));
}

subtabButtons.forEach((btn) => {
  btn.addEventListener("click", () => showSubtab(btn.dataset.subtab));
});

if (subtabButtons.length) {
  showSubtab(subtabButtons[0].dataset.subtab);
}

// initial boot after tabs are ready
bootProfile();

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
let templatePdfBytes = null;
let lastFilledPdfUrl = null;
let pendingTemplatePrint = false;

const dailyCalendarContainer = document.getElementById('daily-calendar-container');
const monthlyMonthSelect = document.getElementById('monthly-month-select');
const monthlyYearSelect = document.getElementById('monthly-year-select');
const seasonYearSelect = document.getElementById('season-year-select');

function populateYearSelects() {
    if (!monthlyYearSelect || !seasonYearSelect) return;
    const currentYear = new Date().getFullYear();
    const years = Array.from({
        length: 10
    }, (_, i) => currentYear - 5 + i);

    monthlyYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    monthlyYearSelect.value = currentYear;

    seasonYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    seasonYearSelect.value = currentYear;
}

function populateMonthSelect() {
    if (!monthlyMonthSelect) return;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthlyMonthSelect.innerHTML = months.map((m, i) => `<option value="${i}">${m}</option>`).join('');
    monthlyMonthSelect.value = new Date().getMonth();
}

function renderCalendar(year, month) {
    if (!dailyCalendarContainer) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    let html = `
    <div class="calendar-header">
      <button id="prev-month">&lt;</button>
      <span>${monthNames[month]} ${year}</span>
      <button id="next-month">&gt;</button>
    </div>
    <div class="calendar-grid-days">
  `;
    daysOfWeek.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });

    for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div></div>`;
    }

    for (let i = 1; i <= numDays; i++) {
        const isToday = (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) ? 'today' : '';
        html += `<div class="calendar-day ${isToday}" data-day="${i}">${i}</div>`;
    }

    html += '</div>';
    dailyCalendarContainer.innerHTML = html;

    document.getElementById('prev-month').addEventListener('click', () => {
        const newDate = new Date(year, month - 1, 1);
        renderCalendar(newDate.getFullYear(), newDate.getMonth());
    });
    document.getElementById('next-month').addEventListener('click', () => {
        const newDate = new Date(year, month + 1, 1);
        renderCalendar(newDate.getFullYear(), newDate.getMonth());
    });
    dailyCalendarContainer.querySelectorAll('.calendar-day').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            dailyCalendarContainer.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
        });
    });
}

function initializePlanSelectors() {
    if (!document.getElementById('panel-plans')) return;
    populateMonthSelect();
    populateYearSelects();
    const today = new Date();
    renderCalendar(today.getFullYear(), today.getMonth());
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
  if (!profile || profile.role !== "coach") return "coach";
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

loadCustomOptions();

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
      if (templateStatus) templateStatus.textContent = "Saved PDF template loaded.";
      updateTemplatePrintButton();
    } catch (e) {
      console.error("Failed to load saved PDF template:", e);
      if (templateStatus) templateStatus.textContent = "Could not load saved template.";
    }
  }
}

function handleTemplateFile(file) {
  if (!file) {
    if (templateStatus) templateStatus.textContent = "Select a PDF file first.";
    return;
  }
  if (file.type !== "application/pdf") {
    if (templateStatus) templateStatus.textContent = "Only PDF files are allowed.";
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    savePdfTemplate(dataUrl); // Save to localStorage
    templatePdfBytes = await dataURLToArrayBuffer(dataUrl);

    if (templateStatus) templateStatus.textContent = "PDF template loaded and saved.";
    if (pendingTemplatePrint) {
      pendingTemplatePrint = false;
      await generateFilledPdf({ download: false });
      await printFilledPdf();
    } else {
      await generateFilledPdf({ download: false });
    }
  };
  reader.onerror = () => {
    if (templateStatus) templateStatus.textContent = "Could not read file.";
  };
  reader.readAsDataURL(file);
}

async function generateFilledPdf({ download } = {}) {
  if (!templatePdfBytes) {
    if (templateStatus) templateStatus.textContent = "Upload a PDF template first.";
    return null;
  }
  if (!window.PDFLib) {
    if (templateStatus) templateStatus.textContent = "PDF library not available.";
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
  const titleMap = {
    intro: "Introduction",
    warmup: "Warm-up",
    drills: "Drills + Technique Intro",
    live: "Live / Hard Pace + Conditioning",
    cooldown: "Visualization + Cool Down",
    announcements: "Announcements"
  };
  const lines = ["Daily Training Plan"];
  Object.keys(titleMap).forEach((key) => {
    const items = data[key] || [];
    lines.push(`\n${titleMap[key]}:`);
    if (!items.length) {
      lines.push("- (none selected)");
    } else {
      items.forEach((item) => lines.push(`- ${item}`));
    }
  });
  return lines.join("\n");
}

if (saveDailyPlan) {
  saveDailyPlan.addEventListener("click", () => {
    const data = collectDailySelections();
    localStorage.setItem("wpl_daily_plan", JSON.stringify(data));
    toast("Daily plan saved.");
  });
}

if (doneDailyPlan) {
  doneDailyPlan.addEventListener("click", async () => {
    const data = collectDailySelections();
    localStorage.setItem("wpl_daily_plan", JSON.stringify(data));
    if (templatePdfBytes && window.PDFLib) {
      await generateFilledPdf({ download: false });
      toast("Daily plan saved. Template ready.");
    } else {
      toast("Daily plan saved.");
    }
    const role = (getProfile() || {}).role || "athlete";
    showTab(role === "coach" ? "dashboard" : "today");
  });
}

if (shareDailyPlan) {
  shareDailyPlan.addEventListener("click", async () => {
    const data = collectDailySelections();
    const text = formatDailyPlanText(data);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Daily Training Plan", text });
        toast("Shared.");
        return;
      } catch {
        // fall through
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard.");
    } else {
      toast("Copy not supported on this device.");
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

if (templatesBtn && templateConfirm) {
  templatesBtn.addEventListener("click", () => {
    templateConfirm.classList.toggle("hidden");
  });
}

if (templateGoBtn) {
  templateGoBtn.addEventListener("click", () => {
    setTemplateControlsEnabled(true);
    if (templateConfirm) templateConfirm.classList.add("hidden");
    if (templateFile) templateFile.click();
  });
}

if (templateNoBtn) {
  templateNoBtn.addEventListener("click", () => {
    setTemplateControlsEnabled(false);
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
      if (templateStatus) templateStatus.textContent = "Only PDF files are allowed.";
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    if (templateFile) templateFile.files = dt.files;
    if (templateStatus) templateStatus.textContent = `Selected: ${file.name}`;
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
    toast("No filled PDF to print.");
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
      toast("Could not open print dialog. Please try printing from the preview.");
    }
  };

  document.body.appendChild(iframe);
}

if (printTemplatePlan) {
  printTemplatePlan.addEventListener("click", async () => {
    if (!templatePdfBytes) {
      if (templateStatus) templateStatus.textContent = "Upload a PDF template first.";
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
const athleteProfileForm = document.getElementById("athleteProfileForm");
const previewProfileBtn = document.getElementById("previewProfileBtn");
const backToProfileBtn = document.getElementById("backToProfileBtn");
const competitionPreview = document.getElementById("competitionPreview");

const aName = document.getElementById("aName");
const aPhoto = document.getElementById("aPhoto");
const aCountry = document.getElementById("aCountry");
const aCity = document.getElementById("aCity");
const aSchoolClub = document.getElementById("aSchoolClub");
const aSchool = document.getElementById("aSchool");
const aClub = document.getElementById("aClub");
const aStyle = document.getElementById("aStyle");
const aWeight = document.getElementById("aWeight");
const aWeightClass = document.getElementById("aWeightClass");
const aYears = document.getElementById("aYears");
const aLevel = document.getElementById("aLevel");
const aPosition = document.getElementById("aPosition");
const aStrategy = document.getElementById("aStrategy");
const aNeutralOther = document.getElementById("aNeutralOther");
const aTopOther = document.getElementById("aTopOther");
const aBottomOther = document.getElementById("aBottomOther");
const aDefenseOther = document.getElementById("aDefenseOther");
const aInternational = document.getElementById("aInternational");
const aInternationalEvents = document.getElementById("aInternationalEvents");
const aInternationalYears = document.getElementById("aInternationalYears");
const aCoachCues = document.getElementById("aCoachCues");
const aCueNotes = document.getElementById("aCueNotes");
const aInjuryNotes = document.getElementById("aInjuryNotes");

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

function fillAthleteProfileForm(profile) {
  if (!athleteProfileForm || !profile) return;
  aName.value = profile.name || "";
  aPhoto.value = profile.photo || "";
  aCountry.value = profile.country || "";
  aCity.value = profile.city || "";
  aSchoolClub.value = profile.schoolClub || "no";
  aSchool.value = profile.schoolName || "";
  aClub.value = profile.clubName || "";
  aStyle.value = profile.style || "freestyle";
  aWeight.value = profile.currentWeight || "";
  aWeightClass.value = profile.weightClass || "";
  aYears.value = profile.years || "";
  aLevel.value = profile.level || "intermediate";
  aPosition.value = profile.position || "neutral";
  aStrategy.value = profile.strategy || "balanced";
  aNeutralOther.value = profile.techniques?.neutralOther || "";
  aTopOther.value = profile.techniques?.topOther || "";
  aBottomOther.value = profile.techniques?.bottomOther || "";
  aDefenseOther.value = profile.techniques?.defenseOther || "";
  aInternational.value = profile.international || "no";
  aInternationalEvents.value = profile.internationalEvents || "";
  aInternationalYears.value = profile.internationalYears || "";
  aCoachCues.value = profile.coachCues || "specific";
  aCueNotes.value = profile.cueNotes || "";
  aInjuryNotes.value = profile.injuryNotes || "";

  fillTechniques(".a-tech-neutral", profile.techniques?.neutral || []);
  fillTechniques(".a-tech-top", profile.techniques?.top || []);
  fillTechniques(".a-tech-bottom", profile.techniques?.bottom || []);
  fillTechniques(".a-tech-defense", profile.techniques?.defense || []);
}

function buildCompetitionPreview(profile) {
  if (!profile) return [];
  return [
    {
      title: "Athlete Basics",
      lines: [
        `Name: ${profile.name || "Unknown"}`,
        `Style: ${profile.style || "N/A"}`,
        `Weight: ${profile.currentWeight || "N/A"} (${profile.weightClass || "N/A"})`,
        `Experience: ${profile.years || "N/A"} years - ${profile.level || "N/A"}`,
        `Preferred position: ${profile.position || "N/A"}`,
        `Strategy: ${profile.strategy || "N/A"}`
      ]
    },
    {
      title: "Preferred Techniques",
      lines: [
        `Neutral: ${(profile.techniques?.neutral || []).join(", ") || "N/A"}`,
        `Top: ${(profile.techniques?.top || []).join(", ") || "N/A"}`,
        `Bottom: ${(profile.techniques?.bottom || []).join(", ") || "N/A"}`,
        `Defense: ${(profile.techniques?.defense || []).join(", ") || "N/A"}`,
        `Other: ${[
          profile.techniques?.neutralOther,
          profile.techniques?.topOther,
          profile.techniques?.bottomOther,
          profile.techniques?.defenseOther
        ].filter(Boolean).join(" - ") || "N/A"}`
      ]
    },
    {
      title: "International Experience",
      lines: [
        `International competition: ${profile.international || "No"}`,
        `Countries/events: ${profile.internationalEvents || "N/A"}`,
        `Years: ${profile.internationalYears || "N/A"}`
      ]
    },
    {
      title: "Competition Notes",
      lines: [
        `Coach cues: ${profile.coachCues || "N/A"}`,
        `What helps: ${profile.cueNotes || "N/A"}`,
        `Injuries/limits: ${profile.injuryNotes || "None"}`
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

if (athleteProfileForm) {
  athleteProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const existing = getProfile() || {};
    const updated = {
      ...existing,
      name: aName.value.trim(),
      photo: aPhoto.value.trim(),
      country: aCountry.value.trim(),
      city: aCity.value.trim(),
      schoolClub: aSchoolClub.value,
      schoolName: aSchool.value.trim(),
      clubName: aClub.value.trim(),
      style: aStyle.value,
      currentWeight: aWeight.value.trim(),
      weightClass: aWeightClass.value.trim(),
      years: aYears.value.trim(),
      level: aLevel.value,
      position: aPosition.value,
      strategy: aStrategy.value,
      techniques: {
        neutral: collectTechniques(".a-tech-neutral"),
        top: collectTechniques(".a-tech-top"),
        bottom: collectTechniques(".a-tech-bottom"),
        defense: collectTechniques(".a-tech-defense"),
        neutralOther: aNeutralOther.value.trim(),
        topOther: aTopOther.value.trim(),
        bottomOther: aBottomOther.value.trim(),
        defenseOther: aDefenseOther.value.trim()
      },
      international: aInternational.value,
      internationalEvents: aInternationalEvents.value.trim(),
      internationalYears: aInternationalYears.value.trim(),
      coachCues: aCoachCues.value,
      cueNotes: aCueNotes.value.trim(),
      injuryNotes: aInjuryNotes.value.trim()
    };
    setProfile(updated);
    applyProfile(updated);
    toast("Profile saved.");
  });
}

if (previewProfileBtn) {
  previewProfileBtn.addEventListener("click", () => {
    renderCompetitionPreview(getProfile());
    showTab("competition-preview");
  });
}

if (backToProfileBtn) {
  backToProfileBtn.addEventListener("click", () => showTab("athlete-profile"));
}

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
    li.textContent = "No favorites yet.";
    favoritesList.appendChild(li);
    return;
  }

  favs.forEach((f, idx) => {
    const li = document.createElement("li");
    li.textContent = f;

    const del = document.createElement("button");
    del.textContent = "Remove";
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
renderFavorites();

// ---------- TODAY ----------
const todayTitle = document.getElementById("todayTitle");
const todaySubtitle = document.getElementById("todaySubtitle");
const todayType = document.getElementById("todayType");
const sessionBlocks = document.getElementById("sessionBlocks");
const startSessionBtn = document.getElementById("startSessionBtn");
const watchFilmBtn = document.getElementById("watchFilmBtn");
const logCompletionBtn = document.getElementById("logCompletionBtn");
const feelingScale = document.getElementById("feelingScale");
const dailyStatus = document.getElementById("dailyStatus");

function toast(msg) {
  dailyStatus.textContent = msg;
  setTimeout(() => (dailyStatus.textContent = ""), 1600);
}

function renderToday(dayIndex = new Date().getDay()) {
  const plan = WEEK_PLAN[dayIndex];
  if (!plan) return;

  todayTitle.textContent = plan.focus;
  todaySubtitle.textContent = `Total time: ${plan.total} - Intensity: ${plan.intensity}`;
  todayType.textContent = plan.focus;
  if (getProfile()?.role !== "coach") {
    roleMeta.textContent = `Training Focus: ${plan.focus}`;
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
      toast(`Check-in saved: ${i}/5`);
    });
    feelingScale.appendChild(btn);
  }
}

startSessionBtn.addEventListener("click", () => {
  const plan = WEEK_PLAN[new Date().getDay()];
  const intro = `${plan.focus} session. ${plan.blocks[0]?.label || ""}.`;
  speak(intro);
  toast("Session started. Stay focused.");
});

watchFilmBtn.addEventListener("click", () => {
  toast("Film assigned: Single Leg Finish");
});

logCompletionBtn.addEventListener("click", () => {
  toast("Session logged. Great work.");
});

renderToday();
renderFeelingScale();

// ---------- TRAINING PLAN ----------
const planGrid = document.getElementById("planGrid");
const planDayTitle = document.getElementById("planDayTitle");
const planDayDetail = document.getElementById("planDayDetail");

function renderPlanGrid(selectedDay = new Date().getDay()) {
  planGrid.innerHTML = "";
  WEEK_PLAN.forEach((plan, idx) => {
    const card = document.createElement("div");
    card.className = "plan-card" + (idx === selectedDay ? " active" : "");
    card.innerHTML = `
      <strong>${plan.day}</strong>
      <div class="small">${plan.focus} - ${plan.intensity}</div>
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
  const plan = WEEK_PLAN[dayIndex];
  if (!plan) return;
  planDayTitle.textContent = `${plan.day} Plan`;
  planDayDetail.innerHTML = "";
  plan.details.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    planDayDetail.appendChild(li);
  });
}

renderPlanGrid();

// ---------- CALENDAR ----------
const calendarGrid = document.getElementById("calendarGrid");
const calTitle = document.getElementById("calTitle");
const calDrills = document.getElementById("calDrills");

function renderCalendar(selectedDay = new Date().getDay()) {
  calendarGrid.innerHTML = "";

  WEEK_PLAN.forEach((plan, idx) => {
    const events = CALENDAR_EVENTS[idx] || [];
    const btn = document.createElement("button");
    btn.className = "day-btn" + (idx === selectedDay ? " active" : "");
    btn.innerHTML = `
      <strong>${plan.day}</strong>
      <div class="small">${plan.focus} - ${events.length} events</div>
    `;

    btn.addEventListener("click", () => {
      renderCalendar(idx);
      renderCalendarDetails(idx);
    });

    calendarGrid.appendChild(btn);
  });

  renderCalendarDetails(selectedDay);
}

function renderCalendarDetails(dayIndex) {
  const plan = WEEK_PLAN[dayIndex];
  const events = CALENDAR_EVENTS[dayIndex] || [];

  calTitle.textContent = `${plan.day} - ${plan.focus}`;
  calDrills.innerHTML = "";

  const focusItem = document.createElement("li");
  focusItem.textContent = `Training: ${plan.focus} (${plan.intensity})`;
  calDrills.appendChild(focusItem);

  if (events.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No extra events scheduled.";
    calDrills.appendChild(li);
    return;
  }

  events.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    calDrills.appendChild(li);
  });
}

renderCalendar();

// ---------- MEDIA ----------
const mediaGrid = document.getElementById("mediaGrid");

function renderMedia() {
  mediaGrid.innerHTML = "";
  MEDIA_ITEMS.forEach((item) => {
    const card = document.createElement("div");
    card.className = "media-card";
    card.innerHTML = `
      <h4>${item.title}</h4>
      <div class="small">${item.type} - ${item.tag}</div>
      <div class="small">Assigned: ${item.assigned}</div>
    `;

    const btn = document.createElement("button");
    btn.textContent = "Save to Favorites";
    btn.addEventListener("click", () => {
      const favs = getFavorites();
      const label = `${item.title} (${item.tag})`;
      if (!favs.includes(label)) {
        favs.unshift(label);
        setFavorites(favs);
        renderFavorites();
      }
    });

    card.appendChild(btn);
    mediaGrid.appendChild(card);
  });
}

renderMedia();

// ---------- ANNOUNCEMENTS ----------
const announcementList = document.getElementById("announcementList");

function renderAnnouncements() {
  announcementList.innerHTML = "";
  ANNOUNCEMENTS.forEach((note) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${note.title}</strong><div class="small">${note.detail} - ${note.time}</div>`;
    announcementList.appendChild(li);
  });
}
renderAnnouncements();

// ---------- DASHBOARD ----------
const teamStats = document.getElementById("teamStats");
const alertList = document.getElementById("alertList");
const teamOverview = document.getElementById("teamOverview");
const quickActions = document.getElementById("quickActions");

function renderDashboard() {
  teamStats.innerHTML = "";
  TEAM_STATS.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<h3>${stat.value}</h3><p>${stat.title} - ${stat.note}</p>`;
    teamStats.appendChild(card);
  });

  teamOverview.innerHTML = "";
  TEAM_OVERVIEW.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    teamOverview.appendChild(li);
  });

  quickActions.innerHTML = "";
  QUICK_ACTIONS.forEach((action) => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = action;
    quickActions.appendChild(btn);
  });

  alertList.innerHTML = "";
  ALERTS.forEach((alert) => {
    const div = document.createElement("div");
    div.className = "alert";
    div.textContent = alert;
    alertList.appendChild(div);
  });
}

renderDashboard();

// ---------- COACH PROFILE ----------
const coachAccount = document.getElementById("coachAccount");
const coachProfile = document.getElementById("coachProfile");
const coachDiscipline = document.getElementById("coachDiscipline");
const coachStyle = document.getElementById("coachStyle");
const coachInternational = document.getElementById("coachInternational");

function renderCoachProfile() {
  coachAccount.innerHTML = "";
  COACH_ACCOUNT.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachAccount.appendChild(li);
  });

  coachProfile.innerHTML = "";
  COACH_PROFILE.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachProfile.appendChild(li);
  });

  coachDiscipline.innerHTML = "";
  COACH_DISCIPLINE.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    coachDiscipline.appendChild(tag);
  });

  coachStyle.innerHTML = "";
  COACH_STYLE.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    coachStyle.appendChild(tag);
  });

  coachInternational.innerHTML = "";
  COACH_INTERNATIONAL.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachInternational.appendChild(li);
  });
}

renderCoachProfile();

// ---------- ATHLETE MANAGEMENT ----------
const athleteFilters = document.getElementById("athleteFilters");
const athleteList = document.getElementById("athleteList");

function renderAthleteManagement() {
  athleteFilters.innerHTML = "";
  ATHLETE_FILTERS.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    athleteFilters.appendChild(tag);
  });

  athleteList.innerHTML = "";
  ATHLETES.forEach((athlete) => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    card.innerHTML = `
      <h4>${athlete.name}</h4>
      <div class="small">${athlete.weight} - ${athlete.style}</div>
      <div class="small">Status: ${athlete.availability}</div>
      <div class="small">Preferred: ${athlete.preferred}</div>
      <div class="small">International: ${athlete.international}</div>
      <div class="small">${athlete.history}</div>
      <div class="small">${athlete.notes}</div>
    `;
    const btn = document.createElement("button");
    btn.textContent = "Open One-Pager";
    btn.addEventListener("click", () => {
      selectOnePagerAthlete(athlete.name);
      showTab("one-pager");
    });
    card.appendChild(btn);
    athleteList.appendChild(card);
  });
}

renderAthleteManagement();

// ---------- JOURNAL MONITOR ----------
const journalInsights = document.getElementById("journalInsights");
const journalFlags = document.getElementById("journalFlags");
const journalAthletes = document.getElementById("journalAthletes");

function renderJournalMonitor() {
  journalInsights.innerHTML = "";
  JOURNAL_INSIGHTS.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    journalInsights.appendChild(li);
  });

  journalFlags.innerHTML = "";
  JOURNAL_FLAGS.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    journalFlags.appendChild(li);
  });

  journalAthletes.innerHTML = "";
  JOURNAL_ATHLETES.forEach((athlete) => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    card.innerHTML = `
      <h4>${athlete.name}</h4>
      <div class="small">Sleep: ${athlete.sleep} - Energy: ${athlete.energy}</div>
      <div class="small">Soreness: ${athlete.soreness} - Mood: ${athlete.mood}</div>
      <div class="small">Weight trend: ${athlete.weight}</div>
    `;
    journalAthletes.appendChild(card);
  });
}

renderJournalMonitor();

// ---------- PERMISSIONS ----------
const permissionsCan = document.getElementById("permissionsCan");
const permissionsCannot = document.getElementById("permissionsCannot");

function renderPermissions() {
  permissionsCan.innerHTML = "";
  PERMISSIONS.can.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    permissionsCan.appendChild(li);
  });

  permissionsCannot.innerHTML = "";
  PERMISSIONS.cannot.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    permissionsCannot.appendChild(li);
  });
}

renderPermissions();

// ---------- FUTURE ----------
const futureAddons = document.getElementById("futureAddons");
const coachDesign = document.getElementById("coachDesign");

function renderFuture() {
  futureAddons.innerHTML = "";
  FUTURE_ADDONS.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    futureAddons.appendChild(li);
  });

  coachDesign.innerHTML = "";
  COACH_DESIGN.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    coachDesign.appendChild(li);
  });
}

renderFuture();

// ---------- ONE-PAGER ----------
const onePagerSelect = document.getElementById("onePagerSelect");
const onePagerHeader = document.getElementById("onePagerHeader");
const onePagerIdentity = document.getElementById("onePagerIdentity");
const onePagerTechniques = document.getElementById("onePagerTechniques");
const onePagerPlan = document.getElementById("onePagerPlan");
const onePagerDo = document.getElementById("onePagerDo");
const onePagerDont = document.getElementById("onePagerDont");
const onePagerCues = document.getElementById("onePagerCues");
const onePagerCueNotes = document.getElementById("onePagerCueNotes");
const onePagerSafety = document.getElementById("onePagerSafety");
const saveOnePagerPlan = document.getElementById("saveOnePagerPlan");
const saveOnePagerDos = document.getElementById("saveOnePagerDos");
const saveOnePagerCues = document.getElementById("saveOnePagerCues");
const saveOnePagerSafety = document.getElementById("saveOnePagerSafety");
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
    years: athlete.years || athlete.level || "N/A",
    international: athlete.international || "No",
    internationalEvents: athlete.internationalEvents || "",
    position: athlete.position || "Neutral",
    strategy: athlete.strategy || "Balanced",
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
  const athlete = ATHLETES.find((a) => a.name === athleteName) || getProfile();
  if (!athlete) return;
  const base = buildOnePagerBase(athlete);
  const saved = getOnePagerData(base.name) || {};
  const merged = {
    ...base,
    plan: saved.plan || "Score first with single leg. Stay heavy on top.",
    do: saved.do || "Push pace early. Keep elbows tight.",
    dont: saved.dont || "Overextend on shots. Hang in underhook.",
    coachCues: saved.coachCues || base.coachCues,
    cueNotes: saved.cueNotes || base.cueNotes,
    injuryNotes: saved.injuryNotes || base.injuryNotes
  };

  if (onePagerHeader) {
    const initials = merged.name ? merged.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "AT";
    onePagerHeader.innerHTML = `
      <div class="onepager-avatar">${initials}</div>
      <div>
        <h3>${merged.name}</h3>
        <div class="small">${merged.style} - ${merged.currentWeight} (${merged.weightClass})</div>
        <div class="small">${merged.school || "School N/A"} ${merged.club ? "- " + merged.club : ""}</div>
      </div>
    `;
  }

  if (onePagerIdentity) {
    onePagerIdentity.innerHTML = `
      <h3>Experience & Identity</h3>
      <ul class="list">
        <li>Experience: ${merged.years}</li>
        <li>International: ${merged.international}</li>
        <li>${merged.internationalEvents || "No international events listed"}</li>
        <li>Preferred position: ${merged.position}</li>
        <li>Strategy: ${merged.strategy}</li>
      </ul>
    `;
  }

  if (onePagerTechniques) {
    onePagerTechniques.innerHTML = `
      <h3>Preferred Techniques</h3>
      <ul class="list">
        <li>Neutral: ${(merged.techniques.neutral || []).join(", ") || "N/A"}</li>
        <li>Top: ${(merged.techniques.top || []).join(", ") || "N/A"}</li>
        <li>Bottom: ${(merged.techniques.bottom || []).join(", ") || "N/A"}</li>
        <li>Defense: ${(merged.techniques.defense || []).join(", ") || "N/A"}</li>
      </ul>
    `;
  }

  if (onePagerPlan) onePagerPlan.value = merged.plan;
  if (onePagerDo) onePagerDo.value = merged.do;
  if (onePagerDont) onePagerDont.value = merged.dont;
  if (onePagerCues) onePagerCues.value = merged.coachCues;
  if (onePagerCueNotes) onePagerCueNotes.value = merged.cueNotes;
  if (onePagerSafety) onePagerSafety.value = merged.injuryNotes;
}

function selectOnePagerAthlete(name) {
  if (onePagerSelect) onePagerSelect.value = name;
  renderOnePager(name);
}

if (onePagerSelect) {
  onePagerSelect.innerHTML = "";
  ATHLETES.forEach((athlete) => {
    const option = document.createElement("option");
    option.value = athlete.name;
    option.textContent = athlete.name;
    onePagerSelect.appendChild(option);
  });
  onePagerSelect.addEventListener("change", () => renderOnePager(onePagerSelect.value));
  selectOnePagerAthlete(ATHLETES[0]?.name);
}

function saveOnePagerField(field, value) {
  const name = onePagerSelect?.value || "Athlete";
  const current = getOnePagerData(name) || {};
  setOnePagerData(name, { ...current, [field]: value });
  toast("One-pager saved.");
}

if (saveOnePagerPlan) {
  saveOnePagerPlan.addEventListener("click", () => {
    saveOnePagerField("plan", onePagerPlan.value.trim());
  });
}

if (saveOnePagerDos) {
  saveOnePagerDos.addEventListener("click", () => {
    saveOnePagerField("do", onePagerDo.value.trim());
    saveOnePagerField("dont", onePagerDont.value.trim());
  });
}

if (saveOnePagerCues) {
  saveOnePagerCues.addEventListener("click", () => {
    saveOnePagerField("coachCues", onePagerCues.value);
    saveOnePagerField("cueNotes", onePagerCueNotes.value.trim());
  });
}

if (saveOnePagerSafety) {
  saveOnePagerSafety.addEventListener("click", () => {
    saveOnePagerField("injuryNotes", onePagerSafety.value.trim());
  });
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

// ---------- MESSAGES ----------
const messageList = document.getElementById("messageList");

function renderMessages() {
  if (!messageList) return;
  messageList.innerHTML = "";
  COACH_MESSAGES.forEach((msg) => {
    const card = document.createElement("div");
    card.className = "message-card";
    card.innerHTML = `
      <div class="tag-pill">${msg.tag}</div>
      <h4>${msg.athlete}</h4>
      <div class="small">${msg.text}</div>
      <div class="small">${msg.time}</div>
    `;
    messageList.appendChild(card);
  });
}

renderMessages();

// ---------- SKILLS ----------
const skillsGrid = document.getElementById("skillsGrid");

function renderSkills() {
  skillsGrid.innerHTML = "";
  SKILLS.forEach((skill) => {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <h3>${skill.name}</h3>
      <div class="rating">${skill.rating}</div>
      <div class="small">Best clip: ${skill.clip}</div>
      <div class="small">Notes: ${skill.notes}</div>
      <div class="small">Updated: ${skill.updated}</div>
    `;
    skillsGrid.appendChild(card);
  });
}

renderSkills();

// ---------- JOURNAL ----------
const journalInput = document.getElementById("journalInput");
const saveJournalBtn = document.getElementById("saveJournalBtn");
const clearJournalBtn = document.getElementById("clearJournalBtn");
const journalStatus = document.getElementById("journalStatus");

const sleepInput = document.getElementById("sleepInput");
const energyInput = document.getElementById("energyInput");
const sorenessInput = document.getElementById("sorenessInput");
const weightInput = document.getElementById("weightInput");
const moodInput = document.getElementById("moodInput");
const injuryInput = document.getElementById("injuryInput");

const JOURNAL_KEY = "wpl_journal";

function loadJournal() {
  const saved = localStorage.getItem(JOURNAL_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    journalInput.value = data.notes || "";
    sleepInput.value = data.sleep || "";
    energyInput.value = data.energy || "";
    sorenessInput.value = data.soreness || "";
    weightInput.value = data.weight || "";
    moodInput.value = data.mood || "";
    injuryInput.value = data.injury || "";
  } catch {
    journalInput.value = saved;
  }
}
loadJournal();

saveJournalBtn.addEventListener("click", () => {
  const data = {
    notes: journalInput.value,
    sleep: sleepInput.value,
    energy: energyInput.value,
    soreness: sorenessInput.value,
    weight: weightInput.value,
    mood: moodInput.value,
    injury: injuryInput.value
  };
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
  journalStatus.textContent = "Saved.";
  setTimeout(() => (journalStatus.textContent = ""), 1200);
});

clearJournalBtn.addEventListener("click", () => {
  journalInput.value = "";
  sleepInput.value = "";
  energyInput.value = "";
  sorenessInput.value = "";
  weightInput.value = "";
  moodInput.value = "";
  injuryInput.value = "";
  localStorage.removeItem(JOURNAL_KEY);
  journalStatus.textContent = "Cleared.";
  setTimeout(() => (journalStatus.textContent = ""), 1200);
});

// Initialize the new plan selectors
initializePlanSelectors();
