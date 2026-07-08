-- Enable RLS
alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Profiles: Users can read their own profile.
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- Documents: Authenticated users can read.
create policy "Authenticated users can read documents"
  on documents for select
  to authenticated
  using ( true );

create policy "Admins can insert documents"
  on documents for insert
  to authenticated
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can update documents"
  on documents for update
  to authenticated
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can delete documents"
  on documents for delete
  to authenticated
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Document Chunks: Read-only for authenticated, admins manage.
create policy "Authenticated users can read chunks"
  on document_chunks for select
  to authenticated
  using ( true );

create policy "Admins can insert chunks"
  on document_chunks for insert
  to authenticated
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can delete chunks"
  on document_chunks for delete
  to authenticated
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Conversations: Users can manage their own.
create policy "Users can manage their conversations"
  on conversations for all
  to authenticated
  using ( auth.uid() = user_id );

-- Messages: Users can manage messages in their conversations.
create policy "Users can manage messages in their conversations"
  on messages for all
  to authenticated
  using ( exists (select 1 from conversations where id = messages.conversation_id and user_id = auth.uid()) );
