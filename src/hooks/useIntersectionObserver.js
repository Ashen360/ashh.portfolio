import { useEffect, useState } from 'react';

export function useIntersectionObserver(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible to prevent unnecessary re-renders
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(ref.current);

    // Cleanup
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isVisible;
}
