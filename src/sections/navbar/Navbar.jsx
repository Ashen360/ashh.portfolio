import './Navbar.css'
import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../components/ThemeContext';

export default function Navbar() {
  const { toggleTheme } = useContext(ThemeContext);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const handleSectionChange = () => {
      const sections = ['home', 'about', 'projects'];
      let currentSection = 'home';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          const scroll = window.scrollY;

          if (scroll >= top - 100 && scroll < top + height - 100) {
            currentSection = section;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleSectionChange);
    
    // Initial call
    handleSectionChange();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleSectionChange);
    };
  }, []);

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
      <div className="logo">Ashen.IT</div>
      <ul className="nav-links">
        <li>
          <a 
            href="#home" 
            className={activeSection === 'home' ? 'active' : ''}
          >
            Home
          </a>
        </li>
        <li>
          <a 
            href="#about" 
            className={activeSection === 'about' ? 'active' : ''}
          >
            About
          </a>
        </li>
        <li>
          <a 
            href="#projects" 
            className={activeSection === 'projects' ? 'active' : ''}
          >
            Projects
          </a>
        </li>
      </ul>
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
<svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </nav>
  );
}