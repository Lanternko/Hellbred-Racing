// Horse naming system — 6 origin styles
// Separator: 中華/原民/日式 use ·, 美式/神話 use space, 機械龐克 use -

const ORIGIN_DATA = {
  chinese: {
    label: '中華',
    sep: '·',
    surnames: [
      '赤兔', '踏雪', '絕影', '的盧', '汗血', '烏騅',
      '玉花', '照夜', '追風', '紫電', '飛燕', '神駒',
    ],
    givenNames: [
      '天行', '淵濤', '浩然', '凌霄', '無極', '乾坤',
      '玄德', '清雲', '烈風', '長嘯', '破陣', '歸塵',
      '問天', '孤鳴', '焚雲', '鑄魂',
      '黑', '赤', '玄', '碧', '金', '雷', '刃', '龍',
    ],
  },
  american: {
    label: '美式',
    sep: ' ',
    // 仿真實純血馬命名：外觀詞 + 特質名詞（Golden Horn、Black Caviar 風格）
    surnames: [
      'Golden', 'Black', 'Northern', 'Iron', 'Silver',
      'Scarlet', 'Phantom', 'Ivory', 'Thunder', 'Wild',
      'Dark', 'Royal', 'Bold', 'Lone',
    ],
    givenNames: [
      'Horn', 'Dancer', 'Flash', 'Spirit', 'Ruler',
      'Caviar', 'Storm', 'Fury', 'Legend', 'Bolt',
      'Glory', 'Star', 'Runner', 'Blaze', 'Biscuit',
      'Maverick', 'Outlaw', 'Phantom',
    ],
  },
  indigenous: {
    label: '原民',
    sep: '·',
    surnames: [
      '吉力吉撈', '撒可努', '巴奈', '阿洛', '達卡鬧',
      '伊斯坦大', '烏瓦斯', '馬耀',
    ],
    givenNames: [
      '雷鳴', '山豬', '獵鷹', '彩虹', '勇士', '烈日', '海潮',
      '黑熊', '颶風', '山嵐', '星火', '雨靈',
    ],
  },
  myth: {
    label: '神話',
    sep: ' ',
    surnames: [
      'Thunderlord', 'Ironfather', 'Stormborn', 'Deathless',
      'Godkiller', 'Wraithbane', 'Soulreaper', 'Voidwalker',
      'Flamecrown', 'Ashbound',
    ],
    givenNames: [
      'Zeus', 'Ares', 'Apollo', 'Hermes', 'Achilles', 'Hector',
      'Titan', 'Odin', 'Loki', 'Thor', 'Fenrir', 'Tyr',
      'Valkyrie', 'Skadi', 'Baldur', 'Poseidon',
    ],
  },
  japanese: {
    label: '日式',
    sep: '·',
    surnames: [
      '黑澤', '武藤', '雷堂', '風見', '櫻井', '鬼塚',
      '冰川', '炎城', '影山', '鋼鐵',
    ],
    givenNames: [
      '疾風', '千代', '鋼鐵', '雷光', '夜叉', '黑炎', '一刀', '無雙',
      '剛', '刃', '烈', '閃', '極', '朱', '蔦', '嵐', '颯',
    ],
  },
  mecha: {
    label: '機械龐克',
    sep: '-',
    surnames: [
      '撒坦', '紅杉', '齒輪', '鋼魂', '廢鐵', '熔爐',
      '核熔', '黑鐵', '殘骸', '終末',
    ],
    givenNames: [
      'MK-VII', '零號', '鏽帝', '煉獄', '殘響', '黑閘',
      '廢核', '終焉', 'EX-00', '滅世', '暴走', '鐵骸',
    ],
  },
};

const ORIGINS = Object.keys(ORIGIN_DATA);

function randomOrigin() {
  return ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
}

function buildDisplayName(origin, surname, givenName) {
  const sep = ORIGIN_DATA[origin]?.sep ?? '·';
  return `${surname}${sep}${givenName}`;
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

// Surname from stronger parent, fresh given name from child's origin
function generateChildName(father, mother, origin, ovrFn) {
  const stronger = ovrFn(father) >= ovrFn(mother) ? father : mother;
  const surname = stronger.surname;
  const data = ORIGIN_DATA[origin];
  const givenName = data.givenNames[Math.floor(Math.random() * data.givenNames.length)];
  return { surname, givenName, name: buildDisplayName(origin, surname, givenName) };
}
