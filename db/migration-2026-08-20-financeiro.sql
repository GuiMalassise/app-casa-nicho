-- ============================================================================
-- Migração — 2026-08-20
-- fn_registrar_pedido nunca preenchia pedido_itens.custo_unitario_historico
-- — sem isso não dá pra calcular margem por venda de verdade no Financeiro,
-- só faturamento. Congela o custo de produção atual (vw_custo_producao_variacao)
-- no momento da venda, igual já se faz com a taxa do canal (§34).
-- ============================================================================

create or replace function fn_registrar_pedido(
    p_empresa_id  uuid,
    p_canal_id    uuid,
    p_id_externo  text,
    p_cliente_nome text,
    p_valor_frete numeric,
    p_itens       jsonb
) returns uuid
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_pedido_id      uuid;
    v_valor_produtos numeric;
    v_item           jsonb;
    v_taxa           record;
    v_custo          numeric;
begin
    select coalesce(sum((i->>'quantidade')::int * (i->>'preco_unitario')::numeric), 0)
    into v_valor_produtos
    from jsonb_array_elements(p_itens) i;

    select percentual, taxa_fixa into v_taxa
    from taxas_canal
    where canal_id = p_canal_id
      and faixa_valor_min <= v_valor_produtos
      and (faixa_valor_max is null or faixa_valor_max >= v_valor_produtos)
      and vigente_desde <= now()
    order by vigente_desde desc
    limit 1;

    insert into pedidos (
        empresa_id, canal_id, id_externo, cliente_nome, valor_produtos, valor_frete,
        taxa_percentual_aplicada, taxa_fixa_aplicada, taxa_valor_aplicada, status
    ) values (
        p_empresa_id, p_canal_id, p_id_externo, nullif(p_cliente_nome, ''), v_valor_produtos, p_valor_frete,
        v_taxa.percentual, v_taxa.taxa_fixa,
        coalesce(v_valor_produtos * v_taxa.percentual / 100 + v_taxa.taxa_fixa, 0),
        'recebido'
    ) returning id into v_pedido_id;

    for v_item in select * from jsonb_array_elements(p_itens)
    loop
        select custo_producao into v_custo
        from vw_custo_producao_variacao
        where variacao_id = (v_item->>'variacao_id')::uuid;

        insert into pedido_itens (pedido_id, variacao_id, quantidade, preco_unitario, custo_unitario_historico)
        values (
            v_pedido_id,
            (v_item->>'variacao_id')::uuid,
            (v_item->>'quantidade')::int,
            (v_item->>'preco_unitario')::numeric,
            v_custo
        );
    end loop;

    return v_pedido_id;
end;
$$;
