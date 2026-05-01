# Hellbred-Racing — 地獄賽馬 MVP

## Why
為惡魔之王培育頂尖坐騎的 30 回合育成遊戲。Phase 1 MVP 目標：用純文字 UI 驗證「**基因提純**」+「**壽命限制**」是否好玩 — 沒驗證好玩前不投資任何美術 / 音效 / 額外系統（榮冠卡牌、馬舍升級、四級聯賽全部凍結）。

## Architecture
- **Stack**: 純 HTML + JavaScript（無 bundler / 無 build step）。Why: 零基礎 + AI 輔助開發，任何 build step 都是過早優化。原本是單檔 artifact，Stage F 後拆成 4 個 JS + 2 個 CSS，仍然 `open index.html` 即跑。
- **Layout**:
  - `index.html` — markup + `<link>` / `<script src>`（瘦身後 ~200 行）
  - `styles.css` — 主樣式（design tokens / 賽事 / 黑市 / 交配所 / phase lock / 響應式）
  - `card.css` — 馬匹卡片樣式（稀有度主題）
  - `data.js` — 常數與資料表（TRAIT_DATA / MARK_DATA / EVENT_CARDS / RACE_TYPES / TRACK_DEFS / CLIMATE_MODS / STAT_FORMULA / VET_LINES / SKILL_LIST）
  - `game.js` — 遊戲邏輯（state / breed / turn / 物理引擎 / AI 一鍵掃蕩 / Ragnarök）
  - `render.js` — UI render（render / renderModal / renderChoiceModal / handleBreedListClick）
  - `names.js` — 馬匹命名系統（6 風格字庫）
  - `card.js` — 馬匹詳細卡片（翻牌 modal / 稀有度判定）
  - `prompts/` — 三段式交接 prompt（step-1 / 2 / 3）
  - `memory/playtest_notes.md` — 數值崩壞觀察紀錄
  - `memory/stage_specs.md` — Stage C/D/E/F 完整規格
  - `memory/post-mvp-wishlist.md` — 已解凍系統紀錄
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

## Current state (as of 2026-05-01)
Stage A + B + C + D + E + F + 命名系統 + 卡片系統已實作；codebase 已從單檔 3360 行拆成 styles.css / data.js / game.js / render.js。

- **A**：均值回歸交配 / 母馬限回合 1 次 / OVR 排序 / 馬廄展開 / 突變紅字
- **B**：靈魂區 / Ragnarök / 大典 / 技能 / 一鍵掃蕩
- **C**：特性系統（藍/紅/金）/ 獸醫建言 / 馬匹清單 modal
- **D**：6-turn cycle / 馬廄 fix size / 金幣 down-scale / 印記
- **E**：active/bench 分離 / 兩步交配選擇（任意性別先選）/ bench 可作配對對象 / 公馬主動限 1 胎/年 / subPhase / 黑市全期開放 / 老化僅賽事回合
- **F**：物理引擎賽事模擬 — 賽道分段（straight / mildCurve / hairpin / climb / descent / sprint）+ 氣候系統（Normal/Fire/Ice/Sand 影響上限速度 / 加速 / 體力消耗 / 彎道懲罰）+ 髮夾彎取代「起伏不定」+ B01/B02/B03 從 +8% 反向加成為氣候完整適應
- **命名/卡片**：6 風格姓名（強者姓 / 弱者 origin / 英文姓後置）+ 6 段稀有度 + 翻牌驚喜 + 卡片 rarity tint

**設計哲學**：特性決定方向，數值決定下限。資訊 B方案（部分遮蔽）— 隱性僅顯示「血統中潛藏不詳因子」。

## Stage 規格（詳見 [memory/stage_specs.md](memory/stage_specs.md)）

**Stage C**（8藍/6紅/2金）：賽道/地形/共鳴/多產 BUFF；燃盡/玻璃骨/玻璃心/孤傲/短命/暴食 DEBUFF；地獄之王/鳳凰之血 金特；獸醫建言。`traits: { displayed, recessiveFlags }`

**Stage D**（6-turn cycle）：T6/12/18/24/30 大典；T3/9/15/21/27 小賽事；其餘活動。馬廄 6→11；金幣 ÷100；印記 2 枚（無瑕之眼 M01 / 戰神血脈 M02）。`marks: [], marksRecessive: []`

**Stage E**（替補席 + Phase Lock）：active/bench 拆分；subPhase roster→racing→breeding；主動方當年完賽才可交配，被選方（含 bench）無限制；公馬作為主動方限 1 胎/年；黑市整隊/賽事/育馬三期均開放，購入不凍結賽/育；新生本年凍結；命名平民化（千年→年）。

**Stage F**（物理引擎賽事）：tick-based simulation（每 tick 算 vel/pos/stam 直到衝線或 250 tick 上限）；3 種賽道（長平原 2400m / 髮夾彎 1600m / 爬山 1200m）由 segment 組成；每 segment 影響 capMul / drainMul / recover；氣候系統：Fire 體力 +15% 消耗、Ice 加速 -10%、Sand 上限速度 -5%、Normal 無影響；藍特 B01/B02/B03 反向加成（火→上限+5%、冰→彎道懲罰減半、沙→體力消耗 0.9×）。物理參數：`maxSpeed = 12 + s × 0.10`、`accel = 0.5 + p × 0.04`、`staminaPool = 50 + e`、`drain = v × 0.05`。Race result 含 timeline，動畫由 renderRaceReplay 重播。

## Next actions
- [x] Stage A / B / C / D + 卡片系統已完成
- [x] **Stage E**：替補席 + 兩步交配 UI + bench 可配對 + 老化僅賽事回合 + 黑市全期開放 + 新購不凍結
- [x] **Stage F**：物理引擎 + 髮夾彎賽道 + 氣候反向加成
- [x] **Codebase 重整**：從單檔 3360 行 index.html 拆成 styles.css + data.js + game.js + render.js
- [ ] **Playtest Run #2** — 跑 1 場完整 30 回合，觀察「老化只在賽事回合」+ Stage F 物理引擎是否讓育種節奏更策略性
- [ ] **TODO（解凍後）**：理財工具 / 花錢升級馬廄 / 印記 #3-5 / Stage C-4 世代育種資料庫

## Frozen systems（MVP 期不做，違反前先停下來問本人）
- **榮冠卡牌系統** — Why: 卡牌會與交配 / 賽事系統互相耦合，未驗證核心循環前加進去等於三系統一起重構。
- **花錢升級馬廄 / 設施經濟** — Why: 多一層金幣 sink 會掩蓋「賽事獎金 vs 黑市價格」這個原始經濟是否平衡。Stage D 的「自動升級」走 fixed-progress 不算解凍。
- **理財工具（一次性 / 永久型 buff）** — Why: 同上，未驗證育種核心循環前加金幣決策層會混淆數值崩壞歸因。
- **四級聯賽 / 賽季結構** — Why: 30 回合本身就是賽季抽象，再分級會撐不滿樣本，徒增 UI 複雜度。
- **美術 / 音效 / 動畫** — Why: 純文字 UI 才能讓「改數值 → 看效果」的 iteration time 維持秒級；像素美術另有反模式（見 game-dev skill anti-patterns.md #5）。

> **解凍條件**（量化，缺一不可）：自己連玩 ≥ 5 場 30 回合 + ≥ 3 場主動「再開一局」 + 至少 1 個朋友玩 1 場後不靠講解能知道下一步該做什麼。詳見 [prompts/tinyprd.md](prompts/tinyprd.md) `Done = ?`。

## Game invariants（程式級不變式，三個 step 都不可違反）
- **老化僅在賽事回合（小賽事/大典）完賽後觸發**：`advanceFromRacing()` 統一老化；活動回合不老化。1 歲入場馬保證至少可參賽 3 次。
- 馬匹性別在出生時隨機 50/50 決定後終身不變。
- 三圍（速度 / 力量 / 體力）clamp 在 1–100，任何運算（含突變 / 劣化）後超出都要 clip。例外：**印記 M01 無瑕之眼** 將該馬速度上限提升至 115。
- 5 歲從 active 或 bench 移除，進入靈魂區（`game.souls`）；靈魂區無上限，不參與日常賽事與交配。
  - 例外：R05 短命血統馬 Age 4 就死亡，同樣進入靈魂區。
- 每回合每匹馬最多參加一場賽事。
- 突變 +20、劣化 -15 為硬編碼上限；同一項數值同回合最多觸發其一，不可疊加。
- 子代出生時年齡 = 0、狀態 = 幼駒；當年 `racedThisTurn = true` & `bredThisTurn = true`（不可參賽 / 交配）。黑市購入馬**不凍結**當年賽/育資格。
- 特性系統不可疊加相同類型：同一特性 id 不可重複加入 displayed。
- 紅特 R04（孤傲）與藍特 B07（共鳴體質）共存時，孤傲優先壓制，但 B07 仍可傳遞給子代。
- **active roster 硬上限**：`game.horses.length ≤ game.stableSize`。滿時新買 / 新生馬自動進 `game.bench`，bench 無上限。
- **6-turn cycle 不可變**：T6/12/18/24/30 必為大典；T3/9/15/21/27 必為小賽事；其餘 turn 為活動 turn。
- **印記每馬最多 1 枚**：取得新印記時若已有印記，舊印記不被覆蓋（可遺傳但本馬不再吃新印記）。冠軍若已滿則跳過獎勵。
- **交配前提**：**主動方**（primary）`racedThisTurn === true` 必須當年完賽。**被選方**（secondary）無限制：替補、bench、未參賽、已配皆可。UI 採兩步選擇（先任意性別 → 再對應異性），選擇不消耗次數。
- **每馬主動 1 胎/年（公母皆然）**：作為主動方時 `primary.bredThisTurn` 觸發即拒絕；作為被選方時不受限。
- **全年主動上限 6**：`game.primariesThisYear ≥ 6` 即拒絕新主動交配（即使 stable 擴充至 >6 仍封頂）。`nextTurn()` 重置為 0。
- **黑市**：每回合保證至少 1 公 1 母（`makeMarket()`）；特性機率 35%（藍/紅隨機）；技能機率 15%；價格 ∝ OVR × (5−age) ÷ 20 + 技能 +3G。整隊/賽事/育馬三期均可購入。
- **subPhase 推進不可逆**：`roster → racing → breeding`；「下一年」按鈕僅在 breeding 或 event-modal-resolved 時可按。
- **Stage F 賽道集合**：`TRACK_DEFS` 鍵僅 `長平原 / 髮夾彎 / 爬山` 三種；`RACE_TYPES.terrain` 必須是其中之一。**禁止**再寫「起伏不定」字串。
- **Stage F 物理引擎為 self-contained**：`simulateRaceMatch()` 回傳 `{ won, timeline, ... }`；`applyRaceOutcome()` 才寫入 `racedThisTurn` / R01 損耗 / 獎金 / 印記。renderRaceReplay 純 replay timeline，跳過動畫不影響結果。

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
