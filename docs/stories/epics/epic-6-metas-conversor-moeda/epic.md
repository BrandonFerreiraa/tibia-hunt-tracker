---
id: epic-6
title: Conversor de Moeda (KK/TC/Reais) e Metas de Profit com Redistribuição Diária
status: InReview
depends_on: epic-5
---

# Epic 6: Conversor de Moeda (KK/TC/Reais) e Metas de Profit com Redistribuição Diária — Brownfield Enhancement

## Epic Goal

Dar ao usuário uma forma de converter seu profit de hunt (KKs) em Tibia Coins e em Reais usando as taxas do seu próprio server, e de definir uma meta de profit com data de início/fim que recalcula automaticamente quanto falta fazer por dia — inclusive redistribuindo o valor quando um dia fica devendo.

## Epic Description

**Existing System Context:**

- O profit de hunt já é rastreado hoje: cada `session` tem `balance` (loot − supplies) em gold puro (não em "kk"), agregado pela página "Meu Profit" (`src/pages/Profit.jsx` + `src/hooks/useProfitStats.js`), que já soma o profit de **todos os personagens do usuário** por dia/semana/mês (`src/lib/groupSessionsByDay.js`).
- Não existe hoje nenhuma formatação de valores em "kk" (milhões) em nenhum lugar do código — todo valor é exibido com `toLocaleString('pt-BR')` em gold puro.
- Não existe nenhum conceito de Tibia Coins (TC) ou conversão de moeda no código — isso é 100% novo.
- Stack: Vite + React 19 (sem router, navegação via `useState` em `src/App.jsx`), Tailwind v4, Supabase (Postgres + Auth + RLS por `user_id`/`character_id`). Convenção de pastas: `src/pages/*.jsx`, `src/components/*.jsx`, `src/components/ui/*.jsx` (primitivos: Button, Card, Input, Modal, Badge), `src/hooks/*.js` (data-fetching por feature), `src/lib/*.js` (helpers puros). Migrations em `supabase/migrations/002` a `022_*.sql`, todas com RLS escopada em `auth.uid()`.

**Enhancement Details:**

- Nova aba de navegação "Metas" (`src/pages/Goals.jsx`), separada de "Meu Profit".
- Conversor de moeda com 2 taxas editáveis a qualquer momento pelo usuário, persistidas por usuário:
  - **KK por TC**: quanto custa 1 TC em KKs no server (ex.: Issobra a 45.000 KK por TC).
  - **Reais por 250 TC**: quanto vale um lote de 250 TC em reais, no formato como os compradores anunciam (ex.: R$ 47,50 a cada 250 TC) — sempre denominado em lotes de 250 TC, não por 1 TC.
- O conversor usa essas 2 taxas para transformar qualquer valor de profit (KK) em TC equivalente e em Reais equivalentes.
- Meta de profit: usuário define um valor alvo em KK, uma data inicial e uma data final. A meta é **por conta** (soma o profit de todos os personagens do usuário — mesmo critério já usado em "Meu Profit"), não por personagem individual.
- Apenas 1 meta ativa por vez. Metas anteriores ficam em histórico (consultável), com o resultado final registrado (batida / não batida) quando o período termina ou quando uma nova meta é criada.
- Cálculo diário: `meta_diária = (valor_alvo − profit_já_feito_no_período) / dias_restantes_no_período` (incluindo o dia atual). Isso já é a "redistribuição automática": se um dia fica devendo (ou se um dia supera a meta), o valor por dia dos dias seguintes é recalculado automaticamente — não existe um valor fixo por dia armazenado, ele é sempre derivado do progresso real.
- O painel de meta mostra o progresso (em KK) e a meta diária recalculada também convertida em TC e em Reais, usando as taxas do conversor.
- Success criteria: usuário consegue configurar as 2 taxas e ver qualquer valor de KK convertido em TC/Reais; usuário consegue criar uma meta com data inicial/final e ver quanto falta fazer por dia, com o valor se ajustando corretamente no dia seguinte a um dia sem profit (ou com profit acima da meta); histórico de metas passadas fica visível.

## Stories

### Story 6.1 — Schema: Taxas de Câmbio e Metas de Profit
- **Descrição:** Nova migration (`supabase/migrations/023_currency_goals.sql`) criando: (1) tabela `exchange_rates` (ou colunas equivalentes) com `user_id`, `kk_per_tc numeric`, `brl_per_250tc numeric`, `updated_at` — uma linha por usuário, upsert nas trocas de taxa; (2) tabela `goals` com `user_id`, `target_kk numeric` (ou `target_gold bigint`, a definir pelo @data-engineer conforme padrão de `sessions.balance`), `start_date date`, `end_date date`, `status` (`active` | `completed` | `failed`, ou equivalente), `created_at`. RLS em ambas as tabelas escopada em `auth.uid() = user_id`, seguindo o mesmo padrão já usado em `characters`/`sessions`. Regra de negócio "apenas 1 meta `active` por usuário por vez" garantida (constraint parcial única ou validação na criação).
- **Executor:** `@data-engineer` · **Quality Gate:** `@dev`
- **Quality Gate Tools:** `[schema_validation, migration_review, rls_test]`
- **AC:**
  - Given um usuário sem taxas configuradas, When consulta `exchange_rates`, Then não há erro — ausência de linha é um estado válido (taxas ainda não configuradas).
  - Given um usuário salva as 2 taxas, When consulta de novo, Then só ele (via RLS) consegue ler/escrever sua própria linha.
  - Given um usuário com uma meta `active`, When tenta criar outra meta `active` no mesmo período, Then a meta anterior é automaticamente encerrada (`completed` ou `failed`, conforme progresso) antes da nova ser criada — nunca duas `active` simultâneas.
  - Given uma meta com `end_date` no passado, When consultada, Then seu `status` reflete o resultado (batida ou não, comparando profit acumulado do período vs `target_kk`).

### Story 6.2 — Conversor de Moeda (KK / TC / Reais)
- **Descrição:** Nova aba "Metas" na navegação (`src/App.jsx`) levando a `src/pages/Goals.jsx`. Seção de conversor com os 2 campos de taxa editáveis (KK por TC, Reais por 250 TC), persistidos via novo hook `src/hooks/useExchangeRates.js` (lendo/escrevendo em `exchange_rates`). Campo de input de valor em KK que mostra em tempo real o equivalente em TC e em Reais, usando as 2 taxas. Novo helper `src/lib/currencyConverter.js` (funções puras: kk↔TC, TC↔Reais respeitando o lote de 250) e `src/lib/kkFormat.js` (formatação de gold puro ↔ kk para exibição, já que hoje não existe nenhuma formatação em "kk" no código).
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given as 2 taxas configuradas, When o usuário digita um valor em KK, Then vê o equivalente em TC e em Reais calculado corretamente (Reais = `(KK / kk_per_tc) / 250 * brl_per_250tc`).
  - Given as taxas ainda não configuradas, When o usuário acessa o conversor, Then vê um estado vazio claro pedindo pra configurar as taxas antes de converter (sem erro/crash).
  - Given o usuário edita uma taxa, When salva, Then o valor persiste (upsert em `exchange_rates`) e é usado imediatamente no cálculo, sem precisar recarregar a página.

### Story 6.3 — Meta de Profit com Redistribuição Diária e Histórico
- **Descrição:** Dentro de `src/pages/Goals.jsx`, seção de meta: formulário pra criar meta (valor alvo em KK, data inicial, data final) usando novo hook `src/hooks/useGoals.js`. Painel de progresso mostrando: profit já feito no período (reaproveitando a mesma agregação de `useProfitStats`/`groupSessionsByDay`, escopo "todos os personagens"), quanto falta pro alvo, dias restantes, e a meta diária recalculada (`(alvo − feito) / dias_restantes`) — também convertida em TC e Reais via `currencyConverter.js`. Seção de histórico listando metas passadas com resultado (batida/não batida). Criar uma nova meta enquanto existe uma `active` encerra automaticamente a anterior (Story 6.1 garante isso no banco; aqui é só UI/confirmação).
- **Executor:** `@dev` · **Quality Gate:** `@architect` (lógica de recálculo) + `@ux-design-expert` (clareza do painel)
- **AC:**
  - Given uma meta ativa de 10kk de 01/09 a 10/09 (10 dias), When nenhum profit foi feito ainda, Then a meta diária exibida é 1kk/dia.
  - Given a mesma meta, When um dia passa sem nenhum profit registrado, Then no dia seguinte a meta diária recalculada aumenta corretamente para cobrir o déficit dividido pelos dias restantes (ex.: 0 feito no dia 1 → dia 2 em diante mostra 9kk / 9 dias = ainda 1kk/dia; se também nada for feito no dia 2, dia 3 mostra 9kk / 8 dias = 1,125kk/dia).
  - Given a meta é batida antes do `end_date`, When o painel é exibido, Then mostra claramente que a meta já foi atingida (sem pedir mais profit por dia).
  - Given o `end_date` passa sem o alvo ser atingido, When o usuário acessa a página, Then a meta aparece no histórico como não batida, com o resultado final.
  - Given metas passadas no histórico, When exibidas, Then mostram valor alvo, período, resultado e profit final acumulado.

### Story 6.4 — Cancelar Meta Ativa
- **Descrição:** Hoje a única forma de encerrar uma meta `active` é criar uma nova (Story 6.3), o que sempre grava um resultado (`completed`/`failed`) no histórico — inclusive quando o usuário só errou a data/valor ao criar a meta, poluindo o histórico com um "erro de digitação" disfarçado de meta perdida. Adicionar: (1) migration pequena ampliando o `check` constraint de `goals.status` pra aceitar `cancelled` além de `active`/`completed`/`failed`; (2) botão "Cancelar meta" no painel de progresso (`GoalProgress`, `src/pages/Goals.jsx`), com confirmação (mesmo padrão de `Modal` já usado no fluxo de substituir meta), que faz `update` pra `status: 'cancelled'` sem exigir criar uma nova meta no mesmo fluxo; (3) `GoalHistory` passa a tratar `cancelled` com um badge neutro (`variant="neutral"` do `Badge.jsx`), distinto de "Batida"/"Não batida".
- **Executor:** `@dev` · **Quality Gate:** `@data-engineer` (validação da migration)
- **Quality Gate Tools:** `[migration_review, logic_review]`
- **AC:**
  - Given uma meta `active`, When o usuário clica em "Cancelar meta" e confirma, Then a meta passa pra `status: 'cancelled'` e some do painel de progresso, sem exigir os campos de uma meta nova.
  - Given uma meta `cancelled` no histórico, When exibida, Then aparece com um resultado neutro (ex.: badge "Cancelada"), nunca como "Não batida" — evita confundir uma meta abandonada por engano com uma meta perdida de verdade.
  - Given nenhuma meta `active`, When o usuário acessa a página, Then não vê o botão "Cancelar meta" (só aparece quando há meta pra cancelar).

### Story 6.5 — Corrigir Unidade Monetária (Gold, não KK) e Formatação ao Digitar
- **Descrição:** **Correção de um erro de unidade encontrado depois do Epic 6 já em revisão (achado do usuário em 2026-08-31, não um pedido de feature nova):** a taxa "KK por TC" (Story 6.2) foi implementada tratando o valor digitado como KK (milhões), mas o valor real de mercado (ex.: "Issobra a 45.000 por TC") é em **gold puro** — 45.000 KK seria 45 bilhões de gold por TC, o que não existe no jogo. Isso obrigava a digitar valores em unidades diferentes no Conversor (gold) e na Meta (KK) pra representar o mesmo profit. Correção confirmada com o usuário: **todo campo monetário passa a ser gold puro** — sem nenhuma conversão/atalho em "kk" em nenhum input, consistente com `sessions.balance` (que já é gold puro desde o Epic 1). Escopo:
  - Renomear label e semântica de "KK por TC" pra "Gold por TC" (`RatesForm`); `currencyConverter.js` simplifica pra `goldToTc(gold, goldPerTc) = gold / goldPerTc` (sem etapa intermediária de kk).
  - `GoalForm` ("Meta") passa a receber o valor alvo direto em gold (remove a conversão `kkToGold`); `CurrencyConverter` ("Valor em KK") vira "Valor em Gold", mesma mudança.
  - Painéis de exibição (`Stat` — Meta/Já feito/Falta/meta diária, `GoalHistory`) trocam `formatKk` por formatação de gold puro com separador de milhar, no mesmo padrão já usado em `Profit.jsx` (`toLocaleString('pt-BR')`) — consistência com o resto do app, não só dentro da página Metas.
  - `src/lib/kkFormat.js` fica sem uso depois da migração acima — remover (não deixar código morto).
  - **Novo:** os 4 campos monetários (Gold por TC, Reais a cada 250 TC, Meta em Gold, Valor em Gold no conversor) passam a formatar o valor **enquanto o usuário digita** (ex.: digitar `45000` já mostra `45.000` no próprio campo; o de Reais mostra `R$ 47,50`) — novo componente reutilizável de input formatado (texto por trás, número por dentro), em vez do `<input type="number">` puro atual.
- **Executor:** `@dev` · **Quality Gate:** `@architect` (fórmula corrigida) + `@ux-design-expert` (comportamento do input formatado)
- **Quality Gate Tools:** `[logic_review, ux_consistency_review]`
- **AC:**
  - Given a taxa configurada como 45.000 (gold por TC) e um profit de 80.000.000 (80kk) de gold, When convertido, Then o resultado bate com a conta manual (`80.000.000 / 45.000 ≈ 1.777,78 TC`) — mesma ordem de grandeza nos dois lados, sem precisar digitar valores em unidades diferentes.
  - Given qualquer um dos 4 campos monetários, When o usuário digita números, Then o campo mostra o valor formatado (separador de milhar, ou `R$` com centavos no caso da taxa em reais) em tempo real, sem exigir recarregar ou sair do campo.
  - Given uma meta criada antes desta correção (valores salvos como se fossem KK×1.000.000), When exibida depois da correção, Then **não é recalculada silenciosamente** — como só existe 1 meta de teste até agora (nenhuma meta real do usuário foi criada em produção antes desta correção, confirmado pelo estágio atual do epic), não há dado de produção pra migrar; se isso mudar, tratar como bloqueio e escalar antes de prosseguir.

## Compatibility Requirements

- [ ] Nenhuma mudança em `sessions`, `useProfitStats` ou na página "Meu Profit" existente — este epic só lê o profit já calculado, não altera como ele é registrado.
- [ ] Taxas de câmbio e metas são por usuário (`auth.uid()`), seguindo exatamente o mesmo padrão de RLS já usado em `characters`/`sessions` — nenhuma exceção nova ao modelo de segurança.
- [ ] Valores monetários seguem o padrão já estabelecido (armazenar em unidade base consistente, formatar em kk só na exibição) — decisão final de tipo de coluna (`numeric` vs `bigint`) cabe ao `@data-engineer` na Story 6.1, mantendo compatibilidade com o formato de `sessions.balance`.

## Risk Mitigation

- **Risco:** Fórmula de redistribuição diária calculada errado gera meta diária absurda (ex.: negativa ou infinita quando `dias_restantes = 0` no último dia). **Mitigação:** `@architect` revisa a lógica de recálculo na Story 6.3, incluindo o caso-limite do último dia do período e do dia em que a meta já foi batida.
- **Risco:** Usuário não configura as taxas de câmbio e a meta fica sem conversão pra TC/Reais. **Mitigação:** Story 6.2 trata estado vazio explicitamente; Story 6.3 exibe a meta em KK mesmo sem taxas configuradas (TC/Reais aparecem só quando disponíveis).
- **Risco:** Criar uma meta nova sem querer encerra a meta ativa atual, perdendo progresso visível. **Mitigação:** confirmação explícita na UI antes de encerrar a meta ativa (Story 6.3); histórico preserva o resultado da meta encerrada (Story 6.1).
- **Risco (encontrado em revisão, não hipotético):** taxa de câmbio implementada com unidade errada (KK em vez de gold), forçando o usuário a digitar valores em escalas diferentes no Conversor e na Meta pro mesmo profit. **Mitigação:** Story 6.5 corrige a unidade pra gold puro em todos os campos monetários, eliminando a necessidade de conversão mental entre telas.
- **Risco:** Encerrar uma meta por engano (erro de digitação na criação) fica registrado como "Não batida" no histórico, sem diferenciar de uma meta perdida de verdade. **Mitigação:** Story 6.4 adiciona `status: cancelled`, com badge neutro no histórico.

## Definition of Done

- [x] Todas as 5 stories completas com AC atendidos (QA gate: 6.1 PASS, 6.2 CONCERNS, 6.3 CONCERNS, 6.4 PASS, 6.5 CONCERNS — todos os findings não bloqueantes, registrados como débito técnico)
- [x] Migrations 023-025 aplicadas em produção (RLS validada por leitura de código/padrão já em uso; não testada com 2 contas reais — risco baixo aceito)
- [x] Conversor funcionando com a taxa em gold (não KK) — Story 6.5
- [x] Meta com redistribuição diária correta, inclusive em dias sem profit e no fechamento do período — Story 6.3, unidade corrigida na 6.5
- [x] Histórico de metas passadas visível e com resultado correto, incluindo metas canceladas (Story 6.4)
- [x] Cancelamento de meta sem gerar resultado falso no histórico — Story 6.4
- [x] Nenhuma regressão em "Meu Profit" ou no registro de sessões existente
- [ ] Teste manual autenticado pelo usuário — **única pendência real**, nenhum agente desta pipeline teve acesso a credenciais de login em nenhum momento do epic

## Status: InReview

Todas as 5 stories completas e com QA gate: 6.1 PASS, 6.2 CONCERNS, 6.3 CONCERNS, 6.4 PASS, 6.5 CONCERNS — todos os findings não bloqueantes, registrados como débito técnico nas respectivas QA Results (nenhum causa perda de dados). As 3 migrations (023, 024, 025) foram aplicadas em produção pelo usuário, confirmadas sem erro.

**Pendências de texto/documentação (não bloqueantes):** erro de aritmética no texto do AC 2 da Story 6.3 (a implementação segue a fórmula correta, só o texto ilustrativo está errado) — pendente de correção por @po.

**Débito técnico acumulado (não bloqueante, mesmo padrão em 3 lugares):** `RatesForm`, `GoalForm` e `GoalProgress` (cancelar) não surfaceiam erro de operações que falham (save/create/cancel) — diverge do padrão já usado em `CharacterForm.jsx`/`AccountSettings.jsx`. Recomendo uma story futura pra padronizar, se priorizado.

**Pendência real antes de fechar o epic como Done:** nenhum agente desta pipeline (PM, SM, PO, Dev, QA) teve acesso a credenciais de login do usuário em nenhum momento — toda a validação das 5 stories foi por code review, scripts isolados pra lógica pura, lint e build. O fluxo autenticado completo (configurar taxas reais, converter, criar meta, ver redistribuição diária, cancelar, ver histórico) ainda não foi testado ao vivo por ninguém. Essa é a única coisa que falta pro epic virar `Done` de verdade.

**Pendência real antes de considerar o epic 100% fechado:** nenhuma verificação desta pipeline (dev nem QA) teve acesso às credenciais reais do usuário — toda a validação de 6.1-6.3 foi por code review, script isolado e lint/build. Recomendação: usuário testar manualmente (meta curta de 2-3 dias) só depois que 6.4 e 6.5 também estiverem prontas, já que 6.5 muda a unidade de entrada da meta.
