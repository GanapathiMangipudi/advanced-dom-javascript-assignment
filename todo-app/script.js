const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
function debounce(fn, wait = 400){ let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); }; }

const STORAGE_KEY = 'todos_v1';
function loadTodos(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    console.error('loadTodos error', e);
    return [];
  }
}
function saveTodos(todos){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch(e) {
    console.error('saveTodos error', e);
    return false;
  }
}

function uid(){ return Date.now() + Math.floor(Math.random()*10000); }
function formatDate(iso){
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour:'numeric', minute:'2-digit' }).format(d);
  } catch(e) { return iso; }
}
function escapeHtml(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

const todoInput = qs('#todoInput');
const addBtn = qs('#addBtn');
const searchInput = qs('#searchInput');
const filters = qsa('.filter');
const todoList = qs('#todoList');
const counts = qs('#counts');
const emptyState = qs('#emptyState');
const noResults = qs('#noResults');

if (!todoInput || !addBtn || !searchInput || !todoList || !counts) {
  console.warn('Some UI elements are missing. Check your index.html IDs/classes.');
}

let todos = loadTodos();
let currentFilter = 'all';
let currentQuery = '';

window._todos = todos;

function updateCounts(){
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  if (counts) counts.textContent = `(${total} total, ${completed} completed)`;
}

function getFilteredTodos(){
  let list = todos.slice();
  if (currentFilter === 'active') list = list.filter(t => !t.completed);
  if (currentFilter === 'completed') list = list.filter(t => t.completed);
  if (currentQuery && currentQuery.trim().length) {
    const q = currentQuery.trim().toLowerCase();
    list = list.filter(t => t.text.toLowerCase().includes(q));
  }
  return list;
}

function render(){
  if (!todoList) return;
  const list = getFilteredTodos();

  if (todos.length === 0) {
    todoList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (noResults) noResults.style.display = 'none';
    updateCounts();
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  if (list.length === 0) {
    todoList.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    updateCounts();
    return;
  }
  if (noResults) noResults.style.display = 'none';

  todoList.innerHTML = '';
  list.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = todo.id;

    li.innerHTML = `
      <div>
        <input type="checkbox" class="toggle" ${todo.completed ? 'checked' : ''} aria-label="Mark todo complete">
      </div>
      <div class="todo-text ${todo.completed ? 'completed' : ''}">
        <div>${escapeHtml(todo.text)}</div>
        <div class="todo-meta">Created: ${formatDate(todo.createdAt)}</div>
      </div>
      <div>
        <button class="icon-btn delete" title="Delete" aria-label="Delete todo">Delete</button>
      </div>
    `;
    todoList.appendChild(li);
  });

  updateCounts();
}

function addTodo(text){
  const trimmed = (text || '').trim();
  if (!trimmed) return false;
  const t = {
    id: uid(),
    text: trimmed,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(t);
  saveTodos(todos);
  window._todos = todos; // keep debug mirror updated
  render();
  return true;
}

function toggleTodo(id){
  const idx = todos.findIndex(t => String(t.id) === String(id));
  if (idx === -1) return;
  todos[idx].completed = !todos[idx].completed;
  saveTodos(todos);
  window._todos = todos;
  render();
}

function deleteTodo(id){
  todos = todos.filter(t => String(t.id) !== String(id));
  saveTodos(todos);
  window._todos = todos;
  render();
}


window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;

addBtn && addBtn.addEventListener('click', function(){
  const ok = addTodo(todoInput.value);
  if (ok) todoInput.value = '';
  todoInput.focus();
});

todoInput && todoInput.addEventListener('keydown', function(e){
  if (e.key === 'Enter') {
    e.preventDefault();
    const ok = addTodo(todoInput.value);
    if (ok) todoInput.value = '';
  }
});

const onSearch = debounce(function(e){
  currentQuery = e.target.value;
  render();
}, 400);
searchInput && searchInput.addEventListener('input', onSearch);

filters.forEach(btn => {
  btn.addEventListener('click', function(){
    filters.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    render();
  });
});

todoList && todoList.addEventListener('click', function(e){
  const li = e.target.closest('.todo-item');
  if (!li) return;
  const id = li.dataset.id;
  if (!id) return;

  if (e.target.matches('input.toggle')) {
    toggleTodo(id);
    return;
  }
  if (e.target.matches('button.delete')) {
    deleteTodo(id);
    return;
  }
});

// initial render
render();

// friendly debug handle
window.todoApp = { addTodo, toggleTodo, deleteTodo, render };
