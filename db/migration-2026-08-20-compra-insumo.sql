-- ============================================================================
-- Migração — 2026-08-20 (compra de insumo)
-- Terceiro modo em compra_itens: insumo_id + quantidade, sem lote, credita
-- insumos via movimentacoes_estoque (item_tipo='insumo', já existia no
-- schema) e recalcula insumos.custo_medio como média ponderada (moving
-- average), igual ao que vw_custo_medio_perfume já faz para perfumes.
-- ============================================================================

alter table compra_itens
    add column insumo_id uuid references insumos(id);

alter table compra_itens
    drop constraint compra_item_um_modo_so;

alter table compra_itens
    add constraint compra_item_um_modo_so check (
        (perfume_id is not null and volume_ml is not null
            and variacao_id is null and quantidade is null and insumo_id is null)
        or
        (variacao_id is not null and quantidade is not null
            and perfume_id is null and volume_ml is null and insumo_id is null)
        or
        (insumo_id is not null and quantidade is not null
            and perfume_id is null and volume_ml is null and variacao_id is null)
    );

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
    v_custo_unitario  numeric;
    v_insumo_id       uuid;
    v_quantidade      integer;
    v_saldo_anterior  numeric;
    v_custo_medio_atual numeric;
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

        if nullif(v_item->>'perfume_id', '') is not null then
            insert into compra_itens (
                compra_id, perfume_id, volume_ml, valor_pago, frete_rateado
            ) values (
                v_compra_id,
                (v_item->>'perfume_id')::uuid,
                (v_item->>'volume_ml')::numeric,
                (v_item->>'valor_pago')::numeric,
                v_frete_rateado
            )
            returning id, custo_por_ml into v_compra_item_id, v_custo_por_ml;

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

        elsif nullif(v_item->>'variacao_id', '') is not null then
            insert into compra_itens (
                compra_id, variacao_id, quantidade, valor_pago, frete_rateado
            ) values (
                v_compra_id,
                (v_item->>'variacao_id')::uuid,
                (v_item->>'quantidade')::integer,
                (v_item->>'valor_pago')::numeric,
                v_frete_rateado
            )
            returning id into v_compra_item_id;

            insert into movimentacoes_estoque (
                empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade,
                origem_tipo, origem_id
            ) values (
                p_empresa_id, 'variacao', (v_item->>'variacao_id')::uuid, 'entrada',
                (v_item->>'quantidade')::numeric, 'compra', v_compra_id
            );

        else
            v_insumo_id := (v_item->>'insumo_id')::uuid;
            v_quantidade := (v_item->>'quantidade')::integer;

            insert into compra_itens (
                compra_id, insumo_id, quantidade, valor_pago, frete_rateado
            ) values (
                v_compra_id, v_insumo_id, v_quantidade,
                (v_item->>'valor_pago')::numeric, v_frete_rateado
            )
            returning id, custo_unitario into v_compra_item_id, v_custo_unitario;

            -- trava o insumo antes de ler o saldo/custo médio atuais, pra não
            -- perder atualização com duas compras do mesmo insumo em paralelo
            select custo_medio into v_custo_medio_atual
            from insumos where id = v_insumo_id for update;

            v_saldo_anterior := fn_saldo_atual('insumo', v_insumo_id);

            insert into movimentacoes_estoque (
                empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade,
                origem_tipo, origem_id
            ) values (
                p_empresa_id, 'insumo', v_insumo_id, 'entrada',
                v_quantidade, 'compra', v_compra_id
            );

            update insumos
            set custo_medio = (v_saldo_anterior * v_custo_medio_atual + v_quantidade * v_custo_unitario)
                               / nullif(v_saldo_anterior + v_quantidade, 0)
            where id = v_insumo_id;
        end if;
    end loop;

    return v_compra_id;
end;
$$;
