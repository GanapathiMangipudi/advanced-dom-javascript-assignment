const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

const STORAGE_KEY = 'contact_messages_v1';

function loadMessages(){
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

function saveMessages(messages){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return true;
  } catch (e) {
    console.error('Could not save messages to localStorage', e);
    return false;
  }
}

function renderMessages() {
  messagesEl.innerHTML = '';

  if (!messages || messages.length === 0) {
    messagesEl.innerHTML = `<div class="empty">No messages yet</div>`;
    return;
  }

  countEl.textContent = `(${messages.length})`;
  messages.slice().reverse().forEach(msg => {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.innerHTML = `
      <div class="message-meta">
        <div>From: <strong>${escapeHtml(msg.name)}</strong> 
          <span class="small">(${escapeHtml(msg.email)})</span></div>
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

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

form.addEventListener('submit', function(e){
  e.preventDefault();

  const msg = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    message: messageInput.value.trim(),
    sent: new Date().toISOString()
  };

  messages.push(msg);
  const ok = saveMessages(messages);
  if(!ok){
    successEl.textContent = 'Saved locally but could not persist to localStorage.';
  }else{
    successEl.textContent = 'Message sent — saved to history!';
  }

  renderMessages();

  form.reset();
  showError('name',''); 
  showError('email',''); 
  showError('message','');


  setTimeout(() => successEl.textContent = '', 2500);
});

messagesEl.addEventListener('click', function(e){
  const btn = e.target.closest('.delete-btn');
  if(!btn) return;
  const id = btn.getAttribute('data-id');
  if(!id) return;

  messages = messages.filter(m => m.id !== id);
  const ok = saveMessages(messages);
  if(!ok){
    alert('Could not update localStorage. Deletion may not persist.');
  }
  renderMessages();
});
-
renderMessages();

messageInput.addEventListener('keydown', function(e){
  if(e.key === 'Enter' && !e.shiftKey){

  }
});
