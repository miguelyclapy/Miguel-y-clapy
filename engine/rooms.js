import { THREE, std, basic, box, cyl, sph, add as libAdd, seeded, rgb, rr, canvasTex, glowSprite, planks, tiles, wallpaper } from './lib.js';

const WALLZ = -5;

// ---------- shared: outside view ----------
function outdoors(G, time, cx = 0) {
  const day = time === 'day';
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(220, 130), new THREE.MeshBasicMaterial({ map: canvasTex(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    if (day) { gr.addColorStop(0, '#3f8fe0'); gr.addColorStop(0.6, '#8cc4f2'); gr.addColorStop(1, '#ffe2b8'); }
    else { gr.addColorStop(0, '#060a2e'); gr.addColorStop(0.55, '#1c1650'); gr.addColorStop(0.85, '#4a2456'); gr.addColorStop(1, '#5a2a50'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = seeded(9);
    if (day) { g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 9; i++) { const x = r() * w, y = 80 + r() * 380; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + k * 14, y + Math.sin(k) * 6, 16 + r() * 12, 0, 7); g.fill(); } } }
    else for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.8})`; g.beginPath(); g.arc(r() * w, r() * h * 0.6, r() * 1.2 + .3, 0, 7); g.fill(); } }) }));
  sky.position.set(cx - 10, 30, -100); G.add(sky);
  const orb = sph(3, basic(day ? 0xfff2c0 : 0xfff4dc)); orb.position.set(cx - 25, day ? 45 : 38, -90); G.add(orb);
  const og = glowSprite(day ? 0xfff0c0 : 0xffe8c8, 30, 30, day ? 0.5 : 0.8); og.position.copy(orb.position); G.add(og);
  const r = seeded(21);
  for (let layer = 0; layer < 3; layer++) { const z = [-25, -42, -65][layer]; let x = cx - 60;
    const col = day ? [0x9aa8c0, 0xb0bcd2, 0xc8d2e2][layer] : [0x121030, 0x0e0c26, 0x0b0a1e][layer];
    while (x < cx + 60) { const bw = 4 + r() * 7, bh = 12 + r() * (layer === 0 ? 26 : 40);
      const winTex = canvasTex(128, 512, (g, w, h) => { const q = seeded(1 + (r() * 1e6 | 0)); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        for (let y = 10; y < h; y += 26) for (let xx = 8; xx < w - 12; xx += 20) if (q() < (day ? 0.9 : [.35, .4, .5][layer])) { const warm = q() < .8; g.fillStyle = day ? 'rgba(200,225,255,0.35)' : warm ? `rgba(255,${200 + q() * 30 | 0},${120 + q() * 40 | 0},${.5 + q() * .5})` : `rgba(200,230,255,${.5 + q() * .5})`; g.fillRect(xx, y, 10, 14); } });
      winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping; winTex.repeat.set(bw / 6, bh / 24);
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: .9, emissive: 0xffffff, emissiveIntensity: day ? 0.5 : 1.1, emissiveMap: winTex });
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 5), mat); b.position.set(x + bw / 2, bh / 2 - 6 + layer * 2, z); G.add(b); x += bw + .5 + r() * 2.5; } }
}

// back wall with a rectangular window hole; returns frame material helper
function backWall(add, mat, win, side = null) {
  const [x0, x1, y0, y1] = win;
  add(box(40, 30, 0.4, mat), 0, y1 + 15, WALLZ); add(box(40, y0, 0.4, mat), 0, y0 / 2, WALLZ);
  add(box(20, y1 - y0, 0.4, mat), x0 - 10, (y0 + y1) / 2, WALLZ); add(box(20, y1 - y0, 0.4, mat), x1 + 10, (y0 + y1) / 2, WALLZ);
  if (side) add(box(0.4, 30, 30, side.mat), side.x, 10, WALLZ + 15);
}
function windowFrame(add, win, frameMat, mullions = true) {
  const [x0, x1, y0, y1] = win, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  add(box(x1 - x0 + 0.3, 0.2, 0.5, frameMat), cx, y1, WALLZ + 0.05); add(box(x1 - x0 + 0.3, 0.2, 0.5, frameMat), cx, y0, WALLZ + 0.05);
  add(box(0.2, y1 - y0, 0.5, frameMat), x0, cy, WALLZ + 0.05); add(box(0.2, y1 - y0, 0.5, frameMat), x1, cy, WALLZ + 0.05);
  if (mullions) { add(box(0.14, y1 - y0, 0.4, frameMat), cx, cy, WALLZ + 0.05); add(box(x1 - x0, 0.12, 0.4, frameMat), cx, cy + (y1 - y0) * 0.18, WALLZ + 0.05); }
  add(box(x1 - x0 + 0.8, 0.25, 0.8, frameMat), cx, y0 - 0.1, WALLZ + 0.3);
}
function floorPlane(add, tex, repeat = 4, rough = 0.5) { tex.repeat.set(repeat, repeat); const f = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std(0xffffff, { map: tex, roughness: rough })); f.rotation.x = -Math.PI / 2; add(f, 0, 0, WALLZ + 20); return f; }
function frameArt(add, w, h, x, y, draw, frame = 0x111111, z = WALLZ + 0.22) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, { map: canvasTex(256, 256 * h / w | 0, draw), roughness: 0.8 })); add(p, x, y, z); add(box(w + 0.14, h + 0.14, 0.05, std(frame)), x, y, z - 0.02); return p; }
function plant(add, x, y, z, s = 1, leafCol = 0x3f9a5a, potCol = 0xe0d4c0, seed = 1) {
  const g = new THREE.Group(); add(g, x, y, z); g.scale.setScalar(s); const r = seeded(seed);
  libAdd(g, cyl(0.45, 0.35, 0.8, std(potCol)), 0, 0.4, 0); libAdd(g, cyl(0.42, 0.42, 0.05, std(0x3a2a1e)), 0, 0.78, 0);
  for (let i = 0; i < 14; i++) { const l = sph(0.32, std(leafCol)); l.scale.set(0.5, 1.6, 0.18); const a = i / 14 * Math.PI * 2 + r(); const h = 1.2 + r() * 0.9;
    libAdd(g, l, Math.cos(a) * 0.35, h, Math.sin(a) * 0.35); l.rotation.set(Math.sin(a) * 0.7, a, Math.cos(a) * 0.7); }
  return g;
}
function screenMesh(add, tex, w, h, x, y, z, rotY = 0, bezel = 0x15151c) {
  const g = new THREE.Group(); add(g, x, y, z); g.rotation.y = rotY;
  libAdd(g, box(w + 0.16, h + 0.16, 0.12, std(bezel, { roughness: 0.35, metalness: 0.5 }), 0.04), 0, 0, -0.04);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); s.position.z = 0.03; s.userData.noShadow = true; g.add(s);
  return g;
}

// ===================== CUARTO (bedroom + computer) =====================
export function cuarto(G, o) {
  const add = (m, x = 0, y = 0, z = 0, parent = G) => libAdd(parent, m, x, y, z);
  const SIDEX = 7.5;
  G.add(new THREE.PointLight(0xffb066, 22, 12, 1.6).translateX(4.3).translateY(5).translateZ(-3));
  G.add(new THREE.PointLight(0x6aa8ff, 10, 8, 1.6).translateX(1.6).translateY(4.4).translateZ(-2.2));
  G.add(new THREE.PointLight(0xb04cff, 18, 16, 1.4).translateX(-2).translateY(9.5).translateZ(-4.2));
  const wallMat = std(0x34304a, { roughness: 0.95 });
  const win = [-6.2, -1.8, 4.8, 10.6];
  backWall(add, wallMat, win, { x: SIDEX, mat: std(0x2c2840, { roughness: 0.95 }) });
  windowFrame(add, win, std(0xe8e2d8, { roughness: 0.6 }));
  const curtMat = std(0x7a3b5a, { roughness: 1, side: THREE.DoubleSide });
  for (const cx of [win[0] - 0.5, win[1] + 0.5]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 7.2, 16, 1, true, 0, Math.PI), curtMat); c.rotation.y = Math.PI; add(c, cx, 7.6, WALLZ + 0.5); }
  floorPlane(add, planks([0.42, 0.28, 0.2]));
  const rugTex = canvasTex(512, 512, (g) => { g.fillStyle = '#2c4a6e'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#e8d9b0'; g.lineWidth = 10; g.strokeRect(30, 30, 452, 452); g.lineWidth = 4; g.strokeRect(55, 55, 402, 402);
    g.fillStyle = '#c45b4a'; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { g.save(); g.translate(110 + i * 58, 110 + j * 58); g.rotate(Math.PI / 4); g.fillRect(-10, -10, 20, 20); g.restore(); } });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), std(0xffffff, { map: rugTex, roughness: 1 })); rug.rotation.x = -Math.PI / 2; add(rug, 0.2, 0.012, 0.2);
  add(new THREE.Mesh(new THREE.BoxGeometry(30, 0.08, 0.08), basic(0xd070ff)), 0, 11.6, WALLZ + 0.25);
  const wood = std(0x8a5a3a, { roughness: 0.6 }), darkWood = std(0x4a3226, { roughness: 0.6 }), metal = std(0x22222a, { roughness: 0.35, metalness: 0.6 });
  const DESKY = 2.6, DESKZ = -3.6;
  add(box(6.2, 0.2, 2.2, wood, 0.04), 1.9, DESKY, DESKZ);
  for (const lx of [-1.1, 4.9]) add(box(0.18, DESKY, 2.0, darkWood), lx, DESKY / 2, DESKZ);
  add(box(1.4, 1.6, 1.9, darkWood, 0.05), 4.1, 1.5, DESKZ); for (const yy of [1.0, 1.7]) add(box(0.5, 0.06, 0.06, metal), 4.1, yy, DESKZ + 0.97);
  const MON = { x: 1.6, y: 4.55, z: -4.0, w: 3.4, h: 1.95 };
  screenMesh(add, o.screenTex, MON.w, MON.h, MON.x, MON.y, MON.z);
  add(box(0.18, 1.2, 0.12, metal), MON.x, DESKY + 0.65, MON.z - 0.15); add(box(1.0, 0.06, 0.6, metal, 0.02), MON.x, DESKY + 0.13, MON.z);
  const mg = glowSprite(0x4a8cff, 8, 6, 0.25); mg.position.set(MON.x, MON.y, MON.z - 0.3); G.add(mg);
  add(box(3.0, 0.02, 1.0, std(0x1d1d28)), 1.6, DESKY + 0.11, DESKZ + 0.55);
  add(box(2.0, 0.09, 0.6, std(0x2b2b38, { roughness: 0.5 }), 0.03), 1.4, DESKY + 0.16, DESKZ + 0.55);
  const kbKeys = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(256, 64, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 256, 64); const cols = ['#ff4d6d', '#ffb84d', '#4dffb8', '#4db8ff', '#b84dff']; for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) { g.fillStyle = cols[(x + y) % 5]; g.globalAlpha = 0.7; rr(g, x * 16 + 2, y * 16 + 2, 12, 12, 2); g.fill(); } }), toneMapped: false }));
  kbKeys.rotation.x = -Math.PI / 2; add(kbKeys, 1.4, DESKY + 0.21, DESKZ + 0.55);
  add(sph(0.14, std(0x2b2b38, { roughness: 0.4 })), 2.75, DESKY + 0.16, DESKZ + 0.6).scale.set(0.8, 0.45, 1.2);
  const lap = new THREE.Group(); add(lap, -0.35, DESKY + 0.11, DESKZ + 0.1); lap.rotation.y = 0.45;
  add(box(1.3, 0.06, 0.9, std(0xb8bcc8, { metalness: 0.6, roughness: 0.3 }), 0.02), 0, 0.03, 0, lap);
  add(box(1.3, 0.85, 0.04, std(0xb8bcc8, { metalness: 0.6, roughness: 0.3 }), 0.02), 0, 0.45, -0.45, lap).rotation.x = -0.25;
  const lapDisp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (g) => { g.fillStyle = '#16202e'; g.fillRect(0, 0, 256, 160); const r = seeded(4); for (let i = 0; i < 12; i++) { g.fillStyle = ['#7ee787', '#79c0ff', '#ff7b72', '#d2a8ff'][i % 4]; g.fillRect(14 + (i % 3) * 8, 14 + i * 11, 40 + r() * 140, 5); } }), toneMapped: false }));
  lapDisp.position.set(0, 0.45, -0.42); lapDisp.rotation.x = -0.25; lap.add(lapDisp);
  add(cyl(0.16, 0.14, 0.32, std(0xe85a4f)), 3.25, DESKY + 0.26, DESKZ + 0.45); add(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 16), std(0xe85a4f)), 3.43, DESKY + 0.27, DESKZ + 0.45);
  plant(add, 4.6, DESKY + 0.1, DESKZ - 0.5, 0.5, 0x3f9a5a, 0xe0d4c0, 3);
  const lampArm = new THREE.Group(); add(lampArm, 4.3, DESKY + 0.1, DESKZ - 0.2);
  add(cyl(0.3, 0.32, 0.08, metal), 0, 0.04, 0, lampArm); add(cyl(0.04, 0.04, 1.6, metal), 0.25, 0.8, 0, lampArm).rotation.z = -0.35;
  add(cyl(0.04, 0.04, 1.2, metal), 0.1, 1.85, 0, lampArm).rotation.z = 1.1;
  add(new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 24, 1, true), std(0x2b2b38, { side: THREE.DoubleSide, metalness: 0.5 })), -0.45, 2.0, 0, lampArm).rotation.z = 0.6;
  add(sph(0.12, basic(0xffd9a0)), -0.5, 1.88, 0, lampArm);
  for (const sx of [-0.55, 3.6]) { const sp = add(box(0.5, 0.85, 0.5, std(0x1d1d24, { roughness: 0.4 }), 0.05), sx, DESKY + 0.53, DESKZ - 0.55); add(cyl(0.15, 0.15, 0.02, std(0x444455)), 0, 0.12, 0.26, sp).rotation.x = Math.PI / 2; }
  add(cyl(0.03, 0.03, 0.9, metal), 2.95, DESKY + 0.55, DESKZ - 0.6); add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 24, Math.PI), std(0xff4d6d)), 2.95, DESKY + 1.0, DESKZ - 0.6);
  for (let i = 0; i < 3; i++) add(box(0.9, 0.14, 0.65, std([0x3d6fb6, 0xe8b04a, 0x6a4c93][i]), 0.02), -0.8 + i * 0.03, DESKY + 0.17 + i * 0.14, DESKZ - 0.6).rotation.y = i * 0.12;
  // gaming chair
  const chair = new THREE.Group(); add(chair, -1.7, 0, -1.2); chair.rotation.y = 0.5;
  const chairMat = std(0x1f1f2a, { roughness: 0.55 }), chairAcc = std(0xff5a4a, { roughness: 0.55 });
  add(box(1.9, 0.35, 1.8, chairMat, 0.15), 0, 2.15, 0, chair);
  add(box(1.8, 2.9, 0.35, chairMat, 0.15), 0, 3.75, -0.95, chair).rotation.x = -0.12; add(box(1.0, 2.2, 0.36, chairAcc, 0.12), 0, 3.85, -0.94, chair).rotation.x = -0.12;
  for (const s of [-1, 1]) { add(box(0.18, 0.12, 1.2, chairMat, 0.05), s * 1.0, 2.9, 0.0, chair); add(box(0.12, 0.6, 0.12, chairMat), s * 1.0, 2.55, -0.2, chair); }
  add(cyl(0.12, 0.12, 1.3, metal), 0, 1.3, 0, chair);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(box(1.3, 0.12, 0.18, metal), Math.cos(a) * 0.6, 0.35, Math.sin(a) * 0.6, chair).rotation.y = -a; add(sph(0.12, std(0x111111)), Math.cos(a) * 1.2, 0.12, Math.sin(a) * 1.2, chair); }
  // bed
  const bed = new THREE.Group(); add(bed, -5.8, 0, -1.6); bed.rotation.y = Math.PI / 2;
  add(box(4.8, 0.9, 3.4, darkWood, 0.08), 0, 0.6, 0, bed); add(box(4.6, 0.55, 3.2, std(0xeeeaf2), 0.2), 0, 1.3, 0, bed);
  add(box(3.0, 0.3, 3.3, std(0x4a6fd0, { roughness: 1 }), 0.14), 0.7, 1.62, 0, bed);
  add(box(0.9, 0.35, 1.4, std(0xfafafa), 0.17), -1.7, 1.75, 0.7, bed); add(box(0.9, 0.35, 1.4, std(0xffc2d1), 0.17), -1.7, 1.75, -0.7, bed);
  add(box(0.25, 2.6, 3.4, darkWood, 0.06), -2.45, 1.3, 0, bed);
  // bookshelf
  const shelf = new THREE.Group(); add(shelf, SIDEX - 0.55, 0, -0.5); shelf.rotation.y = -Math.PI / 2;
  add(box(3.2, 0.12, 1.0, wood), 0, 0.06, 0, shelf); for (let i = 0; i < 5; i++) add(box(3.2, 0.12, 1.0, wood), 0, 0.1 + i * 1.5, 0, shelf);
  for (const s of [-1, 1]) add(box(0.12, 6.2, 1.0, wood), s * 1.6, 3.1, 0, shelf); add(box(3.2, 6.2, 0.06, darkWood), 0, 3.1, -0.5, shelf);
  { const r = seeded(77); const cols = [0xd64545, 0x3d6fb6, 0xe8b04a, 0x5aa36b, 0x6a4c93, 0xf08a3c, 0xeeeeee, 0x2b2b38];
    for (let sh = 0; sh < 4; sh++) { let x = -1.45; while (x < 1.3) { const bw = 0.12 + r() * 0.14, bh = 0.7 + r() * 0.5; if (r() < 0.12) { add(sph(0.25, std(cols[r() * 8 | 0])), x + 0.3, 0.45 + sh * 1.5, 0, shelf); x += 0.7; continue; }
      add(box(bw, bh, 0.7, std(cols[r() * 8 | 0])), x + bw / 2, 0.16 + sh * 1.5 + bh / 2, 0, shelf).rotation.z = r() < 0.15 ? 0.25 : 0; x += bw + 0.02; } } }
  frameArt(add, 2.0, 2.8, 1.2, 8.6, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff7a59'); gr.addColorStop(1, '#6a2c91'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(w / 2, h * .45, 60, 0, 7); g.fill(); g.fillStyle = '#1b1530'; for (let i = 0; i < 6; i++) g.fillRect(i * 45, h * .6 - (i % 3) * 30, 40, h); g.fillStyle = '#fff'; g.font = 'bold 30px Inter'; g.fillText('MÉXICO', 70, h - 30); });
  frameArt(add, 1.6, 1.6, 3.6, 9.0, (g, w, h) => { g.fillStyle = '#0f3d3e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7ef0d0'; g.lineWidth = 10; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w / 2, h / 2, 20 + i * 22, 0, 7); g.stroke(); } });
  frameArt(add, 1.3, 1.7, 5.4, 8.2, (g, w, h) => { g.fillStyle = '#f2e6d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#d64545'; g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w - 30, h - 60); g.lineTo(30, h - 60); g.fill(); g.fillStyle = '#222'; g.font = 'bold 26px Inter'; g.fillText('LEVEL UP', 60, h - 20); });
  add(box(2.6, 0.12, 0.7, wood), 4.2, 6.6, WALLZ + 0.4); add(sph(0.3, std(0xf08a3c)), 3.4, 7.0, WALLZ + 0.4); add(box(0.4, 0.6, 0.4, std(0x5aa36b), 0.05), 4.1, 6.96, WALLZ + 0.4); add(cyl(0.2, 0.2, 0.7, std(0xe8b04a)), 4.9, 7.01, WALLZ + 0.4);
  const gtr = new THREE.Group(); add(gtr, -2.9, 0, -4.4); gtr.rotation.z = 0.12;
  add(sph(0.7, std(0xc0672e, { roughness: 0.4 })), 0, 1.0, 0, gtr).scale.set(1, 1.2, 0.35); add(sph(0.55, std(0xc0672e, { roughness: 0.4 })), 0, 2.0, 0, gtr).scale.set(1, 1, 0.35);
  add(box(0.18, 2.4, 0.1, darkWood), 0, 3.5, 0, gtr); add(cyl(0.2, 0.2, 0.05, std(0x111111)), 0, 1.6, 0.25, gtr).rotation.x = Math.PI / 2;
  add(cyl(0.38, 0.3, 0.9, std(0x3a3a48)), 5.6, 0.45, -3.4); add(box(1.0, 1.2, 0.6, std(0x3d6fb6), 0.25), 6.4, 0.6, 1.2).rotation.y = -0.6; add(sph(0.45, std(0xf4f4f4)), 5.6, 0.45, 2.2);
  outdoors(G, o.time, -4);
  return {
    miguel: { pos: [-1.7, 0, -1.2], rotY: 0.5, pose: 'sit', lookC: 0.45, lookCam: 0.15 },
    clapy: { pos: [4.2, 5.7, -2.8], rotY: -0.2 },
    screen: { center: [MON.x, MON.y, MON.z], h: 6.3, az: 0.05 },
    crowdSpots: [[-6.6, 1.95, -2.6, 1, -0.6], [-5.5, 1.95, -1.4, 1, 0.4], [-4.6, 1.95, -0.2, 1, -0.2], [-6.2, 1.95, 0.3, 1, 0.9], [-3.8, 0, 0.8, 1.15, 0.5], [0.6, 0, -1.4, 1.1, -0.4], [2.6, 0, -1.6, 1.1, 0.8], [4.8, 0, -1.0, 1.1, -2.6], [6.0, 0, 0.0, 1.1, -2.2], [0.4, 0, -3.2, 1, -1.57], [2.5, 0, -3.3, 1, -1.57], [5.2, 0, -2.4, 0.9, -2.0], [-5.2, 0, 2.6, 1.1, 0.7], [-2.9, 0, 3.0, 1.1, 0.2], [0.9, 0, 3.0, 1.1, -0.3], [3.2, 0, 2.6, 1.1, -0.6], [5.4, 0, 2.2, 1.1, -1.0]],
    wide: { t: [0.6, 4.8, -1.0], h: 14.5 },
  };
}

// ===================== SALA (living room) =====================
export function sala(G, o) {
  const add = (m, x = 0, y = 0, z = 0, parent = G) => libAdd(parent, m, x, y, z);
  const night = o.time !== 'day';
  const wallTex = wallpaper('#d9c3a5', '#cbb08e', 'stripes'); wallTex.repeat.set(10, 6);
  const wallMat = std(0xffffff, { map: wallTex, roughness: 0.95 });
  const win = [-7.6, -4.0, 4.2, 10.6];
  backWall(add, wallMat, win, { x: 8.2, mat: std(0xcfb79a, { roughness: 0.95 }) });
  windowFrame(add, win, std(0xffffff, { roughness: 0.5 }));
  // sheer curtains
  const sheer = std(0xfff6e8, { roughness: 1, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  for (const cx of [win[0] - 0.4, win[1] + 0.4]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 7.6, 18, 1, true, 0, Math.PI), sheer); c.rotation.y = Math.PI; add(c, cx, 7.0, WALLZ + 0.5); }
  add(cyl(0.05, 0.05, 5.4, std(0x8a6a4a)), (win[0] + win[1]) / 2, 10.9, WALLZ + 0.5).rotation.z = Math.PI / 2;
  // crown + baseboard
  add(box(40, 0.4, 0.2, std(0xffffff)), 0, 0.2, WALLZ + 0.25);
  floorPlane(add, planks([0.55, 0.38, 0.24], 8, 10), 5, 0.4);
  // big round rug
  const rugTex = canvasTex(512, 512, (g) => { g.fillStyle = '#e9dfcf'; g.beginPath(); g.arc(256, 256, 256, 0, 7); g.fill(); const cols = ['#c7553f', '#e2a33a', '#2f6f73', '#c7553f']; for (let i = 0; i < 4; i++) { g.strokeStyle = cols[i]; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 220 - i * 45, 0, 7); g.stroke(); } });
  const rug = new THREE.Mesh(new THREE.CircleGeometry(4.6, 64), std(0xffffff, { map: rugTex, roughness: 1, transparent: true })); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.3, 0.85, 1); add(rug, -0.2, 0.012, 0.4);
  // sofa (Miguel on its right end)
  const sofa = new THREE.Group(); add(sofa, -2.0, 0, -1.6); sofa.rotation.y = 0.5;
  const fab = std(0x2f6f73, { roughness: 0.95 }), fab2 = std(0x3b8589, { roughness: 0.95 });
  add(box(5.2, 1.3, 2.4, fab, 0.25), -1.6, 0.95, -0.1, sofa);
  add(box(5.2, 2.2, 0.7, fab, 0.3), -1.6, 2.4, -1.05, sofa);
  for (const ax of [-4.4, 1.2]) add(box(0.6, 1.9, 2.4, fab, 0.28), ax, 1.25, -0.1, sofa);
  for (const cx of [-2.85, -0.35]) add(box(2.45, 0.45, 2.0, fab2, 0.2), cx, 1.9, 0.05, sofa);
  add(box(0.9, 0.9, 0.35, std(0xe2a33a), 0.15), -3.6, 2.55, -0.5, sofa).rotation.z = 0.2;
  add(box(0.85, 0.85, 0.32, std(0xf2ece0), 0.15), -2.7, 2.5, -0.55, sofa).rotation.z = -0.1;
  for (const lx of [-4.3, 1.1]) for (const lz of [-1.0, 0.9]) add(cyl(0.07, 0.05, 0.3, std(0x3a2a1e)), lx, 0.15, lz, sofa);
  // throw blanket
  add(box(1.4, 0.08, 1.8, std(0xc7553f, { roughness: 1 }), 0.04), -4.2, 2.25, 0.2, sofa).rotation.z = -0.25;
  // sleeping cat on armrest
  { const cat = new THREE.Group(); add(cat, -4.4, 2.3, -0.2, sofa); const cm = std(0xe8a050);
    const b = sph(0.42, cm); b.scale.set(1.3, 0.6, 1); add(b, 0, 0.22, 0, cat); add(sph(0.26, cm), 0.45, 0.32, 0.15, cat);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 8), cm); add(e, 0.45 + s * 0.12, 0.56, 0.15, cat); }
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 20, Math.PI), cm); tail.rotation.x = Math.PI / 2; add(tail, -0.1, 0.12, 0.05, cat); }
  // coffee table
  const ct = new THREE.Group(); add(ct, 0.6, 0, 1.0);
  add(cyl(1.3, 1.3, 0.14, std(0x9a6b45, { roughness: 0.5 }), 40), 0, 1.25, 0, ct);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; add(cyl(0.07, 0.05, 1.2, std(0x2b2b2b)), Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8, ct); }
  add(cyl(0.35, 0.22, 0.3, std(0xf4f0e8)), -0.4, 1.47, 0.1, ct); for (let i = 0; i < 9; i++) add(sph(0.08, std(0xfff4c8)), -0.4 + Math.cos(i) * 0.18, 1.62 + (i % 3) * 0.04, 0.1 + Math.sin(i) * 0.18, ct);
  add(box(0.22, 0.06, 0.6, std(0x111111), 0.02), 0.5, 1.35, 0.3, ct).rotation.y = 0.4;
  add(box(0.9, 0.06, 1.2, std(0xd94f4f), 0.02), 0.3, 1.36, -0.5, ct).rotation.y = -0.2; add(box(0.85, 0.06, 1.15, std(0x3d6fb6), 0.02), 0.32, 1.42, -0.5, ct).rotation.y = -0.1;
  add(cyl(0.14, 0.12, 0.28, std(0xffffff)), 0.75, 1.46, -0.1, ct);
  plant(add, -0.6, 1.32, -0.5, 0.35, 0x6aa86b, 0xc7553f, 7);
  // media console + TV (screen)
  add(box(6.0, 1.5, 1.5, std(0x7a5236, { roughness: 0.6 }), 0.08), 3.6, 0.85, -4.1);
  for (const dx of [-2, 0, 2]) { add(box(1.8, 1.1, 0.04, std(0x8a6242)), 3.6 + dx, 0.85, -3.33); add(sph(0.06, std(0xd4af37, { metalness: 0.8, roughness: 0.3 })), 3.6 + dx, 0.85, -3.3); }
  for (const lx of [1.0, 6.2]) add(cyl(0.06, 0.04, 0.35, std(0x222222)), lx, 0.1, -4.1);
  const TV = { x: 3.6, y: 4.6, z: -4.55, w: 5.0, h: 2.85 };
  screenMesh(add, o.screenTex, TV.w, TV.h, TV.x, TV.y, TV.z, 0, 0x0c0c10);
  const tg = glowSprite(0x6aa8ff, 10, 7, night ? 0.35 : 0.15); tg.position.set(TV.x, TV.y, TV.z - 0.4); G.add(tg);
  add(box(3.0, 0.3, 0.4, std(0x1a1a1e, { roughness: 0.4 }), 0.1), TV.x, 1.75, -3.9);
  add(box(0.9, 0.18, 0.7, std(0xf2f2f2, { roughness: 0.3 }), 0.05), 1.6, 1.7, -3.9);
  plant(add, 6.0, 1.6, -4.0, 0.45, 0x3f9a5a, 0xf2ece0, 4);
  for (let i = 0; i < 4; i++) add(box(0.25, 0.9 - i * 0.08, 0.7, std([0xe2a33a, 0x2f6f73, 0xc7553f, 0xf2ece0][i])), 5.0 + i * 0.27, 2.05 - i * 0.04, -4.1);
  // gallery wall above sofa
  frameArt(add, 1.6, 2.0, -2.6, 7.8, (g, w, h) => { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f6f73'; g.beginPath(); g.arc(w / 2, h * 0.6, 80, Math.PI, 0); g.fill(); g.fillStyle = '#e2a33a'; g.beginPath(); g.arc(w / 2, h * 0.35, 34, 0, 7); g.fill(); }, 0xd4af37);
  frameArt(add, 1.2, 1.2, -0.8, 8.4, (g, w, h) => { g.fillStyle = '#c7553f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2ece0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(40 + i * 45, h / 2 + Math.sin(i) * 40, 18, 0, 7); g.fill(); } }, 0x222222);
  frameArt(add, 1.0, 1.4, -0.9, 6.6, (g, w, h) => { g.fillStyle = '#1f3b4d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2ece0'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 40 + i * 50); g.quadraticCurveTo(w / 2, i * 50, w, 40 + i * 50); g.stroke(); } }, 0x222222);
  // wall clock
  { const ck = new THREE.Group(); add(ck, 6.8, 8.6, WALLZ + 0.25); libAdd(ck, cyl(0.7, 0.7, 0.1, std(0xffffff), 40), 0, 0, 0).rotation.x = Math.PI / 2;
    libAdd(ck, new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 40), std(0x2b2b2b)), 0, 0, 0.05);
    const hh = libAdd(ck, box(0.06, 0.4, 0.03, std(0x111111)), 0, 0.15, 0.08); hh.rotation.z = -0.8; libAdd(ck, box(0.04, 0.55, 0.03, std(0x111111)), 0.12, 0.2, 0.09).rotation.z = 0.5; }
  // arc floor lamp over sofa
  { const lm = std(0x222222, { metalness: 0.6, roughness: 0.3 }); add(cyl(0.45, 0.5, 0.15, lm), -6.4, 0.08, 0.2);
    const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 0.62; pts.push(new THREE.Vector3(-6.4 + Math.sin(a) * 3.0, 0.15 + Math.sin(a + 0.0) * 0 + (1 - Math.cos(a)) * 0 + i / 20 * 0 + Math.sin(a) * 0 + (a < 1e9 ? Math.sin(Math.min(a * 1.6, Math.PI / 2)) * 7.2 : 0), 0.2)); }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 8), lm));
    const end = pts[pts.length - 1]; add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf2ece0, { side: THREE.DoubleSide })), end.x, end.y - 0.3, end.z);
    add(sph(0.15, basic(0xffe2b0)), end.x, end.y - 0.45, end.z);
    const L = new THREE.PointLight(0xffc27a, night ? 26 : 8, 14, 1.5); L.position.set(end.x, end.y - 0.8, end.z); G.add(L); }
  // big plant corner, side table with lamp, bookcase by window
  plant(add, 7.0, 0, 0.6, 1.4, 0x2f7a4a, 0xf2ece0, 9);
  add(cyl(0.6, 0.6, 0.08, std(0x9a6b45)), -6.2, 1.6, -3.3); add(cyl(0.08, 0.08, 1.6, std(0x2b2b2b)), -6.2, 0.8, -3.3);
  add(cyl(0.18, 0.25, 0.6, std(0xe2a33a)), -6.2, 1.95, -3.3); add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 24, 1, true), std(0xfff4e0, { side: THREE.DoubleSide, emissive: 0xffc27a, emissiveIntensity: night ? 0.8 : 0.2 })), -6.2, 2.55, -3.3);
  { const L = new THREE.PointLight(0xffc27a, night ? 10 : 3, 8, 1.6); L.position.set(-6.2, 2.7, -3.0); G.add(L); }
  // record player on side table
  add(box(0.9, 0.2, 0.7, std(0x6a4a32), 0.04), -6.0, 1.75, -3.6).rotation.y = 0.3;
  G.add(new THREE.PointLight(0xffe0c0, night ? 6 : 14, 20, 1.2).translateX(0).translateY(10).translateZ(2));
  outdoors(G, o.time, -6);
  return {
    miguel: { pos: [-2.0, -0.2, -1.6], rotY: 0.5, pose: 'sit', lookC: 0.5, lookCam: 0.15 },
    clapy: { pos: [0.5, 5.8, -2.0], rotY: -0.3 },
    screen: { center: [TV.x, TV.y, TV.z], h: 6.6, az: -0.05 },
    crowdSpots: [[-4.6, 2.0, -2.2, 0.9, 0.6], [-3.6, 2.0, -1.4, 0.9, 0.3], [2.6, 0, -2.6, 1.1, 0.4], [4.4, 0, -2.5, 1.1, -0.6], [5.8, 0, -1.6, 1.1, -2.4], [6.2, 0, 0.4, 1.1, -2.2], [-5.4, 0, 0.6, 1.1, 0.9], [2.6, 0, 0.6, 1.1, -0.6], [4.4, 0, 1.0, 1.1, -1.4], [-1.4, 0, 1.8, 1.1, 0.2], [0.6, 2.62, 1.0, 0.7, 0.4], [-5.2, 0, 2.8, 1.2, 0.6], [-2.8, 0, 3.4, 1.2, 0.2], [1.2, 0, 3.4, 1.2, -0.3], [3.6, 0, 3.0, 1.2, -0.6], [5.6, 0, 2.6, 1.2, -1.0], [-6.8, 0, -1.4, 1.0, 0.8]],
    wide: { t: [-0.3, 4.8, -1.0], h: 14.5 },
  };
}

// ===================== COMEDOR (dining + kitchen) =====================
export function comedor(G, o) {
  const add = (m, x = 0, y = 0, z = 0, parent = G) => libAdd(parent, m, x, y, z);
  const night = o.time !== 'day';
  const wallMat = std(0xf1e4cf, { roughness: 0.95 });
  const win = [2.2, 6.6, 5.0, 10.2];
  backWall(add, wallMat, win, { x: 8.4, mat: std(0xe8d6bb, { roughness: 0.95 }) });
  windowFrame(add, win, std(0x2f6f73, { roughness: 0.5 }));
  floorPlane(add, tiles('#c9845a', '#b8734c', '#e8d6bb', 6, 4), 6, 0.6);
  // talavera backsplash
  const talavera = canvasTex(256, 256, (g) => { g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.save(); g.translate(32 + i * 64, 32 + j * 64);
    g.strokeStyle = '#1f4f9a'; g.lineWidth = 4; g.strokeRect(-30, -30, 60, 60); g.fillStyle = '#1f4f9a'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -14, 6, 12, 0, 0, 7); g.fill(); } g.fillStyle = '#e2a33a'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); g.restore(); } });
  talavera.wrapS = talavera.wrapT = THREE.RepeatWrapping; talavera.repeat.set(5, 1);
  add(new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.7), std(0xffffff, { map: talavera, roughness: 0.4 })), -3.6, 4.1, WALLZ + 0.22);
  // kitchen counters (left)
  const cab = std(0x2f6f73, { roughness: 0.6 }), top = std(0xf4f0e8, { roughness: 0.3 });
  add(box(8.6, 2.6, 1.8, cab, 0.04), -3.6, 1.3, -4.0); add(box(8.8, 0.18, 2.0, top, 0.03), -3.6, 2.68, -3.95);
  for (let i = 0; i < 4; i++) { add(box(1.9, 2.2, 0.05, std(0x37808a)), -7.0 + i * 2.2, 1.3, -3.08); add(box(0.5, 0.06, 0.06, std(0xd4af37, { metalness: 0.8, roughness: 0.3 })), -7.0 + i * 2.2, 2.1, -3.04); }
  add(box(8.6, 2.0, 1.2, cab, 0.04), -3.6, 7.0, -4.35);
  for (let i = 0; i < 4; i++) add(box(1.9, 1.8, 0.05, std(0x37808a)), -7.0 + i * 2.2, 7.0, -3.73);
  // sink + faucet
  add(box(1.6, 0.1, 1.0, std(0xb8bcc8, { metalness: 0.7, roughness: 0.25 }), 0.03), -1.3, 2.78, -3.9);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 20, Math.PI), std(0xb8bcc8, { metalness: 0.8, roughness: 0.2 })), -1.3, 3.2, -4.4);
  // stove + pot + hood
  add(box(2.0, 0.1, 1.6, std(0x1a1a1e, { roughness: 0.3 })), -4.4, 2.8, -3.9);
  for (const [dx, dz] of [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]]) add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20), std(0x444444)), -4.4 + dx, 2.87, -3.9 + dz).rotation.x = Math.PI / 2;
  add(cyl(0.45, 0.42, 0.6, std(0xd94f4f, { roughness: 0.4 })), -4.85, 3.17, -4.2); add(cyl(0.47, 0.47, 0.06, std(0xd94f4f)), -4.85, 3.5, -4.2);
  add(sph(0.06, std(0x222222)), -4.85, 3.56, -4.2);
  add(box(2.2, 0.5, 1.2, std(0xb8bcc8, { metalness: 0.6, roughness: 0.3 })), -4.4, 5.8, -4.35);
  // fridge with magnets + drawings
  add(box(2.2, 7.2, 2.0, std(0xe8ecef, { roughness: 0.3, metalness: 0.1 }), 0.12), -8.4, 3.6, -3.9);
  add(box(0.08, 1.6, 0.08, std(0x999999, { metalness: 0.8 })), -7.45, 4.6, -2.85);
  { const r = seeded(31); for (let i = 0; i < 6; i++) add(box(0.25, 0.25, 0.05, std([0xd94f4f, 0xe2a33a, 0x3d6fb6, 0x5aa36b][i % 4])), -8.9 + r() * 1.2, 2.5 + r() * 3.5, -2.88);
    frameArt(add, 0.8, 1.0, -8.6, 5.6, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e2a33a'; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, 80, 40, 0, 7); g.stroke(); g.strokeStyle = '#3d6fb6'; g.beginPath(); g.moveTo(40, h - 40); g.lineTo(w / 2, 160); g.lineTo(w - 40, h - 40); g.stroke(); }, 0xffffff, -2.86); }
  // counter details: coffee maker, fruit, plants, utensils, microwave
  add(box(0.7, 1.1, 0.7, std(0x1a1a1e, { roughness: 0.4 }), 0.08), -6.4, 3.32, -4.1); add(cyl(0.2, 0.18, 0.4, std(0xb8e0ff, { transparent: true, opacity: 0.6 })), -6.4, 3.0, -3.7);
  add(box(1.6, 0.9, 1.0, std(0x2b2b30, { roughness: 0.4 }), 0.06), -7.0, 6.7, -4.2);
  add(cyl(0.25, 0.2, 0.6, std(0xc7553f)), -2.6, 3.1, -4.3); for (let i = 0; i < 4; i++) add(cyl(0.025, 0.025, 0.9, std([0x8a5a3a, 0x222222, 0xb8bcc8, 0x8a5a3a][i])), -2.6 + (i - 1.5) * 0.08, 3.6, -4.3).rotation.z = (i - 1.5) * 0.15;
  plant(add, 0.6, 2.77, -4.3, 0.42, 0x5aa36b, 0xc7553f, 12);
  for (let i = 0; i < 3; i++) plant(add, 3.4 + i * 1.4, 4.95, -4.75, 0.32, [0x3f9a5a, 0x6aa86b, 0x2f7a4a][i], [0xe2a33a, 0xf2ece0, 0xc7553f][i], 20 + i);
  // dining table
  const T = { x: 2.6, z: -1.2, y: 2.6 };
  add(box(5.0, 0.2, 2.6, std(0x8a5a3a, { roughness: 0.5 }), 0.06), T.x, T.y, T.z);
  for (const dx of [-2.2, 2.2]) for (const dz of [-1.0, 1.0]) add(box(0.2, T.y, 0.2, std(0x6a4430)), T.x + dx, T.y / 2, T.z + dz);
  // table runner (sarape)
  const sarape = canvasTex(64, 256, (g) => { const cols = ['#d94f4f', '#e2a33a', '#2f6f73', '#7a3b9a', '#5aa36b', '#f2ece0']; for (let i = 0; i < 32; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(0, i * 8, 64, 8); } });
  add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 4.6), std(0xffffff, { map: sarape, roughness: 1 })), T.x, T.y + 0.11, T.z).rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  // fruit bowl, conchas, plates, glasses, jarrito, flowers
  add(cyl(0.6, 0.35, 0.35, std(0xf2ece0, { roughness: 0.3 })), T.x + 1.2, T.y + 0.28, T.z - 0.4);
  { const fr = [[0xff8a1c, 0.18], [0xd62839, 0.17], [0x7cc242, 0.16], [0xff8a1c, 0.18], [0xffd23f, 0.15]]; fr.forEach(([c, r], i) => add(sph(r, std(c, { roughness: 0.4 })), T.x + 1.2 + Math.cos(i * 1.3) * 0.25, T.y + 0.52 + (i % 2) * 0.12, T.z - 0.4 + Math.sin(i * 1.3) * 0.25)); }
  add(cyl(0.55, 0.4, 0.2, std(0xb07a44, { roughness: 0.9 })), T.x - 0.2, T.y + 0.2, T.z - 0.6);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std([0xf4e4c8, 0x8a5a3a, 0xffc2d1, 0xf4e4c8][i], { roughness: 0.8 })); c.scale.set(1, 0.6, 1); add(c, T.x - 0.35 + (i % 2) * 0.3, T.y + 0.32 + (i > 1 ? 0.06 : 0), T.z - 0.7 + (i > 1 ? 0.25 : 0)); }
  for (const dx of [-1.4, 0.4, 1.8]) { add(cyl(0.42, 0.36, 0.05, std(0xffffff, { roughness: 0.3 }), 32), T.x + dx, T.y + 0.13, T.z + 0.7); add(cyl(0.13, 0.11, 0.42, std(0xcfe8ff, { transparent: true, opacity: 0.55, roughness: 0.1 })), T.x + dx + 0.5, T.y + 0.32, T.z + 0.45); }
  add(cyl(0.17, 0.15, 0.6, std(0xd94f4f, { roughness: 0.6 })), T.x + 0.9, T.y + 0.4, T.z + 0.2); add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), std(0xd94f4f)), T.x + 1.08, T.y + 0.42, T.z + 0.2);
  add(cyl(0.16, 0.2, 0.55, std(0x3d6fb6, { roughness: 0.3 })), T.x - 1.9, T.y + 0.38, T.z - 0.6);
  for (let i = 0; i < 6; i++) { add(cyl(0.015, 0.015, 0.7, std(0x3f9a5a)), T.x - 1.9 + Math.cos(i) * 0.08, T.y + 0.85, T.z - 0.6 + Math.sin(i) * 0.08).rotation.z = Math.cos(i) * 0.25; add(sph(0.11, std([0xffd23f, 0xff7a9a, 0xff8a1c][i % 3])), T.x - 1.9 + Math.cos(i) * 0.22, T.y + 1.22 + (i % 2) * 0.08, T.z - 0.6 + Math.sin(i) * 0.2); }
  // tablet on stand = screen (faces Miguel / camera)
  const TB = { x: 0.95, y: T.y + 0.95, z: T.z + 0.45, w: 1.7, h: 1.1 };
  screenMesh(add, o.screenTex, TB.w, TB.h, TB.x, TB.y, TB.z, 0.35, 0x222226).rotation.x = -0.15;
  add(box(0.6, 0.06, 0.4, std(0x222226)), TB.x, T.y + 0.13, TB.z - 0.1);
  // chairs
  const chairM = std(0x6a4430, { roughness: 0.6 });
  function chair(x, z, ry) { const c = new THREE.Group(); add(c, x, 0, z); c.rotation.y = ry; libAdd(c, box(1.5, 0.2, 1.5, chairM, 0.05), 0, 2.1, 0); libAdd(c, box(1.5, 2.2, 0.15, chairM, 0.05), 0, 3.2, -0.7);
    for (const dx of [-0.65, 0.65]) for (const dz of [-0.65, 0.65]) libAdd(c, box(0.14, 2.1, 0.14, chairM), dx, 1.05, dz); libAdd(c, box(1.3, 0.12, 1.3, std(0xe2a33a, { roughness: 1 }), 0.05), 0, 2.26, 0); return c; }
  chair(-1.4, -0.9, 0.6); chair(4.0, -3.0, 0.0); chair(5.6, -1.2, -1.57); chair(1.6, -3.0, 0.0);
  // pendant lamps
  for (const dx of [-1.2, 1.2]) { add(cyl(0.02, 0.02, 2.4, std(0x111111)), T.x + dx, 10.0, T.z); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.6, 32, 1, true), std(0xe2a33a, { side: THREE.DoubleSide, roughness: 0.4 })); add(sh, T.x + dx, 8.6, T.z);
    add(sph(0.16, basic(0xffe2b0)), T.x + dx, 8.38, T.z); const L = new THREE.PointLight(0xffc27a, night ? 16 : 5, 10, 1.5); L.position.set(T.x + dx, 8.0, T.z); G.add(L); }
  // wall clock + calendar + papel picado
  { const ck = new THREE.Group(); add(ck, 0.6, 8.8, WALLZ + 0.25); libAdd(ck, cyl(0.6, 0.6, 0.1, std(0xffffff), 40), 0, 0, 0).rotation.x = Math.PI / 2; libAdd(ck, new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 40), std(0xd94f4f)), 0, 0, 0.05); libAdd(ck, box(0.05, 0.35, 0.03, std(0x111111)), 0, 0.12, 0.08).rotation.z = 0.6; }
  { const cols = ['#d94f4f', '#e2a33a', '#2f6f73', '#7a3b9a', '#5aa36b', '#ff7a9a']; for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7), new THREE.MeshStandardMaterial({ map: canvasTex(64, 80, (g) => { g.fillStyle = cols[i % 6]; g.fillRect(0, 0, 64, 80); g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(12 + (k % 3) * 20, 20 + (k / 3 | 0) * 30, 6, 0, 7); g.fill(); } g.beginPath(); g.moveTo(0, 80); for (let k = 0; k <= 8; k++) g.lineTo(k * 8, k % 2 ? 70 : 80); g.fill(); }), transparent: true, side: THREE.DoubleSide, roughness: 1 }));
    f.userData.noShadow = true; add(f, -5.5 + i * 0.95, 11.0 - Math.sin(i / 13 * Math.PI) * 0.6, -2.0); f.rotation.y = 0.05 * Math.sin(i); } }
  G.add(new THREE.PointLight(0xfff0d8, night ? 6 : 14, 22, 1.2).translateX(0).translateY(10).translateZ(2));
  outdoors(G, o.time, 4);
  return {
    miguel: { pos: [-1.4, 0, -0.9], rotY: 0.6, pose: 'sit', lookC: 0.55, lookCam: 0.1 },
    clapy: { pos: [3.9, 5.5, -1.6], rotY: -0.45 },
    screen: { center: [TB.x, TB.y, TB.z], h: 3.6, az: 0.3 },
    crowdSpots: [[3.0, T.y + 0.1, T.z + 0.2, 0.8, 0.3], [1.6, T.y + 0.1, T.z - 0.2, 0.8, -0.2], [4.3, T.y + 0.1, T.z + 0.5, 0.8, 0.6], [-6.0, 2.77, -3.7, 0.7, 0.2], [-2.6, 2.77, -3.6, 0.7, 0.1], [-3.4, 0, -1.6, 1.1, 0.4], [6.4, 0, -2.6, 1.1, -0.8], [6.8, 0, 0.6, 1.1, -1.2], [-5.6, 0, 0.6, 1.1, 0.7], [0.6, 0, 1.6, 1.1, 0.0], [3.6, 0, 1.4, 1.1, -0.5], [-6.6, 0, 2.6, 1.2, 0.6], [-3.6, 0, 3.0, 1.2, 0.2], [0.2, 0, 3.4, 1.2, -0.2], [2.6, 0, 3.2, 1.2, -0.4], [5.2, 0, 2.8, 1.2, -0.9]],
    wide: { t: [0.8, 4.9, -1.2], h: 14.5 },
  };
}

// ===================== BAÑO (bathroom) =====================
export function bano(G, o) {
  const add = (m, x = 0, y = 0, z = 0, parent = G) => libAdd(parent, m, x, y, z);
  const night = o.time !== 'day';
  // lower tiles + upper paint
  const tileTex = tiles('#7fc8c4', '#8fd2ce', '#e8f2f0', 10, 6); tileTex.repeat.set(4, 1);
  const win = [4.2, 6.6, 7.6, 10.4];
  const bwp = wallpaper('#e9efe6', '#a8c5a0', 'leaves', 8); bwp.repeat.set(12, 8);
  backWall(add, std(0xffffff, { map: bwp, roughness: 0.95 }), win, { x: 8.0, mat: std(0xdfe8dc, { roughness: 0.95 }) });
  windowFrame(add, win, std(0xffffff), false);
  add(new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.6), new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.55, roughness: 0.6 })), (win[0] + win[1]) / 2, 9.0, WALLZ + 0.02);
  add(new THREE.Mesh(new THREE.PlaneGeometry(16, 4.6), std(0xffffff, { map: tileTex, roughness: 0.25 })), 0, 2.3, WALLZ + 0.22);
  add(box(16, 0.16, 0.16, std(0xffffff)), 0, 4.6, WALLZ + 0.28);
  floorPlane(add, tiles('#f2f2f2', '#2b2b30', '#cccccc', 8, 2), 8, 0.35);
  // vanity + sink + mirror with light
  const V = { x: -1.4, z: -4.0 };
  add(box(4.4, 2.6, 1.8, std(0xc59a6a, { roughness: 0.5 }), 0.06), V.x, 1.3, V.z);
  for (const dx of [-1.05, 1.05]) { add(box(2.0, 2.2, 0.04, std(0xd2a878)), V.x + dx, 1.3, V.z + 0.92); add(box(0.4, 0.06, 0.06, std(0x222222, { metalness: 0.8 })), V.x + dx, 2.1, V.z + 0.96); }
  add(box(4.6, 0.16, 2.0, std(0xf4f4f4, { roughness: 0.15 }), 0.04), V.x, 2.68, V.z);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.3, 32, 1, true), std(0xffffff, { roughness: 0.1, side: THREE.DoubleSide })), V.x, 2.84, V.z + 0.1).scale.set(1, 1, 0.8);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 8, 20, Math.PI), std(0xd8d8d8, { metalness: 0.9, roughness: 0.15 })), V.x, 3.25, V.z - 0.55);
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshPhysicalMaterial({ color: 0xbcd4e6, roughness: 0.05, metalness: 0.9, envMapIntensity: 1 }));
  mirror.scale.set(1, 1.2, 1); add(mirror, V.x, 6.0, WALLZ + 0.25);
  add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 10, 48), basic(0xfff2d8)), V.x, 6.0, WALLZ + 0.27).scale.set(1, 1.2, 1);
  { const L = new THREE.PointLight(0xfff0d8, night ? 16 : 8, 10, 1.5); L.position.set(V.x, 6.0, -3.6); G.add(L); }
  // toothbrush cup, soap, bottles, plant
  add(cyl(0.16, 0.13, 0.4, std(0xffc2d1)), V.x + 1.3, 2.96, V.z - 0.4); for (let i = 0; i < 2; i++) add(cyl(0.03, 0.03, 0.6, std([0x3d6fb6, 0x5aa36b][i])), V.x + 1.28 + i * 0.06, 3.3, V.z - 0.4).rotation.z = (i - 0.5) * 0.3;
  add(box(0.3, 0.12, 0.2, std(0xfff4c8), 0.05), V.x - 1.0, 2.83, V.z - 0.3);
  for (let i = 0; i < 3; i++) { add(cyl(0.12, 0.12, 0.45 + i * 0.1, std([0x2f6f73, 0xe2a33a, 0xffffff][i], { roughness: 0.3 })), V.x - 1.7 + i * 0.3, 3.0 + i * 0.05, V.z - 0.5); }
  plant(add, V.x + 1.9, 2.76, V.z - 0.5, 0.3, 0x3f9a5a, 0xffffff, 15);
  // toilet
  { const tl = new THREE.Group(); add(tl, -5.6, 0, -3.8); const pm = std(0xffffff, { roughness: 0.15 });
    libAdd(tl, cyl(0.55, 0.4, 1.5, pm, 32), 0, 0.75, 0.35).scale.set(1, 1, 1.25); libAdd(tl, cyl(0.62, 0.62, 0.12, pm, 32), 0, 1.55, 0.4).scale.set(1, 1, 1.25);
    libAdd(tl, box(1.4, 1.5, 0.6, pm, 0.12), 0, 2.2, -0.55); libAdd(tl, box(1.5, 0.12, 0.7, pm, 0.05), 0, 3.0, -0.55); libAdd(tl, box(0.3, 0.06, 0.06, std(0xd8d8d8, { metalness: 0.9 })), 0.4, 2.7, -0.22); }
  // TP holder + roll
  add(cyl(0.22, 0.22, 0.4, std(0xffffff)), -4.3, 2.5, -4.65).rotation.z = Math.PI / 2;
  // bathtub with shower curtain (right)
  { const tb = new THREE.Group(); add(tb, 4.7, 0, -3.2); const pm = std(0xffffff, { roughness: 0.15 });
    libAdd(tb, box(5.4, 2.0, 3.0, pm, 0.35), 0, 1.0, 0); libAdd(tb, box(5.0, 0.3, 2.6, std(0x9fd8f2, { transparent: true, opacity: 0.8, roughness: 0.05 }), 0.2), 0, 1.75, 0);
    // bubbles
    const r = seeded(5); for (let i = 0; i < 22; i++) libAdd(tb, sph(0.12 + r() * 0.18, std(0xffffff, { transparent: true, opacity: 0.9, roughness: 0.2 })), -2.2 + r() * 4.4, 1.95 + r() * 0.15, -1.1 + r() * 2.2);
    // rubber duck
    const duck = new THREE.Group(); libAdd(tb, duck, -1.6, 2.0, 1.25); const dm = std(0xffd23f, { roughness: 0.3 }); libAdd(duck, sph(0.22, dm), 0, 0.12, 0).scale.set(1.3, 1, 1); libAdd(duck, sph(0.15, dm), 0.15, 0.36, 0); libAdd(duck, sph(0.07, std(0xff8a1c)), 0.3, 0.34, 0).scale.set(1.4, 0.6, 1);
    libAdd(tb, cyl(0.035, 0.035, 5.6, std(0xd8d8d8, { metalness: 0.9 })), 0, 8.4, 1.5).rotation.z = Math.PI / 2;
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 6.0, 24, 1), new THREE.MeshStandardMaterial({ map: canvasTex(256, 512, (g) => { g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#2f6f73'; for (let y = 0; y < 512; y += 64) for (let x = 0; x < 256; x += 64) { g.beginPath(); g.ellipse(x + 32 + (y / 64 % 2) * 16, y + 32, 10, 18, 0.5, 0, 7); g.fill(); } }), side: THREE.DoubleSide, roughness: 1 }));
    const pos = curtain.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 6) * 0.15); curtain.geometry.computeVertexNormals();
    libAdd(tb, curtain, 1.5, 5.4, 1.5); }
  // towels on rack + bath mat + laundry basket + shelf
  add(cyl(0.04, 0.04, 2.6, std(0xd8d8d8, { metalness: 0.9 })), 7.75, 5.6, -1.0).rotation.x = Math.PI / 2;
  for (const [z, c] of [[-1.8, 0xe2a33a], [-0.3, 0xffffff]]) { const tw = box(0.25, 2.4, 1.2, std(c, { roughness: 1 }), 0.1); add(tw, 7.7, 4.5, z); }
  add(box(2.4, 0.06, 1.4, std(0x7fc8c4, { roughness: 1 }), 0.03), V.x, 0.03, -2.2);
  { const bk = new THREE.Group(); add(bk, 6.8, 0, 1.6); libAdd(bk, cyl(0.7, 0.6, 1.6, std(0xc59a6a, { roughness: 1 }), 24), 0, 0.8, 0); libAdd(bk, sph(0.5, std(0x3d6fb6, { roughness: 1 })), 0.1, 1.6, 0.1).scale.set(1, 0.5, 1); }
  add(box(2.4, 0.12, 0.7, std(0xc59a6a)), 2.0, 6.4, WALLZ + 0.4);
  for (let i = 0; i < 4; i++) add(cyl(0.14, 0.14, 0.5 + (i % 2) * 0.2, std([0xffffff, 0x2f6f73, 0xffc2d1, 0xe2a33a][i], { roughness: 0.3 })), 1.2 + i * 0.5, 6.75 + (i % 2) * 0.1, WALLZ + 0.4);
  plant(add, 6.2, 0, -1.0, 0.8, 0x2f7a4a, 0xf2ece0, 17);
  frameArt(add, 1.4, 1.8, -5.6, 7.0, (g, w, h) => { g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f6f73'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w / 2, h * 0.4, w, h); g.fill(); g.fillStyle = '#e2a33a'; g.beginPath(); g.arc(w * 0.7, h * 0.3, 30, 0, 7); g.fill(); }, 0xc59a6a);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 24), std(0xd8d8d8, { metalness: 0.9, roughness: 0.2 })), 1.4, 4.0, WALLZ + 0.3);
  add(box(0.7, 1.4, 0.2, std(0xffc2d1, { roughness: 1 }), 0.08), 1.4, 3.3, WALLZ + 0.4);
  { const hp = new THREE.Group(); add(hp, -3.6, 9.4, -4.2); libAdd(hp, cyl(0.4, 0.3, 0.5, std(0xffffff)), 0, 0, 0); const r = seeded(40);
    for (let i = 0; i < 9; i++) { const vine = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 1.2 + r() * 1.4, 4, 8), std(0x3f9a5a)); const a = i / 9 * Math.PI * 2; libAdd(hp, vine, Math.cos(a) * 0.35, -0.9 - r() * 0.5, Math.sin(a) * 0.35); for (let k = 0; k < 4; k++) { const lf = sph(0.12, std(0x5aa36b)); lf.scale.set(1, 0.5, 0.3); libAdd(hp, lf, Math.cos(a) * 0.4, -0.4 - k * 0.45, Math.sin(a) * 0.4 + 0.05); } } }
  G.add(new THREE.PointLight(0xffffff, night ? 8 : 16, 22, 1.2).translateX(0).translateY(10).translateZ(2));
  outdoors(G, o.time, 5);
  return {
    miguel: { pos: [-1.5, 0, -1.6], rotY: 0.45, pose: 'stand', lookC: 0.5, lookCam: 0.12 },
    clapy: { pos: [2.4, 6.2, -1.8], rotY: -0.35 },
    screen: { holo: true, center: [1.6, 8.6, -3.0], w: 3.4, h: 2.0, hshot: 5.6, az: 0.0 },
    crowdSpots: [[3.0, 2.0, -3.2, 0.7, 0.2], [5.0, 2.0, -2.8, 0.7, -0.4], [6.4, 2.0, -3.4, 0.7, 0.5], [-5.6, 1.62, -3.4, 0.7, 0.4], [1.6, 0, -1.2, 1.0, -0.3], [3.4, 0, -0.6, 1.0, -0.8], [5.4, 0, 0.2, 1.0, -1.4], [-4.0, 0, -1.4, 1.0, 0.6], [-6.4, 0, 0.6, 1.1, 0.8], [-3.6, 0, 2.6, 1.2, 0.3], [-0.6, 0, 3.0, 1.2, 0.0], [2.2, 0, 2.8, 1.2, -0.4], [4.8, 0, 2.6, 1.2, -0.8], [0.0, 2.76, -3.6, 0.6, 0.1]],
    wide: { t: [0.4, 5.2, -1.2], h: 14.5 },
  };
}

export const ROOMS = { cuarto, sala, comedor, bano };
