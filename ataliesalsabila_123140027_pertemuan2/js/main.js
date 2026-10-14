// js/main.js
// Entry point: merender state ke DOM dan menghubungkan event pengguna ke DashboardApp.

import { DashboardApp } from "./app.js";
import { COURSES, PRIORITIES } from "./modules/data.js";
import {
  escapeHtml,
  formatTanggal,
  formatTanggalPanjang,
  greeting,
  addDays
} from "./modules/utils.js";

const app = new DashboardApp();
const $ = (selector) => document.querySelector(selector);

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "terlambat", label: "Terlambat" },
  { key: "selesai", label: "Selesai" }
];

// ---------- Helper tampilan ----------

const dueLabel = ({ done, daysLeft }) => {
  if (done) return "Selesai";
  if (daysLeft < 0) return `Terlambat ${Math.abs(daysLeft)} hari`;
  if (daysLeft === 0) return "Hari ini";
  if (daysLeft === 1) return "Besok";
  return `${daysLeft} hari lagi`;
};

let noticeTimer;
const notify = (message) => {
  const el = $("#notice");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.classList.remove("is-visible"), 4000);
};

// ---------- Template (template literals) ----------

const taskTemplate = ({ id, title, course, deadline, priority, done, status, daysLeft }) => `
  <li class="task is-${status}" data-id="${id}">
    <input type="checkbox" class="task-check" data-action="toggle"
      aria-label="Tandai selesai: ${escapeHtml(title)}" ${done ? "checked" : ""}>
    <div class="task-body">
      <p class="task-title">${escapeHtml(title)}</p>
      <p class="task-meta"><span>${escapeHtml(course)}</span><span>${formatTanggal(deadline)}</span></p>
    </div>
    <span class="prio prio-${priority}">${PRIORITIES[priority]}</span>
    <span class="due due-${status}">${dueLabel({ done, daysLeft })}</span>
    <div class="task-actions">
      <button type="button" class="btn btn-quiet" data-action="edit">Ubah</button>
      <button type="button" class="btn btn-quiet btn-danger" data-action="delete">Hapus</button>
    </div>
  </li>`;

const emptyTemplate = (hasAnyTask) =>
  hasAnyTask
    ? `<li class="empty"><p>Tidak ada tugas yang cocok dengan filter ini.</p></li>`
    : `<li class="empty">
         <p>Belum ada tugas. Tambahkan deadline pertamamu lewat form di samping,
            atau coba isi dengan contoh dari API.</p>
         <button type="button" class="btn btn-primary" data-action="import">Isi dengan tugas contoh</button>
       </li>`;

const nextUpTemplate = ({ title, course, deadline, daysLeft }) => {
  const late = daysLeft < 0;
  const value = daysLeft === 0 ? "Hari ini" : Math.abs(daysLeft);
  const unit = daysLeft === 0 ? "" : late ? "hari terlambat" : "hari lagi";
  return `
    <p class="count ${late ? "is-late" : ""}">
      <span class="count-value">${value}</span>
      <span class="count-unit">${unit}</span>
    </p>
    <div class="next-detail">
      <p class="next-title">${escapeHtml(title)}</p>
      <p class="next-meta">${escapeHtml(course)}, ${formatTanggal(deadline)}</p>
    </div>`;
};

// ---------- Render ----------

const renderHeader = () => {
  $("#greeting").textContent = `${greeting()}, mahasiswa ITERA`;
  $("#today").textContent = formatTanggalPanjang();
};

const renderNext = () => {
  const task = app.nextTask;
  $("#nextUp").innerHTML = task
    ? nextUpTemplate(task)
    : `<p class="next-empty">Tidak ada deadline aktif. Santai dulu, atau tambah tugas baru.</p>`;
};

const renderFilters = () => {
  const { filter } = app.state;
  const { total, active, late, done } = app.stats;
  const counts = { semua: total, aktif: active, terlambat: late, selesai: done };

  $("#filters").innerHTML = FILTERS.map(
    ({ key, label }) => `
      <button type="button" class="chip ${key === filter ? "is-on" : ""}"
        data-filter="${key}" aria-pressed="${key === filter}">
        ${label} <span class="chip-count">${counts[key]}</span>
      </button>`
  ).join("");
};

const renderList = () => {
  const tasks = app.visibleTasks;
  $("#taskList").innerHTML = tasks.length
    ? tasks.map(taskTemplate).join("")
    : emptyTemplate(app.state.tasks.length > 0);
};

const renderStats = () => {
  const { total, active, late, done } = app.stats;
  const percent = total ? Math.round((done / total) * 100) : 0;
  $("#stats").innerHTML = `
    <p class="progress-text"><strong>${done}</strong> dari ${total} tugas selesai</p>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
      <div class="progress-bar" style="width:${percent}%"></div>
    </div>
    <dl class="stat-list">
      <div><dt>Aktif</dt><dd>${active}</dd></div>
      <div><dt>Terlambat</dt><dd class="${late ? "is-late" : ""}">${late}</dd></div>
      <div><dt>Selesai</dt><dd>${done}</dd></div>
    </dl>`;
};

const render = () => {
  renderNext();
  renderFilters();
  renderList();
  renderStats();
};

// ---------- Widget API (async/await) ----------

const loadWidgets = async () => {
  // Dua permintaan jalan paralel; kegagalan salah satunya tidak menggagalkan yang lain
  const [weather, quote] = await Promise.allSettled([
    app.fetchWeather(),
    app.fetchQuote()
  ]);

  if (weather.status === "fulfilled") {
    const { temperature, label } = weather.value;
    $("#weather").innerHTML = `<strong>${Math.round(temperature)}°C</strong><span>${label} di sekitar ITERA</span>`;
  } else {
    $("#weather").textContent = "Cuaca tidak tersedia (cek koneksi internet)";
  }

  if (quote.status === "fulfilled") {
    $("#quoteText").textContent = quote.value.quote;
    $("#quoteAuthor").textContent = quote.value.author;
  } else {
    $("#quoteText").textContent = "Mulai dari tugas yang paling dekat deadline-nya.";
    $("#quoteAuthor").textContent = "";
  }
};

const importSamples = async (button) => {
  button.disabled = true;
  button.textContent = "Mengambil data…";
  try {
    const total = await app.importSampleTasks();
    notify(`${total} tugas contoh berhasil ditambahkan.`);
  } catch (error) {
    notify(`Gagal mengambil data contoh: ${error.message}`);
  } finally {
    render();
  }
};

// ---------- Event handler ----------

const resetDeadlineField = () => {
  const input = $("#deadlineInput");
  input.defaultValue = addDays(1);
  input.value = input.defaultValue;
};

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const { title, course, deadline, priority } = Object.fromEntries(new FormData(form));

  app.addTask({
    title: title.trim(),
    course: course.trim() || "Umum",
    deadline,
    priority
  });
  form.reset();
  resetDeadlineField();
  render();
  notify("Tugas disimpan.");
});

$("#taskList").addEventListener("click", async ({ target }) => {
  const trigger = target.closest("[data-action]");
  if (!trigger) return;

  const { action } = trigger.dataset;
  if (action === "import") return importSamples(trigger);

  const id = trigger.closest("[data-id]")?.dataset.id;
  const task = id && app.getTask(id);
  if (!task) return;

  if (action === "toggle") {
    app.toggleTask(id);
    render();
  } else if (action === "delete") {
    if (confirm(`Hapus tugas "${task.title}"?`)) {
      app.deleteTask(id);
      render();
      notify("Tugas dihapus.");
    }
  } else if (action === "edit") {
    const form = $("#editForm");
    Object.entries({ ...task.toJSON() }).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
    $("#editDialog").showModal();
  }
});

$("#editForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const { id, title, course, deadline, priority } = Object.fromEntries(
    new FormData(event.currentTarget)
  );
  app.updateTask(id, { title: title.trim(), course: course.trim() || "Umum", deadline, priority });
  $("#editDialog").close();
  render();
  notify("Perubahan disimpan.");
});

$("#editCancel").addEventListener("click", () => $("#editDialog").close());

$("#filters").addEventListener("click", ({ target }) => {
  const button = target.closest("[data-filter]");
  if (!button) return;
  app.setState({ filter: button.dataset.filter });
  renderFilters();
  renderList();
});

$("#searchInput").addEventListener("input", ({ target }) => {
  app.setState({ search: target.value });
  renderList();
});

$("#clearDoneBtn").addEventListener("click", () => {
  const { done } = app.stats;
  if (!done) return notify("Belum ada tugas selesai untuk dihapus.");
  if (confirm(`Hapus ${done} tugas yang sudah selesai?`)) {
    app.clearCompleted();
    render();
  }
});

// ---------- Inisialisasi ----------

$("#courseList").innerHTML = COURSES.map((name) => `<option value="${escapeHtml(name)}">`).join("");
resetDeadlineField();
renderHeader();
render();
loadWidgets();
