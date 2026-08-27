import { useState, useMemo } from 'react'
import { Icon } from '../Icon'
import { useFirestore } from '../../hooks/useFirestore'
import { getItem, setItem } from '../../lib/storage'

const STORAGE_KEY_READ = 'readAnnouncements'

export function AnnouncementBanner({ currentProgram, currentSemester }) {
  const { data: announcements } = useFirestore('announcements')
  const [readIds, setReadIds] = useState(() => getItem(STORAGE_KEY_READ, []))
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const activeAnnouncements = useMemo(() => {
    if (!Array.isArray(announcements)) return []
    const now = new Date()
    const readSet = new Set(readIds)

    return announcements.filter((item) => {
      // Must be marked active
      if (item.aktif === false) return false

      // Filter read ones
      if (readSet.has(item.id)) return false

      // Check expiry date
      if (item.berlakuHingga) {
        const exp = new Date(`${item.berlakuHingga}T23:59:59`)
        if (!isNaN(exp.getTime()) && exp < now) return false
      }

      // Check target prodi
      if (
        item.targetProdi &&
        item.targetProdi !== 'all' &&
        currentProgram &&
        item.targetProdi !== currentProgram
      ) {
        return false
      }

      // Check target semester
      if (
        item.targetSemester &&
        item.targetSemester !== 'all' &&
        currentSemester &&
        Number(item.targetSemester) !== Number(currentSemester)
      ) {
        return false
      }

      return true
    })
  }, [announcements, readIds, currentProgram, currentSemester])

  function handleDismiss(id) {
    const next = [...readIds, id]
    setItem(STORAGE_KEY_READ, next)
    setReadIds(next)
  }

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (activeAnnouncements.length === 0) return null

  return (
    <div className="space-y-2.5 w-full">
      {activeAnnouncements.map((item) => {
        const isUrgent = item.kategori === 'urgent'
        const isWarning = item.kategori === 'warning'
        const isExpanded = expandedIds.has(item.id)

        let containerCls =
          'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200 dark:bg-blue-950/20'
        let iconBg = 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
        let iconName = 'campaign'
        let badgeLabel = 'Info Kampus'
        let badgeCls =
          'bg-blue-500/20 text-blue-800 dark:text-blue-200 border-blue-500/30'

        if (isUrgent) {
          containerCls =
            'bg-error/10 border-error/35 text-error-950 dark:text-error-100 dark:bg-error/20 animate-[pulse_3s_ease-in-out_infinite]'
          iconBg = 'bg-error/25 text-error dark:text-error-300'
          iconName = 'fmd_bad'
          badgeLabel = 'Darurat / Pindah Ruangan'
          badgeCls = 'bg-error/20 text-error border-error/30'
        } else if (isWarning) {
          containerCls =
            'bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-100 dark:bg-amber-950/25'
          iconBg = 'bg-amber-500/25 text-amber-800 dark:text-amber-300'
          iconName = 'published_with_changes'
          badgeLabel = 'Penting / Kuliah Pengganti'
          badgeCls =
            'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30'
        }

        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-3.5 shadow-xs transition-all ${containerCls} flex flex-col sm:flex-row sm:items-start justify-between gap-3`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-2xs`}
              >
                <Icon name={iconName} size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${badgeCls}`}
                  >
                    {badgeLabel}
                  </span>
                  {item.targetProdi && item.targetProdi !== 'all' && (
                    <span className="text-[11px] font-semibold opacity-75">
                      {item.targetProdi}
                      {item.targetSemester && item.targetSemester !== 'all'
                        ? ` · Sem. ${item.targetSemester}`
                        : ''}
                    </span>
                  )}
                  {item.berlakuHingga && (
                    <span className="text-[11px] opacity-75">
                      Berlaku s.d. {item.berlakuHingga}
                    </span>
                  )}
                </div>

                <h4 className="text-body-sm font-extrabold leading-snug">
                  {item.judul}
                </h4>

                {item.isi && (
                  <div className="mt-1">
                    <p
                      className={`text-body-xs opacity-90 leading-relaxed ${
                        !isExpanded && item.isi.length > 120 ? 'line-clamp-2' : ''
                      }`}
                    >
                      {item.isi}
                    </p>
                    {item.isi.length > 120 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="text-[11px] font-bold underline mt-1 opacity-90 hover:opacity-100 cursor-pointer"
                      >
                        {isExpanded ? 'Tutup Ringkasan' : 'Lihat Selengkapnya...'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDismiss(item.id)}
              className="self-end sm:self-start rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-black/10 transition-colors cursor-pointer shrink-0"
              title="Tandai sudah dibaca"
              aria-label="Tutup pengumuman"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

