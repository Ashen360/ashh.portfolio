// ExplodedAsset: a THREE.Group whose named child Groups each have an assembled and an exploded transform.
//   setProgress(0..1)  0 = exploded, 1 = assembled, with a per-part stagger
//   onPartSettled(name) callback  +  'partSettled' / 'partUnsettled' events  (fires when a part visually lands)
import * as THREE from 'three';
import { getEase, clamp } from './easing.js';

const v3 = (a) => new THREE.Vector3(...a);
const eu = (a) => new THREE.Euler(...a);

export class ExplodedAsset extends THREE.Group {
  /**
   * @param {object} cfg
   * @param {string} cfg.name
   * @param {Array}  cfg.parts  [{ name, group, delta:[x,y,z], rot:[x,y,z], ease?, dur?, start? }] — group.position is the assembled pivot,
   *                            exploded = assembled + delta, exploded rotation = rot (radians, local).
   * @param {string[]} cfg.order  landing order (first lands first)
   * @param {number[]} cfg.pose  [x,y,z] Euler (order XYZ) matching the reference picture
   * @param {number} [cfg.duration=0.45] fraction of the 0..1 timeline each part takes to travel
   * @param {number} [cfg.settleAt=0.99] eased value at which a part counts as landed
   */
  constructor(cfg) {
    super();
    this.name = cfg.name;
    this.basePose = new THREE.Euler(...cfg.pose, 'XYZ');
    this.rotation.copy(this.basePose);
    this.inner = new THREE.Group(); this.inner.name = 'pivot'; this.add(this.inner); // offset so the asset rotates about its assembled centre
    this.partMap = {};
    this.parts = [];
    this.progress = 1;
    this.spin = 0;
    this.onPartSettled = null;
    const n = cfg.order.length, dur = cfg.duration ?? 0.45, step = n > 1 ? (1 - dur) / (n - 1) : 0;
    cfg.parts.forEach((p) => {
      const idx = cfg.order.indexOf(p.name);
      if (idx < 0) throw new Error(`${cfg.name}: part ${p.name} missing from order`);
      const ease = getEase(p.ease || 'easeOutExpo');
      const d = p.dur ?? dur;
      let lpSettle = 1; // first local progress where the eased value is landed
      for (let i = 0; i <= 1000; i++) if (ease(i / 1000) >= (cfg.settleAt ?? 0.99)) { lpSettle = i / 1000; break; }
      const asm = { position: p.group.position.clone(), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) };
      const exp = { position: asm.position.clone().add(v3(p.delta)), rotation: eu(p.rot || [0, 0, 0]), scale: new THREE.Vector3(1, 1, 1) };
      const rec = { name: p.name, index: idx, group: p.group, assembled: asm, exploded: exp, ease, start: p.start ?? idx * step, dur: d, lpSettle, settled: true };
      p.group.userData.assembled = asm; p.group.userData.exploded = exp;
      this.partMap[p.name] = rec; this.parts.push(rec); this.inner.add(p.group);
    });
    this.parts.sort((a, b) => a.index - b.index);
    this._raf = 0;
    this.setProgress(1, { silent: true });
    this.inner.updateMatrixWorld(true);
    this.center = this._localBounds().getCenter(new THREE.Vector3()); // assembled centre in model space
    this.inner.position.copy(this.center).negate();
  }

  get partNames() { return this.parts.map((p) => p.name); }
  getPart(name) { return this.partMap[name].group; }

  /** progress 0 = exploded, 1 = assembled. Pass {silent:true} to skip settle callbacks (e.g. while seeking). */
  setProgress(p, { silent = false } = {}) {
    p = clamp(p); this.progress = p;
    for (const r of this.parts) {
      const lp = clamp((p - r.start) / r.dur), e = r.ease(lp);
      const g = r.group;
      g.position.lerpVectors(r.exploded.position, r.assembled.position, e);
      g.rotation.set(r.exploded.rotation.x * (1 - e), r.exploded.rotation.y * (1 - e), r.exploded.rotation.z * (1 - e));
      const nowSettled = lp >= r.lpSettle;
      if (nowSettled !== r.settled) {
        r.settled = nowSettled;
        if (!silent) {
          if (nowSettled) { this.onPartSettled?.(r.name, r.index); this.dispatchEvent({ type: 'partSettled', name: r.name, index: r.index }); }
          else this.dispatchEvent({ type: 'partUnsettled', name: r.name, index: r.index });
        }
      }
    }
    return this;
  }

  /** extra yaw (radians) around the model's vertical axis on top of the reference pose — for the pre-assembly spin */
  setSpin(rad) { this.spin = rad; this.rotation.y = this.basePose.y + rad; return this; }

  /** Bounds in the asset's own space (origin = assembled centre, pose ignored) for camera framing. state: 'assembled' | 'exploded' */
  getBounds(state = 'assembled') {
    const saved = this.progress;
    this.setProgress(state === 'assembled' ? 1 : 0, { silent: true });
    const box = this._localBounds();
    this.setProgress(saved, { silent: true });
    return box;
  }
  _localBounds() {
    this.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(this.matrixWorld).invert(), box = new THREE.Box3(), c = new THREE.Vector3(), m = new THREE.Matrix4();
    this.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; m.multiplyMatrices(inv, o.matrixWorld);
      for (let i = 0; i < 8; i++) { c.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(m); box.expandByPoint(c); }
    });
    return box;
  }

  /** Convenience tween with requestAnimationFrame. Returns a Promise. */
  play({ from = 0, to = 1, duration = 2.4 } = {}) {
    cancelAnimationFrame(this._raf);
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (t) => {
        const k = clamp((t - t0) / (duration * 1000));
        this.setProgress(from + (to - from) * k);
        if (k < 1) this._raf = requestAnimationFrame(tick); else res();
      };
      this._raf = requestAnimationFrame(tick);
    });
  }
  stop() { cancelAnimationFrame(this._raf); }

  /** Plain-data dump of every part's transforms (used for the README table). */
  describe() {
    const f = (a) => a.map((v) => +v.toFixed(3));
    return this.parts.map((r) => ({
      name: r.name, landingIndex: r.index, start: +r.start.toFixed(3), duration: r.dur,
      assembled: { position: f(r.assembled.position.toArray()), rotation: [0, 0, 0] },
      exploded: { position: f(r.exploded.position.toArray()), rotation: f(r.exploded.rotation.toArray().slice(0, 3)) },
    }));
  }

  dispose() {
    this.stop();
    const mats = new Set();
    this.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) mats.add(o.material); });
    mats.forEach((m) => m.dispose());
  }
}
