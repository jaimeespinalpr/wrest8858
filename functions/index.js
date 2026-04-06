"use strict";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

initializeApp();

const firestore = getFirestore();

const USERS_COLLECTION = "users";
const DELIVERY_LOG_COLLECTION = "_system_registration_email_events";
const ALERT_EMAIL_TO = "jaimeespinalpr@gmail.com";
const ALERT_EMAIL_FROM = "WPL Alerts <onboarding@resend.dev>";
const INVITE_EMAIL_FROM = "United Wrestling Club <noreply@united-wc.com>";
const SHARED_COLLECTION = "shared_app";
const SHARED_USER_DIRECTORY_DOC = "global_user_directory";
const SHARED_USER_DIRECTORY_ITEMS = "items";
const COACH_WORKSPACES_COLLECTION = "coach_workspaces";
const ASSIGNMENTS_COLLECTION = "assignments";
const ASSIGNMENT_INSTANCES_COLLECTION = "assignment_instances";
const ASSIGNMENT_EVENTS_COLLECTION = "assignment_events";
const NOTIFICATIONS_COLLECTION = "notifications";
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

function normalizeDateIso(value) {
  if (!value) return "";
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return "";
    }
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") return value;
  return "";
}

function normalizeArray(values = []) {
  return uniqueStrings(values);
}

function normalizeAssignmentStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  if (raw === "in_progress" || raw === "in-progress" || raw === "progress" || raw === "review") {
    return "in_progress";
  }
  if (raw === "completed" || raw === "complete") {
    return "completed";
  }
  if (raw === "overdue") return "overdue";
  if (raw === "shared" || raw === "share" || raw === "shared_with_coach") return "shared";
  return "not_started";
}

function buildNotificationId(eventId = "", recipientUid = "", kind = "") {
  const safeEvent = slugifyKey(eventId) || "event";
  const safeRecipient = slugifyKey(recipientUid) || "user";
  const safeKind = slugifyKey(kind) || "notification";
  return `${safeKind}-${safeRecipient}-${safeEvent}`;
}

function getAssignmentAudienceFromData(data = {}) {
  const assigneeType = normalizeText(data.assigneeType).toLowerCase() || "athlete";
  const assigneeId = normalizeText(data.assigneeId || "");
  const assigneeName = normalizeText(data.assigneeName || "");
  const athleteUids = normalizeArray(data.athleteUids || []);
  const athleteIds = normalizeArray(data.athleteIds || []);
  return {
    assigneeType,
    assigneeId,
    assigneeName,
    athleteUids,
    athleteIds
  };
}

async function getLinkedParentRecipients({
  coachUid = "",
  athleteUids = [],
  athleteIds = []
} = {}) {
  const safeCoachUid = normalizeText(coachUid);
  if (!safeCoachUid) return [];
  const parentSnap = await firestore
    .collection(USERS_COLLECTION)
    .where("role", "==", "parent")
    .where("linkedCoachUid", "==", safeCoachUid)
    .where("status", "==", "verified")
    .get();

  const uidSet = new Set(normalizeArray(athleteUids));
  const idSet = new Set(normalizeArray(athleteIds));
  const recipients = [];
  parentSnap.docs.forEach((doc) => {
    const data = doc.data() || {};
    const linkedAthleteUid = normalizeText(data.linkedAthleteUid || "");
    const linkedAthleteId = normalizeText(data.linkedAthleteId || "");
    if (
      (linkedAthleteUid && uidSet.has(linkedAthleteUid))
      || (linkedAthleteId && idSet.has(linkedAthleteId))
    ) {
      recipients.push({
        uid: normalizeText(doc.id),
        name: normalizeText(data.name || data.email || "Parent"),
        role: "parent"
      });
    }
  });
  return recipients;
}

async function getAthleteRecipientsForAudience({
  coachUid = "",
  athleteUids = [],
  athleteIds = []
} = {}) {
  const safeCoachUid = normalizeText(coachUid);
  const recipientMap = new Map();
  normalizeArray(athleteUids).forEach((uid) => {
    if (!uid) return;
    recipientMap.set(uid, {
      uid,
      role: "athlete"
    });
  });

  const safeAthleteIds = normalizeArray(athleteIds);
  if (!safeCoachUid || !safeAthleteIds.length) {
    return Array.from(recipientMap.values());
  }

  for (let index = 0; index < safeAthleteIds.length; index += 10) {
    const chunk = safeAthleteIds.slice(index, index + 10);
    if (!chunk.length) continue;
    const idSet = new Set(chunk);
    const snap = await firestore
      .collection(USERS_COLLECTION)
      .where("linkedCoachUid", "==", safeCoachUid)
      .get()
      .catch(() => null);
    if (!snap) continue;
    snap.docs.forEach((doc) => {
      const data = doc.data() || {};
      if (normalizeRole(data.role) !== "athlete") return;
      const linkedAthleteId = normalizeText(data.linkedAthleteId || "");
      if (!linkedAthleteId || !idSet.has(linkedAthleteId)) return;
      const safeUid = normalizeText(doc.id);
      if (!safeUid) return;
      recipientMap.set(safeUid, {
        uid: safeUid,
        role: "athlete"
      });
    });
  }
  return Array.from(recipientMap.values());
}

async function writeAssignmentEvent({
  coachUid = "",
  eventId = "",
  assignmentId = "",
  planId = "",
  type = "",
  prevStatus = "",
  nextStatus = "",
  actorUid = "",
  actorName = ""
} = {}) {
  const workspaceRef = firestore.collection(COACH_WORKSPACES_COLLECTION).doc(coachUid);
  const eventsRef = workspaceRef.collection(ASSIGNMENT_EVENTS_COLLECTION).doc(normalizeText(eventId || `${assignmentId}-${type}`));
  await eventsRef.set({
    eventId: normalizeText(eventId || ""),
    assignmentId: normalizeText(assignmentId),
    planId: normalizeText(planId),
    type: normalizeText(type),
    prevStatus: normalizeText(prevStatus),
    nextStatus: normalizeText(nextStatus),
    actorUid: normalizeText(actorUid),
    actorName: normalizeText(actorName),
    createdAtIso: new Date().toISOString(),
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

async function writeWorkspaceNotification({
  coachUid = "",
  eventId = "",
  kind = "",
  recipientUid = "",
  recipientRole = "",
  assignmentId = "",
  planId = "",
  title = "",
  body = "",
  actorUid = "",
  actorName = "",
  dueDateKey = ""
} = {}) {
  const safeCoachUid = normalizeText(coachUid);
  const safeRecipientUid = normalizeText(recipientUid);
  if (!safeCoachUid || !safeRecipientUid) return;
  const notificationId = buildNotificationId(eventId, safeRecipientUid, kind);
  const workspaceRef = firestore.collection(COACH_WORKSPACES_COLLECTION).doc(safeCoachUid);
  await workspaceRef.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).set({
    id: notificationId,
    kind: normalizeText(kind),
    recipientUids: [safeRecipientUid],
    recipientRoles: [normalizeText(recipientRole)],
    readByUids: [],
    assignmentId: normalizeText(assignmentId),
    planId: normalizeText(planId),
    dueDateKey: normalizeText(dueDateKey),
    title: normalizeText(title),
    body: normalizeText(body),
    actorUid: normalizeText(actorUid),
    actorName: normalizeText(actorName),
    createdAtIso: new Date().toISOString(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
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

function buildSharedUserDirectoryEntry(user = {}) {
  const uid = normalizeText(user.uid || "");
  if (!uid) return null;
  const role = normalizeRole(user.role);
  const name = normalizeText(user.name || user.athleteName || user.email || "");
  const email = normalizeEmail(user.email || "");
  const status = role === "parent" ? normalizeText(user.status || "pending_verification") : "";
  const view = normalizeText(user.view || (
    role === "coach" || role === "admin" ? "coach" : role === "parent" ? "parent" : "athlete"
  ));
  return {
    uid,
    name,
    email,
    role,
    view,
    status,
    athleteName: normalizeText(user.athleteName || user.linkedAthleteName || ""),
    linkedAthleteId: normalizeText(user.linkedAthleteId || ""),
    linkedAthleteUid: normalizeText(user.linkedAthleteUid || ""),
    linkedCoachUid: normalizeText(user.linkedCoachUid || ""),
    linkedCoachName: normalizeText(user.linkedCoachName || ""),
    linkedCoachEmail: normalizeEmail(user.linkedCoachEmail || ""),
    createdAt: user.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
}

async function syncSharedUserDirectory(allUsers = [], { deletedUid = "" } = {}) {
  const directoryRef = firestore
    .collection(SHARED_COLLECTION)
    .doc(SHARED_USER_DIRECTORY_DOC)
    .collection(SHARED_USER_DIRECTORY_ITEMS);

  let batch = firestore.batch();
  let writes = 0;
  const flush = async () => {
    if (!writes) return;
    await batch.commit();
    batch = firestore.batch();
    writes = 0;
  };

  for (const user of allUsers) {
    const payload = buildSharedUserDirectoryEntry(user);
    if (!payload || !payload.uid) continue;
    batch.set(directoryRef.doc(payload.uid), payload, { merge: true });
    writes += 1;
    if (writes >= 420) {
      await flush();
    }
  }

  const safeDeletedUid = normalizeText(deletedUid);
  if (safeDeletedUid) {
    batch.delete(directoryRef.doc(safeDeletedUid));
    writes += 1;
  }

  await flush();
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

async function syncUserRegistrationState(snapshot, triggerUserId = "") {
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

  await syncSharedUserDirectory(allUsers, {
    deletedUid: snapshot?.exists ? "" : triggerUserId
  });
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

async function sendInviteWithResend(apiKey, {
  toEmail = "",
  coachName = "",
  appUrl = "",
  lang = "en"
} = {}) {
  const inviteLink = normalizeText(appUrl || "");
  const safeCoach = normalizeText(coachName || "United Wrestling Club Coach");
  const safeLang = normalizeText(lang).toLowerCase() === "es" ? "es" : "en";
  const subject = safeLang === "es"
    ? "Invitacion a Wrestling Performance Lab"
    : "Invitation to Wrestling Performance Lab";
  const text = safeLang === "es"
    ? `Hola,\n\n${safeCoach} te invita a registrarte en Wrestling Performance Lab para recibir entrenamientos y mensajes.\n\nRegistrate aqui:\n${inviteLink}\n\nCuando abras la pagina, selecciona "Create account" y elige el rol de atleta.\n\nNos vemos en el mat!`
    : `Hi,\n\n${safeCoach} invited you to join Wrestling Performance Lab to receive training plans and coach messaging.\n\nRegister here:\n${inviteLink}\n\nWhen you open the page, choose "Create account" and select the athlete role.\n\nSee you on the mat!`;
  const html = safeLang === "es"
    ? [
        `<p>Hola,</p>`,
        `<p><strong>${safeCoach}</strong> te invita a registrarte en Wrestling Performance Lab para recibir entrenamientos y mensajes.</p>`,
        `<p><a href="${inviteLink}">Registrate aqui</a></p>`,
        `<p>Cuando abras la pagina, selecciona <strong>Create account</strong> y elige el rol de atleta.</p>`,
        `<p>Nos vemos en el mat!</p>`
      ].join("")
    : [
        `<p>Hi,</p>`,
        `<p><strong>${safeCoach}</strong> invited you to join Wrestling Performance Lab to receive training plans and coach messaging.</p>`,
        `<p><a href="${inviteLink}">Register here</a></p>`,
        `<p>When you open the page, choose <strong>Create account</strong> and select the athlete role.</p>`,
        `<p>See you on the mat!</p>`
      ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: INVITE_EMAIL_FROM,
      to: [toEmail],
      subject,
      text,
      html
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

exports.sendInviteEmail = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const authHeader = String(req.headers.authorization || "").trim();
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!idToken) {
    res.status(401).json({ error: "missing_auth_token" });
    return;
  }

  let decodedToken = null;
  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    logger.warn("Invalid invite auth token", { message: err?.message || String(err) });
    res.status(401).json({ error: "invalid_auth_token" });
    return;
  }

  const senderUid = normalizeText(decodedToken?.uid);
  const senderSnap = senderUid
    ? await firestore.collection(USERS_COLLECTION).doc(senderUid).get()
    : null;
  const senderData = senderSnap?.exists ? (senderSnap.data() || {}) : {};
  const senderRole = normalizeRole(senderData.role || decodedToken?.role || "");
  if (!(senderRole === "coach" || senderRole === "admin")) {
    res.status(403).json({ error: "invite_not_allowed" });
    return;
  }

  const toEmail = normalizeEmail(req.body?.toEmail || "");
  const coachName = normalizeText(req.body?.coachName || senderData.name || senderData.email || "United Wrestling Club Coach");
  const appUrl = normalizeText(req.body?.appUrl || "");
  const lang = normalizeText(req.body?.lang || "en");
  if (!isValidEmail(toEmail) || !appUrl) {
    res.status(400).json({ error: "invalid_invite_payload" });
    return;
  }

  const apiKey = normalizeText(process.env.RESEND_API_KEY);
  if (!apiKey) {
    res.status(500).json({ error: "missing_resend_api_key" });
    return;
  }

  try {
    const result = await sendInviteWithResend(apiKey, {
      toEmail,
      coachName,
      appUrl,
      lang
    });
    res.status(200).json({ ok: true, id: String(result?.id || "") });
  } catch (err) {
    logger.error("Invite email send failed", {
      senderUid,
      toEmail,
      status: err?.status || null,
      message: err?.message || String(err),
      payload: err?.payload || null
    });
    res.status(502).json({
      error: "invite_send_failed",
      message: String(err?.message || "Could not send invite email.")
    });
  }
});

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
  const triggerUserId = normalizeText(event.params.userId || snapshot?.id || "");
  try {
    await syncUserRegistrationState(snapshot, triggerUserId);
    logger.info("Registration sync completed", {
      userId: triggerUserId,
      exists: Boolean(snapshot?.exists)
    });
  } catch (err) {
    logger.error("Registration sync failed", {
      userId: triggerUserId,
      message: err?.message || String(err)
    });
    throw err;
  }
});

exports.syncAssignmentLifecycle = onDocumentWritten({
  document: `${COACH_WORKSPACES_COLLECTION}/{coachUid}/${ASSIGNMENTS_COLLECTION}/{assignmentId}`,
  region: "us-central1"
}, async (event) => {
  const coachUid = normalizeText(event.params.coachUid || "");
  const assignmentId = normalizeText(event.params.assignmentId || "");
  if (!coachUid || !assignmentId) return;

  const beforeSnap = event.data?.before || null;
  const afterSnap = event.data?.after || null;
  const beforeExists = Boolean(beforeSnap?.exists);
  const afterExists = Boolean(afterSnap?.exists);
  const beforeData = beforeExists ? (beforeSnap.data() || {}) : {};
  const afterData = afterExists ? (afterSnap.data() || {}) : {};
  const workspaceRef = firestore.collection(COACH_WORKSPACES_COLLECTION).doc(coachUid);

  if (!afterExists) {
    await workspaceRef.collection(ASSIGNMENT_INSTANCES_COLLECTION).doc(assignmentId).delete().catch(() => {});
    await writeAssignmentEvent({
      coachUid,
      eventId: event.id,
      assignmentId,
      planId: normalizeText(beforeData.planId || ""),
      type: "deleted",
      prevStatus: normalizeAssignmentStatus(beforeData.status),
      nextStatus: "",
      actorUid: normalizeText(beforeData.athleteLogUid || ""),
      actorName: normalizeText(beforeData.athleteLogName || "")
    });
    return;
  }

  const status = normalizeAssignmentStatus(afterData.status);
  const prevStatus = normalizeAssignmentStatus(beforeData.status);
  const audience = getAssignmentAudienceFromData(afterData);
  const actorUid = normalizeText(afterData.athleteLogUid || afterData.updatedByUid || afterData.authorUid || "");
  const actorName = normalizeText(afterData.athleteLogName || afterData.updatedByName || afterData.authorName || "");
  const createdAtIso = normalizeDateIso(afterData.createdAt) || new Date().toISOString();
  const updatedAtIso = normalizeDateIso(afterData.updatedAt) || new Date().toISOString();

  const instancePayload = {
    assignmentId,
    planId: normalizeText(afterData.planId || ""),
    title: normalizeText(afterData.title || ""),
    type: normalizeText(afterData.type || ""),
    status,
    assigneeType: audience.assigneeType,
    assigneeId: audience.assigneeId,
    assigneeName: audience.assigneeName,
    athleteUids: audience.athleteUids,
    athleteIds: audience.athleteIds,
    startDateKey: normalizeText(afterData.startDateKey || ""),
    endDateKey: normalizeText(afterData.endDateKey || ""),
    dueDateKey: normalizeText(afterData.dueDateKey || ""),
    dueLabel: normalizeText(afterData.dueLabel || ""),
    note: normalizeText(afterData.note || ""),
    source: normalizeText(afterData.source || ""),
    trainingTrack: normalizeText(afterData.trainingTrack || ""),
    mediaAssetId: normalizeText(afterData.mediaAssetId || ""),
    mediaId: normalizeText(afterData.mediaId || ""),
    mediaAssetPath: normalizeText(afterData.mediaAssetPath || ""),
    mediaAssetStoragePath: normalizeText(afterData.mediaAssetStoragePath || ""),
    mediaThumbnailPath: normalizeText(afterData.mediaThumbnailPath || ""),
    mediaThumbnailStoragePath: normalizeText(afterData.mediaThumbnailStoragePath || ""),
    completionResultType: normalizeText(afterData.completionResultType || ""),
    completionResultScore: Number.isFinite(Number(afterData.completionResultScore))
      ? Number(afterData.completionResultScore)
      : null,
    completionResultReactionMs: Number.isFinite(Number(afterData.completionResultReactionMs))
      ? Number(afterData.completionResultReactionMs)
      : null,
    completionResultAccuracy: Number.isFinite(Number(afterData.completionResultAccuracy))
      ? Number(afterData.completionResultAccuracy)
      : null,
    actorUid,
    actorName,
    createdAtIso,
    updatedAtIso,
    syncedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  if (beforeExists) {
    delete instancePayload.createdAt;
  }
  await workspaceRef.collection(ASSIGNMENT_INSTANCES_COLLECTION).doc(assignmentId).set(instancePayload, { merge: true });

  const eventType = !beforeExists
    ? "created"
    : (status !== prevStatus ? "status_changed" : "updated");
  await writeAssignmentEvent({
    coachUid,
    eventId: event.id,
    assignmentId,
    planId: normalizeText(afterData.planId || ""),
    type: eventType,
    prevStatus,
    nextStatus: status,
    actorUid,
    actorName
  });

  if (!beforeExists) {
    const assignmentTitle = normalizeText(afterData.title || "Assignment");
    const dueDateKey = normalizeText(afterData.dueDateKey || "");
    const athleteRecipients = await getAthleteRecipientsForAudience({
      coachUid,
      athleteUids: audience.athleteUids,
      athleteIds: audience.athleteIds
    });
    for (const athlete of athleteRecipients) {
      const athleteUid = normalizeText(athlete.uid);
      if (!athleteUid) continue;
      await writeWorkspaceNotification({
        coachUid,
        eventId: `${event.id}-athlete-${athleteUid}`,
        kind: "assignment_assigned",
        recipientUid: athleteUid,
        recipientRole: athlete.role || "athlete",
        assignmentId,
        planId: normalizeText(afterData.planId || ""),
        title: assignmentTitle,
        body: dueDateKey
          ? `New assignment scheduled for ${dueDateKey}.`
          : "New assignment scheduled.",
        actorUid: coachUid,
        actorName: normalizeText(afterData.createdBy || "")
      });
    }

    const linkedParents = await getLinkedParentRecipients({
      coachUid,
      athleteUids: athleteRecipients.map((entry) => entry.uid),
      athleteIds: audience.athleteIds
    });
    for (const parent of linkedParents) {
      await writeWorkspaceNotification({
        coachUid,
        eventId: `${event.id}-parent-${parent.uid}`,
        kind: "assignment_assigned_parent",
        recipientUid: parent.uid,
        recipientRole: "parent",
        assignmentId,
        planId: normalizeText(afterData.planId || ""),
        title: assignmentTitle,
        body: dueDateKey
          ? `New athlete assignment scheduled for ${dueDateKey}.`
          : "New athlete assignment scheduled.",
        actorUid: coachUid,
        actorName: normalizeText(afterData.createdBy || "")
      });
    }
  }

  if (status === "completed" && prevStatus !== "completed") {
    await writeWorkspaceNotification({
      coachUid,
      eventId: `${event.id}-coach-completed`,
      kind: "assignment_completed",
      recipientUid: coachUid,
      recipientRole: "coach",
      assignmentId,
      planId: normalizeText(afterData.planId || ""),
      title: normalizeText(afterData.title || "Assignment completed"),
      body: normalizeText(afterData.completionResultSummary || "An athlete completed this assignment."),
      actorUid,
      actorName
    });
  }
});
