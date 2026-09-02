import { memo } from 'react'
import { Icon } from '../../Icon'
import { formatWhatsAppUrl, parseLecturers } from '../../../lib/lecturerUtils'
import { getCourseSemester } from '../../../lib/courseUtils'

function CourseTableImpl({ courses, onEdit, onDelete }) {
  return (
    <div className="hidden overflow-x-auto overflow-y-auto flex-1 min-h-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low dark:border-outline-variant/15 w-full">
      <table className="w-full table-fixed text-left border-collapse">
        <thead className="sticky top-0 z-20 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-xs">
          <tr className="border-b border-outline-variant/15">
            <th className="w-28 px-3 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Kode MK
            </th>
            <th className="px-3 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Mata Kuliah
            </th>
            <th className="w-24 px-2.5 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold text-center">
              Semester
            </th>
            <th className="w-64 px-3 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Dosen Pengampu
            </th>
            <th className="w-36 px-2.5 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              Kontak
            </th>
            <th className="w-24 px-2 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold text-center">
              Bobot
            </th>
            <th className="w-20 px-2.5 py-2 text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold text-right">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {courses.map((course) => {
            const waUrl = formatWhatsAppUrl(course.kontakDosen)
            const semester = getCourseSemester(course)
            const lecturerList = parseLecturers(course.dosen)

            return (
              <tr
                key={course.id}
                className="group transition-all hover:bg-surface-container-low/60 dark:hover:bg-surface-container-high/20 border-l-4 border-l-primary"
              >
                {/* Kode MK */}
                <td className="w-28 px-3 py-2 align-middle">
                  <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-extrabold text-primary border border-primary/20 shadow-2xs">
                    {course.kodeMK}
                  </span>
                </td>

                {/* Nama MK (Inline Slim Compact) */}
                <td className="px-3 py-2 align-middle overflow-hidden">
                  <p className="font-bold text-body-xs text-on-surface leading-snug truncate" title={course.namaMK}>
                    {course.namaMK}
                  </p>
                </td>

                {/* Semester */}
                <td className="w-24 px-2.5 py-2 align-middle text-center">
                  {semester ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shadow-2xs">
                      Sem. {semester}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/40 text-[10.5px]">-</span>
                  )}
                </td>

                {/* Dosen Pengampu (Clean Name Truncate without Avatar Circle) */}
                <td className="w-64 px-3 py-2 align-middle overflow-hidden">
                  {lecturerList.length === 0 ? (
                    <span className="text-on-surface-variant/50 text-body-xs">-</span>
                  ) : (
                    <span className="text-[11.5px] font-semibold text-on-surface truncate block min-w-0" title={course.dosen}>
                      {course.dosen}
                    </span>
                  )}
                </td>

                {/* Kontak WhatsApp */}
                <td className="w-36 px-2.5 py-2 align-middle overflow-hidden">
                  {course.kontakDosen ? (
                    <a
                      href={waUrl || `tel:${course.kontakDosen}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer max-w-full truncate shadow-2xs"
                      title="Hubungi via WhatsApp"
                    >
                      <Icon name="chat" size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">{course.kontakDosen}</span>
                    </a>
                  ) : (
                    <span className="text-on-surface-variant/40 text-[10.5px] italic">Tidak ada kontak</span>
                  )}
                </td>

                {/* Bobot SKS & Durasi */}
                <td className="w-24 px-2 py-2 align-middle text-center">
                  <div className="inline-flex items-center gap-1">
                    <span className="font-extrabold text-[11px] text-on-surface whitespace-nowrap">
                      {course.sks || 2} SKS
                    </span>
                    <span className="text-outline-variant/40 text-[9.5px]">·</span>
                    <span className="font-mono text-[10px] font-medium text-on-surface-variant whitespace-nowrap">
                      {course.durasi || 100}m
                    </span>
                  </div>
                </td>

                {/* Aksi (Fixed width, compact circular buttons) */}
                <td className="w-20 px-2.5 py-2 text-right align-middle shrink-0">
                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEdit(course)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title={`Edit ${course.kodeMK}`}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(course)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title={`Hapus ${course.kodeMK}`}
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

const CourseTable = memo(CourseTableImpl)
export { CourseTable }
export default CourseTable
