-- ============================================================================
-- Migração — 2026-08-20
-- Pedidos: criação com taxa de canal congelada (§34), avanço de status com
-- reserva/baixa de estoque (§26-28, §47.6), cancelamento e devolução por
-- item (§51).
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
        insert into pedido_itens (pedido_id, variacao_id, quantidade, preco_unitario)
        values (
            v_pedido_id,
            (v_item->>'variacao_id')::uuid,
            (v_item->>'quantidade')::int,
            (v_item->>'preco_unitario')::numeric
        );
    end loop;

    return v_pedido_id;
end;
$$;

create or replace function fn_avancar_status_pedido(
    p_pedido_id uuid,
    p_novo_status pedido_status
) returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_status_atual pedido_status;
    v_empresa_id   uuid;
    v_item         record;
begin
    select status, empresa_id into v_status_atual, v_empresa_id
    from pedidos where id = p_pedido_id;

    if not found then
        raise exception 'Pedido não encontrado';
    end if;

    if p_novo_status = 'estoque_reservado' and v_status_atual is distinct from 'estoque_reservado' then
        for v_item in
            select variacao_id, quantidade from pedido_itens
            where pedido_id = p_pedido_id and status = 'ativo' and variacao_id is not null
        loop
            insert into movimentacoes_estoque (empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id)
            values (v_empresa_id, 'variacao', v_item.variacao_id, 'reserva', -v_item.quantidade, 'pedido', p_pedido_id);
        end loop;

    elsif p_novo_status = 'enviado' and v_status_atual is distinct from 'enviado' then
        for v_item in
            select variacao_id, quantidade from pedido_itens
            where pedido_id = p_pedido_id and status = 'ativo' and variacao_id is not null
        loop
            insert into movimentacoes_estoque (empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id)
            values (v_empresa_id, 'variacao', v_item.variacao_id, 'liberacao_reserva', v_item.quantidade, 'pedido', p_pedido_id);

            insert into movimentacoes_estoque (empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id)
            values (v_empresa_id, 'variacao', v_item.variacao_id, 'baixa_definitiva', -v_item.quantidade, 'pedido', p_pedido_id);
        end loop;

    elsif p_novo_status = 'cancelado' and v_status_atual in ('estoque_reservado', 'preparacao', 'nf_emitida', 'embalagem') then
        for v_item in
            select variacao_id, quantidade from pedido_itens
            where pedido_id = p_pedido_id and status = 'ativo' and variacao_id is not null
        loop
            insert into movimentacoes_estoque (empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id)
            values (v_empresa_id, 'variacao', v_item.variacao_id, 'liberacao_reserva', v_item.quantidade, 'pedido', p_pedido_id);
        end loop;
    end if;

    update pedidos set status = p_novo_status where id = p_pedido_id;
end;
$$;

create or replace function fn_cancelar_item_pedido(p_pedido_item_id uuid) returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_item_status      pedido_item_status;
    v_pedido_id        uuid;
    v_pedido_status    pedido_status;
    v_empresa_id       uuid;
    v_variacao_id      uuid;
    v_quantidade       integer;
begin
    select pi.status, pi.pedido_id, p.status, p.empresa_id, pi.variacao_id, pi.quantidade
    into v_item_status, v_pedido_id, v_pedido_status, v_empresa_id, v_variacao_id, v_quantidade
    from pedido_itens pi join pedidos p on p.id = pi.pedido_id
    where pi.id = p_pedido_item_id;

    if not found then
        raise exception 'Item de pedido não encontrado';
    end if;
    if v_item_status is distinct from 'ativo' then
        raise exception 'Item já está %', v_item_status;
    end if;

    if v_pedido_status in ('estoque_reservado', 'preparacao', 'nf_emitida', 'embalagem') and v_variacao_id is not null then
        insert into movimentacoes_estoque (empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id)
        values (v_empresa_id, 'variacao', v_variacao_id, 'liberacao_reserva', v_quantidade, 'cancelamento', v_pedido_id);
    end if;

    update pedido_itens set status = 'cancelado' where id = p_pedido_item_id;

    if not exists (select 1 from pedido_itens where pedido_id = v_pedido_id and status = 'ativo') then
        update pedidos set status = 'cancelado' where id = v_pedido_id;
    end if;
end;
$$;

create or replace function fn_devolver_item_pedido(p_pedido_item_id uuid) returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_item_status pedido_item_status;
    v_pedido_id   uuid;
    v_empresa_id  uuid;
    v_variacao_id uuid;
    v_quantidade  integer;
begin
    select pi.status, pi.pedido_id, p.empresa_id, pi.variacao_id, pi.quantidade
    into v_item_status, v_pedido_id, v_empresa_id, v_variacao_id, v_quantidade
    from pedido_itens pi join pedidos p on p.id = pi.pedido_id
    where pi.id = p_pedido_item_id;

    if not found then
        raise exception 'Item de pedido não encontrado';
    end if;
    if v_item_status is distinct from 'ativo' then
        raise exception 'Item já está %', v_item_status;
    end if;

    if v_variacao_id is not null then
        insert into movimentacoes_estoque (empresa_id, item_tipo, item_id, movimentacao_tipo, quantidade, origem_tipo, origem_id)
        values (v_empresa_id, 'variacao', v_variacao_id, 'devolucao', v_quantidade, 'devolucao', v_pedido_id);
    end if;

    update pedido_itens set status = 'devolvido' where id = p_pedido_item_id;
end;
$$;
