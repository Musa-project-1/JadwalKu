import { useState } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../../../lib/storage'

export function SettingsNotificationTab({ language }) {
  const [prefs, setPrefs] = useState(() => ({
    kelas: true,
    ujian: true,
    tugas: true,
    nativePush: false,
    classWindow: 15,
    sound: true,
    ...getItem(STORAGE_KEYS.reminderPrefs, {}),
  }))

  function updatePref(key, value) {
    const next = { ...prefs, [key]: value }
    setItem(STORAGE_KEYS.reminderPrefs, next)
    setPrefs(next)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Reminders & Notifications' : 'Pengingat & Suara'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Configure class alerts, task deadlines, and audio chime'
            : 'Atur waktu alarm sebelum kelas, peringatan deadline tugas, dan nada dering'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 space-y-4 shadow-2xs divide-y divide-outline-variant/15">
        <div className="flex items-center justify-between gap-2 pt-1 first:pt-0">
          <div>
            <p className="font-bold text-body-sm text-on-surface">
              {language === 'en' ? 'Lecture Schedule Alarms' : 'Pengingat Jadwal Kuliah'}
            </p>
            <p className="text-body-xs text-on-surface-variant">
              {language === 'en' ? 'Alerts before lecture sessions start' : 'Alarm waktu sebelum sesi kelas dimulai'}
            </p>
          </div>
          <ToggleSwitch checked={prefs.kelas} onChange={(v) => updatePref('kelas', v)} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-3.5">
          <div>
            <p className="font-bold text-body-sm text-on-surface">
              {language === 'en' ? 'Assignment Deadline Alarms' : 'Pengingat Deadline Tugas'}
            </p>
            <p className="text-body-xs text-on-surface-variant">
              {language === 'en' ? 'Warnings on due date & 1 day prior' : 'Peringatan tenggat tugas H-1 & Hari-H'}
            </p>
          </div>
          <ToggleSwitch checked={prefs.tugas} onChange={(v) => updatePref('tugas', v)} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-3.5">
          <div>
            <p className="font-bold text-body-sm text-on-surface">
              {language === 'en' ? 'Semester Exam Reminders' : 'Pengingat Ujian Semester'}
            </p>
            <p className="text-body-xs text-on-surface-variant">
              {language === 'en' ? 'Midterm & Final exam warnings 3 days prior' : 'Peringatan jadwal UTS dan UAS H-3 hari'}
            </p>
          </div>
          <ToggleSwitch checked={prefs.ujian} onChange={(v) => updatePref('ujian', v)} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-3.5">
          <div>
            <p className="font-bold text-body-sm text-on-surface">
              {language === 'en' ? 'Audio Chime Sound' : 'Bunyi Nada Pengingat (Audio Chime)'}</p>
            <p className="text-body-xs text-on-surface-variant">
              {language === 'en' ? 'Play gentle harmonic chime upon receiving alerts' : 'Mainkan nada lembut saat notifikasi masuk'}
            </p>
          </div>
          <ToggleSwitch checked={prefs.sound} onChange={(v) => updatePref('sound', v)} />
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-primary' : 'bg-surface-variant'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-level-1 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
