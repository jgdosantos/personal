import { createContext, useContext } from 'react';

export const BriefContext = createContext(null);

export const useBrief = () => {
  const value = useContext(BriefContext);
  // Estourar aqui em vez de devolver undefined: o erro aponta o componente
  // fora do provider, em vez de virar "cannot read property of undefined"
  // dez frames adiante.
  if (!value) throw new Error('useBrief precisa estar dentro de <BriefProvider>');
  return value;
};
