import { FIELDS, isAllowed, formatBytes } from '../../shared/briefFields.js';

// Sem React aqui de propósito: a mecânica de upload é testável isolada e não
// deve depender de ciclo de render.

const MAX_NETWORK_RETRIES = 2;

export class UploadError extends Error {
  constructor(message, { retryable = false } = {}) {
    super(message);
    this.retryable = retryable;
  }
}

const post = async (body, signal) => {
  const res = await fetch('/api/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 4xx é decisão do servidor sobre este arquivo — repetir daria o mesmo
    // resultado. 5xx e rede podem ser transitórios.
    throw new UploadError(data.error || `HTTP ${res.status}`, { retryable: res.status >= 500 });
  }
  return data;
};

/**
 * PUT com XMLHttpRequest, não fetch.
 *
 * Não é preferência: `fetch` não expõe progresso de upload em nenhum browser
 * hoje — só `xhr.upload.onprogress` dá a barra. Num brandbook de 40 MB, subir
 * sem barra é indistinguível de travar, e o cliente fecha a aba.
 */
const putWithProgress = ({ url, file, contentType, onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    // O Content-Type vem da API, nunca de file.type: o browser manda vazio
    // para .md e octet-stream para .ai, e o Storage grava o que receber.
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(`Storage recusou (${xhr.status})`, { retryable: xhr.status >= 500 }));
    };
    // Erro de rede e CORS bloqueado chegam aqui os dois, sem detalhe: o browser
    // não conta qual foi, por design.
    xhr.onerror = () => reject(new UploadError('Falha de rede no envio', { retryable: true }));
    xhr.onabort = () => reject(new UploadError('Envio cancelado'));

    if (signal) {
      if (signal.aborted) { xhr.abort(); return; }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    // Corpo é o File cru: o browser preenche o Content-Length, que é o que o
    // Storage usa para aplicar o teto de 50 MB do bucket.
    xhr.send(file);
  });

/** Valida no browser antes de gastar uma ida ao servidor. Conforto, não segurança. */
export const precheck = (field, file) => {
  const spec = FIELDS[field];
  if (!spec) return 'campo desconhecido';
  if (!isAllowed(field, file.type, file.name)) {
    return `formato não aceito aqui — mande ${spec.ext.slice(0, 3).join(', ')}…`;
  }
  if (file.size > spec.maxBytes) {
    return `arquivo de ${formatBytes(file.size)}; o limite deste campo é ${formatBytes(spec.maxBytes)}`;
  }
  return '';
};

/**
 * Sobe um arquivo: assina, manda direto para o Storage, confirma.
 * `fileId` opcional reaproveita uma linha já criada (retry do mesmo caminho).
 */
export const uploadFile = async ({ token, field, file, fileId, onProgress, signal }) => {
  const local = precheck(field, file);
  if (local) throw new UploadError(local);

  let attempt = 0;
  let currentId = fileId;

  for (;;) {
    try {
      const signed = await post({
        action: 'sign',
        c: token,
        ...(currentId
          ? { fileId: currentId }
          : { field, fileName: file.name, contentType: file.type, size: file.size }),
      }, signal);

      // Guarda o id ANTES do PUT: se a rede cair no meio, o retry reassina o
      // mesmo caminho em vez de criar uma linha órfã e duplicar a contagem.
      currentId = signed.fileId;

      await putWithProgress({
        url: signed.uploadUrl,
        file,
        contentType: signed.contentType,
        onProgress,
        signal,
      });

      const done = await post({ action: 'finalize', c: token, fileId: currentId }, signal);
      return done.file;
    } catch (err) {
      attempt += 1;
      if (!err.retryable || attempt > MAX_NETWORK_RETRIES || (signal && signal.aborted)) {
        err.fileId = currentId; // permite o botão "tentar de novo" na interface
        throw err;
      }
      await new Promise((r) => { setTimeout(r, 400 * attempt); });
    }
  }
};

/**
 * Fila com concorrência limitada. Largar 20 fotos de uma vez abriria 20
 * conexões simultâneas e travaria o celular — e o Storage responderia pior,
 * não melhor.
 */
export const runQueue = async (jobs, concurrency = 3) => {
  const queue = [...jobs];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      await job();
    }
  });
  await Promise.all(workers);
};
