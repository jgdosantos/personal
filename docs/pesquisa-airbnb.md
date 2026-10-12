# /pesquisa-airbnb — formulário que cai numa planilha do Google

A rota `www.joaogsantos.com/pesquisa-airbnb` mostra um formulário de uma tela só (nome, contato e 3 perguntas de escolha) para validar se gestoras e anfitriões de imóveis de temporada querem um vídeo 3D gerado por IA e quanto já gastam hoje com fotos profissionais. Quando a pessoa toca em *Enviar*, `POST /api/pesquisa-airbnb` valida e repassa para um Apps Script, que grava uma linha na aba **Respostas** da planilha.

O código do Apps Script está em [`apps-script-pesquisa-airbnb.gs`](./apps-script-pesquisa-airbnb.gs), ao lado deste arquivo. Não edite nada além do valor de `SEGREDO`.

---

## Passo 1 — abrir a planilha

<https://docs.google.com/spreadsheets/d/1X5QLJmoU0ifYYlnwalMiIQn1beKj3bfipSE_taJB-vA/edit>

O script precisa nascer **de dentro dela**: **Extensões → Apps Script**. `SpreadsheetApp.getActiveSpreadsheet()` resolve na planilha que hospeda o script, e um projeto avulso do Apps Script não acha planilha nenhuma.

**Mantenha o compartilhamento da planilha restrito.** O "qualquer pessoa" do passo 3 é do App da Web, não da planilha. As respostas têm nome e contato de terceiros, e a planilha não deve ser aberta a quem tiver o link.

## Passo 2 — colar o script e trocar o segredo

Apagar o conteúdo padrão, colar `docs/apps-script-pesquisa-airbnb.gs` inteiro e trocar o valor de `SEGREDO`:

```bash
openssl rand -hex 32
```

Guarde o valor: é o mesmo que vai para a Vercel no passo 4 (`PESQUISA_AIRBNB_SECRET`). Salvar.

## Passo 3 — publicar como App da Web

**Implantar → Nova implantação → tipo App da Web**

- *Executar como*: **Eu**
- *Quem tem acesso*: **Qualquer pessoa**

"Qualquer pessoa" assusta, mas é por isso que o segredo existe: qualquer um com a URL consegue chamar o endpoint, e quem não manda o segredo certo é recusado pelo `doPost` antes de tocar na planilha. O pior caso de um vazamento da URL é linha lixo na aba, e nenhum dado sai.

Copiar a URL que termina em `/exec`.

## Passo 4 — gravar as variáveis na Vercel

No projeto **personal**, nos três ambientes:

```bash
vercel env add PESQUISA_AIRBNB_WEBHOOK_URL production
vercel env add PESQUISA_AIRBNB_WEBHOOK_URL preview
vercel env add PESQUISA_AIRBNB_WEBHOOK_URL development

vercel env add PESQUISA_AIRBNB_SECRET production
vercel env add PESQUISA_AIRBNB_SECRET preview
vercel env add PESQUISA_AIRBNB_SECRET development
```

O valor é colado quando o comando pedir. **Sem espaço e sem quebra de linha no fim.** A rota apara, mas não force. `PESQUISA_AIRBNB_SECRET` tem de ser byte a byte igual ao `SEGREDO` do passo 2.

Para rodar local: `vercel env pull .env.local`. Conferir com `vercel env ls`.

Depois de gravar, **redeployar**: variável nova não entra em deploy que já existe.

Os nomes são próprios de propósito: `PERGUNTAS_*` é do /perguntas-ligia e `SHEETS_*` é do briefing de marca, cada um com a sua planilha.

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
  -d '{"segredo":"<PESQUISA_AIRBNB_SECRET>","nome":"Teste","contato":"teste@exemplo.com","imoveis":"1","interesse":"Quero","fotos":"Até R$ 200"}' \
  "<URL do /exec>"
# esperado: {"ok":true} — e uma linha nova na aba "Respostas"
```

**Pegadinha:** aqui vai `-d` **sem** `-X`. Forçar o método com `-X` faz o curl mandar POST também no redirect, e o `script.googleusercontent.com` responde 405 com uma página HTML do Drive ("Não foi possível abrir o arquivo"). Parece erro do script e não é. Sem o `-X`, o curl faz o downgrade para GET no 302, como o navegador faria.

**3. A própria API aceita um POST?**

```bash
curl -s -X POST https://www.joaogsantos.com/api/pesquisa-airbnb \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Teste","contato":"teste@exemplo.com","imoveis":"1","interesse":"Quero","fotos":"Até R$ 200"}'
# esperado: {"ok":true} — e outra linha na aba "Respostas"
```

Aqui o `-X POST` é correto: é a nossa API, não há redirect no caminho. Não leva segredo: quem o manda para o Apps Script é a API.

**4. O GET é recusado?**

```bash
curl -i https://www.joaogsantos.com/api/pesquisa-airbnb
# esperado: 405, header Allow: POST, corpo {"ok":false,"erro":"método não permitido"}
```

---

## Como saber que deu certo de verdade

**Confira a linha na planilha, não a tela.** Um HTTP 200 do Apps Script não prova gravação (ver o aviso do `ping`).

As linhas de teste dos passos 2 e 3 podem ser apagadas à mão.

## Aviso do `ping`

Se o `/exec` devolver `{"ok":true,"ping":true}` para um **POST**, a implantação está respondendo pelo `doGet`. Foi observado logo depois de implantar e some em alguns minutos. `api/pesquisa-airbnb.js` trata esse corpo como **erro de propósito**: sucesso exige `ok:true` **e** ausência de `ping`. Por isso a página mostra erro em vez de "Obrigado!" sobre uma gravação que não aconteceu.

## O AVISO

> **Salvar o Apps Script não atualiza o endpoint.**
>
> Toda edição exige **Implantar → Nova implantação**, ou *Gerenciar implantações → editar → Nova versão*.

O sintoma é cruel: o código na tela está certo e o comportamento no ar é o antigo.

## Como a aba funciona

A aba **Respostas** é criada sozinha no primeiro envio, com o cabeçalho `Quando | Nome | Contato | Imóveis | Interesse | Paga hoje por fotos` em negrito e congelado. Cada envio acrescenta uma linha.

Valor que começa com `=`, `+`, `-` ou `@` é gravado com um apóstrofo na frente, para o Sheets não ler como fórmula. Um WhatsApp digitado como `+55 11 9...` aparece normal na célula, e o apóstrofo só aparece na barra de fórmula.

## Se der errado

| Sintoma | Causa provável |
|---|---|
| 500 na nossa API | env var faltando, ou com espaço/quebra de linha |
| 502 na nossa API com `{"ok":false}` vindo da planilha | segredo diferente entre o `.gs` e a Vercel |
| Resposta HTML | implantação velha, ou acesso não configurado como "qualquer pessoa" |
| `{"ok":true,"ping":true}` num POST | implantação propagando, ou nova implantação esquecida |
| 400 `resposta inválida` | opção fora da lista: o front e a API leem `shared/pesquisaAirbnb.js`, confira se um deploy velho está no ar |
| A página mostra erro mesmo com tudo certo | confira a aba na planilha: se estiver vazia, o erro é real |
