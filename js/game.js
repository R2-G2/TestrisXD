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
        
        // Initialize tetromino statistics counters
        this.tetrominoStats = {
            i: 0, j: 0, l: 0, o: 0, s: 0, t: 0, z: 0
        };
        
        // Create explosion particle systems for each canvas
        this.particleSystems = this.canvases.map(() => new ParticleSystem());
        this.explosionActive = false;
        this.screenShake = { active: false, intensity: 0, duration: 0, startTime: 0 };
        
        // Track forced tetromino type for demo mode
        this.forcedTetrominoType = null;
        
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
        
        // Initialize demo mode toggle
        const demoToggle = document.getElementById('demo-toggle');
        if (demoToggle) {
            demoToggle.addEventListener('change', () => {
                this.toggleDemoMode(demoToggle.checked);
            });
        }
        
        // Initialize board rotation toggle
        const rotateToggle = document.getElementById('rotate-toggle');
        if (rotateToggle) {
            // Check stored preference if available
            const boardRotationStored = localStorage.getItem('boardRotation');
            if (boardRotationStored !== null) {
                this.allowBoardRotation = boardRotationStored === 'true';
                rotateToggle.checked = this.allowBoardRotation;
            } else {
                this.allowBoardRotation = rotateToggle.checked; // Default to checked (enabled)
            }
            
            // Add event listener for changes
            rotateToggle.addEventListener('change', () => {
                this.allowBoardRotation = rotateToggle.checked;
                localStorage.setItem('boardRotation', this.allowBoardRotation);
            });
        } else {
            this.allowBoardRotation = true; // Default to true if toggle not found
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
        
        // Update statistics for the initial piece
        this.updateTetrominoStats(this.nextPiece.type);
        
        // Game state
        this.isGameOver = false;
        this.isPaused = false;
        this.isDemoMode = false;
        this.demoTimer = null;
        this.demoTargetMove = null; // Store the target move for AI
        this.demoAllowNaturalFall = true; // Allow blocks to fall naturally for a while
        this.demoMinimumFallDistance = 6; // Reduced from 8 to make the AI drop earlier
        this.demoSpeed = 500; // Default AI move speed in ms
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
        if (this.isGameOver || this.isPaused) return;
        
        // If explosions are active, update them and skip other updates
        if (this.explosionActive) {
            // Update explosion animations
            let anyActive = false;
            this.contexts.forEach((ctx, index) => {
                const isActive = this.particleSystems[index].update(
                    ctx, 
                    this.canvases[index].width, 
                    this.canvases[index].height
                );
                if (isActive) anyActive = true;
            });
            
            // If all explosion animations are done, we can continue
            this.explosionActive = anyActive;
            
            // Don't update game state while explosions are active
            return;
        }
        
        // Move the current piece down
        if (this.currentPiece) {
            const moved = this.currentPiece.moveDown(this.board);
            
            if (!moved) {
                this.settlePiece();
            }
            
            this.renderAllCanvases();
        }
    }
    
    // Render the game state to all canvases
    renderAllCanvases() {
        // Only render if not in the middle of explosion animation
        if (this.explosionActive) return;
        
        this.canvases.forEach((canvas, index) => {
            const ctx = canvas.getContext('2d');
            
            // Apply screen shake if active
            ctx.save();
            
            if (this.screenShake.active) {
                const elapsed = Date.now() - this.screenShake.startTime;
                
                if (elapsed < this.screenShake.duration) {
                    // Calculate shake intensity based on remaining duration
                    const remainingFactor = 1 - (elapsed / this.screenShake.duration);
                    const shakeX = (Math.random() * 2 - 1) * this.screenShake.intensity * remainingFactor;
                    const shakeY = (Math.random() * 2 - 1) * this.screenShake.intensity * remainingFactor;
                    
                    // Apply translation for shake effect
                    ctx.translate(shakeX, shakeY);
                } else {
                    // End shake effect
                    this.screenShake.active = false;
                }
            }
            
            // Pass the canvas index to determine if mirroring is needed
            this.renderCanvas(ctx, canvas.width, canvas.height, index);
            
            ctx.restore();
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
                // Create score popup for soft drop
                this.createScorePopup(1, 'soft-drop');
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
            const points = cellsMoved * 3;
            this.score += points;
            // Create score popup for hard drop
            this.createScorePopup(points, 'hard-drop');
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
        
        // If no lines were cleared, continue immediately
        if (linesCleared === 0) {
            // Update score
            this.updateScore(linesCleared);
            
            // Create a new piece
            this.createNewPiece();
            
            // Check if the game is over
            this.checkGameOver();
            
            // Render the board
            this.renderAllCanvases();
        }
        // Otherwise, the clearing animation will handle the continuation
    }
    
    // Clear completed lines and return the number of lines cleared
    clearLines() {
        let linesCleared = 0;
        let completedRows = [];
        
        // First, identify completed rows
        for (let y = 19; y >= 0; y--) {
            // Check if the row is complete (all cells are filled)
            if (this.board.grid[y].every(cell => cell !== null)) {
                completedRows.push(y);
            }
        }
        
        // If there are completed rows, trigger explosion effect
        if (completedRows.length > 0) {
            // Set explosion state to active
            this.explosionActive = true;
            
            // Calculate explosion scale based on number of rows cleared
            // Base scale of 1.0 for a single row, up to 2.5 for 4 rows (Tetris)
            const explosionScale = 1.0 + (completedRows.length - 1) * 0.5;
            
            // Trigger screen shake with intensity based on number of rows cleared
            this.startScreenShake(6 + completedRows.length * 3, 800 + completedRows.length * 200); // Increased duration for more lines
            
            // Create explosion for each completed row
            completedRows.forEach((rowY, index) => {
                // Create explosion with slight delay between rows
                setTimeout(() => {
                    // Trigger explosions in all board views
                    this.contexts.forEach((ctx, ctxIndex) => {
                        // Get the mirroring orientation based on the board orientation
                        const mirrorOrientation = this.boardOrientation[ctxIndex];
                        
                        // Determine mirroring based on the orientation value
                        const isHorizontalMirrored = mirrorOrientation === 1 || mirrorOrientation === 3;
                        const isVerticalMirrored = mirrorOrientation === 2 || mirrorOrientation === 3;
                        
                        // Calculate explosion position based on mirroring
                        let explosionY = rowY;
                        
                        // If vertical mirroring is active, flip the Y position
                        if (isVerticalMirrored) {
                            explosionY = 19 - rowY; // Flip Y position (board height is 20 cells)
                        }
                        
                        // Pass mirroring info for particle effects
                        const mirrorInfo = [];
                        if (isHorizontalMirrored) mirrorInfo.push('horizontal');
                        if (isVerticalMirrored) mirrorInfo.push('vertical');
                        
                        // Create the explosion with mirroring-adjusted position
                        this.particleSystems[ctxIndex].createExplosion(
                            ctx, 
                            explosionY, // Use the mirrored Y position if needed
                            this.canvases[ctxIndex].width, 
                            this.canvases[ctxIndex].height,
                            explosionScale, // Pass the explosion scale
                            mirrorInfo.length > 0 ? mirrorInfo : false // Pass detailed mirroring info
                        );
                        
                        // Add another small shake for each row explosion
                        if (index > 0) {
                            this.startScreenShake(3 * explosionScale, 300 * explosionScale); // Scale shake with explosion size
                        }
                    });
                }, index * 250); // Increased from 150ms for more spacing between explosions
            });
            
            // Wait for explosion animation before clearing lines - longer wait for bigger explosions
            setTimeout(() => {
                // Now actually clear the rows from bottom to top
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
                
                // Update the game state after explosion
                this.explosionActive = false;
                this.updateScore(linesCleared);
                
                // Create new piece after explosion
                this.createNewPiece();
                
                // Check if the game is over
                this.checkGameOver();
                
                // Render the board
                this.renderAllCanvases();
                
            }, 1500 + completedRows.length * 300); // Increase animation duration for more lines
            
            return completedRows.length; // Return number of lines cleared
        }
        
        return 0; // No lines cleared
    }
    
    // Create a new piece
    createNewPiece() {
        // Don't create a new piece if explosion is in progress
        if (this.explosionActive) return;
        
        // If this is the first piece, create it
        if (!this.currentPiece) {
            this.currentPiece = new Tetromino();
        } else {
            // Move the next piece to current
            this.currentPiece = this.nextPiece;
        }
        
        // Create a new next piece - use forced type if set in demo mode
        if (this.isDemoMode && this.forcedTetrominoType) {
            this.nextPiece = new Tetromino(this.forcedTetrominoType.toUpperCase());
        } else {
            this.nextPiece = new Tetromino();
        }
        
        // Update statistics for the new piece
        this.updateTetrominoStats(this.nextPiece.type);
        
        // Reset the demo target move for the AI if in demo mode
        if (this.isDemoMode) {
            this.demoTargetMove = null;
        }
        
        // Render the next piece preview
        this.renderNextPiece();
    }
    
    // Update tetromino statistics
    updateTetrominoStats(type) {
        // Increment the counter for this type
        if (this.tetrominoStats.hasOwnProperty(type)) {
            this.tetrominoStats[type]++;
            
            // Update the display
            const countElement = document.getElementById(`${type}-count`);
            if (countElement) {
                countElement.textContent = this.tetrominoStats[type];
            }
        }
    }
    
    // Reset tetromino statistics
    resetTetrominoStats() {
        // Reset all counters to zero
        Object.keys(this.tetrominoStats).forEach(type => {
            this.tetrominoStats[type] = 0;
            
            // Update the display
            const countElement = document.getElementById(`${type}-count`);
            if (countElement) {
                countElement.textContent = '0';
            }
        });
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
        
        // Track old lines count and create line popup
        const oldLines = this.lines;
        this.lines += linesCleared;
        
        // Create the score popup animation
        this.createScorePopup(points, 'line-clear');
        // Create lines popup animation
        this.createLinesPopup(linesCleared);
        
        // Track old level and check for level up
        const oldLevel = this.level;
        const newLevel = Math.floor(this.lines / 10) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.speed = Math.max(100, 1000 - (this.level - 1) * 100); // Speed up as level increases
            this.startGameLoop(); // Restart game loop with new speed
            
            // Create level popup animation
            this.createLevelPopup(this.level - oldLevel);
        }
        
        // Update display
        this.updateStats();
    }
    
    // Create a score popup animation
    createScorePopup(points, type = '') {
        // Create the score popup element
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        
        // Add specific class based on the score type
        if (type) {
            popup.classList.add(type);
        }
        
        popup.textContent = `+${points}`;
        
        // Position the popup near the score display
        const scoreElement = this.scoreElement;
        const scoreRect = scoreElement.getBoundingClientRect();
        
        // Set the initial position to be near the score display
        popup.style.left = `${scoreRect.left + scoreRect.width / 2}px`;
        popup.style.top = `${scoreRect.top + scoreRect.height / 2}px`;
        
        // Add the popup to the document
        document.body.appendChild(popup);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 1500); // Match the animation duration
    }
    
    // Create a level popup animation
    createLevelPopup(levelIncrease) {
        // Create the level popup element
        const popup = document.createElement('div');
        popup.className = 'score-popup level-up';
        popup.textContent = `+${levelIncrease}`;
        
        // Position the popup near the level display
        const levelElement = this.levelElement;
        const levelRect = levelElement.getBoundingClientRect();
        
        // Set the initial position
        popup.style.left = `${levelRect.left + levelRect.width / 2}px`;
        popup.style.top = `${levelRect.top + levelRect.height / 2}px`;
        
        // Add the popup to the document
        document.body.appendChild(popup);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 1500); // Match the animation duration
    }
    
    // Create a lines popup animation
    createLinesPopup(lineCount) {
        // Create the lines popup element
        const popup = document.createElement('div');
        popup.className = 'score-popup lines-cleared';
        popup.textContent = `+${lineCount}`;
        
        // Position the popup near the lines display
        const linesElement = this.linesElement;
        const linesRect = linesElement.getBoundingClientRect();
        
        // Set the initial position
        popup.style.left = `${linesRect.left + linesRect.width / 2}px`;
        popup.style.top = `${linesRect.top + linesRect.height / 2}px`;
        
        // Add the popup to the document
        document.body.appendChild(popup);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 1500); // Match the animation duration
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
            
            // Update final score display
            document.getElementById('final-score').textContent = this.score;
            document.getElementById('final-level').textContent = this.level;
            document.getElementById('final-lines').textContent = this.lines;
            
            // Show game over overlay with animation
            const overlay = document.getElementById('game-over-overlay');
            
            // First make sure the overlay is in the DOM
            if (overlay) {
                // Add the active class to trigger the CSS animations
                setTimeout(() => {
                    overlay.classList.add('active');
                    
                    // Add event listener to restart button
                    const restartButton = document.getElementById('restart-button');
                    if (restartButton) {
                        restartButton.addEventListener('click', () => {
                            // Hide the overlay
                            overlay.classList.remove('active');
                            
                            // Wait for the animation to complete
                            setTimeout(() => {
                                // Start a new game
                                this.startGame();
                            }, 400);
                        });
                    }
                }, 500); // Slight delay for dramatic effect
            } else {
                // Fallback to alert if overlay isn't found
                alert("Game Over! Your score: " + this.score);
            }
        }
    }
    
    // Set up control buttons
    setupButtons() {
        const startButton = document.getElementById('start-button');
        const pauseButton = document.getElementById('pause-button');
        const stopButton = document.getElementById('stop-button');
        const rotateToggle = document.getElementById('rotate-toggle');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                if (this.isGameOver || !this.isRunning) {
                    this.startGame();
                }
            });
        }
        
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                this.resetGame();
                this.renderAllCanvases();
            });
        }
        
        if (rotateToggle) {
            // Enable/disable board rotation
            this.allowBoardRotation = rotateToggle.checked;
            
            rotateToggle.addEventListener('change', () => {
                this.allowBoardRotation = rotateToggle.checked;
            });
        }
    }
    
    // Toggle game pause state
    togglePause() {
        if (this.isGameOver) return;
        
        if (this.isPaused) {
            this.isPaused = false;
            this.startGameLoop();
            
            // Restart demo mode if active
            if (this.isDemoMode) {
                this.startDemoMode();
            }
        } else {
            this.isPaused = true;
            clearInterval(this.timer);
            this.timer = null;
            
            // Pause demo mode
            this.stopDemoMode();
        }
        
        // Update pause button text
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
    }
    
    // Reset the game
    resetGame() {
        // Clear any existing timers
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Reset demo mode
        this.stopDemoMode();
        
        // Reset game state
        this.isGameOver = true;
        this.isRunning = false;
        this.isPaused = false;
        
        // Reset forced tetromino type
        this.forcedTetrominoType = null;
        
        // Reset tetromino statistics
        this.resetTetrominoStats();
        
        // Update pause button text
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.textContent = 'Pause';
        }
        
        // Clear the board
        this.board.grid = Array(20).fill().map(() => Array(10).fill(null));
        
        // Render empty board
        this.renderAllCanvases();
    }
    
    // Set up keyboard controls
    setupControls() {
        document.addEventListener('keydown', (event) => {
            // Ignore controls in demo mode except for pause, restart, etc.
            if (this.isDemoMode && !['p', 'r', 'escape'].includes(event.key.toLowerCase())) {
                return;
            }
            
            if (!this.isGameOver && this.isRunning) {
                switch (event.key.toLowerCase()) {
                    case 'arrowup':
                    case 'w':
                        this.rotatePiece();
                        break;
                    case 'arrowleft':
                    case 'a':
                        this.movePieceLeft();
                        break;
                    case 'arrowright':
                    case 'd':
                        this.movePieceRight();
                        break;
                    case 'arrowdown':
                    case 's':
                        this.movePieceDown();
                        break;
                    case ' ':
                        this.hardDrop();
                        break;
                    case 'p':
                        this.togglePause();
                        break;
                    case 'escape':
                        this.togglePause();
                        break;
                    case 'r':
                        this.resetGame();
                        break;
                }
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
        // Skip if board rotation is disabled
        if (!this.allowBoardRotation) return;
        
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
        // Skip if board rotation is disabled
        if (!this.allowBoardRotation) return;
        
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
    
    // Toggle demo mode
    toggleDemoMode(isActive) {
        this.isDemoMode = isActive;
        
        // Update body class for styling
        document.body.classList.toggle('demo-mode-active', isActive);
        
        // Make sure speed slider container is visible when demo mode is active
        const speedSliderContainer = document.querySelector('.slider-container');
        if (speedSliderContainer) {
            speedSliderContainer.classList.toggle('visible', isActive);
        }
        
        if (isActive) {
            // If turning on, start demo mode
            this.startDemoMode();
            
            // Add tooltip to statistics when in demo mode
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                statsSection.classList.add('with-tooltip');
                statsSection.setAttribute('title', 'Click on a block type to force it as the next piece (click again to disable)');
            }
        } else {
            // If turning off, stop demo mode
            this.stopDemoMode();
            
            // Remove tooltip when demo mode is off
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                statsSection.classList.remove('with-tooltip');
                statsSection.removeAttribute('title');
            }
        }
    }
    
    // Set the forced tetromino type for the next piece (demo mode)
    setForcedTetrominoType(type) {
        // If null or undefined, clear the forced type
        if (!type) {
            this.forcedTetrominoType = null;
            
            // Update UI to show no forced type
            const statItems = document.querySelectorAll('.stat-item');
            statItems.forEach(item => {
                item.classList.remove('forced');
            });
        } else {
            // Set the forced type
            this.forcedTetrominoType = type;
            
            // Update UI to show the forced type
            const statItems = document.querySelectorAll('.stat-item');
            statItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                if (itemType === type) {
                    item.classList.add('forced');
                } else {
                    item.classList.remove('forced');
                }
            });
        }
    }
    
    // Set the speed of the AI in demo mode
    setDemoSpeed(speed) {
        // Speed from 1-10, where 1 is super slow, 10 is max speed
        // Convert to milliseconds delay, with 1 being 2000ms, 10 being 100ms
        const maxDelay = 2000;
        
        if (speed >= 1 && speed <= 10) {
            // Normalize speed to 0-1 range
            const normalizedSpeed = (8 - speed) / 7;
            
            // Apply exponential curve to make differences more noticeable
            const exponentialFactor = 5; // Steeper curve for more dramatic slowness
            const curvedSpeed = Math.pow(normalizedSpeed, exponentialFactor);
            
            // Calculate delay between 100ms and maxDelay
            this.demoSpeed = Math.round(100 + (curvedSpeed * (maxDelay - 100)));
        }
        
        // If demo mode is active, adjust the timer
        if (this.isDemoMode && this.demoTimer) {
            clearTimeout(this.demoTimer);
            this.makeDemoMove();
        }
    }
    
    // Start demo mode auto-play
    startDemoMode() {
        if (this.demoTimer) {
            clearTimeout(this.demoTimer);
        }
        
        // Make a demo move on a timer
        this.makeDemoMove();
    }
    
    // Stop demo mode auto-play
    stopDemoMode() {
        if (this.demoTimer) {
            clearTimeout(this.demoTimer);
            this.demoTimer = null;
        }
        this.demoTargetMove = null;
    }
    
    // Make an intelligent move in demo mode
    makeDemoMove() {
        if (!this.currentPiece || !this.isDemoMode || this.isGameOver || this.isPaused) return;
        
        // Clear any existing timer
        if (this.demoTimer) {
            clearTimeout(this.demoTimer);
            this.demoTimer = null;
        }
        
        // If we don't have a target move yet, calculate one and remember initial Y position
        if (!this.demoTargetMove) {
            this.demoTargetMove = this.findBestMove();
            this.demoTargetMove.initialY = this.currentPiece.y; // Remember starting position
            this.demoTargetMove.lastAdjustmentTime = Date.now(); // Track adjustment timing
            this.demoTargetMove.softDropCount = 0; // Track number of soft drops performed
            this.demoTargetMove.softDropsNeeded = Math.floor(Math.random() * 5) + 3; // Random 3-7 soft drops
        } else {
            // Check if we need to wait before next adjustment (forces pausing between adjustments)
            if (this.demoTargetMove.lastAdjustmentTime && 
                Date.now() - this.demoTargetMove.lastAdjustmentTime < 700) {
                // Not enough time has passed since last adjustment (increased from 500ms)
            } else {
                // If we have a target move, make one adjustment at a time
                // First prioritize rotation
                if (this.currentPiece.rotationState !== this.demoTargetMove.rotation) {
                    // Rotate once
                    this.rotatePiece();
                    this.demoTargetMove.lastAdjustmentTime = Date.now();
                } else if (this.currentPiece.x < this.demoTargetMove.x) {
                    // Move right once
                    this.movePieceRight();
                    this.demoTargetMove.lastAdjustmentTime = Date.now();
                } else if (this.currentPiece.x > this.demoTargetMove.x) {
                    // Move left once
                    this.movePieceLeft();
                    this.demoTargetMove.lastAdjustmentTime = Date.now();
                } else if (this.currentPiece.rotationState === this.demoTargetMove.rotation && 
                    this.currentPiece.x === this.demoTargetMove.x) {
                    
                    // Check if the piece has fallen enough, comparing to initial Y
                    const fallDistance = this.currentPiece.y - this.demoTargetMove.initialY;
                    
                    if (fallDistance >= this.demoMinimumFallDistance) {
                        // Calculate the remaining distance to the landing position
                        const currentY = this.currentPiece.y;
                        
                        // Get the ghost piece to determine landing position
                        const ghostPiece = this.getGhostPiece();
                        if (!ghostPiece) {
                            // If we can't get a valid ghost piece, just hard drop
                            this.hardDrop();
                            this.demoTargetMove = null;
                            return;
                        }
                        
                        // Calculate remaining distance to landing
                        const distanceToLanding = ghostPiece.y - currentY;
                        
                        // Only perform soft drops if there's enough space remaining
                        // Need at least 3 spaces for it to make sense to do soft drops
                        if (distanceToLanding >= 3 && 
                            this.demoTargetMove.softDropCount < this.demoTargetMove.softDropsNeeded) {
                            // Perform a soft drop (manual down movement)
                            this.movePieceDown();
                            this.demoTargetMove.softDropCount++;
                            this.demoTargetMove.lastAdjustmentTime = Date.now();
                            
                            // Add some randomness to the timing between soft drops
                            const randomDelay = Math.floor(Math.random() * 50) + 50; // 50-100ms extra delay
                            this.demoTimer = setTimeout(() => {
                                if (this.isDemoMode && !this.isGameOver && !this.isPaused) {
                                    this.makeDemoMove();
                                }
                            }, randomDelay); 
                            return; // Exit early with the custom timer
                        } else {
                            // Not enough space for soft drops or already did enough, hard drop now
                            this.hardDrop();
                            // Reset the target move for the next piece
                            this.demoTargetMove = null;
                        }
                    }
                }
            }
        }
        
        // Set up the next move with dynamic speed
        this.demoTimer = setTimeout(() => {
            if (this.isDemoMode && !this.isGameOver && !this.isPaused) {
                this.makeDemoMove();
            }
        }, this.demoSpeed || 500); // Use the demoSpeed property if available, default to 500ms
    }
    
    // Find the best move for the current piece
    findBestMove() {
        if (!this.currentPiece) return null;
        
        // Store the initial state
        const originalX = this.currentPiece.x;
        const originalY = this.currentPiece.y;
        const originalRotation = this.currentPiece.rotationState;
        const originalBlocks = JSON.parse(JSON.stringify(this.currentPiece.blocks));
        
        let bestScore = -Infinity;
        let bestMove = {
            rotation: 0,
            x: 0,
            initialY: originalY // Include initial Y position
        };
        
        // Try each rotation (0-3)
        for (let rotation = 0; rotation < 4; rotation++) {
            // Reset the piece to its original position
            this.currentPiece.x = originalX;
            this.currentPiece.y = originalY;
            this.currentPiece.blocks = JSON.parse(JSON.stringify(originalBlocks));
            this.currentPiece.rotationState = originalRotation;
            
            // Apply the rotation
            for (let r = 0; r < rotation; r++) {
                if (!this.currentPiece.rotate(this.board)) {
                    // Skip if this rotation is invalid
                    break;
                }
            }
            
            // Try each x position
            for (let x = 0; x < this.board.width; x++) {
                // Reset y position for each x
                this.currentPiece.y = originalY;
                
                // Move to the target x
                this.currentPiece.x = x;
                
                // Check if this position is valid
                if (this.currentPiece.hasCollision(this.board)) {
                    continue;
                }
                
                // Simulate dropping the piece
                let dropY = this.currentPiece.y;
                while (!this.currentPiece.hasCollision(this.board)) {
                    this.currentPiece.y++;
                }
                this.currentPiece.y--; // Move back up to the last valid position
                
                // Score this move
                const score = this.evaluatePosition();
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        rotation: this.currentPiece.rotationState,
                        x: this.currentPiece.x,
                        initialY: originalY // Include initial Y position
                    };
                }
            }
        }
        
        // Restore the piece to its original state
        this.currentPiece.x = originalX;
        this.currentPiece.y = originalY;
        this.currentPiece.blocks = JSON.parse(JSON.stringify(originalBlocks));
        this.currentPiece.rotationState = originalRotation;
        
        return bestMove;
    }
    
    // Evaluate a potential position for the current piece
    evaluatePosition() {
        // Improved evaluation based on:
        // 1. Height of the resulting stack (lower is better)
        // 2. Number of holes created (fewer is better)
        // 3. Number of lines that would be cleared (more is better)
        // 4. Smoothness of the resulting surface (smoother is better)
        // 5. Maximum height of any column (lower is better)
        // 6. Accessibility of empty spaces (more accessible is better)
        
        // Calculate the max column height after placement
        const maxHeight = this.calculateMaxHeight();
        // Heavily penalize high stacks to prevent early game over
        const maxHeightScore = -Math.pow(maxHeight, 2) * 0.8;
        
        // Prefer pieces that land lower (fill the board from bottom up)
        const landingHeight = this.currentPiece.y;
        const pieceHeight = this.getPieceHeight();
        const heightScore = (this.board.height - (landingHeight + pieceHeight)) * 1.5;
        
        // Prefer moves that create a smoother surface - increased weight
        const smoothnessScore = this.calculateSmoothnessScore() * 2.5;
        
        // Heavily penalize moves that create holes - increased penalty
        const holesScore = -this.countHolesCreated() * 7.5;
        
        // Strongly prefer moves that clear lines - increased reward
        const linesCleared = this.countLinesCleared();
        const linesScore = linesCleared * 20;
        
        // Bonus for keeping the center columns lower (for better I-piece placement)
        const centerColumnsScore = this.evaluateCenterColumns() * 2;
        
        // Return the total score - now with more strategic weights
        return heightScore + smoothnessScore + holesScore + linesScore + maxHeightScore + centerColumnsScore;
    }
    
    // New method to calculate the maximum height of any column
    calculateMaxHeight() {
        // Create a copy of the board
        const tempBoard = Array(20).fill().map((_, y) => 
            Array(10).fill().map((_, x) => this.board.grid[y][x])
        );
        
        // Place the current piece on the board
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        coordinates.forEach(coord => {
            if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                tempBoard[coord.y][coord.x] = this.currentPiece.type;
            }
        });
        
        // Calculate column heights
        const heights = Array(10).fill(0);
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                if (tempBoard[y][x]) {
                    heights[x] = 20 - y;
                    break;
                }
            }
        }
        
        // Return the maximum height
        return Math.max(...heights);
    }
    
    // New method to evaluate if the center columns are kept lower
    // This is a good strategy for accommodating I pieces
    evaluateCenterColumns() {
        // Create a copy of the board
        const tempBoard = Array(20).fill().map((_, y) => 
            Array(10).fill().map((_, x) => this.board.grid[y][x])
        );
        
        // Place the current piece on the board
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        coordinates.forEach(coord => {
            if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                tempBoard[coord.y][coord.x] = this.currentPiece.type;
            }
        });
        
        // Calculate column heights
        const heights = Array(10).fill(0);
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                if (tempBoard[y][x]) {
                    heights[x] = 20 - y;
                    break;
                }
            }
        }
        
        // Calculate the average height of edge columns (0,1,8,9)
        const edgeSum = heights[0] + heights[1] + heights[8] + heights[9];
        const edgeAvg = edgeSum / 4;
        
        // Calculate the average height of center columns (3,4,5,6)
        const centerSum = heights[3] + heights[4] + heights[5] + heights[6];
        const centerAvg = centerSum / 4;
        
        // Return positive score if center is lower than edges, otherwise negative
        return edgeAvg - centerAvg;
    }
    
    // Helper methods for position evaluation
    getPieceHeight() {
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        let minY = Infinity;
        let maxY = -Infinity;
        
        coordinates.forEach(coord => {
            minY = Math.min(minY, coord.y);
            maxY = Math.max(maxY, coord.y);
        });
        
        return maxY - minY + 1;
    }
    
    calculateSmoothnessScore() {
        // Create a copy of the board
        const tempBoard = Array(20).fill().map((_, y) => 
            Array(10).fill().map((_, x) => this.board.grid[y][x])
        );
        
        // Place the current piece on the board
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        coordinates.forEach(coord => {
            if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                tempBoard[coord.y][coord.x] = this.currentPiece.type;
            }
        });
        
        // Calculate column heights
        const heights = Array(10).fill(0);
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                if (tempBoard[y][x]) {
                    heights[x] = 20 - y;
                    break;
                }
            }
        }
        
        // Calculate smoothness (sum of height differences between adjacent columns)
        let smoothness = 0;
        for (let x = 0; x < 9; x++) {
            smoothness -= Math.abs(heights[x] - heights[x + 1]);
        }
        
        return smoothness;
    }
    
    countHolesCreated() {
        // Create a copy of the board
        const tempBoard = Array(20).fill().map((_, y) => 
            Array(10).fill().map((_, x) => this.board.grid[y][x])
        );
        
        // Place the current piece on the board
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        coordinates.forEach(coord => {
            if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                tempBoard[coord.y][coord.x] = this.currentPiece.type;
            }
        });
        
        // Count holes (empty cells with non-empty cells above them)
        let holes = 0;
        for (let x = 0; x < 10; x++) {
            let blockFound = false;
            for (let y = 0; y < 20; y++) {
                if (tempBoard[y][x]) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        
        return holes;
    }
    
    countLinesCleared() {
        // Create a copy of the board
        const tempBoard = Array(20).fill().map((_, y) => 
            Array(10).fill().map((_, x) => this.board.grid[y][x])
        );
        
        // Place the current piece on the board
        const coordinates = this.currentPiece.getAbsoluteCoordinates();
        coordinates.forEach(coord => {
            if (coord.y >= 0 && coord.y < 20 && coord.x >= 0 && coord.x < 10) {
                tempBoard[coord.y][coord.x] = this.currentPiece.type;
            }
        });
        
        // Count complete lines
        let linesCleared = 0;
        for (let y = 0; y < 20; y++) {
            if (tempBoard[y].every(cell => cell !== null)) {
                linesCleared++;
            }
        }
        
        return linesCleared;
    }
    
    // Override the start game method to enable demo mode if active
    startGame() {
        // Hide any game over overlay if visible
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Reset the game state
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.speed = 1000;
        this.demoTargetMove = null; // Reset the demo target move
        
        // Reset tetromino statistics
        this.resetTetrominoStats();
        
        // Update the UI
        this.updateStats();
        
        // Clear the board
        this.board.grid = Array(20).fill().map(() => Array(10).fill(null));
        
        // Create the first piece
        this.createNewPiece();
        
        // Start the game loop
        this.startGameLoop();
        
        // Mark the game as running
        this.isRunning = true;
        
        // Start demo mode if enabled
        if (this.isDemoMode) {
            this.startDemoMode();
        }
    }
    
    // Start a screen shake effect
    startScreenShake(intensity, duration) {
        this.screenShake = {
            active: true,
            intensity: intensity,
            duration: duration,
            startTime: Date.now()
        };
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