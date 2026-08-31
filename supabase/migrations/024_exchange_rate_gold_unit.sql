-- Story 6.5: corrige a unidade da taxa de câmbio de KK (milhões) para gold puro.
-- Renomeia a coluna, mantém o valor — o usuário reconfigura a taxa depois desta
-- correção (não há meta real de produção que dependa do valor antigo, confirmado
-- na Story 6.5).

alter table exchange_rates rename column kk_per_tc to gold_per_tc;
