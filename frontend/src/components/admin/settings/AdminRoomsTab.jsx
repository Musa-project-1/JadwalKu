import { RoomListPanel } from '../manageAcademicSettings/RoomListPanel'

export function AdminRoomsTab({
  language,
  rooms,
  loadingRooms,
  setEditingRoom,
  setRoomModalOpen,
  setDeleteRoomTarget,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Campus Rooms & Wayfinding' : 'Master Denah & Ruangan Kampus'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Configure physical room directories, floor locations, and facilities'
            : 'Kelola direktori nama ruang kelas, lantai gedung, dan fasilitas kampus'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 shadow-2xs">
        <RoomListPanel
          rooms={rooms || []}
          loadingRooms={loadingRooms}
          extractingRooms={false}
          onExtractRooms={() => {}}
          onOpenAddRoom={() => {
            setEditingRoom(null)
            setRoomModalOpen(true)
          }}
          onEditRoom={(r) => {
            setEditingRoom(r)
            setRoomModalOpen(true)
          }}
          onDeleteRoom={(r) => setDeleteRoomTarget(r)}
        />
      </div>
    </div>
  )
}
