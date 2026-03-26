-- Create the static cards reference table
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'property', 'action', 'money', 'rent', 'wildcard'
  value INTEGER NOT NULL,
  main_color TEXT, -- 'red', 'blue', 'green', 'utility', 'railroad', etc.
  secondary_color TEXT, 
  is_wildcard BOOLEAN DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 1, -- How many of this card are in a 110-card deck
  description TEXT
);

-- Indexing for performance
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_cards_main_color ON cards(main_color);
