# 🚀 DEPLOYMENT.md — Jadwal Kampus

> Actionable checklist consolidating `PLAN.md` §17–18. Follow top to bottom.
> Everything runs on the Firebase **Spark (free) plan** — no billing account.

---

## 1. Prerequisites

- [ ] Node.js 18+ installed (`node -v`)
- [ ] Firebase CLI installed and logged in:
      ```bash
      npm install -g firebase-tools
      firebase login
      ```
- [ ] Netlify account (free) — for hosting

## 2. Firebase Project Setup (one-time)

- [ ] [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it (e.g. `jadwal-kampus`) → skip Analytics if asked → stay on **Spark plan**
- [ ] **Firestore**: Build → Firestore Database → Create → **Production mode** → region `asia-southeast2` (or nearest)
- [ ] **Authentication**: Build → Authentication → Get started → Sign-in method → enable **Email/Password**
- [ ] Authentication → Users → **Add user** → create the single admin account
      (e.g. `admin@jadwalkampus.app` + strong password). This is the only account, ever.
      ⚠️ The email must match `isAdmin()` in `firestore.rules` — change either side if different.
- [ ] **Web app**: Project Overview → `</>` → nickname → copy the `firebaseConfig` values

## 3. Frontend Environment

- [ ] Fill `frontend/.env` (copy from `.env.example`):
      ```
      VITE_FIREBASE_API_KEY=...
      VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
      VITE_FIREBASE_PROJECT_ID=...
      VITE_FIREBASE_STORAGE_BUCKET=...
      VITE_FIREBASE_MESSAGING_SENDER_ID=...
      VITE_FIREBASE_APP_ID=...
      ```
- [ ] Local sanity check: `npm run dev` → complete onboarding → verify data loads (or
      sample fallback if Firestore is still empty)

## 4. Deploy Security Rules & Indexes (BEFORE going public)

- [ ] Review `firestore.rules` — admin email must match step 2
- [ ] Deploy:
      ```bash
      firebase deploy --only firestore:rules,firestore:indexes
      ```

## 5. Test Security Rules with the Emulator (Phase 5 item F — do not skip)

### Automated (recommended — 16 scenarios, exit code = pass/fail)

``bash
# Terminal 1 (from project root):
npx firebase-tools emulators:start --only firestore

# Terminal 2 (from frontend/):
npm run test:rules
`` 
> Status: 16/16 PASS (verified 24 Aug 2026). The test also covers admin draft-read
> bypass, query-constraint enforcement, and errorLog create-only behavior.

### Manual (Emulator UI alternative)

```bash
firebase emulators:start
```
With the emulator running, run these scenarios (Emulator UI → Firestore → rules
playground, or a temporary test script):

| # | Scenario | Expected |
|---|---|---|
| 1 | Unauthenticated write to `jadwal` | ❌ denied |
| 2 | Unauthenticated write to `mataKuliah` / `prodi` / `libur` / `settings` / `riwayat` | ❌ denied |
| 3 | Authenticated **non-admin** user writes anywhere | ❌ denied |
| 4 | Admin email writes to `jadwal`, `ujian`, etc. | ✅ allowed |
| 5 | Anonymous **read** `jadwal` where `status == "published"` | ✅ allowed |
| 6 | Anonymous **read** `jadwal` draft (`status != "published"`) | ❌ denied |
| 7 | Anonymous read `mataKuliah`, `prodi`, `libur`, `settings`, `riwayat` | ✅ allowed |
| 8 | Anonymous **create** in `errorLog` | ✅ allowed |
| 9 | Anonymous **read/update/delete** `errorLog` | ❌ denied |
| 10 | Anonymous **read** `ujian` draft | ❌ denied |

- [ ] All 10 pass before deploying publicly. Rules are the **only** access-control
      layer in this architecture (no Cloud Functions) — this test is the most important
      step of the whole deployment.

## 6. Build & Deploy Frontend to Netlify

- [ ] `cd frontend && npm run build` → produces `dist/`
- [ ] **Option A (Git-connected, recommended):**
      1. Push the repo to GitHub
      2. Netlify → Add new site → Import existing project → pick the repo
      3. Base directory: `frontend` · Build command: `npm run build` · Publish dir: `dist`
      4. Site settings → Environment variables → add all `VITE_FIREBASE_*` values
      5. Deploy
- [ ] **Option B (CLI):** `netlify deploy --prod` (or drag `dist/` onto the Netlify UI)
      ⚠️ With Option B you must still set the env vars and rebuild — `VITE_*` vars are
      baked at build time.
- [ ] SPA routing: confirm `netlify.toml` redirect `/* → /index.html 200` is active
      (repo root already has it; if deploying only `frontend/`, ensure the file ships)

## 7. Post-Deploy Wiring

- [ ] Firebase Console → Authentication → Settings → **Authorized domains** → add your
      Netlify domain (e.g. `jadwal-kampus.netlify.app`) — required for admin sign-in
- [ ] Open the site → run the **rules scenarios again against production** (at minimum:
      #1, #4, #5, #6) from the browser devtools console
- [ ] Admin flow: sign in at `/admin/login` → upload a real schedule .xlsx → validate →
      save draft → **Publish** → verify it appears for students
- [ ] Student flow (fresh device/incognito): onboarding → home → weekly → offline test:
      load once online → airplane mode → reload → data still renders (Firestore
      persistence) → back online → edits sync
- [ ] PWA: install from the browser menu → launches standalone → offline icon works

## 8. Custom Domain (optional)

- [ ] Netlify → Domain settings → add domain → follow DNS instructions
- [ ] Add the custom domain to Firebase **Authorized domains** too

## 9. Post-Launch Notes

- **Backups:** before risky bulk changes, admin → Dashboard → Export Backup (JSON)
- **Quotas:** Spark plan daily limits — watch Firestore reads in the Firebase Console
  (real-time listeners count reads on every reconnect)
- **Semester rollover:** Dashboard → "Start New Semester" (archives old data)
- **Errors:** check the `errorLog` collection when students report issues

## 10. Verification Sign-off

- [ ] All §5 rules scenarios pass
- [ ] Build passes with no errors (`npm run build`)
- [ ] Lighthouse: PWA installable ✅, a11y ≥ 90, no blocking errors
- [ ] Visual sweep done at <600px / 600–1024px / >1024px + dark mode + high contrast
- [ ] Admin + student flows verified end-to-end on the production URL
