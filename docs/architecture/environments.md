# Ambientes: Staging (Homologação) & Produção

**Responsável:** Aria (@architect) · **Status:** Decidido

## Decisão

Dois projetos Supabase separados — **staging** e **produção** — cada um com seu próprio banco, Auth e usuários. Nunca compartilham dados.

| Ambiente | Onde roda | Supabase | Quando usar |
|---|---|---|---|
| **Staging (homologação)** | Sua máquina (`npm run dev`) | Projeto Supabase A (o que você já criou) | Todo desenvolvimento e teste, antes de qualquer coisa ir pra produção |
| **Produção** | Vercel (deploy do branch `main`) | Projeto Supabase B (criar quando o Epic 1 estiver validado em staging) | Usuários reais |

**Por que 2 projetos e não 1:** Supabase free tier permite até 2 projetos gratuitos por organização — encaixa perfeitamente nesse modelo (staging + produção, sem custo). Um único projeto misturando dados de teste com dados reais é a causa mais comum de "sumiu meu personagem de teste" ou, peor, dados de teste aparecendo pra usuários reais.

## Como funciona no dia a dia

1. Você desenvolve e testa **localmente**, com o `.env` sempre apontando pro projeto Supabase de **staging**.
2. Quando uma funcionalidade está validada localmente, você dá push/merge pro branch `main`.
3. O Vercel detecta o push no `main` e faz o deploy de **produção**, usando as variáveis de ambiente de produção configuradas **no painel do Vercel** (não no `.env` do seu computador — o `.env` local nunca vai pro Git nem pro Vercel).

```
Seu computador (.env = staging)  →  npm run dev  →  testa tudo
        │
        │ git push / merge para main
        ▼
   Vercel (env vars de produção configuradas no dashboard do Vercel)
        │
        ▼
   App em produção → Supabase de produção
```

## Configuração de variáveis por ambiente

| Local | Arquivo/painel | Projeto Supabase |
|---|---|---|
| Seu computador | `.env` (gitignored) | Staging |
| Vercel → Settings → Environment Variables → **Production** | painel do Vercel | Produção |
| Vercel → Settings → Environment Variables → **Preview** (opcional) | painel do Vercel | Staging (mesmas chaves do seu `.env`) — assim, se algum dia você conectar outros branches ao Vercel para preview, eles caem em staging, nunca em produção |

## Confirmação de email — mantida ativa (como pedido)

Confirmação de email fica **ligada nos dois projetos** (staging e produção) — sem atalho de desativar. Para testar múltiplas contas em staging sem precisar de várias caixas de email reais, use o truque de **alias do Gmail**: `seuemail+testeA@gmail.com` e `seuemail+testeB@gmail.com` chegam na mesma caixa de entrada, mas o Supabase trata como contas diferentes — os emails de confirmação chegam normalmente e você clica em cada um.

## Quando criar o projeto Supabase de produção

Não precisa agora. Só criar quando o Epic 1 (auth, personagens, registro de sessão) estiver validado em staging. Nesse momento: repetir os passos que você já fez (criar projeto, copiar URL/anon key, rodar [supabase/schema.sql](../../supabase/schema.sql)) — só que salvando as chaves **no Vercel**, não no seu `.env` local.

## Change Log

| Data | Mudança | Autor |
|---|---|---|
| 2026-08-26 | Estratégia de ambientes (staging local + produção Vercel) decidida | Aria (@architect) |
