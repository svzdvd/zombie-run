import Phaser from 'phaser';
import StateMachine from '../statemachine/StateMachine';
import { sharedInstance as events } from './EventCenter';
import ObstaclesController from './ObstaclesController';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export default class PlayerController 
{
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Matter.Sprite;
    private cursors: CursorKeys;
    private obstacles: ObstaclesController;    
    private stateMachine: StateMachine;
    private speed: number = 6;
    private jumpSpeed: number = 15;
    private stompJumpSpeed: number = 7;
    private health: number = 100;

    private lastSlug?: Phaser.Physics.Matter.Sprite;
    private lastPurpleDevil?: Phaser.Physics.Matter.Sprite;

    constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Matter.Sprite, cursors: CursorKeys, obstacles: ObstaclesController)
    {
        this.scene = scene;
        this.sprite = sprite;
        this.cursors = cursors;
        this.obstacles = obstacles;

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
            .addState('slug-hit', {
                onEnter: this.slugHitOnEnter
            })
            .addState('slug-stomp', {
                onEnter: this.slugStompOnEnter
            })            
            .setState('idle');

        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            let playerBody: MatterJS.BodyType;
            let body: MatterJS.BodyType;
            if (this.isPlayerBody(data.bodyA)) {
                playerBody = data.bodyA as MatterJS.BodyType;
                body = data.bodyB as MatterJS.BodyType;
            } else {
                playerBody = data.bodyB as MatterJS.BodyType;
                body = data.bodyA as MatterJS.BodyType;                
            }
            
            if (this.obstacles.has('slug', body))
            {
                this.lastSlug = body.gameObject;

                console.log('velocityy: ' + playerBody.velocity.y);
                if (playerBody.velocity.y > 1) 
                {
                    // stomp on slug
                    this.stateMachine.setState('slug-stomp')
                }
                else 
                {
                    // hit by slug
                    this.stateMachine.setState('slug-hit');
                }
                return;
            }        

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

    private slugHitOnEnter()
    {
        if (this.lastSlug)
        {
            // TODO improve (check if penguin velocity is going down?)
            if (this.sprite.x < this.lastSlug.x)
            {
                this.sprite.setVelocityX(-this.speed / 2);
            }
            else
            {
                this.sprite.setVelocityX(this.speed / 2);
            }
        }

        // TODO remove duplicated code
        const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
        const endColor = Phaser.Display.Color.ValueToColor(0x00ff00);
        this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 100,
            repeat: 2,
            yoyo: true,
            onUpdate: tween => {
                const value = tween.getValue();
                const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                    startColor,
                    endColor,
                    100,
                    value
                );
                const color = Phaser.Display.Color.GetColor(colorObject.r, colorObject.g, colorObject.b);
                this.sprite.setTint(color);
            }
        });

        this.stateMachine.setState('idle');    
        // this.setHealth(this.health - 10);    
    }

    private slugStompOnEnter()
    {
        this.sprite.setVelocityY(-this.stompJumpSpeed)
        events.emit('slug-stomped', this.lastSlug)
        this.stateMachine.setState('idle')
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