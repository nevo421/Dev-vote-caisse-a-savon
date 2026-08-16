import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isValidEmail, normalizeEmail } from '../lib/email'
import { setSessionEmail } from '../lib/session'

export default function EmailAuth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      const { data, error: rpcError } = await supabase.rpc('has_voted', {
        p_email: normalized,
      })

      if (rpcError) throw rpcError

      if (data === true) {
        setError('Tu as déjà voté !')
        return
      }

      setSessionEmail(normalized)
      navigate('/vote')
    } catch {
      setError("Une erreur est survenue, réessaie dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Ton adresse email</h1>
      <p className="subtitle">Elle sert uniquement à s'assurer d'un seul vote par personne</p>

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
          {loading ? <span className="spinner" /> : 'Continuer'}
        </button>
      </form>
    </div>
  )
}
