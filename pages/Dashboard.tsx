import React, { useMemo } from 'react';
import { useStore } from '../store';
import { GlassCard, Button, Badge } from '../components/ui';
import { Clock, AlertCircle, ChefHat, Leaf, ChevronRight, Sparkles, Sun, Users } from 'lucide-react';
import { differenceInDays, parseISO, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useOnlineUsers } from '../lib/useOnlineUsers';

const Dashboard = () => {
  const { ingredients, recipes, addToMealPlan } = useStore();
  const navigate = useNavigate();
  const onlineCount = useOnlineUsers();

  // --- Logic: Alerts ---
  const expiringIngredients = useMemo(() => {
    return ingredients.filter(i => {
      if (!i.expiryDate) return false;
      const days = differenceInDays(parseISO(i.expiryDate), new Date());
      return days <= 3 && i.quantity > 0;
    });
  }, [ingredients]);

  const lowStockIngredients = useMemo(() => {
    return ingredients.filter(i => i.quantity <= i.threshold && i.quantity > 0);
  }, [ingredients]);

  // --- Logic: Recommendations ---
  const perfectMatchRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      return recipe.ingredients.every(ri => {
        const stock = ingredients.find(i => i.id === ri.ingredientId);
        return stock && stock.quantity >= ri.amount;
      });
    }).slice(0, 3);
  }, [recipes, ingredients]);

  const quickRecipes = useMemo(() => {
    return recipes.filter(r => {
      const totalTime = r.steps.reduce((acc, step) => acc + step.duration, 0);
      return totalTime <= 30 && r.difficulty <= 2;
    }).slice(0, 3);
  }, [recipes]);

  const expiringRescueRecipes = useMemo(() => {
    if (expiringIngredients.length === 0) return [];
    const expiringIds = expiringIngredients.map(i => i.id);
    return recipes.filter(r => {
      return r.ingredients.some(ri => expiringIds.includes(ri.ingredientId));
    }).slice(0, 3);
  }, [recipes, expiringIngredients]);

  const handleCook = (id: string) => {
    addToMealPlan(id);
    navigate('/plan');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-stone-800 tracking-tight leading-tight flex items-center gap-3">
            你好，大厨
            <div className="bg-amber-100 p-1.5 rounded-full text-amber-500 animate-pulse-slow">
              <Sun size={24} fill="currentColor" />
            </div>
          </h1>
          <p className="text-lg text-stone-500 mt-2 font-medium">
            冰箱里有 <span className="text-emerald-600 font-bold px-1">{ingredients.length}</span> 种食材待命，今天想创造什么美味？
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 rounded-2xl border border-blue-100 shadow-sm">
            <div className="relative">
              <Users size={18} className="text-blue-600" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm font-semibold text-blue-900">
              <span className="text-blue-600">{onlineCount}</span> 人在线
            </span>
          </div>
          <Button onClick={() => navigate('/recipes')} className="shadow-emerald-200">
            <Sparkles size={18} className="mr-2" /> 探索新菜谱
          </Button>
        </div>
      </header>

      {/* Alerts Section */}
      {(expiringIngredients.length > 0 || lowStockIngredients.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expiringIngredients.length > 0 && (
            <div className="bg-red-50/80 border border-red-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
              <div className="bg-white p-2.5 rounded-2xl shadow-sm text-red-500">
                 <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-lg">临期提醒</h3>
                <p className="text-sm text-red-700 mt-1 leading-relaxed">
                  <span className="font-semibold">{expiringIngredients.length}</span> 种食材即将过期，建议优先使用：
                  {expiringIngredients.slice(0,3).map(i => i.name).join(', ')}{expiringIngredients.length > 3 && '...'}
                </p>
              </div>
            </div>
          )}
          {lowStockIngredients.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
               <div className="bg-white p-2.5 rounded-2xl shadow-sm text-amber-500">
                 <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">库存预警</h3>
                <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                  <span className="font-semibold">{lowStockIngredients.length}</span> 种食材余量不足，别忘了补货哦。
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Recommendations */}
      <div className="space-y-10">
        {/* Priority: Expiring Rescue */}
        {expiringRescueRecipes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <Leaf size={20} />
              </div>
              <h2 className="text-xl font-bold text-stone-800">拯救临期食材</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {expiringRescueRecipes.map(recipe => (
                <RecipeRecCard key={recipe.id} recipe={recipe} onCook={() => handleCook(recipe.id)} reason="包含临期食材" color="red" />
              ))}
            </div>
          </section>
        )}

        {/* Priority: Perfect Match */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <ChefHat size={20} />
            </div>
            <h2 className="text-xl font-bold text-stone-800">冰箱现货直出</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {perfectMatchRecipes.length > 0 ? (
              perfectMatchRecipes.map(recipe => (
                <RecipeRecCard key={recipe.id} recipe={recipe} onCook={() => handleCook(recipe.id)} reason="食材齐全" color="primary" />
              ))
            ) : (
              <GlassCard className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
                 <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-4">
                    <ChefHat size={32} />
                 </div>
                 <h3 className="text-lg font-semibold text-stone-700">暂无完全匹配的菜谱</h3>
                 <p className="text-stone-500 mt-1">你的冰箱可能需要进点货了，或者试试部分匹配的菜谱。</p>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Priority: Quick */}
        <section>
          <div className="flex items-center gap-2 mb-5">
             <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
              <Clock size={20} />
            </div>
            <h2 className="text-xl font-bold text-stone-800">30分钟快手菜</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickRecipes.map(recipe => (
              <RecipeRecCard key={recipe.id} recipe={recipe} onCook={() => handleCook(recipe.id)} reason="简单快捷" color="green" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

interface RecipeRecCardProps {
  recipe: any;
  onCook: () => void;
  reason: string;
  color: 'primary' | 'red' | 'green';
}

const RecipeRecCard: React.FC<RecipeRecCardProps> = ({ recipe, onCook, reason, color }) => (
  <GlassCard className="flex flex-col h-full group p-0 overflow-hidden border-0 ring-1 ring-white/50">
    <div className="relative h-48 overflow-hidden bg-stone-100">
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
      ) : (
        <div className="flex items-center justify-center h-full text-stone-300">
          <ChefHat size={40} />
        </div>
      )}
      <div className="absolute top-3 right-3 shadow-sm">
        <Badge color={color}>{reason}</Badge>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
      <div className="absolute bottom-3 left-3 text-white">
        <h3 className="font-bold text-lg leading-tight shadow-black drop-shadow-md">{recipe.name}</h3>
      </div>
    </div>
    <div className="flex-1 p-5 flex flex-col">
      <p className="text-stone-500 text-sm line-clamp-2 mb-4 leading-relaxed">{recipe.description}</p>
      <div className="flex gap-2 mt-auto">
        <Badge color="stone">{recipe.difficulty}星难度</Badge>
        <Badge color="stone">{recipe.steps.reduce((a:number, b:any) => a + b.duration, 0)}分钟</Badge>
      </div>
      <Button onClick={onCook} variant="secondary" size="sm" className="w-full mt-5 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
        加入今日菜单 <ChevronRight size={14} className="ml-1 opacity-50 group-hover:opacity-100" />
      </Button>
    </div>
  </GlassCard>
);

export default Dashboard;