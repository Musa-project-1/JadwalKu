import { RoomListPanel } from '../manageAcademicSettings/RoomListPanel'

export function AdminRoomsTab({
  language: _language,
  rooms,
  loadingRooms,
  setEditingRoom,
  setRoomModalOpen,
  setDeleteRoomTarget,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
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
  )
}
