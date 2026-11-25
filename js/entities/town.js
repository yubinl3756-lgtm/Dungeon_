'use strict';
// ════════════════════════════════════════════
// 심층 50 개척자의 마을 — 최초의 탐험가가 만든, 던전에서 유일하게 사람이 사는 곳 (몬스터 없음) [사용자 결정]
//  집(그림) · 주민(말 걸기) · 최초의 탐험가(퀘스트) · 표지판
// ════════════════════════════════════════════
Object.assign(GUILD_NPC_LOOK, {
  explorer: { id: 'npc_explorer', look: { sprite: 'gunslinger', body: '#7a5a32', accent: '#e0b058' } }, // 낡은 탐험가 외투 + 바랜 금빛
  t_lancer: { id: 'npc_t_lancer', look: { sprite: 'knight', body: '#5a6a7a', accent: '#c8d0e0' } },
  t_mage: { id: 'npc_t_mage', look: { sprite: 'wizard', body: '#4a3a6a', accent: '#e0e0f0' } },
  t_smith: { id: 'npc_t_smith', look: { sprite: 'berserker', body: '#6a3a2a', accent: '#ffb04a' } },
  t_herb: { id: 'npc_t_herb', look: { sprite: 'druid', body: '#4a6a3a', accent: '#c8e0a0' } },
  t_hunter: { id: 'npc_t_hunter', look: { sprite: 'gunslinger', body: '#3a3a4a', accent: '#c83a3a' } }
});
// 말풍선 (길드용 drawBubble과 같지만 길드 벽 안쪽으로 붙이지 않음)
function townBubble(ctx, x, y, text) {
  ctx.font = 'bold 8px monospace';
  let lines = [text];
  if (ctx.measureText(text).width > 170) { const mid = Math.floor(text.length / 2), sp = text.lastIndexOf(' ', mid + 6); const k = sp > 4 ? sp : mid; lines = [text.slice(0, k).trim(), text.slice(k).trim()]; }
  const tw = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))) + 10, th = lines.length * 10 + 4, by = Math.round(y - th - 4), bx = Math.round(x - tw / 2);
  ctx.fillStyle = OUTLINE; ctx.fillRect(bx - 1, by - 1, tw + 2, th + 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, tw, th);
  ctx.fillRect(x - 2, by + th, 4, 3); ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, by + th + 3, 2, 1);
  lines.forEach((l, i) => hudText(ctx, l, bx + tw / 2, by + 2 + i * 10, '#3a3048', 'center', 8));
}
// 집: 맵의 엄폐물 칸(막힘) 위에 그리는 돌벽 · 나무 지붕 · 문 · 불 켜진 창
class TownHouse {
  constructor(h, i) { this.tx = h.x; this.ty = h.y; this.tw = h.w; this.th = h.h; this.x = (h.x + h.w / 2) * TILE; this.y = (h.y + h.h) * TILE; this.radius = 0; this.i = i; }
  label() { return null; }
  render(ctx, game) {
    const x0 = this.tx * TILE, y0 = this.ty * TILE, w = this.tw * TILE, h = this.th * TILE, t = game ? game.time : 0, i = this.i;
    const roof = ['#8a3a2a', '#5a4a7a', '#3a6a4a', '#7a5a2a'][i % 4], roofHi = ['#b05a3a', '#7a6aa0', '#5a8a62', '#a07a3a'][i % 4];
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x0 + 2, y0 + h - 2, w, 5);
    ctx.fillStyle = OUTLINE; ctx.fillRect(x0 - 1, y0 + 6, w + 2, h - 5);
    ctx.fillStyle = '#b8a888'; ctx.fillRect(x0, y0 + 7, w, h - 7); // 돌벽
    ctx.fillStyle = '#9a8a6a'; for (let yy = y0 + 11; yy < y0 + h; yy += 6) for (let xx = x0 + ((yy / 6) % 2 ? 0 : 6); xx < x0 + w; xx += 12) ctx.fillRect(xx, yy, 1, 5);
    for (let yy = y0 + 10; yy < y0 + h; yy += 6) ctx.fillRect(x0, yy, w, 1);
    ctx.fillStyle = OUTLINE; ctx.fillRect(x0 - 5, y0 - 9, w + 10, 17); // 지붕
    ctx.fillStyle = roof; ctx.fillRect(x0 - 4, y0 - 8, w + 8, 15);
    ctx.fillStyle = roofHi; for (let xx = x0 - 4; xx < x0 + w + 4; xx += 5) ctx.fillRect(xx, y0 - 8, 2, 15);
    ctx.fillStyle = OUTLINE; ctx.fillRect(x0 - 4, y0 + 2, w + 8, 1);
    const ch = i % 2 ? x0 + w - 16 : x0 + 10; // 굴뚝 + 연기
    ctx.fillStyle = OUTLINE; ctx.fillRect(ch - 1, y0 - 16, 8, 9); ctx.fillStyle = '#8a7a6a'; ctx.fillRect(ch, y0 - 15, 6, 7);
    for (let k = 0; k < 3; k++) { const f = (t * 0.5 + k / 3 + i * 0.17) % 1; ctx.globalAlpha = 0.45 * (1 - f); ctx.fillStyle = '#d8d0c8'; ctx.fillRect(Math.round(ch + 2 + Math.sin(f * 5 + i) * 3), Math.round(y0 - 18 - f * 16), 3, 3); }
    ctx.globalAlpha = 1;
    const dx = Math.round(x0 + w / 2 - 5); // 문
    ctx.fillStyle = OUTLINE; ctx.fillRect(dx - 1, y0 + h - 15, 12, 15); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(dx, y0 + h - 14, 10, 14); ctx.fillStyle = '#ffd060'; ctx.fillRect(dx + 7, y0 + h - 8, 1, 2);
    const glow = 0.75 + 0.2 * Math.sin(t * 2 + i * 1.7); // 창: 따뜻한 불빛
    for (const wx of [x0 + 7, x0 + w - 17]) { ctx.fillStyle = OUTLINE; ctx.fillRect(wx - 1, y0 + 12, 12, 10); ctx.fillStyle = `rgba(255,200,96,${glow})`; ctx.fillRect(wx, y0 + 13, 10, 8); ctx.fillStyle = OUTLINE; ctx.fillRect(wx + 5, y0 + 13, 1, 8); ctx.fillRect(wx, y0 + 17, 10, 1); }
  }
}
// 마을 주민: 말을 걸면 한마디 (말풍선)
class TownResident {
  constructor(x, y, key, name, lines, face = 1) { this.x = x; this.y = y; this.key = key; this.name = name; this.lines = lines; this.face = face; this.radius = 22; this.bubble = null; this.k = 0; }
  label() { return `[E] ${this.name}`; }
  get labelColor() { return '#ffe0b0'; }
  interact(game) { this.bubble = { text: this.lines[this.k++ % this.lines.length], t: 4 }; this.face = game.player.x < this.x ? -1 : 1; }
  render(ctx, game) {
    const x = Math.round(this.x), y = Math.round(this.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 5, 7, 2.5, 0, 0, TAU); ctx.fill();
    npcDraw(ctx, this.key, x, y - 2, this.face, game);
    hudText(ctx, this.name, x, y + 8, '#e0d0b0', 'center', 6);
  }
  renderTop(ctx) { if (this.bubble && this.bubble.t > 0) { this.bubble.t -= 1 / 60; townBubble(ctx, Math.round(this.x), Math.round(this.y) - 22, this.bubble.text); } }
}
// 최초의 탐험가 (개척자): 지도로 뒤덮인 책상 앞. 말을 걸면 퀘스트
class FirstExplorer {
  constructor(x, y) { this.x = x; this.y = y; this.radius = 30; this.bubble = null; }
  label(game) { const X = game.save.explorer; return X && X.met ? '[E] 최초의 탐험가' : '[E] 낡은 외투의 사람'; }
  get labelColor() { return '#e0b058'; }
  interact(game) { game.talkExplorer(this); }
  render(ctx, game) {
    const x = Math.round(this.x), y = Math.round(this.y), t = game.time;
    ctx.fillStyle = OUTLINE; ctx.fillRect(x - 31, y - 31, 62, 20); ctx.fillStyle = '#e8d4a8'; ctx.fillRect(x - 30, y - 30, 60, 18); // 벽에 붙인 큰 지도
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - 26, y - 22, 14, 1); ctx.fillRect(x - 12, y - 26, 1, 10); ctx.fillRect(x - 12, y - 17, 20, 1); ctx.fillRect(x + 8, y - 27, 1, 11); ctx.fillRect(x + 8, y - 27, 16, 1);
    ctx.fillStyle = '#c83a3a'; ctx.fillRect(x + 23, y - 28, 3, 3); ctx.fillStyle = '#5a8a6a'; ctx.fillRect(x - 27, y - 23, 3, 3);
    ctx.fillStyle = OUTLINE; ctx.fillRect(x - 17, y + 2, 34, 9); ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 16, y + 3, 32, 7); ctx.fillStyle = '#e8d4a8'; ctx.fillRect(x - 12, y + 3, 10, 4); ctx.fillRect(x + 3, y + 4, 8, 3); // 책상 + 펼친 지도
    ctx.fillStyle = `rgba(255,200,96,${0.6 + 0.3 * Math.sin(t * 6)})`; ctx.fillRect(x + 12, y, 3, 3); // 촛불
    npcDraw(ctx, 'explorer', x, y - 6, 1, game);
    const X = game.save.explorer || {}, ready = X.quest === 1 && !!game.save.unrecordedMet;
    if ((!X.met || ready) && Math.floor(t * 3) % 2 === 0) hudText(ctx, ready ? '?' : '!', x, y - 34, '#ffd84a', 'center', 14);
    hudText(ctx, X.met ? '최초의 탐험가' : '???', x, y + 13, '#e0b058', 'center', 7);
  }
  renderTop(ctx) { if (this.bubble && this.bubble.t > 0) { this.bubble.t -= 1 / 60; townBubble(ctx, Math.round(this.x), Math.round(this.y) - 26, this.bubble.text); } }
}
// 마을 입구 표지판
class TownSign {
  constructor(x, y, text) { this.x = x; this.y = y; this.text = text; this.radius = 0; }
  label() { return null; }
  render(ctx) { const x = Math.round(this.x), y = Math.round(this.y); ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 6, 3, 12); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x, y - 5, 1, 10); signText(ctx, this.text, x, y - 10, '#ffe0b0'); }
}
