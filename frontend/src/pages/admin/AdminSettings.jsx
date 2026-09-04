import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'

/**
 * AdminSettings Route Controller (`/admin/pengaturan`)
 * 
 * DRY Controller (Mirrors student /pengaturan):
 * Membuka modal pengaturan admin (AdminSettingsModal) dan mengarahkan kembali
 * history agar tidak terjadi blank screen atau rendering halaman fisik yang redundan.
 */
export default function AdminSettings() {
  const navigate = useNavigate()
  const { openAdminSettings } = useApp()

  useEffect(() => {
    openAdminSettings('appearance')
    navigate(-1)
  }, [openAdminSettings, navigate])

  return null
}
