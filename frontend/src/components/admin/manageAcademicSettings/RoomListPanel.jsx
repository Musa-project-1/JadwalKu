import { useState } from 'react'
import { Icon } from '../../Icon'
import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'

export function RoomListPanel({
  rooms = [],
  loadingRooms,
  onOpenAddModal,
  onEditRoom,
  onDeleteRoom,
  onAutoExtractFromSchedule,
  extracting,
}) {
  const [search, setSearch] = useState('')

  const filtered = rooms.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.namaRuang?.toLowerCase().includes(q) ||
      r.gedung?.toLowerCase().includes(q) ||
      r.petunjukArah?.toLowerCase().includes(q)
    )
  })

  return (
    <section className="h-full flex flex-col justify-between rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-xs dark:bg-surface-container-low min-h-0 space-y-3">
      <div className="flex-1 flex flex-col space-y-3 min-h-0">
        {/* Header Panel (Flex row across mobile & desktop with items-center justify-between) */}
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/15 pb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-xs">
              <Icon name="meeting_room" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base tablet:text-lg font-bold tracking-tight text-on-surface truncate">
                Master Denah & Ruangan ({rooms.length})
              </h2>
              <p className="text-[11.5px] font-medium text-on-surface-variant truncate">
                Lokasi gedung, lantai, fasilitas & panduan arah resmi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onAutoExtractFromSchedule && (
              <button
                type="button"
                onClick={onAutoExtractFromSchedule}
                disabled={extracting}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[11.5px] font-bold text-on-surface shadow-2xs hover:border-teal-600 hover:text-teal-700 cursor-pointer transition-colors"
                title="Ekstrak nama ruangan unik dari jadwal kuliah aktif"
              >
                <Icon name="auto_fix_high" size={13} className={extracting ? 'animate-spin' : 'text-teal-700 dark:text-teal-400'} />
                <span className="hidden sm:inline">{extracting ? 'Mengekstrak...' : 'Scan dari Jadwal'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-on-primary shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              title="Tambah Ruangan Baru"
              aria-label="Tambah Ruangan"
            >
              <Icon name="add" size={15} />
              <span>Tambah Ruang</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama ruang, gedung, atau petunjuk…"
            className="w-full rounded-full border border-outline-variant/30 bg-surface-container-low/50 py-1.5 pl-8 pr-7 text-[12px] font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-0.5 cursor-pointer"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>

        {/* Room List */}
        {loadingRooms ? (
          <div className="space-y-2.5">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <EmptyState
              icon="meeting_room"
              title={search ? 'Ruangan tidak ditemukan' : 'Belum ada ruangan terdaftar'}
              description={
                search
                  ? 'Coba gunakan kata kunci pencarian nama ruang atau gedung lain.'
                  : 'Daftarkan ruangan resmi atau klik "Scan dari Jadwal" untuk mengisi otomatis.'
              }
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-0">
            {filtered.map((room) => {
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3.5 dark:bg-surface-container-high/20 transition-all hover:border-teal-500/30 shadow-2xs border-l-4 border-l-teal-600"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-body-xs text-on-surface">
                        {room.namaRuang}
                      </span>
                      <span className="rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20 px-2 py-0.2 text-[10px] font-extrabold">
                        {room.gedung || 'Gedung Kampus'} · Lt. {room.lantai || 1}
                      </span>
                      {room.kapasitas && (
                        <span className="rounded-full bg-surface-container-high px-2 py-0.2 text-[9.5px] font-bold text-on-surface-variant">
                          👥 {room.kapasitas} Mhs
                        </span>
                      )}
                    </div>

                    {room.petunjukArah && (
                      <p className="text-[11px] text-on-surface-variant font-medium line-clamp-1">
                        🧭 {room.petunjukArah}
                      </p>
                    )}

                    {Array.isArray(room.fasilitas) && room.fasilitas.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {room.fasilitas.slice(0, 3).map((f) => (
                          <span key={f} className="rounded-md bg-surface-container-lowest dark:bg-surface-container-low px-1.5 py-0.2 text-[9.5px] font-semibold text-on-surface-variant border border-outline-variant/15">
                            ✓ {f}
                          </span>
                        ))}
                        {room.fasilitas.length > 3 && (
                          <span className="text-[9.5px] text-on-surface-variant font-bold">
                            +{room.fasilitas.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditRoom(room)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title={`Edit ${room.namaRuang}`}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRoom(room)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15 shadow-2xs"
                      title={`Hapus ${room.namaRuang}`}
                    >
                      <Icon name="delete" size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
