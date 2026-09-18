const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 20;
const CELL = canvas.width / GRID_SIZE;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const startBtn = document.getElementById("start-btn");
const touchControls = document.getElementById("touch-controls");

const STORAGE_KEY = "snake-best-score";

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake, direction, nextDirection, food, score, best, tickMs, loopId, running, paused;

function loadBest() {
  return Number(localStorage.getItem(STORAGE_KEY) || 0);
}

function saveBest(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
}

function randomCell() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

function placeFood() {
  let cell;
  do {
    cell = randomCell();
  } while (snake.some((s) => s.x === cell.x && s.y === cell.y));
  food = cell;
}

function resetState() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  tickMs = 130;
  paused = false;
  scoreEl.textContent = score;
  placeFood();
}

function draw() {
  ctx.fillStyle = "#10170f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(124, 252, 0, 0.04)";
  for (let i = 1; i < GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }

  ctx.fillStyle = "#ff5252";
  ctx.beginPath();
  ctx.arc(
    food.x * CELL + CELL / 2,
    food.y * CELL + CELL / 2,
    CELL / 2.4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#a6ff4d" : "#7CFC00";
    ctx.fillRect(
      segment.x * CELL + 1,
      segment.y * CELL + 1,
      CELL - 2,
      CELL - 2
    );
  });
}

function step() {
  if (paused) return;

  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const hitsWall =
    head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE;
  const hitsSelf = snake.some((s) => s.x === head.x && s.y === head.y);

  if (hitsWall || hitsSelf) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      saveBest(best);
    }
    placeFood();
    if (tickMs > 60) {
      tickMs -= 3;
      restartLoop();
    }
  } else {
    snake.pop();
  }

  draw();
}

function restartLoop() {
  clearInterval(loopId);
  loopId = setInterval(step, tickMs);
}

function gameOver() {
  running = false;
  clearInterval(loopId);
  overlayTitle.textContent = "Fin del juego";
  overlayMsg.textContent = `Puntaje: ${score}. Presiona jugar para intentar de nuevo.`;
  startBtn.textContent = "Jugar de nuevo";
  overlay.classList.remove("hidden");
}

function startGame() {
  resetState();
  draw();
  overlay.classList.add("hidden");
  running = true;
  restartLoop();
}

function setDirection(dir) {
  const proposed = DIRS[dir];
  if (!proposed) return;
  const isOpposite =
    proposed.x === -direction.x && proposed.y === -direction.y;
  if (!isOpposite) {
    nextDirection = proposed;
  }
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    overlayTitle.textContent = "Pausa";
    overlayMsg.textContent = "Presiona espacio o el botón para continuar.";
    startBtn.textContent = "Continuar";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (!running) {
      startGame();
    } else {
      togglePause();
    }
    return;
  }
  const dir = KEY_MAP[e.key];
  if (dir) {
    e.preventDefault();
    setDirection(dir);
  }
});

startBtn.addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});

touchControls.addEventListener("click", (e) => {
  const btn = e.target.closest(".tc-btn");
  if (btn) {
    setDirection(btn.dataset.dir);
  }
});

best = loadBest();
bestEl.textContent = best;
resetState();
draw();
