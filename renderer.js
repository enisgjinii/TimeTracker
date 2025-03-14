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
const $focusTime = $('#focusedTime');
const $distractTime = $('#distractedTime');
const $usedList = $('#mostUsedList');
const $distractList = $('#topDistractionsList');
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
    $('#categoriesList').append(`<div class="d-flex align-items-center mb-1">
            <span class="badge bg-secondary me-2">${cat}</span>
            <button class="btn btn-sm btn-outline-danger rm-cat" data-index="${i}">&times;</button>
        </div>`);
  });
};

const popAppClass = () => {
  $('#appClassificationsList').empty();
  usrSet.appClassifications = usrSet.appClassifications || {};
  for (let app in usrSet.appClassifications) {
    let cat = usrSet.appClassifications[app];
    $('#appClassificationsList').append(`<div class="list-group-item d-flex justify-content-between align-items-center">
            <span>${app} &rarr; <em>${cat}</em></span>
            <button class="btn btn-sm btn-outline-danger rm-class" data-app="${app}">&times;</button>
        </div>`);
  }
};

$(document).on('click', '.rm-cat', function () {
  usrSet.categories.splice($(this).data('index'), 1);
  popCats();
});
$('#addCategoryBtn').click(() => {
  let newCat = prompt("Enter new category:");
  if (newCat) {
    usrSet.categories = usrSet.categories || [];
    usrSet.categories.push(newCat);
    popCats();
  }
});
$(document).on('click', '.rm-class', function () {
  delete usrSet.appClassifications[$(this).data('app')];
  popAppClass();
});
$('#addClassificationBtn').click(() => {
  let appName = prompt("Enter app name for classification:");
  if (appName) {
    let newCat = prompt("Enter category for " + appName + ":");
    if (newCat) {
      usrSet.appClassifications = usrSet.appClassifications || {};
      usrSet.appClassifications[appName] = newCat;
      popAppClass();
    }
  }
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
  $('#settingsModal').modal('hide');
});

$('#lightModeBtn').click(() => setThemeMode('light'));
$('#darkModeBtn').click(() => setThemeMode('dark'));
$('#systemModeBtn').click(() => setThemeMode('system'));

function setThemeMode(mode) {
  usrSet.themeMode = mode;
  saveSet();
  applySet();
}

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
  for (let hour = 0; hour < 24; hour++) {
    let topPos = hour * hourHeight;
    let labelStr = new Date(dayStart.getTime() + hour * 3600000).toLocaleTimeString([], { hour: '2-digit' });
    $timeline.append(`<div class="hour-label" style="top:${topPos}px;">${labelStr}</div>`, `<div class="timeline-hour" style="top:${topPos}px; height: ${hourHeight}px;"></div>`);
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
      css: { top: topOffset + 'px', left: leftOffset + 'px', width: blockWidth + 'px', height: blockHeight + 'px' },
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

const renderDaySummary = () => {
  let dayStart = new Date(date.getTime()); dayStart.setHours(0, 0, 0, 0);
  let dayEnd = new Date(date.getTime()); dayEnd.setHours(23, 59, 59, 999);
  const dayEvents = evs.filter(ev => ev.end >= dayStart.getTime() && ev.start <= dayEnd.getTime());
  renderSum(dayEvents, dayStart.getTime(), dayEnd.getTime());
};

const renderSum = (evList, startMs, endMs) => {
  if (!track && document.querySelector("#donutChart").innerHTML !== "") document.querySelector("#donutChart").innerHTML = "";
  let focusMs = 0, distractMs = 0;
  let usageMap = {};
  evList.forEach(ev => {
    let s = Math.max(ev.start, startMs);
    let e = Math.min(ev.end, endMs);
    let dur = e - s;
    if (dur < 60000) return;
    let app = ev.details?.owner?.name || extractAppName(ev.title);
    usageMap[app] = (usageMap[app] || 0) + dur;
    if (/youtube|discord|facebook/i.test(app)) distractMs += dur;
    else focusMs += dur;
  });

  if (!track) {
    new ApexCharts(document.querySelector("#donutChart"), {
      chart: { type: 'donut', width: 250 },
      labels: ["Focused", "Distracted"],
      series: [focusMs, distractMs],
      colors: ["#2eb85c", "#e55353"]
    }).render();
  }

  const formatTime = ms => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  $focusTime.text(formatTime(focusMs));
  $distractTime.text(formatTime(distractMs));

  const appendUsageList = ($list, usageArr, isDistract) => {
    $list.empty();
    usageArr.slice(0, 5).forEach(async ([app, ms]) => {
      let min = Math.round(ms / 60000);
      const iconUrl = getDevIcon(app) || `https://img.icons8.com/color/48/000000/${encodeURIComponent(app)}.png`;
      $list.append(`<li><img src="${iconUrl}" alt="${app}" style="width:16px; height:16px; margin-right:4px;">${app} - ${min} min</li>`);
    });
  };

  let usageArr = Object.entries(usageMap).sort(([, a], [, b]) => b - a);
  $usedList.empty();
  appendUsageList($usedList, usageArr);

  let distractors = usageArr.filter(([app]) => /youtube|discord|facebook/i.test(app));
  $distractList.empty();
  appendUsageList($distractList, distractors);
};


const renderView = async () => {
  loadSegCSV();
  if (view === "day") {
    $('#dayNav').show();
    await renderDayView();
    renderDaySummary();
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
});

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
  renderDaySummary();
});

$(document).keydown(e => {
  if (e.ctrlKey) {
    if (e.key === ',') zoom = Math.min(10.0, zoom + 0.2);
    else if (e.key === '.') zoom = Math.max(0.1, zoom - 0.2);
    renderView();
  }
});