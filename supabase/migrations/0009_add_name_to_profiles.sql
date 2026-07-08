-- Add full_name column
alter table public.profiles add column full_name text;

-- Update the trigger function to capture full_name from metadata if it exists
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'employee'
  );
  return new;
end;
$$;
