import { ScheduleFormModal } from './ScheduleFormModal'
import { GroupEditModal } from './GroupEditModal'
import { QuickCourseModal } from './QuickCourseModal'
import { ConfirmDialog } from '../../ConfirmDialog'
import { BulkActionBar } from '../BulkActionBar'
import { UniversalImportModal } from '../UniversalImportModal'
import { OfficialNoticeboardModal } from '../OfficialNoticeboardModal'

export function ScheduleModalsContainer({
  addModalOpen,
  setAddModalOpen,
  manualForm,
  setManualForm,
  handleAddManualSession,
  busy,
  prodiOptions,
  courses,
  addModalClash,
  manualErrors,
  setNewCourseOpen,
  editingItem,
  setEditingItem,
  editForm,
  setEditForm,
  handleSaveEdit,
  editModalClash,
  editErrors,
  groupEditing,
  setGroupEditing,
  handleSaveGroupEdit,
  patchGroupForm,
  newCourseOpen,
  handleSaveNewCourse,
  newCourseForm,
  setNewCourseForm,
  savingCourse,
  newCourseErrors,
  deleteTarget,
  setDeleteTarget,
  handleDeleteSingle,
  bulkDeleteOpen,
  setBulkDeleteOpen,
  selectedIds,
  setSelectedIds,
  handleBulkDelete,
  handleBulkStatusChange,
  importModalOpen,
  setImportModalOpen,
  handleUniversalImportSave,
  currentTA,
  existingTAs,
  noticeboardModalOpen,
  setNoticeboardModalOpen,
  rawSchedule,
}) {
  return (
    <>
      {/* ── 3. Modal Tambah Sesi Manual ── */}
      <ScheduleFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Sesi Jadwal Manual"
        subtitle="Input jadwal perkuliahan secara individual"
        icon="add_circle"
        submitLabel="Simpan Sesi ke Database"
        formData={manualForm}
        setFormData={setManualForm}
        onSubmit={handleAddManualSession}
        busy={busy}
        prodiOptions={prodiOptions}
        courses={courses}
        clashWarning={addModalClash}
        errors={manualErrors}
        showStatus={false}
        onCreateCourse={() => setNewCourseOpen(true)}
      />

      {/* ── 4. Modal Edit Jadwal Individual ── */}
      <ScheduleFormModal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Sesi Jadwal"
        subtitle={editingItem ? `${editingItem.kodeMK} – ${editingItem.hari}` : ''}
        icon="edit_calendar"
        submitLabel="Simpan Perubahan"
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleSaveEdit}
        busy={busy}
        prodiOptions={prodiOptions}
        courses={courses}
        clashWarning={editModalClash}
        errors={editErrors}
        showStatus={true}
      />

      {/* ── 4b. Modal Edit GRUP (MK Umum) ── */}
      <GroupEditModal
        groupEditing={groupEditing}
        onClose={() => setGroupEditing(null)}
        onSubmit={handleSaveGroupEdit}
        patchGroupForm={patchGroupForm}
        courses={courses}
        busy={busy}
        errors={editErrors}
      />

      {/* ── 5. Modal Buat MK Cepat ── */}
      <QuickCourseModal
        open={newCourseOpen}
        onClose={() => setNewCourseOpen(false)}
        onSubmit={handleSaveNewCourse}
        formData={newCourseForm}
        setFormData={setNewCourseForm}
        saving={savingCourse}
        errors={newCourseErrors}
      />

      {/* ── 6. Dialog Konfirmasi Hapus Single / Grup ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?._group
            ? `Hapus ${deleteTarget._group.items.length} sesi grup?`
            : 'Hapus sesi jadwal?'
        }
        description={
          deleteTarget?._group
            ? `Grup ${deleteTarget._group.items[0]?.kodeMK} – ${deleteTarget._group.items
                .map((it) => `${it.prodi} S${it.semester}`)
                .join(', ')} – dengan jam ${deleteTarget._group.items[0]?.hari} ${
                deleteTarget._group.items[0]?.jamMulai
              } akan dihapus ${deleteTarget._group.items.length} sesi sekaligus (SEMUA prodi dalam grup).`
            : `Sesi ${deleteTarget?.kodeMK} (${deleteTarget?.hari}, ${deleteTarget?.jamMulai}) akan dihapus permanen dari database.`
        }
        confirmLabel={
          deleteTarget?._group
            ? `Hapus ${deleteTarget._group.items.length} sesi grup`
            : 'Hapus Jadwal'
        }
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── 7. Dialog Konfirmasi Hapus Massal ── */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Hapus Jadwal Terpilih?"
        description={`Sebanyak ${selectedIds.size} sesi jadwal terpilih akan dihapus permanen dari database.`}
        confirmLabel="Hapus Semua Terpilih"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />

      {/* ── 8. Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onPublish={() => handleBulkStatusChange('published')}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={() => setSelectedIds(new Set())}
        isBusy={busy}
        itemLabel="Sesi"
      />

      {/* ── 9. Universal Schedule Importer & Noticeboard ── */}
      <UniversalImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSave={handleUniversalImportSave}
        prodiOptions={prodiOptions}
        currentTA={currentTA}
        existingTAs={existingTAs}
      />

      <OfficialNoticeboardModal
        isOpen={noticeboardModalOpen}
        onClose={() => setNoticeboardModalOpen(false)}
        allSchedules={rawSchedule}
        courses={courses}
        currentTA={currentTA}
      />
    </>
  )
}
