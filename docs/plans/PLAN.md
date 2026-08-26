# 📋 PLAN.md — Jadwal Kampus (Campus Schedule)

> A course schedule app with no login system for students, two roles (Student & Admin), fully responsive (mobile/tablet/desktop), installable as an app (PWA). Backend on Firebase, built entirely on the **free Spark plan** — Firestore + Firebase Authentication, no Cloud Functions.

---

## 1. Background & Problem

- The campus course schedule (Universitas Madani Yogyakarta) is originally distributed as a **single spreadsheet file** containing multiple sheets:
  - **Jadwal Perkuliahan** sheet — a matrix of Day x Study Program x Time, containing course codes and room info
  - **Daftar Mata Kuliah dan Dosen Pengampu** sheet — a lookup from Course Code to full course name, lecturer, lecturer contact, credit hours (SKS), and duration
  - Room-type legend: K1 (Offline Class), K2 (Online Class), GBK1/GBK2 (Combined Offline/Online Class), HB/HBH/HBD (Hybrid)
- This spreadsheet is **view/download only** — students cannot edit it
- The spreadsheet contains schedules for **all study programs at once**, making it hard for a student to find just their own program's schedule
- There's no integrated exam schedule (midterms/finals)
- There's no automatic reminder system

## 2. Project Goals

Build a web app (PWA) that:
1. Displays course and exam schedules in a cleaner, more readable way than the raw spreadsheet
2. Can be automatically filtered by the student's study program & semester
3. Works on phone (Android), tablet, and PC — fully responsive
4. Works **offline** after the data has been loaded once
5. Has **automatic reminders** before classes, exams, and task deadlines
6. Is easy to update when the schedule changes, without students having to edit anything themselves — via an admin panel. Admin still uploads the campus spreadsheet file as the original data source, which then gets imported into the database
7. Runs entirely on **free-tier infrastructure** — no billing account required

## 3. Target Users & Roles

| Role | How they access it | Capabilities |
|---|---|---|
| **Student** | No account — device-local, just picks Program then Semester on first app open | View course schedule, exam schedule, manage personal tasks, set reminders, personal notes |
| **Admin** | Signs in with one shared Firebase Authentication credential (a single email/password pair created manually in the Firebase Console) | Upload/edit schedule, manage courses & lecturers, manage exam schedule, manage program list, manage holidays |

## 4. Technical Summary

| | |
|---|---|
| **Name** | Jadwal Kampus |
| **Frontend** | Vite + React 18 + Tailwind CSS v3 |
| **PWA** | vite-plugin-pwa — installable, offline cache |
| **Backend** | Firebase **Spark (free) plan** — Firestore + Firebase Authentication only, no Cloud Functions |
| **Database** | Cloud Firestore (NoSQL, real-time) |
| **Admin auth** | Firebase Authentication, Email/Password provider — one shared admin account |
| **Excel parsing** | SheetJS (xlsx), fully client-side |
| **Business logic** | Runs entirely in the frontend (validation, publish, archive) — no server functions |
| **Hosting** | Netlify (static frontend) |

## 5. Architecture

```
React PWA ──Firebase SDK──► Firestore (real-time listener)
    │              ▲
    │        Firebase Authentication
    │        (admin sign-in only, one shared account)
    │
    └─ localStorage: student preferences, personal tasks,
       daily/per-course notes, cached published data, dark mode
```

- **Student:** subscribes to `status: published` data via the Firestore SDK (real-time listener) → cached in localStorage/IndexedDB (Firestore's built-in offline persistence) → keeps working offline. No sign-in needed at all.
- **Admin:** signs into Firebase Authentication with the shared admin email/password → once authenticated, the client SDK can write to Firestore directly, governed by Security Rules that check `request.auth != null`
- **Upload flow:** admin uploads .xlsx, parsed **entirely client-side** (SheetJS) → validated in the browser (course code lookup, time overlap checks, required fields) → written directly to Firestore as `draft` using the authenticated client SDK
- **Draft vs Publish:** a `status` field on each document; students only read documents where `status == "published"` (enforced via Firestore Security Rules). "Publishing" is just the admin client updating that field directly — no server function involved
- **Access security:** since there are no Cloud Functions to act as a trusted intermediary, **Firestore Security Rules become the entire security boundary**. Rules check `request.auth != null` (and optionally `request.auth.token.email == '<admin-email>'`) to allow writes; everyone else — including students — only gets read access to published documents
- Raw data from the campus spreadsheet (multi-sheet) is **joined** during client-side parsing: course codes in the schedule data are matched against the course lookup data to pull in the full name, lecturer, contact, SKS, and duration — then written to Firestore already merged

## 6. Folder Structure

```
frontend/
├── src/
│   ├── components/     Card, Badge, BottomNav, Sidebar, ConfirmDialog,
│   │                   EmptyState, Skeleton, OfflineBanner
│   ├── pages/student/  Intro, Onboarding, Home, WeeklySchedule, Tasks, Exams,
│   │                   Search, Settings, Notifications, CourseDetail,
│   │                   ChangeHistory, About, ExportShare
│   ├── pages/admin/    AdminLogin, AdminDashboard, UploadImport, ManageCourses,
│   │                   ManageExams, ManageProdi, ManageHolidays
│   ├── context/        AppContext (program/semester, theme, font size, admin session)
│   ├── hooks/          useFirestore, useOnlineStatus, useNotifications, useAdminAuth
│   ├── lib/            firebaseClient.js, xlsxParser.js, icsExport.js,
│   │                   storage.js, classTypes.js,
│   │                   uploadValidator.js   (client-side validation, replaces validateUpload)
│   │                   publishHelpers.js    (draft→published logic, replaces publishSchedule)
│   │                   semesterArchive.js   (archive logic, replaces archiveSemester)
│   │                   errorLogger.js       (writes directly to Firestore errorLog collection)
│   └── data/           sample seed data
firestore.rules          Security Rules (public read for published, write restricted to
                         authenticated admin — this is the ONLY access-control layer)
firestore.indexes.json   composite indexes (e.g. query by program + semester + status)
netlify.toml             build command, publish dir, SPA redirect rule
```

## 7. Design System — "Academic Precision"

**Full design tokens live in `design-system.md`** (exported from Google Stitch) — this is the authoritative source, not the summary below.

- **Style:** Modern Minimalist, flat (no gradients), tonal layering for depth, generous white space
- **Core colors:** primary teal `#00685F` (on-primary `#FFFFFF`), background `#F5FAF8` (light) / `#0F172A`-equivalent dark surfaces, secondary slate `#505F76`, tertiary warm `#924628`, error `#BA1A1A` — full light/dark palette (surface, container, outline, fixed variants, etc.) in `design-system.md`
- **Typography:** Inter exclusively. Scale: `display` (36px/700), `headline-lg` (28px/600, 24px/600 on mobile), `title-md` (18px/600 — course names in cards), `body-lg` (16px/400), `body-sm` (14px/400 — time/location), `label-caps` (12px/600, uppercase-tracking — room numbers, timestamps)
- **Shape:** cards/containers 12–16px radius, buttons/inputs 8px radius, chips/badges full pill (999px), focus ring 2px teal with 4px offset
- **Elevation:** flat tonal layering, only very soft diffused shadows on cards (Level 1) and stronger on modals (Level 2) — no inner shadows/bevels
- **Grid:** strict 8px base unit (4px for micro-adjustments); desktop gutter 24px, mobile side margins 16px
- Class-type color coding (consistent across all screens):
  - 🟢 `K1` Offline Class (Success Green)
  - 🔵 `K2` Online Class (Blue)
  - 🟣 `HB / HBH / HBD` Hybrid (Purple)
  - 🟡 `GBK1 / GBK2` Combined Class (Amber)
  - ⚪ Neutral/inactive
- Schedule cards: 12px padding, 16px radius, 4px vertical status-color bar on the left edge, title in `title-md`, time/location in `body-sm`
- Dark mode toggle, font-size scale (Small–Extra Large), high-contrast mode, WCAG AA
- Layout per breakpoint:
  - **Mobile (<600px):** bottom navigation, single column, 16px margins, horizontal day tabs / day-view scroll
  - **Tablet (600–1024px):** two-column, left rail / top tabs
  - **Desktop (>1024px):** persistent 280px sidebar (teal active-state pill + 5% tint), fluid main content max-width 1280px, full weekly grid, detail as a side panel
- Detailed visual reference (all screens) is in `prompt-desain-google-stitch.md`; full design tokens in `design-system.md` — **design is finalized and used as the build reference**

## 8. Feature Summary

### Student Features
- 3-slide intro tutorial on first app open
- 2-step onboarding: pick Program → pick Semester
- Home: today's schedule + "Next Class" card with countdown, holiday banner, daily notes
- Weekly schedule (day tabs on mobile/tablet, full grid on desktop) + schedule conflict detection
- Midterm/final exam schedule with countdown & exam mode
- Tasks screen: deadline list with priority, can be marked done, H-3/H-1/day-of reminders
- Course detail: lecturer info, credit hours, room, class type, personal per-course notes, related tasks
- Automatic reminders (class, exam, task) — configurable timing
- Live search across courses/lecturers/tasks
- Notification center
- Export schedule to Google Calendar (.ics) + share as image/link
- Android home-screen PWA shortcut (in place of a native widget)
- Full offline mode — powered by Firestore's built-in offline persistence, plus additional localStorage caching for preferences
- Holiday mode — automatically hides classes on marked dates
- Dark mode & accessibility settings (font size, high contrast)
- About & Help page (FAQ)
- Schedule change history (read-only)
- Schedule data auto-updates on screen for online students the moment admin publishes (Firestore real-time listener), no manual refresh needed

### Admin Features
- Sign in with the shared Firebase Authentication account (email/password)
- Dashboard overview (program count, course count, last data upload status, activity log)
- Upload schedule via file (.xlsx/.csv), parsed with SheetJS, with preview & validation of unmatched course codes — all done client-side before writing to Firestore
- Manual entry (form) to add/edit a single class or course without re-uploading the whole file
- Draft & Publish system — data isn't visible to students until published (a direct Firestore field update from the authenticated admin client)
- Manage courses & lecturers (table, search, filter, inline edit)
- Manage exam schedule (manual or bulk CSV import)
- Manage program list (+ semester range)
- Manage holidays (mark dates + labels)
- Full change history (old vs new value log, written directly by the client on every edit)
- "Start New Semester" action to archive old data (see §14)
- Manual "Export Backup" button to download a JSON snapshot of current Firestore data (replaces automated server-side backups, see §13)

## 9. System Flow (High-level)

1. Admin opens the admin login screen and signs in with the shared Firebase Auth email/password
2. Admin uploads a schedule file or enters data manually → validated client-side → written to Firestore with `status: draft` (allowed because the client SDK carries an authenticated session)
3. Admin clicks "Publish" → the client directly updates the relevant documents' `status` to `published` and appends an entry to the `riwayat` (history) collection — all via client-side Firestore writes, governed by Security Rules
4. Student opens the app → picks Program & Semester (once, stored on-device)
5. The app subscribes to `published` data matching the student's program & semester via a Firestore listener (real-time) — no sign-in required
6. Data is automatically available offline via Firestore's offline persistence; personal preferences (tasks, notes, settings) stay in localStorage
7. Automatic reminders run based on the data stored on-device
8. If admin updates & re-publishes the schedule → online students see the update automatically without a manual refresh; offline students sync once back online

## 10. Firestore Data Structure

| Collection | Main fields |
|---|---|
| `jadwal` (schedule) | id, prodi (program), semester, hari (day), jamMulai (startTime), jamSelesai (endTime), kodeMK (courseCode), ruang (room), tipeKelas (classType), status (draft/published), updatedAt |
| `mataKuliah` (courses) | kodeMK, namaMK (courseName), dosen (lecturer), kontakDosen (lecturerContact), sks, durasi (duration) |
| `ujian` (exams) | id, prodi, semester, jenis (UTS/UAS), kodeMK, tanggal (date), jam (time), ruang, mode, status |
| `prodi` (programs) | nama (name), semesterMin, semesterMax |
| `libur` (holidays) | tanggal, label |
| `riwayat` (history) | timestamp, entitas (entity), field, nilaiLama (oldValue), nilaiBaru (newValue), aktor (actor) |
| `settings` | key, value (e.g. lastPublished, lastFileName) |
| `errorLog` | timestamp, errorType, detail, context |

Main query pattern (needs a composite index in `firestore.indexes.json`): `jadwal` where `prodi == X AND semester == Y AND status == "published"`.

## 11. Implementation Phases

### Phase 1 — Frontend Foundation
- [x] Scaffold Vite + React + Tailwind, configure theme tokens
- [x] PWA manifest + icons + service worker (installable)
- [x] SPA router + responsive layout (bottom nav / sidebar)
- [x] Base components: Card, Badge, Button, Input, ConfirmDialog, EmptyState, Skeleton
- [x] AppContext + storage.js (localStorage helpers)
- [x] Set up Firebase project (Spark plan) + initialize SDK (firebaseClient.js) + enable offline persistence

### Phase 2 — Firebase Backend (Spark plan, no Cloud Functions) ✅ Done
- [x] Create Firestore collection structure + seed initial data
- [x] Enable Firebase Authentication, Email/Password provider
- [x] Manually create the single shared admin account in the Firebase Console (Authentication tab)
- [x] Write Firestore Security Rules (public read for `status: published`, write restricted to `request.auth != null`, scoped to the admin email)
- [x] Build `uploadValidator.js` — client-side validation logic (replaces the old `validateUpload` function)
- [x] Build `publishHelpers.js` — client-side draft→published + history logging logic
- [x] Build `errorLogger.js` — client helper that writes directly to the `errorLog` collection
- [x] Build `semesterArchive.js` — client-side semester archive logic
- [x] Fill `firestore.indexes.json` — composite indexes for prodi+semester+status queries
- [x] Test rules using the local Firebase Emulator before deploying — 11/11 scenarios pass (anon write denied, admin write allowed, draft unreadable publicly, errorLog create-only)

### Phase 3 — Student Flow ✅ Done
- [x] 3-slide intro tutorial (swipeable, dot indicator, "Skip"/"Start")
- [x] Onboarding: role selection → 2 steps (Program → Semester) with a progress indicator
- [x] "Today's Schedule" Home screen: greeting, holiday banner, "Next Class" card + countdown, today's timeline, daily notes
- [x] Weekly Schedule: day tabs on mobile / calendar grid on desktop, conflict detection & badges
- [x] Course Detail: bottom sheet (mobile) / side panel (desktop) — lecturer info, reminder toggle, related tasks, per-course notes
- [x] Tasks: This Week/Next Week/Done groups, manual add, priority, H-3/H-1/day-of reminders
- [x] Midterm/Final Exam Schedule + countdown + exam mode
- [x] Live search (courses/lecturers/tasks) + filter chips + recent searches
- [x] Settings: change program/semester, reminders, stats, dark mode, accessibility, color legend
- [x] Notification center (Today/Yesterday/Earlier groups, mark as read) — built via `NotificationsContext` + `notificationEngine.js`, persisted in localStorage, entry points: bell icon in mobile top bar + sidebar link with unread badge
- [x] Change History (read-only for students, read from the `riwayat` collection)
- [x] .ics export + image/link sharing
- [x] About & Help (FAQ accordion, admin contact)
- [x] Firestore real-time listener for auto-updates when admin publishes

### Phase 4 — Admin Flow ✅ Done
- [x] Admin login screen using Firebase Authentication (`signInWithEmailAndPassword`) + demo mode fallback when SDK unconfigured
- [x] Dashboard: overview cards, quick actions, condensed history timeline
- [x] Upload .xlsx/.csv: parse with SheetJS (`xlsxParser.js`), run validation, preview table, write to Firestore as draft
- [x] Manual Entry: schedule entry form + inline new-course form + session entry list
- [x] Save as Draft vs Publish (calls `publishHelpers.js`)
- [x] Manage Courses & Lecturers (table, search, filter, inline edit)
- [x] Manage Exam Schedule (manual + bulk CSV/XLSX import)
- [x] Manage Programs (add/edit/remove + semester range)
- [x] Manage Holidays (mark dates + labels)
- [x] "Start New Semester" action (calls `semesterArchive.js`) on dashboard
- [x] "Export Backup" button — queries all collections and downloads a JSON file

### Phase 5 — Polish & Verification
- [x] Consistent empty states & error states across all screens (EmptyState + unified StatusBanner dengan animated checkmark di semua layar admin)
- [x] Offline banner + verify Firestore offline persistence works correctly (persistentLocalCache + multi-tab manager)
- [x] Skeleton loading, micro-interactions (countdown urgency pulse, animated success checkmark, route fade transitions)
- [x] Verify responsiveness across 3 breakpoints + dark mode + contrast (visual sweep by owner)
- [x] Production build + Lighthouse PWA audit (by owner)
- [x] Test Firestore Security Rules thoroughly - 16/16 scenarios PASS via automated test (frontend/rules.test.mjs, npm run test:rules); fixed: admin could not read draft jadwal/ujian (isAdmin read bypass added)
- [x] Deployment guide (see DEPLOYMENT.md)

## 12. Known Limitations

- **No Cloud Functions:** all logic (validation, publish, archive, backups) runs in the browser rather than on a trusted server. This keeps the project fully free, but means Firestore Security Rules are the *only* thing standing between a malicious client and the database — rules need to be written and tested carefully
- **Notifications:** in-app only, shown while the app is open (no background push, since that would require Cloud Messaging infrastructure)
- **Android widget:** a PWA home-screen shortcut (not a native widget)
- **Sharing as a link:** requires hosting publicly accessible data, or falling back to image/text sharing
- **Backups:** manual, admin-triggered export instead of an automated scheduled job (since Cloud Scheduler also requires the Blaze plan)
- Student data (program/semester choice, notes, tasks, preferences) is **device-local**, not account-based — a strategy is needed for students who switch devices (e.g. export/import data)
- PWA reminders have limitations compared to native apps for background notifications; Android is generally more reliable than iOS
- Firestore's free tier (Spark Plan) has daily read/write/delete quotas — worth monitoring if usage grows significantly. If the project ever needs Cloud Functions, scheduled backups, or higher quotas, upgrading to Blaze later is straightforward and won't require re-architecting the frontend

## 13. Data Security & Reliability

- **No shared password logic at all** — admin authentication is handled entirely by Firebase Authentication (industry-standard, handles hashing/sessions internally), which is free and doesn't require Cloud Functions
- **Firestore Security Rules are the entire security boundary** (since there's no Cloud Function intermediary). Example approach:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /jadwal/{doc} {
        allow read: if resource.data.status == "published";
        allow write: if request.auth != null
                      && request.auth.token.email == "admin@jadwalkampus.app";
      }
      // similar pattern for ujian, mataKuliah, prodi, libur, riwayat
      match /errorLog/{doc} {
        allow create: if true;   // students can also log client errors
        allow read: if request.auth != null; // only admin can read them
      }
    }
  }
  ```
- **Firebase App Check** (free, works on the Spark plan) can be enabled to block requests that don't come from the real app, reducing abuse risk without needing server-side rate limiting
- **Manual backups** — admin uses the "Export Backup" button (Phase 4) to download a JSON snapshot before making risky bulk changes, as a rollback point
- **Stricter input validation** on upload/manual entry — not just checking for unmatched course codes, but also unusual time overlaps, malformed times, and empty required fields, all validated client-side in `uploadValidator.js` before data ever reaches Firestore

## 14. New Semester Management

- Needs an explicit **semester transition** flow: old documents aren't deleted, but a `semester`/`academicYear` field distinguishes active vs archived data, so student queries always filter to the current semester
- Admin needs a **"Start New Semester"** action on the dashboard — this runs `semesterArchive.js` client-side, which marks the previous semester's documents as archived (read-only history) and prepares an empty draft state for the current semester, all via a batched Firestore write from the authenticated admin session
- Change history remains accessible across semesters via the `riwayat` collection, but the student's default view only shows the active semester

## 15. Quality & Testing

- **Manual testing per phase**: a short checklist at the end of each phase (Phase 3–5) to verify the student/admin flow before moving to the next phase
- **Firebase Emulator Suite** for local testing of Firestore Rules before deploying to production — especially important here since rules are the only access-control layer, so a rules bug could accidentally let anyone write data
- **Unit tests for Excel parsing** (xlsxParser.js) and for `uploadValidator.js` — the most failure-prone parts if the campus spreadsheet format changes even slightly (new column, reordered columns, changed headers)
- **Testing with real data** - Done (24 Aug 2026): parser rewritten for the official campus spreadsheet format (matrix + legend + course table in one sheet); verified 101 entries + 88 courses, 0 validation errors

## 16. Monitoring

- **Simple error logging** — the frontend's `errorLogger.js` writes directly to the `errorLog` Firestore collection whenever something fails (parsing error, validation failure, failed write, etc.), so admin can check the history of issues without guessing
- **Firebase Console** provides basic usage monitoring (Firestore reads/writes, Authentication sign-ins) with no extra setup, useful for watching free-tier quota usage
- This log also helps when a student reports "the app is broken" — admin just checks the `errorLog` collection instead of trying to reproduce the issue manually

## 17. Firebase Setup Guide (Step-by-step, Spark/free plan)

1. **Create a Firebase project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com) → "Add project" → name it (e.g. `jadwal-kampus`) → follow the wizard (Google Analytics is optional, can be skipped)
   - **Stay on the Spark (no-cost) plan** — no upgrade needed for this project

2. **Enable Firestore**
   - In the console sidebar: Build → Firestore Database → "Create database"
   - Choose **Production** mode (not test mode, since rules will be configured manually)
   - Choose the nearest server location (e.g. `asia-southeast2` for Indonesia)

3. **Enable Firebase Authentication**
   - In the sidebar: Build → Authentication → "Get started"
   - Under Sign-in method, enable **Email/Password**
   - Go to the "Users" tab → "Add user" → create the one shared admin account (e.g. `admin@jadwalkampus.app` + a strong password) — this is the only account that will ever exist

4. **Register a Web App**
   - Project Overview → click the `</>` (Web) icon → give it a nickname (e.g. `jadwal-kampus-web`)
   - Firebase will display a `firebaseConfig` object (apiKey, authDomain, projectId, etc.) — **save this**, it's used in the frontend

5. **Install the Firebase CLI on your machine**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

6. **Initialize the project in your working folder**
   ```bash
   firebase init
   ```
   - Select features: **Firestore** and **Emulators** only (skip Functions — not needed on Spark plan; skip Hosting since you're using Netlify)
   - Choose the Firebase project created in step 1
   - This creates `firestore.rules` and `firestore.indexes.json`

7. **Fill in the Firestore Security Rules** (`firestore.rules`)
   - Public read for documents where `status == "published"`, write only allowed for the authenticated admin session (see the example rules in §13)

8. **Deploy the rules and indexes**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

9. **Test locally before going to production (recommended)**
   ```bash
   firebase emulators:start
   ```
   - Confirm students (unauthenticated) can't write data, and that only the admin credential can write, before deploying for real

## 18. Deployment Checklist (end of project)

1. **Set up Firebase** — follow the steps in §17 (Firestore, Authentication, Security Rules) — no billing account needed
2. **Frontend `.env`:** fill in the variables from the `firebaseConfig` obtained in step 4 of §17:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. **Build the frontend:** `npm run build` (produces a `dist` folder)
4. **Deploy to Netlify:**
   - Option A (Git-connected): push the repo to GitHub → in the Netlify dashboard, "Add new site" → "Import an existing project" → select the repo → set **Build command**: `npm run build`, **Publish directory**: `dist`
   - Option B (quick drag-and-drop): `netlify deploy --prod` (via Netlify CLI), or drag the `dist` folder directly onto the Netlify site
   - Add the environment variables (`VITE_FIREBASE_*`) in the Netlify dashboard → Site settings → Environment variables, so they're picked up at build time
5. **SPA routing on Netlify:** add a `netlify.toml` or `_redirects` file at the frontend root so all routes fall back to `index.html`:
   ```
   /*    /index.html   200
   ```
6. **Authorize the Netlify domain in Firebase:** in Firebase Console → Authentication → Settings → Authorized domains, add the Netlify domain (e.g. `jadwal-kampus.netlify.app`) so admin sign-in works from there
7. **Verify:** open the Netlify domain provided → test both the student and admin flows, confirm the Firestore connection and admin login work
8. **Custom domain (optional):** connect a campus domain via the Netlify dashboard → Domain settings, and add it to Firebase's authorized domains too, if used

## 19. Project Status

| Stage | Status |
|---|---|
| Idea & requirements discussion | ✅ Done |
| Spreadsheet data structure analysis | ✅ Done |
| UI design prompt (Google Stitch) | ✅ Done — ready to run |
| Technical architecture plan (Firebase, free Spark plan) | ✅ Done |
| Final UI design (Stitch output) | ✅ Done — used as the visual reference for the build |
| Frontend foundation (Phase 1) | ✅ Done |
| Firebase backend (Phase 2) | ✅ Done |
| Student flow (Phase 3) | ✅ Done |
| Admin flow (Phase 4) | ✅ Done |
| Polish & verification (Phase 5) | Done (24 Aug 2026) |
| Deployment | Not started (guide ready: md/DEPLOYMENT.md) |

## 20. File References

- `prompt-desain-google-stitch.md` — the full prompt used to generate the UI design in Google Stitch
- `design-system.md` — full design tokens exported from Google Stitch (colors, typography, spacing, elevation, shape, component specs) — the authoritative visual reference
- `DESIGN_REFERENCE.md` — instructions for the coding AI to always follow `references/` and `design-system.md` as the source of truth for UI, rather than improvising
- `PLAN.md` — this file, the technical architecture & implementation plan
