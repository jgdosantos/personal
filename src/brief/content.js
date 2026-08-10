// ============================================
// COPY DO BRIEFING — /brief?c=<token>
// ============================================
// Texto separado do layout, mesmo padrão de src/proposta/content.js: dá para
// reescrever a conversa inteira sem abrir um arquivo de componente.
//
// As perguntas e os textos de ajuda de cada campo de arquivo NÃO moram aqui —
// vivem em shared/briefFields.js, junto das regras de tipo e tamanho, para que
// front, back, e-mail e planilha leiam o mesmo campo do mesmo lugar.

export const page = {
  title: 'Briefing de marca · João Gabriel',
  kicker: 'Briefing de marca',
  heading: 'Me conta sobre a marca.',
  intro:
    'Quanto mais material você mandar, menos eu preciso adivinhar — e mais o site '
    + 'sai com a cara da marca já na primeira versão. Nada aqui é obrigatório além '
    + 'do nome e da descrição.',
  autosave: 'Salvo automaticamente. Você pode fechar e voltar por este mesmo link.',
};

export const fields = {
  brandName: {
    label: 'Nome da marca',
    placeholder: 'Como a clínica se chama',
    help: 'O nome como aparece para o público, não a razão social.',
  },
  instagram: {
    label: 'Instagram',
    placeholder: 'nomedamarca',
    // O cliente cola a URL inteira em vez de digitar o handle. Aceitar as duas
    // formas e normalizar evita um erro que ele nem entenderia.
    help: 'Pode colar o link do perfil — eu extraio o @.',
  },
  description: {
    label: 'Descrição breve da marca',
    placeholder: 'O que a clínica faz, para quem, e o que a diferencia das outras.',
    help: 'Três ou quatro linhas bastam. É o único campo em que você escreve com suas palavras — é dele que sai o tom do site.',
  },
  designSystem: {
    label: 'Design System',
    placeholder: 'https://figma.com/file/...',
    help: 'Se existir um Figma, um Drive ou um Notion com o material visual, cole o link aqui.',
    invalid: 'O link precisa começar com http:// ou https://',
  },
  notes: {
    label: 'Mais alguma coisa?',
    placeholder: 'Referências que você gosta, o que não pode faltar, prazos.',
    help: 'Opcional. Qualquer coisa que ajude e não coube nos campos acima.',
  },
};

export const autosave = {
  saving: 'Salvando…',
  saved: 'Salvo',
  error: 'Não consegui salvar — vou tentar de novo',
};

export const states = {
  loading: 'Abrindo o briefing…',

  // Sem ?c= ou token que não existe. Não distingue os dois casos de propósito:
  // "esse link não existe" ensina menos a quem estiver tentando adivinhar.
  invalidTitle: 'Link inválido',
  invalidBody:
    'Este link não está mais válido, ou foi copiado pela metade. '
    + 'Me chama no WhatsApp que eu te mando outro na hora.',
  invalidCta: 'Falar no WhatsApp',

  errorTitle: 'Não consegui carregar',
  errorBody: 'Alguma coisa falhou do meu lado. Recarregue a página — o que você já preencheu está salvo.',
  errorCta: 'Recarregar',
};

// Mensagem que abre o WhatsApp quando o cliente aciona a escapatória de um
// campo. Identifica marca e campo para o João não precisar perguntar de qual
// briefing se trata.
export const whatsappMessage = (fieldLabel, brandName) =>
  `Olá João! Sou ${brandName ? brandName : 'o cliente'} e vou te mandar `
  + `${fieldLabel.toLowerCase()} por aqui.`;

export const invalidLinkMessage =
  'Olá João! Tentei abrir o link do briefing mas ele não está funcionando.';
