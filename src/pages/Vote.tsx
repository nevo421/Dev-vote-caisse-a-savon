import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Caisse, byNumero } from '../lib/supabase'
import { KartIcon, accentForIndex } from '../components/KartIcon'

export default function Vote() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  useEffect(() => {
    if (email === undefined) return

    if (!email) {
      navigate('/auth', { replace: true })
      return
    }

    supabase
      .from('caisses')
      .select('id, nom, description, pilotes, image_url')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Impossible de charger les caisses. Recharge la page.')
        } else {
          setCaisses((data ?? []).slice().sort(byNumero))
        }
        setLoading(false)
      })
  }, [email, navigate])

  async function handleVote(caisse: Caisse) {
    if (!email || votingId) return
    setError(null)
    setVotingId(caisse.id)

    const { error: rpcError } = await supabase.rpc('cast_vote', {
      p_caisse_id: caisse.id,
    })

    if (rpcError) {
      setVotingId(null)
      if (rpcError.message.includes('ALREADY_VOTED')) {
        setError('Tu as déjà voté !')
      } else {
        setError("Le vote n'a pas pu être enregistré, réessaie.")
      }
      return
    }

    await supabase.auth.signOut()
    navigate('/confirmation', { state: { caisseNom: caisse.nom } })
  }

  if (loading) {
    return (
      <div className="page">
        <span className="spinner" />
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Choisis ta caisse préférée</h1>
      {error && <div className="error">{error}</div>}

      <div className="caisses-grid">
        {caisses.map((caisse, index) => {
          const accent = accentForIndex(index)
          return (
            <div className="caisse-card" key={caisse.id}>
              <div className="caisse-img" style={{ background: accent.tint }}>
                {caisse.image_url ? (
                  <img src={caisse.image_url} alt={`Caisse n°${caisse.nom}`} />
                ) : (
                  <KartIcon color={accent.fg} />
                )}
              </div>
              <div className="caisse-body">
                <h3>N° {caisse.nom}</h3>
                {caisse.pilotes && (
                  <p style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>
                    🏎️ {caisse.pilotes}
                  </p>
                )}
                {caisse.description && <p>{caisse.description}</p>}
                <button
                  className="btn"
                  disabled={votingId !== null}
                  onClick={() => handleVote(caisse)}
                >
                  {votingId === caisse.id ? <span className="spinner" /> : 'Voter'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
