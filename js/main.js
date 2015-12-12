var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var player;
var cursors;
var heavy;

var spaceMode = false;

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
	} else {
		player.body.gravity.y = 600;
		player.body.collideWorldBounds = true;
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
	} else {
		var lineStrength = 0.1;
		var airResistance = 0.01;
		if (game.input.activePointer.isDown) {
			var offset = heavy.position.clone().subtract(player.body.position.x, player.body.position.y);
			offset.multiply(lineStrength, lineStrength);
			player.body.velocity.add(offset.x, offset.y);
			player.body.velocity.multiply(1 - airResistance, 1 - airResistance);
		}
	}
}
