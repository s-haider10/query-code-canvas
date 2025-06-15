
-- Table for chat sessions (per dataset, user, supports multiple parallel chats per file)
create table if not exists public.dataset_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dataset_id text not null,
  created_at timestamptz not null default now(),
  title text default null
);

alter table public.dataset_chats enable row level security;
create policy "Only owner can select chats" on public.dataset_chats for select using (auth.uid() = user_id);
create policy "Only owner can insert chats" on public.dataset_chats for insert with check (auth.uid() = user_id);
create policy "Only owner can update their own chats" on public.dataset_chats for update using (auth.uid() = user_id);
create policy "Only owner can delete their own chats" on public.dataset_chats for delete using (auth.uid() = user_id);

-- Table for messages in each chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.dataset_chats(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
create policy "Only participants can select messages" on public.chat_messages for select using (
  auth.uid() = user_id
);
create policy "Only participants can insert messages" on public.chat_messages for insert with check (
  auth.uid() = user_id
);
create policy "Only participants can update messages" on public.chat_messages for update using (
  auth.uid() = user_id
);
create policy "Only participants can delete messages" on public.chat_messages for delete using (
  auth.uid() = user_id
);

-- (Optional improvement) Add a jsonb metadata column to datasets for profiling and stats, if not present.
alter table public.datasets
  add column if not exists metadata jsonb;
