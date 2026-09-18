import { GAME_CONFIG } from './config.js';

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = this.loadHighScore();
  }

  loadHighScore() {
    try {
      const stored = window.localStorage.getItem(GAME_CONFIG.HIGH_SCORE_STORAGE_KEY);
      const parsed = Number.parseInt(stored, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch (error) {
      return 0;
    }
  }

  saveHighScore() {
    try {
      window.localStorage.setItem(GAME_CONFIG.HIGH_SCORE_STORAGE_KEY, String(this.highScore));
    } catch (error) {
      // localStorage no disponible (modo privado, cuota excedida, etc.). Se ignora.
    }
  }

  /**
   * @returns {boolean} true si se alcanzó un nuevo récord.
   */
  addPoints(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      return true;
    }
    return false;
  }

  reset() {
    this.score = 0;
  }
}
