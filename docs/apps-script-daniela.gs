// Bloco para o Apps Script da planilha das perguntas
// (a da Ligia). Substitui o doPost atual. Não inclui a
// linha const SEGREDO nem gravarRespostas,
// gravarHistorico e json, que continuam como estão.
//
// Respostas da Dra. Daniela (/daniela-morais) vão para
// a aba "Respostas" da planilha própria dela: uma linha
// por envio, uma coluna por pergunta.

const DANIELA_ID =
  '1Z7JMEjRd_xUY__8ybJ7Kh_zKlctnjlyZiN4ZqW9KOEM';
const DANIELA_ABA = 'Respostas';
const DANIELA_PERGUNTAS = [
  '1. Em uma frase: por que você escolheu cuidar de ' +
    'pele e cabelo?',
  '2. Onde e em que ano você se formou em Medicina?',
  '3. Onde fez a residência ou o título de ' +
    'especialista em Dermatologia, e qual é o seu ' +
    'número de RQE?',
  '4. Onde você fez a sua formação em Tricologia?',
  '5. De quais sociedades médicas você é membro hoje?',
  '6. Quais são os horários do consultório e em que ' +
    'horário a equipe responde o WhatsApp?',
  '7. Você atende algum convênio? Se não, a paciente ' +
    'recebe recibo para pedir reembolso?',
  '8. Quanto tempo dura a primeira consulta, e o ' +
    'retorno está incluído no valor?',
  '9. O procedimento pode ser feito no mesmo dia da ' +
    'consulta, ou sempre fica para outra data?',
  '10. Para a consulta de tricologia, a paciente ' +
    'precisa vir com o cabelo lavado (ou sem lavar)?'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (!SEGREDO || body.segredo !== SEGREDO) {
      return json({ ok: false, erro: 'nao autorizado' });
    }
    if (String(body.respondente || '') ===
        'Daniela Morais') {
      gravarDaniela(body);
      return json({ ok: true });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nome =
      String(body.respondente || 'anonimo')
        .replace(/[:\\\/?*\[\]]/g, '')
        .slice(0, 40) || 'anonimo';
    gravarRespostas(ss, nome, body);
    gravarHistorico(ss, nome, body);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function gravarDaniela(body) {
  const ss = SpreadsheetApp.openById(DANIELA_ID);
  const sh = ss.getSheetByName(DANIELA_ABA) ||
    ss.insertSheet(DANIELA_ABA);
  const cab = ['Data/hora', 'Sessão']
    .concat(DANIELA_PERGUNTAS);

  // Recria o cabeçalho se a aba estiver vazia ou se
  // a linha 1 não bater com as colunas esperadas.
  const atual = sh.getLastRow() > 0
    ? sh.getRange(1, 1, 1, cab.length).getValues()[0]
    : [];
  const ok = cab.every(function (t, i) {
    return String(atual[i] || '') === t;
  });
  if (!ok) {
    if (sh.getLastRow() === 0) {
      sh.appendRow(cab);
    } else {
      sh.getRange(1, 1, 1, cab.length).setValues([cab]);
    }
  }
  sh.getRange(1, 1, 1, cab.length).setFontWeight('bold');
  sh.setFrozenRows(1);

  // Coluna escolhida pelo número (n ou id dmN), não
  // pela ordem do array. Sem resposta = célula vazia.
  const linha = [new Date(), String(body.sessao || '')];
  for (let i = 0; i < DANIELA_PERGUNTAS.length; i++) {
    linha.push('');
  }
  (body.respostas || []).forEach(function (r) {
    let n = Number(r && r.n);
    if (!(n >= 1 && n <= DANIELA_PERGUNTAS.length)) {
      const m = /^dm(\d+)$/.exec(String(r && r.id));
      n = m ? Number(m[1]) : 0;
    }
    if (n >= 1 && n <= DANIELA_PERGUNTAS.length) {
      linha[n + 1] = textoSeguro(r.resposta);
    }
  });
  sh.appendRow(linha);
}

// Texto que começa com = + - @ viraria fórmula na
// planilha. O apóstrofo força texto puro.
function textoSeguro(v) {
  const t = String(v == null ? '' : v);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}
