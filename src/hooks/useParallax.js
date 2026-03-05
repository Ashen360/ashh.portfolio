import { useEffect, useRef, useState } from 'react';

export function useParallax(factor = 0.5) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      lastScrollY = window.scrollY;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const parallaxOffset = lastScrollY * factor;
        setOffset(parallaxOffset);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [factor]);

  return { ref, offset };
}
