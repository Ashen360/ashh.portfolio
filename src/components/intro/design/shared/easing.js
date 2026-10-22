// anime.js 3.2.1 "penner" easings used by the portfolio loader, plus its CSS cubic-béziers.
import { TOKENS } from './tokens.js';
const { PI, pow, sin, asin, cos } = Math;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const out = (f) => (t) => 1 - f(1 - t);
const inOut = (f) => (t) => (t < 0.5 ? f(t * 2) / 2 : 1 - f(t * -2 + 2) / 2);

const quad = (t) => t * t, quart = (t) => pow(t, 4), expo = (t) => (t ? pow(2, 10 * t - 10) : 0);
function elastic(a = 1, p = 0.5) {
  const amp = clamp(a, 1, 10), per = clamp(p, 0.1, 2);
  return (t) => (t === 0 || t === 1 ? t : -amp * pow(2, 10 * (t - 1)) * sin(((t - 1 - (per / (PI * 2)) * asin(1 / amp)) * (PI * 2)) / per));
}
export const EASE = {
  linear: (t) => t,
  easeInQuad: quad, easeOutQuad: out(quad), easeInOutQuad: inOut(quad),
  easeInQuart: quart, easeOutQuart: out(quart), easeInOutQuart: inOut(quart),
  easeInExpo: expo, easeOutExpo: (t) => (t >= 1 ? 1 : out(expo)(t)), easeInOutExpo: inOut(expo),
  easeOutElastic: out(elastic(1, 0.5)),
};
export function cubicBezier(x1, y1, x2, y2) {
  const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
  const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
  return (x) => {
    if (x <= 0 || x >= 1) return clamp(x);
    let t = x;
    for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (!s) break; t -= (calc(t, x1, x2) - x) / s; }
    return calc(clamp(t), y1, y2);
  };
}
export const CSS_EASE = Object.fromEntries(Object.entries(TOKENS.easing.css).map(([k, v]) => [k, cubicBezier(...v)]));
export const getEase = (e) => (typeof e === 'function' ? e : EASE[e] || CSS_EASE[e] || EASE.easeOutExpo);
export { clamp };
