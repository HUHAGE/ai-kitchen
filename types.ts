export enum IngredientType {
  MAIN = '主料',
  SIDE = '辅料',
  SEASONING = '调料',
  FRESH = '生鲜',
  DRY = '干货',
}

export enum StorageType {
  FRIDGE = '冷藏',
  FREEZER = '冷冻',
  ROOM = '常温',
}

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType;
  unit: string;
  quantity: number;
  threshold: number;
  storage: StorageType;
  expiryDate?: string; // ISO Date string
  productionDate?: string; // ISO Date string
  substitutes: string[]; // IDs of other ingredients
}

export interface Category {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
}

export interface RecipeStep {
  id: string;
  description: string;
  duration: number; // minutes
  isTimerEnabled: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  categoryId: string; // can be empty string if Uncategorized
  difficulty: number; // 1-5
  tags: string[];
  image?: string; // DataURL or URL
  description: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  notes: string; // "Tips"
  userId?: string; // 创建者用户 ID
}

export interface MealPlanItem {
  id: string;
  recipeId: string;
  completed: boolean;
}

export interface AppState {
  ingredients: Ingredient[];
  categories: Category[];
  recipes: Recipe[];
  dailyPlan: MealPlanItem[];
}