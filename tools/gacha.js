// 뽑기 전체 점검: 비용 · 확률 · 전설(완성품/조각/중복/환급) · 일반·레어·에픽 · 보급품 · 마일리지 상점 · 컷신 · 저장 · 실제 클릭 흐름
const { chromium } = require('playwright'); const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
const OUT = require('os').tmpdir() + '/';
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); c ? pass++ : fail++; };
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1024, height: 576 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(300);
  // 계정 만들어 로그인 (저장 확인용)
  await pg.click('#lg-new'); await pg.fill('#lg-name', 'GachaTest'); await pg.fill('#lg-pin', '1234'); await pg.click('#lg-ok'); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !!(window.__game.profile && !window.__game.locked)), '테스트 계정 로그인');

  // ── 1) 로직 점검 (Math.random 고정)
  const R = await pg.evaluate(() => {
    const g = window.__game, sv = g.save, out = {}, ban = 'skin_leg_abyss', K = SKINS.find((k) => k.id === ban);
    const roll = (v, n = 1) => { const o = Math.random; Math.random = () => v; try { return g.gachaPull(ban, n); } finally { Math.random = o; } };
    const reset = () => { sv.skins = []; sv.shards = {}; sv.mileage = 0; sv.supplyStash = {}; sv.legIntroSeen = []; sv.skinOn = {}; g.legendIntro = null; };
    reset();
    // 비용
    sv.bank = 299; out.poor1 = g.gachaPull(ban, 1).error; out.poorBank = sv.bank;
    sv.bank = 1499; out.poor5 = g.gachaPull(ban, 5).error;
    sv.bank = 10000; roll(0.9); out.cost1 = 10000 - sv.bank; const b0 = sv.bank; roll(0.9, 5); out.cost5 = b0 - sv.bank;
    out.badBanner = g.gachaPull('nope', 1).error;
    // 보급품
    reset(); sv.bank = 1e6; const r1 = roll(0.9); out.supplyType = r1.results[0].type; out.stashTotal = Object.values(sv.supplyStash).reduce((a, b) => a + b, 0);
    // 전설 완성품 (처음) → 보유·자동 장착(계열 칸)·컷신 예약
    reset(); sv.bank = 1e6; sv.shards[ban] = 5; const r2 = roll(0.005);
    out.legType = r2.results[0].type; out.legOwned = sv.skins.includes(ban); out.legEquipKey = g.skinOnMap()['hero_swordsman|sword'];
    out.legRefund = r2.results[0].refund; out.mileAfterRefund = sv.mileage; out.shardsLeft = sv.shards[ban];
    out.introQueued = !!(g.legendIntro && g.legendIntro.K && g.legendIntro.K.id === ban);
    // 전설 중복 → 250, 컷신 다시 안 나옴
    g.legendIntro = null; const m0 = sv.mileage; const r3 = roll(0.005); out.dupType = r3.results[0].type; out.dupMile = sv.mileage - m0; out.introAgain = !!g.legendIntro;
    // 조각: 미보유 19 → 20번째에 완성
    reset(); sv.bank = 1e6; for (let i = 0; i < 19; i++) roll(0.02); out.shard19 = sv.shards[ban]; out.ownedAt19 = sv.skins.includes(ban);
    const r4 = roll(0.02); out.shard20Type = r4.results[0].type; out.ownedAt20 = sv.skins.includes(ban); out.shardsAfter = sv.shards[ban] || 0; out.introFromShards = !!(g.legendIntro && g.legendIntro.K);
    // 보유 중 조각 → shardDupe +12
    g.legendIntro = null; const m1 = sv.mileage; const r5 = roll(0.02); out.shardDupeType = r5.results[0].type; out.shardDupeMile = sv.mileage - m1;
    // 등급 구간: 에픽(0.05~0.10) 레어(0.10~0.25) 일반(0.25~0.60)
    const tierOf = (v) => { const r = roll(v).results[0]; const S = SKINS.find((k) => k.id === r.id); return S && S.rarity; };
    reset(); sv.bank = 1e7; out.tierEpic = tierOf(0.07); out.tierRare = tierOf(0.2); out.tierCommon = tierOf(0.5); out.tierSupply = roll(0.61).results[0].type;
    // 아직 없는 스킨부터: 에픽 8번 → 8종 모두 다름, 9번째부터 중복 +60
    reset(); sv.bank = 1e7; const ep = [], NE = commonPool('epic').length; for (let i = 0; i < NE; i++) { const r = roll(0.07).results[0]; ep.push(r.id + ':' + r.type); }
    out.epicUnique = new Set(ep.map((x) => x.split(':')[0])).size; out.epicN = NE; out.epicAllNew = ep.every((x) => x.endsWith(':common'));
    const m2 = sv.mileage; const r6 = roll(0.07).results[0]; out.epicDupType = r6.type; out.epicDupMile = sv.mileage - m2;
    for (let i = 0; i < commonPool('rare').length; i++) roll(0.2); const m3 = sv.mileage; roll(0.2); out.rareDupMile = sv.mileage - m3;
    for (let i = 0; i < commonPool('common').length; i++) roll(0.5); const m4 = sv.mileage; roll(0.5); out.commonDupMile = sv.mileage - m4;
    out.notAutoEquip = !Object.values(g.skinOnMap()).some((id) => (SKINS.find((k) => k.id === id) || {}).source === 'common');
    // 마일리지 상점
    reset(); sv.mileage = GACHA.shopPrices.legendary - 1; out.shopPoor = g.buyMileageSkin('skin_leg_void').error;
    { const tiers = []; for (const r of ['epic', 'rare', 'common']) { const K = shopPool(r)[0]; sv.mileage = 1000; const res = g.buyMileageSkin(K.id); if (res.ok && sv.skins.includes(K.id)) tiers.push(r + ':' + (1000 - sv.mileage)); } out.shopTiers = tiers.join(','); }
    sv.mileage = GACHA.shopPrices.legendary; const bs = g.buyMileageSkin('skin_leg_void'); out.shopOk = !!bs.ok && sv.skins.includes('skin_leg_void') && sv.mileage === 0;
    out.shopIntro = !!(g.legendIntro && g.legendIntro.K && g.legendIntro.K.id === 'skin_leg_void'); g.legendIntro = null;
    sv.mileage = 400; out.shopOwned = g.buyMileageSkin('skin_leg_void').error;
    // 5뽑에서 전설 2개 → 컷신 차례로 (다른 배너 스킨은 각 배너에서만 나오므로 같은 배너 중복은 1번만)
    // 확률 (5만 회)
    reset(); sv.bank = 1e9; const c = {}; const N = 10000; for (let i = 0; i < N; i++) for (const r of g.gachaPull(ban, 5).results) { const S = SKINS.find((k) => k.id === r.id); const key = r.type === 'supply' ? 'supply' : r.type === 'shard' || r.type === 'shardDupe' ? 'shard' : S.rarity; c[key] = (c[key] || 0) + 1; }
    out.rates = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / (N * 5) * 100).toFixed(2)]));
    // 보급품 사용: 탐험 시작 시 종류별 1개씩
    reset(); sv.supplyStash = { s_purse: 3, s_mana: 1 }; out.stashBefore = JSON.stringify(sv.supplyStash);
    return out;
  });
  ok(R.poor1 === '결정석이 부족합니다' && R.poorBank === 299, '결정석 부족하면 뽑기 안 되고 결정석 그대로');
  ok(R.poor5 === '결정석이 부족합니다', '5뽑 결정석 부족 거부');
  ok(R.cost1 === 300 && R.cost5 === 1500, `비용: 1뽑 ${R.cost1} · 5뽑 ${R.cost5}`);
  ok(!!R.badBanner, '없는 배너 거부');
  ok(R.supplyType === 'supply' && R.stashTotal === 1, '보급품 → 보관함 +1');
  ok(R.legType === 'skin' && R.legOwned, '전설 완성품 → 스킨 획득');
  ok(R.legEquipKey === 'skin_leg_abyss', '전설 스킨 자동 장착 (검사 계열 칸)');
  ok(R.legRefund === 60 && R.mileAfterRefund === 60 && !R.shardsLeft, `모아 둔 조각 5개 → 마일리지 ${R.legRefund} 환급, 조각 비움`);
  ok(R.introQueued, '처음 얻은 전설 → 컷신 예약');
  ok(R.dupType === 'dupe' && R.dupMile === 250 && !R.introAgain, `전설 중복 → +${R.dupMile} 마일리지, 컷신 다시 안 나옴`);
  ok(R.shard19 === 19 && !R.ownedAt19, '조각 19개: 아직 미완성');
  ok(R.shard20Type === 'skin' && R.ownedAt20 && R.shardsAfter === 0 && R.introFromShards, '조각 20개째 → 스킨 완성 + 컷신, 조각 0');
  ok(R.shardDupeType === 'shardDupe' && R.shardDupeMile === 12, '보유 스킨의 조각 → +12 마일리지 (완성품 아님)');
  ok(R.tierEpic === 'epic' && R.tierRare === 'rare' && R.tierCommon === 'common' && R.tierSupply === 'supply', '구간별 등급: 에픽 / 레어 / 일반 / 보급품');
  ok(R.epicUnique === R.epicN && R.epicAllNew, `에픽 ${R.epicN}번 → ${R.epicN}종 모두 새 스킨 (없는 것부터)`);
  ok(R.epicDupType === 'dupe' && R.epicDupMile === 60, '에픽 다 모은 뒤 → 중복 +60');
  ok(R.rareDupMile === 30 && R.commonDupMile === 15, `레어 중복 +${R.rareDupMile} · 일반 중복 +${R.commonDupMile}`);
  ok(R.notAutoEquip, '일반·레어·에픽은 자동 장착 안 함');
  ok(/^마일리지가 부족합니다/.test(R.shopPoor || '') && R.shopOk && R.shopIntro && R.shopOwned === '이미 보유한 스킨입니다', '마일리지 상점: 부족 거부 · 전설 500에 구매 · 컷신 · 보유 중 거부');
  ok(R.shopTiers === 'epic:200,rare:100,common:50', `마일리지 상점: 일반·레어·에픽도 판매 (${R.shopTiers})`);
  const T = { legendary: 1, shard: 4, epic: 5, rare: 15, common: 35, supply: 40 };
  ok(Object.entries(T).every(([k, v]) => Math.abs((R.rates[k] || 0) - v) < (v < 5 ? 0.4 : 1.0)), '5만 회 실제 비율: ' + Object.entries(T).map(([k, v]) => `${k} ${R.rates[k]}%(설정 ${v}%)`).join(' · '));

  // ── 2) 보급품 사용 (탐험 시작)
  const S = await pg.evaluate(() => { const g = window.__game; g.startRun(); const st = JSON.stringify(g.save.supplyStash); const gold = g.gold; g.enterLobby(); return { st, gold }; });
  ok(S.st === '{"s_purse":2}' && S.gold >= 80, `탐험 시작: 보급품 종류별 1개씩 사용 (남은 보관함 ${S.st})`);

  // ── 3) 저장: 새로고침 뒤에도 유지
  const before = await pg.evaluate(() => { const g = window.__game; g.save.skins = ['skin_c_n01', 'skin_leg_star']; g.save.mileage = 123; g.save.legIntroSeen = ['skin_leg_star']; writeSave(g.save); return { skins: g.save.skins.length, mile: g.save.mileage, seen: g.save.legIntroSeen.length }; });
  await pg.reload(); await pg.waitForTimeout(300); await pg.keyboard.press('Enter'); await pg.waitForTimeout(200); if (await pg.locator('#lg-pin').isVisible()) { await pg.fill('#lg-pin', '1234'); await pg.waitForTimeout(100); if (await pg.locator('#lg-pin').isVisible()) await pg.keyboard.press('Enter'); } await pg.waitForTimeout(400);
  const after = await pg.evaluate(() => { const g = window.__game; return { skins: g.save.skins.length, mile: g.save.mileage, seen: (g.save.legIntroSeen || []).length, locked: g.locked }; });
  ok(!after.locked && after.skins === before.skins && after.mile === before.mile && after.seen === before.seen, `새로고침 후 저장 유지 (스킨 ${after.skins}개 · 마일리지 ${after.mile} · 본 컷신 ${after.seen})`);

  // ── 4) 실제 화면 흐름 (진짜 키보드·마우스)
  const box = await pg.evaluate(() => { const c = window.__game.canvas.getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; });
  const k = box.w / 512; const click = async (r) => { await pg.mouse.click(box.x + (r.x + r.w / 2) * k, box.y + (r.y + r.h / 2) * k); await pg.waitForTimeout(150); };
  await pg.evaluate(() => { const g = window.__game; g.enterLobby(); g.overlay = null; g.banner = null; g.save.bank = 5000; g.save.skins = []; g.save.legIntroSeen = []; g.save.shards = {}; });
  await pg.waitForTimeout(200); await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); await pg.keyboard.press('KeyJ'); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => (window.__game.overlay || {}).type === 'gacha'), 'Esc → J 로 뽑기 창 열림');
  await click(await pg.evaluate(() => HUD.gachaBanner(2))); ok(await pg.evaluate(() => window.__game.overlay.banner === 2), '사이드바 클릭 → 3번째 배너(공허의 마도사) 선택');
  await click(await pg.evaluate(() => HUD.gachaPullBtn(1)));
  const ui1 = await pg.evaluate(() => { const g = window.__game, o = g.overlay; return { n: o.results && o.results.length, bank: g.save.bank }; });
  ok(ui1.n === 5 && ui1.bank === 3500, `5뽑 버튼 클릭 → 결과 5장 · 결정석 5000 → ${ui1.bank}`);
  ok(await pg.evaluate(() => !!window.__game.overlay.anim), '뽑기 연출 시작 (소환진 → 카드 뒤집기)');
  await click({ x: 250, y: 140, w: 4, h: 4 }); ok(await pg.evaluate(() => !window.__game.overlay.anim && !!window.__game.overlay.results), '연출 중 클릭 → 건너뛰고 결과');
  await pg.screenshot({ path: OUT + 'g_result.png' });
  await click({ x: 250, y: 140, w: 4, h: 4 }); ok(await pg.evaluate(() => !window.__game.overlay.results), '결과 화면 클릭 → 닫힘');
  await click(await pg.evaluate(() => HUD.gachaRatesBtn())); ok(await pg.evaluate(() => !!window.__game.overlay.rates), '확률 보기 열림');
  await click({ x: 250, y: 140, w: 4, h: 4 }); ok(await pg.evaluate(() => !window.__game.overlay.rates), '확률 보기 닫힘');
  // 전설 당첨을 실제 버튼으로: 컷신 → 클릭 2번으로 닫힘 → 결과 화면
  await pg.evaluate(() => { window.__rnd = Math.random; Math.random = () => 0.005; });
  await click(await pg.evaluate(() => HUD.gachaPullBtn(0)));
  await pg.evaluate(() => { Math.random = window.__rnd; });
  ok(await pg.evaluate(() => !window.__game.legendIntro && !!window.__game.overlay.anim && window.__game.overlay.anim.best === 5), '전설 당첨: 컷신은 뽑기 연출이 끝난 뒤로 미룸');
  await pg.waitForTimeout(3200); // 연출이 저절로 끝날 때까지
  ok(await pg.evaluate(() => !!(window.__game.legendIntro && window.__game.legendIntro.K && window.__game.legendIntro.K.id === 'skin_leg_void')), '1뽑 버튼으로 전설 당첨 → 연출 뒤 컷신 시작');
  await pg.waitForTimeout(1500); await pg.screenshot({ path: OUT + 'g_intro.png' });
  await click({ x: 250, y: 140, w: 4, h: 4 }); await click({ x: 250, y: 140, w: 4, h: 4 });
  ok(await pg.evaluate(() => !window.__game.legendIntro && (window.__game.overlay.results || [])[0].type === 'skin'), '컷신 클릭 두 번(건너뛰기 → 닫기) → 결과 화면 (완성 획득)');
  await click({ x: 250, y: 140, w: 4, h: 4 });
  await click(await pg.evaluate(() => HUD.gachaShopTab())); ok(await pg.evaluate(() => window.__game.overlay.tab === 1), '마일리지 상점 탭 열림');
  await pg.screenshot({ path: OUT + 'g_shop.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); ok(await pg.evaluate(() => (window.__game.overlay || {}).type === 'pause'), 'Esc 메뉴에서 연 뽑기 창: Esc → Esc 메뉴로 돌아감'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  // 지하 무기고 제단으로도 열림
  const shr = await pg.evaluate(() => { const g = window.__game; g.enterVault(); const s = g.props.find((p) => p.constructor.name === 'GachaShrine'); g.player.x = s.x - 18; g.player.y = s.y + 8; return true; });
  await pg.waitForTimeout(200); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => (window.__game.overlay || {}).type === 'gacha'), '지하 무기고 소환 제단 [E] → 뽑기 창');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); ok(await pg.evaluate(() => !window.__game.overlay), '제단에서 연 뽑기 창: Esc → 바로 닫힘');
  ok(errs.length === 0, '페이지 오류 없음' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(`\n결과: ${pass}개 통과 · ${fail}개 실패`); if (fail) process.exitCode = 1;
  await b.close();
})();
