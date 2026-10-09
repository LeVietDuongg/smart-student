// Three.js hero scenes for Smart Student: login (campus), dashboard welcome
// (desk) and game page (arcade). Loaded lazily by app.js when [data-scene]
// exists on the page.
//
// Realism comes from image-based lighting (RoomEnvironment), soft VSM shadows
// on an invisible floor, rounded geometry and physical materials (clearcoat,
// sheen, metalness). Scenes pause off-screen and in background tabs, render a
// single still frame under prefers-reduced-motion and dispose every GPU
// resource when their host leaves the DOM.
import * as THREE from "./vendor/three/three.module.min.js";
import { RoomEnvironment } from "./vendor/three/addons/RoomEnvironment.js";
import { RoundedBoxGeometry } from "./vendor/three/addons/RoundedBoxGeometry.js";

const C = {
  navy: 0x1d2a5c,
  fabric: 0x24306b,
  coral: 0xd9614a,
  teal: 0x2b8580,
  paper: 0xf1ece0,
  plastic: 0xf3f5f9,
  glass: 0x05070f,
  joint: 0x2b3352,
  cyan: 0x63e8ff,
  gold: 0xf0c35b,
  yarn: 0xe0a530,
  lacquer: 0x141a2f,
  wood: 0xd9b28a,
  graphite: 0x2b2f38,
  steel: 0xc9ced8,
  eraser: 0xe28f86,
  pencil: 0xf2b632,
};
const FONT = '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif';

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const mounted = new Set();
const pending = new WeakSet();

/* ------------------------------------------------------------------ kit -- */
// Owns the materials and textures of one scene so they can be disposed.
function createKit() {
  const owned = new Set();
  const own = (x) => (owned.add(x), x);
  return {
    own,
    phys: (o) => own(new THREE.MeshPhysicalMaterial(o)),
    basic: (o) => own(new THREE.MeshBasicMaterial(o)),
    texture(width, height, draw, { color = true, wrap = false } = {}) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      draw(canvas.getContext("2d"), width, height);
      const t = new THREE.CanvasTexture(canvas);
      if (color) t.colorSpace = THREE.SRGBColorSpace;
      if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      return own(t);
    },
    dispose() {
      owned.forEach((o) => o.dispose());
      owned.clear();
    },
  };
}

function part(geometry, material, { cast = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  return m;
}

function sharedTextures(kit) {
  const glow = kit.texture(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.3, "rgba(255,255,255,0.4)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });
  const pages = kit.texture(64, 256, (g, w, h) => {
    g.fillStyle = "#efe9dc";
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      g.fillStyle = `rgba(110,92,64,${0.05 + Math.random() * 0.12})`;
      g.fillRect(0, y, w, 1);
    }
  });
  return { glow, pages };
}

function glowSprite(kit, tex, color, size, opacity) {
  const s = new THREE.Sprite(
    kit.own(
      new THREE.SpriteMaterial({
        map: tex.glow,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  s.scale.setScalar(size);
  return s;
}

function labelTexture(kit, text, { width = 1024, height = 128, color = "#e9c46d", size = 0.4, bands = true } = {}) {
  return kit.texture(width, height, (g, w, h) => {
    g.fillStyle = color;
    if (bands)
      [0.05, 0.068, 0.932, 0.95].forEach((x) => g.fillRect(w * x, h * 0.14, Math.max(2, w * 0.004), h * 0.72));
    g.font = `600 ${Math.round(h * size)}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    if ("letterSpacing" in g) g.letterSpacing = `${Math.round(h * size * 0.14)}px`;
    g.fillText(text, w / 2, h * 0.54);
  });
}

function foil(kit, map) {
  return kit.phys({
    map,
    transparent: true,
    metalness: 0.7,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
}

/* --------------------------------------------------------------- models -- */
// A cloth-bound hardback lying flat, spine facing +z.
function book(kit, tex, { color, title, w = 1.9, d = 1.35, t = 0.3 }) {
  const g = new THREE.Group();
  const cloth = kit.phys({
    color,
    roughness: 0.6,
    sheen: 0.6,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35),
  });
  const board = () => part(new RoundedBoxGeometry(w, 0.05, d, 3, 0.022), cloth);
  const top = board();
  top.position.y = t / 2 - 0.025;
  const bottom = board();
  bottom.position.y = -t / 2 + 0.025;
  const spine = part(new RoundedBoxGeometry(w, t, 0.09, 4, 0.04), cloth);
  spine.position.z = d / 2 - 0.045;
  const edges = kit.phys({ map: tex.pages, roughness: 0.92 });
  const paper = kit.phys({ color: C.paper, roughness: 0.92 });
  const pages = part(new THREE.BoxGeometry(w - 0.07, t - 0.09, d - 0.1), [edges, edges, paper, paper, paper, edges]);
  pages.position.z = -0.02;
  g.add(top, bottom, spine, pages);
  if (title) {
    const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, t * 0.7), foil(kit, labelTexture(kit, title)));
    label.position.z = d / 2 + 0.003;
    g.add(label);
  }
  return g;
}

// Mortarboard with a fabric board, open skull, cord and an instanced tassel.
function gradCap(kit) {
  const cap = new THREE.Group();
  const fabric = kit.phys({
    color: C.fabric,
    roughness: 0.82,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0x8a9ad8),
  });
  const fabricInside = kit.own(fabric.clone());
  fabricInside.side = THREE.DoubleSide;
  const yarn = kit.phys({ color: C.yarn, roughness: 0.62, sheen: 1, sheenColor: new THREE.Color(0xffe3a3), sheenRoughness: 0.4 });
  const brass = kit.phys({ color: C.gold, metalness: 1, roughness: 0.25 });

  const board = part(new RoundedBoxGeometry(2.2, 0.07, 2.2, 3, 0.03), fabric);
  board.rotation.y = Math.PI / 4;
  const skull = part(new THREE.CylinderGeometry(0.72, 0.78, 0.5, 64, 1, true), fabricInside);
  skull.position.y = -0.28;
  const rim = part(new THREE.TorusGeometry(0.78, 0.03, 12, 64), fabric);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.53;
  const button = part(new THREE.SphereGeometry(0.08, 24, 12), fabric);
  button.scale.y = 0.45;
  button.position.y = 0.045;

  // The cord runs from the button to the front-right edge, then hangs.
  const lip = new THREE.Vector3(0.8, 0.03, 0.8);
  const cord = part(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.07, 0),
        new THREE.Vector3(0.38, 0.07, 0.38),
        new THREE.Vector3(0.74, 0.06, 0.74),
        lip,
      ]),
      32,
      0.018,
      8,
    ),
    yarn,
  );
  const hang = new THREE.Group();
  hang.position.copy(lip);
  const drop = part(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), yarn);
  drop.position.y = -0.21;
  const collar = part(new THREE.CylinderGeometry(0.05, 0.045, 0.09, 24), brass);
  collar.position.y = -0.46;
  const strandCount = 44;
  const strands = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0075, 0.0065, 1, 5), yarn, strandCount);
  strands.castShadow = true;
  const m = new THREE.Object3D();
  for (let i = 0; i < strandCount; i++) {
    const a = (i / strandCount) * Math.PI * 2 * 3.3;
    const r = 0.012 + (i / strandCount) * 0.036;
    const len = 0.36 + Math.sin(i * 7.31) * 0.03;
    m.position.set(Math.cos(a) * r, -0.5 - len / 2, Math.sin(a) * r);
    m.rotation.set(Math.sin(a) * r * 1.6, 0, -Math.cos(a) * r * 1.6);
    m.scale.set(1, len, 1);
    m.updateMatrix();
    strands.setMatrixAt(i, m.matrix);
  }
  hang.add(drop, collar, strands);
  cap.add(board, skull, rim, button, cord, hang);
  cap.userData.hang = hang;
  return cap;
}

// Rounded mascot robot, matching the illustration used elsewhere in the app.
function robot(kit, tex) {
  const shell = kit.phys({ color: C.plastic, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
  const glass = kit.phys({ color: C.glass, roughness: 0.06, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 });
  const joint = kit.phys({ color: C.joint, roughness: 0.4, metalness: 0.5 });
  const light = kit.basic({ color: C.cyan });
  light.toneMapped = false;

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const torso = part(new THREE.CapsuleGeometry(0.6, 0.38, 12, 40), shell);
  torso.scale.set(1.05, 1, 0.9);
  torso.position.y = -0.62;
  const chest = part(new RoundedBoxGeometry(0.66, 0.34, 0.14, 4, 0.07), glass);
  chest.position.set(0, -0.5, 0.5);
  const bar = part(new RoundedBoxGeometry(0.34, 0.05, 0.02, 2, 0.01), light, { cast: false });
  bar.position.set(0, -0.5, 0.578);
  const neck = part(new THREE.CylinderGeometry(0.2, 0.24, 0.22, 32), joint);
  neck.position.y = 0.04;
  const thruster = part(new THREE.CylinderGeometry(0.2, 0.28, 0.12, 32), joint);
  thruster.position.y = -1.43;
  const flame = glowSprite(kit, tex, C.cyan, 0.95, 0.6);
  flame.position.y = -1.6;
  body.add(torso, chest, bar, neck, thruster, flame);

  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.66, -0.28, 0);
    const shoulder = part(new THREE.SphereGeometry(0.15, 24, 16), joint);
    const upper = part(new THREE.CapsuleGeometry(0.13, 0.36, 8, 24), shell);
    upper.position.y = -0.3;
    const hand = part(new THREE.SphereGeometry(0.16, 24, 16), shell);
    hand.position.y = -0.62;
    arm.add(shoulder, upper, hand);
    arm.rotation.z = side * 0.22;
    body.add(arm);
    return arm;
  });

  const head = new THREE.Group();
  head.position.y = 0.8;
  body.add(head);
  const helmet = part(new RoundedBoxGeometry(1.8, 1.34, 1.42, 8, 0.52), shell);
  const visor = part(new RoundedBoxGeometry(1.44, 0.96, 0.3, 8, 0.3), glass);
  visor.position.z = 0.6;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.8),
    kit.own(
      new THREE.MeshBasicMaterial({
        map: tex.glow,
        color: C.cyan,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  screen.position.z = 0.752;
  const eyeGeo = new THREE.CapsuleGeometry(0.08, 0.14, 8, 20);
  const eyes = [-0.3, 0.3].map((x) => {
    const e = part(eyeGeo, light, { cast: false });
    e.position.set(x, 0.08, 0.745);
    e.scale.z = 0.3;
    return e;
  });
  const happyGeo = new THREE.TorusGeometry(0.12, 0.033, 10, 32, Math.PI);
  const happy = [-0.3, 0.3].map((x) => {
    const e = part(happyGeo, light, { cast: false });
    e.position.set(x, 0.02, 0.75);
    e.scale.z = 0.4;
    e.visible = false;
    return e;
  });
  const smile = part(new THREE.TorusGeometry(0.13, 0.028, 10, 32, Math.PI), light, { cast: false });
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.2, 0.75);
  smile.scale.z = 0.4;
  head.add(helmet, visor, screen, ...eyes, ...happy, smile);
  [-1, 1].forEach((side) => {
    const ear = part(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 40), shell);
    ear.rotation.z = Math.PI / 2;
    ear.position.x = side * 0.9;
    const ring = part(new THREE.TorusGeometry(0.2, 0.035, 12, 40), light, { cast: false });
    ring.rotation.y = Math.PI / 2;
    ring.position.x = side * 1.005;
    const pad = part(new THREE.CircleGeometry(0.17, 32), glass, { cast: false });
    pad.rotation.y = (side * Math.PI) / 2;
    pad.position.x = side * 1.004;
    head.add(ear, ring, pad);
  });
  const cap = gradCap(kit);
  cap.scale.setScalar(0.74);
  cap.position.set(0.02, 0.8, -0.02);
  cap.rotation.set(-0.05, 0.3, -0.1);
  head.add(cap);

  root.userData = { body, head, arms, eyes, happy, flame, cap };
  return root;
}

function mug(kit, tex) {
  const g = new THREE.Group();
  const ceramic = kit.phys({ color: 0xf4f5f7, roughness: 0.26, clearcoat: 0.8, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
  const profile = [
    [0, 0], [0.34, 0], [0.39, 0.015], [0.415, 0.05], [0.43, 0.72], [0.445, 0.75], [0.43, 0.772],
    [0.405, 0.76], [0.395, 0.7], [0.385, 0.1], [0, 0.1],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = part(new THREE.LatheGeometry(profile, 72), ceramic);
  const band = part(
    new THREE.CylinderGeometry(0.4325, 0.4305, 0.09, 72, 1, true),
    kit.phys({ color: C.navy, roughness: 0.3, clearcoat: 1 }),
  );
  band.position.y = 0.52;
  const coffee = part(new THREE.CircleGeometry(0.392, 48), kit.phys({ color: 0x3a2214, roughness: 0.1, clearcoat: 1 }), { cast: false });
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.63;
  const handle = part(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.41, 0.6, 0),
        new THREE.Vector3(0.66, 0.6, 0),
        new THREE.Vector3(0.74, 0.39, 0),
        new THREE.Vector3(0.64, 0.18, 0),
        new THREE.Vector3(0.41, 0.17, 0),
      ]),
      48,
      0.052,
      16,
    ),
    ceramic,
  );
  g.add(body, band, coffee, handle);
  const steam = [];
  for (let i = 0; i < 7; i++) {
    const s = glowSprite(kit, tex, 0xffffff, 0.34, 0);
    s.userData.phase = i / 7;
    steam.push(s);
    g.add(s);
  }
  g.userData.steam = steam;
  return g;
}

function pencil(kit) {
  const g = new THREE.Group();
  const lacquer = kit.phys({ color: C.pencil, roughness: 0.32, clearcoat: 0.7 });
  const body = part(new THREE.CylinderGeometry(0.065, 0.065, 1.5, 6), lacquer);
  const wood = part(new THREE.CylinderGeometry(0.065, 0.016, 0.24, 24), kit.phys({ color: C.wood, roughness: 0.85 }));
  wood.position.y = 0.87;
  const lead = part(new THREE.ConeGeometry(0.016, 0.05, 16), kit.phys({ color: C.graphite, roughness: 0.4, metalness: 0.4 }));
  lead.position.y = 1.015;
  const ridges = [new THREE.Vector2(0, -0.07)];
  for (let i = 0; i <= 12; i++) ridges.push(new THREE.Vector2(0.069 + (i % 3 === 0 ? 0.004 : 0), -0.07 + (i / 12) * 0.14));
  ridges.push(new THREE.Vector2(0, 0.07));
  const ferrule = part(new THREE.LatheGeometry(ridges, 32), kit.phys({ color: C.steel, metalness: 1, roughness: 0.3 }));
  ferrule.position.y = -0.82;
  const eraser = part(new THREE.CapsuleGeometry(0.062, 0.1, 6, 24), kit.phys({ color: C.eraser, roughness: 0.9 }));
  eraser.position.y = -0.95;
  g.add(body, wood, lead, ferrule, eraser);
  return g;
}

function trophy(kit) {
  const g = new THREE.Group();
  const gold = kit.phys({ color: C.gold, metalness: 1, roughness: 0.16, clearcoat: 0.3 });
  const lacquer = kit.phys({ color: C.lacquer, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 });
  const base = part(new RoundedBoxGeometry(1.0, 0.34, 1.0, 4, 0.05), lacquer);
  base.position.y = 0.17;
  const step = part(new RoundedBoxGeometry(0.72, 0.12, 0.72, 3, 0.03), lacquer);
  step.position.y = 0.4;
  const plaque = part(new RoundedBoxGeometry(0.52, 0.13, 0.014, 2, 0.006), kit.phys({ color: C.gold, metalness: 1, roughness: 0.38 }));
  plaque.position.set(0, 0.17, 0.503);
  const profile = [
    [0, 0], [0.3, 0], [0.3, 0.04], [0.24, 0.08], [0.11, 0.12], [0.075, 0.2], [0.07, 0.4],
    [0.11, 0.45], [0.07, 0.5], [0.085, 0.56], [0.2, 0.64], [0.36, 0.78], [0.47, 0.98],
    [0.5, 1.2], [0.505, 1.28], [0.48, 1.29], [0.465, 1.22], [0.435, 1.0], [0.33, 0.83],
    [0.13, 0.7], [0, 0.68],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = part(new THREE.LatheGeometry(profile, 96), gold);
  cup.position.y = 0.46;
  [-1, 1].forEach((side) => {
    const handle = part(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.47, 1.62, 0),
          new THREE.Vector3(side * 0.8, 1.62, 0),
          new THREE.Vector3(side * 0.85, 1.38, 0),
          new THREE.Vector3(side * 0.6, 1.2, 0),
          new THREE.Vector3(side * 0.32, 1.2, 0),
        ]),
        48,
        0.042,
        12,
      ),
      gold,
    );
    g.add(handle);
  });
  g.add(base, step, plaque, cup);
  return g;
}

function coinKit(kit) {
  const face = kit.texture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#fff";
      g.lineWidth = 14;
      g.beginPath();
      g.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#fff";
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? w * 0.12 : w * 0.27;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    },
    { color: false },
  );
  const edge = kit.texture(
    64,
    8,
    (g, w, h) => {
      for (let x = 0; x < w; x++) {
        g.fillStyle = x % 4 < 2 ? "#fff" : "#000";
        g.fillRect(x, 0, 1, h);
      }
    },
    { color: false, wrap: true },
  );
  edge.repeat.set(10, 1);
  const metal = { color: C.gold, metalness: 1, roughness: 0.24 };
  const materials = [
    kit.phys({ ...metal, bumpMap: edge, bumpScale: 1 }),
    kit.phys({ ...metal, bumpMap: face, bumpScale: 1 }),
    kit.phys({ ...metal, bumpMap: face, bumpScale: 1 }),
  ];
  const geometry = new THREE.CylinderGeometry(0.42, 0.42, 0.075, 72);
  return () => part(geometry, materials);
}

const PIPS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
  6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};
const DIE_FACES = [
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], value: 1 },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], value: 6 },
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], value: 2 },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], value: 5 },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], value: 3 },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], value: 4 },
];

function die(kit) {
  const size = 0.62;
  const g = new THREE.Group();
  const resin = kit.phys({ color: C.coral, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 });
  g.add(part(new RoundedBoxGeometry(size, size, size, 5, 0.1), resin));
  const pipMat = kit.phys({ color: 0xf7f7f5, roughness: 0.35, clearcoat: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const pipGeo = new THREE.CircleGeometry(0.056, 24);
  const z = new THREE.Vector3(0, 0, 1);
  DIE_FACES.forEach(({ n, u, v, value }) => {
    const N = new THREE.Vector3(...n);
    const U = new THREE.Vector3(...u);
    const V = new THREE.Vector3(...v);
    PIPS[value].forEach(([a, b]) => {
      const pip = part(pipGeo, pipMat, { cast: false });
      pip.quaternion.setFromUnitVectors(z, N);
      pip.position.copy(N).multiplyScalar(size / 2 + 0.002).addScaledVector(U, a * 0.165).addScaledVector(V, b * 0.165);
      g.add(pip);
    });
  });
  g.userData.size = size;
  return g;
}

/* --------------------------------------------------------------- scenes -- */
// Each preset builds its objects and returns { layout(aspect), update(t, dt, pointer) }.
// layout(aspect, height) sets ctx.cameraBase / ctx.target for the host size.
const presets = {
  // Login: the mascot hovers, follows the pointer and looks away while the
  // password field has focus. Click it for a happy spin.
  campus(ctx) {
    const { scene, camera, kit, tex } = ctx;
    ctx.globalPointer = true;
    ctx.parallax.set(0.3, 0.2);
    ctx.floor.position.y = -2.05;
    // Light from almost straight above so the hover shadow sits under the robot.
    ctx.key.position.set(1.2, 9, 2.5);
    camera.fov = 30;
    const bot = robot(kit, tex);
    const u = bot.userData;
    scene.add(bot);

    const left = book(kit, tex, { color: C.teal, title: "KINH TẾ VI MÔ", w: 1.6, d: 1.15, t: 0.26 });
    left.rotation.set(0.35, 0.7, -0.25);
    const right = book(kit, tex, { color: C.coral, title: "MARKETING", w: 1.5, d: 1.1, t: 0.24 });
    right.rotation.set(-0.3, -0.6, 0.35);
    const pen = pencil(kit);
    pen.scale.setScalar(0.85);
    pen.rotation.set(0.4, 0.2, 1.1);
    [left, right, pen].forEach((o) => o.traverse((m) => (m.castShadow = false)));
    scene.add(left, right, pen);

    const dust = new THREE.BufferGeometry();
    const pts = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 9;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pts[i * 3 + 2] = -3 + Math.random() * 4;
    }
    dust.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const motes = new THREE.Points(
      dust,
      kit.own(
        new THREE.PointsMaterial({
          size: 0.05,
          map: tex.glow,
          color: 0xa9c0ff,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    scene.add(motes);

    const state = { yaw: 0, pitch: 0, shy: 0, shyTarget: 0, nextBlink: 1.6, lastBlink: -9, hop: -1, baseY: 0, books: [] };
    const onFocus = (e) => {
      if (e.target?.matches?.('input[type="password"]')) state.shyTarget = e.type === "focusin" ? 1 : 0;
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    ctx.cleanup.push(() => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
    });
    bot.userData.onClick = () => {
      if (state.hop < 0) state.hop = 0;
    };

    return {
      layout(aspect, height) {
        // Phones: the panel is short, so the robot stands alone on the right
        // above the headline. Desktop: robot centred with floating books.
        const phone = height < 600;
        state.baseY = 0.45;
        bot.position.set(phone ? 1.55 : 0.15, state.baseY, 0);
        [left, right, pen].forEach((o) => (o.visible = !phone));
        state.books = [[left, -1.75, -0.8, -0.6], [right, 2.0, 0.55, -1.0], [pen, 1.7, -1.2, 0.6]];
        ctx.cameraBase.set(0, 0.35, phone ? 16 : 13.5);
        ctx.target.set(0, phone ? -0.75 : -0.45, 0);
      },
      update(t, dt, pointer) {
        state.shy += (state.shyTarget - state.shy) * Math.min(1, dt * 6);
        const px = THREE.MathUtils.clamp(pointer.x, -1.4, 1.4);
        const py = THREE.MathUtils.clamp(pointer.y, -1, 1);
        const yawTarget = px * 0.42 * (1 - state.shy) - 0.75 * state.shy;
        const pitchTarget = -py * 0.2 * (1 - state.shy) + 0.22 * state.shy;
        state.yaw += (yawTarget - state.yaw) * Math.min(1, dt * 5);
        state.pitch += (pitchTarget - state.pitch) * Math.min(1, dt * 5);
        u.head.rotation.set(state.pitch, state.yaw, -state.yaw * 0.08);
        u.body.rotation.y = state.yaw * 0.3;
        u.body.position.y = Math.sin(t * 1.3) * 0.08;
        u.arms.forEach((arm, i) => {
          const side = i ? 1 : -1;
          arm.rotation.z = side * (0.22 + Math.sin(t * 1.3 + i) * 0.03 + state.shy * 0.25);
          arm.rotation.x = -state.shy * 0.5;
        });
        u.flame.material.opacity = 0.45 + Math.sin(t * 17) * 0.06 + Math.sin(t * 5.3) * 0.05;

        // Blink every few seconds; keep the eyes nearly shut while shy.
        if (t > state.nextBlink) {
          state.lastBlink = t;
          state.nextBlink = t + 2.4 + Math.random() * 2.8;
        }
        const phase = (t - state.lastBlink) / 0.18;
        const blink = phase >= 0 && phase < 1 ? Math.sin(phase * Math.PI) : 0;
        const open = Math.max(0.12, 1 - Math.max(blink * 0.95, state.shy * 0.9));
        u.eyes.forEach((e) => (e.scale.y = open));

        let hopY = 0;
        if (state.hop >= 0) {
          state.hop += dt / 1.1;
          const k = Math.min(1, state.hop);
          bot.rotation.y = easeOut(k) * Math.PI * 2;
          hopY = Math.sin(k * Math.PI) * 0.5;
          u.eyes.forEach((e) => (e.visible = false));
          u.happy.forEach((e) => (e.visible = true));
          if (k >= 1) {
            state.hop = -1;
            bot.rotation.y = 0;
            u.eyes.forEach((e) => (e.visible = true));
            u.happy.forEach((e) => (e.visible = false));
          }
        }
        bot.position.y = state.baseY + hopY;
        u.cap.userData.hang.rotation.z = Math.sin(t * 1.6) * 0.07 - state.yaw * 0.15;
        u.cap.userData.hang.rotation.x = Math.cos(t * 1.3) * 0.05;
        state.books.forEach(([o, x, y, z], i) => {
          o.position.set(x, y + Math.sin(t * (0.8 + i * 0.13) + i * 2) * 0.1, z);
        });
        left.rotation.y = 0.7 + Math.sin(t * 0.4) * 0.1;
        right.rotation.x = -0.3 + Math.sin(t * 0.5) * 0.08;
        pen.rotation.z = 1.1 + Math.sin(t * 0.7) * 0.12;
        motes.position.y = ((t * 0.08) % 1) * 0.6;
        motes.rotation.y = t * 0.02;
      },
    };
  },

  // Dashboard: a desk still life of a book stack, mortarboard, mug and pencil.
  // Click the cap to toss it.
  desk(ctx) {
    const { scene, camera, kit, tex } = ctx;
    camera.fov = 26;
    ctx.parallax.set(0.6, 0.3);
    ctx.floor.position.y = 0;
    const group = new THREE.Group();
    group.rotation.y = -0.42;
    scene.add(group);
    const specs = [
      { color: C.coral, title: "QUẢN TRỊ HỌC", w: 2.05, d: 1.45, t: 0.34, ry: 0.05 },
      { color: C.navy, title: "KINH TẾ VI MÔ", w: 1.9, d: 1.38, t: 0.3, ry: -0.09 },
      { color: C.teal, title: "MARKETING", w: 1.75, d: 1.28, t: 0.28, ry: 0.12 },
    ];
    let y = 0;
    specs.forEach((s) => {
      const b = book(kit, tex, s);
      b.position.set(0, y + s.t / 2, 0);
      b.rotation.y = s.ry;
      y += s.t;
      group.add(b);
    });
    const cap = gradCap(kit);
    cap.scale.setScalar(0.62);
    const capRest = y + 0.53 * 0.62 + 0.02;
    cap.position.set(-0.05, capRest, -0.05);
    cap.rotation.y = 0.55;
    group.add(cap);
    const cup = mug(kit, tex);
    cup.scale.setScalar(0.92);
    cup.position.set(1.72, 0, 0.35);
    cup.rotation.y = -0.6;
    group.add(cup);
    const pen = pencil(kit);
    pen.rotation.set(0, 0.35, Math.PI / 2);
    pen.position.set(-0.2, 0.065, 1.25);
    group.add(pen);

    let toss = -1;
    cap.userData.onClick = () => {
      if (toss < 0) toss = 0;
    };
    return {
      layout(aspect) {
        const wide = aspect > 1.8;
        group.position.set(0.75, 0, 0);
        ctx.cameraBase.set(0.3, wide ? 2.4 : 3.4, wide ? 7.2 : 9.8);
        ctx.target.set(wide ? -0.4 : 1.15, wide ? 0.6 : 1.45, 0);
      },
      update(t, dt) {
        cup.userData.steam.forEach((s) => {
          const k = (t * 0.22 + s.userData.phase) % 1;
          s.position.set(Math.sin(k * 6 + s.userData.phase * 9) * 0.08, 0.8 + k * 0.95, Math.cos(k * 5) * 0.05);
          s.scale.setScalar(0.22 + k * 0.4);
          s.material.opacity = Math.sin(k * Math.PI) * 0.16;
        });
        cap.userData.hang.rotation.z = Math.sin(t * 1.5) * 0.05;
        if (toss >= 0) {
          toss += dt / 0.9;
          const k = Math.min(1, toss);
          cap.position.y = capRest + Math.sin(k * Math.PI) * 0.7;
          cap.rotation.y = 0.55 + easeOut(k) * Math.PI * 2;
          if (k >= 1) toss = -1;
        }
      },
    };
  },

  // Games: a gold trophy on a turntable, a coin stack, a spinning coin and a
  // die that rolls when clicked.
  arcade(ctx) {
    const { scene, camera, kit } = ctx;
    camera.fov = 26;
    ctx.parallax.set(0.6, 0.3);
    ctx.floor.position.y = 0;
    const group = new THREE.Group();
    group.rotation.y = -0.28;
    scene.add(group);
    const cup = trophy(kit);
    cup.position.set(0.4, 0, -0.1);
    const makeCoin = coinKit(kit);
    const stack = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const c = makeCoin();
      c.position.set(Math.sin(i * 2.3) * 0.025, 0.0375 + i * 0.076, Math.cos(i * 1.7) * 0.025);
      c.rotation.y = i * 0.7;
      stack.add(c);
    }
    stack.position.set(-0.85, 0, 0.25);
    const lying = makeCoin();
    lying.position.set(-0.3, 0.0375, 0.95);
    lying.rotation.y = 0.4;
    const spinner = new THREE.Group();
    const spinCoin = makeCoin();
    spinCoin.rotation.x = Math.PI / 2;
    spinner.add(spinCoin);
    spinner.position.set(1.55, 0.42, 0.75);
    const dice = die(kit);
    const half = dice.userData.size / 2;
    dice.position.set(-1.1, half, 1.15);
    dice.rotation.y = 0.5;
    group.add(cup, stack, lying, spinner, dice);

    const up = new THREE.Vector3(0, 1, 0);
    const roll = { k: -1, from: new THREE.Quaternion(), to: new THREE.Quaternion(), axis: new THREE.Vector3() };
    const spin = new THREE.Quaternion();
    dice.userData.onClick = () => {
      if (roll.k >= 0) return;
      const face = DIE_FACES[Math.floor(Math.random() * 6)];
      roll.from.copy(dice.quaternion);
      // Turn the chosen face's normal to +y, then add a random yaw.
      roll.to
        .setFromUnitVectors(new THREE.Vector3(...face.n), up)
        .premultiply(new THREE.Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2));
      roll.axis.set(Math.random() - 0.5, Math.random() * 0.4, Math.random() - 0.5).normalize();
      roll.k = 0;
    };
    let boost = 0;
    cup.userData.onClick = () => (boost = 6);

    return {
      layout(aspect) {
        const wide = aspect > 2.6;
        group.position.set(wide ? 2.1 : 1.3, 0, 0);
        ctx.cameraBase.set(0.4, wide ? 2.3 : 3.2, wide ? 6.8 : 9.8);
        ctx.target.set(wide ? 0.6 : 1.45, wide ? 0.8 : 1.65, 0);
      },
      update(t, dt) {
        boost *= Math.pow(0.08, dt);
        cup.rotation.y += dt * (0.35 + boost);
        spinner.rotation.y = t * 7;
        spinner.rotation.z = Math.sin(t * 1.7) * 0.06;
        if (roll.k >= 0) {
          roll.k += dt / 1.05;
          const k = Math.min(1, roll.k);
          const e = easeOut(k);
          spin.setFromAxisAngle(roll.axis, (1 - e) * Math.PI * 6);
          dice.quaternion.slerpQuaternions(roll.from, roll.to, e).premultiply(spin);
          const bounce = k < 0.75 ? Math.sin((k / 0.75) * Math.PI) * 1.1 : Math.sin(((k - 0.75) / 0.25) * Math.PI) * 0.12;
          dice.position.y = half + bounce;
          if (k >= 1) {
            roll.k = -1;
            dice.quaternion.copy(roll.to);
            dice.position.y = half;
          }
        }
      },
    };
  },
};

/* ---------------------------------------------------------------- stage -- */
function addLights(scene, target, ctx) {
  const hemi = new THREE.HemisphereLight(0xdfe7ff, 0x141a33, 0.35);
  const key = new THREE.DirectionalLight(0xfff3e2, 2.4);
  key.position.set(3.5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 14;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  const cam = key.shadow.camera;
  cam.left = cam.bottom = -5;
  cam.right = cam.top = 5;
  cam.near = 0.5;
  cam.far = 25;
  key.target = target;
  const rim = new THREE.DirectionalLight(0x8db5ff, 1.6);
  rim.position.set(-5, 3.5, -5);
  scene.add(hemi, key, rim, target);
  ctx.key = key;
}

function disposeScene(entry) {
  entry.stop();
  entry.cleanup.forEach((fn) => fn());
  entry.scene.traverse((o) => o.geometry?.dispose());
  entry.kit.dispose();
  entry.env.dispose();
  entry.renderer.dispose();
  entry.renderer.domElement.remove();
  mounted.delete(entry);
}

async function fontsReady() {
  if (!document.fonts?.load) return;
  await Promise.race([
    document.fonts.load(`600 48px ${FONT}`),
    new Promise((r) => setTimeout(r, 1200)),
  ]).catch(() => {});
}

async function mount(host) {
  const preset = presets[host.dataset.scene];
  if (!preset || pending.has(host)) return;
  pending.add(host);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    host.classList.add("scene-fallback");
    return;
  }
  await fontsReady();
  if (!host.isConnected) {
    renderer.dispose();
    pending.delete(host);
    return;
  }
  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const canvas = renderer.domElement;
  canvas.className = "scene-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  room.dispose();
  pmrem.dispose();
  scene.environment = env.texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const kit = createKit();
  const tex = sharedTextures(kit);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    kit.own(new THREE.ShadowMaterial({ color: 0x03050d, opacity: 0.42 })),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const shadowTarget = new THREE.Object3D();
  const ctx = {
    scene,
    camera,
    kit,
    tex,
    floor,
    target: new THREE.Vector3(),
    cameraBase: new THREE.Vector3(0, 0, 10),
    parallax: new THREE.Vector2(0.4, 0.2),
    cleanup: [],
    globalPointer: false,
  };
  addLights(scene, shadowTarget, ctx);
  const api = preset(ctx);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, moved: false, cx: 0, cy: 0 };
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock(false);
  let frame = 0;
  let visible = true;
  let running = false;

  const draw = () => {
    camera.position.set(
      ctx.cameraBase.x + THREE.MathUtils.clamp(pointer.x, -1.2, 1.2) * ctx.parallax.x,
      ctx.cameraBase.y + THREE.MathUtils.clamp(pointer.y, -1, 1) * ctx.parallax.y,
      ctx.cameraBase.z,
    );
    camera.lookAt(ctx.target);
    renderer.render(scene, camera);
  };
  const size = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    api.layout(camera.aspect, height);
    camera.updateProjectionMatrix();
    shadowTarget.position.copy(ctx.target);
    if (!running) {
      api.update(clock.elapsedTime, 0, pointer);
      draw();
    }
  };

  const clickable = (hit) => {
    let o = hit?.object;
    while (o && !o.userData.onClick) o = o.parent;
    return o;
  };
  const pick = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1)),
      camera,
    );
    const hits = raycaster.intersectObjects(scene.children, true);
    return clickable(hits.find((h) => h.object.visible && h.object.isMesh && h.object !== floor));
  };

  const tick = () => {
    if (!canvas.isConnected) return disposeScene(entry);
    const dt = Math.min(clock.getDelta(), 0.05);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);
    if (pointer.moved) {
      pointer.moved = false;
      canvas.style.cursor = pick(pointer.cx, pointer.cy) ? "pointer" : "default";
    }
    api.update(clock.elapsedTime, dt, pointer);
    draw();
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || reducedMotion() || !visible || document.hidden) return;
    running = true;
    if (!clock.running) clock.start();
    clock.getDelta();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const onMove = (ev) => {
    const r = host.getBoundingClientRect();
    pointer.tx = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    pointer.cx = ev.clientX;
    pointer.cy = ev.clientY;
    pointer.moved = ev.target === canvas;
  };
  const onLeave = () => {
    if (ctx.globalPointer) return;
    pointer.tx = 0;
    pointer.ty = 0;
  };
  const onClick = (ev) => {
    if (reducedMotion()) return;
    pick(ev.clientX, ev.clientY)?.userData.onClick();
  };
  const moveTarget = ctx.globalPointer ? window : host;
  moveTarget.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);
  ctx.cleanup.push(() => {
    moveTarget.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerleave", onLeave);
  });

  const observer = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    visible ? start() : stop();
  });
  observer.observe(host);
  const resize = new ResizeObserver(size);
  resize.observe(host);
  ctx.cleanup.push(() => {
    observer.disconnect();
    resize.disconnect();
  });

  const entry = { host, scene, renderer, kit, env, cleanup: ctx.cleanup, stop, start };
  mounted.add(entry);
  pending.delete(host);
  size();
  host.classList.add("scene-ready");
  start();
}

document.addEventListener("visibilitychange", () =>
  mounted.forEach((m) => (document.hidden ? m.stop() : m.start())),
);

export function mountScenes(root = document) {
  // Sweep scenes whose host was replaced by a re-render.
  [...mounted].forEach((m) => !m.host.isConnected && disposeScene(m));
  root.querySelectorAll("[data-scene]").forEach((host) => {
    if ([...mounted].some((m) => m.host === host)) return;
    mount(host).catch((err) => {
      console.warn("Smart Student 3D:", err);
      host.querySelector(".scene-canvas")?.remove();
      host.classList.add("scene-fallback");
    });
  });
}
