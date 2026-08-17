# Vote - Caisses à Savon

App de vote mobile (React + Vite + TS + Supabase) : scan QR code → email → vote pour une caisse à savon.

## 1. Créer le projet Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Ouvrir **SQL Editor** et exécuter le contenu de [`supabase/schema.sql`](supabase/schema.sql).
   - Ce script crée les tables `caisses` / `votes`, active la RLS, et crée 3 fonctions RPC (`has_voted`, `cast_vote`, `get_vote_counts`) qui sont les seules à pouvoir toucher aux votes — la table `votes` n'est jamais lue/écrite directement depuis le client, ce qui évite d'exposer les emails et garantit l'unicité du vote même avec beaucoup de monde en même temps.
   - Si tu avais déjà exécuté une version précédente du script, supprime les tables (`drop table votes, caisses cascade;`) avant de relancer `schema.sql`.
3. Remplacer les 3 lignes `insert into caisses (...)` en bas du script par la vraie liste des caisses (nom, description, éventuellement `image_url`).
4. Récupérer `Project URL` et `anon public key` dans **Project Settings > API**.

## 1bis. Configurer l'envoi d'email (obligatoire pour le lien magique)

L'app envoie un email avec un lien de confirmation via **Supabase Auth** (`signInWithOtp`). Le service d'email intégré par défaut à Supabase est limité à quelques emails/heure — largement insuffisant pour un événement avec plusieurs centaines de votants. Il faut configurer un vrai fournisseur SMTP :

1. Crée un compte sur [resend.com](https://resend.com) (gratuit jusqu'à 3000 emails/mois) ou un autre fournisseur SMTP (SendGrid, Mailgun...).
2. Récupère les identifiants SMTP.
3. Dans Supabase : **Authentication > Settings** (ou **Project Settings > Auth**) > section **SMTP Settings** > active "Enable Custom SMTP" et renseigne les identifiants.
4. Toujours dans **Authentication > URL Configuration** :
   - **Site URL** : l'URL de production (ex: `https://dev-vote-caisse-a-savon-mzs6.vercel.app`)
   - **Redirect URLs** : ajoute `https://TON-URL/vote` (et `http://localhost:5173/vote` pour tester en local)

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
- `/auth` — Saisie de l'adresse email, envoie un lien magique
- `/vote` — Choix de la caisse (accessible uniquement en cliquant le lien reçu par email)
- `/confirmation` — Message de remerciement
- `/dashboard` — Résultats en direct, public (chargé en lazy-loading)
- `/admin` — Réservé aux emails listés dans la table `admins` (même mécanisme de lien magique). Permet d'ajouter des caisses (nom, pilotes, photo) le jour J, et de consulter/exporter les résultats en CSV.

### Ajouter un administrateur

```sql
insert into admins (email) values ('email@exemple.fr');
```

## 4. Déploiement (Vercel ou Netlify, gratuit)

1. Pousser le projet sur GitHub.
2. Importer le repo sur Vercel/Netlify.
3. Renseigner les mêmes variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dans les settings du projet.
4. Build command : `npm run build` — Output dir : `dist`.
5. Générer le QR code final à partir de l'URL publique (la page d'accueil affiche déjà un QR code dynamique basé sur `window.location.origin`, donc rien à faire de spécial une fois déployé).

## Notes

- Validation email : format standard `xxx@xxx.xxx` (`src/lib/email.ts`), normalisé en minuscules.
- Le vote est lié à l'email confirmé par le lien magique (session Supabase Auth), impossible de voter avec un email qu'on ne possède pas. La session est fermée automatiquement juste après le vote.
- Le dashboard n'expose que des compteurs agrégés (RPC `get_vote_counts`), jamais les emails.
