import { GAME_CONFIG } from './config.js';
import { GameState } from './gameState.js';
import { Board } from './board.js';
import { ScoreManager } from './scoreManager.js';
import { SoundManager } from './soundManager.js';
import { InputController } from './inputController.js';
import { GameEngine } from './gameEngine.js';
import { UI } from './ui.js';

function bootstrap() {
  const canvas = document.getElementById('gameCanvas');
  const touchControls = document.getElementById('touchControls');

  const ui = new UI();
  const scoreManager = new ScoreManager();
  const soundManager = new SoundManager();
  const board = new Board(canvas, GAME_CONFIG.BOARD_COLUMNS, GAME_CONFIG.BOARD_ROWS);

  const engine = new GameEngine({
    board,
    scoreManager,
    soundManager,
    callbacks: {
      onStateChange: handleStateChange,
      onScoreChange: (payload) => ui.updateScore(payload),
      onLevelChange: (level) => ui.updateLevel(level),
      onGameOver: (payload) => ui.showGameOverScreen(payload),
    },
  });

  function handleStateChange(state) {
    if (state === GameState.PLAYING) {
      ui.showPlayingScreen();
    } else if (state === GameState.PAUSED) {
      ui.showPauseScreen();
    }
  }

  const inputController = new InputController({
    onDirectionChange: (direction) => engine.setDirection(direction),
    onTogglePause: () => {
      if (engine.state === GameState.PLAYING || engine.state === GameState.PAUSED) {
        engine.togglePause();
      }
    },
    touchControlsElement: touchControls,
  });
  inputController.attachSwipeControls(canvas);

  ui.startButton.addEventListener('click', () => engine.start());
  ui.restartButton.addEventListener('click', () => engine.start());

  ui.soundToggle.addEventListener('click', () => {
    const enabled = soundManager.toggle();
    ui.updateSoundToggle(enabled);
  });
  ui.updateSoundToggle(soundManager.enabled);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && engine.state === GameState.PLAYING) {
      engine.togglePause();
    }
  });

  ui.updateScore({ score: 0, highScore: scoreManager.highScore });
  ui.updateLevel(1);
  ui.showStartScreen();
}

document.addEventListener('DOMContentLoaded', bootstrap);
