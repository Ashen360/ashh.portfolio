import "./About.css";
import { useRef, memo } from "react";
import PhotographySwiper from "../../components/PhotographySwiper";
import ResumeDialog from "../../components/ResumeDialog";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { useContext } from "react";
import { ThemeContext } from "../../components/ThemeContext";
import { useThemeImage } from "../../hooks/useThemeImage";

import profileImg from "../../assets/Images/sully-me.jpg";

import officeLogo from "../../assets/Icons/office-logo.svg";
import figmaLogo from "../../assets/Icons/figma-logo.svg";
import chatgptLogoDark from "../../assets/Icons/chatgpt-logo-dark.svg";
import chatgptLogoLight from "../../assets/Icons/chatgpt-logo-light.svg";
import claudeLogo from "../../assets/Icons/claude-logo.svg";
import githubLogoDark from "../../assets/Icons/github-logo-dark.svg";
import githubLogoLight from "../../assets/Icons/github-logo-light.svg";
import canvaIcon from "../../assets/Icons/canva-icon.svg";
import spotifyLogo from "../../assets/Icons/spotify-logo.svg";

import linkedinDark from "../../assets/Icons/linkedin-dark.svg";
import linkedinLight from "../../assets/Icons/linkedin-light.svg";
import facebookDark from "../../assets/Icons/facebook-dark.svg";
import facebookLight from "../../assets/Icons/facebook-light.svg";
import gmailDark from "../../assets/Icons/gmail-dark.svg";
import gmailLight from "../../assets/Icons/gmail-light.svg";
import instagramDark from "../../assets/Icons/instagram-dark.svg";
import instagramLight from "../../assets/Icons/instagram-light.svg";

import albumImage from "../../assets/Images/album-smithereens.gif";

// Memoized app icon component
const AppIcon = memo(({ app, imageSrc }) => (
  <div className="app-icon" title={app.title}>
    <img src={imageSrc} alt={app.title} loading="lazy" />
  </div>
));

AppIcon.displayName = "AppIcon";

// Memoized social link component
const SocialLink = memo(({ link, imageSrc }) => (
  <a
    href={link.href}
    className="social-link"
    target={link.title !== "Gmail" ? "_blank" : undefined}
    title={link.title}
    rel="noopener noreferrer"
  >
    <img src={imageSrc} alt={link.title} loading="lazy" />
  </a>
));

SocialLink.displayName = "SocialLink";

export default function About() {
  const { theme } = useContext(ThemeContext);

  const profileRef = useRef(null);
  const textRef = useRef(null);
  const appsRef = useRef(null);
  const photoRef = useRef(null);
  const vinylRef = useRef(null);
  const connectRef = useRef(null);

  const profileVisible = useIntersectionObserver(profileRef);
  const textVisible = useIntersectionObserver(textRef);
  const appsVisible = useIntersectionObserver(appsRef);
  const photoVisible = useIntersectionObserver(photoRef);
  const vinylVisible = useIntersectionObserver(vinylRef);
  const connectVisible = useIntersectionObserver(connectRef);

  const apps = [
    { src: officeLogo, title: "Microsoft Office" },
    { src: figmaLogo, title: "Figma" },
    {
      light: chatgptLogoLight,
      dark: chatgptLogoDark,
      title: "ChatGPT",
    },
    { src: claudeLogo, title: "Claude" },
    {
      light: githubLogoLight,
      dark: githubLogoDark,
      title: "GitHub",
    },
    { src: canvaIcon, title: "Canva" },
    { src: spotifyLogo, title: "Spotify" },
  ];

  const socialLinks = [
    {
      href: "https://www.linkedin.com/in/kurtrusselbaybay/",
      light: linkedinLight,
      dark: linkedinDark,
      title: "LinkedIn",
    },
    {
      href: "https://www.facebook.com/kurtrussel.baybay",
      light: facebookLight,
      dark: facebookDark,
      title: "Facebook",
    },
    {
      href: "mailto:developer.ashen.it@gmail.com",
      light: gmailLight,
      dark: gmailDark,
      title: "Gmail",
    },
    {
      href: "https://github.com/Ashen360",
      light: githubLogoLight,
      dark: githubLogoDark,
      title: "GitHub",
    },
    {
      href: "https://www.instagram.com/krtt_russel/",
      light: instagramLight,
      dark: instagramDark,
      title: "Instagram",
    },
  ];

  // Get theme-aware image sources
  const albumImageSrc = albumImage;

  return (
    <section id="about">
      <div className="container">
        <div className="section-label">About Me</div>
        <h2 className="section-title">More than just code</h2>

        <div className="bento-grid">
          {/* Profile Image Card */}
          <div
            ref={profileRef}
            className={`bento-card profile-card ${profileVisible ? "visible" : ""}`}
          >
            <img src={profileImg} alt="Profile" className="profile-image" />
            <div className="profile-overlay"></div>
          </div>

          {/* About Text Card */}
          <div
            ref={textRef}
            className={`bento-card about-text-card ${textVisible ? "visible" : ""}`}
          >
            <h3>Myself, Described</h3>
            <p>
              I'm enjoy turning ideas into interactive experiences through code. 
              My work focuses on crafting websites and applications that are both intuitive and meaningful
              for the people who use them. I approach projects with curiosity and a strong attention to detail
              that makes products feel polished and complete
            </p>
            <p>
              When I'm not immersed in code, you'll find me capturing moments
              through photography or exploring the latest in tech innovation.
            </p>
          </div>

          {/* Apps Infinite Scroll Card */}
          <div
            ref={appsRef}
            className={`bento-card apps-card ${appsVisible ? "visible" : ""}`}
          >
            <h2 className="section-title">Apps I love using!</h2>
            <div className="apps-scroll">
              {apps.map((app, idx) => {
                const imageSrc = app.light
                  ? theme === "light"
                    ? app.light
                    : app.dark
                  : app.src;
                return (
                  <AppIcon
                    key={idx}
                    app={app}
                    imageSrc={imageSrc}
                  />
                );
              })}
            </div>
          </div>

          {/* Photography Card - Swiper */}
          <div
            ref={photoRef}
            className={`bento-card photography-card ${photoVisible ? "visible" : ""}`}
          >
            <PhotographySwiper />
          </div>

          {/* Vinyl Visualizer Card */}
          <div
            ref={vinylRef}
            className={`bento-card vinyl-card ${vinylVisible ? "visible" : ""}`}
          >
            <div className="vinyl-content">
              <div className="track-info">
                <div className="track-title">Die for you</div>
                <div className="track-artist">Joji</div>
              </div>
              <div className="album-container">
                <div className="album-cover">
                  <img src={albumImage} alt="Album Cover" />
                </div>
                <div className="vinyl-disc-container">
                  <div className="vinyl-disc">
                    <div className="vinyl-grooves"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider between cards */}
          <div className="bento-divider"></div>

          {/* Connect Card */}
          <div
            ref={connectRef}
            className={`bento-card connect-card ${connectVisible ? "visible" : ""}`}
          >
            <h3>Connect with me</h3>
            <div className="social-links">
              {socialLinks.map((link, idx) => {
                const imageSrc = theme === "light" ? link.light : link.dark;
                return (
                  <SocialLink
                    key={idx}
                    link={link}
                    imageSrc={imageSrc}
                  />
                );
              })}
            </div>
            {/* Resume Download Dialog Component */}
            <ResumeDialog />
          </div>
        </div>
      </div>
    </section>
  );
}
