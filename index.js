require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 啟動時自動建立數據庫結構（冇 Render Shell 都可以自我修復）
async function initDb() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      player1_name TEXT, player2_name TEXT, winner_id INTEGER,
      total_drinks1 INTEGER DEFAULT 0, total_drinks2 INTEGER DEFAULT 0,
      total_ships1 INTEGER DEFAULT 0, total_ships2 INTEGER DEFAULT 0,
      total_beds INTEGER DEFAULT 0, total_small_beds INTEGER DEFAULT 0,
      dimsum1 NUMERIC DEFAULT 0, dimsum2 NUMERIC DEFAULT 0,
      no_ship_bonus1 INTEGER DEFAULT 0, no_ship_bonus2 INTEGER DEFAULT 0,
      declined_drinks1 INTEGER DEFAULT 0, declined_drinks2 INTEGER DEFAULT 0,
      shrimp_earned NUMERIC DEFAULT 0, beef_earned NUMERIC DEFAULT 0,
      final_score1 INTEGER DEFAULT 0, final_score2 INTEGER DEFAULT 0,
      highest_score INTEGER DEFAULT 0, lowest_pre_down_score INTEGER DEFAULT 0,
      max_drinks_in_round INTEGER DEFAULT 0,
      use_bb BOOLEAN DEFAULT FALSE, is_overseas BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sync_log (
      id SERIAL PRIMARY KEY, device_id TEXT,
      last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    // ON CONFLICT (device_id) 需要唯一索引
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS sync_log_device_id_idx ON sync_log (device_id)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      player1_name TEXT DEFAULT '船員一', player2_name TEXT DEFAULT '船員二',
      player1_photo TEXT, player2_photo TEXT,
      use_bb_variant BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`INSERT INTO app_settings (id, player1_name, player2_name, use_bb_variant)
      VALUES (1, '船員一', '船員二', FALSE) ON CONFLICT (id) DO NOTHING`);
    console.log('數據庫結構就緒');
    return true;
  } catch (err) {
    console.error('數據庫初始化失敗:', err.message);
    return false;
  }
}

// 數據庫健康檢查（手機可以睇到係咪數據庫問題）
app.get('/api/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const r = await pool.query('SELECT count(*) FROM games');
    res.json({ db: 'ok', games: parseInt(r.rows[0].count) });
  } catch (err) {
    res.status(500).json({ db: 'error', detail: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: '神船 API 運行中', time: new Date().toISOString() });
});

// ========== 遊戲紀錄 API ==========

// Get all games
app.get('/api/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get games by date range
app.get('/api/games/range', async (req, res) => {
  const { start, end } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM games WHERE date >= $1 AND date <= $2 ORDER BY date DESC',
      [start, end]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Save a new game (full data)
app.post('/api/games', async (req, res) => {
  const {
    id, player1_name, player2_name, winner_id,
    total_drinks1, total_drinks2, total_ships1, total_ships2,
    total_beds, total_small_beds, dimsum1, dimsum2,
    no_ship_bonus1, no_ship_bonus2,
    declined_drinks1, declined_drinks2,
    shrimp_earned, beef_earned,
    final_score1, final_score2,
    highest_score, lowest_pre_down_score, max_drinks_in_round,
    use_bb, is_overseas, date
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO games (
        id, player1_name, player2_name, winner_id,
        total_drinks1, total_drinks2, total_ships1, total_ships2,
        total_beds, total_small_beds, dimsum1, dimsum2,
        no_ship_bonus1, no_ship_bonus2,
        declined_drinks1, declined_drinks2,
        shrimp_earned, beef_earned,
        final_score1, final_score2,
        highest_score, lowest_pre_down_score, max_drinks_in_round,
        use_bb, is_overseas, date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
      ON CONFLICT (id) DO UPDATE SET
        player1_name = EXCLUDED.player1_name,
        player2_name = EXCLUDED.player2_name,
        winner_id = EXCLUDED.winner_id,
        total_drinks1 = EXCLUDED.total_drinks1,
        total_drinks2 = EXCLUDED.total_drinks2,
        total_ships1 = EXCLUDED.total_ships1,
        total_ships2 = EXCLUDED.total_ships2,
        total_beds = EXCLUDED.total_beds,
        total_small_beds = EXCLUDED.total_small_beds,
        dimsum1 = EXCLUDED.dimsum1,
        dimsum2 = EXCLUDED.dimsum2,
        no_ship_bonus1 = EXCLUDED.no_ship_bonus1,
        no_ship_bonus2 = EXCLUDED.no_ship_bonus2,
        declined_drinks1 = EXCLUDED.declined_drinks1,
        declined_drinks2 = EXCLUDED.declined_drinks2,
        shrimp_earned = EXCLUDED.shrimp_earned,
        beef_earned = EXCLUDED.beef_earned,
        final_score1 = EXCLUDED.final_score1,
        final_score2 = EXCLUDED.final_score2,
        highest_score = EXCLUDED.highest_score,
        lowest_pre_down_score = EXCLUDED.lowest_pre_down_score,
        max_drinks_in_round = EXCLUDED.max_drinks_in_round,
        use_bb = EXCLUDED.use_bb,
        is_overseas = EXCLUDED.is_overseas,
        date = EXCLUDED.date`,
      [
        id, player1_name, player2_name, winner_id,
        total_drinks1, total_drinks2, total_ships1, total_ships2,
        total_beds, total_small_beds, dimsum1, dimsum2,
        no_ship_bonus1, no_ship_bonus2,
        declined_drinks1, declined_drinks2,
        shrimp_earned, beef_earned,
        final_score1, final_score2,
        highest_score, lowest_pre_down_score, max_drinks_in_round,
        use_bb, is_overseas, date
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

// Save turns for a game
app.post('/api/games/:gameId/turns', async (req, res) => {
  const { gameId } = req.params;
  const turns = req.body;

  try {
    // Delete old turns first
    await pool.query('DELETE FROM turns WHERE game_id = $1', [gameId]);
    
    for (const turn of turns) {
      await pool.query(
        `INSERT INTO turns (
          game_id, player_id, darts, score_before, score_after,
          drinks, ships, beds, small_beds, dim_sum,
          opponent_drinks, special_messages, is_down_mountain
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          gameId, turn.player_id, JSON.stringify(turn.darts), turn.score_before, turn.score_after,
          turn.drinks, turn.ships, turn.beds, turn.small_beds, turn.dim_sum,
          turn.opponent_drinks, JSON.stringify(turn.special_messages), turn.is_down_mountain
        ]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save turns' });
  }
});

// Get turns for a game
app.get('/api/games/:gameId/turns', async (req, res) => {
  const { gameId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM turns WHERE game_id = $1 ORDER BY id ASC',
      [gameId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch turns' });
  }
});

// ========== 批量同步 API ==========

// Full sync - upload all games from device
app.post('/api/sync/upload', async (req, res) => {
  const { games, device_id } = req.body;
  
  try {
    for (const game of games) {
      await pool.query(
        `INSERT INTO games (
          id, player1_name, player2_name, winner_id,
          total_drinks1, total_drinks2, total_ships1, total_ships2,
          total_beds, total_small_beds, dimsum1, dimsum2,
          no_ship_bonus1, no_ship_bonus2,
          declined_drinks1, declined_drinks2,
          shrimp_earned, beef_earned,
          final_score1, final_score2,
          highest_score, lowest_pre_down_score, max_drinks_in_round,
          use_bb, is_overseas, date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
        ON CONFLICT (id) DO UPDATE SET
          player1_name = EXCLUDED.player1_name,
          player2_name = EXCLUDED.player2_name,
          winner_id = EXCLUDED.winner_id,
          total_drinks1 = EXCLUDED.total_drinks1,
          total_drinks2 = EXCLUDED.total_drinks2,
          total_ships1 = EXCLUDED.total_ships1,
          total_ships2 = EXCLUDED.total_ships2,
          total_beds = EXCLUDED.total_beds,
          total_small_beds = EXCLUDED.total_small_beds,
          dimsum1 = EXCLUDED.dimsum1,
          dimsum2 = EXCLUDED.dimsum2,
          no_ship_bonus1 = EXCLUDED.no_ship_bonus1,
          no_ship_bonus2 = EXCLUDED.no_ship_bonus2,
          declined_drinks1 = EXCLUDED.declined_drinks1,
          declined_drinks2 = EXCLUDED.declined_drinks2,
          shrimp_earned = EXCLUDED.shrimp_earned,
          beef_earned = EXCLUDED.beef_earned,
          final_score1 = EXCLUDED.final_score1,
          final_score2 = EXCLUDED.final_score2,
          highest_score = EXCLUDED.highest_score,
          lowest_pre_down_score = EXCLUDED.lowest_pre_down_score,
          max_drinks_in_round = EXCLUDED.max_drinks_in_round,
          use_bb = EXCLUDED.use_bb,
          is_overseas = EXCLUDED.is_overseas,
          date = EXCLUDED.date`,
        [
          game.id, game.player1_name, game.player2_name, game.winner_id,
          game.total_drinks1, game.total_drinks2, game.total_ships1, game.total_ships2,
          game.total_beds, game.total_small_beds, game.dimsum1, game.dimsum2,
          game.no_ship_bonus1, game.no_ship_bonus2,
          game.declined_drinks1, game.declined_drinks2,
          game.shrimp_earned, game.beef_earned,
          game.final_score1, game.final_score2,
          game.highest_score, game.lowest_pre_down_score, game.max_drinks_in_round,
          game.use_bb, game.is_overseas, game.date
        ]
      );
    }
    
    // Update sync log
    await pool.query(
      `INSERT INTO sync_log (device_id, last_sync) VALUES ($1, NOW())
       ON CONFLICT (device_id) DO UPDATE SET last_sync = NOW()`,
      [device_id]
    );
    
    res.json({ success: true, uploaded: games.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync', detail: err.message });
  }
});

// Full sync - download all games
app.get('/api/sync/download', async (req, res) => {
  try {
    const gamesResult = await pool.query('SELECT * FROM games ORDER BY date DESC');
    res.json({ success: true, games: gamesResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download', detail: err.message });
  }
});

// ========== 設定 API ==========

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
app.put('/api/settings', async (req, res) => {
  const { player1_name, player2_name, player1_photo, player2_photo, use_bb_variant } = req.body;
  try {
    await pool.query(
      `UPDATE app_settings SET
        player1_name = $1, player2_name = $2,
        player1_photo = $3, player2_photo = $4,
        use_bb_variant = $5, updated_at = NOW()
      WHERE id = 1`,
      [player1_name, player2_name, player1_photo, player2_photo, use_bb_variant]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ========== 刪除 API ==========

// Delete all games (with password)
app.delete('/api/games', async (req, res) => {
  const { password } = req.body;
  if (password !== '8888') {
    return res.status(403).json({ error: '密碼錯誤' });
  }
  try {
    await pool.query('DELETE FROM turns');
    await pool.query('DELETE FROM games');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete games' });
  }
});

// Delete a specific game
app.delete('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM turns WHERE game_id = $1', [id]);
    await pool.query('DELETE FROM games WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

const PORT = process.env.PORT || 3000;
initDb().then((ok) => {
  app.listen(PORT, () => {
    console.log(`神船 API 伺服器運行於端口 ${PORT}（數據庫: ${ok ? '正常' : '異常'}）`);
  });
});
