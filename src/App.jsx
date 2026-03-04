import './App.css';
import { ThemeProvider } from './components/ThemeContext';
import Navbar from './sections/navbar/Navbar';
import Home from './sections/home/Home';
import About from './sections/about/About';
import Projects from './sections/projects/Projects';
import Footer from './sections/footer/Footer';

function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Home />
      <About />
      <Projects />
      <Footer />
    </ThemeProvider>
  );
}

export default App;
