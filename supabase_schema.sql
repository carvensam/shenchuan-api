-- =====================================================
-- 神船飛鏢計分 App - Supabase 數據庫結構
-- 用法：登入 supabase.com → SQL Editor → 貼上 → Run
-- =====================================================

-- 開啟 UUID 擴展（Supabase 已預設開啟，保險起見再執行一次）
extension if not exists "uuid-ossp";

-- =====================================================
-- 遊戲紀錄主表
-- =====================================================
create table if not exists games (
    id text primary key,
    date timestamptz default now(),
    player1_name text default '船員一',
    player2_name text default '船員二',
    winner_id int,
    total_drinks1 int default 0,
    total_drinks2 int default 0,
    total_ships1 int default 0,
    total_ships2 int default 0,
    total_beds int default 0,
    total_small_beds int default 0,
    dimsum1 numeric default 0,
    dimsum2 numeric default 0,
    no_ship_bonus1 int default 0,
    no_ship_bonus2 int default 0,
    declined_drinks1 int default 0,
    declined_drinks2 int default 0,
    shrimp_earned numeric default 0,
    beef_earned numeric default 0,
    final_score1 int default 0,
    final_score2 int default 0,
    highest_score int default 0,
    lowest_pre_down_score int default 0,
    max_drinks_in_round int default 0,
    use_bb boolean default false,
    is_overseas boolean default false,
    created_at timestamptz default now()
);

-- 加索引加速查詢
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date DESC);

-- =====================================================
-- 每一回詳細紀錄
-- =====================================================
create table if not exists turns (
    id serial primary key,
    game_id text references games(id) on delete cascade,
    player_id int,
    darts jsonb,
    score_before int,
    score_after int,
    drinks int default 0,
    ships int default 0,
    beds int default 0,
    small_beds int default 0,
    dim_sum numeric default 0,
    opponent_drinks int default 0,
    special_messages jsonb,
    is_down_mountain boolean default false,
    created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_turns_game_id ON turns(game_id);

-- =====================================================
-- 玩家設定（單機多裝置共用設定）
-- =====================================================
create table if not exists app_settings (
    id int primary key default 1,
    player1_name text default '船員一',
    player2_name text default '船員二',
    player1_photo text,
    player2_photo text,
    use_bb_variant boolean default false,
    updated_at timestamptz default now()
);

-- 插入預設值（如果冇）
INSERT INTO app_settings (id, player1_name, player2_name, use_bb_variant)
VALUES (1, '船員一', '船員二', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 設備同步紀錄
-- =====================================================
create table if not exists sync_log (
    id serial primary key,
    device_id text unique,
    last_sync timestamptz default now()
);

-- =====================================================
-- 啟用 Row Level Security（選項，暫時唔開）
-- =====================================================
-- 如果你想將來加用戶登入，可以開 RLS
-- alter table games enable row level security;

-- =====================================================
-- 測試：插入一筆測試數據（跑完可以刪除）
-- =====================================================
-- INSERT INTO games (id, player1_name, player2_name, winner_id, total_drinks1, total_drinks2)
-- VALUES ('test-001', '船員一', '船員二', 1, 6, 12)
-- ON CONFLICT (id) DO NOTHING;
