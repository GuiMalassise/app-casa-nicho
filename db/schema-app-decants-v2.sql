-- ============================================================================
-- SCHEMA — App de Gestão de Decants
-- Versão: 2.0 | PostgreSQL (compatível com Supabase)
-- Base: Documento Mestre v1.0 + v2.0 (adendo) + Mapa Funcional v1.0
--
-- O QUE MUDOU DA v1.0:
--   1. empresa_id em todas as tabelas operacionais (§50 — SaaS multi-tenant)
--   2. producao_lotes_consumidos + consumo FIFO (§48)
--   3. Trigger de proteção contra estoque negativo, dentro do banco (§49)
--   4. canal_sincronizacoes + status 'pendente_conflito' em pedidos (§47)
--   5. status por item em pedido_itens, não só no pedido (§51)
--   6. modo_venda (fracionado x inteiro) por variação — revenda de frasco
--      fechado sem fracionar, sem virar "unidade de medida livre" (§52)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0. EMPRESAS E USUÁRIOS (§50 — raiz do multi-tenant)
-- ============================================================================

create table empresas (
    id          uuid primary key default gen_random_uuid(),
    nome        text not null,
    criado_em   timestamptz not null default now()
);

create type usuario_papel as enum ('owner', 'admin', 'membro');

-- Liga o login (auth.users do Supabase) à empresa dele.
-- Hoje: 1 empresa, você como 'owner'. No futuro: cada cliente do SaaS cria a
-- própria empresa no cadastro e vira 'owner' dela.
create table usuarios (
    id          uuid primary key references auth.users(id) on delete cascade,
    empresa_id  uuid not null references empresas(id) on delete cascade,
    nome        text,
    papel       usuario_papel not null default 'membro',
    criado_em   timestamptz not null default now()
);

-- ============================================================================
-- 1. PERFUMES E VARIAÇÕES (§5, §6, §17 da v1.0)
-- ============================================================================

create table perfumes (
    id          uuid primary key default gen_random_uuid(),
    empresa_id  uuid not null references empresas(id),
    nome        text not null,
    criado_em   timestamptz not null default now()
);

-- §52 (v2.0): modelo de venda por variação — fracionado (decant) ou revenda
-- do frasco inteiro, sem fracionar. Não é unidade de medida livre, são só
-- esses dois modelos de operação.
create type modo_venda_tipo as enum ('fracionado', 'inteiro');

create table variacoes (
    id           uuid primary key default gen_random_uuid(),
    empresa_id   uuid not null references empresas(id),
    perfume_id   uuid not null references perfumes(id) on delete restrict,
    volume_ml    numeric(6,2) not null,
    modo_venda   modo_venda_tipo not null default 'fracionado',   -- §52
    sku          text not null,
    preco_venda  numeric(10,2),
    margem_alvo  numeric(5,4),        -- §53: sobrescreve o padrão da empresa (config), se preenchido
    ativo        boolean not null default true,
    criado_em    timestamptz not null default now(),
    unique (perfume_id, volume_ml),
    unique (empresa_id, sku)          -- SKU único por empresa, não globalmente
);

-- ============================================================================
-- 2. INSUMOS E FICHA TÉCNICA (§7, §17 da v1.0)
-- ============================================================================

create type insumo_tipo as enum ('producao', 'expedicao');

create table insumos (
    id           uuid primary key default gen_random_uuid(),
    empresa_id   uuid not null references empresas(id),
    nome         text not null,
    tipo         insumo_tipo not null,
    custo_medio  numeric(10,4) not null default 0,
    criado_em    timestamptz not null default now()
);

create table fichas_tecnicas (
    id          uuid primary key default gen_random_uuid(),
    variacao_id uuid not null references variacoes(id) on delete cascade,
    insumo_id   uuid not null references insumos(id) on delete restrict,
    quantidade  numeric(10,2) not null default 1,
    unique (variacao_id, insumo_id)
);

-- ============================================================================
-- 3. COMPRAS E LOTES (§10–§16 da v1.0)
-- ============================================================================

create table fornecedores (
    id          uuid primary key default gen_random_uuid(),
    empresa_id  uuid not null references empresas(id),
    nome        text not null
);

create table compras (
    id             uuid primary key default gen_random_uuid(),
    empresa_id     uuid not null references empresas(id),
    fornecedor_id  uuid references fornecedores(id),
    data           date not null,
    frete_total    numeric(10,2) not null default 0,
    criado_em      timestamptz not null default now()
);

-- Suporta os dois modelos do §52: compra de perfume a granel pra fracionar
-- (perfume_id + volume_ml → gera lote) OU compra de frasco fechado pra
-- revenda direta (variacao_id + quantidade → credita a variação sem passar
-- por lote nem produção).
create table compra_itens (
    id               uuid primary key default gen_random_uuid(),
    compra_id        uuid not null references compras(id) on delete cascade,
    perfume_id       uuid references perfumes(id),         -- modo fracionado
    volume_ml        numeric(10,2),                         -- modo fracionado
    variacao_id      uuid references variacoes(id),         -- modo inteiro
    quantidade       integer,                                -- modo inteiro
    valor_pago       numeric(10,2) not null,
    frete_rateado    numeric(10,2) not null default 0,
    custo_total      numeric(10,2) generated always as (valor_pago + frete_rateado) stored,
    custo_por_ml     numeric(10,4) generated always as
                      ((valor_pago + frete_rateado) / nullif(volume_ml, 0)) stored,
    custo_unitario   numeric(10,4) generated always as
                      ((valor_pago + frete_rateado) / nullif(quantidade, 0)) stored,
    constraint compra_item_um_modo_so check (
        (perfume_id is not null and volume_ml is not null
            and variacao_id is null and quantidade is null)
        or
        (variacao_id is not null and quantidade is not null
            and perfume_id is null and volume_ml is null)
    )
);

-- Só existe para compra_itens em modo 'fracionado' (§52). Compras em modo
-- 'inteiro' não geram lote — a compra credita a variação diretamente via
-- movimentacoes_estoque (item_tipo='variacao', origem_tipo='compra').
create table lotes (
    id                 uuid primary key default gen_random_uuid(),
    empresa_id         uuid not null references empresas(id),
    perfume_id         uuid not null references perfumes(id),
    compra_item_id     uuid not null references compra_itens(id),
    volume_inicial_ml  numeric(10,2) not null,
    custo_por_ml       numeric(10,4) not null,
    criado_em          timestamptz not null default now()
);

-- ============================================================================
-- 4. LEDGER DE ESTOQUE — TABELA CENTRAL (§23–24 da v1.0, §49 da v2.0)
-- ============================================================================

create type item_tipo as enum ('lote_perfume', 'variacao', 'insumo');
create type movimentacao_tipo as enum
    ('entrada', 'saida', 'reserva', 'liberacao_reserva', 'baixa_definitiva',
     'devolucao', 'ajuste', 'perda', 'avaria');
create type origem_tipo as enum
    ('compra', 'producao', 'pedido', 'ajuste_manual', 'cancelamento', 'devolucao');

create table movimentacoes_estoque (
    id                  uuid primary key default gen_random_uuid(),
    empresa_id          uuid not null references empresas(id),
    item_tipo           item_tipo not null,
    item_id             uuid not null,
    movimentacao_tipo   movimentacao_tipo not null,
    quantidade          numeric(12,3) not null,
    origem_tipo         origem_tipo not null,
    origem_id           uuid not null,
    motivo              text,
    criado_em           timestamptz not null default now(),
    constraint motivo_obrigatorio_em_ajuste
        check (origem_tipo <> 'ajuste_manual' or motivo is not null)
);

create index idx_movimentacoes_item on movimentacoes_estoque (item_tipo, item_id);
create index idx_movimentacoes_origem on movimentacoes_estoque (origem_tipo, origem_id);
create index idx_movimentacoes_empresa on movimentacoes_estoque (empresa_id);

-- ---- §49: proteção contra estoque negativo, dentro do banco -----------------

create or replace function fn_saldo_atual(p_item_tipo item_tipo, p_item_id uuid)
returns numeric as $$
    select coalesce(sum(quantidade), 0)
    from movimentacoes_estoque
    where item_tipo = p_item_tipo and item_id = p_item_id;
$$ language sql stable;

create or replace function trg_validar_movimentacao()
returns trigger as $$
declare
    v_saldo_atual numeric;
begin
    -- trava a linha "pai" para impedir duas transações concorrentes lendo o
    -- mesmo saldo desatualizado (o cenário exato de dois canais vendendo
    -- ao mesmo tempo — §47.4)
    if new.item_tipo = 'lote_perfume' then
        perform 1 from lotes where id = new.item_id for update;
    elsif new.item_tipo = 'variacao' then
        perform 1 from variacoes where id = new.item_id for update;
    elsif new.item_tipo = 'insumo' then
        perform 1 from insumos where id = new.item_id for update;
    end if;

    if new.quantidade < 0 then
        v_saldo_atual := fn_saldo_atual(new.item_tipo, new.item_id);
        if v_saldo_atual + new.quantidade < 0 then
            raise exception
                'Estoque insuficiente (item % / %, saldo atual %, tentativa %)',
                new.item_tipo, new.item_id, v_saldo_atual, new.quantidade
                using errcode = 'P0001';
        end if;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger trg_check_estoque
before insert on movimentacoes_estoque
for each row execute function trg_validar_movimentacao();
-- A aplicação deve capturar o erro P0001 e, se a origem for um pedido de
-- canal, marcar o pedido como 'pendente_conflito' em vez de deixar a
-- operação falhar sem tratamento (§47.4 / §49.3).

-- ---- Views de estoque (derivadas, nunca editáveis) --------------------------

create view vw_estoque_lote as
select l.id as lote_id, l.empresa_id, l.perfume_id, l.volume_inicial_ml,
       l.volume_inicial_ml + coalesce(sum(m.quantidade), 0) as volume_atual_ml,
       l.custo_por_ml, l.criado_em
from lotes l
left join movimentacoes_estoque m
    on m.item_tipo = 'lote_perfume' and m.item_id = l.id
group by l.id;

create view vw_estoque_perfume as
select empresa_id, perfume_id, sum(volume_atual_ml) as volume_total_ml
from vw_estoque_lote
group by empresa_id, perfume_id;

create view vw_estoque_variacao as
select v.id as variacao_id, v.empresa_id, v.perfume_id, v.sku,
       coalesce(sum(m.quantidade) filter (
           where m.movimentacao_tipo not in ('reserva','liberacao_reserva')
       ), 0) as estoque_fisico,
       coalesce(sum(m.quantidade) filter (where m.movimentacao_tipo = 'reserva'), 0) * -1
       - coalesce(sum(m.quantidade) filter (where m.movimentacao_tipo = 'liberacao_reserva'), 0)
         as estoque_reservado
from variacoes v
left join movimentacoes_estoque m
    on m.item_tipo = 'variacao' and m.item_id = v.id
group by v.id;

create view vw_estoque_variacao_disponivel as
select variacao_id, empresa_id, perfume_id, sku,
       estoque_fisico, estoque_reservado,
       estoque_fisico - estoque_reservado as estoque_disponivel
from vw_estoque_variacao;

create view vw_estoque_insumo as
select i.id as insumo_id, i.empresa_id, i.nome, i.tipo,
       coalesce(sum(m.quantidade), 0) as estoque_atual
from insumos i
left join movimentacoes_estoque m
    on m.item_tipo = 'insumo' and m.item_id = i.id
group by i.id;

-- ---- §53: custo de produção por variação, base para sugestão de preço -------

create view vw_custo_medio_perfume as
select empresa_id, perfume_id,
       sum(volume_atual_ml * custo_por_ml) / nullif(sum(volume_atual_ml), 0) as custo_medio_ml
from vw_estoque_lote
where volume_atual_ml > 0
group by empresa_id, perfume_id;

create view vw_custo_producao_variacao as
select v.id as variacao_id, v.empresa_id, v.perfume_id, v.volume_ml, v.modo_venda,
       (v.volume_ml * coalesce(cm.custo_medio_ml, 0))
         + coalesce((select sum(ft.quantidade * i.custo_medio)
                      from fichas_tecnicas ft
                      join insumos i on i.id = ft.insumo_id
                      where ft.variacao_id = v.id), 0) as custo_producao
from variacoes v
left join vw_custo_medio_perfume cm
    on cm.perfume_id = v.perfume_id and cm.empresa_id = v.empresa_id;
-- Para modo 'inteiro' (§52), custo_producao não é o relevante — o custo real
-- vem do valor pago na compra do frasco fechado (compra_itens.custo_unitario).

-- ============================================================================
-- 5. PRODUÇÃO COM RASTREABILIDADE POR LOTE — FIFO (§48 da v2.0)
-- ============================================================================

-- Só se aplica a variações em modo 'fracionado' (§52) — variações em modo
-- 'inteiro' não passam por produção, o estoque vem direto da compra.
create table producoes (
    id                        uuid primary key default gen_random_uuid(),
    empresa_id                uuid not null references empresas(id),
    variacao_id               uuid not null references variacoes(id),
    quantidade                integer not null check (quantidade > 0),
    perfume_consumido_ml      numeric(10,2) not null,
    custo_unitario_historico  numeric(10,4) not null,  -- agora = média ponderada real dos lotes
    criado_em                 timestamptz not null default now()
);

create table producao_lotes_consumidos (
    id                        uuid primary key default gen_random_uuid(),
    producao_id               uuid not null references producoes(id) on delete cascade,
    lote_id                   uuid not null references lotes(id),
    quantidade_ml_consumida   numeric(10,2) not null,
    custo_por_ml_no_momento   numeric(10,4) not null
);

create table producao_insumos_consumidos (
    id           uuid primary key default gen_random_uuid(),
    producao_id  uuid not null references producoes(id) on delete cascade,
    insumo_id    uuid not null references insumos(id),
    quantidade   numeric(10,2) not null
);

-- Função de consumo FIFO: dado um perfume e um volume necessário, devolve
-- quanto tirar de cada lote (do mais antigo pro mais novo) até fechar a conta.
-- A aplicação usa esse resultado para gravar producao_lotes_consumidos e as
-- movimentacoes_estoque de saída correspondentes (uma por lote consumido).
create or replace function fn_consumir_lotes_fifo(p_perfume_id uuid, p_volume_ml numeric)
returns table (lote_id uuid, quantidade_ml numeric, custo_por_ml numeric) as $$
declare
    v_restante numeric := p_volume_ml;
    v_lote record;
    v_consumo numeric;
begin
    for v_lote in
        select vl.lote_id, vl.volume_atual_ml, vl.custo_por_ml
        from vw_estoque_lote vl
        where vl.perfume_id = p_perfume_id and vl.volume_atual_ml > 0
        order by vl.criado_em asc              -- FIFO: lote mais antigo primeiro
    loop
        exit when v_restante <= 0;
        v_consumo := least(v_restante, v_lote.volume_atual_ml);
        lote_id := v_lote.lote_id;
        quantidade_ml := v_consumo;
        custo_por_ml := v_lote.custo_por_ml;
        return next;
        v_restante := v_restante - v_consumo;
    end loop;

    if v_restante > 0 then
        raise exception 'Perfume insuficiente: faltam %ml', v_restante;
    end if;
end;
$$ language plpgsql;

-- ============================================================================
-- 6. KITS (§21–§22 da v1.0)
-- ============================================================================

create table kits (
    id          uuid primary key default gen_random_uuid(),
    empresa_id  uuid not null references empresas(id),
    nome        text not null,
    ativo       boolean not null default true
);

create table kit_itens (
    kit_id      uuid not null references kits(id) on delete cascade,
    variacao_id uuid not null references variacoes(id),
    quantidade  integer not null default 1,
    primary key (kit_id, variacao_id)
);

create view vw_estoque_kit as
select k.id as kit_id, k.empresa_id, k.nome,
       min(floor(ev.estoque_disponivel / ki.quantidade)) as kits_disponiveis
from kits k
join kit_itens ki on ki.kit_id = k.id
join vw_estoque_variacao_disponivel ev on ev.variacao_id = ki.variacao_id
group by k.id, k.empresa_id, k.nome;

-- ============================================================================
-- 7. CANAIS, SINCRONIZAÇÃO E PEDIDOS (§25–29, §34–35 da v1.0, §47 e §51 da v2.0)
-- ============================================================================

create table canais (
    id          uuid primary key default gen_random_uuid(),
    empresa_id  uuid not null references empresas(id),
    nome        text not null,               -- 'Nuvemshop', 'TikTok Shop'
    unique (empresa_id, nome)
);

-- Taxa real por canal não é só percentual: Nuvemshop cobra % + valor fixo
-- por venda; TikTok Shop cobra % + valor fixo diferentes por faixa de preço
-- do produto. Por isso cada linha é uma faixa de valor com seu próprio
-- percentual + taxa fixa, e o histórico continua preservado por
-- vigente_desde (§34 da v1.0).
create table taxas_canal (
    id               uuid primary key default gen_random_uuid(),
    canal_id         uuid not null references canais(id),
    faixa_valor_min  numeric(10,2) not null default 0,
    faixa_valor_max  numeric(10,2),              -- null = sem limite superior
    percentual       numeric(5,2) not null,
    taxa_fixa        numeric(10,2) not null default 0,
    vigente_desde    timestamptz not null default now()
);

-- ---- §53: sugestão de preço (custo + margem-alvo, com a taxa do canal já
--      embutida — a margem é líquida da taxa, não só sobre o custo) --------
--
-- Fórmula: P = (custo + taxa_fixa) / (1 - percentual/100 - margem_alvo)
-- Como o TikTok Shop tem faixas (§ dados reais informados pelo Gui), testa
-- cada faixa em ordem e usa a primeira cujo preço resultante realmente cai
-- dentro dela — evita o problema de "a taxa depende do preço, o preço
-- depende da taxa".
create or replace function fn_sugerir_preco(p_variacao_id uuid, p_canal_id uuid)
returns numeric as $$
declare
    v_custo        numeric;
    v_embalagem    numeric;
    v_margem       numeric;
    v_empresa_id   uuid;
    v_faixa        record;
    v_preco        numeric;
begin
    select cp.custo_producao, v.margem_alvo, v.empresa_id
      into v_custo, v_margem, v_empresa_id
      from vw_custo_producao_variacao cp
      join variacoes v on v.id = cp.variacao_id
     where cp.variacao_id = p_variacao_id;

    -- margem-alvo: usa a da variação se existir, senão o padrão da empresa
    if v_margem is null then
        select (valor #>> '{}')::numeric into v_margem
          from configuracoes
         where empresa_id = v_empresa_id and chave = 'margem_alvo_padrao';
    end if;

    select (valor #>> '{}')::numeric into v_embalagem
      from configuracoes
     where empresa_id = v_empresa_id and chave = 'custo_embalagem_estimado';

    for v_faixa in
        select faixa_valor_min, faixa_valor_max, percentual, taxa_fixa
          from taxas_canal
         where canal_id = p_canal_id
         order by faixa_valor_min asc
    loop
        v_preco := (v_custo + coalesce(v_embalagem, 0) + v_faixa.taxa_fixa)
                   / (1 - (v_faixa.percentual / 100) - v_margem);

        if v_preco >= v_faixa.faixa_valor_min
           and (v_faixa.faixa_valor_max is null or v_preco <= v_faixa.faixa_valor_max)
        then
            return round(v_preco, 2);
        end if;
    end loop;

    -- nenhuma faixa foi consistente (margem-alvo alta demais pra faixa
    -- inferior, por exemplo) — devolve null pra UI avisar e pedir ajuste manual
    return null;
end;
$$ language plpgsql stable;
-- Isso é só SUGESTÃO: o valor retornado preenche o campo preco_venda como
-- ponto de partida editável, nunca é salvo automaticamente (§53.2).

create type pedido_status as enum
    ('recebido', 'pagamento_confirmado', 'estoque_reservado', 'preparacao',
     'nf_emitida', 'embalagem', 'enviado', 'concluido', 'cancelado',
     'pendente_conflito');                    -- novo, do §47.4

create table pedidos (
    id                         uuid primary key default gen_random_uuid(),
    empresa_id                 uuid not null references empresas(id),
    canal_id                   uuid not null references canais(id),
    id_externo                 text not null,
    cliente_nome               text,
    status                     pedido_status not null default 'recebido',
    valor_produtos             numeric(10,2) not null,
    valor_frete                numeric(10,2) not null default 0,
    taxa_percentual_aplicada   numeric(5,2),
    taxa_fixa_aplicada         numeric(10,2),      -- valor fixo da faixa, também congelado
    taxa_valor_aplicada        numeric(10,2),
    nf_numero                  text,
    nf_serie                   text,
    nf_chave                   text,
    nf_status                  text,
    criado_em                  timestamptz not null default now(),
    unique (canal_id, id_externo)
);

create type pedido_item_status as enum ('ativo', 'cancelado', 'devolvido');

create table pedido_itens (
    id                        uuid primary key default gen_random_uuid(),
    pedido_id                 uuid not null references pedidos(id) on delete cascade,
    variacao_id               uuid references variacoes(id),
    kit_id                    uuid references kits(id),
    quantidade                integer not null check (quantidade > 0),
    preco_unitario            numeric(10,2) not null,
    custo_unitario_historico  numeric(10,4),
    status                    pedido_item_status not null default 'ativo',  -- novo, §51
    check (
        (variacao_id is not null and kit_id is null) or
        (variacao_id is null and kit_id is not null)
    )
);

-- Log de sincronização com os canais externos (§47.5)
create type sincronizacao_status as enum ('sucesso', 'erro', 'pendente');

create table canal_sincronizacoes (
    id               uuid primary key default gen_random_uuid(),
    empresa_id       uuid not null references empresas(id),
    canal_id         uuid not null references canais(id),
    variacao_id      uuid not null references variacoes(id),
    estoque_enviado  numeric(10,2) not null,
    status           sincronizacao_status not null default 'pendente',
    tentativas       integer not null default 0,
    criado_em        timestamptz not null default now()
);

-- ============================================================================
-- 8. EXPEDIÇÃO (§7.2, §8, §30 da v1.0)
-- ============================================================================

create table regras_embalagem (
    id          uuid primary key default gen_random_uuid(),
    empresa_id  uuid not null references empresas(id),
    tipo_caixa  text not null,
    qtd_minima  integer not null,
    qtd_maxima  integer not null
);

create table pedido_expedicao (
    id           uuid primary key default gen_random_uuid(),
    pedido_id    uuid not null references pedidos(id) on delete cascade,
    tipo_caixa   text not null,
    embalado_em  timestamptz,
    enviado_em   timestamptz
);

-- ============================================================================
-- 9. FINANCEIRO (§32–38 da v1.0)
-- ============================================================================

create table despesas_fixas (
    id           uuid primary key default gen_random_uuid(),
    empresa_id   uuid not null references empresas(id),
    nome         text not null,
    valor        numeric(10,2) not null,
    recorrencia  text not null default 'mensal',
    ativo        boolean not null default true
);

create type lancamento_tipo as enum ('receita', 'despesa');

create table lancamentos_financeiros (
    id               uuid primary key default gen_random_uuid(),
    empresa_id       uuid not null references empresas(id),
    tipo             lancamento_tipo not null,
    categoria        text not null,
    valor            numeric(10,2) not null,
    data             date not null,
    pedido_id        uuid references pedidos(id),
    despesa_fixa_id  uuid references despesas_fixas(id),
    criado_em        timestamptz not null default now()
);

create table caixa_movimentos (
    id           uuid primary key default gen_random_uuid(),
    empresa_id   uuid not null references empresas(id),
    pedido_id    uuid references pedidos(id),
    valor        numeric(10,2) not null,
    recebido_em  timestamptz not null default now()
);

-- ============================================================================
-- 10. MARKETING (§39 da v1.0)
-- ============================================================================

create table campanhas_marketing (
    id            uuid primary key default gen_random_uuid(),
    empresa_id    uuid not null references empresas(id),
    canal_id      uuid references canais(id),
    nome          text not null,
    data          date not null,
    investimento  numeric(10,2) not null
);

-- ============================================================================
-- 11. CONFIGURAÇÕES (§45 da v1.0, princípio 16)
-- ============================================================================

create table configuracoes (
    empresa_id  uuid not null references empresas(id),
    chave       text not null,
    valor       jsonb not null,
    primary key (empresa_id, chave)
);

-- ============================================================================
-- 12. ROW LEVEL SECURITY (§50.4) — padrão a replicar em todas as tabelas
--     operacionais. Exemplo com 'perfumes'; repetir para as demais.
-- ============================================================================

alter table perfumes enable row level security;

create policy "usuario só vê dados da própria empresa"
    on perfumes
    for all
    using (
        empresa_id in (select u.empresa_id from usuarios u where u.id = auth.uid())
    )
    with check (
        empresa_id in (select u.empresa_id from usuarios u where u.id = auth.uid())
    );

-- Repetir a mesma policy (trocando o nome da tabela) em: variacoes, insumos,
-- fornecedores, compras, lotes, movimentacoes_estoque, producoes, kits,
-- canais, pedidos, despesas_fixas, lancamentos_financeiros, caixa_movimentos,
-- campanhas_marketing, configuracoes, regras_embalagem, canal_sincronizacoes.
