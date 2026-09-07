import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { validateScheduleEntry, findConflicts } from '../../lib/uploadValidator'
import { useCampus } from '../../context/useCampus'
import { CLASS_TYPE_CODES } from '../../lib/classTypes'
import { SYSTEM_FIELDS, PRESET_STORAGE_KEY } from './import/importConfig'
import { ImportStepUpload } from './import/ImportStepUpload'
import { ImportStepMapping } from './import/ImportStepMapping'
import { ImportStepPreview } from './import/ImportStepPreview'

export function UniversalImportModal({
  open: rawOpen,
  isOpen: rawIsOpen,
  onClose,
  onSave,
  prodiOptions = ['Informatika', 'Bisnis Digital', 'Arsitektur', 'Teknik Sipil', 'Kewirausahaan'],
  currentTA = '2025/2026',
  existingTAs = ['2025/2026', '2024/2025'],
}) {
  const open = rawOpen ?? rawIsOpen ?? false
  // Konfigurasi kampus aktif (prodi, tipe kelas, preset impor per-kampus).
  const { prodiNames, campus, classTypeCodes } = useCampus()
  const effectiveProdiOptions = prodiNames.length > 0 ? prodiNames : prodiOptions
  const effectiveClassTypeCodes = classTypeCodes.length > 0 ? classTypeCodes : CLASS_TYPE_CODES

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
  const [prodiDefault, setProdiDefault] = useState(effectiveProdiOptions[0] || 'Informatika')
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

  // Escape key handler to close modal
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !busySaving && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, busySaving, loading, onClose])

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
      icon: 'add',
    })
    return list
  }, [uniqueTAs, currentTA])

  // Count Auto-matched columns for indicator badge
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
    setFileName(selectedFile.name)
    setLoading(true)
    setProgressState({ stage: 'Memproses berkas...', progress: 10 })

    try {
      const { parseUniversalFile } = await import('../../lib/universalParser')
      const result = await parseUniversalFile(selectedFile, (p) => setProgressState(p), campus)

      if (result.type === 'tabular' && result.rawHeaders) {
        // Tabular workflow (Needs Column Mapping Step)
        setRawHeaders(result.rawHeaders)
        setRawRows(result.rawRows || [])

        // Attempt automatic column matching with aliases
        const initialMapping = detectColumnsAutomatically(result.rawHeaders)
        setColumnMapping(initialMapping)
        setStep('mapping')
      } else if (result.type === 'direct' && result.data) {
        // Direct structured result
        setParsedData(result.data)
        setStep('preview')
      } else {
        throw new Error('Format berkas tidak dapat diproses secara otomatis.')
      }
    } catch (err) {
      console.error('[UniversalImport] parsing error:', err)
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses berkas.')
    } finally {
      setLoading(false)
    }
  }

  // Auto detect columns by header alias fuzzy matching
  function detectColumnsAutomatically(headers) {
    const mapping = {}
    let savedPreset = null
    try {
      savedPreset = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || 'null')
    } catch (e) {
      console.warn('Failed to parse saved preset:', e)
    }

    SYSTEM_FIELDS.forEach((field) => {
      if (savedPreset && savedPreset[field.key] && headers.includes(savedPreset[field.key])) {
        mapping[field.key] = savedPreset[field.key]
        return
      }

      const match = headers.find((h) => {
        const cleanH = String(h).trim().toLowerCase()
        return field.aliases.some((alias) => cleanH === alias || cleanH.includes(alias))
      })

      if (match) {
        mapping[field.key] = match
      }
    })

    return mapping
  }

  // Apply mapping and parse tabular rows to canonical entries
  async function handleApplyMapping() {
    if (savePreset) {
      try {
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(columnMapping))
      } catch (e) {
        console.warn('Failed to save mapping preset:', e)
      }
    }

    const { normalizeParsedEntries } = await import('../../lib/scheduleNormalizer')
    const scheduleEntries = normalizeParsedEntries(rawRows, columnMapping, {
      prodiDefault,
      semesterDefault,
      tahunAjaran: effectiveTA,
    })

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
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-level-3 dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* ── MODAL 1: UPLOAD (DROPZONE) ── */}
        {step === 'upload' && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header Banner */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1">
                    <Icon name="upload_file" size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                        Impor Jadwal Kuliah Universal
                      </h3>
                      <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wider border border-white/25 shadow-level-1">
                        Multi-Format & OCR
                      </span>
                    </div>
                    <p className="text-body-xs text-white/80 font-medium truncate">
                      Unggah berkas spreadsheet, dokumen, atau foto jadwal
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
            </div>

            <ImportStepUpload
              selectedTA={selectedTA}
              setSelectedTA={setSelectedTA}
              isCustomTA={isCustomTA}
              setIsCustomTA={setIsCustomTA}
              customTAInput={customTAInput}
              setCustomTAInput={setCustomTAInput}
              taOptions={taOptions}
              dragOver={dragOver}
              setDragOver={setDragOver}
              handleFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              fileName={fileName}
              loading={loading}
              progressState={progressState}
              errorMsg={errorMsg}
            />
          </div>
        )}

        {/* ── MODAL 2: COLUMN MAPPING ── */}
        {step === 'mapping' && (
          <ImportStepMapping
            fileName={fileName}
            autoMatchedCount={autoMatchedCount}
            setStep={setStep}
            effectiveTA={effectiveTA}
            prodiDefault={prodiDefault}
            setProdiDefault={setProdiDefault}
            effectiveProdiOptions={effectiveProdiOptions}
            semesterDefault={semesterDefault}
            setSemesterDefault={setSemesterDefault}
            columnMapping={columnMapping}
            setColumnMapping={setColumnMapping}
            rawHeaders={rawHeaders}
            savePreset={savePreset}
            setSavePreset={setSavePreset}
            handleApplyMapping={handleApplyMapping}
          />
        )}

        {/* ── MODAL 3: LIVE PREVIEW & VALIDATION ── */}
        {step === 'preview' && (
          <ImportStepPreview
            fileName={fileName}
            effectiveTA={effectiveTA}
            onClose={onClose}
            setStep={setStep}
            previewMetrics={previewMetrics}
            parsedData={parsedData}
            editingRowId={editingRowId}
            setEditingRowId={setEditingRowId}
            handleUpdateEntry={handleUpdateEntry}
            effectiveClassTypeCodes={effectiveClassTypeCodes}
            handleDeleteEntry={handleDeleteEntry}
            busySaving={busySaving}
            handleFinalSave={handleFinalSave}
          />
        )}
      </div>
    </div>
  )
}
