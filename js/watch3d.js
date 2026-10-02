/*
  The Ghati 01, built in 3D and taken apart by scroll.

  Layout follows a classic exploded view: the watch lies face up and every
  layer lifts along its own axis, crystal on top, caseback at the bottom.

  Materials are physical (metal, ceramic, sapphire) and lit by a soft studio
  environment, so the steel reflects like steel. The part in focus also gets
  a brass hologram outline that glows through a bloom pass.

  Timeline, by scroll progress p (0 to 1). Must match main.js:
    0.00  assembled, product shot
    0.08  explodes into a vertical stack with labelled parts
    0.20  zoom: sapphire crystal
    0.32  zoom: dial and hands
    0.46  zoom: balance wheel, beating
    0.60  zoom: mainspring barrel and gear train, turning
    0.74  zoom: rotor, spinning
    0.88  back together
*/
import * as THREE from "../vendor/three.module.min.js";
import { RoomEnvironment } from "../vendor/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../vendor/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "../vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../vendor/addons/postprocessing/OutputPass.js";

const BRASS = 0xffd59a;
const TAU = Math.PI * 2;

/* ---------------- helpers ---------------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const seg = (p, a, b) => smooth(clamp((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

// Extrude a 2D shape and lay it flat, thickness pointing up (+y).
function flat(shape, depth, bevel = 0.01) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, curveSegments: 48,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}

// A gear: teeth around the edge, a centre hole and spoke windows.
function gearShape(r, teeth, depth = 0.05, spokes = 4) {
  const s = new THREE.Shape();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const k = i % 4;
    const rr = k === 0 || k === 3 ? r - depth : r; // flat-topped teeth
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.08, 0, TAU, true);
  s.holes.push(hole);
  if (spokes && r > 0.2) {
    const r0 = r * 0.22, r1 = r * 0.78;
    for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * TAU + 0.18, a1 = ((k + 1) / spokes) * TAU - 0.18;
      const w = new THREE.Path();
      w.absarc(0, 0, r1, a0, a1, false);
      w.absarc(0, 0, r0, a1, a0, true);
      s.holes.push(w);
    }
  }
  return s;
}

function ringShape(r0, r1) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, 0, TAU, false);
  const h = new THREE.Path();
  h.absarc(0, 0, r0, 0, TAU, true);
  s.holes.push(h);
  return s;
}

function canvasTexture(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------------- textures ---------------- */

function dialTexture() {
  return canvasTexture(1024, (g, S) => {
    const c = S / 2;
    g.fillStyle = "#0a0a0a";
    g.fillRect(0, 0, S, S);
    // sunburst: thin alternating rays from the centre
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * TAU;
      g.strokeStyle = i % 2 ? "#121212" : "#1b1b1b";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(c, c);
      g.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
      g.stroke();
    }
    const sheen = g.createRadialGradient(c * 0.7, c * 0.5, 10, c, c, c);
    sheen.addColorStop(0, "rgba(255,255,255,0.10)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sheen;
    g.fillRect(0, 0, S, S);
    // minute track
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU - Math.PI / 2;
      const big = i % 5 === 0;
      g.strokeStyle = big ? "#d8d8d8" : "#777";
      g.lineWidth = big ? 5 : 2.5;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * c * 0.9, c + Math.sin(a) * c * 0.9);
      g.lineTo(c + Math.cos(a) * c * 0.96, c + Math.sin(a) * c * 0.96);
      g.stroke();
    }
    g.textAlign = "center";
    g.fillStyle = "#ecebe7";
    g.font = '600 54px "Bodoni Moda", Didot, serif';
    g.letterSpacing = "14px";
    g.fillText("VELA", c, c * 0.56);
    g.fillStyle = "#c8a46a";
    g.font = '40px "Tiro Devanagari Hindi", serif';
    g.letterSpacing = "0px";
    g.fillText("वेला", c, c * 0.66);
    g.fillStyle = "#9b988f";
    g.font = '500 24px "Instrument Sans", Arial, sans-serif';
    g.letterSpacing = "6px";
    g.fillText("GHATI 01  AUTOMATIC", c, c * 1.5);
  });
}

// black ceramic bezel insert with a 60 minute scale
function bezelTexture() {
  return canvasTexture(1024, (g, S) => {
    const c = S / 2;
    g.fillStyle = "#070707";
    g.fillRect(0, 0, S, S);
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU - Math.PI / 2;
      if (i % 10 === 0 && i > 0) {
        // numerals at 10, 20, 30, 40, 50
        g.save();
        g.translate(c + Math.cos(a) * c * 0.885, c + Math.sin(a) * c * 0.885);
        g.rotate(a + Math.PI / 2);
        g.fillStyle = "#d9d9d6";
        g.font = '500 46px "Instrument Sans", Arial, sans-serif';
        g.fillText(String(i), 0, 2);
        g.restore();
      } else if (i === 0) {
        // brass triangle at zero
        g.save();
        g.translate(c + Math.cos(a) * c * 0.885, c + Math.sin(a) * c * 0.885);
        g.rotate(a + Math.PI / 2);
        g.fillStyle = "#e7cb94";
        g.beginPath(); g.moveTo(-20, -16); g.lineTo(20, -16); g.lineTo(0, 18); g.closePath(); g.fill();
        g.restore();
      } else {
        const big = i % 5 === 0;
        g.strokeStyle = i < 15 ? "#bdbdba" : "#8a8a88";
        g.lineWidth = big ? 7 : 4;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * c * (big ? 0.84 : 0.86), c + Math.sin(a) * c * (big ? 0.84 : 0.86));
        g.lineTo(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93);
        g.stroke();
      }
    }
  });
}

// perlage: overlapping circular graining on the movement plate
function perlageTexture() {
  return canvasTexture(512, (g, S) => {
    g.fillStyle = "#b9b9bd";
    g.fillRect(0, 0, S, S);
    const step = 22;
    for (let y = 0; y < S + step; y += step * 0.8) {
      for (let x = 0; x < S + step; x += step * 0.8) {
        const grad = g.createRadialGradient(x, y, 1, x, y, step * 0.7);
        grad.addColorStop(0, "rgba(255,255,255,0.35)");
        grad.addColorStop(0.7, "rgba(120,120,125,0.15)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, step * 0.7, 0, TAU);
        g.fill();
      }
    }
  });
}

/* ---------------- the watch ---------------- */

function buildWatch() {
  const M = {
    steel: new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 1, roughness: 0.2, envMapIntensity: 1.1 }),
    brushed: new THREE.MeshStandardMaterial({ color: 0xc9c9c9, metalness: 1, roughness: 0.38 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xe0b878, metalness: 1, roughness: 0.25 }),
    rhodium: new THREE.MeshStandardMaterial({ color: 0xd2d2d6, metalness: 1, roughness: 0.3, map: perlageTexture() }),
    bridge: new THREE.MeshStandardMaterial({ color: 0xcfcfd3, metalness: 1, roughness: 0.18 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0xb0102a, metalness: 0, roughness: 0.05, clearcoat: 1, emissive: 0x30000a }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: bezelTexture(), metalness: 0.1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    dial: new THREE.MeshStandardMaterial({ color: 0xffffff, map: dialTexture(), metalness: 0.55, roughness: 0.35 }),
    dialEdge: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.4 }),
    sapphire: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 0.4, ior: 1.77,
      transparent: true, opacity: 1, specularIntensity: 0.55, envMapIntensity: 1.0,
    }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0, roughness: 0.7 }),
    blued: new THREE.MeshStandardMaterial({ color: 0x23306b, metalness: 1, roughness: 0.25 }),
  };

  const watch = new THREE.Group();
  const P = {}; // named parts
  const add = (name, obj, y) => { obj.position.y = y; obj.userData.y0 = y; P[name] = obj; watch.add(obj); return obj; };

  /* caseback with a sapphire window */
  const back = new THREE.Group();
  back.add(new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(1.3, -0.1), new THREE.Vector2(1.7, -0.12), new THREE.Vector2(1.9, -0.06),
    new THREE.Vector2(1.95, 0.08), new THREE.Vector2(1.3, 0.08), new THREE.Vector2(1.3, -0.1),
  ], 128), M.brushed));
  const notch = new RoundedBoxGeometry(0.12, 0.1, 0.22, 2, 0.02);
  for (let i = 0; i < 12; i++) {
    const n = new THREE.Mesh(notch, M.steel);
    const a = (i / 12) * TAU;
    n.position.set(Math.cos(a) * 1.92, 0.01, Math.sin(a) * 1.92);
    n.rotation.y = -a;
    back.add(n);
  }
  back.add(new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.1, 96), M.sapphire));
  add("caseback", back, -0.52);

  /* rotor: a gold half-moon on a centre bearing */
  const rotorShape = new THREE.Shape();
  rotorShape.absarc(0, 0, 1.45, Math.PI, TAU, false);
  rotorShape.absarc(0, 0, 0.22, TAU, Math.PI, true);
  const rotor = new THREE.Group();
  const rotorMesh = new THREE.Mesh(flat(rotorShape, 0.05, 0.012), M.gold);
  rotor.add(rotorMesh);
  rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 48), M.steel));
  add("rotor", rotor, -0.36);

  /* gasket */
  add("gasket", new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.035, 12, 128).rotateX(Math.PI / 2), M.rubber), -0.4);

  /* movement */
  const mvt = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.1, 128), [M.bridge, M.rhodium, M.bridge]);
  plate.position.y = -0.08;
  plate.userData.spread = -0.35;
  mvt.add(plate);

  const gears = [];
  const gear = (r, teeth, x, z, y, mat, speed) => {
    const g = new THREE.Mesh(flat(gearShape(r, teeth, Math.min(0.05, r * 0.12)), 0.035, 0.004), mat);
    const holder = new THREE.Group();
    holder.position.set(x, y, z);
    holder.add(g);
    const jewel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 24), M.ruby);
    jewel.position.y = 0.04;
    holder.add(jewel);
    holder.userData.speed = speed;
    holder.userData.spread = 0;
    gears.push(holder);
    mvt.add(holder);
    return holder;
  };
  P.barrel = gear(0.6, 90, -0.55, -0.55, 0.0, M.gold, 0.05);
  gear(0.42, 64, 0, 0, 0.03, M.gold, -0.12);
  gear(0.32, 50, 0.72, -0.35, 0.0, M.gold, 0.3);
  gear(0.3, 48, 0.82, 0.42, 0.03, M.gold, -0.8);
  gear(0.18, 15, 0.15, 0.95, 0.0, M.steel, 2.4);

  // bridges: polished arms holding the wheels
  const bridgeShape = (pts, w) => {
    const s = new THREE.Shape();
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, -z, 0)));
    const line = curve.getPoints(40);
    const left = [], right = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
      const nx = -(b.y - a.y), ny = b.x - a.x, l = Math.hypot(nx, ny) || 1;
      left.push([line[i].x + (nx / l) * w, line[i].y + (ny / l) * w]);
      right.push([line[i].x - (nx / l) * w, line[i].y - (ny / l) * w]);
    }
    left.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    right.reverse().forEach(([x, y]) => s.lineTo(x, y));
    s.closePath();
    return s;
  };
  const bridges = new THREE.Group();
  bridges.add(new THREE.Mesh(flat(bridgeShape([[-1.4, 0.5], [-0.3, 0.1], [0.72, -0.35], [1.4, -0.3]], 0.13), 0.05, 0.01), M.bridge));
  bridges.add(new THREE.Mesh(flat(bridgeShape([[-1.1, -1.05], [-0.55, -0.55], [0.1, -0.2]], 0.16), 0.05, 0.01), M.bridge));
  bridges.add(new THREE.Mesh(flat(bridgeShape([[1.35, 0.6], [0.82, 0.42], [0.15, 0.95], [0.2, 1.4]], 0.12), 0.05, 0.01), M.bridge));
  bridges.position.y = 0.1;
  bridges.userData.spread = 0.35;
  mvt.add(bridges);
  // blued screws on the bridges
  for (const [x, z] of [[-1.3, 0.48], [1.3, -0.3], [-1.0, -0.98], [1.25, 0.58], [0.2, 1.32]]) {
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20), M.blued);
    sc.position.set(x, 0.17, z);
    bridges.add(sc);
  }

  // balance wheel with hairspring, under its own cock
  const balance = new THREE.Group();
  balance.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 16, 96).rotateX(Math.PI / 2), M.gold));
  for (let k = 0; k < 2; k++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.025, 0.04), M.gold);
    arm.rotation.y = k * (Math.PI / 2);
    balance.add(arm);
  }
  for (let k = 0; k < 8; k++) { // timing screws on the rim
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.gold);
    const a = (k / 8) * TAU;
    s.position.set(Math.cos(a) * 0.44, 0, Math.sin(a) * 0.44);
    balance.add(s);
  }
  const spiral = [];
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    const a = t * 12 * Math.PI;
    const r = 0.05 + t * 0.26;
    spiral.push(new THREE.Vector3(Math.cos(a) * r, 0.04, Math.sin(a) * r));
  }
  balance.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 600, 0.006, 6), M.steel));
  const holderB = new THREE.Group();
  holderB.position.set(-0.62, 0.08, 0.62);
  holderB.add(balance);
  holderB.userData.spread = 0.15;
  mvt.add(holderB);
  P.balance = holderB;
  P.balanceWheel = balance;
  add("movement", mvt, -0.2);

  /* middle case with lugs and crown */
  const mid = new THREE.Group();
  mid.add(new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(1.62, -0.36), new THREE.Vector2(1.94, -0.36), new THREE.Vector2(2.02, -0.28),
    new THREE.Vector2(2.06, 0.0), new THREE.Vector2(2.02, 0.18), new THREE.Vector2(1.9, 0.26),
    new THREE.Vector2(1.62, 0.26), new THREE.Vector2(1.62, -0.36),
  ], 160), M.steel));
  const lug = new RoundedBoxGeometry(0.42, 0.34, 1.0, 4, 0.1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = new THREE.Mesh(lug, M.steel);
    l.position.set(sx * 1.12, -0.1, sz * 2.0);
    l.rotation.x = sz * 0.12;
    mid.add(l);
  }
  const crown = new THREE.Group();
  crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 30).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 1, roughness: 0.25, flatShading: true })));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12).rotateZ(Math.PI / 2), M.steel);
  stem.position.x = -0.55;
  crown.add(stem);
  crown.position.set(2.25, -0.05, 0);
  mid.add(crown);
  P.crown = crown;
  add("case", mid, 0);

  /* dial with applied indices */
  const dial = new THREE.Group();
  dial.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.04, 128), [M.dialEdge, M.dial, M.dialEdge]));
  const idx = new RoundedBoxGeometry(0.07, 0.05, 0.26, 2, 0.015);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const reps = i === 0 ? [-0.06, 0.06] : [0];
    for (const off of reps) {
      const m = new THREE.Mesh(idx, M.gold);
      const r = 1.3;
      m.position.set(Math.sin(a) * r + Math.cos(a) * off, 0.045, -Math.cos(a) * r + Math.sin(a) * off);
      m.rotation.y = -a;
      dial.add(m);
    }
  }
  add("dial", dial, 0.1);

  /* hands: hour, minute, seconds */
  const handShape = (len, w, tail) => {
    const s = new THREE.Shape();
    s.moveTo(0, -tail); s.lineTo(w, 0); s.lineTo(0, len); s.lineTo(-w, 0); s.closePath();
    return s;
  };
  const hand = (shape, y, mat) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(flat(shape, 0.012, 0.003), mat));
    g.position.y = y;
    return g;
  };
  const hours = add("hour", hand(handShape(0.92, 0.075, 0.12), 0.0, M.gold), 0.15);
  const mins = add("minute", hand(handShape(1.35, 0.06, 0.15), 0.0, M.gold), 0.18);
  const secShape = new THREE.Shape();
  secShape.moveTo(-0.012, -0.32); secShape.lineTo(0.012, -0.32); secShape.lineTo(0.008, 1.45); secShape.lineTo(-0.008, 1.45); secShape.closePath();
  const secs = add("second", hand(secShape, 0.0, new THREE.MeshStandardMaterial({ color: 0xd2553a, metalness: 0.6, roughness: 0.3 })), 0.21);
  secs.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24), M.gold));
  // flat() turns a shape's +y into -z, so every hand already points to 12

  /* bezel with a grip edge, and the ceramic insert */
  const bez = new THREE.Shape();
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const r = 1.98 + 0.045 * Math.abs(Math.cos(a * 30));
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? bez.lineTo(x, y) : bez.moveTo(x, y);
  }
  const bh = new THREE.Path();
  bh.absarc(0, 0, 1.6, 0, TAU, true);
  bez.holes.push(bh);
  add("bezel", new THREE.Mesh(flat(bez, 0.13, 0.02), M.steel), 0.27);
  add("insert", new THREE.Mesh(new THREE.RingGeometry(1.62, 1.94, 128, 1).rotateX(-Math.PI / 2), M.ceramic), 0.43);

  /* sapphire crystal, slightly domed */
  const crystal = new THREE.Group();
  crystal.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 128), M.sapphire));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 12, 0, TAU, 0, Math.asin(1.6 / 6)), M.sapphire);
  dome.position.y = 0.05 - Math.sqrt(36 - 1.6 * 1.6);
  crystal.add(dome);
  add("crystal", crystal, 0.46);

  // how far each layer lifts when the watch opens (like the reference stack)
  const lift = { crystal: 4.4, insert: 3.8, bezel: 3.25, second: 2.55, minute: 2.3, hour: 2.05, dial: 1.35, case: 0, movement: -1.45, gasket: -2.35, rotor: -2.85, caseback: -3.55 };

  return { watch, P, gears, lift };
}

// Brass outline of a part, used as the hologram highlight
function hologram(obj) {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  obj.traverse((m) => {
    if (!m.isMesh) return;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), mat);
    e.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    group.add(e);
  });
  obj.add(group);
  return mat;
}

/* ---------------- scene ---------------- */

export async function init({ canvas, section, getProgress, callout }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    return false;
  }
  const mobile = window.matchMedia("(max-width: 720px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 1);

  // wait for the fonts, so the dial and bezel print with the brand type
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('600 54px "Bodoni Moda"'),
      document.fonts.load('40px "Tiro Devanagari Hindi"', "वेला"),
      document.fonts.load('500 24px "Instrument Sans"'),
    ]).catch(() => {});
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  // a warm key light from the top left and a cool rim from behind
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
  key.position.set(-4, 8, 5);
  const rim = new THREE.DirectionalLight(0xc9d6ff, 1.2);
  rim.position.set(5, 3, -6);
  scene.add(key, rim);

  const { watch, P, gears, lift } = buildWatch();
  scene.add(watch);

  // Put each part we inspect inside a wrapper group. The wrapper flies out of
  // the stack; the part inside keeps its own spin (gears, rotor, balance).
  function wrap(name) {
    const obj = P[name];
    const w = new THREE.Group();
    obj.parent.add(w);
    w.position.copy(obj.position);
    w.userData = { ...obj.userData, x0: obj.position.x, z0: obj.position.z };
    obj.position.set(0, 0, 0);
    obj.userData = {};
    w.add(obj);
    P[name] = w;
    return w;
  }
  const rotorSpin = P.rotor; // the rotor itself spins inside its wrapper
  ["crystal", "dial", "rotor", "balance", "barrel"].forEach(wrap);
  watch.updateMatrixWorld(true);

  // the assembly axis: a faint dashed line through the stack when open
  const axisMat = new THREE.LineDashedMaterial({ color: BRASS, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4.4, 0), new THREE.Vector3(0, 5.2, 0)]), axisMat);
  axis.computeLineDistances();
  scene.add(axis);

  // hologram outlines for the parts we zoom into
  const holo = {
    crystal: hologram(P.crystal),
    dial: hologram(P.dial),
    balance: hologram(P.balance),
    barrel: hologram(P.barrel),
    rotor: hologram(P.rotor),
  };

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // post-processing: a gentle bloom so polished edges and the hologram glow
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.45, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let aspect = 1;
  // Leave room for the words: the watch sits right on wide screens and high
  // on phones. On phones it also slides left while the part labels show.
  function setOffset(labels) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (aspect > 1) camera.setViewOffset(w, h, -w * 0.15, 0, w, h);
    else camera.setViewOffset(w, h, w * 0.17 * labels, h * 0.1, w, h);
    camera.updateProjectionMatrix();
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w / 2, h / 2);
    aspect = w / h;
    camera.aspect = aspect;
    setOffset(0);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  /* labels for the open stack, like a technical drawing */
  const labelLayer = document.createElement("div");
  labelLayer.className = "parts";
  labelLayer.setAttribute("aria-hidden", "true");
  const svgNS = "http://www.w3.org/2000/svg";
  const lines = document.createElementNS(svgNS, "svg");
  lines.setAttribute("class", "parts-lines");
  labelLayer.appendChild(lines);
  canvas.parentElement.appendChild(labelLayer);
  const LABELS = [
    ["crystal", "Domed sapphire crystal", 1.6],
    ["insert", "Ceramic bezel insert", 1.94],
    ["bezel", "Steel bezel with grip edge", 2.02],
    ["minute", "Gold dauphine hands", 1.0],
    ["dial", "Sunburst dial, applied indices", 1.6],
    ["case", "40 mm steel case", 2.06],
    ["movement", "Calibre P-01, 28 jewels", 1.55],
    ["rotor", "Gold winding rotor", 1.45],
    ["caseback", "Sapphire caseback", 1.95],
  ].map(([part, text, r]) => {
    const el = document.createElement("p");
    el.className = "part-label";
    // short names on phones, so the labels fit beside the stack
    el.textContent = mobile ? text.split(/,| with| on/)[0].replace("Domed ", "").replace("Gold dauphine ", "").replace("Sunburst ", "").replace("40 mm steel ", "").replace("Calibre P-01", "Movement").replace("Gold winding ", "").replace(/^./, (c) => c.toUpperCase()) : text;
    labelLayer.appendChild(el);
    const ln = document.createElementNS(svgNS, "line");
    lines.appendChild(ln);
    return { part, el, ln, r };
  });

  /* camera: a product shot, then one steady view of the open stack */
  const keys = [
    { p: 0.0, y: 0, az: 0.55, el: 0.62, r: 9.5 },
    { p: 0.06, y: 0, az: 0.5, el: 0.55, r: 9.5 },
    { p: 0.17, y: 0.35, az: 0.42, el: 0.3, r: 19 },
    { p: 0.86, y: 0.35, az: 0.62, el: 0.3, r: 19 },
    { p: 0.95, y: 0, az: 0.55 + TAU, el: 0.62, r: 9.5 },
    { p: 1.0, y: 0, az: 0.6 + TAU, el: 0.6, r: 9.5 },
  ];
  /* parts pulled out of the stack for a close look: [name, from, to, distance, callout] */
  const INSPECT = [
    ["crystal", 0.2, 0.32, 10.5, "Sapphire, 9 on the Mohs scale"],
    ["dial", 0.32, 0.46, 9.5, "Sunburst dial, 12 applied indices"],
    ["balance", 0.46, 0.6, 3.6, "28,800 beats an hour"],
    ["barrel", 0.6, 0.74, 4.6, "72 hour power reserve"],
    ["rotor", 0.74, 0.88, 10, "Winds with every move"],
  ];
  const tv = new THREE.Vector3(), tmp = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
  const qTilt = new THREE.Quaternion(), qId = new THREE.Quaternion(), axisR = new THREE.Vector3();

  let shown = getProgress();
  const clock = new THREE.Clock();

  function update(p, t, dt) {
    /* open and close the stack */
    const ex = seg(p, 0.06, 0.18) * (1 - seg(p, 0.88, 0.97));
    for (const [name, dy] of Object.entries(lift)) {
      const o = P[name];
      o.position.y = o.userData.y0 + dy * ex;
      if (o.userData.x0 !== undefined) { o.position.x = o.userData.x0; o.position.z = o.userData.z0; }
    }
    // inside the movement: plate drops, bridges rise, so the wheels show
    P.movement.children.forEach((c) => {
      if (c.userData.y1 === undefined) c.userData.y1 = c.position.y;
      c.position.y = c.userData.y1 + (c.userData.spread || 0) * ex;
      if (c.userData.x0 !== undefined) c.position.set(c.userData.x0, c.position.y, c.userData.z0);
      c.quaternion.identity();
    });
    for (const n of ["crystal", "dial", "rotor"]) P[n].quaternion.identity();
    P.crown.position.x = 2.25 + ex * 0.9; // crown pulls out on its stem
    axisMat.opacity = 0.35 * ex;

    /* live time on the hands */
    const d = new Date();
    const s = d.getSeconds() + (reduceMotion ? 0 : Math.floor(d.getMilliseconds() / 125) / 8);
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    P.hour.rotation.y = -(h / 12) * TAU;
    P.minute.rotation.y = -(m / 60) * TAU;
    P.second.rotation.y = -(s / 60) * TAU;

    /* the movement runs */
    if (!reduceMotion) {
      // balance swings at 4 Hz; wider once it is in focus
      P.balanceWheel.rotation.y = Math.sin(t * TAU * 4) * 2.4 * (0.35 + 0.65 * seg(p, 0.44, 0.48));
      // gears speed up while they are in focus (angles add up, so no jumps)
      const boost = 1 + 3 * seg(p, 0.58, 0.62) * (1 - seg(p, 0.72, 0.74));
      for (const g of gears) g.rotation.y += dt * g.userData.speed * boost;
      // the rotor spins hard while in focus, as if the wrist moved
      rotorSpin.rotation.y -= dt * (0.2 + 6 * seg(p, 0.74, 0.77) * (1 - seg(p, 0.85, 0.88)));
    }

    /* camera between keys */
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const A = keys[i], B = keys[i + 1];
    const k = seg(p, A.p, B.p);
    tv.set(0, lerp(A.y, B.y, k), 0);
    const az = lerp(A.az, B.az, k) + (reduceMotion ? 0 : Math.sin(t * 0.3) * 0.04);
    const el = lerp(A.el, B.el, k);
    const fit = aspect > 1 ? Math.max(1, 1.5 / aspect) : Math.max(1, 1.1 / aspect);
    const r = lerp(A.r, B.r, k) * fit;
    camera.position.set(
      tv.x + r * Math.cos(el) * Math.sin(az),
      tv.y + r * Math.sin(el),
      tv.z + r * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(tv);
    const lk = seg(p, 0.15, 0.18) * (1 - seg(p, 0.205, 0.23)); // labels showing
    if (aspect <= 1) setOffset(lk);
    camera.updateMatrixWorld();

    /* pull the part in focus out of the stack, toward the viewer */
    camera.getWorldDirection(fwd);
    right.set(Math.cos(az), 0, -Math.sin(az));
    const pulse = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 4);
    let active = null;
    for (const [name, a, b, dist, text] of INSPECT) {
      const kk = seg(p, a + 0.005, a + 0.04) * (1 - seg(p, b - 0.035, b - 0.002));
      holo[name].opacity = 0.85 * kk * pulse;
      if (kk <= 0.001) continue;
      const part = P[name];
      // where it sits in the stack, and where it should float for inspection
      part.parent.updateMatrixWorld();
      const home = part.getWorldPosition(new THREE.Vector3());
      const look = camera.position.clone().addScaledVector(fwd, dist * fit);
      const world = home.lerp(look, kk);
      part.position.copy(part.parent.worldToLocal(world));
      // tip it toward the camera so we see its face, not its edge
      axisR.copy(right);
      qTilt.setFromAxisAngle(axisR, (Math.PI / 2 - el) * 0.8 * kk);
      part.quaternion.copy(qId).slerp(qTilt, 1);
      if (kk > 0.05) active = { part, text, kk };
    }

    /* labels on the open stack */
    const W = canvas.clientWidth, H = canvas.clientHeight;
    lines.setAttribute("viewBox", `0 0 ${W} ${H}`);
    for (const L of LABELS) {
      if (lk < 0.02) { L.el.style.opacity = 0; L.ln.setAttribute("opacity", 0); continue; }
      // right edge of the part, as seen by the camera
      P[L.part].getWorldPosition(tmp);
      tmp.add(new THREE.Vector3(L.r, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), az - 0.0));
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
      const lx = x + (mobile ? 24 : 70);
      L.el.style.opacity = lk;
      L.el.style.transform = `translate(${lx.toFixed(1)}px, ${y.toFixed(1)}px) translate(6px, -50%)`;
      L.ln.setAttribute("x1", x.toFixed(1)); L.ln.setAttribute("y1", y.toFixed(1));
      L.ln.setAttribute("x2", lx.toFixed(1)); L.ln.setAttribute("y2", y.toFixed(1));
      L.ln.setAttribute("opacity", lk);
    }

    /* one callout pinned to the part in focus */
    if (callout) {
      if (active) {
        active.part.getWorldPosition(tmp);
        tmp.project(camera);
        callout.textContent = active.text;
        callout.style.opacity = active.kk;
        callout.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * H - H * 0.3).toFixed(1)}px) translate(-50%, -50%)`;
      } else callout.style.opacity = 0;
    }
  }

  let running = false;
  function frame() {
    if (!running) return;
    const goal = getProgress();
    shown += (goal - shown) * (reduceMotion ? 1 : 0.1);
    const dt = Math.min(0.05, clock.getDelta());
    update(shown, clock.elapsedTime, dt);
    composer.render();
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
    labelLayer.style.display = running ? "" : "none";
    if (running) requestAnimationFrame(frame);
  }).observe(section);

  update(shown, 0, 0);
  composer.render();
  // for testing: render one exact moment of the timeline
  canvas.renderAt = (p, t = 1) => { shown = p; update(p, t, 0.016); composer.render(); };
  return true;
}
