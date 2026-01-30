import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { GlassCard, Button, Input, Select, Modal, Badge } from '../components/ui';
import { Recipe, RecipeIngredient, RecipeStep } from '../types';
import { Plus, Trash2, Edit2, Clock, BarChart, Tag, Image as ImageIcon, X, Upload, FileText, Sparkles, Search, Filter, SortAsc } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { parseRecipeMarkdown, ParsedRecipe } from '../lib/recipeImporter';
import { recipeImportService } from '../services/recipeImport.service';
import CookingLoader from '../components/CookingLoader';

const Recipes = () => {
  const { recipes, myRecipes, publicRecipes, categories, ingredients, addRecipe, updateRecipe, deleteRecipe, addCategory, updateCategory, deleteCategory, user, refresh, loading } = useStore();
  const navigate = useNavigate();
  
  // State
  const [view, setView] = useState<'list' | 'form' | 'categories' | 'import' | 'preview'>('list');
  const [recipeTab, setRecipeTab] = useState<'my' | 'public'>('my'); // 新增：标签页状态
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<number | ''>('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'time'>('name');
  const [showFilters, setShowFilters] = useState(false);
  
  // Import state
  const [importText, setImportText] = useState('');
  const [parsedRecipes, setParsedRecipes] = useState<ParsedRecipe[]>([]);
  const [importError, setImportError] = useState('');

  // --- Category Management State ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // --- Recipe Form Handlers ---
  const handleSaveRecipe = async () => {
    if (!editingRecipe?.name) return alert('请输入菜谱名称');
    
    // Ensure arrays exist
    const finalRecipe = {
      ...editingRecipe,
      ingredients: editingRecipe.ingredients || [],
      steps: editingRecipe.steps || [],
      tags: editingRecipe.tags || [],
    } as Recipe;

    try {
      if (editingRecipe.id) {
        await updateRecipe(finalRecipe);
      } else {
        await addRecipe(finalRecipe);
      }
      // 刷新数据以确保显示最新的食材信息
      await refresh();
      setView('list');
      setEditingRecipe(null);
    } catch (error) {
      console.error('保存菜谱失败:', error);
      alert('保存失败，请重试');
    }
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
        await refresh();
      }
    } catch (error) {
      setImportError('导入失败: ' + (error as Error).message);
    }
  };

  // --- Render ---

  if (view === 'preview' && previewRecipe) {
    const category = categories.find(c => c.id === previewRecipe.categoryId);
    const totalTime = previewRecipe.steps.reduce((sum, s) => sum + s.duration, 0);
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex justify-between items-center sticky top-0 bg-[#FDFBF7]/90 backdrop-blur z-10 py-4 border-b border-stone-200">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => { setView('list'); setPreviewRecipe(null); }}>返回</Button>
            <h1 className="text-2xl font-bold">{previewRecipe.name}</h1>
          </div>
          <div className="flex gap-2">
            {/* 只有我的菜谱才显示编辑和删除按钮 */}
            {recipeTab === 'my' && (
              <>
                <Button variant="secondary" onClick={() => {
                  setEditingRecipe(previewRecipe);
                  setView('form');
                }}>
                  <Edit2 size={16} className="mr-1" />
                  编辑
                </Button>
                <Button variant="danger" onClick={() => {
                  if (confirm('确定删除此菜谱?')) {
                    deleteRecipe(previewRecipe.id);
                    setView('list');
                    setPreviewRecipe(null);
                  }
                }}>
                  <Trash2 size={16} className="mr-1" />
                  删除
                </Button>
              </>
            )}
            <Button onClick={() => navigate(`/cooking/${previewRecipe.id}`)}>
              开始烹饪
            </Button>
          </div>
        </div>

        {/* 封面图 */}
        {previewRecipe.image && (
          <div className="relative h-64 md:h-96 -mx-4 md:mx-0 overflow-hidden rounded-none md:rounded-2xl">
            <img 
              src={previewRecipe.image} 
              alt={previewRecipe.name} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* 基础信息 */}
        <GlassCard>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <Badge>{previewRecipe.difficulty}星</Badge>
            {category && <span className="text-sm text-stone-600">{category.name}</span>}
            <span className="text-sm text-stone-600 flex items-center gap-1">
              <Clock size={14} />
              {totalTime} 分钟
            </span>
          </div>
          
          {previewRecipe.description && (
            <p className="text-stone-700 mb-4">{previewRecipe.description}</p>
          )}
          
          {previewRecipe.tags && previewRecipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewRecipe.tags.map(tag => (
                <span key={tag} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </GlassCard>

        {/* 所需食材 */}
        <GlassCard>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Tag size={20} className="text-emerald-600" />
            所需食材
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {previewRecipe.ingredients.map((ri, index) => {
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="flex-1 text-stone-700">{ri.name || '未知食材'}</span>
                  <span className="text-stone-600 font-medium">
                    {ri.amount} {ri.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 烹饪步骤 */}
        <GlassCard>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart size={20} className="text-emerald-600" />
            烹饪步骤
          </h3>
          <div className="space-y-4">
            {previewRecipe.steps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-400 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-stone-700 mb-2">{step.description}</p>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Clock size={14} />
                    <span>{step.duration} 分钟</span>
                    {step.isTimerEnabled && (
                      <span className="text-emerald-600">(可计时)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 小贴士 */}
        {previewRecipe.notes && (
          <GlassCard>
            <h3 className="font-bold text-lg mb-3">小贴士</h3>
            <p className="text-stone-700">{previewRecipe.notes}</p>
          </GlassCard>
        )}
      </div>
    );
  }

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
                <div className="flex gap-2">
                  <a 
                    href="https://doubao.com/bot/DxH2TNW7" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-1 transition-all"
                  >
                    <Sparkles size={14} />
                    豆包快速生成
                  </a>
                  <a 
                    href="/recipe-import-template.md" 
                    download 
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <FileText size={16} />
                    下载模板
                  </a>
                </div>
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
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditingRecipe({ 
                ...editingRecipe, 
                ingredients: [...(editingRecipe?.ingredients || []), { 
                  ingredientId: '', 
                  amount: 1, 
                  name: '', 
                  unit: '', 
                  isManual: true 
                }] 
              })}>手动输入</Button>
              <Button size="sm" onClick={() => setEditingRecipe({ 
                ...editingRecipe, 
                ingredients: [...(editingRecipe?.ingredients || []), { 
                  ingredientId: ingredients[0]?.id || '', 
                  amount: 1,
                  isManual: false
                }] 
              })}>从冰箱选择</Button>
            </div>
          </div>
          <div className="space-y-3">
            {editingRecipe?.ingredients?.map((ri, index) => (
              <div key={index} className="flex gap-2 items-end">
                {ri.isManual ? (
                  // 手动输入模式
                  <>
                    <div className="flex-1">
                      <Input 
                        label={index === 0 ? "食材名称" : ""} 
                        placeholder="例如：鸡蛋"
                        value={ri.name || ''} 
                        onChange={e => {
                          const newIngs = [...(editingRecipe.ingredients || [])];
                          newIngs[index].name = e.target.value;
                          setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                        }} 
                      />
                    </div>
                    <div className="w-24">
                      <Input 
                        type="number" 
                        label={index === 0 ? "数量" : ""} 
                        value={ri.amount} 
                        onChange={e => {
                          const newIngs = [...(editingRecipe.ingredients || [])];
                          newIngs[index].amount = parseFloat(e.target.value);
                          setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                        }} 
                      />
                    </div>
                    <div className="w-20">
                      <Input 
                        label={index === 0 ? "单位" : ""} 
                        placeholder="个"
                        value={ri.unit || ''} 
                        onChange={e => {
                          const newIngs = [...(editingRecipe.ingredients || [])];
                          newIngs[index].unit = e.target.value;
                          setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                        }} 
                      />
                    </div>
                  </>
                ) : (
                  // 从冰箱选择模式
                  <>
                    <Select 
                      className="flex-1" 
                      label={index === 0 ? "选择食材" : ""} 
                      value={ri.ingredientId} 
                      onChange={e => {
                        const newIngs = [...(editingRecipe.ingredients || [])];
                        newIngs[index].ingredientId = e.target.value;
                        setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                      }}
                    >
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                    </Select>
                    <div className="w-24">
                      <Input 
                        type="number" 
                        label={index === 0 ? "数量" : ""} 
                        value={ri.amount} 
                        onChange={e => {
                          const newIngs = [...(editingRecipe.ingredients || [])];
                          newIngs[index].amount = parseFloat(e.target.value);
                          setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                        }} 
                      />
                    </div>
                  </>
                )}
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
  // 根据当前标签页选择要显示的菜谱列表
  const currentRecipes = recipeTab === 'my' ? myRecipes : publicRecipes;
  
  // 获取所有标签
  const allTags = Array.from(new Set(currentRecipes.flatMap(r => r.tags || [])));
  
  // 筛选和排序
  const filteredRecipes = currentRecipes
    .filter(r => {
      // 分类筛选
      if (filterCategory && r.categoryId !== filterCategory) return false;
      
      // 难度筛选
      if (filterDifficulty !== '' && r.difficulty !== filterDifficulty) return false;
      
      // 标签筛选
      if (filterTag && !r.tags?.includes(filterTag)) return false;
      
      // 搜索词筛选（搜索名称、描述、标签）
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = r.name.toLowerCase().includes(term);
        const matchDesc = r.description?.toLowerCase().includes(term);
        const matchTags = r.tags?.some(t => t.toLowerCase().includes(term));
        if (!matchName && !matchDesc && !matchTags) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN');
        case 'difficulty':
          return a.difficulty - b.difficulty;
        case 'time':
          const timeA = a.steps.reduce((sum, s) => sum + s.duration, 0);
          const timeB = b.steps.reduce((sum, s) => sum + s.duration, 0);
          return timeA - timeB;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-800">菜谱大全</h1>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <Button variant="secondary" onClick={() => setView('categories')} className="whitespace-nowrap flex-1 md:flex-none">
            分类
          </Button>
          <Button variant="secondary" onClick={() => setView('import')} className="whitespace-nowrap flex-1 md:flex-none">
            <Upload size={16} className="md:mr-1" />
            <span className="hidden md:inline ml-1">批量</span>导入
          </Button>
          <Button onClick={() => {
            setEditingRecipe({ categoryId: '', difficulty: 1, ingredients: [], steps: [] });
            setView('form');
          }} className="whitespace-nowrap flex-1 md:flex-none">
            <Plus size={16} className="md:mr-1" />
            <span className="hidden md:inline ml-1">创建</span>菜谱
          </Button>
        </div>
      </div>

      {/* 标签页切换 */}
      {user && !user.isGuest && (
        <div className="flex gap-2 border-b border-stone-200">
          <button
            onClick={() => {
              setRecipeTab('my');
              setSearchTerm('');
              setFilterCategory('');
              setFilterDifficulty('');
              setFilterTag('');
            }}
            className={`px-6 py-3 font-medium transition-colors relative ${
              recipeTab === 'my'
                ? 'text-emerald-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            我的菜谱
            {recipeTab === 'my' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
            <span className="ml-2 text-sm bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
              {myRecipes.length}
            </span>
          </button>
          <button
            onClick={() => {
              setRecipeTab('public');
              setSearchTerm('');
              setFilterCategory('');
              setFilterDifficulty('');
              setFilterTag('');
            }}
            className={`px-6 py-3 font-medium transition-colors relative ${
              recipeTab === 'public'
                ? 'text-emerald-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            菜谱广场
            {recipeTab === 'public' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
            <span className="ml-2 text-sm bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              {publicRecipes.length}
            </span>
          </button>
        </div>
      )}

      {/* 搜索和筛选区域 */}
      <GlassCard>
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="搜索菜谱名称、描述或标签..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-stone-800"
            />
          </div>

          {/* 筛选按钮 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-600 transition-colors whitespace-nowrap"
            >
              <Filter size={16} />
              {showFilters ? '隐藏筛选' : '显示筛选'}
              {(filterDifficulty !== '' || filterTag) && (
                <Badge className="ml-1">
                  {[filterDifficulty !== '' ? 1 : 0, filterTag ? 1 : 0].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SortAsc size={16} className="text-stone-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-sm bg-white/50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 flex-1 sm:flex-none"
              >
                <option value="name">名称</option>
                <option value="difficulty">难度</option>
                <option value="time">时长</option>
              </select>
            </div>
          </div>

          {/* 高级筛选选项 */}
          {showFilters && (
            <div className="grid gap-4 pt-4 border-t border-stone-200">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">难度等级</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterDifficulty('')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                      filterDifficulty === '' 
                        ? 'bg-emerald-400 text-white' 
                        : 'bg-white/50 text-stone-600 hover:bg-white/80'
                    }`}
                  >
                    全部
                  </button>
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setFilterDifficulty(level)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                        filterDifficulty === level 
                          ? 'bg-emerald-400 text-white' 
                          : 'bg-white/50 text-stone-600 hover:bg-white/80'
                      }`}
                    >
                      {level}星
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterTag('')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                      filterTag === '' 
                        ? 'bg-emerald-400 text-white' 
                        : 'bg-white/50 text-stone-600 hover:bg-white/80'
                    }`}
                  >
                    全部
                  </button>
                  {allTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                        filterTag === tag 
                          ? 'bg-emerald-400 text-white' 
                          : 'bg-white/50 text-stone-600 hover:bg-white/80'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 清除筛选 */}
          {(searchTerm || filterCategory || filterDifficulty !== '' || filterTag) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-stone-200">
              <span className="text-sm text-stone-500 whitespace-nowrap">
                找到 {filteredRecipes.length} 个菜谱
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterDifficulty('');
                  setFilterTag('');
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 分类快捷筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setFilterCategory('')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${filterCategory === '' ? 'bg-emerald-400 text-white' : 'bg-white/50 text-stone-600 hover:bg-white/80'}`}
        >
          全部分类
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

      {loading ? (
        <CookingLoader />
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-stone-400 mb-4">
            <Search size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">没有找到符合条件的菜谱</p>
            <p className="text-sm mt-2">试试调整筛选条件或清除筛选</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map(recipe => (
            <GlassCard key={recipe.id} className="group flex flex-col h-full hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => {
              setPreviewRecipe(recipe);
              setView('preview');
            }}>
               <div className="relative h-48 -mx-4 -mt-4 mb-4 overflow-hidden rounded-t-2xl bg-stone-200">
                 <img 
                   src={recipe.image || '/logo.jpg'} 
                   alt={recipe.name} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                 />
                 <div className="absolute top-2 right-2 flex gap-2">
                   <Badge>{recipe.difficulty}星</Badge>
                   {/* 在菜谱广场上为我的菜谱添加"我的"标签 */}
                   {recipeTab === 'public' && user && !user.isGuest && recipe.userId === user.id && (
                     <Badge color="primary">我的</Badge>
                   )}
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
                  {recipeTab === 'my' && (
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
                  )}
               </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;