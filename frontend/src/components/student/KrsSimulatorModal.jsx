import { useState, useMemo, useEffect, useRef } from 'react'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { formatRuang } from '../../lib/scheduleUtils'
import { parseTimeToMinutes } from '../../lib/scheduleGridUtils'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { KrsCoursePicker } from './krs/KrsCoursePicker'
import { KrsPlanSummary } from './krs/KrsPlanSummary'

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
      }, 1500)
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isOverLimit = totalSks > maxSks
  const remainingSks = Math.max(0, maxSks - totalSks)
  const sksPercentage = Math.min(100, (totalSks / maxSks) * 100)

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
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

        {/* 2-Column Split Body */}
        <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
          <KrsCoursePicker
            search={search}
            setSearch={setSearch}
            prodiFilter={prodiFilter}
            setProdiFilter={setProdiFilter}
            prodiOptions={prodiOptions}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            currentSemester={currentSemester}
            handleCopyFromCurrentPackage={handleCopyFromCurrentPackage}
            handleClearActivePlan={handleClearActivePlan}
            filtered={filtered}
            selectedIds={selectedIds}
            courseMap={courseMap}
            selectedClashMap={selectedClashMap}
            toggleClassSelection={toggleClassSelection}
            language={language}
            t={t}
          />

          <KrsPlanSummary
            plans={plans}
            activePlanId={activePlanId}
            setActivePlanId={setActivePlanId}
            activePlan={activePlan}
            maxSks={maxSks}
            setMaxSks={setMaxSks}
            sksLimitOptions={SKS_LIMIT_OPTIONS}
            totalSks={totalSks}
            remainingSks={remainingSks}
            isOverLimit={isOverLimit}
            sksPercentage={sksPercentage}
            selectedClashMap={selectedClashMap}
            selectedScheduleList={selectedScheduleList}
            selectedGroupedByDay={selectedGroupedByDay}
            courseMap={courseMap}
            removeClassSelection={removeClassSelection}
            handleCopySiakadFormat={handleCopySiakadFormat}
            copied={copied}
            handleApplyToSchedule={handleApplyToSchedule}
            appliedSuccess={appliedSuccess}
            t={t}
          />
        </div>
      </div>
    </div>
  )
}
