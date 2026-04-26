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

## Visual feedback loop
- **改完任何 UI 邏輯先用 Playwright MCP 截圖驗證再宣稱跑得起來。** Why: Anthropic 官方說 Claude is a poor QA agent，沒外部視覺確認就是盲改 — 文字 UI 也會犯「年份顯示錯位 / 按鈕點不到 / 列表沒更新」這類盲改不會發現的錯。
- 一次性安裝：`claude mcp add playwright npx @playwright/mcp@latest`
- 每次互動明說「use playwright mcp to ...」，否則 Claude 會 fallback 去讀 HTML 純文字幻想結果。樣板：「use playwright mcp to open `file://.../index.html`, screenshot, click 下一個千年, screenshot again, report what changed」。

## Current state (as of 2026-04-26)
Stage A + Stage B 已全部實作完畢，部署於 GitHub Pages：https://lanternko.github.io/Hellbred-Racing/

**Stage A**（Run #1 反饋）：均值回歸交配 + 母馬限回合限 1 次 + OVR 顯示排序 + 馬廄 top 5 展開 + 突變紅字視覺
**Stage B**（Run #1 解凍 2 條）：
- 靈魂區（左側固定側欄）— 死馬進靈魂區而非消失
- Ragnarök 終局決戰 — 30 回合後按「進入終局」，全員同場競技排名（含四天王 NPC）
- 千年大典（每 5 回合）— 限 2 名出賽、勝者獲技能、+1000G
- 技能系統（疾風/霸力/鋼魂）— 可使三圍超過 100、50% 繼承率
- 一鍵掃蕩（左下角 FAB）— 自動推進，大典年暫停

## Next actions
- [x] **MVP code (Step 1-3 + 🟢 視覺層)** — verified by Claude_Preview MCP
- [x] **Stage A 修補（Run #1 反饋）** — 均值回歸 + 母馬限制 + OVR + top 5 + 突變紅字
- [x] **Stage B（靈魂區 + Ragnarök + 千年大典 + 技能 + 掃蕩）** — 已部署
- [x] **GitHub Pages** — https://lanternko.github.io/Hellbred-Racing/
- [ ] **Playtest Run #2** — 自己連玩 1 場 + 1 朋友玩 → `memory/playtest_notes.md`
- [ ] **依 Run #2 結果**：好玩 → 砍 wishlist；不好玩 → 從 wishlist 挑 1 條解凍

## Frozen systems（MVP 期不做，違反前先停下來問本人）
- **榮冠卡牌系統** — Why: 卡牌會與交配 / 賽事系統互相耦合，未驗證核心循環前加進去等於三系統一起重構。
- **馬舍升級 / 設施經濟** — Why: 多一層金幣 sink 會掩蓋「賽事獎金 vs 黑市價格」這個原始經濟是否平衡。
- **四級聯賽 / 賽季結構** — Why: 30 回合本身就是賽季抽象，再分級會撐不滿樣本，徒增 UI 複雜度。
- **美術 / 音效 / 動畫** — Why: 純文字 UI 才能讓「改數值 → 看效果」的 iteration time 維持秒級；像素美術另有反模式（見 game-dev skill anti-patterns.md #5）。

> **解凍條件**（量化，缺一不可）：自己連玩 ≥ 5 場 30 回合 + ≥ 3 場主動「再開一局」 + 至少 1 個朋友玩 1 場後不靠講解能知道下一步該做什麼。詳見 [prompts/tinyprd.md](prompts/tinyprd.md) `Done = ?`。

## Game invariants（程式級不變式，三個 step 都不可違反）
- 馬匹年齡是整數，每按一次「下一個千年」+1。
- 馬匹性別在出生時隨機 50/50 決定後終身不變。
- 三圍（速度 / 力量 / 體力）clamp 在 1–100，任何運算（含突變 / 劣化）後超出都要 clip。
- 5 歲從馬廄移除，進入靈魂區（`game.souls`）；靈魂區無上限，不參與日常賽事與交配。
- 每回合每匹馬最多參加一場賽事。
- 突變 +20、劣化 -15 為硬編碼上限；同一項數值同回合最多觸發其一，不可疊加。
- 子代出生時年齡 = 0、狀態 = 幼駒。

## NEVER
- **不要在 MVP 階段加 Frozen systems 列出的任何系統。** Why: 詳見上方 `Frozen systems` 區塊；解凍條件未達成前加進來會 (a) 互相耦合導致除錯失敗 (b) 撐爆 Claude 單 artifact 的 context，零基礎玩家無法歸因。
- **不要一次貼超過一個 step prompt 給 Claude。** Why: 大量需求一起丟會出現變數衝突、UI 亂掉。每 step 確認跑得起來再貼下一個 — 這是這份企劃的核心節奏。
- **不要在第一輪就改 prompts/ 裡的遺傳算法數值（10% 突變 / 5% 劣化）。** Why: 這些是待調校變數；先用預設值跑完整局再依 playtest 調，邊寫邊改會混淆「數值崩壞」是 prompt 改錯還是設計本身就壞。
- **不要把 artifact code 直接 commit 進來而不先在瀏覽器點過。** Why: Claude 偶爾會生成語法錯誤或 console error；先 `open index.html` 確認跑得起來再 commit，否則 git history 會充滿壞版本。

## How to edit this file
- 維持 ≤150 行。
- 每條規則都要 Why。
- 通過 Step 1/2/3 後更新「Current state」日期 + 「Next actions」打勾。
- 解凍 Frozen systems 任一條時：從 `Frozen systems` 區塊移除該條 + 在 `memory/` 新增「凍結期間 N 場 playtest 的結論」紀錄；未紀錄不得解凍。
- 修改 Game invariants 等於改設計，不是 bugfix；改前先在 `memory/playtest_notes.md` 寫下觸發理由。
