/**
 * TestrisXD - Theme and Toggle Functionality
 * Handles theme switching and toggle initialization
 */

// Default settings
const DEFAULT_SETTINGS = {
    darkMode: false,
    boardRotation: true,
    demoMode: false,
    speedSetting: 5
};

// Initialize theme toggle and demo mode functionality
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initBoardRotationToggle();
    initDemoToggle();
    setupSpeedSlider();
});

// Check for system preferences or stored user preferences
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
        
        // Store the initial value
        localStorage.setItem('darkMode', prefersDarkMode);
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

// Initialize board rotation toggle
function initBoardRotationToggle() {
    const rotateToggle = document.getElementById('rotate-toggle');
    
    if (rotateToggle) {
        // Check if we have stored user preference
        const boardRotationStored = localStorage.getItem('boardRotation');
        
        if (boardRotationStored !== null) {
            // Use stored preference
            const boardRotation = boardRotationStored === 'true';
            rotateToggle.checked = boardRotation;
            
            // Update the game's board rotation setting if game is available
            if (window.game) {
                window.game.allowBoardRotation = boardRotation;
            }
        } else {
            // Use default (true)
            rotateToggle.checked = DEFAULT_SETTINGS.boardRotation;
            localStorage.setItem('boardRotation', DEFAULT_SETTINGS.boardRotation);
        }
        
        // Add event listener to toggle
        rotateToggle.addEventListener('change', function() {
            // Store user preference
            localStorage.setItem('boardRotation', this.checked);
            
            // Update the game's board rotation setting if game is available
            if (window.game) {
                window.game.allowBoardRotation = this.checked;
            }
        });
    }
}

// Toggle dark mode on/off
function enableDarkMode(enable) {
    document.body.classList.toggle('dark-mode', enable);
}

// Initialize demo toggle
function initDemoToggle() {
    const demoToggle = document.getElementById('demo-toggle');
    const speedSliderContainer = document.querySelector('.slider-container');
    
    // Global interval reference that can be cleared by multiple functions
    let waitForGameInterval = null;
    
    // Function to properly activate demo mode
    const activateDemoMode = (isActive) => {
        // Update UI
        if (speedSliderContainer) {
            speedSliderContainer.classList.toggle('visible', isActive);
        }
        
        // Add/remove tooltip
        if (isActive) {
            addStatsTooltip();
            document.body.classList.add('demo-mode-active');
        } else {
            removeStatsTooltip();
            document.body.classList.remove('demo-mode-active');
        }
        
        // Clear any existing interval
        if (waitForGameInterval) {
            clearInterval(waitForGameInterval);
            waitForGameInterval = null;
        }
        
        // Try to update game state, or wait for game to be available
        if (window.game && typeof window.game.toggleDemoMode === 'function') {
            window.game.toggleDemoMode(isActive);
            
            // Also ensure speed settings are applied
            const speedSettingStored = localStorage.getItem('speedSetting');
            if (isActive && speedSettingStored !== null && window.game.setDemoSpeed) {
                const speedSetting = parseInt(speedSettingStored);
                const aiSpeed = 11 - speedSetting; // Invert so higher = faster
                window.game.setDemoSpeed(aiSpeed);
            }
        } else if (isActive) {
            // If game isn't available yet and we want to activate demo mode,
            // set up an interval to wait for it
            let attempts = 0;
            const maxAttempts = 50; // More attempts, checking for 5 seconds
            
            waitForGameInterval = setInterval(() => {
                attempts++;
                if (window.game && typeof window.game.toggleDemoMode === 'function') {
                    window.game.toggleDemoMode(isActive);
                    
                    // Apply speed settings
                    const speedSettingStored = localStorage.getItem('speedSetting');
                    if (speedSettingStored !== null && window.game.setDemoSpeed) {
                        const speedSetting = parseInt(speedSettingStored);
                        const aiSpeed = 11 - speedSetting;
                        window.game.setDemoSpeed(aiSpeed);
                    }
                    
                    clearInterval(waitForGameInterval);
                    waitForGameInterval = null;
                } else if (attempts >= maxAttempts) {
                    // Stop trying after max attempts
                    clearInterval(waitForGameInterval);
                    waitForGameInterval = null;
                }
            }, 100);
        }
    };
    
    if (demoToggle) {
        // Check if we have stored user preference
        const demoModeStored = localStorage.getItem('demoMode');
        
        if (demoModeStored !== null) {
            // Use stored preference
            const demoMode = demoModeStored === 'true';
            demoToggle.checked = demoMode;
            
            // Activate demo mode if needed
            if (demoMode) {
                activateDemoMode(true);
            }
        } else {
            // Use default (false)
            demoToggle.checked = DEFAULT_SETTINGS.demoMode;
            localStorage.setItem('demoMode', DEFAULT_SETTINGS.demoMode);
        }
        
        // Add event listener to toggle
        demoToggle.addEventListener('click', function() {
            const isActive = this.checked;
            
            // Store user preference
            localStorage.setItem('demoMode', isActive);
            
            // Activate or deactivate demo mode
            activateDemoMode(isActive);
        });
    }
    
    // Set up multiple checks to ensure demo mode is activated if needed
    
    // Check when page is fully loaded
    window.addEventListener('load', () => {
        if (demoToggle && demoToggle.checked) {
            // Double-check that demo mode is activated if toggle is on
            activateDemoMode(true);
        }
    });
    
    // Additional check a bit after page load (for late-loading scripts)
    setTimeout(() => {
        if (demoToggle && demoToggle.checked) {
            activateDemoMode(true);
        }
    }, 1000);
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
        // Check if we have stored user preference
        const speedSettingStored = localStorage.getItem('speedSetting');
        
        if (speedSettingStored !== null) {
            // Use stored preference
            const speedSetting = parseInt(speedSettingStored);
            speedSlider.value = speedSetting;
            updateSpeedLabel(speedSetting);
            
            // Update the game's demo speed if game is available
            if (window.game && typeof window.game.setDemoSpeed === 'function') {
                const aiSpeed = 11 - speedSetting; // Invert so higher = faster
                window.game.setDemoSpeed(aiSpeed);
            }
        } else {
            // Use default (5)
            speedSlider.value = DEFAULT_SETTINGS.speedSetting;
            updateSpeedLabel(DEFAULT_SETTINGS.speedSetting);
            localStorage.setItem('speedSetting', DEFAULT_SETTINGS.speedSetting);
        }
        
        // Update when slider changes
        speedSlider.addEventListener('input', function() {
            updateSpeedLabel(this.value);
            
            // Store user preference
            localStorage.setItem('speedSetting', this.value);
            
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
    
    const intValue = parseInt(value);
    let speedText;
    
    switch(intValue) {
        case 1:
            speedText = '🐌';
            break;
        case 2:
            speedText = '🐢';
            break;
        case 3:
            speedText = '🦥';
            break;
        case 4:
            speedText = '🚶';
            break;
        case 5:
            speedText = '🏃';
            break;
        case 6:
            speedText = '🚲';
            break;
        case 7:
            speedText = '🏎️';
            break;
        case 8:
            speedText = '⚡';
            break;
        case 9:
            speedText = '🚀';
            break;
        case 10:
            speedText = '💫';
            break;
        default:
            speedText = '🏃';
    }
    
    speedValue.textContent = speedText;
}

// Reset all settings to defaults
function resetOptions() {
    // Reset dark mode to system preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    localStorage.setItem('darkMode', prefersDarkMode);
    enableDarkMode(prefersDarkMode);
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.checked = prefersDarkMode;
    
    // Reset board rotation
    localStorage.setItem('boardRotation', DEFAULT_SETTINGS.boardRotation);
    const rotateToggle = document.getElementById('rotate-toggle');
    if (rotateToggle) rotateToggle.checked = DEFAULT_SETTINGS.boardRotation;
    if (window.game) window.game.allowBoardRotation = DEFAULT_SETTINGS.boardRotation;
    
    // Reset demo mode
    localStorage.setItem('demoMode', DEFAULT_SETTINGS.demoMode);
    const demoToggle = document.getElementById('demo-toggle');
    if (demoToggle) demoToggle.checked = DEFAULT_SETTINGS.demoMode;
    if (window.game && typeof window.game.toggleDemoMode === 'function') {
        window.game.toggleDemoMode(DEFAULT_SETTINGS.demoMode);
    }
    
    // Reset speed setting
    localStorage.setItem('speedSetting', DEFAULT_SETTINGS.speedSetting);
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) speedSlider.value = DEFAULT_SETTINGS.speedSetting;
    updateSpeedLabel(DEFAULT_SETTINGS.speedSetting);
    if (window.game && typeof window.game.setDemoSpeed === 'function') {
        const aiSpeed = 11 - DEFAULT_SETTINGS.speedSetting;
        window.game.setDemoSpeed(aiSpeed);
    }
    
    // Hide speed slider if demo mode is off
    const speedSliderContainer = document.querySelector('.slider-container');
    if (speedSliderContainer) {
        speedSliderContainer.classList.toggle('visible', DEFAULT_SETTINGS.demoMode);
    }
    
    // Remove tooltip if demo mode is off
    if (!DEFAULT_SETTINGS.demoMode) {
        removeStatsTooltip();
    }
}

// Attach reset button event listener
document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('reset-options');
    if (resetButton) {
        resetButton.addEventListener('click', resetOptions);
    }
});

// Directly initialize if the DOM is already loaded
if (document.readyState !== 'loading') {
    initTheme();
    initBoardRotationToggle();
    initDemoToggle();
    setupSpeedSlider();
    
    const resetButton = document.getElementById('reset-options');
    if (resetButton) {
        resetButton.addEventListener('click', resetOptions);
    }
} 