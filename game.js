// Game Constants
const GRID_SIZE = 10;
const CELL_SIZE = 35;
const MINE_COUNT = 15;
const INITIAL_SNAKE_SPEED = 200;
const MIN_SNAKE_SPEED = 80;

class Game {
    constructor() {
        this.snakeBoard = document.getElementById('snake-board');
        this.mineBoard = document.getElementById('mine-board');
        
        // State
        this.snake = [];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.food = {x: 2, y: 2};
        this.snakeScore = 0;
        this.currentSnakeSpeed = INITIAL_SNAKE_SPEED;
        this.invincible = false;
        this.invincibleTimer = null;

        this.mines = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.mineScore = 0;
        this.firstClick = true;

        this.gameOver = false;
        this.lastTime = 0;
        
        this.initMinesweeperGrid();
        this.bindEvents();
        this.restart();
        
        requestAnimationFrame(this.loop.bind(this));
    }

    initMinesweeperGrid() {
        this.mineBoard.innerHTML = '';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell hidden';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('mousedown', (e) => this.handleMineClick(e, x, y));
                cell.addEventListener('contextmenu', (e) => e.preventDefault());
                this.mineBoard.appendChild(cell);
            }
        }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y !== 1) this.nextDirection = {x: 0, y: -1};
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y !== -1) this.nextDirection = {x: 0, y: 1};
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x !== 1) this.nextDirection = {x: -1, y: 0};
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x !== -1) this.nextDirection = {x: 1, y: 0};
                    break;
            }
        });
    }

    restart() {
        // Reset Snake
        this.snake = [{x: 5, y: 5}];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.food = this.generateFood();
        this.snakeScore = 0;
        this.currentSnakeSpeed = INITIAL_SNAKE_SPEED;
        this.invincible = false;
        if (this.invincibleTimer) clearTimeout(this.invincibleTimer);

        // Reset Mines
        this.resetMinesweeper();

        // Reset Game State
        this.gameOver = false;
        document.getElementById('game-over-modal').classList.remove('active');
        document.getElementById('snake-overlay').classList.remove('active');
        document.getElementById('mine-overlay').classList.remove('active');
        
        this.updateUI();
        this.renderSnake();
        this.renderMines();
    }

    resetMinesweeper() {
        this.mines = [];
        const newMines = new Set();
        while (newMines.size < MINE_COUNT) {
            newMines.add(Math.floor(Math.random() * GRID_SIZE * GRID_SIZE));
        }
        this.mines = Array.from(newMines);
        this.revealed = new Set();
        this.flagged = new Set();
        this.mineScore = 0; 
        this.firstClick = true;
        // But if we call this from checkWin, we might want to keep score.
        // Let's make a separate method for board regen that keeps score.
    }

    regenerateMinesweeperBoard() {
        this.mines = [];
        const newMines = new Set();
        while (newMines.size < MINE_COUNT) {
            newMines.add(Math.floor(Math.random() * GRID_SIZE * GRID_SIZE));
        }
        this.mines = Array.from(newMines);
        this.revealed = new Set();
        this.flagged = new Set();
        this.firstClick = true;
        this.showFeedback('mine', '🔄 扫雷区域已刷新!');
        this.renderMines();
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;

        if (!this.gameOver && deltaTime >= this.currentSnakeSpeed) {
            this.updateSnake();
            this.lastTime = timestamp;
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    updateSnake() {
        this.direction = this.nextDirection;
        const head = this.snake[0];
        const newHead = {
            x: (head.x + this.direction.x + GRID_SIZE) % GRID_SIZE,
            y: (head.y + this.direction.y + GRID_SIZE) % GRID_SIZE
        };

        // Check collision
        if (!this.invincible && this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
            this.endGame('贪吃蛇撞到自己 🐍');
            return;
        }

        const newSnake = [newHead, ...this.snake];
        
        // Check food
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.snakeScore += 10;
            this.food = this.generateFood();
            
            // Increase speed slightly
            this.currentSnakeSpeed = Math.max(MIN_SNAKE_SPEED, this.currentSnakeSpeed * 0.98);

            // Reward: Reveal 3x3
            this.revealAreaAroundRandom();
            this.showFeedback('mine', '✨ 贪吃蛇吃到食物! 自动揭开一片区域');
            
            // Keep tail (grow)
        } else {
            newSnake.pop(); // Remove tail
        }

        this.snake = newSnake;
        this.renderSnake();
        this.updateUI();
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (this.snake.some(s => s.x === newFood.x && s.y === newFood.y));
        return newFood;
    }

    renderSnake() {
        this.snakeBoard.innerHTML = '';
        
        // Render Food
        const foodEl = document.createElement('div');
        foodEl.className = 'food';
        foodEl.style.left = (this.food.x * CELL_SIZE) + 'px';
        foodEl.style.top = (this.food.y * CELL_SIZE) + 'px';
        this.snakeBoard.appendChild(foodEl);

        // Render Snake
        this.snake.forEach((segment, i) => {
            const el = document.createElement('div');
            el.className = `snake-segment ${i === 0 ? 'snake-head' : 'snake-body'} ${this.invincible ? 'snake-invincible' : 'snake-normal'}`;
            el.style.left = (segment.x * CELL_SIZE) + 'px';
            el.style.top = (segment.y * CELL_SIZE) + 'px';
            el.style.opacity = i === 0 ? 1 : 0.8;
            this.snakeBoard.appendChild(el);
        });
    }

    // Minesweeper Logic
    handleMineClick(e, x, y) {
        if (this.gameOver) return;
        
        if (e.button === 2) { // Right click
            this.toggleFlag(x, y);
        } else if (e.button === 0) { // Left click
            this.revealCell(x, y);
        }
    }

    toggleFlag(x, y) {
        const key = `${x},${y}`;
        if (this.revealed.has(key)) return;

        if (this.flagged.has(key)) {
            this.flagged.delete(key);
        } else {
            this.flagged.add(key);
            // Check if correct
            if (this.mines.includes(y * GRID_SIZE + x)) {
                this.mineScore += 10;
                // Reward: Grow snake + Invincible
                this.snake.push({...this.snake[this.snake.length-1]});
                // Removed double growth to balance difficulty
                // this.snake.push({...this.snake[this.snake.length-1]}); 
                this.activateInvincible();
                this.showFeedback('snake', '🛡️ 正确标雷! 蛇身+1 + 3秒无敌');
            }
        }
        this.renderMines();
        this.updateUI();
        this.checkMinesweeperWin();
    }

    ensureSafeStart(x, y) {
        const clickedIndex = y * GRID_SIZE + x;
        if (this.mines.includes(clickedIndex)) {
            // Remove mine
            const index = this.mines.indexOf(clickedIndex);
            if (index > -1) {
                this.mines.splice(index, 1);
                // Add new mine
                let newPos;
                do {
                    newPos = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
                } while (newPos === clickedIndex || this.mines.includes(newPos));
                this.mines.push(newPos);
            }
        }
    }

    revealCell(x, y) {
        const key = `${x},${y}`;
        if (this.revealed.has(key) || this.flagged.has(key)) return;

        if (this.firstClick) {
            this.ensureSafeStart(x, y);
            this.firstClick = false;
        }

        if (this.mines.includes(y * GRID_SIZE + x)) {
            this.endGame('扫雷踩雷失败 💣');
            return;
        }

        const initialRevealedSize = this.revealed.size;
        this.floodFill(x, y);
        const revealedCount = this.revealed.size - initialRevealedSize;

        if (revealedCount >= 5) {
            this.snake.push({...this.snake[this.snake.length-1]});
            this.showFeedback('snake', '⚡ 扫雷大成功! 蛇身+1');
        }

        this.renderMines();
        this.checkMinesweeperWin();
    }

    checkMinesweeperWin() {
        // Win condition: All non-mine cells are revealed
        const totalCells = GRID_SIZE * GRID_SIZE;
        const safeCells = totalCells - MINE_COUNT;
        
        if (this.revealed.size >= safeCells) {
            this.mineScore += 50; // Bonus for clearing board
            this.showFeedback('mine', '🎉 扫雷区域清空! 奖励50分');
            setTimeout(() => {
                this.regenerateMinesweeperBoard();
            }, 1000);
        }
    }

    floodFill(x, y) {
        const key = `${x},${y}`;
        if (this.revealed.has(key)) return;
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
        if (this.mines.includes(y * GRID_SIZE + x)) return;

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

    getMineCount(x, y) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    if (this.mines.includes(ny * GRID_SIZE + nx)) count++;
                }
            }
        }
        return count;
    }

    revealAreaAroundRandom() {
        const cx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        const cy = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (!this.mines.includes(ny * GRID_SIZE + nx)) {
                    this.revealed.add(`${nx},${ny}`);
                }
            }
        }
        this.renderMines();
    }

    activateInvincible() {
        this.invincible = true;
        if (this.invincibleTimer) clearTimeout(this.invincibleTimer);
        this.invincibleTimer = setTimeout(() => {
            this.invincible = false;
            this.renderSnake(); // Update visual
        }, 3000);
    }

    renderMines() {
        const cells = this.mineBoard.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const key = `${x},${y}`;
            const isMine = this.mines.includes(y * GRID_SIZE + x);

            cell.className = 'cell';
            cell.innerHTML = '';

            if (this.revealed.has(key)) {
                cell.classList.add('revealed');
                if (isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else {
                    const count = this.getMineCount(x, y);
                    if (count > 0) {
                        cell.textContent = count;
                        cell.classList.add(`num-${count}`);
                    }
                }
            } else if (this.flagged.has(key)) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            } else {
                cell.classList.add('hidden');
            }
            
            if (this.gameOver && isMine) {
                cell.classList.add('revealed', 'mine');
                cell.textContent = '💣';
            }
        }
    }

    showFeedback(type, msg) {
        const el = document.getElementById(`${type}-feedback`);
        el.textContent = msg;
        setTimeout(() => {
            if (el.textContent === msg) el.textContent = '';
        }, 2000);
    }

    updateUI() {
        // document.getElementById('snake-score').textContent = this.snakeScore;
        // document.getElementById('mine-score').textContent = this.mineScore;
        document.getElementById('total-score').textContent = this.snakeScore + this.mineScore;
    }

    endGame(reason) {
        this.gameOver = true;
        document.getElementById('death-reason').textContent = reason;
        document.getElementById('final-snake-score').textContent = this.snakeScore;
        document.getElementById('final-mine-score').textContent = this.mineScore;
        document.getElementById('final-total-score').textContent = this.snakeScore + this.mineScore;
        document.getElementById('game-over-modal').classList.add('active');
        document.getElementById('snake-overlay').classList.add('active');
        document.getElementById('mine-overlay').classList.add('active');
        this.renderMines(); // Reveal all mines
    }
}

const game = new Game();