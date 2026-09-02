import { useState, useEffect } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { FormSelect } from '../../FormSelect'
import { ROOM_TYPES, DEFAULT_FACILITIES } from '../../../lib/roomUtils'

export function AddEditRoomModal({
  open,
  onClose,
  editingRoom,
  onSave,
  busy,
}) {
  const [namaRuang, setNamaRuang] = useState('')
  const [aliases, setAliases] = useState('')
  const [gedung, setGedung] = useState('')
  const [lantai, setLantai] = useState(1)
  const [kapasitas, setKapasitas] = useState(40)
  const [tipeRuang, setTipeRuang] = useState('kelas')
  const [petunjukArah, setPetunjukArah] = useState('')
  const [selectedFacilities, setSelectedFacilities] = useState([
    'AC Ruangan',
    'Proyektor LCD',
    'Stopkontak Meja',
    'Papan Tulis Whiteboard',
    'WiFi Kampus / Eduroam',
  ])

  useEffect(() => {
    if (editingRoom) {
      // oxlint-disable-next-line react/set-state-in-effect
      setNamaRuang(editingRoom.namaRuang || '')
      // oxlint-disable-next-line react/set-state-in-effect
      setAliases(Array.isArray(editingRoom.aliases) ? editingRoom.aliases.join(', ') : '')
      // oxlint-disable-next-line react/set-state-in-effect
      setGedung(editingRoom.gedung || '')
      // oxlint-disable-next-line react/set-state-in-effect
      setLantai(editingRoom.lantai || 1)
      // oxlint-disable-next-line react/set-state-in-effect
      setKapasitas(editingRoom.kapasitas || 40)
      // oxlint-disable-next-line react/set-state-in-effect
      setTipeRuang(editingRoom.tipeRuang || 'kelas')
      // oxlint-disable-next-line react/set-state-in-effect
      setPetunjukArah(editingRoom.petunjukArah || '')
      // oxlint-disable-next-line react/set-state-in-effect
      setSelectedFacilities(
        Array.isArray(editingRoom.fasilitas) && editingRoom.fasilitas.length > 0
          ? editingRoom.fasilitas
          : DEFAULT_FACILITIES.slice(0, 4),
      )
    } else {
      // oxlint-disable-next-line react/set-state-in-effect
      setNamaRuang('')
      // oxlint-disable-next-line react/set-state-in-effect
      setAliases('')
      // oxlint-disable-next-line react/set-state-in-effect
      setGedung('Gedung Utama')
      // oxlint-disable-next-line react/set-state-in-effect
      setLantai(1)
      // oxlint-disable-next-line react/set-state-in-effect
      setKapasitas(40)
      // oxlint-disable-next-line react/set-state-in-effect
      setTipeRuang('kelas')
      // oxlint-disable-next-line react/set-state-in-effect
      setPetunjukArah('')
      // oxlint-disable-next-line react/set-state-in-effect
      setSelectedFacilities([
        'AC Ruangan',
        'Proyektor LCD',
        'Stopkontak Meja',
        'Papan Tulis Whiteboard',
      ])
    }
  }, [editingRoom, open])

  // Escape key handler
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, busy, onClose])

  if (!open) return null

  function toggleFacility(item) {
    setSelectedFacilities((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item],
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!namaRuang.trim()) return

    const parsedAliases = aliases
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    onSave({
      namaRuang: namaRuang.trim(),
      aliases: parsedAliases,
      gedung: gedung.trim() || 'Gedung Kampus',
      lantai: Number(lantai) || 1,
      kapasitas: Number(kapasitas) || 40,
      tipeRuang,
      petunjukArah: petunjukArah.trim(),
      fasilitas: selectedFacilities,
      aktif: true,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low dark:border-outline-variant/15 overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-900 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs backdrop-blur-md">
              <Icon name={editingRoom ? 'edit' : 'meeting_room'} size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  {editingRoom ? `Edit Ruangan (${editingRoom.namaRuang})` : 'Tambah Ruangan Baru'}
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-white/25 shadow-2xs backdrop-blur-md">
                  {editingRoom ? 'Update Ruang' : 'Master Denah'}
                </span>
              </div>
              <p className="text-[11.5px] text-white/80 font-medium truncate mt-0.5">
                Konfigurasi lokasi gedung, lantai, dan petunjuk arah resmi mahasiswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 tablet:p-6 space-y-4">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            {/* KIRI: Identitas Ruang & Lokasi Fisik */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Nama / Nomor Ruangan *
                </label>
                <input
                  type="text"
                  value={namaRuang}
                  onChange={(e) => setNamaRuang(e.target.value)}
                  placeholder="mis. Ruang Kelas 4-A / Lab 2"
                  required
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Gedung Kampus *
                </label>
                <input
                  type="text"
                  value={gedung}
                  onChange={(e) => setGedung(e.target.value)}
                  placeholder="mis. Gedung Siti Halimah / Gedung A"
                  required
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Posisi Lantai *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={lantai}
                    onChange={(e) => setLantai(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Kapasitas (Mhs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={kapasitas}
                    onChange={(e) => setKapasitas(Number(e.target.value))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Tipe Ruangan
                </label>
                <FormSelect
                  value={tipeRuang}
                  onChange={setTipeRuang}
                  options={ROOM_TYPES}
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Alias / Variasi Penulisan di Jadwal (Koma)
                </label>
                <input
                  type="text"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  placeholder="mis. R.4-A, Kelas 4A, 4A"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                />
              </div>
            </div>

            {/* KANAN: Petunjuk Arah & Fasilitas */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Petunjuk Arah Mahasiswa
                </label>
                <textarea
                  rows={4}
                  value={petunjukArah}
                  onChange={(e) => setPetunjukArah(e.target.value)}
                  placeholder="mis. Masuk lobi depan Gedung Halimah, naik tangga sayap kanan ke Lantai 2, ruangan berada di samping ruang dosen."
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3 text-body-xs text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-2">
                  Fasilitas Ruangan
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_FACILITIES.map((f) => {
                    const active = selectedFacilities.includes(f)
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFacility(f)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30 shadow-2xs'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant/70 hover:border-primary/40'
                        }`}
                      >
                        <Icon name={active ? 'check' : 'add'} size={12} />
                        <span>{f}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-outline-variant/15 mt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="rounded-full px-5 py-2 font-bold shadow-xs text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
            >
              <Icon name="save" size={17} className="mr-1.5" />
              {editingRoom ? 'Simpan Perubahan' : 'Tambah Ruangan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
