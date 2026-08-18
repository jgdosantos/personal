import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // O `**/` importa: no flat config o padrão `dist` casa só o diretório da
  // raiz, então life-portfolio/dist/assets/*.js — bundle legado minificado —
  // estava sendo lintado e sozinho respondia por 108 erros. life-portfolio/ é
  // uma cópia antiga do portfólio, com config própria; não cabe a este repo.
  // src/components/LiquidEther.jsx é código de terceiro (reactbits.dev) mantido
  // literalmente para poder ser ressincronizado com o upstream sem merge. Ele
  // usa classes declaradas dentro de um hook, que o plugin react-hooks não
  // consegue analisar; corrigir aqui só criaria divergência com a origem.
  globalIgnores(['**/dist', 'life-portfolio', 'src/components/LiquidEther.jsx']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Funções serverless da Vercel rodam no Node, não no browser.
    files: ['api/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
