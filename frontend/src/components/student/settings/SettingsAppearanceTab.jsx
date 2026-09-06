import { Icon } from '../../Icon'

export function SettingsAppearanceTab({
  theme,
  setTheme,
  language,
  setLanguage,
  t,
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  showPrayerDividers,
  setShowPrayerDividers,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Appearance & Display' : 'Tampilan & Preferensi'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Customize theme, interface language, typography scale, and contrast'
            : 'Sesuaikan tema, bahasa aplikasi, ukuran teks, dan aksesibilitas'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 space-y-4 shadow-2xs divide-y divide-outline-variant/15">
        {/* Tema / Theme */}
        <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 pt-1 first:pt-0">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="palette" size={17} className="text-primary" />
              <span>{language === 'en' ? 'Theme Mode' : 'Tema Aplikasi'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en' ? 'Light, Dark, or follow system setting' : 'Terang, Gelap, atau ikuti pengaturan sistem'}
            </p>
          </div>
          <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-level-1 shrink-0 min-w-[210px]">
            {[
              { value: 'system', label: language === 'en' ? 'System' : 'Sistem', icon: 'brightness_auto' },
              { value: 'light', label: language === 'en' ? 'Light' : 'Terang', icon: 'light_mode' },
              { value: 'dark', label: language === 'en' ? 'Dark' : 'Gelap', icon: 'dark_mode' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-1 text-body-xs font-bold transition-all duration-200 cursor-pointer active:opacity-80 ${
                  theme === opt.value
                    ? 'bg-surface text-primary shadow-level-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{opt.label}</span>
                <Icon name={opt.icon} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Bahasa / Language */}
        <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 pt-3.5">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="language" size={17} className="text-secondary" />
              <span>{t ? t('settings.language') : 'Bahasa / Language'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en' ? 'Select interface language' : 'Pilih bahasa antarmuka aplikasi'}
            </p>
          </div>
          <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-level-1 shrink-0 min-w-[190px]">
            {[
              { value: 'id', label: '🇮🇩 Indonesia' },
              { value: 'en', label: '🇬🇧 English' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                className={`flex-1 rounded-full py-1 px-2.5 text-body-xs font-bold transition-all duration-200 cursor-pointer active:opacity-80 ${
                  (language || 'id') === opt.value
                    ? 'bg-surface text-primary shadow-level-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ukuran Font */}
        <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 pt-3.5">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="format_size" size={17} className="text-primary" />
              <span>{language === 'en' ? 'Font Size' : 'Ukuran Font'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en' ? 'Adjust typography scale' : 'Atur ukuran skala tulisan'}
            </p>
          </div>
          <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-level-1 shrink-0 min-w-[220px]">
            {[
              { value: 'sm', label: language === 'en' ? 'Small' : 'Kecil' },
              { value: 'md', label: language === 'en' ? 'Medium' : 'Sedang' },
              { value: 'lg', label: language === 'en' ? 'Large' : 'Besar' },
              { value: 'xl', label: language === 'en' ? 'Extra' : 'Sangat Besar' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFontSize(opt.value)}
                className={`flex-1 rounded-full py-1 text-body-xs font-bold transition-all duration-200 cursor-pointer active:opacity-80 ${
                  fontSize === opt.value
                    ? 'bg-surface text-primary shadow-level-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kontras Tinggi */}
        <div className="flex items-center justify-between gap-4 pt-3.5">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="contrast" size={17} className="text-primary" />
              <span>{language === 'en' ? 'High Contrast (WCAG AAA)' : 'Kontras Tinggi'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en' ? 'Enhance text clarity' : 'Perkuat batas border dan ketajaman teks'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={highContrast}
            onClick={() => setHighContrast(!highContrast)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              highContrast ? 'bg-primary' : 'bg-surface-variant'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-level-1 ${
                highContrast ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Pembatas Sholat */}
        <div className="flex items-center justify-between gap-4 pt-3.5">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="mosque" size={17} className="text-secondary" />
              <span>{language === 'en' ? 'Prayer Time Dividers' : 'Pembatas Waktu Sholat'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en'
                ? 'Show dynamic Dhuhr, Asr, and Maghrib dividers in matrix schedule'
                : 'Tampilkan garis pembatas Dzuhur, Ashar, dan Maghrib pada tabel matriks'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showPrayerDividers}
            onClick={() => setShowPrayerDividers(!showPrayerDividers)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              showPrayerDividers ? 'bg-primary' : 'bg-surface-variant'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-level-1 ${
                showPrayerDividers ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
