/**
 * Game board logic for the Tetris game
 */

class Board {
    constructor(canvasId = 'board', width = 10, height = 20) {
        this.width = width;
        this.height = height;
        
        // Initialize the board grid
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
        
        // Canvas element and context
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with ID "${canvasId}" not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Use BLOCK_SIZE constant from utils.js
        this.blockSize = BLOCK_SIZE;
        
        // Initial render
        this.render();
    }
    
    // Check if coordinates are within the board boundaries
    isWithinBounds(x, y) {
        // Allow negative y values (above the board) for spawning pieces
        // but still enforce side boundaries and bottom
        return x >= 0 && x < this.width && y < this.height;
    }
    
    // Check if a tetromino collides with anything on the board
    hasCollision(tetromino) {
        const coordinates = tetromino.getAbsoluteCoordinates();
        
        return coordinates.some(coord => {
            // Check if the block is outside the board boundaries
            if (!this.isWithinBounds(coord.x, coord.y)) {
                return true;
            }
            
            // Don't check collision for blocks above the board (y < 0)
            if (coord.y < 0) {
                return false;
            }
            
            // Check if the block collides with a settled block
            return this.grid[coord.y][coord.x] !== null;
        });
    }
    
    // Add the current tetromino to the board
    settle(tetromino) {
        const coordinates = tetromino.getAbsoluteCoordinates();
        
        // Add the blocks to the grid
        coordinates.forEach(coord => {
            // Only add blocks that are within the visible board
            if (coord.y >= 0 && this.isWithinBounds(coord.x, coord.y)) {
                this.grid[coord.y][coord.x] = tetromino.type;
            }
        });
        
        // Render the updated board
        this.render();
        
        // Remove any completed lines
        return this.clearLines();
    }
    
    // Clear completed lines and return the number of lines cleared
    clearLines() {
        let linesCleared = 0;
        
        // Check each row from bottom to top
        for (let y = this.height - 1; y >= 0; y--) {
            // Check if the row is complete (all cells are filled)
            if (this.grid[y].every(cell => cell !== null)) {
                // Remove this row and add a new empty row at the top
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.width).fill(null));
                
                linesCleared++;
                
                // Since we removed a row, we need to check the same y index again
                y++;
            }
        }
        
        // Render the updated board if lines were cleared
        if (linesCleared > 0) {
            this.render();
        }
        
        return linesCleared;
    }
    
    // Render the board to the canvas
    render() {
        // Clear the canvas
        clearCanvas(this.ctx, this.canvas.width, this.canvas.height);
        
        // Draw the background grid
        drawGrid(this.ctx, this.canvas.width, this.canvas.height, this.blockSize);
        
        // Draw the settled blocks
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const blockType = this.grid[y][x];
                if (blockType) {
                    drawBlock(this.ctx, x, y, blockType, this.blockSize);
                }
            }
        }
        
        // Draw grid border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.width * this.blockSize, this.height * this.blockSize);
    }
    
    // Render the current board with the active tetromino
    renderWithTetromino(tetromino) {
        // Render the board
        this.render();
        
        // Render the ghost piece first (so it appears behind the actual piece)
        tetromino.renderGhost(this.ctx, this);
        
        // Render the tetromino
        tetromino.render(this.ctx, this.blockSize);
    }
    
    // Check if the game is over (blocks stacked to the top)
    isGameOver() {
        // Check if any block in the top row is filled
        return this.grid[0].some(cell => cell !== null);
    }
    
    // Reset the board to an empty state
    reset() {
        // Reset the grid
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        
        // Render the empty board
        this.render();
    }
} 