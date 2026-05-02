# AGENTS.md

給 Codex / OpenAI-style agents 的入口摘要。`[CLAUDE.md](CLAUDE.md)` 仍是單一事實來源；若本檔與 `CLAUDE.md` 衝突，一律以 `CLAUDE.md` 為準。

## 必讀順序
1. 先讀 `CLAUDE.md`。Why: 這裡只整理高頻規則，不涵蓋完整設計脈絡。
2. 要改規格時再讀 `memory/stage_specs.md`、`memory/playtest_notes.md`。Why: 避免把設計決策誤判成 bug。
3. 要延續功能開發時再讀對應 `prompts/step-*.md`。Why: 此專案的迭代節奏是分 step 漸進擴充。

## 專案快照
- 專案：Hellbred-Racing，30 回合純文字育成 MVP，核心驗證是「基因提純 + 壽命限制」。
- 技術：純 `HTML + JavaScript`，無 bundler、無 build step。Why: 保持零設定與秒級迭代。
- 啟動指令：
```bash
open index.html
```
- 主要檔案：
  - `index.html`：markup 與 script/link 掛載
  - `styles.css`：主樣式
  - `card.css`：馬匹卡片樣式
  - `data.js`：常數與資料表
  - `game.js`：遊戲狀態與核心邏輯
  - `render.js`：畫面 render 與 modal UI
  - `names.js`：命名系統
  - `card.js`：馬匹詳細卡片

## Agent 工作規則
- 改完 UI 或互動流程後，先用 Playwright MCP 開 `file://.../index.html` 做點擊與截圖驗證。Why: 純看 HTML 很容易誤判畫面實際狀態。
- 不要在 MVP 階段新增 `CLAUDE.md` 中 `Frozen systems` 列出的系統。Why: 這些系統會讓核心循環驗證失焦。
- 不要一次混改多個 step 的需求。Why: 此專案依賴分階段驗證，混改會提高回歸風險。
- 第一輪不要調整 `prompts/` 內遺傳算法基準值（例如 10% 突變、5% 劣化）。Why: 先確認設計是否成立，再調參數。
- 不要在未實際打開瀏覽器驗證前就宣稱可用或直接提交。Why: 這個專案過去已明確把「先點過再說」列為流程要求。

## 高優先不變式
- 老化只在賽事回合結束後觸發，由 `advanceFromRacing()` 統一處理。Why: 這是壽命限制節奏的核心。
- 三圍預設 clamp 在 `1–100`；只有印記 `M01` 可把速度上限提高到 `115`。Why: 防止數值爆表破壞育種判讀。
- `game.horses.length` 不可超過 `game.stableSize`；超出的新生或新買馬改進 `game.bench`。Why: active roster 是受控資源，bench 才是緩衝。
- 交配時只有主動方必須 `racedThisTurn === true`；被選方可來自 active 或 bench。Why: Stage E 的兩步交配 UI 與規則就是這樣設計。
- 每匹馬每年作為主動方只能配 1 胎，且全年主動交配總數上限 6。Why: 防止育種節奏被單一高 OVR 種馬洗版。
- `TRACK_DEFS` 只允許 `長平原`、`髮夾彎`、`爬山`。Why: Stage F 已明確淘汰「起伏不定」。
- `simulateRaceMatch()` 必須維持 self-contained，只回傳結果；真正寫入狀態在 `applyRaceOutcome()`。Why: replay、跳過動畫與結算必須可分離。

## 文件維護
- 完成新 stage 或重大功能後，要同步更新 `CLAUDE.md` 的 `Current state` 日期與 `Next actions`。Why: 這是全專案的進度主索引。
- 若解凍任一 Frozen system，要先在 `memory/` 補上 playtest 結論，再更新 `CLAUDE.md`。Why: 專案要求解凍必須有驗證依據。
- 若修改 `Game invariants`，先在 `memory/playtest_notes.md` 記錄原因。Why: 這類變更屬設計調整，不只是修 bug。

## 相關文件位置
- 主規範：`CLAUDE.md`
- 規格檔：`memory/stage_specs.md`
- 測試觀察：`memory/playtest_notes.md`
- 後續解凍清單：`memory/post-mvp-wishlist.md`
- 階段 prompts：`prompts/step-1-time-and-horse.md`、`prompts/step-2-races.md`、`prompts/step-3-breeding.md`
