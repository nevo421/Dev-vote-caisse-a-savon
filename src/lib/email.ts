const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Enlève les espaces superflus et met en minuscules pour normaliser la saisie. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidEmail(raw: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(raw))
}
