// ============================================
// CONTEÚDO DA PROPOSTA — /proposta-marcelo
// ============================================
// Cada item comentável carrega um `anchor` estável. Os pins de comentário
// são gravados contra esse id, então renomear um anchor "solta" os comentários
// já existentes daquele bloco. Adicione novos ids em vez de reciclar antigos.

export const WHATSAPP_NUMBER = '5531986494998';

export const whatsappLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const PROPOSAL_SLUG = 'marcelo';

// Serve de public/. O rewrite do vercel.json exclui /api/, mas arquivos
// estáticos são resolvidos antes dele — o PDF não cai no index.html.
export const PDF_PATH = '/proposta-desenvolvimento-web.pdf';

export const meta = {
  kicker: 'Proposta comercial · Desenvolvimento Web',
  title: 'Site Institucional',
  delivery: '3 a 5 semanas',
  price: 'A partir de R$ 2.000',
};

export const scope = [
  {
    anchor: 'escopo-01',
    n: '01',
    title: 'Design exclusivo, sem templates',
    text: 'Criado do zero a partir da identidade da clínica. Nenhum layout pronto reciclado.',
  },
  {
    anchor: 'escopo-02',
    n: '02',
    title: 'Até 6 páginas responsivas',
    text: 'Home, Sobre, Serviços, Equipe, Contato e mais uma personalizada, conforme a necessidade.',
  },
  {
    anchor: 'escopo-03',
    n: '03',
    title: 'Perfeito em qualquer tela',
    text: 'Layout adaptado para desktop, tablet e celular — de onde vêm 8 de cada 10 acessos.',
  },
  {
    anchor: 'escopo-04',
    n: '04',
    title: 'SEO otimizado para o Google',
    text: 'Estrutura técnica preparada para a clínica aparecer para quem já busca esses serviços.',
  },
  {
    anchor: 'escopo-05',
    n: '05',
    title: 'GEO otimizado para IA',
    text: 'Preparado para ser citado por ChatGPT, Gemini, Perplexity e outras IAs generativas — a nova busca.',
    badge: 'Novo',
  },
  {
    anchor: 'escopo-06',
    n: '06',
    title: 'Integração WhatsApp & Google Maps',
    text: 'Do site para a conversa em um clique. Menos atrito, mais agendamento fechado.',
  },
  {
    anchor: 'escopo-07',
    n: '07',
    title: 'Formulário de contato inteligente',
    text: 'Leads capturados e enviados direto para o seu e-mail, prontos para atendimento.',
  },
  {
    anchor: 'escopo-08',
    n: '08',
    title: 'Google Analytics configurado',
    text: 'Acessos, comportamento e origem dos visitantes medidos em tempo real, com dados reais.',
  },
  {
    anchor: 'escopo-09',
    n: '09',
    title: 'Performance de carregamento',
    text: 'Otimizado para abrir em menos de 3 segundos. Cada segundo a mais custa conversão.',
  },
  {
    anchor: 'escopo-10',
    n: '10',
    title: '3 revisões + 30 dias de suporte',
    text: 'Ajustes inclusos durante o projeto e um mês de suporte gratuito após o lançamento.',
  },
];

export const steps = [
  {
    anchor: 'processo-01',
    n: '01 · Briefing',
    title: 'Alinhamento',
    text: 'Reunião de descoberta: objetivos, referências e mapeamento do público.',
  },
  {
    anchor: 'processo-02',
    n: '02 · Design',
    title: 'Layout exclusivo',
    text: 'O design de cada página é apresentado e aprovado antes de qualquer linha de código.',
  },
  {
    anchor: 'processo-03',
    n: '03 · Dev',
    title: 'Desenvolvimento',
    text: 'Código, integrações, responsividade, SEO, GEO e otimização de performance.',
  },
  {
    anchor: 'processo-04',
    n: '04 · Launch',
    title: 'Entrega no ar',
    text: 'Publicação, revisões finais, treinamento de uso e 30 dias de suporte.',
  },
];

export const maintenanceItems = [
  'Atualizações de segurança',
  'Backup semanal automático',
  'Pequenas alterações de conteúdo',
  'Monitoramento de uptime',
  'Suporte prioritário via WhatsApp',
  'Relatório mensal simplificado',
];

export const info = [
  {
    anchor: 'info-01',
    n: '01 · Pagamento',
    title: 'Divisão em duas parcelas',
    text: '50% na aprovação do projeto e 50% na entrega final. Sem taxa escondida e sem cobrança recorrente — a menos que você opte pela manutenção.',
  },
  {
    anchor: 'info-02',
    n: '02 · Escopo',
    title: 'Funcionalidades extras',
    text: 'Recursos fora do escopo apresentado (blog, área do paciente, integrações específicas) são orçados à parte, sempre apresentados antes de qualquer cobrança.',
  },
  {
    anchor: 'info-03',
    n: '03 · Domínio',
    title: 'Domínio & hospedagem',
    text: 'O custo do domínio (endereço .com.br) e da hospedagem não está incluso. Se a clínica ainda não tiver, a compra é feita junto, durante o projeto.',
  },
  {
    anchor: 'info-04',
    n: '04 · Acessos',
    title: 'Contas do cliente',
    text: 'É necessário um e-mail geral da clínica para criar as contas no GitHub e na Vercel, usadas no desenvolvimento e na hospedagem do site.',
  },
];
