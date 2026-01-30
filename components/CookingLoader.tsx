import React from 'react';

const CookingLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      {/* 做菜动画 */}
      <div className="relative w-32 h-32">
        {/* 锅 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-16 bg-gradient-to-b from-stone-700 to-stone-800 rounded-b-3xl border-4 border-stone-900">
          {/* 锅把手 */}
          <div className="absolute -left-8 top-4 w-10 h-3 bg-stone-800 rounded-l-full"></div>
          <div className="absolute -right-8 top-4 w-10 h-3 bg-stone-800 rounded-r-full"></div>
        </div>
        
        {/* 蒸汽动画 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-12">
          <div className="relative">
            {/* 蒸汽1 */}
            <div className="absolute left-0 w-3 h-8 bg-stone-300/60 rounded-full animate-steam-1"></div>
            {/* 蒸汽2 */}
            <div className="absolute left-4 w-3 h-8 bg-stone-300/60 rounded-full animate-steam-2"></div>
            {/* 蒸汽3 */}
            <div className="absolute left-8 w-3 h-8 bg-stone-300/60 rounded-full animate-steam-3"></div>
          </div>
        </div>

        {/* 食材图标 - 旋转飞入效果 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-ingredient-drop">
          <div className="text-3xl animate-spin-slow">🥕</div>
        </div>
      </div>

      {/* 加载文字 */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-stone-800 animate-pulse">正在准备食材...</h3>
        <p className="text-sm text-stone-500">请稍候，马上就好</p>
      </div>

      {/* 加载点动画 */}
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce-1"></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce-2"></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce-3"></div>
      </div>

      <style>{`
        @keyframes steam-rise-1 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translateY(-40px) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes steam-rise-2 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translateY(-45px) scale(1.6);
            opacity: 0;
          }
        }
        
        @keyframes steam-rise-3 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translateY(-50px) scale(1.7);
            opacity: 0;
          }
        }

        @keyframes ingredient-drop {
          0%, 100% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translateY(0px) rotate(180deg);
            opacity: 1;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce-delay-1 {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }

        @keyframes bounce-delay-2 {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }

        @keyframes bounce-delay-3 {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }

        .animate-steam-1 {
          animation: steam-rise-1 2s ease-in-out infinite;
        }
        
        .animate-steam-2 {
          animation: steam-rise-2 2s ease-in-out infinite 0.3s;
        }
        
        .animate-steam-3 {
          animation: steam-rise-3 2s ease-in-out infinite 0.6s;
        }

        .animate-ingredient-drop {
          animation: ingredient-drop 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-bounce-1 {
          animation: bounce-delay-1 1.4s ease-in-out infinite;
        }

        .animate-bounce-2 {
          animation: bounce-delay-2 1.4s ease-in-out infinite 0.2s;
        }

        .animate-bounce-3 {
          animation: bounce-delay-3 1.4s ease-in-out infinite 0.4s;
        }
      `}</style>
    </div>
  );
};

export default CookingLoader;
