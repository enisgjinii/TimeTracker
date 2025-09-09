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
          // Light theme - clean and minimal
          primary: {
            main: '#0f172a', // slate-900
            light: '#334155', // slate-700
            dark: '#020617', // slate-950
          },
          secondary: {
            main: '#64748b', // slate-500
            light: '#94a3b8', // slate-400
            dark: '#475569', // slate-600
          },
          background: {
            default: '#ffffff',
            paper: '#f8fafc', // slate-50
          },
          text: {
            primary: '#0f172a', // slate-900
            secondary: '#64748b', // slate-500
          },
          divider: '#e2e8f0', // slate-200
          success: {
            main: '#059669', // emerald-600
            light: '#10b981', // emerald-500
            dark: '#047857', // emerald-700
          },
          warning: {
            main: '#d97706', // amber-600
            light: '#f59e0b', // amber-500
            dark: '#b45309', // amber-700
          },
          info: {
            main: '#0284c7', // sky-600
            light: '#0ea5e9', // sky-500
            dark: '#0369a1', // sky-700
          },
          error: {
            main: '#dc2626', // red-600
            light: '#ef4444', // red-500
            dark: '#b91c1c', // red-700
          },
        }
      : {
          // Dark theme - sophisticated and clean
          primary: {
            main: '#f1f5f9', // slate-100
            light: '#e2e8f0', // slate-200
            dark: '#cbd5e1', // slate-300
          },
          secondary: {
            main: '#94a3b8', // slate-400
            light: '#cbd5e1', // slate-300
            dark: '#64748b', // slate-500
          },
          background: {
            default: '#0f172a', // slate-900
            paper: '#1e293b', // slate-800
          },
          text: {
            primary: '#f1f5f9', // slate-100
            secondary: '#94a3b8', // slate-400
          },
          divider: '#334155', // slate-700
          success: {
            main: '#10b981', // emerald-500
            light: '#34d399', // emerald-400
            dark: '#059669', // emerald-600
          },
          warning: {
            main: '#f59e0b', // amber-500
            light: '#fbbf24', // amber-400
            dark: '#d97706', // amber-600
          },
          info: {
            main: '#0ea5e9', // sky-500
            light: '#38bdf8', // sky-400
            dark: '#0284c7', // sky-600
          },
          error: {
            main: '#ef4444', // red-500
            light: '#f87171', // red-400
            dark: '#dc2626', // red-600
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
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 1px 3px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 2px 8px rgba(0, 0, 0, 0.15)'
              : '0 2px 8px rgba(0, 0, 0, 0.4)',
          },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
            backgroundColor: mode === 'light' ? '#f8fafc' : '#334155',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.05)'
            : '0 1px 3px rgba(0, 0, 0, 0.15)',
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          transition: 'all 0.15s ease',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 4px 12px rgba(0, 0, 0, 0.08)'
              : '0 4px 12px rgba(0, 0, 0, 0.2)',
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
        },
        filled: {
          backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
          color: mode === 'light' ? '#475569' : '#cbd5e1',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            '& fieldset': {
              borderColor: mode === 'light' ? '#cbd5e1' : '#475569',
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? '#94a3b8' : '#64748b',
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? '#0f172a' : '#f1f5f9',
              borderWidth: 1,
            },
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
