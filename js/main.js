var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });
var player;
var cursors;
var heavy;

var tileSize = 64;
var islandTiles = 100;
var seaTiles = 10;

var islandWidth = islandTiles * tileSize;
var seaWidth = seaTiles * tileSize;

var lines = [];

function makeTerrain() {
	var iterations = 10;
	var seaLevel = game.height - (game.height / 4);

	// array of segment heights
	var segments = [0, 1, 0];

	for (var i = 0; i < iterations; ++i) {
		// increment by 2 each time, because we add another element each iteration
		// also, skip the last iteration, because otherwise j+1 is undefined
		for (var j = 0; j < segments.length - 1; j += 2) {
			var l = segments[j];
			var r = segments[j + 1];
			// math black magic: take a random percentage (0% to 100%) of the difference in height, and then add that on top of the initial height
			var mid = ((r - l) * Math.random()) + l;
			// insert into the middle of the array
			segments.splice(j + 1, 0, mid);
		}
	}


	var width = islandWidth / (segments.length - 1);

	for (var i = 0; i < segments.length - 1; ++i) {
		var x = i * width;
		var left = (1 - segments[i]) * seaLevel;
		var right = (1 - segments[i + 1]) * seaLevel;
		lines.push(new Phaser.Line(x, left, x + width, right));
	}
}

function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
}

function create() {
	game.world.setBounds(-seaWidth, 0, islandWidth + 2 * seaWidth, 600);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	player = game.add.sprite(0, 400, 'star');
	heavy = game.add.sprite(200, 200, 'diamond');

	game.physics.arcade.enable(player);
	player.body.gravity.y = 600;
	player.body.collideWorldBounds = true;

	cursors = game.input.keyboard.createCursorKeys();
	
	game.camera.follow(player);

	makeTerrain();
}

function update() {
	var lineStrength = 0.1;
	var airResistance = 0.01;
	if (game.input.activePointer.isDown) {
		var offset = heavy.position.clone().subtract(player.body.position.x, player.body.position.y);
		offset.multiply(lineStrength, lineStrength);
		player.body.velocity.add(offset.x, offset.y);
		player.body.velocity.multiply(1 - airResistance, 1 - airResistance);
	}
}

function render() {
	lines.forEach(function(l) {
		game.debug.geom(l);
	});
}
