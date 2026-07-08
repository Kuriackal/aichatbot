create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
