import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../Icon'

function formatDateID(iso) {
  if (!iso) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function getEntityBadge(entity = '') {
  const lower = entity.toLowerCase()
  if (lower.includes('jadwal') && !lower.includes('ujian')) {
    return { label: 'JADWAL', style: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' }
  }
  if (lower.includes('mk') || lower.includes('mata kuliah') || lower.includes('dosen')) {
    return { label: 'MATA KULIAH', style: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' }
  }
  if (lower.includes('ujian') || lower.includes('uts') || lower.includes('uas')) {
    return { label: 'UJIAN', style: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' }
  }
  if (lower.includes('prodi') || lower.includes('program studi')) {
    return { label: 'PRODI', style: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' }
  }
  return { label: entity.toUpperCase() || 'SISTEM', style: 'bg-surface-variant/80 text-on-surface-variant border-outline-variant/30' }
}

export function FullHistoryModal({ historyList, onClose }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const filtered = useMemo(() => {
    return historyList.filter((item) => {
      const matchSearch =
        !search ||
        (item.entitas ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.detail ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.aktor ?? '').toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (filter === 'all') return true
      const entity = (item.entitas ?? '').toLowerCase()
      if (filter === 'jadwal') return entity.includes('jadwal') && !entity.includes('ujian')
      if (filter === 'ujian') return entity.includes('ujian')
      if (filter === 'mk') return entity.includes('mk') || entity.includes('mata kuliah') || entity.includes('dosen')
      if (filter === 'prodi') return entity.includes('prodi')
      return true
    })
  }, [historyList, filter, search])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 max-[599px]:items-end max-[599px]:p-0 animate-fade-in"
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 shadow-2xl overflow-hidden animate-fade-up max-[599px]:rounded-b-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 tablet:p-5 border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name="history" size={22} />
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">
                Seluruh Log Aktivitas Sistem
              </h3>
              <p className="text-body-xs text-on-surface-variant font-medium">
                {filtered.length} dari {historyList.length} total riwayat perubahan tercatat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 tablet:p-4 border-b border-outline-variant/15 flex flex-col tablet:flex-row gap-2.5 shrink-0 bg-surface-container-low/30">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari log berdasarkan aktor, detail aksi, entitas..."
              className="w-full pl-9 pr-3.5 py-1.5 tablet:py-2 text-body-xs bg-surface-container-lowest dark:bg-surface-container-high/40 border border-outline-variant/30 rounded-xl focus:border-primary focus:outline-none text-on-surface"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 tablet:pb-0 shrink-0">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'jadwal', label: 'Jadwal' },
              { id: 'mk', label: 'Mata Kuliah' },
              { id: 'ujian', label: 'Ujian' },
              { id: 'prodi', label: 'Prodi' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-label-caps font-bold transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Log List Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 tablet:p-5 space-y-2.5 min-h-[250px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <Icon name="search_off" size={32} className="opacity-50 mb-2" />
              <p className="text-body-xs font-semibold">Tidak ada log aktivitas yang cocok.</p>
            </div>
          ) : (
            filtered.map((entry) => {
              const badge = getEntityBadge(entry.entitas)
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/40 p-3 tablet:p-3.5 hover:border-primary/30 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border shrink-0 ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-body-xs font-bold text-on-surface truncate">
                        {entry.field?.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-medium">
                      <span className="flex items-center gap-1">
                        <Icon name="person" size={13} className="text-secondary" />
                        <span>{entry.aktor || 'Sistem'}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {entry.timestamp?.toDate
                          ? formatDateID(entry.timestamp.toDate().toISOString())
                          : formatDateID(entry.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-body-xs text-on-surface font-medium leading-relaxed break-words">
                    {entry.detail ??
                      `${entry.field}: ${JSON.stringify(entry.nilaiLama ?? '∅')} → ${JSON.stringify(
                        entry.nilaiBaru ?? '∅',
                      )}`}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 tablet:p-4 border-t border-outline-variant/15 flex justify-end shrink-0 bg-surface-container-low/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-body-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
