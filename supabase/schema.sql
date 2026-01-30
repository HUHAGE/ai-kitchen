-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. Categories Table (分类表)
-- ===========================================
CREATE TABLE kc_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. Ingredients Table (食材表)
-- ===========================================
CREATE TABLE kc_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'main', -- main(主料)/side(辅料)/seasoning(调料)/fresh(生鲜)/dry(干货)
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  threshold DECIMAL(10, 2) NOT NULL DEFAULT 10, -- 预警阈值
  storage VARCHAR(20) NOT NULL DEFAULT 'refrigerated', -- refrigerated(冷藏)/frozen(冷冻)/room(常温)
  expiry_date TIMESTAMP WITH TIME ZONE,
  production_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_kc_ingredients_name ON kc_ingredients(name);
CREATE INDEX idx_kc_ingredients_type ON kc_ingredients(type);
CREATE INDEX idx_kc_ingredients_expiry_date ON kc_ingredients(expiry_date);
CREATE INDEX idx_kc_ingredients_low_stock ON kc_ingredients(quantity, threshold);

-- ===========================================
-- 3. Recipes Table (菜谱表)
-- ===========================================
CREATE TABLE kc_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES kc_categories(id) ON DELETE SET NULL,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  description TEXT,
  notes TEXT,
  image TEXT, -- URL or DataURL
  tags TEXT[], -- 标签数组
  prep_time INTEGER, -- 准备时间（分钟）
  cook_time INTEGER, -- 烹饪时间（分钟）
  servings INTEGER DEFAULT 1, -- 份数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kc_recipes_name ON kc_recipes(name);
CREATE INDEX idx_kc_recipes_category ON kc_recipes(category_id);
CREATE INDEX idx_kc_recipes_difficulty ON kc_recipes(difficulty);
CREATE INDEX idx_kc_recipes_tags ON kc_recipes USING GIN(tags);

-- ===========================================
-- 4. Recipe Ingredients Table (菜谱-食材关联表)
-- ===========================================
CREATE TABLE kc_recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES kc_recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES kc_ingredients(id) ON DELETE SET NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint to prevent duplicate ingredients in a recipe
CREATE UNIQUE INDEX idx_kc_recipe_ingredients_unique ON kc_recipe_ingredients(recipe_id, ingredient_id);

-- Indexes
CREATE INDEX idx_kc_recipe_ingredients_recipe ON kc_recipe_ingredients(recipe_id);
CREATE INDEX idx_kc_recipe_ingredients_ingredient ON kc_recipe_ingredients(ingredient_id);

-- ===========================================
-- 5. Recipe Steps Table (菜谱步骤表)
-- ===========================================
CREATE TABLE kc_recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES kc_recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  timer INTEGER, -- 步骤计时器（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint for step numbers
CREATE UNIQUE INDEX idx_kc_recipe_steps_unique ON kc_recipe_steps(recipe_id, step_number);

-- Index
CREATE INDEX idx_kc_recipe_steps_recipe ON kc_recipe_steps(recipe_id);

-- ===========================================
-- 6. Meal Plans Table (每日计划表)
-- ===========================================
CREATE TABLE kc_meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES kc_recipes(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kc_meal_plans_date ON kc_meal_plans(plan_date);
CREATE INDEX idx_kc_meal_plans_recipe ON kc_meal_plans(recipe_id);

-- ===========================================
-- 7. Ingredient Substitutes Table (食材替代品关联表)
-- ===========================================
CREATE TABLE kc_ingredient_substitutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID REFERENCES kc_ingredients(id) ON DELETE CASCADE,
  substitute_id UUID REFERENCES kc_ingredients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent self-substitution and duplicate pairs
CREATE UNIQUE INDEX idx_kc_ingredient_substitutes_unique ON kc_ingredient_substitutes(LEAST(ingredient_id, substitute_id), GREATEST(ingredient_id, substitute_id));

-- Ensure ingredient_id != substitute_id
ALTER TABLE kc_ingredient_substitutes ADD CONSTRAINT check_not_same CHECK (ingredient_id <> substitute_id);

-- Indexes
CREATE INDEX idx_kc_ingredient_substitutes_ingredient ON kc_ingredient_substitutes(ingredient_id);
CREATE INDEX idx_kc_ingredient_substitutes_substitute ON kc_ingredient_substitutes(substitute_id);

-- ===========================================
-- Triggers for updated_at timestamp
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_kc_categories_updated_at BEFORE UPDATE ON kc_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kc_ingredients_updated_at BEFORE UPDATE ON kc_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kc_recipes_updated_at BEFORE UPDATE ON kc_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kc_meal_plans_updated_at BEFORE UPDATE ON kc_meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security (RLS) Policies
-- ===========================================
ALTER TABLE kc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kc_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kc_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kc_recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kc_recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE kc_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE kc_ingredient_substitutes ENABLE ROW LEVEL SECURITY;

-- Public read/write access for development (adjust as needed)
CREATE POLICY "Public access to kc_categories" ON kc_categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to kc_ingredients" ON kc_ingredients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to kc_recipes" ON kc_recipes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to kc_recipe_ingredients" ON kc_recipe_ingredients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to kc_recipe_steps" ON kc_recipe_steps
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to kc_meal_plans" ON kc_meal_plans
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to kc_ingredient_substitutes" ON kc_ingredient_substitutes
  FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- Useful Views
-- ===========================================

-- View for low stock ingredients
CREATE VIEW v_kc_low_stock_ingredients AS
SELECT
  id,
  name,
  type,
  unit,
  quantity,
  threshold,
  storage,
  expiry_date,
  quantity <= threshold AS is_low_stock
FROM kc_ingredients
WHERE quantity <= threshold;

-- View for expiring ingredients (within 3 days)
CREATE VIEW v_kc_expiring_ingredients AS
SELECT
  id,
  name,
  type,
  unit,
  quantity,
  expiry_date,
  expiry_date - CURRENT_DATE AS days_until_expiry
FROM kc_ingredients
WHERE expiry_date IS NOT NULL
  AND expiry_date <= CURRENT_DATE + INTERVAL '3 days'
  AND expiry_date >= CURRENT_DATE;

-- View for recipe with all details
CREATE VIEW v_kc_recipe_details AS
SELECT
  r.id,
  r.name,
  r.category_id,
  c.name AS category_name,
  r.difficulty,
  r.description,
  r.notes,
  r.image,
  r.tags,
  r.prep_time,
  r.cook_time,
  r.servings,
  COUNT(DISTINCT ri.id) AS ingredient_count,
  COUNT(DISTINCT rs.id) AS step_count
FROM kc_recipes r
LEFT JOIN kc_categories c ON r.category_id = c.id
LEFT JOIN kc_recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN kc_recipe_steps rs ON r.id = rs.recipe_id
GROUP BY r.id, c.name;
