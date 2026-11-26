'use strict';
// ════════════════════════════════════════════
// 몬스터 AI
// ════════════════════════════════════════════
function chaseStep(e, tx, ty, speed, dt, map) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d < 0.01) return;
  moveAndCollide(e, dx / d * speed * dt, dy / d * speed * dt, map);
}
function hasClearPath(e, p, map) {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  const ox = -dy / d * (e.half + 2), oy = dx / d * (e.half + 2); // 몸통보다 약간 넓게 → 모서리 스침 방지
  for (const k of [0, -1, 1])
    if (sweepWall(e.x + ox * k, e.y + oy * k, p.x + ox * k, p.y + oy * k, map, 6) >= 0) return false;
  return true;
}
// 직선 경로가 막히면 플로우 필드(BFS 거리맵)를 따라 장애물을 돌아감
function pathStep(e, speed, dt, world) {
  const p = world.player, map = world.map;
  // 1초 동안 거의 못 움직였으면 0.5초간 방 중앙 쪽으로 빠져나옴
  e.stuckCheck = (e.stuckCheck || 0) + dt;
  if (e.stuckCheck >= 1) {
    if (Math.hypot(e.x - (e.sx0 ?? e.x + 99), e.y - (e.sy0 ?? 0)) < 1.5 && speed > 0) e.unstuck = 0.4;
    e.sx0 = e.x; e.sy0 = e.y; e.stuckCheck = 0;
  }
  if (e.unstuck > 0 && e.room) {
    e.unstuck -= dt;
    const c = map.tileCenter(e.room.cx, e.room.cy);
    chaseStep(e, c.x + (e.id % 3 - 1) * 24, c.y + (e.id % 2 ? 20 : -20), speed, dt, map); return;
  }
  if (hasClearPath(e, p, map)) { chaseStep(e, p.x, p.y, speed, dt, map); return; }
  const flow = world.flow, W = map.width;
  const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
  const here = flow[ty * W + tx];
  let best = null, bestD = here >= 0 ? here : 1e9;
  for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const v = flow[(ty + ddy) * W + tx + ddx];
    if (v >= 0 && v < bestD) { bestD = v; best = [tx + ddx, ty + ddy]; }
  }
  if (!best) { chaseStep(e, p.x, p.y, speed, dt, map); return; }
  // 축 분리 이동: 진행 방향의 수직축을 먼저 타일 중앙에 맞춘 뒤 전진 → 모서리에 걸리지 않음
  const c = map.tileCenter(best[0], best[1]), step = speed * dt;
  const toward = (v, t) => clamp(t - v, -step, step);
  if (best[0] !== tx) {
    if (Math.abs(e.y - c.y) > 0.001) moveAndCollide(e, 0, toward(e.y, c.y), map);
    else moveAndCollide(e, toward(e.x, c.x), 0, map);
  } else {
    if (Math.abs(e.x - c.x) > 0.001) moveAndCollide(e, toward(e.x, c.x), 0, map);
    else moveAndCollide(e, 0, toward(e.y, c.y), map);
  }
}

const AI_BEHAVIORS = {
  dummy() {},

  melee_chase(e, dt, world, ctx) {
    const def = e.def, p = world.player;
    const inRange = ctx.dist <= def.attackRange + p.radius;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE':
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        if (inRange && e.attackCd <= 0) { e.setState('TELEGRAPH'); break; }
        if (ctx.dist > def.attackRange * 0.6) pathStep(e, def.moveSpeed, dt, world);
        break;
      case 'TELEGRAPH': if (e.stateTime >= def.telegraphTime) e.setState('ATTACK'); break;
      case 'ATTACK':
        world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) <= def.attackRange + q.radius) world.damagePlayer(e.damage); }); // 멀티: 범위 안의 모두
        world.effects.ring(e.x, e.y, def.attackRange, '#ff7070'); traitOn(e, 'attack', world, ctx);
        e.attackCd = def.attackCooldown; e.setState('RECOVERY');
        break;
      case 'RECOVERY': if (e.stateTime >= def.recoveryTime) e.setState(ctx.playerAlive ? 'CHASE' : 'IDLE'); break;
    }
  },

  ranged_kite(e, dt, world, ctx) {
    const def = e.def, p = world.player, map = world.map;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE': {
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        if (!hasLineOfSight(e, p, map)) { pathStep(e, def.moveSpeed, dt, world); break; }
        e.strafeT -= dt;
        if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = 1.2 + Math.random() * 1.8; }
        const nx = ctx.dx / ctx.dist, ny = ctx.dy / ctx.dist;
        let mx = 0, my = 0;
        if (ctx.dist > def.preferredRange + 25) { mx = nx; my = ny; }
        else if (ctx.dist < def.preferredRange - 35) { mx = -nx; my = -ny; }
        mx += -ny * e.strafe * 0.7; my += nx * e.strafe * 0.7;
        const ml = Math.hypot(mx, my) || 1;
        const hit = moveAndCollide(e, mx / ml * def.moveSpeed * dt, my / ml * def.moveSpeed * dt, map);
        if (hit.x || hit.y) e.strafe *= -1;
        if (e.attackCd <= 0 && ctx.dist < def.attackRange) { e.aimAng = Math.atan2(ctx.dy, ctx.dx); e.setState('TELEGRAPH'); }
        break;
      }
      case 'TELEGRAPH':
        if (e.stateTime < def.telegraphTime - 0.15) e.aimAng = Math.atan2(ctx.dy, ctx.dx);
        if (e.stateTime >= def.telegraphTime) {
          const n = traitOn(e, 'fire', world, ctx) ? 0 : def.bulletCount || 1, sp = def.bulletSpread || 0;
          for (let i = 0; i < n; i++)
            world.enemyShoot(e.x, e.y, e.aimAng + (n > 1 ? (i / (n - 1) - 0.5) * sp * (n - 1) : 0), def.bulletSpeed, e.damage, def.bulletColor || '#ff6a4a', 3);
          e.attackCd = def.attackCooldown + Math.random() * 0.6;
          e.setState('RECOVERY');
        }
        break;
      case 'RECOVERY': if (e.stateTime >= def.recoveryTime) e.setState(ctx.playerAlive ? 'CHASE' : 'IDLE'); break;
    }
  },

  charger(e, dt, world, ctx) {
    const def = e.def, p = world.player, map = world.map;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE':
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        pathStep(e, def.moveSpeed, dt, world);
        if (e.attackCd <= 0 && ctx.dist < def.attackRange && hasLineOfSight(e, p, map)) {
          e.dashX = ctx.dx / ctx.dist; e.dashY = ctx.dy / ctx.dist; e.setState('TELEGRAPH');
        }
        break;
      case 'TELEGRAPH': if (e.stateTime >= def.telegraphTime) { e.dashHit = false; e.hits = null; e.setState('ATTACK'); } break;
      case 'ATTACK': {
        const hit = moveAndCollide(e, e.dashX * def.dashSpeed * dt, e.dashY * def.dashSpeed * dt, map); traitOn(e, 'dash', dt, world);
        world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 3) world.hitOnce(e, 'hits', q, () => world.damagePlayer(e.damage)); }); // 돌진 경로의 모두 (사람마다 한 번)
        if (hit.x || hit.y) {
          world.effects.spark(e.x + e.dashX * 8, e.y + e.dashY * 8, '#ffe08a'); world.addShake(0.1, 2);
          if (traitOn(e, 'dashEnd', world, ctx)) { e.setState('TELEGRAPH'); break; }
          e.attackCd = def.attackCooldown; e.setState('STUN'); break;
        }
        if (e.stateTime >= def.dashDuration) { if (traitOn(e, 'dashEnd', world, ctx)) { e.setState('TELEGRAPH'); break; } e.attackCd = def.attackCooldown; e.setState('RECOVERY'); }
        break;
      }
      case 'STUN': if (e.stateTime >= def.stunTime) e.setState('CHASE'); break;
      case 'RECOVERY': if (e.stateTime >= def.recoveryTime) e.setState(ctx.playerAlive ? 'CHASE' : 'IDLE'); break;
    }
  },

  caster(e, dt, world, ctx) {
    const def = e.def, p = world.player, map = world.map;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE':
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        e.strafeT -= dt;
        if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = 2 + Math.random() * 2; }
        if (ctx.dist > 180 || !hasLineOfSight(e, p, map)) pathStep(e, def.moveSpeed, dt, world);
        else moveAndCollide(e, -ctx.dy / ctx.dist * e.strafe * def.moveSpeed * dt, ctx.dx / ctx.dist * e.strafe * def.moveSpeed * dt, map);
        if (e.attackCd <= 0 && ctx.dist < def.attackRange) e.setState('TELEGRAPH');
        break;
      case 'TELEGRAPH':
        if (e.stateTime >= def.telegraphTime) {
          e.spin += 0.35;
          if (!traitOn(e, 'fire', world, ctx)) for (let i = 0; i < def.bulletCount; i++)
            world.enemyShoot(e.x, e.y - 4, e.spin + i * TAU / def.bulletCount, def.bulletSpeed, e.damage, def.bulletColor || '#c070ff', 3);
          e.attackCd = def.attackCooldown; e.setState('RECOVERY');
        }
        break;
      case 'RECOVERY': if (e.stateTime >= def.recoveryTime) e.setState(ctx.playerAlive ? 'CHASE' : 'IDLE'); break;
    }
  },

  // 자폭병: 붙으면 점멸 후 폭발 (처치당해도 폭발)
  exploder(e, dt, world, ctx) {
    const def = e.def;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE':
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        pathStep(e, def.moveSpeed, dt, world);
        if (ctx.dist < 26) e.setState('TELEGRAPH');
        break;
      case 'TELEGRAPH':
        if (e.stateTime >= def.telegraphTime) {
          e.alive = false; e.rewardGiven = true; e.setState('DEAD');
          world.enemyExplode(e);
        }
        break;
    }
  },

  // 보스: 데이터에 정의된 패턴 목록을 돌아가며 사용, 체력 50% 이하 격노
  // 보스: 3페이즈(66% / 33%) — 페이즈마다 패턴이 추가되고 빨라짐, 3페이즈에는 궁극기를 주기적으로 사용
  boss(e, dt, world, ctx) {
    const def = e.def, phase = e.phase || 1;
    const spd = [1, 1, 1.25, 1.5][phase] * (e.rampage ? def.rampage : 1) * (e.kingWeakT > 0 ? e.kingWeakSlow || 0.55 : 1); /* 벗의 사슬: 약해진 길가메시 */ /* 모드레드 '폭주': 모든 행동이 빨라짐 */
    const ratio = e.hp / e.maxHp, PA = def.phaseAt || [0.66, 0.33], want = ratio <= PA[1] ? 3 : ratio <= PA[0] ? 2 : 1; /* phaseAt: 페이즈가 바뀌는 체력 비율 (아서 왕: 체력바 3개째·마지막 1개) */
    const channeling = e.pd && ((e.pd.tower && e.pd.tower.alive) || e.pd.lock); /* 롱고미니아드(빛의 탑)가 서 있는 동안은 페이즈도 넘기지 않고 다른 행동 없음 — 탑이 무너진 뒤에 넘어감 */
    if (def.colossal) { // 거대 보스(태고룡): 아레나 위 상공에서 천천히 좌우로 떠다님 — 급강하 중엔 패턴이 직접 움직임
      if (!e.home) e.home = { x: e.x, y: e.y };
      if (!e.swooping && e.state !== 'INTRO') { const t = world.time || 0; e.x = e.home.x + Math.sin(t * 0.45) * 46; e.y = e.home.y + Math.sin(t * 1.2) * 3; } }
    if (want > phase && e.state !== 'INTRO' && !channeling) {
      if (def.colossal) { e.swooping = false; e.perched = false; e.swoopWarn = null; e.primWarn = null; e.roaring = false; e.coreCharge = 0; if (e.home) { e.x = e.home.x; e.y = e.home.y; } } // 페이즈가 바뀌면 상공으로 돌아감
      if (e.ult) { e.ult = false; e.damage = e.dmg0; }
      e.riposteT = 0; e.riposteHit = false; e.slashWarn = null; e.dashWarn = null; if (!channeling) e.fortress = null;
      e.phase = want; e.jumpH = 0; e.laser = null; e.fade = 1; e.finalCd = e.ultUsed ? Math.max(e.finalCd ?? 0, 1.5) : 1.5; /* 이미 궁극기를 썼으면 페이즈가 바뀌어도 쿨타임 유지 */
      if (def.arm && want >= 2 && !e.armOn) { e.armOn = true; e.damage = Math.round(e.damage * (1 + def.arm)); e.dmg0 = e.damage; world.announceBossSkill(e, '스위치 온 — 아가트람'); world.effects.rays(e.x, e.y, '#a0d0ff', 16, 80, 0.7); } /* 베디비어: 은빛 팔이 켜짐 */
      if (def.arm && want === 3) world.announceBossSkill(e, '해방 — 데드 엔드 아가트람');
      if (def.accuse && want === 3) { e.accuseOn = true; e.accuseCd = 2; e.accuseT = 0; world.announceBossSkill(e, '고발 — 도망칠 곳은 없다'); }
      if (def.fierce && want === 3) { e.fierce = true; world.announceBossSkill(e, '치열 — 멈추지 않는 검'); }
      if (def.wall && want === 3) { e.wallCone = def.wall.cone3; e.wallMult = def.wall.mult3; world.announceBossSkill(e, '철벽 — 무너지지 않는 성채'); }
      if (def.negate && want === 3) { e.negateOn = true; e.negCd = 1.5; world.announceBossSkill(e, '부정 — 모든 칼날을 거부하는 빛'); }
      if (def.final3Patterns && want === 3) e.finalCd = 2.2; /* 마지막 페이즈에 들어서면 곧바로 전용 보구 */
      if (def.rampage && want === 3) { e.rampage = true; world.announceBossSkill(e, def.rampageName || '폭주 — 멈추지 않는 반역'); }
      if (def.rev && want === 3) { e.revAll = true; world.announceBossSkill(e, '반전 — 되돌아오는 화살'); } /* 트리스탄: 이제 화살이 지나간 뒤 되돌아옴 */
      if (def.noon && want === 3) { e.damage = Math.round(e.damage * (1 + def.noon)); e.dmg0 = e.damage; world.announceBossSkill(e, '정오 — 태양의 가호'); } /* 가웨인: 해가 가장 높이 뜸 */
      world.onBossPhase(e, want); e.setState('PHASE'); return;
    }
    e.finalCd = (e.finalCd ?? 0) - dt;
    if (e.negateT > 0) e.negateT -= dt;
    if (e.accuseOn && e.state !== 'PHASE') { /* 아그라베인 고발: 표식 → 그 자리에 철퇴 */
      const A = def.accuse, p = world.player;
      if (e.accuseT > 0) { e.accuseT -= dt; if (Math.floor(e.accuseT * 4) !== Math.floor((e.accuseT + dt) * 4)) world.effects.ring(p.x, p.y, 12, '#ff3a2a');
        if (e.accuseT <= 0) world.hazards.push(new Hazard(p.x, p.y, { r: A.radius, delay: 0.35, damage: Math.round(e.damage * 1.5), bullets: A.bullets, color: '#ff5a3a' })); }
      else { e.accuseCd -= dt; if (e.accuseCd <= 0) { e.accuseCd = A.every; e.accuseT = A.mark; world.effects.text(p.x, p.y - 26, '고발', '#ff5a3a', true); SFX.play('magic', 0.1); } } }
    if (def.wall) { /* 갤러해드: 방패 방향 — 쫓는 동안만 천천히 플레이어 쪽으로 돎 */
      const want = Math.atan2(world.player.y - e.y, world.player.x - e.x); if (e.shieldAng == null) e.shieldAng = want;
      if (e.state === 'CHASE' || e.state === 'RECOVERY' || e.state === 'INTRO') { let df = want - e.shieldAng; df = Math.atan2(Math.sin(df), Math.cos(df)); e.shieldAng += clamp(df, -def.wall.turn * dt, def.wall.turn * dt); } }
    if (e.negateOn && e.state !== 'PHASE') { e.negCd -= dt; if (e.negCd <= 0) { e.negCd = def.negate.every + def.negate.dur; e.negateT = def.negate.dur; world.effects.ring(e.x, e.y, 30, '#ffffff'); world.effects.ring(e.x, e.y, 20, '#d8f0ff'); SFX.play('shield', 0.1); } } /* 가레스: 주기적으로 피해 무효 */
    switch (e.state) {
      case 'INTRO': break; // 등장 연출은 Game이 진행
      case 'PHASE': if (e.stateTime >= 1.3) e.setState('CHASE'); break; // 페이즈 전환 중 무적
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE': {
        if (!ctx.playerAlive) break;
        if (ctx.dist > 50) pathStep(e, def.moveSpeed * spd, dt, world);
        if (e.stateTime < def.attackCooldown * (e.cdMul || 1) / spd) break;
        let pat;
        if (phase >= (def.ultFrom || 3) && def.finalPatterns && e.finalCd <= 0 && !(e.kingWeakT > 0)) { /* 벗의 사슬로 약해진 동안은 궁극기 봉인 */ // 궁극기: 규모를 키우고 피해 +20%, 끝나면 마무리 폭발
          pat = boostUltimate(pick(phase >= 3 && def.final3Patterns ? def.final3Patterns : def.finalPatterns)); e.finalCd = (phase >= 3 && def.ult3Cd) || def.ultCd || 9; e.ultUsed = true; /* final3Patterns: 마지막 페이즈 전용 보구 (아서 왕: 엑스칼리버 엑셀수스) */
          e.ult = true; e.dmg0 = e.damage; e.damage = Math.round(e.damage * 1.2); if (world.onBossUltimate) world.onBossUltimate(e, pat);
        }
        else {
          const pool = def.patterns.concat(phase >= 2 ? def.phase2Patterns || [] : []);
          pat = pick(pool.filter((x) => x !== e.lastPat));
        }
        e.pat = pat; e.lastPat = pat; e.pd = { shots: 0, timer: 0 };
        const P = BOSS_PATTERNS[pat.type];
        if (P.begin) P.begin(e, world, ctx);
        if (pat.name) world.announceBossSkill(e, pat.name);
        e.setState('TELEGRAPH');
        break;
      }
      case 'TELEGRAPH':
        if (BOSS_PATTERNS[e.pat.type].aim) BOSS_PATTERNS[e.pat.type].aim(e, world, ctx);
        if (e.stateTime >= (e.pat.telegraph || (e.pat.type === 'slam' ? 0.8 : 0.5)) / spd) { e.pd.sx = e.x; e.pd.sy = e.y; e.setState('ATTACK'); }
        break;
      case 'ATTACK':
        { const n0 = world.enemyBullets.length, fin = BOSS_PATTERNS[e.pat.type].update(e, dt, world, ctx, spd);
          if (e.revAll) for (let i = n0; i < world.enemyBullets.length; i++) { const b = world.enemyBullets[i]; if (b.flipT === undefined && !b.noFlip) b.flipT = def.rev; } /* 반전: 새로 쏜 화살에 되돌아올 시간 */
          if (fin) { e.laser = null; e.fade = 1; if (e.ult) endUltimate(e, world); e.setState('RECOVERY');
            if (e.fierce) { const p = world.player, a = Math.atan2(p.y - e.y, p.x - e.x); for (let i = 0; i < 7; i++) world.enemyShoot(e.x, e.y, a + (i - 3) * 0.12, e.def.bulletSpeed * 1.15, e.damage, '#bcd8ff', 3); world.effects.ring(e.x, e.y, 18, '#bcd8ff'); } } } /* 치열: 패턴이 끝날 때마다 검기 */
        break;
      case 'RECOVERY': if (e.stateTime >= (e.pat && e.pat.name ? 1.1 : 0.6) * (e.fierce ? def.fierce : 1) / spd) e.setState('CHASE'); break;
    }
  },

  // 순간이동 사격수: 사라졌다가 플레이어 근처에 나타나 부채꼴 사격
  teleporter(e, dt, world, ctx) {
    const def = e.def, p = world.player, map = world.map;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE':
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        if (ctx.dist > def.preferredRange + 30 || !hasLineOfSight(e, p, map)) pathStep(e, def.moveSpeed, dt, world);
        else if (ctx.dist < def.preferredRange - 40) moveAndCollide(e, -ctx.dx / ctx.dist * def.moveSpeed * dt, -ctx.dy / ctx.dist * def.moveSpeed * dt, map);
        if (e.attackCd <= 0) e.setState('TELEGRAPH');
        break;
      case 'TELEGRAPH':
        e.fade = Math.max(0.15, 1 - e.stateTime / def.telegraphTime);
        if (e.stateTime >= def.telegraphTime) {
          for (let i = 0; i < 24; i++) { // 플레이어 주변 빈 자리로 순간이동
            const a = Math.random() * TAU, r = 105 + Math.random() * 50, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
            if (e.room && map.roomAtPoint(x, y) !== e.room) continue;
            if (overlapsSolid(x, y, e.half, map)) continue;
            const ox = e.x, oy = e.y; world.effects.ring(e.x, e.y, 10, def.bulletColor); e.x = x; e.y = y; world.effects.ring(x, y, 14, def.bulletColor); traitOn(e, 'teleport', world, ox, oy);
            break;
          }
          e.fade = 1;
          const base = Math.atan2(p.y - e.y, p.x - e.x), n = def.bulletCount;
          if (!traitOn(e, 'fire', world, ctx)) for (let i = 0; i < n; i++) world.enemyShoot(e.x, e.y, base + (i - (n - 1) / 2) * def.bulletSpread, def.bulletSpeed, e.damage, def.bulletColor, 3);
          e.attackCd = def.attackCooldown + Math.random() * 0.5; traitOn(e, 'attack', world, ctx); e.setState('RECOVERY');
        }
        break;
      case 'RECOVERY': if (e.stateTime >= def.recoveryTime) e.setState(ctx.playerAlive ? 'CHASE' : 'IDLE'); break;
    }
  },

  // 고정 포탑: 레이저로 조준(마지막 0.25초는 고정) → 일직선 탄 연사
  turret(e, dt, world, ctx) {
    const def = e.def, p = world.player;
    switch (e.state) {
      case 'IDLE': if (ctx.playerAlive) e.setState('CHASE'); break;
      case 'CHASE':
        if (!ctx.playerAlive) { e.setState('IDLE'); break; }
        if (e.attackCd <= 0 && ctx.dist < def.attackRange && hasLineOfSight(e, p, world.map)) { e.aimAng = Math.atan2(ctx.dy, ctx.dx); e.setState('TELEGRAPH'); }
        break;
      case 'TELEGRAPH':
        if (e.stateTime < def.telegraphTime - 0.25) e.aimAng = Math.atan2(ctx.dy, ctx.dx);
        if (e.stateTime >= def.telegraphTime) {
          if (!traitOn(e, 'fire', world, ctx)) for (let i = 0; i < def.bulletCount; i++) world.enemyShoot(e.x, e.y - 4, e.aimAng, def.bulletSpeed * (1 + i * 0.09), e.damage, '#d8a0ff', 3);
          e.attackCd = def.attackCooldown; e.setState('RECOVERY');
        }
        break;
      case 'RECOVERY': if (e.stateTime >= def.recoveryTime) e.setState('CHASE'); break;
    }
  }
};

// ── 몬스터 특성: 기본 AI 위에 얹는 추가 패턴 (심층 잡몹). 적 데이터에 traits: ['pounce', ...]
//  tick: 매 프레임 (true면 이번 프레임 기본 AI를 건너뜀) / attack: 근접 공격 직후 / fire: 원거리 발사 직전 (true면 기본 발사 대신)
//  dash·dashEnd: 돌진 중·끝 (dashEnd가 true면 다시 돌진) / teleport: 순간이동 직후 / death: 처치될 때
function traitOn(e, hook, ...a) {
  const T = e.def.traits; if (!T) return false; let r = false;
  for (const k of T) { const f = ENEMY_TRAITS[k] && ENEMY_TRAITS[k][hook]; if (f && f(e, ...a)) r = true; }
  return r;
}
function traitRing(world, e, n, speed, col, dmgMul = 0.8, off = Math.random()) {
  for (let i = 0; i < n; i++) world.enemyShoot(e.x, e.y, off + i * TAU / n, speed, Math.round(e.damage * dmgMul), col || e.def.bulletColor || e.def.color, 3);
}
const ENEMY_TRAITS = {
  // 도약: 거리를 두면 잠깐 웅크렸다가(조준선 표시) 플레이어 자리로 뛰어듦
  pounce: {
    tick(e, dt, world, ctx) {
      const t = e.tp || (e.tp = { cd: 1.2 + Math.random() * 2 }), p = world.player;
      if (e.state === 'POUNCE') { if (e.stateTime >= 0.5) { e.setState('LEAP'); t.hit = false; } return true; }
      if (e.state === 'LEAP') {
        const hit = moveAndCollide(e, t.vx * dt, t.vy * dt, world.map);
        world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 4) world.hitOnce(t, 'hits', q, () => world.damagePlayer(e.damage)); });
        if (e.stateTime >= 0.3 || hit.x || hit.y) { world.effects.ring(e.x, e.y, 14, e.def.color); t.cd = 3 + Math.random() * 1.5; t.hits = null; e.setState('RECOVERY'); }
        return true;
      }
      t.cd -= dt;
      if (e.state === 'CHASE' && t.cd <= 0 && ctx.playerAlive && ctx.dist > 45 && ctx.dist < 130 && hasLineOfSight(e, p, world.map)) {
        const sp = Math.min(440, (ctx.dist + 12) / 0.3); e.aimAng = Math.atan2(ctx.dy, ctx.dx); t.vx = Math.cos(e.aimAng) * sp; t.vy = Math.sin(e.aimAng) * sp;
        e.setState('POUNCE'); return true;
      }
      return false;
    }
  },
  // 충격파: 근접 공격과 함께 느린 탄 고리
  shockwave: { attack(e, world) { traitRing(world, e, 8, 90, null, 0.6); } },
  // 단말마: 처치되면 탄이 사방으로 흩어짐
  deathBurst: { death(e, world) { traitRing(world, e, 8, 105, null, 0.7); } },
  // 분열: 처치되면 작은 개체 둘로 갈라짐 (작은 개체는 다시 갈라지지 않음)
  splitDeath: {
    death(e, world) {
      if (e.small || !world.spawnEnemy) return;
      for (const s of [-1, 1]) { const ox = overlapsSolid(e.x + s * 8, e.y, e.half, world.map) ? 0 : s * 8, c = world.spawnEnemy(e.def.id, e.x + ox, e.y, e.room); /* 벽 속에 생기지 않게 */ c.small = true; c.maxHp = c.hp = Math.max(1, Math.round(e.maxHp * 0.3)); c.state = 'CHASE'; c.attackCd = 0.8; }
    }
  },
  // 덫 놓기: 지나간 자리에 잠시 뒤 터지는 장판
  minelay: {
    tick(e, dt, world, ctx) {
      e.mineT = (e.mineT ?? 1 + Math.random() * 2) - dt;
      if (e.mineT <= 0 && ctx.playerAlive) { e.mineT = 2.6 + Math.random(); world.hazards.push(new Hazard(e.x, e.y, { r: 16, delay: 1.4, damage: Math.round(e.damage * 0.8), bullets: 0, color: e.def.bulletColor || e.def.color })); }
      return false;
    }
  },
  // 돌진 자국: 돌진하는 동안 양옆으로 느린 탄을 흘림
  dashTrail: {
    dash(e, dt, world) {
      e.trailT = (e.trailT || 0) - dt; if (e.trailT > 0) return;
      e.trailT = 0.07; const a = Math.atan2(e.dashY, e.dashX), col = e.def.bulletColor || e.def.color;
      for (const s of [-1, 1]) world.enemyShoot(e.x, e.y, a + s * Math.PI / 2, 60, Math.round(e.damage * 0.6), col, 3);
    }
  },
  // 돌진 끝 폭발: 멈추는 자리에서 탄 고리
  dashBurst: { dashEnd(e, world) { traitRing(world, e, 10, 115, null, 0.7); return false; } },
  // 연속 돌진: 한 번 더 방향을 바꿔 돌진
  redash: {
    dashEnd(e, world, ctx) {
      if ((e.redashN || 0) >= 1 || !ctx.playerAlive) { e.redashN = 0; return false; }
      e.redashN = (e.redashN || 0) + 1; e.dashX = ctx.dx / ctx.dist; e.dashY = ctx.dy / ctx.dist; return true;
    }
  },
  // 섞어 쓰기 (술사): 원형 탄막 → 조준 부채꼴 → 발밑 장판 순서로 번갈아
  castMix: {
    fire(e, world, ctx) {
      const n = e.castN = ((e.castN || 0) + 1) % 3, col = e.def.bulletColor, p = world.player;
      if (n === 1) { const a = Math.atan2(ctx.dy, ctx.dx); for (let i = 0; i < 5; i++) world.enemyShoot(e.x, e.y - 4, a + (i - 2) * 0.16, e.def.bulletSpeed * 1.5, e.damage, col, 3); return true; }
      if (n === 2) { for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, r = i ? 26 + Math.random() * 20 : 0; world.hazards.push(new Hazard(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, { r: 20, delay: 0.9, damage: e.damage, bullets: 0, color: col })); } return true; }
      return false;
    }
  },
  // 장판 시전: 탄막과 함께 플레이어 발밑에 장판 하나
  zoneCast: { fire(e, world) { const p = world.player; world.hazards.push(new Hazard(p.x, p.y, { r: 22, delay: 1.1, damage: e.damage, bullets: 0, color: e.def.bulletColor || e.def.color })); return false; } },
  // 부채 쓸기 (포탑): 두 번에 한 번은 넓은 부채꼴로
  turretSweep: {
    fire(e, world) {
      if ((e.fireN = (e.fireN || 0) + 1) % 2) return false;
      for (let i = 0; i < 11; i++) world.enemyShoot(e.x, e.y - 4, e.aimAng + (i - 5) * 0.12, e.def.bulletSpeed * 0.75, e.damage, e.def.bulletColor, 3);
      return true;
    }
  },
  // 고리 (포탑): 세 번에 한 번은 사방으로 두 겹 고리
  turretRing: {
    fire(e, world) {
      if ((e.fireN = (e.fireN || 0) + 1) % 3) return false;
      traitRing(world, e, 14, e.def.bulletSpeed * 0.55, e.def.bulletColor, 1); traitRing(world, e, 14, e.def.bulletSpeed * 0.42, e.def.bulletColor, 1, Math.PI / 14);
      return true;
    }
  },
  // 잔상: 순간이동한 원래 자리가 잠시 뒤 터짐
  afterimage: { teleport(e, world, ox, oy) { world.hazards.push(new Hazard(ox, oy, { r: 22, delay: 0.6, damage: e.damage, bullets: 6, color: e.def.bulletColor })); } },
  // 연속 이동: 사격 뒤 곧바로 한 번 더 순간이동해 쏨
  doubleTap: { attack(e) { e.tap2 = !e.tap2; if (e.tap2) e.attackCd = 0.55; } }
};

// update()가 true를 돌려주면 패턴 종료
// 보스 광선 길이: 벽에서 멈춤
function beamLength(e, a, map) {
  const L = 420, t = sweepWall(e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, map, 4);
  return t < 0 ? L : t * L;
}
// 궁극기 강화: 같은 패턴을 더 크게 (탄 수·겹·시간·끌어당김 증가, 간격·예고 단축)
function boostUltimate(P) {
  const q = Object.assign({}, P);
  if (q.rings) q.rings += 1; if (q.count) q.count = Math.round(q.count * 1.15); if (q.bullets) q.bullets += 2; if (q.arms && q.type !== 'vortex') q.arms += 1;
  if (q.duration) q.duration *= 1.15; if (q.pull) q.pull *= 1.1; if (q.spin) q.spin *= 1.1; if (q.delay) q.delay *= 0.92; if (q.interval) q.interval *= 0.9;
  if (q.gap) q.gap = Math.max(4, q.gap - 1); if (q.volleys) q.volleys += 2; if (q.dashes) q.dashes += 1; if (q.chain !== undefined) q.chain += 1;
  return q;
}
// 궁극기가 끝날 때: 피해 원래대로 + 사방으로 터지는 마무리 탄막
function endUltimate(e, world) {
  e.ult = false; e.damage = e.dmg0;
  if (e.pat && e.pat.noFinale) return; /* 방어 보구(로드 카멜롯)는 마무리 폭발 없음 */
  const n = 28, col = (e.pat && e.pat.color) || '#ff5a5a';
  for (let i = 0; i < n; i++) world.enemyShoot(e.x, e.y, i * TAU / n + 0.11, e.def.bulletSpeed * 1.15, e.damage, col, 4);
  world.effects.ring(e.x, e.y, 60, '#ffffff'); world.effects.ring(e.x, e.y, 40, col); if (world.effects.rays) world.effects.rays(e.x, e.y, col, 16, 90, 0.6);
  world.addShake(0.35, 6); SFX.play('explode', 0.05);
}
function kingWaves(e, world, ang, n, arc, mult) { /* 아서 왕 근접 패턴의 검기 탄: ang 중심 arc 안에 n발 (한 바퀴면 원형) */
  const full = arc >= TAU - 0.01, sp = (e.def.bulletSpeed || 200) * 1.05, dmg = Math.round(e.damage * mult);
  for (let i = 0; i < n; i++) { const a = full ? ang + i * TAU / n : ang + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0); world.enemyShoot(e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14, a, sp, dmg, i % 2 ? '#fff4c0' : '#ffe9a0', 4); }
}
function roomBox(e) { const R = e.room; return R ? { x0: (R.x0 + 1) * TILE, y0: (R.y0 + 1) * TILE, x1: (R.x0 + R.w - 1) * TILE, y1: (R.y0 + R.h - 1) * TILE } : { x0: e.x - 160, y0: e.y - 110, x1: e.x + 160, y1: e.y + 110 }; } // 보스방 안쪽 (픽셀)
function bladeShot(world, x, y, a, speed, dmg, color, r) { world.enemyShoot(x, y, a, speed, dmg, color, r); const b = world.enemyBullets[world.enemyBullets.length - 1]; if (b) b.blade = true; } // 길가메시 보물고의 칼날
const BOSS_PATTERNS = {
  // 왕의 돌진 (아서 왕): 탄 없이 검을 앞세워 일직선으로 꿰뚫고 지나가는 돌진 — 돌진할 길을 붉은 띠로 예고 → 아주 빠르게 돌진(길 위에 있으면 베임) → 여러 번, 마지막엔 멈춘 자리에서 크게 한 바퀴 베기
  kingcharge: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects;
      if (d.n === undefined) { d.n = 0; d.st = 'aim'; d.pt = 0; }
      d.pt += dt;
      if (d.st === 'aim') { d.ang = Math.atan2(p.y - e.y, p.x - e.x); d.len = Math.min(P.len, beamLength(e, d.ang, world.map) - 8); e.dashWarn = { ang: d.ang, len: d.len, w: P.w, k: 0 }; d.st = 'warn'; d.pt = 0; return false; }
      if (d.st === 'warn') { e.dashWarn.k = Math.min(1, d.pt / (P.tele / spd)); if (d.pt >= P.tele / spd) { e.dashWarn = null; d.st = 'dash'; d.pt = 0; d.went = 0; e.hits = null; SFX.play('swing', 0.03); } return false; }
      if (d.st === 'dash') {
        const mv = P.speed * dt, x0 = e.x, y0 = e.y, hit = moveAndCollide(e, Math.cos(d.ang) * mv, Math.sin(d.ang) * mv, world.map); d.went += mv;
        world.eachTarget((q) => { if (segmentCircleHit(x0, y0, e.x, e.y, q.x, q.y, P.w + q.half) >= 0 || Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 4) world.hitOnce(e, 'hits', q, () => world.damagePlayer(Math.round(e.damage * P.mult))); });
        fx.part(e.x - Math.cos(d.ang) * 6, e.y - Math.sin(d.ang) * 6, 0, 0, { color: '#fff4c0', life: 0.25, size: 4, size2: 0, drag: 0, add: true }); /* 금빛 잔상 */
        if (hit.x || hit.y || d.went >= d.len) { fx.slash(e.x, e.y, d.ang, 40, 1.6, '#fff4c0'); world.addShake(0.12, 3); d.n++; d.st = 'rest'; d.pt = 0;
          kingWaves(e, world, d.ang, P.fan ?? 5, 1.0, 0.7); /* [사용자 결정] 돌진 끝마다 앞쪽으로 검기 탄 부채꼴 */
          if (d.n >= P.dashes && P.spinR) { world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < P.spinR + q.half) world.damagePlayer(Math.round(e.damage * P.mult * 1.2)); });
            fx.slash(e.x, e.y, d.ang, P.spinR, TAU - 0.05, '#fff4c0'); fx.ring(e.x, e.y, P.spinR, '#ffe9a0'); world.addShake(0.3, 6); SFX.play('heavy', 0.05); kingWaves(e, world, d.ang, 20, TAU, 0.7); } }
        return false; }
      if (d.st === 'rest') { if (d.pt >= (d.n >= P.dashes ? 0.3 : P.rest) / spd) { if (d.n >= P.dashes) return true; d.st = 'aim'; } return false; }
      return false;
    }
  },
  // 왕의 검술 (아서 왕): 탄이 아니라 검으로 직접 베는 근접 연격 — 근접 무기로 지울 수 없음. 파고들어 → 부채꼴 예고(붉은 칸) → 베기를 연달아, 마지막은 크게 한 바퀴 베기
  kingsblade: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects;
      if (d.n === undefined) { d.n = 0; d.st = 'close'; d.pt = 0; }
      d.pt += dt; const last = d.n === P.combo - 1, R = last && P.spinR ? P.spinR : P.reach, A = last && P.spinR ? TAU : P.arc;
      if (d.st === 'close') { /* 파고들기 */
        const dx = p.x - e.x, dy = p.y - e.y, dd = Math.hypot(dx, dy) || 1;
        if (dd > P.reach * 0.6 && d.pt < 0.4) { moveAndCollide(e, dx / dd * P.dash * dt, dy / dd * P.dash * dt, world.map); if (Math.random() < 0.5) fx.part(e.x, e.y + 4, 0, 0, { color: '#fff4c0', life: 0.2, size: 2, size2: 0, drag: 0, add: true }); return false; }
        d.ang = Math.atan2(dy, dx); d.st = 'warn'; d.pt = 0; e.slashWarn = { ang: d.ang, arc: A, r: R, k: 0 }; return false; }
      if (d.st === 'warn') { e.slashWarn.k = Math.min(1, d.pt / (P.tele / spd)); if (d.pt < P.tele / spd) return false;
        e.slashWarn = null; /* 베기 */
        world.eachTarget((q) => { const dx = q.x - e.x, dy = q.y - e.y, dd = Math.hypot(dx, dy), df = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - d.ang), Math.cos(Math.atan2(dy, dx) - d.ang)));
          if (dd < R + q.half && (A >= TAU - 0.01 || df < A / 2 + Math.atan2(q.half, Math.max(dd, 1)))) world.damagePlayer(Math.round(e.damage * (last ? P.lastMult || P.mult : P.mult))); });
        fx.slash(e.x, e.y, d.ang, R, Math.min(A, TAU - 0.05), '#fff4c0'); if (A >= TAU - 0.01) { fx.ring(e.x, e.y, R, '#ffe9a0'); fx.ring(e.x, e.y, R * 0.6, '#ffffff'); }
        kingWaves(e, world, d.ang, A >= TAU - 0.01 ? 18 : (P.waves ?? 5) + (last ? 2 : 0), Math.min(A, TAU), 0.7); /* [사용자 결정] 베기마다 베는 부채꼴을 따라 검기 탄 (마지막 회전 베기는 원형) */
        world.addShake(last ? 0.3 : 0.12, last ? 6 : 3); SFX.play('swing', 0.03); if (last) SFX.play('heavy', 0.05);
        d.n++; d.st = 'close'; d.pt = 0; return d.n >= P.combo; }
      return false;
    }
  },
  // 원탁의 맹세 (아서 왕 2페이즈~): 플레이어를 둘러싸고 원탁처럼 검 swords자루가 떠오름(한 자리는 비어 있음 = 빠져나갈 틈)
  //  → 시계 방향으로 한 자루씩 중심을 꿰뚫고 날아감 → 마지막에 중심에서 맹세의 일격(예고 원 뒤 원형 탄) — 틈으로 빠져나가야 함
  // ── [사용자 결정] 바빌로니아 귀환길 보스 고유 패턴 (이름·수치는 Claude가 정한 [제안])
  // 라마수 — 수문 개방: 방 한쪽 끝에서 물의 벽이 밀려옴 (빈 틈으로 빠져나가야 함), 물결마다 반대쪽
  floodGate: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, B = roomBox(e); d.t = (d.t || 0) + dt; if (d.w === undefined) { d.w = 0; d.next = 0.6; }
      if (d.w < P.waves && !d.warned && d.t >= (d.next - 0.5) / spd) { d.warned = true; d.side = d.w % 2; const ex = d.side ? B.x1 : B.x0; for (let y = B.y0; y <= B.y1; y += 24) world.effects.spark(ex, y, P.color); world.effects.ring(ex, (B.y0 + B.y1) / 2, 30, P.color); }
      if (d.w < P.waves && d.t >= d.next / spd) { d.warned = false; d.next += P.interval;
        const rows = Math.floor((B.y1 - B.y0) / P.step) + 1, gap = randInt(0, Math.max(0, rows - P.gap)), ex = d.side ? B.x1 : B.x0;
        for (let i = 0; i < rows; i++) { if (i >= gap && i < gap + P.gap) continue; world.enemyShoot(ex, B.y0 + i * P.step, d.side ? Math.PI : 0, P.speed, e.damage, i % 2 ? P.color : '#bfefff', 5); }
        world.addShake(0.15, 3); SFX.play('react', 0.04); d.w++; }
      return d.w >= P.waves && d.t >= (d.next - P.interval + 0.6) / spd;
    }
  },
  // 점토판의 거신 — 율법의 판결: 내가 선 줄을 따라 점토판이 차례로 내리찍힘 (가로·세로 번갈아, 글을 새기듯)
  tabletVerdict: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, B = roomBox(e), p = world.player; d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.t = 99; }
      if (d.k < P.lines && d.t >= P.interval / spd) { d.t = 0; const horiz = d.k % 2 === 0;
        const n = Math.floor(((horiz ? B.x1 - B.x0 : B.y1 - B.y0)) / P.gap) + 1;
        for (let i = 0; i < n; i++) { const x = horiz ? B.x0 + i * P.gap : p.x, y = horiz ? p.y : B.y0 + i * P.gap;
          world.hazards.push(new Hazard(x, y, { r: P.radius, delay: (P.delay + i * P.stagger) / spd, damage: e.damage, bullets: P.bullets, color: i % 3 ? P.color : '#3ac8b8' })); }
        SFX.play('heavy', 0.03); d.k++; }
      return d.k >= P.lines && d.t >= (P.delay + 1) / spd;
    }
  },
  // 훔바바 — 일곱 겹의 광휘: 빈 틈이 돌아가는 빛의 고리 일곱 겹 (틈을 따라 돌며 피해야 함)
  sevenAuras: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.t = 99; d.a0 = Math.atan2(world.player.y - e.y, world.player.x - e.x); d.dir = Math.random() < 0.5 ? 1 : -1; }
      if (d.k < P.rings && d.t >= P.interval / spd) { d.t = 0; const g0 = d.a0 + d.dir * d.k * P.turn;
        for (let i = 0; i < P.count; i++) { const a = g0 + i * TAU / P.count; if (i < P.gapN) continue; world.enemyShoot(e.x, e.y, a, P.speed, e.damage, d.k % 2 ? P.color : '#ffd84a', 4); }
        world.effects.ring(e.x, e.y, 26 + d.k * 4, P.color); SFX.play('react', 0.03); d.k++; }
      return d.k >= P.rings && d.t >= 0.6 / spd;
    }
  },
  // 네티 — 일곱 문의 심판: 둘레에 명계의 문 일곱이 열리고 하나씩 나를 겨눠 쏨 → 마지막엔 모든 문이 한꺼번에
  sevenGates: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, B = roomBox(e); d.t = (d.t || 0) + dt;
      if (!d.gates) { const cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2; d.gates = [];
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + i * TAU / 7, G = new BossGate(cx + Math.cos(a) * P.radius, cy + Math.sin(a) * P.radius * 0.7, 0, (P.delay + 8 * P.interval) / spd + 0.4, true, P.color); world.zones.push(G); d.gates.push(G); }
        d.i = 0; d.t = 0; SFX.play('gate', 0.15); return false; }
      for (const G of d.gates) G.ang = Math.atan2(p.y - G.y, p.x - G.x);
      while (d.i < 8 && d.t >= (P.delay + d.i * P.interval) / spd) {
        const list = d.i < 7 ? [d.gates[d.i]] : d.gates;
        for (const G of list) for (let k = -2; k <= 2; k++) world.enemyShoot(G.x, G.y, G.ang + k * P.spread, P.speed, e.damage, k ? P.color : '#ffffff', 4);
        if (d.i === 7) { world.addShake(0.3, 5); SFX.play('heavy', 0.05); } d.i++; }
      return d.i >= 8 && d.t >= (P.delay + 8 * P.interval + 0.4) / spd;
    }
  },
  // 돌진 (하늘의 황소 '하늘의 황소 돌진' · 진흙의 엔키두 '벗의 돌진'): 조준선 → 벽에 닿을 때까지 돌진하며 지나간 자리가 터짐 → 부딪히면 원형 충격
  stampede: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.st = 'aim'; d.t = 0; }
      if (d.st === 'aim') { if (d.t < P.aim * 0.7 / spd || d.ang === undefined) d.ang = Math.atan2(p.y - e.y, p.x - e.x);
        e.laser = { angs: [d.ang], width: 5, color: d.t > P.aim * 0.7 / spd ? '#ff3a3a' : P.color, live: false };
        if (d.t >= P.aim / spd) { d.st = 'run'; d.t = 0; d.dist = 0; d.lastDrop = 0; d.hit = false; e.laser = null; SFX.play('dash', 0.06); } return false; }
      if (d.st === 'run') { const step = P.speed * spd * dt, nx = e.x + Math.cos(d.ang) * step, ny = e.y + Math.sin(d.ang) * step;
        const blocked = world.map.isSolidAt(nx + Math.cos(d.ang) * e.radius, ny + Math.sin(d.ang) * e.radius) || d.dist > P.maxDist;
        if (!blocked) { e.x = nx; e.y = ny; d.dist += step; if (d.dist - d.lastDrop >= P.trail) { d.lastDrop = d.dist; world.hazards.push(new Hazard(e.x, e.y, { r: P.radius, delay: P.hdelay / spd, damage: e.damage, bullets: P.bullets, color: P.color })); } world.effects.part(e.x, e.y + 8, randInt(-20, 20), -20, { color: P.color, life: 0.4, size: 2, size2: 0, drag: 2 }); }
        if (!d.hit) world.eachTarget((q) => { if (q.state !== 'DEAD' && Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 4) { world.damagePlayer(Math.round(e.damage * P.mult)); d.hit = true; } });
        if (blocked) { for (let i = 0; i < P.ring; i++) world.enemyShoot(e.x, e.y, i * TAU / P.ring, P.ringSpeed, e.damage, i % 2 ? P.color : '#ffffff', 4); world.addShake(0.35, 6); world.effects.ring(e.x, e.y, 40, P.color); SFX.play('heavy', 0.05);
          d.k++; d.st = d.k >= P.dashes ? 'done' : 'aim'; d.t = 0; } return false; }
      return d.t >= 0.5 / spd;
    }
  },
  // 무슈후슈 — 청금석 브레스: 머리에서 쏟아지는 탄의 부채가 천천히 휩쓸고 지나감 (반대 방향으로 한 번 더)
  serpentBreath: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt; if (d.a === undefined) { d.a = Math.atan2(p.y - e.y, p.x - e.x); d.shot = 0; }
      const T = P.duration / spd, half = Math.floor(d.t / T), u = (d.t % T) / T; if (half >= 2) return d.t >= 2 * T + 0.4 / spd;
      const ang = d.a + (half ? 1 : -1) * (u - 0.5) * P.sweep;
      d.shot -= dt; if (d.shot <= 0) { d.shot = P.interval / spd; for (const k of [-P.spread, 0, P.spread]) world.enemyShoot(e.x, e.y - 10, ang + k, P.speed, e.damage, k ? P.color : '#ffd84a', 4); }
      return false;
    }
  },
  // 전갈인간 왕 — 해 지는 화살: 하늘로 쏜 화살이 나에게 다가오는 줄을 따라 차례로 꽂힘 (세 줄, 매번 내 자리를 다시 겨눔)
  sunsetArrows: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.t = 99; }
      if (d.k < P.lines && d.t >= P.interval / spd) { d.t = 0; const a = Math.atan2(p.y - e.y, p.x - e.x), L = Math.hypot(p.x - e.x, p.y - e.y) + P.over;
        for (let s = 30, i = 0; s < L; s += P.gap, i++) for (const side of [-1, 1]) { const off = side * P.width, x = e.x + Math.cos(a) * s - Math.sin(a) * off, y = e.y + Math.sin(a) * s + Math.cos(a) * off;
          world.hazards.push(new Hazard(x, y, { r: P.radius, delay: (P.delay + i * P.stagger) / spd, damage: e.damage, bullets: 0, color: P.color })); }
        for (let i = 0; i < 6; i++) world.effects.part(e.x, e.y - 10, (i - 2.5) * 20, -260, { color: P.color, life: 0.5, size: 2, size2: 1, drag: 0 }); /* 하늘로 쏘아 올리는 화살 (연출) */
        SFX.play('react', 0.04); d.k++; }
      return d.k >= P.lines && d.t >= (P.delay + 1.2) / spd;
    }
  },
  // 파주주 — 모래 폭풍: 한쪽에서 거센 바람이 불어 몸이 밀리고, 바람을 타고 모래 탄이 쏟아짐 (틈을 찾아야 함)
  sandstorm: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, B = roomBox(e); d.t = (d.t || 0) + dt; if (d.dir === undefined) { d.dir = Math.random() < 0.5 ? 1 : -1; d.shot = 0.4; world.effects.text(e.x, e.y - 30, d.dir > 0 ? '바람 →' : '← 바람', P.color); }
      const T = P.duration / spd; if (d.t >= T) return d.t >= T + 0.5 / spd;
      for (const q of world.allPlayers()) if (q.state !== 'DEAD' && q.state !== 'DASH') { const nx = q.x + d.dir * P.push * dt; if (!world.map.isSolidAt(nx + d.dir * q.half, q.y)) q.x = nx; } /* 바람에 밀림 */
      d.shot -= dt; if (d.shot <= 0) { d.shot = P.interval / spd; const ex = d.dir > 0 ? B.x0 : B.x1, gapY = B.y0 + ((d.t * P.gapSpeed) % 1) * (B.y1 - B.y0);
        for (let k = 0; k < P.per; k++) { const y = B.y0 + Math.random() * (B.y1 - B.y0); if (Math.abs(y - gapY) < P.gapH) continue; world.enemyShoot(ex, y, (d.dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.15, P.speed * (0.8 + Math.random() * 0.4), e.damage, Math.random() < 0.3 ? '#ffd84a' : P.color, 3); } }
      if (Math.random() < 0.8) world.effects.part(d.dir > 0 ? B.x0 : B.x1, B.y0 + Math.random() * (B.y1 - B.y0), d.dir * 260, randInt(-10, 10), { color: P.color, life: 1.2, size: 1.5, size2: 0, drag: 0 });
      return false;
    }
  },
  // 진흙의 엔키두 — 흙의 사슬: 땅에서 솟은 하늘빛 사슬이 내 자리를 세 번 연달아 조임 (걸리면 잠깐 몸이 무거워짐)
  clayChains: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.t = 99; }
      if (d.k < P.casts && d.t >= P.interval / spd) { d.t = 0; const gates = [];
        for (let i = 0; i < P.gates; i++) { const a = i / P.gates * TAU + Math.random(), gx = p.x + Math.cos(a) * P.radius, gy = p.y + Math.sin(a) * P.radius * 0.7; gates.push({ x: gx, y: gy }); world.effects.ring(gx, gy, 8, P.color); }
        world.zones.push(new KingChainCast(gates, p.x, p.y, P.delay / spd, P.r, e.damage, P.bind, P.color)); SFX.play('gate', 0.1); d.k++; }
      return d.k >= P.casts && d.t >= (P.delay + 0.5) / spd;
    }
  },
  // 진흙의 엔키두 — 대지의 기둥: 엔키두를 중심으로 흙기둥이 겹겹이 솟아오름 (안쪽부터 바깥으로, 사이 틈으로 피해야 함)
  earthPillars: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.t = 99; d.a0 = Math.random() * TAU; }
      if (d.k < P.rings && d.t >= P.interval / spd) { d.t = 0; const R = P.r0 + d.k * P.step, n = Math.max(6, Math.round(TAU * R / P.space));
        for (let i = 0; i < n; i++) { if (i % P.skip === 0) continue; const a = d.a0 + d.k * 0.3 + i * TAU / n; world.hazards.push(new Hazard(e.x + Math.cos(a) * R, e.y + Math.sin(a) * R * 0.75, { r: P.radius, delay: P.delay / spd, damage: e.damage, bullets: P.bullets, color: i % 2 ? P.color : '#a87a50' })); }
        world.addShake(0.15, 3); d.k++; }
      return d.k >= P.rings && d.t >= (P.delay + 0.4) / spd;
    }
  },
  // 길가메시 — 보검의 격자: 방 위쪽·왼쪽 벽 앞에 문이 줄지어 열리고 칼날이 곧게 뻗어 격자를 그림 (세 번, 칸이 엇갈림)
  swordLattice: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, B = roomBox(e); d.t = (d.t || 0) + dt; if (d.k === undefined) { d.k = 0; d.t = 99; }
      if (d.k < P.waves && !d.gates && d.t >= P.interval / spd) { d.t = 0; d.gates = []; const off = (d.k % 2) * P.cell / 2;
        for (let x = B.x0 + 8 + off; x < B.x1; x += P.cell) { const G = new BossGate(x, B.y0, Math.PI / 2, P.delay / spd + 0.3, false); world.zones.push(G); d.gates.push(G); }
        for (let y = B.y0 + 8 + off; y < B.y1; y += P.cell) { const G = new BossGate(B.x0, y, 0, P.delay / spd + 0.3, false); world.zones.push(G); d.gates.push(G); }
        SFX.play('gate', 0.12); return false; }
      if (d.gates && d.t >= P.delay / spd) { for (const G of d.gates) for (let j = 0; j < P.chain; j++) bladeShot(world, G.x - Math.cos(G.ang) * j * 14, G.y - Math.sin(G.ang) * j * 14, G.ang, P.speed, Math.round(e.damage * P.mult), j ? P.color : '#ffffff', 4);
        d.gates = null; d.k++; d.t = 0; SFX.play('heavy', 0.04); }
      return d.k >= P.waves && d.t >= 0.8 / spd;
    }
  },
  // 길가메시 — 보물고의 소용돌이: 길가메시 둘레를 도는 문들이 쉬지 않고 칼날을 바깥으로 흩뿌림 (회전 방향이 중간에 바뀜)
  treasureSpiral: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.t = (d.t || 0) + dt;
      if (!d.gates) { d.gates = []; d.rot = 0; d.shot = 0; for (let i = 0; i < P.gates; i++) { const G = new BossGate(e.x, e.y, 0, P.duration / spd + 0.5, true); world.zones.push(G); d.gates.push(G); } SFX.play('gate', 0.2); }
      const T = P.duration / spd; d.rot += (d.t < T / 2 ? 1 : -1) * P.spin * dt;
      d.gates.forEach((G, i) => { const a = d.rot + i * TAU / P.gates; G.x = e.x + Math.cos(a) * P.radius; G.y = e.y - 8 + Math.sin(a) * P.radius * 0.7; G.ang = a; });
      if (d.t < T) { d.shot -= dt; if (d.shot <= 0) { d.shot = P.interval / spd; for (const G of d.gates) bladeShot(world, G.x, G.y, G.ang, P.speed, Math.round(e.damage * P.mult), P.color, 4); } return false; }
      return d.t >= T + 0.4 / spd;
    }
  },
  // ── [사용자 결정] 영웅왕 길가메시 전용 패턴 (이름·수치는 Claude가 정한 [제안])
  //  bladeShot: 보물고의 문에서 나가는 탄은 검 모양으로 그림
  // 왕의 재보 — 일제 개방: 등 뒤 부채꼴로 보물고의 문들이 열리고, 칼날이 하나씩 내 쪽으로 날아옴 (물결마다 부채꼴이 엇갈림)
  gateVolley: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt;
      if (d.w === undefined) { d.w = 0; d.t = 0; d.i = 0; }
      if (!d.gates) { const away = Math.atan2(e.y - p.y, e.x - p.x), off = d.w % 2 ? 0.5 : 0; d.gates = [];
        for (let i = 0; i < P.gates; i++) { const a = away + (i - (P.gates - 1) / 2 + off * 0.5) * (P.arc / Math.max(1, P.gates - 1)), gx = e.x + Math.cos(a) * P.radius, gy = e.y - 14 + Math.sin(a) * P.radius * 0.7;
          const G = new BossGate(gx, gy, Math.atan2(p.y - gy, p.x - gx), (P.delay + P.gates * P.interval) / spd + 0.2, P.big); world.zones.push(G); d.gates.push(G); }
        SFX.play('gate', 0.15); d.t = 0; d.i = 0; return false; }
      if (d.t < P.delay / spd) { for (const G of d.gates) G.ang = Math.atan2(p.y - G.y, p.x - G.x); return false; }
      while (d.i < d.gates.length && d.t >= (P.delay + d.i * P.interval) / spd) { const G = d.gates[d.i++], a = Math.atan2(p.y - G.y, p.x - G.x); G.ang = a;
        bladeShot(world, G.x, G.y, a, P.speed, Math.round(e.damage * P.mult), d.i % 3 ? P.color : '#ffffff', P.size); world.effects.spark(G.x, G.y, '#fff4c0'); if (d.i % 2) SFX.play('react', 0.02); }
      if (d.i >= d.gates.length) { d.gates = null; d.w++; if (d.w >= P.waves) return true; }
      return false;
    }
  },
  // 보물고의 낙하: 내 둘레 하늘에 문이 열리고 보검이 꽂혀 내림 (빈 자리 하나씩) — 물결마다 나를 따라옴
  gateFall: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt;
      if (d.w === undefined) { d.w = 0; d.t = 99; }
      if (d.t >= P.interval / spd && d.w < P.waves) { d.t = 0; d.w++;
        const gap = randInt(0, P.count - 1);
        for (let i = 0; i < P.count; i++) { if (i === gap) continue; const a = i / P.count * TAU + d.w * 0.4, r = i % 2 ? P.spread : P.spread * 0.5, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.7;
          world.zones.push(new BossGate(x, y - 44, Math.PI / 2, P.delay / spd, false));
          world.hazards.push(new Hazard(x, y, { r: P.radius, delay: P.delay / spd, damage: Math.round(e.damage * P.mult), bullets: P.bullets, color: P.color })); }
        world.zones.push(new BossGate(p.x, p.y - 44, Math.PI / 2, P.delay / spd, true)); world.hazards.push(new Hazard(p.x, p.y, { r: P.radius + 4, delay: P.delay / spd, damage: Math.round(e.damage * P.mult), bullets: P.bullets, color: '#ffffff' })); // 내 자리에도 큰 보검
        SFX.play('gate', 0.12); }
      return d.w >= P.waves && d.t >= P.delay / spd;
    }
  },
  // 왕의 사슬: 사방의 문에서 사슬이 뻗어 와 내 자리를 조임 → 걸리면 몸이 무거워진 채 일제 개방 칼날이 쏟아짐
  kingChain: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt;
      if (!d.cast) { const gates = [];
        for (let i = 0; i < P.gates; i++) { const a = i / P.gates * TAU + Math.random(), gx = p.x + Math.cos(a) * P.radius, gy = p.y + Math.sin(a) * P.radius * 0.7 - 10; gates.push({ x: gx, y: gy }); world.zones.push(new BossGate(gx, gy, Math.atan2(p.y - gy, p.x - gx), P.delay / spd + 0.6, false)); }
        d.cast = new KingChainCast(gates, p.x, p.y, P.delay / spd, P.r, Math.round(e.damage * P.mult), P.bind); world.zones.push(d.cast); SFX.play('gate', 0.2); d.t = 0; return false; }
      if (!d.cast.hit) return false;
      if (!d.follow) { d.follow = true; d.t = 0; d.ok = d.cast.caught.length > 0; if (!d.ok) return true;
        const tgt = d.cast.caught[0]; world.announceBossSkill && P.name2 && world.announceBossSkill(e, P.name2); d.gates = [];
        for (let i = 0; i < P.follow; i++) { const a = -Math.PI / 2 + (i - (P.follow - 1) / 2) * 0.35, gx = e.x + Math.cos(a) * 40, gy = e.y - 20 + Math.sin(a) * 26; const G = new BossGate(gx, gy, Math.atan2(tgt.y - gy, tgt.x - gx), 0.9, true); world.zones.push(G); d.gates.push(G); } return false; }
      if (d.t >= 0.45 / spd && !d.fired) { d.fired = true; for (const G of d.gates) { const a = Math.atan2(p.y - G.y, p.x - G.x); for (const k of [-0.06, 0, 0.06]) bladeShot(world, G.x, G.y, a + k, P.speed, Math.round(e.damage * P.mult), '#ffffff', 5); } SFX.play('heavy', 0.05); world.addShake(0.2, 4); }
      return d.fired && d.t >= 0.8 / spd;
    }
  },
  // 궁극기 — 왕의 보물고, 전부 개방: 방 둘레 벽 앞에 문이 빼곡히 열리고, 쉬지 않고 칼날이 쏟아짐 (하늘에서는 보검의 비)
  gateStorm: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt;
      if (!d.gates) { const R = e.room, x0 = R ? (R.x0 + 1.5) * TILE : e.x - 160, x1 = R ? (R.x0 + R.w - 1.5) * TILE : e.x + 160, y0 = R ? (R.y0 + 1.5) * TILE : e.y - 110, y1 = R ? (R.y0 + R.h - 1.5) * TILE : e.y + 110; d.gates = [];
        for (let i = 0; i < P.gates; i++) { const u = i / P.gates, per = 2 * (x1 - x0) + 2 * (y1 - y0), q = u * per; let x, y;
          if (q < x1 - x0) { x = x0 + q; y = y0; } else if (q < (x1 - x0) + (y1 - y0)) { x = x1; y = y0 + q - (x1 - x0); } else if (q < 2 * (x1 - x0) + (y1 - y0)) { x = x1 - (q - (x1 - x0) - (y1 - y0)); y = y1; } else { x = x0; y = y1 - (q - 2 * (x1 - x0) - (y1 - y0)); }
          const G = new BossGate(x, y, 0, P.duration / spd + 0.8, false); world.zones.push(G); d.gates.push(G); }
        d.next = 0.8; d.rain = 0; world.screenFlash = 0.3; world.flashColor = '255,216,74'; world.addShake(0.4, 5); SFX.play('gate', 0.6); return false; }
      for (const G of d.gates) G.ang = Math.atan2(p.y - G.y, p.x - G.x);
      if (d.t >= d.next / spd && d.t < (P.duration + 0.8) / spd) { d.next += P.interval;
        for (let k = 0; k < P.per; k++) { const G = d.gates[randInt(0, d.gates.length - 1)], a = Math.atan2(p.y - G.y, p.x - G.x) + (Math.random() - 0.5) * P.jitter;
          bladeShot(world, G.x, G.y, a, P.speed, Math.round(e.damage * P.mult), Math.random() < 0.3 ? '#ffffff' : P.color, 5); world.effects.spark(G.x, G.y, '#fff4c0'); } }
      d.rain += dt; if (d.rain >= P.rainEvery / spd && d.t < (P.duration + 0.8) / spd) { d.rain = 0; const x = p.x + randInt(-60, 60), y = p.y + randInt(-40, 40); world.zones.push(new BossGate(x, y - 44, Math.PI / 2, 0.7 / spd, false)); world.hazards.push(new Hazard(x, y, { r: 20, delay: 0.7 / spd, damage: Math.round(e.damage * P.mult), bullets: 0, color: P.color })); }
      return d.t >= (P.duration + 1.4) / spd;
    }
  },
  // 마지막 페이즈 전용 — 태초를 가르는 일격: 붉은 소용돌이를 두른 원통형 검이 회전하며 힘을 모음 → 방 끝까지 가르는 일격 (엑셀수스와 같은 판정) → 공간이 찢어지며 원형 충격
  worldCleave: {
    begin(e, world, ctx) { BOSS_PATTERNS.excelsus.begin(e, world, ctx); },
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, fx = world.effects;
      if ((d.t || 0) < P.charge) for (let k = 0; k < 3; k++) { const a = (d.t || 0) * 9 + k * TAU / 3, q = 26 - 16 * ((d.t || 0) / P.charge); fx.part(e.x + Math.cos(a) * q, e.y - 12 + Math.sin(a) * q * 0.6, -Math.sin(a) * 60, Math.cos(a) * 40, { color: k ? '#ff3a2a' : '#1a0a0a', life: 0.35, size: 2.5, size2: 0, drag: 2 }); }
      const done = BOSS_PATTERNS.excelsus.update(e, dt, world, ctx, spd);
      if (d.fired && !d.rift) { d.rift = true; for (let i = 0; i < P.riftN; i++) { const a = i / P.riftN * TAU; world.hazards.push(new Hazard(e.x + Math.cos(a) * P.riftR, e.y + Math.sin(a) * P.riftR * 0.7, { r: 20, delay: 0.5, damage: e.damage, bullets: 5, color: '#ff3a2a' })); } }
      return done;
    }
  },
  roundtable: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt;
      if (d.st === undefined) { d.st = 'rise'; d.cx = p.x; d.cy = p.y; d.a0 = Math.random() * TAU; d.gap = randInt(0, P.swords - 1); d.swords = []; d.k = 0; d.t = 0;
        for (let i = 0; i < P.swords; i++) { if (i === d.gap) { d.swords.push(null); continue; } const a = d.a0 + i * TAU / P.swords, blades = [];
          for (let j = 0; j < 3; j++) { const rr = P.radius + j * 7, b = new EnemyBullet(d.cx + Math.cos(a) * rr, d.cy + Math.sin(a) * rr, 0, 0, Math.round(e.damage * P.mult), j === 0 ? '#ffffff' : P.color, j === 0 ? 4 : 3); b.life = P.rise + P.swords * P.interval + 2; world.enemyBullets.push(b); blades.push(b); }
          d.swords.push({ a, blades }); fx.ring(d.cx + Math.cos(a) * P.radius, d.cy + Math.sin(a) * P.radius, 8, P.color); }
        fx.ring(d.cx, d.cy, P.radius, '#ffe9a0'); fx.ring(d.cx, d.cy, P.radius + 14, '#ffffff'); SFX.play('skill', 0.05); world.addShake(0.15, 3); return false; }
      if (d.st === 'rise') { if (d.t >= P.rise / spd) { d.st = 'fire'; d.t = P.interval; } return false; }
      if (d.st === 'fire') { /* 시계 방향으로 한 자루씩 중심을 향해 */
        if (d.t >= P.interval / spd) { d.t = 0; let S = null; while (d.k < P.swords && !(S = d.swords[d.k])) d.k++;
          if (S) { const vx = -Math.cos(S.a) * P.speed, vy = -Math.sin(S.a) * P.speed; for (const b of S.blades) if (b.alive) { b.vx = vx; b.vy = vy; b.life = 2.5; }
            fx.slash(S.blades[0].x, S.blades[0].y, S.a + Math.PI, 18, 0.8, '#fff4c0'); SFX.play('swing', 0.03); d.k++; }
          if (d.k >= P.swords) { d.st = 'oath'; d.t = 0; world.hazards.push(new Hazard(d.cx, d.cy, { r: P.blastR, delay: P.oathDelay / spd, damage: Math.round(e.damage * P.mult * 1.3), color: '#ff5a5a' })); } }
        return false; }
      if (d.st === 'oath') { if (d.t < P.oathDelay / spd) return false; /* 맹세의 일격: 중심에서 원형 탄 */
        for (let i = 0; i < P.ring; i++) { const a = i * TAU / P.ring + (d.a0 || 0); world.enemyShoot(d.cx, d.cy, a, P.speed * 0.6, Math.round(e.damage * P.mult), i % 2 ? '#ffffff' : P.color, 4); }
        fx.ring(d.cx, d.cy, P.blastR, '#ffffff'); fx.ring(d.cx, d.cy, P.blastR * 1.6, P.color); if (fx.rays) fx.rays(d.cx, d.cy, '#fff4c0', 14, P.blastR * 2, 0.5); world.addShake(0.3, 6); SFX.play('heavy', 0.05); return true; }
      return false;
    }
  },
  // 엑스칼리버 엑셀수스 (아서 왕 마지막 페이즈 전용 보구): 하늘로 거대한 빛기둥들을 세우며 오래 빛을 모음(조준선이 따라오다 마지막에 붉게 고정) → 방 끝까지 관통하는 초거대 일격(맞으면 치명적)
  //  → 곧이어 양옆으로 비스듬히 빛의 충격파 두 줄기 + 원형 빛탄. 쓰는 동안 페이즈 전환 없음
  excelsus: {
    begin(e, world, ctx) { const a = Math.atan2(ctx.dy, ctx.dx); e.pd.ang = a; e.laser = { angs: [a], width: 8, color: e.pat.color, live: false }; },
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (!e.laser && !d.fired) e.laser = { angs: [d.ang], width: 8, color: P.color, live: false };
      if (d.t < P.charge) {
        if (!d.pillars) { d.pillars = true; fx.skyBeam(e.x, e.y, '#ffffff', 0, 16); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; fx.skyBeam(e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 40, '#fff4c0', 0.1 + i * 0.12, 6); } world.screenFlash = 0.15; world.flashColor = '255,240,190'; SFX.play('excal'); }
        if (d.t < P.charge - P.lockT) { const want = Math.atan2(p.y - e.y, p.x - e.x); let df = want - d.ang; df = Math.atan2(Math.sin(df), Math.cos(df)); d.ang += clamp(df, -2.2 * dt, 2.2 * dt); }
        e.laser.angs[0] = d.ang; e.laser.width = 8 + 14 * d.t / P.charge; e.laser.live = false; e.laser.color = d.t >= P.charge - P.lockT ? '#ff3a3a' : P.color;
        world.addShake(0.05, 1 + 3 * d.t / P.charge);
        for (let k = 0; k < 2; k++) if (Math.random() < 0.9) { const a = Math.random() * TAU, q = 30 + Math.random() * 40; fx.part(e.x + Math.cos(a) * q, e.y - 12 + Math.sin(a) * q, -Math.cos(a) * q * 3, -Math.sin(a) * q * 3, { color: Math.random() < 0.5 ? '#ffffff' : P.color, life: 0.3, size: 2.5, size2: 0, drag: 0, add: true }); }
        return false;
      }
      if (!d.fired) { d.fired = true; e.laser.live = true; e.laser.width = P.width; e.laser.color = '#ffffff'; /* 초거대 일격 */
        const len = beamLength(e, d.ang, world.map), ex = e.x + Math.cos(d.ang) * len, ey = e.y + Math.sin(d.ang) * len;
        world.eachTarget((q) => { if (segmentCircleHit(e.x, e.y, ex, ey, q.x, q.y, P.width + q.half) >= 0) world.damagePlayer(Math.round(e.damage * P.mult)); });
        for (let k = 30; k < len; k += 30) world.hazards.push(new Hazard(e.x + Math.cos(d.ang) * k, e.y + Math.sin(d.ang) * k, { r: 22, delay: 0.2 + k / len * 0.25, damage: e.damage, bullets: 4, color: P.color }));
        fx.rays(e.x, e.y, '#ffffff', 28, 160, 1); fx.ring(e.x, e.y, 80, '#ffffff'); world.screenFlash = 0.5; world.flashColor = '255,250,220'; world.addShake(0.9, 14); world.hitStop(0.14); SFX.play('excal'); SFX.play('explode'); }
      if (!d.side && d.t >= P.charge + P.show) { d.side = true; e.laser = null; /* 양옆 충격파 + 원형 빛탄 */
        for (const s of [-1, 1]) { const a = d.ang + s * P.sideAng, len = beamLength(e, a, world.map); for (let k = P.sideStep; k < len; k += P.sideStep) world.hazards.push(new Hazard(e.x + Math.cos(a) * k, e.y + Math.sin(a) * k, { r: 20, delay: 0.5 + k / len * 0.3, damage: Math.round(e.damage * 1.3), bullets: 3, color: P.color })); }
        for (let i = 0; i < P.ring; i++) world.enemyShoot(e.x, e.y, i * TAU / P.ring + 0.05, e.def.bulletSpeed * 0.9, e.damage, i % 2 ? P.color : '#ffffff', 4); }
      if (d.t >= P.charge + P.show + 1.4) { d.lock = false; return true; }
      return false;
    }
  },
  // 엑스칼리버 (아서 왕의 보구): 하늘로 빛기둥을 세우며 검에 빛을 모음(조준선이 따라오다 마지막에 고정) → 굵은 황금 광선이 플레이어를 천천히 쫓으며 휩쓸고, 끝나면 광선 끝에서 대폭발. 쓰는 동안 페이즈 전환 없음
  excalibur: {
    begin(e, world, ctx) { const a = Math.atan2(ctx.dy, ctx.dx); e.pd.ang = a; e.laser = { angs: [a], width: 6, color: e.pat.color, live: false }; },
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (!e.laser) e.laser = { angs: [d.ang], width: 6, color: P.color, live: false };
      const want = Math.atan2(p.y - e.y, p.x - e.x); let df = want - d.ang; df = Math.atan2(Math.sin(df), Math.cos(df));
      if (d.t < P.charge) {
        if (!d.pillar) { d.pillar = true; fx.skyBeam(e.x, e.y, '#fff4c0', 0, 12); fx.rays(e.x, e.y, P.color, 18, 90, 0.8); SFX.play('excal'); }
        if (d.t < P.charge - P.lockT) d.ang += clamp(df, -2.5 * dt, 2.5 * dt);
        e.laser.angs[0] = d.ang; e.laser.width = 6 + 10 * d.t / P.charge; e.laser.live = false; e.laser.color = d.t >= P.charge - P.lockT ? '#ff5a5a' : P.color;
        if (Math.random() < 0.9) { const a = Math.random() * TAU, q = 26 + Math.random() * 20; fx.part(e.x + Math.cos(a) * q, e.y - 10 + Math.sin(a) * q, -Math.cos(a) * q * 3, -Math.sin(a) * q * 3, { color: Math.random() < 0.5 ? '#ffffff' : P.color, life: 0.3, size: 2, size2: 0, drag: 0, add: true }); }
        return false;
      }
      if (d.t < P.charge + P.duration) {
        if (!d.fired) { d.fired = true; world.screenFlash = 0.35; world.flashColor = '255,240,190'; world.addShake(0.6, 9); world.hitStop(0.08); SFX.play('excal'); }
        d.ang += clamp(df, -P.turn * dt, P.turn * dt); e.laser.angs[0] = d.ang; e.laser.width = P.width; e.laser.live = true; e.laser.color = P.color;
        const len = beamLength(e, d.ang, world.map), ex = e.x + Math.cos(d.ang) * len, ey = e.y + Math.sin(d.ang) * len; d.ex = ex; d.ey = ey;
        world.eachTarget((q) => { if (segmentCircleHit(e.x, e.y, ex, ey, q.x, q.y, P.width + q.half) >= 0) world.damagePlayer(Math.round(e.damage * P.mult)); });
        if (Math.random() < 0.7) { const k = Math.random() * len; fx.part(e.x + Math.cos(d.ang) * k, e.y + Math.sin(d.ang) * k, randInt(-50, 50), randInt(-50, 50), { color: '#fff4c0', life: 0.3, size: 2, size2: 0, drag: 2, add: true }); }
        if (Math.floor(d.t * 10) !== Math.floor((d.t - dt) * 10)) SFX.play('beam', 0.08);
        return false;
      }
      if (!d.boom) { d.boom = true; e.laser = null; world.hazards.push(new Hazard(d.ex || e.x, d.ey || e.y, { r: P.radius, delay: 0.35, damage: Math.round(e.damage * 1.5), bullets: P.bullets, color: P.color })); }
      if (d.t >= P.charge + P.duration + 0.8) { d.lock = false; return true; }
      return false;
    }
  },
  // 협공 (베디비어 2페이즈~): 은빛 팔과 검에서 두 줄기의 탄이 부채꼴 양 끝에서 동시에 출발해 플레이어 쪽으로 좁혀 옴 — 줄기마다 짧은 틈이 있어 그 틈으로 빠져나가야 함, 끝날 때 원형 탄
  pincer: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player;
      if (d.k === undefined) { d.k = 0; d.st = 0; d.fire = 0; d.base = Math.atan2(p.y - e.y, p.x - e.x); d.gap = 0.3 + Math.random() * 0.4; }
      d.st += dt * spd; d.fire -= dt;
      const u = Math.min(1, d.st / P.time), off = (1 - u) * P.arc / 2, inGap = Math.abs(u - d.gap) < P.gapW;
      while (d.fire <= 0) { d.fire += P.interval; if (inGap) continue;
        world.enemyShoot(e.x, e.y, d.base - off, P.speed, e.damage, P.color, 3); world.enemyShoot(e.x, e.y, d.base + off, P.speed, e.damage, '#ffffff', 3); }
      if (u >= 1) { for (let i = 0; i < P.ring; i++) world.enemyShoot(e.x, e.y, i * TAU / P.ring + d.k * 0.2, e.def.bulletSpeed * 0.85, e.damage, P.color, 3);
        world.effects.ring(e.x, e.y, 22, P.color); d.k++; d.st = 0; d.base = Math.atan2(p.y - e.y, p.x - e.x); d.gap = 0.25 + Math.random() * 0.5; }
      return d.k >= P.sweeps;
    }
  },
  // 은빛 연격 (베디비어 2페이즈~): 플레이어 둘레 여기저기로 순간이동하며, 나타날 때마다 플레이어 쪽으로 빈틈 하나 있는 탄의 벽을 날림 — 사방에서 연달아 날아오는 벽
  silverchase: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room, fx = world.effects; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.blinks) {
        d.a0 = d.a0 ?? Math.random() * TAU; const a = d.a0 + d.shots * (TAU * 0.38) + Math.random() * 0.5;
        const x = clamp(p.x + Math.cos(a) * P.ring, r.x0 * TILE + 20, (r.x0 + r.w) * TILE - 20), y = clamp(p.y + Math.sin(a) * P.ring, r.y0 * TILE + 20, (r.y0 + r.h) * TILE - 20);
        fx.ring(e.x, e.y, 14, '#ffffff'); if (!world.map.isSolidAt(x, y)) { e.x = x; e.y = y; } fx.ring(e.x, e.y, 22, P.color);
        const ang = Math.atan2(p.y - e.y, p.x - e.x), nx = -Math.sin(ang), ny = Math.cos(ang), h = (P.width - 1) / 2, gap = randInt(1, P.width - P.gapN - 1);
        for (let i = 0; i < P.width; i++) { if (i >= gap && i < gap + P.gapN) continue; const o = (i - h) * P.step;
          const b = new EnemyBullet(e.x + nx * o, e.y + ny * o, Math.cos(ang) * P.speed, Math.sin(ang) * P.speed, e.damage, i % 2 ? P.color : '#ffffff', 4); b.life = 3.5; world.enemyBullets.push(b); }
        SFX.play('swing', 0.04); d.shots++; d.timer = P.interval / spd;
      }
      return d.shots >= P.blinks && d.timer <= 0;
    }
  },
  // 은빛 팔 휩쓸기 (베디비어 2페이즈~): 은빛 팔을 휘둘러, 플레이어 쪽 부채꼴을 쓸고 지나가며 탄을 흩뿌림 — 쓸 때마다 방향이 바뀜
  armsweep: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player;
      if (d.k === undefined) { d.k = 0; d.st = 0; d.fire = 0; d.base = Math.atan2(p.y - e.y, p.x - e.x); }
      d.st += dt * spd; d.fire -= dt;
      const u = Math.min(1, d.st / P.time), dir = d.k % 2 ? -1 : 1, a = d.base + dir * (u - 0.5) * P.arc;
      while (d.fire <= 0) { d.fire += P.interval; world.enemyShoot(e.x, e.y, a, P.speed, e.damage, P.color, 3); world.enemyShoot(e.x, e.y, a, P.speed * 0.65, e.damage, '#ffffff', 3); }
      if (u >= 1) { d.k++; d.st = 0; d.base = Math.atan2(p.y - e.y, p.x - e.x); world.effects.ring(e.x, e.y, 18, P.color); }
      return d.k >= P.sweeps;
    }
  },
  // 데드 엔드 아가트람 (베디비어의 보구, 3페이즈 해방): 은빛 팔에 빛을 모으며 조준선이 따라오다가(점점 굵어짐) 마지막 순간 고정 → 한 번의 거대한 일격이 방 끝까지 관통, 지나간 자리에 충격파. 쓰는 동안 페이즈 전환 없음
  deadend: {
    begin(e, world, ctx) { const a = Math.atan2(ctx.dy, ctx.dx); e.pd.ang = a; e.laser = { angs: [a], width: 6, color: e.pat.color, live: false }; },
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (!e.laser) e.laser = { angs: [d.ang], width: 6, color: P.color, live: false };
      if (d.t < P.charge) {
        if (d.t < P.charge - P.lockT) { const want = Math.atan2(p.y - e.y, p.x - e.x); let df = want - d.ang; df = Math.atan2(Math.sin(df), Math.cos(df)); d.ang += clamp(df, -3 * dt, 3 * dt); }
        e.laser.angs[0] = d.ang; e.laser.width = P.width * (0.2 + 0.6 * d.t / P.charge); e.laser.live = false; e.laser.color = d.t >= P.charge - P.lockT ? '#ff5a5a' : P.color;
        const ax = e.x + (e.face < 0 ? -8 : 8), ay = e.y - 8; if (Math.random() < 0.9) { const a = Math.random() * TAU, q = 20 + Math.random() * 18; fx.part(ax + Math.cos(a) * q, ay + Math.sin(a) * q, -Math.cos(a) * q * 3, -Math.sin(a) * q * 3, { color: Math.random() < 0.5 ? '#ffffff' : P.color, life: 0.3, size: 2, size2: 0, drag: 0, add: true }); }
        return false;
      }
      if (!d.fired) { d.fired = true; e.laser.live = true; e.laser.width = P.width; e.laser.color = '#ffffff'; /* 일격 */
        const len = beamLength(e, d.ang, world.map), ex = e.x + Math.cos(d.ang) * len, ey = e.y + Math.sin(d.ang) * len;
        world.eachTarget((q) => { if (segmentCircleHit(e.x, e.y, ex, ey, q.x, q.y, P.width + q.half) >= 0) world.damagePlayer(Math.round(e.damage * P.mult)); });
        for (let k = P.step; k < len; k += P.step) world.hazards.push(new Hazard(e.x + Math.cos(d.ang) * k, e.y + Math.sin(d.ang) * k, { r: 16, delay: 0.25 + k / len * 0.3, damage: e.damage, bullets: P.shock, color: P.color }));
        fx.rays(e.x, e.y, '#ffffff', 22, 120, 0.8); world.screenFlash = 0.35; world.flashColor = '200,230,255'; world.addShake(0.6, 10); world.hitStop(0.1); SFX.play('excal'); }
      if (d.t >= P.charge + P.show) e.laser = null;
      if (d.t >= P.charge + P.show + 0.7) { d.lock = false; return true; }
      return false;
    }
  },
  // 감시의 눈 (아그라베인): 방 곳곳(플레이어에게서 조금 떨어진 곳)에 떠오른 눈이 한동안 조준 사격 — 부술 수 있음. 그동안 보스도 조준 사격
  watchers: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room; d.timer -= dt;
      if (!d.placed) { d.placed = true; d.timer = 0.6;
        for (let i = 0; i < P.eyes; i++) { const a = i * TAU / P.eyes + Math.random() * 0.6, q = 90 + Math.random() * 40;
          const x = clamp(p.x + Math.cos(a) * q, r.x0 * TILE + 20, (r.x0 + r.w) * TILE - 20), y = clamp(p.y + Math.sin(a) * q, r.y0 * TILE + 20, (r.y0 + r.h) * TILE - 20);
          world.hazards.push(new WatchEye(x, y, { delay: P.life, hp: P.hp * world.scale.hp, interval: P.interval, volley: P.volley, spread: P.spread, speed: P.speed, dmg: e.damage, color: P.color })); world.effects.ring(x, y, 14, P.color); }
        SFX.play('magic', 0.05); }
      if (d.timer <= 0 && d.shots < 3) { const base = Math.atan2(p.y - e.y, p.x - e.x); for (let i = 0; i < 5; i++) world.enemyShoot(e.x, e.y, base + (i - 2) * 0.1, e.def.bulletSpeed, e.damage, P.color, 3); d.shots++; d.timer = 0.45 / spd; }
      return d.shots >= 3 && d.timer <= 0;
    }
  },
  // 단죄의 철완 (아그라베인의 보구): 손을 들어 방 가장자리에 감시의 눈을 가득 띄우고(빠르게 쏨), 그동안 플레이어 자리에 거대한 철퇴를 세 번 내리침. 쓰는 동안 페이즈 전환 없음
  ironhand: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (d.t < P.charge) { if (Math.random() < 0.7) { const a = Math.random() * TAU; fx.part(e.x + Math.cos(a) * 24, e.y + Math.sin(a) * 24, -Math.cos(a) * 50, -Math.sin(a) * 50, { color: P.color, life: 0.35, size: 2, size2: 0, drag: 0, add: true }); } return false; }
      if (!d.placed) { d.placed = true; d.slamT = 0.4; d.slams = 0; const c = world.map.tileCenter(r.cx, r.cy), R = Math.min(r.w, r.h) * TILE / 2 - 24;
        for (let i = 0; i < P.eyes; i++) { const a = i * TAU / P.eyes; world.hazards.push(new WatchEye(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R * 0.8, { delay: P.life, hp: P.hp * world.scale.hp, interval: P.interval, volley: P.volley, spread: P.spread, speed: P.speed, dmg: e.damage, color: P.color })); }
        fx.rays(e.x, e.y, P.color, 16, 90, 0.7); world.addShake(0.25, 4); SFX.play('excal'); }
      d.slamT -= dt; if (d.slamT <= 0 && d.slams < P.slams) { d.slamT = P.slamEvery / spd; d.slams++;
        world.hazards.push(new Hazard(p.x, p.y, { r: P.radius, delay: 0.7, damage: Math.round(e.damage * 1.5), bullets: P.bullets, color: '#ff5a3a' })); fx.ring(e.x, e.y, 20, P.color); }
      if (d.slams >= P.slams && d.t >= P.charge + P.slams * P.slamEvery / spd + 0.9) { d.lock = false; return true; }
      return false;
    }
  },
  // 반격 자세 (랜슬롯): 검을 세우고 멈춤 — 그동안 맞으면 피해 절반 + 플레이어 뒤로 순간이동해 사방 검기와 발밑 베기로 반격, 아무도 안 때리면 앞으로 부채꼴 검기만
  riposte: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room, fx = world.effects; d.t = (d.t || 0) + dt;
      if (!d.init) { d.init = true; e.riposteT = P.stance; e.riposteHit = false; fx.text(e.x, e.y - e.radius - 14, '반격 자세', '#bcd8ff'); SFX.play('shield', 0.1); }
      if (!d.done && e.riposteHit) { d.done = true; e.riposteT = 0; e.riposteHit = false; /* 반격 */
        const a = Math.atan2(p.y - e.y, p.x - e.x), x = clamp(p.x + Math.cos(a) * 30, r.x0 * TILE + 16, (r.x0 + r.w) * TILE - 16), y = clamp(p.y + Math.sin(a) * 30, r.y0 * TILE + 16, (r.y0 + r.h) * TILE - 16);
        fx.ring(e.x, e.y, 18, '#ffffff'); if (!world.map.isSolidAt(x, y)) { e.x = x; e.y = y; } fx.ring(e.x, e.y, 26, P.color); fx.text(e.x, e.y - e.radius - 14, '반격!', '#ffffff', true);
        world.hazards.push(new Hazard(p.x, p.y, { r: P.radius, delay: 0.3, damage: Math.round(e.damage * 1.4), bullets: 0, color: P.color }));
        for (let i = 0; i < P.burst; i++) world.enemyShoot(e.x, e.y, i * TAU / P.burst, e.def.bulletSpeed * 1.1, e.damage, P.color, 3);
        world.addShake(0.25, 4); SFX.play('heavy', 0.05); d.endAt = d.t + 0.55; }
      if (!d.done && d.t >= P.stance / spd) { d.done = true; e.riposteT = 0; /* 아무도 안 때림: 앞으로 검기 */
        const base = Math.atan2(p.y - e.y, p.x - e.x), h = (P.fan - 1) / 2; for (let i = 0; i < P.fan; i++) world.enemyShoot(e.x, e.y, base + (i - h) * 0.09, e.def.bulletSpeed, e.damage, '#bcd8ff', 3);
        d.endAt = d.t + 0.3; }
      return !!d.endAt && d.t >= d.endAt;
    }
  },
  // 아론다이트 (랜슬롯의 보구): 푸른 빛을 모은 뒤 플레이어 쪽으로 세 번 돌진(지나간 자리에 푸른 칼날이 차례로 솟고 멈출 때 부채꼴 검기) → 방 가운데서 X자 광선을 돌림. 쓰는 동안 페이즈 전환 없음
  arondight: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (!d.st) { d.st = 'charge'; d.pt = 0; d.n = 0; }
      d.pt += dt;
      if (d.st === 'charge') { if (Math.random() < 0.8) { const a = Math.random() * TAU; fx.part(e.x + Math.cos(a) * 24, e.y + Math.sin(a) * 24, -Math.cos(a) * 60, -Math.sin(a) * 60, { color: Math.random() < 0.5 ? P.color : '#ffffff', life: 0.35, size: 2, size2: 0, drag: 0, add: true }); }
        if (d.pt >= P.charge) { d.st = 'aim'; d.pt = 0; } return false; }
      if (d.st === 'aim') { const dx = p.x - e.x, dy = p.y - e.y, dd = Math.hypot(dx, dy) || 1; e.dashX = dx / dd; e.dashY = dy / dd; if (d.pt >= 0.22) { d.st = 'dash'; d.pt = 0; d.went = 0; d.last = 0; e.hits = null; } return false; }
      if (d.st === 'dash') {
        const mv = P.speed * dt, hit = moveAndCollide(e, e.dashX * mv, e.dashY * mv, world.map); d.went += mv;
        world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 3) world.hitOnce(e, 'hits', q, () => world.damagePlayer(Math.round(e.damage * 1.3))); });
        if (d.went - d.last >= P.step) { d.last = d.went; world.hazards.push(new Hazard(e.x, e.y, { r: P.radius, delay: P.delay, damage: e.damage, bullets: 0, color: P.color })); }
        if (hit.x || hit.y || d.went >= P.dist || d.pt > 0.7) { const base = Math.atan2(p.y - e.y, p.x - e.x), h = (P.fan - 1) / 2;
          for (let i = 0; i < P.fan; i++) world.enemyShoot(e.x, e.y, base + (i - h) * 0.1, e.def.bulletSpeed * 1.1, e.damage, '#bcd8ff', 3);
          world.effects.ring(e.x, e.y, 24, P.color); world.addShake(0.15, 3); d.n++; d.pt = 0; d.st = d.n >= P.dashes ? 'center' : 'aim'; }
        return false; }
      if (d.st === 'center') { const c = world.map.tileCenter(r.cx, r.cy); fx.ring(e.x, e.y, 16, '#ffffff'); e.x = c.x; e.y = c.y; fx.ring(e.x, e.y, 30, P.color);
        d.ang = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 4; e.laser = { angs: [], width: P.width, color: P.color, live: false }; d.st = 'warn'; d.pt = 0; }
      const angs = []; for (let i = 0; i < P.beams; i++) angs.push(d.ang + i * TAU / P.beams);
      if (d.st === 'warn') { e.laser.angs = angs; e.laser.live = false; if (d.pt >= 0.6) { d.st = 'beam'; d.pt = 0; SFX.play('excal'); world.addShake(0.3, 5); } return false; }
      if (d.st === 'beam') { d.ang += P.spin * dt; e.laser.angs = angs; e.laser.live = true;
        const segs = angs.map((a) => { const len = beamLength(e, a, world.map); return [e.x + Math.cos(a) * len, e.y + Math.sin(a) * len]; });
        world.eachTarget((q) => { for (const [ex, ey] of segs) if (segmentCircleHit(e.x, e.y, ex, ey, q.x, q.y, P.width + q.half) >= 0) { world.damagePlayer(Math.round(e.damage * 1.2)); break; } });
        if (Math.floor(d.pt * 10) !== Math.floor((d.pt - dt) * 10)) SFX.play('beam', 0.08);
        if (d.pt >= P.beamTime) { e.laser = null; d.lock = false; return true; } }
      return false;
    }
  },
  // 방벽 행진 (갤러해드): 방패가 향한 방향으로, 가로로 늘어선 탄의 벽이 여러 겹 밀려옴 — 겹마다 다른 자리에 빈틈
  rampart: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.waves) {
        const a = e.shieldAng != null ? e.shieldAng : Math.atan2(world.player.y - e.y, world.player.x - e.x), nx = -Math.sin(a), ny = Math.cos(a), h = (P.width - 1) / 2, gap = randInt(1, P.width - P.gapN - 1);
        for (let i = 0; i < P.width; i++) { if (i >= gap && i < gap + P.gapN) continue; const o = (i - h) * P.step;
          const b = new EnemyBullet(e.x + Math.cos(a) * 14 + nx * o, e.y + Math.sin(a) * 14 + ny * o, Math.cos(a) * P.speed, Math.sin(a) * P.speed, e.damage, P.color, 4); b.life = 4; world.enemyBullets.push(b); }
        world.effects.ring(e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14, 18, P.color); d.shots++; d.timer = P.interval / spd;
      }
      return d.shots >= P.waves && d.timer <= 0;
    }
  },
  // 로드 카멜롯 (갤러해드의 보구, 방어 스킬): 방패를 세워 성벽 돔을 펼침 — 펼칠 때 가까이 있던 플레이어를 피해 없이 밀어내고, 돔이 서 있는 동안 갤러해드는 어떤 피해도 받지 않으며 돔에 닿는 플레이어의 탄은 막혀 사라짐. 쓰는 동안 페이즈 전환 없음
  perilous: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (d.t < P.charge) { e.fortress = { r: P.radius, k: d.t / P.charge * 0.4 }; if (Math.random() < 0.7) { const a = Math.random() * TAU; fx.part(e.x + Math.cos(a) * P.radius, e.y + Math.sin(a) * P.radius * 0.8, -Math.cos(a) * 60, -Math.sin(a) * 60, { color: '#ffffff', life: 0.35, size: 2, size2: 0, drag: 0, add: true }); } return false; }
      const T = d.t - P.charge;
      if (!d.on) { d.on = true; fx.rays(e.x, e.y, '#ffffff', 18, P.radius + 30, 0.7); fx.ring(e.x, e.y, P.radius, '#ffffff'); world.addShake(0.25, 4); SFX.play('shield', 0.2);
        world.eachTarget((q) => { const dx = q.x - e.x, dy = q.y - e.y, dd = Math.hypot(dx, dy) || 1; if (dd < P.radius + q.half) moveAndCollide(q, dx / dd * (P.radius + q.half + 6 - dd), dy / dd * (P.radius + q.half + 6 - dd), world.map); }); } /* 성벽이 솟으며 밀어냄 (피해 없음) */
      if (T < P.duration) {
        e.negateT = Math.max(e.negateT || 0, 0.15); e.fortress = { r: P.radius, k: Math.min(1, 0.4 + T * 3) }; /* 성채: 피해 무효 */
        for (const q of world.projectiles) if (q.alive && Math.hypot(q.x - e.x, q.y - e.y) < P.radius) { q.alive = false; if (Math.random() < 0.5) fx.spark(q.x, q.y, '#ffffff'); } /* 돔에 닿은 탄은 막힘 */
        return false;
      }
      e.fortress = null;
      if (!d.done) { d.done = true; fx.ring(e.x, e.y, P.radius, '#e8ecff'); }
      if (T >= P.duration + 0.4) { d.lock = false; return true; }
      return false;
    }
  },

  // 부정의 원 (가레스): 플레이어 자리와 그 주변에 하얀 원(안에서는 공격·스킬 불가)을 깔고, 원 밖으로 피하는 동안 조준 사격
  denyfield: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room; d.timer -= dt;
      if (!d.placed) { d.placed = true; d.timer = 0.5;
        for (let i = 0; i < P.zones; i++) { const a = Math.random() * TAU, q = i === 0 ? 0 : 30 + Math.random() * P.around;
          const x = clamp(p.x + Math.cos(a) * q, r.x0 * TILE + P.zr, (r.x0 + r.w) * TILE - P.zr), y = clamp(p.y + Math.sin(a) * q, r.y0 * TILE + P.zr, (r.y0 + r.h) * TILE - P.zr);
          world.hazards.push(new DenyZone(x, y, { r: P.zr, delay: P.life, color: P.color })); }
        world.effects.ring(e.x, e.y, 26, '#ffffff'); SFX.play('magic', 0.05); }
      if (d.timer <= 0 && d.shots < P.volleys) { const base = Math.atan2(p.y - e.y, p.x - e.x), h = (P.count - 1) / 2;
        for (let i = 0; i < P.count; i++) world.enemyShoot(e.x, e.y, base + (i - h) * P.spread, e.def.bulletSpeed, e.damage, P.color, 3);
        d.shots++; d.timer = 0.42 / spd; }
      return d.shots >= P.volleys && d.timer <= 0;
    }
  },
  // 보마인 (가레스의 보구, '고운 손'): 빛을 모은 뒤 플레이어 둘레를 돌며 여러 번 순간이동 — 나타날 때마다 부채꼴 사격, 마지막에 사방으로 터짐. 쓰는 동안 페이즈 전환 없음
  beaumains: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      if (d.t < P.charge) { if (Math.random() < 0.7) { const a = Math.random() * TAU; fx.part(e.x + Math.cos(a) * 22, e.y + Math.sin(a) * 22, -Math.cos(a) * 50, -Math.sin(a) * 50, { color: '#ffffff', life: 0.35, size: 2, size2: 0, drag: 0, add: true }); } d.a0 = d.a0 ?? Math.random() * TAU; return false; }
      d.timer = (d.timer ?? 0) - dt;
      if (d.timer <= 0 && d.shots < P.blinks) {
        const a = d.a0 + d.shots * (TAU / P.blinks) * 1.5, x = clamp(p.x + Math.cos(a) * P.ring, r.x0 * TILE + 20, (r.x0 + r.w) * TILE - 20), y = clamp(p.y + Math.sin(a) * P.ring, r.y0 * TILE + 20, (r.y0 + r.h) * TILE - 20);
        fx.ring(e.x, e.y, 16, '#ffffff'); if (!world.map.isSolidAt(x, y)) { e.x = x; e.y = y; }
        fx.ring(e.x, e.y, 22, P.color); SFX.play('swing', 0.04);
        const base = Math.atan2(p.y - e.y, p.x - e.x), h = (P.count - 1) / 2;
        for (let i = 0; i < P.count; i++) world.enemyShoot(e.x, e.y, base + (i - h) * (P.spread / P.count), P.speed, Math.round(e.damage * 1.1), i % 2 ? P.color : '#ffffff', 3);
        d.shots++; d.timer = P.interval / spd;
        if (d.shots >= P.blinks) { d.endAt = d.t + 0.45; }
      }
      if (d.endAt && d.t >= d.endAt && !d.burst) { d.burst = true; for (let i = 0; i < P.final; i++) world.enemyShoot(e.x, e.y, i * TAU / P.final, e.def.bulletSpeed, e.damage, P.color, 4); fx.rays(e.x, e.y, '#ffffff', 16, 80, 0.6); world.addShake(0.25, 4); }
      if (d.burst && d.t >= d.endAt + 0.5) { d.lock = false; return true; }
      return false;
    }
  },
  // 폭주 돌진 (모드레드): 짧게 노린 뒤 플레이어 쪽으로 돌진, 지나간 자리에 붉은 번개가 차례로 떨어지고 멈춘 곳에서 사방으로 탄 — 여러 번 연속
  rampage: {
    begin(e) { e.pd.n = 0; e.pd.phase = 'aim'; e.pd.pt = 0; },
    update(e, dt, world, ctx, spd) {
      const d = e.pd, P = e.pat, p = world.player; d.pt += dt;
      if (d.phase === 'aim') {
        const dx = p.x - e.x, dy = p.y - e.y, dd = Math.hypot(dx, dy) || 1; e.dashX = dx / dd; e.dashY = dy / dd;
        if (d.pt >= P.aim / spd) { d.phase = 'dash'; d.pt = 0; d.went = 0; d.lastStep = 0; e.hits = null; world.effects.ring(e.x, e.y, 16, P.color); }
        return false;
      }
      const mv = P.speed * dt, hit = moveAndCollide(e, e.dashX * mv, e.dashY * mv, world.map); d.went += mv;
      world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 3) world.hitOnce(e, 'hits', q, () => world.damagePlayer(Math.round(e.damage * 1.2))); });
      if (d.went - d.lastStep >= P.step) { d.lastStep = d.went; world.hazards.push(new Hazard(e.x, e.y, { r: P.radius, delay: P.delay, damage: e.damage, bullets: 0, color: P.color })); /* 붉은 번개 자국 */
        world.effects.part(e.x, e.y, randInt(-20, 20), -30, { color: '#ffb0b0', life: 0.3, size: 2, size2: 0, drag: 1, add: true }); }
      if (hit.x || hit.y || d.went >= P.dist || d.pt > 0.7) {
        for (let i = 0; i < P.burst; i++) world.enemyShoot(e.x, e.y, i * TAU / P.burst + Math.random() * 0.3, e.def.bulletSpeed, e.damage, P.color, 3);
        world.addShake(0.15, 3); world.effects.ring(e.x, e.y, 26, P.color); d.n++; d.phase = 'aim'; d.pt = 0;
      }
      return d.n >= P.dashes;
    }
  },
  // 클래런트 (모드레드의 보구): 검을 들어 붉은 번개를 모음(조준선 표시) → 플레이어를 천천히 따라가는 굵은 붉은 광선, 끝나면 광선 자리를 따라 번개가 차례로 떨어짐. 쓰는 동안 페이즈 전환 없음
  clarent: {
    begin(e, world, ctx) { const a = Math.atan2(ctx.dy, ctx.dx); e.pd.ang = a; e.laser = { angs: [a], width: e.pat.width, color: e.pat.color, live: false }; },
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      const want = Math.atan2(p.y - e.y, p.x - e.x); let df = want - d.ang; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU;
      if (d.t < P.charge) { /* 붉은 번개를 모으는 동안 조준선이 플레이어를 따라감 */
        d.ang += clamp(df, -2.5 * dt, 2.5 * dt); e.laser.angs[0] = d.ang; e.laser.live = false;
        if (Math.random() < 0.8) { const a = Math.random() * TAU, q = 24 + Math.random() * 16; fx.part(e.x + Math.cos(a) * q, e.y - 6 + Math.sin(a) * q, -Math.cos(a) * q * 2.5, -Math.sin(a) * q * 2.5, { color: Math.random() < 0.5 ? '#ff3a3a' : '#ffffff', life: 0.3, size: 2, size2: 0, drag: 0, add: true }); }
        return false;
      }
      if (d.t < P.charge + P.duration) { /* 광선: 천천히 따라감 */
        if (!d.fired) { d.fired = true; world.addShake(0.4, 7); world.screenFlash = 0.2; world.flashColor = '255,60,60'; SFX.play('excal'); }
        d.ang += clamp(df, -P.turn * dt, P.turn * dt); e.laser.angs[0] = d.ang; e.laser.live = true;
        const len = beamLength(e, d.ang, world.map), ex = e.x + Math.cos(d.ang) * len, ey = e.y + Math.sin(d.ang) * len; d.len = len;
        world.eachTarget((q) => { if (segmentCircleHit(e.x, e.y, ex, ey, q.x, q.y, P.width + q.half) >= 0) world.damagePlayer(Math.round(e.damage * 1.3)); });
        if (Math.random() < 0.6) { const k = Math.random() * len; fx.part(e.x + Math.cos(d.ang) * k, e.y + Math.sin(d.ang) * k, randInt(-40, 40), randInt(-40, 40), { color: '#ffb0b0', life: 0.25, size: 2, size2: 0, drag: 2, add: true }); }
        if (Math.floor(d.t * 10) !== Math.floor((d.t - dt) * 10)) SFX.play('beam', 0.08);
        return false;
      }
      if (!d.struck) { d.struck = true; e.laser = null; /* 광선 자리를 따라 번개 */
        for (let i = 1; i <= P.strikes; i++) { const k = (d.len || 200) * i / P.strikes; world.hazards.push(new Hazard(e.x + Math.cos(d.ang) * k, e.y + Math.sin(d.ang) * k, { r: P.radius, delay: P.delay + i * 0.04, damage: Math.round(e.damage * 1.1), bullets: P.bullets, color: P.color })); } }
      if (d.t >= P.charge + P.duration + P.delay + 0.6) { d.lock = false; return true; }
      return false;
    }
  },
  // 되돌아오는 고리 (트리스탄): 틈 있는 원형 화살을 쏘고, flip초 뒤 모든 화살이 방향을 뒤집어 보스 쪽으로 되돌아옴 (지나간 틈으로 다시 피해야 함)
  reverse: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.rings) {
        const gapAt = randInt(0, P.count - 1);
        for (let i = 0; i < P.count; i++) { if (((i - gapAt) % P.count + P.count) % P.count < P.gap) continue;
          const a = i * TAU / P.count + d.shots * 0.11, b = new EnemyBullet(e.x, e.y, Math.cos(a) * P.speed, Math.sin(a) * P.speed, e.damage, P.color, 3); b.flipT = P.flip / spd; b.life = 5; world.enemyBullets.push(b); }
        world.effects.ring(e.x, e.y, 22, P.color); d.shots++; d.timer = (P.interval || 0.5) / spd;
      }
      return d.shots >= P.rings && d.timer <= 0;
    }
  },
  // 페일노트 (트리스탄의 보구): 활을 당겨 플레이어를 조준(이동 없음) → 부채꼴 화살 + 플레이어를 끝까지 쫓는 필중의 화살을 여러 번. 쓰는 동안 페이즈 전환 없음
  failnot: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true; d.list = d.list || [];
      if (d.t < P.draw) { /* 조준: 플레이어 위에 붉은 조준선 */
        d.warn = (d.warn || 0) - dt; if (d.warn <= 0) { d.warn = 0.15; fx.ring(p.x, p.y, 14 - d.t * 6, P.color); }
        if (Math.random() < 0.6) { const a = Math.random() * TAU; fx.part(e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, -Math.cos(a) * 50, -Math.sin(a) * 50, { color: P.color, life: 0.35, size: 1.5, size2: 0, drag: 0, add: true }); }
        return false;
      }
      d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.volleys) {
        const base = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = 0; i < P.fan; i++) world.enemyShoot(e.x, e.y, base + (i / (P.fan - 1) - 0.5) * P.spread, P.speed * 1.2, e.damage, '#ffffff', 3);
        for (let i = 0; i < P.homing; i++) { const a = base + (i / (P.homing - 1) - 0.5) * 2.4, b = new EnemyBullet(e.x, e.y, Math.cos(a) * P.speed, Math.sin(a) * P.speed, Math.round(e.damage * 1.1), P.color, 4);
          b.homeT = P.homeT; b.noFlip = true; b.life = 4; world.enemyBullets.push(b); d.list.push(b); }
        fx.ring(e.x, e.y, 26, P.color); SFX.play('magic', 0.05); d.shots++; d.timer = P.interval / spd;
      }
      for (const b of d.list) if (b.alive && b.homeT > 0) { /* 필중: 플레이어 쪽으로 휘어 들어감 */
        b.homeT -= dt; const want = Math.atan2(p.y - b.y, p.x - b.x), cur = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
        let df = want - cur; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU;
        const na = cur + clamp(df, -P.turn * dt, P.turn * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
      if (d.shots >= P.volleys && d.list.every((b) => !b.alive || !(b.homeT > 0))) { d.lock = false; return true; }
      return false;
    }
  },
  // 작은 태양 (가웨인): 보스 위에 생긴 태양이 플레이어를 천천히 쫓으며 사방으로 탄을 뿌리다가, 멈춘 자리에서 터짐
  solar: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt;
      if (!d.sun) { d.sun = { x: e.x, y: e.y - 14 }; d.timer = 0.2; fx.ring(e.x, e.y - 14, 18, P.color); }
      const s = d.sun;
      if (d.t < P.duration) {
        const dx = p.x - s.x, dy = p.y - s.y, dd = Math.hypot(dx, dy) || 1; s.x += dx / dd * P.speed * spd * dt; s.y += dy / dd * P.speed * spd * dt;
        d.timer -= dt; if (d.timer <= 0) { d.timer += P.interval / spd; const a0 = Math.random() * TAU; for (let i = 0; i < P.bullets; i++) world.enemyShoot(s.x, s.y, a0 + i * TAU / P.bullets, e.def.bulletSpeed * 0.7, e.damage, P.color, 3); }
        fx.part(s.x, s.y, 0, 0, { color: '#ffffff', life: 0.08, size: 5, size2: 3, drag: 0, add: true }); fx.part(s.x, s.y, 0, 0, { color: P.color, life: 0.12, size: 9, size2: 6, drag: 0, add: true });
        if (Math.random() < 0.5) { const a = Math.random() * TAU; fx.part(s.x + Math.cos(a) * 8, s.y + Math.sin(a) * 8, Math.cos(a) * 30, Math.sin(a) * 30, { color: '#ffe9a0', life: 0.3, size: 1.5, size2: 0, drag: 1, add: true }); }
        return false;
      }
      world.hazards.push(new Hazard(s.x, s.y, { r: P.radius, delay: 0.55, damage: Math.round(e.damage * 1.3), bullets: P.burst, color: P.color }));
      fx.ring(s.x, s.y, P.radius, '#ffffff'); return true;
    }
  },
  // 갈라틴 (가웨인의 보구): 검을 들어 머리 위에 큰 태양을 만듦(이동 없음) → 플레이어 쪽으로 불꽃 부채꼴 3파 + 태양이 플레이어 자리에 떨어져 대폭발. 쓰는 동안 페이즈 전환 없음
  galatine: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, fx = world.effects; d.t = (d.t || 0) + dt; d.lock = true;
      const r = e.room, tx = clamp(p.x, r.x0 * TILE + 16, (r.x0 + r.w) * TILE - 16), ty = clamp(p.y, r.y0 * TILE + 16, (r.y0 + r.h) * TILE - 16);
      if (d.t < P.charge) { /* 태양을 모음 */
        const k = d.t / P.charge, sy = e.y - 30, R = 4 + k * 14; d.tx = tx; d.ty = ty;
        fx.part(e.x, sy, 0, 0, { color: '#ffffff', life: 0.08, size: R * 0.7, size2: R * 0.5, drag: 0, add: true }); fx.part(e.x, sy, 0, 0, { color: P.color, life: 0.1, size: R * 1.3, size2: R, drag: 0, add: true });
        if (Math.random() < 0.7) { const a = Math.random() * TAU, q = 30 + Math.random() * 20; fx.part(e.x + Math.cos(a) * q, sy + Math.sin(a) * q, -Math.cos(a) * q * 2, -Math.sin(a) * q * 2, { color: '#ffd870', life: 0.4, size: 2, size2: 0, drag: 0, add: true }); }
        d.warn = (d.warn || 0) - dt; if (d.warn <= 0) { d.warn = 0.25; fx.ring(tx, ty, P.radius, '#ff7a3a'); }
        return false;
      }
      if (!d.dropped) { d.dropped = true; d.timer = 0; /* 태양이 떨어짐 */
        world.hazards.push(new Hazard(d.tx, d.ty, { r: P.radius, delay: 0.95, damage: Math.round(e.damage * 1.6), bullets: P.bullets, color: P.color }));
        fx.rays(e.x, e.y - 30, '#ffd870', 18, 90, 0.7); world.addShake(0.3, 5); SFX.play('excal'); }
      d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.waves) { /* 불꽃 부채꼴 */
        const base = Math.atan2(p.y - e.y, p.x - e.x), n = P.count;
        for (let i = 0; i < n; i++) world.enemyShoot(e.x, e.y, base + (i / (n - 1) - 0.5) * P.fan + (d.shots % 2 ? P.fan / n / 2 : 0), P.speed * (1 + d.shots * 0.12), Math.round(e.damage * 1.1), i % 3 ? P.color : '#ffffff', 4);
        fx.ring(e.x, e.y, 30, P.color); d.shots++; d.timer = P.interval / spd;
      }
      if (d.shots >= P.waves && d.t >= P.charge + 1.1) { d.lock = false; return true; }
      return false;
    }
  },
  // 십자 성창: 플레이어 자리를 중심으로 십자(+)·엑스(×) 모양 줄을 따라 빛의 창이 꽂힘 → 잠시 뒤 터짐 (줄 사이로 피해야 함), 매 파마다 플레이어를 다시 노림
  cross: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player, r = e.room; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.waves) {
        const cx = clamp(p.x, r.x0 * TILE + 12, (r.x0 + r.w) * TILE - 12), cy = clamp(p.y, r.y0 * TILE + 12, (r.y0 + r.h) * TILE - 12), off = d.shots % 2 ? Math.PI / 4 : 0;
        const put = (x, y) => { if (!world.map.isSolidAt(x, y)) world.hazards.push(new Hazard(x, y, { r: P.radius, delay: P.delay, damage: Math.round(e.damage * 1.1), bullets: P.bullets || 0, color: P.color })); };
        put(cx, cy);
        for (let a = 0; a < 4; a++) { const ang = off + a * Math.PI / 2; for (let k = 1; k <= P.len; k++) put(cx + Math.cos(ang) * k * P.step, cy + Math.sin(ang) * k * P.step); }
        world.effects.ring(e.x, e.y, 24, P.color); SFX.play('magic', 0.05); d.shots++; d.timer = P.interval / spd;
      }
      return d.shots >= P.waves && d.timer <= 0;
    }
  },
  // ── 심층 보스용 새 패턴
  // 탄막 벽: 방 한쪽 끝에서 반대쪽으로 밀려오는 탄의 벽, 매번 다른 자리에 빈틈
  wall: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, r = e.room; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.waves) {
        const s0 = ((d.side0 ??= randInt(0, 3)) + d.shots) % 4, sides = P.pair ? [s0, s0 ^ 1] : [s0], sp = P.speed; /* pair: 마주 보는 두 벽에서 동시에 (닫히는 문) */
        for (const side of sides) { const horiz = side < 2, n = horiz ? r.w : r.h, gap = randInt(1, n - P.gap - 1);
        for (let i = 0; i < n; i++) { if (i >= gap && i < gap + P.gap) continue;
          const t = i + 0.5, x = horiz ? (r.x0 + t) * TILE : side === 2 ? (r.x0 + 0.6) * TILE : (r.x0 + r.w - 0.6) * TILE, y = horiz ? (side === 0 ? (r.y0 + 0.6) * TILE : (r.y0 + r.h - 0.6) * TILE) : (r.y0 + t) * TILE;
          const b = new EnemyBullet(x, y, horiz ? 0 : side === 2 ? sp : -sp, horiz ? (side === 0 ? sp : -sp) : 0, e.damage, P.color, 4); b.life = (horiz ? r.h : r.w) * TILE / sp + 0.3; world.enemyBullets.push(b); } }
        world.effects.ring(e.x, e.y, 26, P.color); d.shots++; d.timer = P.interval / spd;
      }
      return d.shots >= P.waves && d.timer <= 0;
    }
  },
  // 분열탄: 큰 탄을 플레이어 쪽으로 쏘고, 잠시 뒤 사방으로 터짐
  split: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player; d.timer -= dt; d.list = d.list || []; d.t = (d.t || 0) + dt;
      if (d.timer <= 0 && d.shots < P.volleys) {
        const base = Math.atan2(p.y - e.y, p.x - e.x), h = (P.count - 1) / 2;
        for (let i = 0; i < P.count; i++) { const a = base + (i - h) * P.spread, b = new EnemyBullet(e.x, e.y, Math.cos(a) * P.speed, Math.sin(a) * P.speed, Math.round(e.damage * 1.2), P.color, 6); b.splitAt = d.t + P.splitAfter; world.enemyBullets.push(b); d.list.push(b); }
        d.shots++; d.timer = 0.45 / spd;
      }
      for (const b of d.list) if (b.alive && !b.split && d.t >= b.splitAt) { b.split = true; b.alive = false; world.effects.ring(b.x, b.y, 12, P.color);
        for (let k = 0; k < P.splitN; k++) world.enemyShoot(b.x, b.y, k * TAU / P.splitN + d.t, e.def.bulletSpeed * 0.75, e.damage, P.color, 3); }
      return d.shots >= P.volleys && d.list.every((b) => b.split || !b.alive);
    }
  },
  // 회전 고리: 보스 둘레에 탄이 돌며 넓어지다가 한꺼번에 바깥으로 날아감
  orbit: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.t = (d.t || 0) + dt;
      if (!d.list) { d.list = []; for (let i = 0; i < P.count; i++) { const b = new EnemyBullet(e.x, e.y, 0, 0, e.damage, P.color, 4); b.life = 6; b.oa = i * TAU / P.count; world.enemyBullets.push(b); d.list.push(b); } }
      const k = Math.min(1, d.t / P.spinTime), R = 14 + (P.radius - 14) * k, rot = d.t * (P.spin || 3) * spd;
      if (d.t < P.spinTime) { for (const b of d.list) if (b.alive) { b.x = e.x + Math.cos(b.oa + rot) * R; b.y = e.y + Math.sin(b.oa + rot) * R; } return false; }
      for (const b of d.list) if (b.alive) { const a = b.oa + rot + (P.curve || 0.35); b.vx = Math.cos(a) * P.speed; b.vy = Math.sin(a) * P.speed; b.life = 3; }
      world.effects.ring(e.x, e.y, P.radius, P.color); SFX.play('react', 0.05); return true;
    }
  },
  // 탄막 비: 방 위쪽에서 탄이 비처럼 쏟아짐 (조금씩 비스듬히)
  rain: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, r = e.room; d.timer -= dt; d.t = (d.t || 0) + dt;
      while (d.timer <= 0) { d.timer += P.interval / spd;
        const x = (r.x0 + 0.5 + Math.random() * (r.w - 1)) * TILE, y = (r.y0 + 0.6) * TILE, a = Math.PI / 2 + (P.slant || 0) * (Math.random() - 0.3);
        const b = new EnemyBullet(x, y, Math.cos(a) * P.speed, Math.sin(a) * P.speed, e.damage, P.color, 3); b.life = r.h * TILE / P.speed + 0.5; world.enemyBullets.push(b); }
      return d.t >= P.duration;
    }
  },
  // 롱고미니아드 (신령 롱고미니아드의 궁극기): 플레이어 자리로 빛의 창 → 빛의 탑이 끌어당기며 탄막 → 무너지며 대폭발 (반경 밖으로 피해야 함)
  rhongo: {
    begin(e, world) {
      const r = e.room, p = world.player, x = clamp(p.x, r.x0 * TILE + 16, (r.x0 + r.w) * TILE - 16), y = clamp(p.y, r.y0 * TILE + 16, (r.y0 + r.h) * TILE - 16);
      e.pd.tower = new BossRhongoTower(e, x, y, e.pat); world.zones.push(e.pd.tower);
    },
    update(e) { return !e.pd.tower.alive; }
  },
  // 추격 낙하: 플레이어가 서 있던 자리에 차례로 떨어지는 장판 (멈추면 맞음)
  meteor: {
    update(e, dt, world) {
      const P = e.pat, d = e.pd, p = world.player; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.count) {
        const r = e.room, x = clamp(p.x, r.x0 * TILE + 8, (r.x0 + r.w) * TILE - 8), y = clamp(p.y, r.y0 * TILE + 8, (r.y0 + r.h) * TILE - 8);
        world.hazards.push(new Hazard(x, y, { r: P.radius, delay: P.delay, damage: Math.round(e.damage * 1.2), bullets: P.bullets || 0, color: P.color }));
        d.shots++; d.timer = P.stagger;
      }
      return d.shots >= P.count && d.timer <= 0;
    }
  },
  // 퍼지는 고리: 보스에서 바깥으로 퍼지는 원형 탄막, 틈이 매번 돌아감
  ringOut: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.rings) {
        const gapAt = (d.gap0 ?? (d.gap0 = randInt(0, P.count - 1))) + d.shots * Math.max(2, Math.round(P.count / 6));
        for (let i = 0; i < P.count; i++) { if (((i - gapAt) % P.count + P.count) % P.count < P.gap) continue; world.enemyShoot(e.x, e.y, i * TAU / P.count, P.speed || e.def.bulletSpeed, e.damage, P.color, 4); }
        d.shots++; d.timer = (P.interval || 0.5) / spd;
      }
      return d.shots >= P.rings && d.timer <= 0;
    }
  },
  // 창 세우기: 주위에 탄을 천천히 흩뿌려 멈춰 세운 뒤, 한꺼번에 플레이어를 향해 빠르게 발사
  lances: {
    update(e, dt, world) {
      const P = e.pat, d = e.pd, p = world.player; d.t = (d.t || 0) + dt;
      if (!d.list) { d.list = [];
        for (let i = 0; i < P.count; i++) { const a = i * TAU / P.count, b = new EnemyBullet(e.x, e.y, Math.cos(a) * 70, Math.sin(a) * 70, e.damage, P.color, 4); b.life = 4; world.enemyBullets.push(b); d.list.push(b); } }
      if (d.t < 0.45) return false;
      if (!d.stopped) { d.stopped = true; for (const b of d.list) { b.vx = 0; b.vy = 0; } world.effects.ring(e.x, e.y, 40, P.color); }
      if (d.t < (P.delay || 0.7)) return false;
      for (const b of d.list) if (b.alive) { const dx = p.x - b.x, dy = p.y - b.y, dd = Math.hypot(dx, dy) || 1; b.vx = dx / dd * (P.speed || 300); b.vy = dy / dd * (P.speed || 300); b.life = 2.5; }
      SFX.play('react', 0.05); return true;
    }
  },
  radial: {
    update(e, dt, world, ctx, enr) {
      const P = e.pat, d = e.pd; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.rings) {
        const off = d.shots * (Math.PI / P.count);
        for (let i = 0; i < P.count; i++) world.enemyShoot(e.x, e.y, off + i * TAU / P.count, e.def.bulletSpeed, e.damage, P.color, 4);
        d.shots++; d.timer = 0.3 / enr;
      }
      return d.shots >= P.rings && d.timer <= 0;
    }
  },
  aimed: {
    update(e, dt, world, ctx, enr) {
      const P = e.pat, d = e.pd, p = world.player; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.volleys) {
        const base = Math.atan2(p.y - e.y, p.x - e.x), h = (P.count - 1) / 2;
        for (let i = 0; i < P.count; i++) world.enemyShoot(e.x, e.y, base + (i - h) * P.spread, e.def.bulletSpeed * 1.4, e.damage, P.color, 3);
        d.shots++; d.timer = 0.32 / enr;
      }
      return d.shots >= P.volleys && d.timer <= 0;
    }
  },
  summon: {
    update(e, dt, world) {
      const alive = world.enemies.filter((x) => x.alive).length;
      for (let i = 0; i < e.pat.count && alive + i < 8; i++) {
        const a = Math.random() * TAU;
        const pt = world.findSpawnPoint(e.room, 0, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40);
        world.spawnEnemy(e.pat.enemyId, pt.x, pt.y, e.room);
      }
      return true;
    }
  },
  slam: {
    begin(e, world) {
      const r = e.room, m = e.def.hitboxHalf + 2, p = world.player;
      e.pd.tx = clamp(p.x, r.x0 * TILE + m, (r.x0 + r.w) * TILE - m);
      e.pd.ty = clamp(p.y, r.y0 * TILE + m, (r.y0 + r.h) * TILE - m);
    },
    update(e, dt, world, ctx) {
      const d = e.pd, P = e.pat;
      d.jt = (d.jt || 0) + dt;
      if (d.jt < 0) { e.jumpH = 0; return false; } // 연속 점프 사이 대기 (보간이 0~1을 벗어나지 않게)
      const t = Math.min(1, d.jt / 0.5);
      e.x = d.sx + (d.tx - d.sx) * t; e.y = d.sy + (d.ty - d.sy) * t;
      e.jumpH = Math.sin(t * Math.PI) * 40;
      if (t < 1) return false;
      e.jumpH = 0;
      world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < P.radius + q.half) world.damagePlayer(Math.round(e.damage * 1.5)); }); // 내려찍기: 범위 안의 모두
      for (let i = 0; i < 14; i++) world.enemyShoot(e.x, e.y, i * TAU / 14, e.def.bulletSpeed * 0.9, e.damage, P.color, 4);
      world.effects.ring(e.x, e.y, P.radius, P.color); world.effects.ring(e.x, e.y, P.radius * 0.7, '#ffffff');
      world.addShake(0.25, 5); SFX.play('explode', 0.05);
      if (d.chainLeft === undefined) d.chainLeft = P.chain || 0;
      if (d.chainLeft > 0) { // 연속 내려찍기: 다음 착지 지점 재조준
        d.chainLeft--; d.jt = -0.35; d.sx = e.x; d.sy = e.y; BOSS_PATTERNS.slam.begin(e, world); return false;
      }
      return true;
    }
  },
  charge: {
    begin(e) { e.pd.n = 0; e.pd.phase = 'aim'; e.pd.pt = 0; },
    update(e, dt, world, ctx, enr) {
      const d = e.pd, P = e.pat, p = world.player;
      d.pt += dt;
      if (d.phase === 'aim') {
        e.dashX = ctx.dx / ctx.dist; e.dashY = ctx.dy / ctx.dist;
        if (d.pt >= 0.45 / enr) { d.phase = 'dash'; d.pt = 0; e.dashHit = false; e.hits = null; }
        return false;
      }
      const hit = moveAndCollide(e, e.dashX * P.speed * dt, e.dashY * P.speed * dt, world.map);
      world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 3) world.hitOnce(e, 'hits', q, () => world.damagePlayer(Math.round(e.damage * 1.2))); });
      if (hit.x || hit.y || d.pt > 0.9) {
        if (hit.x || hit.y) {
          world.addShake(0.2, 4);
          for (let i = 0; i < 10; i++) world.enemyShoot(e.x, e.y, i * TAU / 10 + Math.random() * 0.3, e.def.bulletSpeed, e.damage, P.color, 3);
        }
        d.n++; d.phase = 'aim'; d.pt = 0;
      }
      return d.n >= P.dashes;
    }
  },
  zones: {
    update(e, dt, world) {
      const P = e.pat, p = world.player;
      for (let i = 0; i < P.count; i++) {
        const a = Math.random() * TAU, r = i === 0 ? 0 : 20 + Math.random() * P.spreadAround;
        const x = clamp(p.x + Math.cos(a) * r, e.room.x0 * TILE + 8, (e.room.x0 + e.room.w) * TILE - 8);
        const y = clamp(p.y + Math.sin(a) * r, e.room.y0 * TILE + 8, (e.room.y0 + e.room.h) * TILE - 8);
        world.hazards.push(new Hazard(x, y, { r: P.radius, delay: P.delay, damage: Math.round(e.damage * 1.1),
          bullets: P.bullets, color: P.color }));
        if (P.stagger) world.hazards[world.hazards.length - 1].t = -i * P.stagger;
      }
      return true;
    }
  },
  // 레이저: 조준선(예고) → 회전하며 휩쓰는 광선
  laser: {
    begin(e, world, ctx) {
      const P = e.pat, base = Math.atan2(ctx.dy, ctx.dx);
      e.pd.angs = []; for (let i = 0; i < P.beams; i++) e.pd.angs.push(base + (i - (P.beams - 1) / 2) * P.spreadAng);
      e.pd.dir = Math.random() < 0.5 ? -1 : 1; e.pd.t = 0;
      e.laser = { angs: e.pd.angs, width: P.width, color: P.color, live: false };
    },
    update(e, dt, world, ctx) {
      const P = e.pat, d = e.pd, p = world.player;
      d.t += dt;
      for (let i = 0; i < d.angs.length; i++) d.angs[i] += d.dir * P.sweep / P.duration * dt;
      e.laser.live = true;
      const segs = d.angs.map((a) => { const len = beamLength(e, a, world.map); return [e.x + Math.cos(a) * len, e.y + Math.sin(a) * len]; });
      world.eachTarget((q) => { for (const [ex, ey] of segs) if (segmentCircleHit(e.x, e.y, ex, ey, q.x, q.y, P.width + q.half) >= 0) { world.damagePlayer(e.damage); break; } }); // 광선: 닿은 모두
      if (Math.floor(d.t * 10) !== Math.floor((d.t - dt) * 10)) SFX.play('beam', 0.08);
      return d.t >= P.duration;
    }
  },
  // 급강하 (태고룡): 노릴 자리를 표시 → 그 자리로 내리꽂혀 충격파 → 잠시 내려앉아 약점 노출(받는 피해 +50%) → 상공으로 돌아감
  swoop: {
    begin(e) { const d = e.pd; d.n = 0; d.phase = 'aim'; d.pt = 0; e.swooping = true; e.hits = null; },
    update(e, dt, world, ctx, enr) {
      const d = e.pd, P = e.pat, p = world.player, r = e.room, home = e.home || { x: e.x, y: e.y };
      d.pt += dt;
      if (d.phase === 'aim') { // 표시: 노린 자리를 따라가다 마지막 0.3초는 고정
        if (d.pt < 0.95 / enr) { d.tx = clamp(p.x, (r.x0 + 3) * TILE, (r.x0 + r.w - 3) * TILE); d.ty = clamp(p.y, (r.y0 + 6) * TILE, (r.y0 + r.h - 3) * TILE); }
        e.swoopWarn = { x0: e.x, y0: e.y, x1: d.tx, y1: d.ty, k: Math.min(1, d.pt / (1.25 / enr)), color: P.color };
        if (d.pt >= 1.25 / enr) { d.phase = 'dive'; d.pt = 0; e.hits = null; SFX.play('heavy', 0.7); }
        return false;
      }
      if (d.phase === 'dive' || d.phase === 'rise') {
        const tx = d.phase === 'dive' ? d.tx : home.x, ty = d.phase === 'dive' ? d.ty : home.y, dx = tx - e.x, dy = ty - e.y, dist = Math.hypot(dx, dy), step = P.speed * (d.phase === 'dive' ? 1 : 0.55) * dt;
        if (d.phase === 'dive') { e.swoopWarn = null; world.eachTarget((q) => { if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + q.half + 6) world.hitOnce(e, 'hits', q, () => world.damagePlayer(Math.round(e.damage * 1.4))); });
          if (Math.random() < 0.7) world.effects.part(e.x + (Math.random() - 0.5) * 30, e.y - 10, -dx / (dist || 1) * 60, -dy / (dist || 1) * 60, { color: P.color, life: 0.4, size: 2.5, size2: 0, drag: 3, add: true }); }
        if (dist <= step) { e.x = tx; e.y = ty;
          if (d.phase === 'dive') { // 착지: 충격파 + 약점 노출
            d.phase = 'rest'; d.pt = 0; e.perched = true; world.addShake(0.45, 6); SFX.play('heavy');
            world.effects.ring(e.x, e.y, 70, P.color); world.effects.ring(e.x, e.y, 46, '#ffffff'); world.effects.text(e.x, e.y - 46, '약점 노출!', '#ffd84a', true);
            for (let i = 0; i < 18; i++) world.enemyShoot(e.x, e.y, i * TAU / 18 + Math.random() * 0.1, e.def.bulletSpeed * 0.9, e.damage, P.color, 3);
          } else { d.n++; if (d.n >= P.dives) { e.swooping = false; return true; } d.phase = 'aim'; d.pt = 0; }
        } else { e.x += dx / dist * step; e.y += dy / dist * step; }
        return false;
      }
      if (d.phase === 'rest') { if (Math.random() < 0.4) world.effects.part(e.x + (Math.random() - 0.5) * 40, e.y - 6, 0, -30, { color: '#ffd08a', life: 0.6, size: 1.6, size2: 0, drag: 1, add: true });
        if (d.pt >= P.rest / Math.max(1, enr * 0.9)) { d.phase = 'rise'; d.pt = 0; e.perched = false; } }
      return false;
    }
  },
  // ── 태고룡 신규 패턴 [사용자 요청: 기존 공격과 다른 회피 방식]
  // 날개 충격파: 날갯짓 바람이 플레이어를 아래로 밀어내는 동안 빈틈 있는 탄막 줄이 내려옴 → 바람을 거슬러 빈틈으로
  wingGust: { // (예고 = 보스의 TELEGRAPH 동안 바람이 모임)
    begin(e) { const d = e.pd; d.rowT = 0; e.primWarn = { type: 'gust', k: 0 }; },
    aim(e) { if (e.primWarn) e.primWarn.k = Math.min(1, e.stateTime / (e.pat.telegraph || 1)); },
    update(e, dt, world, ctx, enr) {
      const d = e.pd, P = e.pat, r = e.room; d.pt = (d.pt || 0) + dt;
      if (!d.blow) { d.blow = true; world.addShake(0.35, 4); SFX.play('heavy', 0.6); }
      e.primWarn = { type: 'gustOn', k: 1 };
      world.eachTarget((q) => { if (q.state !== 'DEAD') moveAndCollide(q, 0, P.push * dt, world.map); });
      if (Math.random() < 0.6 && r) world.effects.part((r.x0 + 1 + Math.random() * (r.w - 2)) * TILE, e.y + 20, 0, 160, { color: '#ffe9a0', life: 0.5, size: 1.4, size2: 0, drag: 0.5, add: true });
      d.rowT -= dt;
      if (d.rowT <= 0 && r) { d.rowT = P.interval / enr; const x0 = (r.x0 + 1) * TILE, x1 = (r.x0 + r.w - 1) * TILE, gap = x0 + 50 + Math.random() * (x1 - x0 - 100);
        for (let x = x0; x <= x1; x += 13) if (Math.abs(x - gap) > P.gap) world.enemyShoot(x, e.y + 34, Math.PI / 2, P.speed, Math.round(e.damage * (P.dmgMult || 1)), P.color, 3); }
      if (d.pt >= P.duration) { e.primWarn = null; return true; } return false;
    }
  },
  // 용의 포효: 포효를 모으는 동안(TELEGRAPH) 기둥 뒤로 숨어야 함 — 머리에서 보이는 자리면 큰 피해
  roar: {
    begin(e) { e.roaring = true; e.primWarn = { type: 'roar', k: 0 }; },
    aim(e) { if (e.primWarn) e.primWarn.k = Math.min(1, e.stateTime / (e.pat.telegraph || 1)); },
    update(e, dt, world) {
      const d = e.pd, P = e.pat; d.pt = (d.pt || 0) + dt;
      if (!d.done) { d.done = true; e.primWarn = null; world.addShake(0.7, 9); SFX.play('heavy');
        for (const rr of [60, 120, 190, 260]) world.effects.ring(e.x, e.y, rr, P.color);
        world.eachTarget((q) => { if (q.state === 'DEAD') return; const seen = hasLineOfSight({ x: e.x, y: e.y + 10 }, q, world.map);
          if (seen) { world.damagePlayer(Math.round(e.damage * P.mult)); world.effects.text(q.x, q.y - 24, '포효에 휩쓸림', '#ff8a5a'); }
          else world.effects.text(q.x, q.y - 24, '엄폐!', '#9fe89f'); }); }
      if (d.pt >= 0.6) { e.roaring = false; return true; } return false;
    }
  },
  // 태초의 핵 (핵 폭발): 심핵이 과충전되는 동안 용의 바로 아래(안전지대)로 파고들어야 함 — 멀리 있으면 폭발에 휩쓸림
  coreBurst: {
    begin(e) { e.coreCharge = 0; e.primWarn = { type: 'core', k: 0, x: e.x, y: e.y + 70, r: e.pat.safe }; },
    update(e, dt, world, ctx, enr) {
      const d = e.pd, P = e.pat; d.pt = (d.pt || 0) + dt; const tel = P.charge / enr;
      if (!d.done) { const k = Math.min(1, d.pt / tel); e.coreCharge = k; e.primWarn = { type: 'core', k, x: e.x, y: e.y + 70, r: P.safe };
        if (Math.random() < 0.5) world.effects.part(e.x + (Math.random() - 0.5) * 140, e.y - 70 + (Math.random() - 0.5) * 80, 0, 0, { color: '#ffd060', life: 0.3, size: 2, size2: 0, add: true });
        if (d.pt < tel) return false;
        d.done = true; d.pt = 0; e.primWarn = null; e.coreCharge = 0; world.addShake(0.8, 10); SFX.play('excal');
        world.screenFlash = 0.35; world.flashColor = '255,210,120'; world.effects.rays(e.x, e.y - 74, '#ffe9a0', 22, 220, 1.3);
        world.eachTarget((q) => { if (q.state === 'DEAD') return; if (Math.hypot(q.x - e.x, (q.y - (e.y + 70)) / 0.6) > P.safe) { world.damagePlayer(Math.round(e.damage * P.mult)); world.effects.text(q.x, q.y - 24, '핵 폭발', '#ff8a5a'); } else world.effects.text(q.x, q.y - 24, '안전!', '#9fe89f'); });
        for (let i = 0; i < P.bullets; i++) { const a = i * TAU / P.bullets; if (a > Math.PI * 0.3 && a < Math.PI * 0.7) continue; world.enemyShoot(e.x, e.y - 60, a, e.def.bulletSpeed * 0.8, e.damage, P.color, 3); } } // 안전지대(아래쪽)로는 탄을 쏘지 않음
      return d.pt >= 0.5;
    }
  },
  // 격자 폭격: 방 전체에 장판, 가로·세로 한 줄씩만 안전
  grid: {
    update(e, dt, world) {
      const P = e.pat, r = e.room, map = world.map;
      const safeX = randInt(r.x0 + 1, r.x0 + r.w - 2), safeY = randInt(r.y0 + 1, r.y0 + r.h - 2);
      for (let ty = r.y0 + 1; ty < r.y0 + r.h - 1; ty += P.spacing === 3 ? 2 : P.spacing)
        for (let tx = r.x0 + 1; tx < r.x0 + r.w - 1; tx += P.spacing === 3 ? 2 : P.spacing) {
          if (Math.abs(tx - safeX) <= 1 || Math.abs(ty - safeY) <= 1 || map.isSolidTile(tx, ty)) continue;
          const c = map.tileCenter(tx, ty);
          world.hazards.push(new Hazard(c.x, c.y, { r: P.radius, delay: P.delay, damage: Math.round(e.damage * 1.2), bullets: P.bullets, color: P.color }));
        }
      return true;
    }
  },
  // 조여 오는 고리: 방 가장자리에서 중심으로 모이는 탄막, 틈으로 빠져나가야 함
  ringIn: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, r = e.room; d.timer -= dt;
      if (d.timer <= 0 && d.shots < P.rings) {
        const c = world.map.tileCenter(r.cx, r.cy), R = Math.min(r.w, r.h) * TILE / 2 - 14;
        const gapAt = randInt(0, P.count - 1);
        for (let i = 0; i < P.count; i++) {
          if (((i - gapAt + P.count) % P.count) < P.gap) continue;
          const a = i * TAU / P.count, b = new EnemyBullet(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R, -Math.cos(a) * P.speed, -Math.sin(a) * P.speed, e.damage, P.color, 4);
          b.life = R / P.speed + 0.2; world.enemyBullets.push(b);
        }
        d.shots++; d.timer = P.interval / spd;
      }
      return d.shots >= P.rings && d.timer <= 0;
    }
  },
  // 순간이동: 사라졌다가 플레이어에게서 먼 곳에 나타나며 원형 탄막
  teleport: {
    update(e, dt, world) {
      const P = e.pat, d = e.pd;
      d.t = (d.t || 0) + dt;
      if (d.t < 0.35) e.fade = 1 - d.t / 0.35;
      else if (!d.moved) {
        d.moved = true;
        const sp = world.findSpawnPoint(e.room, 110, undefined, undefined, e.def.hitboxHalf);
        world.effects.ring(e.x, e.y, 20, P.color); e.x = sp.x; e.y = sp.y;
      } else if (d.t < 0.6) e.fade = (d.t - 0.35) / 0.25;
      else {
        e.fade = 1;
        for (let i = 0; i < P.bullets; i++) world.enemyShoot(e.x, e.y, i * TAU / P.bullets, e.def.bulletSpeed, e.damage, P.color, 4);
        world.effects.ring(e.x, e.y, 26, P.color);
        return true;
      }
      return false;
    }
  },
  // 소용돌이: 플레이어를 끌어당기며 회전 탄막
  vortex: {
    update(e, dt, world, ctx, spd) {
      const P = e.pat, d = e.pd, p = world.player;
      world.eachTarget((q) => { if (q.state === 'DASH') return; const dx = q.x - e.x, dy = q.y - e.y, dd = Math.hypot(dx, dy) || 1; moveAndCollide(q, -dx / dd * P.pull * dt, -dy / dd * P.pull * dt, world.map); }); // 모두 끌어당김
      d.timer -= dt; d.a = (d.a || 0) + P.spin * dt * spd;
      while (d.timer <= 0) {
        for (let i = 0; i < P.arms; i++) world.enemyShoot(e.x, e.y, d.a + i * TAU / P.arms, e.def.bulletSpeed * 0.8, e.damage, P.color, 3);
        d.timer += P.interval;
      }
      return e.stateTime >= P.duration;
    }
  },
  spiral: {
    update(e, dt, world, ctx, enr) {
      const P = e.pat, d = e.pd; d.timer -= dt;
      d.a = (d.a || 0) + P.spin * dt * enr;
      while (d.timer <= 0) {
        for (let i = 0; i < P.arms; i++) world.enemyShoot(e.x, e.y, d.a + i * TAU / P.arms, e.def.bulletSpeed * 0.9, e.damage, P.color, 3);
        d.timer += P.interval;
      }
      return e.stateTime >= P.duration;
    }
  }
};

function updateEnemy(e, dt, world) {
  e.hurtFlash = Math.max(0, e.hurtFlash - dt);
  if (e.scripted) { e.stateTime += dt; return; } /* 이야기 연출 중 (길가메시): 행동 멈춤 */
  if (e.state === 'DEAD') {
    e.stateTime += dt;
    if (e.stateTime >= (e.def.boss ? 1 : 0.35)) e.removed = true;
    return;
  }
  if (e.state === 'SPAWN') { e.stateTime += dt; if (e.stateTime >= SPAWN_TIME) e.setState('CHASE'); return; }
  // 상태이상
  e.burn = Math.max(0, e.burn - dt); e.poison = Math.max(0, e.poison - dt); e.slow = Math.max(0, e.slow - dt); e.shock = Math.max(0, (e.shock || 0) - dt); e.blind = Math.max(0, (e.blind || 0) - dt); e.curse = Math.max(0, (e.curse || 0) - dt); if (e.markT > 0) e.markT -= dt; e.reactCd = Math.max(0, e.reactCd - dt);
  if (e.burn > 0 || e.poison > 0) {
    e.dotTimer -= dt;
    if (e.dotTimer <= 0) {
      e.dotTimer = 0.5;
      if (e.burn > 0) { world.dotDamage(e, e.burnDps * 0.5, '#ff9a4a'); world.effects.status(e.x, e.y, 'burn'); }
      if (e.poison > 0 && e.alive) { world.dotDamage(e, e.poisonDps * 0.5, '#9aff5a'); world.effects.status(e.x, e.y, 'poison'); }
      if (!e.alive) return;
    }
  }
  if (e.burn > 0 && Math.random() < 0.25) world.effects.status(e.x, e.y, 'burn');
  if (e.slow > 0 && Math.random() < 0.12) world.effects.status(e.x, e.y, 'freeze');
  if (e.poison > 0 && Math.random() < 0.08) world.effects.status(e.x, e.y, 'poison');
  if (e.iceVulnT > 0) e.iceVulnT -= dt; if (e.huntT > 0) e.huntT -= dt; if (e.auraVulnT > 0) e.auraVulnT -= dt;
  if (e.preyT > 0) e.preyT -= dt; if (e.paraImmT > 0) e.paraImmT -= dt; if (e.shockStackT > 0) { e.shockStackT -= dt; if (e.shockStackT <= 0) e.shockStacks = 0; } /* 함정: 사냥터 각인 · 재마비 방지 · 감전 중첩 */
  if (e.paraT > 0) { e.paraT -= dt; if (Math.random() < 0.3) world.effects.lightning(e.x + randInt(-8, 8), e.y - 14, e.x + randInt(-6, 6), e.y); if (e.paraT <= 0) world.effects.burst(e.x, e.y - 4, '#bfe8ff', 6); } /* 마비 중 아크 → 끝날 때 전기 파편 */
  if (e.kingWeakT > 0) e.kingWeakT = Math.max(0, e.kingWeakT - dt);
  if (e.def.ccImmune) { e.stunT = 0; if (!(e.trChain && e.chainT > 0)) { e.chainT = 0; e.trChain = false; } /* [사용자 결정] 보구 사슬은 절반 시간만큼 묶임 */ e.slow = 0; e.blind = 0; e.shock = 0; } /* 아서 왕: 모든 행동 방해 면역 (덫·경직·사슬·빙결·둔화·실명·감전) */
  if (e.stunT > 0) { e.stunT -= dt; return; } // 엑스칼리버 빛에 맞아 경직
  if (e.chainT > 0) { e.chainT -= dt; return; } // 황금 사슬에 묶임: 이동·공격 정지 (지속 피해는 계속)
  const sdt = dt * e.speedMul; // 빙결 시 이동/행동 모두 느려짐
  e.stateTime += sdt;
  const p = world.player;
  const dx = p.x - e.x, dy = p.y - e.y;
  const hidden = p.hadesT > 0 && (!e.def.boss || p.hadesT > p.treasure.duration - p.treasure.bossDur); // 하데스의 투구: 적이 나를 못 찾음 (보스는 처음 몇 초만)
  const ctx = { dx, dy, dist: Math.hypot(dx, dy) || 0.001, playerAlive: p.state !== 'DEAD' && !hidden };
  if (!(e.state === 'ATTACK' && e.def.aiType === 'charger')) e.face = dx < 0 ? -1 : 1;
  e.attackCd = Math.max(0, e.attackCd - sdt * (e.blind > 0 ? (e.def.boss ? 0.8 : 0.55) : 1)); // 실명: 공격 준비가 느려짐
  const behavior = AI_BEHAVIORS[e.def.aiType];
  if (!behavior) throw new Error('알 수 없는 aiType: ' + e.def.aiType);
  if (e.def.traits && e.state !== 'DEAD' && traitOn(e, 'tick', sdt, world, ctx)) return; // 특성이 이번 프레임 행동을 맡음 (도약 등)
  behavior(e, sdt, world, ctx);
}
