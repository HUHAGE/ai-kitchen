import { supabase } from '../lib/supabase';
import { ParsedRecipe } from '../lib/recipeImporter';
import { categoriesService } from './categories.service';
import { ingredientsService } from './ingredients.service';
import { recipesService, RecipeIngredientInsert, RecipeStepInsert } from './recipes.service';

export interface ImportResult {
  success: boolean;
  recipeName: string;
  error?: string;
  warnings?: string[];
}

export const recipeImportService = {
  /**
   * 批量导入菜谱
   */
  async importRecipes(parsedRecipes: ParsedRecipe[]): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (const parsed of parsedRecipes) {
      try {
        const result = await this.importSingleRecipe(parsed);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          recipeName: parsed.name,
          error: (error as Error).message,
        });
      }
    }

    return results;
  },

  /**
   * 导入单个菜谱
   */
  async importSingleRecipe(parsed: ParsedRecipe): Promise<ImportResult> {
    const warnings: string[] = [];

    try {
      // 1. 查找或创建分类
      let categoryId: string | null = null;
      const categories = await categoriesService.getAll();
      const existingCat = categories.find(c => c.name === parsed.category);
      
      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const newCat = await categoriesService.create({ name: parsed.category });
        categoryId = newCat.id;
        warnings.push(`创建了新分类: ${parsed.category}`);
      }

      // 2. 处理食材（直接使用手动输入，不关联冰箱）
      const recipeIngredients: Omit<RecipeIngredientInsert, 'recipe_id'>[] = [];
      
      for (const ing of parsed.ingredients) {
        recipeIngredients.push({
          ingredient_id: null, // 不关联冰箱食材
          quantity: parseFloat(ing.amount) || 0,
          unit: ing.unit || '个',
          optional: ing.optional,
          name: ing.name, // 直接保存食材名称
        });
      }

      if (recipeIngredients.length === 0) {
        return {
          success: false,
          recipeName: parsed.name,
          error: '没有有效的食材',
          warnings,
        };
      }

      // 3. 处理步骤
      const recipeSteps: Omit<RecipeStepInsert, 'recipe_id'>[] = parsed.steps.map((step, index) => ({
        step_number: index + 1,
        description: step.description,
        timer: step.duration ? step.duration * 60 : null, // 转换为秒
      }));

      // 4. 创建菜谱
      const recipe = await recipesService.createFull(
        {
          name: parsed.name,
          category_id: categoryId,
          difficulty: parsed.difficulty,
          description: parsed.description || null,
          notes: parsed.notes || null,
          tags: parsed.tags.length > 0 ? parsed.tags : null,
          prep_time: parsed.prepTime || null,
          cook_time: parsed.cookTime || null,
          servings: parsed.servings || 1,
        },
        recipeIngredients as RecipeIngredientInsert[],
        recipeSteps as RecipeStepInsert[]
      );

      return {
        success: true,
        recipeName: parsed.name,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        recipeName: parsed.name,
        error: (error as Error).message,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  },
};
