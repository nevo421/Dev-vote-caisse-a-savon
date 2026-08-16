const EMAIL_KEY = 'vote:email'

export function getSessionEmail(): string | null {
  return sessionStorage.getItem(EMAIL_KEY)
}

export function setSessionEmail(email: string): void {
  sessionStorage.setItem(EMAIL_KEY, email)
}

export function clearSession(): void {
  sessionStorage.removeItem(EMAIL_KEY)
}
