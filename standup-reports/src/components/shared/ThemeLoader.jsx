import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeLoader.css';

/**
 * ThemeLoader - A theme-aware loading spinner.
 * Displays unique animations based on the active premium theme.
 *
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
const ThemeLoader = ({ size = 'md', className = '' }) => {
    const { themeMode } = useTheme();

    const getLoaderContent = () => {
        switch (themeMode) {
            case 'space':
                return (
                    <div className="loader-space">
                        <div className="orbit"></div>
                        <div className="orbit"></div>
                        <div className="orbit"></div>
                        <div className="core"></div>
                        <div className="star"></div>
                        <div className="star"></div>
                        <div className="star"></div>
                    </div>
                );
            case 'ocean':
                return (
                    <div className="loader-ocean">
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                    </div>
                );
            case 'forest':
                return (
                    <div className="loader-forest">
                        <div className="leaf"></div>
                        <div className="firefly"></div>
                        <div className="firefly"></div>
                        <div className="firefly"></div>
                        <div className="firefly"></div>
                        <div className="firefly"></div>
                        <div className="firefly"></div>
                    </div>
                );
            case 'diwali':
                return (
                    <div className="loader-diwali">
                        <div className="rays">
                            <div className="ray"></div>
                            <div className="ray"></div>
                            <div className="ray"></div>
                            <div className="ray"></div>
                        </div>
                        <div className="core"></div>
                    </div>
                );
            default:
                // Default: spinning rings for light/dark/system themes
                return (
                    <div className="loader-default">
                        <div className="ring"></div>
                        <div className="ring"></div>
                        <div className="ring"></div>
                    </div>
                );
        }
    };

    return (
        <div className={`theme-loader theme-loader--${size} ${className}`}>
            {getLoaderContent()}
        </div>
    );
};

export default ThemeLoader;
