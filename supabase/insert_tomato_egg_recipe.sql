-- ==========================================
-- 插入番茄炒鸡蛋菜谱数据
-- ==========================================

-- 1. 插入分类（家常菜）
INSERT INTO kc_categories (id, name)
VALUES (uuid_generate_v4(), '家常菜')
ON CONFLICT DO NOTHING;

-- 获取分类ID
DO $$
DECLARE
  v_category_id UUID;
  v_recipe_id UUID;
  v_tomato_id UUID;
  v_egg_id UUID;
  v_onion_id UUID;
  v_oil_id UUID;
  v_salt_id UUID;
  v_sugar_id UUID;
BEGIN
  -- 获取分类ID
  SELECT id INTO v_category_id FROM kc_categories WHERE name = '家常菜';

  -- 2. 插入菜谱基本信息
  v_recipe_id := uuid_generate_v4();
  INSERT INTO kc_recipes (
    id,
    name,
    category_id,
    difficulty,
    description,
    notes,
    tags,
    prep_time,
    cook_time,
    servings
  )
  VALUES (
    v_recipe_id,
    '番茄炒鸡蛋',
    v_category_id,
    1, -- 难度：简单
    '一道经典的家常菜，酸甜可口，营养丰富。番茄的酸甜与鸡蛋的嫩滑完美结合，老少皆宜。',
    '小贴士：加少许糖可以中和番茄的酸味；鸡蛋要大火快炒，保持嫩滑。',
    ARRAY['家常菜', '快手菜', '下饭', '营养'],
    10, -- 准备时间：10分钟
    8,  -- 烹饪时间：8分钟
    2   -- 2人份
  )
  ON CONFLICT DO NOTHING;

  -- 3. 插入食材（如果不存在）
  -- 番茄
  SELECT id INTO v_tomato_id FROM kc_ingredients WHERE name = '番茄';
  IF v_tomato_id IS NULL THEN
    v_tomato_id := uuid_generate_v4();
    INSERT INTO kc_ingredients (id, name, type, unit, quantity, threshold, storage)
    VALUES (v_tomato_id, '番茄', 'main', '个', 3, 3, 'refrigerated');
  END IF;

  -- 鸡蛋
  SELECT id INTO v_egg_id FROM kc_ingredients WHERE name = '鸡蛋';
  IF v_egg_id IS NULL THEN
    v_egg_id := uuid_generate_v4();
    INSERT INTO kc_ingredients (id, name, type, unit, quantity, threshold, storage)
    VALUES (v_egg_id, '鸡蛋', 'main', '个', 10, 6, 'refrigerated');
  END IF;

  -- 葱
  SELECT id INTO v_onion_id FROM kc_ingredients WHERE name = '葱';
  IF v_onion_id IS NULL THEN
    v_onion_id := uuid_generate_v4();
    INSERT INTO kc_ingredients (id, name, type, unit, quantity, threshold, storage)
    VALUES (v_onion_id, '葱', 'side', '根', 2, 5, 'refrigerated');
  END IF;

  -- 食用油
  SELECT id INTO v_oil_id FROM kc_ingredients WHERE name = '食用油';
  IF v_oil_id IS NULL THEN
    v_oil_id := uuid_generate_v4();
    INSERT INTO kc_ingredients (id, name, type, unit, quantity, threshold, storage)
    VALUES (v_oil_id, '食用油', 'seasoning', '克', 500, 100, 'room');
  END IF;

  -- 盐
  SELECT id INTO v_salt_id FROM kc_ingredients WHERE name = '盐';
  IF v_salt_id IS NULL THEN
    v_salt_id := uuid_generate_v4();
    INSERT INTO kc_ingredients (id, name, type, unit, quantity, threshold, storage)
    VALUES (v_salt_id, '盐', 'seasoning', '克', 200, 50, 'room');
  END IF;

  -- 糖
  SELECT id INTO v_sugar_id FROM kc_ingredients WHERE name = '糖';
  IF v_sugar_id IS NULL THEN
    v_sugar_id := uuid_generate_v4();
    INSERT INTO kc_ingredients (id, name, type, unit, quantity, threshold, storage)
    VALUES (v_sugar_id, '糖', 'seasoning', '克', 300, 100, 'room');
  END IF;

  -- 4. 插入菜谱-食材关联
  INSERT INTO kc_recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional)
  VALUES
    (v_recipe_id, v_tomato_id, 3, '个', FALSE),
    (v_recipe_id, v_egg_id, 3, '个', FALSE),
    (v_recipe_id, v_onion_id, 2, '根', TRUE),
    (v_recipe_id, v_oil_id, 30, '克', FALSE),
    (v_recipe_id, v_salt_id, 3, '克', FALSE),
    (v_recipe_id, v_sugar_id, 5, '克', TRUE)
  ON CONFLICT DO NOTHING;

  -- 5. 插入制作步骤
  INSERT INTO kc_recipe_steps (recipe_id, step_number, description, timer)
  VALUES
    (v_recipe_id, 1, '番茄洗净，切成小块；葱切成葱花；鸡蛋打入碗中，加少许盐搅拌均匀。', NULL),
    (v_recipe_id, 2, '热锅倒油，油温六成热时倒入蛋液，快速滑炒至蛋液凝固成块，盛起备用。', 30),
    (v_recipe_id, 3, '锅中再加少许油，放入番茄块中火翻炒，炒至番茄出汁变软。', 60),
    (v_recipe_id, 4, '加入炒好的鸡蛋，放入盐和少许糖（可选），翻炒均匀。', 30),
    (v_recipe_id, 5, '最后撒上葱花，关火出锅即可。', NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- 查询验证
SELECT
  r.name AS 菜名,
  c.name AS 分类,
  r.difficulty AS 难度,
  r.prep_time AS 准备时间分钟,
  r.cook_time AS 烹饪时间分钟,
  r.servings AS 份数,
  r.description AS 简介
FROM kc_recipes r
LEFT JOIN kc_categories c ON r.category_id = c.id
WHERE r.name = '番茄炒鸡蛋';
