import { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { isValidEmail, normalizeEmail } from '../lib/email'

export default function EmailAuth() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const normalized = normalizeEmail(email)

    if (!isValidEmail(normalized)) {
      setError('Adresse email invalide.')
      return
    }

    setLoading(true)
    try {
      const { data: alreadyVoted, error: checkError } = await supabase.rpc('has_voted', {
        p_email: normalized,
      })

      if (checkError) throw checkError

      if (alreadyVoted === true) {
        setError('Tu as déjà voté !')
        return
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: `${window.location.origin}/vote`,
        },
      })

      if (otpError) throw otpError

      setSent(true)
    } catch {
      setError("Une erreur est survenue, réessaie dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="page">
        <div className="success-icon">📩</div>
        <h1>Vérifie ta boîte mail</h1>
        <p className="subtitle">
          On t'a envoyé un lien à <strong>{normalizeEmail(email)}</strong>. Clique dessus pour accéder au vote.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Ton adresse email</h1>
      <p className="subtitle">On t'envoie un lien pour confirmer que c'est bien la tienne, et s'assurer d'un seul vote par personne</p>

      <form className="card" onSubmit={handleSubmit}>
        <input
          type="email"
          inputMode="email"
          placeholder="prenom.nom@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />

        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Recevoir le lien'}
        </button>
      </form>
    </div>
  )
}
