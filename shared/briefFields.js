// ============================================================================
// ESPECIFICAÇÃO DOS CAMPOS DO BRIEFING — fonte única
// ============================================================================
// Mora fora de src/ e fora de api/ de propósito. A Vercel só transforma em
// rota o que está em api/, e o Vite importa daqui sem configuração nenhuma.
// Regra de campo duplicada entre front e back diverge em uma semana; aqui as
// duas pontas leem o mesmo arquivo.
//
// ESM puro: sem import, sem dependência, sem API de browser nem de Node.

// Ordem de exibição no formulário. "arquivos" fica por último de propósito:
// é o slot "o que mais você tiver".
export const UPLOAD_FIELDS = ['fotos', 'brandbook', 'arquivos_md', 'arquivos'];

// design_system entra aqui mas NÃO em FIELDS: é link, não upload. A escapatória
// por WhatsApp vale para ele também — o cliente pode não ter o link à mão.
export const WHATSAPP_FIELDS = [...UPLOAD_FIELDS, 'design_system'];

// Teto do briefing inteiro. O teto por arquivo não segura alguém subindo 40
// fotos de 10 MB sem perceber.
export const BRIEF_MAX_BYTES = 300 * 1024 * 1024;

const MB = 1024 * 1024;

// Cada campo abre com uma PERGUNTA, não com um rótulo. É o que impede a tela
// de parecer quatro seletores de arquivo clonados.
export const FIELDS = {
  fotos: {
    label: 'Fotos',
    question: 'Que fotos você já tem da marca?',
    help: 'Produto, equipe, espaço, bastidores. Pode mandar tudo — a seleção eu faço depois.',
    mime: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    ext: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
    canonicalType: { heic: 'image/heic', heif: 'image/heif', jpg: 'image/jpeg' },
    maxCount: 20,
    maxBytes: 10 * MB,
    // Muitos arquivos pequenos, e o cliente precisa VER o que já subiu.
    layout: 'grid',
  },

  brandbook: {
    label: 'Manual da marca',
    question: 'Tem um manual da marca?',
    help: 'Aquele PDF com logo, cores e tipografia. Se não tiver, tudo bem — a maioria não tem.',
    mime: ['application/pdf'],
    ext: ['pdf'],
    canonicalType: {},
    maxCount: 2,
    maxBytes: 50 * MB,
    // É O documento: um arquivo grande, em posição de honra.
    layout: 'hero',
  },

  arquivos_md: {
    label: 'Textos e tom de voz',
    question: 'Já tem textos escritos?',
    help: 'Arquivos .md ou .txt com tom de voz, textos de página, o que já foi escrito.',
    mime: ['text/markdown', 'text/plain', 'text/x-markdown'],
    ext: ['md', 'mdx', 'txt'],
    // O browser manda content-type vazio para .md; sem isto o Storage grava
    // o arquivo como application/octet-stream e ninguém consegue pré-visualizar.
    canonicalType: { md: 'text/markdown', mdx: 'text/markdown', txt: 'text/plain' },
    maxCount: 10,
    maxBytes: 1 * MB,
    // São conteúdo, não ativo visual: miniatura não diz nada, o nome diz.
    layout: 'list',
  },

  arquivos: {
    label: 'Outros arquivos',
    question: 'O que mais você tem da marca?',
    help: 'Logo em vetor, fontes, apresentações, contratos. Qualquer coisa que ajude.',
    mime: [
      'application/pdf', 'application/zip', 'application/x-zip-compressed',
      'application/postscript', 'image/vnd.adobe.photoshop', 'image/svg+xml',
      'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    ext: [
      'pdf', 'zip', 'ai', 'psd', 'eps', 'svg',
      'ttf', 'otf', 'woff', 'woff2', 'docx', 'pptx',
    ],
    canonicalType: {
      ai: 'application/postscript', psd: 'image/vnd.adobe.photoshop',
      eps: 'application/postscript', svg: 'image/svg+xml',
      ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
      zip: 'application/zip',
    },
    maxCount: 15,
    maxBytes: 25 * MB,
    layout: 'list',
  },
};

// Só o nome do arquivo, sem nenhum componente de diretório. Faz a travessia de
// caminho ser impossível por construção, em vez de por filtro.
const basenameOf = (name) => String(name || '').split(/[\\/]/).pop() || '';

export const extensionOf = (name) => {
  const base = basenameOf(name);
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot >= base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
};

/**
 * Aceita pelo MIME **ou** pela extensão, mas extensão desconhecida sempre
 * derruba.
 *
 * O motivo de não exigir MIME: o browser manda `''` para `.md` e
 * `application/octet-stream` para `.ai`, `.psd` e fontes. Exigir MIME
 * derrubaria upload legítimo. O motivo de ainda exigir extensão: aceitar MIME
 * sem olhar o nome deixaria passar qualquer coisa renomeada.
 *
 * Nada disto é segurança — é conforto. Tipo declarado é palpite do cliente; o
 * que realmente segura é o teto do bucket e o caminho preso ao token.
 */
export const isAllowed = (field, contentType, fileName) => {
  const spec = FIELDS[field];
  if (!spec) return false;

  const ext = extensionOf(fileName);
  const extOk = Boolean(ext) && spec.ext.includes(ext);
  if (!extOk) return false;

  const mimeOk = Boolean(contentType) && spec.mime.includes(contentType);
  return mimeOk || extOk;
};

/** O Content-Type que o PUT deve declarar. Nunca o palpite do browser. */
export const canonicalContentType = (field, fileName) => {
  const spec = FIELDS[field];
  if (!spec) return 'application/octet-stream';
  const ext = extensionOf(fileName);
  if (spec.canonicalType[ext]) return spec.canonicalType[ext];
  const guess = spec.mime[0];
  return guess || 'application/octet-stream';
};

/**
 * Nome utilizável como folha do caminho no Storage.
 *
 * Armadilha real: o `isValidKey` do Storage usa `\w` sem flag unicode, ou seja
 * `[A-Za-z0-9_]`. "Manual da Marca — Versão Final.pdf" seria rejeitado com
 * InvalidKey, e é exatamente o nome que um cliente brasileiro manda.
 *
 * A extensão é separada ANTES do corte — senão o corte come o `.pdf`.
 * O nome original, com acento e espaço, vive em brief_files.original_name.
 */
export const safeStorageName = (fileName) => {
  const base = basenameOf(fileName);
  const dot = base.lastIndexOf('.');
  const hasExt = dot > 0 && dot < base.length - 1;

  const clean = (value, max) => value
    .normalize('NFD')
    // Marcas combinantes em escape explícito: o NFD separa "ã" em "a" + til,
    // e o til é um caractere invisível no editor — literal aqui seria frágil.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, max);

  const stem = clean(hasExt ? base.slice(0, dot) : base, 60) || 'arquivo';
  const ext = hasExt ? clean(base.slice(dot + 1), 10) : '';

  return ext ? `${stem}.${ext}` : stem;
};

/**
 * Estado de um campo, derivado num lugar só. Usado pelo formulário, pelo
 * e-mail, pela planilha e pela tela de revisão — se cada um calculasse por si,
 * a planilha diria "pendente" enquanto a tela diria "recebido".
 */
export const fieldState = (field, files = [], whatsappFields = []) => {
  const ready = (files || []).filter(
    (f) => f && f.field === field && f.status === 'ready',
  ).length;
  if (ready > 0) return 'recebido';
  if ((whatsappFields || []).includes(field)) return 'enviado_whatsapp';
  return 'nao_enviado';
};

/** "12,4 MB" — vírgula decimal, que é como se lê em português. */
export const formatBytes = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = n / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${String(rounded).replace('.', ',')} ${units[unit]}`;
};
