import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { NotificationsProvider } from './context/NotificationsContext'
import { Skeleton } from './components/Skeleton'
import { getItem, setItem, STORAGE_KEYS } from './lib/storage'
import { RequireAdmin } from './components/admin/RequireAdmin'
import { AdminLayout } from './components/admin/AdminLayout'

const Home = lazy(() => import('./pages/student/Home'))
const WeeklySchedule = lazy(() => import('./pages/student/WeeklySchedule'))
const Tasks = lazy(() => import('./pages/student/Tasks'))
const Exams = lazy(() => import('./pages/student/Exams'))
const Settings = lazy(() => import('./pages/student/Settings'))
const Notifications = lazy(() => import('./pages/student/Notifications'))
const Search = lazy(() => import('./pages/student/Search'))
const About = lazy(() => import('./pages/student/About'))
const ChangeHistory = lazy(() => import('./pages/student/ChangeHistory'))
const ExportShare = lazy(() => import('./pages/student/ExportShare'))
const Onboarding = lazy(() => import('./pages/student/Onboarding'))
const OnboardingWizard = lazy(() =>
  import('./pages/student/Onboarding').then((m) => ({ default: m.OnboardingWizard })),
)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageSchedule = lazy(() => import('./pages/admin/ManageSchedule'))
const ManageCourses = lazy(() => import('./pages/admin/ManageCourses'))
const ManageExams = lazy(() => import('./pages/admin/ManageExams'))
const ManageAcademicSettings = lazy(() => import('./pages/admin/ManageAcademicSettings'))
const ManageAnnouncements = lazy(() => import('./pages/admin/ManageAnnouncements'))

function RequireOnboarding({ children }) {
  // ?audit=1 di URL: set onboardingDone otomatis untuk Lighthouse / audit tools
  // sehingga audit tidak terjebak di halaman onboarding
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('audit') === '1') {
    setItem(STORAGE_KEYS.onboardingDone, true)
  }
  const done = getItem(STORAGE_KEYS.onboardingDone, false)
  if (!done) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-md">
      <Skeleton className="h-8 w-56" />
    </div>
  )
}

export default function App() {
  return (
    <NotificationsProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/wizard" element={<OnboardingWizard />} />

          <Route
            element={
              <RequireOnboarding>
                <AppLayout />
              </RequireOnboarding>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/jadwal" element={<WeeklySchedule />} />
            <Route path="/tugas" element={<Tasks />} />
            <Route path="/ujian" element={<Exams />} />
            <Route path="/pengaturan" element={<Settings />} />
            <Route path="/notifikasi" element={<Notifications />} />
            <Route path="/cari" element={<Search />} />
            <Route path="/tentang" element={<About />} />
            <Route path="/riwayat" element={<ChangeHistory />} />
            <Route path="/bagikan" element={<ExportShare />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/jadwal" element={<ManageSchedule />} />
              <Route path="/admin/upload" element={<Navigate to="/admin/jadwal" replace />} />
              <Route path="/admin/manual" element={<Navigate to="/admin/jadwal" replace />} />
              <Route path="/admin/mata-kuliah" element={<ManageCourses />} />
              <Route path="/admin/ujian" element={<ManageExams />} />
              <Route path="/admin/pengumuman" element={<ManageAnnouncements />} />
              <Route path="/admin/pengaturan-akademik" element={<ManageAcademicSettings />} />
              <Route path="/admin/pengaturan" element={<Navigate to="/admin/pengaturan-akademik" replace />} />
              <Route path="/admin/prodi" element={<Navigate to="/admin/pengaturan-akademik" replace />} />
              <Route path="/admin/libur" element={<Navigate to="/admin/pengaturan-akademik" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </NotificationsProvider>
  )
}
