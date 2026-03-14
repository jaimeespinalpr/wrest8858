"use strict";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

initializeApp();

const firestore = getFirestore();
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const USERS_COLLECTION = "users";
const DELIVERY_LOG_COLLECTION = "_system_registration_email_events";
const ALERT_EMAIL_TO = "jaimeespinalpr@gmail.com";
const ALERT_EMAIL_FROM = "WPL Alerts <onboarding@resend.dev>";

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
  region: "us-central1",
  secrets: [RESEND_API_KEY]
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

  const apiKey = RESEND_API_KEY.value();
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
