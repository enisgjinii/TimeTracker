const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
window.$ = window.jQuery = require('jquery');

const segmentsFile = path.join(__dirname, 'segments.csv');
const settingsFile = path.join(__dirname, 'settings.json');
let events = [];
let currentSegment = null;
let tracking = false;
let zoomLevel = 1.0;
let viewMode = "day";
let themeMode = "system";
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

let userSettings = {
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
const $currentDateLabel = $('#currentDateLabel');
const $focusedTime = $('#focusedTime');
const $distractedTime = $('#distractedTime');
const $mostUsedList = $('#mostUsedList');
const $topDistractionsList = $('#topDistractionsList');
const $appTitle = $('#appTitle');
let lastSegmentUpdateTime = 0;

function removeQuotes(str) {
  return str.replace(/^"(.*)"$/, '$1');
}

function getDeviconUrl(appName) {
  const baseUrl = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';
  const deviconAppMap = {
    'visual studio code': 'vscode',
    'vs code': 'vscode'
  };
  let normalizedName = appName.toLowerCase().trim();
  if (deviconAppMap[normalizedName]) {
    normalizedName = deviconAppMap[normalizedName];
  }
  return `${baseUrl}/${normalizedName}/${normalizedName}-original.svg`;
}

function createAppIconElement(appName) {
  const img = document.createElement('img');
  img.classList.add('app-icon');
  img.alt = appName;
  img.src = getDeviconUrl(appName);
  img.onerror = function () {
    if (this.src.indexOf("devicon") !== -1) {
      this.src = `https://img.icons8.com/color/48/000000/${encodeURIComponent(appName)}.png`;
    } else if (this.src.indexOf("icons8") !== -1) {
      this.onerror = null;
      this.src = 'images/default-icon.png';
    }
  };
  return img;
}

function getCategoryForApp(appName) {
  if (userSettings.appClassifications && userSettings.appClassifications[appName]) {
    return userSettings.appClassifications[appName];
  }
  return "";
}

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

function loadSettings() {
  if (fs.existsSync(settingsFile)) {
    try {
      let content = fs.readFileSync(settingsFile, 'utf8');
      let parsed = JSON.parse(content);
      Object.assign(userSettings, parsed);
    } catch (e) {
      console.error("Error reading settings file:", e);
    }
  }
}
function saveSettings() {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(userSettings, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving settings file:", e);
  }
}
function applySettings() {
  $('body').removeClass('dark-mode');
  $('#lightModeBtn').removeClass('active');
  $('#darkModeBtn').removeClass('active');
  $('#systemModeBtn').removeClass('active');
  if (userSettings.themeMode === 'dark') {
    $('body').addClass('dark-mode');
    $('#darkModeBtn').addClass('active');
  } else if (userSettings.themeMode === 'light') {
    $('#lightModeBtn').addClass('active');
  } else {
    $('#systemModeBtn').addClass('active');
  }
  if (!userSettings.useEmojis) $appTitle.html("Time Tracker");
  else $appTitle.html("Time Tracker <span>⏳</span>");
  viewMode = userSettings.defaultView;
  renderView();
}
function initSettingsUI() {
  $('#timelineIncrements').val(userSettings.timelineIncrements.toString());
  $('#useEmojisCheck').prop('checked', userSettings.useEmojis);
  $('#colorCodedEventsCheck').prop('checked', userSettings.colorCodedEvents);
  $('#defaultViewSelect').val(userSettings.defaultView);
  populateCategories();
  populateAppClassifications();
  $('#lightModeBtn').removeClass('active');
  $('#darkModeBtn').removeClass('active');
  $('#systemModeBtn').removeClass('active');
  if (userSettings.themeMode === 'dark') {
    $('#darkModeBtn').addClass('active');
  } else if (userSettings.themeMode === 'light') {
    $('#lightModeBtn').addClass('active');
  } else {
    $('#systemModeBtn').addClass('active');
  }
}

$('#saveSettingsBtn').click(() => {
  userSettings.timelineIncrements = parseInt($('#timelineIncrements').val());
  userSettings.useEmojis = $('#useEmojisCheck').is(':checked');
  userSettings.colorCodedEvents = $('#colorCodedEventsCheck').is(':checked');
  userSettings.defaultView = $('#defaultViewSelect').val();
  saveSettings();
  applySettings();
  $('#settingsModal').modal('hide');
});

$('#lightModeBtn').click(() => { setThemeMode('light'); });
$('#darkModeBtn').click(() => { setThemeMode('dark'); });
$('#systemModeBtn').click(() => { setThemeMode('system'); });

function setThemeMode(mode) {
  userSettings.themeMode = mode;
  saveSettings();
  applySettings();
}

$('#toggleTracking').click(() => {
  tracking = !tracking;
  $('#toggleTracking')
    .toggleClass('btn-success btn-danger')
    .text(tracking ? "Stop Tracking" : "Start Tracking");
  if (!tracking) {
    renderView();
  }
});

$('#dayViewBtn').click(() => { viewMode = "day"; currentDate = new Date(); currentDate.setHours(0, 0, 0, 0); renderView(); });
$('#prevDay').click(() => { currentDate.setDate(currentDate.getDate() - 1); renderView(); });
$('#todayBtn').click(() => { currentDate = new Date(); currentDate.setHours(0, 0, 0, 0); renderView(); });
$('#nextDay').click(() => { currentDate.setDate(currentDate.getDate() + 1); renderView(); });

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
          if (isNaN(st) || isNaN(en)) {
            continue;
          }
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
    } catch (e) {
      console.error("Error reading or parsing CSV file:", e);
    }
  }
}

function saveSegmentsToCSV() {
  if (!events || !Array.isArray(events)) {
    console.error("Error: events data is not valid for saving to CSV.");
    return;
  }
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
  try {
    fs.writeFileSync(segmentsFile, csvLines.join('\n'), 'utf8');
  } catch (e) {
    console.error("Error writing to CSV file:", e);
  }
}

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

function extractAppName(title) {
  if (title.indexOf(" - ") !== -1) {
    let parts = title.split(" - ");
    let candidate = parts[parts.length - 1].trim();
    if (candidate.length > 3) return candidate;
  }
  return title;
}

async function renderDayView() {
  $timeline.show().empty();
  let dateStr = currentDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  $currentDateLabel.text(dateStr);
  let dayStart = new Date(currentDate.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(currentDate.getTime()); dayEnd.setHours(23, 59, 59, 999);
  let dayEvents = [...events];
  if (currentSegment) dayEvents.push(currentSegment);
  dayEvents = dayEvents.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());
  const hoursInDay = 24;
  const hourHeight = 40 * zoomLevel;
  const totalHeight = hoursInDay * hourHeight;
  $timeline.css({ height: totalHeight + 'px', position: 'relative' });
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
    const appName = (ev.details && ev.details.owner && ev.details.owner.name) || extractAppName(ev.title);
    const category = getCategoryForApp(appName);
    const iconEl = createAppIconElement(appName);
    let badgeHtml = category ? `<span class="badge bg-info me-1">${category}</span>` : "";
    let wrapper = document.createElement('div');
    wrapper.className = `entry ${colorClass}`;
    wrapper.style.top = topOffset + 'px';
    wrapper.style.left = leftOffset + 'px';
    wrapper.style.width = blockWidth + 'px';
    wrapper.style.height = blockHeight + 'px';
    wrapper.setAttribute('data-event', JSON.stringify(ev));
    wrapper.appendChild(iconEl);
    let labelSpan = document.createElement('span');
    labelSpan.style.marginLeft = '0.5rem';
    labelSpan.innerHTML = `${badgeHtml}${titleText} (${minutes} min)`;
    wrapper.appendChild(labelSpan);
    wrapper.addEventListener('click', () => { showSegmentDetails(ev); });
    $timeline.append(wrapper);
  }
  return dayEvents;
}

function renderSummaryForCurrentDay() {
  let dayStart = new Date(currentDate.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(currentDate.getTime()); dayEnd.setHours(23, 59, 59, 999);
  const dayEvents = events.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());
  renderSummary(dayEvents, dayStart.getTime(), dayEnd.getTime());
}

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
    let app = (ev.details && ev.details.owner && ev.details.owner.name) || extractAppName(ev.title);
    usageMap[app] = (usageMap[app] || 0) + dur;
    if (app.toLowerCase().includes("youtube") || app.toLowerCase().includes("discord") || app.toLowerCase().includes("facebook"))
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
  usageArray.slice(0, 5).forEach(async ([app, ms]) => {
    let mm = Math.round(ms / 60000);
    const iconUrl = getDeviconUrl(app) || `https://img.icons8.com/color/48/000000/${encodeURIComponent(app)}.png`;
    $mostUsedList.append(`<li><img src="${iconUrl}" alt="${app}" style="width:16px; height:16px; margin-right:4px;">${app} - ${mm} min</li>`);
  });
  $topDistractionsList.empty();
  let distractors = usageArray.filter(([app, _]) => app.toLowerCase().includes("youtube") || app.toLowerCase().includes("discord") || app.toLowerCase().includes("facebook"));
  distractors.slice(0, 5).forEach(async ([app, ms]) => {
    let mm = Math.round(ms / 60000);
    const iconUrl = getDeviconUrl(app) || `https://img.icons8.com/color/48/000000/${encodeURIComponent(app)}.png`;
    $topDistractionsList.append(`<li><img src="${iconUrl}" alt="${app}" style="width:16px; height:16px; margin-right:4px;">${app} - ${mm} min</li>`);
  });
}

async function renderView() {
  loadSegmentsFromCSV();
  if (viewMode === "day") {
    $('#dayNav').show();
    await renderDayView();
    renderSummaryForCurrentDay();
  }
}

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
  $("#segmentDetailsContent").html(content);
  $("#segmentDetailsModal").modal("show");
}

$(document).ready(async () => {
  loadSettings();
  initSettingsUI();
  applySettings();
  await renderView();
});

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
  saveSegmentsToCSV();
  const currentTime = Date.now();
  if (currentTime - lastSegmentUpdateTime > 5000) {
    renderDayView();
    lastSegmentUpdateTime = currentTime;
  }
  renderSummaryForCurrentDay();
});

$(document).keydown((e) => {
  if (e.ctrlKey && e.key === ',') {
    zoomLevel = Math.min(10.0, zoomLevel + 0.2);
    renderView();
  } else if (e.ctrlKey && e.key === '.') {
    zoomLevel = Math.max(0.1, zoomLevel - 0.2);
    renderView();
  }
});
