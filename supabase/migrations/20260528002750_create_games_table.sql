CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  turn_count INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 5,
  is_private BOOLEAN DEFAULT FALSE,
  invite_code TEXT UNIQUE -- Optional: For joining via a code like "AX72"
);

-- Enable Realtime for game status updates (e.g., game starts!)
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "Allow public read access on games" ON games FOR SELECT USING (true);

-- Create a policy to allow public insert access
CREATE POLICY "Allow public insert access on games" ON games FOR INSERT WITH CHECK (true);
