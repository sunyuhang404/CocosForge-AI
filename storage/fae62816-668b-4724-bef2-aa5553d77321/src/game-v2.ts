// 主模块
const app = document.getElementById('app');
if (app) {
  const canvas = createCanvas(600, 600);
  app.appendChild(canvas);

  // 开始游戏
  startGame(canvas);
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gridSize = 20; // 每个格子的大小
  const gridWidth = 10; // 棋盘宽度
  const gridHeight = 10; // 棋盘高度

  let selectedTile = null;
  let score = 0;
  let level = 1;
  let targetScore = 100;

  const tiles = [];

  // 初始化棋盘
  function initBoard() {
    for (let i = 0; i < gridHeight; i++) {
      const row = [];
      for (let j = 0; j < gridWidth; j++) {
        row.push(null);
      }
      tiles.push(row);
    }

    // 随机生成图标
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        tiles[i][j] = `icon-${Math.floor(Math.random() * 5) + 1}`;
      }
    }
  }

  // 绘制棋盘
  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        const icon = tiles[i][j];
        if (icon) {
          ctx.fillStyle = 'white';
          ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
          ctx.drawImage(document.getElementById(icon), j * gridSize, i * gridSize, gridSize, gridSize);
        }
      }
    }
  }

  // 处理鼠标点击事件
  function handleMouseClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / gridSize);
    const y = Math.floor((event.clientY - rect.top) / gridSize);

    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      if (selectedTile) {
        if (tiles[y][x] === tiles[selectedTile[1]][selectedTile[0]]) {
          if (canConnect(selectedTile, [x, y])) {
            removeTiles(selectedTile, [x, y]);
            selectedTile = null;
          } else {
            selectedTile = null;
          }
        } else {
          selectedTile = [x, y];
        }
      } else {
        selectedTile = [x, y];
      }
    }
  }

  // 检查两个图标是否可以通过不多于3个直角转弯的路径相连
  function canConnect(start, end) {
    const dx = Math.abs(start[0] - end[0]);
    const dy = Math.abs(start[1] - end[1]);
    return (dx + dy <= 3) && (Math.max(dx, dy) <= 2);
  }

  // 移除图标
  function removeTiles(...positions) {
    for (const [x, y] of positions) {
      tiles[y][x] = null;
      score += 10;
    }
    dropTiles();
    drawBoard();
  }

  // 下落填补空缺的位置
  function dropTiles() {
    for (let x = 0; x < gridWidth; x++) {
      let emptyRow = gridHeight - 1;
      for (let y = gridHeight - 1; y >= 0; y--) {
        if (tiles[y][x]) {
          if (y !== emptyRow) {
            tiles[emptyRow][x] = tiles[y][x];
            tiles[y][x] = null;
          }
          emptyRow--;
        }
      }
    }
  }

  // 检查游戏结束
  function checkGameOver() {
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        if (tiles[i][j] && canConnect([j, i], [j, i])) {
          return false;
        }
      }
    }
    return true;
  }

  // 初始化游戏
  initBoard();
  drawBoard();

  // 添加鼠标点击事件监听
  canvas.addEventListener('click', handleMouseClick);

  // 游戏循环
  function gameLoop() {
    if (checkGameOver()) {
      alert('游戏结束！');
      return;
    }

    if (score >= targetScore) {
      alert('过关！');
      level++;
      targetScore += 100;
      initBoard();
      drawBoard();
    }

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}