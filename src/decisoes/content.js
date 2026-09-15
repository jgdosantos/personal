// Conteúdo da página /decisoes-ligia — as 16 escolhas, as 6 seções e a copy.
//
// Dados puros, sem JSX: o @vitejs/plugin-react só transforma arquivos .jsx,
// então este arquivo devolve estrutura de dados e quem monta o JSX é o
// componente. Mesma divisão de src/perguntas/content.js.
//
// TUDO que está entre aspas aqui é TRANSCRIÇÃO LITERAL de
// marketplace/loja/decisoes-ligia-TEXTO.md, que é copy de cliente escrita na
// voz do João para a Ligia. Não é resumo, não é reescrita, não é "melhoria".
// As citações dela entram como estão, inclusive as irregularidades ("5 k" com
// espaço, "700,00" com vírgula decimal): é a voz dela, não erro de digitação.
//
// Os 16 ids são a identidade da resposta no localStorage e a identidade da
// linha na planilha. Trocar um id órfã a resposta dela, e isso só apareceria
// meses depois. Não renomear, não reordenar.
//
// Zero emoji na interface. O 🔴 do Anexo C do documento é notação de
// especificação — vira o booleano `trava`, nunca um glifo na tela.

// As aspas da citação moram aqui, e não dentro do texto, por dois motivos: o
// documento traz as citações delimitadas por aspas retas de markdown (que são
// marcação, não copy), e o componente precisa de um par curvo só para todas as
// citações. Um dono só evita a página misturar " e “ na mesma tela.
export const ASPAS = ['“', '”'];

// Nome do respondente. Vira DUAS coisas: a chave do localStorage desta página e
// o nome da aba na planilha — o Apps Script cria uma aba por respondente, então
// é este valor que separa as decisões do briefing já respondido.
// Sem os caracteres que o Apps Script remove do nome da aba (: \ / ? * [ ]).
export const RESPONDENTE = 'Decisoes-Ligia';

// A marca visível das perguntas que travam o lançamento. É a MESMA string que
// a abertura usa para explicar a marca — um texto só, para a legenda do topo e
// a pílula da pergunta serem visivelmente a mesma coisa.
const MARCA_TRAVA = 'precisa antes de abrir';

/**
 * As 6 seções da página, na ordem em que ela lê.
 *
 * `rotulo` é o contador "Parte X de 5" do Anexo C; a 6ª seção (o Anexo A) não
 * tem rótulo, porque são 5 partes visíveis + os anexos.
 * `aviso` existe só na Parte 3 — o bloco dos 7 dias, que ela precisa ler ANTES
 * das perguntas de devolução, senão responde sem saber o que já é lei.
 */
export const SECOES = [
  {
    rotulo: 'Parte 1 de 5',
    t: 'Como a cliente paga',
    sub: 'A parte que mais muda quanto você ganha em cada venda.',
    aviso: null,
    qs: [
      {
        id: 'parcelas',
        tipo: 'unica',
        titulo: 'Em quantas vezes a cliente pode parcelar?',
        trava: false,
        voceMeDisse: 'O parcelamento depende do valor da compra e do poder aquisitivo da cliente. O máximo que faço em 10x, mais aí seria uma venda de 5 k por exemplo.',
        voceMeDisseFim: null,
        corpo: [
          '**Por que eu preciso de um número.** No site não vai ter você olhando cada caso e decidindo. A regra precisa ser igual para todo mundo, o tempo todo.',
          'O jeito mais simples é escolher **um valor mínimo de parcela**. Aí o resto sai sozinho, sem você pensar em nada:',
        ],
        tabela: {
          colunas: ['Se a parcela mínima for R$ 150', 'A cliente vê'],
          linhas: [
            ['Compra de R$ 300', '2 vezes'],
            ['Compra de R$ 750', '5 vezes'],
            ['Compra de R$ 1.500', '10 vezes'],
            ['Compra de R$ 4.000', '10× de R$ 400'],
          ],
        },
        opcoes: [
          { rotulo: 'Parcela mínima de R$ 100' },
          { rotulo: 'Parcela mínima de R$ 150' },
          { rotulo: 'Parcela mínima de R$ 200' },
          { rotulo: 'Não quero parcelar, só à vista' },
          { rotulo: 'Outro valor, ou quero mudar o máximo de 10 vezes', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'juros',
        tipo: 'unica',
        titulo: 'O parcelamento é sem juros ou com juros?',
        trava: false,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Sem juros:** quem paga a taxa do cartão é a loja. Numa peça de R$ 2.000 parcelada em 10 vezes, isso fica entre R$ 160 e R$ 280 saindo do seu lucro.',
          '**Com juros:** a cliente vê um total maior e a taxa sai do bolso dela. Protege o seu lucro, mas costuma vender menos — principalmente nas peças caras, que são justamente as que precisam de parcelamento.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'Sem juros — eu absorvo a taxa' },
          { rotulo: 'Com juros — a cliente paga' },
          { rotulo: 'Sem juros até um certo valor, depois com juros' },
          { rotulo: 'Outra ideia', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'pix',
        tipo: 'unica',
        titulo: 'Desconto no Pix — de quanto?',
        trava: false,
        voceMeDisse: 'Dou desconto no pagamento via pix',
        // Única pergunta em que a frase do documento CONTINUA depois de fechar
        // as aspas. Jogar esse trecho num parágrafo de `corpo` separaria o
        // comentário da citação que ele comenta, e a piada ("só não me disse
        // quanto") depende de estar colada na fala dela.
        voceMeDisseFim: '— só não me disse quanto.',
        corpo: [
          '**A lógica.** O Pix é bem mais barato para você do que o cartão parcelado. Por isso o desconto costuma valer a pena: você deixa de ganhar um pouco de quem já pagaria à vista, e economiza bastante de quem iria parcelar.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: '3%' },
          { rotulo: '5%' },
          { rotulo: '10%' },
          { rotulo: 'Não quero dar desconto no site' },
          { rotulo: 'Outro valor', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
    ],
  },
  {
    rotulo: 'Parte 2 de 5',
    t: 'Entrega',
    sub: 'O que aparece para a cliente na hora de fechar a compra.',
    aviso: null,
    qs: [
      {
        id: 'fretegratis',
        tipo: 'unica',
        titulo: 'Frete grátis a partir de quanto?',
        trava: false,
        voceMeDisse: 'Correios frete grátis acima de 700,00',
        voceMeDisseFim: null,
        corpo: [
          '**O que pesa.** A maior parte das suas vendas fica bem abaixo de R$ 700. Quando o frete grátis está longe demais, a cliente nem tenta chegar lá — ele não serve para nada.',
          'Quando está mais perto do que ela já ia gastar, acontece o contrário: ela costuma colocar mais uma peça para alcançar.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'Manter em R$ 700' },
          { rotulo: 'A partir de R$ 399' },
          { rotulo: 'A partir de R$ 299' },
          { rotulo: 'Não quero oferecer frete grátis' },
          { rotulo: 'Outro valor', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'entregalocal',
        tipo: 'texto',
        titulo: 'Entrega em mãos na sua cidade',
        trava: false,
        voceMeDisse: 'aqui na cidade eu mesmo entrego',
        voceMeDisseFim: null,
        corpo: [
          '**O que dá para fazer.** Isso pode virar uma opção na hora de fechar a compra — a cliente escolhe sozinha e não precisa te chamar para combinar.',
          'Para isso eu preciso saber duas coisas: **até onde você entrega** (bairros, ou quantos quilômetros) e se **cobra alguma coisa**.',
        ],
        tabela: null,
        opcoes: [],
        exemplo: 'Ex.: entrego no centro e nos bairros perto, sem cobrar. Mais longe que isso prefiro mandar pelos Correios.',
        sufixo: null,
      },
    ],
  },
  {
    rotulo: 'Parte 3 de 5',
    t: 'Se a cliente quiser devolver',
    sub: 'É a parte que mais muda em relação ao que você faz hoje.',
    // O único aviso de parte da página. Vem ANTES das perguntas: as quatro
    // escolhas desta parte só fazem sentido depois de ela saber que os 7 dias
    // não estão em disputa.
    aviso: [
      '**Uma coisa que não é escolha nossa nem sua.** Na venda pela internet, a lei dá **7 dias** para a cliente desistir da compra e devolver — mesmo sem defeito nenhum, mesmo se ela só mudou de ideia. Vale para qualquer loja online do Brasil, da maior à menor, e não dá para tirar do site.',
      'Na prática é bem menos do que parece. Com uns 30 pedidos no mês, é mais ou menos **uma peça voltando por mês**. E como é peça única, ela volta para a gaveta e para o site no mesmo dia — não é prejuízo, é uma volta.',
      'O que dá para escolher é tudo que vem **além** disso. É o que eu pergunto aqui embaixo.',
    ],
    qs: [
      {
        id: 'trocaaro',
        tipo: 'unica',
        titulo: 'Se a cliente errar o aro do anel, o que você oferece?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Por que eu pergunto.** Aro errado é o motivo número um de devolução de anel na internet.',
          'Nas peças que você repõe, é só trocar por outro número do mesmo modelo — fácil e barato.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'Troco o número sem cobrar nada' },
          { rotulo: 'Troco, mas ela paga o frete' },
          { rotulo: 'Não troco — só os 7 dias da lei' },
          { rotulo: 'Outra ideia', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'trocaunica',
        tipo: 'unica',
        titulo: 'E na peça única, quando o aro não serve?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**A diferença.** Aqui não existe outro número: é aquela peça ou nenhuma. Seu fornecedor entrega em 10 dias, então dá para encomendar o tamanho certo — se você quiser oferecer isso.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'Troco por outra peça de valor igual ou maior' },
          { rotulo: 'Encomendo o número certo, chega em 10 dias' },
          { rotulo: 'Devolvo o dinheiro e pronto' },
          { rotulo: 'Outra ideia', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'garantia',
        tipo: 'unica',
        titulo: 'Garantia contra defeito — quanto tempo?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Por que dá para oferecer.** Você me disse que o fornecedor troca peça com defeito. Então dá para oferecer garantia sem risco nenhum para o seu bolso.',
          'Garantia é **só contra defeito de fabricação**. Não cobre risco de uso nem a prata escurecer, que é natural — isso fica escrito na página, bem claro.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: '12 meses' },
          { rotulo: '6 meses' },
          { rotulo: '3 meses' },
          { rotulo: 'Não quero oferecer garantia' },
          { rotulo: 'Outro prazo', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'fretevolta',
        tipo: 'unica',
        titulo: 'Quando a cliente desiste nos 7 dias, quem paga o frete de volta?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**O que costuma valer.** No caso de desistência, o entendimento mais comum é que o custo é da loja. Vale confirmar com o contador quando ele entrar.',
          'Mas me diz o que você **prefere** que esteja escrito, que a gente ajusta se precisar.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'A loja paga' },
          { rotulo: 'A cliente paga' },
          { rotulo: 'Depende do motivo' },
          { rotulo: 'Não sei, quero conversar sobre isso' },
        ],
        exemplo: null,
        sufixo: null,
      },
    ],
  },
  {
    rotulo: 'Parte 4 de 5',
    t: 'Quais peças entram no site',
    sub: 'Aqui só você pode decidir — é curadoria, não é técnica.',
    aviso: null,
    qs: [
      {
        id: 'quaispecas',
        tipo: 'unica',
        titulo: 'Quais peças entram primeiro?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**A conta.** Você tem por volta de mil modelos. Cada um precisa de foto e de cadastro, e mil peças dá uns 6 a 9 meses de trabalho. Esperar isso para abrir não faz sentido.',
          'Com umas **200 peças** já dá para abrir uma loja bonita — e o resto vai entrando de quinze em quinze dias, virando novidade toda quinzena.',
          'As 100 que você repõe sempre eu já contaria como certas: não acabam, dá para fazer anúncio com elas e a foto se paga em várias vendas. **Sobram umas 100 vagas** — e é sobre elas que eu pergunto.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'As mais caras e bonitas, para impressionar' },
          { rotulo: 'As mais baratas, para quem ainda não me conhece' },
          { rotulo: 'Metade de cada' },
          { rotulo: 'Quero escolher peça por peça, com calma' },
          { rotulo: 'Outra ideia', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'fotos',
        tipo: 'unica',
        titulo: 'A partir de que preço uma peça merece sessão de foto completa?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Por que existe um corte.** Foto custa tempo, e em peça única ela vende uma vez só. Numa peça de R$ 150 você ganha uns R$ 90 — cinco fotos caprichadas custariam mais do que ela dá de lucro.',
          'Numa peça de R$ 2.000, vale cada foto: é ela que sustenta o preço.',
          'Então a ideia é peça cara ganhar sessão completa e peça mais barata ganhar o essencial. **Só preciso saber onde você põe o corte.**',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'A partir de R$ 500' },
          { rotulo: 'A partir de R$ 800' },
          { rotulo: 'A partir de R$ 1.000' },
          { rotulo: 'Quero caprichar em todas, mesmo demorando mais' },
          { rotulo: 'Outro valor', outro: true },
        ],
        exemplo: null,
        sufixo: null,
      },
    ],
  },
  {
    rotulo: 'Parte 5 de 5',
    t: 'Depois que abrir',
    sub: 'Não trava nada agora, mas é melhor combinar antes de acontecer.',
    aviso: null,
    qs: [
      {
        id: 'anuncio',
        tipo: 'unica',
        titulo: 'Pode fazer anúncio pago com peça única?',
        trava: false,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**O que é.** Anúncio pago é pagar para a sua peça aparecer para quem ainda não te conhece.',
          '**O problema com peça única:** ela vende, e o anúncio continua levando gente para uma página sem produto. Você paga por visita que não vira nada.',
        ],
        tabela: null,
        opcoes: [
          { rotulo: 'Só com as peças que eu reponho' },
          { rotulo: 'Pode com as duas — eu aviso quando vender' },
          { rotulo: 'Prefiro decidir isso depois' },
        ],
        exemplo: null,
        sufixo: null,
      },
      {
        id: 'esgotada',
        tipo: 'unica',
        titulo: 'Quando a peça vende, o que acontece com a página dela?',
        trava: false,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Duas opções:** a página some do site, ou fica no ar escrito **vendida**.',
          'Deixar no ar traz gente do Google que acaba olhando o resto da loja. Por outro lado, tem quem ache ruim ver uma peça que não pode mais comprar.',
        ],
        tabela: null,
        opcoes: [
          // Aspas retas de propósito: é assim que está escrito no documento, e
          // a regra de transcrição literal vale inclusive quando a tipografia
          // fica irregular. As curvas da página são só das citações dela.
          { rotulo: 'Fica no ar, escrito "vendida"' },
          { rotulo: 'Some do site' },
          { rotulo: 'Tanto faz, escolhe você' },
        ],
        exemplo: null,
        sufixo: null,
      },
    ],
  },
  {
    // Sem rótulo de parte: são 5 partes visíveis + os anexos.
    rotulo: null,
    t: 'Os três números que faltam',
    // O documento continua com "Se couber na mesma página, é bom perguntar
    // junto" — recado para quem monta a página, não para ela. Fica de fora.
    sub: 'Estas **não são decisões**, são informações que só você tem.',
    aviso: null,
    qs: [
      {
        id: 'tamanho_lista',
        tipo: 'numero',
        titulo: 'Quantas pessoas tem a sua lista de WhatsApp?',
        trava: false,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Por que importa mais do que parece.** A meta de R$ 10.000 no primeiro mês não sai de gente nova chegando sozinha. O Instagram traz uma parte, o anúncio traz outra — e falta um pedaço grande, que vem justamente de quem já te conhece e está no seu WhatsApp.',
          'Se a lista tiver 400 contatos, a meta fecha. Se tiver 100, a meta realista é outra — e é melhor saber disso antes, não depois.',
          '**Como descobrir:** contar. Leva uns quinze minutos.',
        ],
        tabela: null,
        opcoes: [],
        exemplo: null,
        sufixo: 'pessoas',
      },
      {
        id: 'pedidos_mes',
        tipo: 'numero',
        titulo: 'Quantos pedidos você faz por mês hoje?',
        trava: false,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [
          '**Por quê.** Você me disse a meta, mas não o que já acontece hoje. Sem isso eu não sei se a loja é crescimento ou se é o mesmo volume mudando de lugar — e isso muda o que eu prometo para você.',
          '**Como descobrir:** média dos últimos 3 meses, no Jueri ou no caderno.',
        ],
        tabela: null,
        opcoes: [],
        exemplo: null,
        sufixo: 'pedidos por mês',
      },
      {
        id: 'cenario',
        tipo: 'unica',
        titulo: 'Qual cenário de investimento?',
        trava: true,
        voceMeDisse: null,
        voceMeDisseFim: null,
        corpo: [],
        tabela: {
          colunas: ['Cenário', 'Valor', 'O que muda'],
          linhas: [
            ['Enxuto', 'R$ 10.000', 'Tudo interno. A vitrine sai no mesmo padrão das peças de R$ 90'],
            ['Recomendado', 'R$ 24.800', '60 peças de vitrine fotografadas por profissional'],
            ['Acelerado', 'R$ 46.500', 'Catálogo completo mais rápido, mídia triplicada'],
          ],
        },
        opcoes: [
          { rotulo: 'Enxuto' },
          { rotulo: 'Recomendado' },
          { rotulo: 'Acelerado' },
          { rotulo: 'Quero conversar antes de escolher' },
        ],
        exemplo: null,
        sufixo: null,
      },
    ],
  },
];

// Constante literal, não SECOES.reduce(...): o contador "N de 16" que ela lê na
// barra do rodapé não pode passar a mentir se alguém mexer nos dados sem
// querer. O teste afirma que os dois batem.
export const TOTAL = 16;

// Achatamento de SECOES em lista linear. `n` é contínuo de 1 a 16 ATRAVESSANDO
// as seções (a Parte 2 começa no 4). `bloco` guarda o título da seção de
// origem, não o índice, porque é ele que vai no payload da API e vira a
// primeira coluna da planilha.
export const PERGUNTAS = SECOES.reduce((lista, secao) => {
  secao.qs.forEach((pergunta) => {
    lista.push({ ...pergunta, n: lista.length + 1, bloco: secao.t });
  });
  return lista;
}, []);

// Remove as tags de ênfase e os asteriscos de negrito. É o helper que monta o
// campo `pergunta` do payload: ninguém quer ler "<em>" numa célula do Sheets.
//
// DUPLICADO de perguntas/content.js de propósito, não importado: aquele arquivo
// está congelado com as 48 perguntas do briefing, e importar dele arrastaria
// todas elas para o bundle desta página.
export const semTags = (texto) => String(texto)
  .replace(/<\/?em>/g, '')
  .replace(/\*\*/g, '');

/**
 * Quebra um texto marcado em pedaços classificados, para o componente montar
 * JSX sem dangerouslySetInnerHTML.
 *
 * Também duplicado, pelo mesmo motivo do semTags.
 *
 * Devolve [{ tipo: 'normal' | 'italico' | 'negrito', texto }].
 */
export const splitMarcado = (texto) => String(texto)
  .split(/(<em>.*?<\/em>|\*\*.*?\*\*)/g)
  .filter((parte) => parte !== '')
  .map((parte) => {
    if (parte.startsWith('<em>') && parte.endsWith('</em>')) {
      return { tipo: 'italico', texto: parte.slice(4, -5) };
    }
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      return { tipo: 'negrito', texto: parte.slice(2, -2) };
    }
    return { tipo: 'normal', texto: parte };
  });

/**
 * A string única que vai no campo `resposta` do payload e na linha da planilha.
 *
 * `valor` é sempre { opcao, texto } — a opção marcada guarda o RÓTULO, não o
 * índice: índice quebra em silêncio se alguém reordenar as opções, e rótulo
 * salvo no localStorage ainda é legível se precisarmos depurar no aparelho.
 *
 * Quando a marcada é a opção "Outro", o prefixo `Outro: ` entra na string para
 * a célula do Sheets dizer, sozinha, que ela escreveu em vez de escolher — sem
 * ele, "3%" digitado à mão e "3%" marcado na lista ficariam indistinguíveis.
 *
 * "Outro" marcado com o campo vazio devolve string vazia: meia resposta não
 * conta como resposta, senão o contador diria 16 de 16 com um campo em branco.
 */
export const respostaDe = (pergunta, valor) => {
  const bruto = valor && typeof valor === 'object' ? valor : {};
  const texto = typeof bruto.texto === 'string' ? bruto.texto.trim() : '';

  if (pergunta.tipo === 'texto' || pergunta.tipo === 'numero') return texto;

  const marcada = (pergunta.opcoes || []).find((o) => o.rotulo === bruto.opcao);
  if (!marcada) return '';
  if (marcada.outro) return texto ? `Outro: ${texto}` : '';
  return marcada.rotulo;
};

// Uma definição só de "respondida", usada pelo ✓ do campo, pelo contador do
// rodapé e pela revisão do fim. Três lugares divergindo aqui seria ela lendo
// "16 de 16" com campo vazio.
export const estaRespondida = (pergunta, valor) => Boolean(respostaDe(pergunta, valor));

// Toda a copy da página. A que descreve as escolhas é literal do
// decisoes-ligia-TEXTO.md; a de mecânica (botões, fallback, tela de enviado) vem
// da página irmã /perguntas-ligia, porque o documento não trata dela e duas
// redações da mesma promessa começam a divergir na primeira edição.
export const copy = {
  sobretitulo: 'De Maria · joias em prata 925',
  titulo: 'Ligia, agora são as suas escolhas',
  intro: [
    'Você já respondeu tudo o que eu precisava saber sobre a sua loja. Agora tem um outro tipo de pergunta — são as coisas que **só você pode decidir**, porque mudam quanto você ganha em cada venda e o que você vai prometer para as suas clientes.',
    // ÚNICA divergência autorizada do documento. O original diz "São 13
    // perguntas.", contando só as Partes 1–5; a página tem 16 campos, porque o
    // Anexo A entrou junto. Prometer 13 e mostrar 16 é a página mentindo para
    // ela logo na abertura.
    'São 13 perguntas, mais três números no fim. A maioria é de marcar uma opção. Se nenhuma servir, tem sempre um espaço para escrever do seu jeito.',
    'Não precisa responder tudo de uma vez — o que você marcar fica salvo.',
    // É esta frase que explica a pílula das perguntas travadas. O negrito aqui
    // e o texto da pílula são a MESMA string (MARCA_TRAVA).
    `Algumas estão marcadas com **${MARCA_TRAVA}**: são as que seguram o lançamento da loja. As outras dá para responder com calma.`,
    'Se bater dúvida em alguma, marca "quero conversar sobre isso" e a gente resolve por telefone.',
  ],
  marcaTrava: MARCA_TRAVA,
  revisao: {
    titulo: 'O que você respondeu',
  },
  encerramento: {
    titulo: 'Terminou?',
    paragrafos: [
      'É isso. Nenhuma dessas respostas é definitiva — parcelamento, desconto e frete a gente muda em cinco minutos depois que a loja estiver rodando e você vir o que acontece de verdade.',
      'As que mais importam agora são as de **troca** e as de **quais peças entram**: são elas que deixam a gente começar a fotografar e escrever as páginas da loja.',
    ],
  },
  voceMeDisse: 'Você me disse:',
  // Este texto precisa continuar VERDADEIRO. É por isso que a rota da API não
  // coleta IP, user-agent, geolocalização nem analytics.
  privacidade:
    'Suas respostas ficam salvas neste aparelho enquanto você escreve. Ao toque em Enviar, elas vão para uma planilha privada do João — mais ninguém tem acesso.',
  botao: {
    enviar: 'Enviar respostas',
    reenviar: 'Enviar de novo',
    enviando: 'Enviando…',
    enviado: 'Enviado',
  },
  avisoNaoEnviado: 'Você tem respostas novas para enviar',
  contador: (preenchidas) => `${preenchidas} de ${TOTAL}`,
  // Contador por seção. A barra do rodapé diz onde ela está nas 16; este diz
  // onde ela está NESTA parte — no celular a página é longa, e "falta 1 daqui"
  // move muito mais que "faltam 9 no total".
  contadorSecao: (preenchidas, total) => `${preenchidas} de ${total}`,
  telaEnviado: {
    titulo: 'Recebido, obrigado!',
    texto: 'Já está tudo salvo do meu lado. Se quiser mudar ou completar alguma escolha depois, volte nesta mesma página e toque em Enviar de novo — a versão nova substitui a anterior.',
    resumo: (preenchidas) => `${preenchidas} de ${TOTAL} respondidas`,
    voltar: 'Voltar às respostas',
  },
  fallback: {
    titulo: 'Não consegui enviar agora',
    texto: 'Nada do que você escolheu se perdeu. Copie as respostas ou mande no WhatsApp — depois é só tentar enviar de novo.',
    copiar: 'Copiar respostas',
    whatsapp: 'Mandar no WhatsApp',
    copiado: 'Copiado',
    // Usada quando o texto passa de 1400 caracteres: o WhatsApp abre só com
    // esta frase e o texto inteiro vai para o clipboard.
    mensagemCurta: 'Oi! Respondi as escolhas da loja. Já copiei tudo aqui no celular — vou colar na próxima mensagem.',
  },
};
