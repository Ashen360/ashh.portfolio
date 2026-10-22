import { createStage } from './stage.js';
import { createSound, preloadSfx } from './sound.js';
import { applyTimeline, DURATION } from './design/timeline/timeline.js';
import { EASE, clamp } from './design/shared/easing.js';

export const SHORT_START = 10.3;
export const HOLD_AT = 15.5;
const HOLD_CYCLE = 1.3;
const HOLD_REST = 0.4;
const HOLD_CAP = 10;
const FADE_OUT = 0.35;
const REVEAL_LENGTH = DURATION - HOLD_AT;
const MAX_STEP = 0.25;
const SLOW_FRAME = 22;
const SAMPLE_FRAMES = 90;
const FLAT = 0.01;
const TYPE_TURN = [11.3, 12.9];
const SPILL_IN = [11.3, 11.9];
const SPILL_OUT = [13.1, 13.5];
const SPILL = 0.09;
const CAMERA_TURN = [13.4, 14.8];
const PLANE_TURN = [14.6, HOLD_AT];

const seg = (t, [a, b]) => clamp((t - a) / (b - a));
const turn = (icon, k) => icon.rotation.set(0, -Math.PI * 2 * EASE.easeInOutQuart(clamp(k)), 0);

function pose(t, revealAt, A, view, silent) {
  if (t < HOLD_AT) {
    applyTimeline(t, A, view, { silent });
    const typeTurn = seg(t, TYPE_TURN);
    if (A.ashenIT3D.visible && t < TYPE_TURN[1]) view.orbit(Math.sin(Math.PI * typeTurn) ** 2);
    view.spill(A.ashenIT3D.visible ? SPILL * EASE.easeInOutQuad(seg(t, SPILL_IN)) * (1 - EASE.easeInQuad(seg(t, SPILL_OUT))) : 0);
    if (A.cameraIcon.visible) turn(A.cameraIcon, seg(t, CAMERA_TURN));
    if (A.planeIcon.visible) turn(A.planeIcon, seg(t, PLANE_TURN));
    return;
  }
  if (t < revealAt) {
    applyTimeline(HOLD_AT - 1e-3, A, view, { silent });
    view.spill(0);
    const k = clamp(((t - HOLD_AT) % HOLD_CYCLE - HOLD_REST) / (HOLD_CYCLE - HOLD_REST));
    turn(A.planeIcon, k);
    view.mask({ feather: 0.5 + 2 * Math.sin(Math.PI * k) });
    return;
  }
  applyTimeline(Math.min(HOLD_AT + (t - revealAt), DURATION - 1e-3), A, view, { silent });
  view.spill(0);
  A.planeIcon.scale.z = FLAT;
}

export function createIntro({ canvas, theme, loaded, onReveal, onDone, onFail }) {
  const stage = createStage(canvas, theme);
  const { A, view } = stage;
  const buffers = preloadSfx();
  let sound = null;
  let ctx = null;
  let muted = true;
  let isLoaded = false;
  let t = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let revealAt = Infinity;
  let finished = false;
  let disposed = false;
  let leaked = null;
  let frames = 0;
  let frameTime = 0;

  loaded.then(() => {
    isLoaded = true;
  });

  A.plane.onPartSettled = (step) => {
    if (step !== 'sheet' && step !== 'open') sound?.crease();
  };

  const fail = (err) => {
    if (disposed) return;
    dispose();
    onFail(err);
  };

  const onContextLost = () => fail(new Error('webgl context lost'));
  canvas.addEventListener('webglcontextlost', onContextLost);

  const observer = new ResizeObserver(() => {
    stage.resize(canvas.clientWidth, canvas.clientHeight);
    if (!running && !disposed) draw(true);
  });
  observer.observe(canvas);
  stage.resize(canvas.clientWidth, canvas.clientHeight);

  function decide() {
    if (revealAt !== Infinity || t < HOLD_AT - FADE_OUT) return;
    if (!isLoaded && t < HOLD_AT + HOLD_CAP - FADE_OUT) return;
    revealAt = t < HOLD_AT ? HOLD_AT : HOLD_AT + Math.ceil((t + FADE_OUT - HOLD_AT) / HOLD_CYCLE) * HOLD_CYCLE;
    sound?.endHold(revealAt - t);
    onReveal();
  }

  function draw(silent) {
    pose(t, revealAt, A, view, silent);
    stage.render();
  }

  function finish() {
    if (finished) return;
    finished = true;
    dispose();
    onDone();
  }

  function frame(now) {
    if (disposed || !running) return;
    raf = requestAnimationFrame(frame);
    try {
      const step = last ? Math.min((now - last) / 1000, MAX_STEP) : 0;
      last = now;
      t += step;
      decide();
      if (sound && !muted) sound.update(t);
      draw(false);
      if (step && frames < SAMPLE_FRAMES) {
        frameTime += step * 1000;
        frames += 1;
        if (frames === SAMPLE_FRAMES && frameTime / frames > SLOW_FRAME && stage.lowerResolution()) {
          frames = 0;
          frameTime = 0;
        }
      }
      if (t >= revealAt + REVEAL_LENGTH) finish();
    } catch (err) {
      fail(err);
    }
  }

  function play() {
    if (running || disposed || finished || document.hidden) return;
    running = true;
    last = 0;
    sound?.resume();
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    sound?.suspend();
  }

  const onVisibility = () => (document.hidden ? pause() : play());
  let started = false;

  async function attach(context) {
    ctx = context;
    const map = await buffers;
    if (disposed || ctx !== context || sound) return;
    sound = createSound(context, map);
    sound.setMuted(muted);
    if (revealAt !== Infinity) sound.endHold(0);
    if (!running) sound.suspend();
  }

  function setAudio(context) {
    if (disposed) return;
    muted = !context;
    if (context && !ctx) attach(context);
    sound?.setMuted(muted);
    if (!muted && sound) sound.resume();
  }

  async function start({ from = 0, context = null } = {}) {
    if (started || disposed) return;
    started = true;
    t = from;
    if (context) {
      muted = false;
      ctx = context;
      const map = await Promise.race([buffers, new Promise((r) => setTimeout(r, 1500))]);
      if (disposed) return;
      if (map) {
        sound = createSound(context, map);
        sound.setMuted(false);
      } else attach(context);
    }
    t = from;
    draw(true);
    document.addEventListener('visibilitychange', onVisibility);
    play();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(raf);
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    A.plane.onPartSettled = null;
    if (sound) sound.close();
    else if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
    leaked = stage.dispose();
  }

  const ready = stage.warm().then(() => {
    if (disposed) return;
    t = 0;
    draw(true);
  });

  const api = { ready, start, setAudio, dispose };

  if (import.meta.env.DEV) {
    window.__intro = {
      get t() {
        return t;
      },
      get chapter() {
        return view.chapter;
      },
      get revealAt() {
        return revealAt;
      },
      get loaded() {
        return isLoaded;
      },
      get leaked() {
        return leaked;
      },
      get pixelRatio() {
        return stage.renderer.getPixelRatio();
      },
      get frameMs() {
        return frames ? frameTime / frames : 0;
      },
      pause,
      play,
      seek(time) {
        pause();
        t = time;
        if (revealAt === Infinity && t >= HOLD_AT - FADE_OUT && isLoaded) {
          revealAt = HOLD_AT;
          sound?.endHold(0);
          onReveal();
        }
        draw(true);
      },
    };
  }

  return api;
}
