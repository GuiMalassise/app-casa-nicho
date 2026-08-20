-- ============================================================================
-- Migração — 2026-08-20
-- Dashboard precisa de um limite pra sinalizar "estoque baixo", que não
-- existia em nenhuma tabela do schema. Adicionado como configuração, não
-- como coluna nova em variacoes/insumos — mesmo padrão de margem_alvo_padrao
-- e custo_embalagem_estimado (§45 v1.0, princípio 16).
-- ============================================================================

insert into configuracoes (empresa_id, chave, valor)
values ('00000000-0000-0000-0000-000000000001', 'estoque_minimo_padrao', '5')
on conflict (empresa_id, chave) do nothing;
