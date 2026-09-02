import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { CampusProvider } from './context/CampusContext.jsx'
import './index.css'
import './lib/firebaseClient.js'
import { registerSW } from 'virtual:pwa-register'

// Dalam mode pengembangan (dev), nonaktifkan & bersihkan Service Worker agar selalu live update dari Vite
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })
} else {
  // Mode produksi: Otomatis refresh & aktifkan versi deploy baru
  // Saat SW baru mengambil alih (controllerchange), reload paksa agar
  // chunk hash lama tidak bercampur dengan hash baru -> cegah TypeError M_ID / undefined
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // SW baru sudah siap — langsung aktifkan tanpa tanya user
      updateSW(true)
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Deteksi controller baru (SW baru sudah skipWaiting + clientsClaim)
      // -> reload sekali agar semua chunk fresh dari cache baru
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <CampusProvider>
          <App />
        </CampusProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
