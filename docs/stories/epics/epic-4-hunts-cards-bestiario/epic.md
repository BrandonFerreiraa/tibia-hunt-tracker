---
id: epic-4
title: Hunts em Cards + Bestiário TibiaData
status: Done
depends_on: epic-3
---

# Epic 4: Hunts em Cards + Bestiário TibiaData — Brownfield Enhancement

## Epic Goal

Redesenhar a listagem de hunts (próprias e compartilhadas) em um grid de cards mais elegante, e enriquecer os detalhes de cada hunt com informações reais dos monstros mortos (imagem, HP, XP, loot, resistências) vindas da API pública da TibiaData (https://github.com/tibiadata), com um cache local no Supabase para não depender de chamadas ao vivo na API externa.

## Epic Description

**Existing System Context:**
- `src/pages/HuntsFeed.jsx` e `src/components/SessionList.jsx` hoje renderizam hunts como uma lista vertical de `Card` simples (`<ul><Card as="li">`), sem grid e sem estado de "detalhe expandido" consistente entre as duas telas.
- `SessionList.jsx` já expande inline (`SessionDetails`) mostrando `session_monsters` (nome + quantidade) e `session_items` (nome + quantidade) via query direta ao Supabase — mas só texto puro, sem imagem nem stats do monstro.
- `HuntsFeed.jsx` só mostra um resumo de texto (`hunt.top_monsters`) e não tem detalhe expandido nenhum.
- `session_monsters.monster_name` é texto livre (extraído do parser do Session Analyser) — não existe hoje nenhum vínculo com um identificador estável (`race`) da TibiaData.
- Não existe integração alguma com a TibiaData API para dados de criaturas (só personagens/highscores, via `src/lib/tibiaDataClient.js`).
- As tabelas `session_monsters`/`session_items` não estão versionadas em `supabase/migrations/` (criadas fora do controle de migration) — qualquer nova migration que referencie essas tabelas deve ser validada contra o schema real do projeto Supabase antes de aplicar.

**Enhancement Details:**
- **Cache de criaturas:** nova tabela `creatures` no Supabase (`name`, `race` slug, `image_url`, `hitpoints`, `experience_points`, `is_lootable`, `loot_list` jsonb, `immune`/`strong`/`weakness` jsonb, `synced_at`). Populada sob demanda (lazy cache): quando um monstro de uma hunt precisa ser exibido e ainda não está cacheado (ou está desatualizado), o client busca em `/v4/creature/{race}` e faz upsert. Resolução de `monster_name` (texto livre) → `race` (slug da API) via normalização simples (lowercase, remove acentos/espaços) com fallback gracioso: se a API não encontrar o monstro, o card mostra o nome sem enriquecimento (nunca quebra a tela).
- **Cards de hunt:** substituir a lista vertical atual por um grid de cards (`SessionList` e `HuntsFeed`) com visual mais elegante — nome da hunt, data, duração, XP/h, profit/h, badges existentes (Sua hunt / Verificado), e uma faixa de mini-ícones dos monstros mortos (imagem pequena da TibiaData, com fallback de emoji/placeholder se a criatura não for encontrada na API).
- **Modal de detalhes:** clicar em qualquer card (própria ou compartilhada) abre um modal/overlay único e reutilizável com: resumo completo da hunt (duração, XP gain, profit, XP/h, profit/h), lista de monstros mortos (quantidade + imagem + HP + XP + loot conhecido, expansível por monstro) e lista de itens lootados — substituindo o `SessionDetails` inline atual por esse modal compartilhado entre as duas telas.
- Success criteria: hunts próprias e compartilhadas exibidas em grid de cards visualmente consistente; clicar em um card abre modal com detalhes completos incluindo dados reais de monstro (imagem, HP, XP, loot) quando disponíveis na TibiaData; ausência de dado de monstro (API fora do ar ou monstro não encontrado) nunca quebra a tela, só omite o enriquecimento.

## Stories

### Story 4.1 — Cache de Criaturas TibiaData (Supabase)
- **Descrição:** Migration criando a tabela `creatures` (schema acima). Novo módulo `src/lib/tibiaDataClient.js` (extensão): `fetchCreature(race)` (já existe o padrão de erro de `fetchCharacter`, seguir o mesmo). Novo helper `src/lib/creaturesCache.js` (ou hook `useCreature(monsterName)`): normaliza `monster_name` → slug candidato, verifica cache (`creatures` table) por nome normalizado, se ausente ou expirado (ex.: `synced_at` > 30 dias) busca na API e faz upsert, retorna `null` silenciosamente em qualquer falha (404, rede, timeout) sem lançar erro pra UI.
- **Executor:** `@dev` · **Quality Gate:** `@data-engineer` (schema/RLS da tabela `creatures`) + `@architect` (estratégia de cache lazy vs. sync)
- **AC:**
  - Given um `monster_name` que corresponde a uma criatura existente na TibiaData e ainda não cacheada, When o helper é chamado, Then a criatura é buscada na API, salva em `creatures` e retornada com `hitpoints`, `experience_points`, `image_url`, `loot_list`.
  - Given um `monster_name` já cacheado e recente, When o helper é chamado, Then nenhuma chamada à API externa é feita — retorna direto do Supabase.
  - Given um `monster_name` que não corresponde a nenhuma criatura na TibiaData (404) ou a API está indisponível, When o helper é chamado, Then retorna `null` sem lançar exceção e sem quebrar quem chamou.
  - Given a tabela `creatures`, When lida por qualquer usuário autenticado, Then RLS permite `select` público (dado não sensível, só cache de API pública); só a aplicação (via helper) faz `insert`/`update`.

### Story 4.2 — Cards de Hunt (Grid Visual + Mini-ícones de Monstro)
- **Descrição:** Refatorar `SessionList.jsx` e `HuntsFeed.jsx` para renderizar as hunts em um grid de cards (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` ou similar, seguindo o design system Tailwind já usado em `ui/Card.jsx`) em vez da lista vertical atual. Cada card mostra: nome da hunt, data, duração (`H:MM`), XP/h, profit/h, badges existentes (Sua hunt, Verificado), e uma faixa horizontal de até ~5 mini-imagens dos monstros mortos (via `useCreature`/cache da Story 4.1), com "+N" se houver mais. Extrair um componente compartilhado `HuntCard` (novo, em `src/components/HuntCard.jsx`) usado pelas duas telas, evitando duplicar o layout do card.
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given a tela Hunts (Dashboard) ou Hunts Compartilhadas, When carregada, Then as hunts são exibidas em um grid de cards (não mais lista vertical), responsivo (1 coluna no mobile, mais colunas em telas largas).
  - Given uma hunt com monstros registrados em `session_monsters`, When o card renderiza, Then exibe as mini-imagens dos monstros encontrados na TibiaData (via cache), com fallback visual (placeholder) para monstros não encontrados — sem quebrar o layout do card.
  - Given as duas telas (Dashboard e Hunts Compartilhadas), When comparadas, Then usam o mesmo componente `HuntCard` para o layout base, sem duplicação de JSX de card.
  - Given os filtros/badges/ordenação já existentes em `HuntsFeed` (Story 3.4, 2.3, 2.4), When o grid é aplicado, Then continuam funcionando normalmente.

### Story 4.3 — Modal de Detalhes da Hunt (com Dados de Monstro)
- **Descrição:** Novo componente `src/components/HuntDetailModal.jsx`, aberto ao clicar em qualquer `HuntCard` (própria ou compartilhada). Conteúdo: resumo da hunt (duração, XP gain, XP/h, profit, profit/h — reaproveitando dados já disponíveis, sem novos campos de party/dano conforme decisão de escopo), lista de monstros mortos com quantidade + imagem + HP + XP + loot conhecido (expandível por monstro, dados via `useCreature`), e lista de itens lootados (`session_items`, como já existe em `SessionDetails`). Substitui o padrão de expansão inline (`SessionDetails`) por este modal, reutilizado em `SessionList` e `HuntsFeed`.
- **Executor:** `@dev` · **Quality Gate:** `@qa` (fallbacks de API) + `@ux-design-expert` (layout do modal)
- **AC:**
  - Given qualquer `HuntCard` (própria ou compartilhada), When clicado, Then abre um modal/overlay com o resumo completo da hunt, sem navegar para uma nova URL.
  - Given a lista de monstros mortos na hunt, When o modal exibe cada um, Then mostra imagem, HP e XP quando a criatura é encontrada na TibiaData, e mostra só o nome + quantidade (sem quebrar) quando não é encontrada.
  - Given o usuário expande um monstro específico no modal, When expandido, Then exibe o `loot_list` conhecido daquela criatura (dado estático da TibiaData, não o loot real da hunt).
  - Given o modal aberto, When o usuário fecha (X, clique fora, ou Esc), Then o modal fecha sem side-effects e sem re-fetch desnecessário se reaberto para a mesma hunt.

## Compatibility Requirements

- [ ] Hunts já registradas continuam sendo exibidas normalmente após a migration da tabela `creatures` (tabela nova, sem alteração em `sessions`/`session_monsters`/`session_items`).
- [ ] Filtros, ordenação e badges já existentes em `HuntsFeed` (Épicos 2 e 3) continuam funcionando com o novo grid de cards.
- [ ] Ausência ou instabilidade da TibiaData API nunca impede a visualização de uma hunt — enriquecimento de monstro é sempre best-effort.

## Risk Mitigation

- **Risco:** `session_monsters.monster_name` (texto livre do parser) não bater com o slug (`race`) esperado pela TibiaData API (nomes compostos, plural, variações de digitação). **Mitigação:** normalização best-effort (Story 4.1) + fallback silencioso sem imagem/stats quando não encontrado — nunca bloqueia a exibição da hunt.
- **Risco:** Tabelas `session_monsters`/`session_items` não estão em `supabase/migrations/` — schema real pode divergir do assumido. **Mitigação:** `@data-engineer` inspeciona o schema real do projeto Supabase (via `supabase db diff` ou dashboard) antes de escrever queries/migration da Story 4.1, e documenta o schema existente como parte da migration se ainda não estiver versionado.
- **Risco:** Rate limit da TibiaData API se muitos usuários abrirem hunts com monstros não cacheados ao mesmo tempo. **Mitigação:** cache é por criatura (não por hunt/usuário) — depois do primeiro usuário buscar um monstro, todos os demais reaproveitam o cache do Supabase.

## Definition of Done

- [x] Todas as stories com AC atendidos
- [x] Grid de cards aplicado em Dashboard (hunts próprias) e Hunts Compartilhadas
- [x] Modal de detalhes único, reutilizado nas duas telas, substituindo a expansão inline atual
- [x] Pelo menos um monstro real testado (ex.: Demon, via smoke test direto contra a API real — HP 8200, XP 6000, loot completo)
- [x] Fallback validado: monstro não encontrado (API retorna HTTP 400, não 404 — descoberto e corrigido durante a Story 4.1) não quebra card nem modal

## Status: Done (2026-08-28)

Todas as stories completas: 4.1 (cache de criaturas — migration `016_creatures.sql`, `fetchCreature`/`getCreature`), 4.2 (grid de cards — `HuntCard`, `MonsterIconStrip`, `useCreature`), 4.3 (modal de detalhes — `Modal`, `HuntDetailModal`).

**Achado relevante durante a implementação:** as policies de RLS de `session_monsters`/`session_items` só permitiam ao dono da sessão ler seus próprios monstros/itens — sem correção, o modal de detalhes ficaria vazio para hunts de OUTROS usuários no feed compartilhado (o caso de uso principal pedido: "ver os monstros da hunt de alguém"). Corrigido com a migration `017_public_session_details.sql` (views `public_session_monsters`/`public_session_items`, mesmo padrão de segurança de `public_hunts_feed`).

**Pendências de infraestrutura (fora do escopo de código):** aplicar as migrations `016_creatures.sql` e `017_public_session_details.sql` em produção. Até lá, o app funciona normalmente mas sem o enriquecimento de monstro (degradação graciosa, por design).

**Pendência de QA:** todas as stories fecharam com verdict CONCERNS (não bloqueante) — falta um clique manual autenticado ponta-a-ponta com uma conta real (própria e visualizando hunt de outro usuário), já que o QA automatizado não tem credenciais de conta.
