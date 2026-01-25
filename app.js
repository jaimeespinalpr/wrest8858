// ==============================
// Wrestling Coaching Experience
// Role-based views + training experience
// ==============================

// ---------- PROFILE / ONBOARDING ----------
const PROFILE_KEY = "wce_profile";

const onboarding = document.getElementById("onboarding");
const appRoot = document.getElementById("appRoot");
const profileForm = document.getElementById("profileForm");
const skipBtn = document.getElementById("skipBtn");
const userMeta = document.getElementById("userMeta");
const roleMeta = document.getElementById("roleMeta");
const editProfileBtn = document.getElementById("editProfileBtn");

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

function applyProfile(profile) {
  if (!profile) {
    userMeta.textContent = "Athlete View";
    roleMeta.textContent = "Training Focus: Mat Technique";
    setRoleUI("athlete");
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

function bootProfile() {
  const existing = getProfile();
  if (!existing) {
    showOnboarding(null);
  } else {
    hideOnboarding();
    applyProfile(existing);
  }
}

// Create profile
profileForm.addEventListener("submit", (e) => {
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
  applyProfile(profile);
  hideOnboarding();
});

// Skip profile (use default)
skipBtn.addEventListener("click", () => {
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
  applyProfile(profile);
  hideOnboarding();
});

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
  { title: "Check-ins Today", value: "14/18", note: "2 athletes missing" },
  { title: "Average Energy", value: "3.8", note: "Up from last week" },
  { title: "Compliance Rate", value: "86%", note: "Goal: 90%" },
  { title: "Upcoming Events", value: "4", note: "2 in next 7 days" }
];

const TEAM_OVERVIEW = [
  "Athletes: 18 active",
  "Training plans: 6 running",
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
    notes: "Tournament prep"
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
    "Send announcements and updates"
  ],
  cannot: [
    "Edit athlete self-reported journal entries",
    "Edit athlete account credentials",
    "Access other teams without permission"
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
  plans: document.getElementById("panel-plans"),
  "calendar-manager": document.getElementById("panel-calendar-manager"),
  "media-library": document.getElementById("panel-media-library"),
  "athlete-notes": document.getElementById("panel-athlete-notes"),
  skills: document.getElementById("panel-skills"),
  "journal-monitor": document.getElementById("panel-journal-monitor"),
  reports: document.getElementById("panel-reports"),
  permissions: document.getElementById("panel-permissions"),
  future: document.getElementById("panel-future"),
  "competition-preview": document.getElementById("panel-competition-preview")
};

function showTab(name) {
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  Object.entries(panels).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", k !== name);
  });
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

// initial boot after tabs are ready
bootProfile();

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
const FAV_KEY = "wce_favorites";
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

const JOURNAL_KEY = "wce_journal";

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
