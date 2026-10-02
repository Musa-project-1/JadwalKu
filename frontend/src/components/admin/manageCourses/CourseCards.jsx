import { memo } from 'react'
import { Icon } from '../../Icon'
import { formatWhatsAppUrl, parseLecturers } from '../../../lib/lecturerUtils'
import { getCourseSemester } from '../../../lib/courseUtils'
import { getCourseCodeBadgeClass } from '../../../lib/prodiColors'

function CourseCardsImpl({ courses, onEdit, onDelete, selectedIds, onToggleSelectOne }) {
  return (
    <div className="space-y-2 tablet:hidden">
      {courses.map((course) => {
        const waUrl = formatWhatsAppUrl(course.kontakDosen)
        const semester = getCourseSemester(course)
        const lecturerList = parseLecturers(course.dosen)
        const isSelected = selectedIds?.has(course.id) ?? false

        return (
          <div
            key={course.id}
            className={`rounded-2xl border transition-colors p-3.5 shadow-level-1 space-y-2.5 ${
              isSelected
                ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                : 'border-outline-variant/30 dark:border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {onToggleSelectOne && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectOne(course.id)}
                    className="mt-1 rounded cursor-pointer shrink-0"
                    aria-label={`Pilih ${course.kodeMK}`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center rounded-md font-mono text-label-caps font-bold px-2 py-0.5 border shadow-2xs ${getCourseCodeBadgeClass(course.prodi, false, course.kodeMK)}`}>
                      {course.kodeMK}
                    </span>
                    {semester && (
                      <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-label-caps font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                        Sem. {semester}
                      </span>
                    )}
                  </div>
                  <h3 className="text-body-md font-bold text-on-surface mt-1 leading-snug line-clamp-2">
                    {course.namaMK}
                  </h3>
                </div>
              </div>

              {/* Action buttons cluster (1:1 with ScheduleCards) */}
              <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-surface-container/60 p-0.5 border border-outline-variant/20 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onEdit(course)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                  title="Edit Mata Kuliah"
                  aria-label="Edit"
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(course)}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Mata Kuliah"
                  aria-label="Hapus"
                >
                  <Icon name="delete" size={15} />
                </button>
              </div>
            </div>

            {/* Mobile Lecturer Display (with line-clamp-2 so titles are not clipped) */}
            <div className="text-body-sm text-on-surface-variant">
              {lecturerList.length === 0 ? (
                <p className="text-body-xs text-on-surface-variant/50">Dosen belum diisi</p>
              ) : lecturerList.length === 1 ? (
                <div className="flex items-start gap-1.5 text-body-xs font-semibold text-on-surface">
                  <Icon name="person" size={14} className="text-secondary shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-snug break-words">{lecturerList[0]}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-secondary font-bold text-body-xs">
                    <Icon name="groups" size={15} />
                    <span>Tim {lecturerList.length} Dosen:</span>
                  </div>
                  <ul className="text-body-xs font-medium text-on-surface pl-5 list-disc space-y-0.5">
                    {lecturerList.map((docName, idx) => (
                      <li key={idx} className="line-clamp-1">{docName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer Row (Pill styling matching ClassCard) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-bold text-on-surface border border-outline-variant/20">
                  {course.sks} SKS
                </span>
                <span className="inline-flex items-center rounded-full bg-surface-container-high/60 px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant border border-outline-variant/20">
                  {course.durasi} mnt
                </span>
              </div>

              {course.kontakDosen && (
                <a
                  href={waUrl || `tel:${course.kontakDosen}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <Icon name="chat" size={12} />
                  <span>{course.kontakDosen}</span>
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const CourseCards = memo(CourseCardsImpl)
export { CourseCards }
export default CourseCards
