/**
 * BrandWordmark — Standard JadwalKu Brand Wordmark
 *
 * Typography: Weight 700, Inter/Sans, letter-spacing -0.02em
 * Two-tone: "Jadwal" in on-surface text, "Ku" in primary teal (#00685F light / #6BD8CB dark)
 * Optional Tagline: "SCHEDULE SMARTER" — uppercase, 11px, weight 500, letter-spacing 0.08em
 */
export function BrandWordmark({
  size = 'md', // 'sm' | 'md' | 'lg'
  tagline = false,
  subtitle,
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-title-md',
    md: 'text-headline-lg-mobile desktop:text-headline-lg',
    lg: 'text-display',
  }

  return (
    <div className={`leading-tight ${className}`}>
      <h1 className={`font-bold font-sans tracking-[-0.02em] ${sizeClasses[size] || sizeClasses.md} truncate`}>
        <span className="text-on-surface">Jadwal</span>
        <span className="text-primary">Ku</span>
      </h1>
      {tagline && (
        <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-on-surface-variant/80 truncate mt-0.5">
          SCHEDULE SMARTER
        </p>
      )}
      {!tagline && subtitle && (
        <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-on-surface-variant/80 truncate mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  )
}

