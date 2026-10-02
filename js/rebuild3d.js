/*
  Holographic rebuild of the Saloon 62, driven by scroll.

  The car is built from the same side profile used in the SVG drawings:
  each outline is turned into a THREE.Shape and extruded to give it width.
  Every part is drawn as a hologram: a faint additive fill plus glowing edges.

  Colours follow the brand rule:
  - cyan   = the body we keep
  - red    = the old parts we remove
  - amber  = the new parts we add

  Timeline (scroll progress p from 0 to 1):
    0.00  as found, car assembled
    0.10  panels fly apart
    0.24  old engine, gearbox, tank and exhaust light up red
    0.40  old parts leave (engine lifted out, the rest dropped)
    0.54  battery rises in under the floor, motor slides in at the rear
    0.70  modern changes: LED rings, light bar, aero wheels, charge port
    0.84  panels go back, car is rebuilt
*/
import * as THREE from "../vendor/three.module.min.js";

const CYAN = 0x6fe3ff;
const RED = 0xff6b4a;
const AMBER = 0xf2a33a;
const NIGHT = 0x0a2238;

// SVG drawing units to 3D units: 100 px = 1 unit, ground at y = 0
const X = (x) => (x - 510) / 100;
const Y = (y) => (396 - y) / 100;

/* ---------------- small helpers ---------------- */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
// progress of p inside [a, b], eased
const seg = (p, a, b) => smooth(clamp((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

// Turn a list of drawing commands (in SVG coordinates) into a THREE.Shape.
// "ARCH" draws a wheel arch over the top of a wheel, from right to left.
function shapeFrom(cmds) {
  const s = new THREE.Shape();
  for (const [t, ...a] of cmds) {
    if (t === "M") s.moveTo(X(a[0]), Y(a[1]));
    else if (t === "L") s.lineTo(X(a[0]), Y(a[1]));
    else if (t === "C") s.bezierCurveTo(X(a[0]), Y(a[1]), X(a[2]), Y(a[3]), X(a[4]), Y(a[5]));
    else if (t === "ARCH") {
      const [cx, cy, r, ye] = a;
      const dx = Math.sqrt(r * r - (cy - ye) ** 2);
      const a0 = Math.atan2(ye - cy, dx);
      const a1 = Math.atan2(ye - cy, -dx);
      for (let i = 1; i <= 18; i++) {
        const ang = a0 + ((a1 - a0) * i) / 18;
        s.lineTo(X(cx + r * Math.cos(ang)), Y(cy + r * Math.sin(ang)));
      }
    }
  }
  return s;
}

function extrude(cmds, depth, bevel = 0.05) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(cmds), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 2,
    curveSegments: 14,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

// A hologram: faint additive fill + bright edges.
function holo(geom, color, fill = 0.05, edge = 0.85, angle = 22) {
  const group = new THREE.Group();
  const fm = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: fill, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const lm = new THREE.LineBasicMaterial({
    color, transparent: true, opacity: edge, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(geom, fm));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom, angle), lm));
  group.userData.base = [[fm, fill], [lm, edge]];
  return group;
}

// Fade every hologram inside an object. k = 0 hides it, 1 is full strength.
function fade(obj, k) {
  obj.visible = k > 0.002;
  obj.traverse((o) => {
    if (o.userData.base) for (const [m, b] of o.userData.base) m.opacity = b * k;
  });
}

function at(obj, x, y, z = 0) { obj.position.set(x, y, z); return obj; }

/* ---------------- the car ---------------- */

function buildCar() {
  const car = new THREE.Group();
  const parts = {};

  // lower body: from the sills up to the belt line, with both wheel arches
  parts.body = holo(extrude([
    ["M", 100, 310], ["C", 88, 300, 84, 270, 92, 250], ["C", 100, 228, 125, 214, 170, 208],
    ["L", 395, 196], ["L", 792, 194], ["L", 905, 204], ["C", 930, 210, 940, 240, 932, 280],
    ["L", 925, 310], ["L", 829, 310], ["ARCH", 760, 337, 74, 310],
    ["L", 299, 310], ["ARCH", 230, 337, 74, 310], ["L", 100, 310],
  ], 3.3), CYAN, 0.035, 0.75);
  car.add(parts.body);

  // cabin and roof, a little narrower than the body
  parts.cabin = holo(extrude([
    ["M", 395, 196], ["C", 420, 160, 445, 130, 478, 118], ["C", 540, 104, 640, 104, 700, 116],
    ["C", 740, 130, 770, 160, 792, 194], ["L", 395, 196],
  ], 2.9), CYAN, 0.04, 0.85);
  car.add(parts.cabin);

  parts.bonnet = holo(extrude([["M", 150, 210], ["L", 395, 196], ["L", 395, 202], ["L", 150, 216], ["L", 150, 210]], 3.0, 0.02), CYAN, 0.08, 0.9);
  parts.boot = holo(extrude([["M", 792, 194], ["L", 905, 204], ["L", 904, 210], ["L", 792, 200], ["L", 792, 194]], 3.0, 0.02), CYAN, 0.08, 0.9);
  car.add(parts.bonnet, parts.boot);

  // doors, one plate per side for front and rear
  const frontDoor = [["M", 405, 199], ["L", 588, 197], ["L", 588, 306], ["L", 405, 306], ["L", 405, 199]];
  const rearDoor = [["M", 588, 197], ["L", 700, 195], ["L", 700, 288], ["C", 696, 300, 690, 306, 680, 306], ["L", 588, 306], ["L", 588, 197]];
  parts.doors = [];
  for (const side of [1, -1]) {
    const g = new THREE.Group();
    g.add(holo(extrude(frontDoor, 0.04, 0.01), CYAN, 0.06, 0.9));
    g.add(holo(extrude(rearDoor, 0.04, 0.01), CYAN, 0.06, 0.9));
    g.userData.side = side;
    g.userData.z = side * 1.7;
    g.position.z = g.userData.z;
    parts.doors.push(g);
    car.add(g);
  }

  // wheels: tyre, old hubcap, new aero disc
  const tyreGeom = new THREE.CylinderGeometry(0.58, 0.58, 0.34, 28, 1, true).rotateX(Math.PI / 2);
  const capGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 20).rotateX(Math.PI / 2);
  const rimGeom = new THREE.TorusGeometry(0.41, 0.025, 6, 36);
  const spokeGeom = new THREE.BoxGeometry(0.3, 0.05, 0.03).translate(0.24, 0, 0);
  parts.wheels = [];
  parts.caps = [];
  parts.aeros = [];
  for (const x of [X(230), X(760)]) {
    for (const side of [1, -1]) {
      const w = new THREE.Group();
      w.add(holo(tyreGeom, CYAN, 0.04, 0.8, 30));
      const cap = at(holo(capGeom, CYAN, 0.06, 0.9), 0, 0, side * 0.19);
      const aero = new THREE.Group();
      aero.add(holo(rimGeom, AMBER, 0.15, 1));
      for (let k = 0; k < 5; k++) {
        const s = holo(spokeGeom, AMBER, 0.2, 1);
        s.rotation.z = (k / 5) * Math.PI * 2;
        aero.add(s);
      }
      aero.position.z = side * 0.19;
      w.add(cap, aero);
      w.userData = { side, z: side * 1.5 };
      at(w, x, Y(337), side * 1.5);
      parts.wheels.push(w);
      parts.caps.push(cap);
      parts.aeros.push(aero);
      car.add(w);
    }
  }

  // lamps: old round chrome lamps and new LED rings, front and back
  parts.oldLamps = new THREE.Group();
  parts.newLamps = new THREE.Group();
  const oldLamp = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20).rotateZ(Math.PI / 2);
  const ring = new THREE.TorusGeometry(0.15, 0.03, 8, 28).rotateY(Math.PI / 2);
  const dot = new THREE.CircleGeometry(0.07, 20).rotateY(-Math.PI / 2);
  for (const z of [1.2, -1.2]) {
    parts.oldLamps.add(at(holo(oldLamp, CYAN, 0.1, 0.9), X(110), Y(243), z));
    parts.oldLamps.add(at(holo(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 14).rotateZ(Math.PI / 2), CYAN, 0.1, 0.9), X(926), Y(244), z));
    const r = at(holo(ring, AMBER, 0.2, 1), X(108), Y(243), z);
    r.add(holo(dot, AMBER, 0.6, 1));
    parts.newLamps.add(r);
  }
  // light bar across the whole tail
  parts.lightBar = at(holo(new THREE.BoxGeometry(0.05, 0.07, 2.9), AMBER, 0.5, 1), X(934), Y(250), 0);
  // charging port behind the old fuel flap
  parts.port = at(holo(new THREE.BoxGeometry(0.24, 0.16, 0.04), AMBER, 0.4, 1), X(853), Y(227), 1.7);
  car.add(parts.oldLamps, parts.newLamps, parts.lightBar, parts.port);

  /* ---------- old drivetrain (red) ---------- */
  parts.engine = new THREE.Group();
  parts.engine.add(holo(new THREE.BoxGeometry(1.0, 0.6, 0.85), RED, 0.12, 1));
  for (let i = 0; i < 4; i++) {
    parts.engine.add(at(holo(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12), RED, 0.1, 0.9), -0.33 + i * 0.22, 0.4, 0));
  }
  parts.engine.add(at(holo(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 20), RED, 0.1, 0.9), 0, 0.6, 0));
  parts.engine.add(at(holo(new THREE.BoxGeometry(0.08, 0.6, 1.5), RED, 0.06, 0.8), -1.05, 0.0, 0)); // radiator
  at(parts.engine, -2.55, 1.15, 0);

  parts.oldRest = new THREE.Group(); // gearbox, propshaft, exhaust, tank
  parts.oldRest.add(at(holo(new THREE.CylinderGeometry(0.2, 0.28, 0.7, 14).rotateZ(Math.PI / 2), RED, 0.07, 0.9), -1.75, 1.0, 0));
  parts.oldRest.add(at(holo(new THREE.CylinderGeometry(0.05, 0.05, 3.9, 8).rotateZ(Math.PI / 2), RED, 0.1, 0.8), 0.45, 0.72, 0));
  parts.oldRest.add(at(holo(new THREE.SphereGeometry(0.22, 12, 8), RED, 0.07, 0.8), 2.5, 0.62, 0));
  parts.oldRest.add(at(holo(new THREE.CylinderGeometry(0.055, 0.055, 6.2, 8).rotateZ(Math.PI / 2), RED, 0.1, 0.8), 1.0, 0.36, 0.55));
  parts.oldRest.add(at(holo(new THREE.BoxGeometry(0.9, 0.22, 0.4), RED, 0.07, 0.9), 2.2, 0.36, 0.55)); // silencer
  parts.oldRest.add(at(holo(new THREE.BoxGeometry(0.6, 0.35, 1.6), RED, 0.07, 0.9), 3.45, 0.8, 0)); // fuel tank
  car.add(parts.engine, parts.oldRest);

  /* ---------- new heart (amber) ---------- */
  // battery: a flat pack split into modules, so the edges draw a grid of cells
  parts.battery = new THREE.Group();
  const modGeom = new THREE.BoxGeometry(0.58, 0.2, 0.62);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      parts.battery.add(at(holo(modGeom, AMBER, 0.08, 0.9), -1.55 + i * 0.62, 0, -0.99 + j * 0.66));
    }
  }
  at(parts.battery, 0.05, 0.42, 0);

  parts.motor = new THREE.Group();
  parts.motor.add(holo(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 20).rotateX(Math.PI / 2), AMBER, 0.12, 1));
  parts.motor.add(at(holo(new THREE.BoxGeometry(0.5, 0.3, 0.6), AMBER, 0.1, 1), -0.45, 0.25, 0)); // inverter
  parts.motor.add(holo(new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8).rotateX(Math.PI / 2), AMBER, 0.2, 0.9)); // drive shafts
  at(parts.motor, X(760), Y(337) + 0.03, 0);

  // orange high-voltage cables: battery to motor, battery to charge port
  const cable = (pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 30, 0.035, 6);
  parts.cables = new THREE.Group();
  parts.cables.add(holo(cable([[1.9, 0.45, 0.3], [2.05, 0.6, 0.3], [2.05, 0.85, 0.1]]), AMBER, 0.4, 1));
  parts.cables.add(holo(cable([[1.9, 0.45, -0.3], [2.6, 0.9, -0.9], [3.2, 1.5, 1.2], [X(853), Y(227), 1.62]]), AMBER, 0.4, 1));
  car.add(parts.battery, parts.motor, parts.cables);

  return { car, parts };
}

/* ---------------- scene ---------------- */

export function init({ canvas, section, getProgress, callouts }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) {
    return false; // no WebGL: the SVG fallback stays
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(NIGHT, 1);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NIGHT, 16, 42);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const { car, parts } = buildCar();
  scene.add(car);

  // glowing grid floor and a turntable ring
  const grid = new THREE.GridHelper(140, 280, CYAN, 0x2f6f8f);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);
  const ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.64, 128).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.01;
  const ticks = new THREE.Group();
  for (let i = 0; i < 72; i++) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.03, i % 6 ? 0.18 : 0.4).rotateX(-Math.PI / 2), ringMat);
    const a = (i / 72) * Math.PI * 2;
    t.position.set(Math.cos(a) * 5.9, 0.012, Math.sin(a) * 5.9);
    t.rotation.y = -a;
    ticks.add(t);
  }
  scene.add(ring, ticks);

  // scanning beam that sweeps along the car
  const beam = new THREE.Group();
  beam.add(holo(new THREE.PlaneGeometry(4.6, 3.4).rotateY(Math.PI / 2), CYAN, 0.03, 0.5));
  beam.add(holo(new THREE.BoxGeometry(0.01, 3.4, 4.6), CYAN, 0.0, 0.35));
  beam.position.y = 1.7;
  scene.add(beam);

  // camera path: one key per stage
  const keys = [
    { p: 0.0, az: 1.05, el: 0.22, r: 13.5, tx: 0, ty: 1.0 },
    { p: 0.16, az: 0.85, el: 0.36, r: 15, tx: 0, ty: 1.4 },
    { p: 0.3, az: 0.62, el: 0.42, r: 12.5, tx: -1.6, ty: 1.4 },
    { p: 0.46, az: 0.75, el: 0.42, r: 15, tx: -1.0, ty: 1.8 },
    { p: 0.62, az: 1.2, el: 0.5, r: 14, tx: 0.4, ty: 0.9 },
    { p: 0.74, az: 0.5, el: 0.2, r: 13.5, tx: -1.2, ty: 1.2 },
    { p: 0.84, az: 2.5, el: 0.22, r: 13.5, tx: 1.2, ty: 1.1 },
    { p: 1.0, az: 1.15, el: 0.2, r: 13.5, tx: 0, ty: 1.0 },
  ];
  function cameraAt(p) {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i], b = keys[i + 1];
    const t = seg(p, a.p, b.p);
    const o = {};
    for (const k of ["az", "el", "r", "tx", "ty"]) o[k] = lerp(a[k], b[k], t);
    return o;
  }

  const target = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let aspect = 1;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    // leave room for the words: car moves right on wide screens, up on phones
    if (aspect > 1) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.08, w, h);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // smooth the scroll value a little so the motion feels mechanical, not jumpy
  let shown = getProgress();

  function update(p, time) {
    /* panels fly apart, then come back at the end */
    const ex = seg(p, 0.1, 0.24) * (1 - seg(p, 0.84, 0.93));
    parts.cabin.position.y = ex * 1.8;
    parts.bonnet.position.set(-ex * 0.7, ex * 1.4, 0);
    parts.bonnet.rotation.z = ex * 0.25;
    parts.boot.position.set(ex * 0.6, ex * 1.2, 0);
    parts.boot.rotation.z = -ex * 0.2;
    for (const d of parts.doors) {
      d.position.z = d.userData.z + d.userData.side * ex * 1.2;
      d.position.y = ex * 0.15;
    }
    for (const w of parts.wheels) w.position.z = w.userData.z + w.userData.side * ex * 1.1;

    /* old parts glow, then leave */
    const glow = seg(p, 0.2, 0.3);
    const out = seg(p, 0.4, 0.52);
    const pulse = reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(time * 5);
    const oldK = (0.22 + 0.78 * glow * pulse) * (1 - out);
    parts.engine.position.y = 1.15 + out * 3.4;
    parts.engine.rotation.y = out * 0.6;
    parts.oldRest.position.y = -out * 1.6;
    fade(parts.engine, oldK);
    fade(parts.oldRest, oldK);

    /* new heart comes in */
    const inn = seg(p, 0.54, 0.66);
    parts.battery.position.y = 0.42 - (1 - inn) * 2.4;
    fade(parts.battery, inn);
    parts.motor.position.x = X(760) + (1 - inn) * 3.5;
    fade(parts.motor, inn);
    fade(parts.cables, seg(p, 0.63, 0.7));

    /* modern touches */
    const m = seg(p, 0.7, 0.82);
    fade(parts.oldLamps, 1 - m);
    fade(parts.newLamps, m);
    parts.newLamps.children.forEach((l) => l.scale.setScalar(0.3 + 0.7 * m));
    parts.lightBar.scale.z = Math.max(0.001, m);
    fade(parts.lightBar, m);
    fade(parts.port, m);
    parts.caps.forEach((c) => fade(c, 1 - m));
    parts.aeros.forEach((a) => {
      fade(a, m);
      a.scale.setScalar(0.4 + 0.6 * m);
      if (!reduceMotion) a.rotation.z = -time * 1.5 * seg(p, 0.92, 1); // wheels turn once rebuilt
    });

    /* camera */
    const c = cameraAt(p);
    const drift = reduceMotion ? 0 : Math.sin(time * 0.25) * 0.04;
    // narrow screens: pull back so the whole car fits
    const fit = aspect > 1 ? Math.max(1.12, 1.9 / aspect) : Math.max(1, 1.45 / aspect);
    const r = c.r * fit;
    // keep the fog relative to the camera, so a pulled-back camera on phones
    // does not wash the car out
    scene.fog.near = r * 1.15;
    scene.fog.far = r * 3;
    target.set(c.tx * Math.min(1, 1.2 / fit + 0.3), c.ty, 0);
    camera.position.set(
      target.x - r * Math.cos(c.el) * Math.cos(c.az + drift),
      target.y + r * Math.sin(c.el),
      target.z + r * Math.cos(c.el) * Math.sin(c.az + drift)
    );
    camera.lookAt(target);

    /* scanner and turntable */
    beam.position.x = Math.sin(time * 0.7) * 4.8;
    fade(beam, reduceMotion ? 0 : 1);
    ticks.rotation.y = time * 0.05;

    /* HTML callouts pinned to parts */
    placeCallout(callouts.engine, parts.engine, glow * (1 - seg(p, 0.38, 0.42)));
    placeCallout(callouts.battery, parts.battery, seg(p, 0.6, 0.64) * (1 - seg(p, 0.7, 0.74)));
    placeCallout(callouts.motor, parts.motor, seg(p, 0.62, 0.66) * (1 - seg(p, 0.7, 0.74)));
  }

  function placeCallout(el, obj, k) {
    if (!el) return;
    if (k < 0.02) { el.style.opacity = 0; return; }
    obj.getWorldPosition(tmp);
    tmp.y += 0.6;
    tmp.project(camera);
    const x = (tmp.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-tmp.y * 0.5 + 0.5) * canvas.clientHeight;
    el.style.opacity = k;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }

  let running = false;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    const goal = getProgress();
    shown += (goal - shown) * (reduceMotion ? 1 : 0.12);
    update(shown, clock.getElapsedTime());
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
    if (running) requestAnimationFrame(frame);
  }).observe(section);

  // draw one frame right away
  update(shown, 0);
  renderer.render(scene, camera);
  return true;
}
