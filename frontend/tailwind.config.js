/** @type {import('tailwindcss').Config} */

/**
 * Warna direferensikan lewat CSS variables yang didefinisikan di src/index.css
 * (:root = skema terang, .dark = skema gelap dari blok colors-dark di
 * design-system.md). Format nilai: channel RGB tanpa prefiks, dipakai sebagai
 * rgb(var(--c-*) / <alpha-value>) agar modifier opacity (/10, /20, dst.) tetap
 * berfungsi.
 */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      tablet: '600px',
      desktop: '1024px',
    },
    extend: {
      colors: {
        surface: token('surface'),
        'surface-dim': token('surface-dim'),
        'surface-bright': token('surface-bright'),
        'surface-container-lowest': token('surface-container-lowest'),
        'surface-container-low': token('surface-container-low'),
        'surface-container': token('surface-container'),
        'surface-container-high': token('surface-container-high'),
        'surface-container-highest': token('surface-container-highest'),
        'on-surface': token('on-surface'),
        'on-surface-variant': token('on-surface-variant'),
        'inverse-surface': token('inverse-surface'),
        'inverse-on-surface': token('inverse-on-surface'),
        outline: token('outline'),
        'outline-variant': token('outline-variant'),
        'surface-tint': token('surface-tint'),
        primary: token('primary'),
        'on-primary': token('on-primary'),
        'primary-container': token('primary-container'),
        'on-primary-container': token('on-primary-container'),
        'inverse-primary': token('inverse-primary'),
        secondary: token('secondary'),
        'on-secondary': token('on-secondary'),
        'secondary-container': token('secondary-container'),
        'on-secondary-container': token('on-secondary-container'),
        tertiary: token('tertiary'),
        'on-tertiary': token('on-tertiary'),
        'tertiary-container': token('tertiary-container'),
        'on-tertiary-container': token('on-tertiary-container'),
        error: token('error'),
        'on-error': token('on-error'),
        'error-container': token('error-container'),
        'on-error-container': token('on-error-container'),
        success: token('success'),
        'success-container': token('success-container'),
        warning: token('warning'),
        'warning-container': token('warning-container'),
        info: token('info'),
        'info-container': token('info-container'),
        'primary-fixed': token('primary-fixed'),
        'primary-fixed-dim': token('primary-fixed-dim'),
        'on-primary-fixed': token('on-primary-fixed'),
        'on-primary-fixed-variant': token('on-primary-fixed-variant'),
        'secondary-fixed': token('secondary-fixed'),
        'secondary-fixed-dim': token('secondary-fixed-dim'),
        'on-secondary-fixed': token('on-secondary-fixed'),
        'on-secondary-fixed-variant': token('on-secondary-fixed-variant'),
        'tertiary-fixed': token('tertiary-fixed'),
        'tertiary-fixed-dim': token('tertiary-fixed-dim'),
        'on-tertiary-fixed': token('on-tertiary-fixed'),
        'on-tertiary-fixed-variant': token('on-tertiary-fixed-variant'),
        background: token('background'),
        'on-background': token('on-background'),
        'surface-variant': token('surface-variant'),
        // Warna status kelas (K1/K2/HB/GBK) — bukan bagian palet M3,
        // tetap statis di kedua mode (lihat ClassCard untuk penyesuaian teks).
        'navy-slate': '#0f172a',
        'status-offline': '#10b981',
        'status-online': '#3b82f6',
        'status-hybrid': '#8b5cf6',
        'status-combined': '#f59e0b',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        schedule: '1rem',
      },
      spacing: {
        xs: '4px',
        base: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        'sidebar-width': '280px',
        'container-max': '1280px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'title-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        display: ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      boxShadow: {
        'level-1':
          '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.08)',
        'level-2': '0 12px 32px rgb(0 0 0 / 0.08)',
        'level-3': '0 8px 24px rgb(0 0 0 / 0.14)',
      },
    },
  },
  plugins: [],
}
