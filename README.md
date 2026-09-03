# 神船 API 後端

## 部署到 Render

1. 在 [Render](https://render.com) 建立一個新的 **Web Service**
2. 連接你的 GitHub repo 或手動上傳此 `shenchuan-api` 資料夾
3. 設定環境變數：
   - `DATABASE_URL` = Neon PostgreSQL 連接字串
   - `PORT` = 10000 (Render 會自動覆蓋)
4. Build Command: `npm install`
5. Start Command: `node index.js`

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | 健康檢查 |
| GET | `/api/games` | 取得所有遊戲紀錄 |
| POST | `/api/games` | 儲存新遊戲 |
| POST | `/api/games/:gameId/turns` | 儲存該遊戲的所有回合 |
| GET | `/api/settings` | 取得設定 |
| PUT | `/api/settings` | 更新設定 |
| DELETE | `/api/games` | 刪除全部遊戲 (需密碼 8888) |

## 本地測試

```bash
npm install
# 建立 .env 檔，填入 DATABASE_URL
npm run dev
```
