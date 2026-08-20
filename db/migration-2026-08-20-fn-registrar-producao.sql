-- ============================================================================
-- Migração — 2026-08-20
-- Função fn_registrar_producao: consome perfume dos lotes via FIFO
-- (fn_consumir_lotes_fifo, §48) + insumos da ficha técnica (§18), gera a
-- entrada do decant pronto, calcula custo histórico (§48.4, §20).
-- ============================================================================

create or replace function fn_registrar_producao(
    p_empresa_id uuid,
    p_variacao_id uuid,
    p_quantidade integer
) returns uuid
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_perfume_id           uuid;
    v_volume_ml             numeric;
    v_modo_venda            modo_venda_tipo;
    v_total_ml_necessario   numeric;
    v_producao_id           uuid;
    v_lote                  record;
    v_soma_ponderada        numeric := 0;
    v_custo_medio_ml        numeric;
    v_custo_insumos         numeric := 0;
    v_custo_unitario        numeric;
    v_ft                    record;
begin
    select perfume_id, volume_ml, modo_venda into v_perfume_id, v_volume_ml, v_modo_venda
    from variacoes where id = p_variacao_id;

    if v_modo_venda is distinct from 'fracionado' then
        raise exception 'Variação em modo inteiro não passa por produção (§52.4)';
    end if;

    v_total_ml_necessario := v_volume_ml * p_quantidade;

    insert into producoes (empresa_id, variacao_id, quantidade, perfume_consumido_ml, custo_unitario_historico)
    values (p_empresa_id, p_variacao_id, p_quantidade, v_total_ml_necessario, 0)
    returning id into v_producao_id;

    for v_lote in select * from fn_consumir_lotes_fifo(v_perfume_id, v_total_ml_necessario)
    loop
        insert into producao_lotes_consumidos (producao_id, lote_id, quantidade_ml_consumida, custo_por_ml_no_momento)
        values (v_producao_id, v_lote.lote_id, v_lote.quantidade_ml, v_lote.custo_por_ml);

        insert into movimentacoes_estoque (
            empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id
        ) values (
            p_empresa_id, 'lote_perfume', v_lote.lote_id, 'saida', -v_lote.quantidade_ml, 'producao', v_producao_id
        );

        v_soma_ponderada := v_soma_ponderada + (v_lote.quantidade_ml * v_lote.custo_por_ml);
    end loop;

    v_custo_medio_ml := v_soma_ponderada / nullif(v_total_ml_necessario, 0);

    for v_ft in
        select ft.quantidade, ft.insumo_id, i.custo_medio
        from fichas_tecnicas ft
        join insumos i on i.id = ft.insumo_id
        where ft.variacao_id = p_variacao_id
    loop
        insert into producao_insumos_consumidos (producao_id, insumo_id, quantidade)
        values (v_producao_id, v_ft.insumo_id, v_ft.quantidade * p_quantidade);

        insert into movimentacoes_estoque (
            empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id
        ) values (
            p_empresa_id, 'insumo', v_ft.insumo_id, 'saida',
            -(v_ft.quantidade * p_quantidade), 'producao', v_producao_id
        );

        v_custo_insumos := v_custo_insumos + (v_ft.quantidade * v_ft.custo_medio);
    end loop;

    v_custo_unitario := (v_volume_ml * coalesce(v_custo_medio_ml, 0)) + v_custo_insumos;

    update producoes set custo_unitario_historico = v_custo_unitario where id = v_producao_id;

    insert into movimentacoes_estoque (
        empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id
    ) values (
        p_empresa_id, 'variacao', p_variacao_id, 'entrada', p_quantidade, 'producao', v_producao_id
    );

    return v_producao_id;
end;
$$;
