import { useState, useRef, useEffect, useMemo } from 'react'
import { Icon } from '../Icon'
import { deriveBoundsFromEvents } from '../../lib/calendarBounds'
import { MADANI_CALENDAR_PRESET } from '../../constants/academicCalendarPreset'
import { KaldikUploadSidebar } from './kaldik/KaldikUploadSidebar'
import { KaldikEventTable } from './kaldik/KaldikEventTable'

export function AcademicCalendarImportModal({
  open,
  onClose,
  existingEvents = [],
  onSaveCalendarEvents,
  busySaving = false,
}) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progressState, setProgressState] = useState({ stage: '', progress: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  const [, setWarnings] = useState([])
  const [fileName, setFileName] = useState('')
  const [, setDetectedFormat] = useState('')

  // List events hasil parsing yang bisa diedit sebelum disimpan
  const [events, setEvents] = useState([])
  const [editingIdx, setEditingIdx] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  // Reset modal state saat dibuka/tutup.
  useEffect(() => {
    if (!open) {
      // oxlint-disable-next-line react/set-state-in-effect
      setFileName('')
      setErrorMsg('')
      setLoading(false)
      setEvents([])
      setWarnings([])
      setDetectedFormat('')
      setEditingIdx(null)
      setEditDraft(null)
      setDragOver(false)
    }
  }, [open])

  // Pratinjau ringkasan derived bounds dari events saat ini.
  const derivedBounds = useMemo(() => deriveBoundsFromEvents(events), [events])

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

  const totalEventsCount = useMemo(() => {
    const ganjil = events.filter((e) => e.semester === 'ganjil').length
    const genap = events.filter((e) => e.semester === 'genap').length
    const antar = events.filter((e) => e.semester === 'antar').length
    return { total: events.length, ganjil, genap, antar }
  }, [events])

  // Parser file
  async function handleFileSelect(selectedFile) {
    if (!selectedFile) return
    setErrorMsg('')
    setFileName(selectedFile.name)
    const { parseAcademicCalendarFile } = await import('../../lib/academicCalendarParser')
    setLoading(true)
    setProgressState({ stage: 'Memulai...', progress: 5 })

    try {
      const result = await parseAcademicCalendarFile(selectedFile, setProgressState)
      setEvents(result.events)
      setWarnings(result.warnings || [])
      setDetectedFormat(result.detectedFormat || '')
      if (result.events.length === 0) {
        setErrorMsg(`Tidak ada event Kalender Akademik yang terdeteksi dari file "${selectedFile.name}".`)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membaca file Kalender Akademik.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Muat preset Madani
  function loadMadaniPreset() {
    setErrorMsg('')
    setFileName('Preset Contoh: Universitas Madani')
    setDetectedFormat('preset')
    setEvents(MADANI_CALENDAR_PRESET.events.map((e) => ({ ...e })))
    setWarnings(['Ini adalah preset contoh (Universitas Madani T.A. 2026/2027). Anda dapat mengedit sebelum disimpan.'])
  }

  // Edit inline
  function startEdit(idx) {
    setEditingIdx(idx)
    const item = events[idx]
    setEditDraft({
      name: item.nama || item.name || '',
      startDate: item.tanggalMulai || item.startDate || '',
      endDate: item.tanggalSelesai || item.endDate || item.tanggalMulai || '',
      semester: item.semester || 'ganjil',
      kategori: item.kategori || 'kegiatan',
    })
  }

  function handleEditField(field, val) {
    setEditDraft((prev) => ({ ...prev, [field]: val }))
  }

  function saveEdit() {
    if (editingIdx == null || !editDraft) return
    setEvents((prev) => {
      const next = [...prev]
      next[editingIdx] = {
        ...next[editingIdx],
        nama: editDraft.name,
        name: editDraft.name,
        tanggalMulai: editDraft.startDate,
        startDate: editDraft.startDate,
        tanggalSelesai: editDraft.endDate,
        endDate: editDraft.endDate,
        semester: editDraft.semester,
        kategori: editDraft.kategori,
      }
      return next
    })
    setEditingIdx(null)
    setEditDraft(null)
  }

  function cancelEdit() {
    setEditingIdx(null)
    setEditDraft(null)
  }

  function handleDelete(idx) {
    setEvents((prev) => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) {
      setEditingIdx(null)
      setEditDraft(null)
    }
  }

  function handleAddManual() {
    const today = new Date().toISOString().slice(0, 10)
    const newEvent = {
      nama: 'Agenda Baru',
      name: 'Agenda Baru',
      tanggalMulai: today,
      startDate: today,
      tanggalSelesai: today,
      endDate: today,
      semester: 'ganjil',
      kategori: 'kegiatan',
    }
    setEvents((prev) => [newEvent, ...prev])
    startEdit(0)
  }

  async function handleImport() {
    if (events.length === 0) return
    const cleaned = events.map((e) => ({
      nama: e.nama || e.name,
      name: e.nama || e.name,
      tanggalMulai: e.tanggalMulai || e.startDate,
      startDate: e.tanggalMulai || e.startDate,
      tanggalSelesai: e.tanggalSelesai || e.endDate || e.tanggalMulai || e.startDate,
      endDate: e.tanggalSelesai || e.endDate || e.tanggalMulai || e.startDate,
      semester: e.semester || 'ganjil',
      kategori: e.kategori || 'kegiatan',
    }))

    if (onSaveCalendarEvents) {
      await onSaveCalendarEvents(cleaned)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-kaldik-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-level-3 dark:bg-surface-container-low dark:border-outline-variant/15 overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header Modal */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
              <Icon name="calendar_today" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="import-kaldik-title" className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  Import Kalender Akademik (Kaldik)
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                  Universal Engine
                </span>
              </div>
              <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
                Otomatis ekstraksi agenda, hitung batas semester ganjil/genap, dan turunkan Tahun Ajaran
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busySaving || loading}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer disabled:opacity-50"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* 2-Column Split Body */}
        <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
          <KaldikUploadSidebar
            fileInputRef={fileInputRef}
            dragOver={dragOver}
            setDragOver={setDragOver}
            handleFileSelect={handleFileSelect}
            fileName={fileName}
            loadMadaniPreset={loadMadaniPreset}
            loading={loading}
            progressState={progressState}
            errorMsg={errorMsg}
            derivedBounds={derivedBounds}
          />

          <KaldikEventTable
            totalEventsCount={totalEventsCount}
            handleAddManual={handleAddManual}
            events={events}
            editingIdx={editingIdx}
            editDraft={editDraft}
            handleEditField={handleEditField}
            cancelEdit={cancelEdit}
            saveEdit={saveEdit}
            startEdit={startEdit}
            handleDelete={handleDelete}
            onClose={onClose}
            busySaving={busySaving}
            existingEvents={existingEvents}
            handleImport={handleImport}
          />
        </div>
      </div>
    </div>
  )
}
