-- ============================================================================
-- Migração — 2026-08-19
-- Rodar depois de schema-app-decants-v2.sql + seed-configuracoes-app-decants.sql
--
-- O QUE CORRIGE:
--   1. RLS: o schema original só criou a policy de exemplo em 'perfumes'
--      (comentário dizia "repetir nas demais" — nunca foi feito). Sem isso,
--      27 tabelas ficavam com RLS ligado e ZERO políticas — bloqueadas por
--      completo pra qualquer usuário autenticado via app.
--   2. Views (vw_estoque_*, vw_custo_*): por padrão do Postgres, views rodam
--      com o privilégio de quem criou, ignorando RLS das tabelas de baixo —
--      um usuário veria estoque/custo de TODAS as empresas, não só a dele.
--      Corrigido com security_invoker = true.
--   3. search_path fixo nas funções (linter do Supabase, WARN).
--   4. insumos.volume_ml — casa frasco/válvula com o tamanho da variação por
--      número, não por string do nome (ficha técnica automática do Perfumes).
-- ============================================================================

-- ---- usuarios: caso especial, evita recursão (política não pode fazer
--      subquery na própria tabela que protege) ------------------------------
alter table usuarios enable row level security;
create policy "usuario só vê seu próprio registro" on usuarios
    for all using (id = auth.uid()) with check (id = auth.uid());

-- ---- empresas: via usuarios (não recursivo, tabela diferente) -------------
alter table empresas enable row level security;
create policy "usuario só vê a própria empresa" on empresas
    for all using (
        id in (select u.empresa_id from usuarios u where u.id = auth.uid())
    ) with check (
        id in (select u.empresa_id from usuarios u where u.id = auth.uid())
    );

-- ---- tabelas com empresa_id direto: mesmo padrão de 'perfumes' ------------
do $$
declare
    t text;
begin
    foreach t in array array[
        'variacoes', 'insumos', 'fornecedores', 'compras', 'lotes',
        'movimentacoes_estoque', 'producoes', 'kits', 'canais', 'pedidos',
        'canal_sincronizacoes', 'regras_embalagem', 'despesas_fixas',
        'lancamentos_financeiros', 'caixa_movimentos', 'campanhas_marketing',
        'configuracoes'
    ]
    loop
        execute format('alter table %I enable row level security', t);
        execute format(
            'create policy %I on %I for all using (
                empresa_id in (select u.empresa_id from usuarios u where u.id = auth.uid())
            ) with check (
                empresa_id in (select u.empresa_id from usuarios u where u.id = auth.uid())
            )',
            'usuario só vê dados da própria empresa', t
        );
    end loop;
end $$;

-- ---- tabelas-filhas sem empresa_id: isola via a tabela-mãe ----------------
alter table fichas_tecnicas enable row level security;
create policy "usuario só vê dados da própria empresa" on fichas_tecnicas
    for all using (
        exists (
            select 1 from variacoes v
            join usuarios u on u.empresa_id = v.empresa_id
            where v.id = fichas_tecnicas.variacao_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from variacoes v
            join usuarios u on u.empresa_id = v.empresa_id
            where v.id = fichas_tecnicas.variacao_id and u.id = auth.uid()
        )
    );

alter table compra_itens enable row level security;
create policy "usuario só vê dados da própria empresa" on compra_itens
    for all using (
        exists (
            select 1 from compras c
            join usuarios u on u.empresa_id = c.empresa_id
            where c.id = compra_itens.compra_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from compras c
            join usuarios u on u.empresa_id = c.empresa_id
            where c.id = compra_itens.compra_id and u.id = auth.uid()
        )
    );

alter table producao_lotes_consumidos enable row level security;
create policy "usuario só vê dados da própria empresa" on producao_lotes_consumidos
    for all using (
        exists (
            select 1 from producoes p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = producao_lotes_consumidos.producao_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from producoes p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = producao_lotes_consumidos.producao_id and u.id = auth.uid()
        )
    );

alter table producao_insumos_consumidos enable row level security;
create policy "usuario só vê dados da própria empresa" on producao_insumos_consumidos
    for all using (
        exists (
            select 1 from producoes p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = producao_insumos_consumidos.producao_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from producoes p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = producao_insumos_consumidos.producao_id and u.id = auth.uid()
        )
    );

alter table kit_itens enable row level security;
create policy "usuario só vê dados da própria empresa" on kit_itens
    for all using (
        exists (
            select 1 from kits k
            join usuarios u on u.empresa_id = k.empresa_id
            where k.id = kit_itens.kit_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from kits k
            join usuarios u on u.empresa_id = k.empresa_id
            where k.id = kit_itens.kit_id and u.id = auth.uid()
        )
    );

alter table taxas_canal enable row level security;
create policy "usuario só vê dados da própria empresa" on taxas_canal
    for all using (
        exists (
            select 1 from canais c
            join usuarios u on u.empresa_id = c.empresa_id
            where c.id = taxas_canal.canal_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from canais c
            join usuarios u on u.empresa_id = c.empresa_id
            where c.id = taxas_canal.canal_id and u.id = auth.uid()
        )
    );

alter table pedido_itens enable row level security;
create policy "usuario só vê dados da própria empresa" on pedido_itens
    for all using (
        exists (
            select 1 from pedidos p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = pedido_itens.pedido_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from pedidos p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = pedido_itens.pedido_id and u.id = auth.uid()
        )
    );

alter table pedido_expedicao enable row level security;
create policy "usuario só vê dados da própria empresa" on pedido_expedicao
    for all using (
        exists (
            select 1 from pedidos p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = pedido_expedicao.pedido_id and u.id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from pedidos p
            join usuarios u on u.empresa_id = p.empresa_id
            where p.id = pedido_expedicao.pedido_id and u.id = auth.uid()
        )
    );

-- ---- views: sem isso, ignoram RLS das tabelas base -------------------------
alter view vw_estoque_lote set (security_invoker = true);
alter view vw_estoque_perfume set (security_invoker = true);
alter view vw_estoque_variacao set (security_invoker = true);
alter view vw_estoque_variacao_disponivel set (security_invoker = true);
alter view vw_estoque_insumo set (security_invoker = true);
alter view vw_custo_medio_perfume set (security_invoker = true);
alter view vw_custo_producao_variacao set (security_invoker = true);
alter view vw_estoque_kit set (security_invoker = true);

-- ---- funções: search_path fixo (linter WARN) -------------------------------
alter function fn_saldo_atual(item_tipo, uuid) set search_path = 'public';
alter function trg_validar_movimentacao() set search_path = 'public';
alter function fn_consumir_lotes_fifo(uuid, numeric) set search_path = 'public';
alter function fn_sugerir_preco(uuid, uuid) set search_path = 'public';

-- ---- insumos.volume_ml: casar ficha técnica por número, não por nome ------
alter table insumos add column volume_ml numeric(6,2);

update insumos set volume_ml = 5  where nome = 'Frasco/válvula 5ml';
update insumos set volume_ml = 8  where nome = 'Frasco/válvula 8ml';
update insumos set volume_ml = 10 where nome = 'Frasco/válvula 10ml';
