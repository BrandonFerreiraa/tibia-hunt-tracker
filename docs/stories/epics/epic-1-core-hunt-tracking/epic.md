---
id: epic-1
title: Core Hunt Tracking
status: Done
---

# Epic 1: Core Hunt Tracking — Brownfield Enhancement

## Epic Goal

Permitir que um jogador crie conta, cadastre personagens e registre sessões de hunt (via texto do Session Analyser ou manualmente), com visualização clara de loot, supplies, profit, XP e monstros mortos por sessão.

## Epic Description

**Existing System Context:**
- Scaffold React 19 + Vite existente ([src/](../../../../src)), sem auth/backend ainda — só um formulário local em `localStorage`.
- Stack alvo definida no [PRD](../../../prd.md): Supabase (Auth + Postgres + RLS), deploy Vercel.

**Enhancement Details:**
- Substituir o armazenamento em `localStorage` por Supabase (Auth + Postgres).
- Adicionar suporte a múltiplos personagens por usuário.
- Adicionar parser client-side do texto do Session Analyser (formato colado do jogo).
- Adicionar campo obrigatório **"Nome da hunt"** tanto no fluxo automático (parser) quanto no manual.
- Success criteria: usuário consegue criar conta, cadastrar personagem, colar o texto do analyser (ou preencher manualmente), nomear a hunt, salvar, e ver a sessão listada com todos os campos do analyser.

## Modelo de Dados (proposto)

```
characters(id, user_id, name, world, created_at)
sessions(id, character_id, hunt_name, started_at, ended_at, duration_seconds,
         raw_xp_gain, xp_gain, xp_per_hour, raw_xp_per_hour,
         loot, supplies, balance, damage, damage_per_hour, healing, healing_per_hour,
         source, created_at)  -- source: 'parsed' | 'manual'
session_monsters(id, session_id, monster_name, quantity)
session_items(id, session_id, item_name, quantity)
```

RLS: cada tabela filtra por `characters.user_id = auth.uid()` (via join/policy).

## Stories

### Story 1.1 — Supabase Schema & Auth Setup
- **Descrição:** Criar projeto Supabase, tabelas acima com RLS, configurar Supabase Auth (email/senha) no frontend.
- **Executor:** `@data-engineer` · **Quality Gate:** `@architect`
- **AC:**
  - Given um usuário não autenticado, When acessa o site, Then é redirecionado para login/signup.
  - Given um usuário autenticado A, When consulta sessions, Then só vê registros de personagens vinculados à sua conta (RLS testado com 2 contas).

### Story 1.2 — Gerenciamento de Personagens
- **Descrição:** Tela para o usuário adicionar/remover/selecionar personagens (nome + mundo).
- **Executor:** `@dev` · **Quality Gate:** `@architect`
- **AC:**
  - Given usuário logado, When adiciona personagem com nome e mundo, Then personagem aparece na lista e pode ser selecionado como ativo.

### Story 1.3 — Registro de Sessão (Parser + Manual + Nome da Hunt)
- **Descrição:** Campo de texto para colar o Session Analyser → parse automático (regex) preenchendo preview editável; formulário manual como alternativa. Campo "Nome da hunt" obrigatório em ambos os fluxos.
- **Executor:** `@dev` · **Quality Gate:** `@architect`
- **AC:**
  - Given o usuário cola o texto do analyser (formato de exemplo no PRD), When confirma, Then todos os campos (duração, XP, raw XP, loot, supplies, balance, damage, healing, monstros mortos, itens) são extraídos corretamente e exibidos para revisão antes de salvar.
  - Given o parser não reconhece o texto colado, When o usuário tenta salvar, Then é oferecido o formulário manual sem perda dos dados já digitados.
  - Given qualquer fluxo (parser ou manual), When falta o campo "Nome da hunt", Then o formulário bloqueia o salvamento.

### Story 1.4 — Listagem e Detalhe de Sessões
- **Descrição:** Lista de sessões do personagem ativo (nome da hunt, data, duração, profit, XP/h) com expansão para ver monstros mortos e itens lootados.
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given personagem com sessões salvas, When usuário abre a lista, Then vê cards ordenados por data (mais recente primeiro) com os campos-chave visíveis e monstros/itens expansíveis.

## Compatibility Requirements

- [ ] Migração do armazenamento local (`localStorage`) para Supabase não perde a funcionalidade já existente (formulário de registro de hunt).
- [ ] Nenhum dado sensível (chaves Supabase) fica hardcoded — tudo via `.env` (já gitignored).

## Risk Mitigation

- **Risco:** RLS mal configurada expõe dados entre usuários. **Mitigação:** testar com 2 contas antes de considerar a story pronta.
- **Risco:** Parser falha em variações do texto do analyser (idioma, formatação). **Mitigação:** fallback sempre disponível para formulário manual.

## Definition of Done

- [x] Todas as stories com AC atendidos
- [x] RLS validada com múltiplas contas de teste
- [x] Campo "Nome da hunt" obrigatório nos dois fluxos
- [x] `.env` com chaves Supabase, nunca commitado

## Status: Done (2026-08-26)

Stories 1.1, 1.2, 1.3 e 1.4 completas com QA Gate PASS/CONCERNS. Ver [docs/stories/](../../) para o detalhe de cada uma.
