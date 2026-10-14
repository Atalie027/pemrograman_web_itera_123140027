// js/app.js
// Logika aplikasi: model data (TaskItem) dan pengelola state (DashboardApp).
// Rendering ke DOM ditangani di main.js.

import { STORAGE_KEY, API, WEATHER_CODES } from "./modules/data.js";
import { generateId, daysUntil, addDays } from "./modules/utils.js";

/** Helper fetch JSON dengan penanganan status HTTP */
const getJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Permintaan gagal (HTTP ${response.status})`);
  return response.json();
};

/** Model satu item tugas */
export class TaskItem {
  constructor({
    id = generateId(),
    title,
    course = "Umum",
    deadline,
    priority = "sedang",
    done = false,
    createdAt = Date.now()
  }) {
    this.id = id;
    this.title = title;
    this.course = course;
    this.deadline = deadline; // format "YYYY-MM-DD"
    this.priority = priority;
    this.done = done;
    this.createdAt = createdAt;
  }

  /** Sisa hari menuju deadline (negatif jika sudah lewat) */
  get daysLeft() {
    return daysUntil(this.deadline);
  }

  /** "selesai" | "terlambat" | "aktif" */
  get status() {
    if (this.done) return "selesai";
    return this.daysLeft < 0 ? "terlambat" : "aktif";
  }

  /** Immutable update: mengembalikan TaskItem baru, objek lama tidak diubah */
  withChanges(changes) {
    return new TaskItem({ ...this.toJSON(), ...changes });
  }

  toJSON() {
    const { id, title, course, deadline, priority, done, createdAt } = this;
    return { id, title, course, deadline, priority, done, createdAt };
  }
}

/** Pengelola state, localStorage, dan pemanggilan API eksternal */
export class DashboardApp {
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.state = { tasks: this.load(), filter: "semua", search: "" };
  }

  // ---------- Persistensi (localStorage) ----------

  load() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw).map((item) => new TaskItem(item)) : [];
    } catch (error) {
      console.error("Gagal membaca localStorage:", error);
      return [];
    }
  }

  save() {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state.tasks));
    } catch (error) {
      console.error("Gagal menyimpan ke localStorage:", error);
    }
  }

  /** Satu pintu untuk mengubah state; spread menjaga state lama tetap immutable */
  setState(patch, persist = false) {
    this.state = { ...this.state, ...patch };
    if (persist) this.save();
  }

  // ---------- Operasi CRUD ----------

  getTask(id) {
    return this.state.tasks.find((task) => task.id === id);
  }

  addTask(data) {
    const task = new TaskItem(data);
    this.setState({ tasks: [...this.state.tasks, task] }, true);
    return task;
  }

  updateTask(id, changes) {
    const tasks = this.state.tasks.map((task) =>
      task.id === id ? task.withChanges(changes) : task
    );
    this.setState({ tasks }, true);
  }

  toggleTask(id) {
    const task = this.getTask(id);
    if (task) this.updateTask(id, { done: !task.done });
  }

  deleteTask(id) {
    this.setState({ tasks: this.state.tasks.filter((task) => task.id !== id) }, true);
  }

  clearCompleted() {
    this.setState({ tasks: this.state.tasks.filter((task) => !task.done) }, true);
  }

  // ---------- Data turunan (computed) ----------

  /** Tugas yang tampil sesuai filter + pencarian; yang belum selesai diurutkan dari deadline terdekat */
  get visibleTasks() {
    const { tasks, filter, search } = this.state;
    const query = search.trim().toLowerCase();

    return tasks
      .filter(
        ({ status, title, course }) =>
          (filter === "semua" || status === filter) &&
          (!query || `${title} ${course}`.toLowerCase().includes(query))
      )
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) || a.deadline.localeCompare(b.deadline)
      );
  }

  /** Tugas aktif/terlambat dengan deadline paling dekat */
  get nextTask() {
    return this.state.tasks
      .filter(({ done }) => !done)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  }

  get stats() {
    const { tasks } = this.state;
    const count = (status) => tasks.filter((task) => task.status === status).length;
    return {
      total: tasks.length,
      active: count("aktif"),
      late: count("terlambat"),
      done: count("selesai")
    };
  }

  // ---------- Operasi asinkron (async/await) ----------

  /** Cuaca terkini di sekitar kampus ITERA (Open-Meteo) */
  async fetchWeather() {
    const data = await getJSON(API.weather);
    const { temperature, weathercode, windspeed } = data.current_weather;
    return {
      temperature,
      windspeed,
      label: WEATHER_CODES[weathercode] ?? "Cuaca tidak diketahui"
    };
  }

  /** Kutipan motivasi acak (DummyJSON) */
  async fetchQuote() {
    const { quote, author } = await getJSON(API.quote);
    return { quote, author };
  }

  /** Mengisi daftar tugas contoh dari JSONPlaceholder, lalu disimpan ke localStorage */
  async importSampleTasks() {
    const todos = await getJSON(API.todos);
    const priorities = ["tinggi", "sedang", "rendah"];

    const imported = todos.map(
      ({ title, completed }, index) =>
        new TaskItem({
          title,
          course: "Contoh dari API",
          deadline: addDays(index + 1),
          priority: priorities[index % priorities.length],
          done: completed
        })
    );

    this.setState({ tasks: [...this.state.tasks, ...imported] }, true);
    return imported.length;
  }
}
