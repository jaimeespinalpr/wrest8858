// ---------- MESSAGES ----------
const messageList = document.getElementById("messageList");
const messagesCoachList = document.getElementById("messagesCoachList");
const messagesPanelTitle = document.getElementById("messagesPanelTitle");
const messagesPanelSubtitle = document.getElementById("messagesPanelSubtitle");
const messagesPanelChip = document.getElementById("messagesPanelChip");
const messagesWorkspaceNav = document.getElementById("messagesWorkspaceNav");
const messagesModeChatsBtn = document.getElementById("messagesModeChatsBtn");
const messagesModeCallsBtn = document.getElementById("messagesModeCallsBtn");
const messagesModeContactsBtn = document.getElementById("messagesModeContactsBtn");
const messagesModeShareBtn = document.getElementById("messagesModeShareBtn");
const messagesShell = document.getElementById("messagesShell");
const messagesChatsPanel = document.getElementById("messagesChatsPanel");
const messagesCallsPanel = document.getElementById("messagesCallsPanel");
const messagesContactsPanel = document.getElementById("messagesContactsPanel");
const messagesSharePanel = document.getElementById("messagesSharePanel");
const messagesSidebarTitle = document.getElementById("messagesSidebarTitle");
const messagesSidebarHint = document.getElementById("messagesSidebarHint");
const messagesOpenContactsBtn = document.getElementById("messagesOpenContactsBtn");
const messagesSearchInput = document.getElementById("messagesSearchInput");
const messagesFilterTabs = document.getElementById("messagesFilterTabs");
const messagesFilterAllBtn = document.getElementById("messagesFilterAllBtn");
const messagesFilterAthletesBtn = document.getElementById("messagesFilterAthletesBtn");
const messagesFilterParentsBtn = document.getElementById("messagesFilterParentsBtn");
const messagesEmptyState = document.getElementById("messagesEmptyState");
const messagesEmptyTitle = document.getElementById("messagesEmptyTitle");
const messagesEmptyBody = document.getElementById("messagesEmptyBody");
const messagesThreadView = document.getElementById("messagesThreadView");
const messagesThreadTitle = document.getElementById("messagesThreadTitle");
const messagesThreadAvatar = document.getElementById("messagesThreadAvatar");
const messagesThreadMeta = document.getElementById("messagesThreadMeta");
const messagesThreadBadge = document.getElementById("messagesThreadBadge");
const messagesBackToChatsBtn = document.getElementById("messagesBackToChatsBtn");
const messagesShareProgressBtn = document.getElementById("messagesShareProgressBtn");
const messagesThreadVoiceBtn = document.getElementById("messagesThreadVoiceBtn");
const messagesThreadVideoBtn = document.getElementById("messagesThreadVideoBtn");
const messagesThreadMoreBtn = document.getElementById("messagesThreadMoreBtn");
const messagesStatus = document.getElementById("messagesStatus");
const messagesTypingIndicator = document.getElementById("messagesTypingIndicator");
const messagesFeed = document.getElementById("messagesFeed");
const messageComposer = document.getElementById("messageComposer");
const messageComposerLabel = document.getElementById("messageComposerLabel");
const messageComposerInput = document.getElementById("messageComposerInput");
const messageSendBtn = document.getElementById("messageSendBtn");
const messageRecordVoiceBtn = document.getElementById("messageRecordVoiceBtn");
const messageVoiceStatus = document.getElementById("messageVoiceStatus");
const messageComposerFilesInput = document.getElementById("messageComposerFiles");
const messageComposerFilesLabel = document.getElementById("messageComposerFilesLabel");
const messageComposerFilesList = document.getElementById("messageComposerFilesList");
const messageComposerFilesClearBtn = document.getElementById("messageComposerFilesClearBtn");
const messageComposerTagsLabel = document.getElementById("messageComposerTagsLabel");
const messageComposerTagsInput = document.getElementById("messageComposerTags");
const messagesCallsTitle = document.getElementById("messagesCallsTitle");
const messagesCallsHint = document.getElementById("messagesCallsHint");
const messagesCallContactLabel = document.getElementById("messagesCallContactLabel");
const messagesCallContactSelect = document.getElementById("messagesCallContactSelect");
const messagesCallVoiceBtn = document.getElementById("messagesCallVoiceBtn");
const messagesCallVideoBtn = document.getElementById("messagesCallVideoBtn");
const messagesCallsStatus = document.getElementById("messagesCallsStatus");
const messagesCallsLogTitle = document.getElementById("messagesCallsLogTitle");
const messagesCallsLog = document.getElementById("messagesCallsLog");
const messagesContactsTitle = document.getElementById("messagesContactsTitle");
const messagesContactsHint = document.getElementById("messagesContactsHint");
const messagesContactsDirectory = document.getElementById("messagesContactsDirectory");
const messagesShareTitle = document.getElementById("messagesShareTitle");
const messagesShareHint = document.getElementById("messagesShareHint");
const messagesShareUrlLabel = document.getElementById("messagesShareUrlLabel");
const messagesShareUrlInput = document.getElementById("messagesShareUrl");
const messagesShareStatus = document.getElementById("messagesShareStatus");
const messagesShareActionsTitle = document.getElementById("messagesShareActionsTitle");
const messagesShareNativeBtn = document.getElementById("messagesShareNativeBtn");
const messagesShareFacebookBtn = document.getElementById("messagesShareFacebookBtn");
const messagesShareInstagramBtn = document.getElementById("messagesShareInstagramBtn");
const messagesShareTiktokBtn = document.getElementById("messagesShareTiktokBtn");
const messagesShareYoutubeBtn = document.getElementById("messagesShareYoutubeBtn");
const messagesShareHelp = document.getElementById("messagesShareHelp");

const MESSAGES_COPY = {
  title: { en: "Messages", es: "Mensajes" },
  subtitle: {
    en: "Team chat plus direct messaging between coaches, athletes, and parents.",
    es: "Chat del equipo y mensajeria directa entre coaches, atletas y padres."
  },
  chip: { en: "Team + direct chats", es: "Equipo + chats directos" },
  workspaceChats: { en: "Chats", es: "Chats" },
  workspaceCalls: { en: "Calls", es: "Llamadas" },
  workspaceContacts: { en: "Contacts", es: "Contactos" },
  workspaceShare: { en: "Share", es: "Compartir" },
  backToChats: { en: "Back", es: "Volver" },
  shareProgressBtn: { en: "Share progress", es: "Compartir progreso" },
  threadVoiceBtn: { en: "Call", es: "Llamar" },
  threadVideoBtn: { en: "Video", es: "Video" },
  threadMoreBtn: { en: "More", es: "Mas" },
  filtersAll: { en: "All", es: "Todos" },
  filtersAthletes: { en: "Athletes", es: "Atletas" },
  filtersParents: { en: "Parents", es: "Padres" },
  sidebarTitle: { en: "Chats", es: "Chats" },
  sidebarTitleCoach: { en: "Chats", es: "Chats" },
  sidebarTitleAthlete: { en: "Chats", es: "Chats" },
  sidebarTitleParent: { en: "Chats", es: "Chats" },
  sidebarHintCoach: {
    en: "Open chats already started. Use Contacts to start a new one.",
    es: "Abre chats ya iniciados. Usa Contactos para comenzar uno nuevo."
  },
  sidebarHintAthlete: {
    en: "Open chats already started. Use Contacts to start a new one.",
    es: "Abre chats ya iniciados. Usa Contactos para comenzar uno nuevo."
  },
  sidebarHintParent: {
    en: "Open chats already started. Use New chat to contact your coach team.",
    es: "Abre chats ya iniciados. Usa Nuevo chat para contactar al equipo de coaches."
  },
  openContactsBtn: { en: "New chat", es: "Nuevo chat" },
  searchPlaceholder: { en: "Search chats", es: "Buscar chats" },
  coachesSection: { en: "Coaches", es: "Coaches" },
  athletesSection: { en: "Athletes", es: "Atletas" },
  parentsSection: { en: "Parents", es: "Padres" },
  emptyTitle: { en: "No conversation selected", es: "No hay una conversacion seleccionada" },
  emptyBodyCoach: {
    en: "Choose a contact from the left column to open a direct thread.",
    es: "Selecciona un contacto en la columna izquierda para abrir un chat directo."
  },
  emptyBodyAthlete: {
    en: "Choose a coach or athlete from the left column to open a direct thread.",
    es: "Selecciona a un coach o atleta en la columna izquierda para abrir un chat directo."
  },
  emptyBodyParent: {
    en: "Choose a coach from the left column to open a direct thread.",
    es: "Selecciona un coach en la columna izquierda para abrir un chat directo."
  },
  emptyBodyAuth: {
    en: "Sign in to load your direct messages.",
    es: "Inicia sesion para cargar tus mensajes directos."
  },
  emptyBodyNoContacts: {
    en: "No eligible contacts are available yet.",
    es: "Todavia no hay contactos disponibles."
  },
  composerLabel: { en: "Message", es: "Mensaje" },
  composerPlaceholder: { en: "Write your message here", es: "Escribe tu mensaje aqui" },
  composerFilesLabel: { en: "Attach photo/video/audio", es: "Adjuntar foto/video/audio" },
  composerTagsLabel: { en: "Tags", es: "Tags" },
  composerTagsPlaceholder: { en: "takedown, finals, opponent tendencies", es: "takedown, finales, tendencias del rival" },
  clearMedia: { en: "Clear media", es: "Limpiar media" },
  send: { en: "Send message", es: "Enviar mensaje" },
  sending: { en: "Sending...", es: "Enviando..." },
  sendingMedia: { en: "Uploading media...", es: "Subiendo media..." },
  loading: { en: "Loading conversations...", es: "Cargando conversaciones..." },
  loadingFeed: { en: "Loading thread...", es: "Cargando chat..." },
  loadError: {
    en: "Could not load messages. Check Firebase rules and auth.",
    es: "No se pudieron cargar los mensajes. Revisa reglas de Firebase y autenticacion."
  },
  loadPendingAuth: {
    en: "Messages are waiting for the Firebase session to finish loading.",
    es: "Los mensajes estan esperando que termine de cargar la sesion de Firebase."
  },
  loadPermissionDenied: {
    en: "Messages are not available for this account yet. Check linked permissions or sign in again.",
    es: "Los mensajes todavia no estan disponibles para esta cuenta. Revisa permisos vinculados o inicia sesion de nuevo."
  },
  sendError: {
    en: "Could not send this message.",
    es: "No se pudo enviar este mensaje."
  },
  deleteMessageBtn: { en: "Delete", es: "Borrar" },
  deleteThreadNoSelection: {
    en: "Select a chat first.",
    es: "Selecciona un chat primero."
  },
  deleteThreadConfirmGeneric: {
    en: "Delete this chat and all messages for everyone?",
    es: "Borrar este chat y todos los mensajes para todos?"
  },
  deleteThreadConfirmWithName: {
    en: "Delete chat with {name} and all messages for everyone?",
    es: "Borrar el chat con {name} y todos los mensajes para todos?"
  },
  deletingThread: { en: "Deleting chat...", es: "Borrando chat..." },
  deletedThread: { en: "Chat deleted.", es: "Chat borrado." },
  deleteThreadError: {
    en: "Could not delete this chat.",
    es: "No se pudo borrar este chat."
  },
  deletePermissionDenied: {
    en: "You do not have permission to delete this item.",
    es: "No tienes permiso para borrar este elemento."
  },
  deleteMessageConfirm: {
    en: "Delete this message for everyone?",
    es: "Borrar este mensaje para todos?"
  },
  deleteAllOwnMessagesConfirm: {
    en: "Delete all messages in this chat?",
    es: "Borrar todos los mensajes en este chat?"
  },
  deletingMessage: { en: "Deleting message...", es: "Borrando mensaje..." },
  deletingMessages: { en: "Deleting messages...", es: "Borrando mensajes..." },
  deleteMessageSuccess: { en: "Message deleted.", es: "Mensaje borrado." },
  deleteMessagesSuccess: { en: "Messages deleted.", es: "Mensajes borrados." },
  deleteMessageError: {
    en: "Could not delete this message.",
    es: "No se pudo borrar este mensaje."
  },
  deleteMessagesError: {
    en: "Could not delete these messages.",
    es: "No se pudieron borrar estos mensajes."
  },
  deleteNoOwnedMessages: {
    en: "There are no messages to delete in this chat.",
    es: "No hay mensajes para borrar en este chat."
  },
  deleteNotAllowed: {
    en: "You cannot delete this message.",
    es: "No puedes borrar este mensaje."
  },
  deleteMenuAction: {
    en: "Delete chat messages",
    es: "Borrar mensajes del chat"
  },
  sentToast: { en: "Message sent.", es: "Mensaje enviado." },
  readReceiptSeen: { en: "Seen", es: "Leido" },
  readReceiptSent: { en: "Sent", es: "Enviado" },
  typingLabel: { en: "typing", es: "escribiendo" },
  voiceRecordStart: { en: "Record voice", es: "Grabar voz" },
  voiceRecordStop: { en: "Stop recording", es: "Detener grabacion" },
  voiceRecordingNow: { en: "Recording voice message...", es: "Grabando mensaje de voz..." },
  voiceUploading: { en: "Uploading voice message...", es: "Subiendo mensaje de voz..." },
  voiceReady: { en: "Voice message sent.", es: "Mensaje de voz enviado." },
  voiceUnsupported: {
    en: "Voice recording is not supported on this browser.",
    es: "La grabacion de voz no esta disponible en este navegador."
  },
  voicePermissionDenied: {
    en: "Microphone permission denied.",
    es: "Permiso de microfono denegado."
  },
  voiceError: { en: "Could not send voice message.", es: "No se pudo enviar el mensaje de voz." },
  shareProgressEmpty: {
    en: "No recent training log found for this athlete.",
    es: "No se encontro un registro reciente de entrenamiento para este atleta."
  },
  shareProgressSending: { en: "Sharing latest progress...", es: "Compartiendo progreso mas reciente..." },
  shareProgressSent: { en: "Latest progress shared in chat.", es: "El progreso mas reciente fue compartido en el chat." },
  shareProgressError: { en: "Could not share training progress.", es: "No se pudo compartir el progreso del entrenamiento." },
  noMessages: {
    en: "No messages yet. Start the conversation below.",
    es: "Todavia no hay mensajes. Empieza la conversacion abajo."
  },
  noThreads: {
    en: "No threads yet.",
    es: "Todavia no hay chats."
  },
  recentHeader: { en: "Open chats", es: "Chats abiertos" },
  recentEmpty: {
    en: "New and recent threads will appear here.",
    es: "Los chats nuevos y recientes apareceran aqui."
  },
  searchEmpty: {
    en: "No chats match your search.",
    es: "Ningun chat coincide con la busqueda."
  },
  callsTitle: { en: "Calls", es: "Llamadas" },
  callsHint: {
    en: "Send a call request and launch device call service (phone on mobile, call room on desktop).",
    es: "Envia solicitud y abre servicio de llamada del dispositivo (telefono en mobile, sala de llamada en computadora)."
  },
  callsContactLabel: { en: "Contact", es: "Contacto" },
  callsVoiceBtn: { en: "Voice call", es: "Llamada de voz" },
  callsVideoBtn: { en: "Video call", es: "Videollamada" },
  callsLogTitle: { en: "Recent call requests", es: "Solicitudes recientes de llamada" },
  callsNoContacts: {
    en: "No contacts available for calls yet.",
    es: "Todavia no hay contactos disponibles para llamadas."
  },
  callsNoLogs: {
    en: "No call requests yet.",
    es: "Todavia no hay solicitudes de llamada."
  },
  callsRequestVoiceText: {
    en: "Voice call request.",
    es: "Solicitud de llamada de voz."
  },
  callsRequestVideoText: {
    en: "Video call request.",
    es: "Solicitud de videollamada."
  },
  callsRequestSent: { en: "Call request sent.", es: "Solicitud de llamada enviada." },
  callsLaunchDialer: { en: "Opening phone dialer...", es: "Abriendo telefono..." },
  callsLaunchComputer: { en: "Opening computer call room...", es: "Abriendo sala de llamada en computadora..." },
  callsLaunchFallback: {
    en: "No phone app target found. Opening browser call room.",
    es: "No se encontro destino de llamada del telefono. Abriendo sala en navegador."
  },
  callsLaunchError: {
    en: "Could not launch device call. Use call room fallback.",
    es: "No se pudo abrir la llamada del dispositivo. Usa la sala de llamada."
  },
  callsSendError: { en: "Could not send call request.", es: "No se pudo enviar la solicitud de llamada." },
  contactsTitleTab: { en: "Contacts", es: "Contactos" },
  contactsHintTab: {
    en: "Tap a group to open contacts quickly.",
    es: "Toca un grupo para abrir contactos rapido."
  },
  shareTitle: { en: "Share media", es: "Compartir media" },
  shareHint: {
    en: "Paste a media URL from chat and share it to social apps.",
    es: "Pega un URL de media del chat y compartelo en redes sociales."
  },
  shareUrlLabel: { en: "Media URL", es: "URL de media" },
  shareUrlPlaceholder: { en: "https://...", es: "https://..." },
  shareActionsTitle: { en: "Share to", es: "Compartir en" },
  shareNativeBtn: { en: "Share", es: "Compartir" },
  shareFacebookBtn: { en: "Facebook", es: "Facebook" },
  shareInstagramBtn: { en: "Instagram", es: "Instagram" },
  shareTiktokBtn: { en: "TikTok", es: "TikTok" },
  shareYoutubeBtn: { en: "YouTube Shorts", es: "YouTube Shorts" },
  shareHelp: {
    en: "Tip: paste a message media URL, then choose the app.",
    es: "Tip: pega el URL de un media del mensaje y luego elige la app."
  },
  shareNeedUrl: {
    en: "Add a media URL first.",
    es: "Primero agrega un URL de media."
  },
  shareNativeUnsupported: {
    en: "Native share is not available on this device. Use the social buttons.",
    es: "Compartir nativo no esta disponible en este dispositivo. Usa los botones sociales."
  },
  shareCopied: { en: "Media URL copied.", es: "URL de media copiado." },
  shareOpenApp: { en: "Opening app...", es: "Abriendo app..." },
  shareError: { en: "Could not open share target.", es: "No se pudo abrir el destino de compartir." },
  newBadge: {
    en: "New",
    es: "Nuevo"
  },
  contactsHeader: { en: "Available contacts", es: "Contactos disponibles" },
  threadsHeader: { en: "Active threads", es: "Chats activos" },
  startThread: { en: "Start thread", es: "Abrir chat" },
  openThread: { en: "Open thread", es: "Ver chat" },
  contactReady: { en: "Available for direct chat", es: "Disponible para chat directo" },
  privateBadge: { en: "Direct", es: "Directo" },
  teamBadge: { en: "Team", es: "Equipo" },
  you: { en: "You", es: "Tu" },
  needText: { en: "Write a message before sending.", es: "Escribe un mensaje antes de enviar." },
  signedOut: { en: "Signed out", es: "Sesion cerrada" },
  noLinkedAthleteUser: {
    en: "This athlete does not have a linked account yet.",
    es: "Este atleta todavia no tiene una cuenta vinculada."
  },
  needContent: {
    en: "Write a message or attach at least one photo/video.",
    es: "Escribe un mensaje o adjunta al menos una foto/video."
  },
  fileTypeError: {
    en: "Only photo, video, or audio files are allowed in messages.",
    es: "Solo se permiten fotos, videos o audios en mensajes."
  },
  fileSizeError: {
    en: "Each file must be 180 MB or less.",
    es: "Cada archivo debe ser de 180 MB o menos."
  },
  fileLimitError: {
    en: "You can send up to 4 files per message.",
    es: "Puedes enviar hasta 4 archivos por mensaje."
  },
  mediaOpen: { en: "Open", es: "Abrir" },
  mediaFullscreen: { en: "Full screen", es: "Pantalla completa" },
  mediaFavorite: { en: "Favorite", es: "Favorito" },
  mediaSaveToMedia: { en: "Save to Media", es: "Guardar en Media" },
  mediaSaved: { en: "Saved to Media.", es: "Guardado en Media." },
  mediaAlreadySaved: { en: "This file is already in Media.", es: "Este archivo ya esta en Media." },
  favoriteSaved: { en: "Saved to Favorites.", es: "Guardado en Favoritos." },
  favoriteAlreadySaved: { en: "This file is already in Favorites.", es: "Este archivo ya esta en Favoritos." },
  mediaUploadAuthError: {
    en: "Media upload failed: sign in again and retry.",
    es: "Fallo la subida de media: inicia sesion de nuevo e intenta otra vez."
  },
  mediaUploadTimeoutError: {
    en: "Media upload timed out. Try a smaller video or better connection.",
    es: "La subida de media tardo demasiado. Prueba un video mas pequeno o mejor conexion."
  },
  mediaUploadGenericError: {
    en: "Could not upload media right now.",
    es: "No se pudo subir la media ahora mismo."
  },
  videoTapToOpen: {
    en: "Tap Open to play video smoothly.",
    es: "Pulsa Abrir para reproducir el video sin problemas."
  },
  tagPrompt: { en: "Tags (comma separated)", es: "Tags (separados por coma)" },
  attachmentSummarySingle: { en: "Sent 1 media file.", es: "Envio 1 archivo de media." },
  attachmentSummaryMulti: { en: "Sent media files.", es: "Envio archivos de media." },
  previewSymbolFallback: { en: "New message", es: "Nuevo mensaje" }
};

let messagesFeedRows = [];
let messagesThreadsUnsub = null;
let messagesFeedUnsub = null;
let messagesContactUnsubs = [];
let messagesContactSourceRows = new Map();
let messagesSessionUid = "";
let messagesSelectedThreadId = "";
let messagesBound = false;
let messagesFeedLoading = false;
let messagesStatusCopy = "";
let messagesStatusType = "";
let messagesAutoOpeningContactUid = "";
let messagesSeenByThread = {};
let messagesNotifiedByThread = {};
let messagesThreadsPrimed = false;
let messagesThreadsSubscribedAt = 0;
let messagesThreadOpeningId = "";
let messagesThreadOpeningRequestId = 0;
let messagesSendInFlight = false;
let messagesLastSendByThread = {};
let messagesPendingEntriesByThread = {};
let messagesDeleteInFlightByMessage = {};
let messagesOpenRequestId = 0;
let messagesComposerFiles = [];
let messagesComposerPreviewUrls = [];
const MESSAGE_MAX_ATTACHMENTS = 4;
const MESSAGE_MAX_FILE_SIZE_BYTES = 180 * 1024 * 1024;
const MESSAGE_VIDEO_THUMBNAIL_MAX_BYTES = 40 * 1024 * 1024;
const MESSAGES_WORKSPACE_MODE_KEY = "wpl_messages_workspace_mode";
const MESSAGES_CALL_LOGS_KEY = "wpl_messages_call_logs";
let messagesWorkspaceMode = "chats";
let messagesSearchQuery = "";
let messagesThreadFilter = "all";
let messagesContactGroupOpenState = {};
let messagesContactGroupStateUid = "";
let messagesCompactThreadVisible = false;
let messagesReadSyncInFlight = {};
let messagesAnimatedEntryState = {};
let messagesTypingResetTimer = null;
let messagesTypingState = false;
let messagesVoiceRecorder = null;
let messagesVoiceStream = null;
let messagesVoiceChunks = [];
let messagesVoiceStartedAt = 0;
messagesWorkspaceMode = loadMessagesWorkspaceMode();

function getAppToastStack() {
  let stack = document.getElementById("appToastStack");
  if (stack) return stack;
  stack = document.createElement("div");
  stack.id = "appToastStack";
  stack.className = "app-toast-stack";
  document.body.appendChild(stack);
  return stack;
}

function pushAppToast({ title = "", body = "", tone = "", duration = 4200, onClick = null } = {}) {
  const stack = getAppToastStack();
  if (!stack) return;
  const toastEl = document.createElement("button");
  toastEl.type = "button";
  toastEl.className = `app-toast${tone ? ` app-toast-${tone}` : ""}`;
  toastEl.innerHTML = `
    <strong>${escapeHtml(title || pickCopy(MESSAGES_COPY.title))}</strong>
    <span>${escapeHtml(body || "")}</span>
  `;
  let removed = false;
  const removeToast = () => {
    if (removed) return;
    removed = true;
    toastEl.classList.add("closing");
    window.setTimeout(() => toastEl.remove(), 180);
  };
  toastEl.addEventListener("click", () => {
    removeToast();
    if (typeof onClick === "function") onClick();
  });
  stack.appendChild(toastEl);
  window.setTimeout(removeToast, duration);
}

function messageSeenStorageKey(uid = "") {
  return `wpl_message_seen_${String(uid || "").trim()}`;
}

function loadMessageSeenState(uid = "") {
  return parseStoredJson(messageSeenStorageKey(uid)) || {};
}

function persistMessageSeenState(uid = "", state = {}) {
  if (!uid) return;
  localStorage.setItem(messageSeenStorageKey(uid), JSON.stringify(state));
}

function getMessageSeenMillis(threadId = "") {
  return Number(messagesSeenByThread[String(threadId || "").trim()] || 0);
}

function setMessageSeenMillis(threadId = "", value = 0) {
  const current = getMessagesCurrentUser();
  const safeThreadId = String(threadId || "").trim();
  const nextValue = Number(value || 0);
  if (!current?.uid || !safeThreadId || !nextValue) return;
  const previousValue = getMessageSeenMillis(safeThreadId);
  if (nextValue <= previousValue) return;
  messagesSeenByThread = {
    ...messagesSeenByThread,
    [safeThreadId]: nextValue
  };
  persistMessageSeenState(current.uid, messagesSeenByThread);
}

function getMessageUnreadCount(current = getMessagesCurrentUser()) {
  if (!current?.uid) return 0;
  return messagesThreadRows.filter((thread) => {
    if (!canMessageThread(current, thread)) return false;
    const lastMessageMillis = messageTimestampToMillis(thread.lastMessageAt || thread.updatedAt);
    return Boolean(lastMessageMillis)
      && thread.lastSenderUid
      && thread.lastSenderUid !== current.uid
      && lastMessageMillis > getMessageSeenMillis(thread.id);
  }).length;
}

function updateMessagesUnreadIndicators() {
  const current = getMessagesCurrentUser();
  const unreadCount = getMessageUnreadCount(current);
  document.querySelectorAll('.tab[data-message-tab="true"]').forEach((btn) => {
    btn.classList.toggle("has-unread", unreadCount > 0);
    btn.dataset.unreadCount = unreadCount > 9 ? "9+" : String(unreadCount || "");
    btn.setAttribute("aria-label", unreadCount > 0
      ? `${pickCopy(MESSAGES_COPY.title)} (${unreadCount})`
      : pickCopy(MESSAGES_COPY.title));
  });
  if (messagesPanelChip) {
    messagesPanelChip.textContent = unreadCount > 0
      ? (currentLang === "es" ? `${unreadCount} sin leer` : `${unreadCount} unread`)
      : pickCopy(MESSAGES_COPY.chip);
  }
}

function getPendingThreadEntries(threadId = "") {
  return Array.isArray(messagesPendingEntriesByThread[String(threadId || "").trim()])
    ? messagesPendingEntriesByThread[String(threadId || "").trim()]
    : [];
}

function setPendingThreadEntries(threadId = "", entries = []) {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return;
  const nextEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (!nextEntries.length) {
    if (messagesPendingEntriesByThread[safeThreadId]) {
      const nextState = { ...messagesPendingEntriesByThread };
      delete nextState[safeThreadId];
      messagesPendingEntriesByThread = nextState;
    }
    return;
  }
  messagesPendingEntriesByThread = {
    ...messagesPendingEntriesByThread,
    [safeThreadId]: nextEntries
  };
}

function addPendingThreadEntry(threadId = "", entry = null) {
  if (!entry) return;
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return;
  const existing = getPendingThreadEntries(safeThreadId);
  setPendingThreadEntries(safeThreadId, dedupeMessageEntries([...existing, entry]));
}

function removePendingThreadEntry(threadId = "", clientMessageId = "") {
  const safeThreadId = String(threadId || "").trim();
  const safeClientMessageId = String(clientMessageId || "").trim();
  if (!safeThreadId || !safeClientMessageId) return;
  setPendingThreadEntries(
    safeThreadId,
    getPendingThreadEntries(safeThreadId).filter((entry) => String(entry.clientMessageId || "").trim() !== safeClientMessageId)
  );
}

function mergePendingMessagesIntoFeed(threadId = "", remoteRows = []) {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return dedupeMessageEntries(remoteRows);
  const normalizedRemoteRows = dedupeMessageEntries(remoteRows);
  const remoteClientIds = new Set(
    normalizedRemoteRows.map((entry) => String(entry.clientMessageId || "").trim()).filter(Boolean)
  );
  const pendingRows = getPendingThreadEntries(safeThreadId).filter((entry) => {
    const clientMessageId = String(entry.clientMessageId || "").trim();
    return clientMessageId && !remoteClientIds.has(clientMessageId);
  });
  if (!pendingRows.length) return normalizedRemoteRows;
  return dedupeMessageEntries([...normalizedRemoteRows, ...pendingRows]);
}

function resetMessagesContactGroupState(current = getMessagesCurrentUser()) {
  const uid = String(current?.uid || "").trim();
  messagesContactGroupStateUid = uid;
  messagesContactGroupOpenState = {};
}

function ensureMessagesContactGroupState(current = getMessagesCurrentUser()) {
  const uid = String(current?.uid || "").trim();
  if (uid !== messagesContactGroupStateUid) {
    resetMessagesContactGroupState(current);
  }
}

function isMessagesContactGroupOpen(groupKey = "") {
  const safeKey = String(groupKey || "").trim();
  if (!safeKey) return false;
  return Boolean(messagesContactGroupOpenState[safeKey]);
}

function setMessagesContactGroupOpen(groupKey = "", isOpen = false) {
  const safeKey = String(groupKey || "").trim();
  if (!safeKey) return;
  messagesContactGroupOpenState = {
    ...messagesContactGroupOpenState,
    [safeKey]: Boolean(isOpen)
  };
}

function normalizeMessagesSearchQuery(value = "") {
  return normalizeName(String(value || "").trim());
}

function doesMessageThreadMatchSearch(thread, current, query = "") {
  const safeQuery = normalizeMessagesSearchQuery(query);
  if (!safeQuery) return true;
  const other = getMessageOtherParticipant(thread, current?.uid || "");
  const haystack = normalizeMessagesSearchQuery([
    other?.name,
    other?.email,
    getRoleLabelEnglish(other?.role),
    thread?.lastMessageText
  ].filter(Boolean).join(" "));
  return haystack.includes(safeQuery);
}

function normalizeMessagesThreadFilter(value = "") {
  const safe = String(value || "").trim().toLowerCase();
  if (safe === "athlete") return "athlete";
  if (safe === "parent") return "parent";
  return "all";
}

function doesMessageThreadMatchFilter(thread, current, filter = "all") {
  const normalizedFilter = normalizeMessagesThreadFilter(filter);
  if (normalizedFilter === "all") return true;
  const other = getMessageOtherParticipant(thread, current?.uid || "");
  return normalizeMessageParticipantRole(other?.role || "", other?.email || "") === normalizedFilter;
}

function setMessagesThreadFilter(filter = "all", { rerender = true } = {}) {
  messagesThreadFilter = normalizeMessagesThreadFilter(filter);
  if (rerender) renderMessages();
}

function normalizeMessagesWorkspaceMode(mode = "") {
  const safe = String(mode || "").trim().toLowerCase();
  if (safe === "chats") return "chats";
  return "chats";
}

function loadMessagesWorkspaceMode() {
  return normalizeMessagesWorkspaceMode(localStorage.getItem(MESSAGES_WORKSPACE_MODE_KEY) || "chats");
}

function setMessagesWorkspaceMode(mode = "chats", { persist = true, rerender = true } = {}) {
  const nextMode = normalizeMessagesWorkspaceMode(mode);
  messagesWorkspaceMode = nextMode;
  if (persist) {
    localStorage.setItem(MESSAGES_WORKSPACE_MODE_KEY, nextMode);
  }
  if (rerender) {
    renderMessages();
  }
}

function getMessageCallLogs() {
  const parsed = parseStoredJson(MESSAGES_CALL_LOGS_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

function setMessageCallLogs(logs = []) {
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean).slice(0, 60) : [];
  localStorage.setItem(MESSAGES_CALL_LOGS_KEY, JSON.stringify(safeLogs));
}

function appendMessageCallLog(entry = {}) {
  const nextEntry = {
    id: String(entry.id || makeMediaId("call")).trim(),
    contactUid: String(entry.contactUid || "").trim(),
    contactName: String(entry.contactName || "Contact").trim() || "Contact",
    type: String(entry.type || "voice").trim().toLowerCase() === "video" ? "video" : "voice",
    createdAt: String(entry.createdAt || new Date().toISOString()).trim(),
    byUid: String(entry.byUid || "").trim()
  };
  setMessageCallLogs([nextEntry, ...getMessageCallLogs()]);
}

function getMessagesShareUrl() {
  return String(messagesShareUrlInput?.value || "").trim();
}

function setMessagesShareStatus(copy = "") {
  if (!messagesShareStatus) return;
  messagesShareStatus.textContent = pickCopy(copy);
}

async function copyTextToClipboard(text = "") {
  const safeText = String(text || "").trim();
  if (!safeText) return false;
  try {
    await navigator.clipboard.writeText(safeText);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = safeText;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    input.remove();
    return Boolean(ok);
  }
}

function getMessageComposerTagList() {
  return [];
}

function formatMessageFileSize(bytes = 0) {
  const size = Number(bytes || 0);
  if (!size) return "0 KB";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function releaseMessageComposerPreviewUrls() {
  if (!Array.isArray(messagesComposerPreviewUrls) || !messagesComposerPreviewUrls.length) return;
  messagesComposerPreviewUrls.forEach((url) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore revoke errors
    }
  });
  messagesComposerPreviewUrls = [];
}

function getMessageComposerFileKind(file = null) {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

function createMessageComposerPreviewUrl(file = null) {
  const kind = getMessageComposerFileKind(file);
  const isFile = typeof File !== "undefined" && file instanceof File;
  const isBlob = typeof Blob !== "undefined" && file instanceof Blob;
  if ((kind !== "image" && kind !== "video") || (!isFile && !isBlob)) {
    return "";
  }
  try {
    const url = URL.createObjectURL(file);
    messagesComposerPreviewUrls.push(url);
    return url;
  } catch {
    return "";
  }
}

function removeMessageComposerFileAt(index = -1) {
  const targetIndex = Number(index);
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= messagesComposerFiles.length) return;
  messagesComposerFiles = messagesComposerFiles.filter((_, entryIndex) => entryIndex !== targetIndex);
  if (messageComposerFilesInput) {
    messageComposerFilesInput.value = "";
  }
  renderMessageComposerFiles();
  renderMessages();
}

function renderMessageComposerFiles() {
  if (!messageComposerFilesList) return;
  releaseMessageComposerPreviewUrls();
  messageComposerFilesList.innerHTML = "";
  if (!messagesComposerFiles.length) return;
  messagesComposerFiles.forEach((file, index) => {
    const kind = getMessageComposerFileKind(file);
    const previewUrl = createMessageComposerPreviewUrl(file);
    const pill = document.createElement("div");
    pill.className = `message-composer-file-pill${previewUrl ? " has-preview" : ""}`;
    const previewMarkup = previewUrl
      ? kind === "image"
        ? `<img class="message-composer-file-preview" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(file.name || "media")}" loading="lazy">`
        : `<video class="message-composer-file-preview" src="${escapeHtml(previewUrl)}" muted playsinline preload="metadata"></video>`
      : `<span class="message-composer-file-preview message-composer-file-preview-fallback">${escapeHtml(kind.toUpperCase())}</span>`;
    pill.innerHTML = `
      ${previewMarkup}
      <span class="message-composer-file-meta">
        <span>${escapeHtml(file.name || "media")}</span>
        <small>${escapeHtml(formatMessageFileSize(file.size || 0))}</small>
      </span>
      <button type="button" class="message-composer-file-remove" data-index="${index}" aria-label="${escapeHtml(currentLang === "es" ? "Quitar archivo" : "Remove file")}">✕</button>
    `;
    const removeBtn = pill.querySelector(".message-composer-file-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        removeMessageComposerFileAt(index);
      });
    }
    messageComposerFilesList.appendChild(pill);
  });
}

function clearMessageComposerMediaInputs({ preserveTags = false } = {}) {
  releaseMessageComposerPreviewUrls();
  messagesComposerFiles = [];
  if (messageComposerFilesInput) messageComposerFilesInput.value = "";
  if (!preserveTags && messageComposerTagsInput) messageComposerTagsInput.value = "";
  renderMessageComposerFiles();
}

function setMessageComposerFiles(files = []) {
  releaseMessageComposerPreviewUrls();
  messagesComposerFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  renderMessageComposerFiles();
}

function validateMessageComposerFiles(files = []) {
  if (!files.length) return { valid: true, files: [] };
  if (files.length > MESSAGE_MAX_ATTACHMENTS) {
    return { valid: false, reason: "count" };
  }
  const oversized = files.find((file) => Number(file?.size || 0) > MESSAGE_MAX_FILE_SIZE_BYTES);
  if (oversized) {
    return { valid: false, reason: "size" };
  }
  const invalid = files.find((file) => {
    const mime = String(file?.type || "").toLowerCase();
    return !(mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/"));
  });
  if (invalid) {
    return { valid: false, reason: "type" };
  }
  return { valid: true, files };
}

function getMessageFileValidationCopy(reason = "") {
  if (reason === "count") return MESSAGES_COPY.fileLimitError;
  if (reason === "size") return MESSAGES_COPY.fileSizeError;
  return MESSAGES_COPY.fileTypeError;
}

function shouldUseLiteVideoMessagePreview() {
  if (typeof window === "undefined") return false;
  const isSmallScreen = Boolean(window.matchMedia?.("(max-width: 900px)")?.matches);
  const saveData = Boolean(typeof navigator !== "undefined" && navigator.connection?.saveData);
  const deviceMemory = Number(typeof navigator !== "undefined" ? (navigator.deviceMemory || 0) : 0);
  const lowMemory = deviceMemory > 0 && deviceMemory <= 4;
  return isSmallScreen || saveData || lowMemory;
}

function shouldGenerateMessageThumbnail(file) {
  const type = String(file?.type || "").toLowerCase();
  const size = Number(file?.size || 0);
  if (type.startsWith("image/")) return true;
  if (type.startsWith("video/")) {
    const fileName = String(file?.name || "").toLowerCase();
    // QuickTime uploads commonly fail canvas extraction for thumbnails.
    if (type.includes("quicktime") || fileName.endsWith(".mov")) return false;
    if (size > MESSAGE_VIDEO_THUMBNAIL_MAX_BYTES) return false;
    if (shouldUseLiteVideoMessagePreview()) return false;
    return true;
  }
  return false;
}

function buildMessageAttachmentSummaryText(attachments = []) {
  return attachments.length > 1
    ? pickCopy(MESSAGES_COPY.attachmentSummaryMulti)
    : pickCopy(MESSAGES_COPY.attachmentSummarySingle);
}

function formatMessageUploadProgressStatus(currentIndex = 0, total = 0, fileName = "") {
  const safeCurrent = Math.max(0, Number(currentIndex || 0));
  const safeTotal = Math.max(0, Number(total || 0));
  const safeFileName = String(fileName || "").trim();
  if (currentLang === "es") {
    return safeFileName
      ? `Subiendo ${safeCurrent}/${safeTotal}: ${safeFileName}`
      : `Subiendo ${safeCurrent}/${safeTotal}...`;
  }
  return safeFileName
    ? `Uploading ${safeCurrent}/${safeTotal}: ${safeFileName}`
    : `Uploading ${safeCurrent}/${safeTotal}...`;
}

async function uploadMessageComposerAttachments(files = [], tags = [], onProgress = null) {
  const uploads = [];
  const total = files.length;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (typeof onProgress === "function") {
      onProgress({ current: index + 1, total, file, phase: "uploading" });
    }
    const uploaded = await uploadMediaAssetBundleToFirebase(file, {
      generateThumbnail: shouldGenerateMessageThumbnail(file)
    });
    uploads.push(normalizeMessageAttachment({
      id: makeMediaId("msg_media"),
      mediaAssetId: uploaded.mediaAssetId || "",
      name: file.name,
      mediaType: inferMediaTypeFromFile(file),
      assetPath: uploaded.assetPath,
      assetStoragePath: uploaded.assetStoragePath || "",
      thumbnailPath: uploaded.thumbnailPath || "",
      thumbnailStoragePath: uploaded.thumbnailStoragePath || "",
      contentType: file.type || "",
      size: Number(file.size || 0),
      tags
    }));
    if (typeof onProgress === "function") {
      onProgress({ current: index + 1, total, file, phase: "uploaded" });
    }
  }
  return uploads;
}

function promptMessageAttachmentTags(currentTags = []) {
  const seed = normalizeLooseTagList(currentTags).join(", ");
  const response = window.prompt(pickCopy(MESSAGES_COPY.tagPrompt), seed);
  if (response === null) return null;
  return normalizeLooseTagList(response);
}

function buildMessageMediaNodeFromAttachment(attachment, tags = []) {
  const attachmentTags = normalizeLooseTagList([...(attachment?.tags || []), ...tags]);
  const noteBase = currentLang === "es" ? "Guardado desde Mensajes" : "Saved from Messages";
  return {
    id: makeMediaId("item"),
    type: "item",
    title: String(attachment?.name || "").trim() || buildMessageAttachmentSummaryText([attachment]),
    mediaAssetId: String(attachment?.mediaAssetId || "").trim(),
    mediaType: String(attachment?.mediaType || "Video").trim(),
    assetPath: String(attachment?.assetPath || "").trim(),
    assetStoragePath: String(attachment?.assetStoragePath || "").trim(),
    thumbnailPath: String(attachment?.thumbnailPath || "").trim(),
    thumbnailStoragePath: String(attachment?.thumbnailStoragePath || "").trim(),
    duration: "",
    assigned: currentLang === "es" ? "Mensajes" : "Messages",
    note: attachmentTags.length ? `${noteBase} - ${attachmentTags.join(", ")}` : noteBase,
    tags: attachmentTags
  };
}

function getMessageUploadsSectionName() {
  return currentLang === "es" ? "Uploads de mensajes" : "Message Uploads";
}

function findOrCreateMessageUploadsSection(nodes = []) {
  const targetName = getMessageUploadsSectionName();
  const aliases = new Set([
    normalizeName(targetName),
    normalizeName("Message Uploads"),
    normalizeName("Uploads de mensajes")
  ]);
  let section = nodes.find((node) => (
    node?.type === "section"
      && node.parentId === null
      && aliases.has(normalizeName(node.name))
  )) || null;
  if (section) return section.id;
  const sectionId = makeMediaId("sec");
  nodes.push({
    id: sectionId,
    type: "section",
    name: targetName,
    parentId: null
  });
  return sectionId;
}

function saveMessageAttachmentToMedia(attachment, tags = []) {
  const safeMediaAssetId = String(attachment?.mediaAssetId || "").trim();
  const safeAssetPath = String(attachment?.assetPath || "").trim();
  const safeStoragePath = String(attachment?.assetStoragePath || "").trim();
  if (!safeMediaAssetId && !safeAssetPath && !safeStoragePath) return { added: false };
  const nodes = getMediaNodes();
  const existing = nodes.find((node) => {
    if (node?.type !== "item") return false;
    const nodeMediaAssetId = String(node.mediaAssetId || "").trim();
    if (safeMediaAssetId && nodeMediaAssetId) {
      return nodeMediaAssetId === safeMediaAssetId;
    }
    const nodeStoragePath = String(node.assetStoragePath || "").trim();
    const nodeAssetPath = String(node.assetPath || "").trim();
    if (safeStoragePath && nodeStoragePath) {
      return nodeStoragePath === safeStoragePath;
    }
    return Boolean(safeAssetPath) && nodeAssetPath === safeAssetPath;
  });
  if (existing) {
    const mergedTags = normalizeLooseTagList([...(existing.tags || []), ...(attachment.tags || []), ...tags]);
    const noteBase = currentLang === "es" ? "Guardado desde Mensajes" : "Saved from Messages";
    existing.tags = mergedTags;
    if (!existing.mediaAssetId && safeMediaAssetId) {
      existing.mediaAssetId = safeMediaAssetId;
    }
    existing.note = mergedTags.length ? `${noteBase} - ${mergedTags.join(", ")}` : noteBase;
    existing.updatedAt = new Date().toISOString();
    setMediaNodes(nodes);
    return { added: false, existing: true };
  }
  const sectionId = findOrCreateMessageUploadsSection(nodes);
  const mediaNode = buildMessageMediaNodeFromAttachment(attachment, tags);
  mediaNode.parentId = sectionId;
  nodes.push(mediaNode);
  setMediaNodes(nodes);
  return { added: true };
}

function updateLocalThreadPreview(threadId = "", {
  text = "",
  senderUid = "",
  createdAt = "",
  messageEntry = null
} = {}) {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return;
  const safeCreatedAt = createdAt || new Date().toISOString();
  const nextRows = messagesThreadRows.map((thread) => {
    if (thread.id !== safeThreadId) return thread;
    const nextHistory = messageEntry
      ? dedupeMessageEntries([...(Array.isArray(thread.messageHistory) ? thread.messageHistory : []), messageEntry])
      : (Array.isArray(thread.messageHistory) ? thread.messageHistory : []);
    return {
      ...thread,
      lastMessageText: String(text || "").trim(),
      lastSenderUid: String(senderUid || "").trim(),
      lastMessageAt: safeCreatedAt,
      updatedAt: safeCreatedAt,
      messageHistory: nextHistory
    };
  });
  messagesThreadRows = sortMessageThreads(nextRows);
  updateMessagesUnreadIndicators();
}

function isMessagesPanelFocused() {
  return currentFocusedPanel === "messages" || currentTopTab === "messages";
}

function isMessageThreadUnread(thread, current = getMessagesCurrentUser()) {
  if (!current?.uid || !thread?.id) return false;
  const lastMessageMillis = messageTimestampToMillis(thread.lastMessageAt || thread.updatedAt);
  return Boolean(lastMessageMillis)
    && thread.lastSenderUid
    && thread.lastSenderUid !== current.uid
    && lastMessageMillis > getMessageSeenMillis(thread.id);
}

function markMessageThreadSeen(threadId = "", timestamp = 0) {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return;
  const thread = messagesThreadRows.find((item) => item.id === safeThreadId);
  const seenMillis = Number(timestamp || messageTimestampToMillis(thread?.lastMessageAt || thread?.updatedAt));
  if (!seenMillis) return;
  setMessageSeenMillis(safeThreadId, seenMillis);
  updateMessagesUnreadIndicators();
}

function markSelectedMessageThreadSeen() {
  if (!messagesSelectedThreadId || document.hidden || !isMessagesPanelFocused()) return;
  markMessageThreadSeen(messagesSelectedThreadId);
  syncThreadReadReceipts(messagesSelectedThreadId, messagesFeedRows).catch(() => {});
}

function getMessageThreadDocRef(threadId = "") {
  const threadsRef = getMessageThreadsCollectionRef();
  const safeThreadId = String(threadId || "").trim();
  if (!threadsRef || !safeThreadId) return null;
  return threadsRef.doc(safeThreadId);
}

function buildDeleteThreadConfirmText(thread = null, current = getMessagesCurrentUser()) {
  if (!thread || !current?.uid) return pickCopy(MESSAGES_COPY.deleteThreadConfirmGeneric);
  const other = getMessageOtherParticipant(thread, current.uid);
  const otherName = String(other?.name || "").trim();
  if (!otherName) return pickCopy(MESSAGES_COPY.deleteThreadConfirmGeneric);
  return pickCopy(MESSAGES_COPY.deleteThreadConfirmWithName).replace("{name}", otherName);
}

function omitThreadKeyFromMap(source = {}, threadId = "") {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId || !source || typeof source !== "object") return source;
  if (!Object.prototype.hasOwnProperty.call(source, safeThreadId)) return source;
  const next = { ...source };
  delete next[safeThreadId];
  return next;
}

function removeMessageThreadLocalState(threadId = "") {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return;
  messagesThreadRows = messagesThreadRows.filter((thread) => thread.id !== safeThreadId);
  messagesSeenByThread = omitThreadKeyFromMap(messagesSeenByThread, safeThreadId);
  const current = getMessagesCurrentUser();
  if (current?.uid) persistMessageSeenState(current.uid, messagesSeenByThread);
  messagesNotifiedByThread = omitThreadKeyFromMap(messagesNotifiedByThread, safeThreadId);
  messagesLastSendByThread = omitThreadKeyFromMap(messagesLastSendByThread, safeThreadId);
  messagesPendingEntriesByThread = omitThreadKeyFromMap(messagesPendingEntriesByThread, safeThreadId);
  messagesReadSyncInFlight = omitThreadKeyFromMap(messagesReadSyncInFlight, safeThreadId);
  messagesAnimatedEntryState = omitThreadKeyFromMap(messagesAnimatedEntryState, safeThreadId);

  if (messagesSelectedThreadId === safeThreadId) {
    if (messagesFeedUnsub) {
      messagesFeedUnsub();
      messagesFeedUnsub = null;
    }
    messagesSelectedThreadId = "";
    messagesFeedRows = [];
    clearMessagesTypingTimer();
    messagesTypingState = false;
    messagesCompactThreadVisible = false;
  }
  if (messagesThreadOpeningId === safeThreadId) {
    messagesThreadOpeningId = "";
    messagesThreadOpeningRequestId = 0;
  }
  updateMessagesUnreadIndicators();
}

function getMessageThreadSwipeDeleteKey(threadId = "") {
  const safeThreadId = String(threadId || "").trim();
  return safeThreadId ? `message-thread:${safeThreadId}` : "";
}

function getMessageEntrySwipeDeleteKey(threadId = "", messageId = "") {
  const safeThreadId = String(threadId || "").trim();
  const safeMessageId = String(messageId || "").trim();
  if (!safeThreadId || !safeMessageId) return "";
  return `message-entry:${safeThreadId}:${safeMessageId}`;
}

function isMessageThreadPendingDelete(thread = null) {
  const threadId = String(thread?.id || "").trim();
  if (!threadId) return false;
  if (pendingMessageThreadDeleteById[threadId]) return true;
  return isSwipeDeletePending(getMessageThreadSwipeDeleteKey(threadId));
}

function isMessageEntryPendingDelete(entry = null, threadId = "") {
  const safeThreadId = String(threadId || "").trim();
  const messageId = String(entry?.id || entry?.clientMessageId || "").trim();
  if (!safeThreadId || !messageId) return false;
  const pendingKey = `${safeThreadId}:${messageId}`;
  if (pendingMessageEntryDeleteById[pendingKey]) return true;
  return isSwipeDeletePending(getMessageEntrySwipeDeleteKey(safeThreadId, messageId));
}

function queueMessageThreadSwipeDelete(thread = null, current = getMessagesCurrentUser()) {
  const safeThreadId = String(thread?.id || "").trim();
  if (!safeThreadId || !thread || !current?.uid) return false;
  if (isMessageThreadPendingDelete(thread)) return false;
  const other = getMessageOtherParticipant(thread, current.uid);
  const safeName = String(other?.name || "").trim() || pickCopy(MESSAGES_COPY.title);
  const scheduled = scheduleSwipeDelete({
    key: getMessageThreadSwipeDeleteKey(safeThreadId),
    labelCopy: {
      en: `${safeName} chat removed`,
      es: `Chat con ${safeName} eliminado`
    },
    onCommit: async () => {
      pendingMessageThreadDeleteById = omitThreadKeyFromMap(pendingMessageThreadDeleteById, safeThreadId);
      const deleted = await deleteMessageThreadById(safeThreadId, thread, {
        skipConfirm: true,
        silentNoSelection: true
      });
      if (!deleted) {
        throw new Error("message_thread_delete_failed");
      }
    },
    onUndo: () => {
      pendingMessageThreadDeleteById = omitThreadKeyFromMap(pendingMessageThreadDeleteById, safeThreadId);
      renderMessages();
    },
    onError: () => {
      pendingMessageThreadDeleteById = omitThreadKeyFromMap(pendingMessageThreadDeleteById, safeThreadId);
      setMessagesStatus(MESSAGES_COPY.deleteThreadError, "error");
      renderMessages();
    }
  });
  if (!scheduled) return false;
  pendingMessageThreadDeleteById = {
    ...pendingMessageThreadDeleteById,
    [safeThreadId]: true
  };
  ensureSelectedMessageThread();
  renderMessages();
  return true;
}

function queueMessageEntrySwipeDelete(entry = null, threadId = "", current = getMessagesCurrentUser()) {
  const safeThreadId = String(threadId || "").trim();
  const safeMessageId = String(entry?.id || entry?.clientMessageId || "").trim();
  if (!safeThreadId || !safeMessageId || !current?.uid) return false;
  const thread = messagesThreadRows.find((row) => String(row?.id || "").trim() === safeThreadId) || getSelectedMessageThread();
  if (!canDeleteMessageEntry(entry || {}, current, thread)) return false;
  if (isMessageEntryPendingDelete(entry, safeThreadId)) return false;
  const pendingKey = `${safeThreadId}:${safeMessageId}`;
  const scheduled = scheduleSwipeDelete({
    key: getMessageEntrySwipeDeleteKey(safeThreadId, safeMessageId),
    labelCopy: {
      en: "Message removed",
      es: "Mensaje eliminado"
    },
    onCommit: async () => {
      const next = { ...pendingMessageEntryDeleteById };
      delete next[pendingKey];
      pendingMessageEntryDeleteById = next;
      const deleted = await deleteMessageEntryFromSelectedThread(entry, {
        skipConfirm: true,
        threadIdOverride: safeThreadId
      });
      if (!deleted) {
        throw new Error("message_delete_failed");
      }
    },
    onUndo: () => {
      const next = { ...pendingMessageEntryDeleteById };
      delete next[pendingKey];
      pendingMessageEntryDeleteById = next;
      renderMessages();
    },
    onError: () => {
      const next = { ...pendingMessageEntryDeleteById };
      delete next[pendingKey];
      pendingMessageEntryDeleteById = next;
      setMessagesStatus(MESSAGES_COPY.deleteMessageError, "error");
      renderMessages();
    }
  });
  if (!scheduled) return false;
  pendingMessageEntryDeleteById = {
    ...pendingMessageEntryDeleteById,
    [pendingKey]: true
  };
  renderMessages();
  return true;
}

async function deleteMessageThreadDocuments(threadId = "") {
  const safeThreadId = String(threadId || "").trim();
  const threadRef = getMessageThreadDocRef(safeThreadId);
  if (!threadRef || !firebaseFirestoreInstance) {
    throw new Error("firestore_not_configured");
  }
  while (true) {
    const batchSnap = await withTimeout(
      threadRef.collection("messages").limit(200).get(),
      FIREBASE_OP_TIMEOUT_MS * 2,
      "firestore_thread_messages_delete_read_timeout"
    );
    const docs = batchSnap?.docs || [];
    if (!docs.length) break;
    const batch = firebaseFirestoreInstance.batch();
    docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await withTimeout(
      batch.commit(),
      FIREBASE_OP_TIMEOUT_MS * 2,
      "firestore_thread_messages_delete_commit_timeout"
    );
  }
  await withTimeout(
    threadRef.delete(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_thread_delete_timeout"
  );
}

async function deleteSelectedMessageThread() {
  const selectedThread = getSelectedMessageThread();
  const current = getMessagesCurrentUser();
  if (!selectedThread || !current?.uid) return false;
  return queueMessageThreadSwipeDelete(selectedThread, current);
}

async function deleteMessageThreadById(threadIdInput = "", threadOverride = null, options = {}) {
  const skipConfirm = Boolean(options?.skipConfirm);
  const silentNoSelection = Boolean(options?.silentNoSelection);
  const current = getMessagesCurrentUser();
  const threadId = String(threadIdInput || "").trim();
  const selectedThread = threadOverride
    || messagesThreadRows.find((thread) => thread.id === threadId)
    || null;
  if (!current?.uid || !selectedThread || !threadId) {
    if (!silentNoSelection) {
      toast(pickCopy(MESSAGES_COPY.deleteThreadNoSelection));
      setMessagesStatus(MESSAGES_COPY.deleteThreadNoSelection, "error");
      renderMessages();
    }
    return false;
  }
  if (!skipConfirm) {
    const confirmText = buildDeleteThreadConfirmText(selectedThread, current);
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      if (!window.confirm(confirmText)) return false;
    }
  }
  setMessagesStatus(MESSAGES_COPY.deletingThread, "");
  renderMessages();
  try {
    clearMessagesTypingTimer();
    await setThreadTypingState(threadId, false);
    await deleteMessageThreadDocuments(threadId);
    removeMessageThreadLocalState(threadId);
    ensureSelectedMessageThread();
    setMessagesStatus(MESSAGES_COPY.deletedThread, "ok");
    renderMessages();
    return true;
  } catch (err) {
    console.warn("Failed to delete message thread", err);
    const code = String(err?.code || err?.message || "").toLowerCase();
    if (code.includes("permission-denied")) {
      setMessagesStatus(MESSAGES_COPY.deletePermissionDenied, "error");
      renderMessages();
      return false;
    }
    setMessagesStatus(MESSAGES_COPY.deleteThreadError, "error");
    renderMessages();
    return false;
  }
}

function applyDeletedMessageLocally(threadId = "", messageId = "") {
  const safeThreadId = String(threadId || "").trim();
  const safeMessageId = String(messageId || "").trim();
  if (!safeThreadId || !safeMessageId) return;
  messagesFeedRows = dedupeMessageEntries(
    messagesFeedRows.filter((entry) => String(entry.id || "").trim() !== safeMessageId)
  );
  messagesThreadRows = sortMessageThreads(messagesThreadRows.map((thread) => {
    if (thread.id !== safeThreadId) return thread;
    const nextHistory = dedupeMessageEntries(
      (Array.isArray(thread.messageHistory) ? thread.messageHistory : [])
        .filter((entry) => String(entry.id || "").trim() !== safeMessageId)
    );
    const last = nextHistory[nextHistory.length - 1] || null;
    return {
      ...thread,
      messageHistory: nextHistory,
      lastMessageText: String(last?.text || "").trim(),
      lastSenderUid: String(last?.senderUid || "").trim(),
      lastMessageAt: last?.createdAt || thread.lastMessageAt || "",
      updatedAt: last?.createdAt || thread.updatedAt || ""
    };
  }));
}

async function touchThreadSummaryAfterMessageDelete(threadId = "", selectedThread = null, remainingRows = []) {
  const safeThreadId = String(threadId || "").trim();
  const threadRef = getMessageThreadDocRef(safeThreadId);
  const current = getMessagesCurrentUser();
  if (!safeThreadId || !threadRef || !current?.uid) return;
  let threadContext = selectedThread || getSelectedMessageThread() || null;
  if (!threadContext || String(threadContext.id || "").trim() !== safeThreadId) {
    const threadSnapshot = await withTimeout(
      threadRef.get(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_thread_read_after_message_delete_timeout"
    );
    if (threadSnapshot?.exists) {
      threadContext = normalizeMessageThreadRecord(threadSnapshot);
    }
  }
  const participants = getMessageThreadParticipantsForSend(threadContext, current);
  if (!Array.isArray(participants) || participants.length < 2) return;
  let normalizedHistory = dedupeMessageEntries(Array.isArray(remainingRows) ? remainingRows : []);
  try {
    const feedSnapshot = await withTimeout(
      threadRef.collection("messages").orderBy("createdAt", "asc").get(),
      FIREBASE_OP_TIMEOUT_MS * 2,
      "firestore_thread_feed_rebuild_after_delete_timeout"
    );
    normalizedHistory = dedupeMessageEntries(feedSnapshot.docs.map((doc) => normalizeMessageEntry(doc)));
  } catch (err) {
    console.warn("Failed to rebuild thread history after delete; using local rows", err);
  }
  const last = normalizedHistory.length ? normalizedHistory[normalizedHistory.length - 1] : null;
  const nowIso = new Date().toISOString();
  const summaryStamp = String(
    last?.createdAt
      || nowIso
  ).trim();
  const payload = buildMessageThreadPayload(participants, {
    updatedAt: summaryStamp,
    lastMessageAt: last ? summaryStamp : "",
    serverUpdatedAt: getFirestoreServerTimestamp(),
    serverLastMessageAt: last ? getFirestoreServerTimestamp() : undefined,
    lastMessageText: String(last?.text || "").trim(),
    lastSenderUid: String(last?.senderUid || "").trim(),
    messageHistory: normalizedHistory
  });
  await withTimeout(
    threadRef.set(payload, { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_thread_delete_summary_touch_timeout"
  );
}

function getMessageAttachmentStoragePaths(entry = null) {
  const attachments = Array.isArray(entry?.attachments) ? entry.attachments : [];
  const byPath = new Set();
  attachments.forEach((attachment) => {
    const assetPath = String(attachment?.assetStoragePath || "").trim();
    const thumbPath = String(attachment?.thumbnailStoragePath || "").trim();
    if (assetPath) byPath.add(assetPath);
    if (thumbPath) byPath.add(thumbPath);
  });
  return Array.from(byPath.values());
}

async function purgeMessageAttachmentStorage(entry = null) {
  const paths = getMessageAttachmentStoragePaths(entry);
  if (!paths.length || !firebaseStorageInstance?.ref) return;
  await Promise.allSettled(paths.map((path) => withTimeout(
    firebaseStorageInstance.ref().child(path).delete(),
    FIREBASE_OP_TIMEOUT_MS,
    "firebase_storage_message_attachment_delete_timeout"
  )));
}

async function deleteMessageEntryFromSelectedThread(entry = null) {
  const current = getMessagesCurrentUser();
  const selectedThread = getSelectedMessageThread();
  const threadId = String(selectedThread?.id || "").trim();
  const messageId = String(entry?.id || "").trim();
  if (!current?.uid || !threadId || !messageId) return;
  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    if (!window.confirm(pickCopy(MESSAGES_COPY.deleteMessageConfirm))) return;
  }
  setMessagesStatus(MESSAGES_COPY.deletingMessage, "");
  renderMessages();
  try {
    const threadRef = getMessageThreadDocRef(threadId);
    if (!threadRef) throw new Error("firestore_not_configured");
    await withTimeout(
      threadRef.collection("messages").doc(messageId).delete(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_delete_timeout"
    );
    await purgeMessageAttachmentStorage(entry);
    applyDeletedMessageLocally(threadId, messageId);
    await touchThreadSummaryAfterMessageDelete(threadId, selectedThread, messagesFeedRows);
    setMessagesStatus(MESSAGES_COPY.deletedMessage, "ok");
    renderMessages();
  } catch (err) {
    console.warn("Failed to delete message entry", err);
    const code = String(err?.code || err?.message || "").toLowerCase();
    if (code.includes("permission-denied")) {
      setMessagesStatus(MESSAGES_COPY.deletePermissionDenied, "error");
      renderMessages();
      return;
    }
    setMessagesStatus(MESSAGES_COPY.deleteMessageError, "error");
    renderMessages();
  }
}

function getMessageReadEntryKey(entry = {}) {
  return String(entry.id || entry.clientMessageId || "").trim();
}

function applyReadStateToLocalMessages(threadId = "", entries = [], currentUid = "", readAt = "") {
  const safeThreadId = String(threadId || "").trim();
  const safeUid = String(currentUid || "").trim();
  const keys = new Set((Array.isArray(entries) ? entries : []).map((entry) => getMessageReadEntryKey(entry)).filter(Boolean));
  if (!safeThreadId || !safeUid || !keys.size) return;

  const stamp = String(readAt || "").trim() || new Date().toISOString();
  messagesFeedRows = messagesFeedRows.map((entry) => {
    const key = getMessageReadEntryKey(entry);
    if (!keys.has(key)) return entry;
    return { ...entry, read: true, readByUid: safeUid, readAt: stamp };
  });

  messagesThreadRows = sortMessageThreads(messagesThreadRows.map((thread) => {
    if (thread.id !== safeThreadId) return thread;
    const history = Array.isArray(thread.messageHistory) ? thread.messageHistory.map((entry) => {
      const key = getMessageReadEntryKey(entry);
      if (!keys.has(key)) return entry;
      return { ...entry, read: true, readByUid: safeUid, readAt: stamp };
    }) : [];
    return { ...thread, messageHistory: history };
  }));
}

async function syncThreadReadReceipts(threadId = "", rows = []) {
  const safeThreadId = String(threadId || "").trim();
  const current = getMessagesCurrentUser();
  if (!safeThreadId || !current?.uid || !firebaseFirestoreInstance) return;
  if (!isMessagesPanelFocused() || document.hidden) return;
  if (messagesReadSyncInFlight[safeThreadId]) return;
  const unreadIncoming = (Array.isArray(rows) ? rows : []).filter((entry) => (
    entry?.id
    && entry.senderUid
    && entry.senderUid !== current.uid
    && !entry.read
  ));
  if (!unreadIncoming.length) return;

  const threadRef = getMessageThreadDocRef(safeThreadId);
  if (!threadRef) return;
  messagesReadSyncInFlight = { ...messagesReadSyncInFlight, [safeThreadId]: true };
  try {
    const batch = firebaseFirestoreInstance.batch();
    unreadIncoming.forEach((entry) => {
      batch.set(
        threadRef.collection("messages").doc(entry.id),
        {
          read: true,
          readByUid: current.uid,
          readAt: new Date().toISOString(),
          serverReadAt: getFirestoreServerTimestamp()
        },
        { merge: true }
      );
    });
    await withTimeout(batch.commit(), FIREBASE_OP_TIMEOUT_MS, "firestore_message_read_receipt_timeout");
    applyReadStateToLocalMessages(safeThreadId, unreadIncoming, current.uid, new Date().toISOString());
    renderMessages();
  } catch (err) {
    console.warn("Failed to sync read receipts", err);
  } finally {
    const next = { ...messagesReadSyncInFlight };
    delete next[safeThreadId];
    messagesReadSyncInFlight = next;
  }
}

function getOtherTypingParticipant(thread, currentUid = "") {
  const map = thread?.typingByUid && typeof thread.typingByUid === "object"
    ? thread.typingByUid
    : {};
  const otherUid = Object.keys(map).find((uid) => uid && uid !== currentUid && map[uid]);
  if (!otherUid) return null;
  return getMessageOtherParticipant(thread, currentUid);
}

function renderTypingIndicator(thread = null, current = getMessagesCurrentUser()) {
  if (!messagesTypingIndicator) return;
  const typingParticipant = getOtherTypingParticipant(thread, current?.uid || "");
  if (!typingParticipant) {
    messagesTypingIndicator.classList.add("hidden");
    return;
  }
  const nameEl = messagesTypingIndicator.querySelector(".messages-typing-name");
  if (nameEl) nameEl.textContent = typingParticipant.name || pickCopy(MESSAGES_COPY.title);
  const verbEl = messagesTypingIndicator.querySelector(".messages-typing-verb");
  if (verbEl) verbEl.textContent = pickCopy(MESSAGES_COPY.typingLabel);
  messagesTypingIndicator.classList.remove("hidden");
}

function clearMessagesTypingTimer() {
  if (!messagesTypingResetTimer) return;
  clearTimeout(messagesTypingResetTimer);
  messagesTypingResetTimer = null;
}

async function setThreadTypingState(threadId = "", isTyping = false) {
  const safeThreadId = String(threadId || "").trim();
  const current = getMessagesCurrentUser();
  if (!safeThreadId || !current?.uid) return;
  if (messagesTypingState === Boolean(isTyping)) return;
  messagesTypingState = Boolean(isTyping);
  const threadRef = getMessageThreadDocRef(safeThreadId);
  if (!threadRef) return;
  try {
    const payload = {
      [`typingByUid.${current.uid}`]: messagesTypingState,
      typingUpdatedAt: new Date().toISOString(),
      serverTypingUpdatedAt: getFirestoreServerTimestamp()
    };
    await withTimeout(
      threadRef.update(payload),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_typing_timeout"
    );
  } catch (err) {
    console.warn("Failed to update typing state", err);
  }
}

function handleComposerTypingInput() {
  const selectedThread = getSelectedMessageThread();
  const threadId = String(selectedThread?.id || "").trim();
  if (!threadId) return;
  setThreadTypingState(threadId, true).catch(() => {});
  clearMessagesTypingTimer();
  messagesTypingResetTimer = setTimeout(() => {
    setThreadTypingState(threadId, false).catch(() => {});
    messagesTypingResetTimer = null;
  }, 1600);
}

function maybeShowNativeMessageNotification(title, body) {
  if (typeof window === "undefined" || typeof window.Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const notification = new Notification(title, { body });
    window.setTimeout(() => notification.close(), 5000);
  } catch {
    // ignore notification API errors
  }
}

function normalizeMessageParticipantRole(role, email = "") {
  const normalizedRole = normalizeAuthRole(role);
  if (normalizedRole === "coach" || normalizedRole === "parent" || normalizedRole === "athlete") {
    return normalizedRole;
  }
  if (normalizedRole === "admin" || isForcedAdminEmail(email) || OFFICIAL_COACH_EMAILS.has(normalizeEmail(email))) {
    return "coach";
  }
  return "athlete";
}

function getMessagesCurrentUser() {
  const authUser = getAuthUser();
  if (!authUser?.id) return null;
  const profile = getProfile() || {};
  const email = normalizeEmail(authUser.email || profile.email || "");
  const role = normalizeMessageParticipantRole(profile.role || authUser.role, email);
  return {
    uid: String(authUser.id || "").trim(),
    email,
    role,
    name: String(profile.name || authUser.email || "").trim() || "User",
    photo: getProfilePhotoValue(profile),
    linkedCoachUid: String(profile.linkedCoachUid || "").trim(),
    linkedAthleteId: String(profile.linkedAthleteId || "").trim(),
    linkedAthleteUid: String(profile.linkedAthleteUid || "").trim(),
    status: normalizeParentVerificationStatus(profile.status)
  };
}

function isCoachMessagingUser(user) {
  return normalizeMessageParticipantRole(user?.role, user?.email) === "coach";
}

function getMessageThreadsCollectionRef() {
  if (!firebaseFirestoreInstance) return null;
  return firebaseFirestoreInstance.collection(FIREBASE_MESSAGE_THREADS_COLLECTION);
}

function getFirestoreServerTimestamp() {
  if (typeof firebase !== "undefined" && firebase.firestore?.FieldValue?.serverTimestamp) {
    return firebase.firestore.FieldValue.serverTimestamp();
  }
  return new Date().toISOString();
}

function getFirestoreArrayUnion(...values) {
  if (typeof firebase !== "undefined" && firebase.firestore?.FieldValue?.arrayUnion) {
    return firebase.firestore.FieldValue.arrayUnion(...values);
  }
  return values;
}

function messageTimestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return parseIsoTimestamp(value);
}

function formatMessageTimestamp(value) {
  const ms = messageTimestampToMillis(value);
  if (!ms) return "";
  const locale = currentLang === "es" ? "es-ES" : "en-US";
  return new Date(ms).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIMEZONE
  });
}

function buildDirectMessageThreadId(uidA, uidB) {
  return [String(uidA || "").trim(), String(uidB || "").trim()].filter(Boolean).sort().join("__");
}

function isTeamChatThread(thread = {}) {
  return String(thread?.id || "").trim() === TEAM_CHAT_THREAD_ID
    || String(thread?.threadKind || "").trim().toLowerCase() === "team";
}

function getDirectMessageThreadParticipantIds(threadId = "") {
  return uniqueMessageIds(
    String(threadId || "")
      .split("__")
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  ).sort();
}

function uniqueMessageIds(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const safeValue = String(value || "").trim();
    if (!safeValue || seen.has(safeValue)) return;
    seen.add(safeValue);
    result.push(safeValue);
  });
  return result;
}

function normalizeMessageContactRecord(uid, data = {}) {
  const base = normalizeManagedUserRecord(uid, data);
  return {
    ...base,
    role: normalizeMessageParticipantRole(base.role, base.email),
    displayRole: getRoleLabelEnglish(normalizeMessageParticipantRole(base.role, base.email))
  };
}

function normalizeMessageParticipantProfile(data = {}) {
  const email = normalizeEmail(data.email || "");
  const uid = String(data.uid || data.user_id || "").trim();
  return {
    uid,
    email,
    name: stripUserDisplayNumber(data.name || data.displayName || data.email || "") || "User",
    photo: getProfilePhotoValue(data),
    role: normalizeMessageParticipantRole(data.role, email),
    phone: String(data.phone || data.phoneNumber || data.mobile || data.cell || "").trim(),
    whatsapp: String(data.whatsapp || data.whatsappNumber || "").trim(),
    linkedCoachUid: String(data.linkedCoachUid || "").trim(),
    linkedAthleteId: String(data.linkedAthleteId || "").trim(),
    linkedAthleteUid: String(data.linkedAthleteUid || "").trim()
  };
}

function buildMessageParticipantProfiles(participants = []) {
  const byUid = new Map();
  participants.forEach((participant) => {
    const normalized = normalizeMessageParticipantProfile(participant || {});
    if (!normalized.uid) return;
    byUid.set(normalized.uid, normalized);
  });
  return Array.from(byUid.values()).sort((left, right) => left.uid.localeCompare(right.uid));
}

function buildMessageThreadPayload(participants = [], extras = {}) {
  const participantProfiles = buildMessageParticipantProfiles(participants);
  const participantIds = participantProfiles.map((participant) => participant.uid);
  const participantMap = participantIds.reduce((acc, uid) => {
    acc[uid] = true;
    return acc;
  }, {});
  const coachParticipant = participantProfiles.find((participant) => isCoachMessagingUser(participant)) || participantProfiles[0] || {};
  const userParticipant = participantProfiles.find((participant) => participant.uid !== coachParticipant.uid) || participantProfiles[1] || participantProfiles[0] || {};
  return stripUndefinedDeep({
    participantIds,
    participants: participantMap,
    participantProfiles: participantProfiles.map((participant) => ({
      uid: participant.uid,
      name: participant.name,
      email: participant.email,
      photo: getProfilePhotoValue(participant),
      role: participant.role,
      phone: participant.phone || "",
      whatsapp: participant.whatsapp || "",
      linkedCoachUid: participant.linkedCoachUid,
      linkedAthleteId: participant.linkedAthleteId,
      linkedAthleteUid: participant.linkedAthleteUid
    })),
    coachUid: coachParticipant.uid || "",
    coachName: coachParticipant.name || "",
    userUid: userParticipant.uid || "",
    userName: userParticipant.name || "",
    userRole: userParticipant.role || "athlete",
    threadKind: "direct",
    ...extras
  });
}

async function syncCurrentUserMessageParticipantPhoto(photo = "") {
  const current = getMessagesCurrentUser();
  const nextPhoto = String(photo || "").trim();
  if (!current?.uid) return;

  messagesThreadRows = messagesThreadRows.map((thread) => ({
    ...thread,
    participantProfiles: buildMessageParticipantProfiles(
      (Array.isArray(thread.participantProfiles) ? thread.participantProfiles : []).map((participant) =>
        participant.uid === current.uid ? { ...participant, photo: nextPhoto } : participant
      )
    )
  }));
  renderMessages();

  const threadsRef = getMessageThreadsCollectionRef();
  if (!threadsRef?.where) return;
  const snapshot = await withTimeout(
    threadsRef.where("participantIds", "array-contains", current.uid).get(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_message_photo_sync_timeout"
  );
  const updates = [];
  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    const profiles = buildMessageParticipantProfiles(
      Array.isArray(data.participantProfiles) ? data.participantProfiles : []
    );
    if (!profiles.some((participant) => participant.uid === current.uid)) return;
    const nextProfiles = profiles.map((participant) =>
      participant.uid === current.uid ? { ...participant, photo: nextPhoto } : participant
    );
    updates.push(doc.ref.set(stripUndefinedDeep({
      participantProfiles: nextProfiles,
      serverUpdatedAt: getFirestoreServerTimestamp()
    }), { merge: true }));
  });
  await Promise.all(updates);
}

function normalizeLooseTagList(raw = "") {
  if (Array.isArray(raw)) {
    return uniqueNames(raw.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean));
  }
  return uniqueNames(
    String(raw || "")
      .split(",")
      .map((tag) => String(tag || "").trim().toLowerCase())
      .filter(Boolean)
  );
}

function normalizeMessageAttachment(entry = {}) {
  const mediaType = String(entry.mediaType || entry.type || "").trim()
    || inferMediaTypeFromFile({ type: entry.contentType || entry.mimeType || "" })
    || "Media";
  const assetPath = String(
    entry.assetPath
      || entry.downloadURL
      || entry.downloadUrl
      || entry.url
      || entry.src
      || entry.mediaUrl
      || ""
  ).trim();
  return {
    id: String(entry.id || makeMediaId("msg_media")).trim(),
    mediaAssetId: String(entry.mediaAssetId || "").trim(),
    name: String(entry.name || "").trim() || mediaType,
    mediaType,
    assetPath,
    assetStoragePath: String(entry.assetStoragePath || entry.storagePath || entry.path || "").trim(),
    thumbnailPath: String(entry.thumbnailPath || entry.thumbnailURL || entry.thumbnailUrl || entry.poster || "").trim(),
    thumbnailStoragePath: String(entry.thumbnailStoragePath || entry.thumbnailStorage || "").trim(),
    contentType: String(entry.contentType || entry.mimeType || "").trim(),
    size: Number(entry.size || entry.fileSize || 0),
    tags: normalizeLooseTagList(entry.tags || [])
  };
}

function normalizeMessageText(rawText = "", attachments = []) {
  const safeText = String(rawText || "").trim();
  if (!attachments.length) return safeText;
  if (!safeText) return buildMessageAttachmentSummaryText(attachments);
  const normalized = normalizeName(safeText);
  const hasAlphanumeric = /[a-z0-9]/i.test(normalized);
  if (!hasAlphanumeric && safeText.length <= 3) {
    return buildMessageAttachmentSummaryText(attachments);
  }
  return safeText;
}

function normalizeMessageData(data = {}, id = "") {
  const attachments = Array.isArray(data.attachments)
    ? data.attachments.map((entry) => normalizeMessageAttachment(entry))
      .filter((entry) => entry.assetPath || entry.assetStoragePath)
    : [];
  return {
    id,
    clientMessageId: String(data.clientMessageId || "").trim(),
    text: normalizeMessageText(data.text || "", attachments),
    senderUid: String(data.senderUid || "").trim(),
    senderName: String(data.senderName || "").trim() || "User",
    senderRole: normalizeMessageParticipantRole(data.senderRole, data.senderEmail || ""),
    createdAt: data.createdAt || data.updatedAt || "",
    attachments,
    messageTags: normalizeLooseTagList(data.messageTags || []),
    read: Boolean(data.read),
    readByUid: String(data.readByUid || "").trim(),
    readAt: data.readAt || "",
    optimistic: Boolean(data.optimistic)
  };
}

function getMessageEntryIdentityKey(entry = {}) {
  const byId = String(entry.id || "").trim();
  if (byId) return `id:${byId}`;
  const byClientId = String(entry.clientMessageId || "").trim();
  if (byClientId) return `client:${byClientId}`;
  const sender = String(entry.senderUid || "").trim();
  const createdAt = String(entry.createdAt || "").trim();
  const text = String(entry.text || "").trim();
  return `fallback:${sender}:${createdAt}:${text}`;
}

function dedupeMessageEntries(rows = []) {
  const byKey = new Map();
  (Array.isArray(rows) ? rows : []).forEach((entry) => {
    if (!entry) return;
    const key = getMessageEntryIdentityKey(entry);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, entry);
      return;
    }
    const nextMillis = messageTimestampToMillis(entry.createdAt);
    const existingMillis = messageTimestampToMillis(existing.createdAt);
    if (nextMillis > existingMillis) {
      byKey.set(key, entry);
      return;
    }
    if (nextMillis === existingMillis) {
      if (!entry.optimistic && existing.optimistic) {
        byKey.set(key, entry);
        return;
      }
      if (entry.read && !existing.read) {
        byKey.set(key, entry);
      }
    }
  });
  return Array.from(byKey.values()).sort(
    (left, right) => messageTimestampToMillis(left.createdAt) - messageTimestampToMillis(right.createdAt)
  );
}

function normalizeMessageThreadRecord(doc) {
  const data = doc.data() || {};
  const historyRows = dedupeMessageEntries(Array.isArray(data.messageHistory)
    ? data.messageHistory
        .map((entry, index) => normalizeMessageData(entry || {}, `history-${index + 1}`))
        .filter((entry) => entry.text)
    : []);
  const latestHistoryEntry = historyRows[historyRows.length - 1] || null;
  const fallbackProfiles = [
    data.coachUid ? {
      uid: data.coachUid,
      name: data.coachName || "Coach",
      role: "coach"
    } : null,
    data.userUid ? {
      uid: data.userUid,
      name: data.userName || "User",
      role: data.userRole || "athlete"
    } : null
  ].filter(Boolean);
  const participantProfiles = buildMessageParticipantProfiles(
    Array.isArray(data.participantProfiles) && data.participantProfiles.length
      ? data.participantProfiles
      : fallbackProfiles
  );
  const participantIds = uniqueMessageIds(
    Array.isArray(data.participantIds)
      ? data.participantIds
      : participantProfiles.map((participant) => participant.uid)
  ).sort();
  return {
    id: doc.id,
    participantIds,
    participants: data.participants && typeof data.participants === "object" ? data.participants : {},
    participantProfiles,
    coachUid: String(data.coachUid || "").trim(),
    coachName: String(data.coachName || "").trim() || participantProfiles.find((participant) => participant.role === "coach")?.name || "Coach",
    userUid: String(data.userUid || "").trim(),
    userName: String(data.userName || "").trim() || participantProfiles.find((participant) => participant.uid !== data.coachUid)?.name || "User",
    userRole: normalizeMessageParticipantRole(data.userRole || participantProfiles.find((participant) => participant.uid !== data.coachUid)?.role || "athlete"),
    threadKind: String(data.threadKind || "").trim().toLowerCase() || "direct",
    title: String(data.title || "").trim(),
    typingByUid: data.typingByUid && typeof data.typingByUid === "object" ? data.typingByUid : {},
    lastMessageText: String(data.lastMessageText || latestHistoryEntry?.text || "").trim(),
    lastMessageAt: data.lastMessageAt || data.updatedAt || latestHistoryEntry?.createdAt || data.createdAt || "",
    lastSenderUid: String(data.lastSenderUid || latestHistoryEntry?.senderUid || "").trim(),
    messageHistory: historyRows,
    createdAt: data.createdAt || latestHistoryEntry?.createdAt || "",
    updatedAt: data.updatedAt || data.lastMessageAt || latestHistoryEntry?.createdAt || data.createdAt || ""
  };
}

function normalizeMessageEntry(doc) {
  return normalizeMessageData(doc.data() || {}, doc.id);
}

function createLocalMessageThreadRecord(threadId, participants = [], extras = {}) {
  const timestamp = extras.updatedAt || extras.createdAt || new Date().toISOString();
  const payload = buildMessageThreadPayload(participants, {
    createdAt: extras.createdAt || timestamp,
    updatedAt: extras.updatedAt || timestamp,
    lastMessageAt: extras.lastMessageAt || "",
    lastMessageText: extras.lastMessageText || "",
    lastSenderUid: extras.lastSenderUid || "",
    messageHistory: extras.messageHistory || []
  });
  return normalizeMessageThreadRecord({
    id: threadId,
    data: () => payload
  });
}

function getSelectedMessageThread() {
  return messagesThreadRows.find((thread) => thread.id === messagesSelectedThreadId) || null;
}

function getMessageOtherParticipantProfile(thread, currentUid) {
  if (isTeamChatThread(thread)) {
    return normalizeMessageParticipantProfile({
      uid: TEAM_CHAT_THREAD_ID,
      name: TEAM_CHAT_TITLE,
      role: "team"
    });
  }
  const participants = Array.isArray(thread?.participantProfiles) ? thread.participantProfiles : [];
  const otherParticipant = participants.find((participant) => participant.uid !== currentUid) || participants[0] || null;
  if (otherParticipant) return normalizeMessageParticipantProfile(otherParticipant);
  if (!thread) return normalizeMessageParticipantProfile({ role: "athlete" });
  if (thread.coachUid === currentUid) {
    return normalizeMessageParticipantProfile({
      uid: thread.userUid,
      name: thread.userName || "User",
      role: thread.userRole || "athlete"
    });
  }
  return normalizeMessageParticipantProfile({
    uid: thread.coachUid,
    name: thread.coachName || "Coach",
    role: "coach"
  });
}

function getMessageOtherParticipant(thread, currentUid) {
  const otherParticipant = getMessageOtherParticipantProfile(thread, currentUid);
  return {
    uid: otherParticipant.uid,
    name: otherParticipant.name || "User",
    photo: getProfilePhotoValue(otherParticipant),
    role: normalizeMessageParticipantRole(otherParticipant.role, otherParticipant.email || ""),
    email: normalizeEmail(otherParticipant.email || "")
  };
}

function dedupeMessageThreads(currentUid, items = []) {
  const byKey = new Map();
  items.forEach((thread) => {
    const otherParticipant = getMessageOtherParticipantProfile(thread, currentUid);
    const key = isTeamChatThread(thread) ? `thread:${TEAM_CHAT_THREAD_ID}` : getMessageContactIdentityKey(otherParticipant);
    const existing = byKey.get(key);
    if (!existing || messageTimestampToMillis(thread.updatedAt) > messageTimestampToMillis(existing.updatedAt)) {
      byKey.set(key, thread);
    }
  });
  return Array.from(byKey.values());
}

function getMessageRoleSortValue(role) {
  if (role === "coach") return 0;
  if (role === "athlete") return 1;
  if (role === "parent") return 2;
  return 3;
}

function sortMessageContacts(items = []) {
  return [...items].sort((left, right) => {
    const roleDelta = getMessageRoleSortValue(left.role) - getMessageRoleSortValue(right.role);
    if (roleDelta !== 0) return roleDelta;
    return String(left.name || "").localeCompare(String(right.name || ""), undefined, { sensitivity: "base" });
  });
}

function getMessageContactIdentityKey(contact = {}, current = getMessagesCurrentUser()) {
  const uid = String(contact?.uid || "").trim();
  if (uid) return `user:${uid}`;
  const email = normalizeEmail(contact?.email || "");
  if (email) return `email:${email}`;
  return `name:${normalizeName(contact?.name || "")}`;
}

function rankMessageContactCandidate(contact = {}) {
  let score = 0;
  if (contact.role === "athlete") {
    if (contact.linkedAthleteId) score += 120;
    if (contact.linkedAthleteUid && contact.linkedAthleteUid === contact.uid) score += 240;
    if (contact.linkedCoachUid) score += 40;
  }
  if (contact.email) score += 20;
  score += Math.min(Math.floor(parseIsoTimestamp(contact.updatedAt || contact.createdAt || "") / 10000000), 50);
  return score;
}

function dedupeMessageContacts(items = [], current = getMessagesCurrentUser()) {
  const byKey = new Map();
  items.forEach((contact) => {
    const key = getMessageContactIdentityKey(contact, current);
    const existing = byKey.get(key);
    if (!existing || rankMessageContactCandidate(contact) > rankMessageContactCandidate(existing)) {
      byKey.set(key, contact);
    }
  });
  return Array.from(byKey.values());
}

function getMessageThreadForContact(uid = "") {
  const current = getMessagesCurrentUser();
  const safeUid = String(uid || "").trim();
  if (!safeUid) return null;
  const canonicalThreadId = current?.uid ? buildDirectMessageThreadId(current.uid, safeUid) : "";
  return messagesThreadRows.find((thread) => thread.id === canonicalThreadId)
    || messagesThreadRows.find((thread) => thread.participantIds.includes(safeUid))
    || null;
}

function setMessagesStatus(copy, type = "") {
  messagesStatusCopy = copy;
  messagesStatusType = type;
  if (!messagesStatus) return;
  messagesStatus.textContent = pickCopy(copy);
  messagesStatus.dataset.state = type || "";
}

function resetMessagesStatus() {
  setMessagesStatus("", "");
}

function clearMessageContactSubscriptions() {
  messagesContactUnsubs.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // ignore unsubscribe errors
    }
  });
  messagesContactUnsubs = [];
  messagesContactSourceRows = new Map();
}

function rebuildMessageContactsDirectory(current = getMessagesCurrentUser()) {
  if (!current) {
    messagesContactRows = [];
    renderMessages();
    return;
  }
  const mergedRows = [];
  messagesContactSourceRows.forEach((rows) => {
    mergedRows.push(...rows);
  });
  messagesContactRows = sortMessageContacts(
    dedupeMessageContacts(
      mergedRows.filter((contact) => canMessageContact(current, contact)),
      current
    )
  );
  renderMessages();
}

function teardownMessagesSession({ preserveSelection = false } = {}) {
  if (messagesThreadsUnsub) {
    messagesThreadsUnsub();
    messagesThreadsUnsub = null;
  }
  if (messagesFeedUnsub) {
    messagesFeedUnsub();
    messagesFeedUnsub = null;
  }
  clearMessageContactSubscriptions();
  messagesSessionUid = "";
  messagesThreadRows = [];
  messagesContactRows = [];
  messagesFeedRows = [];
  messagesFeedLoading = false;
  messagesAutoOpeningContactUid = "";
  messagesSeenByThread = {};
  messagesNotifiedByThread = {};
  messagesThreadsPrimed = false;
  messagesThreadsSubscribedAt = 0;
  messagesThreadOpeningId = "";
  messagesThreadOpeningRequestId = 0;
  messagesSendInFlight = false;
  messagesLastSendByThread = {};
  messagesPendingEntriesByThread = {};
  messagesDeleteInFlightByMessage = {};
  messagesReadSyncInFlight = {};
  messagesAnimatedEntryState = {};
  messagesOpenRequestId = 0;
  messagesContactGroupOpenState = {};
  messagesContactGroupStateUid = "";
  messagesCompactThreadVisible = false;
  messagesTypingState = false;
  if (messagesTypingResetTimer) {
    clearTimeout(messagesTypingResetTimer);
    messagesTypingResetTimer = null;
  }
  stopVoiceMessageRecording({ discard: true });
  clearMessageComposerMediaInputs();
  if (!preserveSelection) messagesSelectedThreadId = "";
  resetMessagesStatus();
  updateMessagesUnreadIndicators();
}

function sortMessageThreads(items = []) {
  const byId = new Map();
  (Array.isArray(items) ? items : []).forEach((thread) => {
    if (!thread?.id) return;
    const existing = byId.get(thread.id);
    if (!existing) {
      byId.set(thread.id, thread);
      return;
    }
    const nextMillis = messageTimestampToMillis(thread.updatedAt || thread.lastMessageAt);
    const existingMillis = messageTimestampToMillis(existing.updatedAt || existing.lastMessageAt);
    if (nextMillis >= existingMillis) {
      byId.set(thread.id, thread);
    }
  });
  return Array.from(byId.values()).sort(
    (left, right) => {
      const leftTeam = isTeamChatThread(left) ? 1 : 0;
      const rightTeam = isTeamChatThread(right) ? 1 : 0;
      if (leftTeam !== rightTeam) return rightTeam - leftTeam;
      return messageTimestampToMillis(right.updatedAt || right.lastMessageAt) - messageTimestampToMillis(left.updatedAt || left.lastMessageAt);
    }
  );
}

function sortMessageThreadsForInbox(items = [], current = getMessagesCurrentUser()) {
  return items.slice().sort((left, right) => {
    const leftTeam = isTeamChatThread(left) ? 1 : 0;
    const rightTeam = isTeamChatThread(right) ? 1 : 0;
    if (leftTeam !== rightTeam) return rightTeam - leftTeam;
    const leftUnread = isMessageThreadUnread(left, current) ? 1 : 0;
    const rightUnread = isMessageThreadUnread(right, current) ? 1 : 0;
    if (leftUnread !== rightUnread) return rightUnread - leftUnread;
    return messageTimestampToMillis(right.lastMessageAt || right.updatedAt) - messageTimestampToMillis(left.lastMessageAt || left.updatedAt);
  });
}

function isMessageParentStatusAllowed(status = "") {
  const normalized = normalizeParentVerificationStatus(status);
  return normalized === "pending_verification" || normalized === "verified";
}

function isCoachLinkedAthletePair(coachRecord = {}, athleteRecord = {}) {
  if (!coachRecord?.uid || !athleteRecord?.uid) return false;
  if (normalizeMessageParticipantRole(athleteRecord.role, athleteRecord.email) !== "athlete") return false;
  return String(athleteRecord.linkedCoachUid || "").trim() === String(coachRecord.uid || "").trim();
}

function isCoachLinkedParentPair(coachRecord = {}, parentRecord = {}) {
  if (!coachRecord?.uid || !parentRecord?.uid) return false;
  if (normalizeMessageParticipantRole(parentRecord.role, parentRecord.email) !== "parent") return false;
  if (!isMessageParentStatusAllowed(parentRecord.status)) return false;
  return String(parentRecord.linkedCoachUid || "").trim() === String(coachRecord.uid || "").trim();
}

function canMessageContact(current, candidate) {
  if (!current?.uid || !candidate?.uid || candidate.uid === current.uid) return false;
  const currentRole = normalizeMessageParticipantRole(current.role, current.email || "");
  const candidateRole = normalizeMessageParticipantRole(candidate.role, candidate.email || "");
  if (currentRole === "parent") {
    if (candidateRole !== "coach") return false;
    if (!isMessageParentStatusAllowed(current.status)) return false;
    const linkedCoachUid = String(current.linkedCoachUid || getParentLinkedCoachUid() || "").trim();
    return Boolean(linkedCoachUid && candidate.uid === linkedCoachUid);
  }
  if (currentRole === "athlete") {
    if (candidateRole !== "coach") return false;
    const linkedCoachUid = String(current.linkedCoachUid || getAthleteLinkedCoachUid() || "").trim();
    return Boolean(linkedCoachUid && candidate.uid === linkedCoachUid);
  }
  if (currentRole === "coach") {
    if (candidateRole === "coach") return true;
    if (candidateRole === "athlete") return isCoachLinkedAthletePair(current, candidate);
    if (candidateRole === "parent") return isCoachLinkedParentPair(current, candidate);
    return false;
  }
  return false;
}

function getKnownMessageContactByUid(uid = "") {
  const safeUid = String(uid || "").trim();
  if (!safeUid) return null;
  const sources = [
    messagesContactRows,
    coachParentApprovalsCache,
    coachAthleteDirectoryCache,
    coachDirectoryCache,
    athletePortalLinkedParentsCache,
    adminUsersCache
  ];
  for (const rows of sources) {
    const found = (Array.isArray(rows) ? rows : []).find((row) => String(row?.uid || "").trim() === safeUid);
    if (found) return found;
  }
  return null;
}

function resolveMessageThreadContact(thread = {}, currentUid = "") {
  if (isTeamChatThread(thread)) {
    return normalizeMessageContactRecord(TEAM_CHAT_THREAD_ID, {
      uid: TEAM_CHAT_THREAD_ID,
      name: TEAM_CHAT_TITLE,
      role: "team"
    });
  }
  const otherProfile = getMessageOtherParticipantProfile(thread, currentUid);
  const known = getKnownMessageContactByUid(otherProfile?.uid);
  if (known) return normalizeMessageContactRecord(known.uid, known);
  if (!otherProfile?.uid) return null;
  return normalizeMessageContactRecord(otherProfile.uid, {
    uid: otherProfile.uid,
    email: otherProfile.email || "",
    name: otherProfile.name || "",
    role: otherProfile.role || "",
    linkedCoachUid: otherProfile.linkedCoachUid || "",
    linkedAthleteId: otherProfile.linkedAthleteId || "",
    linkedAthleteUid: otherProfile.linkedAthleteUid || "",
    status: normalizeParentVerificationStatus(otherProfile.status)
  });
}

function canMessageThread(current = getMessagesCurrentUser(), thread = null) {
  if (!current?.uid || !thread?.id) return false;
  const participantIds = Array.isArray(thread.participantIds)
    ? thread.participantIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (!participantIds.includes(current.uid)) return false;
  if (isTeamChatThread(thread)) return true;
  const candidate = resolveMessageThreadContact(thread, current.uid);
  return canMessageContact(current, candidate);
}

function getMessageLoadErrorCopy(err = null) {
  const code = String(err?.code || err?.message || "").toLowerCase();
  if (code.includes("permission-denied")) {
    return MESSAGES_COPY.loadPermissionDenied;
  }
  if (code.includes("unauthenticated") || code.includes("auth")) {
    return MESSAGES_COPY.loadPendingAuth;
  }
  return MESSAGES_COPY.loadError;
}

async function loadMessageContactsDirectory() {
  const current = getMessagesCurrentUser();
  if (!current || !firebaseFirestoreInstance) {
    messagesContactRows = [];
    clearMessageContactSubscriptions();
    return;
  }

  const usersRef = firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION);
  try {
    const snapshot = await withTimeout(
      usersRef.get(),
      FIREBASE_OP_TIMEOUT_MS * 2,
      "firestore_message_contacts_timeout"
    );
    const contacts = snapshot.docs
      .map((doc) => normalizeMessageContactRecord(doc.id, doc.data() || {}))
      .filter((contact) => Boolean(contact.uid));
    messagesContactRows = sortMessageContacts(dedupeMessageContacts(
      contacts.filter((contact) => canMessageContact(current, contact)),
      current
    ));
  } catch (err) {
    const code = String(err?.code || err?.message || "").toLowerCase();
    if (!code.includes("permission-denied")) {
      console.warn("Failed to load message contacts", err);
    }
    messagesContactRows = [];
    setMessagesStatus(getMessageLoadErrorCopy(err), "error");
  }
}

function subscribeToMessageContacts(current) {
  if (!current || !firebaseFirestoreInstance) return;
  clearMessageContactSubscriptions();
  const usersRef = firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION);
  const unsubscribe = usersRef.onSnapshot((snapshot) => {
      messagesContactSourceRows.set(
        "all",
        snapshot.docs.map((doc) => normalizeMessageContactRecord(doc.id, doc.data() || {}))
      );
      rebuildMessageContactsDirectory(current);
    }, (err) => {
      const code = String(err?.code || err?.message || "").toLowerCase();
      if (!code.includes("permission-denied")) {
        console.warn("Failed to subscribe to contacts", err);
      }
      setMessagesStatus(getMessageLoadErrorCopy(err), "error");
      renderMessages();
    });
  messagesContactUnsubs.push(unsubscribe);
}

function subscribeToMessageFeed(threadId) {
  if (messagesFeedUnsub) {
    messagesFeedUnsub();
    messagesFeedUnsub = null;
  }
  messagesFeedRows = [];
  if (!threadId) return;

  const threadsRef = getMessageThreadsCollectionRef();
  if (!threadsRef) return;
  messagesFeedLoading = true;
  setMessagesStatus(MESSAGES_COPY.loadingFeed, "");
  renderMessages();
  messagesFeedUnsub = threadsRef
    .doc(threadId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      const remoteRows = dedupeMessageEntries(snapshot.docs.map((doc) => normalizeMessageEntry(doc)));
      remoteRows.forEach((entry) => {
        if (entry.clientMessageId) {
          removePendingThreadEntry(threadId, entry.clientMessageId);
        }
      });
      messagesFeedRows = dedupeMessageEntries(mergePendingMessagesIntoFeed(threadId, remoteRows));
      messagesFeedLoading = false;
      resetMessagesStatus();
      renderMessages();
      markSelectedMessageThreadSeen();
      syncThreadReadReceipts(threadId, remoteRows).catch((err) => {
        console.warn("Read receipt sync failed", err);
      });
      if (messagesFeed) {
        requestAnimationFrame(() => {
          messagesFeed.scrollTop = messagesFeed.scrollHeight;
        });
      }
    }, (err) => {
      const code = String(err?.code || err?.message || "").toLowerCase();
      if (!code.includes("permission-denied")) {
        console.warn("Failed to subscribe to message feed", err);
      }
      messagesFeedLoading = false;
      setMessagesStatus(getMessageLoadErrorCopy(err), "error");
      renderMessages();
    });
}

function selectMessageThread(threadId, { openInCompact = false } = {}) {
  if (!threadId) return;
  const previousThreadId = String(messagesSelectedThreadId || "").trim();
  if (previousThreadId && previousThreadId !== threadId) {
    clearMessagesTypingTimer();
    setThreadTypingState(previousThreadId, false).catch(() => {});
  }
  if (openInCompact) {
    messagesCompactThreadVisible = true;
  }
  if (messagesSelectedThreadId === threadId) {
    markSelectedMessageThreadSeen();
    renderMessages();
    return;
  }
  messagesSelectedThreadId = threadId;
  subscribeToMessageFeed(threadId);
  setMessageVoiceStatus("", "");
  renderMessages();
  markSelectedMessageThreadSeen();
}

function ensureSelectedMessageThread() {
  const current = getMessagesCurrentUser();
  if (messagesSelectedThreadId && (
    messagesThreadRows.some((thread) => (
      thread.id === messagesSelectedThreadId
      && canMessageThread(current, thread)
      && !isMessageThreadPendingDelete(thread)
    ))
    || messagesThreadOpeningId === messagesSelectedThreadId
  )) {
    return;
  }
  const firstThread = messagesThreadRows.find((thread) => canMessageThread(current, thread) && !isMessageThreadPendingDelete(thread)) || null;
  messagesSelectedThreadId = firstThread?.id || "";
  subscribeToMessageFeed(messagesSelectedThreadId);
}

function isMessageThreadOpening(threadId = "") {
  const safeThreadId = String(threadId || "").trim();
  return Boolean(
    safeThreadId
    && messagesThreadOpeningId === safeThreadId
    && Number(messagesThreadOpeningRequestId || 0)
  );
}

function subscribeToMessageThreads(current) {
  const threadsRef = getMessageThreadsCollectionRef();
  const uid = String(current?.uid || "").trim();
  if (!threadsRef || !uid) return;
  if (messagesThreadsUnsub) {
    messagesThreadsUnsub();
    messagesThreadsUnsub = null;
  }

  setMessagesStatus(MESSAGES_COPY.loading, "");
  messagesThreadsSubscribedAt = Date.now();
  messagesThreadsUnsub = threadsRef
    .where("participantIds", "array-contains", uid)
    .onSnapshot((snapshot) => {
      const previousRowsById = new Map(messagesThreadRows.map((thread) => [thread.id, thread]));
      const syncedRows = sortMessageThreads(
        dedupeMessageThreads(uid, snapshot.docs.map((doc) => normalizeMessageThreadRecord(doc)))
      );
      const pendingLocalRows = messagesThreadRows.filter((thread) => (
        (thread.id === messagesSelectedThreadId || thread.id === messagesThreadOpeningId)
        && !syncedRows.some((item) => item.id === thread.id)
      ));
      const nextRows = sortMessageThreads(
        dedupeMessageThreads(uid, [...syncedRows, ...pendingLocalRows])
      );
      messagesThreadRows = nextRows.filter((thread) => canMessageThread(current, thread));
      ensureSelectedMessageThread();
      const allowRecentFirstSnapshotNotifications = !messagesThreadsPrimed;
      messagesThreadRows.forEach((thread) => {
        const lastMessageMillis = messageTimestampToMillis(thread.lastMessageAt || thread.updatedAt);
        if (!lastMessageMillis || !thread.lastSenderUid || thread.lastSenderUid === uid) return;
        const previousThread = previousRowsById.get(thread.id);
        const previousLastMillis = messageTimestampToMillis(previousThread?.lastMessageAt || previousThread?.updatedAt);
        const isRecentFirstSnapshot = allowRecentFirstSnapshotNotifications
          && !previousThread
          && lastMessageMillis >= (messagesThreadsSubscribedAt - 1500);
        if (!isRecentFirstSnapshot && lastMessageMillis <= previousLastMillis) return;
        if (!document.hidden && isMessagesPanelFocused() && thread.id === messagesSelectedThreadId) {
          markMessageThreadSeen(thread.id, lastMessageMillis);
          return;
        }
        if (messagesNotifiedByThread[thread.id] === lastMessageMillis) return;
        messagesNotifiedByThread = {
          ...messagesNotifiedByThread,
          [thread.id]: lastMessageMillis
        };
        const other = getMessageOtherParticipant(thread, uid);
        const preview = thread.lastMessageText || pickCopy(MESSAGES_COPY.noMessages);
        pushAppToast({
          title: other.name || pickCopy(MESSAGES_COPY.title),
          body: preview,
          tone: "info",
          onClick: () => {
            Promise.resolve(showTab("messages")).finally(() => {
              selectMessageThread(thread.id, { openInCompact: true });
              markMessageThreadSeen(thread.id, lastMessageMillis);
            });
          }
        });
        maybeShowNativeMessageNotification(other.name || pickCopy(MESSAGES_COPY.title), preview);
      });
      messagesThreadsPrimed = true;
      resetMessagesStatus();
      renderMessages();
      markSelectedMessageThreadSeen();
      updateMessagesUnreadIndicators();
      if (isAthleteRole(getProfile()?.role) && getAthleteLinkedCoachUid()) {
        renderTodayActionQueue();
      }
	    }, (err) => {
	      const code = String(err?.code || err?.message || "").toLowerCase();
	      if (!code.includes("permission-denied")) {
	        console.warn("Failed to subscribe to threads", err);
	      }
	      messagesThreadRows = [];
	      setMessagesStatus(getMessageLoadErrorCopy(err), "error");
	      updateMessagesUnreadIndicators();
	      renderMessages();
	    });
}

function buildTeamChatParticipantProfiles(current = getMessagesCurrentUser(), existingProfiles = []) {
  return buildMessageParticipantProfiles([
    ...(Array.isArray(existingProfiles) ? existingProfiles : []),
    current
  ].filter(Boolean));
}

function createLocalTeamChatThreadRecord(current = getMessagesCurrentUser(), existing = {}) {
  const timestamp = existing.updatedAt || existing.createdAt || new Date().toISOString();
  const participantProfiles = buildTeamChatParticipantProfiles(current, existing.participantProfiles || []);
  const participantIds = uniqueMessageIds([
    ...(Array.isArray(existing.participantIds) ? existing.participantIds : []),
    ...participantProfiles.map((participant) => participant.uid)
  ]).sort();
  return normalizeMessageThreadRecord({
    id: TEAM_CHAT_THREAD_ID,
    data: () => ({
      threadKind: "team",
      title: TEAM_CHAT_TITLE,
      participantIds,
      participants: participantIds.reduce((acc, uid) => {
        acc[uid] = true;
        return acc;
      }, {}),
      participantProfiles,
      createdAt: existing.createdAt || timestamp,
      updatedAt: timestamp,
      lastMessageAt: existing.lastMessageAt || "",
      lastMessageText: existing.lastMessageText || "",
      lastSenderUid: existing.lastSenderUid || "",
      messageHistory: existing.messageHistory || []
    })
  });
}

async function ensureTeamChatThread(current = getMessagesCurrentUser()) {
  const threadsRef = getMessageThreadsCollectionRef();
  if (!current?.uid || !threadsRef) return null;
  const threadRef = threadsRef.doc(TEAM_CHAT_THREAD_ID);
  const now = new Date().toISOString();
  const snapshot = await withTimeout(
    threadRef.get(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_team_chat_get_timeout"
  );
  const existingData = snapshot?.exists ? (snapshot.data() || {}) : {};
  const participantProfiles = buildTeamChatParticipantProfiles(current, existingData.participantProfiles || []);
  const participantIds = uniqueMessageIds([
    ...(Array.isArray(existingData.participantIds) ? existingData.participantIds : []),
    ...participantProfiles.map((participant) => participant.uid),
    current.uid
  ]).sort();
  const participants = participantIds.reduce((acc, uid) => {
    acc[uid] = true;
    return acc;
  }, {});
  const payload = stripUndefinedDeep({
    threadKind: "team",
    title: TEAM_CHAT_TITLE,
    participantIds,
    participants,
    participantProfiles: participantProfiles.map((participant) => ({
      uid: participant.uid,
      name: participant.name,
      email: participant.email,
      photo: getProfilePhotoValue(participant),
      role: participant.role,
      phone: participant.phone || "",
      whatsapp: participant.whatsapp || "",
      linkedCoachUid: participant.linkedCoachUid,
      linkedAthleteId: participant.linkedAthleteId,
      linkedAthleteUid: participant.linkedAthleteUid
    })),
    createdAt: existingData.createdAt || now,
    updatedAt: existingData.updatedAt || now,
    lastMessageAt: existingData.lastMessageAt || "",
    lastMessageText: existingData.lastMessageText || "",
    lastSenderUid: existingData.lastSenderUid || "",
    serverUpdatedAt: getFirestoreServerTimestamp()
  });
  await withTimeout(
    threadRef.set(payload, { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_team_chat_set_timeout"
  );
  const localRecord = createLocalTeamChatThreadRecord(current, {
    ...existingData,
    ...payload
  });
  messagesThreadRows = sortMessageThreads([localRecord, ...messagesThreadRows]);
  if (!messagesSelectedThreadId) {
    selectMessageThread(TEAM_CHAT_THREAD_ID, { openInCompact: false });
  }
  return TEAM_CHAT_THREAD_ID;
}

async function startMessagesRealtimeSync({ forceRefreshContacts = false } = {}) {
  const current = getMessagesCurrentUser();
  if (!current || !firebaseFirestoreInstance) {
    teardownMessagesSession();
    renderMessages();
    return;
  }

  if (!getFirebaseSessionSnapshot()?.id) {
    await waitForInitialFirebaseUser(2500);
  }
  if (!getFirebaseSessionSnapshot()?.id) {
    teardownMessagesSession();
    setMessagesStatus(MESSAGES_COPY.loadPendingAuth, "");
    renderMessages();
    return;
  }

  if (messagesSessionUid !== current.uid) {
    teardownMessagesSession();
    messagesSessionUid = current.uid;
    messagesSeenByThread = loadMessageSeenState(current.uid);
    messagesNotifiedByThread = {};
    messagesThreadsPrimed = false;
    renderMessages();
    await loadMessageContactsDirectory();
    await ensureTeamChatThread(current).catch((err) => {
      console.warn("Failed to ensure team chat", err);
    });
    subscribeToMessageThreads(current);
    subscribeToMessageContacts(current);
  } else {
    if (forceRefreshContacts || (!messagesContactRows.length && !messagesContactUnsubs.length)) {
      await loadMessageContactsDirectory();
    }
    await ensureTeamChatThread(current).catch((err) => {
      console.warn("Failed to ensure team chat", err);
    });
    if (!messagesThreadsUnsub) {
      subscribeToMessageThreads(current);
    }
    if (!messagesContactUnsubs.length || forceRefreshContacts) {
      subscribeToMessageContacts(current);
    }
  }
  updateMessagesUnreadIndicators();
  renderMessages();
  markSelectedMessageThreadSeen();
}

async function ensureMessagesSession() {
  await startMessagesRealtimeSync();
}

async function refreshMessageContactsDirectory() {
  const current = getMessagesCurrentUser();
  if (!current || !firebaseFirestoreInstance) return;
  await loadMessageContactsDirectory();
  if (!messagesContactUnsubs.length) {
    subscribeToMessageContacts(current);
  }
  renderMessages();
}

async function findOrHydrateMessageContact(contactUid) {
  const safeUid = String(contactUid || "").trim();
  if (!safeUid || !firebaseFirestoreInstance) return null;
  let contact = messagesContactRows.find((item) => item.uid === safeUid) || null;
  if (contact) return contact;
  try {
    const snapshot = await withTimeout(
      firebaseFirestoreInstance.collection(FIREBASE_USERS_COLLECTION).doc(safeUid).get(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_contact_timeout"
    );
    if (!snapshot.exists) return null;
    contact = normalizeMessageContactRecord(snapshot.id, snapshot.data() || {});
    const current = getMessagesCurrentUser();
    if (current && canMessageContact(current, contact)) {
      messagesContactRows = sortMessageContacts([...messagesContactRows, contact]);
      return contact;
    }
  } catch (err) {
    console.warn("Failed to load message contact", err);
  }
  return null;
}

async function ensureDirectMessageThread(contact) {
  const current = getMessagesCurrentUser();
  const threadsRef = getMessageThreadsCollectionRef();
  if (!current || !threadsRef || !contact?.uid) {
    throw new Error("firestore_not_configured");
  }
  if (!canMessageContact(current, contact)) {
    const err = new Error("message_contact_not_allowed");
    err.code = "message_contact_not_allowed";
    throw err;
  }

  const participantProfiles = buildMessageParticipantProfiles([current, contact]);
  const expectedParticipantIds = uniqueMessageIds(participantProfiles.map((participant) => participant.uid)).sort();
  if (expectedParticipantIds.length < 2) {
    throw new Error("firestore_not_configured");
  }
  const threadId = buildDirectMessageThreadId(current.uid, contact.uid);
  const threadRef = threadsRef.doc(threadId);
  let existing = null;
  try {
    existing = await withTimeout(threadRef.get(), FIREBASE_OP_TIMEOUT_MS, "firestore_thread_read_timeout");
  } catch (err) {
    const code = String(err?.code || err?.message || "");
    if (!code.includes("permission-denied")) {
      throw err;
    }
  }
  const existingData = existing?.exists ? (existing.data() || {}) : {};
  const existingParticipantIds = uniqueMessageIds(
    Array.isArray(existingData.participantIds) ? existingData.participantIds : []
  ).sort();
  const sameParticipants = existingParticipantIds.length === expectedParticipantIds.length
    && expectedParticipantIds.every((uid, index) => uid === existingParticipantIds[index]);
  const existingProfileUidSet = new Set(
    buildMessageParticipantProfiles(
      Array.isArray(existingData.participantProfiles) ? existingData.participantProfiles : []
    ).map((participant) => participant.uid)
  );
  const missingParticipantProfiles = expectedParticipantIds.some((uid) => !existingProfileUidSet.has(uid));
  const needsParticipantRepair = Boolean(existing?.exists) && (!sameParticipants || missingParticipantProfiles);

  if (!existing?.exists || needsParticipantRepair) {
    const now = new Date().toISOString();
    const createdAt = existingData.createdAt || now;
    const updatedAt = existingData.updatedAt || existingData.lastMessageAt || now;
    const payload = !existing?.exists
      ? buildMessageThreadPayload(participantProfiles, {
          createdAt,
          updatedAt,
          serverCreatedAt: getFirestoreServerTimestamp(),
          serverUpdatedAt: getFirestoreServerTimestamp(),
          lastMessageAt: "",
          lastMessageText: "",
          lastSenderUid: "",
          messageHistory: []
        })
      : buildMessageThreadPayload(participantProfiles, {
          createdAt,
          updatedAt,
          serverUpdatedAt: getFirestoreServerTimestamp(),
          lastMessageAt: existingData.lastMessageAt || updatedAt,
          lastMessageText: String(existingData.lastMessageText || "").trim(),
          lastSenderUid: String(existingData.lastSenderUid || "").trim()
        });
    await withTimeout(
      threadRef.set(payload, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_thread_write_timeout"
    );
  }
  return threadId;
}

async function appendMessageToThread({
  threadId,
  participants = [],
  sender,
  text,
  attachments = [],
  messageTags = [],
  clientMessageId = "",
  createdAt = ""
}) {
  const threadsRef = getMessageThreadsCollectionRef();
  const safeThreadId = String(threadId || "").trim();
  const isTeamThread = safeThreadId === TEAM_CHAT_THREAD_ID;
  const safeText = String(text || "").trim();
  const senderProfile = normalizeMessageParticipantProfile(sender || {});
  const participantProfiles = buildMessageParticipantProfiles(participants);
  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.map((entry) => normalizeMessageAttachment(entry)).filter((entry) => entry.assetPath)
    : [];
  const normalizedTags = normalizeLooseTagList(messageTags);
  if (!threadsRef || !safeThreadId || !safeText || !senderProfile.uid || (!isTeamThread && participantProfiles.length < 2)) {
    throw new Error("firestore_not_configured");
  }
  const threadRef = threadsRef.doc(safeThreadId);
  const messageRef = threadRef.collection("messages").doc();
  const localMessage = {
    id: messageRef.id,
    clientMessageId: String(clientMessageId || "").trim() || `client-${senderProfile.uid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: safeText,
    senderUid: senderProfile.uid,
    senderName: senderProfile.name,
    senderRole: senderProfile.role,
    createdAt: String(createdAt || "").trim() || new Date().toISOString(),
    attachments: normalizedAttachments,
    messageTags: normalizedTags,
    read: false,
    readByUid: "",
    readAt: ""
  };
  const messagePayload = {
    threadId: safeThreadId,
    clientMessageId: localMessage.clientMessageId,
    text: safeText,
    senderUid: senderProfile.uid,
    senderName: senderProfile.name,
    senderRole: senderProfile.role,
    createdAt: localMessage.createdAt,
    serverCreatedAt: getFirestoreServerTimestamp(),
    attachments: normalizedAttachments,
    messageTags: normalizedTags,
    read: false,
    readByUid: "",
    readAt: ""
  };
  const threadPayload = buildMessageThreadPayload(participantProfiles.length ? participantProfiles : [senderProfile], {
    ...(isTeamThread ? { threadKind: "team", title: TEAM_CHAT_TITLE } : {}),
    updatedAt: localMessage.createdAt,
    lastMessageAt: localMessage.createdAt,
    serverUpdatedAt: getFirestoreServerTimestamp(),
    serverLastMessageAt: getFirestoreServerTimestamp(),
    lastMessageText: safeText,
    lastSenderUid: senderProfile.uid,
    messageHistory: getFirestoreArrayUnion(localMessage)
  });
  const batch = firebaseFirestoreInstance?.batch?.();
  if (batch) {
    batch.set(messageRef, messagePayload);
    batch.set(threadRef, threadPayload, { merge: true });
    await withTimeout(
      batch.commit(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_batch_commit_timeout"
    );
  } else {
    await withTimeout(
      messageRef.set(messagePayload),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_write_timeout"
    );
    await withTimeout(
      threadRef.set(threadPayload, { merge: true }),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_thread_touch_timeout"
    );
  }
  return localMessage;
}

async function openMessageThreadForContact(contactRef) {
  const current = getMessagesCurrentUser();
  const requestId = Date.now() + Math.random();
  messagesOpenRequestId = requestId;
  const contact = typeof contactRef === "object" && contactRef?.uid
    ? contactRef
    : await findOrHydrateMessageContact(contactRef);
  if (messagesOpenRequestId !== requestId) return;
  if (!contact || !current) return;
  if (!canMessageContact(current, contact)) {
    setMessagesStatus({
      en: "You can only message linked coach-athlete-parent accounts.",
      es: "Solo puedes enviar mensajes a cuentas vinculadas de coach-atleta-padre."
    }, "error");
    renderMessages();
    return;
  }
  const threadId = buildDirectMessageThreadId(current.uid, contact.uid);
  try {
    const existingThread = messagesThreadRows.find((thread) => thread.id === threadId) || null;
    if (!existingThread) {
      messagesThreadRows = sortMessageThreads([
        createLocalMessageThreadRecord(threadId, [current, contact]),
        ...messagesThreadRows
      ]);
    }
    selectMessageThread(threadId, { openInCompact: true });
    messagesThreadOpeningId = threadId;
    messagesThreadOpeningRequestId = requestId;
    renderMessages();
    await ensureDirectMessageThread(contact);
    if (messagesOpenRequestId !== requestId) return;
    subscribeToMessageFeed(threadId);
    if (messagesThreadOpeningRequestId === requestId) {
      messagesThreadOpeningId = "";
      messagesThreadOpeningRequestId = 0;
      resetMessagesStatus();
      renderMessages();
    }
  } catch (err) {
    if (messagesThreadOpeningRequestId === requestId) {
      messagesThreadOpeningId = "";
      messagesThreadOpeningRequestId = 0;
    }
    console.warn("Failed to open direct thread", err);
    setMessagesStatus(MESSAGES_COPY.loadError, "error");
    renderMessages();
  } finally {
    if (messagesThreadOpeningRequestId === requestId) {
      messagesThreadOpeningId = "";
      messagesThreadOpeningRequestId = 0;
      renderMessages();
    }
  }
}

async function openDirectMessageThreadWithRetry(contactUid, attempts = 5) {
  const safeContactUid = String(contactUid || "").trim();
  if (!safeContactUid) return false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await ensureMessagesSession().catch(() => {});
    await loadMessageContactsDirectory().catch(() => {});
    await openMessageThreadForContact(safeContactUid);
    const selected = getSelectedMessageThread();
    if (selected?.participantIds?.includes(safeContactUid)) {
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return false;
}

function getGroupedMessageContacts(current) {
  const rows = [...messagesContactRows];
  const coaches = rows.filter((contact) => contact.role === "coach");
  const athletes = rows.filter((contact) => contact.role === "athlete");
  const parents = rows.filter((contact) => contact.role === "parent");

  if (isParentRole(current?.role)) {
    return [
      { key: "coach", title: pickCopy(MESSAGES_COPY.coachesSection), rows: coaches, priority: true }
    ].filter((group) => group.rows.length);
  }

  if (isAthleteRole(current?.role)) {
    return [
      { key: "coach", title: pickCopy(MESSAGES_COPY.coachesSection), rows: coaches, priority: true },
      { key: "athlete", title: pickCopy(MESSAGES_COPY.athletesSection), rows: athletes, priority: false }
    ].filter((group) => group.rows.length);
  }

  if (isCoachMessagingUser(current)) {
    return [
      { key: "athlete", title: pickCopy(MESSAGES_COPY.athletesSection), rows: athletes, priority: true },
      { key: "coach", title: pickCopy(MESSAGES_COPY.coachesSection), rows: coaches, priority: false },
      { key: "parent", title: pickCopy(MESSAGES_COPY.parentsSection), rows: parents, priority: false }
    ].filter((group) => group.rows.length);
  }

  return [
    { key: "coach", title: pickCopy(MESSAGES_COPY.coachesSection), rows: coaches, priority: true },
    { key: "athlete", title: pickCopy(MESSAGES_COPY.athletesSection), rows: athletes, priority: false },
    { key: "parent", title: pickCopy(MESSAGES_COPY.parentsSection), rows: parents, priority: false }
  ].filter((group) => group.rows.length);
}

function buildMessageContactCard(contact, current, { priority = false, onSelect = null } = {}) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `messages-coach-card messages-contact-chip${priority ? " messages-contact-priority" : ""}`;
  const linkedThread = getMessageThreadForContact(contact.uid);
  if (linkedThread && linkedThread.id === messagesSelectedThreadId) {
    card.classList.add("active");
  }
  const roleLabel = getRoleLabelEnglish(contact.role);
  const secondaryLine = contact.role === "athlete" && contact.linkedCoachUid
    ? `${roleLabel} - ${currentLang === "es" ? "Mismo staff" : "Same staff"}`
    : roleLabel;
  card.innerHTML = `
    <span class="messages-contact-chip-main">
      <span class="wpl-avatar wpl-avatar-sm messages-contact-avatar"></span>
      <span class="messages-contact-chip-copy">
        <span class="messages-contact-name">${escapeHtml(contact.name || contact.email || "Contact")}</span>
        <span class="messages-contact-meta">${escapeHtml(secondaryLine)}</span>
      </span>
    </span>
  `;
  renderAvatarElement(card.querySelector(".messages-contact-avatar"), {
    photo: getProfilePhotoValue(contact),
    name: contact.name || contact.email || "Contact",
    fallback: "U"
  });
  card.title = String(contact.email || contact.name || "Contact");
  card.addEventListener("click", () => {
    if (typeof onSelect === "function") {
      onSelect(contact);
      return;
    }
    setMessagesContactGroupOpen(contact.role, true);
    openMessageThreadForContact(contact);
  });
  return card;
}

function buildMessageContactSubgroups(group) {
  if (!group?.rows?.length) return [];
  if (group.key !== "athlete") {
    return [{
      label: "",
      rows: group.rows
    }];
  }
  const buckets = new Map();
  group.rows.forEach((contact) => {
    const source = String(contact.name || contact.email || "").trim();
    const first = source.charAt(0).toUpperCase();
    const label = /^[A-Z]$/.test(first) ? first : "#";
    const rows = buckets.get(label) || [];
    rows.push(contact);
    buckets.set(label, rows);
  });
  return Array.from(buckets.entries())
    .sort((left, right) => left[0].localeCompare(right[0], undefined, { sensitivity: "base" }))
    .map(([label, rows]) => ({ label, rows }));
}

function renderMessageContactDirectory(
  targetEl,
  current,
  { onContactSelect = null, showToggle = true, forceExpanded = false } = {}
) {
  if (!targetEl) return;
  targetEl.innerHTML = "";

  if (!messagesContactRows.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(MESSAGES_COPY.emptyBodyNoContacts);
    targetEl.appendChild(empty);
    return;
  }

  const groupedContacts = getGroupedMessageContacts(current);
  ensureMessagesContactGroupState(current);
  groupedContacts.forEach((group) => {
    const isOpen = forceExpanded ? true : isMessagesContactGroupOpen(group.key);
    const section = document.createElement("section");
    section.className = `messages-contact-section${group.priority ? " messages-contact-section-priority" : ""}`;
    if (showToggle) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "messages-contact-toggle";
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.innerHTML = `
        <span class="messages-contact-toggle-main">
          <span class="messages-contact-section-title">${escapeHtml(group.title)}</span>
          <span class="messages-contact-count">${group.rows.length}</span>
        </span>
        <span class="messages-contact-toggle-caret">${isOpen ? "▾" : "▸"}</span>
      `;
      toggle.addEventListener("click", () => {
        setMessagesContactGroupOpen(group.key, !isOpen);
        renderMessages();
      });
      section.appendChild(toggle);
    } else {
      const header = document.createElement("div");
      header.className = "messages-contact-header";
      header.innerHTML = `
        <span class="messages-contact-section-title">${escapeHtml(group.title)}</span>
        <span class="messages-contact-count">${group.rows.length}</span>
      `;
      section.appendChild(header);
    }

    const body = document.createElement("div");
    body.className = "messages-contact-body";
    if (!isOpen) body.classList.add("hidden");

    const subgroups = buildMessageContactSubgroups(group);
    subgroups.forEach((subgroup) => {
      const subgroupWrap = document.createElement("div");
      subgroupWrap.className = "messages-contact-subgroup";
      if (subgroup.label) {
        const subgroupTitle = document.createElement("div");
        subgroupTitle.className = "messages-contact-subgroup-title";
        subgroupTitle.textContent = subgroup.label;
        subgroupWrap.appendChild(subgroupTitle);
      }
      const grid = document.createElement("div");
      grid.className = "messages-contact-grid";
      subgroup.rows.forEach((contact) => {
        const card = buildMessageContactCard(contact, current, {
          priority: group.priority,
          onSelect: onContactSelect
        });
        grid.appendChild(card);
      });
      subgroupWrap.appendChild(grid);
      body.appendChild(subgroupWrap);
    });
    section.appendChild(body);
    targetEl.appendChild(section);
  });
}

function renderMessagesCoachList(current) {
  renderMessageContactDirectory(messagesCoachList, current);
}

function renderMessagesContactsPanel(current) {
  setTextContent(messagesContactsTitle, MESSAGES_COPY.contactsTitleTab);
  setTextContent(messagesContactsHint, MESSAGES_COPY.contactsHintTab);
  renderMessageContactDirectory(messagesContactsDirectory, current, {
    showToggle: false,
    forceExpanded: true,
    onContactSelect: (contact) => {
      setMessagesContactGroupOpen(contact.role, true);
      setMessagesWorkspaceMode("chats", { persist: true, rerender: false });
      openMessageThreadForContact(contact);
    }
  });
}

function getMessageCallableContacts(current = getMessagesCurrentUser()) {
  return sortMessageContacts(
    messagesContactRows.filter((contact) => canMessageContact(current, contact))
  );
}

function getMessageThreadedContactUidSet(current = getMessagesCurrentUser()) {
  const safeCurrentUid = String(current?.uid || "").trim();
  const threaded = new Set();
  if (!safeCurrentUid) return threaded;
  messagesThreadRows.forEach((thread) => {
    const other = getMessageOtherParticipant(thread, safeCurrentUid);
    if (other?.uid) threaded.add(other.uid);
  });
  return threaded;
}

async function openNewMessageThreadFromButton() {
  const current = getMessagesCurrentUser();
  if (!current?.uid) return;

  const isShowingContacts = !messagesContactsDirectory.classList.contains("hidden");
  if (isShowingContacts) {
    messagesContactsDirectory.classList.add("hidden");
    messageList.classList.remove("hidden");
    if (messagesFilterTabs) messagesFilterTabs.classList.remove("hidden");
    setTextContent(messagesOpenContactsBtn, MESSAGES_COPY.openContactsBtn);
    renderMessages();
  } else {
    messageList.classList.add("hidden");
    if (messagesFilterTabs) messagesFilterTabs.classList.add("hidden");
    messagesContactsDirectory.classList.remove("hidden");
    setTextContent(messagesOpenContactsBtn, currentLang === "es" ? "Cerrar" : "Close");
    setTextContent(messagesSidebarTitle, currentLang === "es" ? "Nuevo chat" : "New chat");
    setTextContent(messagesSidebarHint, currentLang === "es" ? "Contactos disponibles" : "Available contacts");
    
    renderMessageContactDirectory(messagesContactsDirectory, current, {
      showToggle: false,
      forceExpanded: true,
      onContactSelect: async (contact) => {
        messagesContactsDirectory.classList.add("hidden");
        messageList.classList.remove("hidden");
        if (messagesFilterTabs) messagesFilterTabs.classList.remove("hidden");
        renderMessages();
        await openMessageThreadForContact(contact);
      }
    });
  }
}

function setMessagesCallsStatus(copy = "", type = "") {
  if (!messagesCallsStatus) return;
  messagesCallsStatus.textContent = pickCopy(copy);
  messagesCallsStatus.dataset.state = type;
}

function normalizeContactPhoneTarget(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  return cleaned;
}

function getMessageCallTarget(contact = {}) {
  const phone = normalizeContactPhoneTarget(
    contact.phone
    || contact.phoneNumber
    || contact.mobile
    || contact.cell
    || contact.whatsapp
    || contact.whatsappNumber
  );
  const email = normalizeEmail(contact.email || "");
  return { phone, email };
}

function getCallRoomUrl(contact = {}, type = "voice") {
  const current = getMessagesCurrentUser();
  const scope = [
    "wpl",
    type === "video" ? "video" : "voice",
    current?.uid || "user",
    contact?.uid || contact?.email || "contact"
  ].map((chunk) => slugifyKey(String(chunk || "").trim())).filter(Boolean).join("-");
  const room = String(scope || `wpl-call-${Date.now()}`).slice(0, 80);
  const videoMuted = type === "video" ? "false" : "true";
  return `https://meet.jit.si/${room}#config.startWithVideoMuted=${videoMuted}`;
}

function isMobileCallRuntime() {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "").toLowerCase();
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}

function isAppleRuntime() {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "").toLowerCase();
  return /iphone|ipad|ipod|macintosh|mac os x/i.test(ua);
}

function openSystemCallUrl(url = "") {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) return false;
  try {
    window.location.href = safeUrl;
    return true;
  } catch (err) {
    console.warn("Could not open system call url", err);
    return false;
  }
}

function launchDeviceCall(contact = {}, type = "voice") {
  const safeType = type === "video" ? "video" : "voice";
  const { phone, email } = getMessageCallTarget(contact);
  const fallbackUrl = getCallRoomUrl(contact, safeType);

  if (isMobileCallRuntime()) {
    if (safeType === "voice" && phone) {
      const launched = openSystemCallUrl(`tel:${phone}`);
      return {
        launched,
        message: launched ? MESSAGES_COPY.callsLaunchDialer : MESSAGES_COPY.callsLaunchError,
        fallbackUrl
      };
    }
    if (safeType === "video" && isAppleRuntime() && (phone || email)) {
      const target = encodeURIComponent(phone || email);
      const launched = openSystemCallUrl(`facetime://${target}`);
      return {
        launched,
        message: launched ? MESSAGES_COPY.callsLaunchDialer : MESSAGES_COPY.callsLaunchError,
        fallbackUrl
      };
    }
  }

  if (!isMobileCallRuntime()) {
    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    return {
      launched: true,
      message: MESSAGES_COPY.callsLaunchComputer,
      fallbackUrl
    };
  }

  window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  return {
    launched: true,
    message: MESSAGES_COPY.callsLaunchFallback,
    fallbackUrl
  };
}

async function sendMessageCallRequestToContact(contact, type = "voice") {
  const current = getMessagesCurrentUser();
  if (!current || !contact) {
    setMessagesCallsStatus(MESSAGES_COPY.callsNoContacts, "error");
    return;
  }
  const safeType = type === "video" ? "video" : "voice";
  const requestText = pickCopy(
    safeType === "video" ? MESSAGES_COPY.callsRequestVideoText : MESSAGES_COPY.callsRequestVoiceText
  );
  setMessagesCallsStatus(MESSAGES_COPY.sending, "");
  try {
    const threadId = await ensureDirectMessageThread(contact);
    await appendMessageToThread({
      threadId,
      participants: [current, contact],
      sender: current,
      text: requestText
    });
    selectMessageThread(threadId, { openInCompact: true });
    setMessagesThreadOpenState(threadId);
    setMessagesWorkspaceMode("chats", { persist: true, rerender: false });
    appendMessageCallLog({
      contactUid: contact.uid,
      contactName: contact.name,
      type: safeType,
      byUid: current.uid,
      createdAt: new Date().toISOString()
    });
    const launchResult = launchDeviceCall(contact, safeType);
    if (launchResult?.fallbackUrl && !launchResult?.launched) {
      window.open(launchResult.fallbackUrl, "_blank", "noopener,noreferrer");
      setMessagesCallsStatus(MESSAGES_COPY.callsLaunchFallback, "ok");
    } else {
      setMessagesCallsStatus(launchResult?.message || MESSAGES_COPY.callsRequestSent, launchResult?.launched ? "ok" : "error");
    }
    await ensureMessagesSession();
    renderMessages();
    toast(pickCopy(MESSAGES_COPY.callsRequestSent));
  } catch (err) {
    console.warn("Failed to send call request", err);
    setMessagesCallsStatus(MESSAGES_COPY.callsSendError, "error");
  }
}

async function sendMessageCallRequest(type = "voice") {
  const targetUid = String(messagesCallContactSelect?.value || "").trim();
  const contact = messagesContactRows.find((item) => item.uid === targetUid) || null;
  await sendMessageCallRequestToContact(contact, type);
}

function renderMessagesCallsPanel(current) {
  setTextContent(messagesCallsTitle, MESSAGES_COPY.callsTitle);
  setTextContent(messagesCallsHint, MESSAGES_COPY.callsHint);
  setTextContent(messagesCallContactLabel, MESSAGES_COPY.callsContactLabel);
  setTextContent(messagesCallVoiceBtn, MESSAGES_COPY.callsVoiceBtn);
  setTextContent(messagesCallVideoBtn, MESSAGES_COPY.callsVideoBtn);
  setTextContent(messagesCallsLogTitle, MESSAGES_COPY.callsLogTitle);
  if (!messagesCallContactSelect || !messagesCallsLog) return;

  const contacts = getMessageCallableContacts(current);
  messagesCallContactSelect.innerHTML = "";
  contacts.forEach((contact) => {
    const option = document.createElement("option");
    option.value = contact.uid;
    option.textContent = `${contact.name} - ${getRoleLabelEnglish(contact.role)}`;
    messagesCallContactSelect.appendChild(option);
  });
  const controlsDisabled = !current?.uid || !contacts.length;
  if (messagesCallVoiceBtn) messagesCallVoiceBtn.disabled = controlsDisabled;
  if (messagesCallVideoBtn) messagesCallVideoBtn.disabled = controlsDisabled;
  if (messagesCallContactSelect) messagesCallContactSelect.disabled = controlsDisabled;
  if (controlsDisabled) {
    setMessagesCallsStatus(MESSAGES_COPY.callsNoContacts, "error");
  } else if (!messagesCallsStatus?.textContent) {
    setMessagesCallsStatus("", "");
  }

  messagesCallsLog.innerHTML = "";
  const logs = getMessageCallLogs();
  if (!logs.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(MESSAGES_COPY.callsNoLogs);
    messagesCallsLog.appendChild(empty);
    return;
  }
  logs.slice(0, 12).forEach((log) => {
    const item = document.createElement("div");
    item.className = "messages-call-item";
    const typeCopy = pickCopy(log.type === "video" ? MESSAGES_COPY.callsVideoBtn : MESSAGES_COPY.callsVoiceBtn);
    item.innerHTML = `
      <div class="messages-call-item-top">
        <span class="messages-call-item-name">${escapeHtml(log.contactName || "Contact")}</span>
        <span class="messages-call-item-type">${escapeHtml(typeCopy)}</span>
      </div>
      <span class="messages-call-item-time">${escapeHtml(formatMessageTimestamp(log.createdAt))}</span>
    `;
    messagesCallsLog.appendChild(item);
  });
}

function findLatestMessageMediaUrl() {
  const selectedRows = messagesFeedRows.length
    ? messagesFeedRows
    : (getSelectedMessageThread()?.messageHistory || []);
  for (let i = selectedRows.length - 1; i >= 0; i -= 1) {
    const row = selectedRows[i];
    const attachments = Array.isArray(row?.attachments) ? row.attachments : [];
    if (!attachments.length) continue;
    const url = resolveMessageAttachmentUrl(attachments[0]);
    if (url) return url;
  }
  for (const thread of messagesThreadRows) {
    const history = Array.isArray(thread?.messageHistory) ? thread.messageHistory : [];
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const row = history[i];
      const attachments = Array.isArray(row?.attachments) ? row.attachments : [];
      if (!attachments.length) continue;
      const url = resolveMessageAttachmentUrl(attachments[0]);
      if (url) return url;
    }
  }
  return "";
}

function getResolvedMessagesShareUrl() {
  const typed = getMessagesShareUrl();
  if (typed) {
    if (isAbsoluteUrl(typed)) return typed;
    const normalized = `https://${typed.replace(/^\/+/, "")}`;
    if (messagesShareUrlInput) messagesShareUrlInput.value = normalized;
    return normalized;
  }
  const fromMessages = findLatestMessageMediaUrl();
  if (fromMessages && messagesShareUrlInput) {
    messagesShareUrlInput.value = fromMessages;
  }
  return fromMessages;
}

function getSocialShareTarget(platform = "", mediaUrl = "") {
  const encodedUrl = encodeURIComponent(mediaUrl);
  if (platform === "facebook") {
    return `https://www.facebook.com/sharer/sharer/?u=${encodedUrl}`;
  }
  if (platform === "instagram") {
    return "https://www.instagram.com/";
  }
  if (platform === "tiktok") {
    return "https://www.tiktok.com/upload";
  }
  if (platform === "youtube") {
    return "https://www.youtube.com/upload";
  }
  return "";
}

async function handleMessagesSocialShare(platform = "") {
  const mediaUrl = getResolvedMessagesShareUrl();
  if (!mediaUrl) {
    setMessagesShareStatus(MESSAGES_COPY.shareNeedUrl);
    return;
  }
  if (platform !== "facebook") {
    await copyTextToClipboard(mediaUrl).catch(() => false);
    setMessagesShareStatus(MESSAGES_COPY.shareCopied);
  } else {
    setMessagesShareStatus(MESSAGES_COPY.shareOpenApp);
  }
  const target = getSocialShareTarget(platform, mediaUrl);
  if (!target) {
    setMessagesShareStatus(MESSAGES_COPY.shareError);
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}

async function handleMessagesNativeShare() {
  const mediaUrl = getResolvedMessagesShareUrl();
  if (!mediaUrl) {
    setMessagesShareStatus(MESSAGES_COPY.shareNeedUrl);
    return;
  }
  try {
    if (navigator.share) {
      await navigator.share({
        title: pickCopy(MESSAGES_COPY.title),
        text: pickCopy(MESSAGES_COPY.shareHint),
        url: mediaUrl
      });
      setMessagesShareStatus(MESSAGES_COPY.shareOpenApp);
      return;
    }
    await copyTextToClipboard(mediaUrl);
    setMessagesShareStatus(MESSAGES_COPY.shareNativeUnsupported);
  } catch (err) {
    console.warn("Native share failed", err);
    setMessagesShareStatus(MESSAGES_COPY.shareError);
  }
}

function renderMessagesSharePanel() {
  setTextContent(messagesShareTitle, MESSAGES_COPY.shareTitle);
  setTextContent(messagesShareHint, MESSAGES_COPY.shareHint);
  setTextContent(messagesShareUrlLabel, MESSAGES_COPY.shareUrlLabel);
  setTextContent(messagesShareActionsTitle, MESSAGES_COPY.shareActionsTitle);
  setTextContent(messagesShareNativeBtn, MESSAGES_COPY.shareNativeBtn);
  setTextContent(messagesShareFacebookBtn, MESSAGES_COPY.shareFacebookBtn);
  setTextContent(messagesShareInstagramBtn, MESSAGES_COPY.shareInstagramBtn);
  setTextContent(messagesShareTiktokBtn, MESSAGES_COPY.shareTiktokBtn);
  setTextContent(messagesShareYoutubeBtn, MESSAGES_COPY.shareYoutubeBtn);
  setTextContent(messagesShareHelp, MESSAGES_COPY.shareHelp);
  if (messagesShareUrlInput) {
    messagesShareUrlInput.placeholder = pickCopy(MESSAGES_COPY.shareUrlPlaceholder);
  }
}

function renderMessagesWorkspacePanels(current) {
  const mode = normalizeMessagesWorkspaceMode(messagesWorkspaceMode);
  const inChats = mode === "chats";
  const inCalls = mode === "calls";
  const inContacts = mode === "contacts";
  const inShare = mode === "share";
  messagesChatsPanel?.classList.toggle("hidden", !inChats);
  messagesCallsPanel?.classList.toggle("hidden", !inCalls);
  messagesContactsPanel?.classList.toggle("hidden", !inContacts);
  messagesSharePanel?.classList.toggle("hidden", !inShare);
  if (inCalls) renderMessagesCallsPanel(current);
  if (inContacts) renderMessagesContactsPanel(current);
  if (inShare) renderMessagesSharePanel();
}

function renderMessagesWorkspaceNav() {
  const mode = normalizeMessagesWorkspaceMode(messagesWorkspaceMode);
  const tabDefs = [
    { el: messagesModeChatsBtn, mode: "chats", copy: MESSAGES_COPY.workspaceChats },
    { el: messagesModeCallsBtn, mode: "calls", copy: MESSAGES_COPY.workspaceCalls },
    { el: messagesModeContactsBtn, mode: "contacts", copy: MESSAGES_COPY.workspaceContacts },
    { el: messagesModeShareBtn, mode: "share", copy: MESSAGES_COPY.workspaceShare }
  ];
  tabDefs.forEach(({ el, mode: rowMode, copy }) => {
    if (!el) return;
    el.textContent = pickCopy(copy);
    el.classList.toggle("active", rowMode === mode);
    el.setAttribute("aria-selected", rowMode === mode ? "true" : "false");
  });
}

function renderMessagesFilterTabs() {
  const defs = [
    { el: messagesFilterAllBtn, filter: "all", copy: MESSAGES_COPY.filtersAll },
    { el: messagesFilterAthletesBtn, filter: "athlete", copy: MESSAGES_COPY.filtersAthletes },
    { el: messagesFilterParentsBtn, filter: "parent", copy: MESSAGES_COPY.filtersParents }
  ];
  defs.forEach(({ el, filter, copy }) => {
    if (!el) return;
    el.textContent = pickCopy(copy);
    const active = messagesThreadFilter === filter;
    el.classList.toggle("active", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function getMessageContactInitials(name = "") {
  const tokens = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return "U";
  return tokens.slice(0, 2).map((token) => token[0]).join("").toUpperCase();
}

function isCompactMessagesViewport() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(max-width: 900px)").matches
    || window.matchMedia("(max-height: 760px) and (orientation: landscape)").matches;
}

function setMessagesThreadOpenState(selectedThread) {
  if (!messagesShell) return;
  const compact = isCompactMessagesViewport();
  messagesShell.classList.toggle("messages-shell-compact", compact);
  const shouldOpen = compact && Boolean(selectedThread) && messagesCompactThreadVisible;
  messagesShell.classList.toggle("messages-shell-thread-open", shouldOpen);
  if (!compact) {
    messagesShell.classList.remove("messages-shell-thread-open");
  }
}

function renderMessagesThreadHeaderActions(current, selectedThread) {
  setTextContent(messagesBackToChatsBtn, MESSAGES_COPY.backToChats);
  setTextContent(messagesShareProgressBtn, MESSAGES_COPY.shareProgressBtn);
  setTextContent(messagesThreadVoiceBtn, MESSAGES_COPY.threadVoiceBtn);
  setTextContent(messagesThreadVideoBtn, MESSAGES_COPY.threadVideoBtn);
  setTextContent(messagesThreadMoreBtn, MESSAGES_COPY.threadMoreBtn);
  if (messagesThreadMoreBtn) {
    messagesThreadMoreBtn.title = pickCopy(MESSAGES_COPY.threadMoreBtn);
    messagesThreadMoreBtn.setAttribute("aria-label", pickCopy(MESSAGES_COPY.threadMoreBtn));
  }
  const compact = isCompactMessagesViewport();
  const showBack = compact && Boolean(selectedThread) && messagesCompactThreadVisible;
  if (messagesBackToChatsBtn) {
    messagesBackToChatsBtn.classList.toggle("hidden", !showBack);
    messagesBackToChatsBtn.disabled = !showBack;
  }
  const canCall = Boolean(current?.uid && selectedThread);
  const canShareProgress = Boolean(current?.uid && selectedThread && isCoachMessagingUser(current));
  const canOpenThreadMenu = Boolean(current?.uid && selectedThread && !isTeamChatThread(selectedThread));
  if (messagesShareProgressBtn) messagesShareProgressBtn.disabled = !canShareProgress;
  if (messagesThreadVoiceBtn) messagesThreadVoiceBtn.disabled = !canCall;
  if (messagesThreadVideoBtn) messagesThreadVideoBtn.disabled = !canCall;
  if (messagesThreadMoreBtn) messagesThreadMoreBtn.disabled = !canOpenThreadMenu;
}

function getSelectedThreadContact(current, selectedThread) {
  if (!current?.uid || !selectedThread) return null;
  const other = getMessageOtherParticipant(selectedThread, current.uid);
  if (!other?.uid) return null;
  return messagesContactRows.find((entry) => entry.uid === other.uid) || other;
}

function ensureLocalMessageThreadParticipants(threadId = "", participants = []) {
  const safeThreadId = String(threadId || "").trim();
  const participantProfiles = buildMessageParticipantProfiles(participants);
  if (!safeThreadId || participantProfiles.length < 2) return;
  const participantIds = uniqueMessageIds(participantProfiles.map((participant) => participant.uid)).sort();
  messagesThreadRows = sortMessageThreads(messagesThreadRows.map((thread) => (
    thread.id !== safeThreadId
      ? thread
      : {
          ...thread,
          participantIds,
          participantProfiles
        }
  )));
}

function getMessageThreadParticipantsForSend(selectedThread, current) {
  const thread = selectedThread || {};
  const sender = normalizeMessageParticipantProfile(current || {});
  if (isTeamChatThread(thread)) {
    return buildTeamChatParticipantProfiles(sender, thread.participantProfiles || []);
  }
  const byUid = new Map();
  const participantIdsFromThreadId = getDirectMessageThreadParticipantIds(thread.id);
  const addParticipant = (candidate) => {
    const normalized = normalizeMessageParticipantProfile(candidate || {});
    if (!normalized.uid) return;
    byUid.set(normalized.uid, normalized);
  };
  addParticipant(sender);
  (Array.isArray(thread.participantProfiles) ? thread.participantProfiles : []).forEach(addParticipant);

  uniqueMessageIds([
    ...participantIdsFromThreadId,
    ...(Array.isArray(thread.participantIds) ? thread.participantIds : []),
    thread.coachUid,
    thread.userUid
  ]).forEach((uid) => {
    if (!uid) return;
    if (uid === sender.uid) {
      addParticipant(sender);
      return;
    }
    const linkedContact = messagesContactRows.find((row) => row.uid === uid);
    if (linkedContact) {
      addParticipant(linkedContact);
      return;
    }
    const fallback = getMessageOtherParticipantProfile(thread, sender.uid);
    if (fallback?.uid === uid) {
      addParticipant(fallback);
      return;
    }
    addParticipant({
      uid,
      role: uid === String(thread.coachUid || "").trim()
        ? "coach"
        : (uid === String(thread.userUid || "").trim()
          ? normalizeMessageParticipantRole(thread.userRole || "athlete")
          : "athlete"),
      name: uid === String(thread.coachUid || "").trim()
        ? String(thread.coachName || "").trim()
        : (uid === String(thread.userUid || "").trim()
          ? String(thread.userName || "").trim()
          : "")
    });
  });

  if (byUid.size < 2) {
    participantIdsFromThreadId.forEach((uid) => {
      addParticipant({ uid });
    });
    addParticipant(getSelectedThreadContact(sender, thread));
    addParticipant(getMessageOtherParticipantProfile(thread, sender.uid));
  }
  return Array.from(byUid.values());
}

function getMessageSendErrorCopy(err = null) {
  const code = String(err?.code || err?.message || "").toLowerCase();
  if (code.includes("message_contact_not_allowed")) {
    return {
      en: "This contact is outside your linked messaging permissions.",
      es: "Este contacto esta fuera de tus permisos de mensajeria vinculada."
    };
  }
  if (code.includes("permission-denied")) {
    return {
      en: "Could not send message: access denied for this chat. Reopen it and try again.",
      es: "No se pudo enviar: acceso denegado para este chat. Reabre el chat e intenta otra vez."
    };
  }
  if (code.includes("unauthenticated") || code.includes("auth")) {
    return {
      en: "Could not send message: sign in again and retry.",
      es: "No se pudo enviar: inicia sesion de nuevo e intenta otra vez."
    };
  }
  if (code.includes("firestore_not_configured")) {
    return MESSAGES_COPY.loadError;
  }
  return MESSAGES_COPY.sendError;
}

function getMessageDeleteEntryKey(entry = {}) {
  return String(entry?.id || entry?.clientMessageId || "").trim();
}

function isMessageDeleteInFlight(entry = {}) {
  const key = getMessageDeleteEntryKey(entry);
  return Boolean(key && messagesDeleteInFlightByMessage[key]);
}

function setMessageDeleteInFlight(entry = {}, isDeleting = false) {
  const key = getMessageDeleteEntryKey(entry);
  if (!key) return;
  const next = { ...messagesDeleteInFlightByMessage };
  if (isDeleting) {
    next[key] = true;
  } else {
    delete next[key];
  }
  messagesDeleteInFlightByMessage = next;
}

function canDeleteMessageEntry(entry = {}, current = getMessagesCurrentUser(), threadOverride = null) {
  if (!entry?.id || !current?.uid) return false;
  if (entry.optimistic) return false;
  if (isAdminRole(current.role)) return true;
  const selectedThread = threadOverride || getSelectedMessageThread();
  const participantIds = Array.isArray(selectedThread?.participantIds)
    ? selectedThread.participantIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (participantIds.length) {
    return participantIds.includes(String(current.uid || "").trim());
  }
  return true;
}

function getCurrentThreadFeedRows(selectedThread = getSelectedMessageThread()) {
  return dedupeMessageEntries(messagesFeedRows.length ? messagesFeedRows : (selectedThread?.messageHistory || []));
}

function buildThreadStateFromRows(rows = [], fallbackUpdatedAt = "") {
  const normalizedRows = dedupeMessageEntries(rows).slice(-120);
  const lastEntry = normalizedRows[normalizedRows.length - 1] || null;
  const updatedAt = String(lastEntry?.createdAt || fallbackUpdatedAt || new Date().toISOString()).trim() || new Date().toISOString();
  return {
    messageHistory: normalizedRows,
    lastMessageText: String(lastEntry?.text || "").trim(),
    lastSenderUid: String(lastEntry?.senderUid || "").trim(),
    lastMessageAt: String(lastEntry?.createdAt || "").trim(),
    updatedAt
  };
}

function applyThreadStateLocally(threadId = "", nextState = {}) {
  const safeThreadId = String(threadId || "").trim();
  if (!safeThreadId) return;
  messagesThreadRows = sortMessageThreads(messagesThreadRows.map((thread) => (
    thread.id !== safeThreadId
      ? thread
      : {
          ...thread,
          ...nextState
        }
  )));
}

function getThreadParticipantsForPersistence(thread = null, current = getMessagesCurrentUser()) {
  const existing = buildMessageParticipantProfiles(Array.isArray(thread?.participantProfiles) ? thread.participantProfiles : []);
  if (existing.length >= 2) return existing;
  return buildMessageParticipantProfiles(getMessageThreadParticipantsForSend(thread, current));
}

async function persistThreadStateAfterMessageDeletion(thread = null, rows = [], current = getMessagesCurrentUser()) {
  const safeThreadId = String(thread?.id || "").trim();
  if (!safeThreadId) return;
  const threadRef = getMessageThreadDocRef(safeThreadId);
  if (!threadRef) return;
  const participants = getThreadParticipantsForPersistence(thread, current);
  if (participants.length < 2) return;
  const nextState = buildThreadStateFromRows(rows, thread?.updatedAt || "");
  await withTimeout(
    threadRef.set(buildMessageThreadPayload(participants, {
      updatedAt: nextState.updatedAt,
      lastMessageAt: nextState.lastMessageAt,
      serverUpdatedAt: getFirestoreServerTimestamp(),
      serverLastMessageAt: getFirestoreServerTimestamp(),
      lastMessageText: nextState.lastMessageText,
      lastSenderUid: nextState.lastSenderUid,
      messageHistory: nextState.messageHistory
    }), { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_message_delete_sync_timeout"
  );
}

async function ensureThreadParticipantsReadyForWrites(thread = null, current = getMessagesCurrentUser()) {
  const safeThreadId = String(thread?.id || "").trim();
  if (!safeThreadId || !current?.uid) return;
  const threadRef = getMessageThreadDocRef(safeThreadId);
  if (!threadRef) return;
  const existingIds = uniqueMessageIds(Array.isArray(thread?.participantIds) ? thread.participantIds : []);
  const participants = getMessageThreadParticipantsForSend(thread, current);
  const participantIds = uniqueMessageIds(participants.map((participant) => participant.uid));
  if (existingIds.length === 2 && participantIds.length === 2 && existingIds.every((uid) => participantIds.includes(uid))) {
    ensureLocalMessageThreadParticipants(safeThreadId, participants);
    return;
  }
  if (participantIds.length < 2) return;
  const payload = buildMessageThreadPayload(participants, {
    updatedAt: String(thread?.updatedAt || new Date().toISOString()).trim() || new Date().toISOString(),
    lastMessageAt: String(thread?.lastMessageAt || "").trim(),
    serverUpdatedAt: getFirestoreServerTimestamp()
  });
  await withTimeout(
    threadRef.set(payload, { merge: true }),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_message_thread_repair_timeout"
  );
  ensureLocalMessageThreadParticipants(safeThreadId, participants);
}

async function deleteMessageEntryFromSelectedThread(entry = null, options = {}) {
  const target = entry || {};
  const current = getMessagesCurrentUser();
  const selectedThreadLive = getSelectedMessageThread();
  const threadId = String(options?.threadIdOverride || selectedThreadLive?.id || "").trim();
  const selectedThread = options?.threadOverride
    || messagesThreadRows.find((thread) => String(thread?.id || "").trim() === threadId)
    || (String(selectedThreadLive?.id || "").trim() === threadId ? selectedThreadLive : null);
  const messageId = String(target.id || "").trim();
  const targetClientMessageId = String(target.clientMessageId || "").trim();
  const skipConfirm = Boolean(options?.skipConfirm);
  if (!current?.uid || !threadId || !messageId) return false;
  if (!canDeleteMessageEntry(target, current, selectedThread)) {
    setMessagesStatus(MESSAGES_COPY.deleteNotAllowed, "error");
    renderMessages();
    return false;
  }
  if (isMessageDeleteInFlight(target)) return false;
  if (!skipConfirm && typeof window !== "undefined" && typeof window.confirm === "function") {
    const confirmed = window.confirm(pickCopy(MESSAGES_COPY.deleteMessageConfirm));
    if (!confirmed) return false;
  }
  setMessageDeleteInFlight(target, true);
  setMessagesStatus(MESSAGES_COPY.deletingMessage, "");
  renderMessages();
  try {
    const threadRef = getMessageThreadDocRef(threadId);
    if (!threadRef) throw new Error("firestore_not_configured");
    await ensureThreadParticipantsReadyForWrites(selectedThread, current);
    await withTimeout(
      threadRef.collection("messages").doc(messageId).delete(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_delete_timeout"
    );
    removePendingThreadEntry(threadId, targetClientMessageId);
    const visibleThread = String(messagesSelectedThreadId || "").trim() === threadId;
    const sourceRows = dedupeMessageEntries(
      visibleThread && messagesFeedRows.length
        ? messagesFeedRows
        : (Array.isArray(selectedThread?.messageHistory) ? selectedThread.messageHistory : [])
    );
    const remainingRows = sourceRows.filter((row) => (
      String(row.id || "").trim() !== messageId
    ));
    if (visibleThread) {
      messagesFeedRows = dedupeMessageEntries(remainingRows);
    }
    const nextState = buildThreadStateFromRows(remainingRows, selectedThread?.updatedAt || "");
    applyThreadStateLocally(threadId, nextState);
    await persistThreadStateAfterMessageDeletion(selectedThread, remainingRows, current);
    setMessagesStatus(MESSAGES_COPY.deleteMessageSuccess, "ok");
    toast(pickCopy(MESSAGES_COPY.deleteMessageSuccess));
    return true;
  } catch (err) {
    console.warn("Failed to delete message", err);
    setMessagesStatus(MESSAGES_COPY.deleteMessageError, "error");
    return false;
  } finally {
    setMessageDeleteInFlight(target, false);
    renderMessages();
  }
}

async function deleteOwnMessagesInSelectedThread() {
  const current = getMessagesCurrentUser();
  const selectedThread = getSelectedMessageThread();
  const threadId = String(selectedThread?.id || "").trim();
  if (!current?.uid || !threadId || !selectedThread) return;
  const rows = getCurrentThreadFeedRows(selectedThread);
  const deletableRows = rows.filter((entry) => canDeleteMessageEntry(entry, current) && entry.id);
  if (!deletableRows.length) {
    setMessagesStatus(MESSAGES_COPY.deleteNoOwnedMessages, "error");
    renderMessages();
    return;
  }
  const confirmed = window.confirm(pickCopy(MESSAGES_COPY.deleteAllOwnMessagesConfirm));
  if (!confirmed) return;
  setMessagesStatus(MESSAGES_COPY.deletingMessages, "");
  renderMessages();
  try {
    const threadRef = getMessageThreadDocRef(threadId);
    if (!threadRef || !firebaseFirestoreInstance?.batch) throw new Error("firestore_not_configured");
    await ensureThreadParticipantsReadyForWrites(selectedThread, current);
    const batch = firebaseFirestoreInstance.batch();
    deletableRows.forEach((entry) => {
      batch.delete(threadRef.collection("messages").doc(entry.id));
      if (entry.clientMessageId) {
        removePendingThreadEntry(threadId, entry.clientMessageId);
      }
    });
    await withTimeout(
      batch.commit(),
      FIREBASE_OP_TIMEOUT_MS,
      "firestore_message_bulk_delete_timeout"
    );
    const ownIds = new Set(deletableRows.map((entry) => String(entry.id || "").trim()).filter(Boolean));
    messagesFeedRows = dedupeMessageEntries(rows.filter((entry) => !ownIds.has(String(entry.id || "").trim())));
    const nextState = buildThreadStateFromRows(messagesFeedRows, selectedThread?.updatedAt || "");
    applyThreadStateLocally(threadId, nextState);
    await persistThreadStateAfterMessageDeletion(selectedThread, messagesFeedRows, current);
    setMessagesStatus(MESSAGES_COPY.deleteMessagesSuccess, "ok");
    toast(pickCopy(MESSAGES_COPY.deleteMessagesSuccess));
  } catch (err) {
    console.warn("Failed to delete own messages", err);
    setMessagesStatus(MESSAGES_COPY.deleteMessagesError, "error");
  } finally {
    renderMessages();
  }
}

function getMessageThreadPreviewText(thread = {}) {
  const raw = String(thread?.lastMessageText || "").trim();
  if (!raw) return pickCopy(MESSAGES_COPY.noMessages);
  // Single symbol previews look broken in the chat list; use a readable label.
  if (/^[?¿!.,;:]+$/.test(raw)) return pickCopy(MESSAGES_COPY.previewSymbolFallback);
  return raw;
}

function renderMessagesThreadList(current) {
  if (!messageList) return;
  const showThreadDirectory = true;
  messageList.classList.toggle("hidden", !showThreadDirectory);
  if (!showThreadDirectory) {
    messageList.innerHTML = "";
    return;
  }
  messageList.innerHTML = "";

  const title = document.createElement("div");
  title.className = "messages-recent-title";
  title.textContent = pickCopy(MESSAGES_COPY.recentHeader);
  messageList.appendChild(title);

  if (!current) return;

  const sortedThreads = sortMessageThreadsForInbox(
    dedupeMessageThreads(current.uid, messagesThreadRows),
    current
  ).filter((thread) => canMessageThread(current, thread));
  if (!sortedThreads.length) {
    const empty = document.createElement("div");
    empty.className = "small muted messages-recent-empty";
    empty.textContent = pickCopy(MESSAGES_COPY.recentEmpty);
    messageList.appendChild(empty);
    return;
  }

  const filteredThreads = sortedThreads.filter((thread) => (
    doesMessageThreadMatchSearch(thread, current, messagesSearchQuery)
    && doesMessageThreadMatchFilter(thread, current, messagesThreadFilter)
    && !isMessageThreadPendingDelete(thread)
  ));
  if (!filteredThreads.length) {
    const empty = document.createElement("div");
    empty.className = "small muted messages-recent-empty";
    empty.textContent = pickCopy(MESSAGES_COPY.searchEmpty);
    messageList.appendChild(empty);
    return;
  }

  filteredThreads.forEach((thread) => {
    const threadId = String(thread.id || "").trim();
    const other = getMessageOtherParticipant(thread, current.uid);
    const unread = isMessageThreadUnread(thread, current);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "message-thread-card";
    if (thread.id === messagesSelectedThreadId) {
      card.classList.add("active");
    }
    if (unread) {
      card.classList.add("message-thread-unread");
    }
    const preview = getMessageThreadPreviewText(thread);
    const meta = formatMessageTimestamp(thread.lastMessageAt || thread.updatedAt);
    const initials = getMessageContactInitials(other.name || "U");
    const unreadCount = unread ? 1 : 0;
    const roleLabel = isTeamChatThread(thread) ? pickCopy(MESSAGES_COPY.teamBadge) : getRoleLabelEnglish(other.role);
    card.innerHTML = `
      <span class="message-thread-avatar">${escapeHtml(initials)}</span>
      <span class="message-thread-main">
        <span class="message-thread-card-top">
          <span>
            <h4>${escapeHtml(other.name || "Conversation")}</h4>
            <small>${escapeHtml(roleLabel)}</small>
          </span>
          <small class="message-thread-time">${escapeHtml(meta)}</small>
        </span>
        <span class="message-thread-meta-line">
          <span class="message-thread-preview">${escapeHtml(preview)}</span>
          ${unreadCount ? `<span class="message-thread-unread-count">${unreadCount}</span>` : ""}
        </span>
      </span>
      ${isTeamChatThread(thread) ? "" : `<button type="button" class="ghost message-thread-delete-trigger" aria-label="${escapeHtml(pickCopy(MESSAGES_COPY.threadMoreBtn))}" title="${escapeHtml(pickCopy(MESSAGES_COPY.threadMoreBtn))}">${escapeHtml(pickCopy(MESSAGES_COPY.deleteMessageBtn))}</button>`}
      ${unread ? '<span class="message-thread-unread-badge"></span>' : ""}
    `;
    renderAvatarElement(card.querySelector(".message-thread-avatar"), {
      photo: getProfilePhotoValue(other),
      name: other.name || "User",
      fallback: initials || "U"
    });
    card.addEventListener("click", () => {
      selectMessageThread(thread.id, { openInCompact: true });
    });
    const deleteTrigger = card.querySelector(".message-thread-delete-trigger");
    if (deleteTrigger) {
      deleteTrigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        queueMessageThreadSwipeDelete(thread, current);
      });
    }
    if (threadId && !isTeamChatThread(thread)) {
      bindSwipeDeleteGesture(card, {
        key: getMessageThreadSwipeDeleteKey(threadId),
        onSwipeDelete: () => {
          queueMessageThreadSwipeDelete(thread, current);
        }
      });
    }
    messageList.appendChild(card);
  });
}

function resolveMessageAttachmentUrl(attachment) {
  const preferred = String(
    attachment?.assetPath
      || attachment?.downloadURL
      || attachment?.downloadUrl
      || attachment?.url
      || attachment?.src
      || ""
  ).trim();
  return resolveMediaLocation(preferred);
}

function canInlinePlayMessageVideo(attachment = {}, assetUrl = "") {
  const safeUrl = String(assetUrl || "").trim();
  if (!safeUrl) return false;
  const mimeType = String(attachment?.contentType || "").trim().toLowerCase();
  const fileName = String(attachment?.name || "").trim().toLowerCase();
  if (mimeType.includes("quicktime") || fileName.endsWith(".mov") || /\.mov(?:$|\?)/i.test(safeUrl)) {
    return false;
  }
  if (shouldUseLiteVideoMessagePreview() && Number(attachment?.size || 0) > 40 * 1024 * 1024) {
    return false;
  }
  if (!mimeType) return true;
  try {
    const probe = document.createElement("video");
    const support = typeof probe.canPlayType === "function" ? probe.canPlayType(mimeType) : "";
    return Boolean(support);
  } catch {
    return true;
  }
}

function getMessageAttachmentDisplayName(attachment) {
  return String(attachment?.name || "").trim() || String(attachment?.mediaType || "").trim() || "Media";
}

function buildMessageAttachmentFavoriteEntry(attachment, tags = []) {
  const mergedTags = normalizeLooseTagList([...(attachment?.tags || []), ...tags]);
  return {
    label: getMessageAttachmentDisplayName(attachment),
    assetPath: resolveMessageAttachmentUrl(attachment),
    mediaType: String(attachment?.mediaType || "Media").trim(),
    tags: mergedTags
  };
}

function handleMessageAttachmentFavorite(attachment) {
  const tags = promptMessageAttachmentTags(attachment?.tags || []);
  if (tags === null) return;
  const result = addFavoriteEntry(buildMessageAttachmentFavoriteEntry(attachment, tags));
  toast(pickCopy(result.added ? MESSAGES_COPY.favoriteSaved : MESSAGES_COPY.favoriteAlreadySaved));
}

function handleMessageAttachmentSaveToMedia(attachment) {
  const tags = promptMessageAttachmentTags(attachment?.tags || []);
  if (tags === null) return;
  const result = saveMessageAttachmentToMedia(attachment, tags);
  toast(pickCopy(result.added ? MESSAGES_COPY.mediaSaved : MESSAGES_COPY.mediaAlreadySaved));
}

function openMessageVideoFullscreen(videoEl = null, fallbackUrl = "") {
  const safeFallbackUrl = String(fallbackUrl || "").trim();
  if (!videoEl) {
    if (safeFallbackUrl) window.open(safeFallbackUrl, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const playResult = videoEl.play?.();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
    if (typeof videoEl.requestFullscreen === "function") {
      const fullscreenResult = videoEl.requestFullscreen();
      if (fullscreenResult && typeof fullscreenResult.catch === "function") {
        fullscreenResult.catch(() => {
          if (safeFallbackUrl) window.open(safeFallbackUrl, "_blank", "noopener,noreferrer");
        });
      }
      return;
    }
    if (typeof videoEl.webkitEnterFullscreen === "function") {
      videoEl.webkitEnterFullscreen();
      return;
    }
    if (typeof videoEl.webkitRequestFullscreen === "function") {
      videoEl.webkitRequestFullscreen();
      return;
    }
  } catch (err) {
    console.warn("Video fullscreen failed", err);
  }
  if (safeFallbackUrl) {
    window.open(safeFallbackUrl, "_blank", "noopener,noreferrer");
  }
}

function buildMessageAttachmentCard(attachment = {}, { allowReceiverActions = true } = {}) {
  const card = document.createElement("div");
  card.className = "message-media-card";
  const assetUrl = resolveMessageAttachmentUrl(attachment);
  const typeLower = String(attachment.mediaType || "").toLowerCase();
  const isVideo = typeLower.includes("video");
  const isPhoto = typeLower.includes("photo") || typeLower.includes("image");
  const isVoice = typeLower.includes("voice") || typeLower.includes("audio");
  card.classList.add(allowReceiverActions ? "incoming" : "outgoing");
  if (isVideo) card.classList.add("is-video");
  if (isPhoto) card.classList.add("is-photo");
  if (isVoice) card.classList.add("is-voice");
  const previewUrl = resolveMediaLocation(attachment.thumbnailPath || attachment.assetPath || "");
  const litePreview = shouldUseLiteVideoMessagePreview();
  const canInlineVideo = isVideo ? canInlinePlayMessageVideo(attachment, assetUrl) : false;
  let inlineVideoEl = null;

  const head = document.createElement("div");
  head.className = "message-media-head";
  const name = document.createElement("span");
  name.className = "message-media-name";
  name.textContent = getMessageAttachmentDisplayName(attachment);
  const type = document.createElement("span");
  type.className = "message-media-type";
  type.textContent = attachment.mediaType || "Media";
  head.appendChild(name);
  head.appendChild(type);
  card.appendChild(head);

  const appendVideoFallback = (statusText = "") => {
    card.classList.add("is-fallback-video");
    const safeStatus = String(statusText || "").trim();
    const fallbackPreview = previewUrl || "";
    const previousWrap = card.querySelector(".message-media-video-wrap");
    if (previousWrap) previousWrap.remove();
    if (fallbackPreview && !card.querySelector(".message-media-preview.video-thumb")) {
      const img = document.createElement("img");
      img.className = "message-media-preview video-thumb";
      img.src = fallbackPreview;
      img.alt = getMessageAttachmentDisplayName(attachment);
      img.loading = "lazy";
      card.appendChild(img);
    } else if (!fallbackPreview && !card.querySelector(".message-media-video-placeholder")) {
      const placeholder = document.createElement("div");
      placeholder.className = "message-media-video-placeholder";
      placeholder.textContent = currentLang === "es" ? "Video listo para abrir" : "Video ready to open";
      card.appendChild(placeholder);
    }
    if (safeStatus) {
      let status = card.querySelector(".message-media-video-status");
      if (!status) {
        status = document.createElement("div");
        status.className = "message-media-video-status";
        card.appendChild(status);
      }
      status.textContent = safeStatus;
      status.dataset.state = "warning";
    }
    if (!card.querySelector(".message-media-video-hint")) {
      const hint = document.createElement("div");
      hint.className = "message-media-video-hint";
      hint.textContent = pickCopy(MESSAGES_COPY.videoTapToOpen);
      card.appendChild(hint);
    }
  };

  if (isPhoto && (previewUrl || assetUrl)) {
    const img = document.createElement("img");
    img.className = "message-media-preview";
    img.src = previewUrl || assetUrl;
    img.alt = getMessageAttachmentDisplayName(attachment);
    img.loading = "lazy";
    card.appendChild(img);
  } else if (isVideo) {
    if (!assetUrl) {
      appendVideoFallback(currentLang === "es" ? "Video no disponible todavia." : "Video is not available yet.");
    } else if (!canInlineVideo) {
      appendVideoFallback(
        currentLang === "es"
          ? "Este video se abrira en el reproductor del dispositivo."
          : "This video will open in your device player."
      );
    } else {
      const videoWrap = document.createElement("div");
      videoWrap.className = "message-media-video-wrap";
      videoWrap.classList.add("is-inline");
      const video = document.createElement("video");
      video.className = "message-media-preview video";
      video.src = assetUrl;
      video.controls = true;
      video.preload = litePreview ? "none" : "metadata";
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("controlslist", "nodownload");
      video.setAttribute("disablepictureinpicture", "true");
      if (previewUrl) {
        video.poster = previewUrl;
      }
      const status = document.createElement("div");
      status.className = "message-media-video-status";
      status.textContent = currentLang === "es" ? "Cargando video..." : "Loading video...";
      const setStatus = (text = "", state = "") => {
        const safeText = String(text || "").trim();
        status.textContent = safeText;
        status.dataset.state = String(state || "").trim();
        status.classList.toggle("hidden", !safeText);
      };
      setStatus(
        litePreview
          ? (currentLang === "es" ? "Pulsa reproducir para cargar el video." : "Tap play to load the video.")
          : (currentLang === "es" ? "Cargando video..." : "Loading video..."),
        "info"
      );
      const clearStatus = () => setStatus("", "");
      video.addEventListener("loadeddata", clearStatus);
      video.addEventListener("canplay", clearStatus);
      video.addEventListener("waiting", () => {
        setStatus(currentLang === "es" ? "Cargando..." : "Buffering...", "info");
      });
      video.addEventListener("stalled", () => {
        setStatus(
          currentLang === "es" ? "Conexion lenta, puedes usar Abrir." : "Slow connection, you can use Open.",
          "warning"
        );
      });
      video.addEventListener("error", () => {
        inlineVideoEl = null;
        appendVideoFallback(
          currentLang === "es"
            ? "Este video no se puede reproducir inline en este dispositivo."
            : "This video cannot play inline on this device."
        );
      }, { once: true });
      inlineVideoEl = video;
      if (litePreview) {
        const overlayBtn = document.createElement("button");
        overlayBtn.type = "button";
        overlayBtn.className = "message-media-video-overlay";
        overlayBtn.textContent = currentLang === "es" ? "Reproducir" : "Play";
        overlayBtn.addEventListener("click", () => {
          try {
            video.load();
            const playPromise = video.play?.();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } catch {
            // ignore playback start errors; user can still open externally.
          }
        });
        const hideOverlay = () => {
          overlayBtn.classList.add("hidden");
        };
        const showOverlay = () => {
          overlayBtn.classList.remove("hidden");
        };
        video.addEventListener("play", hideOverlay);
        video.addEventListener("pause", showOverlay);
        video.addEventListener("ended", showOverlay);
        videoWrap.appendChild(overlayBtn);
      }
      videoWrap.appendChild(video);
      videoWrap.appendChild(status);
      card.appendChild(videoWrap);
    }
  } else if (isVoice && assetUrl) {
    const voiceWrap = document.createElement("div");
    voiceWrap.className = "message-voice-player";
    const audio = document.createElement("audio");
    audio.className = "message-voice-audio";
    audio.src = assetUrl;
    audio.controls = true;
    audio.preload = "metadata";
    voiceWrap.appendChild(audio);
    card.appendChild(voiceWrap);
  }

  const tags = normalizeLooseTagList(attachment.tags || []);
  if (tags.length) {
    const tagsWrap = document.createElement("div");
    tagsWrap.className = "message-media-tags";
    tags.forEach((tagText) => {
      const tag = document.createElement("span");
      tag.className = "message-media-tag";
      tag.textContent = tagText;
      tagsWrap.appendChild(tag);
    });
    card.appendChild(tagsWrap);
  }

  const actions = document.createElement("div");
  actions.className = "message-media-actions";

  if (assetUrl) {
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "ghost";
    openBtn.textContent = pickCopy(MESSAGES_COPY.mediaOpen);
    openBtn.addEventListener("click", () => {
      window.open(assetUrl, "_blank", "noopener,noreferrer");
    });
    actions.appendChild(openBtn);
  }

  if (isVideo && (inlineVideoEl || assetUrl)) {
    const fullscreenBtn = document.createElement("button");
    fullscreenBtn.type = "button";
    fullscreenBtn.className = "ghost";
    fullscreenBtn.textContent = pickCopy(MESSAGES_COPY.mediaFullscreen);
    fullscreenBtn.addEventListener("click", () => {
      openMessageVideoFullscreen(inlineVideoEl, assetUrl);
    });
    actions.appendChild(fullscreenBtn);
  }

  if (allowReceiverActions) {
    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "ghost";
    favBtn.textContent = pickCopy(MESSAGES_COPY.mediaFavorite);
    favBtn.addEventListener("click", () => {
      handleMessageAttachmentFavorite(attachment);
    });
    actions.appendChild(favBtn);

    const mediaBtn = document.createElement("button");
    mediaBtn.type = "button";
    mediaBtn.className = "ghost";
    mediaBtn.textContent = pickCopy(MESSAGES_COPY.mediaSaveToMedia);
    mediaBtn.addEventListener("click", () => {
      handleMessageAttachmentSaveToMedia(attachment);
    });
    actions.appendChild(mediaBtn);
  }
  if (actions.children.length) {
    card.appendChild(actions);
  }
  return card;
}

function showChatSkeletons(count = 5) {
  if (!messagesFeed) return;
  messagesFeed.innerHTML = "";
  const total = Math.max(3, Number(count || 5));
  for (let index = 0; index < total; index += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = `message-skeleton${index % 2 ? " own" : ""}`;
    skeleton.innerHTML = `
      <span class="message-skeleton-line lg shimmer"></span>
      <span class="message-skeleton-line md shimmer"></span>
      <span class="message-skeleton-line sm shimmer"></span>
    `;
    messagesFeed.appendChild(skeleton);
  }
}

function renderMessagesFeed(current) {
  if (!messagesFeed) return;
  if (messagesFeedLoading) {
    showChatSkeletons();
    return;
  }
  messagesFeed.innerHTML = "";
  const selectedThread = getSelectedMessageThread();
  const threadId = String(selectedThread?.id || "").trim();
  const animatedState = messagesAnimatedEntryState[threadId] && typeof messagesAnimatedEntryState[threadId] === "object"
    ? { ...messagesAnimatedEntryState[threadId] }
    : {};
  const rows = dedupeMessageEntries(messagesFeedRows.length ? messagesFeedRows : (selectedThread?.messageHistory || []))
    .filter((entry) => !isMessageEntryPendingDelete(entry, threadId));
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "small muted";
    empty.textContent = pickCopy(MESSAGES_COPY.noMessages);
    messagesFeed.appendChild(empty);
    return;
  }

  rows.forEach((entry) => {
    const isOwn = entry.senderUid === current?.uid;
    const entryKey = String(entry.id || entry.clientMessageId || `${entry.senderUid}-${entry.createdAt}`).trim();
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    if (entryKey && !animatedState[entryKey]) {
      bubble.classList.add("message-new");
      animatedState[entryKey] = true;
    }
    if (isOwn) {
      bubble.classList.add("own");
    } else {
      bubble.classList.add("incoming");
    }

    const header = document.createElement("div");
    header.className = "message-bubble-header";
    const senderBlock = document.createElement("div");
    senderBlock.className = "message-bubble-sender";
    const sender = document.createElement("strong");
    sender.textContent = isOwn
      ? pickCopy(MESSAGES_COPY.you)
      : entry.senderName;
    senderBlock.appendChild(sender);
    if (!isOwn && entry.senderRole) {
      const role = document.createElement("small");
      role.textContent = getRoleLabelEnglish(entry.senderRole);
      senderBlock.appendChild(role);
    }

    const time = document.createElement("span");
    time.className = "message-bubble-time-wrap";
    const timeText = document.createElement("span");
    timeText.textContent = formatMessageTimestamp(entry.createdAt);
    time.appendChild(timeText);
    if (isOwn) {
      const readCheck = document.createElement("span");
      readCheck.className = `message-read-check ${entry.read ? "read" : "unread"}`;
      readCheck.textContent = "✓✓";
      readCheck.title = pickCopy(entry.read ? MESSAGES_COPY.readReceiptSeen : MESSAGES_COPY.readReceiptSent);
      time.appendChild(readCheck);
    }
    const canDelete = canDeleteMessageEntry(entry, current, selectedThread);
    if (canDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "message-bubble-delete-btn";
      deleteBtn.textContent = pickCopy(MESSAGES_COPY.deleteMessageBtn);
      deleteBtn.title = pickCopy(MESSAGES_COPY.deleteMessageBtn);
      const deleting = isMessageDeleteInFlight(entry);
      deleteBtn.disabled = deleting;
      if (deleting) {
        deleteBtn.textContent = currentLang === "es" ? "..." : "...";
      }
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isMessageDeleteInFlight(entry)) return;
        queueMessageEntrySwipeDelete(entry, threadId, current);
      });
      time.appendChild(deleteBtn);
    }
    header.appendChild(senderBlock);
    header.appendChild(time);

    const body = document.createElement("div");
    body.className = "message-bubble-body";
    body.textContent = entry.text;

    bubble.appendChild(header);
    bubble.appendChild(body);
    const attachments = Array.isArray(entry.attachments) ? entry.attachments : [];
    if (attachments.length) {
      const mediaWrap = document.createElement("div");
      mediaWrap.className = "message-bubble-media";
      attachments.forEach((attachment) => {
        mediaWrap.appendChild(buildMessageAttachmentCard(attachment, {
          allowReceiverActions: !isOwn
        }));
      });
      bubble.appendChild(mediaWrap);
    }
    if (canDelete && entry?.id && threadId) {
      bindSwipeDeleteGesture(bubble, {
        key: getMessageEntrySwipeDeleteKey(threadId, String(entry.id || "").trim()),
        onSwipeDelete: () => {
          if (isMessageDeleteInFlight(entry)) return;
          queueMessageEntrySwipeDelete(entry, threadId, current);
        }
      });
    }
    messagesFeed.appendChild(bubble);
  });
  if (threadId) {
    messagesAnimatedEntryState = {
      ...messagesAnimatedEntryState,
      [threadId]: animatedState
    };
  }
}

function renderMessages() {
  if (!messageList) return;

  setTextContent(messagesPanelTitle, MESSAGES_COPY.title);
  setTextContent(messagesPanelSubtitle, MESSAGES_COPY.subtitle);
  setTextContent(messagesPanelChip, MESSAGES_COPY.chip);
  renderMessagesWorkspaceNav();
  renderMessagesFilterTabs();
  setTextContent(messageComposerLabel, MESSAGES_COPY.composerLabel);
  setTextContent(messageComposerFilesLabel, MESSAGES_COPY.composerFilesLabel);
  setTextContent(messageComposerFilesClearBtn, MESSAGES_COPY.clearMedia);
  if (messageRecordVoiceBtn) {
    messageRecordVoiceBtn.title = messagesVoiceRecorder?.state === "recording"
      ? pickCopy(MESSAGES_COPY.voiceRecordStop)
      : pickCopy(MESSAGES_COPY.voiceRecordStart);
  }
  if (messageComposerInput) {
    messageComposerInput.placeholder = pickCopy(MESSAGES_COPY.composerPlaceholder);
  }
  renderMessageComposerFiles();
  updateMessagesUnreadIndicators();

  const current = getMessagesCurrentUser();
  const sidebarTitle = isParentRole(current?.role)
    ? MESSAGES_COPY.sidebarTitleParent
    : isCoachMessagingUser(current)
      ? MESSAGES_COPY.sidebarTitleCoach
      : MESSAGES_COPY.sidebarTitleAthlete;
  setTextContent(messagesSidebarTitle, sidebarTitle);
  const sidebarHint = isParentRole(current?.role)
    ? MESSAGES_COPY.sidebarHintParent
    : isCoachMessagingUser(current)
      ? MESSAGES_COPY.sidebarHintCoach
      : MESSAGES_COPY.sidebarHintAthlete;
  setTextContent(messagesSidebarHint, sidebarHint);
  setTextContent(messagesOpenContactsBtn, MESSAGES_COPY.openContactsBtn);
  if (messagesSearchInput) {
    messagesSearchInput.placeholder = pickCopy(MESSAGES_COPY.searchPlaceholder);
    if (messagesSearchInput.value !== messagesSearchQuery) {
      messagesSearchInput.value = messagesSearchQuery;
    }
  }

  if (!current || !firebaseFirestoreInstance) {
    setTextContent(messagesEmptyTitle, MESSAGES_COPY.emptyTitle);
    setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyAuth);
    messagesEmptyState?.classList.remove("hidden");
    messagesThreadView?.classList.add("hidden");
    if (messagesCoachList) messagesCoachList.innerHTML = "";
    if (messageList) messageList.innerHTML = "";
    if (messagesStatus) messagesStatus.textContent = pickCopy(MESSAGES_COPY.signedOut);
    if (messagesSearchInput) {
      messagesSearchInput.disabled = true;
    }
    renderTypingIndicator(null, current);
    renderMessagesThreadHeaderActions(current, null);
    setMessagesThreadOpenState(null);
    renderMessagesWorkspacePanels(current);
    return;
  }

  if (messagesSearchInput) {
    messagesSearchInput.disabled = false;
  }

  if (messagesSessionUid !== current.uid) {
    ensureMessagesSession().catch((err) => {
      console.warn("Failed to initialize messages session", err);
      setMessagesStatus(MESSAGES_COPY.loadError, "error");
      renderMessages();
    });
  }

  renderMessagesThreadList(current);
  renderMessagesWorkspacePanels(current);

  const selectedThread = getSelectedMessageThread();
  if (selectedThread && !canMessageThread(current, selectedThread)) {
    messagesSelectedThreadId = "";
    subscribeToMessageFeed("");
    renderMessages();
    return;
  }
  renderTypingIndicator(selectedThread, current);
  setMessagesThreadOpenState(selectedThread);
  renderMessagesThreadHeaderActions(current, selectedThread);
  const threadIsOpening = isMessageThreadOpening(messagesSelectedThreadId);
  const composerDisabled = !selectedThread
    || messagesFeedLoading
    || messagesSendInFlight
    || threadIsOpening;
  if (messageComposerInput) {
    messageComposerInput.disabled = composerDisabled;
  }
  if (messageComposerFilesInput) {
    messageComposerFilesInput.disabled = composerDisabled;
  }
  if (messageComposerFilesClearBtn) {
    messageComposerFilesClearBtn.disabled = composerDisabled || !messagesComposerFiles.length;
  }
  if (messageComposerTagsInput) {
    messageComposerTagsInput.disabled = composerDisabled;
  }
  if (messageSendBtn) {
    messageSendBtn.disabled = composerDisabled;
    messageSendBtn.textContent = messagesSendInFlight
      ? pickCopy(MESSAGES_COPY.sending)
      : threadIsOpening
        ? (currentLang === "es" ? "Abriendo chat..." : "Opening chat...")
        : pickCopy(MESSAGES_COPY.send);
  }
  if (messageRecordVoiceBtn) {
    messageRecordVoiceBtn.disabled = composerDisabled && messagesVoiceRecorder?.state !== "recording";
    updateVoiceRecordButtonUi();
  }
  if (!selectedThread) {
    setTextContent(messagesEmptyTitle, MESSAGES_COPY.emptyTitle);
    if (!messagesContactRows.length) {
      setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyNoContacts);
    } else if (isParentRole(current.role)) {
      setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyParent);
    } else if (isCoachMessagingUser(current)) {
      setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyCoach);
    } else {
      setTextContent(messagesEmptyBody, MESSAGES_COPY.emptyBodyAthlete);
    }
    messagesEmptyState?.classList.remove("hidden");
    messagesThreadView?.classList.add("hidden");
    if (messagesFeed) messagesFeed.innerHTML = "";
    setMessagesThreadOpenState(null);
    renderMessagesWorkspacePanels(current);
    return;
  }

  const other = getMessageOtherParticipant(selectedThread, current.uid);
  messagesEmptyState?.classList.add("hidden");
  messagesThreadView?.classList.remove("hidden");
  if (messagesThreadTitle) messagesThreadTitle.textContent = other.name || pickCopy(MESSAGES_COPY.title);
  if (messagesThreadAvatar) {
    renderAvatarElement(messagesThreadAvatar, {
      photo: getProfilePhotoValue(other),
      name: other.name || "User",
      fallback: getMessageContactInitials(other.name || "U")
    });
  }
  if (messagesThreadMeta) {
    const metaBits = [isTeamChatThread(selectedThread) ? TEAM_CHAT_TITLE : getRoleLabelEnglish(other.role)];
    if (selectedThread.lastMessageAt) {
      metaBits.push(formatMessageTimestamp(selectedThread.lastMessageAt));
    }
    messagesThreadMeta.textContent = metaBits.filter(Boolean).join(" - ");
  }
  if (messagesThreadBadge) {
    messagesThreadBadge.textContent = pickCopy(isTeamChatThread(selectedThread)
      ? MESSAGES_COPY.teamBadge
      : MESSAGES_COPY.privateBadge);
  }
  if (messagesStatus) {
    messagesStatus.textContent = pickCopy(messagesStatusCopy);
    messagesStatus.dataset.state = messagesStatusType || "";
  }
  renderMessagesFeed(current);
  markSelectedMessageThreadSeen();
  renderMessagesWorkspacePanels(current);
}

async function handleMessageComposerSubmit(event) {
  event.preventDefault();
  if (messagesSendInFlight) return;
  const current = getMessagesCurrentUser();
  const selectedThread = getSelectedMessageThread();
  const typedText = String(messageComposerInput?.value || "").trim();
  const selectedFiles = [...messagesComposerFiles];
  const fileValidation = validateMessageComposerFiles(selectedFiles);
  const threadId = String(selectedThread?.id || "").trim();

  if (!typedText && !selectedFiles.length) {
    toast(pickCopy(MESSAGES_COPY.needContent));
    return;
  }
  if (!fileValidation.valid) {
    toast(pickCopy(getMessageFileValidationCopy(fileValidation.reason)));
    return;
  }
  if (!current || !selectedThread || !threadId) {
    setMessagesStatus(MESSAGES_COPY.loadError, "error");
    return;
  }
  if (!canMessageThread(current, selectedThread)) {
    setMessagesStatus({
      en: "This thread is no longer allowed for your role or relationship links.",
      es: "Este chat ya no esta permitido para tu rol o relacion vinculada."
    }, "error");
    renderMessages();
    return;
  }
  if (isMessageThreadOpening(threadId)) {
    setMessagesStatus(
      currentLang === "es" ? "Espera a que el chat termine de abrir." : "Wait for the thread to finish opening.",
      "error"
    );
    renderMessages();
    return;
  }
  clearMessagesTypingTimer();
  setThreadTypingState(threadId, false).catch(() => {});
  const sendParticipants = getMessageThreadParticipantsForSend(selectedThread, current);
  const receiver = resolveMessageThreadContact(selectedThread, current.uid);
  if (!isTeamChatThread(selectedThread) && !canMessageContact(current, receiver)) {
    setMessagesStatus({
      en: "This recipient is not available in your linked messaging scope.",
      es: "Este destinatario no esta disponible en tu alcance de mensajeria vinculada."
    }, "error");
    renderMessages();
    return;
  }
  if (!isTeamChatThread(selectedThread) && sendParticipants.length < 2) {
    setMessagesStatus(
      {
        en: "Could not resolve participants for this chat. Open a new chat and try again.",
        es: "No se pudieron resolver los participantes de este chat. Abre un chat nuevo e intenta otra vez."
      },
      "error"
    );
    renderMessages();
    return;
  }
  ensureLocalMessageThreadParticipants(threadId, sendParticipants);
  const fileFingerprint = selectedFiles.map((file) => `${file.name}:${file.size}`).join("|");
  const sendFingerprint = `${threadId}:${typedText.toLowerCase()}:${fileFingerprint}`;
  const lastSentAt = Number(messagesLastSendByThread[sendFingerprint] || 0);
  if (lastSentAt && Date.now() - lastSentAt < 2500) {
    return;
  }
  messagesSendInFlight = true;
  messagesLastSendByThread = {
    ...messagesLastSendByThread,
    [sendFingerprint]: Date.now()
  };
  const optimisticMessageId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const optimisticCreatedAt = new Date().toISOString();
  const optimisticClientMessageId = `pending-${threadId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let uploadedAttachments = [];
  const messageTags = getMessageComposerTagList();
  let finalText = typedText;
  if (selectedFiles.length) {
    try {
      setMessagesStatus(MESSAGES_COPY.sendingMedia, "");
      renderMessages();
      uploadedAttachments = await uploadMessageComposerAttachments(
        selectedFiles,
        messageTags,
        ({ current: currentFileIndex = 0, total = selectedFiles.length, file = null, phase = "" } = {}) => {
          if (phase !== "uploading") return;
          const progressLabel = formatMessageUploadProgressStatus(currentFileIndex, total, file?.name || "");
          setMessagesStatus(
            {
              en: progressLabel,
              es: progressLabel
            },
            ""
          );
          renderMessages();
        }
      );
    } catch (err) {
      console.warn("Failed to upload message media", err);
      messagesSendInFlight = false;
      const errCode = String(err?.code || err?.message || "").toLowerCase();
      const copy = errCode.includes("auth")
        ? MESSAGES_COPY.mediaUploadAuthError
        : errCode.includes("timeout")
          ? MESSAGES_COPY.mediaUploadTimeoutError
          : MESSAGES_COPY.mediaUploadGenericError;
      setMessagesStatus(copy, "error");
      renderMessages();
      return;
    }
    if (!finalText) {
      finalText = buildMessageAttachmentSummaryText(uploadedAttachments);
    }
  }
  if (!finalText) {
    messagesSendInFlight = false;
    toast(pickCopy(MESSAGES_COPY.needContent));
    return;
  }
  const optimisticMessage = normalizeMessageData({
    id: optimisticMessageId,
    clientMessageId: optimisticClientMessageId,
    text: finalText,
    senderUid: current.uid,
    senderName: current.name || current.email || "User",
    senderRole: current.role,
    createdAt: optimisticCreatedAt,
    attachments: uploadedAttachments,
    messageTags,
    read: false,
    readByUid: "",
    readAt: "",
    optimistic: true
  }, optimisticMessageId);
  const previousThreadState = selectedThread ? {
    lastMessageText: selectedThread.lastMessageText,
    lastSenderUid: selectedThread.lastSenderUid,
    lastMessageAt: selectedThread.lastMessageAt,
    updatedAt: selectedThread.updatedAt,
    messageHistory: Array.isArray(selectedThread.messageHistory) ? [...selectedThread.messageHistory] : []
  } : null;
  addPendingThreadEntry(threadId, optimisticMessage);
  messagesFeedRows = mergePendingMessagesIntoFeed(threadId, messagesFeedRows);
  updateLocalThreadPreview(threadId, {
    text: finalText,
    senderUid: current.uid,
    createdAt: optimisticMessage.createdAt,
    messageEntry: optimisticMessage
  });
  if (messageComposerInput) messageComposerInput.value = "";
  clearMessageComposerMediaInputs();
  renderMessages();

  try {
    const committedMessage = await appendMessageToThread({
      threadId,
      participants: sendParticipants,
      sender: current,
      text: finalText,
      attachments: uploadedAttachments,
      messageTags,
      clientMessageId: optimisticMessage.clientMessageId,
      createdAt: optimisticMessage.createdAt
    });
    toast(pickCopy(MESSAGES_COPY.sentToast));
    resetMessagesStatus();
    markMessageThreadSeen(threadId, messageTimestampToMillis(committedMessage?.createdAt || optimisticMessage.createdAt));
    renderMessages();
  } catch (err) {
    console.warn("Failed to send message", err);
    removePendingThreadEntry(threadId, optimisticMessage.clientMessageId);
    messagesFeedRows = mergePendingMessagesIntoFeed(threadId, messagesFeedRows);
    if (previousThreadState) {
      messagesThreadRows = sortMessageThreads(messagesThreadRows.map((thread) => (
        thread.id !== threadId
          ? thread
          : {
              ...thread,
              lastMessageText: previousThreadState.lastMessageText,
              lastSenderUid: previousThreadState.lastSenderUid,
              lastMessageAt: previousThreadState.lastMessageAt,
              updatedAt: previousThreadState.updatedAt,
              messageHistory: previousThreadState.messageHistory
            }
      )));
    }
    if (messageComposerInput) {
      messageComposerInput.value = typedText;
      messageComposerInput.focus();
    }
    setMessageComposerFiles(selectedFiles);
    if (messageComposerTagsInput) {
      messageComposerTagsInput.value = messageTags.join(", ");
    }
    setMessagesStatus(getMessageSendErrorCopy(err), "error");
    renderMessages();
  } finally {
    messagesSendInFlight = false;
    renderMessages();
  }
}

function setMessageVoiceStatus(copy = "", type = "") {
  if (!messageVoiceStatus) return;
  messageVoiceStatus.textContent = pickCopy(copy);
  messageVoiceStatus.dataset.state = type || "";
}

function getVoiceRecordingMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg"
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || "";
}

function stopVoiceRecordingStream() {
  if (!messagesVoiceStream) return;
  try {
    messagesVoiceStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore track stop errors
      }
    });
  } finally {
    messagesVoiceStream = null;
  }
}

function updateVoiceRecordButtonUi() {
  if (!messageRecordVoiceBtn) return;
  const isRecording = messagesVoiceRecorder?.state === "recording";
  messageRecordVoiceBtn.classList.toggle("recording", isRecording);
  messageRecordVoiceBtn.setAttribute("aria-pressed", isRecording ? "true" : "false");
  messageRecordVoiceBtn.textContent = isRecording ? "⏹" : "🎤";
  messageRecordVoiceBtn.title = pickCopy(isRecording ? MESSAGES_COPY.voiceRecordStop : MESSAGES_COPY.voiceRecordStart);
}

async function sendVoiceMessageBlob(blob, mimeType = "audio/webm") {
  const current = getMessagesCurrentUser();
  const selectedThread = getSelectedMessageThread();
  const threadId = String(selectedThread?.id || "").trim();
  if (!blob || !current?.uid || !selectedThread || !threadId) {
    setMessageVoiceStatus(MESSAGES_COPY.voiceError, "error");
    return;
  }
  if (messagesSendInFlight) {
    setMessageVoiceStatus(MESSAGES_COPY.sending, "");
    return;
  }
  const sendParticipants = getMessageThreadParticipantsForSend(selectedThread, current);
  if (!isTeamChatThread(selectedThread) && sendParticipants.length < 2) {
    setMessageVoiceStatus(MESSAGES_COPY.voiceError, "error");
    return;
  }
  const ext = mimeType.includes("mpeg") ? "mp3" : "webm";
  const fileName = `voice-${Date.now()}.${ext}`;
  messagesSendInFlight = true;
  setMessagesStatus(MESSAGES_COPY.voiceUploading, "");
  setMessageVoiceStatus(MESSAGES_COPY.voiceUploading, "");
  renderMessages();
  try {
    const uploaded = await uploadBlobToFirebase(blob, fileName, {
      kind: "voice",
      contentType: mimeType || "audio/webm",
      customMetadata: {
        uploaderUid: current.uid,
        source: "wpl-chat-voice"
      }
    });
    const mediaAssetId = await registerMediaAssetInWorkspace({
      file: new File([blob], fileName, { type: mimeType || "audio/webm" }),
      assetPath: uploaded.downloadURL,
      assetStoragePath: uploaded.fullPath,
      source: "messages",
      mediaType: "Voice",
      tags: ["voice"]
    });
    const voiceAttachment = normalizeMessageAttachment({
      id: `voice-${Date.now()}`,
      mediaAssetId,
      name: fileName,
      mediaType: "Voice",
      assetPath: uploaded.downloadURL,
      assetStoragePath: uploaded.fullPath,
      contentType: uploaded.contentType,
      size: uploaded.size,
      tags: ["voice"]
    });
    await appendMessageToThread({
      threadId,
      participants: sendParticipants,
      sender: current,
      text: currentLang === "es" ? "Mensaje de voz" : "Voice message",
      attachments: [voiceAttachment],
      messageTags: ["voice"]
    });
    setMessageVoiceStatus(MESSAGES_COPY.voiceReady, "ok");
    resetMessagesStatus();
    renderMessages();
  } catch (err) {
    console.warn("Voice message send failed", err);
    setMessagesStatus(MESSAGES_COPY.voiceError, "error");
    setMessageVoiceStatus(MESSAGES_COPY.voiceError, "error");
    renderMessages();
  } finally {
    messagesSendInFlight = false;
    renderMessages();
  }
}

async function startVoiceMessageRecording() {
  if (messagesVoiceRecorder?.state === "recording") return;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    setMessageVoiceStatus(MESSAGES_COPY.voiceUnsupported, "error");
    return;
  }
  const selectedThread = getSelectedMessageThread();
  if (!selectedThread?.id) {
    setMessageVoiceStatus(MESSAGES_COPY.emptyBodyCoach, "error");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    messagesVoiceStream = stream;
    const mimeType = getVoiceRecordingMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    messagesVoiceRecorder = recorder;
    messagesVoiceChunks = [];
    messagesVoiceStartedAt = Date.now();
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        messagesVoiceChunks.push(event.data);
      }
    });
    recorder.start();
    updateVoiceRecordButtonUi();
    setMessageVoiceStatus(MESSAGES_COPY.voiceRecordingNow, "");
  } catch (err) {
    const code = String(err?.name || err?.code || "").toLowerCase();
    setMessageVoiceStatus(
      code.includes("denied") || code.includes("notallowed")
        ? MESSAGES_COPY.voicePermissionDenied
        : MESSAGES_COPY.voiceError,
      "error"
    );
  }
}

async function stopVoiceMessageRecording({ discard = false } = {}) {
  const recorder = messagesVoiceRecorder;
  if (!recorder) return;
  const mimeType = recorder.mimeType || "audio/webm";
  if (recorder.state === "recording") {
    await new Promise((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
  }
  const chunks = [...messagesVoiceChunks];
  messagesVoiceChunks = [];
  messagesVoiceRecorder = null;
  stopVoiceRecordingStream();
  updateVoiceRecordButtonUi();
  if (discard) {
    setMessageVoiceStatus("", "");
    return;
  }
  const durationMs = Math.max(0, Date.now() - Number(messagesVoiceStartedAt || Date.now()));
  if (!chunks.length || durationMs < 500) {
    setMessageVoiceStatus(MESSAGES_COPY.voiceError, "error");
    return;
  }
  const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
  await sendVoiceMessageBlob(blob, mimeType);
}

function resolveThreadCoachUid(selectedThread = null, current = getMessagesCurrentUser()) {
  const participants = Array.isArray(selectedThread?.participantProfiles) ? selectedThread.participantProfiles : [];
  const coach = participants.find((participant) => normalizeMessageParticipantRole(participant.role, participant.email) === "coach");
  if (coach?.uid) return coach.uid;
  if (isCoachMessagingUser(current)) return current.uid;
  return String(getProfile()?.linkedCoachUid || "").trim();
}

function resolveThreadAthleteIdentity(selectedThread = null, current = getMessagesCurrentUser()) {
  const participants = Array.isArray(selectedThread?.participantProfiles) ? selectedThread.participantProfiles : [];
  const athlete = participants.find((participant) => normalizeMessageParticipantRole(participant.role, participant.email) === "athlete");
  if (athlete?.uid) {
    return {
      athleteUid: athlete.uid,
      athleteId: String(athlete.linkedAthleteId || "").trim(),
      athleteName: athlete.name || ""
    };
  }
  if (isAthleteRole(current?.role)) {
    return {
      athleteUid: current.uid,
      athleteId: String(current.linkedAthleteId || "").trim(),
      athleteName: current.name || ""
    };
  }
  return {
    athleteUid: "",
    athleteId: "",
    athleteName: ""
  };
}

function normalizeTrainingLogRecord(id = "", data = {}) {
  return {
    id: String(id || "").trim(),
    createdAt: normalizeFirestoreDateValue(data.createdAt || data.updatedAt || data.loggedAt || ""),
    athleteUid: String(data.athleteUid || data.userUid || "").trim(),
    athleteId: String(data.athleteId || "").trim(),
    athleteName: String(data.athleteName || data.name || "").trim(),
    title: String(data.title || data.sessionTitle || data.planTitle || "").trim(),
    focus: String(data.focus || data.topic || data.trainingFocus || "").trim(),
    duration: String(data.duration || data.totalTime || "").trim(),
    completion: String(data.completion || data.status || "").trim(),
    note: String(data.note || data.summary || data.coachNote || "").trim(),
    readiness: String(data.readiness || data.energy || "").trim()
  };
}

function doesTrainingLogMatchAthlete(log = {}, athlete = {}) {
  if (!log) return false;
  if (athlete.athleteUid && log.athleteUid && athlete.athleteUid === log.athleteUid) return true;
  if (athlete.athleteId && log.athleteId && athlete.athleteId === log.athleteId) return true;
  if (athlete.athleteName && log.athleteName && normalizeName(athlete.athleteName) === normalizeName(log.athleteName)) return true;
  return false;
}

async function getLatestTrainingLogForThread(selectedThread, current) {
  const coachUid = resolveThreadCoachUid(selectedThread, current);
  const athlete = resolveThreadAthleteIdentity(selectedThread, current);
  if (!coachUid) return null;
  const logsRef = getCoachWorkspaceCollectionRef("training_logs", coachUid);
  if (!logsRef) return null;
  const snapshot = await withTimeout(
    logsRef.orderBy("createdAt", "desc").limit(25).get(),
    FIREBASE_OP_TIMEOUT_MS,
    "firestore_training_log_timeout"
  );
  const logs = snapshot.docs
    .map((doc) => normalizeTrainingLogRecord(doc.id, doc.data() || {}))
    .filter((row) => row.createdAt);
  const match = logs.find((log) => doesTrainingLogMatchAthlete(log, athlete));
  return match || logs[0] || null;
}

function buildTrainingProgressMessage(log = {}, athleteName = "") {
  const safeAthleteName = athleteName || log.athleteName || "Athlete";
  const when = formatMessageTimestamp(log.createdAt || "");
  const lines = [
    currentLang === "es" ? "Actualizacion de Progreso" : "Progress Update",
    `${currentLang === "es" ? "Atleta" : "Athlete"}: ${safeAthleteName}`
  ];
  if (when) lines.push(`${currentLang === "es" ? "Fecha" : "Date"}: ${when}`);
  if (log.title) lines.push(`${currentLang === "es" ? "Sesion" : "Session"}: ${log.title}`);
  if (log.focus) lines.push(`${currentLang === "es" ? "Enfoque" : "Focus"}: ${log.focus}`);
  if (log.duration) lines.push(`${currentLang === "es" ? "Duracion" : "Duration"}: ${log.duration}`);
  if (log.readiness) lines.push(`${currentLang === "es" ? "Readiness" : "Readiness"}: ${log.readiness}`);
  if (log.completion) lines.push(`${currentLang === "es" ? "Estado" : "Status"}: ${log.completion}`);
  if (log.note) lines.push(`${currentLang === "es" ? "Nota" : "Note"}: ${log.note}`);
  return lines.join("\n");
}

async function shareThreadProgressSnapshot() {
  const current = getMessagesCurrentUser();
  const selectedThread = getSelectedMessageThread();
  const threadId = String(selectedThread?.id || "").trim();
  if (!current?.uid || !selectedThread || !threadId) {
    setMessagesStatus(MESSAGES_COPY.shareProgressError, "error");
    return;
  }
  const participants = getMessageThreadParticipantsForSend(selectedThread, current);
  if (participants.length < 2) {
    setMessagesStatus(MESSAGES_COPY.shareProgressError, "error");
    return;
  }
  setMessagesStatus(MESSAGES_COPY.shareProgressSending, "");
  renderMessages();
  try {
    const latestLog = await getLatestTrainingLogForThread(selectedThread, current);
    if (!latestLog) {
      setMessagesStatus(MESSAGES_COPY.shareProgressEmpty, "error");
      return;
    }
    const other = getMessageOtherParticipant(selectedThread, current.uid);
    const message = buildTrainingProgressMessage(latestLog, other.role === "athlete" ? other.name : latestLog.athleteName);
    await appendMessageToThread({
      threadId,
      participants,
      sender: current,
      text: message,
      messageTags: ["progress", "training-log"]
    });
    setMessagesStatus(MESSAGES_COPY.shareProgressSent, "ok");
    toast(pickCopy(MESSAGES_COPY.shareProgressSent));
    renderMessages();
  } catch (err) {
    console.warn("Share progress failed", err);
    setMessagesStatus(MESSAGES_COPY.shareProgressError, "error");
    renderMessages();
  }
}

if (messageComposer && !messagesBound) {
  if (messagesOpenContactsBtn) {
    messagesOpenContactsBtn.addEventListener("click", () => {
      openNewMessageThreadFromButton().catch((err) => {
        console.warn("Could not open a new message thread", err);
        setMessagesStatus(MESSAGES_COPY.loadError, "error");
        renderMessages();
      });
    });
  }
  [messagesModeChatsBtn, messagesModeCallsBtn, messagesModeContactsBtn, messagesModeShareBtn].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      const nextMode = btn.dataset.mode || "chats";
      if (nextMode !== "chats" || isCompactMessagesViewport()) {
        messagesCompactThreadVisible = false;
      }
      setMessagesWorkspaceMode(nextMode, { persist: true, rerender: true });
    });
  });
  if (messagesBackToChatsBtn) {
    messagesBackToChatsBtn.addEventListener("click", () => {
      clearMessagesTypingTimer();
      setThreadTypingState(messagesSelectedThreadId, false).catch(() => {});
      messagesSelectedThreadId = "";
      messagesCompactThreadVisible = false;
      setMessagesThreadOpenState(null);
      renderMessages();
    });
  }
  if (messagesShareProgressBtn) {
    messagesShareProgressBtn.addEventListener("click", () => {
      shareThreadProgressSnapshot().catch((err) => {
        console.warn("Share progress action failed", err);
        setMessagesStatus(MESSAGES_COPY.shareProgressError, "error");
        renderMessages();
      });
    });
  }
  if (messagesThreadVoiceBtn) {
    messagesThreadVoiceBtn.addEventListener("click", () => {
      const current = getMessagesCurrentUser();
      const selected = getSelectedMessageThread();
      const contact = getSelectedThreadContact(current, selected);
      sendMessageCallRequestToContact(contact, "voice").catch((err) => {
        console.warn("Thread voice call request failed", err);
        setMessagesCallsStatus(MESSAGES_COPY.callsSendError, "error");
      });
    });
  }
  if (messagesThreadVideoBtn) {
    messagesThreadVideoBtn.addEventListener("click", () => {
      const current = getMessagesCurrentUser();
      const selected = getSelectedMessageThread();
      const contact = getSelectedThreadContact(current, selected);
      sendMessageCallRequestToContact(contact, "video").catch((err) => {
        console.warn("Thread video call request failed", err);
        setMessagesCallsStatus(MESSAGES_COPY.callsSendError, "error");
      });
    });
  }
  if (messagesThreadMoreBtn) {
    messagesThreadMoreBtn.addEventListener("click", () => {
      deleteOwnMessagesInSelectedThread().catch((err) => {
        console.warn("Thread delete action failed", err);
        setMessagesStatus(MESSAGES_COPY.deleteMessagesError, "error");
        renderMessages();
      });
    });
  }
  messageComposer.addEventListener("submit", handleMessageComposerSubmit);
  if (messageComposerInput) {
    messageComposerInput.addEventListener("input", () => {
      handleComposerTypingInput();
    });
    messageComposerInput.addEventListener("blur", () => {
      clearMessagesTypingTimer();
      setThreadTypingState(messagesSelectedThreadId, false).catch(() => {});
    });
  }
  if (messageRecordVoiceBtn) {
    messageRecordVoiceBtn.addEventListener("click", () => {
      if (messagesVoiceRecorder?.state === "recording") {
        stopVoiceMessageRecording({ discard: false }).catch((err) => {
          console.warn("Voice stop failed", err);
          setMessageVoiceStatus(MESSAGES_COPY.voiceError, "error");
          updateVoiceRecordButtonUi();
        });
        return;
      }
      startVoiceMessageRecording().catch((err) => {
        console.warn("Voice start failed", err);
        setMessageVoiceStatus(MESSAGES_COPY.voiceError, "error");
        updateVoiceRecordButtonUi();
      });
    });
  }
  if (messageComposerFilesInput) {
    messageComposerFilesInput.addEventListener("change", () => {
      const picked = Array.from(messageComposerFilesInput.files || []);
      const validation = validateMessageComposerFiles(picked);
      if (!validation.valid) {
        toast(pickCopy(getMessageFileValidationCopy(validation.reason)));
        clearMessageComposerMediaInputs({ preserveTags: true });
        return;
      }
      setMessageComposerFiles(picked);
    });
  }
  if (messageComposerFilesClearBtn) {
    messageComposerFilesClearBtn.addEventListener("click", () => {
      clearMessageComposerMediaInputs({ preserveTags: true });
      renderMessages();
    });
  }
  if (messagesCallVoiceBtn) {
    messagesCallVoiceBtn.addEventListener("click", () => {
      sendMessageCallRequest("voice").catch((err) => {
        console.warn("Voice call request failed", err);
        setMessagesCallsStatus(MESSAGES_COPY.callsSendError, "error");
      });
    });
  }
  if (messagesCallVideoBtn) {
    messagesCallVideoBtn.addEventListener("click", () => {
      sendMessageCallRequest("video").catch((err) => {
        console.warn("Video call request failed", err);
        setMessagesCallsStatus(MESSAGES_COPY.callsSendError, "error");
      });
    });
  }
  if (messagesCallContactSelect) {
    messagesCallContactSelect.addEventListener("change", () => {
      setMessagesCallsStatus("", "");
    });
  }
  if (messagesShareNativeBtn) {
    messagesShareNativeBtn.addEventListener("click", () => {
      handleMessagesNativeShare().catch((err) => {
        console.warn("Native share failed", err);
        setMessagesShareStatus(MESSAGES_COPY.shareError);
      });
    });
  }
  if (messagesShareFacebookBtn) {
    messagesShareFacebookBtn.addEventListener("click", () => {
      handleMessagesSocialShare("facebook").catch((err) => {
        console.warn("Facebook share failed", err);
        setMessagesShareStatus(MESSAGES_COPY.shareError);
      });
    });
  }
  if (messagesShareInstagramBtn) {
    messagesShareInstagramBtn.addEventListener("click", () => {
      handleMessagesSocialShare("instagram").catch((err) => {
        console.warn("Instagram share failed", err);
        setMessagesShareStatus(MESSAGES_COPY.shareError);
      });
    });
  }
  if (messagesShareTiktokBtn) {
    messagesShareTiktokBtn.addEventListener("click", () => {
      handleMessagesSocialShare("tiktok").catch((err) => {
        console.warn("TikTok share failed", err);
        setMessagesShareStatus(MESSAGES_COPY.shareError);
      });
    });
  }
  if (messagesShareYoutubeBtn) {
    messagesShareYoutubeBtn.addEventListener("click", () => {
      handleMessagesSocialShare("youtube").catch((err) => {
        console.warn("YouTube share failed", err);
        setMessagesShareStatus(MESSAGES_COPY.shareError);
      });
    });
  }
  if (messagesShareUrlInput) {
    messagesShareUrlInput.addEventListener("input", () => {
      setMessagesShareStatus("");
    });
  }
  if (messagesSearchInput) {
    messagesSearchInput.addEventListener("input", () => {
      messagesSearchQuery = String(messagesSearchInput.value || "").trimStart();
      const current = getMessagesCurrentUser();
      renderMessagesThreadList(current);
    });
  }
  if (messagesFilterTabs) {
    messagesFilterTabs.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setMessagesThreadFilter(btn.dataset.filter || "all", { rerender: true });
      });
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      markSelectedMessageThreadSeen();
      return;
    }
    clearMessagesTypingTimer();
    setThreadTypingState(messagesSelectedThreadId, false).catch(() => {});
  });
  window.addEventListener("focus", () => {
    markSelectedMessageThreadSeen();
  });
  window.addEventListener("resize", () => {
    updateResponsiveViewportState();
    const current = getMessagesCurrentUser();
    const selected = getSelectedMessageThread();
    setMessagesThreadOpenState(selected);
    renderMessagesThreadHeaderActions(current, selected);
  });
  messagesBound = true;
}

window.WPLMessagesDomain = {
  renderMessages,
  startMessagesRealtimeSync,
  openDirectMessageThreadWithRetry,
  appendMessageToThread,
  prepareForOpen() {
    if (isCompactMessagesViewport()) {
      messagesCompactThreadVisible = false;
    }
  }
};
