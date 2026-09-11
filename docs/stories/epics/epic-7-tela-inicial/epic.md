---
id: epic-7
title: Tela Inicial — Painel do Dia
status: Draft
depends_on: epic-4
---

# Epic 7: Tela Inicial — Painel do Dia — Brownfield Enhancement

## Epic Goal

Criar uma aba "Início" que vira a tela padrão ao logar, mostrando as informações do dia no Tibia (boss boostado, criatura boostada, localização do Rashid) e cards de atalho pras outras abas do app.

## Epic Description

**Existing System Context:**
- Hoje o app não tem uma tela "inicial" dedicada — ao logar, a view padrão (`useState('dashboard')` em `App.jsx`) já cai direto na aba "Minhas Hunts".
- `src/lib/tibiaDataClient.js` já tem o padrão estabelecido de chamar a TibiaData API direto do client (`fetchCharacter`), sem necessidade de RPC, quando o endpoint permite CORS.
- **Confirmado nesta sessão, chamando os endpoints reais:** `https://api.tibiadata.com/v4/boostablebosses` e `https://api.tibiadata.com/v4/creatures` funcionam direto do browser (CORS liberado, status 200), cada um retornando um campo `boosted` com o boss/criatura do dia. Diferente do endpoint `/creature/{name}` (Epic 4), que precisou de RPC server-side por causa de CORS — aqui não é necessário.
- A localização do Rashid segue uma escala fixa por dia da semana (não vem de nenhuma API — é uma regra estática do jogo, verificada via busca externa): Segunda-Svargrond, Terça-Liberty Bay, Quarta-Port Hope, Quinta-Ankrahmun, Sexta-Darashia, Sábado-Edron, Domingo-Carlin (muda no server save, 10:00 CET/UTC-... o horário exato de virada não é crítico pro MVP — ver Riscos).
- Nav atual (`App.jsx`): Minhas Hunts, Hunts Compartilhadas, Meu Profit, Metas, Configurações.

**Enhancement Details:**
- Nova aba "Início" (primeira da navegação), que vira a view padrão no lugar de "Minhas Hunts".
- Mostra: boss boostado do dia (nome + imagem), criatura boostada do dia (nome + imagem), cidade do Rashid hoje.
- Cards de atalho abaixo, um pra cada aba existente (Minhas Hunts, Hunts Compartilhadas, Meu Profit, Metas, Configurações), navegando pra elas ao clicar.
- Success criteria: usuário loga e já vê as informações do dia + consegue navegar pra qualquer aba a partir da tela inicial, sem nenhuma migration nova.

## Stories

### Story 7.1 — Tela Início: Painel do Dia + Cards de Navegação
- **Descrição:** Nova página `Home.jsx` com 3 informações do dia (boss boostado via `/boostablebosses`, criatura boostada via `/creatures`, cidade do Rashid via tabela estática de dia-da-semana) e cards clicáveis pras outras 5 abas. Vira a view padrão do `App.jsx`.
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given o usuário loga, When a tela carrega, Then a aba "Início" é a que aparece por padrão (não mais "Minhas Hunts").
  - Given a tela Início, When carregada, Then mostra o boss boostado do dia (nome + imagem) e a criatura boostada do dia (nome + imagem), buscados ao vivo da TibiaData API.
  - Given a tela Início, When carregada, Then mostra a cidade do Rashid hoje, calculada localmente a partir do dia da semana atual — sem chamada de API.
  - Given a TibiaData API estiver fora do ar ao carregar boss/criatura boostados, When isso acontece, Then a tela não quebra — mostra só a localização do Rashid e os cards de navegação, com uma mensagem discreta de que os boosts não puderam ser carregados agora.
  - Given os cards de navegação, When o usuário clica em qualquer um, Then é levado pra aba correspondente (mesmo comportamento de clicar na nav do topo).

## Compatibility Requirements

- [ ] Nenhuma migration nova — os dois endpoints usados são públicos e sem necessidade de RPC (confirmado via teste real).
- [ ] Nenhuma mudança em nenhuma aba existente além do `App.jsx` trocar a view padrão.

## Risk Mitigation

- **Risco:** hora exata de virada do server save (Rashid/boosts) pode divergir por fração de horas conforme fuso do navegador do usuário. **Mitigação:** calcular o dia da semana usando o horário local do navegador é uma aproximação aceitável pro MVP — só ficaria "errado" por poucas horas ao redor da meia-noite/virada do server save, o que é um risco aceito, não um bug a resolver agora.
- **Risco:** TibiaData API fora do ar deixando a tela vazia. **Mitigação:** AC 4 já cobre isso — degradação graciosa, mesmo padrão já usado em outras integrações com essa API no projeto (Story 2.2).

## Definition of Done

- [ ] Story com AC atendidos
- [ ] Tela Início é a view padrão
- [ ] Boss e criatura boostados exibidos com dados reais
- [ ] Rashid calculado sem API
- [ ] Cards de navegação funcionando pras 5 abas existentes

## Status: Draft (2026-09-11)

Epic criado a partir de conversa com o usuário sobre o que a TibiaData API oferece — endpoints de boss/criatura boostados já testados e confirmados funcionando direto do client antes do draft da story.
