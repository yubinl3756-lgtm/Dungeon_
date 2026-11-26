'use strict';
// ════════════════════════════════════════════
// 심층 61~69 — 70층(시원체)을 앞두고 생명의 기척이 조금씩 짙어지는 층들 · 적 16×16 · 보스 32×32
// ════════════════════════════════════════════
Object.assign(PIX, {
  // ── 61 이끼 낀 수도원
  mossmonk: { tint: '#5a7a4a', w: 16, h: 16, pal: { y: '#c8f08a', e: '#ffffff', d: '#101a0a', s: '#c8b890' }, proc: (P) => {
    P.tri(8, 2, 3, 15, 13, 15, 'a'); P.tri(8, 5, 5, 15, 11, 15, 'b'); P.ell(8, 5, 2, 2, 'd'); P.px(7, 5, 'y'); P.px(9, 5, 'y'); P.ell(5, 3, 2, 1, 'c'); P.ell(11, 10, 2, 1, 'c');
    P.line(12, 6, 12, 15, 's'); P.ell(12, 5, 1, 1, 'y'); P.px(3, 12, 'c'); P.px(14, 13, 'c');
  } },
  mossstatue: { tint: '#7a8a6a', w: 16, h: 16, pal: { y: '#a8e070', e: '#ffffff', d: '#1a2214', g: '#5a8a3a' }, proc: (P) => {
    P.rect(3, 13, 10, 3, 'b'); P.rect(5, 5, 6, 8, 'a'); P.ell(8, 3, 3, 3, 'c'); P.px(7, 3, 'd'); P.px(9, 3, 'd');
    P.ell(6, 1, 2, 1, 'g'); P.ell(10, 8, 2, 2, 'g'); P.ell(4, 12, 2, 1, 'g'); P.px(8, 10, 'y'); P.px(2, 6, 'y');
  } },
  vinepilgrim: { tint: '#4a6a3a', w: 16, h: 16, pal: { y: '#c8f08a', e: '#ffffff', d: '#0e1608', r: '#8a6a3a' }, proc: (P) => {
    P.ell(8, 4, 3, 3, 'c'); P.px(7, 4, 'd'); P.px(9, 4, 'd'); P.tri(5, 3, 8, 0, 11, 3, 'a'); P.rect(4, 7, 8, 6, 'a'); P.line(4, 8, 11, 12, 'y'); P.line(11, 8, 4, 12, 'b');
    P.rect(5, 13, 2, 3, 'b'); P.rect(9, 13, 2, 3, 'b'); P.line(13, 3, 13, 15, 'r'); P.ell(13, 2, 1, 1, 'y');
  } },
  sporebat: { tint: '#6a7a50', w: 16, h: 16, pal: { y: '#d8f0a0', e: '#ffffff', d: '#141a0a' }, proc: (P) => {
    P.tri(7, 7, 0, 3, 2, 11, 'a'); P.tri(9, 7, 16, 3, 14, 11, 'a'); P.ell(8, 8, 2, 3, 'b'); P.px(7, 7, 'y'); P.px(9, 7, 'y'); P.ell(8, 4, 3, 2, 'c');
    P.px(3, 13, 'y'); P.px(6, 15, 'y'); P.px(12, 14, 'y'); P.px(2, 6, 'y');
  } },
  // ── 62 산호 묘지
  coralskull: { tint: '#e0a090', w: 16, h: 16, pal: { y: '#ffb0c0', e: '#2a1a1a', w: '#f0e8e0', r: '#c84a5a' }, proc: (P) => {
    P.ell(8, 6, 4, 4, 'w'); P.ell(6, 6, 1, 1, 'e'); P.ell(10, 6, 1, 1, 'e'); P.rect(6, 9, 5, 2, 'w'); P.px(7, 10, 'e'); P.px(9, 10, 'e');
    P.line(4, 3, 2, 0, 'r'); P.line(3, 2, 1, 2, 'r'); P.line(12, 4, 14, 1, 'a'); P.line(13, 2, 15, 3, 'a'); P.rect(5, 11, 6, 4, 'c'); P.line(5, 15, 3, 16, 'b'); P.line(10, 15, 12, 16, 'b');
  } },
  anemoneturret: { tint: '#c86a8a', w: 16, h: 16, pal: { y: '#ffb0c0', e: '#ffffff', d: '#2a0e1a' }, proc: (P) => {
    P.ell(8, 13, 6, 3, 'b'); P.rect(5, 8, 6, 5, 'a'); for (let i = 0; i < 7; i++) { const x = 3 + i * 1.7; P.line(8, 8, x, 1 + (i % 2) * 2, i % 2 ? 'c' : 'y'); } P.ell(8, 8, 2, 1, 'd');
  } },
  coraleel: { tint: '#6a8a9a', w: 16, h: 16, pal: { y: '#ff9a8a', e: '#ffffff', d: '#0e1a20' }, proc: (P) => {
    P.ell(4, 8, 3, 2, 'a'); P.px(3, 7, 'y'); P.line(6, 8, 10, 6, 'a'); P.line(6, 9, 10, 7, 'a'); P.line(10, 6, 14, 9, 'a'); P.line(10, 7, 14, 10, 'a'); P.line(14, 9, 16, 13, 'b');
    P.px(7, 6, 'y'); P.px(11, 5, 'y'); P.px(13, 7, 'y'); P.line(1, 9, 2, 10, 'c');
  } },
  jellysoul: { tint: '#b8d0f0', w: 16, h: 16, pal: { y: '#ffffff', e: '#1a2a3a', w: '#e8f4ff' }, proc: (P) => {
    P.ell(8, 6, 5, 4, 'a'); P.ell(8, 5, 3, 2, 'w'); P.px(7, 6, 'e'); P.px(9, 6, 'e'); for (const x of [4, 6, 8, 10, 12]) P.line(x, 9, x + ((x % 4) - 1), 15, 'c'); P.px(3, 2, 'y');
  } },
  // ── 63 고치의 회랑
  silkworm: { tint: '#e8dcc0', w: 16, h: 16, pal: { y: '#fff0d0', e: '#2a2010', d: '#3a3020' }, proc: (P) => {
    for (let i = 0; i < 5; i++) P.ell(3 + i * 2.6, 11 - (i === 4 ? 2 : 0), 2.2, 2.2, i % 2 ? 'a' : 'c'); P.ell(14, 8, 2, 2, 'a'); P.px(14, 7, 'e'); P.line(14, 6, 13, 4, 'd');
    P.line(15, 9, 16, 2, 'y'); P.line(16, 2, 12, 0, 'y');
  } },
  mothknight: { tint: '#8a7a5a', w: 16, h: 16, pal: { y: '#f0e0c0', e: '#ff7a5a', d: '#1a140a' }, proc: (P) => {
    P.tri(7, 6, 0, 2, 2, 12, 'c'); P.tri(9, 6, 16, 2, 14, 12, 'c'); P.ell(3, 6, 1, 1, 'y'); P.ell(13, 6, 1, 1, 'y'); P.rect(6, 4, 4, 8, 'a'); P.ell(8, 3, 2, 2, 'b');
    P.px(7, 3, 'e'); P.px(9, 3, 'e'); P.line(7, 1, 5, -1, 'b'); P.line(9, 1, 11, -1, 'b'); P.line(8, 12, 8, 16, 'y'); P.rect(5, 12, 2, 3, 'b'); P.rect(9, 12, 2, 3, 'b');
  } },
  cocoonturret: { tint: '#d8c8a8', w: 16, h: 16, pal: { y: '#fff0d0', e: '#ffffff', d: '#4a3a2a' }, proc: (P) => {
    P.line(8, 0, 8, 2, 'd'); P.ell(8, 8, 4, 6, 'a'); for (const y of [4, 7, 10, 13]) P.line(4, y, 12, y - 1, 'c'); P.ell(8, 8, 1, 2, 'd'); P.px(8, 7, 'y'); P.px(2, 9, 'y'); P.px(14, 6, 'y');
  } },
  dustmoth: { tint: '#c8b080', w: 16, h: 16, pal: { y: '#ffe9b0', e: '#2a1a0a', r: '#a07040' }, proc: (P) => {
    P.ell(4, 6, 4, 4, 'a'); P.ell(12, 6, 4, 4, 'a'); P.ell(4, 6, 2, 2, 'r'); P.ell(12, 6, 2, 2, 'r'); P.ell(5, 12, 2, 2, 'c'); P.ell(11, 12, 2, 2, 'c'); P.ell(8, 8, 1, 4, 'b');
    P.px(7, 4, 'e'); P.px(9, 4, 'e'); P.px(2, 15, 'y'); P.px(14, 15, 'y'); P.px(8, 15, 'y');
  } },
  // ── 64 맥박 치는 광산
  veingolem: { tint: '#6a5058', w: 16, h: 16, pal: { y: '#ff6a7a', e: '#ffffff', d: '#140a0e' }, proc: (P) => {
    P.rect(4, 4, 8, 8, 'a'); P.rect(5, 1, 6, 3, 'c'); P.px(7, 2, 'y'); P.px(9, 2, 'y'); P.line(5, 5, 8, 8, 'y'); P.line(8, 8, 11, 6, 'y'); P.line(8, 8, 7, 11, 'y');
    P.rect(0, 5, 4, 5, 'b'); P.rect(12, 5, 4, 5, 'b'); P.rect(5, 12, 2, 4, 'b'); P.rect(9, 12, 2, 4, 'b');
  } },
  orespider: { tint: '#a04a5a', w: 16, h: 16, pal: { y: '#ff8a9a', e: '#ffffff', d: '#1a080c', m: '#6a6a72' }, proc: (P) => {
    P.ell(8, 8, 4, 3, 'm'); P.ell(8, 7, 2, 2, 'a'); P.px(7, 10, 'y'); P.px(9, 10, 'y'); P.px(8, 6, 'y');
    for (const [x0, y0, x1, y1] of [[4, 7, 0, 3], [4, 8, 0, 11], [5, 10, 2, 15], [12, 7, 16, 3], [12, 8, 16, 11], [11, 10, 14, 15]]) P.line(x0, y0, x1, y1, 'b');
  } },
  pulsecrystal: { tint: '#ff6a7a', w: 16, h: 16, pal: { y: '#ffffff', e: '#ffd0d8', d: '#3a1a20' }, proc: (P) => {
    P.rect(3, 13, 10, 3, 'd'); P.tri(8, 0, 4, 13, 12, 13, 'a'); P.tri(8, 3, 6, 13, 10, 13, 'c'); P.line(8, 2, 8, 12, 'e'); P.ell(8, 9, 1, 1, 'y'); P.tri(3, 13, 2, 7, 5, 13, 'b'); P.tri(13, 13, 14, 8, 11, 13, 'b');
  } },
  pulseminer: { tint: '#8a8aa0', w: 16, h: 16, pal: { y: '#ffd060', e: '#ff8a9a', d: '#14141e' }, proc: (P) => {
    P.ell(8, 6, 4, 4, 'a'); P.rect(4, 2, 8, 2, 'b'); P.ell(8, 2, 1, 1, 'y'); P.px(6, 6, 'e'); P.px(10, 6, 'e'); P.tri(4, 8, 12, 8, 8, 15, 'c');
    P.line(12, 9, 15, 6, 'b'); P.tri(15, 5, 16, 3, 13, 4, 'd'); P.px(2, 12, 'e');
  } },
  // ── 65 씨앗 저장고
  grainscarecrow: { tint: '#c8a060', w: 16, h: 16, pal: { y: '#ffd070', e: '#2a1a0a', r: '#8a3a2a', s: '#6a4a2a' }, proc: (P) => {
    P.line(8, 5, 8, 16, 's'); P.line(1, 7, 15, 7, 's'); P.ell(8, 4, 3, 3, 'a'); P.px(7, 4, 'e'); P.px(9, 4, 'e'); P.tri(4, 2, 12, 2, 8, -1, 'r');
    P.rect(5, 7, 6, 5, 'r'); P.line(1, 7, 0, 9, 'y'); P.line(15, 7, 16, 9, 'y'); P.px(6, 13, 'y'); P.px(10, 13, 'y');
  } },
  seedturret: { tint: '#8a6a3a', w: 16, h: 16, pal: { y: '#ffd070', e: '#ffffff', d: '#2a1a0a' }, proc: (P) => {
    P.rect(3, 6, 10, 10, 'a'); P.rect(4, 7, 8, 8, 'c'); P.rect(3, 4, 10, 2, 'b'); for (const [x, y] of [[6, 9], [9, 10], [7, 12], [10, 13]]) P.ell(x, y, 1, 1, 'y'); P.rect(7, 1, 2, 3, 'b');
  } },
  vaultrat: { tint: '#7a6a5a', w: 16, h: 16, pal: { y: '#ffd070', e: '#ff5a3a', w: '#e8dcc0' }, proc: (P) => {
    P.ell(9, 10, 5, 3, 'a'); P.ell(4, 9, 3, 2, 'c'); P.px(3, 8, 'e'); P.ell(5, 6, 1, 1, 'c'); P.line(14, 10, 16, 6, 'b'); P.ell(1, 10, 1, 1, 'y'); P.px(0, 9, 'w');
    P.rect(6, 12, 2, 2, 'b'); P.rect(11, 12, 2, 2, 'b');
  } },
  harvestspirit: { tint: '#e0c070', w: 16, h: 16, pal: { y: '#fff0a0', e: '#ffffff', d: '#3a2a08', g: '#8aa040' }, proc: (P) => {
    P.ell(8, 7, 4, 5, 'a'); P.ell(8, 6, 2, 3, 'y'); P.px(7, 6, 'd'); P.px(9, 6, 'd'); P.line(8, 1, 8, 3, 'g'); P.tri(8, 2, 5, 0, 7, 3, 'g'); P.tri(8, 2, 11, 0, 9, 3, 'g');
    P.tri(5, 11, 11, 11, 8, 16, 'c'); P.px(2, 4, 'e'); P.px(14, 8, 'y');
  } },
  // ── 66 버섯 등불 늪
  lanternshroom: { tint: '#c86a4a', w: 16, h: 16, pal: { y: '#c8ff8a', e: '#ffffff', s: '#e8dcc0' }, proc: (P) => {
    P.ell(8, 6, 7, 4, 'a'); P.rect(1, 6, 15, 3, '.'); P.ell(5, 4, 1, 1, 'y'); P.ell(10, 3, 1, 1, 'y'); P.ell(12, 5, 1, 1, 'y'); P.rect(6, 6, 4, 9, 's'); P.ell(8, 10, 1, 2, 'y'); P.rect(4, 15, 8, 1, 'b');
  } },
  swamptoad: { tint: '#5a7a4a', w: 16, h: 16, pal: { y: '#ffe060', e: '#1a1a0a', r: '#c8ff8a' }, proc: (P) => {
    P.ell(8, 10, 6, 4, 'a'); P.ell(8, 11, 4, 2, 'c'); P.ell(5, 6, 2, 2, 'a'); P.ell(11, 6, 2, 2, 'a'); P.px(5, 6, 'y'); P.px(11, 6, 'y'); P.px(5, 5, 'e'); P.px(11, 5, 'e');
    P.line(4, 9, 12, 9, 'e'); P.ell(2, 13, 2, 1, 'b'); P.ell(14, 13, 2, 1, 'b'); P.px(9, 7, 'r');
  } },
  sporewisp: { tint: '#a8d080', w: 16, h: 16, pal: { y: '#d8ffa0', e: '#1a2a0a', w: '#ffffff' }, proc: (P) => {
    P.ell(8, 8, 4, 4, 'a'); P.ell(8, 7, 2, 2, 'c'); P.px(7, 8, 'e'); P.px(9, 8, 'e'); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.ell(8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, 1, 1, i % 2 ? 'y' : 'w'); }
  } },
  mudshaman: { tint: '#6a5a40', w: 16, h: 16, pal: { y: '#a8e070', e: '#ffffff', d: '#140e06', r: '#c86a4a' }, proc: (P) => {
    P.tri(8, 3, 2, 15, 14, 15, 'a'); P.tri(8, 6, 5, 15, 11, 15, 'b'); P.ell(8, 5, 3, 3, 'c'); P.px(7, 5, 'd'); P.px(9, 5, 'd'); P.ell(8, 2, 4, 1, 'r'); P.ell(6, 1, 1, 1, 'y');
    P.line(13, 6, 13, 15, 'b'); P.ell(13, 5, 2, 2, 'y'); P.px(2, 11, 'y');
  } },
  // ── 67 나이테 탑
  barksoldier: { tint: '#6a5038', w: 16, h: 16, pal: { y: '#e0b070', e: '#c8ff8a', d: '#140e08', g: '#5a8a3a' }, proc: (P) => {
    P.rect(5, 2, 6, 5, 'c'); P.rect(6, 4, 4, 1, 'd'); P.px(7, 4, 'e'); P.px(9, 4, 'e'); P.ell(8, 1, 3, 1, 'g'); P.rect(4, 7, 8, 6, 'a'); P.line(5, 8, 5, 12, 'b'); P.line(8, 8, 8, 12, 'b'); P.line(11, 8, 11, 12, 'b');
    P.rect(5, 13, 2, 3, 'b'); P.rect(9, 13, 2, 3, 'b'); P.rect(0, 6, 4, 7, 'b'); P.ell(2, 9, 1, 1, 'y');
  } },
  resinwisp: { tint: '#e0a040', w: 16, h: 16, pal: { y: '#ffd070', e: '#3a2008', w: '#fff4d0' }, proc: (P) => {
    P.ell(8, 10, 4, 4, 'a'); P.tri(4, 9, 12, 9, 8, 1, 'a'); P.ell(8, 9, 2, 3, 'y'); P.px(7, 10, 'e'); P.px(9, 10, 'e'); P.px(6, 7, 'w'); P.ell(3, 14, 1, 1, 'c'); P.px(13, 4, 'c');
  } },
  ringturret: { tint: '#a0784a', w: 16, h: 16, pal: { y: '#e0b070', e: '#ffffff', d: '#3a2814' }, proc: (P) => {
    P.ell(8, 9, 7, 6, 'a'); P.ell(8, 9, 5, 4, 'c'); P.ell(8, 9, 3, 2.5, 'a'); P.ell(8, 9, 1, 1, 'd'); P.px(8, 9, 'y'); P.line(1, 4, 3, 6, 'b'); P.line(15, 4, 13, 6, 'b');
  } },
  woodpeckerknight: { tint: '#3a3a4a', w: 16, h: 16, pal: { y: '#e0b070', e: '#ffffff', r: '#c83a3a', w: '#e8e8f0' }, proc: (P) => {
    P.ell(7, 5, 3, 3, 'a'); P.tri(4, 2, 7, 0, 9, 3, 'r'); P.px(6, 4, 'e'); P.tri(9, 5, 16, 6, 9, 7, 'y'); P.ell(7, 10, 3, 4, 'w'); P.tri(4, 8, 0, 14, 5, 13, 'a'); P.tri(10, 8, 14, 14, 9, 13, 'a');
    P.line(6, 14, 5, 16, 'y'); P.line(8, 14, 9, 16, 'y');
  } },
  // ── 68 알 껍데기 사막
  shellcrab: { tint: '#d8c8a8', w: 16, h: 16, pal: { y: '#fff0d0', e: '#2a2010', r: '#c86a4a' }, proc: (P) => {
    P.ell(8, 9, 6, 4, 'a'); P.tri(3, 7, 13, 7, 8, 2, 'c'); P.line(4, 6, 6, 3, 'b'); P.line(10, 3, 12, 6, 'b'); P.px(6, 9, 'e'); P.px(10, 9, 'e');
    P.ell(1, 6, 2, 2, 'r'); P.ell(15, 6, 2, 2, 'r'); P.line(3, 12, 1, 15, 'b'); P.line(13, 12, 15, 15, 'b'); P.line(6, 13, 5, 15, 'b'); P.line(10, 13, 11, 15, 'b');
  } },
  sandlizard: { tint: '#c8a060', w: 16, h: 16, pal: { y: '#fff0d0', e: '#1a1006', d: '#6a4a2a' }, proc: (P) => {
    P.ell(8, 9, 5, 2, 'a'); P.ell(2, 8, 2, 2, 'c'); P.px(1, 7, 'e'); P.line(13, 9, 16, 13, 'a'); for (const x of [5, 8, 11]) P.px(x, 8, 'd');
    P.line(5, 11, 3, 14, 'b'); P.line(11, 11, 13, 14, 'b'); P.line(6, 7, 4, 4, 'b'); P.line(10, 7, 12, 4, 'b');
  } },
  brokeneggturret: { tint: '#e8dcc0', w: 16, h: 16, pal: { y: '#fff0d0', e: '#ffffff', d: '#3a3020' }, proc: (P) => {
    P.ell(8, 10, 5, 6, 'a'); P.rect(2, 2, 13, 5, '.'); for (let x = 3; x <= 13; x += 2) P.tri(x, 6, x + 1, 3, x + 2, 6, 'a'); P.ell(8, 9, 3, 3, 'd'); P.ell(8, 9, 1, 1, 'y'); P.px(3, 12, 'c'); P.px(12, 13, 'c');
  } },
  vultureghost: { tint: '#8a7a6a', w: 16, h: 16, pal: { y: '#fff0d0', e: '#ff7a5a', w: '#e8dcc0' }, proc: (P) => {
    P.tri(8, 6, 0, 4, 3, 11, 'a'); P.tri(8, 6, 16, 4, 13, 11, 'a'); P.ell(8, 8, 2, 3, 'b'); P.ell(8, 4, 2, 2, 'w'); P.px(7, 4, 'e'); P.tri(9, 4, 11, 5, 9, 6, 'y'); P.ell(8, 6, 3, 1, 'w');
    P.px(6, 13, 'c'); P.px(10, 14, 'c');
  } },
  // ── 69 숨 쉬는 동굴
  breathwisp: { tint: '#e0b0c0', w: 16, h: 16, pal: { y: '#ffd0e0', e: '#3a1a24', w: '#ffffff' }, proc: (P) => {
    P.ell(8, 8, 4, 4, 'a'); P.ell(8, 8, 6, 6, '.'); P.ell(8, 8, 3, 3, 'c'); P.px(7, 7, 'e'); P.px(9, 7, 'e'); P.line(2, 3, 5, 5, 'y'); P.line(14, 3, 11, 5, 'y'); P.line(2, 13, 5, 11, 'y'); P.line(14, 13, 11, 11, 'y'); P.px(8, 1, 'w');
  } },
  sporesac: { tint: '#a06a7a', w: 16, h: 16, pal: { y: '#ffb0c0', e: '#ffffff', d: '#2a0e18' }, proc: (P) => {
    P.rect(3, 13, 10, 3, 'b'); P.ell(8, 8, 5, 6, 'a'); P.ell(8, 7, 3, 4, 'c'); P.line(5, 4, 6, 12, 'b'); P.line(11, 4, 10, 12, 'b'); P.ell(8, 2, 1, 1, 'y'); P.px(3, 6, 'y'); P.px(13, 9, 'y');
  } },
  heartstonegolem: { tint: '#7a4a54', w: 16, h: 16, pal: { y: '#ffb0c0', e: '#ffffff', d: '#140a0e', r: '#ff5a7a' }, proc: (P) => {
    P.rect(4, 4, 8, 8, 'a'); P.ell(8, 8, 2, 2, 'r'); P.px(8, 7, 'y'); P.rect(5, 1, 6, 3, 'c'); P.px(7, 2, 'y'); P.px(9, 2, 'y');
    P.rect(0, 5, 4, 5, 'b'); P.rect(12, 5, 4, 5, 'b'); P.rect(5, 12, 2, 4, 'b'); P.rect(9, 12, 2, 4, 'b'); P.line(6, 5, 7, 7, 'r'); P.line(10, 5, 9, 7, 'r');
  } },
  caveserpent: { tint: '#5a4a50', w: 16, h: 16, pal: { y: '#ffb0c0', e: '#ffe060', d: '#140e10' }, proc: (P) => {
    P.ell(4, 5, 3, 2, 'a'); P.px(3, 4, 'e'); P.line(1, 6, 0, 7, 'y'); P.line(6, 6, 10, 9, 'a'); P.line(6, 7, 10, 10, 'a'); P.line(10, 9, 6, 13, 'a'); P.line(10, 10, 6, 14, 'a'); P.line(6, 13, 12, 15, 'b');
    P.px(8, 8, 'c'); P.px(8, 12, 'c');
  } },

  // ════════ 보스 (32×32) ════════
  boss_mossabbot: { tint: '#465a3a', w: 32, h: 32, pal: { s: '#c8b890', d: '#0e140a', y: '#c8f08a', e: '#ffffff', g: '#5a8a3a', r: '#8a6a3a' }, proc: (P) => {
    P.tri(16, 10, 5, 31, 27, 31, 'a'); P.tri(16, 13, 9, 31, 23, 31, 'b'); P.ell(16, 9, 4, 4, 's'); P.rect(12, 8, 8, 2, 'd'); P.px(14, 8, 'y'); P.px(18, 8, 'y'); P.tri(11, 7, 16, 1, 21, 7, 'a');
    for (const [x, y, r] of [[10, 18, 3], [22, 22, 3], [14, 27, 2], [19, 14, 2], [12, 4, 2]]) P.ell(x, y, r, r * 0.7, 'g');
    P.line(26, 12, 26, 31, 'r'); P.ell(26, 10, 2, 2, 'y'); P.rect(13, 16, 6, 6, 'c'); P.line(16, 16, 16, 21, 'r'); P.px(3, 28, 'y'); P.px(29, 26, 'y');
  } },
  boss_coralwarden: { tint: '#3e4e5e', w: 32, h: 32, pal: { s: '#f0e8e0', d: '#0e141a', y: '#ff9a8a', e: '#ffffff', r: '#c84a5a', w: '#c8e8ff' }, proc: (P) => {
    P.ell(16, 20, 12, 8, 'a'); P.ell(16, 18, 9, 5, 'c'); P.px(12, 17, 'e'); P.px(20, 17, 'e'); P.rect(12, 22, 8, 2, 'd');
    P.ell(3, 15, 3, 3, 'b'); P.tri(0, 12, 4, 10, 2, 16, 's'); P.ell(29, 15, 3, 3, 'b'); P.tri(32, 12, 28, 10, 30, 16, 's'); P.line(5, 17, 8, 19, 'a'); P.line(27, 17, 24, 19, 'a');
    for (const [x0, h] of [[10, 9], [14, 12], [18, 10], [22, 8]]) { P.line(x0, 12, x0 - 1, 12 - h, 'y'); P.line(x0 - 1, 12 - h + 3, x0 - 3, 12 - h + 1, 'r'); P.line(x0 - 1, 12 - h + 5, x0 + 2, 12 - h + 3, 'y'); }
    for (const x of [8, 12, 20, 24]) P.line(x, 27, x - 2, 31, 'b'); P.px(2, 4, 'w'); P.px(29, 3, 'w');
  } },
  boss_chrysalis: { tint: '#54483a', w: 32, h: 32, pal: { s: '#f0e0c0', d: '#1a140a', y: '#fff0d0', e: '#ff7a5a', g: '#a08a5a' }, proc: (P) => {
    P.line(16, 0, 16, 3, 'g'); P.ell(16, 17, 9, 14, 'a'); P.ell(16, 16, 6, 11, 's'); for (let y = 7; y <= 27; y += 4) P.line(9, y, 23, y - 1, 'g');
    P.ell(16, 11, 3, 2, 'd'); P.px(15, 11, 'e'); P.px(17, 11, 'e'); P.tri(7, 14, 0, 6, 2, 22, 'c'); P.tri(25, 14, 32, 6, 30, 22, 'c'); P.ell(3, 13, 1, 2, 'y'); P.ell(29, 13, 1, 2, 'y');
    P.line(12, 19, 16, 23, 'y'); P.line(20, 19, 16, 23, 'y'); P.px(2, 28, 'y'); P.px(29, 28, 'y');
  } },
  boss_pulsevein: { tint: '#4e4048', w: 32, h: 32, pal: { s: '#c08a98', d: '#120a0e', y: '#ff6a7a', e: '#ffffff', m: '#6a6a72' }, proc: (P) => {
    P.ell(16, 22, 13, 9, 'm'); P.ell(16, 20, 10, 7, 'a'); P.ell(16, 18, 5, 5, 'y'); P.ell(16, 18, 3, 3, 's'); P.px(15, 17, 'e');
    for (const [x1, y1] of [[2, 6], [8, 2], [24, 2], [30, 8], [1, 28], [31, 26]]) P.line(16, 18, x1, y1, 'y');
    P.tri(6, 14, 3, 4, 10, 12, 'c'); P.tri(26, 14, 29, 4, 22, 12, 'c'); P.tri(12, 10, 14, 1, 17, 10, 'c'); P.rect(6, 28, 20, 3, 'b');
  } },
  boss_vaultreaper: { tint: '#5e4c32', w: 32, h: 32, pal: { s: '#e8dcc0', d: '#120c06', y: '#ffd070', e: '#ffffff', m: '#a0a0a8', g: '#8aa040' }, proc: (P) => {
    P.tri(16, 9, 5, 31, 27, 31, 'a'); P.tri(16, 12, 10, 31, 22, 31, 'b'); P.ell(16, 9, 4, 4, 'd'); P.px(14, 9, 'y'); P.px(18, 9, 'y'); P.tri(10, 7, 16, 0, 22, 7, 'a');
    P.line(25, 31, 27, 2, 's'); P.tri(27, 2, 14, 4, 26, 7, 'm'); P.line(15, 5, 26, 6, 'e');
    for (const [x, y] of [[8, 20], [11, 25], [21, 22], [7, 28]]) { P.ell(x, y, 1, 1.5, 'y'); P.line(x, y - 2, x, y - 4, 'g'); } P.rect(12, 16, 8, 2, 'y');
  } },
  boss_sporelord: { tint: '#3e4834', w: 32, h: 32, pal: { s: '#e8dcc0', d: '#0e1208', y: '#c8ff8a', e: '#ffffff', r: '#c86a4a' }, proc: (P) => {
    P.ell(16, 11, 15, 9, 'r'); P.rect(1, 11, 31, 9, '.'); for (const [x, y, r] of [[8, 6, 2], [16, 4, 2.5], [24, 7, 2], [12, 9, 1.5], [21, 3, 1.5]]) P.ell(x, y, r, r, 'y');
    P.rect(11, 11, 10, 17, 's'); P.ell(13, 15, 1, 1, 'd'); P.ell(19, 15, 1, 1, 'd'); P.line(14, 19, 18, 19, 'd'); P.rect(7, 28, 18, 3, 'a');
    P.ell(5, 24, 3, 2, 'a'); P.ell(27, 25, 3, 2, 'a'); for (const [x, y] of [[3, 16], [29, 15], [6, 30], [26, 30]]) P.px(x, y, 'y');
  } },
  boss_ringguardian: { tint: '#5a4430', w: 32, h: 32, pal: { s: '#c89a6a', d: '#120c06', y: '#e0b070', e: '#c8ff8a', g: '#5a8a3a' }, proc: (P) => {
    P.rect(8, 9, 16, 15, 'a'); P.ell(16, 16, 6, 6, 's'); P.ell(16, 16, 4, 4, 'a'); P.ell(16, 16, 2, 2, 's'); P.px(16, 16, 'y');
    P.rect(11, 1, 10, 8, 'b'); P.rect(13, 4, 2, 2, 'e'); P.rect(17, 4, 2, 2, 'e'); P.ell(16, 0, 6, 2, 'g'); P.ell(10, 2, 3, 2, 'g'); P.ell(22, 2, 3, 2, 'g');
    P.rect(2, 10, 6, 13, 'b'); P.rect(24, 10, 6, 13, 'b'); P.rect(10, 24, 5, 8, 'b'); P.rect(17, 24, 5, 8, 'b'); P.line(4, 12, 4, 21, 'y'); P.line(27, 12, 27, 21, 'y');
  } },
  boss_unhatched: { tint: '#6e6452', w: 32, h: 32, pal: { s: '#fff0d0', d: '#1a1408', y: '#ffffff', e: '#ff7a5a', g: '#c0b49c' }, proc: (P) => {
    P.ell(16, 17, 12, 14, 'c'); P.ell(16, 16, 10, 12, 's'); P.line(10, 8, 14, 13, 'd'); P.line(14, 13, 12, 18, 'd'); P.line(14, 13, 19, 15, 'd'); P.line(19, 15, 22, 11, 'd'); P.line(19, 15, 20, 21, 'd');
    P.ell(15, 15, 2, 1.5, 'd'); P.px(15, 15, 'e'); for (const [x, y] of [[4, 28], [8, 30], [24, 30], [28, 27]]) P.tri(x, y, x + 2, y - 3, x + 4, y, 'g'); P.px(3, 4, 'y'); P.px(29, 5, 'y');
  } },
  boss_cavebreath: { tint: '#4a3840', w: 32, h: 32, pal: { s: '#ffd0e0', d: '#120a0e', y: '#ffb0c0', e: '#ffffff' }, proc: (P) => {
    P.ell(16, 16, 14, 13, 'a'); P.ell(16, 16, 11, 10, 'b'); P.ell(16, 16, 7, 6, 'd'); P.ell(16, 16, 4, 3, 'y'); P.ell(16, 16, 2, 1.5, 's');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P.line(16 + Math.cos(a) * 8, 16 + Math.sin(a) * 7, 16 + Math.cos(a) * 13, 16 + Math.sin(a) * 12, 'c'); }
    P.tri(10, 4, 12, 0, 14, 4, 'c'); P.tri(18, 4, 20, 0, 22, 4, 'c'); P.tri(10, 28, 12, 32, 14, 28, 'c'); P.tri(18, 28, 20, 32, 22, 28, 'c'); P.px(2, 2, 'y'); P.px(29, 29, 'y');
  } }
});
