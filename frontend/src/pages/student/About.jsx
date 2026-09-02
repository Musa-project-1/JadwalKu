import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'

const FAQS = [
  {
    icon: 'sync',
    q: 'Kenapa jadwal perkuliahan belum update?',
    a: 'Jadwal akan diperbarui secara otomatis setelah administrator kampus mempublikasikan berkas jadwal baru. Pastikan perangkat Anda terhubung ke internet saat membuka aplikasi untuk mengunduh versi terbaru.',
  },
  {
    icon: 'tune',
    q: 'Bagaimana cara mengganti program studi atau semester?',
    a: 'Buka menu Pengaturan, lalu klik tombol "Ganti" pada kartu profil akademik di bagian atas. Pilihan program studi dan semester akan langsung disimpan di perangkat ini.',
  },
  {
    icon: 'notifications_active',
    q: 'Bagaimana cara kerja pengingat kelas?',
    a: 'Aplikasi menyediakan pengingat in-app untuk jadwal kelas aktif Anda. Anda juga dapat mengekspor seluruh jadwal ke Google Calendar atau Apple Calendar melalui menu Bagikan Jadwal.',
  },
  {
    icon: 'wifi_off',
    q: 'Apakah aplikasi bisa dibuka tanpa koneksi internet?',
    a: 'Ya, 100% bisa! JadwalKu menggunakan arsitektur Offline-First & Progressive Web App (PWA). Seluruh jadwal, ujian, catatan, dan tugas yang pernah dimuat tersimpan aman di penyimpanan lokal perangkat Anda.',
  },
  {
    icon: 'ios_share',
    q: 'Bagaimana cara membagikan jadwal ke teman atau grup?',
    a: 'Tekan ikon bagikan di halaman Jadwal Mingguan atau buka menu Bagikan Jadwal. Anda dapat menyalin ringkasan teks untuk WhatsApp/Telegram, menyimpan kartu gambar PNG, atau mengunduh berkas kalender .ics.',
  },
]

const FEATURES = [
  {
    icon: 'cloud_done',
    color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15',
    title: 'Offline-First & PWA',
    desc: 'Bisa diakses kapan pun walau tanpa kuota atau sinyal.',
  },
  {
    icon: 'bolt',
    color: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-500/15',
    title: 'Sinkronisasi Cepat',
    desc: 'Perubahan jadwal dari admin otomatis ter-update di layar.',
  },
  {
    icon: 'calendar_month',
    color: 'text-violet-700 dark:text-violet-300 bg-violet-500/10 dark:bg-violet-500/15',
    title: 'Ekspor Kalender',
    desc: 'Sinkronisasi mudah ke Google Calendar & Apple Calendar.',
  },
]

export default function About() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
          aria-label="Kembali"
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <div>
          <h2 className="text-display text-on-surface">Tentang & Bantuan</h2>
          <p className="text-body-sm text-on-surface-variant">
            Pusat informasi, panduan penggunaan, dan kontak bantuan JadwalKu
          </p>
        </div>
      </header>

      {/* Main Brand Hero Card */}
      <section className="relative overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-level-1 dark:bg-surface-container-low dark:border-outline-variant/15">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col items-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-container-low p-3 shadow-inner dark:bg-surface-container-high">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo JadwalKu" className="h-16 w-16 drop-shadow-md" />
          </div>

          <h1 className="text-headline-lg font-bold font-brand tracking-[-0.025em] text-on-surface">
            <span>Jadwal</span>
            <span className="text-primary">Ku</span>
          </h1>

          <p className="font-brand mt-1 text-body-xs font-bold tracking-wider uppercase text-primary">
            SCHEDULE SMARTER · CAMPUS TIMETABLE
          </p>

          <p className="mt-3 text-body-md text-on-surface-variant font-medium max-w-md">
            Aplikasi jadwal perkuliahan, ujian, dan manajemen tugas akademik Universitas Madani Yogyakarta.
          </p>

          {/* Version Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-surface-container px-3 py-1 text-label-caps font-bold text-on-surface-variant">
              Versi 0.1.0 (Beta)
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-label-caps font-bold text-emerald-800 dark:text-emerald-300">
              ⚡ PWA Ready
            </span>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-label-caps font-bold text-blue-800 dark:text-blue-300">
              💾 Offline First
            </span>
          </div>
        </div>
      </section>

      {/* Feature Highlights 3-Col Grid — horizontal side-by-side */}
      <section className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-start rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-level-1 dark:bg-surface-container-low dark:border-outline-variant/15"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl font-bold ${f.color}`}>
              <Icon name={f.icon} size={20} />
            </div>
            <h3 className="text-title-sm font-bold text-on-surface mb-1">{f.title}</h3>
            <p className="text-body-xs text-on-surface-variant leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* FAQ Accordion Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-title-lg font-bold text-on-surface">Pertanyaan yang Sering Diajukan</h3>
          <p className="text-body-sm text-on-surface-variant">
            Solusi cepat untuk pertanyaan seputar penggunaan jadwal kampus
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-level-1 dark:bg-surface-container-low dark:border-outline-variant/15 divide-y divide-outline-variant/15">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={faq.q} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-surface-container-low/60 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isOpen
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <Icon name={faq.icon} size={18} />
                    </div>
                    <span className="text-body-md font-bold text-on-surface leading-snug">
                      {faq.q}
                    </span>
                  </div>
                  <Icon
                    name="expand_more"
                    size={20}
                    className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-body-sm text-on-surface-variant leading-relaxed bg-surface-container-low/30 border-t border-outline-variant/10">
                    <p className="pl-11">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Support & Contact Card */}
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-surface-container-lowest p-6 sm:p-8 shadow-level-1 dark:from-primary/15 dark:via-surface-container-low dark:to-surface-container-low dark:border-primary/25">
        <div className="flex flex-col gap-6 tablet:flex-row tablet:items-center tablet:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-level-2">
              <Icon name="support_agent" size={24} />
            </div>
            <div>
              <h4 className="text-title-md font-bold text-on-surface">Butuh Bantuan Lebih Lanjut?</h4>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Hubungi administrator akademik jika ada jadwal yang bentrok atau mata kuliah belum terdaftar.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-body-xs font-semibold text-on-surface-variant/90">
                <span className="flex items-center gap-1">
                  <Icon name="phone" size={14} className="text-primary" />
                  +62 812-3456-7890
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Icon name="mail" size={14} className="text-primary" />
                  admin@jadwalkampus.app
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
              className="rounded-full px-5 py-2.5 font-bold shadow-level-2 cursor-pointer"
            >
              <Icon name="chat" size={18} className="mr-1" />
              WhatsApp Admin
            </Button>
          </div>
        </div>
      </section>

      {/* Campus Footer Note */}
      <footer className="text-center text-body-xs text-on-surface-variant/70 pt-2">
        <p>© {new Date().getFullYear()} Universitas Madani Yogyakarta · JadwalKu Platform</p>
      </footer>
    </div>
  )
}
