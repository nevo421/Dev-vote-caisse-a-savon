-- =========================================================
-- Schéma Supabase : Vote - Caisses à Savon
-- À exécuter dans Supabase > SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Table caisses (pré-remplie)
-- ---------------------------------------------------------
create table if not exists caisses (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table votes
-- ---------------------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  caisse_id uuid not null references caisses(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists votes_caisse_id_idx on votes (caisse_id);

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table caisses enable row level security;
alter table votes enable row level security;

-- Lecture publique des caisses (nom, description, image) uniquement.
create policy "public read caisses" on caisses
  for select using (true);

-- Aucune policy sur `votes` : la table n'est accessible ni en lecture
-- ni en écriture directe depuis le client (clé anon). Tout passe par
-- les fonctions RPC ci-dessous (SECURITY DEFINER), ce qui évite
-- d'exposer les emails via l'API REST et gère l'unicité du vote de
-- façon atomique (important avec ~500 votants simultanés).

-- ---------------------------------------------------------
-- RPC : un email a-t-il déjà voté ? (accessible sans authentification,
-- juste pour éviter d'envoyer un magic link à quelqu'un qui a déjà voté)
-- ---------------------------------------------------------
create or replace function has_voted(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from votes where email = lower(p_email));
$$;

-- ---------------------------------------------------------
-- RPC : enregistrer un vote pour l'utilisateur AUTHENTIFIÉ (magic link)
-- L'email vient du JWT vérifié par Supabase Auth, jamais d'un
-- paramètre fourni par le client : impossible de voter au nom d'un
-- email qu'on ne possède pas.
-- ---------------------------------------------------------
create or replace function cast_vote(p_caisse_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if v_email is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into votes (email, caisse_id) values (v_email, p_caisse_id);
exception
  when unique_violation then
    raise exception 'ALREADY_VOTED';
end;
$$;

-- ---------------------------------------------------------
-- RPC : résultats agrégés (aucune donnée personnelle exposée)
-- ---------------------------------------------------------
create or replace function get_vote_counts()
returns table (caisse_id uuid, nom text, votes bigint)
language sql
security definer
set search_path = public
as $$
  select c.id as caisse_id, c.nom, count(v.id) as votes
  from caisses c
  left join votes v on v.caisse_id = c.id
  group by c.id, c.nom
  order by votes desc, c.nom asc;
$$;

grant execute on function has_voted(text) to anon, authenticated;
grant execute on function cast_vote(uuid) to authenticated;
grant execute on function get_vote_counts() to anon, authenticated;

-- ---------------------------------------------------------
-- Données d'exemple (à remplacer par la vraie liste des caisses)
-- ---------------------------------------------------------
insert into caisses (nom, description) values
  ('Caisse A', 'Description de la caisse A'),
  ('Caisse B', 'Description de la caisse B'),
  ('Caisse C', 'Description de la caisse C')
on conflict (nom) do nothing;
