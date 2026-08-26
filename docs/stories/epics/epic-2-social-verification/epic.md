---
id: epic-2
title: Social & Character Verification
status: Draft
depends_on: epic-1
---

# Epic 2: Social & Character Verification — Brownfield Enhancement

## Epic Goal

Vincular personagens a dados reais do Tibia (via TibiaData API) com verificação de posse, e permitir que jogadores comparem hunts através de um feed de sessões compartilhadas.

## Epic Description

**Existing System Context:**
- Epic 1 entrega personagens "auto-declarados" (nome + mundo digitados pelo usuário, sem validação).
- Stack: Supabase (Postgres + Auth + RLS), TibiaData API (`api.tibiadata.com/v4/character/{name}`) para dados públicos.

**Enhancement Details:**
- Adicionar fluxo de verificação de posse do personagem.
- Sincronizar e exibir dados reais do personagem (level, vocação, guild, achievement points).
- Criar página `/hunts` (feed) com sessões marcadas como compartilhadas — **padrão: compartilhado**, com toggle por sessão para tornar privada.
- Success criteria: um personagem cadastrado mostra selo de "verificado" com level/vocação reais; o feed público lista hunts de todos os usuários que não optaram por privacidade, com filtros úteis.

## Stories

### Story 2.1 — Verificação de Posse de Personagem
- **Descrição:** Ao cadastrar/vincular um personagem, o sistema gera um código único; o usuário cola esse código no campo "comment" do personagem em tibia.com; o backend confere via TibiaData API (`comment` contém o código) e marca o personagem como verificado.
- **Executor:** `@dev` · **Quality Gate:** `@architect` (foco em segurança: um personagem só pode ser verificado por uma conta)
- **AC:**
  - Given usuário inicia verificação, When sistema gera código, Then código expira em 24h se não usado.
  - Given código colado corretamente no comment do personagem, When backend consulta a API, Then personagem é marcado `verified = true` e vinculado à conta.
  - Given personagem já verificado por outra conta, When um segundo usuário tenta verificar o mesmo nome, Then a tentativa é bloqueada (constraint única em `character_name`).

### Story 2.2 — Sync de Stats do Personagem (level/vocação/guild + skill via highscore)
- **Descrição:** Buscar e cachear periodicamente (ex: ao abrir o perfil, ou 1x/dia) os dados públicos do personagem via TibiaData API: level, vocação, mundo, guild, achievement_points.
  Adicionalmente, exibir a **skill principal do personagem** (valor exato + rank) usando o endpoint de highscores (`/v4/highscores/{world}/{category}/{vocation}/{page}`), mapeando a skill relevante por vocação: Knight → `clubfighting`/`axefighting`/`swordfighting`/`shielding` (a maior das quatro); Paladin → `distancefighting`; Druid/Sorcerer → `magiclevel`.
- **Executor:** `@dev` · **Quality Gate:** `@data-engineer` (estratégia de cache/refresh)
- **Restrição técnica confirmada (via swagger da TibiaData API):**
  - O endpoint de highscores só é paginado por rank — **não existe busca por nome de personagem**. Achar um personagem específico exigiria varrer página por página do ranking, o que é inviável em tempo real e agressivo demais para rodar em lote em todos os mundos/categorias contra uma API comunitária gratuita.
  - **Escopo adotado:** varrer só uma faixa limitada do ranking (ex: até a página correspondente ao top 1.000) da skill/vocação/mundo do personagem. Cada linha retornada pelo highscores já inclui o campo `value` — ou seja, ao encontrar o personagem nessa faixa, **já temos o valor exato da skill sem custo extra**, não só a posição. Exibir ambos: "Sword Fighting 108 (Top 340, Vunira)".
  - Se o personagem **não aparecer** dentro da faixa varrida (fora do top 1.000), não exibir nada de skill — sem erro, sem "skill: 0", sem estimativa inventada. Isso é uma limitação de alcance da varredura, não uma indisponibilidade do dado em si.
- **AC:**
  - Given personagem verificado, When página de perfil é aberta, Then mostra level/vocação/guild atualizados (cache com timestamp "atualizado há X").
  - Given o personagem aparece dentro da faixa varrida do highscore da sua skill principal, When o perfil carrega, Then exibe o valor exato da skill junto com o rank (posição + categoria + mundo).
  - Given o personagem NÃO aparece na faixa varrida, When o perfil carrega, Then nenhum dado de skill é exibido (sem erro visível ao usuário).
  - Given a API do TibiaData está fora do ar, When o sync falha, Then o sistema mostra o último dado em cache sem quebrar a página (degradação graciosa).

### Story 2.3 — Feed de Hunts Compartilhadas
- **Descrição:** Página `/hunts` listando sessões com `is_shared = true` (padrão ao salvar uma sessão), mostrando personagem (com level/vocação verificados, se disponível), nome da hunt, duração, profit/h, XP/h, top monstros. Toggle por sessão em "minhas sessões" para marcar como privada.
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given uma sessão recém-salva, When não alterado, Then `is_shared = true` por padrão.
  - Given usuário marca uma sessão como privada, When outro usuário acessa `/hunts`, Then essa sessão não aparece.
  - Given feed carregado, When usuário aplica filtro por monstro/mundo/vocação, Then lista é atualizada de acordo.

### Story 2.4 — Filtros e Ordenação do Feed
- **Descrição:** Filtros combináveis (monstro, mundo, vocação, faixa de data) e ordenação (mais recente, maior profit/h, maior XP/h).
- **Executor:** `@dev` · **Quality Gate:** `@architect`
- **AC:**
  - Given múltiplos filtros aplicados simultaneamente, When resultado é vazio, Then mensagem clara de "nenhuma hunt encontrada" é exibida (sem erro).

## Compatibility Requirements

- [ ] Personagens não-verificados continuam funcionando normalmente (verificação é opcional, não bloqueia o uso do Epic 1).
- [ ] `is_shared` default `true` é comunicado claramente na UI (tooltip/onboarding) para não surpreender o usuário.

## Risk Mitigation

- **Risco:** Alguém tenta verificar personagem que não é seu. **Mitigação:** exige acesso de escrita ao comment do personagem em tibia.com (só o dono tem) + constraint única por nome de personagem.
- **Risco:** TibiaData API instável/fora do ar. **Mitigação:** cache local + degradação graciosa (Story 2.2).
- **Risco:** Usuário se sente exposto pelo padrão "compartilhado". **Mitigação:** onboarding explícito + toggle de fácil acesso por sessão.

## Definition of Done

- [ ] Todas as stories com AC atendidos
- [ ] Fluxo de verificação testado ponta-a-ponta com um personagem real
- [ ] Feed testado com sessões públicas e privadas de múltiplas contas
