import "./Projects.css";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import HelloMachineCaseStudy from "./HelloMachineCaseStudy";
import WebiiCaseStudy from "./WebiiCaseStudy";

import project1Img from "../../assets/projects/wordweaver/cover.jpg";
import project2Img from "../../assets/projects/sining-filipino/cover.jpg";
import helloMachineImg from "../../assets/projects/hello-machine/01-card.webp";
import webiiImg from "../../assets/projects/webii/menu.webp";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const caseStudies = {
  machinelanguage: {
    layout: "editorial",
    link: "https://ashen360.github.io/hello-machine/",
    heroImage: helloMachineImg,
    badge: "Case study · Live site",
    title: "Hello, Machine",
    role: "Concept, Design & Development — Personal project",
    client: "Personal project",
    year: "2026",
    stack: "HTML, CSS, JavaScript, Three.js",
    heroGradient:
      "linear-gradient(135deg, #231F16 0%, #9C7A3C 55%, #EDE6D6 100%)",
    description:
      "An interactive history of programming, told as the history of humans learning to talk to machines. Seven chapters and a finale run from 1837 to large language models, and each one lets you handle its era's medium: a Three.js punched card whose holes spell HELLO, MACHINE., eight valve switches that set one byte, an abstraction-ladder slider, a working mini-BASIC interpreter with FOR loops, a 90-node web graph and a tappable token field. The whole page re-skins itself per era through one data attribute and CSS custom properties. It is 1,314 lines of plain HTML, CSS and vanilla JavaScript with no build step, and one shared IntersectionObserver helper keeps every render loop idle while it is off screen.",
    palette: ["#231F16", "#9C7A3C", "#EDE6D6", "#33FF66"],
    display: "The next chapter is yours.",
    body: "A literary serif for chapter titles, a neutral sans for the narrative, and a monospace for terminals, captions and code — three voices that shift in color as the page moves from punched card stock to phosphor green.",
    fonts: "Display — Fraunces · Body — Inter · Code — IBM Plex Mono",
    screens: [
      {
        type: "gradient",
        src: "linear-gradient(160deg, #231F16, #9C7A3C)",
        alt: "Punched card chapter placeholder",
        caption: "Chapter 01 – draggable punched card",
      },
      {
        type: "gradient",
        src: "linear-gradient(200deg, #0B0F0C, #1F6B35)",
        alt: "BASIC terminal chapter placeholder",
        caption: "Chapter 04 – working mini-BASIC terminal",
      },
    ],
  },
  webii: {
    layout: "editorial",
    link: "https://ashen360.github.io/Webii/",
    heroImage: webiiImg,
    badge: "Case study · Live site",
    title: "Webii",
    role: "Design & Development — Personal experiment",
    client: "Personal project",
    year: "2026",
    stack: "TypeScript, MediaPipe, Canvas 2D, Web Audio, Vite, Vitest",
    heroGradient:
      "linear-gradient(135deg, #1E2330 0%, #2F7DF6 60%, #12A594 100%)",
    description:
      "A tiny browser console where the webcam is the controller: your index finger moves the cursor and a thumb–index pinch is the click. Hand tracking runs locally through MediaPipe, and the signal passes through a comfort-box mapping, a One Euro filter, prediction and pinch hysteresis before it reaches the interface. Onboarding doubles as calibration, and three Canvas 2D games share one framework with seeded randomness, saved best scores and an attract mode in which a scripted hand plays the real game. There is no UI framework and there are only two runtime dependencies, with 107 KB of JavaScript plus a lazy-loaded tracker. It needs a webcam and a secure context, and it works best on desktop.",
    palette: ["#F3F2EE", "#1E2330", "#2F7DF6", "#FF6B4A"],
    display: "Raise hand. Move cursor. Pinch.",
    body: "A soft, rounded variable sans used everywhere, with big targets and spring easing, so a cursor driven by a hand feels friendly rather than fiddly.",
    fonts: "Display & Body — Nunito Variable",
    screens: [
      {
        type: "gradient",
        src: "linear-gradient(160deg, #F3F2EE, #2F7DF6)",
        alt: "Menu screen placeholder",
        caption: "Menu – Games, Portfolio and Settings channels",
      },
      {
        type: "gradient",
        src: "linear-gradient(200deg, #11141B, #5B9DFF)",
        alt: "Game screen placeholder",
        caption: "Night theme – games shelf with attract mode",
      },
    ],
  },
};

export default function Projects() {
  const [activeCaseStudy, setActiveCaseStudy] = useState(null);
  const [isCaseStudyLoading, setIsCaseStudyLoading] = useState(false);
  const isOverlayOpen = Boolean(activeCaseStudy) || isCaseStudyLoading;

  const loadTimer = useRef(null);
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const scrollRef = useRef(null);

  const project1Ref = useRef(null);
  const project2Ref = useRef(null);
  const project3Ref = useRef(null);
  const project4Ref = useRef(null);

  const project1Visible = useIntersectionObserver(project1Ref);
  const project2Visible = useIntersectionObserver(project2Ref);
  const project3Visible = useIntersectionObserver(project3Ref);
  const project4Visible = useIntersectionObserver(project4Ref);

  const closeCaseStudy = useCallback(() => {
    window.clearTimeout(loadTimer.current);
    loadTimer.current = null;
    setActiveCaseStudy(null);
    setIsCaseStudyLoading(false);
  }, []);

  const openCaseStudy = (id) => {
    if (id === activeCaseStudy && !isCaseStudyLoading) return;
    window.clearTimeout(loadTimer.current);
    setIsCaseStudyLoading(true);
    loadTimer.current = window.setTimeout(() => {
      loadTimer.current = null;
      setActiveCaseStudy(id);
      setIsCaseStudyLoading(false);
    }, 800);
  };

  useEffect(() => {
    return () => window.clearTimeout(loadTimer.current);
  }, []);

  useEffect(() => {
    if (!isOverlayOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen) return;
    const overlay = overlayRef.current;
    const returnFocusTo = document.activeElement;
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKey = (e) => {
      if (e.key === "Escape") {
        closeCaseStudy();
        return;
      }
      if (e.key !== "Tab" || !overlay) return;
      const focusable = Array.from(overlay.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const outside = !overlay.contains(current);
      if (e.shiftKey && (current === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (
        returnFocusTo instanceof HTMLElement &&
        document.contains(returnFocusTo)
      ) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
  }, [isOverlayOpen, closeCaseStudy]);

  useEffect(() => {
    if (!activeCaseStudy) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (
      overlayRef.current &&
      !overlayRef.current.contains(document.activeElement)
    ) {
      closeButtonRef.current?.focus({ preventScroll: true });
    }
  }, [activeCaseStudy]);

  const projects = [
    {
      number: "01",
      title: "Webii",
      description:
        "A tiny browser console controlled by your hand: the webcam tracks your index finger as a cursor and a pinch acts as the click. Includes calibration built into onboarding, three Canvas 2D games and three themes, with all tracking done locally. Requires a webcam and a secure context; desktop recommended.",
      tags: [
        "TypeScript",
        "MediaPipe",
        "Hand Tracking",
        "Canvas 2D",
        "Web Audio",
        "Vite",
        "Vitest",
        "Games",
        "Experimental UI",
      ],
      image: webiiImg,
      link: "https://ashen360.github.io/Webii/",
      status: "live",
      caseStudyId: "webii",
      ref: project4Ref,
      visible: project4Visible,
    },
    {
      number: "02",
      title: "WordWeaver",
      description:
        "A React-based category word puzzle game where players identify groups of four related words from a shuffled grid. With multiple difficulty levels—from everyday topics to advanced computer science concepts. It challenges logic, pattern recognition, and domain knowledge.",
      tags: ["React", "Word Game", "Minimalist Design"],
      image: project1Img,
      link: "https://ashen360.github.io/WordWeaver/",
      status: "live",
      ref: project1Ref,
      visible: project1Visible,
    },
    {
      number: "03",
      title: "Hello, Machine",
      description:
        "An interactive history of programming as the story of humans learning to talk to machines. Seven chapters and a finale from 1837 to LLMs, each built from its era's medium — a punched card that spells HELLO, valves that set a byte, a working BASIC terminal — while the whole page re-themes itself per era. Plain HTML, CSS and JavaScript with no build step.",
      tags: [
        "HTML",
        "CSS",
        "JavaScript",
        "Three.js",
        "Canvas",
        "Scrollytelling",
        "Interactive Essay",
        "Accessibility",
        "No Build Step",
      ],
      image: helloMachineImg,
      link: "https://ashen360.github.io/hello-machine/",
      status: "live",
      caseStudyId: "machinelanguage",
      ref: project3Ref,
      visible: project3Visible,
    },
    {
      number: "04",
      title: "Sining Filipino",
      description:
        "This project, created as my final requirement for Art Appreciation at the Technological Institute of the Philippines (SY 2024–2025), is an interactive visual timeline showcasing the evolution of Philippine art. It highlights significant Filipino artists from the Pre-Colonial, Colonial, and Post-Colonial periods, featuring their biographies, artistic movements, and representative works. The site aims to make Philippine art history more engaging, accessible, and visually immersive for learners.",
      tags: ["HTML", "CSS", "JavaScript", "Educational"],
      image: project2Img,
      link: "https://ashen360.github.io/SiningFilipino/",
      status: "live",
      ref: project2Ref,
      visible: project2Visible,
    },
  ];

  const cs = activeCaseStudy ? caseStudies[activeCaseStudy] : null;

  const otherStudies = Object.keys(caseStudies).length > 1 && (
    <div className="cs-other-studies">
      <h3>Other Case Studies</h3>
      <div className="cs-other-studies-grid">
        {Object.keys(caseStudies)
          .filter((key) => key !== activeCaseStudy)
          .map((key) => {
            const other = caseStudies[key];
            return (
              <button
                key={key}
                type="button"
                className="cs-other-study-card"
                onClick={() => openCaseStudy(key)}
              >
                <span
                  className="cs-other-study-image"
                  style={{
                    background: other.heroImage
                      ? `url(${other.heroImage}) center/cover no-repeat`
                      : other.heroGradient,
                  }}
                />
                <span className="cs-other-study-title">{other.title}</span>
                <span className="cs-other-study-role">{other.role}</span>
              </button>
            );
          })}
      </div>
    </div>
  );

  return (
    <section id="projects">
      <div className="container">
        <div className="projects-header">
          <div className="section-label">My Projects & Showcases</div>
          <h2 className="section-title">Works that push boundaries</h2>
        </div>

        <div className="projects-grid">
          {projects.map((project, idx) => (
            <div
              key={idx}
              ref={project.ref}
              className={`project-card ${project.visible ? "visible" : ""}`}
            >
              <div
                className="project-image"
                onClick={() =>
                  project.caseStudyId
                    ? openCaseStudy(project.caseStudyId)
                    : window.open(project.link, "_blank", "noopener,noreferrer")
                }
              >
                {project.image ? (
                  <img src={project.image} alt={project.title} loading="lazy" />
                ) : (
                  <div
                    className="project-placeholder"
                    style={{ background: project.gradient }}
                  />
                )}
              </div>
              <div className="project-info">
                <div className="project-number">{project.number}</div>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, tagIdx) => (
                    <span key={tagIdx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-actions">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      View Project
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  )}
                  {project.caseStudyId && (
                    <button
                      type="button"
                      className="project-link case-study-btn"
                      onClick={() => openCaseStudy(project.caseStudyId)}
                    >
                      View Case Study
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                      </svg>
                    </button>
                  )}
                  <span
                    className={`status-pill ${project.status === "live" ? "live" : ""}`}
                  >
                    {project.status === "live" ? "Live site" : "Case study"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <h2 className="section-title projects-footer">
          Always shipping something new.
        </h2>
      </div>

      {createPortal(
        <div
          ref={overlayRef}
          className={`case-study-overlay ${activeCaseStudy ? "open" : ""} ${isCaseStudyLoading ? "loading" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={cs?.title ?? "Case study"}
        >
          <div className="cs-shell">
            <button
              ref={closeButtonRef}
              type="button"
              className="cs-close"
              aria-label="Close case study"
              onClick={closeCaseStudy}
            >
              <svg
                className="cs-close-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div
              ref={scrollRef}
              className="cs-scroll"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeCaseStudy();
              }}
            >
              {cs?.layout === "editorial" && (
                <div key={activeCaseStudy}>
                  {activeCaseStudy === "webii" ? (
                    <WebiiCaseStudy cs={cs} />
                  ) : (
                    <HelloMachineCaseStudy cs={cs} />
                  )}
                  <div className="cs-inner cs-inner-after">
                    <div className="cs-elements">{otherStudies}</div>
                  </div>
                </div>
              )}
              {cs && cs.layout !== "editorial" && (
                <div key={activeCaseStudy} className="cs-inner">
                  <div className="cs-tagrow">
                    <span className="cs-badge">{cs.badge}</span>
                  </div>
                  <h2 className="cs-title">{cs.title}</h2>
                  <p className="cs-role">{cs.role}</p>

                  <div className="cs-meta">
                    <div className="cs-meta-item">
                      <div className="cs-label">Client</div>
                      <div className="cs-value">{cs.client}</div>
                    </div>
                    <div className="cs-meta-item">
                      <div className="cs-label">Year</div>
                      <div className="cs-value">{cs.year}</div>
                    </div>
                    <div className="cs-meta-item">
                      <div className="cs-label">Stack</div>
                      <div className="cs-value">{cs.stack}</div>
                    </div>
                  </div>

                  <div
                    className="cs-hero"
                    style={{ background: cs.heroGradient }}
                  />

                  <p className="cs-desc">{cs.description}</p>

                  <div className="cs-elements">
                    <h3>Elements</h3>

                    <div className="cs-block">
                      <div className="cs-block-label">Color palette</div>
                      <div className="palette-row">
                        {cs.palette.map((hex, i) => (
                          <div key={i} className="swatch">
                            <div
                              className="swatch-chip"
                              style={{ background: hex }}
                            />
                            <div className="swatch-hex">{hex}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="cs-block cs-type-specimen">
                      <div className="cs-block-label">Typography</div>
                      <div className="cs-type-display">{cs.display}</div>
                      <div className="cs-type-body">{cs.body}</div>
                      <div className="cs-fonts-used">{cs.fonts}</div>
                    </div>

                    <div className="cs-block">
                      <div className="cs-block-label">Screens</div>
                      <div className="cs-screens-grid">
                        {cs.screens?.map((screen, idx) => (
                          <div
                            key={idx}
                            className="cs-screen"
                            style={{
                              background:
                                screen.type === "image"
                                  ? `url(${screen.src}) center/cover no-repeat`
                                  : screen.type === "gradient"
                                    ? screen.src
                                    : undefined,
                            }}
                          >
                            {screen.type === "video" && (
                              <video autoPlay muted loop playsInline>
                                <source src={screen.src} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            )}
                            {screen.caption && (
                              <div className="cs-screen-overlay">
                                {screen.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {otherStudies}
                  </div>
                </div>
              )}
            </div>
            {isCaseStudyLoading && (
              <div
                className="cs-loading-overlay"
                role="status"
                aria-live="polite"
              >
                <div className="cs-loading-spinner" aria-hidden="true" />
                <span className="cs-loading-text">Loading case study…</span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
