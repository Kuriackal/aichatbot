insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Admins can upload to documents"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'documents' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can read documents"
  on storage.objects for select
  to authenticated
  using ( bucket_id = 'documents' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can delete from documents"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'documents' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );
