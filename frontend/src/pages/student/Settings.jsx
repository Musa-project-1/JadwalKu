import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'

/**
 * Settings Route Page (`/pengaturan`)
 * 
 * DRY Refactor:
 * Menghindari duplikasi kode antara halaman penuh dan modal.
 * Saat pengguna mengakses URL `/pengaturan`, secara otomatis membuka modal
 * SettingsModal dan mengarahkan tampilan kembali ke halaman sebelumnya atau beranda.
 */
export default function Settings() {
  const navigate = useNavigate()
  const { openSettings } = useApp()

  useEffect(() => {
    openSettings('appearance')
    // Arahkan kembali ke history sebelumnya agar tidak ada blank screen di background
    navigate(-1)
  }, [openSettings, navigate])

  return null
}
