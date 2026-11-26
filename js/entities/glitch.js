'use strict';
// ════════════════════════════════════════════
// 글리치 — 심층 곳곳의 오염 (무명객이 천율에게 맞서려 만든 '기록되지 않는 틈') [사용자 결정]
//  · 심층 1층부터 가끔 나타나는 글리치: 조사한 수가 GLITCH_GATE.need 이상이어야 심층 60으로 가는 포탈이 오염되지 않음
//  · 심층 60 오염된 층: 오염된 방(바닥 노이즈 · 적이 순간이동) · 보스 '무형의 오류'
//  · 무형의 오류: 평소엔 형체가 없어 맞지 않음 → 글리치 핵을 모두 부수면 잠시 형체가 드러남, 2페이즈 거울 오류, 3페이즈 오염 지대
// ════════════════════════════════════════════
const GLITCH_COLORS = ['#ff3af0', '#3affe0', '#ffffff', '#ffe94a'];
const GLITCH_WORDS = ['「██ 기록되지 않음 ██」', '「ERR — 이름 없음」', '「░░ 이 자리는 비어 있다 ░░」', '「…누가 지나갔지?」', '「▒ 체에 걸리지 않는 틈 ▒」', '「NULL」'];
function glitchNoise(ctx, x, y, w, h, n, t, alpha = 1) { // 무작위 색 조각 (시간에 따라 바뀜)
  let s = Math.floor(t * 12) * 9301 + Math.round(x * 7 + y * 13);
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) { ctx.globalAlpha = alpha * (0.35 + rnd() * 0.6); ctx.fillStyle = GLITCH_COLORS[Math.floor(rnd() * GLITCH_COLORS.length)]; ctx.fillRect(Math.round(x + rnd() * w), Math.round(y + rnd() * h), 1 + Math.floor(rnd() * 7), 1 + Math.floor(rnd() * 2)); }
  ctx.globalAlpha = 1;
}
// 글리치 (조사하면 GLITCH_GATE.need를 향해 하나씩)
class GlitchRift {
  constructor(x, y) { this.x = x; this.y = y; this.radius = 20; this.done = false; this.t = Math.random() * 5; }
  label(game) { return this.done ? null : `[E] 글리치 — 조사하기 (${Math.min(game.save.glitches || 0, GLITCH_GATE.need)}/${GLITCH_GATE.need})`; }
  get labelColor() { return '#ff3af0'; }
  interact(game) { game.investigateGlitch(this); }
  render(ctx, game) {
    if (this.done) return;
    const x = Math.round(this.x), y = Math.round(this.y), t = (this.t += 1 / 60), j = Math.floor(t * 10) % 3 - 1;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 9 + j, y - 16, 18, 22);
    ctx.fillStyle = '#ff3af0'; ctx.globalAlpha = 0.6; ctx.fillRect(x - 10 + j * 2, y - 12, 20, 2); ctx.fillStyle = '#3affe0'; ctx.fillRect(x - 7 - j * 2, y - 2, 16, 2); ctx.globalAlpha = 1;
    glitchNoise(ctx, x - 14, y - 22, 28, 30, 26, t);
    if (Math.floor(t * 7) % 5 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 12, y - 8 + j * 3, 24, 1); }
  }
}
// 오염된 포탈: 글리치를 충분히 조사하지 않으면 지나갈 수 없음
class CorruptPortal {
  constructor(x, y, label) { this.x = x; this.y = y; this.text = label; this.radius = 22; this.t = 0; }
  label(game) { return `오염된 포탈 — 지나갈 수 없다 (글리치 조사 ${Math.min(game.save.glitches || 0, GLITCH_GATE.need)}/${GLITCH_GATE.need})`; }
  get labelColor() { return '#ff3af0'; }
  interact(game) { game.addShake(0.15, 3); game.effects.text(this.x, this.y - 24, '오염되어 있다', '#ff3af0'); SFX.play('deny'); game.showBanner('오염된 포탈', `던전 곳곳의 글리치를 ${GLITCH_GATE.need}개 이상 조사해야 지나갈 수 있다 (지금 ${game.save.glitches || 0}개)`, '#ff3af0'); }
  render(ctx, game) {
    const x = Math.round(this.x), y = Math.round(this.y), t = (this.t += 1 / 60), j = Math.floor(t * 9) % 3 - 1;
    ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = '#1a0a1e'; ctx.beginPath(); ctx.ellipse(x + j, y, 14, 18, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff3af0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x - j, y, 14, 18, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#3affe0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x + j * 2, y, 12, 16, 0, 0, TAU); ctx.stroke(); ctx.restore();
    glitchNoise(ctx, x - 18, y - 22, 36, 44, 34, t);
    hudText(ctx, this.text, x, y - 30, '#ff8af8', 'center', 7);
  }
}
// 오염된 방: 바닥 위 노이즈 · 가끔 지나가는 가로줄
function drawGlitchRooms(ctx, game) {
  if (!game.W || !game.W.glitchFloor || !game.map) return;
  const t = game.time;
  for (const r of game.map.rooms) { if (!r.glitch) continue;
    const x0 = r.x0 * TILE, y0 = r.y0 * TILE, w = r.w * TILE, h = r.h * TILE;
    ctx.fillStyle = 'rgba(40,0,50,0.18)'; ctx.fillRect(x0, y0, w, h);
    glitchNoise(ctx, x0, y0, w, h, Math.round(r.w * r.h / 6), t + r.x0, 0.55);
    const sy = y0 + ((t * 90 + r.y0 * 37) % h); ctx.fillStyle = 'rgba(58,255,224,0.18)'; ctx.fillRect(x0, Math.round(sy), w, 2); ctx.fillStyle = 'rgba(255,58,240,0.14)'; ctx.fillRect(x0, Math.round(y0 + ((t * 53 + 91) % h)), w, 1);
  }
}
// 글리치 걸린 적: 색이 갈라진 잔상 + 잘린 줄
function drawGlitchGhost(ctx, e, x, y) {
  const t = performance.now() / 1000, j = Math.floor(t * 11 + e.id) % 4;
  if (j < 2) { const def = e.def, ph = e.phase || 1, spr = getSprite(def.sprite, def.phaseColors ? def.phaseColors[ph - 1] : def.color), sc = def.spriteScale || (def.boss && spr.w < 32 ? 2 : 1); // 색이 갈라진 잔상 (drawEnemy는 투명도를 되돌리므로 그림만 따로)
    ctx.save(); ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'lighter'; drawSprite(ctx, spr, x + (j ? 2 : -2), y + def.hitboxHalf + 1 - Math.round(e.jumpH || 0), { flip: e.face < 0, scale: sc }); ctx.restore(); }
  if (j === 2) { ctx.fillStyle = '#3affe0'; ctx.globalAlpha = 0.7; ctx.fillRect(x - e.radius - 2, y - e.radius + (Math.floor(t * 30) % (e.radius * 2)), e.radius * 2 + 4, 1); ctx.globalAlpha = 1; }
  if (Math.floor(t * 5 + e.id) % 7 === 0) glitchNoise(ctx, x - e.radius, y - e.radius * 2, e.radius * 2, e.radius * 2, 8, t);
}
// 무형의 오류: 형체 없음(노이즈 구름) ↔ 형체가 드러남(노이즈로 된 사람 모양 + 눈)
function drawFormless(ctx, e) {
  const t = performance.now() / 1000, x = Math.round(e.x), y = Math.round(e.y - (e.jumpH || 0)), mat = !e.intangible && e.state !== 'INTRO', dead = e.state === 'DEAD';
  const k = dead ? Math.max(0, 1 - e.stateTime / 1.4) : 1; if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 8, 22, 6, 0, 0, TAU); ctx.fill();
  if (!mat) { // 형체 없음: 흔들리는 노이즈 덩어리 (맞지 않음)
    for (let i = 0; i < 9; i++) { const a = t * 1.3 + i * 0.7, rr = 10 + (i % 3) * 7; ctx.fillStyle = i % 2 ? 'rgba(255,58,240,0.18)' : 'rgba(58,255,224,0.16)'; ctx.fillRect(Math.round(x + Math.cos(a) * rr - 9), Math.round(y - 22 + Math.sin(a * 1.3) * rr * 0.6), 18, 3); }
    glitchNoise(ctx, x - 26, y - 46, 52, 52, 60, t, 0.8 * k);
    if (Math.floor(t * 6) % 4 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, y - 26, 2, 2); ctx.fillRect(x + 2, y - 26, 2, 2); } // 가끔 보이는 눈
  } else { // 형체가 드러남: 노이즈 실루엣, 깨지는 가장자리
    const flash = e.hurtFlash > 0;
    for (let row = -44; row < 6; row += 2) { const w = row < -30 ? 10 - Math.abs(row + 37) * 0.6 : row < -24 ? 4 : 13 - (row + 24) * 0.12, off = Math.floor(Math.sin(t * 20 + row) * 1.5) + (Math.floor(t * 8 + row) % 9 === 0 ? 4 : 0);
      ctx.fillStyle = flash ? '#ffffff' : row % 4 ? '#14141e' : '#26263a'; ctx.fillRect(Math.round(x - w + off), y + row, Math.round(w * 2), 2); }
    ctx.fillStyle = '#ff3af0'; ctx.fillRect(x - 5, y - 39, 3, 2); ctx.fillStyle = '#3affe0'; ctx.fillRect(x + 2, y - 39, 3, 2);
    glitchNoise(ctx, x - 22, y - 48, 44, 56, 26, t, 0.9 * k);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 10); ctx.strokeStyle = '#ff3af0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 18, 28, 0, TAU); ctx.stroke();
  }
  ctx.restore(); ctx.lineWidth = 1;
}
// 무명객 (컷신 동안만): 생김새가 기억에 남지 않는 자 — 흐릿하게 흔들림
class UnrecordedFigure {
  constructor(x, y) { this.x = x; this.y = y; this.radius = 0; this.t = 0; this.leave = 0; }
  label() { return null; }
  render(ctx, game) {
    this.t += 1 / 60; if (this.leave) this.leave += 1 / 60; const a = this.leave ? Math.max(0, 1 - this.leave / 1.2) : Math.min(1, this.t / 0.8); if (a <= 0) return;
    const x = Math.round(this.x + (Math.floor(this.t * 9) % 5 === 0 ? 2 : 0)), y = Math.round(this.y);
    if (a > 0.5 && !(typeof uniqueNpcDraw === 'function' && uniqueNpcDraw(ctx, 'skin_u_unrecorded', x, y - 2, -1, game))) npcDraw(ctx, 'unrecorded', x, y - 2, -1, game); // (drawHero는 투명도를 1로 되돌리므로 반쯤 나타난 뒤부터 그림)
    ctx.save(); ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#48eaff'; ctx.fillRect(x - 7, y - 20 + (Math.floor(this.t * 20) % 18), 14, 1); ctx.restore();
    glitchNoise(ctx, x - 10, y - 26, 20, 10, 6, this.t, a); // 얼굴 자리가 노이즈로 가려짐
    hudText(ctx, '???', x, y + 8, '#48eaff', 'center', 7);
  }
}
Object.assign(GUILD_NPC_LOOK, { unrecorded: { id: 'npc_unrecorded', look: { sprite: 'assassin', body: '#e8eef8', accent: '#48eaff' } } });

// ── 적 행동: 거울 오류 · 무형의 오류
Object.assign(AI_BEHAVIORS, {
  mirror(e, dt, world, ctx) { // 플레이어를 방 가운데 기준으로 좌우 반대편에서 따라 하며 쏨
    const def = e.def, p = world.player, r = e.room;
    if (e.state === 'SPAWN' || e.state === 'DEAD') return; if (e.state !== 'CHASE') e.setState('CHASE');
    const cx = r ? (r.x0 + r.w / 2) * TILE : e.x, tx = 2 * cx - p.x, ty = p.y, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d > 2) { const s = Math.min(d, def.moveSpeed * dt); moveAndCollide(e, dx / d * s, dy / d * s, world.map); }
    if (e.attackCd <= 0 && ctx.playerAlive) { const ang = Math.atan2(ctx.dy, ctx.dx), n = def.bulletCount || 1;
      for (let i = 0; i < n; i++) world.enemyShoot(e.x, e.y, ang + (n > 1 ? (i / (n - 1) - 0.5) * def.bulletSpread * (n - 1) : 0), def.bulletSpeed, e.damage, def.bulletColor, 3);
      e.attackCd = def.attackCooldown; }
  },
  formless(e, dt, world, ctx) {
    const F = e.fl || (e.fl = { cores: [], mat: 0, spawned: false, spawnT: 1.4, dblT: 2, zoneT: 2, dbl: null });
    if (e.state === 'INTRO' || e.state === 'SPAWN' || e.state === 'DEAD') { e.intangible = e.state !== 'DEAD'; AI_BEHAVIORS.boss(e, dt, world, ctx); return; }
    const r = e.room, phase = e.phase || 1, p = world.player;
    if (F.mat > 0) { F.mat -= dt; e.intangible = false; if (F.mat <= 0) { e.intangible = true; F.spawnT = 1.2; world.announceBossSkill(e, '형체가 다시 흩어진다'); } }
    else {
      e.intangible = true; F.cores = F.cores.filter((c) => c.alive);
      if (F.spawned && !F.cores.length) { F.spawned = false; F.mat = 7; e.intangible = false; world.announceBossSkill(e, '형체가 드러났다 — 지금!'); world.addShake(0.35, 5); world.effects.rays(e.x, e.y - 18, '#ff3af0', 14, 70, 1); SFX.play('heavy'); }
      else if (!F.spawned) { F.spawnT -= dt;
        if (F.spawnT <= 0 && r) { const n = 2 + phase; for (let i = 0; i < n; i++) { const pt = world.findSpawnPoint(r, 70), c = world.spawnEnemy('enemy_glitchcore_001', pt.x, pt.y, r); F.cores.push(c); world.effects.burst(pt.x, pt.y, '#ff3af0', 10); }
          F.spawned = true; world.announceBossSkill(e, `글리치 핵 ${n}개 — 모두 부숴라`); } }
    }
    if (phase >= 2 && r) { F.dblT -= dt; if (F.dblT <= 0 && !(F.dbl && F.dbl.alive)) { const cx = (r.x0 + r.w / 2) * TILE; F.dbl = world.spawnEnemy('enemy_glitchdouble_001', 2 * cx - p.x, p.y, r); F.dblT = 14; world.announceBossSkill(e, '거울 오류 — 너를 비추는 것'); } }
    if (phase >= 3) { F.zoneT -= dt; if (F.zoneT <= 0) { F.zoneT = 2.3; for (let i = 0; i < 3; i++) world.hazards.push(new Hazard(p.x + (Math.random() - 0.5) * 120, p.y + (Math.random() - 0.5) * 80, { r: 26, delay: 0.9, damage: Math.round(e.damage * 1.1), bullets: 4, color: '#ff3af0' })); } }
    AI_BEHAVIORS.boss(e, dt, world, ctx);
  }
});
// 매 프레임: 오염된 적의 순간이동
function glitchTick(game, dt) {
  if (!game.W || game.mode !== 'dungeon') return;
  for (const sp of game.props) if (sp instanceof GlitchSeedSpot && sp.planting && !sp.done) { // 씨앗 심기: 원 안에서 버티는 동안 오염된 적이 몰려옴
    const S = UNRECORDED_SEED, pl = game.player, inside = pl.state !== 'DEAD' && Math.hypot((pl.x - sp.x) / S.radius, (pl.y - sp.y) / (S.radius * 0.55)) <= 1;
    sp.prog = inside ? Math.min(1, sp.prog + dt / S.time) : Math.max(0, sp.prog - dt / S.decay);
    sp.spawned = sp.spawned.filter((e) => e.alive); sp.spawnT -= dt;
    if (sp.spawnT <= 0 && sp.spawned.length < S.maxAlive) { sp.spawnT = S.every; const room = game.map.roomOf('boss') || game.map.rooms.find((r) => r.type === 'combat');
      for (let i = 0; i < S.per; i++) { const pt = room ? game.findSpawnPoint(room, 60) : { x: sp.x + 80, y: sp.y }, e = game.spawnEnemy(pick(S.pool), pt.x, pt.y, room); e.glitchy = true; if (Math.random() < S.elite) e.makeElite(BALANCE.elite); sp.spawned.push(e); game.effects.burst(pt.x, pt.y, '#ff3af0', 8); } }
    if (sp.prog >= 1) { sp.planting = false; for (const e of sp.spawned) if (e.alive) { e.alive = false; e.hp = 0; e.setState('DEAD'); e.rewardGiven = true; game.effects.burst(e.x, e.y, '#48eaff', 8); } game.plantGlitchSeed(sp); } }
  const p = game.player; // 글리치 조각: 가까이 가면 체력·에너지 +50
  if (p && p.state !== 'DEAD') for (const o of game.props) if (o instanceof GlitchShard && !o.taken && Math.hypot(o.x - p.x, o.y - p.y) < 22) { o.taken = true;
    const h = Math.min(50, p.maxHp - p.hp), en = Math.min(50, p.maxEnergy - p.energy); p.hp = Math.min(p.maxHp, p.hp + 50); p.energy = Math.min(p.maxEnergy, p.energy + 50);
    game.effects.heal(p.x, p.y); game.effects.burst(o.x, o.y - 6, '#48eaff', 14); game.effects.text(p.x, p.y - 22, `+${Math.round(h)} 체력 · +${Math.round(en)} 에너지`, '#48eaff', true); SFX.play('heal'); }
  for (const e of game.enemies) { if (!e.alive || e.def.boss || e.state === 'SPAWN' || !(e.def.glitchy || e.glitchy) || e.def.glitchCore || e.def.mirrorDouble) continue;
    e.blinkT = (e.blinkT == null ? 1.5 + Math.random() * 2 : e.blinkT) - dt;
    if (e.blinkT <= 0) { e.blinkT = 2.5 + Math.random() * 2; const a = Math.random() * TAU, d = 26 + Math.random() * 20, x0 = e.x, y0 = e.y;
      moveAndCollide(e, Math.cos(a) * d, Math.sin(a) * d, game.map); game.effects.burst(x0, y0, '#ff3af0', 6); game.effects.burst(e.x, e.y, '#3affe0', 6); } }
}
// 거울 오류: 플레이어와 같은 모습이 색이 갈라진 채로
function drawMirrorDouble(ctx, e) {
  const t = performance.now() / 1000, x = Math.round(e.x), y = Math.round(e.y), p = typeof game !== 'undefined' && game.player; if (!p) return;
  const k = e.state === 'DEAD' ? Math.max(0, 1 - e.stateTime / 0.5) : 1; if (k <= 0) return;
  if (k > 0.5) drawHero(ctx, p.hero, x, y - 2, x < p.x ? 1 : -1, Math.floor(t * 8) % 4, false);
  ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.fillStyle = '#3affe0'; ctx.fillRect(x - 8, y - 20 + (Math.floor(t * 24) % 20), 16, 1); ctx.fillStyle = '#ff3af0'; ctx.fillRect(x - 6, y - 8 - (Math.floor(t * 17) % 12), 12, 1); ctx.restore();
  glitchNoise(ctx, x - 9, y - 22, 18, 24, 10, t, k);
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 6, y - 18, 12, 18); }
}

// 글리치 씨앗 심을 자리 (미기록자의 부탁 · 심층 보스를 쓰러뜨린 방)
class GlitchSeedSpot {
  constructor(x, y, depth) { this.x = x; this.y = y; this.depth = depth; this.radius = 22; this.done = false; this.t = 0; }
  label(game) { return this.done ? null : this.planting ? `씨앗을 심는 중… ${Math.floor(this.prog * 100)}% — 원 안에서 버티기` : `[E] 글리치 씨앗 심기 (${((game.save.unrec || {}).planted || []).length}/${UNRECORDED_SEED.need}) — 심는 동안 오염된 적이 몰려옴`; }
  get labelColor() { return '#48eaff'; }
  interact(game) { if (this.done || this.planting) return; this.planting = true; this.prog = 0; this.spawnT = 0.8; this.spawned = []; game.addShake(0.2, 3); SFX.play('gate', 0.5);
    game.showBanner('글리치 씨앗 심기', `${UNRECORDED_SEED.time}초 동안 원 안에서 버티세요 — 벗어나면 진행도가 줄어듭니다`, '#48eaff'); }
  render(ctx, game) {
    const x = Math.round(this.x), y = Math.round(this.y), t = (this.t += 1 / 60);
    if (this.done) { glitchNoise(ctx, x - 8, y - 6, 16, 8, 8, t, 0.7); return; }
    if (this.planting) { const R = UNRECORDED_SEED.radius; ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#48eaff'; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.55, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = '#48eaff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.55, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ff3af0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 22, 9, -Math.PI / 2, -Math.PI / 2 + TAU * this.prog); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1;
      glitchNoise(ctx, x - R, y - R * 0.55, R * 2, R * 1.1, 14, t, 0.6); }
    ctx.save(); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 3); ctx.strokeStyle = '#48eaff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 14, 6, 0, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#48eaff'; ctx.fillRect(x - 1, y - 8 - Math.round(Math.sin(t * 2) * 2), 3, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y - 7 - Math.round(Math.sin(t * 2) * 2), 1, 1);
  }
}
// 글리치 조각 (미기록자의 부탁을 마친 뒤 맵에 가끔): 가까이 가면 체력·에너지 +50
class GlitchShard {
  constructor(x, y) { this.x = x; this.y = y; this.radius = 0; this.taken = false; this.t = Math.random() * 5; }
  label() { return null; }
  render(ctx, game) {
    if (this.taken) return; const x = Math.round(this.x), y = Math.round(this.y), t = (this.t += 1 / 60), b = Math.round(Math.sin(t * 3) * 2);
    ctx.save(); ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 4); ctx.fillStyle = '#48eaff'; ctx.beginPath(); ctx.ellipse(x, y + 4, 9, 3, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = OUTLINE; ctx.fillRect(x - 4, y - 10 + b, 8, 9); ctx.fillStyle = '#48eaff'; ctx.fillRect(x - 3, y - 9 + b, 6, 7); ctx.fillStyle = '#ff3af0'; ctx.fillRect(x - 3, y - 6 + b, 3, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 1, y - 9 + b, 1, 2);
    glitchNoise(ctx, x - 9, y - 16 + b, 18, 16, 5, t, 0.8);
  }
}
