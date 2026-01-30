import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { GlassCard, Button, Input, Select, Modal } from '../components/ui';
import { Ingredient, IngredientType, StorageType } from '../types';
import { Plus, Trash2, Edit2, AlertTriangle, Search, Minus } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import CookingLoader from '../components/CookingLoader';

const Fridge = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, loading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localIngredients, setLocalIngredients] = useState<Ingredient[]>([]);
  
  // 用于防抖的 refs
  const updateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingUpdates = useRef<Map<string, Ingredient>>(new Map());

  // Form State
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '', type: IngredientType.FRESH, unit: 'g', quantity: 0, threshold: 0, storage: StorageType.FRIDGE, substitutes: []
  });

  // Sync local ingredients with store
  React.useEffect(() => {
    setLocalIngredients(ingredients);
  }, [ingredients]);

  // 清理定时器
  React.useEffect(() => {
    return () => {
      // 组件卸载时清除所有定时器
      updateTimers.current.forEach(timer => clearTimeout(timer));
      updateTimers.current.clear();
    };
  }, []);

  const handleSubmit = () => {
    if (!formData.name) return alert('请输入食材名称');
    
    if (editingId) {
      updateIngredient({ ...formData, id: editingId } as Ingredient);
    } else {
      addIngredient(formData as Ingredient);
    }
    closeModal();
  };

  const openEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setFormData(ing);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: IngredientType.FRESH, unit: 'g', quantity: 0, threshold: 0, storage: StorageType.FRIDGE, substitutes: [] });
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该食材吗？')) {
      deleteIngredient(id);
    }
  };

  const handleQuantityChange = useCallback((item: Ingredient, delta: number) => {
    // 立即更新 UI
    setLocalIngredients(prev => {
      const updated = prev.map(i => {
        if (i.id === item.id) {
          const newQuantity = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQuantity };
        }
        return i;
      });
      
      // 保存更新后的食材用于后续数据库更新
      const updatedItem = updated.find(i => i.id === item.id);
      if (updatedItem) {
        pendingUpdates.current.set(item.id, updatedItem);
      }
      
      return updated;
    });
    
    // 清除之前的定时器
    const existingTimer = updateTimers.current.get(item.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // 设置新的防抖定时器（500ms 后更新数据库）
    const timer = setTimeout(async () => {
      const itemToUpdate = pendingUpdates.current.get(item.id);
      if (!itemToUpdate) return;
      
      try {
        await updateIngredient(itemToUpdate);
        // 更新成功，清除待更新记录
        pendingUpdates.current.delete(item.id);
      } catch (error) {
        // 更新失败，回滚到 store 中的原始数量
        const originalItem = ingredients.find(i => i.id === item.id);
        if (originalItem) {
          setLocalIngredients(prev => 
            prev.map(i => i.id === item.id ? originalItem : i)
          );
        }
        
        // 显示错误提示
        alert(`更新失败：${error instanceof Error ? error.message : '未知错误'}`);
        console.error('Failed to update ingredient quantity:', error);
        
        pendingUpdates.current.delete(item.id);
      } finally {
        updateTimers.current.delete(item.id);
      }
    }, 500);
    
    updateTimers.current.set(item.id, timer);
  }, [updateIngredient, ingredients]);

  const filtered = localIngredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // 分开有库存和缺货的食材
  const inStock = filtered.filter(i => i.quantity > 0);
  const outOfStock = filtered.filter(i => i.quantity === 0);

  // 显示加载动画
  if (loading) {
    return <CookingLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">我的冰箱</h1>
          <p className="text-stone-500">管理库存、保质期与替代品</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="搜索食材..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/50 border border-stone-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
            <Plus size={18} className="mr-1" /> 添加
          </Button>
        </div>
      </div>

      {/* 有库存的食材 */}
      {inStock.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            有库存 ({inStock.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inStock.map(item => {
              const isLowStock = item.quantity <= item.threshold;
              const daysLeft = item.expiryDate ? differenceInDays(parseISO(item.expiryDate), new Date()) : 999;
              const isExpiring = daysLeft <= 3;

              return (
                <GlassCard key={item.id} className="relative group py-3 md:py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-stone-800">{item.name}</h3>
                      <div className="text-xs text-stone-500 mt-0.5 space-x-2">
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.storage}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xl md:text-2xl font-bold text-stone-700">
                          {item.quantity} <span className="text-sm font-normal text-stone-500">{item.unit}</span>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleQuantityChange(item, -1)}
                            className="p-2 md:p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-800 transition-colors active:scale-95"
                            title="减少数量"
                          >
                            <Minus size={18} className="md:w-3.5 md:h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleQuantityChange(item, 1)}
                            className="p-2 md:p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 hover:text-emerald-700 transition-colors active:scale-95"
                            title="增加数量"
                          >
                            <Plus size={18} className="md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      </div>
                      {isLowStock && (
                        <div className="flex items-center text-xs text-amber-500 mt-1 font-medium">
                          <AlertTriangle size={12} className="mr-1" /> 库存紧张
                        </div>
                      )}
                    </div>
                    {item.expiryDate && (
                      <div className={`text-xs px-2 py-1 rounded-lg ${isExpiring ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}>
                        {daysLeft < 0 ? '已过期' : `${daysLeft}天过期`}
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* 缺货的食材 */}
      {outOfStock.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            缺货待补 ({outOfStock.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfStock.map(item => (
              <GlassCard key={item.id} className="relative group py-3 md:py-4 bg-red-50/30 border-red-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-base md:text-lg text-stone-800">{item.name}</h3>
                    <div className="text-xs text-stone-500 mt-0.5 space-x-2">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.storage}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xl md:text-2xl font-bold text-red-600">
                        缺货 <span className="text-sm font-normal text-stone-500">({item.unit})</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleQuantityChange(item, 1)}
                          className="p-2 md:p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 hover:text-emerald-700 transition-colors active:scale-95"
                          title="补货"
                        >
                          <Plus size={18} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-red-500 mt-1 font-medium">
                      <AlertTriangle size={12} className="mr-1" /> 需要补货
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <p>没有找到食材</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? '编辑食材' : '添加食材'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>取消</Button>
            <Button onClick={handleSubmit}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input 
            label="名称" 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="类型" 
              value={formData.type} 
              onChange={e => setFormData({ ...formData, type: e.target.value as IngredientType })}
            >
              {Object.values(IngredientType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select 
              label="存储方式" 
              value={formData.storage} 
              onChange={e => setFormData({ ...formData, storage: e.target.value as StorageType })}
            >
              {Object.values(StorageType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="数量" 
              type="number" 
              value={formData.quantity} 
              onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} 
            />
            <Input 
              label="单位" 
              value={formData.unit} 
              onChange={e => setFormData({ ...formData, unit: e.target.value })} 
            />
            <Input 
              label="预警阈值" 
              type="number" 
              value={formData.threshold} 
              onChange={e => setFormData({ ...formData, threshold: parseFloat(e.target.value) })} 
            />
          </div>
          <Input 
            label="过期日期" 
            type="date" 
            value={formData.expiryDate ? format(parseISO(formData.expiryDate), 'yyyy-MM-dd') : ''} 
            onChange={e => setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
          />
        </div>
      </Modal>
    </div>
  );
};

export default Fridge;