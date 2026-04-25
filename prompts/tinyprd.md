# Hellbred-Racing TinyPRD

**Genre**: 育成 / 文字管理
**Platform**: browser（純 HTML + JS 單檔）
**Engine**: 無框架，Claude artifact 輸出單檔 `index.html`

## Core loop（3 句內）
1. 玩家點「下一個千年」推進回合 → 馬匹老化、巔峰馬可參賽、金幣入帳。
2. 退役的公母馬可交配 → 子代繼承父母均值 + 突變（+20）/ 劣化（-15）。
3. 玩家想再做一次的理由：「下一胎可能爆出 95+ 三圍極品」的賭博循環。

## MVP scope（≤3 系統，對應 prompts/）
- 時間軸 + 馬匹年齡狀態機（[step-1](step-1-time-and-horse.md)）
- 自動賽事 + 金幣經濟（[step-2](step-2-races.md)）
- 黑市買種馬 + 交配遺傳算法（[step-3](step-3-breeding.md)）

## Frozen
見 [CLAUDE.md](../CLAUDE.md) `## Frozen systems`。

## Done = ?
自己連玩 ≥ 5 場（每場 30 回合），其中 ≥ 3 場結束時主動「再開一局」想試下一胎；外加 1 個朋友玩 1 場、不靠講解能知道下一步該做什麼。任一條沒達成 → 不視為驗證成功，回頭調數值或重看核心循環。

## Risk
經濟與遺傳兩系統的數值平衡點（賽事獎金 / 黑市價格 / 突變率 / 退役起算年齡）只能跑完整局看出崩壞，第一輪幾乎一定會壞。緩解：[memory/playtest_notes.md](../memory/playtest_notes.md) 一輪只改一個變數，避免歸因混亂。

## Open questions（要靠 playtest 答的設計題）
1. 30 回合是否夠長到讓玩家看見 ≥ 3 代基因傳承？太短的話傳承感不會出來。
2. 黑市馬與自家退役馬的競爭關係：玩家會不會懶得自己留種，每代都靠買？
3. 賽事爆冷率（±20% 浮動）是否會造成「明明養出極品卻被弱馬撞掉」的挫折感？
