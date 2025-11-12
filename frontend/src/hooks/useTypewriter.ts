import { useState, useEffect } from 'react';

/**
 * Custom hook for typewriter effect (line by line)
 * @param text - The full text to type out
 * @param linesPerSecond - Typing speed in lines per second (default: 2)
 * @returns Object with displayedText and isComplete flag
 */
export function useTypewriter(text: string | null, linesPerSecond: number = 2) {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    // Reset when text changes
    setDisplayedText('');
    setIsComplete(false);

    // Split text into lines using \n as separator
    // Preserve the newline character with each line
    const lines = text.split('\n');
    
    // Calculate delay per line: 2 lines per second = 500ms per line
    const delayPerLine = (1 / linesPerSecond) * 1000;

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let forceCompleteTimeoutId: NodeJS.Timeout | null = null;

    const typeNextLine = () => {
      if (currentIndex < lines.length) {
        // Add the current line with newline (except for the last line)
        setDisplayedText(prev => {
          const newLine = lines[currentIndex];
          // Add newline after each line except the last one
          return prev + newLine + (currentIndex < lines.length - 1 ? '\n' : '');
        });
        currentIndex++;
        timeoutId = setTimeout(typeNextLine, delayPerLine);
      } else {
        setIsComplete(true);
      }
    };

    // After 3 seconds, force complete the typing by setting entire content
    forceCompleteTimeoutId = setTimeout(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setDisplayedText(text);
      setIsComplete(true);
    }, 3000);

    // Start typing after a short delay
    timeoutId = setTimeout(typeNextLine, 100);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (forceCompleteTimeoutId) {
        clearTimeout(forceCompleteTimeoutId);
      }
    };
  }, [text, linesPerSecond]);

  return { displayedText, isComplete };
}

