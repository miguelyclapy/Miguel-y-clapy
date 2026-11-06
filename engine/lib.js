import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE, RoundedBoxGeometry };

export const INK = 0x1b1a24;
export const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const rad = d => d * Math.PI / 180;
export function seeded(s) { s = Math.max(1, s | 0); return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
export const rgb = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`;
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
export const box = (w, h, d, mat, r = 0) => new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d), mat);
export const cyl = (rt, rb, h, mat, seg = 24) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
export const sph = (r, mat, ws = 24, hs = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
export function add(parent, m, x = 0, y = 0, z = 0) { m.position.set(x, y, z); m.traverse?.(o => { if (o.isMesh && o.userData.noShadow !== true) { o.castShadow = true; o.receiveShadow = true; } }); parent.add(m); return m; }
export const UP = new THREE.Vector3(0, 1, 0);
export function limb(r, mat, parent) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 1, 20), mat); c.castShadow = true; g.add(c); g.userData.c = c; parent.add(g); return g; }
export function setLimb(g, a, b) { const d = new THREE.Vector3().subVectors(b, a); const len = d.length(); g.position.copy(a).addScaledVector(d, 0.5); g.quaternion.setFromUnitVectors(UP, d.normalize()); g.userData.c.scale.set(1, len, 1); }
let _glow;
export function glowTex() { return _glow ||= canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }); }
export function glowSprite(color, sx, sy, opacity = 0.3) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(sx, sy, 1); return s; }
export function planks(base, seed = 5, rows = 8) {
  const t = canvasTex(1024, 1024, (g, w, h) => { const r = seeded(seed); const rh = h / rows;
    for (let i = 0; i < rows; i++) { const c = base.map(v => v + (r() - 0.5) * 0.06); g.fillStyle = rgb(c); g.fillRect(0, i * rh, w, rh);
      for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.06})`; g.lineWidth = 1 + r() * 2; const yy = i * rh + r() * rh; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(w * .3, yy + r() * 6 - 3, w * .6, yy + r() * 6 - 3, w, yy); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(0, i * rh, w, 4); g.fillRect(r() * w, i * rh, 4, rh); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function tiles(c1, c2, grout = '#d8d4cc', n = 8, seed = 3) {
  const t = canvasTex(512, 512, (g, w, h) => { const r = seeded(seed); const s = w / n; g.fillStyle = grout; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 && c2 ? c2 : c1; g.globalAlpha = 0.9 + r() * 0.1; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i * s + 5, j * s + 5, s - 10, 6); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function wallpaper(bg, fg, kind = 'dots', seed = 2) {
  const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.strokeStyle = fg;
    if (kind === 'dots') for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(32 + i * 64 + (j % 2) * 32, 32 + j * 64, 5, 0, 7); g.fill(); }
    if (kind === 'stripes') for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 12, h);
    if (kind === 'leaves') { const r = seeded(seed); for (let i = 0; i < 14; i++) { g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 6); g.beginPath(); g.ellipse(0, 0, 6, 16, 0, 0, 7); g.fill(); g.restore(); } } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
