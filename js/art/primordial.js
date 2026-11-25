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

// 그리기: 머리(판정 위치 = e.x, e.y)를 기준으로 목 → 몸통 → 날개 → 꼬리를 위쪽(상공)으로 배치
function drawPrimordial(ctx, e) {
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
