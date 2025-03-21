/**
 * TestrisXD - Utility Functions
 */

// Block size in pixels (default size for rendering)
const BLOCK_SIZE = 20;

// Tetromino colors
const COLORS = {
    i: '#00f0f0', // cyan
    j: '#0000f0', // blue
    l: '#f0a000', // orange
    o: '#f0f000', // yellow
    s: '#00f000', // green
    t: '#a000f0', // purple
    z: '#f00000'  // red
};

// Particle system for explosions
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.active = false;
    }
    
    // Create explosion particles at the specified row
    createExplosion(ctx, rowY, canvasWidth, canvasHeight, scale = 1.0, useCircle = false) {
        this.active = true;
        const cellHeight = canvasHeight / 20;
        const cellWidth = canvasWidth / 10;
        
        // Scale particle count, size, and velocity based on scale parameter
        const particleCount = Math.round(20 * scale);
        
        // Create particles for each cell in the row
        for (let x = 0; x < 10; x++) {
            // Create multiple particles per cell for a more dense effect
            for (let i = 0; i < particleCount; i++) {
                const xPos = x * cellWidth + Math.random() * cellWidth;
                const yPos = rowY * cellHeight + Math.random() * cellHeight;
                
                // Add randomness to velocity for a more natural explosion - SLOWER VELOCITIES
                // Scale velocity based on explosion size
                const velX = (Math.random() - 0.5) * 15 * scale; // Scaled velocity
                const velY = (Math.random() - 0.5) * 15 * scale; // Scaled velocity
                
                // Random colors for particles
                const colors = Object.values(COLORS);
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // Random particle size - scaled
                const size = (Math.random() * 10 + 2) * Math.sqrt(scale);
                
                // Random lifespan - INCREASED LIFETIME
                const life = (Math.random() * 200 + 100) * scale; // Scaled lifetime
                
                this.particles.push({
                    x: xPos,
                    y: yPos,
                    velX: velX,
                    velY: velY,
                    size: size,
                    color: color,
                    life: life,
                    opacity: 1.0,
                    gravity: 0.2, // Reduced from 0.4
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1, // Reduced from 0.2
                    useCircle: useCircle // Store whether this particle should be a circle
                });
            }
        }
        
        // Also create a shockwave effect - scale the number based on scale
        const shockwaveCount = Math.round(10 * Math.sqrt(scale));
        for (let i = 0; i < shockwaveCount; i++) {
            const angle = i * (Math.PI * 2 / shockwaveCount);
            const speed = (5 + Math.random() * 5) * scale; // Scaled speed
            
            this.particles.push({
                x: canvasWidth / 2,
                y: rowY * cellHeight + cellHeight / 2,
                velX: Math.cos(angle) * speed,
                velY: Math.sin(angle) * speed,
                size: 20 * Math.sqrt(scale), // Scaled size
                color: '#FFFFFF',
                life: 60 * scale, // Scaled lifetime
                opacity: 0.7,
                isShockwave: true,
                maxSize: (70 + Math.random() * 50) * scale, // Scaled max size
                useCircle: useCircle // Always use circles for shockwaves
            });
        }
        
        // Add some debris particles that look like broken blocks - scale count based on scale
        const debrisCount = Math.round(15 * scale);
        for (let i = 0; i < debrisCount; i++) {
            const x = Math.random() * canvasWidth;
            const y = rowY * cellHeight + Math.random() * cellHeight;
            
            // Use the colors array we defined earlier in this method
            const colors = Object.values(COLORS);
            
            this.particles.push({
                x: x,
                y: y,
                velX: (Math.random() - 0.5) * 10 * scale, // Scaled velocity
                velY: (Math.random() - 0.5) * 10 * scale, // Scaled velocity
                size: (Math.random() * 15 + 5) * Math.sqrt(scale), // Scaled size
                color: colors[Math.floor(Math.random() * colors.length)],
                life: (Math.random() * 240 + 160) * scale, // Scaled lifetime
                opacity: 1.0,
                gravity: 0.1, // Reduced from 0.2
                isDebris: true,
                useCircle: useCircle // Store whether this particle should be a circle
            });
        }
    }
    
    // Update and render all particles
    update(ctx, canvasWidth, canvasHeight) {
        if (!this.active || this.particles.length === 0) return false;
        
        ctx.save();
        
        // Update and render each particle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position - SLOWER MOVEMENT
            p.x += p.velX * 0.8; // Added multiplier to slow down
            p.y += p.velY * 0.8; // Added multiplier to slow down
            
            // Apply gravity to normal particles
            if (!p.isShockwave) {
                p.velY += p.gravity;
            }
            
            // Update rotation
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            
            // Handle shockwave growth
            if (p.isShockwave) {
                p.size += 2.5; // Reduced from 4
                p.opacity -= 0.015; // Reduced from 0.03
                
                // Draw shockwave as a circle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (p.isDebris) {
                // Draw debris as squares or circles with rotation
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                // Reduce particle life - SLOWER DECAY
                p.life -= 0.5; // Reduced from 1
                
                // Calculate opacity based on remaining life
                p.opacity = p.life / 100;
                
                const colorWithOpacity = `rgba(${hexToRgb(p.color)}, ${p.opacity})`;
                
                if (p.useCircle) {
                    // Draw circle debris
                    ctx.fillStyle = colorWithOpacity;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add a highlight effect to debris
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(-p.size/5, -p.size/5, p.size/5, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Draw square debris
                    ctx.fillStyle = colorWithOpacity;
                    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                    
                    // Add a highlight effect to debris
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                    ctx.fillRect(-p.size/2, -p.size/2, p.size/4, p.size/4);
                }
                
                ctx.restore();
            } else {
                // Reduce particle life - SLOWER DECAY
                p.life -= 0.5; // Reduced from 1
                
                // Calculate opacity based on remaining life
                p.opacity = p.life / 100;
                
                // Draw normal particle (square or circle)
                const colorWithOpacity = `rgba(${hexToRgb(p.color)}, ${p.opacity})`;
                
                if (p.useCircle) {
                    // Draw circle particle
                    ctx.fillStyle = colorWithOpacity;
                    ctx.beginPath();
                    ctx.arc(p.x + p.size/2, p.y + p.size/2, p.size/2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add subtle highlight
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(p.x + p.size/3, p.y + p.size/3, p.size/4, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Draw square particle
                    ctx.fillStyle = colorWithOpacity;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
            
            // Remove dead particles
            if (p.life <= 0 || p.opacity <= 0 || (p.isShockwave && p.size >= p.maxSize)) {
                this.particles.splice(i, 1);
            }
        }
        
        ctx.restore();
        
        // Return true if the system is still active
        return this.particles.length > 0;
    }
    
    // Clear all particles
    clear() {
        this.particles = [];
        this.active = false;
    }
}

// Convert hex color to RGB for opacity support
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Initialize all game canvases with 10x20 grids
function initializeCanvases() {
    const canvases = document.querySelectorAll('.game-canvas');
    
    canvases.forEach((canvas, index) => {
        // Make sure canvas dimensions match the attribute settings
        canvas.width = 200;
        canvas.height = 400;
        
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the grid lines
        drawGrid(ctx, canvas.width, canvas.height);
    });
}

// Draw a 10x20 grid on the canvas
function drawGrid(ctx, width, height) {
    const cellWidth = width / 10;
    const cellHeight = height / 20;
    
    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let i = 1; i < 10; i++) {
        const x = Math.floor(i * cellWidth) + 0.5; // +0.5 for crisp lines
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 1; i < 20; i++) {
        const y = Math.floor(i * cellHeight) + 0.5; // +0.5 for crisp lines
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
}

// Draw a block at a specific grid position
function drawBlock(ctx, x, y, color, canvasWidth, canvasHeight) {
    const cellWidth = canvasWidth / 10;
    const cellHeight = canvasHeight / 20;
    
    ctx.fillStyle = color;
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    
    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight / 10);
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth / 10, cellHeight);
    
    // Add shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x * cellWidth, y * cellHeight + cellHeight * 0.9, cellWidth, cellHeight / 10);
    ctx.fillRect(x * cellWidth + cellWidth * 0.9, y * cellHeight, cellWidth / 10, cellHeight);
}

// Draw a ghost block at a specific grid position (semi-transparent)
function drawGhostBlock(ctx, x, y, color, canvasWidth, canvasHeight) {
    const cellWidth = canvasWidth / 10;
    const cellHeight = canvasHeight / 20;
    
    // Set transparency
    ctx.globalAlpha = 0.3;
    
    // Draw semi-transparent block
    ctx.fillStyle = color;
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    
    // Add border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    
    // Reset transparency
    ctx.globalAlpha = 1.0;
}

// The commented-out Theme Management code below has been moved to index.html
// Removing to clean up the file 