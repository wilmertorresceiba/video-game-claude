export const Direction = Object.freeze({
  UP: Object.freeze({ x: 0, y: -1 }),
  DOWN: Object.freeze({ x: 0, y: 1 }),
  LEFT: Object.freeze({ x: -1, y: 0 }),
  RIGHT: Object.freeze({ x: 1, y: 0 }),
});

function isOppositeDirection(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

export class Snake {
  constructor(startPosition, initialLength) {
    this.startPosition = startPosition;
    this.initialLength = initialLength;
    this.reset();
  }

  reset() {
    const { x, y } = this.startPosition;
    this.body = [];
    for (let i = 0; i < this.initialLength; i += 1) {
      this.body.push({ x: x - i, y });
    }
    this.direction = Direction.RIGHT;
    this.pendingDirection = Direction.RIGHT;
    this.growthPending = 0;
  }

  get head() {
    return this.body[0];
  }

  setDirection(direction) {
    if (!direction || isOppositeDirection(direction, this.direction)) {
      return;
    }
    this.pendingDirection = direction;
  }

  grow(segments = 1) {
    this.growthPending += segments;
  }

  getNextHeadPosition() {
    return {
      x: this.head.x + this.pendingDirection.x,
      y: this.head.y + this.pendingDirection.y,
    };
  }

  willCollideWithSelf(nextHead) {
    const isGrowing = this.growthPending > 0;
    const bodyToCheck = isGrowing ? this.body : this.body.slice(0, -1);
    return bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
  }

  move() {
    this.direction = this.pendingDirection;
    const nextHead = this.getNextHeadPosition();
    this.body.unshift(nextHead);

    if (this.growthPending > 0) {
      this.growthPending -= 1;
    } else {
      this.body.pop();
    }

    return nextHead;
  }
}
