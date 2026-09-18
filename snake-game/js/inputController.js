import { Direction } from './snake.js';

const KEY_DIRECTION_MAP = {
  ArrowUp: Direction.UP,
  ArrowDown: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  w: Direction.UP,
  W: Direction.UP,
  s: Direction.DOWN,
  S: Direction.DOWN,
  a: Direction.LEFT,
  A: Direction.LEFT,
  d: Direction.RIGHT,
  D: Direction.RIGHT,
};

const SWIPE_THRESHOLD_PX = 24;

export class InputController {
  constructor({ onDirectionChange, onTogglePause, touchControlsElement }) {
    this.onDirectionChange = onDirectionChange;
    this.onTogglePause = onTogglePause;
    this.touchControlsElement = touchControlsElement;
    this.touchStartPoint = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchButtonClick = this.handleTouchButtonClick.bind(this);
    this.handleSwipeStart = this.handleSwipeStart.bind(this);
    this.handleSwipeEnd = this.handleSwipeEnd.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);

    if (this.touchControlsElement) {
      this.touchControlsElement.addEventListener('click', this.handleTouchButtonClick);
    }
  }

  handleKeyDown(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      this.onTogglePause();
      return;
    }

    const direction = KEY_DIRECTION_MAP[event.key];
    if (direction) {
      event.preventDefault();
      this.onDirectionChange(direction);
    }
  }

  handleTouchButtonClick(event) {
    const button = event.target.closest('[data-direction]');
    if (!button) return;

    const direction = Direction[button.dataset.direction.toUpperCase()];
    if (direction) {
      this.onDirectionChange(direction);
    }
  }

  attachSwipeControls(element) {
    element.addEventListener('touchstart', this.handleSwipeStart, { passive: true });
    element.addEventListener('touchend', this.handleSwipeEnd, { passive: true });
  }

  handleSwipeStart(event) {
    const touch = event.changedTouches[0];
    this.touchStartPoint = { x: touch.clientX, y: touch.clientY };
  }

  handleSwipeEnd(event) {
    if (!this.touchStartPoint) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartPoint.x;
    const deltaY = touch.clientY - this.touchStartPoint.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    this.touchStartPoint = null;

    if (Math.max(absX, absY) < SWIPE_THRESHOLD_PX) {
      return;
    }

    const direction = absX > absY
      ? (deltaX > 0 ? Direction.RIGHT : Direction.LEFT)
      : (deltaY > 0 ? Direction.DOWN : Direction.UP);

    this.onDirectionChange(direction);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.touchControlsElement) {
      this.touchControlsElement.removeEventListener('click', this.handleTouchButtonClick);
    }
  }
}
