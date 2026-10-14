// js/modules/utils.js
// Kumpulan fungsi utilitas pembantu yang diekspor.

const MS_PER_DAY = 86_400_000;
const pad = (number) => String(number).padStart(2, "0");

// Mencegah XSS: teks dari pengguna di-escape sebelum disisipkan ke innerHTML
export const escapeHtml = (text = "") =>
  String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );

export const capitalize = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const generateId = () =>
  `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Date <-> string "YYYY-MM-DD" (zona waktu lokal, sesuai <input type="date">)
export const toISO = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const toDate = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const todayISO = () => toISO(new Date());

export const addDays = (amount, from = new Date()) => {
  const result = new Date(from);
  result.setDate(result.getDate() + amount);
  return toISO(result);
};

// Selisih hari dari hari ini: negatif = sudah lewat, 0 = hari ini
export const daysUntil = (iso) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDate(iso) - today) / MS_PER_DAY);
};

export const formatTanggal = (iso) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(toDate(iso));

export const formatTanggalPanjang = (date = new Date()) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(date);

export const greeting = (hour = new Date().getHours()) => {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};
