// 3D extruded camera + plane icons with a bevel. Default mode is a pure-white unlit silhouette for use as a reveal mask.
// Silhouette contract: MeshBasicMaterial #ffffff, toneMapped:false, no lighting, no fog, no vertex shading → every covered pixel is exactly white.
// Flat extrusions collapse to a sliver edge-on, so tumble() keeps X/Y tilt below `tilt` (default 65°) and spins freely on Z.
import * as THREE from 'three';
import { getPalette } from '../shared/tokens.js';
import { EASE } from '../shared/easing.js';

/** Motion language of the reference clip: fast multi-axis flips that pass through a near edge-on sliver and recover. */
export const TUMBLE_REFERENCE = { turns: 1.5, tilt: THREE.MathUtils.degToRad(84), fx: 2.0, fy: 1.5 };

const WHITE = () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false });

export class Icon3D extends THREE.Group {
  constructor(name, meshes /* [{geo, role:'body'|'lens'}] */, theme) {
    super(); this.name = name; this.theme = theme; this.mode = 'silhouette';
    this._sil = WHITE();
    const P = getPalette(theme).ramp;
    this._shaded = {
      body: new THREE.MeshStandardMaterial({ color: P.whiteWarm, flatShading: true, roughness: 0.45, metalness: 0.1 }),
      lens: new THREE.MeshStandardMaterial({ color: P.accent, flatShading: true, roughness: 0.3, metalness: 0.3, emissive: P.accent, emissiveIntensity: 0.3 }),
    };
    this._meshes = meshes.map(({ geo, role }) => { const m = new THREE.Mesh(geo, this._sil); m.userData.role = role; this.add(m); return m; });
    this.tumbleState = { turns: 1.25, tilt: THREE.MathUtils.degToRad(65), fx: 1, fy: 1.5 };
  }
  /** 'silhouette' (pure white, unlit — the mask) or 'shaded' (lit, design-system colours). */
  setMode(mode) {
    this.mode = mode;
    for (const m of this._meshes) m.material = mode === 'silhouette' ? this._sil : this._shaded[m.userData.role];
    return this;
  }
  /** Multi-axis tumble, t = 0..1. Ends at rest (rotation 0) so it lands front-on. Z spins `turns` times; X/Y wobble within ±tilt. */
  tumble(t, o = {}) {
    const s = { ...this.tumbleState, ...o }, e = EASE.easeInOutQuart(Math.min(1, Math.max(0, t)));
    const damp = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));            // 0 at both ends → rests flat
    this.rotation.set(s.tilt * damp * Math.sin(Math.PI * 2 * s.fx * t), s.tilt * damp * Math.sin(Math.PI * 2 * s.fy * t + 1.1), -Math.PI * 2 * s.turns * (1 - e));
    return this;
  }
  dispose() { this._sil.dispose(); Object.values(this._shaded).forEach((m) => m.dispose()); this.traverse((o) => o.geometry?.dispose()); }
}

const BEVEL = { bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelOffset: 0, bevelSegments: 2 };
function extrude(shape, depth, curveSegments = 16) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, curveSegments, ...BEVEL });
  g.translate(0, 0, -depth / 2); return g;
}
const circle = (r, x = 0, y = 0, hole = false) => { const p = hole ? new THREE.Path() : new THREE.Shape(); p.absarc(x, y, r, 0, Math.PI * 2, hole); return p; };

/** Height ≈ 2 units, depth 0.5. Body with viewfinder hump, lens ring (hole + floating disc) and flash window. */
export function createCameraIcon({ theme = 'dark', depth = 0.5 } = {}) {
  const s = new THREE.Shape();
  s.moveTo(-1.0, -0.8); s.lineTo(1.0, -0.8); s.quadraticCurveTo(1.2, -0.8, 1.2, -0.6); s.lineTo(1.2, 0.5);
  s.quadraticCurveTo(1.2, 0.7, 1.0, 0.7); s.lineTo(0.6, 0.7); s.lineTo(0.42, 1.0); s.lineTo(-0.42, 1.0); s.lineTo(-0.6, 0.7);
  s.lineTo(-1.0, 0.7); s.quadraticCurveTo(-1.2, 0.7, -1.2, 0.5); s.lineTo(-1.2, -0.6); s.quadraticCurveTo(-1.2, -0.8, -1.0, -0.8);
  s.holes.push(circle(0.55, 0, -0.05, true));
  const win = new THREE.Path(); win.moveTo(0.72, 0.3); win.lineTo(0.72, 0.5); win.lineTo(1.0, 0.5); win.lineTo(1.0, 0.3); win.closePath(); s.holes.push(win);
  return new Icon3D('cameraIcon', [{ geo: extrude(s, depth, 24), role: 'body' }, { geo: extrude(circle(0.25, 0, -0.05), depth * 0.8, 24), role: 'lens' }], theme);
}

/** Paper-plane (dart) seen from above, nose up. Height ≈ 3.3 units, depth 0.36. A slit down the keel separates the wings. */
export function createPlaneIcon({ theme = 'dark', depth = 0.36 } = {}) {
  const s = new THREE.Shape(), pts = [[0, 1.7], [1.25, -1.35], [0.2, -0.95], [0, -1.6], [-0.2, -0.95], [-1.25, -1.35]];
  s.moveTo(...pts[0]); pts.slice(1).forEach((p) => s.lineTo(...p)); s.closePath();
  const slit = new THREE.Path(); slit.moveTo(0, 0.95); slit.lineTo(0.05, -0.8); slit.lineTo(0, -1.0); slit.lineTo(-0.05, -0.8); slit.closePath();
  s.holes.push(slit);
  return new Icon3D('planeIcon', [{ geo: extrude(s, depth, 4), role: 'body' }], theme);
}

/**
 * Measure how much white the silhouette keeps while tumbling (for QA / README). Uses an offscreen ortho render.
 * Returns {min, mean, samples} as a ratio of the front-on white pixel count.
 */
export function measureSilhouette(renderer, icon, { samples = 60, size = 256, o = {} } = {}) {
  const prev = { mode: icon.mode, rot: icon.rotation.clone() };
  icon.setMode('silhouette');
  const rt = new THREE.WebGLRenderTarget(size, size), scene = new THREE.Scene(); scene.add(icon);
  const cam = new THREE.OrthographicCamera(-2.6, 2.6, 2.6, -2.6, 0.1, 50); cam.position.z = 10;
  const buf = new Uint8Array(size * size * 4), count = () => { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam); renderer.readRenderTargetPixels(rt, 0, 0, size, size, buf); let n = 0; for (let i = 0; i < buf.length; i += 4) if (buf[i] > 250) n++; return n; };
  icon.rotation.set(0, 0, 0); const base = count(); const r = [];
  for (let i = 0; i <= samples; i++) { icon.tumble(i / samples, o); r.push(count() / base); }
  renderer.setRenderTarget(null); rt.dispose(); scene.remove(icon);
  icon.setMode(prev.mode); icon.rotation.copy(prev.rot);
  return { min: Math.min(...r), mean: r.reduce((a, b) => a + b, 0) / r.length, samples: r.length };
}
