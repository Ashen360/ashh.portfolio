// Low-poly geometry helpers. Axis convention for every asset: +Z = front / nose / lens axis, +Y = up.
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1);

/** Chamfered box (1 bevel segment) centred on the origin. */
export function bevBox(w, h, d, b = 0.05) {
  b = Math.min(b, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const s = new THREE.Shape();
  const x = w / 2 - b, y = h / 2 - b;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}
/** Soft rounded box (all edges rounded with radius r, `seg` steps) — the "3D icon" look. Centred on the origin. */
export function roundBox(w, h, d, r = 0.1, seg = 4) {
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const x = w / 2 - r, y = h / 2 - r, e = 1e-3, s = new THREE.Shape();
  s.moveTo(-x + e, -y); s.lineTo(x - e, -y); s.absarc(x - e, -y + e, e, -Math.PI / 2, 0); s.lineTo(x, y - e);
  s.absarc(x - e, y - e, e, 0, Math.PI / 2); s.lineTo(-x + e, y); s.absarc(-x + e, y - e, e, Math.PI / 2, Math.PI);
  s.lineTo(-x, -y + e); s.absarc(-x + e, -y + e, e, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - 2 * r, 1e-3), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: seg });
  g.translate(0, 0, -Math.max(d - 2 * r, 1e-3) / 2);
  return g;
}
/** Cylinder along Z (front = +Z). */
export function cyl(rTop, rBot, h, seg = 16, open = false) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open);
  g.rotateX(Math.PI / 2); return g;
}
/** Cylinder along Y. */
export const cylY = (rTop, rBot, h, seg = 16) => new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, false);
/** Cylinder along X (wheels). */
export function cylX(r, w, seg = 14) { const g = new THREE.CylinderGeometry(r, r, w, seg, 1, false); g.rotateZ(Math.PI / 2); return g; }
/** Surface of revolution about Z. profile = [[radius, z], ...] */
export function lathe(profile, seg = 16) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2); return g;
}
/** Polygon given in (z, y) extruded across X (width), centred in X. */
export function prism(pts, width, b = 0.03) {
  const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: width - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -(width - 2 * b) / 2);
  g.rotateY(-Math.PI / 2); // local x -> world z, local z -> world -x
  return g;
}
/** Ring of n small boxes around Z (grip ridges). */
export function ridgedRing(r, h, n, rw, rd) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const g = new THREE.BoxGeometry(rw, rd, h);
    g.translate(0, r + rd / 2 - 0.005, 0);
    g.rotateZ(-a); parts.push(g);
  }
  return mergeGeos(parts);
}

/** Smooth shading across faces whose normals differ by < `deg`; keeps hard edges beyond that. Works on non-indexed geometry. */
export function crease(g, deg = 40) {
  const pos = g.attributes.position, n = pos.count, cosT = Math.cos((deg * Math.PI) / 180);
  const fn = new Float32Array(n * 3), key = (i) => `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), t = new THREE.Vector3();
  const map = new Map();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    t.subVectors(c, b).cross(a.clone().sub(b)); // area-weighted face normal
    for (let k = 0; k < 3; k++) { fn[(i + k) * 3] = t.x; fn[(i + k) * 3 + 1] = t.y; fn[(i + k) * 3 + 2] = t.z; const kk = key(i + k); (map.get(kk) || map.set(kk, []).get(kk)).push(i + k); }
  }
  const out = new Float32Array(n * 3), u = new THREE.Vector3(), w = new THREE.Vector3(), sum = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    u.set(fn[i * 3], fn[i * 3 + 1], fn[i * 3 + 2]); const lu = u.length(); sum.set(0, 0, 0);
    if (lu < 1e-12) { out[i * 3 + 1] = 1; continue; }
    for (const j of map.get(key(i))) { w.set(fn[j * 3], fn[j * 3 + 1], fn[j * 3 + 2]); const lw = w.length(); if (lw > 1e-12 && u.dot(w) / (lu * lw) > cosT) sum.add(w); }
    sum.normalize(); out[i * 3] = sum.x; out[i * 3 + 1] = sum.y; out[i * 3 + 2] = sum.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return g;
}

export function mergeGeos(list) {
  let n = 0;
  const gs = list.map((g) => (g.index ? g.toNonIndexed() : g));
  gs.forEach((g) => (n += g.attributes.position.count));
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of gs) {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/**
 * Build one named part Group. items: [{g: geometry, m: material, p:[x,y,z], r:[x,y,z], s:[x,y,z]}]
 * Positions are in ASSEMBLED model space; they are re-centred on `pivot` so the group's own origin is the pivot.
 * Geometry sharing the same material is merged → one draw call per (part, material).
 */
export function makePart(name, pivot, items, { crease: creaseDeg = 40 } = {}) {
  const group = new THREE.Group(); group.name = name;
  const byMat = new Map();
  for (const it of items) {
    const g = it.g.clone();
    const p = it.p || [0, 0, 0];
    _q.setFromEuler(_e.set(...(it.r || [0, 0, 0]), it.o || 'XYZ'));
    _m.compose(new THREE.Vector3(p[0] - pivot[0], p[1] - pivot[1], p[2] - pivot[2]), _q, it.s ? new THREE.Vector3(...it.s) : _s);
    g.applyMatrix4(_m);
    if (!byMat.has(it.m)) byMat.set(it.m, []);
    byMat.get(it.m).push(g);
  }
  for (const [m, gs] of byMat) {
    const mesh = new THREE.Mesh(crease(mergeGeos(gs), creaseDeg), m);
    mesh.name = `${name}_${m.name || 'mesh'}`;
    group.add(mesh);
  }
  group.position.set(...pivot);
  return group;
}

/** Lofted wing/fin surface. sections: [{p:[x,y,zLE], chord, tc}] along a spine; chord runs toward -Z. */
export function loft(sections, { mirror = false, cap = true } = {}) {
  const AF = [[0, 0], [0.1, 0.55], [0.5, 0.5], [1, 0.04], [0.5, -0.38], [0.1, -0.42]]; // [chord fraction, thickness*tc*chord]
  const rings = [];
  const c = new THREE.Vector3(0, 0, -1);
  for (let i = 0; i < sections.length; i++) {
    const a = new THREE.Vector3(...sections[Math.max(0, i - 1)].p), b = new THREE.Vector3(...sections[Math.min(sections.length - 1, i + 1)].p);
    const t = b.sub(a).normalize();
    const n = new THREE.Vector3().crossVectors(t, c).normalize();
    const s = sections[i];
    rings.push(AF.map(([u, h]) => new THREE.Vector3(...s.p).addScaledVector(c, u * s.chord).addScaledVector(n, h * s.tc * s.chord * 2)));
  }
  const pos = [], N = AF.length;
  const tri = (a, b, d) => pos.push(...a.toArray(), ...b.toArray(), ...d.toArray());
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < N; j++) {
    const a = rings[i][j], b = rings[i][(j + 1) % N], d = rings[i + 1][j], e = rings[i + 1][(j + 1) % N];
    tri(a, d, b); tri(b, d, e);
  }
  if (cap) for (const [r, flip] of [[rings[0], true], [rings[rings.length - 1], false]]) {
    const ctr = r.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / N);
    for (let j = 0; j < N; j++) { const a = r[j], b = r[(j + 1) % N]; flip ? tri(ctr, a, b) : tri(ctr, b, a); }
  }
  if (mirror) { // mirror in X and restore winding by swapping vertices 1/2 of each triangle
    for (let i = 0; i < pos.length; i += 9) {
      pos[i] *= -1; pos[i + 3] *= -1; pos[i + 6] *= -1;
      for (let k = 0; k < 3; k++) { const t = pos[i + 3 + k]; pos[i + 3 + k] = pos[i + 6 + k]; pos[i + 6 + k] = t; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function flat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: false, roughness: 0.6, metalness: 0.1, ...o });
}
