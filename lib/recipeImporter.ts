// 菜谱导入解析器
export interface ParsedRecipe {
  name: string;
  category: string;
  difficulty: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags: string[];
  description?: string;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  notes?: string;
}

export interface ParsedIngredient {
  name: string;
  amount: string;
  unit: string;
  optional: boolean;
}

export interface ParsedStep {
  description: string;
  duration?: number;
  isTimerEnabled: boolean;
}

export function parseRecipeMarkdown(markdown: string): ParsedRecipe[] {
  const recipes: ParsedRecipe[] = [];
  
  // 按 --- 分割多个菜谱
  const recipeSections = markdown.split(/\n---+\n/).filter(s => s.trim());
  
  for (const section of recipeSections) {
    try {
      const recipe = parseRecipeSection(section);
      if (recipe) {
        recipes.push(recipe);
      }
    } catch (error) {
      console.error('解析菜谱失败:', error);
    }
  }
  
  return recipes;
}

function parseRecipeSection(section: string): ParsedRecipe | null {
  const lines = section.split('\n').map(l => l.trim()).filter(l => l);
  
  let name = '';
  let category = '';
  let difficulty = 1;
  let prepTime: number | undefined;
  let cookTime: number | undefined;
  let servings: number | undefined;
  let tags: string[] = [];
  let description = '';
  let notes = '';
  const ingredients: ParsedIngredient[] = [];
  const steps: ParsedStep[] = [];
  
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 菜谱名称（## 开头）
    if (line.startsWith('## ')) {
      name = line.substring(3).trim();
      continue;
    }
    
    // 字段解析
    if (line.startsWith('**分类**:') || line.startsWith('**分类**：')) {
      category = line.split(/[:：]/)[1].trim();
      continue;
    }
    
    if (line.startsWith('**难度**:') || line.startsWith('**难度**：')) {
      const diffStr = line.split(/[:：]/)[1].trim();
      difficulty = parseInt(diffStr) || 1;
      continue;
    }
    
    if (line.startsWith('**准备时间**:') || line.startsWith('**准备时间**：')) {
      const timeStr = line.split(/[:：]/)[1].trim();
      prepTime = parseTime(timeStr);
      continue;
    }
    
    if (line.startsWith('**烹饪时间**:') || line.startsWith('**烹饪时间**：')) {
      const timeStr = line.split(/[:：]/)[1].trim();
      cookTime = parseTime(timeStr);
      continue;
    }
    
    if (line.startsWith('**份数**:') || line.startsWith('**份数**：')) {
      const servStr = line.split(/[:：]/)[1].trim();
      servings = parseInt(servStr) || 1;
      continue;
    }
    
    if (line.startsWith('**标签**:') || line.startsWith('**标签**：')) {
      const tagStr = line.split(/[:：]/)[1].trim();
      tags = tagStr.split(/\s+/).filter(t => t.startsWith('#')).map(t => t.substring(1));
      continue;
    }
    
    if (line.startsWith('**简介**:') || line.startsWith('**简介**：')) {
      description = line.split(/[:：]/)[1].trim();
      // 可能简介在下一行
      if (!description && i + 1 < lines.length) {
        description = lines[i + 1];
      }
      continue;
    }
    
    if (line.startsWith('**小贴士**:') || line.startsWith('**小贴士**：')) {
      notes = line.split(/[:：]/)[1].trim();
      // 可能小贴士在下一行或多行
      if (!notes && i + 1 < lines.length) {
        const notesLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].startsWith('##') || lines[j].startsWith('**')) break;
          if (lines[j].startsWith('-') || /^\d+\./.test(lines[j])) break;
          notesLines.push(lines[j]);
        }
        notes = notesLines.join('\n');
      }
      continue;
    }
    
    // 章节标题
    if (line.startsWith('### 食材')) {
      currentSection = 'ingredients';
      continue;
    }
    
    if (line.startsWith('### 步骤')) {
      currentSection = 'steps';
      continue;
    }
    
    // 解析食材
    if (currentSection === 'ingredients' && line.startsWith('-')) {
      const ingredient = parseIngredient(line.substring(1).trim());
      if (ingredient) {
        ingredients.push(ingredient);
      }
      continue;
    }
    
    // 解析步骤
    if (currentSection === 'steps' && /^\d+\./.test(line)) {
      const step = parseStep(line);
      if (step) {
        steps.push(step);
      }
      continue;
    }
  }
  
  // 验证必填字段
  if (!name || !category || ingredients.length === 0 || steps.length === 0) {
    return null;
  }
  
  return {
    name,
    category,
    difficulty,
    prepTime,
    cookTime,
    servings,
    tags,
    description,
    ingredients,
    steps,
    notes,
  };
}

function parseIngredient(text: string): ParsedIngredient | null {
  // 格式: 食材名称 数量 (重量) [可选]
  const optional = text.includes('[可选]') || text.includes('[optional]');
  text = text.replace(/\[可选\]|\[optional\]/gi, '').trim();
  
  // 移除括号内容（重量信息）
  text = text.replace(/\([^)]*\)/g, '').trim();
  
  // 分割食材名称和数量
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    return null;
  }
  
  const name = parts[0];
  const amountWithUnit = parts.slice(1).join('');
  
  // 解析数量和单位
  const match = amountWithUnit.match(/^([\d.]+)(.*)$/);
  if (!match) {
    return { name, amount: amountWithUnit, unit: '', optional };
  }
  
  const amount = match[1];
  const unit = match[2] || '个';
  
  return { name, amount, unit, optional };
}

function parseStep(text: string): ParsedStep | null {
  // 格式: 1. 步骤描述 (时长) [计时]
  // 移除序号
  text = text.replace(/^\d+\.\s*/, '');
  
  const isTimerEnabled = text.includes('[计时]') || text.includes('[timer]');
  text = text.replace(/\[计时\]|\[timer\]/gi, '').trim();
  
  // 提取时长
  let duration: number | undefined;
  const timeMatch = text.match(/\((\d+)\s*分钟\)/);
  if (timeMatch) {
    duration = parseInt(timeMatch[1]);
    text = text.replace(/\(\d+\s*分钟\)/, '').trim();
  }
  
  if (!text) {
    return null;
  }
  
  return {
    description: text,
    duration,
    isTimerEnabled,
  };
}

function parseTime(timeStr: string): number | undefined {
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}
