import { _decorator, Component, Node, Vec3, instantiate, Prefab, Collider2D, UITransform, BoxCollider2D, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Prefab })
    snakePrefab: Prefab | null = null;

    @property({ type: Prefab })
    foodPrefab: Prefab | null = null;

    private snake: Node | null = null;
    private food: Node | null = null;
    private score: number = 0;
    private isGameOver: boolean = false;

    start() {
        this.initGame();
    }

    private initGame() {
        this.score = 0;
        this.isGameOver = false;
        this.spawnSnake();
        this.spawnFood();
    }

    private spawnSnake() {
        if (this.snakePrefab) {
            this.snake = instantiate(this.snakePrefab);
            this.node.addChild(this.snake);
            this.snake.setPosition(new Vec3(0, 0, 0));
        }
    }

    private spawnFood() {
        if (this.foodPrefab) {
            this.food = instantiate(this.foodPrefab);
            this.node.addChild(this.food);
        
            // 随机生成食物位置
            const x = Math.floor(Math.random() * 20 - 10) * 40;
            const y = Math.floor(Math.random() * 20 - 10) * 40;
            this.food.setPosition(new Vec3(x, y, 0));
        }
    }

    public gameOver() {
        this.isGameOver = true;
        // 游戏结束逻辑
        console.log('Game Over! Score:', this.score);
    }

    public addScore() {
        this.score += 10;
        if (this.food) {
            this.food.destroy();
            this.food = null;  // 确保引用被清除
        }
        // 延迟一帧生成新的食物，确保旧食物完全销毁
        this.scheduleOnce(() => {
            this.spawnFood();
        }, 0);
    }
}