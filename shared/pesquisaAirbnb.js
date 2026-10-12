// ============================================================================
// PESQUISA AIRBNB — fonte única das perguntas de escolha e da validação
// ============================================================================
// Lida pelo front (que desenha os botões a partir de ESCOLHAS) e pela API
// (que usa as mesmas listas como allowlist). Mora fora de src/ e fora de api/
// pelo mesmo motivo de briefFields.js: a Vercel só transforma em rota o que
// está em api/, e o Vite importa daqui sem configuração. Lista duplicada entre
// front e back diverge em uma semana.
//
// ESM puro: sem import, sem dependência, sem API de browser nem de Node.

export const LIMITES = { nome: 100, contato: 150 };

// Textos copiados do formulario-validacao.md, na ordem em que aparecem.
export const ESCOLHAS = [
  {
    id: 'imoveis',
    pergunta: 'Quantos imóveis estão sob sua responsabilidade?',
    opcoes: ['1', '2 a 5', '6 a 20', 'Mais de 20'],
  },
  {
    id: 'interesse',
    pergunta: 'O que você acha de um vídeo 3D para o seu negócio?',
    opcoes: ['Quero muito', 'Quero', 'Não faz diferença', 'Não quero', 'Jamais compraria'],
  },
  {
    id: 'pagaria',
    pergunta: 'Quanto você pagaria por vídeo de cada imóvel?',
    opcoes: ['Não pagaria', 'Até R$ 100', 'R$ 100 a 200', 'R$ 200 a 400', 'Mais de R$ 400'],
  },
];

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Valida a entrada e devolve um objeto NOVO, campo a campo: chave extra do
 * cliente nunca passa. As escolhas precisam estar na lista por igualdade
 * exata (sem trim, sem mudar caixa).
 */
export function validar(entrada) {
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) {
    return { ok: false, erro: 'corpo inválido' };
  }

  const nome = texto(entrada.nome, LIMITES.nome);
  const contato = texto(entrada.contato, LIMITES.contato);
  if (!nome || !contato) return { ok: false, erro: 'preencha nome e contato' };

  const dados = { nome, contato };
  for (const { id, opcoes } of ESCOLHAS) {
    const valor = entrada[id];
    if (typeof valor !== 'string' || !opcoes.includes(valor)) {
      return { ok: false, erro: 'resposta inválida' };
    }
    dados[id] = valor;
  }
  return { ok: true, dados };
}
