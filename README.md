# joaogsantos.com

Portfólio pessoal do João Gabriel, feito com Vite + React e publicado em www.joaogsantos.com (projeto Vercel `personal`).

## Rodar

```bash
npm install        # instala as dependências
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção em dist/
npm run preview    # serve o build localmente
npm run lint       # ESLint
npm run test:api   # testes das rotas de API
```

## Regras de commit

Estas regras existem porque commit saindo com a conta errada ou no repo errado já aconteceu mais de uma vez. Seguir antes de qualquer commit ou push.

### 1. Quem assina

O autor tem que ser `jgdosantos <207635602+jgdosantos@users.noreply.github.com>`. Conferir antes de commitar:

```bash
git config user.name
git config user.email
```

Se estiver errado, corrigir só neste repo (sem `--global`):

```bash
git config user.name "jgdosantos"
git config user.email "207635602+jgdosantos@users.noreply.github.com"
```

Se o último commit saiu com o autor errado e AINDA NÃO foi enviado:

```bash
git commit --amend --reset-author --no-edit
```

Se já foi enviado, não reescrever o histórico do `main` por conta própria.

### 2. Repo certo

| O que mudou | Repo | De onde commitar |
| --- | --- | --- |
| Portfólio: www.joaogsantos.com, propostas, `/decisoes-ligia`, brief etc. | `jgdosantos/personal` | De dentro de `personal/` (ou `git -C personal ...`) |
| App Kanban (app.joaogsantos.com) e docs GSD (`.planning/`) | `jgdosantos/web-jg` | Raiz do web-jg |
| Projetos de clientes | Cada um no seu próprio repo privado em `jgdosantos/` | Ver o `CLAUDE.md` do web-jg |

> **Atenção:** `personal/` é gitignored dentro do web-jg, então `git status` na raiz do web-jg NÃO mostra as mudanças do portfólio. Sempre confirmar com `git -C personal remote -v` (tem que mostrar `jgdosantos/personal.git`).

### 3. Push com a conta certa

Há várias contas logadas no `gh` (`gh auth status` lista todas); só `jgdosantos` tem acesso aos repos. Passos:

```bash
# 1. Quem está ativo?
gh api user --jq .login

# 2. Se não for jgdosantos, trocar
gh auth switch --user jgdosantos

# 3. Push usando o credential helper do gh
git -c credential.helper='!gh auth git-credential' push

# 4. Voltar para a conta anterior
gh auth switch --user <a-anterior>
```

Por quê: `gh auth switch` sozinho NÃO conserta o `git push`, porque o git usa o osxkeychain, que guarda uma credencial própria e independente do gh. Em repo privado, conta errada aparece como `Repository not found` (o GitHub responde 404, não 403): o repo existe, a conta é que está errada. O `gh auth switch` já foi visto voltando sozinho entre comandos, então reconferir logo antes do push.

### Checklist antes de commitar

- [ ] Remote certo: `git remote -v` (no portfólio, `git -C personal remote -v`)
- [ ] `git config user.email` = `207635602+jgdosantos@users.noreply.github.com`
- [ ] `git diff --cached` só tem arquivos deste repo
- [ ] Antes do push: `gh api user --jq .login` = `jgdosantos` e push com `git -c credential.helper='!gh auth git-credential' push`
