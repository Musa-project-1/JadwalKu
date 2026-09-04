import { memo } from 'react'
import { Icon } from '../../Icon'
import { formatWhatsAppUrl, parseLecturers } from '../../../lib/lecturerUtils'
import { getCourseSemester } from '../../../lib/courseUtils'

function CourseCardsImpl({ courses, onEdit, onDelete }) {
  return (
    <div className="space-y-2.5 tablet:hidden overflow-y-auto flex-1 min-h-0">
      {courses.map((course) => {
        const waUrl = formatWhatsAppUrl(course.kontakDosen)
        const semester = getCourseSemester(course)
        const lecturerList = parseLecturers(course.dosen)

        return (
          <div
            key={course.id}
            className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4 shadow-2xs dark:bg-surface-container-high/30 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-xl bg-primary/10 px-2.5 py-0.5 font-mono text-label-caps font-bold text-primary border border-primary/20">
                    {course.kodeMK}
                  </span>
                  {semester && (
                    <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2 py-0.5 text-label-caps font-bold text-indigo-700 dark:text-indigo-400">
                      Sem. {semester}
                    </span>
                  )}
                </div>
                <h3 className="text-body-md font-bold text-on-surface mt-1.5 leading-snug">
                  {course.namaMK}
                </h3>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(course)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/10 hover:text-primary cursor-pointer"
                  aria-label="Edit"
                >
                  <Icon name="edit" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(course)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer"
                  aria-label="Hapus"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            </div>

            {/* Mobile Lecturer Display */}
            <div className="text-body-sm text-on-surface-variant">
              {lecturerList.length === 0 ? (
                <p className="text-body-xs text-on-surface-variant/50">Dosen belum diisi</p>
              ) : lecturerList.length === 1 ? (
                <div className="flex items-center gap-2">
                  <Icon name="person" size={16} className="text-secondary shrink-0" />
                  <span className="font-semibold text-on-surface truncate">{lecturerList[0]}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-secondary font-bold text-body-xs">
                    <Icon name="groups" size={16} />
                    <span>Tim {lecturerList.length} Dosen:</span>
                  </div>
                  <ul className="text-body-xs font-medium text-on-surface pl-5 list-disc space-y-0.5">
                    {lecturerList.map((docName, idx) => (
                      <li key={idx}>{docName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/10">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-surface-container px-2 py-0.5 text-label-caps font-bold text-on-surface">
                  {course.sks} SKS
                </span>
                <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-label-caps font-medium text-on-surface-variant">
                  {course.durasi} mnt
                </span>
              </div>

              {course.kontakDosen && (
                <a
                  href={waUrl || `tel:${course.kontakDosen}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-label-caps font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-500/20"
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
