/**
 * TestrisXD - Theme and Toggle Functionality
 * Handles theme switching and toggle initialization
 */

// Initialize theme toggle and demo mode functionality
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDemoToggle();
    setupSpeedSlider();
});

// Check for system preferences
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // First check if we have stored user preference
    const darkModeStored = localStorage.getItem('darkMode');
    
    if (darkModeStored !== null) {
        // Use stored preference
        const darkMode = darkModeStored === 'true';
        enableDarkMode(darkMode);
        if (themeToggle) themeToggle.checked = darkMode;
    } else {
        // Otherwise use system preference
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        enableDarkMode(prefersDarkMode);
        if (themeToggle) themeToggle.checked = prefersDarkMode;
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only follow system changes if user hasn't set a preference
        if (localStorage.getItem('darkMode') === null) {
            const darkMode = e.matches;
            enableDarkMode(darkMode);
            if (themeToggle) themeToggle.checked = darkMode;
        }
    });
    
    // Add event listener to toggle
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            enableDarkMode(this.checked);
            // Store user preference
            localStorage.setItem('darkMode', this.checked);
        });
    }
}

// Toggle dark mode on/off
function enableDarkMode(enable) {
    document.body.classList.toggle('dark-theme', enable);
}

// Initialize demo toggle
function initDemoToggle() {
    const demoToggle = document.getElementById('demo-toggle');
    const speedSliderContainer = document.querySelector('.slider-container');
    
    if (demoToggle) {
        demoToggle.checked = false;
        
        // Hide speed slider initially (demo mode is off by default)
        if (speedSliderContainer) {
            speedSliderContainer.classList.remove('visible');
        }
        
        // Add event listener to toggle
        demoToggle.addEventListener('click', function() {
            // Show/hide speed slider based on demo mode state
            if (speedSliderContainer) {
                if (this.checked) {
                    speedSliderContainer.classList.add('visible');
                    // Add tooltip to statistics when in demo mode
                    addStatsTooltip();
                } else {
                    speedSliderContainer.classList.remove('visible');
                    // Remove tooltip when demo mode is off
                    removeStatsTooltip();
                }
            }
            
            // Update the game's demo mode setting
            if (window.game && typeof window.game.toggleDemoMode === 'function') {
                window.game.toggleDemoMode(this.checked);
            }
        });
    }
}

// Add tooltip to statistics section for demo mode
function addStatsTooltip() {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsSection.classList.add('with-tooltip');
        statsSection.setAttribute('title', 'Click on a block type to force it as the next piece (click again to disable)');
    }
}

// Remove tooltip from statistics section
function removeStatsTooltip() {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsSection.classList.remove('with-tooltip');
        statsSection.removeAttribute('title');
    }
}

// Set up demon speed slider
function setupSpeedSlider() {
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    if (speedSlider && speedValue) {
        // Initial value
        updateSpeedLabel(speedSlider.value);
        
        // Update when slider changes
        speedSlider.addEventListener('input', function() {
            updateSpeedLabel(this.value);
            
            // If game instance exists, update AI speed
            if (window.game && typeof window.game.setDemoSpeed === 'function') {
                const value = parseInt(this.value);
                const aiSpeed = 11 - value; // Invert so higher = faster
                window.game.setDemoSpeed(aiSpeed);
            }
        });
    }
}

// Update speed slider label
function updateSpeedLabel(value) {
    const speedValue = document.getElementById('speed-value');
    if (!speedValue) return;
    
    let speedText = '';
    const intValue = parseInt(value);
    
    if (intValue <= 3) {
        speedText = intValue + ' - Slow';
    } else if (intValue <= 7) {
        speedText = intValue + ' - Medium';
    } else {
        speedText = intValue + ' - Fast';
    }
    
    speedValue.textContent = speedText;
}

// Directly initialize if the DOM is already loaded
if (document.readyState !== 'loading') {
    initTheme();
    initDemoToggle();
    setupSpeedSlider();
} 