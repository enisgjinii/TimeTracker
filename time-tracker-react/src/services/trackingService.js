// Time tracking service for TimeTracker React
import { invoke } from '@tauri-apps/api/core';

class TrackingService {
  constructor() {
    this.isTracking = false;
    this.currentSession = null;
    this.sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    this.listeners = [];
    this.monitoringInterval = null;
    this.currentApp = null;
    this.isAutoTracking = false;

    // If no sessions exist, create some sample data for testing
    if (this.sessions.length === 0) {
      this.sessions = [
        {
          id: Date.now(),
          type: 'work',
          startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          endTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          duration: 1800000, // 30 minutes in milliseconds
          app: 'Chrome'
        },
        {
          id: Date.now() + 1,
          type: 'break',
          startTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          endTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          duration: 600000, // 10 minutes in milliseconds
          app: 'System'
        }
      ];
      this.saveSessions();
    }
  }

  // Subscribe to tracking updates
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notify() {
    this.listeners.forEach(callback => callback(this.getState()));
  }

  // Get current state
  getState() {
    return {
      isTracking: this.isTracking,
      currentSession: this.currentSession,
      sessions: this.sessions,
      isAutoTracking: this.isAutoTracking,
      currentApp: this.currentApp,
    };
  }

  // Start tracking
  startTracking(type = 'work') {
    if (this.isTracking) return;

    this.currentSession = {
      id: Date.now(),
      type,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      app: 'Unknown',
    };

    this.isTracking = true;
    this.notify();
  }

  // Stop tracking
  stopTracking() {
    if (!this.isTracking || !this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    this.sessions.push(this.currentSession);
    this.saveSessions();

    this.isTracking = false;
    this.currentSession = null;
    this.notify();
  }

  // Save sessions to localStorage
  saveSessions() {
    localStorage.setItem('sessions', JSON.stringify(this.sessions));
  }

  // Get today's stats
  getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = this.sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= today && sessionDate < tomorrow;
    });

    const totalTime = todaySessions.reduce((total, session) => total + session.duration, 0);
    const workSessions = todaySessions.filter(session => session.type === 'work').length;

    return {
      totalTime: Math.floor(totalTime / (1000 * 60)), // minutes
      sessions: workSessions,
      focusTime: 0, // Placeholder
      breakTime: 0, // Placeholder
    };
  }

  // Clear all data
  clearData() {
    this.sessions = [];
    this.saveSessions();
    this.notify();
  }

  // Start automatic window tracking
  async startAutoTracking() {
    if (this.isAutoTracking) return;

    console.log('Starting automatic window tracking...');
    this.isAutoTracking = true;

    // Start monitoring active window every 5 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const windowInfo = await invoke('get_active_window');
        console.log('Active window:', windowInfo);

        // If the active window/app has changed, create a new session or update current one
        if (this.currentApp !== windowInfo.app_name) {
          // Stop current session if it exists
          if (this.currentSession) {
            this.stopTracking();
          }

          // Start new session with the current app
          this.currentApp = windowInfo.app_name;
          this.startTracking('work'); // Default to work, could be enhanced with app categorization
          if (this.currentSession) {
            this.currentSession.app = windowInfo.app_name;
            this.currentSession.windowTitle = windowInfo.title;
            this.notify();
          }
        } else {
          // Update window title if it changed
          if (this.currentSession && this.currentSession.windowTitle !== windowInfo.title) {
            this.currentSession.windowTitle = windowInfo.title;
            this.notify();
          }
        }
      } catch (error) {
        console.error('Failed to get active window:', error);
        // Fallback to manual tracking if auto-tracking fails
        if (this.isAutoTracking && !this.currentSession) {
          this.startTracking('work');
        }
      }
    }, 5000); // Check every 5 seconds

    this.notify();
  }

  // Stop automatic window tracking
  stopAutoTracking() {
    if (!this.isAutoTracking) return;

    console.log('Stopping automatic window tracking...');
    this.isAutoTracking = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Stop current session
    if (this.currentSession) {
      this.stopTracking();
    }

    this.currentApp = null;
    this.notify();
  }

  // Get list of running processes (for debugging/monitoring)
  async getRunningProcesses() {
    try {
      const processes = await invoke('get_running_processes');
      console.log('Running processes:', processes);
      return processes;
    } catch (error) {
      console.error('Failed to get running processes:', error);
      return [];
    }
  }

  // Enhanced start tracking with app info
  async startTracking(type = 'work', appName = null) {
    if (this.isTracking) return;

    // If no app name provided and auto-tracking is enabled, try to get current window
    if (!appName && this.isAutoTracking) {
      try {
        const windowInfo = await invoke('get_active_window');
        appName = windowInfo.app_name;
      } catch (error) {
        console.warn('Could not get active window, using default:', error);
        appName = 'Unknown';
      }
    }

    this.currentSession = {
      id: Date.now(),
      type,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      app: appName || 'Unknown',
      windowTitle: null,
    };

    this.isTracking = true;
    this.notify();
  }
}

export const trackingService = new TrackingService();
export default trackingService;
