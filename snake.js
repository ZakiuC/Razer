// Snake Game Module
import { GameConfig } from './config.js';

export class SnakeGame {
    constructor(boardElement, eventBus) {
        this.board = boardElement;
        this.eventBus = eventBus;
        this.reset();
    }

    reset() {
        this.snake = [{ ...GameConfig.INITIAL_SNAKE_POSITION }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.speed = GameConfig.INITIAL_SNAKE_SPEED;
        this.invincible = false;
        this.invincibleTimer = null;
    }

    update() {
        this.direction = { ...this.nextDirection };
        const head = this.snake[0];
        const newHead = {
            x: (head.x + this.direction.x + GameConfig.GRID_SIZE) % GameConfig.GRID_SIZE,
            y: (head.y + this.direction.y + GameConfig.GRID_SIZE) % GameConfig.GRID_SIZE
        };

        // Check self-collision
        if (!this.invincible && this.checkCollision(newHead)) {
            this.eventBus.emit('snake:died', '贪吃蛇撞到自己 🐍');
            return;
        }

        this.snake.unshift(newHead);

        // Check if food eaten
        if (this.checkFoodCollision(newHead)) {
            this.eatFood();
        } else {
            this.snake.pop();
        }

        this.eventBus.emit('snake:updated');
    }

    eatFood() {
        this.score += GameConfig.FOOD_SCORE;
        this.food = this.generateFood();
        this.speed = Math.max(
            GameConfig.MIN_SNAKE_SPEED,
            this.speed * GameConfig.SPEED_MULTIPLIER
        );

        this.eventBus.emit('snake:ate-food', {
            score: this.score,
            speed: this.speed
        });
    }

    grow(segments = 1) {
        const tail = this.snake[this.snake.length - 1];
        for (let i = 0; i < segments; i++) {
            this.snake.push({ ...tail });
        }
        this.eventBus.emit('snake:grew', segments);
    }

    activateInvincible() {
        this.invincible = true;
        if (this.invincibleTimer) clearTimeout(this.invincibleTimer);
        
        this.invincibleTimer = setTimeout(() => {
            this.invincible = false;
            this.eventBus.emit('snake:invincible-ended');
        }, GameConfig.INVINCIBLE_DURATION);

        this.eventBus.emit('snake:invincible-activated');
    }

    changeDirection(newDirection) {
        const { x, y } = newDirection;
        
        // Prevent 180-degree turns
        if (this.direction.x !== 0 && x !== 0) return;
        if (this.direction.y !== 0 && y !== 0) return;
        
        this.nextDirection = newDirection;
    }

    checkCollision(pos) {
        return this.snake.some(segment => 
            segment.x === pos.x && segment.y === pos.y
        );
    }

    checkFoodCollision(pos) {
        return pos.x === this.food.x && pos.y === this.food.y;
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * GameConfig.GRID_SIZE),
                y: Math.floor(Math.random() * GameConfig.GRID_SIZE)
            };
        } while (this.checkCollision(newFood));
        return newFood;
    }

    getState() {
        return {
            snake: this.snake,
            food: this.food,
            score: this.score,
            speed: this.speed,
            invincible: this.invincible
        };
    }
}
