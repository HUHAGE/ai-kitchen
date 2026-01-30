import { supabase } from '../lib/supabase';

export type IngredientType = 'main' | 'side' | 'seasoning' | 'fresh' | 'dry';
export type StorageType = 'refrigerated' | 'frozen' | 'room';

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType;
  unit: string;
  quantity: number;
  threshold: number;
  storage: StorageType;
  expiry_date: string | null;
  production_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngredientInsert {
  name: string;
  type: IngredientType;
  unit: string;
  quantity: number;
  threshold: number;
  storage: StorageType;
  expiry_date?: string | null;
  production_date?: string | null;
}

export interface LowStockIngredient {
  id: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  threshold: number;
  storage: string;
  expiry_date: string | null;
  is_low_stock: boolean;
}

export interface ExpiringIngredient {
  id: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  expiry_date: string;
  days_until_expiry: number;
}

export const ingredientsService = {
  // 获取所有食材
  async getAll(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('kc_ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取单个食材
  async getById(id: string): Promise<Ingredient | null> {
    const { data, error } = await supabase
      .from('kc_ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 创建食材
  async create(ingredient: IngredientInsert): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('kc_ingredients')
      .insert(ingredient)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新食材
  async update(id: string, ingredient: Partial<IngredientInsert>): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('kc_ingredients')
      .update(ingredient)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除食材
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kc_ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 获取低库存食材
  async getLowStock(): Promise<LowStockIngredient[]> {
    const { data, error } = await supabase
      .from('v_kc_low_stock_ingredients')
      .select('*')
      .order('quantity', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取临期食材（3天内）
  async getExpiring(): Promise<ExpiringIngredient[]> {
    const { data, error } = await supabase
      .from('v_kc_expiring_ingredients')
      .select('*')
      .order('days_until_expiry', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取替代品
  async getSubstitutes(ingredientId: string): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('kc_ingredient_substitutes')
      .select('substitutes!inner(*)')
      .eq('ingredient_id', ingredientId);

    if (error) throw error;

    return (data || []).map((item: any) => item.substitutes);
  },

  // 添加替代品
  async addSubstitute(ingredientId: string, substituteId: string): Promise<void> {
    const { error } = await supabase
      .from('kc_ingredient_substitutes')
      .insert({
        ingredient_id: ingredientId,
        substitute_id: substituteId,
      });

    if (error) throw error;
  },

  // 删除替代品
  async removeSubstitute(ingredientId: string, substituteId: string): Promise<void> {
    const { error } = await supabase
      .from('kc_ingredient_substitutes')
      .delete()
      .or(`ingredient_id.eq.${ingredientId},substitute_id.eq.${ingredientId}`)
      .or(`ingredient_id.eq.${substituteId},substitute_id.eq.${substituteId}`);

    if (error) throw error;
  },

  // 扣减库存
  async decreaseQuantity(id: string, amount: number): Promise<Ingredient> {
    // 先获取当前数量
    const current = await this.getById(id);
    if (!current) throw new Error('Ingredient not found');

    if (current.quantity < amount) {
      throw new Error('Insufficient stock');
    }

    return await this.update(id, { quantity: current.quantity - amount });
  },

  // 增加库存
  async increaseQuantity(id: string, amount: number): Promise<Ingredient> {
    const current = await this.getById(id);
    if (!current) throw new Error('Ingredient not found');

    return await this.update(id, { quantity: current.quantity + amount });
  },
};
