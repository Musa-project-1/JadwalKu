import { Icon } from './Icon'

/**
 * Banner status sukses/gagal yang seragam untuk semua layar admin.
 * Ikon check_circle muncul dengan animasi pop (feedback "tersimpan").
 * Warna memakai pasangan container/success-warning-info agar kontras
 * terjaga di kedua tema (lihat UIUX_MODERNIZATION.md §7.3).
 */
export function StatusBanner({ ok = true, message, onClose }) {
  if (!message) return null
  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-sm rounded-lg px-md py-sm text-body-sm animate-pop ${
        ok
          ? 'bg-success-container text-success'
          : 'bg-error-container text-on-error-container'
      }`}
    >
      <span className="flex items-center gap-xs">
        <Icon
          name={ok ? 'check_circle' : 'error'}
          size={18}
          className={`shrink-0 ${ok ? 'animate-pop' : ''}`}
        />
        {message}
      </span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  )
}
