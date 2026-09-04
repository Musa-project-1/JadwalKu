let _XLSXExp = null
export async function getXLSXExp() { 
  if (!_XLSXExp) _XLSXExp = await import('xlsx')
  return _XLSXExp 
}
import { MONTH_NAMES } from '../constants/academicConstants'
import { getTermLabel } from './tahunAjaran'

/**
 * Export the master academic data (calendar bounds, program studi, holidays) to a
 * single multi-sheet Excel workbook and trigger a download.
 */
export async function exportAcademicSettingsToExcel({
  currentComputedTA,
  currentComputedTerm,
  customCal,
  mekStats,
  sortedProdi,
  sortedHolidays,
}) {
  const XLSX = await getXLSXExp()
  const wb = XLSX.utils.book_new()

  // 1. Sheet Kalender
  const calData = [
    { Parameter: 'Tahun Ajaran Aktif', Nilai: currentComputedTA },
    { Parameter: 'Term Aktif', Nilai: getTermLabel(currentComputedTerm) },
    { Parameter: 'Mulai Semester Ganjil', Nilai: `Tgl ${customCal.ganjilStartDay} ${MONTH_NAMES[customCal.ganjilStartMonth]}` },
    { Parameter: 'Selesai Semester Ganjil', Nilai: `Tgl ${customCal.ganjilEndDay} ${MONTH_NAMES[customCal.ganjilEndMonth]}` },
    { Parameter: 'Mulai Semester Genap', Nilai: `Tgl ${customCal.genapStartDay} ${MONTH_NAMES[customCal.genapStartMonth]}` },
    { Parameter: 'Selesai Semester Genap', Nilai: `Tgl ${customCal.genapEndDay} ${MONTH_NAMES[customCal.genapEndMonth]}` },
    { Parameter: 'Minggu Efektif Kuliah (MEK)', Nilai: `${mekStats.effectiveWeeks} Minggu` },
  ]
  const wsCal = XLSX.utils.json_to_sheet(calData)
  XLSX.utils.book_append_sheet(wb, wsCal, 'Kalender_Akademik')

  // 2. Sheet Program Studi
  const prodiData = sortedProdi.map((p) => ({
    'Nama Program Studi': p.nama,
    'Semester Minimal': p.semesterMin ?? 1,
    'Semester Maksimal': p.semesterMax ?? 8,
  }))
  const wsProdi = XLSX.utils.json_to_sheet(prodiData)
  XLSX.utils.book_append_sheet(wb, wsProdi, 'Program_Studi')

  // 3. Sheet Hari Libur
  const liburData = sortedHolidays.map((h) => ({
    'Nama Hari Libur / Agenda': h.nama,
    'Jenis Libur': (h.tipe || 'nasional').toUpperCase(),
    'Cakupan Prodi': h.prodi || 'Semua',
    'Tanggal Mulai': h.mulai,
    'Tanggal Selesai': h.selesai || h.mulai,
  }))
  const wsLibur = XLSX.utils.json_to_sheet(liburData)
  XLSX.utils.book_append_sheet(wb, wsLibur, 'Daftar_Hari_Libur')

  XLSX.writeFile(
    wb,
    `Master_Akademik_${currentComputedTA.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}
