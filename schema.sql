-- 神船飛鏢計分 App 數據庫結構
-- 喺 Render PostgreSQL 執行一次即可

-- 遊戲紀錄表
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    player1_name TEXT,
    player2_name TEXT,
    winner_id INTEGER,
    total_drinks1 INTEGER DEFAULT 0,
    total_drinks2 INTEGER DEFAULT 0,
    total_ships1 INTEGER DEFAULT 0,
    total_ships2 INTEGER DEFAULT 0,
    total_beds INTEGER DEFAULT 0,
    total_small_beds INTEGER DEFAULT 0,
    dimsum1 NUMERIC DEFAULT 0,
    dimsum2 NUMERIC DEFAULT 0,
    no_ship_bonus1 INTEGER DEFAULT 0,
    no_ship_bonus2 INTEGER DEFAULT 0,
    declined_drinks1 INTEGER DEFAULT 0,
    declined_drinks2 INTEGER DEFAULT 0,
    shrimp_earned NUMERIC DEFAULT 0,
    beef_earned NUMERIC DEFAULT 0,
    final_score1 INTEGER DEFAULT 0,
    final_score2 INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    lowest_pre_down_score INTEGER DEFAULT 0,
    max_drinks_in_round INTEGER DEFAULT 0,
    use_bb BOOLEAN DEFAULT FALSE,
    is_overseas BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 每一回詳細紀錄
CREATE TABLE IF NOT EXISTS turns (
    id SERIAL PRIMARY KEY,
    game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER,
    darts JSONB,
    score_before INTEGER,
    score_after INTEGER,
    drinks INTEGER DEFAULT 0,
    ships INTEGER DEFAULT 0,
    beds INTEGER DEFAULT 0,
    small_beds INTEGER DEFAULT 0,
    dim_sum NUMERIC DEFAULT 0,
    opponent_drinks INTEGER DEFAULT 0,
    special_messages JSONB,
    is_down_mountain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 玩家設定
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    player1_name TEXT DEFAULT '船員一',
    player2_name TEXT DEFAULT '船員二',
    player1_photo TEXT,
    player2_photo TEXT,
    use_bb_variant BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設設定
INSERT INTO app_settings (id, player1_name, player2_name, use_bb_variant)
VALUES (1, '船員一', '船員二', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 設備同步紀錄（簡單版，用 device_id 識別）
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    device_id TEXT,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
