import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';

// Theme context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Create themes inspired by shadcn/ui
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light theme - clean and minimal (shadcn-inspired)
          primary: {
            main: '#000000', // Pure black for primary
            light: '#404040', // gray-700
            dark: '#000000', // Pure black
          },
          secondary: {
            main: '#6b7280', // gray-500
            light: '#9ca3af', // gray-400
            dark: '#374151', // gray-700
          },
          background: {
            default: '#ffffff',
            paper: '#fafafa', // Very light gray
          },
          text: {
            primary: '#000000', // Pure black
            secondary: '#6b7280', // gray-500
          },
          divider: '#e5e7eb', // gray-200
          success: {
            main: '#16a34a', // green-600
            light: '#22c55e', // green-500
            dark: '#15803d', // green-700
          },
          warning: {
            main: '#ca8a04', // yellow-600
            light: '#eab308', // yellow-500
            dark: '#a16207', // yellow-700
          },
          info: {
            main: '#2563eb', // blue-600
            light: '#3b82f6', // blue-500
            dark: '#1d4ed8', // blue-700
          },
          error: {
            main: '#dc2626', // red-600
            light: '#ef4444', // red-500
            dark: '#b91c1c', // red-700
          },
          grey: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          },
        }
      : {
          // Dark theme - sophisticated and clean (shadcn-inspired)
          primary: {
            main: '#ffffff', // Pure white
            light: '#f9fafb', // gray-50
            dark: '#e5e7eb', // gray-200
          },
          secondary: {
            main: '#9ca3af', // gray-400
            light: '#d1d5db', // gray-300
            dark: '#6b7280', // gray-500
          },
          background: {
            default: '#000000', // Pure black
            paper: '#0a0a0a', // Very dark gray
          },
          text: {
            primary: '#ffffff', // Pure white
            secondary: '#9ca3af', // gray-400
          },
          divider: '#374151', // gray-700
          success: {
            main: '#22c55e', // green-500
            light: '#4ade80', // green-400
            dark: '#16a34a', // green-600
          },
          warning: {
            main: '#eab308', // yellow-500
            light: '#facc15', // yellow-400
            dark: '#ca8a04', // yellow-600
          },
          info: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
          },
          error: {
            main: '#ef4444', // red-500
            light: '#f87171', // red-400
            dark: '#dc2626', // red-600
          },
          grey: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          },
        }
    ),
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.875rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.9rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 500 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'light' ? '#f1f5f9' : '#0f172a',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? '#cbd5e1' : '#475569',
            borderRadius: '4px',
            '&:hover': {
              background: mode === 'light' ? '#94a3b8' : '#64748b',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 280,
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
            color: mode === 'light' ? '#0f172a' : '#f1f5f9',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#e2e8f0' : '#475569',
            },
          },
          '&:hover': {
            backgroundColor: mode === 'light' ? '#f8fafc' : '#334155',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
          padding: '6px 12px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid transparent',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: mode === 'light' ? '#000000' : '#ffffff',
          color: mode === 'light' ? '#ffffff' : '#000000',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#262626' : '#f5f5f5',
          },
        },
        outlined: {
          borderColor: mode === 'light' ? '#d1d5db' : '#4b5563',
          color: mode === 'light' ? '#374151' : '#d1d5db',
          '&:hover': {
            borderColor: mode === 'light' ? '#9ca3af' : '#6b7280',
            backgroundColor: mode === 'light' ? '#f9fafb' : '#1f2937',
          },
        },
        text: {
          color: mode === 'light' ? '#374151' : '#d1d5db',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#f3f4f6' : '#1f2937',
          },
        },
        sizeSmall: {
          padding: '4px 8px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '8px 16px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${mode === 'light' ? '#e5e7eb' : '#374151'}`,
          boxShadow: 'none',
          backgroundColor: mode === 'light' ? '#ffffff' : '#0a0a0a',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.05)'
            : '0 1px 3px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.8125rem',
          height: 26,
          '& .MuiChip-label': {
            padding: '0 8px',
          },
        },
        filled: {
          backgroundColor: mode === 'light' ? '#f3f4f6' : '#1f2937',
          color: mode === 'light' ? '#374151' : '#d1d5db',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#e5e7eb' : '#374151',
          },
        },
        outlined: {
          borderColor: mode === 'light' ? '#d1d5db' : '#4b5563',
          color: mode === 'light' ? '#374151' : '#d1d5db',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#f9fafb' : '#1f2937',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: mode === 'light' ? '#ffffff' : '#0a0a0a',
            '& fieldset': {
              borderColor: mode === 'light' ? '#d1d5db' : '#4b5563',
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? '#9ca3af' : '#6b7280',
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? '#000000' : '#ffffff',
              borderWidth: 2,
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '8px 12px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          boxShadow: mode === 'light'
            ? '0 4px 16px rgba(0, 0, 0, 0.08)'
            : '0 4px 16px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});

export const ThemeProvider = ({ children }) => {
  // Get saved theme from localStorage or default to light
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved || 'light';
  });

  // Create theme based on current mode
  const theme = createAppTheme(mode);

  // Toggle theme function
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const value = {
    mode,
    toggleTheme,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
