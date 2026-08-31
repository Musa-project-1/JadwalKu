/**
 * Konfigurasi Kampus Universal — sumber kebenaran untuk data yang selama ini
 * di-hardcode (prodi, tipe kelas, ruang, preset impor).
 *
 * Dengan lapisan ini, JadwalKu bisa dipakai universitas mana pun:
 * admin cukup mengisi konfigurasi kampus (via Firestore `kampus`),
 * dan seluruh UI/parser membaca dari sini — bukan konstanta mati.
 *
 * Struktur satu dokumen `kampus/{kampusId}`:
 * {
 *   id: 'ftb',                 // kampusId (slug)
 *   nama: 'Universitas FTB',
 *   singkatan: 'FTB',
 *   prodi: [{ nama, prefix }],
 *   classTypes: [{ code, label, tone }],   // default CLASS_TYPE_CODES
 *   roomMap: { HBH: 'Gedung Halimah', ... },
 *   importPreset: { hari: 'Hari', jamRange: 'Jam', ... },  // pemetaan kolom tersimpan
 *   warna: { primary, secondary, tertiary }  // branding opsional
 * }
 */

import { CLASS_TYPE_CODES } from './classTypes'
import { PRODIS } from '../constants/academicConstants'

/**
 * Konfigurasi default (dipakai bila Firestore belum berisi dokumen `kampus`
 * atau saat mode dev tanpa backend) — mempertahankan perilaku lama JadwalKu.
 */
export const DEFAULT_CAMPUS = {
  id: 'default',
  nama: 'Kampus JadwalKu',
  singkatan: 'JadwalKu',
  prodi: PRODIS.filter((p) => p.prefix).map((p) => ({ nama: p.value, prefix: p.prefix })),
  classTypes: CLASS_TYPE_CODES.map((code) => ({ code, label: code })),
  roomMap: {
    HBH: 'Gedung Halimah',
    HBD: 'Gedung Dekanat',
    K1: 'Ruang Kelas Prodi',
    '2-A': 'Ruang Kelas 2-A',
    '4-A': 'Ruang Kelas 4-A',
    K2: 'Online / Zoom',
    '2-B': 'Online / Zoom',
    '4-E': 'Online / Zoom',
    GBK1: 'Ruang Kelas Gabungan',
    GBK2: 'Online / Zoom',
  },
  importPreset: {},
  academicCalendar: null,
  aktif: true,
  createdAt: null,
  updatedAt: null,
}

/** Ambil daftar nama prodi dari config kampus. */
export function getProdiNames(campus = DEFAULT_CAMPUS) {
  const list = (campus?.prodi || DEFAULT_CAMPUS.prodi)
    .map((p) => (typeof p === 'string' ? p : p?.nama))
    .filter(Boolean)
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, 'id'))
}

/** Ambil kode tipe kelas yang valid dari config kampus. */
export function getClassTypeCodes(campus = DEFAULT_CAMPUS) {
  const list = (campus?.classTypes || DEFAULT_CAMPUS.classTypes)
    .map((t) => (typeof t === 'string' ? t : t?.code))
    .filter(Boolean)
  return list.length > 0 ? list : CLASS_TYPE_CODES
}

/** Ambil peta nama ruang dari config kampus. */
export function getRoomMap(campus = DEFAULT_CAMPUS) {
  return campus?.roomMap && Object.keys(campus.roomMap).length > 0
    ? campus.roomMap
    : DEFAULT_CAMPUS.roomMap
}

/** Normalisasi config Firestore -> objek dengan nilai default terisi. */
export function normalizeCampus(raw = {}) {
  return {
    ...DEFAULT_CAMPUS,
    ...raw,
    prodi: raw.prodi && raw.prodi.length > 0 ? raw.prodi : DEFAULT_CAMPUS.prodi,
    classTypes: raw.classTypes && raw.classTypes.length > 0 ? raw.classTypes : DEFAULT_CAMPUS.classTypes,
    roomMap: raw.roomMap ? raw.roomMap : DEFAULT_CAMPUS.roomMap,
  }
}

/**
 * Cari prodi berdasarkan prefix kode MK (mis. 'IF' -> 'Informatika').
 * Dipakai ManageCourses untuk filter prodi dari kode mata kuliah.
 */
export function getProdiByCodePrefix(code = '', campus = DEFAULT_CAMPUS) {
  const clean = String(code).toUpperCase().trim()
  if (!clean) return null
  const prodi = (campus?.prodi || DEFAULT_CAMPUS.prodi)
    .map((p) => (typeof p === 'string' ? { nama: p, prefix: '' } : p))
    .find((p) => p?.prefix && clean.startsWith(p.prefix.toUpperCase()))
  return prodi?.nama || null
}
