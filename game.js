// game.js — 遊戲狀態 + 邏輯（馬匹生成 / 育種 / 物理引擎 / AI / Ragnarök）
// 依賴：data.js（常數與資料表）、names.js（命名）、card.js（馬匹卡片）
// 不依賴 render.js — render() 與 renderRaceReplay() 由 render.js 在運行時提供。

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function statusFromAge(age) {
    if (age <= 0) return STATE_FOAL;
    if (age <= 4) return STATE_PEAK;
    return STATE_RETIRED;
  }

  function newHorseName(origin) {
    const o = origin || randomOrigin();
    return { ...generateHorseName(o), origin: o };
  }

  function makeHorse({ age = 0 } = {}) {
    const a = Math.max(0, Math.floor(age));
    const recessiveFlags = Math.random() < 0.6 ? [pick(BLUE_IDS)] : [];
    const displayed = Math.random() < 0.08 ? [{ id: pick(RED_IDS), type:'red' }] : [];
    const origin = randomOrigin();
    const { surname, givenName, name } = generateHorseName(origin);
    return {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()),
      origin, surname, givenName, name,
      gender: Math.random() < 0.5 ? 'male' : 'female',
      age: a,
      speed: clamp(randInt(30, 70), 1, 100),
      power: clamp(randInt(30, 70), 1, 100),
      stamina: clamp(randInt(30, 70), 1, 100),
      status: statusFromAge(a),
      racedThisTurn: false,
      bredThisTurn: false,
      skill: null,
      traits: { displayed, recessiveFlags },
      marks: [],
      marksRecessive: [],
      parents: null,
    };
  }

  function effectiveStat(h, stat) {
    return h[stat] + (h.skill && h.skill.stat === stat ? h.skill.bonus : 0);
  }
  function totalStats(h) {
    return effectiveStat(h, 'speed') + effectiveStat(h, 'power') + effectiveStat(h, 'stamina');
  }

  function makeEnemy() {
    const turn = game.yearsElapsed / game.yearPerTurn;
    const base = Math.floor(turn * 1.5);
    const stat = () => clamp(randInt(20 + base, 40 + base), 1, 100);
    return {
      name: pick(ENEMY_NAMES),
      speed: stat(),
      power: stat(),
      stamina: stat()
    };
  }

  function makeMarket() {
    // 保證至少 1 公 1 母，其餘隨機
    const horses = [makeMarketHorse('male'), makeMarketHorse('female')];
    for (let i = 2; i < 4; i++) horses.push(makeMarketHorse());
    return horses.sort(() => Math.random() - 0.5); // 隨機排序避免公馬永遠在前
  }

  function makeMarketHorse(forcedGender) {
    const turn = game.yearsElapsed / game.yearPerTurn;
    const lo = Math.min(35 + Math.floor(turn), 60);
    const hi = Math.min(70 + Math.floor(turn), 95);
    const stat = () => clamp(randInt(lo, hi), 1, 100);
    const speed = stat(), power = stat(), stamina = stat();
    const mAge = randInt(1, 4);
    const mOrigin = randomOrigin();
    const { surname: mSurname, givenName: mGiven, name: mName } = generateHorseName(mOrigin);
    const mSkill = Math.random() < 0.15 ? pick(SKILL_LIST) : null;
    const mOvr = Math.round((speed + power + stamina) / 3);
    const skillBonus = mSkill ? 3 : 0;
    return {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()),
      origin: mOrigin, surname: mSurname, givenName: mGiven, name: mName,
      gender: forcedGender || (Math.random() < 0.5 ? 'male' : 'female'),
      age: mAge,
      speed, power, stamina,
      status: statusFromAge(mAge),
      racedThisTurn: false,
      bredThisTurn: false,
      price: Math.max(1, Math.round(mOvr * (5 - mAge) / 20) + skillBonus + randInt(0, 2)),
      skill: mSkill,
      traits: (() => {
        const allPool = [...BLUE_IDS.map(id=>({id,type:'blue'})), ...RED_IDS.map(id=>({id,type:'red'}))];
        const displayed = Math.random() < 0.35 ? [pick(allPool)] : [];
        return { displayed, recessiveFlags: [pick(BLUE_IDS)] };
      })(),
      marks: [],
      marksRecessive: [],
    };
  }

  function makeEventChoice() {
    // 從 EVENT_CARDS pool 加權抽 3 張不重覆（weighted random sampling without replacement）
    const pool = EVENT_CARDS.map(c => ({ ...c }));
    const cards = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const total = pool.reduce((s, c) => s + (c.weight || 1), 0);
      let roll = Math.random() * total;
      let pickIdx = pool.length - 1;
      for (let k = 0; k < pool.length; k++) {
        roll -= (pool[k].weight || 1);
        if (roll <= 0) { pickIdx = k; break; }
      }
      cards.push(pool.splice(pickIdx, 1)[0]);
    }
    return { kind: 'event', cards };
  }

  function applyChoiceCard(card) {
    if (card.kind === 'trait') {
      // 套用至 OVR 最高且尚未持有此特性的現役馬
      const candidates = game.horses
        .filter(h => h.traits && !h.traits.displayed.some(t => t.id === card.traitId))
        .sort((a, b) => ovrOf(b) - ovrOf(a));
      if (!candidates.length) {
        addLog(`活動「${card.title}」無對象可施加（馬廄空或全員已有此特性）`, 'death');
        return;
      }
      const target = candidates[0];
      target.traits.displayed.push({ id: card.traitId, type: 'blue' });
      addLog(`活動「${card.title}」→ ${target.name} 獲得藍特：${TRAIT_DATA[card.traitId].name}`, 'soul');
    } else if (card.kind === 'marketBuff') {
      game.nextMarketBuff = true;
      addLog(`活動「${card.title}」→ 下一年黑市馬匹 +15 三圍`, 'soul');
    } else if (card.kind === 'marketDiscount') {
      game.nextMarketDiscount = true;
      addLog(`活動「${card.title}」→ 下一年黑市三圍 +15、價格不變`, 'soul');
    } else if (card.kind === 'gold') {
      game.money += card.amount;
      addLog(`活動「${card.title}」→ 獲得 ${card.amount}G`, 'soul');
    } else if (card.kind === 'foal') {
      const foal = makeHorse({ age: 0 });
      foal.racedThisTurn = true;
      foal.bredThisTurn = true;
      game.bench.push(foal);
      addLog(`活動「${card.title}」→ 替補席收容幼駒 ${foal.name}（${foal.gender === 'male' ? '公' : '母'}）`, 'soul');
    }
  }

  function makeMarkChoice(winnerHorse) {
    // 從 MARK_IDS 排除馬已持有的，最多 3 張（目前池子只有 2 張，所以是 0/1/2）
    const owned = new Set((winnerHorse.marks || []).map(m => m.id));
    const available = MARK_IDS.filter(id => !owned.has(id));
    if (!available.length) return null;
    const cards = available.map(id => ({
      id: 'MARK_' + id,
      kind: 'mark',
      markId: id,
      horseId: winnerHorse.id,
      title: MARK_DATA[id].name,
      desc: MARK_DATA[id].desc,
    }));
    return { kind: 'mark', cards, context: { horseId: winnerHorse.id } };
  }

  function awardMark(horse, markId) {
    if (!horse.marks) horse.marks = [];
    if (!horse.marksRecessive) horse.marksRecessive = [];
    if (horse.marks.length >= 1) return; // 每馬最多 1 印記
    horse.marks.push({ id: markId });
    // 即時效果
    if (markId === 'M01') {
      // 無瑕之眼：speed +15，cap 提升至 115
      horse.speed = Math.min(115, horse.speed + 15);
    }
    addLog(`✨ ${horse.name} 獲得印記：${MARK_DATA[markId].name}`, 'soul');
  }

  function speedCapOf(horse) {
    return horse.marks && horse.marks.some(m => m.id === 'M01') ? 115 : 100;
  }

  function getVetAdvice(father, mother) {
    if (!father || !mother) return null;
    const fReds = father.traits.displayed.filter(t => t.type === 'red');
    const mReds = mother.traits.displayed.filter(t => t.type === 'red');
    if (fReds.find(ft => mReds.some(mt => mt.id === ft.id))) return VET_LINES.redDouble;
    if (fReds.length || mReds.length) return VET_LINES.redSingle;
    const fPool = new Set([
      ...father.traits.recessiveFlags,
      ...father.traits.displayed.filter(t => t.type === 'blue').map(t => t.id),
    ]);
    const mPool = new Set([
      ...mother.traits.recessiveFlags,
      ...mother.traits.displayed.filter(t => t.type === 'blue').map(t => t.id),
    ]);
    const shared = [...fPool].find(id => mPool.has(id));
    if (shared && VET_LINES['recessive' + shared]) return VET_LINES['recessive' + shared];
    const avgDiff = (Math.abs(father.speed - mother.speed) +
                    Math.abs(father.power  - mother.power)  +
                    Math.abs(father.stamina- mother.stamina)) / 3;
    if (avgDiff > 30) return VET_LINES.highDiff;
    if (avgDiff < 10) return VET_LINES.lowDiff;
    return VET_LINES.normal;
  }

  function breedTraits(father, mother) {
    const displayed = [];
    const recessiveFlags = [];
    const addD = t => { if (!displayed.some(x => x.id === t.id)) displayed.push(t); };
    const addR = id => { if (!recessiveFlags.includes(id)) recessiveFlags.push(id); };

    const fBlues = new Set([
      ...father.traits.recessiveFlags,
      ...father.traits.displayed.filter(t => t.type === 'blue').map(t => t.id),
    ]);
    const mBlues = new Set([
      ...mother.traits.recessiveFlags,
      ...mother.traits.displayed.filter(t => t.type === 'blue').map(t => t.id),
    ]);
    const b08Boost =
      father.traits.displayed.some(t => t.id === 'B08') ||
      mother.traits.displayed.some(t => t.id === 'B08');
    const bothRate   = b08Boost ? 0.85 : 0.70;
    const singleRate = b08Boost ? 0.80 : 0.50;
    for (const id of new Set([...fBlues, ...mBlues])) {
      if (fBlues.has(id) && mBlues.has(id)) {
        Math.random() < bothRate ? addD({ id, type:'blue' }) : addR(id);
      } else if (Math.random() < singleRate) {
        addR(id);
      }
    }

    const allRedIds = new Set([
      ...father.traits.displayed.filter(t => t.type === 'red').map(t => t.id),
      ...mother.traits.displayed.filter(t => t.type === 'red').map(t => t.id),
    ]);
    for (const id of allRedIds) {
      const fH = father.traits.displayed.some(t => t.id === id);
      const mH = mother.traits.displayed.some(t => t.id === id);
      if (Math.random() < (fH && mH ? 0.85 : 0.55)) addD({ id, type:'red' });
    }

    if (Math.random() < 0.03) {
      const newRed = pick(RED_IDS);
      if (!displayed.some(t => t.id === newRed)) addD({ id: newRed, type:'red' });
    }

    const goldTriggered = Math.random() < 0.02;
    if (goldTriggered) {
      addD({ id: Math.random() < 0.5 ? 'G01' : 'G02', type:'gold' });
    }
    return { displayed, recessiveFlags, goldTriggered };
  }

  function breedMarks(father, mother) {
    // A 型隱性：雙親同印記 70% 顯現；單親持有 50% 隱性傳遞。每馬 max 1 顯性。
    const displayed = [];
    const recessive = [];
    const fMarks = new Set([
      ...((father.marks || []).map(m => m.id)),
      ...((father.marksRecessive || [])),
    ]);
    const mMarks = new Set([
      ...((mother.marks || []).map(m => m.id)),
      ...((mother.marksRecessive || [])),
    ]);
    for (const id of new Set([...fMarks, ...mMarks])) {
      if (fMarks.has(id) && mMarks.has(id)) {
        if (Math.random() < 0.70 && displayed.length < 1) {
          displayed.push({ id });
        } else {
          recessive.push(id);
        }
      } else if (Math.random() < 0.50) {
        recessive.push(id);
      }
    }
    return { displayed, recessive };
  }

  function applyTraitMultiplier(horse, attr, terrain) {
    const d = horse.traits ? horse.traits.displayed : [];
    if (d.some(t => t.id === 'R04')) return 1.0;
    let m = 1.0;
    // B01/B02/B03 的氣候適應由 effectiveClimate() 處理，這裡不再重複加成
    if (terrain === '爬山'   && d.some(t => t.id === 'B04')) m += 0.10;
    if (terrain === '長平原' && d.some(t => t.id === 'B05')) m += 0.10;
    if (terrain === '髮夾彎' && d.some(t => t.id === 'B06')) m += 0.10;
    if (d.some(t => t.id === 'B07')) {
      const otherBlue = d.filter(t => t.type === 'blue' && t.id !== 'B07').length;
      m += 0.03 * otherBlue;
    }
    if (d.some(t => t.id === 'R02')) {
      const matches = attr === 'Normal' ||
        (attr === 'Fire' && d.some(t => t.id === 'B01')) ||
        (attr === 'Ice'  && d.some(t => t.id === 'B02')) ||
        (attr === 'Sand' && d.some(t => t.id === 'B03'));
      if (!matches) m -= 0.20;
    }
    return m;
  }

  const ovrOf = h => Math.round(totalStats(h) / 3);

  const game = {
    yearsElapsed: 0,
    maxYears: 30000,
    yearPerTurn: 1000,
    money: 10,
    horses: [],
    souls: [],
    market: [],
    races: [],
    log: [],
    stableExpanded: false,
    infoDrawerOpen: false,
    currentTurnMajor: false,
    currentTurnPhase: 'race', // 'event' | 'race' | 'major'
    ragnarok: null,
    breedPrimaryId: null,
    breedSecondaryId: null,
    stableSize: 6,
    bench: [],
    subPhase: null, // 'roster' | 'racing' | 'breeding' | null (event turn)
    currentRace: null, // { name, attr, terrain } — 整年共用同一賽道，event turn 為 null
    nextRacePreview: null, // { race, turn, isMajor } — 活動 turn 預告下一場
    batchRacedThisTurn: false,
    primariesThisYear: 0,
    _raceQueue: null,
    nextMarketBuff: false,
    nextMarketDiscount: false,
    pendingChoice: null, // { kind: 'event'|'mark', cards: [...], context: {...} }
    pendingChoiceQueue: [],
    settings: { animationsEnabled: true },
  };

  function allOwnedHorses() {
    return [...game.horses, ...game.bench];
  }

  function pushPending(choice) {
    if (!choice) return;
    if (!game.pendingChoice) game.pendingChoice = choice;
    else game.pendingChoiceQueue.push(choice);
  }
  function resolvePending() {
    game.pendingChoice = game.pendingChoiceQueue.shift() || null;
    if (game.pendingChoice) return;
    // 大典 race 流程仍在進行（queue 已建立但尚未收尾）→ 接手
    // 注意：queue 在 shift 後可能 length=0 但仍 != null；空時 runNextQueuedRace 會自動 advanceFromRacing
    if (game._raceQueue !== null) {
      runNextQueuedRace();
      return;
    }
    // 個別出戰路徑下 modal 解掉後也要檢查推進
    maybeAutoAdvanceRacing();
  }

  function init() {
    game.horses = [
      makeHorse({ age: 0 }),
      makeHorse({ age: 1 }),
      makeHorse({ age: 3 })
    ];
    game.market = makeMarket();
    addLog(`第 0 年 · 馬廄入駐 ${game.horses.length} 匹馬，等候惡魔之王的審判。`);
    render();
  }

  function ageAllHorses() {
    for (const h of allOwnedHorses()) {
      h.age += 1;
      h.status = statusFromAge(h.age);
    }
    let foodCost = 0;
    const foodEaters = [];
    for (const h of allOwnedHorses()) {
      if (h.traits && h.traits.displayed.some(t => t.id === 'R06')) {
        foodCost += 1;
        foodEaters.push(h.name);
      }
    }
    if (foodCost > 0) {
      game.money = Math.max(0, game.money - foodCost);
      addLog(`暴食特性 −${foodCost}G 飼料費（${foodEaters.join('、')}）`, 'death');
    }
    const ascending = [];
    const reborn = [];
    const ageOutFromArray = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const h = arr[i];
        const hasR05 = h.traits && h.traits.displayed.some(t => t.id === 'R05');
        if (h.age >= (hasR05 ? 4 : 5)) {
          const hasG02 = h.traits && h.traits.displayed.some(t => t.id === 'G02');
          if (hasG02 && Math.random() < 0.30) {
            h.age = 0;
            h.status = STATE_FOAL;
            h.racedThisTurn = false;
            h.bredThisTurn = false;
            h.traits.displayed = h.traits.displayed.filter(t => t.id !== 'G02');
            reborn.push(h.name);
          } else {
            ascending.push(arr.splice(i, 1)[0]);
          }
        }
      }
    };
    ageOutFromArray(game.horses);
    ageOutFromArray(game.bench);
    if (reborn.length) {
      addLog(`🔥 鳳凰之血燃燒：${reborn.join('、')} 以幼駒姿態重生！`, 'soul');
    }
    if (ascending.length) {
      game.souls.push(...ascending);
      addLog(`升入靈魂區：${ascending.map(h => h.name).join('、')}`, 'soul');
    }
    promoteFromBench();
  }

  // 找下一個賽事 turn（小賽事 T mod 6 = 3 / 大典 T mod 6 = 0）
  function findNextRaceTurnNumber(currentTurn) {
    for (let t = currentTurn + 1; t <= game.maxYears / game.yearPerTurn; t++) {
      const phase = ((t - 1) % 6) + 1;
      if (phase === 3 || phase === 6) return t;
    }
    return null;
  }

  // peek：當前若為賽事 turn 回傳 currentRace；若為活動回合則 lazy-roll 下一場並 cache
  function peekNextRace() {
    if (game.currentRace) return { race: game.currentRace, turn: game.yearsElapsed / game.yearPerTurn, isMajor: game.currentTurnMajor };
    if (!game.nextRacePreview) {
      const currentTurn = game.yearsElapsed / game.yearPerTurn;
      const t = findNextRaceTurnNumber(currentTurn);
      if (!t) return null;
      const isMajor = ((t - 1) % 6) + 1 === 6;
      game.nextRacePreview = { race: pick(RACE_TYPES), turn: t, isMajor };
    }
    return game.nextRacePreview;
  }

  function nextTurn() {
    if (game.yearsElapsed >= game.maxYears) return;
    // 老化在「賽事 turn breeding 完成 → 下一年」的瞬間觸發。
    // Why: 讓 age-4 馬在最後一年既能比賽也能交配，再升入靈魂區。
    // 活動 turn (subPhase === null) 維持不老化，避免老化頻率翻倍打壞數值平衡。
    if (game.subPhase === 'breeding') {
      ageAllHorses();
    }
    game.yearsElapsed += game.yearPerTurn;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const currentTurn = game.yearsElapsed / game.yearPerTurn;
    const phaseInCycle = ((currentTurn - 1) % 6) + 1; // 1..6
    if (phaseInCycle === 6) {
      game.currentTurnPhase = 'major';
      game.currentTurnMajor = true;
    } else if (phaseInCycle === 3) {
      game.currentTurnPhase = 'race';
      game.currentTurnMajor = false;
    } else {
      game.currentTurnPhase = 'event';
      game.currentTurnMajor = false;
    }
    if (currentTurn % 6 === 0) {
      game.stableSize += 1;
      addLog(`🏛 馬廄擴建 → ${game.stableSize} 格`, 'soul');
    }

    game.batchRacedThisTurn = false;
    game.primariesThisYear = 0;

    for (const h of allOwnedHorses()) {
      h.racedThisTurn = false;
      h.bredThisTurn = false;
    }

    const buffApplied = game.nextMarketBuff;
    const discountApplied = game.nextMarketDiscount;
    game.market = makeMarket();
    if (buffApplied) {
      game.market.forEach(m => {
        m.speed = clamp(m.speed + 15, 1, 100);
        m.power = clamp(m.power + 15, 1, 100);
        m.stamina = clamp(m.stamina + 15, 1, 100);
        const mOvr = Math.round((m.speed + m.power + m.stamina) / 3);
        const skillBonus = m.skill ? 3 : 0;
        m.price = Math.max(1, Math.round(mOvr * (5 - m.age) / 20) + skillBonus + randInt(0, 2));
        m._rare = true;
      });
      addLog(`✨ 稀有馬場開張 · 黑市馬匹三圍 +15`, 'soul');
      game.nextMarketBuff = false;
    }
    if (discountApplied) {
      // 三圍 +15 但不重算價格 — 用「特價」價標示
      game.market.forEach(m => {
        m.speed = clamp(m.speed + 15, 1, 100);
        m.power = clamp(m.power + 15, 1, 100);
        m.stamina = clamp(m.stamina + 15, 1, 100);
        m._discount = true;
      });
      addLog(`✨ 特價馬場開張 · 黑市三圍 +15、價格不變`, 'soul');
      game.nextMarketDiscount = false;
    }

    const phaseTag = game.currentTurnPhase === 'major' ? '〔大典〕 '
                   : game.currentTurnPhase === 'race'  ? '〔小賽事〕 '
                   : '〔活動〕 ';
    addLog(`${phaseTag}第 ${currentTurn} 年 · 一年過去。`);

    if (game.currentTurnPhase === 'event') {
      game.subPhase = null;
      game.currentRace = null;
      pushPending(makeEventChoice()); // 老化延遲到玩家選完卡片後（pickChoiceCard）
    } else {
      game.subPhase = 'roster';
      // 若上一個活動 turn 已 peek 過下一場，直接消費；否則現抽
      const preview = game.nextRacePreview;
      if (preview && preview.turn === currentTurn) {
        game.currentRace = preview.race;
      } else {
        game.currentRace = pick(RACE_TYPES);
      }
      game.nextRacePreview = null;
      // 賽事回合：老化延遲到賽事結束後（advanceFromRacing），讓馬先比賽再退役
    }

    if (game.yearsElapsed >= game.maxYears) {
      addLog(`時辰已盡 · 30 年皆已過去。`);
    }
    render();
  }

  function promoteFromBench() {
    // 老化後若 active 有空位，從 bench 補強（OVR 高優先），不是強制 — 玩家仍可手動換場
    while (game.horses.length < game.stableSize && game.bench.length) {
      game.bench.sort((a, b) => ovrOf(b) - ovrOf(a));
      game.horses.push(game.bench.shift());
    }
  }

  function moveToBench(horseId) {
    const idx = game.horses.findIndex(h => h.id === horseId);
    if (idx < 0) return;
    game.bench.push(game.horses.splice(idx, 1)[0]);
    render();
  }
  function moveToRoster(horseId) {
    if (game.horses.length >= game.stableSize) {
      addLog(`先發名單已滿（${game.stableSize}/${game.stableSize}），請先下放某匹再上場。`, 'death');
      render();
      return;
    }
    const idx = game.bench.findIndex(h => h.id === horseId);
    if (idx < 0) return;
    game.horses.push(game.bench.splice(idx, 1)[0]);
    render();
  }
  function advanceFromRoster() {
    if (game.subPhase !== 'roster') return;
    game.subPhase = 'racing';
    if (getRaceBatch().length === 0) {
      // 無 PEAK 馬可參賽 → 跳過直接到育馬
      advanceFromRacing();
    } else {
      render();
    }
  }
  function advanceFromRacing() {
    if (game.subPhase !== 'racing') return;
    game.subPhase = 'breeding';
    render();
  }

  // 個別出戰按鈕沒有 queue／也沒接 onComplete 鏈，沒人 trigger 推進。
  // 在每次賽事結束與 modal 解掉後檢查：無 pending、無 queue、無可賽馬 → 自動推進。
  function maybeAutoAdvanceRacing() {
    if (game.subPhase !== 'racing') return;
    if (game.pendingChoice) return;          // 等 mark / event modal 解
    if (game._raceQueue !== null) return;    // 大典批次正在跑
    if (getRaceBatch().length > 0) return;   // 還有可賽馬
    game.batchRacedThisTurn = true;
    advanceFromRacing();
  }

  function getRaceBatch() {
    if (game.currentTurnPhase === 'event') return [];
    if (game.subPhase && game.subPhase !== 'racing') return [];
    const eligible = game.horses.filter(h => h.status === STATE_PEAK && !h.racedThisTurn);
    if (!game.currentTurnMajor) return eligible;
    const racedCount = game.horses.filter(h => h.racedThisTurn).length;
    const slots = Math.max(0, 2 - racedCount);
    return [...eligible].sort((a, b) => ovrOf(b) - ovrOf(a)).slice(0, slots);
  }

  function getAffordableMarketCount() {
    return game.market.filter(m => game.money >= m.price).length;
  }

  function runAllRaces() {
    if (game.subPhase !== 'racing') return;
    const batch = getRaceBatch();
    if (!batch.length) { advanceFromRacing(); return; }

    if (game.currentTurnMajor && game.settings.animationsEnabled) {
      game._raceQueue = batch.map(h => h.id);
      runNextQueuedRace();
    } else {
      batch.forEach(h => runRace(h.id));
      game.batchRacedThisTurn = true;
      advanceFromRacing();
    }
  }

  // 連續大典：先完成一場、若彈出 mark modal 則凍住，等選完再 resume
  function runNextQueuedRace() {
    const q = game._raceQueue;
    if (!q || !q.length) {
      game._raceQueue = null;
      game.batchRacedThisTurn = true;
      advanceFromRacing();
      return;
    }
    const id = q.shift();
    runRace(id, () => {
      if (game.pendingChoice) return; // 等 resolvePending() 接手
      runNextQueuedRace();
    });
  }

  function buyMarketHorse(marketId) {
    if (!['roster', 'racing', 'breeding'].includes(game.subPhase)) return;
    const idx = game.market.findIndex(m => m.id === marketId);
    if (idx < 0) return;
    const horse = game.market[idx];
    if (game.money < horse.price) return;
    const price = horse.price;
    delete horse.price;
    game.money -= price;
    const benched = game.horses.length >= game.stableSize;
    if (benched) {
      game.bench.push(horse);
    } else {
      game.horses.push(horse);
    }
    game.market.splice(idx, 1);
    addLog(`購入：${horse.name}（${horse.gender === 'male' ? '公' : '母'}） −${price.toLocaleString()}G${benched ? '〔送往替補席〕' : ''}`);
    render();
  }

  let __cardSilent = false;
  function breed(fatherId, motherId, primaryId) {
    if (game.subPhase !== 'breeding') return null;
    const allBreedable = [...game.horses, ...game.bench];
    const father = allBreedable.find(h => h.id === fatherId);
    const mother = allBreedable.find(h => h.id === motherId);
    if (!father || !mother) return null;
    if (father.age < 1 || father.age > 4 || mother.age < 1 || mother.age > 4) return null;
    if (father.gender !== 'male' || mother.gender !== 'female') return null;
    // 只有主動交配的一方需要當年參賽過
    const primary = allBreedable.find(h => h.id === primaryId) || father;
    if (!primary.racedThisTurn) {
      if (!__cardSilent) addLog(`主動交配的馬匹必須在當年參賽過。`, 'death');
      return null;
    }
    // 主動方每年只能交配一次（公母皆然）
    if (primary.bredThisTurn) {
      if (!__cardSilent) addLog(`${primary.name} 當年已主動交配過 1 胎。`, 'death');
      return null;
    }
    // 全年主動交配上限 6
    if ((game.primariesThisYear || 0) >= 6) {
      if (!__cardSilent) addLog(`本年主動交配已達上限 6。`, 'death');
      return null;
    }

    const events = [];
    const mutated = { speed: false, power: false, stamina: false };
    const breedStat = (key) => {
      const midpoint = (father[key] + mother[key]) / 2;
      const regressed = midpoint * (1 - REGRESSION_PULL) + POPULATION_MEAN * REGRESSION_PULL;
      const noise = (Math.random() - 0.5) * BREED_NOISE;
      let stat = regressed + noise;
      const roll = Math.random();
      if (roll < MUTATION_RATE) {
        events.push(`${STAT_LABEL[key]}突變+20`);
        mutated[key] = true;
        stat += 20;
      } else if (roll < MUTATION_RATE + DEGENERATION_RATE) {
        events.push(`${STAT_LABEL[key]}劣化-15`);
        stat -= 15;
      }
      return clamp(Math.round(stat), 1, 100);
    };

    const childTraits = breedTraits(father, mother);
    const childMarks = breedMarks(father, mother);
    const cOrigin = childOrigin(father, mother, ovrOf);
    const { surname: cSurname, givenName: cGiven, name: cName } = generateChildName(father, mother, cOrigin, ovrOf);
    const child = {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()),
      origin: cOrigin, surname: cSurname, givenName: cGiven, name: cName,
      gender: Math.random() < 0.5 ? 'male' : 'female',
      age: 0,
      speed: breedStat('speed'),
      power: breedStat('power'),
      stamina: breedStat('stamina'),
      status: STATE_FOAL,
      racedThisTurn: false,
      bredThisTurn: false,
      mutated,
      skill: null,
      traits: { displayed: childTraits.displayed, recessiveFlags: childTraits.recessiveFlags },
      marks: childMarks.displayed,
      marksRecessive: childMarks.recessive,
      parents: {
        father: { id: father.id, name: father.name, ovr: ovrOf(father), origin: father.origin },
        mother: { id: mother.id, name: mother.name, ovr: ovrOf(mother), origin: mother.origin },
      },
    };
    const parentSkills = [father.skill, mother.skill].filter(Boolean);
    if (parentSkills.length && Math.random() < 0.5) {
      child.skill = pick(parentSkills);
    }

    // 印記顯性遺傳的即時效果（M01 立即 +15 速度）
    if (child.marks.some(m => m.id === 'M01')) {
      child.speed = Math.min(115, child.speed + 15);
    }

    // 子代當年不能參賽、不能交配
    child.racedThisTurn = true;
    child.bredThisTurn = true;
    if (game.horses.length < game.stableSize) {
      game.horses.push(child);
    } else {
      game.bench.push(child);
    }
    primary.bredThisTurn = true; // 只有主動方計入一胎/年
    game.primariesThisYear = (game.primariesThisYear || 0) + 1;

    const eventStr = events.length ? `〔${events.join('、')}〕` : '';
    const skillInherit = child.skill ? ` 繼承技能：${child.skill.name}` : '';
    const goldTag = childTraits.goldTriggered ? ' ✨【地獄之王】降臨！' : '';
    const traitNames = childTraits.displayed.filter(t => t.type !== 'gold').map(t => TRAIT_DATA[t.id]?.name).filter(Boolean);
    const traitTag = traitNames.length ? ` 特性：${traitNames.join('、')}` : '';
    const markNames = child.marks.map(m => MARK_DATA[m.id]?.name).filter(Boolean);
    const markTag = markNames.length ? ` ✨印記：${markNames.join('、')}` : '';
    addLog(`交配：${father.name} × ${mother.name} → ${child.name}（${child.gender === 'male' ? '公' : '母'}） ${eventStr}${skillInherit}${traitTag}${goldTag}${markTag}`, (goldTag || markTag) ? 'soul' : '');
    render();
    if (!__cardSilent && typeof window.openHorseCard === 'function') {
      const lucky = typeof window.isLuckyBirth === 'function' && window.isLuckyBirth(child);
      window.openHorseCard(child, { reveal: true, lucky });
    }
    return child;
  }

  // ── Stage F: 物理引擎賽事 ──────────────────────────────────────────

  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // 在當前位置 p (公尺) 上找對應 segment
  function getSegmentAt(track, position) {
    let acc = 0;
    for (const seg of track.segments) {
      if (position < acc + seg.length) return seg;
      acc += seg.length;
    }
    return track.segments[track.segments.length - 1];
  }

  // segment + 力量 → velocity 上限倍率 / 體力消耗倍率 / 體力回復
  function segmentBehavior(seg, P, climateMods) {
    switch (seg.kind) {
      case 'straight':  return { capMul: 1.00, drainMul: 1.00, recover: 0 };
      case 'mildCurve': {
        const baseRatio = 0.75 + P / 400;            // P50→0.875, P100→1.00
        const penalty = (1 - baseRatio) * climateMods.curvePenaltyMul;
        return { capMul: Math.max(0.4, 1 - penalty), drainMul: 1.00, recover: 0 };
      }
      case 'hairpin': {
        const baseRatio = 0.50 + P / 250;            // P50→0.70, P100→0.90
        const penalty = (1 - baseRatio) * climateMods.curvePenaltyMul;
        return { capMul: Math.max(0.4, 1 - penalty), drainMul: 1.00, recover: 0 };
      }
      case 'climb':    return { capMul: Math.max(0.3, P / 100), drainMul: 1.10, recover: 0 };
      case 'descent':  return { capMul: 1.00, drainMul: 0.50, recover: 0.5 };
      case 'sprint':   return { capMul: 1.05, drainMul: 1.50, recover: 0 };
      default:         return { capMul: 1.00, drainMul: 1.00, recover: 0 };
    }
  }

  // 氣候對該馬的有效修正：不適應吃 debuff，適應則抵消並反向加成
  function effectiveClimate(horse, climate, hasR04) {
    const def = { maxSpeedMul: climate.maxSpeedMul, accelMul: climate.accelMul, drainMul: climate.drainMul, curvePenaltyMul: 1.0 };
    if (hasR04 || !climate.adaptTrait) return def;
    const hasAdapt = horse.traits?.displayed.some(t => t.id === climate.adaptTrait);
    if (!hasAdapt) return def;
    if (climate.adaptTrait === 'B01') return { maxSpeedMul:1.05, accelMul:1.00, drainMul:1.00, curvePenaltyMul:1.00 };
    if (climate.adaptTrait === 'B02') return { maxSpeedMul:1.00, accelMul:1.00, drainMul:1.00, curvePenaltyMul:0.50 };
    if (climate.adaptTrait === 'B03') return { maxSpeedMul:1.00, accelMul:1.00, drainMul:0.90, curvePenaltyMul:1.00 };
    return def;
  }

  function simulateRaceMatch(horse, opponent, context) {
    const { isMajor, raceType } = context;
    const seed = context.seed != null ? context.seed : (Math.random() * 0x7FFFFFFF | 0);
    const rng = mulberry32(seed);

    const track   = TRACK_DEFS[raceType.terrain];
    const climate = CLIMATE_MODS[raceType.attr] || CLIMATE_MODS.Normal;

    // === 玩家馬 ===
    const hasR04 = horse.traits?.displayed.some(t => t.id === 'R04');
    const hasR03 = isMajor && horse.traits?.displayed.some(t => t.id === 'R03');
    const traitMul = hasR04 ? 1.0 : applyTraitMultiplier(horse, raceType.attr, raceType.terrain);
    const m02   = isMajor && horse.marks?.some(m => m.id === 'M02') ? 10 : 0;
    const m01Cap = horse.marks?.some(m => m.id === 'M01') ? 115 : 100;
    const hStats = {
      speed:   clamp(effectiveStat(horse, 'speed')   + m02, 1, m01Cap),
      power:   clamp(effectiveStat(horse, 'power')   + m02, 1, 100),
      stamina: clamp(effectiveStat(horse, 'stamina') + m02, 1, 100),
    };
    const hClim = effectiveClimate(horse, climate, hasR04);
    const hGlobalMul = (hasR03 ? 0.01 : 1.0) * traitMul * hClim.maxSpeedMul;
    const hMaxSpeed = STAT_FORMULA.maxSpeed(hStats.speed) * hGlobalMul;
    const hAccel    = STAT_FORMULA.accel(hStats.power)    * hClim.accelMul;
    const hPool     = STAT_FORMULA.staminaPool(hStats.stamina);
    const hClimateForSeg = { curvePenaltyMul: hClim.curvePenaltyMul };

    // === 對手 ===
    const eStats = { speed: opponent.speed, power: opponent.power, stamina: opponent.stamina };
    const eClim  = { maxSpeedMul: climate.maxSpeedMul, accelMul: climate.accelMul, drainMul: climate.drainMul, curvePenaltyMul: 1.0 };
    const eMaxSpeed = STAT_FORMULA.maxSpeed(eStats.speed) * eClim.maxSpeedMul;
    const eAccel    = STAT_FORMULA.accel(eStats.power)    * eClim.accelMul;
    const ePool     = STAT_FORMULA.staminaPool(eStats.stamina);
    const eClimateForSeg = { curvePenaltyMul: eClim.curvePenaltyMul };

    // === Runtime ===
    const h = { pos: 0, vel: 0, stam: hPool, finished: false, finishTick: null,
                fired: { goodStart:false, topSpeed:false, sprint:false, fatigue:false }, lastSeg:null };
    const e = { pos: 0, vel: 0, stam: ePool, finished: false, finishTick: null,
                fired: { goodStart:false, topSpeed:false, sprint:false, fatigue:false }, lastSeg:null };
    const timeline = [];
    const finishOrder = []; // 'h' or 'e'
    const horseSkillName = horse.skill?.name;

    function step(rt, maxSpeed, accel, pool, drainBaseMul, climateForSeg, P, isPlayer, tick) {
      const seg = getSegmentAt(track, rt.pos);
      const beh = segmentBehavior(seg, P, climateForSeg);
      const fatigueRatio = rt.stam / pool;
      const lowFatigue = fatigueRatio < 0.30;
      const fatigue = fatigueRatio < 0 ? 0.55 : (lowFatigue ? 0.85 : 1.00);
      const events = [];
      const cap = maxSpeed * beh.capMul;
      const target = cap * fatigue * (0.97 + rng() * 0.06);
      const dv = clamp(target - rt.vel, -accel * 1.5, accel);
      const prevVel = rt.vel;
      rt.vel = Math.max(0, rt.vel + dv);
      rt.pos += rt.vel;
      const drain = STAT_FORMULA.drainAtSpeed(rt.vel) * beh.drainMul * drainBaseMul;
      rt.stam = rt.stam - drain + beh.recover;

      // === 戰況事件偵測（玩家馬才播報，避免太吵）===
      if (isPlayer) {
        const who = horse.name.slice(0, 6);
        // 起跑成功：開賽 8 tick 內衝過 maxSpeed × 0.7
        if (!rt.fired.goodStart && tick <= 8 && rt.vel >= maxSpeed * 0.70) {
          rt.fired.goodStart = true;
          events.push(`🚀 ${who} 起跑成功`);
        }
        // 達到頂速：首次跨 maxSpeed × 0.95
        if (!rt.fired.topSpeed && rt.vel >= maxSpeed * 0.95) {
          rt.fired.topSpeed = true;
          const tag = horseSkillName === '疾風' ? `（✨ 疾風發動）` : '';
          events.push(`⚡ ${who} 達到頂速${tag}`);
        }
        // 進入衝刺段（一次性）
        if (!rt.fired.sprint && seg.kind === 'sprint') {
          rt.fired.sprint = true;
          events.push(`🔥 ${who} 進入衝刺`);
        }
        // 過彎掉速：進入髮夾且 vel 比上一 tick 跌 ≥ 1
        if (rt.lastSeg !== 'hairpin' && seg.kind === 'hairpin' && prevVel - rt.vel >= 1) {
          const tag = horseSkillName === '霸力' ? `（✨ 霸力穩住）` : '';
          events.push(`🌀 ${who} 過髮夾${tag}`);
        }
        // 體力崩盤：首次跌破 30%
        if (!rt.fired.fatigue && lowFatigue) {
          rt.fired.fatigue = true;
          const tag = horseSkillName === '鋼魂' ? `（✨ 鋼魂硬撐）` : '';
          events.push(`💢 ${who} 體力崩盤${tag}`);
        }
      }
      rt.lastSeg = seg.kind;
      return { seg, events };
    }

    let t = 0;
    for (; t < RACE_TICK_CAP; t++) {
      const hStep = h.finished ? null : step(h, hMaxSpeed, hAccel, hPool, hClim.drainMul, hClimateForSeg, hStats.power, true,  t);
      const eStep = e.finished ? null : step(e, eMaxSpeed, eAccel, ePool, eClim.drainMul, eClimateForSeg, eStats.power, false, t);

      // 衝線檢查 — 同 tick 多人衝線時用 overshoot 排序避免系統性偏袒玩家
      const hCrossing = !h.finished && h.pos >= track.length;
      const eCrossing = !e.finished && e.pos >= track.length;
      if (hCrossing || eCrossing) {
        const candidates = [];
        if (hCrossing) candidates.push({ key:'h', overshoot: h.pos - track.length, rt: h });
        if (eCrossing) candidates.push({ key:'e', overshoot: e.pos - track.length, rt: e });
        candidates.sort((a, b) => (b.overshoot - a.overshoot) || (rng() - 0.5));
        for (const c of candidates) {
          c.rt.pos = track.length;
          c.rt.finished = true;
          c.rt.finishTick = t;
          finishOrder.push(c.key);
        }
      }

      timeline.push({
        t,
        hPos: h.pos, hVel: h.vel, hStam: Math.max(0, h.stam), hSeg: hStep ? hStep.seg.kind : 'finished',
        ePos: e.pos, eVel: e.vel, eStam: Math.max(0, e.stam), eSeg: eStep ? eStep.seg.kind : 'finished',
        events: [...(hStep?.events || [])],
      });

      // 終止：第 N-1 匹衝線後立刻結束（1v1 即第 1 匹衝線）
      if (finishOrder.length >= 1) break;
    }

    // 勝負判定
    let won;
    if (hasR03) {
      won = false;
    } else if (finishOrder.length > 0) {
      won = finishOrder[0] === 'h';
    } else {
      // 250 tick 都沒人衝線，比 position
      won = h.pos > e.pos;
    }

    return { seed, horse, opponent, isMajor, raceType, won, r03Forced: hasR03, traitMul, timeline, track };
  }

  function applyRaceOutcome(result) {
    const { horse, won, isMajor, raceType, r03Forced, traitMul } = result;
    const reward = won ? (isMajor ? 10 : 3) : (isMajor ? 2 : 1);
    // 播報快照：必須在 R01 降速與大典技能套用前抓，避免「賽中 OVR 與播報 OVR 不一致」
    const playerSnapshot = { name: horse.name, total: totalStats(horse), score: Math.round(ovrOf(horse)) };
    const enemySnapshot  = { name: result.opponent.name, total: totalStats(result.opponent), score: Math.round(ovrOf(result.opponent)) };

    game.money += reward;
    horse.racedThisTurn = true;

    if (horse.traits?.displayed.some(t => t.id === 'R01')) {
      horse.speed = Math.max(1, horse.speed - 1);
    }

    let newSkill = null;
    if (won && isMajor && !horse.skill) {
      const bestStat = ['speed', 'power', 'stamina'].reduce((a, b) => horse[a] > horse[b] ? a : b);
      newSkill = SKILL_LIST.find(s => s.stat === bestStat) || SKILL_LIST[0];
      horse.skill = newSkill;
    }
    if (won && isMajor) {
      const markChoice = makeMarkChoice(horse);
      if (markChoice) pushPending(markChoice);
    }

    game.races.unshift({
      year: game.yearsElapsed,
      player: playerSnapshot,
      enemy:  enemySnapshot,
      won, reward, isMajor,
      skillEarned: newSkill ? newSkill.name : null,
      raceType: raceType.name, raceAttr: raceType.attr, raceTerrain: raceType.terrain,
      traitMult: traitMul !== 1 ? traitMul : null,
    });
    if (game.races.length > 5) game.races.length = 5;

    const majorTag = isMajor    ? '〔大典〕 ' : '';
    const skillTag = newSkill   ? ` 獲得技能：${newSkill.name}` : '';
    const traitTag = traitMul !== 1 ? ` [特性×${traitMul.toFixed(2)}]` : '';
    const r03Tag   = r03Forced  ? ' 💔玻璃心崩潰' : '';
    addLog(
      `${majorTag}${raceType.name} · ${horse.name} ${won ? '擊敗' : '不敵'} ${result.opponent.name}（+${reward}G）${skillTag}${traitTag}${r03Tag}`,
      won ? '' : 'death'
    );
  }

  function runRace(horseId, onComplete) {
    if (game.currentTurnPhase === 'event') return;
    const h = game.horses.find(x => x.id === horseId);
    if (!h || h.status !== STATE_PEAK || h.racedThisTurn) return;

    const isMajor = game.currentTurnMajor;
    if (isMajor) {
      const alreadyRaced = game.horses.filter(x => x.racedThisTurn).length;
      if (alreadyRaced >= 2) return;
    }

    const raceType = game.currentRace || pick(RACE_TYPES);
    const opponent = makeEnemy();
    const seed = Math.random() * 0x7FFFFFFF | 0;
    const result = simulateRaceMatch(h, opponent, { isMajor, raceType, seed });

    if (isMajor && game.settings.animationsEnabled) {
      renderRaceReplay(result, () => {
        applyRaceOutcome(result);
        render();
        if (onComplete) onComplete();
        else maybeAutoAdvanceRacing();
      });
    } else {
      applyRaceOutcome(result);
      render();
      if (onComplete) onComplete();
      else maybeAutoAdvanceRacing();
    }
  }

  function addLog(text, kind = '') {
    game.log.unshift({ text, kind });
    if (game.log.length > 30) game.log.length = 30;
  }

  function getBluePool(horse) {
    if (!horse.traits) return new Set();
    return new Set([
      ...horse.traits.recessiveFlags,
      ...horse.traits.displayed.filter(t => t.type === 'blue').map(t => t.id),
    ]);
  }

  function getRedIds(horse) {
    return horse.traits
      ? horse.traits.displayed.filter(t => t.type === 'red').map(t => t.id)
      : [];
  }

  function breedPairScore(father, mother) {
    const fatherBlue = getBluePool(father);
    const motherBlue = getBluePool(mother);
    const sharedBlue = [...fatherBlue].filter(id => motherBlue.has(id)).length;

    const fatherRed = getRedIds(father);
    const motherRed = getRedIds(mother);
    const sharedRed = fatherRed.filter(id => motherRed.includes(id)).length;
    const totalRed = new Set([...fatherRed, ...motherRed]).size;
    const statDiff = (
      Math.abs(father.speed - mother.speed) +
      Math.abs(father.power - mother.power) +
      Math.abs(father.stamina - mother.stamina)
    ) / 18;
    const skillBonus = (father.skill ? 5 : 0) + (mother.skill ? 4 : 0);
    return (
      ovrOf(father) * 1.25 +
      ovrOf(mother) +
      sharedBlue * 12 +
      skillBonus -
      sharedRed * 32 -
      totalRed * 6 -
      statDiff
    );
  }

  function getSmartBreedPairs() {
    const breedAge = h => h.age >= 1 && h.age <= 4;
    const allBreedable = [...game.horses, ...game.bench];
    const allFemales = allBreedable.filter(h => h.gender === 'female' && breedAge(h));
    const allMales   = allBreedable.filter(h => h.gender === 'male'   && breedAge(h));
    const pairs = [];
    const remainingCap = () => 6 - (game.primariesThisYear || 0) - pairs.length;
    const virtualBredMales   = new Set(allMales.filter(h => h.bredThisTurn).map(h => h.id));
    const virtualBredFemales = new Set(allFemales.filter(h => h.bredThisTurn).map(h => h.id));

    // 公馬主動：已完賽且未主動交配
    for (const father of allMales.filter(h => h.racedThisTurn && !virtualBredMales.has(h.id))
                                 .sort((a, b) => ovrOf(b) - ovrOf(a))) {
      if (remainingCap() <= 0) break;
      if (!allFemales.length) break;
      const mother = allFemales.reduce((best, c) =>
        breedPairScore(father, c) > breedPairScore(father, best) ? c : best);
      virtualBredMales.add(father.id);
      pairs.push({ father, mother, primaryId: father.id });
    }

    // 母馬主動：已完賽且未主動交配的母馬各挑最佳公馬（公馬作為被選方不受限制）
    for (const mother of allFemales.filter(h => h.racedThisTurn && !virtualBredFemales.has(h.id))
                                   .sort((a, b) => ovrOf(b) - ovrOf(a))) {
      if (remainingCap() <= 0) break;
      if (!allMales.length) break;
      const father = allMales.reduce((best, c) =>
        breedPairScore(c, mother) > breedPairScore(best, mother) ? c : best);
      virtualBredFemales.add(mother.id);
      pairs.push({ father, mother, primaryId: mother.id });
    }

    return pairs;
  }

  function buyAllMarket() {
    game.market.filter(m => m.gender === 'female').forEach(m => buyMarketHorse(m.id));
    const bestMale = [...game.market]
      .filter(m => m.gender === 'male')
      .sort((a, b) => ovrOf(b) - ovrOf(a))
      .find(m => game.money >= m.price);
    if (bestMale) buyMarketHorse(bestMale.id);
  }

  function breedAll() {
    __cardSilent = true;
    const luckyChildren = [];
    getSmartBreedPairs().forEach(({ father, mother, primaryId }) => {
      const child = breed(father.id, mother.id, primaryId);
      if (child && window.isLuckyBirth && window.isLuckyBirth(child)) luckyChildren.push(child);
    });
    __cardSilent = false;
    if (luckyChildren.length && window.openHorseCard) {
      // 一鍵交配只挑最高 OVR 的幸運兒呈現，避免卡片連發
      luckyChildren.sort((a, b) => ovrOf(b) - ovrOf(a));
      window.openHorseCard(luckyChildren[0], { reveal: true, lucky: true });
    }
  }

  function smartBuy() {
    const mktF = [...game.market].filter(m => m.gender === 'female').sort((a, b) => ovrOf(b) - ovrOf(a));
    const mktM = [...game.market].filter(m => m.gender === 'male').sort((a, b) => ovrOf(b) - ovrOf(a));
    if (!mktF.length && !mktM.length) return;

    // 足夠做完整一鍵買入？
    const allFCost = mktF.reduce((s, m) => s + m.price, 0);
    const topMale = mktM[0];
    if (game.money >= allFCost + (topMale ? topMale.price : 0)) {
      buyAllMarket();
      return;
    }

    // Greedy：優先母馬，但確保至少有一對公母可交配
    const hasMale = game.horses.some(h => h.gender === 'male' && h.age >= 1 && h.age <= 4);
    if (hasMale) {
      mktF.forEach(f => { if (game.money >= f.price) buyMarketHorse(f.id); });
    } else {
      // 需要留預算買一匹公馬
      const affordable = mktM.filter(m => m.price <= game.money).sort((a, b) => a.price - b.price);
      if (!affordable.length) {
        mktF.forEach(f => { if (game.money >= f.price) buyMarketHorse(f.id); });
        return;
      }
      const reserve = affordable[0].price;
      // 買母馬，留 reserve
      mktF.forEach(f => { if (game.money - f.price >= reserve) buyMarketHorse(f.id); });
      // 買最強公馬
      const bestM = mktM.find(m => game.money >= m.price);
      if (bestM) buyMarketHorse(bestM.id);
      // 剩餘金錢再掃母馬
      mktF.forEach(f => {
        if (game.market.some(m => m.id === f.id) && game.money >= f.price) buyMarketHorse(f.id);
      });
    }
  }

  function getOmniAction() {
    if (game.yearsElapsed >= game.maxYears) {
      return { key: 'idle', label: '終局', disabled: true };
    }
    const raceBatch = getRaceBatch();
    if (raceBatch.length) {
      return {
        key: 'race',
        label: game.currentTurnMajor ? `大典出戰 (${raceBatch.length})` : `全體出戰 (${raceBatch.length})`,
        disabled: false,
      };
    }
    const affordableCount = getAffordableMarketCount();
    if (affordableCount) {
      return { key: 'buy', label: `全體購買 (${affordableCount})`, disabled: false };
    }
    const breedPairs = getSmartBreedPairs();
    if (breedPairs.length) {
      return { key: 'breed', label: `智能交配 (${breedPairs.length})`, disabled: false };
    }
    return { key: 'idle', label: '待下一年', disabled: true };
  }

  function runOmniAction() {
    const action = getOmniAction();
    if (action.disabled) return;
    if (action.key === 'race') {
      runAllRaces();
      return;
    }
    if (action.key === 'buy') {
      smartBuy();
      return;
    }
    if (action.key === 'breed') {
      breedAll();
    }
  }

  function triggerRagnarok() {
    const playerFighters = [...game.souls, ...game.horses];
    const variance = () => 0.8 + Math.random() * 0.4;
    const entries = [
      ...playerFighters.map(h => {
        const hasG01 = h.traits && h.traits.displayed.some(t => t.id === 'G01');
        let traitMult = 1.0;
        let raceAttr, raceTerrain;
        if (hasG01) {
          raceAttr = 'All'; raceTerrain = '全場地';
          const d = h.traits.displayed;
          if (d.some(t => t.id === 'B01')) traitMult += 0.08;
          if (d.some(t => t.id === 'B02')) traitMult += 0.08;
          if (d.some(t => t.id === 'B03')) traitMult += 0.08;
          if (d.some(t => t.id === 'B04')) traitMult += 0.10;
          if (d.some(t => t.id === 'B05')) traitMult += 0.10;
          if (d.some(t => t.id === 'B06')) traitMult += 0.10;
        } else {
          const rt = pick(RACE_TYPES);
          raceAttr = rt.attr; raceTerrain = rt.terrain;
          traitMult = applyTraitMultiplier(h, rt.attr, rt.terrain);
        }
        return {
          name: h.name, ovr: ovrOf(h),
          skillName: h.skill ? h.skill.name : null,
          hasG01, raceAttr, raceTerrain,
          score: Math.round(totalStats(h) * traitMult * variance()),
          isPlayer: true,
        };
      }),
      ...FOUR_KINGS.map(k => {
        const tot = k.speed + k.power + k.stamina;
        return { name: k.name, ovr: Math.round(tot / 3), skillName: null,
                 score: Math.round(tot * variance()), isPlayer: false };
      }),
    ];
    entries.sort((a, b) => b.score - a.score);
    game.ragnarok = { entries, totalPlayers: playerFighters.length };
    const best = entries.find(e => e.isPlayer);
    const rank = best ? entries.indexOf(best) + 1 : null;
    const rankLabel = rank ? (RANK_LABELS[rank - 1] || `第 ${rank} 名`) : '無人參戰';
    addLog(`⚡ RAGNARÖK · ${best ? best.name : '無馬'} 奪得${rankLabel}！`, 'soul');
    render();
  }
