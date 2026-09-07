import { Component } from 'react'
import { Icon } from './Icon'

/**
 * Enterprise Global Error Boundary for JadwalKu
 * Menangkap seluruh error render React dan mencegah aplikasi blank putih total.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Log error secara terstruktur untuk keperluan audit/diagnostik
    console.error('[JadwalKu ErrorBoundary] Render crash terdeteksi:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = window.location.origin + window.location.pathname + '#/'
    window.location.reload()
  }

  handleClearCacheAndReset = () => {
    try {
      // Hapus data sesi atau cache sementara tanpa menghapus backup
      sessionStorage.clear()
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister())
        })
      }
    } catch {
      // Abaikan error cleanup
    }
    this.handleGoHome()
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state
      const errorMessage = error?.message || 'Error tidak diketahui saat memuat komponen'

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface dark:bg-surface-container-lowest text-on-surface animate-fade-in select-none">
          <div className="w-full max-w-lg rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low p-6 tablet:p-8 shadow-2xl text-center flex flex-col items-center">
            {/* Header Badge */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 mb-4 shadow-sm">
              <Icon name="error" size={36} />
            </div>

            <h1 className="text-title-md tablet:text-title-lg font-bold text-on-surface tracking-tight">
              Terjadi Kendala pada Aplikasi
            </h1>
            <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed">
              Aplikasi mengalami gangguan rendering yang tidak terduga. Seluruh jadwal dan tugas Anda tetap tersimpan dengan aman.
            </p>

            {/* Tombol Aksi Utama */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-body-xs shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="refresh" size={16} />
                <span>Muat Ulang Halaman</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-body-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="home" size={16} />
                <span>Kembali ke Beranda</span>
              </button>
            </div>

            {/* Opsi Bersihkan Cache */}
            <button
              type="button"
              onClick={this.handleClearCacheAndReset}
              className="mt-3 text-label-caps text-on-surface-variant hover:text-error underline transition-colors cursor-pointer"
            >
              Reset Cache & Refresh Aplikasi
            </button>

            {/* Detail Teknis (Diagnostik) */}
            <div className="mt-5 w-full text-left">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="flex items-center gap-1.5 text-label-caps font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer mx-auto"
              >
                <Icon name={showDetails ? 'expand_less' : 'expand_more'} size={16} />
                <span>{showDetails ? 'Sembunyikan Rincian Teknis' : 'Lihat Rincian Teknis (Untuk Pengembang)'}</span>
              </button>

              {showDetails && (
                <div className="mt-3 p-3 rounded-xl bg-surface-container-high/80 dark:bg-surface-container-highest/60 border border-outline-variant/20 text-[11px] font-mono text-on-surface-variant overflow-x-auto max-h-48 custom-scrollbar">
                  <p className="font-bold text-rose-500 mb-1">{errorMessage}</p>
                  {errorInfo?.componentStack && (
                    <pre className="whitespace-pre-wrap text-[10px] text-on-surface-variant/80">
                      {errorInfo.componentStack.trim()}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
