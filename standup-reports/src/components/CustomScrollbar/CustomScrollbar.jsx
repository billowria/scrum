import React from 'react';
import styles from './CustomScrollbar.module.css';

const CustomScrollbar = ({
  children,
  className = '',
  vertical = true,
  horizontal = false,
  width = '8px',
  theme = 'auto', // Can be 'auto', 'light', 'dark', or 'lightGreyGlass'
  ...props
}) => {
  // Determine theme class
  let themeClass = '';
  if (theme === 'lightGreyGlass') {
    themeClass = styles.lightGreyGlassTheme;
  } else {
    themeClass = theme === 'auto' ? styles.autoTheme :
                 theme === 'dark' ? styles.darkTheme :
                 styles.lightTheme;
  }

  // Determine orientation classes
  const orientationClass = `${vertical ? styles.vertical : ''} ${horizontal ? styles.horizontal : ''}`.trim();

  return (
    <div
      className={`${styles.customScrollbar} ${themeClass} ${orientationClass} ${className}`.trim()}
      style={{ '--scrollbar-width': width }}
      {...props}
    >
      {children}
    </div>
  );
};

export default CustomScrollbar;