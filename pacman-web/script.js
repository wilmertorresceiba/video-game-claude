(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Maze layout: 19x19 grid. '#' wall, '.' dot, 'o' power pellet, ' ' empty.
  // Fully enclosed, symmetric, no unreachable pockets.
  // ---------------------------------------------------------------------
  const MAZE = [
    "###################",
    "#o...............o#",
    "#..###.......###..#",
    "#.................#",
    "#.#.............#.#",
    "#.#.....###.....#.#",
    "#.#.............#.#",
    "#....#.......#....#",
    "#....#.......#....#",
    "#....#.##....#....#",
    "#....#.......#....#",
    "#....#.......#....#",
    "#....#.......#....#",
    "#..###.......###..#",
    "#.#.............#.#",
    "#.#.....###.....#.#",
    "#.#.............#.#",
    "#o...............o#",
    "###################",
  ];

  const CELL = 28;
  const ROWS = MAZE.length;
  const COLS = MAZE[0].length;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");

  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  // ---------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------
  let grid = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let dotsLeft = 0;
  let frightTimer = 0;
  let running = false;
  let gameOverFlag = false;
  let graceFrames = 0; // ghosts stay put briefly after (re)spawn

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    none: { x: 0, y: 0 },
  };

  function cellAt(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return "#";
    return grid[row][col];
  }

  function isWall(col, row) {
    return cellAt(col, row) === "#";
  }

  function buildGrid() {
    grid = MAZE.map((row) => row.split(""));
    dotsLeft = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === "." || grid[r][c] === "o") dotsLeft++;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Entities
  // ---------------------------------------------------------------------
  function makeActor(col, row, speed, color) {
    return {
      col,
      row,
      startCol: col,
      startRow: row,
      x: col * CELL,
      y: row * CELL,
      dir: "none",
      nextDir: "none",
      speed,
      color,
    };
  }

  let player;
  let ghosts;

  function resetPositions() {
    player = makeActor(9, 9, 2.2, "#ffcc00");
    // clear the dot under the player's starting tile
    if (grid[9][9] === "." || grid[9][9] === "o") {
      if (grid[9][9] === "o") dotsLeft--;
      dotsLeft--;
      grid[9][9] = " ";
    }
    ghosts = [
      Object.assign(makeActor(9, 1, 1.5, "#ff0000"), { name: "blinky", frightened: 0, eaten: false }),
      Object.assign(makeActor(9, 17, 1.45, "#ffb8ff"), { name: "pinky", frightened: 0, eaten: false }),
      Object.assign(makeActor(1, 9, 1.4, "#00ffff"), { name: "inky", frightened: 0, eaten: false }),
      Object.assign(makeActor(17, 9, 1.35, "#ffb852"), { name: "clyde", frightened: 0, eaten: false }),
    ];
    graceFrames = 120; // ~2s head start before ghosts move
  }

  // Snaps the actor onto the grid once it's within one step of a cell
  // boundary, then reports whether it's now exactly aligned. Needed because
  // the movement speeds don't evenly divide CELL, so exact-equality checks
  // would never trigger again after the first move.
  function trySnap(actor, speed) {
    const gx = Math.round(actor.x / CELL) * CELL;
    const gy = Math.round(actor.y / CELL) * CELL;
    const tol = speed * 0.51 + 0.1;
    if (Math.abs(actor.x - gx) <= tol && Math.abs(actor.y - gy) <= tol) {
      actor.x = gx;
      actor.y = gy;
      return true;
    }
    return false;
  }

  function canMove(col, row, dirName) {
    const d = DIRS[dirName];
    if (!d || (d.x === 0 && d.y === 0)) return false;
    return !isWall(col + d.x, row + d.y);
  }

  function updatePlayer() {
    if (trySnap(player, player.speed)) {
      player.col = Math.round(player.x / CELL);
      player.row = Math.round(player.y / CELL);

      if (player.nextDir !== "none" && canMove(player.col, player.row, player.nextDir)) {
        player.dir = player.nextDir;
      }
      if (!canMove(player.col, player.row, player.dir)) {
        player.dir = "none";
      }

      // eat dot/pellet at current tile
      const tile = grid[player.row][player.col];
      if (tile === "." || tile === "o") {
        grid[player.row][player.col] = " ";
        dotsLeft--;
        if (tile === "o") {
          score += 50;
          frightTimer = 7 * 60; // frames
          ghosts.forEach((g) => {
            if (!g.eaten) g.frightened = frightTimer;
          });
        } else {
          score += 10;
        }
        updateHud();
        if (dotsLeft <= 0) {
          winGame();
          return;
        }
      }
    }

    const d = DIRS[player.dir];
    player.x += d.x * player.speed;
    player.y += d.y * player.speed;
  }

  function chooseGhostDirection(g) {
    const opposite = { up: "down", down: "up", left: "right", right: "left", none: "none" };
    const options = ["up", "down", "left", "right"].filter(
      (dir) => canMove(g.col, g.row, dir) && dir !== opposite[g.dir]
    );
    if (options.length === 0) {
      // dead end: allow reversing
      const all = ["up", "down", "left", "right"].filter((dir) => canMove(g.col, g.row, dir));
      return all.length ? all[Math.floor(Math.random() * all.length)] : "none";
    }

    if (g.frightened > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }

    // 40% chase player (greedy), 60% random, for variety
    if (Math.random() < 0.4) {
      let best = options[0];
      let bestDist = Infinity;
      options.forEach((dir) => {
        const d = DIRS[dir];
        const nc = g.col + d.x;
        const nr = g.row + d.y;
        const dist = Math.hypot(nc - player.col, nr - player.row);
        if (dist < bestDist) {
          bestDist = dist;
          best = dir;
        }
      });
      return best;
    }
    return options[Math.floor(Math.random() * options.length)];
  }

  function updateGhost(g) {
    if (graceFrames > 0) return; // let the player get moving first
    if (g.frightened > 0) g.frightened--;

    if (g.eaten) {
      // rush back to start tile
      const eatenSpeed = g.speed * 2.2;
      if (trySnap(g, eatenSpeed)) {
        g.col = Math.round(g.x / CELL);
        g.row = Math.round(g.y / CELL);
        if (g.col === g.startCol && g.row === g.startRow) {
          g.eaten = false;
          g.frightened = 0;
          g.dir = "none";
        } else {
          const dx = g.startCol - g.col;
          const dy = g.startRow - g.row;
          const prefs = [];
          if (Math.abs(dx) > Math.abs(dy)) {
            prefs.push(dx > 0 ? "right" : "left");
            prefs.push(dy > 0 ? "down" : "up");
          } else {
            prefs.push(dy > 0 ? "down" : "up");
            prefs.push(dx > 0 ? "right" : "left");
          }
          g.dir = prefs.find((dir) => canMove(g.col, g.row, dir)) || g.dir;
        }
      }
      const d = DIRS[g.dir];
      g.x += d.x * eatenSpeed;
      g.y += d.y * eatenSpeed;
      return;
    }

    const speed = g.frightened > 0 ? g.speed * 0.6 : g.speed;
    if (trySnap(g, speed)) {
      g.col = Math.round(g.x / CELL);
      g.row = Math.round(g.y / CELL);
      g.dir = chooseGhostDirection(g);
    }
    const d = DIRS[g.dir];
    g.x += d.x * speed;
    g.y += d.y * speed;
  }

  function checkCollisions() {
    if (graceFrames > 0) return;
    ghosts.forEach((g) => {
      if (g.eaten) return;
      const dist = Math.hypot(g.x - player.x, g.y - player.y);
      if (dist < CELL * 0.6) {
        if (g.frightened > 0) {
          g.eaten = true;
          g.frightened = 0;
          score += 200;
          updateHud();
        } else {
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    lives--;
    updateHud();
    if (lives <= 0) {
      gameOver();
    } else {
      // reset positions but keep dots/score
      const savedGrid = grid;
      const savedDots = dotsLeft;
      resetPositions();
      grid = savedGrid;
      dotsLeft = savedDots;
    }
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  let mouthPhase = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawPlayer();
    ghosts.forEach(drawGhost);
  }

  function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        const cx = c * CELL;
        const cy = r * CELL;
        if (cell === "#") {
          ctx.fillStyle = "#1414aa";
          ctx.fillRect(cx + 1, cy + 1, CELL - 2, CELL - 2);
        } else if (cell === ".") {
          ctx.fillStyle = "#ffd8a8";
          ctx.beginPath();
          ctx.arc(cx + CELL / 2, cy + CELL / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === "o") {
          const pulse = 4 + Math.sin(mouthPhase * 0.15) * 1.5;
          ctx.fillStyle = "#ffd8a8";
          ctx.beginPath();
          ctx.arc(cx + CELL / 2, cy + CELL / 2, pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawPlayer() {
    const cx = player.x + CELL / 2;
    const cy = player.y + CELL / 2;
    const radius = CELL / 2 - 2;
    const mouth = (Math.sin(mouthPhase * 0.25) + 1) * 0.15 + 0.02;

    let startAngle = mouth * Math.PI;
    let endAngle = (2 - mouth) * Math.PI;
    let rotation = 0;
    if (player.dir === "left") rotation = Math.PI;
    if (player.dir === "up") rotation = -Math.PI / 2;
    if (player.dir === "down") rotation = Math.PI / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGhost(g) {
    const cx = g.x + CELL / 2;
    const cy = g.y + CELL / 2;
    const r = CELL / 2 - 2;

    let color = g.color;
    if (g.eaten) {
      color = null; // just eyes
    } else if (g.frightened > 0) {
      color = g.frightened < 90 && Math.floor(g.frightened / 10) % 2 === 0 ? "#ffffff" : "#2222ff";
    }

    if (color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, r, Math.PI, 0, false);
      ctx.lineTo(cx + r, cy + r);
      const waves = 4;
      const step = (r * 2) / waves;
      for (let i = 0; i < waves; i++) {
        const x1 = cx + r - step * i - step / 2;
        const yWave = i % 2 === 0 ? cy + r : cy + r - 6;
        ctx.lineTo(x1, yWave);
      }
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
      ctx.fill();
    }

    // eyes
    const eyeOffsetX = 5;
    const eyeOffsetY = -4;
    const d = DIRS[g.dir] || DIRS.none;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - eyeOffsetX, cy + eyeOffsetY, 4, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffsetX, cy + eyeOffsetY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1133aa";
    ctx.beginPath();
    ctx.arc(cx - eyeOffsetX + d.x * 2, cy + eyeOffsetY + d.y * 2, 2, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffsetX + d.x * 2, cy + eyeOffsetY + d.y * 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------------------------------------------------------------------
  // HUD / overlay
  // ---------------------------------------------------------------------
  function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = "🟡".repeat(Math.max(lives, 0));
    levelEl.textContent = level;
  }

  function showOverlay(title, text, buttonLabel) {
    overlayTitle.textContent = title;
    overlayText.innerHTML = text;
    startBtn.textContent = buttonLabel;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function gameOver() {
    running = false;
    gameOverFlag = true;
    showOverlay("Game Over", `Puntuación final: <strong>${score}</strong>`, "Reintentar");
  }

  function winGame() {
    running = false;
    showOverlay("¡Ganaste!", `Nivel ${level} completado con <strong>${score}</strong> puntos.`, "Siguiente nivel");
    gameOverFlag = false;
    level++;
  }

  // ---------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------
  const keyMap = {
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

  window.addEventListener("keydown", (e) => {
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      if (player) player.nextDir = dir;
    }
  });

  document.querySelectorAll(".touch-controls button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (player) player.nextDir = btn.dataset.dir;
    });
  });

  startBtn.addEventListener("click", () => {
    hideOverlay();
    startGame();
  });

  // ---------------------------------------------------------------------
  // Game loop
  // ---------------------------------------------------------------------
  function startGame() {
    if (gameOverFlag || dotsLeft === 0 || score === 0) {
      if (gameOverFlag) {
        score = 0;
        lives = 3;
        level = 1;
      }
      buildGrid();
      resetPositions();
      updateHud();
      gameOverFlag = false;
    } else {
      resetPositions();
    }
    running = true;
    requestAnimationFrame(loop);
  }

  function loop() {
    if (!running) return;
    mouthPhase++;
    if (graceFrames > 0) graceFrames--;
    updatePlayer();
    if (!running) {
      draw();
      return;
    }
    ghosts.forEach(updateGhost);
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  // initial setup
  buildGrid();
  resetPositions();
  updateHud();
  draw();
})();
