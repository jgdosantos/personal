// Número de WhatsApp do João, com dono único.
//
// Vivia dentro de src/proposta/content.js, o que fazia a proposta ser dona de
// um dado que o briefing também usa. Um número em dois lugares vira dois
// números na primeira correção — e este já foi corrigido uma vez, quando
// faltava o 9 inicial.
export const WHATSAPP_NUMBER = '5531986494998';

export const whatsappLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
