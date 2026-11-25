'use strict';
// 원소 반응 표: 두 상태이상 이름을 가나다(알파벳)순으로 정렬해 '+'로 이은 키 → 반응 (game.triggerReaction)
const REACTIONS = {
  'burn+freeze': 'thermal',   // 열충격
  'burn+poison': 'toxic',     // 독 연소
  'freeze+shock': 'superconduct', // 초전도
  'burn+shock': 'overload',   // 과부하
  'poison+shock': 'paralyze', // 마비
  'blind+curse': 'eclipse',   // 일식
  'curse+poison': 'plague',   // 역병
  'burn+curse': 'hellfire',   // 지옥불
  'blind+shock': 'judgment'   // 심판
};
let nextEntityId = 1;
class Entity {
  constructor(x, y, half) {
    this.id = nextEntityId++;
    this.x = x; this.y = y; this.half = half; this.radius = half;
    this.alive = true; this.removed = false;
  }
}

class Player extends Entity {
  constructor(x, y, hero, base) {
    super(x, y, base.hitboxHalf);
    this.hero = hero; this.cfg = base;
    this.maxHp = hero.maxHp; this.hp = hero.maxHp;
    this.maxShield = hero.maxShield; this.shield = hero.maxShield;
    this.maxEnergy = hero.maxEnergy; this.energy = hero.maxEnergy;
    this.moveSpeed = hero.moveSpeed;
    this.dashCdMax = base.dashCooldown; this.skillCdMax = hero.skillCooldown; this.damageReduction = hero.damageReduction || 0;
    this.state = 'NORMAL';
    this.aim = { x: 1, y: 0 }; this.lastMoveDir = { x: 1, y: 0 }; this.dashDir = { x: 1, y: 0 };
    this.dashRemaining = 0; this.dashCooldown = 0; this.dashInvuln = 0; this.hurtInvuln = 0;
    this.skillCooldown = 0; this.whirl = 0; this.whirlTick = 0; this.overdrive = 0; this.vampire = 0; this.rage = 0; this.blinkInv = 0; this.treasure = null; this.treasureCd = 0; this.solomon = 0;
    this.line = null; this.rank = 0; this.skillId = hero.skill; this.skillName = hero.skillName; this.skillDesc = hero.skillDesc; this.skillBaseCd = hero.skillCooldown; // 직업 계열·진화 단계
    this.castLock = 0; this.blinkChain = 0; this.blinkWindowT = 0; this.odDmg = 0; this.rageAtk = 0.6; this.rageVamp = 0; this.sancBoost = 0;
    this.sinceHit = 99; this.deathTimer = 0; this.time = 0; this.moving = false;
    this.swing = null; this.aimVis = 0; this.faceVis = 1; this.recoil = 0;
    this.stats = { attackBonus: 0, fireRateBonus: 0, critChance: base.critChance + (hero.critBonus || 0), critMultiplier: base.critMultiplier };
    this.weapons = []; this.slot = 0; this.buffs = [];
    this.feastPenaltyActive = false; this.feastPenalty = null; this.feastPenaltyReleased = false;
  }
  get weapon() { return this.weapons[this.slot] || null; }
  get isInvulnerable() { return this.dashInvuln > 0 || this.hurtInvuln > 0 || this.whirl > 0 || this.blinkInv > 0 || this.aegisT > 0 || this.scabbardT > 0 || this.hornT > 0; }
  get mods() { return { attackBonus: this.stats.attackBonus + (this.rage > 0 ? this.rageAtk : 0) + (this.overdrive > 0 ? this.odDmg : 0) + (this.sancBoost > 0 ? 0.35 : 0) + (this.solomon > 0 ? this.treasure.atk : 0) + (this.hadesT > 0 ? this.treasure.atk : 0) + (this.avalonT > 0 ? this.avalonAtk : 0) + (this.buffT > 0 ? this.buffAtk || 0 : 0) + (this.hero.lowHpBonus && this.hp <= this.maxHp * 0.5 ? this.hero.lowHpBonus : 0) + (this.jobLowHp && this.hp <= this.maxHp * (this.jobLowHpAt || 0.5) ? this.jobLowHp : 0), critChance: this.stats.critChance, critMultiplier: this.stats.critMultiplier, damageMult: this.feastPenaltyActive ? (this.feastPenaltyFactor || 0.6) : 1 }; }

  update(dt, input, map, mouseWorld) {
    this.time += dt;
    if (this.state === 'DEAD') { this.deathTimer += dt; return; }
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt * (this.solomon > 0 && this.treasure && this.treasure.skillHaste ? this.treasure.skillHaste : 1)); // 솔로몬의 반지: 스킬 쿨타임 빨리 회복
    if (this.skillId === 'deathsentry') { /* 망자의 파수기 충전: 칸 하나에 sentryRecharge초(스킬 쿨타임 감소 비율 적용), 다 차면 멈춤 — skillCooldown은 이 충전 진행을 보여 주는 데 씀 */
      const M = BALANCE.TRAP.sentryCharges, T = BALANCE.TRAP.sentryRecharge * (this.skillBaseCd ? this.skillCdMax / this.skillBaseCd : 1); if (this.dsCharges == null) this.dsCharges = M;
      if (this.dsCharges >= M) this.skillCooldown = 0; else { if (!(this.dsT > 0)) this.dsT = T; this.dsT -= dt * (this.solomon > 0 && this.treasure && this.treasure.skillHaste ? this.treasure.skillHaste : 1); if (this.dsT <= 0) { this.dsCharges++; this.dsT = this.dsCharges < M ? T : 0; } this.skillCooldown = Math.max(0, this.dsT); this.dsMax = T; } }
    this.dashInvuln = Math.max(0, this.dashInvuln - dt);
    this.hurtInvuln = Math.max(0, this.hurtInvuln - dt);
    if (this.denyT > 0) this.denyT -= dt; /* 가레스의 부정 장판 */
    if (this.huntT > 0) this.huntT -= dt; /* 사냥꾼의 표적 (탄이 휘어 들어감) */
    if (this.aegisT > 0) this.aegisT = Math.max(0, this.aegisT - dt);
    if (this.scabbardT > 0) this.scabbardT -= dt; if (this.scabGuardT > 0) this.scabGuardT -= dt; /* 성검의 칼집 */ if (this.fleeceT > 0) this.fleeceT = Math.max(0, this.fleeceT - dt); /* 아킬레우스의 방패 · 황금 양털 */
    this.overdrive = Math.max(0, this.overdrive - dt); if (this.odLockT > 0) { this.odLockT -= dt; if (this.skillCooldown < this.odLockT) this.skillCooldown = this.odLockT; } /* 과부하 계열 재사용 잠금 (스킬 칸에도 남은 시간으로 보이게) */ this.rage = Math.max(0, this.rage - dt); this.blinkInv = Math.max(0, this.blinkInv - dt); this.treasureCd = Math.max(0, this.treasureCd - dt); this.solomon = Math.max(0, this.solomon - dt); this.hadesT = Math.max(0, (this.hadesT || 0) - dt);
    if (this.kingChainT > 0) this.kingChainT = Math.max(0, this.kingChainT - dt);
    this.castLock = Math.max(0, this.castLock - dt); this.blinkWindowT = Math.max(0, this.blinkWindowT - dt); this.sancBoost = Math.max(0, this.sancBoost - dt); this.hasteT = Math.max(0, (this.hasteT || 0) - dt); this.avalonT = Math.max(0, (this.avalonT || 0) - dt); this.buffT = Math.max(0, (this.buffT || 0) - dt); this.transformT = Math.max(0, (this.transformT || 0) - dt); /* [변신] 변신 지속 */
    if (this.swing) { this.swing.t += dt; if (this.swing.t >= this.swing.dur) this.swing = null; }
    this.sinceHit += dt;
    if (this.sinceHit >= this.cfg.shieldRegenDelay)
      this.shield = Math.min(this.maxShield, this.shield + this.cfg.shieldRegenRate * (this.hero.shieldRegenMul || 1) * dt);
    if (this.reflectT > 0) this.reflectT = Math.max(0, this.reflectT - dt); // 반사 방벽 지속

    const ax = mouseWorld.x - this.x, ay = mouseWorld.y - this.y, alen = Math.hypot(ax, ay);
    if (alen > 0.5) { this.aim.x = ax / alen; this.aim.y = ay / alen; }
    // 보이는 조준: 실제 조준을 빠르게 따라감 (총알은 실제 조준으로 바로 나감)
    const want = Math.atan2(this.aim.y, this.aim.x);
    let diff = want - this.aimVis; while (diff > Math.PI) diff -= TAU; while (diff < -Math.PI) diff += TAU;
    this.aimVis += clamp(diff, -26 * dt, 26 * dt) + diff * Math.min(1, 12 * dt) * 0.5;
    // 바라보는 방향: 수직 근처에서는 바꾸지 않음 (좌우 깜빡임 방지)
    if (this.aim.x > 0.22) this.faceVis = 1; else if (this.aim.x < -0.22) this.faceVis = -1;
    this.recoil = Math.max(0, this.recoil - dt * 9);

    let ix = 0, iy = 0;
    if (input.isDown('KeyA')) ix -= 1;
    if (input.isDown('KeyD')) ix += 1;
    if (input.isDown('KeyW')) iy -= 1;
    if (input.isDown('KeyS')) iy += 1;
    const ilen = Math.hypot(ix, iy);
    this.moving = ilen > 0;
    if (ilen > 0) { ix /= ilen; iy /= ilen; this.lastMoveDir.x = ix; this.lastMoveDir.y = iy; }

    if (this.hornT > 0) { this.hornT -= dt; this.moving = true; return; } /* 하늘의 황소의 뿔: 돌진 중에는 보구가 몸을 움직임 */
    if (this.castLock > 0) { this.moving = false; return; } // 시전 중: 이동·대시 불가
    if (this.state === 'DASH') { this.updateDash(dt, map); return; }
    if (input.wasPressed('Space') && this.dashCooldown <= 0) {
      this.startDash(); this.updateDash(dt, map); return;
    }
    const spd = this.moveSpeed * (this.rage > 0 ? 1.2 : 1) * (this.hasteT > 0 ? 1.2 : 1) * (this.buffT > 0 ? 1 + (this.buffSpeed || 0) : 1) * (this.solomon > 0 ? 1 + this.treasure.speed : 1) * (this.hadesT > 0 ? 1 + this.treasure.speed : 1) * (this.kingChainT > 0 ? 0.4 : 1) * (this.feast ? 1 + Math.min(BALANCE.feast.speedCap, this.feast / 10 * BALANCE.feast.speedPer10) : 1); /* 소울 이터 포식 중첩: 이동 속도 (상한) */ /* 길가메시 '왕의 사슬': 몸이 무거워짐 */
    moveAndCollide(this, ix * spd * dt, iy * spd * dt, map);
  }
  startDash() {
    this.state = 'DASH';
    this.dashDir.x = this.lastMoveDir.x; this.dashDir.y = this.lastMoveDir.y;
    this.dashRemaining = this.cfg.dashSpeed * this.cfg.dashDuration;
    this.dashCooldown = this.dashCdMax;
    this.dashInvuln = this.cfg.dashInvuln;
  }
  updateDash(dt, map) {
    const dist = Math.min(this.cfg.dashSpeed * dt, this.dashRemaining);
    this.dashRemaining -= dist;
    const hit = moveAndCollide(this, this.dashDir.x * dist, this.dashDir.y * dist, map);
    if (hit.x || hit.y || this.dashRemaining <= 0) this.state = 'NORMAL';
  }
  takeDamage(amount) {
    if (this.state === 'DEAD' || this.isInvulnerable) return false;
    let aura = this.jobGuardAura || 0; // 사제 숙련 '성스러운 가호': 파티에 만렙 사제가 있으면 아군 전원 받는 피해 감소
    if (typeof game !== 'undefined' && game.allPlayers) for (const q of game.allPlayers()) if ((q.jobGuardAura || 0) > aura) aura = q.jobGuardAura;
    amount = Math.max(1, Math.round(amount * (1 - this.damageReduction) * (1 - aura) * (this.solomon > 0 ? 1 - this.treasure.guard : 1) * (this.avalonT > 0 ? 1 - this.avalonGuard : 1) * (this.buffT > 0 ? 1 - (this.buffGuard || 0) : 1) * (this.scabGuardT > 0 && this.treasure && this.treasure.use === 'scabbard' ? 1 - this.treasure.guard : 1)));
    this.sinceHit = 0;
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    this.hp = Math.max(0, this.hp - (amount - absorbed));
    this.hurtInvuln = this.cfg.hurtInvuln;
    const F = this.treasure; /* 황금 양털: 쓰고 나서 버티는 시간 안이면 쓰러질 피해를 한 번 버팀 (한 판에 endureMax번) */
    if (this.hp <= 0 && this.fleeceT > 0 && F && F.use === 'fleece' && (this.fleeceUsed || 0) < F.endureMax) {
      this.fleeceUsed = (this.fleeceUsed || 0) + 1; this.fleeceT = 0; this.hp = Math.max(1, Math.round(this.maxHp * F.endureHp)); this.hurtInvuln = 1.5; this.endured = true; }
    if (this.reflectT > 0 && typeof game !== 'undefined' && game.enemies && this.state !== 'DEAD') { // [숙련] 반사 방벽: 받은 피해 일부를 가까운 적에게 되돌림
      let best = null, bd = 170; for (const e of game.enemies) { if (!e.targetable) continue; const d = Math.hypot(e.x - this.x, e.y - this.y); if (d < bd) { bd = d; best = e; } }
      if (best) { game.damageEnemy(best, { damage: amount * (this.reflectFrac || 0.5), mods: { attackBonus: 0, critChance: 0, critMultiplier: 1 }, knockback: 2 }, (best.x - this.x) / 40, (best.y - this.y) / 40); game.effects.beamline(this.x, this.y, best.x, best.y, 2, '#9ac0e0'); }
    }
    if (this.hp <= 0) { this.state = 'DEAD'; this.deathTimer = 0; }
    return true;
  }
  weaponAngle() {
    const dir = Math.cos(this.aimVis) < 0 ? -1 : 1;
    const aimAng = this.aimVis - dir * this.recoil * 0.22; // 반동: 총구가 살짝 들림
    if (!this.swing) return aimAng;
    const s = this.swing, k = s.t / s.dur;
    if (s.thrust) return aimAng;
    return s.ang + dir * (-s.arc / 2 + s.arc * k);
  }
  render(ctx) { // 하데스의 투구: 거의 투명하게 + 일렁이는 그림자
    if (this.aegisT > 0 && this.state !== 'DEAD') this.renderAegis(ctx);
    if (this.scabbardT > 0 && this.state !== 'DEAD') { const x = Math.round(this.x), y = Math.round(this.y) - 2, t = this.time || 0; if (!(this.scabbardT < 1 && Math.sin(t * 30) < 0)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; /* 성검의 칼집: 금빛 가호 */
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.ellipse(x, y, this.half + 7, this.half + 10, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.strokeStyle = '#fff4c0'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = t * 2.5 + i * TAU / 4; ctx.beginPath(); ctx.arc(x, y, this.half + 7, a, a + 0.6); ctx.stroke(); } ctx.restore(); } }
    if (this.denyT > 0 && this.state !== 'DEAD') { const x = Math.round(this.x), y = Math.round(this.y) - 22; ctx.save(); ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; /* 공격 금지 표시 */
      ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 3, y - 3); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; }
    if (!(this.hadesT > 0) || this.state === 'DEAD') { this.renderBody(ctx); return; }
    ctx.save(); ctx.globalAlpha = 0.28 + 0.08 * Math.sin(this.time * 10); this.renderBody(ctx); ctx.restore(); ctx.globalAlpha = 1;
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#9aa8c8'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.ellipse(Math.round(this.x), Math.round(this.y) + 6, 10, 3.5, 0, this.time * 2, this.time * 2 + TAU); ctx.stroke(); ctx.restore();
  }
  renderAegis(ctx) { /* 아킬레우스의 방패: 몸을 두른 금빛 고리 + 도는 테 (끝나기 1초 전부터 깜박임) */
    const x = Math.round(this.x), y = Math.round(this.y) - 2, R = this.half + 8, t = this.time || 0;
    if (this.aegisT < 1 && Math.sin(t * 30) < 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.16; ctx.fillStyle = '#ffc850'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.85; ctx.strokeStyle = '#ffc850'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.7; ctx.strokeStyle = '#fff4d0'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const a = t * 3 + i * TAU / 3; ctx.beginPath(); ctx.arc(x, y, R - 2.5, a, a + 0.8); ctx.stroke(); }
    ctx.restore(); ctx.lineWidth = 1; ctx.globalAlpha = 1;
  }
  moveFaceDir() { // [사용자 결정] 스킨 바라보는 방향 = 이동 방향. 내 캐릭터는 키 입력, 다른 플레이어(멀티)는 위치 변화로 판단
    const dx = this.x - (this._lpx ?? this.x), dy = this.y - (this._lpy ?? this.y); this._lpx = this.x; this._lpy = this.y;
    if (dx * dx + dy * dy > 0.09) this._mdir = { x: dx, y: dy };
    const local = typeof game !== 'undefined' && game.player === this;
    return (local ? this.lastMoveDir : this._mdir) || this.lastMoveDir || { x: 1, y: 0 };
  }
  renderBody(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const face = this.faceVis;
    const sk = this.skinShown !== undefined ? this.skinShown /* 멀티 참가자 화면: 방장이 이미 갈래까지 확인해 보낸 값 */ : this.remoteSkin !== undefined ? (this.remoteSkin && skinAllowed(this.remoteSkin, this.hero.id, this.line && this.line.id) ? this.remoteSkin : null) /* 방장 쪽 동료: 갈래 확인 */ : (typeof game !== 'undefined' && game.player === this && game.skinSprite ? game.skinSprite(this.hero.id, game.playerLineId(this)) : null); /* 내 캐릭터 */
    if (this.state === 'DEAD') {
      const deadHero = sk ? heroWithLook(this.hero, { sprite: sk }) : this.hero;
      let spr = null;
      if (sk === 'druid_bandi' && typeof druidSprite === 'function') {
        const md = this.lastMoveDir || { x: 1, y: 0 };
        let key, flip = false;
        if (this.transformT > 0) { const atk = this.swing && this.swing.t < this.swing.dur; if (!atk && Math.abs(md.y) > Math.abs(md.x) && DRUID_SKIN.sam_down) key = md.y >= 0 ? 'sam_down' : 'sam_up'; else { key = atk ? 'sam_atk' : 'sam_idle'; flip = md.x < 0; } }
        else if (Math.abs(md.y) > Math.abs(md.x)) key = md.y >= 0 ? 'bandi_down' : 'bandi_up';
        else { key = 'bandi_side'; flip = md.x > 0; }
        const custom = druidSprite(key);
        if (custom) spr = { w: custom.w, h: custom.h, n: flip ? custom.f : custom.n };
      }
      if (!spr) spr = heroSprite(deadHero, 0);
      ctx.save(); ctx.translate(x, y + 3); ctx.rotate(face * Math.PI / 2); ctx.globalAlpha = 0.85;
      ctx.drawImage(spr.n, -spr.w / 2, -spr.h / 2); ctx.restore(); ctx.globalAlpha = 1; return;
    }
    if (this.hurtInvuln > 0 && Math.floor(this.time * 20) % 2 === 0) return;
    const frame = this.moving && this.state !== 'DASH' ? Math.floor(this.time * 8) % 2 : 0;
    if (this.buffT > 0) { const col = this.transformT > 0 && sk === 'druid_bandi' ? '#5ef4ff' : this.buffKillHeal ? '#c02a3a' : this.buffGuard >= 0.4 ? '#c8a070' : '#ffd8a0', a = 0.25 + 0.15 * Math.sin(performance.now() / 120); // 축복·변신·서약 기운
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(Math.round(this.x), Math.round(this.y) + 6, 11, 4, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (this.solomon > 0) { // 솔로몬의 반지: 보랏빛·금빛 고리
      ctx.strokeStyle = `rgba(200,160,255,${0.5 + 0.3 * Math.sin(this.time * 8)})`; ctx.beginPath(); ctx.ellipse(x, y + 6, 11, 4, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 8, 3, 0, this.time * 3, this.time * 3 + 2.5); ctx.stroke();
      for (let i = 0; i < 3; i++) { const a = this.time * 2.5 + i * TAU / 3, gx = Math.round(x + Math.cos(a) * 13), gy = Math.round(y - 2 + Math.sin(a) * 5); // 도는 인장 조각
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(gx - 1, gy - 2, 3, 1); ctx.fillRect(gx - 1, gy + 1, 3, 1); ctx.fillStyle = '#e0c0ff'; ctx.fillRect(gx, gy - 1, 1, 2); }
    }
    if (this.rage > 0) { // 분노: 붉은 기운
      ctx.fillStyle = `rgba(255,60,40,${0.22 + 0.12 * Math.sin(this.time * 18)})`;
      ctx.beginPath(); ctx.arc(x, y - 1, 13, 0, TAU); ctx.fill();
    }
    if (this.overdrive > 0) {
      ctx.fillStyle = `rgba(255,200,60,${0.25 + 0.15 * Math.sin(this.time * 20)})`;
      ctx.beginPath(); ctx.arc(x, y - 1, 12, 0, TAU); ctx.fill();
    }
    if (sk && (!this._skinH || this._skinH.src !== this.hero || this._skinH.sk !== sk)) this._skinH = { src: this.hero, sk, h: heroWithLook(this.hero, { sprite: sk }) };
    // 전설 스킨: 조준 방향으로 상/하/옆 스프라이트, 걷기 3프레임(정지 시 가운데)
    const legAnim = sk && typeof LEG_SKINS !== 'undefined' && LEG_SKINS[sk] !== undefined;
    let drawFrame = frame, drawFace = face, legDir;
    if (legAnim) {
      const md = this.moveFaceDir(), ax = md.x, ay = md.y; // 바라보는 방향 = 이동 방향 (정지 시 마지막 방향)
      if (Math.abs(ay) > Math.abs(ax)) { legDir = ay >= 0 ? 0 : 1; drawFace = 1; } // 아래(앞)/위(뒤): 뒤집지 않음
      else { legDir = 2; drawFace = ax < 0 ? 1 : -1; } // 옆: 원본이 왼쪽을 보므로, 오른쪽으로 갈 때 뒤집음
      drawFrame = (this.moving && this.state !== 'DASH') ? Math.floor(this.time * 9) % 3 : 3; // 정지: 다리 모은 서기 프레임(열 3)
    }
    if (typeof UVFX !== 'undefined') UVFX.renderBack(ctx, this, x, y, sk); // [고유 스킨] 발밑 오라 (캐릭터 뒤)
    const w = this.weapon, sa = Math.sin(this.aimVis), ca = Math.cos(this.aimVis), faceL = legAnim && legDir === 2 && drawFace === 1;
    /* [전설 스킨 방향별 무기 드는 법] 몸 방향에 따라 손 위치·몸 앞뒤가 달라짐 (조준·총알 방향은 그대로 마우스 쪽)
       앞모습: 몸 앞 (위로 겨눌 때만 몸 뒤) · 뒷모습: 몸 뒤에 가려짐 (아래로 겨눌 때만 앞) · 옆모습: 바라보는 쪽 손, 반대쪽으로 겨누면 몸 뒤 */
    const behind = !legAnim ? sa < -0.4 : legDir === 0 ? sa < -0.75 : legDir === 1 ? sa < 0.55 : (faceL ? ca > 0.35 : ca < -0.35) || sa < -0.6;
    const hand = !legAnim ? { x: 0, y: 2, r: 4 } : legDir === 0 ? { x: ca >= 0 ? 6 : -6, y: -1, r: 3 } : legDir === 1 ? { x: ca >= 0 ? 6 : -6, y: -3, r: 3 }
      : { x: (faceL ? -4 : 4) * (behind ? -1 : 1), y: -1, r: 3 }; // 손 = 그림의 소매 끝 (앞·뒤는 겨누는 쪽 손, 옆은 바라보는 쪽 손 · 반대로 겨누면 뒤쪽 손)
    const drawW = () => {
      if (!w || this.transformT > 0) return; // [변신] 변신 중엔 무기 숨김 (근접 베기)
      const ang = this.weaponAngle();
      const reach = this.swing && this.swing.thrust ? Math.sin(Math.PI * this.swing.t / this.swing.dur) * 10 : 0;
      // 손 위치: 어깨(몸 중앙 약간 아래)를 중심으로 도는 궤도, 반동 시 뒤로 밀림 · 전설 스킨은 버스트형이라 손을 몸통 쪽으로 올림
      const R = hand.r + reach - this.recoil * 2.5;
      const hx = x + hand.x + Math.cos(ang) * R, hy = y + hand.y + Math.sin(ang) * R * 0.75;
      drawWeapon(ctx, w.def, hx, hy, ang, typeof UVFX !== 'undefined' ? UVFX.bodyTheme(this, sk) : undefined); // [고유 스킨] 이 플레이어의 테마로 칠한 무기
    };
    if (behind) drawW();
    if (this.fallK > 0) { ctx.save(); const s = 1 - 0.7 * this.fallK; ctx.globalAlpha = 1 - this.fallK; ctx.translate(x, y + 7 + this.fallK * 6); ctx.scale(s, s); ctx.translate(-x, -(y + 7)); } /* 바빌로니아 지하로 떨어짐 */
    let drew = false;
    if (sk === 'druid_bandi' && typeof druidSprite === 'function') { // [변신 드루이드 스킨] 평소 반디(방향별) ↔ 변신 샘(대기/공격, 좌우 반전)
      const md = this.moveFaceDir(), ax = md.x, ay = md.y; let key, flip = false, lungeY = 0; // lungeY: 앞/뒤 공격 시 바라보는 쪽으로 내딛기 // [변신 스킨] 바라보는 방향 = 이동 방향(정지 시 마지막 방향, 멀티 동료는 위치 변화)
      if (this.transformT > 0) { const atk = this.swing && this.swing.t < this.swing.dur; if (Math.abs(ay) > Math.abs(ax) && DRUID_SKIN.sam_down) { key = ay >= 0 ? 'sam_down' : 'sam_up'; if (atk && DRUID_SKIN[key + '_a1']) { const k = this.swing.t / this.swing.dur, dir = ay >= 0 ? 1 : -1; key += k < 0.3 ? '_a1' : k < 0.5 ? '_a2' : '_a3'; lungeY = dir * (k < 0.3 ? -2 * k / 0.3 : k < 0.5 ? -2 + 9 * (k - 0.3) / 0.2 : 7 * (1 - (k - 0.5) / 0.5)); } } else { key = atk ? 'sam_atk' : 'sam_idle'; flip = ax < 0; } } // 샘: 위/아래면 정면·후면(공격 = 몸을 숙이며 칼을 당김 → 쌍검을 앞으로 내밀고 날아들기 → 숙인 채 가르기), 그 외 옆모습(기본 오른쪽, 왼쪽이면 반전)
      else if (Math.abs(ay) > Math.abs(ax)) key = ay >= 0 ? 'bandi_down' : 'bandi_up'; // 앞/뒤
      else { key = 'bandi_side'; flip = ax > 0; } // 옆: 원본이 왼쪽 → 오른쪽이면 반전
      const spr = druidSprite(key);
      if (spr) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 5, y + 6, 10, 2);
        if (spr.steps && key.indexOf('bandi') === 0 && this.moving && this.state !== 'DASH') { const ph = Math.floor(this.time * 8) % 4, S = flip ? spr.steps.f : spr.steps.n, img = ph === 0 ? S[0] : ph === 2 ? S[1] : (flip ? spr.f : spr.n); // 이동 중: 걷기1 → 서기 → 걷기2 → 서기 (4방향, 앞뒤는 발을 위아래로)
          ctx.drawImage(img, Math.round(x - spr.w / 2), Math.round(y + 7 - spr.h), spr.w, spr.h); }
        else drawSprite(ctx, spr, x, y + 7 + Math.round(lungeY), { flip });
        drew = true; }
    }
    else if (sk && sk.indexOf('c_') === 0 && typeof commonSprite === 'function') { // [일반 스킨] 앞모습 1포즈, 좌우 반전 + 이동 시 살짝 들썩
      const spr = commonSprite(sk), step = this.moving && this.state !== 'DASH' && Math.floor(this.time * 8) % 2, wspr = step && commonSprite(sk, true);
      if (spr) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 5, y + 6, 10, 2);
        if (wspr) drawSprite(ctx, wspr, x, y + 7, { flip: face < 0 }); // 걷기 프레임이 있는 스킨: 정지 ↔ 걷기
        else drawSprite(ctx, spr, x, y + 7 + (step ? -1 : 0), { flip: face < 0 }); // 없는 스킨: 1픽셀 들썩
        drew = true; }
    }
    if (!drew) drawHero(ctx, (sk && sk !== 'druid_bandi' && sk.indexOf('c_') !== 0) ? this._skinH.h : this.hero, x, y, drawFace, drawFrame, this.state === 'DASH', legDir);
    if (this.fallK > 0) { ctx.restore(); ctx.globalAlpha = 1; }
    if (!behind) drawW();
    if (typeof UVFX !== 'undefined') UVFX.renderFront(ctx, this, x, y, sk); // [고유 스킨] 대기 반짝임 (캐릭터 앞)
    if (this.whirl > 0) {
      ctx.strokeStyle = 'rgba(220,240,255,0.8)'; ctx.lineWidth = 2;
      const a = this.time * 30;
      ctx.beginPath(); ctx.arc(x, y - 1, 30, a, a + 2.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - 1, 30, a + Math.PI, a + Math.PI + 2.2); ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (w && w.def.heat && ((w.heat || 0) > 0 || w.overheat > 0)) { // 과열 게이지: 노랑 → 빨강, 과열 중엔 깜박임
      const k = (w.heat || 0) / 100, ov = w.overheat > 0; ctx.fillStyle = '#111'; ctx.fillRect(x - 8, y + 10, 16, 3);
      if (!ov || Math.floor(this.time * 10) % 2) { ctx.fillStyle = ov ? '#ff3a2a' : k > 0.75 ? '#ff7a2a' : '#ffd84a'; ctx.fillRect(x - 8, y + 10, Math.round(16 * (ov ? 1 : k)), 3); } }
    if (w && w.charge > 0) {
      const k = Math.min(1, w.charge / w.def.chargeTime);
      ctx.fillStyle = '#111'; ctx.fillRect(x - 8, y + 10, 16, 3);
      ctx.fillStyle = k >= 1 ? '#fff' : '#f0c040'; ctx.fillRect(x - 8, y + 10, Math.round(16 * k), 3);
    }
  }
}

class Enemy extends Entity {
  constructor(x, y, def, scale, room) {
    super(x, y, def.hitboxHalf);
    this.def = def; this.room = room;
    const B = def.boss && !def.master ? (scale.deep ? BALANCE.bossDeep : BALANCE.boss) : null; // 보스 강화 배율 (심층은 더 강함)
    this.maxHp = Math.round(def.health * (def.dummy ? 1 : scale.hp) * (B ? B.hp : 1)); this.hp = this.maxHp;
    this.damage = Math.round(def.damage * scale.dmg * (B ? B.dmg : 1) * (!def.boss && !def.dummy && !def.master && scale.deep ? BALANCE.mobDeep.dmg : 1)); this.cdMul = B ? B.cooldown : 1; /* 심층 일반 몬스터는 공격력 ×mobDeep.dmg */
    this.state = def.dummy ? 'IDLE' : 'SPAWN'; this.stateTime = 0; this.attackCd = 0.5 + Math.random() * 0.8;
    this.hurtFlash = 0; this.rewardGiven = false; this.face = 1; this.exploded = false;
    this.strafe = Math.random() < 0.5 ? -1 : 1; this.strafeT = 1 + Math.random() * 2;
    this.aimAng = 0; this.dashX = 0; this.dashY = 0; this.dashHit = false;
    this.spin = Math.random() * TAU; this.pat = null; this.lastPat = null; this.pd = {}; this.jumpH = 0;
    this.burn = 0; this.burnDps = 0; this.poison = 0; this.poisonDps = 0; this.slow = 0; this.slowK = 1; this.shock = 0; this.blind = 0; this.curse = 0; this.dotTimer = 0.5; this.reactCd = 0; this.fade = 1; this.phase = 1; this.elite = false;
  }
  get targetable() { return this.alive && this.state !== 'SPAWN' && this.state !== 'INTRO' && this.state !== 'PHASE'; }
  makeElite(E) { this.elite = true; this.maxHp = Math.round(this.maxHp * E.hp); this.hp = this.maxHp; this.damage = Math.round(this.damage * E.dmg); }
  get speedMul() { return this.slow > 0 ? this.slowK : 1; }
  setState(s) { this.state = s; this.stateTime = 0; }
  takeHit(amount) {
    if (!this.targetable) return false;
    if (this.def.hpFloor) { amount = Math.min(amount, Math.max(0, this.hp - 1)); if (this.hp - amount <= 1 && !this.yielded) { this.yielded = true; if (typeof game !== 'undefined' && game.gilgameshYield) game.gilgameshYield(this); } if (amount <= 0) { this.hurtFlash = 0.08; return false; } } /* 체력 1에서 멈춤 (길가메시) */
    this.hp = Math.max(0, this.hp - amount);
    this.hurtFlash = 0.08;
    if (this.def.dummy) { this.hp = this.maxHp; return true; }
    if (this.hp <= 0) { this.alive = false; this.setState('DEAD'); }
    return true;
  }
  // mods: 공격자의 능력치 (공격력 버프가 지속 피해에도 반영됨)
  applyStatus(st, mods) {
    if (!st || Math.random() > st.chance) return null;
    // 원소 반응 판정 (적마다 0.8초 쿨타임): 이미 걸린 상태이상과 새 상태이상의 조합 (REACTIONS 표)
    if (this.reactCd <= 0) {
      const on = { burn: this.burn > 0, freeze: this.slow > 0, poison: this.poison > 0, shock: this.shock > 0, blind: this.blind > 0, curse: this.curse > 0 };
      for (const k of Object.keys(on)) if (on[k] && k !== st.type) { const r = REACTIONS[[k, st.type].sort().join('+')]; if (r) { this.reactCd = 0.8; return r; } }
    }
    const dps = (st.dps || 0) * (1 + (mods ? mods.attackBonus : 0)) * (mods && Number.isFinite(mods.damageMult) ? mods.damageMult : 1);
    if (st.type === 'burn') { this.burnDps = this.burn > 0 ? Math.max(this.burnDps, dps) : dps; this.burn = Math.max(this.burn, st.duration); }
    else if (st.type === 'poison') { this.poisonDps = this.poison > 0 ? Math.max(this.poisonDps, dps) : dps; this.poison = Math.max(this.poison, st.duration); }
    else if (st.type === 'freeze') { this.slow = Math.max(this.slow, st.duration); this.slowK = this.def.boss ? Math.max(0.7, st.slow) : st.slow; }
    else if (st.type === 'shock') this.shock = Math.max(this.shock, st.duration);   // 전격: 맞을 때 옆 적에게 번개가 튐
    else if (st.type === 'blind') this.blind = Math.max(this.blind, st.duration);   // 실명: 공격 준비가 느려짐
    else if (st.type === 'curse') this.curse = Math.max(this.curse, st.duration);   // 저주: 받는 피해 증가
    return null;
  }
  renderTelegraph(ctx) {
    if (this.swoopWarn && typeof drawPrimordialWarn === 'function') drawPrimordialWarn(ctx, this); // 태고룡 급강하 예고
    const x = Math.round(this.x), y = Math.round(this.y), def = this.def;
    if (this.shockStacks > 0 && this.state !== 'DEAD' && Math.random() < 0.25 * this.shockStacks) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = this.shockStacks >= 2 ? '#bfe8ff' : '#7ac8ff'; ctx.lineWidth = 1; /* 감전 1·2중첩: 푸른 스파크 (2중첩은 더 자주·불규칙한 전류) */
      const r = this.radius + 2, a = Math.random() * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y - 4 + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a + 0.4) * (r + 3), y - 4 + Math.sin(a + 0.4) * (r + 3)); if (this.shockStacks >= 2) ctx.lineTo(x + Math.cos(a + 0.9) * r, y - 4 + Math.sin(a + 0.9) * r); ctx.stroke(); ctx.restore(); }
    if (this.preyT > 0 && this.state !== 'DEAD') { ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = '#ff9a4a'; ctx.lineWidth = 1; const ry = y + this.radius - 1; ctx.beginPath(); ctx.ellipse(x, ry, this.radius + 2, 2.5, 0, 0, TAU); ctx.stroke(); ctx.restore(); } /* 사냥터 각인: 발밑 주황 고리 */
    if (this.huntT > 0 && this.state !== 'DEAD') { const ry = y - (this.def.boss ? 30 : 16), t = performance.now() / 1000, s = 6 + Math.sin(t * 8); ctx.save(); ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 1.5; /* 사냥꾼의 표적 */
      ctx.beginPath(); ctx.arc(x, ry, s, 0, TAU); ctx.moveTo(x - s - 3, ry); ctx.lineTo(x - s + 2, ry); ctx.moveTo(x + s - 2, ry); ctx.lineTo(x + s + 3, ry); ctx.moveTo(x, ry - s - 3); ctx.lineTo(x, ry - s + 2); ctx.moveTo(x, ry + s - 2); ctx.lineTo(x, ry + s + 3); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; }
    if (this.fortress) { const F = this.fortress, t = performance.now() / 1000; ctx.save(); /* 갤러해드 로드 카멜롯: 하얀 성벽 돔 */
      ctx.globalAlpha = 0.14 * F.k + 0.04; ctx.fillStyle = '#e8ecff'; ctx.beginPath(); ctx.ellipse(x, y - 4, F.r, F.r * 0.85, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.9 * F.k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 4, F.r, F.r * 0.85, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = '#d04040'; ctx.globalAlpha = 0.5 * F.k; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * 0.4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * F.r * 0.9, y - 4 + Math.sin(a) * F.r * 0.765); ctx.lineTo(x + Math.cos(a) * F.r, y - 4 + Math.sin(a) * F.r * 0.85); ctx.stroke(); } /* 성벽 마디 */
      ctx.restore(); ctx.lineWidth = 1; }
    if (this.dashWarn) { const W = this.dashWarn; ctx.save(); ctx.translate(x, y); ctx.rotate(W.ang); /* 아서 왕 돌진: 돌진할 길 예고 */
      ctx.globalAlpha = 0.15 + 0.3 * W.k; ctx.fillStyle = '#ff4a3a'; ctx.fillRect(0, -W.w, W.len, W.w * 2);
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffd0c0'; ctx.fillRect(0, -1, W.len * W.k, 2); ctx.restore(); }
    if (this.slashWarn) { const W = this.slashWarn, full = W.arc >= TAU - 0.01; ctx.save(); /* 아서 왕 검술: 벨 자리 예고 (점점 진해짐) */
      ctx.globalAlpha = 0.15 + 0.3 * W.k; ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); if (full) ctx.arc(x, y, W.r, 0, TAU); else { ctx.moveTo(x, y); ctx.arc(x, y, W.r, W.ang - W.arc / 2, W.ang + W.arc / 2); ctx.closePath(); } ctx.fill();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffd0c0'; ctx.lineWidth = 1; ctx.beginPath(); if (full) ctx.arc(x, y, W.r * W.k, 0, TAU); else ctx.arc(x, y, W.r * W.k, W.ang - W.arc / 2, W.ang + W.arc / 2); ctx.stroke(); ctx.restore(); }
    if (this.laser) { // 보스 광선: 예고선(가늘게) → 발사(굵게)
      for (const a of this.laser.angs) {
        const len = beamLength(this, a, GAME_MAP()), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
        if (this.laser.live) {
          ctx.strokeStyle = this.laser.color; ctx.globalAlpha = 0.5; ctx.lineWidth = this.laser.width * 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, this.laser.width * 0.6);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255,80,80,0.75)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.lineWidth = 1;
      }
    }
    if (def.boss && this.state === 'ATTACK' && this.pat && this.pat.type === 'vortex') {
      ctx.strokeStyle = this.pat.color; ctx.globalAlpha = 0.35;
      for (let i = 0; i < 3; i++) { const a = this.stateTime * 3 + i * 2.1; ctx.beginPath(); ctx.arc(x, y, 50 + i * 30, a, a + 1.6); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    if (def.aiType === 'turret' && this.state === 'TELEGRAPH') {
      const lock = this.stateTime >= def.telegraphTime - 0.25;
      ctx.strokeStyle = lock ? 'rgba(255,60,60,0.95)' : 'rgba(255,90,90,0.45)'; ctx.lineWidth = lock ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + Math.cos(this.aimAng) * 320, y - 4 + Math.sin(this.aimAng) * 320); ctx.stroke(); ctx.lineWidth = 1;
    }
    if (this.state === 'POUNCE') { // 도약 예고: 뛰어들 방향
      ctx.strokeStyle = `rgba(255,90,90,${0.35 + 0.6 * Math.min(1, this.stateTime / 0.5)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(this.aimAng) * 120, y + Math.sin(this.aimAng) * 120); ctx.stroke(); ctx.lineWidth = 1;
    }
    if (def.aiType === 'teleporter' && this.state === 'TELEGRAPH') {
      ctx.strokeStyle = def.bulletColor; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x, y, Math.max(1, 4 + 10 * (1 - this.stateTime / def.telegraphTime)), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (this.state === 'SPAWN') {
      const k = Math.min(1, this.stateTime / SPAWN_TIME);
      ctx.strokeStyle = `rgba(255,80,80,${0.4 + 0.5 * k})`;
      ctx.beginPath(); ctx.arc(x, y, 3 + (1 - k) * 10, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(255,80,80,${0.25 * k})`; ctx.beginPath(); ctx.arc(x, y, def.hitboxHalf + 2, 0, TAU); ctx.fill();
      return;
    }
    if (this.state === 'ATTACK' && def.boss && this.pat && this.pat.type === 'charge' && this.pd.phase === 'aim') {
      ctx.strokeStyle = 'rgba(200,240,255,0.7)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + this.dashX * 200, y + this.dashY * 200); ctx.stroke(); ctx.lineWidth = 1;
    }
    if (this.state !== 'TELEGRAPH') return;
    const k = Math.min(1, this.stateTime / (def.telegraphTime || (this.pat && this.pat.telegraph) || 0.6));
    switch (def.aiType) {
      case 'melee_chase':
        ctx.fillStyle = `rgba(255,60,60,${0.12 + 0.28 * k})`;
        ctx.beginPath(); ctx.arc(x, y, def.attackRange, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,90,90,0.9)'; ctx.stroke(); break;
      case 'ranged_kite':
        ctx.strokeStyle = `rgba(255,90,90,${0.2 + 0.6 * k})`;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(this.aimAng) * 140, y + Math.sin(this.aimAng) * 140); ctx.stroke(); break;
      case 'charger': {
        const len = def.dashSpeed * def.dashDuration;
        ctx.fillStyle = `rgba(255,60,60,${0.12 + 0.25 * k})`;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(this.dashY, this.dashX));
        ctx.fillRect(0, -def.hitboxHalf, len, def.hitboxHalf * 2); ctx.restore(); break;
      }
      case 'caster':
        ctx.fillStyle = (def.bulletColor || '#c070ff') + '99';
        ctx.beginPath(); ctx.arc(x, y - 12, 2 + k * 5, 0, TAU); ctx.fill(); break;
      case 'exploder':
        ctx.fillStyle = `rgba(255,60,30,${0.1 + 0.3 * k})`;
        ctx.beginPath(); ctx.arc(x, y, def.explodeRadius, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,60,0.9)'; ctx.stroke(); break;
      case 'boss':
        if (!this.pat || this.pat.type === 'laser' || this.pat.type === 'teleport') break; // 패턴 정보가 아직 없으면(멀티 참가자) 생략
        if (this.pat.type === 'grid' || this.pat.type === 'ringIn' || this.pat.type === 'vortex') { // 궁극기 예고: 커지는 고리
          ctx.strokeStyle = this.pat.color; ctx.globalAlpha = 0.5 + 0.4 * k; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, 20 + k * 40, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1;
          break;
        }
        if (this.pat.type === 'slam') {
          ctx.fillStyle = `rgba(255,50,50,${0.12 + 0.3 * k})`;
          ctx.beginPath(); ctx.arc(Math.round(this.pd.tx), Math.round(this.pd.ty), this.pat.radius, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,90,90,0.9)'; ctx.stroke();
        } else {
          ctx.strokeStyle = this.pat.color || '#fff'; ctx.globalAlpha = 0.3 + 0.6 * k;
          ctx.beginPath(); ctx.arc(x, y, 18 + k * 8, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
        }
        break;
    }
  }
  render(ctx) {
    if (this.state === 'SPAWN') return;
    const x = Math.round(this.x), y = Math.round(this.y), def = this.def;
    if (def.colossal && typeof drawPrimordial === 'function') { drawPrimordial(ctx, this); return; } // 거대 보스(태고룡): 부위별 전용 그림
    if (this.negateT > 0 && this.state !== 'DEAD') { const R = this.radius + 8, t = performance.now() / 1000; ctx.save(); ctx.globalCompositeOperation = 'lighter'; /* 가레스의 부정: 하얀 빛의 막 */
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#d8f0ff'; ctx.beginPath(); ctx.arc(x, y - 4, R, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 4, R + Math.sin(t * 12), 0, TAU); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; }
    if (this.armOn && this.state !== 'DEAD' && this.state !== 'SPAWN') { const t = performance.now() / 1000, ax = x + (this.face < 0 ? -8 : 8), ay = y - 8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; /* 베디비어: 켜진 은빛 팔 아가트람 */
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); ctx.fillStyle = '#a0d0ff'; ctx.beginPath(); ctx.arc(ax, ay, 7, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, TAU); ctx.fill(); ctx.restore(); }
    if (this.riposteT > 0 && this.state !== 'DEAD') { const t = performance.now() / 1000; ctx.save(); ctx.globalCompositeOperation = 'lighter'; /* 랜슬롯 반격 자세: 푸른 초승달 기운 + 깜박임 */
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 18); ctx.strokeStyle = '#8ab8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 6, this.radius + 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - 6, this.radius + 10, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; }
    if (def.wall && this.shieldAng != null && this.state !== 'DEAD' && this.state !== 'SPAWN') { const R = this.radius + 9, c = this.wallCone || def.wall.cone, A = this.shieldAng; ctx.save(); /* 갤러해드 철벽: 방패가 막는 방향 (이 호 안에서 쏘면 막힘) */
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#e8ecff'; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.arc(x, y - 4, R + 10, A - c, A + c); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 4, R, A - c, A + c); ctx.stroke();
      ctx.strokeStyle = '#d04040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - 4, R + 2, A - c * 0.3, A + c * 0.3); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; }
    if (this.state === 'DEAD') {
      const dur = def.boss ? 1 : 0.35;
      const k = 1 - Math.min(1, this.stateTime / dur);
      ctx.globalAlpha = k; ctx.fillStyle = def.color || '#555';
      const w = def.hitboxHalf * 2 + 2;
      ctx.fillRect(x - w / 2, y + 1, w, Math.max(1, Math.round(4 * k)));
      ctx.globalAlpha = 1; return;
    }
    drawEnemy(ctx, this, x, y, this.hurtFlash > 0);
    if (/^boss_gilgamesh/.test(def.id) && this.state !== 'DEAD') { /* [사용자 결정] 심층의 무언가에 오염된 왕: 몸에서 피어오르는 검은 기운 */
      const t = performance.now() / 1000; ctx.save(); ctx.globalAlpha = 0.35;
      for (let i = 0; i < 7; i++) { const ph = (t * 0.6 + i / 7) % 1, a = i * 2.4 + t * 0.7, rx = Math.cos(a) * (def.hitboxHalf + 2), ry = -6 - ph * 26;
        ctx.fillStyle = i % 2 ? '#1a0a2a' : '#3a1a4a'; ctx.globalAlpha = 0.45 * (1 - ph); ctx.beginPath(); ctx.ellipse(x + rx, y + ry, 3 + ph * 4, 2 + ph * 3, 0, 0, TAU); ctx.fill(); }
      ctx.restore(); }
    if (this.kingWeakT > 0) { const t = performance.now() / 300; ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t); ctx.strokeStyle = '#9ae8d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 6, this.def.hitboxHalf + 8, 5, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; ctx.restore(); } /* 벗의 사슬에 약해진 길가메시: 발밑 하늘빛 고리 */
    const h = def.hitboxHalf;
    if (this.slow > 0) { ctx.fillStyle = 'rgba(140,210,255,0.35)'; ctx.fillRect(x - h - 1, y - h - 2, h * 2 + 2, h * 2 + 4); }
    if (this.burn > 0 && Math.floor(this.stateTime * 10) % 2 === 0) { ctx.fillStyle = '#ff8a3a'; ctx.fillRect(x - 2 + randInt(-3, 3), y - h - 3, 2, 2); }
    if (this.poison > 0) { ctx.fillStyle = '#9aff5a'; ctx.fillRect(x + h - 1, y - h - 3, 2, 2); }
    if (this.shock > 0 && Math.floor(this.stateTime * 12) % 3 === 0) { ctx.fillStyle = '#fff27a'; ctx.fillRect(x - h - 1 + randInt(0, h * 2), y - h + randInt(0, h * 2), 1, 2); }
    if (this.blind > 0) { ctx.fillStyle = '#fff8d8'; ctx.fillRect(x - h - 2, y - h - 3, 2, 2); }
    if (this.curse > 0) { ctx.fillStyle = '#b070ff'; ctx.fillRect(x - 1, y - h - 4, 2, 2); }
    if (this.stunT > 0) { const t = performance.now() / 150; ctx.fillStyle = '#fff4c0'; for (let i = 0; i < 3; i++) { const a = t + i * TAU / 3; ctx.fillRect(Math.round(x + Math.cos(a) * (h + 2)) - 1, Math.round(y - h - 6 + Math.sin(a) * 2), 2, 2); } } // 경직: 머리 위를 도는 빛
    if (this.chainT > 0) { // 황금 사슬에 묶임: 몸을 감은 사슬 두 줄 + 발밑 금빛 고리 + 머리 위 자물쇠 + 남은 시간
      const t = performance.now() / 1000, w = h + 3, link = (px, py, v) => { ctx.fillStyle = '#3a2a10'; ctx.fillRect(px - 1, py - 1, v ? 3 : 4, v ? 4 : 3); ctx.fillStyle = (Math.floor(t * 8 + px) % 5) ? '#ffd84a' : '#ffffff'; ctx.fillRect(px, py, v ? 1 : 2, v ? 2 : 1); };
      ctx.strokeStyle = `rgba(255,216,74,${0.55 + 0.35 * Math.sin(t * 8)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + h, w + 2, (w + 2) * 0.4, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = 1;
      for (const by of [-h * 0.35, h * 0.35]) for (let i = 0; i <= 6; i++) { const px = Math.round(x - w + i * (w * 2) / 6), py = Math.round(y + by + (i - 3) * 0.6); link(px, py, i % 2); }
      const ly = y - h - 14 + Math.sin(t * 4); ctx.fillStyle = '#3a2a10'; ctx.fillRect(x - 4, ly - 1, 9, 8); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 3, ly + 2, 7, 4); // 자물쇠
      ctx.strokeStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 0.5, ly + 2, 2.5, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#3a2a10'; ctx.fillRect(x, ly + 3, 1, 2);
      if (this.chainMax) { const bw = h * 2 + 2, k = Math.max(0, Math.min(1, this.chainT / this.chainMax)); ctx.fillStyle = '#3a2a10'; ctx.fillRect(x - bw / 2, y + h + 4, bw, 2); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - bw / 2, y + h + 4, Math.round(bw * k), 2); }
    }
    if (this.markT > 0) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(x - 1, y - h - 11, 3, 1); ctx.fillRect(x, y - h - 12, 1, 3); } // 약점 표시
    if (!def.boss && !def.dummy && this.hp < this.maxHp) {
      const w = h * 2 + 2;
      ctx.fillStyle = '#300'; ctx.fillRect(x - w / 2, y - h - 7, w, 2);
      ctx.fillStyle = '#e04848'; ctx.fillRect(x - w / 2, y - h - 7, Math.round(w * this.hp / this.maxHp), 2);
    }
  }
}
