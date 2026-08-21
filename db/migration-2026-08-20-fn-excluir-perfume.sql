-- ============================================================================
-- Migração — 2026-08-20
-- fn_excluir_perfume: exclui perfume + variações + fichas técnicas, só se
-- não houver histórico real (lote, compra, produção, pedido) vinculado.
-- ============================================================================

create or replace function fn_excluir_perfume(p_perfume_id uuid) returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
    v_tem_atividade boolean;
begin
    select exists (
        select 1 from lotes where perfume_id = p_perfume_id
        union all
        select 1 from compra_itens where perfume_id = p_perfume_id
        union all
        select 1 from pedido_itens pi
            join variacoes v on v.id = pi.variacao_id
            where v.perfume_id = p_perfume_id
        union all
        select 1 from compra_itens ci
            join variacoes v on v.id = ci.variacao_id
            where v.perfume_id = p_perfume_id
        union all
        select 1 from movimentacoes_estoque m
            join variacoes v on v.id = m.item_id and m.item_tipo = 'variacao'
            where v.perfume_id = p_perfume_id
    ) into v_tem_atividade;

    if v_tem_atividade then
        raise exception 'Esse perfume já tem histórico de compra, produção ou pedido — não pode ser excluído.';
    end if;

    delete from fichas_tecnicas where variacao_id in (
        select id from variacoes where perfume_id = p_perfume_id
    );
    delete from variacoes where perfume_id = p_perfume_id;
    delete from perfumes where id = p_perfume_id;
end;
$$;
