import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, Category, Ingredient, Recipe, MealPlanItem, IngredientType, StorageType } from './types';
import {
  ingredientsService,
  Ingredient as DbIngredient,
} from './services/ingredients.service';
import { recipesService, RecipeIngredientInsert, RecipeStepInsert } from './services/recipes.service';
import { categoriesService } from './services/categories.service';
import { mealPlansService } from './services/mealPlans.service';
import {
  toCategory,
  toIngredient,
  toRecipe,
  toMealPlan,
  fromCategory,
  fromIngredient,
  fromRecipe,
  fromRecipeIngredients,
  fromRecipeSteps,
  fromMealPlan,
} from './lib/adapters';
import { Toast, ToastType } from './components/Toast';
import { authService, AuthUser } from './services/auth.service';

interface StoreContextType extends AppState {
  loading: boolean;
  error: string | null;

  // Auth
  user: AuthUser | null;
  authLoading: boolean;

  // Recipe lists
  myRecipes: Recipe[];
  publicRecipes: Recipe[];

  // Category Actions
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string, deleteRecipes: boolean) => Promise<void>;

  // Recipe Actions
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;

  // Ingredient Actions
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
  updateIngredient: (ingredient: Ingredient) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  deductStock: (recipeId: string) => Promise<{ success: boolean; missing: { name: string; needed: number }[] }>;

  // Meal Plan Actions
  addToMealPlan: (recipeId: string) => Promise<void>;
  removeFromMealPlan: (itemId: string) => Promise<void>;
  toggleMealCompleted: (itemId: string) => Promise<void>;
  reorderMealPlan: (items: MealPlanItem[]) => void;

  // Helpers
  getIngredient: (id: string) => Ingredient | undefined;
  getRecipe: (id: string) => Recipe | undefined;
  getCategory: (id: string) => Category | undefined;

  // Refresh
  refresh: () => Promise<void>;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);
  const [dailyPlan, setDailyPlan] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Initial Load ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories
      let dbCategories = await categoriesService.getAll();

      // Initialize default categories if empty
      if (dbCategories.length === 0) {
        const defaultCategories = [
          { name: '家常菜' },
          { name: '烘焙' },
          { name: '快手晚餐' },
          { name: '汤品' },
          { name: '凉菜' },
          { name: '甜点' },
        ];
        for (const category of defaultCategories) {
          const created = await categoriesService.create(category);
          dbCategories.push(created);
        }
      }

      const appCategories = dbCategories.map(toCategory);

      // Load ingredients (only for real users, not guests)
      let appIngredients: Ingredient[] = [];
      if (user && !user.isGuest) {
        const dbIngredients = await ingredientsService.getAll();
        appIngredients = await Promise.all(
          dbIngredients.map(async (ing) => {
            const substitutes = await ingredientsService.getSubstitutes(ing.id);
            const substituteIds = substitutes.map((s) => s.id);
            return toIngredient(ing, substituteIds);
          })
        );
      }

      // Load recipes (available for all users including guests)
      const dbRecipes = await recipesService.getAll();
      const appRecipes = await Promise.all(
        dbRecipes.map(async (r) => {
          const dbRecipeDetails = await recipesService.getById(r.id);
          if (!dbRecipeDetails) return null;

          // Get ingredient units
          const recipeIngredients = await recipesService.getIngredients(r.id);
          const ingredientUnits: Record<string, string> = {};
          recipeIngredients.forEach((ri) => {
            if (ri.ingredient_id) {
              ingredientUnits[ri.ingredient_id] = ri.unit;
            }
          });

          return toRecipe(dbRecipeDetails, dbRecipeDetails.ingredients || [], dbRecipeDetails.steps || []);
        })
      );

      // 分离我的菜谱和公共菜谱
      const validRecipes = appRecipes.filter((r) => r !== null) as Recipe[];
      const myRecipesList = user && !user.isGuest 
        ? validRecipes.filter(r => r.userId === user.id)
        : [];
      const publicRecipesList = user && !user.isGuest
        ? validRecipes.filter(r => r.userId !== user.id)
        : validRecipes;

      // Load meal plans (only for real users, not guests)
      let appMealPlans: MealPlanItem[] = [];
      if (user && !user.isGuest) {
        const dbMealPlans = await mealPlansService.getToday();
        appMealPlans = dbMealPlans.map(toMealPlan);
      }

      setCategories(appCategories);
      setIngredients(appIngredients);
      setRecipes(validRecipes);
      setMyRecipes(myRecipesList);
      setPublicRecipes(publicRecipesList);
      setDailyPlan(appMealPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]); // 只依赖 user

  // --- Auth State Management ---
  useEffect(() => {
    // 初始化认证状态
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // 检查是否有游客登录
          const guestUser = authService.getGuestUser();
          if (guestUser) {
            setUser(guestUser);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    // 监听认证状态变化
    const { data: authListener } = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      // 注意：不在这里调用 loadData()，由下面的 useEffect 统一处理
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 加载数据：真实用户或游客都可以加载
    if (user) {
      loadData();
    }
  }, [user]);

  // --- Category Logic ---
  const addCategory = async (name: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法添加分类，请先登录');
    }
    try {
      const dbCategory = await categoriesService.create(fromCategory({ name }));
      setCategories((prev) => [...prev, toCategory(dbCategory)]);
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法修改分类，请先登录');
    }
    try {
      const dbCategory = await categoriesService.update(id, fromCategory({ name }));
      setCategories((prev) => prev.map((c) => (c.id === id ? toCategory(dbCategory) : c)));
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string, deleteRecipes: boolean) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法删除分类，请先登录');
    }
    try {
      await categoriesService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));

      if (deleteRecipes) {
        // Delete all recipes in this category
        for (const recipe of recipes) {
          if (recipe.categoryId === id) {
            await recipesService.delete(recipe.id);
          }
        }
        setRecipes((prev) => prev.filter((r) => r.categoryId !== id));
      } else {
        // Set category to empty string for recipes in this category
        for (const recipe of recipes) {
          if (recipe.categoryId === id) {
            await recipesService.update(recipe.id, fromRecipe({ ...recipe, categoryId: '' }));
          }
        }
        setRecipes((prev) =>
          prev.map((r) => (r.categoryId === id ? { ...r, categoryId: '' } : r))
        );
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  // --- Recipe Logic ---
  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法添加菜谱，请先登录');
    }
    try {
      const dbRecipe = await recipesService.createFull(
        fromRecipe(recipe),
        fromRecipeIngredients(recipe),
        fromRecipeSteps(recipe)
      );

      const recipeIngredients = await recipesService.getIngredients(dbRecipe.id);
      const ingredientUnits: Record<string, string> = {};
      recipeIngredients.forEach((ri) => {
        if (ri.ingredient_id) {
          ingredientUnits[ri.ingredient_id] = ri.unit;
        }
      });

      const appRecipe = toRecipe(dbRecipe, dbRecipe.ingredients || [], dbRecipe.steps || []);
      setRecipes((prev) => [...prev, appRecipe]);
    } catch (err) {
      console.error('Error adding recipe:', err);
      throw err;
    }
  };

  const updateRecipe = async (recipe: Recipe) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法修改菜谱，请先登录');
    }
    try {
      await recipesService.update(recipe.id, fromRecipe(recipe));
      await recipesService.updateIngredients(recipe.id, fromRecipeIngredients(recipe));
      await recipesService.updateSteps(recipe.id, fromRecipeSteps(recipe));

      const dbRecipeDetails = await recipesService.getById(recipe.id);
      if (dbRecipeDetails) {
        const appRecipe = toRecipe(
          dbRecipeDetails,
          dbRecipeDetails.ingredients || [],
          dbRecipeDetails.steps || []
        );
        setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? appRecipe : r)));
      }
    } catch (err) {
      console.error('Error updating recipe:', err);
      throw err;
    }
  };

  const deleteRecipe = async (id: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法删除菜谱，请先登录');
    }
    try {
      await recipesService.delete(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setDailyPlan((prev) => prev.filter((item) => item.recipeId !== id));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      throw err;
    }
  };

  // --- Ingredient Logic ---
  const addIngredient = async (ing: Omit<Ingredient, 'id'>) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法添加食材，请先登录');
    }
    try {
      const dbIngredient = await ingredientsService.create(fromIngredient(ing));
      const appIngredient = toIngredient(dbIngredient, ing.substitutes);

      // Handle substitutes
      for (const substituteId of ing.substitutes) {
        await ingredientsService.addSubstitute(dbIngredient.id, substituteId);
      }

      setIngredients((prev) => [...prev, appIngredient]);
    } catch (err) {
      console.error('Error adding ingredient:', err);
      throw err;
    }
  };

  const updateIngredient = async (ing: Ingredient) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法修改食材，请先登录');
    }
    try {
      const oldIngredient = ingredients.find((i) => i.id === ing.id);
      const oldSubstituteIds = oldIngredient?.substitutes || [];

      await ingredientsService.update(ing.id, fromIngredient(ing));

      // Remove old substitutes
      for (const oldSubId of oldSubstituteIds) {
        if (!ing.substitutes.includes(oldSubId)) {
          await ingredientsService.removeSubstitute(ing.id, oldSubId);
        }
      }

      // Add new substitutes
      for (const newSubId of ing.substitutes) {
        if (!oldSubstituteIds.includes(newSubId)) {
          await ingredientsService.addSubstitute(ing.id, newSubId);
        }
      }

      const dbIngredient = await ingredientsService.getById(ing.id);
      if (dbIngredient) {
        const appIngredient = toIngredient(dbIngredient, ing.substitutes);
        setIngredients((prev) => prev.map((i) => (i.id === ing.id ? appIngredient : i)));
      }
    } catch (err) {
      console.error('Error updating ingredient:', err);
      throw err;
    }
  };

  const deleteIngredient = async (id: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法删除食材，请先登录');
    }
    try {
      await ingredientsService.delete(id);
      setIngredients((prev) => prev.filter((i) => i.id !== id));

      // Clean up substitutes references
      setIngredients((prev) =>
        prev.map((i) => ({
          ...i,
          substitutes: i.substitutes.filter((subId) => subId !== id),
        }))
      );
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      throw err;
    }
  };

  const deductStock = async (recipeId: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法扣减库存，请先登录');
    }
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return { success: false, missing: [] };

    const missing: { name: string; needed: number }[] = [];

    // Check stock first
    for (const ri of recipe.ingredients) {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      if (!ing) continue;
      if (ing.quantity < ri.amount) {
        missing.push({ name: ing.name, needed: ri.amount - ing.quantity });
      }
    }

    if (missing.length > 0) {
      return { success: false, missing };
    }

    // Deduct
    try {
      const newIngredients: Ingredient[] = [];
      for (const ing of ingredients) {
        const usage = recipe.ingredients.find((ri) => ri.ingredientId === ing.id);
        if (usage) {
          const newQuantity = Math.max(0, ing.quantity - usage.amount);
          await ingredientsService.update(ing.id, { quantity: newQuantity });
          newIngredients.push({ ...ing, quantity: newQuantity });
        } else {
          newIngredients.push(ing);
        }
      }
      setIngredients(newIngredients);
    } catch (err) {
      console.error('Error deducting stock:', err);
      return { success: false, missing: [] };
    }

    return { success: true, missing: [] };
  };

  // --- Meal Plan Logic ---
  const addToMealPlan = async (recipeId: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法添加计划，请先登录');
    }
    try {
      const dbMealPlan = await mealPlansService.create(fromMealPlan({ recipeId, completed: false }));
      setDailyPlan((prev) => [...prev, toMealPlan(dbMealPlan)]);
    } catch (err) {
      console.error('Error adding to meal plan:', err);
      throw err;
    }
  };

  const removeFromMealPlan = async (itemId: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法删除计划，请先登录');
    }
    try {
      await mealPlansService.delete(itemId);
      setDailyPlan((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Error removing from meal plan:', err);
      throw err;
    }
  };

  const toggleMealCompleted = async (itemId: string) => {
    if (user?.isGuest) {
      throw new Error('游客模式下无法修改计划状态，请先登录');
    }
    try {
      const dbMealPlan = await mealPlansService.toggleCompleted(itemId);
      setDailyPlan((prev) => prev.map((i) => (i.id === itemId ? toMealPlan(dbMealPlan) : i)));
    } catch (err) {
      console.error('Error toggling meal completed:', err);
      throw err;
    }
  };

  const reorderMealPlan = (items: MealPlanItem[]) => {
    setDailyPlan(items);
  };

  // --- Helpers ---
  const getIngredient = (id: string) => ingredients.find((i) => i.id === id);
  const getRecipe = (id: string) => recipes.find((r) => r.id === id);
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  // --- Toast Logic ---
  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        ingredients,
        recipes,
        myRecipes,
        publicRecipes,
        dailyPlan,
        loading,
        error,
        user,
        authLoading,
        addCategory,
        updateCategory,
        deleteCategory,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        deductStock,
        addToMealPlan,
        removeFromMealPlan,
        toggleMealCompleted,
        reorderMealPlan,
        getIngredient,
        getRecipe,
        getCategory,
        refresh: loadData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
