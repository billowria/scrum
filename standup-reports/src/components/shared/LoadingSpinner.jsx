import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ darkMode = false, className = '' }) => {
    return (
        <div className={`loading-container ${darkMode ? 'dark-mode' : ''} ${className}`}>
            <div className="loading-dot"></div>
        </div>
    );
};

export default LoadingSpinner;
