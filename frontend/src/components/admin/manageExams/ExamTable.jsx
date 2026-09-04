import { memo } from 'react'
import { Icon } from '../../Icon'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function ExamTableImpl({
  paginatedExams,
  courseMap,
  selectedIds,
  filteredCount,
  onToggleSelectAll,
  onToggleSelectOne,
  onPublish,
  onOpenEdit,
  onDeleteTarget,
}) {
  const allSelected = selectedIds.size === filteredCount && filteredCount > 0

  return (
    <div className="hidden overflow-x-auto overflow-y-auto flex-1 min-h-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low w-full">
      <table className="w-full table-fixed text-left border-collapse">
        <thead className="sticky top-0 z-20 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-xs">
          <tr className="border-b border-outline-variant/15">
            <th className="w-10 px-2.5 py-2 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded cursor-pointer"
                aria-label="Pilih semua ujian"
              />
            </th>
            <th className="w-28 px-3 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Kode & Sesi
            </th>
            <th className="px-3.5 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Mata Kuliah & Dosen
            </th>
            <th className="w-36 px-2.5 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Prodi & Sem
            </th>
            <th className="w-48 px-3 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Jadwal & Jam
            </th>
            <th className="w-28 px-2.5 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Ruang / Mode
            </th>
            <th className="w-24 px-2 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold text-center">
              Status
            </th>
            <th className="w-24 px-3 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold text-right">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {paginatedExams.map((exam) => {
            const course = courseMap.get(String(exam.kodeMK).toUpperCase())
            const isSelected = selectedIds.has(exam.id)
            const isPublished = (exam.status || 'published') === 'published'

            let dateLabel = exam.tanggal
            if (exam.tanggal) {
              const d = new Date(exam.tanggal)
              if (!isNaN(d)) dateLabel = dateFormatter.format(d)
            }

            return (
              <tr
                key={exam.id}
                className={`group transition-all hover:bg-surface-container-low/60 dark:hover:bg-surface-container-high/20 border-l-4 ${
                  exam.jenis === 'UTS' ? 'border-l-indigo-600' : 'border-l-amber-600'
                } ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                {/* Checkbox */}
                <td className="w-10 px-2.5 py-2 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectOne(exam.id)}
                    className="rounded cursor-pointer"
                    aria-label={`Pilih ${exam.kodeMK}`}
                  />
                </td>

                {/* Kode MK + Sesi Badge */}
                <td className="w-28 px-3 py-2 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-on-surface bg-surface-container-high/70 px-2 py-0.5 rounded-lg border border-outline-variant/30 shadow-2xs">
                      {exam.kodeMK}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[9.5px] font-extrabold uppercase ${
                        exam.jenis === 'UTS'
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {exam.jenis}
                    </span>
                  </div>
                </td>

                {/* Mata Kuliah & Dosen */}
                <td className="px-3.5 py-2 align-middle overflow-hidden">
                  <p className="font-bold text-body-xs text-on-surface truncate" title={course?.namaMK || exam.kodeMK}>
                    {course?.namaMK || exam.kodeMK}
                  </p>
                  <p className="text-[11px] font-medium text-on-surface-variant truncate" title={course?.dosen || 'Dosen pengampu'}>
                    {course?.dosen || 'Dosen pengampu'}
                  </p>
                </td>

                {/* Prodi & Semester */}
                <td className="w-36 px-2.5 py-2 align-middle overflow-hidden">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high/60 px-2.5 py-0.5 text-[10.5px] font-bold text-on-surface border border-outline-variant/15 max-w-full truncate shadow-2xs">
                    <span className="truncate">{exam.prodi}</span>
                    <span className="text-outline-variant/60 shrink-0">·</span>
                    <span className="shrink-0 font-extrabold">S{exam.semester}</span>
                  </span>
                </td>

                {/* Jadwal & Jam */}
                <td className="w-48 px-3 py-2 align-middle overflow-hidden">
                  <div className="flex items-center gap-1.5 text-body-xs font-semibold text-on-surface truncate">
                    <Icon name="calendar_today" size={13} className="text-primary shrink-0" />
                    <span className="truncate">{dateLabel}</span>
                  </div>
                  <p className="font-mono text-[10.5px] text-on-surface-variant font-medium truncate ml-4.5">
                    {exam.jam || '-'}
                  </p>
                </td>

                {/* Ruang / Mode */}
                <td className="w-28 px-2.5 py-2 align-middle overflow-hidden">
                  <p className="font-bold text-[11.5px] text-on-surface truncate">
                    {exam.ruang || 'Sesuai Jadwal'}
                  </p>
                  <span className="text-[10px] font-semibold text-on-surface-variant/80 truncate block">
                    {exam.mode || 'Offline'}
                  </span>
                </td>

                {/* Status */}
                <td className="w-24 px-2 py-2 align-middle text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase shadow-2xs ${
                      isPublished
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>

                {/* Aksi */}
                <td className="w-24 px-3 py-2 text-right align-middle shrink-0">
                  <div className="flex items-center justify-end gap-1 shrink-0">
                    {!isPublished && onPublish && (
                      <button
                        type="button"
                        onClick={() => onPublish(exam)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-500/15 transition-colors cursor-pointer border border-emerald-500/20 shadow-2xs"
                        title="Publikasikan Ujian"
                      >
                        <Icon name="check_circle" size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenEdit(exam)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title={`Edit Ujian ${exam.kodeMK}`}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTarget(exam)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title={`Hapus Ujian ${exam.kodeMK}`}
                    >
                      <Icon name="delete" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const ExamTable = memo(ExamTableImpl)
