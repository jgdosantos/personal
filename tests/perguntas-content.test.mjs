import {
  BLOCOS, PERGUNTAS, TOTAL, semTags, splitMarcado, copy,
} from '../src/perguntas/content.js';

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + extra}`);
  if (!cond) failures++;
};

// 1. Estrutura dos blocos
check('são 7 blocos', BLOCOS.length === 7, String(BLOCOS.length));
const soma = BLOCOS.reduce((t, b) => t + b.qs.length, 0);
check('a soma das perguntas dos blocos é 48', soma === 48, String(soma));
check('PERGUNTAS tem 48 itens', PERGUNTAS.length === 48, String(PERGUNTAS.length));
check('TOTAL bate com PERGUNTAS.length', TOTAL === PERGUNTAS.length, `${TOTAL} vs ${PERGUNTAS.length}`);

check('todo bloco tem título', BLOCOS.every((b) => typeof b.t === 'string' && b.t.length > 0));
check('todo bloco tem subtítulo', BLOCOS.every((b) => typeof b.sub === 'string' && b.sub.length > 0));

const titulos = BLOCOS.map((b) => b.t).join(' | ');
check(
  'os 7 títulos de bloco estão na ordem do brief',
  titulos === 'Suas peças | Seus fornecedores | Preço | Como você vende hoje | O dia a dia | A cara da marca | Prazo e investimento',
  titulos,
);

// 2. A asserção mais importante do arquivo: a lista de ids, por extenso.
//    Um id trocado quebra a chave do localStorage e a identidade da linha na
//    planilha — e só apareceria meses depois, como linha órfã.
const IDS_ESPERADOS = [
  'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
  'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7',
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6',
  'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8',
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8',
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7',
  'g1', 'g2', 'g3', 'g4',
].join(',');
const idsReais = PERGUNTAS.map((p) => p.id).join(',');
check('a lista de ids é exatamente a do brief, na ordem', idsReais === IDS_ESPERADOS, idsReais);

// 3. Numeração contínua 1..48 atravessando os blocos
check('a primeira pergunta é n = 1', PERGUNTAS[0].n === 1, String(PERGUNTAS[0].n));
check('a última pergunta é n = 48', PERGUNTAS[47].n === 48, String(PERGUNTAS[47].n));
check(
  'a numeração é contínua, sem buraco',
  PERGUNTAS.every((p, i) => p.n === i + 1),
);
const b1 = PERGUNTAS.find((p) => p.id === 'b1');
check('o bloco 2 começa no 9 (b1.n === 9)', b1.n === 9, String(b1.n));
const c1 = PERGUNTAS.find((p) => p.id === 'c1');
check('o bloco 3 começa no 16 (c1.n === 16)', c1.n === 16, String(c1.n));
const g1 = PERGUNTAS.find((p) => p.id === 'g1');
check('o bloco 7 começa no 45 (g1.n === 45)', g1.n === 45, String(g1.n));

// 4. Forma de cada item
check(
  'todo item tem { id, n, bloco, texto, prioridade, dica }',
  PERGUNTAS.every((p) => (
    typeof p.id === 'string'
    && typeof p.n === 'number'
    && typeof p.bloco === 'string'
    && typeof p.texto === 'string'
    && typeof p.prioridade === 'boolean'
    && typeof p.dica === 'string'
  )),
);
check(
  'bloco guarda o TÍTULO do bloco, não o índice',
  PERGUNTAS[0].bloco === 'Suas peças' && b1.bloco === 'Seus fornecedores',
  `${PERGUNTAS[0].bloco} / ${b1.bloco}`,
);
check(
  'toda pergunta pertence a um título de bloco existente',
  PERGUNTAS.every((p) => BLOCOS.some((b) => b.t === p.bloco)),
);

// 5. Prioridade
const prioritarias = PERGUNTAS.filter((p) => p.prioridade);
check('são exatamente 18 perguntas prioritárias', prioritarias.length === 18, String(prioritarias.length));
check('a1 é prioritária', PERGUNTAS.find((p) => p.id === 'a1').prioridade === true);
check('a5 não é prioritária', PERGUNTAS.find((p) => p.id === 'a5').prioridade === false);

// 6. semTags — o que vai para a planilha não pode levar HTML
check(
  'semTags remove <em> e </em>',
  semTags('Quantas peças <em>diferentes</em> você tem à venda hoje?')
    === 'Quantas peças diferentes você tem à venda hoje?',
  semTags('Quantas peças <em>diferentes</em> você tem à venda hoje?'),
);
const comTag = PERGUNTAS.filter((p) => /[<>]/.test(semTags(p.texto)));
check('nenhuma pergunta passada por semTags contém < ou >', comTag.length === 0, comTag.map((p) => p.id).join(','));

// 7. splitMarcado
const partesA1 = splitMarcado(PERGUNTAS.find((p) => p.id === 'a1').texto);
check('splitMarcado de a1 devolve 3 partes', partesA1.length === 3, JSON.stringify(partesA1));
check(
  'a parte do meio de a1 é o itálico "diferentes"',
  partesA1[1] && partesA1[1].tipo === 'italico' && partesA1[1].texto === 'diferentes',
  JSON.stringify(partesA1[1]),
);
const partesNegrito = splitMarcado('Toque em **Enviar respostas** aqui');
check(
  'splitMarcado reconhece **negrito**',
  partesNegrito[1] && partesNegrito[1].tipo === 'negrito' && partesNegrito[1].texto === 'Enviar respostas',
  JSON.stringify(partesNegrito[1]),
);
const semMarcacao = splitMarcado('texto sem marcação');
check(
  'texto sem marcação devolve uma parte só, tipo normal',
  semMarcacao.length === 1 && semMarcacao[0].tipo === 'normal' && semMarcacao[0].texto === 'texto sem marcação',
  JSON.stringify(semMarcacao),
);
check(
  'remontar as partes reproduz o texto sem os delimitadores',
  splitMarcado(PERGUNTAS.find((p) => p.id === 'a1').texto).map((x) => x.texto).join('')
    === semTags(PERGUNTAS.find((p) => p.id === 'a1').texto),
);

// 8. Textos exatos que já passaram pelo olho do usuário
check(
  'a3.dica é literal',
  PERGUNTAS.find((p) => p.id === 'a3').dica === 'Pode ser em porcentagem ou em valor. Chute serve.',
  PERGUNTAS.find((p) => p.id === 'a3').dica,
);
check(
  "b5.dica mantém o apóstrofo reto de marca d'água",
  PERGUNTAS.find((p) => p.id === 'b5').dica.includes("marca d'água"),
  PERGUNTAS.find((p) => p.id === 'b5').dica,
);
check(
  'f2 mantém as aspas curvas do brief',
  PERGUNTAS.find((p) => p.id === 'f2').texto.includes('“queria que a minha parecesse com essa”'),
  PERGUNTAS.find((p) => p.id === 'f2').texto,
);
check(
  'f6 mantém as aspas curvas do brief',
  PERGUNTAS.find((p) => p.id === 'f6').texto.includes('“a cara”'),
  PERGUNTAS.find((p) => p.id === 'f6').texto,
);

// 9. Copy literal
check('sobretítulo literal', copy.sobretitulo === 'De Maria · joias em prata 925', copy.sobretitulo);
check('título literal', copy.titulo === 'Antes de montar a sua loja', copy.titulo);
check('a intro tem dois parágrafos', Array.isArray(copy.intro) && copy.intro.length === 2);
check('a intro começa chamando a Ligia pelo nome', copy.intro[0].startsWith('Ligia, para desenhar a loja online da De Maria'), copy.intro[0].slice(0, 40));
check(
  'o segundo parágrafo da intro é literal',
  copy.intro[1] === 'Nada aqui é pegadinha nem prova. Quanto mais real for a resposta, melhor a loja fica — e mais rápido a gente sai do papel.',
  copy.intro[1],
);
check('são quatro cartõezinhos', copy.cartoes.length === 4, String(copy.cartoes.length));
check(
  'os cartões estão na ordem do brief',
  copy.cartoes.map((c) => c.titulo).join(' | ') === 'Estimativa serve | Não sabe? Pula | As com ★ primeiro | Salva sozinho',
  copy.cartoes.map((c) => c.titulo).join(' | '),
);
check(
  'o cartão da prioridade cita a estrela ★, que a página precisa mesmo renderizar',
  copy.cartoes[2].titulo.includes('★'),
  copy.cartoes[2].titulo,
);
check(
  'privacidade bate caractere a caractere com o brief',
  copy.privacidade === 'Suas respostas ficam salvas neste aparelho enquanto você escreve. Ao toque em Enviar, elas vão para uma planilha privada do João — mais ninguém tem acesso.',
  copy.privacidade,
);
check('o bloco de fim cita **Enviar respostas** em negrito', copy.fim.includes('**Enviar respostas**'), copy.fim.slice(0, 60));
check('o bloco de fim menciona a opção de áudio', copy.fim.includes('responder por áudio'), copy.fim.slice(-80));
check('o bloco de enviado começa com "Recebido, obrigado!"', copy.fimEnviado.startsWith('Recebido, obrigado!'), copy.fimEnviado.slice(0, 40));
check('o bloco de enviado cita **Enviar de novo** em negrito', copy.fimEnviado.includes('**Enviar de novo**'));
check('os rótulos do botão cobrem os quatro estados',
  copy.botao.enviar === 'Enviar respostas'
  && copy.botao.reenviar === 'Enviar de novo'
  && copy.botao.enviando === 'Enviando…'
  && copy.botao.enviado === 'Enviado',
  JSON.stringify(copy.botao));
check('aviso de pendência literal', copy.avisoNaoEnviado === 'Você tem respostas novas para enviar', copy.avisoNaoEnviado);
check('o contador diz "12 de 48"', copy.contador(12) === '12 de 48', copy.contador(12));
check('o contador começa em "0 de 48"', copy.contador(0) === '0 de 48', copy.contador(0));
check('o fallback tem os dois botões do brief',
  copy.fallback.copiar === 'Copiar respostas' && copy.fallback.whatsapp === 'Mandar no WhatsApp',
  JSON.stringify(copy.fallback));
check('o fallback tem a mensagem curta dos 1400 caracteres',
  typeof copy.fallback.mensagemCurta === 'string' && copy.fallback.mensagemCurta.length > 0);

// 9b. A tela de confirmação NÃO pode ter uma segunda redação da promessa.
//     `telaEnviado.titulo` + `telaEnviado.texto` têm de reconstituir, palavra
//     por palavra, o `fimEnviado` literal do brief (sem a marcação de negrito).
//     Editar um e esquecer o outro é como a Ligia acabaria lendo duas versões
//     diferentes do que acontece depois do envio.
const semNegrito = (t) => t.replace(/\*\*/g, '');
check('a tela de confirmação reconstitui o fimEnviado do brief',
  `${copy.telaEnviado.titulo} ${copy.telaEnviado.texto}` === semNegrito(copy.fimEnviado),
  `${copy.telaEnviado.titulo} ${copy.telaEnviado.texto}`);
check('a tela de confirmação tem caminho de volta',
  copy.telaEnviado.voltar === 'Voltar às respostas', copy.telaEnviado.voltar);
check('o resumo da tela usa o total de 48',
  copy.telaEnviado.resumo(12) === '12 de 48 respondidas', copy.telaEnviado.resumo(12));

// 10. Sem emoji na interface — regra explícita do brief. A estrela ★ (U+2605) e
//     o ✓ (U+2713) são glifos tipográficos, não emoji, e ficam de fora da faixa.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{FE0F}\u{1F900}-\u{1F9FF}]/u;
const textoTodo = JSON.stringify(copy) + PERGUNTAS.map((p) => p.texto + p.dica).join('') + titulos;
check('não há emoji em nenhuma copy', !EMOJI.test(textoTodo));

console.log(failures === 0 ? '\nTudo certo no conteúdo das perguntas.' : `\n${failures} falha(s).`);
process.exit(failures === 0 ? 0 : 1);
