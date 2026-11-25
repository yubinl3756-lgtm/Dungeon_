'use strict';
// ════════════════════════════════════════════
// 맵
// ════════════════════════════════════════════
class DungeonMap {
  constructor(w, h, palette) {
    this.width = w; this.height = h; this.palette = palette;
    this.tiles = new Uint8Array(w * h);
    this.rooms = []; this.edges = []; this.cache = null; this.decorate = null;
  }
  get(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return T_VOID;
    return this.tiles[ty * this.width + tx];
  }
  set(tx, ty, v) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return;
    this.tiles[ty * this.width + tx] = v;
  }
  isSolidTile(tx, ty) { return this.get(tx, ty) !== T_FLOOR; }
  isSolidAt(px, py) { return this.isSolidTile(Math.floor(px / TILE), Math.floor(py / TILE)); }
  tileCenter(tx, ty) { return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }; }
  roomAtPoint(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    for (const r of this.rooms)
      if (tx >= r.x0 && tx < r.x0 + r.w && ty >= r.y0 && ty < r.y0 + r.h) return r;
    return null;
  }
  isFullyInside(ent, r, m = TILE / 2) {
    return ent.x - ent.half >= r.x0 * TILE + m && ent.x + ent.half <= (r.x0 + r.w) * TILE - m &&
           ent.y - ent.half >= r.y0 * TILE + m && ent.y + ent.half <= (r.y0 + r.h) * TILE - m;
  }
  setDoors(room, closed) { for (const d of room.doors) this.set(d.x, d.y, closed ? T_DOOR : T_FLOOR); }
  // [버그 수정] 문을 "닫기 전에" 문 타일에 걸친 엔티티를 방 안쪽으로 밀어넣어, 애초에 벽에 끼지 않게 함
  pushOffDoors(ent, room) {
    const h = ent.half + 0.5, rx1 = room.x0 + room.w, ry1 = room.y0 + room.h;
    for (const d of room.doors) {
      if (ent.x + ent.half <= d.x * TILE || ent.x - ent.half >= (d.x + 1) * TILE) continue; // 가로로 안 겹침
      if (ent.y + ent.half <= d.y * TILE || ent.y - ent.half >= (d.y + 1) * TILE) continue; // 세로로 안 겹침
      if (d.x < room.x0) ent.x = Math.max(ent.x, (d.x + 1) * TILE + h);       // 왼쪽 벽 문 → 오른쪽(안쪽)
      else if (d.x >= rx1) ent.x = Math.min(ent.x, d.x * TILE - h);           // 오른쪽 벽 문 → 왼쪽(안쪽)
      else if (d.y < room.y0) ent.y = Math.max(ent.y, (d.y + 1) * TILE + h);  // 위쪽 벽 문 → 아래쪽(안쪽)
      else if (d.y >= ry1) ent.y = Math.min(ent.y, d.y * TILE - h);           // 아래쪽 벽 문 → 위쪽(안쪽)
    }
  }
  // [버그 수정] 벽 끼임 안전장치: 중심이 solid 타일에 박힌 엔티티를 가장 가까운(몸이 들어갈 수 있는) 바닥 타일 중심으로 빼냄
  unstick(ent) {
    if (!overlapsSolid(ent.x, ent.y, ent.half, this)) return false;
    const ctx = Math.floor(ent.x / TILE), cty = Math.floor(ent.y / TILE);
    let best = null, bd = Infinity;
    for (let rad = 1; rad <= 5 && !best; rad++) {
      for (let oy = -rad; oy <= rad; oy++) for (let ox = -rad; ox <= rad; ox++) {
        if (Math.max(Math.abs(ox), Math.abs(oy)) !== rad) continue; // 현재 반경의 테두리만
        const tx = ctx + ox, ty = cty + oy;
        if (this.isSolidTile(tx, ty)) continue;
        const cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
        if (overlapsSolid(cx, cy, ent.half, this)) continue; // 몸이 통째로 들어갈 수 있는 칸만
        const d = (cx - ent.x) ** 2 + (cy - ent.y) ** 2;
        if (d < bd) { bd = d; best = { x: cx, y: cy }; }
      }
    }
    if (best) { ent.x = best.x; ent.y = best.y; return true; }
    return false;
  }
  carveRoom(x0, y0, w, h) {
    for (let ty = y0 - 1; ty <= y0 + h; ty++)
      for (let tx = x0 - 1; tx <= x0 + w; tx++) this.set(tx, ty, T_WALL);
    for (let ty = y0; ty < y0 + h; ty++)
      for (let tx = x0; tx < x0 + w; tx++) this.set(tx, ty, T_FLOOR);
  }

  // 맵 전체를 한 장의 캔버스에 미리 그림 (테마 타일 + 장식). 횃불·용암 빛은 renderAnim에서 매 프레임
  buildCache() {
    const pal = this.palette, style = pal.style || 'stone';
    const c = document.createElement('canvas');
    c.width = this.width * TILE; c.height = this.height * TILE;
    const g = c.getContext('2d');
    this.cache = c; this.cacheCtx = g;
    this.inRoom = new Uint8Array(this.width * this.height);
    for (const r of this.rooms)
      for (let ty = r.y0; ty < r.y0 + r.h; ty++) for (let tx = r.x0; tx < r.x0 + r.w; tx++) this.inRoom[ty * this.width + tx] = 1;
    const solidish = (t) => t === T_WALL || t === T_DOOR || t === T_COVER || t === T_CRATE;
    // 1) 바닥 (엄폐물·상자 아래에도 바닥을 깔아 둠)
    for (let ty = 0; ty < this.height; ty++)
      for (let tx = 0; tx < this.width; tx++) {
        const t = this.get(tx, ty);
        if (t === T_FLOOR || t === T_COVER || t === T_CRATE) this.drawFloorAt(g, tx, ty);
      }
    // 2) 방 색조 + 방 장식
    const overlay = { boss: 'rgba(200,40,60,0.10)', treasure: 'rgba(220,180,60,0.07)', shop: 'rgba(80,200,120,0.07)', exit: 'rgba(80,160,255,0.08)' };
    for (const r of this.rooms) {
      if (overlay[r.type]) { g.fillStyle = overlay[r.type]; g.fillRect(r.x0 * TILE, r.y0 * TILE, r.w * TILE, r.h * TILE); }
      drawRoomArt(g, r, pal);
    }
    if (this.decorate) this.decorate(g);
    // 3) 벽 (+ 바닥에 드리운 그림자)
    for (let ty = 0; ty < this.height; ty++)
      for (let tx = 0; tx < this.width; tx++) {
        const t = this.get(tx, ty);
        if (t !== T_WALL && t !== T_DOOR) continue;
        const below = this.get(tx, ty + 1), face = below === T_FLOOR || below === T_COVER || below === T_CRATE;
        drawWallTile(g, tx * TILE, ty * TILE, pal, face, style, tx, ty);
        if (face) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(tx * TILE, (ty + 1) * TILE, TILE, 3); }
      }
    // 4) 엄폐물·상자
    for (let ty = 0; ty < this.height; ty++)
      for (let tx = 0; tx < this.width; tx++) {
        const t = this.get(tx, ty);
        if (t === T_COVER) drawCover(g, tx * TILE, ty * TILE, style, tx, ty);
        else if (t === T_CRATE) drawCrate(g, tx * TILE, ty * TILE, style);
      }
    // 5) 애니메이션 위치: 방 윗벽의 횃불, 용암 균열
    this.torches = []; this.glows = [];
    for (const r of this.rooms) {
      const ty = r.y0 - 1;
      for (let tx = r.x0 + 1; tx < r.x0 + r.w - 1; tx++) {
        if ((tx - r.x0) % 4 !== 2 || this.get(tx, ty) !== T_WALL || this.get(tx, ty + 1) !== T_FLOOR) continue;
        if (r.doors.some((d) => Math.abs(d.x - tx) <= 1 && d.y === ty)) continue;
        this.torches.push({ x: tx * TILE + 8, y: ty * TILE + 10, seed: hash2(tx, ty, 7) * 10 });
      }
    }
    if (style === 'basalt')
      for (let ty = 0; ty < this.height; ty++) for (let tx = 0; tx < this.width; tx++)
        if (this.get(tx, ty) === T_FLOOR && hash2(tx, ty, 5) < 0.1) this.glows.push({ x: tx * TILE + 8, y: ty * TILE + 8, seed: hash2(tx, ty, 9) * 10 });
  }
  drawFloorAt(g, tx, ty) {
    const pal = this.palette, cols = this.inRoom[ty * this.width + tx] ? pal.floor : pal.corridor;
    drawFloorTile(g, tx * TILE, ty * TILE, cols[(tx + ty) % 2], pal.style || 'stone', tx, ty);
  }
  // 상자가 부서진 자리를 바닥으로 다시 그림
  redrawTile(tx, ty) {
    if (!this.cacheCtx) return;
    const g = this.cacheCtx;
    this.drawFloorAt(g, tx, ty);
    const above = this.get(tx, ty - 1);
    if (above === T_WALL || above === T_DOOR) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(tx * TILE, ty * TILE, TILE, 3); }
    for (const r of this.rooms) if (tx >= r.x0 && tx < r.x0 + r.w && ty >= r.y0 && ty < r.y0 + r.h && r.type === 'boss') drawRoomArt(g, r, this.palette);
  }
  // 횃불 불꽃·빛, 용암 균열의 맥동
  renderAnim(ctx, time, cam) {
    const T = THEME[this.palette.style] || THEME.stone;
    const vis = (o) => o.x > cam.x - 40 && o.x < cam.x + VIEW_W + 40 && o.y > cam.y - 40 && o.y < cam.y + VIEW_H + 40;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const t of this.torches) {
      if (!vis(t)) continue;
      const f = 0.8 + 0.2 * Math.sin(time * 9 + t.seed) + 0.1 * Math.sin(time * 23 + t.seed * 3);
      const grd = ctx.createRadialGradient(t.x, t.y - 2, 0, t.x, t.y - 2, 30 * f);
      grd.addColorStop(0, T.torch + '55'); grd.addColorStop(1, T.torch + '00');
      ctx.fillStyle = grd; ctx.fillRect(t.x - 32, t.y - 34, 64, 64);
    }
    for (const gl of this.glows) {
      if (!vis(gl)) continue;
      const a = 0.12 + 0.1 * Math.sin(time * 2.5 + gl.seed);
      const grd = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, 14);
      grd.addColorStop(0, `rgba(255,110,40,${a})`); grd.addColorStop(1, 'rgba(255,110,40,0)');
      ctx.fillStyle = grd; ctx.fillRect(gl.x - 14, gl.y - 14, 28, 28);
    }
    ctx.restore();
    for (const t of this.torches) { // 횃대 + 일렁이는 불꽃
      if (!vis(t)) continue;
      const x = Math.round(t.x), y = Math.round(t.y), fr = Math.floor(time * 10 + t.seed) % 3;
      ctx.fillStyle = OUTLINE; ctx.fillRect(x - 2, y, 4, 3); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1, y, 2, 4);
      ctx.fillStyle = T.torch; ctx.fillRect(x - 2, y - 3 - (fr === 1 ? 1 : 0), 4, 3); ctx.fillRect(x - 1 + (fr === 2 ? 1 : 0), y - 5 - (fr === 1 ? 1 : 0), 2, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 2, 2, 1);
    }
  }
  render(ctx, cam) {
    if (!this.cache) this.buildCache();
    const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y));
    const sw = Math.min(VIEW_W + 2, this.cache.width - sx), sh = Math.min(VIEW_H + 2, this.cache.height - sy);
    if (sw > 0 && sh > 0) ctx.drawImage(this.cache, sx, sy, sw, sh, sx, sy, sw, sh);
  }
  renderDoors(ctx, time) {
    for (const r of this.rooms) {
      if (r.state !== 'active') continue;
      for (const d of r.doors) {
        const x = d.x * TILE, y = d.y * TILE;
        ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2a1c10';
        for (let i = 2; i < TILE; i += 4) ctx.fillRect(x + i, y, 2, TILE);
        ctx.fillStyle = `rgba(255,80,60,${0.4 + 0.3 * Math.sin(time * 6)})`; ctx.fillRect(x, y, TILE, 2);
      }
    }
  }
}

// ── 절차적 던전: 5x5 격자 위 랜덤 트리 → 특수방은 먼 막다른 방부터 배정
function generateDungeon(opts) {
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const key = (x, y) => x + ',' + y;
  const cells = new Map(), order = [], edges = [];
  const add = (gx, gy) => { const c = { gx, gy, links: [] }; cells.set(key(gx, gy), c); order.push(c); return c; };
  const start = add(2, 2);
  let guard = 0;
  while (order.length < opts.roomCount && guard++ < 5000) {
    const from = pick(order);
    if (from.links.length >= 3) continue;
    const [dx, dy] = pick(DIRS);
    const nx = from.gx + dx, ny = from.gy + dy;
    if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H || cells.has(key(nx, ny))) continue;
    const c = add(nx, ny);
    from.links.push(c); c.links.push(from); edges.push([from, c]);
  }
  start.dist = 0;
  const q = [start];
  while (q.length) { const c = q.shift(); for (const n of c.links) if (n.dist === undefined) { n.dist = c.dist + 1; q.push(n); } }
  const leaves = order.filter((c) => c !== start && c.links.length === 1).sort((a, b) => b.dist - a.dist);
  start.type = 'start';
  const assigned = new Set([start]);
  for (const type of opts.specials) {
    const cell = leaves.find((c) => !assigned.has(c)) || pick(order.filter((c) => !assigned.has(c)));
    if (!cell) break;
    cell.type = type; assigned.add(cell);
  }
  for (const c of order) if (!c.type) c.type = 'combat';

  const map = new DungeonMap(GRID_W * CELL_W, GRID_H * CELL_H, opts.palette);
  const SIZES = { start: [11, 9], treasure: [11, 9], shop: [13, 9], exit: [11, 9], boss: opts.bossSize || [23, 17], /* bossSize: 길가메시 왕좌의 방은 조금 넓게 */ fountain: [11, 9], altar: [11, 9], gamble: [11, 9], challenge: [17, 13], forge: [11, 9], blood: [11, 9], rack: [13, 9], smithy: [11, 9], evolve: [17, 13] };
  for (const c of order) {
    const [w, h] = SIZES[c.type] || [15 + 2 * randInt(0, 2), 11 + 2 * randInt(0, 1)];
    const cx = c.gx * CELL_W + (CELL_W >> 1), cy = c.gy * CELL_H + (CELL_H >> 1);
    const x0 = cx - (w >> 1), y0 = cy - (h >> 1);
    const room = { type: c.type, gx: c.gx, gy: c.gy, x0, y0, w, h, cx, cy, doors: [],
      state: (c.type === 'combat' || c.type === 'boss') ? 'idle' : 'cleared',
      visited: c.type === 'start', wavesLeft: c.type === 'combat' ? opts.waves : 0 };
    c.room = room;
    map.carveRoom(x0, y0, w, h);
    if (c.type === 'combat' || c.type === 'challenge') placeCover(map, room);
    map.rooms.push(room);
  }
  for (const [a, b] of edges) {
    const ra = a.room, rb = b.room;
    if (a.gy === b.gy) {
      const L = ra.gx < rb.gx ? ra : rb, R = L === ra ? rb : ra, y = L.cy;
      const xs = L.x0 + L.w, xe = R.x0 - 1;
      for (let x = xs; x <= xe; x++) {
        for (let d = -1; d <= 1; d++) map.set(x, y + d, T_FLOOR);
        for (const d of [-2, 2]) if (map.get(x, y + d) === T_VOID) map.set(x, y + d, T_WALL);
      }
      for (let d = -1; d <= 1; d++) { L.doors.push({ x: xs, y: y + d }); R.doors.push({ x: xe, y: y + d }); }
    } else {
      const T = ra.gy < rb.gy ? ra : rb, B = T === ra ? rb : ra, x = T.cx;
      const ys = T.y0 + T.h, ye = B.y0 - 1;
      for (let y = ys; y <= ye; y++) {
        for (let d = -1; d <= 1; d++) map.set(x + d, y, T_FLOOR);
        for (const d of [-2, 2]) if (map.get(x + d, y) === T_VOID) map.set(x + d, y, T_WALL);
      }
      for (let d = -1; d <= 1; d++) { T.doors.push({ x: x + d, y: ys }); B.doors.push({ x: x + d, y: ye }); }
    }
    map.edges.push([ra, rb]);
  }
  for (const r of map.rooms) if (r.type === 'combat') placeCrates(map, r, randInt(2, 5)); else if (r.type === 'start') placeCrates(map, r, 1);
  map.startRoom = start.room;
  map.roomOf = (type) => map.rooms.find((r) => r.type === type) || null;
  return map;
}

// 보스만 있는 층(심층 40 태고룡의 둥지): 시작 방 + 바로 위의 아주 넓은 보스 아레나 (잡몹방 없음)
//  아레나 위쪽 가장자리 너머 상공에 거대한 보스가 떠 있음 — 가장자리에 부서진 기둥 몇 개
function buildBossArena(opts) {
  const map = new DungeonMap(GRID_W * CELL_W, GRID_H * CELL_H, opts.palette), [aw, ah] = opts.size || [49, 29], cx = (GRID_W * CELL_W) >> 1;
  const by0 = 8, bx0 = cx - (aw >> 1), sw = 11, sh = 9, sy0 = by0 + ah + 6, sx0 = cx - (sw >> 1);
  const boss = { type: 'boss', gx: 2, gy: 1, x0: bx0, y0: by0, w: aw, h: ah, cx, cy: by0 + (ah >> 1), doors: [], state: 'idle', visited: false, wavesLeft: 0, arena: true };
  const start = { type: 'start', gx: 2, gy: 3, x0: sx0, y0: sy0, w: sw, h: sh, cx, cy: sy0 + (sh >> 1), doors: [], state: 'cleared', visited: true, wavesLeft: 0 };
  map.carveRoom(bx0, by0, aw, ah); map.carveRoom(sx0, sy0, sw, sh);
  const ys = by0 + ah, ye = sy0 - 1; // 아레나 아래 문 ↔ 시작 방 위 문
  for (let y = ys; y <= ye; y++) { for (let d = -1; d <= 1; d++) map.set(cx + d, y, T_FLOOR); for (const d of [-2, 2]) if (map.get(cx + d, y) === T_VOID) map.set(cx + d, y, T_WALL); }
  for (let d = -1; d <= 1; d++) { boss.doors.push({ x: cx + d, y: ys }); start.doors.push({ x: cx + d, y: ye }); }
  const pillar = (x, y) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) map.set(x + i, y + j, T_COVER); };
  for (const [dx, dy] of [[-21, 4], [20, 4], [-12, 8], [11, 8]]) pillar(cx + dx, by0 + dy); // 부서진 기둥 (몸을 숨길 곳)
  map.rooms.push(boss, start); map.edges.push([boss, start]);
  map.startRoom = start; map.roomOf = (type) => map.rooms.find((r) => r.type === type) || null;
  return map;
}

// 전투방 엄폐물 (문 통로를 막지 않고, 큰 적도 지나가도록 2칸 이상 틈 유지)
function placeCover(map, r) {
  const block = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) map.set(x + i, y + j, T_COVER); };
  const { cx, cy } = r;
  switch (randInt(0, 6)) {
    case 0: block(cx - 5, cy - 3, 2, 2); block(cx + 4, cy - 3, 2, 2); block(cx - 5, cy + 2, 2, 2); block(cx + 4, cy + 2, 2, 2); break;
    case 1: block(cx - 3, cy - 3, 7, 1); block(cx - 3, cy + 3, 7, 1); break;
    case 2: block(cx - 1, cy - 1, 3, 3); break;
    case 3: block(cx - 4, cy - 3, 2, 2); block(cx + 3, cy + 2, 2, 2); break;
    case 4: for (const [dx, dy] of [[-4, -3], [0, -3], [4, -3], [-4, 3], [0, 3], [4, 3]]) block(cx + dx, cy + dy, 1, 1); break;
    case 5: block(cx - 4, cy - 2, 1, 5); block(cx + 4, cy - 2, 1, 5); break;
    default: break;
  }
}
// 부서지는 상자: 주변 8칸이 모두 바닥인 자리에만 (길을 막지 않도록), 문 앞·방 중앙 제외
function placeCrates(map, r, n) {
  for (let k = 0, tries = 0; k < n && tries < 80; tries++) {
    const tx = randInt(r.x0 + 1, r.x0 + r.w - 2), ty = randInt(r.y0 + 1, r.y0 + r.h - 2);
    if (Math.abs(tx - r.cx) <= 2 && Math.abs(ty - r.cy) <= 2) continue;
    if (r.doors.some((d) => Math.abs(d.x - tx) + Math.abs(d.y - ty) <= 3)) continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (map.get(tx + dx, ty + dy) !== T_FLOOR) { ok = false; break; }
    if (!ok) continue;
    map.set(tx, ty, T_CRATE); k++;
  }
}

// ── 로비 맵 (고정 레이아웃)
function buildLobby() {
  const map = new DungeonMap(34, 40, LOBBY_PALETTE); // 아래쪽(20줄부터)은 탐험가 길드
  const room = { type: 'lobby', gx: 0, gy: 0, x0: 3, y0: 4, w: 28, h: 32, cx: 17, cy: 12, doors: [], state: 'cleared', visited: true, wavesLeft: 0 };
  map.carveRoom(room.x0, room.y0, room.w, room.h);
  for (let x = 3; x < 31; x++) if (x < 13 || x > 20) map.set(x, 21, T_WALL); // 로비와 길드 사이 벽 (가운데가 입구)
  for (let y = 23; y <= 34; y++) for (const x of [27, 28]) map.set(x, y, T_COVER); // 오른쪽 벽을 따라 세로로 긴 접수대
  for (const [x, y] of [[6, 26], [6, 31], [20, 26], [20, 31], [10, 34], [23, 34]]) { map.set(x, y, T_COVER); map.set(x + 1, y, T_COVER); } // 탁자 (마지막은 오른쪽 구석 마법사 자리)
  // 기둥
  for (const [x, y] of [[4, 5], [6, 16], [27, 16]]) map.set(x, y, T_WALL); // (오른쪽 위 [29,5] 기둥 자리는 지하 무기고 계단)
  map.rooms.push(room);
  map.startRoom = room;
  map.decorate = (g) => {
    // 카펫
    g.fillStyle = '#5a2a2a'; g.fillRect(12 * TILE, 10 * TILE, 10 * TILE, 7 * TILE);
    g.fillStyle = '#7a3a34'; g.fillRect(12 * TILE + 3, 10 * TILE + 3, 10 * TILE - 6, 7 * TILE - 6);
    g.fillStyle = '#c89a40';
    g.fillRect(12 * TILE + 6, 10 * TILE + 6, 10 * TILE - 12, 1); g.fillRect(12 * TILE + 6, 17 * TILE - 7, 10 * TILE - 12, 1);
    // 캐릭터 단상 바닥 띠
    g.fillStyle = 'rgba(255,220,150,0.06)'; g.fillRect(5 * TILE, 4 * TILE, 24 * TILE, 5 * TILE);
    // 탐험가 길드: 따뜻한 나무 바닥 + 가운데 긴 카펫
    g.fillStyle = 'rgba(120,70,30,0.35)'; g.fillRect(3 * TILE, 22 * TILE, 28 * TILE, 14 * TILE);
    for (let y = 22; y < 36; y++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(3 * TILE, y * TILE + 15, 28 * TILE, 1); }
    g.fillStyle = '#2a4a5a'; g.fillRect(14 * TILE, 22 * TILE, 6 * TILE, 6 * TILE); g.fillRect(14 * TILE, 26 * TILE, 13 * TILE, 4 * TILE); // 입구에서 접수대로 이어지는 카펫
    g.fillStyle = '#34606e'; g.fillRect(14 * TILE + 3, 22 * TILE, 6 * TILE - 6, 6 * TILE); g.fillRect(14 * TILE + 3, 26 * TILE + 3, 13 * TILE - 3, 4 * TILE - 6);
    g.fillStyle = '#c89a40'; g.fillRect(14 * TILE + 5, 22 * TILE, 1, 4 * TILE + 5); g.fillRect(20 * TILE - 6, 22 * TILE, 1, 4 * TILE + 5);
  };
  return map;
}


// ── 지하 무기고 (로비 오른쪽 위 계단): 도감의 모든 무기를 종류별·등급순으로 하나씩 진열
const VAULT_COLS = 16;
function vaultLayout() { // 진열 위치 (타일 좌표) — 맵과 소품 배치가 같이 씀
  const secs = []; let y = 11;
  WEAPON_TABS.forEach((T, ti) => {
    const list = tabWeapons(ti), rows = Math.ceil(list.length / VAULT_COLS);
    secs.push({ ti, name: T.name, y, rows, items: list.map((d, i) => ({ d, tx: 5 + (i % VAULT_COLS) * 2, ty: y + 2 + Math.floor(i / VAULT_COLS) * 3 })) });
    y += 2 + rows * 3 + 1;
  });
  return { secs, h: y + 2 };
}
function buildVault() {
  const L = vaultLayout(), H = L.h + 2;
  const map = new DungeonMap(42, H, VAULT_PALETTE);
  const room = { type: 'lobby', gx: 0, gy: 0, x0: 2, y0: 2, w: 38, h: H - 4, cx: 20, cy: 6, doors: [], state: 'cleared', visited: true, wavesLeft: 0 };
  map.carveRoom(room.x0, room.y0, room.w, room.h);
  for (const [x, y] of [[3, 3], [38, 3], [3, H - 4], [38, H - 4]]) map.set(x, y, T_WALL); // 모서리 기둥
  map.rooms.push(room); map.startRoom = room;
  map.decorate = (g) => {
    // 입구 홀 카펫
    g.fillStyle = '#3a2440'; g.fillRect(8 * TILE, 3 * TILE, 26 * TILE, 6 * TILE);
    g.fillStyle = '#4a2e52'; g.fillRect(8 * TILE + 3, 3 * TILE + 3, 26 * TILE - 6, 6 * TILE - 6);
    g.fillStyle = '#c89a40'; g.fillRect(8 * TILE + 5, 3 * TILE + 5, 26 * TILE - 10, 1); g.fillRect(8 * TILE + 5, 9 * TILE - 6, 26 * TILE - 10, 1);
    for (const S of L.secs) {
      // 구역 머리 띠 + 진열 줄마다 받침 단
      g.fillStyle = 'rgba(200,154,64,0.18)'; g.fillRect(4 * TILE, S.y * TILE + 2, 34 * TILE, TILE - 4);
      g.fillStyle = '#c89a40'; g.fillRect(4 * TILE, S.y * TILE + 2, 34 * TILE, 1); g.fillRect(4 * TILE, (S.y + 1) * TILE - 3, 34 * TILE, 1);
      for (let r = 0; r < S.rows; r++) { const ry = (S.y + 2 + r * 3) * TILE;
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(4 * TILE, ry - 10, 34 * TILE, 26);
        g.fillStyle = 'rgba(90,70,120,0.25)'; g.fillRect(4 * TILE, ry - 10, 34 * TILE, 1); }
    }
  };
  map.vault = L;
  return map;
}
