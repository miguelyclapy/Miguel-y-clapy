import { THREE, std, box, cyl, sph, add, seeded, rad, limb, setLimb, UP, glowSprite } from './lib.js';

// ================= MIGUEL =================
export function makeMiguel(scene, AV, anchor) {
  const skin = std(AV.skin, { roughness: 0.6 }), hairMat = std(AV.hair, { roughness: 0.8 });
  const topMat = std(AV.top, { roughness: 0.85 }), pantsMat = std(AV.pants, { roughness: 0.85 }), shoeMat = std(AV.shoes, { roughness: 0.5 });
  const root = new THREE.Group(); scene.add(root);
  root.position.set(...anchor.pos); root.rotation.y = anchor.rotY || 0;
  const avatar = new THREE.Group(); root.add(avatar);
  const standing = anchor.pose === 'stand';
  const hipY = 2.55;
  if (standing) {
    avatar.position.y = 0.72;
    for (const s of [-1, 1]) {
      const hip = new THREE.Vector3(s * 0.32, hipY - 0.1, -0.2), knee = new THREE.Vector3(s * 0.34, 1.05, -0.12), ank = new THREE.Vector3(s * 0.36, -0.42, -0.18);
      setLimb(limb(0.3, pantsMat, avatar), hip, knee); add(avatar, sph(0.3, pantsMat), knee.x, knee.y, knee.z); setLimb(limb(0.26, pantsMat, avatar), knee, ank);
      add(avatar, box(0.48, 0.32, 0.8, shoeMat, 0.14), s * 0.36, -0.55, 0.0); add(avatar, box(0.5, 0.08, 0.82, std(0xf4f4f4), 0.03), s * 0.36, -0.69, 0.0);
    }
  } else {
    for (const s of [-1, 1]) {
      setLimb(limb(0.3, pantsMat, avatar), new THREE.Vector3(s * 0.36, hipY, -0.2), new THREE.Vector3(s * 0.42, hipY, 1.15));
      add(avatar, sph(0.3, pantsMat), s * 0.42, hipY, 1.15);
      setLimb(limb(0.26, pantsMat, avatar), new THREE.Vector3(s * 0.42, hipY, 1.15), new THREE.Vector3(s * 0.46, 0.35, 1.3));
      add(avatar, box(0.48, 0.32, 0.8, shoeMat, 0.14), s * 0.46, 0.18, 1.48); add(avatar, box(0.5, 0.08, 0.82, std(0xf4f4f4), 0.03), s * 0.46, 0.04, 1.48);
    }
  }
  add(avatar, box(1.05, 0.6, 0.9, pantsMat, 0.28), 0, hipY, -0.15);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 1.1, 8, 24), topMat); torso.scale.set(1.05, 1, 0.78); add(avatar, torso, 0, 3.55, -0.2);
  const hood = new THREE.Group(); avatar.add(hood); hood.position.set(0, 3.55, -0.2);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 12, 24), topMat); hd.rotation.x = Math.PI / 2 - 0.3; add(hood, hd, 0, 0.9, -0.15);
  add(hood, box(0.8, 0.38, 0.1, std(new THREE.Color(AV.top).multiplyScalar(0.85).getHex()), 0.06), 0, -0.5, 0.53);
  for (const sx of [-1, 1]) { const st = add(hood, cyl(0.025, 0.025, 0.5, std(0xffffff)), sx * 0.14, 0.55, 0.58); st.rotation.x = 0.15; add(hood, sph(0.04, std(0xffffff)), sx * 0.14, 0.29, 0.62); }
  const mkArm = () => ({ up: limb(0.19, topMat, avatar), fo: limb(0.155, topMat, avatar), el: add(avatar, sph(0.175, topMat)), sh: add(avatar, sph(0.23, topMat)), hand: add(avatar, sph(0.18, skin)), cuff: add(avatar, sph(0.16, topMat)) });
  const arms = { la: mkArm(), ra: mkArm() };
  add(avatar, cyl(0.2, 0.22, 0.4, skin), 0, 4.55, -0.2);
  const head = new THREE.Group(); add(avatar, head, 0, 5.3, -0.15);
  const skull = sph(0.72, skin, 48, 32); skull.scale.set(0.92, 1.1, 0.98); add(head, skull);
  const jaw = sph(0.6, skin, 40, 24); jaw.scale.set(0.86, 0.86, 0.92); add(head, jaw, 0, -0.3, 0.06);
  const chin = sph(0.2, skin); chin.scale.set(1.1, 0.75, 0.85); add(head, chin, 0, -0.6, 0.3);
  for (const s of [-1, 1]) { const ear = sph(0.2, skin); ear.scale.set(0.5, 1.05, 0.8); add(head, ear, s * 0.68, 0.0, -0.02); ear.rotation.y = s * 0.35; }
  const nose = sph(0.095, std(new THREE.Color(AV.skin).multiplyScalar(0.92).getHex(), { roughness: 0.6 })); nose.scale.set(0.85, 1, 1); add(head, nose, 0, -0.08, 0.72);
  const eyeWhite = std(0xffffff, { roughness: 0.2 }), irisMat = std(AV.eyes, { roughness: 0.3 }), pupilMat = std(0x080808, { roughness: 0.2 });
  const eyes = [-1, 1].map(s => { const g = new THREE.Group(); add(head, g, s * 0.26, 0.1, 0.6); g.add(sph(0.135, eyeWhite));
    const iris = sph(0.085, irisMat); iris.position.z = 0.075; iris.scale.z = 0.5; g.add(iris); const p = sph(0.045, pupilMat); p.position.z = 0.105; p.scale.z = 0.4; g.add(p);
    const hl = sph(0.022, new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.03, 0.035, 0.125); g.add(hl);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), skin); lid.rotation.x = -0.2; g.add(lid);
    return { g, iris, p, hl, lid }; });
  const brows = [-1, 1].map(s => { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), hairMat); b.rotation.z = Math.PI / 2; add(head, b, s * 0.27, 0.36, 0.64); return b; });
  const mCanvas = document.createElement('canvas'); mCanvas.width = 256; mCanvas.height = 128;
  const mTex = new THREE.CanvasTexture(mCanvas); mTex.colorSpace = THREE.SRGBColorSpace;
  const mouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: mTex, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -4 }));
  mouthMesh.userData.noShadow = true; add(head, mouthMesh, 0, -0.38, 0.62); mouthMesh.rotation.x = 0.25; mouthMesh.castShadow = false;
  for (const sx of [-1, 1]) { const f = sph(0.32, new THREE.MeshStandardMaterial({ color: AV.hair, roughness: 0.95, transparent: true, opacity: 0.5 })); f.scale.set(0.35, 0.7, 1.2); add(head, f, sx * 0.6, 0.32, -0.15); }
  { const hm = std(AV.hair, { roughness: 0.85 });
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.775, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hm); base.scale.set(0.95, 1.05, 1.03); base.rotation.x = -0.42; add(head, base, 0, 0.12, -0.06);
    const back = sph(0.74, hm, 40, 24); back.scale.set(0.93, 0.95, 0.9); add(head, back, 0, 0.05, -0.18);
    const r = seeded(11);
    const Q = [[-0.34, 0.62, 0.42, 0.22], [-0.17, 0.7, 0.46, 0.25], [0.0, 0.74, 0.47, 0.27], [0.17, 0.72, 0.45, 0.26], [0.33, 0.64, 0.4, 0.22], [-0.25, 0.86, 0.22, 0.25], [0.0, 0.92, 0.25, 0.27], [0.22, 0.88, 0.2, 0.25], [-0.12, 0.92, -0.05, 0.26], [0.14, 0.9, -0.08, 0.25], [0.0, 0.84, -0.32, 0.24]];
    for (const [x, y, z, rr_] of Q) { const b = sph(rr_, hm, 20, 14); b.scale.set(0.9, 0.75, 1.6); b.rotation.x = -0.75 + r() * 0.2; b.rotation.y = 0.25 + r() * 0.2; b.rotation.z = (r() - 0.5) * 0.3; add(head, b, x + 0.06, y, z); }
    for (let k = 0; k < 5; k++) { const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 10), hm); tip.rotation.x = -0.5; tip.rotation.z = 0.35 - k * 0.12; add(head, tip, -0.3 + k * 0.17 + 0.06, 0.9 + (k % 2) * 0.05, 0.5); }
    for (const sx of [-1, 1]) { const sb = sph(0.12, hm); sb.scale.set(0.35, 1.2, 0.6); add(head, sb, sx * 0.66, 0.08, 0.18); } }

  const BROW = { neutral: [0.36, 0.0, 0.0], shock: [0.46, 0.12, -0.12], angry: [0.31, -0.32, 0.32], confused: [0.36, 0.0, 0.25], sus: [0.32, -0.12, 0.12], happy: [0.4, 0.1, -0.1] };
  function drawMouth(face, m) {
    const g = mCanvas.getContext('2d'); g.clearRect(0, 0, 256, 128); g.save(); g.translate(128, 54);
    g.strokeStyle = '#3a1a1a'; g.fillStyle = '#5a1e26'; g.lineCap = 'round'; g.lineWidth = 9;
    if (m > 0.05) { g.beginPath(); g.ellipse(0, 4, 34 + m * 8, 8 + m * 34, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.fillRect(-24, -6 - m * 26, 48, 9); g.fillStyle = '#e0707e'; g.beginPath(); g.ellipse(0, 10 + m * 22, 20, 8, 0, 0, 7); g.fill(); }
    else if (face === 'shock') { g.beginPath(); g.ellipse(0, 6, 18, 24, 0, 0, 7); g.fill(); }
    else if (face === 'angry') { g.beginPath(); g.moveTo(-34, 14); g.bezierCurveTo(-12, -4, 12, -4, 34, 14); g.stroke(); }
    else if (face === 'confused') { g.beginPath(); g.moveTo(-32, 8); g.bezierCurveTo(-10, -6, 10, 22, 32, 2); g.stroke(); }
    else if (face === 'sus') { g.beginPath(); g.moveTo(-30, 6); g.lineTo(30, 2); g.stroke(); }
    else { g.beginPath(); g.moveTo(-34, -2); g.bezierCurveTo(-12, 26, 12, 26, 34, -2); g.stroke(); }
    g.restore(); mTex.needsUpdate = true;
  }
  const vec = (a, l) => [Math.sin(rad(a)) * l, -Math.cos(rad(a)) * l];
  function update(F, L, t) {
    const breathe = Math.sin(t * 2.2) * 0.03, bounce = -F.jump / 100 * 0.4;
    torso.position.y = 3.55 + breathe + bounce; hood.position.y = 3.55 + breathe + bounce; head.position.y = 5.3 + breathe + bounce;
    const shY = 4.25 + breathe + bounce;
    for (const [k, s, hi] of [['la', -1, 0], ['ra', 1, 1]]) {
      const A = arms[k]; const [a1, a2] = F[k]; const wob = Math.sin(t * 2.2 + hi) * 2;
      const sh = new THREE.Vector3(s * 0.72, shY, -0.2);
      const [dx, dy] = vec(a1 + wob, 1.1); const el = sh.clone().add(new THREE.Vector3(dx, dy, 0.25));
      const [dx2, dy2] = vec(a2 + wob, 1.0); const hand = el.clone().add(new THREE.Vector3(dx2, dy2, 0.3));
      setLimb(A.up, sh, el); setLimb(A.fo, el, hand); A.el.position.copy(el); A.sh.position.copy(sh); A.hand.position.copy(hand); A.cuff.position.copy(el.clone().lerp(hand, 0.88));
    }
    const look = L.who === 'M' ? (anchor.lookCam ?? 0.15) : (anchor.lookC ?? 0.45);
    head.rotation.set(-0.05 + Math.sin(t * 1.3) * 0.03, look + Math.sin(t * 0.8) * 0.05, Math.sin(t * 1.6) * 0.04 + (L.face === 'confused' ? 0.12 : 0));
    const blink = (t % 3.7) < 0.12, fc = L.face;
    const eyeOpen = blink ? 0.08 : fc === 'shock' ? 1.15 : fc === 'sus' ? 0.45 : fc === 'happy' ? 0.7 : 1;
    for (const e of eyes) { e.g.scale.set(fc === 'shock' ? 1.12 : 1, eyeOpen > 0.9 ? eyeOpen : 1, 1); e.lid.visible = eyeOpen < 0.9; e.lid.rotation.x = -0.2 + (1 - eyeOpen) * 1.4 - 1.2 * (eyeOpen < 0.9 ? 0 : 1);
      const lx = L.who === 'C' ? 0.025 : 0.0; e.iris.position.x = lx; e.p.position.x = lx; e.hl.position.x = 0.03 + lx; }
    const [by, inA, inB] = BROW[fc] || BROW.neutral;
    brows[0].position.y = by; brows[1].position.y = by + (fc === 'confused' ? 0.08 : 0); brows[0].rotation.z = Math.PI / 2 + inA; brows[1].rotation.z = Math.PI / 2 + inB;
    drawMouth(fc, F.mm);
  }
  function headWorld() { return head.getWorldPosition(new THREE.Vector3()); }
  return { root, update, headWorld };
}

// ================= CLAPY =================
export function makeClapy(scene, anchor) {
  const root = new THREE.Group(); scene.add(root);
  const orange = new THREE.MeshPhysicalMaterial({ color: 0xff8a3d, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.5, sheenColor: new THREE.Color(0xffd0a0) });
  const core = sph(0.78, orange, 48, 32); core.castShadow = true; root.add(core);
  const nubs = [];
  for (let i = 0; i < 16; i++) { const yy = 1 - (i + 0.5) / 16 * 2; const r = Math.sqrt(1 - yy * yy); const th = i * 2.39996;
    const dir = new THREE.Vector3(Math.cos(th) * r, yy, Math.sin(th) * r); if (dir.z > 0.2) continue;
    const n = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.16, 6, 16), orange); n.castShadow = true; n.quaternion.setFromUnitVectors(UP, dir); root.add(n); nubs.push({ n, dir, ph: i * 1.7 }); }
  const fc = document.createElement('canvas'); fc.width = fc.height = 256;
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshStandardMaterial({ map: ft, transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -4 }));
  face.position.z = 0.88; root.add(face);
  const glow = glowSprite(0xff8a3d, 4, 4, 0.18); scene.add(glow);
  const light = new THREE.PointLight(0xff8a3c, 5, 6, 1.8); scene.add(light);
  function drawFace(L, m, t) {
    const g = fc.getContext('2d'); g.clearRect(0, 0, 256, 256); g.save(); g.translate(128, 120);
    const ink = '#2a1608'; g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
    const blink = (t % 4.1) < 0.12;
    for (const ex of [-40, 40]) { g.save(); g.translate(ex, -14);
      if (L.cface === 'happy') { g.lineWidth = 12; g.beginPath(); g.moveTo(-16, 8); g.bezierCurveTo(-8, -14, 8, -14, 16, 8); g.stroke(); }
      else if (L.cface === 'smug') { g.beginPath(); g.ellipse(0, 4, 15, 9, 0, 0, 7); g.fill(); g.lineWidth = 8; g.beginPath(); g.moveTo(-18, -8); g.lineTo(18, -4); g.stroke(); }
      else if (L.cface === 'shock') { g.beginPath(); g.ellipse(0, 0, 18, 24, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(6, -8, 6, 0, 7); g.fill(); g.fillStyle = ink; }
      else { if (blink) g.scale(1, 0.1); g.beginPath(); g.ellipse(0, 0, 14, 20, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(5, -7, 5, 0, 7); g.fill(); g.fillStyle = ink; }
      g.restore(); }
    g.fillStyle = 'rgba(255,90,90,0.35)'; g.beginPath(); g.ellipse(-62, 18, 16, 10, 0, 0, 7); g.ellipse(62, 18, 16, 10, 0, 0, 7); g.fill(); g.fillStyle = ink;
    if (m > 0.05) { g.beginPath(); g.ellipse(0, 30, 14 + m * 8, 4 + m * 18, 0, 0, 7); g.fill(); }
    else { g.lineWidth = 8; g.beginPath(); g.moveTo(-14, 26); g.bezierCurveTo(-6, 36, 6, 36, 14, 26); g.stroke(); }
    g.restore(); ft.needsUpdate = true;
  }
  const [cx, cy, cz] = anchor.pos;
  function update(F, L, t) {
    const talking = L.who === 'C' ? F.mc : 0;
    root.position.set(cx, cy + Math.sin(t * 2.4) * 0.15, cz);
    root.rotation.set(Math.sin(t * 1.3) * 0.06, (anchor.rotY ?? -0.2) + Math.sin(t * 0.9) * 0.06, Math.sin(t * 1.7) * 0.06);
    const sq = 1 + talking * 0.06; core.scale.set(sq, 1 / sq, sq);
    for (const o of nubs) { const k = 0.74 + 0.07 * Math.sin(t * 3 + o.ph) + talking * 0.08; o.n.position.copy(o.dir).multiplyScalar(k); const s = 0.9 + 0.15 * Math.sin(t * 2.2 + o.ph); o.n.scale.set(s, s, s); }
    light.position.set(cx - 0.6, root.position.y - 1.2, cz + 0.4); glow.position.set(cx, root.position.y, cz - 0.9);
    drawFace(L, F.mc, t);
  }
  return { root, update };
}
