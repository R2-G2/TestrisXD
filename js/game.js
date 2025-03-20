/**
 * Main game logic for the Tetris game
 */

class Game {
    constructor() {
        // Initialize game elements
        this.canvases = Array.from(document.querySelectorAll('.game-canvas'));
        this.contexts = this.canvases.map(canvas => canvas.getContext('2d'));
        
        // Initialize next piece preview canvases
        this.nextPieceCanvases = Array.from(document.querySelectorAll('.next-piece-display'));
        
        // Get UI elements for scores
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        
        // Listen for theme changes to re-render the canvases
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                // Re-render the canvases when theme changes
                setTimeout(() => {
                    this.renderAllCanvases();
                    this.renderNextPiece();
                }, 100); // Small delay to ensure theme change is applied
            });
        }
        
        // Board orientation - defines which boards have which mirroring settings
        // [0, 1, 2, 3] means boards are in original position
        // The value at each index represents which board's mirroring settings to use
        this.boardOrientation = [0, 1, 2, 3];
        
        // Game board
        this.board = {
            width: 10,
            height: 20,
            grid: Array(20).fill().map(() => Array(10).fill(null))
        };
        
        // Current and next pieces
        this.currentPiece = null;
        this.nextPiece = new Tetromino();
        
        // Game state
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        
        // Game speed (ms per step)
        this.speed = 1000;
        
        // Game loop timer
        this.timer = null;
        
        // DOM elements for score display
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        
        // Next piece displays (all 4 previews)
        this.nextPieceDisplays = document.querySelectorAll('.next-piece-display');
        this.nextPieceCanvases = [];
        
        // Create canvas for each next piece display
        this.nextPieceDisplays.forEach((display, index) => {
            const canvas = document.createElement('canvas');
            canvas.className = 'next-piece-canvas';
            display.appendChild(canvas);
            this.nextPieceCanvases.push(canvas);
        });
        
        // Set initial canvas dimensions but maintain aspect ratio
        this.resizeCanvases();
        
        // Add window resize event listener
        window.addEventListener('resize', () => {
            this.resizeCanvases();
            if (this.board && !this.isGameOver) {
                // Add a small delay to ensure CSS has been applied
                setTimeout(() => this.renderAllCanvases(), 50);
            }
        });
        
        // Draw initial grid on all game canvases
        this.canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            drawGrid(ctx, canvas.width, canvas.height);
        });
        
        // Render the next piece preview
        this.renderNextPiece();
        
        // Controls
        this.setupControls();
        
        // Buttons
        this.setupButtons();
    }
    
    // Resize canvases based on container size while maintaining aspect ratio
    resizeCanvases() {
        // Resize main game canvases
        this.canvases.forEach(canvas => {
            const container = canvas.parentElement;
            
            // Get the computed dimensions of the container
            const containerStyle = window.getComputedStyle(container);
            const containerWidth = Math.floor(parseFloat(containerStyle.width));
            const containerHeight = Math.floor(parseFloat(containerStyle.height));
            
            // Set the canvas size to match the container exactly
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // Force the canvas to use the container dimensions
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // Draw the initial grid
            const ctx = canvas.getContext('2d');
            drawGrid(ctx, canvas.width, canvas.height);
        });
        
        // Resize next piece preview canvases
        this.nextPieceCanvases.forEach(canvas => {
            const container = canvas.parentElement;
            
            // Get the computed dimensions of the container
            const containerStyle = window.getComputedStyle(container);
            const containerWidth = Math.floor(parseFloat(containerStyle.width));
            const containerHeight = Math.floor(parseFloat(containerStyle.height));
            
            // Set the canvas size to match the container exactly
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // Force the canvas to use the container dimensions
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // Draw the initial grid for preview (optional)
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        
        // Re-render if game is active
        if (this.board && !this.isGameOver && !this.isPaused) {
            this.renderAllCanvases();
            this.renderNextPiece();
        }
    }
    
    // Initialize game elements
    init() {
        // Create the first piece
        this.nextPiece = new Tetromino();
        
        // Reset game state
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.updateStats();
        
        // Initialize the boards
        this.board = {
            width: 10,
            height: 20,
            grid: Array(20).fill().map(() => Array(10).fill(null))
        };
        
        // Reset board orientation
        this.boardOrientation = [0, 1, 2, 3];
        
        // Redraw the grid on all game canvases
        this.canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            drawGrid(ctx, canvas.width, canvas.height);
        });
    }
    
    // Start the game
    start() {
        // Initialize game elements
        this.init();
        
        // Ensure we have a next piece
        if (!this.nextPiece) {
            this.nextPiece = new Tetromino();
        }
        
        // Create a new piece and start the game loop
        this.createNewPiece();
        this.startGameLoop();
        
        // Update UI
        const pauseButton = document.getElementById('pause-button');
        const startButton = document.getElementById('start-button');
        
        if (pauseButton) {
            pauseButton.textContent = 'Pause';
        }
        
        if (startButton) {
            startButton.textContent = 'Restart';
        }
        
        // Render everything
        this.renderAllCanvases();
        this.renderNextPiece();
    }
    
    // Game loop - called at regular intervals based on level
    startGameLoop() {
        // Clear any existing timer
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Create a new timer
        this.timer = setInterval(() => {
            this.update();
        }, this.speed);
    }
    
    // Update game state
    update() {
        // Skip if game is over or paused
        if (this.isGameOver || this.isPaused) return;
        
        // Move the current piece down
        const moved = this.currentPiece.moveDown(this.board);
        
        // If the piece couldn't move down, settle it and create a new one
        if (!moved) {
            this.settlePiece();
        }
        
        // Render to all canvases
        this.renderAllCanvases();
    }
    
    // Render the game state to all canvases
    renderAllCanvases() {
        this.canvases.forEach((canvas, index) => {
            const ctx = canvas.getContext('2d');
            // Pass the canvas index to determine if mirroring is needed
            this.renderCanvas(ctx, canvas.width, canvas.height, index);
        });
    }
    
    // Render the game state to a specific canvas
    renderCanvas(ctx, width, height, canvasIndex = 0) {
        // Calculate cell sizes
        const cellWidth = width / 10;
        const cellHeight = height / 20;
        
        // Get the mirroring orientation based on the board orientation
        const mirrorOrientation = this.boardOrientation[canvasIndex];
        
        // Determine mirroring based on the orientation value
        // Boards 2 and 4 (index 1 and 3) are horizontally mirrored
        // Boards 3 and 4 (index 2 and 3) are vertically mirrored (upside down)
        const isHorizontalMirrored = mirrorOrientation === 1 || mirrorOrientation === 3;
        const isVerticalMirrored = mirrorOrientation === 2 || mirrorOrientation === 3;
        
        // Use circles for mirrored boards, squares for unmirrored
        const useCircle = isHorizontalMirrored || isVerticalMirrored;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let i = 1; i < 10; i++) {
            const x = Math.floor(i * cellWidth) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 1; i < 20; i++) {
            const y = Math.floor(i * cellHeight) + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        // Draw settled blocks
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                // Apply mirroring to coordinates
                const displayX = isHorizontalMirrored ? 9 - x : x;
                const displayY = isVerticalMirrored ? 19 - y : y;
                
                const block = this.board.grid[y][x];
                if (block) {
                    // Handle both old format (string) and new format (object)
                    const blockType = typeof block === 'string' ? block : block.type;
                    
                    this.drawBlock(
                        ctx, 
                        displayX, 
                        displayY, 
                        COLORS[blockType], 
                        cellWidth, 
                        cellHeight,
                        useCircle
                    );
                }
            }
        }
        
        // Draw ghost piece (where the current piece would land)
        if (this.currentPiece && !this.isGameOver && !this.isPaused) {
            const ghostPiece = this.getGhostPiece();
            const ghostCoords = ghostPiece.getAbsoluteCoordinates();
            
            ghostCoords.forEach(coord => {
                if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                    // Apply mirroring to coordinates
                    const displayX = isHorizontalMirrored ? 9 - coord.x : coord.x;
                    const displayY = isVerticalMirrored ? 19 - coord.y : coord.y;
                    
                    this.drawGhostBlock(ctx, displayX, displayY, COLORS[this.currentPiece.type], cellWidth, cellHeight, useCircle);
                }
            });
        }
        
        // Draw current piece
        if (this.currentPiece) {
            const coordinates = this.currentPiece.getAbsoluteCoordinates();
            
            coordinates.forEach(coord => {
                if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                    // Apply mirroring to coordinates
                    const displayX = isHorizontalMirrored ? 9 - coord.x : coord.x;
                    const displayY = isVerticalMirrored ? 19 - coord.y : coord.y;
                    
                    this.drawBlock(
                        ctx, 
                        displayX, 
                        displayY, 
                        COLORS[this.currentPiece.type], 
                        cellWidth, 
                        cellHeight,
                        useCircle
                    );
                }
            });
        }
    }
    
    // Draw a block at a specific grid position
    drawBlock(ctx, x, y, color, cellWidth, cellHeight, useCircle) {
        const xPos = x * cellWidth;
        const yPos = y * cellHeight;
        
        if (useCircle) {
            // Calculate circle parameters
            const radius = Math.min(cellWidth, cellHeight) / 2;
            const centerX = xPos + cellWidth / 2;
            const centerY = yPos + cellHeight / 2;
            
            // Draw main circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Create radial gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                centerX - radius * 0.2, centerY - radius * 0.2, 0,
                centerX, centerY, radius
            );
            
            gradient.addColorStop(0, this.shadeColor(color, 20));  // Lighter center
            gradient.addColorStop(0.7, color);                     // Original color
            gradient.addColorStop(1, this.shadeColor(color, -20)); // Darker edge
            
            // Draw 3D circle with gradient
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add top-left highlight (similar to squares)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.9, Math.PI * 0.9, Math.PI * 1.8, false);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();
            
            // Add bottom-right shadow (similar to squares)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.9, Math.PI * 0, Math.PI * 0.8, false);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();
            
            // Add a subtle border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            return; // Exit early
        }
        
        // Draw square block (standard behavior for board 1)
        // Draw the main block
        ctx.fillStyle = color;
        ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
        
        // Calculate border and detail sizes proportionally
        const borderSize = Math.max(1, Math.ceil(cellWidth / 20));
        const highlightSize = Math.max(1, Math.ceil(cellWidth / 10));
        
        // Draw diagonal cut (divide the block diagonally)
        // First triangle - bottom-left (now darker)
        ctx.fillStyle = this.shadeColor(color, -10); // Darker color for the bottom-left triangle
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos + cellWidth, yPos + cellHeight);
        ctx.lineTo(xPos, yPos + cellHeight);
        ctx.closePath();
        ctx.fill();
        
        // Second triangle - top-right (now lighter)
        ctx.fillStyle = this.shadeColor(color, 15); // Lighter color for the top-right triangle
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos + cellWidth, yPos);
        ctx.lineTo(xPos + cellWidth, yPos + cellHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw strong highlight on top and left (3D effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(xPos, yPos, cellWidth, highlightSize);
        ctx.fillRect(xPos, yPos, highlightSize, cellHeight);
        
        // Draw strong shadow on bottom and right (3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(xPos, yPos + cellHeight - highlightSize, cellWidth, highlightSize);
        ctx.fillRect(xPos + cellWidth - highlightSize, yPos, highlightSize, cellHeight);
        
        // Add block border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
    }
    
    // Helper function to lighten or darken a color
    shadeColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (
            0x1000000 + 
            (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 + 
            (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 + 
            (B < 255 ? (B < 0 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }
    
    // Move the piece left
    movePieceLeft() {
        if (this.currentPiece && !this.isGameOver && !this.isPaused) {
            const moved = this.currentPiece.moveLeft(this.board);
            if (moved) {
                // Rotate the board orientation clockwise when moving left
                this.rotateBoardsClockwise();
            } else {
                // Even if the piece couldn't move, still render all canvases
                this.renderAllCanvases();
            }
        }
    }
    
    // Move the piece right
    movePieceRight() {
        if (this.currentPiece && !this.isGameOver && !this.isPaused) {
            const moved = this.currentPiece.moveRight(this.board);
            if (moved) {
                // Rotate the board orientation counter-clockwise when moving right
                this.rotateBoardsCounterClockwise();
            } else {
                // Even if the piece couldn't move, still render all canvases
                this.renderAllCanvases();
            }
        }
    }
    
    // Move the piece down
    movePieceDown() {
        if (this.currentPiece && !this.isGameOver && !this.isPaused) {
            const moved = this.currentPiece.moveDown(this.board);
            if (moved) {
                // Award 1 point for manually moving down
                this.score += 1;
                this.updateStats();
                this.renderAllCanvases();
            } else {
                this.settlePiece();
            }
        }
    }
    
    // Rotate the piece
    rotatePiece() {
        if (this.currentPiece && !this.isGameOver && !this.isPaused) {
            const rotated = this.currentPiece.rotate(this.board);
            if (rotated) {
                this.renderAllCanvases();
            }
        }
    }
    
    // Hard drop the piece
    hardDrop() {
        if (this.currentPiece && !this.isGameOver && !this.isPaused) {
            let cellsMoved = 0;
            
            // Count how many cells the piece drops
            while (this.currentPiece.moveDown(this.board)) {
                cellsMoved++;
            }
            
            // Award 3 points per cell dropped
            this.score += cellsMoved * 3;
            this.updateStats();
            
            this.settlePiece();
        }
    }
    
    // Settle the current piece and create a new one
    settlePiece() {
        // Add the piece to the board
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        
        coordinates.forEach(coord => {
            if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                // Store the piece type in the grid
                this.board.grid[coord.y][coord.x] = this.currentPiece.type;
            }
        });
        
        // Check for completed lines
        const linesCleared = this.clearLines();
        
        // Update score
        this.updateScore(linesCleared);
        
        // Create a new piece
        this.createNewPiece();
        
        // Check if the game is over
        this.checkGameOver();
        
        // Render the board
        this.renderAllCanvases();
    }
    
    // Clear completed lines and return the number of lines cleared
    clearLines() {
        let linesCleared = 0;
        
        // Check each row from bottom to top
        for (let y = 19; y >= 0; y--) {
            // Check if the row is complete (all cells are filled)
            if (this.board.grid[y].every(cell => cell !== null)) {
                // Remove this row and add a new empty row at the top
                this.board.grid.splice(y, 1);
                this.board.grid.unshift(Array(10).fill(null));
                
                linesCleared++;
                
                // Since we removed a row, we need to check the same y index again
                y++;
            }
        }
        
        return linesCleared;
    }
    
    // Create a new piece
    createNewPiece() {
        // Move the next piece to current
        this.currentPiece = this.nextPiece;
        
        // Create a new next piece
        this.nextPiece = new Tetromino();
        
        // Render the next piece preview
        this.renderNextPiece();
    }
    
    // Render the next piece previews
    renderNextPiece() {
        // For each preview canvas
        this.nextPieceCanvases.forEach((canvas, index) => {
            // Get the canvas context
            const ctx = canvas.getContext('2d');
            
            // Get the mirroring orientation based on the board orientation
            const mirrorOrientation = this.boardOrientation[index];
            
            // Determine mirroring based on the orientation value
            const isHorizontalMirrored = mirrorOrientation === 1 || mirrorOrientation === 3;
            const isVerticalMirrored = mirrorOrientation === 2 || mirrorOrientation === 3;
            
            // Use circles for mirrored boards, squares for unmirrored
            const useCircle = isHorizontalMirrored || isVerticalMirrored;
            
            // Get the exact block size from the game board
            const gameCanvas = this.canvases[index]; // Get the corresponding game canvas
            const gameBlockSize = Math.floor(gameCanvas.width / 10); // Full size game block
            
            // Ensure canvas dimensions are set properly
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw background
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Get the blocks for the next piece
            const blocks = this.nextPiece.blocks;
            
            // Calculate the bounds of the piece
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            blocks.forEach(block => {
                minX = Math.min(minX, block.x);
                maxX = Math.max(maxX, block.x);
                minY = Math.min(minY, block.y);
                maxY = Math.max(maxY, block.y);
            });
            
            // Calculate piece dimensions
            const pieceWidth = maxX - minX + 1;
            const pieceHeight = maxY - minY + 1;
            
            // Determine the preview block size to match the game board size ratio
            // Calculate a scale factor based on available space
            const maxPossibleBlockWidth = canvas.width / pieceWidth;
            const maxPossibleBlockHeight = canvas.height / pieceHeight;
            
            // Choose the smaller dimension to ensure it fits
            const blockSize = Math.min(
                maxPossibleBlockWidth * 0.7, // 70% of max width
                maxPossibleBlockHeight * 0.7, // 70% of max height
                gameBlockSize * 0.9  // 90% of game block size
            );
            
            // Calculate total piece size in pixels
            const totalWidth = pieceWidth * blockSize;
            const totalHeight = pieceHeight * blockSize;
            
            // Calculate exact center position with integer offsets
            const startX = Math.floor((canvas.width - totalWidth) / 2);
            const startY = Math.floor((canvas.height - totalHeight) / 2);
            
            // Draw each block
            blocks.forEach(block => {
                // Calculate relative position within the piece
                const relX = block.x - minX;
                const relY = block.y - minY;
                
                // Apply mirroring to coordinates if needed
                let displayX = relX;
                let displayY = relY;
                
                if (isHorizontalMirrored) {
                    displayX = (pieceWidth - 1) - relX;
                }
                
                if (isVerticalMirrored) {
                    displayY = (pieceHeight - 1) - relY;
                }
                
                // Calculate absolute position on canvas
                const x = startX + (displayX * blockSize);
                const y = startY + (displayY * blockSize);
                
                // Draw the block with the same effect as the main blocks
                const color = COLORS[this.nextPiece.type];
                
                if (useCircle) {
                    // Draw circle instead of square
                    // Calculate circle parameters
                    const radius = blockSize / 2;
                    const centerX = x + radius;
                    const centerY = y + radius;
                    
                    // Create radial gradient for 3D effect
                    const gradient = ctx.createRadialGradient(
                        centerX - radius * 0.2, centerY - radius * 0.2, 0,
                        centerX, centerY, radius
                    );
                    
                    gradient.addColorStop(0, this.shadeColor(color, 20));  // Lighter center
                    gradient.addColorStop(0.7, color);                      // Original color
                    gradient.addColorStop(1, this.shadeColor(color, -20));  // Darker edge
                    
                    // Draw circle with gradient
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add top-left highlight (similar to squares)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius * 0.9, Math.PI * 0.9, Math.PI * 1.8, false);
                    ctx.lineTo(centerX, centerY);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add bottom-right shadow (similar to squares)
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius * 0.9, Math.PI * 0, Math.PI * 0.8, false);
                    ctx.lineTo(centerX, centerY);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add a subtle border
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // Draw regular square block
                    // Draw the main block
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, blockSize, blockSize);
                    
                    // Calculate highlight size proportional to block size
                    const highlightSize = Math.max(1, Math.ceil(blockSize / 10));
                    
                    // Draw diagonal cut (divide the block diagonally)
                    // First triangle - bottom-left (darker)
                    ctx.fillStyle = this.shadeColor(color, -10);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + blockSize, y + blockSize);
                    ctx.lineTo(x, y + blockSize);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Second triangle - top-right (lighter)
                    ctx.fillStyle = this.shadeColor(color, 15);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + blockSize, y);
                    ctx.lineTo(x + blockSize, y + blockSize);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Draw strong highlight on top and left (3D effect)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fillRect(x, y, blockSize, highlightSize);
                    ctx.fillRect(x, y, highlightSize, blockSize);
                    
                    // Draw strong shadow on bottom and right (3D effect)
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(x, y + blockSize - highlightSize, blockSize, highlightSize);
                    ctx.fillRect(x + blockSize - highlightSize, y, highlightSize, blockSize);
                    
                    // Add block border
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, blockSize, blockSize);
                }
            });
        });
    }
    
    // Update score based on lines cleared
    updateScore(linesCleared) {
        if (linesCleared === 0) return;
        
        // Award points based on lines cleared and level
        // New scoring: 13, 42, 666, 1337 for 1, 2, 3, 4 lines (multiplied by level)
        let points = 0;
        switch (linesCleared) {
            case 1: points = 13 * this.level; break;
            case 2: points = 42 * this.level; break;
            case 3: points = 666 * this.level; break;
            case 4: points = 1337 * this.level; break;
        }
        
        this.score += points;
        this.lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.speed = Math.max(100, 1000 - (this.level - 1) * 100); // Speed up as level increases
            this.startGameLoop(); // Restart game loop with new speed
        }
        
        // Update display
        this.updateStats();
    }
    
    // Update game stats display
    updateStats() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.lines;
    }
    
    // Check if the game is over
    checkGameOver() {
        // Game is over if any block in the top row is filled
        // or if the new piece collides immediately
        if (this.board.grid[0].some(cell => cell !== null) || 
            this.currentPiece.hasCollision(this.board)) {
            
            // Game is over
            this.isGameOver = true;
            
            // Stop the game loop
            clearInterval(this.timer);
            this.timer = null;
            
            // Display "Game Over" message
            alert("Game Over! Your score: " + this.score);
        }
    }
    
    // Game over state
    gameOver() {
        this.isGameOver = true;
        clearInterval(this.timer);
        
        // Alert game over with final score
        setTimeout(() => {
            alert(`Game Over! Your score: ${this.score}`);
        }, 100);
    }
    
    // Pause the game
    pause() {
        if (!this.isGameOver) {
            this.isPaused = true;
            clearInterval(this.timer);
        }
    }
    
    // Resume the game
    resume() {
        if (!this.isGameOver && this.isPaused) {
            this.isPaused = false;
            this.startGameLoop();
        }
    }
    
    // Set up control buttons
    setupButtons() {
        const startButton = document.getElementById('start-button');
        const pauseButton = document.getElementById('pause-button');
        const stopButton = document.getElementById('stop-button');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                if (this.isGameOver) {
                    this.start();
                } else if (this.isPaused) {
                    this.resume();
                } else {
                    this.start();
                }
            });
        }
        
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                if (!this.isGameOver) {
                    if (this.isPaused) {
                        this.resume();
                        pauseButton.textContent = 'Pause';
                    } else {
                        this.pause();
                        pauseButton.textContent = 'Resume';
                    }
                }
            });
        }
        
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                this.stopGame();
            });
        }
    }
    
    // Stop the game completely
    stopGame() {
        // Clear game timer
        clearInterval(this.timer);
        this.timer = null;
        
        // Reset game state
        this.isGameOver = true;
        this.isPaused = false;
        
        // Clear the board
        this.board.grid = Array(20).fill().map(() => Array(10).fill(null));
        
        // Clear current piece
        this.currentPiece = null;
        this.nextPiece = null;
        
        // Reset score display
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.updateStats();
        
        // Redraw the grid on all game canvases
        this.canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw the grid
            drawGrid(ctx, canvas.width, canvas.height);
        });
        
        // Clear next piece previews
        this.nextPieceCanvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        
        // Reset button state
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.textContent = 'Pause';
        }
        
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.textContent = 'Start Game';
        }
    }
    
    // Set up keyboard controls
    setupControls() {
        document.addEventListener('keydown', (event) => {
            if (this.isGameOver) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    this.movePieceLeft();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.movePieceRight();
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    this.movePieceDown();
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    event.preventDefault();
                    break;
                case ' ': // Space
                    this.hardDrop();
                    event.preventDefault();
                    break;
                case 'p': // p key
                    if (this.isPaused) {
                        this.resume();
                    } else {
                        this.pause();
                    }
                    break;
            }
        });
    }
    
    // Calculate the ghost piece position (where the piece would land)
    getGhostPiece() {
        // Create a copy of the current piece
        const ghost = new Tetromino();
        ghost.type = this.currentPiece.type;
        ghost.blocks = JSON.parse(JSON.stringify(this.currentPiece.blocks));
        ghost.center = JSON.parse(JSON.stringify(this.currentPiece.center));
        ghost.x = this.currentPiece.x;
        ghost.y = this.currentPiece.y;
        
        // Move the ghost down until it collides
        while (!ghost.hasCollision(this.board)) {
            ghost.y += 1;
        }
        
        // Move it back up one step (to the last valid position)
        ghost.y -= 1;
        
        return ghost;
    }
    
    // Draw a ghost block (transparent version of regular block)
    drawGhostBlock(ctx, x, y, color, cellWidth, cellHeight, useCircle) {
        const xPos = x * cellWidth;
        const yPos = y * cellHeight;
        
        // Set transparency to 25%
        ctx.globalAlpha = 0.25;
        
        if (useCircle) {
            // Calculate circle parameters
            const radius = Math.min(cellWidth, cellHeight) / 2;
            const centerX = xPos + cellWidth / 2;
            const centerY = yPos + cellHeight / 2;
            
            // Create radial gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                centerX - radius * 0.2, centerY - radius * 0.2, 0,
                centerX, centerY, radius
            );
            
            gradient.addColorStop(0, this.shadeColor(color, 20));  // Lighter center
            gradient.addColorStop(0.7, color);                     // Original color
            gradient.addColorStop(1, this.shadeColor(color, -20)); // Darker edge
            
            // Draw 3D circle with gradient
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add top-left highlight (similar to squares)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.9, Math.PI * 0.9, Math.PI * 1.8, false);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();
            
            // Add bottom-right shadow (similar to squares)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.9, Math.PI * 0, Math.PI * 0.8, false);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();
            
            // Add a subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Reset transparency
            ctx.globalAlpha = 1.0;
            return; // Exit early
        }
        
        // Draw the main block (for board 1)
        ctx.fillStyle = color;
        ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
        
        // Calculate border and detail sizes proportionally
        const highlightSize = Math.max(1, Math.ceil(cellWidth / 10));
        
        // Draw diagonal cut (divide the block diagonally)
        // First triangle - bottom-left (darker)
        ctx.fillStyle = this.shadeColor(color, -10);
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos + cellWidth, yPos + cellHeight);
        ctx.lineTo(xPos, yPos + cellHeight);
        ctx.closePath();
        ctx.fill();
        
        // Second triangle - top-right (lighter)
        ctx.fillStyle = this.shadeColor(color, 15);
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos + cellWidth, yPos);
        ctx.lineTo(xPos + cellWidth, yPos + cellHeight);
        ctx.closePath();
        ctx.fill();
        
        // Add block border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        
        // Reset transparency
        ctx.globalAlpha = 1.0;
    }
    
    // Rotate board orientation counter-clockwise
    rotateBoardsCounterClockwise() {
        // For counter-clockwise rotation in a 2x2 grid:
        // [0, 1,    [1, 3,
        //  2, 3] →   0, 2]
        const newOrientation = [
            this.boardOrientation[2],  // Bottom-left → Top-left
            this.boardOrientation[0],  // Top-left → Top-right
            this.boardOrientation[3],  // Bottom-right → Bottom-left
            this.boardOrientation[1]   // Top-right → Bottom-right
        ];
        this.boardOrientation = newOrientation;
        this.renderAllCanvases();
        this.renderNextPiece(); // Update next piece previews with new orientation
    }
    
    // Rotate board orientation clockwise
    rotateBoardsClockwise() {
        // For clockwise rotation in a 2x2 grid:
        // [0, 1,    [2, 0,
        //  2, 3] →   3, 1]
        const newOrientation = [
            this.boardOrientation[1],  // Top-right → Top-left
            this.boardOrientation[3],  // Bottom-right → Top-right
            this.boardOrientation[0],  // Top-left → Bottom-left
            this.boardOrientation[2]   // Bottom-left → Bottom-right
        ];
        this.boardOrientation = newOrientation;
        this.renderAllCanvases();
        this.renderNextPiece(); // Update next piece previews with new orientation
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    // Don't auto-start, let the user click start
    
    // Add reload functionality to game title
    const gameTitle = document.getElementById('game-title');
    if (gameTitle) {
        gameTitle.addEventListener('click', () => {
            window.location.reload();
        });
    }
}); 