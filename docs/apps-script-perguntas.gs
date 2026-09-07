const SEGREDO = 'cole-aqui-o-mesmo-valor-do-SHEETS_SECRET';

function doGet() {
  return json({ ok: true, ping: true });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (!SEGREDO || body.segredo !== SEGREDO) {
      return json({ ok: false, erro: 'nao autorizado' });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nome =
      String(body.respondente || 'anonimo').replace(/[:\\\/?*\[\]]/g, '').slice(0, 40) ||
      'anonimo';
    gravarRespostas(ss, nome, body);
    gravarHistorico(ss, nome, body);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function gravarRespostas(ss, nome, body) {
  const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
  sh.clear();
  const linhas = [['Bloco', '#', 'Pergunta', '★', 'Resposta']];
  body.respostas
    .slice()
    .sort(function (a, b) { return (a.n || 0) - (b.n || 0); })
    .forEach(function (r) {
      linhas.push([r.bloco, r.n, r.pergunta, r.prioridade ? '★' : '', r.resposta]);
    });
  sh.getRange(1, 1, linhas.length, 5).setValues(linhas);
  sh.getRange(1, 1, 1, 5).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 150);
  sh.setColumnWidth(2, 40);
  sh.setColumnWidth(3, 420);
  sh.setColumnWidth(4, 40);
  sh.setColumnWidth(5, 520);
  sh.getRange(1, 1, linhas.length, 5).setVerticalAlignment('top');
  sh.getRange(1, 3, linhas.length, 3).setWrap(true);
}

function gravarHistorico(ss, nome, body) {
  let sh = ss.getSheetByName('Historico');
  if (!sh) {
    sh = ss.insertSheet('Historico');
    sh.appendRow(['Quando', 'Respondente', 'Sessao', 'Preenchidas', 'JSON']);
    sh.getRange(1, 1, 1, 5).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  sh.appendRow([
    new Date(),
    nome,
    body.sessao || '',
    (body.preenchidas || 0) + '/' + (body.total || 0),
    JSON.stringify(body.respostas)
  ]);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(
    ContentService.MimeType.JSON
  );
}
