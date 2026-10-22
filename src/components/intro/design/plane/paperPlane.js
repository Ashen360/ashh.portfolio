// Paper airplane (classic dart). The sheet starts as a small card around the printed "Ashen", grows into a full A4 sheet,
// then folds step by step into the dart: rigid-origami simulation — the sheet is pre-cut along every crease into flat facets,
// each fold is a hinge rotation about its crease (as it lies at that moment), composed in order.
// Axis of the finished model: +Z = nose, +Y up (same convention as the camera). No textures loaded: the paper print
// (faint accent grid + "Ashen" in Instrument Serif outlines) is drawn into a canvas at runtime.
import * as THREE from 'three';
import { getPalette } from '../shared/tokens.js';
import { EASE, clamp } from '../shared/easing.js';
import { GLYPHS } from '../wordmarks/glyphs.js';

const W = 1, H = Math.SQRT2; // sheet half-width / half-height (A4 ratio 1 : 1.414); nose at +y
const WING = 0.32;           // wing crease distance from the keel
const TEXT_W = 0.5;          // printed "Ashen" width (stays inside the keel, so it ends up folded inside)
const TEXT_Y = -1.27;        // printed at the foot of the page, below where the edge flaps land

/** Fold steps, defined in the flat-folded state (sheet in XY, viewer on +Z, nose +Y).
 *  a,b = crease line; toward = a point on the side that moves; s = +1 folds toward the viewer / -1 away.
 *  t = [start,end] of the fold within setProgress; fold = angle reached (deg); open = [start,end,angle] optional second move. */
export const PAPER_FOLDS = [
  { name: 'centerCrease', a: [0, -H], b: [0, H], toward: [1, 0], s: 1, t: [0.12, 0.19], fold: 150, open: [0.19, 0.25, 0], unfold: true },
  { name: 'cornerLeft', a: [0, H], b: [-W, H - W], toward: [-W, H], s: 1, t: [0.25, 0.34], fold: 179 },
  { name: 'cornerRight', a: [0, H], b: [W, H - W], toward: [W, H], s: 1, t: [0.31, 0.40], fold: 179 },
  { name: 'edgeLeft', a: [0, H], b: [-W, H - (1 + Math.SQRT2) * W], toward: [-W, 0], s: 1, t: [0.41, 0.50], fold: 177 },
  { name: 'edgeRight', a: [0, H], b: [W, H - (1 + Math.SQRT2) * W], toward: [W, 0], s: 1, t: [0.48, 0.57], fold: 177 },
  { name: 'foldHalf', a: [0, -H], b: [0, H], toward: [1, 0], s: 1, t: [0.59, 0.70], fold: 179, open: [0.89, 1.0, 166] },
  { name: 'wingLeft', a: [-WING, -H], b: [-WING, H], toward: [-1, 0], s: -1, t: [0.72, 0.81], fold: 178, open: [0.89, 1.0, 82], only: (c) => c[0] < 0 },
  { name: 'wingRight', a: [-WING, -H], b: [-WING, H], toward: [-1, 0], s: 1, t: [0.78, 0.87], fold: 178, open: [0.89, 1.0, 82], only: (c) => c[0] > 0 },
];
/** Names fired by onPartSettled, in order: the sheet reaching full size, each fold, then the wings opening. */
export const PAPER_STEPS = ['sheet', ...PAPER_FOLDS.map((f) => f.name), 'open'];
const SHEET_T = [0, 0.12], OPEN_T = [0.89, 1.0];

/** Final pose matching the reference: nose toward the viewer's lower-left, seen 3/4 from the front and above. */
export const PAPER_POSE = [0.62, -0.95, 0.12];

// ---------- 2D helpers (flat sheet / flat-folded state) ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const aff = (G, p) => [G[0] * p[0] + G[1] * p[1] + G[2], G[3] * p[0] + G[4] * p[1] + G[5]];
const mulAff = (A, B) => [A[0] * B[0] + A[1] * B[3], A[0] * B[1] + A[1] * B[4], A[0] * B[2] + A[1] * B[5] + A[2], A[3] * B[0] + A[4] * B[3], A[3] * B[1] + A[4] * B[4], A[3] * B[2] + A[4] * B[5] + A[5]];
const invAff = (G) => { const d = G[0] * G[4] - G[1] * G[3]; const a = G[4] / d, b = -G[1] / d, c = -G[3] / d, e = G[0] / d; return [a, b, -(a * G[2] + b * G[5]), c, e, -(c * G[2] + e * G[5])]; };
function reflectAff(p, n) { // reflection across line through p with unit normal n
  const [nx, ny] = n, k = 2 * (nx * p[0] + ny * p[1]);
  return [1 - 2 * nx * nx, -2 * nx * ny, k * nx, -2 * nx * ny, 1 - 2 * ny * ny, k * ny];
}
const area = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const centroid = (P) => P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length], [0, 0]);
function clip(P, f) { // keep side f(p) >= 0 (f affine in p)
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
const inside = (P, q) => { for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) < -1e-9) return false; } return true; };

/** Pre-cut the sheet along every crease and record which facets each fold moves + the hinge it turns about. */
function buildFacets() {
  let facets = [{ poly: [[-W, -H], [W, -H], [W, H], [-W, H]], G: [1, 0, 0, 0, 1, 0], moves: new Set() }];
  const hinges = [];
  PAPER_FOLDS.forEach((st, k) => {
    const d = sub(st.b, st.a), len = Math.hypot(d[0], d[1]);
    let n = [-d[1] / len, d[0] / len];
    if (dot(sub(st.toward, st.a), n) < 0) n = [-n[0], -n[1]];
    const R = reflectAff(st.a, n), next = [];
    let anchor = null, best = -1;
    for (const f of facets) {
      if (st.only && !st.only(centroid(f.poly))) { next.push(f); continue; }
      const side = (q) => dot(sub(aff(f.G, q), st.a), n);
      const pos = clip(f.poly, (q) => side(q) - 1e-9), neg = clip(f.poly, (q) => -side(q) - 1e-9);
      if (pos.length >= 3 && Math.abs(area(pos)) > 1e-7) next.push({ poly: pos, G: st.unfold ? f.G : mulAff(R, f.G), moves: new Set([...f.moves, k]) });
      if (neg.length >= 3 && Math.abs(area(neg)) > 1e-7) {
        const piece = { poly: neg, G: f.G, moves: new Set(f.moves) };
        next.push(piece);
        // anchor: stationary piece with the longest edge on the crease
        let on = 0; for (let i = 0; i < neg.length; i++) { const a = neg[i], b = neg[(i + 1) % neg.length]; if (Math.abs(side(a)) < 1e-6 && Math.abs(side(b)) < 1e-6) on = Math.max(on, Math.hypot(b[0] - a[0], b[1] - a[1])); }
        if (on > best) { best = on; anchor = piece; }
      }
    }
    facets = next;
    // hinge in the anchor's own flat coordinates
    const Gi = invAff(anchor.G), la = aff(Gi, st.a), lb = aff(Gi, st.b), lt = aff(Gi, [st.a[0] + n[0], st.a[1] + n[1]]);
    const det = Math.sign(anchor.G[0] * anchor.G[4] - anchor.G[1] * anchor.G[3]);
    const ld = sub(lb, la), ll = Math.hypot(ld[0], ld[1]);
    let ln = [-ld[1] / ll, ld[0] / ll]; if (dot(sub(lt, la), ln) < 0) ln = [-ln[0], -ln[1]];
    const nz = st.s * det; // folded-state ±Z expressed in the anchor's local frame
    const axis = new THREE.Vector3(ln[0], ln[1], 0).cross(new THREE.Vector3(0, 0, nz)).normalize();
    // a point well inside the anchor piece (used to find the final facet that carries the anchor's transform)
    const probe = centroid(anchor.poly);
    hinges.push({ point: new THREE.Vector3(la[0], la[1], 0), axis, probe });
  });
  hinges.forEach((h) => { h.facet = facets.findIndex((f) => inside(f.poly.map((p) => p), h.probe) || inside([...f.poly].reverse(), h.probe)); });
  return { facets, hinges };
}

function drawPaper(ctx, w, h, { text, P }) {
  // front: paper white (--text); back: a touch greyer so flaps folded over read as separate layers
  ctx.fillStyle = '#' + P.text.clone().lerp(P.sec, text ? 0.04 : 0.2).getHexString(); ctx.fillRect(0, 0, w, h);
  const step = w / 24;
  ctx.strokeStyle = 'rgba(37,99,235,0.2)'; ctx.lineWidth = Math.max(1, w / 1024);
  for (let x = step; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = step; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  if (!text) return;
  // "Ashen" from the baked Instrument Serif outlines (Path2D accepts the same M/L/Q/C/Z data)
  const k = (TEXT_W / (2 * W)) * w / GLYPHS.regular.width, cap = GLYPHS.regular.cap;
  const ty = h * (1 - (TEXT_Y + H) / (2 * H));
  ctx.save(); ctx.translate(w / 2 - (GLYPHS.regular.width * k) / 2, ty + (cap * k) / 2); ctx.scale(k, -k);
  ctx.fillStyle = '#' + P.ink.getHexString();
  for (const g of GLYPHS.regular.glyphs) { ctx.save(); ctx.translate(g.x, 0); ctx.fill(new Path2D(g.d)); ctx.restore(); }
  ctx.restore();
}

export class PaperPlane extends THREE.Group {
  constructor({ theme = 'dark' } = {}) {
    super();
    this.name = 'paperPlane';
    const P = getPalette(theme).ramp;
    const { facets, hinges } = buildFacets();
    this.facets = facets; this.hinges = hinges;
    this.textWidth = TEXT_W;
    this.onPartSettled = null;
    this.progress = 0; this.spin = 0; this._raf = 0;

    // print: front = grid + "Ashen", back = grid only
    const mk = (text) => { const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * Math.SQRT2); drawPaper(c.getContext('2d'), c.width, c.height, { text, P }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const paper = (map, side, k) => new THREE.MeshStandardMaterial({ map, side, color: new THREE.Color(k, k, k), flatShading: true, roughness: 0.85, metalness: 0, envMapIntensity: 0.35 }); // k keeps lit paper below clipping
    this.materials = { front: paper(mk(true), THREE.FrontSide, 0.74), back: paper(mk(false), THREE.BackSide, 0.66) };

    // folding sheet: one non-indexed geometry, vertex positions rewritten each setProgress
    const flat = [], uv = [], owner = [];
    facets.forEach((f, i) => { const ccw = area(f.poly) > 0 ? f.poly : [...f.poly].reverse(); for (let j = 1; j < ccw.length - 1; j++) for (const p of [ccw[0], ccw[j], ccw[j + 1]]) { flat.push(p[0], p[1]); uv.push((p[0] + W) / (2 * W), (p[1] + H) / (2 * H)); owner.push(i); } });
    this._flat = new Float32Array(flat); this._owner = owner;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(owner.length * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(owner.length * 3), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    this.sheetGeo = g;
    this.inner = new THREE.Group(); this.add(this.inner);
    this.sheet = new THREE.Group(); this.sheet.name = 'sheet'; this.inner.add(this.sheet);
    this.sheet.add(new THREE.Mesh(g, this.materials.front), new THREE.Mesh(g, this.materials.back));

    // card: a cropped window onto the same print, growing from the text to the full sheet
    this.cardGeo = new THREE.PlaneGeometry(1, 1);
    this.card = new THREE.Group(); this.card.name = 'card'; this.inner.add(this.card);
    this.card.add(new THREE.Mesh(this.cardGeo, this.materials.front), new THREE.Mesh(this.cardGeo, this.materials.back));
    this.cardStart = [TEXT_W * 1.22, TEXT_W * 0.46];

    // orientation keyframes
    const frame = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0));
    this.qFinal = new THREE.Quaternion().setFromEuler(new THREE.Euler(...PAPER_POSE, 'XYZ')).multiply(new THREE.Quaternion().setFromRotationMatrix(frame));
    this.qTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0.28, 0.04, 'XYZ'));
    this._mats = facets.map(() => new THREE.Matrix4());
    this._settled = new Map(PAPER_STEPS.map((n) => [n, false]));
    this.setProgress(1, { silent: true });
    this.finalCenter = new THREE.Box3().setFromBufferAttribute(g.attributes.position).getCenter(new THREE.Vector3());
    this.setProgress(0, { silent: true });
  }

  get partNames() { return PAPER_STEPS.slice(); }

  _angle(st, p) {
    let a = st.fold * EASE.easeInOutQuart(clamp((p - st.t[0]) / (st.t[1] - st.t[0])));
    if (st.open) a += (st.open[2] - st.fold) * EASE.easeInOutQuart(clamp((p - st.open[0]) / (st.open[1] - st.open[0])));
    return THREE.MathUtils.degToRad(a);
  }

  /** 0 = card around the printed name → 0.12 full sheet → folds → 1 finished dart in the reference pose. */
  setProgress(p, { silent = false } = {}) {
    p = clamp(p); this.progress = p;
    // card phase
    const c = EASE.easeInOutQuart(clamp((p - SHEET_T[0]) / (SHEET_T[1] - SHEET_T[0])));
    const inCard = p < SHEET_T[1];
    this.card.visible = inCard; this.sheet.visible = !inCard;
    if (inCard) {
      const w = THREE.MathUtils.lerp(this.cardStart[0], 2 * W, c), h = THREE.MathUtils.lerp(this.cardStart[1], 2 * H, c);
      const cy = THREE.MathUtils.lerp(TEXT_Y, 0, c);           // window slides from the printed name to the sheet centre
      this.card.scale.set(w, h, 1); this.card.position.set(0, cy, 0); this.cardSize = [w, h];
      const cv = (cy + H) / (2 * H);
      const uv = this.cardGeo.attributes.uv, u0 = 0.5 - w / (4 * W), u1 = 0.5 + w / (4 * W), v0 = cv - h / (4 * H), v1 = cv + h / (4 * H);
      uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
    } else this._fold(p);
    // orientation: facing the viewer → slight 3/4 tilt while folding → reference pose; recentre on the finished plane
    const q1 = EASE.easeInOutQuad(clamp((p - 0.1) / 0.2)), q2 = EASE.easeInOutQuad(clamp((p - 0.57) / 0.43));
    const q = new THREE.Quaternion().slerp(this.qTilt, q1).slerp(this.qFinal, q2);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.spin).multiply(q);
    if (this.finalCenter) this.inner.position.copy(this.finalCenter).multiplyScalar(-q2);
    if (inCard) this.inner.position.set(0, -this.card.position.y, 0); // keep the card centred on screen while it grows
    // events: sheet full size, each fold pressed flat, wings opened
    const done = { sheet: p >= SHEET_T[1], open: p >= OPEN_T[1] - 1e-4 };
    PAPER_FOLDS.forEach((st) => (done[st.name] = p >= st.t[1] - 0.004));
    for (const name of PAPER_STEPS) {
      if (done[name] === this._settled.get(name)) continue;
      this._settled.set(name, done[name]);
      if (silent) continue;
      const index = PAPER_STEPS.indexOf(name);
      if (done[name]) { this.onPartSettled?.(name, index); this.dispatchEvent({ type: 'partSettled', name, index }); }
      else this.dispatchEvent({ type: 'partUnsettled', name, index });
    }
    return this;
  }

  _fold(p) {
    const T = this._mats; T.forEach((m) => m.identity());
    const M = new THREE.Matrix4(), tmp = new THREE.Matrix4(), inv = new THREE.Matrix4();
    PAPER_FOLDS.forEach((st, k) => {
      const th = this._angle(st, p); if (Math.abs(th) < 1e-6) return;
      const h = this.hinges[k], F = T[h.facet];
      M.makeTranslation(h.point.x, h.point.y, 0).multiply(tmp.makeRotationAxis(h.axis, th)).multiply(new THREE.Matrix4().makeTranslation(-h.point.x, -h.point.y, 0));
      const Wk = new THREE.Matrix4().multiplyMatrices(F, M).multiply(inv.copy(F).invert());
      this.facets.forEach((f, i) => { if (f.moves.has(k)) T[i].premultiply(Wk); });
    });
    const pos = this.sheetGeo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < this._owner.length; i++) { v.set(this._flat[i * 2], this._flat[i * 2 + 1], 0).applyMatrix4(T[this._owner[i]]); pos.setXYZ(i, v.x, v.y, v.z); }
    pos.needsUpdate = true; this.sheetGeo.computeVertexNormals(); this.sheetGeo.computeBoundingSphere();
  }

  /** Extra yaw (radians) about world Y on top of the current orientation. */
  setSpin(rad) { this.spin = rad; return this.setProgress(this.progress, { silent: true }); }

  /** 'assembled' = finished dart, 'exploded' = flat full sheet (asset space, pose ignored). */
  getBounds(state = 'assembled') {
    const saved = this.progress; this.setProgress(state === 'assembled' ? 1 : SHEET_T[1] + 1e-3, { silent: true });
    const b = new THREE.Box3().setFromBufferAttribute(this.sheetGeo.attributes.position);
    if (state === 'assembled') b.translate(this.finalCenter.clone().negate());
    this.setProgress(saved, { silent: true }); return b;
  }

  play({ from = 0, to = 1, duration = 3.6 } = {}) {
    cancelAnimationFrame(this._raf);
    return new Promise((res) => { const t0 = performance.now(); const tick = (t) => { const k = clamp((t - t0) / (duration * 1000)); this.setProgress(from + (to - from) * k); if (k < 1) this._raf = requestAnimationFrame(tick); else res(); }; this._raf = requestAnimationFrame(tick); });
  }
  stop() { cancelAnimationFrame(this._raf); }
  dispose() { this.stop(); this.sheetGeo.dispose(); this.cardGeo.dispose(); Object.values(this.materials).forEach((m) => { m.map?.dispose(); m.dispose(); }); }
}

export const createPaperPlane = (o) => new PaperPlane(o);
