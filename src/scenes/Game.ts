import Phaser from 'phaser'

export default class Game extends Phaser.Scene
{
	constructor()
	{
		super('game')
	}

    preload()
    {
        this.load.atlas('zombie', 'assets/zombie-male.png', 'assets/zombie-male.json');
        
        this.load.image('tiles' , 'assets/graveyard-spritesheet.png');
        this.load.tilemapTiledJSON('tilemap' , 'assets/graveyard-map.json');
    }

    create()
    {
        const map = this.make.tilemap({ key : 'tilemap' });
        const tileset = map.addTilesetImage('graveyard-spritesheet' , 'tiles');
    
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(ground);

        const { width, height } = this.scale;

        const objectsLayer = map.getObjectLayer('objects');
        objectsLayer.objects.forEach(objData => {
            const { x = 0, y = 0, name, width = 0 } = objData;
            switch(name) 
            {
                case 'player':
                {
                    const player = this.matter.add.sprite(x + (width * 0.5), y - 200, 'zombie')
                        .setFixedRotation();
                    player.setData('type', 'zombie'); 
                    
                    player.anims.create({
                        key: 'player-idle',
                        frameRate: 10,
                        frames: player.anims.generateFrameNames('zombie', {
                            start: 1, 
                            end: 15,
                            prefix: 'Idle (',
                            suffix: ').png'
                        }),
                        repeat: -1
                    });

                    // this.playerController = new PlayerController(this, this.penguin, this.cursors, this.obstacles);        
                    player.setVelocityX(0);
                    player.play('player-idle');
                    this.cameras.main.startFollow(player, true);
                    break;
                }
            }
        });     
    }
}
