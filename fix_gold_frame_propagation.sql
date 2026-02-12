-- 1. Update the definition of 'Gold Frame' in shop_items to use the new Amber color and Rounded-XL (Squircle) shape
UPDATE public.shop_items
SET css_class = 'border-4 border-amber-400 rounded-xl shadow-lg'
WHERE name = 'Gold Frame';

-- 2. Update the definition of 'Neon Frame' to match the new shape
UPDATE public.shop_items
SET css_class = 'border-2 border-cyan-400 rounded-xl shadow-[0_0_10px_cyan]'
WHERE name = 'Neon Frame';

-- 3. Propagate the change to all users who currently have 'Gold Frame' equipped
-- This ensures that if a user already equipped the item, their profile gets updated with the new CSS
UPDATE public.profiles
SET equipped_frame = (SELECT css_class FROM public.shop_items WHERE name = 'Gold Frame')
WHERE id IN (
  SELECT pilot_id 
  FROM public.inventory 
  JOIN public.shop_items ON public.inventory.item_id = public.shop_items.id
  WHERE public.shop_items.name = 'Gold Frame' 
  AND public.inventory.is_equipped = true
);

-- 4. Propagate the change to all users who currently have 'Neon Frame' equipped
UPDATE public.profiles
SET equipped_frame = (SELECT css_class FROM public.shop_items WHERE name = 'Neon Frame')
WHERE id IN (
  SELECT pilot_id 
  FROM public.inventory 
  JOIN public.shop_items ON public.inventory.item_id = public.shop_items.id
  WHERE public.shop_items.name = 'Neon Frame' 
  AND public.inventory.is_equipped = true
);
