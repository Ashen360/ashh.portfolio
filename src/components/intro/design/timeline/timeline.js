// Storyboard timeline (seconds). Pure function of t, so the scrubber can jump anywhere.
// camera (exploded → spin → assemble → click + flash) → "Ashen" pop → the name gets a paper card that grows into a sheet and
// folds into a paper plane → "Ashen.IT" pop → Ashen.IT turns clockwise + gains depth → camera icon → plane icon → mask reveal.
import { EASE, clamp } from '../shared/easing.js';
import { TUMBLE_REFERENCE } from '../icons/icons.js';

export const CHAPTERS = [
  { id: 'cam', label: 'Camera', t0: 0.0, t1: 5.1 },
  { id: 'ashen', label: 'Ashen', t0: 5.1, t1: 6.2 },
  { id: 'plane', label: 'Paper plane', t0: 6.2, t1: 10.3 },
  { id: 'ashenIT', label: 'Ashen.IT', t0: 10.3, t1: 11.3 },
  { id: 'spin3d', label: 'Ashen.IT 3D', t0: 11.3, t1: 13.1 },
  { id: 'icons', label: 'Icons', t0: 13.1, t1: 15.5 },
  { id: 'reveal', label: 'Reveal', t0: 15.5, t1: 16.9 },
];
export const DURATION = 16.9;
const PLANE_FOLD = [6.2, 9.9]; // setProgress 0 → 1

const seg = (t, a, b) => clamp((t - a) / (b - a));
const pop = (k) => 0.55 + 0.45 * EASE.easeOutElastic(clamp(k));
const FOLD_LABEL = { sheet: 'Paper · card grows into a sheet', centerCrease: 'Paper · centre crease', cornerLeft: 'Paper · corners in', cornerRight: 'Paper · corners in',
  edgeLeft: 'Paper · edges to centre', edgeRight: 'Paper · edges to centre', foldHalf: 'Paper · fold in half', wingLeft: 'Paper · wings down', wingRight: 'Paper · wings down', open: 'Paper · open wings' };

export function applyTimeline(t, A, view, { silent = false } = {}) {
  for (const k of ['camera', 'plane', 'cameraIcon', 'planeIcon', 'flash', 'ashen', 'ashenIT', 'ashenIT3D']) A[k].visible = false;
  view.reveal(0); view.mask(null);
  const ch = CHAPTERS.find((c) => t >= c.t0 && t < c.t1) || CHAPTERS[CHAPTERS.length - 1];
  let label = ch.label;
  const T = (x) => ch.t0 + x; // local helper

  if (ch.id === 'cam') {
    const cam = A.camera; cam.visible = true;
    const p = seg(t, 1.8, 4.0);
    cam.setSpin(Math.PI * 2 * (1 - EASE.easeInOutQuad(seg(t, 0.6, 2.4))));
    cam.setProgress(p, { silent });
    view.frame('camera', p);
    label = t < 0.6 ? 'Camera · exploded' : t < 1.8 ? 'Camera · spinning' : t < 4.0 ? 'Camera · assembling' : t < 4.5 ? 'Camera · reference pose' : 'Camera · click + flash';
    const f = seg(t, 4.5, 4.5 + A.flash.duration);
    A.flash.visible = f > 0 && f < 1; A.flash.setProgress(f); view.flashAt(f);
  } else if (ch.id === 'ashen') {
    A.ashen.visible = true; A.ashen.scale.setScalar(pop(seg(t, 5.1, 5.7))); view.frame('wordmark', 1);
  } else if (ch.id === 'plane') {
    const pl = A.plane; pl.visible = true;
    const p = seg(t, ...PLANE_FOLD); pl.setSpin(0); pl.setProgress(p, { silent }); view.frame('plane', p);
    const names = pl.partNames, idx = names.findIndex((n) => !pl._settled.get(n));
    label = p >= 1 ? 'Paper plane · reference pose' : FOLD_LABEL[names[Math.max(0, idx)]] || label;
  } else if (ch.id === 'ashenIT') {
    A.ashenIT.visible = true; A.ashenIT.scale.setScalar(pop(seg(t, T(0), T(0.6)))); view.frame('wordmark', 1);
  } else if (ch.id === 'spin3d') {
    const w = A.ashenIT3D; w.visible = true; w.scale.setScalar(1); w.setProgress(seg(t, T(0), T(1.6))); view.frame('wordmark', 1);
  } else if (ch.id === 'icons') {
    view.frame('icon', 1);
    const wk = 1 - EASE.easeInQuart(seg(t, T(0), T(0.5)));
    if (wk > 0.001 && t < T(0.5)) { const w = A.ashenIT3D; w.visible = true; w.setProgress(1); w.scale.setScalar(wk); }
    const c = A.cameraIcon, pi = A.planeIcon;
    if (t >= T(0.3) && t < T(1.7)) {
      c.visible = true; c.setMode('silhouette'); const k = seg(t, T(0.3), T(1.7));
      c.tumble(k, TUMBLE_REFERENCE); c.scale.setScalar(pop(seg(t, T(0.3), T(0.9))) * (1 - EASE.easeInQuart(seg(t, T(1.5), T(1.7)))) * 1.1); label = 'Camera icon · tumble';
      view.mask({ feather: 0.5 + 6 * (1 - EASE.easeOutQuart(seg(t, T(0.3), T(1.0)))) });
    }
    if (t >= T(1.5)) {
      pi.visible = true; pi.setMode('silhouette'); const k = seg(t, T(1.5), T(2.4));
      pi.tumble(k, { ...TUMBLE_REFERENCE, turns: 0.75 }); pi.scale.setScalar(pop(seg(t, T(1.5), T(2.1))) * 0.85); label = 'Paper-plane icon · tumble';
      view.mask({ feather: 0.5 + 6 * (1 - EASE.easeOutQuart(seg(t, T(1.5), T(2.2)))) });
    }
  } else if (ch.id === 'reveal') {
    const k = seg(t, T(0), T(1.4)), pi = A.planeIcon; pi.visible = true; pi.setMode('silhouette'); pi.rotation.set(0, 0, 0);
    pi.scale.setScalar(0.85 + 60 * EASE.easeInQuart(k)); view.frame('icon', 1); view.reveal(1, k);
    label = 'Zoom into paper plane · feathered mask reveal';
  }
  view.setChapter(label);
  return ch;
}
