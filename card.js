// 馬匹詳細卡片：稀有度判定 + 卡片渲染 + 翻牌互動
// 依賴（皆來自 index.html 主 script 的 script-scope）：
//   ovrOf, effectiveStat, TRAIT_DATA, ORIGIN_DATA, STATE_LABEL, game

const RARITY_TIERS = [
  { id: 'godlike',   label: 'GODLIKE',   min: 90 },
  { id: 'mythic',    label: 'MYTHIC',    min: 80 },
  { id: 'legendary', label: 'LEGENDARY', min: 70 },
  { id: 'epic',      label: 'EPIC',      min: 60 },
  { id: 'rare',      label: 'RARE',      min: 45 },
  { id: 'common',    label: 'COMMON',    min: 0 },
];

function rarityOf(horse) {
  const hasGold = horse.traits && horse.traits.displayed.some(t => t.type === 'gold');
  const ovr = ovrOf(horse);
  // 金特 + OVR ≥ 75 才直升 GODLIKE；否則金特只給 +1 tier bump（避免 OVR 59 標 GODLIKE）
  if (hasGold && ovr >= 75) return RARITY_TIERS[0];
  let baseIdx = RARITY_TIERS.length - 1;
  for (let i = 0; i < RARITY_TIERS.length; i++) {
    if (ovr >= RARITY_TIERS[i].min) { baseIdx = i; break; }
  }
  return hasGold ? RARITY_TIERS[Math.max(0, baseIdx - 1)] : RARITY_TIERS[baseIdx];
}

function isLuckyBirth(horse) {
  if (!horse.mutated) return false;
  if (horse.mutated.speed || horse.mutated.power || horse.mutated.stamina) return true;
  if (horse.traits && horse.traits.displayed.some(t => t.type === 'gold')) return true;
  return false;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHorseCardHtml(horse) {
  const tier = rarityOf(horse);
  const originLabel = (typeof ORIGIN_DATA !== 'undefined' && ORIGIN_DATA[horse.origin])
    ? ORIGIN_DATA[horse.origin].label : '不詳';
  const ovr = ovrOf(horse);
  const mut = horse.mutated || {};
  const eSpd = effectiveStat(horse, 'speed');
  const ePow = effectiveStat(horse, 'power');
  const eSta = effectiveStat(horse, 'stamina');
  const stateLabel = (typeof STATE_LABEL !== 'undefined') ? (STATE_LABEL[horse.status] || '') : '';

  const stat = (label, base, eff, mutFlag) => {
    const cls = mutFlag ? 'mut' : (eff > base ? 'boost' : '');
    return `
      <div class="card-stat ${cls}">
        <div class="card-stat-label">${label}</div>
        <div class="card-stat-num">${eff}</div>
      </div>`;
  };

  const traitsHtml = (() => {
    const list = (horse.traits && horse.traits.displayed) || [];
    if (!list.length && !(horse.traits && horse.traits.recessiveFlags.length)) return '';
    const items = list.map(t => {
      const td = TRAIT_DATA[t.id];
      if (!td) return '';
      return `
        <div class="card-trait">
          <span class="card-trait-tag ${t.type}">${escapeHtml(td.name)}</span>
          <span class="card-trait-desc">${escapeHtml(td.desc)}</span>
        </div>`;
    }).join('');
    const recessive = (horse.traits && horse.traits.recessiveFlags.length)
      ? `<div class="card-recessive">⚠ 血統中潛藏 ${horse.traits.recessiveFlags.length} 項不詳因子</div>`
      : '';
    return `
      <div class="card-section">
        <div class="card-section-title">特  性</div>
        ${items || '<div class="card-trait-desc" style="opacity:.7">尚無顯現特性</div>'}
        ${recessive}
      </div>`;
  })();

  const parentsHtml = (() => {
    if (!horse.parents) {
      return `
        <div class="card-section">
          <div class="card-section-title">血  統</div>
          <div class="card-parents-empty">血統不詳 — 第一代</div>
        </div>`;
    }
    const p = horse.parents;
    const parentBlock = (role, info) => `
      <div class="card-parent">
        <div class="card-parent-role">${role}</div>
        <div class="card-parent-name">${escapeHtml(info.name)}</div>
        <div class="card-parent-ovr">OVR ${info.ovr}</div>
      </div>`;
    return `
      <div class="card-section">
        <div class="card-section-title">血  統</div>
        <div class="card-parents">
          ${parentBlock('父', p.father)}
          <div class="card-parent-x">×</div>
          ${parentBlock('母', p.mother)}
        </div>
      </div>`;
  })();

  return `
    <div class="horse-card-detail rarity-${tier.id}">
      <button class="card-close-btn" data-card-close type="button" aria-label="關閉">✕</button>
      <div class="card-top">
        <span class="card-rarity-tag">${tier.label}</span>
        <span class="card-origin-tag">${escapeHtml(originLabel)}</span>
      </div>
      <div class="card-name-row">
        <span class="card-name">${escapeHtml(horse.name)}</span>
        <span class="card-gender ${horse.gender}">${horse.gender === 'male' ? '公' : '母'}</span>
      </div>
      <div class="card-ovr-block">
        <div class="card-ovr-num">${ovr}</div>
        <div class="card-ovr-label">O V R</div>
      </div>
      <div class="card-stats">
        ${stat('速度', horse.speed, eSpd, mut.speed)}
        ${stat('力量', horse.power, ePow, mut.power)}
        ${stat('體力', horse.stamina, eSta, mut.stamina)}
      </div>
      <div class="card-meta-row">
        <span class="card-meta-pill">${horse.age} 歲</span>
        ${stateLabel ? `<span class="card-meta-pill">${escapeHtml(stateLabel)}</span>` : ''}
        ${horse.skill ? `<span class="card-meta-pill skill">技能：${escapeHtml(horse.skill.name)} +${horse.skill.bonus}</span>` : ''}
      </div>
      ${traitsHtml}
      ${parentsHtml}
    </div>`;
}

const cardBackHtml = `
  <div class="card-back-mystery" data-card-flip>
    <div class="card-back-glyph">✦</div>
    <div class="card-back-title">幸 運 暴 擊</div>
    <div class="card-back-hint">點 擊 翻 開</div>
  </div>`;

function ensureCardModal() {
  let overlay = document.getElementById('card-modal');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'card-modal';
  overlay.className = 'card-overlay';
  overlay.innerHTML = `
    <div class="card-stage">
      <div class="card-flip">
        <div class="card-face card-front"></div>
        <div class="card-face card-back"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { closeHorseCard(); return; }
    if (e.target.closest('[data-card-close]')) { closeHorseCard(); return; }
    const flipTrigger = e.target.closest('[data-card-flip]');
    if (flipTrigger) {
      const flip = overlay.querySelector('.card-flip');
      flip.classList.remove('flipped'); // back → front
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeHorseCard();
  });
  return overlay;
}

function openHorseCard(horse, opts = {}) {
  const overlay = ensureCardModal();
  const stage = overlay.querySelector('.card-stage');
  const flip = overlay.querySelector('.card-flip');
  const front = overlay.querySelector('.card-front');
  const back = overlay.querySelector('.card-back');

  front.innerHTML = renderHorseCardHtml(horse);

  const lucky = !!opts.lucky;
  const reveal = !!opts.reveal;

  if (lucky) {
    back.innerHTML = cardBackHtml;
    flip.classList.add('flipped');
  } else {
    back.innerHTML = '';
    flip.classList.remove('flipped');
  }

  stage.classList.remove('revealing');
  if (reveal && !lucky) {
    void stage.offsetWidth;
    stage.classList.add('revealing');
  }

  overlay.classList.add('open');
}

function closeHorseCard() {
  const overlay = document.getElementById('card-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
  const flip = overlay.querySelector('.card-flip');
  if (flip) flip.classList.remove('flipped');
}

// 全域點擊代理：點 .horse-card / .soul-card / .modal-horse-row 開卡
document.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  if (e.target.closest('.race-btn')) return;
  const el = e.target.closest('.horse-card[data-id], .soul-card[data-id], .modal-horse-row[data-id]');
  if (!el) return;
  const id = el.dataset.id;
  if (typeof game === 'undefined') return;
  const h = game.horses.find(x => x.id === id) || game.souls.find(x => x.id === id);
  if (h) openHorseCard(h);
});

// 暴露給主 script
window.openHorseCard = openHorseCard;
window.closeHorseCard = closeHorseCard;
window.rarityOf = rarityOf;
window.isLuckyBirth = isLuckyBirth;
