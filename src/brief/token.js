const TOKEN_KEY = 'brief:token';

/**
 * O link do cliente é /brief?c=<access_token>.
 *
 * Guardamos em localStorage, não sessionStorage: com sessionStorage o token
 * morre ao fechar a aba, e o cliente que voltar amanhã para terminar o
 * briefing encontraria "link inválido" mesmo tendo o link certo no histórico.
 * Briefing é justamente o formulário que ninguém preenche de uma sentada.
 */
export const readClientToken = () => {
  if (typeof window === 'undefined') return '';
  const fromUrl = new URLSearchParams(window.location.search).get('c');
  if (fromUrl) {
    try {
      window.localStorage.setItem(TOKEN_KEY, fromUrl);
    } catch { /* modo privado */ }
    return fromUrl;
  }
  try {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};
