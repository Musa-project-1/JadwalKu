import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import Notifications from './pages/student/Notifications'
import { NotificationsProvider } from './context/NotificationsContext'
import Exams from './pages/student/Exams'
import Home from './pages/student/Home'
import Settings from './pages/student/Settings'
import Tasks from './pages/student/Tasks'
import WeeklySchedule from './pages/student/WeeklySchedule'
import Intro from './pages/student/Intro'
import Onboarding, { ProdiStep, SemesterStep } from './pages/student/Onboarding'
import Search from './pages/student/Search'
import About from './pages/student/About'
import ChangeHistory from './pages/student/ChangeHistory'
import ExportShare from './pages/student/ExportShare'
import { getItem, STORAGE_KEYS } from './lib/storage'
import { RequireAdmin } from './components/admin/RequireAdmin'
import { AdminLayout } from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import UploadImport from './pages/admin/UploadImport'
import ManualEntry from './pages/admin/ManualEntry'
import ManageCourses from './pages/admin/ManageCourses'
import ManageExams from './pages/admin/ManageExams'
import ManageProdi from './pages/admin/ManageProdi'
import ManageHolidays from './pages/admin/ManageHolidays'

function RequireOnboarding({ children }) {
  const done = getItem(STORAGE_KEYS.onboardingDone, false)
  if (!done) {
    return <Navigate to="/intro" replace />
  }
  return children
}

export default function App() {
  return (
    <NotificationsProvider>
      <Routes>
      <Route path="/intro" element={<Intro />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/prodi" element={<ProdiStep />} />
      <Route path="/onboarding/semester" element={<SemesterStep />} />

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
            <Route path="/admin/upload" element={<UploadImport />} />
            <Route path="/admin/manual" element={<ManualEntry />} />
            <Route path="/admin/mata-kuliah" element={<ManageCourses />} />
            <Route path="/admin/ujian" element={<ManageExams />} />
            <Route path="/admin/prodi" element={<ManageProdi />} />
            <Route path="/admin/libur" element={<ManageHolidays />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationsProvider>
  )
}
