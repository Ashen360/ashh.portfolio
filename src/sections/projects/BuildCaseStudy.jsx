import "./EditorialCaseStudy.css";
import { useEffect, useState } from "react";
import { useCaseStudyFonts } from "../../hooks/useCaseStudyFonts";

import introImg from "../../assets/projects/build/00-intro.webp";
import cardImg from "../../assets/projects/build/01-card.webp";
import valvesImg from "../../assets/projects/build/02-valves.webp";
import ladderImg from "../../assets/projects/build/03-ladder.webp";
import basicImg from "../../assets/projects/build/04-basic.webp";
import webImg from "../../assets/projects/build/05-web.webp";
import denseImg from "../../assets/projects/build/06-dense.webp";
import tokensImg from "../../assets/projects/build/07-tokens.webp";
import finalImg from "../../assets/projects/build/08-final.webp";
import phoneCardImg from "../../assets/projects/build/m01.webp";
import phoneValvesImg from "../../assets/projects/build/m02.webp";
import phoneBasicImg from "../../assets/projects/build/m04.webp";
import phoneTokensImg from "../../assets/projects/build/m07.webp";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400&display=swap";

const OPENING = "HELLO, MACHINE.";

const strip = [
  { id: "ecs-thesis", label: "00 Opening", src: introImg, pos: "50% 50%" },
  { id: "ecs-era-01", label: "01 Card", src: cardImg, pos: "78% 50%" },
  { id: "ecs-era-02", label: "02 Valves", src: valvesImg, pos: "18% 60%" },
  { id: "ecs-era-03", label: "03 Ladder", src: ladderImg, pos: "30% 50%" },
  { id: "ecs-era-04", label: "04 Prompt", src: basicImg, pos: "22% 80%" },
  { id: "ecs-era-05", label: "05 Web", src: webImg, pos: "60% 50%" },
  { id: "ecs-era-06", label: "06 Everywhere", src: denseImg, pos: "30% 60%" },
  { id: "ecs-era-07", label: "07 Tokens", src: tokensImg, pos: "30% 70%" },
  { id: "ecs-finale", label: "— Your turn", src: finalImg, pos: "50% 50%" },
];

const hellos = [
  ["card", "| o . . . . |\n| . o . . . |\n| . . o o . |\n(binary punched as holes)"],
  ["binary", "01001000 01000101\n01001100 01001100 01001111"],
  ["assembly", "MOV AX, MSG\nMOV AH, 09h\nINT 21h"],
  ["fortran", "      WRITE(6,10)\n   10 FORMAT(\"HELLO\")"],
  ["basic", "10 PRINT \"HELLO\"\n20 END"],
  ["c", "printf(\"HELLO\");"],
  ["python", "print(\"HELLO\")"],
  ["javascript", "console.log(\"HELLO\")"],
];

const messages = [
  ["01", "card holes"],
  ["02", "01001000 → H"],
  ["03", "the live rung"],
  ["04", "10 PRINT \"HELLO\""],
  ["05", "<h1>HELLO</h1>"],
  ["06", "GET /hello → 200 OK"],
  ["07", "[HELLO] [,] [MACHINE] [.]"],
  ["—", "your words"],
];

const eras = [
  {
    id: "ecs-era-01",
    era: "01 · Before code · 1837–1843",
    verb: "Drag.",
    title: "A punch card that says hello.",
    body: [
      "The card is real 3D geometry, extruded in Three.js with its corner clipped. Its holes are not decoration. ",
      <b key="b">Each of its 15 columns is one character of HELLO, MACHINE. in 8-bit ASCII</b>,
      ", the same line the intro types. It turns by drag or arrow keys, and without WebGL a flat card draws the same holes.",
    ],
    colors: ["#EDE6D6", "#231F16", "#9C7A3C"],
    theme: { bg: "#EDE6D6", fg: "#231F16", acc: "#9C7A3C", sub: "#6E6552" },
    img: cardImg,
    alt: "Chapter 01: a cream page titled 'Before code, there was a card.' beside a 3D punched card.",
    caption: "this card reads HELLO, MACHINE.",
  },
  {
    id: "ecs-era-02",
    era: "02 · Machines learn · 1943–1949",
    verb: "Switch.",
    title: "Eight valves, one byte of memory.",
    body: [
      "Every tube is a switch, worth 128 down to 1. A readout turns the pattern into a number and a character, and the chapter asks you to spell H. ",
      <b key="b">Set 01001000 and the Message strip lights up</b>,
      ". A faint scanline overlay switches on here, and comes back once more for the terminal.",
    ],
    colors: ["#131209", "#EFE9D8", "#E8A33D"],
    theme: { bg: "#131209", fg: "#EFE9D8", acc: "#E8A33D", sub: "#9A9587" },
    img: valvesImg,
    alt: "Chapter 02: eight amber vacuum tubes, two lit, above a readout of 01001000 = 72 = H.",
    caption: "01001000 = 72 = H",
    flip: true,
  },
  {
    id: "ecs-era-03",
    era: "03 · We invent languages · 1954–1970",
    verb: "Scrub.",
    title: "One slider, eight ways to say HELLO.",
    body: [
      "The signature control. Drag it, click a rung, or use the arrow, Home and End keys. ",
      <b key="b">Screen readers hear the language name</b>,
      ", not just a number, and the Message strip follows whichever rung is live.",
    ],
    colors: ["#E9EEE3", "#1F241B", "#2B4C7E"],
    theme: { bg: "#E9EEE3", fg: "#1F241B", acc: "#2B4C7E", sub: "#566050" },
    img: ladderImg,
    alt: "Chapter 03: a pale green page titled 'One idea. Many languages.' with a code panel above an eight-step slider.",
    caption: "rung 4 of 8 · fortran",
  },
  {
    id: "ecs-era-04",
    era: "04 · The personal computer · 1977–1985",
    verb: "Type.",
    title: "The page becomes the terminal, and the terminal works.",
    body: [
      "The whole site turns green on black. Below the headline sits a small BASIC interpreter with ",
      <b key="b">variables, arithmetic and FOR…NEXT loops</b>,
      ", plus LIST, RUN, NEW and HELP. The hint commands are clickable, ↑ and ↓ recall history, and runaway loops stop after 2,000 steps.",
    ],
    colors: ["#0B0F0C", "#33FF66", "#1F7A3B"],
    theme: { bg: "#0B0F0C", fg: "#33FF66", acc: "#33FF66", sub: "#2BA852" },
    img: basicImg,
    alt: "Chapter 04: a green phosphor terminal running a FOR loop that prints HELLO 1, HELLO 2, HELLO 3.",
    caption: "10 FOR I=1 TO 3 · 20 PRINT \"HELLO \";I · 30 NEXT I · RUN",
    flip: true,
  },
  {
    id: "ecs-era-05",
    era: "05 · The web · 1989–1999",
    verb: "Fly.",
    title: "A document becomes a network of ninety nodes.",
    body: [
      "Flat blue panes are documents, grey cubes are servers, small brass spheres are people. The nodes reuse earlier chapters' colours: ",
      <b key="b">documents take the ladder's blue, people take the punch card's brass</b>,
      ". The accent is #0000EE, the browser's default unvisited-link blue. Scrolling passes straight through; zoom is a pinch, Ctrl + scroll, or the +/– buttons.",
    ],
    colors: ["#F4F4F2", "#111111", "#0000EE"],
    theme: { bg: "#F4F4F2", fg: "#111111", acc: "#0000EE", sub: "#5E5E5E" },
    img: webImg,
    alt: "Chapter 05: a 3D network of blue panels, grey cubes and gold spheres to the right of the headline 'A document becomes a network.'",
    caption: "drag to turn · pinch, ctrl + scroll or +/– to fly in",
    wide: true,
  },
  {
    id: "ecs-era-06",
    era: "06 · Software everywhere · 2001–2015",
    verb: "Scan.",
    title: "The only chapter with nothing to hold.",
    body: [
      "Ten milestones in a hairline grid, from Wikipedia to Kubernetes, arriving in a quick stagger. After four chapters of physical objects the page goes flat and dense, ",
      <b key="b">which suits an era when software stopped being something you could hold</b>,
      ".",
    ],
    colors: ["#F5F5F3", "#111111", "#F05133"],
    theme: { bg: "#F5F5F3", fg: "#111111", acc: "#F05133", sub: "#5E5E5E" },
    img: denseImg,
    alt: "Chapter 06: an off-white page titled 'Software stops being a product.' above a five-by-two grid of milestones.",
    caption: "ten cells · 2001 to 2015",
    flip: true,
  },
  {
    id: "ecs-era-07",
    era: "07 · Language turns around · 2012–now",
    verb: "Tap.",
    title: "The machine starts learning our language.",
    body: [
      "Sixteen words drift loose, then settle into rows. ",
      <b key="b">Tap one, or arrow through them, and it links to its neighbours</b>,
      " while the caption names what comes next. For seventy years people learned to speak like machines; here the machine learns to read like us.",
    ],
    colors: ["#0A0A0A", "#F2F0EA", "#C9C4B4"],
    theme: { bg: "#0A0A0A", fg: "#F2F0EA", acc: "#C9C4B4", sub: "#8A8880" },
    img: tokensImg,
    alt: "Chapter 07: a black page with a field of monospaced words; 'machine' is boxed and linked to 'quick' and 'learns'.",
    caption: "“machine” → what comes next: “learns”",
  },
];

const palettes = [
  ["Open", "#050505", "#EDEDED", "#EDEDED", "#7A7A7A"],
  ["01", "#EDE6D6", "#231F16", "#9C7A3C", "#7A705C"],
  ["02", "#131209", "#EFE9D8", "#E8A33D", "#8A8578"],
  ["03", "#E9EEE3", "#1F241B", "#2B4C7E", "#5C6653"],
  ["04", "#0B0F0C", "#33FF66", "#33FF66", "#1F7A3B"],
  ["05", "#F4F4F2", "#111111", "#0000EE", "#666666"],
  ["06", "#F5F5F3", "#111111", "#F05133", "#6B6B6B"],
  ["07", "#0A0A0A", "#F2F0EA", "#C9C4B4", "#6B6B66"],
  ["Close", "#050505", "#EDEDED", "#EDEDED", "#7A7A7A"],
];

const revisions = [
  ["The punch card", "Random holes, different every visit", "Every hole spells HELLO, MACHINE. in ASCII"],
  ["Chapter 02", "Twelve decorative tubes to watch", "Eight switches that set one byte"],
  ["The through-line", "Implied, never shown", "A Message strip that re-encodes HELLO per era"],
  ["The 3D web", "Captured the scroll wheel across a stage 92% of the screen tall", "Page scrolls freely; zoom is deliberate"],
  ["Hidden promises", "“10 FOR I=1 TO 3” failed; “tap a word” did nothing", "FOR…NEXT runs; tapping a word explains it"],
  ["History", "Credited Grace Hopper with the stored program", "Von Neumann's EDVAC report and the Manchester Baby; Hopper moves to compilers"],
];

const stats = [
  ["55 KB", "Hand-written CSS and JavaScript across fourteen files. No framework, no build step."],
  ["1", "Dependency: Three.js, loaded from a CDN for the punch card and the network. The rest is plain DOM and Canvas 2D."],
  ["3", "Render loops, each paused by an IntersectionObserver as soon as its chapter leaves the screen."],
  ["1.6×", "Maximum pixel ratio for every canvas: sharp on dense screens without overloading the GPU."],
  ["0", "Idle animations with reduced motion on. The card and network stop spinning, the valves stop pulsing, the words stop drifting."],
  ["2D", "Fallback without WebGL. A flat card with the same holes replaces the 3D one, and the network explains its absence."],
];

const phones = [
  { src: phoneCardImg, label: "01 · card", alt: "Phone view of the punch card chapter with the Message strip at the bottom." },
  { src: phoneValvesImg, label: "02 · valves", alt: "Phone view of the eight valves set to spell H." },
  { src: phoneBasicImg, label: "04 · prompt", alt: "Phone view of the BASIC terminal running a FOR loop." },
  { src: phoneTokensImg, label: "07 · tokens", alt: "Phone view of the token field with one word selected." },
];

function useTypedLine(text) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let timer = null;
    const step = () => {
      setShown(text.slice(0, i));
      i += 1;
      if (i <= text.length) timer = window.setTimeout(step, 70);
    };
    timer = window.setTimeout(step, 250);
    return () => window.clearTimeout(timer);
  }, [text]);
  return shown;
}

function FinaleDemo() {
  const [value, setValue] = useState("teach it to listen");
  const text = value.trim() || "teach it to listen";
  const tokens = text.split(/\s+/);
  const seed = (Math.sin(text.length) * 100) | 0;

  return (
    <div className="ecs-machine">
      <label className="ecs-machine-q" htmlFor="ecs-teach">
        What would you teach the machine?
      </label>
      <input
        id="ecs-teach"
        className="ecs-machine-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={60}
        autoComplete="off"
        spellCheck="false"
      />
      <ol className="ecs-stages" aria-live="polite">
        <li>
          <span className="ecs-stage-k">1 · letters</span>
          <span className="ecs-stage-v ecs-st-letters">{text.split("").join(" ")}</span>
        </li>
        <li>
          <span className="ecs-stage-k">2 · tokens</span>
          <span className="ecs-stage-v ecs-st-tokens">
            {tokens.map((tok, i) => (
              <span key={i}>[{tok}]</span>
            ))}
          </span>
        </li>
        <li>
          <span className="ecs-stage-k">3 · vector</span>
          <span className="ecs-stage-v ecs-st-vector">
            <span>vector( {seed} ... )</span>
            {tokens.map((_, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </span>
        </li>
        <li>
          <span className="ecs-stage-k">4 · sentence</span>
          <span className="ecs-stage-v ecs-st-sentence">{text}</span>
        </li>
      </ol>
      <p className="ecs-machine-close">THE NEXT CHAPTER IS YOURS.</p>
    </div>
  );
}

export default function BuildCaseStudy({ cs }) {
  useCaseStudyFonts("build-fonts", FONT_HREF);
  const typed = useTypedLine(OPENING);

  return (
    <div className="ecs">
      <header className="ecs-wrap ecs-hero">
        <div className="ecs-hero-top">
          <span className="ecs-label">{cs.badge}</span>
          <span className="ecs-label">{cs.title}</span>
        </div>
        <p className="ecs-typed" aria-label={OPENING}>
          <span aria-hidden="true">{typed}</span>
          <span className="ecs-cursor" aria-hidden="true" />
        </p>
        <h2 className="ecs-h1">
          A history of programming, built out of the things it <em>describes</em>.
        </h2>
        <div className="ecs-deck">
          <div className="ecs-deck-copy">
            <p className="ecs-say">
              BUILD tells the story of programming as the story of people learning to talk to machines. Every chapter is made from the medium of its era: you turn a punched card that spells a greeting, set a byte with vacuum tubes, program a working BASIC prompt and fly through a 3D web. Then the site hands you the keyboard.
            </p>
            {cs.link && (
              <a className="ecs-cta" href={cs.link} target="_blank" rel="noopener noreferrer">
                Visit the live site <span aria-hidden="true">→</span>
              </a>
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
              <dd>Fraunces, Inter, IBM Plex Mono</dd>
            </div>
          </dl>
        </div>
        <div className="ecs-strip" role="navigation" aria-label="The nine screens of the site">
          {strip.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{ backgroundImage: `url(${s.src})`, backgroundPosition: s.pos }}
            >
              <span>{s.label}</span>
            </a>
          ))}
        </div>
        <div className="ecs-strip-note">
          <span className="ecs-label">One scroll, nine palettes</span>
          <span className="ecs-label">Screens captured from the live build</span>
        </div>
      </header>

      <div role="region" className="ecs-wrap ecs-thesis" id="ecs-thesis" aria-labelledby="ecs-thesis-h">
        <span className="ecs-label">The idea</span>
        <h3 id="ecs-thesis-h" className="ecs-h2">Every screen says the same sentence.</h3>
        <div className="ecs-two">
          <div className="ecs-stack">
            <p className="ecs-say">
              The site opens on a black screen and types two words: <code>HELLO, MACHINE.</code> That greeting is the whole story. Every chapter after it repeats the sentence in the language of its time.
            </p>
            <p className="ecs-prose">
              A history of programming could easily become a timeline of inventions. BUILD holds together because every interaction is the same act: <strong>a person saying something to a machine</strong>. The punch card spells the greeting in holes, the valves spell its first letter in bits, and the finale asks what you would say.
            </p>
          </div>
          <blockquote className="ecs-pull">
            The instruction never changes. Only how humans are asked to say it does.
            <cite>Chapter 03 · on screen</cite>
          </blockquote>
        </div>

        <div className="ecs-hellos" aria-label="The word HELLO in the eight forms of the language ladder">
          {hellos.map(([label, code], i) => (
            <div key={label} className="ecs-hello">
              <div className="ecs-hello-head">
                <span className="ecs-label">{label}</span>
                <span className="ecs-hello-n">{i + 1}/8</span>
              </div>
              <pre>{code}</pre>
            </div>
          ))}
        </div>
        <div className="ecs-strip-note">
          <span className="ecs-label">The ladder's eight rungs, exactly as the site renders them</span>
          <span className="ecs-label">The site shows one at a time</span>
        </div>

        <div className="ecs-message">
          <div className="ecs-stack">
            <span className="ecs-label">Making the thread visible</span>
            <p className="ecs-prose">
              A small <strong>Message</strong> strip follows you through the site and re-encodes HELLO for whichever era fills the screen. At the end it carries your own words.
            </p>
          </div>
          <ol className="ecs-message-list">
            {messages.map(([n, v]) => (
              <li key={n}>
                <span className="ecs-hello-n">{n}</span>
                <code>{v}</code>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div role="region" aria-labelledby="ecs-eras-h">
        <div className="ecs-wrap ecs-eras-head">
          <div>
            <span className="ecs-label">Seven eras, seven media</span>
            <h3 id="ecs-eras-h" className="ecs-h2">The verb changes with the century.</h3>
          </div>
          <p className="ecs-prose">
            A timeline could have reused one component and swapped the content. BUILD changes what your hands do in each chapter, and the palette changes with it: as each section takes over the screen, the whole page crossfades to that era's colours in 900 milliseconds.
          </p>
        </div>

        {eras.map((e) => (
          <article
            key={e.id}
            id={e.id}
            className={`ecs-band${e.flip ? " flip" : ""}${e.wide ? " wide" : ""}`}
            style={{
              "--era-bg": e.theme.bg,
              "--era-fg": e.theme.fg,
              "--era-acc": e.theme.acc,
              "--era-sub": e.theme.sub,
            }}
          >
            <div className="ecs-wrap ecs-band-grid">
              <div className="ecs-band-copy">
                <div className="ecs-band-top">
                  <span className="ecs-era">{e.era}</span>
                  <span className="ecs-verb">{e.verb}</span>
                </div>
                <h4>{e.title}</h4>
                <p>{e.body}</p>
                <div className="ecs-swatches">
                  {e.colors.map((c) => (
                    <i key={c} style={{ "--c": c }}>
                      {c.slice(1)}
                    </i>
                  ))}
                </div>
              </div>
              <figure className="ecs-shot">
                <img src={e.img} alt={e.alt} loading="lazy" />
                <figcaption>{e.caption}</figcaption>
              </figure>
            </div>
          </article>
        ))}
      </div>

      <div role="region" className="ecs-wrap ecs-score" aria-labelledby="ecs-score-h">
        <span className="ecs-label">The colour score</span>
        <h3 id="ecs-score-h" className="ecs-h2">Nine palettes, one page, no page loads.</h3>
        <div className="ecs-score-grid">
          {palettes.map(([name, bg, fg, acc, sub]) => (
            <div
              key={name}
              className="ecs-chip"
              style={{ "--era-bg": bg, "--era-fg": fg, "--era-acc": acc, "--era-sub": sub }}
            >
              <div>
                <small>{name}</small>
                <span className="ecs-aa">Aa</span>
              </div>
              <div>
                <span className="ecs-dot" />
                <small>
                  {bg.slice(1)}
                  <br />
                  {acc.slice(1)}
                </small>
              </div>
            </div>
          ))}
        </div>
        <div className="ecs-two">
          <p className="ecs-prose">
            The palettes are nine sets of the same four tokens: <strong>background, text, accent, secondary</strong>. Whichever chapter fills most of the viewport sets the era on the page. Card stock gives way to valve amber, pale green, phosphor and flat off-white, then returns to the black the site began with.
          </p>
          <p className="ecs-prose">
            The frame stays constant: an era label top-left, labelled dots on the right, a progress bar on phones and the Message strip. They change colour with each era, so however much the page changes around you, you always know where you are.
          </p>
        </div>
      </div>

      <div role="region" className="ecs-wrap ecs-section" id="ecs-finale" aria-labelledby="ecs-voices-h">
        <span className="ecs-label">Typography</span>
        <h3 id="ecs-voices-h" className="ecs-h2">Two voices, and a translator.</h3>
        <div className="ecs-spec">
          <div>
            <span className="ecs-label">Human · Fraunces</span>
            <span className="ecs-spec-h">Before code, there was a card.</span>
          </div>
          <div>
            <span className="ecs-label">Machine · IBM Plex Mono</span>
            <span className="ecs-spec-m">
              01 — 1837 to 1843
              <br />
              READY.
            </span>
          </div>
          <div>
            <span className="ecs-label">Explainer · Inter</span>
            <span className="ecs-spec-p">The Analytical Engine was never finished. But the idea survived on punched cards.</span>
          </div>
        </div>

        <div className="ecs-ending">
          <div className="ecs-stack">
            <span className="ecs-label">The finale</span>
            <h4 className="ecs-h3">It ends by turning your words into the machine's, then back into yours.</h4>
            <p className="ecs-prose">
              The last screen asks <code>What would you teach the machine?</code> Whatever you type is broken into letters, then bracketed tokens, then a vector, and the final frame sets it down <strong>in the human serif</strong>. The two typefaces that ran through the site hand over to each other in one sentence, and it's yours.
            </p>
            <p className="ecs-prose">Try it here. This panel lays the four stages side by side; the site plays them in sequence.</p>
          </div>
          <FinaleDemo />
        </div>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="ecs-rev-h">
        <span className="ecs-label">Second draft</span>
        <h3 id="ecs-rev-h" className="ecs-h2">What the redesign changed.</h3>
        <p className="ecs-prose ecs-lead">
          The first version had the idea but not the evidence. The redesign asked one question of every chapter: does this show the sentence being spoken, or just talk about it?
        </p>
        <div className="ecs-rev" role="table" aria-label="Before and after the redesign">
          <div className="ecs-rev-row ecs-rev-head" role="row">
            <span role="columnheader">Where</span>
            <span role="columnheader">First draft</span>
            <span role="columnheader">Now</span>
          </div>
          {revisions.map(([where, before, after]) => (
            <div key={where} className="ecs-rev-row" role="row">
              <span role="rowheader">{where}</span>
              <span role="cell" className="ecs-rev-before">{before}</span>
              <span role="cell">{after}</span>
            </div>
          ))}
        </div>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="ecs-phones-h">
        <span className="ecs-label">At 390 pixels</span>
        <h3 id="ecs-phones-h" className="ecs-h2">It still works in your hand.</h3>
        <div className="ecs-phones">
          {phones.map((p) => (
            <figure key={p.label}>
              <img src={p.src} alt={p.alt} loading="lazy" />
              <figcaption className="ecs-label">{p.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div role="region" className="ecs-wrap ecs-section" aria-labelledby="ecs-hood-h">
        <span className="ecs-label">Under the hood</span>
        <h3 id="ecs-hood-h" className="ecs-h2">Built small, on purpose.</h3>
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
        <div role="region" className="ecs-wrap ecs-end" aria-labelledby="ecs-end-h">
          <p className="ecs-typed">
            <span>READY.</span>
            <span className="ecs-cursor" aria-hidden="true" />
          </p>
          <h3 id="ecs-end-h" className="ecs-h1">
            Now read it the way it was <em>built</em> to be read.
          </h3>
          <a className="ecs-cta ecs-cta-big" href={cs.link} target="_blank" rel="noopener noreferrer">
            Enter the site <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </div>
  );
}
