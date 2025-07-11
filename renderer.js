const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
window.$ = window.jQuery = require('jquery');

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

$('#nav-timeline').click(() => {
    $('#timeline-view').removeClass('d-none');
    $('#settings-view').addClass('d-none');
    $('#about-view').addClass('d-none');
    $('.nav-link').removeClass('active');
    $('#nav-timeline').addClass('active');
});

$('#nav-settings').click(() => {
    $('#timeline-view').addClass('d-none');
    $('#settings-view').removeClass('d-none');
    $('#about-view').addClass('d-none');
    $('.nav-link').removeClass('active');
    $('#nav-settings').addClass('active');
    
    // Populate category select for app classifications
    $('#newCategorySelect').empty();
    $('#newCategorySelect').append('<option value="">Select category...</option>');
    usrSet.categories.forEach(cat => {
        $('#newCategorySelect').append(`<option value="${cat}">${cat}</option>`);
    });
});

$('#nav-about').click(() => {
    $('#timeline-view').addClass('d-none');
    $('#settings-view').addClass('d-none');
    $('#about-view').removeClass('d-none');
    $('.nav-link').removeClass('active');
    $('#nav-about').addClass('active');
});

$('#toggleTracking').click(() => {
  track = !track;
  const $button = $('#toggleTracking');
  const $icon = $button.find('i');
  const $text = $button.find('.tracking-text');
  
  if (track) {
    $button.removeClass('btn-primary').addClass('btn-danger');
    $icon.removeClass('fi-rr-play').addClass('fi-rr-pause');
    $text.text('Stop Tracking');
  } else {
    $button.removeClass('btn-danger').addClass('btn-primary');
    $icon.removeClass('fi-rr-pause').addClass('fi-rr-play');
    $text.text('Start Tracking');
    
    // When stopping tracking, save current segment if exists
    if (curSeg) {
      evs.push(curSeg);
      saveSegCSV();
      curSeg = null;
    }
    renderView();
  }
});

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

const renderView = async () => {
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
  // Simple scoring: Work/Productivity = 2, Social/Entertainment = 0, else 1
  const cat = ev.details?.category || getAppCat(ev.details?.owner?.name || ev.title);
  if (["Work", "Productivity"].includes(cat)) return 2;
  if (["Social", "Entertainment"].includes(cat)) return 0;
  return 1;
}

function isFocusSession(ev) {
  return (ev.end - ev.start) >= FOCUS_THRESHOLD && getProductivityScore(ev) === 2;
}

// Patch the ipcRenderer event handler for advanced logic
ipcRenderer.on('active-window-data', (e, data) => {
  if (!track) return;
  const now = Date.now();
  if (isIdle(now)) {
    // Insert idle segment if user was idle
    if (curSeg) {
      curSeg.end = lastActivityTime;
      evs.push({ ...curSeg });
      evs.push({
        title: 'Idle',
        start: lastActivityTime,
        end: now,
        details: { isIdle: true, owner: { name: 'Idle' }, category: 'Idle' }
      });
      saveSegCSV();
      curSeg = null;
    }
  }
  lastActivityTime = now;
  if (!curSeg) {
    curSeg = { title: data.title, start: now, end: now, details: data };
  } else if (curSeg.title === data.title) {
    curSeg.end = now;
  } else {
    // Mark focus session if applicable
    if (isFocusSession(curSeg)) curSeg.details.isFocus = true;
    curSeg.details.productivityScore = getProductivityScore(curSeg);
    evs.push(curSeg);
    saveSegCSV();
    curSeg = { title: data.title, start: now, end: now, details: data };
  }
  if (Date.now() - lastSegUpdate > 5000) {
    renderView();
    updateProductivityWidget();
    lastSegUpdate = Date.now();
  }
});

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
  
  // Calculate progress percentage (assuming 8-hour workday = 480 minutes)
  const maxProductiveMinutes = 480;
  const progressPercentage = Math.min(Math.round((summary.totalMinutes / maxProductiveMinutes) * 100), 100);
  $('#progressPercentage').text(`${progressPercentage}%`);
  
  // Update progress ring
  const circumference = 157; // 2 * π * 25
  const progressOffset = circumference - (progressPercentage / 100) * circumference;
  $('#progressCircle').css('stroke-dashoffset', progressOffset);
  
  // Update motivational message
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
  
  $('#today-hours').text(totalHours + 'h');
  $('#today-sessions').text(sessionCount);
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
});