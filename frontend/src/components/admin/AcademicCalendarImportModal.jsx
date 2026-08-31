import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { FormSelect } from '../FormSelect'
import {
  parseAcademicCalendarFile,
  deriveBoundsFromEvents,
  formatEventDateRange,
  semesterLabel,
  kategoriLabel,
} from '../../lib/academicCalendarParser'
import { MADANI_CALENDAR_PRESET, KATEGORI_OPTIONS } from '../../constants/academicCalendarPreset'

/**
 * Modal Import Kalender Akademik (Kaldik).
 *
 * Mendukung:
 *  - Upload file .pdf, .png, .jpg, .jpeg, .webp, .xlsx, .xls, .csv, .json
 *  - Muat Preset Madani (contoh terstruktur)
 *  - Pratinjau & edit inline event sebelum disimpan
 *  - Simpan ke settings/academicCalendar (+ turunkan batas ganjil/genap otomatis)
 */
export function AcademicCalendarImportModal({
  open,
  onClose,
  onImport,
  existingEvents = [],
  actor = '',
  busySaving = false,
}) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [progressState, setProgressState] = useState({ stage: '', progress: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  const [events, setEvents] = useState([])
  const [warnings, setWarnings] = useState([])
  const [detectedFormat, setDetectedFormat] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  // Reset modal state saat dibuka/tutup.
  useEffect(() => {
    if (!open) {
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

  const stats = useMemo(() => {
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
  }

  function handleAddManual() {
    const newEvent = {
      nama: 'Event Baru',
      tanggalMulai: '',
      tanggalSelesai: '',
      semester: 'ganjil',
      kategori: 'kegiatan',
    }
    // Tambahkan ke daftar, lalu mulai edit baris terakhir.
    setEvents((prev) => {
      const next = [...prev, newEvent]
      setEditingIdx(next.length - 1)
      setEditDraft({ ...newEvent })
      return next
    })
  }

  // ── Simpan ke database ──
  async function handleImport() {
    if (events.length === 0) {
      setErrorMsg('Tidak ada event untuk diimpor. Silakan pilih file atau muat preset.')
      return
    }
    const validEvents = events.filter((e) => e.nama && e.tanggalMulai)
    if (validEvents.length === 0) {
      setErrorMsg('Semua event belum lengkap. Pastikan Nama dan Tanggal Mulai terisi.')
      return
    }
    if (validEvents.length !== events.length) {
      setErrorMsg(`${events.length - validEvents.length} event belum lengkap dan akan dilewati.`)
    }

    const bounds = deriveBoundsFromEvents(validEvents)
    setErrorMsg('')
    await onImport({
      events: validEvents,
      bounds,
      fileName,
      detectedFormat,
      existingCount: existingEvents.length,
    })
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0 animate-fade-in"
    >
      {/* Backdrop */}
      <div onClick={() => !busySaving && onClose()} className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        <div className="flex flex-col h-full p-5 tablet:p-6 overflow-y-auto space-y-4">
          {/* Header */}
          <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Icon name="calendar_month" size={22} />
              </span>
              <div>
                <h3 className="text-title-md font-bold text-on-surface leading-tight">
                  Import Kalender Akademik
                </h3>
                <p className="text-body-xs font-medium text-on-surface-variant">
                  Unggah file Kaldik (PDF / Gambar / Excel / CSV / JSON) atau muat preset
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
              title="Tutup"
            >
              <Icon name="close" size={20} />
            </button>
          </header>

          {/* Source Tabs / Actions */}
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3 shrink-0">
            {/* Dropzone */}
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
              className={`group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-outline-variant/40 bg-surface-container-low/40 hover:border-primary/60 hover:bg-surface-container-low'
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shadow-xs">
                <Icon name="cloud_upload" size={26} />
              </div>
              <p className="mt-2.5 text-body-sm font-bold text-on-surface">
                {fileName || 'Tarik & lepas file Kaldik, atau '}
                <span className="text-primary underline ml-1">Telusuri File</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 border border-red-500/25 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:text-red-300">
                  <Icon name="picture_as_pdf" size={12} /> PDF
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300">
                  <Icon name="image" size={12} /> PNG/JPG
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  <Icon name="table_view" size={12} /> Excel/CSV
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                  <Icon name="data_object" size={12} /> JSON
                </span>
              </div>
            </div>

            {/* Preset Quick Load */}
            <div className="flex flex-col justify-center gap-2.5 rounded-3xl border border-outline-variant/20 bg-surface-container-low/40 p-5 text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-xs">
                <Icon name="auto_awesome" size={26} />
              </div>
              <p className="text-body-sm font-bold text-on-surface">Muat Preset Contoh Madani</p>
              <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                Contoh lengkap Kalender Pendidikan Universitas Madani T.A. 2026/2027.
              </p>
              <Button
                type="button"
                variant="tonal"
                onClick={loadMadaniPreset}
                className="justify-center font-bold"
              >
                <Icon name="download" size={16} className="mr-1" />
                Muat Preset
              </Button>
            </div>
          </div>

          {/* Parsing Progress */}
          {loading && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 animate-fade-in shrink-0">
              <div className="flex items-center justify-between text-body-xs font-bold text-primary">
                <span>{progressState.stage || 'Memproses...'}</span>
                <span>{progressState.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressState.progress}%` }} />
              </div>
            </div>
          )}

          {/* Error / Warnings */}
          {errorMsg && (
            <div className="rounded-2xl bg-error/10 border border-error/25 p-3.5 text-body-xs font-semibold text-error flex items-start gap-2 animate-fade-in shrink-0">
              <Icon name="error" size={18} className="shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}
          {!errorMsg && warnings.length > 0 && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-body-xs font-semibold text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-fade-in shrink-0">
              <Icon name="warning" size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Stats + Add Manual */}
          {events.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/25 px-2.5 py-1 text-body-xs font-bold text-primary">
                <Icon name="event" size={14} />
                <span>{stats.total} Event</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 text-body-xs font-bold text-blue-700 dark:text-blue-300">
                <Icon name="looks_one" size={14} />
                <span>{stats.ganjil} Ganjil</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-body-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Icon name="looks_two" size={14} />
                <span>{stats.genap} Genap</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-500/15 border border-slate-500/25 px-2.5 py-1 text-body-xs font-bold text-slate-700 dark:text-slate-300">
                <Icon name="schedule" size={14} />
                <span>{stats.antar} Antar/Umum</span>
              </div>
              <button
                type="button"
                onClick={handleAddManual}
                className="ml-auto inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 text-body-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <Icon name="add" size={14} />
                Tambah Manual
              </button>
            </div>
          )}

          {/* Derived Bounds Preview */}
          {derivedBounds && (
            <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-3 text-body-xs font-medium text-on-surface-variant shrink-0">
              <p className="font-bold text-secondary mb-1.5 flex items-center gap-1.5">
                <Icon name="tune" size={14} />
                Batas Otomatis (diturunkan dari event):
              </p>
              <div className="grid grid-cols-2 tablet:grid-cols-4 gap-2">
                {derivedBounds.ganjilStart && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Ganjil Mulai</span>
                    <p className="font-mono text-[11px] font-bold text-on-surface">{derivedBounds.ganjilStart.day}/{derivedBounds.ganjilStart.month + 1}</p>
                  </div>
                )}
                {derivedBounds.ganjilEnd && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Ganjil Selesai</span>
                    <p className="font-mono text-[11px] font-bold text-on-surface">{derivedBounds.ganjilEnd.day}/{derivedBounds.ganjilEnd.month + 1}</p>
                  </div>
                )}
                {derivedBounds.genapStart && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Genap Mulai</span>
                    <p className="font-mono text-[11px] font-bold text-on-surface">{derivedBounds.genapStart.day}/{derivedBounds.genapStart.month + 1}</p>
                  </div>
                )}
                {derivedBounds.genapEnd && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Genap Selesai</span>
                    <p className="font-mono text-[11px] font-bold text-on-surface">{derivedBounds.genapEnd.day}/{derivedBounds.genapEnd.month + 1}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {events.length > 0 && (
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xs">
              <table className="w-full table-fixed text-left border-collapse text-body-xs min-w-[720px]">
                <thead className="sticky top-0 z-10 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md border-b border-outline-variant/15 shadow-2xs">
                  <tr>
                    <th className="w-[30%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Nama Event</th>
                    <th className="w-[17%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Tanggal</th>
                    <th className="w-[11%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Semester</th>
                    <th className="w-[14%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Kategori</th>
                    <th className="w-[6%] px-2 py-2 text-label-caps uppercase font-bold text-on-surface-variant text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-medium text-on-surface">
                  {events.map((event, idx) => {
                    const isEditing = editingIdx === idx
                    return (
                      <tr key={idx} className="group hover:bg-surface-container-low/60 transition-colors">
                        {/* Nama */}
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDraft?.nama || ''}
                              onChange={(e) => handleEditField('nama', e.target.value)}
                              className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                            />
                          ) : (
                            <span
                              onClick={() => startEdit(idx)}
                              className="font-semibold text-on-surface cursor-text hover:underline line-clamp-2"
                              title="Klik untuk edit"
                            >
                              {event.nama}
                            </span>
                          )}
                        </td>

                        {/* Tanggal */}
                        <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="date"
                                value={editDraft?.tanggalMulai || ''}
                                onChange={(e) => handleEditField('tanggalMulai', e.target.value)}
                                className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-mono font-semibold"
                              />
                              <input
                                type="date"
                                value={editDraft?.tanggalSelesai || ''}
                                onChange={(e) => handleEditField('tanggalSelesai', e.target.value)}
                                className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-mono font-semibold"
                              />
                            </div>
                          ) : (
                            <span onClick={() => startEdit(idx)} className="cursor-text hover:underline font-semibold">
                              {formatEventDateRange(event)}
                            </span>
                          )}
                        </td>

                        {/* Semester */}
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <FormSelect
                              value={editDraft?.semester || 'antar'}
                              onChange={(val) => handleEditField('semester', val)}
                              options={[
                                { value: 'ganjil', label: 'Ganjil' },
                                { value: 'genap', label: 'Genap' },
                                { value: 'antar', label: 'Antar / Libur' },
                              ]}
                            />
                          ) : (
                            <span
                              onClick={() => startEdit(idx)}
                              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold cursor-pointer hover:underline ${
                                event.semester === 'ganjil'
                                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                  : event.semester === 'genap'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                              }`}
                            >
                              {semesterLabel(event.semester)}
                            </span>
                          )}
                        </td>

                        {/* Kategori */}
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <FormSelect
                              value={editDraft?.kategori || 'kegiatan'}
                              onChange={(val) => handleEditField('kategori', val)}
                              options={KATEGORI_OPTIONS}
                            />
                          ) : (
                            <span
                              onClick={() => startEdit(idx)}
                              className="inline-flex items-center rounded-lg bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface cursor-pointer hover:underline"
                            >
                              {kategoriLabel(event.kategori)}
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-2 py-2 text-right">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-end">
                              <button type="button" onClick={saveEdit} className="rounded-lg p-1 text-primary hover:bg-primary/10 cursor-pointer" title="Simpan">
                                <Icon name="check" size={16} />
                              </button>
                              <button type="button" onClick={cancelEdit} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer" title="Batal">
                                <Icon name="close" size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 justify-end">
                              <button type="button" onClick={() => startEdit(idx)} className="rounded-lg p-1 text-on-surface-variant hover:bg-primary/10 hover:text-primary cursor-pointer" title="Edit">
                                <Icon name="edit" size={15} />
                              </button>
                              <button type="button" onClick={() => handleDelete(idx)} className="rounded-lg p-1 text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer" title="Hapus">
                                <Icon name="delete" size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {events.length === 0 && !loading && !errorMsg && (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="event_note" size={30} />
              </span>
              <p className="mt-3 text-body-sm font-bold text-on-surface">Belum ada event</p>
              <p className="text-body-xs font-medium text-on-surface-variant max-w-md mt-1">
                Unggah file Kaldik (PDF/Gambar) atau muat preset untuk mulai mengimpor kalender akademik.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busySaving}>
              Batal
            </Button>
            <div className="flex items-center gap-2">
              {existingEvents.length > 0 && (
                <span className="text-[11px] font-medium text-on-surface-variant hidden tablet:inline">
                  Akan menggantikan {existingEvents.length} event lama
                </span>
              )}
              <Button
                type="button"
                onClick={handleImport}
                disabled={busySaving || events.length === 0}
                className="font-bold"
              >
                {busySaving ? (
                  <Icon name="progress_activity" size={16} className="mr-1.5 animate-spin" />
                ) : (
                  <Icon name="save" size={16} className="mr-1.5" />
                )}
                {busySaving ? 'Menyimpan...' : 'Import ke Database'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
