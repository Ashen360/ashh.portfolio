import { useState, useEffect, useRef } from 'react';

export function useLazyImage(imageSrc) {
  const [imagePath, setImagePath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imageSrc) return;

    // Use native lazy loading support
    const img = new Image();
    
    img.onload = () => {
      setImagePath(imageSrc);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = imageSrc;
  }, [imageSrc]);

  return { imagePath, isLoading, imgRef };
}
