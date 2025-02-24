const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const IconExtractor = require('icon-extractor');
window.$ = window.jQuery = require('jquery');

const segmentsFile = path.join(__dirname, 'segments.csv');
const settingsFile = path.join(__dirname, 'settings.json');
let events = [];
let currentSegment = null;
let tracking = false;
let zoomLevel = 1.0;
let viewMode = "day";
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

// Advanced settings: add default categories and app classifications if not set
let userSettings = {
  timelineIncrements: 15,
  darkMode: false,
  useEmojis: true,
  colorCodedEvents: true,
  defaultView: "day",
  // manually defined categories (used for grouping apps)
  categories: ["Work", "Entertainment", "Productivity", "Social"],
  // mapping from app name to category (can be edited manually)
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
const $currentDateLabel = $('#currentDateLabel');
const $focusedTime = $('#focusedTime');
const $distractedTime = $('#distractedTime');
const $mostUsedList = $('#mostUsedList');
const $topDistractionsList = $('#topDistractionsList');
const $appTitle = $('#appTitle');
const iconCache = {};

// Helper: remove surrounding quotes from CSV fields
function removeQuotes(str) {
  return str.replace(/^"(.*)"$/, '$1');
}

// Helper: get a CDN icon URL for an app name
function getCDNIconForAppName(appName) {
  const iconMapping = {
    "Electron": "https://img.icons8.com/color/48/000000/electron.png",
    "Visual Studio Code": "https://img.icons8.com/color/48/000000/visual-studio-code.png",
    "Zen Browser": "https://img.icons8.com/color/48/000000/internet.png",
    "Search": "https://img.icons8.com/color/48/000000/search.png",
    "Calculator": "https://img.icons8.com/color/48/000000/calculator.png"
    // add more mappings as needed
  };
  return iconMapping[appName] || "https://img.icons8.com/color/48/000000/app.png";
}

// Advanced categorization logic

// Returns the category for an app name from the classification mapping
function getCategoryForApp(appName) {
  if (userSettings.appClassifications && userSettings.appClassifications[appName]) {
    return userSettings.appClassifications[appName];
  }
  return "";
}

// Populate the categories list in settings modal
function populateCategories() {
  $('#categoriesList').empty();
  if (!userSettings.categories) {
    userSettings.categories = [];
  }
  userSettings.categories.forEach((cat, index) => {
    $('#categoriesList').append(`<div class="d-flex align-items-center mb-1">
      <span class="badge bg-secondary me-2">${cat}</span>
      <button class="btn btn-sm btn-outline-danger remove-category" data-index="${index}">&times;</button>
    </div>`);
  });
}

// Populate the app classifications list in settings modal
function populateAppClassifications() {
  $('#appClassificationsList').empty();
  if (!userSettings.appClassifications) {
    userSettings.appClassifications = {};
  }
  for (let app in userSettings.appClassifications) {
    let cat = userSettings.appClassifications[app];
    $('#appClassificationsList').append(`<div class="list-group-item d-flex justify-content-between align-items-center">
      <span>${app} &rarr; <em>${cat}</em></span>
      <button class="btn btn-sm btn-outline-danger remove-classification" data-app="${app}">&times;</button>
    </div>`);
  }
}

// Event handlers for removing/adding categories and classifications
$(document).on('click', '.remove-category', function () {
  let index = $(this).data('index');
  userSettings.categories.splice(index, 1);
  populateCategories();
});
$('#addCategoryBtn').click(function () {
  let newCat = prompt("Enter new category:");
  if (newCat) {
    if (!userSettings.categories) {
      userSettings.categories = [];
    }
    userSettings.categories.push(newCat);
    populateCategories();
  }
});
$(document).on('click', '.remove-classification', function () {
  let app = $(this).data('app');
  delete userSettings.appClassifications[app];
  populateAppClassifications();
});
$('#addClassificationBtn').click(function () {
  let appName = prompt("Enter app name for classification:");
  if (appName) {
    let newCat = prompt("Enter category for " + appName + ":");
    if (newCat) {
      if (!userSettings.appClassifications) {
        userSettings.appClassifications = {};
      }
      userSettings.appClassifications[appName] = newCat;
      populateAppClassifications();
    }
  }
});

// SETTINGS FUNCTIONS
function loadSettings() {
  if (fs.existsSync(settingsFile)) {
    try {
      let content = fs.readFileSync(settingsFile, 'utf8');
      let parsed = JSON.parse(content);
      Object.assign(userSettings, parsed);
    } catch (e) { showToast("Error reading settings: " + e.toString()); }
  }
}
function saveSettings() {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(userSettings, null, 2), 'utf8');
  } catch (e) { showToast("Error writing settings: " + e.toString()); }
}
function applySettings() {
  if (userSettings.darkMode) $('body').addClass('dark-mode');
  else $('body').removeClass('dark-mode');
  if (!userSettings.useEmojis) $appTitle.html("Time Tracker");
  else $appTitle.html("Time Tracker <span>⏳</span>");
  viewMode = userSettings.defaultView;
  renderView();
}
function initSettingsUI() {
  $('#timelineIncrements').val(userSettings.timelineIncrements.toString());
  $('#darkModeCheck').prop('checked', userSettings.darkMode);
  $('#useEmojisCheck').prop('checked', userSettings.useEmojis);
  $('#colorCodedEventsCheck').prop('checked', userSettings.colorCodedEvents);
  $('#defaultViewSelect').val(userSettings.defaultView);
  populateCategories();
  populateAppClassifications();
}
$('#saveSettingsBtn').click(() => {
  userSettings.timelineIncrements = parseInt($('#timelineIncrements').val());
  userSettings.darkMode = $('#darkModeCheck').is(':checked');
  userSettings.useEmojis = $('#useEmojisCheck').is(':checked');
  userSettings.colorCodedEvents = $('#colorCodedEventsCheck').is(':checked');
  userSettings.defaultView = $('#defaultViewSelect').val();
  saveSettings();
  applySettings();
  $('#settingsModal').modal('hide');
});

// START/STOP TRACKING
$('#toggleTracking').click(() => {
  tracking = !tracking;
  $('#toggleTracking')
    .toggleClass('btn-success btn-danger')
    .text(tracking ? "Stop Tracking" : "Start Tracking");
});

// VIEW NAVIGATION
$('#dayViewBtn').click(() => { viewMode = "day"; currentDate = new Date(); currentDate.setHours(0, 0, 0, 0); renderView(); });
$('#weekViewBtn').click(() => { viewMode = "week"; renderView(); });
$('#monthViewBtn').click(() => { viewMode = "month"; renderView(); });
$('#prevDay').click(() => { currentDate.setDate(currentDate.getDate() - 1); renderView(); });
$('#todayBtn').click(() => { currentDate = new Date(); currentDate.setHours(0, 0, 0, 0); renderView(); });
$('#nextDay').click(() => { currentDate.setDate(currentDate.getDate() + 1); renderView(); });

// ZOOM HANDLERS
$(document).keydown((e) => {
  if (e.ctrlKey && e.key === ',') {
    zoomLevel = Math.min(10.0, zoomLevel + 0.2);
    renderView();
  } else if (e.ctrlKey && e.key === '.') {
    zoomLevel = Math.max(0.1, zoomLevel - 0.2);
    renderView();
  }
});

// IPC EVENTS
ipcRenderer.on('error', (e, msg) => showToast(msg));
ipcRenderer.on('active-window-data', (e, data) => {
  if (!tracking) return;
  let now = Date.now();
  if (!currentSegment) {
    currentSegment = { title: data.title, start: now, end: now, details: data };
  } else {
    if (currentSegment.title === data.title) {
      currentSegment.end = now;
    } else {
      events.push(currentSegment);
      currentSegment = { title: data.title, start: now, end: now, details: data };
    }
  }
  // Save events without re-rendering the chart each time
  saveSegmentsToCSV();
  renderView();
});

// TOAST FUNCTION
function showToast(msg) {
  let toastId = "toast" + Date.now();
  let html = `
    <div id="${toastId}" class="toast show text-white bg-danger" style="min-width:200px; margin-bottom:10px;">
      <div class="toast-body">${msg}</div>
    </div>`;
  $("#toastContainer").append(html);
  setTimeout(() => { $("#" + toastId).remove(); }, 5000);
}
function isValidTimestamp(ts) { return !isNaN(ts) && ts > 0; }

// CSV Loading (supports both legacy and extended 14-field formats)
function loadSegmentsFromCSV() {
  events = [];
  if (fs.existsSync(segmentsFile)) {
    try {
      let lines = fs.readFileSync(segmentsFile, 'utf8').trim().split('\n');
      for (let line of lines) {
        let parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 3) {
          let title = removeQuotes(parts[0]);
          let st = parseInt(parts[1]);
          let en = parseInt(parts[2]);
          let ev = { title, start: st, end: en };
          if (parts.length >= 14) {
            ev.details = {
              id: parseInt(parts[3]),
              bounds: {
                x: parseInt(parts[4]),
                y: parseInt(parts[5]),
                width: parseInt(parts[6]),
                height: parseInt(parts[7])
              },
              owner: {
                name: removeQuotes(parts[8]),
                processId: parseInt(parts[9]),
                bundleId: removeQuotes(parts[10]),
                path: removeQuotes(parts[11])
              },
              url: removeQuotes(parts[12]),
              memoryUsage: parseInt(parts[13])
            };
          }
          events.push(ev);
        }
      }
    } catch (e) { showToast("Error reading CSV: " + e.toString()); }
  }
}

// CSV Saving (writes extended details when available)
function saveSegmentsToCSV() {
  let csvLines = events.map(ev => {
    const title = `"${ev.title}"`;
    const start = ev.start;
    const end = ev.end;
    if (ev.details && ev.details.id !== undefined) {
      const id = ev.details.id;
      const bounds = ev.details.bounds || {};
      const x = bounds.x !== undefined ? bounds.x : '';
      const y = bounds.y !== undefined ? bounds.y : '';
      const width = bounds.width !== undefined ? bounds.width : '';
      const height = bounds.height !== undefined ? bounds.height : '';
      const owner = ev.details.owner || {};
      const ownerName = `"${owner.name || ''}"`;
      const processId = owner.processId || '';
      const bundleId = `"${owner.bundleId || ''}"`;
      const ownerPath = `"${owner.path || ''}"`;
      const url = `"${ev.details.url || ''}"`;
      const memoryUsage = ev.details.memoryUsage || '';
      return [title, start, end, id, x, y, width, height, ownerName, processId, bundleId, ownerPath, url, memoryUsage].join(',');
    } else {
      return [title, start, end].join(',');
    }
  });
  fs.writeFileSync(segmentsFile, csvLines.join('\n'), 'utf8');
}

// Overlapping lane assignment for timeline display
function assignLanes(evList) {
  let sorted = evList.slice().sort((a, b) => a.start - b.start);
  let lanes = [];
  sorted.forEach(ev => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i][lanes[i].length - 1].end <= ev.start) {
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
}

// Render Day view (only hour segments)
async function renderDayView() {
  $timeline.show().empty();
  let dateStr = currentDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  $currentDateLabel.text(dateStr);
  let dayStart = new Date(currentDate.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(currentDate.getTime()); dayEnd.setHours(23, 59, 59, 999);
  let dayEvents = [...events];
  if (currentSegment) dayEvents.push(currentSegment);
  dayEvents = dayEvents.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());

  // Define fixed hour segments (24 hours)
  const hoursInDay = 24;
  const hourHeight = 40 * zoomLevel; // each hour is 40px
  const totalHeight = hoursInDay * hourHeight;
  $timeline.css({ height: totalHeight + 'px', position: 'relative' });

  // Draw each hour line and label
  for (let hour = 0; hour < hoursInDay; hour++) {
    let topPos = hour * hourHeight;
    let labelStr = new Date(dayStart.getTime() + hour * 3600000).toLocaleTimeString([], { hour: '2-digit' });
    let labelHtml = `<div class="hour-label" style="top:${topPos}px;">${labelStr}</div>`;
    let lineHtml = `<div class="timeline-hour" style="top:${topPos}px; height: ${hourHeight}px;"></div>`;
    $timeline.append(labelHtml, lineHtml);
  }

  if (dayEvents.length === 0) {
    $timeline.append('<p class="text-muted m-3">No events for this date.</p>');
    return dayEvents;
  }

  let laneData = assignLanes(dayEvents);
  let laneCount = laneData.laneCount;
  let containerWidth = $timeline.width();
  let eventsAreaWidth = containerWidth - 100;
  let laneWidth = eventsAreaWidth / laneCount;

  // Render event blocks using hours for positioning and height
  for (let ev of dayEvents) {
    let evStartTime = Math.max(ev.start, dayStart.getTime());
    let evEndTime = Math.min(ev.end, dayEnd.getTime());
    let durationMs = evEndTime - evStartTime;
    if (durationMs < 60000) continue;
    let topOffset = ((evStartTime - dayStart.getTime()) / 3600000) * hourHeight;
    let blockHeight = (durationMs / 3600000) * hourHeight;
    if (blockHeight < 5) blockHeight = 5;
    let isDistraction = ev.title.toLowerCase().includes("youtube") || ev.title.toLowerCase().includes("discord") || ev.title.toLowerCase().includes("facebook");
    let colorClass = isDistraction ? "distraction" : "focus";
    if (!userSettings.colorCodedEvents) colorClass = "singleColor";
    let minutes = Math.round(durationMs / 60000);
    let leftOffset = 100 + (ev.lane * laneWidth);
    let blockWidth = laneWidth - 5;
    let titleText = userSettings.useEmojis ? ev.title : ev.title.replace(/[^\w\s]/g, '');
    // Determine category from classification mapping
    const appName = (ev.details && ev.details.owner && ev.details.owner.name) || ev.title;
    const category = getCategoryForApp(appName);
    const iconUrl = getCDNIconForAppName(appName);
    let badgeHtml = category ? `<span class="badge bg-info me-1">${category}</span>` : "";
    let iconHtml = `<img class="app-icon" src="${iconUrl}" style="width:16px; height:16px; margin-right:4px; vertical-align:middle;">`;
    let entryHtml = `<div class="entry ${colorClass}" style="top:${topOffset}px; left:${leftOffset}px; width:${blockWidth}px; height:${blockHeight}px;" data-event='${JSON.stringify(ev)}'>
                        ${iconHtml}${badgeHtml}${titleText} (${minutes} min)
                     </div>`;
    let $entry = $(entryHtml);
    $entry.click(function () { showSegmentDetails($(this).data("event")); });
    $timeline.append($entry);
  }
  return dayEvents;
}

// Render calendar view for week or month using FullCalendar
function renderCalendarView(viewType) {
  $timeline.show().empty();
  $timeline.css({ height: 'auto' });
  let calendarEl = document.createElement('div');
  calendarEl.id = 'calendar';
  $timeline.append(calendarEl);

  // Convert events to FullCalendar events
  let calendarEvents = events.map(ev => {
    return {
      title: ev.title,
      start: new Date(ev.start).toISOString(),
      end: new Date(ev.end).toISOString(),
      extendedProps: ev.details
    };
  });
  if (currentSegment) {
    calendarEvents.push({
      title: currentSegment.title,
      start: new Date(currentSegment.start).toISOString(),
      end: new Date(currentSegment.end).toISOString(),
      extendedProps: currentSegment.details
    });
  }

  // Initialize FullCalendar – ensure FullCalendar's CSS/JS is loaded in index.html!
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: viewType === 'week' ? 'timeGridWeek' : 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: calendarEvents,
    eventDidMount: function (info) {
      // Optionally, set event styling based on category
      let cat = getCategoryForApp(info.event.title);
      if (cat) {
        // Example: change background color for events with a category
        info.el.style.backgroundColor = "#2563eb";
      }
    }
  });
  calendar.render();
}

// Render summary: update most used and distractions with icons; only update chart when not tracking.
function renderSummary(evList, startMs, endMs) {
  if (!tracking) {
    if (document.querySelector("#donutChart").innerHTML !== "") {
      document.querySelector("#donutChart").innerHTML = "";
    }
  }
  let totalFocused = 0, totalDistracted = 0;
  let usageMap = {};
  evList.forEach(ev => {
    let s = Math.max(ev.start, startMs);
    let e = Math.min(ev.end, endMs);
    let dur = e - s;
    if (dur < 60000) return;
    usageMap[ev.title] = (usageMap[ev.title] || 0) + dur;
    if (ev.title.toLowerCase().includes("youtube") || ev.title.toLowerCase().includes("discord") || ev.title.toLowerCase().includes("facebook"))
      totalDistracted += dur;
    else
      totalFocused += dur;
  });

  if (!tracking) {
    let donutChart = new ApexCharts(document.querySelector("#donutChart"), {
      chart: { type: 'donut', width: 250 },
      labels: ["Focused", "Distracted"],
      series: [totalFocused, totalDistracted],
      colors: ["#2eb85c", "#e55353"]
    });
    donutChart.render();
  }

  let fH = Math.floor(totalFocused / 3600000);
  let fM = Math.floor((totalFocused % 3600000) / 60000);
  let dH = Math.floor(totalDistracted / 3600000);
  let dM = Math.floor((totalDistracted % 3600000) / 60000);
  $focusedTime.text(`${fH}h ${fM}m`);
  $distractedTime.text(`${dH}h ${dM}m`);

  let usageArray = Object.entries(usageMap).sort((a, b) => b[1] - a[1]);
  $mostUsedList.empty();
  usageArray.slice(0, 5).forEach(([app, ms]) => {
    let mm = Math.round(ms / 60000);
    const iconUrl = getCDNIconForAppName(app);
    $mostUsedList.append(`<li><img src="${iconUrl}" alt="${app}" style="width:16px; height:16px; margin-right:4px;">${app} - ${mm} min</li>`);
  });
  $topDistractionsList.empty();
  let distractors = usageArray.filter(([app, _]) => app.toLowerCase().includes("youtube") || app.toLowerCase().includes("discord") || app.toLowerCase().includes("facebook"));
  distractors.slice(0, 5).forEach(([app, ms]) => {
    let mm = Math.round(ms / 60000);
    const iconUrl = getCDNIconForAppName(app);
    $topDistractionsList.append(`<li><img src="${iconUrl}" alt="${app}" style="width:16px; height:16px; margin-right:4px;">${app} - ${mm} min</li>`);
  });
}

// Week and Month range functions
function getWeekRange() {
  let now = new Date();
  let dayOfWeek = now.getDay();
  let monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek + 6) % 7);
  monday.setHours(0, 0, 0, 0);
  let sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return [monday.getTime(), sunday.getTime()];
}
function getMonthRange() {
  let now = new Date();
  let first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  let last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return [first.getTime(), last.getTime()];
}

// Render main view based on viewMode; for week and month views, use full calendar
async function renderView() {
  loadSegmentsFromCSV();
  if (viewMode === "day") {
    $('#dayNav').show();
    let dayEv = await renderDayView();
    let ds = new Date(currentDate.getTime()); ds.setHours(0, 0, 0, 0);
    let de = new Date(currentDate.getTime()); de.setHours(23, 59, 59, 999);
    renderSummary(dayEv, ds.getTime(), de.getTime());
  } else if (viewMode === "week") {
    $('#dayNav').hide();
    $currentDateLabel.text("This Week");
    renderCalendarView('week');
  } else if (viewMode === "month") {
    $('#dayNav').hide();
    $currentDateLabel.text("This Month");
    renderCalendarView('month');
  }
}

// Show segment details in a modal with extra window info
function showSegmentDetails(details) {
  const startStr = new Date(details.start).toLocaleString();
  const endStr = new Date(details.end).toLocaleString();
  const duration = Math.round((details.end - details.start) / 60000);
  let content = `<strong>Title:</strong> ${details.title}<br>
                 <strong>Start:</strong> ${startStr}<br>
                 <strong>End:</strong> ${endStr}<br>
                 <strong>Duration:</strong> ${duration} min`;

  if (details.details) {
    const { details: d } = details;
    const { bounds = {}, owner = {} } = d;

    content += `<hr>
                <strong>Window ID:</strong> ${d.id || ''}<br>
                <strong>Bounds:</strong> x: ${bounds.x || ''}, y: ${bounds.y || ''}, width: ${bounds.width || ''}, height: ${bounds.height || ''}<br>
                <strong>Owner:</strong> ${owner.name || ''} (PID: ${owner.processId || ''})<br>
                <strong>Bundle ID:</strong> ${owner.bundleId || ''}<br>
                <strong>Path:</strong> ${owner.path || ''}<br>
                <strong>URL:</strong> ${d.url || ''}<br>
                <strong>Memory Usage:</strong> ${d.memoryUsage || ''}`;
  }

  const $segmentDetailsContent = $("#segmentDetailsContent");
  if ($segmentDetailsContent.length) {
    $segmentDetailsContent.html(content);
  }

  const $segmentDetailsModal = $("#segmentDetailsModal");
  if ($segmentDetailsModal.length) {
    $segmentDetailsModal.modal("show");
  }
}

// Goals Management
let userGoals = [];

function initGoals() {
  try {
    const savedGoals = localStorage.getItem('timeTrackerGoals');
    userGoals = savedGoals ? JSON.parse(savedGoals) : [];
    updateGoalsDisplay();
  } catch (e) {
    console.error('Error loading goals:', e);
  }
}

function updateGoalsDisplay() {
  const $goalsList = $('.goals-list');
  if (!$goalsList.length) return;
  $goalsList.empty();

  userGoals.forEach((goal, index) => {
    const progress = calculateGoalProgress(goal);
    const goalTypeSymbol = goal.type === 'focus' ? '🎯' : '⚠️';
    const progressBarClass = goal.type === 'focus' ? 'bg-success' : 'bg-warning';

    $goalsList.append(`
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span>${goalTypeSymbol} ${goal.description}</span>
        <div class="progress" style="width: 60%">
          <div class="progress-bar ${progressBarClass}" 
               role="progressbar" 
               style="width: ${progress}%"
               aria-valuenow="${progress}" 
               aria-valuemin="0" 
               aria-valuemax="100">
            ${progress}%
          </div>
        </div>
      </div>
    `);
  });
}

function calculateGoalProgress(goal) {
  const stats = getTimeStats();

  switch (goal.type) {
    case 'focus':
      return Math.min(100, (stats.focusedHours / goal.target) * 100);
    case 'reduce':
      return Math.min(100, (1 - stats.distractedHours / goal.target) * 100);
    default:
      return 0;
  }
}

// Save new goal
$('#saveGoalBtn').click(() => {
  const goal = {
    type: $('#goalType').val(),
    target: parseFloat($('#goalTarget').val()),
    duration: $('#goalDuration').val(),
    description: `${$('#goalType').val() === 'focus' ? 'Increase focus to' : 'Reduce distractions to'} ${$('#goalTarget').val()}h per ${$('#goalDuration').val()}`,
    createdAt: Date.now()
  };
  
  userGoals.push(goal);
  localStorage.setItem('timeTrackerGoals', JSON.stringify(userGoals));
  updateGoalsDisplay();
  $('#goalsModal').modal('hide');
});

// Initialize goals on startup
$(document).ready(async () => {
  loadSettings();
  initSettingsUI();
  applySettings();
  loadSegmentsFromCSV();
  if (userSettings.defaultView === "week" || userSettings.defaultView === "month") {
    viewMode = userSettings.defaultView;
  }
  await renderView();
  initGoals();
});

// Update productivity score
function updateProductivityScore() {
  const stats = getTimeStats();
  const totalTime = stats.focusedHours + stats.distractedHours;
  const score = totalTime > 0 ? Math.round((stats.focusedHours / totalTime) * 100) : 0;
  
  $('.progress-ring').attr('data-progress', score);
  $('.progress-ring').css('--progress', `${score * 3.6}deg`);
}

// Call this whenever events are updated
function onEventsUpdated() {
  updateGoalsDisplay();
  updateProductivityScore();
}

const CategoryManager = {
  categories: new Map([
    ['productivity', ['code editor', 'terminal', 'document', 'email', 'meeting']],
    ['development', ['visual studio', 'github', 'git', 'node', 'npm']],
    ['communication', ['slack', 'teams', 'zoom', 'skype', 'discord']],
    ['entertainment', ['youtube', 'netflix', 'spotify', 'game', 'social media']],
    ['distraction', ['facebook', 'twitter', 'instagram', 'reddit', 'tiktok']]
  ]),

  classifyApp(appTitle, appPath) {
    const titleLower = appTitle.toLowerCase();
    const pathLower = (appPath || '').toLowerCase();

    for (const [category, keywords] of this.categories) {
      if (keywords.some(keyword => 
        titleLower.includes(keyword) || pathLower.includes(keyword)
      )) {
        return category;
      }
    }
    return 'uncategorized';
  },

  isProductiveApp(appTitle, appPath) {
    const category = this.classifyApp(appTitle, appPath);
    return ['productivity', 'development'].includes(category);
  },

  isDistractionApp(appTitle, appPath) {
    const category = this.classifyApp(appTitle, appPath);
    return ['entertainment', 'distraction'].includes(category);
  }
};

const GoalManager = {
  activeGoals: new Map(),
  
  initializeDefaultGoals() {
    this.activeGoals.set('productivityDaily', {
      type: 'focus',
      target: 6, // 6 hours
      period: 'daily',
      description: 'Maintain 6 hours of productive work daily'
    });

    this.activeGoals.set('distractionLimit', {
      type: 'reduce',
      target: 1, // 1 hour
      period: 'daily', 
      description: 'Limit distractions to 1 hour per day'
    });
  },

  calculateProgress(goalId) {
    const goal = this.activeGoals.get(goalId);
    if (!goal) return 0;

    const stats = this.getTimeStats(goal.period);
    
    switch (goal.type) {
      case 'focus':
        return Math.min(100, (stats.focusedHours / goal.target) * 100);
      case 'reduce':
        return Math.min(100, (1 - (stats.distractedHours / goal.target)) * 100);
      default:
        return 0;
    }
  },

  getTimeStats(period = 'daily') {
    const now = Date.now();
    const periodStart = this.getPeriodStart(period);
    
    const relevantEvents = events.filter(ev => 
      ev.end >= periodStart && ev.start <= now
    );

    let focusedTime = 0;
    let distractedTime = 0;

    relevantEvents.forEach(ev => {
      const duration = ev.end - ev.start;
      if (CategoryManager.isProductiveApp(ev.title, ev.details?.owner?.path)) {
        focusedTime += duration;
      } else if (CategoryManager.isDistractionApp(ev.title, ev.details?.owner?.path)) {
        distractedTime += duration;
      }
    });

    return {
      focusedHours: focusedTime / 3600000,
      distractedHours: distractedTime / 3600000
    };
  },

  getPeriodStart(period) {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now).setHours(0, 0, 0, 0);
      case 'weekly':
        return new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      default:
        return new Date(now).setHours(0, 0, 0, 0);
    }
  }
};

// Initialize goals on startup
document.addEventListener('DOMContentLoaded', () => {
  GoalManager.initializeDefaultGoals();
  updateGoalsDisplay();
});

function updateGoalsDisplay() {
  const $goalsList = $('.goals-list');
  if (!$goalsList.length) return;
  
  $goalsList.empty();

  GoalManager.activeGoals.forEach((goal, goalId) => {
    const progress = GoalManager.calculateProgress(goalId);
    const progressBarClass = goal.type === 'focus' ? 'bg-success' : 'bg-warning';

    $goalsList.append(`
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span>${goal.description}</span>
        <div class="progress" style="width: 60%">
          <div class="progress-bar ${progressBarClass}" 
               role="progressbar" 
               style="width: ${progress}%"
               aria-valuenow="${progress}" 
               aria-valuemin="0" 
               aria-valuemax="100">
            ${Math.round(progress)}%
          </div>
        </div>
      </div>
    `);
  });

  updateProductivityScore();
}

function updateProductivityScore() {
  const stats = GoalManager.getTimeStats('daily');
  const totalTime = stats.focusedHours + stats.distractedHours;
  const score = totalTime > 0 
    ? Math.round((stats.focusedHours / totalTime) * 100)
    : 0;
  
  $('.progress-ring').attr('data-progress', score);
  $('.progress-ring').css('--progress', `${score * 3.6}deg`);
}

// Update every minute while tracking
if (tracking) {
  setInterval(() => {
    updateGoalsDisplay();
  }, 60000);
}
