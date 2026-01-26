import { useState, useEffect, useRef } from 'react';

/**
 * Hook for streaming text with typewriter effect
 * @param {string} text - The full text to display
 * @param {number} speed - Milliseconds per character (default: 30)
 */
export const useStreamingText = (text, speed = 30) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        setIsTyping(true);
        indexRef.current = 0;
        setDisplayedText('');

        const interval = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayedText(text.slice(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return { displayedText, isTyping };
};
