/**
 * Game controls logic for the Tetris game
 */

class Controls {
    constructor(game) {
        this.game = game;
        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.paused = false;
        
        // Button elements
        this.startButton = document.getElementById('start-button');
        this.pauseButton = document.getElementById('pause-button');
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.keyDownHandler);
        
        // Button controls
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
    }
    
    handleKeyDown(event) {
        // Skip if game is over or paused
        if (this.game.isGameOver || this.paused) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                this.game.movePieceLeft();
                event.preventDefault();
                break;
            case 'ArrowRight':
                this.game.movePieceRight();
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.game.movePieceDown();
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.game.rotatePiece();
                event.preventDefault();
                break;
            case ' ': // Space
                // Remove focus from any active element to ensure space works for hard drop
                if (document.activeElement && document.activeElement !== document.body) {
                    document.activeElement.blur();
                }
                this.game.hardDrop();
                event.preventDefault();
                break;
            case 'p':
            case 'P':
                this.togglePause();
                event.preventDefault();
                break;
            case 'r':
            case 'R':
                this.startGame();
                event.preventDefault();
                break;
        }
    }
    
    startGame() {
        this.paused = false;
        this.pauseButton.textContent = 'Pause';
        this.startButton.textContent = 'Restart';
        this.game.start();
        
        // Remove focus from the start button
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            this.pauseButton.textContent = 'Resume';
            this.game.pause();
        } else {
            this.pauseButton.textContent = 'Pause';
            this.game.resume();
        }
        
        // Remove focus from the pause button
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
    
    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.keyDownHandler);
        this.startButton.removeEventListener('click', this.startGame);
        this.pauseButton.removeEventListener('click', this.togglePause);
    }
} 