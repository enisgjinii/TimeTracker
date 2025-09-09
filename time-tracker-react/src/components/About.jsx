import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Button,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import {
  Schedule,
  Analytics,
  FreeBreakfast,
  Code,
  Memory,
  Build,
  Cloud,
  GitHub,
  Star,
  Favorite,
  Coffee
} from '@mui/icons-material';

const About = () => {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{
            width: 100,
            height: 100,
            bgcolor: 'primary.main',
            fontSize: 48
          }}>
            <Schedule />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight={300} sx={{ mb: 1 }}>
              TimeTracker Pro
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Productivity Analytics Made Simple
            </Typography>
            <Chip label="Version 2.0.0" variant="outlined" />
          </Box>
        </Box>
      </Box>

      <Stack spacing={4}>
        {/* About Section */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={500} sx={{ mb: 3 }}>
              About This App
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              TimeTracker Pro is a powerful desktop application designed to help you
              track and analyze your productivity. Built with React and Tauri, it provides
              a modern, lightweight alternative to traditional time tracking solutions.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              Monitor your work sessions, take breaks, and gain insights into your
              productivity patterns with detailed analytics and reports.
            </Typography>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={500} sx={{ mb: 3 }}>
              Key Features
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                    <Schedule sx={{ color: 'success.dark' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Real-time Tracking
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monitor your activities as you work
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>
                    <Analytics sx={{ color: 'info.dark' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Detailed Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get insights into your productivity patterns
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>
                    <FreeBreakfast sx={{ color: 'warning.dark' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Break Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Take scheduled breaks to maintain productivity
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={500} sx={{ mb: 3 }}>
              Technology Stack
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Code sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight={500}>
                    React
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    18.x
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Memory sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight={500}>
                    Tauri
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2.x
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Build sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight={500}>
                    Vite
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    5.x
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Cloud sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight={500}>
                    Firebase
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    10.x
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Get Involved */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={500} sx={{ mb: 3 }}>
              Get Involved
            </Typography>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<GitHub />}
                sx={{ borderRadius: 2 }}
              >
                View on GitHub
              </Button>
              <Button
                variant="outlined"
                startIcon={<Star />}
                sx={{ borderRadius: 2 }}
              >
                Star on GitHub
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 4,
          mt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Made with <Favorite sx={{ fontSize: 14, color: 'error.main', verticalAlign: 'middle', mx: 0.5 }} />
              by the TimeTracker Team
            </Typography>
            <Typography variant="caption" color="text.secondary">
              © 2024 TimeTracker Pro. All rights reserved.
            </Typography>
          </Box>
          <Button
            variant="text"
            startIcon={<Coffee />}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            Buy me a coffee
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default About;
