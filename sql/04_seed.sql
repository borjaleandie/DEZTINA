-- =========================================================
-- DESTINA — Seed Data (optional, safe to skip)
-- Run AFTER 01–03. Gives you categories + sample destinations
-- so the UI isn't empty on first run.
-- =========================================================

insert into public.categories (name, description) values
  ('Beach',       'Coastlines, islands, and seaside escapes'),
  ('Mountain',    'Peaks, ridgelines, and highland trails'),
  ('Waterfall',   'Cascades and freshwater swimming spots'),
  ('Historical',  'Heritage sites and landmarks'),
  ('Cultural',    'Museums, festivals, and living traditions'),
  ('Adventure',   'Outdoor activities and adrenaline spots'),
  ('Nature',      'Parks, reserves, and wildlife'),
  ('Food',        'Culinary destinations and food trails'),
  ('Family',      'Family-friendly attractions'),
  ('Relaxation',  'Spas, resorts, and slow travel')
on conflict (name) do nothing;

-- Sample destinations (Philippines-focused, swap for your own data)
insert into public.destinations
  (name, description, location, address, category_id, image_url, latitude, longitude, contact, opening_hours, entrance_fee, website, status, popularity)
select
  'Kawasan Falls',
  'A three-tiered turquoise waterfall known for canyoneering and swimming.',
  'Badian, Cebu, Philippines',
  'Barangay Matutinao, Badian, Cebu',
  (select id from public.categories where name = 'Waterfall'),
  null,
  9.8167, 123.3833,
  '+63 917 000 0000',
  '6:00 AM – 5:00 PM',
  '₱50 entrance fee',
  null,
  'published',
  42
where not exists (select 1 from public.destinations where name = 'Kawasan Falls');

insert into public.destinations
  (name, description, location, address, category_id, image_url, latitude, longitude, contact, opening_hours, entrance_fee, website, status, popularity)
select
  'Chocolate Hills',
  'Over a thousand cone-shaped hills that turn brown in the dry season.',
  'Bohol, Philippines',
  'Carmen, Bohol',
  (select id from public.categories where name = 'Nature'),
  null,
  9.8273, 124.1631,
  null,
  '7:00 AM – 6:00 PM',
  '₱60 entrance fee',
  null,
  'published',
  55
where not exists (select 1 from public.destinations where name = 'Chocolate Hills');

insert into public.destinations
  (name, description, location, address, category_id, image_url, latitude, longitude, contact, opening_hours, entrance_fee, website, status, popularity)
select
  'Intramuros',
  'The historic walled city of Manila, home to Fort Santiago and San Agustin Church.',
  'Manila, Philippines',
  'Intramuros, Manila',
  (select id from public.categories where name = 'Historical'),
  null,
  14.5895, 120.9750,
  null,
  '8:00 AM – 7:00 PM',
  'Free (fees apply per attraction)',
  null,
  'published',
  70
where not exists (select 1 from public.destinations where name = 'Intramuros');

-- To make yourself an admin after signing up through the app, run:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
