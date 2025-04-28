CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  card1 VARCHAR(5),
  card2 VARCHAR(5),
  hand VARCHAR(50),
  username VARCHAR(30) UNIQUE NOT NULL,
  firstname VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE game (
  id SERIAL PRIMARY KEY,
  lobby_code VARCHAR(10) UNIQUE NOT NULL,
  table_card1 VARCHAR(5),
  table_card2 VARCHAR(5),
  table_card3 VARCHAR(5),
  table_card4 VARCHAR(5),
  table_card5 VARCHAR(5),
  user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL -- Host of the game
);

CREATE TABLE game_players (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES game(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
  chips INTEGER DEFAULT 1000,
  seat_number INTEGER,
  has_folded BOOLEAN DEFAULT FALSE
);