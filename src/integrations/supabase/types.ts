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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cash_registers: {
        Row: {
          closing_balance: number
          created_at: string
          date: string
          id: string
          opening_balance: number
          total_sales: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          closing_balance?: number
          created_at?: string
          date?: string
          id?: string
          opening_balance?: number
          total_sales?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          closing_balance?: number
          created_at?: string
          date?: string
          id?: string
          opening_balance?: number
          total_sales?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_redemptions: {
        Row: {
          amount: number
          created_at: string
          credit_id: string
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_id: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_id?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_redemptions_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "customer_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_accounts: {
        Row: {
          created_at: string
          id: string
          last_movement_at: string | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["account_status"]
          total_debt: number
          total_paid: number
          total_remaining: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_movement_at?: string | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          total_debt?: number
          total_paid?: number
          total_remaining?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_movement_at?: string | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          total_debt?: number
          total_paid?: number
          total_remaining?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_credits: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          origin_product_id: string | null
          origin_sale_id: string | null
          remaining_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          origin_product_id?: string | null
          origin_sale_id?: string | null
          remaining_amount: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          origin_product_id?: string | null
          origin_sale_id?: string | null
          remaining_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_origin_product_id_fkey"
            columns: ["origin_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credits_origin_sale_id_fkey"
            columns: ["origin_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_items: {
        Row: {
          created_at: string
          debt_id: string
          id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          debt_id: string
          id?: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          debt_id?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_items_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          created_at: string
          customer_account_id: string
          date: string
          description: string
          id: string
          paid_amount: number
          remaining_amount: number
          status: Database["public"]["Enums"]["debt_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_account_id: string
          date?: string
          description: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          status?: Database["public"]["Enums"]["debt_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_account_id?: string
          date?: string
          description?: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          status?: Database["public"]["Enums"]["debt_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_customer_account_id_fkey"
            columns: ["customer_account_id"]
            isOneToOne: false
            referencedRelation: "customer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          debt_id: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          debt_id: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          debt_id?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          code: string
          color: string | null
          created_at: string
          gender: string | null
          id: string
          material: string | null
          model: string | null
          name: string
          price: number
          size: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          code: string
          color?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          material?: string | null
          model?: string | null
          name: string
          price: number
          size?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          code?: string
          color?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          material?: string | null
          model?: string | null
          name?: string
          price?: number
          size?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_account_id: string | null
          date: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_account_id?: string | null
          date?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_account_id?: string | null
          date?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_account_id_fkey"
            columns: ["customer_account_id"]
            isOneToOne: false
            referencedRelation: "customer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_users_with_roles: {
        Args: never
        Returns: {
          email: string
          id: string
          is_admin: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "al-dia" | "deuda" | "condicional"
      app_role: "admin" | "moderator" | "user"
      debt_status: "pendiente" | "parcial" | "pagado"
      payment_method:
        | "efectivo"
        | "debito"
        | "credito"
        | "transferencia"
        | "mercado_pago"
        | "bna"
        | "dni"
        | "otro"
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
      account_status: ["al-dia", "deuda", "condicional"],
      app_role: ["admin", "moderator", "user"],
      debt_status: ["pendiente", "parcial", "pagado"],
      payment_method: [
        "efectivo",
        "debito",
        "credito",
        "transferencia",
        "mercado_pago",
        "bna",
        "dni",
        "otro",
      ],
    },
  },
} as const
