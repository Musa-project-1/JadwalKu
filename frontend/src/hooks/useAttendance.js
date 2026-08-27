import { useState, useEffect, useCallback } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

const DEFAULT_TOTAL_SESSIONS = 16
const DEFAULT_MIN_PERCENT = 75 // Standar minimal kehadiran UAS 75%
const MAX_ALLOWED_ABSENCES = 4 // 16 * (1 - 0.75) = 4

/**
 * Hook untuk mengelola data presensi dan sisa jatah ketidakhadiran kuliah.
 */
export function useAttendance() {
  const [allAttendance, setAllAttendanceState] = useState(() =>
    getItem(STORAGE_KEYS.attendance, {}),
  )

  useEffect(() => {
    function handleStorage(e) {
      if (e.key === `jadwal-kampus:${STORAGE_KEYS.attendance}`) {
        setAllAttendanceState(getItem(STORAGE_KEYS.attendance, {}))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const saveAttendanceData = useCallback((newData) => {
    setAllAttendanceState(newData)
    setItem(STORAGE_KEYS.attendance, newData)
  }, [])

  const getCourseAttendance = useCallback(
    (kodeMK) => {
      if (!kodeMK) return getEmptyAttendance()
      const raw = allAttendance[kodeMK] || {}
      const sessions = raw.sessions || {}

      let hadir = 0
      let izin = 0
      let sakit = 0
      let alpa = 0

      Object.values(sessions).forEach((status) => {
        if (status === 'hadir') hadir++
        else if (status === 'izin') izin++
        else if (status === 'sakit') sakit++
        else if (status === 'alpa') alpa++
      })

      const totalFilled = hadir + izin + sakit + alpa
      const totalAbsences = izin + sakit + alpa
      const remainingAbsences = MAX_ALLOWED_ABSENCES - totalAbsences
      const attendancePercent =
        totalFilled > 0 ? Math.round((hadir / totalFilled) * 100) : 100

      let statusTier = 'safe' // 'safe' | 'warning' | 'danger'
      if (remainingAbsences <= 0) {
        statusTier = 'danger'
      } else if (remainingAbsences === 1) {
        statusTier = 'warning'
      }

      return {
        kodeMK,
        totalSessions: raw.totalSessions || DEFAULT_TOTAL_SESSIONS,
        minAttendancePercent: raw.minAttendancePercent || DEFAULT_MIN_PERCENT,
        sessions,
        counts: { hadir, izin, sakit, alpa, totalFilled, totalAbsences },
        remainingAbsences,
        maxAllowedAbsences: MAX_ALLOWED_ABSENCES,
        attendancePercent,
        statusTier,
        isEligibleForExam: remainingAbsences >= 0,
      }
    },
    [allAttendance],
  )

  const setMeetingStatus = useCallback(
    (kodeMK, meetingNum, status) => {
      if (!kodeMK || !meetingNum) return

      const current = allAttendance[kodeMK] || {
        totalSessions: DEFAULT_TOTAL_SESSIONS,
        minAttendancePercent: DEFAULT_MIN_PERCENT,
        sessions: {},
      }

      const nextSessions = { ...current.sessions }
      if (status == null) {
        delete nextSessions[meetingNum]
      } else {
        nextSessions[meetingNum] = status
      }

      const nextAll = {
        ...allAttendance,
        [kodeMK]: {
          ...current,
          sessions: nextSessions,
          updatedAt: new Date().toISOString(),
        },
      }
      saveAttendanceData(nextAll)
    },
    [allAttendance, saveAttendanceData],
  )

  const quickIncrement = useCallback(
    (kodeMK, statusType) => {
      if (!kodeMK || !statusType) return
      const info = getCourseAttendance(kodeMK)
      const sessions = { ...info.sessions }

      // Cari nomor pertemuan pertama yang masih kosong (1 s.d. 16)
      let targetMeeting = null
      for (let i = 1; i <= info.totalSessions; i++) {
        if (!sessions[i]) {
          targetMeeting = i
          break
        }
      }

      if (targetMeeting) {
        setMeetingStatus(kodeMK, targetMeeting, statusType)
      }
    },
    [getCourseAttendance, setMeetingStatus],
  )

  const resetCourseAttendance = useCallback(
    (kodeMK) => {
      if (!kodeMK) return
      const nextAll = { ...allAttendance }
      delete nextAll[kodeMK]
      saveAttendanceData(nextAll)
    },
    [allAttendance, saveAttendanceData],
  )

  return {
    allAttendance,
    getCourseAttendance,
    setMeetingStatus,
    quickIncrement,
    resetCourseAttendance,
  }
}

function getEmptyAttendance() {
  return {
    totalSessions: DEFAULT_TOTAL_SESSIONS,
    minAttendancePercent: DEFAULT_MIN_PERCENT,
    sessions: {},
    counts: { hadir: 0, izin: 0, sakit: 0, alpa: 0, totalFilled: 0, totalAbsences: 0 },
    remainingAbsences: MAX_ALLOWED_ABSENCES,
    maxAllowedAbsences: MAX_ALLOWED_ABSENCES,
    attendancePercent: 100,
    statusTier: 'safe',
    isEligibleForExam: true,
  }
}

