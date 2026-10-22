import * as THREE from 'three';
import { TOKENS, getPalette } from './design/shared/tokens.js';
import { EASE, clamp } from './design/shared/easing.js';
import { createCamera } from './design/camera/camera.js';
import { createPaperPlane } from './design/plane/paperPlane.js';
import { createCameraIcon, createPlaneIcon } from './design/icons/icons.js';
import { studioEnvironment } from './design/shared/materials.js';
import { CameraFlash } from './design/flash/flash.js';
import { createAshenFlat, createAshenITFlat, disposeWordmark } from './design/wordmarks/wordmarks.js';
import { createWordmark3D } from './wordmark3d.js';

const FOV = 30;
const HALF_FOV = THREE.MathUtils.degToRad(FOV / 2);
const MASK_SCALE = 0.5;
const PREVIEW_MASK_HEIGHT = 576;
const PLANE_ASPECT = 16 / 9;
const MAX_DPR = 2;
const ICONS = ['cameraIcon', 'planeIcon'];
const TYPE_FRAMES = ['wordmark', 'icon'];
const ORBIT = { x: -0.55, y: 0.85 };
const SPILL_RADIUS = 0.2;

let BLUR_SUM = 0;
for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) BLUR_SUM += Math.exp(-(i * i + j * j) / 6);

const srgb = (hex) => new THREE.Vector3(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

const COMPOSITE = `varying vec2 vUv;
uniform sampler2D tMask;
uniform float uF, uMix, uFill, uOn, uGlow, uNorm, uSpill, uAspect;
uniform vec2 uTexel, uSpillAt;
uniform vec3 uBg, uAccent, uTint;
void main() {
  vec2 g = vec2((vUv.x - 0.5) / 0.45, (vUv.y - 0.52) / 0.40);
  vec3 bg = mix(uBg, uAccent, uGlow * clamp(1.0 - length(g) / 0.72, 0.0, 1.0));
  vec2 s = (vUv - uSpillAt) * vec2(uAspect, 1.0);
  bg = mix(bg, uAccent, uSpill * exp(-dot(s, s) / ${(SPILL_RADIUS * SPILL_RADIUS).toFixed(4)}));
  float m = 0.0;
  if (uOn > 0.5) {
    for (int i = -3; i <= 3; i++) for (int j = -3; j <= 3; j++) {
      vec2 o = vec2(float(i), float(j));
      m += texture2D(tMask, vUv + o * uTexel * uF).r * exp(-dot(o, o) / 6.0);
    }
    m *= uNorm;
  }
  m = clamp(max(m, uFill), 0.0, 1.0);
  float keep = 1.0 - uMix;
  gl_FragColor = vec4(bg * (1.0 - m) + uTint * m * keep, 1.0 - m + m * keep);
}`;

export function createStage(canvas, theme) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 unavailable');
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
  renderer.debug.checkShaderErrors = !import.meta.env.PROD;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 400);
  const L = getPalette('dark');
  scene.environment = studioEnvironment(renderer);
  const hemi = new THREE.HemisphereLight(L.text, L.textSecondary, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(L.text, 2.0);
  key.position.set(-4, 6, 8);
  const rim = new THREE.DirectionalLight(L.accent, 0.5);
  rim.position.set(6, 3, -6);
  const back = new THREE.DirectionalLight(L.text, 0.9);
  back.position.set(5, -2, 5);
  scene.add(key, rim, back);
  const rigs = {
    product: [
      [hemi, 0.55, null],
      [key, 2.0, [-4, 6, 8]],
      [rim, 0.5, [6, 3, -6]],
      [back, 0.9, [5, -2, 5]],
    ],
    type: [
      [hemi, 0.38, null],
      [key, 1.9, [-5, 5, 7]],
      [rim, 1.4, [4, 2, -7]],
      [back, 0.5, [1.5, 8, 2]],
    ],
  };
  let rig = '';
  const applyRig = (name) => {
    if (rig === name) return;
    rig = name;
    for (const [light, intensity, position] of rigs[name]) {
      light.intensity = intensity;
      if (position) light.position.set(...position);
    }
  };
  applyRig('product');

  const A = {
    camera: createCamera({ theme }),
    plane: createPaperPlane({ theme }),
    cameraIcon: createCameraIcon({ theme }),
    planeIcon: createPlaneIcon({ theme }),
    flash: new CameraFlash({ theme }),
    ashen: createAshenFlat({ theme }),
    ashenIT: createAshenITFlat({ theme }),
    ashenIT3D: createWordmark3D({ theme }),
  };
  Object.values(A).forEach((o) => scene.add(o));

  const slit = new THREE.Shape([[0, 0.95], [0.05, -0.8], [0, -1.0], [-0.05, -0.8]].map(([x, y]) => new THREE.Vector2(x, y)));
  const slitFill = new THREE.Mesh(new THREE.ShapeGeometry(slit), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }));
  slitFill.visible = false;
  A.planeIcon.add(slitFill);

  const sphere = (b) => b.getBoundingSphere(new THREE.Sphere()).radius;
  const fitD = (r, pad = 1.08) => (r / Math.sin(HALF_FOV)) * pad;
  const tan = Math.tan(HALF_FOV);
  const frames = {
    camera: [fitD(sphere(A.camera.getBounds('exploded')), 0.82), fitD(sphere(A.camera.getBounds('assembled')), 0.98)],
    plane: [(Math.SQRT2 / tan) * 1.25, fitD(sphere(A.plane.getBounds('assembled')), 0.75)],
    wordmark: [8, 8],
    icon: [11, 11],
  };
  const needAspect = Math.max(1, A.ashenIT.userData.width / (0.84 * 2 * 8 * tan));
  let fit = 1;
  let planeFit = 1;

  const reveal = { on: false, k: 0, feather: null, plain: false };
  const view = {
    chapter: '',
    frame(name, p) {
      let d;
      if (name === 'plane') {
        const dText = 8 * (A.plane.textWidth / A.ashen.userData.width);
        const [dS, dP] = frames.plane;
        if (p < 0.12) {
          const [w, h] = A.plane.cardSize || [0, 0];
          d = Math.max(fit * dText, fit * (h / 2 / tan) * 1.25, (w / 2 / (tan * cam.aspect)) * 1.25);
        } else d = THREE.MathUtils.lerp(fit * dS, planeFit * dP, EASE.easeInOutQuad((p - 0.12) / 0.88));
      } else {
        const [e, a] = frames[name];
        d = fit * THREE.MathUtils.lerp(e, a, EASE.easeInOutQuad(p));
      }
      applyRig(TYPE_FRAMES.includes(name) ? 'type' : 'product');
      cam.position.set(0, 0, d);
      cam.lookAt(0, 0, 0);
    },
    orbit(a) {
      cam.position.x += ORBIT.x * a;
      cam.position.y += ORBIT.y * a;
      cam.lookAt(0, 0, 0);
    },
    spill(strength) {
      u.uSpill.value = strength * spillScale;
      if (strength <= 0) return;
      cam.updateMatrixWorld();
      A.ashenIT3D.updateWorldMatrix(true, true);
      spillPoint.copy(A.ashenIT3D.userData.accentCenter).applyMatrix4(A.ashenIT3D.children[0].matrixWorld).project(cam);
      u.uSpillAt.value.set(spillPoint.x * 0.5 + 0.5, spillPoint.y * 0.5 + 0.5);
    },
    flashAt() {
      const p = A.camera.getFlashPosition(new THREE.Vector3());
      A.flash.position.copy(p).addScaledVector(cam.position.clone().sub(p).normalize(), 0.15);
      A.flash.faceCamera(cam);
      A.camera.setFlashGlow(A.flash.envelope);
    },
    setChapter(label) {
      view.chapter = label;
    },
    reveal(on, k = 0) {
      slitFill.visible = !!on;
      reveal.on = !!on;
      reveal.k = k;
      reveal.feather = null;
    },
    mask(o) {
      if (o) {
        reveal.on = true;
        reveal.k = 0;
        reveal.feather = o.feather;
        reveal.plain = true;
      } else {
        reveal.plain = false;
        if (reveal.feather != null) {
          reveal.on = false;
          reveal.feather = null;
        }
      }
    },
  };

  const tokens = TOKENS[theme] || TOKENS.dark;
  const rt = new THREE.WebGLRenderTarget(2, 2, { samples: 0, depthBuffer: true });
  const compMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    uniforms: {
      tMask: { value: rt.texture },
      uF: { value: 1 },
      uMix: { value: 0 },
      uFill: { value: 0 },
      uOn: { value: 0 },
      uGlow: { value: getPalette(theme).glowMix },
      uNorm: { value: 1 / BLUR_SUM },
      uTexel: { value: new THREE.Vector2(0.5, 0.5) },
      uBg: { value: srgb(tokens.bg) },
      uAccent: { value: srgb(tokens.accent) },
      uTint: { value: srgb(tokens.text) },
      uSpill: { value: 0 },
      uSpillAt: { value: new THREE.Vector2(0.6, 0.5) },
      uAspect: { value: 16 / 9 },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: COMPOSITE,
  });
  const comp = new THREE.Scene();
  const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compMat);
  quad.frustumCulled = false;
  comp.add(quad);
  let featherScale = 1;
  const spillPoint = new THREE.Vector3();
  const spillScale = getPalette(theme).glowMix / getPalette('dark').glowMix;

  const u = compMat.uniforms;
  function render() {
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000, 0);
    if (!reveal.on) {
      u.uOn.value = 0;
      u.uMix.value = 0;
      u.uFill.value = 0;
      renderer.clear();
      renderer.render(comp, compCam);
      renderer.render(scene, cam);
      return;
    }
    const others = Object.entries(A).filter(([k, o]) => o.visible && !ICONS.includes(k)).map(([, o]) => o);
    others.forEach((o) => (o.visible = false));
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    u.uOn.value = 1;
    if (reveal.plain) {
      u.uF.value = reveal.feather * featherScale;
      u.uMix.value = 0;
      u.uFill.value = 0;
    } else {
      u.uF.value = (0.6 + 6 * reveal.k) * featherScale;
      u.uMix.value = EASE.easeOutQuad(clamp(reveal.k / 0.25));
      u.uFill.value = EASE.easeInQuad(clamp((reveal.k - 0.78) / 0.22));
    }
    renderer.render(comp, compCam);
    others.forEach((o) => (o.visible = true));
    if (others.length) {
      const icons = ICONS.map((k) => A[k]).filter((o) => o.visible);
      icons.forEach((o) => (o.visible = false));
      renderer.clearDepth();
      renderer.render(scene, cam);
      icons.forEach((o) => (o.visible = true));
    }
  }

  const size = { w: 0, h: 0 };
  function resize(w, h) {
    if (!w || !h) return;
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    u.uAspect.value = cam.aspect;
    fit = Math.max(1, needAspect / cam.aspect);
    planeFit = Math.max(1, PLANE_ASPECT / cam.aspect);
    const db = renderer.getDrawingBufferSize(new THREE.Vector2());
    const mw = Math.max(2, Math.round(db.x * MASK_SCALE));
    const mh = Math.max(2, Math.round(db.y * MASK_SCALE));
    rt.setSize(mw, mh);
    u.uTexel.value.set(1 / mw, 1 / mh);
    featherScale = mh / (PREVIEW_MASK_HEIGHT * fit);
  }

  function lowerResolution() {
    if (pixelRatio <= 1) return false;
    pixelRatio = Math.max(1, pixelRatio * 0.75);
    resize(size.w, size.h);
    return true;
  }

  async function warm() {
    const hidden = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    view.frame('camera', 1);
    try {
      if (renderer.compileAsync) await renderer.compileAsync(scene, cam);
      else renderer.compile(scene, cam);
      renderer.compile(comp, compCam);
    } finally {
      hidden.forEach((o) => (o.visible = false));
    }
  }

  function dispose() {
    A.camera.dispose();
    A.plane.dispose();
    A.cameraIcon.dispose();
    A.planeIcon.remove(slitFill);
    slitFill.geometry.dispose();
    slitFill.material.dispose();
    A.planeIcon.dispose();
    A.flash.dispose();
    [A.ashen, A.ashenIT, A.ashenIT3D].forEach(disposeWordmark);
    if (scene.environment.renderTarget) scene.environment.renderTarget.dispose();
    else scene.environment.dispose();
    scene.environment = null;
    scene.clear();
    rt.dispose();
    quad.geometry.dispose();
    compMat.dispose();
    const leaked = { ...renderer.info.memory };
    renderer.dispose();
    renderer.forceContextLoss();
    return leaked;
  }

  return { A, view, renderer, render, resize, lowerResolution, warm, dispose };
}
