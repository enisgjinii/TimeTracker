// Enhanced shadcn/ui-style components for TimeTracker Pro

class ShadcnComponents {
    // Create a modern card component
    static createCard(title, content, className = '') {
        return `
            <div class="card shadow-sm border-0 ${className}" style="background: var(--card); border: 1px solid var(--border) !important; border-radius: var(--radius);">
                ${title ? `<div class="card-header bg-transparent border-bottom" style="border-color: var(--border) !important;">
                    <h6 class="card-title mb-0 fw-semibold" style="color: var(--foreground);">${title}</h6>
                </div>` : ''}
                <div class="card-body">
                    ${content}
                </div>
            </div>
        `;
    }

    // Create a modern button with variants
    static createButton(text, variant = 'primary', size = 'md', icon = null, onClick = null) {
        const sizeClasses = {
            sm: 'btn-sm px-3 py-1',
            md: 'px-4 py-2',
            lg: 'btn-lg px-5 py-3'
        };
        
        const variantClasses = {
            primary: 'btn-primary',
            secondary: 'btn-outline-secondary',
            destructive: 'btn-outline-danger',
            ghost: 'btn-ghost',
            success: 'btn-success'
        };

        const iconHtml = icon ? `<i class="${icon} me-2"></i>` : '';
        const clickHandler = onClick ? `onclick="${onClick}"` : '';
        
        return `
            <button class="btn ${variantClasses[variant]} ${sizeClasses[size]} d-inline-flex align-items-center gap-2" 
                    ${clickHandler}
                    style="border-radius: var(--radius); font-weight: 500; transition: all 0.2s ease;">
                ${iconHtml}${text}
            </button>
        `;
    }

    // Create a modern input component
    static createInput(placeholder, type = 'text', id = '', className = '') {
        return `
            <input type="${type}" 
                   class="form-control ${className}" 
                   id="${id}"
                   placeholder="${placeholder}"
                   style="background: var(--card); border: 1px solid var(--border); color: var(--foreground); border-radius: var(--radius);">
        `;
    }

    // Create a modern select component
    static createSelect(options, id = '', className = '') {
        const optionsHtml = options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        
        return `
            <select class="form-select ${className}" 
                    id="${id}"
                    style="background: var(--card); border: 1px solid var(--border); color: var(--foreground); border-radius: var(--radius);">
                ${optionsHtml}
            </select>
        `;
    }

    // Create a modern badge component
    static createBadge(text, variant = 'secondary') {
        const variantClasses = {
            primary: 'text-bg-primary',
            secondary: 'text-bg-secondary',
            success: 'text-bg-success',
            danger: 'text-bg-danger',
            warning: 'text-bg-warning',
            info: 'text-bg-info'
        };
        
        return `
            <span class="badge ${variantClasses[variant]} rounded-pill" 
                  style="font-weight: 500; font-size: 0.75rem;">
                ${text}
            </span>
        `;
    }

    // Create a modern progress component
    static createProgress(value, max = 100, showLabel = true, className = '') {
        const percentage = Math.round((value / max) * 100);
        
        return `
            <div class="progress ${className}" style="height: 8px; border-radius: 4px; background: var(--muted);">
                <div class="progress-bar" 
                     role="progressbar" 
                     style="width: ${percentage}%; background: var(--primary); border-radius: 4px; transition: width 0.3s ease;"
                     aria-valuenow="${value}" 
                     aria-valuemin="0" 
                     aria-valuemax="${max}">
                </div>
            </div>
            ${showLabel ? `<div class="d-flex justify-content-between mt-1">
                <small class="text-muted">${value}/${max}</small>
                <small class="text-muted">${percentage}%</small>
            </div>` : ''}
        `;
    }

    // Create a modern alert component
    static createAlert(message, type = 'info', dismissible = true) {
        const typeClasses = {
            info: 'alert-info',
            success: 'alert-success',
            warning: 'alert-warning',
            danger: 'alert-danger'
        };
        
        const dismissButton = dismissible ? 
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : '';
        
        return `
            <div class="alert ${typeClasses[type]} ${dismissible ? 'alert-dismissible' : ''} fade show" 
                 role="alert"
                 style="border-radius: var(--radius); border: 1px solid var(--border);">
                ${message}
                ${dismissButton}
            </div>
        `;
    }

    // Create a modern stats card
    static createStatsCard(title, value, change = null, icon = null, trend = null) {
        const iconHtml = icon ? `<i class="${icon} text-primary fs-4"></i>` : '';
        const changeHtml = change ? `
            <div class="d-flex align-items-center gap-1 mt-1">
                <i class="fi fi-rr-arrow-${trend === 'up' ? 'up' : 'down'} text-${trend === 'up' ? 'success' : 'danger'}" style="font-size: 0.75rem;"></i>
                <small class="text-${trend === 'up' ? 'success' : 'danger'} fw-medium">${change}</small>
            </div>
        ` : '';
        
        return `
            <div class="card h-100 border-0 shadow-sm" style="background: var(--card); border: 1px solid var(--border) !important;">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h6 class="card-title text-muted mb-0 fw-medium" style="font-size: 0.875rem;">${title}</h6>
                        ${iconHtml}
                    </div>
                    <div class="fs-3 fw-bold text-primary mb-0">${value}</div>
                    ${changeHtml}
                </div>
            </div>
        `;
    }

    // Create a modern toggle switch
    static createToggle(id, label, checked = false, onChange = null) {
        const changeHandler = onChange ? `onchange="${onChange}"` : '';
        
        return `
            <div class="form-check form-switch">
                <input class="form-check-input" 
                       type="checkbox" 
                       role="switch" 
                       id="${id}"
                       ${checked ? 'checked' : ''}
                       ${changeHandler}
                       style="background-color: var(--card); border: 1px solid var(--border);">
                <label class="form-check-label fw-medium" for="${id}" style="color: var(--foreground);">
                    ${label}
                </label>
            </div>
        `;
    }

    // Create a modern tab component
    static createTabs(tabs, activeTab = 0) {
        const tabHeaders = tabs.map((tab, index) => `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${index === activeTab ? 'active' : ''}" 
                        id="${tab.id}-tab" 
                        data-bs-toggle="tab" 
                        data-bs-target="#${tab.id}" 
                        type="button" 
                        role="tab">
                    ${tab.icon ? `<i class="${tab.icon} me-2"></i>` : ''}${tab.title}
                </button>
            </li>
        `).join('');
        
        const tabContent = tabs.map((tab, index) => `
            <div class="tab-pane fade ${index === activeTab ? 'show active' : ''}" 
                 id="${tab.id}" 
                 role="tabpanel">
                ${tab.content}
            </div>
        `).join('');
        
        return `
            <div class="tabs-container">
                <ul class="nav nav-tabs view-tabs mb-3" role="tablist">
                    ${tabHeaders}
                </ul>
                <div class="tab-content">
                    ${tabContent}
                </div>
            </div>
        `;
    }

    // Create a modern modal
    static createModal(id, title, content, size = 'md') {
        const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';
        
        return `
            <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog ${sizeClass}">
                    <div class="modal-content" style="background: var(--card); border: 1px solid var(--border);">
                        <div class="modal-header" style="border-color: var(--border);">
                            <h5 class="modal-title fw-semibold" style="color: var(--foreground);">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="color: var(--foreground);">
                            ${content}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Create a modern tooltip
    static createTooltip(element, text, placement = 'top') {
        return `
            <span data-bs-toggle="tooltip" 
                  data-bs-placement="${placement}" 
                  data-bs-title="${text}">
                ${element}
            </span>
        `;
    }

    // Create a modern loading spinner
    static createSpinner(size = 'md', text = '') {
        const sizeClass = size === 'sm' ? 'spinner-border-sm' : '';
        
        return `
            <div class="d-flex align-items-center gap-2">
                <div class="spinner-border ${sizeClass}" role="status" style="color: var(--primary);">
                    <span class="visually-hidden">Loading...</span>
                </div>
                ${text ? `<span class="text-muted">${text}</span>` : ''}
            </div>
        `;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShadcnComponents;
} else {
    window.ShadcnComponents = ShadcnComponents;
}