import { THREE, ease, rad, rr, glowSprite } from './lib.js';
import { ROOMS } from './rooms.js';
import { makeMiguel, makeClapy } from './characters.js';
import { makeCrowd } from './props.js';

const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const EP = await (await fetch(params.get('data') || '../work/render_data.json')).json();
const AV = await (await fetch('../assets/avatar.json')).json();
const TL = EP.tl;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = EP.time === 'day' ? 1.05 : 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 400);
const day = EP.time === 'day';
scene.add(new THREE.HemisphereLight(day ? 0xbfd8ff : 0x7a80d0, day ? 0x6a5040 : 0x2a1818, day ? 1.0 : 0.7));
const key = new THREE.DirectionalLight(day ? 0xfff4e0 : 0xffe6cc, day ? 1.7 : 1.3); key.position.set(6, 14, 14); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -13, right: 13, top: 14, bottom: -4, far: 60 }); key.shadow.bias = -0.0006; key.shadow.radius = 4; scene.add(key);
const rim = new THREE.DirectionalLight(day ? 0xfff0d0 : 0x9db0ff, day ? 1.6 : 1.3); rim.position.set(-6, 10, -20); scene.add(rim);

// screen canvas (monitor / TV / tablet / hologram)
const scrCanvas = document.createElement('canvas'); scrCanvas.width = 1160; scrCanvas.height = 666;
const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace;
const room = ROOMS[EP.room || 'cuarto'](scene, { screenTex: scrTex, time: EP.time || 'night' });
let holo = null;
if (room.screen.holo) {
  const s = room.screen; holo = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  holo.position.set(...s.center); scene.add(holo); const hg = glowSprite(0x30d0e0, s.w * 1.8, s.h * 1.8, 0.3); hg.position.set(s.center[0], s.center[1], s.center[2] - 0.1); scene.add(hg); holo.userData.glow = hg;
}
const miguel = makeMiguel(scene, AV, room.miguel);
const clapy = makeClapy(scene, room.clapy);
const crowd = makeCrowd(scene, EP.crowd, room.crowdSpots, 7);
scene.updateMatrixWorld(true);
const mh = miguel.headWorld();
const cp = new THREE.Vector3(...room.clapy.pos), sc = new THREE.Vector3(...room.screen.center);
const SHOTS = {
  wide: { t: room.wide.t, h: room.wide.h, az: 0 },
  m_cu: { t: [mh.x, mh.y + 0.55, mh.z], h: 5.0, az: room.miguel.rotY * 0.55 },
  m_ms: { t: [mh.x + 0.3, mh.y - 0.9, mh.z], h: 6.6, az: room.miguel.rotY * 0.3 },
  c_cu: { t: [cp.x - 0.2, cp.y - 0.2, cp.z], h: 4.0, az: room.clapy.rotY ?? -0.2 },
  c_ms: { t: [(cp.x + sc.x) / 2, (cp.y + sc.y) / 2 - 0.4, (cp.z + sc.z) / 2], h: 7.6, az: -0.1 },
  screen: { t: [sc.x, sc.y + (room.screen.hshot || room.screen.h) * 0.16, sc.z], h: (room.screen.hshot || room.screen.h) * 1.05, az: room.screen.az || 0 },
};
const ALIAS = { beto_cu: 'm_cu', beto_ms: 'm_ms', chispa_cu: 'c_cu', chispa_ms: 'c_ms', panel: 'screen' };
function updateCamera(L, t) {
  const S = SHOTS[ALIAS[L.shot] || L.shot] || SHOTS.wide; const p = (t - L.start) / (L.end - L.start);
  const h = S.h / (1 + 0.045 * p); const dist = (h / 2) / Math.tan(rad(15));
  const tx = S.t[0] + Math.sin(t * 0.7) * 0.05, ty = S.t[1] + Math.cos(t * 0.6) * 0.04, tz = S.t[2];
  camera.position.set(tx + Math.sin(S.az) * dist, ty + dist * 0.06, tz + Math.cos(S.az) * dist); camera.lookAt(tx, ty, tz);
}

// ---------- screen drawing ----------
const SCR = EP.screen || { title: 'Mi negocio', subtitle: '', icon: 'star' };
const firstStatus = TL.find(l => l.status);
function icon(g, kind, x, y, col, bg) {
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 44, 0, 7); g.fill(); g.fillStyle = bg; g.strokeStyle = bg;
  if (kind === 'paw') { g.beginPath(); g.ellipse(x, y + 12, 16, 13, 0, 0, 7); g.fill(); for (const [dx, dy] of [[-18, -10], [-7, -22], [7, -22], [18, -10]]) { g.beginPath(); g.ellipse(x + dx, y + dy, 6, 8, 0, 0, 7); g.fill(); } }
  else if (kind === 'cake') { g.fillRect(x - 22, y - 2, 44, 22); g.fillRect(x - 14, y - 16, 28, 14); g.fillRect(x - 2, y - 28, 4, 10); }
  else if (kind === 'box') { g.fillRect(x - 22, y - 18, 44, 38); g.fillStyle = col; g.fillRect(x - 3, y - 18, 6, 38); }
  else if (kind === 'money') { g.font = 'bold 54px Inter'; g.fillText('$', x - 15, y + 19); }
  else { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
}
function drawScreen(L, t) {
  const g = scrCanvas.getContext('2d'); const Wc = 1160, Hc = 666; g.clearRect(0, 0, Wc, Hc);
  const st = L.status; const a = st && firstStatus ? ease((t - firstStatus.start - 0.2) / 0.4) : 0;
  if (!holo) {
    const gr = g.createLinearGradient(0, 0, Wc, Hc); gr.addColorStop(0, '#1a1440'); gr.addColorStop(1, '#3a1d4a'); g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, Hc - 44, Wc, 44); for (let i = 0; i < 6; i++) { g.fillStyle = ['#ff7a59', '#4db8ff', '#7ee787', '#ffd36b', '#d2a8ff', '#fff'][i]; rr(g, 440 + i * 46, Hc - 36, 30, 28, 6); g.fill(); }
    if (a <= 0) { g.fillStyle = 'rgba(255,255,255,0.08)'; rr(g, 60, 50, Wc - 120, Hc - 140, 22); g.fill(); g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(110, 100, 22, 0, 7); g.fill(); g.font = 'bold 30px Inter'; g.fillStyle = '#fff'; g.fillText('Clapy', 145, 111);
      g.fillStyle = 'rgba(255,255,255,0.15)'; for (let i = 0; i < 4; i++) { rr(g, i % 2 ? 420 : 100, 160 + i * 90, 560, 60, 18); g.fill(); } scrTex.needsUpdate = true; return; }
  } else { if (holo) { holo.visible = a > 0; holo.userData.glow.visible = a > 0; } if (a <= 0) { scrTex.needsUpdate = true; return; } }
  const flick = holo ? 0.9 + 0.1 * Math.sin(t * 40) : 1;
  g.save(); g.globalAlpha = a * flick; g.translate(Wc / 2, Hc / 2 - (holo ? 0 : 20)); const s0 = (0.9 + 0.1 * a) * (holo ? 1.55 : 1.45); g.scale(s0, s0); g.translate(-290, -210);
  const cyan = 'rgb(77,242,242)';
  g.fillStyle = 'rgba(15,51,66,0.92)'; rr(g, 2, 2, 576, 416, 28); g.fill(); g.lineWidth = 4; g.strokeStyle = cyan; g.stroke();
  icon(g, SCR.icon, 80, 82, cyan, 'rgb(15,51,66)');
  g.font = 'bold 46px Inter'; g.fillStyle = '#fff'; g.fillText(SCR.title, 150, 72, 410); g.font = '32px Inter'; g.fillStyle = cyan; g.fillText(SCR.subtitle || '', 150, 122, 410);
  g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(30, 170, 520, 3);
  const prev = L.i > 0 ? JSON.stringify(TL[L.i - 1].status) : null; const k = (L.i > 0 && prev !== JSON.stringify(st)) ? ease((t - L.start) / 0.3) : 1;
  const S = typeof st === 'string' ? { text: st } : st;
  if (S.kind === 'stamp') {
    (S.lines || []).forEach((ln, i) => { g.font = '38px Inter'; g.fillStyle = ln.includes('★') ? 'rgb(255,217,77)' : '#fff'; g.fillText(ln, 40, 240 + i * 60, 500); });
    g.save(); g.translate(430, 330); g.rotate(-0.18); const s = 1.6 - 0.6 * k; g.scale(s, s); g.globalAlpha = a * k; g.strokeStyle = 'rgb(255,77,90)'; g.lineWidth = 7; rr(g, -120, -48, 240, 90, 14); g.stroke(); g.font = '900 56px Inter'; g.fillStyle = 'rgb(255,77,90)'; const tw = g.measureText(S.text).width; g.fillText(S.text, -tw / 2, 22, 220); g.restore();
  } else {
    g.save(); g.translate(0, (1 - k) * 30); g.globalAlpha = a * k * flick; g.font = 'bold 40px Inter'; g.fillStyle = S.kind === 'stars' ? 'rgb(255,217,77)' : '#fff'; g.fillText(S.text, 40, 260, S.kind === 'check' ? 430 : 500);
    if (S.kind === 'check') { g.strokeStyle = 'rgb(102,255,153)'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(490, 245); g.lineTo(512, 268); g.lineTo(550, 222); g.stroke(); }
    if (S.kind === 'slots') { g.fillStyle = cyan; for (let i = 0; i < (S.n || 5); i++) { rr(g, 40 + i * 56, 300, 44, 44, 10); g.fill(); } }
    if (S.kind === 'progress') { g.fillStyle = 'rgba(255,255,255,0.15)'; rr(g, 40, 310, 500, 26, 13); g.fill(); g.fillStyle = cyan; rr(g, 40, 310, 500 * Math.min(1, (t - L.start) / 1.5 + 0.3), 26, 13); g.fill(); }
    if (S.note) { g.font = '28px Inter'; g.fillStyle = 'rgb(204,242,255)'; g.fillText(S.note, 40, 398, 500); }
    g.restore();
  }
  g.restore(); scrTex.needsUpdate = true;
}

window.renderFrame = function (idx) {
  const F = EP.frames[idx]; const L = TL[F.i]; const t = F.t;
  updateCamera(L, t); miguel.update(F, L, t); clapy.update(F, L, t); crowd.update(t, F.ex); drawScreen(L, t);
  if (holo) holo.position.y = room.screen.center[1] + Math.sin(t * 1.1) * 0.05;
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/jpeg', 0.93);
};
await document.fonts.load('bold 40px Inter');
window.READY = true;
