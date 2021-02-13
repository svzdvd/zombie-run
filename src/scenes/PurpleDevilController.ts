import Phaser from 'phaser';
import StateMachine from '../statemachine/StateMachine';
import {sharedInstance as events} from'./EventCenter';

export default class PurpleDevilController 
{
    private sprite: Phaser.Physics.Matter.Sprite;
    private stateMachine: StateMachine;
    private moveTime: number = 0;
    private speed: number = 3;
    private scene: Phaser.Scene

    constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Matter.Sprite)
    {
        this.scene = scene;
        this.sprite = sprite;
        
        this.createAnimations();

        this.stateMachine = new StateMachine(this, 'purpledevil');
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

        events.on('purpledevil-stomped', this.handleStomped, this)     
    }
               
    destroy()
    {
        events.off('purpledevil-stomped', this.handleStomped, this)       
    }
   
    update(deltaTime: number)
    {
        this.stateMachine.update(deltaTime);
    }

    private createAnimations()
    {
        this.sprite.anims.create({
            key: 'purpledevil-idle',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('purpledevil', {
                start: 1, 
                end: 3,
                prefix: 'monster02_idle_',
                suffix: '.png'
            }),
            repeat: -1
        });

        this.sprite.anims.create({
            key: 'purpledevil-walk-left',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('purpledevil', {
                start: 1, 
                end: 2,
                prefix: 'monster02_walk_left_',
                suffix: '.png'
            }),
            repeat: -1
        });

        this.sprite.anims.create({
            key: 'purpledevil-walk-right',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('purpledevil', {
                start: 1, 
                end: 2,
                prefix: 'monster02_walk_right_',
                suffix: '.png'
            }),
            repeat: -1
        });
    }

    private idleOnEnter()
    {
        this.sprite.play('purpledevil-idle');

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
        this.sprite.play('purpledevil-walk-left');
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
        this.sprite.play('purpledevil-walk-right');
        this.moveTime = 0;
    }

    private moveRightOnUpdate(deltaTime: number)
    {
        this.sprite.setVelocityX(this.speed);
        this.moveTime += deltaTime;
        if (this.moveTime > 2000) {
            this.stateMachine.setState('move-left');
        }        
    }

    private handleStomped(purpledevil: Phaser.Physics.Matter.Sprite)
    {
        if (this.sprite !== purpledevil)
        {
            return;
        }

        events.off('snoman-stomped', this.handleStomped, this);

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