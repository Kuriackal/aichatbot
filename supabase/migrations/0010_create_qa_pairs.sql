-- Create qa_pairs table
create table public.qa_pairs (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null,
  embedding vector(1536),
  uploader_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.qa_pairs enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
on public.qa_pairs for select
to authenticated
using (true);

create policy "Enable insert for admins"
on public.qa_pairs for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Enable update for admins"
on public.qa_pairs for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Enable delete for admins"
on public.qa_pairs for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Create RPC function for matching
create or replace function match_qa_pairs (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  question text,
  answer text,
  similarity float
)
language sql stable
as $$
  select
    qa_pairs.id,
    qa_pairs.question,
    qa_pairs.answer,
    1 - (qa_pairs.embedding <=> query_embedding) as similarity
  from qa_pairs
  where 1 - (qa_pairs.embedding <=> query_embedding) > match_threshold
  order by qa_pairs.embedding <=> query_embedding
  limit match_count;
$$;
