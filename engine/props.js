import { THREE, std, box, cyl, sph, add, seeded, INK, canvasTex } from './lib.js';

const DOG_COLS = [[0.62, 0.42, 0.25], [0.85, 0.72, 0.52], [0.55, 0.55, 0.58], [0.95, 0.93, 0.88], [0.30, 0.22, 0.18], [0.80, 0.55, 0.30]];

function dog(r) {
  const col = new THREE.Color(...DOG_COLS[r() * DOG_COLS.length | 0]); const mat = std(col); const dark = std(col.clone().multiplyScalar(0.65)); const snoutMat = std(col.clone().lerp(new THREE.Color(1, 1, 1), 0.25)); const inkM = std(INK, { roughness: 0.4 });
  const g = new THREE.Group(); const p = {};
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.62, 6, 16), mat); body.rotation.z = Math.PI / 2; body.position.y = 0.5; g.add(body);
  p.legs = [-0.32, -0.16, 0.18, 0.34].map((lx, i) => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 4, 8), mat); l.position.set(lx, 0.22, i % 2 ? -0.12 : 0.12); g.add(l); return l; });
  const tail = new THREE.Group(); const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), mat); tm.position.y = 0.22; tail.add(tm); tail.position.set(-0.5, 0.62, 0); g.add(tail); p.tail = tail;
  const head = new THREE.Group(); head.position.set(0.58, 0.88, 0); g.add(head); p.head = head;
  head.add(sph(0.3, mat)); const sn = sph(0.16, snoutMat); sn.scale.set(1.3, 0.9, 1); sn.position.set(0.24, -0.08, 0.06); head.add(sn);
  const nose = sph(0.06, inkM); nose.position.set(0.44, -0.04, 0.06); head.add(nose);
  for (const z of [-0.14, 0.14]) { const e = sph(0.045, inkM); e.position.set(0.17, 0.08, z + 0.07); head.add(e); }
  p.ears = [-0.2, 0.2].map(z => { const e = sph(0.13, dark); e.scale.set(0.6, 1.5, 0.35); e.position.set(-0.05, 0.12, z); e.rotation.x = z > 0 ? -0.5 : 0.5; head.add(e); return e; });
  const tongue = sph(0.07, std(0xf06680)); tongue.scale.set(0.8, 1.5, 0.6); tongue.position.set(0.3, -0.22, 0.06); head.add(tongue); p.tongue = tongue;
  return { g, scale: 1.2, update(t, ex, ph) {
    p.tail.rotation.z = -0.6 + Math.sin(t * 14 + ph) * (0.5 + 0.3 * ex); p.tail.rotation.x = Math.sin(t * 14 + ph) * 0.5;
    p.head.rotation.z = Math.sin(t * 1.3 + ph) * 0.12 + ex * 0.25; p.head.rotation.x = Math.sin(t * 0.9 + ph) * 0.1;
    p.ears.forEach((e, i) => e.rotation.z = Math.sin(t * 6 + ph + i) * 0.15 * (0.3 + ex));
    p.tongue.visible = ex > 0.2 || Math.sin(t * 0.5 + ph) > 0.6; p.legs.forEach((l, i) => l.rotation.z = Math.sin(t * 8 + i * 2) * 0.25 * ex); } };
}

const tapeTex = () => canvasTex(128, 128, (g) => { g.fillStyle = '#c8955a'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 20; i++) g.fillRect(0, i * 7, 128, 1); g.fillStyle = '#e6c890'; g.fillRect(54, 0, 20, 128); });
let _tape;
function parcel(r) {
  const g = new THREE.Group(); _tape ||= tapeTex();
  const w = 0.6 + r() * 0.6, h = 0.4 + r() * 0.5, d = 0.5 + r() * 0.5;
  const b = box(w, h, d, std(0xffffff, { map: _tape, roughness: 0.9 }), 0.03); b.position.y = h / 2; g.add(b);
  if (r() < 0.6) { const lab = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.4, h * 0.35), std(0xffffff)); lab.position.set(-w * 0.15, h * 0.55, d / 2 + 0.002); g.add(lab); }
  return { g, scale: 1, update() {} };   // las cajas son objetos: no se mueven
}
function cake(r) {
  const g = new THREE.Group(); const cols = [0xffc2d1, 0xfff1d6, 0x8a5a3a, 0xc9f0d0, 0xe0c8ff];
  const plate = cyl(0.42, 0.42, 0.04, std(0xffffff, { roughness: 0.3 }), 32); plate.position.y = 0.02; g.add(plate);
  const tiers = r() < 0.4 ? 2 : 1; let y = 0.04;
  for (let i = 0; i < tiers; i++) { const rad = 0.34 - i * 0.1; const c = cyl(rad, rad, 0.3, std(cols[r() * cols.length | 0], { roughness: 0.6 }), 32); c.position.y = y + 0.15; g.add(c);
    const icing = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.035, 8, 32), std(0xffffff, { roughness: 0.5 })); icing.rotation.x = Math.PI / 2; icing.position.y = y + 0.3; g.add(icing); y += 0.3; }
  const cherry = sph(0.06, std(0xd62839, { roughness: 0.3 })); cherry.position.y = y + 0.05; g.add(cherry);
  if (r() < 0.6) for (let k = 0; k < 3; k++) { const c = cyl(0.015, 0.015, 0.18, std([0x4db8ff, 0xffd36b, 0xff7a9a][k])); c.position.set(Math.cos(k * 2.1) * 0.15, y + 0.09, Math.sin(k * 2.1) * 0.15); g.add(c); }
  return { g, scale: 1.1, update() {} };   // los pasteles son objetos: no brincan
}
const MAKERS = { dog, box: parcel, cake };

export function makeCrowd(scene, crowd, spots, seed = 4) {
  if (!crowd || !MAKERS[crowd.type]) return { update() {} };
  const r = seeded(seed); const list = [];
  const n = Math.min(crowd.count || spots.length, spots.length);
  for (let i = 0; i < n; i++) {
    const [x, y, z, s, ry] = spots[i]; const o = MAKERS[crowd.type](r);
    o.g.position.set(x, y, z); o.g.userData.baseY = y; o.g.scale.setScalar((s || 1) * o.scale); o.g.rotation.y = ry || 0;
    o.g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(o.g);
    list.push({ o, ph: r() * 6, y });
  }
  return { update(t, ex) { for (const { o, ph, y } of list) { if (crowd.type === 'dog') o.g.position.y = y + Math.abs(Math.sin(t * 9 + ph)) * 0.3 * ex; o.update(t, ex, ph); } } };
}
