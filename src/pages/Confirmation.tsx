import { useLocation, useNavigate } from 'react-router-dom'

export default function Confirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const caisseNom = (location.state as { caisseNom?: string } | null)?.caisseNom

  function handleReturn() {
    navigate('/', { replace: true })
  }

  return (
    <div className="page">
      <div className="stamp">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--yellow-ink)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1>Merci pour ton vote !</h1>
      {caisseNom && <p className="subtitle">Tu as voté pour la caisse <strong>N° {caisseNom}</strong></p>}

      <button className="btn btn-secondary" onClick={handleReturn} style={{ maxWidth: 420 }}>
        Retour à l'accueil
      </button>
    </div>
  )
}
