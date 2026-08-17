import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { supabase, VoteCount } from '../lib/supabase'

const REFRESH_MS = 5000

export default function Dashboard() {
  const [counts, setCounts] = useState<VoteCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: rpcError } = await supabase.rpc('get_vote_counts')
      if (cancelled) return
      if (rpcError || !data) {
        setError(true)
      } else {
        setCounts(data as VoteCount[])
        setError(false)
      }
      setLoading(false)
    }

    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const total = counts.reduce((sum, c) => sum + Number(c.votes), 0)

  return (
    <div className="page">
      <h1>🏆 Résultats en direct</h1>
      <p className="subtitle">{total} vote{total !== 1 ? 's' : ''} enregistré{total !== 1 ? 's' : ''}</p>

      {loading ? (
        <span className="spinner" />
      ) : error ? (
        <div className="error">Impossible de charger les résultats. Recharge la page.</div>
      ) : (
        <>
          <div style={{ width: '100%', maxWidth: 600, height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={counts} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2e7ce" />
                <XAxis dataKey="nom" tick={{ fontSize: 12, fill: '#6b6f8a' }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6b6f8a' }} />
                <Tooltip />
                <Bar dataKey="votes" fill="#e8472b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="results-list">
            {counts.map((c, i) => (
              <div className="results-row" key={c.caisse_id}>
                <span>
                  {i === 0 && c.votes > 0 ? '🥇 ' : ''}
                  {c.nom}
                </span>
                <strong>{c.votes}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
