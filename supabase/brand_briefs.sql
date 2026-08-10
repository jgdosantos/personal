-- Briefings de marca (/brief?c=<access_token>).
-- Rodar no SQL Editor do Supabase, projeto LUMEN.
--
-- A API (/api/brief) usa a service role key, então ela ignora RLS. RLS fica
-- ligada e sem policies: nenhum acesso direto pelo anon key, nem de leitura.
-- São ativos de marca de clientes — brandbook, fotos, manual — e um bucket ou
-- tabela aberta expõe o material de um cliente a quem adivinhar um id.

create extension if not exists "pgcrypto";

create table if not exists public.brand_briefs (
  id                uuid primary key default gen_random_uuid(),

  -- O link do cliente é /brief?c=<access_token>. 24 bytes viram 48 caracteres
  -- hex: não vale a pena tentar adivinhar, e ainda cabe numa mensagem.
  access_token      text        not null unique
                                default encode(gen_random_bytes(24), 'hex'),

  -- Rótulo interno, só o João vê. Ex.: 'Marcelo — Clínica Odonto'.
  client_label      text        not null,
  -- Vira o reply_to da notificação: responder o e-mail fala com o cliente.
  client_email      text,

  status            text        not null default 'draft'
                                check (status in ('draft', 'submitted')),

  brand_name        text        check (char_length(brand_name) <= 120),
  instagram         text        check (char_length(instagram) <= 80),
  description       text        check (char_length(description) <= 1200),
  design_system_url text        check (char_length(design_system_url) <= 500),
  notes             text        check (char_length(notes) <= 1200),

  -- Campos que o cliente optou por mandar pelo WhatsApp. Sem isto não dá para
  -- distinguir "campo ainda pendente" de "campo resolvido por fora", e o João
  -- ficaria cobrando material que já recebeu.
  whatsapp_fields   text[]      not null default '{}',

  submitted_at      timestamptz,
  -- Null depois de um envio significa que a linha não chegou na planilha:
  -- é o que permite reprocessar sem adivinhar.
  sheet_synced_at   timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.brief_files (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid        not null references public.brand_briefs(id) on delete cascade,

  -- design_system NÃO entra aqui: virou link (Figma, Drive, Notion), não arquivo.
  field         text        not null
                            check (field in ('fotos', 'brandbook', 'arquivos_md', 'arquivos')),

  -- Sempre montado no servidor, no formato {brief_id}/{field}/{uuid}-{nome}.
  -- É este caminho, preso ao token, que isola um cliente do outro — a URL
  -- assinada prende ONDE se escreve, não O QUE se escreve.
  storage_path  text        not null unique,

  -- Nome real, com acento e espaço. O caminho é higienizado; isto não, senão
  -- o João recebe 'manual_da_marca_versao_final.pdf' e perde a informação.
  original_name text        not null,

  content_type  text,
  size_bytes    bigint,

  -- pending: URL assinada emitida, upload ainda não confirmado.
  -- ready:   o cliente confirmou que o PUT terminou.
  status        text        not null default 'pending'
                            check (status in ('pending', 'ready')),

  created_at    timestamptz not null default now()
);

create index if not exists brief_files_brief_field_idx
  on public.brief_files (brief_id, field, created_at);

alter table public.brand_briefs enable row level security;
alter table public.brief_files  enable row level security;


-- ---------------------------------------------------------------------------
-- O dia a dia — é aqui que se procura na hora de usar.
-- ---------------------------------------------------------------------------
--
-- Criar o link de um cliente:
--
--   insert into public.brand_briefs (client_label, client_email)
--   values ('Marcelo — Clínica Odonto', 'marcelo@exemplo.com')
--   returning 'https://www.joaogsantos.com/brief?c=' || access_token as link;
--
-- Copiar a coluna `link` e mandar no WhatsApp do cliente.
--
--
-- Acompanhar todos os briefings:
--
--   select b.client_label, b.status, b.brand_name, b.submitted_at, b.sheet_synced_at,
--          count(f.id) filter (where f.status = 'ready') as arquivos,
--          'https://www.joaogsantos.com/brief?c=' || b.access_token as link_do_cliente
--   from public.brand_briefs b
--   left join public.brief_files f on f.brief_id = b.id
--   group by b.id
--   order by b.created_at desc;
