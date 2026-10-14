// js/modules/data.js
// Konstanta dan data statis yang diekspor untuk modul lain.

export const STORAGE_KEY = "pos-tugas-itera:v1";

// Endpoint API publik (gratis, tanpa API key)
export const API = {
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-5.36&longitude=105.31&current_weather=true",
  quote: "https://dummyjson.com/quotes/random",
  todos: "https://jsonplaceholder.typicode.com/todos?_limit=5"
};

export const PRIORITIES = {
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah"
};

// Saran mata kuliah untuk <datalist> pada form (pengguna tetap bebas mengetik sendiri)
export const COURSES = [
  "Pengembangan Aplikasi Web",
  "Basis Data",
  "Struktur Data",
  "Jaringan Komputer",
  "Kecerdasan Buatan",
  "Rekayasa Perangkat Lunak",
  "Organisasi / Kepanitiaan",
  "Umum"
];

// Kode cuaca WMO dari Open-Meteo -> teks Bahasa Indonesia
export const WEATHER_CODES = {
  0: "Cerah",
  1: "Cerah berawan",
  2: "Berawan sebagian",
  3: "Mendung",
  45: "Berkabut",
  48: "Berkabut tebal",
  51: "Gerimis ringan",
  53: "Gerimis",
  55: "Gerimis lebat",
  61: "Hujan ringan",
  63: "Hujan sedang",
  65: "Hujan lebat",
  80: "Hujan lokal ringan",
  81: "Hujan lokal",
  82: "Hujan lokal lebat",
  95: "Badai petir",
  96: "Badai petir dan hujan es",
  99: "Badai petir dan hujan es lebat"
};
