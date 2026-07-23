-- Seed data for local Supabase development.

insert into public.posts (slug, title, excerpt, content, author, published, published_at, cover_image, tags)
values
  (
    'introducing-ecs-network',
    'Introducing ECS Network',
    'One studio, four divisions. A look at how 2EASY, Easy2See, Easy Supply and North Star fit together.',
    'ECS Network is a creative holding company operating across apparel, media, retail and ventures. This is our starting line.',
    'ECS Editorial',
    true,
    '2026-06-01T12:00:00Z',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=60',
    array['company', 'launch']
  ),
  (
    'easy-supply-co-fw26',
    'Easy Supply Co — FW26 Preview',
    'Heavyweight basics, muted palettes, and a tighter edit. A first look at the fall/winter drop.',
    'The FW26 range leans into tonal layering and elevated staples built for everyday rotation.',
    'Design Team',
    true,
    '2026-06-18T12:00:00Z',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=60',
    array['easy-supply', 'drops']
  )
on conflict (slug) do nothing;

insert into public.orders (id, customer_email, total, currency, status, created_at)
values
  ('ESC-1042', 'ava@example.com', 175.00, 'USD', 'fulfilled', '2026-07-12T14:05:00Z'),
  ('ESC-1043', 'liam@example.com', 95.00, 'USD', 'processing', '2026-07-18T18:22:00Z')
on conflict (id) do nothing;
