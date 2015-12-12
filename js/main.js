var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var player;
var cursors;
var heavy;

var spaceMode = true;

function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);

	player = game.add.sprite(0, 400, 'star');
	heavy = game.add.sprite(200, 200, 'diamond');

	game.physics.arcade.enable(player);
	if (spaceMode) {
		player.body.velocity.x = 60;
	}

	cursors = game.input.keyboard.createCursorKeys();
}

function update() {
	if (spaceMode) {
		var rotSpeed = 0.05;
		var gravPower = 3;

		if (cursors.left.isDown) {
			player.body.velocity.rotate(0, 0, -rotSpeed);
		} else if (cursors.right.isDown) {
			player.body.velocity.rotate(0, 0, rotSpeed);
		}

		var offset = heavy.position.clone().subtract(player.body.position.x, player.body.position.y);
		var gravDir = offset.normalize();

		var distSq = offset.getMagnitudeSq();

		var grav = gravDir.setMagnitude(gravPower / distSq);

		player.body.velocity = player.body.velocity.add(grav.x, grav.y);
	}
}
