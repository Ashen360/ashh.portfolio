import { useState } from 'react';
import './App.css';
import { ThemeProvider } from './components/ThemeContext';
import IntroLoader from './components/intro/IntroLoader';
import Navbar from './sections/navbar/Navbar';
import Home from './sections/home/Home';
import About from './sections/about/About';
import Projects from './sections/projects/Projects';
import Footer from './sections/footer/Footer';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => setRevealed(true);
  const handleComplete = () => setIsLoading(false);

  return (
    <ThemeProvider>
      {!isLoading && <Navbar />}
      <div className={'app-content' + (revealed ? ' revealed' : '')}>
        <Home />
        <About />
        <Projects />
        <Footer />
      </div>
      {isLoading && (
        <IntroLoader onReveal={handleReveal} onComplete={handleComplete} />
      )}
    </ThemeProvider>
  );
}

export default App;