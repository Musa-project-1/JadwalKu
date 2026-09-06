import { useState } from 'react'
import { Icon } from '../../Icon'
import { formatRuang } from '../../../lib/scheduleUtils'
import { TONE_CLASSES } from '../../../lib/classTypes'
import { formatWhatsAppUrl, safeExternalUrl } from './classDetailTheme'

export function ClassDetailInfoColumn({
  entry,
  course,
  transition,
  classType,
  theme,
  isOnlineClass,
  links,
  setLinks,
  reminderOn,
  handleReminderToggle,
  setRoomModalOpen,
  kode,
  saveLinksToStorage,
}) {
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [editingLinks, setEditingLinks] = useState(false)
  const [formLinks, setFormLinks] = useState({
    lmsUrl: links.lmsUrl || '',
    meetingUrl: links.meetingUrl || '',
    waGroupUrl: links.waGroupUrl || '',
  })

  function handleSaveLinks(e) {
    if (e) e.preventDefault()
    saveLinksToStorage(formLinks)
    setLinks(formLinks)
    setEditingLinks(false)
  }

  const tone = classType.tone || 'neutral'

  return (
    <div className="tablet:col-span-5 tablet:overflow-y-auto p-4 tablet:p-5 space-y-3.5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/20 custom-scrollbar">
      {/* Back-to-Back Class Transition Warning */}
      {transition && (
        <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-3.5 space-y-1.5 dark:bg-orange-500/15 shadow-xs">
          <div className="flex items-center gap-2 text-orange-950 dark:text-orange-200 font-extrabold text-body-xs">
            <Icon name="directions_run" size={17} className="text-orange-600 dark:text-orange-400 shrink-0 animate-bounce" />
            <span>Peringatan Pindah Ruang</span>
          </div>
          <p className="text-body-xs text-orange-950 dark:text-orange-100 leading-relaxed font-medium">
            {transition.type === 'incoming' ? (
              <>
                Dimulai <strong>{transition.gapMinutes === 0 ? 'langsung tanpa jeda' : `${transition.gapMinutes} menit`}</strong> setelah kelas sebelumnya di <strong>{transition.fromRoom}</strong>.
              </>
            ) : (
              <>
                Kelas berikutnya di <strong>{transition.toRoom}</strong> dengan jeda waktu <strong>{transition.gapMinutes === 0 ? '0 menit (langsung)' : `${transition.gapMinutes} menit`}</strong>.
              </>
            )}
          </p>
        </div>
      )}

      {/* Room & Building Location Card */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2 shadow-xs ring-1 ring-outline-variant/10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <Icon name={theme.iconName} size={16} className={theme.accentText} />
            Ruangan Kuliah
          </span>
          <button
            type="button"
            onClick={() => setRoomModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/30 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Icon name="explore" size={13} className={theme.accentText} />
            <span>Denah Lokasi</span>
          </button>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-body-md font-extrabold text-on-surface truncate">
            {formatRuang(entry.ruang, entry.tipeKelas)}
          </p>
          {classType.label && (
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${TONE_CLASSES[classType.tone] ?? 'bg-surface-container text-on-surface-variant'}`}>
              {classType.label}
            </span>
          )}
        </div>
      </div>

      {/* Lecturer Info & WhatsApp Action */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2.5 shadow-xs ring-1 ring-outline-variant/10">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${theme.accentBg} ${theme.accentText} font-bold shadow-2xs`}>
            <Icon name="person" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant">Dosen Pengampu</p>
            <p className="text-body-sm font-extrabold text-on-surface mt-0.5 leading-snug">
              {course?.dosen ?? 'Dosen belum ditentukan'}
            </p>
          </div>
        </div>

        {course?.kontakDosen ? (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
            <a
              href={formatWhatsAppUrl(course.kontakDosen)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-body-xs font-bold transition-all shadow-2xs group"
            >
              <Icon name="chat" size={15} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">{course.kontakDosen}</span>
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(course.kontakDosen)
                setCopiedPhone(true)
                setTimeout(() => setCopiedPhone(false), 2000)
              }}
              className="flex h-8 items-center gap-1 px-2.5 rounded-xl bg-surface-container text-[11px] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20"
            >
              <Icon name={copiedPhone ? 'check' : 'content_copy'} size={13} className={copiedPhone ? 'text-emerald-500' : ''} />
              <span>{copiedPhone ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-on-surface-variant font-medium pt-1 border-t border-outline-variant/15">
            Kontak WhatsApp dosen belum tersedia
          </p>
        )}
      </div>

      {/* Tautan Perkuliahan (LMS, Zoom, WA Group) */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2.5 shadow-xs ring-1 ring-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon name="link" size={16} className={theme.accentText} />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              Tautan Kuliah & LMS
            </span>
          </div>
          {!editingLinks && (
            <button
              type="button"
              onClick={() => {
                setFormLinks({
                  lmsUrl: links.lmsUrl || '',
                  meetingUrl: links.meetingUrl || '',
                  waGroupUrl: links.waGroupUrl || '',
                })
                setEditingLinks(true)
              }}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon name="edit" size={12} />
              <span>{links.lmsUrl || links.meetingUrl || links.waGroupUrl ? 'Ubah' : 'Tambah'}</span>
            </button>
          )}
        </div>

        {editingLinks ? (
          <form onSubmit={handleSaveLinks} className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[10.5px] font-bold text-on-surface-variant mb-1">
                Tautan LMS / Classroom / Materi
              </label>
              <input
                type="url"
                value={formLinks.lmsUrl}
                onChange={(e) => setFormLinks((prev) => ({ ...prev, lmsUrl: e.target.value }))}
                placeholder="https://classroom.google.com/..."
                className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-on-surface-variant mb-1">
                Tautan Zoom / Google Meet (Khusus Online)
              </label>
              <input
                type="url"
                value={formLinks.meetingUrl}
                onChange={(e) => setFormLinks((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                placeholder="https://zoom.us/j/... atau https://meet.google.com/..."
                className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-on-surface-variant mb-1">
                Tautan Grup WhatsApp Kelas
              </label>
              <input
                type="url"
                value={formLinks.waGroupUrl}
                onChange={(e) => setFormLinks((prev) => ({ ...prev, waGroupUrl: e.target.value }))}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingLinks(false)}
                className="px-3 py-1 rounded-xl text-[11px] font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-xl bg-primary text-on-primary text-[11px] font-bold shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {/* LMS */}
            {safeExternalUrl(links.lmsUrl) ? (
              <a
                href={safeExternalUrl(links.lmsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-transparent hover:from-blue-500/25 text-blue-900 dark:text-blue-200 border border-blue-500/35 ring-1 ring-blue-500/20 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon name="school" size={17} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">LMS / Classroom</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Buka</span>
                  <Icon name="open_in_new" size={12} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setEditingLinks(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all text-body-xs font-semibold cursor-pointer"
              >
                <Icon name="add" size={14} />
                <span>Atur Link LMS / Materi</span>
              </button>
            )}

            {/* Zoom / Meet */}
            {links.meetingUrl || isOnlineClass ? (
              <a
                href={safeExternalUrl(links.meetingUrl) || 'https://zoom.us/join'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent hover:from-blue-500/30 text-blue-950 dark:text-blue-200 border border-blue-500/40 ring-1 ring-blue-500/25 transition-all shadow-xs font-bold text-body-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                    <Icon name="videocam" size={15} />
                  </div>
                  <span className="truncate font-extrabold">{links.meetingUrl ? 'Zoom / Meet Kelas' : 'Buka Aplikasi Zoom'}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 dark:text-blue-300">
                  <span>Masuk</span>
                  <Icon name="open_in_new" size={12} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setEditingLinks(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all text-body-xs font-semibold cursor-pointer"
              >
                <Icon name="add" size={14} />
                <span>Atur Link Zoom / Meet</span>
              </button>
            )}

            {/* WA Group */}
            {safeExternalUrl(links.waGroupUrl) ? (
              <a
                href={safeExternalUrl(links.waGroupUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent hover:from-emerald-500/25 text-emerald-950 dark:text-emerald-200 border border-emerald-500/35 ring-1 ring-emerald-500/20 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon name="groups" size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Grup WhatsApp Kelas</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span>Gabung</span>
                  <Icon name="open_in_new" size={12} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setEditingLinks(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all text-body-xs font-semibold cursor-pointer"
              >
                <Icon name="add" size={14} />
                <span>Atur Grup WhatsApp Kelas</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 15-Minute Reminder Toggle */}
      <div className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 shadow-2xs transition-all ${
        reminderOn
          ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/15 dark:bg-primary/10'
          : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low'
      }`}>
        <div className="flex items-center gap-2.5">
          <Icon name="notifications_active" size={18} className={reminderOn ? theme.accentText : 'text-on-surface-variant'} />
          <span className="text-[12px] font-bold text-on-surface">Pengingat 15m sebelum kelas</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={reminderOn}
          aria-label={`Pengingat untuk ${course?.namaMK ?? kode}`}
          onClick={handleReminderToggle}
          className={`relative h-5 w-10 shrink-0 rounded-full transition-colors cursor-pointer ${
            reminderOn ? (tone === 'offline' ? 'bg-emerald-600' : tone === 'online' ? 'bg-blue-600' : tone === 'hybrid' ? 'bg-purple-600' : tone === 'combined' ? 'bg-amber-600' : 'bg-primary') : 'bg-surface-variant'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all shadow-xs ${
              reminderOn ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
