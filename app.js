const now = new Date("2026-03-20T08:30:00");

let todos = [
  {
    id: 1,
    title: "見積レビューを返す",
    description: "A社向け。午前中に差分確認。",
    dueAt: "2026-03-20T10:00:00",
    isDone: false,
    doneAt: null,
  },
  {
    id: 2,
    title: "定例会の議事メモ整理",
    description: "",
    dueAt: "2026-03-20T18:00:00",
    isDone: false,
    doneAt: null,
  },
  {
    id: 3,
    title: "開発優先度の見直し",
    description: "来週の着手順を仮決め。",
    dueAt: "2026-03-21T12:00:00",
    isDone: false,
    doneAt: null,
  },
  {
    id: 4,
    title: "契約書ドラフト確認",
    description: "",
    dueAt: "2026-03-24T15:00:00",
    isDone: false,
    doneAt: null,
  },
  {
    id: 5,
    title: "旧案件の請求処理",
    description: "すでに完了済み。",
    dueAt: "2026-03-19T17:00:00",
    isDone: true,
    doneAt: "2026-03-19T16:30:00",
  },
];

const events = [
  {
    id: 101,
    title: "朝会",
    startsAt: "2026-03-20T09:30:00",
    endsAt: "2026-03-20T09:45:00",
    location: "Google Meet",
  },
  {
    id: 102,
    title: "仕様レビュー",
    startsAt: "2026-03-20T13:00:00",
    endsAt: "2026-03-20T14:00:00",
    location: "会議室A",
  },
  {
    id: 103,
    title: "1on1",
    startsAt: "2026-03-20T17:30:00",
    endsAt: "2026-03-20T18:00:00",
    location: "",
  },
];

const els = {
  criticalCount: document.getElementById("criticalCount"),
  openTodoCount: document.getElementById("openTodoCount"),
  todayEventCount: document.getElementById("todayEventCount"),

  criticalBadge: document.getElementById("criticalBadge"),
  nextBadge: document.getElementById("nextBadge"),
  laterBadge: document.getElementById("laterBadge"),
  eventsBadge: document.getElementById("eventsBadge"),

  criticalList: document.getElementById("criticalList"),
  nextList: document.getElementById("nextList"),
  laterList: document.getElementById("laterList"),
  eventList: document.getElementById("eventList"),

  quickInput: document.getElementById("quickInput"),
  addButton: document.getElementById("addButton"),
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateTimeLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`;
}

function formatTime(value) {
  const date = new Date(value);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatDueLabel(value) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function classifyTodo(todo, 기준Date) {
  if (todo.isDone) return "done";

  const due = new Date(todo.dueAt);
  const diffMs = due.getTime() - 기준Date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0 || isSameDay(due, 기준Date)) return "critical";
  if (diffDays <= 3) return "next";
  return "later";
}

function buildEmpty(text) {
  const p = document.createElement("p");
  p.className = "empty-text";
  p.textContent = text;
  return p;
}

function createTodoCard(todo) {
  const card = document.createElement("article");
  card.className = `item-card ${todo.isDone ? "item-card-done" : ""}`;

  const button = document.createElement("button");
  button.className = `check-button ${todo.isDone ? "check-button-done" : ""}`;
  button.type = "button";
  button.setAttribute("aria-label", todo.isDone ? "未完了に戻す" : "完了にする");
  button.textContent = todo.isDone ? "✓" : "";
  button.addEventListener("click", () => toggleDone(todo.id));

  const main = document.createElement("div");
  main.className = "item-main";

  const top = document.createElement("div");
  top.className = "item-top";

  const title = document.createElement("h3");
  title.className = "item-title";
  title.textContent = todo.title;

  const meta = document.createElement("span");
  meta.className = "item-meta";
  meta.textContent = formatDueLabel(todo.dueAt);

  top.appendChild(title);
  top.appendChild(meta);
  main.appendChild(top);

  if (todo.description) {
    const desc = document.createElement("p");
    desc.className = "item-desc";
    desc.textContent = todo.description;
    main.appendChild(desc);
  }

  card.appendChild(button);
  card.appendChild(main);

  return card;
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "item-card item-card-event";

  const timeBadge = document.createElement("div");
  timeBadge.className = "time-badge";

  const start = document.createElement("span");
  start.textContent = formatTime(event.startsAt);

  const divider = document.createElement("span");
  divider.className = "time-divider";
  divider.textContent = "-";

  const end = document.createElement("span");
  end.textContent = formatTime(event.endsAt);

  timeBadge.appendChild(start);
  timeBadge.appendChild(divider);
  timeBadge.appendChild(end);

  const main = document.createElement("div");
  main.className = "item-main";

  const top = document.createElement("div");
  top.className = "item-top";

  const title = document.createElement("h3");
  title.className = "item-title";
  title.textContent = event.title;

  top.appendChild(title);

  if (event.location) {
    const meta = document.createElement("span");
    meta.className = "item-meta";
    meta.textContent = event.location;
    top.appendChild(meta);
  }

  main.appendChild(top);
  card.appendChild(timeBadge);
  card.appendChild(main);

  return card;
}

function toggleDone(id) {
  todos = todos.map((todo) => {
    if (todo.id !== id) return todo;

    const nextDone = !todo.isDone;
    return {
      ...todo,
      isDone: nextDone,
      doneAt: nextDone ? new Date().toISOString() : null,
    };
  });

  render();
}

function addQuickTodo() {
  const title = els.quickInput.value.trim();
  if (!title) return;

  const due = new Date(now);
  due.setHours(18, 0, 0, 0);

  const newTodo = {
    id: Date.now(),
    title,
    description: "",
    dueAt: formatDateTimeLocal(due),
    isDone: false,
    doneAt: null,
  };

  todos.unshift(newTodo);
  els.quickInput.value = "";
  render();
}

function renderTodoSection(target, list, emptyText) {
  target.innerHTML = "";

  if (!list.length) {
    target.appendChild(buildEmpty(emptyText));
    return;
  }

  list.forEach((todo) => {
    target.appendChild(createTodoCard(todo));
  });
}

function renderEventSection(target, list, emptyText) {
  target.innerHTML = "";

  if (!list.length) {
    target.appendChild(buildEmpty(emptyText));
    return;
  }

  list.forEach((event) => {
    target.appendChild(createEventCard(event));
  });
}

function render() {
  const activeTodos = todos.filter((t) => !t.isDone);
  const critical = activeTodos.filter((t) => classifyTodo(t, now) === "critical");
  const next = activeTodos.filter((t) => classifyTodo(t, now) === "next");
  const later = activeTodos.filter((t) => classifyTodo(t, now) === "later");

  const todayEvents = events
    .filter((e) => isSameDay(new Date(e.startsAt), now))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  els.criticalCount.textContent = String(critical.length);
  els.openTodoCount.textContent = String(activeTodos.length);
  els.todayEventCount.textContent = String(todayEvents.length);

  els.criticalBadge.textContent = String(critical.length);
  els.nextBadge.textContent = String(next.length);
  els.laterBadge.textContent = String(later.length);
  els.eventsBadge.textContent = String(todayEvents.length);

  renderTodoSection(
    els.criticalList,
    critical,
    "危険なタスクはありません。"
  );
  renderTodoSection(
    els.nextList,
    next,
    "直近タスクはありません。"
  );
  renderTodoSection(
    els.laterList,
    later,
    "後回しタスクはありません。"
  );
  renderEventSection(
    els.eventList,
    todayEvents,
    "今日の予定はありません。"
  );
}

els.addButton.addEventListener("click", addQuickTodo);

els.quickInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addQuickTodo();
  }
});

render();
