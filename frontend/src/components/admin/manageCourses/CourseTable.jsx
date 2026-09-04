import { useState, useRef, useEffect, memo } from 'react'
import { Icon } from '../../Icon'
import { getCourseSemester } from '../../../lib/courseUtils'
import { getCourseCodeBadgeClass } from '../../../lib/prodiColors'

/**
 * CourseTable - Redesigned for zero horizontal scroll & strict visual consistency
 * Features:
 * - table-fixed with percentage colgroup (100% total, fits any container without scroll)
 * - Uniform header: bg-surface-container-low/90, 11px uppercase, text-on-surface-variant/75, font-medium
 * - Monospace code badge with rounded-md
 * - Unified 3-dots action menu with Edit, Copy WA, Delete
 * - SKS + Durasi formatted as '[X] SKS · [Y] menit' with 'menit' in muted text
 * - Strict overflow ellipsis on text cells
 */
function CourseTableImpl({ courses, onEdit, onDelete }) {
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null)
      }
    }
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenuId])

  return (
    <div className="hidden overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low w-full">
      <table className="w-full table-fixed text-left border-collapse">
        <colgroup>
          <col style={{ width: '14%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '6%' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-outline-variant/15 bg-surface-container-low/90 dark:bg-surface-container-high/90">
            <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
              Kode MK
            </th>
            <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
              Mata Kuliah
            </th>
            <th className="px-2.5 py-2.5 text-[11px] uppercase tracking-wider text-on-surface-variant font-medium text-center">
              Semester
            </th>
            <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
              Dosen Pengampu
            </th>
            <th className="px-2.5 py-2.5 text-[11px] uppercase tracking-wider text-on-surface-variant font-medium text-center">
              Bobot
            </th>
            <th className="px-2.5 py-2.5 text-[11px] uppercase tracking-wider text-on-surface-variant font-medium text-right">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {courses.map((course) => {
            const semester = getCourseSemester(course)
            const isMenuOpen = activeMenuId === course.id
            const durasiMenit = course.durasi || (course.sks ? course.sks * 50 : 100)

            return (
              <tr
                key={course.id}
                className="group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20"
                style={{ borderTop: '0.5px solid var(--color-outline-variant, rgba(120, 120, 120, 0.15))' }}
              >
                {/* Kode MK: Monospace badge rounded-md */}
                <td className="px-3 py-[9px] align-middle overflow-hidden">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold border shadow-2xs ${getCourseCodeBadgeClass(course.prodi, false, course.kodeMK)}`}>
                    {course.kodeMK}
                  </span>
                </td>

                {/* Nama MK: Ellipsis anti-dorong */}
                <td className="px-3 py-[9px] align-middle overflow-hidden">
                  <p
                    className="font-bold text-body-xs text-on-surface leading-snug truncate"
                    title={course.namaMK}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {course.namaMK}
                  </p>
                </td>

                {/* Semester */}
                <td className="px-2.5 py-[9px] align-middle text-center overflow-hidden">
                  {semester ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
                      Sem. {semester}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/40 text-[10.5px]">-</span>
                  )}
                </td>

                {/* Dosen Pengampu: Ellipsis anti-dorong */}
                <td className="px-3 py-[9px] align-middle overflow-hidden">
                  {!course.dosen ? (
                    <span className="text-on-surface-variant/50 text-body-xs italic">-</span>
                  ) : (
                    <span
                      className="text-[11.5px] font-medium text-on-surface truncate block min-w-0"
                      title={course.dosen}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {course.dosen}
                    </span>
                  )}
                </td>

                {/* Bobot: [X] SKS · [Y] menit */}
                <td className="px-2.5 py-[9px] align-middle text-center overflow-hidden">
                  <div className="inline-flex items-center gap-1 justify-center whitespace-nowrap">
                    <span className="font-extrabold text-[11px] text-on-surface">
                      {course.sks || 2} SKS
                    </span>
                    <span className="text-on-surface-variant/40 text-[10px]">·</span>
                    <span className="text-[10px] font-medium text-on-surface-variant/80">
                      {durasiMenit} menit
                    </span>
                  </div>
                </td>

                {/* Aksi: Menu 3-dots */}
                <td className="px-2.5 py-[9px] text-right align-middle shrink-0 overflow-visible relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuId(isMenuOpen ? null : course.id)
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer border border-outline-variant/20 shadow-2xs"
                      title="Menu Aksi"
                      aria-label={`Aksi untuk ${course.kodeMK}`}
                    >
                      <Icon name="more_vert" size={16} />
                    </button>

                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container p-1 shadow-lg text-left animate-fade-in"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            onEdit(course)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Icon name="edit" size={14} />
                          <span>Edit Mata Kuliah</span>
                        </button>

                        {course.kontakDosen && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              navigator.clipboard?.writeText(course.kontakDosen)
                              alert(`Nomor WA dosen disalin: ${course.kontakDosen}`)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <Icon name="chat" size={14} />
                            <span>Salin Nomor WA</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-outline-variant/15" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            onDelete(course)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-error hover:bg-error/10 transition-colors cursor-pointer"
                        >
                          <Icon name="delete" size={14} />
                          <span>Hapus Mata Kuliah</span>
                        </button>
                      </div>
                    )}
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

export const CourseTable = memo(CourseTableImpl)
export default CourseTable
