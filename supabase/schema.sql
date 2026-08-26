-- ============================================================
-- FAMILY ARCHIVE — Database Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- ------------------------------------------------------------
-- 1. FAMILIES
-- A "family" is the container that owns everything below.
-- This lets you (later) add other members as collaborators
-- instead of everything being single-user forever.
-- ------------------------------------------------------------
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz not null default now()
);

create table if not exists family_members (
  family_id uuid references families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  primary key (family_id, user_id)
);

-- ------------------------------------------------------------
-- 2. PEOPLE
-- Every person in the tree, regardless of generation.
-- ------------------------------------------------------------
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  first_name text not null,
  last_name text,
  maiden_name text,
  birth_date date,
  death_date date,
  notes text,
  photo_url text, -- primary/profile photo, stored in Storage
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. RELATIONSHIPS
-- Genealogy is a graph, not a tree with fixed levels. Modeling
-- it as directed edges between two people lets you represent
-- parent/child, spouse, and (later) adoptive/step relationships
-- without redesigning the schema.
-- ------------------------------------------------------------
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  person_a_id uuid references people(id) on delete cascade not null,
  person_b_id uuid references people(id) on delete cascade not null,
  relationship_type text not null check (
    relationship_type in ('parent_child', 'spouse', 'divorced_spouse', 'sibling')
  ),
  -- for parent_child: person_a is the PARENT, person_b is the CHILD
  -- for spouse/divorced_spouse: order doesn't matter
  marriage_date date,
  divorce_date date,
  created_at timestamptz not null default now(),
  constraint no_self_relationship check (person_a_id <> person_b_id)
);

create index if not exists idx_relationships_person_a on relationships(person_a_id);
create index if not exists idx_relationships_person_b on relationships(person_b_id);

-- ------------------------------------------------------------
-- 4. DOCUMENTS
-- Metadata for uploaded files. The actual file bytes live in
-- Supabase Storage (private bucket); this table just points to
-- them and records what kind of document it is.
-- ------------------------------------------------------------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  person_id uuid references people(id) on delete cascade not null,
  document_type text not null check (
    document_type in (
      'birth_certificate',
      'marriage_license',
      'medical_history',
      'genealogy_record',
      'photo',
      'other'
    )
  ),
  storage_path text not null, -- path inside the private 'documents' bucket
  file_name text not null,
  uploaded_by uuid references auth.users(id) not null,
  uploaded_at timestamptz not null default now(),
  description text
);

create index if not exists idx_documents_person on documents(person_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table is only readable/writable by members of the
-- family that owns the row. This is what makes "secure" true
-- at the database level, not just in the app's UI.
-- ============================================================

alter table families enable row level security;
alter table family_members enable row level security;
alter table people enable row level security;
alter table relationships enable row level security;
alter table documents enable row level security;

-- Helper: is the current user a member of this family?
create or replace function is_family_member(fid uuid)
returns boolean as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- FAMILIES: members can see their families; creator can insert
create policy "select own families" on families
  for select using (is_family_member(id));
create policy "insert families" on families
  for insert with check (created_by = auth.uid());

-- FAMILY_MEMBERS: members can see other members of their family
create policy "select family members" on family_members
  for select using (is_family_member(family_id));
create policy "owners manage members" on family_members
  for all using (
    exists (
      select 1 from family_members fm
      where fm.family_id = family_members.family_id
      and fm.user_id = auth.uid() and fm.role = 'owner'
    )
  );

-- PEOPLE
create policy "select people in my families" on people
  for select using (is_family_member(family_id));
create policy "insert people in my families" on people
  for insert with check (is_family_member(family_id));
create policy "update people in my families" on people
  for update using (is_family_member(family_id));
create policy "delete people in my families" on people
  for delete using (is_family_member(family_id));

-- RELATIONSHIPS
create policy "select relationships in my families" on relationships
  for select using (is_family_member(family_id));
create policy "insert relationships in my families" on relationships
  for insert with check (is_family_member(family_id));
create policy "update relationships in my families" on relationships
  for update using (is_family_member(family_id));
create policy "delete relationships in my families" on relationships
  for delete using (is_family_member(family_id));

-- DOCUMENTS
create policy "select documents in my families" on documents
  for select using (is_family_member(family_id));
create policy "insert documents in my families" on documents
  for insert with check (is_family_member(family_id));
create policy "update documents in my families" on documents
  for update using (is_family_member(family_id));
create policy "delete documents in my families" on documents
  for delete using (is_family_member(family_id));

-- ============================================================
-- STORAGE BUCKET
-- Create a PRIVATE bucket for documents. Nothing in here is
-- ever publicly readable — access only via short-lived signed
-- URLs generated server-side after an RLS check passes.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage path convention: {family_id}/{person_id}/{document_id}-{filename}
-- This policy lets a user read/write objects only under a family_id
-- folder they belong to.
create policy "family members read own documents"
on storage.objects for select
using (
  bucket_id = 'documents'
  and is_family_member((storage.foldername(name))[1]::uuid)
);

create policy "family members upload own documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and is_family_member((storage.foldername(name))[1]::uuid)
);

create policy "family members delete own documents"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and is_family_member((storage.foldername(name))[1]::uuid)
);
