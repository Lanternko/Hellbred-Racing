# Stage 規格詳細（從 CLAUDE.md 移出）

CLAUDE.md 保留一行摘要；完整規格在此。最後更新：2026-04-27。

---

## Stage C — 特性系統

**遺傳模型：**
- 藍特（A型隱性）：雙親同位點 → 顯現 70%（B08 提升至 85%）；單親攜帶 → 隱性傳遞 50%（B08 提升至 80%）
- 紅特（B型顯性）：單親 55% / 雙親 85% 繼承；**3% 每育種突變率**；初始馬 8% / 市場馬 12% 自然帶有
- 金特（C型突變）：每育種 2% 機率，各金特等機率
- B11 傳說遺志（藍特但特殊）：死亡觸發，不走遺傳模型

**藍特（BUFF，A型遺傳）：**
| ID | 名稱 | 效果 |
|---|---|---|
| B01 | 火足 | 火焰賽道 +8% |
| B02 | 長毛 | 冰雪賽道 +8% |
| B03 | 駱駝 | 沙漠賽道 +8% |
| B04 | 神山 | 爬山地形 +10% |
| B05 | GTR | 長平原地形 +10% |
| B06 | 越野 | 起伏地形 +10% |
| B07 | 全能 | 每持有 1 個其他藍特額外 +3% |
| B08 | 繁殖專家 | 藍特遺傳率提升（單親 50→80%，雙親 70→85%）|
| B11 | 傳說遺志 | 死亡時，隨機 1 顯性特性傳給隨機 1 先發馬 |

**紅特（DEBUFF，B型顯性遺傳）：**
| ID | 名稱 | 效果 |
|---|---|---|
| R01 | 燃盡 | 每場出賽後速度永久 -1 |
| R02 | 偏科 | 非對應賽道戰力 -20% |
| R03 | 膽小 | 大典必敗，無視戰力 |
| R04 | 裸體 | 參賽時自身所有特性效果失效（仍可遺傳）|
| R05 | 紅顏薄命 | Age 4 直接死亡 |
| R06 | 暴食 | 每年 -1G 飼料費 |
| R09 | 不育 | 所有特性遺傳機率 ×0.75 |
| R12 | 嫉妒心 | roster 中 OVR 最高時 +10%；非最高時 -10% |

**金特（強力BUFF，C型突變）：**
| ID | 名稱 | 效果 |
|---|---|---|
| G01 | 地獄之王 | Ragnarök 中所有屬性視為匹配 |
| G02 | 鳳凰之血 | 死亡時 30% 機率以 Age 0 重生（一次性，移除 G02）|
| G03 | 芙莉蓮 | 永不進靈魂區；可進替補席仍繁殖；每 2 年三圍各 -5 |
| G04 | GOAT | 所有賽事全賽道適應（非限 Ragnarök）|
| G05 | 黑馬 | OVR 低於場均 20 以上時戰力 ×1.4 |

**獸醫建言（瓦拉克博士）判定順序：**
金特共鳴 → 雙親紅特共鳴 → 單親紅特 → 隱性位點交集（含 B07/B08 暗示）→ 血統相性 fallback

**馬匹欄位：** `traits: { displayed: [], recessiveFlags: [] }`

---

## Stage D — 6-turn cycle + 印記

**回合結構**（30 turn = 5 cycle）：

| Turn | 類型 | 活動 |
|---|---|---|
| T1/2/4/5 | 活動 | 三選一 modal（特性卡 / 稀有馬場 buff）無賽事 |
| T3/9/15/21/27 | 小賽事 | 普通比賽，可買馬 / 交配 |
| T6/12/18/24/30 | 大典 | 冠軍印記三選一，可買馬 / 交配 |

T30 大典後 → 玩家手動按鈕進 Ragnarök 終局

**金幣 down-scale（÷100 版）：**
- 起始 10G / 普通賽 +3 勝 +1 敗 / 大典 +10 勝 +2 敗 / 買馬 1–12G / R06 暴食 -1G/年

**馬廄 fix size：**
- 初始 6 格；每大典（T6/12/18/24/30）+1 格；T30 後最終 11 格
- 滿格時無法買馬 / 接受新生兒（G02 鳳凰重生仍進靈魂區）

**交配年齡：** 1–4 歲均可（補償馬廄縮小）；5 歲進靈魂區後不可

**印記（A型隱性遺傳，每馬最多 1 枚）：**
- 取得：大典冠軍，從未擁有的印記三選一
- 遺傳：雙親同印記 70% 顯現 / 單親 50% 隱性傳遞
- M01 無瑕之眼：速度上限 100 → 115
- M02 戰神血脈：大典中三圍視為 +10
- 待解凍（Run #2 後）：不朽鋼骨（力量抗劣化）/ 無盡氣血（體力抗退化）/ 鬼血傳承（子代突變率 10→30%）

**馬匹新欄位：** `marks: []`（max 1）、`marksRecessive: []`

---

## Stage E — 替補席 + Phase Lock

**馬廄拆分：**
- `game.horses` = **active roster**（先發），cap = `stableSize`（6→11）
- `game.bench` = **替補席**，無上限；bench 馬不可參賽 / 交配

**subPhase 流程**（race / major turn 才走，event turn 跳過）：
1. `roster`：整隊（下放 / 上場），按「整隊完成」推進
2. `racing`：全員出戰 → 賽完 → 自動進 breeding
3. `breeding`：黑市 + 交配所開啟 → 按「下一年」推進

**育種規則：**
- 雙親 `racedThisTurn === true`（必須當年完賽）才可交配
- 公馬：當年最多 1 胎（`father.bredThisTurn` block）
- 母馬：無胎次限制（active cap 自然壓制）
- 智能交配自動避免重用同一公馬

**新買 / 新生馬本年凍結：** 購入或生出時 `racedThisTurn = true` & `bredThisTurn = true`，不可當年參賽或交配。

**自動入替：** active 有空位 → `promoteFromBench()` 高 OVR 優先補上

**UI class 鎖：** body 加 `subphase-{event|roster|racing|breeding}` / `phase-{init|end}`，CSS 隱藏不相干區塊

**命名平民化：** 千年 → 年、千年大典 → 大典、下一個千年 → 下一年（`yearsElapsed` 內部仍 1000 倍數，顯示 `/ 1000`）

---

## Stage F — tick-based 賽事動畫

**Status：規格凍結**。建議 Stage E Playtest #2 完成後啟動實裝；但技術上可直接實裝，風險自評。

### 觸發時機

```js
shouldAnimate(raceType) {
  return game.settings.animationsEnabled &&
         (raceType === 'grand' || raceType === 'final');
}
// 小賽事 / event turn → instant resolve
// 全域開關：game.settings.animationsEnabled（預設 true）
```

### 三個公開介面

```
simulateRaceMatch(horse, opponent, context) → raceTimeline
renderRaceReplay(raceTimeline, { onComplete, onSkip })
applyRaceOutcome(raceTimeline) → 永久狀態（R01 損耗 / racedThisTurn / 獎金 / 印記）
```

`context = { turn, raceType: 'grand'|'minor'|'event', track: { type }, seed }`

大典 2 名額由上層 racing subPhase 管理，不是 engine 的責任。

### 進度尺度：0..1（不用 100）

```js
race = {
  seed,            // 固定 seed → simulateRaceMatch 為純函式，動畫只是 replay
  tickCount: 60,   // 60 tick × 100ms ≈ 6s；第一匹衝線後延 5 tick 才截止
  segments: [
    { range: [0.00, 0.20], type: 'start'    },
    { range: [0.20, 0.60], type: 'straight' },
    { range: [0.60, 0.85], type: 'curve'    },
    { range: [0.85, 1.00], type: 'final'    }
  ],
  runtime: { [horseId]: { progress, powerDebuff, flags: {}, log: [] } },
  timeline: [ { t, positions, events } × 60 ],
  result:   { order, times }   // 供 applyRaceOutcome 使用
}
```

**每 tick 位移公式：**
```
ability       = (speed * 0.6 + power * 0.4) / 100        // 0..1
targetTicks   = lerp(90, 45, ability)                     // 弱馬 90 tick / 強馬 45 tick
baseDelta     = 1 / targetTicks
staminaFactor = max(0.5, 1 - (t/tickCount) * (1 - stamina/100) * 0.8)
delta         = baseDelta * staminaFactor * traitMul * jitter(seed, horseId, t)
```

### race-local vs horse 本體

| 在哪改 | 內容 |
|---|---|
| `race.runtime[id]` | tick 期間暫態（flags / debuff / 進度）|
| `applyRaceOutcome()` | 永久損耗（R01 速度 -1）/ `racedThisTurn = true` / 獎金 |

Skip 動畫 → 直接讀 `race.timeline[last]` → 呼叫 `applyRaceOutcome`，不重模擬。

### Hook 分類（新舊共存）

| Hook | 用途 | 示例特性 |
|---|---|---|
| `onPreRace(ctx, horse, roster)` | 賽前倍率 / 強制失敗 / 抑制其他特性 | R03 必敗 / R04 裸體 / R12 嫉妒心 / B01-06 賽道 |
| `onTick(horse, t, seg, runtime)` | 分段 / 名次觸發 | G05 黑馬 / G01 GOAT（衝刺段）|
| `onPostRace(horse, race)` | 賽後永久損耗 | R01 燃盡 speed -1 |
| `onYearEnd(horse, game)` | 年度非賽事效果 | R06 暴食 / G03 芙莉蓮衰減 |
| `onDeath(horse, game)` | 死亡觸發 | G02 鳳凰之血 / B11 傳說遺志 |

R04 `suppressOtherTraits: true` → engine 遇到此 flag 跳過該馬其他 onTick hook。

### 邊界 / 平手規則

- **跨段偵測**：每 tick 若 `prev < seg.start <= next`，補一筆 `enterSegment` 事件，避免 tick 步長跳過觸發點。
- **平手判定**（固定 seed 下 deterministic）：完賽 tick 小者贏 → 同 tick 比 progress 餘量 → 仍同則比 `speed → power → stamina → id` 字典序。

### ASCII 渲染

```
T18 ─ 第三屆大典 ─────────────  tick 42/60   [跳過 ▶▶]
──────────────────────────────────────────────
1│ 闇影 風煞   ━━━━━━━━━━━━━━━━━━━━━━━╸🐴 ░░░  85%
2│ 黑霧 緋焰   ━━━━━━━━━━━━━━━━━━━━╸🐴   ░░░░  79% ⚡衝刺爆發
3│ 烏鴉 之嗣   ━━━━━━━━━━━━━━━━╸🐴       ░░░░  64% 🔥燃盡 -1 速度
──────────────────────────────────────────────
```

事件文字只顯示最近 1–2 tick，不滾版。

### 不變式（補入 Game invariants）

- `simulateRaceMatch` 為純函式：不讀 `Date.now()` / `Math.random()`，所有亂數透過 seeded RNG。
- `applyRaceOutcome` 每場只能呼叫一次；engine 不直接改 `horse.*`，含 `racedThisTurn`。
- `renderRaceReplay` 可被 skip，不影響 `raceTimeline` 或 `applyRaceOutcome` 的正確性。
