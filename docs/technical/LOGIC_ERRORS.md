# Logic Errors Report — JadwalKu

> Findings from a code review across the frontend, Firestore rules, and admin flows.
> Severity: 🔴 crash/blocker · 🟠 wrong behavior · 🟡 minor/code quality.
> This document is a tracking reference only — no code changes are made here.

---

## 🔴 Crash-level / Blockers

### 1. `frontend/src/pages/student/WeeklySchedule.jsx` — `availableTAs` is not defined (page crash) — ✅ FIXED

> **Status:** Fixed — the JSX now references `allTAs`. Kept here for the record.

```jsx
const allTAs = useMemo(() => { ... }, [...])   // memo is named "allTAs"
...
{[...availableTAs]                              // JSX references "availableTAs"
  .filter((t) => t !== currentTA)
  .sort((a, b) => b.localeCompare(a))
  .map((t) => <option key={t} value={t}>TA {t} (arsip)</option>)}
```

- **Problem:** The TA dropdown spread `availableTAs`, but the memo is declared as `allTAs`. `availableTAs` does not exist → `ReferenceError: availableTAs is not defined` when rendering `/jadwal`, crashing the page.
- **Fix:** Rename the memo to `availableTAs`, or reference `allTAs` in the JSX (one line).

---

### 2. `firestore.rules` vs. TA-archive feature — archived schedules unreadable to students

```js
match /jadwal/{doc} {
  allow read: if isAdmin() || resource.data.status == "published";
  ...
}
```

- **Problem:** `WeeklySchedule` subscribes to `status == 'archived'` to populate the TA-archive dropdown. The rule only permits reads where `status == "published"`. Every student query for archived docs is **denied**, so the archive feature silently returns empty in production (works only for admins or with the emulator/test data).
- **Fix:** allow read for archived as well:
  ```js
  allow read: if isAdmin() || resource.data.status in ["published", "archived"];
  ```
  (The `ujian` collection rule has the same issue and should be updated consistently.)

---

### 3. `frontend/src/pages/student/Onboarding.jsx` — "Masuk sebagai Admin" navigates to a route that doesn't exist

```jsx
onClick={() => navigate('/admin')}
```

- **Problem:** `App.jsx` defines no `/admin` route (only `/admin/login`, `/admin/dashboard`, etc.). The catch-all `*` route redirects to `/`, so the admin onboarding button **silently sends the user to the student home** instead of the admin login.
- **Fix:** `navigate('/admin/login')`.

---

### 4. `frontend/src/pages/student/Exams.jsx` — `groupByDate` sorts by formatted label, not by date

```js
return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
```

- **Problem:** Groups are keyed by the *localized date label* (`"12 Agt 2026"`). Lexicographic comparison puts `12 Agt` before `5 Agt`, and `Des 2025` after `Jan 2026` — exam schedules display **out of chronological order**.
- **Fix:** key groups by `exam.tanggal` (ISO string sorts correctly), sort by that key, and format the label only for display.

---

## 🟠 Wrong-behavior bugs

### 3. `frontend/src/pages/admin/UploadImport.jsx` — `canPublish` ignores unknown course codes

```js
const canPublish =
  validation &&
  validation.entryErrors.length === 0 &&
  validation.courseErrors.length === 0 &&
  validation.conflicts.length === 0
```

- **Problem:** `validation.unmatched` (MK codes referenced by the schedule but absent from the course list) is computed and *displayed* as an error, but it is **not** included in `canPublish`. Schedules referencing nonexistent MK codes can still be published, contradicting the preview UI and `validateUploadBatch()` (which does include `unmatchedCodes` in `valid`).
- **Fix:** add `&& validation.unmatched.length === 0`.

---

### 4. Timezone off-by-one (WIB = UTC+7)

Two independent places use a **UTC** date instead of the **local** date:

**a) `frontend/src/pages/student/WeeklySchedule.jsx` — `holidayDates`**

```js
const iso = typeof t.toDate === 'function' ? t.toDate().toISOString() : String(t)
set.add(iso.slice(0, 10))
```

- `toDate().toISOString()` returns UTC. A holiday at midnight WIB (e.g. `2026-08-25T00:00:00+07:00`) becomes `2026-08-24T17:00:00Z`, so `.slice(0,10)` yields the **previous day**. The holiday highlights the wrong column.

**b) `frontend/src/pages/student/Home.jsx` — `dailyNoteKey`**

```js
return `${STORAGE_KEYS.dailyNotes}:${new Date().toISOString().slice(0, 10)}`
```

- "Today's note" is keyed by UTC date. In WIB the note rolls over at **07:00 local** (not midnight). Also inconsistent with `dateKey()` in `notificationEngine.js`, which uses local time.

- **Fix:** format from local date parts, e.g.:
  ```js
  const d = new Date()
  const localIso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  ```

---

### 5. `frontend/src/lib/xlsxParser.js` — `normalizeClassType` order bug loses HBH/HBD

```js
return CLASS_TYPE_CODES.find((c) => upper.includes(c)) ?? upper
// CLASS_TYPE_CODES = ['K1','K2','HB','HBH','HBD','GBK1','GBK2']
```

- **Problem:** `'HB'` is a substring of `'HBH'`/`'HBD'`. `find` iterates in order, so input `HBH` or `HBD` matches `'HB'` first → the subclass is silently destroyed on import (only affects data fidelity; downstream tone mapping is the same `hybrid`).
- **Fix:** match the longest candidate first:
  ```js
  const sorted = [...CLASS_TYPE_CODES].sort((a, b) => b.length - a.length)
  return sorted.find((c) => upper.includes(c)) ?? upper
  ```

---

### 6. `frontend/src/pages/admin/AdminDashboard.jsx` — broken chronological sort for history

```js
[...history].sort((a, b) => String(b.timestamp ?? '').localeCompare(String(a.timestamp ?? '')))
```

- **Problem:** `timestamp` is a Firestore `Timestamp` object. `String(timestamp)` produces `"Timestamp { seconds: …, nanoseconds: … }"`; lexicographic comparison of that string is **not chronological** (e.g. `9` sorts after `10`). The "Riwayat Perubahan" list shows arbitrary order.
- **Fix:** compare epoch millis:
  ```js
  .sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0))
  ```

---

### 7. `frontend/src/lib/publishHelpers.js` — `publishAllDrafts` collection-wide blast radius

```js
const q = query(collection(db, collectionName), where('status', '==', 'draft'))
```

- **Problem:** After importing a file for *one* prodi/semester, `UploadImport.saveAll({publish:true})` calls `publishAllDrafts`, which publishes **every** draft in the collection and archives the matching published docs for **all** prodi/semesters found in the new draft set. One admin's import silently mutates unrelated data.
- **Fix:** scope the publish to the imported prodi/semester, or publish explicit doc IDs (as `ManualEntry` already does via `publishDocuments`).

---

### 8. `frontend/src/pages/admin/ManualEntry.jsx` — inconsistent clash detection

```js
const clash = sessions.find((s) =>
  s.hari === form.hari &&
  s.prodi === form.prodi.trim() &&
  Number(s.semester) === Number(form.semester) &&
  toMinutes(s.jamMulai) < toMinutes(form.jamSelesai) &&
  toMinutes(form.jamMulai) < toMinutes(s.jamSelesai),
)
```

- **Problem:** The local clash check compares day + prodi + semester + overlap but **ignores `ruang` and `tipeKelas`**, so parallel K1/K2 sessions in different rooms are falsely flagged as clashes. The upload validator and weekly grid (which do compare room + type) would call them non-conflicting. Three separate conflict implementations with different semantics.
- **Fix:** extract one shared `findConflicts(entries)` in `uploadValidator.js` and reuse it in `ManualEntry`, `WeeklySchedule.conflictedIds`, and the validation pipeline.

---

### 9. `frontend/src/pages/student/ExportShare.jsx` — scope selector rendered twice

Two consecutive `<section>` blocks both map `OPTIONS` and call `setScope` — the "Pilih Cakupan" UI appears **duplicated** with different styling (leftover from a redesign). Selecting in one updates both.
- **Fix:** delete one of the two sections.

---

### 10. `frontend/src/pages/student/ExportShare.jsx` — "Semua kelas" option is a no-op

```js
const entries = useMemo(() => {
  if (scope === 'all') return jadwal
  return jadwal.filter((e) => e.semester === Number(semester))
}, [jadwal, scope, semester])
```

- **Problem:** The Firestore query is already constrained to `semester == X`, so `scope === 'all'` and `scope === 'semester'` return **identical data**. The "Semua kelas" scope does nothing.
- **Fix:** either fetch all semesters when `scope === 'all'`, or remove the option.

---

### 11. `frontend/src/pages/student/Onboarding.jsx` — hardcoded `samplePrograms` ignores admin-managed `prodi` collection

```jsx
{samplePrograms.map((p) => (
```

- **Problem:** `ManageProdi` maintains a `prodi` collection in Firestore, but the onboarding prodi step lists only the 5 hardcoded programs. Prodi added by the admin **never appear** for new students.
- **Fix:** subscribe to the `prodi` collection (`useFirestore('prodi')`) with `samplePrograms` as offline fallback.

---

### 12. `frontend/src/pages/student/Search.jsx` — `scheduleHits` computed but never rendered

```js
const scheduleHits = schedule.filter((e) => e.kodeMK?.toLowerCase().includes(q))
return { courseHits, lecturerHits, taskHits, scheduleHits }
```

- **Problem:** Schedule matches are computed on every search but no `ResultSection` renders them, and no filter chip exists for schedules — dead code / incomplete feature.
- **Fix:** add a "Jadwal" result section (and optionally a filter chip), or remove the computation.

---

## 🟡 Minor / code-quality

### 9. `frontend/src/pages/admin/UploadImport.jsx` — non-idempotent import (duplicates)

Every schedule entry goes through `addDocument('jadwal', …)`. Re-uploading the same spreadsheet creates a full duplicate set of draft documents (no dedup key on hari + jam + kodeMK + prodi + semester).
- **Fix:** use a deterministic doc ID (`setDocument`) or check for existing entries per prodi/semester before insert.

### 10. `frontend/src/lib/icsExport.js` — missing RFC 5545 escaping + overnight edge case

```js
`SUMMARY:${entry.kodeMK}`,
entry.ruang ? `LOCATION:${entry.ruang}` : null,
```

- Commas, semicolons, backslashes and newlines must be escaped (`\,` `\;` `\\` `\n`) per RFC 5545; current code doesn't, corrupting the `.ics` for Google Calendar/Outlook.
- `nextOccurrence(dayIndex, entry.jamSelesai)` is computed independently of the start, so an overnight class (end < start) yields `DTEND < DTSTART`.
- **Fix:** add `escapeIcsText()`; for overnight classes set the end date one day later.

### 11. `frontend/src/pages/student/Home.jsx` — `dataTA` takes an arbitrary entry

```js
const found = scheduleSource.map((e) => String(e.tahunAjaran ?? '').trim()).filter(Boolean)
return found.length > 0 ? found[0] : deriveTahunAjaran()
```

- If the schedule mixes TA values, the label shows an arbitrary (first) TA. Minor, but misleading.
- **Fix:** derive distinctive TA or require a single TA for a prodi/semester.

### 12. `frontend/src/pages/student/Home.jsx` — no-op `nowMinutes > 0` guards

```js
const showNow = nowMinutes > 0 && startM > 0 && prevEnded
...
isPast={minutesUntil(entry.jamSelesai) <= 0 && nowMinutes > 0}
```

- `currentMinuteOfDay()` is only `0` at exactly midnight, so `nowMinutes > 0` is effectively always true — the guard adds nothing.
- **Fix:** remove the redundant check (or replace with a proper "has clock ticked" flag).

### 13. `frontend/src/lib/xlsxParser.js` — unknown semester silently defaults to 1

```js
const semester = semesterByCourse[...] ?? ... ?? 1
```

- Entries with an undeterminable semester are silently assigned `1`, which passes validation — a silent misplacement instead of surfacing an error in the preview.
- **Fix:** leave as `NaN`/empty and let the validator flag it.

### 14. `frontend/src/pages/admin/ManageCourses.jsx` — "Tambah MK" is actually an upsert

```js
await setDocument('mataKuliah', kodeMK, { ...form, kodeMK }, actor)
```

- `setDocument` with `{ merge: true }` silently overwrites an existing kodeMK; there is no "already exists" check on the Add form.
- **Fix:** check existence first and return a clear duplicate error.

### 15. `frontend/src/pages/admin/ManageHolidays.jsx` — no duplicate-date check

The same date can be added multiple times, producing duplicate holiday rows.
- **Fix:** reject/merge on duplicate `tanggal`.

### 16. Impure `setState` updaters (side effects inside updater)

`NotificationsContext.jsx`:
```js
setItems((prev) => {
  const merged = mergeNotifications(prev, incoming).slice(0, MAX_ITEMS)
  ...
  setItem(STORAGE_KEYS.notifications, merged)   // side effect inside updater
  return merged
})
```
`WeeklySchedule.jsx` (`handleReminderToggle`):
```js
setReminderOn((prev) => {
  setItem(`${STORAGE_KEYS.courseReminders}:${kode}`, !prev)
  return !prev
})
```
- **Problem:** localStorage write inside a functional updater is impure. React StrictMode may invoke updaters twice in development, and it can run during render.
- **Fix:** compute the next value, persist once, then `setState(next)` (or persist in a `useEffect` keyed on the state).

### 17. `frontend/src/pages/student/WeeklySchedule.jsx` — history state wiped on unmount

```js
return () => window.history.replaceState({}, '')
```

- The effect cleanup clears the router history state on every unmount/route change, breaking browser-back into a deep-link (`openKodeMK`).
- **Fix:** only clear the state when it was intentionally consumed, or remove the cleanup.

### 18. `frontend/src/lib/notificationEngine.js` — stale reminder description

`buildClassReminders` creates a stable id (`kelas-${entry.id}-${dateKey}`) but the description embeds the countdown (`akan dimulai dalam ${mins} menit`). Because the engine runs every 60s and merges by id, the **first** generated description is retained, so the minutes shown can be stale.
- **Fix:** either include the countdown in the id, or refresh the description on each merge.

### 19. `frontend/src/pages/student/Settings.jsx` — `ReminderToggle` impure updater

```js
setPrefs((prev) => {
  const next = { ...prev, [prefKey]: !(prev[prefKey] ?? true) }
  setItem(STORAGE_KEYS.reminderPrefs, next)   // side effect inside updater
  return next
})
```

- Same impure-updater pattern as #16 (localStorage write inside a functional `setState` updater; StrictMode runs it twice).
- **Fix:** compute `next` outside the updater, persist once, then `setPrefs(next)`.

### 20. `frontend/src/pages/student/Tasks.jsx` — timezone-sensitive week boundary

```js
const dl = new Date(task.deadline)   // 'YYYY-MM-DD' → parsed as UTC midnight
const diff = dl.getTime() - startOfToday.getTime()
if (diff <= weekMs) groups.thisWeek.push(task)
```

- `new Date('YYYY-MM-DD')` parses as UTC midnight; in WIB (UTC+7) that's 07:00 local, so the diff carries a +7h offset. A task due exactly 7 days out lands in "Minggu Depan" instead of "Minggu Ini". (`daysUntil` is benign thanks to rounding, but the week boundary is off.)
- **Fix:** parse the ISO date into local date parts before diffing.

### 21. `frontend/src/pages/student/ExportShare.jsx` — `handleShareImage` swallows errors silently

The `catch` around `renderScheduleImage`/`shareOrDownloadScheduleImage` ignores failures with no user feedback — if canvas rendering fails, nothing happens.
- **Fix:** set an error status (e.g. reuse `imageStatus` with a failure message).

### 22. `frontend/src/components/ConfirmDialog.jsx` — no Escape handling / focus trap

The modal lacks an Escape-key handler and focus management (a11y); it also ignores backdrop clicks.
- **Fix:** add `keydown` Escape → `onCancel`, and move focus into the dialog on open.

---

## Proposed fix-order checklist

> Audit ulang (2026-08-25): sebagian item ternyata SUDAH diperbaiki di kode
> sebelum laporan ini ditindaklanjuti (item 2–5, 9, 11, 12 di bawah). Semua
> sisa temuan telah diperbaiki dan diverifikasi (`oxlint` 0 warning,
> `vite build` sukses).

- [x] **1.** Rename `allTAs` → `availableTAs` (WeeklySchedule) — ✅ FIXED
- [x] **2.** Firestore rules: allow student read of `archived` (`jadwal` + `ujian`) — ✅ sudah benar di kode
- [x] **3.** Onboarding admin button → `/admin/login` (route `/admin` doesn't exist) — ✅ sudah benar di kode
- [x] **4.** Exams `groupByDate` sorts by ISO date, not formatted label — ✅ sudah benar di kode
- [x] **5.** `canPublish` includes `validation.unmatched` — ✅ sudah benar di kode
- [x] **6.** Timezone: local-date formatting for `holidayDates`, `dailyNoteKey`, Tasks `groupTasks` — ✅ FIXED
- [x] **7.** `normalizeClassType` longest-match; `AdminDashboard` history sort by millis — ✅ FIXED
- [x] **8.** `publishAllDrafts` scoped to prodi/semester; import dedup — ✅ publishAllDrafts DIHAPUS (dead code, tak ada pemanggil); UploadImport sudah pakai `publishDocuments` ter-scope + deterministic doc ID
- [x] **9.** Shared `findConflicts()` across ManualEntry / WeeklySchedule / validator — ✅ FIXED (ManualEntry kini memakai `findConflicts`)
- [x] **10.** ICS escaping + overnight handling — ✅ FIXED
- [x] **11.** ExportShare: remove duplicated scope section; make "Semua kelas" work or remove it — ✅ FIXED (duplikat dihapus; query tanpa filter semester sehingga "Semua kelas" berfungsi)
- [x] **12.** Onboarding prodi step reads Firestore `prodi` collection — ✅ sudah benar di kode
- [x] **13.** Search: render `scheduleHits` (or remove it) — ✅ FIXED (section "Jadwal" + filter chip ditambahkan)
- [x] **14.** Cleanups: no-op guards, upsert duplicate check, holiday dedup, impure updaters (NotificationsContext, WeeklySchedule, Settings, Search recents), history-state cleanup, stale reminder description, ExportShare error feedback, ConfirmDialog Escape/focus/backdrop — ✅ FIXED
