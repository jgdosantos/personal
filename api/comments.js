// Vercel Serverless Function — comentários das propostas.
//
// GET  /api/comments?slug=marcelo   → lista as threads da proposta
// POST /api/comments                → cria comentário/resposta e notifica por e-mail
//
// Sem SDKs: fala PostgREST (Supabase) e Resend por fetch, para não adicionar
// dependências a um projeto que hoje é só Vite + React.

// Colar valor no painel da Vercel arrasta espaço e quebra de linha invisíveis
// junto — e um "\n" dentro de um header derruba o fetch com
// `Headers.append: invalid header value`. Toda variável entra higienizada.
const env = (name) => (process.env[name] || '').trim();

const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = env('RESEND_API_KEY');
const RESEND_FROM = env('RESEND_FROM');
const OWNER_EMAIL = env('OWNER_EMAIL');
const CLIENT_EMAIL = env('CLIENT_EMAIL');
const OWNER_TOKEN = env('OWNER_TOKEN');
const PROPOSAL_URL = env('PROPOSAL_URL');

const TABLE = 'proposal_comments';
const MAX_BODY = 2000;
const MAX_NAME = 60;

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

const BASE_COLUMNS = 'id,parent_id,anchor_id,rel_x,rel_y,author_name,author_role,body,created_at';
const RESOLVED_COLUMNS = 'resolved_at,resolved_by';

// Deploy e migração não acontecem no mesmo instante. Pedir uma coluna que ainda
// não existe faz o PostgREST devolver 400, e o painel inteiro morria em 500 até
// alguém rodar o SQL. Aqui a ausência é detectada e o select degrada para o
// conjunto antigo.
//
// A tentativa completa é refeita a cada requisição de propósito. A primeira
// versão memorizava a degradação numa variável de módulo — e como o Fluid
// Compute reaproveita a instância, ela seguia servindo o formato antigo mesmo
// depois da migração rodar, até a instância reciclar. O custo de não memorizar
// é uma requisição extra apenas na janela em que a coluna não existe.
const fetchComments = (slug, select) => {
  const query = new URLSearchParams({
    proposal_slug: `eq.${slug}`,
    select,
    order: 'created_at.asc',
  });
  return fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${query}`, { headers: restHeaders });
};

async function selectComments(slug) {
  let res = await fetchComments(slug, `${BASE_COLUMNS},${RESOLVED_COLUMNS}`);

  if (!res.ok) {
    const detail = await res.text();
    if (detail.includes('resolved_at') || detail.includes('resolved_by')) {
      console.warn('[comments] colunas de resolução ausentes — rode supabase/proposal_comments_resolved.sql');
      res = await fetchComments(slug, BASE_COLUMNS);
    } else {
      throw new Error(`Supabase select falhou: ${res.status} ${detail}`);
    }
  }

  if (!res.ok) throw new Error(`Supabase select falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

// O filtro carrega o slug e `parent_id is null` de propósito: assim um id de
// resposta — ou de outra proposta — não resolve nada, mesmo se alguém montar a
// requisição na mão.
async function setResolved({ slug, id, resolved, role }) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    proposal_slug: `eq.${slug}`,
    parent_id: 'is.null',
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${query}`, {
    method: 'PATCH',
    headers: { ...restHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? role : null,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (detail.includes('resolved_at') || detail.includes('resolved_by')) {
      const err = new Error('coluna de resolução ausente');
      err.needsMigration = true;
      throw err;
    }
    throw new Error(`Supabase patch falhou: ${res.status} ${detail}`);
  }
  const [updated] = await res.json();
  return updated || null;
}

async function insertComment(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { ...restHeaders, Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert falhou: ${res.status} ${await res.text()}`);
  const [created] = await res.json();
  return created;
}

async function notify({ comment, isReply, parentBody }) {
  // Quem escreveu não recebe o aviso — só o outro lado da conversa.
  const to = comment.author_role === 'owner' ? CLIENT_EMAIL : OWNER_EMAIL;
  // O RESEND_FROM é um remetente sem caixa postal, então responder o e-mail
  // cairia no vácuo. Apontamos o Reply-To para quem escreveu o comentário:
  // quem recebe o aviso responde direto para a outra pessoa.
  const replyTo = comment.author_role === 'owner' ? OWNER_EMAIL : CLIENT_EMAIL;
  if (!RESEND_API_KEY || !RESEND_FROM || !to) {
    console.warn('[comments] notificação ignorada: faltam RESEND_API_KEY, RESEND_FROM ou destinatário');
    return;
  }

  const link = PROPOSAL_URL || '';
  const heading = isReply ? 'Nova resposta na proposta' : 'Novo comentário na proposta';
  const subject = `${heading} — ${comment.author_name}`;

  // Documento completo com lang="pt-BR": sem isso o Gmail chuta o idioma errado
  // e oferece "traduzir do inglês" num texto que já está em português.
  //
  // O visual é deliberadamente sóbrio. A versão anterior tinha um botão grande
  // em pílula com caixa alta espaçada, e o Gmail classificou a mensagem como
  // Promoções — aba que ninguém acompanha. Notificação precisa parecer o que é:
  // texto, um link comum, nada de peça de campanha.
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;background:#ffffff;color:#1d1d1f;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
<p style="margin:0 0 20px">${escapeHtml(heading)} de <strong>${escapeHtml(comment.author_name)}</strong>:</p>
${parentBody ? `<blockquote style="margin:0 0 20px;padding:0 0 0 14px;border-left:2px solid #e5e7eb;color:#6e6e73">${escapeHtml(parentBody)}</blockquote>` : ''}
<p style="margin:0 0 24px;white-space:pre-wrap">${escapeHtml(comment.body)}</p>
${link ? `<p style="margin:0 0 24px"><a href="${escapeHtml(link)}" style="color:#0066cc">Abrir a proposta e responder</a></p>` : ''}
<p style="margin:0;color:#86868b;font-size:13px">Você pode responder este e-mail direto — a mensagem chega em quem comentou.</p>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      // Omitido quando o endereço do autor não está configurado — o Resend
      // recusa um reply_to vazio.
      ...(replyTo ? { reply_to: [replyTo] } : {}),
      subject,
      html,
      text: `${heading} de ${comment.author_name}:\n\n${comment.body}\n\n`
        + `${link ? `Abrir a proposta e responder: ${link}\n\n` : ''}`
        + 'Você pode responder este e-mail direto — a mensagem chega em quem comentou.',
    }),
  });

  if (!res.ok) {
    console.error('[comments] Resend falhou:', res.status, await res.text());
    return;
  }

  // Sucesso também precisa deixar rastro: sem isso, "nenhum log" significava
  // tanto "enviou" quanto "o log se perdeu", e não dava para saber qual.
  // O id é o mesmo que aparece no painel do Resend, então dá para seguir a
  // entrega de ponta a ponta.
  const { id } = await res.json().catch(() => ({}));
  console.log(`[comments] e-mail aceito pelo Resend id=${id} de=${RESEND_FROM} para=${to}`);
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase não configurado no ambiente.' });
  }

  try {
    if (req.method === 'GET') {
      const slug = String(req.query.slug || '').trim();
      if (!slug) return res.status(400).json({ error: 'slug obrigatório' });
      const comments = await selectComments(slug);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ comments });
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const slug = String(payload.slug || '').trim();
      const body = String(payload.body || '').trim();
      const parentId = payload.parentId || null;

      if (!slug) return res.status(400).json({ error: 'slug obrigatório' });
      if (!body) return res.status(400).json({ error: 'comentário vazio' });
      if (body.length > MAX_BODY) return res.status(400).json({ error: 'comentário muito longo' });

      const isOwner = Boolean(OWNER_TOKEN) && payload.ownerToken === OWNER_TOKEN;
      const authorName = isOwner
        ? 'João Gabriel'
        : String(payload.name || '').trim().slice(0, MAX_NAME) || 'Visitante';

      // Só threads-raiz carregam âncora; respostas herdam a posição do pai.
      const row = {
        proposal_slug: slug,
        parent_id: parentId,
        anchor_id: parentId ? null : String(payload.anchorId || '').slice(0, 80) || null,
        rel_x: parentId ? null : Number(payload.relX) || 0,
        rel_y: parentId ? null : Number(payload.relY) || 0,
        author_name: authorName,
        author_role: isOwner ? 'owner' : 'client',
        body,
      };

      if (!parentId && !row.anchor_id) {
        return res.status(400).json({ error: 'anchorId obrigatório para um novo comentário' });
      }

      const created = await insertComment(row);

      let parentBody = null;
      if (parentId) {
        const all = await selectComments(slug);
        parentBody = all.find((c) => c.id === parentId)?.body || null;
      }

      // O e-mail não pode derrubar o comentário que já foi gravado.
      await notify({ comment: created, isReply: Boolean(parentId), parentBody })
        .catch((err) => console.error('[comments] notificação falhou:', err));

      return res.status(201).json({ comment: created });
    }

    if (req.method === 'PATCH') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const slug = String(payload.slug || '').trim();
      const id = String(payload.id || '').trim();

      if (!slug) return res.status(400).json({ error: 'slug obrigatório' });
      if (!id) return res.status(400).json({ error: 'id obrigatório' });
      if (typeof payload.resolved !== 'boolean') {
        return res.status(400).json({ error: 'resolved deve ser true ou false' });
      }

      const isOwner = Boolean(OWNER_TOKEN) && payload.ownerToken === OWNER_TOKEN;
      let updated;
      try {
        updated = await setResolved({
          slug,
          id,
          resolved: payload.resolved,
          role: isOwner ? 'owner' : 'client',
        });
      } catch (err) {
        // Erro de configuração, não do pedido: dizer isso em vez de "erro
        // interno" economiza a investigação inteira.
        if (err.needsMigration) {
          return res.status(503).json({
            error: 'resolver ainda não está disponível: falta rodar a migração proposal_comments_resolved.sql',
          });
        }
        throw err;
      }

      // Nada atualizado = id inexistente, de outra proposta, ou de uma resposta.
      if (!updated) return res.status(404).json({ error: 'thread não encontrada' });

      // Resolver não dispara e-mail: é gesto de organização, não de conversa, e
      // notificar cada marcação viraria ruído na caixa dos dois lados.
      return res.status(200).json({ comment: updated });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'método não permitido' });
  } catch (err) {
    console.error('[comments]', err);
    return res.status(500).json({ error: 'erro interno' });
  }
}
