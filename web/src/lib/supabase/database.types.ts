export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      caixa_movimentos: {
        Row: {
          empresa_id: string
          id: string
          pedido_id: string | null
          recebido_em: string
          valor: number
        }
        Insert: {
          empresa_id: string
          id?: string
          pedido_id?: string | null
          recebido_em?: string
          valor: number
        }
        Update: {
          empresa_id?: string
          id?: string
          pedido_id?: string | null
          recebido_em?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_movimentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_marketing: {
        Row: {
          canal_id: string | null
          data: string
          empresa_id: string
          id: string
          investimento: number
          nome: string
        }
        Insert: {
          canal_id?: string | null
          data: string
          empresa_id: string
          id?: string
          investimento: number
          nome: string
        }
        Update: {
          canal_id?: string | null
          data?: string
          empresa_id?: string
          id?: string
          investimento?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_marketing_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_marketing_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      canais: {
        Row: {
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "canais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      canal_sincronizacoes: {
        Row: {
          canal_id: string
          criado_em: string
          empresa_id: string
          estoque_enviado: number
          id: string
          status: Database["public"]["Enums"]["sincronizacao_status"]
          tentativas: number
          variacao_id: string
        }
        Insert: {
          canal_id: string
          criado_em?: string
          empresa_id: string
          estoque_enviado: number
          id?: string
          status?: Database["public"]["Enums"]["sincronizacao_status"]
          tentativas?: number
          variacao_id: string
        }
        Update: {
          canal_id?: string
          criado_em?: string
          empresa_id?: string
          estoque_enviado?: number
          id?: string
          status?: Database["public"]["Enums"]["sincronizacao_status"]
          tentativas?: number
          variacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canal_sincronizacoes_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canal_sincronizacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canal_sincronizacoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canal_sincronizacoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_producao_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "canal_sincronizacoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "canal_sincronizacoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao_disponivel"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      compra_itens: {
        Row: {
          compra_id: string
          custo_por_ml: number | null
          custo_total: number | null
          custo_unitario: number | null
          frete_rateado: number
          id: string
          perfume_id: string | null
          quantidade: number | null
          valor_pago: number
          variacao_id: string | null
          volume_ml: number | null
        }
        Insert: {
          compra_id: string
          custo_por_ml?: number | null
          custo_total?: number | null
          custo_unitario?: number | null
          frete_rateado?: number
          id?: string
          perfume_id?: string | null
          quantidade?: number | null
          valor_pago: number
          variacao_id?: string | null
          volume_ml?: number | null
        }
        Update: {
          compra_id?: string
          custo_por_ml?: number | null
          custo_total?: number | null
          custo_unitario?: number | null
          frete_rateado?: number
          id?: string
          perfume_id?: string | null
          quantidade?: number | null
          valor_pago?: number
          variacao_id?: string | null
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compra_itens_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_itens_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_producao_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "compra_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "compra_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao_disponivel"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      compras: {
        Row: {
          criado_em: string
          data: string
          empresa_id: string
          fornecedor_id: string | null
          frete_total: number
          id: string
        }
        Insert: {
          criado_em?: string
          data: string
          empresa_id: string
          fornecedor_id?: string | null
          frete_total?: number
          id?: string
        }
        Update: {
          criado_em?: string
          data?: string
          empresa_id?: string
          fornecedor_id?: string | null
          frete_total?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          empresa_id: string
          valor: Json
        }
        Insert: {
          chave: string
          empresa_id: string
          valor: Json
        }
        Update: {
          chave?: string
          empresa_id?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas_fixas: {
        Row: {
          ativo: boolean
          empresa_id: string
          id: string
          nome: string
          recorrencia: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          empresa_id: string
          id?: string
          nome: string
          recorrencia?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          empresa_id?: string
          id?: string
          nome?: string
          recorrencia?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_fixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      fichas_tecnicas: {
        Row: {
          id: string
          insumo_id: string
          quantidade: number
          variacao_id: string
        }
        Insert: {
          id?: string
          insumo_id: string
          quantidade?: number
          variacao_id: string
        }
        Update: {
          id?: string
          insumo_id?: string
          quantidade?: number
          variacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_insumo"
            referencedColumns: ["insumo_id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_producao_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao_disponivel"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          criado_em: string
          custo_medio: number
          empresa_id: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["insumo_tipo"]
          volume_ml: number | null
        }
        Insert: {
          criado_em?: string
          custo_medio?: number
          empresa_id: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["insumo_tipo"]
          volume_ml?: number | null
        }
        Update: {
          criado_em?: string
          custo_medio?: number
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["insumo_tipo"]
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insumos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_itens: {
        Row: {
          kit_id: string
          quantidade: number
          variacao_id: string
        }
        Insert: {
          kit_id: string
          quantidade?: number
          variacao_id: string
        }
        Update: {
          kit_id?: string
          quantidade?: number
          variacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_kit"
            referencedColumns: ["kit_id"]
          },
          {
            foreignKeyName: "kit_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_producao_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "kit_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "kit_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao_disponivel"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      kits: {
        Row: {
          ativo: boolean
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "kits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          categoria: string
          criado_em: string
          data: string
          despesa_fixa_id: string | null
          empresa_id: string
          id: string
          pedido_id: string | null
          tipo: Database["public"]["Enums"]["lancamento_tipo"]
          valor: number
        }
        Insert: {
          categoria: string
          criado_em?: string
          data: string
          despesa_fixa_id?: string | null
          empresa_id: string
          id?: string
          pedido_id?: string | null
          tipo: Database["public"]["Enums"]["lancamento_tipo"]
          valor: number
        }
        Update: {
          categoria?: string
          criado_em?: string
          data?: string
          despesa_fixa_id?: string | null
          empresa_id?: string
          id?: string
          pedido_id?: string | null
          tipo?: Database["public"]["Enums"]["lancamento_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_despesa_fixa_id_fkey"
            columns: ["despesa_fixa_id"]
            isOneToOne: false
            referencedRelation: "despesas_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          compra_item_id: string
          criado_em: string
          custo_por_ml: number
          empresa_id: string
          id: string
          perfume_id: string
          volume_inicial_ml: number
        }
        Insert: {
          compra_item_id: string
          criado_em?: string
          custo_por_ml: number
          empresa_id: string
          id?: string
          perfume_id: string
          volume_inicial_ml: number
        }
        Update: {
          compra_item_id?: string
          criado_em?: string
          custo_por_ml?: number
          empresa_id?: string
          id?: string
          perfume_id?: string
          volume_inicial_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "lotes_compra_item_id_fkey"
            columns: ["compra_item_id"]
            isOneToOne: false
            referencedRelation: "compra_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          criado_em: string
          empresa_id: string
          id: string
          item_id: string
          item_tipo: Database["public"]["Enums"]["item_tipo"]
          motivo: string | null
          movimentacao_tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          origem_id: string
          origem_tipo: Database["public"]["Enums"]["origem_tipo"]
          quantidade: number
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          id?: string
          item_id: string
          item_tipo: Database["public"]["Enums"]["item_tipo"]
          motivo?: string | null
          movimentacao_tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          origem_id: string
          origem_tipo: Database["public"]["Enums"]["origem_tipo"]
          quantidade: number
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          id?: string
          item_id?: string
          item_tipo?: Database["public"]["Enums"]["item_tipo"]
          motivo?: string | null
          movimentacao_tipo?: Database["public"]["Enums"]["movimentacao_tipo"]
          origem_id?: string
          origem_tipo?: Database["public"]["Enums"]["origem_tipo"]
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_expedicao: {
        Row: {
          embalado_em: string | null
          enviado_em: string | null
          id: string
          pedido_id: string
          tipo_caixa: string
        }
        Insert: {
          embalado_em?: string | null
          enviado_em?: string | null
          id?: string
          pedido_id: string
          tipo_caixa: string
        }
        Update: {
          embalado_em?: string | null
          enviado_em?: string | null
          id?: string
          pedido_id?: string
          tipo_caixa?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_expedicao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          custo_unitario_historico: number | null
          id: string
          kit_id: string | null
          pedido_id: string
          preco_unitario: number
          quantidade: number
          status: Database["public"]["Enums"]["pedido_item_status"]
          variacao_id: string | null
        }
        Insert: {
          custo_unitario_historico?: number | null
          id?: string
          kit_id?: string | null
          pedido_id: string
          preco_unitario: number
          quantidade: number
          status?: Database["public"]["Enums"]["pedido_item_status"]
          variacao_id?: string | null
        }
        Update: {
          custo_unitario_historico?: number | null
          id?: string
          kit_id?: string | null
          pedido_id?: string
          preco_unitario?: number
          quantidade?: number
          status?: Database["public"]["Enums"]["pedido_item_status"]
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_kit"
            referencedColumns: ["kit_id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_producao_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao_disponivel"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      pedidos: {
        Row: {
          canal_id: string
          cliente_nome: string | null
          criado_em: string
          empresa_id: string
          id: string
          id_externo: string
          nf_chave: string | null
          nf_numero: string | null
          nf_serie: string | null
          nf_status: string | null
          status: Database["public"]["Enums"]["pedido_status"]
          taxa_fixa_aplicada: number | null
          taxa_percentual_aplicada: number | null
          taxa_valor_aplicada: number | null
          valor_frete: number
          valor_produtos: number
        }
        Insert: {
          canal_id: string
          cliente_nome?: string | null
          criado_em?: string
          empresa_id: string
          id?: string
          id_externo: string
          nf_chave?: string | null
          nf_numero?: string | null
          nf_serie?: string | null
          nf_status?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          taxa_fixa_aplicada?: number | null
          taxa_percentual_aplicada?: number | null
          taxa_valor_aplicada?: number | null
          valor_frete?: number
          valor_produtos: number
        }
        Update: {
          canal_id?: string
          cliente_nome?: string | null
          criado_em?: string
          empresa_id?: string
          id?: string
          id_externo?: string
          nf_chave?: string | null
          nf_numero?: string | null
          nf_serie?: string | null
          nf_status?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          taxa_fixa_aplicada?: number | null
          taxa_percentual_aplicada?: number | null
          taxa_valor_aplicada?: number | null
          valor_frete?: number
          valor_produtos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes: {
        Row: {
          criado_em: string
          empresa_id: string
          foto_url: string | null
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          foto_url?: string | null
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          foto_url?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfumes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_insumos_consumidos: {
        Row: {
          id: string
          insumo_id: string
          producao_id: string
          quantidade: number
        }
        Insert: {
          id?: string
          insumo_id: string
          producao_id: string
          quantidade: number
        }
        Update: {
          id?: string
          insumo_id?: string
          producao_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "producao_insumos_consumidos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_insumos_consumidos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_insumo"
            referencedColumns: ["insumo_id"]
          },
          {
            foreignKeyName: "producao_insumos_consumidos_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producoes"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_lotes_consumidos: {
        Row: {
          custo_por_ml_no_momento: number
          id: string
          lote_id: string
          producao_id: string
          quantidade_ml_consumida: number
        }
        Insert: {
          custo_por_ml_no_momento: number
          id?: string
          lote_id: string
          producao_id: string
          quantidade_ml_consumida: number
        }
        Update: {
          custo_por_ml_no_momento?: number
          id?: string
          lote_id?: string
          producao_id?: string
          quantidade_ml_consumida?: number
        }
        Relationships: [
          {
            foreignKeyName: "producao_lotes_consumidos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_lotes_consumidos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_lote"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "producao_lotes_consumidos_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producoes"
            referencedColumns: ["id"]
          },
        ]
      }
      producoes: {
        Row: {
          criado_em: string
          custo_unitario_historico: number
          empresa_id: string
          id: string
          perfume_consumido_ml: number
          quantidade: number
          variacao_id: string
        }
        Insert: {
          criado_em?: string
          custo_unitario_historico: number
          empresa_id: string
          id?: string
          perfume_consumido_ml: number
          quantidade: number
          variacao_id: string
        }
        Update: {
          criado_em?: string
          custo_unitario_historico?: number
          empresa_id?: string
          id?: string
          perfume_consumido_ml?: number
          quantidade?: number
          variacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_producao_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "producoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao"
            referencedColumns: ["variacao_id"]
          },
          {
            foreignKeyName: "producoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_variacao_disponivel"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      regras_embalagem: {
        Row: {
          empresa_id: string
          id: string
          qtd_maxima: number
          qtd_minima: number
          tipo_caixa: string
        }
        Insert: {
          empresa_id: string
          id?: string
          qtd_maxima: number
          qtd_minima: number
          tipo_caixa: string
        }
        Update: {
          empresa_id?: string
          id?: string
          qtd_maxima?: number
          qtd_minima?: number
          tipo_caixa?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_embalagem_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      taxas_canal: {
        Row: {
          canal_id: string
          faixa_valor_max: number | null
          faixa_valor_min: number
          id: string
          percentual: number
          taxa_fixa: number
          vigente_desde: string
        }
        Insert: {
          canal_id: string
          faixa_valor_max?: number | null
          faixa_valor_min?: number
          id?: string
          percentual: number
          taxa_fixa?: number
          vigente_desde?: string
        }
        Update: {
          canal_id?: string
          faixa_valor_max?: number | null
          faixa_valor_min?: number
          id?: string
          percentual?: number
          taxa_fixa?: number
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxas_canal_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          criado_em: string
          empresa_id: string
          id: string
          nome: string | null
          papel: Database["public"]["Enums"]["usuario_papel"]
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          id: string
          nome?: string | null
          papel?: Database["public"]["Enums"]["usuario_papel"]
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          id?: string
          nome?: string | null
          papel?: Database["public"]["Enums"]["usuario_papel"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      variacoes: {
        Row: {
          ativo: boolean
          criado_em: string
          empresa_id: string
          id: string
          margem_alvo: number | null
          modo_venda: Database["public"]["Enums"]["modo_venda_tipo"]
          perfume_id: string
          preco_venda: number | null
          sku: string
          volume_ml: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          empresa_id: string
          id?: string
          margem_alvo?: number | null
          modo_venda?: Database["public"]["Enums"]["modo_venda_tipo"]
          perfume_id: string
          preco_venda?: number | null
          sku: string
          volume_ml: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          empresa_id?: string
          id?: string
          margem_alvo?: number | null
          modo_venda?: Database["public"]["Enums"]["modo_venda_tipo"]
          perfume_id?: string
          preco_venda?: number | null
          sku?: string
          volume_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variacoes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_custo_medio_perfume: {
        Row: {
          custo_medio_ml: number | null
          empresa_id: string | null
          perfume_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_custo_producao_variacao: {
        Row: {
          custo_producao: number | null
          empresa_id: string | null
          modo_venda: Database["public"]["Enums"]["modo_venda_tipo"] | null
          perfume_id: string | null
          variacao_id: string | null
          volume_ml: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variacoes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_insumo: {
        Row: {
          empresa_id: string | null
          estoque_atual: number | null
          insumo_id: string | null
          nome: string | null
          tipo: Database["public"]["Enums"]["insumo_tipo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "insumos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_kit: {
        Row: {
          empresa_id: string | null
          kit_id: string | null
          kits_disponiveis: number | null
          nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_lote: {
        Row: {
          criado_em: string | null
          custo_por_ml: number | null
          empresa_id: string | null
          lote_id: string | null
          perfume_id: string | null
          volume_atual_ml: number | null
          volume_inicial_ml: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_perfume: {
        Row: {
          empresa_id: string | null
          perfume_id: string | null
          volume_total_ml: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_variacao: {
        Row: {
          empresa_id: string | null
          estoque_fisico: number | null
          estoque_reservado: number | null
          perfume_id: string | null
          sku: string | null
          variacao_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variacoes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_variacao_disponivel: {
        Row: {
          empresa_id: string | null
          estoque_disponivel: number | null
          estoque_fisico: number | null
          estoque_reservado: number | null
          perfume_id: string | null
          sku: string | null
          variacao_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variacoes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_consumir_lotes_fifo: {
        Args: { p_perfume_id: string; p_volume_ml: number }
        Returns: {
          custo_por_ml: number
          lote_id: string
          quantidade_ml: number
        }[]
      }
      fn_registrar_compra: {
        Args: {
          p_data: string
          p_empresa_id: string
          p_fornecedor_id: string
          p_frete_total: number
          p_itens: Json
        }
        Returns: string
      }
      fn_saldo_atual: {
        Args: {
          p_item_id: string
          p_item_tipo: Database["public"]["Enums"]["item_tipo"]
        }
        Returns: number
      }
      fn_sugerir_preco: {
        Args: { p_canal_id: string; p_variacao_id: string }
        Returns: number
      }
    }
    Enums: {
      insumo_tipo: "producao" | "expedicao"
      item_tipo: "lote_perfume" | "variacao" | "insumo"
      lancamento_tipo: "receita" | "despesa"
      modo_venda_tipo: "fracionado" | "inteiro"
      movimentacao_tipo:
        | "entrada"
        | "saida"
        | "reserva"
        | "liberacao_reserva"
        | "baixa_definitiva"
        | "devolucao"
        | "ajuste"
        | "perda"
        | "avaria"
      origem_tipo:
        | "compra"
        | "producao"
        | "pedido"
        | "ajuste_manual"
        | "cancelamento"
        | "devolucao"
      pedido_item_status: "ativo" | "cancelado" | "devolvido"
      pedido_status:
        | "recebido"
        | "pagamento_confirmado"
        | "estoque_reservado"
        | "preparacao"
        | "nf_emitida"
        | "embalagem"
        | "enviado"
        | "concluido"
        | "cancelado"
        | "pendente_conflito"
      sincronizacao_status: "sucesso" | "erro" | "pendente"
      usuario_papel: "owner" | "admin" | "membro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      insumo_tipo: ["producao", "expedicao"],
      item_tipo: ["lote_perfume", "variacao", "insumo"],
      lancamento_tipo: ["receita", "despesa"],
      modo_venda_tipo: ["fracionado", "inteiro"],
      movimentacao_tipo: [
        "entrada",
        "saida",
        "reserva",
        "liberacao_reserva",
        "baixa_definitiva",
        "devolucao",
        "ajuste",
        "perda",
        "avaria",
      ],
      origem_tipo: [
        "compra",
        "producao",
        "pedido",
        "ajuste_manual",
        "cancelamento",
        "devolucao",
      ],
      pedido_item_status: ["ativo", "cancelado", "devolvido"],
      pedido_status: [
        "recebido",
        "pagamento_confirmado",
        "estoque_reservado",
        "preparacao",
        "nf_emitida",
        "embalagem",
        "enviado",
        "concluido",
        "cancelado",
        "pendente_conflito",
      ],
      sincronizacao_status: ["sucesso", "erro", "pendente"],
      usuario_papel: ["owner", "admin", "membro"],
    },
  },
} as const
