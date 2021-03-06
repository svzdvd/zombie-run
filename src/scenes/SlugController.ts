import Phaser from 'phaser';
import StateMachine from '../statemachine/StateMachine';
import {sharedInstance as events} from'./EventCenter';

export default class SlugController 
{
    private sprite: Phaser.Physics.Matter.Sprite;
    private stateMachine: StateMachine;
    private moveTime: number = 0;
    private speed: number = 2;
    private scene: Phaser.Scene

    constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Matter.Sprite)
    {
        this.scene = scene;
        this.sprite = sprite;
        
        this.createAnimations();

        this.stateMachine = new StateMachine(this, 'slug');
        this.stateMachine
            .addState('idle', {
                onEnter: this.idleOnEnter
            })
            .addState('move-left', {
                onEnter: this.moveLeftOnEnter,
                onUpdate: this.moveLeftOnUpdate
            })
            .addState('move-right', {
                onEnter: this.moveRightOnEnter,
                onUpdate: this.moveRightOnUpdate
            })
            .addState('dead')
            .setState('idle');  

        events.on('slug-stomped', this.handleStomped, this)     
    }
               
    destroy()
    {
        events.off('slug-stomped', this.handleStomped, this)       
    }
   
    update(deltaTime: number)
    {
        this.stateMachine.update(deltaTime);
    }

    private createAnimations()
    {
        this.sprite.anims.create({
            key: 'slug-idle',
            frames: [{ key: 'slug', frame: 'slug_2.png' }],
            repeat: 1
        });

        this.sprite.anims.create({
            key: 'slug-walk-left',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('slug', {
                start: 1, 
                end: 3,
                prefix: 'slug_',
                suffix: '.png'
            }),
            repeat: -1
        });

        this.sprite.anims.create({
            key: 'slug-walk-right',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('slug', {
                start: 1, 
                end: 3,
                prefix: 'slug_',
                suffix: '.png'
            }),
            repeat: -1
        });
    }

    private idleOnEnter()
    {
        this.sprite.play('slug-idle');

        const random = Phaser.Math.Between(1, 100);
        if (random < 50)
        {
            this.stateMachine.setState('move-left');
        }
        else
        {
            this.stateMachine.setState('move-right');
        }
    }

    private moveLeftOnEnter()
    {
        this.sprite.play('slug-walk-left');
        this.moveTime = 0;
    }

    private moveLeftOnUpdate(deltaTime: number)
    {
        this.sprite.setVelocityX(-this.speed);
        this.moveTime += deltaTime;
        if (this.moveTime > 2000) {
            this.stateMachine.setState('move-right');
        }
    }

    private moveRightOnEnter()
    {
        this.sprite.play('slug-walk-right');
        this.moveTime = 0;
    }

    private moveRightOnUpdate(deltaTime: number)
    {
        this.sprite.setVelocityX(this.speed / 2);
        this.moveTime += deltaTime;
        if (this.moveTime > 2000 * 2) {
            this.stateMachine.setState('move-left');
        }        
    }

    private handleStomped(slug: Phaser.Physics.Matter.Sprite)
    {
        if (this.sprite !== slug)
        {
            return;
        }

        events.off('slug-stomped', this.handleStomped, this);

        this.scene.tweens.add({
            targets: this.sprite,
            displayHeight: 0,
            y: this.sprite.y + (this.sprite.displayHeight * 0.5),
            duration: 200,
            onComplete: () => {
                this.sprite.destroy
            }
        });

        this.stateMachine.setState('dead');
    }
}