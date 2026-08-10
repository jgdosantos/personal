import {
  FIELDS, UPLOAD_FIELDS, WHATSAPP_FIELDS,
  isAllowed, canonicalContentType, safeStorageName, fieldState, formatBytes,
} from '../shared/briefFields.js';

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + extra}`);
  if (!cond) failures++;
};

// 1. Tipos aceitos por campo
check('foto jpeg entra em fotos', isAllowed('fotos', 'image/jpeg', 'a.jpg'));
check('pdf não entra em fotos', !isAllowed('fotos', 'application/pdf', 'a.pdf'));

// O browser manda content-type vazio para .md — casar por extensão salva o campo.
check('.md passa com content-type vazio', isAllowed('arquivos_md', '', 'tom-de-voz.md'));

// .ai, .psd e fontes chegam como octet-stream; exigir mime derrubaria upload legítimo.
check('.ai passa como octet-stream', isAllowed('arquivos', 'application/octet-stream', 'logo.ai'));

// Extensão desconhecida derruba mesmo com mime aceito: renomear não basta.
check('extensão desconhecida derruba com mime aceito',
  !isAllowed('brandbook', 'application/pdf', 'manual.exe'));

check('campo inexistente recusa', !isAllowed('nao_existe', 'image/jpeg', 'a.jpg'));
check('arquivo sem extensão recusa', !isAllowed('fotos', 'image/jpeg', 'IMG_1234'));

// 2. Higienização de nome — a armadilha do isValidKey do Storage
const acentuado = safeStorageName('Manual da Marca — Versão Final.pdf');
check('nome acentuado perde acento', !/[áàâãéêíóôõúçÁÉÍÓÚÇ]/.test(acentuado), acentuado);
check('nome acentuado perde espaço', !/\s/.test(acentuado), acentuado);
check('nome acentuado mantém .pdf', acentuado.endsWith('.pdf'), acentuado);
check('nome acentuado só tem caracteres válidos', /^[A-Za-z0-9._-]+$/.test(acentuado), acentuado);

const travessia = safeStorageName('../../etc/passwd');
check('travessia perde as barras', !travessia.includes('/'), travessia);
check('travessia não começa com ponto', !travessia.startsWith('.'), travessia);

const longo = safeStorageName('x'.repeat(400) + '.pdf');
check('nome longo é cortado', longo.length <= 71, String(longo.length));
check('nome longo mantém a extensão', longo.endsWith('.pdf'), longo.slice(-10));
check('corte acontece na base, não na extensão',
  longo.split('.')[0].length <= 60, String(longo.split('.')[0].length));

check('nome vazio vira arquivo', safeStorageName('') === 'arquivo', safeStorageName(''));
check('só pontos vira arquivo', safeStorageName('...') === 'arquivo', safeStorageName('...'));

// 3. Content-Type canônico
check('.md vira text/markdown',
  canonicalContentType('arquivos_md', 'tom.md') === 'text/markdown',
  canonicalContentType('arquivos_md', 'tom.md'));
check('.pdf do brandbook vira application/pdf',
  canonicalContentType('brandbook', 'manual.pdf') === 'application/pdf');
check('.ai vira postscript',
  canonicalContentType('arquivos', 'logo.ai') === 'application/postscript');

// 4. Estado derivado do campo
const pronto = [{ field: 'fotos', status: 'ready' }];
const pendente = [{ field: 'fotos', status: 'pending' }];
check('arquivo ready = recebido', fieldState('fotos', pronto, []) === 'recebido');
check('arquivo pending não conta como recebido',
  fieldState('fotos', pendente, []) === 'nao_enviado',
  fieldState('fotos', pendente, []));
check('campo em whatsappFields = enviado_whatsapp',
  fieldState('fotos', [], ['fotos']) === 'enviado_whatsapp');
check('arquivo recebido vence a marca de whatsapp',
  fieldState('fotos', pronto, ['fotos']) === 'recebido');
check('sem nada = nao_enviado', fieldState('fotos', [], []) === 'nao_enviado');
check('design_system aceita estado por whatsapp',
  fieldState('design_system', [], ['design_system']) === 'enviado_whatsapp');

// 5. Coerência entre as listas
check('toda chave de FIELDS está em UPLOAD_FIELDS',
  Object.keys(FIELDS).every((k) => UPLOAD_FIELDS.includes(k)),
  Object.keys(FIELDS).join(','));
check('UPLOAD_FIELDS e FIELDS têm o mesmo tamanho',
  UPLOAD_FIELDS.length === Object.keys(FIELDS).length);
check('WHATSAPP_FIELDS = UPLOAD_FIELDS + design_system',
  WHATSAPP_FIELDS.length === UPLOAD_FIELDS.length + 1
  && WHATSAPP_FIELDS.includes('design_system')
  && UPLOAD_FIELDS.every((f) => WHATSAPP_FIELDS.includes(f)));
check('todo campo declara pergunta, mime, ext e tetos',
  Object.values(FIELDS).every((s) => s.question && s.mime.length && s.ext.length
    && s.maxCount > 0 && s.maxBytes > 0 && s.layout));

// 6. Formatação
check('formatBytes usa vírgula decimal', formatBytes(13 * 1024 * 1024) === '13 MB', formatBytes(13 * 1024 * 1024));
check('formatBytes arredonda com uma casa', formatBytes(1.5 * 1024 * 1024) === '1,5 MB', formatBytes(1.5 * 1024 * 1024));
check('formatBytes em bytes crus', formatBytes(512) === '512 B', formatBytes(512));

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
