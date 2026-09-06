import { getXLSXExp } from './academicExcelExport'

export async function downloadScheduleTemplate() {
  let __XLSX
  try {
    __XLSX = await getXLSXExp()
  } catch (e) {
    console.warn('[XLSX] dynamic import failed', e)
    alert('Gagal memuat pustaka export. Periksa koneksi atau coba lagi.')
    return
  }
  const XLSX = __XLSX.default ?? __XLSX
  const templateData = [
    {
      Hari: 'Senin',
      'Jam Mulai': '08:00',
      'Jam Selesai': '09:40',
      Prodi: 'Informatika',
      Semester: 1,
      'Kode MK': 'IF101',
      'Nama MK': 'Dasar Pemrograman',
      'Dosen Pengampu': 'Dr. Alan Turing',
      Ruang: 'Lab 1',
      'Tipe Kelas': 'K1',
      SKS: 2,
    },
  ]
  const ws = XLSX.utils.json_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, 'Template_Jadwal_JadwalKu.xlsx')
}

export async function exportCurrentSchedule(filteredSchedule, courseMap, currentTA) {
  let __XLSX
  try {
    __XLSX = await getXLSXExp()
  } catch (e) {
    console.warn('[XLSX] dynamic import failed', e)
    alert('Gagal memuat pustaka export. Periksa koneksi atau coba lagi.')
    return
  }
  const XLSX = __XLSX.default ?? __XLSX
  const exportData = filteredSchedule.map((item) => {
    const course = courseMap.get(item.kodeMK)
    return {
      Hari: item.hari,
      'Jam Mulai': item.jamMulai,
      'Jam Selesai': item.jamSelesai,
      Prodi: item.prodi,
      Semester: item.semester,
      'Kode MK': item.kodeMK,
      'Nama Mata Kuliah': course?.namaMK || item.kodeMK,
      'Dosen Pengampu': course?.dosen || '–',
      Ruang: item.ruang || '–',
      'Tipe Kelas': item.tipeKelas || 'K1',
      Status: item.status || 'published',
      'Tahun Ajaran': item.tahunAjaran || currentTA,
    }
  })
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Jadwal')
  XLSX.writeFile(wb, `Jadwal_Kuliah_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
