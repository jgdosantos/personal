// Vercel Serverless Function — briefings de marca.
//
// GET   /api/brief?c=<token>            → o briefing daquele cliente
// GET   /api/brief?owner=<OWNER_TOKEN>  → a lista, para o João
// PATCH /api/brief                      → autosave dos campos de texto
// POST  /api/brief { action }           → sign | finalize | delete
//
// Sem SDKs: fala PostgREST e Storage por fetch, igual /api/comments, para não
// adicionar dependência a um projeto que é só Vite + React.
//
// NENHUM byte de arquivo passa por aqui. A função assina uma URL e o browser
// escreve direto no Storage — o corpo de requisição da Vercel para em 4,5 MB,
// e um brandbook passa disso sozinho.

import {
  FIELDS, UPLOAD_FIELDS, WHATSAPP_FIELDS, BRIEF_MAX_BYTES,
  isAllowed, canonicalContentType, safeStorageName, fieldState,
} from '../shared/briefFields.js';

// Colar valor no painel da Vercel arrasta espaço e quebra de linha invisíveis
// junto, e um "\n" dentro de um header derruba o fetch. Mesma defesa do
// /api/comments, que já foi mordido por isso em produção.
const env = (name) => (process.env[name] || '').trim();

const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const OWNER_TOKEN = env('OWNER_TOKEN');
const BUCKET = env('BRIEF_BUCKET') || 'brand-briefs';
const RESEND_API_KEY = env('RESEND_API_KEY');
const RESEND_FROM = env('RESEND_FROM');
const OWNER_EMAIL = env('OWNER_EMAIL');
const SITE_URL = env('SITE_URL').replace(/\/+$/, '');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

const STATE_LABEL = {
  recebido: 'recebido',
  enviado_whatsapp: 'enviado por WhatsApp',
  nao_enviado: 'não enviado',
};

const BRIEFS = 'brand_briefs';
const FILES = 'brief_files';

// Lista explícita, nunca `select=*`: com `*`, o dia em que alguém mudar o
// mapeamento o access_token vai junto na resposta do cliente.
const BRIEF_COLUMNS = [
  'id', 'status', 'brand_name', 'instagram', 'description',
  'design_system_url', 'notes', 'whatsapp_fields',
  'created_at', 'updated_at', 'submitted_at',
].join(',');

const OWNER_BRIEF_COLUMNS = `${BRIEF_COLUMNS},client_label,client_email,sheet_synced_at`;

const FILE_COLUMNS = [
  'id', 'brief_id', 'field', 'storage_path', 'original_name',
  'content_type', 'size_bytes', 'status', 'created_at',
].join(',');

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// A URL de upload assinada pelo Storage vale cerca de 2h.
const PENDING_TTL_MS = 2 * 60 * 60 * 1000;

const MAX = { brandName: 120, instagram: 80, description: 1200, designSystemUrl: 500, notes: 1200 };

// ---------------------------------------------------------------------------
// Normalização e validação
// ---------------------------------------------------------------------------

/** Aceita @handle, handle ou URL completa; guarda sempre @handle. */
export const normalizeInstagram = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const fromUrl = raw.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const handle = (fromUrl ? fromUrl[1] : raw).replace(/^@+/, '').replace(/\/+$/, '');
  return handle ? `@${handle.slice(0, MAX.instagram - 1)}` : '';
};

/** Só http e https. Barra javascript: e data:, que passariam por um regex ingênuo. */
export const isSafeUrl = (value) => {
  try {
    const { protocol } = new URL(String(value));
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// PostgREST
// ---------------------------------------------------------------------------

const rest = (path, init = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  ...init,
  headers: { ...restHeaders, ...(init.headers || {}) },
});

async function findBriefByToken(token) {
  const query = new URLSearchParams({
    access_token: `eq.${token}`,
    select: `${OWNER_BRIEF_COLUMNS},access_token`,
    limit: '1',
  });
  const res = await rest(`${BRIEFS}?${query}`);
  if (!res.ok) throw new Error(`Supabase select falhou: ${res.status} ${await res.text()}`);
  const [row] = await res.json();
  return row || null;
}

async function filesOf(briefId) {
  const query = new URLSearchParams({
    brief_id: `eq.${briefId}`,
    select: FILE_COLUMNS,
    order: 'created_at.asc',
  });
  const res = await rest(`${FILES}?${query}`);
  if (!res.ok) throw new Error(`Supabase select falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

// O que o CLIENTE pode ver. access_token e client_email nunca saem daqui.
const publicBrief = (row) => ({
  id: row.id,
  status: row.status,
  brandName: row.brand_name || '',
  instagram: row.instagram || '',
  description: row.description || '',
  designSystemUrl: row.design_system_url || '',
  notes: row.notes || '',
  whatsappFields: row.whatsapp_fields || [],
  updatedAt: row.updated_at,
  submittedAt: row.submitted_at,
});

const publicFile = (row) => ({
  id: row.id,
  field: row.field,
  originalName: row.original_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  status: row.status,
  createdAt: row.created_at,
});

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

async function signUpload(path) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}`,
    { method: 'POST', headers: { ...restHeaders, 'x-upsert': 'true' }, body: '{}' },
  );
  if (!res.ok) throw new Error(`Storage sign falhou: ${res.status} ${await res.text()}`);
  const data = await res.json();
  // `url` já vem como /object/upload/sign/... — o prefixo /storage/v1 é nosso.
  return { uploadUrl: `${SUPABASE_URL}/storage/v1${data.url}`, token: data.token };
}

/**
 * Lê do próprio Storage o tamanho real do objeto. É a única camada que o
 * cliente não consegue contornar: o `size` que ele declarou no sign é palpite,
 * este é fato.
 */
async function statObject(briefId, field, leaf) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: restHeaders,
    body: JSON.stringify({ prefix: `${briefId}/${field}`, limit: 100 }),
  });
  if (!res.ok) throw new Error(`Storage list falhou: ${res.status} ${await res.text()}`);
  const entries = await res.json();
  return (entries || []).find((e) => e && e.name === leaf) || null;
}

const deleteObject = (path) => fetch(
  `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
  { method: 'DELETE', headers: restHeaders },
);

// ---------------------------------------------------------------------------
// Notificação
// ---------------------------------------------------------------------------

/** Uma linha por campo de material, com o estado calculado pelo helper único. */
const materialLines = (brief, files) => {
  const rows = UPLOAD_FIELDS.map((field) => {
    const state = fieldState(field, files, brief.whatsapp_fields);
    const count = files.filter((f) => f.field === field && f.status === 'ready').length;
    const value = state === 'recebido'
      ? `${count} arquivo${count === 1 ? '' : 's'}`
      : STATE_LABEL[state];
    return { label: FIELDS[field].label, value };
  });
  const ds = fieldState('design_system', [], brief.whatsapp_fields);
  rows.push({
    label: 'Design System',
    value: brief.design_system_url
      ? brief.design_system_url
      : STATE_LABEL[ds === 'enviado_whatsapp' ? 'enviado_whatsapp' : 'nao_enviado'],
  });
  return rows;
};

async function notify(brief, files, { isUpdate }) {
  // Nunca mandamos para o cliente: quem precisa saber que chegou briefing é o
  // João. reply_to omitido quando não há e-mail — o Resend recusa vazio.
  const replyTo = brief.client_email;
  if (!RESEND_API_KEY || !RESEND_FROM || !OWNER_EMAIL) {
    console.warn('[brief] notificação ignorada: faltam RESEND_API_KEY, RESEND_FROM ou OWNER_EMAIL');
    return;
  }

  // RESEND_FROM é compartilhado com /api/comments e traz o nome "Proposta".
  // Num aviso de briefing isso confunde a caixa de entrada. Reaproveita o
  // endereço — que é o que está verificado no Resend — e troca só o rótulo.
  const address = (RESEND_FROM.match(/<([^>]+)>/) || [null, RESEND_FROM])[1].trim();
  const from = `Briefing <${address}>`;

  const heading = isUpdate ? 'Briefing de marca atualizado' : 'Briefing de marca';
  const brandName = brief.brand_name || brief.client_label || 'sem nome';
  const subject = `${heading} — ${brandName}`;
  // Sem OWNER_TOKEN e sem URL assinada: e-mail é encaminhável, e URL assinada
  // é bearer token. O navegador do João já tem o token no localStorage.
  const adminLink = SITE_URL ? `${SITE_URL}/brief-admin?id=${brief.id}` : '';

  const rows = materialLines(brief, files)
    .map((r) => `<tr><td style="padding:4px 16px 4px 0;color:#6e6e73">${escapeHtml(r.label)}</td>`
      + `<td style="padding:4px 0">${escapeHtml(r.value)}</td></tr>`)
    .join('');

  // Documento completo com lang="pt-BR": sem isso o Gmail oferece traduzir do
  // inglês. Visual sóbrio de propósito — botão em pílula com caixa alta foi o
  // que mandou a notificação da proposta para a aba Promoções.
  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#ffffff;color:#1d1d1f;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
<p style="margin:0 0 20px">${escapeHtml(heading)} de <strong>${escapeHtml(brandName)}</strong>.</p>
${brief.instagram ? `<p style="margin:0 0 8px">Instagram: ${escapeHtml(brief.instagram)}</p>` : ''}
${brief.description ? `<p style="margin:0 0 20px;white-space:pre-wrap">${escapeHtml(brief.description)}</p>` : ''}
<table style="margin:0 0 20px;border-collapse:collapse;font-size:14px">${rows}</table>
${brief.notes ? `<p style="margin:0 0 20px;color:#6e6e73;white-space:pre-wrap">Observações: ${escapeHtml(brief.notes)}</p>` : ''}
${adminLink ? `<p style="margin:0 0 24px"><a href="${escapeHtml(adminLink)}" style="color:#0066cc">Abrir o briefing completo</a></p>` : ''}
<p style="margin:0;color:#86868b;font-size:13px">Responder este e-mail fala direto com o cliente.</p>
</body>
</html>`;

  const text = `${heading} de ${brandName}\n\n`
    + `${brief.description || ''}\n\n`
    + materialLines(brief, files).map((r) => `${r.label}: ${r.value}`).join('\n')
    + `\n\n${adminLink}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [OWNER_EMAIL],
      ...(replyTo ? { reply_to: [replyTo] } : {}),
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error('[brief] Resend falhou:', res.status, await res.text());
    return;
  }
  const { id } = await res.json().catch(() => ({}));
  console.log(`[brief] e-mail aceito pelo Resend id=${id} de=${from} para=${OWNER_EMAIL}`);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase não configurado no ambiente.' });
  }
  res.setHeader('Cache-Control', 'no-store');

  try {
    const query = req.query || {};
    const isOwner = Boolean(OWNER_TOKEN) && query.owner === OWNER_TOKEN;

    // ---------------------------------------------------------------- GET
    if (req.method === 'GET') {
      if (isOwner && !query.id) {
        const listQuery = new URLSearchParams({
          select: OWNER_BRIEF_COLUMNS,
          order: 'created_at.desc',
        });
        const listRes = await rest(`${BRIEFS}?${listQuery}`);
        if (!listRes.ok) throw new Error(`Supabase select falhou: ${listRes.status}`);
        const rows = await listRes.json();
        return res.status(200).json({
          briefs: rows.map((r) => ({
            ...publicBrief(r),
            clientLabel: r.client_label,
            clientEmail: r.client_email,
            sheetSyncedAt: r.sheet_synced_at,
          })),
        });
      }

      const token = String(query.c || '').trim();
      if (!token && !isOwner) return res.status(400).json({ error: 'link obrigatório' });

      const brief = token
        ? await findBriefByToken(token)
        : null;
      if (!brief) return res.status(404).json({ error: 'link inválido' });

      const files = await filesOf(brief.id);
      return res.status(200).json({
        brief: publicBrief(brief),
        files: files.map(publicFile),
      });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // -------------------------------------------------------------- PATCH
    if (req.method === 'PATCH') {
      const token = String(payload.c || '').trim();
      if (!token) return res.status(400).json({ error: 'link obrigatório' });

      const brief = await findBriefByToken(token);
      if (!brief) return res.status(404).json({ error: 'link inválido' });
      if (brief.status === 'submitted') {
        return res.status(409).json({ error: 'briefing já enviado' });
      }

      const patch = payload.patch || {};
      const row = {};

      // Whitelist explícita. Qualquer chave fora daqui — status, access_token,
      // submitted_at — é silenciosamente ignorada em vez de gravada.
      if ('brandName' in patch) row.brand_name = String(patch.brandName || '').trim().slice(0, MAX.brandName);
      if ('description' in patch) row.description = String(patch.description || '').trim().slice(0, MAX.description);
      if ('notes' in patch) row.notes = String(patch.notes || '').trim().slice(0, MAX.notes);
      if ('instagram' in patch) row.instagram = normalizeInstagram(patch.instagram);

      if ('designSystemUrl' in patch) {
        const url = String(patch.designSystemUrl || '').trim().slice(0, MAX.designSystemUrl);
        if (url && !isSafeUrl(url)) {
          return res.status(400).json({ error: 'o link precisa começar com http ou https' });
        }
        row.design_system_url = url;
      }

      if ('whatsappFields' in patch) {
        const list = Array.isArray(patch.whatsappFields) ? patch.whatsappFields : null;
        if (!list || list.some((f) => !WHATSAPP_FIELDS.includes(f))) {
          return res.status(400).json({ error: 'campo inválido' });
        }
        row.whatsapp_fields = [...new Set(list)];
      }

      if (!Object.keys(row).length) return res.status(400).json({ error: 'nada para salvar' });
      row.updated_at = new Date().toISOString();

      const patchRes = await rest(`${BRIEFS}?id=eq.${brief.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(row),
      });
      if (!patchRes.ok) throw new Error(`Supabase patch falhou: ${patchRes.status} ${await patchRes.text()}`);
      const [updated] = await patchRes.json();
      return res.status(200).json({ updatedAt: updated ? updated.updated_at : row.updated_at });
    }

    // --------------------------------------------------------------- POST
    if (req.method === 'POST') {
      const action = String(payload.action || '').trim();
      const token = String(payload.c || '').trim();
      if (!token) return res.status(400).json({ error: 'link obrigatório' });

      const brief = await findBriefByToken(token);
      if (!brief) return res.status(404).json({ error: 'link inválido' });

      if (action === 'sign') {
        if (brief.status === 'submitted') {
          return res.status(409).json({ error: 'briefing já enviado' });
        }

        const existing = await filesOf(brief.id);

        // Retry do mesmo arquivo: reassina o MESMO caminho. Sem isto, uma
        // conexão que cai no meio deixa lixo órfão e duplica a contagem.
        if (payload.fileId) {
          const row = existing.find((f) => f.id === payload.fileId);
          if (!row) return res.status(404).json({ error: 'arquivo não encontrado' });
          const { uploadUrl } = await signUpload(row.storage_path);
          return res.status(200).json({
            fileId: row.id,
            path: row.storage_path,
            uploadUrl,
            contentType: row.content_type,
          });
        }

        const field = String(payload.field || '').trim();
        const spec = FIELDS[field];
        if (!spec) return res.status(400).json({ error: 'campo inválido' });

        const fileName = String(payload.fileName || '').trim();
        const declaredType = String(payload.contentType || '').trim();
        if (!isAllowed(field, declaredType, fileName)) {
          return res.status(400).json({ error: `formato não aceito em ${spec.label.toLowerCase()}` });
        }

        const size = Number(payload.size) || 0;
        if (size > spec.maxBytes) {
          return res.status(413).json({ error: 'arquivo maior que o limite do campo' });
        }

        // Conta os prontos e apenas os pendentes ainda vivos.
        //
        // Contar todo pendente vazaria cota para sempre: upload que falha no
        // meio — rede caindo, aba fechada — deixa a linha em `pending`, e o
        // cliente perderia a vaga sem entender por quê. Contar só os prontos
        // deixaria uma rajada de assinaturas simultâneas furar o teto.
        //
        // A URL assinada vale ~2h; pendente mais velho que isso não pode mais
        // virar arquivo, então não deve mais ocupar lugar.
        const now = Date.now();
        const inField = existing.filter((f) => f.field === field && (
          f.status === 'ready'
          || now - new Date(f.created_at).getTime() < PENDING_TTL_MS
        )).length;
        if (inField >= spec.maxCount) {
          return res.status(409).json({ error: `limite de ${spec.maxCount} arquivos neste campo` });
        }

        const totalReady = existing
          .filter((f) => f.status === 'ready')
          .reduce((sum, f) => sum + (Number(f.size_bytes) || 0), 0);
        if (totalReady + size > BRIEF_MAX_BYTES) {
          return res.status(413).json({ error: 'limite total do briefing atingido' });
        }

        // O caminho é montado AQUI, inteiro. `payload.path` é ignorado de
        // propósito: é o caminho preso ao brief_id que isola um cliente do
        // outro, e a URL assinada prende onde se escreve, não o que se escreve.
        const leaf = `${crypto.randomUUID()}-${safeStorageName(fileName)}`;
        const storagePath = `${brief.id}/${field}/${leaf}`;
        const contentType = canonicalContentType(field, fileName);

        const insertRes = await rest(FILES, {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            brief_id: brief.id,
            field,
            storage_path: storagePath,
            original_name: fileName.slice(0, 300),
            content_type: contentType,
            size_bytes: size || null,
            status: 'pending',
          }),
        });
        if (!insertRes.ok) throw new Error(`Supabase insert falhou: ${insertRes.status} ${await insertRes.text()}`);
        const [created] = await insertRes.json();

        const { uploadUrl } = await signUpload(storagePath);
        return res.status(201).json({
          fileId: created.id,
          path: storagePath,
          uploadUrl,
          contentType,
        });
      }

      if (action === 'finalize') {
        const files = await filesOf(brief.id);
        const row = files.find((f) => f.id === payload.fileId);
        if (!row) return res.status(404).json({ error: 'arquivo não encontrado' });

        const leaf = row.storage_path.split('/').pop();
        const object = await statObject(brief.id, row.field, leaf);
        if (!object) return res.status(404).json({ error: 'upload não encontrado no storage' });

        const realSize = Number(object.metadata && object.metadata.size) || 0;
        const realType = (object.metadata && object.metadata.mimetype) || row.content_type;
        const spec = FIELDS[row.field];

        // Tamanho real acima do teto: apaga objeto e linha. É o único ponto em
        // que o tamanho deixa de ser declaração e vira fato verificado.
        if (spec && realSize > spec.maxBytes) {
          await deleteObject(row.storage_path).catch(() => {});
          await rest(`${FILES}?id=eq.${row.id}`, { method: 'DELETE' }).catch(() => {});
          return res.status(413).json({ error: 'arquivo maior que o limite do campo' });
        }

        const patchRes = await rest(`${FILES}?id=eq.${row.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ status: 'ready', size_bytes: realSize, content_type: realType }),
        });
        if (!patchRes.ok) throw new Error(`Supabase patch falhou: ${patchRes.status}`);
        const [updated] = await patchRes.json();
        return res.status(200).json({ file: publicFile(updated || row) });
      }

      if (action === 'delete') {
        if (brief.status === 'submitted') {
          return res.status(409).json({ error: 'briefing já enviado' });
        }
        const files = await filesOf(brief.id);
        const row = files.find((f) => f.id === payload.fileId);
        if (!row) return res.status(404).json({ error: 'arquivo não encontrado' });

        await deleteObject(row.storage_path).catch(() => {});
        const delRes = await rest(`${FILES}?id=eq.${row.id}`, { method: 'DELETE' });
        if (!delRes.ok) throw new Error(`Supabase delete falhou: ${delRes.status}`);
        return res.status(200).json({});
      }

      if (action === 'submit') {
        if (brief.status === 'submitted') {
          return res.status(409).json({ error: 'briefing já enviado' });
        }
        // Material é todo opcional — a escapatória do WhatsApp existe justamente
        // para isso. Estes dois não: sem eles não há briefing.
        if (!String(brief.brand_name || '').trim()) {
          return res.status(400).json({ error: 'preencha o nome da marca' });
        }
        if (!String(brief.description || '').trim()) {
          return res.status(400).json({ error: 'preencha a descrição da marca' });
        }

        const isUpdate = Boolean(brief.submitted_at);
        const now = new Date().toISOString();

        // GRAVA PRIMEIRO. E-mail e planilha vêm depois, e nenhum dos dois pode
        // derrubar um envio que o cliente já considera feito.
        const patchRes = await rest(`${BRIEFS}?id=eq.${brief.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ status: 'submitted', submitted_at: now, updated_at: now }),
        });
        if (!patchRes.ok) throw new Error(`Supabase patch falhou: ${patchRes.status}`);

        const files = await filesOf(brief.id);
        await notify({ ...brief, status: 'submitted', submitted_at: now }, files, { isUpdate })
          .catch((err) => console.error('[brief] notificação falhou:', err));

        return res.status(200).json({ status: 'submitted', submittedAt: now });
      }

      if (action === 'reopen') {
        // Sem isto, o cliente que esqueceu a logo não tem saída nenhuma.
        const now = new Date().toISOString();
        const patchRes = await rest(`${BRIEFS}?id=eq.${brief.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ status: 'draft', updated_at: now }),
        });
        if (!patchRes.ok) throw new Error(`Supabase patch falhou: ${patchRes.status}`);
        return res.status(200).json({ status: 'draft' });
      }

      return res.status(400).json({ error: 'ação inválida' });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'método não permitido' });
  } catch (err) {
    console.error('[brief]', err);
    return res.status(500).json({ error: 'erro interno' });
  }
}
