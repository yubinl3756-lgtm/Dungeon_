'use strict';
// ════════════════════════════════════════════
// Esc 메뉴 (일시정지): 왼쪽 세로 메뉴 버튼 + 오른쪽 정보 카드
//  · 마우스(가리키기·클릭) · ↑↓/W·S + Enter/Space · 단축키(U·K·J·+·I·O·G·M·P·L) 모두 가능
//  · 던전 '포기하고 로비로'는 한 번 더 확인
// ════════════════════════════════════════════
const PM = { x: 18, y: 40, w: 168, h: 17, gap: 2 }; // 메뉴 버튼 칸
function pauseMenuItems(game) {
  const lobby = game.mode === 'lobby', sv = game.save || {}, G = game;
  const go = (o) => () => { G.overlay = o; G.input.mouse.down = false; };
  const it = [
    { id: 'resume', label: '이어하기', key: 'Esc', act: () => { G.overlay = null; } },
    { id: 'quests', label: '퀘스트', key: 'U', code: 'KeyU', act: go({ type: 'quests', tab: 0, scroll: 0, back: 'pause' }), hide: typeof drawQuestWindow !== 'function' },
    { id: 'skins', label: '스킨', key: 'K', code: 'KeyK', act: go({ type: 'skins', back: 'pause', msg: null }) },
    { id: 'gacha', label: '스킨 뽑기', key: 'J', code: 'KeyJ', act: go({ type: 'gacha', tab: 0, banner: 0, results: null, msg: null, back: 'pause' }), hide: !lobby },
    { id: 'travel', label: '빠른 이동', key: '+', code: 'Equal', act: go({ type: 'travel', sub: null, msg: null }), hide: !(lobby && sv.babylon && sv.babylon.visited) },
    { id: 'details', label: '상세 정보', key: 'I', code: 'KeyI', act: go({ type: 'details', tab: 0 }) },
    IS_MOBILE ? { id: 'guide', label: '조작 안내', key: '', act: go({ type: 'touch_guide' }) } : { id: 'keys', label: '조작키 설정', key: 'O', code: 'KeyO', act: go({ type: 'keys', wait: null, msg: null }) }, // 모바일: 조작키 설정 대신 터치 조작 안내
    { id: 'gift', label: '선물 코드', key: 'G', code: 'KeyG', act: () => { G.overlay = { type: 'gift', code: '', msg: null }; G.input.typed.length = 0; } },
    { id: 'admin', label: '관리자 메뉴', key: '`', code: 'Backquote', act: go({ type: 'admin', msg: null }), hide: !G.admin },
    { id: 'mute', label: sv.muted ? '소리 켜기' : '소리 끄기', key: 'M', code: 'KeyM', act: () => G.toggleMute(), stay: true },
    { id: 'prologue', label: '프롤로그 다시 보기', key: 'P', code: 'KeyP', act: go({ type: 'story', lines: PROLOGUE_LINES, i: 0, t: 0, done: () => {} }), hide: !lobby },
    lobby ? { id: 'logout', label: '로그아웃', key: 'L', code: 'KeyL', act: () => G.logout(), danger: true }
      : { id: 'giveup', label: '포기하고 로비로', key: 'L', code: 'KeyL', act: () => { G.player.state = 'DEAD'; G.endRun(false); }, danger: true, confirm: '한 번 더 누르면 이번 탐험을 포기해요' }
  ];
  return it.filter((x) => !x.hide);
}
function pauseItemRect(i) { return { x: PM.x, y: PM.y + i * (PM.h + PM.gap), w: PM.w, h: PM.h }; }
function updatePauseMenu(game, input) {
  const o = game.overlay, items = pauseMenuItems(game), m = input.mouse, hit = (r) => m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
  if (o.sel == null) o.sel = 0;
  if (o.msg) { o.msg.t -= 1 / 60; if (o.msg.t <= 0) o.msg = null; }
  const run = (it) => {
    if (it.confirm && o.confirm !== it.id) { o.confirm = it.id; o.msg = { text: it.confirm, t: 2.5 }; SFX.play('ui'); return; }
    o.confirm = null; it.act(); if (!it.stay && game.overlay === o) game.overlay = null;
  };
  if (input.wasPressed('Escape')) { if (o.confirm) { o.confirm = null; o.msg = null; return; } game.overlay = null; return; }
  if (m.x !== o.mx || m.y !== o.my) { items.forEach((it, i) => { if (hit(pauseItemRect(i))) o.sel = i; }); o.mx = m.x; o.my = m.y; } // 마우스를 움직였을 때만 가리킨 칸으로
  if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS') || input.wasPressed('WheelDown')) { o.sel = (o.sel + 1) % items.length; o.confirm = null; }
  if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW') || input.wasPressed('WheelUp')) { o.sel = (o.sel - 1 + items.length) % items.length; o.confirm = null; }
  if (input.wasPressed('Enter') || input.wasPressed('Space')) { run(items[o.sel]); return; }
  if (input.wasPressed('Mouse0')) { const i = items.findIndex((it, k) => hit(pauseItemRect(k))); if (i >= 0) { o.sel = i; run(items[i]); return; } }
  for (const [i, it] of items.entries()) if (it.code && (input.wasPressed(it.code) || (it.code === 'Equal' && input.wasPressed('NumpadAdd')))) { o.sel = i; run(it); return; }
}
function drawPauseMenu(ctx, game) {
  const o = game.overlay, items = pauseMenuItems(game), t = performance.now() / 1000, sv = game.save || {}, p = game.player, lobby = game.mode === 'lobby';
  // 배경: 어둡게 + 왼쪽 메뉴 띠
  ctx.fillStyle = 'rgba(10,6,20,0.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); // (뒤에서 이미 한 번 어둡게 깔림)
  const g = ctx.createLinearGradient(0, 0, 210, 0); g.addColorStop(0, 'rgba(30,22,48,0.95)'); g.addColorStop(1, 'rgba(30,22,48,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 210, VIEW_H);
  ctx.fillStyle = '#ffd84a'; ctx.fillRect(PM.x, 30, 30, 1); ctx.fillStyle = 'rgba(255,216,74,0.35)'; ctx.fillRect(PM.x + 30, 30, 120, 1);
  hudText(ctx, '일시정지', PM.x, 12, '#ffffff', 'left', 14);
  hudText(ctx, lobby ? '로비' : '탐험 중', PM.x + 76, 17, '#a898c0', 'left', 8);
  // 메뉴 버튼
  items.forEach((it, i) => { const r = pauseItemRect(i), on = o.sel === i, cf = o.confirm === it.id;
    if (on) { ctx.fillStyle = it.danger ? 'rgba(200,60,80,0.28)' : 'rgba(255,216,74,0.16)'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.fillStyle = it.danger ? '#ff6a7a' : '#ffd84a'; ctx.fillRect(r.x, r.y, 2, r.h);
      ctx.fillStyle = it.danger ? 'rgba(255,106,122,0.5)' : 'rgba(255,216,74,0.45)'; ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1); }
    const ox = on ? 10 + Math.round(Math.sin(t * 6) * 0.6) : 7;
    hudText(ctx, cf ? '정말 포기할까요?' : it.label, r.x + ox, r.y + 3, it.danger ? (on ? '#ff8a96' : '#c8707a') : on ? '#ffffff' : '#c8c0d8', 'left', 10);
    if (!IS_MOBILE && it.key) { ctx.fillStyle = on ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'; const kw = it.key.length * 6 + 8; ctx.fillRect(r.x + r.w - kw - 4, r.y + 3, kw, 11);
    hudText(ctx, it.key, r.x + r.w - 4 - kw / 2, r.y + 4, on ? '#ffd84a' : '#8878a0', 'center', 8); } }); // 모바일은 키 표시 없음
  hudText(ctx, '↑↓ · 클릭 · Enter 선택', PM.x, VIEW_H - 14, '#6a5a80', 'left', 7);
  if (o.msg) hudText(ctx, o.msg.text, PM.x, VIEW_H - 26, '#ff9aa6', 'left', 8);
  // 오른쪽 정보 카드
  const CX = 210, CW = VIEW_W - CX - 16; let y = 14;
  const card = (h, title) => { ctx.fillStyle = 'rgba(22,16,38,0.96)'; ctx.fillRect(CX, y, CW, h); ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(CX, y, CW, 13); ctx.strokeStyle = 'rgba(160,140,200,0.35)'; ctx.strokeRect(CX + 0.5, y + 0.5, CW - 1, h - 1);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(CX, y, 2, 11); hudText(ctx, title, CX + 8, y + 2, '#ffd84a', 'left', 8); const y0 = y; y += h + 8; return y0; };
  // ① 캐릭터
  { const y0 = card(84, lobby ? '모험가' : '지금 탐험'); const sx = CX + 32, sy = y0 + 58;
    try { const sk = game.skinSprite ? game.skinSprite(p.hero.id, game.playerLineId(p)) : null; // 지금 켜진 스킨 (일반 시트 · 반디 · 전설/고유 포함)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(sx, sy + 13, 14, 4, 0, 0, TAU); ctx.fill();
      drawSpriteFit(ctx, skinPreviewSprite(p.hero, sk, 0), sx, sy + 14, 50, 56, 2); } catch (e) { /* 그림 실패해도 메뉴는 계속 */ }
    const L = p.line, rank = L && L.ranks ? L.ranks[p.rank || 0] : '', tx = CX + 66;
    hudText(ctx, `${p.hero.name}${rank ? ' · ' + rank : ''}`, tx, y0 + 16, '#ffffff', 'left', 10);
    if (lobby) {
      const ttl = typeof GUILD_TITLES !== 'undefined' && sv.title ? GUILD_TITLES.find((x) => x.id === sv.title) : null;
      hudText(ctx, `${ttl ? '「' + ttl.name + '」 ' : ''}${game.profile ? game.profile.name : '게스트 (저장 안 됨)'}`, tx, y0 + 31, '#c8b8e0', 'left', 8);
      hudText(ctx, `보유 ${CUR.name} ${(sv.bank || 0).toLocaleString()}`, tx, y0 + 45, CUR.color || '#9ad8ff', 'left', 8);
      const bs = sv.bestStage || 0; hudText(ctx, `최고 기록  ${bs ? stageLabel(Math.floor((bs - 1) / STAGES_PER_WORLD), (bs - 1) % STAGES_PER_WORLD) : '-'}${sv.bestDeep ? `  ·  심층 ${sv.bestDeep}층` : ''}  ·  클리어 ${sv.clears || 0}`, tx, y0 + 59, '#a898c0', 'left', 8);
    } else {
      const W = game.W || {}; hudText(ctx, `${stageLabel(game.worldIdx, game.levelIdx)}  ${W.name || ''}`, tx, y0 + 31, '#9ad8ff', 'left', 8);
      const hp = Math.max(0, Math.round(p.hp)), mh = Math.round(p.maxHp), bw = CW - (tx - CX) - 12; ctx.fillStyle = '#2a1a22'; ctx.fillRect(tx, y0 + 45, bw, 6); ctx.fillStyle = '#e04a5a'; ctx.fillRect(tx, y0 + 45, Math.round(bw * Math.min(1, hp / (mh || 1))), 6);
      hudText(ctx, `${hp}/${mh}`, tx + bw, y0 + 54, '#e8a0a8', 'right', 7);
      hudText(ctx, `골드 ${game.gold || 0}  ·  처치 ${game.kills || 0}  ·  무기 ${(p.weapons || []).map((w) => w.def.name + (w.lv ? '+' + w.lv : '')).join(' / ')}`, tx, y0 + 63, '#c8c0d8', 'left', 7);
    }
  }
  // ② 조작
  { const y0 = card(58, '조작'), B = game.input.binds, k = (id) => (B[id] || []).filter(Boolean).map(keyLabel).join('/') || '없음';
    if (IS_MOBILE) { // 모바일: 터치 조작 (두 칸씩)
      [['이동', '왼쪽 누르고 끌기'], ['공격', '공격 버튼 · 자동 조준'], ['대시·스킬·보구', '각 버튼'], ['무기 교체', '교체 버튼'], ['상호작용', 'E 버튼'], ['메뉴', '≡ (조작 안내: 메뉴)']].forEach(([what, how], i) => { const cx = CX + 10 + (i % 2) * Math.floor((CW - 16) / 2), cy = y0 + 16 + Math.floor(i / 2) * 13;
        hudText(ctx, what, cx, cy, '#ffd84a', 'left', 8); hudText(ctx, how, cx + 64, cy, '#c8c0d8', 'left', 7, Math.floor((CW - 16) / 2) - 68); }); }
    const rows = IS_MOBILE ? []
      : [[`${k('up')}${k('left')}${k('down')}${k('right')}`, '이동'], [k('attack'), '공격'], [k('dash'), '대시'], [k('skill'), '스킬'], [k('interact'), '상호작용'], [`${k('swap')}/휠`, '무기 교체']];
    if (!IS_MOBILE && ((sv.treasures || []).length || p.treasure)) rows.push([k('treasure'), '보구']);
    rows.forEach(([key, what], i) => { const cx = CX + 10 + (i % 3) * Math.floor((CW - 16) / 3), cy = y0 + 16 + Math.floor(i / 3) * 14;
      hudText(ctx, key, cx, cy, '#ffd84a', 'left', 8); hudText(ctx, what, cx + Math.min(70, key.length * 7 + 6), cy, '#c8c0d8', 'left', 8); }); }
  // ③ 원소 반응
  { const y0 = card(56, '원소 반응');
    const R = [['화상+빙결', '열충격'], ['화상+중독', '독연소'], ['빙결+전격', '초전도'], ['화상+전격', '과부하'], ['중독+전격', '마비'], ['실명+저주', '일식'], ['저주+중독', '역병'], ['화상+저주', '지옥불'], ['실명+전격', '심판']];
    R.forEach(([a, b], i) => { const cx = CX + 10 + (i % 3) * Math.floor((CW - 16) / 3), cy = y0 + 16 + Math.floor(i / 3) * 13;
      hudText(ctx, a, cx, cy, '#a898c0', 'left', 7); hudText(ctx, b, cx + 46, cy, '#9ad8ff', 'left', 7); }); }
}
