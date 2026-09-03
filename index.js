require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: '神船 API 運行中' });
});

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

// Save a new game
app.post('/api/games', async (req, res) => {
  const {
    id, player1_name, player2_name, player1_photo, player2_photo,
    winner_id, total_drinks1, total_drinks2, total_ships1, total_ships2,
    total_beds, total_small_beds, total_dimsum1, total_dimsum2,
    no_ship_bonus1, no_ship_bonus2, final_score1, final_score2, use_bb
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO games (
        id, player1_name, player2_name, player1_photo, player2_photo,
        winner_id, total_drinks1, total_drinks2, total_ships1, total_ships2,
        total_beds, total_small_beds, total_dimsum1, total_dimsum2,
        no_ship_bonus1, no_ship_bonus2, final_score1, final_score2, use_bb
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        id, player1_name, player2_name, player1_photo, player2_photo,
        winner_id, total_drinks1, total_drinks2, total_ships1, total_ships2,
        total_beds, total_small_beds, total_dimsum1, total_dimsum2,
        no_ship_bonus1, no_ship_bonus2, final_score1, final_score2, use_bb
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
    for (const turn of turns) {
      await pool.query(
        `INSERT INTO turns (
          game_id, player_id, darts, score_before, score_after,
          drinks, ships, beds, small_beds, dim_sum,
          opponent_drinks, special_messages, is_down_mountain
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          gameId, turn.player_id, JSON.stringify(turn.darts), turn.score_before, turn.score_after,
          turn.drinks, turn.ships, JSON.stringify(turn.beds), JSON.stringify(turn.small_beds), turn.dim_sum,
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
        use_bb_variant = $5
      WHERE id = 1`,
      [player1_name, player2_name, player1_photo, player2_photo, use_bb_variant]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete all games (with password)
app.delete('/api/games', async (req, res) => {
  const { password } = req.body;
  if (password !== '8888') {
    return res.status(403).json({ error: '密碼錯誤' });
  }
  try {
    await pool.query('DELETE FROM games');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete games' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`神船 API 伺服器運行於端口 ${PORT}`);
});
