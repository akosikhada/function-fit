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
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          image_url: string | null
          name: string
          reps: number | null
          sets: number | null
          sort_order: number
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          image_url?: string | null
          name: string
          reps?: number | null
          sets?: number | null
          sort_order: number
          workout_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          image_url?: string | null
          name?: string
          reps?: number | null
          sets?: number | null
          sort_order?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achieved_at: string | null
          achievement_id: string
          id: string
          is_new: boolean | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_id: string
          id?: string
          is_new?: boolean | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          achievement_id?: string
          id?: string
          is_new?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          calories: number | null
          created_at: string | null
          date: string
          id: string
          steps: number | null
          updated_at: string | null
          user_id: string
          workouts_completed: number | null
        }
        Insert: {
          calories?: number | null
          created_at?: string | null
          date: string
          id?: string
          steps?: number | null
          updated_at?: string | null
          user_id: string
          workouts_completed?: number | null
        }
        Update: {
          calories?: number | null
          created_at?: string | null
          date?: string
          id?: string
          steps?: number | null
          updated_at?: string | null
          user_id?: string
          workouts_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workouts: {
        Row: {
          calories: number
          completed_at: string | null
          duration: number
          id: string
          notes: string | null
          rating: number | null
          user_id: string
          workout_id: string
        }
        Insert: {
          calories: number
          completed_at?: string | null
          duration: number
          id?: string
          notes?: string | null
          rating?: number | null
          user_id: string
          workout_id: string
        }
        Update: {
          calories?: number
          completed_at?: string | null
          duration?: number
          id?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          fitness_goal: string | null
          height: number | null
          id: string
          updated_at: string | null
          username: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          fitness_goal?: string | null
          height?: number | null
          id: string
          updated_at?: string | null
          username: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          fitness_goal?: string | null
          height?: number | null
          id?: string
          updated_at?: string | null
          username?: string
          weight?: number | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          scheduled_date: string
          scheduled_time: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          scheduled_date: string
          scheduled_time?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          calories: number
          created_at: string | null
          description: string | null
          difficulty: string
          duration: number
          id: string
          image_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          calories: number
          created_at?: string | null
          description?: string | null
          difficulty: string
          duration: number
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          calories?: number
          created_at?: string | null
          description?: string | null
          difficulty?: string
          duration?: number
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
