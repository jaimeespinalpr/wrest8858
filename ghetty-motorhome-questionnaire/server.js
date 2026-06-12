require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const QUESTIONS = require('./public/data/questions.json');
const SUBMISSIONS_DIR = path.join(__dirname, 'submissions');
fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
const clean = v => String(v || '').replace(/[<>]/g, '').trim();
const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
function normalized(rawAnswers = []) {
  const byId = new Map(rawAnswers.map(item => [Number(item.id), item]));
  return QUESTIONS.map(q => {
    const raw = byId.get(q.id) || {};
    return { id: q.id, question: q.question, selected: clean(raw.selected) || 'Sin selección', answer: clean(raw.answer) || 'Sin respuesta' };
  });
}
function emailContent(payload) {
  const r = payload.respondent || {};
  const when = new Date(payload.submittedAt || Date.now()).toLocaleString('es-US', { timeZone: process.env.DISPLAY_TIMEZONE || 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
  const info = [clean(r.name) ? `Nombre: ${clean(r.name)}` : null, clean(r.email) ? `Email: ${clean(r.email)}` : null, clean(r.phone) ? `Teléfono: ${clean(r.phone)}` : null, `Fecha: ${when}`].filter(Boolean);
  const answers = normalized(payload.answers);
  const text = ['Ghetty Motor Home - Nuevo cuestionario contestado', '', ...info, '', 'Preguntas y respuestas:', ...answers.flatMap(x => ['', `${x.id}. ${x.question}`, `Respuesta: ${x.selected !== 'Otra' && x.selected !== 'Sin selección' ? `${x.selected}) ` : ''}${x.answer}`])].join('\n');
  const rows = answers.map(x => `<tr><td style="vertical-align:top;padding:12px;border-bottom:1px solid #e5eef5;color:#053c60;font-weight:800;">${x.id}</td><td style="padding:12px;border-bottom:1px solid #e5eef5;"><strong>${esc(x.question)}</strong><br><span><strong>Respuesta:</strong> ${x.selected !== 'Otra' && x.selected !== 'Sin selección' ? `<strong>${esc(x.selected)})</strong> ` : ''}${esc(x.answer)}</span></td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;background:#fff9ef;padding:24px;color:#17324d;"><div style="max-width:760px;margin:auto;background:white;border-radius:20px;overflow:hidden;"><div style="background:#053c60;color:white;padding:22px;"><h1 style="margin:0;">Ghetty Motor Home</h1><p>Nuevo cuestionario contestado</p></div><div style="padding:22px;"><h2 style="color:#e43b38;">Datos</h2><p>${info.map(esc).join('<br>')}</p><h2 style="color:#e43b38;">Preguntas y respuestas</h2><table style="width:100%;border-collapse:collapse;">${rows}</table></div></div></div>`;
  return { text, html };
}
function smtpReady() { return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.EMAIL_TO && process.env['SMTP_' + 'PASS']); }
app.post('/api/submit', async (req, res) => {
  const payload = req.body || {};
  const content = emailContent(payload);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(SUBMISSIONS_DIR, `${stamp}.json`), JSON.stringify({ payload, emailPreview: content.text }, null, 2));
  if (!smtpReady()) return res.status(503).json({ ok: false, message: 'Falta configurar SMTP en las variables de entorno para enviar email automáticamente.' });
  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true', auth: { user: process.env.SMTP_USER, pass: process.env['SMTP_' + 'PASS'] } });
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: process.env.EMAIL_TO, replyTo: clean(payload?.respondent?.email) || undefined, subject: `Nuevo cuestionario Ghetty Motor Home - ${clean(payload?.respondent?.name) || 'Sin nombre'}`, text: content.text, html: content.html });
    res.json({ ok: true, message: 'Email enviado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Las respuestas se guardaron, pero el email no pudo enviarse. Revisa SMTP.' });
  }
});
app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Ghetty Motor Home questionnaire running on port ${PORT}`));
