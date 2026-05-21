CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  turn_order INTEGER, -- 0, 1, 2, 3
  is_host BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can't be in the same game twice
  UNIQUE(game_id, user_id)
);

-- Now that players exist, we can add a reference back to 'games' 
-- to track whose turn it is specifically.
ALTER TABLE games ADD COLUMN current_turn_player_id UUID REFERENCES players(id);

-- Enable Realtime for player list updates (e.g., someone joins/leaves)
ALTER PUBLICATION supabase_realtime ADD TABLE players;