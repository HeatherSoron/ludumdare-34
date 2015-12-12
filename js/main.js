var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });
var player;
var cursors;
var heavy;
var islandGroup;
var anchor;

var tileSize = 128;
var stepSize = tileSize / 4;

var seaTiles = 10;

var terrainIterations = 4;
var islandTiles = Math.pow(2, terrainIterations + 1);

var islandWidth = islandTiles * tileSize;
var seaWidth = seaTiles * tileSize;

var lines = [];

function makeTerrain() {
	var seaLevel = game.height - (game.height / 4);

	// array of segment heights
	var segments = [0, 1, 0];

	for (var i = 0; i < terrainIterations; ++i) {
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

	segments = segments.map(function(elev) {
		var height = (1 - elev) * seaLevel;
		// round it to the step size of our tiles
		height = Math.round(height / stepSize) * stepSize;
		return height;
	});

	for (var i = 0; i < segments.length - 1; ++i) {
		var x = i * width;
		var left = segments[i];
		var right = segments[i + 1];
		lines.push(new Phaser.Line(x, left, x + width, right));
		
		// do left - right because negative numbers are UP
		var steps = (left - right) / stepSize;
		var flip = false;
		if (steps < 0) {
			console.log(left, right, steps, 4 - (-steps));
			flip = true;
			steps = -steps;
			// compensate for the flip
			x += tileSize;
		}
		var frame = 4 - steps;
		if (frame == 4) {
			frame = 7;
		}
		var tile = islandGroup.create(x, Math.min(left, right), 'terrain');
		tile.body.immovable = true;
		tile.frame = frame;
		if (flip) {
			tile.scale.x = -1;
		}
	}
}

function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
	game.load.spritesheet('terrain', 'assets/terrain.png', tileSize, tileSize);
}

function create() {
	game.world.setBounds(-seaWidth, 0, islandWidth + 2 * seaWidth, 600);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.stage.backgroundColor = 'rgb(0,0,255)';
	
	islandGroup = game.add.group();
	islandGroup.enableBody = true;

	makeTerrain();

	player = game.add.sprite(0, 0, 'star');
	heavy = game.add.sprite(200, 200, 'diamond');

	game.physics.arcade.enable(player);
	player.body.gravity.y = 600;
	player.body.collideWorldBounds = true;

	cursors = game.input.keyboard.createCursorKeys();
	
	game.camera.follow(player);
}

function update() {
	// we need to collide first, and THEN give the velocity a kick away from the collision site
	game.physics.arcade.collide(player, islandGroup);

	if (game.input.activePointer.isDown) {
		// check whether we've already got an anchor point
		if (anchor) {
			grapple();
		} else {
			var ray = new Phaser.Line(player.body.position.x, player.body.position.y, game.input.activePointer.worldX, game.input.activePointer.worldY);
			var tree = new Phaser.Line(heavy.position.x, heavy.position.y, heavy.position.x, game.height);
			
			var p = ray.intersects(tree, true);
			if (p) {
				anchor = p;
				console.log
				console.log(anchor);
				grapple();
			}
		}
	} else {
		anchor = null;
	}
}

function grapple() {
	var lineStrength = 0.1;
	var airResistance = 0.01;

	var offset = anchor.clone().subtract(player.body.position.x, player.body.position.y);
	offset.multiply(lineStrength, lineStrength);
	player.body.velocity.add(offset.x, offset.y);
	player.body.velocity.multiply(1 - airResistance, 1 - airResistance);
}

function render() {
	lines.forEach(function(l) {
		game.debug.geom(l);
	});

	if (anchor) {
		game.debug.geom(new Phaser.Line(player.body.x, player.body.y, anchor.x, anchor.y));
	}
}
