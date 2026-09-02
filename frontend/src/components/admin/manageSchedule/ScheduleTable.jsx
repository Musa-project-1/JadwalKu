import { memo } from 'react'
import { Icon } from '../../Icon'
import { getClassType, TONE_CLASSES, TONE_DOT_CLASSES } from '../../../lib/classTypes'
import { formatRuang } from '../../../lib/scheduleUtils'

const TONE_BORDER_LEFT = {
  offline: 'border-l-4 border-l-emerald-500',
  online: 'border-l-4 border-l-blue-500',
  hybrid: 'border-l-4 border-l-purple-500',
  combined: 'border-l-4 border-l-amber-500',
}

const TONE_CODE_BADGE = {
  offline: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25',
  online: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/25',
  hybrid: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/25',
  combined: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
}

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

  return (
    <div className="hidden overflow-x-auto overflow-y-auto flex-1 min-h-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low w-full">
      <table className="w-full table-fixed text-left border-collapse">
        <thead className="sticky top-0 z-20 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-xs">
          <tr className="border-b border-outline-variant/15">
            <th className="w-10 px-2 py-2 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded cursor-pointer"
                aria-label="Pilih Semua"
              />
            </th>
            <th className="w-36 px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant font-extrabold tracking-wider">
              Hari & Waktu
            </th>
            <th className="w-48 px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant font-extrabold tracking-wider">
              Prodi & Sem
            </th>
            <th className="px-3 py-2 text-[10.5px] uppercase text-on-surface-variant font-extrabold tracking-wider">
              Mata Kuliah & Dosen
            </th>
            <th className="w-40 px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant font-extrabold tracking-wider">
              Ruang / Tipe
            </th>
            <th className="w-24 px-2 py-2 text-[10.5px] uppercase text-on-surface-variant text-center font-extrabold tracking-wider">
              Status
            </th>
            <th className="w-28 px-2.5 py-2 text-[10.5px] uppercase text-on-surface-variant text-right font-extrabold tracking-wider">
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
            const borderLeftStyle = TONE_BORDER_LEFT[ct.tone] || 'border-l-4 border-l-primary'
            const codeBadgeStyle = TONE_CODE_BADGE[ct.tone] || 'bg-primary/10 text-primary border-primary/25'

            return (
              <tr
                key={group.key}
                className={`group transition-all hover:bg-surface-container-low/60 dark:hover:bg-surface-container-high/20 ${borderLeftStyle} ${
                  isSomeGroupSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                } ${anyClash ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}
              >
                {/* Checkbox */}
                <td className="w-10 px-2 py-2 text-center align-middle">
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
                <td className="w-36 px-2.5 py-2 align-middle">
                  <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
                    <span className="font-bold text-body-xs text-on-surface whitespace-nowrap">{item.hari}</span>
                    <span className="text-outline-variant/50 text-[10px]">·</span>
                    <span className="font-mono text-[11px] font-semibold text-on-surface-variant whitespace-nowrap">
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
                      <div className="flex flex-col gap-0.5 mt-1">
                        {dedupedClashes.map((c, idx) => (
                          <span
                            key={idx}
                            title={c.message}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                              c.type === 'room'
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                : c.type === 'lecturer'
                                ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30'
                                : 'bg-error/15 text-error border border-error/30'
                            }`}
                          >
                            <Icon
                              name={c.type === 'room' ? 'meeting_room' : c.type === 'lecturer' ? 'person' : 'groups'}
                              size={10}
                            />
                            <span>
                              {c.type === 'room' ? 'Ruang Bentrok' : c.type === 'lecturer' ? 'Dosen Bentrok' : 'Rombel Bentrok'}
                            </span>
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </td>

                {/* Prodi & Semester */}
                <td className="w-48 px-2.5 py-2 align-middle overflow-hidden">
                  <div className="flex flex-wrap gap-1 items-center">
                    {(() => {
                      const MAX_BADGES = 2
                      const visible = isExpanded ? group.items : group.items.slice(0, MAX_BADGES)
                      const hiddenCount = group.items.length - visible.length
                      return (
                        <>
                          {visible.map((it) => (
                            <span
                              key={it.id}
                              title={`${it.prodi} — Sem. ${it.semester}`}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 whitespace-nowrap shadow-2xs"
                            >
                              <Icon name="school" size={10} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                              <span className="truncate max-w-[85px]">{it.prodi}</span>
                              <span className="font-mono font-extrabold text-[9px] opacity-80">S{it.semester}</span>
                            </span>
                          ))}
                          {hiddenCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleExpandGroup(group.key)
                              }}
                              className="inline-flex items-center rounded-full bg-surface-container px-1.5 py-0.2 text-[9.5px] font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high cursor-pointer shadow-2xs shrink-0"
                              title={group.items.slice(MAX_BADGES).map((it) => `${it.prodi} S${it.semester}`).join(', ')}
                            >
                              +{hiddenCount}
                            </button>
                          )}
                          {isExpanded && group.items.length > MAX_BADGES && (
                            <button
                              type="button"
                              onClick={() => onToggleExpandGroup(group.key)}
                              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9.5px] font-bold text-primary hover:underline cursor-pointer shrink-0"
                            >
                              <Icon name="expand_less" size={11} /> ciutkan
                            </button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  {group.items.length > 1 && (
                    <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-500/25 shadow-2xs">
                      <Icon name="groups" size={10} /> {group.items.length} prodi
                    </span>
                  )}
                  {isExpanded && group.items.length > 1 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {group.items.map((it) => (
                        <span
                          key={it.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-surface-container border border-outline-variant/20 px-2 py-0.5 text-[10px] shadow-2xs"
                        >
                          <span className="font-bold">{it.prodi} S{it.semester}</span>
                          <button
                            type="button"
                            onClick={() => onOpenEdit(it)}
                            className="rounded p-0.5 text-primary hover:bg-primary/10 cursor-pointer"
                            title={`Edit ${it.prodi} saja`}
                          >
                            <Icon name="edit" size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSingle(it)}
                            className="rounded p-0.5 text-error hover:bg-error/10 cursor-pointer"
                            title={`Hapus ${it.prodi} saja`}
                          >
                            <Icon name="delete" size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Mata Kuliah & Dosen (Multi-Dosen aware, strict truncate to never push action buttons) */}
                <td className="px-3 py-2 align-middle overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <span className={`font-mono text-[10.5px] font-extrabold px-1.5 py-0.2 rounded-md border shadow-2xs shrink-0 ${codeBadgeStyle}`}>
                      {item.kodeMK}
                    </span>
                    <span className="font-bold text-body-xs text-on-surface truncate" title={course?.namaMK || item.kodeMK}>
                      {course?.namaMK || item.kodeMK}
                    </span>
                  </div>
                  <div className="flex items-center min-w-0 max-w-full mt-0.5">
                    <span
                      className="text-[11px] font-medium text-on-surface-variant truncate block min-w-0 flex-1"
                      title={course?.dosen || item.dosen || 'Dosen belum ditentukan'}
                    >
                      {course?.dosen || item.dosen || 'Dosen belum ditentukan'}
                    </span>
                  </div>
                </td>

                {/* Ruang & Tipe */}
                <td className="w-40 px-2.5 py-2 align-middle overflow-hidden">
                  <div className="flex items-center gap-1 font-semibold text-[11.5px] text-on-surface min-w-0">
                    <Icon name="meeting_room" size={13} className="text-on-surface-variant shrink-0" />
                    <span className="truncate" title={formatRuang(item.ruang, item.tipeKelas)}>
                      {formatRuang(item.ruang, item.tipeKelas)}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9.5px] font-bold mt-0.5 border shadow-2xs truncate max-w-full ${
                      TONE_CLASSES[ct.tone] || 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className={`h-1 w-1 rounded-full shrink-0 ${TONE_DOT_CLASSES[ct.tone] || 'bg-surface-variant'}`} />
                    <span className="truncate">{ct.label}</span>
                  </span>
                </td>

                {/* Status */}
                <td className="w-24 px-2 py-2 text-center align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.2 text-[9.5px] uppercase font-extrabold border shadow-2xs whitespace-nowrap ${
                      (item.status || 'published') === 'published'
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25'
                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25'
                    }`}
                  >
                    {item.status || 'published'}
                  </span>
                </td>

                {/* Aksi (Fixed width, never pushed or clipped) */}
                <td className="w-28 px-2.5 py-2 text-right align-middle shrink-0">
                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicate(item)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary/15 hover:text-secondary transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title="Duplikat (jadi sesi baru dari wakil grup)"
                    >
                      <Icon name="content_copy" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenGroupEdit(group)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer border shadow-2xs ${
                        group.items.length > 1
                          ? 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/30 ring-1 ring-primary/20'
                          : 'text-on-surface-variant hover:bg-primary/15 hover:text-primary border-outline-variant/15'
                      }`}
                      title={
                        group.items.length > 1
                          ? `Edit GRUP (${group.items.length} prodi sekaligus) — jam/dosen/ruang`
                          : 'Edit Jadwal'
                      }
                    >
                      <Icon name={group.items.length > 1 ? 'edit_note' : 'edit'} size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGroup(group)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer border shadow-2xs ${
                        group.items.length > 1
                          ? 'text-error bg-error/10 hover:bg-error/20 border-error/30 ring-1 ring-error/20'
                          : 'text-on-surface-variant hover:bg-error/15 hover:text-error border-outline-variant/15'
                      }`}
                      title={group.items.length > 1 ? `Hapus GRUP (${group.items.length} prodi sekaligus)` : 'Hapus Jadwal'}
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

export const ScheduleTable = memo(ScheduleTableImpl)
