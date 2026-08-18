import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { normalizeEmail } from '../lib/email'
import AdminAddCaisse from '../components/AdminAddCaisse'
import AdminResults from '../components/AdminResults'
import AdminCaissesList from '../components/AdminCaissesList'

type Status = 'loading' | 'anon' | 'denied' | 'admin'

export default function Admin() {
  const [status, setStatus] = useState<Status>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'add' | 'caisses' | 'results'>('add')

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
    if (!normalized || !password) {
      setError('Email et mot de passe obligatoires.')
      return
    }

    setSubmitting(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })
    setSubmitting(false)

    if (authError) {
      setError('Identifiants incorrects.')
      return
    }

    checkAccess()
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
        <p className="subtitle">Connexion par mot de passe (aucun email envoyé)</p>

        <form className="card" onSubmit={handleSubmit}>
          <input
            type="email"
            inputMode="email"
            placeholder="admin@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            style={{ marginBottom: 12 }}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Se connecter'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Espace admin</h1>

      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420, flexWrap: 'wrap' }}>
        <button
          className={tab === 'add' ? 'btn' : 'btn btn-secondary'}
          style={{ width: 'auto', flex: '1 1 auto', padding: '10px 14px', fontSize: '0.85rem' }}
          onClick={() => setTab('add')}
        >
          Ajouter
        </button>
        <button
          className={tab === 'caisses' ? 'btn' : 'btn btn-secondary'}
          style={{ width: 'auto', flex: '1 1 auto', padding: '10px 14px', fontSize: '0.85rem' }}
          onClick={() => setTab('caisses')}
        >
          Caisses
        </button>
        <button
          className={tab === 'results' ? 'btn' : 'btn btn-secondary'}
          style={{ width: 'auto', flex: '1 1 auto', padding: '10px 14px', fontSize: '0.85rem' }}
          onClick={() => setTab('results')}
        >
          Résultats
        </button>
      </div>

      {tab === 'add' && <AdminAddCaisse />}
      {tab === 'caisses' && <AdminCaissesList />}
      {tab === 'results' && <AdminResults />}

      <button className="btn btn-secondary" style={{ maxWidth: 420, marginTop: 8 }} onClick={handleSignOut}>
        Se déconnecter
      </button>
    </div>
  )
}
