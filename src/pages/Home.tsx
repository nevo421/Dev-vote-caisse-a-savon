import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

export default function Home() {
  const navigate = useNavigate()
  const voteUrl = `${window.location.origin}/auth`

  return (
    <div className="page">
      <h1>🏁 Vote - Caisses à Savon</h1>
      <p className="subtitle">Scanne le QR code ou clique pour voter pour ta caisse préférée</p>

      <div className="qr-wrap">
        <QRCodeSVG value={voteUrl} size={220} />
      </div>

      <button className="btn" onClick={() => navigate('/auth')} style={{ maxWidth: 420 }}>
        Commencer à voter
      </button>
    </div>
  )
}
