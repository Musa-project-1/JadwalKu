import { parseTimeToMinutes } from '../../../lib/scheduleGridUtils'
import { DAYS } from '../../../lib/uploadValidator'

export const WEEK_DAYS = DAYS

export const toMin = parseTimeToMinutes

export function currentMinuteOfDay() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function computeConflictedIds(scheduleSource, weekDays) {
  const ids = new Set()
  for (const day of weekDays) {
    const dayEntries = scheduleSource.filter((e) => e.hari === day)
    for (let i = 0; i < dayEntries.length; i += 1) {
      for (let j = i + 1; j < dayEntries.length; j += 1) {
        if (
          toMin(dayEntries[i].jamMulai) < toMin(dayEntries[j].jamSelesai) &&
          toMin(dayEntries[j].jamMulai) < toMin(dayEntries[i].jamSelesai) &&
          dayEntries[i].tipeKelas === dayEntries[j].tipeKelas &&
          String(dayEntries[i].ruang ?? '') === String(dayEntries[j].ruang ?? '')
        ) {
          ids.add(dayEntries[i].id)
          ids.add(dayEntries[j].id)
        }
      }
    }
  }
  return ids
}

export function computeScheduleSource({
  loading,
  isCustomMode,
  allPublishedJadwal,
  customScheduleIds,
  jadwal,
  archivedJadwal,
  viewingArchive,
  selectedTA,
  currentTA,
  useSample,
  program,
  semester,
  sampleSchedule,
}) {
  const byFakultas = (e) => {
    // Hierarki TA->Ganjil/Genap->Semester: fakultasId opsional untuk dokumen legacy.
    // Jika doc punya fakultasId dan user punya fakultasId, wajib cocok; jika tidak, izinkan (fallback legacy).
    if (!e.fakultasId) return true
    if (!e.userFakultasId) return true
    return String(e.fakultasId) === String(e.userFakultasId)
  }
  if (loading) return []
  if (isCustomMode) {
    const pool = allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule
    const customSet = new Set(customScheduleIds)
    const matches = pool.filter((e) => customSet.has(e.id))
    return matches.filter((e) => String(e.tahunAjaran ?? currentTA) === selectedTA && byFakultas(e))
  }

  const pool = [...jadwal, ...archivedJadwal]
  const active = pool.filter(
    (e) => String(e.tahunAjaran ?? currentTA) === selectedTA && byFakultas(e),
  )
  if (active.length > 0) return active
  if (viewingArchive) return []
  if (!useSample) return []
  return sampleSchedule.filter(
    (e) => e.prodi === program && e.semester === Number(semester),
  )
}

export function computeWeekDates(weekOffset, activeWeekDays) {
  const now = new Date()
  now.setDate(now.getDate() + weekOffset * 7)
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return activeWeekDays.map((day, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      day,
      dateNum: d.getDate(),
      monthShort: d.toLocaleDateString('id-ID', { month: 'short' }),
      iso: localDateKey(d),
    }
  })
}

export function computeMonthYearLabel(weekDates) {
  if (weekDates.length === 0) return ''
  const first = weekDates[0]
  const last = weekDates[weekDates.length - 1]
  const dFirst = new Date(first.iso)
  const dLast = new Date(last.iso)
  const mFirst = dFirst.toLocaleDateString('id-ID', { month: 'long' })
  const mLast = dLast.toLocaleDateString('id-ID', { month: 'long' })
  const y = dLast.getFullYear()
  if (mFirst === mLast) {
    return `${mFirst} ${y}`
  }
  return `${mFirst} - ${mLast} ${y}`
}

export function computeWeekRangeLabel(weekDates, weekOffset, language) {
  if (weekDates.length === 0) return ''
  const first = weekDates[0]
  const last = weekDates[weekDates.length - 1]
  const thisWeekPrefix = language === 'en' ? 'This Week' : 'Minggu Ini'
  if (weekOffset === 0) {
    return `${thisWeekPrefix} · ${first.dateNum} - ${last.dateNum} ${last.monthShort}`
  }
  if (first.monthShort === last.monthShort) {
    return `${first.dateNum} - ${last.dateNum} ${last.monthShort}`
  }
  return `${first.dateNum} ${first.monthShort} - ${last.dateNum} ${last.monthShort}`
}

export function computeTimeRange(scheduleSource) {
  let min = 8 * 60
  let max = 17 * 60
  scheduleSource.forEach((e) => {
    min = Math.min(min, toMin(e.jamMulai))
    max = Math.max(max, toMin(e.jamSelesai))
  })
  const startH = Math.max(6, Math.floor(min / 60))
  const endH = Math.min(22, Math.max(Math.ceil(max / 60), startH + 1))
  return [startH * 60, endH * 60]
}

export function computeHourMarks(rangeStart, rangeEnd) {
  const arr = []
  for (let m = rangeStart; m <= rangeEnd; m += 60) arr.push(m)
  return arr
}
