-- Comentários ancorados das propostas (/proposta-*).
-- Rodar no SQL Editor do Supabase.
--
-- A API (/api/comments) usa a service role key, então ela ignora RLS.
-- RLS fica ligada e sem policies: nenhum acesso direto pelo anon key.

create extension if not exists "pgcrypto";

create table if not exists public.proposal_comments (
  id            uuid primary key default gen_random_uuid(),
  proposal_slug text        not null,
  parent_id     uuid        references public.proposal_comments(id) on delete cascade,
  anchor_id     text,
  rel_x         real,
  rel_y         real,
  author_name   text        not null,
  author_role   text        not null default 'client' check (author_role in ('owner', 'client')),
  body          text        not null check (char_length(body) between 1 and 2000),
  created_at    timestamptz not null default now(),

  -- Thread-raiz precisa de âncora; resposta herda a posição do pai.
  constraint anchor_only_on_root check (
    (parent_id is null  and anchor_id is not null) or
    (parent_id is not null and anchor_id is null)
  )
);

create index if not exists proposal_comments_slug_created_idx
  on public.proposal_comments (proposal_slug, created_at);

create index if not exists proposal_comments_parent_idx
  on public.proposal_comments (parent_id);

alter table public.proposal_comments enable row level security;
