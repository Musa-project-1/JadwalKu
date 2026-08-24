# Stitch Follow-up Prompts — JadwalKu (satu per satu)

> Cara pakai: di project Stitch yang sama (tema "JadwalKu Expressive" sudah tersimpan),
> paste SATU prompt di bawah, generate, ekspor ke folder yang disebut, lalu lanjut ke
> prompt berikutnya. Jangan semua sekaligus.

---

### 1. Tasks — folder: `tasks/`
"Using the same JadwalKu expressive design system (teal brand, tonal cards, pill buttons,
Inter), design the **Tasks screen**. Mobile: header 'Tugas Kuliah' with Filter button and
teal pill 'Tambah Tugas'; groups 'Minggu Ini' / 'Minggu Depan' / 'Selesai' each with a
colored dot and count badge; task cards with priority left accent (red=tinggi,
amber=sedang, blue=rendang), checkbox, course code chip, title, description, deadline
pill. Desktop: add right column widgets — 'Progres Minggu Ini' teal gradient card with
progress bar and 'Prioritas Tinggi' card with tinted icon tiles. Floating + FAB
bottom-right. Show light and dark."

### 2. Exams — folder: `exams/`
"Same JadwalKu design system. **Exam schedule screen**: UTS/UAS segmented control with
sliding pill, countdown chip to the next exam, exam cards grouped by date with subject
code chip, date pill, time, room, and Online/Offline mode badge. Tint UTS cards blue and
UAS cards warm peach. Mobile single column, desktop two-column masonry. Light + dark."

### 3. Search — folder: `search/`
"Same JadwalKu design system. **Search screen**: large rounded search field with icon,
filter chips row (Hari, Tipe Kelas), instant results grouped under 'Jadwal' / 'Dosen' /
'Tugas' with tinted icon per group, recent searches as removable chips above results.
Mobile + desktop. Light + dark."

### 4. Settings — folder: `settings/`
"Same JadwalKu design system. **Settings screen**: profile card with prodi+semester and
'Ganti' button; 'Terakhir diperbarui Admin' info banner; colorful stat chips row (SKS
mint, Kelas blue, Tugas green); reminder toggle list; Appearance section with 3-way
theme segmented control (Terang/Gelap/Sistem), font size pills, high contrast switch;
class color legend with dots. Mobile + desktop. Light + dark."

### 5. Notification center — folder: `notification_center/`
"Same JadwalKu design system. **Notification center**: groups 'Hari Ini' / 'Kemarin' /
'Lebih Lama'; notification rows with tinted icon per type (class=teal, task=amber,
exam=red, schedule change=blue), unread dot, title + description + time, 'Tandai
dibaca' and 'Hapus semua' actions in header. Mobile + desktop. Light + dark."

### 6. Export/Share — folder: `export_share/`
"Same JadwalKu design system. **Export & share screen** (mobile): back arrow + title
'Bagikan Jadwal'; radio card scope selector (Semua kelas / Semester ini); three option
cards with tinted icon circles: Google Calendar (.ics), Share teks, Share sebagai
gambar (with small PNG preview thumbnail). Show count 'X kelas akan diekspor' at
bottom. Light + dark."

### 7. Change history — folder: `change_history/`
"Same JadwalKu design system. **Change history screen** (desktop): filter chips
(Semua/Upload/Edit/Publish), vertical timeline with colored entity chips, each entry
showing old → new values, timestamp, actor avatar. Light + dark."

### 8. About & help — folder: `about_help/`
"Same JadwalKu design system. **About & help screen** (mobile): logo + app name
'JadwalKu' version block, FAQ accordion (4 items), 'Hubungi Admin' contact card with
WhatsApp button. Light + dark."

### 9. Intro tutorial — folder: `intro_tutorial/`
"Same JadwalKu design system. **Intro tutorial** (mobile, 3 slides in one shot): big
tonal illustration circle with icon, bold headline, short description, page dots,
'Skip' text button + teal pill 'Mulai'. Slides: 'Jadwal selalu di tangan',
'Pengingat otomatis', 'Gratis & offline'. Light + dark."

### 10. Onboarding — folder: `onboarding_prodi/` + `onboarding_semester/`
"Same JadwalKu design system. **Onboarding, 2 screens**: progress bar on top; screen 1
'Kamu prodi apa?' — 2-column grid of tonal selectable cards (icon + prodi name),
selected = teal ring; screen 2 'Semester berapa?' — pill grid 1–8, selected = teal.
Back arrow navigation. Light + dark."

### 11. Admin login — folder: `admin_login/`
"Same JadwalKu design system. **Admin login** (mobile + desktop): centered card on
aurora gradient background, logo, 'Masuk sebagai Admin', email + password fields,
teal pill 'Masuk', small 'Mode Mahasiswa' back link. Light + dark."

### 12. Admin upload — folder: `admin_upload/`
"Same JadwalKu design system. **Upload & import screen** (desktop): header with tinted
icon chip + 'Import Data Master'; large drag & drop zone (dashed border, cloud icon,
'10MB max'); parse preview table with status chips (valid=green, error=red); summary
stat chips; 'Simpan Draft' outline + 'Publish' gradient teal buttons. Light + dark."

### 13. Admin manual entry — folder: `admin_manual_entry/`
"Same JadwalKu design system. **Manual schedule entry** (desktop): collapsible 'Mata
Kuliah Baru' form card + session entry list with day/time/room fields, session chips,
'Simpan Draft' and 'Publish' buttons, success banner with check icon. Light + dark."

### 14. Admin manage courses — folder: `admin_courses/`
"Same JadwalKu design system. **Manage courses & lecturers** (desktop): search +
filter bar, clean data table (Kode, Nama MK, Dosen, SKS, Durasi, Aksi) with row hover,
inline edit, delete confirm, pagination, 'Tambah MK' primary pill. Light + dark."

### 15. Admin exams / prodi / holidays — folder: `admin_exams/`, `admin_prodi/`, `admin_holidays/`
"Same JadwalKu design system. Three admin screens: **exam schedule manager** (bulk
import + list), **prodi list manager** (cards with semester range), **holiday manager**
(date picker + holiday chip list with delete). Each: tinted header icon chip, primary
action pill top-right, content in 20px rounded cards. Light + dark."

---

## Tips

- Kalau hasil meleset dari tema, tambahkan di awal prompt: "Match the saved JadwalKu
  Expressive theme exactly."
- Ekspor PNG ke folder `references/<nama>/screen.png` sesuai nama di atas.
- Layar yang SUDAH jadi dari run pertama: logo, theme tokens, home_today (desktop
  light + mobile dark), weekly_grid (desktop dark), admin_dashboard (desktop light).
  Tetap perlu: versi light/dark pasangannya kalau mau lengkap.
