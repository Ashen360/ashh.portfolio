import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from '../ThemeContext';
import heroPoster from '../../assets/video/hero-poster.webp';
import './IntroLoader.css';

const SEEN_KEY = 'ashen-intro-seen';
const SOUND_KEY = 'ashen-intro-sound';
const SHORT_START = 10.3;
const GATE_TIMEOUT = 10000;
const FADE_MS = 400;

function readStore(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function chooseMode() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  if (new URLSearchParams(window.location.search).get('intro') === 'full') return 'full';
  return readStore(SEEN_KEY) === '1' ? 'short' : 'full';
}

function createAudioContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  try {
    const ctx = new Context();
    ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function pageReady() {
  const fonts = document.fonts
    ? Promise.all([
      document.fonts.load('400 1em "Instrument Serif"'),
      document.fonts.load('italic 400 1em "Instrument Serif"'),
      document.fonts.load('600 1em Manrope'),
    ]).then(() => document.fonts.ready)
    : Promise.resolve();
  const windowLoaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  const poster = new Image();
  poster.src = heroPoster;
  const posterReady = poster.decode ? poster.decode() : Promise.resolve();
  const painted = new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const delay = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('introDelay')) || 0 : 0;
  const slow = new Promise((resolve) => window.setTimeout(resolve, delay));
  return Promise.all([fonts, windowLoaded, posterReady, painted, slow].map((p) => p.catch(() => {}))).then(() => {});
}

function SpeakerIcon({ on }) {
  return (
    <svg className="intro-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      {on ? (
        <>
          <path d="M15 9.2a4 4 0 0 1 0 5.6" />
          <path d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4" />
        </>
      ) : (
        <path d="M15.5 9.5l5 5m0-5l-5 5" />
      )}
    </svg>
  );
}

function IntroLoader({ onReveal, onComplete }) {
  const { theme } = useContext(ThemeContext);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const enterRef = useRef(null);
  const engineRef = useRef(null);
  const audioRef = useRef(null);
  const wantSoundRef = useRef(false);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);
  const [mode] = useState(chooseMode);
  const [themeName] = useState(theme === 'light' ? 'light' : 'dark');
  const [phase, setPhase] = useState(mode === 'full' ? 'gate' : 'wait');
  const [choice, setChoice] = useState(mode === 'short' ? 'muted' : null);
  const [engineReady, setEngineReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [hint] = useState(() => mode === 'short' && readStore(SOUND_KEY) === 'on');

  useEffect(() => {
    onRevealRef.current = onReveal;
    onCompleteRef.current = onComplete;
  }, [onReveal, onComplete]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const timers = [];
    let cancelled = false;
    let revealed = false;
    let completed = false;
    document.body.style.overflow = 'hidden';

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      writeStore(SEEN_KEY, '1');
      onRevealRef.current();
    };

    const complete = () => {
      if (completed || cancelled) return;
      completed = true;
      document.body.style.overflow = '';
      if (rootRef.current?.contains(document.activeElement)) {
        if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) previousFocus.focus();
        else document.activeElement.blur();
      }
      onCompleteRef.current();
    };

    const fadeOut = () => {
      if (cancelled) return;
      reveal();
      setPhase('out');
      timers.push(window.setTimeout(complete, FADE_MS));
    };

    const fail = (err) => {
      if (import.meta.env.DEV && err) console.warn('[intro] falling back to the page:', err);
      engineRef.current?.dispose();
      engineRef.current = null;
      fadeOut();
    };

    if (mode === 'reduced') {
      timers.push(window.setTimeout(fadeOut, 120));
    } else {
      const loaded = pageReady();
      import('./engine.js')
        .then(({ createIntro }) => {
          if (cancelled) return null;
          const engine = createIntro({
            canvas: canvasRef.current,
            theme: themeName,
            loaded,
            onReveal: () => {
              if (cancelled) return;
              setPhase('reveal');
              reveal();
            },
            onDone: () => {
              engineRef.current = null;
              complete();
            },
            onFail: fail,
          });
          engineRef.current = engine;
          return engine.ready;
        })
        .then(() => {
          if (!cancelled && engineRef.current) setEngineReady(true);
        })
        .catch(fail);
    }

    if (mode === 'full') {
      timers.push(window.setTimeout(() => setChoice((c) => c || 'muted'), GATE_TIMEOUT));
    }

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      engineRef.current?.dispose();
      engineRef.current = null;
      if (audioRef.current && audioRef.current.state !== 'closed') audioRef.current.close().catch(() => {});
      audioRef.current = null;
      document.body.style.overflow = '';
    };
  }, [mode, themeName]);

  useEffect(() => {
    if (phase === 'gate') enterRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (!engineReady || !choice) return;
    const engine = engineRef.current;
    if (!engine) return;
    const context = wantSoundRef.current ? audioRef.current : null;
    engine
      .start({ from: mode === 'short' ? SHORT_START : 0, context })
      .then(() => setPhase((p) => (p === 'reveal' || p === 'out' ? p : 'play')))
      .catch(() => {
        engine.dispose();
        setPhase('out');
        onRevealRef.current();
        window.setTimeout(() => onCompleteRef.current(), FADE_MS);
      });
  }, [engineReady, choice, mode]);

  const enter = (withSound) => {
    if (choice) return;
    if (withSound) {
      audioRef.current = audioRef.current || createAudioContext();
      wantSoundRef.current = !!audioRef.current;
      setSoundOn(!!audioRef.current);
    }
    writeStore(SOUND_KEY, withSound ? 'on' : 'off');
    setChoice(withSound && audioRef.current ? 'sound' : 'muted');
    setPhase('wait');
  };

  const toggleSound = () => {
    const next = !soundOn;
    if (next && !audioRef.current) audioRef.current = createAudioContext();
    if (next) audioRef.current?.resume().catch(() => {});
    const on = next && !!audioRef.current;
    wantSoundRef.current = on;
    engineRef.current?.setAudio(on ? audioRef.current : null);
    writeStore(SOUND_KEY, on ? 'on' : 'off');
    setSoundOn(on);
  };

  return (
    <div
      className="intro"
      ref={rootRef}
      data-phase={phase}
      data-mode={mode}
      aria-busy={phase !== 'reveal' && phase !== 'out'}
    >
      <canvas className="intro-canvas" ref={canvasRef} aria-hidden="true" />

      {phase === 'gate' && (
        <div className="intro-gate" role="dialog" aria-labelledby="intro-gate-title">
          <p className="intro-eyebrow" id="intro-gate-title">Ashen<i>.IT</i></p>
          <p className="intro-note">A short intro with sound design.</p>
          <div className="intro-actions">
            <button type="button" className="intro-btn intro-btn-primary" ref={enterRef} onClick={() => enter(true)}>
              <SpeakerIcon on />
              Enter with sound
            </button>
            <button type="button" className="intro-btn intro-btn-ghost" onClick={() => enter(false)}>
              Continue muted
            </button>
          </div>
        </div>
      )}

      {(phase === 'play' || phase === 'wait') && choice && mode !== 'reduced' && (
        <button
          type="button"
          className="intro-mute"
          onClick={toggleSound}
          data-hint={hint && !soundOn ? '' : undefined}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute intro sound' : 'Play intro sound'}
        >
          <SpeakerIcon on={soundOn} />
        </button>
      )}
    </div>
  );
}

export default IntroLoader;
