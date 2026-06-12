async function loadEmbeddedLogo() {
  const logoEl = document.querySelector('[data-logo]');
  if (!logoEl) return;
  try {
    const res = await fetch(logoEl.dataset.logo);
    const b64 = (await res.text()).trim();
    const src = `data:image/jpeg;base64,${b64}`;
    logoEl.src = src;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = src;
  } catch (err) {
    console.warn('Logo could not be loaded', err);
  }
}
loadEmbeddedLogo();

let questions = [];
let currentIndex = 0;
const answers = new Map();

const $ = (id) => document.getElementById(id);
const introPanel = $('introPanel');
const questionPanel = $('questionPanel');
const reviewPanel = $('reviewPanel');
const startBtn = $('startBtn');
const questionTitle = $('questionTitle');
const progressText = $('progressText');
const progressFill = $('progressFill');
const progressPercent = $('progressPercent');
const optionsWrap = $('optionsWrap');
const customAnswer = $('customAnswer');
const useCustomBtn = $('useCustomBtn');
const backBtn = $('backBtn');
const nextBtn = $('nextBtn');
const reviewList = $('reviewList');
const reviewCount = $('reviewCount');
const submitBtn = $('submitBtn');
const editLastBtn = $('editLastBtn');
const downloadBtn = $('downloadBtn');
const statusMessage = $('statusMessage');

async function init() {
  try {
    const res = await fetch('data/questions.json');
    questions = await res.json();
  } catch (err) {
    showStatus('No se pudo cargar el cuestionario. Abre esta app desde el servidor incluido: npm start.', 'error');
  }
}

function getRespondent() {
  return {
    name: $('respondentName').value.trim(),
    email: $('respondentEmail').value.trim(),
    phone: $('respondentPhone').value.trim()
  };
}

function showPanel(panel) {
  introPanel.classList.add('hidden');
  questionPanel.classList.add('hidden');
  reviewPanel.classList.add('hidden');
  panel.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion() {
  const q = questions[currentIndex];
  const stored = answers.get(q.id);
  const answeredCount = answers.size;
  const pct = Math.round((answeredCount / questions.length) * 100);

  progressText.textContent = `Pregunta ${currentIndex + 1} de ${questions.length}`;
  progressPercent.textContent = `${pct}%`;
  progressFill.style.width = `${pct}%`;
  questionTitle.textContent = q.question;
  customAnswer.value = stored?.type === 'custom' ? stored.answer : '';

  optionsWrap.innerHTML = '';
  Object.entries(q.options).forEach(([letter, text]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    if (stored?.type === 'option' && stored.selected === letter) btn.classList.add('selected');
    btn.innerHTML = `<span class="option-letter">${letter}</span><span class="option-text">${escapeHtml(text)}</span>`;
    btn.addEventListener('click', () => {
      answers.set(q.id, { id: q.id, question: q.question, selected: letter, answer: text, type: 'option' });
      renderQuestion();
      setTimeout(() => goNext(), 120);
    });
    optionsWrap.appendChild(btn);
  });

  backBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === questions.length - 1 ? 'Revisar' : 'Siguiente';
}

function goNext() {
  const q = questions[currentIndex];
  if (!answers.has(q.id)) {
    showInlineNotice('Escoge una opción o escribe tu propia respuesta antes de seguir.');
    return;
  }
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else {
    renderReview();
    showPanel(reviewPanel);
  }
}

function goBack() {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
  }
}

function useCustomAnswer() {
  const q = questions[currentIndex];
  const value = customAnswer.value.trim();
  if (!value) {
    showInlineNotice('Escribe tu respuesta personalizada primero.');
    return;
  }
  answers.set(q.id, { id: q.id, question: q.question, selected: 'Otra', answer: value, type: 'custom' });
  renderQuestion();
  setTimeout(() => goNext(), 120);
}

function renderReview() {
  const items = questions.map(q => answers.get(q.id)).filter(Boolean);
  reviewCount.textContent = `${items.length}/${questions.length}`;
  reviewList.innerHTML = items.map(item => `
    <article class="review-item">
      <div class="review-question"><span class="badge">${item.id}</span>${escapeHtml(item.question)}</div>
      <div class="review-answer"><strong>Respuesta:</strong> ${item.selected !== 'Otra' ? `<strong>${item.selected})</strong> ` : ''}${escapeHtml(item.answer)}</div>
    </article>
  `).join('');
}

function buildPayload() {
  return {
    respondent: getRespondent(),
    answers: questions.map(q => answers.get(q.id)).filter(Boolean),
    submittedAt: new Date().toISOString(),
    source: 'Ghetty Motor Home Web Questionnaire'
  };
}

async function submitAnswers() {
  if (answers.size !== questions.length) {
    showStatus('Faltan respuestas. Regresa y completa todas las preguntas.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  showStatus('Enviando respuestas por email...', '');

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || 'No se pudo enviar el email.';
      showStatus(msg, 'error');
      return;
    }
    showStatus('Listo. Las respuestas fueron enviadas por email.', 'success');
  } catch (err) {
    showStatus('No se pudo conectar con el servidor. Corre la app con npm start para enviar emails automáticamente.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar por email';
  }
}

function downloadTextCopy() {
  const payload = buildPayload();
  const lines = [];
  lines.push('Ghetty Motor Home - Respuestas del cuestionario');
  lines.push(`Fecha: ${new Date().toLocaleString()}`);
  if (payload.respondent.name || payload.respondent.email || payload.respondent.phone) {
    lines.push('');
    lines.push('Datos de quien llenó:');
    if (payload.respondent.name) lines.push(`Nombre: ${payload.respondent.name}`);
    if (payload.respondent.email) lines.push(`Email: ${payload.respondent.email}`);
    if (payload.respondent.phone) lines.push(`Teléfono: ${payload.respondent.phone}`);
  }
  lines.push('');
  lines.push('Preguntas y respuestas:');
  payload.answers.forEach(item => {
    lines.push('');
    lines.push(`${item.id}. ${item.question}`);
    lines.push(`Respuesta: ${item.selected !== 'Otra' ? `${item.selected}) ` : ''}${item.answer}`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ghetty-motorhome-respuestas-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showInlineNotice(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message show error';
  setTimeout(() => {
    statusMessage.className = 'status-message';
    statusMessage.textContent = '';
  }, 2400);
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type || ''}`.trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

startBtn.addEventListener('click', () => {
  if (!questions.length) return;
  currentIndex = 0;
  showPanel(questionPanel);
  renderQuestion();
});

backBtn.addEventListener('click', goBack);
nextBtn.addEventListener('click', goNext);
useCustomBtn.addEventListener('click', useCustomAnswer);
editLastBtn.addEventListener('click', () => { showPanel(questionPanel); renderQuestion(); });
downloadBtn.addEventListener('click', downloadTextCopy);
submitBtn.addEventListener('click', submitAnswers);

init();
