const STORAGE_KEY = "keep_style_todos_v1";
const THEME_KEY = "keep_style_theme_v1";

const state = {
  todos: [],
  filter: "all",
  search: "",
  composerColor: "slate",
  editColor: "slate",
};

const el = {
  todoForm: document.getElementById("todoForm"),
  titleInput: document.getElementById("titleInput"),
  bodyInput: document.getElementById("bodyInput"),
  colorPicker: document.getElementById("colorPicker"),
  searchInput: document.getElementById("searchInput"),
  filterGroup: document.getElementById("filterGroup"),
  todoGrid: document.getElementById("todoGrid"),
  emptyState: document.getElementById("emptyState"),
  totalCount: document.getElementById("totalCount"),
  activeCount: document.getElementById("activeCount"),
  doneCount: document.getElementById("doneCount"),
  themeToggle: document.getElementById("themeToggle"),
  editModal: document.getElementById("editModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  editForm: document.getElementById("editForm"),
  editId: document.getElementById("editId"),
  editTitle: document.getElementById("editTitle"),
  editBody: document.getElementById("editBody"),
  editColorPicker: document.getElementById("editColorPicker"),
  deleteFromModalBtn: document.getElementById("deleteFromModalBtn"),
  toastContainer: document.getElementById("toastContainer"),
};

function init() {
  loadTodos();
  loadTheme();
  bindEvents();
  render();
  autoResizeTextarea(el.bodyInput);
  autoResizeTextarea(el.editBody);
}

function bindEvents() {
  el.todoForm.addEventListener("submit", onAddTodo);
  el.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    render();
  });

  el.filterGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    [...el.filterGroup.querySelectorAll(".filter-btn")].forEach((b) => {
      b.classList.toggle("active", b === btn);
    });
    render();
  });

  el.colorPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".color-dot");
    if (!btn) return;
    state.composerColor = btn.dataset.color;
    updateColorSelection(el.colorPicker, state.composerColor);
  });

  el.editColorPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".color-dot");
    if (!btn) return;
    state.editColor = btn.dataset.color;
    updateColorSelection(el.editColorPicker, state.editColor);
  });

  el.todoGrid.addEventListener("click", onGridClick);

  el.themeToggle.addEventListener("click", toggleTheme);

  el.closeModalBtn.addEventListener("click", closeModal);
  el.editModal.addEventListener("click", (e) => {
    if (e.target.dataset.closeModal === "true") closeModal();
  });

  el.editForm.addEventListener("submit", onSaveEdit);
  el.deleteFromModalBtn.addEventListener("click", onDeleteFromModal);

  el.bodyInput.addEventListener("input", () => autoResizeTextarea(el.bodyInput));
  el.editBody.addEventListener("input", () => autoResizeTextarea(el.editBody));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.editModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function onAddTodo(e) {
  e.preventDefault();

  const title = el.titleInput.value.trim();
  const body = el.bodyInput.value.trim();

  if (!title) return;

  const todo = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    title,
    body,
    color: state.composerColor,
    done: false,
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  state.todos.unshift(todo);
  persistTodos();
  render();

  el.todoForm.reset();
  state.composerColor = "slate";
  updateColorSelection(el.colorPicker, state.composerColor);
  autoResizeTextarea(el.bodyInput);

  showToast("Todoを追加しました");
}

function onGridClick(e) {
  const button = e.target.closest("[data-action]");
  if (!button) return;

  const card = e.target.closest(".todo-card");
  if (!card) return;

  const id = card.dataset.id;
  const action = button.dataset.action;

  if (action === "toggle-done") {
    toggleDone(id);
  } else if (action === "toggle-pin") {
    togglePin(id);
  } else if (action === "edit") {
    openEditModal(id);
  } else if (action === "delete") {
    deleteTodo(id);
  }
}

function toggleDone(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  todo.done = !todo.done;
  todo.updatedAt = Date.now();

  persistTodos();
  render();
  showToast(todo.done ? "完了にしました" : "未完了に戻しました");
}

function togglePin(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  todo.pinned = !todo.pinned;
  todo.updatedAt = Date.now();

  persistTodos();
  render();
  showToast(todo.pinned ? "ピン留めしました" : "ピン留めを外しました");
}

function deleteTodo(id) {
  state.todos = state.todos.filter((t) => t.id !== id);
  persistTodos();
  render();
  showToast("Todoを削除しました");
}

function openEditModal(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  el.editId.value = todo.id;
  el.editTitle.value = todo.title;
  el.editBody.value = todo.body;
  state.editColor = todo.color;

  updateColorSelection(el.editColorPicker, state.editColor);
  autoResizeTextarea(el.editBody);

  el.editModal.classList.remove("hidden");
  el.editModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  el.editModal.classList.add("hidden");
  el.editModal.setAttribute("aria-hidden", "true");
  el.editForm.reset();
}

function onSaveEdit(e) {
  e.preventDefault();

  const id = el.editId.value;
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  todo.title = el.editTitle.value.trim();
  todo.body = el.editBody.value.trim();
  todo.color = state.editColor;
  todo.updatedAt = Date.now();

  if (!todo.title) {
    showToast("タイトルを入力してください");
    return;
  }

  persistTodos();
  render();
  closeModal();
  showToast("Todoを更新しました");
}

function onDeleteFromModal() {
  const id = el.editId.value;
  if (!id) return;

  deleteTodo(id);
  closeModal();
}

function render() {
  const filtered = getFilteredTodos();
  renderStats();
  renderEmpty(filtered);
  el.todoGrid.innerHTML = filtered.map(createTodoCardHTML).join("");
}

function renderStats() {
  const total = state.todos.length;
  const done = state.todos.filter((t) => t.done).length;
  const active = total - done;

  el.totalCount.textContent = total;
  el.activeCount.textContent = active;
  el.doneCount.textContent = done;
}

function renderEmpty(list) {
  el.emptyState.classList.toggle("hidden", list.length > 0);
}

function getFilteredTodos() {
  let list = [...state.todos];

  list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  if (state.filter === "active") {
    list = list.filter((t) => !t.done);
  } else if (state.filter === "done") {
    list = list.filter((t) => t.done);
  }

  if (state.search) {
    list = list.filter((t) => {
      const text = `${t.title} ${t.body}`.toLowerCase();
      return text.includes(state.search);
    });
  }

  return list;
}

function createTodoCardHTML(todo) {
  const safeTitle = escapeHTML(todo.title);
  const safeBody = escapeHTML(todo.body).replace(/\n/g, "<br>");
  const dateText = formatDate(todo.updatedAt);

  return `
    <article class="todo-card ${todo.done ? "done" : ""}" data-id="${todo.id}" data-color="${todo.color}">
      ${todo.pinned ? `<div class="todo-pin">📌</div>` : ""}
      <div class="todo-top">
        <button class="check-btn" type="button" data-action="toggle-done" aria-label="完了切替"></button>
        <div class="todo-main">
          <h3 class="todo-title">${safeTitle}</h3>
          ${todo.body ? `<p class="todo-body">${safeBody}</p>` : ""}
        </div>
      </div>

      <div class="todo-meta">
        <span class="todo-date">${dateText}</span>
        <div class="todo-actions">
          <button class="card-btn ${todo.pinned ? "active" : ""}" type="button" data-action="toggle-pin" aria-label="ピン留め">
            📌
          </button>
          <button class="card-btn" type="button" data-action="edit" aria-label="編集">
            ✎
          </button>
          <button class="card-btn" type="button" data-action="delete" aria-label="削除">
            🗑
          </button>
        </div>
      </div>
    </article>
  `;
}

function persistTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.todos = [
      {
        id: "sample-1",
        title: "最初のTodoを確認する",
        body: "このカードはサンプルです。完了、編集、ピン留め、削除を試せます。",
        color: "blue",
        done: false,
        pinned: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
        updatedAt: Date.now() - 1000 * 60 * 60 * 2,
      },
      {
        id: "sample-2",
        title: "買い物メモ",
        body: "牛乳\n卵\nコーヒー",
        color: "yellow",
        done: false,
        pinned: false,
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        updatedAt: Date.now() - 1000 * 60 * 30,
      },
    ];
    persistTodos();
    return;
  }

  try {
    state.todos = JSON.parse(raw);
  } catch {
    state.todos = [];
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");

  document.body.classList.toggle("light", theme === "light");
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  showToast(isLight ? "ライトモードに切り替えました" : "ダークモードに切り替えました");
}

function updateColorSelection(container, color) {
  [...container.querySelectorAll(".color-dot")].forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.color === color);
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 2200);
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

init();
