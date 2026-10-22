import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getPalette } from './design/shared/tokens.js';
import { EASE, clamp } from './design/shared/easing.js';
import { crease } from './design/shared/geo.js';
import { GLYPHS } from './design/wordmarks/glyphs.js';

const DEPTH = 130;
const CURVE_SEGMENTS = 10;
const BEVEL = { bevelEnabled: true, bevelThickness: 18, bevelSize: 10, bevelOffset: -10, bevelSegments: 3 };
const CREASE_DEG = 38;
const LIT_AT = 0.55;

const FINISH = {
  base: { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.22, specularIntensity: 0.55, envMapIntensity: 0.5 },
  accent: { roughness: 0.32, metalness: 0.35, clearcoat: 0.35, clearcoatRoughness: 0.2, specularIntensity: 0.5, envMapIntensity: 0.6 },
};

function toShapes(d) {
  const path = new THREE.ShapePath();
  for (const [, cmd, args] of d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
    const n = args.trim() ? args.trim().split(/[ ,]+/).map(Number) : [];
    if (cmd === 'M') path.moveTo(n[0], n[1]);
    else if (cmd === 'L') path.lineTo(n[0], n[1]);
    else if (cmd === 'Q') path.quadraticCurveTo(n[0], n[1], n[2], n[3]);
    else if (cmd === 'C') path.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]);
  }
  return path.toShapes(false);
}

function runGeometry(run, offset) {
  const parts = run.glyphs.map((g) => {
    const geo = new THREE.ExtrudeGeometry(toShapes(g.d), { depth: DEPTH, curveSegments: CURVE_SEGMENTS, ...BEVEL });
    geo.translate(g.x + offset, 0, -DEPTH / 2);
    geo.clearGroups();
    return geo;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  merged.deleteAttribute('uv');
  return flattenCaps(crease(merged, CREASE_DEG));
}

function flattenCaps(geo) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    c.sub(b).cross(a.sub(b)).normalize();
    if (Math.abs(c.z) < 0.999) continue;
    const z = Math.sign(c.z);
    for (let v = i; v < i + 3; v++) nor.setXYZ(v, 0, 0, z);
  }
  return geo;
}

function finish(color, params) {
  const base = color.clone();
  const mat = new THREE.MeshPhysicalMaterial({ metalness: 0, ...params, color: base.clone(), emissive: base.clone() });
  const target = { ...params };
  mat.userData.setLit = (u) => {
    mat.color.copy(base).multiplyScalar(u);
    mat.emissiveIntensity = 1 - u;
    mat.specularIntensity = target.specularIntensity * u;
    mat.clearcoat = target.clearcoat * Math.max(u, 0.002);
    mat.envMapIntensity = target.envMapIntensity * u;
  };
  return mat;
}

export function createWordmark3D({ theme = 'dark', size = 1, turns = 1 } = {}) {
  const P = getPalette(theme);
  const k = size / GLYPHS.regular.cap;
  const width = GLYPHS.regular.width + GLYPHS.italic.width;
  const mats = { base: finish(P.text, FINISH.base), accent: finish(P.accent, FINISH.accent) };
  const holder = new THREE.Group();
  holder.add(
    new THREE.Mesh(runGeometry(GLYPHS.regular, -width / 2), mats.base),
    new THREE.Mesh(runGeometry(GLYPHS.italic, GLYPHS.regular.width - width / 2), mats.accent)
  );
  holder.scale.setScalar(k);
  holder.position.y = -size / 2;
  const spinner = new THREE.Group();
  spinner.add(holder);
  const g = new THREE.Group();
  g.name = 'Ashen.IT (3D)';
  g.add(spinner);
  const accentX = (GLYPHS.regular.width + (GLYPHS.italic.glyphs[1].x + GLYPHS.italic.width) / 2 - width / 2) * k;
  g.userData = { mats, width: width * k, height: size, accentCenter: new THREE.Vector3(accentX, 0, 0) };
  g.turns = turns;
  g.setDepth = (d) => {
    d = clamp(d);
    holder.scale.z = Math.max(1e-4, d) * k;
    const u = EASE.easeInOutQuad(clamp(d / LIT_AT));
    mats.base.userData.setLit(u);
    mats.accent.userData.setLit(u);
    g.visible = true;
    return g;
  };
  g.setSpin = (rad) => {
    spinner.rotation.y = rad;
    return g;
  };
  g.setProgress = (p) => {
    p = clamp(p);
    g.setSpin(-Math.PI * 2 * g.turns * EASE.easeInOutQuart(p));
    g.setDepth(EASE.easeOutQuart(clamp(p / 0.7)));
    return g;
  };
  g.setProgress(0);
  return g;
}
