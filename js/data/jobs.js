'use strict';
// ════════════════════════════════════════════
// 데이터: 직업 계열 · 2단 진화 (그 판 동안만)
//  · 갈래가 여럿인 직업(검사·마도사)은 판을 시작할 때 하나를 고름
//  · 특수방 '전직의 방'의 상위자와 대결해 이기거나 골드를 내면 다음 단계로 진화 → 스킬이 바뀌고 능력치가 오름
//  · ranks: [기본, 1차 진화, 2차 진화] 이름 / skills: 단계별 스킬
//  스킬 수치(dmg 등)는 기본값이고, 실제 피해는 스테이지 깊이에 따라 조금씩 커짐 (game.skillDmg)
// ════════════════════════════════════════════
const EVOLUTION = {
  price: [180, 320],        // 1차·2차 진화 골드 (상점처럼 스테이지마다 오름)
  hp: [20, 30], energy: [40, 60], // 진화할 때 오르는 최대 체력·에너지
  masterHp: [480, 760]      // 상위자 체력 (스테이지 강화 적용 전)
};

const JOB_LINES = {
  hero_swordsman: {
    title: '검술 선택',
    sword: { name: '검사', desc: '장검 · 균형 잡힌 근접 전투', startWeapon: 'weapon_sword_001', ranks: ['검사', '검성', '검신'], color: '#d8e0e8',
      skills: [
        { id: 'whirlwind', name: '회오리 베기', desc: '주변을 베고 적 탄환을 지움 (도는 동안 무적)', cd: 6 },
        { id: 'whirlwind2', name: '검풍', desc: '회오리 베기 + 사방으로 검기 8줄', cd: 6 },
        { id: 'swordrain', name: '천검난무', desc: '조준 지점 넓은 범위에 빛의 검이 쏟아짐', cd: 9 }] },
    great: { name: '대검사', desc: '대검 · 느리지만 한 방이 강함 (이동 속도 -10)', startWeapon: 'weapon_greatsword_001', moveSpeed: -10, ranks: ['대검사', '파쇄자', '대지의 군주'], color: '#c8a070',
      skills: [
        { id: 'cleave', name: '대지 가르기', desc: '전방 일직선으로 땅을 가르는 충격파', cd: 7 },
        { id: 'cleave3', name: '삼연 가르기', desc: '부채꼴로 충격파 세 줄', cd: 7 },
        { id: 'quake', name: '대지 붕괴', desc: '0.6초간 힘을 모아(이동 불가) 주변 전체를 강하게 내려침', cd: 10 }] },
    spear: { name: '창술사', desc: '나무 창 · 길게 찌르고 돌진하는 근접 전투', startWeapon: 'weapon_woodspear_001', ranks: ['창술사', '창의 달인', '천공의 창'], color: '#c8d8f0',
      skills: [
        { id: 'charge', name: '돌진 찌르기', desc: '조준 방향으로 돌진하며 지나간 적을 꿰뚫음 (잠깐 무적)', cd: 5 },
        { id: 'triplethrust', name: '연환창', desc: '전방으로 길게 세 번 찔러 일직선의 적을 꿰뚫음', cd: 6 },
        { id: 'skyspear', name: '천공 투창', desc: '거대한 창을 던져 일직선의 적을 모두 꿰뚫고, 떨어진 자리에서 폭발', cd: 11 }] }
  },
  hero_mage: {
    title: '속성 선택',
    fire: { name: '불', desc: '화염 지팡이 · 태워서 지속 피해', startWeapon: 'weapon_firestaff_001', ranks: ['불의 마도사', '화염술사', '폭염의 대마도사'], color: '#ff7a3a', look: { body: '#b8402a', accent: '#ffb040' },
      skills: [
        { id: 'fireball', name: '파이어볼', desc: '폭발하는 큰 불덩이를 발사 (화상)', cd: 4 },
        { id: 'flamestorm', name: '화염 회오리', desc: '5초간 자기 주위에 불길이 휘몰아쳐 지속 피해', cd: 9 },
        { id: 'explosion', name: '익스플로전', desc: '범위를 정하고 2초간 시전(이동 불가) → 범위에 엄청난 피해', cd: 10 }] },
    ice: { name: '얼음', desc: '서리 지팡이 · 얼려서 묶음', startWeapon: 'weapon_frost_001', ranks: ['얼음의 마도사', '빙결술사', '혹한의 대마도사'], color: '#9ad8ff', look: { body: '#3a78c0', accent: '#bfefff' },
      skills: [
        { id: 'icelance', name: '얼음 창', desc: '적을 꿰뚫는 얼음 창 3개 (빙결)', cd: 4 },
        { id: 'frost_nova', name: '서리 폭발', desc: '주변 적 피해 + 강한 빙결, 탄환 제거', cd: 6 },
        { id: 'absolutezero', name: '절대 영도', desc: '내 주변 넓은 범위를 얼려 적을 3초간 완전히 멈춤(보스 1.5초), 얼어 있는 적은 받는 피해 +50% — 3초 뒤 얼음이 깨지며 한 번 더 피해', cd: 12 }] }, /* [사용자 결정] 블리자드 → 절대 영도 */
    nature: { name: '자연', desc: '독안개 지팡이 · 묶고 중독', startWeapon: 'weapon_poisonstaff_001', ranks: ['자연의 마도사', '숲의 술사', '태고의 대마도사'], color: '#7adf4a', look: { body: '#3a8a3a', accent: '#c8e070' },
      skills: [
        { id: 'thorns', name: '가시 덩굴', desc: '주변 적을 덩굴로 묶고 중독', cd: 7 },
        { id: 'bog', name: '독 늪', desc: '조준 지점에 6초간 독 늪 (중독 + 지속 피해)', cd: 9 },
        { id: 'worldtree', name: '세계수의 분노', desc: '0.8초 시전(이동 불가) → 넓은 범위를 오래 묶고 큰 피해 + 아주 강한 중독, 체력 회복', cd: 13 }] },
    lightning: { name: '번개', desc: '테슬라 코일 · 연쇄 번개', startWeapon: 'weapon_tesla_001', ranks: ['번개의 마도사', '뇌전술사', '뇌신의 대마도사'], color: '#bfe8ff', look: { body: '#3a4ab8', accent: '#ffe24a' },
      skills: [
        { id: 'shockorb', name: '전격구', desc: '튕겨 다니며 연쇄 번개를 일으키는 구체 (전격)', cd: 4 },
        { id: 'thunder', name: '낙뢰', desc: '가까운 적 6명에게 번개가 떨어짐 (전격)', cd: 6 },
        { id: 'thundergod', name: '뇌신강림', desc: '6초간 주변 적에게 번개가 계속 떨어짐 (전격)', cd: 12 }] },
    light: { name: '빛', desc: '견습 마법봉 · 회복과 정화', startWeapon: 'weapon_wand_001', ranks: ['빛의 마도사', '정화술사', '성광의 대마도사'], color: '#fff4c0', look: { body: '#e8e0c8', accent: '#e0b030' },
      skills: [
        { id: 'lightarrow', name: '빛의 화살', desc: '적을 따라가 꿰뚫는 빛의 화살 5개 (실명)', cd: 4 },
        { id: 'radiance', name: '광휘', desc: '체력 회복 + 주변 적 피해(실명), 탄환 제거', cd: 6 },
        { id: 'lightsat', name: '성광 위성', desc: '8초간 빛의 구체 3개가 내 주위를 돌며 가까운 적에게 자동으로 광선(보스 외 실명), 그동안 체력이 조금씩 회복', cd: 13 }] }, /* [사용자 결정] 심판의 빛 → 성광 위성 */
    dark: { name: '어둠', desc: '저주 지팡이 · 약점과 흡인', startWeapon: 'weapon_cursestaff_001', ranks: ['어둠의 마도사', '저주술사', '공허의 대마도사'], color: '#a070e0', look: { body: '#2e2242', accent: '#b070ff' },
      skills: [
        { id: 'curseshot', name: '저주탄', desc: '맞은 적이 오래 약해지는(받는 피해 +40%) 저주 구체 (저주)', cd: 4 },
        { id: 'abyss', name: '심연 소용돌이', desc: '조준 지점에 적을 빨아들이는 어둠 (저주)', cd: 8 },
        { id: 'voidcollapse', name: '블랙홀', desc: '1초 시전(이동 불가)하며 블랙홀로 주변 적을 모두 빨아들인 뒤 터뜨려 엄청난 피해', cd: 13 }] }
  },
  hero_gunner: { title: '사격 방식 선택',
    base: { name: '속사', desc: '빠른 연사 · 공격 속도 강화', ranks: ['사수', '건마스터', '폭풍의 총잡이'], color: '#ffd84a',
    skills: [
      { id: 'overdrive', name: '과부하 사격', desc: '5초간 공격 속도 2배, 에너지 무소모', cd: 15 },
      { id: 'overdrive2', name: '탄막 폭주', desc: '7초간 공격 속도 2배·공격력 +40%, 에너지 무소모', cd: 15 },
      { id: 'overdrive3', name: '탄환의 폭풍', desc: '6초간 공격 속도 2.5배·공격력 +15%·총알이 2발씩 나감, 에너지 무소모', cd: 15 }] },
    sniper: { name: '저격', desc: '부싯돌 권총 · 느리지만 멀리, 강하게 관통', startWeapon: 'weapon_flintlock_001', ranks: ['저격수', '명사수', '일격필살'], color: '#ffe9a0',
      skills: [
        { id: 'snipe', name: '관통 저격', desc: '조준 방향으로 모든 적을 꿰뚫는 강한 탄 한 발', cd: 5 },
        { id: 'snipe2', name: '철갑 연사', desc: '꿰뚫는 강한 탄 세 발을 부채꼴로', cd: 6 },
        { id: 'huntmark', name: '사냥꾼의 표적', desc: '가장 강한 적(보스 우선)에게 꿰뚫는 강한 탄 3발을 쏘고 8초간 표적 — 받는 피해 +80%, 내 탄이 그쪽으로 살짝 휘어 들어감, 표적이 쓰러지면 쿨타임 절반 회복 + 남은 시간만큼 가까운 다음 적에게 표적이 옮겨 감', cd: 12 }] }, /* [사용자 결정] 일격필살 → 사냥꾼의 표적 */
    demo: { name: '폭파', desc: '터지는 것으로 넓게 정리', ranks: ['폭파병', '폭탄 전문가', '파괴 공작원'], color: '#ff9a4a',
      skills: [
        { id: 'grenade', name: '수류탄', desc: '조준 지점에 던져 폭발 (화상)', cd: 5 },
        { id: 'cluster', name: '집속 수류탄', desc: '큰 폭발 뒤 주변에 작은 폭발 6개', cd: 6 },
        { id: 'carpet', name: '융단 폭격', desc: '조준 방향 일직선으로 폭발 11개가 차례로 (화상)', cd: 8 }] } },
  hero_engineer: { title: '공학 분야 선택',
    base: { name: '포탑', desc: '자리에 포탑을 세워 화력 지원', ranks: ['기술자', '기계공학자', '전쟁 설계자'], color: '#f0c030',
    skills: [
      { id: 'turret', name: '자동 포탑', desc: '12초간 적을 쏘는 포탑 설치', cd: 13 },
      { id: 'turret2', name: '포대 전개', desc: '15초간 강한 포탑 2개 설치', cd: 13 },
      { id: 'barrage', name: '궤도 폭격', desc: '1초 신호(이동 불가) → 조준 지점에 포격 14발', cd: 13 }] },
    drone: { name: '드론', desc: '나를 따라다니며 쏘는 드론', ranks: ['드론 기사', '드론 지휘관', '군단 설계자'], color: '#7ad0ff',
      skills: [
        { id: 'drones', name: '호위 드론', desc: '12초간 따라다니며 쏘는 드론 2기', cd: 13 },
        { id: 'drones2', name: '드론 편대', desc: '14초간 강한 드론 3기', cd: 13 },
        { id: 'droneswarm', name: '드론 군단', desc: '14초간 드론 4기 + 소환할 때 주변에 충격파', cd: 15 }] },
    shield: { name: '방벽', desc: '방어막으로 탄을 막고 버팀', ranks: ['방벽 공병', '요새 기술자', '불락의 설계자'], color: '#9ac0e0',
      skills: [
        { id: 'barrier', name: '방어막 발생기', desc: '8초간 주위에 방어막 (들어오는 적 탄 소멸, 안의 적 약한 피해)', cd: 12 },
        { id: 'barrier2', name: '충격 방어막', desc: '9초간 넓은 방어막, 안의 적에게 전격 피해', cd: 12 },
        { id: 'fortress', name: '요새화', desc: '10초간 큰 방어막 + 포탑 2개 + 받는 피해 -25%', cd: 16 }] },
    // [사용자 결정] 기술자 네 번째 계열 '함정': 마우스 위치에 덫과 파수기를 깔아 전장을 장악. 패시브 '사냥터 각인' — 스킬에 맞은 적은 3초간 덫 장비·망자의 파수기에게 받는 피해 +20%
    trap: { name: '함정', desc: '마우스 위치에 덫과 파수기를 깔아 전장을 장악 · 패시브 사냥터 각인', ranks: ['함정공', '덫 설계자', '망자의 파수꾼'], color: '#ff9a4a',
      skills: [
        { id: 'trapfire', name: '화염 투척', desc: '조준 지점으로 화염 덩어리를 던져 폭발 (화상 · 밀쳐 냄 · 사냥터 각인) · 준 피해 60% 흡혈', cd: 4 },
        { id: 'trapgrid', name: '전류 격자', desc: '조준 지점에 4초간 전기 가시 그물 — 닿은 적은 1초 기절 + 닿아 있는 동안 1초마다 전격 피해 · 준 피해 60% 흡혈 · 사냥터 각인', cd: 8 },
        { id: 'deathsentry', name: '망자의 파수기', desc: '조준 지점에 15초간 파수기 (충전 3칸 · 최대 3개) — 일직선 관통 번개(감전), 시체가 있으면 대신 터뜨려 죽은 적 체력 65% 범위 피해 · 준 피해 5% 흡혈 (함정 회복은 모두 합쳐 1초에 최대 체력 5%까지)', cd: 14 }] } },
  hero_assassin: { title: '암살 방식 선택',
    shadow: { name: '그림자', desc: '순간이동 연속 습격 · 마지막엔 분신과 처형', ranks: ['암살자', '그림자 군주', '그림자 그 자체'], color: '#b080ff',
    skills: [
      { id: 'blink', name: '그림자 습격', desc: '조준 방향으로 순간이동하며 지나간 적을 벰 (잠깐 무적)', cd: 5 },
      { id: 'blink2', name: '그림자 연무', desc: '습격을 연달아 3번 (피해 증가)', cd: 5 },
      { id: 'execution', name: '그림자 처형', desc: '그림자 분신 둘과 함께 셋이서 주변 적을 연달아 습격 (무적), 체력 25% 이하(보스 10%)인 적은 즉시 처형', cd: 11 }] },
    venom: { name: '독', desc: '독 단검을 흩뿌리고 독안개로 둘러쌈', ranks: ['암살자', '독칼잡이', '맹독의 군주'], color: '#7adf4a',
    skills: [
      { id: 'blink', name: '그림자 습격', desc: '조준 방향으로 순간이동하며 지나간 적을 벰 (잠깐 무적)', cd: 5 },
      { id: 'venomfan', name: '독 단검 부채', desc: '부채꼴로 독 단검 7개를 던짐 (관통 1, 강한 중독)', cd: 4 },
      { id: 'plaguecloud', name: '맹독 안개', desc: '7초간 자기 주위에 넓은 독안개 (지속 피해 + 중독, 안의 적은 받는 피해 +20%), 안에서 이동 속도 +20%', cd: 11 }] },
    blade: { name: '칼날', desc: '몸 주위를 도는 칼날로 싸우는 근접형', ranks: ['암살자', '칼춤꾼', '천 개의 칼날'], color: '#d8e0e8',
    skills: [
      { id: 'blink', name: '그림자 습격', desc: '조준 방향으로 순간이동하며 지나간 적을 벰 (잠깐 무적)', cd: 5 },
      { id: 'bladeorbit', name: '회전 칼날', desc: '8초간 칼날 4개가 몸 주위를 돌며 닿는 적을 벰', cd: 8 },
      { id: 'bladestorm', name: '칼날 폭풍', desc: '칼날 16개를 사방으로 펼쳤다가 잠시 뒤 다시 나에게 모음 — 나갈 때·돌아올 때 닿은 적에게 각각 큰 피해, 펼치는 순간 잠깐 무적', cd: 10 }] } },
  hero_priest: { title: '신앙의 길 선택',
    base: { name: '성역', desc: '빛의 원으로 회복하고 탄을 막음', ranks: ['사제', '대사제', '성자'], color: '#ffe9a0',
    skills: [
      { id: 'sanctuary', name: '성역', desc: '6초간 빛의 원: 안에 있으면 회복, 원 안의 적 지속 피해, 들어오는 적 탄 소멸', cd: 13 },
      { id: 'sanctuary2', name: '대성역', desc: '더 넓고 오래, 회복·피해 2배, 안에 있으면 공격력 +35%', cd: 13 },
      { id: 'descent', name: '신성 강림', desc: '0.4초 기도(이동 불가) → 2초 무적, 체력 40% 회복, 주변 아주 큰 피해', cd: 15 }] },
    smite: { name: '심판', desc: '빛으로 직접 내리치는 공격형', ranks: ['심판관', '대심판관', '빛의 집행자'], color: '#fff4c0',
      skills: [
        { id: 'holybolt', name: '빛의 창', desc: '꿰뚫는 빛의 창 3개 (실명)', cd: 5 },
        { id: 'holyrain', name: '빛의 비', desc: '조준 지점에 빛줄기 12개가 쏟아짐', cd: 8 },
        { id: 'heavensgate', name: '천상의 문', desc: '0.7초 기도(이동 불가) → 넓은 빛기둥, 아주 큰 피해 + 체력 회복', cd: 12 }] },
    bless: { name: '축복', desc: '나를 강하게 만드는 축복술', ranks: ['축복술사', '대축복술사', '기적의 사도'], color: '#ffd8a0',
      skills: [
        { id: 'bless', name: '축복', desc: '8초간 공격력 +40%·이동 속도 +15%, 체력 15 회복', cd: 12 },
        { id: 'bless2', name: '큰 축복', desc: '10초간 공격력 +55%·이동 속도 +20%·받는 피해 -25%, 체력 25 회복', cd: 13 },
        { id: 'miracle', name: '기적', desc: '체력 50% 회복 + 3초 무적 + 주변에 빛의 파동 + 10초간 아주 큰 축복', cd: 18 }] } },
  hero_berserker: { title: '전투 방식 선택',
    base: { name: '분노', desc: '분노로 공격력과 속도를 끌어올림', ranks: ['광전사', '전쟁광', '피의 군주'], color: '#ff5a3a',
    skills: [
      { id: 'rage', name: '분노', desc: '5초간 공격력 +70%, 이동 속도 +20%', cd: 12 },
      { id: 'rage2', name: '광란', desc: '8초간 공격력 +100%·이동 속도 +20%, 처치할 때마다 체력 +5', cd: 10 },
      { id: 'bloodstorm', name: '피의 폭풍', desc: '6초간 광란 + 자기 주위에 피의 소용돌이 (지속 피해·흡혈)', cd: 16 }] },
    warcry: { name: '함성', desc: '고함으로 적을 얼어붙게 만듦', ranks: ['함성꾼', '전쟁 군주', '대지의 포효'], color: '#e0b070',
      skills: [
        { id: 'shout', name: '전투 함성', desc: '주변 적 피해 + 1.4초 기절', cd: 8 },
        { id: 'shout2', name: '공포의 함성', desc: '넓게 피해 + 1.6초 기절 + 받는 피해 +20%(저주)', cd: 8 },
        { id: 'earthshatter', name: '대지 분쇄', desc: '높이 뛰어올라 내려찍어 아주 넓게 큰 피해 + 2초 기절', cd: 12 }] },
    blood: { name: '피의 서약', desc: '체력을 바쳐 힘을 얻음', ranks: ['피의 서약자', '피의 광신자', '붉은 달의 사도'], color: '#c02a3a',
      skills: [
        { id: 'bloodpact', name: '피의 서약', desc: '체력 10%를 바쳐 6초간 공격력 +90%', cd: 10 },
        { id: 'bloodpact2', name: '피의 광기', desc: '체력 10%를 바쳐 8초간 공격력 +130%, 처치할 때마다 체력 +8', cd: 10 },
        { id: 'bloodmoon', name: '붉은 달', desc: '체력 15%를 바쳐 8초간 공격력 +120%·흡혈 + 주위에 피의 달 소용돌이', cd: 14 }] },
    // [사용자 결정] 이름 미정 갈래: 처치할수록 '포식' 중첩이 쌓여 점점 강해짐 (스킬로 처치하면 더 많이, 처치 수와 따로 셈) · 던전 성능은 매우 높고 보스전은 약함
    //  이름·직업명·스킬은 [임시] (스킬 미정 — 자리 채움용 범위 공격)
    feast: { name: '소울 이터', desc: '적의 혼을 삼켜 포식 스택이 쌓이고, 쌓일수록 일반 몬스터에게 끝없이 강해짐 (스킬로 처치하면 +3) · 보스에게는 약함 · 전직의 방이 아니라 포식 750·2000에서 진화', ranks: ['소울 이터', '혼을 먹는 자', '만혼(萬魂)의 포식자'], color: '#a2426e', noEvolveRoom: true, stackEvolve: [750, 2000],
      skills: [
        { id: 'feast1', name: '혼을 거두는 낫', desc: '앞쪽 넓은 부채꼴을 낫으로 베어 피해 — 이 스킬로 처치하면 포식 +3', cd: 6 },
        { id: 'feast2', name: '영혼 포식', desc: '주변을 원형으로 베어 끌어당기며 피해 — 이 스킬로 처치하면 포식 +3', cd: 7 },
        { id: 'feast3', name: '만혼 강림', desc: '흩어진 혼을 끌어모아 하늘에서 혼의 비를 쏟아붓는 궁극기 — 대폭발 후 넓은 범위를 3초간 집어삼킴 · 이 장판에서 죽는 적마다 포식 +3 · 막타용: 체력이 많은 적에게는 피해가 제한되고, 빈사(35% 이하) 적에게 피해 +60%', cd: 10 }] }  },
  hero_druid: { title: '자연의 길 선택',
    base: { name: '야수', desc: '영혼 늑대를 불러 함께 싸움', ranks: ['드루이드', '대드루이드', '숲의 군주'], color: '#9ad8ff',
    skills: [
      { id: 'wolves', name: '영혼 늑대', desc: '12초간 적을 물어뜯는 늑대 3마리 소환', cd: 13 },
      { id: 'wolves2', name: '야수의 무리', desc: '16초간 강한 늑대 4마리 (물면 둔화)', cd: 13 },
      { id: 'guardian', name: '대지의 수호수', desc: '18초간 거대한 곰(강한 내려치기 범위 피해) + 강한 늑대 3마리 소환, 곰이 나타날 때 주변 적 1초 기절', cd: 15 }] },
    thorn: { name: '가시', desc: '가시와 뿌리로 묶고 찌름', ranks: ['가시 수호자', '덤불의 주인', '고대 뿌리의 현자'], color: '#7adf4a',
      skills: [
        { id: 'thornfield', name: '가시 덤불', desc: '조준 지점에 6초간 가시 덤불 (지속 피해 + 중독)', cd: 8 },
        { id: 'thornburst', name: '가시 폭발', desc: '사방으로 꿰뚫는 가시 16개 (중독)', cd: 7 },
        { id: 'ancientroot', name: '고대의 뿌리', desc: '넓은 범위의 적을 3초간 묶고 큰 피해 + 강한 중독', cd: 12 }] },
    shape: { name: '변신', desc: '원시의 힘을 몸에 두름', ranks: ['야성의 아이', '야성 투사', '원시의 군주'], color: '#c8a070',
      skills: [
        { id: 'bearform', name: '야성 변신', desc: '10초간 변신: 받는 피해 -45%·공격력 +45%, 넓은 베기(사거리 52)', cd: 12 },
        { id: 'bearform2', name: '광포한 야성', desc: '12초간 변신: 받는 피해 -48%·공격력 +40%, 넓은 베기 + 주위를 할퀴는 기운', cd: 12 },
        { id: 'primal', name: '원시의 분노', desc: '11초간 변신: 받는 피해 -52%·공격력 +70%, 넓은 베기 + 넓게 할퀴는 기운(흡혈) + 체력 25% 회복', cd: 15 }] } }
};
// 직업의 갈래 목록 (title 제외)
function jobLines(heroId) { const J = JOB_LINES[heroId] || {}; return Object.keys(J).filter((k) => J[k] && typeof J[k] === 'object').map((k) => Object.assign({ id: k }, J[k])); }
function branchesAtEvolve(heroId) { return !!(JOB_LINES[heroId] && JOB_LINES[heroId].branchAtEvolve); } // 첫 진화 때 갈래를 고르는 직업

// ════════════════════════════════════════════
// 혼합 전직 (제안 단계 · 지금은 마검사 하나)
//  2차 진화 차례에 전직의 방에 들어가면 일정 확률로 내 직업 대신 다른 직업의 상위자가 나옴
//  → 그 상위자를 이기거나 골드를 내면 혼합 직업으로 진화 (능력치 상승은 2차 진화와 같음)
//  속성은 나온 상위자(마도사 갈래)를 따라감
// ════════════════════════════════════════════
const HYBRID_JOBS = {
  spellblade: { from: 'hero_swordsman', master: 'hero_mage', chance: 0.3, name: '마검사',
    skill: { id: 'spellblade', name: '마력 검무', desc: '회오리 베기 + 사방으로 속성 검기 8줄, 맞은 적에게 속성 상태이상', cd: 6 },
    passiveChance: 0.15 } // 근접 공격에 붙는 속성 상태이상 확률
};
// 마도사 갈래 → 그 속성의 상태이상
const ELEMENT_STATUS = {
  fire: { type: 'burn', chance: 1, duration: 3, dps: 10 },
  ice: { type: 'freeze', chance: 1, duration: 2, slow: 0.45 },
  nature: { type: 'poison', chance: 1, duration: 4, dps: 20 }, /* 마검사 자연 강화: 독 2배 (+ 마력 검무에 1.5초 속박) */
  lightning: { type: 'shock', chance: 1, duration: 3 },
  light: { type: 'blind', chance: 1, duration: 3 },
  dark: { type: 'curse', chance: 1, duration: 4 }
};
