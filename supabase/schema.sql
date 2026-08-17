-- =========================================================
-- Schéma Supabase : Vote - Caisses à Savon
-- À exécuter dans Supabase > SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Table caisses (pré-remplie, puis complétée par l'admin le jour J)
-- ---------------------------------------------------------
create table if not exists caisses (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  pilotes text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table caisses add column if not exists pilotes text;

-- ---------------------------------------------------------
-- Table votes
-- ---------------------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  caisse_id uuid not null references caisses(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Si la table existait déjà avec l'ancienne contrainte (on delete restrict),
-- la remplacer pour autoriser la suppression en cascade des votes.
alter table votes drop constraint if exists votes_caisse_id_fkey;
alter table votes add constraint votes_caisse_id_fkey
  foreign key (caisse_id) references caisses(id) on delete cascade;

create index if not exists votes_caisse_id_idx on votes (caisse_id);

-- ---------------------------------------------------------
-- Table admins : emails autorisés à accéder à /admin
-- ---------------------------------------------------------
create table if not exists admins (
  email text primary key
);

insert into admins (email) values
  ('emilienbouillet@gmail.com')
on conflict (email) do nothing;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table caisses enable row level security;
alter table votes enable row level security;
alter table admins enable row level security;

-- Lecture publique des caisses (nom, description, pilotes, image) uniquement.
drop policy if exists "public read caisses" on caisses;
create policy "public read caisses" on caisses
  for select using (true);

-- Aucune policy sur `votes` ni `admins` : jamais accessibles directement
-- depuis le client (clé anon), tout passe par les fonctions RPC
-- ci-dessous (SECURITY DEFINER).

-- ---------------------------------------------------------
-- RPC : l'utilisateur authentifié est-il admin ?
-- ---------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admins where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

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
-- RPC : ajouter une caisse (admin uniquement)
-- ---------------------------------------------------------
create or replace function admin_add_caisse(p_nom text, p_pilotes text, p_image_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  insert into caisses (nom, pilotes, image_url) values (p_nom, nullif(p_pilotes, ''), p_image_url);
end;
$$;

-- ---------------------------------------------------------
-- RPC : supprimer une caisse (admin uniquement). Supprime aussi
-- ses votes (cascade) : les votants concernés pourront revoter.
-- ---------------------------------------------------------
create or replace function admin_delete_caisse(p_caisse_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  delete from caisses where id = p_caisse_id;
end;
$$;

-- ---------------------------------------------------------
-- RPC : résultats agrégés (aucun email exposé)
-- ---------------------------------------------------------
drop function if exists get_vote_counts();
create or replace function get_vote_counts()
returns table (caisse_id uuid, nom text, pilotes text, votes bigint)
language sql
security definer
set search_path = public
as $$
  select c.id as caisse_id, c.nom, c.pilotes, count(v.id) as votes
  from caisses c
  left join votes v on v.caisse_id = c.id
  group by c.id, c.nom, c.pilotes
  order by votes desc, c.nom asc;
$$;

grant execute on function is_admin() to authenticated;
grant execute on function has_voted(text) to anon, authenticated;
grant execute on function cast_vote(uuid) to authenticated;
grant execute on function admin_add_caisse(text, text, text) to authenticated;
grant execute on function admin_delete_caisse(uuid) to authenticated;
grant execute on function get_vote_counts() to anon, authenticated;

-- ---------------------------------------------------------
-- Stockage : bucket public pour les photos de caisses,
-- upload réservé aux admins
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('caisse-photos', 'caisse-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read caisse photos" on storage.objects;
create policy "public read caisse photos" on storage.objects
  for select using (bucket_id = 'caisse-photos');

drop policy if exists "admin upload caisse photos" on storage.objects;
create policy "admin upload caisse photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'caisse-photos' and is_admin());

-- ---------------------------------------------------------
-- Données d'exemple (à remplacer par la vraie liste des caisses,
-- ou à ajouter le jour J depuis /admin)
-- ---------------------------------------------------------
insert into caisses (nom, description) values
  ('Caisse A', 'Description de la caisse A'),
  ('Caisse B', 'Description de la caisse B'),
  ('Caisse C', 'Description de la caisse C')
on conflict (nom) do nothing;
