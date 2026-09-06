import { useMemo, useState } from 'react'
import { StatusBanner } from '../../components/StatusBanner'
import { AdminPageCard } from '../../components/admin/AdminPageCard'

// Modularized Components
import { ScheduleHeader } from '../../components/admin/manageSchedule/ScheduleHeader'
import { ScheduleToolbar } from '../../components/admin/manageSchedule/ScheduleToolbar'
import { ScheduleTableSection } from '../../components/admin/manageSchedule/ScheduleTableSection'
import { ScheduleModalsContainer } from '../../components/admin/manageSchedule/ScheduleModalsContainer'
import { useScheduleFilters } from '../../components/admin/manageSchedule/useScheduleFilters'
import { useScheduleMutations } from '../../components/admin/manageSchedule/useScheduleMutations'

// Hooks & Libs
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useCampus } from '../../context/useCampus'
import { deriveTahunAjaran } from '../../lib/tahunAjaran'
import { findConflicts } from '../../lib/uploadValidator'
import { downloadScheduleTemplate, exportCurrentSchedule } from '../../lib/academicScheduleExport'

export default function ManageSchedule() {
  const { data: rawSchedule, loading: loadingSchedule, error: scheduleError } = useFirestore('jadwal', [], { limit: 500, orderByField: 'updatedAt', orderByDir: 'desc' })
  const { data: courses } = useFirestore('mataKuliah')
  const { data: programs } = useFirestore('prodi')
  const { data: fakultasDocs } = useFirestore('fakultas')
  const { data: settingsDocs } = useFirestore('settings')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''
  const { prodiNames: campusProdiNames } = useCampus()

  const academicCalendar = useMemo(
    () => settingsDocs?.find((s) => s.id === 'academicCalendar'),
    [settingsDocs],
  )
  const currentTA = deriveTahunAjaran(new Date(), academicCalendar)

  // Map prodi -> fakultasId (untuk denorm ke jadwal)
  const prodiFakultasMap = useMemo(() => {
    const m = new Map()
    for (const pr of programs || []) {
      m.set(String(pr.nama || ''), String(pr.fakultasId || pr.fakultasNama || ''))
    }
    return m
  }, [programs])

  // Map Mata Kuliah untuk lookup cepat
  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // List prodi options
  const prodiOptions = useMemo(() => {
    const fromDb = programs?.map((p) => p.nama || p.id).filter(Boolean) || []
    const fromCampus = campusProdiNames || []
    const have = [...new Set([...fromCampus, ...fromDb].filter(Boolean))]
    if (have.length > 0) return have.sort()
    return ['Arsitektur', 'Bisnis Digital', 'Informatika', 'Kewirausahaan', 'Teknik Sipil']
  }, [programs, campusProdiNames])

  const existingTAs = useMemo(() => {
    const fromSchedule = rawSchedule.map((s) => s.tahunAjaran).filter(Boolean)
    return Array.from(new Set([currentTA, ...fromSchedule]))
  }, [rawSchedule, currentTA])

  // State Banner & Modals
  const [banner, setBanner] = useState(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [noticeboardModalOpen, setNoticeboardModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Filter Engine
  const {
    search,
    setSearch,
    fakultasFilter,
    setFakultasFilter,
    prodiFilter,
    setProdiFilter,
    semesterFilter,
    setSemesterFilter,
    hariFilter,
    setHariFilter,
    statusFilter,
    setStatusFilter,
    taFilter,
    setTaFilter,
    onlyShowConflicts,
    setOnlyShowConflicts,
    availableTaOptions,
    availableSemesterOptions,
    availableFakultasOptions,
    conflictsList,
    conflictMap,
    filteredSchedule,
    groupedSchedule,
    paginatedGroups,
    safeCurrentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    expandedGroups,
    toggleExpandGroup,
    resetFilters,
  } = useScheduleFilters({
    rawSchedule,
    courseMap,
    fakultasDocs,
    programs,
    prodiFakultasMap,
  })

  // Mutations Engine
  const {
    busy,
    addModalOpen,
    setAddModalOpen,
    manualForm,
    setManualForm,
    manualErrors,
    setManualErrors,
    newCourseOpen,
    setNewCourseOpen,
    newCourseForm,
    setNewCourseForm,
    newCourseErrors,
    savingCourse,
    editingItem,
    setEditingItem,
    editForm,
    setEditForm,
    editErrors,
    groupEditing,
    setGroupEditing,
    deleteTarget,
    setDeleteTarget,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    handleUniversalImportSave,
    handleAddManualSession,
    handleSaveNewCourse,
    openEditModal,
    handleSaveEdit,
    handleDuplicate,
    handleDeleteSingle,
    openGroupEditModal,
    patchGroupForm,
    handleSaveGroupEdit,
    handleBulkStatusChange,
    handleBulkDelete,
    EMPTY_SESSION,
  } = useScheduleMutations({
    actor,
    currentTA,
    prodiFakultasMap,
    academicCalendar,
    setBanner,
    setImportModalOpen,
  })

  // Live Conflict Checking di Modal Tambah & Edit
  const addModalClash = useMemo(() => {
    if (!addModalOpen || !manualForm.hari || !manualForm.jamMulai || !manualForm.jamSelesai || !manualForm.kodeMK) return null
    const list = findConflicts([...rawSchedule, { ...manualForm, id: 'temp-manual' }], courseMap)
    const found = list.find((c) => c.idA === 'temp-manual' || c.idB === 'temp-manual')
    return found ? found.message : null
  }, [addModalOpen, manualForm, rawSchedule, courseMap])

  const editModalClash = useMemo(() => {
    if (!editingItem || !editForm.hari || !editForm.jamMulai || !editForm.jamSelesai || !editForm.kodeMK) return null
    const others = rawSchedule.filter((s) => s.id !== editingItem.id)
    const list = findConflicts([...others, { ...editForm, id: editingItem.id }], courseMap)
    const found = list.find((c) => c.idA === editingItem.id || c.idB === editingItem.id)
    return found ? found.message : null
  }, [editingItem, editForm, rawSchedule, courseMap])

  // Bulk Actions Selection
  const allFilteredIds = filteredSchedule.map((item) => item.id)
  function toggleSelectAll() {
    if (selectedIds.size === allFilteredIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
  }

  function toggleSelectGroup(group) {
    const ids = group.items.map((it) => it.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  async function handleGroupDelete(group) {
    setDeleteTarget({
      _group: group,
      ids: group.items.map((it) => it.id),
      label: `${group.items[0].kodeMK} – ${group.items.length} prodi`,
    })
  }

  return (
    <div className="h-full flex flex-col space-y-2 pb-16 tablet:pb-0 animate-fade-in w-full max-w-full overflow-hidden min-h-0 flex-1">
      {banner && (
        <div className="shrink-0">
          <StatusBanner
            ok={banner.ok}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        </div>
      )}
      {scheduleError && (
        <div className="shrink-0">
          <StatusBanner ok={false} message={`Gagal memuat jadwal: ${scheduleError.message || scheduleError.code || 'Unknown error'}`} onClose={() => {}} />
        </div>
      )}

      {/* ── Single Unified Card Container ── */}
      <AdminPageCard>
        {/* ── 1. Page Header ── */}
        <ScheduleHeader
          currentTA={currentTA}
          conflictCount={conflictMap.size}
          onlyShowConflicts={onlyShowConflicts}
          onToggleOnlyConflicts={() => setOnlyShowConflicts(!onlyShowConflicts)}
          onOpenNoticeboard={() => setNoticeboardModalOpen(true)}
          onOpenImport={() => setImportModalOpen(true)}
          onDownloadTemplate={downloadScheduleTemplate}
          onExportExcel={() => exportCurrentSchedule(filteredSchedule, courseMap, currentTA)}
          onOpenAddSession={() => {
            setManualForm(EMPTY_SESSION)
            setManualErrors([])
            setAddModalOpen(true)
          }}
        />

        {/* ── 2. Live Database Schedule Management ── */}
        <div className="p-3 tablet:p-3.5 flex-1 flex flex-col min-h-0 space-y-2.5 overflow-hidden">
          <ScheduleToolbar
            search={search}
            setSearch={setSearch}
            fakultasFilter={fakultasFilter}
            setFakultasFilter={setFakultasFilter}
            prodiFilter={prodiFilter}
            setProdiFilter={setProdiFilter}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            taFilter={taFilter}
            setTaFilter={setTaFilter}
            hariFilter={hariFilter}
            setHariFilter={setHariFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onlyShowConflicts={onlyShowConflicts}
            setOnlyShowConflicts={setOnlyShowConflicts}
            availableFakultasOptions={availableFakultasOptions}
            prodiOptions={prodiOptions}
            availableTaOptions={availableTaOptions}
            availableSemesterOptions={availableSemesterOptions}
            conflictsCount={conflictsList.length}
            onResetFilters={resetFilters}
            prodiFakultasMap={prodiFakultasMap}
          />

          {/* ── Table / Cards List ── */}
          <ScheduleTableSection
            loadingSchedule={loadingSchedule}
            filteredSchedule={filteredSchedule}
            paginatedGroups={paginatedGroups}
            courseMap={courseMap}
            conflictMap={conflictMap}
            selectedIds={selectedIds}
            expandedGroups={expandedGroups}
            toggleSelectAll={toggleSelectAll}
            toggleSelectGroup={toggleSelectGroup}
            toggleExpandGroup={toggleExpandGroup}
            openEditModal={openEditModal}
            openGroupEditModal={openGroupEditModal}
            handleDuplicate={handleDuplicate}
            setDeleteTarget={setDeleteTarget}
            handleGroupDelete={handleGroupDelete}
            safeCurrentPage={safeCurrentPage}
            groupedSchedule={groupedSchedule}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
          />
        </div>
      </AdminPageCard>

      {/* ── Modals Container ── */}
      <ScheduleModalsContainer
        addModalOpen={addModalOpen}
        setAddModalOpen={setAddModalOpen}
        manualForm={manualForm}
        setManualForm={setManualForm}
        handleAddManualSession={handleAddManualSession}
        busy={busy}
        prodiOptions={prodiOptions}
        courses={courses}
        addModalClash={addModalClash}
        manualErrors={manualErrors}
        setNewCourseOpen={setNewCourseOpen}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        editForm={editForm}
        setEditForm={setEditForm}
        handleSaveEdit={handleSaveEdit}
        editModalClash={editModalClash}
        editErrors={editErrors}
        groupEditing={groupEditing}
        setGroupEditing={setGroupEditing}
        handleSaveGroupEdit={handleSaveGroupEdit}
        patchGroupForm={patchGroupForm}
        newCourseOpen={newCourseOpen}
        handleSaveNewCourse={handleSaveNewCourse}
        newCourseForm={newCourseForm}
        setNewCourseForm={setNewCourseForm}
        savingCourse={savingCourse}
        newCourseErrors={newCourseErrors}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        handleDeleteSingle={handleDeleteSingle}
        bulkDeleteOpen={bulkDeleteOpen}
        setBulkDeleteOpen={setBulkDeleteOpen}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleBulkDelete={() => handleBulkDelete(selectedIds, setSelectedIds)}
        handleBulkStatusChange={(status) => handleBulkStatusChange(selectedIds, setSelectedIds, status)}
        importModalOpen={importModalOpen}
        setImportModalOpen={setImportModalOpen}
        handleUniversalImportSave={handleUniversalImportSave}
        currentTA={currentTA}
        existingTAs={existingTAs}
        noticeboardModalOpen={noticeboardModalOpen}
        setNoticeboardModalOpen={setNoticeboardModalOpen}
        rawSchedule={rawSchedule}
      />
    </div>
  )
}
