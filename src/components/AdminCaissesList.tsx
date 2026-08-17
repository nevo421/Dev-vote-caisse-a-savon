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
      if (rpcError.message.includes('HAS_VOTES')) {
        setError(`"${caisse.nom}" a déjà des votes, impossible de la supprimer.`)
      } else {
        setError('La suppression a échoué, réessaie.')
      }
      return
    }

    setCaisses((prev) => prev.filter((c) => c.id !== caisse.id))
  }

  if (loading) {
    return <span className="spinner" />
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      {caisses.length === 0 ? (
        <p className="subtitle">Aucune caisse pour l'instant.</p>
      ) : (
        <div className="results-list">
          {caisses.map((caisse) => (
            <div className="results-row" key={caisse.id} style={{ alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <strong>{caisse.nom}</strong>
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
