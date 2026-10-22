// Procedural finishes — no image files. Grain/leather is a shader (object-space value noise → bump + roughness),
// reflections come from a generated studio environment built out of the design-system colours.
import * as THREE from 'three';
import { getPalette } from './tokens.js';

const NOISE = /* glsl */`
varying vec3 vGrainPos;
float gH = 0.5;
float h31(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

/** Adds a fine procedural grain (leather / matte coating) to a MeshStandard/Physical material. */
export function addGrain(mat, { scale = 70, bump = 0.35, rough = 0.18 } = {}) {
  mat.userData.grain = { scale, bump, rough };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uGrain = { value: new THREE.Vector3(scale, bump, rough) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrainPos = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform vec3 uGrain;\n${NOISE}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        vec3 gp = vGrainPos * uGrain.x;
        float gFade = 1.0 - smoothstep(0.35, 0.9, length(fwidth(gp)));          // fade out when finer than a pixel (no shimmer)
        gH = vnoise(gp) * 0.6 + vnoise(gp * 2.7) * 0.4;
        roughnessFactor = clamp(roughnessFactor + (gH - 0.5) * uGrain.z * gFade, 0.04, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 dpdx = normalize(dFdx(-vViewPosition)), dpdy = normalize(dFdy(-vViewPosition));
          float hx = dFdx(gH), hy = dFdy(gH);
          vec3 R1 = cross(dpdy, normal), R2 = cross(normal, dpdx);
          float det = dot(dpdx, R1);
          vec3 grad = sign(det) * (hx * R1 + hy * R2);
          normal = normalize(abs(det) * normal - grad * uGrain.y * gFade * 0.5); }`);
  };
  mat.customProgramCacheKey = () => 'grain';
  return mat;
}

const phys = (o) => new THREE.MeshPhysicalMaterial(o);

/** Smooth matte black (soft satin sheen, fine leather grain). */
export function matteBlack(color, { grain = true, rough = 0.62, scale = 90, bump = 0.45, clearcoat = 0.12, ccRough = 0.55, name = 'matte' } = {}) {
  const m = phys({ color, roughness: rough, metalness: 0.0, clearcoat, clearcoatRoughness: ccRough, envMapIntensity: 1.0, name });
  return grain ? addGrain(m, { scale, bump, rough: 0.2 }) : m;
}
/** Satin dark metal (dials, rings, lugs). */
export const satinMetal = (color, rough = 0.34, name = 'metal') => phys({ color, roughness: rough, metalness: 0.9, envMapIntensity: 1.1, name });
/** Coated lens glass: near-black with a thin-film tint. */
export const lensGlass = (color, name = 'glass') => phys({ color, roughness: 0.04, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.7, iridescenceIOR: 1.6, envMapIntensity: 1.5, name });
/** Glossy automotive-style white. */
export const glossWhite = (color, name = 'gloss') => phys({ color, roughness: 0.24, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.8, name });
export const chrome = (color, name = 'chrome') => phys({ color, roughness: 0.14, metalness: 1, envMapIntensity: 1.3, name });
export const blackGloss = (color, name = 'blackgloss') => phys({ color, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.2, name });

/**
 * Studio reflection environment (PMREM) generated from emissive panels — soft boxes in --text, an --accent strip, graphite bounce.
 * Usage: scene.environment = studioEnvironment(renderer); (also call once per renderer; dispose when done)
 */
export function studioEnvironment(renderer, theme = 'dark') {
  const P = getPalette(theme).ramp, s = new THREE.Scene();
  s.background = P.hover.clone().multiplyScalar(0.5);
  const panel = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(12, 8, P.text, 4.2, [0, 9, 2]);          // overhead softbox
  panel(6, 9, P.text, 3.2, [-8, 3, 6]);        // key
  panel(3, 10, P.accent, 1.6, [9, 2, -4]);       // accent strip (portfolio blue)
  panel(10, 3, P.text, 2.2, [4, -1, -9]);      // back kicker
  panel(14, 6, P.border, 1.2, [0, -8, 0]);     // floor bounce
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture; pm.dispose();
  s.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return tex;
}
