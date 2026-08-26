# Family Archive

A private, secure family genealogy catalog. Click any person in the register
to upload their birth certificate, marriage license, medical history,
genealogy records, and photos — all stored in a private cloud bucket that
only your family members can access.

## Stack
- **Next.js 14** (App Router) — frontend + server logic
- **Supabase** — Postgres database, auth, and encrypted private file storage
- Deploy target: **Vercel** (free tier is fine to start)

## 1. Create your Supabase project
1. Go to https://supabase.com, create a free project.
2. In the SQL Editor, paste and run the contents of `supabase/schema.sql`.
   This creates all tables, the security policies, and the private
   `documents` storage bucket in one step.
3. Go to **Project Settings > API** and copy the **Project URL** and
   **anon public key**.

## 2. Configure the app
```bash
cp .env.local.example .env.local
# paste your Supabase URL + anon key into .env.local
```

## 3. Install and run locally
```bash
npm install
npm run dev
```
Visit http://localhost:3000 — you'll land on the sign-up page. Create an
account (this is just your own login; Supabase handles password hashing).

## 4. Try it out
1. Sign up. A "My Family" record is created for you automatically.
2. Click **+ Add person** to add your first family member. When you add a
   second person, you can link them as parent/child or spouse of the first.
3. Click a person's card to open their record page, then upload a document.
   Uploaded files never get a public URL — pages generate a temporary
   signed link (expires in 1 hour) only for people who are members of your
   family in the database.

## 5. Deploy
Push this folder to a GitHub repo, then import it in Vercel. Add the two
environment variables from `.env.local` in the Vercel project settings.
That's it — you now have a live HTTPS URL.

## How security works here
- **Row Level Security (RLS)** in Postgres means even if someone got your
  anon API key, they can only ever read/write rows belonging to a family
  they're a member of — enforced by the database, not app code.
- **Storage bucket is private** (`public: false`). Files are fetched only
  via short-lived signed URLs generated server-side after the same RLS
  check passes.
- **Auth** is handled entirely by Supabase (bcrypt-hashed passwords,
  session cookies refreshed by `middleware.ts`).

## What's deliberately left for you to extend
- Inviting other family members (schema already supports multiple
  `family_members` per family — just needs an invite-by-email flow).
- Editing/deleting a person or relationship (currently add-only from the UI,
  though the DB and RLS policies already allow it).
- A richer tree layout beyond 3 stacked generation rows (e.g. actual
  connecting lines between spouses/parents/children).
- File size/type validation before upload.

## Project structure
```
src/
  app/
    page.tsx              # dashboard: loads family + renders tree
    login/page.tsx         # sign in / sign up
    person/[id]/page.tsx    # a person's record page (upload + view docs)
  components/
    FamilyTree.tsx          # generation layout logic + tree UI
    PersonNode.tsx          # clickable person card
    AddPersonForm.tsx       # add person + relationship modal
    DocumentUploader.tsx    # upload form -> Supabase Storage
    DocumentList.tsx        # lists a person's documents w/ signed URLs
  lib/
    supabase/client.ts      # browser Supabase client
    supabase/server.ts      # server Supabase client
    types.ts                # shared TS types
supabase/
  schema.sql                # run this once in Supabase SQL Editor
```
