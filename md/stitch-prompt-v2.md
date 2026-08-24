# Prompt Google Stitch v2 — JadwalKu (Modern Redesign)

> Cara pakai: jalankan prompt **berurutan** (Step 0 dulu untuk bikin tema, lalu satu
> layar per generate). Stitch cuma mampu ~4–6 layar per run, jadi jangan paste semua
> sekaligus. Ekspor tiap hasil ke `references/<nama-folder>/screen.png`.

---

## STEP 0 — Setup Tema (WAJIB pertama, sekali saja)

```
Create a reusable design theme called "JadwalKu Expressive" for a campus schedule app.

Style: 2026 expressive Material 3 — soft-depth, colorful but calm. NOT flat, NOT minimal.
- Background: near-white #F8FAFC (light) / deep blue-slate #0D121C (dark), with soft
  ambient aurora washes (teal, indigo, warm peach) glowing from the corners.
- Brand: teal #00685F (light) / mint #6BD8CB (dark).
- Cards: 20–28px radius, tonal tints instead of borders (mint, soft blue, warm peach,
  lavender, amber container tones), very soft diffuse shadows on floating elements only.
- Buttons: full pill, teal primary with subtle gradient, pressed scale state.
- Typography: Inter — 36px bold greeting, 18px semibold card titles, 14px body,
  11px uppercase tracking labels for section headers.
- Icons: Material Symbols, inside rounded-2xl tinted icon chips.
- Components: pill segmented controls with sliding indicator, bottom sheets with grab
  handle, side panels, shimmer skeletons, tonal empty states with big icon circles,
  status dots, progress bars/rings.
- Navigation: floating pill bottom nav with active indicator (mobile); 280px sidebar
  with grouped pill active state (desktop).
- Class type colors: green=Offline (K1), blue=Online (K2), violet=Hybrid, amber=Combined.

Save this as the app theme. I will design every screen using it.
```

Ekspor/keep: theme + logo (folder `theme/`).

---

## STEP 1 — Home (mobile light) → `home_today/`

```
Using the saved "JadwalKu Expressive" theme exactly. Design the Home screen, MOBILE
LIGHT. Glassy header: logo mark + bell with unread dot. Bold greeting "Selamat pagi! 👋"
+ date + prodi pill chip "Informatika · Semester 2". Hero card "Kelas Berikutnya": teal
gradient, course name big, lecturer + room chips, countdown pill "48 Menit", time box.
Section label "JADWAL HARI INI — SELASA", timeline of white cards each with a class-type
icon in a tinted circle overlapping the left edge, status dot + label, time, room; red
"now" line between two items. Warm peach "Catatan Hari Ini" note card. Floating pill
bottom nav with active indicator.
```

## STEP 2 — Home (desktop light) → `home_today_desktop/`

```
Same theme, Home screen DESKTOP LIGHT: 280px sidebar with pill active state; content
max-width 1280px. Left 2/3: greeting block, teal gradient "Kelas Berikutnya" hero,
today timeline. Right 1/3: "Catatan Hari Ini" warm peach note card + colorful mini stat
chips (SKS mint, Kelas blue, Tugas green).
```

## STEP 3 — Home (mobile dark) → `home_today_dark/`

```
Same screen as Step 1 but DARK MODE: deep blue-slate background with stronger aurora
washes, mint primary, cards in elevated dark containers.
```

## STEP 4 — Weekly grid (desktop light + dark) → `weekly_grid/`

```
Same theme. **Weekly schedule, DESKTOP**: true calendar grid — "GMT+7" time gutter
(07:00–21:00), day columns Senin–Sabtu with dates, today column tinted with teal pill,
positioned colorful event blocks (tinted by class type, rounded, time + room inside,
conflict warning icon), red current-time line across today's column, one column striped
diagonally labeled "LIBUR". Header: title + share icon + avatar. Then also produce the
DARK variant. Mobile variant: day chip tabs + stacked class cards.
```

## STEP 5 — Tasks → `tasks/`

```
Same theme. **Tasks screen**: header "Tugas Kuliah" + Filter button + teal pill "Tambah
Tugas". Groups "Minggu Ini" / "Minggu Depan" / "Selesai" with colored dot + count badge.
Task cards: priority left accent (red/amber/blue), round checkbox, course code chip,
title, description, deadline pill. Right widgets (desktop): "Progres Minggu Ini" teal
gradient card with progress bar + "Prioritas Tinggi" card with tinted icon tiles.
Floating + FAB. Mobile + desktop, light + dark.
```

## STEP 6 — Exams → `exams/`

```
Same theme. **Exam schedule**: UTS/UAS segmented control with sliding pill, countdown
chip to next exam, exam cards grouped by date — subject code chip, title, date pill,
time, room, Online/Offline mode badge. UTS cards tinted blue, UAS tinted warm peach.
Mobile + desktop, light + dark.
```

## STEP 7 — Search → `search/`

```
Same theme. **Search screen**: big rounded search field, filter chips (Hari, Tipe
Kelas), results grouped "Jadwal" / "Dosen" / "Tugas" with tinted icons, recent searches
as removable chips. Mobile + desktop, light + dark.
```

## STEP 8 — Settings → `settings/`

```
Same theme. **Settings screen**: profile card (prodi + semester + "Ganti" pill);
"Terakhir diperbarui Admin" info banner; colorful stat chips row (SKS mint / Kelas blue
/ Tugas green); reminder toggle list; Appearance: 3-way theme segmented (Terang/Gelap/
Sistem), font size pills, high contrast switch; class color legend with dots.
Mobile + desktop, light + dark.
```

## STEP 9 — Notifications → `notification_center/`

```
Same theme. **Notification center**: groups "Hari Ini" / "Kemarin" / "Lebih Lama";
rows with tinted icon per type (class=teal, task=amber, exam=red, change=blue), unread
dot, title + description + time; "Tandai dibaca" + "Hapus semua" header actions.
Mobile + desktop, light + dark.
```

## STEP 10 — Export/Share → `export_share/`

```
Same theme. **Export & share screen** (mobile): back arrow + "Bagikan Jadwal"; radio
card scope selector (Semua kelas / Semester ini); three option cards with tinted icon
circles: Google Calendar (.ics), Share teks, Share sebagai gambar with PNG thumbnail.
Footer "X kelas akan diekspor". Light + dark.
```

## STEP 11 — Change history → `change_history/`

```
Same theme. **Change history** (desktop): filter chips (Semua/Upload/Edit/Publish),
vertical timeline, colored entity chips, old → new values, timestamp, actor avatar.
Light + dark.
```

## STEP 12 — About → `about_help/`

```
Same theme. **About & help** (mobile): logo + "JadwalKu" + version, FAQ accordion (4
items), "Hubungi Admin" card with WhatsApp button. Light + dark.
```

## STEP 13 — Intro + Onboarding → `intro_tutorial/`, `onboarding/`

```
Same theme. **Intro tutorial** (mobile, 3 slides one shot): big tonal illustration
circle with icon, bold headline, page dots, Skip + teal pill "Mulai". Then
**Onboarding**: progress bar, "Kamu prodi apa?" with 2-column tonal selectable cards
(selected = teal ring), then "Semester berapa?" pill grid 1–8, back arrow. Light + dark.
```

## STEP 14 — Admin login → `admin_login/`

```
Same theme. **Admin login**: centered card on aurora gradient background, logo,
"Masuk sebagai Admin", email + password, teal pill "Masuk", small "Mode Mahasiswa" back
link. Light + dark.
```

## STEP 15 — Admin dashboard → `admin_dashboard/`

```
Same theme. **Admin dashboard** (desktop): colorful stat cards — Prodi (mint), Mata
Kuliah (blue), Transisi Semester (peach) — each with rounded icon chip + big colored
number; "Quick Actions" list with tinted icon tiles (5 different colors); "Riwayat
Perubahan" timeline card. Light + dark.
```

## STEP 16 — Admin upload → `admin_upload/`

```
Same theme. **Upload & import** (desktop): tinted icon chip header "Import Data
Master"; large dashed drag & drop zone with cloud icon (10MB max); parse preview table
with green/red status chips; summary stat chips; "Simpan Draft" outline + gradient
teal "Publish" pill. Light + dark.
```

## STEP 17 — Admin manual entry → `admin_manual_entry/`

```
Same theme. **Manual schedule entry** (desktop): collapsible "Mata Kuliah Baru" form
card; session list with day/time/room fields + session chips; success banner with
check icon; "Simpan Draft" + "Publish". Light + dark.
```

## STEP 18 — Admin courses → `admin_courses/`

```
Same theme. **Manage courses & lecturers** (desktop): search + filter bar, clean table
(Kode, Nama MK, Dosen, SKS, Durasi, Aksi) with hover rows, inline edit, delete
confirm, "Tambah MK" teal pill. Light + dark.
```

## STEP 19 — Admin exams / prodi / holidays → `admin_exams/`, `admin_prodi/`, `admin_holidays/`

```
Same theme. Three admin screens: **exam manager** (bulk import + list), **prodi
manager** (cards with semester range), **holiday manager** (date picker + holiday chip
list). Each: tinted header icon chip, primary pill action top-right, 20px rounded
cards, tinted empty states. Light + dark.
```

---

## Tips

- Hasil meleset dari tema? Tambahkan di awal prompt: "Match the saved JadwalKu
  Expressive theme exactly."
- Satu generate bisa berisi 2–3 layar kalau diminta bareng (mis. Step 13 gabung).
- Ekspor PNG → `references/<nama-folder>/screen.png` sesuai nama di tiap step.
- Selesai semua → lanjut `REDESIGN_PLAN.md` langkah 3 (re-skin aplikasi).
