import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button, GlassCard, Badge } from '../components/ui';
import { Play, Pause, ChevronRight, ChevronLeft, CheckCircle, RotateCcw, ArrowLeft, Lightbulb } from 'lucide-react';

const Cooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, ingredients, deductStock } = useStore();
  const recipe = recipes.find(r => r.id === id);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!recipe) {
      alert('菜谱不存在');
      navigate('/recipes');
    } else {
      // Initialize timer for first step
      if (recipe.steps.length > 0) {
        setTimeLeft(recipe.steps[0].duration * 60);
      }
    }
  }, [recipe]);

  // Handle step change
  useEffect(() => {
    if (recipe && recipe.steps[currentStepIndex]) {
      setTimerActive(false);
      setTimeLeft(recipe.steps[currentStepIndex].duration * 60);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }, [currentStepIndex]);

  // Timer Logic
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Play sound or vibrate logic here if permitted
            alert('步骤倒计时结束！');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (recipe && currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      finishCooking();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  const finishCooking = () => {
    setIsCompleted(true);
    // Auto deduct logic
    if (recipe) {
      deductStock(recipe.id);
    }
  };

  if (!recipe) return null;

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-bold text-stone-800">大功告成！</h1>
        <p className="text-stone-500 max-w-md">
          {recipe.name} 制作完成，食材库存已自动更新。尽情享受美味吧！
        </p>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate('/')}>返回首页</Button>
          <Button onClick={() => navigate('/recipes')}>看其他菜谱</Button>
        </div>
      </div>
    );
  }

  const currentStep = recipe.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={20}/></Button>
        <span className="font-bold text-lg">{recipe.name} - 烹饪模式</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
        <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Ingredients Summary (Always visible at top) */}
      <GlassCard className="bg-emerald-50/30 border-emerald-100">
        <h4 className="text-sm font-bold text-stone-600 mb-2">所需食材准备</h4>
        <div className="flex flex-wrap gap-2">
          {recipe.ingredients.map(ri => {
            const ing = ingredients.find(i => i.id === ri.ingredientId);
            return (
              <Badge key={ri.ingredientId} color="primary">
                {ing ? ing.name : '未知食材'} {ri.amount}{ing?.unit}
              </Badge>
            );
          })}
        </div>
      </GlassCard>

      {/* Notes */}
      {recipe.notes && (
         <div className="bg-amber-50/80 text-amber-900 p-4 rounded-2xl text-sm border border-amber-100 flex items-start gap-3">
           <div className="bg-white p-1.5 rounded-lg text-amber-500 shrink-0 shadow-sm">
             <Lightbulb size={18} fill="currentColor" />
           </div>
           <div className="pt-0.5">
             <span className="font-bold block mb-1 text-amber-800">烹饪小贴士</span>
             {recipe.notes}
           </div>
         </div>
      )}

      {/* Main Step Card */}
      <GlassCard className="min-h-[300px] flex flex-col justify-between items-center text-center p-8">
        <div className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-4">
          STEP {currentStepIndex + 1} / {recipe.steps.length}
        </div>
        
        <div className="text-xl md:text-2xl font-medium text-stone-800 leading-relaxed">
          {currentStep.description}
        </div>

        <div className="mt-8 w-full">
           {currentStep.isTimerEnabled ? (
             <div className="flex flex-col items-center">
               <div className={`text-6xl font-mono font-bold mb-6 ${timerActive ? 'text-emerald-500' : 'text-stone-300'}`}>
                 {formatTime(timeLeft)}
               </div>
               <div className="flex gap-4">
                 <button 
                  onClick={() => setTimerActive(!timerActive)}
                  className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors shadow-lg shadow-emerald-200"
                 >
                   {timerActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1"/>}
                 </button>
                 <button 
                  onClick={() => { setTimerActive(false); setTimeLeft(currentStep.duration * 60); }}
                  className="w-16 h-16 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition-colors"
                 >
                   <RotateCcw size={24} />
                 </button>
               </div>
             </div>
           ) : (
             <div className="text-stone-400 text-sm">此步骤无需计时</div>
           )}
        </div>
      </GlassCard>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center px-4">
        <Button 
          variant="secondary" 
          onClick={handlePrev} 
          disabled={currentStepIndex === 0}
          className="w-32"
        >
          <ChevronLeft size={20} className="mr-1" /> 上一步
        </Button>
        <Button 
          onClick={handleNext}
          className="w-32"
        >
          {currentStepIndex === recipe.steps.length - 1 ? '完成' : '下一步'} 
          {currentStepIndex !== recipe.steps.length - 1 && <ChevronRight size={20} className="ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default Cooking;