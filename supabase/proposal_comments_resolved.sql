-- Resolver threads da proposta. Rodar no SQL Editor do Supabase DEPOIS de
-- proposal_comments.sql.
--
-- Só thread-raiz resolve: a resposta pertence à thread e segue o estado dela.
-- Por isso não há constraint amarrando resolved_at a parent_id — a API é quem
-- restringe o UPDATE a linhas com parent_id is null.

alter table public.proposal_comments
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by text
    check (resolved_by is null or resolved_by in ('owner', 'client'));

-- Listar o que está em aberto é a consulta quente do painel.
create index if not exists proposal_comments_open_idx
  on public.proposal_comments (proposal_slug, resolved_at)
  where parent_id is null;
