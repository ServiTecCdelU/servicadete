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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cadetes: {
        Row: {
          activo: boolean
          created_at: string
          dni: string | null
          id: string
          mensajeria_id: string
          nombre: string
          perfil_id: string | null
          saldo: number
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dni?: string | null
          id?: string
          mensajeria_id: string
          nombre: string
          perfil_id?: string | null
          saldo?: number
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          dni?: string | null
          id?: string
          mensajeria_id?: string
          nombre?: string
          perfil_id?: string | null
          saldo?: number
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cadetes_mensajeria_id_fkey"
            columns: ["mensajeria_id"]
            isOneToOne: false
            referencedRelation: "mensajerias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadetes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comercios: {
        Row: {
          activo: boolean
          cadete_fijo_id: string | null
          created_at: string
          direccion: string | null
          id: string
          mensajeria_id: string
          nombre: string
          perfil_id: string | null
          tarifa: number
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          cadete_fijo_id?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          mensajeria_id: string
          nombre: string
          perfil_id?: string | null
          tarifa?: number
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          cadete_fijo_id?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          mensajeria_id?: string
          nombre?: string
          perfil_id?: string | null
          tarifa?: number
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comercios_mensajeria_id_cadete_fijo_id_fkey"
            columns: ["mensajeria_id", "cadete_fijo_id"]
            isOneToOne: false
            referencedRelation: "cadetes"
            referencedColumns: ["mensajeria_id", "id"]
          },
          {
            foreignKeyName: "comercios_mensajeria_id_fkey"
            columns: ["mensajeria_id"]
            isOneToOne: false
            referencedRelation: "mensajerias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comercios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      envios: {
        Row: {
          asignado_at: string | null
          cadete_id: string | null
          comercio_id: string | null
          comision: number
          confirmado: boolean
          created_at: string
          direccion_destino: string
          direccion_origen: string | null
          entregado_at: string | null
          estado: string
          fecha_operativa: string
          id: string
          lat_entrega: number | null
          lat_retiro: number | null
          lng_entrega: number | null
          lng_retiro: number | null
          mensajeria_id: string
          nombre_contacto: string | null
          nota: string | null
          origen: string
          retirado_at: string | null
          tarifa: number
          telefono_contacto: string | null
        }
        Insert: {
          asignado_at?: string | null
          cadete_id?: string | null
          comercio_id?: string | null
          comision?: number
          confirmado?: boolean
          created_at?: string
          direccion_destino: string
          direccion_origen?: string | null
          entregado_at?: string | null
          estado?: string
          fecha_operativa?: string
          id?: string
          lat_entrega?: number | null
          lat_retiro?: number | null
          lng_entrega?: number | null
          lng_retiro?: number | null
          mensajeria_id: string
          nombre_contacto?: string | null
          nota?: string | null
          origen: string
          retirado_at?: string | null
          tarifa?: number
          telefono_contacto?: string | null
        }
        Update: {
          asignado_at?: string | null
          cadete_id?: string | null
          comercio_id?: string | null
          comision?: number
          confirmado?: boolean
          created_at?: string
          direccion_destino?: string
          direccion_origen?: string | null
          entregado_at?: string | null
          estado?: string
          fecha_operativa?: string
          id?: string
          lat_entrega?: number | null
          lat_retiro?: number | null
          lng_entrega?: number | null
          lng_retiro?: number | null
          mensajeria_id?: string
          nombre_contacto?: string | null
          nota?: string | null
          origen?: string
          retirado_at?: string | null
          tarifa?: number
          telefono_contacto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envios_mensajeria_id_cadete_id_fkey"
            columns: ["mensajeria_id", "cadete_id"]
            isOneToOne: false
            referencedRelation: "cadetes"
            referencedColumns: ["mensajeria_id", "id"]
          },
          {
            foreignKeyName: "envios_mensajeria_id_comercio_id_fkey"
            columns: ["mensajeria_id", "comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["mensajeria_id", "id"]
          },
          {
            foreignKeyName: "envios_mensajeria_id_fkey"
            columns: ["mensajeria_id"]
            isOneToOne: false
            referencedRelation: "mensajerias"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          concepto: string
          created_at: string
          created_by: string | null
          fecha_operativa: string
          id: string
          mensajeria_id: string
          monto: number
          nota: string | null
        }
        Insert: {
          concepto: string
          created_at?: string
          created_by?: string | null
          fecha_operativa?: string
          id?: string
          mensajeria_id: string
          monto: number
          nota?: string | null
        }
        Update: {
          concepto?: string
          created_at?: string
          created_by?: string | null
          fecha_operativa?: string
          id?: string
          mensajeria_id?: string
          monto?: number
          nota?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_mensajeria_id_fkey"
            columns: ["mensajeria_id"]
            isOneToOne: false
            referencedRelation: "mensajerias"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajerias: {
        Row: {
          activa: boolean
          comision_cadete: number
          created_at: string
          dia_inicio_semana: number
          id: string
          logo_url: string | null
          nombre: string
          slug: string
        }
        Insert: {
          activa?: boolean
          comision_cadete?: number
          created_at?: string
          dia_inicio_semana?: number
          id?: string
          logo_url?: string | null
          nombre: string
          slug: string
        }
        Update: {
          activa?: boolean
          comision_cadete?: number
          created_at?: string
          dia_inicio_semana?: number
          id?: string
          logo_url?: string | null
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      movimientos: {
        Row: {
          cadete_id: string
          created_at: string
          created_by: string | null
          envio_id: string | null
          id: string
          mensajeria_id: string
          monto: number
          nota: string | null
          tipo: string
        }
        Insert: {
          cadete_id: string
          created_at?: string
          created_by?: string | null
          envio_id?: string | null
          id?: string
          mensajeria_id: string
          monto: number
          nota?: string | null
          tipo: string
        }
        Update: {
          cadete_id?: string
          created_at?: string
          created_by?: string | null
          envio_id?: string | null
          id?: string
          mensajeria_id?: string
          monto?: number
          nota?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: true
            referencedRelation: "envios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_mensajeria_id_cadete_id_fkey"
            columns: ["mensajeria_id", "cadete_id"]
            isOneToOne: false
            referencedRelation: "cadetes"
            referencedColumns: ["mensajeria_id", "id"]
          },
          {
            foreignKeyName: "movimientos_mensajeria_id_fkey"
            columns: ["mensajeria_id"]
            isOneToOne: false
            referencedRelation: "mensajerias"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string
          mensajeria_id: string | null
          nombre: string
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mensajeria_id?: string | null
          nombre: string
          rol: string
          user_id: string
        }
        Update: {
          created_at?: string
          mensajeria_id?: string | null
          nombre?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_mensajeria_id_fkey"
            columns: ["mensajeria_id"]
            isOneToOne: false
            referencedRelation: "mensajerias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_envio_publico: {
        Args: {
          p_destino: string
          p_nombre: string
          p_nota?: string
          p_origen: string
          p_slug: string
          p_telefono: string
          p_web?: string
        }
        Returns: string
      }
      fecha_operativa: { Args: never; Returns: string }
      kpis_hoy: {
        Args: never
        Returns: {
          a_rendir: number
          entregados: number
          envios: number
          ganancia: number
          gastos: number
          pagado_cadetes: number
        }[]
      }
      liquidacion_semana: {
        Args: { p_fecha?: string }
        Returns: {
          a_rendir: number
          activo: boolean
          cadete_id: string
          desde: string
          envios: number
          hasta: string
          nombre: string
          rendido: number
          saldo: number
        }[]
      }
      mensajeria_publica: {
        Args: { p_slug: string }
        Returns: {
          logo_url: string
          nombre: string
        }[]
      }
      mensajerias_con_envios_mes: {
        Args: never
        Returns: {
          activa: boolean
          created_at: string
          envios_mes: number
          id: string
          nombre: string
          slug: string
        }[]
      }
      metricas_diarias: {
        Args: { p_dias?: number }
        Returns: {
          cancelados: number
          comisiones: number
          entregados: number
          envios: number
          facturado: number
          fecha: string
          ganancia: number
          gastos: number
        }[]
      }
      metricas_mensuales: {
        Args: { p_meses?: number }
        Returns: {
          comisiones: number
          entregados: number
          envios: number
          facturado: number
          ganancia: number
          gastos: number
          mes: string
        }[]
      }
      metricas_semanales: {
        Args: { p_semanas?: number }
        Returns: {
          comisiones: number
          entregados: number
          envios: number
          facturado: number
          ganancia: number
          gastos: number
          semana_fin: string
          semana_inicio: string
        }[]
      }
      ranking_comercios: {
        Args: { p_dias?: number }
        Returns: {
          comercio_id: string
          entregados: number
          envios: number
          facturado: number
          nombre: string
        }[]
      }
      resumen_cadete: {
        Args: never
        Returns: {
          debe_rendir: number
          ganado_semana: number
          inicio_semana: string
        }[]
      }
      seguimiento_envio: {
        Args: { p_id: string }
        Returns: {
          asignado_at: string
          created_at: string
          direccion_destino: string
          entregado_at: string
          estado: string
          mensajeria_logo: string
          mensajeria_nombre: string
          mensajeria_slug: string
          retirado_at: string
        }[]
      }
      tomar_envio: { Args: { p_envio: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
