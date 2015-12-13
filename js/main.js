var game = new Phaser.Game(1200, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });
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
var islandTiles;

var islandWidth;
var seaWidth = seaTiles * tileSize;

var seaLevel = game.height - (game.height / 4);

var worldHeight = 1200;

var lines = [];

var gravity = 300;

var horizontalDrag = 500;

var terrainFrames = {
	slope1: [3, 7, 19, 23],
	slope2: [2, 6, 18, 22],
	slope3: [1, 5, 17, 21],
	slope4: [0, 4, 16, 20],
	full: [8, 12, 24, 28],
};

var terrainVariations = 4;

var maxPlayerDistance = 0;
// 1 in n chance for a bush
var bushInvChance = 24;
var bushVariations = 24;

// the height is how tall we treat it as in-game, NOT how tall the sprite is
var treeHeight = 530;
// width is the same as sprite width, though
var treeWidth = 72;

function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
	game.load.spritesheet('tree', 'assets/tree.png', treeWidth, 544);
	game.load.spritesheet('bush', 'assets/bush.png', 16, 16);
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
	var tree = game.add.sprite(x, y, 'tree');
	tree.animations.add('grow', [0, 1, 2, 3, 4, 5, 6], 4, false);
	tree.animations.play('grow');
	var center = tree.x + tree.width / 2;
	tree.trunk = new Phaser.Line(center, tree.y, center, game.height);
	trees.push(tree);

}

function throwSeed() {
	var throwStrength = 500;

	var seed = game.add.sprite(player.body.x, player.body.y, 'diamond');
	game.physics.arcade.enable(seed);
	seed.body.gravity.y = gravity;

	seed.body.velocity = new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY).subtract(player.body.position.x, player.body.position.y)
		.setMagnitude(throwStrength).add(player.body.velocity.x, player.body.velocity.y);
	seeds.push(seed);
}

function update() {
	// iterate backwards because we'll be removing elements
	for (var i = seeds.length - 1; i >= 0; --i) {
		if (game.physics.arcade.overlap(seeds[i], islandGroup)) {
			var seed = seeds[i];
			makeTree(seed.body.position.x - treeWidth / 2, heightAt(seed.body.position.x) - treeHeight);
			seed.destroy();
			seeds.splice(i, 1);
		}
	}

	// we need to collide first, and THEN give the velocity a kick away from the collision site
	if (game.physics.arcade.collide(player, islandGroup)) {
		player.body.drag.x = horizontalDrag;
	} else {
		player.body.drag.x = 0;
	}


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

	if (player.x > maxPlayerDistance) {
		for (var x = maxPlayerDistance; x < player.x; ++x) {
			if (Math.random() * bushInvChance < 1) {
				spawnBush(x);
			}
		}
		maxPlayerDistance = player.x;
	}
}

function spawnBush(x) {
	var bush = game.add.sprite(x, heightAt(x), 'bush');
	var variation = Math.floor(Math.random() * bushVariations);
	bush.frame = variation;

	var rotation = Math.floor(Math.random() * 4) * 90;
	bush.anchor.setTo(0.5, 0.5);
	bush.angle = rotation;
}

function grapple() {
	var lineStrength = 0.1;
	var airResistance = 0.005;

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
