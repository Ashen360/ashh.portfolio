// Stylized low-poly mirrorless camera — chunky "3D icon" look (soft rounded edges, matte black, leather grip,
// big ridged lens, iridescent glass). Unbranded: no lettering, logos or badges.
// Axis: +Z = lens axis (front), +Y up. Grip on -X (viewer's left when the camera faces you), strap lug + doors on +X.
import * as THREE from 'three';
import { getPalette } from '../shared/tokens.js';
import { roundBox, cyl, cylY, lathe, ridgedRing, makePart, flat } from '../shared/geo.js';
import { matteBlack, satinMetal, lensGlass, chrome } from '../shared/materials.js';
import { ExplodedAsset } from '../shared/parts.js';

export const CAMERA_PARTS = ['lensHood', 'lensBarrel', 'frontGlass', 'bodyShell', 'topPlate', 'shutterDial', 'grip', 'rearPanel', 'sensorBoard', 'sideCover'];

/** Landing order while assembling (progress 0 → 1): core first, lens hood last. */
const ORDER = ['bodyShell', 'sensorBoard', 'rearPanel', 'sideCover', 'grip', 'topPlate', 'shutterDial', 'lensBarrel', 'frontGlass', 'lensHood'];

/** exploded = assembled pivot + delta (pulled apart along the lens axis, Z), with a small exploded rotation. */
export const CAMERA_LAYOUT = {
  lensHood:    { delta: [0, 0.05, 4.2],    rot: [0, 0, 0] },
  frontGlass:  { delta: [0, 0, 3.0],       rot: [0, 0, 0] },
  lensBarrel:  { delta: [0, 0, 1.8],       rot: [0, 0, 0] },
  sensorBoard: { delta: [0, 0.05, 1.0],    rot: [0, 0, 0] },
  bodyShell:   { delta: [0, 0, 0],         rot: [0, 0, 0] },
  grip:        { delta: [-1.5, -0.2, 0.9], rot: [0, -0.3, 0] },
  sideCover:   { delta: [1.6, 0.2, -1.0],  rot: [0, 0.35, 0.05] },
  rearPanel:   { delta: [0, 0, -1.8],      rot: [0, 0, 0] },
  topPlate:    { delta: [0, 1.6, -0.5],    rot: [-0.1, 0, 0] },
  shutterDial: { delta: [0, 3.0, -0.4],    rot: [0, 0.6, 0] },
};
/** Euler XYZ matching the icon-style reference: front toward the viewer, turned ~24° to show the strap-lug side, seen slightly from above. */
export const CAMERA_POSE = [0.14, -0.32, 0];

const LX = 0.28, LY = -0.12; // lens axis position on the body front

export function createCamera({ theme = 'dark' } = {}) {
  const P = getPalette(theme).ramp;
  const body = P.ink.clone().lerp(P.hover, 0.95);
  const M = {
    shell: matteBlack(body, { scale: 70, bump: 0.25, rough: 0.42, name: 'shell' }),
    leather: matteBlack(P.hover.clone().lerp(P.border, 0.2), { scale: 120, bump: 1.0, rough: 0.75, name: 'leather' }),
    rubber: matteBlack(P.hover.clone().lerp(P.ink, 0.2), { grain: false, rough: 0.8, name: 'rubber' }),
    ring: matteBlack(body.clone().lerp(P.ink, 0.35), { grain: false, rough: 0.38, name: 'ring' }),
    dark: matteBlack(P.ink, { grain: false, rough: 0.85, name: 'dark' }),
    metal: satinMetal(P.border.clone().lerp(P.sec, 0.45), 0.3, 'metal'),
    lug: chrome(P.sec.clone().lerp(P.text, 0.4), 'lug'),
    glass: lensGlass(P.ink.clone().lerp(P.hover, 0.5), 'glass'),
    lamp: new THREE.MeshPhysicalMaterial({ color: P.sec.clone().lerp(P.text, 0.55), emissive: P.text, emissiveIntensity: 0.04, roughness: 0.3, clearcoat: 1, name: 'lamp' }), // flash lamp (frosted)
    light: new THREE.MeshPhysicalMaterial({ color: P.text, emissive: P.text, emissiveIntensity: 0.25, roughness: 0.2, clearcoat: 1, name: 'light' }),
    screen: new THREE.MeshPhysicalMaterial({ color: P.ink, emissive: P.accent, emissiveIntensity: 0.18, roughness: 0.1, clearcoat: 1, name: 'screen' }),
    pcb: flat(P.pcb, { roughness: 0.5, metalness: 0.3, name: 'pcb' }),
  };
  M.ring.side = THREE.DoubleSide; M.rubber.side = THREE.DoubleSide;
  M.glass.iridescence = 1; M.glass.iridescenceThicknessRange = [180, 520];
  const parts = {};

  // ---- bodyShell: lower body block, AF-assist window, strap lug + ring
  parts.bodyShell = makePart('bodyShell', [0, -0.18, 0], [
    { g: roundBox(3.0, 1.55, 1.25, 0.22), m: M.shell, p: [0, -0.18, 0] },
    { g: cyl(0.86, 0.86, 0.08, 28), m: M.ring, p: [LX, LY, 0.64] },                         // mount collar
    { g: roundBox(0.32, 0.17, 0.06, 0.03, 2), m: M.light, p: [-0.52, 0.5, 0.62] },          // AF-assist light window
    { g: roundBox(0.12, 0.24, 0.24, 0.05, 2), m: M.shell, p: [1.53, 0.48, 0.0] },            // lug post
    { g: new THREE.TorusGeometry(0.11, 0.032, 8, 16), m: M.lug, p: [1.64, 0.48, 0.0], r: [0, Math.PI / 2, 0.5] },
  ]);

  // ---- topPlate: upper band, EVF hump, flat shoe, small buttons
  parts.topPlate = makePart('topPlate', [0.05, 1.0, -0.02], [
    { g: roundBox(2.92, 0.44, 1.18, 0.17), m: M.shell, p: [0.05, 0.78, -0.02] },
    { g: roundBox(1.35, 0.8, 1.0, 0.18), m: M.shell, p: [0.38, 1.22, -0.07] },              // EVF hump
    { g: roundBox(1.18, 0.14, 0.96, 0.05, 3), m: M.ring, p: [0.38, 1.66, 0.0] },             // flat shoe plate
    { g: roundBox(0.92, 0.36, 0.06, 0.05, 2), m: M.ring, p: [0.38, 1.36, 0.44] },            // flash unit: bezel on the hump front
    { g: roundBox(0.8, 0.24, 0.06, 0.04, 2), m: M.lamp, p: [0.38, 1.36, 0.465] },             // flash lamp (lights up when it fires)
    { g: new THREE.BoxGeometry(0.74, 0.012, 0.012), m: M.ring, p: [0.38, 1.32, 0.5] },        // fresnel ridges
    { g: new THREE.BoxGeometry(0.74, 0.012, 0.012), m: M.ring, p: [0.38, 1.40, 0.5] },
    { g: cylY(0.12, 0.12, 0.12, 16), m: M.ring, p: [-0.95, 1.04, 0.3] },                     // small buttons
    { g: cylY(0.1, 0.1, 0.1, 16), m: M.ring, p: [-0.72, 1.03, 0.42] },
    { g: cylY(0.1, 0.1, 0.1, 16), m: M.ring, p: [-1.08, 1.03, 0.05] },
  ]);

  // ---- shutterDial: big grooved dial left of the hump
  const knurl = [];
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; knurl.push({ g: new THREE.BoxGeometry(0.05, 0.16, 0.06), m: M.ring, p: [-0.3 + Math.cos(a) * 0.3, 1.11, 0.12 + Math.sin(a) * 0.3], r: [0, -a, 0] }); }
  parts.shutterDial = makePart('shutterDial', [-0.3, 1.1, 0.12], [
    { g: cylY(0.3, 0.32, 0.2, 24), m: M.shell, p: [-0.3, 1.1, 0.12] },
    ...knurl,
    { g: cylY(0.15, 0.15, 0.08, 18), m: M.ring, p: [-0.3, 1.23, 0.12] },
  ]);

  // ---- grip: leather-wrapped front block + shutter button
  parts.grip = makePart('grip', [-1.17, 0.0, 0.66], [
    { g: roundBox(0.82, 1.9, 0.68, 0.26), m: M.leather, p: [-1.17, -0.02, 0.66] },
    { g: cylY(0.2, 0.2, 0.06, 18), m: M.ring, p: [-1.17, 0.96, 0.72] },
    { g: cylY(0.15, 0.15, 0.12, 18), m: M.shell, p: [-1.17, 1.02, 0.72] },
  ]);

  // ---- sideCover: +X side door panel with two vertical slots
  parts.sideCover = makePart('sideCover', [1.53, -0.35, 0.05], [
    { g: roundBox(0.08, 1.0, 0.85, 0.035, 2), m: M.shell, p: [1.5, -0.35, 0.05] },
    { g: roundBox(0.05, 0.36, 0.11, 0.04, 2), m: M.dark, p: [1.55, -0.12, 0.3] },
    { g: roundBox(0.05, 0.36, 0.11, 0.04, 2), m: M.dark, p: [1.55, -0.6, 0.3] },
  ]);

  // ---- rearPanel: back plate, screen, rubber eyecup
  parts.rearPanel = makePart('rearPanel', [0, 0.1, -0.66], [
    { g: roundBox(2.9, 1.5, 0.14, 0.06, 2), m: M.shell, p: [0, -0.18, -0.64] },
    { g: roundBox(1.85, 1.1, 0.04, 0.03, 2), m: M.screen, p: [-0.25, -0.18, -0.72] },
    { g: roundBox(0.85, 0.48, 0.26, 0.12), m: M.rubber, p: [0.38, 1.22, -0.62] },
    { g: roundBox(0.6, 0.28, 0.03, 0.02, 2), m: M.dark, p: [0.38, 1.22, -0.76] },
  ]);

  // ---- sensorBoard (hidden inside when assembled)
  parts.sensorBoard = makePart('sensorBoard', [LX, LY, 0.4], [
    { g: roundBox(2.1, 1.25, 0.06, 0.02, 1), m: M.pcb, p: [LX, LY, 0.4] },
    { g: roundBox(1.0, 0.66, 0.06, 0.015, 1), m: M.glass, p: [LX, LY, 0.45] },
    ...[[-0.8, 0.4], [0.8, 0.42], [-0.8, -0.42], [0.8, -0.42]].map(([x, y]) => ({ g: roundBox(0.3, 0.2, 0.05, 0.01, 1), m: M.metal, p: [LX + x, LY + y, 0.44] })),
  ]);

  // ---- lensBarrel: mount, big ridged focus ring, front ring, bezel
  parts.lensBarrel = makePart('lensBarrel', [LX, LY, 1.05], [
    { g: cyl(0.8, 0.8, 0.12, 28), m: M.ring, p: [LX, LY, 0.73] },
    { g: cyl(0.83, 0.83, 0.56, 28, true), m: M.rubber, p: [LX, LY, 1.06] },
    { g: ridgedRing(0.83, 0.52, 30, 0.1, 0.08), m: M.rubber, p: [LX, LY, 1.06] },
    { g: cyl(0.86, 0.86, 0.06, 28, true), m: M.ring, p: [LX, LY, 1.37] },
    { g: cyl(0.83, 0.83, 0.14, 28, true), m: M.shell, p: [LX, LY, 1.47] },
    // front bezel steps down to the glass (open lathe, so nothing caps the glass)
    { g: lathe([[0.83, -0.03], [0.83, 0.03], [0.74, 0.06], [0.68, 0.03], [0.66, -0.06], [0.6, -0.08]], 28), m: M.ring, p: [LX, LY, 1.54] },
  ]);

  // ---- frontGlass: big iridescent dome + inner element ring
  const dome = []; for (let i = 6; i >= 0; i--) { const r = (i / 6) * 0.6; dome.push([r, 0.1 * (1 - (r / 0.6) ** 2)]); }
  parts.frontGlass = makePart('frontGlass', [LX, LY, 1.5], [
    { g: lathe(dome, 28), m: M.glass, p: [LX, LY, 1.45] },
    { g: cyl(0.6, 0.6, 0.04, 28), m: M.dark, p: [LX, LY, 1.43] },
    { g: lathe([[0.36, 0], [0.38, 0.02], [0.34, 0.02]], 24), m: M.metal, p: [LX, LY, 1.53] },
  ]);

  // ---- lensHood: slim rounded screw-in hood (keeps the reference's big open lens face)
  parts.lensHood = makePart('lensHood', [LX, LY, 1.7], [
    { g: lathe([[0.83, 0], [0.88, 0.0], [0.91, 0.24], [0.88, 0.28], [0.85, 0.26], [0.83, 0.04]], 32), m: M.ring, p: [LX, LY, 1.56] },
  ]);

  const root = new ExplodedAsset({
    name: 'camera',
    parts: CAMERA_PARTS.map((n) => ({ name: n, group: parts[n], ...CAMERA_LAYOUT[n], ease: n === 'shutterDial' ? 'easeOutElastic' : 'easeOutExpo' })),
    order: ORDER, pose: CAMERA_POSE, duration: 0.42,
  });
  root.userData.materials = M;
  // flash unit: where CameraFlash should fire from, and a hook to light the lamp
  const anchor = new THREE.Object3D(); anchor.name = 'flashAnchor';
  anchor.position.set(0.38 - 0.05, 1.36 - 1.0, 0.52 + 0.02); // model (0.38, 1.36, 0.52) relative to the topPlate pivot
  parts.topPlate.add(anchor);
  root.flashAnchor = anchor;
  root.getFlashPosition = (target = new THREE.Vector3()) => { root.updateMatrixWorld(true); return anchor.getWorldPosition(target); };
  root.setFlashGlow = (k) => { M.lamp.emissiveIntensity = 0.04 + 4 * Math.max(0, k); return root; };
  return root;
}
