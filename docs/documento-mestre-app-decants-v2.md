📘 DOCUMENTO MESTRE — APP DE GESTÃO PARA DECANTS

Versão: 2.0
Status: Adendo sobre a Fundação (v1.0)
Objetivo: Este documento não substitui o v1.0 — ele complementa. Todas as regras, entidades e princípios do v1.0 continuam valendo. Aqui entram apenas as seções novas (§47 em diante), resolvendo os pontos identificados na revisão crítica do projeto.

CHANGELOG — O QUE MUDOU DA v1.0 PARA A v2.0

1. Sincronização de estoque entre Nuvemshop e TikTok Shop — o problema original que motivou o projeto inteiro, e que a v1.0 não fechava.
2. Rastreabilidade de lote na produção — a v1.0 registrava custo médio, mas não de qual lote específico o perfume saiu.
3. Proteção de estoque no banco de dados — a v1.0 deixava a validação de "tem estoque suficiente" só na aplicação.
4. Preparação para SaaS multiusuário — a v1.0 mencionava o objetivo, mas o schema não tinha nenhuma estrutura pra isso.
5. Cancelamento/devolução parcial de pedido — a v1.0 só previa status no nível do pedido inteiro.
6. Modelo de venda fracionado x inteiro — a v1.0 assumia que todo perfume é sempre fracionado em decants; não cobria quem revende o frasco original fechado, sem fracionar.
7. Regra de precificação — a v1.0 tinha o campo de preço, mas nunca definia como ele é calculado.

---

§47. SINCRONIZAÇÃO DE ESTOQUE ENTRE CANAIS

47.1 — O problema que fica sem solução na v1.0

O Documento Mestre v1.0 trata a Nuvemshop e o TikTok Shop como origem de pedidos, mas nunca define o caminho inverso: quando uma venda acontece em um canal, como o outro canal fica sabendo que o estoque diminuiu? Sem essa resposta, o app centraliza o controle interno perfeitamente, mas o problema original (vender o mesmo decant duas vezes em canais diferentes) continua existindo.

47.2 — Princípio novo

O sistema passa a ser a fonte única de verdade (SSOT) do estoque. Nenhum canal manda no estoque — cada canal apenas reflete o que o sistema calcula.

47.3 — Fluxo de sincronização

```
VENDA NO CANAL A                          VENDA NO CANAL B
      ↓                                          ↓
  Webhook de pedido                         Webhook de pedido
      ↓                                          ↓
      └──────────────→  SISTEMA CENTRAL  ←───────┘
                              ↓
                  valida estoque disponível
                              ↓
                  gera reserva/baixa (§27, §28 da v1.0)
                              ↓
                  recalcula estoque_disponivel (view)
                              ↓
              ┌───────────────┴───────────────┐
              ↓                                ↓
    atualiza estoque via API            atualiza estoque via API
         no Canal A                          no Canal B
```

47.4 — Tratamento de conflito (overselling)

Como os canais são assíncronos, é possível que dois pedidos cheguem quase ao mesmo tempo para o mesmo item com estoque insuficiente para os dois. Nesse caso, o sistema não deve falhar silenciosamente nem vender no negativo:

- O primeiro pedido a chegar consome o estoque normalmente.
- O segundo pedido, se não houver mais estoque disponível, entra em um status novo: `pendente_conflito` — fica visível no Dashboard como alerta prioritário, para decisão manual (cancelar, reabastecer, avisar o cliente).

47.5 — Nova entidade: log de sincronização

Toda tentativa de atualizar o estoque em um canal externo é registrada, com sucesso ou falha, para permitir reprocessamento em caso de instabilidade da API do canal:

```
canal_sincronizacoes
├── id
├── canal_id
├── variacao_id
├── estoque_enviado
├── status (sucesso | erro | pendente)
├── tentativas
└── criado_em
```

47.6 — Regra inquebrável nova

"Toda venda confirmada em um canal deve gerar, no mesmo fluxo, uma atualização de estoque disponível nos demais canais — mesmo que essa atualização seja assíncrona, ela nunca é opcional."

---

§48. RASTREABILIDADE DE LOTE NA PRODUÇÃO

48.1 — O problema

A v1.0 promete auditoria completa (§24), mas a produção (§18) só registra o total de ml consumido e um custo médio geral — não registra de qual lote específico o perfume saiu. Se existem dois lotes com custos diferentes, o sistema não sabe dizer exatamente quanto saiu de cada um.

48.2 — Regra de consumo definida: FIFO

Por padrão, a produção consome primeiro o lote mais antigo com saldo disponível (First In, First Out). Essa regra é configurável futuramente (§45 da v1.0 — Configurações), mas FIFO é o padrão inicial por ser o mais previsível e o mais próximo do que já acontece fisicamente no envase.

48.3 — Nova entidade: consumo por lote

```
producao_lotes_consumidos
├── id
├── producao_id
├── lote_id
├── quantidade_ml_consumida
└── custo_por_ml_no_momento
```

48.4 — Custo histórico da produção recalculado

O custo histórico de uma produção (§20 da v1.0) deixa de ser "o custo médio do perfume no momento" e passa a ser a média ponderada real dos lotes efetivamente consumidos naquela produção específica — mais preciso, e agora auditável lote a lote.

---

§49. PROTEÇÃO DE ESTOQUE NO BANCO DE DADOS

49.1 — O problema

A verificação de "existe perfume/insumo suficiente" (§18 da v1.0) era responsabilidade só da aplicação. Isso é frágil em cenários de concorrência — exatamente o cenário criado pelo §47 (dois canais vendendo ao mesmo tempo).

49.2 — Regra nova

Toda operação que gera uma movimentação de saída de estoque deve, dentro da mesma transação de banco:

1. Bloquear a leitura do saldo do item (lock pessimista);
2. Verificar se o saldo após a movimentação seria negativo;
3. Rejeitar a transação inteira se sim — nunca permitir estoque negativo persistido.

Isso garante que a regra vale mesmo se dois processos tentarem consumir o mesmo item ao mesmo tempo, sem depender só da aplicação lembrar de checar antes.

49.3 — Consequência prática

O `pendente_conflito` do §47.4 é o que acontece quando essa proteção do banco rejeita uma segunda tentativa de baixa — a rejeição no banco é o gatilho que joga o pedido para revisão manual, em vez de deixar o pedido travado sem explicação.

---

§50. PREPARAÇÃO PARA SAAS MULTIUSUÁRIO

50.1 — O problema

A v1.0 (§1, §46) já declara a intenção de virar produto SaaS no futuro, mas nenhuma tabela do schema tem qualquer noção de "para qual empresa/usuário esse dado pertence". Migrar um schema de single-tenant para multi-tenant depois não é um ajuste — é um projeto à parte.

50.2 — Decisão adotada

Adicionar a estrutura de multi-tenant desde já, mesmo operando com uma única empresa por enquanto. O custo de incluir isso agora é baixo; o custo de adicionar depois, com dados reais em produção, é alto.

50.3 — Nova entidade raiz

```
empresas
├── id
├── nome
└── criado_em
```

Toda tabela que hoje guarda dado operacional (perfumes, variações, lotes, insumos, compras, produções, kits, pedidos, financeiro, marketing) passa a ter uma coluna `empresa_id`, referenciando essa tabela.

50.4 — Isolamento de dados

No Supabase, isso se resolve com Row Level Security (RLS): cada usuário só enxerga linhas onde `empresa_id` corresponde à empresa dele. Para a operação atual (uso próprio), existe uma única linha em `empresas` e todo o resto do sistema funciona exatamente como hoje — essa mudança é invisível no dia a dia, só existe pensando no futuro.

---

§51. CANCELAMENTO E DEVOLUÇÃO PARCIAL DE PEDIDO

51.1 — O problema

A v1.0 modela o status (§26) no nível do pedido inteiro. Na prática, um cliente frequentemente cancela ou devolve um item específico de um pedido com vários produtos — não o pedido inteiro.

51.2 — Regra nova

O status de cancelamento/devolução passa a existir no nível do item do pedido, não só no pedido:

```
pedido_item.status: ativo | cancelado | devolvido
```

51.3 — Relação entre status do item e status do pedido

O status logístico do pedido (§26 da v1.0: recebido → pagamento → reserva → preparação → NF → embalagem → envio → concluído) continua existindo e seguindo seu fluxo normal. Em paralelo, cada item carrega seu próprio status de exceção. Regras:

- Cancelar um item libera a reserva/baixa só daquele item (não do pedido inteiro).
- Se todos os itens de um pedido forem cancelados, o pedido inteiro é considerado cancelado.
- Devolução de um item gera sua própria movimentação de estoque (entrada, com origem no item devolvido), preservando o histórico de que aquele item específico voltou.

---

§52. MODELO DE VENDA: FRACIONADO x INTEIRO

52.1 — O problema

Diferentes operações do nicho podem vender de duas formas fundamentalmente diferentes: fracionando um perfume em decants menores (o modelo do Gui) ou revendendo o frasco original fechado, sem fracionar — por exemplo, uma empresa que compra um Paco Rabanne 100ml e revende o frasco inteiro, sem abrir. Isso não é uma diferença de unidade de medida (ml, g, oz) — é um modelo de operação diferente, e forçar os dois dentro do mesmo fluxo de fracionamento quebraria a lógica pra quem revende inteiro (não existe "produção" nem "consumo de ml" nesse caso).

52.2 — Regra nova

Cada variação passa a ter um campo `modo_venda`, com exatamente dois valores possíveis: `fracionado` ou `inteiro`. Não é um campo de unidade de medida livre — são só esses dois modelos de operação.

52.3 — Modo fracionado (padrão da operação atual do Gui)

Segue exatamente as regras já definidas: compra vira lote em ml (§10–16 da v1.0) → produção consome ml do lote (via FIFO, §48 da v2.0) + insumos de produção (frasco, etiqueta) → gera estoque da variação como produto acabado.

52.4 — Modo inteiro

A compra credita o estoque da variação diretamente — o item comprado já é o produto final, sem etapa de produção nem consumo de ml de um lote. A ficha técnica desse modo, quando existir, cobre só embalagem/insumos de expedição (ex: lacre), nunca volume de perfume.

52.5 — Convivência dos dois modos

O modo é definido por variação, não por perfume nem por empresa inteira — a mesma empresa pode ter um perfume vendido fracionado (decants) e outro revendido inteiro (frasco fechado), inclusive o mesmo perfume nos dois modos ao mesmo tempo, se fizer sentido pro negócio dela.

52.6 — Impacto nos módulos do Mapa Funcional

No módulo de Produção, variações em modo `inteiro` simplesmente não aparecem — não há nada a produzir. No módulo de Perfumes, o cadastro de cada variação passa a perguntar o modo de venda, além do tamanho. No módulo de Compras, o formulário se adapta: modo fracionado pede perfume + volume comprado; modo inteiro pede direto a variação (frasco) + quantidade comprada.

52.7 — Exemplo confirmado: "APC" (metade do frasco, na embalagem original)

Uma variação como "metade do frasco" (ex: 50ml de um perfume de 100ml) é apenas mais um tamanho dentro do modo `fracionado` — não é um terceiro modo. A diferença fica só na ficha técnica dessa variação específica: ela não inclui o insumo de frasco/válvula de decant (porque não vai pra um frasquinho pequeno, fica na embalagem original), mas continua consumindo ml do lote normalmente. Os insumos de expedição (caixa, fita, etiqueta de envio, plástico bolha) não mudam nada, porque já são calculados por pedido (§30 da v1.0), não por variação — nenhuma mudança de schema é necessária, só a configuração da ficha técnica dessa variação sem o item de frasco.

---

§53. REGRA DE PRECIFICAÇÃO

53.1 — Decisão

O preço de cada variação é **sugerido pelo sistema** (custo + margem-alvo), mas sempre **editável** pelo usuário antes de salvar. Nunca é calculado e travado automaticamente.

53.2 — A margem-alvo é líquida da taxa do canal

A sugestão não calcula a margem só sobre o custo de produção — ela já embute a taxa do canal de venda, para que a margem-alvo realmente sobre no bolso depois de a plataforma descontar a taxa. Fórmula:

```
Preço = (Custo + Taxa Fixa do Canal) ÷ (1 − Percentual do Canal − Margem-Alvo)
```

Onde Custo = custo de produção da variação (ml consumido × custo médio ponderado do perfume + insumos de produção da ficha técnica) + um custo de embalagem estimado (configurável, calculado a partir da média dos insumos de expedição — caixa, etiqueta de envio, fita, ziplock, plástico bolha).

53.3 — Faixas de taxa (TikTok Shop)

Como o TikTok Shop cobra taxas diferentes por faixa de preço (§ dados reais informados), a sugestão testa cada faixa em ordem e usa a primeira cujo preço resultante realmente pertence àquela faixa — evita o problema de "a taxa depende do preço, e o preço depende da taxa".

53.4 — Margem-alvo configurável em dois níveis

Existe uma margem-alvo padrão por empresa (em Configurações) e cada variação pode sobrescrever esse padrão individualmente, se um produto específico precisar de uma margem diferente.

53.5 — Quando a sugestão não é possível

Se a margem-alvo for alta demais para a faixa de taxa mais barata do canal, nenhuma faixa fecha a conta de forma consistente — nesse caso o sistema não sugere nada e avisa o usuário para ajustar manualmente (a margem pedida, o custo, ou aceitar uma margem menor).

---

RESUMO DAS NOVAS ENTIDADES (v2.0)

```
empresas
canal_sincronizacoes
producao_lotes_consumidos
```

E as alterações em entidades existentes:

```
todas as tabelas operacionais → + empresa_id
pedido_itens                  → + status (ativo | cancelado | devolvido)
producoes.custo_unitario_historico → recalculado via producao_lotes_consumidos
variacoes                     → + modo_venda (fracionado | inteiro)
compra_itens                  → passa a aceitar dois formatos: perfume+volume_ml
                                 (fracionado, gera lote) ou variacao+quantidade
                                 (inteiro, credita a variação direto)
```

PRÓXIMA ETAPA RECOMENDADA

Atualizar o schema SQL (v1.0) incorporando essas cinco mudanças — principalmente a tabela de consumo por lote, o lock/constraint de estoque negativo, e o `empresa_id` em todas as tabelas operacionais.

🔒 STATUS DO DOCUMENTO

Documento Mestre v2.0 — Adendo de Melhorias. Junto com o v1.0, esta é a fonte de verdade atual do projeto.
