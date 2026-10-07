/* Mini POS - logika utama */
const STORAGE_KEY = "miniPosKeranjang";
const KUPON_KEY = "miniPosKupon";
const MIN_DISKON = 50000;   // minimal belanja untuk diskon
const PERSEN_DISKON = 0.10; // 10%

let keranjang = [];
let kuponAktif = false;

const el = (id) => document.getElementById(id);
const formatRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

/* ---------- LocalStorage ---------- */
function simpanData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keranjang));
  localStorage.setItem(KUPON_KEY, JSON.stringify(kuponAktif));
}

function muatData() {
  try {
    keranjang = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    kuponAktif = JSON.parse(localStorage.getItem(KUPON_KEY)) || false;
  } catch (e) {
    keranjang = [];
    kuponAktif = false;
  }
}

/* ---------- Validasi ---------- */
function tampilkanError(inputId, errId, pesan) {
  el(errId).textContent = pesan;
  el(inputId).classList.toggle("invalid", Boolean(pesan));
}

function validasiForm(nama, harga, qty) {
  let valid = true;

  if (nama.length < 3) {
    tampilkanError("nama", "errNama", "Nama barang wajib diisi, minimal 3 karakter.");
    valid = false;
  } else tampilkanError("nama", "errNama", "");

  if (el("harga").value.trim() === "" || isNaN(harga) || harga < 500) {
    tampilkanError("harga", "errHarga", "Harga harus berupa angka, minimal Rp 500.");
    valid = false;
  } else tampilkanError("harga", "errHarga", "");

  if (el("qty").value.trim() === "" || !Number.isInteger(qty) || qty < 1) {
    tampilkanError("qty", "errQty", "Jumlah harus bilangan bulat, minimal 1.");
    valid = false;
  } else tampilkanError("qty", "errQty", "");

  return valid;
}

/* ---------- Perhitungan ---------- */
function hitungTotal() {
  return keranjang.reduce((jumlah, item) => jumlah + item.harga * item.qty, 0);
}

function hitungDiskon(total) {
  const berhak = total >= MIN_DISKON || (kuponAktif && total > 0);
  return berhak ? Math.round(total * PERSEN_DISKON) : 0;
}

function hitungKembalian() {
  const total = hitungTotal();
  const totalAkhir = total - hitungDiskon(total);
  const info = el("infoKembalian");
  const teks = el("uangBayar").value.trim();

  info.className = "kembalian";
  if (teks === "" || total === 0) {
    info.textContent = "Kembalian: Rp 0";
    return;
  }
  const bayar = Number(teks);
  if (bayar < totalAkhir) {
    info.textContent = "Uang belum mencukupi, kurang " + formatRupiah(totalAkhir - bayar);
    info.classList.add("kurang");
  } else {
    info.textContent = "Kembalian: " + formatRupiah(bayar - totalAkhir);
    info.classList.add("ok");
  }
}

/* ---------- Render ---------- */
function renderKeranjang() {
  const tbody = el("isiKeranjang");
  tbody.innerHTML = "";

  if (keranjang.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Keranjang masih kosong. Tambahkan barang lewat form.</td></tr>';
  }

  keranjang.forEach((item, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td></td>
      <td class="num">${formatRupiah(item.harga)}</td>
      <td class="num">${item.qty}</td>
      <td class="num">${formatRupiah(item.harga * item.qty)}</td>
      <td><button class="btn btn-danger" data-index="${i}" type="button">Hapus</button></td>`;
    tr.children[1].textContent = item.nama; // textContent mencegah injeksi HTML
    tbody.appendChild(tr);
  });

  const total = hitungTotal();
  const diskon = hitungDiskon(total);
  el("totalBelanja").textContent = formatRupiah(total);
  el("nominalDiskon").textContent = "- " + formatRupiah(diskon);
  el("totalAkhir").textContent = formatRupiah(total - diskon);

  let info = "Diskon 10% otomatis untuk belanja minimal " + formatRupiah(MIN_DISKON) + ".";
  if (kuponAktif) info = "Kode HEMAT10 aktif.";
  else if (total >= MIN_DISKON) info = "Diskon 10% sudah berlaku.";
  el("infoKupon").textContent = info;

  hitungKembalian();
}

/* ---------- Aksi ---------- */
function tambahBarang(event) {
  event.preventDefault();
  const nama = el("nama").value.trim();
  const harga = parseFloat(el("harga").value);
  const qty = Number(el("qty").value);

  if (!validasiForm(nama, harga, qty)) return;

  keranjang.push({ nama, harga, qty });
  simpanData();
  el("formBarang").reset();
  renderKeranjang();
  el("nama").focus();
}

function hapusItem(index) {
  keranjang.splice(index, 1);
  simpanData();
  renderKeranjang();
}

function pakaiKupon() {
  const kode = el("kupon").value.trim().toUpperCase();
  if (kode === "HEMAT10") {
    kuponAktif = true;
    simpanData();
    renderKeranjang();
  } else {
    el("infoKupon").textContent = "Kode promo tidak dikenali.";
  }
}

function transaksiBaru() {
  if (keranjang.length > 0 && !confirm("Kosongkan keranjang dan mulai transaksi baru?")) return;
  keranjang = [];
  kuponAktif = false;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(KUPON_KEY);
  el("formBarang").reset();
  el("kupon").value = "";
  el("uangBayar").value = "";
  ["nama", "harga", "qty"].forEach((f) => tampilkanError(f, "err" + f[0].toUpperCase() + f.slice(1), ""));
  renderKeranjang();
}

/* ---------- Inisialisasi ---------- */
el("formBarang").addEventListener("submit", tambahBarang);
el("isiKeranjang").addEventListener("click", (e) => {
  if (e.target.dataset.index !== undefined) hapusItem(Number(e.target.dataset.index));
});
el("btnKupon").addEventListener("click", pakaiKupon);
el("btnReset").addEventListener("click", transaksiBaru);
el("uangBayar").addEventListener("input", hitungKembalian);

muatData();
renderKeranjang();
