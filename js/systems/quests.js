'use strict';
// ════════════════════════════════════════════
// 퀘스트 창 (U · Esc 메뉴 → U): 메인 퀘스트 · 서브 퀘스트 · 수락한 임무를 한눈에
//  · 진행 상황은 저장된 기록에서 바로 읽음 (따로 저장하지 않음)
//  · 서브 퀘스트는 시작된 것만 보이고, 아직 못 찾은 이야기는 개수만 '???'로
// ════════════════════════════════════════════
const QUEST_TABS = ['메인 퀘스트', '서브 퀘스트', '수락한 임무'];
// 멀린의 시련 단계 (save.merlin.quest) → 지금 할 일
const QUEST_MERLIN_STEPS = {
  2: '멀린에게 말 걸기 — 두 번째 시련', 3: '롱고미니아드의 시련에 도전 (멀린에게)',
  4: '멀린에게 말 걸기 — 로드 투 카멜롯', 5: '카멜롯 1층: 태양의 기사 가웨인',
  6: '멀린에게 말 걸기 — 카멜롯 2층', 7: '카멜롯 2층: 반전의 기사 트리스탄',
  8: '멀린에게 말 걸기 — 카멜롯 3층', 9: '카멜롯 3층: 반역의 기사 모드레드',
  10: '멀린에게 말 걸기 — 카멜롯 4층', 11: '카멜롯 4층: 부정의 기사 가레스',
  12: '멀린에게 말 걸기 — 카멜롯 5층', 13: '카멜롯 5층: 철벽의 기사 갤러해드',
  14: '멀린에게 말 걸기 — 카멜롯 6층', 15: '카멜롯 6층: 호수의 기사 랜슬롯',
  16: '멀린에게 말 걸기 — 카멜롯 7층', 17: '카멜롯 7층: 철완의 기사 아그라베인',
  18: '멀린에게 말 걸기 — 카멜롯 8층', 19: '카멜롯 8층: 충절의 기사 베디비어',
  20: '멀린에게 말 걸기 — 왕좌로', 21: '카멜롯 왕좌: 아서 왕'
};

// 지금 저장 기록으로 퀘스트 목록 만들기 → { main, sub, tasks, hidden }
//  항목: { title, desc, prog, state: 'done' | 'now' | 'next' | 'ready' }
function questBook(game) {
  const sv = game.save || {}, seen = (id) => (sv.scenesSeen || []).includes(id);
  const fields = (typeof DATA_WORLDS !== 'undefined' ? DATA_WORLDS.length : 10), per = typeof STAGES_PER_WORLD !== 'undefined' ? STAGES_PER_WORLD : 4;
  const bestField = Math.min(fields, Math.ceil((sv.bestStage || 0) / per)), deep = sv.bestDeep || 0;
  const maxDeep = typeof DEEP_WORLDS !== 'undefined' ? DEEP_WORLDS.length : 39;
  const archivist = seen('archivist_clear') || !!(sv.uniqueRecords && Object.keys(sv.uniqueRecords).length) || deep > 30;
  // ── 메인: 이야기 줄기 (끝낸 것 ✓ · 지금 할 것 · 그 다음 하나만 '???')
  const chain = [
    { title: '끝없는 던전', desc: `던전 ${fields}필드를 지나 가장 깊은 곳까지`, prog: `${bestField}/${fields} 필드`, done: !!sv.sanctumReached || bestField >= fields },
    { title: '기원의 성역', desc: '무명의 문지기를 쓰러뜨리고 성역 깊은 곳으로', prog: '', done: !!sv.sanctumReached },
    { title: '지도에 없는 곳', desc: '성역보다 더 아래, 심층으로 내려가기', prog: '', done: deep >= 1 || seen('deep_arrival') },
    { title: '기록의 근원', desc: '심층 30층 — 무명의 기록관을 쓰러뜨리기', prog: `${Math.min(deep, 30)}/30 층`, done: archivist },
    { title: '태고룡의 둥지', desc: '심층 40층 — 모든 용의 시작, 태고룡을 쓰러뜨리기', prog: `${Math.min(deep, 40)}/40 층`, done: seen('primordial_fall') },
    { title: '사람이 사는 곳', desc: '태고룡의 둥지 너머 — 심층 50 개척자의 마을까지', prog: `${Math.min(deep, 50)}/50 층`, done: deep >= 50 },
    { title: '오염된 층', desc: `던전 곳곳의 글리치를 ${typeof GLITCH_GATE !== 'undefined' ? GLITCH_GATE.need : 20}개 이상 조사하고 심층 60의 무형의 오류를 쓰러뜨리기`, prog: `글리치 ${Math.min(sv.glitches || 0, typeof GLITCH_GATE !== 'undefined' ? GLITCH_GATE.need : 20)}/${typeof GLITCH_GATE !== 'undefined' ? GLITCH_GATE.need : 20}`, done: !!sv.unrecordedMet },
    { title: '기록되지 않는 자', desc: '무명객과 천율 (이야기는 준비 중)', prog: '', done: false }
  ];
  const main = []; let cur = false;
  for (const q of chain) {
    if (q.done) main.push({ title: q.title, desc: q.desc, prog: '완료', state: 'done' });
    else if (!cur) { main.push({ title: q.title, desc: q.desc, prog: q.prog, state: 'now' }); cur = true; }
    else { main.push({ title: '???', desc: '앞의 이야기를 마치면 드러납니다', prog: '', state: 'next' }); break; }
  }
  // ── 서브: 시작된 이야기만
  const sub = []; let hidden = 0;
  const M = sv.merlin || {};
  if (M.revealed) {
    const q = M.quest || 1, T = typeof MERLIN_TRIAL !== 'undefined' ? MERLIN_TRIAL : { gate: 0, deep: 2 };
    if (q >= 22) sub.push({ title: '멀린의 시련', desc: '아서 왕에게 101번째 원탁의 기사로 인정받았다', prog: '완료', state: 'done' });
    else if (q === 1) { const ok = (M.deep || 0) >= T.deep && (M.gate || 0) >= T.gate;
      sub.push({ title: '멀린의 시련', desc: ok ? '시련 완료 — 길드 구석의 멀린에게 말 걸기' : `심층 보스 ${T.deep}마리 처치${T.gate ? ` · 문지기 ${T.gate}번` : ''}`, prog: ok ? '보고하기' : `${Math.min(M.deep || 0, T.deep)}/${T.deep}`, state: ok ? 'ready' : 'now' }); }
    else sub.push({ title: '멀린의 시련', desc: QUEST_MERLIN_STEPS[q] || '멀린에게 말 걸기', prog: `${q}/22 단계`, state: q % 2 === 0 ? 'ready' : 'now' });
  } else if ((sv.treasures || []).length) sub.push({ title: '후드를 쓴 마법사', desc: '길드 오른쪽 구석의 마법사에게 말 걸기', prog: '', state: 'ready' });
  else hidden++;
  const B = sv.babylon || {}, babOpen = !!(M.quest >= 4);
  if (seen('gilgamesh_under_win')) sub.push({ title: '바빌로니아', desc: '영웅왕 길가메시에게 인정받았다', prog: '완료', state: 'done' });
  else if (B.visited) sub.push({ title: '바빌로니아', desc: '지하 · 지상 · 지구라트를 지나 영웅왕의 왕좌로', prog: '', state: 'now' });
  else if (babOpen) sub.push({ title: '금빛의 문', desc: B.rumor ? '심층 10-4 보스를 쓰러뜨린 뒤 나타나는 금빛 포탈로' : '길드 탁자의 탐험가에게서 소문 듣기 · 심층 10-4의 금빛 포탈', prog: '', state: 'now' });
  else hidden++;
  const recs = typeof UNIQUE_RECORDS !== 'undefined' ? UNIQUE_RECORDS : [], found = recs.filter((R) => sv.uniqueRecords && sv.uniqueRecords[R.id]).length;
  if (sv.uniqueQuest) sub.push({ title: '끊긴 이야기들', desc: '세 기록의 다음 장을 찾아라 (다음 이야기는 준비 중)', prog: '3/3 기록', state: 'now' });
  else if (archivist || found) sub.push({ title: '끊긴 세 기록', desc: '심층 30층 서고에 떠오른 기록 세 권 읽기', prog: `${found}/${recs.length || 3}`, state: 'now' });
  else hidden++;
  const X = sv.explorer || {}, xq = X.v3 ? X.quest : X.met ? 1 : 0;
  if (xq >= 2) sub.push({ title: '무명객을 찾아라', desc: '무명객의 소식을 전하고 개척자의 외투를 받았다 (무명객의 이야기는 준비 중)', prog: '완료', state: 'done' });
  else if (xq === 1) sub.push(sv.unrecordedMet ? { title: '무명객을 찾아라', desc: '심층 50 개척자의 마을로 돌아가 최초의 탐험가에게 알리기', prog: '보고하기', state: 'ready' } : { title: '무명객을 찾아라', desc: '던전을 탐사하며 무명객의 행방 찾기', prog: '???', state: 'now' });
  else if (deep >= 50) sub.push({ title: '마을의 큰 집', desc: '개척자의 마을 가장 안쪽 큰 집의 사람에게 말 걸기', prog: '', state: 'ready' });
  else hidden++;
  const U = sv.unrec || {}, UN = typeof UNRECORDED_SEED !== 'undefined' ? UNRECORDED_SEED.need : 3, up = (U.planted || []).length;
  if (U.quest >= 2) sub.push({ title: '틈을 넓혀라', desc: '미기록자와 손을 잡았다 · 던전의 글리치 조각에 가까이 가면 체력·에너지 +50', prog: '완료', state: 'done' });
  else if (U.quest === 1) sub.push(up >= UN ? { title: '틈을 넓혀라', desc: '개척자의 마을로 돌아가 미기록자에게 보고하기', prog: '보고하기', state: 'ready' } : { title: '틈을 넓혀라', desc: '심층 보스를 쓰러뜨린 자리에 글리치 씨앗 심기 (태고룡의 둥지·개척자의 마을 제외)', prog: `${up}/${UN}`, state: 'now' });
  else if (sv.unrecordedMet) sub.push({ title: '마을의 미기록자', desc: '개척자의 마을에 나타난 미기록자에게 말 걸기', prog: '', state: 'ready' });
  // ── 수락한 임무: 토벌 의뢰 → 오늘 · 이번 주 길드 퀘스트
  const tasks = [];
  const G = game.guild ? game.guild() : null;
  if (G) {
    for (const h of G.active || []) tasks.push({ title: h.name, desc: `토벌 의뢰 · ${h.where || ''} · 보상 결정석 ${h.reward}`, prog: h.done ? '완료 — 게시판에서 보상' : `${h.prog || 0}/${h.n}`, state: h.done ? 'ready' : 'now' });
    if (!(G.active || []).length) tasks.push({ title: '수락한 토벌 의뢰 없음', desc: `길드 오른쪽 토벌 게시판에서 최대 ${typeof GUILD_HUNT !== 'undefined' ? GUILD_HUNT.maxActive : 2}개까지 수락`, prog: '', state: 'next' });
    const q = (x, kind) => tasks.push({ title: x.name, desc: `${kind} 퀘스트 · 보상 결정석 ${x.reward}`, prog: x.claimed ? '받음' : x.prog >= x.n ? '완료 — 접수대에서 보상' : `${Math.min(x.prog || 0, x.n).toLocaleString()}/${x.n.toLocaleString()}`, state: x.claimed ? 'done' : x.prog >= x.n ? 'ready' : 'now' });
    (G.daily || []).forEach((x) => q(x, '오늘')); (G.weekly || []).forEach((x) => q(x, '이번 주'));
  }
  return { main, sub, tasks, hidden };
}

const QUEST_ROW_H = 27, QUEST_TOP = 46, QUEST_ROWS = 8;
function questRows(game, o) { const B = questBook(game); return [B.main, B.sub, B.tasks][o.tab || 0]; }
function drawQuestWindow(ctx, game, o) {
  const B = questBook(game), list = [B.main, B.sub, B.tasks][o.tab || 0], m = game.input.mouse;
  hudText(ctx, '퀘스트', VIEW_W / 2, 6, '#ffd84a', 'center', 11);
  QUEST_TABS.forEach((t, i) => { const r = HUD.guildTab(i), on = (o.tab || 0) === i; ctx.fillStyle = on ? 'rgba(255,216,74,0.25)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const n = i === 1 ? B.sub.length : i === 2 ? (game.guild ? (game.guild().active || []).length : 0) : 0;
    hudText(ctx, `${i + 1} ${t}${n ? ` (${n})` : ''}`, r.x + r.w / 2, r.y + 4, on ? '#ffd84a' : '#aaa', 'center', 8); });
  const max = Math.max(0, list.length - QUEST_ROWS); o.scroll = Math.max(0, Math.min(max, o.scroll || 0));
  const COL = { done: ['#6a8a6a', '#5a6a5a', '✓ '], now: ['#ffffff', '#b8b0c8', '▶ '], ready: ['#ffd84a', '#d8c890', '! '], next: ['#777777', '#5a5a66', ''] };
  list.slice(o.scroll, o.scroll + QUEST_ROWS).forEach((q, i) => {
    const x = 40, y = QUEST_TOP + i * QUEST_ROW_H, w = VIEW_W - 80, [c1, c2, mark] = COL[q.state] || COL.now, hov = m.x >= x && m.x <= x + w && m.y >= y && m.y < y + QUEST_ROW_H - 3;
    ctx.fillStyle = q.state === 'now' || q.state === 'ready' ? (hov ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.025)'; ctx.fillRect(x, y, w, QUEST_ROW_H - 3);
    if (q.state === 'now' || q.state === 'ready') { ctx.fillStyle = q.state === 'ready' ? '#ffd84a' : '#9ad8ff'; ctx.fillRect(x, y, 2, QUEST_ROW_H - 3); }
    hudText(ctx, mark + q.title, x + 8, y + 3, c1, 'left', 9, w - 110);
    if (q.prog) hudText(ctx, q.prog, x + w - 6, y + 3, q.state === 'ready' ? '#ffd84a' : q.state === 'done' ? '#6a8a6a' : '#9ad8ff', 'right', 8);
    hudText(ctx, q.desc, x + 18, y + 14, c2, 'left', 7, w - 26);
  });
  if (!list.length) hudText(ctx, '아직 아무것도 없습니다', VIEW_W / 2, QUEST_TOP + 30, '#777', 'center', 9);
  if ((o.tab || 0) === 1 && B.hidden) hudText(ctx, `??? 아직 찾지 못한 이야기 ${B.hidden}개`, VIEW_W / 2, QUEST_TOP + Math.min(list.length, QUEST_ROWS) * QUEST_ROW_H + 4, '#666', 'center', 8);
  if (max) hudText(ctx, `휠 / ↑↓ 스크롤  (${o.scroll + 1}~${Math.min(list.length, o.scroll + QUEST_ROWS)} / ${list.length})`, VIEW_W - 40, VIEW_H - 16, '#777', 'right', 7);
  hudText(ctx, '1·2·3 / 클릭: 탭   ·   U / Esc: 닫기', 40, VIEW_H - 16, '#888', 'left', 7);
}
function updateQuestWindow(game, input) { // true를 돌려주면 창을 닫음
  const o = game.overlay;
  if (input.wasPressed('Escape') || input.wasPressed('KeyU')) { game.overlay = o.back === 'pause' ? { type: 'pause' } : null; return true; }
  ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (input.wasPressed(k)) { o.tab = i; o.scroll = 0; } });
  if (input.wasPressed('Mouse0')) for (let i = 0; i < 3; i++) { const r = HUD.guildTab(i), m = input.mouse; if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) { o.tab = i; o.scroll = 0; } }
  if (input.wasPressed('WheelDown') || input.wasPressed('ArrowDown')) o.scroll = (o.scroll || 0) + 1;
  if (input.wasPressed('WheelUp') || input.wasPressed('ArrowUp')) o.scroll = Math.max(0, (o.scroll || 0) - 1);
  return false;
}
