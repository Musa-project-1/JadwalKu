import { useState, useRef, useEffect, memo } from 'react'
import { Icon } from '../../Icon'
import { getClassType, TONE_CLASSES, TONE_ICONS } from '../../../lib/classTypes'
import { formatRuang } from '../../../lib/scheduleUtils'
import { getProdiColorClasses } from '../../../lib/prodiColors'

/**
 * ScheduleTable - Redesigned for zero horizontal scroll & strict visual consistency
 * Features:
 * - table-fixed with percentage colgroup (100% total, fits any container without scroll)
 * - Uniform header: bg-surface-container-low/90, 11px uppercase, text-on-surface-variant/75, font-medium
 * - Monospace code badge with rounded-md
 * - Unified 3-dots action menu with Edit, Duplikat, Hapus, and Multi-prodi actions
 * - Prodi: 1 prodi shows clear badge; multi-prodi shows '[N] prodi' with hover/click expand
 * - Typo fix: Hari normalized to proper title case (Senin, bukan SenIn)
 * - Row padding: py-[9px] px-2.5/3, border-top: 0.5px solid var(--border)
 */
function ScheduleTableImpl({
  paginatedGroups,
  courseMap,
  conflictMap,
  selectedIds,
  filteredScheduleCount,
  expandedGroups,
  onToggleSelectAll,
  onToggleSelectGroup,
  onToggleExpandGroup,
  onOpenEdit,
  onOpenGroupEdit,
  onDuplicate,
  onDeleteSingle,
  onDeleteGroup,
}) {
  const allSelected = selectedIds.size === filteredScheduleCount && filteredScheduleCount > 0
  const [activeMenuKey, setActiveMenuKey] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuKey(null)
      }
    }
    if (activeMenuKey) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenuKey])

  function formatHari(hari) {
    if (!hari) return '-'
    const s = String(hari).trim()
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }

  return (
    <div className="hidden overflow-hidden flex-1 min-h-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low w-full">
      <table className="w-full table-fixed text-left border-collapse">
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '31%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '6%' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-outline-variant/15 bg-surface-container-low/90 dark:bg-surface-container-high/90">
            <th className="px-2 py-2 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded cursor-pointer"
                aria-label="Pilih Semua"
              />
            </th>
            <th className="px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant font-medium tracking-wider">
              Hari & Waktu
            </th>
            <th className="px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant font-medium tracking-wider">
              Prodi & Sem
            </th>
            <th className="px-3 py-2 text-[10.5px] uppercase text-on-surface-variant font-medium tracking-wider">
              Mata Kuliah & Dosen
            </th>
            <th className="px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant font-medium tracking-wider">
              Ruang / Tipe
            </th>
            <th className="px-2 py-2 text-[10.5px] uppercase text-on-surface-variant text-center font-medium tracking-wider">
              Status
            </th>
            <th className="px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant text-right font-medium tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {paginatedGroups.map((group) => {
            const item = group.items[0]
            const course = courseMap.get(item.kodeMK)
            const ct = getClassType(item.tipeKelas)
            const groupIds = group.items.map((it) => it.id)
            const isAllGroupSelected = groupIds.every((id) => selectedIds.has(id))
            const isSomeGroupSelected = groupIds.some((id) => selectedIds.has(id))
            const anyClash = group.items.some((it) => conflictMap.has(it.id))
            const isExpanded = expandedGroups.has(group.key)
            const isMenuOpen = activeMenuKey === group.key
            const isMultiProdi = group.items.length > 1

            return (
              <tr
                key={group.key}
                className={`group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20 ${
                  isSomeGroupSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                } ${anyClash ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}
                style={{ borderTop: '0.5px solid var(--color-outline-variant, rgba(120, 120, 120, 0.15))' }}
              >
                {/* Checkbox */}
                <td className="px-2 py-1.5 text-center align-middle overflow-hidden">
                  <input
                    type="checkbox"
                    checked={isAllGroupSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !isAllGroupSelected && isSomeGroupSelected
                    }}
                    onChange={() => onToggleSelectGroup(group)}
                    className="rounded cursor-pointer"
                    aria-label={`Pilih grup ${item.kodeMK}`}
                  />
                </td>

                {/* Hari & Waktu */}
                <td className="px-2.5 py-1.5 align-middle overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
                    <span className="font-bold text-[11px] text-on-surface whitespace-nowrap">
                      {formatHari(item.hari)}
                    </span>
                    <span className="text-outline-variant/50 text-[10px]">·</span>
                    <span className="font-mono text-[10.5px] font-semibold text-on-surface-variant whitespace-nowrap">
                      {item.jamMulai}-{item.jamSelesai}
                    </span>
                  </div>
                  {(() => {
                    const clashList = group.items.flatMap((it) => conflictMap.get(it.id) || [])
                    if (clashList.length === 0) return null
                    const dedupedClashes = [
                      ...new Map(clashList.map((cc) => [cc.message, cc])).values(),
                    ]
                    return (
                      <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                        {dedupedClashes.slice(0, 1).map((c, idx) => (
                          <span
                            key={idx}
                            title={c.message}
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9.5px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 truncate"
                          >
                            <Icon name="warning" size={10} className="shrink-0" />
                            <span className="truncate">{c.type === 'room' ? 'Ruang Bentrok' : 'Bentrok'}</span>
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </td>

                {/* Prodi & Sem */}
                <td className="px-2.5 py-1.5 align-middle overflow-hidden">
                  {!isMultiProdi ? (
                    // Single Prodi: Badge Nama Prodi langsung (warna per prodi)
                    <span
                      title={`${item.prodi} — Semester ${item.semester}`}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold border max-w-full shadow-2xs ${getProdiColorClasses(item.prodi)}`}
                    >
                      <Icon name="school" size={11} className="shrink-0" />
                      <span className="truncate">{item.prodi}</span>
                      <span className="font-mono font-extrabold text-[9px] opacity-80 shrink-0">S{item.semester}</span>
                    </span>
                  ) : (
                    // Multi Prodi: Badge ringkas '[N] prodi' (var(--bg-pro))
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleExpandGroup(group.key)}
                        title={group.items.map((it) => `${it.prodi} S${it.semester}`).join(', ')}
                        className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10.5px] font-bold text-purple-700 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Icon name="groups" size={12} className="shrink-0" />
                        <span>{group.items.length} prodi</span>
                        <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={12} className="shrink-0" />
                      </button>
                    </div>
                  )}

                  {isExpanded && isMultiProdi && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {group.items.map((it) => (
                        <span
                          key={it.id}
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] shadow-2xs border ${getProdiColorClasses(it.prodi)}`}
                        >
                          <span className="font-bold truncate max-w-[90px]">{it.prodi} S{it.semester}</span>
                          <button
                            type="button"
                            onClick={() => onOpenEdit(it)}
                            className="hover:underline cursor-pointer ml-0.5"
                            title={`Edit ${it.prodi}`}
                          >
                            <Icon name="edit" size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Mata Kuliah & Dosen: Ellipsis anti-dorong */}
                <td className="px-3 py-1.5 align-middle overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    {/* Monospace Badge Kode MK */}
                    <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-2xs shrink-0">
                      {item.kodeMK}
                    </span>
                    <span
                      className="font-bold text-[11.5px] text-on-surface truncate"
                      title={course?.namaMK || item.kodeMK}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {course?.namaMK || item.kodeMK}
                    </span>
                  </div>
                  <div className="mt-0.5 leading-none">
                    <span
                      className="text-[10.5px] font-medium text-on-surface-variant truncate block min-w-0"
                      title={course?.dosen || item.dosen || 'Dosen belum ditentukan'}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {course?.dosen || item.dosen || 'Dosen belum ditentukan'}
                    </span>
                  </div>
                </td>

                {/* Ruang & Tipe */}
                <td className="px-2.5 py-1.5 align-middle overflow-hidden">
                  <div className="flex items-center gap-1 font-semibold text-[11px] text-on-surface min-w-0">
                    <Icon name="meeting_room" size={12} className="text-on-surface-variant shrink-0" />
                    <span
                      className="truncate"
                      title={formatRuang(item.ruang, item.tipeKelas)}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {formatRuang(item.ruang, item.tipeKelas)}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold mt-0.5 border shadow-2xs truncate max-w-full ${
                      TONE_CLASSES[ct.tone] || 'bg-surface-container text-on-surface-variant border-outline-variant/20'
                    }`}
                    title={ct.label}
                  >
                    <Icon name={TONE_ICONS[ct.tone] || 'corporate_fare'} size={11} className="shrink-0" />
                    <span className="truncate">{ct.label}</span>
                  </span>
                </td>

                {/* Status */}
                <td className="px-2 py-1.5 text-center align-middle overflow-hidden">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-bold border shadow-2xs whitespace-nowrap ${
                      (item.status || 'published') === 'published'
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {item.status || 'published'}
                  </span>
                </td>

                {/* Aksi: Single 3-Dots Menu */}
                <td className="px-2.5 py-1.5 text-right align-middle shrink-0 overflow-visible relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuKey(isMenuOpen ? null : group.key)
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer border border-outline-variant/20 shadow-2xs"
                      title="Menu Aksi"
                      aria-label={`Aksi jadwal ${item.kodeMK}`}
                    >
                      <Icon name="more_vert" size={16} />
                    </button>

                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container p-1 shadow-lg text-left animate-fade-in"
                      >
                        {isMultiProdi ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuKey(null)
                                onOpenGroupEdit(group)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              <Icon name="edit_note" size={14} />
                              <span>Edit Grup ({group.items.length} prodi)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuKey(null)
                                onToggleExpandGroup(group.key)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                            >
                              <Icon name="visibility" size={14} />
                              <span>Lihat Detail Semua Prodi</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuKey(null)
                              onOpenEdit(item)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Icon name="edit" size={14} />
                            <span>Edit Jadwal</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuKey(null)
                            onDuplicate(item)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          <Icon name="content_copy" size={14} />
                          <span>Duplikat Sesi</span>
                        </button>

                        <div className="my-1 border-t border-outline-variant/15" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuKey(null)
                            if (isMultiProdi) {
                              onDeleteGroup(group)
                            } else {
                              onDeleteSingle(item)
                            }
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold text-error hover:bg-error/10 transition-colors cursor-pointer"
                        >
                          <Icon name="delete" size={14} />
                          <span>{isMultiProdi ? 'Hapus Semua Grup' : 'Hapus Jadwal'}</span>
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

export const ScheduleTable = memo(ScheduleTableImpl)
export default ScheduleTable
