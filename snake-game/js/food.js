export class Food {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.position = { x: 0, y: 0 };
  }

  /**
   * Coloca la comida en una celda libre aleatoria.
   * @param {{x:number,y:number}[]} occupiedCells Celdas que no pueden usarse (cuerpo de la serpiente).
   * @returns {boolean} false si no queda ninguna celda libre (tablero lleno).
   */
  spawn(occupiedCells) {
    const freeCells = [];
    for (let x = 0; x < this.columns; x += 1) {
      for (let y = 0; y < this.rows; y += 1) {
        const isOccupied = occupiedCells.some((cell) => cell.x === x && cell.y === y);
        if (!isOccupied) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length === 0) {
      return false;
    }

    this.position = freeCells[Math.floor(Math.random() * freeCells.length)];
    return true;
  }
}
