create table documents (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  file_path text not null,
  status text check (status in ('processing', 'ready', 'failed')) default 'processing',
  chunk_count integer default 0,
  uploader_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
