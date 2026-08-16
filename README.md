# Vote - Caisses à Savon

App de vote mobile (React + Vite + TS + Supabase) : scan QR code → email → vote pour une caisse à savon.

## 1. Créer le projet Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Ouvrir **SQL Editor** et exécuter le contenu de [`supabase/schema.sql`](supabase/schema.sql).
   - Ce script crée les tables `caisses` / `votes`, active la RLS, et crée 3 fonctions RPC (`has_voted`, `cast_vote`, `get_vote_counts`) qui sont les seules à pouvoir toucher aux votes — la table `votes` n'est jamais lue/écrite directement depuis le client, ce qui évite d'exposer les emails et garantit l'unicité du vote même avec beaucoup de monde en même temps.
   - Si tu avais déjà exécuté une version précédente du script (avec une colonne `phone_number`), supprime les tables (`drop table votes, caisses cascade;`) avant de relancer `schema.sql`, ou renomme/migre la colonne manuellement.
3. Remplacer les 3 lignes `insert into caisses (...)` en bas du script par la vraie liste des caisses (nom, description, éventuellement `image_url`).
4. Récupérer `Project URL` et `anon public key` dans **Project Settings > API**.

## 2. Configurer le projet local

```bash
cp .env.example .env
```

Renseigner dans `.env` :

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

```bash
npm install
npm run dev
```

## 3. Pages

- `/` — Accueil avec QR code (pointe vers `/auth`)
- `/auth` — Saisie de l'adresse email
- `/vote` — Choix de la caisse (accessible uniquement après `/auth`)
- `/confirmation` — Message de remerciement
- `/dashboard` — Résultats en direct (optionnel, chargé en lazy-loading)

## 4. Déploiement (Vercel ou Netlify, gratuit)

1. Pousser le projet sur GitHub.
2. Importer le repo sur Vercel/Netlify.
3. Renseigner les mêmes variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dans les settings du projet.
4. Build command : `npm run build` — Output dir : `dist`.
5. Générer le QR code final à partir de l'URL publique (la page d'accueil affiche déjà un QR code dynamique basé sur `window.location.origin`, donc rien à faire de spécial une fois déployé).

## Notes

- Validation email : format standard `xxx@xxx.xxx` (`src/lib/email.ts`), normalisé en minuscules.
- L'email n'est jamais stocké côté client au-delà de la session en cours (`sessionStorage`, effacé après confirmation).
- Le dashboard n'expose que des compteurs agrégés (RPC `get_vote_counts`), jamais les emails.
