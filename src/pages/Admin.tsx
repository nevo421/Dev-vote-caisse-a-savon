import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { isValidEmail, normalizeEmail } from '../lib/email'
import AdminAddCaisse from '../components/AdminAddCaisse'
import AdminResults from '../components/AdminResults'

type Status = 'loading' | 'anon' | 'sent' | 'denied' | 'admin'

export default function Admin() {
  const [status, setStatus] = useState<Status>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'add' | 'results'>('add')

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    const { data } = await supabase.auth.getUser()
    if (!data.user?.email) {
      setStatus('anon')
      return
    }
    const { data: admin } = await supabase.rpc('is_admin')
    setStatus(admin === true ? 'admin' : 'denied')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const normalized = normalizeEmail(email)
    if (!isValidEmail(normalized)) {
      setError('Adresse email invalide.')
      return
    }

    setSubmitting(true)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    setSubmitting(false)

    if (otpError) {
      setError('Une erreur est survenue, réessaie dans un instant.')
      return
    }
    setStatus('sent')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStatus('anon')
  }

  if (status === 'loading') {
    return (
      <div className="page">
        <span className="spinner" />
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="page">
        <div className="success-icon">📩</div>
        <h1>Vérifie ta boîte mail</h1>
        <p className="subtitle">
          On t'a envoyé un lien à <strong>{normalizeEmail(email)}</strong> pour accéder à l'admin.
        </p>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="page">
        <h1>Accès refusé</h1>
        <p className="subtitle">Ce compte n'a pas les droits admin.</p>
        <button className="btn btn-secondary" style={{ maxWidth: 420 }} onClick={handleSignOut}>
          Se déconnecter
        </button>
      </div>
    )
  }

  if (status === 'anon') {
    return (
      <div className="page">
        <h1>Espace admin</h1>
        <p className="subtitle">Connecte-toi avec ton adresse email autorisée</p>

        <form className="card" onSubmit={handleSubmit}>
          <input
            type="email"
            inputMode="email"
            placeholder="admin@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />

          {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Recevoir le lien'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Espace admin</h1>

      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420 }}>
        <button
          className={tab === 'add' ? 'btn' : 'btn btn-secondary'}
          onClick={() => setTab('add')}
        >
          Ajouter une caisse
        </button>
        <button
          className={tab === 'results' ? 'btn' : 'btn btn-secondary'}
          onClick={() => setTab('results')}
        >
          Résultats
        </button>
      </div>

      {tab === 'add' ? <AdminAddCaisse /> : <AdminResults />}

      <button className="btn btn-secondary" style={{ maxWidth: 420, marginTop: 8 }} onClick={handleSignOut}>
        Se déconnecter
      </button>
    </div>
  )
}
