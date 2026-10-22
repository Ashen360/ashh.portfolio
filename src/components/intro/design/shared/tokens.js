// Design tokens extracted from https://ashens-web.netlify.app/ (index-_SrDMdzg.css + index-CrrRRNCM.js)
// Every colour, font, glow and easing used by the 3D assets comes from this file.
import * as THREE from 'three';

export const TOKENS = {
  source: 'https://ashens-web.netlify.app/ — :root / [data-theme="light"] / .loader rules + loader timeline',
  dark: {
    bg: '#0a0a0a', text: '#fafaf8', textSecondary: '#9b9b9b',
    accent: '#2563eb', border: '#2a2a2a', hoverBg: '#1a1a1a',
  },
  light: {
    bg: '#f8f7f4', text: '#111827', textSecondary: '#233458',
    accent: '#002168', border: '#e6e5e2', hoverBg: '#efede9',
  },
  fonts: {
    serif: '"Instrument Serif", Georgia, "Times New Roman", serif', // wordmark / --ls-serif
    sans: '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif', // UI / --ls-sans
    googleCss: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@200;300;400;500;600;700&display=swap',
    // loader: "Ashen" upright in --text, ".IT" italic in --accent
    wordmark: { base: 'Ashen', accent: '.IT', baseStyle: 'normal', accentStyle: 'italic', letterSpacing: '-0.02em' },
  },
  glow: {
    // .ls-glow: radial-gradient(45% 40% at 50% 48%, color-mix(accent N%, transparent), transparent 72%)
    radialDarkMix: 0.18, radialLightMix: 0.07,
    radial: { rx: 0.45, ry: 0.40, cx: 0.5, cy: 0.48, stop: 0.72 },
    // card glows used across the site: box-shadow rgba(accent, a)
    boxShadowAlpha: [0x1f / 255, 0x59 / 255, 0x4d / 255], // #2563eb1f, #2563eb59, #2563eb4d
  },
  easing: {
    // anime.js 3.2.1 penner names used by the loader timeline
    loaderEnter: 'easeOutExpo', loaderBar: 'easeInOutQuart', loaderExit: 'easeInQuart',
    fadeIn: 'easeOutQuart', fadeOut: 'easeInQuad', pop: 'easeOutElastic',
    css: { standard: [0.4, 0, 0.2, 1], expoOut: [0.22, 1, 0.36, 1], soft: [0.2, 0.8, 0.2, 1] },
  },
  motion: { // ms, from the loader timeline
    letterRise: 1100, letterStagger: 45, bar: 900, fade: 700, exit: 600, shutter: 950, shutterStagger: 60,
  },
};

const col = (hex) => new THREE.Color(hex);

/** Palette as THREE.Colors, plus tints derived ONLY by mixing token colours. */
export function getPalette(theme = 'dark') {
  const t = TOKENS[theme] || TOKENS.dark;
  const d = TOKENS.dark;
  const bg = col(t.bg), text = col(t.text), sec = col(t.textSecondary), accent = col(t.accent);
  const border = col(t.border), hover = col(t.hoverBg);
  const mix = (a, b, k) => a.clone().lerp(b, k);
  // product materials are lit physical objects; they always use the dark ramp so they read on either theme
  const dbg = col(d.bg), dtext = col(d.text), dsec = col(d.textSecondary), dacc = col(d.accent);
  const dborder = col(d.border), dhover = col(d.hoverBg);
  return {
    theme, bg, text, textSecondary: sec, accent, border, hover,
    glowMix: theme === 'light' ? TOKENS.glow.radialLightMix : TOKENS.glow.radialDarkMix,
    ramp: {
      ink: dbg, hover: dhover, border: dborder, sec: dsec, text: dtext, accent: dacc,
      graphite: mix(dborder, dsec, 0.26),   // body shell
      graphiteLo: mix(dhover, dborder, 0.55), // rubber / grip
      graphiteHi: mix(dborder, dsec, 0.5),   // top plate / metal
      metal: mix(dsec, dtext, 0.35),
      coat: mix(dbg, dacc, 0.45),            // lens coating
      pcb: mix(dbg, dacc, 0.6),
      white: mix(dsec, dtext, 0.85),
      whiteWarm: mix(dtext, dsec, 0.12),
      panel: mix(dbg, dacc, 0.22),
    },
  };
}
