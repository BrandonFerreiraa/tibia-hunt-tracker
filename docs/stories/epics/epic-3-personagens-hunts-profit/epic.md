---
id: epic-3
title: Reestruturação de Navegação — Personagens, Hunts e Profit
status: Done
depends_on: epic-2
---

# Epic 3: Reestruturação de Navegação — Personagens, Hunts e Profit — Brownfield Enhancement

## Epic Goal

Separar claramente "cadastrar personagem" de "registrar hunt", introduzir personagens do tipo maker, mover gestão de conta para uma tela de Configurações dedicada, distinguir hunts próprias de compartilhadas, formatar duração em horas:minutos, e adicionar uma tela de Profit (diário/semanal/mensal) para o usuário acompanhar seus ganhos.

## Epic Description

**Existing System Context:**
- Hoje o Dashboard (`src/pages/Dashboard.jsx`) mistura cadastro de personagem (`CharacterForm`/`CharacterList`) e registro de sessão/hunt (`SessionForm`/`SessionList`) na mesma tela.
- A navegação (`src/App.jsx`) só tem 2 abas: "Minhas Hunts" (Dashboard) e "Feed" (`HuntsFeed.jsx`, feed público de todos os usuários, sem distinguir autoria).
- `characters` (tabela Supabase) não tem noção de tipo (principal vs maker) — todo personagem é tratado igual.
- Duração de sessão é exibida sempre em minutos brutos (`Math.round(duration_seconds / 60)} min`) em `SessionForm`, `SessionList` e `HuntsFeed` — sem conversão para `H:MM`.
- Não existe tela de ajustes de conta (troca de senha) nem tela de análise de profit por período.

**Enhancement Details:**
- Nova aba **Configurações**: único lugar para cadastrar/editar/remover personagens (principal ou maker) e trocar a senha da conta.
- Tela **Hunts** simplificada: só seleciona um personagem já cadastrado e cola o texto do Session Analyser — sem nenhum CRUD de personagem ali.
- Duração convertida de minutos para `H:MM` (ex.: 159 min → `2:39`) em todos os lugares onde hoje aparece em minutos brutos.
- Tela **Hunts Compartilhadas** (renomeação do Feed atual): mesma listagem de todos os usuários, mas com destaque visual (badge) nas hunts que são do próprio usuário.
- Nova tela **Meu Profit**: profit agregado por dia, com visões diária/semanal/mensal e possibilidade de selecionar um dia específico para ver quanto foi feito naquele dia.
- Success criteria: personagem principal e makers cadastrados só em Configurações; tela Hunts não permite mais criar personagem; toda duração exibida em `H:MM`; feed compartilhado destaca hunts próprias; usuário consegue ver profit do dia/semana/mês e navegar entre dias.

## Stories

### Story 3.1 — Configurações: Cadastro de Personagens (Principal/Maker)
- **Descrição:** Nova aba "Configurações" na navegação. Mover `CharacterForm`/`CharacterList` (cadastro, verificação, stats, remoção) do Dashboard para essa tela. Adicionar campo de tipo no cadastro (`principal` | `maker`), default `principal`. Migration adicionando coluna `type` em `characters` (enum ou check constraint, default `'principal'`). Tipo é só uma etiqueta exibida na lista — não muda nenhum comportamento (verificação, sync de stats, participação no feed funcionam igual para os dois tipos).
- **Executor:** `@dev` · **Quality Gate:** `@architect` (revisão de nav shell) + `@data-engineer` (migration)
- **AC:**
  - Given usuário acessa Configurações, When a tela carrega, Then vê a lista de personagens já cadastrados com o tipo de cada um (Principal/Maker) e o formulário de cadastro.
  - Given usuário cadastra um personagem em Configurações, When escolhe o tipo "Maker", Then o personagem é salvo com `type = 'maker'` e aparece na lista com essa etiqueta.
  - Given o Dashboard/Hunts, When a tela carrega, Then não existe mais nenhum formulário de cadastro/remoção de personagem ali.

### Story 3.2 — Configurações: Ajustes de Conta (Trocar Senha)
- **Descrição:** Seção "Conta" dentro de Configurações com formulário de troca de senha (via `supabase.auth.updateUser({ password })`), pedindo confirmação da nova senha.
- **Executor:** `@dev` · **Quality Gate:** `@qa` (foco em validação de formulário e mensagens de erro do Supabase Auth)
- **AC:**
  - Given usuário informa nova senha e confirmação iguais (mínimo de caracteres exigido pelo Supabase Auth), When envia o formulário, Then a senha é atualizada e uma mensagem de sucesso é exibida.
  - Given confirmação de senha diferente da nova senha, When usuário tenta enviar, Then o formulário bloqueia o envio com mensagem de erro, sem chamar a API.
  - Given a API do Supabase retorna erro (ex.: senha fraca), When o envio falha, Then a mensagem de erro da API é exibida ao usuário sem quebrar a tela.

### Story 3.3 — Tela Hunts: Registro Simplificado + Duração em H:MM
- **Descrição:** Reescrever a tela Hunts para conter apenas: (1) um seletor do personagem ativo entre os já cadastrados em Configurações, (2) o formulário de colar o texto do Session Analyser (`SessionForm`, sem alterações no parser), (3) a lista das hunts já registradas para o personagem selecionado. Criar util de formatação `formatDuration(seconds)` → `H:MM` (ex.: `9540` segundos / 159 min → `"2:39"`) e aplicar em `SessionForm` (preview), `SessionList` e `HuntsFeed`, substituindo todo `Math.round(duration_seconds / 60)} min`.
- **Executor:** `@dev` · **Quality Gate:** `@architect`
- **AC:**
  - Given nenhum personagem cadastrado, When usuário acessa Hunts, Then vê uma mensagem orientando a cadastrar um personagem em Configurações (com link/atalho para lá) — sem formulário de cadastro nessa tela.
  - Given uma sessão com `duration_seconds = 9540` (159 min), When exibida em qualquer lista (Hunts, Hunts Compartilhadas), Then aparece formatada como `2:39`.
  - Given `duration_seconds` menor que 3600 (ex.: 5 min = 300s), When exibida, Then aparece como `0:05` (sempre `H:MM`, sem omitir a hora zero).

### Story 3.4 — Hunts Compartilhadas: Destaque de Hunts Próprias
- **Descrição:** Renomear a aba "Feed" para "Hunts Compartilhadas" na navegação. Na listagem (`HuntsFeed`), identificar quais hunts pertencem a personagens do usuário logado e exibir um badge (ex.: "Sua hunt") nesses cards, mantendo a listagem única com todos os usuários (sem aba/filtro separado).
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given uma hunt compartilhada pertence a um personagem do usuário logado, When a lista carrega, Then o card dessa hunt exibe o badge "Sua hunt".
  - Given uma hunt compartilhada pertence a outro usuário, When a lista carrega, Then o card não exibe o badge.
  - Given os filtros/ordenação existentes (monstro, mundo, vocação, data, sort), When aplicados, Then continuam funcionando normalmente com o badge presente.

### Story 3.5 — Tela Meu Profit (Diário/Semanal/Mensal)
- **Descrição:** Nova aba "Meu Profit" agregando o `balance` das sessões do usuário (todos os seus personagens) por dia. Três visões alternáveis: Diário (profit de hoje ou do dia selecionado), Semanal (soma dos últimos 7 dias / semana corrente, com quebra por dia) e Mensal (soma do mês corrente, com quebra por dia/semana). Usuário pode selecionar um dia específico (ex.: numa lista ou calendário simples) para ver o profit total feito naquele dia e as hunts que compõem esse total.
- **Executor:** `@dev` · **Quality Gate:** `@data-engineer` (estratégia de agregação/query) + `@architect`
- **AC:**
  - Given sessões registradas em dias diferentes, When usuário abre "Meu Profit" na visão Diária, Then vê o profit total do dia atual por padrão.
  - Given a visão Semanal ou Mensal, When selecionada, Then mostra o profit agregado do período com quebra por dia (ex.: gráfico de barras ou lista dia a dia).
  - Given usuário clica/seleciona um dia específico, When o dia tem hunts registradas, Then vê o profit total daquele dia e a lista das hunts que contribuíram para ele.
  - Given um dia sem nenhuma hunt registrada, When selecionado, Then exibe profit `0` sem erro.

### Story 3.6 — Excluir Hunt Registrada
- **Descrição:** Hoje não existe nenhuma forma de excluir uma hunt já registrada (nem em `SessionList.jsx`, nem em `HuntDetailModal.jsx`) — o RLS de `sessions` já permite `delete` pelo dono (`for all`, herdado de `characters.user_id`), só falta a funcionalidade na UI. Adicionar um botão "Excluir" direto no card da hunt (`SessionList.jsx`, ao lado do botão existente de compartilhar/tornar privada), com confirmação (`window.confirm`, mesmo padrão já usado em `Settings.jsx#handleRemoveCharacter` pra remover personagem) antes de excluir. `session_monsters`/`session_items` têm `on delete cascade` pra `sessions` (`schema.sql`), então excluir a sessão já limpa os registros relacionados automaticamente, sem código extra. **Decisão de escopo (confirmada com o usuário):** sem usuário admin — cada dono só exclui as próprias hunts, mesmo modelo de permissão já usado em todo o resto do app (RLS por `user_id`).
- **Executor:** `@dev` · **Quality Gate:** `@architect`
- **AC:**
  - Given uma hunt registrada, When o usuário clica em "Excluir" no card e confirma, Then a hunt some da lista e é removida do banco (incluindo `session_monsters`/`session_items` relacionados, via cascade).
  - Given o usuário clica em "Excluir" mas cancela a confirmação, When a caixa de confirmação é fechada sem confirmar, Then nada é excluído e a hunt continua na lista.
  - Given a hunt excluída estava compartilhada (`is_shared = true`), When removida, Then também some da tela "Hunts Compartilhadas" (consequência natural do `delete`, sem lógica extra — a view pública já depende da linha existir em `sessions`).

## Compatibility Requirements

- [ ] Personagens já cadastrados continuam funcionando normalmente após a migration de `type` (default `'principal'` para registros existentes).
- [ ] Sessões/hunts já registradas continuam exibindo corretamente com a nova formatação `H:MM` (sem necessidade de migration de dados, só mudança de exibição).
- [ ] Nenhuma funcionalidade de verificação de personagem (Epic 2) ou sync de stats é alterada — só o local onde vivem na UI.

## Risk Mitigation

- **Risco:** Migration da coluna `type` quebrar leitura de personagens existentes. **Mitigação:** default `'principal'` + coluna nullable-safe, testado em dados existentes antes do deploy.
- **Risco:** Mudar `duration_seconds → min` para `H:MM` em múltiplos componentes gerar inconsistência. **Mitigação:** util único `formatDuration()` reutilizado em todos os pontos (Story 3.3), sem lógica duplicada.
- **Risco:** Agregação de profit por dia (Story 3.5) ficar lenta com muitas sessões. **Mitigação:** @data-engineer define a query/índice adequado (agregação no banco via `GROUP BY` de data, não em memória no client).

## Definition of Done

- [x] Todas as stories com AC atendidos
- [x] Navegação final com 4 abas: Hunts, Hunts Compartilhadas, Meu Profit, Configurações
- [x] Nenhum cadastro/remoção de personagem fora de Configurações
- [x] Duração em `H:MM` validada com pelo menos um caso de teste (159 min → 2:39)
- [x] Troca de senha testada ponta-a-ponta com uma conta real (validado manualmente pelo usuário na Story 3.2, incluindo tradução do erro "mesma senha")
- [x] Usuário consegue excluir uma hunt registrada direto do card, com confirmação — Story 3.6

## Status: Done (reaberto e refechado em 2026-08-31)

Stories 3.1-3.5 completas desde 2026-08-27 (ver histórico abaixo). **Story 3.6 (Excluir Hunt Registrada) adicionada e concluída em 2026-08-31**, a partir de feedback do usuário — hoje não existia forma de excluir uma hunt já registrada. Decisão de escopo confirmada com o usuário: exclusão só pelo próprio dono (mesmo modelo de RLS já usado em todo o app), sem usuário admin. QA Gate: PASS, sem findings.

### Histórico (fechamento original, 2026-08-27)

Todas as stories completas: 3.1 (Configurações — cadastro Principal/Maker), 3.1.1 (fast-follow: regra de Principal único, criada a partir de feedback do usuário em teste manual), 3.2 (troca de senha), 3.3 (Hunts simplificada + duração H:MM), 3.4 (Hunts Compartilhadas + badge de autoria, preservando a decisão de privacidade da Story 2.3), 3.5 (Meu Profit — diário/semanal/mensal).

Pendências de infraestrutura (fora do escopo de código): aplicar as migrations `014_character_type.sql` e `015_feed_character_id.sql` em produção, se ainda não aplicadas.
