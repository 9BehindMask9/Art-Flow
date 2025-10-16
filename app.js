const historyList = document.getElementById('history-list');
const historyTemplate = document.getElementById('history-card-template');
const chatTemplate = document.getElementById('chat-message-template');
const canvasTemplate = document.getElementById('canvas-section-template');

const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const presetButtons = Array.from(document.querySelectorAll('.preset-button'));
const fileInput = document.getElementById('file-input');
const uploadTrigger = document.getElementById('upload-trigger');
const uploadHint = document.getElementById('upload-hint');

const saveHistoryButton = document.getElementById('save-history');
const clearHistoryButton = document.getElementById('clear-history');
const canvasSections = document.getElementById('canvas-sections');
const addPageButton = document.getElementById('add-page');

const STORAGE_KEYS = {
  history: 'artflow-history',
  canvas: 'artflow-canvas',
  projectTitle: 'artflow-project-title',
};

const defaultCanvasSuggestions = [
  {
    title: 'Cover Page',
    suggestions: [
      'Introduce your personal brand statement',
      'Showcase a hero piece of work with brief context',
      'Highlight your key skills in a short list',
    ],
  },
  {
    title: 'Portfolio Overview',
    suggestions: [
      'Summarise your design philosophy or creative focus',
      'Outline the types of projects you want to attract',
      'Add testimonials or recognitions that build trust',
    ],
  },
  {
    title: 'Case Study Template',
    suggestions: [
      'Problem statement and client background',
      'Process snapshots: research, ideation, execution',
      'Results, metrics, and lessons learned',
    ],
  },
];

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function retrieve(key, fallback) {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Unable to parse stored data', key, error);
    return fallback;
  }
}

function createHistoryCard(session) {
  const card = historyTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector('h3').textContent = session.title;
  card.querySelector('time').textContent = session.timestamp;
  card.querySelector('.history-summary').textContent = session.summary;
  return card;
}

function renderHistory() {
  const history = retrieve(STORAGE_KEYS.history, []);
  historyList.innerHTML = '';
  history.forEach((session) => {
    historyList.appendChild(createHistoryCard(session));
  });
  if (!history.length) {
    historyList.innerHTML = '<p class="empty">No saved sessions yet.</p>';
  }
}

function renderCanvas() {
  const canvas = retrieve(STORAGE_KEYS.canvas, defaultCanvasSuggestions);
  canvasSections.innerHTML = '';
  canvas.forEach((section, index) => {
    const card = canvasTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('.canvas-page-title').textContent = section.title || `Page ${index + 1}`;
    const list = card.querySelector('.canvas-suggestions');
    list.innerHTML = '';
    section.suggestions.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    card.querySelector('[data-action="focus"]').addEventListener('click', () => {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('pulse');
      setTimeout(() => card.classList.remove('pulse'), 700);
    });
    canvasSections.appendChild(card);
  });
}

function addChatMessage(role, text) {
  const node = chatTemplate.content.firstElementChild.cloneNode(true);
  const avatar = node.querySelector('.avatar');
  const bubble = node.querySelector('.bubble');
  node.classList.add(`role-${role}`);
  avatar.dataset.role = role;
  avatar.textContent = role === 'ai' ? 'AI' : 'You';
  bubble.dataset.role = role;
  bubble.textContent = text;
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function summariseChat() {
  const bubbles = chatLog.querySelectorAll('.bubble');
  if (!bubbles.length) return 'No conversation yet.';
  const last = bubbles[bubbles.length - 1];
  return `${bubbles.length} exchanges • Last topic: ${last.textContent.slice(0, 60)}${last.textContent.length > 60 ? '…' : ''}`;
}

function saveCurrentChat() {
  const summary = summariseChat();
  const titleInput = document.getElementById('project-title');
  const title = titleInput.value.trim() || 'Untitled project';
  const history = retrieve(STORAGE_KEYS.history, []);
  const session = {
    title,
    timestamp: new Date().toLocaleString(),
    summary,
  };
  history.unshift(session);
  persist(STORAGE_KEYS.history, history.slice(0, 12));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.history);
  renderHistory();
}

function handleAISimulatedResponse(prompt) {
  const responses = [
    'Let’s highlight recurring motifs in your work and surface them as a narrative thread.',
    'Consider pairing each project with the challenge you solved and the outcome metrics.',
    'Your portfolio could benefit from an “About” section that ties back to your mission.',
    'Try grouping visuals by process stage to help stakeholders follow your thinking.',
  ];
  const random = responses[Math.floor(Math.random() * responses.length)];
  addChatMessage('ai', `${random}\n\nPrompt understood: “${prompt}”`);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  addChatMessage('user', value);
  chatInput.value = '';
  setTimeout(() => handleAISimulatedResponse(value), 500);
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    chatInput.value = button.dataset.question;
    chatInput.focus();
  });
});

uploadTrigger.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (!fileInput.files.length) {
    uploadHint.textContent = '';
    return;
  }
  const files = Array.from(fileInput.files).map((file) => file.name).join(', ');
  uploadHint.textContent = `Attached: ${files}`;
  addChatMessage('user', `Uploaded files: ${files}`);
  setTimeout(() => handleAISimulatedResponse('Review the uploaded material'), 400);
});

saveHistoryButton.addEventListener('click', saveCurrentChat);
clearHistoryButton.addEventListener('click', clearHistory);

addPageButton.addEventListener('click', () => {
  const canvas = retrieve(STORAGE_KEYS.canvas, defaultCanvasSuggestions);
  const nextIndex = canvas.length + 1;
  canvas.push({
    title: `Custom Page ${nextIndex}`,
    suggestions: [
      'Define the goal for this section',
      'List the assets or visuals to include',
      'Note key messages or takeaways',
    ],
  });
  persist(STORAGE_KEYS.canvas, canvas);
  renderCanvas();
});

const projectTitleInput = document.getElementById('project-title');
projectTitleInput.value = retrieve(STORAGE_KEYS.projectTitle, 'Untitled Portfolio');
projectTitleInput.addEventListener('input', () => {
  persist(STORAGE_KEYS.projectTitle, projectTitleInput.value);
});

function init() {
  renderHistory();
  renderCanvas();
  addChatMessage('ai', 'Welcome to ArtFlow! Ask me anything about curating or elevating your portfolio.');
}

document.addEventListener('DOMContentLoaded', init);
