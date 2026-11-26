// 보스전 측정: 보스별 처치 시간, 사망률, 패턴별 받은 피해
// 해당 월드 진행도에 맞는 무기 2개와 버프를 들고 보스방에서 시작
// 사용: node tools/boss.js [보스당 횟수=8]   · HEROES=all: 모든 직업 · FROM_W/DEEP: 측정할 월드 범위 (예: 태고룡 = FROM_W=49 DEEP=40)
const { chromium } = require('playwright');
const path = require('path');
const RUNS = +(process.argv[2] || 8);

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 512, height: 288 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('file://' + (process.env.FILE || path.resolve(__dirname, '../index.html')) + '?guest=1');
  await pg.waitForTimeout(300);
  await pg.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  if (process.env.FROM_W) await pg.evaluate((w) => { window.__fromW = w; }, process.env.FROM_W);
  if (process.env.DEEP) await pg.evaluate((d) => { window.__deep = d; }, process.env.DEEP);
  if (process.env.POWER) await pg.evaluate(() => { window.__power = true; });
  if (process.env.HEROES === 'all') await pg.evaluate(() => { window.__allHeroes = true; }); // 직업 전체를 번갈아 (기본: 앞 4직업) // 심층 필드 수만큼 추가 측정
  const out = await pg.evaluate(async (RUNS) => {
    const g = window.__game; g.render = () => {};
    // 피해 출처 추적
    let cur = null, src = null;
    const origUpdateEnemy = window.updateEnemy;
    window.updateEnemy = (e, dt, w) => { cur = e.def.boss ? (e.pat ? e.pat.type : 'contact') + '·' + (e.phase || 1) : '졸개'; origUpdateEnemy(e, dt, w); cur = null; };
    const origShoot = Game.prototype.enemyShoot;
    Game.prototype.enemyShoot = function (...a) { origShoot.apply(this, a); this.enemyBullets[this.enemyBullets.length - 1].tag = cur; };
    const origBullet = EnemyBullet.prototype.update;
    EnemyBullet.prototype.update = function (dt, w) { src = this.tag || '탄'; origBullet.call(this, dt, w); src = null; };
    const origHz = Hazard.prototype.update;
    Hazard.prototype.update = function (dt, w) { src = 'zones'; origHz.call(this, dt, w); src = null; };
    let ledger = null;
    const origDP = Game.prototype.damagePlayer;
    Game.prototype.damagePlayer = function (a) { const p = this.player, h0 = p.hp + p.shield; const r = origDP.call(this, a); if (r && ledger) { const k = src || cur || '기타'; ledger[k] = (ledger[k] || 0) + (h0 - p.hp - p.shield); } return r; };

    const pickW = (rar) => pick(DATA_WEAPONS.filter((d) => rar.includes(d.rarity)));
    const LOAD = [[['uncommon'], ['uncommon', 'rare']], [['rare'], ['rare', 'epic']], [['rare', 'epic'], ['epic']], [['epic'], ['epic']]];
    const res = [];
    for (let w = +(window.__fromW || 0); w < DATA_WORLDS.length + (+window.__deep || 0); w++) for (let run = 0; run < RUNS; run++) {
      g.save.unlocked = DATA_HEROES.map((h) => h.id); g.save.selected = DATA_HEROES[run % (window.__allHeroes ? DATA_HEROES.length : 4)].id; g.save.loadout = null;
      g.startRun(); g.worldIdx = w; g.levelIdx = STAGES_PER_WORLD - 1; g.loadStage(); g.banner = null;
      const p = g.player;
      p.weapons = LOAD[Math.min(w, LOAD.length - 1)].map((r) => new WeaponInstance(pickW(r))); p.slot = 0;
      for (const bf of shuffled(DATA_BUFFS).slice(0, w)) bf.apply(p);
      p.maxHp += 15 * w; p.hp = p.maxHp; // 층이 늘어 더 많이 파밍한 상태를 근사
      if (window.__power) { // POWER=1: 무기 강화·직업 진화·보구까지 갖춘 플레이어를 흉내
        for (const wi of p.weapons) wi.lv = Math.min(5, Math.floor(w / 2));
        const L = jobLines(p.hero.id)[0]; if (L) { g.applyVariant(L); p.weapons = LOAD[Math.min(w, LOAD.length - 1)].map((r) => new WeaponInstance(pickW(r), Math.min(5, Math.floor(w / 2)))); g.setJob(p, L, w >= 9 ? 2 : w >= 4 ? 1 : 0); }
        if (w >= 9) { p.treasure = DATA_TREASURES[run % DATA_TREASURES.length]; p.treasureCd = 0; }
      }
      const room = g.map.roomOf('boss'), c = g.map.tileCenter(room.cx, room.cy + 5);
      p.x = c.x; p.y = c.y;
      ledger = {};
      const st = Bot.newState(); let t = 0, boss = null, enrageAt = null;
      while (t < 60 * 180) {
        if (g.overlay) break;
        Bot.step(g, st); t++;
        if (window.__power && p.treasure && p.treasureCd <= 0 && boss && boss.targetable && Math.hypot(boss.x - p.x, boss.y - p.y) < 220) g.useTreasure(); // 보구는 쿨타임마다 보스에게
        boss = boss || g.enemies.find((e) => e.def.boss);
        if (boss && boss.phase >= 2 && enrageAt === null) enrageAt = t / 60;
        if (p.state === 'DEAD' || (boss && !boss.alive)) break;
        if (t % 1200 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      if (boss && boss.alive && p.state !== 'DEAD') window.__timeouts = (window.__timeouts || []).concat([{ boss: boss.def.id, state: boss.state, pat: boss.pat && boss.pat.type, hp: Math.round(boss.hp / boss.maxHp * 100),
        inWall: overlapsSolid(boss.x, boss.y, boss.half - 0.5, g.map), bossInRoom: g.map.roomAtPoint(boss.x, boss.y) === room, playerInRoom: g.map.roomAtPoint(p.x, p.y) === room,
        dist: Math.round(Math.hypot(boss.x - p.x, boss.y - p.y)), weapons: p.weapons.map((x) => x.def.id), energy: Math.round(p.energy), los: hasLineOfSight(p, boss, g.map), fade: boss.fade, jumpH: boss.jumpH }]);
      res.push({ boss: boss ? boss.def.name : '?', world: w, hero: p.hero.name, won: !!(boss && !boss.alive), died: p.state === 'DEAD',
        time: t / 60, enrageAt, bossHpLeft: boss ? Math.max(0, boss.hp / boss.maxHp) : 1, ledger, weapons: p.weapons.map((x) => x.def.name).join('+') });
      g.overlay = null;
    }
    return res;
  }, RUNS);
  const to = await pg.evaluate(() => window.__timeouts || []); if (to.length) console.log('TIMEOUTS', JSON.stringify(to));
  for (let w = 0; w < 200; w++) { // (심층 포함)
    const r = out.filter((x) => x.world === w); if (!r.length) continue;
    const won = r.filter((x) => x.won), died = r.filter((x) => x.died);
    const led = {}; let tot = 0;
    for (const x of r) for (const [k, v] of Object.entries(x.ledger)) { led[k] = (led[k] || 0) + v; tot += v; }
    const avg = (a, f) => (a.length ? (a.reduce((s, x) => s + f(x), 0) / a.length).toFixed(1) : '-');
    console.log(`\n[${r[0].boss}] 승리 ${won.length}/${r.length}  사망 ${died.length}  처치시간(승리) ${avg(won, (x) => x.time)}초  2페이즈 진입 ${avg(r.filter((x) => x.enrageAt), (x) => x.enrageAt)}초  패배 시 남은 보스체력 ${avg(died, (x) => x.bossHpLeft * 100)}%`);
    console.log('  받은 피해 비중: ' + Object.entries(led).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / tot * 100).toFixed(0)}%`).join(' · ') + `  (판당 ${(tot / r.length).toFixed(0)})`);
  }
  if (process.env.HEROES === 'all') { // 직업별: 승률 · 처치 시간 · 패배 시 남은 보스 체력
    const H = {}; for (const x of out) (H[x.hero] = H[x.hero] || []).push(x);
    console.log('\n직업별:'); for (const [h, r] of Object.entries(H)) { const won = r.filter((x) => x.won), lost = r.filter((x) => !x.won);
      console.log(`  ${h.padEnd(8)} 승리 ${won.length}/${r.length}  처치 ${won.length ? (won.reduce((s, x) => s + x.time, 0) / won.length).toFixed(0) + '초' : '-'}  패배 시 보스 체력 ${lost.length ? Math.round(lost.reduce((s, x) => s + x.bossHpLeft, 0) / lost.length * 100) + '%' : '-'}`); }
  }
  if (errs.length) console.log('ERR', errs.slice(0, 3));
  await b.close();
})();
