// UI Manager Module
import { GameConfig } from './config.js';

export class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.initializeElements();
    }

    initializeElements() {
        this.snakeBoard = document.getElementById('snake-board');
        this.mineBoard = document.getElementById('mine-board');
        this.totalScoreEl = document.getElementById('total-score');
        this.snakeFeedbackEl = document.getElementById('snake-feedback');
        this.mineFeedbackEl = document.getElementById('mine-feedback');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.deathReasonEl = document.getElementById('death-reason');
        this.finalSnakeScoreEl = document.getElementById('final-snake-score');
        this.finalMineScoreEl = document.getElementById('final-mine-score');
        this.finalTotalScoreEl = document.getElementById('final-total-score');
        this.snakeOverlay = document.getElementById('snake-overlay');
        this.mineOverlay = document.getElementById('mine-overlay');
    }

    renderSnake(snakeState) {
        this.snakeBoard.innerHTML = '';

        // Render food
        const foodEl = this.createFoodElement(snakeState.food);
        this.snakeBoard.appendChild(foodEl);

        // Render snake segments
        snakeState.snake.forEach((segment, i) => {
            const segmentEl = this.createSnakeSegment(segment, i, snakeState.invincible);
            this.snakeBoard.appendChild(segmentEl);
        });
    }

    createFoodElement(food) {
        const el = document.createElement('div');
        el.className = 'food';
        el.style.left = (food.x * GameConfig.CELL_SIZE) + 'px';
        el.style.top = (food.y * GameConfig.CELL_SIZE) + 'px';
        return el;
    }

    createSnakeSegment(segment, index, invincible) {
        const el = document.createElement('div');
        const isHead = index === 0;
        const className = `snake-segment ${isHead ? 'snake-head' : 'snake-body'} ${invincible ? 'snake-invincible' : 'snake-normal'}`;
        
        el.className = className;
        el.style.left = (segment.x * GameConfig.CELL_SIZE) + 'px';
        el.style.top = (segment.y * GameConfig.CELL_SIZE) + 'px';
        el.style.opacity = isHead ? 1 : 0.8;
        
        return el;
    }

    renderMinesweeper(mineState, gameOver = false) {
        const cells = this.mineBoard.children;
        
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const key = `${x},${y}`;
            const isMine = mineState.mines.includes(y * GameConfig.GRID_SIZE + x);

            cell.className = 'cell';
            cell.innerHTML = '';

            if (mineState.revealed.includes(key)) {
                cell.classList.add('revealed');
                if (isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else {
                    const count = this.getMineCount(x, y, mineState.mines);
                    if (count > 0) {
                        cell.textContent = count;
                        cell.classList.add(`num-${count}`);
                    }
                }
            } else if (mineState.flagged.includes(key)) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            } else {
                cell.classList.add('hidden');
            }

            // Reveal all mines on game over
            if (gameOver && isMine) {
                cell.classList.add('revealed', 'mine');
                cell.textContent = '💣';
            }
        }
    }

    getMineCount(x, y, mines) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < GameConfig.GRID_SIZE && 
                    ny >= 0 && ny < GameConfig.GRID_SIZE) {
                    if (mines.includes(ny * GameConfig.GRID_SIZE + nx)) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    updateScore(snakeScore, mineScore) {
        this.totalScoreEl.textContent = snakeScore + mineScore;
    }

    showFeedback(type, message) {
        const el = type === 'snake' ? this.snakeFeedbackEl : this.mineFeedbackEl;
        el.textContent = message;
        
        setTimeout(() => {
            if (el.textContent === message) {
                el.textContent = '';
            }
        }, GameConfig.FEEDBACK_DURATION);
    }

    showGameOver(reason, snakeScore, mineScore) {
        this.deathReasonEl.textContent = reason;
        this.finalSnakeScoreEl.textContent = snakeScore;
        this.finalMineScoreEl.textContent = mineScore;
        this.finalTotalScoreEl.textContent = snakeScore + mineScore;
        
        this.gameOverModal.classList.add('active');
        this.snakeOverlay.classList.add('active');
        this.mineOverlay.classList.add('active');
    }

    hideGameOver() {
        this.gameOverModal.classList.remove('active');
        this.snakeOverlay.classList.remove('active');
        this.mineOverlay.classList.remove('active');
    }

    initializeMinesweeperCells(clickHandler) {
        this.mineBoard.innerHTML = '';
        
        for (let y = 0; y < GameConfig.GRID_SIZE; y++) {
            for (let x = 0; x < GameConfig.GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell hidden';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('mousedown', (e) => clickHandler(e, x, y));
                cell.addEventListener('contextmenu', (e) => e.preventDefault());
                
                this.mineBoard.appendChild(cell);
            }
        }
    }
}
