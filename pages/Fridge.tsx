import React, { useState } from 'react';
import { useStore } from '../store';
import { GlassCard, Button, Input, Select, Modal, Badge } from '../components/ui';
import { Ingredient, IngredientType, StorageType } from '../types';
import { Plus, Trash2, Edit2, AlertTriangle, Search } from 'lucide-react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';

const Fridge = () => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '', type: IngredientType.FRESH, unit: 'g', quantity: 0, threshold: 0, storage: StorageType.FRIDGE, substitutes: []
  });

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

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const isLowStock = item.quantity <= item.threshold;
          const daysLeft = item.expiryDate ? differenceInDays(parseISO(item.expiryDate), new Date()) : 999;
          const isExpiring = daysLeft <= 3;

          return (
            <GlassCard key={item.id} className="relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-stone-800">{item.name}</h3>
                  <div className="text-xs text-stone-500 mt-0.5 space-x-2">
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{item.storage}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0"> 
                  {/* Mobile always visible? No, use tap on mobile logic usually, but here simple buttons */}
                  <button onClick={() => openEdit(item)} className="p-1.5 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Mobile visible fallback */}
                <button onClick={() => openEdit(item)} className="md:hidden absolute top-4 right-4 p-1.5 text-stone-400">
                   <Edit2 size={16} />
                </button>
              </div>

              <div className="flex items-end justify-between mt-4">
                <div>
                  <div className="text-2xl font-bold text-stone-700">
                    {item.quantity} <span className="text-sm font-normal text-stone-500">{item.unit}</span>
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