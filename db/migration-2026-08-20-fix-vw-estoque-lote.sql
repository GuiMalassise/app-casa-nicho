-- ============================================================================
-- Migração — 2026-08-20
-- Bug: vw_estoque_lote somava volume_inicial_ml + soma das movimentações,
-- mas a movimentação de entrada da própria compra já representa o volume
-- inicial (§23-24: toda mudança, inclusive a compra, gera movimentação).
-- Resultado: volume_atual_ml saía em dobro assim que a primeira compra
-- acontecia. Achado testando o módulo de Compras ponta a ponta contra o
-- banco real. volume_inicial_ml continua na view como referência histórica
-- (nunca muda), só não entra mais na conta do saldo atual.
-- ============================================================================

create or replace view vw_estoque_lote as
select l.id as lote_id, l.empresa_id, l.perfume_id, l.volume_inicial_ml,
       coalesce(sum(m.quantidade), 0) as volume_atual_ml,
       l.custo_por_ml, l.criado_em
from lotes l
left join movimentacoes_estoque m
    on m.item_tipo = 'lote_perfume' and m.item_id = l.id
group by l.id;

alter view vw_estoque_lote set (security_invoker = true);
