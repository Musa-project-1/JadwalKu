import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { setItem, STORAGE_KEYS } from '../../lib/storage'

const SLIDES = [
  {
    icon: 'calendar_month',
    title: 'Lihat jadwal kuliah & ujian dalam satu tempat',
    description: 'Akses jadwal akademik Anda kapan saja dengan mudah dan terorganisir.',
  },
  {
    icon: 'notifications_active',
    title: 'Dapat pengingat otomatis sebelum kelas & deadline tugas',
    description: 'Tidak akan pernah terlewat kelas, ujian, maupun tugas lagi.',
  },
  {
    icon: 'wifi_off',
    title: 'Tetap bisa dibuka walau tanpa internet',
    description: 'Data tersimpan di perangkat, tetap tampil saat offline.',
  },
]

export default function Intro() {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)

  function goToOnboarding() {
    setItem(STORAGE_KEYS.introSeen, true)
    navigate('/onboarding', { replace: true })
  }

  function next() {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1)
    } else {
      goToOnboarding()
    }
  }

  function onTouchStart(e) {
    setTouchStartX(e.touches[0].clientX)
  }

  function onTouchEnd(e) {
    if (touchStartX === null) return
    const delta = e.changedTouches[0].clientX - touchStartX
    if (delta < -48 && slide < SLIDES.length - 1) {
      setSlide(slide + 1)
    } else if (delta > 48 && slide > 0) {
      setSlide(slide - 1)
    }
    setTouchStartX(null)
  }

  const current = SLIDES[slide]

  return (
    <div
      className="flex min-h-screen flex-col bg-transparent"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="flex justify-end p-md">
        <button
          type="button"
          onClick={goToOnboarding}
          className="rounded-md px-2 py-1 text-title-md text-secondary transition-colors hover:text-primary"
        >
          Lewati
        </button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-lg text-center">
        <div className="mb-xl flex h-48 w-48 items-center justify-center rounded-full bg-surface-container dark:bg-surface-container-high">
          <Icon name={current.icon} size={80} filled className="text-primary-container" />
        </div>
        <h1 className="mb-sm text-headline-lg-mobile text-primary">
          {current.title}
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          {current.description}
        </p>
      </section>

      <footer className="flex flex-col items-center gap-lg p-lg">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === slide ? 'bg-primary' : 'bg-surface-variant'
              }`}
            />
          ))}
        </div>
        <Button className="w-full py-sm" onClick={next}>
          {slide < SLIDES.length - 1 ? 'Selanjutnya' : 'Mulai'}
        </Button>
      </footer>
    </div>
  )
}
