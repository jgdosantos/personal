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
    opcoes: [
      'Menos de R$ 500',
      'R$ 500 a 1.000',
      'R$ 1.000 a 1.500',
      'R$ 1.500 a 2.000',
      'R$ 2.000 a 3.000',
      'Mais de R$ 3.000',
    ],
    // Só pergunta preço a quem não rejeitou o produto. "Não quero" e "Jamais
    // compraria" pulam a pergunta: um chute de preço de quem não compraria
    // poluiria a faixa de quem compraria.
    mostrarSe: { interesse: ['Quero muito', 'Quero', 'Não faz diferença'] },
  },
];

/** A pergunta aparece para estas respostas? Sem `mostrarSe`, sempre aparece. */
export function visivel(escolha, respostas) {
  if (!escolha.mostrarSe) return true;
  return Object.entries(escolha.mostrarSe).every(([campo, aceitas]) =>
    aceitas.includes(respostas[campo]),
  );
}

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
  for (const escolha of ESCOLHAS) {
    const { id, opcoes } = escolha;
    // Pergunta escondida grava vazio, venha o que vier do cliente. ESCOLHAS
    // está em ordem, então `dados` já tem as respostas de que ela depende.
    if (!visivel(escolha, dados)) {
      dados[id] = '';
      continue;
    }
    const valor = entrada[id];
    if (typeof valor !== 'string' || !opcoes.includes(valor)) {
      return { ok: false, erro: 'resposta inválida' };
    }
    dados[id] = valor;
  }
  return { ok: true, dados };
}
