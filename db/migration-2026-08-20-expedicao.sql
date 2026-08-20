-- ============================================================================
-- Migração — 2026-08-20
-- Expedição (§8): regra automática de tipo de caixa por quantidade total de
-- itens ativos do pedido, aplicada dentro do próprio fluxo de status —
-- sem tela separada, como o roadmap da Fase 1 pede.
-- ============================================================================

alter table pedido_expedicao add constraint pedido_expedicao_pedido_id_key unique (pedido_id);

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
    v_qtd_total    integer;
    v_tipo_caixa   text;
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

    elsif p_novo_status = 'embalagem' and v_status_atual is distinct from 'embalagem' then
        select coalesce(sum(quantidade), 0) into v_qtd_total
        from pedido_itens where pedido_id = p_pedido_id and status = 'ativo';

        select tipo_caixa into v_tipo_caixa
        from regras_embalagem
        where empresa_id = v_empresa_id
          and qtd_minima <= v_qtd_total
          and qtd_maxima >= v_qtd_total
        limit 1;

        insert into pedido_expedicao (pedido_id, tipo_caixa, embalado_em)
        values (p_pedido_id, coalesce(v_tipo_caixa, 'a definir'), now())
        on conflict (pedido_id) do update
            set tipo_caixa = excluded.tipo_caixa, embalado_em = excluded.embalado_em;

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

        update pedido_expedicao set enviado_em = now() where pedido_id = p_pedido_id;

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
