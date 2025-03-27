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
- Score tracking and high score system with medal indicators
- Level progression with increasing difficulty
- Next piece preview
- Responsive design
- Unique mirror mode display with circular blocks
- Demo mode with AI player
  - Adjustable AI speed from snail (🐌) to warp speed (💫)
  - Tetromino selection: Click on any tetromino in the statistics panel to force it as the next piece
- Visual effects:
  - Explosion animations when clearing lines
  - Scale-aware particle effects (bigger explosions for more lines cleared)
  - Screen shake effects
  - Shape-aware particles (circles/squares based on mirror mode)
  - Score, level, and lines popup animations
- Modern game over screen with restart option
- Persistent settings and statistics using localStorage
- High score tracking system with medals for top performers
- Dark mode toggle
- Properly managed keyboard focus for consistent controls

## Project Structure

- `index.html` - Main HTML file
- `css/styles.css` - CSS styling
- `js/` - JavaScript files
  - `utils.js` - Utility functions, drawing helpers, and particle system
  - `tetromino.js` - Tetromino piece logic
  - `board.js` - Game board logic
  - `controls.js` - User input handling
  - `game.js` - Main game logic
  - `theme.js` - Theme settings and user preferences

## Local Storage

The game uses localStorage to persist:
- User preferences (dark mode, board rotation, demo mode, speed settings)
- Tetromino statistics across multiple game sessions
- High scores with medal indicators for top performers

## Keyboard Accessibility

The game implements proper focus management to ensure consistent keyboard controls:
- Elements that can be triggered with spacebar remove focus after interaction
- Game keys won't trigger UI elements when playing
- Interactive elements blur after being clicked or activated

## Problems?

Fork! Fork it! Fork you! Fork me, right?
