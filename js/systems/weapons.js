'use strict';
// ════════════════════════════════════════════
// 무기 시스템
// ════════════════════════════════════════════
// 강화 단계만큼 공격력 보너스를 더한 피해 계산용 수치 (치명타 보너스 무기 포함)
function upgradeMult(lv) { const U = BALANCE.upgrade; return 1 + U.perLevel * lv + (U.curve || 0) * lv * lv; } // 강화 단계별 피해 배율
function weaponMods(player, w) {
  const def = w.def, m = Object.assign({}, player.mods);
  m.damageMult = (Number.isFinite(m.damageMult) ? m.damageMult : 1) * upgradeMult(w.lv || 0); // 강화: 다른 보너스에 묻히지 않게 따로 곱함
  if (def.critBonus) m.critChance = player.stats.critChance + def.critBonus;
  return m;
}
/* 사수 3진 스킬(탄환의 폭풍) 중: 총알이 2발씩 나란히 나감 */
function odDouble(player) { return player.overdrive > 0 && player.odDouble; }
function weaponTitle(w) { return w.def.name + (w.lv ? ` +${w.lv}` : ''); }
class WeaponInstance {
  /* [사용자 결정] 기본 무기 +10강 각성: def를 읽으면 각성 능력이 더해진 정의를 돌려줌 (같은 무기는 같은 객체를 써서 비교도 그대로) */
  get def() { const b = this.base; if (b && b.awaken && this.lv >= BALANCE.upgrade.maxLevel) return b._awakened || (b._awakened = (() => { const a = Object.assign({}, b, b.awaken, { name: b.name + ' · 각성', awakened: true, awakenDesc: b.awaken.desc, desc: undefined }); const m = (BALANCE.awakenBonus || 1.1); if (typeof a.damage === 'number') a.damage = Math.round(a.damage * m); if (a.wave && typeof a.wave.damage === 'number') a.wave = Object.assign({}, a.wave, { damage: Math.round(a.wave.damage * m) }); if (a.slam && typeof a.slam.damage === 'number') a.slam = Object.assign({}, a.slam, { damage: Math.round(a.slam.damage * m) }); return a; })()); /* [사용자 결정] 각성 소폭 추가 강화: 피해 ×awakenBonus */ return b; }
  set def(v) { this.base = v; }
  constructor(def, lv = 0) { this.lv = lv; this.def = def; this.cooldown = 0; this.charge = 0; this.burstLeft = 0; this.burstTimer = 0; this.beamTick = 0; this.beamActive = false; this.beamEnd = null; }
}

class WeaponSystem {
  constructor(world) { this.world = world; this.noEnergyMsgT = 0; }
  noEnergy(player) {
    if (this.noEnergyMsgT <= 0) { this.world.effects.text(player.x, player.y - 18, '에너지 부족', '#7fb0ff'); this.noEnergyMsgT = 0.8; SFX.play('deny'); }
    this.world.noEnergyFlash = 0.4;
  }
  spend(player, cost) {
    if (player.overdrive > 0 || !cost) return true;
    cost *= 1 - (player.hero.energySave || 0); // 사수 패시브: 탄약 절약
    if (player.energy < cost) { this.noEnergy(player); return false; }
    player.energy -= cost; return true;
  }
  getFireRate(player, w) { return w.def.fireRate * (1 + player.stats.fireRateBonus + (player.overdrive > 0 ? 1 + (player.odRate || 0) : 0) + (player.solomon > 0 ? player.treasure.rate : 0)) * (w.def.spinUp ? 0.25 + 0.75 * Math.min(1, (w.spin || 0) / w.def.spinUp) : 1) * (player.feastPenaltyActive ? (player.feastPenaltyFactor || 0.6) : 1); }
  update(player, dt, input) {
    this.noEnergyMsgT = Math.max(0, this.noEnergyMsgT - dt);
    const w = player.weapon;
    for (const o of player.weapons) if (o !== w) { o.cooldown = Math.max(0, o.cooldown - dt); o.charge = 0; o.beamActive = false; o.burstLeft = 0; o.mpx = null; }
    for (const o of player.weapons) if (o.def.heat) { if (o.overheat > 0) o.overheat = Math.max(0, o.overheat - dt); else if (!(o === w && input.mouse.down)) o.heat = Math.max(0, (o.heat || 0) - o.def.heat.cool * dt); } // 과열: 쉬면 식음 (과열 중엔 잠김)
    if (!w) return;
    if (w.def.momentum) { if (w.mpx != null) w.run = Math.min(w.def.momentum.per * (w.def.momentum.max - 1), (w.run || 0) + Math.hypot(player.x - w.mpx, player.y - w.mpy)); w.mpx = player.x; w.mpy = player.y; } // 질주: 움직인 거리 쌓기
    w.cooldown = Math.max(w.cooldown - dt, -STEP);
    if (player.state === 'DEAD' || player.castLock > 0 || player.denyT > 0) { w.beamActive = false; w.charge = 0; return; } // 시전 중엔 공격 불가 (가레스의 부정 장판 안도)
    if (player.transformT > 0) { w.beamActive = false; w.charge = 0; w.burstLeft = 0; this.transformMelee(player, dt, input); return; } // [변신] 변신 중엔 무기 불가 → 강력한 근접 베기
    if ((input.wasPressed('KeyQ') || input.wasPressed('Wheel')) && player.weapons.length > 1) {
      w.charge = 0; w.beamActive = false; w.burstLeft = 0;
      player.slot = (player.slot + 1) % player.weapons.length;
      player.weapon.cooldown = Math.max(player.weapon.cooldown, 0.15);
      return;
    }
    if (w.burstLeft > 0) {
      w.burstTimer -= dt;
      if (w.burstTimer <= 0) { this.shootGun(player, w); w.burstLeft--; w.burstTimer = w.def.burst.interval; }
    }
    const down = input.mouse.down;
    if (w.def.spinUp) w.spin = down ? Math.min(w.def.spinUp, (w.spin || 0) + dt) : 0; // 회전 기관총: 누를수록 연사 증가
    switch (w.def.type) {
      case 'gun': if (down && w.cooldown <= 0 && w.burstLeft === 0) this.fireGun(player, w); break;
      case 'melee': if (down && w.cooldown <= 0) this.fireMelee(player, w); break;
      case 'charge':
        if (down) {
          if (w.cooldown <= 0) {
            if (w.charge === 0 && !this.canPay(player, w.def.energyCost)) this.weakAttack(player, w); // 에너지 부족: 약한 공격
            else w.charge = Math.min(w.def.chargeTime, w.charge + dt * (1 + player.stats.fireRateBonus + (player.overdrive > 0 ? 1 + (player.odRate || 0) : 0)));
          }
        } else if (w.charge > 0) this.releaseCharge(player, w);
        break;
      case 'beam': this.updateBeam(player, w, dt, down); break;
    }
    if (!down) w.cooldown = Math.max(w.cooldown, 0);
  }
  // [변신] 변신 중 근접 베기 — 무기 없이 강력한 범위 베기, 샘의 청록 이펙트
  transformMelee(player, dt, input) {
    const world = this.world;
    player.transCd = Math.max(0, (player.transCd || 0) - dt);
    if (!input.mouse.down || player.transCd > 0) return;
    const sk = player.transformSkill || 'bearform', base = { bearform: 58, bearform2: 76, primal: 108 }[sk] || 60;
    player.transCd = 0.3; // 베기 간격
    const a = Math.atan2(player.aim.y, player.aim.x), range = 52, arc = 2.0, dmg = world.skillDmg(base); // [변신 버프] 베기 사거리 40 → 52
    let hit = 0;
    for (const e of world.enemies) { if (!e.targetable) continue; const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
      if (d - e.radius <= range && (d < 6 || angleDiff(Math.atan2(dy, dx), a) < arc / 2)) { world.damageEnemy(e, { damage: dmg, mods: player.mods, knockback: 7 }, dx / (d || 1), dy / (d || 1)); hit++; } }
    if (sk === 'primal' && hit) player.hp = Math.min(player.maxHp, player.hp + hit * 3); // 원시: 베기 흡혈
    player.swing = { t: 0, dur: 0.16, ang: a, arc, thrust: false };
    // [변신 스킨] 반디/샘 스킨을 끼면 베기 이펙트를 샘 날개색(시안/아쿠아)으로
    const samSkin = world.skinSprite && world.skinSprite(player.hero.id) === 'druid_bandi';
    const c1 = samSkin ? '#5ef4ff' : '#9af0ff', c2 = samSkin ? 'rgba(170,240,255,0.85)' : 'rgba(200,180,255,0.75)'; // 샘: 일반 변신 베기와 동일하게, 색만 날개색(시안)으로
    world.effects.slash(player.x, player.y - 1, a, range, arc, c1);
    world.effects.slash(player.x, player.y - 1, a, range * 0.68, arc * 0.7, c2);
    world.addShake(0.06, 2); SFX.play('melee', 0.12);
  }
  canPay(player, cost) { return player.overdrive > 0 || !cost || player.energy >= cost * (1 - (player.hero.energySave || 0)); }
  // 에너지가 모자랄 때: 아주 약한 공격 (총·지팡이·활·광선은 작은 탄, 근접은 짧은 베기)
  weakAttack(player, w) {
    const world = this.world, A = BALANCE.weakAttack, a = Math.atan2(player.aim.y, player.aim.x), dmg = world.skillDmg(A.damage);
    w.cooldown = A.interval; this.noEnergy(player);
    if (w.def.type === 'melee') {
      for (const e of world.enemies) { if (!e.targetable) continue; const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
        if (d - e.radius <= 22 && (d < 4 || angleDiff(Math.atan2(dy, dx), a) < 0.9)) world.damageEnemy(e, { damage: dmg, mods: player.mods, knockback: 2 }, dx / (d || 1), dy / (d || 1)); }
      player.swing = { t: 0, dur: 0.14, ang: a, arc: 1.6, thrust: false }; world.effects.slash(player.x, player.y - 1, a, 20, 1.6, 'rgba(200,200,210,0.7)'); SFX.play('melee', 0.08);
    } else {
      world.projectiles.push(new Projectile({ x: player.x + player.aim.x * 8, y: player.y + player.aim.y * 8, dx: player.aim.x, dy: player.aim.y, speed: 300, range: 200,
        damage: dmg, pierce: 0, knockback: 1, mods: player.mods, color: '#c8c8d0', size: 1 }));
      SFX.play('magic', 0.08);
    }
  }
  // 덫 장비 한도: 종류별 sentry.max개 [사용자 결정: 덫마다 5개, 합산 제한 없음] — 넘으면 디아블로 2처럼 그 종류에서 가장 오래된 것을 없애고 새로 설치 (망자의 파수기(스킬)는 따로 셈)
  sentryMakeRoom(player, w) {
    const same = this.world.zones.filter((z) => z instanceof TrapSentry && z.alive && z.owner === player && z.def === w.def);
    while (same.length >= w.def.sentry.max) { const old = same.shift(); old.alive = false; this.world.effects.burst(old.x, old.y, '#8a94a4', 6); }
  }
  fireGun(player, w) {
    if (w.def.heat) { // 과열 개틀링: 에너지 대신 열 — 가득 차면 잠기며 주변에 열기 방출
      const H = w.def.heat; if (w.overheat > 0) return;
      w.cooldown += 1 / this.getFireRate(player, w); this.shootGun(player, w); w.heat = (w.heat || 0) + H.per;
      if (w.heat >= 100) { w.heat = 100; w.overheat = H.lock; const V = H.vent;
        this.world.explodeAt(player.x, player.y, V.r, { color: '#ff7a2a', hurtEnemies: true, src: { damage: V.damage, mods: weaponMods(player, w), knockback: 8, status: { type: 'burn', chance: 1, duration: 2, dps: 10 }, weaponId: w.def.id } });
        this.world.effects.text(player.x, player.y - 22, '과열!', '#ff7a2a'); SFX.play('explode', 0.1); }
      return; }
    if (!this.canPay(player, w.def.energyCost)) { this.weakAttack(player, w); return; }
    if (!this.spend(player, w.def.energyCost)) return;
    w.cooldown += 1 / this.getFireRate(player, w);
    if (w.def.familiar) { // 소환 무기: 사냥개·정령·골렘 — 최대 수를 넘으면 가장 오래된 소환수가 사라짐
      const mine = this.world.allies.filter((a) => a instanceof Familiar && a.def === w.def && a.owner === player && a.alive);
      while (mine.length >= w.def.familiar.max) mine.shift().alive = false;
      const fm = new Familiar(player, w.def, mine.length, () => weaponMods(player, w)); this.world.allies.push(fm);
      this.world.effects.sparkle(fm.x, fm.y - 4, w.def.bulletColor); this.world.effects.ring(fm.x, fm.y, 10, w.def.bulletColor); SFX.play('skill', 0.1); player.recoil = 0.5;
      return;
    }
    if (w.def.summon) { // 드론 소환: 최대 수를 넘으면 가장 오래된 드론이 사라짐
      const mine = this.world.allies.filter((a) => a instanceof Drone && a.def === w.def);
      while (mine.length >= w.def.summon.max) mine.shift().alive = false;
      const dr = new Drone(player, w.def, mine.length); dr.wmods = () => weaponMods(player, w); this.world.allies.push(dr);
      this.world.effects.sparkle(player.x, player.y - 10, w.def.bulletColor); SFX.play('skill', 0.1);
      return;
    }
    if (w.def.meteor) { // 유성·화살비: 조준 지점(사거리 안)에 경고 후 낙하
      const M = w.def.meteor, mw = this.world.mouseWorld(), dx = mw.x - player.x, dy = mw.y - player.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, w.def.range / d);
      for (let i = 0; i < M.count; i++) {
        const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * M.spread;
        this.world.zones.push(new Strike(player.x + dx * k + Math.cos(a) * r, player.y + dy * k + Math.sin(a) * r * 0.75, M.delay + i * (M.stagger || 0), M.r,
          { damage: w.def.damage, mods: weaponMods(player, w), knockback: w.def.knockback, status: w.def.status || null }, w.def.bulletColor, !!M.arrow));
      }
      SFX.play(M.arrow ? 'bow' : 'magic'); player.recoil = 0.6; return;
    }
    if (w.def.trap) { // 덫 깔기: 조준 지점(사거리 안)에 덫을 던져 놓음, 최대 수를 넘으면 가장 오래된 덫이 사라짐
      const D = w.def.trap, mine = this.world.zones.filter((z) => z instanceof Trap && z.def === w.def && z.alive);
      while (mine.length >= D.max) mine.shift().alive = false;
      const mw = this.world.mouseWorld(), dx = mw.x - player.x, dy = mw.y - player.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, w.def.range / d);
      let tx = player.x + dx * k, ty = player.y + dy * k; const st = sweepWall(player.x, player.y, tx, ty, this.world.map);
      if (st >= 0) { tx = player.x + (tx - player.x) * Math.max(0, st - 0.05); ty = player.y + (ty - player.y) * Math.max(0, st - 0.05); } // 벽 앞에 떨어짐
      const t = new Trap(tx, ty, w.def, () => weaponMods(player, w)); this.world.zones.push(t);
      this.world.effects.dust(tx, ty); SFX.play('crate'); player.recoil = 0.5; return;
    }
    if (w.def.sentry) { /* 덫 장비 설치: 마우스 위치(사거리 안), 벽·맵 밖이면 설치 안 함 */
      const pt = this.world.trapPoint(player, w.def.range); if (!pt) { player.energy = Math.min(player.maxEnergy, player.energy + (w.def.energyCost || 0)); return; }
      this.sentryMakeRoom(player, w); /* 설치할 자리가 정해진 뒤에만 오래된 것을 없앰 (벽이라 못 깔면 그대로) */
      const S = w.def.sentry, t = new TrapSentry(player, pt.x, pt.y, S.kind, S, { dmg: w.def.damage, getMods: () => weaponMods(player, w) }); t.def = w.def;
      this.world.zones.push(t); this.world.effects.dust(pt.x, pt.y); this.world.effects.ring(pt.x, pt.y, 12, w.def.bulletColor); SFX.play('crate'); player.recoil = 0.4; return;
    }
    if (w.def.deploy) { // 포탑 설치: 최대 수를 넘으면 가장 오래된 포탑이 사라짐
      const D = w.def.deploy, mine = this.world.allies.filter((a) => a instanceof Turret && a.def === w.def);
      while (mine.length >= D.max) mine.shift().alive = false;
      let tx = player.x + player.aim.x * 14, ty = player.y + player.aim.y * 14;
      if (this.world.map.isSolidAt(tx, ty)) { tx = player.x; ty = player.y; }
      const t = new Turret(tx, ty, player, { damage: w.def.damage, life: D.life, rate: D.rate, range: w.def.range }); t.def = w.def; t.wmods = () => weaponMods(player, w);
      this.world.allies.push(t); this.world.effects.dust(tx, ty); SFX.play('crate'); return;
    }
    this.shootGun(player, w);
    if (w.def.burst) { w.burstLeft = w.def.burst.count - 1; w.burstTimer = w.def.burst.interval; }
  }
  shootGun(player, w, override = {}) {
    const def = w.def;
    w.shots = (w.shots || 0) + 1;
    const pow = def.nth && w.shots % def.nth.every === 0; // N번째 사격 강화
    if (pow) { override = Object.assign({}, override, { damage: (override.damage ?? def.damage) * def.nth.mult, size: (override.size || def.bulletSize || 1) + 1 });
      this.world.effects.ring(player.x + player.aim.x * 12, player.y + player.aim.y * 12, 10, '#ffffff'); SFX.play('crit', 0.05); }
    if (def.dice && !override.echo) { // 운명의 주사위: 1~6
      const roll = 1 + Math.floor(Math.random() * 6), D = def.dice, k = roll === 1 ? D.lo : roll === 6 ? D.hi : 1;
      override = Object.assign({}, override, { damage: (override.damage ?? def.damage) * k }, roll === 6 ? { explodeRadius: D.r, size: 3, color: '#fff4a0' } : roll === 1 ? { size: 1, color: '#9a9aaa' } : {});
      this.world.effects.text(player.x + 8, player.y - 20, String(roll), roll === 6 ? '#ffd84a' : roll === 1 ? '#9a9aaa' : '#ffffff'); if (roll === 6) SFX.play('crit', 0.06); }
    if (def.cycle && !override.echo) { // 사계: 여름(화상) → 겨울(빙결) → 가을(중독) → 봄(전격)
      const C = [{ c: '#ff7a3a', s: { type: 'burn', chance: 1, duration: 2, dps: 12 } }, { c: '#8ad8ff', s: { type: 'freeze', chance: 1, duration: 1.2, slow: 0.5 } }, { c: '#c0e04a', s: { type: 'poison', chance: 1, duration: 3, dps: 10 } }, { c: '#ffe36b', s: { type: 'shock', chance: 1, duration: 2 } }][(w.cyc = ((w.cyc || 0) % 4) + 1) - 1];
      override = Object.assign({}, override, { status: C.s, color: C.c }); }
    const base = Math.atan2(player.aim.y, player.aim.x);
    const spread = (def.spreadDeg || 0) * Math.PI / 180; const fired = []; // 메아리: 이번에 쏜 탄 설정
    const n = def.projectileCount || 1;
    if (def.orbit) { // 궤도 구슬: 플레이어 주위를 돌며 닿는 적을 공격
      const mine = this.world.projectiles.filter((p) => p.orbit && p.srcId === def.id && p.alive);
      while (mine.length >= def.orbit.max) mine.shift().alive = false;
      this.world.projectiles.push(new Projectile({ x: player.x, y: player.y, dx: 1, dy: 0, speed: 0, range: 9999, damage: def.damage,
        pierce: 99, knockback: def.knockback, mods: weaponMods(player, w), color: def.bulletColor, size: def.bulletSize || 2, rehit: def.rehit, srcId: def.id,
        orbit: { owner: player, r: def.orbit.r, speed: def.orbit.speed, life: def.orbit.life, ang: base } }));
      this.world.effects.sparkle(player.x, player.y, def.bulletColor); SFX.play('magic');
      return;
    }
    for (let i = 0; i < n; i++) {
      let ang = base + (Math.random() * 2 - 1) * spread;
      if (def.fanDeg && n > 1) ang = base + (i / (n - 1) - 0.5) * def.fanDeg * Math.PI / 180;
      if (def.parallel) ang = base + (Math.random() * 2 - 1) * spread;
      const off = def.parallel ? (i - (n - 1) / 2) * def.parallel : 0;
      const opt = Object.assign({
        x: player.x - Math.sin(base) * off, y: player.y - 1 + Math.cos(base) * off, dx: Math.cos(ang), dy: Math.sin(ang),
        boomerang: !!def.boomerang, split: def.split || null, pull: def.pull || null, rehit: def.rehit || 0, mine: def.mine || null,
        spriteDef: def.boomerang || def.spinSprite ? def : null,
        bubble: !!def.bubble, grenade: def.grenade || null, firework: def.firework || null, ricochet: def.ricochet || 0,
        puddle: def.puddle || null, arrow: !!def.arrow, trail: def.trail || null, grow: def.grow || 0,
        close: def.close || 0, execute: def.execute || 0, mark: def.mark || null, killEnergy: def.killEnergy || 0,
        speed: def.projectileSpeed, range: def.range, damage: def.damage, wdef: def, // wdef: 멀티 참가자 화면이 내 탄을 미리 그릴 수 있는지 판단
        pierce: def.pierce, knockback: def.knockback || 0,
        mods: weaponMods(player, w),
        explodeRadius: def.explodeRadius || 0, color: def.bulletColor, size: def.bulletSize || 1,
        homing: def.homing || 0, bounce: def.bounce || 0, chain: def.chain || null, status: def.status || null, flame: !!def.flame,
        brand: def.brand || null, shatter: def.shatter || null, pin: def.pin || 0, killExplode: def.killExplode || null, blackhole: def.blackhole || null, glow: def.glow || null
      }, override);
      if (player.huntT > 0 && !opt.mine && !opt.boomerang) opt.homing = Math.max(opt.homing || 0, 2.2); /* 사냥꾼의 표적: 탄이 살짝 휘어 들어감 */
      if (odDouble(player) && !opt.mine) { /* 같은 탄을 옆으로 조금 벌려 한 발 더 */
        const px = -Math.sin(base) * 3, py = Math.cos(base) * 3;
        this.world.projectiles.push(new Projectile(Object.assign({}, opt, { x: opt.x + px, y: opt.y + py })));
        opt.x -= px; opt.y -= py;
      }
      this.world.projectiles.push(new Projectile(opt)); fired.push(opt);
    }
    if (def.echo && !override.echo && fired.length) { // 메아리: 쏜 자리에 남아 잠시 뒤 같은 탄을 한 번 더
      const E = def.echo, ox = player.x, oy = player.y, col = def.bulletColor;
      this.world.zones.push({ x: ox, y: oy, t: 0, alive: true, update(dt, world) { this.t += dt; if (this.t >= E.delay) { this.alive = false; for (const o of fired) world.projectiles.push(new Projectile(Object.assign({}, o, { damage: o.damage * E.mult, color: '#e0f0ff', echo: true }))); world.effects.ring(ox, oy, 8, col); } },
        render(ctx) { const k = this.t / E.delay; ctx.save(); ctx.globalAlpha = 0.5 * (1 - k * 0.5); ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(Math.round(ox), Math.round(oy) - 1, 3 + k * 5, 0, TAU); ctx.stroke(); ctx.restore(); } }); }
    const L = weaponLength(def) + 4; // 총구 위치에 섬광
    if (!def.flame) this.world.effects.muzzle(player.x + player.aim.x * L, player.y + 2 + player.aim.y * L * 0.75, base, def.bulletColor);
    player.recoil = Math.min(1, player.recoil + (def.damage * (def.projectileCount || 1) >= 40 ? 1 : def.fireRate > 8 ? 0.35 : 0.6));
    SFX.play(weaponSound(def), def.fireRate > 8 ? 0.06 : 0.03);
  }
  releaseCharge(player, w) {
    const def = w.def, k = 0.3 + 0.7 * Math.min(1, w.charge / def.chargeTime), full = w.charge >= def.chargeTime;
    w.charge = 0;
    if (!this.spend(player, def.energyCost)) return;
    w.cooldown = 1 / this.getFireRate(player, w);
    if (def.beamShot) { this.world.fireBeamShot(player, def, k); return; }
    this.shootGun(player, w, { damage: def.damage * k, speed: def.projectileSpeed * (0.6 + 0.4 * k),
      pierce: full ? def.pierce : 0, arrow: true, size: full ? 2 : 1 });
  }
  fireMelee(player, w) {
    const def = w.def, world = this.world;
    if (!this.canPay(player, def.energyCost)) { this.weakAttack(player, w); return; }
    if (!this.spend(player, def.energyCost)) return;
    w.cooldown += 1 / this.getFireRate(player, w);
    const ang = Math.atan2(player.aim.y, player.aim.x), arc = def.arcDeg * Math.PI / 180;
    if (def.lunge) { // 돌격 찌르기: 조준 방향으로 돌진하며 찌름
      world.effects.dust(player.x, player.y + 4);
      let L = def.lunge; // 앞에 적이 있으면 그 바로 앞에서 멈춤
      for (const e of world.enemies) {
        if (!e.targetable) continue;
        const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
        if (d < def.lunge + def.range && angleDiff(Math.atan2(dy, dx), ang) < 0.5) L = Math.min(L, Math.max(0, d - e.radius - 10));
      }
      moveAndCollide(player, player.aim.x * L, player.aim.y * L, world.map);
    }
    let bonusK = 1, tint = null;
    if (def.blood) { const B = def.blood, pay = Math.min(B.hp, Math.max(0, player.hp - 1)); bonusK = 1 + B.bonus * (1 - player.hp / player.maxHp); player.hp -= pay; tint = '#ff3a4a'; // 피의 계약: 먼저 잃은 체력만큼 강화 → 그다음 지불
      if (pay > 0) world.effects.text(player.x, player.y - 18, '-' + pay, '#ff5a6a'); }
    if (def.momentum) { const M = def.momentum, r = w.run || 0; bonusK = 1 + Math.min(M.max - 1, r / M.per); w.run = 0; if (bonusK >= 2) { tint = '#ffe36b'; world.effects.text(player.x, player.y - 20, '질주 ×' + bonusK.toFixed(1), '#ffe36b'); world.addShake(0.08, 2); } } // 질주
    w.shots = (w.shots || 0) + 1;
    const pow = def.nth && w.shots % def.nth.every === 0; // N번째 휘두르기 강화
    const src = { damage: def.damage * (pow ? def.nth.mult : 1) * bonusK, knockback: def.knockback * (pow ? 1.5 : 1), status: def.status || (player.hybrid && Math.random() < player.hybrid.passiveChance ? player.hybrid.status : null), // 마검사: 근접 공격에 속성
      mods: weaponMods(player, w),
      execute: def.execute || 0, mark: def.mark || null, killEnergy: def.killEnergy || 0, weaponId: def.id };
    if (pow) { world.addShake(0.12, 3); SFX.play('crit', 0.05); }
    let hits = 0;
    for (const e of world.enemies) {
      if (!e.targetable) continue;
      const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
      if (d - e.radius > def.range) continue;
      if (d > 4 && angleDiff(Math.atan2(dy, dx), ang) > arc / 2 + Math.atan2(e.radius, d)) continue;
      world.damageEnemy(e, src, dx / (d || 1), dy / (d || 1)); hits++;
    }
    for (const h of world.hazards) if (h.kind === 'eye' && h.alive) { /* 아그라베인의 감시의 눈도 근접 공격으로 부숨 */
      const dx = h.x - player.x, dy = h.y - player.y, d = Math.hypot(dx, dy);
      if (d - h.r <= def.range && (d < 4 || angleDiff(Math.atan2(dy, dx), ang) <= arc / 2 + Math.atan2(h.r, d))) { h.hp -= src.damage * (1 + ((src.mods && src.mods.attackBonus) || 0)); world.effects.spark(h.x, h.y, '#ffffff'); } }
    world.breakCratesInArc(player.x, player.y, ang, arc, def.range);
    if (def.slam) // 지면 강타: 내리친 자리에 충격파
      world.explodeAt(player.x + Math.cos(ang) * def.range * 0.8, player.y + Math.sin(ang) * def.range * 0.8, def.slam.r,
        { color: '#d8b070', hurtEnemies: true, src: { damage: def.slam.damage, mods: weaponMods(player, w), knockback: def.knockback, status: def.status || null, weaponId: def.id } });
    if (def.wave) // 검기: 베면 관통하는 초승달 모양 기운이 날아감
      world.projectiles.push(new Projectile({ x: player.x + Math.cos(ang) * 10, y: player.y - 1 + Math.sin(ang) * 10, dx: Math.cos(ang), dy: Math.sin(ang),
        speed: def.wave.speed, range: def.wave.range, damage: def.wave.damage, pierce: 99, knockback: 3, mods: weaponMods(player, w), color: def.color, size: 3, wave: true, weaponId: def.id }));
    if (def.lifesteal && hits > 0) player.hp = Math.min(player.maxHp, player.hp + Math.min(3, hits * def.lifesteal));
    if (def.deflect) {
      for (const b of world.enemyBullets) {
        const dx = b.x - player.x, dy = b.y - player.y, d = Math.hypot(dx, dy);
        if (b.blade && !def.kingSlayer) continue; /* [사용자 결정] 길가메시 보물고의 칼날은 '벗의 맹약'으로만 벨 수 있음 */
        if (d <= def.range + 6 && angleDiff(Math.atan2(dy, dx), ang) <= arc / 2 + 0.2) {
          b.alive = false; world.effects.spark(b.x, b.y, '#ffffff');
          if (def.reflect) { // 반사 방패: 적 탄을 조준 방향으로 되돌려 보냄 (2.5배)
            world.projectiles.push(new Projectile({ x: b.x, y: b.y, dx: Math.cos(ang), dy: Math.sin(ang), speed: 380, range: 320,
              damage: b.damage * 2.5, pierce: 0, knockback: 4, mods: weaponMods(player, w), color: '#ffffff', size: 2 }));
            world.effects.ring(b.x, b.y, 8, '#ffffff');
          }
        }
      }
    }
    const thrust = def.arcDeg < 40;
    player.swing = { t: 0, dur: thrust ? 0.15 : 0.16, ang, arc, thrust };
    SFX.play('melee');
    world.effects.slash(player.x, player.y - 1, ang, def.range * (pow ? 1.15 : 1), arc, tint || (pow ? '#ffd84a' : thrust ? '#e0f0ff' : 'rgba(230,240,255,0.9)'));
    if (def.shake) world.addShake(0.1, 3);
  }
  updateBeam(player, w, dt, down) {
    const def = w.def, world = this.world;
    if (!down) { w.beamActive = false; w.beamTick = Math.max(w.beamTick, 0); w.focusT = 0; w.focusK = 0; return; }
    if (player.overdrive <= 0) {
      if (player.energy <= 0) { w.beamActive = false; if (w.cooldown <= 0) this.weakAttack(player, w); return; } // 에너지 부족: 약한 공격
      player.energy = Math.max(0, player.energy - def.energyPerSec * dt);
    }
    w.beamActive = true;
    SFX.play('beam', 0.08);
    const sx = player.x + player.aim.x * 10, sy = player.y - 1 + player.aim.y * 10;
    let ex = sx + player.aim.x * def.range, ey = sy + player.aim.y * def.range;
    const wt = sweepWall(sx, sy, ex, ey, world.map);
    const wall = wt >= 0 ? wt : 1, hits = [];
    for (const e of world.enemies) {
      if (!e.targetable) continue;
      const t = segmentCircleHit(sx, sy, ex, ey, e.x, e.y, e.radius + 2);
      if (t >= 0 && t <= wall) hits.push([t, e]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    const pc = def.pierce || 0, bm = weaponMods(player, w);
    const target = hits.length ? hits[0][1] : null, extra = pc ? hits.slice(1, 1 + pc).map((h) => h[1]) : []; // 관통: 뒤에 있는 적도 함께 지짐
    const limit = !target ? wall : pc && hits.length > 1 + pc ? hits[pc][0] : pc ? wall : hits[0][0];
    w.beamEnd = { sx, sy, x: sx + (ex - sx) * limit, y: sy + (ey - sy) * limit };
    if (def.focus) { w.focusT = target && target === w.focusTarget ? (w.focusT || 0) + dt : 0; w.focusTarget = target; w.focusK = Math.min(1, w.focusT / 1.5); } // 같은 적을 계속 비추면 강해짐
    // 누적식 틱: 간격을 이어서 더해야 공속 버프가 프레임 단위로 잘리지 않음
    w.beamTick -= dt;
    const interval = def.tickRate / (1 + player.stats.fireRateBonus + (player.overdrive > 0 ? 1 + (player.odRate || 0) : 0));
    while (w.beamTick <= 0) {
      w.beamTick += interval;
      if (target) world.damageEnemy(target, { damage: def.damage * (1 + (def.focus || 0) * (w.focusK || 0)), mods: bm, knockback: 0, status: def.status || null, weaponId: def.id }, player.aim.x, player.aim.y, { quiet: true });
      for (const e of extra) if (e.alive) world.damageEnemy(e, { damage: def.damage, mods: bm, knockback: 0, status: def.status || null, weaponId: def.id }, player.aim.x, player.aim.y, { quiet: true });
    }
  }
}
