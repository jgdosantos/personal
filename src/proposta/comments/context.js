import { createContext, useContext } from 'react';

export const CommentsContext = createContext(null);

export const useComments = () => {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error('useComments precisa estar dentro de <CommentsProvider>');
  return ctx;
};
