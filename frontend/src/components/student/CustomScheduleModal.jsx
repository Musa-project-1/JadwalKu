import { useState, useMemo } from 'react'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:max-h-[95vh] overflow-hidden">
        {/* Drag handle for mobile */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Icon name="star" size={24} />
            </div>
            <div>
              <h3 className="text-title-lg font-bold text-on-surface">Atur Jadwal Kustom Saya</h3>
              <p className="text-body-xs text-on-surface-variant">
                Pilih mata kuliah & kelas dari berbagai semester (KRS Mandiri / Mengulang)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Sticky Stats & Quick Actions Bar */}
        <div className="bg-surface-container/40 px-5 py-3 border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-body-xs font-bold border border-primary/20">
              <Icon name="check_circle" size={14} />
              <span>{selectedIds.size} Kelas Terpilih</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-body-xs font-bold border border-indigo-500/20">
              <Icon name="school" size={14} />
              <span>Total Beban: {totalSks} SKS</span>
            </span>
            {selectedClashMap.size > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-error/10 text-error px-3 py-1 text-body-xs font-bold border border-error/20">
                <Icon name="warning" size={14} />
                <span>Ada Bentrok Waktu</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFromCurrentPackage}
              className="inline-flex items-center gap-1 text-body-xs font-bold text-primary hover:underline cursor-pointer"
              title="Pilih seluruh jadwal sesuai semester dan prodi Anda saat ini"
            >
              <Icon name="content_copy" size={14} />
              <span>Salin Paket Sem. {currentSemester}</span>
            </button>
            <span className="text-outline-variant/40">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-body-xs font-bold text-on-surface-variant hover:text-error cursor-pointer"
            >
              <span>Bersihkan</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0 bg-surface-container-lowest dark:bg-surface-container-low">
          <div className="relative sm:col-span-1">
            <Icon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Cari MK, kode, dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 py-1.5 pl-8 pr-3 text-body-xs font-medium text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <FormSelect
            value={prodiFilter}
            onChange={setProdiFilter}
            options={prodiOptions}
          />

          <FormSelect
            value={semesterFilter}
            onChange={setSemesterFilter}
            options={semesterOptions}
          />
        </div>

        {/* List of Schedules */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-outline-variant/10">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2">
              <Icon name="search_off" size={36} className="mx-auto text-outline-variant" />
              <p className="text-body-sm font-semibold">Tidak ada jadwal yang cocok dengan filter</p>
              <p className="text-body-xs">Coba ubah kata kunci pencarian atau filter program studi.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isChecked = selectedIds.has(item.id)
              const course = courseMap.get(item.kodeMK)
              const clashWarning = selectedClashMap.get(item.id)
              const ct = getClassType(item.tipeKelas)

              return (
                <div
                  key={item.id}
                  onClick={() => toggleOne(item.id)}
                  className={`pt-2.5 first:pt-0 flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-xs'
                      : 'border-transparent hover:bg-surface-container-low/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div
                    className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer shrink-0"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-label-caps font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                          {item.kodeMK}
                        </span>
                        <span className="font-bold text-body-sm text-on-surface">
                          {course?.namaMK || item.kodeMK}
                        </span>
                      </div>
                      <span className="shrink-0 text-label-caps font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {course?.sks || 2} SKS
                      </span>
                    </div>

                    <p className="text-body-xs text-on-surface-variant flex items-center gap-1">
                      <Icon name="person" size={13} className="text-secondary shrink-0" />
                      <span>{course?.dosen || 'Dosen belum ditentukan'}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-body-xs text-on-surface-variant pt-0.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                        <Icon name="schedule" size={13} className="text-primary" />
                        <span>{item.hari}, {item.jamMulai} - {item.jamSelesai}</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="meeting_room" size={13} />
                        <span>{formatRuang(item.ruang, item.tipeKelas)}</span>
                      </span>
                      <span>·</span>
                      <span>{item.prodi} (Sem. {item.semester})</span>
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-bold ${TONE_CLASSES[ct.tone] || ''}`}>
                        <span className={`h-1 w-1 rounded-full ${TONE_DOT_CLASSES[ct.tone] || ''}`} />
                        {ct.label}
                      </span>
                    </div>

                    {isChecked && clashWarning && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-error/10 border border-error/20 p-1.5 text-[11px] font-semibold text-error mt-1 animate-fade-in">
                        <Icon name="warning" size={13} className="shrink-0" />
                        <span>{clashWarning}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-4 border-t border-outline-variant/15 bg-surface-container/20 shrink-0">
          <div className="text-body-xs text-on-surface-variant">
            {selectedIds.size > 0 ? (
              <span><strong>{selectedIds.size}</strong> kelas terpilih ({totalSks} SKS)</span>
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

