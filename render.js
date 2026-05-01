// render.js — UI render + DOM 事件綁定 + 啟動 init()
// 依賴：data.js（資料表）、game.js（state + 邏輯）、card.js（馬匹卡片 modal）
// 必須最後載入 — 因為底部會直接呼叫 init()，且事件綁定假設 DOM 已存在。

  let _raceAnimTimer = null;
  function renderRaceReplay(result, onComplete) {
    const overlay  = document.getElementById('race-anim-overlay');
    const headerEl = document.getElementById('race-anim-header');
    const trackEl  = document.getElementById('race-anim-track');
    const eventsEl = document.getElementById('race-anim-events');
    const skipBtn  = document.getElementById('race-skip-btn');
    const { horse, opponent, won, timeline, track, raceType } = result;
    const currentTurn = game.yearsElapsed / game.yearPerTurn;
    const label = `第 ${currentTurn} 年 大典 · ${raceType.name}（${track.length}m）`;
    let tickIdx = 0;

    const SEG_LABEL = { straight:'直', mildCurve:'彎', hairpin:'夾', climb:'坡', descent:'落', sprint:'衝', finished:'✓' };

    function buildBar(progress) {
      const B = 14, f = Math.round(Math.min(progress, 1) * B);
      return '▓'.repeat(f) + '░'.repeat(B - f);
    }

    // 中文字在 monospace 占 2 cols，padEnd 用 char 數會錯位 — 改用 visual width
    function padCols(s, cols) {
      let w = 0;
      for (const ch of s) w += /[　-鿿＀-｠]/.test(ch) ? 2 : 1;
      return s + ' '.repeat(Math.max(0, cols - w));
    }

    function row(label, pos, vel, segKind, length) {
      const progress = Math.min(pos / length, 1);
      const v   = String(Math.round(vel)).padStart(2);
      const seg = SEG_LABEL[segKind] || '·';
      return `${padCols(label, 10)} ${buildBar(progress)} ${String(Math.round(pos)).padStart(4)}m v${v} ${seg}`;
    }

    function frame() {
      const tk = timeline[Math.min(tickIdx, timeline.length - 1)];
      headerEl.textContent = `${label}  ──  tick ${tk.t}`;
      const hLead = tk.hPos >= tk.ePos;
      const hRank = hLead ? '1' : '2', eRank = hLead ? '2' : '1';
      trackEl.textContent =
        `${hRank}│ ${row(horse.name.slice(0,8),    tk.hPos, tk.hVel, tk.hSeg, track.length)}\n` +
        `${eRank}│ ${row(opponent.name.slice(0,8), tk.ePos, tk.eVel, tk.eSeg, track.length)}`;
      const recent = timeline.slice(Math.max(0, tickIdx-1), tickIdx+1).flatMap(f => f.events);
      eventsEl.textContent = recent.slice(-2).join('  ');
    }

    function finish() {
      clearInterval(_raceAnimTimer); _raceAnimTimer = null;
      const tk = timeline[timeline.length - 1];
      headerEl.textContent = `${label}  ──  ${won ? '🏆 勝利!' : '💀 落敗'}`;
      trackEl.textContent =
        `${won ? '1' : '2'}│ ${row(horse.name.slice(0,8),    tk.hPos, tk.hVel, tk.hSeg, track.length)}\n` +
        `${won ? '2' : '1'}│ ${row(opponent.name.slice(0,8), tk.ePos, tk.eVel, tk.eSeg, track.length)}`;
      skipBtn.onclick = null;
      setTimeout(() => { overlay.classList.remove('open'); onComplete(); }, 400);
    }

    skipBtn.onclick = () => {
      clearInterval(_raceAnimTimer); _raceAnimTimer = null;
      overlay.classList.remove('open');
      onComplete();
    };

    frame();
    overlay.classList.add('open');
    _raceAnimTimer = setInterval(() => {
      tickIdx++;
      if (tickIdx >= timeline.length) { finish(); return; }
      frame();
    }, 60);
  }

  function render() {
    const remaining = (game.maxYears - game.yearsElapsed) / game.yearPerTurn;
    const turnNum = game.yearsElapsed / game.yearPerTurn;
    document.getElementById('year').textContent = `${turnNum} / 30`;
    document.getElementById('year-sub').textContent =
      remaining > 0 ? `剩 ${remaining} 年` : '終局';
    document.getElementById('money').textContent = `${game.money.toLocaleString()} G`;
    document.getElementById('market-gold').textContent = `${game.money.toLocaleString()} G`;

    const btn = document.getElementById('next-turn');
    const blockedByChoice = !!game.pendingChoice;
    const inMidTurnFlow = game.subPhase === 'roster' || game.subPhase === 'racing';
    btn.disabled = game.yearsElapsed >= game.maxYears || blockedByChoice || inMidTurnFlow;
    btn.textContent = game.yearsElapsed >= game.maxYears ? '時辰已盡'
                    : blockedByChoice ? '請先做出選擇'
                    : game.subPhase === 'roster' ? '請先整隊出戰'
                    : game.subPhase === 'racing' ? '請先完賽'
                    : '下一年';
    const fabBtn = document.getElementById('fab-next');
    fabBtn.disabled = btn.disabled;
    fabBtn.textContent = game.yearsElapsed >= game.maxYears ? '終局'
                       : blockedByChoice ? '選擇'
                       : inMidTurnFlow ? '進行中'
                       : '下一年';

    const omniAction = getOmniAction();
    const omniBtn = document.getElementById('fab-omni');
    omniBtn.textContent = omniAction.label;
    omniBtn.disabled = omniAction.disabled;
    omniBtn.className = `fab-omni state-${omniAction.key}`;

    const allRaceBtn = document.getElementById('all-race-btn');
    const eligibleCount = game.horses.filter(h => h.status === STATE_PEAK && !h.racedThisTurn).length;
    const racedCount = game.horses.filter(h => h.racedThisTurn).length;
    const majorSlots = game.currentTurnMajor ? Math.max(0, 2 - racedCount) : eligibleCount;
    const effectiveEligible = game.currentTurnMajor ? Math.min(eligibleCount, majorSlots) : eligibleCount;
    allRaceBtn.disabled = effectiveEligible === 0 || game.yearsElapsed >= game.maxYears;
    allRaceBtn.textContent = game.currentTurnMajor
      ? (majorSlots > 0 ? `大典出戰 (${effectiveEligible})` : '名額已滿')
      : (eligibleCount > 0 ? `全員出戰 (${eligibleCount})` : '全員出戰');

    const phaseBanner = document.getElementById('major-event-banner');
    if (game.yearsElapsed > 0 && game.yearsElapsed < game.maxYears + 1) {
      const subLabel = game.subPhase === 'roster' ? '〔整隊〕'
                     : game.subPhase === 'racing' ? '〔賽事〕'
                     : game.subPhase === 'breeding' ? '〔育馬〕'
                     : '';
      if (game.currentTurnPhase === 'major') {
        phaseBanner.style.display = 'block';
        phaseBanner.textContent = `⚡ 大典 ${subLabel} · 賽事獎金加倍、勝者獲賜技能與印記`;
      } else if (game.currentTurnPhase === 'race') {
        phaseBanner.style.display = 'block';
        phaseBanner.textContent = `🏇 小賽事 ${subLabel} · 全員出戰賺取黃金`;
      } else {
        phaseBanner.style.display = 'block';
        phaseBanner.textContent = '✨ 活動 · 三選一獎勵';
      }
    } else {
      phaseBanner.style.display = 'none';
    }

    const venueCard = document.getElementById('race-venue-card');
    const preview = (game.yearsElapsed > 0 && game.yearsElapsed <= game.maxYears) ? peekNextRace() : null;
    if (preview && preview.race) {
      const r = preview.race;
      const isCurrent = !!game.currentRace;
      venueCard.style.display = 'block';
      const labelEl = venueCard.querySelector('.venue-label');
      if (labelEl) {
        labelEl.textContent = isCurrent
          ? '本年賽道'
          : `下一場預告 · 第 ${preview.turn} 年${preview.isMajor ? ' · ⚡ 大典' : ' · 小賽事'}`;
      }
      document.getElementById('venue-name').textContent = r.name;
      const attrEl = document.getElementById('venue-attr');
      attrEl.textContent = ATTR_LABEL[r.attr] || r.attr;
      attrEl.className = 'attr-badge attr-' + r.attr;
      document.getElementById('venue-terrain').textContent = r.terrain;
      // 場地適性提示（既有特性對策）
      const attrHintMap = {
        Fire: '帶 B01 火足 +8%',
        Ice:  '帶 B02 長毛 +8%',
        Sand: '帶 B03 駱駝 +8%',
      };
      const terrainHintMap = {
        '爬山':   '帶 B04 神山 +10%',
        '長平原': '帶 B05 GTR +10%',
        '髮夾彎': '帶 B06 越野 +10%',
      };
      // 三圍偏向提示（讓買馬有依據）
      const statHintMap = {
        '長平原': '速度型佔優（直線多）',
        '髮夾彎': '力量+體力型佔優（連續彎道）',
        '爬山':   '體力+力量型佔優（爬坡爆發）',
      };
      const climateHintMap = {
        Fire: '體力消耗 +15%（火足可抵）',
        Ice:  '加速 -10%（長毛可抵）',
        Sand: '最高速 -5%（駱駝可抵）',
      };
      const traitHints = [attrHintMap[r.attr], terrainHintMap[r.terrain]].filter(Boolean);
      const statHints  = [statHintMap[r.terrain], climateHintMap[r.attr]].filter(Boolean);
      const hintEl = document.getElementById('venue-hint');
      const lines = [];
      if (statHints.length)  lines.push(`<span class="hint-line">⚔ ${statHints.join(' · ')}</span>`);
      if (traitHints.length) lines.push(`<span class="hint-line">✦ 相性：${traitHints.join(' · ')}</span>`);
      hintEl.innerHTML = lines.join('');
      hintEl.style.display = lines.length ? 'block' : 'none';
    } else {
      venueCard.style.display = 'none';
    }

    // Body class for phase lock
    document.body.classList.remove('subphase-event','subphase-roster','subphase-racing','subphase-breeding','phase-end','phase-init');
    if (game.yearsElapsed >= game.maxYears) {
      document.body.classList.add('phase-end');
    } else if (game.yearsElapsed === 0) {
      document.body.classList.add('phase-init');
    } else if (game.currentTurnPhase === 'event') {
      document.body.classList.add('subphase-event');
    } else if (game.subPhase) {
      document.body.classList.add('subphase-' + game.subPhase);
    }
    // 進入 breeding 自動展開資訊欄看交配 / 黑市
    if (game.subPhase === 'breeding' && !game.infoDrawerOpen) {
      game.infoDrawerOpen = true;
    }

    const smartPairs = getSmartBreedPairs();
    const infoToggle = document.getElementById('info-toggle');
    const infoDrawer = document.getElementById('info-drawer');
    infoToggle.classList.toggle('open', game.infoDrawerOpen);
    infoToggle.setAttribute('aria-expanded', String(game.infoDrawerOpen));
    infoDrawer.classList.toggle('open', game.infoDrawerOpen);
    document.getElementById('info-toggle-state').textContent = game.infoDrawerOpen ? '收起' : '展開';
    document.getElementById('info-toggle-sub').textContent =
      `播報 ${game.races.length} · 黑市 ${game.market.length} · 交配 ${smartPairs.length} · 紀錄 ${game.log.length}`;

    const feed = document.getElementById('race-feed');
    if (!game.races.length) {
      feed.innerHTML = `<div class="race-empty">尚未開戰，遣巔峰馬出戰即可賺取黃金。</div>`;
    } else {
      feed.innerHTML = game.races.map(r => `
        <div class="race-entry ${r.won ? 'win' : 'loss'}${r.isMajor ? ' major' : ''}">
          <span class="race-year">${r.isMajor ? '⚡ ' : ''}第 ${r.year / 1000} 年${r.raceType ? ' · ' + r.raceType : ''}${r.raceAttr ? ` <span class="attr-badge attr-${r.raceAttr}">${ATTR_LABEL[r.raceAttr]||r.raceAttr}</span>` : ''}${r.raceTerrain ? `<span class="terrain-badge">${r.raceTerrain}</span>` : ''}</span>
          <span class="race-matchup">
            <span class="player">${r.player.name}</span><span class="score">[${r.player.score}]</span>
            <span class="vs">VS</span>
            <span class="enemy">${r.enemy.name}</span><span class="score">[${r.enemy.score}]</span>
          </span>
          <span class="race-verdict ${r.won ? 'win' : 'loss'}">${r.won ? '勝' : '敗'}</span>
          <span class="race-reward ${r.won ? 'win' : 'loss'}">+${r.reward}G</span>
        </div>
      `).join('');
    }

    // 育種：主動方需參賽過；被選方（secondary）無限制
    const breedAge = h => h.age >= 1 && h.age <= 4;
    const allBreedable = [...game.horses, ...game.bench];
    // primary 候選：參賽過 + 未主動配過（公母皆然）；全年主動上限 6
    const capReached = (game.primariesThisYear || 0) >= 6;
    const primaryEligible = h => breedAge(h) && h.racedThisTurn && !h.bredThisTurn;
    const allPrimary = capReached ? [] : allBreedable.filter(primaryEligible);
    // secondary 候選：年齡符合即可（替補、未參賽、已配皆可）
    const allSecondaryPool = (gender) => allBreedable.filter(h => h.gender === gender && breedAge(h));
    // 清除失效的選擇
    if (!allPrimary.find(h => h.id === game.breedPrimaryId)) game.breedPrimaryId = null;
    if (game.breedPrimaryId === null) game.breedSecondaryId = null;
    const primary = allPrimary.find(h => h.id === game.breedPrimaryId) || null;
    const oppositeGender = primary ? (primary.gender === 'male' ? 'female' : 'male') : null;
    const secondaryPool = oppositeGender ? allSecondaryPool(oppositeGender) : [];
    if (!secondaryPool.find(h => h.id === game.breedSecondaryId)) game.breedSecondaryId = null;
    const secondary = secondaryPool.find(h => h.id === game.breedSecondaryId) || null;
    const father = primary?.gender === 'male' ? primary : secondary;
    const mother = primary?.gender === 'female' ? primary : secondary;

    const breedCardHtml = (h, isPrimary) => {
      const sel = isPrimary ? game.breedPrimaryId === h.id : game.breedSecondaryId === h.id;
      // primary：已主動交配過則 disabled（公母皆然）；secondary：任何人都可選
      const disabledCard = isPrimary && h.bredThisTurn;
      const cls = `breed-card${sel ? ' selected' : ''}${disabledCard ? ' disabled' : ''}`;
      const bredTag = h.bredThisTurn ? '已配' : `${h.age}歲`;
      const ageTag = isPrimary ? bredTag : (h.racedThisTurn ? `${h.age}歲` : `${h.age}歲・未賽`);
      const benchTag = game.bench.some(b => b.id === h.id) ? ` <span style="opacity:.5;font-size:9px">替補</span>` : '';
      return `
        <div class="${cls}" data-bid="${h.id}" data-step="${isPrimary ? 'primary' : 'secondary'}">
          <div class="breed-card-main">
            <div class="breed-card-name">${h.name}${h.skill ? ` <span class="skill-badge">${h.skill.name}</span>` : ''}${benchTag}</div>
            <div class="breed-card-stats">速${h.speed}・力${h.power}・體${h.stamina}・<span class="${h.gender}">${h.gender === 'male' ? '公' : '母'}</span></div>
          </div>
          <div style="text-align:right">
            <div class="breed-card-ovr">${ovrOf(h)}</div>
            <div class="breed-card-age">${ageTag}</div>
          </div>
        </div>`;
    };

    const primaryListEl   = document.getElementById('breed-primary-list');
    const secondaryListEl = document.getElementById('breed-secondary-list');
    const step2El = document.getElementById('breed-step2');
    const step2Title = document.getElementById('breed-step2-title');
    // 第一步：已完賽馬匹（公馬未主動配過）
    const sortByOvrDesc = arr => [...arr].sort((a, b) => ovrOf(b) - ovrOf(a));
    primaryListEl.innerHTML = allPrimary.length
      ? sortByOvrDesc(allPrimary).map(h => breedCardHtml(h, true)).join('')
      : `<div class="breed-empty">${capReached ? '本年主動交配已達上限 6 / 6' : '無已完賽馬匹可交配'}</div>`;
    // 第二步：選定主動方後才啟用；被選方無參賽限制
    if (!primary) {
      step2El.style.opacity = '0.35';
      step2El.style.pointerEvents = 'none';
      step2Title.textContent = '選擇配對對象';
      secondaryListEl.innerHTML = `<div class="breed-empty">請先選擇第一匹馬</div>`;
    } else {
      step2El.style.opacity = '';
      step2El.style.pointerEvents = '';
      step2Title.textContent = `配對對象（${primary.gender === 'male' ? '母馬' : '公馬'}）`;
      secondaryListEl.innerHTML = secondaryPool.length
        ? sortByOvrDesc(secondaryPool).map(h => breedCardHtml(h, false)).join('')
        : `<div class="breed-empty">無${primary.gender === 'male' ? '母馬' : '公馬'}可配對</div>`;
    }

    const breedBtnEl = document.getElementById('breed-btn');
    const pairEl = document.getElementById('breed-pair-display');
    pairEl.innerHTML = (father && mother)
      ? `<span class="pair-name">${father.name}</span><span class="pair-x">×</span><span class="pair-name">${mother.name}</span>`
      : `<span style="opacity:.5">— 先選第一匹，再選配對對象 —</span>`;
    breedBtnEl.disabled = !(father && mother);
    document.getElementById('breed-all-btn').disabled = !smartPairs.length;
    document.getElementById('breed-all-btn').textContent = smartPairs.length ? `智能交配 (${smartPairs.length})` : '智能交配';

    const vetBlock = document.getElementById('vet-advice-block');
    if (father && mother) {
      const advice = getVetAdvice(father, mother);
      vetBlock.style.display = '';
      vetBlock.className = `vet-advice${advice.sev ? ' sev-' + advice.sev : ''}`;
      vetBlock.innerHTML = `<div class="vet-name">🩺 瓦 拉 克 博 士 · 建 言</div><div class="vet-text">${advice.text.replace(/\n/g, '<br>')}</div>`;
    } else {
      vetBlock.style.display = 'none';
    }

    const buyAllBtn = document.getElementById('buy-all-market-btn');
    const affordableCount = getAffordableMarketCount();
    buyAllBtn.disabled = affordableCount === 0;
    buyAllBtn.textContent = affordableCount ? `全體購買 (${affordableCount})` : '全體購買';

    const marketList = document.getElementById('market-list');
    if (!game.market.length) {
      marketList.innerHTML = `<div class="empty">黑市清空，待下一年補貨。</div>`;
    } else {
      marketList.innerHTML = game.market.map(m => `
        <div class="market-card${m._discount ? ' discount' : ''}${m._rare ? ' rare' : ''}">
          <div class="horse-info">
            <div class="horse-name-row">
              <span class="horse-name">${m.name}</span>
              <span class="gender ${m.gender}">${m.gender === 'male' ? '公' : '母'}</span>
              ${m.skill ? `<span class="skill-badge">${m.skill.name}</span>` : ''}
              ${m._discount ? `<span class="discount-tag">特價</span>` : ''}
              ${m._rare ? `<span class="rare-tag">稀有</span>` : ''}
            </div>
            <div class="stats-row">
              <span class="stat-pill">速度 <strong>${m.speed}</strong></span>
              <span class="stat-pill">力量 <strong>${m.power}</strong></span>
              <span class="stat-pill">體力 <strong>${m.stamina}</strong></span>
            </div>
          </div>
          <div class="market-meta">
            <span class="ovr">OVR ${ovrOf(m)}</span>
            <span class="price">${m.price.toLocaleString()} G</span>
            <span class="status ${m.status}">${STATE_LABEL[m.status] || ''} ${m.age}歲</span>
          </div>
          <button class="buy-btn" data-mid="${m.id}" ${game.money < m.price ? 'disabled' : ''}>${game.money < m.price ? '黃金不足' : '購入'}</button>
        </div>
      `).join('');
    }

    const list = document.getElementById('horse-list');
    if (!game.horses.length) {
      list.innerHTML = `<div class="empty">馬廄空無一物。</div>`;
    } else {
      const sorted = [...game.horses].sort((a, b) => ovrOf(b) - ovrOf(a));
      const majorFull = game.currentTurnMajor && game.horses.filter(h => h.racedThisTurn).length >= 2;
      const cards = sorted.map(h => {
        const mut = h.mutated || {};
        const raceBtn = h.status === STATE_PEAK
          ? `<button class="race-btn" data-id="${h.id}" ${(h.racedThisTurn || majorFull) ? 'disabled' : ''}>${h.racedThisTurn ? '已參賽' : majorFull ? '名額已滿' : '參加賽事'}</button>`
          : '';
        const swapBtn = `<button class="roster-swap-btn demote" data-bench-id="${h.id}">下放替補 ▾</button>`;
        const eSpd = effectiveStat(h, 'speed'), ePow = effectiveStat(h, 'power'), eSta = effectiveStat(h, 'stamina');
        const traitBadges = h.traits ? h.traits.displayed.map(t => {
          const td = TRAIT_DATA[t.id];
          return td ? `<span class="trait-badge ${t.type}" data-tooltip="${td.desc}">${td.name}</span>` : '';
        }).join('') : '';
        const markBadges = (h.marks || []).map(m => {
          const md = MARK_DATA[m.id];
          return md ? `<span class="mark-badge" data-tooltip="${md.desc}">★ ${md.name}</span>` : '';
        }).join('');
        const recessiveWarn = h.traits && h.traits.recessiveFlags.length
          ? `<span class="trait-warning">⚠ 不詳因子</span>` : '';
        const recessiveMarkWarn = (h.marksRecessive && h.marksRecessive.length)
          ? `<span class="trait-warning">★ 印記血脈</span>` : '';
        const rarityId = (typeof window.rarityOf === 'function') ? window.rarityOf(h).id : '';
        const ageDim = h.status !== STATE_PEAK ? 'dim' : '';
        return `
          <div class="horse-card" data-id="${h.id}"${rarityId ? ` data-rarity="${rarityId}"` : ''}>
            <div class="horse-info">
              <div class="horse-name-row">
                <span class="horse-name">${h.name}</span>
                <span class="gender ${h.gender}">${h.gender === 'male' ? '公' : '母'}</span>
              </div>
              <div class="stats-row">
                <span class="stat-pill ${mut.speed ? 'mut' : eSpd > h.speed ? 'boosted' : ''}">速度 <strong>${eSpd}</strong></span>
                <span class="stat-pill ${mut.power ? 'mut' : ePow > h.power ? 'boosted' : ''}">力量 <strong>${ePow}</strong></span>
                <span class="stat-pill ${mut.stamina ? 'mut' : eSta > h.stamina ? 'boosted' : ''}">體力 <strong>${eSta}</strong></span>
              </div>
              ${(traitBadges || markBadges || recessiveWarn || recessiveMarkWarn) ? `<div class="trait-row">${markBadges}${traitBadges}${recessiveWarn}${recessiveMarkWarn}</div>` : ''}
            </div>
            <div class="horse-meta">
              <span class="ovr">OVR ${ovrOf(h)}</span>
              ${h.skill ? `<span class="skill-badge">${h.skill.name}</span>` : ''}
              <span class="age ${ageDim}">${h.age} 歲</span>
            </div>
            ${raceBtn}
            ${swapBtn}
          </div>
        `;
      }).join('');

      list.innerHTML = cards;
    }

    // Bench list
    const benchListEl = document.getElementById('bench-list');
    const benchCapEl = document.getElementById('bench-cap');
    if (benchCapEl) benchCapEl.textContent = `${game.bench.length} 匹`;
    if (benchListEl) {
      if (!game.bench.length) {
        benchListEl.innerHTML = `<div class="bench-empty">替補席尚無馬匹。</div>`;
      } else {
        const sortedBench = [...game.bench].sort((a, b) => ovrOf(b) - ovrOf(a));
        const activeFull = game.horses.length >= game.stableSize;
        benchListEl.innerHTML = sortedBench.map(h => {
          const mut = h.mutated || {};
          const eSpd = effectiveStat(h, 'speed'), ePow = effectiveStat(h, 'power'), eSta = effectiveStat(h, 'stamina');
          const traitBadges = h.traits ? h.traits.displayed.map(t => {
            const td = TRAIT_DATA[t.id];
            return td ? `<span class="trait-badge ${t.type}" data-tooltip="${td.desc}">${td.name}</span>` : '';
          }).join('') : '';
          const markBadges = (h.marks || []).map(m => {
            const md = MARK_DATA[m.id];
            return md ? `<span class="mark-badge" data-tooltip="${md.desc}">★ ${md.name}</span>` : '';
          }).join('');
          const recessiveWarn = h.traits && h.traits.recessiveFlags.length
            ? `<span class="trait-warning">⚠ 不詳因子</span>` : '';
          const rarityId = (typeof window.rarityOf === 'function') ? window.rarityOf(h).id : '';
          return `
            <div class="horse-card" data-id="${h.id}"${rarityId ? ` data-rarity="${rarityId}"` : ''} style="opacity:.85">
              <div class="horse-info">
                <div class="horse-name-row">
                  <span class="horse-name">${h.name}</span>
                  <span class="gender ${h.gender}">${h.gender === 'male' ? '公' : '母'}</span>
                </div>
                <div class="stats-row">
                  <span class="stat-pill ${mut.speed ? 'mut' : ''}">速度 <strong>${eSpd}</strong></span>
                  <span class="stat-pill ${mut.power ? 'mut' : ''}">力量 <strong>${ePow}</strong></span>
                  <span class="stat-pill ${mut.stamina ? 'mut' : ''}">體力 <strong>${eSta}</strong></span>
                </div>
                ${(traitBadges || markBadges || recessiveWarn) ? `<div class="trait-row">${markBadges}${traitBadges}${recessiveWarn}</div>` : ''}
              </div>
              <div class="horse-meta">
                <span class="ovr">OVR ${ovrOf(h)}</span>
                ${h.skill ? `<span class="skill-badge">${h.skill.name}</span>` : ''}
                <span class="age dim">${h.age} 歲</span>
              </div>
              <button class="roster-swap-btn promote" data-roster-id="${h.id}" ${activeFull ? 'disabled' : ''}>${activeFull ? '先發已滿' : '上場 ▴'}</button>
            </div>
          `;
        }).join('');
      }
    }

    // Roster advance button only valid in roster sub-phase
    const rosterBtn = document.getElementById('advance-roster-btn');
    if (rosterBtn) rosterBtn.disabled = game.subPhase !== 'roster';

    const logEl = document.getElementById('log');
    logEl.innerHTML = game.log
      .map(l => `<div class="log-entry ${l.kind}">› ${l.text}</div>`)
      .join('');

    const ragBanner = document.getElementById('ragnarok-banner');
    if (game.ragnarok) {
      ragBanner.style.display = 'block';
      const { entries, totalPlayers } = game.ragnarok;
      const best = entries.find(e => e.isPlayer);
      const rank = best ? entries.indexOf(best) + 1 : null;
      const rankLabel = rank ? (RANK_LABELS[rank - 1] || `第 ${rank} 名`) : '無人參戰';
      const rows = entries.map((e, i) => {
        const rl = RANK_LABELS[i] || `${i + 1}`;
        const terrainTag = e.isPlayer && e.raceAttr
          ? ` <span class="attr-badge attr-${e.raceAttr}">${ATTR_LABEL[e.raceAttr]||e.raceAttr}</span><span class="terrain-badge">${e.raceTerrain}</span>`
          : '';
        return `<div class="rag-rank-row${e.isPlayer ? ' player' : ''}" style="animation-delay:${i * 0.1}s">
          <span class="rag-rank-num">${rl}</span>
          <span class="rag-rank-name">${e.name}${e.skillName ? ` ·${e.skillName}` : ''}${terrainTag}</span>
          <span class="rag-rank-ovr">OVR ${e.ovr}</span>
          <span class="rag-rank-score">[${e.score}]</span>
        </div>`;
      }).join('');
      ragBanner.innerHTML = `
        <div class="ragnarok-title">⚡ RAGNARÖK</div>
        <div class="ragnarok-champion">${best ? `${rankLabel} · ${best.name}（OVR ${best.ovr}）` : '無人參戰'}</div>
        <div class="ragnarok-battles">${rows}</div>
        <div class="ragnarok-sub">${totalPlayers} 匹靈魂與現役 · 挑戰四天王</div>
      `;
    } else if (game.yearsElapsed >= game.maxYears) {
      ragBanner.style.display = 'block';
      ragBanner.innerHTML = `
        <div class="ragnarok-title">⚡ RAGNARÖK</div>
        <div class="ragnarok-sub">三萬年已終，是時候決一死戰。</div>
        <button class="primary" id="enter-ragnarok-btn" style="margin-top:18px;letter-spacing:.2em">進入終局</button>
      `;
    } else {
      ragBanner.style.display = 'none';
    }

    const capEl = document.getElementById('stable-cap');
    if (capEl) {
      const full = game.horses.length >= game.stableSize;
      capEl.textContent = `${game.horses.length} / ${game.stableSize}`;
      capEl.classList.toggle('full', full);
    }

    renderChoiceModal();
  }

  function renderChoiceModal() {
    const overlay = document.getElementById('choice-modal');
    const titleEl = document.getElementById('choice-modal-title');
    const cardsEl = document.getElementById('choice-cards');
    if (!game.pendingChoice) {
      overlay.classList.remove('open');
      return;
    }
    const { kind, cards, context } = game.pendingChoice;
    if (kind === 'event') {
      titleEl.textContent = '活 動 · 三 選 一';
    } else if (kind === 'mark') {
      const horse = game.horses.find(h => h.id === context.horseId);
      titleEl.textContent = horse ? `印 記 賜 予 · ${horse.name}` : '印 記 賜 予';
    }
    cardsEl.innerHTML = cards.map((c, i) => {
      let target = '';
      if (c.kind === 'trait') {
        const candidate = game.horses
          .filter(h => h.traits && !h.traits.displayed.some(t => t.id === c.traitId))
          .sort((a, b) => ovrOf(b) - ovrOf(a))[0];
        target = candidate ? `→ 將施加於 ${candidate.name}` : '→ 無對象（將浪費）';
      } else if (c.kind === 'marketBuff') {
        target = '→ 影響下一年的黑市（價格上漲）';
      } else if (c.kind === 'marketDiscount') {
        target = '→ 影響下一年的黑市（價格不變）';
      } else if (c.kind === 'gold') {
        target = `→ +${c.amount}G`;
      } else if (c.kind === 'foal') {
        target = `→ 替補席 +1 隻 0 歲幼駒`;
      } else if (c.kind === 'mark') {
        target = '→ 永久印記，A 型隱性遺傳';
      }
      const kindLabel = c.kind === 'mark' ? '印記'
                      : c.kind === 'trait' ? '藍特'
                      : c.kind === 'marketBuff' ? '黑市'
                      : c.kind === 'marketDiscount' ? '黑市'
                      : c.kind === 'foal' ? '幼駒'
                      : '即時';
      const rarity = c.rarity || (game.pendingChoice.kind === 'mark' ? 'rare' : 'common');
      const rarityLabel = rarity === 'rare' ? '稀有' : '普通';
      return `
        <div class="choice-card rarity-${rarity}" data-idx="${i}">
          <div class="choice-card-tags">
            <div class="choice-card-kind">${kindLabel}</div>
            <div class="choice-card-rarity rarity-${rarity}">${rarityLabel}</div>
          </div>
          <div class="choice-card-title">${c.title}</div>
          <div class="choice-card-desc">${c.desc}</div>
          <div class="choice-card-target">${target}</div>
        </div>
      `;
    }).join('');
    overlay.classList.add('open');
  }

  function pickChoiceCard(idx) {
    if (!game.pendingChoice) return;
    const card = game.pendingChoice.cards[idx];
    if (!card) return;
    if (game.pendingChoice.kind === 'event') {
      applyChoiceCard(card);
    } else if (game.pendingChoice.kind === 'mark') {
      const horse = game.horses.find(h => h.id === game.pendingChoice.context.horseId);
      if (horse) awardMark(horse, card.markId);
    }
    resolvePending();
    render();
  }

  document.getElementById('fab-next').addEventListener('click', nextTurn);
  document.getElementById('fab-omni').addEventListener('click', runOmniAction);
  document.getElementById('next-turn').addEventListener('click', nextTurn);
  document.getElementById('info-toggle').addEventListener('click', () => {
    game.infoDrawerOpen = !game.infoDrawerOpen;
    render();
  });
  document.getElementById('all-race-btn').addEventListener('click', runAllRaces);
  document.getElementById('anim-toggle-btn').addEventListener('click', () => {
    game.settings.animationsEnabled = !game.settings.animationsEnabled;
    const btn = document.getElementById('anim-toggle-btn');
    btn.textContent = game.settings.animationsEnabled ? '▶ 動畫 ON' : '⏭ 動畫 OFF';
  });
  document.getElementById('horse-list').addEventListener('click', (e) => {
    const raceBtn = e.target.closest('.race-btn');
    if (raceBtn && !raceBtn.disabled) {
      runRace(raceBtn.dataset.id);
      return;
    }
    const demoteBtn = e.target.closest('.roster-swap-btn.demote');
    if (demoteBtn) {
      moveToBench(demoteBtn.dataset.benchId);
      return;
    }
  });
  document.getElementById('bench-list').addEventListener('click', (e) => {
    const promoteBtn = e.target.closest('.roster-swap-btn.promote');
    if (promoteBtn && !promoteBtn.disabled) {
      moveToRoster(promoteBtn.dataset.rosterId);
    }
  });
  document.getElementById('advance-roster-btn').addEventListener('click', advanceFromRoster);
  document.getElementById('buy-all-market-btn').addEventListener('click', smartBuy);
  document.getElementById('market-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.buy-btn');
    if (!btn || btn.disabled) return;
    buyMarketHorse(btn.dataset.mid);
  });
  function handleBreedListClick(e) {
    const card = e.target.closest('.breed-card');
    if (!card || card.classList.contains('disabled')) return;
    const id = card.dataset.bid;
    const step = card.dataset.step;
    if (step === 'primary') {
      game.breedPrimaryId = (game.breedPrimaryId === id) ? null : id;
      if (!game.breedPrimaryId) game.breedSecondaryId = null;
    } else if (step === 'secondary') {
      game.breedSecondaryId = (game.breedSecondaryId === id) ? null : id;
    }
    render();
  }
  document.getElementById('breed-primary-list').addEventListener('click', handleBreedListClick);
  document.getElementById('breed-secondary-list').addEventListener('click', handleBreedListClick);

  document.getElementById('breed-btn').addEventListener('click', () => {
    const allBreedable = [...game.horses, ...game.bench];
    const primary = allBreedable.find(h => h.id === game.breedPrimaryId);
    const secondary = allBreedable.find(h => h.id === game.breedSecondaryId);
    if (!primary || !secondary) return;
    const fatherId = primary.gender === 'male' ? primary.id : secondary.id;
    const motherId = primary.gender === 'female' ? primary.id : secondary.id;
    breed(fatherId, motherId, primary.id);
    game.breedSecondaryId = null; // 清除配對對象；保留第一匹方便連配
  });
  document.getElementById('breed-all-btn').addEventListener('click', breedAll);

  document.getElementById('ragnarok-banner').addEventListener('click', (e) => {
    if (e.target.id === 'enter-ragnarok-btn') triggerRagnarok();
  });

  document.getElementById('choice-modal').addEventListener('click', (e) => {
    const card = e.target.closest('.choice-card');
    if (!card) return;
    pickChoiceCard(parseInt(card.dataset.idx, 10));
  });

  // 馬匹清單 modal
  let modalTab = 'active';
  function traitBadgesHtml(horse) {
    if (!horse.traits) return '';
    const badges = horse.traits.displayed.map(t => {
      const td = TRAIT_DATA[t.id];
      return td ? `<span class="trait-badge ${t.type}" data-tooltip="${td.desc}">${td.name}</span>` : '';
    }).join('');
    const warn = horse.traits.recessiveFlags.length
      ? `<span class="trait-warning">⚠ 不詳因子</span>` : '';
    return badges + warn;
  }
  function renderModal() {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === modalTab));
    const body = document.getElementById('modal-body');
    if (modalTab === 'pool') {
      body.innerHTML = `<div class="modal-empty">育種資料庫尚未開放（Stage C-4 待實作）</div>`;
      return;
    }
    const list = modalTab === 'active'
      ? [...game.horses].sort((a, b) => ovrOf(b) - ovrOf(a))
      : [...game.souls].sort((a, b) => ovrOf(b) - ovrOf(a));
    if (!list.length) {
      body.innerHTML = `<div class="modal-empty">${modalTab === 'active' ? '馬廄空無一物。' : '靈魂區空無一物。'}</div>`;
      return;
    }
    body.innerHTML = `<div class="modal-horse-list">${list.map(h => `
      <div class="modal-horse-row" data-id="${h.id}">
        <div class="modal-horse-info">
          <div class="modal-horse-name">
            ${h.name}
            <span class="gender ${h.gender}">${h.gender === 'male' ? '公' : '母'}</span>
            ${h.skill ? `<span class="skill-badge">${h.skill.name}</span>` : ''}
          </div>
          <div class="modal-horse-sub">${h.age}歲 · 速${effectiveStat(h,'speed')} 力${effectiveStat(h,'power')} 體${effectiveStat(h,'stamina')}</div>
          <div class="trait-row" style="margin-top:5px">${traitBadgesHtml(h)}</div>
        </div>
        <div class="modal-horse-ovr">OVR ${ovrOf(h)}</div>
      </div>
    `).join('')}</div>`;
  }
  document.getElementById('roster-btn').addEventListener('click', () => {
    document.getElementById('horse-modal').classList.add('open');
    renderModal();
  });
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('horse-modal').classList.remove('open');
  });
  document.getElementById('horse-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('horse-modal'))
      document.getElementById('horse-modal').classList.remove('open');
  });
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => { modalTab = tab.dataset.tab; renderModal(); });
  });

  init();

  // 主按鈕可見時隱藏右下角 FAB
  const fabNext = document.getElementById('fab-next');
  const mainBtn = document.getElementById('next-turn');
  new IntersectionObserver(([entry]) => {
    fabNext.classList.toggle('hidden', entry.isIntersecting);
  }, { threshold: 0.5 }).observe(mainBtn);
