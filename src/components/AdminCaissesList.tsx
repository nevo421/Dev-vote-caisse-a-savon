import { useEffect, useState } from 'react'
import { supabase, Caisse } from '../lib/supabase'

export default function AdminCaissesList() {
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('caisses')
      .select('id, nom, description, pilotes, image_url')
      .order('nom', { ascending: true })

    if (fetchError) {
      setError('Impossible de charger les caisses.')
    } else {
      setCaisses(data ?? [])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(caisse: Caisse) {
    if (confirmingId !== caisse.id) {
      setConfirmingId(caisse.id)
      return
    }

    setError(null)
    setDeletingId(caisse.id)
    setConfirmingId(null)

    const { error: rpcError } = await supabase.rpc('admin_delete_caisse', {
      p_caisse_id: caisse.id,
    })

    setDeletingId(null)

    if (rpcError) {
      setError('La suppression a échoué, réessaie.')
      return
    }

    setCaisses((prev) => prev.filter((c) => c.id !== caisse.id))
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          className="btn"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={load}
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 0, marginBottom: 12 }}>
        Supprimer une caisse supprime aussi définitivement ses votes.
      </p>

      {loading ? (
        <span className="spinner" />
      ) : caisses.length === 0 ? (
        <p className="subtitle">Aucune caisse pour l'instant.</p>
      ) : (
        <div className="results-list">
          {caisses.map((caisse) => (
            <div className="results-row" key={caisse.id} style={{ alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <strong>N° {caisse.nom}</strong>
                {caisse.pilotes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{caisse.pilotes}</div>
                )}
              </div>
              <button
                className="btn"
                style={{
                  width: 'auto',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  background: confirmingId === caisse.id ? 'var(--red-dark)' : 'var(--red)',
                }}
                disabled={deletingId !== null}
                onClick={() => handleDelete(caisse)}
              >
                {deletingId === caisse.id
                  ? <span className="spinner" />
                  : confirmingId === caisse.id
                    ? 'Confirmer ?'
                    : 'Supprimer'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
