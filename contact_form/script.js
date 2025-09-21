const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

function debounce(fn, wait = 300) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const STORAGE_KEY = 'contact_messages_v1';

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Could not read messages from localStorage', e);
    return [];
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return true;
  } catch (e) {
    console.error('Could not save messages to localStorage', e);
    return false;
  }
}

function formatSent(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(d);
  } catch (e) {
    return iso;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const validators = {
  name: v => {
    if (!v || v.trim().length === 0) return 'Name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  },
  email: v => {
    if (!v || v.trim().length === 0) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(v.trim())) return 'Enter a valid email address';
    return '';
  },
  message: v => {
    if (!v || v.trim().length === 0) return 'Message is required';
    if (v.trim().length < 10) return 'Message must be at least 10 characters';
    return '';
  }
};
function showError(fieldName, msg) {
  const el = document.querySelector(`.error[data-for="${fieldName}"]`);
  if (el) el.textContent = msg;
}
function validateField(name, value) {
  const validator = validators[name];
  if (!validator) return true;
  const msg = validator(value);
  showError(name, msg);
  return msg === '';
}

const debouncedValidate = {
  name: debounce(e => validateField('name', e.target.value), 300),
  email: debounce(e => validateField('email', e.target.value), 300),
  message: debounce(e => validateField('message', e.target.value), 300)
};

const form = qs('#contactForm');
const nameInput = qs('#name');
const emailInput = qs('#email');
const messageInput = qs('#message');
const messagesEl = qs('#messages');
let countEl = qs('#count');
const successEl = qs('#formSuccess');

if (!countEl) {
  countEl = document.createElement('span');
  countEl.style.display = 'none';
  document.body.appendChild(countEl);
}

let messages = loadMessages();

window.contactMessages = messages;
window.renderMessages = renderMessages; 

function renderMessages() {
  if (!messagesEl) {
    console.warn('#messages element not found');
    return;
  }

  messagesEl.innerHTML = '';

  if (!messages || messages.length === 0) {
    messagesEl.innerHTML = `<div class="empty">No messages yet</div>`;
    countEl.textContent = `(0)`;
    return;
  }

  countEl.textContent = `(${messages.length})`;

  messages.slice().reverse().forEach(msg => {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.innerHTML = `
      <div class="message-meta">
        <div>From: <strong>${escapeHtml(msg.name)}</strong> <span class="small">(${escapeHtml(msg.email)})</span></div>
        <div><span class="small">Sent: ${formatSent(msg.sent)}</span></div>
      </div>
      <div class="message-body">${escapeHtml(msg.message)}</div>
      <div style="margin-top:8px;text-align:right">
        <button class="delete-btn" data-id="${msg.id}">Delete</button>
      </div>
    `;
    messagesEl.appendChild(card);
  });
}

window.renderMessages = renderMessages;

if (nameInput) nameInput.addEventListener('input', debouncedValidate.name);
if (emailInput) emailInput.addEventListener('input', debouncedValidate.email);
if (messageInput) messageInput.addEventListener('input', debouncedValidate.message);

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // immediate (synchronous) validation on submit
    const validName = validateField('name', nameInput.value);
    const validEmail = validateField('email', emailInput.value);
    const validMessage = validateField('message', messageInput.value);

    if (!(validName && validEmail && validMessage)) {
      successEl && (successEl.textContent = '');
      return;
    }

    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      sent: new Date().toISOString()
    };

    messages.push(msg);

    const ok = saveMessages(messages);
    if (!ok) {
      if (successEl) successEl.textContent = 'Saved locally but could not persist to localStorage.';
      console.warn('Could not persist to localStorage.');
    } else {
      if (successEl) successEl.textContent = 'Message sent — saved to history!';
    }

    renderMessages();

    form.reset();
    showError('name', '');
    showError('email', '');
    showError('message', '');

    if (successEl) setTimeout(() => { successEl.textContent = ''; }, 2500);
  });
} else {
  console.warn('Form element (#contactForm) not found — submit handler not bound.');
}

if (messagesEl) {
  messagesEl.addEventListener('click', function(e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;

    messages = messages.filter(m => m.id !== id);
    const ok = saveMessages(messages);
    if (!ok) {
      alert('Could not update localStorage. Deletion may not persist.');
    }
    renderMessages();
  });
}

renderMessages();

if (messageInput) {
  messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
    }
  });
}


window.contact = {
  messages,
  saveMessages,
  loadMessages,
  showError,
  validateField
};
