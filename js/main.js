var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });
var player;
var cursors;
var trees;
var seeds = [];
var islandGroup;
var anchor;

var tileSize = 32;
var stepSize = tileSize / 4;

var seaTiles = 10;

var terrainIterations = 6;
var islandTiles = Math.pow(2, terrainIterations + 1);

var islandWidth = islandTiles * tileSize;
var seaWidth = seaTiles * tileSize;

var worldHeight = 1200;

var lines = [];

var gravity = 600;

var treeHeight = 300;

function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
	game.load.spritesheet('terrain', 'assets/terrain.png', tileSize, tileSize);
}

function create() {
	trees = [];

	game.world.setBounds(-seaWidth, game.height - worldHeight, islandWidth + 2 * seaWidth, worldHeight);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.stage.backgroundColor = 'rgb(0,0,255)';
	
	islandGroup = game.add.group();
	islandGroup.enableBody = true;

	makeTerrain();

	player = game.add.sprite(0, 0, 'star');
	makeTree(200, 200);
	makeTree(400, 200);

	game.physics.arcade.enable(player);
	player.body.gravity.y = gravity;
	player.body.collideWorldBounds = true;

	cursors = game.input.keyboard.createCursorKeys();
	
	game.input.mouse.mouseDownCallback = function(e) {
		if (e.button === Phaser.Mouse.RIGHT_BUTTON) {
			throwSeed();
		} else {
			console.log(game.input.mouse.button);
		}
	}
	document.getElementById('game').addEventListener('contextmenu', function(e) {
		e.preventDefault();
	});

	game.camera.follow(player);
}

function makeTree(x, y) {
	var tree = game.add.sprite(x, y, 'diamond');
	var center = tree.x + tree.width / 2;
	tree.trunk = new Phaser.Line(center, tree.y, center, game.height);
	trees.push(tree);

}

function throwSeed() {
	var throwStrength = 500;

	var seed = game.add.sprite(player.body.x, player.body.y, 'star');
	game.physics.arcade.enable(seed);
	seed.body.gravity.y = gravity;

	seed.body.velocity = new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY).subtract(player.body.position.x, player.body.position.y).setMagnitude(throwStrength);

	seeds.push(seed);
}

function update() {
	// iterate backwards because we'll be removing elements
	for (var i = seeds.length - 1; i >= 0; --i) {
		if (game.physics.arcade.overlap(seeds[i], islandGroup)) {
			var seed = seeds[i];
			makeTree(seed.body.position.x, seed.body.position.y - treeHeight);
			seed.destroy();
			seeds.splice(i, 1);
		}
	}

	// we need to collide first, and THEN give the velocity a kick away from the collision site
	game.physics.arcade.collide(player, islandGroup);

	if (game.input.activePointer.isDown) {
		// check whether we've already got an anchor point
		if (anchor) {
			grapple();
		} else {
			var ray = new Phaser.Line(player.body.position.x, player.body.position.y, game.input.activePointer.worldX, game.input.activePointer.worldY);
			trees.forEach(function(tree) {
				var p = ray.intersects(tree.trunk, true);
				if (p && (!anchor || p.distance(getMouseWorldPos()) < anchor.distance(getMouseWorldPos()))) {
					anchor = p;
				}
			});
			if (anchor) {
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

	trees.forEach(function(t) {
		game.debug.geom(t.trunk);
	});

	if (anchor) {
		game.debug.geom(new Phaser.Line(player.body.x, player.body.y, anchor.x, anchor.y));
	}
}
