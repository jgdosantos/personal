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

async function selectComments(slug) {
  const query = new URLSearchParams({
    proposal_slug: `eq.${slug}`,
    select: 'id,parent_id,anchor_id,rel_x,rel_y,author_name,author_role,body,created_at',
    order: 'created_at.asc',
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${query}`, { headers: restHeaders });
  if (!res.ok) throw new Error(`Supabase select falhou: ${res.status} ${await res.text()}`);
  return res.json();
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

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;background:#ffffff;padding:32px;color:#000000">
      <p style="margin:0 0 24px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#9ca3af">
        ${escapeHtml(heading)}
      </p>
      ${parentBody ? `
        <div style="border-left:2px solid #e5e7eb;padding-left:16px;margin-bottom:20px;color:#6b7280;font-size:14px;line-height:1.6">
          ${escapeHtml(parentBody)}
        </div>` : ''}
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">
        ${escapeHtml(comment.author_name)}
      </p>
      <p style="margin:0 0 28px;font-size:16px;line-height:1.6;white-space:pre-wrap">${escapeHtml(comment.body)}</p>
      ${link ? `
        <a href="${escapeHtml(link)}"
           style="display:inline-block;border:1px solid #000;border-radius:9999px;padding:12px 28px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#000;text-decoration:none">
          Abrir a proposta
        </a>` : ''}
    </div>`;

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
      text: `${heading}\n\n${comment.author_name}:\n${comment.body}\n\n${link}`,
    }),
  });

  if (!res.ok) {
    console.error('[comments] Resend falhou:', res.status, await res.text());
  }
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

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'método não permitido' });
  } catch (err) {
    console.error('[comments]', err);
    return res.status(500).json({ error: 'erro interno' });
  }
}
