import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
  Button,
  IconButton,
  Divider,
  LinearProgress,
  Fade,
  Zoom,
  Badge,
  Paper,
  Grid,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  PlayArrow,
  Coffee,
  CenterFocusStrong,
  AccessTime,
  Timeline as TimelineIcon,
  Apps,
  Computer,
  TrendingUp,
  Timer,
  MoreVert
} from '@mui/icons-material';
import trackingService from '../services/trackingService';

// Memoized Session Card Component for performance
const SessionCard = memo(({ session, getActivityIcon, getActivityColor, formatTime, formatDuration }) => (
  <Card
    sx={{
      mb: 1,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      boxShadow: 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        borderColor: `${getActivityColor(session.type)}.main`,
        bgcolor: `${getActivityColor(session.type)}.light`,
        transform: 'translateX(4px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
      }
    }}
  >
    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar sx={{
          width: 40,
          height: 40,
          bgcolor: `${getActivityColor(session.type)}.main`,
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {getActivityIcon(session.type)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography variant="body1" fontWeight={600} noWrap sx={{ color: 'text.primary' }}>
              {session.app || 'Unknown App'}
            </Typography>
            <Chip
              label={session.type}
              size="small"
              variant="filled"
              color={getActivityColor(session.type)}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: 1
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14 }} />
              {formatTime(new Date(session.startTime))}
              {session.endTime && ` - ${formatTime(new Date(session.endTime))}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Timer sx={{ fontSize: 14 }} />
              {formatDuration(session.duration)}
            </Typography>
          </Box>

          {session.windowTitle && (
            <Typography variant="caption" sx={{
              display: 'block',
              color: 'text.secondary',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.8
            }}>
              "{session.windowTitle}"
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
));

SessionCard.displayName = 'SessionCard';

const Timeline = memo(() => {
  const [sessions, setSessions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trackingState, setTrackingState] = useState(trackingService.getState());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveStats, setLiveStats] = useState({ totalTime: 0, sessions: 0, currentSessionTime: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Optimized callback for loading sessions
  const loadSessions = useCallback(() => {
    const state = trackingService.getState();
    setTrackingState(state);
    setSessions(state.sessions);

    // Calculate live statistics
    const stats = trackingService.getTodayStats();
    const currentSessionTime = state.currentSession ?
      Math.floor((new Date() - new Date(state.currentSession.startTime)) / 1000) : 0;

    setLiveStats({
      totalTime: stats.totalTime,
      sessions: stats.sessions,
      currentSessionTime
    });
  }, []);

  // Memoized hourly segments calculation
  const hourlySegments = useMemo(() => {
    const segments = [];
    for (let hour = 0; hour < 24; hour++) {
      segments.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        sessions: sessions.filter(session => {
          if (!session.startTime) return false;
          const sessionHour = new Date(session.startTime).getHours();
          return sessionHour === hour;
        })
      });
    }
    return segments;
  }, [sessions]);

  useEffect(() => {
    // Initial load
    loadSessions();
    setIsLoading(false);

    // Subscribe to tracking updates
    const unsubscribe = trackingService.subscribe(loadSessions);

    // Real-time clock update every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
      // Update live stats if tracking is active
      if (trackingState.isTracking && trackingState.currentSession) {
        const currentSessionTime = Math.floor((new Date() - new Date(trackingState.currentSession.startTime)) / 1000);
        setLiveStats(prev => ({ ...prev, currentSessionTime }));
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(clockInterval);
    };
  }, [loadSessions, trackingState.isTracking, trackingState.currentSession]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatLiveDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'work':
        return <PlayArrow sx={{ color: 'success.main' }} />;
      case 'break':
        return <Coffee sx={{ color: 'warning.main' }} />;
      case 'focus':
        return <CenterFocusStrong sx={{ color: 'info.main' }} />;
      default:
        return <AccessTime sx={{ color: 'text.secondary' }} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'work':
        return 'success';
      case 'break':
        return 'warning';
      case 'focus':
        return 'info';
      default:
        return 'default';
    }
  };

  // Memoized formatters for performance
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatLiveDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }, []);

  const getActivityIcon = useCallback((type) => {
    switch (type) {
      case 'work':
        return <PlayArrow sx={{ color: 'success.main' }} />;
      case 'break':
        return <Coffee sx={{ color: 'warning.main' }} />;
      case 'focus':
        return <CenterFocusStrong sx={{ color: 'info.main' }} />;
      default:
        return <AccessTime sx={{ color: 'text.secondary' }} />;
    }
  }, []);

  const getActivityColor = useCallback((type) => {
    switch (type) {
      case 'work':
        return 'success';
      case 'break':
        return 'warning';
      case 'focus':
        return 'info';
      default:
        return 'default';
    }
  }, []);

  // Loading skeleton component
  const TimelineSkeleton = () => (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton variant="text" width={120} height={32} />
          <Skeleton variant="text" width={80} height={20} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width={60} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={60} height={40} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1, mb: 3 }} />
      <Box sx={{ position: 'relative' }}>
        <Skeleton variant="rectangular" width={2} height="100%" sx={{ position: 'absolute', left: 16, top: 0, bgcolor: 'divider' }} />
        {Array.from({ length: 8 }).map((_, index) => (
          <Box key={index} sx={{ position: 'relative', ml: 5, mb: 2 }}>
            <Skeleton variant="circular" width={12} height={12} sx={{ position: 'absolute', left: -24, top: 8 }} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  return (
    <Fade in={!isLoading} timeout={300}>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        {/* Enhanced Compact Header */}
        <Box sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5, color: 'text.primary' }}>
              Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>

          {/* Enhanced Compact Stats */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{
              textAlign: 'center',
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'grey.50',
              minWidth: 70
            }}>
              <Typography variant="h6" fontWeight={600} sx={{ color: 'primary.main' }}>
                {liveStats.sessions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sessions
              </Typography>
            </Box>
            <Box sx={{
              textAlign: 'center',
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'grey.50',
              minWidth: 70
            }}>
              <Typography variant="h6" fontWeight={600} sx={{ color: 'success.main' }}>
                {Math.floor(liveStats.totalTime / 60)}h {liveStats.totalTime % 60}m
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
            {trackingState.isTracking && (
              <Box sx={{
                textAlign: 'center',
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'success.light',
                border: '1px solid',
                borderColor: 'success.main',
                minWidth: 70,
                position: 'relative'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  bgcolor: 'success.main',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: 'success.dark' }}>
                  {formatLiveDuration(liveStats.currentSessionTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

      {/* Enhanced Current Time Indicator */}
      <Box sx={{
        mb: 3,
        p: 3,
        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }} />
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(255, 255, 255, 0.1)'
        }} />
        <AccessTime sx={{ fontSize: 24, zIndex: 1 }} />
        <Box sx={{ zIndex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </Typography>
        </Box>
      </Box>

      {/* Enhanced Active Session Banner */}
      {trackingState.isTracking && trackingState.currentSession && (
        <Fade in={true} timeout={500}>
          <Box sx={{
            mb: 3,
            p: 3,
            bgcolor: 'success.main',
            color: 'white',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
            <Box sx={{
              width: 12,
              height: 12,
              bgcolor: 'white',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite',
              zIndex: 1
            }} />
            <Box sx={{ flex: 1, zIndex: 1 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Currently Tracking
              </Typography>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                <strong>{trackingState.currentApp || 'Unknown App'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {formatLiveDuration(liveStats.currentSessionTime)} • Started {formatTime(new Date(trackingState.currentSession.startTime))}
              </Typography>
              {trackingState.currentSession.windowTitle && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, fontStyle: 'italic' }}>
                  "{trackingState.currentSession.windowTitle}"
                </Typography>
              )}
            </Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              zIndex: 1
            }}>
              <Typography variant="h4" fontWeight={700}>
                {formatLiveDuration(liveStats.currentSessionTime)}
              </Typography>
              <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.3)' }} />
            </Box>
          </Box>
        </Fade>
      )}

      {/* Enhanced Hourly Timeline */}
      <Box sx={{ position: 'relative', mt: 2 }}>
        {/* Timeline Line with gradient */}
        <Box sx={{
          position: 'absolute',
          left: 20,
          top: 0,
          bottom: 0,
          width: 3,
          background: 'linear-gradient(180deg, #667eea 0%, #cbd5e1 100%)',
          borderRadius: 1.5,
          boxShadow: '0 0 8px rgba(102, 126, 234, 0.2)'
        }} />

        {/* Hourly Segments */}
        <Stack spacing={2}>
          {hourlySegments.map((segment) => (
            <Box key={segment.hour} sx={{ position: 'relative', ml: 6 }}>
              {/* Hour Marker with enhanced styling */}
              <Box sx={{
                position: 'absolute',
                left: -28,
                top: 12,
                width: 16,
                height: 16,
                bgcolor: 'background.paper',
                border: '3px solid',
                borderColor: segment.sessions.length > 0 ? 'primary.main' : 'divider',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: segment.sessions.length > 0
                  ? '0 2px 8px rgba(102, 126, 234, 0.25)'
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                zIndex: 2
              }}>
                {segment.sessions.length > 0 && (
                  <Box sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </Box>

              {/* Hour Label with better styling */}
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  left: -80,
                  top: 10,
                  fontWeight: 600,
                  color: segment.sessions.length > 0 ? 'primary.main' : 'text.secondary',
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                {segment.hour === 0 ? '12 AM' :
                 segment.hour < 12 ? `${segment.hour} AM` :
                 segment.hour === 12 ? '12 PM' : `${segment.hour - 12} PM`}
              </Typography>

              {/* Sessions Container */}
              {segment.sessions.length > 0 ? (
                <Box sx={{ ml: 3 }}>
                  {segment.sessions.map((session, sessionIndex) => (
                    <SessionCard
                      key={session.id || `${segment.hour}-${sessionIndex}`}
                      session={session}
                      getActivityIcon={getActivityIcon}
                      getActivityColor={getActivityColor}
                      formatTime={formatTime}
                      formatDuration={formatDuration}
                    />
                  ))}
                </Box>
              ) : (
                // Enhanced empty hour slot
                <Box sx={{
                  ml: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'divider',
                  minHeight: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 0.8,
                    bgcolor: 'grey.100'
                  }
                }}>
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    No activity recorded
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Timeline;