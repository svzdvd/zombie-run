import Phaser from 'phaser';
import StateMachine from '../statemachine/StateMachine';
// import { sharedInstance as events } from './EventCenter';
// import ObstaclesController from './ObstaclesController';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export default class PlayerController 
{
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Matter.Sprite;
    private cursors: CursorKeys;
    // private obstacles: ObstaclesController;    
    private stateMachine: StateMachine;
    private speed: number = 5;
    private jumpSpeed: number = 10;
    private health: number = 100;

    constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Matter.Sprite, cursors: CursorKeys)
    {
        this.scene = scene;
        this.sprite = sprite;
        this.cursors = cursors;
        // this.obstacles = obstacles;

        this.sprite.setFriction(0.001);

        this.createAnimations();

        this.stateMachine = new StateMachine(this, 'playerController');
        this.stateMachine
            .addState('idle', {
                onEnter: this.idleOnEnter,
                onUpdate: this.idleOnUpdate
            })
            .addState('walk', {
                onEnter: this.walkOnEnter,
                onUpdate: this.walkOnUpdate
            })
            .addState('jump', {
                onEnter: this.jumpOnEnter,
                onUpdate: this.jumpOnUpdate
            })
            .setState('idle');

        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            const body = (this.isPlayerBody(data.bodyA) ? data.bodyB : data.bodyA)  as MatterJS.BodyType;
            const gameObject = body.gameObject;
            if (!gameObject) 
            {
                return;
            }
    
            if (gameObject instanceof Phaser.Physics.Matter.TileBody) 
            {
                if (this.stateMachine.isCurrentState('jump'))
                {
                    this.stateMachine.setState('idle');
                }
            }
        });
    }

    update(deltaTime: number)
    {
        this.stateMachine.update(deltaTime);
    }

    private idleOnEnter()
    {
        this.sprite.setVelocityX(0);
        this.sprite.play('player-idle');
    }

    private idleOnUpdate() 
    {
        if (this.cursors.left.isDown || this.cursors.right.isDown) 
        {
            this.stateMachine.setState('walk');
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) 
        {
            this.stateMachine.setState('jump');
        }
    }

    private walkOnEnter()
    {
        this.sprite.play('player-walk');
    }

    private walkOnUpdate(deltaTime: number)
    {
        const spaceKeyIsJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);

        if (this.cursors.left.isDown) 
        {
            this.sprite.flipX = true;
            this.sprite.setVelocityX(-this.speed);
        }
        else if (this.cursors.right.isDown)
        {
            this.sprite.flipX = false;            
            this.sprite.setVelocityX(this.speed);
        }
        
        if (spaceKeyIsJustPressed)
        {
            this.stateMachine.setState('jump');
        }

        if (!this.cursors.left.isDown && !this.cursors.right.isDown && !spaceKeyIsJustPressed) 
        {
            this.stateMachine.setState('idle');
        }
    }

    private jumpOnEnter() 
    {
        this.sprite.play('player-jump');
        this.sprite.setVelocityY(-this.jumpSpeed);
    }

    private jumpOnUpdate() 
    {
        if (this.cursors.left.isDown) 
        {
            this.sprite.flipX = true;
            this.sprite.setVelocityX(-this.speed);
        }
        else if (this.cursors.right.isDown)
        {
            this.sprite.flipX = false;            
            this.sprite.setVelocityX(this.speed);
        }
    }

    private isPlayerBody(body: MatterJS.Body)
    {
        const gameObject = (body as MatterJS.BodyType).gameObject;
        if (gameObject instanceof Phaser.Physics.Matter.Sprite)
        {
            const type = gameObject.getData('type');
            return type === 'player';
        }
        return false;
    }

    private createAnimations()
    {
        this.sprite.anims.create({
            key: 'player-idle',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('zombie', {
                start: 1, 
                end: 15,
                prefix: 'Idle (',
                suffix: ').png'
            }),
            repeat: -1
        });

        this.sprite.anims.create({
            key: 'player-walk',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('zombie', {
                start: 1, 
                end: 10,
                prefix: 'Walk (',
                suffix: ').png'
            }),
            repeat: -1
        });

        this.sprite.anims.create({
            key: 'player-jump',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('zombie', {
                start: 2, 
                end: 4,
                prefix: 'Walk (',
                suffix: ').png'
            }),
            repeat: 0
        });        
    }
}