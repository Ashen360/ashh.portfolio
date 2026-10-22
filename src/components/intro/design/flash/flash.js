// Camera flash: radial rays + soft glow, ~200 ms, transparent background. Procedural shader, no textures.
// Premultiplied-alpha "over" blending, so it composites on any background. Contained: alpha is 0 at the quad edge.
import * as THREE from 'three';
import { getPalette } from '../shared/tokens.js';
import { EASE, clamp } from '../shared/easing.js';

const vert = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uP, uRays, uIn, uOut, uGlowMix, uSeed;
uniform vec3 uCore, uAccent;
float hash(float n){ return fract(sin(n*127.1+uSeed)*43758.5453); }
void main(){
  vec2 q = (vUv - 0.5) * 2.0;
  float r = length(q);
  if (r > 1.0) discard;
  float a = atan(q.y, q.x) + uP * 0.35;                         // slow twist while it fires
  float seg = 6.2831853 / uRays;
  float id = floor((a + 3.1415926) / seg);
  float len = mix(0.42, 1.0, hash(id)) * (0.35 + 0.65 * uIn);   // each ray has its own length, all grow with uIn
  float ang = abs(fract((a + 3.1415926) / seg) - 0.5) * 2.0;    // 0 at ray centre → 1 between rays
  float width = mix(0.22, 0.07, smoothstep(0.0, 1.0, r));        // rays taper outward
  float ray = (1.0 - smoothstep(0.0, width, ang)) * smoothstep(len, 0.12, r) * smoothstep(0.04, 0.16, r);
  float core = exp(-r * r * 30.0) * 0.85;                                // bright hot centre
  float halo = exp(-r * r * 6.0) * uGlowMix * 1.1;                // soft accent glow (--ls-glow style falloff)
  float env = uOut;                                               // overall fade
  float rim = smoothstep(1.0, 0.72, r);                           // contained: zero alpha at the edge
  float aRay = ray * 0.95, aCore = core, aHalo = halo;
  float alpha = clamp((aRay + aCore + aHalo) * env * rim, 0.0, 1.0);
  vec3 col = (uCore * (aRay + aCore) + uAccent * aHalo * 1.5) / max(aRay + aCore + aHalo, 1e-4);
  gl_FragColor = vec4(col * alpha, alpha);
  #include <colorspace_fragment>
}`;

export class CameraFlash extends THREE.Group {
  /** @param {{radius?:number, rays?:number, duration?:number, theme?:'dark'|'light'}} o  radius in world units; duration seconds */
  constructor({ radius = 1.7, rays = 14, duration = 0.2, theme = 'dark' } = {}) {
    super(); this.name = 'cameraFlash';
    const P = getPalette(theme);
    this.duration = duration; this._raf = 0; this.progress = 0;
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true,
      uniforms: {
        uP: { value: 0 }, uRays: { value: rays }, uIn: { value: 0 }, uOut: { value: 0 }, uSeed: { value: 3.0 },
        uGlowMix: { value: P.glowMix }, uCore: { value: P.text.clone() }, uAccent: { value: P.accent.clone() },
      },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), this.material);
    this.mesh.renderOrder = 10; this.mesh.visible = false; this.add(this.mesh);
  }
  /** p = 0..1 across the flash duration (scrubbable). Rise uses easeOutExpo, fall easeInQuad (site loader easings). */
  setProgress(p) {
    p = clamp(p); this.progress = p;
    const rise = 0.16, u = this.material.uniforms;
    u.uP.value = p;
    u.uIn.value = EASE.easeOutExpo(clamp(p / 0.55));
    u.uOut.value = p < rise ? EASE.easeOutExpo(p / rise) : 1 - EASE.easeInQuad((p - rise) / (1 - rise));
    this.mesh.visible = p > 0 && p < 1;
    return this;
  }
  /** Current brightness envelope 0..1 (use it to light the camera's flash lamp). */
  get envelope() { return this.mesh.visible ? this.material.uniforms.uOut.value : 0; }
  /** Billboard toward a camera (call each frame while visible). */
  faceCamera(camera) { this.quaternion.copy(camera.quaternion); return this; }
  /** Fire once in real time (default 200 ms). Resolves when finished. */
  fire() {
    cancelAnimationFrame(this._raf);
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (t) => { const k = clamp((t - t0) / (this.duration * 1000)); this.setProgress(k >= 1 ? 0 : k); if (k < 1) this._raf = requestAnimationFrame(tick); else res(); };
      this._raf = requestAnimationFrame(tick);
    });
  }
  dispose() { cancelAnimationFrame(this._raf); this.mesh.geometry.dispose(); this.material.dispose(); }
}
