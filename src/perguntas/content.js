// Conteúdo da página /perguntas-ligia — as 48 perguntas, os 7 blocos e a copy.
//
// Dados puros, sem JSX: o @vitejs/plugin-react só transforma arquivos .jsx,
// então este arquivo devolve estrutura de dados e quem monta o JSX é o
// componente. Mesma divisão de src/proposta/content.js e src/brief/content.js —
// dá para reescrever a conversa inteira sem abrir um componente.
//
// O bloco BLOCOS abaixo é transcrição literal do BRIEF.md (seção "As 48
// perguntas — estrutura exata"), inclusive as chaves curtas `t`, `sub` e `qs`,
// as aspas curvas de f2/f6 e o apóstrofo reto de b5. Os ids viram a chave do
// localStorage e a identidade da linha na planilha: trocar um id órfã a
// resposta dela. Não renomear, não reordenar, não "melhorar" texto.

export const BLOCOS = [
 {t:"Suas peças", sub:"Para dimensionar quanto trabalho de foto e cadastro a loja vai dar.", qs:[
  ["a1","Quantas peças <em>diferentes</em> você tem à venda hoje?",1,"Modelos diferentes, não a quantidade total de unidades."],
  ["a2","Dessas, quantas são peça única e quantas você repõe sempre?",1,""],
  ["a3","Quanto do seu estoque está parado há mais de 6 meses?",1,"Pode ser em porcentagem ou em valor. Chute serve."],
  ["a4","Nos anéis, quais aros você trabalha? Você tem todos os aros de cada modelo ou só alguns?",1,""],
  ["a5","Nos colares e pulseiras, quais comprimentos você tem?",0,""],
  ["a6","Além da prata pura, tem peça com banho de ouro 18k ou ródio negro?",0,""],
  ["a7","Quais são as 5 peças que mais vendem hoje?",0,""],
  ["a8","Tem alguma peça que você manda fazer sob encomenda, ou é tudo comprado pronto?",0,""]
 ]},
 {t:"Seus fornecedores", sub:"Para saber quanto tempo leva para repor uma peça que esgota e o que é exclusivo seu.", qs:[
  ["b1","Quantos fornecedores você usa hoje? Quais são os principais?",1,""],
  ["b2","Algum deles te dá exclusividade de algum modelo, ou é tudo linha aberta que qualquer loja compra?",1,""],
  ["b3","Quanto tempo demora entre você fazer o pedido e a peça chegar na sua mão?",1,""],
  ["b4","Eles têm pedido mínimo? De quanto?",0,""],
  ["b5","Eles mandam foto do produto junto? Como é a qualidade dessas fotos?",0,"Fundo branco? Imagem grande? Tem marca d'água?"],
  ["b6","Se chegar peça com defeito ou com o banho ruim, eles trocam?",0,""],
  ["b7","Já teve problema de peça escurecer rápido demais com algum fornecedor?",0,""]
 ]},
 {t:"Preço", sub:"Para definir parcelamento, frete grátis e até onde dá para ir num desconto.", qs:[
  ["c1","Qual a sua margem hoje? Quanto você multiplica em cima do que pagou na peça?",1,"Ex.: compro por 40 e vendo por 120."],
  ["c2","Qual o valor médio de uma venda sua hoje?",1,""],
  ["c3","Qual a peça mais barata e qual a mais cara da loja?",0,""],
  ["c4","Você dá desconto hoje? Em que situação?",0,""],
  ["c5","Já vende parcelado? Em quantas vezes?",0,""],
  ["c6","Você tem registrado quanto pagou em cada peça?",0,"Isso é o que permite saber depois qual peça dá lucro de verdade."]
 ]},
 {t:"Como você vende hoje", sub:"Para saber o que esperar do primeiro mês de loja e quem avisar primeiro quando ela abrir.", qs:[
  ["d1","Quantos pedidos por mês, mais ou menos?",1,""],
  ["d2","Como a pessoa compra de você hoje? Direct, WhatsApp, pessoalmente?",0,""],
  ["d3","Quantos seguidores você tem no Instagram, e quanta gente costuma ver um story?",1,""],
  ["d4","Você tem uma lista de clientes com nome e WhatsApp ou e-mail? Quantas pessoas mais ou menos?",1,"São as primeiras a saber da loja, antes de abrir para todo mundo."],
  ["d5","Tem alguma época do ano bem mais forte? Natal, Dia das Mães, Namorados?",0,""],
  ["d6","Quais as dúvidas que mais aparecem antes de a pessoa fechar a compra?",0,"Essa é uma das respostas mais importantes: cada dúvida vira uma informação na página do produto."],
  ["d7","Qual o motivo mais comum de alguém desistir de comprar?",0,""],
  ["d8","Já anunciou pago alguma vez? Como foi?",0,""]
 ]},
 {t:"O dia a dia", sub:"A parte que não aparece no site: nota fiscal, envio e quem faz o trabalho.", qs:[
  ["e1","Você já tem CNPJ? Emite nota fiscal hoje?",1,""],
  ["e2","Quem é o seu contador? Ele já trabalhou com loja online antes?",1,""],
  ["e3","Como você envia hoje? Correios, motoboy, a pessoa retira?",0,""],
  ["e4","Já tem embalagem com a marca? Como ela é hoje?",0,""],
  ["e5","Quem vai cuidar do dia a dia da loja — responder cliente, embalar, postar? Quantas horas por dia essa pessoa tem?",1,""],
  ["e6","Quantas trocas ou devoluções você tem hoje, e por qual motivo?",0,""],
  ["e7","Onde o estoque fica guardado? Você consegue achar uma peça específica rápido?",0,""],
  ["e8","Você usa algum sistema para controlar o estoque, ou é planilha e caderno?",0,""]
 ]},
 {t:"A cara da marca", sub:"O que já existe de identidade visual e de foto, e o que a gente vai criar do zero.", qs:[
  ["f1","Você tem o logo em arquivo editável? (vetor, AI, PDF)",1,""],
  ["f2","Tem alguma loja ou marca que você olha e pensa “queria que a minha parecesse com essa”?",0,"Se puder mandar 2 ou 3 exemplos e dizer o que te agrada em cada uma, ajuda muito."],
  ["f3","Como você descreveria a sua cliente? Idade, o que ela faz, por que ela compra de você.",0,""],
  ["f4","Quem tira as fotos hoje? Você mesma no celular ou tem alguém?",0,""],
  ["f5","Você já usa alguém como modelo nas fotos? É sempre a mesma pessoa?",0,""],
  ["f6","Tem alguma cor, símbolo ou palavra que é “a cara” da De Maria?",0,""],
  ["f7","As peças têm nome hoje, ou você identifica por código do fornecedor?",0,""]
 ]},
 {t:"Prazo e investimento", sub:"Para montar o cronograma com data real.", qs:[
  ["g1","Tem uma data em que você quer estar com a loja no ar? Por quê?",1,""],
  ["g2","Quanto você consegue investir no projeto somando site, fotografia e embalagem?",1,""],
  ["g3","Quando o site estiver no ar, você quer continuar vendendo pelo direct em paralelo ou migrar tudo?",0,""],
  ["g4","Tem mais alguém do seu lado para ajudar no projeto, ou é você sozinha?",0,""]
 ]}
];

// Constante, não PERGUNTAS.length: o contador "N de 48" que ela lê na barra do
// rodapé não pode passar a mentir se alguém mexer nos dados sem querer. O teste
// afirma que as duas coisas batem.
export const TOTAL = 48;

// Achatamento de BLOCOS em lista linear. `n` é contínuo de 1 a 48 ATRAVESSANDO
// os blocos (o bloco 2 começa no 9), como o brief manda. `bloco` guarda o
// título do bloco de origem, não o índice, porque é ele que vai no payload da
// API e vira a primeira coluna da planilha.
export const PERGUNTAS = BLOCOS.reduce((lista, bloco) => {
  bloco.qs.forEach(([id, texto, prioridade, dica]) => {
    lista.push({
      id,
      n: lista.length + 1,
      bloco: bloco.t,
      texto,
      prioridade: prioridade === 1,
      dica,
    });
  });
  return lista;
}, []);

// Remove as tags de ênfase. É o helper que monta o campo `pergunta` do payload:
// o brief é explícito em que a planilha recebe o texto sem HTML — ninguém quer
// ler "<em>" numa célula do Sheets.
export const semTags = (texto) => String(texto).replace(/<\/?em>/g, '');

/**
 * Quebra um texto marcado em pedaços classificados, para o componente montar
 * JSX sem dangerouslySetInnerHTML. Mesma técnica do renderRichText do App.jsx:
 * split com grupo de captura e map devolvendo elementos.
 *
 * `<em>` serve às perguntas; `**negrito**` serve aos dois blocos de fim de
 * página, que citam "Enviar respostas" e "Enviar de novo" em negrito.
 *
 * Devolve [{ tipo: 'normal' | 'italico' | 'negrito', texto }].
 */
export const splitMarcado = (texto) =>
  String(texto)
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

// Toda a copy da página, literal do BRIEF.md. Sem emoji em lugar nenhum — é
// regra explícita do brief.
export const copy = {
  sobretitulo: 'De Maria · joias em prata 925',
  titulo: 'Antes de montar a sua loja',
  intro: [
    'Ligia, para desenhar a loja online da De Maria do jeito certo, preciso entender como o seu negócio funciona hoje. São algumas perguntas sobre o que você vende, de onde vêm as peças e como você trabalha no dia a dia.',
    'Nada aqui é pegadinha nem prova. Quanto mais real for a resposta, melhor a loja fica — e mais rápido a gente sai do papel.',
  ],
  cartoes: [
    {
      titulo: 'Estimativa serve',
      texto: '"Uns 150", "mais ou menos 30%". Não precisa parar para contar.',
    },
    {
      titulo: 'Não sabe? Pula',
      texto: 'Deixe em branco. A gente vê junto depois.',
    },
    {
      titulo: 'As com ★ primeiro',
      texto: 'Se der tempo só para uma parte, responda essas.',
    },
    {
      titulo: 'Salva sozinho',
      texto: 'Pode fechar e voltar depois. Fica salvo no seu navegador.',
    },
  ],
  fim: 'Terminou? Toque em **Enviar respostas** aqui embaixo. Não precisa terminar tudo de uma vez: pode enviar o que já respondeu, continuar depois e enviar de novo — a versão mais nova substitui a anterior. Se for mais fácil responder por áudio, também vale: é só ir falando na ordem das perguntas.',
  fimEnviado: 'Recebido, obrigado! Já está tudo salvo do meu lado. Se quiser completar mais alguma resposta depois, volte nesta mesma página e toque em **Enviar de novo** — a versão nova substitui a anterior.',
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
  // Contador por bloco. A barra do rodapé diz onde ela está nas 48; este diz
  // onde ela está NESTE bloco. No celular a página é longa, e "faltam 2 daqui"
  // move muito mais que "faltam 31 no total".
  contadorBloco: (preenchidas, total) => `${preenchidas} de ${total}`,

  // Tela de confirmação. O texto é o mesmo `fimEnviado` do rodapé, partido em
  // título e corpo — não é uma segunda redação da mesma promessa, que é como
  // duas mensagens sobre o mesmo assunto começam a divergir.
  telaEnviado: {
    titulo: 'Recebido, obrigado!',
    texto: 'Já está tudo salvo do meu lado. Se quiser completar mais alguma resposta depois, volte nesta mesma página e toque em Enviar de novo — a versão nova substitui a anterior.',
    resumo: (preenchidas) => `${preenchidas} de ${TOTAL} respondidas`,
    voltar: 'Voltar às respostas',
  },
  fallback: {
    titulo: 'Não consegui enviar agora',
    texto: 'Nada do que você escreveu se perdeu. Copie as respostas ou mande no WhatsApp — depois é só tentar enviar de novo.',
    copiar: 'Copiar respostas',
    whatsapp: 'Mandar no WhatsApp',
    copiado: 'Copiado',
    // Usada quando o texto passa de 1400 caracteres: o WhatsApp abre só com
    // esta frase e o texto inteiro vai para o clipboard.
    mensagemCurta: 'Oi! Respondi as perguntas da loja. Já copiei tudo aqui no celular — vou colar na próxima mensagem.',
  },
};
