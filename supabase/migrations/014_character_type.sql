-- Story 3.1: Configurações — Cadastro de Personagens (Principal/Maker)
-- Adiciona o tipo do personagem (principal ou maker). Etiqueta apenas: não altera
-- verificação, sync de stats nem participação no feed compartilhado.

alter table characters
  add column if not exists type text not null default 'principal' check (type in ('principal', 'maker'));
