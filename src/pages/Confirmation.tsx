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
      <div className="success-icon">✅</div>
      <h1>Merci pour ton vote !</h1>
      {caisseNom && <p className="subtitle">Tu as voté pour : <strong>{caisseNom}</strong></p>}

      <button className="btn btn-secondary" onClick={handleReturn} style={{ maxWidth: 420 }}>
        Retour à l'accueil
      </button>
    </div>
  )
}
