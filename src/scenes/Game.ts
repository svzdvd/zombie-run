import Phaser from 'phaser'
import PlayerController from './PlayerController';
import ObstaclesController from './ObstaclesController';
import SlugController from './SlugController';

export default class Game extends Phaser.Scene
{
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private playerSprite?: Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController;
    private obstacles!: ObstaclesController;
    private slugControllers: SlugController[] = [];
    
	constructor()
	{
		super('game')
	}

    init()
    {
        this.cursors = this.input.keyboard.createCursorKeys(); 
        this.obstacles = new ObstaclesController();
    }

    preload()
    {
        this.load.atlas('zombie', 'assets/zombie-male.png', 'assets/zombie-male.json');
        
        this.load.image('tiles' , 'assets/graveyard-spritesheet.png');
        this.load.tilemapTiledJSON('tilemap' , 'assets/graveyard-map.json');

        this.load.atlas('slug', 'assets/slug.png', 'assets/slug.json');
        this.load.atlas('purpledevil', 'assets/purpledevil.png', 'assets/purpledevil.json');
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
                        .setData('type', 'player')
                        .setScale(0.50)
                        .setFixedRotation();            
                    this.playerController = new PlayerController(this, this.playerSprite, this.cursors);        
                    this.cameras.main.startFollow(this.playerSprite, true);
                    break;                    
                }
                case 'slug':
                {
                    const slug = this.matter.add.sprite(x + (width * 0.5), y + (width * 0.5), 'slug')
                        .setData('type', 'slug')
                        .setScale(0.33)
                        .setFixedRotation();
                    this.slugControllers.push(new SlugController(this, slug));
                    this.obstacles.add('slug', slug.body as MatterJS.BodyType);
                    break;
                }
                case 'purpledevil':
                {
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
