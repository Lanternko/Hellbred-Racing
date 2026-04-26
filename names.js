// Horse naming system — 6 origin styles
// Separator: 中華/原民/日式 use ·, 美式/神話 use space, 機械龐克 use -
// surnameFirst: false → English convention (Given Surname)

const ORIGIN_DATA = {
  chinese: {
    label: '中華',
    sep: '·',
    // 姓氏：歷史名馬稱號，有辨識度但不易日常呼喚
    surnames: [
      '赤兔', '踏雪', '絕影', '的盧', '汗血', '烏騅',
      '玉花', '照夜', '追風', '紫電', '飛燕', '神駒',
    ],
    // 名字：單字或短詞，朗朗上口
    givenNames: [
      '黑', '金', '雷', '龍', '赤', '玄', '霸', '神', '鬼', '碧',
      '天行', '無極', '破陣', '烈風', '長嘯', '焚雲',
    ],
  },
  american: {
    label: '美式',
    sep: ' ',
    surnameFirst: false,
    // 姓氏：McQueen 風格，有家族感、念起來有點拗
    surnames: [
      'McQueen', "O'Brien", 'Sterling', 'Ashford', 'Blackwood',
      'Hawthorne', 'Cromwell', 'Beaumont', 'Vanderbilt', 'Windsor',
      'Fitzgerald', 'Pemberton',
    ],
    // 名字：短促有力，一聽就記住
    givenNames: [
      'Flash', 'Bolt', 'Thunder', 'Blaze', 'Glory',
      'Star', 'Fury', 'Legend', 'Ace', 'Duke',
      'Smoke', 'Gold', 'Spirit', 'Phantom',
    ],
  },
  indigenous: {
    label: '原民',
    sep: '·',
    // 姓氏：長音節族名，血統感強
    surnames: [
      '吉力吉撈', '撒可努', '達卡鬧', '伊斯坦大', '烏瓦斯',
      '馬耀', '巴奈', '阿洛',
    ],
    // 名字：自然意象，直覺好記
    givenNames: [
      '雷鳴', '山豬', '獵鷹', '彩虹', '勇士', '烈日', '海潮',
      '黑熊', '颶風', '山嵐', '星火', '雨靈',
    ],
  },
  myth: {
    label: '神話',
    sep: ' ',
    surnameFirst: false,
    // 姓氏：複合稱號，有份量但不易直接呼喚
    surnames: [
      'Thunderlord', 'Ironfather', 'Stormborn', 'Deathless',
      'Godkiller', 'Wraithbane', 'Soulreaper', 'Voidwalker',
      'Flamecrown', 'Ashbound',
    ],
    // 名字：神祇英雄名，辨識度高
    givenNames: [
      'Zeus', 'Ares', 'Apollo', 'Odin', 'Thor', 'Loki',
      'Titan', 'Achilles', 'Hector', 'Fenrir',
      'Valkyrie', 'Poseidon', 'Skadi', 'Baldur',
    ],
  },
  japanese: {
    label: '日式',
    sep: '·',
    // 姓氏：兩字漢字家名，唸起來有重量
    surnames: [
      '黑澤', '武藤', '雷堂', '風見', '櫻井', '鬼塚',
      '冰川', '炎城', '影山',
    ],
    // 名字：單字優先，帶視覺感
    givenNames: [
      '閃', '朱', '蔦', '嵐', '颯', '刃', '烈', '極',
      '疾風', '千代', '夜叉', '無雙', '黑炎',
    ],
  },
  mecha: {
    label: '機械龐克',
    sep: '-',
    // 姓氏：有地獄/工業感但還算能唸
    surnames: [
      '撒坦', '紅杉', '熔爐', '黑鐵', '殘骸', '終末',
      '核熔', '廢土', '鑄獄',
    ],
    // 名字：代號/短詞，一眼記住
    givenNames: [
      '零號', '暴走', '滅世', '廢核', '煉獄',
      'EX-00', 'MK-VII', '黑閘', '終焉', '鐵骸',
    ],
  },
};

const ORIGINS = Object.keys(ORIGIN_DATA);

function randomOrigin() {
  return ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
}

function buildDisplayName(origin, surname, givenName) {
  const data = ORIGIN_DATA[origin] ?? {};
  const sep = data.sep ?? '·';
  return data.surnameFirst === false
    ? `${givenName}${sep}${surname}`
    : `${surname}${sep}${givenName}`;
}

function generateHorseName(origin) {
  const data = ORIGIN_DATA[origin];
  const surname   = data.surnames[Math.floor(Math.random() * data.surnames.length)];
  const givenName = data.givenNames[Math.floor(Math.random() * data.givenNames.length)];
  return { surname, givenName, name: buildDisplayName(origin, surname, givenName) };
}

// Determine child's origin from the stronger parent (by OVR)
function childOrigin(father, mother, ovrFn) {
  if (ovrFn(father) >= ovrFn(mother)) return father.origin;
  return mother.origin;
}

// Surname from stronger parent; given name from weaker parent's origin pool
function generateChildName(father, mother, origin, ovrFn) {
  const fOvr = ovrFn(father), mOvr = ovrFn(mother);
  const stronger = fOvr >= mOvr ? father : mother;
  const weaker   = fOvr >= mOvr ? mother : father;
  const surname = stronger.surname;
  const weakerData = ORIGIN_DATA[weaker.origin] ?? ORIGIN_DATA[origin];
  const givenName = weakerData.givenNames[Math.floor(Math.random() * weakerData.givenNames.length)];
  return { surname, givenName, name: buildDisplayName(origin, surname, givenName) };
}
