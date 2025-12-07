import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ darkMode = false, className = '', scale = 1 }) => {
    // Configuration matching SCSS variables
    const DOT_COUNT = 26;
    const DOT_SIZE = 10;
    const DOT_SPACE = 15;
    const ANIMATION_TIME = 2; // seconds

    // Calculate starting position to center the loader
    // $dot-start: (($dot-count / 2 + 1) * ($dot-size + $dot-space)) / 2;
    const DOT_START = ((DOT_COUNT / 2 + 1) * (DOT_SIZE + DOT_SPACE)) / 2;

    const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
        const index = i + 1; // 1-based index for parity with SCSS loop

        // $dot-move: ceil($i / 2);
        const dotMove = Math.ceil(index / 2);

        // $dot-pos: $dot-start - (($dot-size + $dot-space) * $dot-move);
        const dotPos = DOT_START - ((DOT_SIZE + DOT_SPACE) * dotMove);

        let animationDelay = -(index * 0.1);
        if (index % 2 === 0) {
            animationDelay -= (ANIMATION_TIME / 2);
        }

        return (
            <div
                key={i}
                className="dot"
                style={{
                    left: `${dotPos}px`,
                    animationDelay: `${animationDelay}s`,
                    // Note: ::before animation-delay is handled by inheritance in CSS or same logic if inline needed, 
                    // but pseudo-elements can't have inline styles. 
                    // However, standard CSS animation-delay on parent typically doesn't cascade to pseudo-elements automatically 
                    // unless specified. The provided SCSS says: &::before { animation-delay: $animation-delay; }
                    // Since we can't style pseudo-elements inline, we'll apply the delay to a CSS variable 
                    // and use that in the CSS, OR we can just apply it to the parent and rely on the CSS rule.
                    // RE-READING SCSS:
                    // &:nth-of-type(#{$i}) { animation-delay: ...; &::before { animation-delay: ... } }
                    // We need a way to pass this delay to the pseudo element.
                    // Best way: use a CSS variable.
                    '--delay': `${animationDelay}s`
                }}
            />
        );
    });

    return (
        <div className={`loading-container ${darkMode ? 'dark-mode' : ''} ${className}`}>
            <div className="loader" style={{ transform: `scale(${scale})` }}>
                {dots}
            </div>
        </div>
    );
};

export default LoadingSpinner;
