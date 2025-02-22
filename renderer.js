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
let userSettings = {
  timelineIncrements: 15,
  darkMode: false,
  useEmojis: true,
  colorCodedEvents: true,
  defaultView: "day"
};

const $timeline = $('#timeline');
const $currentDateLabel = $('#currentDateLabel');
const $focusedTime = $('#focusedTime');
const $distractedTime = $('#distractedTime');
const $mostUsedList = $('#mostUsedList');
const $topDistractionsList = $('#topDistractionsList');
const $appTitle = $('#appTitle');
const iconCache = {};

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
function loadSegmentsFromCSV() {
  events = [];
  if (fs.existsSync(segmentsFile)) {
    try {
      let lines = fs.readFileSync(segmentsFile, 'utf8').trim().split('\n');
      for (let line of lines) {
        let [title, startStr, endStr] = line.split(',');
        let st = parseInt(startStr), en = parseInt(endStr);
        if (isValidTimestamp(st) && isValidTimestamp(en) && en >= st) {
          events.push({ title, start: st, end: en });
        }
      }
    } catch (e) { showToast("Error reading CSV: " + e.toString()); }
  }
}
function saveSegmentsToCSV() {
  let csvLines = events.map(ev => `${ev.title},${ev.start},${ev.end}`);
  fs.writeFileSync(segmentsFile, csvLines.join('\n'), 'utf8');
}

// Overlapping lane assignment
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

// Use IconExtractor to get app icon from the app's path
async function getIconForAppForPath(ownerPath) {
  if (iconCache[ownerPath]) return iconCache[ownerPath];
  try {
    const iconBuffer = await IconExtractor.extract(ownerPath);
    const iconBase64 = iconBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${iconBase64}`;
    iconCache[ownerPath] = dataUrl;
    return dataUrl;
  } catch (e) {
    console.error("Error extracting icon for", ownerPath, e);
    return "icons/default.png";
  }
}

// Render Day view with user-defined increments (15 or 30 min)
async function renderDayView() {
  $timeline.show().empty();
  let dateStr = currentDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  $currentDateLabel.text(dateStr);
  let dayStart = new Date(currentDate.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(currentDate.getTime()); dayEnd.setHours(23, 59, 59, 999);
  let dayEvents = [...events];
  if (currentSegment) dayEvents.push(currentSegment);
  dayEvents = dayEvents.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());
  let incrementsPerHour = 60 / userSettings.timelineIncrements;
  let totalIncrements = 24 * incrementsPerHour;
  let baseHeight = totalIncrements * 20;
  let totalHeight = baseHeight * zoomLevel;
  $timeline.css({ height: totalHeight + 'px', position: 'relative' });
  // Mark increments
  for (let i = 0; i < totalIncrements; i++) {
    let incTime = new Date(dayStart.getTime() + i * userSettings.timelineIncrements * 60000);
    let topPos = i * 20 * zoomLevel;
    let labelStr = incTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let labelHtml = `<div class="hour-label" style="top:${topPos}px;">${labelStr}</div>`;
    let lineHtml = `<div class="timeline-hour" style="top:${topPos}px; height:${20 * zoomLevel}px;"></div>`;
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
    let evStart = Math.max(ev.start, dayStart.getTime());
    let evEnd = Math.min(ev.end, dayEnd.getTime());
    let durMs = evEnd - evStart;
    if (durMs < 60000) continue;
    let topOffset = ((evStart - dayStart.getTime()) / (24 * 3600 * 1000)) * baseHeight * zoomLevel;
    let blockHeight = (durMs / (24 * 3600 * 1000)) * baseHeight * zoomLevel;
    if (blockHeight < 5) blockHeight = 5;
    let isDistraction = isDistracting(ev.title);
    let colorClass = isDistraction ? "distraction" : "focus";
    if (!userSettings.colorCodedEvents) colorClass = "singleColor";
    let mins = Math.round(durMs / 60000);
    let leftOffset = 100 + (ev.lane * laneWidth);
    let blockWidth = laneWidth - 5;
    let titleText = userSettings.useEmojis ? ev.title : ev.title.replace(/[^\w\s]/g, '');
    // Initially use fallback icon
    getIconFallback = (title) => `icons/default.png`;
    let iconUrl = getIconFallback(ev.title);
    let iconHtml = `<img class="app-icon" src="${iconUrl}" style="width:16px; height:16px; margin-right:4px; vertical-align:middle;">`;
    let entryHtml = `<div class="entry ${colorClass}" style="top:${topOffset}px; left:${leftOffset}px; width:${blockWidth}px; height:${blockHeight}px;" data-event='${JSON.stringify(ev)}'>
                        ${iconHtml}${titleText} (${mins} min)
                     </div>`;
    let $entry = $(entryHtml);
    $entry.click(function () { showSegmentDetails($(this).data("event")); });
    $timeline.append($entry);
    // If details include owner path, extract icon asynchronously
    if (ev.details && ev.details.owner && ev.details.owner.path) {
      getIconForAppForPath(ev.details.owner.path).then(url => {
        $entry.find('.app-icon').attr('src', url);
      });
    }
  }
  return dayEvents;
}

function isDistracting(title) {
  let t = title.toLowerCase();
  return t.includes("youtube") || t.includes("discord") || t.includes("facebook");
}

// Render summary (donut chart, lists)
function renderSummary(evList, startMs, endMs) {
  if (document.querySelector("#donutChart").innerHTML !== "") {
    document.querySelector("#donutChart").innerHTML = "";
  }
  let totalFocused = 0, totalDistracted = 0;
  let usageMap = {};
  evList.forEach(ev => {
    let s = Math.max(ev.start, startMs);
    let e = Math.min(ev.end, endMs);
    let dur = e - s;
    if (dur < 60000) return;
    usageMap[ev.title] = (usageMap[ev.title] || 0) + dur;
    if (isDistracting(ev.title)) totalDistracted += dur; else totalFocused += dur;
  });
  let donutChart = new ApexCharts(document.querySelector("#donutChart"), {
    chart: { type: 'donut', width: 250 },
    labels: ["Focused", "Distracted"],
    series: [totalFocused, totalDistracted],
    colors: ["#2eb85c", "#e55353"]
  });
  donutChart.render();
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
    $mostUsedList.append(`<li>${app} - ${mm} min</li>`);
  });
  $topDistractionsList.empty();
  let distractors = usageArray.filter(([app, _]) => isDistracting(app));
  distractors.slice(0, 5).forEach(([app, ms]) => {
    let mm = Math.round(ms / 60000);
    $topDistractionsList.append(`<li>${app} - ${mm} min</li>`);
  });
}

// Week range
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
// Month range
function getMonthRange() {
  let now = new Date();
  let first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  let last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return [first.getTime(), last.getTime()];
}

// Render main view based on viewMode
async function renderView() {
  loadSegmentsFromCSV();
  if (document.querySelector("#donutChart").innerHTML !== "") {
    document.querySelector("#donutChart").innerHTML = "";
  }
  if (viewMode === "day") {
    $('#dayNav').show();
    let dayEv = await renderDayView();
    let ds = new Date(currentDate.getTime()); ds.setHours(0, 0, 0, 0);
    let de = new Date(currentDate.getTime()); de.setHours(23, 59, 59, 999);
    renderSummary(dayEv, ds.getTime(), de.getTime());
  } else if (viewMode === "week") {
    $('#dayNav').hide();
    $timeline.hide();
    $currentDateLabel.text("This Week");
    let [startMs, endMs] = getWeekRange();
    let allEv = [...events];
    if (currentSegment) allEv.push(currentSegment);
    let wEv = allEv.filter(ev => ev.end >= startMs && ev.start <= endMs);
    renderSummary(wEv, startMs, endMs);
  } else if (viewMode === "month") {
    $('#dayNav').hide();
    $timeline.hide();
    $currentDateLabel.text("This Month");
    let [startMs, endMs] = getMonthRange();
    let allEv = [...events];
    if (currentSegment) allEv.push(currentSegment);
    let mEv = allEv.filter(ev => ev.end >= startMs && ev.start <= endMs);
    renderSummary(mEv, startMs, endMs);
  }
}

// Show segment details in a popup modal
function showSegmentDetails(details) {
  let startStr = new Date(details.start).toLocaleString();
  let endStr = new Date(details.end).toLocaleString();
  let duration = Math.round((details.end - details.start) / 60000);
  let content = `<strong>Title:</strong> ${details.title}<br>
                 <strong>Start:</strong> ${startStr}<br>
                 <strong>End:</strong> ${endStr}<br>
                 <strong>Duration:</strong> ${duration} min`;
  $("#segmentDetailsContent").html(content);
  $("#segmentDetailsModal").modal("show");
}

$(document).ready(async () => {
  loadSettings();
  initSettingsUI();
  applySettings();
  loadSegmentsFromCSV();
  if (userSettings.defaultView === "week" || userSettings.defaultView === "month") {
    viewMode = userSettings.defaultView;
  }
  await renderView();
});
