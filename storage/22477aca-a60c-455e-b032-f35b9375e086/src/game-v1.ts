```typescript
// 基础设置
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

interface Tower {
    x: number;
    y: number;
    range: number;
    damage: number;
}

interface Enemy {
    x: number;
    y: number;
    health: number;
    speed: number;
}

let towers: Tower[] = [];
let enemies: Enemy[] = [];
let gold = 100;
let wave = 0;
let gameOver = false;

function drawTower(tower: Tower) {
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // 绘制攻击范围
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.stroke();
}

function drawEnemy(enemy: Enemy) {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制防御塔
    for (let tower of towers) {
        drawTower(tower);
    }

    // 绘制敌人
    for (let enemy of enemies) {
        drawEnemy(enemy);
    }

    // 显示金币数量
    ctx.font = '20px Arial';
    ctx.fillStyle = 'gold';
    ctx.fillText(`Gold: ${gold}`, 10, 30);

    // 显示当前波数
    ctx.fillText(`Wave: ${wave}`, 10, 60);

    if (gameOver) {
        ctx.font = '40px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
    }
}

function update() {
    // 更新敌人位置
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        enemy.x += 1; // 简单的移动逻辑

        // 检查是否到达终点
        if (enemy.x > canvas.width) {
            enemies.splice(i, 1);
            i--;
            gold -= 10;
            if (gold <= 0) {
                gameOver = true;
            }
        }

        // 检查是否被防御塔攻击
        for (let tower of towers) {
            if (Math.hypot(enemy.x - tower.x, enemy.y - tower.y) < tower.range) {
                enemy.health -= tower.damage;
                if (enemy.health <= 0) {
                    enemies.splice(i, 1);
                    i--;
                    gold += 10;
                }
                break;
            }
        }
    }

    if (enemies.length === 0 && !gameOver) {
        wave++;
        spawnEnemies();
    }
}

function spawnEnemies() {
    for (let i = 0; i < 10; i++) {
        enemies.push({
            x: 0,
            y: (i + 1) * 50,
            health: 100,
            speed: 1
        });
    }
}

canvas.addEventListener('click', (e) => {
    if (gold >= 50 && !gameOver) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        towers.push({
            x: x,
            y: y,
            range: 100,
            damage: 10
        });
        gold -= 50;
    }
});

spawnEnemies();
setInterval(() => {
    update();
    draw();
}, 1000 / 60); // 60 FPS
```