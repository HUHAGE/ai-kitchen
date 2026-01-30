import { createClient } from '@supabase/supabase-js';

// Support both VITE_ and NEXT_PUBLIC_ prefixes
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database table types
export type Database = {
  public: {
    Tables: {
      kc_categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kc_categories']['Insert']>;
      };
      kc_ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'main' | 'side' | 'seasoning' | 'fresh' | 'dry';
          unit: string;
          quantity: number;
          threshold: number;
          storage: 'refrigerated' | 'frozen' | 'room';
          expiry_date: string | null;
          production_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_ingredients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kc_ingredients']['Insert']>;
      };
      kc_recipes: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          difficulty: number;
          description: string | null;
          notes: string | null;
          image: string | null;
          tags: string[] | null;
          prep_time: number | null;
          cook_time: number | null;
          servings: number;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_recipes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kc_recipes']['Insert']>;
      };
      kc_recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string | null;
          quantity: number;
          unit: string;
          optional: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_recipe_ingredients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kc_recipe_ingredients']['Insert']>;
      };
      kc_recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          step_number: number;
          description: string;
          timer: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_recipe_steps']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kc_recipe_steps']['Insert']>;
      };
      kc_meal_plans: {
        Row: {
          id: string;
          recipe_id: string;
          plan_date: string;
          completed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_meal_plans']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kc_meal_plans']['Insert']>;
      };
      kc_ingredient_substitutes: {
        Row: {
          id: string;
          ingredient_id: string;
          substitute_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kc_ingredient_substitutes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kc_ingredient_substitutes']['Insert']>;
      };
    };
    Views: {
      v_kc_low_stock_ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          unit: string;
          quantity: number;
          threshold: number;
          storage: string;
          expiry_date: string | null;
          is_low_stock: boolean;
        };
      };
      v_kc_expiring_ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          unit: string;
          quantity: number;
          expiry_date: string;
          days_until_expiry: number;
        };
      };
      v_kc_recipe_details: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          category_name: string | null;
          difficulty: number;
          description: string | null;
          notes: string | null;
          image: string | null;
          tags: string[] | null;
          prep_time: number | null;
          cook_time: number | null;
          servings: number;
          user_id: string | null;
          ingredient_count: number;
          step_count: number;
        };
      };
    };
  };
};
