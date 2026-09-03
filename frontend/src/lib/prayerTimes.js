/**
 * prayerTimes.js — Modul Perhitungan Waktu Sholat Akurat (100% Offline / Zero-API)
 *
 * Algoritma hisab astronomis standar Kementerian Agama RI / MWL:
 * - Fajr (Subuh): 20°
 * - Dhuhr (Dzuhur): Matahari melintasi meridian (solar noon)
 * - Asr (Ashar): Shadow ratio 1:1 (Mazhab Syafi'i)
 * - Maghrib: Sunset (-0.833° koreksi refraksi & semidiameter)
 * - Isha (Isya): 18°
 *
 * Default koordinat: Jakarta / Jabodetabek (Lat: -6.2088, Lon: 106.8456, Timezone: UTC+7)
 */

function degToRad(deg) {
  return (deg * Math.PI) / 180.0
}

function radToDeg(rad) {
  return (rad * 180.0) / Math.PI
}

function normalizeHours(h) {
  let val = h - 24.0 * Math.floor(h / 24.0)
  return val < 0 ? val + 24.0 : val
}

function formatTime(decimalHour) {
  if (Number.isNaN(decimalHour)) return '--:--'
  const norm = normalizeHours(decimalHour)
  const h = Math.floor(norm)
  const m = Math.round((norm - h) * 60)
  let finalH = h
  let finalM = m
  if (finalM >= 60) {
    finalH = (finalH + 1) % 24
    finalM = 0
  }
  return `${String(finalH).padStart(2, '0')}.${String(finalM).padStart(2, '0')}`
}

/**
 * Menghitung waktu sholat astronomis presisi untuk tanggal tertentu.
 * @param {Date} [date=new Date()] Tanggal target
 * @param {number} [lat=-6.2088] Latitude
 * @param {number} [lng=106.8456] Longitude
 * @param {number} [timezone=7] Offset zona waktu (WIB = 7, WITA = 8, WIT = 9)
 * @returns {{ subuh: string, terbit: string, dzuhur: string, ashar: string, maghrib: string, isya: string, raw: Object }}
 */
export function getPrayerTimes(date = new Date(), lat = -6.2088, lng = 106.8456, timezone = 7) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  // Julian Date calculation
  let m = month
  let y = year
  if (m <= 2) {
    y -= 1
    m += 12
  }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5

  const D = jd - 2451545.0
  const g = normalizeHours(357.529 + 0.98560028 * D)
  const q = normalizeHours(280.459 + 0.98564736 * D)
  const L = normalizeHours(q + 1.915 * Math.sin(degToRad(g)) + 0.02 * Math.sin(degToRad(2 * g)))

  const e = 23.439 - 0.00000036 * D
  const RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15.0
  const normalizedRA = normalizeHours(RA)

  // Deklinasi & Equation of Time (EoT)
  const dRad = Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L)))
  const declination = radToDeg(dRad)
  const equationOfTime = (q / 15.0) - normalizedRA

  // Solar Noon (Transit / Dzuhur)
  const noon = 12 + timezone - (lng / 15.0) - equationOfTime

  // Perhitungan sudut
  function sunAltitudeHourAngle(angle, isAboveNoon = false) {
    const latRad = degToRad(lat)
    const decRad = degToRad(declination)
    const angleRad = degToRad(angle)
    const cosHA = (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad))
    if (cosHA > 1.0 || cosHA < -1.0) return NaN
    const ha = radToDeg(Math.acos(cosHA)) / 15.0
    return isAboveNoon ? noon + ha : noon - ha
  }

  // Ashar: bayangan objek = tinggi objek + bayangan saat istiwa (Syafi'i)
  // altitude sudut matahari saat panjang bayangan = 1 + tan(|lat - declination|)
  const asrAltitude = radToDeg(Math.atan(1.0 / (1.0 + Math.tan(degToRad(Math.abs(lat - declination))))))
  const asrTime = sunAltitudeHourAngle(asrAltitude, true)

  // Subuh (20° di bawah horizon), Terbit (-0.833°), Maghrib (-0.833°), Isya (18° di bawah horizon)
  const fajrTime = sunAltitudeHourAngle(-20, false)
  const sunriseTime = sunAltitudeHourAngle(-0.833, false)
  const sunsetTime = sunAltitudeHourAngle(-0.833, true)
  const ishaTime = sunAltitudeHourAngle(-18, true)

  // Koreksi kehati-hatian ikhtiyat (+2 menit untuk sholat)
  const ikhtiyat = 2 / 60

  return {
    subuh: formatTime(fajrTime + ikhtiyat),
    terbit: formatTime(sunriseTime),
    dzuhur: formatTime(noon + ikhtiyat),
    ashar: formatTime(asrTime + ikhtiyat),
    maghrib: formatTime(sunsetTime + ikhtiyat),
    isya: formatTime(ishaTime + ikhtiyat),
    raw: {
      noon: noon + ikhtiyat,
      asr: asrTime + ikhtiyat,
      maghrib: sunsetTime + ikhtiyat,
    },
  }
}
