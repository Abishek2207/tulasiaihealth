import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2e9a2e',
      light: '#52b452',
      dark: '#1f6b1f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f5b142',
      light: '#f9ce7c',
      dark: '#d07920',
      contrastText: '#000000',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#b45309',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#15803d',
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0369a1',
    },
    background: {
      default: '#000000',
      paper: '#0a0a0a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      disabled: '#525252',
    },
    divider: '#262626',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0a0a',
          border: '1px solid #262626',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0a0a',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid #262626',
          boxShadow: 'none',
        },
      },
    },
  },
});

export default darkTheme;
