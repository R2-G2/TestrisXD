/**
 * TestrisXD - Theme and Toggle Functionality
 * Handles theme switching and toggle initialization
 */

// Initialize theme toggle and demo mode functionality
document.addEventListener('DOMContentLoaded', function() {
    initThemeBasedOnSystemPreference();
    initThemeToggle();
    initDemoToggle();
    initSpeedSlider();
});

// Check system preference for dark mode and apply it
function initThemeBasedOnSystemPreference() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check if the system prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // System prefers dark mode - enable it
        document.body.classList.add('dark-mode');
        if (themeToggle) {
            themeToggle.checked = true;
        }
        console.log('Dark mode enabled based on system preference');
    } else {
        // System prefers light mode - ensure it's enabled
        document.body.classList.remove('dark-mode');
        if (themeToggle) {
            themeToggle.checked = false;
        }
        console.log('Light mode enabled based on system preference');
    }
    
    // Add listener for system preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', event => {
                if (event.matches) {
                    // System switched to dark mode
                    document.body.classList.add('dark-mode');
                    if (themeToggle) {
                        themeToggle.checked = true;
                    }
                    console.log('Dark mode enabled - system change detected');
                } else {
                    // System switched to light mode
                    document.body.classList.remove('dark-mode');
                    if (themeToggle) {
                        themeToggle.checked = false;
                    }
                    console.log('Light mode enabled - system change detected');
                }
            });
    }
}

// Initialize theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Don't reset the value here, as we want to preserve what was set by system preference
        
        // Add click handler for theme toggle
        themeToggle.addEventListener('click', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                console.log('Dark mode enabled');
            } else {
                document.body.classList.remove('dark-mode');
                console.log('Dark mode disabled');
            }
        });
    }
}

// Initialize demo toggle
function initDemoToggle() {
    const demoToggle = document.getElementById('demo-toggle');
    const speedSliderContainer = document.querySelector('.slider-container');
    
    if (demoToggle) {
        demoToggle.checked = false;
        
        // Hide speed slider initially
        if (speedSliderContainer) {
            speedSliderContainer.classList.remove('visible');
        }
        
        // Make sure it's initialized properly for the game class
        demoToggle.addEventListener('click', function() {
            console.log('Demo mode toggled via UI:', this.checked);
            
            // Show/hide speed slider based on demo mode state
            if (speedSliderContainer) {
                if (this.checked) {
                    speedSliderContainer.classList.add('visible');
                    // Add tooltip to statistics when in demo mode
                    addStatsTooltip(true);
                } else {
                    speedSliderContainer.classList.remove('visible');
                    // Remove tooltip when demo mode is off
                    addStatsTooltip(false);
                }
            }
        });
    }
}

// Add tooltip to statistics section for demo mode
function addStatsTooltip(show) {
    const statsSection = document.querySelector('.stats-section h3');
    
    if (statsSection) {
        if (show) {
            statsSection.setAttribute('title', 'Click on a block type to force it as the next piece (click again to disable)');
            statsSection.style.cursor = 'help';
        } else {
            statsSection.removeAttribute('title');
            statsSection.style.cursor = '';
        }
    }
}

// Initialize speed slider
function initSpeedSlider() {
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    if (speedSlider && speedValue) {
        // Set initial value
        speedValue.textContent = speedSlider.value;
        
        // Add descriptive labels based on value
        function getSpeedLabel(value) {
            if (value <= 2) return "Glacial";
            if (value <= 4) return "Slow";
            if (value <= 6) return "Normal";
            if (value <= 7) return "Fast";
            if (value <= 8) return "Turbo";
            if (value <= 9) return "Warp";
            return "Lightspeed";
        }
        
        // Update the value display when slider is moved
        speedSlider.addEventListener('input', function() {
            const value = this.value;
            // Show only descriptive label
            speedValue.textContent = getSpeedLabel(value);
            
            // If game instance exists, update AI speed
            if (window.game && typeof window.game.setDemoSpeed === 'function') {
                // Convert slider value (1-10) to appropriate speed
                const aiSpeed = 11 - value; // Invert so higher = faster
                window.game.setDemoSpeed(aiSpeed);
                console.log('AI speed set to:', aiSpeed);
            }
        });
        
        // Set initial display to just the descriptive label
        speedValue.textContent = getSpeedLabel(speedSlider.value);
    }
}

// Add loading/initialized classes to help with transitions
function addLoadingClass(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('js-loading');
        setTimeout(() => {
            element.classList.remove('js-loading');
            element.classList.add('js-initialized');
        }, 300);
    }
}

// Execute immediately, not waiting for DOMContentLoaded
(function() {
    // Check for system preferences immediately
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }
    
    // Backup init for theme toggle with small delay to ensure everything is loaded
    setTimeout(function() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            console.log('Direct toggle initialization');
            if (!toggle.onclick) {
                toggle.onclick = function() {
                    if (this.checked) {
                        document.body.classList.add('dark-mode');
                        console.log('Dark mode ON');
                    } else {
                        document.body.classList.remove('dark-mode');
                        console.log('Dark mode OFF');
                    }
                };
            }
        }
    }, 500);
})(); 