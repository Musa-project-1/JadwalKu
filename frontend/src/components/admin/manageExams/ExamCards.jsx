import { memo } from 'react'
import { Icon } from '../../Icon'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function ExamCardsImpl({
  paginatedExams,
  courseMap,
  onOpenEdit,
  onDeleteTarget,
}) {
  return (
    <div className="space-y-3 tablet:hidden overflow-y-auto flex-1 min-h-0">
      {paginatedExams.map((exam) => {
        const course = courseMap.get(String(exam.kodeMK).toUpperCase())
        const isPublished = (exam.status || 'published') === 'published'

        return (
          <div
            key={exam.id}
            className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-2xs dark:bg-surface-container-low space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center rounded-xl bg-primary/10 px-2.5 py-0.5 font-mono text-label-caps font-bold text-primary border border-primary/20">
                    {exam.kodeMK}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-label-caps font-bold ${
                      exam.jenis === 'UTS'
                        ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {exam.jenis}
                  </span>
                  <span className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    Sem. {exam.semester}
                  </span>
                </div>
                <h3 className="text-body-md font-bold text-on-surface mt-1.5 leading-snug">
                  {course?.namaMK || exam.kodeMK}
                </h3>
                <p className="text-body-xs text-on-surface-variant mt-0.5">
                  {exam.prodi} • {course?.dosen || 'Dosen pengampu'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onOpenEdit(exam)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary cursor-pointer border border-outline-variant/15"
                  aria-label="Edit"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTarget(exam)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer border border-outline-variant/15"
                  aria-label="Hapus"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/10 text-body-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Icon name="schedule" size={14} className="text-primary" />
                <span>
                  {exam.tanggal ? dateFormatter.format(new Date(`${exam.tanggal}T00:00:00`)) : '-'} • {exam.jam}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-surface-container px-2 py-0.5 text-label-caps font-semibold text-on-surface">
                  {exam.ruang || 'TBA'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const ExamCards = memo(ExamCardsImpl)
