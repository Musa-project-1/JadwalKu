import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { Icon } from "../Icon"
import { useApp } from "../../hooks/useApp"
import { FEATURE_DOCS_TRANSLATIONS, adminDocs } from "../../data/featureDocsData"

export function FeatureDocsModal({ isOpen, onClose, mode = 'student' }) {
  const navigate = useNavigate()
  const { language } = useApp()
  const [activePilar, setActivePilar] = useState(mode === 'all' ? 'all' : mode)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(mode === 'admin' ? 14 : 1)

  const rawData = useMemo(() => {
    const langKey = language === 'en' ? 'en' : 'id'
    const studentList = FEATURE_DOCS_TRANSLATIONS[langKey] || FEATURE_DOCS_TRANSLATIONS.id
    // Gabungkan dengan fitur admin dari data bawaan jika mode admin/all
    const adminList = adminDocs
    return [...studentList, ...adminList]
  }, [language])

  const baseList = useMemo(() => {
    if (mode === 'student') return rawData.filter((i) => i.pilar === 'student')
    if (mode === 'admin') return rawData.filter((i) => i.pilar === 'admin')
    return rawData
  }, [mode, rawData])

  const filteredFeatures = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return baseList.filter((item) => {
      if (mode === 'all' && activePilar !== 'all' && item.pilar !== activePilar) return false
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.howTo.some((h) => h.toLowerCase().includes(q)) ||
        item.targetRole.toLowerCase().includes(q) ||
        item.tips.toLowerCase().includes(q)
      )
    })
  }, [baseList, mode, activePilar, searchQuery])

  if (!isOpen) return null

  function handleNavigate(route) {
    onClose()
    navigate(route)
  }

  const modalTitle =
    language === 'en'
      ? (mode === 'student' ? 'Student Feature Guides' : mode === 'admin' ? 'Admin Tutorials & Documentation' : 'Feature Documentation & Guides')
      : (mode === 'student'
          ? 'Pusat Panduan Fitur Mahasiswa'
          : mode === 'admin'
          ? 'Pusat Panduan & Tutorial Admin'
          : 'Pusat Panduan & Tutorial Fitur')

  const modalSubtitle =
    language === 'en'
      ? (mode === 'student'
          ? 'Complete interactive documentation and guides for all JadwalKu student features'
          : mode === 'admin'
          ? 'Technical documentation for managing master schedule, conflicts, notices, and database'
          : 'Interactive documentation & comprehensive user guide for all JadwalKu features')
      : (mode === 'student'
          ? 'Dokumentasi & panduan lengkap penggunaan seluruh fitur mahasiswa JadwalKu'
          : mode === 'admin'
          ? 'Dokumentasi teknis pengelolaan master jadwal, bentrok, pengumuman, dan database'
          : 'Dokumentasi interaktif & panduan lengkap penggunaan seluruh fitur aplikasi JadwalKu')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-5 tablet:p-6 bg-surface-container-lowest/90 dark:bg-surface-container-low/90 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25 shadow-xs shrink-0">
              <Icon name={mode === 'admin' ? 'admin_panel_settings' : 'menu_book'} size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-title-lg font-bold text-on-surface">{modalTitle}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  {baseList.length} Fitur
                </span>
              </div>
              <p className="text-body-xs text-on-surface-variant mt-0.5">
                {modalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
            title="Tutup Panduan"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Toolbar: Search + Filter Tabs */}
        <div className="p-4 tablet:p-5 border-b border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/30 flex flex-col tablet:flex-row items-stretch tablet:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Icon
              name="search"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mode === 'admin'
                  ? 'Cari fitur admin (misal: Impor Excel, Bentrok, Kalender, Pengumuman, Backup)...'
                  : 'Cari tutorial fitur (misal: KRS, Gambar WA, Dosen, Presensi, Kalender HP)...'
              }
              className="w-full pl-10 pr-9 py-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary dark:bg-surface-container-high/60 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Filter Pills (only shown if mode === 'all') */}
          {mode === 'all' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 tablet:pb-0 shrink-0">
              <button
                type="button"
                onClick={() => setActivePilar('all')}
                className={`px-3 py-1.5 rounded-full text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePilar === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua ({FEATURE_DOCS_DATA.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePilar('student')}
                className={`px-3 py-1.5 rounded-full text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activePilar === 'student'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>🎓 Mahasiswa (13)</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePilar('admin')}
                className={`px-3 py-1.5 rounded-full text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activePilar === 'admin'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>🛡️ Admin & Dosen (6)</span>
              </button>
            </div>
          )}
        </div>

        {/* Feature List Body */}
        <div className="flex-1 overflow-y-auto p-4 tablet:p-6 space-y-3">
          {filteredFeatures.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
                <Icon name="search_off" size={28} />
              </div>
              <h4 className="text-body-md font-bold text-on-surface">Tidak ada tutorial yang cocok</h4>
              <p className="text-body-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                Coba gunakan kata kunci pencarian lain atau pilih tab filter "Semua".
              </p>
            </div>
          ) : (
            filteredFeatures.map((feat) => {
              const isExpanded = expandedId === feat.id
              return (
                <div
                  key={feat.id}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-primary/40 bg-surface-container-low/60 shadow-xs dark:bg-surface-container-high/40'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 hover:border-outline-variant/40 dark:bg-surface-container-low/30'
                  }`}
                >
                  {/* Card Header (Click to Expand) */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : feat.id)}
                    className="w-full p-4 tablet:p-4.5 flex items-start tablet:items-center justify-between gap-3 text-left cursor-pointer group"
                  >
                    <div className="flex items-start tablet:items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br border ${feat.color} shadow-2xs group-hover:brightness-105 transition-all duration-200`}
                      >
                        <Icon name={feat.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-label-caps font-extrabold text-primary">
                            #{feat.id}
                          </span>
                          <h4 className="text-body-sm tablet:text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">
                            {feat.title}
                          </h4>
                          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[9.5px] font-bold text-on-surface-variant">
                            {feat.targetRole}
                          </span>
                        </div>
                        <p className="text-body-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {feat.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 tablet:pt-0">
                      <span className="hidden tablet:inline-block text-[11px] font-bold text-primary group-hover:underline">
                        {isExpanded ? 'Tutup Tutorial' : 'Lihat Cara Pakai'}
                      </span>
                      <Icon
                        name="expand_more"
                        size={20}
                        className={`text-on-surface-variant transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Content: Step-by-Step Tutorial */}
                  {isExpanded && (
                    <div className="border-t border-outline-variant/15 p-4 tablet:p-5 bg-surface-container-lowest/90 dark:bg-surface-container-low/70 space-y-4 animate-fade-in">
                      {/* Summary Banner */}
                      <p className="text-body-sm font-medium text-on-surface leading-relaxed">
                        {feat.summary}
                      </p>

                      {/* Step-by-Step Box */}
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 dark:bg-surface-container-high/30 p-4 space-y-2.5">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <Icon name="format_list_numbered" size={16} />
                          <span>Langkah-Langkah Penggunaan:</span>
                        </h5>
                        <ol className="space-y-2 text-body-xs text-on-surface-variant leading-relaxed">
                          {feat.howTo.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10.5px] font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="flex-1 text-on-surface/90">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Pro-Tips & Action Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        {feat.tips && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                            <Icon name="lightbulb" size={15} className="text-amber-500 shrink-0" />
                            <span><strong>Tips:</strong> {feat.tips}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleNavigate(feat.route)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary hover:brightness-105 active:opacity-80 text-body-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 ml-auto sm:ml-0"
                        >
                          <span>{feat.routeLabel}</span>
                          <Icon name="arrow_forward" size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-outline-variant/20 p-4 tablet:p-5 flex items-center justify-between bg-surface-container-lowest/95 dark:bg-surface-container-low/95">
          <p className="text-body-xs text-on-surface-variant hidden sm:block">
            Aplikasi JadwalKu • 100% Zero-Backend Architecture
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-body-sm transition-colors cursor-pointer ml-auto"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  )
}
