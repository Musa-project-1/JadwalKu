# Prompt Desain — Google Stitch: App Jadwal Kuliah

Copy-paste teks di bawah ini ke Google Stitch (satu prompt utuh, jalankan sekaligus).

---

## PROMPT

Design a clean, modern **responsive** app called **"Jadwal Kampus"** with two roles: **Student (user)** and **Admin**, usable on mobile, tablet, and desktop/PC. No account system for either role — students don't register or log in, and admin unlocks admin mode with a single shared password (no email/username). The source data is a single spreadsheet file with multiple sheets: one sheet is the weekly schedule matrix (day x study program x time), another sheet is a lookup table mapping course code to full course name, lecturer, contact, and credit hours (SKS). Only Admin uploads/manages this data; students only view data that's already been published. Style: minimal, flat design, no gradients, high readability, generous whitespace, rounded cards (radius 12-16px), soft neutral background with one accent color family (blue or teal) for primary actions, light/dark mode toggle.

**Responsive layout requirements**
- Mobile (portrait, <600px): single-column, bottom navigation bar, stacked cards, horizontal scroll tabs for days
- Tablet (600-1024px): two-column layout where possible (e.g. schedule list + detail panel side by side), navigation as a left rail or top tabs instead of bottom bar
- Desktop/PC (>1024px): full week grid visible at once (all days as columns, like a calendar grid), persistent left sidebar navigation, detail panel opens as a side panel instead of bottom sheet/modal
- Same component library, spacing scale, and color coding across all breakpoints — only layout density and navigation pattern change

### Student flow

**Intro tutorial (shown once, before Onboarding)**
- 3 swipeable slides introducing key features, each with a simple illustration placeholder, short headline, and one-line description: Slide 1 "Lihat jadwal kuliah & ujian dalam satu tempat", Slide 2 "Dapat pengingat otomatis sebelum kelas & deadline tugas", Slide 3 "Tetap bisa dibuka walau tanpa internet"
- Dot indicator at bottom showing slide position, "Lewati" (skip) link top-right, "Mulai" button on final slide leading to role selection (Onboarding screen)

**Onboarding screen**
- Simple welcome screen with role selection: "Masuk sebagai Mahasiswa" / "Masuk sebagai Admin" — no account or registration needed for either role
- Student flow (two steps, no login): Step 1 — dropdown/picker to select "Program Studi" (options: Teknik Sipil, Arsitektur, Informatika, Bisnis Digital, Kewirausahaan); Step 2 — dropdown/picker to select "Semester" (options filtered based on chosen prodi, e.g. Semester 1-8), with a progress indicator showing "Langkah 1/2" then "Langkah 2/2"
- Button "Simpan & Lanjutkan" on final step, note "Bisa diubah kapan saja di pengaturan"
- Admin flow: single simple screen with just a password field (no email, no username) and "Masuk" button — this unlocks admin mode/menu on the device

**Home screen — "Jadwal Hari Ini"**
- Top: greeting + current day/date + small offline indicator icon
- Holiday/no-class banner: when today is a national holiday or admin-marked "libur" day, replace the normal timeline with a calm banner "Hari ini libur — tidak ada kelas" (small icon, no countdown card shown)
- Big card: "Kelas Berikutnya" showing countdown ("30 menit lagi"), course name, room, time, lecturer name
- Below: vertical timeline list of today's classes (time on left, card with course name + room code + color-coded dot for class type: green = Kelas Offline (K1), blue = Kelas Online (K2), purple = Hybrid (HB/HBH/HBD))
- Each day's timeline includes a small "Catatan hari ini" note field/button — a free-text daily note area (like a mini journal entry) student can tap to write or view quick notes for that day
- Top bar icons: notification bell (with unread badge), search icon, filter icon, share icon
- Bottom navigation (mobile) / sidebar (desktop): Home, Jadwal Mingguan, Tugas, Ujian, Pengaturan

**Android home screen widget (design as a separate small mockup, shown alongside phone lock/home screen frame)**
- Compact widget (2x2 or 4x2 size) showing "Kelas Berikutnya": course name, time, room, small colored dot for class type
- Minimal version (2x1): just course name + countdown ("30 menit lagi")
- Tapping the widget opens the app directly to Course Detail
- Widget auto-refreshes as the day progresses to show the next upcoming class

**Weekly schedule screen**
- Mobile/tablet: horizontal day tabs (Senin–Sabtu), under each day a list of class cards sorted by time, each showing: time range, course name, course code, room, class type badge (colored pill matching legend), lecturer name (small text)
- Days marked as holiday show a small "Libur" tag on the day tab itself and a calm empty message instead of class cards
- Desktop: full grid view, all days (Senin–Sabtu) as columns and time as rows, classes shown as colored blocks positioned by time (like a calendar/timetable grid); holiday columns shown with a subtle diagonal-hatch pattern overlay and "Libur" label
- Tap or click a card/block opens Course Detail panel
- Schedule conflict warning: inline warning banner (amber background, warning icon) when two classes overlap in time, e.g. "Bentrok jadwal: [Mata Kuliah A] dan [Mata Kuliah B], Rabu 08.00-09.40". Tapping it opens a comparison card showing both conflicting classes side by side (mobile: stacked; desktop: side by side) with time, room, class type. Small red conflict badge/icon overlaid on the specific class cards involved, visible directly in the weekly grid

**Tasks/assignments screen — "Tugas"**
- List of assignments grouped by "Minggu ini" / "Minggu depan" / "Selesai"
- Each task card: course name/code, task title, deadline date + countdown badge ("2 hari lagi"), priority indicator (color dot: red = mendesak, amber = segera, green = masih lama)
- Floating "+" button to add a task manually: course picker, task title, deadline date/time, notes field
- Toggle checkbox to mark task as done (moves to "Selesai" section, strikethrough style)
- Reminder setting per task (e.g. H-3, H-1, hari-H)
- Empty state: "Belum ada tugas" with illustration and call-to-action

**Course detail (bottom sheet on mobile, side panel on tablet/desktop)**
- Course name + code as header
- Info rows: Dosen Pengampu (with phone icon to call/WA), SKS, Durasi (menit), Ruang, Tipe kelas (badge), Prodi
- Button: "Ingatkan saya" (toggle reminder for this specific class)
- Section: "Tugas terkait" — list of assignments linked to this course, with "+ Tambah tugas" button
- Section: "Catatan" — free-text note area for this specific course (e.g. "bawa kalkulator", "materi bab 3"), auto-saved as you type

**Export & share screen — "Bagikan Jadwal"**
- Accessible from share icon in top bar or a button on Weekly Schedule screen
- Option cards: "Export ke Google Calendar (.ics)" with brief description "Sinkron otomatis ke kalender HP", "Bagikan sebagai gambar" (generates a clean shareable image/screenshot of the weekly schedule, styled like a poster card with color-coded classes), "Bagikan sebagai tautan" (share link, view-only, e.g. for a group chat)
- Preview thumbnail of the shareable image before confirming
- For .ics export: option to choose which classes to include (all vs. current semester only) before generating the file

**Exam schedule screen (UTS/UAS)**
- Segmented control: "UTS" / "UAS"
- List grouped by date, each exam card shows: countdown badge ("5 hari lagi"), course name, date, time, room, exam mode (online/offline/take-home)
- Empty state: "Belum ada data ujian" with illustration if no exam data uploaded yet

**Filter & settings screen — "Pengaturan"** (no account/profile, device-local only)
- Header: prodi + semester currently selected, with "Ganti" button to redo the onboarding picker
- Reminder settings: toggle + time-before-class selector (15/30/60 menit) for regular classes, separate setting for exam reminders (1 hari / 3 hari sebelumnya) and task reminders
- "Statistik" section: small stat cards (total SKS semester ini, jumlah tugas selesai, jumlah kelas minggu ini)
- "Terakhir diperbarui oleh admin: [tanggal]" info banner, tap to open "Riwayat Perubahan" screen
- Dark mode toggle
- Aksesibilitas section: font size selector (Kecil/Sedang/Besar/Sangat Besar), high-contrast mode toggle (increases border/text contrast beyond default theme)
- Legend reference card showing color meanings: K1 Kelas Offline, K2 Kelas Online, GBK1/GBK2 Gabungan Kelas, HB/HBH/HBD Hybrid
- Link at bottom: "Tentang & Bantuan"
- No email, no NIM, no logout — this is device-local, not an account

**Notification center — "Pengingat"**
- Accessible from a bell icon in the top bar on every screen, with a badge showing unread count
- List of notifications grouped by "Hari ini" / "Kemarin" / "Lebih awal"
- Notification types with distinct icons: class reminder (clock icon), task deadline (checklist icon), exam reminder (pencil/exam icon), schedule updated by admin (refresh icon)
- Each notification: icon, short message, timestamp, tap to open related detail (course, task, or exam)
- "Tandai semua sudah dibaca" button at top
- Empty state when no notifications

**Search screen — "Cari"**
- Search bar at top (persistent, accessible from a search icon in navigation)
- As user types: live results grouped into sections "Mata Kuliah", "Dosen", "Tugas"
- Each result row: icon by type, title, subtitle (e.g. course shows prodi + kode MK, dosen shows kontak, tugas shows deadline)
- Recent searches list shown before typing
- Filter chips above results: All, Mata Kuliah, Dosen, Tugas
- Tap a result opens its detail panel
- Empty state: "Tidak ada hasil ditemukan"

**About & help screen — "Tentang & Bantuan"**
- App info: name, short description, version number
- FAQ accordion list (expandable questions), e.g. "Kenapa jadwal belum update?", "Bagaimana cara ubah prodi/semester?", "Kenapa notifikasi tidak muncul?"
- "Hubungi admin" contact card (e.g. email or WA link)
- Link back to the intro tutorial slides ("Lihat panduan lagi")

**Confirmation dialogs (small reusable component, apply consistently)**
- Simple centered modal: short warning icon, title, one-line description of consequence, two buttons (Batal — neutral, and a destructive-styled confirm button e.g. "Hapus")
- Variants needed: delete a task, delete a manually-added class/exam entry (admin), discard unsaved changes when leaving Input Manual form, admin action to overwrite existing published schedule with a new upload

### Admin flow (separate flow, accessible after entering admin password)

**Admin dashboard**
- Overview cards: total prodi terdaftar, total mata kuliah, status file jadwal terakhir diupload (tanggal + nama file)
- Quick actions: "Upload jadwal baru", "Kelola mata kuliah & dosen", "Kelola jadwal ujian", "Kelola daftar prodi", "Kelola hari libur"
- "Riwayat Perubahan" section: timeline log of past changes (e.g. "Kalkulus dipindah dari Senin ke Rabu — 20 Agt 2026", "Jadwal ujian UTS diperbarui — 18 Agt 2026"), each entry expandable to show old value vs new value side by side, with a "Lihat semua riwayat" link to a full history screen

**Upload/import screen (Admin only)**
- Two input methods via tab/segmented control at top: "Upload File" / "Input Manual"

*Tab: Upload File*
- Drag-and-drop or tap-to-browse file picker (accepts .xlsx/.csv), single file containing all sheets
- After upload: preview table per sheet (tab switcher: "Jadwal Kuliah" / "Daftar MK & Dosen" / "Jadwal Ujian") showing detected columns
- Validation warnings if a course code in the schedule sheet has no match in the lookup sheet (highlighted row + "Kode MK tidak ditemukan")

*Tab: Input Manual*
- Form to add/edit a single class schedule entry: Prodi (dropdown), Semester (dropdown), Hari (dropdown), Jam mulai & selesai (time picker), Kode MK (dropdown, searchable, sourced from existing course list), Ruang (text field), Tipe kelas (dropdown: K1/K2/GBK1/GBK2/HB/HBH/HBD)
- "+ Tambah mata kuliah baru" link if the course code doesn't exist yet — opens a small inline form: Kode MK, Nama Mata Kuliah, Nama Dosen, Kontak Dosen, SKS, Durasi
- Button "Simpan entri" adds the row to a preview list below, so admin can add multiple entries before publishing
- List of manually added entries this session, each with edit/remove icon

Both tabs share the same bottom actions:
- Buttons: "Simpan sebagai Draft" and "Publikasikan ke Mahasiswa" (draft not visible to students until published)
- Success state: checkmark animation + "Jadwal berhasil dipublikasikan"

**Manage courses & lecturers (Admin)**
- Table/list view of all courses across all prodi, searchable and filterable by prodi and semester
- Inline edit: course name, lecturer name, contact, SKS, duration
- "+ Tambah mata kuliah" button opens the manual entry form (same as in Upload screen)

**Manage exam schedule (Admin)**
- Similar table view for UTS/UAS entries: course, date, time, room, exam mode
- "+ Tambah jadwal ujian" button opens a manual entry form: Prodi, Semester, Kode MK (searchable dropdown), Tanggal, Jam, Ruang, Mode ujian (Online/Offline/Take home)
- Edit/delete actions on existing entries
- Bulk import option (CSV) as alternative to manual entry, via tab/segmented control same pattern as Upload screen

**Manage prodi list (Admin)**
- Simple list view of Program Studi (prodi) — add/edit/remove prodi names and their semester range
- No staff accounts or roles — a single shared admin password grants full access to all admin screens

**Manage holidays — "Kelola Hari Libur" (Admin)**
- Calendar picker or simple list to mark specific dates as "Libur" (holiday/no-class day), with a short label field (e.g. "Libur Nasional", "Cuti Bersama")
- List of upcoming marked holidays with edit/remove actions
- These dates automatically suppress class display on Home and Weekly Schedule for all students

**Full change history screen — "Riwayat Perubahan"** (accessible to both admin and student, read-only for student)
- Chronological list of all schedule changes, grouped by date
- Each entry: what changed (course, field), old value struck through next to new value, timestamp
- Filter chips: All, Jadwal Kuliah, Jadwal Ujian, Mata Kuliah & Dosen

### Shared component set

**Color coding (must be consistent across all screens)**
- Green = Kelas Offline (K1)
- Blue = Kelas Online (K2)
- Purple = Hybrid (HB, HBH, HBD)
- Amber = Gabungan Kelas (GBK1, GBK2)
- Gray = neutral/inactive states

**Empty states & error states (design as a small component set, apply consistently)**
- Empty state: centered simple illustration placeholder, short message, and a call-to-action button. Variants: "Belum ada tugas" (Tasks), "Belum ada data ujian" (Exam), "Belum ada jadwal, hubungi admin" (Home/Weekly, before first publish), "Tidak ada hasil ditemukan" (Search)
- Error state: same layout pattern but with a warning-tone icon. Variants: "Gagal memuat data, cek koneksi internet" (with "Coba lagi" button), "File tidak valid, format harus .xlsx atau .csv" (Admin upload), "Password admin salah, coba lagi" (admin entry)
- Offline banner: thin persistent bar at top of screen when device has no internet, showing "Mode offline — menampilkan data tersimpan terakhir"

**Micro-interactions & transitions (apply throughout, describe as design notes, not separate screens)**
- Smooth slide/fade transition between screens (e.g. tab switches slide horizontally, detail panels slide up from bottom on mobile / slide in from right on desktop)
- Buttons show a subtle press/scale feedback on tap
- Success actions (save, publish, mark task done) show a brief checkmark micro-animation, then settle
- Countdown badges and "kelas berikutnya" card update with a gentle number-tick animation rather than an abrupt jump
- Skeleton loading placeholders (shimmering gray blocks matching card shapes) while data loads, instead of blank screens or spinners

**Accessibility (apply throughout, describe as design notes)**
- All text maintains WCAG AA contrast minimum against its background, in both light and dark mode
- Font size selector (in Pengaturan) scales all text proportionally without breaking card layouts — design components with enough internal padding to accommodate a larger text variant
- High-contrast mode variant: stronger borders on cards, no reliance on color alone for meaning (class type badges also carry a short text label, not just color)
- All icon-only buttons have a visible focus state for keyboard/switch navigation
- Tap targets minimum 44x44px on all interactive elements

Generate all screens as one connected app flow, consistent spacing and component library across screens.

---

### Catatan tambahan (bukan bagian prompt, buat kamu)
- Ini versi gabungan penuh dari semua revisi: satu file spreadsheet dengan proses join antar sheet, layout responsive (mobile/tablet/desktop), pengingat tugas terpisah dari pengingat kelas, admin panel dengan upload file + input manual, onboarding 2 langkah (Prodi → Semester), sistem tanpa akun (mahasiswa device-local, admin cukup 1 password bersama), catatan harian/per mata kuliah, widget Android, export .ics, share jadwal, tutorial 3 slide, halaman Tentang & FAQ, dialog konfirmasi, riwayat perubahan, micro-interaction, mode hari libur, dan aksesibilitas.
- Tinggal copy-paste satu prompt ini ke Google Stitch sekali jalan.
- Kalau Stitch sempat "rusak" atau hasilnya kacau pas generate sekaligus, biasanya karena prompt-nya berat — coba jalankan ulang sekali lagi (kadang generatornya perlu dicoba beberapa kali), atau kalau masih gagal, kabari aku dan kita bisa pangkas beberapa bagian yang paling ga penting duluan biar lebih ringan.
- Setelah desainnya jadi, share hasilnya ke aku dan aku bisa bantu build versi web app (HTML/PWA) yang beneran jalan dan responsive di semua device.
