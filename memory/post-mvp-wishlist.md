# Post-MVP Wishlist — 解凍紀錄

從 2026-04-26 Run #1「不好玩」之後衍生的功能想法。原則：一次解凍 1 條 → playtest → 判斷是否拉回好玩 → 否則砍。

## 已解凍並實作（2026-04-27 一次到位，未照「一條一條」流程）

> **流程備註**：原規劃逐條解凍 + 每條 playtest 驗證；實際上 2026-04-27 一天內把全部候選都實作了。Run #2 還沒跑，所以這些是否真的有把遊戲拉回好玩**仍未驗證**。Playtest Run #2 必跑。

### 1. 靈魂區 / Ragnarök → Stage B
死馬不消失，進入 `game.souls`，T30 後玩家手動進入 Ragnarök 終局決戰四王。

### 2. 大典 + 技能獎勵 → Stage B
原案是「每 5 年大事件」。實作為 6-turn cycle 中 T6/12/18/24/30 大典（Stage D 改），勝者獲得技能（疾風/霸力/鋼魂）或印記三選一。

### 3. 五行屬性 + 遺傳 + Course 加成 → Stage C 特性系統
未走「水火木」路線，改為 Fire/Ice/Sand/Normal 四屬性 + 爬山/長平原/起伏不定地形。馬匹的屬性偏好走藍特（B01–B06）+ 隱性遺傳。

### 4. Course 屬性 + 地形偏好 → 與 #3 合併
RACE_TYPES 每場有 attr + terrain，搭配藍特做加減乘。

### 5. 突變給技能 → Stage C 金特
未直接走「突變給技能」，改為 2% 育種突變率出金特（G01 地獄之王 / G02 鳳凰之血）。

## 額外解凍（不在原 wishlist 內）

- **Stage D 印記系統** — 大典冠軍三選一隱性遺傳印記（無瑕之眼 / 戰神血脈）
- **Stage E 替補席 + 賽事優先** — active/bench 拆分、雙親參賽過才能交配、公馬一胎/年、subPhase 流程鎖
- **稀有度 + 卡片系統** — 馬廄／靈魂依 OVR 6 段稀有度上色，點開詳細卡 modal，突變 / 金特觸發翻牌驚喜
- **命名系統** — 6 風格字庫，姓繼強者 origin、名取弱者 origin

## 永久不解凍

- 卡牌系統（CLAUDE.md Frozen #1）
- 花錢升級馬廄（CLAUDE.md Frozen #2，Stage D 自動升級走 fixed-progress 不算解凍）
- 理財工具（CLAUDE.md Frozen #3）
- 美術 / 音效 / 動畫 juice（CLAUDE.md Frozen #5）

## 下一步

Playtest Run #2（自己連玩 ≥ 1 場 + 1 朋友玩）→ 寫 [playtest_notes.md](playtest_notes.md) Run #2 區塊 → 看「現在這麼多系統疊在一起是否反而更不好玩 / 哪幾個 Stage 是真正的好玩貢獻者」。
