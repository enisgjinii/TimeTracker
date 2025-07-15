// Enhanced Dashboard Components for TimeTracker Pro

class EnhancedDashboard {
    constructor() {
        this.charts = {};
        this.widgets = {};
        this.notifications = [];
    }

    // Create productivity analytics dashboard
    createProductivityDashboard(data) {
        const dashboardHtml = `
            <div class="row g-4 mb-4">
                <!-- Quick Stats Cards -->
                <div class="col-md-3">
                    ${ShadcnComponents.createStatsCard(
                        'Today\'s Focus Time',
                        this.formatTime(data.focusTime),
                        '+12%',
                        'fi fi-rr-target',
                        'up'
                    )}
                </div>
                <div class="col-md-3">
                    ${ShadcnComponents.createStatsCard(
                        'Productivity Score',
                        `${data.productivityScore}%`,
                        '+5%',
                        'fi fi-rr-chart-line-up',
                        'up'
                    )}
                </div>
                <div class="col-md-3">
                    ${ShadcnComponents.createStatsCard(
                        'Apps Used',
                        data.appsCount,
                        '-2',
                        'fi fi-rr-apps',
                        'down'
                    )}
                </div>
                <div class="col-md-3">
                    ${ShadcnComponents.createStatsCard(
                        'Distractions',
                        data.distractions,
                        '-8%',
                        'fi fi-rr-exclamation',
                        'up'
                    )}
                </div>
            </div>

            <div class="row g-4 mb-4">
                <!-- Productivity Chart -->
                <div class="col-lg-8">
                    ${ShadcnComponents.createCard(
                        'Productivity Timeline',
                        '<canvas id="productivityChart" height="300"></canvas>'
                    )}
                </div>
                
                <!-- Quick Actions -->
                <div class="col-lg-4">
                    ${ShadcnComponents.createCard(
                        'Quick Actions',
                        this.createQuickActions()
                    )}
                </div>
            </div>

            <div class="row g-4 mb-4">
                <!-- App Usage Breakdown -->
                <div class="col-lg-6">
                    ${ShadcnComponents.createCard(
                        'Top Applications',
                        '<canvas id="appUsageChart" height="250"></canvas>'
                    )}
                </div>
                
                <!-- Goals Progress -->
                <div class="col-lg-6">
                    ${ShadcnComponents.createCard(
                        'Daily Goals',
                        this.createGoalsWidget(data.goals)
                    )}
                </div>
            </div>

            <div class="row g-4">
                <!-- Recent Activity -->
                <div class="col-lg-8">
                    ${ShadcnComponents.createCard(
                        'Recent Activity',
                        this.createActivityFeed(data.recentActivity)
                    )}
                </div>
                
                <!-- Insights Panel -->
                <div class="col-lg-4">
                    ${ShadcnComponents.createCard(
                        'AI Insights',
                        this.createInsightsPanel(data.insights)
                    )}
                </div>
            </div>
        `;

        return dashboardHtml;
    }

    // Create quick actions widget
    createQuickActions() {
        return `
            <div class="d-grid gap-3">
                ${ShadcnComponents.createButton(
                    'Start Focus Session',
                    'primary',
                    'md',
                    'fi fi-rr-target',
                    'startFocusSession()'
                )}
                ${ShadcnComponents.createButton(
                    'Take Break',
                    'secondary',
                    'md',
                    'fi fi-rr-coffee',
                    'startBreak()'
                )}
                ${ShadcnComponents.createButton(
                    'Set Goal',
                    'ghost',
                    'md',
                    'fi fi-rr-flag',
                    'openGoalModal()'
                )}
                ${ShadcnComponents.createButton(
                    'Export Data',
                    'ghost',
                    'md',
                    'fi fi-rr-download',
                    'exportData()'
                )}
            </div>
        `;
    }

    // Create goals progress widget
    createGoalsWidget(goals) {
        if (!goals || goals.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fi fi-rr-flag text-muted fs-1 mb-3"></i>
                    <p class="text-muted">No goals set for today</p>
                    ${ShadcnComponents.createButton(
                        'Set Your First Goal',
                        'primary',
                        'sm',
                        'fi fi-rr-plus',
                        'openGoalModal()'
                    )}
                </div>
            `;
        }

        const goalsHtml = goals.map(goal => `
            <div class="goal-item mb-3 p-3 rounded" style="background: var(--accent); border: 1px solid var(--border);">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <h6 class="mb-0 fw-medium">${goal.title}</h6>
                    <span class="badge bg-primary">${goal.progress}%</span>
                </div>
                ${ShadcnComponents.createProgress(goal.progress, 100, false)}
                <small class="text-muted mt-1 d-block">${goal.description}</small>
            </div>
        `).join('');

        return `
            <div class="goals-container">
                ${goalsHtml}
                <div class="text-center mt-3">
                    ${ShadcnComponents.createButton(
                        'Add Goal',
                        'ghost',
                        'sm',
                        'fi fi-rr-plus',
                        'openGoalModal()'
                    )}
                </div>
            </div>
        `;
    }

    // Create activity feed
    createActivityFeed(activities) {
        if (!activities || activities.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fi fi-rr-time-past text-muted fs-1 mb-3"></i>
                    <p class="text-muted">No recent activity</p>
                </div>
            `;
        }

        const activitiesHtml = activities.map(activity => `
            <div class="activity-item d-flex align-items-center gap-3 p-3 rounded mb-2" 
                 style="background: var(--accent); border: 1px solid var(--border);">
                <div class="activity-icon">
                    <i class="${this.getActivityIcon(activity.type)} text-primary"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="fw-medium">${activity.title}</div>
                    <small class="text-muted">${activity.description}</small>
                </div>
                <div class="text-end">
                    <small class="text-muted">${this.formatTimeAgo(activity.timestamp)}</small>
                    ${activity.duration ? `<div><small class="badge bg-secondary">${this.formatTime(activity.duration)}</small></div>` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="activity-feed" style="max-height: 400px; overflow-y: auto;">
                ${activitiesHtml}
            </div>
        `;
    }

    // Create AI insights panel
    createInsightsPanel(insights) {
        const insightsHtml = insights.map(insight => `
            <div class="insight-item p-3 rounded mb-3" 
                 style="background: var(--accent); border-left: 4px solid var(--primary);">
                <div class="d-flex align-items-start gap-2">
                    <i class="fi fi-rr-bulb text-primary mt-1"></i>
                    <div>
                        <h6 class="mb-1 fw-medium">${insight.title}</h6>
                        <p class="mb-0 small text-muted">${insight.description}</p>
                        ${insight.action ? `
                            <div class="mt-2">
                                ${ShadcnComponents.createButton(
                                    insight.action.text,
                                    'ghost',
                                    'sm',
                                    null,
                                    insight.action.handler
                                )}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div class="insights-container">
                ${insightsHtml}
                <div class="text-center mt-3">
                    <small class="text-muted">Powered by AI Analytics</small>
                </div>
            </div>
        `;
    }

    // Create Pomodoro timer widget
    createPomodoroWidget() {
        return `
            <div class="pomodoro-widget text-center p-4">
                <div class="pomodoro-timer mb-4">
                    <div class="timer-circle position-relative d-inline-block">
                        <svg width="200" height="200" class="timer-svg">
                            <circle cx="100" cy="100" r="90" 
                                    fill="none" 
                                    stroke="var(--border)" 
                                    stroke-width="8"/>
                            <circle cx="100" cy="100" r="90" 
                                    fill="none" 
                                    stroke="var(--primary)" 
                                    stroke-width="8"
                                    stroke-linecap="round"
                                    stroke-dasharray="565.48"
                                    stroke-dashoffset="565.48"
                                    id="timerProgress"
                                    transform="rotate(-90 100 100)"/>
                        </svg>
                        <div class="timer-display position-absolute top-50 start-50 translate-middle">
                            <div class="fs-1 fw-bold" id="timerDisplay">25:00</div>
                            <div class="text-muted" id="timerStatus">Focus Time</div>
                        </div>
                    </div>
                </div>
                
                <div class="timer-controls d-flex justify-content-center gap-2 mb-3">
                    ${ShadcnComponents.createButton('Start', 'primary', 'md', 'fi fi-rr-play', 'startPomodoro()')}
                    ${ShadcnComponents.createButton('Pause', 'secondary', 'md', 'fi fi-rr-pause', 'pausePomodoro()')}
                    ${ShadcnComponents.createButton('Reset', 'ghost', 'md', 'fi fi-rr-refresh', 'resetPomodoro()')}
                </div>
                
                <div class="pomodoro-settings">
                    <div class="row g-2">
                        <div class="col-4">
                            <label class="form-label small">Focus</label>
                            <input type="number" class="form-control form-control-sm" value="25" id="focusMinutes">
                        </div>
                        <div class="col-4">
                            <label class="form-label small">Short Break</label>
                            <input type="number" class="form-control form-control-sm" value="5" id="shortBreakMinutes">
                        </div>
                        <div class="col-4">
                            <label class="form-label small">Long Break</label>
                            <input type="number" class="form-control form-control-sm" value="15" id="longBreakMinutes">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Create notification system
    createNotification(message, type = 'info', duration = 5000) {
        const id = 'notification-' + Date.now();
        const notification = {
            id,
            message,
            type,
            timestamp: Date.now()
        };

        this.notifications.push(notification);

        const notificationHtml = `
            <div id="${id}" class="notification toast align-items-center border-0 show" 
                 role="alert" aria-live="assertive" aria-atomic="true"
                 style="position: fixed; top: 20px; right: 20px; z-index: 1050; min-width: 300px;">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="fi fi-rr-${this.getNotificationIcon(type)} text-${type}"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        // Check if jQuery is available
        if (typeof $ !== 'undefined') {
            $('body').append(notificationHtml);
            
            // Auto-dismiss
            setTimeout(() => {
                $(`#${id}`).fadeOut(() => {
                    $(`#${id}`).remove();
                    this.notifications = this.notifications.filter(n => n.id !== id);
                });
            }, duration);
        } else {
            // Fallback to vanilla JS
            const body = document.body;
            if (body) {
                body.insertAdjacentHTML('beforeend', notificationHtml);
                
                // Auto-dismiss
                setTimeout(() => {
                    const notificationEl = document.getElementById(id);
                    if (notificationEl) {
                        notificationEl.style.opacity = '0';
                        setTimeout(() => {
                            notificationEl.remove();
                            this.notifications = this.notifications.filter(n => n.id !== id);
                        }, 300);
                    }
                }, duration);
            }
        }

        return id;
    }

    // Initialize charts
    initializeCharts(data) {
        this.initProductivityChart(data.productivity);
        this.initAppUsageChart(data.appUsage);
    }

    // Initialize productivity chart
    initProductivityChart(data) {
        const ctx = document.getElementById('productivityChart');
        if (!ctx) return;

        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Productivity Score',
                    data: data.scores,
                    borderColor: 'hsl(var(--primary))',
                    backgroundColor: 'hsla(var(--primary), 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Initialize app usage chart
    initAppUsageChart(data) {
        const ctx = document.getElementById('appUsageChart');
        if (!ctx) return;

        this.charts.appUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'hsl(var(--primary))',
                        'hsl(var(--secondary))',
                        'hsl(var(--accent))',
                        'hsl(var(--muted))',
                        'hsl(var(--destructive))'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Utility methods
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    getActivityIcon(type) {
        const icons = {
            focus: 'fi fi-rr-target',
            break: 'fi fi-rr-coffee',
            distraction: 'fi fi-rr-exclamation',
            app_switch: 'fi fi-rr-apps',
            goal_completed: 'fi fi-rr-check',
            session_start: 'fi fi-rr-play',
            session_end: 'fi fi-rr-stop'
        };
        return icons[type] || 'fi fi-rr-time-past';
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check',
            error: 'exclamation',
            warning: 'exclamation-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDashboard;
} else {
    window.EnhancedDashboard = EnhancedDashboard;
}