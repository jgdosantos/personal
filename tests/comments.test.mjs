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
  calls.push({ url: String(url), method: init.method || 'GET', body: init.body });

  if (String(url).includes('api.resend.com')) {
    return { ok: true, status: 200, json: async () => ({ id: 'email_1' }), text: async () => '' };
  }
  if (init.method === 'POST') {
    const row = { id: `c${rows.length + 1}`, created_at: new Date().toISOString(), ...JSON.parse(init.body) };
    rows.push(row);
    return { ok: true, status: 201, json: async () => [row], text: async () => '' };
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

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
