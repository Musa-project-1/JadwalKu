/**
 * Konfigurasi 4 Sesi Waktu Kuliah (Time-of-Day Slots)
 */
export const TIME_SESSION_DEFS = [
  {
    id: 'pagi',
    label: 'Pagi',
    labelEn: 'Morning',
    icon: 'wb_sunny',
    approx: '07.00 – 11.55',
  },
  {
    id: 'siang',
    label: 'Siang',
    labelEn: 'Afternoon',
    icon: 'light_mode',
    approx: '12.30 – 15.15',
  },
  {
    id: 'sore',
    label: 'Sore',
    labelEn: 'Late Afternoon',
    icon: 'wb_twilight',
    approx: '15.30 – 18.00',
  },
  {
    id: 'malam',
    label: 'Malam',
    labelEn: 'Evening',
    icon: 'dark_mode',
    approx: '18.30 – 21.30+',
  },
]

/**
 * Konversi string waktu "HH:MM" atau "HH.MM" menjadi total menit sejak jam 00:00.
 */
export function parseTimeToMinutes(str) {
  if (!str) return 0
  const normalized = String(str).replace('.', ':').trim()
  const parts = normalized.split(':').map(Number)
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return 0
  return parts[0] * 60 + parts[1]
}

/**
 * Mengelompokkan kelas ke dalam sesi (pagi, siang, sore, malam)
 * berdasarkan jam mulai dan jam selesai perkuliahan.
 */
export function getSessionForClass(jamMulai, jamSelesai, prayerTimes) {
  const startMins = parseTimeToMinutes(jamMulai)
  const dzuhurMins = prayerTimes?.dzuhur ? parseTimeToMinutes(prayerTimes.dzuhur) : 12 * 60
  const asharMins = prayerTimes?.ashar ? parseTimeToMinutes(prayerTimes.ashar) : 15 * 60 + 15
  const maghribMins = prayerTimes?.maghrib ? parseTimeToMinutes(prayerTimes.maghrib) : 18 * 60

  // 1. Pagi: Mulai sebelum Dzuhur
  if (startMins < dzuhurMins) {
    return 'pagi'
  }
  // 2. Siang: Mulai setelah Dzuhur sampai sebelum Ashar
  if (startMins < asharMins) {
    return 'siang'
  }
  // 3. Sore: Mulai setelah Ashar sampai sebelum Maghrib
  if (startMins < maghribMins) {
    return 'sore'
  }
  // 4. Malam: Mulai setelah Maghrib
  return 'malam'
}

/**
 * Mendeteksi bentrok jadwal kuliah dengan waktu sholat atau Sholat Jumat.
 */
export function checkPrayerClash(dayName, jamMulai, jamSelesai, prayerTimes) {
  const startMins = parseTimeToMinutes(jamMulai)
  const endMins = parseTimeToMinutes(jamSelesai)
  const isFriday = dayName?.toLowerCase() === 'jumat' || dayName?.toLowerCase() === 'friday'

  const dzuhurMins = prayerTimes?.dzuhur ? parseTimeToMinutes(prayerTimes.dzuhur) : 12 * 60
  const asharMins = prayerTimes?.ashar ? parseTimeToMinutes(prayerTimes.ashar) : 15 * 60 + 15
  const maghribMins = prayerTimes?.maghrib ? parseTimeToMinutes(prayerTimes.maghrib) : 18 * 60

  // Kasus Khusus Hari Jumat: Rentang Sholat Jumat 11.30 - 13.00
  if (isFriday) {
    const jumatStart = 11 * 60 + 30
    const jumatEnd = 13 * 60
    if (startMins < jumatEnd && endMins > jumatStart) {
      return {
        hasClash: true,
        type: 'friday',
        label: 'Sholat Jumat (11.30–13.00)',
        labelEn: 'Friday Prayer (11:30–13:00)',
      }
    }
  }

  // Kasus Dzuhur (kelas melintasi jam Dzuhur dengan buffer 15 menit)
  if (startMins < dzuhurMins && endMins > dzuhurMins + 10) {
    return {
      hasClash: true,
      type: 'dzuhur',
      label: `Melintasi Dzuhur (${prayerTimes?.dzuhur || '12.00'})`,
      labelEn: `Crosses Dhuhr (${prayerTimes?.dzuhur || '12:00'})`,
    }
  }

  // Kasus Ashar (kelas melintasi jam Ashar)
  if (startMins < asharMins && endMins > asharMins + 10) {
    return {
      hasClash: true,
      type: 'ashar',
      label: `Melintasi Ashar (${prayerTimes?.ashar || '15.15'})`,
      labelEn: `Crosses Asr (${prayerTimes?.ashar || '15:15'})`,
    }
  }

  // Kasus Maghrib (kelas melintasi jam Maghrib)
  if (startMins < maghribMins && endMins > maghribMins + 10) {
    return {
      hasClash: true,
      type: 'maghrib',
      label: `Melintasi Maghrib (${prayerTimes?.maghrib || '18.00'})`,
      labelEn: `Crosses Maghrib (${prayerTimes?.maghrib || '18:00'})`,
    }
  }

  return { hasClash: false }
}
