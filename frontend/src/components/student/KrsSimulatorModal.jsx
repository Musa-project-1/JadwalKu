import { useState, useMemo, useEffect, useRef } from 'react'
import { Icon } from '../Icon'
import { formatRuang } from '../../lib/scheduleUtils'
import { getClassType, TONE_CLASSES } from '../../lib/classTypes'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

const SKS_LIMIT_OPTIONS = [18, 20, 22, 24]

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

  // Clash Detection
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

  function toggleClassSelection(id) {
    const nextSet = new Set(selectedIds)
    if (nextSet.has(id)) nextSet.delete(id)
    else nextSet.add(id)

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
    const selectedList = allSchedules.filter((s) => selectedIds.has(s.id))
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden"
      >
        {/* Header Modal */}
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4 shrink-0 bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Icon name="science" size={22} />
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
                <span>Simulator & Clash Tester KRS</span>
                <span className="rounded-full bg-purple-500/15 text-purple-800 dark:text-purple-300 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-purple-500/25">
                  War Ready
                </span>
              </h2>
              <p className="text-body-xs text-on-surface-variant font-medium">
                Simulasi paket kelas paralel, hitung batas SKS, dan deteksi bentrok sebelum mengisi SIAKAD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Plan Selector & SKS Quota Bar */}
        <div className="border-b border-outline-variant/15 bg-surface-container/30 px-5 py-3 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Multi-Plan Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container border border-outline-variant/25">
              {plans.map((p) => {
                const isActive = p.id === activePlanId
                const count = (p.ids || []).length
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePlanId(p.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-white/25 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* SKS Limit Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                Batas Beban:
              </span>
              <div className="flex items-center gap-1">
                {SKS_LIMIT_OPTIONS.map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setMaxSks(limit)}
                    className={`px-2.5 py-1 rounded-lg text-body-xs font-bold transition-colors cursor-pointer ${
                      maxSks === limit
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {limit} SKS
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SKS Progress Bar */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-body-xs font-bold">
              <div className="flex items-center gap-2">
                <span className={isOverLimit ? 'text-error' : 'text-primary'}>
                  Total: {totalSks} / {maxSks} SKS
                </span>
                {isOverLimit ? (
                  <span className="text-[11px] text-error font-bold flex items-center gap-1">
                    <Icon name="warning" size={13} />
                    Melebihi batas maksimal {maxSks} SKS!
                  </span>
                ) : (
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    (Sisa kuota: {remainingSks} SKS)
                  </span>
                )}
              </div>
              {selectedClashMap.size > 0 && (
                <span className="text-[11px] font-bold text-error flex items-center gap-1">
                  <Icon name="error" size={14} />
                  Ada {selectedClashMap.size} jadwal bentrok waktu!
                </span>
              )}
            </div>

            <div className="h-2.5 w-full rounded-full bg-surface-container overflow-hidden p-0.5 border border-outline-variant/20">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
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

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-outline-variant/15 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Icon name="search" size={16} className="absolute left-3 top-2.5 text-on-surface-variant" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata kuliah, kode, dosen, atau ruang..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
              />
            </div>

            <select
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer"
            >
              <option value="">Semua Sem</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFromCurrentPackage}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[11px] font-bold border border-purple-500/25 transition-colors cursor-pointer"
            >
              + Ambil Paket Sem {currentSemester}
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

        {/* Schedule List Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <Icon name="search_off" size={40} className="opacity-40 mb-2" />
              <p className="text-body-sm font-semibold">Tidak ada jadwal yang cocok dengan filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((entry) => {
                const isSelected = selectedIds.has(entry.id)
                const course = courseMap.get(entry.kodeMK)
                const clashMsg = selectedClashMap.get(entry.id)
                const classType = getClassType(entry.tipeKelas)

                return (
                  <div
                    key={entry.id}
                    onClick={() => toggleClassSelection(entry.id)}
                    className={`relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? clashMsg
                          ? 'border-error bg-error/5 dark:bg-error/10 ring-2 ring-error/50'
                          : 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/30 ring-2 ring-purple-500/50 shadow-sm'
                        : 'border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container-low hover:border-outline-variant/40 dark:bg-surface-container/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                          isSelected
                            ? clashMsg
                              ? 'border-error bg-error text-white'
                              : 'border-purple-600 bg-purple-600 text-white'
                            : 'border-outline-variant bg-transparent'
                        }`}
                      >
                        {isSelected && <Icon name="check" size={14} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="rounded px-1.5 py-0.2 text-[10px] font-extrabold bg-surface-container text-on-surface">
                            {entry.kodeMK}
                          </span>
                          <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${TONE_CLASSES[classType.tone]}`}>
                            {entry.tipeKelas || 'K1'}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface-variant">
                            {entry.prodi} · Sem {entry.semester}
                          </span>
                        </div>

                        <h4 className="text-body-sm font-bold text-on-surface leading-tight truncate">
                          {course?.namaMK || entry.kodeMK}
                        </h4>

                        <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                          <strong>{entry.hari}</strong>, {entry.jamMulai} - {entry.jamSelesai} WIB · {formatRuang(entry.ruang, entry.tipeKelas)}
                        </p>

                        {course?.dosen && (
                          <p className="text-[10.5px] text-on-surface-variant/80 truncate mt-0.5">
                            {course.dosen}
                          </p>
                        )}

                        {isSelected && clashMsg && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-error bg-error/10 px-2.5 py-1 rounded-xl border border-error/25">
                            <Icon name="warning" size={13} className="shrink-0" />
                            <span className="truncate">{clashMsg}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-surface-container font-extrabold text-[11px] text-on-surface">
                        {course?.sks || 2} SKS
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 px-5 py-3.5 bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySiakadFormat}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-900 dark:text-purple-300 text-body-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Salin daftar kode & kelas untuk kemudahan copy-paste ke SIAKAD"
            >
              <Icon name={copied ? 'check' : 'content_copy'} size={15} />
              <span>{copied ? 'Tersalin untuk SIAKAD!' : 'Salin Format SIAKAD'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-body-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleApplyToSchedule}
              disabled={selectedIds.size === 0 || isOverLimit}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white text-body-xs font-bold shadow-sm hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Icon name={appliedSuccess ? 'check' : 'rocket_launch'} size={16} />
              <span>{appliedSuccess ? 'Berhasil Diterapkan!' : `Terapkan ${activePlan.name}`}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

