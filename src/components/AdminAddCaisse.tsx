import { useRef, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminAddCaisse() {
  const [nom, setNom] = useState('')
  const [pilotes, setPilotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!nom.trim()) {
      setError('Le nom de la caisse est obligatoire.')
      return
    }

    setLoading(true)
    try {
      let imageUrl: string | null = null

      if (file) {
        const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const { error: uploadError } = await supabase.storage
          .from('caisse-photos')
          .upload(path, file)

        if (uploadError) throw uploadError

        imageUrl = supabase.storage.from('caisse-photos').getPublicUrl(path).data.publicUrl
      }

      const { error: rpcError } = await supabase.rpc('admin_add_caisse', {
        p_nom: nom.trim(),
        p_pilotes: pilotes.trim(),
        p_image_url: imageUrl,
      })

      if (rpcError) {
        if (rpcError.message.includes('duplicate') || rpcError.code === '23505') {
          setError('Une caisse avec ce nom existe déjà.')
        } else {
          setError("La caisse n'a pas pu être ajoutée, réessaie.")
        }
        return
      }

      setNom('')
      setPilotes('')
      setFile(null)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      setSuccess(true)
    } catch {
      setError("La caisse n'a pas pu être ajoutée, réessaie.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
        Nom de la caisse
      </label>
      <input
        type="text"
        placeholder="Les Furieux"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        style={{ textAlign: 'left' }}
      />

      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
        Prénoms des pilotes
      </label>
      <input
        type="text"
        placeholder="Léa, Tom"
        value={pilotes}
        onChange={(e) => setPilotes(e.target.value)}
        style={{ textAlign: 'left' }}
      />

      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
        Photo (optionnel)
      </label>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          onClick={() => cameraInputRef.current?.click()}
        >
          📷 Prendre une photo
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          onClick={() => galleryInputRef.current?.click()}
        >
          🖼️ Choisir une photo
        </button>
      </div>

      {file && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: -6, marginBottom: 12 }}>
          {file.name}
        </p>
      )}

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      {success && (
        <div className="error" style={{ marginBottom: 12, background: 'var(--green-tint)', color: 'var(--green)', boxShadow: '0 0 0 1px #bfe0cc' }}>
          Caisse ajoutée !
        </div>
      )}

      <button className="btn" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Ajouter la caisse'}
      </button>
    </form>
  )
}
