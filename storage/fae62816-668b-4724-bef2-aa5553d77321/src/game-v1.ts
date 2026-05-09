// main.ts
import { createCanvas, startGame } from 'https://cdn.jsdelivr.net/gh/user/repo@version/game.js';

const app = document.getElementById('app');
if (!app) throw new Error('Container with id \"app\" not found');

const canvas = createCanvas(600, 600);
app.appendChild(canvas);

startGame(canvas);

// game.js
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function startGame(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const gridSize = 10;
  const gridWidth = Math.floor(canvas.width / gridSize);
  const gridHeight = Math.floor(canvas.height / gridSize);
  const grid = Array.from({ length: gridWidth * gridHeight }, () => Math.floor(Math.random() * 5));

  let selectedTile: [number, number] | null = null;

  function drawGrid() {
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        const tile = grid[index];
        ctx.fillStyle = `hsl(${tile * 36}, 100%, 50%)`;
        ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
      }
    }
  }

  function isPathClear(start: [number, number], end: [number, number]): boolean {
    const [sx, sy] = start;
    const [ex, ey] = end;
    if (sx === ex) {
      for (let y = Math.min(sy, ey) + 1; y < Math.max(sy, ey); y++) {
        if (grid[y * gridWidth + sx] !== -1) return false;
      }
    } else if (sy === ey) {
      for (let x = Math.min(sx, ex) + 1; x < Math.max(sx, ex); x++) {
        if (grid[sy * gridWidth + x] !== -1) return false;
      }
    }
    return true;
  }

  function handleTileClick(x: number, y: number) {
    const index = y * gridWidth + x;
    if (selectedTile) {
      const [sx, sy] = selectedTile;
      if (grid[index] === grid[sy * gridWidth + sx] && isPathClear([sx, sy], [x, y])) {
        grid[index] = -1;
        grid[sy * gridWidth + sx] = -1;
        selectedTile = null;
      } else {
        selectedTile = [x, y];
      }
    } else {
      selectedTile = [x, y];
    }
  }

  function clearEmptyTiles() {
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        if (grid[index] === -1) {
          for (let ty = y; ty > 0; ty--) {
            const tIndex = (ty - 1) * gridWidth + x;
            [grid[tIndex], grid[tIndex + gridWidth]] = [grid[tIndex + gridWidth], grid[tIndex]];
          }
        }
      }
    }
  }

  function update() {
    clearEmptyTiles();
    drawGrid();
    requestAnimationFrame(update);
  }

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / gridSize);
    const y = Math.floor((event.clientY - rect.top) / gridSize);
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      handleTileClick(x, y);
    }
  });

  update();
}