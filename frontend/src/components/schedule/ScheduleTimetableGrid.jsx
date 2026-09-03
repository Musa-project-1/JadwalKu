import { useMemo } from 'react'
import { Icon } from '../Icon'
import { TimetableClassCard } from './TimetableClassCard'
import { TIME_SESSION_DEFS, getSessionForClass, checkPrayerClash, parseTimeToMinutes } from '../../lib/scheduleGridUtils'
import { getPrayerTimes } from '../../lib/prayerTimes'

/**
 * ScheduleTimetableGrid — Komponen Matriks Jadwal Mingguan
 * Mengelompokkan jadwal per sesi (Pagi, Siang, Sore, Malam) dengan garis waktu sholat dinamis.
 */
export function ScheduleTimetableGrid({
  borderless = false,
  days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  dayDates = {},
  todayName = 'Senin',
  scheduleEntries = [],
  courseMap = new Map(),
  onOpenDetail,
  onOpenLocation,
  language = 'id',
  showPrayerDividers = true,
  selectedDayMobile,
  onSelectDayMobile,
}) {
  // 1. Hitung Waktu Sholat Hari Ini (Zero-API / 100% Offline)
  const prayerTimes = useMemo(() => getPrayerTimes(new Date()), [])

  // 2. Kelompokkan entri per Hari dan per Sesi
  const gridMatrix = useMemo(() => {
    // Struktur: { [day]: { pagi: [], siang: [], sore: [], malam: [] } }
    const matrix = {}
    days.forEach((d) => {
      matrix[d] = { pagi: [], siang: [], sore: [], malam: [] }
    })

    scheduleEntries.forEach((entry) => {
      const day = entry.hari
      if (!matrix[day]) return
      const session = getSessionForClass(entry.jamMulai, entry.jamSelesai, prayerTimes)
      matrix[day][session].push(entry)
    })

    // Urutkan jadwal dalam sesi berdasarkan jam mulai
    days.forEach((d) => {
      Object.keys(matrix[d]).forEach((sess) => {
        matrix[d][sess].sort((a, b) => parseTimeToMinutes(a.jamMulai) - parseTimeToMinutes(b.jamMulai))
      })
    })

    return matrix
  }, [days, scheduleEntries, prayerTimes])

  // Mengetahui menit sekarang untuk live pulse & dimmed status
  const currentMinutes = useMemo(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }, [])

  return (
    <div className={`w-full flex flex-col overflow-hidden ${
      borderless
        ? 'bg-transparent'
        : 'rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-1'
    }`}>
      {/* ── MOBILE DAY SELECTOR (<600px) ── */}
      <div className="tablet:hidden border-b border-outline-variant/20 p-2.5 bg-surface-container-low/50 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {days.map((d) => {
          const isSelected = selectedDayMobile ? selectedDayMobile === d : todayName === d
          const isToday = todayName === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDayMobile && onSelectDayMobile(d)}
              className={`flex-1 min-w-[72px] py-1.5 px-2 rounded-xl text-center text-label-caps font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-level-1'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span className="block truncate">{d}</span>
              {isToday && <span className="block text-[9px] opacity-85">Hari Ini</span>}
            </button>
          )
        })}
      </div>

      {/* ── DESKTOP & TABLET MATRIX TABLE (≥600px) ── */}
      <div className="hidden tablet:block overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[700px]">
          {/* Table Header: Hari & Tanggal */}
          <thead>
            <tr className="border-b border-outline-variant/25 bg-surface-container-low/40 dark:bg-surface-container-high/30">
              {/* Kolom Kiri: Header Sesi */}
              <th className="w-20 p-2.5 text-center text-label-caps font-extrabold uppercase text-on-surface-variant tracking-wider border-r border-outline-variant/15">
                {language === 'en' ? 'Time' : 'Waktu'}
              </th>
              {/* Kolom Hari */}
              {days.map((day) => {
                const isToday = todayName === day
                const dateLabel = dayDates[day] || ''
                return (
                  <th
                    key={day}
                    className={`relative p-3 text-center transition-colors border-r last:border-r-0 border-outline-variant/15 ${
                      isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <span className="text-title-sm font-bold text-on-surface">{day}</span>
                      {dateLabel && (
                        <span className="text-label-caps font-medium text-on-surface-variant">
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    {/* Active Day Indicator Bar (seperti di screenshot) */}
                    {isToday && (
                      <div className="absolute bottom-0 inset-x-2 h-[3px] rounded-full bg-primary" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body: Sesi Pagi, Dzuhur, Siang, Ashar, Sore, Maghrib, Malam */}
          <tbody className="divide-y divide-outline-variant/15">
            {/* 1. SESI PAGI */}
            <SessionRow
              sessionDef={TIME_SESSION_DEFS[0]}
              days={days}
              gridMatrix={gridMatrix}
              courseMap={courseMap}
              todayName={todayName}
              currentMinutes={currentMinutes}
              prayerTimes={prayerTimes}
              language={language}
              onOpenDetail={onOpenDetail}
              onOpenLocation={onOpenLocation}
            />

            {/* ── PEMBATAS SHOLAT DZUHUR / SHOLAT JUMAT ── */}
            {showPrayerDividers && (
              <PrayerDividerRow
                name="Dzuhur"
                time={prayerTimes.dzuhur}
                colSpan={days.length + 1}
                hasFriday={days.includes('Jumat')}
                language={language}
              />
            )}

            {/* 2. SESI SIANG */}
            <SessionRow
              sessionDef={TIME_SESSION_DEFS[1]}
              days={days}
              gridMatrix={gridMatrix}
              courseMap={courseMap}
              todayName={todayName}
              currentMinutes={currentMinutes}
              prayerTimes={prayerTimes}
              language={language}
              onOpenDetail={onOpenDetail}
              onOpenLocation={onOpenLocation}
            />

            {/* ── PEMBATAS SHOLAT ASHAR ── */}
            {showPrayerDividers && (
              <PrayerDividerRow
                name="Ashar"
                time={prayerTimes.ashar}
                colSpan={days.length + 1}
                language={language}
              />
            )}

            {/* 3. SESI SORE */}
            <SessionRow
              sessionDef={TIME_SESSION_DEFS[2]}
              days={days}
              gridMatrix={gridMatrix}
              courseMap={courseMap}
              todayName={todayName}
              currentMinutes={currentMinutes}
              prayerTimes={prayerTimes}
              language={language}
              onOpenDetail={onOpenDetail}
              onOpenLocation={onOpenLocation}
            />

            {/* ── PEMBATAS SHOLAT MAGHRIB ── */}
            {showPrayerDividers && (
              <PrayerDividerRow
                name="Maghrib"
                time={prayerTimes.maghrib}
                colSpan={days.length + 1}
                language={language}
              />
            )}

            {/* 4. SESI MALAM */}
            <SessionRow
              sessionDef={TIME_SESSION_DEFS[3]}
              days={days}
              gridMatrix={gridMatrix}
              courseMap={courseMap}
              todayName={todayName}
              currentMinutes={currentMinutes}
              prayerTimes={prayerTimes}
              language={language}
              onOpenDetail={onOpenDetail}
              onOpenLocation={onOpenLocation}
            />
          </tbody>
        </table>
      </div>

      {/* ── MOBILE SINGLE-DAY MATRIX VIEW (<600px) ── */}
      <div className="tablet:hidden p-3.5 space-y-3.5">
        {(() => {
          const activeDay = selectedDayMobile || todayName
          const dayData = gridMatrix[activeDay] || { pagi: [], siang: [], sore: [], malam: [] }

          return (
            <>
              {/* Header Info Hari Mobile */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <span className="text-title-sm font-bold text-on-surface">{activeDay}</span>
                  {activeDay === todayName && (
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                      {language === 'en' ? 'Today' : 'Hari Ini'}
                    </span>
                  )}
                </div>
                <span className="text-label-caps text-on-surface-variant font-medium">
                  {dayDates[activeDay] || ''}
                </span>
              </div>

              {/* Sesi Pagi Mobile */}
              <MobileSessionSection
                sessionDef={TIME_SESSION_DEFS[0]}
                items={dayData.pagi}
                courseMap={courseMap}
                activeDay={activeDay}
                todayName={todayName}
                currentMinutes={currentMinutes}
                prayerTimes={prayerTimes}
                language={language}
                onOpenDetail={onOpenDetail}
                onOpenLocation={onOpenLocation}
              />

              {/* Pembatas Dzuhur / Sholat Jumat */}
              {showPrayerDividers && (
                <MobilePrayerDivider
                  name={activeDay === 'Jumat' ? 'Jumat' : 'Dzuhur'}
                  time={activeDay === 'Jumat' ? '11.30 – 13.00' : prayerTimes.dzuhur}
                  isFriday={activeDay === 'Jumat'}
                  language={language}
                />
              )}

              {/* Sesi Siang Mobile */}
              <MobileSessionSection
                sessionDef={TIME_SESSION_DEFS[1]}
                items={dayData.siang}
                courseMap={courseMap}
                activeDay={activeDay}
                todayName={todayName}
                currentMinutes={currentMinutes}
                prayerTimes={prayerTimes}
                language={language}
                onOpenDetail={onOpenDetail}
                onOpenLocation={onOpenLocation}
              />

              {/* Pembatas Ashar */}
              {showPrayerDividers && (
                <MobilePrayerDivider name="Ashar" time={prayerTimes.ashar} language={language} />
              )}

              {/* Sesi Sore Mobile */}
              <MobileSessionSection
                sessionDef={TIME_SESSION_DEFS[2]}
                items={dayData.sore}
                courseMap={courseMap}
                activeDay={activeDay}
                todayName={todayName}
                currentMinutes={currentMinutes}
                prayerTimes={prayerTimes}
                language={language}
                onOpenDetail={onOpenDetail}
                onOpenLocation={onOpenLocation}
              />

              {/* Pembatas Maghrib */}
              {showPrayerDividers && (
                <MobilePrayerDivider name="Maghrib" time={prayerTimes.maghrib} language={language} />
              )}

              {/* Sesi Malam Mobile */}
              <MobileSessionSection
                sessionDef={TIME_SESSION_DEFS[3]}
                items={dayData.malam}
                courseMap={courseMap}
                activeDay={activeDay}
                todayName={todayName}
                currentMinutes={currentMinutes}
                prayerTimes={prayerTimes}
                language={language}
                onOpenDetail={onOpenDetail}
                onOpenLocation={onOpenLocation}
              />
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ── SUB-KOMPONEN DESKTOP: SessionRow ──
function SessionRow({
  sessionDef,
  days,
  gridMatrix,
  courseMap,
  todayName,
  currentMinutes,
  prayerTimes,
  language,
  onOpenDetail,
  onOpenLocation,
}) {
  return (
    <tr className="align-top">
      {/* Label Sesi (Icon di atas, teks sesi di tengah, waktu di bawah) */}
      <td className="w-20 p-2 border-r border-outline-variant/15 bg-surface-container-low/20 text-center">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant shadow-2xs">
            <Icon name={sessionDef.icon} size={15} />
          </span>
          <span className="block text-body-xs font-bold text-on-surface leading-tight">
            {language === 'en' ? sessionDef.labelEn : sessionDef.label}
          </span>
          <span className="block text-[9.5px] text-on-surface-variant/80 font-mono tracking-tighter leading-tight">
            {sessionDef.approx}
          </span>
        </div>
      </td>

      {/* Sel per Hari */}
      {days.map((day) => {
        const items = gridMatrix[day]?.[sessionDef.id] || []
        const isToday = todayName === day

        return (
          <td
            key={day}
            className={`p-1.5 border-r last:border-r-0 border-outline-variant/15 min-h-[90px] ${
              isToday ? 'bg-primary/[0.02] dark:bg-primary/[0.04]' : ''
            }`}
          >
            {items.length === 0 ? (
              // Clean Negative Space (Slot Kosong tanpa garis putus-putus)
              <div className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                {items.map((entry) => {
                  const course = courseMap.get(entry.kodeMK)
                  const clashInfo = checkPrayerClash(day, entry.jamMulai, entry.jamSelesai, prayerTimes)

                  // Hitung live & passed state
                  const startMins = parseTimeToMinutes(entry.jamMulai)
                  const endMins = parseTimeToMinutes(entry.jamSelesai)
                  const isOngoing = isToday && currentMinutes >= startMins && currentMinutes < endMins
                  const isPassed = isToday && currentMinutes >= endMins

                  return (
                    <TimetableClassCard
                      key={entry.id || `${entry.kodeMK}-${entry.jamMulai}`}
                      entry={entry}
                      course={course}
                      clashInfo={clashInfo}
                      isOngoing={isOngoing}
                      isPassed={isPassed}
                      onOpenDetail={() => onOpenDetail && onOpenDetail(entry)}
                      language={language}
                    />
                  )
                })}
              </div>
            )}
          </td>
        )
      })}
    </tr>
  )
}

// ── SUB-KOMPONEN DESKTOP: PrayerDividerRow ──
function PrayerDividerRow({ name, time, colSpan, hasFriday = false, language }) {
  return (
    <tr className="bg-surface-container-low/60 dark:bg-surface-container-high/30">
      <td colSpan={colSpan} className="py-1 px-3 border-y border-outline-variant/20">
        <div className="flex items-center gap-2 text-label-caps font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-outline-variant/25 shadow-2xs font-mono">
            <Icon name="mosque" size={13} className="text-secondary" />
            <span>{name} · {time}</span>
          </span>
          {name === 'Dzuhur' && hasFriday && (
            <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {language === 'en' ? '🕌 Friday Prayer: 11.30 – 13.00' : '🕌 Khusus Jumat: 11.30 – 13.00'}
            </span>
          )}
          <div className="flex-1 border-t border-dashed border-outline-variant/30" />
        </div>
      </td>
    </tr>
  )
}

// ── SUB-KOMPONEN MOBILE: MobileSessionSection ──
function MobileSessionSection({
  sessionDef,
  items = [],
  courseMap,
  activeDay,
  todayName,
  currentMinutes,
  prayerTimes,
  language,
  onOpenDetail,
  onOpenLocation,
}) {
  const isToday = activeDay === todayName

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-label-caps font-bold text-on-surface-variant">
        <Icon name={sessionDef.icon} size={15} className="text-primary" />
        <span>{language === 'en' ? sessionDef.labelEn : sessionDef.label}</span>
        <span className="text-[10px] opacity-70 font-mono">({sessionDef.approx})</span>
      </div>

      {items.length === 0 ? (
        <div className="p-2 text-center text-label-caps text-on-surface-variant/60 rounded-xl bg-surface-container-low/30">
          {language === 'en' ? 'No classes in this session' : 'Tidak ada kelas pada sesi ini'}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((entry) => {
            const course = courseMap.get(entry.kodeMK)
            const clashInfo = checkPrayerClash(activeDay, entry.jamMulai, entry.jamSelesai, prayerTimes)
            const startMins = parseTimeToMinutes(entry.jamMulai)
            const endMins = parseTimeToMinutes(entry.jamSelesai)
            const isOngoing = isToday && currentMinutes >= startMins && currentMinutes < endMins
            const isPassed = isToday && currentMinutes >= endMins

            return (
              <TimetableClassCard
                key={entry.id || `${entry.kodeMK}-${entry.jamMulai}`}
                entry={entry}
                course={course}
                clashInfo={clashInfo}
                isOngoing={isOngoing}
                isPassed={isPassed}
                onOpenDetail={() => onOpenDetail && onOpenDetail(entry)}
                language={language}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── SUB-KOMPONEN MOBILE: MobilePrayerDivider ──
function MobilePrayerDivider({ name, time, isFriday = false, language }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-outline-variant/25 text-label-caps font-bold font-mono">
        <Icon name="mosque" size={13} className="text-secondary" />
        <span>{name} · {time}</span>
      </span>
      {isFriday && (
        <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
          {language === 'en' ? 'Friday Prayer' : 'Sholat Jumat'}
        </span>
      )}
      <div className="flex-1 border-t border-dashed border-outline-variant/30" />
    </div>
  )
}
