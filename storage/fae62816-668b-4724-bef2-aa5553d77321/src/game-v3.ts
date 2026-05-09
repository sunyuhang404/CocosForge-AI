// main.ts
import { setupGame, startGameLoop } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (app) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    app.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      setupGame(ctx);
      startGameLoop(ctx);
    }
  }
});

// game.ts
export function setupGame(ctx: CanvasRenderingContext2D) {
  // 初始化游戏状态
  const player = {
    x: 100,
    y: 400,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 5,
    jumpSpeed: -15,
    gravity: 1,
    velocityY: 0,
    onGround: true
  };

  // 绘制玩家
  function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // 更新玩家位置
  function updatePlayer() {
    if (!player.onGround) {
      player.velocityY += player.gravity;
      player.y += player.velocityY;
    }

    if (player.y + player.height >= 550) {
      player.y = 550 - player.height;
      player.velocityY = 0;
      player.onGround = true;
    }

    if (keys.ArrowLeft) {
      player.x -= player.speed;
    }
    if (keys.ArrowRight) {
      player.x += player.speed;
    }
  }

  // 键盘事件处理
  const keys: { [key: string]: boolean } = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp' && player.onGround) {
      player.velocityY = player.jumpSpeed;
      player.onGround = false;
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  return { drawPlayer, updatePlayer };
}

export function startGameLoop(ctx: CanvasRenderingContext2D) {
  const { drawPlayer, updatePlayer } = setupGame(ctx);

  function gameLoop() {
    ctx.clearRect(0, 0, 800, 600);
    updatePlayer();
    drawPlayer();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}