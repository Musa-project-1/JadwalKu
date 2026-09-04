import { memo } from 'react'
import { Icon } from '../../Icon'
import { formatRuang } from '../../../lib/scheduleUtils'
import { getProdiColorClasses } from '../../../lib/prodiColors'

function ScheduleCardsImpl({
  paginatedGroups,
  courseMap,
  conflictMap,
  selectedIds,
  expandedGroups,
  onToggleSelectGroup,
  onToggleExpandGroup,
  onOpenEdit,
  onOpenGroupEdit,
  onDuplicate,
  onDeleteSingle,
  onDeleteGroup,
}) {
  const MAX_BADGES_M = 3

  return (
    <div className="space-y-3 tablet:hidden">
      {paginatedGroups.map((group) => {
        const item = group.items[0]
        const course = courseMap.get(item.kodeMK)
        const groupIds = group.items.map((it) => it.id)
        const isAllGroupSelected = groupIds.every((id) => selectedIds.has(id))
        const isExpanded = expandedGroups.has(group.key)
        const anyClash = group.items.some((it) => conflictMap.get(it.id))

        return (
          <div
            key={group.key}
            className={`rounded-2xl border bg-surface-container-lowest p-4 space-y-3 dark:bg-surface-container-low shadow-xs transition-all ${
              isAllGroupSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-outline-variant/20'
            } ${anyClash ? 'border-red-500/40 bg-red-500/5' : ''}`}
          >
            {/* Header Row: Checkbox + Kode MK + Mata Kuliah + Action Toolbar */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isAllGroupSelected}
                  onChange={() => onToggleSelectGroup(group)}
                  className="mt-1 rounded cursor-pointer shrink-0"
                  aria-label={`Pilih grup ${item.kodeMK} (${group.items.length} prodi)`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-label-caps font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
                      {item.kodeMK}
                    </span>
                    <span className="font-bold text-body-sm text-on-surface truncate">
                      {course?.namaMK || item.kodeMK}
                    </span>
                  </div>
                  <p className="text-body-xs font-medium text-on-surface-variant mt-1 whitespace-normal break-words leading-snug flex items-start gap-1">
                    <Icon name="person" size={13} className="text-secondary shrink-0 mt-0.5" />
                    <span className="min-w-0">{course?.dosen || 'Dosen belum ditentukan'}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-surface-container/60 p-0.5 border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => onDuplicate(item)}
                  className="p-1 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                  title="Duplikat (wakil grup)"
                  aria-label="Duplikat"
                >
                  <Icon name="content_copy" size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenGroupEdit(group)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    group.items.length > 1
                      ? 'text-primary bg-primary/10 ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                  }`}
                  title={group.items.length > 1 ? `Edit GRUP (${group.items.length} prodi sekaligus)` : 'Edit'}
                  aria-label="Edit grup"
                >
                  <Icon name={group.items.length > 1 ? 'edit_note' : 'edit'} size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteGroup(group)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    group.items.length > 1
                      ? 'text-error bg-error/10 ring-1 ring-error/20'
                      : 'text-on-surface-variant hover:text-error hover:bg-surface-container-high'
                  }`}
                  title={group.items.length > 1 ? `Hapus GRUP (${group.items.length} prodi)` : 'Hapus'}
                  aria-label="Hapus grup"
                >
                  <Icon name="delete" size={15} />
                </button>
              </div>
            </div>

            {/* Details Row: Chips & Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-body-xs pt-1 border-t border-outline-variant/15">
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1 font-semibold text-on-surface">
                <Icon name="schedule" size={13} className="text-primary" />
                <span>{item.hari}, {item.jamMulai} - {item.jamSelesai}</span>
              </span>
              <span className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-700 dark:text-indigo-400">
                <Icon name="school" size={13} className="shrink-0" />
                <span className="flex flex-wrap gap-1 items-center">
                  {(isExpanded ? group.items : group.items.slice(0, MAX_BADGES_M)).map((it) => (
                    <span
                      key={it.id}
                      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] border whitespace-nowrap ${getProdiColorClasses(it.prodi)}`}
                    >
                      {it.prodi} S{it.semester}
                    </span>
                  ))}
                  {group.items.length > MAX_BADGES_M && !isExpanded && (
                    <button
                      type="button"
                      onClick={() => onToggleExpandGroup(group.key)}
                      className="rounded-md bg-surface-container px-1.5 py-0.5 text-[11px] border border-outline-variant/30 cursor-pointer"
                    >
                      +{group.items.length - MAX_BADGES_M} lainnya
                    </button>
                  )}
                  {isExpanded && group.items.length > MAX_BADGES_M && (
                    <button
                      type="button"
                      onClick={() => onToggleExpandGroup(group.key)}
                      className="text-primary underline text-[11px] cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <Icon name="expand_less" size={11} /> ciutkan
                    </button>
                  )}
                </span>
                {group.items.length > 1 && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Icon name="groups" size={11} /> {group.items.length} prodi
                  </span>
                )}
              </span>

              {/* Expand: per-prodi actions */}
              {isExpanded && group.items.length > 1 && (
                <div className="w-full flex flex-wrap gap-1 pt-1">
                  {group.items.map((it) => (
                    <span
                      key={it.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low border border-outline-variant/20 px-2 py-1 text-[11px]"
                    >
                      <span className="font-semibold">{it.prodi} S{it.semester}</span>
                      <button
                        type="button"
                        onClick={() => onOpenEdit(it)}
                        className="rounded p-0.5 text-primary hover:bg-primary/10 cursor-pointer"
                        title={`Edit ${it.prodi} saja`}
                      >
                        <Icon name="edit" size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSingle(it)}
                        className="rounded p-0.5 text-error hover:bg-error/10 cursor-pointer"
                        title={`Hapus ${it.prodi} saja`}
                      >
                        <Icon name="delete" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1 font-semibold text-on-surface-variant">
                <Icon name="meeting_room" size={13} />
                <span>{formatRuang(item.ruang, item.tipeKelas)}</span>
              </span>

              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ml-auto ${
                  (item.status || 'published') === 'published'
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-400'
                }`}
              >
                {item.status || 'published'}
              </span>
            </div>

            {/* Conflict details */}
            {(() => {
              const clashList = group.items.flatMap((it) => conflictMap.get(it.id) || [])
              if (clashList.length === 0) return null
              const dedupedClashes = [
                ...new Map(clashList.map((cc) => [cc.message, cc])).values(),
              ]
              return (
                <div className="space-y-1.5 pt-1.5 border-t border-error/20">
                  {dedupedClashes.map((c, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-1.5 rounded-xl p-2 text-body-xs font-semibold ${
                        c.type === 'room'
                          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                          : c.type === 'lecturer'
                          ? 'bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-500/30'
                          : 'bg-error/10 text-error border border-error/20'
                      }`}
                    >
                      <Icon
                        name={c.type === 'room' ? 'meeting_room' : c.type === 'lecturer' ? 'person' : 'groups'}
                        size={15}
                        className="shrink-0 mt-0.5"
                      />
                      <span className="text-[11px] leading-tight">{c.message}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}

export const ScheduleCards = memo(ScheduleCardsImpl)
