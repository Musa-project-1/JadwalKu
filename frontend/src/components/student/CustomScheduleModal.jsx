import { useState, useMemo, useEffect } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { FormSelect } from '../FormSelect'
import { formatRuang } from '../../lib/scheduleUtils'
import { getClassType, TONE_CLASSES, TONE_DOT_CLASSES } from '../../lib/classTypes'

export function CustomScheduleModal({
  isOpen,
  onClose,
  allSchedules = [],
  courses = [],
  currentProgram,
  currentSemester,
  currentCustomIds = [],
  onSave,
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(currentCustomIds))
  const [search, setSearch] = useState('')
  const [prodiFilter, setProdiFilter] = useState(currentProgram || '')
  const [semesterFilter, setSemesterFilter] = useState('')

  // Support ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose?.()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Map courses for lookup
  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      if (c.kodeMK) map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // Get available Prodis
  const prodiOptions = useMemo(() => {
    const set = new Set(['Informatika', 'Bisnis Digital', 'Arsitektur', 'Teknik Sipil', 'Kewirausahaan'])
    allSchedules.forEach((s) => {
      if (s.prodi) set.add(s.prodi)
    })
    return [{ value: '', label: 'Semua Program Studi' }, ...[...set].sort().map((p) => ({ value: p, label: p }))]
  }, [allSchedules])

  // Semester options
  const semesterOptions = [
    { value: '', label: 'Semua Semester' },
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
    { value: '7', label: 'Semester 7' },
    { value: '8', label: 'Semester 8' },
  ]

  // Filtered schedules
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allSchedules.filter((s) => {
      if (prodiFilter && s.prodi !== prodiFilter) return false
      if (semesterFilter && Number(s.semester) !== Number(semesterFilter)) return false
      if (!q) return true

      const course = courseMap.get(s.kodeMK)
      const matchStr = `${s.kodeMK} ${course?.namaMK || ''} ${course?.dosen || ''} ${s.prodi} ${s.ruang || ''} ${s.hari}`.toLowerCase()
      return matchStr.includes(q)
    })
  }, [allSchedules, prodiFilter, semesterFilter, search, courseMap])

  // Total SKS Calculation
  const totalSks = useMemo(() => {
    let sum = 0
    const countedCourseCodes = new Set()
    for (const id of selectedIds) {
      const entry = allSchedules.find((s) => s.id === id)
      if (entry && !countedCourseCodes.has(entry.kodeMK)) {
        countedCourseCodes.add(entry.kodeMK)
        const course = courseMap.get(entry.kodeMK)
        sum += Number(course?.sks || 2)
      }
    }
    return sum
  }, [selectedIds, allSchedules, courseMap])

  // Clash detector among selected schedules
  const selectedClashMap = useMemo(() => {
    const map = new Map()
    const selectedList = allSchedules.filter((s) => selectedIds.has(s.id))
    for (let i = 0; i < selectedList.length; i++) {
      for (let j = i + 1; j < selectedList.length; j++) {
        const a = selectedList[i]
        const b = selectedList[j]
        if (a.hari === b.hari) {
          const [aStartH, aStartM] = String(a.jamMulai).split(':').map(Number)
          const [aEndH, aEndM] = String(a.jamSelesai).split(':').map(Number)
          const [bStartH, bStartM] = String(b.jamMulai).split(':').map(Number)
          const [bEndH, bEndM] = String(b.jamSelesai).split(':').map(Number)

          const aStart = aStartH * 60 + aStartM
          const aEnd = aEndH * 60 + aEndM
          const bStart = bStartH * 60 + bStartM
          const bEnd = bEndH * 60 + bEndM

          if (aStart < bEnd && bStart < aEnd) {
            map.set(a.id, `Bentrok jam dengan ${b.kodeMK} (${b.jamMulai}-${b.jamSelesai})`)
            map.set(b.id, `Bentrok jam dengan ${a.kodeMK} (${a.jamMulai}-${a.jamSelesai})`)
          }
        }
      }
    }
    return map
  }, [selectedIds, allSchedules])

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCopyFromCurrentPackage() {
    const packageIds = allSchedules
      .filter((s) => s.prodi === currentProgram && Number(s.semester) === Number(currentSemester))
      .map((s) => s.id)
    setSelectedIds(new Set(packageIds))
  }

  function handleClearAll() {
    setSelectedIds(new Set())
  }

  function handleSave() {
    onSave([...selectedIds])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-schedule-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] tablet:max-h-[88vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden"
      >
        {/* Header - Golden Amber Gradient Hero Header */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-amber-900/95 via-amber-800 to-orange-900 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
                <Icon name="star" size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 id="custom-schedule-title" className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                    Atur Jadwal Kustom Saya
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                    KRS Mandiri
                  </span>
                </div>
                <p className="text-body-xs text-white/80 font-medium truncate">
                  Pilih mata kuliah & kelas dari berbagai semester (KRS Mandiri / Mengulang / Semester Pendek)
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </header>

        {/* Sticky Stats & Quick Actions Bar */}
        <div className="bg-surface-container-low/60 dark:bg-surface-container-high/30 px-4 tablet:px-6 py-3 border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-3 py-1 text-body-xs font-extrabold border border-emerald-500/30 shadow-2xs">
              <Icon name="check_circle" size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{selectedIds.size} Kelas Terpilih</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 px-3 py-1 text-body-xs font-extrabold border border-indigo-500/30 shadow-2xs">
              <Icon name="school" size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>Total Beban: {totalSks} SKS</span>
            </span>
            {selectedClashMap.size > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-error/15 text-error px-3 py-1 text-body-xs font-extrabold border border-error/30 animate-pulse shadow-2xs">
                <Icon name="warning" size={15} />
                <span>Ada Bentrok Waktu ({selectedClashMap.size / 2 || selectedClashMap.size} sesi)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyFromCurrentPackage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-body-xs font-extrabold border border-amber-500/30 transition-all cursor-pointer shadow-2xs"
              title="Pilih seluruh jadwal sesuai semester dan prodi Anda saat ini"
            >
              <Icon name="content_copy" size={14} />
              <span>Salin Paket Sem. {currentSemester}</span>
            </button>
            <span className="text-outline-variant/40">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-error text-body-xs font-bold transition-colors cursor-pointer"
            >
              <span>Bersihkan</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-outline-variant/15 grid grid-cols-1 tablet:grid-cols-12 gap-2.5 shrink-0 bg-surface-container-lowest dark:bg-surface-container-low">
          <div className="relative tablet:col-span-6">
            <Icon
              name="search"
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Cari mata kuliah, kode MK, nama dosen, atau ruangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 py-2 pl-10 pr-3 text-body-xs font-medium text-on-surface focus:border-amber-600 focus:outline-none dark:bg-surface-container-high/40 shadow-2xs"
            />
          </div>

          <div className="tablet:col-span-3">
            <FormSelect
              value={prodiFilter}
              onChange={setProdiFilter}
              options={prodiOptions}
            />
          </div>

          <div className="tablet:col-span-3">
            <FormSelect
              value={semesterFilter}
              onChange={setSemesterFilter}
              options={semesterOptions}
            />
          </div>
        </div>

        {/* List of Schedules - 2-Column Responsive Card Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 tablet:p-5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant space-y-3 max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-container text-on-surface-variant mx-auto shadow-2xs">
                <Icon name="search_off" size={36} />
              </div>
              <h4 className="text-body-md font-bold text-on-surface">Tidak ada jadwal yang cocok</h4>
              <p className="text-body-xs text-on-surface-variant leading-relaxed">
                Coba ubah kata kunci pencarian atau ganti filter program studi dan semester.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
              {filtered.map((item) => {
                const isChecked = selectedIds.has(item.id)
                const course = courseMap.get(item.kodeMK)
                const clashWarning = selectedClashMap.get(item.id)
                const ct = getClassType(item.tipeKelas)

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleOne(item.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? clashWarning
                          ? 'border-error/40 bg-error/10 dark:bg-error/15 ring-2 ring-error/30 shadow-xs'
                          : 'border-amber-600/50 bg-amber-500/10 dark:bg-amber-950/30 ring-2 ring-amber-500/30 shadow-xs'
                        : 'border-outline-variant/25 bg-surface-container-lowest hover:bg-surface-container-low/70 dark:bg-surface-container-low'
                    }`}
                  >
                    {/* Custom Styled Checkbox */}
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                        isChecked
                          ? clashWarning
                            ? 'border-error bg-error text-white'
                            : 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                          : 'border-outline-variant bg-surface-container'
                      }`}
                    >
                      {isChecked && <Icon name="check" size={14} />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                              {item.kodeMK}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.2 text-[10px] font-bold ${TONE_CLASSES[ct.tone] || ''}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT_CLASSES[ct.tone] || ''}`} />
                              {ct.label}
                            </span>
                            <span className="text-[10.5px] font-bold text-on-surface-variant">
                              {item.prodi} · Sem {item.semester}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-body-sm text-on-surface leading-snug truncate">
                            {course?.namaMK || item.kodeMK}
                          </h4>
                        </div>

                        <span className="shrink-0 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 rounded-xl shadow-2xs">
                          {course?.sks || 2} SKS
                        </span>
                      </div>

                      <p className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1.5 truncate">
                        <Icon name="person" size={14} className="text-secondary shrink-0" />
                        <span>{course?.dosen || 'Dosen belum ditentukan'}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/15">
                        <span className="inline-flex items-center gap-1 font-bold text-on-surface">
                          <Icon name="schedule" size={14} className="text-primary shrink-0" />
                          <span>{item.hari}, {item.jamMulai} - {item.jamSelesai}</span>
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Icon name="meeting_room" size={14} className="shrink-0" />
                          <span>{formatRuang(item.ruang, item.tipeKelas)}</span>
                        </span>
                      </div>

                      {isChecked && clashWarning && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-error/15 border border-error/30 p-2 text-[11px] font-bold text-error mt-1.5 animate-pulse">
                          <Icon name="warning" size={14} className="shrink-0" />
                          <span className="truncate">{clashWarning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <div className="text-body-xs text-on-surface-variant font-medium">
            {selectedIds.size > 0 ? (
              <span><strong>{selectedIds.size}</strong> kelas terpilih (<strong className="text-on-surface">{totalSks} SKS</strong>)</span>
            ) : (
              <span>Belum ada kelas yang dipilih</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="button" onClick={handleSave} className="font-bold">
              <Icon name="check" size={18} className="mr-1" />
              Terapkan Jadwal Kustom
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
