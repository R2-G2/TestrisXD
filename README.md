<!-- Copyright (c) 2023 Ralf Grawunder -->

# TestrisXD

A Tetris-like browser game built with HTML, CSS, and JavaScript using Canvas for rendering.

## How to Play

1. Open `index.html` in your browser
2. Click the "Start Game" button to begin
3. Use arrow keys to control the falling pieces:
   - Left/Right: Move piece horizontally
   - Down: Move piece down
   - Up: Rotate piece
   - Space: Hard drop

## Features

- Classic Tetris gameplay
- Canvas-based rendering for smooth graphics
- Score tracking
- Level progression with increasing difficulty
- Next piece preview
- Responsive design
- Unique mirror mode display with circular blocks
- Demo mode with AI player
- Visual effects:
  - Explosion animations when clearing lines
  - Scale-aware particle effects (bigger explosions for more lines cleared)
  - Screen shake effects
  - Shape-aware particles (circles/squares based on mirror mode)
- Modern game over screen with restart option

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - CSS styling
- `js/` - JavaScript files
  - `utils.js` - Utility functions for drawing and game logic
  - `tetromino.js` - Tetromino piece logic
  - `board.js` - Game board logic
  - `controls.js` - User input handling
  - `game.js` - Main game logic
  - `theme.js` - Theme toggling logic

## Problems?

Fork! Fork it! Fork you! Fork me, right?
