// Minesweeper Game Module
import { GameConfig } from './config.js';

export class MinesweeperGame {
    constructor(boardElement, eventBus) {
        this.board = boardElement;
        this.eventBus = eventBus;
        this.reset();
    }

    reset() {
        this.mines = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.score = 0;
        this.firstClick = true;
        this.generateMines();
    }

    generateMines() {
        this.mines = [];
        const mineSet = new Set();
        while (mineSet.size < GameConfig.MINE_COUNT) {
            mineSet.add(Math.floor(Math.random() * GameConfig.GRID_SIZE * GameConfig.GRID_SIZE));
        }
        this.mines = Array.from(mineSet);
    }

    regenerateBoard() {
        this.generateMines();
        this.revealed = new Set();
        this.flagged = new Set();
        this.firstClick = true;
        this.eventBus.emit('mine:board-regenerated');
    }

    toggleFlag(x, y) {
        const key = this.getKey(x, y);
        if (this.revealed.has(key)) return false;

        if (this.flagged.has(key)) {
            this.flagged.delete(key);
            return true;
        } else {
            this.flagged.add(key);
            
            // Check if flag is correct
            if (this.isMine(x, y)) {
                this.score += GameConfig.FLAG_CORRECT_SCORE;
                this.eventBus.emit('mine:correct-flag', {
                    x, y,
                    score: this.score
                });
            }
            return true;
        }
    }

    revealCell(x, y) {
        const key = this.getKey(x, y);
        if (this.revealed.has(key) || this.flagged.has(key)) {
            return { success: false, revealed: 0 };
        }

        // First click safety
        if (this.firstClick) {
            this.ensureSafeStart(x, y);
            this.firstClick = false;
        }

        // Check if mine
        if (this.isMine(x, y)) {
            this.eventBus.emit('mine:hit', { x, y });
            return { success: false, revealed: 0, hitMine: true };
        }

        // Flood fill reveal
        const initialSize = this.revealed.size;
        this.floodFill(x, y);
        const revealedCount = this.revealed.size - initialSize;

        this.eventBus.emit('mine:cells-revealed', {
            count: revealedCount,
            total: this.revealed.size
        });

        // Check win condition
        if (this.checkWinCondition()) {
            this.score += GameConfig.CLEAR_BOARD_BONUS;
            this.eventBus.emit('mine:board-cleared', {
                score: this.score
            });
        }

        return { success: true, revealed: revealedCount };
    }

    revealArea(cx, cy, size = 3) {
        const halfSize = Math.floor(size / 2);
        let revealedCount = 0;

        for (let dx = -halfSize; dx <= halfSize; dx++) {
            for (let dy = -halfSize; dy <= halfSize; dy++) {
                const nx = cx + dx;
                const ny = cy + dy;
                
                if (this.isValidPosition(nx, ny) && !this.isMine(nx, ny)) {
                    const key = this.getKey(nx, ny);
                    if (!this.revealed.has(key)) {
                        this.revealed.add(key);
                        revealedCount++;
                    }
                }
            }
        }

        this.eventBus.emit('mine:area-revealed', {
            cx, cy, size, count: revealedCount
        });

        // Check win condition after area reveal
        if (this.checkWinCondition()) {
            this.score += GameConfig.CLEAR_BOARD_BONUS;
            this.eventBus.emit('mine:board-cleared', {
                score: this.score
            });
        }

        return revealedCount;
    }

    floodFill(x, y) {
        const key = this.getKey(x, y);
        
        if (this.revealed.has(key)) return;
        if (!this.isValidPosition(x, y)) return;
        if (this.isMine(x, y)) return;

        this.revealed.add(key);

        if (this.getMineCount(x, y) === 0) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    this.floodFill(x + dx, y + dy);
                }
            }
        }
    }

    ensureSafeStart(x, y) {
        const clickedIndex = y * GameConfig.GRID_SIZE + x;
        const mineIndex = this.mines.indexOf(clickedIndex);
        
        if (mineIndex !== -1) {
            this.mines.splice(mineIndex, 1);
            
            // Find new position for mine
            let newPos;
            do {
                newPos = Math.floor(Math.random() * GameConfig.GRID_SIZE * GameConfig.GRID_SIZE);
            } while (newPos === clickedIndex || this.mines.includes(newPos));
            
            this.mines.push(newPos);
        }
    }

    checkWinCondition() {
        const totalCells = GameConfig.GRID_SIZE * GameConfig.GRID_SIZE;
        const safeCells = totalCells - GameConfig.MINE_COUNT;
        return this.revealed.size >= safeCells;
    }

    getMineCount(x, y) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny) && this.isMine(nx, ny)) {
                    count++;
                }
            }
        }
        return count;
    }

    isMine(x, y) {
        return this.mines.includes(y * GameConfig.GRID_SIZE + x);
    }

    isValidPosition(x, y) {
        return x >= 0 && x < GameConfig.GRID_SIZE && 
               y >= 0 && y < GameConfig.GRID_SIZE;
    }

    getKey(x, y) {
        return `${x},${y}`;
    }

    getState() {
        return {
            mines: this.mines,
            revealed: Array.from(this.revealed),
            flagged: Array.from(this.flagged),
            score: this.score
        };
    }
}
