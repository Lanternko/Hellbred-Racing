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
Stage C（特性系統）設計定稿，待實作。

**Stage A**（Run #1 反饋）：均值回歸交配 + 母馬限回合限 1 次 + OVR 顯示排序 + 馬廄 top 5 展開 + 突變紅字視覺
**Stage B**：靈魂區 + Ragnarök + 千年大典 + 技能（疾風/霸力/鋼魂）+ 一鍵掃蕩

**Stage C 設計決策（2026-04-26 定稿）：**
- 特性系統（藍特/紅特/金特）參考實況野球榮冠模式：藍=隱性BUFF、紅=顯性DEBUFF、金=突變強力BUFF
- 設計哲學：特性決定方向，數值決定下限。兩者互相鎖定，玩家無法只做一件事。
- 資訊透明度：**B方案（部分遮蔽）** — 隱性基因只顯示「血統中潛藏不詳因子」，不透露細節
- 獸醫建言：瓦拉克博士（行醫逾八千年的地獄老惡魔）在育種選配時給出模糊建言

## Stage C 規格（MVP 實作範圍）

**特性遺傳模型：**
- A型（藍特隱性）：父母同位點 → 顯現 70%；單親攜帶 → 隱性傳遞 50%
- B型（紅特顯性）：單親顯現 → 繼承 55%；雙親都有 → 85%
- C型（金特突變）：每次育種 2% 機率，目前僅 G01

**藍特（B型 BUFF，A型遺傳）：**
B01 蹄炎（火焰賽道+8%）、B02 冰晶體質（冰雪+8%）、B03 沙漠之子（沙漠+8%）
B04 鐵蹄（爬山+10%）、B05 疾風步（長平原+10%）、B06 起伏直覺（起伏+10%）

**紅特（DEBUFF，B型顯性遺傳）：**
R01 燃盡（每場出賽後速度永久-1）、R02 玻璃骨（非對應賽道-20%）、R05 短命血統（Age 4死亡）

**金特（強力BUFF，突變C型）：**
G01 地獄之王（Ragnarök中所有屬性視為匹配）

**獸醫建言判定優先順序：** 金特共鳴 → 雙親紅特共鳴 → 單親紅特 → 隱性位點交集（含方向暗示）→ 血統相性（fallback）

**馬匹結構新增欄位：** `traits: { displayed: [], recessiveFlags: [] }`

## Next actions
- [x] Stage A/B 全部完成並部署 — https://lanternko.github.io/Hellbred-Racing/
- [ ] **Stage C-1：特性系統** — 資料結構 + 遺傳邏輯 + UI badge + hover tooltip + 戰力加乘
- [ ] **Stage C-2：獸醫建言** — 瓦拉克博士在育種介面插入（台詞庫 + 判定邏輯）
- [ ] **Stage C-3：馬匹清單 modal** — 隨時叫出，三個 tab（現役/靈魂/育種池）
- [ ] **Stage C-4（暫緩）：世代育種資料庫** — 每回合育種進 pool，世代末選 5，需改核心 loop，單獨處理
- [ ] Playtest Run #2 — 自己連玩 1 場 + 1 朋友玩 → `memory/playtest_notes.md`

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
  - 例外：R05 短命血統馬 Age 4 就死亡，同樣進入靈魂區。
- 每回合每匹馬最多參加一場賽事。
- 突變 +20、劣化 -15 為硬編碼上限；同一項數值同回合最多觸發其一，不可疊加。
- 子代出生時年齡 = 0、狀態 = 幼駒。
- 特性系統不可疊加相同類型：同一特性 id 不可重複加入 displayed。
- 紅特 R04（孤傲）與藍特 B07（共鳴體質）共存時，孤傲優先壓制，但 B07 仍可傳遞給子代。

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
