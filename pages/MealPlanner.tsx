import React from 'react';
import { useStore } from '../store';
import { GlassCard, Button, Badge } from '../components/ui';
import { Trash2, Check, ChefHat, AlertTriangle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MealPlanner = () => {
  const { dailyPlan, recipes, ingredients, removeFromMealPlan, toggleMealCompleted, deductStock } = useStore();
  const navigate = useNavigate();

  const handleCook = (itemId: string, recipeId: string) => {
    // Check stock first
    const check = deductStock(recipeId); // This actually deducts in our simple store logic
    // But for "Today's Cooking", usually we want to go to the cooking page OR just mark as done.
    // The requirement says: "Clicking cook completed... automatically deducts".
    // Let's implement a direct "Mark as Done" action here.
    
    if (!check.success) {
      alert(`库存不足！缺少：${check.missing.map(m => `${m.name} ${m.needed}`).join(', ')}`);
      return;
    }

    toggleMealCompleted(itemId);
  };

  const handleStartCooking = (recipeId: string) => {
     navigate(`/cooking/${recipeId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-stone-800">今日菜单</h1>
        <Button onClick={() => navigate('/recipes')}><Plus size={18} className="mr-1"/> 添加菜品</Button>
      </div>

      {dailyPlan.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <ChefHat size={48} className="mx-auto mb-4 opacity-50" />
          <p>今天还没有计划，去菜谱里挑几个吧！</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {dailyPlan.map(item => {
            const recipe = recipes.find(r => r.id === item.recipeId);
            if (!recipe) return null;

            // Check stock status for display (只检查关联了冰箱的食材)
            let missingStock: string[] = [];
            if (!item.completed) {
               recipe.ingredients.forEach(ri => {
                  // 只检查关联了冰箱食材的项
                  if (ri.ingredientId && !ri.isManual) {
                    const ing = ingredients.find(i => i.id === ri.ingredientId);
                    if (!ing || ing.quantity < ri.amount) {
                       missingStock.push(`${ing?.name || ri.name || '未知'} (缺${ri.amount - (ing?.quantity || 0)})`);
                    }
                  }
               });
            }

            return (
              <GlassCard key={item.id} className={`flex flex-col md:flex-row items-center gap-4 transition-all ${item.completed ? 'opacity-60 grayscale' : ''}`}>
                <div className="w-full md:w-24 h-24 rounded-xl bg-stone-200 overflow-hidden shrink-0">
                  <img src={recipe.image || '/logo.jpg'} alt={recipe.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 w-full text-center md:text-left">
                  <h3 className="text-xl font-bold text-stone-800">{recipe.name}</h3>
                  <div className="flex justify-center md:justify-start gap-2 mt-2">
                     <Badge>{recipe.steps.length}个步骤</Badge>
                     <Badge>{recipe.ingredients.length}种食材</Badge>
                  </div>
                  {missingStock.length > 0 && (
                     <div className="mt-2 text-red-500 text-xs flex items-center justify-center md:justify-start gap-1">
                        <AlertTriangle size={12} />
                        缺: {missingStock.join(', ')}
                     </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                   {item.completed ? (
                      <Button variant="secondary" className="w-full text-green-600 bg-green-50 border-green-200" onClick={() => toggleMealCompleted(item.id)}>
                        <Check size={18} className="mr-1" /> 已完成
                      </Button>
                   ) : (
                      <>
                        <Button className="w-full" onClick={() => handleStartCooking(recipe.id)}>
                           <ChefHat size={18} className="mr-1" /> 开始做菜
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={() => handleCook(item.id, recipe.id)}>
                           <Check size={18} className="mr-1" /> 直接完成(扣库存)
                        </Button>
                      </>
                   )}
                   <Button variant="ghost" className="w-full text-red-400 hover:text-red-500" onClick={() => removeFromMealPlan(item.id)}>
                      <Trash2 size={18} />
                   </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MealPlanner;