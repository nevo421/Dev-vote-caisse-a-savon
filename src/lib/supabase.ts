import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes. Copie .env.example vers .env et renseigne VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Caisse = {
  id: string
  nom: string
  description: string | null
  pilotes: string | null
  image_url: string | null
}

export type VoteCount = {
  caisse_id: string
  nom: string
  pilotes: string | null
  votes: number
}

/** `nom` est stocké en texte mais contient un numéro : tri numérique, pas alphabétique. */
export function byNumero<T extends { nom: string }>(a: T, b: T): number {
  return Number(a.nom) - Number(b.nom)
}
