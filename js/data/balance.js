'use strict';
// ════════════════════════════════════════════
// 밸런스 설정: 난이도 곡선 / 경제 / 드롭률
//  밸런스 패치는 대부분 이 파일과 data/*.js의 수치만 고치면 됨
// ════════════════════════════════════════════
const BALANCE = {
  // 스테이지 진행(0~23)에 따른 적 강화: 체력 ×(1 + hp×i), 공격력 ×(1 + dmg×i)
  //  taperFrom 이후(5월드~)는 증가폭 ×taper (5·6월드 적은 기본 능력치가 이미 높음)
  stageScale: { hp: 0.13, dmg: 0.045, taperFrom: 15, taper: 0.5 },
  // 전투방 웨이브당 적 수 = min(max, base + 월드 + 레벨×perLevel(내림) + 0~rand)
  waveSize: { base: 3, perLevel: 0.5, rand: 1, max: 8 },
  // 적 처치 보상
  killGoldMult: 0.5,          // def.rewardGold × 배율 (최소 1)
  killEnergyChance: 0.5, killEnergyValue: 5,
  killHpChance: 0.04, killHpValue: 15,
  // 방 클리어 보상
  roomEnergyOrbs: [4, 6], roomEnergyValue: 8,
  roomChestChance: 0.3,
  roomHpChance: 0.3, roomHpValue: 15,
  // 상점 (스테이지마다 가격 +inflate)
  shopInflate: 0.06,
  shopPrice: { common: 20, uncommon: 35, rare: 55, epic: 85, legendary: 130, hp: 15, energy: 12 },
  // 로비 무기고 해금 가격
  armoryPrice: { common: 80, uncommon: 160, rare: 320, epic: 600, legendary: 1100 },
  // 무기 드롭 가중치 (영웅은 월드마다 +epicPerWorld, 전설은 +legendaryPerWorld)
  rarityWeight: { common: 5, uncommon: 4, rare: 3, epic: 1.5, legendary: 0.1 }, epicPerWorld: 0.8, legendaryPerWorld: 0.06,
  // 상자·상점 무기 등급 확률(%) — 필드별 [고급, 희귀, 영웅, 전설]. 낮은 층에서는 높은 등급이 드묾 (마지막 줄은 그 뒤 모든 필드)
  rarityByWorld: [[84, 15, 1, 0], [76, 22, 2, 0], [68, 28, 3.8, 0.2], [60, 33, 6.6, 0.4], [54, 37, 8.4, 0.6], [48, 40, 11, 1], [43, 42, 13.5, 1.5], [38, 44, 16, 2], [34, 45, 18.5, 2.5], [30, 46, 21, 3]],
  // 로비 재화: 던전 골드와 별도. 런이 끝날 때 결과에 따라 지급 (캐릭터 해금·무기고에 사용)
  //  기존 골드 적립 속도와 비슷하게 맞춘 값 (조정 가능)
  // 직업 레벨 (결정석으로 영구 소량 강화, 직업마다 따로): 레벨당 능력치, 레벨업 비용 = base + perLevel × (현재 레벨)
  // [사용자 결정] 직업 레벨: 비용 상향 · 만렙(10) 보너스 = 스킬 데미지 +maxDmg(공통) + 직업별 고유 특수효과(perks)
  jobLevel: { max: 10, base: 85, perLevel: 55, hp: 3, atk: 0.015, energy: 3, maxDmg: 0.1,
    // [사용자 결정] 루트별 레벨업: 레벨·비용·Lv.10 고유효과가 진화 루트마다 따로 (키: heroId|lineId). 효과 없는 루트는 Lv.10에 스킬 데미지 +10%만
    perks: {
      // 검사
      'hero_swordsman|sword': { skillFx: 'swordrain', name: '검우 폭풍', desc: '검우의 검기 수·범위↑' },
      'hero_swordsman|great': { skillFx: 'quake', name: '대지 분쇄', desc: '대지 붕괴 범위↑·기절 시간↑' },
      'hero_swordsman|spear': { skillFx: 'skyspear', name: '천공 관통', desc: '천공의 창 사거리↑·폭발 범위↑' },
      // 사수
      'hero_gunner|base': { skillFx: 'overdrive3', name: '탄환 폭풍', desc: '과부하 지속·발사 속도↑' },
      'hero_gunner|sniper': { skillFx: 'huntmark', name: '사냥 본능', desc: '표적이 받는 피해↑·쿨↓' },
      'hero_gunner|demo': { skillFx: 'carpet', name: '융단 강화', desc: '융단 폭격 폭발 +2' },
      // 마도사
      'hero_mage|fire': { skillFx: 'explosion', toggle: true, name: '폭심 확장', desc: '익스플로전이 벽을 부수고 범위 살짝↑' },
      'hero_mage|ice': { skillFx: 'absolutezero', name: '절대 빙각', desc: '절대 영도 범위↑·빙결 취약↑' },
      'hero_mage|nature': { skillFx: 'worldtree', name: '세계수 번성', desc: '세계수 지속↑·중독↑' },
      'hero_mage|lightning': { skillFx: 'thundergod', name: '뇌신 강림', desc: '뇌신 범위↑·틱 피해↑' },
      'hero_mage|light': { skillFx: 'lightsat', name: '성광 군단', desc: '성광 위성 +1' },
      'hero_mage|dark': { skillFx: 'voidcollapse', name: '심연 확장', desc: '공허붕괴 끌어당김·범위↑' },
      // 기술자
      'hero_engineer|base': { skillFx: 'barrage', name: '포격 확장', desc: '포탑 포격 범위↑·발수↑' },
      'hero_engineer|drone': { skillFx: 'droneswarm', name: '군단 증편', desc: '드론 군단 +1기' },
      'hero_engineer|shield': { skillFx: 'fortress', toggle: true, name: '반사 방벽', desc: '불락의 요새 지속↑·받은 피해 반사' },
      'hero_engineer|trap': { killHeal: 2, name: '망자의 수확', desc: '처치 시 체력 +2 회복' },
      // 암살자
      'hero_assassin|shadow': { skillFx: 'execution', name: '그림자 처형', desc: '처형 피해↑·처치 시 쿨↓' },
      'hero_assassin|venom': { skillFx: 'plaguecloud', name: '맹독 창궐', desc: '맹독 안개 범위↑·중독↑' },
      'hero_assassin|blade': { skillFx: 'bladestorm', name: '칼날 폭풍', desc: '칼날 폭풍 칼날 +4' },
      // 사제
      'hero_priest|base': { skillFx: 'descent', name: '천상 강림', desc: '강림 범위↑·회복↑' },
      'hero_priest|smite': { skillFx: 'heavensgate', name: '천벌 확장', desc: '천상의 문 범위↑·실명↑' },
      'hero_priest|bless': { skillFx: 'miracle', name: '기적 지속', desc: '기적 지속↑·회복↑' },
      // 광전사
      'hero_berserker|base': { skillFx: 'bloodstorm', name: '피의 광풍', desc: '피의 폭풍 지속↑·흡혈↑' },
      'hero_berserker|warcry': { skillFx: 'earthshatter', name: '대지 포효', desc: '대지의 포효 범위↑·기절↑' },
      'hero_berserker|blood': { skillFx: 'bloodmoon', name: '핏빛 보름', desc: '피의 달 지속↑·흡혈↑' },
      'hero_berserker|feast': { skillFx: 'feast3', name: '만혼 포식', desc: '만혼 강림 포식 획득↑·범위↑' },
      // 드루이드
      'hero_druid|base': { skillFx: 'guardian', name: '정령 가호', desc: '수호 정령 지속↑·추가 소환' },
      'hero_druid|thorn': { skillFx: 'ancientroot', name: '고대 결박', desc: '고대 뿌리 범위↑·속박↑' },
      'hero_druid|shape': { skillFx: 'primal', name: '태초 각성', desc: '변신 지속↑·공격력↑·변신 시작 시 범위 폭발' }
    } },
  lobbyCurrency: { name: '결정석', color: '#7ad0ff', perStage: 15, perBoss: 40, victory: 80, goldPer: 25 }, // goldPer: 탐험이 끝날 때 남은 골드 25마다 결정석 1
  bossHealRatio: 0.5,         // 월드 보스 처치 시 최대 체력 대비 회복
  // 정예 몬스터: 2월드부터 등장, 확률 = base + perWorld × (월드-1)
  elite: { fromWorld: 1, base: 0.08, perWorld: 0.03, hp: 2.2, dmg: 1.2, gold: 3 },
  // 특수방: 일반 스테이지마다 하나씩 무작위 (가격은 상점처럼 스테이지마다 오름)
  specialRooms: { chance: 0.5, weight: {},
    // 전직의 방: 진화 단계별로 나오기 시작하는 필드(0부터)와 다른 특수방 대비 가중치 (다른 특수방은 각각 1)
    evolveByRank: [{ fromWorld: 0, weight: 2 }, { fromWorld: 3, weight: 1 }], // [사용자 결정] 1차 진화 전직의 방 가중치 2 · 3진(2차 진화)은 4필드부터 가중치 1 (예전: 8.3 · 2.3 → 1 · 1)
    pool: ['fountain', 'altar', 'gamble', 'challenge', 'forge', 'blood', 'rack', 'smithy', 'evolve'], fountainHeal: 0.4, altarPrice: 60, gamblePrice: 25,
    forgePrice: 35, forgeUpChance: 0.5, bloodCost: 0.2, // [사용자 결정] 제련 손해 완화 (예전: 50골드 · 30%)
    // 행운의 기계 확률표 (합 1). 골드 기대값 = 판돈의 0.8배 + 물약·에너지·무기 (예전엔 '두 배'가 실제로는 판돈의 40%만 돌려줘서 골드 기대값 0.1배)
    gambleTable: { lose: 0.2, refund: 0.15, double: 0.25, triple: 0.05, hp: 0.15, energy: 0.12, weapon: 0.08 },
    challenge: { waves: 3, extra: 2, hp: 1.3, dmg: 1.15 } }, // 도전방: 웨이브 수, 웨이브당 추가 몬스터, 정예 위에 더 곱하는 체력·공격력
  // 무기 강화 (그 판 동안만): 상한 없이 강화 가능, 단계가 높아질수록 피해 증가 효율은 점감
  //  비용 = base × (다음 단계) × 등급 배율 × 스테이지 물가, 성공률은 다음 단계 기준 (실패해도 단계 유지)
  trialSkillRarity: { common: 0, uncommon: 0.03, rare: 0.06, epic: 0.1, legendary: 0.15 }, // 시련에서 스킬 피해에 더하는 무기 등급 몫 (+ 강화 단계당 perLevel의 1/4)
  // [사용자 결정] 기술자 함정 계열 · 덫 장비 — 수치는 모두 [제안] 초기값 (여기서만 고치면 됨)
  TRAP: {
    sentryMax: 3,           // 망자의 파수기(스킬) 동시 설치 수 — 덫 장비와 따로 셈 (넘으면 가장 오래된 것이 사라짐) [사용자 결정]
    sentryCharges: 3,       // 망자의 파수기 충전 칸: 설치할 때마다 1칸 소비, 설치 재사용 대기시간은 없음 [사용자 결정]
    sentryRecharge: 4,      // 충전 칸 하나가 다시 차는 시간(초) — 스킬 쿨타임 감소(집중 등)도 같은 비율로 적용
    healCap: 0.05,          // 함정 계열 회복(화염 투척·전류 격자 60% 흡혈 · 파수기 흡혈 · 시체 폭발) 모두 합쳐 1초에 최대 체력의 이만큼까지
    equipBossMult: 0.23,  /* [사용자 결정] 소폭 너프 0.25 → 0.23 */    // 덫 장비(무기) 피해가 보스에게 들어갈 때 배율 — 종류마다 5개까지 깔 수 있어서 스킬보다 낮음
    bossMult: 0.41,  /* [사용자 결정] 소폭 너프 0.45 → 0.41 */          // [보스전 최강 방지] 함정 계열·덫 장비 피해가 보스에게 들어갈 때 배율
    scan: 0.25,             // 설치물이 적을 다시 찾는 간격(초) — 매 프레임 탐색하지 않음
    burn: { duration: 3, dpsRatio: 0.25 },                                        // 화상: 초당 (직접 피해 × dpsRatio), duration초 → 총 추가 피해 = 직접 피해의 75%
    shock: { keep: 2.5, need: 3, stun: 0.75, immune: 3, bossNeed: 5, bossStun: 0.25, bossImmune: 5 }, // 감전 누적 → 마비 (보스는 짧은 경직)
    prey: { dur: 3, bonus: 0.2 },                                                // 사냥터 각인: 덫 장비·망자의 파수기에게 받는 피해 +bonus
    firetoss: { dmg: 55, radius: 40, /* [사용자 결정] 소폭 너프 60 → 55 */ kb: 14, range: 210, speed: 320, lifesteal: 0.6 },            // 화염 투척 (기본) — 준 피해의 lifesteal 회복 [사용자 결정]
    grid: { r: 46, life: 4, stun: 1, range: 200, dot: 55, tick: 1, lifesteal: 0.6 }, /* [사용자 결정] 소폭 너프 dot 60 → 55 */ // 전류 격자 (1차) = 쇼크 웹: 가시·전류선·그물 안에 닿아 있는 동안 tick초마다 dot 전격 피해(스킬 피해 배율·공격력 적용), 처음 닿을 때 stun초 기절, 준 피해의 lifesteal 회복 [사용자 결정]
    death: { life: 15, range: 150, every: 0.6, dmg: 20, /* [밸런스 조정] 파수기 직선 번개 피해 24 → 20 */ corpseRange: 120, corpseR: 46, corpseEvery: 1.2, corpseHp: 0.65, /* [밸런스 조정] 시체 폭발 피해 80% → 65%, 범위 52 → 46 */ corpseHeal: 0.1, lifesteal: 0.05, bossCorpse: 60, corpseCap: 700, corpseHealCap: 0.04 }, /* 시체 폭발: 일반 몬스터 skillDmg(corpseCap)·보스 skillDmg(bossCorpse)까지, 시체 1개 회복은 최대 체력 corpseHealCap까지 */ // 망자의 파수기 (2차) — 번개 = dmg(스킬 피해 배율·공격력 적용), 시체 폭발 피해 = 죽은 적 최대 체력 × corpseHp, 폭발 때 죽은 적 최대 체력 × corpseHeal 회복, 파수기가 준 피해 × lifesteal 회복 [사용자 결정]
    corpseLife: 6           // 시체가 남아 있는 시간(초)
  },
  upgrade: { awakenLevel: 10, perLevel: 0.14, power: 0.85, base: 27, /* 강화 피해 배율: 1 + 0.14 × 강화 단계^0.85 · +10 약 ×1.99, 이후 증가 효율 점감 · 상한 없음 */ chance: [1, 0.9, 0.75, 0.6, 0.45, 0.38, 0.32, 0.26, 0.2, 0.15],
    rarityMult: { common: 1, uncommon: 1.2, rare: 1.5, epic: 1.8, legendary: 2.2, unique: 2.2 }, forgeRoomDiscount: 0.7, forgeRoomBonus: 0.1 },
  // 보스 강화 배율 (전직의 방 상위자는 제외): 체력·공격력·공격 간격
  //  boss = 1~10필드 보스, bossDeep = 심층 보스 (보구를 가진 상태를 기준으로 더 강함)
  boss: { hp: 1.7, dmg: 1.25, cooldown: 0.85 },
  overdriveGap: 3,        // [버그 수정] 사수 과부하 계열 스킬: 효과가 끝난 뒤 최소 이만큼(초, 실제 시간) 지나야 다시 쓸 수 있음 — 쿨타임 감소·솔로몬의 반지로 효과가 끊기지 않던 문제
  mobDeep: { dmg: 1.3 },  // [사용자 결정] 심층 일반 몬스터(보스 아님) 공격력 배율 — 스테이지 곡선 위에 더 곱함
  deepBossTreasureMult: 0.5, // [사용자 결정] 심층 보스가 공격형 보구(게이트 오브 바빌론·엑스칼리버·롱고미니아드·게이볼그, 게이볼그 출혈 포함)에게 받는 피해 배율
  // 스킬 피해가 스테이지(깊이)를 따라 자라는 비율 (1 = 몬스터 체력 성장과 같음) · 직업 갈래별 예외 · 직업별 스킬 피해 배율 [제안 수치]
  // [사용자 요청] 직업 밸런스 (검사 기준 측정, tools/jobs.js): 검사 대비 115% 넘던 갈래만 살짝 너프 — 갈래별 [기본, 1차, 2차] 피해 배율 (무기·스킬 모두)
  lineDmg: {
    'hero_druid|shape': [0.83, 1.0, 0.86],
    'hero_mage|dark': [0.85, 0.92, 0.88],
    'hero_priest|smite': [0.88, 0.92, 1.0],
    'hero_berserker|blood': [0.88, 0.95, 0.82],
    'hero_druid|thorn': [0.88, 0.96, 0.91],
    'hero_mage|ice': [0.88, 1.0, 0.91],
    'hero_mage|light': [0.89, 0.94, 0.84],
    'hero_engineer|trap': [0.89, 0.93, 0.85],
    'hero_engineer|base': [0.89, 0.92, 1.0],
    'hero_mage|nature': [0.9, 0.91, 0.81],
    'hero_engineer|drone': [0.9, 0.85, 0.89],
    'hero_druid|base': [0.91, 0.87, 0.87],
    'hero_mage|fire': [0.91, 0.96, 0.85],
    'hero_gunner|demo': [0.92, 0.94, 0.9],
    'hero_swordsman|spear': [0.92, 1.0, 0.96],
    'hero_mage|lightning': [0.93, 0.96, 0.8],
    'hero_swordsman|great': [0.93, 0.95, 0.86],
    'hero_gunner|sniper': [0.94, 0.94, 0.89],
    'hero_priest|bless': [0.95, 0.95, 0.82],
    'hero_berserker|base': [0.95, 0.96, 0.84],
    'hero_assassin|shadow': [0.96, 0.9, 0.91],
    'hero_priest|base': [0.96, 0.92, 0.92],
    'hero_assassin|venom': [0.97, 0.93, 0.78],
    'hero_berserker|warcry': [1.0, 0.96, 0.86],
    'hero_engineer|shield': [1.0, 0.93, 0.93],
    'hero_gunner|base': [1.0, 0.96, 0.87],
    'hero_berserker|feast': [1.0, 0.96, 0.88],
    'hero_assassin|blade': [1.0, 0.91, 0.8]
  },
  // 스킬 피해 성장: start×기본 + (몬스터 체력 배율-1)×base — [사용자 요청] 저층은 약하게(start 0.88), 고층으로 갈수록 조금 더 강하게(base 0.5 → 0.58)
  skillScale: { start: 0.88, base: 0.58, from: 3, lines: { 'hero_engineer|trap': 0.66, 'hero_engineer|drone': 0.72 }, hero: { hero_druid: 1.1 } },
  // [사용자 결정] 드루이드 '포식' 갈래 [제안 수치]: 중첩 하나당 일반 몬스터 피해 +perStack (cap까지) · 이동 속도 +speedPer (speedCap까지) · 보스에게는 피해 ×bossMult · healAt 이상이면 처치마다 체력 회복
  // [사용자 결정] 소울 이터: 포식 스택 — 일반 몬스터 피해는 상한 없이 조금씩(10당 +0.4%), 이동속도·피해감소는 게임이 깨지지 않게 상한을 둠 · 보스에게는 약함 · 750·2000에서 진화
  //  dmgPer10: 10스택당 일반 몬스터 피해 배율 증가(상한 없음) · speed/guard: 10스택당 증가(상한 cap) · evolve: 스택 진화 문턱
  feast: { perKill: 1, perSkillKill: 3, dmgPer10: 0.00376, speedPer10: 0.0008, speedCap: 0.22, guardPer10: 0.0012, guardCap: 0.3, bossMult: 0.7, startPenalty: 0.32, penaltyRemoveAt: 500, healAt: 500, heal: 2, evolve: [750, 2000], bannerEvery: 250 },
  awakenBonus: 1.1, // [사용자 결정] 기본 무기 +10 각성 시 피해 ×1.1 (소폭 추가 강화)
  babylonMob: { hp: 1.3, dmg: 1.3 }, // [사용자 결정] 바빌로니아 귀환길 잡몹 체력·공격력 +30%
  babylonBoss: { hp: 1.35, dmg: 1.15, cooldown: 0.88 }, // [사용자 결정] 바빌로니아 귀환길 보스(층 보스 9 + 지구라트 4-4 길가메시) 체력 ×1.35 · 공격력 ×1.15 · 공격 간격 ×0.88 [제안 수치]
  bossDeep: { hp: 2.35, dmg: 1.46, cooldown: 0.725 }, // [사용자 결정] 심층 보스 버프 2번 (처음: 체력 2.0 · 공격력 1.38 · 공격 간격 0.76 → 2.3 · 1.45 · 0.73 → 지금)
  // 로비에서 바로 심층으로 들어갈 때 시작 장비 [제안]: 최종 진화 · 전설/영웅 무기(+강화) · 체력 · 축복 (10필드를 깬 상태를 흉내)
  deepStart: { hp: 135, rarity: ['legendary', 'epic'], lv: 2, buffs: 4, gold: 300 },
  // 에너지가 모자랄 때 나가는 아주 약한 공격 (피해는 깊이에 따라 조금씩 커짐)
  weakAttack: { damage: 5, interval: 0.4 }
};

// [사용자 결정] 태고룡(거대 보스)전 근접 직업 이득: 주는 피해 ×dmg, 머리에서 range 안이면 받는 피해 ×guard
const COLOSSAL_MELEE = { heroes: ['hero_swordsman', 'hero_assassin', 'hero_berserker'], dmg: 1.5, guard: 0.65, range: 110 };
