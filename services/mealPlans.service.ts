import { supabase } from '../lib/supabase';
import { RecipeDetail } from './recipes.service';

export interface MealPlan {
  id: string;
  recipe_id: string;
  plan_date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealPlanInsert {
  recipe_id: string;
  plan_date?: string;
  completed?: boolean;
  notes?: string | null;
}

export interface MealPlanDetail extends MealPlan {
  recipe?: RecipeDetail;
}

export const mealPlansService = {
  // 获取所有计划
  async getAll(): Promise<MealPlanDetail[]> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .select(`
        *,
        kc_recipes (
          id,
          name,
          difficulty,
          image,
          prep_time,
          cook_time
        )
      `)
      .order('plan_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取指定日期的计划
  async getByDate(date: string): Promise<MealPlanDetail[]> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .select(`
        *,
        kc_recipes (
          id,
          name,
          difficulty,
          image,
          prep_time,
          cook_time
        )
      `)
      .eq('plan_date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取今日计划
  async getToday(): Promise<MealPlanDetail[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getByDate(today);
  },

  // 获取未完成的计划
  async getIncomplete(): Promise<MealPlanDetail[]> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .select(`
        *,
        kc_recipes (
          id,
          name,
          difficulty,
          image,
          prep_time,
          cook_time
        )
      `)
      .eq('completed', false)
      .gte('plan_date', new Date().toISOString().split('T')[0])
      .order('plan_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取单个计划
  async getById(id: string): Promise<MealPlanDetail | null> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .select(`
        *,
        kc_recipes (
          *
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 创建计划
  async create(plan: MealPlanInsert): Promise<MealPlan> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新计划
  async update(id: string, plan: Partial<MealPlanInsert>): Promise<MealPlan> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .update(plan)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除计划
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kc_meal_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 标记为完成
  async markCompleted(id: string): Promise<MealPlan> {
    return await this.update(id, { completed: true });
  },

  // 标记为未完成
  async markIncomplete(id: string): Promise<MealPlan> {
    return await this.update(id, { completed: false });
  },

  // 切换完成状态
  async toggleCompleted(id: string): Promise<MealPlan> {
    const plan = await this.getById(id);
    if (!plan) throw new Error('Meal plan not found');
    return await this.update(id, { completed: !plan.completed });
  },

  // 获取日期范围内的计划
  async getByDateRange(startDate: string, endDate: string): Promise<MealPlanDetail[]> {
    const { data, error } = await supabase
      .from('kc_meal_plans')
      .select(`
        *,
        kc_recipes (
          id,
          name,
          difficulty,
          image,
          prep_time,
          cook_time
        )
      `)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
