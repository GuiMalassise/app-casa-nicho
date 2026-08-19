# Roadmap de Implementação — App de Gestão de Decants

Baseado no Documento Mestre v1.0 + v2.0 e no Mapa Funcional v1.0. Objetivo
deste documento: decidir o que entra na primeira versão codada (Fase 1) para
validar a operação real do Gui o quanto antes, sem tentar construir o
produto inteiro de uma vez.

Critério de corte: **entra na Fase 1 o que é necessário para parar de usar
planilha na operação própria hoje.** Tudo que só faz sentido para outras
empresas usarem (SaaS) ou para automação avançada fica para depois.

---

## FASE 1 — MVP (uso próprio, single-tenant na prática)

O multi-tenant já existe no schema (é barato manter), mas na Fase 1 existe
uma única linha em `empresas` — sem tela de cadastro/login para outras
empresas ainda.

**Perfumes** — cadastro completo: nome, tamanhos, SKU automático, ficha
técnica automática. Os dois modos do §52 entram já na Fase 1 —
`fracionado` (decants 5/8/10ml) e `inteiro` (frasco fechado revendido sem
abrir) — porque o próprio Gui usa os dois, não é só um cenário hipotético de
outro cliente do SaaS.

> **Nota — "modo APC" (metade do frasco na embalagem original):** pelo que
> foi descrito, isso não parece ser um terceiro modo de venda separado — dá
> pra tratar como mais um **tamanho dentro do modo `fracionado`** (ex: uma
> variação de 50ml de um frasco de 100ml), só que consumindo um insumo de
> embalagem diferente (o frasco/embalagem original, em vez do
> frasco/válvula pequeno de decant) na ficha técnica dessa variação. Sem
> mudança de schema — só configuração. Vale confirmar se esse entendimento
> bate com o que você tinha em mente antes de seguir.

**Estoque** — as três visões (perfume/lote, decant, insumo), com ajuste
manual. Views de saldo direto do ledger, como já desenhado.

**Compras** — cadastro de compra com rateio de frete automático e geração
de lote.

**Produção** — produzir decants com verificação de estoque e consumo FIFO
por lote (§48). É mais trabalho que uma média simples, mas é o que dá a
rastreabilidade que você queria — vale entrar já na Fase 1.

**Pedidos** — lançamento **manual** (você digita o pedido, sem importação
automática da Nuvemshop/TikTok Shop ainda), com o fluxo de status completo
(§26 da v1.0), reserva → baixa, taxa do canal aplicada e congelada,
cancelamento/devolução por item (§51 — é barato, entra já).

**Expedição** — regra automática de tipo de caixa por quantidade (§8),
dentro do próprio fluxo de Pedidos — não precisa ser uma tela separada
ainda.

**Financeiro** — faturamento, custo e margem por venda; despesas fixas
recorrentes; distinção faturamento x caixa.

**Dashboard** — versão simples: estoque baixo, pedidos pendentes, margem e
faturamento do período. É basicamente agregação do que os outros módulos já
calculam, custo baixo de incluir.

**Configurações** — o mínimo pra tudo acima funcionar: tamanhos padrão,
insumos e custos, taxa por canal, regra de caixa.

---

## FASE 2 — Operação madura (ainda uso próprio, mas sem digitação manual de pedido)

- **Sincronização automática com os canais** (§47) — importação de pedidos
  via webhook da Nuvemshop e do TikTok Shop, e push de estoque de volta pra
  eles. Este é o maior módulo sozinho, por isso fica separado da Fase 1: sem
  ele o problema original (estoque dessincronizado) não está 100% resolvido,
  mas dá pra validar o resto do sistema sem depender das duas integrações
  externas primeiro.
- **Kits** — composto de variações com estoque derivado.
- **Marketing** — cadastro de campanhas e, futuramente, ROAS.

## FASE 3 — Virar SaaS de verdade

- Onboarding: cadastro de nova empresa, convite de usuários, papéis
  (owner/admin/membro).
- Planos e cobrança (assinatura, limite de uso por empresa) — mencionado
  antes como decisão consciente de ficar pra depois de validar o produto.
- `canal_sincronizacoes` com retry robusto e tratamento de erro por cliente,
  não só pra você.

---

## Por que essa ordem

A Fase 1 já resolve a dor imediata (parar de depender de planilha e ter
custo/margem confiável) mesmo com pedido lançado manualmente. A
sincronização automática de canais (Fase 2) é o pedaço mais caro e mais
arriscado tecnicamente (depende de API externa, webhook, rate limit) — vale
validar que o resto do sistema está certo antes de investir nisso. SaaS
(Fase 3) só faz sentido depois que a Fase 1 provar que o modelo de dados
aguenta o uso real, dia a dia.
