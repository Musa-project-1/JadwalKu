import { DatabaseBackupRestoreModal } from '../DatabaseBackupRestoreModal'
import CalendarSettingsModal from '../manageAcademicSettings/CalendarSettingsModal'
import { AcademicCalendarImportModal } from '../AcademicCalendarImportModal'
import { AddEditRoomModal } from '../manageAcademicSettings/AddEditRoomModal'
import AddHolidayModal from '../manageAcademicSettings/AddHolidayModal'
import SyncNationalHolidaysModal from '../manageAcademicSettings/SyncNationalHolidaysModal'
import { ConfirmDialog } from '../../ConfirmDialog'

export function AdminSettingsSubModals({
  backupRestoreOpen,
  setBackupRestoreOpen,
  calendarOpen,
  setCalendarOpen,
  customCal,
  setCustomCal,
  mekStats,
  currentComputedTA,
  savingCal,
  handleSaveCalendar,
  kaldikImportOpen,
  setKaldikImportOpen,
  handleImportCalendar,
  calDoc,
  savingKaldik,
  addHolidayModalOpen,
  setAddHolidayModalOpen,
  handleSaveHoliday,
  savingHoliday,
  syncHolidayModalOpen,
  setSyncHolidayModalOpen,
  selectedSyncYear,
  setSelectedSyncYear,
  syncingHolidays,
  handleSyncHolidays,
  deleteHolidayTarget,
  setDeleteHolidayTarget,
  handleDeleteHoliday,
  roomModalOpen,
  setRoomModalOpen,
  editingRoom,
  setEditingRoom,
  savingRoom,
  handleSaveRoom,
  deleteRoomTarget,
  setDeleteRoomTarget,
  handleDeleteRoom,
}) {
  return (
    <>
      {backupRestoreOpen && (
        <DatabaseBackupRestoreModal
          isOpen={backupRestoreOpen}
          onClose={() => setBackupRestoreOpen(false)}
        />
      )}

      {calendarOpen && (
        <CalendarSettingsModal
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          customCal={customCal}
          onCustomCalChange={setCustomCal}
          mekStats={mekStats}
          currentComputedTA={currentComputedTA}
          saving={savingCal}
          onSubmit={handleSaveCalendar}
        />
      )}

      {kaldikImportOpen && (
        <AcademicCalendarImportModal
          open={kaldikImportOpen}
          onClose={() => setKaldikImportOpen(false)}
          onSaveCalendarEvents={handleImportCalendar}
          existingEvents={calDoc?.events || []}
          busySaving={savingKaldik}
        />
      )}

      {addHolidayModalOpen && (
        <AddHolidayModal
          open={addHolidayModalOpen}
          onClose={() => setAddHolidayModalOpen(false)}
          onAdd={handleSaveHoliday}
          saving={savingHoliday}
          todayISO={new Date().toISOString().slice(0, 10)}
        />
      )}

      {syncHolidayModalOpen && (
        <SyncNationalHolidaysModal
          open={syncHolidayModalOpen}
          onClose={() => setSyncHolidayModalOpen(false)}
          selectedYear={selectedSyncYear}
          onYearChange={setSelectedSyncYear}
          syncing={syncingHolidays}
          onSync={handleSyncHolidays}
        />
      )}

      {deleteHolidayTarget && (
        <ConfirmDialog
          open={Boolean(deleteHolidayTarget)}
          title="Hapus Hari Libur?"
          description={`Hari libur "${deleteHolidayTarget?.nama}" akan dihapus dari kalender.`}
          confirmLabel="Hapus Libur"
          onConfirm={handleDeleteHoliday}
          onCancel={() => setDeleteHolidayTarget(null)}
        />
      )}

      {roomModalOpen && (
        <AddEditRoomModal
          open={roomModalOpen}
          onClose={() => {
            setRoomModalOpen(false)
            setEditingRoom(null)
          }}
          room={editingRoom}
          saving={savingRoom}
          onSave={handleSaveRoom}
        />
      )}

      {deleteRoomTarget && (
        <ConfirmDialog
          open={Boolean(deleteRoomTarget)}
          title="Hapus Ruangan?"
          description={`Ruangan "${deleteRoomTarget?.name}" akan dihapus dari direktori denah kampus.`}
          confirmLabel="Hapus Ruang"
          onConfirm={handleDeleteRoom}
          onCancel={() => setDeleteRoomTarget(null)}
        />
      )}
    </>
  )
}
