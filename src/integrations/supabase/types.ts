export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          organization_name: string
          created_by_admin_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_name: string
          created_by_admin_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_name?: string
          created_by_admin_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      members: {
        Row: {
          id: string
          auth_user_id: string
          organization_id: string
          full_name: string
          email: string
          role: string
          mobile_number: string | null
          last_login_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          organization_id: string
          full_name: string
          email: string
          role?: string
          mobile_number?: string | null
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          organization_id?: string
          full_name?: string
          email?: string
          role?: string
          mobile_number?: string | null
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          organization_id: string
          task_title: string
          task_description: string | null
          remarks: string | null
          task_type: string
          requires_ai_count: boolean | null
          weekdays: string[] | null
          start_date: string | null
          end_date: string | null
          assigned_by_admin: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          task_title: string
          task_description?: string | null
          remarks?: string | null
          task_type: string
          requires_ai_count?: boolean | null
          weekdays?: string[] | null
          start_date?: string | null
          end_date?: string | null
          assigned_by_admin?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          task_title?: string
          task_description?: string | null
          remarks?: string | null
          task_type?: string
          requires_ai_count?: boolean | null
          weekdays?: string[] | null
          start_date?: string | null
          end_date?: string | null
          assigned_by_admin?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_by_admin_fkey"
            columns: ["assigned_by_admin"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          member_id: string
          assigned_date: string
          completion_status: string
          ai_count_value: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          member_id: string
          assigned_date?: string
          completion_status?: string
          ai_count_value?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          member_id?: string
          assigned_date?: string
          completion_status?: string
          ai_count_value?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      get_user_organization: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      cleanup_old_assignments: {
        Args: {}
        Returns: undefined
      }
      reset_daily_tasks: {
        Args: {}
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Type helpers for the new schema
export type Organization = Tables<'organizations'>
export type Member = Tables<'members'>
export type Task = Tables<'tasks'>
export type TaskAssignment = Tables<'task_assignments'>

export type MemberInsert = TablesInsert<'members'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskAssignmentInsert = TablesInsert<'task_assignments'>

export type MemberUpdate = TablesUpdate<'members'>
export type TaskUpdate = TablesUpdate<'tasks'>
export type TaskAssignmentUpdate = TablesUpdate<'task_assignments'>
