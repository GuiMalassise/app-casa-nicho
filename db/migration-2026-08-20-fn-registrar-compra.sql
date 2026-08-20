-- ============================================================================
-- Migração — 2026-08-20
-- Função fn_registrar_compra: grava compra + itens + rateio de frete + lotes
-- + movimentações de entrada numa transação só (§10, §13, §14, §52.6).
-- ============================================================================

create or replace function fn_registrar_compra(
    p_empresa_id    uuid,
    p_fornecedor_id uuid,
    p_data          date,
    p_frete_total   numeric,
    p_itens         jsonb
) returns uuid
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_compra_id       uuid;
    v_soma_valor      numeric;
    v_item            jsonb;
    v_compra_item_id  uuid;
    v_lote_id         uuid;
    v_frete_rateado   numeric;
    v_custo_por_ml    numeric;
begin
    insert into compras (empresa_id, fornecedor_id, data, frete_total)
    values (p_empresa_id, p_fornecedor_id, p_data, p_frete_total)
    returning id into v_compra_id;

    select coalesce(sum((i->>'valor_pago')::numeric), 0) into v_soma_valor
    from jsonb_array_elements(p_itens) i;

    for v_item in select * from jsonb_array_elements(p_itens)
    loop
        v_frete_rateado := case when v_soma_valor > 0
            then p_frete_total * (v_item->>'valor_pago')::numeric / v_soma_valor
            else 0 end;

        insert into compra_itens (
            compra_id, perfume_id, volume_ml, variacao_id, quantidade,
            valor_pago, frete_rateado
        ) values (
            v_compra_id,
            nullif(v_item->>'perfume_id', '')::uuid,
            nullif(v_item->>'volume_ml', '')::numeric,
            nullif(v_item->>'variacao_id', '')::uuid,
            nullif(v_item->>'quantidade', '')::integer,
            (v_item->>'valor_pago')::numeric,
            v_frete_rateado
        )
        returning id, custo_por_ml into v_compra_item_id, v_custo_por_ml;

        if nullif(v_item->>'perfume_id', '') is not null then
            insert into lotes (empresa_id, perfume_id, compra_item_id, volume_inicial_ml, custo_por_ml)
            values (
                p_empresa_id,
                (v_item->>'perfume_id')::uuid,
                v_compra_item_id,
                (v_item->>'volume_ml')::numeric,
                v_custo_por_ml
            )
            returning id into v_lote_id;

            insert into movimentacoes_estoque (
                empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade,
                origem_tipo, origem_id
            ) values (
                p_empresa_id, 'lote_perfume', v_lote_id, 'entrada',
                (v_item->>'volume_ml')::numeric, 'compra', v_compra_id
            );
        else
            insert into movimentacoes_estoque (
                empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade,
                origem_tipo, origem_id
            ) values (
                p_empresa_id, 'variacao', (v_item->>'variacao_id')::uuid, 'entrada',
                (v_item->>'quantidade')::numeric, 'compra', v_compra_id
            );
        end if;
    end loop;

    return v_compra_id;
end;
$$;
