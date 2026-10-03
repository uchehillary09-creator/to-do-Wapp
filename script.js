// ---------- State ----------
let tasks = load();
let filter = "all";
let editingId = null;
let searchQuery = "";

// ---------- Elements ----------
const form = document.getElementById("add-form");
const input = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date");
const prioritySel = document.getElementById("priority");
const list = document.getElementById("list");
const summary = document.getElementById("summary");
const searchInput = document.getElementById("search-input");

// ---------- Storage ----------
function load() {
  try {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}

// ---------- CRUD ----------
function addTask(text, priority, dueDate) {
  tasks.unshift({
    id: Date.now(),
    text,
    priority,
    dueDate,
    done: false,
    createdAt: Date.now()
  });
  save();
}

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  save();
}

function updateTask(id, text, priority, dueDate) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const nextText = text.trim();
  if (!nextText) return;

  task.text = nextText;
  task.priority = priority;
  task.dueDate = dueDate || "";
  editingId = null;
  save();
}

function deleteTask(id) {
  tasks = tasks.filter((item) => item.id !== id);
  save();
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(date);
}

// ---------- Rendering ----------
function createAction(label, cls, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = `task-action ${cls}`.trim();
  button.addEventListener("click", onClick);
  return button;
}

function render() {
  const visible = tasks.filter((task) => {
    const matchesFilter = filter === "all" ? true : filter === "done" ? task.done : !task.done;
    const matchesSearch = task.text.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  list.replaceChildren();

  if (!visible.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = tasks.length
      ? "No tasks match this filter or search."
      : "No tasks yet. Add your first one above.";
    list.append(empty);
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.dataset.priority = task.priority;
    if (task.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.className = "task-toggle";
    checkbox.setAttribute("aria-label", "Mark done: " + task.text);
    checkbox.addEventListener("change", () => toggleTask(task.id));
    li.append(checkbox);

    if (editingId === task.id) {
      const editor = document.createElement("div");
      editor.className = "edit-form";

      const textField = document.createElement("label");
      textField.className = "edit-field";
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = task.text;
      textInput.maxLength = 120;
      textInput.setAttribute("aria-label", "Edit task name");
      textField.append(textInput);

      const dateField = document.createElement("label");
      dateField.className = "edit-field";
      const dueInput = document.createElement("input");
      dueInput.type = "date";
      dueInput.value = task.dueDate || "";
      dueInput.setAttribute("aria-label", "Edit due date");
      dateField.append(dueInput);

      const priorityField = document.createElement("label");
      priorityField.className = "edit-field";
      const priorityInput = document.createElement("select");
      priorityInput.className = "priority-select";
      priorityInput.innerHTML = `
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      `;
      priorityInput.value = task.priority;
      priorityInput.setAttribute("aria-label", "Edit task priority");
      syncPrioritySelect(priorityInput);
      priorityInput.addEventListener("change", () => syncPrioritySelect(priorityInput));
      priorityField.append(priorityInput);

      const saveButton = createAction("Save", "", () => {
        updateTask(task.id, textInput.value, priorityInput.value, dueInput.value);
      });
      const cancelButton = createAction("Cancel", "", () => {
        editingId = null;
        render();
      });

      editor.append(textField, dateField, priorityField, saveButton, cancelButton);
      li.append(editor);

      setTimeout(() => textInput.focus(), 0);
      textInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") updateTask(task.id, textInput.value, priorityInput.value, dueInput.value);
        if (event.key === "Escape") {
          editingId = null;
          render();
        }
      });
    } else {
      const main = document.createElement("div");
      main.className = "task-main";

      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.text;

      const meta = document.createElement("div");
      meta.className = "meta-row";

      const priority = document.createElement("span");
      priority.className = "priority-tag";
      priority.dataset.priority = task.priority;
      priority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

      meta.append(priority);

      if (task.dueDate) {
        const date = document.createElement("span");
        date.className = "date-tag";
        date.textContent = `Due ${formatDate(task.dueDate)}`;
        meta.append(date);
      }

      main.append(title, meta);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      actions.append(
        createAction("Edit", "", () => {
          editingId = task.id;
          render();
        }),
        createAction("Delete", "delete", () => deleteTask(task.id))
      );

      li.append(main, actions);
    }

    list.append(li);
  });

  const left = tasks.filter((task) => !task.done).length;
  const done = tasks.filter((task) => task.done).length;
  summary.textContent = tasks.length ? `${left} left • ${done} done` : "Ready to start";
}

// ---------- Events ----------
function syncPrioritySelect(select) {
  if (!select) return;
  select.dataset.priority = select.value;
}

prioritySel.addEventListener("change", () => syncPrioritySelect(prioritySel));
syncPrioritySelect(prioritySel);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addTask(text, prioritySel.value, dueDateInput.value);
  input.value = "";
  dueDateInput.value = "";
  prioritySel.value = "medium";
  syncPrioritySelect(prioritySel);
  input.focus();
});

searchInput.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  render();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    render();
  });
});

document.getElementById("clear-done").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  save();
});

render();
