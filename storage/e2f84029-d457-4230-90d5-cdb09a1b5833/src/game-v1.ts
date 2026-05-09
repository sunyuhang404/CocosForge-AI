```typescript
// 游戏主类
class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buildings: Building[] = [];
  private resources: { gold: number, wood: number, stone: number } = { gold: 0, wood: 0, stone: 0 };
  private enemies: Enemy[] = [];
  private wave: number = 1;
  private gameOver: boolean = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.initGame();
    this.startWave();
  }

  private initGame() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.addBuilding(new ResourceCollector(100, 100, 'gold', 1));
    this.addBuilding(new Tower(300, 300, 'basic', 1));
    this.addBuilding(new Storage(500, 500, 1));
  }

  private startWave() {
    setInterval(() => {
      if (this.gameOver) return;
      const enemyCount = this.wave * 2; // 每波敌人数量递增
      for (let i = 0; i < enemyCount; i++) {
        this.enemies.push(new Enemy(this.canvas.width, Math.random() * this.canvas.height, 'basic'));
      }
      this.wave++;
    }, 10000); // 每10秒一波敌人
  }

  private update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.buildings.forEach(building => building.update(this.ctx, this.resources));
    this.enemies.forEach(enemy => {
      enemy.update(this.ctx);
      if (enemy.isDead()) {
        this.enemies.splice(this.enemies.indexOf(enemy), 1);
        this.resources.gold += 10; // 击杀敌人获得金币
      }
    });
    this.checkGameOver();
  }

  private checkGameOver() {
    if (this.enemies.some(enemy => enemy.x < 0)) {
      this.gameOver = true;
      alert('游戏结束！');
    }
  }

  private addBuilding(building: Building) {
    this.buildings.push(building);
  }

  public run() {
    this.update();
    requestAnimationFrame(() => this.run());
  }
}

// 建筑基类
abstract class Building {
  x: number;
  y: number;
  level: number;

  constructor(x: number, y: number, level: number) {
    this.x = x;
    this.y = y;
    this.level = level;
  }

  abstract update(ctx: CanvasRenderingContext2D, resources: { [key: string]: number }): void;
}

// 资源采集器
class ResourceCollector extends Building {
  resourceType: string;

  constructor(x: number, y: number, resourceType: string, level: number) {
    super(x, y, level);
    this.resourceType = resourceType;
  }

  update(ctx: CanvasRenderingContext2D, resources: { [key: string]: number }) {
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x, this.y, 50, 50);
    resources[this.resourceType] += 1; // 每帧增加资源
  }
}

// 防御塔
class Tower extends Building {
  towerType: string;

  constructor(x: number, y: number, towerType: string, level: number) {
    super(x, y, level);
    this.towerType = towerType;
  }

  update(ctx: CanvasRenderingContext2D, resources: { [key: string]: number }) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, 50, 50);
    // 简单的攻击逻辑
    for (const enemy of game.enemies) {
      if (Math.abs(enemy.x - this.x) < 100 && Math.abs(enemy.y - this.y) < 100) {
        enemy.takeDamage(10); // 对敌人造成伤害
      }
    }
  }
}

// 储藏室
class Storage extends Building {
  capacity: number;

  constructor(x: number, y: number, capacity: number) {
    super(x, y, 1);
    this.capacity = capacity;
  }

  update(ctx: CanvasRenderingContext2D, resources: { [key: string]: number }) {
    ctx.fillStyle = 'brown';
    ctx.fillRect(this.x, this.y, 50, 50);
  }
}

// 敌人
class Enemy {
  x: number;
  y: number;
  health: number;
  type: string;

  constructor(x: number, y: number, type: string) {
    this.x = x;
    this.y = y;
    this.health = 100;
    this.type = type;
  }

  takeDamage(amount: number) {
    this.health -= amount;
  }

  isDead() {
    return this.health <= 0;
  }

  update(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, 50, 50);
    this.x -= 1; // 向左移动
  }
}

// 初始化游戏
const game = new Game('gameCanvas');
game.run();
```