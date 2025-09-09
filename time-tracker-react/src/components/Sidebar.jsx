import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  PlayArrow,
  Stop,
  Coffee,
  CenterFocusStrong,
  Add,
  Person,
  Schedule,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { useTheme } from './ThemeProvider';
import trackingService from '../services/trackingService';

const drawerWidth = 280;

const Sidebar = memo(({ currentView, setCurrentView }) => {
  const navigate = useNavigate();
  const { mode, toggleTheme, isDark } = useTheme();
  const [trackingState, setTrackingState] = useState(trackingService.getState());
  const [stats, setStats] = useState({ totalTime: 0, sessions: 0 });

  useEffect(() => {
    const unsubscribe = trackingService.subscribe(setTrackingState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update stats every second when tracking
    const interval = setInterval(() => {
      if (trackingState.isTracking) {
        setStats(trackingService.getTodayStats());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [trackingState.isTracking]);

  const handleNavigation = (view, path) => {
    setCurrentView(view);
    navigate(path);
  };

  const toggleTracking = () => {
    if (trackingState.isTracking) {
      trackingService.stopTracking();
      setStats(trackingService.getTodayStats());
    } else {
      trackingService.startTracking();
    }
  };

  const toggleAutoTracking = async () => {
    if (trackingState.isAutoTracking) {
      trackingService.stopAutoTracking();
      setStats(trackingService.getTodayStats());
    } else {
      await trackingService.startAutoTracking();
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <Schedule />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              TimeTracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Productivity Analytics
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Compact Stats */}
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Today's Progress
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Time
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {stats.sessions}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sessions
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, px: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            selected={currentView === 'timeline'}
            onClick={() => handleNavigation('timeline', '/')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <TimelineIcon color={currentView === 'timeline' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Timeline" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            selected={currentView === 'settings'}
            onClick={() => handleNavigation('settings', '/settings')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <SettingsIcon color={currentView === 'settings' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={currentView === 'about'}
            onClick={() => handleNavigation('about', '/about')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <InfoIcon color={currentView === 'about' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="About" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      {/* Theme Switcher - Compact */}
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Theme
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {isDark ? 'Dark' : 'Light'}
            </Typography>
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              color="primary"
              size="small"
              sx={{ transform: 'scale(0.8)' }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            <Person />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500}>
              Guest User
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Online
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Compact Tracking Controls */}
      <Box sx={{ p: 2 }}>
        {/* Auto Tracking Toggle */}
        <Button
          fullWidth
          variant={trackingState.isAutoTracking ? "contained" : "outlined"}
          color={trackingState.isAutoTracking ? "primary" : "inherit"}
          size="small"
          onClick={toggleAutoTracking}
          sx={{ mb: 1, py: 1 }}
        >
          {trackingState.isAutoTracking ? 'Auto ON' : 'Auto OFF'}
        </Button>

        {/* Current App Info - Compact */}
        {trackingState.isAutoTracking && trackingState.currentApp && (
          <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {trackingState.currentApp}
            </Typography>
          </Box>
        )}

        {/* Manual Tracking Button */}
        <Button
          fullWidth
          variant="contained"
          color={trackingState.isTracking ? "error" : "success"}
          size="small"
          startIcon={trackingState.isTracking ? <Stop /> : <PlayArrow />}
          onClick={toggleTracking}
          sx={{ mb: 1, py: 1 }}
          disabled={trackingState.isAutoTracking}
        >
          {trackingState.isTracking ? 'Stop' : 'Start'}
        </Button>

        {/* Quick Actions - Compact */}
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <IconButton size="small" sx={{ p: 0.5 }}>
            <Coffee fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ p: 0.5 }}>
            <CenterFocusStrong fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ p: 0.5 }}>
            <Add fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRadius: '0 12px 12px 0',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: 'none'
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;