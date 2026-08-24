import { useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Skeleton } from '../../components/Skeleton'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { backendReady } from '../../lib/adminData'
import { parseWorkbook } from '../../lib/xlsxParser'
import {
  validateScheduleEntry,
  validateCourseEntry,
  findConflicts,
  findUnmatchedCourseCodes,
} from '../../lib/uploadValidator'
import { publishAllDrafts, appendHistory, saveSettings, deriveTahunAjaran } from '../../lib/publishHelpers'
import { setDocument, addDocument } from '../../lib/adminData'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function UploadImport() {
  const { data: existingCourses } = useFirestore('mataKuliah')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const fileInputRef = useRef(null)
  const [parsed, setParsed] = useState(null) // { scheduleEntries, courses, exams, warnings }
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  /** Ringkasan validasi gabungan: baris error + bentrok + kode MK tak dikenal. */
  const validation = useMemo(() => {
    if (!parsed) return null
    const entryErrors = parsed.scheduleEntries
      .map((entry, index) => ({ index, entry, errors: validateScheduleEntry(entry) }))
      .filter((r) => r.errors.length > 0)
    const courseErrors = parsed.courses
      .map((course, index) => ({ index, course, errors: validateCourseEntry(course) }))
      .filter((r) => r.errors.length > 0)
    const conflicts = findConflicts(parsed.scheduleEntries)
    // Kode MK dikenal = sudah ada di Firestore ATAU ada di sheet daftar MK.
    const knownCodes = new Set([
      ...existingCourses.map((c) => c.kodeMK),
      ...parsed.courses.map((c) => c.kodeMK),
    ])
    const unmatched = findUnmatchedCourseCodes(parsed.scheduleEntries, [...knownCodes].map((kodeMK) => ({ kodeMK })))
    return { entryErrors, courseErrors, conflicts, unmatched }
  }, [parsed, existingCourses])

  const canPublish =
    validation &&
    validation.entryErrors.length === 0 &&
    validation.courseErrors.length === 0 &&
    validation.conflicts.length === 0

  async function handleFile(file) {
    setError('')
    setBanner(null)
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setError('Ukuran file melebihi 10MB.')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const result = parseWorkbook(buffer)
      if (result.scheduleEntries.length === 0 && result.courses.length === 0 && result.exams.length === 0) {
        setError('Tidak ada data terbaca. Pastikan sheet "Jadwal Perkuliahan" dan "Daftar Mata Kuliah" tersedia.')
        return
      }
      setFileName(file.name)
      setParsed(result)
    } catch (err) {
      setError(`Gagal membaca file: ${err?.message ?? err}`)
    }
  }

  async function saveAll({ publish }) {
    if (!parsed) return
    setBusy(true)
    let savedEntries = 0
    let savedCourses = 0
    let failed = 0
    let firstError = ''

    for (const course of parsed.courses) {
      const result = await setDocument('mataKuliah', course.kodeMK.toUpperCase(), course, actor)
      if (result.ok) savedCourses += 1
      else { failed += 1; if (!firstError) firstError = result.error ?? 'unknown' }
    }

    for (const entry of parsed.scheduleEntries) {
      const result = await addDocument(
        'jadwal',
        {
          ...entry,
          semester: Number(entry.semester),
          tahunAjaran: parsed.tahunAjaran ?? deriveTahunAjaran(),
          status: 'draft',
        },
        actor,
      )
      if (result.ok) savedEntries += 1
      else { failed += 1; if (!firstError) firstError = result.error ?? 'unknown' }
    }

    for (const exam of parsed.exams) {
      const result = await addDocument('ujian', { ...exam, status: 'draft' }, actor)
      if (result.ok) savedEntries += 1
      else { failed += 1; if (!firstError) firstError = result.error ?? 'unknown' }
    }

    await appendHistory({
      entitas: 'jadwal',
      field: 'upload',
      nilaiLama: null,
      nilaiBaru: `${savedEntries} entri dari ${fileName}`,
      aktor: actor,
      detail: `Import file: ${savedCourses} MK baru/diperbarui, ${savedEntries} jadwal+ujian draft`,
    })
    await saveSettings({ lastFileName: fileName, lastUploadedAt: new Date().toISOString() })

    if (failed === 0 && publish && canPublish) {
      const pubResult = await publishAllDrafts('jadwal', actor)
      if (!pubResult.ok) {
        setBanner({ ok: false, message: `Draft tersimpan tapi publikasi gagal: ${pubResult.error}` })
        setBusy(false)
        setParsed(null)
        setFileName('')
        return
      }
    }

    setBanner({
      ok: failed === 0,
      message:
        failed === 0
          ? `${savedCourses} mata kuliah & ${savedEntries} entri jadwal/ujian disimpan sebagai draft${publish ? ' + dipublikasikan' : ''}.`
          : `${failed} dokumen gagal disimpan. Penyebab: ${firstError}`,
    })
    setBusy(false)
    setParsed(null)
    setFileName('')
  }

  function reset() {
    setParsed(null)
    setFileName('')
    setError('')
  }

  return (
    <div className="space-y-lg">
      <header>
        <div className="flex items-center gap-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container/50 dark:bg-primary-container/25 text-primary">
            <Icon name="upload_file" size={26} />
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">Import Data Master</h2>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          Unggah spreadsheet jadwal kampus (.xlsx / .csv) — divalidasi sebelum masuk database.
        </p>
      </header>

      {!backendReady() && (
        <div className="flex items-start gap-sm rounded-lg border border-tertiary/30 bg-tertiary/10 p-md text-body-sm text-tertiary">
          <Icon name="info" size={20} className="mt-xs shrink-0" />
          <p>Mode demo: hasil parsing bisa dipratinjau, tapi penyimpanan ke Firestore dinonaktifkan.</p>
        </div>
      )}

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Dropzone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={`relative flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed bg-surface-container-lowest px-md py-xl transition-colors dark:bg-surface-container-high ${
          dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary'
        }`}
      >
        <Icon name="cloud_upload" size={48} className={dragOver ? 'text-primary' : 'text-outline'} />
        <p className="mt-sm text-center text-title-md text-on-surface">
          Tarik & lepas file di sini, atau klik untuk browse
        </p>
        <p className="mt-xs max-w-md text-center text-body-sm text-on-surface-variant">
          Gunakan format resmi spreadsheet kampus. Ukuran maksimal file 10MB.
        </p>
      </button>

      {error && (
        <div className="flex items-start gap-sm rounded-lg border border-error/20 bg-error-container/50 p-md text-body-sm text-on-error-container">
          <Icon name="warning" size={20} className="mt-xs shrink-0 text-error" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview & validasi */}
      {parsed && (
        <>
          {/* Ringkasan validasi */}
          <div
            className={`rounded-lg border p-md ${
              canPublish
                ? 'border-primary/30 bg-primary/10'
                : 'border-error/20 bg-error-container/40'
            }`}
          >
            <h4 className="flex items-center gap-xs text-title-md text-on-surface">
              <Icon name={canPublish ? 'check_circle' : 'warning'} size={20} className={canPublish ? 'text-primary' : 'text-error'} />
              Hasil Validasi — {fileName}
            </h4>
            <ul className="mt-sm space-y-xs text-body-sm text-on-surface-variant">
              <li>{parsed.scheduleEntries.length} entri jadwal terbaca</li>
              <li>{parsed.courses.length} mata kuliah terbaca</li>
              {parsed.exams.length > 0 && <li>{parsed.exams.length} jadwal ujian terbaca</li>}
              {validation.entryErrors.length > 0 && (
                <li className="font-semibold text-error">{validation.entryErrors.length} baris jadwal tidak valid</li>
              )}
              {validation.courseErrors.length > 0 && (
                <li className="font-semibold text-error">{validation.courseErrors.length} mata kuliah tidak valid</li>
              )}
              {validation.conflicts.length > 0 && (
                <li className="font-semibold text-error">{validation.conflicts.length} bentrok jam terdeteksi</li>
              )}
              {validation.unmatched.length > 0 && (
                <li className="font-semibold text-error">
                  Kode MK tak dikenal: {validation.unmatched.slice(0, 10).join(', ')}
                  {validation.unmatched.length > 10 && '…'}
                </li>
              )}
            </ul>
            {canPublish && (
              <p className="mt-sm flex items-center gap-xs text-body-sm font-medium text-primary">
                <Icon name="verified" size={16} /> Semua valid — siap dipublikasikan.
              </p>
            )}
          </div>

          {/* Tabel pratinjau jadwal */}
          <PreviewTable title="Jadwal Kuliah (pratinjau)" rows={previewRows(parsed.scheduleEntries, validation)} />

          {/* Aksi bawah */}
          <div className="flex justify-end gap-md border-t border-surface-variant pt-lg">
            <Button variant="secondary" onClick={reset} disabled={busy}>
              Batal
            </Button>
            <Button variant="secondary" onClick={() => saveAll({ publish: false })} disabled={busy}>
              <Icon name="save" size={20} />
              Simpan sebagai Draft
            </Button>
            <Button onClick={() => saveAll({ publish: true })} disabled={busy || !canPublish || !backendReady()}>
              <Icon name="publish" size={20} />
              Publikasikan ke Mahasiswa
            </Button>
          </div>
        </>
      )}

      {!parsed && busy && (
        <Skeleton className="h-24 w-full" />
      )}
    </div>
  )
}

/** Bentuk baris tabel pratinjau + status valid per baris. */
function previewRows(entries, validation) {
  const errorIndexes = new Set(validation?.entryErrors.map((r) => r.index))
  return entries.slice(0, 100).map((entry, index) => ({
    key: `${index}-${entry.kodeMK}-${entry.jamMulai}`,
    valid: !errorIndexes.has(index),
    errors: validation?.entryErrors.find((r) => r.index === index)?.errors ?? [],
    cells: [entry.hari, `${entry.jamMulai ?? '-'} – ${entry.jamSelesai ?? '-'}`, entry.kodeMK, entry.prodi, `Sem ${entry.semester}`, entry.ruang, entry.tipeKelas],
  }))
}

const PREVIEW_HEADERS = ['Status', 'Hari', 'Waktu', 'Kode MK', 'Prodi', 'Sem', 'Ruang', 'Tipe']

function PreviewTable({ title, rows }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface-container-lowest dark:bg-surface-container-low">
      <div className="border-b border-surface-variant px-lg py-sm">
        <h3 className="text-title-md text-on-surface">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-lg py-md text-body-sm text-on-surface-variant">Tidak ada baris.</p>
      ) : (
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="sticky top-0 bg-surface-container-lowest dark:bg-surface-container-high">
              <tr className="border-b border-outline-variant">
                {PREVIEW_HEADERS.map((header) => (
                  <th key={header} className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b border-surface-variant last:border-b-0 ${
                    row.valid ? '' : 'bg-error-container/20'
                  }`}
                  title={row.valid ? '' : row.errors.join('. ')}
                >
                  <td className="px-md py-sm">
                    <span
                      className={`inline-flex items-center gap-xs rounded px-2 py-1 text-xs font-medium ${
                        row.valid
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'border border-error/20 bg-error/10 text-error'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${row.valid ? 'bg-primary' : 'bg-error'}`} />
                      {row.valid ? 'Valid' : 'Error'}
                    </span>
                  </td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="whitespace-nowrap px-md py-sm font-mono text-xs text-on-surface">
                      {String(cell ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length >= 100 && (
        <p className="border-t border-surface-variant px-md py-sm text-body-sm text-on-surface-variant">
          Menampilkan 100 baris pertama.
        </p>
      )}
    </div>
  )
}
