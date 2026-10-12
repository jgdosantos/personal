// Apps Script da pesquisa /pesquisa-airbnb. Cola-se DE DENTRO da planilha
// (Extensões -> Apps Script). Passo a passo em docs/pesquisa-airbnb.md.
//
// Só o valor de SEGREDO muda: tem de ser byte a byte igual ao
// PESQUISA_AIRBNB_SECRET da Vercel.
//
// SALVAR NÃO ATUALIZA O ENDPOINT. Toda edição exige Implantar -> Nova
// implantação (ou Gerenciar implantações -> editar -> Nova versão).
//
// O apóstrofo: valor que começa com = + - @ o Sheets lê como fórmula. Uma
// pessoa mal-intencionada poderia mandar =HYPERLINK(...) no campo Nome, e um
// WhatsApp digitado como +55 11 9... também viraria fórmula. Com o apóstrofo na
// frente o Sheets guarda como texto (o apóstrofo só aparece na barra de
// fórmula, não na célula).

const SEGREDO = 'cole-aqui-o-mesmo-valor-do-PESQUISA_AIRBNB_SECRET';
const ABA = 'Respostas';
const CABECALHO = ['Quando', 'Nome', 'Contato', 'Imóveis', 'Interesse', 'Quanto pagaria'];

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
    let sh = ss.getSheetByName(ABA);
    if (!sh) {
      sh = ss.insertSheet(ABA);
      sh.appendRow(CABECALHO);
      sh.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }

    sh.appendRow([
      new Date(),
      seguro(body.nome),
      seguro(body.contato),
      seguro(body.imoveis),
      seguro(body.interesse),
      seguro(body.pagaria),
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function seguro(v) {
  const s = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(
    ContentService.MimeType.JSON
  );
}
