/**
 * Utilitas helper untuk manajemen Master Ruangan Kampus
 */

export const ROOM_TYPES = [
  { value: 'kelas', label: 'Ruang Kelas Teori' },
  { value: 'lab', label: 'Laboratorium Komputer / Sains' },
  { value: 'auditorium', label: 'Auditorium / Aula Besar' },
  { value: 'online', label: 'Ruang Virtual / Daring' },
  { value: 'lainnya', label: 'Fasilitas Lainnya' },
]

export const DEFAULT_FACILITIES = [
  'AC Ruangan',
  'Proyektor LCD',
  'Stopkontak Meja',
  'Papan Tulis Whiteboard',
  'WiFi Kampus / Eduroam',
  'Sound System',
  'Komputer / PC',
  'CCTV',
]

/**
 * Mencari data ruangan di master list berdasarkan nama/alias
 */
export function findRoomMasterMatch(rawRuang = '', rooms = []) {
  if (!rawRuang || !Array.isArray(rooms) || rooms.length === 0) return null
  const query = String(rawRuang).trim().toLowerCase()

  // 1. Exact match by namaRuang
  const exact = rooms.find((r) => String(r.namaRuang || '').trim().toLowerCase() === query)
  if (exact) return exact

  // 2. Exact match by alias
  const byAlias = rooms.find((r) =>
    Array.isArray(r.aliases) &&
    r.aliases.some((a) => String(a || '').trim().toLowerCase() === query),
  )
  if (byAlias) return byAlias

  // 3. Partial match (nama ruangan mengandung query atau sebaliknya)
  const partial = rooms.find((r) => {
    const name = String(r.namaRuang || '').trim().toLowerCase()
    return name.includes(query) || (query.length > 3 && query.includes(name))
  })
  if (partial) return partial

  return null
}
