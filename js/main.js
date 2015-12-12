var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var player;


function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);

	player = game.add.sprite(0, 400, 'star');
	game.add.sprite(200, 200, 'diamond');

	game.physics.arcade.enable(player);
	player.body.velocity.x = 60;
}

function update() {
		
}
