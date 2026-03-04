import { useState, useEffect } from 'react';

export function useTyping(phrases = ['Developer', 'Designer', 'Creator']) {
  const [displayText, setDisplayText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    const currentPhrase = phrases[phraseIndex];
    const isComplete = displayText === currentPhrase;

    if (!isDeleting && !isComplete) {
      // Typing phase
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
      }, 100);
    } else if (isDeleting && displayText.length > 0) {
      // Deleting phase
      timeout = setTimeout(() => {
        setDisplayText(displayText.substring(0, displayText.length - 1));
      }, 50);
    } else if (isComplete && !isDeleting) {
      // Pause before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && displayText.length === 0) {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }

    // Cleanup timeout
    return () => clearTimeout(timeout);
  }, [displayText, phraseIndex, isDeleting, phrases]);

  return displayText;
}
