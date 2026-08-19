# Mapa Funcional — App de Gestão de Decants

**Versão:** 1.0
**Base:** Documento Mestre v1.0
**Objetivo deste documento:** traduzir a visão e as regras do Documento Mestre em módulos e telas concretas — o que o usuário vê, o que ele pode fazer, e o que o sistema faz sozinho.

Cada módulo segue o mesmo formato:
- 👀 **O que o usuário vê**
- 🖱️ **O que o usuário faz**
- ⚙️ **O que o sistema faz automaticamente**

---

## 1. Dashboard

👀 KPIs de vendas (faturamento, quantidade de pedidos, ticket médio, vendas por canal); KPIs de lucro (lucro, margem, custo de produtos/embalagem/taxas/marketing); estoque (perfumes em ml, decants disponíveis, insumos, itens com estoque baixo); operação (pedidos aguardando NF, em preparação, aguardando envio); painel de alertas.

🖱️ Filtra por período e canal; clica em qualquer indicador para abrir o detalhe correspondente (ex: clicar em "estoque baixo" abre a lista de itens).

⚙️ Calcula todos os indicadores em tempo real a partir das movimentações de estoque e dos pedidos — nada é digitado aqui. Gera os alertas (§41 do Documento Mestre: frasco com estoque baixo, perfume com estoque baixo, produto com margem abaixo do mínimo, pedido aguardando NF/envio).

---

## 2. Produtos (visão geral / catálogo)

👀 Lista unificada de tudo o que é vendável: variações de perfumes + kits, com estoque disponível, custo atual, preço e margem lado a lado.

🖱️ Busca por nome/SKU; filtra por canal, estoque baixo ou margem baixa; a partir daqui, navega para o cadastro específico (Perfume ou Kit).

⚙️ Agrega automaticamente os dados vindos dos módulos Perfumes, Estoque e Kits — este módulo não tem cadastro próprio, é uma visão consolidada.

---

## 3. Perfumes

👀 Lista de perfumes cadastrados; ao abrir um perfume, suas variações (5ml/8ml/10ml ou o conjunto configurado), a ficha técnica de cada uma, e o estoque de matéria-prima por lote.

🖱️ Cadastra um perfume novo informando apenas nome + quais tamanhos ele terá (ex: "Phebo Limão Siciliano" → 5, 8, 10ml) e salva; edita nome/tamanhos depois; pode substituir manualmente o SKU gerado pelo sistema.

⚙️ Gera o SKU automaticamente por variação (remove acentos, normaliza espaços, maiúsculas, inclui volume — ex: `PHEBO-LIMAO-SICILIANO-5ML`), garantindo unicidade dentro da empresa; monta a ficha técnica padrão de cada variação (Xml de perfume + 1 frasco/válvula do tamanho + 1 etiqueta de decant); cria a estrutura de estoque correspondente — sem exigir nenhum desses passos manualmente (§6, §17).

---

## 4. Estoque

👀 Três visões: **Perfume original** (ml por lote, com custo/ml de cada lote e custo médio ponderado); **Produto acabado** (decants disponíveis por variação: físico / reservado / disponível); **Insumos** (produção e expedição, separados). Histórico completo de movimentações, cada uma com sua origem.

🖱️ Registra ajustes manuais quando necessário (perda, avaria, contagem) — sempre informando o motivo, que vira a origem da movimentação.

⚙️ Nunca altera estoque diretamente — toda mudança (compra, produção, venda, reserva, cancelamento, devolução, ajuste) gera uma movimentação rastreável com origem (§23–24); calcula disponível = físico − reservado; dispara os alertas de estoque baixo que aparecem no Dashboard.

---

## 5. Compras

👀 Histórico de compras, cada uma com fornecedor, data, itens comprados e frete total; ao abrir uma compra, o rateio de frete e o custo final calculado por item.

🖱️ Cadastra uma compra nova informando: fornecedor, data, perfumes comprados (com volume e valor efetivamente pago por item, já líquido de qualquer desconto) e o frete total da compra.

⚙️ Cria um lote novo automaticamente para cada item comprado (§10); rateia o frete proporcionalmente ao valor de cada item (§13); calcula o custo total do lote (valor pago + parcela do frete) e o custo por ml (§14); atualiza o estoque de matéria-prima com uma movimentação de entrada; recalcula o custo médio ponderado do perfume considerando os lotes existentes (§16).

---

## 6. Produção

👀 Histórico de produções realizadas, cada uma com o perfume/variação, quantidade produzida e o custo histórico registrado no momento (§20).

🖱️ Informa perfume + variação + quantidade a produzir e confirma.

⚙️ Verifica automaticamente se há perfume (ml) e insumos (frascos/válvulas, etiquetas de decant) suficientes antes de liberar a produção — bloqueia se faltar algo; debita o perfume e os insumos consumidos (movimentação de saída) e credita os decants acabados (movimentação de entrada), usando o custo médio ponderado do perfume no momento da produção; esse custo fica "congelado" para aquele lote de decants mesmo que o perfume fique mais caro depois (§18–20).

---

## 7. Kits

👀 Kits cadastrados, sua composição (quais variações entram e em que quantidade) e o estoque disponível do kit.

🖱️ Cadastra um kit escolhendo os produtos componentes e as quantidades de cada um.

⚙️ Calcula o estoque disponível do kit automaticamente como o menor estoque entre os componentes (§22) — o kit não precisa de estoque físico próprio nesta fase.

---

## 8. Pedidos

👀 Pedidos dos dois canais (Nuvemshop e TikTok Shop), com status visível em cada etapa (recebido → pagamento confirmado → estoque reservado → preparação → NF → embalagem → envio → concluído); cliente, itens, quantidades, valores, frete e a taxa do canal aplicada no momento do pedido.

🖱️ Até a importação automática existir, avança o status manualmente; registra os dados da NF; cancela um pedido quando necessário.

⚙️ Ao confirmar pagamento, reserva o estoque automaticamente (sem baixar ainda) (§27); ao entrar em preparação, converte a reserva em baixa definitiva (§28); ao cancelar, libera a reserva — ou gera uma movimentação de retorno se o estoque já tinha sido baixado (§29); registra e "congela" a taxa do canal vigente naquele momento, para que mudanças futuras na taxa não afetem pedidos antigos (§34); separa automaticamente o valor dos produtos do valor do frete pago pelo cliente (§35).

---

## 9. Expedição

👀 Pedidos aguardando embalagem/envio, com os insumos de expedição necessários já calculados por pedido (não por decant).

🖱️ Marca o pedido como embalado e depois como enviado.

⚙️ Define automaticamente o tipo de caixa pela regra de quantidade (até 3 decants = caixa pequena, 4–6 = caixa grande, configurável) (§8); monta a lista de consumo do pedido — 1 etiqueta de envio, 1m de plástico bolha, fita (custo médio), 1 ziplock — sempre um por pedido, nunca multiplicado pela quantidade de decants (§7, §30); gera a movimentação de saída desses insumos com origem no pedido.

---

## 10. Financeiro

👀 Faturamento, lucro e caixa exibidos como três números separados; margem em três níveis — do produto, da venda (com embalagem, taxas e marketing) e líquida da empresa (com despesas gerais) (§37); despesas fixas recorrentes; taxas configuradas por canal.

🖱️ Cadastra despesas fixas recorrentes (ex: Nuvemshop R$70/mês); registra a entrada de caixa quando o dinheiro de fato é recebido da plataforma.

⚙️ Gera os lançamentos das despesas recorrentes automaticamente todo mês (§38); calcula os três níveis de margem usando os custos já rastreados nos outros módulos (produção, embalagem, taxa do canal, marketing); mantém faturamento (venda) separado de caixa (dinheiro recebido) — uma venda de hoje só vira caixa quando a plataforma libera o valor (§33).

---

## 11. Marketing

👀 Campanhas cadastradas com canal, data e investimento; futuramente, o funil investimento → vendas → receita → lucro → ROAS.

🖱️ Cadastra uma campanha com canal, data e valor investido.

⚙️ Nesta fase inicial, apenas organiza os dados informados; a relação automática investimento → ROAS é uma evolução futura (§39).

---

## 12. Configurações

👀 Parâmetros ajustáveis do sistema: tamanhos de decant disponíveis, regras de embalagem (limites de caixa pequena/grande), taxas por canal, insumos cadastrados, despesas fixas recorrentes.

🖱️ Ajusta qualquer um desses parâmetros conforme a operação evolui.

⚙️ Aplica as novas configurações apenas prospectivamente — histórico já registrado (ex: taxa de um pedido antigo, custo de um lote já usado) nunca é recalculado silenciosamente (§34, princípio 16).

---

## Fluxo entre módulos (referência rápida)

```
COMPRA → LOTE → ESTOQUE DE PERFUME → PRODUÇÃO → ESTOQUE DE DECANTS
                                                        │
                                        ┌───────────────┴───────────────┐
                                   NUVEMSHOP                       TIKTOK SHOP
                                        └───────────────┬───────────────┘
                                                     PEDIDO → RESERVA → PREPARAÇÃO
                                                     → BAIXA → NF → EXPEDIÇÃO → ENVIO
                                                        │
                                                  FINANCEIRO
                                          (LUCRO / MARGEM / CAIXA)
```

## Próxima etapa recomendada

Com os módulos e telas definidos, o passo seguinte é a **modelagem do banco de dados**: transformar cada módulo em entidades e relacionamentos (Perfumes, Variações, Lotes, Insumos, Compras, Produções, Kits, Pedidos, Itens de Pedido, Movimentações de Estoque, Financeiro), respeitando as regras críticas do Documento Mestre — especialmente a de que **nenhuma tabela de estoque é alterada diretamente**, só através de uma tabela de movimentações com origem.
