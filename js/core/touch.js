'use strict';
// ════════════════════════════════════════════
// 모바일 터치 조작 [사용자 요청: 모바일에서도 플레이]
//  · 플레이 중: 왼쪽 아무 곳 = 이동 조이스틱(누른 자리에 생김) · 오른쪽 버튼 = 공격(자동 조준) · 대시 · 스킬 · 보구 · 무기 교체 · 상호작용 · 메뉴
//  · 창·대사·결과 화면: 화면 터치 = 마우스 클릭 (왼쪽 아래 ✕ = Esc)
//  · 처음 화면을 터치하면 켜짐 (마우스·키보드 환경에는 아무 영향 없음)
// ════════════════════════════════════════════
// 모바일 판별: 휴대폰·태블릿이면 처음부터 터치 화면 (PC는 터치 화면이 있어도 PC 화면) · 주소 뒤 ?mobile=1 / ?mobile=0 으로 강제
const IS_MOBILE = (() => { try { const q = new URLSearchParams(location.search).get('mobile'); if (q === '1') return true; if (q === '0') return false;
  const ua = navigator.userAgent || '', mobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // 아이패드(데스크톱 모드)
  return mobileUA || (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches); } catch (e) { return false; } })();
const TOUCH_BTNS = [ // x, y, r = 화면(512×288) 좌표 · code = 게임 키 (조작키 변경과 무관한 원래 키) — 오른쪽 아래 무기 칸(y 250~)을 가리지 않게 그 위에 배치
  { id: 'attack', label: '공격', x: 452, y: 212, r: 24, code: 'Mouse0', color: '#ff8a5a' },
  { id: 'dash', label: '대시', x: 398, y: 232, r: 14, code: 'Space', color: '#7ad0ff' },
  { id: 'skill', label: '스킬', x: 404, y: 192, r: 14, code: 'KeyF', color: '#ffd84a' },
  { id: 'treasure', label: '보구', x: 436, y: 167, r: 12, code: 'KeyR', color: '#ffb0d8' },
  { id: 'swap', label: '교체', x: 478, y: 170, r: 12, code: 'KeyQ', color: '#c8c0d8' },
  { id: 'interact', label: 'E', x: 352, y: 234, r: 14, code: 'KeyE', color: '#9fe89f' },
  { id: 'menu', label: '≡', x: 498, y: 68, r: 11, code: 'Escape', color: '#ffffff' }
];
const TOUCH_UI_BACK = { x: 16, y: 272, r: 11, code: 'Escape' }; // 창·대사 화면의 ✕ (Esc)
const TOUCH_STICK = { r: 30, dead: 0.3 };

function setupTouch(input) {
  const T = input.touch = { enabled: IS_MOBILE, stick: null, ids: new Map(), vec: { x: 1, y: 0 }, mode: () => 'ui', fsTried: false };
  const toView = (t) => { const r = input.canvas.getBoundingClientRect(); return { x: clamp((t.clientX - r.left) * (VIEW_W / r.width), 0, VIEW_W - 1), y: clamp((t.clientY - r.top) * (VIEW_H / r.height), 0, VIEW_H - 1) }; };
  const hold = (L) => { input.pressed.add(L); if (L === 'Mouse0') input.mouse.down = true; else input.down.add(L); };
  const drop = (L) => { if (L === 'Mouse0') input.mouse.down = false; else input.down.delete(L); };
  const DIRS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
  const setStick = (S) => { // 조이스틱 방향 → 이동 키 (8방향)
    const dx = S.x - S.ox, dy = S.y - S.oy, d = Math.hypot(dx, dy), k = Math.min(1, d / TOUCH_STICK.r);
    S.kx = d ? dx / d * k : 0; S.ky = d ? dy / d * k : 0; if (d > 4) { T.vec.x = dx / d; T.vec.y = dy / d; }
    const want = new Set(); if (S.ky < -TOUCH_STICK.dead) want.add('KeyW'); if (S.ky > TOUCH_STICK.dead) want.add('KeyS'); if (S.kx < -TOUCH_STICK.dead) want.add('KeyA'); if (S.kx > TOUCH_STICK.dead) want.add('KeyD');
    for (const c of DIRS) { if (want.has(c)) input.down.add(c); else input.down.delete(c); }
  };
  T.clearPlay = () => { if (T.stick) { for (const c of DIRS) input.down.delete(c); T.stick = null; } for (const [id, v] of T.ids) if (v.kind === 'btn') drop(v.code); for (const [id, v] of [...T.ids]) if (v.kind !== 'ui') T.ids.delete(id); };
  const hitBtn = (p, B) => Math.hypot(p.x - B.x, p.y - B.y) <= B.r + 6;
  const onLogin = (e) => e.target && e.target.closest && e.target.closest('#login');
  window.addEventListener('touchstart', (e) => {
    if (onLogin(e) || !IS_MOBILE) return; e.preventDefault(); // PC는 터치 조작을 쓰지 않음 (터치 화면 노트북도 마우스처럼)
    const mode = T.mode();
    for (const t of e.changedTouches) { const p = toView(t);
      if (mode === 'play') {
        const B = TOUCH_BTNS.find((b) => hitBtn(p, b));
        if (B) { hold(B.code); T.ids.set(t.identifier, { kind: 'btn', code: B.code }); continue; }
        if (p.x < VIEW_W * 0.55 && !T.stick) { T.stick = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y, kx: 0, ky: 0 }; T.ids.set(t.identifier, { kind: 'stick' }); setStick(T.stick); continue; }
        T.ids.set(t.identifier, { kind: 'none' });
      } else {
        if (hitBtn(p, TOUCH_UI_BACK)) { input.pressed.add('Escape'); T.ids.set(t.identifier, { kind: 'none' }); continue; }
        input.mouse.x = p.x; input.mouse.y = p.y; input.raw.push('Mouse0'); hold('Mouse0'); T.ids.set(t.identifier, { kind: 'ui' });
      }
    }
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (onLogin(e) || !IS_MOBILE) return; e.preventDefault();
    for (const t of e.changedTouches) { const v = T.ids.get(t.identifier); if (!v) continue; const p = toView(t);
      if (v.kind === 'stick' && T.stick && T.stick.id === t.identifier) { T.stick.x = p.x; T.stick.y = p.y;
        const dx = p.x - T.stick.ox, dy = p.y - T.stick.oy, d = Math.hypot(dx, dy); if (d > TOUCH_STICK.r * 1.6) { T.stick.ox = p.x - dx / d * TOUCH_STICK.r * 1.6; T.stick.oy = p.y - dy / d * TOUCH_STICK.r * 1.6; } // 손가락을 따라오는 조이스틱
        setStick(T.stick); }
      else if (v.kind === 'ui') { input.mouse.x = p.x; input.mouse.y = p.y; }
    }
  }, { passive: false });
  const end = (e) => {
    if (onLogin(e) || !IS_MOBILE) return; e.preventDefault();
    for (const t of e.changedTouches) { const v = T.ids.get(t.identifier); T.ids.delete(t.identifier); if (!v) continue;
      if (v.kind === 'stick') { for (const c of DIRS) input.down.delete(c); T.stick = null; }
      else if (v.kind === 'btn') drop(v.code);
      else if (v.kind === 'ui') drop('Mouse0'); }
    if (!T.fsTried) { T.fsTried = true; const el = document.documentElement; // 첫 터치 뒤 전체 화면 + 가로 고정 (지원하는 브라우저만)
      try { const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen(); if (r && r.then) r.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (_) {} }).catch(() => {}); } catch (_) {} }
  };
  window.addEventListener('touchend', end, { passive: false });
  window.addEventListener('touchcancel', end, { passive: false });
}
// 자동 조준: 가까운 적 → 없으면 마지막으로 움직인 방향
function touchAimWorld(game) {
  const p = game.player; if (!p) return null; let best = null, bd = 300;
  for (const e of game.enemies) { if (!e.alive || !e.targetable || e.def.dummy && game.mode !== 'lobby') continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
  if (best) return { x: best.x, y: best.y };
  const v = game.input.touch.vec; return { x: p.x + v.x * 80, y: p.y + v.y * 80 };
}
// 그리기 (화면 맨 위)
function drawTouchControls(ctx, game) {
  const T = game.input.touch; if (!T || !T.enabled) return;
  const mode = T.mode(); if (mode !== 'play') T.clearPlay();
  if (mode === 'play' && !T.guideChecked) { T.guideChecked = true; maybeTouchGuide(game); } // 처음 플레이할 때 조작 안내
  const guide = game.overlay && game.overlay.type === 'touch_guide';
  ctx.save();
  if (mode === 'play' || guide) {
    const S = T.stick, bx = S ? S.ox : 80, by = S ? S.oy : 204; // 조이스틱 (안 누를 땐 흐리게 자리만)
    ctx.globalAlpha = S ? 0.5 : 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(bx, by, TOUCH_STICK.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, TOUCH_STICK.r, 0, TAU); ctx.stroke();
    ctx.globalAlpha = S ? 0.8 : 0.3; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx + (S ? S.kx : 0) * TOUCH_STICK.r, by + (S ? S.ky : 0) * TOUCH_STICK.r, 11, 0, TAU); ctx.fill();
    const held = new Set([...T.ids.values()].filter((v) => v.kind === 'btn').map((v) => v.code));
    for (const B of TOUCH_BTNS) { const on = held.has(B.code); ctx.globalAlpha = on ? 0.75 : 0.42; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = on ? 1 : 0.7; ctx.strokeStyle = B.color; ctx.lineWidth = on ? 2.5 : 1.5; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.9; hudText(ctx, B.label, B.x, B.y - (B.r > 20 ? 6 : 4), B.color, 'center', B.r > 20 ? 11 : 8); }
    const p = game.player; if (p && p.skillCooldown > 0 && p.skillCdMax) { const k = Math.min(1, p.skillCooldown / p.skillCdMax), B = TOUCH_BTNS[2]; ctx.globalAlpha = 0.55; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.arc(B.x, B.y, B.r, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.closePath(); ctx.fill(); } // 스킬 쿨타임
    if (guide) drawTouchGuideLabels(ctx, game);
  } else {
    ctx.globalAlpha = 0.55; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(TOUCH_UI_BACK.x, TOUCH_UI_BACK.y, TOUCH_UI_BACK.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 0.9; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(TOUCH_UI_BACK.x, TOUCH_UI_BACK.y, TOUCH_UI_BACK.r, 0, TAU); ctx.stroke();
    hudText(ctx, '✕', TOUCH_UI_BACK.x, TOUCH_UI_BACK.y - 5, '#fff', 'center', 9);
  }
  ctx.restore(); ctx.lineWidth = 1;
  if (innerHeight > innerWidth * 1.05) { ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = '#0b0b10'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1; // 세로 화면 안내
    hudText(ctx, '📱 ↻  화면을 가로로 돌려 주세요', VIEW_W / 2, VIEW_H / 2 - 10, '#ffd84a', 'center', 14); hudText(ctx, '가로 화면에서 조이스틱과 버튼이 편하게 보입니다', VIEW_W / 2, VIEW_H / 2 + 12, '#aaa', 'center', 8); ctx.restore(); }
}

// ── 조작 안내 (모바일): 실제 버튼 위치에 설명을 붙여 보여 줌 — 처음 플레이할 때 한 번 + 메뉴 '조작 안내'
const TOUCH_GUIDE = [ // [버튼 id 또는 'stick', 설명] — 버튼마다 번호 표시 + 가운데 목록
  ['stick', '이동 — 왼쪽 아무 곳이나 누르고 끌기'], ['attack', '공격 — 누르고 있으면 가까운 적 자동 조준'], ['skill', '스킬'], ['dash', '대시 (잠깐 무적)'],
  ['treasure', '보구'], ['swap', '무기 교체'], ['interact', 'E — 상자·포탈·사람과 상호작용'], ['menu', '메뉴 — 퀘스트·스킨·조작 안내']
];
function drawTouchGuideLabels(ctx, game) {
  TOUCH_GUIDE.forEach(([id], i) => { const B = id === 'stick' ? { x: 80, y: 204, r: TOUCH_STICK.r } : TOUCH_BTNS.find((b) => b.id === id); if (!B) return;
    const bx = Math.round(B.x - B.r * 0.75), by = Math.round(B.y - B.r * 0.75); ctx.globalAlpha = 1; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill(); hudText(ctx, String(i + 1), bx, by - 4, '#1a1206', 'center', 8); });
  const x0 = 140, y0 = 62, w = 196, h = 16 + TOUCH_GUIDE.length * 13; ctx.globalAlpha = 0.9; ctx.fillStyle = '#120e1c'; ctx.fillRect(x0, y0, w, h); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.globalAlpha = 1; TOUCH_GUIDE.forEach(([, text], i) => { const y = y0 + 8 + i * 13; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x0 + 12, y + 4, 5, 0, TAU); ctx.fill(); hudText(ctx, String(i + 1), x0 + 12, y, '#1a1206', 'center', 7); hudText(ctx, text, x0 + 22, y, '#ffe9a0', 'left', 7, w - 28); });
  hudText(ctx, '모바일 조작 안내', VIEW_W / 2, 22, '#ffd84a', 'center', 14);
  hudText(ctx, '창·대사에서는 화면을 터치해 고르고, 왼쪽 아래 ✕로 닫습니다', VIEW_W / 2, 42, '#c8c0d8', 'center', 8);
  hudText(ctx, '화면을 터치하면 시작', VIEW_W / 2, y0 + h + 8, '#ffffff', 'center', 9);
}
function maybeTouchGuide(game) { // 모바일에서 처음 플레이할 때 한 번
  if (!IS_MOBILE || game.overlay || game.cutscene || !game.player) return; let seen = false; try { seen = localStorage.getItem('pd_touch_guide') === '1'; } catch (e) { seen = true; }
  if (seen) return; try { localStorage.setItem('pd_touch_guide', '1'); } catch (e) { /* 저장 안 되는 환경 */ } game.overlay = { type: 'touch_guide' };
}
// ── 모바일에서 PC 안내 문구 바꾸기: 클릭 → 터치 · Esc → ✕ · 휴대폰에 없는 키 단축키는 빼기
const _mobileTextCache = new Map();
const MOBILE_TEXT_FIX = [
  [/F\/우클릭 스킬 · E 상호작용 · Esc 조작법/, '스킬 버튼 · E 상호작용 · ≡ 메뉴'], [/\(Esc → K로 켜기\/끄기\)/, '(≡ 메뉴 → 스킨에서 켜기/끄기)'], [/로비 Esc → J /, '로비 ≡ 메뉴 → '],
  [/↑↓ · 클릭 · Enter 선택/, '터치로 선택'], [/(숫자 키(\(1~0\))?|번호 키|1~\d|1·2·3|\d)\s*\/\s*클릭/g, '터치'], [/클릭\s*\/\s*(숫자|번호) 키/g, '터치'], [/숫자 키\s*\/\s*클릭/g, '터치'],
  [/Enter\s*·\s*클릭/g, '터치'], [/클릭 또는 1 \/ 2 \/ 3/g, '터치해서 고르기'], [/\s*\/\s*Enter\s*—/g, ' —'], [/좌클릭/g, '공격 버튼'], [/우클릭/g, '스킬 버튼'], [/마우스를 올리면/g, '터치하면'],
  [/([A-Z`+]|\d)\s*\/\s*(Enter\s*\/\s*)?Esc/g, 'Esc'], [/\bEsc\b/g, '✕'], [/클릭/g, '터치'], [/\s*\((?:[A-Z]|[A-Z] 키)\)/g, '']
];
function mobileText(str) {
  if (typeof str !== 'string' || !str) return str; let r = _mobileTextCache.get(str); if (r !== undefined) return r;
  r = str; if (r === 'Q') r = ''; else { for (const [re, to] of MOBILE_TEXT_FIX) r = r.replace(re, to);
    if (/ · /.test(r) && /: /.test(r)) { const parts = r.split(/\s+·\s+/), keep = parts.filter((seg) => !/^(?:[A-DF-Z]|\d(?:~\d)?|Enter|Backspace|N|Ctrl\+V|PageUp)\b[^:]*:/.test(seg.trim())).map((seg) => seg.replace(/^E:/, 'E 버튼:'));
      if (keep.length && keep.length < parts.length) r = keep.join('   ·   '); } }
  if (_mobileTextCache.size > 4000) _mobileTextCache.clear(); _mobileTextCache.set(str, r); return r;
}
