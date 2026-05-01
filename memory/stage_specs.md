# Stage 規格詳細（從 CLAUDE.md 移出）

CLAUDE.md 保留一行摘要；完整規格在此。最後更新：2026-05-01。

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
| B06 | 越野 | 髮夾彎賽道 +10% |
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

## Stage F — 物理引擎賽事

**Status：實裝完成**。從原本的「弱馬 90 tick / 強馬 45 tick lerp」抽象規格，演化成「每 tick 算 vel/pos/stam 的物理模擬」。賽道由 segments 組成，氣候影響全程倍率。

### 三個公開介面

```js
simulateRaceMatch(horse, opponent, context) → result {
  seed, horse, opponent, isMajor, raceType, won, r03Forced, traitMul, timeline, track
}
renderRaceReplay(result, onComplete)        // ASCII 動畫，可 skip
applyRaceOutcome(result)                    // 寫入 racedThisTurn / R01 損耗 / 獎金 / 印記 / log
```

`context = { isMajor, raceType, seed? }`；seed 預設亂數，固定 seed 下 simulateRaceMatch 為 deterministic。

### 賽道（TRACK_DEFS）

| 名稱 | 全長 | Segments |
|---|---|---|
| 長平原 | 2400m | straight 700 → mildCurve 300 → straight 800 → sprint 600 |
| 髮夾彎 | 1600m | straight 400 → hairpin 200 → straight 400 → hairpin 200 → sprint 400 |
| 爬山 | 1200m | straight 200 → climb 600 → descent 200 → sprint 200 |

**Segment 行為**（`segmentBehavior(seg, P, climateMods)`）：

| Kind | capMul | drainMul | recover | 備註 |
|---|---|---|---|---|
| straight | 1.00 | 1.00 | 0 | — |
| mildCurve | `0.75 + P/400`（P50→0.875, P100→1.00）| 1.00 | 0 | 力量越高越不掉速 |
| hairpin | `0.50 + P/250`（P50→0.70, P100→0.90）| 1.00 | 0 | 同上，懲罰更重 |
| climb | `max(0.3, P/100)` | 1.10 | 0 | 力量決定爬坡上限 |
| descent | 1.00 | 0.50 | 0.5 | 順勢回體力 |
| sprint | 1.05 | 1.50 | 0 | 衝線段，重耗體力 |

### 氣候（CLIMATE_MODS）

| 屬性 | maxSpeedMul | accelMul | drainMul | curvePenaltyMul | 適應特性 |
|---|---|---|---|---|---|
| Normal | 1.00 | 1.00 | 1.00 | 1.00 | — |
| Fire | 1.00 | 1.00 | 1.15 | 1.00 | B01 火足 |
| Ice | 1.00 | 0.90 | 1.00 | 1.00 | B02 長毛 |
| Sand | 0.95 | 1.00 | 1.00 | 1.00 | B03 駱駝 |

**反向加成**（`effectiveClimate()`，僅對適應特性持有者）：
- B01 火足 → maxSpeedMul: **1.05**（覆蓋 Fire 的 1.00）
- B02 長毛 → curvePenaltyMul: **0.50**（彎道懲罰減半）
- B03 駱駝 → drainMul: **0.90**（覆蓋 Sand）

R04 裸體：跳過適應加成，吃完整 debuff。

### 物理參數（STAT_FORMULA）

```js
maxSpeed:    s => 12 + s * 0.10        // m/s,  s100 → 22 m/s
accel:       p => 0.5  + p * 0.04      // m/s², p100 → 4.5 m/s²
staminaPool: e => 50   + e             // 體力池, e100 → 150
drainAtSpeed: v => v * 0.05            // 每 tick 體力消耗
```

### 模擬迴圈（每 tick）

```js
// per horse:
seg = getSegmentAt(track, rt.pos);
beh = segmentBehavior(seg, P, climateForSeg);
fatigueRatio = rt.stam / pool;
fatigue = fatigueRatio < 0 ? 0.55 : (fatigueRatio < 0.30 ? 0.85 : 1.00);
cap    = maxSpeed * beh.capMul * extraMul;          // extraMul: G05 黑馬衝刺爆發 1.40
target = cap * fatigue * (0.97 + rng() * 0.06);
dv     = clamp(target - rt.vel, -accel * 1.5, accel);
rt.vel = max(0, rt.vel + dv);
rt.pos += rt.vel;
rt.stam -= STAT_FORMULA.drainAtSpeed(rt.vel) * beh.drainMul * climateDrainMul;
rt.stam += beh.recover;
```

`RACE_TICK_CAP = 250`；任一匹衝線（`pos >= track.length`）即結束。

### 玩家側特性整合（applyTraitMultiplier 維持，物理層額外計）

- **traitMul**（前置乘倍）：`applyTraitMultiplier(horse, attr, terrain)` 套用 B01-B06 + B07 + R02。R04 將 traitMul 設 1.0。
- **R12 嫉妒心**：roster 中 OVR 最高 ×1.10，否則 ×0.90。
- **R03 玻璃心**：大典 hGlobalMul 直接 ×0.01（必輸）。
- **G05 黑馬**：sprint 段位置落後對手 200m 以上時觸發一次 1.40× cap，僅一次。
- **M01 無瑕之眼**：speed clamp 上限 100 → 115。
- **M02 戰神血脈**：大典中 speed/power/stamina 各 +10。

### 不變式

- `simulateRaceMatch` 透過 `mulberry32(seed)` 取亂數；context 傳固定 seed → deterministic。
- `applyRaceOutcome` 每場呼叫一次；engine 不直接改 `horse.racedThisTurn`，由 applyRaceOutcome 寫入。
- `renderRaceReplay` 純 replay timeline，可被 skip 不影響 outcome 正確性。
- 對手模擬不吃適應加成（敵方無 traits）。
- TRACK_DEFS 鍵集合凍結為 `長平原 / 髮夾彎 / 爬山`，新增賽道需同步改 RACE_TYPES + B06 desc + 對應 segments。
