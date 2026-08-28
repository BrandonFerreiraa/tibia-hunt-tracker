-- Story 4.3: Modal de Detalhes da Hunt — expõe monstros/itens de hunts compartilhadas
--
-- As policies de RLS de session_monsters/session_items (schema.sql) só permitem
-- ao DONO da sessão ver suas próprias linhas. O modal de detalhes precisa
-- mostrar os monstros/itens de QUALQUER hunt compartilhada, não só as do
-- usuário logado — mesmo problema que public_hunts_feed (migration 012) já
-- resolveu pros dados agregados da sessão, aqui replicado pro detalhe.
--
-- Mesma lógica de segurança de public_hunts_feed: a view roda com privilégios
-- do dono (bypassa RLS), a segurança vem do WHERE s.is_shared = true.

create or replace view public_session_monsters as
select sm.session_id, sm.monster_name, sm.quantity
from session_monsters sm
join sessions s on s.id = sm.session_id
where s.is_shared = true;

create or replace view public_session_items as
select si.session_id, si.item_name, si.quantity
from session_items si
join sessions s on s.id = si.session_id
where s.is_shared = true;

grant select on public_session_monsters to authenticated;
grant select on public_session_items to authenticated;
