// data.js — 常數與資料表（特性 / 印記 / 賽道 / 物理 / 獸醫詞庫）
// 載入順序：names.js → card.js → data.js → game.js → render.js
// 此檔不依賴 game state，純資料；可被三個 JS 檔共用。

  const ENEMY_NAMES = [
    '鬼面', '渡鴉', '夜叉', '魔僕', '無常',
    '獄卒', '咆哮', '炎魔', '邪光', '骨刃',
    '腐骸', '黑焰', '殞靈', '夜梟', '幽煞'
  ];

  const STATE_FOAL = 'foal';
  const STATE_PEAK = 'peak';
  const STATE_RETIRED = 'retired';
  const STATE_LABEL = { foal: '幼駒', peak: '巔峰', retired: '退役' };

  const BLUE_IDS = ['B01','B02','B03','B04','B05','B06','B07','B08'];
  const RED_IDS  = ['R01','R02','R03','R04','R05','R06'];

  const STAT_LABEL = { speed: '速度', power: '力量', stamina: '體力' };
  const ATTR_LABEL = { Normal: '一般', Fire: '烈焰', Ice: '冰川', Sand: '沙漠', All: '全場地' };
  const FOUR_KINGS = [
    { name: '炎獄王',   speed: 85, power: 65, stamina: 70 }, // OVR 73
    { name: '冥府王',   speed: 65, power: 88, stamina: 70 }, // OVR 74
    { name: '血戰王',   speed: 70, power: 75, stamina: 90 }, // OVR 78
    { name: '千年魔王', speed: 90, power: 90, stamina: 90 }, // OVR 90
  ];
  const SKILL_LIST = [
    { name: '疾風', stat: 'speed',   bonus: 15 },
    { name: '霸力', stat: 'power',   bonus: 15 },
    { name: '鋼魂', stat: 'stamina', bonus: 15 },
  ];
  const MUTATION_RATE = 0.10;
  const DEGENERATION_RATE = 0.05;
  const POPULATION_MEAN = 50;
  const REGRESSION_PULL = 0.2;
  const BREED_NOISE = 20;

  const TRAIT_DATA = {
    B01: { id:'B01', type:'blue', name:'火足',       desc:'火焰賽道戰力 +8%' },
    B02: { id:'B02', type:'blue', name:'長毛',       desc:'冰雪賽道戰力 +8%' },
    B03: { id:'B03', type:'blue', name:'駱駝',       desc:'沙漠賽道戰力 +8%' },
    B04: { id:'B04', type:'blue', name:'神山',       desc:'爬山地形戰力 +10%' },
    B05: { id:'B05', type:'blue', name:'GTR',        desc:'長平原地形戰力 +10%' },
    B06: { id:'B06', type:'blue', name:'越野',       desc:'髮夾彎賽道戰力 +10%' },
    B07: { id:'B07', type:'blue', name:'全能',       desc:'每持有 1 個其他藍特，戰力額外 +3%' },
    B08: { id:'B08', type:'blue', name:'繁殖專家',   desc:'交配時藍特繼承率提升（單親 50→80%、雙親 70→85%）' },
    R01: { id:'R01', type:'red',  name:'燃盡',     desc:'每場出賽後速度永久 -1' },
    R02: { id:'R02', type:'red',  name:'玻璃骨',   desc:'非對應賽道戰力 -20%' },
    R03: { id:'R03', type:'red',  name:'玻璃心',   desc:'大典必敗，無視戰力' },
    R04: { id:'R04', type:'red',  name:'孤傲',     desc:'參賽時自身所有特性效果失效（仍可遺傳）' },
    R05: { id:'R05', type:'red',  name:'短命血統', desc:'壽命縮短，Age 4 直接死亡' },
    R06: { id:'R06', type:'red',  name:'暴食',     desc:'每年消耗 80G 飼料費' },
    G01: { id:'G01', type:'gold', name:'地獄之王', desc:'Ragnarök 中所有屬性視為匹配' },
    G02: { id:'G02', type:'gold', name:'鳳凰之血', desc:'死亡時 30% 機率以幼駒姿態重生（一次性）' },
  };

  const MARK_DATA = {
    M01: { id:'M01', name:'無瑕之眼', desc:'速度上限突破至 115（即刻 +15、上限 100→115）' },
    M02: { id:'M02', name:'戰神血脈', desc:'大典中三圍視為 +10（速/力/體 各 +10）' },
  };
  const MARK_IDS = ['M01', 'M02'];

  const EVENT_CARDS = [
    { id:'E_B01', kind:'trait', traitId:'B01', title:'火足傳承', desc:'將藍特「火足」(火焰賽道+8%) 賜予馬廄 OVR 最高的馬。' },
    { id:'E_B02', kind:'trait', traitId:'B02', title:'長毛傳承', desc:'將藍特「長毛」(冰雪賽道+8%) 賜予馬廄 OVR 最高的馬。' },
    { id:'E_B03', kind:'trait', traitId:'B03', title:'駱駝傳承', desc:'將藍特「駱駝」(沙漠賽道+8%) 賜予馬廄 OVR 最高的馬。' },
    { id:'E_B04', kind:'trait', traitId:'B04', title:'神山傳承', desc:'將藍特「神山」(爬山地形+10%) 賜予馬廄 OVR 最高的馬。' },
    { id:'E_B05', kind:'trait', traitId:'B05', title:'GTR傳承',  desc:'將藍特「GTR」(長平原+10%) 賜予馬廄 OVR 最高的馬。' },
    { id:'E_B06', kind:'trait', traitId:'B06', title:'越野傳承', desc:'將藍特「越野」(髮夾彎+10%) 賜予馬廄 OVR 最高的馬。' },
    { id:'E_RARE', kind:'marketBuff', title:'稀有馬場', desc:'下一年的黑市馬匹三圍全部 +15。' },
    { id:'E_GOLD', kind:'gold', amount:5, title:'黃金祭壇', desc:'立即獲得 5G。' },
  ];

  const RACE_TYPES = [
    { name:'冥原衝刺', attr:'Normal', terrain:'長平原' },
    { name:'烈焰賽道', attr:'Fire',   terrain:'長平原' },
    { name:'冰川之路', attr:'Ice',    terrain:'髮夾彎' },
    { name:'沙漠突圍', attr:'Sand',   terrain:'長平原' },
    { name:'魔山登頂', attr:'Normal', terrain:'爬山'   },
    { name:'地獄起伏', attr:'Fire',   terrain:'髮夾彎' },
  ];

  // ── Stage F: 物理引擎 ─────────────────────────────────────────────
  // segment.kind: straight | mildCurve | hairpin | climb | descent | sprint
  const TRACK_DEFS = {
    '長平原': {
      length: 2400,
      segments: [
        { kind:'straight',   length:700 },
        { kind:'mildCurve',  length:300 },
        { kind:'straight',   length:800 },
        { kind:'sprint',     length:600 },
      ],
    },
    '髮夾彎': {
      length: 1600,
      segments: [
        { kind:'straight', length:400 },
        { kind:'hairpin',  length:200 },
        { kind:'straight', length:400 },
        { kind:'hairpin',  length:200 },
        { kind:'sprint',   length:400 },
      ],
    },
    '爬山': {
      length: 1200,
      segments: [
        { kind:'straight', length:200 },
        { kind:'climb',    length:600 },
        { kind:'descent',  length:200 },
        { kind:'sprint',   length:200 },
      ],
    },
  };

  // 氣候對全程的 debuff；藍特 B01/B02/B03 抵消並反向加成
  const CLIMATE_MODS = {
    Normal: { name:'常規', maxSpeedMul:1.00, accelMul:1.00, drainMul:1.00, curvePenaltyMul:1.00, adaptTrait:null },
    Fire:   { name:'烈焰', maxSpeedMul:1.00, accelMul:1.00, drainMul:1.15, curvePenaltyMul:1.00, adaptTrait:'B01' },
    Ice:    { name:'冰川', maxSpeedMul:1.00, accelMul:0.90, drainMul:1.00, curvePenaltyMul:1.00, adaptTrait:'B02' },
    Sand:   { name:'沙漠', maxSpeedMul:0.95, accelMul:1.00, drainMul:1.00, curvePenaltyMul:1.00, adaptTrait:'B03' },
  };

  // 三圍 → 物理屬性
  const STAT_FORMULA = {
    maxSpeed:    s => 12 + s * 0.10,   // m/s
    accel:       p => 0.5 + p * 0.04,  // m/s²
    staminaPool: e => 50 + e,          // 體力池
    drainAtSpeed: v => v * 0.05,       // 每 tick 體力消耗
  };

  const RACE_TICK_CAP = 250;

  const VET_LINES = {
    goldResonance:{ text:'……老夫行醫數千年，僅見過寥寥數次這種血統共鳴。\n不敢妄言，但請務必好好珍惜這一胎。', sev:'gold' },
    redDouble:    { text:'老夫有句話不得不說……這對血統曾令老夫見過慘烈的結局。\n子代或將承受難以擺脫的詛咒，還請三思。', sev:'high' },
    redSingle:    { text:'此方血液中有些令老夫不安的氣息。\n子代或許會繼承某種難以克服的弱點。', sev:'medium' },
    recessiveB01: { text:'血統中似乎潛藏著與烈火親近的因子。\n若子代繼承，在特定賽道或有驚人表現。', sev:'' },
    recessiveB02: { text:'隱約感受到冰雪血脈的共鳴。\n子代或許天生適應嚴寒之地。', sev:'' },
    recessiveB03: { text:'沙塵的氣息在血統中流動。\n子代在荒漠賽道或有超乎預期的發揮。', sev:'' },
    recessiveB04: { text:'骨骼結構頗為紮實，山地血統的印記清晰可見。\n爬坡或是此子天生的舞台。', sev:'' },
    recessiveB05: { text:'四肢比例修長，有平原疾馳者的血統輪廓。\n長直賽道或能見到此子的真正速度。', sev:'' },
    recessiveB06: { text:'重心極低，對連續彎道有天然的適應傾向。\n或許能在最複雜的髮夾賽道中找到節奏。', sev:'' },
    recessiveB07: { text:'血脈中似乎潛藏著某種「共鳴」之力。\n若子代繼承且擁有多個天賦，將彼此放大。', sev:'' },
    recessiveB08: { text:'此血脈生機旺盛，傳承之力勝於常理。\n子代或將更完整地承繼父母的隱性天賦。', sev:'' },
    highDiff:     { text:'血統差異顯著，子代走向難以預測。\n然而，老夫見過最驚人的突破，往往來自這樣的配對。', sev:'' },
    lowDiff:      { text:'兩者血統過於相近，子代恐怕難有突破。\n突變，是唯一的希望。', sev:'' },
    normal:       { text:'這對配對血統相性尚可。\n子代應能穩定繼承雙親之長。', sev:'' },
  };

  const RANK_LABELS = ['冠軍', '亞軍', '季軍'];
