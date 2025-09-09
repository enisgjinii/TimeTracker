import { useState, useEffect, memo } from 'react';
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
      {/* Shadcn-inspired Brand Header */}
      <Box sx={{ p: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 8,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Schedule sx={{ color: 'primary.contrastText', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
              TimeTracker
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Productivity Analytics
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Shadcn-inspired Stats */}
      <Box sx={{ px: 4, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>
          Today's Progress
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 6,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
              {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Total Time
            </Typography>
          </Box>
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 6,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
              {stats.sessions}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Sessions
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Shadcn-inspired Navigation Menu */}
      <Box sx={{ flex: 1, px: 4, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{
            p: 2,
            borderRadius: 6,
            cursor: 'pointer',
            bgcolor: currentView === 'timeline' ? 'grey.100' : 'transparent',
            border: '1px solid',
            borderColor: currentView === 'timeline' ? 'primary.main' : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'grey.50',
              borderColor: 'divider'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <TimelineIcon sx={{
                color: currentView === 'timeline' ? 'primary.main' : 'text.secondary',
                fontSize: 20
              }} />
              <Typography variant="body2" fontWeight={500} sx={{
                color: currentView === 'timeline' ? 'primary.main' : 'text.primary'
              }}>
                Timeline
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            p: 2,
            borderRadius: 6,
            cursor: 'pointer',
            bgcolor: currentView === 'settings' ? 'grey.100' : 'transparent',
            border: '1px solid',
            borderColor: currentView === 'settings' ? 'primary.main' : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'grey.50',
              borderColor: 'divider'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <SettingsIcon sx={{
                color: currentView === 'settings' ? 'primary.main' : 'text.secondary',
                fontSize: 20
              }} />
              <Typography variant="body2" fontWeight={500} sx={{
                color: currentView === 'settings' ? 'primary.main' : 'text.primary'
              }}>
                Settings
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            p: 2,
            borderRadius: 6,
            cursor: 'pointer',
            bgcolor: currentView === 'about' ? 'grey.100' : 'transparent',
            border: '1px solid',
            borderColor: currentView === 'about' ? 'primary.main' : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'grey.50',
              borderColor: 'divider'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <InfoIcon sx={{
                color: currentView === 'about' ? 'primary.main' : 'text.secondary',
                fontSize: 20
              }} />
              <Typography variant="body2" fontWeight={500} sx={{
                color: currentView === 'about' ? 'primary.main' : 'text.primary'
              }}>
                About
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Shadcn-inspired Theme Switcher */}
      <Box sx={{ px: 4, py: 2 }}>
        <Box sx={{
          p: 2,
          borderRadius: 6,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
              Theme
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {isDark ? 'Dark' : 'Light'}
              </Typography>
              <Switch
                checked={isDark}
                onChange={toggleTheme}
                color="primary"
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      opacity: 0.8
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Shadcn-inspired User Profile */}
      <Box sx={{ px: 4, py: 3 }}>
        <Box sx={{
          p: 3,
          borderRadius: 8,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 6,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Person sx={{ color: 'primary.contrastText', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
                Guest User
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Online
              </Typography>
            </Box>
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