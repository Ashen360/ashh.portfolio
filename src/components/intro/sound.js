import whoosh from './sfx/whoosh.mp3';
import cameraAssembling from './sfx/camera_assembling.mp3';
import shutter from './sfx/shutter.mp3';
import ping from './sfx/ping.mp3';
import paperSheet from './sfx/paper_sheet.mp3';
import paperCrinkle from './sfx/paper_crinkle.mp3';
import paperOpen from './sfx/paper_open.mp3';
import pop from './sfx/pop.mp3';
import electronicBeeps from './sfx/electronic_beeps.mp3';
import holdLoopOgg from './sfx/electronic_hold_loop.ogg';
import holdLoopWav from './sfx/electronic_hold_loop.wav';

const FILES = {
  whoosh,
  camera_assembling: cameraAssembling,
  shutter,
  ping,
  paper_sheet: paperSheet,
  paper_crinkle: paperCrinkle,
  paper_open: paperOpen,
  pop,
  electronic_beeps: electronicBeeps,
};

export const CUES = [
  { at: 0.9, file: 'whoosh' },
  { at: 1.8, file: 'camera_assembling' },
  { at: 4.5, file: 'shutter' },
  { at: 5.1, file: 'ping' },
  { at: 6.2, file: 'paper_sheet' },
  { at: 9.55, file: 'paper_open' },
  { at: 10.3, file: 'pop' },
  { at: 11.3, file: 'electronic_beeps' },
];

const CRINKLES = [0.13, 0.63, 1.155, 1.67];
const CRINKLE_LENGTH = 0.42;
const HOLD_AT = 13.5;
const HOLD_FADE_IN = 0.4;
const HOLD_FADE_OUT = 0.35;
const LOOKAHEAD = 0.12;
const MIN_TAIL = 0.15;

let preload = null;

function decode(decoder, url) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(url);
      return res.arrayBuffer();
    })
    .then((data) => decoder.decodeAudioData(data));
}

export function preloadSfx() {
  if (preload) return preload;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Offline || !window.fetch) return (preload = Promise.resolve(new Map()));
  let decoder;
  try {
    decoder = new Offline(2, 1, 48000);
  } catch {
    return (preload = Promise.resolve(new Map()));
  }
  const buffers = new Map();
  const jobs = Object.entries(FILES).map(([name, url]) =>
    decode(decoder, url).then((b) => buffers.set(name, b), () => {})
  );
  jobs.push(
    decode(decoder, holdLoopOgg)
      .catch(() => decode(decoder, holdLoopWav))
      .then((b) => buffers.set('electronic_hold_loop', b), () => {})
  );
  preload = Promise.all(jobs).then(() => buffers);
  return preload;
}

export function createSound(ctx, buffers) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  const fired = new Set();
  let hold = null;
  let holdEnded = false;
  let lastCrease = -1;
  let closed = false;

  const play = (name, when, { offset = 0, duration, rate = 1, gain = 1 } = {}) => {
    const buffer = buffers.get(name);
    if (!buffer) return null;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(master);
    src.start(when, offset, duration);
    return { src, g };
  };

  const startHold = (t) => {
    const now = ctx.currentTime;
    const when = now + Math.max(0, HOLD_AT - t);
    const buffer = buffers.get('electronic_hold_loop');
    if (!buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(1, when + HOLD_FADE_IN);
    src.connect(g).connect(master);
    src.start(when);
    hold = { src, g };
  };

  return {
    update(t) {
      if (closed) return;
      const now = ctx.currentTime;
      CUES.forEach((cue, i) => {
        if (fired.has(i) || cue.at > t + LOOKAHEAD) return;
        fired.add(i);
        const late = t - cue.at;
        const buffer = buffers.get(cue.file);
        if (!buffer || buffer.duration - late < MIN_TAIL) return;
        play(cue.file, now + Math.max(0, -late), { offset: Math.max(0, late) });
      });
      if (!hold && !holdEnded && t + LOOKAHEAD >= HOLD_AT) startHold(t);
    },
    crease() {
      if (closed) return;
      let i = Math.floor(Math.random() * CRINKLES.length);
      if (i === lastCrease) i = (i + 1 + Math.floor(Math.random() * (CRINKLES.length - 1))) % CRINKLES.length;
      lastCrease = i;
      const db = -2 + Math.random() * 3;
      play('paper_crinkle', ctx.currentTime, { offset: CRINKLES[i], duration: CRINKLE_LENGTH, rate: 0.95 + Math.random() * 0.1, gain: 10 ** (db / 20) });
    },
    endHold(delay) {
      holdEnded = true;
      if (!hold || closed) return;
      const end = ctx.currentTime + delay;
      const g = hold.g.gain;
      g.setValueAtTime(1, Math.max(ctx.currentTime, end - HOLD_FADE_OUT));
      g.linearRampToValueAtTime(0, end);
      hold.src.stop(end + 0.05);
    },
    setMuted(muted) {
      if (closed) return;
      master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03);
    },
    suspend() {
      if (!closed && ctx.state === 'running') ctx.suspend().catch(() => {});
    },
    resume() {
      if (!closed && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    close() {
      if (closed) return;
      closed = true;
      try {
        hold?.src.stop();
      } catch {
        hold = null;
      }
      if (ctx.state !== 'closed') ctx.close().catch(() => {});
    },
  };
}
