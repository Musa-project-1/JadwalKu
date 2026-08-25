import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'

const FAQS = [
  {
    q: 'Kenapa jadwal belum update?',
    a: 'Jadwal hanya berubah setelah admin mempublikasikan data baru. Pastikan koneksi internet aktif, data terbaru muncul otomatis tanpa perlu refresh.',
  },
  {
    q: 'Bagaimana cara ubah prodi/semester?',
    a: 'Buka menu Pengaturan, lalu tekan tombol "Ganti" di bagian atas. Pilihan prodi dan semester tersimpan di perangkat ini.',
  },
  {
    q: 'Kenapa notifikasi tidak muncul?',
    a: 'Pengingat hanya tampil saat aplikasi sedang terbuka (in-app notification). Pastikan aplikasi tidak ditutup total sebelum jam kelas.',
  },
  {
    q: 'Apakah aplikasi bisa dibuka tanpa internet?',
    a: 'Ya. Setelah data dimuat sekali, jadwal tetap tampil walau offline. Tugas dan catatan tersimpan di perangkat.',
  },
]

export default function About() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <header className="flex items-center gap-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="Kembali"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h2 className="text-display text-on-surface">Tentang & Bantuan</h2>
      </header>

      <section className="rounded-3xl bg-surface-container-lowest p-lg text-center border border-outline-variant/15 shadow-level-1 dark:bg-surface-container-low">
        <img src="/logo.svg" alt="Logo JadwalKu" className="mx-auto mb-md h-20 w-20" />
        <h3 className="text-title-md text-on-surface font-semibold">Jadwal Kampus</h3>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Jadwal kuliah & ujian Universitas Madani Yogyakarta
        </p>
        <p className="mt-xs text-label-caps text-outline-variant">Versi 0.1.0</p>
      </section>

      <section className="space-y-sm">
        <h3 className="text-title-md text-on-surface font-semibold">Pertanyaan Umum</h3>
        {FAQS.map((faq, i) => (
          <div
            key={faq.q}
            className="overflow-hidden rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-level-1 dark:bg-surface-container-low"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
              className="flex w-full items-center justify-between gap-sm px-md py-sm text-left hover:bg-surface-container-lowest/50"
            >
              <span className="text-body-lg font-semibold text-on-surface">{faq.q}</span>
              <Icon
                name={openIndex === i ? 'expand_less' : 'expand_more'}
                size={20}
                className="shrink-0 text-on-surface-variant"
              />
            </button>
            {openIndex === i && (
              <p className="border-t border-surface-variant px-md py-sm text-body-lg text-on-surface-variant bg-surface-container-lowest/20">
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </section>

      <div className="border border-outline-variant/15 rounded-3xl bg-surface-container-lowest p-md shadow-sm dark:bg-surface-container-low/30">
        <section className="flex flex-col gap-sm rounded-2xl bg-primary/5 p-4 border border-primary/10 tablet:flex-row tablet:items-center tablet:justify-between">
          <div className="flex items-center gap-sm">
            <Icon name="chat" size={24} className="text-primary" />
            <div>
              <p className="text-body-lg text-on-surface font-semibold">Hubungi Admin</p>
              <p className="text-body-sm text-on-surface-variant">
                WhatsApp: +62 812-3456-7890 · admin@jadwalkampus.app
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
            className="w-full tablet:w-auto hover:scale-105 active:scale-95 transition-transform duration-150"
          >
            <Icon name="chat" size={20} />
            WhatsApp Admin
          </Button>
        </section>
      </div>
    </div>
  )
}
