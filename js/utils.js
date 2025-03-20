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