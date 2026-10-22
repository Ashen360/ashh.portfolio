# Ashen.IT loader — 3D assets (Three.js ES modules)

Low-poly, unbranded, texture-free assets for the animated portfolio loading screen. All colours, fonts, glow and easing come from
`shared/tokens.js`, extracted from https://ashens-web.netlify.app/ (re-verified against the live site at the end of the build).

```
camera/     camera.js           createCamera()            10 named parts
plane/      paperPlane.js       createPaperPlane()        sheet → 8 folds → open (10 events)
icons/      icons.js            createCameraIcon(), createPlaneIcon(), measureSilhouette()
flash/      flash.js            CameraFlash
wordmarks/  wordmarks.js        createAshenFlat(), createAshenITFlat(), createAshenITExtruded()
            glyphs.js           baked Instrument Serif outlines (OFL) for "Ashen" + ".IT"
shared/     tokens.js easing.js geo.js parts.js
preview/    index.html main.js timeline.js     open via any static server
vendor/     three.module.min.js (r186, 725 KB) — optional, only so preview works offline
```
Modules import the bare specifier `'three'` (import map in `preview/index.html`; your bundler resolves it in the real site). Total ≈ 0.8 MB with the vendored three, ≈ 75 KB without.
Preview: `npx serve .` (or any static server) → `/preview/index.html`. ES modules do not load from `file://`.

## Design system used (from the portfolio)
| token | value |
|---|---|
| dark: bg / text / secondary / accent / border / hover | `#0a0a0a` / `#fafaf8` / `#9b9b9b` / `#2563eb` / `#2a2a2a` / `#1a1a1a` |
| light: bg / text / secondary / accent / border / hover | `#f8f7f4` / `#111827` / `#233458` / `#002168` / `#e6e5e2` / `#efede9` |
| fonts | wordmark **Instrument Serif** (`"Ashen"` upright in text colour, `".IT"` italic in accent); UI **Manrope** |
| glow | `radial-gradient(45% 40% at 50% 48%, accent 18% (dark) / 7% (light), transparent 72%)`; card glows `#2563eb1f/59/4d` |
| easing | anime.js penner: `easeOutExpo` (enter/land), `easeInOutQuart`, `easeInQuart`, `easeInQuad`, `easeOutQuart`, `easeOutElastic(1,.5)`; CSS `cubic-bezier(.4,0,.2,1)`, `(.22,1,.36,1)`, `(.2,.8,.2,1)` |
Product materials are derived only by mixing these tokens (see `getPalette().ramp`). No lettering, logos or badges anywhere. The paper plane is off-white paper with a faint accent-blue graph grid and "Ashen" printed at the foot of the page (your name, by choice — it folds inside the keel). The camera is all matte black; the only blue is the rim light and the rear-screen glow.

## Camera API
Style: chunky "3D-icon" camera (big offset ridged lens, boxy prism + hot shoe, knob cluster, flash window, pebbled grip, side lug with port slots), built from your reference image. Axes: **+Z = front/lens axis/nose, +Y up.** The asset group's origin is its assembled centre, so `setSpin` pivots about the middle.
```js
import { createCamera } from './camera/camera.js';
const cam = createCamera({ theme: 'dark' });   // THREE.Group (ExplodedAsset)
scene.add(cam);
cam.setProgress(0..1);                          // 0 = exploded, 1 = assembled, per-part stagger, order below
cam.onPartSettled = (name, index) => playClick(name);          // callback…
cam.addEventListener('partSettled', e => e.name);              // …or event ('partUnsettled' fires when scrubbing back)
cam.setProgress(p, { silent: true });          // seek without firing callbacks
cam.setSpin(radians);                           // extra yaw about the model's vertical axis, on top of the reference pose
cam.play({ duration: 2.4 });  cam.stop();      // optional rAF tween (Promise)
cam.getPart('lensHood');  cam.partNames;  cam.getBounds('exploded'|'assembled');  cam.describe();  cam.dispose();
```
* Every part is a named `THREE.Group`; its pivot is its own centre. `group.userData.assembled` / `.exploded` hold `{position, rotation, scale}`; `group.position` is animated between them.
* **Stagger**: each part travels for 42 % of the 0..1 range; part *i* starts at `i·(1−dur)/(n−1)`. Easing is `easeOutExpo` (the shutterDial uses `easeOutElastic` for a click).
* **Settled** fires when the eased value reaches 0.99 (i.e. when the part *visibly* lands, not at the end of its tween), once per crossing, in landing order (10 events).
* Reference pose (`asset.rotation`, Euler XYZ): `[0.14, -0.32, 0]` (lens turned slightly to viewer-left, looking down ~8°). The camera's leather grip is on -X (front-left) and its strap lug / port door on +X.
* Positions below are model units (camera body ≈ 3 wide), relative to the asset centre pivot offset noted in code (`asset.center`).

### Camera parts — exploded along the lens axis (Z)
| # | part | assembled position | exploded position | exploded rotation (rad) | starts at |
|---|---|---|---|---|---|
| 1 | `bodyShell` | [0, -0.18, 0] | [0, -0.18, 0] | [0, 0, 0] | 0 |
| 2 | `sensorBoard` | [0.28, -0.12, 0.4] | [0.28, -0.07, 1.4] | [0, 0, 0] | 0.064 |
| 3 | `rearPanel` | [0, 0.1, -0.66] | [0, 0.1, -2.46] | [0, 0, 0] | 0.129 |
| 4 | `sideCover` | [1.53, -0.35, 0.05] | [3.13, -0.15, -0.95] | [0, 0.35, 0.05] | 0.193 |
| 5 | `grip` | [-1.17, 0, 0.66] | [-2.67, -0.2, 1.56] | [0, -0.3, 0] | 0.258 |
| 6 | `topPlate` | [0.05, 1, -0.02] | [0.05, 2.6, -0.52] | [-0.1, 0, 0] | 0.322 |
| 7 | `shutterDial` | [-0.3, 1.1, 0.12] | [-0.3, 4.1, -0.28] | [0, 0.6, 0] | 0.387 |
| 8 | `lensBarrel` | [0.28, -0.12, 1.05] | [0.28, -0.12, 2.85] | [0, 0, 0] | 0.451 |
| 9 | `frontGlass` | [0.28, -0.12, 1.5] | [0.28, -0.12, 4.5] | [0, 0, 0] | 0.516 |
| 10 | `lensHood` | [0.28, -0.12, 1.7] | [0.28, -0.07, 5.9] | [0, 0, 0] | 0.58 |

### Paper plane (`plane/paperPlane.js`)
```js
import { createPaperPlane, PAPER_FOLDS, PAPER_STEPS } from './plane/paperPlane.js';
const plane = createPaperPlane({ theme: 'dark' });   // THREE.Group
plane.setProgress(0..1);            // 0 = small card around the printed "Ashen" → 0.12 full A4 sheet → folds → 1 finished dart
plane.onPartSettled = (step, i) => playCrease(step);   // same hook as the camera; also 'partSettled' / 'partUnsettled' events
plane.setProgress(p, { silent: true });  plane.setSpin(rad);  plane.play({ duration: 3.6 });  plane.getBounds('assembled'|'exploded');  plane.dispose();
plane.textWidth;                    // printed name width in sheet units — match it to the flat "Ashen" for a seamless hand-off
```
How it folds: the sheet (A4, 2 × 2.83 units, nose at +Y) is pre-cut along every crease into 16 flat facets. Each fold is a hinge rotation about its crease **as it lies at that moment** (rigid origami), composed in order, so later folds carry earlier flaps with them. Folds stop 1–3° short of flat, like real paper, which also keeps stacked layers from flickering. Orientation: the sheet faces the viewer while the first folds happen, tilts slightly, then turns into the reference pose `PAPER_POSE = [0.62, -0.95, 0.12]` (nose to the viewer's lower-left, 3/4 from the front and above), recentred on the finished plane.

| # | event (`onPartSettled`) | crease (flat-folded coords) | fold | when (progress) |
|---|---|---|---|---|
| 1 | `sheet` | — card grows from the printed name to the full sheet | — | 0 → 0.12 |
| 2 | `centerCrease` | x = 0 | right half 150° toward viewer, then unfolds to 0° (leaves the crease) | 0.12 → 0.25 |
| 3 | `cornerLeft` | (0, 1.414) → (−1, 0.414) | top-left corner to the centre, 179° | 0.25 → 0.34 |
| 4 | `cornerRight` | (0, 1.414) → (1, 0.414) | top-right corner to the centre, 179° | 0.31 → 0.40 |
| 5 | `edgeLeft` | (0, 1.414) → (−1, −1.0) | new left edge to the centre, 177° | 0.41 → 0.50 |
| 6 | `edgeRight` | (0, 1.414) → (1, −1.0) | new right edge to the centre, 177° | 0.48 → 0.57 |
| 7 | `foldHalf` | x = 0 | fold in half, flaps inside, 179° (opens to 166°) | 0.59 → 0.70 |
| 8 | `wingLeft` | x = −0.32 on the left half | wing down 178° (opens to 82°) | 0.72 → 0.81 |
| 9 | `wingRight` | x = −0.32 on the right half | wing down 178° (opens to 82°) | 0.78 → 0.87 |
| 10 | `open` | — wings open to a slight V, plane settles into the pose | — | 0.89 → 1.0 |

Fold easing is `easeInOutQuart`; the card growth also uses `easeInOutQuart`. Every value above is in `PAPER_FOLDS` (crease endpoints `a`/`b`, `fold`, `t`, `open`). Change them there.

Authoring table lives in `CAMERA_LAYOUT` (exploded = assembled pivot + `delta`, plus `rot`); change them there.

## Icons (`icons/icons.js`)
`createCameraIcon()` / `createPlaneIcon()` → `Icon3D` (THREE.Group): extruded with a 2-segment bevel, ~2 and ~3.3 units tall. The plane icon is a paper-plane dart seen from above, with a slit down the keel so the two wings read separately.
* `setMode('silhouette')` (default): one unlit `MeshBasicMaterial` `#ffffff`, `toneMapped:false`, no lights/fog — every covered pixel is exactly white, so render it to a target and use it as a mask. The camera's lens is a real hole with a floating disc, so it reads at any angle.
* `setMode('shaded')`: lit, design-system colours.
* `tumble(t, {turns, tilt, fx, fy})`: multi-axis tumble t=0..1 that rests front-on at t=1. Z spins freely (default 1.25 turns); X/Y wobble up to `tilt` (default 65°).
* **Limit, stated honestly:** any flat extrusion becomes a sliver at 90° edge-on, so `tumble` caps the X/Y tilt. Measured with `measureSilhouette()` over the path (white pixels vs front-on): camera: 55° → min 0.90 · 65° → min 0.79 · 80° → min 0.60. Paper-plane dart (thinner): 65° → min 0.66 · `TUMBLE_REFERENCE` (84°) → min 0.51. Don't drive X/Y rotation to ±90° if the mask must stay readable.
* The preview's final chapter shows the intended use: paper-plane silhouette → render target → feathered (blurred) composite over a stand-in portfolio page.

## Flash (`flash/flash.js`)
`new CameraFlash({ radius = 1.7, rays = 14, duration = 0.2, theme })` — one procedural shader quad (no textures): 14 rays of random length, a hot core and a soft accent glow, premultiplied-alpha "over" blending, alpha reaches 0 before the quad edge (contained), transparent background.
`flash.fire()` (real-time, 200 ms, Promise) · `flash.setProgress(0..1)` (scrubbable) · `flash.faceCamera(camera)` billboard · fire it from the camera's flash unit: `flash.position.copy(camera.getFlashPosition())` (nudge it slightly toward the viewer), then `camera.setFlashGlow(flash.envelope)` each frame to light the lamp. The flash unit is a bezel + frosted lamp on the front of the viewfinder hump (part of `topPlate`, anchor `camera.flashAnchor`). Envelope: `easeOutExpo` rise, `easeInQuad` fall.

## Wordmarks (`wordmarks/wordmarks.js`)
Instrument Serif outlines baked into `glyphs.js` with HarfBuzz kerning (3.8 KB), so no font loading is needed in WebGL. `size` = capital-letter height in world units.
* `createAshenFlat()` — "Ashen", flat unlit shapes. `createAshenITFlat()` — "Ashen.IT" (".IT" italic, accent).
* `createAshenITExtruded({ depth: 0.2, turns: 1 })` — front faces are the same unlit material as the flat version, side walls are lit (needs lights). `setDepth(0..1)`, `setSpin(rad)` (negative = clockwise seen from above), `setProgress(p)` = one clockwise turn while depth grows over the first 70 %, ending front-facing so it can hand off to the icons.
* Light theme uses `#111827` / `#002168`. No glitch, no RGB split.

## Finish / materials (`shared/materials.js`)
No image files — everything is procedural, so the "no external textures" budget holds.
* **Camera** — dark satin plastic (`matteBlack`: physical material, soft clearcoat sheen) with a pebbled shader-based leather grain on the grip (object-space noise → bump + roughness, auto-fades below pixel size so it never shimmers), satin dark-metal dials/rings/strap lugs, coated lens glass (`lensGlass`, thin-film tint). Reference: your matte-black camera photo.
* **Paper plane** — matte paper (front in `--text` white, back a touch greyer so flaps read as layers), faint accent graph grid and the printed name drawn into a runtime canvas from the baked Instrument Serif outlines (no font loading, no image files), flat shading so every fold is a crisp facet.
* **Reflections** — `studioEnvironment(renderer)` builds a PMREM softbox environment from the design-system colours; set `scene.environment = studioEnvironment(renderer)` (the preview does this). Without it the glossy materials still render but look flatter.
* The camera uses creased normals (`crease()` in `shared/geo.js`): smooth-shaded with hard edges kept.

## Motion reference (the video, 00:05–00:09)
Taken as motion language only: a solid white silhouette that flips fast through several axes, narrows to a near edge-on sliver and recovers, with heavily feathered edges that sharpen as it settles. Implemented as `TUMBLE_REFERENCE` (tilt up to 84°, 1.5 turns, fast X/Y flips) in `icons/icons.js`, and as the feather ramp (blur 6 → 0.5 px-steps) applied to the icon chapters in the preview. The default `tumble()` stays at a 65° cap; pass `TUMBLE_REFERENCE` for the clip's look (slivers included). No glitch / RGB-split from the clip was used.

## Preview (`preview/`)
Timeline scrubber over the whole storyboard (16.9 s): camera exploded → gradual spin → assemble → reference pose → click + flash → "Ashen" pop → the name gets a paper card that grows into a sheet and folds into a paper plane → reference pose → "Ashen.IT" pop → clockwise 3D turn → camera icon tumble → paper-plane icon tumble → zoom into the paper plane with feathered mask reveal. Chapter ticks are clickable; the right panel lights each camera part / paper fold chip as `onPartSettled` fires (optional synthesized click sound); the **Asset lab** drives any single asset by hand. Timeline code is a pure function of time (`timeline.js`).

## Notes
* The mask-reveal page in the preview is a labelled stand-in, not your real portfolio.
* Performance: camera ≈ 25 draw calls; paper plane = 2 draw calls, 16 facets / 32 triangles, vertex positions rewritten per frame (CPU, trivial); shared materials, procedural finishes (a few extra shader instructions on the matte/grain materials), no shadows, no textures; geometry is merged per (part, material).
