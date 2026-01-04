// Game Configuration Module
export const GameConfig = {
    // Grid Settings
    GRID_SIZE: 10,
    CELL_SIZE: 35,
    
    // Snake Settings
    INITIAL_SNAKE_SPEED: 200,
    MIN_SNAKE_SPEED: 80,
    SPEED_MULTIPLIER: 0.98,
    INITIAL_SNAKE_LENGTH: 1,
    INITIAL_SNAKE_POSITION: { x: 5, y: 5 },
    
    // Minesweeper Settings
    MINE_COUNT: 15,
    
    // Scoring
    FOOD_SCORE: 10,
    FLAG_CORRECT_SCORE: 10,
    CLEAR_BOARD_BONUS: 50,
    REVEAL_COMBO_THRESHOLD: 5,
    
    // Effects
    INVINCIBLE_DURATION: 3000, // ms
    FEEDBACK_DURATION: 2000, // ms
    
    // Reveal Area
    REVEAL_AREA_SIZE: 3, // 3x3 area
};
