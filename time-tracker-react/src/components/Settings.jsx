import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Stack,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Person,
  Notifications,
  Palette,
  Storage,
  Security,
  Save
} from '@mui/icons-material';
import trackingService from '../services/trackingService';

const Settings = () => {
  const [settings, setSettings] = useState({
    autoStart: false,
    notifications: true,
    soundEnabled: true,
    idleTimeout: 5,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    setSettings(prev => ({ ...prev, ...savedSettings }));
  }, []);

  const handleSave = () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success'
    });
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      trackingService.clearData();
      localStorage.clear();
      setSnackbar({
        open: true,
        message: 'All data cleared successfully!',
        severity: 'info'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={300} sx={{ mb: 2 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your TimeTracker preferences and behavior
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* General Settings */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Person color="primary" />
              <Typography variant="h6" fontWeight={500}>
                General
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoStart}
                    onChange={(e) => updateSetting('autoStart', e.target.checked)}
                    color="primary"
                  />
                }
                label="Start tracking automatically on app launch"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={(e) => updateSetting('notifications', e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable desktop notifications"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable sound notifications"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Tracking Settings */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Notifications color="primary" />
              <Typography variant="h6" fontWeight={500}>
                Tracking
              </Typography>
            </Box>

            <Box sx={{ maxWidth: 300 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Idle timeout (minutes)
              </Typography>
              <TextField
                type="number"
                size="small"
                value={settings.idleTimeout}
                onChange={(e) => updateSetting('idleTimeout', parseInt(e.target.value) || 5)}
                inputProps={{ min: 1, max: 60 }}
                sx={{ width: 120 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Palette color="primary" />
              <Typography variant="h6" fontWeight={500}>
                Appearance
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Theme switching is not yet implemented. Light theme is currently active.
            </Alert>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Storage color="primary" />
              <Typography variant="h6" fontWeight={500}>
                Data Management
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>
                Export Data
              </Button>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>
                Import Data
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={clearAllData}
                sx={{ borderRadius: 2 }}
              >
                Clear All Data
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Security color="primary" />
              <Typography variant="h6" fontWeight={500}>
                Privacy
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch defaultChecked color="primary" />}
                label="Allow anonymous usage statistics"
              />
              <FormControlLabel
                control={<Switch defaultChecked color="primary" />}
                label="Enable crash reporting"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem'
            }}
          >
            Save Settings
          </Button>
        </Box>
      </Stack>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
