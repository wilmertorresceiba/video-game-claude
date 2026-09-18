export class UI {
  constructor() {
    this.scoreValue = document.getElementById('scoreValue');
    this.highScoreValue = document.getElementById('highScoreValue');
    this.levelValue = document.getElementById('levelValue');
    this.finalScoreValue = document.getElementById('finalScoreValue');
    this.newRecordMessage = document.getElementById('newRecordMessage');
    this.gameOverTitle = document.getElementById('gameOverTitle');

    this.startOverlay = document.getElementById('startOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');

    this.startButton = document.getElementById('startButton');
    this.restartButton = document.getElementById('restartButton');
    this.soundToggle = document.getElementById('soundToggle');
  }

  updateScore({ score, highScore }) {
    this.scoreValue.textContent = String(score);
    this.highScoreValue.textContent = String(highScore);
    this.bumpElement(this.scoreValue);
  }

  updateLevel(level) {
    this.levelValue.textContent = String(level);
    this.bumpElement(this.levelValue);
  }

  bumpElement(element) {
    element.classList.remove('bump');
    // Fuerza reflow para poder reiniciar la animación en llamadas consecutivas.
    void element.offsetWidth;
    element.classList.add('bump');
  }

  showOverlay(overlay) {
    overlay.classList.remove('overlay--hidden');
  }

  hideOverlay(overlay) {
    overlay.classList.add('overlay--hidden');
  }

  showStartScreen() {
    this.showOverlay(this.startOverlay);
    this.hideOverlay(this.pauseOverlay);
    this.hideOverlay(this.gameOverOverlay);
  }

  showPlayingScreen() {
    this.hideOverlay(this.startOverlay);
    this.hideOverlay(this.pauseOverlay);
    this.hideOverlay(this.gameOverOverlay);
  }

  showPauseScreen() {
    this.showOverlay(this.pauseOverlay);
  }

  showGameOverScreen({ score, isNewRecord, victory }) {
    this.finalScoreValue.textContent = String(score);
    this.newRecordMessage.classList.toggle('hidden', !isNewRecord);
    this.gameOverTitle.textContent = victory ? '¡Felicidades, ganaste!' : 'Game Over';
    this.showOverlay(this.gameOverOverlay);
  }

  updateSoundToggle(enabled) {
    this.soundToggle.textContent = enabled ? '🔊' : '🔇';
    this.soundToggle.setAttribute('aria-pressed', String(enabled));
  }
}
