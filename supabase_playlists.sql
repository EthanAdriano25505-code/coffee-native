-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  cover_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Policies for playlists
CREATE POLICY "Users can view their own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Create playlist_songs table (junction table)
CREATE TABLE IF NOT EXISTS public.playlist_songs (
  playlist_id uuid REFERENCES public.playlists ON DELETE CASCADE NOT NULL,
  song_id bigint REFERENCES public.songs ON DELETE CASCADE NOT NULL, -- Assuming song_id is bigint based on typical setups, or we can check.
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (playlist_id, song_id)
);

-- Enable RLS for playlist_songs
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

-- Policies for playlist_songs
-- Users can view songs in their playlists
CREATE POLICY "Users can view songs in their playlists" ON public.playlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can add songs to their playlists
CREATE POLICY "Users can add songs to their playlists" ON public.playlist_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can remove songs from their playlists
CREATE POLICY "Users can remove songs from their playlists" ON public.playlist_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );
