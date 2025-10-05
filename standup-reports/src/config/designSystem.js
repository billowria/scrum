// ============================================
// DESIGN SYSTEM CONFIGURATION
// Professional Jira-like Theme
// ============================================

export const colors = {
  // Primary - Emerald (Main actions, primary buttons)
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Secondary - Slate (Text, borders, backgrounds)
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Accent - Amber (Highlights, warnings, pending states)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Success - Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning - Orange
  warning: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Danger - Red
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Info - Sky Blue
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Purple - For epics and special items
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
};

export const taskPriorities = {
  Low: {
    color: colors.success[500],
    bg: colors.success[50],
    border: colors.success[200],
    text: colors.success[700],
    icon: '⬇️',
    gradient: 'from-green-400 to-green-600',
  },
  Medium: {
    color: colors.accent[500],
    bg: colors.accent[50],
    border: colors.accent[200],
    text: colors.accent[700],
    icon: '➡️',
    gradient: 'from-amber-400 to-amber-600',
  },
  High: {
    color: colors.warning[500],
    bg: colors.warning[50],
    border: colors.warning[200],
    text: colors.warning[700],
    icon: '⬆️',
    gradient: 'from-orange-400 to-orange-600',
  },
  Critical: {
    color: colors.danger[500],
    bg: colors.danger[50],
    border: colors.danger[200],
    text: colors.danger[700],
    icon: '🔥',
    gradient: 'from-red-400 to-red-600',
  },
};

export const taskTypes = {
  Bug: {
    color: colors.danger[500],
    bg: colors.danger[50],
    border: colors.danger[200],
    text: colors.danger[700],
    icon: '🐛',
    gradient: 'from-red-400 to-red-600',
  },
  Feature: {
    color: colors.primary[500],
    bg: colors.primary[50],
    border: colors.primary[200],
    text: colors.primary[700],
    icon: '✨',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  Story: {
    color: colors.info[500],
    bg: colors.info[50],
    border: colors.info[200],
    text: colors.info[700],
    icon: '📖',
    gradient: 'from-sky-400 to-sky-600',
  },
  Task: {
    color: colors.secondary[500],
    bg: colors.secondary[50],
    border: colors.secondary[200],
    text: colors.secondary[700],
    icon: '✓',
    gradient: 'from-slate-400 to-slate-600',
  },
  Epic: {
    color: colors.purple[500],
    bg: colors.purple[50],
    border: colors.purple[200],
    text: colors.purple[700],
    icon: '⚡',
    gradient: 'from-purple-400 to-purple-600',
  },
  Improvement: {
    color: colors.accent[500],
    bg: colors.accent[50],
    border: colors.accent[200],
    text: colors.accent[700],
    icon: '📈',
    gradient: 'from-amber-400 to-amber-600',
  },
  Spike: {
    color: colors.info[500],
    bg: colors.info[50],
    border: colors.info[200],
    text: colors.info[700],
    icon: '🔍',
    gradient: 'from-cyan-400 to-cyan-600',
  },
};

export const taskStatuses = {
  'To Do': {
    color: colors.secondary[500],
    bg: colors.secondary[50],
    border: colors.secondary[200],
    text: colors.secondary[700],
    icon: '📋',
    gradient: 'from-slate-400 to-slate-600',
    column: 'todo',
  },
  'In Progress': {
    color: colors.info[500],
    bg: colors.info[50],
    border: colors.info[200],
    text: colors.info[700],
    icon: '🚀',
    gradient: 'from-sky-400 to-sky-600',
    column: 'inprogress',
  },
  'Review': {
    color: colors.accent[500],
    bg: colors.accent[50],
    border: colors.accent[200],
    text: colors.accent[700],
    icon: '👀',
    gradient: 'from-amber-400 to-amber-600',
    column: 'review',
  },
  'Completed': {
    color: colors.success[500],
    bg: colors.success[50],
    border: colors.success[200],
    text: colors.success[700],
    icon: '✅',
    gradient: 'from-green-400 to-green-600',
    column: 'completed',
  },
};

export const animations = {
  // Transition durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Easing functions
  ease: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Common animation variants for Framer Motion
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
    modal: {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
    },
  },
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: {
    primary: '0 0 20px rgba(16, 185, 129, 0.5)',
    secondary: '0 0 20px rgba(71, 85, 105, 0.5)',
    accent: '0 0 20px rgba(245, 158, 11, 0.5)',
  },
};

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const spacing = {
  page: {
    padding: {
      mobile: '1rem',
      tablet: '1.5rem',
      desktop: '2rem',
    },
    maxWidth: '1920px',
  },
  card: {
    padding: '1.5rem',
    gap: '1rem',
  },
  modal: {
    padding: '2rem',
    maxWidth: {
      sm: '32rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem',
      full: '95vw',
    },
  },
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Lexend', 'Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

// Keyboard shortcuts
export const keyboardShortcuts = {
  createTask: 'c',
  search: '/',
  refresh: 'r',
  toggleSidebar: 'b',
  quickFilter: 'f',
  assignToMe: 'm',
  escape: 'Escape',
  save: 'mod+s', // Cmd+S on Mac, Ctrl+S on Windows
  delete: 'Delete',
};

export default {
  colors,
  taskPriorities,
  taskTypes,
  taskStatuses,
  animations,
  shadows,
  breakpoints,
  spacing,
  typography,
  keyboardShortcuts,
};
