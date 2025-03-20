/**
 * Tetromino definitions and logic for the Tetris game
 */

// Tetromino shapes defined as points from a center
const TETROMINOES = {
    I: {
        blocks: [
            { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }
        ],
        center: { x: 0, y: 0 },
        type: 'i'
    },
    J: {
        blocks: [
            { x: -1, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }
        ],
        center: { x: 0, y: 0 },
        type: 'j'
    },
    L: {
        blocks: [
            { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }
        ],
        center: { x: 0, y: 0 },
        type: 'l'
    },
    O: {
        blocks: [
            { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 1, y: -1 }
        ],
        center: { x: 0.5, y: -0.5 },
        type: 'o'
    },
    S: {
        blocks: [
            { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: -1 }
        ],
        center: { x: 0, y: 0 },
        type: 's'
    },
    T: {
        blocks: [
            { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }
        ],
        center: { x: 0, y: 0 },
        type: 't'
    },
    Z: {
        blocks: [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }
        ],
        center: { x: 0, y: 0 },
        type: 'z'
    }
};

// List of tetromino keys for random selection
const TETROMINO_TYPES = Object.keys(TETROMINOES);

class Tetromino {
    constructor(type = null) {
        // Select a random tetromino type if none is provided
        if (!type) {
            type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
        }
        
        const tetromino = TETROMINOES[type];
        this.blocks = JSON.parse(JSON.stringify(tetromino.blocks));
        this.center = JSON.parse(JSON.stringify(tetromino.center));
        this.type = tetromino.type;
        
        // Track rotation state 
        this.rotationState = 0;
        
        // Initial position in the center of the board, at the top
        this.x = 4; // Center position
        this.y = 0; // Top position
    }
    
    // Get absolute coordinates of the tetromino blocks
    getAbsoluteCoordinates() {
        return this.blocks.map(block => ({
            x: Math.floor(block.x + this.x),
            y: Math.floor(block.y + this.y)
        }));
    }
    
    // Rotate the tetromino
    rotate(board, clockwise = true) {
        // Create a copy of the current blocks
        const originalBlocks = JSON.parse(JSON.stringify(this.blocks));
        const originalRotationState = this.rotationState;
        
        // For 'O' tetromino, no need to rotate (symmetrical)
        if (this.type === 'o') {
            // Just increment rotation state for consistency
            this.rotationState = (this.rotationState + 1) % 4;
            return true; // Always successful for 'O' piece
        }
        
        // For other tetrominoes, rotate normally
        this.blocks = this.blocks.map(block => {
            // Translate point back to origin
            const x = block.x - this.center.x;
            const y = block.y - this.center.y;
            
            // Rotate point
            let rotatedX, rotatedY;
            if (clockwise) {
                rotatedX = -y;
                rotatedY = x;
            } else {
                rotatedX = y;
                rotatedY = -x;
            }
            
            // Translate point back
            return {
                x: rotatedX + this.center.x,
                y: rotatedY + this.center.y
            };
        });
        
        // Increment rotation state (0-3)
        this.rotationState = (this.rotationState + 1) % 4;
        
        // Check if the rotation is valid
        if (this.hasCollision(board)) {
            // If not valid, revert to the original position
            this.blocks = originalBlocks;
            this.rotationState = originalRotationState;
            return false;
        }
        
        return true;
    }
    
    // Check if the tetromino collides with the board
    hasCollision(board) {
        const coordinates = this.getAbsoluteCoordinates();
        
        return coordinates.some(coord => {
            // Check if the block is outside the board boundaries
            if (coord.x < 0 || coord.x >= board.width || coord.y >= board.height) {
                return true;
            }
            
            // Don't check collision for blocks above the board (y < 0)
            if (coord.y < 0) {
                return false;
            }
            
            // Check if the block collides with a settled block
            const blockAtPosition = board.grid[coord.y][coord.x];
            return blockAtPosition !== null;
        });
    }
    
    // Move the tetromino
    move(dx, dy, board) {
        // Store original position
        const originalX = this.x;
        const originalY = this.y;
        
        // Update position
        this.x += dx;
        this.y += dy;
        
        // Check for collisions
        if (this.hasCollision(board)) {
            // Revert to original position
            this.x = originalX;
            this.y = originalY;
            return false;
        }
        
        return true;
    }
    
    // Move the tetromino down by one cell
    moveDown(board) {
        return this.move(0, 1, board);
    }
    
    // Move the tetromino left by one cell
    moveLeft(board) {
        return this.move(-1, 0, board);
    }
    
    // Move the tetromino right by one cell
    moveRight(board) {
        return this.move(1, 0, board);
    }
    
    // Hard drop the tetromino
    hardDrop(board) {
        let dropped = false;
        
        // Move down until collision
        while (this.moveDown(board)) {
            dropped = true;
        }
        
        return dropped;
    }
    
    // Calculate the ghost position (where the piece would land)
    getGhostPosition(board) {
        // Create a clone of the current piece
        const ghost = new Tetromino(TETROMINO_TYPES.find(type => 
            TETROMINOES[type].type === this.type));
        
        // Set its position to match the current piece
        ghost.x = this.x;
        ghost.y = this.y;
        ghost.blocks = JSON.parse(JSON.stringify(this.blocks));
        
        // Move it down until collision
        while (!this.hasCollision(board)) {
            ghost.y += 1;
        }
        
        // Move back up one step (to the last valid position)
        ghost.y -= 1;
        
        return ghost;
    }
    
    // Render the ghost piece on the canvas
    renderGhost(ctx, board) {
        const ghost = this.getGhostPosition(board);
        
        // Only render if the ghost is below the current piece
        if (ghost.y > this.y) {
            // Draw each block of the ghost
            ghost.getAbsoluteCoordinates().forEach(coord => {
                // Only draw blocks that are on or below the top of the board
                if (coord.y >= 0) {
                    drawGhostBlock(ctx, coord.x, coord.y, this.type, board.blockSize);
                }
            });
        }
    }
    
    // Render the tetromino on the canvas
    render(ctx, blockSize = BLOCK_SIZE) {
        // Draw each block - only if it's within the visible area
        this.getAbsoluteCoordinates().forEach(coord => {
            // Only draw blocks that are on or below the top of the board (y >= 0)
            if (coord.y >= 0) {
                drawBlock(ctx, coord.x, coord.y, this.type, blockSize);
            }
        });
    }
    
    // Render the tetromino in the next piece preview
    renderPreview(ctx) {
        // Clear canvas
        clearCanvas(ctx, ctx.canvas.width, ctx.canvas.height);
        
        // Get canvas dimensions
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Calculate the bounds of the tetromino to center it properly
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.blocks.forEach(block => {
            minX = Math.min(minX, block.x);
            minY = Math.min(minY, block.y);
            maxX = Math.max(maxX, block.x);
            maxY = Math.max(maxY, block.y);
        });
        
        // Calculate dimensions and scale to fit in the preview
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        
        // Calculate block size to fit the preview
        const maxBlockSize = Math.min(
            canvasWidth / width, 
            canvasHeight / height
        );
        
        const blockSize = Math.min(maxBlockSize, BLOCK_SIZE);
        
        // Calculate offsets to center the tetromino in the preview
        const totalWidth = width * blockSize;
        const totalHeight = height * blockSize;
        
        const offsetX = (canvasWidth - totalWidth) / 2 - minX * blockSize;
        const offsetY = (canvasHeight - totalHeight) / 2 - minY * blockSize;
        
        // Draw each block
        this.blocks.forEach(block => {
            const x = block.x * blockSize + offsetX;
            const y = block.y * blockSize + offsetY;
            
            // Draw the block directly without grid
            ctx.fillStyle = COLORS[this.type];
            ctx.fillRect(x, y, blockSize, blockSize);
            
            // Draw lighter top and left edges for 3D effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + blockSize, y);
            ctx.lineTo(x, y + blockSize);
            ctx.fill();
            
            // Draw darker bottom and right edges for 3D effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x + blockSize, y);
            ctx.lineTo(x + blockSize, y + blockSize);
            ctx.lineTo(x, y + blockSize);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, blockSize, blockSize);
        });
    }
} 