// Three.js scenes for the hero areas (login, dashboard welcome, game page).
// Loaded lazily from app.js only when an element with [data-scene] exists.
// Each scene pauses off-screen / in background tabs, renders a single still
// frame under prefers-reduced-motion and is disposed when its host leaves the DOM.
import * as THREE from "./vendor/three/three.module.min.js";

const PALETTE = {
  navy: 0x1d2a5c,
  navyDeep: 0x121a3d,
  gold: 0xe2a62e,
  paper: 0xf4f2ec,
  slate: 0x8b95ad,
  mist: 0xdfe5f2,
  coral: 0xe0674f,
  teal: 0x2f8f8a,
};

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const mounted = new Set();

const std = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });

function graduationCap() {
  const cap = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.09, 2.2), std(PALETTE.navy, { roughness: 0.4 }));
  board.rotation.y = Math.PI / 4;
  const skull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.8, 0.62, 48, 1, true),
    std(PALETTE.navyDeep, { side: THREE.DoubleSide }),
  );
  skull.position.y = -0.34;
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 12), std(PALETTE.gold, { metalness: 0.4, roughness: 0.35 }));
  button.position.y = 0.08;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.05, 8), std(PALETTE.gold, { metalness: 0.3 }));
  cord.position.set(0.52, -0.42, 0.52);
  cord.rotation.z = 0.08;
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 16), std(PALETTE.gold, { metalness: 0.3 }));
  tassel.position.set(0.56, -1.0, 0.52);
  tassel.rotation.x = Math.PI;
  cap.add(board, skull, button, cord, tassel);
  cap.userData.spinnable = true;
  return cap;
}

function book(color, w = 1.6, h = 0.28, d = 1.15) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, { roughness: 0.6 }));
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, h * 0.72, d * 0.96), std(PALETTE.paper, { roughness: 0.9 }));
  pages.position.x = 0.04;
  g.add(cover, pages);
  return g;
}

function pencil() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 6), std(PALETTE.gold, { roughness: 0.5 }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 6), std(PALETTE.paper));
  tip.position.y = -0.86;
  tip.rotation.x = Math.PI;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 6), std(PALETTE.navyDeep));
  lead.position.y = -0.96;
  lead.rotation.x = Math.PI;
  g.add(body, tip, lead);
  return g;
}

function coin() {
  const profile = [
    new THREE.Vector2(0, -0.07),
    new THREE.Vector2(0.48, -0.07),
    new THREE.Vector2(0.52, -0.04),
    new THREE.Vector2(0.52, 0.04),
    new THREE.Vector2(0.48, 0.07),
    new THREE.Vector2(0, 0.07),
  ];
  const mesh = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 48),
    std(PALETTE.gold, { metalness: 0.35, roughness: 0.32, emissive: 0x5a3a05, emissiveIntensity: 0.25 }),
  );
  return mesh;
}

function trophy() {
  const profile = [
    [0, 0], [0.55, 0], [0.55, 0.1], [0.2, 0.18], [0.12, 0.5], [0.12, 0.7],
    [0.42, 0.82], [0.62, 1.15], [0.66, 1.55], [0.6, 1.58], [0, 1.58],
  ].map(([x, y]) => new THREE.Vector2(x, y - 0.8));
  const cup = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 56),
    std(PALETTE.gold, { metalness: 0.35, roughness: 0.3, emissive: 0x5a3a05, emissiveIntensity: 0.3, side: THREE.DoubleSide }),
  );
  const handleGeo = new THREE.TorusGeometry(0.28, 0.05, 12, 32, Math.PI * 1.2);
  const left = new THREE.Mesh(handleGeo, cup.material);
  left.position.set(-0.66, 0.4, 0);
  left.rotation.z = Math.PI * 0.4;
  const right = left.clone();
  right.position.x = 0.66;
  right.rotation.z = -Math.PI * 1.6 + Math.PI;
  const g = new THREE.Group();
  g.add(cup, left, right);
  g.userData.spinnable = true;
  return g;
}

function knowledgeNodes(count, radius, color) {
  // A loose constellation of small nodes joined by thin lines.
  const positions = [];
  const nodes = new THREE.Group();
  const nodeGeo = new THREE.IcosahedronGeometry(0.06, 1);
  const nodeMat = std(color, { emissive: color, emissiveIntensity: 0.35 });
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().setFromSphericalCoords(
      radius * (0.75 + 0.25 * Math.sin(i * 12.9898)),
      Math.acos(1 - (2 * (i + 0.5)) / count),
      Math.PI * (1 + Math.sqrt(5)) * i,
    );
    positions.push(v);
    const m = new THREE.Mesh(nodeGeo, nodeMat);
    m.position.copy(v);
    nodes.add(m);
  }
  const linePts = [];
  positions.forEach((a, i) => {
    positions
      .map((b, j) => [j, a.distanceTo(b)])
      .filter(([j]) => j > i)
      .sort((x, y) => x[1] - y[1])
      .slice(0, 2)
      .forEach(([j]) => linePts.push(a, positions[j]));
  });
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(linePts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 }),
  );
  nodes.add(lines);
  return nodes;
}

const presets = {
  // Login panel: cap at centre, books orbiting, knowledge constellation behind.
  campus(scene, camera) {
    camera.position.set(0, 0, 8.5);
    const stage = new THREE.Group();
    stage.position.set(0.9, 1.25, 0);
    const cap = graduationCap();
    cap.rotation.set(0.38, 0.4, -0.12);
    cap.scale.setScalar(1);
    const orbit = new THREE.Group();
    [PALETTE.coral, PALETTE.teal, PALETTE.paper].forEach((c, i) => {
      const b = book(c === PALETTE.paper ? PALETTE.mist : c, 0.95, 0.18, 0.68);
      const a = (i / 3) * Math.PI * 2;
      b.position.set(Math.cos(a) * 2.1, Math.sin(a * 1.3) * 0.6, Math.sin(a) * 1.2);
      b.rotation.set(a, a * 0.6, 0.3);
      b.userData.float = 0.6 + i * 0.2;
      orbit.add(b);
    });
    const nodes = knowledgeNodes(22, 4.2, PALETTE.gold);
    nodes.position.set(0, 0.6, -2.5);
    stage.add(cap, orbit);
    scene.add(stage, nodes);
    return (t, dt, pointer) => {
      stage.rotation.y = pointer.x * 0.2;
      stage.rotation.x = -pointer.y * 0.1;
      cap.position.y = Math.sin(t * 0.9) * 0.12;
      cap.rotation.y += dt * 0.25 + cap.userData.spin;
      orbit.rotation.y = t * 0.18;
      orbit.children.forEach((b) => (b.rotation.x += dt * 0.3 * b.userData.float));
      nodes.rotation.y = -t * 0.05 + pointer.x * 0.25;
      nodes.rotation.x = pointer.y * 0.15;
    };
  },
  // Dashboard welcome banner: book stack + pencil + cap, offset to the right.
  desk(scene, camera) {
    camera.position.set(0, 0.6, 6.4);
    const group = new THREE.Group();
    group.position.x = 1.7;
    const stack = new THREE.Group();
    [PALETTE.navy, PALETTE.teal, PALETTE.coral].forEach((c, i) => {
      const b = book(c);
      b.position.y = -0.9 + i * 0.3;
      b.rotation.y = (i - 1) * 0.22;
      stack.add(b);
    });
    const cap = graduationCap();
    cap.scale.setScalar(0.72);
    cap.position.set(0.1, 0.55, 0);
    cap.rotation.set(0.25, 0.6, -0.1);
    const p = pencil();
    p.position.set(-1.35, 0.1, 0.4);
    p.rotation.set(0.2, 0, 0.9);
    const nodes = knowledgeNodes(16, 2.2, PALETTE.gold);
    nodes.position.set(0.2, 0.2, -1.2);
    group.add(stack, cap, p, nodes);
    scene.add(group);
    return (t, dt, pointer) => {
      group.rotation.y = -0.35 + pointer.x * 0.25;
      group.rotation.x = 0.08 + pointer.y * 0.08;
      cap.position.y = 0.55 + Math.sin(t * 1.1) * 0.08;
      cap.rotation.y += dt * 0.35 + cap.userData.spin;
      p.position.y = 0.1 + Math.sin(t * 0.8 + 1) * 0.06;
      nodes.rotation.y = t * 0.08;
    };
  },
  // Game hero: trophy flanked by a coin stack and a slowly tumbling d20.
  arcade(scene, camera) {
    camera.position.set(0, 0.3, 6.2);
    const group = new THREE.Group();
    group.position.x = 1.9;
    const cup = trophy();
    cup.scale.setScalar(1.05);
    const coins = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const c = coin();
      c.position.set(Math.sin(i * 1.7) * 0.04, -0.9 + i * 0.15, Math.cos(i * 2.1) * 0.04);
      coins.add(c);
    }
    coins.position.set(-1.45, 0, 0.4);
    const d20 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 0),
      std(PALETTE.coral, { flatShading: true, roughness: 0.45 }),
    );
    d20.position.set(1.35, 0.55, 0.3);
    d20.userData.spinnable = true;
    const loose = coin();
    loose.scale.setScalar(0.7);
    loose.position.set(1.15, -0.8, 0.8);
    loose.rotation.x = Math.PI / 2.4;
    group.add(cup, coins, d20, loose);
    scene.add(group);
    return (t, dt, pointer) => {
      group.rotation.y = -0.25 + pointer.x * 0.3;
      group.rotation.x = pointer.y * 0.1;
      cup.rotation.y += dt * 0.4 + cup.userData.spin;
      d20.rotation.x += dt * 0.5 + d20.userData.spin;
      d20.rotation.y += dt * 0.3;
      d20.position.y = 0.55 + Math.sin(t * 1.4) * 0.1;
      loose.rotation.z = t * 1.6;
      loose.position.y = -0.8 + Math.abs(Math.sin(t * 1.6)) * 0.22;
    };
  },
};

function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xf2f5ff, 0x1a2140, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0xffd79a, 1.2);
  rim.position.set(-5, 2, -4);
  scene.add(key, rim);
}

function disposeScene(entry) {
  entry.stop();
  entry.observer.disconnect();
  entry.resize.disconnect();
  entry.scene.traverse((o) => {
    o.geometry?.dispose();
    [].concat(o.material || []).forEach((m) => m.dispose());
  });
  entry.renderer.dispose();
  entry.renderer.domElement.remove();
  mounted.delete(entry);
}

function mount(host) {
  const preset = presets[host.dataset.scene];
  if (!preset) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    host.classList.add("scene-fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.className = "scene-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  lights(scene);
  const step = preset(scene, camera);
  scene.traverse((o) => o.userData.spinnable && (o.userData.spin = 0));

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();
  let frame = 0, visible = true, running = false;

  const size = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the composition readable on narrow hosts (mobile).
    const base = camera.userData.z ?? camera.position.z;
    camera.position.z = camera.aspect < 1 ? base * 1.45 : camera.aspect < 1.6 ? base * 1.15 : base;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  camera.userData.z = camera.position.z;

  const tick = () => {
    if (!canvas.isConnected) return disposeScene(entry);
    const dt = Math.min(clock.getDelta(), 0.05);
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    scene.traverse((o) => {
      if (o.userData.spinnable) o.userData.spin *= 0.92;
    });
    step(clock.elapsedTime, dt, pointer);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || reducedMotion() || !visible || document.hidden) return;
    running = true;
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
  };
  const onLeave = () => {
    pointer.tx = 0;
    pointer.ty = 0;
  };
  // Clicking an object gives it a short spin: feedback that the scene is live.
  const onClick = (ev) => {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(scene.children, true)[0];
    let o = hit?.object;
    while (o && !o.userData.spinnable) o = o.parent;
    if (o) o.userData.spin = 0.35;
  };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);

  const observer = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    visible ? start() : stop();
  });
  observer.observe(host);
  const resize = new ResizeObserver(size);
  resize.observe(host);

  const entry = { host, scene, renderer, stop, start, observer, resize };
  mounted.add(entry);
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
    if (![...mounted].some((m) => m.host === host)) mount(host);
  });
}
