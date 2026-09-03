import { useState, useMemo, useEffect, useRef } from 'react'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { formatRuang } from '../../lib/scheduleUtils'
import { getClassType, TONE_CLASSES } from '../../lib/classTypes'
import { parseTimeToMinutes } from '../../lib/scheduleGridUtils'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

const SKS_LIMIT_OPTIONS = [18, 20, 22, 24]
const DAYS_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const DEFAULT_PLANS = [
  { id: 'plan-a', name: 'Plan A (Utama)', ids: [] },
  { id: 'plan-b', name: 'Plan B (Cadangan)', ids: [] },
  { id: 'plan-c', name: 'Plan C (Alternatif)', ids: [] },
]

export function KrsSimulatorModal({
  isOpen,
  onClose,
  allSchedules = [],
  courses = [],
  currentProgram = '',
  currentSemester = 1,
  onApplyToSchedule,
}) {
  const { language, t } = useApp()
  const modalRef = useRef(null)

  // 1. Multi-Plan state
  const [plans, setPlans] = useState(() => {
    const saved = getItem(STORAGE_KEYS.krsPlans, null)
    if (saved && Array.isArray(saved) && saved.length > 0) return saved
    return DEFAULT_PLANS
  })
  const [activePlanId, setActivePlanId] = useState('plan-a')
  const [maxSks, setMaxSks] = useState(24)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [prodiFilter, setProdiFilter] = useState(currentProgram || '')
  const [semesterFilter, setSemesterFilter] = useState(String(currentSemester) || '')
  const [copied, setCopied] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  // Active Plan Object
  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === activePlanId) || plans[0]
  }, [plans, activePlanId])

  const selectedIds = useMemo(() => {
    return new Set(activePlan.ids || [])
  }, [activePlan])

  // Save plans on change
  useEffect(() => {
    setItem(STORAGE_KEYS.krsPlans, plans)
  }, [plans])

  // Course map
  const courseMap = useMemo(() => {
    const map = new Map()
    courses.forEach((c) => {
      if (c?.kodeMK) map.set(c.kodeMK, c)
    })
    return map
  }, [courses])

  // Prodis available
  const prodiOptions = useMemo(() => {
    const set = new Set(['Informatika', 'Bisnis Digital', 'Arsitektur', 'Teknik Sipil', 'Kewirausahaan'])
    allSchedules.forEach((s) => {
      if (s.prodi) set.add(s.prodi)
    })
    return [{ value: '', label: 'Semua Prodi' }, ...[...set].sort().map((p) => ({ value: p, label: p }))]
  }, [allSchedules])

  // Filtered schedules pool
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

  // SKS Total Calculation
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

  // Selected schedule list & grouped by day
  const selectedScheduleList = useMemo(() => {
    return allSchedules.filter((s) => selectedIds.has(s.id))
  }, [allSchedules, selectedIds])

  const selectedGroupedByDay = useMemo(() => {
    const map = {}
    DAYS_ORDER.forEach((d) => {
      map[d] = []
    })
    selectedScheduleList.forEach((s) => {
      if (map[s.hari]) map[s.hari].push(s)
      else map[s.hari] = [s]
    })
    // Filter out empty days
    return DAYS_ORDER.filter((d) => map[d] && map[d].length > 0).map((d) => ({
      day: d,
      items: map[d].sort((a, b) => (a.jamMulai || '').localeCompare(b.jamMulai || '')),
    }))
  }, [selectedScheduleList])

  // Clash Detection
  const selectedClashMap = useMemo(() => {
    const map = new Map()
    const selectedList = selectedScheduleList
    for (let i = 0; i < selectedList.length; i++) {
      for (let j = i + 1; j < selectedList.length; j++) {
        const a = selectedList[i]
        const b = selectedList[j]
        if (a.hari === b.hari) {
          const aStart = parseTimeToMinutes(a.jamMulai)
          const aEnd = parseTimeToMinutes(a.jamSelesai)
          const bStart = parseTimeToMinutes(b.jamMulai)
          const bEnd = parseTimeToMinutes(b.jamSelesai)

          if (aStart < bEnd && bStart < aEnd) {
            const courseB = courseMap.get(b.kodeMK)?.namaMK || b.kodeMK
            const courseA = courseMap.get(a.kodeMK)?.namaMK || a.kodeMK
            map.set(a.id, `Bentrok dengan ${courseB} (${b.jamMulai}-${b.jamSelesai})`)
            map.set(b.id, `Bentrok dengan ${courseA} (${a.jamMulai}-${a.jamSelesai})`)
          }
        }
      }
    }
    return map
  }, [selectedScheduleList, courseMap])

  function toggleClassSelection(id) {
    const nextSet = new Set(selectedIds)
    if (nextSet.has(id)) nextSet.delete(id)
    else nextSet.add(id)

    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, ids: [...nextSet] } : p)),
    )
  }

  function removeClassSelection(id) {
    const nextSet = new Set(selectedIds)
    nextSet.delete(id)
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, ids: [...nextSet] } : p)),
    )
  }

  function handleCopyFromCurrentPackage() {
    const packageIds = allSchedules
      .filter((s) => s.prodi === currentProgram && Number(s.semester) === Number(currentSemester))
      .map((s) => s.id)
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, ids: packageIds } : p)),
    )
  }

  function handleClearActivePlan() {
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, ids: [] } : p)),
    )
  }

  function handleCopySiakadFormat() {
    const selectedList = selectedScheduleList
    if (selectedList.length === 0) return

    const lines = [
      `=== RENCANA KRS (${activePlan.name}) - Total: ${totalSks} SKS ===`,
      `Program Studi: ${currentProgram} · Semester ${currentSemester}`,
      '',
    ]

    selectedList.forEach((entry, idx) => {
      const course = courseMap.get(entry.kodeMK)
      const nama = course?.namaMK || entry.kodeMK
      const sks = course?.sks || 2
      const ruang = formatRuang(entry.ruang, entry.tipeKelas)
      lines.push(`${idx + 1}. [${entry.kodeMK}] ${nama} (${sks} SKS)`)
      lines.push(`   Kelas: ${entry.tipeKelas || 'K1'} | Hari: ${entry.hari}, ${entry.jamMulai}-${entry.jamSelesai} | Ruang: ${ruang}`)
      if (course?.dosen) lines.push(`   Dosen: ${course.dosen}`)
      lines.push('')
    })

    const fullText = lines.join('\n')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleApplyToSchedule() {
    if (onApplyToSchedule) {
      onApplyToSchedule([...selectedIds])
      setAppliedSuccess(true)
      setTimeout(() => {
        setAppliedSuccess(false)
        onClose()
      }, 1200)
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isOverLimit = totalSks > maxSks
  const remainingSks = Math.max(0, maxSks - totalSks)
  const sksPercentage = Math.min(100, Math.round((totalSks / maxSks) * 100))

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      {/* Modal Container */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] tablet:max-h-[88vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden"
      >
        {/* Header Modal */}
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-4 tablet:px-6 py-4 shrink-0 bg-gradient-to-r from-purple-900/90 via-purple-800 to-indigo-900 text-white shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
              <Icon name="science" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-title-sm tablet:text-title-md font-bold text-white tracking-tight truncate">
                  Simulator & Clash Tester KRS
                </h2>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                  War Ready
                </span>
              </div>
              <p className="text-body-xs text-white/80 font-medium truncate mt-0.5">
                Simulasi paket kelas paralel, hitung batas SKS, dan deteksi bentrok sebelum mengisi SIAKAD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* 2-Column Split Body (Left: Course Catalog & Filters, Right: Live Plan Workbench & Clashes) */}
        <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
          {/* LEFT COLUMN: Course Catalog & Search/Filters */}
          <div className="tablet:col-span-7 tablet:overflow-y-auto p-4 tablet:p-5 flex flex-col space-y-3.5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/30 dark:bg-surface-container-high/10 custom-scrollbar">
            {/* Search & Filter Bar */}
            <div className="space-y-2.5 p-3 rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/25 shadow-2xs">
              <div className="relative">
                <Icon name="search" size={16} className="absolute left-3 top-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari mata kuliah, kode, dosen, atau ruang..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high/40"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <select
                    value={prodiFilter}
                    onChange={(e) => setProdiFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer flex-1"
                  >
                    {prodiOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer"
                  >
                    <option value="">Semua Sem</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyFromCurrentPackage}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-300 text-[11px] font-bold border border-purple-500/30 transition-all cursor-pointer shadow-2xs"
                  >
                    + Paket Sem {currentSemester}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearActivePlan}
                    className="px-2.5 py-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            </div>

            {/* Course List Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                {language === 'en' ? `Class Catalog (${filtered.length} Available)` : `Katalog Kelas (${filtered.length} Tersedia)`}
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                {t ? t('krs.click_to_toggle') : 'Klik kartu untuk memilih / membatalkan'}
              </span>
            </div>

            {/* Schedule List */}
            <div className="space-y-2 flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 p-6">
                  <Icon name="search_off" size={36} className="opacity-40 mb-2" />
                  <p className="text-body-sm font-semibold">
                    {t ? t('krs.empty_catalog') : 'Tidak ada jadwal yang cocok dengan filter'}
                  </p>
                </div>
              ) : (
                filtered.map((entry) => {
                  const isSelected = selectedIds.has(entry.id)
                  const course = courseMap.get(entry.kodeMK)
                  const clashMsg = selectedClashMap.get(entry.id)
                  const classType = getClassType(entry.tipeKelas)

                  return (
                    <div
                      key={entry.id}
                      onClick={() => toggleClassSelection(entry.id)}
                      className={`relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? clashMsg
                            ? 'border-error bg-error/10 dark:bg-error/15 ring-2 ring-error/40 shadow-xs'
                            : 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/30 ring-2 ring-purple-500/40 shadow-xs'
                          : 'border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low/70 dark:bg-surface-container-low/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Custom Checkbox */}
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                            isSelected
                              ? clashMsg
                                ? 'border-error bg-error text-white'
                                : 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                              : 'border-outline-variant bg-surface-container'
                          }`}
                        >
                          {isSelected && <Icon name="check" size={14} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="rounded-md px-1.5 py-0.2 text-[10px] font-extrabold bg-surface-container text-on-surface border border-outline-variant/30">
                              {entry.kodeMK}
                            </span>
                            <span className={`rounded-md px-2 py-0.2 text-[10px] font-bold ${TONE_CLASSES[classType.tone]}`}>
                              {entry.tipeKelas || 'K1'}
                            </span>
                            <span className="text-[10.5px] font-bold text-on-surface-variant">
                              {entry.prodi} · Sem {entry.semester}
                            </span>
                          </div>

                          <h4 className="text-body-sm font-bold text-on-surface leading-tight truncate">
                            {course?.namaMK || entry.kodeMK}
                          </h4>

                          <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                            <strong className="text-on-surface font-bold">{entry.hari}</strong>, {entry.jamMulai} - {entry.jamSelesai} WIB · {formatRuang(entry.ruang, entry.tipeKelas)}
                          </p>

                          {course?.dosen && (
                            <p className="text-[10.5px] text-on-surface-variant/80 truncate mt-0.5">
                              {course.dosen}
                            </p>
                          )}

                          {isSelected && clashMsg && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-error bg-error/15 px-2.5 py-1 rounded-xl border border-error/30 animate-pulse">
                              <Icon name="warning" size={14} className="shrink-0" />
                              <span className="truncate">{clashMsg}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-surface-container font-extrabold text-[11px] text-on-surface border border-outline-variant/20">
                          {course?.sks || 2} SKS
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Simulation Workbench, SKS Gauge, Clashes & Summary */}
          <div className="tablet:col-span-5 tablet:overflow-y-auto p-4 tablet:p-5 flex flex-col space-y-4 bg-surface-container-lowest dark:bg-surface-container-low custom-scrollbar">
            {/* Plan Selector */}
            <div className="flex items-center p-1 rounded-2xl bg-surface-container-low dark:bg-surface-container-high border border-outline-variant/25 shrink-0">
              {plans.map((p) => {
                const isActive = p.id === activePlanId
                const count = (p.ids || []).length
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePlanId(p.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{p.name.replace(' (Utama)', '').replace(' (Cadangan)', '').replace(' (Alternatif)', '')}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* SKS Gauge & Limit Card */}
            <div className="p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 dark:bg-surface-container-high/20 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Batas Beban SKS:
                </span>
                <div className="flex items-center gap-1">
                  {SKS_LIMIT_OPTIONS.map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => setMaxSks(limit)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        maxSks === limit
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {limit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress & Quota */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-body-xs font-bold">
                  <span className={isOverLimit ? 'text-error font-black' : 'text-purple-700 dark:text-purple-300 font-extrabold'}>
                    Total: {totalSks} / {maxSks} SKS
                  </span>
                  <span className={`text-[11px] ${isOverLimit ? 'text-error font-extrabold' : 'text-on-surface-variant'}`}>
                    {isOverLimit ? `Lebih ${totalSks - maxSks} SKS!` : `Sisa Kuota: ${remainingSks} SKS`}
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/20">
                  <div
                    className={`h-full rounded-full transition-all duration-300 shadow-2xs ${
                      isOverLimit
                        ? 'bg-error'
                        : totalSks === maxSks
                        ? 'bg-emerald-500'
                        : 'bg-purple-600'
                    }`}
                    style={{ width: `${sksPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Clash Detection Hub */}
            {selectedClashMap.size > 0 ? (
              <div className="p-3.5 rounded-2xl border border-error/35 bg-error/10 dark:bg-error/15 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-error font-extrabold text-body-xs">
                  <Icon name="error" size={17} className="shrink-0 animate-bounce" />
                  <span>{t ? t('krs.clash_banner_title') : 'Bentrok Jadwal Terdeteksi'}</span>
                </div>
                <p className="text-[11px] text-error/90 leading-relaxed font-medium">
                  {t ? t('krs.clash_banner_desc') : 'Beberapa mata kuliah yang Anda pilih bertabrakan pada jam yang sama. Hapus salah satu jadwal di bawah agar KRS valid.'}
                </p>
              </div>
            ) : selectedScheduleList.length > 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-body-xs font-bold shadow-2xs">
                <Icon name="check_circle" size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Jadwal Aman (0 Bentrok Waktu)</span>
              </div>
            ) : null}

            {/* Selected Courses Grouped by Day */}
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Rencana Jadwal Terpilih ({selectedScheduleList.length} Kelas)
                </span>
                {selectedScheduleList.length > 0 && (
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    {totalSks} SKS
                  </span>
                )}
              </div>

              {selectedScheduleList.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 p-4">
                  <Icon name="event_busy" size={32} className="opacity-40 mb-1.5" />
                  <p className="text-body-xs font-semibold">
                    {t ? t('krs.empty_plan', { plan: activePlan.name }) : `Belum ada kelas yang dipilih untuk ${activePlan.name}`}
                  </p>
                  <p className="text-[11px] opacity-75 mt-0.5">
                    {t ? t('krs.empty_plan_sub') : 'Pilih kelas dari katalog di sisi kiri'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {selectedGroupedByDay.map(({ day, items }) => (
                    <div key={day} className="space-y-1.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-surface-container text-[10px] font-extrabold text-on-surface uppercase tracking-wider border border-outline-variant/20">
                        {day}
                      </span>
                      <div className="space-y-1.5">
                        {items.map((item) => {
                          const course = courseMap.get(item.kodeMK)
                          const hasClash = selectedClashMap.has(item.id)
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                                hasClash
                                  ? 'border-error/40 bg-error/10 text-error'
                                  : 'border-outline-variant/20 bg-surface-container-low/60 text-on-surface'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-body-xs font-bold truncate">
                                    {course?.namaMK || item.kodeMK}
                                  </span>
                                  <span className="text-[10px] font-extrabold opacity-75 shrink-0">
                                    ({course?.sks || 2} SKS)
                                  </span>
                                </div>
                                <p className="text-[10.5px] opacity-80 truncate">
                                  {item.jamMulai} - {item.jamSelesai} · {formatRuang(item.ruang, item.tipeKelas)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeClassSelection(item.id)}
                                aria-label="Hapus kelas"
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                              >
                                <Icon name="close" size={14} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Hub (Salin SIAKAD & Apply) */}
            <div className="pt-2 border-t border-outline-variant/20 space-y-2">
              <button
                type="button"
                onClick={handleCopySiakadText}
                disabled={selectedScheduleList.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-purple-500/35 bg-purple-500/10 hover:bg-purple-500/20 text-purple-900 dark:text-purple-200 text-body-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Icon name={copied ? 'check' : 'content_copy'} size={15} />
                <span>{copied ? (t ? t('krs.copied_siakad') : 'Tersalin untuk SIAKAD!') : (t ? t('krs.copy_siakad') : 'Salin Format SIAKAD')}</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToSchedule}
                disabled={selectedScheduleList.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 text-white text-body-xs font-bold shadow-xs hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Icon name="check_circle" size={16} />
                <span>{t ? t('krs.apply_to_schedule') : 'Terapkan ke Jadwal Utama'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
