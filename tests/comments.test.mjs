process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.RESEND_API_KEY = 're_fake';
process.env.RESEND_FROM = 'Proposta <p@dominio.com>';
process.env.OWNER_EMAIL = 'joao@exemplo.com';
process.env.CLIENT_EMAIL = 'marcelo@exemplo.com';
process.env.OWNER_TOKEN = 'segredo-do-joao';
process.env.PROPOSAL_URL = 'https://dominio.com/proposta-marcelo';

const calls = [];
let rows = [];

globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), method: init.method || 'GET', body: init.body, headers: init.headers });

  if (String(url).includes('api.resend.com')) {
    return { ok: true, status: 200, json: async () => ({ id: 'email_1' }), text: async () => '' };
  }
  if (init.method === 'POST') {
    const row = { id: `c${rows.length + 1}`, created_at: new Date().toISOString(), ...JSON.parse(init.body) };
    rows.push(row);
    return { ok: true, status: 201, json: async () => [row], text: async () => '' };
  }
  if (init.method === 'PATCH') {
    // Reproduz os filtros do PostgREST que a API monta na query string, para
    // que o teste falhe se algum deles for removido do código.
    const q = new URL(String(url)).searchParams;
    const id = (q.get('id') || '').replace('eq.', '');
    const slug = (q.get('proposal_slug') || '').replace('eq.', '');
    const rootOnly = q.get('parent_id') === 'is.null';
    const patch = JSON.parse(init.body);
    const hit = rows.find((r) => (
      r.id === id
      && r.proposal_slug === slug
      && (!rootOnly || !r.parent_id)
    ));
    if (hit) Object.assign(hit, patch);
    return { ok: true, status: 200, json: async () => (hit ? [hit] : []), text: async () => '' };
  }
  return { ok: true, status: 200, json: async () => rows, text: async () => '' };
};

const { default: handler } = await import(new URL('../api/comments.js', import.meta.url));

const mkRes = () => {
  const r = { statusCode: null, payload: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (p) => { r.payload = p; return r; };
  return r;
};

const run = async (req) => { const res = mkRes(); await handler(req, res); return res; };
let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + extra}`);
  if (!cond) failures++;
};

// 1. Cliente cria uma thread ancorada
let res = await run({
  method: 'POST',
  body: { slug: 'marcelo', anchorId: 'escopo-05', relX: 0.4, relY: 0.6, name: 'Marcelo', body: 'Isso cobre Instagram?' },
});
check('cria thread do cliente (201)', res.statusCode === 201, JSON.stringify(res.payload));
check('papel = client', res.payload?.comment?.author_role === 'client');
check('nome preservado', res.payload?.comment?.author_name === 'Marcelo');
check('âncora gravada', res.payload?.comment?.anchor_id === 'escopo-05');

let mail = JSON.parse(calls.filter((c) => c.url.includes('resend')).at(-1).body);
check('notifica o dono', mail.to[0] === 'joao@exemplo.com', JSON.stringify(mail.to));
check('reply_to = cliente que escreveu', mail.reply_to?.[0] === 'marcelo@exemplo.com', JSON.stringify(mail.reply_to));

// 2. Dono responde com o token
res = await run({
  method: 'POST',
  body: { slug: 'marcelo', parentId: 'c1', ownerToken: 'segredo-do-joao', name: 'ignorado', body: 'Não, é só IA generativa.' },
});
check('cria resposta do dono (201)', res.statusCode === 201, JSON.stringify(res.payload));
check('papel = owner', res.payload?.comment?.author_role === 'owner');
check('nome forçado para João Gabriel', res.payload?.comment?.author_name === 'João Gabriel');
check('resposta sem âncora', res.payload?.comment?.anchor_id === null);

mail = JSON.parse(calls.filter((c) => c.url.includes('resend')).at(-1).body);
check('notifica o cliente', mail.to[0] === 'marcelo@exemplo.com', JSON.stringify(mail.to));
check('reply_to = dono que respondeu', mail.reply_to?.[0] === 'joao@exemplo.com', JSON.stringify(mail.reply_to));
check('e-mail cita a thread pai', mail.html.includes('Isso cobre Instagram?'));

// 3. Token errado não vira dono
res = await run({
  method: 'POST',
  body: { slug: 'marcelo', anchorId: 'cta', relX: 0.5, relY: 0.5, ownerToken: 'chute', name: 'Fulano', body: 'oi' },
});
check('token inválido = client', res.payload?.comment?.author_role === 'client');

// 4. Validações
res = await run({ method: 'POST', body: { slug: 'marcelo', body: 'sem âncora' } });
check('thread sem anchorId = 400', res.statusCode === 400, JSON.stringify(res.payload));

res = await run({ method: 'POST', body: { slug: 'marcelo', anchorId: 'cta', body: '   ' } });
check('corpo vazio = 400', res.statusCode === 400);

res = await run({ method: 'POST', body: { slug: 'marcelo', anchorId: 'cta', body: 'x'.repeat(2001) } });
check('corpo longo demais = 400', res.statusCode === 400);

res = await run({ method: 'GET', query: {} });
check('GET sem slug = 400', res.statusCode === 400);

// 5. Escape de HTML no e-mail
await run({
  method: 'POST',
  body: { slug: 'marcelo', anchorId: 'cta', relX: 0.5, relY: 0.5, name: '<img src=x onerror=alert(1)>', body: '<script>alert(1)</script>' },
});
mail = JSON.parse(calls.filter((c) => c.url.includes('resend')).at(-1).body);
check('HTML do autor escapado', !mail.html.includes('<img src=x'));
check('HTML do corpo escapado', !mail.html.includes('<script>'));

// 6. GET lista
res = await run({ method: 'GET', query: { slug: 'marcelo' } });
check('GET lista comentários', res.statusCode === 200 && Array.isArray(res.payload.comments) && res.payload.comments.length === 4,
  JSON.stringify(res.payload?.comments?.length));
check('GET sem cache', res.headers['Cache-Control'] === 'no-store');

// 7. Método não suportado
res = await run({ method: 'DELETE', body: {} });
check('DELETE = 405', res.statusCode === 405);

// 7b. Resolver / reabrir thread
res = await run({ method: 'PATCH', body: { slug: 'marcelo', id: 'c1', resolved: true } });
check('resolve thread (200)', res.statusCode === 200, JSON.stringify(res.payload));
check('grava resolved_at', Boolean(res.payload?.comment?.resolved_at));
check('grava quem resolveu', res.payload?.comment?.resolved_by === 'client');

res = await run({
  method: 'PATCH',
  body: { slug: 'marcelo', id: 'c1', resolved: true, ownerToken: 'segredo-do-joao' },
});
check('dono resolvendo fica como owner', res.payload?.comment?.resolved_by === 'owner');

res = await run({ method: 'PATCH', body: { slug: 'marcelo', id: 'c1', resolved: false } });
check('reabre thread', res.payload?.comment?.resolved_at === null);
check('limpa quem resolveu', res.payload?.comment?.resolved_by === null);

// c2 é resposta (parent_id = c1): o filtro parent_id=is.null tem que barrar.
res = await run({ method: 'PATCH', body: { slug: 'marcelo', id: 'c2', resolved: true } });
check('resposta não resolve = 404', res.statusCode === 404, JSON.stringify(res.payload));

res = await run({ method: 'PATCH', body: { slug: 'outra-proposta', id: 'c1', resolved: true } });
check('slug de outra proposta = 404', res.statusCode === 404);

res = await run({ method: 'PATCH', body: { slug: 'marcelo', id: 'c1' } });
check('resolved não booleano = 400', res.statusCode === 400);

res = await run({ method: 'PATCH', body: { slug: 'marcelo', resolved: true } });
check('PATCH sem id = 400', res.statusCode === 400);

// Resolver é organização, não conversa: não pode gerar e-mail.
const mailsAntes = calls.filter((c) => c.url.includes('resend')).length;
await run({ method: 'PATCH', body: { slug: 'marcelo', id: 'c1', resolved: true } });
check('resolver não dispara e-mail',
  calls.filter((c) => c.url.includes('resend')).length === mailsAntes);
await run({ method: 'PATCH', body: { slug: 'marcelo', id: 'c1', resolved: false } });

// 8. Sem CLIENT_EMAIL configurado, o comentário do cliente ainda notifica o
// dono — só que sem reply_to, porque não há endereço do autor para apontar.
{
  // O módulo lê process.env no carregamento, então a variável precisa sair
  // do ambiente ANTES do import — e a query string força uma instância nova.
  const saved = process.env.CLIENT_EMAIL;
  delete process.env.CLIENT_EMAIL;
  const { default: freshHandler } = await import(
    new URL(`../api/comments.js?no-client-email`, import.meta.url)
  );
  const fresh = mkRes();
  await freshHandler({
    method: 'POST',
    body: { slug: 'marcelo', anchorId: 'cta', relX: 0.5, relY: 0.5, name: 'Marcelo', body: 'sem email do cliente' },
  }, fresh);
  const m = JSON.parse(calls.filter((c) => c.url.includes('resend')).at(-1).body);
  check('sem CLIENT_EMAIL, ainda notifica o dono', m.to[0] === 'joao@exemplo.com', JSON.stringify(m.to));
  check('sem CLIENT_EMAIL, reply_to omitido', m.reply_to === undefined, JSON.stringify(m.reply_to));
  process.env.CLIENT_EMAIL = saved;
}

// 9. Variável colada com quebra de linha (caso real: o painel da Vercel
// arrastou "\n\n" junto da service role key e o fetch morria com
// "Headers.append: invalid header value").
{
  const saved = {
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    url: process.env.SUPABASE_URL,
    token: process.env.OWNER_TOKEN,
  };
  process.env.SUPABASE_SERVICE_ROLE_KEY = '\n\nservice-key\n';
  process.env.SUPABASE_URL = ' https://fake.supabase.co/ ';
  process.env.OWNER_TOKEN = '  segredo-do-joao\n';
  const { default: dirtyHandler } = await import(
    new URL(`../api/comments.js?dirty-env`, import.meta.url)
  );

  const fresh = mkRes();
  await dirtyHandler({ method: 'GET', query: { slug: 'marcelo' } }, fresh);
  const supaCall = calls.filter((c) => c.url.includes('supabase')).at(-1);
  check('GET funciona com env sujo', fresh.statusCode === 200, JSON.stringify(fresh.payload));
  check('Authorization sem quebra de linha', supaCall.headers.Authorization === 'Bearer service-key',
    JSON.stringify(supaCall.headers.Authorization));
  check('URL sem espaço nem barra final', supaCall.url.startsWith('https://fake.supabase.co/rest/v1/'),
    supaCall.url);

  // O token sujo ainda precisa reconhecer o dono.
  const fresh2 = mkRes();
  await dirtyHandler({
    method: 'POST',
    body: { slug: 'marcelo', parentId: 'c1', ownerToken: 'segredo-do-joao', body: 'com env sujo' },
  }, fresh2);
  check('OWNER_TOKEN sujo ainda autentica o dono', fresh2.payload?.comment?.author_role === 'owner',
    JSON.stringify(fresh2.payload));

  Object.assign(process.env, {
    SUPABASE_SERVICE_ROLE_KEY: saved.key, SUPABASE_URL: saved.url, OWNER_TOKEN: saved.token,
  });
}

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
