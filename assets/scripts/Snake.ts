import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, Collider2D, Contact2DType, IPhysics2DContact, UITransform, BoxCollider2D, Sprite, SpriteFrame, director } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('Snake')
export class Snake extends Component {
    @property({ type: SpriteFrame })
    bodySprite: SpriteFrame | null = null;

    @property
    moveSpeed: number = 800;

    @property
    bodySpacing: number = 40;

    private direction: Vec3 = new Vec3(1, 0, 0);
    private bodyNodes: Node[] = [];
    private positions: Vec3[] = [];
    private gameManager: GameManager | null = null;

    start() {
        this.initSnake();
        this.setupInput();
        this.setupCollision();
        this.gameManager = this.node.parent?.getComponent(GameManager);
    }

    private initSnake() {
        // 初始化蛇身
        this.bodyNodes.push(this.node);
        this.positions.push(this.node.position);
    }

    private setupInput() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private setupCollision() {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.group = 1;
            // 使用 contact.enabled 替代 maskBits 来启用碰撞
            collider.enabled = true;
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollision, this);
        }
    }

    private onKeyDown(event: EventKeyboard) {
        switch(event.keyCode) {
            case KeyCode.ARROW_UP:
                if (this.direction.y !== -1) {
                    this.direction = new Vec3(0, 1, 0);
                }
                break;
            case KeyCode.ARROW_DOWN:
                if (this.direction.y !== 1) {
                    this.direction = new Vec3(0, -1, 0);
                }
                break;
            case KeyCode.ARROW_LEFT:
                if (this.direction.x !== 1) {
                    this.direction = new Vec3(-1, 0, 0);
                }
                break;
            case KeyCode.ARROW_RIGHT:
                if (this.direction.x !== -1) {
                    this.direction = new Vec3(1, 0, 0);
                }
                break;
        }
    }

    private onCollision(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        console.log('碰撞检测:', otherCollider.node.name);
        
        if (otherCollider.node.name === 'Food') {
            // 使用 scheduleOnce 延迟处理碰撞逻辑
            this.scheduleOnce(() => {
                this.grow();
                this.gameManager?.addScore();
            }, 0);
        } else if (otherCollider.node.name === 'SnakeBody') {
            console.log('蛇头碰到蛇身，游戏结束!');
            // 使用 scheduleOnce 延迟处理游戏结束逻辑
            this.scheduleOnce(() => {
                this.gameManager?.gameOver();
            }, 0);
        } else if (this.isOutOfBounds()) {
            console.log('蛇头超出边界，游戏结束!');
            // 使用 scheduleOnce 延迟处理游戏结束逻辑
            this.scheduleOnce(() => {
                this.gameManager?.gameOver();
            }, 0);
        }
    }

    private isOutOfBounds(): boolean {
        const pos = this.node.position;
        return Math.abs(pos.x) > 400 || Math.abs(pos.y) > 400;
    }

    update(deltaTime: number) {
        // 更新蛇头位置
        const newPos = this.node.position.clone().add(this.direction.clone().multiplyScalar(this.moveSpeed * deltaTime));
        this.node.setPosition(newPos);

        // 更新位置历史
        this.positions.unshift(newPos.clone());
        
        // 移除多余的历史位置
        if (this.positions.length > this.bodyNodes.length * 10) { // 保留足够多的历史位置
            this.positions.pop();
        }

        // 更新蛇身位置 - 每个节点跟随路径上的点，保持固定间距
        let totalDistance = 0;
        for (let i = 1; i < this.bodyNodes.length; i++) {
            // 计算当前节点应该在的位置
            totalDistance += this.bodySpacing;
            
            // 沿着历史路径找到合适的位置
            let targetPos = this.positions[0].clone();
            let currentDistance = 0;
            
            for (let j = 0; j < this.positions.length - 1; j++) {
                const segmentVector = this.positions[j+1].clone().subtract(this.positions[j]);
                const segmentLength = segmentVector.length();
                
                if (currentDistance + segmentLength >= totalDistance) {
                    // 找到了合适的位置
                    const remainingDistance = totalDistance - currentDistance;
                    const ratio = remainingDistance / segmentLength;
                    targetPos = this.positions[j].clone().lerp(this.positions[j+1], ratio);
                    break;
                }
                
                currentDistance += segmentLength;
            }
            
            // 设置蛇身位置
            this.bodyNodes[i].setPosition(targetPos);
        }
    }

    private grow() {
        const lastBody = this.bodyNodes[this.bodyNodes.length - 1];
        const newBody = new Node('SnakeBody');
        
        // 设置新蛇身的位置在最后一节蛇身后面
        const direction = this.direction.clone().negative();
        const newPosition = lastBody.position.clone().add(direction.multiplyScalar(this.bodySpacing));
        newBody.setPosition(newPosition);
        
        // 添加 UITransform 组件
        const uiTransform = newBody.addComponent(UITransform);
        uiTransform.setContentSize(40, 40);

        // 添加碰撞体组件
        const collider = newBody.addComponent(BoxCollider2D);
        collider.enabled = true;
        collider.sensor = true;
        collider.group = 1;
        collider.friction = 0;
        
        // 添加 Sprite 组件来显示蛇身
        const sprite = newBody.addComponent(Sprite);
        sprite.spriteFrame = this.bodySprite;
        
        // 添加调试代码
        console.log('Body Sprite:', sprite);
        console.log('Sprite Frame:', this.bodySprite);
        
        this.node.parent?.addChild(newBody);
        this.bodyNodes.push(newBody);
        this.positions.push(newPosition);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }
}