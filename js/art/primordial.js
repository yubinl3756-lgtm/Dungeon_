'use strict';
// ════════════════════════════════════════════
// 태고룡 (심층 40 보스) — 아레나 위 상공에 떠 있는 거대한 용. 부위별 도트를 2배로 키워 따로 움직임
//  부위: 날개(좌우 대칭) · 몸통(호박빛 심핵) · 목 마디 · 머리(다문 입 / 벌린 입) · 꼬리 마디
//  색: 흑요석 같은 검은 비늘 + 금빛 맥 + 뼈빛 뿔 + 호박빛 눈·심핵 (원본 디자인)
// ════════════════════════════════════════════
const PRIM_PAL = { s: '#2a2420', d: '#16100d', c: '#4a3c34', o: '#d8c49a', q: '#a08a64', g: '#ffb030', h: '#ffe08a', w: '#ffffff', m: '#3a2420', n: '#22140f', p: '#6a5442', r: '#ff5a1a', e: '#ffd060' };
if (typeof PIX !== 'undefined') Object.assign(PIX, {
  prim_wing: { tint: '#3a2420', w: 100, h: 76, pal: PRIM_PAL, proc: (P) => { // 왼쪽 날개 (뿌리 = 오른쪽 위): 손가락 사이 날개막이 안쪽으로 파인 가장자리
    const R = [97, 16], E = [52, 9], T = [4, 4], F = [[6, 50], [24, 68], [50, 74], [77, 62]], ROOTB = [96, 36];
    const tips = [T, ...F, ROOTB], pull = (A, B, k) => [Math.round((A[0] + B[0]) / 2 + (E[0] - (A[0] + B[0]) / 2) * k), Math.round((A[1] + B[1]) / 2 + (E[1] - (A[1] + B[1]) / 2) * k)];
    for (let i = 0; i < tips.length - 1; i++) { const A = tips[i], B = tips[i + 1], M = pull(A, B, i === tips.length - 2 ? 0.05 : 0.22), O = i === tips.length - 2 ? R : E; // 파인 가장자리
      P.tri(O[0], O[1], A[0], A[1], M[0], M[1], i % 2 ? 'm' : 'n'); P.tri(O[0], O[1], M[0], M[1], B[0], B[1], i % 2 ? 'n' : 'm');
      const I = [Math.round(O[0] + (M[0] - O[0]) * 0.45), Math.round(O[1] + (M[1] - O[1]) * 0.45)]; P.tri(O[0], O[1], Math.round(O[0] + (A[0] - O[0]) * 0.45), Math.round(O[1] + (A[1] - O[1]) * 0.45), I[0], I[1], 'm'); } // 뼈 가까이 밝게
    for (const [fx, fy] of F) { const mx = Math.round(E[0] + (fx - E[0]) * 0.6), my = Math.round(E[1] + (fy - E[1]) * 0.6); P.line(E[0] - 3, E[1] + 4, mx - 5, my, 'g'); P.line(mx - 5, my, mx - 9, my + 6, 'g'); P.px(mx - 9, my + 6, 'h'); } // 금빛 맥 (갈라짐)
    P.line(R[0], R[1], E[0], E[1], 'o'); P.line(R[0], R[1] + 1, E[0], E[1] + 1, 'o'); P.line(R[0], R[1] + 2, E[0], E[1] + 2, 'q'); // 위팔뼈 (3줄 굵기)
    P.line(E[0], E[1], T[0], T[1], 'o'); P.line(E[0], E[1] + 1, T[0], T[1] + 1, 'q');
    for (const [fx, fy] of F) { P.line(E[0], E[1], fx, fy, 'o'); P.line(E[0] + 1, E[1], fx + 1, fy, 'q'); } // 손가락뼈
    P.ell(E[0], E[1], 3, 3, 'o'); P.px(E[0], E[1], 'q'); P.tri(E[0] - 2, E[1] - 2, E[0] + 2, E[1] - 2, E[0] - 1, E[1] - 9, 'o'); P.px(E[0] - 1, E[1] - 7, 'w'); // 관절 · 엄지 발톱
    P.tri(T[0], T[1], T[0] + 4, T[1] + 1, T[0] - 3, T[1] - 4, 'o');
    for (const [fx, fy] of F) { P.tri(fx - 2, fy - 1, fx + 2, fy - 1, fx, fy + 4, 'o'); } // 손가락 끝 발톱
  } },
  prim_body: { tint: '#2a2420', w: 72, h: 66, pal: PRIM_PAL, proc: (P) => { // 몸통: 등가시 · 검은 비늘 · 호박빛 심핵 · 앞발
    for (let i = 0; i < 7; i++) { const x = 12 + i * 8; P.tri(x - 3, 12, x + 3, 12, x, 2 + Math.abs(3 - i), 'o'); P.px(x, 4 + Math.abs(3 - i), 'q'); }
    P.ell(36, 30, 27, 21, 's'); P.ell(36, 36, 22, 14, 'd'); P.ell(36, 26, 22, 12, 'c'); P.ell(36, 28, 20, 13, 's');
    for (let y = 16; y < 42; y += 5) for (let x = 14 + (y % 10 ? 2 : 0); x < 60; x += 6) if (Math.hypot((x - 36) / 24, (y - 30) / 18) < 1) { P.px(x, y, 'c'); P.px(x + 1, y + 1, 'd'); } // 비늘 결
    for (let y = 40; y < 56; y += 3) P.line(30, y, 42, y, 'p'); P.line(29, 40, 29, 55, 'd'); P.line(43, 40, 43, 55, 'd'); // 배 비늘판
    P.ell(36, 32, 8, 9, 'g'); P.ell(36, 32, 5, 6, 'h'); P.ell(36, 32, 2, 3, 'w'); // 심핵
    for (const [x, y] of [[20, 24], [52, 24], [24, 42], [48, 42], [36, 16]]) P.line(36, 32, x, y, 'g'); // 심핵에서 퍼지는 맥
    P.rect(12, 40, 9, 14, 's'); P.rect(51, 40, 9, 14, 's'); P.rect(11, 52, 11, 5, 'c'); P.rect(50, 52, 11, 5, 'c'); // 앞발
    for (const x of [11, 15, 19, 50, 54, 58]) { P.tri(x, 57, x + 3, 57, x + 1, 63, 'o'); }
    P.ell(36, 60, 7, 5, 's'); // 목 뿌리
  } },
  prim_neck: { tint: '#2a2420', w: 20, h: 16, pal: PRIM_PAL, proc: (P) => { P.ell(10, 8, 9, 7, 's'); P.ell(10, 10, 6, 4, 'p'); P.line(6, 10, 14, 10, 'd'); P.tri(8, 2, 12, 2, 10, 0, 'o'); P.px(4, 6, 'c'); P.px(15, 6, 'c'); P.px(10, 12, 'g'); } },
  prim_tail: { tint: '#2a2420', w: 14, h: 12, pal: PRIM_PAL, proc: (P) => { P.ell(7, 6, 6, 5, 's'); P.ell(7, 7, 4, 3, 'c'); P.tri(5, 1, 9, 1, 7, 0, 'o'); P.px(7, 8, 'g'); } },
  prim_tailtip: { tint: '#2a2420', w: 16, h: 16, pal: PRIM_PAL, proc: (P) => { P.tri(2, 8, 14, 2, 10, 14, 'o'); P.tri(4, 8, 12, 4, 9, 12, 'q'); P.px(9, 8, 'h'); } },
  prim_head: { tint: '#2a2420', w: 52, h: 44, pal: PRIM_PAL, proc: (P) => headProc(P, false) },
  prim_head_open: { tint: '#2a2420', w: 52, h: 44, pal: PRIM_PAL, proc: (P) => headProc(P, true) }
});
function headProc(P, open) { // 머리: 앞을 내려다보는 각도 · 큰 뿔 왕관 · 호박빛 눈 · (벌리면) 불타는 목구멍
  P.tri(15, 12, 2, 0, 9, 14, 'o'); P.tri(37, 12, 50, 0, 43, 14, 'o'); P.tri(14, 12, 4, 3, 10, 13, 'q'); P.tri(38, 12, 48, 3, 42, 13, 'q'); // 큰 뿔
  P.tri(19, 9, 13, 2, 21, 10, 'o'); P.tri(33, 9, 39, 2, 31, 10, 'o'); P.tri(24, 6, 28, 6, 26, 0, 'g'); P.px(26, 2, 'h'); // 작은 뿔 · 호박 결정
  P.ell(26, 16, 15, 11, 's'); P.ell(26, 13, 12, 6, 'c'); P.ell(26, 15, 13, 9, 's');
  P.rect(18, 20, 16, 11, 's'); P.ell(26, 31, 9, 6, 's'); P.ell(26, 29, 7, 3, 'c'); // 주둥이
  P.line(12, 14, 22, 17, 'd'); P.line(40, 14, 30, 17, 'd'); // 눈썹뼈
  P.rect(15, 15, 6, 3, 'e'); P.rect(31, 15, 6, 3, 'e'); P.px(17, 16, 'w'); P.px(34, 16, 'w'); P.rect(18, 15, 1, 3, 'd'); P.rect(33, 15, 1, 3, 'd'); // 눈 (세로 동공)
  P.px(23, 32, 'd'); P.px(29, 32, 'd'); // 콧구멍
  for (const [x, y] of [[13, 22], [39, 22], [11, 26], [41, 26]]) P.tri(x - 2, y, x + 2, y, x, y + 5, 'q'); // 볼 가시
  if (open) { P.rect(18, 34, 16, 8, 'r'); P.rect(20, 35, 12, 5, 'h'); P.ell(26, 37, 3, 2, 'w'); for (let x = 19; x <= 32; x += 3) { P.px(x, 34, 'w'); P.px(x + 1, 41, 'w'); } P.rect(18, 41, 16, 3, 's'); } // 벌린 턱
  else { P.line(19, 35, 33, 35, 'd'); P.rect(19, 36, 14, 3, 's'); for (let x = 20; x <= 32; x += 4) P.px(x, 35, 'w'); }
}

// (예비) 도형으로 그린 예전 모습 — 부품 시트를 아직 못 불러왔을 때만 씀
function drawPrimordialProc(ctx, e) {
  const S = 1.5, t = performance.now() / 1000, hx = Math.round(e.x), hy = Math.round(e.y - (e.jumpH || 0));
  const want = e.perched || (e.swooping && e.pd && e.pd.phase !== 'aim') ? 1 : 0; e._fold = (e._fold || 0) + (want - (e._fold || 0)) * 0.12; const fold = e._fold;
  const flash = e.hurtFlash > 0, dead = e.state === 'DEAD', breath = !!e.laser || (e.pat && e.pat.type === 'laser' && (e.state === 'TELEGRAPH' || e.state === 'ATTACK'));
  const img = (name) => { const s = getSprite(name); return { s, im: flash ? s.wn : s.n, imf: flash ? s.wf : s.f }; };
  const lerp = (a, b) => a + (b - a) * fold;
  ctx.save(); ctx.imageSmoothingEnabled = false; if (dead) ctx.globalAlpha = Math.max(0, 1 - e.stateTime * 0.8);
  // 바닥 그림자 (상공에 떠 있을 때 크고 옅게, 내려앉으면 진하게)
  ctx.fillStyle = 'rgba(0,0,0,' + (0.18 + 0.2 * fold) + ')'; ctx.beginPath(); ctx.ellipse(hx, hy + 20 + lerp(36, 4), lerp(96, 56), lerp(16, 11), 0, 0, TAU); ctx.fill();
  const bx = hx + Math.sin(t * 0.9) * 4 * (1 - fold), by = hy - lerp(112, 54), flap = 0.5 + 0.5 * Math.sin(t * (e.state === 'ATTACK' ? 3.4 : 2.3));
  // 날개 (뿌리를 축으로 위아래로 펄럭임 · 내려앉으면 접힘)
  { const W = img('prim_wing'), sy = lerp(0.55 + 0.5 * flap, 0.42), sx = lerp(1, 0.62), WS = 1.9, ww = 100 * WS * sx, wh = 76 * WS * sy, rootY = by - 20 * S;
    ctx.drawImage(W.im, Math.round(bx - 16 * S - ww), Math.round(rootY - 16 * WS * sy), Math.round(ww), Math.round(wh));
    ctx.drawImage(W.imf, Math.round(bx + 16 * S), Math.round(rootY - 16 * WS * sy), Math.round(ww), Math.round(wh)); }
  // 꼬리 (몸통 오른쪽 아래에서 나와 크게 감아 올림)
  { const T = img('prim_tail'); let px = bx + 18 * S, py = by + 22 * S;
    for (let i = 0; i < 12; i++) { const a = 0.15 - i * 0.3 + Math.sin(t * 0.8 + i * 0.45) * 0.18, sc = S * (1.15 - i * 0.065); px += Math.cos(a) * 7 * sc; py += Math.sin(a) * 7 * sc;
      ctx.drawImage(T.im, Math.round(px - 7 * sc), Math.round(py - 6 * sc), Math.round(14 * sc), Math.round(12 * sc)); }
    const TT = img('prim_tailtip'); ctx.drawImage(TT.im, Math.round(px - 8 * S), Math.round(py - 8 * S), 16 * S, 16 * S); }
  // 몸통
  { const B = img('prim_body'); ctx.drawImage(B.im, Math.round(bx - 36 * S), Math.round(by - 33 * S), 72 * S, 66 * S); }
  // 심핵 빛 (마지막 페이즈엔 더 강하게)
  { const g = (e.phase || 1) >= 3 ? 1 : 0.55; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.25 + 0.15 * Math.sin(t * 3)) * g * (dead ? 0 : 1); const cg = ctx.createRadialGradient(bx, by - 1 * S, 0, bx, by - 1 * S, 26 * S);
    cg.addColorStop(0, '#ffd060'); cg.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = cg; ctx.fillRect(bx - 26 * S, by - 27 * S, 52 * S, 52 * S); ctx.restore(); }
  // 목 마디 (몸통 아래 → 머리)
  { const N = img('prim_neck'), x0 = bx, y0 = by + 28 * S, x1 = hx, y1 = hy - 14 * S, cxm = (x0 + x1) / 2 + Math.sin(t * 1.1) * 18 * (1 - fold), cym = (y0 + y1) / 2;
    for (let i = 6; i >= 1; i--) { const u = i / 7, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cxm + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cym + u * u * y1, sc = S * (1.05 - u * 0.25);
      ctx.drawImage(N.im, Math.round(x - 10 * sc), Math.round(y - 8 * sc), Math.round(20 * sc), Math.round(16 * sc)); } }
  // 머리
  { const H = img(breath ? 'prim_head_open' : 'prim_head'); ctx.drawImage(H.im, hx - 26 * S, hy - 26 * S, 52 * S, 44 * S);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = dead ? 0 : 0.5 + 0.3 * Math.sin(t * 5); ctx.fillStyle = '#ffb030'; // 눈빛
    for (const ex of [-8, 8]) { ctx.beginPath(); ctx.arc(hx + ex * S, hy - 9 * S, 4 * S, 0, TAU); ctx.fill(); }
    if (breath) { ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 20); const mg = ctx.createRadialGradient(hx, hy + 11 * S, 0, hx, hy + 11 * S, 16 * S); mg.addColorStop(0, '#fff4c0'); mg.addColorStop(1, 'rgba(255,90,26,0)'); ctx.fillStyle = mg; ctx.fillRect(hx - 16 * S, hy - 5 * S, 32 * S, 32 * S); } // 숨결을 모으는 목구멍
    ctx.restore(); }
  // 내려앉아 약점이 드러난 동안: 심핵·머리 위로 금빛 표시
  if (e.perched && !dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 8); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy - 4, 24 + Math.sin(t * 6) * 3, 0, TAU); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; }
  ctx.restore();
}
// 급강하 예고: 내리꽂힐 길과 착지 원 (점점 진해짐)
function drawPrimordialWarn(ctx, e) {
  const W = e.swoopWarn; if (!W) return; const a = Math.atan2(W.y1 - W.y0, W.x1 - W.x0), len = Math.hypot(W.x1 - W.x0, W.y1 - W.y0);
  ctx.save(); ctx.translate(W.x0, W.y0); ctx.rotate(a); ctx.globalAlpha = 0.12 + 0.28 * W.k; ctx.fillStyle = '#ff6a2a'; ctx.fillRect(0, -26, len, 52);
  ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffd0a0'; ctx.fillRect(0, -1, len * W.k, 2); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.25 + 0.4 * W.k; ctx.strokeStyle = W.color || '#ffc040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W.x1, W.y1, 56 * W.k + 10, (56 * W.k + 10) * 0.6, 0, 0, TAU); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1;
}
// 작은 대체 그림 (32×32 머리): 전용 그림을 쓰지 않는 곳(도감·멀티 등)에서 getSprite('boss_primordial')를 불러도 오류가 나지 않게
PIX.boss_primordial = { tint: '#3a3028', w: 32, h: 32, pal: { y: '#ffc040', e: '#fff4c0', h: '#e8dcc0', d: '#1a1410' }, proc: (P) => {
  P.ell(16, 18, 11, 9, 'a'); P.ell(16, 24, 8, 5, 'b'); P.tri(7, 12, 2, 0, 11, 9, 'h'); P.tri(25, 12, 30, 0, 21, 9, 'h');
  P.ell(11, 16, 2, 2, 'y'); P.ell(21, 16, 2, 2, 'y'); P.px(11, 16, 'e'); P.px(21, 16, 'e'); P.rect(10, 26, 12, 2, 'd');
  for (const x of [11, 14, 18, 21]) P.tri(x, 26, x + 1, 30, x + 2, 26, 'h'); P.ell(16, 10, 3, 2, 'c'); P.px(16, 20, 'y');
} };

// ════════════════════════════════════════════
// 태고룡 외형 리메이크 [사용자 제공 부품 시트: assets/primordial_parts.png]
//  윗줄 = 1·2페이즈 (봉인된 태고룡) · 아랫줄 = 3페이즈 (태초의 재앙, 각성)
//  2페이즈: 날개 손상(찢긴 구멍) · 핵 과충전: 레이저 충전·핵 폭발 동안 심핵이 부풀어 오름
// ════════════════════════════════════════════
const PRIM_SHEET = { src: 'assets/primordial_parts.png',
  p1: { wingL: [19, 16, 87, 84], wingR: [112, 16, 85, 83], body: [210, 7, 78, 86], head: [296, 29, 58, 49], headOpen: [356, 30, 48, 48], tail: [411, 26, 23, 67] },
  p3: { wingL: [20, 116, 88, 97], wingR: [113, 116, 86, 97], body: [204, 114, 88, 92], head: [293, 128, 50, 72], headOpen: [355, 127, 47, 73], tail: [408, 121, 30, 85], spark: [445, 146, 29, 31], spark2: [478, 156, 11, 10] } };
let _primImg = null, _primReady = false; const _primCache = {};
function primLoad() { if (_primImg) return; _primImg = new Image(); _primImg.onload = () => { _primReady = true; }; _primImg.src = PRIM_SHEET.src; }
function primPart(set, name, mode = 'n') { // 부품 캔버스 (n: 그대로 · w: 흰 실루엣(피격) · dmg: 찢긴 날개)
  const key = set + name + mode; if (_primCache[key]) return _primCache[key];
  const [sx, sy, w, h] = PRIM_SHEET[set][name], c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(_primImg, sx, sy, w, h, 0, 0, w, h);
  if (mode === 'w') { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); }
  if (mode === 'dmg') { // 날개막에 찢긴 구멍 몇 개 + 그 가장자리 금빛 (날개 뼈 쪽은 피함)
    const holes = name === 'wingL' ? [[0.22, 0.62, 7], [0.4, 0.78, 6], [0.12, 0.42, 5], [0.55, 0.66, 4]] : [[0.78, 0.62, 7], [0.6, 0.78, 6], [0.88, 0.42, 5], [0.45, 0.66, 4]];
    for (const [fx, fy, r] of holes) { const x = fx * w, y = fy * h; g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(x - r, y - r * 0.4); g.lineTo(x + r * 0.3, y - r); g.lineTo(x + r, y + r * 0.2); g.lineTo(x - r * 0.2, y + r); g.closePath(); g.fill();
      g.globalCompositeOperation = 'source-atop'; g.strokeStyle = '#ffb030'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - r - 1, y - r * 0.4); g.lineTo(x + r * 0.3, y - r - 1); g.lineTo(x + r + 1, y + r * 0.2); g.stroke(); }
    g.globalCompositeOperation = 'source-over'; }
  return (_primCache[key] = c);
}
function drawPrimordial(ctx, e) {
  primLoad(); if (!_primReady) { drawPrimordialProc(ctx, e); return; }
  const t = performance.now() / 1000, ph = e.phase || 1, P3 = ph >= 3, set = P3 ? 'p3' : 'p1', K = 1.28, hx = Math.round(e.x), hy = Math.round(e.y - (e.jumpH || 0));
  const flash = e.hurtFlash > 0, dead = e.state === 'DEAD', pt = e.pat && e.pat.type, act = e.state === 'TELEGRAPH' || e.state === 'ATTACK';
  const charging = pt === 'laser' && e.state === 'TELEGRAPH', breath = !!e.laser || (pt === 'laser' && e.state === 'ATTACK') || (e.roaring && !dead);
  const core = Math.min(1.6, (e.coreCharge || 0) * 1.2 + (charging ? 0.5 : 0) + (P3 ? 0.35 : 0)); // 핵 과충전
  const part = (n, mode) => primPart(set, n, flash ? 'w' : mode || 'n'), PS = PRIM_SHEET[set];
  const bx = hx + Math.sin(t * 0.9) * 3, by = hy - 66, gust = e.pd && pt === 'wingGust' && e.pd.phase === 'blow';
  const flap = 0.5 + 0.5 * Math.sin(t * (gust ? 9 : act ? 3.4 : 2.2));
  ctx.save(); ctx.imageSmoothingEnabled = false; if (dead) ctx.globalAlpha = Math.max(0, 1 - e.stateTime * 0.8);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(hx, hy + 44, 120, 18, 0, 0, TAU); ctx.fill(); // 아레나 바닥 그림자
  { const T = part('tail'), [, , tw, th] = PS.tail; ctx.save(); ctx.translate(bx, by - PS.body[3] * K * 0.38); ctx.rotate(Math.sin(t * 0.7) * 0.12); // 꼬리: 몸통 뒤에서 위로 뻗어 흔들림
    ctx.drawImage(T, Math.round(-tw * K / 2), Math.round(-th * K + 6), Math.round(tw * K), Math.round(th * K)); ctx.restore(); }
  for (const side of [-1, 1]) { // 날개: 어깨를 축으로 위아래로 펄럭임 (2페이즈는 찢긴 날개)
    const n = side < 0 ? 'wingL' : 'wingR', W = part(n, ph === 2 ? 'dmg' : 'n'), [, , ww, wh] = PS[n], sy = 0.76 + 0.24 * flap + (gust ? 0.08 : 0);
    ctx.save(); ctx.translate(bx + side * 16 * K, by - 22 * K); ctx.scale(1, sy); ctx.drawImage(W, side < 0 ? -ww * K : 0, -wh * K * 0.28, ww * K, wh * K); ctx.restore(); }
  { const B = part('body'), [, , bw, bh] = PS.body; ctx.drawImage(B, Math.round(bx - bw * K / 2), Math.round(by - bh * K / 2), Math.round(bw * K), Math.round(bh * K)); }
  if (!dead) { const cy = by - PS.body[3] * K * 0.04, R = 14 + core * 22 + Math.sin(t * (4 + core * 8)) * 3; // 심핵 빛 (과충전일수록 크고 빠르게 고동)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.25 * Math.min(1, core); const cg = ctx.createRadialGradient(bx, cy, 0, bx, cy, R * 2);
    cg.addColorStop(0, '#fff4c0'); cg.addColorStop(0.35, '#ffc040'); cg.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = cg; ctx.fillRect(bx - R * 2, cy - R * 2, R * 4, R * 4);
    if (core > 0.8) { ctx.globalAlpha = (core - 0.8) * 0.6; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * 2; ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6); ctx.lineTo(bx + Math.cos(a) * R * 1.8, cy + Math.sin(a) * R * 1.8); ctx.stroke(); } }
    ctx.restore(); ctx.lineWidth = 1; }
  { const hn = breath ? 'headOpen' : 'head', H = part(hn), [, , w, h] = PS[hn], ay = P3 ? 0.36 : 0.45; ctx.drawImage(H, Math.round(hx - w * K / 2), Math.round(hy - h * K * ay), Math.round(w * K), Math.round(h * K));
    if (!dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 + 0.3 * Math.sin(t * 5); ctx.fillStyle = P3 ? '#ffe060' : '#ffb030';
      for (const ex of [-9, 9]) { ctx.beginPath(); ctx.arc(hx + ex, hy - 6, 3.5, 0, TAU); ctx.fill(); } // 눈빛
      if (charging) { const k = Math.min(1, e.stateTime / 1.1); ctx.globalAlpha = 0.8; ctx.strokeStyle = '#ffe9a0'; // 레이저 충전: 빛이 입으로 빨려 들어감
        for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + t * 3, r0 = 60 - ((t * 90 + i * 13) % 50); ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * r0, hy + 14 + Math.sin(a) * r0); ctx.lineTo(hx + Math.cos(a) * (r0 - 8), hy + 14 + Math.sin(a) * (r0 - 8)); ctx.stroke(); }
        const mg = ctx.createRadialGradient(hx, hy + 14, 0, hx, hy + 14, 8 + k * 14); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, 'rgba(255,170,40,0)'); ctx.fillStyle = mg; ctx.fillRect(hx - 24, hy - 10, 48, 48); }
      if (breath) { ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 20); const mg = ctx.createRadialGradient(hx, hy + 16, 0, hx, hy + 16, 20); mg.addColorStop(0, '#fff4c0'); mg.addColorStop(1, 'rgba(255,90,26,0)'); ctx.fillStyle = mg; ctx.fillRect(hx - 20, hy - 4, 40, 40); }
      ctx.restore(); } }
  if (P3 && !dead) { const S1 = primPart('p3', 'spark'), S2 = primPart('p3', 'spark2'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; // 각성: 날개 끝·몸 주위로 피어오르는 불티
    for (let i = 0; i < 9; i++) { const f = (t * 0.45 + i / 9) % 1, side = i % 2 ? 1 : -1, x = bx + side * (30 + (i * 37) % 110), y = by + 20 - f * 120; ctx.globalAlpha = (1 - f) * 0.8; const S = i % 3 ? S2 : S1, sc = i % 3 ? 1 : 0.6; ctx.drawImage(S, Math.round(x - S.width * sc / 2), Math.round(y - S.height * sc / 2), Math.round(S.width * sc), Math.round(S.height * sc)); }
    ctx.restore(); }
  ctx.restore();
}

// ── 신규 패턴 예고 (renderTelegraph에서): 날개 충격파 · 용의 포효 · 태초의 핵
function drawPrimordialWarn2(ctx, e) {
  const W = e.primWarn, r = e.room; if (!W || !r) return; const t = performance.now() / 1000, x0 = r.x0 * TILE, y0 = r.y0 * TILE, w = r.w * TILE, h = r.h * TILE;
  ctx.save();
  if (W.type === 'gust' || W.type === 'gustOn') { // 아래로 부는 바람: 흐르는 화살표 줄
    ctx.globalAlpha = W.type === 'gust' ? 0.15 + 0.35 * W.k : 0.35; ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) { const x = x0 + 20 + (i * (w - 40)) / 15, yy = y0 + 40 + ((t * (W.type === 'gustOn' ? 160 : 50) + i * 37) % (h - 50));
      ctx.beginPath(); ctx.moveTo(x, yy - 10); ctx.lineTo(x, yy + 6); ctx.lineTo(x - 3, yy + 2); ctx.moveTo(x, yy + 6); ctx.lineTo(x + 3, yy + 2); ctx.stroke(); }
    if (W.type === 'gust') hudText(ctx, '바람이 몰아친다 — 탄막의 빈틈으로', x0 + w / 2, y0 + h - 30, '#ffe9a0', 'center', 8);
  } else if (W.type === 'roar') { // 포효: 머리에서 퍼지는 음파 + 엄폐 안내 + 기둥 뒤 안전한 그림자
    const hx = e.x, hy = e.y + 10, M = (typeof game !== 'undefined') && game.map; ctx.globalAlpha = 0.22 + 0.3 * W.k; ctx.fillStyle = '#7affa0';
    if (M) for (let ty = r.y0; ty < r.y0 + r.h; ty++) for (let tx = r.x0; tx < r.x0 + r.w; tx++) { if (M.get(tx, ty) !== T_COVER) continue;
      const cs = [[tx, ty], [tx + 1, ty], [tx + 1, ty + 1], [tx, ty + 1]].map(([a, b2]) => [a * TILE, b2 * TILE]), far = cs.map(([px, py]) => { const dx = px - hx, dy = py - hy, L = Math.hypot(dx, dy) || 1; return [px + dx / L * 220, py + dy / L * 220]; });
      ctx.beginPath(); ctx.moveTo(cs[0][0], cs[0][1]); for (const q of [...cs, ...far.reverse()]) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); }
    for (let i = 0; i < 4; i++) { const k = ((t * 1.6 + i / 4) % 1); ctx.globalAlpha = (1 - k) * (0.25 + 0.5 * W.k); ctx.strokeStyle = '#ff9a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y + 10, 30 + k * 260, (30 + k * 260) * 0.55, 0, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 0.9; hudText(ctx, '포효가 온다 — 기둥 뒤로 숨어라!', x0 + w / 2, y0 + h - 30, '#ffb07a', 'center', 9);
  } else if (W.type === 'core') { // 핵 폭발: 안전지대(용의 바로 아래)만 빼고 아레나 전체가 붉게
    ctx.globalAlpha = 0.08 + 0.3 * W.k * (0.7 + 0.3 * Math.sin(t * (6 + W.k * 14))); ctx.fillStyle = '#ff5a2a'; ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.ellipse(W.x, W.y, W.r, W.r * 0.6, 0, 0, TAU, true); ctx.fill('evenodd');
    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#9fe89f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W.x, W.y, W.r, W.r * 0.6, 0, 0, TAU); ctx.stroke();
    hudText(ctx, `태초의 핵 과충전 ${Math.floor(W.k * 100)}% — 용의 바로 아래로!`, x0 + w / 2, y0 + h - 30, '#ffd060', 'center', 9);
  }
  ctx.restore(); ctx.lineWidth = 1;
}
// ── 페이즈별 아레나 변화: 1 황금 문양 · 2 바닥 균열(금빛) · 3 균열이 붉게 타오르고 전장 색이 핵의 빛으로 물듦
function drawPrimordialArena(ctx, game) {
  const B = game.enemies && game.enemies.find((e) => e.def.colossal && e.state !== 'DEAD'); if (!B || !B.room || !B.room.arena) return;
  const r = B.room, ph = B.phase || 1, t = game.time, x0 = r.x0 * TILE, y0 = r.y0 * TILE, w = r.w * TILE, h = r.h * TILE, cx = x0 + w / 2, cy = y0 + h * 0.6;
  if (!r.cracks) { let sd = r.x0 * 31 + r.y0 * 17; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }; r.cracks = [];
    for (let i = 0; i < 14; i++) { const a = rnd() * TAU, pts = [[cx + Math.cos(a) * 30, cy + Math.sin(a) * 18]]; let ang = a, L = 40 + rnd() * 120;
      for (let k = 0; k < 6; k++) { ang += (rnd() - 0.5) * 0.9; const [px, py] = pts[pts.length - 1]; pts.push([px + Math.cos(ang) * L / 6, py + Math.sin(ang) * L / 9]); } r.cracks.push(pts); } }
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.05 * Math.sin(t * 1.5); ctx.strokeStyle = '#ffc040'; ctx.lineWidth = 1; // 황금 문양 (원 두 겹 + 방사선)
  ctx.beginPath(); ctx.ellipse(cx, cy, 120, 52, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, 80, 34, 0, 0, TAU); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * 0.05; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 34); ctx.lineTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 52); ctx.stroke(); }
  if (ph >= 2) { const n = ph >= 3 ? r.cracks.length : 8, col = ph >= 3 ? '#ff6a2a' : '#ffb030'; // 바닥 균열
    for (let i = 0; i < n; i++) { const C = r.cracks[i]; ctx.globalAlpha = (ph >= 3 ? 0.55 : 0.4) + 0.2 * Math.sin(t * 3 + i); ctx.strokeStyle = col; ctx.lineWidth = ph >= 3 ? 2 : 1.5;
      ctx.beginPath(); ctx.moveTo(C[0][0], C[0][1]); for (const [px, py] of C) ctx.lineTo(px, py); ctx.stroke(); } }
  if (ph >= 3) { ctx.globalAlpha = 0.07 + 0.04 * Math.sin(t * 2); ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x0, y0, w, h); // 전장이 핵의 빛으로 물듦 + 불티
    ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffd060'; for (let i = 0; i < 18; i++) { const f = (t * 0.3 + i / 18) % 1; ctx.fillRect(Math.round(x0 + ((i * 97) % w)), Math.round(y0 + h - f * h), 1, 2); } }
  ctx.restore(); ctx.lineWidth = 1;
}
// ── 유성 낙하 전용 연출: 경고 원 위로 하늘에서 불붙은 바위가 떨어짐 (태고룡전에서만)
function drawPrimordialFX(ctx, game) {
  const B = game.enemies && game.enemies.find((e) => e.def.colossal && e.alive); if (!B) return;
  for (const hz of game.hazards) { if (!hz.alive || !(hz.delay > 0) || hz.t >= hz.delay) continue; const k = hz.t / hz.delay, sx = hz.x + 50 * (1 - k), sy = hz.y - 170 * (1 - k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + 0.6 * k; ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + 26, sy - 90); ctx.lineTo(sx, sy); ctx.stroke();
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9); g.addColorStop(0, '#fff4c0'); g.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 9, sy - 9, 18, 18); ctx.restore();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(Math.round(sx - 3), Math.round(sy - 3), 6, 6); ctx.fillStyle = '#ffb030'; ctx.fillRect(Math.round(sx - 1), Math.round(sy - 2), 2, 2); }
  ctx.lineWidth = 1;
}
// ── 매 프레임: 유성 착탄 충격 · 페이즈가 바뀔 때 변신 연출
function primordialTick(game, dt) {
  const B = game.enemies && game.enemies.find((e) => e.def.colossal && e.alive); if (!B) return;
  for (const hz of game.hazards) if (hz.alive && hz.delay > 0 && hz.t >= hz.delay && !hz._primHit) { hz._primHit = true; game.addShake(0.15, 3); game.effects.burst(hz.x, hz.y, '#ff9a3a', 12); game.effects.ring(hz.x, hz.y, (hz.r || 30) + 6, '#ffd060'); }
  const ph = B.phase || 1; if (B._lastPh == null) B._lastPh = ph;
  if (ph !== B._lastPh) { B._lastPh = ph; game.addShake(0.6, 8); game.effects.rays(B.x, B.y - 74, ph >= 3 ? '#ffe060' : '#ffb030', 18, 160, 1.2);
    game.announceBossSkill(B, ph >= 3 ? '각성 — 태초의 재앙' : '찢긴 날개 — 그래도 멈추지 않는다'); if (ph >= 3) { game.screenFlash = 0.3; game.flashColor = '255,220,140'; } }
}
