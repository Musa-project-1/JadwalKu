import { Icon } from '../../Icon'

export function ClassDetailAttendanceTab({
  attendanceInfo,
  quickIncrement,
  kode,
  resetCourseAttendance,
  nextSessionNum,
  setMeetingStatus,
}) {
  return (
    <div className="space-y-4 animate-fade-in flex-1">
      {/* Quota & Sisa Absen Banner */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface-container-low/80 to-transparent dark:from-emerald-500/15 dark:to-transparent ring-1 ring-emerald-500/20 shadow-xs">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Status Presensi Kuliah
          </p>
          <p className="text-body-xs text-on-surface font-semibold mt-0.5">
            Tercatat <strong className="text-emerald-700 dark:text-emerald-300 text-[13px]">{attendanceInfo.counts.hadir}</strong> hadir dari {attendanceInfo.counts.totalFilled || 0} pertemuan
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-body-xs font-extrabold shadow-xs ${
            attendanceInfo.statusTier === 'danger'
              ? 'bg-error text-white'
              : attendanceInfo.statusTier === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          <Icon
            name={
              attendanceInfo.statusTier === 'danger'
                ? 'error'
                : attendanceInfo.statusTier === 'warning'
                ? 'warning'
                : 'check_circle'
            }
            size={15}
          />
          <span>
            {attendanceInfo.statusTier === 'danger'
              ? 'Jatah Habis (0x)'
              : `Sisa Jatah: ${attendanceInfo.remainingAbsences}x`}
          </span>
        </span>
      </div>

      {/* Progress Bar UAS Requirement */}
      <div className="space-y-2 p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/30 shadow-2xs">
        <div className="flex items-center justify-between text-body-xs font-semibold">
          <span className="text-on-surface-variant font-bold">Tingkat Kehadiran Mahasiswa:</span>
          <span className={attendanceInfo.attendancePercent >= 75 ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-error font-black'}>
            {attendanceInfo.attendancePercent}% (Target UAS: 75%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className={`h-full transition-all duration-300 rounded-full shadow-2xs ${
              attendanceInfo.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-error'
            }`}
            style={{ width: `${Math.min(100, attendanceInfo.attendancePercent)}%` }}
          />
        </div>
      </div>

      {/* Quick Increment Log Buttons */}
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-2">
          Catat Cepat Pertemuan Berikutnya:
        </p>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => quickIncrement(kode, 'hadir')}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35 ring-1 ring-emerald-500/20 font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span className="text-body-xs font-black">+ Hadir</span>
            <span className="text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{attendanceInfo.counts.hadir}x</span>
          </button>
          <button
            type="button"
            onClick={() => quickIncrement(kode, 'izin')}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 active:scale-95 text-blue-800 dark:text-blue-200 border border-blue-500/35 ring-1 ring-blue-500/20 font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span className="text-body-xs font-black">+ Izin</span>
            <span className="text-[10.5px] font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{attendanceInfo.counts.izin}x</span>
          </button>
          <button
            type="button"
            onClick={() => quickIncrement(kode, 'sakit')}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-900 dark:text-amber-200 border border-amber-500/35 ring-1 ring-amber-500/20 font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span className="text-body-xs font-black">+ Sakit</span>
            <span className="text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">{attendanceInfo.counts.sakit}x</span>
          </button>
          <button
            type="button"
            onClick={() => quickIncrement(kode, 'alpa')}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-error/15 hover:bg-error/25 active:scale-95 text-error border border-error/35 ring-1 ring-error/20 font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span className="text-body-xs font-black">+ Alpa</span>
            <span className="text-[10.5px] font-extrabold text-error mt-0.5">{attendanceInfo.counts.alpa}x</span>
          </button>
        </div>
      </div>

      {/* 16-Meeting Matrix (Split into UTS: 1-8 & UAS: 9-16) */}
      <div className="pt-2 border-t border-outline-variant/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
            Matriks 16 Pertemuan
          </span>
          {attendanceInfo.counts.totalFilled > 0 && (
            <button
              type="button"
              onClick={() => resetCourseAttendance(kode)}
              className="text-[11px] font-bold text-error hover:underline transition-colors cursor-pointer"
            >
              Reset Presensi
            </button>
          )}
        </div>

        {/* Sesi 1-8 (Pra-UTS) */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-on-surface-variant">Sesi 1 - 8 (Pra-UTS):</span>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => {
              const status = attendanceInfo.sessions[num]
              const isNext = num === nextSessionNum
              let bg = isNext
                ? 'bg-primary/10 text-primary border-2 border-primary ring-2 ring-primary/25 font-black animate-pulse'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
              let label = num

              if (status === 'hadir') {
                bg = 'bg-emerald-500 text-white font-extrabold shadow-2xs border border-emerald-600'
                label = 'H'
              } else if (status === 'izin') {
                bg = 'bg-blue-500 text-white font-extrabold shadow-2xs border border-blue-600'
                label = 'I'
              } else if (status === 'sakit') {
                bg = 'bg-amber-500 text-white font-extrabold shadow-2xs border border-amber-600'
                label = 'S'
              } else if (status === 'alpa') {
                bg = 'bg-error text-white font-extrabold shadow-2xs border border-red-700'
                label = 'A'
              }

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const nextStatus =
                      !status
                        ? 'hadir'
                        : status === 'hadir'
                        ? 'izin'
                        : status === 'izin'
                        ? 'sakit'
                        : status === 'sakit'
                        ? 'alpa'
                        : null
                    setMeetingStatus(kode, num, nextStatus)
                  }}
                  title={`Sesi ${num}: ${status ? status.toUpperCase() : isNext ? 'Sesi Berikutnya' : 'Belum diisi'} (Klik ubah)`}
                  className={`flex h-8 w-full items-center justify-center rounded-xl text-body-xs font-bold transition-all active:scale-90 cursor-pointer ${bg}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sesi 9-16 (Pra-UAS) */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-on-surface-variant">Sesi 9 - 16 (Pra-UAS):</span>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => i + 9).map((num) => {
              const status = attendanceInfo.sessions[num]
              const isNext = num === nextSessionNum
              let bg = isNext
                ? 'bg-primary/10 text-primary border-2 border-primary ring-2 ring-primary/25 font-black animate-pulse'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
              let label = num

              if (status === 'hadir') {
                bg = 'bg-emerald-500 text-white font-extrabold shadow-2xs border border-emerald-600'
                label = 'H'
              } else if (status === 'izin') {
                bg = 'bg-blue-500 text-white font-extrabold shadow-2xs border border-blue-600'
                label = 'I'
              } else if (status === 'sakit') {
                bg = 'bg-amber-500 text-white font-extrabold shadow-2xs border border-amber-600'
                label = 'S'
              } else if (status === 'alpa') {
                bg = 'bg-error text-white font-extrabold shadow-2xs border border-red-700'
                label = 'A'
              }

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const nextStatus =
                      !status
                        ? 'hadir'
                        : status === 'hadir'
                        ? 'izin'
                        : status === 'izin'
                        ? 'sakit'
                        : status === 'sakit'
                        ? 'alpa'
                        : null
                    setMeetingStatus(kode, num, nextStatus)
                  }}
                  title={`Sesi ${num}: ${status ? status.toUpperCase() : isNext ? 'Sesi Berikutnya' : 'Belum diisi'} (Klik ubah)`}
                  className={`flex h-8 w-full items-center justify-center rounded-xl text-body-xs font-bold transition-all active:scale-90 cursor-pointer ${bg}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-[10.5px] text-on-surface-variant text-center pt-1 font-medium">
          Klik sesi untuk memutar status: <strong className="text-emerald-600 dark:text-emerald-400">H (Hadir)</strong> &rarr; <strong className="text-blue-600 dark:text-blue-400">I (Izin)</strong> &rarr; <strong className="text-amber-600 dark:text-amber-400">S (Sakit)</strong> &rarr; <strong className="text-error">A (Alpa)</strong>
        </p>
      </div>
    </div>
  )
}
