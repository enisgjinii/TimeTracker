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

const createAppIcon = appName => {
  const img = document.createElement('img');
  img.classList.add('app-icon');
  img.alt = appName;
  img.src = getDevIcon(appName);
  img.onerror = function () {
    if (this.src.includes("devicon")) {
      this.src = `https://img.icons8.com/color/48/000000/${encodeURIComponent(appName)}.png`;
    } else if (this.src.includes("icons8")) {
      this.onerror = null;
      this.src = 'images/default-icon.png';
    }
  };
  return img;
};

const getAppCat = appName => usrSet.appClassifications?.[appName] || "";

const popCats = () => {
  $('#categoriesList').empty();
  usrSet.categories = usrSet.categories || [];
  usrSet.categories.forEach((cat, i) => {
    $('#categoriesList').append(`<div class="d-flex align-items-center justify-content-between p-2 rounded mb-2" style="background-color: var(--accent);">
            <span class="badge bg-secondary me-2">${cat}</span>
            <button class="btn btn-sm btn-outline-danger rm-cat" data-index="${i}" aria-label="Remove category ${cat}">
                <i class="fas fa-times"></i>
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
                <i class="fas fa-times"></i>
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
  view = usrSet.defaultView;
  renderView();
};
const initSetUI = () => {
  $('#timelineIncrements').val(usrSet.timelineIncrements.toString());
  $('#useEmojisCheck').prop('checked', usrSet.useEmojis);
  $('#colorCodedEventsCheck').prop('checked', usrSet.colorCodedEvents);
  $('#defaultViewSelect').val(usrSet.defaultView);
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
  usrSet.defaultView = $('#defaultViewSelect').val();
  saveSet();
  applySet();
  
  // Show success message
  const successAlert = $(`
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="fas fa-check-circle me-2"></i>Settings saved successfully!
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
  $('#toggleTracking').toggleClass('btn-success btn-danger').text(track ? "Stop Tracking" : "Start Tracking");
  if (!track) renderView();
});

$('#dayViewBtn').click(() => { view = "day"; date = new Date(); date.setHours(0, 0, 0, 0); renderView(); });
$('#prevDay').click(() => { date.setDate(date.getDate() - 1); renderView(); });
$('#todayBtn').click(() => { date = new Date(); date.setHours(0, 0, 0, 0); renderView(); });
$('#nextDay').click(() => { date.setDate(date.getDate() + 1); renderView(); });

const loadSegCSV = () => {
  evs = [];
  if (fs.existsSync(SEG_FILE)) {
    try {
      fs.readFileSync(SEG_FILE, 'utf8').trim().split('\n').forEach(line => {
        let parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 3) {
          let title = rmQuotes(parts[0]);
          let st = parseInt(parts[1]);
          let en = parseInt(parts[2]);
          if (isNaN(st) || isNaN(en)) return;
          let ev = { title, start: st, end: en };
          if (parts.length >= 14) {
            ev.details = {
              id: parseInt(parts[3]),
              bounds: { x: parseInt(parts[4]), y: parseInt(parts[5]), width: parseInt(parts[6]), height: parseInt(parts[7]) },
              owner: { name: rmQuotes(parts[8]), processId: parseInt(parts[9]), bundleId: rmQuotes(parts[10]), path: rmQuotes(parts[11]) },
              url: rmQuotes(parts[12]),
              memoryUsage: parseInt(parts[13])
            };
          }
          evs.push(ev);
        }
      });
    } catch (e) {
      console.error("CSV Error:", e);
    }
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
      return [title, start, end, d.id, x, y, width, height, ownerName, processId, bundleId, ownerPath, url, memoryUsage].join(',');
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
  $timeline.show().empty();
  $dateLabel.text(date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }));
  let dayStart = new Date(date.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(date.getTime()); dayEnd.setHours(23, 59, 59, 999);
  let dayEvents = [...evs];
  if (curSeg) dayEvents.push(curSeg);
  dayEvents = dayEvents.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());
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
    const category = getAppCat(appName);
    const iconEl = createAppIcon(appName);
    let badgeHTML = category ? `<span class="badge bg-info me-1">${category}</span>` : "";
    
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
      style: 'marginLeft:0.5rem',
      html: `${badgeHTML}${titleText} (${minutes} min)`
    }));
    
    $timeline.append(wrapper);
  });
  
  return dayEvents;
};

const renderView = async () => {
  loadSegCSV();
  $dateLabel.text(date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  if (view === "day") {
    await renderDayView();
  }
};

function showSegDetails(details) {
  const fmtDate = date => date.toLocaleString();
  const durMin = Math.round((details.end - details.start) / 60000);
  let content = `<strong>Title:</strong> ${details.title}<br>
                   <strong>Start:</strong> ${fmtDate(new Date(details.start))}<br>
                   <strong>End:</strong> ${fmtDate(new Date(details.end))}<br>
                   <strong>Duration:</strong> ${durMin} min`;
  if (details.details) {
    const d = details.details;
    const { bounds = {}, owner = {} } = d;
    content += `<hr>
                   <strong>Window ID:</strong> ${d.id || ''}<br>
                   <strong>Bounds:</strong> x: ${bounds.x || ''}, y: ${bounds.y || ''}, width: ${bounds.width || ''}, height: ${bounds.height || ''}<br>
                   <strong>Owner:</strong> ${owner.name || ''} (PID: ${owner.processId || ''})<br>
                   <strong>Bundle ID:</strong> ${owner.bundleId || ''}<br>
                   <strong>Path:</strong> ${owner.path || ''}<br>
                   <strong>URL:</strong> ${d.url || ''}<br>
                   <strong>Memory:</strong> ${d.memoryUsage || ''}`;
  }
  $("#segmentDetailsContent").html(content);
  $("#segmentDetailsModal").modal("show");
}

$(document).ready(async () => {
  loadSet();
  initSetUI();
  applySet();
  await renderView();
  
  // Update current time indicator every minute
  setInterval(() => {
    if (view === "day") {
      updateCurrentTimeIndicator();
    }
  }, 60000);
  
  // Initial update
  updateCurrentTimeIndicator();
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
  }
};

ipcRenderer.on('active-window-data', (e, data) => {
  if (!track) return;
  const now = Date.now();
  if (!curSeg) {
    curSeg = { title: data.title, start: now, end: now, details: data };
  } else if (curSeg.title === data.title) {
    curSeg.end = now;
  } else {
    evs.push(curSeg);
    curSeg = { title: data.title, start: now, end: now, details: data };
  }
  saveSegCSV();
  if (Date.now() - lastSegUpdate > 5000) {
    renderDayView();
    lastSegUpdate = Date.now();
  }
});

$(document).keydown(e => {
  if (e.ctrlKey) {
    if (e.key === ',') zoom = Math.min(10.0, zoom + 0.2);
    else if (e.key === '.') zoom = Math.max(0.1, zoom - 0.2);
    renderView();
  }
});