'use strict';
// ════════════════════════════════════════════
// HUD / 오버레이
// ════════════════════════════════════════════
const HUD_FONTS = {}; // 글꼴 문자열은 크기마다 한 번만 만듦 (같은 문자열을 다시 지정하면 브라우저가 빠르게 처리)
const _bannerImgs = {}; // 빌드 단계에서 생성한 1024×576 고화질 배너
function bannerImg(key) {
  let im = _bannerImgs[key];
  if (im === undefined) {
    im = new Image();
    im.onerror = () => { if (!im.fellBack) { im.fellBack = true; im.src = 'assets/banners/' + key + '.jpg'; } }; // webp가 없으면(빌드 전·아트팩트) 원본 jpg로
    im.src = 'assets/banners/' + key + '.webp';
    _bannerImgs[key] = im;
  }
  return (im.complete && im.naturalWidth) ? im : null;
}
// 배너 원본 비율을 유지하며 대상 상자에 맞춰 자른다.
function drawBannerCover(ctx, im, dx, dy, dw, dh, fx = 0.5) { // fx: 가로로 잘릴 때 살릴 위치 (0 왼쪽 ~ 1 오른쪽)
  const iw = im.naturalWidth || im.width || 1024, ih = im.naturalHeight || im.height || 576;
  const target = dw / dh, ratio = iw / ih;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ratio > target) { sw = ih * target; sx = Math.max(0, Math.min(iw - sw, iw * fx - sw / 2)); }
  else { sh = iw / target; sy = (ih - sh) / 2; }
  const sm = ctx.imageSmoothingEnabled, sq = ctx.imageSmoothingQuality; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; // 배너 일러스트는 도트가 아니므로 부드럽게 (게임은 기본으로 계단식 확대)
  ctx.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh); ctx.imageSmoothingEnabled = sm; ctx.imageSmoothingQuality = sq;
}
function drawBannerContain(ctx, im, dx, dy, dw, dh) {
  const iw = im.naturalWidth || im.width || 1024, ih = im.naturalHeight || im.height || 576;
  const scale = Math.min(dw / iw, dh / ih), w = iw * scale, h = ih * scale;
  const sm = ctx.imageSmoothingEnabled, sq = ctx.imageSmoothingQuality; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(im, 0, 0, iw, ih, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h); ctx.imageSmoothingEnabled = sm; ctx.imageSmoothingQuality = sq;
}
function fitSize(str, w, max = 8, min = 5) { return Math.max(min, Math.min(max, Math.floor(w / Math.max(1, String(str).length)))); } // 이름이 칸을 넘지 않게 글자 크기 줄이기 (한글 1자 ≈ 글자 크기 px)
// ── 스킨 미리보기 (스킨창 · Esc 메뉴 공용): 스킨 종류에 맞는 그림 고르기 + 실제 그림 부분만 상자에 맞춰 그리기
function skinPreviewSprite(hero, sk, t = 0) { // sk = 스킨 그림 이름 (없으면 기본 외형)
  if (!hero) return null;
  if (!sk) return heroSprite(hero, Math.floor(t * 3) % 2);
  if (sk.indexOf('c_') === 0) return typeof commonSprite === 'function' ? commonSprite(sk) || heroSprite(hero, 0) : heroSprite(hero, 0); // 일반·레어·에픽 시트
  if (sk === 'druid_bandi') return typeof druidSprite === 'function' ? druidSprite('bandi_down') || heroSprite(hero, 0) : heroSprite(hero, 0); // 반디
  const leg = typeof LEG_SKINS !== 'undefined' && LEG_SKINS[sk] !== undefined; // 전설·고유 방향 시트: 걷기 3프레임
  return heroSprite(heroWithLook(hero, { sprite: sk }), leg ? Math.floor(t * 6) % 3 : Math.floor(t * 3) % 2, 0);
}
function spriteBBox(spr) { // 투명한 여백을 뺀 실제 그림 영역 (한 번만 계산해 그림에 붙여 둠)
  if (spr._bb) return spr._bb;
  let bb = { x: 0, y: 0, w: spr.w, h: spr.h };
  try { const c = spr.n, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 >= 0) bb = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; } catch (e) { /* 읽기 실패 → 전체 */ }
  spr._bb = bb; return bb;
}
function drawSpriteFit(ctx, spr, cx, bottom, maxW, maxH, maxScale = 2) { // 아래 가운데 기준, 상자를 넘지 않게
  if (!spr) return; const bb = spriteBBox(spr), sc = Math.min(maxScale, maxW / bb.w, maxH / bb.h), w = Math.round(bb.w * sc), h = Math.round(bb.h * sc);
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(spr.n, bb.x, bb.y, bb.w, bb.h, Math.round(cx - w / 2), Math.round(bottom - h), w, h); ctx.imageSmoothingEnabled = sm;
}
// ── 뽑기 연출: 소환진(최고 등급 색으로 차오름) → 빛기둥과 구슬 → 카드가 한 장씩 뒤집힘 (클릭하면 건너뜀)
const GACHA_ANIM = { reveal: 1.9, flip: 0.2, flipLen: 0.22, tail: 0.35 };
function gachaRank(r) { if (!r) return 0; if (r.type === 'skin') return 5; if (r.type === 'shard' || r.type === 'shardDupe') return 4; const K = SKINS.find((k) => k.id === r.id), t = r.type === 'common' ? r.tier : K && K.rarity; if (r.type === 'dupe' && t === 'legendary') return 4; return t === 'epic' ? 3 : t === 'rare' ? 2 : t === 'common' ? 1 : 0; }
const GACHA_RANK_COL = ['#d8e0e8', '#a8bccf', '#5aa8ff', '#c58aff', '#ffe9a0', '#ffd84a'];
function gachaAnimEnd(n) { return GACHA_ANIM.reveal + (n - 1) * GACHA_ANIM.flip + GACHA_ANIM.flipLen + GACHA_ANIM.tail; }
function gachaAnimTime(o) { return o.anim ? (performance.now() - o.anim.start) / 1000 : 99; }
function gachaCardRect(i, n) { const cw = 86, gap = 8, x0 = (VIEW_W - (n * cw + (n - 1) * gap)) / 2; return { x: x0 + i * (cw + gap), y: 80, w: cw, h: 120 }; }
function drawGachaSummon(ctx, o, t) { // 1단계: 소환진
  const A = o.anim, best = A.best, cx = VIEW_W / 2, cy = 150, W = VIEW_W, H = VIEW_H;
  ctx.fillStyle = '#07050d'; ctx.fillRect(0, 0, W, H);
  const step = t < 0.95 ? 0 : Math.min(best, 1 + Math.floor((t - 0.95) / 0.16)); // 흰색에서 시작해 최고 등급까지 한 단계씩
  const col = step ? GACHA_RANK_COL[Math.max(1, step)] : '#e8e0ff', grow = Math.min(1, t / 0.7), R = 26 + 38 * grow;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.18 + 0.15 * grow + (t > 1.6 ? (t - 1.6) * 2 : 0); ctx.fillStyle = gl; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  ctx.globalAlpha = 0.9 * grow; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
  for (const [rr, sp, k] of [[R, 0.8, 1], [R * 0.72, -1.3, 0.6], [R * 1.18, 0.4, 0.4]]) { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42); ctx.rotate(t * sp); ctx.globalAlpha = 0.85 * grow * k + 0.1;
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.fillStyle = col; ctx.fillRect(Math.cos(a) * rr - 1.5, Math.sin(a) * rr - 1.5, 3, 3); } ctx.restore(); }
  { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42); ctx.rotate(-t * 0.5); ctx.globalAlpha = 0.7 * grow; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6 * 2; const px = Math.cos(a) * R * 0.72, py = Math.sin(a) * R * 0.72; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore(); } // 육망성
  for (let i = 0; i < 18; i++) { const a = i * 2.39 + t, d = (1 - ((t * 0.9 + i * 0.13) % 1)) * 120; ctx.globalAlpha = 0.6 * grow; ctx.fillStyle = i % 3 ? col : '#ffffff'; ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.5), 2, 2); } // 모여드는 빛
  if (t > 1.45) { const k = Math.min(1, (t - 1.45) / 0.3), w = 4 + 30 * k; ctx.globalAlpha = 0.8 * k; const pg = ctx.createLinearGradient(cx - w, 0, cx + w, 0); pg.addColorStop(0, 'rgba(0,0,0,0)'); pg.addColorStop(0.5, col); pg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = pg; ctx.fillRect(cx - w, 0, w * 2, cy); ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - w * 0.15, 0, w * 0.3, cy); } // 빛기둥
  if (best >= 4 && t > 1.5) { ctx.globalAlpha = 0.5; ctx.strokeStyle = col; for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + t; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 9); ctx.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 90); ctx.stroke(); } } // 전설: 사방 빛살
  if (t > 1.6) { const n = A.n, k = Math.min(1, (t - 1.6) / 0.3); for (let i = 0; i < n; i++) { const r = gachaCardRect(i, n), tx = r.x + r.w / 2, ty = r.y + r.h / 2, x = cx + (tx - cx) * k, y = cy - 40 * Math.sin(k * Math.PI) + (ty - cy) * k; ctx.globalAlpha = 1; ctx.fillStyle = GACHA_RANK_COL[Math.max(1, gachaRank(A.results[i]))]; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); } } // 카드 자리로 날아가는 구슬
  if (t > 1.75) { ctx.globalAlpha = Math.max(0, 1 - (t - 1.75) / 0.15) * 0.8; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); } // 섬광
  ctx.restore(); ctx.globalAlpha = 1; ctx.lineWidth = 1;
  hudText(ctx, '클릭 — 건너뛰기', W - 10, H - 14, '#665a80', 'right', 7);
}
function drawGachaCardBack(ctx, r, t, i, o) { // 2단계: 아직 안 뒤집힌 카드 (뒤집히는 중이면 가로로 접힘)
  const A = o.anim, t0 = GACHA_ANIM.reveal + i * GACHA_ANIM.flip, k = (t - t0) / GACHA_ANIM.flipLen; if (k >= 0.5) return false; // 절반을 넘으면 앞면(실제 결과)이 보임
  const sx = k <= 0 ? 1 : 1 - k * 2, rank = gachaRank(A.results[i]), col = GACHA_RANK_COL[Math.max(1, rank)];
  ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(Math.max(0.02, sx), 1);
  ctx.fillStyle = '#1e1630'; ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); ctx.strokeStyle = k > 0 ? col : '#8a7040'; ctx.lineWidth = 2; ctx.strokeRect(-r.w / 2 + 1, -r.h / 2 + 1, r.w - 2, r.h - 2); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,216,74,0.45)'; ctx.strokeRect(-r.w / 2 + 6, -r.h / 2 + 6, r.w - 12, r.h - 12);
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4 - Math.PI / 2, rr = j % 2 ? 5 : 13; j ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); // 별 문장
  if (k > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * 1.6; ctx.fillStyle = col; ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); }
  ctx.restore(); ctx.globalAlpha = 1; return true;
}
function drawGachaFlipFx(ctx, r, t, i, o) { // 뒤집힌 직후 반짝 (에픽 이상은 크게)
  const t0 = GACHA_ANIM.reveal + i * GACHA_ANIM.flip + GACHA_ANIM.flipLen * 0.5, k = (t - t0) / 0.35; if (k < 0 || k > 1) return;
  const rank = gachaRank(o.anim.results[i]), col = GACHA_RANK_COL[Math.max(1, rank)], cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * (rank >= 3 ? 0.9 : 0.5); ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.strokeRect(r.x - k * 6, r.y - k * 6, r.w + k * 12, r.h + k * 12);
  if (rank >= 3) for (let j = 0; j < (rank >= 4 ? 16 : 8); j++) { const a = j * TAU / (rank >= 4 ? 16 : 8); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 40); ctx.lineTo(cx + Math.cos(a) * (40 + k * 50), cy + Math.sin(a) * (50 + k * 60)); ctx.stroke(); }
  ctx.restore(); ctx.lineWidth = 1;
}
function hudText(ctx, str, x, y, color = '#fff', align = 'left', size = 10) {
  ctx.font = HUD_FONTS[size] || (HUD_FONTS[size] = `bold ${size}px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif`); ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#000'; ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
// 너비에 맞춰 줄바꿈 (공백 단위), 그린 줄 수를 돌려줌
function hudWrap(ctx, str, x, y, maxW, color, size, lh) {
  ctx.font = `bold ${size}px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif`;
  const lines = []; let cur = '';
  for (const w of str.split(' ')) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  lines.forEach((l, i) => hudText(ctx, l, x, y + i * lh, color, 'center', size));
  return lines.length;
}
function hudBar(ctx, x, y, w, h, ratio, fg) {
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, ratio))), h);
}

class HUD {
  render(ctx, game) {
    const p = game.player;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(4, 4, 124, 40);
    [['#e04848', p.hp, p.maxHp], ['#9aa8c0', p.shield, p.maxShield], ['#4a8cff', p.energy, p.maxEnergy]].forEach(([c, v, m], i) => {
      hudBar(ctx, 8, 8 + i * 12, 72, 8, v / m, c);
      hudText(ctx, Math.floor(v) + '/' + m, 84, 6 + i * 12, '#fff', 'left', 9);
    });

    if (game.mode === 'lobby') {
      const ttl = game.save.title && GUILD_TITLES.find((t) => t.id === game.save.title); // 장착한 길드 칭호
      hudText(ctx, `${ttl ? '「' + ttl.name + '」 ' : ''}${game.profile ? game.profile.name : '게스트'}   ·   보유 ${CUR.name} ${game.save.bank}`, VIEW_W / 2, 6, '#ffd84a', 'center');
      hudText(ctx, 'F/우클릭 스킬 · E 상호작용 · Esc 조작법', VIEW_W / 2, VIEW_H - 14, '#aaa', 'center', 8);
      this.notice(ctx, game);
      if (Net.inRoom) hudText(ctx, `멀티 방 ${Net.code} · ${Net.players.length}/${NET_CONFIG.maxPlayers}명${Net.isHost ? ' · 방장' : ''}`, VIEW_W / 2, 20, '#7affc0', 'center', 8);
    } else {
      const W = game.W;
      hudText(ctx, `${W.trial ? '' : game.stageName() + ' '}${W.name}   골드 ${game.gold}   처치 ${game.kills}`, VIEW_W / 2, 6, W.deep ? '#9ad8ff' : '#fff', 'center');
      { const fp = game.player, Ff = BALANCE.feast; if (fp && fp.line && fp.line.id === 'feast' && game.mode === 'dungeon') hudText(ctx, `포식 ${fp.feast || 0}  (일반 몬스터 피해 +${Math.round((fp.feast || 0) / 10 * Ff.dmgPer10 * 100)}%)`, 8, 66, '#c05a84', 'left', 8); } /* 포식 중첩 */
      if (game.areaId) { const reclaim = BABYLON_RIGHTS.filter((r) => !r.isNew).length, got = Math.min(game.zoneRights || 0, reclaim), king = (game.zoneRights || 0) > reclaim; hudText(ctx, `되찾은 권리 ${got}/${reclaim}${king ? ' · 왕을 마주할 권리' : ''}`, 8, 56, '#fff4c0', 'left', 8); } /* 귀환길: 빼앗긴 8개 + 엔키두가 주는 1개는 따로 */
      if (game.areaId && !game.save.treasures.includes(CHAIN_SHARD.treasure)) hudText(ctx, `금빛 사슬 조각 ${game.save.chainShards || 0}/${CHAIN_SHARD.need}`, 8, 46, '#ffd84a', 'left', 8); /* 보스 이름과 겹치지 않게 왼쪽 체력바 아래 */ /* 바빌로니아 지하 */
      this.minimap(ctx, game);
    }

    const boss = game.enemies.find((e) => e.def.boss && e.alive && e.state !== 'SPAWN');
    if (boss && !game.cinematic) {
      const ph = boss.phase || 1, cols = ['#d050b0', '#e07040', '#ff3a4a'];
      hudText(ctx, `${boss.def.name}  ·  ${boss.def.title || ''}`, VIEW_W / 2, 20, '#ffb0e0', 'center', 9);
      hudText(ctx, ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'][ph], VIEW_W / 2 + 108, 30, cols[ph - 1], 'left', 9);
      ctx.fillStyle = OUTLINE; ctx.fillRect(VIEW_W / 2 - 101, 31, 202, 8);
      if (boss.def.bars) { /* 체력바 여러 개 (아서 왕: 5개) — 지금 바를 다 깎으면 아래 색 바가 드러남, 오른쪽에 남은 바 수 */
        const n = boss.def.bars, fr = Math.max(0, boss.hp / boss.maxHp) * n, left = Math.max(1, Math.ceil(fr - 1e-6)), BC = ['#ff3a4a', '#ff9a3a', '#ffd84a', '#5ad0a0', '#7ab8ff'];
        if (left > 1) { ctx.fillStyle = BC[left - 2]; ctx.fillRect(VIEW_W / 2 - 100, 32, 200, 6); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(VIEW_W / 2 - 100, 32, 200, 6); }
        ctx.fillStyle = BC[left - 1]; ctx.fillRect(VIEW_W / 2 - 100, 32, Math.round(200 * Math.min(1, fr - (left - 1))), 6);
        hudText(ctx, `×${left}`, VIEW_W / 2 + 122, 30, BC[left - 1], 'left', 9);
      } else {
      hudBar(ctx, VIEW_W / 2 - 100, 32, 200, 6, boss.hp / boss.maxHp, cols[ph - 1]);
      ctx.fillStyle = '#fff'; ctx.fillRect(VIEW_W / 2 - 100 + 66, 31, 1, 8); ctx.fillRect(VIEW_W / 2 - 100 + 132, 31, 1, 8); } // 페이즈 경계
      if (boss.state === 'PHASE') { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(game.time * 20)})`; ctx.fillRect(VIEW_W / 2 - 100, 32, 200, 6); }
    }
    if (game.cinematic) this.cinematic(ctx, game);

    // 무기: 현재 무기(크게) + 보조 칸(작게)
    const w = p.weapon;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(VIEW_W - 172, VIEW_H - 38, 168, 34);
    if (p.treasure) { // 장착한 보구 (R) — 무기 칸과 별도
      const T = p.treasure, ready = p.treasureCd <= 0, bx = VIEW_W - 172, by = VIEW_H - 54;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, 168, 14);
      ctx.fillStyle = ready ? T.color : '#555'; ctx.fillRect(bx, by + 12, Math.round(168 * (ready ? 1 : 1 - p.treasureCd / T.cooldown)), 2);
      ctx.globalAlpha = ready ? 1 : 0.45; drawTreasureIcon(ctx, T, bx + 8, by + 6, 0.85, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined)); ctx.globalAlpha = 1;
      hudText(ctx, `[R] ${T.name}`, bx + 17, by + 2, ready ? T.color : '#888', 'left', 8);
      hudText(ctx, ready ? '준비' : `${Math.ceil(p.treasureCd)}초`, bx + 164, by + 2, ready ? '#fff' : '#888', 'right', 8);
    }
    if (w) {
      ctx.strokeStyle = RARITY_COLOR[w.def.rarity]; ctx.strokeRect(VIEW_W - 168.5, VIEW_H - 34.5, 34, 26);
      drawWeaponCentered(ctx, w.def, VIEW_W - 151, VIEW_H - 21, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined));
      hudText(ctx, weaponTitle(w), VIEW_W - 128, VIEW_H - 35, RARITY_COLOR[w.def.rarity], 'left', 10);
      const cost = w.def.type === 'beam' ? `${w.def.energyPerSec}/초` : (w.def.energyCost || 0);
      const free = p.overdrive > 0 || !w.def.energyCost && w.def.type !== 'beam';
      const warn = game.noEnergyFlash > 0 && Math.floor(game.time * 12) % 2 === 0;
      hudText(ctx, free ? '무제한' : `에너지 ${cost}`, VIEW_W - 128, VIEW_H - 22, warn ? '#ff5050' : free ? '#ffd84a' : '#8ab8ff', 'left', 8);
      if (w.charge > 0) hudBar(ctx, VIEW_W - 166, VIEW_H - 11, 30, 2, w.charge / w.def.chargeTime, '#f0c040');
    }
    if (game.mode === 'dungeon' && ((p.line && p.line.id === 'trap') || p.weapons.some((q) => q.def.sentry))) { /* 함정: 설치 수 (덫 장비는 종류별 / 망자의 파수기) */
      const Z = game.zones.filter((z) => z instanceof TrapSentry && z.alive && z.owner === p), TR = BALANCE.TRAP, parts = []; let full = false;
      for (const q of p.weapons) if (q.def.sentry) { const n = Z.filter((z) => z.def === q.def).length; if (n >= q.def.sentry.max) full = true; parts.push(`${q.def.name.replace(/(탑|분사기)$/, '')} ${n}/${q.def.sentry.max}`); }
      if (p.line && p.line.id === 'trap' && p.rank >= 2) parts.push(`파수기 ${Z.filter((z) => z.kind === 'death').length}/${TR.sentryMax}`);
      if (parts.length) { const ty = p.treasure ? VIEW_H - 68 : VIEW_H - 52; /* 보구 칸(R)이 있으면 그 위로 — 겹치지 않게 */
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(VIEW_W - 172, ty - 1, 168, 13); hudText(ctx, parts.join(' · '), VIEW_W - 168, ty, full ? '#ff9a6a' : '#ffb07a', 'left', 8); }
    }
    const other = p.weapons.find((x) => x !== w);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(VIEW_W - 40, VIEW_H - 34, 32, 26);
    if (other) drawWeaponCentered(ctx, other.def, VIEW_W - 24, VIEW_H - 23, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined));
    hudText(ctx, 'Q', VIEW_W - 38, VIEW_H - 34, '#888', 'left', 7);

    // 대시 / 스킬
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(4, VIEW_H - 36, 120, 32);
    const by = VIEW_H - 33;
    hudText(ctx, '대시', 8, by, p.dashCooldown > 0 ? '#888' : '#7fe0ff', 'left', 9);
    hudBar(ctx, 34, by + 3, 86, 5, 1 - p.dashCooldown / p.dashCdMax, '#7fe0ff');
    const dsM = p.skillId === 'deathsentry' ? BALANCE.TRAP.sentryCharges : 0, dsN = dsM ? (p.dsCharges == null ? dsM : p.dsCharges) : 0, skReady = dsM ? dsN > 0 : p.skillCooldown <= 0;
    hudText(ctx, p.skillName, 8, by + 14, skReady ? '#ffd84a' : '#888', 'left', 9);
    hudBar(ctx, 66, by + 17, 54, 5, dsM ? (dsN >= dsM ? 1 : 1 - p.skillCooldown / (p.dsMax || BALANCE.TRAP.sentryRecharge)) : 1 - p.skillCooldown / p.skillCdMax, '#ffd84a');
    if (dsM) for (let i = 0; i < dsM; i++) { ctx.fillStyle = i < dsN ? '#ffd84a' : 'rgba(255,255,255,0.18)'; ctx.fillRect(66 + i * 7, by + 11, 5, 3); } /* 망자의 파수기 충전 칸 */
    if (skReady) { // 스킬 준비 완료: 깜빡이는 테두리
      ctx.strokeStyle = `rgba(255,216,74,${0.4 + 0.4 * Math.sin(game.time * 6)})`; ctx.strokeRect(64.5, by + 15.5, 57, 8);
    }

    if (game.banner && game.banner.t < game.banner.life) {
      const b = game.banner, a = Math.min(1, b.t * 4, (b.life - b.t) * 3);
      ctx.globalAlpha = a;
      hudText(ctx, b.title, VIEW_W / 2, 70, b.color || '#fff', 'center', 16);
      if (b.sub) hudText(ctx, b.sub, VIEW_W / 2, 92, '#ccc', 'center', 10);
      ctx.globalAlpha = 1;
    }
    if (game.overlay) this.overlay(ctx, game);
  }
  // 보스 등장 연출: 위아래 검은 띠 + 이름/칭호 타이틀 카드
  cinematic(ctx, game) {
    const c = game.cinematic, b = c.boss, k = Math.min(1, c.t / 0.4, (2.8 - c.t) / 0.3);
    const bar = Math.round(34 * Math.max(0, k));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, bar); ctx.fillRect(0, VIEW_H - bar, VIEW_W, bar);
    if (c.t > 1.0) {
      const a = Math.min(1, (c.t - 1.0) / 0.3, (2.8 - c.t) / 0.3), slide = Math.max(0, 1 - (c.t - 1.0) / 0.3) * 40;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, VIEW_H - 92, VIEW_W, 46);
      ctx.fillStyle = b.def.phaseColors ? b.def.phaseColors[1] : '#ff6a6a'; ctx.fillRect(VIEW_W / 2 - 120 + slide, VIEW_H - 64, 240, 1);
      hudText(ctx, b.def.name, VIEW_W / 2 - slide, VIEW_H - 88, '#ffffff', 'center', 20);
      hudText(ctx, b.def.title || '', VIEW_W / 2 + slide, VIEW_H - 60, '#ffb0c0', 'center', 10);
      ctx.globalAlpha = 1;
    }
  }
  static minimapLayout() { const cw = 11, ch = 9; return { cw, ch, ox: VIEW_W - GRID_W * cw - 6, oy: 6 }; }
  minimap(ctx, game) {
    const map = game.map, { cw, ch, ox, oy } = HUD.minimapLayout();
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(ox - 3, oy - 3, GRID_W * cw + 6, GRID_H * ch + 6);
    const known = (r) => r.visited || map.edges.some(([a, b]) => (a === r && b.visited) || (b === r && a.visited));
    ctx.fillStyle = '#777';
    for (const [a, b] of map.edges) {
      if (!(a.visited || b.visited)) continue;
      const x0 = ox + a.gx * cw + cw / 2, y0 = oy + a.gy * ch + ch / 2, x1 = ox + b.gx * cw + cw / 2, y1 = oy + b.gy * ch + ch / 2;
      ctx.fillRect(Math.min(x0, x1) - 1, Math.min(y0, y1) - 1, Math.abs(x1 - x0) + 2, Math.abs(y1 - y0) + 2);
    }
    const colors = { start: '#5aa0ff', combat: '#b0b0b0', treasure: '#ffd84a', boss: '#ff5a7a', shop: '#5ad08a', exit: '#7ae0ff', fountain: '#4a9ad8', altar: '#c8a0ff', gamble: '#ff9a4a', challenge: '#d04040', forge: '#d07a3a', blood: '#a02020', rack: '#7a9ad0', smithy: '#ffd84a', evolve: '#fff4a0' };
    const cur = map.roomAtPoint(game.player.x, game.player.y);
    for (const r of map.rooms) {
      if (!known(r)) continue;
      const x = ox + r.gx * cw + 1, y = oy + r.gy * ch + 1;
      ctx.fillStyle = r.visited ? colors[r.type] : (r.type === 'combat' ? '#444' : colors[r.type] + '88');
      ctx.fillRect(x, y, cw - 2, ch - 2);
      if (r === cur) { ctx.strokeStyle = '#fff'; ctx.strokeRect(x - 0.5, y - 0.5, cw - 1, ch - 1); }
    }
    const hov = game.minimapTarget(game.input.mouse); // 이미 간 방: 클릭하면 이동
    if (hov) { const x = ox + hov.gx * cw + 1, y = oy + hov.gy * ch + 1; ctx.strokeStyle = '#ffd84a'; ctx.strokeRect(x - 1.5, y - 1.5, cw + 1, ch + 1);
      hudText(ctx, '클릭: 이동', ox + GRID_W * cw / 2, oy + GRID_H * ch + 4, '#ffd84a', 'center', 7); }
  }
  overlay(ctx, game) {
    const o = game.overlay;
    ctx.fillStyle = o.type === 'story' || o.type === 'treasure_pick' ? '#06050a' : o.type === 'codex' || o.type === 'armory' || o.type === 'treasures' || o.type === 'joblevel' || o.type === 'hero_info' || o.type === 'skins' || o.type === 'travel' || o.type === 'deep_saves' || o.type === 'archive' || o.type === 'guild' || o.type === 'hunt' || o.type === 'trade' || o.type === 'gamble' || o.type === 'trial_confirm' || o.type === 'trial_weapons' || o.type === 'admin' || o.type === 'details' || o.type === 'quests' || o.type === 'multi' || o.type === 'rank' ? 'rgba(8,6,14,0.94)' : 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (o.type === 'pause') { drawPauseMenu(ctx, game); // Esc 메뉴 (js/ui/pause_menu.js)
    } else if (o.type === 'keys') { /* 조작키 설정 */
      hudText(ctx, '조작키 설정', VIEW_W / 2, 20, '#fff', 'center', 14);
      hudText(ctx, o.wait ? '새 키를 누르세요 — 마우스 버튼도 됩니다   (Backspace 지우기 · Esc 취소)' : '바꿀 칸을 누르세요 (주 키 · 보조 키)   ·   Esc 돌아가기', VIEW_W / 2, 36, o.wait ? '#ffd84a' : '#aaa', 'center', 8);
      const m = game.input.mouse, hit = (r) => m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h, B = game.input.binds;
      KEY_ACTIONS.forEach((A, i) => { const r = keysRow(i, -1); hudText(ctx, A.name, r.x, r.y + 3, '#e8e0d0', 'left', 9);
        for (const sl of [0, 1]) { const q = keysRow(i, sl), waiting = o.wait && o.wait.id === A.id && o.wait.slot === sl;
          ctx.fillStyle = waiting ? 'rgba(255,216,74,0.35)' : hit(q) ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)'; ctx.fillRect(q.x, q.y, q.w, q.h);
          ctx.strokeStyle = waiting ? '#ffd84a' : '#5a5468'; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
          hudText(ctx, waiting ? '…' : keyLabel(B[A.id][sl]), q.x + q.w / 2, q.y + 3, B[A.id][sl] ? '#fff' : '#666', 'center', 9); } });
      [['기본값으로', 0], ['닫기', 1]].forEach(([t, k]) => { const r = keysBtn(k); ctx.fillStyle = hit(r) ? 'rgba(255,216,74,0.3)' : 'rgba(255,255,255,0.1)'; ctx.fillRect(r.x, r.y, r.w, r.h); hudText(ctx, t, r.x + r.w / 2, r.y + 3, '#fff', 'center', 9); });
      hudText(ctx, '메뉴·대사 창에서는 언제나 원래 키(좌클릭·Esc·Enter)로 조작합니다', VIEW_W / 2, keysBtn(0).y + 21, '#888', 'center', 8);
      if (o.msg) hudText(ctx, o.msg.text, VIEW_W / 2, keysBtn(0).y + 33, o.msg.color, 'center', 9);
    } else if (o.type === 'deep_saves') { /* 심층 시작 지점 고르기 */
      const m = game.input.mouse, list = game.deepSaveList(), items = [null, ...list];
      hudText(ctx, '심층 입장 — 시작 지점 고르기', VIEW_W / 2, 30, '#9ad8ff', 'center', 14);
      hudText(ctx, '심층 10·20·30·40 보스를 깬 순간(50은 마을에 도착한 순간)의 캐릭터 그대로 시작합니다', VIEW_W / 2, 50, '#aaa', 'center', 7);
      items.forEach((S, i) => { const r = HUD.travelRect(i, items.length), hov = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h, col = S ? '#9ad8ff' : '#c8b890';
        ctx.fillStyle = hov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = col; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        if (!S) { hudText(ctx, `${i + 1}. 심층 1부터 (10-4 기록으로 입장)`, r.x + 10, r.y + 10, col, 'left', 9); return; }
        const H = game.data.heroes.get(S.hero), ln = S.p.line && jobLines(S.hero).find((l) => l.id === S.p.line);
        const townS = worldDef(DEEP_START + S.depth - 1).town;
        hudText(ctx, townS ? `${i + 1}. 심층 ${S.depth} 개척자의 마을부터` : `${i + 1}. 심층 ${S.depth + 1}부터 — 심층 ${S.depth} 세이브`, r.x + 10, r.y + 5, townS ? '#ffd080' : col, 'left', 9);
        hudText(ctx, `${H ? H.name : ''}${ln ? ' · ' + ln.name : ''} · 무기 ${(S.p.weapons || []).length}개 · 축복 ${(S.p.buffs || []).length}개 · 골드 ${S.gold || 0}`, r.x + 10, r.y + 18, '#aaa', 'left', 7); });
      hudText(ctx, '번호 키 / 클릭: 선택   ·   Esc: 닫기', VIEW_W / 2, VIEW_H - 14, '#888', 'center', 7);
    } else if (o.type === 'travel') { /* + 빠른 이동 */
      const m = game.input.mouse, cam = o.sub === 'camelot', items = cam ? game.camelotFloors() : ['camelot', 'babylon'];
      hudText(ctx, cam ? '카멜롯 — 층 고르기' : '빠른 이동', VIEW_W / 2, 30, '#ffd84a', 'center', 14);
      hudText(ctx, cam ? '갈 수 있는 층 (멀린의 시련으로 연 층)' : '로비에서 + 키로 언제든 열 수 있어요', VIEW_W / 2, 50, '#aaa', 'center', 7);
      items.forEach((id, i) => { const r = HUD.travelRect(i, items.length), hov = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        const T = cam ? TRIALS[id] : null, name = cam ? T.title.replace('로드 투 카멜롯 — ', '').replace('로드 투 카멜롯', '1층') + ' · ' + T.intro : id === 'camelot' ? '카멜롯 — 백악의 성 (멀린의 시련)' : '바빌로니아 — 영웅왕의 왕좌';
        const col = cam ? T.color : id === 'camelot' ? '#ffd870' : '#ffbe28';
        ctx.fillStyle = hov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = col; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        hudText(ctx, `${i + 1}. ${name}`, r.x + 10, r.y + 10, col, 'left', cam ? 7 : 9); });
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 30, o.msg.color, 'center', 8);
      hudText(ctx, `번호 키 / 클릭: 선택   ·   Esc / +: ${cam ? '뒤로' : '닫기'}`, VIEW_W / 2, VIEW_H - 14, '#888', 'center', 7);
    } else if (o.type === 'skins') { /* 스킨 고르기 */
      const sv = game.save, m = game.input.mouse, heroId = o.hero || game.player.hero.id, skins = skinsForHero(sv, heroId), HH = game.data.heroes.get(heroId);
      hudText(ctx, `${HH ? HH.name : ''} 스킨  ·  보유 ${skins.filter((k) => (sv.skins || []).includes(k.id)).length}/${skins.length}`, VIEW_W / 2, 10, '#ffb0d8', 'center', 12);
      hudText(ctx, '외형만 바뀌고 능력은 그대로 · ←→ 직업 바꾸기', VIEW_W / 2, 26, '#aaa', 'center', 7);
      for (const d of [0, 1]) { const r = HUD.skinHeroArrow(d), hv = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h; ctx.fillStyle = hv ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'; ctx.fillRect(r.x, r.y, r.w, r.h); hudText(ctx, d ? '▶' : '◀', r.x + r.w / 2, r.y + r.h / 2 - 6, '#ffb0d8', 'center', 11); }
      if (!skins.length) hudText(ctx, '아직 이 직업의 스킨이 없어요 — 로비 Esc → J 스킨 뽑기', VIEW_W / 2, 120, '#888', 'center', 9);
      skins.forEach((K, i) => {
        const r = HUD.skinRect(i, skins.length), owned = (sv.skins || []).includes(K.id), on = owned && game.skinOnMap()[skinKey(K)] === K.id, hov = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        const hero = game.data.heroes.get(K.hero), L = jobLines(K.hero).find((l) => l.id === K.line), uni = K.rarity === 'unique', leg = K.rarity === 'legendary' || uni; // 고유도 방향 애니메이션 스킨
        ctx.fillStyle = on ? 'rgba(255,176,216,0.18)' : leg ? 'rgba(255,216,74,0.08)' : hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        if (leg) { const gl = 0.5 + 0.3 * Math.sin(game.time * 3); ctx.strokeStyle = on ? '#ffb0d8' : uni ? `rgba(154,232,216,${gl + 0.2})` : `rgba(255,216,74,${gl})`; ctx.lineWidth = 1.5; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); ctx.lineWidth = 1; }
        else { const RR = SKIN_RARITY[K.rarity]; ctx.strokeStyle = on ? '#ffb0d8' : RR && K.rarity !== 'common' ? RR.color : '#51475f'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); } // 레어·에픽: 등급 색 테두리
        const spr = skinPreviewSprite(hero, K.sprite, game.time); /* 미리보기: 실제 스킨 그림, 여백을 뺀 그림이 칸(이름 위)에 맞게 */
        if (!owned) ctx.globalAlpha = 0.28; if (spr) drawSpriteFit(ctx, spr, r.x + r.w / 2, r.y + (r.small ? 40 : 50), r.w - 16, r.small ? 30 : 38, r.small ? 1.6 : 2); ctx.globalAlpha = 1;
        if (uni) hudText(ctx, '✦ 고유', r.x + 5, r.y + 4, '#9ae8d8', 'left', 6);
        else if (leg) hudText(ctx, '★ 전설', r.x + 5, r.y + 4, '#ffd84a', 'left', 6);
        else if (SKIN_RARITY[K.rarity] && K.source === 'common') hudText(ctx, (K.rarity === 'common' ? '' : '◆ ') + SKIN_RARITY[K.rarity].name, r.x + 5, r.y + 4, SKIN_RARITY[K.rarity].color, 'left', 6); // 일반·레어·에픽 표시
        if (!owned) hudText(ctx, '🔒', r.x + r.w / 2, r.y + (r.small ? 16 : 22), '#fff', 'center', 10);
        hudText(ctx, `${i + 1}. ${K.name}`, r.x + r.w / 2, r.y + (r.small ? 42 : 54), owned ? (leg ? '#ffe9a0' : '#fff') : '#888', 'center', fitSize(`${i + 1}. ${K.name}`, r.w - 8));
        hudText(ctx, `${hero ? hero.name.split(' ')[0] : ''}${L ? ' · ' + L.name + ' 계열' : leg ? ' · 전 계열' : ''}`, r.x + r.w / 2, r.y + (r.small ? 52 : 66), '#c8c0d8', 'center', 6);
        hudText(ctx, on ? '장착 중 (클릭: 해제)' : owned ? '클릭: 장착' : K.source === 'gacha' || K.source === 'common' ? '스킨 뽑기로 획득 (J)' : K.source === 'soon' ? '획득 방법 준비 중' : K.source === 'unique' ? (uniqueRecordOf(K.id) && uniqueRecordFound(sv, uniqueRecordOf(K.id).id) ? '기록 발견 · 다음 장 준비 중' : '단서: 심층 30층') : '선물 코드로 획득', r.x + r.w / 2, r.y + (r.small ? 61 : 78), on ? '#ffb0d8' : owned ? '#ffd84a' : '#777', 'center', 6);
      });
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 26, o.msg.color, 'center', 8);
      hudText(ctx, '번호 키 / 클릭: 장착·해제   ·   G: 선물 코드   ·   Esc: 돌아가기', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 7);
    } else if (o.type === 'gift') { /* 선물 코드 입력 */
      const bw = 260, bh = 110, bx = VIEW_W / 2 - bw / 2, by = VIEW_H / 2 - bh / 2;
      ctx.fillStyle = 'rgba(20,16,30,0.95)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#ffd84a'; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      hudText(ctx, '🎁 선물 코드', VIEW_W / 2, by + 10, '#ffd84a', 'center', 12);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx + 24, by + 34, bw - 48, 20);
      hudText(ctx, (o.code || '') + (Math.floor(game.time * 2) % 2 ? '_' : ' '), VIEW_W / 2, by + 39, '#ffffff', 'center', 11);
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, by + 64, o.msg.color, 'center', 8);
      hudText(ctx, '영문·숫자 입력 (Ctrl+V 붙여넣기) · Enter 받기 · Backspace 지우기 · Esc 돌아가기', VIEW_W / 2, by + bh - 16, '#999', 'center', 7);
    } else if (o.type === 'gacha') { /* 스킨 뽑기: 왼쪽=선택 배너 + 1뽑/5뽑, 오른쪽 사이드바=배너 선택 + 마일리지 상점 */
      const sv = game.save, pool = gachaPool(), m = game.input.mouse, hit = (r) => m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
      const SBW = HUD.gachaSideW(), MW = HUD.gachaMainW(), sx = VIEW_W - SBW, K = pool[o.banner] || pool[0];
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (o.tab === 1) { // ── 메인: 마일리지 상점 (등급 탭 · 전설=배너 목록, 나머지=카드 격자)
        ctx.fillStyle = '#141020'; ctx.fillRect(0, 0, MW, VIEW_H);
        const st = o.stab || 0, list = shopPool(SHOP_TABS[st][0]), RC = SKIN_RARITY[SHOP_TABS[st][0]] || SKIN_RARITY.common;
        hudText(ctx, '마일리지 상점', 10, 20, '#ffd84a', 'left', 12);
        hudText(ctx, `${SHOP_TABS.map(([r, nm]) => nm + ' ' + GACHA.shopPrices[r]).join(' · ')} M`, MW - 10, 24, '#aaa', 'right', 7);
        SHOP_TABS.forEach(([r, nm], i) => { const t = HUD.gachaShopSubTab(i), on = st === i, C = SKIN_RARITY[r] || SKIN_RARITY.common, cnt = shopPool(r), have = cnt.filter((k) => (sv.skins || []).includes(k.id)).length;
          ctx.fillStyle = on ? 'rgba(255,255,255,0.14)' : hit(t) ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)'; ctx.fillRect(t.x, t.y, t.w, t.h); if (on) { ctx.fillStyle = C.color; ctx.fillRect(t.x, t.y + t.h - 2, t.w, 2); }
          hudText(ctx, `${nm} ${have}/${cnt.length}`, t.x + t.w / 2, t.y + 3, on ? C.color : '#999', 'center', 8); });
        const buyBox = (b, K) => { const own = (sv.skins || []).includes(K.id), pr = shopPrice(K), can = !own && (sv.mileage || 0) >= pr, bon = hit(b);
          ctx.fillStyle = own ? 'rgba(255,216,74,0.14)' : can ? (bon ? 'rgba(255,216,74,0.34)' : 'rgba(255,176,216,0.22)') : 'rgba(90,90,90,0.18)'; ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = own ? '#ffd84a' : can ? GACHA.mileageColor : '#555'; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
          hudText(ctx, own ? '보유중' : `${pr} M`, b.x + b.w / 2, b.y + Math.round(b.h / 2) - 4, own ? '#ffd84a' : can ? GACHA.mileageColor : '#888', 'center', 7); };
        if (st === 0) list.forEach((Ks, i) => { const r = HUD.gachaShopRow(i), own = (sv.skins || []).includes(Ks.id);
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = own ? '#ffd84a' : '#51475f'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
          const th = bannerImg(GACHA.banners[Ks.id]), tw = 70, thh = r.h - 6;
          ctx.fillStyle = '#1a1626'; ctx.fillRect(r.x + 3, r.y + 3, tw, thh); if (th) drawBannerContain(ctx, th, r.x + 3, r.y + 3, tw, thh);
          hudText(ctx, Ks.name, r.x + tw + 10, r.y + Math.round(r.h / 2) - 10, '#fff', 'left', 10);
          { const LN = Ks.line && jobLines(Ks.hero).find((l) => l.id === Ks.line); hudText(ctx, `${game.data.heroes.get(Ks.hero).name}${LN ? ' · ' + LN.name + ' 계열 전용' : ''}`, r.x + tw + 10, r.y + Math.round(r.h / 2) + 3, '#9ad8ff', 'left', 7); }
          buyBox(HUD.gachaShopBuy(i), Ks); });
        else { const sc = o.sscroll || 0, pages = Math.max(0, Math.ceil(list.length / 4) - 3);
          list.slice(sc * 4, sc * 4 + 12).forEach((Ks, j) => { const c = HUD.gachaShopCard(j), own = (sv.skins || []).includes(Ks.id), hero = game.data.heroes.get(Ks.hero);
            ctx.fillStyle = own ? 'rgba(255,216,74,0.07)' : 'rgba(255,255,255,0.045)'; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeStyle = own ? '#ffd84a' : st < 3 ? RC.color : '#51475f'; ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
            if (!own) ctx.globalAlpha = 0.85; drawSpriteFit(ctx, skinPreviewSprite(hero, Ks.sprite, game.time), c.x + 18, c.y + c.h - 4, 30, c.h - 8, 1.4); ctx.globalAlpha = 1;
            hudText(ctx, Ks.name, c.x + 36, c.y + 4, '#fff', 'left', fitSize(Ks.name, c.w - 40));
            hudText(ctx, hero ? hero.name.split(' ')[0] : '', c.x + 36, c.y + 16, '#9ad8ff', 'left', 7);
            buyBox(HUD.gachaShopCardBuy(j), Ks); });
          if (pages) hudText(ctx, `휠로 더 보기 (${sc + 1}/${pages + 1})`, MW - 10, VIEW_H - 10, '#777', 'right', 7); }
      } else { // ── 메인: 선택한 배너 배경 + 하단 1뽑/5뽑
        const bg = bannerImg(GACHA.banners[K.id]);
        const bk = GACHA.banners[K.id], fx = (GACHA.bannerFocus && GACHA.bannerFocus[bk]) || 0.5;
        if (bg) drawBannerCover(ctx, bg, 0, 0, MW, VIEW_H, fx); // 캐릭터 쪽을 살려서 메인 영역에 맞춰 자름
        else { ctx.fillStyle = '#1a1626'; ctx.fillRect(0, 0, MW, VIEW_H); hudText(ctx, '배너 불러오는 중…', MW / 2, VIEW_H / 2, '#889', 'center', 9); }
        { const g = ctx.createLinearGradient(0, 0, 0, VIEW_H); g.addColorStop(0, 'rgba(10,8,18,0.45)'); g.addColorStop(0.18, 'rgba(10,8,18,0)'); g.addColorStop(0.7, 'rgba(10,8,18,0.1)'); g.addColorStop(1, 'rgba(10,8,18,0.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, MW, VIEW_H); // 위(재화 줄)·아래(뽑기 버튼)만 어둡게
          const h = ctx.createLinearGradient(0, 0, MW * 0.62, 0); h.addColorStop(0, 'rgba(10,8,18,0.72)'); h.addColorStop(0.55, 'rgba(10,8,18,0.3)'); h.addColorStop(1, 'rgba(10,8,18,0)'); ctx.fillStyle = h; ctx.fillRect(0, 0, MW * 0.62, VIEW_H); } // 글씨가 있는 왼쪽만 어둡게 → 가운데·오른쪽 캐릭터는 밝게
        const TX = 16; // 배너 정보: 왼쪽 아래 (캐릭터 얼굴을 가리지 않게)
        hudText(ctx, '✦ 전설 배너', TX, 128, '#ffe9a0', 'left', 9);
        hudText(ctx, K.name, TX, 140, '#fff', 'left', 18);
        { const LN = K.line && jobLines(K.hero).find((l) => l.id === K.line); hudText(ctx, `${game.data.heroes.get(K.hero).name}${LN ? ' · ' + LN.name + ' 계열' : ''} 전용`, TX, 164, '#bfe6ff', 'left', 8); } // 계열 전용 표시
        const owned = (sv.skins || []).includes(K.id), sh = (sv.shards && sv.shards[K.id]) || 0;
        if (owned) hudText(ctx, '보유 완료 — 조각은 마일리지로 전환', TX, 180, '#ffb0d8', 'left', 7);
        else { // 조각 진행도 게이지
          const bw = 160, bx = TX, by = 180, p = sh / GACHA.shardsNeeded;
          ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, bw, 7); ctx.fillStyle = GACHA.shardColor; ctx.fillRect(bx, by, Math.round(bw * p), 7);
          ctx.strokeStyle = '#8a7a40'; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 6);
          hudText(ctx, `${GACHA.shardName} ${sh} / ${GACHA.shardsNeeded}`, TX, by + 10, GACHA.shardColor, 'left', 8); }
        for (const b of [0, 1]) { const r = HUD.gachaPullBtn(b), cost = b ? GACHA.cost5 : GACHA.costSingle, can = (sv.bank || 0) >= cost, on = hit(r);
          ctx.fillStyle = can ? (on ? 'rgba(255,216,74,0.36)' : 'rgba(120,150,210,0.3)') : 'rgba(90,90,90,0.2)'; ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeStyle = can ? '#ffd84a' : '#555'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
          hudText(ctx, b ? '5뽑' : '1뽑', r.x + r.w / 2, r.y + 5, can ? '#fff' : '#888', 'center', 12);
          hudText(ctx, `${CUR.name} ${cost}`, r.x + r.w / 2, r.y + 20, can ? CUR.color : '#888', 'center', 8); }
        { const r = HUD.gachaRatesBtn(), on = hit(r); ctx.fillStyle = on ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.45)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = '#9ad8ff'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); hudText(ctx, '📊 확률 보기', r.x + r.w / 2, r.y + 4, '#9ad8ff', 'center', 7); } // 좌측 하단
      }
      // ── 오른쪽 사이드바
      ctx.fillStyle = 'rgba(14,11,22,0.96)'; ctx.fillRect(sx, 0, SBW, VIEW_H); ctx.strokeStyle = '#3a3448'; ctx.beginPath(); ctx.moveTo(sx + 0.5, 0); ctx.lineTo(sx + 0.5, VIEW_H); ctx.stroke();
      hudText(ctx, '배너', sx + SBW / 2, 25, '#ffd84a', 'center', 8);
      pool.forEach((Ks, i) => { const r = HUD.gachaBanner(i), sel = o.tab === 0 && o.banner === i, own = (sv.skins || []).includes(Ks.id), on = hit(r);
        const th = bannerImg(GACHA.banners[Ks.id]); if (th) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.globalAlpha = sel ? 1 : 0.6; drawBannerCover(ctx, th, r.x, r.y, r.w, r.h); ctx.restore(); ctx.globalAlpha = 1; }
        ctx.fillStyle = sel ? 'rgba(255,216,74,0.18)' : on ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = sel ? '#ffd84a' : '#51475f'; ctx.lineWidth = sel ? 2 : 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); ctx.lineWidth = 1;
        hudText(ctx, Ks.name, r.x + r.w / 2, r.y + r.h / 2 - 5, '#fff', 'center', 8); if (own) hudText(ctx, '보유', r.x + r.w - 4, r.y + 3, '#ffd84a', 'right', 6); });
      { const r = HUD.gachaShopTab(), act = o.tab === 1, on = hit(r); ctx.fillStyle = act ? 'rgba(255,216,74,0.28)' : on ? 'rgba(255,176,216,0.22)' : 'rgba(255,176,216,0.12)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = act ? '#ffd84a' : GACHA.mileageColor; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); hudText(ctx, '마일리지 상점', r.x + r.w / 2, r.y + 8, act ? '#ffd84a' : GACHA.mileageColor, 'center', 7); }
      // ── 상단 바 (재화)
      ctx.fillStyle = 'rgba(10,8,18,0.66)'; ctx.fillRect(0, 0, VIEW_W, 20);
      { const stashN = Object.values(sv.supplyStash || {}).reduce((a, b) => a + b, 0);
        hudText(ctx, `${CUR.name} ${sv.bank || 0}   ·   ${GACHA.mileageName} ${sv.mileage || 0}   ·   보급품 ${stashN}`, 10, 6, CUR.color, 'left', 9); }
      hudText(ctx, 'Esc / J 닫기', VIEW_W - 8, 6, '#999', 'right', 8);
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, MW / 2, 24, o.msg.color, 'center', 9);
      // 결과 공개
      const at = gachaAnimTime(o);
      if (o.results && o.anim && at < GACHA_ANIM.reveal) { drawGachaSummon(ctx, o, at); return; } // 뽑기 연출 1단계
      if (o.results) {
        ctx.fillStyle = 'rgba(6,5,12,0.9)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        const got = o.results.some((r) => r.type === 'skin');
        const gotEpic = !got && o.results.some((r) => r.type === 'common' && r.tier === 'epic');
        if (!o.anim) // 다 뒤집기 전엔 제목 없음 (결과를 미리 알리지 않음)
        hudText(ctx, got ? '✦ 전설 스킨 획득! ✦' : gotEpic ? '◆ 에픽 스킨 획득! ◆' : '뽑기 결과', VIEW_W / 2, 40, got ? '#ffd84a' : gotEpic ? SKIN_RARITY.epic.color : '#ddd', 'center', 15);
        const n = o.results.length, cw = 86, gap = 8, x0 = (VIEW_W - (n * cw + (n - 1) * gap)) / 2;
        o.results.forEach((res, i) => { const x = x0 + i * (cw + gap), y = 80, h = 120;
          const isSkin = res.type === 'skin', isShard = res.type === 'shard' || res.type === 'shardDupe', isDupe = res.type === 'dupe', isCommon = res.type === 'common', isSupply = res.type === 'supply';
          const Ks = SKINS.find((p) => p.id === res.id), dupeCommon = isDupe && Ks && Ks.source === 'common', RC = SKIN_RARITY[(Ks && Ks.rarity) || 'common'] || SKIN_RARITY.common; // 일반·레어·에픽 색
          ctx.fillStyle = isSkin ? 'rgba(255,216,74,0.14)' : isShard ? 'rgba(255,233,160,0.1)' : isCommon ? (RC === SKIN_RARITY.epic ? 'rgba(197,138,255,0.16)' : RC === SKIN_RARITY.rare ? 'rgba(90,168,255,0.13)' : 'rgba(168,188,207,0.08)') : isSupply ? 'rgba(159,232,159,0.08)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(x, y, cw, h);
          ctx.strokeStyle = isSkin ? '#ffd84a' : isShard ? GACHA.shardColor : isCommon ? RC.color : isSupply ? '#9fe89f' : isDupe ? '#ffb0d8' : '#51475f'; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, h - 1);
          if (isSkin || (isDupe && !dupeCommon)) { const th = bannerImg(GACHA.banners[res.id]); if (th) drawBannerCover(ctx, th, x + 4, y + 4, cw - 8, 60); hudText(ctx, Ks ? Ks.name : '', x + cw / 2, y + 70, '#fff', 'center', fitSize(Ks ? Ks.name : '', cw - 8)); }
          if (dupeCommon) { const spr = typeof commonSprite === 'function' && commonSprite(Ks.sprite); if (spr) { const dw = spr.w * 2, dh = spr.h * 2; ctx.drawImage(spr.n, x + cw / 2 - dw / 2, y + 56 - dh, dw, dh); } hudText(ctx, Ks.name, x + cw / 2, y + 66, '#fff', 'center', fitSize(Ks.name, cw - 8)); hudText(ctx, RC.name, x + cw / 2, y + 76, RC.color, 'center', 7); }
          if (isSupply) { const S = GUILD_SUPPLIES.find((q) => q.id === res.id); HUD.drawSupply(ctx, x + cw / 2, y + 36, res.id); hudText(ctx, S ? S.name : '보급품', x + cw / 2, y + 66, '#e8ffe8', 'center', 8); hudText(ctx, '탐험 보급품', x + cw / 2, y + 88, '#9fe89f', 'center', 8); hudText(ctx, '보관함 +1', x + cw / 2, y + 102, '#bbb', 'center', 7); }
          if (res.type === 'shardDupe') { HUD.drawShard(ctx, x + cw / 2, y + 36, 16); hudText(ctx, GACHA.shardName, x + cw / 2, y + 66, GACHA.shardColor, 'center', 8); hudText(ctx, '보유 스킨', x + cw / 2, y + 86, '#ffb0d8', 'center', 8); hudText(ctx, `+${res.mileage} M`, x + cw / 2, y + 100, GACHA.mileageColor, 'center', 8); }
          if (res.type === 'shard') { HUD.drawShard(ctx, x + cw / 2, y + 36, 16); hudText(ctx, GACHA.shardName, x + cw / 2, y + 70, GACHA.shardColor, 'center', 8); hudText(ctx, `${res.count} / ${GACHA.shardsNeeded}`, x + cw / 2, y + 96, '#fff', 'center', 10); } // 조각: 전용 아이콘(배경 없음)
          else if (isCommon) { const Cs = SKINS.find((p) => p.id === res.id), spr = typeof commonSprite === 'function' && commonSprite(Cs && Cs.sprite); if (spr) { const sc = 2, dw = spr.w * sc, dh = spr.h * sc; ctx.drawImage(spr.n, x + cw / 2 - dw / 2, y + 56 - dh, dw, dh); } hudText(ctx, Cs ? Cs.name : '', x + cw / 2, y + 66, '#fff', 'center', fitSize(Cs ? Cs.name : '', cw - 8)); hudText(ctx, `${RC.name} 획득`, x + cw / 2, y + 92, RC.color, 'center', 9); }
          else if (isSkin) { hudText(ctx, '완성 획득!', x + cw / 2, y + 88, '#ffd84a', 'center', 9); if (res.refund) hudText(ctx, `모은 조각 +${res.refund} M`, x + cw / 2, y + 102, GACHA.mileageColor, 'center', 6); }
          else if (isDupe) { hudText(ctx, '보유', x + cw / 2, y + 88, '#ffb0d8', 'center', 9); hudText(ctx, `+${res.mileage} M`, x + cw / 2, y + 102, GACHA.mileageColor, 'center', 8); }
          else if (!isSupply && res.type !== 'shardDupe' && res.mileage) { hudText(ctx, `+${res.mileage}`, x + cw / 2, y + 48, GACHA.mileageColor, 'center', 13); hudText(ctx, GACHA.mileageName, x + cw / 2, y + 68, '#bbb', 'center', 7); }
          if (o.anim) { const rr = { x, y, w: cw, h }; if (!drawGachaCardBack(ctx, rr, at, i, o)) drawGachaFlipFx(ctx, rr, at, i, o); } }); // 뽑기 연출 2단계: 한 장씩 뒤집힘
        hudText(ctx, o.anim ? '클릭 — 건너뛰기' : '아무 곳이나 클릭 / Enter — 닫기', VIEW_W / 2, VIEW_H - 30, '#999', 'center', 9);
      }
      // 확률표 팝업
      if (o.rates) {
        ctx.fillStyle = 'rgba(6,5,12,0.92)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        const pw = 320, ph = 232, px = VIEW_W / 2 - pw / 2, py = VIEW_H / 2 - ph / 2;
        ctx.fillStyle = 'rgba(20,16,30,0.98)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = '#ffd84a'; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
        hudText(ctx, '뽑기 확률', VIEW_W / 2, py + 12, '#ffd84a', 'center', 12);
        const rows = [['전설 스킨 완성품 (배너)', `${Math.round(GACHA.legendRate * 100)}%`, '#ffd84a'], [`${GACHA.shardName} (배너 스킨)`, `${Math.round(GACHA.shardRate * 100)}%`, GACHA.shardColor], ['에픽 스킨', `${Math.round(GACHA.epicRate * 100)}%`, SKIN_RARITY.epic.color], ['레어 스킨', `${Math.round(GACHA.rareRate * 100)}%`, SKIN_RARITY.rare.color], ['일반 스킨', `${Math.round(GACHA.commonRate * 100)}%`, SKIN_RARITY.common.color], ['탐험 보급품', `${Math.round((1 - GACHA.legendRate - GACHA.shardRate - GACHA.epicRate - GACHA.rareRate - GACHA.commonRate) * 100)}%`, '#9fe89f']];
        rows.forEach(([n2, p2, c], i) => { const ry = py + 38 + i * 20; hudText(ctx, n2, px + 20, ry, '#eee', 'left', 9); hudText(ctx, p2, px + pw - 20, ry, c, 'right', 10); });
        hudText(ctx, `· ${GACHA.shardName} ${GACHA.shardsNeeded}개를 모으면 그 배너 스킨 완성`, VIEW_W / 2, py + 166, '#bfe6ff', 'center', 8);
        hudText(ctx, `· 가진 스킨이면 ${GACHA.mileageName}: 완성품 ${GACHA.dupeMileage} · 조각 ${GACHA.shardDupeMileage} · 에픽 ${GACHA.epicDupeMileage} · 레어 ${GACHA.rareDupeMileage} · 일반 ${GACHA.commonDupeMileage}`, VIEW_W / 2, py + 180, '#ffb0d8', 'center', 8);
        hudText(ctx, '· 보급품은 보관함에 쌓이고 탐험마다 종류별 1개씩 사용', VIEW_W / 2, py + 194, '#9fe89f', 'center', 8);
        hudText(ctx, '클릭 / Esc — 닫기', VIEW_W / 2, py + ph - 16, '#999', 'center', 8);
      }
    } else if (o.type === 'codex' || o.type === 'armory' || o.type === 'trial_weapons') {
      const sv = game.save, disc = new Set(sv.discovered), armory = o.type === 'armory', tw = o.type === 'trial_weapons';
      const m = game.input.mouse;
      const title = tw ? `${game.trialDef.title} — 들고 갈 무기 2개 (모두 +${game.trialDef.kit.lv} 강화)   ·   ${o.picked.map((id, i) => `${i + 1}. ${game.data.weapons.get(id).name}`).join('   ') || '아직 고르지 않음'}` : armory ? `무기고  ·  보유 ${CUR.name} ${sv.bank}  ·  시작 보조 무기: ${sv.loadout ? game.data.weapons.get(sv.loadout).name : '없음'}`
        : `무기 도감  (${DATA_WEAPONS.filter((d) => disc.has(d.id)).length}/${DATA_WEAPONS.length})`;
      hudText(ctx, title, VIEW_W / 2, 7, '#ffd84a', 'center', 11);
      let hover = null;
      const tab = o.tab || 0;
      WEAPON_TABS.forEach((T, i) => {
        const r = tabRect(i), n = DATA_WEAPONS.filter(T.test), found = n.filter((d) => disc.has(d.id)).length;
        ctx.fillStyle = i === tab ? 'rgba(255,216,74,0.25)' : 'rgba(255,255,255,0.07)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        hudText(ctx, `${i + 1} ${T.name} ${found}/${n.length}`, r.x + r.w / 2, r.y + 3, i === tab ? '#ffd84a' : '#aaa', 'center', 8);
      });
      const page = Math.min(o.page || 0, gridPages(tab) - 1), pages = gridPages(tab);
      if (pages > 1) ['◀', '▶'].forEach((t, i) => { const r = pageBtn(i), en = i ? page < pages - 1 : page > 0, on = en && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h; // 페이지 버튼
        ctx.fillStyle = on ? 'rgba(255,216,74,0.3)' : 'rgba(255,255,255,0.08)'; ctx.fillRect(r.x, r.y, r.w, r.h); hudText(ctx, t, r.x + r.w / 2, r.y + 2, en ? '#ffd84a' : '#555', 'center', 9); });
      for (const c of weaponGrid(tab, page)) {
        const on = m.x >= c.x && m.x < c.x + c.w && m.y >= c.y && m.y < c.y + c.h;
        if (on) hover = c;
        const owned = sv.armory.includes(c.d.id), pk = tw ? o.picked.indexOf(c.d.id) : -1, eq = tw ? pk >= 0 : sv.loadout === c.d.id;
        ctx.fillStyle = eq ? (tw ? 'rgba(191,230,255,0.25)' : 'rgba(255,216,74,0.22)') : on && (armory || tw) ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        if (!disc.has(c.d.id)) { hudText(ctx, '???', c.x + 8, c.y + 8, '#555', 'left', 9); continue; }
        ctx.save(); ctx.beginPath(); ctx.rect(c.x, c.y, c.w - 3, c.h); ctx.clip(); // 칸 밖으로 글자가 삐져나오지 않게
        drawWeaponCentered(ctx, c.d, c.x + 13, c.y + c.h / 2, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined));
        hudText(ctx, c.d.name, c.x + 27, c.y + 2, RARITY_COLOR[c.d.rarity], 'left', 8);
        if (tw) hudText(ctx, pk >= 0 ? `${pk + 1}번 무기` : weaponTraits(c.d, 2), c.x + 27, c.y + 13, pk >= 0 ? '#bfe6ff' : '#c8b890', 'left', 7);
        else if (armory) {
          const st = eq ? ['장착됨', '#ffd84a'] : owned ? ['보유', '#9fe89f'] : [`해금 ${ARMORY_PRICE[c.d.rarity]} ${CUR.name}`, sv.bank >= ARMORY_PRICE[c.d.rarity] ? '#fff' : '#888'];
          hudText(ctx, st[0], c.x + 27, c.y + 13, st[1], 'left', 7);
        } else hudText(ctx, weaponTraits(c.d, 2), c.x + 27, c.y + 13, '#c8b890', 'left', 7);
        ctx.restore();
      }
      const hd = hover && disc.has(hover.d.id) ? hover.d : null; // 호버한 무기 (발견한 것만)
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 30, o.msg.color, 'center', 9);
      else if (hd) { // 설명 패널: 이름·등급·스탯·특성 + 메커니즘 설명
        const bx = 28, bw = VIEW_W - 56, by = 248, bh = 23;
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = RARITY_COLOR[hd.rarity]; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        hudText(ctx, `${hd.name}  ·  ${RARITY_NAME[hd.rarity]}  ·  ${weaponStatLine(hd)}  ·  ${weaponTraits(hd)}`, VIEW_W / 2, by + 3, RARITY_COLOR[hd.rarity], 'center', 8);
        hudText(ctx, hd.desc || weaponTraits(hd, 4), VIEW_W / 2, by + 13, '#d8cfae', 'center', 7);
      } else hudText(ctx, tw ? '도감에서 발견한 무기 중에서 고를 수 있습니다' : armory ? '던전에서 발견한 무기를 해금해 시작 보조 무기로 장착할 수 있습니다' : '무기에 마우스를 올리면 설명이 나옵니다', VIEW_W / 2, VIEW_H - 30, '#ccc', 'center', 9);
      hudText(ctx, `1~4 / 클릭: 탭 전환   ·   ${pages > 1 ? `◀ ▶ · A·D · 휠: 페이지 ${page + 1}/${pages}   ·   ` : ''}${tw ? (o.picked.length ? '클릭: 선택/해제   ·   Enter: 보스전 시작   ·   Esc: 로비로' : '클릭: 무기 선택 (최대 2개)   ·   Esc: 로비로') : 'E / Esc: 닫기'}`, VIEW_W / 2, VIEW_H - 12, pages > 1 ? '#bbb' : '#888', 'center', 8);
    } else if (o.type === 'archive') { // 이야기 기록
      const m = game.input.mouse; hudText(ctx, '이야기 기록 — 지금까지 본 이야기를 다시 봅니다', VIEW_W / 2, 12, '#e0d0b0', 'center', 11);
      STORY_ARCHIVE.forEach((S, i) => { const r = HUD.archiveRow(i), ok = S.unlocked(game.save), on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        ctx.fillStyle = on && ok ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (ok) { ctx.strokeStyle = '#7a6040'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
        hudText(ctx, `${i < 9 ? i + 1 : i === 9 ? 0 : '·'}  ${ok ? S.name : '???'}`, r.x + 10, r.y + 5, ok ? '#fff' : '#555', 'left', 9); hudText(ctx, ok ? '다시 보기' : '아직 보지 못함', r.x + r.w - 10, r.y + 5, ok ? '#e0d0b0' : '#555', 'right', 8); });
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 28, o.msg.color, 'center', 10);
      hudText(ctx, '숫자 키 / 클릭: 다시 보기   ·   E / Esc: 닫기', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 8);
    } else if (o.type === 'guild' || o.type === 'hunt' || o.type === 'trade' || o.type === 'gamble') { // 탐험가 길드 창들
      const sv = game.save, G = game.guild(), m = game.input.mouse, on = (r) => m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
      const box = (r, hl, border) => { ctx.fillStyle = hl ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (border) { ctx.strokeStyle = border; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); } };
      const bar = (x, y, w, k, col) => { ctx.fillStyle = '#2a2638'; ctx.fillRect(x, y, w, 4); ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * Math.min(1, k)), 4); };
      const head = { guild: '탐험가 길드 접수처', hunt: '토벌 게시판', trade: '거래상 — 탐험 보급품', gamble: '결정석 도박' }[o.type];
      hudText(ctx, `${head}  ·  보유 ${CUR.name} ${sv.bank}`, VIEW_W / 2, 6, '#ffd84a', 'center', 11);
      if (o.type === 'guild') {
        ['일일 퀘스트', '주간 퀘스트', '칭호'].forEach((t, i) => { const r = HUD.guildTab(i); box(r, o.tab === i, o.tab === i ? '#ffd84a' : null); hudText(ctx, `${i + 1} ${t}`, r.x + r.w / 2, r.y + 4, o.tab === i ? '#ffd84a' : '#aaa', 'center', 9); });
        if (o.tab < 2) {
          (o.tab ? G.weekly : G.daily).forEach((q, i) => { const r = HUD.guildRow(i), ok = q.prog >= q.n; box(r, on(r), q.claimed ? '#555' : ok ? '#ffd84a' : null);
            hudText(ctx, q.name, r.x + 8, r.y + 4, q.claimed ? '#777' : '#fff', 'left', 9); bar(r.x + 8, r.y + 18, 220, q.prog / q.n, ok ? '#ffd84a' : '#7ad0ff');
            hudText(ctx, `${q.prog.toLocaleString()} / ${q.n.toLocaleString()}`, r.x + 236, r.y + 14, '#aaa', 'left', 8);
            hudText(ctx, q.claimed ? '받음' : ok ? `받기  ${CUR.name} +${q.reward}` : `보상 ${CUR.name} ${q.reward}`, r.x + r.w - 8, r.y + 9, q.claimed ? '#666' : ok ? '#ffd84a' : CUR.color, 'right', 9); });
          hudText(ctx, o.tab ? '주간 퀘스트는 매주 월요일에 바뀝니다' : '일일 퀘스트는 매일 바뀝니다', VIEW_W / 2, 152, '#777', 'center', 8);
        } else game.visibleTitles().forEach((T, i) => { const r = HUD.titleCell(i), got = game.titleUnlocked(T), eq = sv.title === T.id; box(r, on(r) && got, eq ? '#ffd84a' : got ? '#7a6a40' : null);
          hudText(ctx, (eq ? '★ ' : '') + T.name, r.x + 6, r.y + 3, got ? (eq ? '#ffd84a' : '#fff') : '#666', 'left', 9); hudText(ctx, T.desc, r.x + 6, r.y + 15, got ? '#aaa' : '#555', 'left', 7); });
      } else if (o.type === 'hunt') {
        hudText(ctx, `오늘의 의뢰 (클릭: 수락, 동시에 ${GUILD_HUNT.maxActive}개까지)`, 40, 36, '#ffb08a', 'left', 8);
        G.offers.forEach((h, i) => { const r = HUD.guildRow(i), fin = !!(G.huntDone && G.huntDone.ids.includes(h.id)), taken = fin || G.active.some((a) => a.id === h.id && a.day === G.day); box(r, on(r) && !taken, h.kind === 'boss' ? '#a04040' : '#4a6a3a');
          hudText(ctx, (h.kind === 'boss' ? '[보스] ' : '[처치] ') + h.name, r.x + 8, r.y + 4, taken ? '#777' : '#fff', 'left', 9); hudText(ctx, h.where, r.x + 8, r.y + 15, '#888', 'left', 7);
          hudText(ctx, fin ? '완료' : taken ? '수락함' : `보상 ${CUR.name} ${h.reward}`, r.x + r.w - 8, r.y + 9, taken ? '#777' : CUR.color, 'right', 9); });
        hudText(ctx, '수락한 의뢰 (완료하면 클릭해서 보상)', 40, HUD.guildRow(5).y - 12, '#ffb08a', 'left', 8);
        if (!G.active.length) hudText(ctx, '수락한 의뢰가 없습니다', VIEW_W / 2, HUD.guildRow(5).y + 6, '#666', 'center', 9);
        G.active.forEach((h, i) => { const r = HUD.guildRow(5 + i); box(r, on(r), h.done ? '#ffd84a' : null); hudText(ctx, h.name, r.x + 8, r.y + 4, '#fff', 'left', 9);
          bar(r.x + 8, r.y + 18, 220, (h.prog || 0) / h.n, h.done ? '#ffd84a' : '#ff9a6a'); hudText(ctx, h.done ? `받기  ${CUR.name} +${h.reward}` : `${h.prog || 0} / ${h.n}`, r.x + r.w - 8, r.y + 9, h.done ? '#ffd84a' : '#aaa', 'right', 9); });
      } else if (o.type === 'trade') {
        hudText(ctx, '"오늘 들어온 물건이야. 하나씩만 팔지." — 사면 다음 탐험을 시작할 때 적용', VIEW_W / 2, 36, '#b0f0b0', 'center', 8);
        G.stock.forEach((id, i) => { const S = GUILD_SUPPLIES.find((x) => x.id === id), r = HUD.guildRow(i), got = G.bought.includes(id); box(r, on(r) && !got, got ? '#555' : '#4a7a4a');
          hudText(ctx, S.name, r.x + 8, r.y + 4, got ? '#777' : '#fff', 'left', 9); hudText(ctx, S.desc, r.x + 8, r.y + 15, got ? '#555' : '#aaa', 'left', 7);
          hudText(ctx, got ? '구매함' : `${S.price} ${CUR.name}`, r.x + r.w - 8, r.y + 9, got ? '#666' : sv.bank >= S.price ? CUR.color : '#866', 'right', 9); });
        const pend = (sv.supplies || []).map((id) => GUILD_SUPPLIES.find((x) => x.id === id).name);
        hudText(ctx, pend.length ? `다음 탐험에 적용: ${pend.join(', ')}` : '준비된 보급품 없음', VIEW_W / 2, 150, pend.length ? '#9fe89f' : '#666', 'center', 8);
      } else if (o.type === 'gamble') {
        const G = GUILD_GAMBLE, picking = !!sv.gambleCards, res = o.result, spin = o.roll > 0, shuf = o.shuffle > 0;
        hudText(ctx, `${G.bet} ${CUR.name}을 걸고 뒤집힌 결정석 3개 중 하나를 고르세요 — ${G.prizes.join(' · ')}`, VIEW_W / 2, 36, '#aaa', 'center', 8);
        for (let i = 0; i < 3; i++) { const r = HUD.gemRect(i), x = r.x + r.w / 2, y = r.y + r.h / 2 + (spin && o.pending && o.pending.pick === i ? Math.sin(game.time * 40) * 2 : 0) + (shuf ? Math.sin(game.time * 20 + i * 2) * 5 : 0);
          const hov = picking && !spin && on(r), prize = res && res.cards[i], mine = res && res.pick === i;
          const col = !res || spin ? (hov ? '#bfe6ff' : CUR.color) : prize >= 300 ? '#ffd84a' : prize > 0 ? '#9ad8ff' : '#5a6a7a';
          ctx.globalAlpha = res && !spin && !mine ? 0.45 : 1;
          ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 13, y); ctx.lineTo(x, y + 18); ctx.lineTo(x - 13, y); ctx.closePath(); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 11, y); ctx.lineTo(x, y + 16); ctx.lineTo(x - 11, y); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 3, y - 9, 2, 8); ctx.globalAlpha = 1;
          if (hov || (mine && !spin)) { ctx.strokeStyle = '#fff'; ctx.strokeRect(r.x - 2.5, r.y - 2.5, r.w + 5, r.h + 5); }
          if (res && !spin) hudText(ctx, String(prize), x, r.y + r.h + 4, mine ? col : '#777', 'center', mine ? 11 : 9);
          else if (picking) hudText(ctx, String(i + 1), x, r.y + r.h + 4, '#ccc', 'center', 9); }
        if (picking && !spin) hudText(ctx, '결정석을 고르세요  (1~3 / 클릭)', VIEW_W / 2, 156, '#bfe6ff', 'center', 10);
        else if (!spin) { const r = HUD.betRect(), ok = sv.bank >= G.bet; box(r, on(r), ok ? CUR.color : '#555'); hudText(ctx, `${res ? '다시 ' : ''}${G.bet} ${CUR.name} 걸기  (1)`, r.x + r.w / 2, r.y + 6, ok ? '#fff' : '#666', 'center', 10); }
      }
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 28, o.msg.color, 'center', 10);
      hudText(ctx, 'E / Esc: 닫기', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 8);
    } else if (o.type === 'hero_info') { // 캐릭터 상세 정보
      const hero = game.data.heroes.get(o.heroId) || game.player.hero;
      const lines = jobLines(hero.id);
      const idx = clamp(o.branchIndex || 0, 0, Math.max(0, lines.length - 1));
      const line = lines[idx] || null;
      hudText(ctx, `${hero.name} — ${hero.title}`, VIEW_W / 2, 7, '#ffd84a', 'center', 12);

      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(16, 23, VIEW_W - 32, 38);
      ctx.strokeStyle = '#665b78'; ctx.strokeRect(16.5, 23.5, VIEW_W - 33, 37);
      hudText(ctx, `고유 패시브 · ${hero.passiveName || '없음'}`, 25, 27, '#9fe89f', 'left', 9);
      hudWrap(ctx, hero.passiveDesc || '별도 패시브 없음', VIEW_W / 2, 40, VIEW_W - 54, '#ddd', 8, 10);
      hudText(ctx, `기본 능력치  체력 ${hero.maxHp} · 보호막 ${hero.maxShield} · 에너지 ${hero.maxEnergy} · 이동 속도 ${hero.moveSpeed}`, VIEW_W / 2, 63, '#aaa', 'center', 7);

      const chosenId = lines.length > 1 ? game.chosenLine(hero.id).id : null;
      hudText(ctx, lines.length > 1 ? '진화 루트 — 번호 또는 클릭으로 고르면 다음 탐험부터 이 계열로 진화' : '직업 계열', 18, 76, '#ffd84a', 'left', 8);
      lines.forEach((L, i) => {
        const r = HUD.heroBranchRect(i, lines.length);
        const m = game.input.mouse, on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        const active = i === idx;
        ctx.fillStyle = active ? 'rgba(255,216,74,0.16)' : on ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = active ? (L.color || '#ffd84a') : '#51475f';
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        hudText(ctx, `${i + 1}. ${L.name}${L.id === chosenId ? '  ★' : ''}`, r.x + 5, r.y + 2, active ? (L.color || '#ffd84a') : '#eee', 'left', 8); /* ★ = 고른 진화 루트 */
        { const K = SKINS.find((k) => k.hero === hero.id && k.line === L.id && (game.save.skins || []).includes(k.id)); if (K) hudText(ctx, `스킨: ${K.name}`, r.x + r.w - 4, r.y + 2, '#ffb0d8', 'right', 6); } /* 이 계열에서 쓸 수 있는 스킨 */
        hudText(ctx, L.desc, r.x + 5, r.y + 12, '#c8c0d8', 'left', 6);
        hudText(ctx, L.ranks.join(' → '), r.x + 5, r.y + 20, '#888', 'left', 6);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(16, 177, VIEW_W - 32, 85);
      ctx.strokeStyle = line ? (line.color || '#665b78') : '#665b78';
      ctx.strokeRect(16.5, 177.5, VIEW_W - 33, 84);
      if (line) {
        hudText(ctx, `계열 상세 · ${line.name} — ${line.desc}`, VIEW_W / 2, 181, line.color || '#ffd84a', 'center', 8);
        line.skills.forEach((sk, i) => {
          const stage = ['기본', '1차 진화', '2차 진화'][i] || `단계 ${i + 1}`;
          hudText(ctx, `${stage} · ${line.ranks[i]} · ${sk.name} (쿨타임 ${sk.cd}초) — ${sk.desc}`, 24, 198 + i * 19, '#ddd', 'left', 6.5);
        });
      }
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 24, '#ffd84a', 'center', 8);
      hudText(ctx, `숫자 키 / 클릭: ${lines.length > 1 ? '진화 루트 고르기' : '계열 보기'}   ·   S: 스킨   ·   J: 직업 레벨   ·   E / Esc: 닫기`, VIEW_W / 2, VIEW_H - 12, '#888', 'center', 7);
    } else if (o.type === 'joblevel') { // 직업 계열별 독립 레벨 창
      const sv = game.save, J = BALANCE.jobLevel, m = game.input.mouse;
      const entries = game.jobLevelEntries(), pageSize = 16, pageCount = Math.ceil(entries.length / pageSize), page = clamp(o.page || 0, 0, pageCount - 1);
      hudText(ctx, `직업 계열 레벨  ·  보유 ${CUR.name} ${sv.bank}`, VIEW_W / 2, 7, '#7ad0ff', 'center', 11);
      hudText(ctx, `계열마다 독립 성장 · Lv.당 체력 +${J.hp} / 공격력 +${J.atk * 100}% / 에너지 +${J.energy} · 최대 Lv.${J.max}`, VIEW_W / 2, 20, '#aaa', 'center', 7);
      hudText(ctx, `Lv.${J.max} 숙련: 스킬 피해 +${Math.round(J.maxDmg * 100)}% + 계열별 고유 효과 · 현재 선택 계열은 ★ 표시`, VIEW_W / 2, 31, '#ffd84a', 'center', 7);
      entries.slice(page * pageSize, (page + 1) * pageSize).forEach(({ hero, line }, i) => {
        const r = HUD.jobLineRowRect(i), unlocked = sv.unlocked.includes(hero.id), lv = game.jobLevel(hero.id, line.id), cost = game.jobLevelCost(hero.id, line.id), pk = game.linePerk(hero.id, line.id);
        const selected = sv.selected === hero.id && game.chosenLine(hero.id).id === line.id;
        const on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        ctx.fillStyle = selected ? 'rgba(122,208,255,0.16)' : on && unlocked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = selected ? '#7ad0ff' : on && unlocked ? '#aaa' : '#40394c'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.globalAlpha = unlocked ? 1 : 0.45;
        const shortHero = hero.name.split(' ')[0];
        hudText(ctx, `${i + 1}. ${shortHero} · ${line.name}${selected ? ' ★' : ''}`, r.x + 5, r.y + 2, selected ? '#7ad0ff' : unlocked ? (line.color || '#eee') : '#888', 'left', 7);
        hudText(ctx, `Lv.${lv}/${J.max}`, r.x + r.w - 5, r.y + 2, lv >= J.max ? '#ffd84a' : '#c8c0d8', 'right', 7);
        const bonus = `HP +${J.hp * lv}  ATK +${Math.round(J.atk * lv * 1000) / 10}%  EN +${J.energy * lv}`;
        const tail = !unlocked ? '직업 해금 필요' : cost !== null ? `다음 ${cost} ${CUR.name}` : `★ ${pk ? pk.name : '루트 숙련 완료'}`;
        hudText(ctx, bonus, r.x + 5, r.y + 12, unlocked ? '#c8c0d8' : '#777', 'left', 6);
        hudText(ctx, tail, r.x + r.w - 5, r.y + 12, unlocked ? (cost === null ? '#ffd84a' : '#8ab8ff') : '#777', 'right', 6);
        ctx.globalAlpha = 1;
      });
      for (let i = 0; i < pageCount; i++) { const r = HUD.jobLinePageRect(i, pageCount), active = page === i, on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        ctx.fillStyle = active ? 'rgba(122,208,255,0.24)' : on ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = active ? '#7ad0ff' : '#51475f'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        hudText(ctx, `${i + 1} 페이지`, r.x + r.w / 2, r.y + 2, active ? '#7ad0ff' : '#aaa', 'center', 7);
      }
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, 267, o.msg.color, 'center', 8);
      hudText(ctx, `클릭: 계열 레벨업 · 1~8: 빠른 선택 · ← / → 또는 PageUp / PageDown: 페이지 이동 · E / Esc: ${o.returnToHeroInfo ? '상세 정보로' : '닫기'}`, VIEW_W / 2, VIEW_H - 5, '#888', 'center', 6.5);
    } else if (o.type === 'buff') {
      hudText(ctx, o.title || '보스 처치! 축복을 하나 고르세요', VIEW_W / 2, 50, '#ffd84a', 'center', 14);
      o.options.forEach((b, i) => {
        const r = HUD.buffRect(i), hover = game.input.mouse.x >= r.x && game.input.mouse.x <= r.x + r.w && game.input.mouse.y >= r.y && game.input.mouse.y <= r.y + r.h;
        ctx.fillStyle = hover ? 'rgba(255,220,120,0.25)' : 'rgba(255,255,255,0.08)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = hover ? '#ffd84a' : '#666'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        hudText(ctx, `${i + 1}`, r.x + 8, r.y + 6, '#888', 'left', 9);
        hudText(ctx, b.name, r.x + r.w / 2, r.y + 26, '#fff', 'center', 12);
        hudText(ctx, b.desc, r.x + r.w / 2, r.y + 50, '#ccc', 'center', 9);
      });
      hudText(ctx, '클릭 또는 1 / 2 / 3', VIEW_W / 2, 200, '#888', 'center', 9);
    } else if (o.type === 'variant') {
      const variantHero = o.hero || game.player.hero;
      hudText(ctx, `${variantHero.name} — ${o.title}`, VIEW_W / 2, 28, '#ffd84a', 'center', 14);
      hudText(ctx, o.trialRank != null ? `${game.trialDef.title} — 고른 갈래의 ${o.trialRank === 2 ? '최종 진화(3진)' : (o.trialRank + 1) + '진'}으로 싸웁니다` : o.branch ? '플레이할 계열을 선택하세요. 선택한 계열의 무기와 기본 스킬이 적용됩니다.' : '이번 탐험의 갈래를 고르세요. 전직의 방에서 두 번 진화하며 스킬이 바뀝니다.', VIEW_W / 2, 48, '#bbb', 'center', 8);
      o.lines.forEach((L, i) => { const r = HUD.variantRect(i, o.lines.length), m = game.input.mouse, on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h, current = o.branch && L.id === o.currentLineId;
        ctx.fillStyle = current ? 'rgba(255,216,74,0.13)' : on ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = L.color || '#ffd84a'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        hudText(ctx, `${i + 1}  ${o.trialRank != null ? L.ranks[o.trialRank] + (o.trialRank === 2 ? ' (최종 진화)' : ` (${o.trialRank + 1}진)`) : L.name + (current ? '  ★ 현재' : '')}`, r.x + 6, r.y + 5, L.color || '#ffd84a', 'left', 11); // 선택 계열은 ★로 표시
        hudText(ctx, L.desc, r.x + 6, r.y + 21, '#ccc', 'left', 7);
        hudText(ctx, o.trialRank != null ? `스킬: ${L.skills[o.trialRank].name}` : L.skills.map((s) => s.name).join(' → '), r.x + 6, r.y + 34, '#ffe9a0', 'left', 7);
        hudText(ctx, L.ranks.join(' → '), r.x + 6, r.y + 46, '#8a8a9a', 'left', 7); });
    } else if (o.type === 'evolve') {
      const p = game.player, L = o.npc.branch || p.line, n = p.rank + 1, hy = o.npc.hybrid, sk = hy ? hy.H.skill : L.skills[n];
      hudText(ctx, `${L.ranks[p.rank]}  →  ${hy ? game.hybridTitle(o.npc) : L.ranks[n]}`, VIEW_W / 2, 56, hy ? (hy.el.color || '#ffd84a') : '#ffd84a', 'center', 15);
      if (hy) hudText(ctx, `혼합 전직 — ${hy.el.name}의 마도사 상위자가 나타났습니다 · 근접 공격에 ${Math.round(hy.H.passiveChance * 100)}% 확률로 속성 상태이상`, VIEW_W / 2, 70, '#c8b8e0', 'center', 8);
      hudText(ctx, `새 스킬: ${sk.name}`, VIEW_W / 2, 84, '#ffe9a0', 'center', 11);
      hudText(ctx, sk.desc, VIEW_W / 2, 100, '#ccc', 'center', 9);
      hudText(ctx, `최대 체력 +${EVOLUTION.hp[n - 1]} · 최대 에너지 +${EVOLUTION.energy[n - 1]}`, VIEW_W / 2, 114, '#9fe89f', 'center', 8);
      hudText(ctx, `1  시련 — ${hy ? hy.el.name + '의 마도사 ' : ''}상위자와 대결 (이기면 무료로 진화)`, VIEW_W / 2, 142, '#fff', 'center', 10);
      hudText(ctx, `2  대가 — ${game.evolvePrice()}골드를 내고 바로 진화 (보유 ${game.gold})`, VIEW_W / 2, 160, game.gold >= game.evolvePrice() ? '#fff' : '#888', 'center', 10);
      if (o.msg) hudText(ctx, o.msg, VIEW_W / 2, 180, '#ff9a9a', 'center', 9);
      hudText(ctx, 'E / Esc: 닫기', VIEW_W / 2, VIEW_H - 16, '#888', 'center', 8);
    } else if (o.type === 'admin') { // 관리자 메뉴
      const m = game.input.mouse; hudText(ctx, '👑 관리자 메뉴', VIEW_W / 2, 12, '#ffd84a', 'center', 12);
      game.adminActions().forEach((a, i) => { const r = HUD.adminCell(i), ok = !('ok' in a) || !!a.ok, on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        ctx.fillStyle = on && ok ? 'rgba(255,216,74,0.16)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        hudText(ctx, `${i < 10 ? (i + 1) % 10 : '·'}  ${a.name}`, r.x + 6, r.y + 4, ok ? (/\[켜짐\]/.test(a.name) ? '#9fe89f' : /태고룡/.test(a.name) ? '#ffc040' : '#fff') : '#555', 'left', 8); });
      if (o.msg && o.msg.t > 0) hudText(ctx, o.msg.text, VIEW_W / 2, VIEW_H - 28, o.msg.color, 'center', 10);
      hudText(ctx, '숫자 키(1~0) / 클릭: 실행   ·   ` / Esc: 닫기', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 8);
    } else if (o.type === 'multi') { // 멀티 방
      const m = game.input.mouse, row = (i, s, en = true, col) => { const r = HUD.adminRow(i), on = en && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        ctx.fillStyle = on ? 'rgba(122,208,255,0.18)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h); hudText(ctx, s, r.x + 10, r.y + 5, en ? col || '#fff' : '#666', 'left', 10); };
      hudText(ctx, '멀티 플레이 (2~4인 협동)', VIEW_W / 2, 12, '#7ad0ff', 'center', 12);
      const st = { off: '연결 안 됨', connecting: '서버에 연결하는 중… (무료 서버는 처음 깨어나는 데 최대 1분)', online: '서버 연결됨' + (Net.ping != null ? ` · 지연 ${Net.ping}ms` : '') }[Net.status];
      hudText(ctx, st, VIEW_W / 2, VIEW_H - 44, Net.status === 'online' ? '#9fe89f' : '#c8b890', 'center', 8);
      if (Net.error) hudText(ctx, Net.error, VIEW_W / 2, VIEW_H - 30, '#ff9a9a', 'center', 8);
      if (o.mode === 'code') {
        hudText(ctx, '방 코드 4글자를 입력하세요', VIEW_W / 2, 70, '#ddd', 'center', 10);
        for (let i = 0; i < 4; i++) { const x = VIEW_W / 2 - 66 + i * 34; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, 92, 28, 34); ctx.strokeStyle = i === o.code.length ? '#7ad0ff' : '#555'; ctx.strokeRect(x + 0.5, 92.5, 27, 33);
          if (o.code[i]) hudText(ctx, o.code[i], x + 14, 100, '#fff', 'center', 18); }
        hudText(ctx, '알파벳 입력 · Backspace 지우기 · Enter 참가 · Esc 뒤로', VIEW_W / 2, 142, '#888', 'center', 8);
      } else if (!Net.inRoom) {
        row(0, '1  방 만들기 (내가 방장)'); row(1, '2  방 코드로 참가');
        hudText(ctx, '같은 방 사람들과 로비에서 서로 보입니다 · 함께 던전 들어가기는 다음 단계에서 열립니다', VIEW_W / 2, 100, '#888', 'center', 8);
      } else {
        row(0, '1  방 나가기', true, '#ff9a9a');
        hudText(ctx, `방 코드  ${Net.code}`, VIEW_W / 2, 66, '#ffd84a', 'center', 18);
        hudText(ctx, '친구에게 이 코드를 알려 주세요', VIEW_W / 2, 88, '#aaa', 'center', 8);
        Net.players.forEach((pl, i) => { const y = 104 + i * 16, h = game.data.heroes.get(pl.hero);
          hudText(ctx, `${pl.host ? '👑 ' : ''}${pl.name}${pl.id === Net.id ? ' (나)' : ''}`, VIEW_W / 2 - 80, y, pl.id === Net.id ? '#7affc0' : '#fff', 'left', 9);
          hudText(ctx, h ? h.name : '', VIEW_W / 2 + 80, y, '#c8b890', 'right', 8); });
        hudText(ctx, `${Net.players.length} / ${NET_CONFIG.maxPlayers}명`, VIEW_W / 2, 104 + 4 * 16 + 4, '#888', 'center', 8);
      }
      hudText(ctx, '숫자 키 / 클릭 · E / Esc 닫기', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 8);
    } else if (o.type === 'rank') { // 명예의 전당
      const T = (s, x, y, c = '#e8e0f0', a = 'left', z = 8) => hudText(ctx, s, x, y, c, a, z), tabs = ['최고 도달', '한 판 처치', '심층 깊이', '멀티 파티'], keys = ['stage', 'kills', 'deep', 'coop'];
      T('🏆 명예의 전당', VIEW_W / 2, 6, '#ffd84a', 'center', 11);
      tabs.forEach((t, i) => { const r = HUD.rankTab(i), on = o.tab === i; ctx.fillStyle = on ? 'rgba(255,216,74,0.25)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h); T(`${i + 1} ${t}`, r.x + r.w / 2, r.y + 4, on ? '#ffd84a' : '#aaa', 'center', 9); });
      if (o.loading) T('불러오는 중…', VIEW_W / 2, 120, '#aaa', 'center', 10);
      else if (o.err) T(o.err, VIEW_W / 2, 120, '#ff9a9a', 'center', 9);
      else {
        const list = (o.data && o.data[keys[o.tab]]) || [], me = game.profile && game.profile.name;
        T('순위', 30, 44, '#ffd84a'); T(o.tab === 3 ? '파티' : '이름', 62, 44, '#ffd84a'); if (o.tab !== 3) { T('칭호', 140, 44, '#ffd84a'); T('직업', 236, 44, '#ffd84a'); }
        T(o.tab === 1 ? '처치' : o.tab === 2 ? '심층' : '도달', 330, 44, '#ffd84a', 'right'); T('기록', VIEW_W - 30, 44, '#ffd84a', 'right');
        if (!list.length) T('아직 기록이 없습니다. 탐험을 마치면 이름이 올라갑니다!', VIEW_W / 2, 120, '#888', 'center', 9);
        list.slice(0, 15).forEach((r, i) => { const y = 58 + i * 13, mine = o.tab === 3 ? (me && r.party.includes(me)) : r.name === me, col = i === 0 ? '#ffd84a' : i === 1 ? '#d8dce8' : i === 2 ? '#d89a5a' : mine ? '#7affc0' : '#e8e0f0';
          if (mine) { ctx.fillStyle = 'rgba(122,255,192,0.1)'; ctx.fillRect(24, y - 2, VIEW_W - 48, 12); }
          T(String(i + 1), 34, y, col); T(o.tab === 3 ? r.party : r.name, 62, y, col); if (o.tab !== 3) { const h = game.data.heroes.get(r.hero); T(h ? h.name : '', 236, y, '#c8b890', 'left', 7);
            const tt = r.title && GUILD_TITLES.find((t) => t.id === r.title); if (tt) T('「' + tt.name + '」', 140, y + 1, tt.hidden ? '#ffd84a' : '#b8a8e8', 'left', 6); } /* 랭킹 칭호 (히든 칭호는 금색) */
          T(o.tab === 1 ? String(r.kills) : o.tab === 2 ? '심층 ' + r.deep : r.label || String(r.stage), 330, y, col, 'right');
          T(`${r.label || ''}${r.victory ? ' · 귀환' : ''} · 처치 ${r.kills}`, VIEW_W - 30, y, '#888', 'right', 7); });
        if (o.data && o.data.restored) T('서버가 다시 시작되어 비어 있던 기록을 이 기기의 사본으로 복구했어요', VIEW_W / 2, VIEW_H - 36, '#7affc0', 'center', 7);
      }
      const who = game.admin ? ['관리자 계정은 랭킹에 기록되지 않아요 (일반 계정으로 플레이하면 기록)', '#ffb070'] : !game.profile ? ['게스트는 랭킹에 기록되지 않아요 — 계정으로 로그인하면 기록', '#ffb070'] : [`${game.profile.name} 계정 · 탐험을 마치면 자동으로 기록`, '#7affc0'];
      T(who[0], VIEW_W / 2, VIEW_H - 24, who[1], 'center', 7);
      T('1~4 / 클릭: 분야   ·   E / Esc: 닫기', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 8);
    } else if (o.type === 'quests') { drawQuestWindow(ctx, game, o); // 퀘스트 창 (js/systems/quests.js)
    } else if (o.type === 'details') { // 상세 정보 (수치는 설정값에서 바로 읽음)
      const m = game.input.mouse, T = (s, x, y, c = '#e8e0f0', a = 'left', z = 8) => hudText(ctx, s, x, y, c, a, z), pct = (v) => (Math.round(v * 1000) / 10) + '%';
      ['특수방 확률', '무기 강화', '원소 반응'].forEach((t, i) => { const r = HUD.guildTab(i), on = o.tab === i; ctx.fillStyle = on ? 'rgba(255,216,74,0.25)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h); T(`${i + 1} ${t}`, r.x + r.w / 2, r.y + 4, on ? '#ffd84a' : '#aaa', 'center', 9); });
      T('상세 정보', VIEW_W / 2, 6, '#ffd84a', 'center', 11);
      if (o.tab === 0) {
        const SR = BALANCE.specialRooms, ER = SR.evolveByRank, others = SR.pool.filter((t) => t !== 'evolve'), w = (t) => (SR.weight && SR.weight[t]) || 1;
        const NAME = { fountain: ['회복의 샘', '체력 40%·에너지·보호막 회복'], altar: ['축복의 제단', '골드를 내고 버프 1개'], gamble: ['행운의 기계', '골드를 걸고 뽑기 (꽝·본전·2배·3배·물약·에너지·무기)'],
          challenge: ['도전의 방', '강화된 정예 3웨이브 → 희귀 이상 무기'], forge: ['제련소', '골드를 내고 든 무기를 같은 등급 이상으로 바꿈 (' + pct(SR.forgeUpChance) + ' 등급 상승)'],
          blood: ['피의 제단', '최대 체력 ' + pct(SR.bloodCost) + '를 바치고 영웅 이상 무기'], rack: ['무기 진열대', '무기 3개 중 1개'], smithy: ['강화소', '싸고 성공률 높은 강화'], evolve: ['전직의 방', '상위자와 대결하거나 골드를 내고 진화'] };
        T(`보스가 아닌 스테이지마다 ${pct(SR.chance)} 확률로 특수방 1개 (보물방·상점·출구는 항상 따로 있음)`, 40, 44, '#c8c0d8');
        const tot = (e) => others.reduce((s, t) => s + w(t), 0) + e;
        T('방', 40, 58, '#ffd84a'); T('하는 일', 120, 58, '#ffd84a'); T('가중치', 330, 58, '#ffd84a', 'right'); T('1차 전 / 2차 전 / 최종 후', VIEW_W - 40, 58, '#ffd84a', 'right');
        SR.pool.forEach((t, i) => { const y = 72 + i * 14, ev = t === 'evolve', [n, d] = NAME[t] || [t, ''];
          const p = (e, isEv) => SR.chance * (isEv ? e : w(t)) / tot(e);
          T(n, 40, y, ev ? '#fff4a0' : '#fff'); T(d, 120, y, '#bbb', 'left', 7); T(ev ? `${ER[0].weight} / ${ER[1].weight}` : String(w(t)), 330, y, '#ddd', 'right');
          T(ev ? `${pct(p(ER[0].weight, true))} / ${pct(p(ER[1].weight, true))} / 없음` : `${pct(p(ER[0].weight))} / ${pct(p(ER[1].weight))} / ${pct(SR.chance * w(t) / tot(0))}`, VIEW_W - 40, y, '#9ad8ff', 'right'); });
        T('오른쪽 확률 = 한 스테이지에서 그 방이 나올 확률 (진화 단계에 따라 달라짐)', 40, 72 + SR.pool.length * 14 + 4, '#888', 'left', 7);
      } else if (o.tab === 1) {
        const U = BALANCE.upgrade, R = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        T(`최대 +${U.maxLevel}강 · 한 단계마다 피해 +${pct(U.perLevel)} · 실패해도 단계는 내려가지 않음 · 강화는 그 판에서만 유지`, 40, 44, '#c8c0d8');
        T('단계', 40, 62, '#ffd84a'); T('성공 확률 (모루)', 150, 62, '#ffd84a', 'center'); T('성공 확률 (강화소)', 260, 62, '#ffd84a', 'center'); T('누적 피해', 360, 62, '#ffd84a', 'center');
        U.chance.forEach((c, i) => { const y = 76 + i * 14; T(`+${i} → +${i + 1}`, 40, y); T(pct(c), 150, y, '#9fe89f', 'center'); T(pct(Math.min(1, c + U.forgeRoomBonus)), 260, y, '#9ad8ff', 'center'); T('+' + pct(U.perLevel * (i + 1)), 360, y, '#ffd8a0', 'center'); });
        const y0 = 76 + U.chance.length * 14 + 8;
        T(`비용 = ${U.base} × 다음 단계 × 등급 배율 × 스테이지 물가(스테이지마다 +${pct(BALANCE.shopInflate)})`, 40, y0, '#c8c0d8');
        T('등급 배율: ' + R.map((r) => `${RARITY_NAME[r]} ×${U.rarityMult[r]}`).join(' · '), 40, y0 + 14, '#c8c0d8');
        T(`강화소(특수방): 비용 ${pct(1 - U.forgeRoomDiscount)} 할인 · 성공 확률 +${pct(U.forgeRoomBonus)}`, 40, y0 + 28, '#9ad8ff');
      } else {
        T('상태이상: 화상(불) · 빙결(얼음) · 중독(자연) · 전격(번개) · 실명(빛) · 저주(어둠) — 서로 다른 둘이 겹치면 반응', 40, 44, '#c8c0d8');
        const RX = [['열충격', '화상 + 빙결', '큰 단일 피해, 두 상태 해제'], ['독 연소', '화상 + 중독', '주변 폭발 피해'], ['감전', '빙결 + 전격', '피해 + 주변 3명에게 번개'],
          ['과부하', '화상 + 전격', '큰 폭발로 밀쳐냄'], ['마비', '중독 + 전격', '피해 + 잠깐 완전히 멈춤 (보스는 크게 느려짐)'], ['일식', '실명 + 저주', '큰 단일 피해, 두 상태 해제'],
          ['역병', '저주 + 중독', '주변 적에게 중독이 번짐'], ['지옥불', '화상 + 저주', '검은 불꽃 폭발 + 주변에 화상'], ['심판', '실명 + 전격', '하늘에서 번개 기둥, 큰 단일 피해']];
        T('반응', 40, 62, '#ffd84a'); T('조합', 110, 62, '#ffd84a'); T('효과', 210, 62, '#ffd84a');
        RX.forEach(([n, c, e], i) => { const y = 76 + i * 15; T(n, 40, y, '#9ad8ff'); T(c, 110, y, '#ddd'); T(e, 210, y, '#bbb'); });
        T('반응 피해는 깊이 내려갈수록 적 체력에 맞춰 커짐 · 같은 적에게는 0.8초에 한 번만 반응', 40, 76 + RX.length * 15 + 4, '#888', 'left', 7);
      }
      T('1~3 / 클릭: 탭   ·   I / Esc: 뒤로', VIEW_W / 2, VIEW_H - 12, '#888', 'center', 8);
    } else if (o.type === 'trial_confirm') { // 시련 도전 확인 (롱고미니아드의 시련 · 로드 투 카멜롯)
      const TR = TRIALS[o.id] || RHONGO_TRIAL;
      hudText(ctx, TR.title, VIEW_W / 2, 60, TR.color, 'center', 16);
      hudText(ctx, TR.confirm[0], VIEW_W / 2, 86, '#e8e0f0', 'center', 10);
      hudText(ctx, TR.confirm[1], VIEW_W / 2, 104, '#aaa', 'center', 8);
      hudText(ctx, '지거나 그만둬도 잃는 것은 없고, 언제든 멀린에게 다시 도전할 수 있습니다', VIEW_W / 2, 118, '#aaa', 'center', 8);
      hudText(ctx, '어느 진화 단계로 싸울지 고르세요', VIEW_W / 2, 130, '#bfe6ff', 'center', 8);
      ['1  1진', '2  2진', '3  3진 (최종)', '4  나중에'].forEach((t, i) => { const r = HUD.trialBtn(i), m = game.input.mouse, on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        ctx.fillStyle = on ? 'rgba(191,230,255,0.22)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = i === 3 ? '#777' : '#bfe6ff'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        hudText(ctx, t, r.x + r.w / 2, r.y + 7, i === 3 ? '#ccc' : '#ffffff', 'center', 11); });
      hudText(ctx, '1~3: 진화 단계 골라 도전 (Enter: 3진)   ·   Esc: 나중에', VIEW_W / 2, VIEW_H - 20, '#888', 'center', 8);
    } else if (o.type === 'resume') {
      const r = game.save.run, hero = r && game.data.heroes.get(r.hero), W = r && runWorld(r);
      hudText(ctx, '진행 중인 탐험이 있습니다', VIEW_W / 2, 70, '#7ad0ff', 'center', 16);
      if (r && W) {
        hudText(ctx, `${runLabel(r)} ${W.name}   ·   ${hero ? hero.name : '?'}`, VIEW_W / 2, 100, '#fff', 'center', 11);
        hudText(ctx, `체력 ${Math.round(r.p.hp)}/${r.p.maxHp}   ·   무기 ${r.p.weapons.map((id) => (game.data.weapons.get(id) || { name: '?' }).name).join(', ')}   ·   골드 ${r.gold}`, VIEW_W / 2, 118, '#ccc', 'center', 9);
        hudText(ctx, '그 스테이지의 시작 지점부터 다시 시작합니다', VIEW_W / 2, 134, '#888', 'center', 8);
      }
      hudText(ctx, 'Enter: 이어하기', VIEW_W / 2, 164, '#ffd84a', 'center', 11);
      hudText(ctx, 'N: 새로 시작 (저장된 탐험은 사라집니다)   ·   Esc: 로비에 머무르기', VIEW_W / 2, 182, '#aaa', 'center', 9);
    } else if (o.type === 'story') {
      if (o.sanctum) { // 형체 없는 빛 (전설의 존재의 외형은 미정)
        const k = Math.min(1, (o.i + o.t) / 3), cx = VIEW_W / 2, cy = 92, R = 30 + 50 * k;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, `rgba(255,250,230,${0.5 + 0.4 * k})`); g.addColorStop(0.4, `rgba(255,233,160,${0.25 + 0.3 * k})`); g.addColorStop(1, 'rgba(255,233,160,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      }
      const line = o.lines[Math.min(o.i, o.lines.length - 1)] || '', a = Math.min(1, o.t / 0.6), y0 = o.sanctum ? 180 : 130;
      ctx.globalAlpha = a;
      line.split('\n').forEach((s, j, arr) => hudText(ctx, s, VIEW_W / 2, y0 + (j - (arr.length - 1) / 2) * 16, s.startsWith('「') ? '#ffe9a0' : '#e8e0f0', 'center', s.startsWith('「') ? 14 : 11));
      ctx.globalAlpha = 1;
      hudText(ctx, `${Math.min(o.i + 1, o.lines.length)} / ${o.lines.length}    클릭 · Enter: 다음    Esc: 건너뛰기`, VIEW_W / 2, VIEW_H - 16, '#6a6080', 'center', 8);
    } else if (o.type === 'treasure_pick' || o.type === 'treasures') {
      const pick = o.type === 'treasure_pick', sv = game.save;
      const all = pick ? treasurePickList() : DATA_TREASURES.filter((t) => sv.treasures.includes(t.id)), pages = Math.max(1, Math.ceil(all.length / 3)), pg = Math.min(o.page || 0, pages - 1);
      const list = all.slice(pg * 3, pg * 3 + 3); // 한 쪽에 3개 (휠·←→로 넘김)
      hudText(ctx, pick ? '보구 선택' : '보구 보관대', VIEW_W / 2, 30, '#ffe9a0', 'center', 16);
      hudText(ctx, pick ? '하나를 골라 영원히 간직합니다. 사망해도 사라지지 않습니다. (효과는 로비의 보구 보관대에서 볼 수 있습니다)' : '보유한 보구 중 하나를 골라 탐험에 들고 갑니다 (다시 누르면 해제)', VIEW_W / 2, 54, '#bbb', 'center', 9);
      const had = pick && sv.treasures.length > 0 && !o.picked;
      if (had) hudText(ctx, '이미 첫 보구를 받았습니다. 추가 보구를 얻는 방법은 아직 정해지지 않았습니다.', VIEW_W / 2, 130, '#aaa', 'center', 9);
      else if (!list.length) hudText(ctx, pick ? '제시될 보구가 아직 정해지지 않았습니다 (기획 미정)' : '아직 보유한 보구가 없습니다', VIEW_W / 2, 130, '#888', 'center', 10);
      if (!had) list.forEach((t, i) => {
        const r = HUD.treasureRect(i, list.length), eq = !pick && sv.treasureEquipped === t.id;
        ctx.fillStyle = eq ? 'rgba(255,233,160,0.2)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#c8a050'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.fillStyle = 'rgba(255,216,74,0.08)'; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 24, 18 + Math.sin(game.time * 3 + i) * 1.5, 0, TAU); ctx.fill(); // 아이콘 뒤 빛
        drawTreasureIcon(ctx, t, r.x + r.w / 2, r.y + 24, 2, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined));
        hudText(ctx, t.name, r.x + r.w / 2, r.y + 44, '#ffe9a0', 'center', 11);
        if (t.origin) hudText(ctx, t.origin, r.x + r.w / 2, r.y + 59, '#a898c0', 'center', 8);
        if (pick) hudText(ctx, '?', r.x + r.w / 2, r.y + 86, '#a898c0', 'center', 16); // [사용자 결정] 성역의 보구 선택에서는 효과를 보여 주지 않음 (보관대에서 확인)
        else { if (t.desc) hudWrap(ctx, t.desc, r.x + r.w / 2, r.y + 73, r.w - 12, '#ddd', 8, 11);
          if (t.cooldown) hudText(ctx, `R키 · 쿨타임 ${t.cooldown}초`, r.x + r.w / 2, r.y + r.h - 28, '#c8b890', 'center', 8); }
        if (eq) hudText(ctx, '장착됨', r.x + r.w / 2, r.y + r.h - 14, '#ffd84a', 'center', 8);
      });
      if (pages > 1 && !had) { for (const d of [0, 1]) { const r = HUD.treasurePageBtn(d), on = d ? pg < pages - 1 : pg > 0; ctx.fillStyle = on ? 'rgba(255,233,160,0.18)' : 'rgba(255,255,255,0.04)'; ctx.fillRect(r.x, r.y, r.w, r.h); hudText(ctx, d ? '▶' : '◀', r.x + r.w / 2, r.y + r.h / 2 - 6, on ? '#ffe9a0' : '#555', 'center', 12); }
        hudText(ctx, `${pg + 1} / ${pages}   ·   휠 · ←→ 로 넘기기`, VIEW_W / 2, VIEW_H - 34, '#c8b890', 'center', 8); }
      hudText(ctx, pick ? (all.length && !had ? '클릭: 선택' : 'Enter: 계속') : '클릭: 장착/해제   ·   E / Esc: 닫기', VIEW_W / 2, VIEW_H - 20, '#999', 'center', 9);
    } else if (o.type === 'revive') {
      const cost = 200, bank = game.save.bank, canRevive = bank >= cost;
      hudText(ctx, '쓰러졌습니다', VIEW_W / 2, 65, '#ff7070', 'center', 17);
      const rMax = game.coopRunKey ? 1 : game.reviveMax(), rLeft = game.coopRunKey ? 1 : game.reviveLeft();
      hudText(ctx, rMax > 1 ? `결정석 200개로 부활 — 심층에서는 탐험마다 ${rMax}번까지 (남은 횟수 ${rLeft}/${rMax})` : '결정석 200개를 사용하면 이번 탐험에서 한 번 부활할 수 있습니다.', VIEW_W / 2, 96, '#ddd', 'center', 9);
      hudText(ctx, `보유 결정석: ${bank}개`, VIEW_W / 2, 116, canRevive ? '#7ad0ff' : '#ff9a9a', 'center', 10);
      const reviveRect = HUD.reviveRect(0), leaveRect = HUD.reviveRect(1);
      ctx.fillStyle = canRevive ? 'rgba(90,150,210,0.24)' : 'rgba(90,90,90,0.12)';
      ctx.fillRect(reviveRect.x, reviveRect.y, reviveRect.w, reviveRect.h);
      ctx.strokeStyle = canRevive ? '#7ad0ff' : '#555'; ctx.strokeRect(reviveRect.x + 0.5, reviveRect.y + 0.5, reviveRect.w - 1, reviveRect.h - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(leaveRect.x, leaveRect.y, leaveRect.w, leaveRect.h);
      ctx.strokeStyle = '#888'; ctx.strokeRect(leaveRect.x + 0.5, leaveRect.y + 0.5, leaveRect.w - 1, leaveRect.h - 1);
      hudText(ctx, '1  부활하기 · 200', reviveRect.x + reviveRect.w / 2, reviveRect.y + 9, canRevive ? '#bfe6ff' : '#777', 'center', 9);
      hudText(ctx, '2  포기하고 로비로', leaveRect.x + leaveRect.w / 2, leaveRect.y + 9, '#ddd', 'center', 9);
      if (o.msg) hudText(ctx, o.msg, VIEW_W / 2, 201, '#ff9a9a', 'center', 8);
      else if (!canRevive) hudText(ctx, '결정석이 부족해 부활할 수 없습니다.', VIEW_W / 2, 201, '#ff9a9a', 'center', 8);
      hudText(ctx, '1 / 클릭: 부활   ·   2 / Enter / Esc: 탐험 종료', VIEW_W / 2, VIEW_H - 18, '#888', 'center', 8);
    } else if (o.type === 'result' && o.trial) {
      const TR = TRIALS[o.trialId] || RHONGO_TRIAL;
      hudText(ctx, o.victory ? TR.winText : '시련 실패', VIEW_W / 2, 90, o.victory ? TR.color : '#ff7070', 'center', 16);
      hudText(ctx, o.victory ? TR.winSub : '잃은 것은 없습니다. 멀린에게 말을 걸면 다시 도전할 수 있습니다', VIEW_W / 2, 116, '#ddd', 'center', 9);
      hudText(ctx, 'Enter: 로비로', VIEW_W / 2, 150, '#fff', 'center', 10);
    } else if (o.type === 'result') {
      hudText(ctx, o.victory ? '던전 정복!' : '사망했습니다', VIEW_W / 2, 70, o.victory ? '#ffd84a' : '#ff7070', 'center', 18);
      if (o.after) hudText(ctx, o.after, VIEW_W / 2, 92, '#ffe9a0', 'center', 10);
      else if (game.W.deep) hudText(ctx, `심층 ${game.W.depth}번째 필드까지 내려갔습니다   (최고 기록: 심층 ${game.save.bestDeep || 0})`, VIEW_W / 2, 92, '#9ad8ff', 'center', 10);
      hudText(ctx, `도달: ${game.stageName()}   ·   처치 ${game.kills}   ·   스테이지 ${o.stages}개 · 보스 ${o.bosses}마리`, VIEW_W / 2, 110, '#ddd', 'center', 10);
      hudText(ctx, `${CUR.name} +${o.reward}   (보유 ${game.save.bank} → ${game.save.bank + o.reward})`, VIEW_W / 2, 128, CUR.color, 'center', 10);
      hudText(ctx, o.gold != null ? `남은 골드 ${o.gold.toLocaleString()} → ${CUR.name} +${o.goldBonus || 0}   (골드 ${CUR.goldPer || 25}마다 1 · 골드 자체는 로비로 가져가지 않음)` : '던전 골드는 로비로 가져가지 않습니다', VIEW_W / 2, 142, '#c8b070', 'center', 8);
      hudText(ctx, 'Enter: 로비로', VIEW_W / 2, 160, '#fff', 'center', 10);
    }
  }
  // 보구 획득 알림: 오른쪽 아래에서 아이콘과 함께 미끄러져 들어와 6초 동안 표시
  // 로비 공지 창 (오른쪽 위): js/data/notice.js의 글을 창 너비에 맞춰 줄바꿈
  static noticeBtn() { return { x: VIEW_W - 4 - 16, y: 6, w: 13, h: 11 }; } // 공지 접기/펼치기 버튼
  notice(ctx, game) {
    if (typeof NOTICE === 'undefined' || !NOTICE.lines || !NOTICE.lines.length) return;
    const w = 150, x = VIEW_W - w - 4, pad = 6, lh = 11, maxW = w - pad * 2, folded = !!game.save.noticeFolded;
    const btn = (() => { const r = HUD.noticeBtn(), m = game.input.mouse, on = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
      return () => { ctx.fillStyle = on ? 'rgba(255,216,74,0.35)' : 'rgba(255,255,255,0.1)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = '#7a6040'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(r.x + 3, r.y + 5, r.w - 6, 1); if (folded) ctx.fillRect(r.x + 6, r.y + 2, 1, r.h - 4); }; })(); // - / +
    if (folded) { ctx.fillStyle = 'rgba(10,8,18,0.72)'; ctx.fillRect(x, 4, w, 16); ctx.strokeStyle = '#7a6040'; ctx.strokeRect(x + 0.5, 4.5, w - 1, 15); hudText(ctx, NOTICE.title || '공지', x + pad, 7, '#ffd84a', 'left', 9); btn(); return; }
    ctx.font = "bold 8px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    const rows = []; // 각 줄 앞에 '· ', 넘치는 부분은 들여써서 다음 줄로 (글자 단위라 띄어쓰기가 없어도 넘치지 않음)
    for (const line of NOTICE.lines) {
      let cur = '· ';
      for (const ch of String(line)) { if (ctx.measureText(cur + ch).width > maxW && cur.trim()) { rows.push(cur); cur = ch.trim() ? '  ' + ch : '  '; } else cur += ch; }
      rows.push(cur);
    }
    const h = 22 + rows.length * lh;
    ctx.fillStyle = 'rgba(10,8,18,0.72)'; ctx.fillRect(x, 4, w, h); ctx.strokeStyle = '#7a6040'; ctx.strokeRect(x + 0.5, 4.5, w - 1, h - 1);
    hudText(ctx, NOTICE.title || '공지', x + pad, 8, '#ffd84a', 'left', 9);
    if (NOTICE.date) hudText(ctx, NOTICE.date, x + w - pad - 16, 9, '#8878a0', 'right', 7);
    ctx.fillStyle = 'rgba(255,216,74,0.3)'; ctx.fillRect(x + pad, 20, w - pad * 2, 1);
    rows.forEach((r, i) => hudText(ctx, r, x + pad, 24 + i * lh, '#e8e0f0', 'left', 8));
    btn();
  }
  static rankTab(i) { return { x: 40 + i * 110, y: 22, w: 104, h: 16 }; }
  static gachaSideW() { return 96; } // 오른쪽 사이드바 폭
  static gachaMainW() { return VIEW_W - HUD.gachaSideW(); } // 왼쪽 메인(배너) 폭
  static gachaBanner(i) { const sx = VIEW_W - HUD.gachaSideW(), n = Math.max(4, gachaPool().length), step = Math.min(48, Math.floor((VIEW_H - 40 - 42) / n)); return { x: sx + 6, y: 40 + i * step, w: HUD.gachaSideW() - 12, h: step - 8 }; } // 사이드바 배너 선택 (배너 수에 맞춰 칸 높이 조절 · 아래 상점 버튼과 안 겹치게)
  static gachaShopTab() { const sx = VIEW_W - HUD.gachaSideW(); return { x: sx + 6, y: VIEW_H - 34, w: HUD.gachaSideW() - 12, h: 26 }; } // 마일리지 상점 버튼
  static gachaPullBtn(i) { const mw = HUD.gachaMainW(), w = 150, g = 14, x0 = (mw - (w * 2 + g)) / 2; return { x: x0 + i * (w + g), y: VIEW_H - 46, w, h: 32 }; } // 1뽑/5뽑 (메인 하단)
  static gachaShopRow(i) { const mw = HUD.gachaMainW(), y0 = 56, n = Math.max(4, gachaPool().length), step = Math.min(54, Math.floor((VIEW_H - y0 - 6) / n)); return { x: 10, y: y0 + i * step, w: mw - 20, h: step - 6 }; } // 상점: 메인 영역 세로 리스트 (배너 수에 맞춰)
  static gachaShopSubTab(i) { return { x: 10 + i * 66, y: 36, w: 62, h: 15 }; } // 상점 등급 탭 (전설·에픽·레어·일반)
  static gachaShopCard(j) { const mw = HUD.gachaMainW(), cw = Math.floor((mw - 20 - 3 * 5) / 4), ch = 70, c = j % 4, r = Math.floor(j / 4); return { x: 10 + c * (cw + 5), y: 56 + r * (ch + 5), w: cw, h: ch }; } // 상점 카드 (4열 × 3줄)
  static gachaShopCardBuy(j) { const c = HUD.gachaShopCard(j); return { x: c.x + 36, y: c.y + c.h - 18, w: c.w - 40, h: 14 }; }
  static gachaShopBuy(i) { const r = HUD.gachaShopRow(i); return { x: r.x + r.w - 78, y: r.y + r.h / 2 - 9, w: 72, h: 18 }; }
  static gachaRatesBtn() { return { x: 8, y: VIEW_H - 64, w: 72, h: 16 }; } // 좌측 하단 확률 보기 (1뽑 버튼 위)
  static drawSupply(ctx, cx, cy, id) { // 탐험 보급품 아이콘 (종류별 도트풍 도형)
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#9fe89f'; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(cx + x), Math.round(cy + y), w, h); };
    if (id === 's_bless') { R(-1, -9, 2, 18, '#ffe36b'); R(-9, -1, 18, 2, '#ffe36b'); R(-4, -4, 8, 8, '#fff6c0'); R(-2, -2, 4, 4, '#ffffff'); } // 축복: 빛나는 별
    else if (id === 's_whet') { R(-9, -3, 18, 8, '#7a7f8a'); R(-9, -3, 18, 2, '#b8bec8'); R(-9, 3, 18, 2, '#4a4e58'); R(-5, -6, 3, 3, '#d8dde6'); } // 숫돌
    else if (id === 's_purse') { R(-7, -3, 14, 11, '#8a5a34'); R(-5, -6, 10, 3, '#6a4426'); R(-2, -8, 4, 2, '#c8a050'); R(-3, 0, 6, 4, '#ffd84a'); } // 지갑
    else if (id === 's_mana') { R(-2, -9, 4, 18, '#5ac8ff'); R(-5, -5, 10, 10, '#3a8ad8'); R(-3, -7, 3, 6, '#cdefff'); } // 마나 결정
    else { R(-6, -6, 5, 5, '#e04848'); R(1, -6, 5, 5, '#e04848'); R(-6, -2, 12, 4, '#e04848'); R(-4, 2, 8, 3, '#c02a3a'); R(-2, 5, 4, 2, '#a01a2a'); R(-4, -5, 2, 2, '#ffb0b0'); } // 수호 부적: 하트
    ctx.restore();
  }
  static drawShard(ctx, cx, cy, s) { // 전설 조각 전용 아이콘: 금빛 결정 (배너 배경 없이)
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(cx, cy, s * 0.95, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    const top = cy - s, bot = cy + s, lx = cx - s * 0.62, rx = cx + s * 0.62, my = cy - s * 0.12;
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(rx, my); ctx.lineTo(cx, bot); ctx.lineTo(lx, my); ctx.closePath(); ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bot); ctx.lineTo(lx, my); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(rx, my); ctx.lineTo(cx, my + 1); ctx.closePath(); ctx.fillStyle = 'rgba(255,252,220,0.85)'; ctx.fill();
    ctx.lineWidth = 1; ctx.restore();
  }
  static trialBtn(i) { return { x: VIEW_W / 2 - 214 + i * 108, y: 142, w: 100, h: 26 }; }
  static guildTab(i) { return { x: 60 + i * 134, y: 22, w: 126, h: 16 }; }
  static adminCell(i) { const c = Math.floor(i / 11), w = (VIEW_W - 40) / 2; return { x: 16 + c * (w + 8), y: 28 + (i % 11) * 20, w, h: 17 }; } // 관리자 메뉴: 2열 (11줄씩)
  static adminRow(i) { return { x: 60, y: 32 + i * 24, w: VIEW_W - 120, h: 21 }; }
  static archiveRow(i) { return { x: 40, y: 32 + i * 21, w: VIEW_W - 80, h: 18 }; }
  static guildRow(i) { return { x: 40, y: 46 + i * 28, w: VIEW_W - 80, h: 25 }; }
  static titleCell(i) { return { x: 40 + (i % 2) * 218, y: 46 + Math.floor(i / 2) * 30, w: 212, h: 27 }; }
  static betRect() { return { x: VIEW_W / 2 - 70, y: 150, w: 140, h: 22 }; }
  static gemRect(i) { return { x: VIEW_W / 2 + (i - 1) * 64 - 16, y: 70, w: 32, h: 44 }; }
  static reviveRect(i) { return { x: VIEW_W / 2 - 154 + i * 160, y: 151, w: 148, h: 30 }; }
  static jobRowRect(i) { return { x: 36, y: 36 + i * 27, w: VIEW_W - 72, h: 24 }; }
  static jobLineRowRect(i) { return { x: 12 + (i % 2) * 246, y: 47 + Math.floor(i / 2) * 25, w: 240, h: 23 }; }
  static jobLinePageRect(i, n) { const w = 58, gap = 8, total = n * w + (n - 1) * gap; return { x: (VIEW_W - total) / 2 + i * (w + gap), y: 250, w, h: 13 }; }
  static travelRect(i, n) { const w = 300, h = 30, x = (VIEW_W - w) / 2, y0 = 70; return { x, y: y0 + i * (h + 6), w, h }; }
  static skinHeroArrow(d) { return { x: d ? VIEW_W - 34 : 10, y: 6, w: 24, h: 20 }; } // 스킨창 직업 바꾸기
  static skinRect(i, n = 0) { const tiny = n > 15, small = n > 8, cols = tiny ? 6 : small ? 5 : 4, w = tiny ? 78 : small ? 92 : 112, h = tiny ? 70 : small ? 72 : 92, gap = tiny ? 4 : small ? 5 : 8, x0 = (VIEW_W - (cols * w + (cols - 1) * gap)) / 2; return { x: x0 + (i % cols) * (w + gap), y: (small ? 36 : 40) + Math.floor(i / cols) * (h + gap), w, h, small, tiny }; } // 16개 이상: 6열 (한 직업 최대 18개)
  static heroBranchRect(i, n) { return { x: 18 + (i % 2) * 240, y: 85 + Math.floor(i / 2) * 29, w: 236, h: 26 }; }
  static variantRect(i, n) { const cols = Math.min(3, n), w = 156, h = 58, gap = 8, rows = Math.ceil(n / cols), total = w * cols + gap * (cols - 1); return { x: (VIEW_W - total) / 2 + (i % cols) * (w + gap), y: 66 + Math.floor(i / cols) * (h + gap) + (rows === 1 ? 30 : 0), w, h }; }
  // 컷신: 위아래 검은 띠 + 아래 띠에 한 자씩 나오는 대사
  static cutscene(ctx, game) {
    const c = game.cutscene, ease = Math.min(1, c.t / 0.5), H = Math.round(40 * ease);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, H); ctx.fillRect(0, VIEW_H - H, VIEW_W, H);
    if (ease < 1) return;
    const line = c.lines[Math.min(c.i, c.lines.length - 1)] || '', n = Math.min(line.length, Math.floor(c.lt * 28)), txt = line.slice(0, n);
    hudText(ctx, txt, VIEW_W / 2, VIEW_H - 28, '#f0e8d0', 'center', 11);
    if (n >= line.length && Math.floor(c.t * 2.5) % 2 === 0) hudText(ctx, '▶', VIEW_W - 22, VIEW_H - 16, '#ffe9a0', 'center', 9);
    hudText(ctx, `${c.i + 1} / ${c.lines.length}`, 14, 14, '#666', 'left', 8);
    hudText(ctx, 'Enter·클릭: 다음   Esc: 건너뛰기', VIEW_W - 10, 14, '#666', 'right', 8);
  }
  // 최종 진화 스킬·보구 사용 컷인: 화면을 가로지르는 띠 + 아이콘/캐릭터 + 이름 (약 1초)
  // ── 전설 스킨 첫 획득 컷신: 빛기둥·입자 모임(0~1.0s) → 섬광(1.0~1.3s) → 배너·이름·캐릭터 공개(1.3s~) → 클릭으로 다음
  static legIntroEnd(K) { return K && K.intro ? 1.8 + K.intro.length / 16 + 0.4 : 2.6; } // 대사가 다 나올 때까지
  static legendIntro(ctx, game) {
    const L = game.legendIntro, K = L.K, t = (performance.now() - L.start) / 1000, W = VIEW_W, H = VIEW_H, cx = W / 2, cy = H / 2;
    const col = { skin_leg_abyss: '#5ae0ff', skin_leg_crimson: '#ff4a5a', skin_leg_void: '#b07aff', skin_leg_star: '#ffe08a', skin_leg_admiral: '#f0c050', skin_leg_berserker: '#ff4a4a', skin_bandi: '#9ae8ff', skin_u_unrecorded: '#48eaff', skin_u_first_explorer: '#e0b058', skin_u_primordial: '#f0c8ff' }[K.id] || '#ffd84a', uni = K.rarity === 'unique';
    const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3); let im = null;
    ctx.save();
    ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H);
    if (t < 1.3) { // ① 빛기둥 + 가운데로 모이는 빛 입자
      const k = Math.min(1, t / 1.0), pw = 2 + 26 * k * k;
      const g = ctx.createLinearGradient(cx - pw, 0, cx + pw, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.25 + 0.6 * k; ctx.fillStyle = g; ctx.fillRect(cx - pw, 0, pw * 2, H);
      for (let i = 0; i < 28; i++) { const a = i * 2.39996 + t * (1.5 + (i % 5) * 0.3), r = (1 - k) * (90 + (i * 37) % 160) + 4;
        ctx.globalAlpha = 0.4 + 0.6 * k; ctx.fillStyle = i % 3 ? col : '#fff'; const sz = i % 4 ? 2 : 3; ctx.fillRect(Math.round(cx + Math.cos(a) * r * 1.6) - 1, Math.round(cy + Math.sin(a) * r) - 1, sz, sz); }
      ctx.globalAlpha = Math.min(1, k * 1.4); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 2 + 8 * k, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      if (t > 0.3) hudText(ctx, uni ? '기록되지 않은 힘이 깨어납니다…' : '전설의 기운이 모여듭니다…', cx, H - 40, col, 'center', 9);
    }
    if (t >= 1.0) { // ② 섬광 이후: 배너 공개
      if (!L.flashed) { L.flashed = true; if (typeof SFX !== 'undefined') SFX.play('excal'); game.addShake && game.addShake(0.25, 3); }
      const rv = ease((t - 1.0) / 1.2), zoom = 1.12 - 0.12 * ease((t - 1.0) / 3);
      const bk = GACHA.banners[K.id]; im = bk ? bannerImg(bk) : null;
      ctx.globalAlpha = Math.min(1, (t - 1.0) / 0.3);
      if (im) { const dw = W * zoom, dh = H * zoom; drawBannerCover(ctx, im, cx - dw / 2, cy - dh / 2, dw, dh); }
      else { const g2 = ctx.createRadialGradient(cx + 80, cy, 10, cx + 80, cy, 300); g2.addColorStop(0, col); g2.addColorStop(0.35, '#1c1830'); g2.addColorStop(1, '#05040a'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); }
      // 왼쪽 글자 받침 그림자
      const g3 = ctx.createLinearGradient(0, 0, W * 0.62, 0); g3.addColorStop(0, 'rgba(5,4,10,0.88)'); g3.addColorStop(1, 'rgba(5,4,10,0)'); ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);
      // 캐릭터 (크게, 앞모습 걷기)
      const hero = game.data.heroes.get(K.hero), fr = Math.floor(t * 6) % 3, sx = im ? 74 : W - 100, sy = im ? H - 28 : H - 46; // 배너가 있으면 그림 속 인물과 겹치지 않게 글자 아래(왼쪽)
      ctx.globalAlpha = Math.min(1, (t - 1.1) / 0.4);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(sx, sy, im ? 24 : 34, im ? 5 : 7, 0, 0, TAU); ctx.fill();
      if (K.druid) { const b = typeof druidSprite === 'function' && druidSprite('bandi_down'), m = typeof druidSprite === 'function' && druidSprite('sam_down');
        if (m) drawSprite(ctx, m, sx + 26, sy, { scale: 2.4 }); if (b) drawSprite(ctx, b, sx - 62, sy, { scale: 3 }); }
      else if (hero) { if (uni && typeof UVFX !== 'undefined') { const th = UVFX.themeOfSprite(K.sprite); if (th) { UVFX.preload(th); UVFX.draw(ctx, { sheet: UVFX_THEMES[th].common, row: 0, cell: 32, frames: 6, ms: 100, loop: true, t, x: sx, y: sy - 18, scale: 3, alpha: 0.9 }); UVFX.draw(ctx, { sheet: UVFX_THEMES[th].common, row: 1, cell: 32, frames: 6, ms: 100, loop: true, t, x: sx, y: sy - 70, scale: 3, alpha: 0.85 }); } } // 고유: 테마 오라·반짝임
        const spr = heroSprite(heroWithLook(hero, { sprite: K.sprite }), fr, 0); drawSprite(ctx, spr, sx, sy + Math.round(Math.sin(t * 2) * 1.5), { scale: im ? 3 : 4 }); }
      // 글자: 왼쪽에서 밀려 들어옴
      const tx = 30 - 40 * (1 - rv); ctx.globalAlpha = rv;
      hudText(ctx, uni ? '✦  고유 스킨 획득  ✦' : '★  전설 스킨 획득  ★', tx, 74, uni ? '#9ae8d8' : '#ffd84a', 'left', 10);
      hudText(ctx, K.name, tx, 92, '#fff', 'left', 22);
      ctx.fillStyle = col; ctx.fillRect(tx, 124, 150 * rv, 2);
      const LN = K.line && jobLines(K.hero).find((l) => l.id === K.line), L2 = hero ? `${hero.name}${LN ? ' · ' + LN.name + ' 계열 전용' : uni ? ' · 모든 계열' : ''}` : '';
      hudText(ctx, L2, tx, 132, col, 'left', 10);
      const desc = (K.desc || '').split(' — ').pop().replace(/\s*\(.*\)\s*$/, '');
      hudText(ctx, desc, tx, 152, '#d8d0e8', 'left', 9);
      ctx.globalAlpha = 1;
      // 섬광
      if (t < 1.45) { ctx.globalAlpha = Math.max(0, 1 - Math.abs(t - 1.12) / 0.33); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    // 영화 같은 위아래 검은 띠 + 금색 선
    const bar = 22; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    ctx.fillStyle = 'rgba(255,216,74,0.6)'; ctx.fillRect(0, bar, W, 1); ctx.fillRect(0, H - bar - 1, W, 1);
    if (t >= 1.8 && K.intro) { // 대사: 한 글자씩
      const n = Math.min(K.intro.length, Math.floor((t - 1.8) * 16)), line = '“' + K.intro.slice(0, n) + (n < K.intro.length ? '' : '”');
      const bx = im ? 130 : 18, by = im ? H - bar - 40 : 168, bw = im ? W - 148 : 282, fs = im ? 10 : 9; // 배너 있음: 오른쪽 아래 / 없음: 설명 아래 (캐릭터와 안 겹치게)
      ctx.fillStyle = 'rgba(5,4,10,0.72)'; ctx.fillRect(bx, by, bw, 28); ctx.fillStyle = col; ctx.fillRect(bx, by, 2, 28);
      hudText(ctx, K.druid ? '반디' : K.name, bx + 10, by + 3, col, 'left', 7);
      hudText(ctx, line, bx + 10, by + 13, '#fff', 'left', fs);
    }
    if (t >= HUD.legIntroEnd(K)) { ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 4); hudText(ctx, L.queue.length ? '클릭 — 다음 스킨' : '클릭하여 계속', cx, H - 17, '#ffe9a0', 'center', 8); ctx.globalAlpha = 1; }
    else if (t > 1.3) hudText(ctx, '클릭 — 건너뛰기', W - 10, H - 17, '#777', 'right', 7);
    ctx.restore();
  }
  static cutin(ctx, game) {
    const o = game.cutin, t = (performance.now() - o.start) / 1000, D = o.kind === 'treasure' ? 1.1 : 0.85;
    if (t > D) { game.cutin = null; return; }
    const tr = o.kind === 'treasure', inK = Math.min(1, t / 0.18), outK = Math.min(1, (D - t) / 0.25), k = Math.min(inK, outK), ease = 1 - Math.pow(1 - inK, 3);
    const cy = tr ? 58 : 56, h = tr ? 30 : 22, slide = (1 - ease) * -VIEW_W * 0.6 + t * 18;
    ctx.save();
    if (tr) { ctx.fillStyle = `rgba(0,0,0,${0.15 * k})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    ctx.globalAlpha = k;
    const g = ctx.createLinearGradient(0, 0, VIEW_W, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, o.color); g.addColorStop(0.75, o.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = k * 0.35; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(slide, cy - h / 2 + 4); ctx.lineTo(VIEW_W + slide, cy - h / 2 - 4); ctx.lineTo(VIEW_W + slide, cy + h / 2 - 4); ctx.lineTo(slide, cy + h / 2 + 4); ctx.fill();
    ctx.globalAlpha = k * 0.8; ctx.fillStyle = o.color; ctx.fillRect(VIEW_W * 0.2, cy - h / 2 - 1, VIEW_W * 0.6, 1); ctx.fillRect(VIEW_W * 0.2, cy + h / 2, VIEW_W * 0.6, 1);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffffff'; // 빠르게 지나가는 빛줄기
    for (let i = 0; i < 4; i++) { const yy = cy - h / 2 + 3 + ((i * 37) % (h - 6)), xx = ((t * (500 + i * 90) + i * 140) % (VIEW_W + 120)) - 60; ctx.globalAlpha = k * 0.5; ctx.fillRect(xx, yy, 40 + i * 6, 1); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = k;
    const ix = VIEW_W / 2 - (tr ? 78 : 66) + (1 - ease) * -40;
    if (tr && o.T) drawTreasureIcon(ctx, o.T, ix, cy, 1.25, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined));
    else if (o.hero) { const portrait = o.skin ? heroWithLook(o.hero, { sprite: o.skin }) : o.hero; drawSprite(ctx, heroSprite(portrait, 0), ix, cy + 10, { scale: 1 }); }
    hudText(ctx, o.name, VIEW_W / 2 + 8 - (1 - ease) * 24, cy - (tr ? 10 : 8), '#ffffff', 'center', tr ? 13 : 10);
    if (o.sub) hudText(ctx, o.sub, VIEW_W / 2 + 8, cy + (tr ? 5 : 3), o.color, 'center', 7);
    ctx.restore();
  }
  static treasureToast(ctx, game) {
    const o = game.treasureToast, t = (performance.now() - o.start) / 1000, D = 6;
    if (t > D) { game.treasureToast = null; return; }
    const slide = Math.min(1, t / 0.35), out = Math.max(0, (t - (D - 0.5)) / 0.5), ease = 1 - Math.pow(1 - slide, 3);
    const w = 190, h = 44, x = Math.round(VIEW_W - 8 - w + (1 - ease + out) * (w + 12)), y = VIEW_H - h - 70;
    ctx.globalAlpha = 1 - out;
    ctx.fillStyle = 'rgba(12,10,20,0.92)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd84a'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.strokeStyle = 'rgba(255,216,74,0.35)'; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    const glow = 0.15 + 0.1 * Math.sin(t * 5);
    ctx.fillStyle = `rgba(255,216,74,${glow})`; ctx.beginPath(); ctx.arc(x + 22, y + h / 2, 17, 0, TAU); ctx.fill();
    drawTreasureIcon(ctx, o.T, x + 22, y + h / 2, 2, (typeof uLocalTheme === 'function' ? uLocalTheme() : undefined));
    hudText(ctx, '보구 획득', x + 44, y + 9, '#c8b890', 'left', 8);
    hudText(ctx, o.T.name, x + 44, y + 21, '#ffe9a0', 'left', 12);
    if (t < 0.6) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,180,${0.5 * (1 - t / 0.6)})`; ctx.fillRect(x, y, w, h); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = 1;
  }
  static treasureRect(i, n) { const w = 140, h = 150, gap = 10, cols = Math.min(n, 3), total = w * cols + gap * (cols - 1); return { x: (VIEW_W - total) / 2 + (i % 3) * (w + gap), y: 74 + Math.floor(i / 3) * (h + gap), w, h }; }
  static treasurePageBtn(d) { return { x: d ? VIEW_W - 34 : 10, y: 74 + 55, w: 24, h: 40 }; } // 보구 창 쪽 넘기기 버튼
  static buffRect(i) { const w = 140, h = 80, gap = 12, total = w * 3 + gap * 2; return { x: (VIEW_W - total) / 2 + i * (w + gap), y: 90, w, h }; }
}
