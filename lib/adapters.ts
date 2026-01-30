import { IngredientType, StorageType } from '../types';

// Type mappings between Supabase and App
const INGREDIENT_TYPE_MAP: Record<string, IngredientType> = {
  main: IngredientType.MAIN,
  side: IngredientType.SIDE,
  seasoning: IngredientType.SEASONING,
  fresh: IngredientType.FRESH,
  dry: IngredientType.DRY,
};

const REVERSE_INGREDIENT_TYPE_MAP: Record<IngredientType, string> = {
  [IngredientType.MAIN]: 'main',
  [IngredientType.SIDE]: 'side',
  [IngredientType.SEASONING]: 'seasoning',
  [IngredientType.FRESH]: 'fresh',
  [IngredientType.DRY]: 'dry',
};

const STORAGE_TYPE_MAP: Record<string, StorageType> = {
  refrigerated: StorageType.FRIDGE,
  frozen: StorageType.FREEZER,
  room: StorageType.ROOM,
};

const REVERSE_STORAGE_TYPE_MAP: Record<StorageType, string> = {
  [StorageType.FRIDGE]: 'refrigerated',
  [StorageType.FREEZER]: 'frozen',
  [StorageType.ROOM]: 'room',
};

// Category conversion
export function toCategory(dbCategory: any) {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
  };
}

export function fromCategory(category: any) {
  return {
    name: category.name,
  };
}

// Ingredient conversion
export function toIngredient(dbIngredient: any, substitutes: string[] = []) {
  return {
    id: dbIngredient.id,
    name: dbIngredient.name,
    type: INGREDIENT_TYPE_MAP[dbIngredient.type] || IngredientType.MAIN,
    unit: dbIngredient.unit,
    quantity: dbIngredient.quantity,
    threshold: dbIngredient.threshold,
    storage: STORAGE_TYPE_MAP[dbIngredient.storage] || StorageType.FRIDGE,
    expiryDate: dbIngredient.expiry_date,
    productionDate: dbIngredient.production_date,
    substitutes,
  };
}

export function fromIngredient(ingredient: any) {
  return {
    name: ingredient.name,
    type: REVERSE_INGREDIENT_TYPE_MAP[ingredient.type] || 'main',
    unit: ingredient.unit,
    quantity: ingredient.quantity,
    threshold: ingredient.threshold,
    storage: REVERSE_STORAGE_TYPE_MAP[ingredient.storage] || 'refrigerated',
    expiry_date: ingredient.expiryDate || null,
    production_date: ingredient.productionDate || null,
  };
}

// Recipe conversion
export function toRecipe(dbRecipe: any, dbIngredients: any[], dbSteps: any[]) {
  return {
    id: dbRecipe.id,
    name: dbRecipe.name,
    categoryId: dbRecipe.category_id || '',
    difficulty: dbRecipe.difficulty,
    tags: dbRecipe.tags || [],
    image: dbRecipe.image,
    description: dbRecipe.description || '',
    ingredients: dbIngredients.map((ing: any) => ({
      ingredientId: ing.ingredient_id || '',
      amount: ing.quantity,
      name: ing.kc_ingredients?.name || ing.name || '',
      unit: ing.kc_ingredients?.unit || ing.unit || '',
    })),
    steps: dbSteps.map((step: any) => ({
      id: step.id,
      description: step.description,
      duration: step.timer ? Math.ceil(step.timer / 60) : 0,
      isTimerEnabled: !!step.timer,
    })),
    notes: dbRecipe.notes || '',
    userId: dbRecipe.user_id || undefined,
  };
}

export function fromRecipe(recipe: any) {
  return {
    name: recipe.name,
    category_id: recipe.categoryId || null,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    image: recipe.image,
    description: recipe.description,
    notes: recipe.notes,
    prep_time: null,
    cook_time: null,
    servings: 1,
  };
}

export function fromRecipeIngredients(recipe: any) {
  return recipe.ingredients.map((ing: any) => ({
    recipe_id: recipe.id,
    ingredient_id: ing.ingredientId || null,
    quantity: ing.amount,
    unit: '', // This needs to come from the ingredient itself, or we need to store it separately
    optional: false,
  }));
}

export function fromRecipeSteps(recipe: any) {
  return recipe.steps.map((step: any, index: number) => ({
    recipe_id: recipe.id,
    step_number: index + 1,
    description: step.description,
    timer: step.isTimerEnabled ? step.duration * 60 : null,
  }));
}

// Meal Plan conversion
export function toMealPlan(dbMealPlan: any) {
  return {
    id: dbMealPlan.id,
    recipeId: dbMealPlan.recipe_id,
    completed: dbMealPlan.completed,
  };
}

export function fromMealPlan(mealPlanItem: any, planDate?: string) {
  return {
    recipe_id: mealPlanItem.recipeId,
    plan_date: planDate || new Date().toISOString().split('T')[0],
    completed: mealPlanItem.completed,
    notes: null,
  };
}
