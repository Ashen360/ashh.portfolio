import { useEffect, useRef } from 'react';
import anime from 'animejs';
import './LoadingScreen.css';

const BRAND_MAIN = 'Ashen';
const BRAND_ACCENT = '.IT';
const QUOTE = 'Thank you for browsing my portfolio!';
const STATUS = 'Developing';
const META_LEFT = 'Portfolio';
const YEAR = new Date().getFullYear();
const SHUTTERS = 5;
const FONT_TIMEOUT = 1000;
const HOLD = 180;

function LoadingScreen({ onReveal, onComplete }) {
  const rootRef = useRef(null);
  const glowRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const countRef = useRef(null);
  const contentRef = useRef(null);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onCompleteRef.current = onComplete;
  }, [onReveal, onComplete]);

  useEffect(() => {
    const root = rootRef.current;
    const all = (selector) => root.querySelectorAll(selector);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anims = [];
    let cancelled = false;
    let fontTimer;
    let holdTimer;

    document.body.style.overflow = 'hidden';

    const track = (instance) => {
      anims.push(instance);
      return instance;
    };

    const setProgress = (value) => {
      countRef.current.textContent = String(value);
      fillRef.current.style.transform = `scaleX(${value / 100})`;
    };

    const finish = () => {
      document.body.style.overflow = '';
      onCompleteRef.current();
    };

    const runExit = () => {
      if (reduceMotion) {
        onRevealRef.current();
        track(anime({
          targets: root,
          opacity: [1, 0],
          duration: 400,
          easing: 'linear',
          complete: finish
        }));
        return;
      }

      trackRef.current.style.transformOrigin = 'right';
      track(anime.timeline({ easing: 'easeInQuart', complete: finish }))
        .add({
          targets: all('.ls-rise'),
          translateY: ['0%', '-110%'],
          duration: 600,
          delay: anime.stagger(22)
        }, 0)
        .add({
          targets: all('.ls-fade'),
          opacity: 0,
          translateY: -10,
          duration: 400,
          easing: 'easeInQuad'
        }, 0)
        .add({
          targets: trackRef.current,
          scaleX: 0,
          duration: 600,
          easing: 'easeInOutQuart'
        }, 0)
        .add({
          targets: glowRef.current,
          opacity: 0,
          duration: 500,
          easing: 'linear'
        }, 0)
        .add({
          targets: all('.ls-shutter'),
          translateY: ['0%', '-100%'],
          duration: 950,
          easing: 'easeInOutQuart',
          delay: anime.stagger(60),
          begin: () => onRevealRef.current()
        }, 350);
    };

    const runCounter = () => {
      const counter = { value: 0 };
      track(anime({
        targets: counter,
        value: 100,
        round: 1,
        duration: reduceMotion ? 1200 : 2200,
        delay: reduceMotion ? 0 : 300,
        easing: reduceMotion ? 'linear' : 'easeInOutQuad',
        update: () => setProgress(counter.value),
        complete: () => {
          holdTimer = window.setTimeout(runExit, HOLD);
        }
      }));
    };

    const runIntro = () => {
      if (reduceMotion) {
        track(anime({
          targets: contentRef.current,
          opacity: [0, 1],
          duration: 400,
          easing: 'linear'
        }));
        runCounter();
        return;
      }

      track(anime.timeline({ easing: 'easeOutExpo' }))
        .add({
          targets: glowRef.current,
          opacity: [0, 1],
          duration: 1400,
          easing: 'easeOutQuad'
        }, 0)
        .add({
          targets: all('.ls-letter'),
          translateY: ['110%', '0%'],
          duration: 1100,
          delay: anime.stagger(45)
        }, 100)
        .add({
          targets: all('.ls-fade:not(.ls-quote)'),
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 700,
          delay: anime.stagger(60),
          easing: 'easeOutQuart'
        }, 300)
        .add({
          targets: countRef.current,
          translateY: ['110%', '0%'],
          duration: 1000
        }, 350)
        .add({
          targets: trackRef.current,
          scaleX: [0, 1],
          duration: 900,
          easing: 'easeInOutQuart'
        }, 450)
        .add({
          targets: all('.ls-quote'),
          opacity: [0, 1],
          translateY: [12, 0],
          filter: ['blur(6px)', 'blur(0px)'],
          duration: 900,
          easing: 'easeOutQuart'
        }, 750);
      runCounter();
    };

    const fontsReady = document.fonts
      ? Promise.all([
        document.fonts.load('1em "Instrument Serif"'),
        document.fonts.load('italic 1em "Instrument Serif"')
      ])
      : Promise.resolve();
    const timeout = new Promise((resolve) => {
      fontTimer = window.setTimeout(resolve, FONT_TIMEOUT);
    });

    Promise.race([fontsReady, timeout])
      .catch(() => {})
      .then(() => {
        if (!cancelled) runIntro();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fontTimer);
      window.clearTimeout(holdTimer);
      anims.forEach((instance) => instance.pause());
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="loader" ref={rootRef} aria-hidden="true">
      <div className="ls-shutters" style={{ '--ls-shutters': SHUTTERS }}>
        {Array.from({ length: SHUTTERS }, (_, i) => (
          <div key={i} className="ls-shutter" />
        ))}
      </div>
      <div className="ls-glow" ref={glowRef} />

      <div className="ls-content" ref={contentRef}>
        <div className="ls-row">
          <span className="ls-meta ls-fade">{META_LEFT}</span>
          <span className="ls-meta ls-fade">© {YEAR}</span>
        </div>

        <div className="ls-center">
          <div className="ls-lockup">
            <div className="ls-brand">
              {[...BRAND_MAIN].map((ch, i) => (
                <span key={'m' + i} className="ls-mask">
                  <span className="ls-rise ls-letter">{ch}</span>
                </span>
              ))}
              {[...BRAND_ACCENT].map((ch, i) => (
                <span key={'a' + i} className="ls-mask">
                  <span className="ls-rise ls-letter ls-accent">{ch}</span>
                </span>
              ))}
            </div>
            <div className="ls-track" ref={trackRef}>
              <div className="ls-fill" ref={fillRef} />
            </div>
          </div>
          <p className="ls-quote ls-fade">{QUOTE}</p>
        </div>

        <div className="ls-row ls-row-bottom">
          <span className="ls-status ls-fade">
            <span className="ls-dot" />
            {STATUS}
          </span>
          <div className="ls-count">
            <span className="ls-mask">
              <span className="ls-rise ls-count-value" ref={countRef}>0</span>
            </span>
            <span className="ls-count-unit ls-fade">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;