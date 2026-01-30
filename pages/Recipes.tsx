import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { GlassCard, Button, Input, Select, Modal, Badge } from '../components/ui';
import { Recipe, RecipeIngredient, RecipeStep } from '../types';
import { Plus, Trash2, Edit2, Clock, BarChart, Tag, Image as ImageIcon, X, Upload, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { parseRecipeMarkdown, ParsedRecipe } from '../lib/recipeImporter';
import { recipeImportService } from '../services/recipeImport.service';
import CookingLoader from '../components/CookingLoader';

const Recipes = () => {
  const { recipes, categories, ingredients, addRecipe, updateRecipe, deleteRecipe, addCategory, updateCategory, deleteCategory } = useStore();
  const navigate = useNavigate();
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [view, setView] = useState<'list' | 'form' | 'categories' | 'import'>('list');
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Import state
  const [importText, setImportText] = useState('');
  const [parsedRecipes, setParsedRecipes] = useState<ParsedRecipe[]>([]);
  const [importError, setImportError] = useState('');

  // --- Category Management State ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Simulate loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // --- Recipe Form Handlers ---
  const handleSaveRecipe = () => {
    if (!editingRecipe?.name) return alert('请输入菜谱名称');
    
    // Ensure arrays exist
    const finalRecipe = {
      ...editingRecipe,
      ingredients: editingRecipe.ingredients || [],
      steps: editingRecipe.steps || [],
      tags: editingRecipe.tags || [],
    } as Recipe;

    if (editingRecipe.id) {
      updateRecipe(finalRecipe);
    } else {
      addRecipe(finalRecipe);
    }
    setView('list');
    setEditingRecipe(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingRecipe(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Import Handlers ---
  const handleParseImport = () => {
    try {
      setImportError('');
      const recipes = parseRecipeMarkdown(importText);
      if (recipes.length === 0) {
        setImportError('未能解析到有效的菜谱，请检查格式是否正确');
        return;
      }
      setParsedRecipes(recipes);
    } catch (error) {
      setImportError('解析失败: ' + (error as Error).message);
    }
  };

  const handleImportRecipes = async () => {
    setImportError('');
    try {
      const results = await recipeImportService.importRecipes(parsedRecipes);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      let message = `导入完成！\n成功: ${successCount} 个`;
      if (failCount > 0) {
        message += `\n失败: ${failCount} 个`;
      }
      
      // 显示警告信息
      const warnings = results.flatMap(r => r.warnings || []);
      if (warnings.length > 0) {
        message += '\n\n注意事项:\n' + warnings.slice(0, 5).join('\n');
        if (warnings.length > 5) {
          message += `\n...还有 ${warnings.length - 5} 条提示`;
        }
      }
      
      // 显示错误信息
      const errors = results.filter(r => !r.success);
      if (errors.length > 0) {
        message += '\n\n失败的菜谱:\n' + errors.map(e => `- ${e.recipeName}: ${e.error}`).join('\n');
      }
      
      alert(message);
      
      if (successCount > 0) {
        setView('list');
        setImportText('');
        setParsedRecipes([]);
        // 刷新数据
        window.location.reload();
      }
    } catch (error) {
      setImportError('导入失败: ' + (error as Error).message);
    }
  };

  // --- Render ---

  if (view === 'import') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => { setView('list'); setImportText(''); setParsedRecipes([]); setImportError(''); }}>返回</Button>
          <h1 className="text-2xl font-bold">批量导入菜谱</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 输入区 */}
          <div className="space-y-4">
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Markdown 格式</h3>
                <a 
                  href="/recipe-import-template.md" 
                  download 
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <FileText size={16} />
                  下载模板
                </a>
              </div>
              <textarea
                className="w-full h-96 p-4 bg-white/50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono text-sm"
                placeholder="粘贴 Markdown 格式的菜谱内容..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              {importError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {importError}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button onClick={handleParseImport} disabled={!importText}>
                  解析菜谱
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setImportText('');
                    setParsedRecipes([]);
                    setImportError('');
                  }}
                >
                  清空
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* 预览区 */}
          <div className="space-y-4">
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">
                  解析结果 {parsedRecipes.length > 0 && `(${parsedRecipes.length} 个菜谱)`}
                </h3>
                {parsedRecipes.length > 0 && (
                  <Button onClick={handleImportRecipes}>
                    <Upload size={16} className="mr-1" />
                    导入到系统
                  </Button>
                )}
              </div>
              
              {parsedRecipes.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>解析后的菜谱将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {parsedRecipes.map((recipe, index) => (
                    <div key={index} className="bg-white/50 p-4 rounded-xl border border-stone-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-stone-800">{recipe.name}</h4>
                          <div className="flex gap-2 mt-1 text-xs text-stone-500">
                            <span>{recipe.category}</span>
                            <span>•</span>
                            <span>{recipe.difficulty}星</span>
                            {recipe.prepTime && <><span>•</span><span>准备 {recipe.prepTime}分钟</span></>}
                            {recipe.cookTime && <><span>•</span><span>烹饪 {recipe.cookTime}分钟</span></>}
                          </div>
                        </div>
                        <Badge>{recipe.ingredients.length} 食材</Badge>
                      </div>
                      
                      {recipe.description && (
                        <p className="text-sm text-stone-600 mb-3">{recipe.description}</p>
                      )}
                      
                      {recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {recipe.tags.map(tag => (
                            <span key={tag} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-stone-700 mb-1">食材:</div>
                          <ul className="text-stone-600 space-y-0.5">
                            {recipe.ingredients.slice(0, 5).map((ing, i) => (
                              <li key={i} className="text-xs">
                                • {ing.name} {ing.amount}{ing.unit}
                                {ing.optional && <span className="text-stone-400"> (可选)</span>}
                              </li>
                            ))}
                            {recipe.ingredients.length > 5 && (
                              <li className="text-xs text-stone-400">...还有 {recipe.ingredients.length - 5} 个</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium text-stone-700 mb-1">步骤:</div>
                          <ul className="text-stone-600 space-y-0.5">
                            {recipe.steps.slice(0, 3).map((step, i) => (
                              <li key={i} className="text-xs">
                                {i + 1}. {step.description.substring(0, 30)}...
                              </li>
                            ))}
                            {recipe.steps.length > 3 && (
                              <li className="text-xs text-stone-400">...还有 {recipe.steps.length - 3} 步</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'categories') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => setView('list')}>返回</Button>
          <h1 className="text-2xl font-bold">分类管理</h1>
        </div>
        <div className="grid gap-4 max-w-2xl">
          <GlassCard className="flex gap-2 items-end">
            <Input 
              placeholder="新分类名称..." 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
            />
            <Button onClick={() => {
               if(editingCatId) {
                 updateCategory(editingCatId, newCatName);
                 setEditingCatId(null);
               } else {
                 if(newCatName) addCategory(newCatName);
               }
               setNewCatName('');
            }} className="whitespace-nowrap">
              {editingCatId ? '保存' : '添加'}
            </Button>
            {editingCatId && <Button variant="ghost" onClick={() => { setEditingCatId(null); setNewCatName(''); }}>取消</Button>}
          </GlassCard>
          
          {categories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-stone-100">
              <span className="font-medium">{cat.name}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditingCatId(cat.id); setNewCatName(cat.name); }}>编辑</Button>
                <Button size="sm" variant="danger" onClick={() => {
                  if (confirm('删除分类？(菜品将变为无分类)')) deleteCategory(cat.id, false);
                }}>删除</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex justify-between items-center sticky top-0 bg-[#FDFBF7]/90 backdrop-blur z-10 py-4 border-b border-stone-200">
           <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={() => { setView('list'); setEditingRecipe(null); }}>取消</Button>
              <h1 className="text-2xl font-bold">{editingRecipe?.id ? '编辑菜谱' : '创建菜谱'}</h1>
           </div>
           <Button onClick={handleSaveRecipe}>保存菜谱</Button>
        </div>

        {/* Basic Info */}
        <GlassCard>
          <h3 className="font-bold text-lg mb-4">基础信息</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <Input label="菜名" value={editingRecipe?.name || ''} onChange={e => setEditingRecipe({ ...editingRecipe, name: e.target.value })} />
               <Select label="分类" value={editingRecipe?.categoryId || ''} onChange={e => setEditingRecipe({ ...editingRecipe, categoryId: e.target.value })}>
                 <option value="">无分类</option>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </Select>
               <div className="grid grid-cols-2 gap-4">
                  <Select label="难度 (1-5)" value={editingRecipe?.difficulty || 1} onChange={e => setEditingRecipe({ ...editingRecipe, difficulty: parseInt(e.target.value) })}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} 星</option>)}
                  </Select>
                  <Input label="标签 (逗号分隔)" value={editingRecipe?.tags?.join(',') || ''} onChange={e => setEditingRecipe({ ...editingRecipe, tags: e.target.value.split(',') })} />
               </div>
            </div>
            <div className="space-y-4">
               <label className="block text-sm font-medium text-stone-600">封面图</label>
               <div className="relative w-full h-48 bg-stone-100 rounded-xl overflow-hidden border-2 border-dashed border-stone-300 flex items-center justify-center group">
                  {editingRecipe?.image ? (
                    <>
                      <img src={editingRecipe.image} className="w-full h-full object-cover" />
                      <button onClick={() => setEditingRecipe({...editingRecipe, image: undefined})} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-red-500"><X size={16}/></button>
                    </>
                  ) : (
                    <div className="text-center text-stone-400">
                      <ImageIcon className="mx-auto mb-2" />
                      <span className="text-sm">点击上传图片</span>
                    </div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
               </div>
               <Input label="简介" value={editingRecipe?.description || ''} onChange={e => setEditingRecipe({ ...editingRecipe, description: e.target.value })} />
            </div>
          </div>
        </GlassCard>

        {/* Ingredients */}
        <GlassCard>
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-lg">所需食材</h3>
            <Button size="sm" onClick={() => setEditingRecipe({ ...editingRecipe, ingredients: [...(editingRecipe?.ingredients || []), { ingredientId: ingredients[0]?.id || '', amount: 1 }] })}>添加食材</Button>
          </div>
          <div className="space-y-3">
            {editingRecipe?.ingredients?.map((ri, index) => (
              <div key={index} className="flex gap-2 items-end">
                <Select className="flex-1" label={index === 0 ? "选择食材" : ""} value={ri.ingredientId} onChange={e => {
                  const newIngs = [...(editingRecipe.ingredients || [])];
                  newIngs[index].ingredientId = e.target.value;
                  setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                }}>
                  {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </Select>
                <div className="w-24">
                  <Input type="number" label={index === 0 ? "数量" : ""} value={ri.amount} onChange={e => {
                     const newIngs = [...(editingRecipe.ingredients || [])];
                     newIngs[index].amount = parseFloat(e.target.value);
                     setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                  }} />
                </div>
                <Button variant="ghost" className="mb-1 text-red-400" onClick={() => {
                   setEditingRecipe({ ...editingRecipe, ingredients: editingRecipe.ingredients?.filter((_, i) => i !== index) });
                }}><Trash2 size={18} /></Button>
              </div>
            ))}
            {(!editingRecipe?.ingredients || editingRecipe.ingredients.length === 0) && <p className="text-stone-400 text-sm text-center py-4">暂无关联食材</p>}
          </div>
        </GlassCard>

        {/* Steps */}
        <GlassCard>
           <div className="flex justify-between mb-4">
            <h3 className="font-bold text-lg">烹饪步骤</h3>
            <Button size="sm" onClick={() => setEditingRecipe({ ...editingRecipe, steps: [...(editingRecipe?.steps || []), { id: uuidv4(), description: '', duration: 1, isTimerEnabled: true }] })}>添加步骤</Button>
          </div>
          <div className="space-y-4">
             {editingRecipe?.steps?.map((step, index) => (
               <div key={step.id} className="bg-white/40 p-4 rounded-xl border border-stone-100 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-emerald-100/50 rounded-l-xl flex items-center justify-center font-bold text-emerald-800 text-sm">{index + 1}</div>
                  <div className="ml-8 pl-4 grid gap-3">
                    <Input placeholder="操作描述..." value={step.description} onChange={e => {
                       const newSteps = [...(editingRecipe.steps || [])];
                       newSteps[index].description = e.target.value;
                       setEditingRecipe({ ...editingRecipe, steps: newSteps });
                    }} />
                    <div className="flex gap-4 items-center">
                       <div className="w-32 flex items-center gap-2">
                         <Clock size={16} className="text-stone-400"/>
                         <input type="number" className="w-full bg-transparent border-b border-stone-300 focus:outline-none" value={step.duration} onChange={e => {
                            const newSteps = [...(editingRecipe.steps || [])];
                            newSteps[index].duration = parseInt(e.target.value);
                            setEditingRecipe({ ...editingRecipe, steps: newSteps });
                         }} />
                         <span className="text-sm text-stone-500">分</span>
                       </div>
                       <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none">
                          <input type="checkbox" checked={step.isTimerEnabled} onChange={e => {
                             const newSteps = [...(editingRecipe.steps || [])];
                             newSteps[index].isTimerEnabled = e.target.checked;
                             setEditingRecipe({ ...editingRecipe, steps: newSteps });
                          }} />
                          启用倒计时
                       </label>
                       <div className="flex-1 text-right">
                         <button className="text-stone-400 hover:text-red-500" onClick={() => {
                            setEditingRecipe({ ...editingRecipe, steps: editingRecipe.steps?.filter((_, i) => i !== index) });
                         }}><Trash2 size={16} /></button>
                       </div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </GlassCard>
        
        {/* Notes */}
        <GlassCard>
          <Input label="小贴士" value={editingRecipe?.notes || ''} onChange={e => setEditingRecipe({ ...editingRecipe, notes: e.target.value })} />
        </GlassCard>
      </div>
    );
  }

  // --- List View ---
  const filteredRecipes = recipes.filter(r => 
    (filterCategory ? r.categoryId === filterCategory : true) &&
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-stone-800">菜谱大全</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={() => setView('categories')}>管理分类</Button>
          <Button variant="secondary" onClick={() => setView('import')}>
            <Upload size={18} className="mr-1" /> 批量导入
          </Button>
          <Button onClick={() => {
            setEditingRecipe({ categoryId: '', difficulty: 1, ingredients: [], steps: [] });
            setView('form');
          }}><Plus size={18} className="mr-1" /> 创建菜谱</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setFilterCategory('')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${filterCategory === '' ? 'bg-emerald-400 text-white' : 'bg-white/50 text-stone-600 hover:bg-white/80'}`}
        >
          全部
        </button>
        {categories.map(c => (
           <button 
            key={c.id}
            onClick={() => setFilterCategory(c.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${filterCategory === c.id ? 'bg-emerald-400 text-white' : 'bg-white/50 text-stone-600 hover:bg-white/80'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CookingLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map(recipe => (
            <GlassCard key={recipe.id} className="group flex flex-col h-full hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate(`/cooking/${recipe.id}`)}>
               <div className="relative h-48 -mx-4 -mt-4 mb-4 overflow-hidden rounded-t-2xl bg-stone-200">
                 {recipe.image ? (
                   <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="flex items-center justify-center h-full text-stone-400">
                      <ImageIcon size={32} />
                   </div>
                 )}
                 <div className="absolute top-2 right-2">
                   <Badge>{recipe.difficulty}星</Badge>
                 </div>
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-lg text-stone-800 mb-1">{recipe.name}</h3>
                 <p className="text-sm text-stone-500 line-clamp-2 mb-3">{recipe.description}</p>
                 <div className="flex flex-wrap gap-1">
                   {recipe.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{t}</span>)}
                 </div>
               </div>
               <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock size={12} /> 
                    {recipe.steps.reduce((a, b) => a + b.duration, 0)} 分钟
                  </span>
                  <div className="flex gap-2">
                     <button className="p-1.5 text-stone-400 hover:text-emerald-500 bg-stone-50 rounded-lg hover:bg-emerald-50" onClick={(e) => {
                       e.stopPropagation();
                       setEditingRecipe(recipe);
                       setView('form');
                     }}>
                       <Edit2 size={16} />
                     </button>
                     <button className="p-1.5 text-stone-400 hover:text-red-500 bg-stone-50 rounded-lg hover:bg-red-50" onClick={(e) => {
                       e.stopPropagation();
                       if(confirm('确定删除此菜谱?')) deleteRecipe(recipe.id);
                     }}>
                       <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;