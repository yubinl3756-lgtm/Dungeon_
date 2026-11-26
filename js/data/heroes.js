'use strict';
// ════════════════════════════════════════════
// 데이터: 플레이어 공통 / 캐릭터
// ════════════════════════════════════════════
const DATA_PLAYER_BASE = {
  hitboxHalf: 5, dashSpeed: 400, dashDuration: 0.18, dashInvuln: 0.22, dashCooldown: 1.8,
  hurtInvuln: 0.7, critChance: 0.08, critMultiplier: 1.8,
  shieldRegenDelay: 2.5, shieldRegenRate: 15, weaponSlots: 2
};

const DATA_HEROES = [
  { id: 'hero_swordsman', name: '검사 레온', title: '근접 전투의 달인', price: 0,
    maxHp: 130, maxShield: 55, maxEnergy: 190, moveSpeed: 115, startWeapon: 'weapon_sword_001',
    skill: 'whirlwind', skillName: '회오리 베기', skillDesc: '주변을 베고 적 탄환을 지움', skillCooldown: 6,
    passiveName: '단련된 갑옷', passiveDesc: '받는 피해 15% 감소', damageReduction: 0.15,
    look: { sprite: 'knight', body: '#b84a4a', accent: '#e04848' } },
  { id: 'hero_gunner', name: '사수 미라', title: '총기 전문가', price: 0,
    maxHp: 90, maxShield: 50, maxEnergy: 200, moveSpeed: 120, startWeapon: 'weapon_pistol_001',
    skill: 'overdrive', skillName: '과부하 사격', skillDesc: '5초간 공격 속도 2배, 에너지 무소모', skillCooldown: 15,
    passiveName: '탄약 절약', passiveDesc: '무기 에너지 소모 -20%', energySave: 0.2,
    look: { sprite: 'gunslinger', body: '#3a5a8a', accent: '#8a5a34' } },
  { id: 'hero_mage', name: '마도사 엘린', title: '원소 마법사', price: 0,
    maxHp: 115, maxShield: 50, maxEnergy: 290, moveSpeed: 116, startWeapon: 'weapon_wand_001',
    skill: 'frost_nova', skillName: '서리 폭발', skillDesc: '주변 적 피해 + 빙결, 탄환 제거', skillCooldown: 6,
    passiveName: '원소 친화', passiveDesc: '모든 상태이상 효과 +30%', statusBoost: 0.3,
    look: { sprite: 'wizard', body: '#6a4ab0', accent: '#3a2a80' } },
  { id: 'hero_engineer', name: '기술자 보로', title: '포탑 설계자', price: 200,
    maxHp: 100, maxShield: 45, maxEnergy: 220, moveSpeed: 112, startWeapon: 'weapon_rivet_001',
    skill: 'turret', skillName: '자동 포탑', skillDesc: '12초간 적을 쏘는 포탑 설치', skillCooldown: 13,
    passiveName: '손재주', passiveDesc: '무기 강화 비용 -20%', upgradeDiscount: 0.2,
    look: { sprite: 'engineer', body: '#d07a2a', accent: '#f0c030' } },
  { id: 'hero_assassin', name: '암살자 카이', title: '그림자 속의 칼날', price: 300,
    maxHp: 85, maxShield: 45, maxEnergy: 180, moveSpeed: 130, startWeapon: 'weapon_dagger_001',
    skill: 'blink', skillName: '그림자 습격', skillDesc: '조준 방향으로 순간이동하며 지나간 적을 벰 (잠깐 무적)', skillCooldown: 5,
    passiveName: '급소 노리기', passiveDesc: '치명타 확률 +15%', critBonus: 0.15,
    look: { sprite: 'assassin', body: '#3a3048', accent: '#c03040' } },
  { id: 'hero_priest', name: '사제 세라', title: '빛의 수호자', price: 400,
    maxHp: 120, maxShield: 70, maxEnergy: 230, moveSpeed: 112, startWeapon: 'weapon_ironstaff_001',
    skill: 'sanctuary', skillName: '성역', skillDesc: '6초간 빛의 원: 안에 있으면 회복, 원 안의 적 지속 피해, 들어오는 적 탄 소멸', skillCooldown: 13,
    passiveName: '축복', passiveDesc: '전투방을 정리할 때마다 체력 +8', roomHeal: 8,
    look: { sprite: 'priest', body: '#e8e0d0', accent: '#d0a040' } },
  { id: 'hero_berserker', name: '광전사 바르그', title: '피에 굶주린 전사', price: 500,
    maxHp: 150, maxShield: 45, maxEnergy: 160, moveSpeed: 114, startWeapon: 'weapon_club_001',
    skill: 'rage', skillName: '분노', skillDesc: '5초간 공격력 +70%, 이동 속도 +20%', skillCooldown: 12,
    passiveName: '피의 갈증', passiveDesc: '체력 50% 이하일 때 공격력 +30%', lowHpBonus: 0.3,
    look: { sprite: 'berserker', body: '#8a5a3a', accent: '#a02a2a' } },
  { id: 'hero_druid', name: '드루이드 이반', title: '숲의 부름', price: 600,
    maxHp: 120, maxShield: 60, maxEnergy: 240, moveSpeed: 118, startWeapon: 'weapon_sling_001',
    skill: 'wolves', skillName: '영혼 늑대', skillDesc: '12초간 적을 물어뜯는 늑대 3마리 소환', skillCooldown: 13,
    passiveName: '자연의 가호', passiveDesc: '보호막 회복 속도 +60%', shieldRegenMul: 1.6,
    look: { sprite: 'druid', body: '#4a7a3a', accent: '#6a4628' } }
];
// ── 스킨 (외형만 바뀜, 능력은 그대로) [사용자 결정] 선물 코드로 얻음 — 일시정지(Esc) → G 선물 코드
const SKINS = [
  { id: 'skin_flamewitch', name: '불꽃 마녀', hero: 'hero_mage', line: 'fire', sprite: 'flamewitch', source: 'code', desc: '불 마도사 외형: 끝이 꺾인 마녀 모자와 붉은 원피스' },
  { id: 'skin_redgunner', name: '붉은 머리 총잡이', hero: 'hero_gunner', line: 'base', sprite: 'redgunner', source: 'code', desc: '속사 사수 외형: 붉은 머리와 보안관 별을 단 남색 조끼' },
  { id: 'skin_silverelf', name: '은발 엘프 마도사', hero: 'hero_mage', line: 'light', sprite: 'silverelf', source: 'code', desc: '빛 마도사 외형: 은발 트윈테일과 뾰족한 귀, 금테 흰 망토' },
  // ── 고유 등급 스킨: 직업 전체(모든 계열) · 착용하면 모든 스킬·공통 동작에 전용 VFX (js/systems/unique_vfx.js) · 장비 외형 테마
  { id: 'skin_u_unrecorded', name: '미기록자', hero: 'hero_engineer', sprite: 'u_unrecorded', rarity: 'unique', source: 'unique', uniqueTheme: 'unrecorded', intro: '기록에 없는 자. 그러니 아무도 나를 멈출 수 없어.', desc: '기술자 고유 외형 — 기록되지 않은 존재, 청록 글리치와 데이터 파편' },
  { id: 'skin_u_first_explorer', name: '최초의 탐험가', hero: 'hero_swordsman', sprite: 'u_first_explorer', rarity: 'unique', source: 'unique', uniqueTheme: 'first_explorer', intro: '길이 없다면, 내가 처음 걷는 자가 되겠다.', desc: '검사 고유 외형 — 나침반을 새긴 최초의 탐험가, 금빛 바람과 고대 문양' },
  { id: 'skin_u_primordial', name: '시원체', hero: 'hero_druid', sprite: 'u_primordial', rarity: 'unique', source: 'unique', uniqueTheme: 'primordial', intro: '모든 생명은 나에게서 시작되었다.', desc: '드루이드 고유 외형 — 모든 생명의 시작, 꽃잎과 생명 핵' },
  // ── 전설 등급 스킨 (애니메이션, 고퀄) — assets/legskins.png (4행 × 3프레임, 셀 106×108)
  { id: 'skin_leg_abyss', name: '심연의 기사', hero: 'hero_swordsman', line: 'sword', sprite: 'leg_abyss', rarity: 'legendary', source: 'gacha', intro: '심연의 바닥에서 돌아왔다. 이번엔 내가 어둠을 벤다.', desc: '검사 전설 외형 — 심연에서 돌아온 뿔투구 기사 (검사 계열 전용)' },
  { id: 'skin_leg_crimson', name: '진홍의 칼날', hero: 'hero_assassin', line: 'blade', sprite: 'leg_crimson', rarity: 'legendary', source: 'gacha', intro: '핏빛 장막이 걷힐 즈음엔… 이미 끝나 있을 거야.', desc: '암살자 전설 외형 — 핏빛 장막 속에서 춤추는 칼날 (칼날 계열 전용)' },
  { id: 'skin_leg_void', name: '공허의 마도사', hero: 'hero_mage', line: 'dark', sprite: 'leg_void', rarity: 'legendary', source: 'gacha', intro: '공허는 비어 있지 않아. 모든 것을 삼킬 뿐이지.', desc: '마법사 전설 외형 — 어둠을 휘감은 공허의 현자 (어둠 계열 전용)' },
  { id: 'skin_leg_star', name: '성역의 성자', hero: 'hero_priest', line: 'base', sprite: 'leg_star', rarity: 'legendary', source: 'gacha', intro: '별빛이 머무는 곳, 그곳이 저의 성역입니다.', desc: '사제 전설 외형 — 별빛 성역의 성자 (성역 계열 전용)' },
  { id: 'skin_leg_admiral', name: '천공함대 제독', hero: 'hero_gunner', line: 'demo', sprite: 'leg_admiral', rarity: 'legendary', source: 'gacha', intro: '전 함대, 닻을 올려라. 하늘 아래 어디든, 포성이 길을 연다.', desc: '사수 전설 외형 — 날개 닻 문장 삼각모와 금빛 견장, 하늘을 나는 천공함대의 제독 (폭파 계열 전용)' }, // [사용자 결정] 뽑기 배너 추가 (assets/banners/admiral)
  { id: 'skin_leg_berserker', name: '용살의 전사', hero: 'hero_berserker', line: 'blood', sprite: 'leg_berserker', rarity: 'legendary', source: 'gacha', intro: '이 피로 맹세했다. 마지막 용이 쓰러질 때까지, 나는 멈추지 않는다.', desc: '광전사 전설 외형 — 붉은 뿔 투구와 흑철 갑옷, 피빛 망토의 용살의 전사 (피의 서약 계열 전용)' }, // [사용자 결정] 뽑기 배너 추가 (assets/banners/dragonslayer)
  // ── 변신 드루이드 스킨: 평소 반디(앞/옆/뒤) ↔ 변신 시 샘(대기=22·공격=21, 좌우 반전만)
  { id: 'skin_bandi', name: '반디', hero: 'hero_druid', sprite: 'druid_bandi', rarity: 'legendary', source: 'code', druid: true, intro: '난 싸울 거야. 모든 것이 불타 버릴 때까지.', desc: '드루이드 변신 스킨 — 평소엔 반디, 변신하면 날개 돋친 샘으로 (선물 코드)' },
  // ── 일반·레어·에픽 스킨 (앞모습, 좌우 반전) — assets/commonskins.png · 퀄리티별 등급: 기존 1·2단계=레어, 3단계=에픽, 새 22종=일반
  { id: 'skin_c_sw_1', name: '핏빛 강철 기사', hero: 'hero_swordsman', sprite: 'c_swordsman_1', rarity: 'rare', source: 'common', desc: '검사 레어 외형 — 핏빛 강철 갑옷' },
  { id: 'skin_c_sw_2', name: '백금 성기사', hero: 'hero_swordsman', sprite: 'c_swordsman_2', rarity: 'rare', source: 'common', desc: '검사 레어 외형 — 백금빛 성기사' },
  { id: 'skin_c_sw_3', name: '자수정 뿔의 기사단장', hero: 'hero_swordsman', sprite: 'c_swordsman_3', rarity: 'epic', source: 'common', desc: '검사 에픽 외형 — 보랏빛 뿔투구' },
  { id: 'skin_c_gn_1', name: '진홍 망토 보안관', hero: 'hero_gunner', sprite: 'c_gunner_1', rarity: 'rare', source: 'common', desc: '사수 레어 외형 — 붉은 외투의 보안관' },
  { id: 'skin_c_gn_2', name: '금장 근위총사', hero: 'hero_gunner', sprite: 'c_gunner_2', rarity: 'rare', source: 'common', desc: '사수 레어 외형 — 남색·금장 제복' },
  { id: 'skin_c_gn_3', name: '푸른 폭풍의 명사수', hero: 'hero_gunner', sprite: 'c_gunner_3', rarity: 'epic', source: 'common', desc: '사수 에픽 외형 — 청록빛 코트' },
  { id: 'skin_c_mg_1', name: '서리꽃 마법사', hero: 'hero_mage', sprite: 'c_mage_1', rarity: 'rare', source: 'common', desc: '마도사 레어 외형 — 푸른 서리 로브' },
  { id: 'skin_c_mg_2', name: '자줏빛 현자', hero: 'hero_mage', sprite: 'c_mage_2', rarity: 'rare', source: 'common', desc: '마도사 레어 외형 — 보랏빛 현자 복장' },
  { id: 'skin_c_mg_3', name: '황혼을 부르는 대마도사', hero: 'hero_mage', sprite: 'c_mage_3', rarity: 'epic', source: 'common', desc: '마도사 에픽 외형 — 자금빛 황혼 예복' },
  { id: 'skin_c_en_1', name: '놋쇠 고글 기술자', hero: 'hero_engineer', sprite: 'c_engineer_1', rarity: 'rare', source: 'common', desc: '기술자 레어 외형 — 고글 쓴 정비사' },
  { id: 'skin_c_en_2', name: '사막 두건 정비공', hero: 'hero_engineer', sprite: 'c_engineer_2', rarity: 'rare', source: 'common', desc: '기술자 레어 외형 — 갈색 두건 작업복' },
  { id: 'skin_c_en_3', name: '황금 태엽의 대기공사', hero: 'hero_engineer', sprite: 'c_engineer_3', rarity: 'epic', source: 'common', desc: '기술자 에픽 외형 — 금빛 기공 장비' },
  { id: 'skin_c_as_1', name: '핏빛 두건 자객', hero: 'hero_assassin', sprite: 'c_assassin_1', rarity: 'rare', source: 'common', desc: '암살자 레어 외형 — 붉은 두건의 자객' },
  { id: 'skin_c_as_2', name: '서리장막 그림자', hero: 'hero_assassin', sprite: 'c_assassin_2', rarity: 'rare', source: 'common', desc: '암살자 레어 외형 — 푸른 서리 장막' },
  { id: 'skin_c_as_3', name: '자색 달그림자의 암살자', hero: 'hero_assassin', sprite: 'c_assassin_3', rarity: 'epic', source: 'common', desc: '암살자 에픽 외형 — 자줏빛 암영' },
  { id: 'skin_c_pr_1', name: '홍련의 기도사', hero: 'hero_priest', sprite: 'c_priest_1', rarity: 'rare', source: 'common', desc: '사제 레어 외형 — 홍련빛 사제복' },
  { id: 'skin_c_pr_2', name: '흰 날개 수호천사', hero: 'hero_priest', sprite: 'c_priest_2', rarity: 'rare', source: 'common', desc: '사제 레어 외형 — 흰 날개의 천사' },
  { id: 'skin_c_pr_3', name: '황금 광휘의 세라핌', hero: 'hero_priest', sprite: 'c_priest_3', rarity: 'epic', source: 'common', desc: '사제 에픽 외형 — 금빛 세라핌' },
  { id: 'skin_c_be_1', name: '서리뿔 투사', hero: 'hero_berserker', sprite: 'c_berserker_1', rarity: 'rare', source: 'common', desc: '광전사 레어 외형 — 푸른 뿔 투구' },
  { id: 'skin_c_be_2', name: '홍염 뿔 광전사', hero: 'hero_berserker', sprite: 'c_berserker_2', rarity: 'rare', source: 'common', desc: '광전사 레어 외형 — 붉은·금빛 뿔갑옷' },
  { id: 'skin_c_be_3', name: '홍염 뿔의 전쟁군주', hero: 'hero_berserker', sprite: 'c_berserker_3', rarity: 'epic', source: 'common', desc: '광전사 에픽 외형 — 금빛 뿔의 군주' },
  { id: 'skin_c_dr_1', name: '단풍잎 드루이드', hero: 'hero_druid', sprite: 'c_druid_1', rarity: 'rare', source: 'common', desc: '드루이드 레어 외형 — 단풍빛 망토' },
  { id: 'skin_c_dr_2', name: '붉은 버섯 숲지기', hero: 'hero_druid', sprite: 'c_druid_2', rarity: 'rare', source: 'common', desc: '드루이드 레어 외형 — 붉은 버섯 모자' },
  { id: 'skin_c_dr_3', name: '태고 숲의 큰뿔 현자', hero: 'hero_druid', sprite: 'c_druid_3', rarity: 'epic', source: 'common', desc: '드루이드 에픽 외형 — 큰 사슴뿔' },
  // ── 일반 스킨 추가 22종 (앞모습 정지 + 걷기 1장) — commonskins.png 아래쪽
  { id: 'skin_c_n01', name: '모래바람 검객', hero: 'hero_swordsman', sprite: 'c_n01', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 모래색 천 망토와 굽은 곡선 검의 떠돌이 검객' },
  { id: 'skin_c_n02', name: '왕도 결투사', hero: 'hero_swordsman', sprite: 'c_n02', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 귀족풍 긴 외투와 장식 세검의 결투사' },
  { id: 'skin_c_n03', name: '폐허 탐색검사', hero: 'hero_swordsman', sprite: 'c_n03', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 낡은 가죽 장비·탐험 가방·보호 고글의 유적 탐험가' },
  { id: 'skin_c_n04', name: '유리공방 연금술사', hero: 'hero_mage', sprite: 'c_n04', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 약병과 유리 장식이 달린 연금술 작업복' },
  { id: 'skin_c_n05', name: '서고 기록술사', hero: 'hero_mage', sprite: 'c_n05', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 책과 두루마리로 장식한 학자 복장' },
  { id: 'skin_c_n06', name: '안개 조향술사', hero: 'hero_mage', sprite: 'c_n06', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 향수병과 작은 유리 용기를 지닌 안개의 마법사' },
  { id: 'skin_c_n07', name: '철도 호송사수', hero: 'hero_gunner', sprite: 'c_n07', rarity: 'common', source: 'common', desc: '사수 일반 외형 — 철도 경비대 제복과 여행 가방' },
  { id: 'skin_c_n08', name: '해안 경비포수', hero: 'hero_gunner', sprite: 'c_n08', rarity: 'common', source: 'common', desc: '사수 일반 외형 — 짙은 남색 방수 외투와 해양 장비' },
  { id: 'skin_c_n09', name: '유적 발굴기사', hero: 'hero_engineer', sprite: 'c_n09', rarity: 'common', source: 'common', desc: '기술자 일반 외형 — 낡은 작업복과 발굴·측량 도구' },
  { id: 'skin_c_n10', name: '극지 관측기사', hero: 'hero_engineer', sprite: 'c_n10', rarity: 'common', source: 'common', desc: '기술자 일반 외형 — 방한복과 휴대용 관측 장치' },
  { id: 'skin_c_n11', name: '가면 도적', hero: 'hero_assassin', sprite: 'c_n11', rarity: 'common', source: 'common', desc: '암살자 일반 외형 — 화려한 반쪽 가면과 정장풍 잠행복' },
  { id: 'skin_c_n12', name: '유랑 곡예자객', hero: 'hero_assassin', sprite: 'c_n12', rarity: 'common', source: 'common', desc: '암살자 일반 외형 — 화려한 무대 의상과 리본 장식' },
  { id: 'skin_c_n13', name: '야전 의무관', hero: 'hero_priest', sprite: 'c_n13', rarity: 'common', source: 'common', desc: '사제 일반 외형 — 의료 가방과 간소한 흰 작업복' },
  { id: 'skin_c_n14', name: '종탑 수호사제', hero: 'hero_priest', sprite: 'c_n14', rarity: 'common', source: 'common', desc: '사제 일반 외형 — 짙은 갈색 예복과 작은 종 장식' },
  { id: 'skin_c_n15', name: '광산 파쇄꾼', hero: 'hero_berserker', sprite: 'c_n15', rarity: 'common', source: 'common', desc: '광전사 일반 외형 — 광부 작업복과 두꺼운 보호 장비' },
  { id: 'skin_c_n16', name: '해적 갑판장', hero: 'hero_berserker', sprite: 'c_n16', rarity: 'common', source: 'common', desc: '광전사 일반 외형 — 해적 모자와 낡은 선원 코트' },
  { id: 'skin_c_n17', name: '오아시스 길잡이', hero: 'hero_druid', sprite: 'c_n17', rarity: 'common', source: 'common', desc: '드루이드 일반 외형 — 모래색 망토와 선인장 장식의 사막 길잡이' },
  { id: 'skin_c_n18', name: '습지 파수꾼', hero: 'hero_druid', sprite: 'c_n18', rarity: 'common', source: 'common', desc: '드루이드 일반 외형 — 갈대와 습지 식물로 만든 자연 장비' },
  { id: 'skin_c_n19', name: '용비늘 검투사', hero: 'hero_swordsman', sprite: 'c_n19', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 청록색 용 비늘 갑옷과 용 문양' },
  { id: 'skin_c_n20', name: '수정빛 마도사', hero: 'hero_mage', sprite: 'c_n20', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 투명한 수정 장식과 무지갯빛 로브' },
  { id: 'skin_c_n21', name: '심해 기관사', hero: 'hero_engineer', sprite: 'c_n21', rarity: 'common', source: 'common', desc: '기술자 일반 외형 — 둥근 잠수 헬멧과 압력 보호복' },
  { id: 'skin_c_n22', name: '사막꽃 드루이드', hero: 'hero_druid', sprite: 'c_n22', rarity: 'common', source: 'common', desc: '드루이드 일반 외형 — 황금빛 사막 망토와 선인장·꽃 장식' },
  // ── 일반 스킨 24종 추가 (직업마다 3개, 코드로 찍은 도트 — 뽑기 풀 넓히기)
  { id: 'skin_c_n23', name: '눈꽃 순찰검사', hero: 'hero_swordsman', sprite: 'c_n23', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 흰 털 두건과 얼음빛 외투의 순찰병' },
  { id: 'skin_c_n24', name: '벚꽃 떠돌이 무사', hero: 'hero_swordsman', sprite: 'c_n24', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 삿갓과 분홍 하오리의 떠돌이 무사' },
  { id: 'skin_c_n25', name: '해적선 갑판장', hero: 'hero_swordsman', sprite: 'c_n25', rarity: 'common', source: 'common', desc: '검사 일반 외형 — 빨간 두건과 줄무늬 셔츠의 갑판장' },
  { id: 'skin_c_n26', name: '서부 현상금 사냥꾼', hero: 'hero_gunner', sprite: 'c_n26', rarity: 'common', source: 'common', desc: '사수 일반 외형 — 챙 넓은 모자와 초록 판초의 사냥꾼' },
  { id: 'skin_c_n27', name: '증기 비행사', hero: 'hero_gunner', sprite: 'c_n27', rarity: 'common', source: 'common', desc: '사수 일반 외형 — 가죽 비행모와 고글, 갈색 항공 재킷' },
  { id: 'skin_c_n28', name: '호박밭 사수', hero: 'hero_gunner', sprite: 'c_n28', rarity: 'common', source: 'common', desc: '사수 일반 외형 — 호박색 마녀 모자와 보랏빛 정장' },
  { id: 'skin_c_n29', name: '별빛 견습생', hero: 'hero_mage', sprite: 'c_n29', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 별이 수놓인 남색 고깔모와 로브' },
  { id: 'skin_c_n30', name: '사막 신기루 술사', hero: 'hero_mage', sprite: 'c_n30', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 모래빛 터번과 긴 로브, 보석 지팡이' },
  { id: 'skin_c_n31', name: '꿈결 수면술사', hero: 'hero_mage', sprite: 'c_n31', rarity: 'common', source: 'common', desc: '마도사 일반 외형 — 수면 모자와 하늘빛 잠옷 로브' },
  { id: 'skin_c_n32', name: '광산 굴착꾼', hero: 'hero_engineer', sprite: 'c_n32', rarity: 'common', source: 'common', desc: '기술자 일반 외형 — 헤드램프 안전모와 푸른 작업복' },
  { id: 'skin_c_n33', name: '시계탑 수리공', hero: 'hero_engineer', sprite: 'c_n33', rarity: 'common', source: 'common', desc: '기술자 일반 외형 — 톱니 장식 실크햇과 갈색 조끼' },
  { id: 'skin_c_n34', name: '해저 잠수 기술자', hero: 'hero_engineer', sprite: 'c_n34', rarity: 'common', source: 'common', desc: '기술자 일반 외형 — 놋쇠 잠수 헬멧과 청록 잠수복' },
  { id: 'skin_c_n35', name: '밤시장 소매치기', hero: 'hero_assassin', sprite: 'c_n35', rarity: 'common', source: 'common', desc: '암살자 일반 외형 — 낡은 모자와 초록 목도리의 소매치기' },
  { id: 'skin_c_n36', name: '수습 닌자', hero: 'hero_assassin', sprite: 'c_n36', rarity: 'common', source: 'common', desc: '암살자 일반 외형 — 붉은 머리띠와 검은 복면의 수습생' },
  { id: 'skin_c_n37', name: '가면무도회 그림자', hero: 'hero_assassin', sprite: 'c_n37', rarity: 'common', source: 'common', desc: '암살자 일반 외형 — 흰 가면과 포도주빛 연미복' },
  { id: 'skin_c_n38', name: '견습 수녀', hero: 'hero_priest', sprite: 'c_n38', rarity: 'common', source: 'common', desc: '사제 일반 외형 — 흑백 베일과 수수한 수녀복' },
  { id: 'skin_c_n39', name: '등불 순례자', hero: 'hero_priest', sprite: 'c_n39', rarity: 'common', source: 'common', desc: '사제 일반 외형 — 갈색 순례 망토와 길잡이 등불' },
  { id: 'skin_c_n40', name: '바닷가 축복사', hero: 'hero_priest', sprite: 'c_n40', rarity: 'common', source: 'common', desc: '사제 일반 외형 — 꽃 목걸이와 흰·푸른 사제복, 조개 지팡이' },
  { id: 'skin_c_n41', name: '바이킹 도끼잡이', hero: 'hero_berserker', sprite: 'c_n41', rarity: 'common', source: 'common', desc: '광전사 일반 외형 — 뿔 달린 쇠투구와 털가죽 조끼, 땋은 수염' },
  { id: 'skin_c_n42', name: '투기장 검투사', hero: 'hero_berserker', sprite: 'c_n42', rarity: 'common', source: 'common', desc: '광전사 일반 외형 — 볏 달린 청동 투구와 가죽 갑옷' },
  { id: 'skin_c_n43', name: '설산 야만전사', hero: 'hero_berserker', sprite: 'c_n43', rarity: 'common', source: 'common', desc: '광전사 일반 외형 — 흰 털가죽을 뒤집어쓰고 푸른 물감을 칠한 전사' },
  { id: 'skin_c_n44', name: '양봉 드루이드', hero: 'hero_druid', sprite: 'c_n44', rarity: 'common', source: 'common', desc: '드루이드 일반 외형 — 그물 모자와 노랑·검정 줄무늬 옷' },
  { id: 'skin_c_n45', name: '이끼 바위 수호자', hero: 'hero_druid', sprite: 'c_n45', rarity: 'common', source: 'common', desc: '드루이드 일반 외형 — 이끼 두건과 잿빛 돌 장식 망토' },
  { id: 'skin_c_n46', name: '가을 수확 드루이드', hero: 'hero_druid', sprite: 'c_n46', rarity: 'common', source: 'common', desc: '드루이드 일반 외형 — 밀짚모자와 주황빛 옷, 밀 이삭 지팡이' },
  // ── 레어 18 · 에픽 6 추가 (사용자 제공 도트 시트에서 잘라 인게임 크기로)
  { id: 'skin_c_e01', name: '시간의 현자', hero: 'hero_mage', sprite: 'c_e01', rarity: 'epic', source: 'common', desc: '마도사 에픽 외형 — 시계 장식 모자와 청동색 로브' },
  { id: 'skin_c_e02', name: '강철의 발명가', hero: 'hero_engineer', sprite: 'c_e02', rarity: 'epic', source: 'common', desc: '기술자 에픽 외형 — 소형 로봇과 특수 기계 장비' },
  { id: 'skin_c_e03', name: '까마귀의 그림자', hero: 'hero_assassin', sprite: 'c_e03', rarity: 'epic', source: 'common', desc: '암살자 에픽 외형 — 까마귀 후드와 검은 깃털 망토' },
  { id: 'skin_c_e04', name: '천상의 성가대', hero: 'hero_priest', sprite: 'c_e04', rarity: 'epic', source: 'common', desc: '사제 에픽 외형 — 흰 예복과 금빛 장식, 빛의 후광' },
  { id: 'skin_c_e05', name: '설산의 폭군', hero: 'hero_berserker', sprite: 'c_e05', rarity: 'epic', source: 'common', desc: '광전사 에픽 외형 — 곰가죽 투구와 거대한 철갑' },
  { id: 'skin_c_e06', name: '달빛 늑대지기', hero: 'hero_druid', sprite: 'c_e06', rarity: 'epic', source: 'common', desc: '드루이드 에픽 외형 — 늑대 귀와 달빛 장식의 초록 망토' },
  { id: 'skin_c_r01', name: '암석수호 기사', hero: 'hero_swordsman', sprite: 'c_r01', rarity: 'rare', source: 'common', desc: '검사 레어 외형 — 회색 돌판 갑옷' },
  { id: 'skin_c_r02', name: '사막의 방패수호자', hero: 'hero_swordsman', sprite: 'c_r02', rarity: 'rare', source: 'common', desc: '검사 레어 외형 — 모래색 망토와 방패' },
  { id: 'skin_c_r03', name: '청풍의 검사', hero: 'hero_swordsman', sprite: 'c_r03', rarity: 'rare', source: 'common', desc: '검사 레어 외형 — 푸른 긴 외투와 경량 갑옷' },
  { id: 'skin_c_r04', name: '고산의 명사수', hero: 'hero_gunner', sprite: 'c_r04', rarity: 'rare', source: 'common', desc: '사수 레어 외형 — 털모자와 산악 장비' },
  { id: 'skin_c_r05', name: '황야의 사냥꾼', hero: 'hero_gunner', sprite: 'c_r05', rarity: 'rare', source: 'common', desc: '사수 레어 외형 — 낡은 모자와 여행복' },
  { id: 'skin_c_r06', name: '달빛 정찰병', hero: 'hero_gunner', sprite: 'c_r06', rarity: 'rare', source: 'common', desc: '사수 레어 외형 — 어두운 복장과 고글' },
  { id: 'skin_c_r07', name: '화톳불 마도사', hero: 'hero_mage', sprite: 'c_r07', rarity: 'rare', source: 'common', desc: '마도사 레어 외형 — 촛불 장식 모자와 붉은 로브' },
  { id: 'skin_c_r08', name: '연무의 술사', hero: 'hero_mage', sprite: 'c_r08', rarity: 'rare', source: 'common', desc: '마도사 레어 외형 — 회색 후드와 연기 장식' },
  { id: 'skin_c_r09', name: '자력장 연구원', hero: 'hero_engineer', sprite: 'c_r09', rarity: 'rare', source: 'common', desc: '기술자 레어 외형 — 자석 장식과 금속 작업복' },
  { id: 'skin_c_r10', name: '화약포 장인', hero: 'hero_engineer', sprite: 'c_r10', rarity: 'rare', source: 'common', desc: '기술자 레어 외형 — 화약통과 두꺼운 작업복' },
  { id: 'skin_c_r11', name: '흑장막 자객', hero: 'hero_assassin', sprite: 'c_r11', rarity: 'rare', source: 'common', desc: '암살자 레어 외형 — 검은 망토와 가면' },
  { id: 'skin_c_r12', name: '백면의 침투자', hero: 'hero_assassin', sprite: 'c_r12', rarity: 'rare', source: 'common', desc: '암살자 레어 외형 — 흰 가면과 남색 복장' },
  { id: 'skin_c_r13', name: '순례자의 인도자', hero: 'hero_priest', sprite: 'c_r13', rarity: 'rare', source: 'common', desc: '사제 레어 외형 — 갈색 순례복과 작은 가방' },
  { id: 'skin_c_r14', name: '청휘의 사제', hero: 'hero_priest', sprite: 'c_r14', rarity: 'rare', source: 'common', desc: '사제 레어 외형 — 푸른 예복과 금색 장식' },
  { id: 'skin_c_r15', name: '철쇄의 투사', hero: 'hero_berserker', sprite: 'c_r15', rarity: 'rare', source: 'common', desc: '광전사 레어 외형 — 두꺼운 갑옷과 철퇴' },
  { id: 'skin_c_r16', name: '설원의 야수전사', hero: 'hero_berserker', sprite: 'c_r16', rarity: 'rare', source: 'common', desc: '광전사 레어 외형 — 늑대 털 장식과 가죽 갑옷' },
  { id: 'skin_c_r17', name: '꽃바람의 순례자', hero: 'hero_druid', sprite: 'c_r17', rarity: 'rare', source: 'common', desc: '드루이드 레어 외형 — 꽃과 풀잎 장식' },
  { id: 'skin_c_r18', name: '여우불 숲지기', hero: 'hero_druid', sprite: 'c_r18', rarity: 'rare', source: 'common', desc: '드루이드 레어 외형 — 여우 귀와 주황색 망토' }
];
// 일반 스킨 시트(assets/commonskins.png) 좌표 [x,y,w,h] — 앞모습 1포즈 (좌우 반전만)
const COMMON_SKIN = { c_swordsman_1: [2, 0, 22, 22], c_gunner_1: [30, 0, 18, 22], c_mage_1: [56, 0, 18, 22], c_engineer_1: [82, 0, 18, 22], c_assassin_1: [107, 0, 20, 22], c_priest_1: [133, 0, 20, 22], c_berserker_1: [158, 0, 22, 22], c_druid_1: [184, 0, 22, 22], c_swordsman_2: [3, 22, 20, 22], c_gunner_2: [29, 22, 20, 22], c_mage_2: [54, 22, 22, 22], c_engineer_2: [82, 22, 18, 22], c_assassin_2: [106, 22, 22, 22], c_priest_2: [132, 22, 22, 22], c_berserker_2: [157, 22, 24, 22], c_druid_2: [184, 22, 22, 22], c_swordsman_3: [2, 44, 22, 22], c_gunner_3: [28, 44, 22, 22], c_mage_3: [54, 44, 22, 22], c_engineer_3: [81, 44, 20, 22], c_assassin_3: [105, 44, 24, 22], c_priest_3: [132, 44, 22, 22], c_berserker_3: [156, 44, 26, 22], c_druid_3: [183, 44, 24, 22], c_n01: [2, 70, 26, 22], c_n02: [56, 70, 26, 22], c_n03: [110, 70, 26, 22], c_n04: [164, 70, 26, 22], c_n05: [2, 94, 26, 22], c_n06: [56, 94, 26, 22], c_n07: [110, 94, 26, 22], c_n08: [164, 94, 26, 22], c_n09: [2, 118, 26, 22], c_n10: [56, 118, 26, 22], c_n11: [110, 118, 26, 22], c_n12: [164, 118, 26, 22], c_n13: [2, 142, 26, 22], c_n14: [56, 142, 26, 22], c_n15: [110, 142, 26, 22], c_n16: [164, 142, 26, 22], c_n17: [2, 166, 26, 22], c_n18: [56, 166, 26, 22], c_n19: [110, 166, 26, 22], c_n20: [164, 166, 26, 22], c_n21: [2, 190, 26, 22], c_n22: [56, 190, 26, 22], c_n23: [2, 214, 26, 22], c_n24: [56, 214, 26, 22], c_n25: [110, 214, 26, 22], c_n26: [164, 214, 26, 22], c_n27: [2, 238, 26, 22], c_n28: [56, 238, 26, 22], c_n29: [110, 238, 26, 22], c_n30: [164, 238, 26, 22], c_n31: [2, 262, 26, 22], c_n32: [56, 262, 26, 22], c_n33: [110, 262, 26, 22], c_n34: [164, 262, 26, 22], c_n35: [2, 286, 26, 22], c_n36: [56, 286, 26, 22], c_n37: [110, 286, 26, 22], c_n38: [164, 286, 26, 22], c_n39: [2, 310, 26, 22], c_n40: [56, 310, 26, 22], c_n41: [110, 310, 26, 22], c_n42: [164, 310, 26, 22], c_n43: [2, 334, 26, 22], c_n44: [56, 334, 26, 22], c_n45: [110, 334, 26, 22], c_n46: [164, 334, 26, 22], c_e01: [4, 359, 19, 22], c_e02: [33, 359, 17, 22], c_e03: [61, 359, 18, 22], c_e04: [88, 359, 19, 22], c_e05: [115, 359, 22, 22], c_e06: [144, 359, 20, 22], c_r01: [169, 359, 26, 22], c_r02: [2, 383, 23, 22], c_r03: [31, 383, 22, 22], c_r04: [58, 383, 23, 22], c_r05: [86, 383, 23, 22], c_r06: [115, 383, 22, 22], c_r07: [143, 383, 22, 22], c_r08: [172, 383, 19, 22], c_r09: [3, 407, 21, 22], c_r10: [31, 407, 21, 22], c_r11: [60, 407, 20, 22], c_r12: [88, 407, 20, 22], c_r13: [115, 407, 21, 22], c_r14: [143, 407, 22, 22], c_r15: [171, 407, 22, 22], c_r16: [3, 431, 22, 22], c_r17: [30, 431, 24, 22], c_r18: [58, 431, 23, 22] };
// 드루이드 스킨 시트(assets/druidskin.png) 스프라이트 좌표 [x,y,w,h] — 이미 인게임 크기로 구움
// 일반 스킨 걷기 프레임 (있는 스킨만): 이동 중 정지 ↔ 걷기 번갈아
const COMMON_WALK = { c_n01: [28, 70, 26, 22], c_n02: [82, 70, 26, 22], c_n03: [136, 70, 26, 22], c_n04: [190, 70, 26, 22], c_n05: [28, 94, 26, 22], c_n06: [82, 94, 26, 22], c_n07: [136, 94, 26, 22], c_n08: [190, 94, 26, 22], c_n09: [28, 118, 26, 22], c_n10: [82, 118, 26, 22], c_n11: [136, 118, 26, 22], c_n12: [190, 118, 26, 22], c_n13: [28, 142, 26, 22], c_n14: [82, 142, 26, 22], c_n15: [136, 142, 26, 22], c_n16: [190, 142, 26, 22], c_n17: [28, 166, 26, 22], c_n18: [82, 166, 26, 22], c_n19: [136, 166, 26, 22], c_n20: [190, 166, 26, 22], c_n21: [28, 190, 26, 22], c_n22: [82, 190, 26, 22], c_n23: [28, 214, 26, 22], c_n24: [82, 214, 26, 22], c_n25: [136, 214, 26, 22], c_n26: [190, 214, 26, 22], c_n27: [28, 238, 26, 22], c_n28: [82, 238, 26, 22], c_n29: [136, 238, 26, 22], c_n30: [190, 238, 26, 22], c_n31: [28, 262, 26, 22], c_n32: [82, 262, 26, 22], c_n33: [136, 262, 26, 22], c_n34: [190, 262, 26, 22], c_n35: [28, 286, 26, 22], c_n36: [82, 286, 26, 22], c_n37: [136, 286, 26, 22], c_n38: [190, 286, 26, 22], c_n39: [28, 310, 26, 22], c_n40: [82, 310, 26, 22], c_n41: [136, 310, 26, 22], c_n42: [190, 310, 26, 22], c_n43: [28, 334, 26, 22], c_n44: [82, 334, 26, 22], c_n45: [136, 334, 26, 22], c_n46: [190, 334, 26, 22] };
// 스킨 등급 표시 (스킨창·뽑기 결과)
const SKIN_RARITY = { common: { name: '일반', color: '#a8bccf' }, rare: { name: '레어', color: '#5aa8ff' }, epic: { name: '에픽', color: '#c58aff' }, legendary: { name: '전설', color: '#ffd84a' }, unique: { name: '고유', color: '#9ae8d8' } };
const DRUID_SKIN = { bandi_down: [0, 13, 32, 27], bandi_up: [33, 14, 22, 26], bandi_side: [56, 14, 24, 26], sam_idle: [243, 0, 62, 40], sam_atk: [306, 14, 49, 26], sam_down: [356, 1, 61, 48], sam_down_a1: [418, 1, 61, 48], sam_down_a2: [480, 1, 61, 48], sam_down_a3: [542, 1, 61, 48], sam_up: [604, 0, 63, 49], sam_up_a1: [668, 0, 63, 49], sam_up_a2: [732, 0, 63, 49], sam_up_a3: [796, 0, 63, 49] };
// 반디 걷기: 방향별 걷기 2프레임 — 이동 중 [걷기1, 서기, 걷기2, 서기] 순환 (앞뒤는 발을 위아래로 드는 방식)
const BANDI_WALK = { bandi_down: [[81, 13, 32, 27], [114, 13, 32, 27]], bandi_up: [[147, 14, 22, 26], [170, 14, 22, 26]], bandi_side: [[193, 14, 24, 26], [218, 14, 24, 26]] };
// 전설 스킨 시트 매핑: sprite 이름 → 스킨 번호. assets/legskins.png = 3열(걷기 프레임) × (스킨×3방향)행
//  행 = 스킨*3 + 방향(0=앞/아래, 1=뒤/위, 2=옆) · 셀은 이미 인게임 크기로 구워둠(저해상도 청키) → 런타임은 1:1 drawImage
const LEG_SKINS = { leg_abyss: 0, leg_crimson: 1, leg_void: 2, leg_star: 3, u_unrecorded: 4, u_first_explorer: 5, u_primordial: 6, leg_admiral: 7, leg_berserker: 8 }; // 4~6: 고유 스킨 (셀 32×36, 전설 22×27은 가운데·아래 맞춤)
const LEG_SHEET = { cellW: 32, cellH: 36, frames: 4, dirs: 3 }; // 열 0~2: 걷기, 열 3: 정지(옆은 다리 모음)
// 선물 코드: 글자 그대로 두지 않고 해시로만 보관 (giftHash) — 코드 하나에 보상 하나, 계정마다 한 번
const GIFT_CODES = [
  { hash: 'd6b73fd4', skin: 'skin_flamewitch' },
  { hash: 'ca1080ea', skin: 'skin_redgunner' },
  { hash: '8b67ec', skin: 'skin_silverelf' },
  { hash: '30fbc0b', skin: 'skin_bandi' } // FireFly
];
function giftHash(code) { let h = 0x811c9dc5; for (const ch of 'pd_gift:' + String(code).toUpperCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); }
function skinsForMenu(save) { const owned = save && Array.isArray(save.skins) ? save.skins : []; return SKINS.filter((k) => (k.source !== 'code' && k.rarity !== 'unique') || owned.includes(k.id)); } // 코드·고유 스킨만 보유해야 목록에 나옴 — 일반·레어·에픽은 미획득(🔒)으로도 보임 ([사용자 결정])
// ── 스킨 뽑기 [사용자 결정] 재화=결정석, 1뽑/5뽑. 5%로 배너 스킨 "전설 조각" → 20개 모으면 스킨 완성. 나머지는 스킨 마일리지. 마일리지 상점 별도
const GACHA = {
  costSingle: 300, cost5: 1500,           // 결정석 비용 (1뽑 300, 5뽑 1500)
  legendRate: 0.01,                        // 전설 스킨 완성품 1% (보유 중이면 마일리지)
  shardRate: 0.04, shardsNeeded: 20,       // [사용자 결정] 전설 조각 4%, 20개 = 스킨 완성
  epicRate: 0.05, rareRate: 0.15, commonRate: 0.35, // [사용자 결정] 에픽 5%(기존 3단계) · 레어 15%(기존 1·2단계) · 일반 35%(새 22종) · 나머지 40% = 탐험 보급품
  dupeMileage: 250, shardDupeMileage: 12, commonDupeMileage: 15, rareDupeMileage: 30, epicDupeMileage: 60, // [사용자 결정] 마일리지는 스킨 중복일 때만: 완성품 중복 250 · 보유 스킨 조각 12 · 일반 스킨 중복 15
  shopPrice: 500,                          // [사용자 결정] 마일리지 상점 전설 스킨 1개 가격 (400 → 500)
  shopPrices: { legendary: 500, epic: 200, rare: 100, common: 50 }, // [사용자 결정] 마일리지 상점: 모든 뽑기 스킨 판매 (등급별 가격 = 중복 마일리지의 약 3.3배)
  mileageName: '스킨 마일리지', mileageColor: '#ffb0d8', shardName: '전설 조각', shardColor: '#ffe9a0',
  bannerFocus: { abyss: 0.56, crimson: 0.62, void: 0.66, star: 0.55, admiral: 0.68, dragonslayer: 0.66 }, // 메인 배너: 캐릭터가 있는 가로 위치(0~1) — 좁은 화면에 맞춰 자를 때 이쪽을 살림
  banners: { skin_leg_abyss: 'abyss', skin_leg_crimson: 'crimson', skin_leg_void: 'void', skin_leg_star: 'star', skin_leg_admiral: 'admiral', skin_leg_berserker: 'dragonslayer' } // 스킨별 배너 이미지 키 (assets/banners/<key>.webp)
};
function gachaPool() { return SKINS.filter((k) => k.source === 'gacha'); } // 전설 배너 뽑기 대상
const SHOP_TABS = [['legendary', '전설'], ['epic', '에픽'], ['rare', '레어'], ['common', '일반']]; // 마일리지 상점 탭
function shopPool(r) { return r === 'legendary' ? gachaPool() : SKINS.filter((k) => k.source === 'common' && (k.rarity || 'common') === r); } // 등급별 상점 목록
function shopPrice(K) { return (GACHA.shopPrices && GACHA.shopPrices[K.rarity || 'common']) || GACHA.shopPrice; }
function commonPool(r = 'common') { return SKINS.filter((k) => k.source === 'common' && (k.rarity || 'common') === r); } // 등급별 뽑기 풀 (common / rare / epic)
function skinsForHero(save, heroId) { return skinsForMenu(save).filter((k) => k.hero === heroId); } // 스킨창: 직업별 페이지
function skinKey(K) { return K.line ? K.hero + '|' + K.line : K.hero; } /* 장착 칸: 직업·계열마다 하나 (마도사 불·빛 스킨을 따로 켜 둘 수 있게) */
function skinAllowed(sp, heroId, lineId) { return SKINS.some((k) => k.sprite === sp && k.hero === heroId && (!k.line || k.line === lineId)); } /* [사용자 결정] 스킨은 정해진 갈래일 때만 (불꽃 마녀 = 불 마도사 · 붉은 머리 총잡이 = 속사 사수) */
function skinSpriteOk(sp) { return SKINS.some((k) => k.sprite === sp) ? sp : null; } /* 멀티로 받은 외형 이름은 아는 스킨만 */
