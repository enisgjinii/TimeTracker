const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
window.$ = window.jQuery = require('jquery');

// Import profile services
const profileService = require('./js/profile-service.js');
const profileUI = require('./js/profile-ui.js');
const profileInit = require('./js/profile-init.js');

const SEG_FILE = path.join(__dirname, 'segments.csv');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
let evs = [];
let curSeg = null;
let track = false;
let zoom = 1.0;
let view = "day";
let theme = "system";
let date = new Date();
date.setHours(0, 0, 0, 0);

// Profile system state
let profileSystemInitialized = false;

// Utility functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

/**
 * Initialize the profile system
 */
const initializeProfileSystem = async () => {
    try {
        // Initialize profile system
        await profileInit.initializeProfileSystem();
        profileSystemInitialized = true;
        console.log('Profile system initialized successfully');
        
        // Update UI with profile data
        updateProfileUI();
        
        // Setup profile-related event listeners
        setupProfileEventListeners();
        
    } catch (error) {
        console.error('Error initializing profile system:', error);
    }
};

/**
 * Update profile UI elements
 */
const updateProfileUI = () => {
    if (!profileSystemInitialized) return;
    
    const profile = profileService.getProfile();
    if (!profile) return;
    
    // Update user display name
    $('.user-display-name').text(profile.displayName || 'User');
    
    // Update user email
    $('.user-email').text(profile.email || '');
    
    // Update user avatar
    if (profile.avatar) {
        $('.user-avatar').html(`<img src="${profile.avatar}" alt="Profile Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`);
    } else {
        $('.user-avatar').html('<i class="fi fi-rr-user"></i>');
    }
    
    // Update work hours indicator
    updateWorkHoursIndicator();
    
    // Update productivity goals
    updateProductivityGoalsDisplay();
};

/**
 * Update work hours indicator
 */
const updateWorkHoursIndicator = () => {
    if (!profileSystemInitialized) return;
    
    const isWorkHours = profileService.isWorkHours();
    const remainingTime = profileService.getRemainingWorkTime();
    
    if (isWorkHours) {
        const hours = Math.floor(remainingTime / 60);
        const minutes = remainingTime % 60;
        $('.work-hours-indicator').html(`
            <span class="badge bg-success small">
                <i class="fi fi-rr-clock me-1"></i>
                Work Hours - ${hours}h ${minutes}m remaining
            </span>
        `);
    } else {
        $('.work-hours-indicator').html(`
            <span class="badge bg-secondary small">
                <i class="fi fi-rr-clock me-1"></i>
                Outside Work Hours
            </span>
        `);
    }
};

/**
 * Update productivity goals display
 */
const updateProductivityGoalsDisplay = () => {
    if (!profileSystemInitialized) return;
    
    const goals = profileService.getProductivityGoals();
    
    $('.daily-work-goal').text(`${goals.dailyWorkGoal}h`);
    $('.weekly-work-goal').text(`${goals.weeklyWorkGoal}h`);
    $('.focus-goal').text(goals.focusGoal);
    $('.break-goal').text(goals.breakGoal);
};

/**
 * Setup profile-related event listeners
 */
const setupProfileEventListeners = () => {
    // User menu button
    $('#user-menu-button').on('click', function() {
        $('#user-menu-dropdown').toggleClass('show');
    });
    
    // Close user menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.user-menu').length) {
            $('#user-menu-dropdown').removeClass('show');
        }
    });
    
    // Profile navigation links
    $('#user-profile-link').on('click', function(e) {
        e.preventDefault();
        showView('settings');
        $('#user-menu-dropdown').removeClass('show');
    });
    
    $('#user-settings-link').on('click', function(e) {
        e.preventDefault();
        showView('settings');
        $('#user-menu-dropdown').removeClass('show');
    });
    
    $('#user-data-link').on('click', function(e) {
        e.preventDefault();
        showView('settings');
        $('#user-menu-dropdown').removeClass('show');
    });
    
    // Logout button
    $('#logout-button').on('click', function(e) {
        e.preventDefault();
        // This should be handled by the auth service
        console.log('Logout requested');
        $('#user-menu-dropdown').removeClass('show');
    });
};

/**
 * Setup pricing modal functionality
 */
const setupPricingModal = () => {
    // Upgrade button in sidebar
    $('#upgrade-btn').on('click', function() {
        $('#pricingModal').modal('show');
    });
    
    // Upgrade to Pro button
    $('#upgrade-pro-btn').on('click', function() {
        // Use the payment UI system if available
        if (window.paymentUI) {
            const proPlan = window.paymentUI.plans.find(p => p.id === 'pro');
            if (proPlan) {
                window.paymentUI.handleUpgrade(proPlan);
            } else {
                handleUpgrade('pro'); // Fallback
            }
        } else {
            handleUpgrade('pro'); // Fallback
        }
    });
    
    // Upgrade to Business button
    $('#upgrade-business-btn').on('click', function() {
        // Use the payment UI system if available
        if (window.paymentUI) {
            const businessPlan = window.paymentUI.plans.find(p => p.id === 'business');
            if (businessPlan) {
                window.paymentUI.handleUpgrade(businessPlan);
            } else {
                handleUpgrade('business'); // Fallback
            }
        } else {
            handleUpgrade('business'); // Fallback
        }
    });
    
    // Contact sales button
    $('#contact-sales-btn').on('click', function() {
        handleContactSales();
    });
    
    // Update current plan display
    updateCurrentPlanDisplay();
};

/**
 * Handle plan upgrade
 */
const handleUpgrade = (plan) => {
    console.log(`Upgrading to ${plan} plan...`);
    
    // Show loading state
    $(`#upgrade-${plan}-btn`).prop('disabled', true).html('<i class="fi fi-rr-spinner fa-spin me-2"></i>Processing...');
    
    // Simulate upgrade process
    setTimeout(() => {
        // Update plan in UI
        updateCurrentPlanDisplay(plan);
        
        // Show success message
        showNotification(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`, 'success');
        
        // Reset button
        $(`#upgrade-${plan}-btn`).prop('disabled', false).html(`<i class="fi fi-rr-crown me-2"></i>Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
        
        // Close modal
        $('#pricingModal').modal('hide');
        
    }, 2000);
};

/**
 * Handle contact sales
 */
const handleContactSales = () => {
    showNotification('Contact sales feature coming soon!', 'info');
};

/**
 * Update current plan display
 */
const updateCurrentPlanDisplay = (plan = 'free') => {
    const planNames = {
        'free': 'Free Plan',
        'pro': 'Pro Plan',
        'business': 'Business Plan'
    };
    
    const planLimits = {
        'free': '10h',
        'pro': 'Unlimited',
        'business': 'Unlimited'
    };
    
    // Update sidebar
    $('#current-plan').text(planNames[plan]);
    
    // Update modal
    $('#current-plan-badge').text(planNames[plan]);
    $('#current-usage').text(`0h / ${planLimits[plan]}`);
    
    // Update usage bar
    const usagePercentage = plan === 'free' ? 25 : 0;
    $('#usage-fill').css('width', `${usagePercentage}%`);
};

/**
 * Show notification
 */
const showNotification = (message, type = 'info') => {
    const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
    const icon = type === 'success' ? 'fi-rr-check' : type === 'error' ? 'fi-rr-cross' : 'fi-rr-info';
    
    const notification = $(`
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="fi ${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    // Add to page
    $('body').append(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.alert('close');
    }, 5000);
};

/**
 * Setup compact settings functionality
 */
const setupCompactSettings = () => {
    // Theme mode buttons
    $('.btn-compact').on('click', function() {
        const $btn = $(this);
        const $group = $btn.closest('.btn-group-compact');
        
        // Remove active class from all buttons in group
        $group.find('.btn-compact').removeClass('active');
        
        // Add active class to clicked button
        $btn.addClass('active');
        
        // Handle specific button actions
        if ($btn.attr('id') === 'lightModeBtn') {
            setThemeMode('light');
        } else if ($btn.attr('id') === 'darkModeBtn') {
            setThemeMode('dark');
        } else if ($btn.attr('id') === 'systemModeBtn') {
            setThemeMode('system');
        }
    });
    
    // Save settings button
    $('#saveSettingsBtn').on('click', function() {
        saveSet();
        showNotification('Settings saved successfully!', 'success');
    });
};

/**
 * Check if user is in work hours for productivity calculations
 */
const isInWorkHours = () => {
    if (!profileSystemInitialized) return true; // Default to true if profile not loaded
    return profileService.isWorkHours();
};

/**
 * Get user's productivity goals
 */
const getUserProductivityGoals = () => {
    if (!profileSystemInitialized) {
        return {
            dailyWorkGoal: 8,
            weeklyWorkGoal: 40,
            focusGoal: 4,
            breakGoal: 4
        };
    }
    return profileService.getProductivityGoals();
};

/**
 * Get user's work preferences
 */
const getUserWorkPreferences = () => {
    if (!profileSystemInitialized) {
        return {
            startTime: '09:00',
            endTime: '17:00',
            workDays: [1, 2, 3, 4, 5],
            lunchBreakDuration: 60
        };
    }
    return profileService.getWorkPreferences();
};

let usrSet = {
  timelineIncrements: 15,
  darkMode: false,
  themeMode: "system",
  useEmojis: true,
  colorCodedEvents: true,
  defaultView: "day",
  enableGrouping: true,
  groupingThreshold: 5, // minutes
  prioritizeWindowId: true, // prioritize Window ID grouping
  showIcons: true,
  categories: ["Work", "Entertainment", "Productivity", "Social"],
  appClassifications: {
    "Visual Studio Code": "Work",
    "Electron": "Productivity",
    "Calculator": "Work",
    "Search": "Work",
    "Zen Browser": "Entertainment",
    "YouTube": "Entertainment",
    "Discord": "Social",
    "Facebook": "Social"
  }
};

const $timeline = $('#timeline');
const $dateLabel = $('#currentDateLabel');
const $appTitle = $('#appTitle');
let lastSegUpdate = 0;

const rmQuotes = str => str.replace(/^"(.*)"$/, '$1');

const getDevIcon = appName => {
  const base = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';
  const appMap = { 'visual studio code': 'vscode', 'vs code': 'vscode' };
  let normName = appName.toLowerCase().trim();
  if (appMap[normName]) normName = appMap[normName];
  return `${base}/${normName}/${normName}-original.svg`;
};

// Flaticon icon mapping for common applications
const getFlaticonIcon = appName => {
  const appNameLower = appName.toLowerCase().trim();
  
  // Common application mappings to Flaticon icons
  const iconMap = {
    // Development tools
    'visual studio code': 'fi-rr-apps',
    'vs code': 'fi-rr-apps',
    'code': 'fi-rr-apps',
    'sublime text': 'fi-rr-apps',
    'atom': 'fi-rr-apps',
    'notepad++': 'fi-rr-apps',
    'webstorm': 'fi-rr-apps',
    'intellij': 'fi-rr-apps',
    'pycharm': 'fi-rr-apps',
    'eclipse': 'fi-rr-apps',
    'netbeans': 'fi-rr-apps',
    
    // Browsers
    'chrome': 'fi-rr-browser',
    'firefox': 'fi-rr-browser',
    'safari': 'fi-rr-browser',
    'edge': 'fi-rr-browser',
    'opera': 'fi-rr-browser',
    'brave': 'fi-rr-browser',
    'browser': 'fi-rr-browser',
    
    // Social media
    'discord': 'fi-rr-comments',
    'slack': 'fi-rr-comments',
    'teams': 'fi-rr-comments',
    'zoom': 'fi-rr-comments',
    'skype': 'fi-rr-comments',
    'whatsapp': 'fi-rr-comments',
    'telegram': 'fi-rr-comments',
    'facebook': 'fi-rr-comments',
    'twitter': 'fi-rr-comments',
    'instagram': 'fi-rr-comments',
    'linkedin': 'fi-rr-comments',
    
    // Productivity
    'word': 'fi-rr-document',
    'excel': 'fi-rr-document',
    'powerpoint': 'fi-rr-document',
    'outlook': 'fi-rr-mail',
    'gmail': 'fi-rr-mail',
    'mail': 'fi-rr-mail',
    'calendar': 'fi-rr-calendar',
    'onenote': 'fi-rr-document',
    'notion': 'fi-rr-document',
    'evernote': 'fi-rr-document',
    
    // Media
    'youtube': 'fi-rr-play',
    'spotify': 'fi-rr-music',
    'netflix': 'fi-rr-play',
    'vimeo': 'fi-rr-play',
    'twitch': 'fi-rr-play',
    'music': 'fi-rr-music',
    'video': 'fi-rr-play',
    
    // System
    'calculator': 'fi-rr-calculator',
    'settings': 'fi-rr-settings',
    'control panel': 'fi-rr-settings',
    'file explorer': 'fi-rr-folder',
    'explorer': 'fi-rr-folder',
    'terminal': 'fi-rr-terminal',
    'cmd': 'fi-rr-terminal',
    'powershell': 'fi-rr-terminal',
    
    // Games
    'steam': 'fi-rr-gamepad',
    'epic': 'fi-rr-gamepad',
    'origin': 'fi-rr-gamepad',
    'battle.net': 'fi-rr-gamepad',
    'game': 'fi-rr-gamepad',
    
    // Design
    'photoshop': 'fi-rr-picture',
    'illustrator': 'fi-rr-picture',
    'figma': 'fi-rr-picture',
    'sketch': 'fi-rr-picture',
    'canva': 'fi-rr-picture',
    'paint': 'fi-rr-picture',
    
    // Development
    'git': 'fi-rr-git',
    'github': 'fi-rr-git',
    'gitlab': 'fi-rr-git',
    'bitbucket': 'fi-rr-git',
    'docker': 'fi-rr-server',
    'postman': 'fi-rr-api',
    'insomnia': 'fi-rr-api',
    
    // Communication
    'outlook': 'fi-rr-mail',
    'thunderbird': 'fi-rr-mail',
    'mail': 'fi-rr-mail',
    'gmail': 'fi-rr-mail',
    
    // Default fallbacks
    'default': 'fi-rr-apps',
    'unknown': 'fi-rr-apps'
  };
  
  // Try exact match first
  if (iconMap[appNameLower]) {
    return iconMap[appNameLower];
  }
  
  // Try partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (appNameLower.includes(key) || key.includes(appNameLower)) {
      return icon;
    }
  }
  
  // Return default icon
  return iconMap.default;
};

const createAppIcon = appNameOrIconData => {
  // Skip icon loading if disabled
  if (!usrSet.showIcons) {
    const hiddenIcon = document.createElement('div');
    hiddenIcon.style.display = 'none';
    return hiddenIcon;
  }
  
  if (appNameOrIconData.startsWith('data:image/png;base64,')) {
    // Use system icon (base64 data)
    const img = document.createElement('img');
    img.classList.add('app-icon');
    img.src = appNameOrIconData;
    img.alt = 'App Icon';
    return img;
  } else {
    // Use Flaticon icon
    const appName = appNameOrIconData;
    const iconElement = document.createElement('i');
    iconElement.classList.add('app-icon', 'fi', getFlaticonIcon(appName));
    iconElement.style.fontSize = '18px';
    iconElement.style.width = '18px';
    iconElement.style.height = '18px';
    iconElement.style.display = 'flex';
    iconElement.style.alignItems = 'center';
    iconElement.style.justifyContent = 'center';
    iconElement.alt = appName;
    return iconElement;
  }
};

const getAppCat = appName => usrSet.appClassifications?.[appName] || "";

const popCats = () => {
  $('#categoriesList').empty();
  usrSet.categories = usrSet.categories || [];
  usrSet.categories.forEach((cat, i) => {
    $('#categoriesList').append(`<div class="d-flex align-items-center justify-content-between p-2 rounded mb-2" style="background-color: var(--accent);">
            <span class="badge bg-secondary me-2">${cat}</span>
            <button class="btn btn-sm btn-outline-danger rm-cat" data-index="${i}" aria-label="Remove category ${cat}">
                <i class="fi fi-rr-cross"></i>
            </button>
        </div>`);
  });
};

const popAppClass = () => {
  $('#appClassificationsList').empty();
  usrSet.appClassifications = usrSet.appClassifications || {};
  for (let app in usrSet.appClassifications) {
    let cat = usrSet.appClassifications[app];
    $('#appClassificationsList').append(`<div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong>${app}</strong> → <em>${cat}</em>
            </div>
            <button class="btn btn-sm btn-outline-danger rm-class" data-app="${app}" aria-label="Remove classification for ${app}">
                <i class="fi fi-rr-cross"></i>
            </button>
        </div>`);
  }
};

$(document).on('click', '.rm-cat', function () {
  usrSet.categories.splice($(this).data('index'), 1);
  popCats();
});
$(document).on('click', '.rm-class', function () {
  delete usrSet.appClassifications[$(this).data('app')];
  popAppClass();
});

const loadSet = () => {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      Object.assign(usrSet, JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')));
    } catch (e) {
      console.error("Error reading settings:", e);
    }
  }
};
const saveSet = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(usrSet, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving settings:", e);
  }
};
const applySet = () => {
  $('body').removeClass('dark-mode');
  $('#lightModeBtn, #darkModeBtn, #systemModeBtn').removeClass('active');
  if (usrSet.themeMode === 'dark') {
    $('body').addClass('dark-mode');
    $('#darkModeBtn').addClass('active');
  } else if (usrSet.themeMode === 'light') {
    $('#lightModeBtn').addClass('active');
  } else {
    $('#systemModeBtn').addClass('active');
  }
  $appTitle.html(usrSet.useEmojis ? "Time Tracker <span>⏳</span>" : "Time Tracker");
  view = usrSet.defaultView || "day";
  // Update view button states
  $('.btn-group .btn').removeClass('active');
  $(`#view${view.charAt(0).toUpperCase() + view.slice(1)}`).addClass('active');
  renderView();
};
const initSetUI = () => {
  $('#timelineIncrements').val(usrSet.timelineIncrements.toString());
  $('#useEmojisCheck').prop('checked', usrSet.useEmojis);
  $('#colorCodedEventsCheck').prop('checked', usrSet.colorCodedEvents);
  $('#enableGroupingCheck').prop('checked', usrSet.enableGrouping !== false);
  $('#prioritizeWindowIdCheck').prop('checked', usrSet.prioritizeWindowId !== false);
  $('#showIconsCheck').prop('checked', usrSet.showIcons !== false);
  $('#defaultViewSelect').val(usrSet.defaultView);
  $('#groupingThreshold').val(usrSet.groupingThreshold || 5);
  popCats();
  popAppClass();
  $('#lightModeBtn, #darkModeBtn, #systemModeBtn').removeClass('active');
  if (usrSet.themeMode === 'dark') {
    $('#darkModeBtn').addClass('active');
  } else if (usrSet.themeMode === 'light') {
    $('#lightModeBtn').addClass('active');
  } else {
    $('#systemModeBtn').addClass('active');
  }
};

$('#saveSettingsBtn').click(() => {
  usrSet.timelineIncrements = parseInt($('#timelineIncrements').val());
  usrSet.useEmojis = $('#useEmojisCheck').is(':checked');
  usrSet.colorCodedEvents = $('#colorCodedEventsCheck').is(':checked');
  usrSet.enableGrouping = $('#enableGroupingCheck').is(':checked');
  usrSet.prioritizeWindowId = $('#prioritizeWindowIdCheck').is(':checked');
  usrSet.showIcons = $('#showIconsCheck').is(':checked');
  usrSet.defaultView = $('#defaultViewSelect').val();
  usrSet.groupingThreshold = parseInt($('#groupingThreshold').val());
  saveSet();
  applySet();
  
  // Show success message
  const successAlert = $(`
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="fi fi-rr-check me-2"></i>Settings saved successfully!
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `);
  $('#settings-view .card-body').first().prepend(successAlert);
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    successAlert.alert('close');
  }, 3000);
});

$('#addCategoryBtn').click(() => {
  let newCat = $('#newCategoryInput').val().trim();
  if (newCat) {
    usrSet.categories = usrSet.categories || [];
    usrSet.categories.push(newCat);
    popCats();
    $('#newCategoryInput').val('');
    saveSet();
  }
});

$('#addClassificationBtn').click(() => {
  let appName = $('#newAppInput').val().trim();
  let newCat = $('#newCategorySelect').val();
  if (appName && newCat) {
    usrSet.appClassifications = usrSet.appClassifications || {};
    usrSet.appClassifications[appName] = newCat;
    popAppClass();
    $('#newAppInput').val('');
    $('#newCategorySelect').val('');
    saveSet();
  }
});

$('#exportDataBtn').click(() => {
  const { dialog } = require('electron').remote;
  dialog.showSaveDialog({
    title: 'Export TimeTracker Data',
    defaultPath: 'timetracker-export.csv',
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      try {
        fs.copyFileSync(SEG_FILE, result.filePath);
        alert('Data exported successfully!');
      } catch (error) {
        alert('Error exporting data: ' + error.message);
      }
    }
  });
});

$('#importDataBtn').click(() => {
  const { dialog } = require('electron').remote;
  dialog.showOpenDialog({
    title: 'Import TimeTracker Data',
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      try {
        fs.copyFileSync(result.filePaths[0], SEG_FILE);
        loadSegCSV();
        renderView();
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data: ' + error.message);
      }
    }
  });
});

$('#clearDataBtn').click(() => {
  if (confirm('Are you sure you want to clear all tracking data? This action cannot be undone.')) {
    try {
      fs.unlinkSync(SEG_FILE);
      evs = [];
      renderView();
      alert('All data cleared successfully!');
    } catch (error) {
      alert('Error clearing data: ' + error.message);
    }
  }
});

$('#lightModeBtn').click(() => setThemeMode('light'));
$('#darkModeBtn').click(() => setThemeMode('dark'));
$('#systemModeBtn').click(() => setThemeMode('system'));

function setThemeMode(mode) {
  usrSet.themeMode = mode;
  saveSet();
  applySet();
}

// Navigation and tracking click handlers are centralized later to avoid duplicates

$('#prevDay').click(() => { 
  if (view === "day") {
    date.setDate(date.getDate() - 1);
  } else if (view === "week") {
    date.setDate(date.getDate() - 7);
  } else if (view === "month") {
    date.setMonth(date.getMonth() - 1);
  }
  renderView(); 
});

$('#todayBtn').click(() => { 
  date = new Date(); 
  date.setHours(0, 0, 0, 0); 
  renderView(); 
});

$('#nextDay').click(() => { 
  if (view === "day") {
    date.setDate(date.getDate() + 1);
  } else if (view === "week") {
    date.setDate(date.getDate() + 7);
  } else if (view === "month") {
    date.setMonth(date.getMonth() + 1);
  }
  renderView(); 
});

// View selector buttons
$('#viewDay').click(() => {
  view = "day";
  $('.btn-group .btn').removeClass('active');
  $('#viewDay').addClass('active');
  renderView();
});

$('#viewWeek').click(() => {
  view = "week";
  $('.btn-group .btn').removeClass('active');
  $('#viewWeek').addClass('active');
  renderView();
});

$('#viewMonth').click(() => {
  view = "month";
  $('.btn-group .btn').removeClass('active');
  $('#viewMonth').addClass('active');
  renderView();
});

const loadSegCSV = () => {
  evs = [];
  console.log('Loading CSV file:', SEG_FILE);
  if (fs.existsSync(SEG_FILE)) {
    try {
      const fileContent = fs.readFileSync(SEG_FILE, 'utf8');
      console.log('CSV file exists, content length:', fileContent.length);
      fileContent.trim().split('\n').forEach(line => {
        let parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 3) {
          let title = rmQuotes(parts[0]);
          let st = parseInt(parts[1]);
          let en = parseInt(parts[2]);
          if (isNaN(st) || isNaN(en)) return;
          let ev = { title, start: st, end: en };
          if (parts.length >= 15) { // Increased for icon data
            ev.details = {
              id: parseInt(parts[3]),
              bounds: { x: parseInt(parts[4]), y: parseInt(parts[5]), width: parseInt(parts[6]), height: parseInt(parts[7]) },
              owner: { name: rmQuotes(parts[8]), processId: parseInt(parts[9]), bundleId: rmQuotes(parts[10]), path: rmQuotes(parts[11]) },
              url: rmQuotes(parts[12]),
              memoryUsage: parseInt(parts[13]),
              icon: rmQuotes(parts[14]),
              productivityScore: parts[15] !== undefined && parts[15] !== '' ? parseInt(parts[15]) : undefined,
              isFocus: parts[16] === '1',
              isIdle: parts[17] === '1'
            };
          }
          evs.push(ev);
        }
      });
      console.log('Loaded events:', evs.length);
    } catch (e) {
      console.error("CSV Error:", e);
    }
  } else {
    console.log('CSV file does not exist');
    // Create some sample data for testing
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    
    evs = [
      {
        title: "Sample Work Session",
        start: twoHoursAgo,
        end: oneHourAgo,
        details: {
          owner: { name: "Sample App" },
          isManual: false
        }
      },
      {
        title: "Sample Break",
        start: oneHourAgo,
        end: now,
        details: {
          owner: { name: "Break App" },
          isManual: false
        }
      }
    ];
    console.log('Created sample data for testing');
  }
};

const saveSegCSV = () => {
  if (!evs?.length) {
    console.error("No events to save.");
    return;
  }
  const csvLines = evs.map(ev => {
    const title = `"${ev.title}"`;
    const start = ev.start;
    const end = ev.end;
    if (ev.details?.id !== undefined) {
      const { details: d } = ev;
      const { bounds = {}, owner = {} } = d;
      const x = bounds.x ?? '';
      const y = bounds.y ?? '';
      const width = bounds.width ?? '';
      const height = bounds.height ?? '';
      const ownerName = `"${owner.name || ''}"`;
      const processId = owner.processId || '';
      const bundleId = `"${owner.bundleId || ''}"`;
      const ownerPath = `"${owner.path || ''}"`;
      const url = `"${d.url || ''}"`;
      const memoryUsage = d.memoryUsage || '';
      const icon = `"${d.icon || ''}"`;
      const productivityScore = d.productivityScore ?? '';
      const isFocus = d.isFocus ? 1 : '';
      const isIdle = d.isIdle ? 1 : '';
      return [title, start, end, d.id, x, y, width, height, ownerName, processId, bundleId, ownerPath, url, memoryUsage, icon, productivityScore, isFocus, isIdle].join(',');
    }
    return [title, start, end].join(',');
  }).join('\n');
  try {
    fs.writeFileSync(SEG_FILE, csvLines, 'utf8');
  } catch (e) {
    console.error("CSV Write Error:", e);
  }
};

const assignLanes = evList => {
  let sorted = [...evList].sort((a, b) => a.start - b.start);
  let lanes = [];
  sorted.forEach(ev => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].at(-1).end <= ev.start) {
        lanes[i].push(ev);
        ev.lane = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([ev]);
      ev.lane = lanes.length - 1;
    }
  });
  return { events: sorted, laneCount: lanes.length };
};

const extractAppName = title => {
  if (title.includes(" - ")) {
    let parts = title.split(" - ");
    let cand = parts.at(-1).trim();
    if (cand.length > 3) return cand;
  }
  return title;
};

const renderDayView = async () => {
  console.log('Rendering day view for date:', date);
  console.log('Total events loaded:', evs.length);
  
  $timeline.show().empty();
  $dateLabel.text(date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }));
  let dayStart = new Date(date.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(date.getTime()); dayEnd.setHours(23, 59, 59, 999);
  let dayEvents = [...evs];
  if (curSeg) dayEvents.push(curSeg);
  dayEvents = dayEvents.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());
  
  console.log('Events for this day:', dayEvents.length);
  
  // Group similar activities
  dayEvents = groupSimilarActivities(dayEvents);
  console.log('Events after grouping:', dayEvents.length);
  
  // Productivity summary
  $('#prod-summary').remove();
  const summary = getDailyProductivitySummary(dayEvents);
  $timeline.before(`<div id="prod-summary" class="alert alert-info mb-2">Total productive minutes: <b>${summary.totalMinutes}</b> | Focus: <b>${summary.focusMinutes}</b> | Idle: <b>${summary.idleMinutes}</b></div>`);
  
  const hourHeight = 40 * zoom;
  const totalHeight = 24 * hourHeight;
  $timeline.css({ height: totalHeight + 'px', position: 'relative' });
  
  // Add hour markers
  for (let hour = 0; hour < 24; hour++) {
    let topPos = hour * hourHeight;
    let labelStr = new Date(dayStart.getTime() + hour * 3600000).toLocaleTimeString([], { hour: '2-digit' });
    $timeline.append(`<div class="hour-label" style="top:${topPos}px;">${labelStr}</div>`, `<div class="timeline-hour" style="top:${topPos}px; height: ${hourHeight}px;"></div>`);
  }
  
  // Add current time indicator
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    const currentTime = now.getTime();
    const timeFromStart = currentTime - dayStart.getTime();
    const topOffset = (timeFromStart / 3600000) * hourHeight;
    
    if (topOffset >= 0 && topOffset <= totalHeight) {
      const timeMarker = $(`
        <div class="current-time-marker" style="top: ${topOffset}px;">
          <div class="current-time-label">${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `);
      $timeline.append(timeMarker);
    }
  }
  
  if (!dayEvents.length) {
    $timeline.append('<p class="text-muted m-3">No events for this date.</p>');
    return dayEvents;
  }
  
  let laneData = assignLanes(dayEvents);
  let laneCount = laneData.laneCount;
  let eventsAreaWidth = $timeline.width() - 100;
  let laneWidth = eventsAreaWidth / laneCount;
  
  dayEvents.forEach(ev => {
    let evStartTime = Math.max(ev.start, dayStart.getTime());
    let evEndTime = Math.min(ev.end, dayEnd.getTime());
    let durationMs = evEndTime - evStartTime;
    if (durationMs < 60000) return;
    
    let topOffset = ((evStartTime - dayStart.getTime()) / 3600000) * hourHeight;
    let blockHeight = (durationMs / 3600000) * hourHeight;
    if (blockHeight < 5) blockHeight = 5;
    
    let isDistraction = /youtube|discord|facebook/i.test(ev.title);
    let colorClass = !usrSet.colorCodedEvents ? "singleColor" : (isDistraction ? "distraction" : "focus");
    let minutes = Math.round(durationMs / 60000);
    let leftOffset = 100 + (ev.lane * laneWidth);
    let blockWidth = laneWidth - 5;
    let titleText = usrSet.useEmojis ? ev.title : ev.title.replace(/[^\w\s]/g, '');
    
    const appName = ev.details?.owner?.name || extractAppName(ev.title);
    const category = ev.details?.isManual ? ev.details.category : getAppCat(appName);
    
    // Use icon from details if available, otherwise use appName for fallback
    const iconData = ev.details?.icon || appName;
    const iconEl = createAppIcon(iconData);
    
    let badgeHTML = category ? `<span class="badge bg-danger me-1">${category}</span>` : "";
    if (ev.details?.isFocus) badgeHTML += `<span class="badge bg-success me-1">Focus</span>`;
    if (ev.details?.isIdle) badgeHTML += `<span class="badge bg-secondary me-1">Idle</span>`;
    
    let wrapper = $('<div/>', {
      class: `entry ${colorClass}`,
      css: { 
        top: topOffset + 'px', 
        left: leftOffset + 'px', 
        width: blockWidth + 'px', 
        height: blockHeight + 'px',
        position: 'absolute'
      },
      data: { event: JSON.stringify(ev) },
      click: () => showSegDetails(ev)
    }).append(iconEl, $('<span/>', {
      style: 'marginLeft:0.5rem; flex: 1',
      html: `${titleText} (${minutes} min)`
    }), $('<div/>', {
      style: 'marginLeft: auto; display: flex; gap: 0.25rem;',
      html: badgeHTML
    }), $('<i/>', {
              class: 'fi fi-rr-trash delete-icon',
      style: 'marginLeft: 0.5rem;',
      click: (e) => {
        e.stopPropagation();
        currentEventForDeletion = ev;
        deleteCurrentEntry();
      }
    }));
    
    $timeline.append(wrapper);
  });
  
  return dayEvents;
};

const renderWeekView = async () => {
  console.log('Rendering week view for date:', date);
  $timeline.show().empty();
  
  // Calculate week start (Monday) and end (Sunday)
  const weekStart = new Date(date);
  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(date.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  $dateLabel.text(`Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`);
  
  let weekEvents = [...evs];
  if (curSeg) weekEvents.push(curSeg);
  weekEvents = weekEvents.filter(ev => ev.end >= weekStart.getTime() && ev.start <= weekEnd.getTime());
  
  console.log('Events for this week:', weekEvents.length);
  
  // Group similar activities
  weekEvents = groupSimilarActivities(weekEvents);
  console.log('Events after grouping:', weekEvents.length);
  
  // Week productivity summary
  const weekSummary = getDailyProductivitySummary(weekEvents);
  $('#prod-summary').remove();
  $timeline.before(`<div id="prod-summary" class="alert alert-info mb-2">Week Summary - Total productive minutes: <b>${weekSummary.totalMinutes}</b> | Focus: <b>${weekSummary.focusMinutes}</b> | Idle: <b>${weekSummary.idleMinutes}</b></div>`);
  
  // Create calendar grid
  const calendarContainer = $('<div/>', {
    class: 'calendar-grid',
    css: {
      display: 'grid',
      gridTemplateColumns: '60px repeat(7, 1fr)',
      gap: '1px',
      backgroundColor: 'var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      border: '1px solid var(--border)'
    }
  });
  
  // Add time column header
  calendarContainer.append($('<div/>', {
    class: 'calendar-header',
    css: {
      backgroundColor: 'var(--card)',
      padding: '0.5rem',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '0.8rem',
      color: 'var(--muted-foreground)'
    },
    text: 'Time'
  }));
  
  // Add day headers
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  dayNames.forEach((dayName, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    const dayNum = dayDate.getDate();
    const isToday = dayDate.toDateString() === new Date().toDateString();
    
    calendarContainer.append($('<div/>', {
      class: 'calendar-header',
      css: {
        backgroundColor: isToday ? 'var(--primary)' : 'var(--card)',
        color: isToday ? 'var(--primary-foreground)' : 'var(--foreground)',
        padding: '0.5rem',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '0.8rem'
      },
      html: `${dayName}<br><small>${dayNum}</small>`
    }));
  });
  
  // Create time slots (24 hours)
  for (let hour = 0; hour < 24; hour++) {
    // Time label
    calendarContainer.append($('<div/>', {
      class: 'time-slot',
      css: {
        backgroundColor: 'var(--card)',
        padding: '0.25rem',
        textAlign: 'right',
        fontSize: '0.7rem',
        color: 'var(--muted-foreground)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      },
      text: `${hour.toString().padStart(2, '0')}:00`
    }));
    
    // Day cells for this hour
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + day);
      const dayStart = new Date(dayDate);
      dayStart.setHours(hour, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(hour, 59, 59, 999);
      
      const cellEvents = weekEvents.filter(ev => 
        ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime()
      );
      
      const cell = $('<div/>', {
        class: 'calendar-cell',
        css: {
          backgroundColor: 'var(--card)',
          padding: '0.25rem',
          minHeight: '40px',
          position: 'relative',
          border: '1px solid var(--border)',
          fontSize: '0.7rem'
        }
      });
      
      // Add events to this cell
      cellEvents.forEach(ev => {
        const evStartTime = Math.max(ev.start, dayStart.getTime());
        const evEndTime = Math.min(ev.end, dayEnd.getTime());
        const durationMs = evEndTime - evStartTime;
        if (durationMs < 60000) return;
        
        const isDistraction = /youtube|discord|facebook/i.test(ev.title);
        const colorClass = !usrSet.colorCodedEvents ? "singleColor" : (isDistraction ? "distraction" : "focus");
        const minutes = Math.round(durationMs / 60000);
        const titleText = usrSet.useEmojis ? ev.title : ev.title.replace(/[^\w\s]/g, '');
        
        const appName = ev.details?.owner?.name || extractAppName(ev.title);
        const category = ev.details?.isManual ? ev.details.category : getAppCat(appName);
        const iconData = ev.details?.icon || appName;
        const iconEl = createAppIcon(iconData);
        
        const eventElement = $('<div/>', {
          class: `calendar-event ${colorClass}`,
          css: {
            backgroundColor: colorClass === 'distraction' ? 'var(--destructive)' : 
                           colorClass === 'focus' ? 'var(--success)' : 'var(--primary)',
            color: 'white',
            padding: '0.1rem 0.25rem',
            borderRadius: '0.2rem',
            marginBottom: '0.1rem',
            fontSize: '0.6rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            maxWidth: '100%',
            overflow: 'hidden'
          },
          data: { event: JSON.stringify(ev) },
          click: () => showSegDetails(ev)
        }).append(
          iconEl,
          $('<span/>', {
            style: 'flex: 1; overflow: hidden; textOverflow: ellipsis; whiteSpace: nowrap;',
            text: `${titleText} (${minutes}m)`
          })
        );
        
        cell.append(eventElement);
      });
      
      calendarContainer.append(cell);
    }
  }
  
  $timeline.append(calendarContainer);
  
  if (!weekEvents.length) {
    $timeline.append('<p class="text-muted m-3">No events for this week.</p>');
  }
  
  return weekEvents;
};

const renderMonthView = async () => {
  console.log('Rendering month view for date:', date);
  $timeline.show().empty();
  
  // Calculate month start and end
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  $dateLabel.text(date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
  
  let monthEvents = [...evs];
  if (curSeg) monthEvents.push(curSeg);
  monthEvents = monthEvents.filter(ev => ev.end >= monthStart.getTime() && ev.start <= monthEnd.getTime());
  
  console.log('Events for this month:', monthEvents.length);
  
  // Group similar activities
  monthEvents = groupSimilarActivities(monthEvents);
  console.log('Events after grouping:', monthEvents.length);
  
  // Month productivity summary
  const monthSummary = getDailyProductivitySummary(monthEvents);
  $('#prod-summary').remove();
  $timeline.before(`<div id="prod-summary" class="alert alert-info mb-2">Month Summary - Total productive minutes: <b>${monthSummary.totalMinutes}</b> | Focus: <b>${monthSummary.focusMinutes}</b> | Idle: <b>${monthSummary.idleMinutes}</b></div>`);
  
  // Calculate calendar grid
  const firstDayOfMonth = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const totalDays = firstDayOfMonth + daysInMonth;
  const weeksInMonth = Math.ceil(totalDays / 7);
  
  // Create calendar grid
  const calendarContainer = $('<div/>', {
    class: 'calendar-grid',
    css: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '1px',
      backgroundColor: 'var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      border: '1px solid var(--border)'
    }
  });
  
  // Add day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(dayName => {
    calendarContainer.append($('<div/>', {
      class: 'calendar-header',
      css: {
        backgroundColor: 'var(--card)',
        padding: '0.5rem',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '0.8rem',
        color: 'var(--muted-foreground)'
      },
      text: dayName
    }));
  });
  
  // Create calendar days
  let dayCount = 1;
  const today = new Date();
  
  for (let week = 0; week < weeksInMonth; week++) {
    for (let day = 0; day < 7; day++) {
      const isCurrentMonth = (week === 0 && day < firstDayOfMonth) ? false : 
                            (dayCount > daysInMonth) ? false : true;
      
      const cell = $('<div/>', {
        class: 'calendar-day-cell',
        css: {
          backgroundColor: 'var(--card)',
          padding: '0.5rem',
          minHeight: '120px',
          position: 'relative',
          border: '1px solid var(--border)',
          fontSize: '0.8rem'
        }
      });
      
      if (isCurrentMonth) {
        const currentDate = new Date(monthStart);
        currentDate.setDate(dayCount);
        const isToday = currentDate.toDateString() === today.toDateString();
        
        // Day number
        cell.append($('<div/>', {
          css: {
            fontWeight: '600',
            fontSize: '1rem',
            marginBottom: '0.5rem',
            color: isToday ? 'var(--primary)' : 'var(--foreground)',
            textAlign: 'center'
          },
          text: dayCount
        }));
        
        // Get events for this day
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEvents = monthEvents.filter(ev => 
          ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime()
        );
        
        // Add events to this day
        dayEvents.forEach(ev => {
          const evStartTime = Math.max(ev.start, dayStart.getTime());
          const evEndTime = Math.min(ev.end, dayEnd.getTime());
          const durationMs = evEndTime - evStartTime;
          if (durationMs < 60000) return;
          
          const isDistraction = /youtube|discord|facebook/i.test(ev.title);
          const colorClass = !usrSet.colorCodedEvents ? "singleColor" : (isDistraction ? "distraction" : "focus");
          const minutes = Math.round(durationMs / 60000);
          const titleText = usrSet.useEmojis ? ev.title : ev.title.replace(/[^\w\s]/g, '');
          
          const appName = ev.details?.owner?.name || extractAppName(ev.title);
          const category = ev.details?.isManual ? ev.details.category : getAppCat(appName);
          const iconData = ev.details?.icon || appName;
          const iconEl = createAppIcon(iconData);
          
          const eventElement = $('<div/>', {
            class: `calendar-event ${colorClass}`,
            css: {
              backgroundColor: colorClass === 'distraction' ? 'var(--destructive)' : 
                             colorClass === 'focus' ? 'var(--success)' : 'var(--primary)',
              color: 'white',
              padding: '0.1rem 0.25rem',
              borderRadius: '0.2rem',
              marginBottom: '0.1rem',
              fontSize: '0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              maxWidth: '100%',
              overflow: 'hidden'
            },
            data: { event: JSON.stringify(ev) },
            click: () => showSegDetails(ev)
          }).append(
            iconEl,
            $('<span/>', {
              style: 'flex: 1; overflow: hidden; textOverflow: ellipsis; whiteSpace: nowrap;',
              text: `${titleText} (${minutes}m)`
            })
          );
          
          cell.append(eventElement);
        });
        
        dayCount++;
      } else {
        // Empty cell for days outside current month
        cell.css({
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)'
        });
      }
      
      calendarContainer.append(cell);
    }
  }
  
  $timeline.append(calendarContainer);
  
  if (!monthEvents.length) {
    $timeline.append('<p class="text-muted m-3">No events for this month.</p>');
  }
  
  return monthEvents;
};

// Debounce mechanism for renderView
let renderViewTimeout = null;

const renderView = async () => {
  // Clear existing timeout
  if (renderViewTimeout) {
    clearTimeout(renderViewTimeout);
  }
  
  // Debounce render calls to prevent excessive updates
  renderViewTimeout = setTimeout(async () => {
    console.log('renderView called, view:', view, 'date:', date);
    loadSegCSV();
    $dateLabel.text(date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    if (view === "day") {
      await renderDayView();
    } else if (view === "week") {
      await renderWeekView();
    } else if (view === "month") {
      await renderMonthView();
    }
  }, 100); // 100ms debounce
};

function showSegDetails(details) {
  // Store the current event for potential deletion
  currentEventForDeletion = details;
  
  const fmtDate = date => date.toLocaleString();
  const durMin = Math.round((details.end - details.start) / 60000);
  let content = `<strong>Title:</strong> ${details.title}<br>
                   <strong>Start:</strong> ${fmtDate(new Date(details.start))}<br>
                   <strong>End:</strong> ${fmtDate(new Date(details.end))}<br>
                   <strong>Duration:</strong> ${durMin} min`;
  
  // Check if this is a grouped event (has multiple original segments)
  if (details.details?.isGrouped) {
    const groupType = details.details.groupType === 'windowId' ? 'Window ID Grouped' : 'Grouped Activity';
    const badgeClass = details.details.groupType === 'windowId' ? 'bg-primary' : 'bg-info';
    content += `<br><span class='badge ${badgeClass}'>${groupType}</span>`;
  }
  
  if (details.details) {
    const d = details.details;
    
    // Handle manual entries
    if (d.isManual) {
      content += `<hr>
                   <strong>Type:</strong> Manual Entry<br>
                   <strong>Category:</strong> ${d.category || 'None'}<br>`;
      if (d.description) {
        content += `<strong>Description:</strong> ${d.description}`;
      }
      if (d.isFocus) content += `<br><span class='badge bg-success'>Focus Session</span>`;
      if (d.isIdle) content += `<br><span class='badge bg-secondary'>Idle</span>`;
      if (d.productivityScore !== undefined) content += `<br><strong>Productivity Score:</strong> ${d.productivityScore}`;
    } else {
      // Handle automatic entries
      const { bounds = {}, owner = {} } = d;
      content += `<hr>
                   <strong>Window ID:</strong> ${d.id || ''}<br>
                   <strong>Bounds:</strong> x: ${bounds.x || ''}, y: ${bounds.y || ''}, width: ${bounds.width || ''}, height: ${bounds.height || ''}<br>
                   <strong>Owner:</strong> ${owner.name || ''} (PID: ${owner.processId || ''})<br>
                   <strong>Bundle ID:</strong> ${owner.bundleId || ''}<br>
                   <strong>Path:</strong> ${owner.path || ''}<br>
                   <strong>URL:</strong> ${d.url || ''}<br>
                   <strong>Memory:</strong> ${d.memoryUsage || ''}`;
      if (d.isFocus) content += `<br><span class='badge bg-success'>Focus Session</span>`;
      if (d.isIdle) content += `<br><span class='badge bg-secondary'>Idle</span>`;
      if (d.productivityScore !== undefined) content += `<br><strong>Productivity Score:</strong> ${d.productivityScore}`;
    }
  }
  $("#segmentDetailsContent").html(content);
  $("#segmentDetailsModal").modal("show");
}

$(document).ready(async () => {
  console.log('Document ready, initializing...');
  loadSet();
  initSetUI();
  applySet();
  
  // Ensure timeline view is visible
  $('#timeline-view').removeClass('d-none');
  $('#settings-view').addClass('d-none');
  $('#about-view').addClass('d-none');
  
  await renderView();
  
  // Update productivity widget
  updateProductivityWidget();
  
  // Update current time indicator every minute
  setInterval(() => {
    if (view === "day") {
      updateCurrentTimeIndicator();
    }
  }, 60000);
  
  // Update productivity widget every 5 minutes
  setInterval(() => {
    updateProductivityWidget();
  }, 300000);
  
  // Initial update
  updateCurrentTimeIndicator();
  
  console.log('Initialization complete');
});

const updateCurrentTimeIndicator = () => {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  
  if (isToday && view === "day") {
    const dayStart = new Date(date.getTime());
    dayStart.setHours(0, 0, 0, 0);
    const currentTime = now.getTime();
    const timeFromStart = currentTime - dayStart.getTime();
    const hourHeight = 40 * zoom;
    const topOffset = (timeFromStart / 3600000) * hourHeight;
    
    // Remove existing time marker
    $('.current-time-marker').remove();
    
    // Add new time marker if within timeline bounds
    if (topOffset >= 0 && topOffset <= 24 * hourHeight) {
      const timeMarker = $(`
        <div class="current-time-marker" style="top: ${topOffset}px;">
          <div class="current-time-label">${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `);
      $timeline.append(timeMarker);
    }
  } else {
    // Remove time marker for week/month views
    $('.current-time-marker').remove();
  }
};

// --- ADVANCED TRACKING LOGIC ---
let lastActivityTime = Date.now();
const IDLE_THRESHOLD = 3 * 60 * 1000; // 3 minutes
const FOCUS_THRESHOLD = 25 * 60 * 1000; // 25 minutes

function isIdle(now) {
  return now - lastActivityTime > IDLE_THRESHOLD;
}

function getProductivityScore(ev) {
  // Check if we're in work hours (if profile system is available)
  const inWorkHours = isInWorkHours();
  
  // Simple scoring: Work/Productivity = 2, Social/Entertainment = 0, else 1
  const cat = ev.details?.category || getAppCat(ev.details?.owner?.name || ev.title);
  
  // Adjust scoring based on work hours
  if (inWorkHours) {
    // During work hours, be more strict about productivity
    if (["Work", "Productivity"].includes(cat)) return 2;
    if (["Social", "Entertainment"].includes(cat)) return 0;
    return 1;
  } else {
    // Outside work hours, be more lenient
    if (["Work", "Productivity"].includes(cat)) return 1.5;
    if (["Social", "Entertainment"].includes(cat)) return 0.5;
    return 1;
  }
}

function isFocusSession(ev) {
  return (ev.end - ev.start) >= FOCUS_THRESHOLD && getProductivityScore(ev) === 2;
}

// Active window data handling is centralized in setupActivityTracking()

// Add analytics function for trends
function getDailyProductivitySummary(dayEvents) {
  let total = 0, focus = 0, idle = 0;
  for (const ev of dayEvents) {
    if (ev.details?.isIdle) idle += (ev.end - ev.start);
    else if (ev.details?.isFocus) focus += (ev.end - ev.start);
    total += (ev.end - ev.start) * (getProductivityScore(ev) / 2);
  }
  return { totalMinutes: Math.round(total / 60000), focusMinutes: Math.round(focus / 60000), idleMinutes: Math.round(idle / 60000) };
}

// Update productivity widget
function updateProductivityWidget() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);
  
  const todayEvents = evs.filter(ev => 
    ev.end >= today.getTime() && ev.start <= dayEnd.getTime()
  );
  
  const summary = getDailyProductivitySummary(todayEvents);
  
  // Update metric values
  $('#productiveMinutes').text(summary.totalMinutes);
  $('#focusMinutes').text(summary.focusMinutes);
  $('#idleMinutes').text(summary.idleMinutes);
  
  // Get user's productivity goals from profile system
  const goals = getUserProductivityGoals();
  const maxProductiveMinutes = goals.dailyWorkGoal * 60; // Convert hours to minutes
  const progressPercentage = Math.min(Math.round((summary.totalMinutes / maxProductiveMinutes) * 100), 100);
  $('#progressPercentage').text(`${progressPercentage}%`);
  
  // Update progress ring
  const circumference = 157; // 2 * π * 25
  const progressOffset = circumference - (progressPercentage / 100) * circumference;
  $('#progressCircle').css('stroke-dashoffset', progressOffset);
  
  // Update motivational message based on progress and goals
  let motivationalMessage = '';
  if (progressPercentage === 0) {
    motivationalMessage = 'Start your productive day!';
  } else if (progressPercentage < 25) {
    motivationalMessage = 'Great start! Keep going!';
  } else if (progressPercentage < 50) {
    motivationalMessage = 'You\'re making progress!';
  } else if (progressPercentage < 75) {
    motivationalMessage = 'Excellent work today!';
  } else if (progressPercentage < 100) {
    motivationalMessage = 'Almost there! Amazing!';
  } else {
    motivationalMessage = 'Perfect! You\'re unstoppable!';
  }
  $('#motivationalMessage').text(motivationalMessage);
  
  // Add animation class for visual feedback
  $('.productivity-widget').addClass('updated');
  setTimeout(() => {
    $('.productivity-widget').removeClass('updated');
  }, 1000);
  
  // Update quick stats
  updateQuickStats(todayEvents);
  
  // Update profile UI if system is initialized
  if (profileSystemInitialized) {
    updateProfileUI();
  }
}

// Update quick stats in sidebar
function updateQuickStats(todayEvents) {
  // Calculate total hours
  const totalMinutes = todayEvents.reduce((total, ev) => {
    return total + Math.round((ev.end - ev.start) / (1000 * 60));
  }, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
  
  // Count unique sessions (events with gaps > 5 minutes)
  let sessionCount = 0;
  if (todayEvents.length > 0) {
    sessionCount = 1; // Start with first session
    for (let i = 1; i < todayEvents.length; i++) {
      const gap = todayEvents[i].start - todayEvents[i-1].end;
      if (gap > 5 * 60 * 1000) { // 5 minutes gap
        sessionCount++;
      }
    }
  }
  
  // Calculate focus and break time
  const focusEvents = todayEvents.filter(ev => 
    ev.category === 'Focus' || 
    ev.category === 'Work' || 
    ev.details?.isFocus || 
    ev.details?.productivityScore > 0.7
  );
  const breakEvents = todayEvents.filter(ev => 
    ev.category === 'Break' || 
    ev.category === 'Idle' || 
    ev.details?.isIdle
  );
  
  const focusMinutes = focusEvents.reduce((total, ev) => {
    return total + Math.round((ev.end - ev.start) / (1000 * 60));
  }, 0);
  const breakMinutes = breakEvents.reduce((total, ev) => {
    return total + Math.round((ev.end - ev.start) / (1000 * 60));
  }, 0);
  
  const focusHours = Math.round(focusMinutes / 60 * 10) / 10;
  const breakHours = Math.round(breakMinutes / 60 * 10) / 10;
  
  $('#today-hours').text(totalHours + 'h');
  $('#today-sessions').text(sessionCount);
  $('#today-focus').text(focusHours + 'h');
  $('#today-breaks').text(breakHours + 'h');
  
  // Update usage text and progress bar
  const usagePercent = Math.min((totalHours / 10) * 100, 100);
  $('#usage-text').text(`${totalHours}h / 10h`);
  $('#usage-fill').css('width', `${usagePercent}%`);
}

// Group similar window activities - prioritize Window ID grouping
function groupSimilarActivities(events, maxGapMs = null) {
  if (!events || events.length === 0) return events;
  
  // Skip grouping if disabled
  if (!usrSet.enableGrouping) return events;
  
  // Use user setting or default to 5 minutes
  const threshold = maxGapMs || (usrSet.groupingThreshold || 5) * 60 * 1000;
  
  const sortedEvents = [...events].sort((a, b) => a.start - b.start);
  const groupedEvents = [];
  let currentGroup = null;
  
  for (const event of sortedEvents) {
    const windowId = event.details?.id;
    const title = event.title;
    const ownerName = event.details?.owner?.name;
    
    // Skip idle events from grouping
    if (event.details?.isIdle) {
      if (currentGroup) {
        groupedEvents.push(currentGroup);
        currentGroup = null;
      }
      groupedEvents.push(event);
      continue;
    }
    
    // Check if this event can be grouped with the current group
    // Priority: Window ID > Title > Owner Name (if prioritizeWindowId is enabled)
    const canGroup = currentGroup && (event.start - currentGroup.end) <= threshold && (
      // Same Window ID (highest priority if enabled)
      (usrSet.prioritizeWindowId && currentGroup.details?.id === windowId && windowId !== undefined) ||
      // Same title and owner (fallback or when Window ID priority is disabled)
      (currentGroup.title === title && currentGroup.details?.owner?.name === ownerName)
    );
    
    if (canGroup) {
      // Extend the current group
      currentGroup.end = event.end;
      
      // Ensure details object exists
      if (!currentGroup.details) {
        currentGroup.details = {};
      }
      
      currentGroup.details.productivityScore = getProductivityScore(currentGroup);
      currentGroup.details.isGrouped = true; // Mark as grouped
      
      // Update focus status if either event was a focus session
      if (event.details?.isFocus) {
        currentGroup.details.isFocus = true;
      }
      
      // Mark group type for better identification
      if (currentGroup.details?.id === windowId && windowId !== undefined) {
        currentGroup.details.groupType = 'windowId';
      } else {
        currentGroup.details.groupType = 'titleAndOwner';
      }
      
    } else {
      // Start a new group
      if (currentGroup) {
        groupedEvents.push(currentGroup);
      }
      currentGroup = { ...event };
      
      // Ensure details object exists for new group
      if (!currentGroup.details) {
        currentGroup.details = {};
      }
    }
  }
  
  // Add the last group
  if (currentGroup) {
    groupedEvents.push(currentGroup);
  }
  
  return groupedEvents;
}

$(document).keydown(e => {
  if (e.ctrlKey) {
    if (e.key === ',') zoom = Math.min(10.0, zoom + 0.2);
    else if (e.key === '.') zoom = Math.max(0.1, zoom - 0.2);
    renderView();
  }
});

// Manual Entry Functionality
const initializeManualEntry = () => {
  // Populate category dropdown
  const categorySelect = $('#entryCategory');
  categorySelect.empty().append('<option value="">Select category (optional)</option>');
  if (usrSet.categories) {
    usrSet.categories.forEach(category => {
      categorySelect.append(`<option value="${category}">${category}</option>`);
    });
  }
  
  // Set default times to current date
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 16);
  $('#entryStartTime').val(dateStr);
  $('#entryEndTime').val(dateStr);
};

const openManualEntryModal = () => {
  initializeManualEntry();
  $('#manualEntryModal').modal('show');
};

const saveManualEntry = () => {
  const title = $('#entryTitle').val().trim();
  const category = $('#entryCategory').val();
  const startTime = $('#entryStartTime').val();
  const endTime = $('#entryEndTime').val();
  const description = $('#entryDescription').val().trim();
  
  if (!title || !startTime || !endTime) {
    alert('Please fill in all required fields (Title, Start Time, End Time)');
    return;
  }
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  if (startDate >= endDate) {
    alert('End time must be after start time');
    return;
  }
  
  // Create manual entry
  const manualEntry = {
    title: title,
    start: startDate.getTime(),
    end: endDate.getTime(),
    details: {
      owner: { name: 'Manual Entry' },
      isManual: true,
      description: description,
      category: category
    }
  };
  
  // Add to events array
  evs.push(manualEntry);
  
  // Save to CSV
  saveSegCSV();
  
  // Close modal and refresh view
  $('#manualEntryModal').modal('hide');
  $('#manualEntryForm')[0].reset();
  
  // Show success message
  const successAlert = $(`
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="fi fi-rr-check me-2"></i>Manual entry added successfully!
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `);
  $('#timeline-view .card-body').first().prepend(successAlert);
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    successAlert.alert('close');
  }, 3000);
  
  // Refresh the timeline view
  renderView();
};

// Event listeners for manual entry
$('#addEntryBtn').click(openManualEntryModal);
$('#saveManualEntryBtn').click(saveManualEntry);

// Delete entry functionality
let currentEventForDeletion = null;

const deleteCurrentEntry = () => {
  if (!currentEventForDeletion) {
    console.error('No event selected for deletion');
    return;
  }
  
  const duration = Math.round((currentEventForDeletion.end - currentEventForDeletion.start) / 60000);
  const startTime = new Date(currentEventForDeletion.start).toLocaleString();
  const endTime = new Date(currentEventForDeletion.end).toLocaleString();
  
  const confirmMessage = `Are you sure you want to delete this time entry?\n\n` +
    `Title: ${currentEventForDeletion.title}\n` +
    `Duration: ${duration} minutes\n` +
    `Start: ${startTime}\n` +
    `End: ${endTime}\n\n` +
    `This action cannot be undone.`;
  
  if (confirm(confirmMessage)) {
    try {
      // Find and remove the event from the events array
      const eventIndex = evs.findIndex(ev => 
        ev.title === currentEventForDeletion.title && 
        ev.start === currentEventForDeletion.start && 
        ev.end === currentEventForDeletion.end
      );
      
      if (eventIndex !== -1) {
        evs.splice(eventIndex, 1);
        saveSegCSV();
        
        // Close the modal
        $('#segmentDetailsModal').modal('hide');
        
        // Show success message
          const successAlert = $(`
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="fi fi-rr-check me-2"></i>Time entry deleted successfully!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        `);
        $('#timeline-view .card-body').first().prepend(successAlert);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          successAlert.alert('close');
        }, 3000);
        
        // Refresh the timeline view
        renderView();
        
        // Clear the current event
        currentEventForDeletion = null;
      } else {
        alert('Error: Could not find the entry to delete.');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry: ' + error.message);
    }
  }
};

// Event handler for delete button
$('#deleteEntryBtn').click(deleteCurrentEntry);

// Clear current event when modal is closed
$('#segmentDetailsModal').on('hidden.bs.modal', () => {
  currentEventForDeletion = null;
});

// Initialize manual entry when document is ready
$(document).ready(() => {
  initializeManualEntry();
  
  // Initialize profile system
  initializeProfileSystem();
  
  // Initialize pricing modal and compact settings
  setupPricingModal();
  setupCompactSettings();
  
  // Load settings and apply them
  loadSet();
  applySet();
  
  // Initialize settings UI
  initSetUI();
  
  // Load segments and render initial view
  loadSegCSV();
  renderView();
  
  // Setup periodic updates
  setInterval(() => {
    updateCurrentTimeIndicator();
    updateWorkHoursIndicator(); // Update work hours indicator
  }, 60000); // Update every minute
  
  // Setup activity tracking
  setupActivityTracking();
  
  // Setup periodic segment saving and UI updates
  setInterval(() => {
    if (track && curSeg) {
      // Update current segment end time
      curSeg.end = new Date();
      
      // Save to CSV periodically
      saveSegCSV();
      
      // Update quick stats without triggering full render
      const todayEvents = evs.filter(ev => {
        const evDate = new Date(ev.start);
        return evDate.toDateString() === date.toDateString();
      });
      updateQuickStats(todayEvents);
    }
  }, 30000); // Update every 30 seconds
  
  // Update tracking status every second when tracking
  setInterval(() => {
    if (track) {
      updateTrackingStatus();
    }
  }, 1000);
  
  // Setup theme change listeners
  $('#lightModeBtn').click(() => setThemeMode('light'));
  $('#darkModeBtn').click(() => setThemeMode('dark'));
  $('#systemModeBtn').click(() => setThemeMode('system'));
  
  // Setup navigation (dedupe handlers)
  $('#nav-timeline').off('click').on('click', (e) => { e.preventDefault(); showView('timeline'); });
  $('#nav-settings').off('click').on('click', (e) => { e.preventDefault(); showView('settings'); });
  $('#nav-about').off('click').on('click', (e) => { e.preventDefault(); showView('about'); });
  
  // Setup view buttons
  $('#viewDay').off('click').on('click', () => { view = 'day'; renderView(); });
  $('#viewWeek').off('click').on('click', () => { view = 'week'; renderView(); });
  $('#viewMonth').off('click').on('click', () => { view = 'month'; renderView(); });
  
  // Setup date navigation
  $('#prevDay').off('click').on('click', () => { date.setDate(date.getDate() - 1); renderView(); });
  $('#nextDay').off('click').on('click', () => { date.setDate(date.getDate() + 1); renderView(); });
  $('#todayBtn').off('click').on('click', () => { date = new Date(); date.setHours(0, 0, 0, 0); renderView(); });
  
  // Setup tracking toggle
  $('#toggleTracking').off('click').on('click', () => { track ? stopTracking() : startTracking(); });
  
  // Setup new sidebar buttons
  $('#refresh-stats').click(() => {
    updateQuickStats([]);
    showNotification('Stats refreshed', 'info');
  });
  
  $('#quick-break').click(() => {
    if (track) {
      // Add a break entry
      const breakEntry = {
        start: new Date(),
        end: new Date(Date.now() + 5 * 60 * 1000), // 5 minute break
        app: 'Break',
        title: 'Quick Break',
        category: 'Break'
      };
      evs.push(breakEntry);
      saveSegCSV();
      showNotification('Break logged', 'success');
      renderView();
    } else {
      showNotification('Start tracking first', 'warning');
    }
  });
  
  $('#focus-mode').click(() => {
    if (track) {
      // Switch to focus mode
      if (curSeg) {
        curSeg.category = 'Focus';
        curSeg.title = 'Focus Session';
      }
      showNotification('Focus mode activated', 'success');
    } else {
      showNotification('Start tracking first', 'warning');
    }
  });
  
  $('#manual-entry').click(() => {
    $('#manualEntryModal').modal('show');
  });
  
  // Setup settings save
  $('#saveSettingsBtn').click(() => {
    usrSet.timelineIncrements = parseInt($('#timelineIncrements').val());
    usrSet.useEmojis = $('#useEmojisCheck').is(':checked');
    usrSet.colorCodedEvents = $('#colorCodedEventsCheck').is(':checked');
    usrSet.enableGrouping = $('#enableGroupingCheck').is(':checked');
    usrSet.prioritizeWindowId = $('#prioritizeWindowIdCheck').is(':checked');
    usrSet.showIcons = $('#showIconsCheck').is(':checked');
    usrSet.defaultView = $('#defaultViewSelect').val();
    usrSet.groupingThreshold = parseInt($('#groupingThreshold').val());
    saveSet();
    applySet();
    
    // Show success message
    const successAlert = $(`
      <div class="alert alert-success alert-dismissible fade show" role="alert">
        <i class="fi fi-rr-check me-2"></i>Settings saved successfully!
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `);
    $('#settings-view .card-body').first().prepend(successAlert);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      successAlert.alert('close');
    }, 3000);
  });
});

/**
 * Show different views (timeline, settings, about)
 */
function showView(viewName) {
    // Hide all views
    $('#timeline-view, #settings-view, #about-view').addClass('d-none');
    
    // Show selected view
    $(`#${viewName}-view`).removeClass('d-none');
    
    // Update navigation
    $('.nav-link').removeClass('active');
    $(`#nav-${viewName}`).addClass('active');
    
    // Render view if timeline
    if (viewName === 'timeline') {
        renderView();
    }
}

/**
 * Start tracking user activity
 */
function startTracking() {
    track = true;
    curSeg = {
        start: new Date(),
        end: null,
        app: 'Active Session',
        title: 'Active Session',
        category: 'Work',
        details: {
            isManual: false,
            isFocus: false,
            productivityScore: 1
        }
    };
    
    const trackingBtn = $('#toggleTracking');
    trackingBtn.removeClass('btn-primary').addClass('btn-danger');
    trackingBtn.find('.tracking-text').text('Stop Tracking');
    trackingBtn.find('.tracking-icon').removeClass('fi-rr-play').addClass('fi-rr-stop');
    trackingBtn.find('.tracking-pulse').show();
    
    // Add pulse animation
    trackingBtn.addClass('pulse-animation');
    
    // Show success message
    const successAlert = $(`
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fi fi-rr-check me-2"></i>Activity tracking started! Monitoring your activity...
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    $('#timeline-view .card-body').first().prepend(successAlert);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        successAlert.alert('close');
    }, 3000);
    
    // Update sidebar stats and start periodic updates
    updateQuickStats([]);
    updateTrackingStatus();
    
    // Start fallback tracking if window monitoring isn't working
    startFallbackTracking();
}

/**
 * Fallback tracking system that works without window monitoring
 */
function startFallbackTracking() {
    let lastActivity = Date.now();
    let isIdle = false;
    
    // Track user activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            if (!track) return;
            
            const now = Date.now();
            lastActivity = now;
            
            // If user was idle, start new active session
            if (isIdle) {
                isIdle = false;
                
                // End idle session
                if (curSeg && curSeg.category === 'Idle') {
                    curSeg.end = new Date();
                    evs.push({ ...curSeg });
                }
                
                // Start new active session
                curSeg = {
                    start: new Date(),
                    end: null,
                    app: 'Active Session',
                    title: 'Active Session',
                    category: 'Work',
                    details: {
                        isManual: false,
                        isFocus: false,
                        productivityScore: 1
                    }
                };
            }
        });
    });
    
    // Check for idle status every 30 seconds
    setInterval(() => {
        if (!track) return;
        
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;
        const idleThreshold = 5 * 60 * 1000; // 5 minutes
        
        if (timeSinceActivity > idleThreshold && !isIdle) {
            isIdle = true;
            
            // End current session
            if (curSeg && curSeg.category !== 'Idle') {
                curSeg.end = new Date();
                evs.push({ ...curSeg });
            }
            
            // Start idle session
            curSeg = {
                start: new Date(),
                end: null,
                app: 'Idle',
                title: 'Idle Period',
                category: 'Idle',
                details: {
                    isIdle: true,
                    isManual: false,
                    isFocus: false,
                    productivityScore: 0
                }
            };
        }
    }, 30000);
}

/**
 * Update tracking status display
 */
function updateTrackingStatus() {
    if (!track) return;
    
    const now = new Date();
    const duration = curSeg ? Math.floor((now - curSeg.start) / 1000) : 0;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    const timeString = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update tracking button text with duration
    $('#toggleTracking .tracking-text').text(`Stop Tracking (${timeString})`);
    
    // Update current activity display if exists
    if (curSeg) {
        $('#current-activity').text(curSeg.title || 'Active Session');
    }
}

/**
 * Setup activity tracking system
 */
function setupActivityTracking() {
    let lastActivity = Date.now();
    let idleThreshold = 5 * 60 * 1000; // 5 minutes
    let isIdle = false;
    let lastWindowData = null;
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
            if (isIdle) {
                isIdle = false;
                handleUserActive();
            }
        });
    });
    
    // Request window activity data from main process
    function requestWindowData() {
        if (track && window.require) {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('request-active-window');
        }
    }
    
    // Listen for window data from main process
    if (window.require) {
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('active-window-data', (event, data) => {
            if (!track) return;
            
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;
            
            // Check if user is idle
            if (timeSinceActivity > idleThreshold) {
                if (!isIdle) {
                    isIdle = true;
                    handleUserIdle();
                }
                return;
            }
            
            // User is active, process window data
            if (isIdle) {
                isIdle = false;
                handleUserActive();
            }
            
            // Update current segment with window data
            if (curSeg) {
                // Check if window changed
                if (lastWindowData && lastWindowData.title !== data.title) {
                    // End current segment
                    curSeg.end = new Date();
                    evs.push({ ...curSeg });
                    
                    // Start new segment
                    curSeg = {
                        start: new Date(),
                        end: null,
                        app: data.owner?.name || 'Unknown',
                        title: data.title || 'Unknown Window',
                        category: getAppCategory(data.owner?.name || data.title),
                        details: {
                            owner: data.owner,
                            bounds: data.bounds,
                            id: data.id,
                            url: data.url,
                            memoryUsage: data.memoryUsage,
                            isFocus: false,
                            productivityScore: 0
                        }
                    };
                } else {
                    // Update current segment
                    curSeg.end = new Date();
                    curSeg.app = data.owner?.name || 'Unknown';
                    curSeg.title = data.title || 'Unknown Window';
                    curSeg.category = getAppCategory(data.owner?.name || data.title);
                    curSeg.details = {
                        owner: data.owner,
                        bounds: data.bounds,
                        id: data.id,
                        url: data.url,
                        memoryUsage: data.memoryUsage,
                        isFocus: false,
                        productivityScore: getProductivityScore(curSeg)
                    };
                }
                
                lastWindowData = data;
            }
        });
    }
    
    // Request window data periodically when tracking
    setInterval(() => {
        if (track) {
            requestWindowData();
        }
    }, 10000); // Every 10 seconds
    
    // Check for idle status every 30 seconds
    setInterval(() => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;
        
        if (timeSinceActivity > idleThreshold && !isIdle && track) {
            isIdle = true;
            handleUserIdle();
        }
    }, 30000);
    
    // Handle user becoming active
    function handleUserActive() {
        if (track && curSeg) {
            // End idle period and start new active session
            if (curSeg.category === 'Idle') {
                curSeg.end = new Date();
                evs.push({ ...curSeg });
                
                // Start new active session
                curSeg = {
                    start: new Date(),
                    end: null,
                    app: 'Active Session',
                    title: 'Active Session',
                    category: 'Work'
                };
            }
        }
    }
    
    // Handle user becoming idle
    function handleUserIdle() {
        if (track && curSeg && curSeg.category !== 'Idle') {
            // End current session and start idle period
            curSeg.end = new Date();
            evs.push({ ...curSeg });
            
            // Start idle session
            curSeg = {
                start: new Date(),
                end: null,
                app: 'Idle',
                title: 'Idle Period',
                category: 'Idle'
            };
        }
    }
    
    // Helper function to categorize applications
    function getAppCategory(appName) {
        if (!appName) return 'Unknown';
        
        const workApps = ['chrome', 'firefox', 'safari', 'edge', 'code', 'visual studio', 'intellij', 'webstorm', 'sublime', 'atom', 'notepad++', 'excel', 'word', 'powerpoint', 'outlook', 'teams', 'slack', 'discord', 'zoom', 'skype'];
        const socialApps = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'netflix', 'spotify', 'twitch', 'reddit'];
        const productivityApps = ['notion', 'trello', 'asana', 'jira', 'confluence', 'figma', 'adobe', 'photoshop', 'illustrator'];
        
        const lowerAppName = appName.toLowerCase();
        
        if (workApps.some(app => lowerAppName.includes(app))) return 'Work';
        if (socialApps.some(app => lowerAppName.includes(app))) return 'Social';
        if (productivityApps.some(app => lowerAppName.includes(app))) return 'Productivity';
        
        return 'Other';
    }
}

/**
 * Stop tracking user activity
 */
function stopTracking() {
    track = false;
    
    const trackingBtn = $('#toggleTracking');
    trackingBtn.removeClass('btn-danger').addClass('btn-primary');
    trackingBtn.find('.tracking-text').text('Start Tracking');
    trackingBtn.find('.tracking-icon').removeClass('fi-rr-stop').addClass('fi-rr-play');
    trackingBtn.find('.tracking-pulse').hide();
    trackingBtn.removeClass('pulse-animation');
    
    // Save current segment if exists
    if (curSeg) {
        curSeg.end = new Date();
        evs.push({ ...curSeg });
        saveSegCSV();
        curSeg = null;
    }
    
    // Show success message
    const successAlert = $(`
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fi fi-rr-check me-2"></i>Activity tracking stopped!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    $('#timeline-view .card-body').first().prepend(successAlert);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        successAlert.alert('close');
    }, 3000);
    
    // Refresh view and update stats
    renderView();
    updateQuickStats([]);
}