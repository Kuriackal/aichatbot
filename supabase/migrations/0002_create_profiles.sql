create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text check (role in ('admin', 'employee')) default 'employee',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- trigger to create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'employee');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
