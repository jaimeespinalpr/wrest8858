"use strict";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

initializeApp();

const firestore = getFirestore();

const USERS_COLLECTION = "users";
const DELIVERY_LOG_COLLECTION = "_system_registration_email_events";
const ALERT_EMAIL_TO = "jaimeespinalpr@gmail.com";
const ALERT_EMAIL_FROM = "WPL Alerts <onboarding@resend.dev>";
const COACH_WORKSPACES_COLLECTION = "coach_workspaces";
const SYSTEM_GROUP_DEFS = [
  { id: "all-registered-athletes", name: "All Registered Athletes" },
  { id: "varsity", name: "Varsity" },
  { id: "jv", name: "JV" },
  { id: "beginners", name: "Beginners" },
  { id: "competition-team", name: "Competition Team" },
  { id: "rehab-return-to-play", name: "Rehab / Return to Play" },
  { id: "remote-athletes", name: "Remote Athletes" },
  { id: "private-clients", name: "Private Clients" }
];

function formatRole(role) {
  const normalized = String(role || "").trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : "Unknown";
}

function registrationSubject(profile) {
  return `New WPL registration: ${profile.name || profile.email || "Unknown user"}`;
}

function registrationText(profile, userId) {
  const lines = [
    "A new user registered in Wrestling Performance Lab.",
    "",
    `Name: ${profile.name || "N/A"}`,
    `Email: ${profile.email || "N/A"}`,
    `Role: ${formatRole(profile.role)}`,
    `View: ${profile.view || "N/A"}`,
    `Status: ${profile.status || "N/A"}`,
    `Athlete Name: ${profile.athleteName || "N/A"}`,
    `Linked Athlete ID: ${profile.linkedAthleteId || "N/A"}`,
    `Linked Coach: ${profile.linkedCoachName || profile.linkedCoachEmail || "N/A"}`,
    `User ID: ${userId}`,
    `Created At: ${profile.createdAt || new Date().toISOString()}`
  ];
  return lines.join("\n");
}

function registrationHtml(profile, userId) {
  const safe = (value) => String(value || "N/A")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return [
    "<div style=\"font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px\">",
    "<div style=\"max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:20px;padding:24px\">",
    "<div style=\"font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#38bdf8;margin-bottom:12px\">Wrestling Performance Lab</div>",
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:#f8fafc">New registration: ${safe(profile.name || profile.email)}</h1>`,
    "<table style=\"width:100%;border-collapse:collapse\">",
    `<tr><td style="padding:8px 0;color:#93c5fd">Name</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.name)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Email</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.email)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Role</td><td style="padding:8px 0;color:#f8fafc">${safe(formatRole(profile.role))}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">View</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.view)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Status</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.status)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Athlete Name</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.athleteName)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Linked Athlete ID</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.linkedAthleteId)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Linked Coach</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.linkedCoachName || profile.linkedCoachEmail)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">User ID</td><td style="padding:8px 0;color:#f8fafc">${safe(userId)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#93c5fd">Created At</td><td style="padding:8px 0;color:#f8fafc">${safe(profile.createdAt || new Date().toISOString())}</td></tr>`,
    "</table>",
    "</div>",
    "</div>"
  ].join("");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeRole(value) {
  const role = normalizeText(value).toLowerCase();
  if (role === "coach" || role === "parent" || role === "admin") return role;
  return "athlete";
}

function slugifyKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStrings(values = []) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => normalizeText(value))
      .filter(Boolean)
  ));
}

function stringListsEqual(left = [], right = []) {
  const a = uniqueStrings(left);
  const b = uniqueStrings(right);
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function parseExperienceYears(value) {
  const numeric = Number(normalizeText(value));
  return Number.isFinite(numeric) ? numeric : null;
}

function buildWorkspaceAthleteRecord(id, data = {}) {
  return {
    id: normalizeText(id || data.id || slugifyKey(data.name || data.email || "")),
    name: normalizeText(data.name || data.athleteName || data.email || "Athlete"),
    athleteUid: normalizeText(data.athleteUid || data.uid || ""),
    athleteEmail: normalizeEmail(data.athleteEmail || data.email || ""),
    coachUid: normalizeText(data.coachUid || data.linkedCoachUid || ""),
    coachName: normalizeText(data.coachName || data.linkedCoachName || ""),
    coachEmail: normalizeEmail(data.coachEmail || data.linkedCoachEmail || ""),
    weightClass: normalizeText(data.weightClass || data.weight_class || ""),
    currentWeight: normalizeText(data.currentWeight || data.weight || ""),
    style: normalizeText(data.style || ""),
    availability: normalizeText(data.availability || "Active"),
    preferred: normalizeText(data.preferred || data.preferredMoves || data.preferred_moves || ""),
    notes: normalizeText(data.notes || ""),
    experienceYears: normalizeText(data.experienceYears || data.experience_years || ""),
    level: normalizeText(data.level || ""),
    strategy: normalizeText(data.strategy || ""),
    tags: Array.isArray(data.tags) ? data.tags.map((value) => normalizeText(value)).filter(Boolean) : []
  };
}

function buildAthleteWorkspaceRecordFromUser(user = {}, coachMeta = {}) {
  const athleteId = normalizeText(user.linkedAthleteId || slugifyKey(user.name || user.email || ""));
  return buildWorkspaceAthleteRecord(athleteId, {
    ...user,
    athleteUid: user.uid,
    athleteEmail: user.email,
    coachUid: user.linkedCoachUid || coachMeta.coachUid || "",
    coachName: user.linkedCoachName || coachMeta.coachName || "",
    coachEmail: user.linkedCoachEmail || coachMeta.coachEmail || "",
    currentWeight: user.currentWeight || "",
    preferred: user.preferredMoves || "",
    availability: "Active"
  });
}

function groupMatchesAthlete(groupId, athlete = {}) {
  const experienceYears = parseExperienceYears(athlete.experienceYears);
  const textBlob = [
    athlete.notes,
    athlete.strategy,
    athlete.preferred,
    athlete.availability,
    athlete.level,
    ...(athlete.tags || [])
  ].join(" ").toLowerCase();

  switch (groupId) {
    case "all-registered-athletes":
      return true;
    case "varsity":
      return athlete.level.toLowerCase() === "advanced" || (experienceYears != null && experienceYears >= 5);
    case "jv":
      return athlete.level.toLowerCase() === "intermediate" || (experienceYears != null && experienceYears >= 2 && experienceYears < 5);
    case "beginners":
      return athlete.level.toLowerCase() === "beginner" || (experienceYears != null && experienceYears >= 0 && experienceYears < 2);
    case "competition-team":
      return athlete.level.toLowerCase() === "advanced" || /competition|tournament|travel squad|varsity/.test(textBlob);
    case "rehab-return-to-play":
      return /rehab|return to play|injury|limited|recover/.test(textBlob);
    case "remote-athletes":
      return /remote|travel|virtual/.test(textBlob);
    case "private-clients":
      return /private|client|1:1|one-on-one/.test(textBlob);
    default:
      return false;
  }
}

function buildSystemGroupPayload(groupId, groupName, athletes = []) {
  const members = athletes.filter((athlete) => groupMatchesAthlete(groupId, athlete));
  return {
    name: groupName,
    memberNames: uniqueStrings(members.map((athlete) => athlete.name)),
    memberIds: uniqueStrings(members.map((athlete) => athlete.id)),
    memberUids: uniqueStrings(members.map((athlete) => athlete.athleteUid).filter(Boolean)),
    system: true
  };
}

async function syncCoachWorkspaceFromUsers(coachUser, allUsers = []) {
  const coachUid = normalizeText(coachUser.uid);
  if (!coachUid) return;

  const coachMeta = {
    coachUid,
    coachName: normalizeText(coachUser.name || coachUser.email || "Coach"),
    coachEmail: normalizeEmail(coachUser.email || "")
  };

  const workspaceRef = firestore.collection(COACH_WORKSPACES_COLLECTION).doc(coachUid);
  const athletesRef = workspaceRef.collection("athletes");
  const groupsRef = workspaceRef.collection("groups");

  const [workspaceAthletesSnap, groupsSnap] = await Promise.all([
    athletesRef.get(),
    groupsRef.get()
  ]);

  const athleteUsers = allUsers
    .filter((user) => normalizeRole(user.role) === "athlete")
    .map((user) => buildAthleteWorkspaceRecordFromUser(user, coachMeta));
  const workspaceAthletes = workspaceAthletesSnap.docs.map((doc) => buildWorkspaceAthleteRecord(doc.id, doc.data() || {}));

  const rosterMap = new Map();
  [...workspaceAthletes, ...athleteUsers].forEach((athlete) => {
    if (!athlete.id) return;
    rosterMap.set(athlete.id, athlete);
  });
  const roster = Array.from(rosterMap.values());

  const batch = firestore.batch();
  let writes = 0;

  allUsers
    .filter((user) => normalizeRole(user.role) === "athlete" && normalizeText(user.linkedCoachUid) === coachUid)
    .forEach((user) => {
      const athleteRecord = buildAthleteWorkspaceRecordFromUser(user, coachMeta);
      const current = workspaceAthletes.find((item) => item.id === athleteRecord.id) || {};
      const needsWrite = current.athleteUid !== athleteRecord.athleteUid
        || current.athleteEmail !== athleteRecord.athleteEmail
        || current.coachUid !== athleteRecord.coachUid
        || current.coachName !== athleteRecord.coachName
        || current.coachEmail !== athleteRecord.coachEmail
        || current.weightClass !== athleteRecord.weightClass
        || current.currentWeight !== athleteRecord.currentWeight
        || current.style !== athleteRecord.style
        || current.preferred !== athleteRecord.preferred
        || current.notes !== athleteRecord.notes
        || current.experienceYears !== athleteRecord.experienceYears;
      if (!needsWrite) return;
      batch.set(athletesRef.doc(athleteRecord.id), {
        ...athleteRecord,
        createdAt: current.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      writes += 1;
    });

  const groupDocsById = new Map(groupsSnap.docs.map((doc) => [doc.id, doc.data() || {}]));
  SYSTEM_GROUP_DEFS.forEach((groupDef) => {
    const payload = buildSystemGroupPayload(groupDef.id, groupDef.name, roster);
    const current = groupDocsById.get(groupDef.id) || {};
    const currentNames = uniqueStrings(current.memberNames || current.members || []);
    const currentIds = uniqueStrings(current.memberIds || []);
    const currentUids = uniqueStrings(current.memberUids || []);
    if (
      normalizeText(current.name) === payload.name
      && current.system === true
      && stringListsEqual(currentNames, payload.memberNames)
      && stringListsEqual(currentIds, payload.memberIds)
      && stringListsEqual(currentUids, payload.memberUids)
    ) {
      return;
    }
    batch.set(groupsRef.doc(groupDef.id), {
      ...payload,
      createdAt: current.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    writes += 1;
  });

  if (writes) {
    await batch.commit();
  }
}

async function syncUserRegistrationState(snapshot) {
  const usersSnapshot = await firestore.collection(USERS_COLLECTION).get();
  const allUsers = usersSnapshot.docs.map((doc) => ({
    uid: doc.id,
    ...(doc.data() || {})
  }));

  if (snapshot?.exists) {
    const uid = normalizeText(snapshot.id);
    const data = snapshot.data() || {};
    const role = normalizeRole(data.role);
    const patch = {};

    if (role === "athlete") {
      const nextAthleteId = normalizeText(data.linkedAthleteId || slugifyKey(data.name || data.email || uid));
      if (normalizeText(data.linkedAthleteId) !== nextAthleteId) patch.linkedAthleteId = nextAthleteId;
      if (normalizeText(data.linkedAthleteUid) !== uid) patch.linkedAthleteUid = uid;
      if (normalizeText(data.view) !== "athlete") patch.view = "athlete";
    }

    if (role === "parent") {
      const athleteName = normalizeText(data.athleteName || "");
      const athleteId = normalizeText(data.linkedAthleteId || slugifyKey(athleteName));
      const linkedAthlete = allUsers.find((user) => (
        normalizeRole(user.role) === "athlete"
        && (
          normalizeText(user.linkedAthleteId || "") === athleteId
          || normalizeText(user.name || "").toLowerCase() === athleteName.toLowerCase()
        )
      )) || null;
      if (athleteName && normalizeText(data.linkedAthleteId) !== athleteId) patch.linkedAthleteId = athleteId;
      if (linkedAthlete) {
        if (normalizeText(data.linkedAthleteUid) !== normalizeText(linkedAthlete.uid)) patch.linkedAthleteUid = normalizeText(linkedAthlete.uid);
        if (normalizeText(data.linkedCoachUid) !== normalizeText(linkedAthlete.linkedCoachUid || "")) patch.linkedCoachUid = normalizeText(linkedAthlete.linkedCoachUid || "");
        if (normalizeText(data.linkedCoachName) !== normalizeText(linkedAthlete.linkedCoachName || "")) patch.linkedCoachName = normalizeText(linkedAthlete.linkedCoachName || "");
        if (normalizeEmail(data.linkedCoachEmail) !== normalizeEmail(linkedAthlete.linkedCoachEmail || "")) patch.linkedCoachEmail = normalizeEmail(linkedAthlete.linkedCoachEmail || "");
      }
      if (normalizeText(data.view) !== "parent") patch.view = "parent";
    }

    if (role === "coach" && normalizeText(data.view) !== "coach") {
      patch.view = "coach";
    }

    if (Object.keys(patch).length) {
      patch.updatedAt = FieldValue.serverTimestamp();
      await firestore.collection(USERS_COLLECTION).doc(uid).set(patch, { merge: true });
      allUsers.splice(
        allUsers.findIndex((user) => user.uid === uid),
        1,
        { uid, ...data, ...patch }
      );
    }
  }

  const coachUsers = allUsers.filter((user) => {
    const role = normalizeRole(user.role);
    return role === "coach" || role === "admin";
  });

  for (const coachUser of coachUsers) {
    await syncCoachWorkspaceFromUsers(coachUser, allUsers);
  }
}

async function sendWithResend(apiKey, profile, userId) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: ALERT_EMAIL_FROM,
      to: [ALERT_EMAIL_TO],
      subject: registrationSubject(profile),
      text: registrationText(profile, userId),
      html: registrationHtml(profile, userId)
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.message || `resend_${response.status}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

exports.notifyRegistrationByEmail = onDocumentCreated({
  document: `${USERS_COLLECTION}/{userId}`,
  region: "us-central1"
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const userId = String(event.params.userId || snapshot.id || "").trim();
  const profile = snapshot.data() || {};
  const dedupeId = String(event.id || `${userId}-created`).trim();
  const dedupeRef = firestore.collection(DELIVERY_LOG_COLLECTION).doc(dedupeId);

  try {
    await dedupeRef.create({
      type: "registration_email",
      userId,
      email: String(profile.email || "").trim().toLowerCase(),
      role: String(profile.role || "").trim().toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
      deliveryStatus: "pending"
    });
  } catch (err) {
    if (err?.code === 6 || err?.code === "already-exists") {
      logger.info("Skipping duplicate registration email event", { eventId: dedupeId, userId });
      return;
    }
    throw err;
  }

  const apiKey = normalizeText(process.env.RESEND_API_KEY);
  if (!apiKey) {
    logger.error("RESEND_API_KEY is not configured", { userId, email: profile.email || "" });
    await dedupeRef.set({
      deliveryStatus: "missing_secret",
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return;
  }

  try {
    const response = await sendWithResend(apiKey, profile, userId);
    await dedupeRef.set({
      deliveryStatus: "sent",
      resendId: String(response?.id || ""),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    logger.info("Registration email sent", {
      userId,
      email: profile.email || "",
      resendId: response?.id || ""
    });
  } catch (err) {
    logger.error("Registration email failed", {
      userId,
      email: profile.email || "",
      status: err?.status || null,
      message: err?.message || String(err),
      payload: err?.payload || null
    });
    await dedupeRef.set({
      deliveryStatus: "failed",
      errorMessage: String(err?.message || err || ""),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    throw err;
  }
});

exports.syncRegistrationGroups = onDocumentWritten({
  document: `${USERS_COLLECTION}/{userId}`,
  region: "us-central1"
}, async (event) => {
  const snapshot = event.data?.after || null;
  try {
    await syncUserRegistrationState(snapshot);
    logger.info("Registration sync completed", {
      userId: normalizeText(event.params.userId || snapshot?.id || ""),
      exists: Boolean(snapshot?.exists)
    });
  } catch (err) {
    logger.error("Registration sync failed", {
      userId: normalizeText(event.params.userId || snapshot?.id || ""),
      message: err?.message || String(err)
    });
    throw err;
  }
});
