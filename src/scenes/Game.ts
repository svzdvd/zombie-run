import Phaser from 'phaser'
import PlayerController from './PlayerController';

export default class Game extends Phaser.Scene
{
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private playerSprite?: Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController;

	constructor()
	{
		super('game')
	}

    init()
    {
        this.cursors = this.input.keyboard.createCursorKeys(); 
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
                    this.playerSprite = this.matter.add.sprite(x + (width * 0.5), y - 200, 'zombie')
                        .setFixedRotation();
                    this.playerSprite.setData('type', 'zombie');                        
                    this.playerController = new PlayerController(this, this.playerSprite, this.cursors);        
                    this.cameras.main.startFollow(this.playerSprite, true);
                    break;                    
                }
            }
        });     
    }

    update(time: number, deltaTime: number)
    {
        if (this.playerController) 
        {
            this.playerController.update(deltaTime);
        }
    }
}
