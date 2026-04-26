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

## Current state (as of 2026-04-27)
Stage A + B + C 已部署：https://lanternko.github.io/Hellbred-Racing/
**Stage D**（roguelike 6-turn cycle + 印記）2026-04-27 設計定稿，實作中。

**Stage A**：均值回歸交配 + 母馬限回合限 1 次 + OVR 排序 + 馬廄展開 + 突變紅字
**Stage B**：靈魂區 + Ragnarök + 千年大典 + 技能（疾風/霸力/鋼魂）+ 一鍵掃蕩
**Stage C**：特性系統（藍/紅/金）+ 獸醫建言 + 馬匹清單 modal
**Stage D**：6-turn cycle（活動×2 → 賽事 → 活動×2 → 大典）+ 馬廄 fix size + 金幣 down-scale + 印記
**設計哲學**：特性決定方向，數值決定下限。資訊 B方案（部分遮蔽）— 隱性僅顯示「血統中潛藏不詳因子」。

## Stage C 規格（已實作）

**遺傳模型：**
- 藍特（A型隱性）：雙親同位點 → 顯現 70%（B08 提升至 85%）；單親攜帶 → 隱性傳遞 50%（B08 提升至 80%）
- 紅特（B型顯性）：單親 55% / 雙親 85% 繼承 + **3% 每育種突變率** + 初始馬 8% / 市場馬 12% 自然帶有
- 金特（C型突變）：每育種 2% 機率，G01/G02 各半

**藍特：** B01 蹄炎(火+8%) / B02 冰晶(冰+8%) / B03 沙漠之子(沙+8%) / B04 鐵蹄(爬山+10%) / B05 疾風步(長平原+10%) / B06 起伏直覺(起伏+10%) / **B07 共鳴體質**(每持有 1 個其他藍特 +3%) / **B08 多產血脈**(藍特繼承率提升)

**紅特：** R01 燃盡(出賽後速度-1) / R02 玻璃骨(非對應賽道-20%) / **R03 玻璃心**(千年大典必敗) / **R04 孤傲**(自身特性失效仍可遺傳) / R05 短命(Age 4 死亡) / **R06 暴食**(每年 -80G)

**金特：** G01 地獄之王(Ragnarök 全屬性匹配) / **G02 鳳凰之血**(死亡時 30% 重生為幼駒，一次性)

**獸醫建言判定順序：** 金特共鳴 → 雙親紅特共鳴 → 單親紅特 → 隱性位點交集（含 B07/B08 暗示）→ 血統相性 fallback

**馬匹欄位：** `traits: { displayed: [], recessiveFlags: [] }`

## Stage D 規格（6-turn cycle + 印記）

**回合結構**（30 turn = 5 cycle）：
- T1, T2, T4, T5：**活動 turn**（彈三選一 modal，獎勵：特性卡 / 稀有馬場 buff，無賽事）
- T3：**小賽事 turn**（普通比賽，可買馬交配）
- T6：**大典 turn**（major race，冠軍獲得印記三選一，可買馬交配）
- T30 大典結束 → 玩家手動按鈕進入 Ragnarök 終局

**金幣 down-scale ÷100**：起始 10G / 賽事 +3 勝 +1 敗 / 大典 +10 勝 +2 敗 / 買馬 1–12G / R06 暴食 -1G/年。

**馬廄 fix size**：初始 6 格，每 6 turn +1（T6/12/18/24/30），最終 11 格。滿時無法買馬 / 接受新生兒（突變 G02 重生例外，仍進靈魂區）。

**交配年齡 1–4**（補償馬廄縮小）：1 歲幼駒可交配，5 歲入靈魂區後不可。

**印記**（A 型隱性遺傳，每馬最多 1 枚）：
- 取得：大典冠軍三選一（從未持有印記池）
- 遺傳：雙親同印記 70% 顯現 / 單親 50% 隱性傳遞
- MVP 兩枚：
  - **無瑕之眼**：速度上限 100 → 115（突破 cap）
  - **戰神血脈**：大典中三圍視為 +10
- TODO（Run #2 後）：不朽鋼骨（力量抗劣化）/ 無盡氣血（體力抗時間退化）/ 鬼血傳承（子代突變率 10→30%）

**馬匹新欄位：** `marks: []`（max 1）, `marksRecessive: []`（隱性傳遞用）

## Next actions
- [x] Stage A/B 全部完成並部署
- [x] **Stage C-1：特性系統** — 資料結構 + 遺傳邏輯 + UI badge + 戰力加乘（commit `864f83a`）
- [x] **Stage C-2：獸醫建言** — 瓦拉克博士台詞庫 + 判定邏輯（commit `864f83a`）
- [x] **Stage C-3：馬匹清單 modal** — 三 tab（commit `864f83a`）
- [x] **特性擴充**：B07/B08/R03/R04/R06/G02 + 紅特自然生成（2026-04-27）
- [ ] **Stage D**：6-turn cycle + 馬廄 fix size + 金幣 down-scale + 活動 modal + 印記（實作中）
- [ ] **Stage C-4（暫緩）：世代育種資料庫** — 每回合育種進 pool，世代末選 5，需改核心 loop
- [ ] **Playtest Run #2** — Stage D 完成後跑 1 場，觀察 6-turn 節奏 + 印記稀有度是否合理 → `memory/playtest_notes.md`
- [ ] **TODO（解凍後）**：理財工具（金幣 sink）/ 花錢升級馬廄（與自動升級疊加）/ 印記 #3-5（鋼骨/無盡/鬼血）

## Frozen systems（MVP 期不做，違反前先停下來問本人）
- **榮冠卡牌系統** — Why: 卡牌會與交配 / 賽事系統互相耦合，未驗證核心循環前加進去等於三系統一起重構。
- **花錢升級馬廄 / 設施經濟** — Why: 多一層金幣 sink 會掩蓋「賽事獎金 vs 黑市價格」這個原始經濟是否平衡。Stage D 的「自動升級」走 fixed-progress 不算解凍。
- **理財工具（一次性 / 永久型 buff）** — Why: 同上，未驗證育種核心循環前加金幣決策層會混淆數值崩壞歸因。
- **四級聯賽 / 賽季結構** — Why: 30 回合本身就是賽季抽象，再分級會撐不滿樣本，徒增 UI 複雜度。
- **美術 / 音效 / 動畫** — Why: 純文字 UI 才能讓「改數值 → 看效果」的 iteration time 維持秒級；像素美術另有反模式（見 game-dev skill anti-patterns.md #5）。

> **解凍條件**（量化，缺一不可）：自己連玩 ≥ 5 場 30 回合 + ≥ 3 場主動「再開一局」 + 至少 1 個朋友玩 1 場後不靠講解能知道下一步該做什麼。詳見 [prompts/tinyprd.md](prompts/tinyprd.md) `Done = ?`。

## Game invariants（程式級不變式，三個 step 都不可違反）
- 馬匹年齡是整數，每按一次「下一個千年」+1。
- 馬匹性別在出生時隨機 50/50 決定後終身不變。
- 三圍（速度 / 力量 / 體力）clamp 在 1–100，任何運算（含突變 / 劣化）後超出都要 clip。例外：**印記 M01 無瑕之眼** 將該馬速度上限提升至 115。
- 5 歲從馬廄移除，進入靈魂區（`game.souls`）；靈魂區無上限，不參與日常賽事與交配。
  - 例外：R05 短命血統馬 Age 4 就死亡，同樣進入靈魂區。
- 每回合每匹馬最多參加一場賽事。
- 突變 +20、劣化 -15 為硬編碼上限；同一項數值同回合最多觸發其一，不可疊加。
- 子代出生時年齡 = 0、狀態 = 幼駒。
- 特性系統不可疊加相同類型：同一特性 id 不可重複加入 displayed。
- 紅特 R04（孤傲）與藍特 B07（共鳴體質）共存時，孤傲優先壓制，但 B07 仍可傳遞給子代。
- **馬廄容量為硬上限**：`game.horses.length ≤ game.stableSize`。滿時 `buyMarketHorse()` / `breed()` 拒絕並回傳錯誤訊息；不可悄悄丟棄馬匹。
- **6-turn cycle 不可變**：T6/12/18/24/30 必為大典；T3/9/15/21/27 必為小賽事；其餘 turn 為活動 turn。`(turn - 1) % 6 + 1` 決定 phase。
- **印記每馬最多 1 枚**：取得新印記時若已有印記，舊印記不被覆蓋（可遺傳但本馬不再吃新印記）。冠軍若已滿則跳過獎勵（不轉 fallback）。

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
