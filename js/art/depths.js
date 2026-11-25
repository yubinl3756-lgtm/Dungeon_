'use strict';
// ════════════════════════════════════════════
// 심층 51~60 — 적 16×16 · 보스 32×32 (도형으로 그린 뒤 자동 외곽선)
//  a/b/c = 적 색 주색/어두운/밝은 (def.color)
// ════════════════════════════════════════════
Object.assign(PIX, {
  // ── 51 유리 사막
  glassscorpion: { tint: '#9ad0d8', w: 16, h: 16, pal: { y: '#ffffff', e: '#ff7a5a', d: '#1a2a2e' }, proc: (P) => {
    P.ell(8, 11, 4, 3, 'a'); P.ell(8, 10, 2, 1, 'y'); P.px(7, 12, 'e'); P.px(9, 12, 'e'); P.tri(2, 11, 0, 8, 4, 10, 'c'); P.tri(14, 11, 16, 8, 12, 10, 'c');
    P.line(8, 8, 9, 4, 'a'); P.line(9, 4, 12, 2, 'a'); P.tri(12, 1, 14, 3, 11, 3, 'y'); for (const x of [5, 7, 9, 11]) P.line(x, 13, x - 1, 15, 'b');
  } },
  miragespirit: { tint: '#e0d0a0', w: 16, h: 16, pal: { y: '#bff4ff', e: '#ffffff', d: '#3a2a10' }, proc: (P) => {
    P.ell(8, 6, 4, 4, 'a'); P.px(7, 6, 'd'); P.px(9, 6, 'd'); P.tri(4, 8, 12, 8, 8, 15, 'c'); P.line(3, 11, 6, 11, 'y'); P.line(10, 13, 13, 13, 'y'); P.line(2, 14, 5, 14, 'y'); P.px(8, 1, 'e');
  } },
  sandglassgolem: { tint: '#c8b888', w: 16, h: 16, pal: { y: '#bff4ff', e: '#ffffff', d: '#2a2210' }, proc: (P) => {
    P.rect(4, 4, 8, 8, 'a'); P.tri(5, 5, 11, 5, 8, 8, 'y'); P.tri(5, 11, 11, 11, 8, 8, 'c'); P.rect(5, 1, 6, 3, 'b'); P.px(7, 2, 'e'); P.px(9, 2, 'e');
    P.rect(1, 5, 3, 5, 'b'); P.rect(12, 5, 3, 5, 'b'); P.rect(5, 12, 2, 4, 'b'); P.rect(9, 12, 2, 4, 'b');
  } },
  prismcactus: { tint: '#6aa070', w: 16, h: 16, pal: { y: '#bff4ff', e: '#ffffff', r: '#ff8aa8', s: '#c8b888' }, proc: (P) => {
    P.rect(6, 3, 4, 11, 'a'); P.rect(7, 3, 1, 11, 'c'); P.rect(2, 6, 3, 2, 'a'); P.rect(2, 3, 2, 3, 'a'); P.rect(11, 8, 3, 2, 'a'); P.rect(12, 5, 2, 3, 'a');
    P.tri(8, 0, 6, 3, 10, 3, 'y'); P.px(3, 2, 'r'); P.px(13, 4, 'y'); P.rect(4, 14, 8, 2, 's'); P.px(9, 7, 'e');
  } },
  // ── 52 시든 꽃의 왕궁
  thornmaid: { tint: '#8a4a5a', w: 16, h: 16, pal: { y: '#ff8aa8', e: '#ffffff', d: '#1a0a10', g: '#4a6a3a' }, proc: (P) => {
    P.ell(8, 4, 3, 3, 'c'); P.px(7, 4, 'd'); P.px(9, 4, 'd'); P.ell(8, 1, 3, 1, 'y'); P.tri(8, 6, 2, 15, 14, 15, 'a'); P.rect(6, 7, 4, 4, 'e');
    P.line(2, 9, 1, 15, 'g'); P.line(14, 9, 15, 15, 'g'); P.px(1, 11, 'y'); P.px(15, 12, 'y');
  } },
  pollenmoth: { tint: '#d8c070', w: 16, h: 16, pal: { y: '#ffe9a0', e: '#2a1a0a', r: '#ff8aa8' }, proc: (P) => {
    P.ell(4, 6, 4, 4, 'a'); P.ell(12, 6, 4, 4, 'a'); P.ell(4, 11, 3, 3, 'c'); P.ell(12, 11, 3, 3, 'c'); P.ell(4, 6, 1, 1, 'r'); P.ell(12, 6, 1, 1, 'r');
    P.ell(8, 8, 1, 5, 'b'); P.px(7, 3, 'e'); P.px(9, 3, 'e'); P.line(7, 3, 5, 0, 'b'); P.line(9, 3, 11, 0, 'b'); P.px(2, 14, 'y'); P.px(14, 15, 'y');
  } },
  witheredguard: { tint: '#6a5a48', w: 16, h: 16, pal: { y: '#ff8aa8', e: '#ffffff', d: '#1a120a', m: '#a0a0a8' }, proc: (P) => {
    P.rect(5, 2, 6, 5, 'm'); P.rect(6, 4, 4, 1, 'd'); P.ell(8, 1, 2, 1, 'y'); P.rect(4, 7, 8, 6, 'a'); P.ell(8, 9, 1, 1, 'y');
    P.rect(5, 13, 2, 3, 'b'); P.rect(9, 13, 2, 3, 'b'); P.line(13, 1, 13, 15, 'm'); P.tri(13, 0, 11, 3, 15, 3, 'm');
  } },
  rosevineturret: { tint: '#4a6a3a', w: 16, h: 16, pal: { y: '#ff8aa8', e: '#ffffff', r: '#c83a5a' }, proc: (P) => {
    P.rect(3, 12, 10, 4, 'b'); P.line(5, 13, 3, 6, 'a'); P.line(11, 13, 13, 6, 'a'); P.line(8, 13, 8, 7, 'a');
    P.ell(8, 5, 4, 4, 'r'); P.ell(8, 5, 2, 2, 'y'); P.px(8, 5, 'e'); P.ell(3, 5, 2, 2, 'y'); P.ell(13, 5, 2, 2, 'y'); P.px(2, 9, 'c'); P.px(14, 9, 'c');
  } },
  // ── 53 노래하는 종유석 동굴
  echobat: { tint: '#5a6a8a', w: 16, h: 16, pal: { y: '#9ad8ff', e: '#ffffff', d: '#10141e' }, proc: (P) => {
    P.tri(7, 7, 0, 3, 2, 12, 'a'); P.tri(9, 7, 16, 3, 14, 12, 'a'); P.ell(8, 8, 2, 3, 'b'); P.tri(6, 5, 6, 2, 8, 5, 'c'); P.tri(10, 5, 10, 2, 8, 5, 'c');
    P.px(7, 7, 'y'); P.px(9, 7, 'y'); P.line(0, 13, 2, 15, 'y'); P.line(16, 13, 14, 15, 'y'); P.px(8, 13, 'y');
  } },
  stalagolem: { tint: '#8a8ea0', w: 16, h: 16, pal: { y: '#9ad8ff', e: '#ffffff', d: '#14141a' }, proc: (P) => {
    P.rect(4, 5, 8, 7, 'a'); P.tri(4, 5, 5, 0, 7, 5, 'c'); P.tri(9, 5, 11, 0, 12, 5, 'c'); P.px(6, 7, 'y'); P.px(10, 7, 'y');
    P.rect(1, 6, 3, 6, 'b'); P.rect(12, 6, 3, 6, 'b'); P.tri(1, 12, 4, 12, 2, 15, 'b'); P.tri(12, 12, 15, 12, 14, 15, 'b'); P.rect(5, 12, 6, 3, 'b');
  } },
  resonancecrystal: { tint: '#9ad8ff', w: 16, h: 16, pal: { y: '#ffffff', e: '#c8b8ff', d: '#2a3a4a' }, proc: (P) => {
    P.tri(8, 0, 4, 9, 12, 9, 'a'); P.tri(4, 9, 12, 9, 8, 15, 'b'); P.line(8, 0, 8, 14, 'y'); P.ell(8, 8, 1, 1, 'e');
    P.line(1, 5, 2, 9, 'e'); P.line(0, 7, 0, 8, 'e'); P.line(15, 5, 14, 9, 'e'); P.line(16, 7, 16, 8, 'e');
  } },
  cavebard: { tint: '#6a5a7a', w: 16, h: 16, pal: { y: '#c8b8ff', e: '#ffffff', d: '#14101a', r: '#a07040' }, proc: (P) => {
    P.tri(8, 2, 3, 15, 13, 15, 'a'); P.ell(8, 4, 2, 2, 'c'); P.px(7, 4, 'd'); P.px(9, 4, 'd'); P.tri(5, 3, 8, 0, 11, 3, 'b');
    P.ell(3, 10, 2, 3, 'r'); P.line(3, 7, 5, 3, 'r'); P.line(2, 9, 4, 11, 'y'); P.px(13, 6, 'y'); P.px(14, 4, 'y'); P.px(12, 3, 'e');
  } },
  // ── 54 고철 거인의 묘지
  scraprat: { tint: '#7a6a5a', w: 16, h: 16, pal: { y: '#ffb04a', e: '#ff5a3a', m: '#a0a0a8' }, proc: (P) => {
    P.ell(9, 10, 5, 3, 'a'); P.ell(4, 9, 3, 2, 'c'); P.px(3, 8, 'e'); P.ell(5, 6, 1, 1, 'm'); P.rect(8, 7, 4, 2, 'm'); P.px(10, 7, 'y');
    P.line(14, 10, 16, 6, 'm'); P.rect(6, 12, 2, 2, 'b'); P.rect(11, 12, 2, 2, 'b');
  } },
  rustturret: { tint: '#8a5a3a', w: 16, h: 16, pal: { y: '#ffb04a', e: '#ffffff', m: '#6a6a72' }, proc: (P) => {
    P.rect(3, 11, 10, 5, 'b'); P.ell(8, 9, 5, 3, 'a'); P.rect(6, 5, 4, 4, 'm'); P.rect(9, 6, 7, 2, 'm'); P.ell(15, 7, 1, 1, 'y');
    P.px(4, 12, 'c'); P.px(11, 13, 'c'); P.px(7, 6, 'y'); P.line(1, 4, 3, 6, 'c');
  } },
  weldghost: { tint: '#5a7a9a', w: 16, h: 16, pal: { y: '#9ae8ff', e: '#ffffff', d: '#101a24', m: '#3a3a44' }, proc: (P) => {
    P.ell(8, 6, 4, 4, 'a'); P.rect(5, 4, 6, 3, 'm'); P.rect(6, 5, 4, 1, 'y'); P.tri(4, 8, 12, 8, 8, 15, 'b');
    P.line(12, 9, 15, 7, 'm'); P.px(16, 6, 'e'); P.px(15, 5, 'y'); P.px(16, 8, 'y'); P.px(2, 12, 'y');
  } },
  boltgolem: { tint: '#6a6a72', w: 16, h: 16, pal: { y: '#ffb04a', e: '#ff5a3a', d: '#14141a' }, proc: (P) => {
    P.rect(4, 4, 8, 8, 'a'); P.rect(5, 1, 6, 3, 'c'); P.px(7, 2, 'e'); P.px(9, 2, 'e'); for (const [x, y] of [[5, 5], [10, 5], [5, 10], [10, 10]]) P.px(x, y, 'y');
    P.rect(0, 5, 4, 3, 'b'); P.rect(12, 5, 4, 3, 'b'); P.ell(1, 9, 2, 2, 'c'); P.ell(14, 9, 2, 2, 'c'); P.rect(5, 12, 2, 4, 'b'); P.rect(9, 12, 2, 4, 'b');
  } },
  // ── 55 안개 낀 등불 시장
  lanternyokai: { tint: '#c86a3a', w: 16, h: 16, pal: { y: '#ffc860', e: '#ffffff', d: '#2a0e04', r: '#ff5a3a' }, proc: (P) => {
    P.line(8, 0, 8, 2, 'b'); P.rect(4, 2, 8, 1, 'b'); P.ell(8, 8, 5, 6, 'a'); P.ell(8, 8, 3, 4, 'y'); for (const y of [5, 8, 11]) P.line(3, y, 13, y, 'b');
    P.ell(6, 7, 1, 1, 'd'); P.ell(10, 7, 1, 1, 'd'); P.rect(7, 10, 3, 2, 'r'); P.rect(4, 14, 8, 1, 'b');
  } },
  maskmerchant: { tint: '#6a4a5a', w: 16, h: 16, pal: { y: '#ffd84a', e: '#ffffff', d: '#14080e', r: '#c83a3a' }, proc: (P) => {
    P.tri(8, 4, 2, 15, 14, 15, 'a'); P.ell(8, 4, 3, 3, 'e'); P.px(7, 4, 'd'); P.px(9, 4, 'd'); P.line(6, 6, 10, 6, 'r'); P.tri(3, 3, 13, 3, 8, 0, 'b');
    P.ell(3, 10, 2, 2, 'e'); P.px(3, 10, 'r'); P.ell(13, 11, 2, 2, 'y'); P.px(13, 11, 'd');
  } },
  umbrellaghost: { tint: '#8a5aa0', w: 16, h: 16, pal: { y: '#ffc860', e: '#ffffff', d: '#14081a', r: '#ff5a7a' }, proc: (P) => {
    P.ell(8, 6, 7, 5, 'a'); P.rect(1, 6, 15, 5, '.'); P.line(8, 1, 8, 14, 'b'); P.line(1, 6, 15, 6, 'c'); P.ell(8, 4, 1, 1, 'e'); P.rect(7, 4, 3, 1, 'd');
    P.rect(7, 8, 2, 6, 'b'); P.ell(8, 9, 1, 1, 'r'); P.line(8, 14, 6, 16, 'b'); P.px(8, 0, 'y');
  } },
  fogcat: { tint: '#a0a0b8', w: 16, h: 16, pal: { y: '#ffe060', e: '#ffffff', d: '#1a1a24' }, proc: (P) => {
    P.ell(9, 10, 5, 4, 'a'); P.ell(5, 7, 3, 3, 'c'); P.tri(3, 5, 3, 2, 5, 4, 'c'); P.tri(7, 5, 7, 2, 5, 4, 'c'); P.px(4, 7, 'y'); P.px(6, 7, 'y');
    P.line(14, 9, 16, 4, 'a'); P.ell(3, 14, 2, 1, 'e'); P.ell(12, 15, 3, 1, 'e'); P.rect(6, 13, 2, 2, 'b'); P.rect(11, 13, 2, 2, 'b');
  } },
  // ── 56 불과 얼음의 경계
  lavalizard: { tint: '#c8502a', w: 16, h: 16, pal: { y: '#ffd060', e: '#ffffff', d: '#2a0a04' }, proc: (P) => {
    P.ell(8, 9, 5, 3, 'a'); P.ell(3, 8, 3, 2, 'c'); P.px(2, 7, 'y'); P.line(13, 9, 16, 12, 'a'); for (const x of [6, 9, 12]) P.px(x, 7, 'y');
    P.line(5, 11, 3, 14, 'b'); P.line(11, 11, 13, 14, 'b'); P.line(7, 11, 7, 14, 'b'); P.px(15, 11, 'y');
  } },
  frostwisp: { tint: '#a8d8ff', w: 16, h: 16, pal: { y: '#ffffff', e: '#2a3a4a', w: '#e0f8ff' }, proc: (P) => {
    P.ell(8, 8, 4, 4, 'a'); P.ell(8, 8, 2, 2, 'w'); P.px(7, 7, 'e'); P.px(9, 7, 'e'); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.line(8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, 'y'); }
  } },
  halfgolem: { tint: '#7a6a6a', w: 16, h: 16, pal: { r: '#ff7a3a', i: '#a8d8ff', e: '#ffffff', d: '#141010' }, proc: (P) => {
    P.rect(4, 4, 4, 8, 'r'); P.rect(8, 4, 4, 8, 'i'); P.rect(5, 1, 6, 3, 'a'); P.px(6, 2, 'r'); P.px(9, 2, 'i');
    P.rect(1, 5, 3, 6, 'r'); P.rect(12, 5, 3, 6, 'i'); P.rect(5, 12, 2, 4, 'b'); P.rect(9, 12, 2, 4, 'b'); P.line(8, 4, 8, 12, 'd');
  } },
  steamvent: { tint: '#6a6a6a', w: 16, h: 16, pal: { y: '#e8e8f0', e: '#ffffff', r: '#ff7a3a' }, proc: (P) => {
    P.ell(8, 13, 7, 3, 'b'); P.ell(8, 12, 4, 2, 'a'); P.ell(8, 12, 2, 1, 'r'); P.ell(8, 7, 3, 3, 'y'); P.ell(6, 3, 2, 2, 'y'); P.ell(10, 1, 2, 1, 'e'); P.px(3, 9, 'e'); P.px(13, 8, 'e');
  } },
  // ── 57 뼈피리 부족의 마을
  boneflutewarrior: { tint: '#c8b890', w: 16, h: 16, pal: { y: '#ff7a3a', e: '#ffffff', d: '#1a140a', r: '#8a3a2a' }, proc: (P) => {
    P.ell(8, 4, 3, 3, 'c'); P.px(7, 4, 'd'); P.px(9, 4, 'd'); P.tri(5, 2, 4, -1, 7, 2, 'y'); P.tri(11, 2, 12, -1, 9, 2, 'y');
    P.rect(5, 7, 6, 6, 'a'); for (const y of [8, 10, 12]) P.line(5, y, 10, y, 'b'); P.rect(5, 13, 2, 3, 'b'); P.rect(9, 13, 2, 3, 'b'); P.line(13, 3, 13, 14, 'e'); P.rect(12, 6, 3, 2, 'r');
  } },
  skullshaman: { tint: '#8a6a4a', w: 16, h: 16, pal: { y: '#e8d8a8', e: '#7affc0', d: '#140e08', r: '#c83a3a' }, proc: (P) => {
    P.tri(8, 4, 3, 15, 13, 15, 'a'); P.ell(8, 5, 3, 3, 'y'); P.px(7, 5, 'e'); P.px(9, 5, 'e'); P.rect(7, 7, 3, 1, 'd'); for (const x of [4, 6, 10, 12]) P.line(x, 3, x - 1, 0, 'r');
    P.line(13, 6, 13, 15, 'b'); P.ell(13, 5, 2, 2, 'y'); P.px(13, 5, 'd');
  } },
  drumskeleton: { tint: '#a89070', w: 16, h: 16, pal: { y: '#ffe0a0', e: '#ffffff', d: '#1a140a', w: '#e8d8b8' }, proc: (P) => {
    P.ell(8, 3, 3, 3, 'w'); P.px(7, 3, 'd'); P.px(9, 3, 'd'); P.rect(7, 6, 2, 3, 'w'); P.ell(8, 12, 6, 3, 'a'); P.rect(2, 9, 12, 3, 'c'); P.ell(8, 9, 6, 2, 'y');
    P.line(4, 7, 2, 4, 'w'); P.line(12, 7, 14, 4, 'w'); P.px(2, 3, 'e'); P.px(14, 3, 'e');
  } },
  bonewolf: { tint: '#d8ccb0', w: 16, h: 16, pal: { y: '#7affc0', e: '#ffffff', d: '#1a140a' }, proc: (P) => {
    P.ell(10, 9, 5, 3, 'b'); for (const x of [8, 10, 12]) P.line(x, 7, x, 11, 'a'); P.ell(4, 7, 3, 2, 'a'); P.tri(3, 5, 4, 2, 5, 5, 'a'); P.px(3, 7, 'y'); P.rect(0, 8, 3, 1, 'a');
    P.line(7, 11, 6, 15, 'a'); P.line(13, 11, 14, 15, 'a'); P.line(15, 8, 16, 5, 'a');
  } },
  // ── 58 끝없는 폭포의 협곡
  falcarp: { tint: '#e07a3a', w: 16, h: 16, pal: { y: '#ffd060', e: '#ffffff', d: '#2a0e04', w: '#c8f4ff' }, proc: (P) => {
    P.ell(7, 8, 6, 4, 'a'); P.ell(7, 9, 4, 2, 'c'); P.px(3, 7, 'd'); P.tri(12, 8, 16, 4, 16, 12, 'b'); P.tri(6, 4, 9, 1, 10, 5, 'b');
    for (const x of [5, 8, 10]) P.px(x, 7, 'y'); P.line(1, 9, 2, 10, 'y'); P.px(0, 3, 'w'); P.px(14, 14, 'w');
  } },
  spraywisp: { tint: '#9ae8ff', w: 16, h: 16, pal: { y: '#ffffff', e: '#1a3a4a', w: '#e0f8ff' }, proc: (P) => {
    P.ell(8, 9, 4, 5, 'a'); P.tri(4, 8, 12, 8, 8, 1, 'c'); P.px(7, 9, 'e'); P.px(9, 9, 'e'); P.ell(3, 4, 1, 1, 'w'); P.ell(13, 3, 1, 1, 'w'); P.px(2, 13, 'y'); P.px(14, 12, 'y'); P.px(8, 15, 'w');
  } },
  mossturtle: { tint: '#4a7a5a', w: 16, h: 16, pal: { y: '#c8f070', e: '#ffffff', d: '#0e1a10', s: '#8a7a5a' }, proc: (P) => {
    P.ell(8, 9, 7, 5, 's'); P.ell(8, 8, 6, 4, 'a'); P.ell(6, 6, 2, 1, 'y'); P.ell(11, 8, 2, 1, 'y'); P.ell(1, 10, 2, 2, 'c'); P.px(0, 10, 'd');
    P.rect(3, 13, 2, 2, 'c'); P.rect(11, 13, 2, 2, 'c'); P.line(4, 4, 3, 1, 'y'); P.px(3, 0, 'y');
  } },
  waterwheel: { tint: '#6a5a40', w: 16, h: 16, pal: { y: '#7ae0ff', e: '#ffffff', d: '#1a120a' }, proc: (P) => {
    P.ell(8, 8, 7, 7, 'a'); P.ell(8, 8, 5, 5, '.'); P.ell(8, 8, 2, 2, 'c'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P.line(8, 8, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, 'b'); }
    P.px(2, 14, 'y'); P.px(14, 15, 'y'); P.line(4, 15, 12, 15, 'y');
  } },
  // ── 59 금 간 하늘 아래의 폐허
  ruinpatrol: { tint: '#7a7488', w: 16, h: 16, pal: { y: '#d8c8ff', e: '#ffffff', d: '#14121a', m: '#a8a4b8' }, proc: (P) => {
    P.rect(5, 2, 6, 5, 'm'); P.rect(6, 4, 4, 1, 'd'); P.px(8, 4, 'y'); P.rect(4, 7, 8, 6, 'a'); P.line(5, 8, 10, 12, 'c');
    P.rect(5, 13, 2, 3, 'b'); P.rect(9, 13, 2, 3, 'b'); P.rect(0, 6, 4, 7, 'b'); P.line(1, 8, 3, 10, 'y'); P.line(13, 4, 13, 14, 'm');
  } },
  crackedstatue: { tint: '#9a96a8', w: 16, h: 16, pal: { y: '#d8c8ff', e: '#ffffff', d: '#2a2834' }, proc: (P) => {
    P.rect(3, 13, 10, 3, 'b'); P.rect(5, 5, 6, 8, 'a'); P.ell(8, 3, 3, 3, 'c'); P.px(7, 3, 'y'); P.px(9, 3, 'y');
    P.line(6, 2, 9, 8, 'd'); P.line(9, 8, 7, 12, 'd'); P.line(9, 8, 10, 12, 'd'); P.px(2, 6, 'y'); P.px(14, 4, 'y');
  } },
  windblade: { tint: '#a8d0c8', w: 16, h: 16, pal: { y: '#ffffff', e: '#1a3a34', w: '#e0fff8' }, proc: (P) => {
    P.tri(1, 8, 15, 5, 15, 7, 'a'); P.tri(1, 8, 15, 11, 15, 9, 'c'); P.ell(5, 8, 2, 2, 'w'); P.px(5, 8, 'e');
    P.line(2, 3, 10, 2, 'y'); P.line(4, 14, 12, 13, 'y'); P.px(0, 8, 'y');
  } },
  oblivionscholar: { tint: '#5a5070', w: 16, h: 16, pal: { y: '#c8b8ff', e: '#ffffff', d: '#0e0c14', w: '#e8dcc0' }, proc: (P) => {
    P.tri(8, 2, 3, 15, 13, 15, 'a'); P.ell(8, 4, 2, 2, 'd'); P.px(7, 4, 'y'); P.px(9, 4, 'y'); P.tri(5, 3, 8, 0, 11, 3, 'b');
    P.rect(1, 8, 6, 5, 'w'); P.line(4, 8, 4, 12, 'b'); P.px(2, 10, 'y'); P.px(6, 9, 'y'); P.ell(13, 7, 2, 2, 'y'); P.px(13, 7, 'e');
  } },
  // ── 60 오염된 층 (글리치)
  brokenshade: { tint: '#3a3a4a', w: 16, h: 16, pal: { m: '#ff3af0', g: '#3affe0', e: '#ffffff' }, proc: (P) => {
    P.ell(8, 6, 4, 4, 'a'); P.rect(4, 9, 8, 5, 'a'); P.px(6, 6, 'e'); P.px(10, 6, 'e'); P.rect(2, 4, 4, 1, 'm'); P.rect(10, 9, 5, 1, 'g'); P.rect(3, 12, 3, 1, 'g');
    P.rect(9, 2, 3, 1, 'm'); P.rect(5, 14, 2, 2, 'b'); P.rect(9, 14, 2, 2, 'b'); P.rect(12, 6, 3, 2, 'c');
  } },
  noisewisp: { tint: '#5ae8d8', w: 16, h: 16, pal: { m: '#ff3af0', e: '#ffffff', d: '#101018' }, proc: (P) => {
    for (let y = 2; y < 14; y += 2) P.rect(4 + ((y * 7) % 5) - 2, y, 8, 1, y % 4 ? 'a' : 'c'); P.ell(8, 8, 3, 3, 'd'); P.px(7, 7, 'e'); P.px(9, 7, 'e'); P.rect(1, 5, 2, 1, 'm'); P.rect(13, 11, 3, 1, 'm');
  } },
  errorturret: { tint: '#5a5a6a', w: 16, h: 16, pal: { m: '#ff3af0', g: '#3affe0', e: '#ffffff', d: '#0e0e14' }, proc: (P) => {
    P.rect(2, 3, 12, 10, 'a'); P.rect(3, 4, 10, 8, 'd'); P.rect(5, 6, 2, 2, 'g'); P.rect(9, 6, 2, 2, 'm'); P.line(4, 10, 11, 10, 'e'); P.rect(1, 13, 14, 3, 'b'); P.px(14, 2, 'm'); P.px(0, 7, 'g');
  } },
  damagedknight: { tint: '#6a6a7a', w: 16, h: 16, pal: { m: '#ff3af0', g: '#3affe0', e: '#ffffff', d: '#101016' }, proc: (P) => {
    P.rect(5, 2, 6, 5, 'c'); P.rect(6, 4, 4, 1, 'd'); P.px(7, 4, 'g'); P.rect(4, 7, 8, 6, 'a'); P.rect(8, 7, 4, 2, 'm'); P.rect(4, 10, 3, 1, 'g');
    P.rect(5, 13, 2, 3, 'b'); P.rect(9, 13, 2, 3, 'b'); P.line(13, 2, 13, 14, 'e'); P.rect(12, 6, 3, 1, 'm');
  } },
  glitchcore: { tint: '#ff3af0', w: 16, h: 16, pal: { g: '#3affe0', e: '#ffffff', d: '#0e0e14' }, proc: (P) => {
    P.rect(4, 4, 8, 8, 'd'); P.rect(5, 5, 6, 6, 'a'); P.rect(6, 6, 4, 4, 'e'); P.rect(1, 7, 3, 2, 'g'); P.rect(12, 7, 3, 2, 'g'); P.rect(7, 1, 2, 3, 'c'); P.rect(7, 12, 2, 3, 'c'); P.px(2, 2, 'g'); P.px(13, 13, 'a');
  } },

  // ════════ 보스 (32×32) ════════
  boss_glassscorpion: { tint: '#6e6448', w: 32, h: 32, pal: { s: '#bff4ff', d: '#14201e', y: '#ffffff', e: '#ff7a5a', g: '#9ad0d8' }, proc: (P) => {
    P.ell(16, 21, 9, 6, 'g'); P.ell(16, 20, 6, 3, 's'); P.px(13, 23, 'e'); P.px(19, 23, 'e'); P.px(15, 23, 'e'); P.px(17, 23, 'e');
    P.tri(6, 20, 0, 13, 9, 17, 'g'); P.tri(0, 13, 4, 10, 3, 16, 's'); P.tri(26, 20, 32, 13, 23, 17, 'g'); P.tri(32, 13, 28, 10, 29, 16, 's');
    P.line(16, 15, 18, 8, 'g'); P.line(18, 8, 23, 3, 'g'); P.line(23, 3, 27, 4, 'g'); P.tri(27, 2, 30, 6, 25, 6, 'y'); P.ell(28, 4, 1, 1, 'y');
    for (const x of [9, 12, 20, 23]) { P.line(x, 25, x - 2, 30, 'b'); } P.px(2, 2, 'y'); P.px(5, 28, 's');
  } },
  boss_witheredrose: { tint: '#5e4248', w: 32, h: 32, pal: { s: '#e8d0d0', d: '#140a0e', y: '#ff8aa8', e: '#ffffff', r: '#c83a5a', g: '#4a6a3a', f: '#ffd060' }, proc: (P) => {
    P.tri(16, 11, 5, 31, 27, 31, 'a'); P.tri(16, 14, 9, 31, 23, 31, 'r'); for (const x of [8, 12, 20, 24]) P.ell(x, 29, 2, 2, 'y');
    P.ell(16, 9, 4, 4, 's'); P.px(14, 9, 'd'); P.px(18, 9, 'd'); P.line(15, 12, 17, 12, 'r'); P.ell(16, 4, 6, 3, 'r'); P.ell(16, 4, 3, 2, 'y'); P.ell(11, 5, 2, 2, 'y'); P.ell(21, 5, 2, 2, 'y'); P.rect(13, 0, 6, 2, 'f');
    P.line(6, 14, 1, 30, 'g'); P.line(26, 14, 31, 30, 'g'); for (const [x, y] of [[3, 20], [29, 22], [2, 26], [30, 16]]) P.px(x, y, 'y'); P.line(22, 16, 28, 10, 'g'); P.ell(28, 9, 2, 2, 'r');
  } },
  boss_echoconductor: { tint: '#464a58', w: 32, h: 32, pal: { s: '#d0d8e8', d: '#0e1018', y: '#9ad8ff', e: '#ffffff', r: '#c8b8ff' }, proc: (P) => {
    P.tri(16, 12, 6, 31, 26, 31, 'a'); P.tri(16, 15, 12, 31, 20, 31, 'b'); P.rect(15, 14, 2, 15, 'y'); P.ell(16, 9, 4, 4, 's'); P.px(14, 9, 'd'); P.px(18, 9, 'd');
    P.tri(5, 1, 10, 5, 7, 12, 'c'); P.tri(27, 1, 22, 5, 25, 12, 'c'); P.ell(16, 3, 5, 1, 'r'); P.line(22, 15, 30, 6, 'e'); P.px(30, 5, 'y');
    for (const r of [4, 7, 10]) { P.px(4, 14 + r, 'y'); P.px(28, 12 + r, 'r'); } P.ell(3, 28, 2, 1, 'y'); P.ell(29, 28, 2, 1, 'r');
  } },
  boss_scrapgiant: { tint: '#4e4842', w: 32, h: 32, pal: { s: '#a89a8a', d: '#121010', y: '#ffb04a', e: '#ff5a3a', m: '#6a6a72', r: '#8a5a3a' }, proc: (P) => {
    P.rect(7, 10, 18, 14, 'a'); P.rect(9, 12, 14, 8, 'm'); P.ell(16, 16, 3, 3, 'y'); P.ell(16, 16, 1, 1, 'e'); for (const [x, y] of [[8, 11], [23, 11], [8, 22], [23, 22]]) P.px(x, y, 'y');
    P.rect(10, 2, 12, 8, 's'); P.rect(12, 5, 3, 2, 'e'); P.rect(17, 5, 3, 2, 'e'); P.line(13, 8, 19, 8, 'd'); P.line(16, 2, 16, 0, 'm'); P.px(16, 0, 'y');
    P.rect(1, 11, 6, 12, 'r'); P.rect(25, 11, 6, 12, 'r'); P.rect(0, 22, 7, 4, 'm'); P.rect(25, 22, 7, 4, 'm'); P.rect(9, 24, 5, 8, 'b'); P.rect(18, 24, 5, 8, 'b'); P.line(4, 14, 4, 20, 'y');
  } },
  boss_lanternmerchant: { tint: '#4e4058', w: 32, h: 32, pal: { s: '#f0e8e0', d: '#140e18', y: '#ffc860', e: '#ffffff', r: '#c83a3a', w: '#e8dcc0' }, proc: (P) => {
    P.tri(16, 10, 4, 31, 28, 31, 'a'); P.tri(16, 13, 9, 31, 23, 31, 'b'); P.rect(6, 18, 20, 7, 'w'); P.line(6, 21, 25, 21, 'b');
    P.ell(16, 9, 4, 4, 's'); P.ell(14, 9, 1, 1, 'd'); P.ell(18, 9, 1, 1, 'd'); P.line(13, 12, 19, 12, 'r'); P.tri(6, 7, 26, 7, 16, 0, 'd'); P.rect(6, 6, 20, 2, 'd');
    for (const [x, y] of [[3, 12], [29, 14], [6, 27], [26, 27]]) { P.line(x, y - 4, x, y - 2, 'b'); P.ell(x, y, 2, 3, 'y'); P.px(x, y, 'e'); }
    P.line(10, 4, 3, 8, 'b'); P.line(22, 4, 29, 10, 'b');
  } },
  boss_splitelemental: { tint: '#4a3a3a', w: 32, h: 32, pal: { r: '#ff7a3a', f: '#ffd060', i: '#a8d8ff', w: '#e8f8ff', e: '#ffffff', d: '#100c0c' }, proc: (P) => {
    P.ell(16, 18, 10, 11, 'a'); P.ell(11, 18, 6, 9, 'r'); P.ell(21, 18, 6, 9, 'i'); P.ell(11, 16, 3, 4, 'f'); P.ell(21, 16, 3, 4, 'w'); P.line(16, 6, 16, 30, 'd');
    P.ell(16, 8, 5, 5, 'a'); P.ell(13, 8, 3, 4, 'r'); P.ell(19, 8, 3, 4, 'i'); P.px(13, 8, 'e'); P.px(19, 8, 'e');
    P.tri(10, 4, 8, -2, 13, 3, 'f'); P.tri(22, 4, 24, -2, 19, 3, 'w'); P.tri(4, 14, 0, 8, 6, 22, 'r'); P.tri(28, 14, 32, 8, 26, 22, 'i'); P.px(1, 28, 'f'); P.px(30, 28, 'w');
  } },
  boss_bonechief: { tint: '#54483a', w: 32, h: 32, pal: { s: '#e8d8b8', d: '#120e08', y: '#7affc0', e: '#ffffff', r: '#c83a2a', f: '#ffb040' }, proc: (P) => {
    P.tri(16, 11, 5, 31, 27, 31, 'a'); P.tri(16, 14, 10, 31, 22, 31, 'b'); for (const y of [16, 19, 22, 25]) P.line(11, y, 21, y, 's');
    P.ell(16, 9, 5, 5, 's'); P.ell(14, 9, 1, 1, 'd'); P.ell(18, 9, 1, 1, 'd'); P.px(14, 9, 'y'); P.px(18, 9, 'y'); P.rect(13, 12, 6, 2, 'd');
    for (const [x0, x1] of [[9, 5], [12, 10], [20, 22], [23, 27]]) { P.line(x0, 5, x1, 0, 'r'); P.px(x1, 0, 'f'); }
    P.line(23, 17, 30, 12, 's'); P.ell(30, 11, 1, 1, 'y'); P.line(9, 17, 3, 24, 's'); P.ell(3, 25, 2, 2, 's'); P.px(3, 25, 'd');
  } },
  boss_carpdragon: { tint: '#3a5258', w: 32, h: 32, pal: { s: '#ffd060', d: '#101818', y: '#7ae0ff', e: '#ffffff', r: '#e07a3a', w: '#c8f4ff' }, proc: (P) => {
    P.ell(14, 18, 10, 7, 'r'); P.ell(14, 20, 7, 3, 's'); for (const x of [8, 12, 16, 20]) P.px(x, 15, 's');
    P.ell(5, 14, 4, 4, 'r'); P.px(3, 13, 'e'); P.line(1, 16, 0, 22, 's'); P.line(4, 18, 2, 24, 's'); P.tri(4, 10, 2, 4, 7, 10, 's'); P.tri(7, 10, 9, 5, 10, 11, 's');
    P.tri(23, 18, 31, 10, 31, 26, 'b'); P.tri(12, 12, 16, 5, 18, 12, 'b'); P.tri(12, 24, 15, 30, 18, 24, 'b');
    for (const x of [22, 26, 29]) P.line(x, 0, x, 6, 'w'); P.line(2, 28, 10, 30, 'y'); P.line(18, 31, 28, 29, 'y');
  } },
  boss_ruincolossus: { tint: '#4e4a5a', w: 32, h: 32, pal: { s: '#b4acc8', d: '#121018', y: '#d8c8ff', e: '#ffffff', g: '#7aa060' }, proc: (P) => {
    P.rect(8, 9, 16, 15, 'a'); P.rect(10, 11, 12, 10, 's'); P.line(12, 11, 16, 17, 'd'); P.line(16, 17, 14, 21, 'd'); P.line(16, 17, 20, 20, 'd');
    P.rect(11, 1, 10, 8, 'b'); P.rect(13, 4, 2, 2, 'y'); P.rect(17, 4, 2, 2, 'y'); P.line(19, 1, 17, 8, 'd');
    P.rect(2, 9, 6, 14, 'b'); P.rect(24, 9, 6, 14, 'b'); P.rect(10, 24, 5, 8, 'b'); P.rect(17, 24, 5, 8, 'b');
    P.ell(4, 9, 2, 1, 'g'); P.ell(26, 10, 2, 1, 'g'); P.px(12, 9, 'g'); P.px(2, 3, 'y'); P.px(29, 2, 'y'); P.line(0, 0, 6, 4, 'y');
  } },
  // 무형의 오류: 실제로는 drawFormless(전용 그림)로 그림 — 이 작은 그림은 다른 곳에서 불렀을 때의 대체용
  boss_formless: { tint: '#2a2a36', w: 32, h: 32, pal: { m: '#ff3af0', g: '#3affe0', e: '#ffffff' }, proc: (P) => {
    for (let y = 4; y < 30; y += 3) P.rect(6 + ((y * 5) % 7), y, 14 + ((y * 3) % 6), 2, y % 2 ? 'a' : 'c'); P.ell(16, 13, 2, 2, 'e'); P.rect(3, 9, 6, 1, 'm'); P.rect(22, 20, 7, 1, 'g'); P.rect(10, 27, 5, 1, 'm');
  } }
});
