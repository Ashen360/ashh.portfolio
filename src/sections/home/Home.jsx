import './Home.css'
import { useTyping } from '../../hooks/useTyping';
import { useParallax } from '../../hooks/useParallax';
import { useEffect, useRef } from 'react';


import trainVideo from '../../assets/Vids/Train-Rolling.mp4'; 

export default function Home() {
  const typingText = useTyping();
  const { ref: parallaxRef, offset } = useParallax(0.5);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef?.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  return (
    <section id="home">
      <div className="home-video-container" ref={parallaxRef}>
        <div className="video-overlay"></div>
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          loop 
          playsInline 
          preload="metadata"
          className="home-video"
          style={{
            transform: `translateY(${offset * 0.3}px)`,
            opacity: 1 - (offset / 1000) * 0.3,
          }}
        >
          <source src={trainVideo} type="video/mp4" />
        </video>
      </div>
      <div className="container" style={{ transform: `translateY(${offset * 0.1}px)` }}>
        <div className="hero-content">
          <div className="hero-label">"Ambition points to the horizon; passion becomes the road."</div>
          <h1 className="hero-title">
            <span className="subtle">Hiya! I'm </span>
            <span className="highlight"> Ashen.IT</span>
          </h1>
          <p className="hero-subtitle">
            I'm a <span className="typing-text">{typingText}</span>
          </p>
          <a href="#projects" className="hero-cta">
            View My Works
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </div>
      <div className="scroll-indicator">
        <span>Scroll</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
}
