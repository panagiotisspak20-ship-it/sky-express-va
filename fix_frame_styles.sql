-- Update Gold Frame to be square (rounded) and richer gold
UPDATE public.shop_items
SET css_class = 'border-4 border-amber-400 rounded-xl shadow-lg'
WHERE name = 'Gold Frame';

-- Update Neon Frame to be square (rounded) as well
UPDATE public.shop_items
SET css_class = 'border-2 border-cyan-400 rounded-xl shadow-[0_0_10px_cyan]'
WHERE name = 'Neon Frame';
