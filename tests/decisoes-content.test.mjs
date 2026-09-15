// Trava de integridade do conteúdo de /decisoes-ligia.
//
// Mesmo formato do tests/perguntas-content.test.mjs: script .mjs puro, sem
// node:test, porque é isso que o `npm run test:api` sabe rodar.
//
// O que este arquivo protege não é código, é COPY DE CLIENTE. O texto da
// página é transcrição literal de marketplace/loja/decisoes-ligia-TEXTO.md, e
// uma "melhoria" de redação feita meses depois não quebraria nada visível —
// só faria a página deixar de ser o que foi combinado com ela.

import {
  SECOES, PERGUNTAS, TOTAL, RESPONDENTE, ASPAS,
  semTags, splitMarcado, respostaDe, estaRespondida, copy,
} from '../src/decisoes/content.js';

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + extra}`);
  if (!cond) failures++;
};

const q = (id) => PERGUNTAS.find((p) => p.id === id);

// ---------------------------------------------------------------- 1. seções
check('são 6 seções', SECOES.length === 6, String(SECOES.length));
const rotulos = SECOES.map((s) => s.rotulo);
check(
  'as 5 primeiras seções trazem "Parte N de 5"',
  rotulos.slice(0, 5).join(' | ') === 'Parte 1 de 5 | Parte 2 de 5 | Parte 3 de 5 | Parte 4 de 5 | Parte 5 de 5',
  rotulos.join(' | '),
);
check('a 6ª seção (o Anexo A) não tem rótulo de parte', rotulos[5] === null, String(rotulos[5]));
check('toda seção tem título', SECOES.every((s) => typeof s.t === 'string' && s.t.length > 0));
check('toda seção tem subtítulo', SECOES.every((s) => typeof s.sub === 'string' && s.sub.length > 0));
const titulosSecao = SECOES.map((s) => s.t).join(' | ');
check(
  'os 6 títulos de seção estão na ordem do documento',
  titulosSecao === 'Como a cliente paga | Entrega | Se a cliente quiser devolver | Quais peças entram no site | Depois que abrir | Os três números que faltam',
  titulosSecao,
);
check(
  'só a Parte 3 tem bloco de aviso',
  SECOES.filter((s) => s.aviso).length === 1 && Array.isArray(SECOES[2].aviso),
  SECOES.map((s) => Boolean(s.aviso)).join(','),
);

// -------------------------------------------------------------- 2. as 16 e os ids
const soma = SECOES.reduce((t, s) => t + s.qs.length, 0);
check('a soma das perguntas das seções é 16', soma === 16, String(soma));
check('PERGUNTAS tem 16 itens', PERGUNTAS.length === 16, String(PERGUNTAS.length));
check('TOTAL bate com PERGUNTAS.length', TOTAL === PERGUNTAS.length, `${TOTAL} vs ${PERGUNTAS.length}`);

// A asserção mais importante do arquivo: um id trocado quebra a chave do
// localStorage e a identidade da linha na planilha, e só apareceria meses
// depois, como linha órfã.
const IDS_ESPERADOS = [
  'parcelas', 'juros', 'pix',
  'fretegratis', 'entregalocal',
  'trocaaro', 'trocaunica', 'garantia', 'fretevolta',
  'quaispecas', 'fotos',
  'anuncio', 'esgotada',
  'tamanho_lista', 'pedidos_mes', 'cenario',
].join(',');
const idsReais = PERGUNTAS.map((p) => p.id).join(',');
check('a lista de ids é exatamente a do documento, na ordem', idsReais === IDS_ESPERADOS, idsReais);

// D-01: o Anexo B fica de fora. Só existe se o Pix manual for usado, e o
// documento é explícito em não mostrar na página por padrão.
check(
  'prazo_pendente (Anexo B) não existe em lugar nenhum',
  !JSON.stringify(SECOES).includes('prazo_pendente'),
);

// ------------------------------------------------------------- 3. numeração
check('a primeira pergunta é n = 1', PERGUNTAS[0].n === 1, String(PERGUNTAS[0].n));
check('a última pergunta é n = 16', PERGUNTAS[15].n === 16, String(PERGUNTAS[15].n));
check('a numeração é contínua, sem buraco', PERGUNTAS.every((p, i) => p.n === i + 1));
check('a Parte 2 começa no 4 (fretegratis.n === 4)', q('fretegratis').n === 4, String(q('fretegratis').n));
check('a Parte 3 começa no 6 (trocaaro.n === 6)', q('trocaaro').n === 6, String(q('trocaaro').n));
check('o Anexo A começa no 14 (tamanho_lista.n === 14)', q('tamanho_lista').n === 14, String(q('tamanho_lista').n));
check(
  'bloco guarda o TÍTULO da seção, não o índice',
  PERGUNTAS[0].bloco === 'Como a cliente paga' && q('cenario').bloco === 'Os três números que faltam',
  `${PERGUNTAS[0].bloco} / ${q('cenario').bloco}`,
);
check(
  'toda pergunta pertence a um título de seção existente',
  PERGUNTAS.every((p) => SECOES.some((s) => s.t === p.bloco)),
);

// ----------------------------------------------------------------- 4. tipos
check('entregalocal é texto aberto', q('entregalocal').tipo === 'texto', q('entregalocal').tipo);
check('tamanho_lista é número', q('tamanho_lista').tipo === 'numero', q('tamanho_lista').tipo);
check('pedidos_mes é número', q('pedidos_mes').tipo === 'numero', q('pedidos_mes').tipo);
const unicas = PERGUNTAS.filter((p) => p.tipo === 'unica');
check('as outras 13 são escolha única', unicas.length === 13, String(unicas.length));
check(
  'não existe tipo fora de unica/texto/numero',
  PERGUNTAS.every((p) => ['unica', 'texto', 'numero'].includes(p.tipo)),
);
check('o campo de texto traz o placeholder do documento',
  q('entregalocal').exemplo === 'Ex.: entrego no centro e nos bairros perto, sem cobrar. Mais longe que isso prefiro mandar pelos Correios.',
  q('entregalocal').exemplo);
check('os dois campos numéricos têm sufixo',
  q('tamanho_lista').sufixo === 'pessoas' && q('pedidos_mes').sufixo === 'pedidos por mês',
  `${q('tamanho_lista').sufixo} / ${q('pedidos_mes').sufixo}`);

// ---------------------------------------------------------------- 5. travas
// A coluna `Trava` do Anexo C é a especificação do formulário e vence as
// linhas `urgência:` das perguntas 1 e 2, que dizem "precisa antes de abrir"
// mas aparecem como "—" na tabela (D-05).
const TRAVAS_ESPERADAS = 'trocaaro,trocaunica,garantia,fretevolta,quaispecas,fotos,cenario';
const travas = PERGUNTAS.filter((p) => p.trava).map((p) => p.id).join(',');
check('são exatamente 7 travas, e são as do Anexo C', travas === TRAVAS_ESPERADAS, travas);
check('trava é sempre booleano', PERGUNTAS.every((p) => typeof p.trava === 'boolean'));
check('parcelas NÃO trava (Anexo C vence a linha de urgência)', q('parcelas').trava === false);

// ----------------------------------------------------------------- 6. opções
const comOutro = PERGUNTAS.filter((p) => (p.opcoes || []).some((o) => o.outro));
const OUTRO_ESPERADO = 'parcelas,juros,pix,fretegratis,trocaaro,trocaunica,garantia,quaispecas,fotos';
check(
  'as 9 perguntas de "campo aberto: sim" têm opção Outro',
  comOutro.map((p) => p.id).join(',') === OUTRO_ESPERADO,
  comOutro.map((p) => p.id).join(','),
);
check(
  'a opção Outro é sempre a ÚLTIMA e é única',
  comOutro.every((p) => {
    const marcadas = p.opcoes.filter((o) => o.outro);
    return marcadas.length === 1 && p.opcoes[p.opcoes.length - 1].outro === true;
  }),
);
check(
  'perguntas sem campo aberto não têm opção Outro',
  ['fretevolta', 'anuncio', 'esgotada', 'cenario'].every((id) => !q(id).opcoes.some((o) => o.outro)),
);
check('toda escolha única tem ao menos 3 opções', unicas.every((p) => p.opcoes.length >= 3), unicas.map((p) => `${p.id}:${p.opcoes.length}`).join(' '));
check('nenhum rótulo de opção é vazio', unicas.every((p) => p.opcoes.every((o) => typeof o.rotulo === 'string' && o.rotulo.trim().length > 0)));
check(
  'nenhuma pergunta repete rótulo de opção',
  unicas.every((p) => new Set(p.opcoes.map((o) => o.rotulo)).size === p.opcoes.length),
);
check('texto e número não têm opções', ['entregalocal', 'tamanho_lista', 'pedidos_mes'].every((id) => q(id).opcoes.length === 0));

// --------------------------------------------------------------- 7. tabelas
const comTabela = PERGUNTAS.filter((p) => p.tabela);
check('duas perguntas têm tabela', comTabela.map((p) => p.id).join(',') === 'parcelas,cenario', comTabela.map((p) => p.id).join(','));
check('a tabela da parcela mínima tem 2 colunas e 4 linhas',
  q('parcelas').tabela.colunas.length === 2 && q('parcelas').tabela.linhas.length === 4,
  JSON.stringify(q('parcelas').tabela.colunas));
check('a tabela da parcela mínima começa em "Compra de R$ 300 → 2 vezes"',
  q('parcelas').tabela.linhas[0].join(' → ') === 'Compra de R$ 300 → 2 vezes',
  q('parcelas').tabela.linhas[0].join(' → '));
check('a tabela do A3 tem 3 colunas e os 3 cenários',
  q('cenario').tabela.colunas.length === 3
  && q('cenario').tabela.linhas.map((l) => l[0]).join(',') === 'Enxuto,Recomendado,Acelerado',
  q('cenario').tabela.linhas.map((l) => l[0]).join(','));
check('os valores dos 3 cenários são os do documento',
  q('cenario').tabela.linhas.map((l) => l[1]).join(',') === 'R$ 10.000,R$ 24.800,R$ 46.500',
  q('cenario').tabela.linhas.map((l) => l[1]).join(','));
check('toda linha de tabela tem o mesmo número de células das colunas',
  comTabela.every((p) => p.tabela.linhas.every((l) => l.length === p.tabela.colunas.length)));

// ------------------------------------------------- 8. respostaDe / estaRespondida
const parcelas = q('parcelas');
check('opção marcada devolve o rótulo',
  respostaDe(parcelas, { opcao: 'Parcela mínima de R$ 150', texto: '' }) === 'Parcela mínima de R$ 150',
  respostaDe(parcelas, { opcao: 'Parcela mínima de R$ 150', texto: '' }));
check('opção Outro com texto vira "Outro: ..."',
  respostaDe(parcelas, { opcao: 'Outro valor, ou quero mudar o máximo de 10 vezes', texto: ' R$ 250 ' }) === 'Outro: R$ 250',
  respostaDe(parcelas, { opcao: 'Outro valor, ou quero mudar o máximo de 10 vezes', texto: ' R$ 250 ' }));
check('opção Outro sem texto não conta como resposta',
  respostaDe(parcelas, { opcao: 'Outro valor, ou quero mudar o máximo de 10 vezes', texto: '   ' }) === '');
check('nada marcado devolve string vazia', respostaDe(parcelas, undefined) === '' && respostaDe(parcelas, {}) === '');
check('rótulo inexistente (dado velho) devolve string vazia',
  respostaDe(parcelas, { opcao: 'Parcela mínima de R$ 999', texto: '' }) === '');
check('campo de texto devolve o próprio texto, com trim',
  respostaDe(q('entregalocal'), { texto: '  entrego no centro  ' }) === 'entrego no centro');
check('campo numérico devolve o próprio número como texto',
  respostaDe(q('tamanho_lista'), { texto: '400' }) === '400');
check('estaRespondida concorda com respostaDe',
  PERGUNTAS.every((p) => {
    const casos = [undefined, {}, { texto: '  ' }, { opcao: p.opcoes[0] && p.opcoes[0].rotulo, texto: '' }, { texto: 'x' }];
    return casos.every((v) => estaRespondida(p, v) === Boolean(respostaDe(p, v)));
  }));
check('nenhuma pergunta nasce respondida', PERGUNTAS.every((p) => !estaRespondida(p, undefined)));

// ------------------------------------------------- 9. o payload cabe no servidor
// Os cortes do api/perguntas-ligia.js. Passar deles não dá erro: a planilha
// recebe a frase truncada no meio, em silêncio.
check('todo id cabe em 20 caracteres', PERGUNTAS.every((p) => p.id.length <= 20), PERGUNTAS.map((p) => `${p.id}:${p.id.length}`).join(' '));
check('todo bloco cabe em 120 caracteres', PERGUNTAS.every((p) => p.bloco.length <= 120));
check('toda pergunta cabe em 400 caracteres', PERGUNTAS.every((p) => semTags(p.titulo).length <= 400));
check('RESPONDENTE cabe em 40 caracteres', RESPONDENTE.length <= 40, String(RESPONDENTE.length));
check('RESPONDENTE é Decisoes-Ligia (D-03)', RESPONDENTE === 'Decisoes-Ligia', RESPONDENTE);
check(
  'RESPONDENTE não tem caractere que o Apps Script remove do nome da aba',
  !/[:\\/?*[\]]/.test(RESPONDENTE),
  RESPONDENTE,
);

// -------------------------------------------------------- 10. semTags / splitMarcado
check('semTags remove <em> e </em>', semTags('um <em>teste</em> aqui') === 'um teste aqui');
check('semTags remove os asteriscos de negrito', semTags('**A conta.** Você tem') === 'A conta. Você tem');
check('nada que vai para a planilha leva < ou >', PERGUNTAS.every((p) => !/[<>]/.test(semTags(p.titulo))));
const partes = splitMarcado('**A conta.** Você tem mil modelos');
check('splitMarcado reconhece **negrito**',
  partes[0] && partes[0].tipo === 'negrito' && partes[0].texto === 'A conta.',
  JSON.stringify(partes[0]));
const doisNegritos = splitMarcado('**Duas opções:** a página some, ou fica escrito **vendida**.');
check('splitMarcado reconhece dois negritos no mesmo parágrafo',
  doisNegritos.filter((x) => x.tipo === 'negrito').length === 2,
  JSON.stringify(doisNegritos.map((x) => x.tipo)));
check('texto sem marcação devolve uma parte só, tipo normal',
  splitMarcado('sem marcação').length === 1 && splitMarcado('sem marcação')[0].tipo === 'normal');
check('remontar as partes reproduz o texto sem os delimitadores',
  PERGUNTAS.every((p) => p.corpo.every((par) => splitMarcado(par).map((x) => x.texto).join('') === semTags(par))));

// ------------------------------------------------------------ 11. copy literal
check('sobretítulo literal', copy.sobretitulo === 'De Maria · joias em prata 925', copy.sobretitulo);
check('o título da abertura é literal', copy.titulo === 'Ligia, agora são as suas escolhas', copy.titulo);
check('a abertura tem três parágrafos', copy.intro.length === 3, String(copy.intro.length));

// A abertura foi encurtada a pedido do João em 15/09/2026. As asserções deixaram
// de fixar cada parágrafo por índice e passaram a cobrar as PROMESSAS: é o que o
// teste realmente precisa proteger, e prender o texto ao índice só faz o teste
// quebrar de novo no próximo corte, sem ter pegado nada de errado.
const abertura = copy.intro.join('\n');

check(
  'a abertura abre dizendo que estas são as escolhas dela',
  copy.intro[0].startsWith('Você já respondeu tudo o que eu precisava saber sobre a sua loja.')
    && copy.intro[0].includes('**só você pode decidir**'),
  copy.intro[0],
);
// A ÚNICA divergência autorizada em relação ao documento: 13 perguntas + 3
// números. Prometer 13 numa página de 16 campos seria a página mentindo para
// ela na primeira tela.
check(
  'a abertura conta os três números do Anexo A (única divergência autorizada)',
  abertura.includes('São 13 perguntas, mais três números no fim.'),
  abertura,
);
check('a abertura promete que fica salvo',
  abertura.includes('Não precisa responder tudo de uma vez — o que você marcar fica salvo.'),
  abertura);
check(
  'a abertura explica a marca de trava com as MESMAS palavras da pílula',
  abertura.includes(`**${copy.marcaTrava}**`),
  abertura,
);
check('a marca de trava é "precisa antes de abrir"', copy.marcaTrava === 'precisa antes de abrir', copy.marcaTrava);
check('a abertura oferece a saída de conversar por telefone',
  abertura.includes('marca "quero conversar sobre isso" e a gente resolve por telefone.'),
  abertura);

check('o encerramento se chama "Terminou?"', copy.encerramento.titulo === 'Terminou?', copy.encerramento.titulo);
check('o encerramento tem dois parágrafos', copy.encerramento.paragrafos.length === 2);
check('o primeiro parágrafo do encerramento é literal',
  copy.encerramento.paragrafos[0] === 'É isso. Nenhuma dessas respostas é definitiva — parcelamento, desconto e frete a gente muda em cinco minutos depois que a loja estiver rodando e você vir o que acontece de verdade.',
  copy.encerramento.paragrafos[0]);
check('o encerramento aponta troca e quais peças entram',
  copy.encerramento.paragrafos[1] === 'As que mais importam agora são as de **troca** e as de **quais peças entram**: são elas que deixam a gente começar a fotografar e escrever as páginas da loja.',
  copy.encerramento.paragrafos[1]);

const aviso = SECOES[2].aviso;
check('o aviso dos 7 dias tem três parágrafos', aviso.length === 3, String(aviso.length));
check(
  'o aviso começa em "Uma coisa que não é escolha nossa nem sua."',
  aviso[0].startsWith('**Uma coisa que não é escolha nossa nem sua.** Na venda pela internet, a lei dá **7 dias**'),
  aviso[0].slice(0, 90),
);
check('o aviso explica que é uma peça por mês', aviso[1].includes('**uma peça voltando por mês**'), aviso[1].slice(0, 60));
check('o aviso termina dizendo que o resto é escolha', aviso[2] === 'O que dá para escolher é tudo que vem **além** disso. É o que eu pergunto aqui embaixo.', aviso[2]);

check('o subtítulo do Anexo A diz que não são decisões',
  SECOES[5].sub === 'Estas **não são decisões**, são informações que só você tem.',
  SECOES[5].sub);

check(
  'privacidade bate caractere a caractere com a página irmã',
  copy.privacidade === 'Suas respostas ficam salvas neste aparelho enquanto você escreve. Ao toque em Enviar, elas vão para uma planilha privada do João — mais ninguém tem acesso.',
  copy.privacidade,
);
check('os rótulos do botão cobrem os quatro estados',
  copy.botao.enviar === 'Enviar respostas'
  && copy.botao.reenviar === 'Enviar de novo'
  && copy.botao.enviando === 'Enviando…'
  && copy.botao.enviado === 'Enviado',
  JSON.stringify(copy.botao));
check('aviso de pendência literal', copy.avisoNaoEnviado === 'Você tem respostas novas para enviar', copy.avisoNaoEnviado);
check('o contador diz "3 de 16"', copy.contador(3) === '3 de 16', copy.contador(3));
check('o contador de seção diz "2 de 3"', copy.contadorSecao(2, 3) === '2 de 3', copy.contadorSecao(2, 3));
check('a revisão se chama "O que você respondeu"', copy.revisao.titulo === 'O que você respondeu', copy.revisao.titulo);
check('a tela de enviado tem título, texto, resumo e volta',
  copy.telaEnviado.titulo === 'Recebido, obrigado!'
  && copy.telaEnviado.texto.length > 0
  && copy.telaEnviado.resumo(12) === '12 de 16 respondidas'
  && copy.telaEnviado.voltar === 'Voltar às respostas',
  JSON.stringify(copy.telaEnviado.resumo(12)));
check('o fallback tem os dois caminhos de saída',
  copy.fallback.copiar === 'Copiar respostas' && copy.fallback.whatsapp === 'Mandar no WhatsApp');
check('o fallback tem a mensagem curta dos 1400 caracteres', copy.fallback.mensagemCurta.length > 0);

// ------------------------------------------------------ 12. as citações dela
// Entram como ela falou, inclusive as irregularidades. É a voz dela; corrigir
// "5 k" ou "700,00" seria reescrever o cliente.
check(
  'a citação do parcelamento está literal, com o "5 k" intacto',
  q('parcelas').voceMeDisse === 'O parcelamento depende do valor da compra e do poder aquisitivo da cliente. O máximo que faço em 10x, mais aí seria uma venda de 5 k por exemplo.',
  q('parcelas').voceMeDisse,
);
check('a citação do frete mantém a vírgula decimal de "700,00"',
  q('fretegratis').voceMeDisse === 'Correios frete grátis acima de 700,00',
  q('fretegratis').voceMeDisse);
check('a citação da entrega em mãos é literal',
  q('entregalocal').voceMeDisse === 'aqui na cidade eu mesmo entrego',
  q('entregalocal').voceMeDisse);
check('a citação do Pix é literal', q('pix').voceMeDisse === 'Dou desconto no pagamento via pix', q('pix').voceMeDisse);
check('só o Pix tem frase depois da citação',
  PERGUNTAS.filter((p) => p.voceMeDisseFim).map((p) => p.id).join(',') === 'pix'
  && q('pix').voceMeDisseFim === '— só não me disse quanto.',
  q('pix').voceMeDisseFim);
check('são quatro "Você me disse"',
  PERGUNTAS.filter((p) => p.voceMeDisse).map((p) => p.id).join(',') === 'parcelas,pix,fretegratis,entregalocal',
  PERGUNTAS.filter((p) => p.voceMeDisse).map((p) => p.id).join(','));
// As aspas da citação são do componente, não do dado: o documento delimita as
// falas com aspas retas de markdown, que são marcação e não copy.
check('o par de aspas da citação é curvo', ASPAS[0] === '“' && ASPAS[1] === '”', ASPAS.join(''));
check('nenhuma citação carrega as próprias aspas',
  PERGUNTAS.every((p) => !p.voceMeDisse || !/["“”]/.test(p.voceMeDisse)));
check('o rótulo da citação é "Você me disse:"', copy.voceMeDisse === 'Você me disse:', copy.voceMeDisse);

// ------------------------------------------------------------- 13. sem emoji
// Mesma regra e mesma regex do teste irmão. O 🔴 do Anexo C é notação de
// especificação e virou o booleano `trava` — nunca um glifo na tela.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{FE0F}\u{1F900}-\u{1F9FF}]/u;
const textoTodo = JSON.stringify(copy) + JSON.stringify(SECOES);
check('não há emoji em nenhuma copy', !EMOJI.test(textoTodo));
check('o 🔴 do Anexo C não vazou para o conteúdo', !textoTodo.includes('\u{1F534}'));

console.log(failures === 0 ? '\nTudo certo no conteúdo das decisões.' : `\n${failures} falha(s).`);
process.exit(failures === 0 ? 0 : 1);
