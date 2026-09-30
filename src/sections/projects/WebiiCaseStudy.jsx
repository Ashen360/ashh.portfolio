import "./EditorialCaseStudy.css";
import "./WebiiCaseStudy.css";
import { useState } from "react";
import { useCaseStudyFonts } from "../../hooks/useCaseStudyFonts";

import menuImg from "../../assets/projects/webii/menu.webp";
import nightShelfImg from "../../assets/projects/webii/night-shelf.webp";
import calibrationImg from "../../assets/projects/webii/calibration.webp";
import debugImg from "../../assets/projects/webii/debug.webp";
import settingsImg from "../../assets/projects/webii/settings.webp";
import portfolioImg from "../../assets/projects/webii/portfolio-channel.webp";
import memoryChannelImg from "../../assets/projects/webii/memory-channel.webp";
import catchImg from "../../assets/projects/webii/catch.webp";
import sliceImg from "../../assets/projects/webii/slice.webp";
import memoryResultImg from "../../assets/projects/webii/memory-result.webp";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap";

const PINCH = { pressAt: 4.0, releaseAt: 5.0, openAt: 9.0 };

const findings = [
  {
    big: "2 of 12",
    title: "Fingertips never meet",
    finding: "To the tracker, touching fingertips still read 2.4–3.4 cm apart. A 3.0 cm threshold caught only 2 of 12 real pinches.",
    decision: "Press at 4.0 cm, release at 5.0 cm: 10 of 10 deliberate pinches caught, zero false clicks during natural movement.",
  },
  {
    big: "65%",
    title: "Release selects",
    finding: "On the same click-test data, release-to-select scored 65% against 44% for press-and-release on the same target.",
    decision: "Pinch, adjust while holding, release over the target. People correct their aim mid-hold, so the UI lets them.",
  },
  {
    big: "−41%",
    title: "The better signal that lost",
    finding: "Anchoring the cursor to the knuckle jittered 27–41% less while pinched, but replayed click tests scored worse: 2–6 of 12 against 6–11.",
    decision: "Off by default. Users steer with the fingertip during a hold, and the knuckle doesn't follow. Kept as a debug option.",
  },
  {
    big: "3.2",
    title: "Hand-lengths of travel",
    finding: "Landmark noise is about 0.02 hand-lengths per frame at any distance. The best session (92% hits) spanned 3.2 hand-lengths; the worst spanned 1.3.",
    decision: "The screen spans at least three hand-lengths of movement whenever the camera frame allows, so precision holds whether you sit close or far.",
  },
  {
    big: "+12 px",
    title: "Forgiving targets",
    finding: "Adding 12 px of hit slop lifted hits by about 10% on the same data. Jitter sitting on a target's edge would make hover flicker.",
    decision: "Targets are 12 px bigger than they look, and hover stays sticky until 20 px, so the highlight never stutters.",
  },
  {
    big: "2.2 cm",
    title: "Ghosts at the edge",
    finding: "With a slouched user's hand at the bottom of the frame, landmarks glitched into two-frame fake pinches of 2.2–3.9 cm.",
    decision: "No new press while any landmark is near the image border. A fist, which also brings tips to about 3 cm, is caught by a curl check.",
  },
];

const sessions = [
  {
    label: "sitting",
    lines: [
      "reach: box 0.51 at (0.56, 0.42), x-stretch 1.35",
      "still: jitter 3.14 px → cutoff 0.72; 30 fps → predict 33 ms; flicker 0% → grace 200 ms",
      "pinch: press 5.6 cm, release 6.6 cm, open 10.2 cm, fist below 4.5 cm",
    ],
  },
  {
    label: "far",
    lines: [
      "reach: box 0.33 at (0.52, 0.47), x-stretch 1.35",
      "still: jitter 2.42 px → cutoff 0.86; 30 fps → predict 33 ms; flicker 2% → grace 219 ms",
      "pinch: press 5.3 cm, release 6.3 cm, open 11.0 cm, fist below 4.5 cm",
    ],
  },
  {
    label: "slouched",
    lines: [
      "reach: box 0.54 at (0.57, 0.39), x-stretch 1.35",
      "still: jitter 2.07 px → cutoff 0.96; 30 fps → predict 33 ms; flicker 0% → grace 200 ms",
      "pinch: press 4.0 cm, release 5.0 cm, open 9.5 cm, fist below 4.5 cm",
    ],
  },
];

const pipeline = [
  ["webcam", "Video stays on the device"],
  ["tracking/", "MediaPipe HandLandmarker, the only code that knows it exists"],
  ["input/", "Comfort-box mapping, One Euro filter, prediction, pinch state machine, loss handling"],
  ["ui/", "Hit-testing, hover, press, feedback and synthesized audio"],
  ["shell/ + games/", "Read one Hand contract: position, velocity, pinch, trail"],
];

const themes = [
  { name: "Paper", card: "#FFFFFF", ink: "rgb(30,35,48)", accent: "#2F7DF6", chrome: "#F3F2EE" },
  { name: "Night", card: "#1C212B", ink: "rgb(232,236,243)", accent: "#5B9DFF", chrome: "#11141B" },
  { name: "Classic", card: "#FBFCFD", ink: "rgb(74,80,89)", accent: "#23A6DE", chrome: "#E6E9EC" },
];

const stats = [
  ["165", "Unit tests across fifteen files, including replays of real calibration recordings through the exact calibration code."],
  ["107 KB", "Of application JavaScript. The hand tracker loads lazily, and there's no UI framework."],
  ["2", "Runtime dependencies: MediaPipe Tasks Vision and the Nunito variable font."],
  ["0", "Frames recorded or uploaded. Calibration recordings keep derived numbers only, never images."],
  ["3", "Failure cases with their own explanation screen: a missing camera, an insecure context or missing browser APIs. Mouse and touch run through the same Hand contract, so it's never a blank page."],
  ["33 ms", "Of prediction between detections at 30 fps, so the cursor doesn't step across refresh rates."],
];

function PinchDemo() {
  const [distance, setDistance] = useState(8);
  const [pressed, setPressed] = useState(false);
  const [armed, setArmed] = useState(true);
  const [clicks, setClicks] = useState(0);

  const strength = 1 - Math.min(Math.max((distance - PINCH.pressAt) / (PINCH.openAt - PINCH.pressAt), 0), 1);
  const toPct = (cm) => ((cm - 1) / (11 - 1)) * 100;

  const onChange = (e) => {
    const d = Number(e.target.value);
    setDistance(d);
    if (!armed) {
      if (d > PINCH.releaseAt) setArmed(true);
      return;
    }
    if (!pressed && d < PINCH.pressAt) setPressed(true);
    else if (pressed && d > PINCH.releaseAt) {
      setPressed(false);
      setClicks((c) => c + 1);
    }
  };

  const reacquire = () => {
    setPressed(false);
    setArmed(distance > PINCH.releaseAt);
  };

  const inBand = distance >= PINCH.pressAt && distance <= PINCH.releaseAt;
  const state = !armed ? "disarmed" : pressed ? (inBand ? "held" : "pressed") : inBand ? "closing" : "open";
  const stateText = {
    open: "Open hand. Moving the cursor.",
    closing: "Closing in, but not a press until 4.0 cm.",
    pressed: "Pressed. Adjust your aim, then open to select.",
    held: "Still held: the release needs 5.0 cm, so a wobble can't drop the click.",
    disarmed: "Disarmed. A hand that arrives pinched must open once before it can click.",
  }[state];

  return (
    <div className="wcs-pinch">
      <div className="wcs-pinch-stage" aria-hidden="true">
        <div className="wcs-pinch-cursor" style={{ "--squeeze": strength }} data-pressed={pressed} />
        <div className="wcs-pinch-fingers">
          <span className="wcs-tip" style={{ transform: `translateX(${-distance * 7}px)` }} />
          <span className="wcs-gap" style={{ width: `${distance * 14}px` }} />
          <span className="wcs-tip" style={{ transform: `translateX(${distance * 7}px)` }} />
        </div>
      </div>

      <label className="wcs-pinch-label" htmlFor="wcs-distance">
        Thumb to index distance, as the tracker sees it
        <span className="wcs-pinch-value">{distance.toFixed(1)} cm</span>
      </label>
      <div className="wcs-track">
        <span className="wcs-band" style={{ left: `${toPct(2.4)}%`, width: `${toPct(3.4) - toPct(2.4)}%` }} title="Real touching fingertips: 2.4–3.4 cm" />
        <span className="wcs-mark" style={{ left: `${toPct(PINCH.pressAt)}%` }}>press 4.0</span>
        <span className="wcs-mark wcs-mark-below" style={{ left: `${toPct(PINCH.releaseAt)}%` }}>release 5.0</span>
        <span className="wcs-mark" style={{ left: `${toPct(PINCH.openAt)}%` }}>open 9.0</span>
        <input
          id="wcs-distance"
          type="range"
          min="1"
          max="11"
          step="0.1"
          value={distance}
          onChange={onChange}
          aria-valuetext={`${distance.toFixed(1)} centimetres, ${state}`}
        />
      </div>

      <div className="wcs-pinch-readout">
        <span className={`wcs-state wcs-state-${pressed ? "pressed" : armed ? "open" : "disarmed"}`}>{pressed ? "pressed" : armed ? "armed" : "disarmed"}</span>
        <span className="wcs-pinch-text" aria-live="polite">{stateText}</span>
        <span className="wcs-clicks">{clicks} {clicks === 1 ? "click" : "clicks"}</span>
      </div>
      <div className="wcs-pinch-foot">
        <span className="ecs-label">The shaded band is where real touching fingertips read</span>
        <button type="button" className="wcs-reacquire" onClick={reacquire}>
          Lose and re-find the hand
        </button>
      </div>
    </div>
  );
}

export default function WebiiCaseStudy({ cs }) {
  useCaseStudyFonts("webii-fonts", FONT_HREF);

  return (
    <div className="ecs wcs">
      <header className="ecs-wrap ecs-hero">
        <div className="ecs-hero-top">
          <span className="ecs-label">{cs.badge}</span>
          <span className="ecs-label">{cs.title}</span>
        </div>
        <p className="ecs-typed wcs-kicker">
          <span className="wcs-dot" aria-hidden="true" /> Raise hand. Move cursor. Pinch.
        </p>
        <h2 className="ecs-h1">
          Your fingertips never <em>touch</em>.
        </h2>
        <div className="ecs-deck">
          <div className="ecs-deck-copy">
            <p className="ecs-say">
              Webii is a tiny console in the browser where your webcam is the controller: your index finger moves the cursor and a pinch clicks. The hard part wasn't the games. It was making a click out of a hand in mid-air, and every decision behind it came from recordings of real hands.
            </p>
            {cs.link && (
              <div className="wcs-cta-row">
                <a className="ecs-cta" href={cs.link} target="_blank" rel="noopener noreferrer">
                  Try it live <span aria-hidden="true">→</span>
                </a>
                <span className="ecs-label">Needs a webcam · desktop recommended</span>
              </div>
            )}
          </div>
          <dl className="ecs-facts">
            <div>
              <dt>Role</dt>
              <dd>{cs.role}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{cs.year}</dd>
            </div>
            <div>
              <dt>Built with</dt>
              <dd>{cs.stack}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>Nunito Variable</dd>
            </div>
          </dl>
        </div>
        <figure className="wcs-hero-shot">
          <img src={menuImg} alt="Webii's console menu with Games, Portfolio and Settings tiles; a hand cursor hovers above and a camera preview in the corner shows the tracked hand." />
          <figcaption className="ecs-label">The console, driven by a tracked hand · camera preview bottom right</figcaption>
        </figure>
      </header>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="wcs-pinch-h">
        <span className="ecs-label">The discovery</span>
        <h3 id="wcs-pinch-h" className="ecs-h2">A pinch the camera can't see.</h3>
        <div className="ecs-two">
          <p className="ecs-say">
            The obvious design is to click when thumb and index touch. But the landmarks a hand tracker follows never quite meet. When real fingertips touched, recordings still put them <strong>2.4 to 3.4 cm apart</strong>.
          </p>
          <p className="ecs-prose">
            So Webii clicks on a gap it can actually see, with two thresholds instead of one. Closing below 4.0 cm presses; opening past 5.0 cm releases. The space between them is hysteresis, which stops a hovering hand from flickering between states. The cursor squeezes as you close in, so you can feel how near a click is before it happens.
          </p>
        </div>
        <PinchDemo />
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="wcs-evidence-h">
        <span className="ecs-label">Evidence, not guesses</span>
        <h3 id="wcs-evidence-h" className="ecs-h2">Six decisions, each with its receipt.</h3>
        <p className="ecs-prose ecs-lead">
          Every rule in the input layer came from a measurement: calibration recordings, click tests and replays of both. The code keeps the findings next to the numbers they justify.
        </p>
        <div className="wcs-findings">
          {findings.map((f) => (
            <article key={f.title} className="wcs-finding">
              <span className="wcs-big">{f.big}</span>
              <h4>{f.title}</h4>
              <p className="wcs-found">{f.finding}</p>
              <p className="wcs-decided">
                <span className="ecs-label">So</span>
                {f.decision}
              </p>
            </article>
          ))}
        </div>
        <blockquote className="ecs-pull wcs-pull">
          A missed pinch is recoverable. A false click is not.
          <cite>The rule behind every threshold · from the calibration code</cite>
        </blockquote>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="wcs-calib-h">
        <span className="ecs-label">Onboarding is calibration</span>
        <h3 id="wcs-calib-h" className="ecs-h2">Same person, three postures, three controllers.</h3>
        <div className="wcs-calib">
          <figure className="wcs-shot">
            <img src={calibrationImg} alt="Calibration step 'Raise your hand' with a camera view of a hand making a fist and a progress ring on the fingertip." loading="lazy" />
            <figcaption className="ecs-label">The first-run setup teaches the gesture and measures you while it does</figcaption>
          </figure>
          <div className="ecs-stack">
            <p className="ecs-prose">
              Setup watches how far you comfortably reach, how still your hand is and how you pinch. It then retunes the mapping box, the filter and the thresholds for you. These are real calibration logs from one person in three postures. <strong>Bad data never produces bad tuning</strong>: a parameter the session can't justify keeps its current value.
            </p>
            <div className="wcs-receipts">
              {sessions.map((s) => (
                <div key={s.label} className="wcs-receipt">
                  <span className="wcs-receipt-label">{s.label}</span>
                  {s.lines.map((line) => (
                    <code key={line}>{line}</code>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <figure className="wcs-shot wcs-shot-wide">
          <img src={debugImg} alt="Debug panel over the menu showing live readouts: state tracking, detection rate, pinch distance 8.4 cm, armed, plus tuning sliders." loading="lazy" />
          <figcaption className="ecs-label">Press ` for the debug panel: every number the input layer uses, live, with sliders to tune it</figcaption>
        </figure>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="wcs-console-h">
        <span className="ecs-label">The console</span>
        <h3 id="wcs-console-h" className="ecs-h2">Big targets, friendly type, real games.</h3>
        <div className="ecs-two">
          <p className="ecs-prose">
            A cursor driven by a hand is less precise than a mouse, so the shell is built around it: large rounded tiles, one soft variable sans everywhere, spring easing and a status pill that says what the camera sees. <strong>The previews on each tile are the real games</strong>, played in attract mode by a scripted hand.
          </p>
          <p className="ecs-prose">
            Three games test different skills. Catch is continuous position, Slice is speed and direction, and Memory Trace is precision. Memory Trace scores with a single accuracy number: F1 of coverage and precision.
          </p>
        </div>
        <div className="wcs-gallery">
          <figure className="wcs-shot wcs-g-a">
            <img src={nightShelfImg} alt="Games shelf in the Night theme with live previews of Catch, Slice and Memory Trace." loading="lazy" />
            <figcaption className="ecs-label">Night theme · tile previews run each game in attract mode</figcaption>
          </figure>
          <figure className="wcs-shot wcs-g-b">
            <img src={memoryChannelImg} alt="Memory Trace channel page with a triangle preview, a description and Back and Start buttons; the hand cursor hovers nearby." loading="lazy" />
            <figcaption className="ecs-label">Every channel opens to a preview before it starts</figcaption>
          </figure>
          <figure className="wcs-shot wcs-g-c">
            <img src={catchImg} alt="Catch in play: shapes fall towards a white bowl; a timer shows 22 seconds left." loading="lazy" />
            <figcaption className="ecs-label">Catch</figcaption>
          </figure>
          <figure className="wcs-shot wcs-g-d">
            <img src={sliceImg} alt="Slice in play: an orange and a blue square in flight, score 1, timer 42." loading="lazy" />
            <figcaption className="ecs-label">Slice</figcaption>
          </figure>
          <figure className="wcs-shot wcs-g-e">
            <img src={memoryResultImg} alt="Memory Trace result: a triangle drawn over a target square, coloured by accuracy, scored 38% accurate." loading="lazy" />
            <figcaption className="ecs-label">An honest 38%: the target was a square</figcaption>
          </figure>
          <figure className="wcs-shot wcs-g-f">
            <img src={settingsImg} alt="Settings scene on the Theme tab with Paper, Night and Classic options; the hand cursor hovers Classic." loading="lazy" />
            <figcaption className="ecs-label">Settings · the hand hovering the Classic theme</figcaption>
          </figure>
        </div>
        <div className="wcs-themes">
          {themes.map((t) => (
            <div
              key={t.name}
              className="wcs-theme"
              style={{ "--t-chrome": t.chrome, "--t-card": t.card, "--t-ink": t.ink, "--t-accent": t.accent }}
            >
              <div className="wcs-theme-card">
                <span className="wcs-theme-ring" />
                <span className="wcs-theme-name">{t.name}</span>
              </div>
              <small>
                {t.chrome} · {t.card} · {t.accent}
              </small>
            </div>
          ))}
        </div>
        <figure className="wcs-shot wcs-shot-wide">
          <img src={portfolioImg} alt="Portfolio channel showing a preview video of the Ashen.IT portfolio with Back and Start buttons." loading="lazy" />
          <figcaption className="ecs-label">The Portfolio channel plays a recorded preview, then opens this site</figcaption>
        </figure>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="wcs-arch-h">
        <span className="ecs-label">Architecture</span>
        <h3 id="wcs-arch-h" className="ecs-h2">One contract between the hand and everything else.</h3>
        <ol className="wcs-pipe">
          {pipeline.map(([name, text], i) => (
            <li key={name}>
              <span className="wcs-pipe-n">{i + 1}</span>
              <code>{name}</code>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className="ecs-two">
          <p className="ecs-prose">
            <strong>Nothing outside tracking/ knows MediaPipe exists.</strong> Swapping the tracker would touch one folder.
          </p>
          <p className="ecs-prose">
            <strong>Nothing in shell/ or games/ reads landmarks.</strong> They read one Hand contract, so the mouse fallback and the scripted test hands plug into the same interface as a real hand.
          </p>
        </div>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="wcs-hood-h">
        <span className="ecs-label">Under the hood</span>
        <h3 id="wcs-hood-h" className="ecs-h2">Small, local, tested.</h3>
        <div className="ecs-hood">
          {stats.map(([big, text]) => (
            <div key={big} className="ecs-hood-item">
              <span className="ecs-big">{big}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {cs.link && (
        <div role="region" className="ecs-wrap ecs-end" aria-labelledby="wcs-end-h">
          <p className="ecs-typed wcs-kicker">
            <span className="wcs-dot" aria-hidden="true" /> Hand tracked
          </p>
          <h3 id="wcs-end-h" className="ecs-h1">
            Raise a hand and <em>try it</em>.
          </h3>
          <a className="ecs-cta ecs-cta-big" href={cs.link} target="_blank" rel="noopener noreferrer">
            Open Webii <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </div>
  );
}
