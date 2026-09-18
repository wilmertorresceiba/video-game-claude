import { GAME_CONFIG } from './config.js';
import { GameState } from './gameState.js';
import { Snake } from './snake.js';
import { Food } from './food.js';

export class GameEngine {
  constructor({ board, scoreManager, soundManager, callbacks = {} }) {
    this.board = board;
    this.scoreManager = scoreManager;
    this.soundManager = soundManager;
    this.callbacks = callbacks;

    this.columns = GAME_CONFIG.BOARD_COLUMNS;
    this.rows = GAME_CONFIG.BOARD_ROWS;

    const startPosition = { x: Math.floor(this.columns / 2), y: Math.floor(this.rows / 2) };
    this.snake = new Snake(startPosition, GAME_CONFIG.INITIAL_SNAKE_LENGTH);
    this.food = new Food(this.columns, this.rows);

    this.state = GameState.IDLE;
    this.level = 1;
    this.foodEatenThisLevel = 0;
    this.tickIntervalMs = GAME_CONFIG.INITIAL_INTERVAL_MS;

    this.lastFrameTime = 0;
    this.accumulatedTime = 0;
    this.animationFrameId = null;
    this.foodPulse = 0;

    this.loop = this.loop.bind(this);
  }

  start() {
    this.snake.reset();
    this.scoreManager.reset();
    this.level = 1;
    this.foodEatenThisLevel = 0;
    this.tickIntervalMs = GAME_CONFIG.INITIAL_INTERVAL_MS;
    this.accumulatedTime = 0;
    this.foodPulse = 0;

    this.food.spawn(this.snake.body);

    this.state = GameState.PLAYING;
    this.lastFrameTime = performance.now();

    this.cancelLoop();
    this.animationFrameId = requestAnimationFrame(this.loop);

    this.notifyStateChange();
    this.notifyScoreChange(false);
    this.notifyLevelChange();
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.notifyStateChange();
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.lastFrameTime = performance.now();
      this.notifyStateChange();
    }
  }

  setDirection(direction) {
    if (this.state !== GameState.PLAYING) return;
    this.snake.setDirection(direction);
  }

  loop(currentTime) {
    if (this.state === GameState.PLAYING) {
      const deltaTime = Math.min(currentTime - this.lastFrameTime, GAME_CONFIG.MAX_FRAME_DELTA_MS);
      this.lastFrameTime = currentTime;
      this.accumulatedTime += deltaTime;

      while (this.accumulatedTime >= this.tickIntervalMs && this.state === GameState.PLAYING) {
        this.tick();
        this.accumulatedTime -= this.tickIntervalMs;
      }
    }

    this.render();

    if (this.state !== GameState.GAME_OVER) {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  tick() {
    const nextHead = this.snake.getNextHeadPosition();
    const hitsWall = nextHead.x < 0 || nextHead.x >= this.columns
      || nextHead.y < 0 || nextHead.y >= this.rows;

    if (hitsWall || this.snake.willCollideWithSelf(nextHead)) {
      this.endGame(false);
      return;
    }

    this.snake.move();

    const ateFood = nextHead.x === this.food.position.x && nextHead.y === this.food.position.y;
    if (ateFood) {
      this.handleFoodEaten();
    }
  }

  handleFoodEaten() {
    this.snake.grow(1);
    const isNewRecord = this.scoreManager.addPoints(GAME_CONFIG.POINTS_PER_FOOD);
    this.foodPulse = 6;
    this.soundManager.playEat();
    this.notifyScoreChange(isNewRecord);

    this.foodEatenThisLevel += 1;
    if (this.foodEatenThisLevel >= GAME_CONFIG.FOOD_PER_LEVEL) {
      this.levelUp();
    }

    const spawned = this.food.spawn(this.snake.body);
    if (!spawned) {
      this.endGame(true);
    }
  }

  levelUp() {
    this.foodEatenThisLevel = 0;
    this.level += 1;
    this.tickIntervalMs = Math.max(
      GAME_CONFIG.MIN_INTERVAL_MS,
      this.tickIntervalMs - GAME_CONFIG.INTERVAL_STEP_MS,
    );
    this.soundManager.playLevelUp();
    this.notifyLevelChange();
  }

  endGame(victory) {
    this.state = GameState.GAME_OVER;
    this.soundManager.playGameOver();
    this.cancelLoop();
    this.notifyStateChange();
    this.notifyGameOver(victory);
  }

  cancelLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render() {
    this.board.clear();
    this.board.drawGrid();
    this.board.drawFood(this.food, this.foodPulse);
    this.board.drawSnake(this.snake);
    if (this.foodPulse > 0) {
      this.foodPulse -= 1;
    }
  }

  notifyStateChange() {
    this.callbacks.onStateChange?.(this.state);
  }

  notifyScoreChange(isNewRecord) {
    this.callbacks.onScoreChange?.({
      score: this.scoreManager.score,
      highScore: this.scoreManager.highScore,
      isNewRecord,
    });
  }

  notifyLevelChange() {
    this.callbacks.onLevelChange?.(this.level);
  }

  notifyGameOver(victory) {
    this.callbacks.onGameOver?.({
      score: this.scoreManager.score,
      isNewRecord: this.scoreManager.score === this.scoreManager.highScore
        && this.scoreManager.score > 0,
      victory,
    });
  }
}
