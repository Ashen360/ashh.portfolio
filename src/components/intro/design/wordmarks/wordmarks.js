// "Ashen" (flat) and "Ashen.IT" (flat + extruded) in the portfolio font, Instrument Serif.
// As on the site loader: "Ashen" upright in --text, ".IT" italic in --accent. No glitch / RGB-split.
import * as THREE from 'three';
import { getPalette } from '../shared/tokens.js';
import { EASE, clamp } from '../shared/easing.js';
import { GLYPHS } from './glyphs.js';

function pathToShapes(d, flipX = 0) {
  const sp = new THREE.ShapePath(); let cx = 0, cy = 0;
  for (const m of d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
    const n = m[2].trim() ? m[2].trim().split(/[ ,]+/).map(Number) : [];
    switch (m[1]) {
      case 'M': sp.moveTo(n[0], n[1]); cx = n[0]; cy = n[1]; break;
      case 'L': sp.lineTo(n[0], n[1]); cx = n[0]; cy = n[1]; break;
      case 'Q': sp.quadraticCurveTo(n[0], n[1], n[2], n[3]); cx = n[2]; cy = n[3]; break;
      case 'C': sp.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]); cx = n[4]; cy = n[5]; break;
      case 'Z': break;
    }
  }
  return sp.toShapes(false);
}

/** runs: 'base' = "Ashen", 'accent' = ".IT", or both. Returns [{shapes, x, role}] in font units. */
function layout(which) {
  const out = [], off = which === 'both' ? GLYPHS.regular.width : 0;
  if (which !== 'accent') for (const g of GLYPHS.regular.glyphs) out.push({ ch: g.ch, shapes: pathToShapes(g.d), x: g.x, role: 'base' });
  if (which !== 'base') for (const g of GLYPHS.italic.glyphs) out.push({ ch: g.ch, shapes: pathToShapes(g.d), x: g.x + (which === 'both' ? off : 0), role: 'accent' });
  const width = which === 'base' ? GLYPHS.regular.width : which === 'accent' ? GLYPHS.italic.width : GLYPHS.regular.width + GLYPHS.italic.width;
  return { glyphs: out, width };
}

const UPM = 1000, CAP = GLYPHS.regular.cap;

/**
 * @param {'base'|'accent'|'both'} which
 * @param {{extrude?:boolean, size?:number, theme?:string}} o  size = height of the capital letters in world units (default 1)
 */
function build(which, { extrude = false, size = 1, theme = 'dark', depth = 0.2 } = {}) {
  const P = getPalette(theme), k = size / CAP;
  const { glyphs, width } = layout(which);
  const mats = {
    base: new THREE.MeshBasicMaterial({ color: P.text, toneMapped: false }),
    accent: new THREE.MeshBasicMaterial({ color: P.accent, toneMapped: false }),
    baseSide: new THREE.MeshStandardMaterial({ color: P.text.clone().multiplyScalar(0.55), flatShading: true, roughness: 0.5 }),
    accentSide: new THREE.MeshStandardMaterial({ color: P.accent.clone().multiplyScalar(0.7), flatShading: true, roughness: 0.4, emissive: P.accent, emissiveIntensity: 0.15 }),
  };
  const holder = new THREE.Group(); // centred, scaled to `size`
  const root = new THREE.Group(); root.add(holder);
  const cxm = width / 2;
  for (const g of glyphs) {
    const geo = extrude
      ? new THREE.ExtrudeGeometry(g.shapes, { depth: depth * UPM, curveSegments: 4, bevelEnabled: true, bevelThickness: 10, bevelSize: 8, bevelSegments: 1 })
      : new THREE.ShapeGeometry(g.shapes, 4);
    const mesh = new THREE.Mesh(geo, extrude ? [mats[g.role], mats[g.role + 'Side']] : mats[g.role]);
    mesh.name = `glyph_${g.ch}`;
    mesh.position.x = g.x - cxm;
    if (extrude) mesh.position.z = -depth * UPM / 2; // centred on z=0 so it spins about its middle
    holder.add(mesh);
  }
  holder.scale.setScalar(k);
  holder.position.y = -CAP * k / 2;
  root.userData = { mats, width: width * k, height: size };
  return root;
}

/** Flat "Ashen" (unlit, front-facing shapes). */
export function createAshenFlat(o = {}) { const g = build('base', { ...o, extrude: false }); g.name = 'Ashen'; return g; }
/** Flat "Ashen.IT". */
export function createAshenITFlat(o = {}) { const g = build('both', { ...o, extrude: false }); g.name = 'Ashen.IT'; return g; }

/**
 * Extruded "Ashen.IT". Front faces are unlit MeshBasicMaterial identical to the flat version, so swapping flat → extruded
 * at depth 0 is seamless; side walls are lit (add lights to the scene).
 *   setDepth(0..1)  grows the extrusion from flat
 *   setSpin(rad)    rotation about Y; NEGATIVE = clockwise seen from above (turntable clockwise)
 *   setProgress(p)  0..1: depth eases in over the first ~70% while it turns one full clockwise revolution, ending front-facing
 */
export function createAshenITExtruded(o = {}) {
  const g = build('both', { ...o, extrude: true });
  g.name = 'Ashen.IT (3D)';
  const spinner = new THREE.Group();
  spinner.add(g.children[0]); g.add(spinner);
  const sz = (o.size ?? 1);
  g.setDepth = (d) => { d = clamp(d); spinner.children[0].scale.z = Math.max(1e-4, d) * (sz / CAP); g.visible = true; return g; };
  g.setSpin = (rad) => { spinner.rotation.y = rad; return g; };
  g.turns = o.turns ?? 1;
  g.setProgress = (p) => { p = clamp(p); g.setSpin(-Math.PI * 2 * g.turns * EASE.easeInOutQuart(p)); g.setDepth(EASE.easeOutQuart(clamp(p / 0.7))); return g; };
  g.setProgress(0);
  return g;
}

export function disposeWordmark(g) { g.traverse((o) => o.geometry?.dispose()); Object.values(g.userData.mats).forEach((m) => m.dispose()); }
