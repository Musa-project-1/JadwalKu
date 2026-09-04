import { useState, useRef, useEffect, useMemo } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { deriveBoundsFromEvents } from '../../lib/calendarBounds'
import { MADANI_CALENDAR_PRESET } from '../../constants/academicCalendarPreset'

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
  const [detectedFormat, setDetectedFormat] = useState('')

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

  // ── Parser file ──
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

  // ── Muat preset Madani ──
  function loadMadaniPreset() {
    setErrorMsg('')
    setFileName('Preset Contoh: Universitas Madani')
    setDetectedFormat('preset')
    setEvents(MADANI_CALENDAR_PRESET.events.map((e) => ({ ...e })))
    setWarnings(['Ini adalah preset contoh (Universitas Madani T.A. 2026/2027). Anda dapat mengedit sebelum disimpan.'])
  }

  // ── Edit inline ──
  function startEdit(idx) {
    setEditingIdx(idx)
    setEditDraft({ ...events[idx] })
  }

  function handleEditField(field, value) {
    setEditDraft((d) => ({ ...d, [field]: value }))
  }

  function saveEdit() {
    if (editingIdx == null || !editDraft) return
    setEvents((prev) => {
      const next = [...prev]
      next[editingIdx] = { ...editDraft }
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
    const newEvent = {
      name: 'Kegiatan Baru',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      semester: 'ganjil',
      category: 'kegiatan',
    }
    setEvents((prev) => [newEvent, ...prev])
    setEditingIdx(0)
    setEditDraft(newEvent)
  }

  async function handleImport() {
    if (events.length === 0) return
    if (onSaveCalendarEvents) {
      await onSaveCalendarEvents(events, {
        sourceFileName: fileName,
        detectedFormat,
        derivedBounds,
      })
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in print:hidden"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-transparent"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] tablet:max-h-[88vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 animate-fade-up z-10"
      >
        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
              <Icon name="calendar_month" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  Import Kalender Akademik
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                  Universal Kaldik OCR
                </span>
              </div>
              <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
                Unggah berkas Kaldik kampus (PDF / Foto OCR / Excel / CSV / JSON) atau muat preset resmi
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

        {/* 2-Column Split Body (Left: Slim Upload & Settings, Right: Live Event Table & Bounds Preview) */}
        <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
          {/* LEFT COLUMN: Source Configuration & Upload (5-Cols) */}
          <div className="tablet:col-span-5 tablet:overflow-y-auto p-4 tablet:p-5 space-y-4 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/20 custom-scrollbar">
            {/* Card 1: File Dropzone */}
            <div className="space-y-1.5">
              <label className="block text-label-caps uppercase tracking-wider text-on-surface-variant font-extrabold">
                Berkas Kaldik Kampus
              </label>
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
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-primary bg-primary/10 shadow-level-2'
                    : 'border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low hover:border-primary/60 hover:bg-surface-container-low'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-all shadow-level-1">
                  <Icon name="cloud_upload" size={24} />
                </div>
                <p className="mt-2 text-body-xs font-bold text-on-surface leading-snug">
                  {fileName || 'Tarik & lepas file Kaldik, atau '}
                  <span className="text-teal-700 dark:text-teal-400 underline ml-1">Telusuri File</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2 py-0.5 text-label-caps font-extrabold text-red-800 dark:text-red-300">
                    <Icon name="picture_as_pdf" size={11} /> PDF
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-label-caps font-extrabold text-purple-800 dark:text-purple-300">
                    <Icon name="image" size={11} /> OCR/Foto
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-label-caps font-extrabold text-emerald-800 dark:text-emerald-300">
                    <Icon name="table_view" size={11} /> Excel/CSV
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 text-label-caps font-extrabold text-teal-800 dark:text-teal-300">
                    <Icon name="data_object" size={11} /> JSON
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Preset Contoh Madani */}
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-2 shadow-level-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                  <Icon name="auto_awesome" size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-body-xs font-bold text-on-surface leading-tight">Preset Contoh Kampus</h4>
                  <p className="text-body-xs text-on-surface-variant font-medium">Kalender Universitas Madani T.A. 2026/2027</p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={loadMadaniPreset}
                className="w-full justify-center rounded-full py-2 text-body-xs font-bold border border-outline-variant/30 hover:border-primary cursor-pointer shadow-level-1"
              >
                <Icon name="download" size={14} className="mr-1 text-primary" />
                Muat Preset Madani
              </Button>
            </div>

            {/* Parsing Progress */}
            {loading && (
              <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 p-4 space-y-2 animate-fade-in shadow-level-1">
                <div className="flex items-center justify-between text-body-xs font-bold text-teal-900 dark:text-teal-200">
                  <span>{progressState.stage || 'Menganalisis berkas Kaldik...'}</span>
                  <span>{progressState.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-teal-500/20 overflow-hidden">
                  <div className="h-full bg-teal-700 dark:bg-teal-400 rounded-full transition-all duration-300" style={{ width: `${progressState.progress}%` }} />
                </div>
              </div>
            )}

            {/* Error / Warnings */}
            {errorMsg && (
              <div className="rounded-2xl bg-error/10 border border-error/25 p-3 text-body-xs font-semibold text-error flex items-start gap-2 animate-fade-in shadow-level-1">
                <Icon name="error" size={16} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Derived Bounds Preview Card */}
            {derivedBounds && (
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-2 shadow-level-1">
                <span className="block text-body-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Kalkulasi TA & Semester Otomatis
                </span>
                <div className="grid grid-cols-2 gap-2 text-label-caps">
                  <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/15">
                    <p className="text-on-surface-variant font-bold text-label-caps">T.A. AKTIF</p>
                    <p className="font-extrabold text-primary">{derivedBounds.tahunAjaran || '-'}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/15">
                    <p className="text-on-surface-variant font-bold text-label-caps">SEMESTER</p>
                    <p className="font-extrabold text-on-surface uppercase">{derivedBounds.activeSemester || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Event Table & Inline Editor (7-Cols) */}
          <div className="tablet:col-span-7 flex flex-col flex-1 min-h-0 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 overflow-hidden">
            {/* Top Table Control Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline-variant/15 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20 px-2.5 py-0.5 text-body-xs font-extrabold shadow-level-1">
                  {totalEventsCount.total} Event Terdeteksi
                </span>
                <span className="rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20 px-2.5 py-0.5 text-label-caps font-bold">
                  {totalEventsCount.ganjil} Ganjil
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-label-caps font-bold">
                  {totalEventsCount.genap} Genap
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddManual}
                className="inline-flex items-center gap-1 rounded-full border border-teal-600/30 bg-teal-500/10 px-3 py-1 text-label-caps font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-500/20 transition-colors cursor-pointer shadow-level-1"
              >
                <Icon name="add" size={13} />
                <span>Tambah Event</span>
              </button>
            </div>

            {/* Event List Table */}
            {events.length > 0 ? (
              <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 border border-outline-variant/15 rounded-2xl my-3 custom-scrollbar">
                <table className="w-full table-fixed text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-level-1">
                    <tr className="border-b border-outline-variant/15">
                      <th className="px-3 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold">
                        Nama Agenda / Event
                      </th>
                      <th className="w-36 px-2.5 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold">
                        Rentang Waktu
                      </th>
                      <th className="w-24 px-2 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold text-center">
                        Semester
                      </th>
                      <th className="w-16 px-2 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {events.map((event, idx) => {
                      const isEditing = editingIdx === idx

                      if (isEditing && editDraft) {
                        return (
                          <tr key={idx} className="bg-primary/5 dark:bg-primary/10">
                            <td className="px-3 py-2" colSpan={4}>
                              <div className="space-y-2 p-1">
                                <input
                                  type="text"
                                  value={editDraft.name}
                                  onChange={(e) => handleEditField('name', e.target.value)}
                                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-body-xs font-bold text-on-surface"
                                  placeholder="Nama Agenda"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="date"
                                    value={editDraft.startDate}
                                    onChange={(e) => handleEditField('startDate', e.target.value)}
                                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-label-caps font-semibold"
                                  />
                                  <input
                                    type="date"
                                    value={editDraft.endDate}
                                    onChange={(e) => handleEditField('endDate', e.target.value)}
                                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-label-caps font-semibold"
                                  />
                                  <select
                                    value={editDraft.semester}
                                    onChange={(e) => handleEditField('semester', e.target.value)}
                                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-label-caps font-bold"
                                  >
                                    <option value="ganjil">Ganjil</option>
                                    <option value="genap">Genap</option>
                                    <option value="antar">Antar / Umum</option>
                                  </select>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-2.5 py-1 text-label-caps rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveEdit}
                                    className="px-3 py-1 text-label-caps font-bold rounded-lg bg-teal-800 text-white hover:bg-teal-900 cursor-pointer shadow-level-1"
                                  >
                                    Simpan
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={idx} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="px-3 py-2 align-middle overflow-hidden">
                            <p className="font-bold text-body-xs text-on-surface truncate" title={event.name}>
                              {event.name}
                            </p>
                          </td>
                          <td className="w-36 px-2.5 py-2 align-middle font-mono text-body-xs text-on-surface-variant truncate">
                            {event.startDate} s.d {event.endDate}
                          </td>
                          <td className="w-24 px-2 py-2 align-middle text-center">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-caps font-extrabold uppercase ${
                              event.semester === 'ganjil'
                                ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20'
                                : event.semester === 'genap'
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-800 dark:text-slate-300 border border-slate-500/20'
                            }`}>
                              {event.semester}
                            </span>
                          </td>
                          <td className="w-16 px-2 py-2 align-middle text-right shrink-0">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(idx)}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15"
                                title="Edit"
                              >
                                <Icon name="edit" size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(idx)}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15"
                                title="Hapus"
                              >
                                <Icon name="delete" size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center my-3 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-level-1">
                  <Icon name="event_note" size={24} />
                </div>
                <p className="mt-2.5 text-body-xs font-bold text-on-surface">Belum ada agenda terdeteksi</p>
                <p className="text-label-caps text-on-surface-variant max-w-xs mt-0.5">
                  Unggah berkas PDF/Foto atau klik muat preset di sebelah kiri untuk meninjau data.
                </p>
              </div>
            )}

            {/* Bottom Footer Actions inside Right Panel */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0 mt-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={busySaving}
                className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <div className="flex items-center gap-2">
                {existingEvents.length > 0 && (
                  <span className="text-body-xs font-medium text-on-surface-variant hidden tablet:inline">
                    Gantikan {existingEvents.length} event lama
                  </span>
                )}
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={busySaving || events.length === 0}
                  className="rounded-full px-5 py-2 font-bold shadow-level-1 text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
                >
                  {busySaving ? (
                    <Icon name="progress_activity" size={15} className="mr-1.5 animate-spin" />
                  ) : (
                    <Icon name="save" size={15} className="mr-1.5" />
                  )}
                  {busySaving ? 'Menyimpan...' : 'Import ke Database'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
