# Hellbred-Racing — 地獄賽馬 MVP

## Why
為惡魔之王培育頂尖坐騎的 30 回合育成遊戲。Phase 1 MVP 目標：用純文字 UI 驗證「**基因提純**」+「**壽命限制**」是否好玩 — 沒驗證好玩前不投資任何美術 / 音效 / 額外系統（榮冠卡牌、馬舍升級、四級聯賽全部凍結）。

## Architecture
- **Stack**: 純 HTML + JavaScript（單檔 / 無 bundler）。Why: 零基礎 + AI 輔助開發，任何 build step 都是過早優化；Claude artifact 直接輸出單檔 HTML 最快。
- **Layout**:
  - `index.html` — 遊戲本體（Claude artifact 產出後存於此）
  - `prompts/` — 三段式交接 prompt（step-1 / 2 / 3）
  - `memory/playtest_notes.md` — 數值崩壞觀察紀錄
  - `CLAUDE.md` — 此檔（SSoT）

## Commands
```bash
# 沒有 build step
open index.html
```

## Current state (as of 2026-04-25)
Day 0：骨架建好，尚未產出任何遊戲程式碼。下一步把 `prompts/step-1-time-and-horse.md` 貼給 Claude，存 artifact 為 `index.html`，先確認時間軸 + 馬匹年齡狀態機跑得起來。

## Next actions
- [ ] **Step 1：時間軸 + 馬匹物件** — 貼 `prompts/step-1-time-and-horse.md`，存 artifact
- [ ] **Step 2：自動賽事** — 確認 Step 1 OK 後再貼 `prompts/step-2-races.md`
- [ ] **Step 3：基因提純育種** — 確認 Step 2 OK 後再貼 `prompts/step-3-breeding.md`
- [ ] **數值調校** — 三 step 跑通後寫 `memory/playtest_notes.md`，依紀錄回頭調

## NEVER
- **不要在 MVP 階段加 Phase 1 範圍外的系統。** Why: 卡牌、馬舍、聯賽、美術全要等到「光配種就停不下來」之後才能解凍 — 否則 Claude 會產出互相衝突的長 code，零基礎玩家無法除錯，專案會在第一週死亡。
- **不要一次貼超過一個 step prompt 給 Claude。** Why: 大量需求一起丟會出現變數衝突、UI 亂掉。每 step 確認跑得起來再貼下一個 — 這是這份企劃的核心節奏。
- **不要在第一輪就改 prompts/ 裡的遺傳算法數值（10% 突變 / 5% 劣化）。** Why: 這些是待調校變數；先用預設值跑完整局再依 playtest 調，邊寫邊改會混淆「數值崩壞」是 prompt 改錯還是設計本身就壞。
- **不要把 artifact code 直接 commit 進來而不先在瀏覽器點過。** Why: Claude 偶爾會生成語法錯誤或 console error；先 `open index.html` 確認跑得起來再 commit，否則 git history 會充滿壞版本。

## How to edit this file
- 維持 ≤150 行。
- 每條規則都要 Why。
- 通過 Step 1/2/3 後更新「Current state」日期 + 「Next actions」打勾。
- 進入 Phase 2（卡牌 / 美術）時把已凍結系統從 NEVER 移除，但要先紀錄「凍結期間 N 場 playtest 的結論」。
