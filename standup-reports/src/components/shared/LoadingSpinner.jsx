import React from 'react';
import ThemeLoader from './ThemeLoader';

/**
 * LoadingSpinner - Backward-compatible wrapper for ThemeLoader.
 * Now uses theme-aware animations.
 *
 * @param {string} className - Additional CSS classes
 * @param {number} scale - Scale factor (legacy prop, maps to size)
 */
const LoadingSpinner = ({ className = '', scale = 2.5 }) => {
    // Map legacy scale prop to new size system
    let size = 'lg';
    if (scale <= 0.5) size = 'sm';
    else if (scale <= 1) size = 'md';
    else if (scale <= 2) size = 'lg';
    else size = 'xl';

    return (
        <div className={`loading-spinner-wrapper ${className}`}>
            <ThemeLoader size={size} />
        </div>
    );
};

export default LoadingSpinner;
