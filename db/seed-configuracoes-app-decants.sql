-- ============================================================================
-- SEED — Dados reais de configuração da operação do Gui
-- Rodar depois do schema-app-decants-v2.sql
-- ============================================================================

-- Empresa e canais base
insert into empresas (id, nome) values
    ('00000000-0000-0000-0000-000000000001', 'Operação própria — Gui');

insert into canais (id, empresa_id, nome) values
    ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'Nuvemshop'),
    ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', 'TikTok Shop');

-- Taxas: Nuvemshop cobra 4,69% + R$0,35 fixo por venda, sem faixa.
insert into taxas_canal (canal_id, faixa_valor_min, faixa_valor_max, percentual, taxa_fixa) values
    ('00000000-0000-0000-0000-0000000000c1', 0, null, 4.69, 0.35);

-- TikTok Shop: duas faixas por valor do produto.
insert into taxas_canal (canal_id, faixa_valor_min, faixa_valor_max, percentual, taxa_fixa) values
    ('00000000-0000-0000-0000-0000000000c2', 0,     49.99, 10.00, 4.00),
    ('00000000-0000-0000-0000-0000000000c2', 50.00, null,   6.00, 6.00);

-- Insumos de produção (custo unitário já calculado a partir da compra em lote informada)
insert into insumos (empresa_id, nome, tipo, custo_medio) values
    ('00000000-0000-0000-0000-000000000001', 'Frasco/válvula 5ml',  'producao', 4.80),
    ('00000000-0000-0000-0000-000000000001', 'Frasco/válvula 8ml',  'producao', 4.99),
    ('00000000-0000-0000-0000-000000000001', 'Frasco/válvula 10ml', 'producao', 4.99),
    -- Etiqueta de decant: R$73,00 / 160 unidades
    ('00000000-0000-0000-0000-000000000001', 'Etiqueta de decant',  'producao', round(73.00 / 160, 4));

-- Insumos de expedição
insert into insumos (empresa_id, nome, tipo, custo_medio) values
    ('00000000-0000-0000-0000-000000000001', 'Caixa pequena', 'expedicao', 0.65),
    ('00000000-0000-0000-0000-000000000001', 'Caixa grande',  'expedicao', 1.00),
    -- Plástico bolha: R$29,90 / 100m, regra é 1m consumido por pedido (§8 v1.0)
    ('00000000-0000-0000-0000-000000000001', 'Plástico bolha (1m/pedido)', 'expedicao', round(29.90 / 100, 4)),
    -- Ziplock: sachê de 100un por R$60
    ('00000000-0000-0000-0000-000000000001', 'Ziplock', 'expedicao', round(60.00 / 100, 4)),
    -- Etiqueta de envio: R$14,30 / rolo de 130 etiquetas
    ('00000000-0000-0000-0000-000000000001', 'Etiqueta de envio', 'expedicao', round(14.30 / 130, 4)),
    -- Fita: rolo de 50m a R$5,20, consumo de 1,5m por pedido (com folga)
    ('00000000-0000-0000-0000-000000000001', 'Fita (1,5m/pedido)', 'expedicao', round((5.20 / 50) * 1.5, 4));

-- Despesas fixas recorrentes
insert into despesas_fixas (empresa_id, nome, valor, recorrencia) values
    ('00000000-0000-0000-0000-000000000001', 'Nuvemshop (assinatura)', 70.00, 'mensal'),
    ('00000000-0000-0000-0000-000000000001', 'Hospedagem do site',     37.00, 'mensal');

-- Tamanhos padrão (fica em 'configuracoes', chave-valor por empresa)
insert into configuracoes (empresa_id, chave, valor) values
    ('00000000-0000-0000-0000-000000000001', 'tamanhos_padrao_ml', '[5, 8, 10]');

-- §53: base da sugestão de preço.
-- custo_embalagem_estimado = caixa pequena + etiqueta de envio + fita + ziplock + plástico bolha
--   0,65 + 0,11 + 0,156 + 0,60 + 0,299 ≈ R$1,82 por pedido (ajuste se quiser refinar)
insert into configuracoes (empresa_id, chave, valor) values
    ('00000000-0000-0000-0000-000000000001', 'custo_embalagem_estimado', '1.82'),
    ('00000000-0000-0000-0000-000000000001', 'margem_alvo_padrao', '0.37');

-- Regras de embalagem (§8 v1.0)
insert into regras_embalagem (empresa_id, tipo_caixa, qtd_minima, qtd_maxima) values
    ('00000000-0000-0000-0000-000000000001', 'pequena', 1, 3),
    ('00000000-0000-0000-0000-000000000001', 'grande',  4, 6);
