import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { FormSelect } from '../FormSelect'
import { classTypeLabel, CLASS_TYPE_CODES } from '../../lib/classTypes'
import { parseUniversalFile, applyColumnMapping } from '../../lib/universalParser'
import { validateScheduleEntry, findConflicts } from '../../lib/uploadValidator'

const PRESET_STORAGE_KEY = 'jadwalku_import_mapping_preset'

const SYSTEM_FIELDS = [
  { key: 'hari', label: 'Hari', icon: 'calendar_today', aliases: ['hari', 'day', 'days'] },
  { key: 'jamRange', label: 'Rentang Jam (Mulai - Selesai)', icon: 'schedule', aliases: ['jam', 'waktu', 'time', 'sesi', 'jam kuliah', 'pukul'] },
  { key: 'jamMulai', label: 'Jam Mulai (opsional jika ada rentang)', icon: 'play_arrow', aliases: ['jam mulai', 'mulai', 'start', 'start time', 'waktu mulai'] },
  { key: 'jamSelesai', label: 'Jam Selesai', icon: 'stop', aliases: ['jam selesai', 'selesai', 'end', 'end time', 'waktu selesai'] },
  { key: 'namaMK', label: 'Mata Kuliah', icon: 'menu_book', aliases: ['nama mk', 'nama mata kuliah', 'mata kuliah', 'matkul', 'course', 'nama'] },
  { key: 'kodeMK', label: 'Kode MK', icon: 'tag', aliases: ['kode mk', 'kode', 'kode mata kuliah', 'kd mk', 'code'] },
  { key: 'dosen', label: 'Dosen Pengampu', icon: 'person', aliases: ['dosen', 'dosen pengampu', 'pengampu', 'lecturer', 'nama dosen'] },
  { key: 'ruang', label: 'Ruang Kuliah', icon: 'room', aliases: ['ruang', 'ruangan', 'room', 'lokasi', 'tempat'] },
  { key: 'tipeKelas', label: 'Tipe Kelas (K1/K2/Reguler/Online)', icon: 'label', aliases: ['tipe kelas', 'tipe', 'jenis kelas', 'mode', 'type', 'class type'] },
  { key: 'prodi', label: 'Program Studi', icon: 'school', aliases: ['prodi', 'program studi', 'jurusan', 'study program'] },
  { key: 'semester', label: 'Semester', icon: 'format_list_numbered', aliases: ['semester', 'sem', 'smt'] },
]

export function UniversalImportModal({
  open,
  onClose,
  onSave,
  prodiOptions = ['Informatika', 'Bisnis Digital', 'Arsitektur', 'Teknik Sipil', 'Kewirausahaan'],
  currentTA = '2025/2026',
  existingTAs = ['2025/2026', '2024/2025'],
}) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState('upload') // 'upload' | 'mapping' | 'preview'
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [progressState, setProgressState] = useState({ stage: '', progress: 0 })
  const [errorMsg, setErrorMsg] = useState('')

  // Global Batch Settings: Tahun Ajaran
  const [selectedTA, setSelectedTA] = useState(currentTA || '2025/2026')
  const [isCustomTA, setIsCustomTA] = useState(false)
  const [customTAInput, setCustomTAInput] = useState('')

  // State Step 2 (Mapping)
  const [rawHeaders, setRawHeaders] = useState([])
  const [rawRows, setRawRows] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [savePreset, setSavePreset] = useState(true)
  const [prodiDefault, setProdiDefault] = useState(prodiOptions[0] || 'Informatika')
  const [semesterDefault, setSemesterDefault] = useState(2)

  // State Step 3 (Preview & Inline Edit)
  const [parsedData, setParsedData] = useState({
    scheduleEntries: [],
    courses: [],
    exams: [],
    warnings: [],
  })
  const [editingRowId, setEditingRowId] = useState(null)
  const [busySaving, setBusySaving] = useState(false)

  // Reset modal state
  function resetModal() {
    setStep('upload')
    setFileName('')
    setErrorMsg('')
    setLoading(false)
    setRawHeaders([])
    setRawRows([])
    setColumnMapping({})
    setSelectedTA(currentTA || '2025/2026')
    setIsCustomTA(false)
    setCustomTAInput('')
    setParsedData({ scheduleEntries: [], courses: [], exams: [], warnings: [] })
  }

  useEffect(() => {
    if (!open) {
      resetModal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const effectiveTA = useMemo(() => {
    if (isCustomTA && customTAInput.trim()) return customTAInput.trim()
    return selectedTA || currentTA || '2025/2026'
  }, [isCustomTA, customTAInput, selectedTA, currentTA])

  const uniqueTAs = useMemo(() => {
    return Array.from(new Set([currentTA, ...existingTAs].filter(Boolean)))
  }, [currentTA, existingTAs])

  const taOptions = useMemo(() => {
    const list = uniqueTAs.map((ta) => ({
      value: ta,
      label: `TA ${ta} ${ta === currentTA ? '(Berjalan)' : ''}`,
      icon: 'calendar_today',
    }))
    list.push({
      value: '__NEW__',
      label: '+ Tambah TA Baru...',
      icon: 'add_circle',
    })
    return list
  }, [uniqueTAs, currentTA])

  // Smart Auto-Matching Column Headers
  const autoMatchedCount = useMemo(() => {
    let count = 0
    SYSTEM_FIELDS.forEach((field) => {
      if (columnMapping[field.key]) count++
    })
    return count
  }, [columnMapping])

  // Calculate Metrics in Step 3
  const previewMetrics = useMemo(() => {
    const entries = parsedData.scheduleEntries || []
    let valid = 0
    let review = 0
    let invalid = 0

    entries.forEach((e) => {
      const errs = validateScheduleEntry(e)
      const isLowConfidence = typeof e.confidence === 'number' && e.confidence < 80
      if (errs.length > 0) {
        invalid++
      } else if (isLowConfidence) {
        review++
      } else {
        valid++
      }
    })

    const conflicts = findConflicts(entries, parsedData.courses)
    return { valid, review, invalid, conflictsCount: conflicts.length }
  }, [parsedData.scheduleEntries, parsedData.courses])

  // Handle File Upload Process
  async function handleFileSelect(selectedFile) {
    if (!selectedFile) return
    setErrorMsg('')
    setFile(selectedFile)
    setFileName(selectedFile.name)
    setLoading(true)
    setProgressState({ stage: 'Memproses berkas...', progress: 10 })

    try {
      const result = await parseUniversalFile(selectedFile, (p) => setProgressState(p))
      setFileType(result.fileType)

      // KASUS 1: Format resmi kampus (Zero-Click guarantee -> langsung ke Step 3 Preview)
      if (result.isCampusFormat && result.parsed) {
        const entriesWithTA = (result.parsed.scheduleEntries || []).map((e) => ({
          ...e,
          tahunAjaran: effectiveTA,
        }))
        setParsedData({
          scheduleEntries: entriesWithTA,
          courses: result.parsed.courses || [],
          exams: result.parsed.exams || [],
          warnings: result.warnings || [],
        })
        setStep('preview')
        setLoading(false)
        return
      }

      // KASUS 2: Format umum/kampus lain -> Masuk ke Step 2 (Column Mapping)
      setRawHeaders(result.rawHeaders || [])
      setRawRows(result.rawRows || [])

      // Coba load preset pemetaan sebelumnya
      let savedPreset = {}
      try {
        const str = localStorage.getItem(PRESET_STORAGE_KEY)
        if (str) savedPreset = JSON.parse(str)
      } catch {
        // Abaikan jika preset belum tersimpan
      }

      // Lakukan auto-matching sinonim kolom
      const initialMap = {}
      SYSTEM_FIELDS.forEach((field) => {
        if (savedPreset[field.key] && result.rawHeaders.includes(savedPreset[field.key])) {
          initialMap[field.key] = savedPreset[field.key]
          return
        }
        const matched = result.rawHeaders.find((h) => {
          const cleanH = String(h).toLowerCase().trim()
          return field.aliases.some((alias) => cleanH === alias || cleanH.includes(alias))
        })
        if (matched) {
          initialMap[field.key] = matched
        }
      })

      setColumnMapping(initialMap)
      setStep('mapping')
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membaca berkas jadwal.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Step 2 Apply Mapping -> Step 3 Preview
  function handleApplyMapping() {
    if (savePreset) {
      try {
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(columnMapping))
      } catch {
        // Abaikan jika preset belum tersimpan
      }
    }

    const rawEntries = applyColumnMapping(rawRows, columnMapping, prodiDefault, semesterDefault)
    if (rawEntries.length === 0) {
      setErrorMsg('Tidak ada baris jadwal yang valid dari pemetaan kolom ini.')
      return
    }

    const scheduleEntries = rawEntries.map((e) => ({
      ...e,
      tahunAjaran: effectiveTA,
    }))

    // Bangun daftar courses unik dari scheduleEntries
    const courseMap = new Map()
    scheduleEntries.forEach((s) => {
      if (!courseMap.has(s.kodeMK)) {
        courseMap.set(s.kodeMK, {
          kodeMK: s.kodeMK,
          namaMK: s.namaMK || s.kodeMK,
          dosen: s.dosen || '',
          sks: 2,
          durasi: 100,
          semester: s.semester || 2,
          prodi: s.prodi || 'Informatika',
        })
      }
    })

    setParsedData({
      scheduleEntries,
      courses: Array.from(courseMap.values()),
      exams: [],
      warnings: [],
    })
    setStep('preview')
  }

  // Inline Editing in Step 3
  function handleUpdateEntry(index, key, value) {
    setParsedData((prev) => {
      const nextEntries = [...prev.scheduleEntries]
      nextEntries[index] = { ...nextEntries[index], [key]: value }
      return { ...prev, scheduleEntries: nextEntries }
    })
  }

  function handleDeleteEntry(index) {
    setParsedData((prev) => ({
      ...prev,
      scheduleEntries: prev.scheduleEntries.filter((_, i) => i !== index),
    }))
  }

  // Final Save to Database
  async function handleFinalSave() {
    if (parsedData.scheduleEntries.length === 0) return
    setBusySaving(true)
    try {
      // Pastikan seluruh entri memiliki tahunAjaran yang dipilih
      const finalized = {
        ...parsedData,
        tahunAjaran: effectiveTA,
        scheduleEntries: parsedData.scheduleEntries.map((s) => ({
          ...s,
          tahunAjaran: effectiveTA,
        })),
      }
      await onSave(finalized)
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan jadwal ke database.')
    } finally {
      setBusySaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        onClick={() => !busySaving && onClose()}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* ── MODAL 1: UPLOAD (DROPZONE) ── */}
        {step === 'upload' && (
          <div className="flex flex-col h-full p-5 tablet:p-6 overflow-y-auto space-y-4">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <Icon name="upload_file" size={22} />
                </span>
                <div>
                  <h3 className="text-title-md font-bold text-on-surface leading-tight">
                    Impor Jadwal Kuliah Universal
                  </h3>
                  <p className="text-body-xs font-medium text-on-surface-variant">
                    Unggah berkas spreadsheet, dokumen, atau foto jadwal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            {/* Global Tahun Ajaran Selector (Top of Modal 1) */}
            <div className="rounded-2xl bg-surface-container-high/50 border border-outline-variant/25 p-3.5 flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0 font-bold">
                  <Icon name="calendar_month" size={17} />
                </span>
                <div>
                  <p className="text-body-sm font-bold text-on-surface leading-tight">
                    Tahun Ajaran (TA) Target
                  </p>
                  <p className="text-[11px] font-medium text-on-surface-variant">
                    Berlaku serentak untuk seluruh jadwal dalam berkas ini
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isCustomTA ? (
                  <div className="w-60 min-w-[220px]">
                    <FormSelect
                      value={selectedTA}
                      onChange={(val) => {
                        if (val === '__NEW__') {
                          setIsCustomTA(true)
                        } else {
                          setSelectedTA(val)
                        }
                      }}
                      options={taOptions}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="mis. 2026/2027"
                      value={customTAInput}
                      onChange={(e) => setCustomTAInput(e.target.value)}
                      className="w-36 rounded-xl border border-primary bg-surface-container-lowest p-2 text-body-xs font-bold text-on-surface focus:outline-none dark:bg-surface-container-low shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTA(false)
                        setCustomTAInput('')
                      }}
                      className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer"
                      title="Batal TA Baru"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dropzone Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFileSelect(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-7 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-outline-variant/40 bg-surface-container-low/40 hover:border-primary/60 hover:bg-surface-container-low'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-xs">
                <Icon name="cloud_upload" size={30} />
              </div>

              <p className="mt-3 text-body-md font-bold text-on-surface">
                {fileName || 'Tarik & lepas file ke sini, atau '}
                <span className="text-primary underline ml-1">Telusuri File</span>
              </p>

              {/* Supported Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-label-caps font-bold text-emerald-800 dark:text-emerald-300">
                  📊 Excel .xlsx/.xls
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 text-label-caps font-bold text-teal-800 dark:text-teal-300">
                  📋 CSV
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 text-label-caps font-bold text-blue-800 dark:text-blue-300">
                  📄 Word .docx
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 border border-red-500/25 px-2.5 py-1 text-label-caps font-bold text-red-800 dark:text-red-300">
                  📑 PDF Digital
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-label-caps font-bold text-purple-800 dark:text-purple-300">
                  📸 Gambar/OCR
                </span>
              </div>
            </div>

            {/* Parsing Progress Bar */}
            {loading && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-body-xs font-bold text-primary">
                  <span>{progressState.stage || 'Memproses berkas...'}</span>
                  <span>{progressState.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-2xl bg-error/10 border border-error/25 p-3.5 text-body-xs font-semibold text-error flex items-start gap-2 animate-fade-in">
                <Icon name="error" size={18} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Information Tips */}
            <div className="rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 p-3.5 space-y-1.5 text-body-xs text-on-surface-variant">
              <p className="flex items-center gap-1.5 font-bold text-on-surface">
                <Icon name="lightbulb" size={16} className="text-amber-500 shrink-0" />
                Tips Penggunaan:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-body-xs pl-1">
                <li>Format Excel resmi kampus Anda akan <strong>otomatis diproses instan</strong> tanpa perlu pemetaan ulang.</li>
                <li>Untuk dokumen <strong>PDF</strong>, pastikan menggunakan format digital resmi (teks dapat diblok/disalin).</li>
                <li>Untuk <strong>foto kertas jadwal</strong>, gunakan resolusi yang tajam dan pencahayaan terang untuk hasil OCR optimal.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── MODAL 2: COLUMN MAPPING ── */}
        {step === 'mapping' && (
          <div className="flex flex-col h-full p-5 tablet:p-6 overflow-y-auto space-y-4">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-xs">
                  <Icon name="tune" size={22} />
                </span>
                <div>
                  <h3 className="text-title-md font-bold text-on-surface leading-tight">
                    Petakan Kolom Berkas ke Sistem
                  </h3>
                  <p className="text-body-xs font-medium text-on-surface-variant truncate max-w-md">
                    Berkas: {fileName} • Status: <span className="text-primary font-bold">{autoMatchedCount} kolom cocok</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
                title="Kembali ke Upload"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            {/* Global File Settings Badge (Tahun Ajaran, Prodi, Semester) */}
            <div className="p-3 rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 space-y-2.5">
              <p className="text-label-caps uppercase font-bold text-on-surface-variant">
                Berlaku untuk seluruh berkas ini:
              </p>
              <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                    Tahun Ajaran (TA)
                  </label>
                  <span className="inline-flex items-center gap-1.5 font-mono text-body-xs font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-1.5 rounded-xl w-full">
                    <Icon name="calendar_today" size={14} />
                    TA {effectiveTA}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                    Default Program Studi
                  </label>
                  <FormSelect
                    value={prodiDefault}
                    onChange={setProdiDefault}
                    options={prodiOptions.map((p) => ({ value: p, label: p }))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                    Default Semester
                  </label>
                  <FormSelect
                    value={semesterDefault}
                    onChange={(v) => setSemesterDefault(Number(v))}
                    options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))}
                  />
                </div>
              </div>
            </div>

            {/* Column Mapping Table */}
            <div className="rounded-2xl border border-outline-variant/20 overflow-hidden bg-surface-container-lowest dark:bg-surface-container-low shadow-2xs">
              <div className="divide-y divide-outline-variant/10 max-h-[360px] overflow-y-auto">
                {SYSTEM_FIELDS.map((field) => {
                  const isMapped = Boolean(columnMapping[field.key])
                  return (
                    <div key={field.key} className="flex items-center justify-between p-3 gap-3 hover:bg-surface-container-low/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-[220px]">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant shrink-0">
                          <Icon name={field.icon} size={16} />
                        </span>
                        <div>
                          <p className="text-body-sm font-bold text-on-surface leading-tight">{field.label}</p>
                          <p className="text-[10.5px] font-mono text-on-surface-variant">{field.key}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => setColumnMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/70 py-1.5 px-2.5 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/40 cursor-pointer"
                        >
                          <option value="">-- Tidak Dipetakan / Kosong --</option>
                          {rawHeaders.map((header) => (
                            <option key={header} value={header}>
                              Kolom: {header}
                            </option>
                          ))}
                        </select>
                        <span className="shrink-0">
                          {isMapped ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              <Icon name="check" size={12} /> Cocok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              Manual
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Checkbox Save Preset */}
            <label className="flex items-center gap-2 text-body-xs font-semibold text-on-surface cursor-pointer select-none">
              <input
                type="checkbox"
                checked={savePreset}
                onChange={(e) => setSavePreset(e.target.checked)}
                className="rounded cursor-pointer text-primary"
              />
              <span>Simpan format pemetaan ini untuk berkas berikutnya</span>
            </label>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0">
              <Button type="button" variant="secondary" onClick={() => setStep('upload')}>
                <Icon name="arrow_back" size={16} className="mr-1" />
                Unggah Ulang
              </Button>
              <Button type="button" onClick={handleApplyMapping} className="font-bold">
                <span>Lanjut ke Pratinjau</span>
                <Icon name="arrow_forward" size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── MODAL 3: LIVE PREVIEW & VALIDATION ── */}
        {step === 'preview' && (
          <div className="flex flex-col h-full p-5 tablet:p-6 overflow-hidden space-y-3.5">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs shrink-0">
                  <Icon name="fact_check" size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-title-md font-bold text-on-surface leading-tight">
                      Pratinjau & Validasi Data Jadwal ({parsedData.scheduleEntries.length} Sesi)
                    </h3>
                    <span className="font-mono text-label-caps font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">
                      TA {effectiveTA}
                    </span>
                  </div>
                  <p className="text-body-xs font-medium text-on-surface-variant">
                    Periksa ejaan dan perbaiki langsung di tabel sebelum disimpan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors shrink-0"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            {/* Metrics Chips */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-body-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{previewMetrics.valid} Baris Valid</span>
              </div>
              {previewMetrics.review > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 text-body-xs font-bold text-amber-800 dark:text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>{previewMetrics.review} Perlu Review (OCR)</span>
                </div>
              )}
              {previewMetrics.invalid > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-error/15 border border-error/25 px-2.5 py-1 text-body-xs font-bold text-error">
                  <span className="h-2 w-2 rounded-full bg-error" />
                  <span>{previewMetrics.invalid} Error / Tidak Lengkap</span>
                </div>
              )}
              {previewMetrics.conflictsCount > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 border border-red-500/25 px-2.5 py-1 text-body-xs font-bold text-error">
                  <Icon name="warning" size={14} />
                  <span>{previewMetrics.conflictsCount} Bentrok Terdeteksi</span>
                </div>
              )}
            </div>

            {/* Interactive Live Preview Table */}
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xs">
              <table className="w-full table-fixed text-left border-collapse text-body-xs min-w-[750px]">
                <thead className="sticky top-0 z-10 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md border-b border-outline-variant/15 shadow-2xs">
                  <tr>
                    <th className="w-[10%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Hari</th>
                    <th className="w-[14%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Jam</th>
                    <th className="w-[23%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Mata Kuliah</th>
                    <th className="w-[18%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Dosen</th>
                    <th className="w-[12%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Ruang</th>
                    <th className="w-[11%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Tipe</th>
                    <th className="w-[8%] px-2 py-2 text-label-caps uppercase font-bold text-on-surface-variant text-center">Akurasi</th>
                    <th className="w-[4%] px-2 py-2 text-label-caps uppercase font-bold text-on-surface-variant text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-medium text-on-surface">
                  {parsedData.scheduleEntries.map((entry, index) => {
                    const isLowConfidence = typeof entry.confidence === 'number' && entry.confidence < 80
                    const errors = validateScheduleEntry(entry)
                    const isRowEditing = editingRowId === entry.id

                    return (
                      <tr
                        key={entry.id || index}
                        className={`group hover:bg-surface-container-low/60 transition-colors ${
                          errors.length > 0
                            ? 'bg-red-500/5 dark:bg-red-500/10'
                            : isLowConfidence
                            ? 'bg-amber-500/5 dark:bg-amber-500/10'
                            : ''
                        }`}
                      >
                        {/* Hari */}
                        <td className="px-3 py-2">
                          {isRowEditing ? (
                            <input
                              type="text"
                              value={entry.hari}
                              onChange={(e) => handleUpdateEntry(index, 'hari', e.target.value)}
                              className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-bold"
                            />
                          ) : (
                            <span onClick={() => setEditingRowId(entry.id)} className="font-bold cursor-text hover:underline">
                              {entry.hari || '—'}
                            </span>
                          )}
                        </td>

                        {/* Jam */}
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          {isRowEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={entry.jamMulai}
                                onChange={(e) => handleUpdateEntry(index, 'jamMulai', e.target.value)}
                                className="w-14 rounded-lg border border-primary bg-surface p-1 text-body-xs font-mono font-bold"
                              />
                              <span>-</span>
                              <input
                                type="text"
                                value={entry.jamSelesai}
                                onChange={(e) => handleUpdateEntry(index, 'jamSelesai', e.target.value)}
                                className="w-14 rounded-lg border border-primary bg-surface p-1 text-body-xs font-mono font-bold"
                              />
                            </div>
                          ) : (
                            <span onClick={() => setEditingRowId(entry.id)} className="font-semibold cursor-text hover:underline">
                              {entry.jamMulai} - {entry.jamSelesai}
                            </span>
                          )}
                        </td>

                        {/* Mata Kuliah */}
                        <td className="px-3 py-2">
                          {isRowEditing ? (
                            <input
                              type="text"
                              value={entry.namaMK}
                              onChange={(e) => handleUpdateEntry(index, 'namaMK', e.target.value)}
                              className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                            />
                          ) : (
                            <div onClick={() => setEditingRowId(entry.id)} className="cursor-text">
                              <p className="font-bold text-on-surface truncate leading-tight hover:underline">
                                {entry.namaMK || entry.kodeMK}
                              </p>
                              <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-500/15 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                                {entry.kodeMK}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Dosen */}
                        <td className="px-3 py-2">
                          {isRowEditing ? (
                            <input
                              type="text"
                              value={entry.dosen}
                              onChange={(e) => handleUpdateEntry(index, 'dosen', e.target.value)}
                              className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs"
                            />
                          ) : (
                            <span onClick={() => setEditingRowId(entry.id)} className="text-on-surface-variant truncate block cursor-text hover:underline">
                              {entry.dosen || '—'}
                            </span>
                          )}
                        </td>

                        {/* Ruang */}
                        <td className="px-3 py-2">
                          {isRowEditing ? (
                            <input
                              type="text"
                              value={entry.ruang}
                              onChange={(e) => handleUpdateEntry(index, 'ruang', e.target.value)}
                              className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                            />
                          ) : (
                            <span onClick={() => setEditingRowId(entry.id)} className="font-semibold truncate block cursor-text hover:underline">
                              {entry.ruang || '—'}
                            </span>
                          )}
                        </td>

                        {/* Tipe Kelas */}
                        <td className="px-3 py-2">
                          {isRowEditing ? (
                            <select
                              value={entry.tipeKelas || 'K1'}
                              onChange={(e) => handleUpdateEntry(index, 'tipeKelas', e.target.value)}
                              className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                            >
                              {CLASS_TYPE_CODES.map((t) => (
                                <option key={t} value={t}>
                                  {t} — {classTypeLabel(t)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              onClick={() => setEditingRowId(entry.id)}
                              title={classTypeLabel(entry.tipeKelas)}
                              className="inline-flex items-center rounded-md bg-surface-container-high px-2 py-0.5 text-[10.5px] font-bold text-on-surface cursor-pointer hover:bg-surface-container-highest"
                            >
                              {entry.tipeKelas || 'K1'}
                            </span>
                          )}
                        </td>

                        {/* Akurasi Status */}
                        <td className="px-2 py-2 text-center">
                          {errors.length > 0 ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-bold text-error" title={errors.join(', ')}>
                              🔴 Error
                            </span>
                          ) : isLowConfidence ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300" title="Skor kepercayaan OCR sedang">
                              🟡 {entry.confidence}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              🟢 {entry.confidence || 98}%
                            </span>
                          )}
                        </td>

                        {/* Aksi Hapus */}
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(index)}
                            className="rounded-lg p-1 text-on-surface-variant hover:text-error hover:bg-error/10 cursor-pointer transition-colors"
                            title="Hapus Baris Ini"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] font-medium text-on-surface-variant shrink-0">
              💡 Klik langsung pada teks di tabel jika ingin mengoreksi salah eja secara cepat.
            </p>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0">
              <Button type="button" variant="secondary" onClick={() => setStep('upload')} disabled={busySaving}>
                <Icon name="arrow_back" size={16} className="mr-1" />
                Unggah Ulang
              </Button>
              <Button
                type="button"
                onClick={handleFinalSave}
                disabled={busySaving || parsedData.scheduleEntries.length === 0}
                className="font-bold shadow-xs cursor-pointer"
              >
                <Icon name="check_circle" size={18} className="mr-1.5" />
                {busySaving ? 'Menyimpan ke Database...' : 'Simpan Jadwal ke Database'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
