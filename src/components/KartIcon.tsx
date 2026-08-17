const ACCENTS = [
  { tint: 'var(--red-tint)', fg: 'var(--red)' },
  { tint: 'var(--blue-tint)', fg: 'var(--blue)' },
  { tint: 'var(--green-tint)', fg: 'var(--green)' },
]

export function accentForIndex(index: number) {
  return ACCENTS[index % ACCENTS.length]
}

export function KartIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 60" aria-hidden="true">
      <rect x="18" y="30" width="64" height="16" rx="6" fill={color} />
      <path d="M30 30 L40 16 L70 16 L78 30 Z" fill={color} />
      <circle cx="32" cy="48" r="9" fill="var(--ink)" />
      <circle cx="32" cy="48" r="3.5" fill="#fff" />
      <circle cx="68" cy="48" r="9" fill="var(--ink)" />
      <circle cx="68" cy="48" r="3.5" fill="#fff" />
    </svg>
  )
}
