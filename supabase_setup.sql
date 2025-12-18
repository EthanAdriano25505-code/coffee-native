-- Run this in your Supabase SQL Editor to set up the Profiles table
-- Idempotent setup for public.profiles, RLS policies, trigger, and optional storage policies.
-- Safe to run multiple times; it will only create missing objects.

-- 1) Create profiles table if missing
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at timestamptz,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2) Enable Row Level Security (safe if already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Create RLS policies only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'public_profiles_view'
  ) THEN
    EXECUTE $$
      CREATE POLICY public_profiles_view
        ON public.profiles
        FOR SELECT
        USING ( true );
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_own'
  ) THEN
    EXECUTE $$
      CREATE POLICY profiles_insert_own
        ON public.profiles
        FOR INSERT
        WITH CHECK ( auth.uid() = id );
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    EXECUTE $$
      CREATE POLICY profiles_update_own
        ON public.profiles
        FOR UPDATE
        USING ( auth.uid() = id );
    $$;
  END IF;
END$$;

-- 4) Trigger function to create profile row for new auth.users (replace safe)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Create trigger if missing (on auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_auth_user_created' AND n.nspname = 'auth'
  ) THEN
    EXECUTE $$
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    $$;
  END IF;
END$$;

-- 6) Optional: Storage policies for avatars bucket (create bucket in UI first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_objects_select_avatars'
    ) THEN
      EXECUTE $$
        CREATE POLICY storage_objects_select_avatars
          ON storage.objects
          FOR SELECT
          USING ( bucket_id = 'avatars' );
      $$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_objects_insert_avatars'
    ) THEN
      EXECUTE $$
        CREATE POLICY storage_objects_insert_avatars
          ON storage.objects
          FOR INSERT
          WITH CHECK ( bucket_id = 'avatars' );
      $$;
    END IF;
  END IF;
END$$;

-- 7) Backfill existing auth.users into profiles if missing
INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
SELECT u.id,
       u.raw_user_meta_data->>'full_name',
       u.raw_user_meta_data->>'avatar_url',
       NOW()
FROM auth.users u
WHERE u.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Done. Run the following to verify:
-- SELECT id, full_name, avatar_url, updated_at FROM public.profiles ORDER BY updated_at DESC LIMIT 10;
