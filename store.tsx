import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Category, Ingredient, Recipe, MealPlanItem, IngredientType, StorageType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, parseISO, isAfter } from 'date-fns';

// --- Mock Data Initialization ---
const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: '家常菜' },
  { id: '2', name: '烘焙' },
  { id: '3', name: '快手晚餐' },
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: '鸡蛋', type: IngredientType.FRESH, unit: '个', quantity: 10, threshold: 2, storage: StorageType.FRIDGE, substitutes: [], expiryDate: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: 'i2', name: '西红柿', type: IngredientType.FRESH, unit: '个', quantity: 1, threshold: 2, storage: StorageType.FRIDGE, substitutes: [], expiryDate: new Date(Date.now() + 86400000 * 2).toISOString() },
  { id: 'i3', name: '大米', type: IngredientType.DRY, unit: 'g', quantity: 5000, threshold: 500, storage: StorageType.ROOM, substitutes: [] },
  { id: 'i4', name: '酱油', type: IngredientType.SEASONING, unit: 'ml', quantity: 400, threshold: 50, storage: StorageType.ROOM, substitutes: [] },
];

const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: '西红柿炒鸡蛋',
    categoryId: '1',
    difficulty: 1,
    tags: ['酸甜', '快手'],
    description: '国民家常菜，酸甜可口。',
    notes: '鸡蛋要炒得嫩一点，西红柿要去皮。',
    ingredients: [
      { ingredientId: 'i1', amount: 3 },
      { ingredientId: 'i2', amount: 2 },
    ],
    steps: [
      { id: 's1', description: '将西红柿切块，鸡蛋打散备用。', duration: 5, isTimerEnabled: false },
      { id: 's2', description: '热锅凉油，倒入蛋液，炒至凝固盛出。', duration: 3, isTimerEnabled: true },
      { id: 's3', description: '锅中留底油，放入西红柿翻炒出汁。', duration: 5, isTimerEnabled: true },
      { id: 's4', description: '加入鸡蛋混合翻炒，加盐调味即可出锅。', duration: 2, isTimerEnabled: false },
    ]
  }
];

interface StoreContextType extends AppState {
  // Category Actions
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string, deleteRecipes: boolean) => void;

  // Recipe Actions
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;

  // Ingredient Actions
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  deductStock: (recipeId: string) => { success: boolean; missing: { name: string; needed: number }[] };

  // Meal Plan Actions
  addToMealPlan: (recipeId: string) => void;
  removeFromMealPlan: (itemId: string) => void;
  toggleMealCompleted: (itemId: string) => void;
  reorderMealPlan: (items: MealPlanItem[]) => void;

  // Helpers
  getIngredient: (id: string) => Ingredient | undefined;
  getRecipe: (id: string) => Recipe | undefined;
  getCategory: (id: string) => Category | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ck_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('ck_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('ck_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [dailyPlan, setDailyPlan] = useState<MealPlanItem[]>(() => {
    const saved = localStorage.getItem('ck_dailyPlan');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('ck_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('ck_ingredients', JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem('ck_recipes', JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem('ck_dailyPlan', JSON.stringify(dailyPlan)); }, [dailyPlan]);

  // --- Category Logic ---
  const addCategory = (name: string) => {
    setCategories(prev => [...prev, { id: uuidv4(), name }]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = (id: string, deleteRecipes: boolean) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (deleteRecipes) {
      setRecipes(prev => prev.filter(r => r.categoryId !== id));
    } else {
      setRecipes(prev => prev.map(r => r.categoryId === id ? { ...r, categoryId: '' } : r));
    }
  };

  // --- Recipe Logic ---
  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    setRecipes(prev => [...prev, { ...recipe, id: uuidv4() }]);
  };

  const updateRecipe = (recipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    setDailyPlan(prev => prev.filter(item => item.recipeId !== id));
  };

  // --- Ingredient Logic ---
  const addIngredient = (ing: Omit<Ingredient, 'id'>) => {
    setIngredients(prev => [...prev, { ...ing, id: uuidv4() }]);
  };

  const updateIngredient = (ing: Ingredient) => {
    setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
  };

  const deleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    // Clean up substitutes references
    setIngredients(prev => prev.map(i => ({
      ...i,
      substitutes: i.substitutes.filter(subId => subId !== id)
    })));
  };

  const deductStock = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return { success: false, missing: [] };

    const missing: { name: string; needed: number }[] = [];
    
    // Check stock first
    recipe.ingredients.forEach(ri => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      if (!ing) return;
      if (ing.quantity < ri.amount) {
        missing.push({ name: ing.name, needed: ri.amount - ing.quantity });
      }
    });

    if (missing.length > 0) {
      return { success: false, missing };
    }

    // Deduct
    setIngredients(prev => prev.map(ing => {
      const usage = recipe.ingredients.find(ri => ri.ingredientId === ing.id);
      if (usage) {
        return { ...ing, quantity: Math.max(0, ing.quantity - usage.amount) };
      }
      return ing;
    }));

    return { success: true, missing: [] };
  };

  // --- Meal Plan Logic ---
  const addToMealPlan = (recipeId: string) => {
    setDailyPlan(prev => [...prev, { id: uuidv4(), recipeId, completed: false }]);
  };

  const removeFromMealPlan = (itemId: string) => {
    setDailyPlan(prev => prev.filter(i => i.id !== itemId));
  };

  const toggleMealCompleted = (itemId: string) => {
    setDailyPlan(prev => prev.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i));
  };

  const reorderMealPlan = (items: MealPlanItem[]) => {
    setDailyPlan(items);
  };

  // --- Helpers ---
  const getIngredient = (id: string) => ingredients.find(i => i.id === id);
  const getRecipe = (id: string) => recipes.find(r => r.id === id);
  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <StoreContext.Provider value={{
      categories, ingredients, recipes, dailyPlan,
      addCategory, updateCategory, deleteCategory,
      addRecipe, updateRecipe, deleteRecipe,
      addIngredient, updateIngredient, deleteIngredient, deductStock,
      addToMealPlan, removeFromMealPlan, toggleMealCompleted, reorderMealPlan,
      getIngredient, getRecipe, getCategory
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};