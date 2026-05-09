// main.ts
import { createGame } from './game';
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (app) {
    const canvas = document.createElement('canvas');
    canvas.width = app.clientWidth;
    canvas.height = app.clientHeight;
    app.appendChild(canvas);
    createGame(canvas);
  }
});

// game.ts
export function createGame(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const player = {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    speed: 5,
    jumping: false,
    jumpHeight: 100,
    gravity: 1.5,
    velocityY: 0
  };

  let keysPressed: { [key: string]: boolean } = {};

  function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  function updatePlayerPosition() {
    if (keysPressed['a']) {
      player.x -= player.speed;
    }
    if (keysPressed['d']) {
      player.x += player.speed;
    }
    if (keysPressed['w'] && !player.jumping) {
      player.jumping = true;
      player.velocityY = -Math.sqrt(2 * player.gravity * player.jumpHeight);
    }

    if (player.jumping) {
      player.velocityY += player.gravity;
      player.y += player.velocityY;
      if (player.y >= canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.jumping = false;
        player.velocityY = 0;
      }
    }
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function gameLoop() {
    clearCanvas();
    updatePlayerPosition();
    drawPlayer();
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
  });

  window.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
  });

  gameLoop();
}