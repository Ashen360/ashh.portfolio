import { useEffect, useRef, useState } from 'react';

export function useParallax(factor = 0.5) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const scrollPosition = window.scrollY;

      // Calculate parallax offset (slower scroll effect)
      const parallaxOffset = scrollPosition * factor;
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, [factor]);

  return { ref, offset };
}
