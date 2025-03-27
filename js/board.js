/**
 * Game board logic for the Tetris game
 */

class Board {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        
        // Initialize the board grid
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
        
        // Use BLOCK_SIZE constant from utils.js
        this.blockSize = BLOCK_SIZE;
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
        
        return linesCleared;
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
    }
} 