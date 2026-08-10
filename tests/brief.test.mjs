process.env.SUPABASE_URL = ' https://fake.supabase.co/ ';           // sujo de propósito
process.env.SUPABASE_SERVICE_ROLE_KEY = '\n\nservice-key\n';        // sujo de propósito
process.env.OWNER_TOKEN = '  segredo-do-joao\n';                    // sujo de propósito
process.env.BRIEF_BUCKET = 'brand-briefs';

const BRIEF_ID = 'b1111111-1111-1111-1111-111111111111';
const TOKEN = 'tokenvalido';

const calls = [];
let brief;
let files;

const reset = () => {
  brief = {
    id: BRIEF_ID,
    access_token: TOKEN,
    client_label: 'Marcelo — Clínica',
    client_email: 'marcelo@exemplo.com',
    status: 'draft',
    brand_name: null,
    instagram: null,
    description: null,
    design_system_url: null,
    notes: null,
    whatsapp_fields: [],
    submitted_at: null,
    sheet_synced_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  files = [];
  calls.length = 0;
};
reset();

// Tamanho que o Storage vai reportar no list. O teste sobrescreve para checar
// o caminho do 413.
let storageSize = 1024;

globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  const method = init.method || 'GET';
  calls.push({ url: u, method, body: init.body, headers: init.headers });

  // ---- Storage ----
  if (u.includes('/storage/v1/object/upload/sign/')) {
    const path = u.split(`/upload/sign/brand-briefs/`)[1];
    return { ok: true, status: 200, text: async () => '', json: async () => ({ url: `/object/upload/sign/brand-briefs/${path}`, token: 'jwt' }) };
  }
  if (u.includes('/storage/v1/object/list/')) {
    const { prefix } = JSON.parse(init.body);
    const rows = files
      .filter((f) => f.storage_path.startsWith(prefix))
      .map((f) => ({ name: f.storage_path.split('/').pop(), metadata: { size: storageSize, mimetype: f.content_type } }));
    return { ok: true, status: 200, text: async () => '', json: async () => rows };
  }
  if (u.includes('/storage/v1/object/') && method === 'DELETE') {
    return { ok: true, status: 200, text: async () => '', json: async () => ({}) };
  }

  // ---- PostgREST: brand_briefs ----
  if (u.includes('/rest/v1/brand_briefs')) {
    if (method === 'PATCH') {
      Object.assign(brief, JSON.parse(init.body));
      return { ok: true, status: 200, text: async () => '', json: async () => [brief] };
    }
    const q = new URL(u).searchParams;
    const wanted = (q.get('access_token') || '').replace('eq.', '');
    const rows = !q.has('access_token') ? [brief] : (wanted === brief.access_token ? [brief] : []);
    return { ok: true, status: 200, text: async () => '', json: async () => rows };
  }

  // ---- PostgREST: brief_files ----
  if (u.includes('/rest/v1/brief_files')) {
    if (method === 'POST') {
      const row = { id: `f${files.length + 1}`, status: 'pending', created_at: new Date().toISOString(), ...JSON.parse(init.body) };
      files.push(row);
      return { ok: true, status: 201, text: async () => '', json: async () => [row] };
    }
    const q = new URL(u).searchParams;
    const id = (q.get('id') || '').replace('eq.', '');
    if (method === 'PATCH') {
      const row = files.find((f) => f.id === id);
      if (row) Object.assign(row, JSON.parse(init.body));
      return { ok: true, status: 200, text: async () => '', json: async () => (row ? [row] : []) };
    }
    if (method === 'DELETE') {
      files = files.filter((f) => f.id !== id);
      return { ok: true, status: 200, text: async () => '', json: async () => [] };
    }
    return { ok: true, status: 200, text: async () => '', json: async () => files };
  }

  throw new Error(`URL não roteada no stub: ${method} ${u}`);
};

const { default: handler } = await import(new URL('../api/brief.js', import.meta.url));

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

// ---------------------------------------------------------------- GET
let res = await run({ method: 'GET', query: { c: TOKEN } });
check('GET com token válido (200)', res.statusCode === 200, JSON.stringify(res.payload));
check('GET não devolve access_token', !JSON.stringify(res.payload).includes(TOKEN));
check('GET não devolve client_email', !JSON.stringify(res.payload).includes('marcelo@exemplo.com'));
check('GET marca no-store', res.headers['Cache-Control'] === 'no-store');

res = await run({ method: 'GET', query: { c: 'nao-existe' } });
check('token inexistente = 404', res.statusCode === 404, JSON.stringify(res.payload));

res = await run({ method: 'GET', query: {} });
check('GET sem c nem owner = 400', res.statusCode === 400);

res = await run({ method: 'GET', query: { owner: 'segredo-do-joao' } });
check('dono lista os briefings', res.statusCode === 200 && Array.isArray(res.payload.briefs));
check('lista do dono inclui client_label', res.payload.briefs[0].clientLabel === 'Marcelo — Clínica');

// -------------------------------------------------------------- PATCH
res = await run({ method: 'PATCH', body: { c: TOKEN, patch: { brandName: '  Clínica Bella  ' } } });
check('PATCH salva (200)', res.statusCode === 200, JSON.stringify(res.payload));
check('PATCH apara espaço', brief.brand_name === 'Clínica Bella', String(brief.brand_name));

await run({ method: 'PATCH', body: { c: TOKEN, patch: { instagram: 'https://instagram.com/clinicabella/' } } });
check('instagram de URL vira @handle', brief.instagram === '@clinicabella', String(brief.instagram));
await run({ method: 'PATCH', body: { c: TOKEN, patch: { instagram: '@ja_tem_arroba' } } });
check('instagram já com @ é mantido', brief.instagram === '@ja_tem_arroba', String(brief.instagram));

res = await run({ method: 'PATCH', body: { c: TOKEN, patch: { designSystemUrl: 'javascript:alert(1)' } } });
check('designSystemUrl javascript: = 400', res.statusCode === 400, JSON.stringify(res.payload));
res = await run({ method: 'PATCH', body: { c: TOKEN, patch: { designSystemUrl: 'https://figma.com/file/x' } } });
check('designSystemUrl https = 200', res.statusCode === 200);

res = await run({ method: 'PATCH', body: { c: TOKEN, patch: { whatsappFields: ['fotos', 'hack'] } } });
check('whatsappFields com campo inválido = 400', res.statusCode === 400);
res = await run({ method: 'PATCH', body: { c: TOKEN, patch: { whatsappFields: ['fotos', 'design_system'] } } });
check('whatsappFields válido = 200', res.statusCode === 200);

// Chave fora da whitelist é ignorada, não gravada.
await run({ method: 'PATCH', body: { c: TOKEN, patch: { brandName: 'X', status: 'submitted', access_token: 'roubado' } } });
check('PATCH ignora status', brief.status === 'draft', String(brief.status));
check('PATCH ignora access_token', brief.access_token === TOKEN, String(brief.access_token));

// ------------------------------------------------------- sign / finalize
res = await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'nao_existe', fileName: 'a.jpg', contentType: 'image/jpeg', size: 10 } });
check('sign com campo fora do enum = 400', res.statusCode === 400);

res = await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'fotos', fileName: 'a.pdf', contentType: 'application/pdf', size: 10 } });
check('sign com tipo não aceito = 400', res.statusCode === 400, JSON.stringify(res.payload));

res = await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'fotos', fileName: 'a.jpg', contentType: 'image/jpeg', size: 99 * 1024 * 1024 } });
check('sign acima do teto do campo = 413', res.statusCode === 413, JSON.stringify(res.payload));

res = await run({
  method: 'POST',
  body: {
    action: 'sign', c: TOKEN, field: 'brandbook',
    fileName: 'Manual da Marca — Versão Final.pdf',
    contentType: 'application/pdf', size: 2048,
    path: '../../outro/lugar',   // deve ser ignorado
  },
});
check('sign devolve 201', res.statusCode === 201, JSON.stringify(res.payload));
check('caminho é montado no servidor', res.payload.path.startsWith(`${BRIEF_ID}/brandbook/`), res.payload.path);
check('caminho ignora path do cliente', !res.payload.path.includes('outro/lugar'), res.payload.path);
check('caminho sem acento', !/[ãõçéúí—]/.test(res.payload.path), res.payload.path);
check('caminho mantém .pdf', res.payload.path.endsWith('.pdf'), res.payload.path);
check('original_name preserva acento', files[0].original_name === 'Manual da Marca — Versão Final.pdf', files[0].original_name);
check('uploadUrl aponta para o storage', res.payload.uploadUrl.startsWith('https://fake.supabase.co/storage/v1/object/upload/sign/'), res.payload.uploadUrl);

const fileId = res.payload.fileId;
res = await run({ method: 'POST', body: { action: 'finalize', c: TOKEN, fileId } });
check('finalize marca ready (200)', res.statusCode === 200, JSON.stringify(res.payload));
check('finalize grava o tamanho real do storage', files[0].size_bytes === 1024, String(files[0].size_bytes));
check('finalize deixa status ready', files[0].status === 'ready', String(files[0].status));

// Tamanho real acima do teto: apaga objeto e linha.
storageSize = 99 * 1024 * 1024;
res = await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'arquivos_md', fileName: 'tom.md', contentType: '', size: 10 } });
check('.md passa com content-type vazio', res.statusCode === 201, JSON.stringify(res.payload));
check('.md recebe content-type canônico', res.payload.contentType === 'text/markdown', res.payload.contentType);
const mdId = res.payload.fileId;
const antesDelete = calls.filter((c) => c.method === 'DELETE' && c.url.includes('/storage/v1/object/')).length;
res = await run({ method: 'POST', body: { action: 'finalize', c: TOKEN, fileId: mdId } });
check('finalize acima do teto real = 413', res.statusCode === 413, JSON.stringify(res.payload));
check('413 apaga o objeto no storage',
  calls.filter((c) => c.method === 'DELETE' && c.url.includes('/storage/v1/object/')).length > antesDelete);
storageSize = 1024;

// Teto de contagem por campo (brandbook: 2)
await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'brandbook', fileName: 'b.pdf', contentType: 'application/pdf', size: 10 } });
res = await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'brandbook', fileName: 'c.pdf', contentType: 'application/pdf', size: 10 } });
check('sign no maxCount do campo = 409', res.statusCode === 409, JSON.stringify(res.payload));

// ------------------------------------------------------- brief enviado
brief.status = 'submitted';
res = await run({ method: 'PATCH', body: { c: TOKEN, patch: { brandName: 'tarde demais' } } });
check('PATCH em briefing enviado = 409', res.statusCode === 409);
res = await run({ method: 'POST', body: { action: 'sign', c: TOKEN, field: 'fotos', fileName: 'a.jpg', contentType: 'image/jpeg', size: 10 } });
check('sign em briefing enviado = 409', res.statusCode === 409);
brief.status = 'draft';

// --------------------------------------------- regressão de env sujo
const supaCall = calls.find((c) => c.url.includes('/rest/v1/'));
check('Authorization sem quebra de linha',
  supaCall.headers.Authorization === 'Bearer service-key', JSON.stringify(supaCall.headers.Authorization));
check('URL sem espaço nem barra dupla',
  supaCall.url.startsWith('https://fake.supabase.co/rest/v1/'), supaCall.url);
check('OWNER_TOKEN sujo ainda autentica o dono',
  (await run({ method: 'GET', query: { owner: 'segredo-do-joao' } })).statusCode === 200);

// ------------------------------------------------------------- método
res = await run({ method: 'DELETE', body: {} });
check('DELETE = 405', res.statusCode === 405);
check('405 informa os métodos aceitos', res.headers.Allow === 'GET, POST, PATCH', String(res.headers.Allow));

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
