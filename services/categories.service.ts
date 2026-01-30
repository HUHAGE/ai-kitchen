import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  name: string;
}

export const categoriesService = {
  // 获取所有分类
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('kc_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取单个分类
  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('kc_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 创建分类
  async create(category: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
      .from('kc_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新分类
  async update(id: string, category: Partial<CategoryInsert>): Promise<Category> {
    const { data, error } = await supabase
      .from('kc_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除分类
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kc_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
