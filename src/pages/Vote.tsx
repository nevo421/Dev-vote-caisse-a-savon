import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Caisse } from '../lib/supabase'
import { getSessionEmail } from '../lib/session'

export default function Vote() {
  const navigate = useNavigate()
  const [email] = useState(() => getSessionEmail())
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!email) {
      navigate('/auth', { replace: true })
      return
    }

    supabase
      .from('caisses')
      .select('id, nom, description, image_url')
      .order('nom', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Impossible de charger les caisses. Recharge la page.')
        } else {
          setCaisses(data ?? [])
        }
        setLoading(false)
      })
  }, [email, navigate])

  async function handleVote(caisse: Caisse) {
    if (!email || votingId) return
    setError(null)
    setVotingId(caisse.id)

    const { error: rpcError } = await supabase.rpc('cast_vote', {
      p_email: email,
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
        {caisses.map((caisse) => (
          <div className="caisse-card" key={caisse.id}>
            {caisse.image_url && <img src={caisse.image_url} alt={caisse.nom} />}
            <h3>{caisse.nom}</h3>
            {caisse.description && <p>{caisse.description}</p>}
            <button
              className="btn"
              disabled={votingId !== null}
              onClick={() => handleVote(caisse)}
            >
              {votingId === caisse.id ? <span className="spinner" /> : 'Voter'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
