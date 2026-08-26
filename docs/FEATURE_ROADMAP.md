# 🗺️ JadwalKu — Feature Roadmap & Checklist Fitur Mendatang

Dokumen ini berisi peta jalan (*roadmap*), spesifikasi fungsional, dan daftar periksa (*checklist*) untuk pengembangan fitur-fitur baru **JadwalKu**.

---

## 📌 Status Legend
- [ ] ⏳ **Belum Dimulai** (*Backlog*)
- [x] 🚀 **Selesai** (*Implemented*)

---

## 🎓 FASE 1: Student Productivity & Export Tools (Prioritas Tinggi)

### 1. 📅 Sinkronisasi Kalender (.ics / Google Calendar / Apple iCal)
Memungkinkan mahasiswa menambahkan seluruh jadwal kuliah dan ujian ke aplikasi kalender bawaan HP / Google Calendar dengan 1 klik.

- [ ] Tambahkan helper generator file `.ics` (iCalendar standard RFC 5545).
- [ ] Tombol "Ekspor ke Google Calendar / Apple iCal" di halaman Jadwal Kuliah (`/jadwal`).
- [ ] Tombol "Ekspor Jadwal Ujian ke Kalender" di halaman Jadwal Ujian (`/ujian`).
- [ ] Konfigurasi alarm otomatis (pengingat default 15 menit dan 30 menit sebelum kelas dimulai).
- [ ] Opsi pilihan: Ekspor seluruh semester vs Ekspor jadwal hari tertentu.

---

### 2. 🖼️ Generator Poster / Gambar Jadwal Siap Sebar WhatsApp
Menghasilkan infografis gambar jadwal mingguan beresolusi tinggi, estetik, dan rapi yang siap diunduh dan dibagikan ke grup kelas WhatsApp.

- [ ] Komponen layout kartu poster estetik dengan tema JadwalKu (Dark Mode & Light Mode).
- [ ] Integrasi rendering HTML to Image (`html-to-image` / `html2canvas`).
- [ ] Tombol "Bagikan Poster Jadwal" di header Jadwal Mingguan.
- [ ] Fitur 1-Klik: Salin Gambar ke Clipboard / Unduh sebagai PNG.

---

### 3. 📁 Tautan Materi Kuliah & Google Drive per Mata Kuliah
Mahasiswa dapat menyimpan tautan folder materi, slide dosen, link Zoom permanen, dan kontak Ketua Tingkat (Komti) di modal detail mata kuliah.

- [ ] Field penyimpanan lokal/cloud untuk:
  - Link Google Drive / Google Classroom.
  - Link Meeting Zoom / Google Meet permanen.
  - Kontak WhatsApp Komti / Dosen.
- [ ] UI terintegrasi di modal detail mata kuliah (klik kartu jadwal ➜ langsung buka link materi).

---

## 📢 FASE 2: Campus Communication & Notifications (Prioritas Menengah)

### 4. 📢 Fitur Pengumuman / Broadcast Kampus (Announcement Bar)
Admin dapat memposting pengumuman penting (kuliah pengganti, libur mendadak, info KRS) yang langsung tampil di dashboard seluruh mahasiswa.

- [ ] Modul Admin: **Kelola Pengumuman** (`/admin/pengumuman`) — Tambah, Edit, Hapus, Set Masa Berlaku.
- [ ] Banner pengumuman dinamis di beranda mahasiswa (`Home.jsx`) dengan level tipe: *Info (Biru)*, *Penting (Kuning)*, *Darurat (Merah)*.
- [ ] Tombol dismiss / tutup pengumuman dengan penyimpanan status baca.

---

### 5. 🔔 Notifikasi Web Push Pengingat Kelas
Memanfaatkan Service Worker PWA untuk mengirimkan notifikasi pengingat sebelum kelas dimulai tanpa perlu aplikasi terbuka.

- [ ] Izin notifikasi browser (*Notification Permission Prompt*).
- [ ] Background timer / Service Worker scheduler untuk alarm kelas (15 menit sebelum jam mulai).
- [ ] Pengaturan preferensi notifikasi di halaman Pengaturan (`/pengaturan`).

---

## 🎯 FASE 3: Academic Planner & Analytics (Prioritas Lanjutan)

### 6. 🎯 Kalkulator & Simulator Target IPK (GPA Planner)
Mahasiswa dapat merencanakan target nilai tiap mata kuliah dan melihat proyeksi Indeks Prestasi Semester (IPS) dan Kumulatif (IPK).

- [ ] Halaman baru: **Kalkulator & Rencana IPK** (`/ipk-planner`).
- [ ] Simulasi nilai otomatis: Masukkan target bobot nilai (A = 4.0, B+ = 3.5, B = 3.0, dll.) dikalikan SKS.
- [ ] Kalkulator predikat kelulusan (*Cumlaude*, *Sangat Memuaskan*, dll.).
- [ ] Grafik proyeksi kenaikan IPK per semester.

---

### 7. 📊 Tracker Kehadiran & Absensi Kuliah
Membantu mahasiswa melacak batas maksimal ketidakhadiran (misal: maksimal 3-4 kali tidak hadir per mata kuliah).

- [ ] Tombol presensi cepat di kartu jadwal (Hadir / Izin / Sakit / Alpa).
- [ ] Indikator persentase kehadiran per mata kuliah (Target minimal 75% atau 80%).
- [ ] Peringatan bahaya jika sisa jatah tidak hadir tinggal 1 kali.

---

## 🤖 FASE 4: Smart AI & Advanced Admin Tools (Masa Depan)

### 8. 📸 AI Schedule Importer (OCR Foto & PDF KRS)
Admin atau mahasiswa cukup mengunggah foto kertas jadwal atau PDF KRS, AI otomatis mengekstrak seluruh data ke dalam sistem.

- [ ] Integrasi Vision AI / OCR Parser untuk membaca teks tabel jadwal.
- [ ] Preview hasil ekstraksi AI sebelum data disimpan ke database.
- [ ] Pemetaan otomatis nama mata kuliah, dosen, hari, jam, dan ruangan.

---

### 9. 🤖 Smart Clash & Ruangan Overlap Detector
Sistem deteksi bentrok pintar untuk admin jurusan.

- [ ] Deteksi otomatis jadwal dosen mengajar di 2 kelas/prodi berbeda pada jam bertabrakan.
- [ ] Deteksi bentrok penggunaan ruangan fisik (misal: Ruang Lab Komputer digunakan bersamaan).
- [ ] Notifikasi rekomendasi jam/ruang alternatif yang kosong.

---

## 📝 Catatan Pembaruan & Kontribusi
*Setiap kali fitur baru selesai dikembangkan, ubah tanda `[ ]` menjadi `[x]` pada checklist di atas dan perbarui dokumentasi walkthrough.*
