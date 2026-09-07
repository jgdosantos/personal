# /perguntas-ligia — questionário que cai numa planilha do Google

A rota `www.joaogsantos.com/perguntas-ligia` mostra 48 perguntas em 7 blocos para a Ligia (De Maria — joias em prata 925) responder do celular, no tempo dela. As respostas ficam no aparelho enquanto ela escreve; quando ela toca em *Enviar respostas*, `POST /api/perguntas-ligia` repassa tudo para um Apps Script que grava numa planilha privada.

O código do Apps Script está em [`apps-script-perguntas.gs`](./apps-script-perguntas.gs), ao lado deste arquivo. Ele é literal do brief — não edite nada além do valor de `SEGREDO`.

---

## Passo 1 — abrir a planilha que já existe

<https://docs.google.com/spreadsheets/d/11Fbfq7OFgppgxFCXCBWrysmQWJwisnUB8ngtjfgSps0/edit>

Não crie uma planilha nova. E o script precisa nascer **de dentro dela**: **Extensões → Apps Script**. `SpreadsheetApp.getActiveSpreadsheet()` resolve na planilha que hospeda o script, e um projeto avulso do Apps Script não acha planilha nenhuma.

## Passo 2 — colar o script e trocar o segredo

Apagar o conteúdo padrão, colar `docs/apps-script-perguntas.gs` inteiro e trocar o valor de `SEGREDO`.

```bash
openssl rand -hex 32
```

O placeholder diz `cole-aqui-o-mesmo-valor-do-SHEETS_SECRET` porque o arquivo é cópia literal do brief original. **Ignore o nome:** o valor que vai ali é o de `PERGUNTAS_SECRET`. Guarde-o, é o mesmo que vai para a Vercel no passo 4.

Salvar.

## Passo 3 — publicar como App da Web

**Implantar → Nova implantação → tipo App da Web**

- *Executar como*: **Eu**
- *Quem tem acesso*: **Qualquer pessoa**

"Qualquer pessoa" assusta, mas é justamente por isso que o segredo existe: qualquer um com a URL consegue chamar o endpoint, e quem não manda o segredo certo é recusado pelo `doPost` antes de tocar na planilha. O pior caso de um vazamento da URL é linha lixo numa aba — nenhum dado sai.

Copiar a URL que termina em `/exec`.

## Passo 4 — gravar as variáveis na Vercel

No projeto **personal**, nos três ambientes:

```bash
vercel env add PERGUNTAS_WEBHOOK_URL production
vercel env add PERGUNTAS_WEBHOOK_URL preview
vercel env add PERGUNTAS_WEBHOOK_URL development

vercel env add PERGUNTAS_SECRET production
vercel env add PERGUNTAS_SECRET preview
vercel env add PERGUNTAS_SECRET development
```

O valor é colado quando o comando pedir. **Sem espaço e sem quebra de linha no fim** — o helper `env()` da rota apara, mas não force. `PERGUNTAS_SECRET` tem de ser byte a byte igual ao `SEGREDO` do passo 2.

Para rodar local: `vercel env pull .env.local`. Conferir com `vercel env ls`.

Depois de gravar, **redeployar**: variável nova não entra em deploy que já existe.

## Passo 5 — testar, nesta ordem

**1. O `doGet` responde?**

```bash
curl -sL "<URL do /exec>"
# esperado: {"ok":true,"ping":true}
```

O `-L` é obrigatório. Sem ele você vê o 302 e acha que quebrou.

**2. O Apps Script grava?**

```bash
curl -sL -H "Content-Type: application/json" \
  -d '{"segredo":"<PERGUNTAS_SECRET>","respondente":"Teste","sessao":"s1","total":1,"preenchidas":1,"respostas":[{"id":"a1","n":1,"bloco":"Bloco","pergunta":"Pergunta","prioridade":true,"resposta":"ok"}]}' \
  "<URL do /exec>"
# esperado: {"ok":true} — e a aba "Teste" na planilha
```

**Pegadinha que já custou tempo:** aqui vai `-d` **sem** `-X`. Forçar o método com `-X` faz o curl mandar POST também no redirect, e o `script.googleusercontent.com` responde 405 com uma página HTML do Drive ("Não foi possível abrir o arquivo"). Parece erro do script e não é. Sem o `-X`, o curl faz o downgrade para GET no 302, como o navegador faria.

Se vier `{"ok":true,"ping":true}`: a implantação ainda está propagando, espere alguns minutos.
Se vier `{"ok":false,"erro":"nao autorizado"}`: o segredo difere do `SEGREDO` do `.gs`.

**3. A própria API aceita um POST?**

```bash
curl -s -X POST https://www.joaogsantos.com/api/perguntas-ligia \
  -H 'Content-Type: application/json' \
  -d '{"respondente":"Teste","sessao":"manual","total":48,"preenchidas":1,"respostas":[{"id":"a1","n":1,"bloco":"Suas peças","pergunta":"Quantas peças diferentes você tem à venda hoje?","prioridade":true,"resposta":"teste manual"}]}'
# esperado: {"ok":true} — e a aba "Teste" atualizada
```

Aqui o `-X POST` é correto: é a nossa API, não há redirect no caminho.

**4. O GET é recusado?**

```bash
curl -i https://www.joaogsantos.com/api/perguntas-ligia
# esperado: 405, header Allow: POST, corpo {"ok":false,"erro":"método não permitido"}
```

---

## Como saber que deu certo de verdade

**Confira a aba na planilha, não a mensagem da tela.** Um HTTP 200 do Apps Script não prova gravação (ver o aviso do `ping` logo abaixo).

## Aviso do `ping`

Se o `/exec` devolver `{"ok":true,"ping":true}` para um **POST**, a implantação está respondendo pelo `doGet`. Foi observado uma vez, logo depois de implantar, e sumiu sozinho em alguns minutos.

`api/perguntas-ligia.js` trata esse corpo como **erro de propósito**: sucesso exige `ok:true` **e** ausência de `ping`. Por isso a página mostra o plano B (copiar / WhatsApp) em vez de dizer "Recebido, obrigado!" sobre uma gravação que não aconteceu. Se o sintoma persistir, é implantação nova que faltou.

## O AVISO

> **Salvar o Apps Script não atualiza o endpoint.**
>
> Toda edição exige **Implantar → Nova implantação**, ou *Gerenciar implantações → editar → Nova versão*.

É o erro mais comum desta integração e o sintoma é cruel: o código na tela está certo e o comportamento no ar é o antigo.

## Como as abas funcionam

- Cada envio **reescreve** a aba com o nome do respondente. A leitura fica sempre limpa: 48 linhas, sem duplicar, mesmo depois de cinco reenvios.
- Cada envio **acrescenta** uma linha na aba `Historico`, com data, respondente, sessão, `preenchidas/total` e o JSON completo. Nada se perde num reenvio.
- A aba `Historico` é criada sozinha no primeiro envio.
- A planilha já tem uma aba `Teste` e algumas linhas em `Historico`, da validação de 2026-09-07. **Apagar a aba `Teste` não afeta nada** — cada envio só reescreve a aba do respondente daquele envio.

O nome da aba vem de `?p=Nome` na URL (padrão: `Ligia`), cortado em 40 caracteres e sem os caracteres que o Sheets recusa em nome de aba.

## Se der errado

| Sintoma | Causa provável |
|---|---|
| 500 na nossa API | env var faltando, ou com espaço/quebra de linha |
| `{"ok":false}` vindo da planilha | segredo diferente entre o `.gs` e a Vercel |
| Resposta HTML | implantação velha, ou acesso não configurado como "qualquer pessoa" |
| `{"ok":true,"ping":true}` num POST | implantação propagando, ou nova implantação esquecida |
| A página mostra o plano B mesmo com tudo certo | confira a aba na planilha: se estiver vazia, o erro é real |
