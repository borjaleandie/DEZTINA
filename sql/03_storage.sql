-- =========================================================
-- DESTINA — Storage Buckets & Policies
-- Run AFTER 01_schema.sql and 02_rls_policies.sql
-- =========================================================

-- Create buckets (public read, so images can be shown without a signed URL)
insert into storage.buckets (id, name, public)
values ('destination-images', 'destination-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- destination-images: anyone can view, only admins can write
-- ---------------------------------------------------------
drop policy if exists "destination_images_public_read" on storage.objects;
create policy "destination_images_public_read"
on storage.objects for select
using (bucket_id = 'destination-images');

drop policy if exists "destination_images_admin_insert" on storage.objects;
create policy "destination_images_admin_insert"
on storage.objects for insert
with check (bucket_id = 'destination-images' and public.is_admin());

drop policy if exists "destination_images_admin_update" on storage.objects;
create policy "destination_images_admin_update"
on storage.objects for update
using (bucket_id = 'destination-images' and public.is_admin());

drop policy if exists "destination_images_admin_delete" on storage.objects;
create policy "destination_images_admin_delete"
on storage.objects for delete
using (bucket_id = 'destination-images' and public.is_admin());

-- ---------------------------------------------------------
-- profile-images: anyone can view, users manage their own folder (folder name = user id)
-- ---------------------------------------------------------
drop policy if exists "profile_images_public_read" on storage.objects;
create policy "profile_images_public_read"
on storage.objects for select
using (bucket_id = 'profile-images');

drop policy if exists "profile_images_owner_insert" on storage.objects;
create policy "profile_images_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_images_owner_update" on storage.objects;
create policy "profile_images_owner_update"
on storage.objects for update
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_images_owner_delete" on storage.objects;
create policy "profile_images_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
