import { getXLSXExp } from './academicExcelExport'

export async function downloadExamTemplate() {
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
      jenis: 'UTS',
      prodi: 'Informatika',
      semester: 3,
      kodeMK: 'IF201',
      tanggal: '2026-10-15',
      jam: '08:00 - 10:00',
      ruang: 'Lab Komputer 1',
      mode: 'Offline',
    },
    {
      jenis: 'UAS',
      prodi: 'Bisnis Digital',
      semester: 1,
      kodeMK: 'BD102',
      tanggal: '2026-12-20',
      jam: '10:30 - 12:30',
      ruang: 'R. 302',
      mode: 'Offline',
    },
  ]
  const ws = XLSX.utils.json_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Ujian')
  XLSX.writeFile(wb, 'Template_Jadwal_Ujian.xlsx')
}

export async function exportExamsToExcel(filtered, courseMap, jenisFilter = 'Semua') {
  let __XLSX
  try {
    __XLSX = await getXLSXExp()
  } catch (e) {
    console.warn('[XLSX] dynamic import failed', e)
    alert('Gagal memuat pustaka export. Periksa koneksi atau coba lagi.')
    return { ok: false, error: 'Gagal memuat pustaka export.' }
  }
  const XLSX = __XLSX.default ?? __XLSX
  if (!filtered || filtered.length === 0) {
    return { ok: false, message: 'Tidak ada data jadwal ujian untuk diekspor.' }
  }
  const exportData = filtered.map((e) => {
    const course = courseMap.get(String(e.kodeMK).toUpperCase())
    return {
      'Jenis Ujian': e.jenis,
      'Program Studi': e.prodi,
      Semester: e.semester,
      'Kode MK': e.kodeMK,
      'Nama Mata Kuliah': course?.namaMK || '-',
      'Dosen Pengampu': course?.dosen || '-',
      Tanggal: e.tanggal,
      Waktu: e.jam,
      Ruangan: e.ruang || '-',
      Mode: e.mode || 'Offline',
      Status: (e.status || 'published').toUpperCase(),
    }
  })
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Ujian')
  XLSX.writeFile(
    wb,
    `Jadwal_Ujian_${jenisFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
  return { ok: true }
}
