import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Input } from '../../components/Input'
import { samplePrograms } from '../../data/samplePrograms'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useFirestore } from '../../hooks/useFirestore'
import { useApp } from '../../hooks/useApp'
import { deriveTahunAjaran, deriveTerm, expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'

function RoleSelection() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-md sm:p-lg">
      <div className="flex w-full max-w-[800px] flex-col items-center animate-fade-in">
        <header className="mb-xl text-center flex flex-col items-center">
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Logo JadwalKu"
            className="mb-4 h-16 w-16 drop-shadow-md transition-opacity duration-300 hover:opacity-90"
          />
          <h1 className="text-display font-bold font-sans tracking-[-0.02em] mb-1">
            <span className="text-on-surface">Jadwal</span>
            <span className="text-primary">Ku</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Pilih peran Anda untuk melanjutkan
          </p>
        </header>
        <div className="grid w-full grid-cols-1 gap-lg tablet:grid-cols-2">
          <div className="rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 flex flex-col transition-all duration-200 hover:shadow-md active:opacity-85 cursor-pointer group">
            <button
              type="button"
              onClick={() => navigate('/onboarding/wizard')}
              className="relative flex flex-col items-center justify-center rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] dark:bg-surface-container-low w-full h-full focus:outline-none cursor-pointer"
            >
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 transition-colors duration-300 ease-out group-hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:group-hover:bg-emerald-500/25">
                <Icon name="school" size={40} filled className="text-emerald-700 dark:text-emerald-300" />
              </div>
              <h2 className="mb-1 text-title-md font-bold text-on-surface transition-colors duration-300 group-hover:text-primary">
                Masuk sebagai Mahasiswa
              </h2>
              <p className="text-body-sm text-on-surface-variant font-medium max-w-[260px]">
                Akses jadwal kelas, ujian, dan informasi akademik
              </p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-primary opacity-60 transition-all duration-300 group-hover:opacity-100">
                <span>Lanjutkan</span>
                <Icon name="arrow_forward" size={15} />
              </div>
            </button>
          </div>

          <div className="rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 flex flex-col transition-all duration-200 hover:shadow-md active:opacity-85 cursor-pointer group">
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="relative flex flex-col items-center justify-center rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] dark:bg-surface-container-low w-full h-full focus:outline-none cursor-pointer"
            >
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 ease-out group-hover:bg-primary/20 dark:bg-primary/15 dark:text-primary dark:group-hover:bg-primary/25">
                <Icon name="admin_panel_settings" size={40} className="text-primary" />
              </div>
              <h2 className="mb-1 text-title-md font-bold text-on-surface transition-colors duration-300 group-hover:text-primary">
                Masuk sebagai Admin
              </h2>
              <p className="text-body-sm text-on-surface-variant font-medium max-w-[260px]">
                Kelola data jadwal, prodi, dan pengaturan kampus
              </p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-primary opacity-60 transition-all duration-300 group-hover:opacity-100">
                <span>Masuk Panel</span>
                <Icon name="arrow_forward" size={15} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getProdiMeta(nama) {
  const lower = String(nama || '').toLowerCase()
  if (lower.includes('informatika')) return { icon: 'computer', code: 'IF', color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10' }
  if (lower.includes('bisnis')) return { icon: 'trending_up', code: 'BD', color: 'text-blue-600 dark:text-blue-300 bg-blue-500/10' }
  if (lower.includes('sipil')) return { icon: 'construction', code: 'TS', color: 'text-amber-600 dark:text-amber-300 bg-amber-500/10' }
  if (lower.includes('arsitektur')) return { icon: 'architecture', code: 'AR', color: 'text-violet-600 dark:text-violet-300 bg-violet-500/10' }
  if (lower.includes('wirausaha')) return { icon: 'rocket_launch', code: 'KW', color: 'text-rose-600 dark:text-rose-300 bg-rose-500/10' }
  return { icon: 'school', code: (nama || 'MK').slice(0, 2).toUpperCase(), color: 'text-primary bg-primary/10' }
}

function getFakultasMeta(nama) {
  const lower = String(nama || '').toLowerCase()
  if (lower.includes('teknik')) return { icon: 'engineering', color: 'text-blue-600 dark:text-blue-300 bg-blue-500/10' }
  if (lower.includes('bisnis') || lower.includes('ekonomi')) return { icon: 'business_center', color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10' }
  if (lower.includes('arsitektur') || lower.includes('sipil')) return { icon: 'domain', color: 'text-amber-600 dark:text-amber-300 bg-amber-500/10' }
  return { icon: 'account_balance', color: 'text-violet-600 dark:text-violet-300 bg-violet-500/10' }
}



// ── Single-page Wizard B + all ──
export function OnboardingWizard() {
  const navigate = useNavigate()
  const { setProgram, setSemester: setSemesterContext, setFakultas } = useApp()
  const [searchParams] = useSearchParams()

  const { data: prodiDocs } = useFirestore('prodi')
  const { data: fakultasDocs } = useFirestore('fakultas')
  const { data: settingsDocs } = useFirestore('settings')
  const { data: allPublishedJadwal } = useFirestore('jadwal', [['status', '==', 'published']])
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const now = useMemo(() => new Date(), [])
  const calDoc = useMemo(() => settingsDocs.find((d) => d.id === 'academicCalendar'), [settingsDocs])
  const currentTA = useMemo(() => deriveTahunAjaran(now, calDoc), [now, calDoc])
  const currentTerm = useMemo(() => deriveTerm(now, calDoc), [now, calDoc])

  // Invite prefill ?fakultas=&prodi=&semester=&ta=&kampusId=
  const invitePrefill = useMemo(() => ({
    fakultasId: searchParams.get('fakultas') || searchParams.get('fakultasId') || null,
    fakultasNama: searchParams.get('fakultasNama') || null,
    prodi: searchParams.get('prodi') || searchParams.get('program') || null,
    semester: searchParams.get('semester') ? Number(searchParams.get('semester')) : null,
    ta: searchParams.get('ta') || searchParams.get('tahunAjaran') || null,
    kampusId: searchParams.get('kampusId') || null,
  }), [searchParams])

  const [searchFakultas, setSearchFakultas] = useState('')
  const [searchProdi, setSearchProdi] = useState('')
  const [fakultasId, setFakultasIdLocal] = useState(() => invitePrefill.fakultasId || getItem(STORAGE_KEYS.fakultasId, null))
  const [prodi, setProdiLocal] = useState(() => invitePrefill.prodi || getItem(STORAGE_KEYS.program, null))
  const [semester, setSemesterLocal] = useState(() => {
    const v = invitePrefill.semester ?? getItem(STORAGE_KEYS.semester, null)
    return Number.isInteger(v) && v > 0 ? v : null
  })
  const [taOverride, setTaOverride] = useState(() => invitePrefill.ta || getItem(STORAGE_KEYS.tahunAjaran, null))
  const [showTaPicker, setShowTaPicker] = useState(false)

  // Persist draft on change (progress persist #6)
  useEffect(() => { if (fakultasId) setItem(STORAGE_KEYS.fakultasId, fakultasId) }, [fakultasId])
  useEffect(() => { if (prodi) setItem(STORAGE_KEYS.program, prodi) }, [prodi])
  useEffect(() => { if (semester) setItem(STORAGE_KEYS.semester, semester) }, [semester])

  // Sync invite prefill after mount if URL has values but state empty
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    if (invitePrefill.fakultasId && !fakultasId) setFakultasIdLocal(invitePrefill.fakultasId)
    // oxlint-disable-next-line react/set-state-in-effect
    if (invitePrefill.prodi && !prodi) setProdiLocal(invitePrefill.prodi)
    // oxlint-disable-next-line react/set-state-in-effect
    if (invitePrefill.semester && !semester) setSemesterLocal(invitePrefill.semester)
    // oxlint-disable-next-line react/set-state-in-effect
    if (invitePrefill.ta && !taOverride) setTaOverride(invitePrefill.ta)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fakultas list
  const fakultasList = useMemo(() => {
    if (fakultasDocs.length > 0) {
      return fakultasDocs.map((f) => ({ id: f.id, nama: f.nama || f.id, singkatan: f.singkatan || '' }))
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
    }
    // derive from prodi fakultasNama distinct as fallback
    const set = new Map()
    prodiDocs.forEach((p) => {
      const fid = p.fakultasId || p.fakultasNama || null
      const nama = p.fakultasNama || p.fakultasId || null
      if (fid && nama && !set.has(fid)) set.set(fid, { id: fid, nama, singkatan: '' })
    })
    return [...set.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
  }, [fakultasDocs, prodiDocs])

  const filteredFakultas = useMemo(() => {
    if (!searchFakultas.trim()) return fakultasList
    const q = searchFakultas.toLowerCase()
    return fakultasList.filter((f) => f.nama.toLowerCase().includes(q) || String(f.singkatan || '').toLowerCase().includes(q))
  }, [fakultasList, searchFakultas])

  // Auto-skip if only 1 fakultas (#1)
  useEffect(() => {
    if (fakultasList.length === 1 && !fakultasId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setFakultasIdLocal(fakultasList[0].id)
    }
  }, [fakultasList, fakultasId])

  // Programs pool
  const programs = useMemo(() => {
    if (prodiDocs.length > 0) {
      return prodiDocs.map((p) => ({
        nama: p.nama,
        semesterMin: p.semesterMin ?? 1,
        semesterMax: p.semesterMax ?? 8,
        fakultasId: p.fakultasId ?? null,
        fakultasNama: p.fakultasNama ?? '',
      })).sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
    }
    return samplePrograms.map((p) => ({ ...p, fakultasId: null, fakultasNama: '' }))
  }, [prodiDocs])

  // Prodi filtered by fakultas + search + autoskip (#1)
  const filteredPrograms = useMemo(() => {
    let pool = programs
    if (fakultasId) pool = pool.filter((p) => p.fakultasId === fakultasId)
    if (searchProdi.trim()) {
      const q = searchProdi.toLowerCase()
      pool = pool.filter((p) => p.nama.toLowerCase().includes(q))
    }
    return pool
  }, [programs, fakultasId, searchProdi])

  useEffect(() => {
    if (filteredPrograms.length === 1 && !prodi) {
      // oxlint-disable-next-line react/set-state-in-effect
      setProdiLocal(filteredPrograms[0].nama)
    }
  }, [filteredPrograms, prodi])

  const selectedProgram = useMemo(() => programs.find((p) => p.nama === prodi) || null, [programs, prodi])

  const semesters = useMemo(() => {
    const min = selectedProgram?.semesterMin ?? 1
    const max = selectedProgram?.semesterMax ?? 8
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [selectedProgram])

  useEffect(() => {
    if (semester != null && !semesters.includes(semester)) {
      // oxlint-disable-next-line react/set-state-in-effect
      setSemesterLocal(null)
    }
  }, [semesters, semester])

  const expectedTA = useMemo(() => semester ? expectedTahunAjaranForSemester(semester, now, calDoc) : currentTA, [semester, now, calDoc, currentTA])
  const effectiveTA = taOverride || expectedTA

  const availableTAs = useMemo(() => {
    const set = new Set([currentTA, expectedTA])
    if (taOverride) set.add(taOverride)
    allPublishedJadwal.forEach((j) => { if (j.tahunAjaran) set.add(String(j.tahunAjaran)) })
    // next/prev
    const [y1, y2] = currentTA.split('/').map(Number)
    if (y1 && y2) {
      set.add(`${y1 - 1}/${y2 - 1}`)
      set.add(`${y2}/${y2 + 1}`)
    }
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [currentTA, expectedTA, taOverride, allPublishedJadwal])

  // Preview jadwal (#2)
  const preview = useMemo(() => {
    if (!prodi || !semester) return null
    const match = allPublishedJadwal.filter((j) =>
      j.prodi === prodi && Number(j.semester) === Number(semester) && String(j.tahunAjaran ?? expectedTA) === String(effectiveTA),
    )
    if (match.length === 0) return { count: 0, sks: 0, mks: [] }
    const courseMap = new Map((mataKuliah.length > 0 ? mataKuliah : []).map((c) => [c.kodeMK, c]))
    const uniq = new Map()
    match.forEach((j) => {
      if (!uniq.has(j.kodeMK)) uniq.set(j.kodeMK, courseMap.get(j.kodeMK) || { kodeMK: j.kodeMK, sks: 2 })
    })
    const sks = [...uniq.values()].reduce((s, c) => s + (Number(c.sks) || 2), 0)
    const mks = [...uniq.values()].slice(0, 3).map((c) => c.namaMK || c.kodeMK)
    return { count: match.length, sks, mks, totalMK: uniq.size }
  }, [prodi, semester, effectiveTA, expectedTA, allPublishedJadwal, mataKuliah])

  const progress = useMemo(() => {
    let done = 0
    if (fakultasList.length === 0 || fakultasId) done += 1
    if (prodi) done += 1
    if (semester) done += 1
    return Math.round((done / 3) * 100)
  }, [fakultasList.length, fakultasId, prodi, semester])

  function handleSave() {
    const fid = fakultasId
    const fnama = fakultasList.find((f) => f.id === fid)?.nama || getItem(STORAGE_KEYS.fakultasNama, null) || null
    flushSync(() => {
      if (setFakultas && fid) setFakultas(fid, fnama)
      setProgram(prodi)
      setSemesterContext(semester)
    })
    if (fid) setItem(STORAGE_KEYS.fakultasId, fid)
    if (fnama) setItem(STORAGE_KEYS.fakultasNama, fnama)
    setItem(STORAGE_KEYS.program, prodi)
    setItem(STORAGE_KEYS.semester, semester)
    setItem(STORAGE_KEYS.tahunAjaran, effectiveTA)
    setItem(STORAGE_KEYS.onboardingDone, true)
    navigate('/', { replace: true })
  }

  const canSave = Boolean(prodi && semester)

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-md sm:p-lg py-6">
      <div className="w-full max-w-[1100px] rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 animate-fade-in">
        <div className="w-full rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-5 sm:p-6 shadow-xs dark:bg-surface-container-low">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-caps font-bold text-primary tracking-wider">ONBOARDING</span>
              <span className="text-body-xs font-semibold text-on-surface-variant">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <h1 className="mt-3 text-headline-md font-bold text-on-surface">Siapkan Jadwalmu</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant font-medium">
              Fakultas → Prodi → Semester &amp; TA
              {currentTerm === 'libur' ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">Libur · TA {currentTA}</span>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{currentTerm === 'ganjil' ? 'Ganjil' : 'Genap'} · TA {currentTA}</span>
              )}
            </p>
            {(invitePrefill.prodi || invitePrefill.fakultasId) && (
              <p className="mt-1 text-body-xs font-medium text-primary">Invite prefill aktif — tinggal konfirmasi &amp; simpan.</p>
            )}
          </div>

          {/* 2-column: no vertical scroll, side-by-side */}
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5 items-start">

            {/* LEFT: Fakultas + Prodi */}
            <div className="flex flex-col gap-4 min-h-0">
          {/* Section 1: Fakultas */}
          {fakultasList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-300"><Icon name="account_balance" size={16} /></span>
                <h2 className="text-body-sm font-bold text-on-surface">Fakultas</h2>
                {fakultasId && <span className="ml-auto text-[11px] font-bold text-violet-600 dark:text-violet-300">Terpilih</span>}
              </div>
              {fakultasList.length > 4 && (
                <div className="mb-2">
                  <Input placeholder="Cari fakultas..." value={searchFakultas} onChange={(e) => setSearchFakultas(e.target.value)} className="rounded-2xl text-body-sm" />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {filteredFakultas.map((f) => {
                  const meta = getFakultasMeta(f.nama)
                  const isSelected = fakultasId === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFakultasIdLocal(f.id)
                        const stillValid = programs.some((p) => p.nama === prodi && p.fakultasId === f.id)
                        if (prodi && !stillValid) setProdiLocal(null)
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all cursor-pointer ${isSelected ? 'border-primary/40 bg-primary/[0.06] dark:bg-primary/10 ring-1 ring-primary/20' : 'border-outline-variant/20 bg-surface-container-low/30 hover:border-outline-variant/40 dark:bg-surface-container-high/20'}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.color}`}><Icon name={meta.icon} size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-body-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{f.nama}</p>
                        {f.singkatan && <p className="text-[11px] font-medium text-on-surface-variant/60">{f.singkatan}</p>}
                      </div>
                      {isSelected ? <Icon name="check_circle" filled size={18} className="text-primary shrink-0" /> : <span className="h-3.5 w-3.5 rounded-full border border-outline-variant/30 shrink-0" />}
                    </button>
                  )
                })}
                {filteredFakultas.length === 0 && <p className="text-body-xs text-on-surface-variant text-center py-2">Tidak ada fakultas cocok.</p>}
              </div>
            </section>
          )}

          {/* Section 2: Prodi */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"><Icon name="school" size={16} /></span>
              <h2 className="text-body-sm font-bold text-on-surface">Jurusan / Prodi</h2>
              {prodi && <span className="ml-auto text-[11px] font-bold text-emerald-600 dark:text-emerald-300">Terpilih: {prodi}</span>}
            </div>
            {filteredPrograms.length > 4 && (
              <div className="mb-2">
                <Input placeholder="Cari prodi..." value={searchProdi} onChange={(e) => setSearchProdi(e.target.value)} className="rounded-2xl text-body-sm" />
              </div>
            )}
            <div className="space-y-2">
              {filteredPrograms.map((p) => {
                const meta = getProdiMeta(p.nama)
                const isSelected = prodi === p.nama
                return (
                  <button
                    key={p.nama}
                    type="button"
                    onClick={() => setProdiLocal(p.nama)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition-all cursor-pointer ${isSelected ? 'border-primary/40 bg-primary/[0.06] dark:bg-primary/10' : 'border-outline-variant/20 bg-surface-container-low/30 hover:border-outline-variant/40 hover:bg-surface-container-low/60 dark:bg-surface-container-high/20'}`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[13px] ${meta.color} ${isSelected ? 'ring-1 ring-primary/20' : ''}`}><Icon name={meta.icon} size={16} /></span>
                      <span className="min-w-0">
                        <p className={`text-body-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{p.nama}</p>
                        <p className="text-[11px] font-medium text-on-surface-variant/60">Semester {p.semesterMin}–{p.semesterMax}</p>
                      </span>
                    </span>
                    {isSelected ? <Icon name="check_circle" filled size={18} className="text-primary shrink-0" /> : <span className="h-3.5 w-3.5 rounded-full border border-outline-variant/30 shrink-0" />}
                  </button>
                )
              })}
              {filteredPrograms.length === 0 && (
                <p className="text-body-xs text-on-surface-variant text-center py-3">
                  {fakultasId ? 'Tidak ada prodi di fakultas ini.' : 'Belum ada data prodi.'}
                </p>
              )}
            </div>
          </section>
            </div>

            {/* RIGHT: Semester + Preview + TA override */}
            <div className="flex flex-col gap-4 min-h-0">
          {/* Section 3: Semester */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-300"><Icon name="calendar_month" size={16} /></span>
              <h2 className="text-body-sm font-bold text-on-surface">Semester &amp; TA</h2>
              {semester && <span className="ml-auto text-[11px] font-bold text-blue-600 dark:text-blue-300">Sem {semester} · TA {effectiveTA}</span>}
            </div>
            {!prodi && <p className="text-body-xs text-on-surface-variant mb-2">Pilih prodi dulu untuk melihat semester.</p>}
            {prodi && (
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {semesters.map((s) => {
                  const isSelected = semester === s
                  const isGanjil = s % 2 !== 0
                  const taForS = expectedTahunAjaranForSemester(s, now, calDoc)
                  const isCurrentTermSem = (currentTerm === 'ganjil' && isGanjil) || (currentTerm === 'genap' && !isGanjil)
                  const isExpected = taForS === effectiveTA
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemesterLocal(s)}
                      className={`flex flex-col items-center justify-center rounded-2xl border py-3.5 transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary text-on-primary shadow-md ring-2 ring-primary/40' : isCurrentTermSem ? 'border-primary/30 bg-primary/5 text-on-surface hover:bg-primary/10' : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'}`}
                    >
                      <span className="text-headline-sm font-bold leading-none mb-0.5">{s}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-on-surface-variant/70'}`}>{isGanjil ? 'Ganjil' : 'Genap'}</span>
                      <span className={`mt-0.5 text-[9px] font-bold tracking-wide ${isSelected ? 'text-white/70' : isExpected ? 'text-emerald-600 dark:text-emerald-300' : 'text-on-surface-variant/60'}`}>TA {taForS}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Preview (#2) */}
          {preview && prodi && semester && (
            <div className={`rounded-2xl border p-3.5 ${preview.count > 0 ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name={preview.count > 0 ? 'visibility' : 'info'} size={16} className={preview.count > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'} />
                <p className="text-body-xs font-bold text-on-surface">Preview Jadwal: {prodi} Sem {semester} · TA {effectiveTA}</p>
              </div>
              {preview.count > 0 ? (
                <>
                  <p className="text-body-sm font-semibold text-on-surface">{preview.totalMK} MK · {preview.sks} SKS · {preview.count} sesi/minggu</p>
                  <p className="text-body-xs text-on-surface-variant truncate">{preview.mks.join(' • ')}{preview.totalMK > 3 ? ' • …' : ''}</p>
                </>
              ) : (
                <p className="text-body-xs text-on-surface-variant">Belum ada jadwal untuk kombinasi ini — bisa tetap simpan, jadwal akan muncul setelah admin publish.</p>
              )}
            </div>
          )}

          {/* TA override (#3) */}
          {semester && (
            <div>
              {!showTaPicker ? (
                <button type="button" onClick={() => setShowTaPicker(true)} className="text-body-xs font-semibold text-primary hover:underline underline-offset-4">
                  Beda TA? ganti — sekarang TA {effectiveTA}
                </button>
              ) : (
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 dark:bg-surface-container-high/20 p-3">
                  <p className="text-body-xs font-bold text-on-surface mb-2">Pilih Tahun Ajaran ({semester % 2 === 0 ? 'Genap' : 'Ganjil'} auto: TA {expectedTA})</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTAs.map((ta) => (
                      <button
                        key={ta}
                        type="button"
                        onClick={() => { setTaOverride(ta); setShowTaPicker(false) }}
                        className={`rounded-full border px-3 py-1 text-body-xs font-bold transition-colors ${ta === effectiveTA ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:border-primary/40'}`}
                      >
                        {ta} {ta === expectedTA ? '(auto)' : ''}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setShowTaPicker(false)} className="mt-2 text-body-xs font-semibold text-on-surface-variant hover:text-primary">Tutup</button>
                </div>
              )}
            </div>
          )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/10 mt-3">
            <button type="button" onClick={() => navigate('/onboarding')} className="rounded-full px-4 py-1.5 text-body-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors">
              Kembali
            </button>
            <button type="button" disabled={!canSave} onClick={handleSave} className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-body-xs font-bold shadow-sm transition-all ${canSave ? 'bg-primary text-on-primary hover:bg-primary/90 hover:shadow' : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'}`}>
              <Icon name="check" size={16} />
              <span>Simpan &amp; Mulai</span>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] leading-none text-on-surface-variant/50">Fakultas, prodi &amp; semester bisa diubah di Pengaturan</p>
        </div>
      </div>
    </div>
  )
}

export default function Onboarding() {
  return <RoleSelection />
}
