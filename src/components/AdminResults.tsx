import { useEffect, useState } from 'react'
import { supabase, VoteCount } from '../lib/supabase'

function exportCsv(counts: VoteCount[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const header = 'Numéro,Pilotes,Votes\n'
  const rows = counts
    .map((c) => `${escape(c.nom)},${escape(c.pilotes ?? '')},${c.votes}`)
    .join('\n')

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resultats-vote-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminResults() {
  const [counts, setCounts] = useState<VoteCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('get_vote_counts')
    if (rpcError || !data) {
      setError(true)
    } else {
      setCounts(data as VoteCount[])
      setError(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const total = counts.reduce((sum, c) => sum + Number(c.votes), 0)

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p className="subtitle" style={{ margin: 0 }}>
          {total} vote{total !== 1 ? 's' : ''}
        </p>
        <button
          className="btn"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={load}
        >
          Rafraîchir
        </button>
      </div>

      {loading ? (
        <span className="spinner" />
      ) : error ? (
        <div className="error">Impossible de charger les résultats.</div>
      ) : (
        <>
          <div className="results-list">
            {counts.map((c, i) => (
              <div className="results-row" key={c.caisse_id} style={{ alignItems: 'flex-start' }}>
                <div>
                  <div>
                    {i === 0 && c.votes > 0 ? '🥇 ' : ''}
                    <strong>N° {c.nom}</strong>
                  </div>
                  {c.pilotes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{c.pilotes}</div>
                  )}
                </div>
                <strong>{c.votes}</strong>
              </div>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() => exportCsv(counts)}
            disabled={counts.length === 0}
          >
            Exporter en CSV
          </button>
        </>
      )}
    </div>
  )
}
