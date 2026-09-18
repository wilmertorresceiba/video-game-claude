export class Board {
  constructor(canvas, columns, rows) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.columns = columns;
    this.rows = rows;
    this.cellSize = 0;

    this.resize = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  resize() {
    const wrapper = this.canvas.parentElement;
    const availableWidth = wrapper ? wrapper.clientWidth : 480;
    const size = Math.max(Math.min(availableWidth, 560), 240);
    const devicePixelRatio = window.devicePixelRatio || 1;

    this.cellSize = Math.floor(size / this.columns);
    const pixelSize = this.cellSize * this.columns;

    this.canvas.style.width = `${pixelSize}px`;
    this.canvas.style.height = `${pixelSize}px`;
    this.canvas.width = pixelSize * devicePixelRatio;
    this.canvas.height = pixelSize * devicePixelRatio;

    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  clear() {
    const size = this.cellSize * this.columns;
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, size, size);
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    this.ctx.lineWidth = 1;

    const width = this.cellSize * this.columns;
    const height = this.cellSize * this.rows;

    for (let i = 1; i < this.columns; i += 1) {
      const x = i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let j = 1; j < this.rows; j += 1) {
      const y = j * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    if (typeof this.ctx.roundRect === 'function') {
      this.ctx.roundRect(x, y, width, height, radius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
  }

  drawSnake(snake) {
    snake.body.forEach((segment, index) => {
      const isHead = index === 0;
      this.ctx.fillStyle = isHead ? '#4ade80' : '#22c55e';
      const padding = isHead ? 1 : 2;

      this.drawRoundedRect(
        segment.x * this.cellSize + padding,
        segment.y * this.cellSize + padding,
        this.cellSize - padding * 2,
        this.cellSize - padding * 2,
        4,
      );
      this.ctx.fill();
    });
  }

  drawFood(food, pulse = 0) {
    const { x, y } = food.position;
    const center = this.cellSize / 2;
    const radius = Math.max(center - 2 + pulse, 2);

    this.ctx.fillStyle = '#f87171';
    this.ctx.beginPath();
    this.ctx.arc(
      x * this.cellSize + center,
      y * this.cellSize + center,
      radius,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
  }
}
