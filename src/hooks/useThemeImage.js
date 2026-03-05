import { useMemo, useContext } from 'react';
import { ThemeContext } from '../components/ThemeContext';

export function useThemeImage(lightSrc, darkSrc) {
  const { theme } = useContext(ThemeContext);
  
  return useMemo(() => {
    return theme === 'light' ? lightSrc : darkSrc;
  }, [theme, lightSrc, darkSrc]);
}
