// Main Game Controller
import { GameConfig } from './config.js';
import { EventBus } from './event-bus.js';
import { SnakeGame } from './snake.js';
import { MinesweeperGame } from './minesweeper.js';
import { UIManager } from './ui-manager.js';

class Game {
    constructor() {
        this.eventBus = new EventBus();
        this.initializeComponents();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.restart();
        this.startGameLoop();
    }

    initializeComponents() {
        this.ui = new UIManager(this.eventBus);
        
        const snakeBoard = document.getElementById('snake-board');
        const mineBoard = document.getElementById('mine-board');
        
        this.snake = new SnakeGame(snakeBoard, this.eventBus);
        this.minesweeper = new MinesweeperGame(mineBoard, this.eventBus);
        
        this.gameOver = false;
        this.lastUpdateTime = 0;
    }

    setupEventListeners() {
        // Snake events
        this.eventBus.on('snake:updated', () => {
            this.ui.renderSnake(this.snake.getState());
            this.updateScores();
        });

        this.eventBus.on('snake:ate-food', (data) => {
            this.revealRandomArea();
            this.ui.showFeedback('mine', '✨ 贪吃蛇吃到食物! 自动揭开一片区域');
        });

        this.eventBus.on('snake:died', (reason) => {
            this.endGame(reason);
        });

        this.eventBus.on('snake:invincible-activated', () => {
            this.ui.renderSnake(this.snake.getState());
        });

        this.eventBus.on('snake:invincible-ended', () => {
            this.ui.renderSnake(this.snake.getState());
        });

        // Minesweeper events
        this.eventBus.on('mine:correct-flag', (data) => {
            this.snake.grow(1);
            this.snake.activateInvincible();
            this.ui.showFeedback('snake', '🛡️ 正确标雷! 蛇身+1 + 3秒无敌');
            this.updateScores();
        });

        this.eventBus.on('mine:hit', () => {
            this.endGame('扫雷踩雷失败 💣');
        });

        this.eventBus.on('mine:cells-revealed', (data) => {
            this.ui.renderMinesweeper(this.minesweeper.getState());
            
            if (data.count >= GameConfig.REVEAL_COMBO_THRESHOLD) {
                this.snake.grow(1);
                this.ui.showFeedback('snake', '⚡ 扫雷大成功! 蛇身+1');
            }
            
            this.updateScores();
        });

        this.eventBus.on('mine:board-cleared', (data) => {
            this.ui.showFeedback('mine', '🎉 扫雷区域清空! 奖励50分');
            setTimeout(() => {
                this.minesweeper.regenerateBoard();
                this.ui.renderMinesweeper(this.minesweeper.getState());
            }, 1000);
            this.updateScores();
        });

        this.eventBus.on('mine:board-regenerated', () => {
            this.ui.showFeedback('mine', '🔄 扫雷区域已刷新!');
            this.ui.renderMinesweeper(this.minesweeper.getState());
        });

        this.eventBus.on('mine:area-revealed', () => {
            this.ui.renderMinesweeper(this.minesweeper.getState());
            this.updateScores();
        });
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            const directionMap = {
                'ArrowUp': { x: 0, y: -1 },
                'w': { x: 0, y: -1 },
                'W': { x: 0, y: -1 },
                'ArrowDown': { x: 0, y: 1 },
                's': { x: 0, y: 1 },
                'S': { x: 0, y: 1 },
                'ArrowLeft': { x: -1, y: 0 },
                'a': { x: -1, y: 0 },
                'A': { x: -1, y: 0 },
                'ArrowRight': { x: 1, y: 0 },
                'd': { x: 1, y: 0 },
                'D': { x: 1, y: 0 }
            };

            const direction = directionMap[e.key];
            if (direction) {
                this.snake.changeDirection(direction);
            }
        });
    }

    setupMinesweeperClickHandler() {
        this.ui.initializeMinesweeperCells((e, x, y) => {
            if (this.gameOver) return;

            if (e.button === 2) { // Right click
                this.minesweeper.toggleFlag(x, y);
                this.ui.renderMinesweeper(this.minesweeper.getState());
            } else if (e.button === 0) { // Left click
                this.minesweeper.revealCell(x, y);
            }
        });
    }

    startGameLoop() {
        const loop = (timestamp) => {
            if (!this.lastUpdateTime) {
                this.lastUpdateTime = timestamp;
            }

            const deltaTime = timestamp - this.lastUpdateTime;

            if (!this.gameOver && deltaTime >= this.snake.speed) {
                this.snake.update();
                this.lastUpdateTime = timestamp;
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    revealRandomArea() {
        const cx = Math.floor(Math.random() * (GameConfig.GRID_SIZE - 2)) + 1;
        const cy = Math.floor(Math.random() * (GameConfig.GRID_SIZE - 2)) + 1;
        this.minesweeper.revealArea(cx, cy, GameConfig.REVEAL_AREA_SIZE);
    }

    updateScores() {
        const snakeScore = this.snake.getState().score;
        const mineScore = this.minesweeper.getState().score;
        this.ui.updateScore(snakeScore, mineScore);
    }

    endGame(reason) {
        this.gameOver = true;
        
        const snakeScore = this.snake.getState().score;
        const mineScore = this.minesweeper.getState().score;
        
        this.ui.showGameOver(reason, snakeScore, mineScore);
        this.ui.renderMinesweeper(this.minesweeper.getState(), true);
    }

    restart() {
        this.gameOver = false;
        this.lastUpdateTime = 0;

        this.snake.reset();
        this.minesweeper.reset();

        this.ui.hideGameOver();
        this.setupMinesweeperClickHandler();
        
        this.ui.renderSnake(this.snake.getState());
        this.ui.renderMinesweeper(this.minesweeper.getState());
        this.updateScores();
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });
} else {
    window.game = new Game();
}
