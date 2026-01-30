import { supabase } from '../lib/supabase';
import { Ingredient } from './ingredients.service';

export interface Recipe {
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
}

export interface RecipeInsert {
  name: string;
  category_id?: string | null;
  difficulty?: number;
  description?: string | null;
  notes?: string | null;
  image?: string | null;
  tags?: string[] | null;
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number;
  user_id?: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string | null;
  quantity: number;
  unit: string;
  optional: boolean;
  created_at: string;
  ingredient?: Ingredient;
}

export interface RecipeIngredientInsert {
  recipe_id: string;
  ingredient_id?: string | null;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  description: string;
  timer: number | null;
  created_at: string;
}

export interface RecipeStepInsert {
  recipe_id: string;
  step_number: number;
  description: string;
  timer?: number | null;
}

export interface RecipeDetail extends Recipe {
  category_name?: string | null;
  ingredient_count: number;
  step_count: number;
  user_id: string | null;
}

export interface FullRecipe extends Recipe {
  category_name?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export const recipesService = {
  // 获取所有菜谱
  async getAll(): Promise<RecipeDetail[]> {
    const { data, error } = await supabase
      .from('v_kc_recipe_details')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取我的菜谱（当前用户创建的）
  async getMyRecipes(userId: string): Promise<RecipeDetail[]> {
    const { data, error } = await supabase
      .from('v_kc_recipe_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 获取菜谱广场（其他用户创建的菜谱）
  async getPublicRecipes(userId?: string): Promise<RecipeDetail[]> {
    let query = supabase
      .from('v_kc_recipe_details')
      .select('*');

    // 如果提供了 userId，排除该用户的菜谱
    if (userId) {
      query = query.neq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 获取单个菜谱
  async getById(id: string): Promise<FullRecipe | null> {
    // 获取菜谱基本信息
    const { data: recipe, error: recipeError } = await supabase
      .from('kc_recipes')
      .select(`
        *,
        kc_categories (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) return null;

    // 获取菜谱食材
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('kc_recipe_ingredients')
      .select(`
        *,
        kc_ingredients (
          id,
          name,
          type,
          unit
        )
      `)
      .eq('recipe_id', id)
      .order('created_at', { ascending: true });

    if (ingredientsError) throw ingredientsError;

    // 获取菜谱步骤
    const { data: steps, error: stepsError } = await supabase
      .from('kc_recipe_steps')
      .select('*')
      .eq('recipe_id', id)
      .order('step_number', { ascending: true });

    if (stepsError) throw stepsError;

    return {
      ...recipe,
      category_name: (recipe.kc_categories as any)?.name || null,
      ingredients: ingredients || [],
      steps: steps || [],
    };
  },

  // 按分类获取菜谱
  async getByCategory(categoryId: string): Promise<RecipeDetail[]> {
    const { data, error } = await supabase
      .from('v_kc_recipe_details')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 创建菜谱
  async create(recipe: RecipeInsert): Promise<Recipe> {
    // 自动添加当前用户 ID
    const { data: { user } } = await supabase.auth.getUser();
    const recipeWithUser = {
      ...recipe,
      user_id: user?.id || null,
    };

    const { data, error } = await supabase
      .from('kc_recipes')
      .insert(recipeWithUser)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 创建菜谱（包含食材和步骤）
  async createFull(
    recipe: RecipeInsert,
    ingredients: RecipeIngredientInsert[],
    steps: RecipeStepInsert[]
  ): Promise<FullRecipe> {
    // 首先创建菜谱
    const createdRecipe = await this.create(recipe);

    // 创建食材关联
    const ingredientsWithRecipe = ingredients.map((ing) => ({
      ...ing,
      recipe_id: createdRecipe.id,
    }));

    if (ingredientsWithRecipe.length > 0) {
      const { error: ingredientsError } = await supabase
        .from('kc_recipe_ingredients')
        .insert(ingredientsWithRecipe);

      if (ingredientsError) throw ingredientsError;
    }

    // 创建步骤
    const stepsWithRecipe = steps.map((step) => ({
      ...step,
      recipe_id: createdRecipe.id,
    }));

    if (stepsWithRecipe.length > 0) {
      const { error: stepsError } = await supabase
        .from('kc_recipe_steps')
        .insert(stepsWithRecipe);

      if (stepsError) throw stepsError;
    }

    // 返回完整的菜谱
    return await this.getById(createdRecipe.id);
  },

  // 更新菜谱
  async update(id: string, recipe: Partial<RecipeInsert>): Promise<Recipe> {
    const { data, error } = await supabase
      .from('kc_recipes')
      .update(recipe)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除菜谱
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kc_recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 更新食材
  async updateIngredients(
    recipeId: string,
    ingredients: RecipeIngredientInsert[]
  ): Promise<RecipeIngredient[]> {
    // 删除现有食材
    await supabase
      .from('kc_recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    // 插入新食材
    const ingredientsWithRecipe = ingredients.map((ing) => ({
      ...ing,
      recipe_id: recipeId,
    }));

    if (ingredientsWithRecipe.length > 0) {
      const { data, error } = await supabase
        .from('kc_recipe_ingredients')
        .insert(ingredientsWithRecipe)
        .select();

      if (error) throw error;
      return data || [];
    }

    return [];
  },

  // 更新步骤
  async updateSteps(recipeId: string, steps: RecipeStepInsert[]): Promise<RecipeStep[]> {
    // 删除现有步骤
    await supabase
      .from('kc_recipe_steps')
      .delete()
      .eq('recipe_id', recipeId);

    // 插入新步骤
    const stepsWithRecipe = steps.map((step) => ({
      ...step,
      recipe_id: recipeId,
    }));

    if (stepsWithRecipe.length > 0) {
      const { data, error } = await supabase
        .from('kc_recipe_steps')
        .insert(stepsWithRecipe)
        .select();

      if (error) throw error;
      return data || [];
    }

    return [];
  },

  // 获取菜谱食材
  async getIngredients(recipeId: string): Promise<RecipeIngredient[]> {
    const { data, error } = await supabase
      .from('kc_recipe_ingredients')
      .select(`
        *,
        kc_ingredients (
          id,
          name,
          type,
          unit,
          quantity
        )
      `)
      .eq('recipe_id', recipeId);

    if (error) throw error;
    return data || [];
  },

  // 获取菜谱步骤
  async getSteps(recipeId: string): Promise<RecipeStep[]> {
    const { data, error } = await supabase
      .from('kc_recipe_steps')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('step_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 搜索菜谱
  async search(query: string): Promise<RecipeDetail[]> {
    const { data, error } = await supabase
      .from('v_kc_recipe_details')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取推荐菜谱（基于库存）
  async getRecommended(availableIngredientIds: string[]): Promise<RecipeDetail[]> {
    // 获取所有菜谱及其食材
    const { data, error } = await supabase
      .from('kc_recipes')
      .select(`
        *,
        kc_recipe_ingredients (
          ingredient_id,
          optional
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // 计算匹配度
    const recipes = (data || []).map((recipe: any) => {
      const recipeIngredients = recipe.kc_recipe_ingredients || [];
      const requiredIngredients = recipeIngredients.filter(
        (ing: any) => !ing.optional
      );
      const availableCount = requiredIngredients.filter((ing: any) =>
        availableIngredientIds.includes(ing.ingredient_id)
      ).length;

      return {
        ...recipe,
        match_rate: requiredIngredients.length > 0
          ? (availableCount / requiredIngredients.length) * 100
          : 0,
      };
    });

    // 返回匹配度最高的菜谱
    return recipes
      .sort((a: any, b: any) => b.match_rate - a.match_rate)
      .slice(0, 10);
  },

  // 获取快手菜谱（30分钟内）
  async getQuickRecipes(): Promise<RecipeDetail[]> {
    const totalTime = 30;
    const { data, error } = await supabase
      .from('v_kc_recipe_details')
      .select('*')
      .gte('prep_time', 0)
      .gte('cook_time', 0)
      .order('prep_time', { ascending: true });

    if (error) throw error;

    // 过滤总时间小于30分钟的菜谱
    return (data || []).filter(
      (recipe: any) =>
        (recipe.prep_time || 0) + (recipe.cook_time || 0) <= totalTime
    );
  },
};
