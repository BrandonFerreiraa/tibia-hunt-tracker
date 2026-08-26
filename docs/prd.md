# PRD — Tibia Hunt Tracker

**Responsável:** Morgan (PM) · **Status:** Draft → Ready for epic breakdown

## Goal

Plataforma multi-usuário onde jogadores de Tibia registram e comparam sessões de hunt (colando o texto do Session Analyser ou preenchendo manualmente), acompanham múltiplos personagens com histórico/estatísticas, e opcionalmente comparam desempenho com outros jogadores através de um feed de hunts compartilhadas.

## Target Users

Jogadores de Tibia, multi-usuário (cada um com conta própria e dados isolados).

## Tech Stack (decisões confirmadas)

| Camada | Escolha | Racional |
|---|---|---|
| Frontend | React 19 + Vite (SPA) | Já em uso no repo, leve, sem necessidade de SSR |
| Auth + DB | Supabase (Postgres + Auth + RLS) | Free tier generoso, sem backend próprio necessário |
| Deploy | Vercel (frontend) + Supabase (free tier) | 100% gratuito para este estágio |
| Parsing do Analyser | Client-side (regex) | Sem necessidade de backend para parsing |
| Dados externos de personagem | [TibiaData API](https://tibiadata.com) v4 (`api.tibiadata.com/v4/character/{name}`) | API pública e gratuita, mantida pela comunidade, dados oficiais do tibia.com |

### TibiaData API — campos confirmados (via swagger)

Disponível: `name`, `level`, `vocation`, `world`, `sex`, `account_status`, `achievement_points`, `unlocked_titles`, `residence`, `houses`, `married_to`, `comment`, `last_login`, `traded`, `guild`, `deaths`, `other_characters`, `former_names`, `position`, `title`.

**Não disponível:** `skills` (magic level, distância, etc.) — não são expostos por nenhuma API pública, só visíveis pelo próprio jogador no client. Comparação entre personagens fica limitada a level/vocação/guild/achievements, não skills.

Sem rate limit documentado; sem necessidade de API key.

## Constraints & decisões de processo

- **Sem Claude como co-author/contribuinte** em nenhum commit deste projeto.
- **AIOX (framework) nunca é versionado** — `.aiox-core/`, `.claude/`, `.github/agents/` etc. estão no `.gitignore`. Apenas `docs/` (stories/epics/PRD) é versionado, pois é artefato do produto, não do framework.
- **Verificação de posse de personagem:** o usuário cola, no campo `comment` do personagem em tibia.com, um código único gerado pelo nosso site; o backend confere via TibiaData API que o comentário contém o código antes de vincular o personagem à conta.

## Scope

### Epic 1 — Core Hunt Tracking (MVP)
Auth, gerenciamento de personagens, registro de sessão (parser automático + manual, com nome da hunt), listagem de sessões.
→ [epic.md](stories/epics/epic-1-core-hunt-tracking/epic.md)

### Epic 2 — Social & Character Verification
Verificação de posse de personagem via TibiaData API, exibição de stats do personagem (level/vocação/guild), feed de hunts compartilhadas (padrão compartilhado, toggle por sessão), filtros do feed.
→ [epic.md](stories/epics/epic-2-social-verification/epic.md)

### Backlog (Fase 3 — não priorizado)
- Export CSV
- Gráficos de evolução (profit/h, XP/h ao longo do tempo)
- Comparação lado-a-lado entre sessões

## Change Log

| Data | Mudança | Autor |
|---|---|---|
| 2026-08-26 | PRD inicial criado; Epic 1 e Epic 2 definidos | Morgan (@pm) |
