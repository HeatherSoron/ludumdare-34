var game = new Phaser.Game(1200, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });
var player;
var cursors;
var trees;
var seeds = [];
var vineballs = [];
var anchor;

var vineballCount = 6;

var maxSeedCount = 4;

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

var treeVariations = 11;

var maxPlayerDistance = 0;
// 1 in n chance for a bush
var bushInvChance = 24;
var bushVariations = 24;

// the height is how tall we treat it as in-game, NOT how tall the sprite is
var treeHeight = 530;
// width is the same as sprite width, though
var treeWidth = 72;

var music;
var seedSound;

var treeGroup;
var islandGroup;
var islandNoPhysGroup;
var bushGroup;
var vineballGroup;
var playerGroup;

var treePeakHeights = [479, 489, 322, 539, 443, 480, 162, 410, 484, 481, 176];

function preload() {
	game.load.image('seed', 'assets/seed.png');
	game.load.image('vineball', 'assets/vineball.png');
	game.load.spritesheet('player', 'assets/player.png', 64, 64);
	game.load.spritesheet('tree1', 'assets/tree.png', treeWidth, 544);
	game.load.spritesheet('tree2', 'assets/tree2.png', treeWidth, 544);
	game.load.spritesheet('tree3', 'assets/tree3.png', treeWidth, 544);
	game.load.spritesheet('tree4', 'assets/tree4.png', treeWidth, 544);
	game.load.spritesheet('tree5', 'assets/tree5.png', treeWidth, 544);
	game.load.spritesheet('tree6', 'assets/tree6.png', treeWidth, 544);
	game.load.spritesheet('tree7', 'assets/tree7.png', treeWidth, 544);
	game.load.spritesheet('tree8', 'assets/tree8.png', treeWidth, 544);
	game.load.spritesheet('tree9', 'assets/tree9.png', treeWidth, 544);
	game.load.spritesheet('tree10', 'assets/tree10.png', treeWidth, 544);
	game.load.spritesheet('tree11', 'assets/tree11.png', treeWidth, 544);
	game.load.spritesheet('bush', 'assets/bush.png', 32, 32);
	game.load.spritesheet('terrain', 'assets/terrain.png', tileSize, tileSize);

	// invisible sprite just so we can get collision working
	game.load.image('collider', 'assets/physics_collider.png');

	game.load.audio('seed', ['assets/audio/seed.mp3', 'assets/audio/seed.ogg']);
	game.load.audio('bgm', ['assets/audio/bgm.mp3', 'assets/audio/bgm.ogg']);
}

function addSky() {
	var myBitmap = game.add.bitmapData(game.width, game.height);

	var grd=myBitmap.context.createLinearGradient(0, 0, 0, game.height);
	grd.addColorStop(0, "#def");
	grd.addColorStop(1, "#0a68b0");
	myBitmap.context.fillStyle=grd;
	myBitmap.context.fillRect(0, 0, game.width, game.height);

	myBitmap.context.fillStyle=grd;
	myBitmap.context.fillRect(0,580,800,20);

	game.add.sprite(0, 0, myBitmap).fixedToCamera = true;
}

function create() {
	trees = [];

	game.world.setBounds(-seaWidth, game.height - worldHeight, islandWidth + 2 * seaWidth, worldHeight);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	addSky();

	treeGroup = game.add.group();

	islandGroup = game.add.group();
	islandGroup.enableBody = true;

	islandNoPhysGroup = game.add.group();
	bushGroup = game.add.group();

	vineballGroup = game.add.group();

	playerGroup = game.add.group();

	makeTerrain();

	player = playerGroup.create(0, 0, 'player');
	player.anchor.setTo(0.5, 0.5);
	player.scale.x = -1;
	player.animations.add('spin', [0,1,2,3,4,5,6,7], 10, true);

	for (var i = 0; i < vineballCount; ++i) {
		var vb = vineballGroup.create(0,0,'vineball');
		vb.anchor.setTo(0.5, 0.5);
		vb.visible = false;
		vineballs.push(vb);
	}

	game.physics.arcade.enable(player);
	player.body.gravity.y = gravity;
	player.body.collideWorldBounds = true;

	cursors = game.input.keyboard.createCursorKeys();
	
	game.input.keyboard.onDownCallback = throwSeed;
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

	music = game.add.audio('bgm');
	music.loop = true;
	music.play();

	seedSound = game.add.audio('seed');
}

function makeTree(x, y) {
	var variation = Math.floor(Math.random() * treeVariations) + 1;
	var tree = treeGroup.create(x, y, 'tree' + variation);
	tree.animations.add('grow', [0, 1, 2, 3, 4, 5, 6], 4, false);
	tree.animations.play('grow');
	var center = tree.x + tree.width / 2;
	tree.trunk = new Phaser.Line(center, tree.y, center, (tree.y - treePeakHeights[variation-1])); /////////////
	game.debug.geom(tree.trunk);
	trees.push(tree);

}

function throwSeed() {
	if (seeds.length >= maxSeedCount) {
		return;
	}

	if (!seedSound.isPlaying) {
		seedSound.play();
	}

	var throwStrength;
	// apply only the barest throw strength if the player is not grounde
	// apply no throw strength if the player is grappling, a small amount if moving (horiz) but not grappling, and a full amount if horizontally stationary
	if (anchor) {
		throwStrength = 0;
	} else if (player.body.velocity.x != 0) {
		throwStrength = 200;
	} else {
		throwStrength = 500;
	}

	// seeds are drawn at the player's z-depth
	var seed = playerGroup.create(player.body.x, player.body.y, 'seed');
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
		} else if (seeds[i].position.y > game.height) {
			var seed = seeds[i];
			seed.destroy();
			seeds.splice(i, 1);
		}
	}

	// we need to collide first, and THEN give the velocity a kick away from the collision site
	if (game.physics.arcade.collide(player, islandGroup)) {
		player.body.drag.x = horizontalDrag;
		if (!anchor) {
			player.animations.stop();
		}
	} else {
		player.body.drag.x = 0;
	}


	if (game.input.activePointer.leftButton.isDown) {
		// check whether we've already got an anchor point
		if (anchor) {
			grapple();
		} else {
			var ray = new Phaser.Line(player.body.position.x, player.body.position.y, game.input.activePointer.worldX, game.input.activePointer.worldY);
			trees.forEach(function(tree) {
				var p = ray.intersects(tree.trunk, true); //returns intercept point
				if (p && (!anchor || p.distance(getMouseWorldPos()) < anchor.distance(getMouseWorldPos()))) {
					anchor = p;
				}
			});
			if (anchor) {
				grapple();
				player.animations.play('spin');
				vineballs.forEach(function(vb) {
					vb.visible = true;
				});
			}
		}
	} else {
		anchor = null;
		vineballs.forEach(function(vb) {
			vb.visible = false;
		});
	}

	if (player.x > maxPlayerDistance) {
		for (var x = maxPlayerDistance; x < player.x; ++x) {
			if (Math.random() * bushInvChance < 1) {
				spawnBush(x);
			}
		}
		maxPlayerDistance = player.x;
	}

	if (player.body.velocity.x < -1) {
		player.scale.x = 1;
	} else if (player.body.velocity.x > 1) {
		player.scale.x = -1;
	}
}

function spawnBush(x) {
	var height = heightAt(x);
	if (height === undefined) {
		return;
	}
	var bush = bushGroup.create(x, height + 10, 'bush');
	var variation = Math.floor(Math.random() * bushVariations);
	bush.frame = variation;

	var rotation = Math.floor(Math.random() * 4) * 90;
	bush.anchor.setTo(0.5, 0.5);
	bush.angle = rotation;

	var size = 2;
	bush.scale.x = size;
	bush.scale.y = size;
}

function grapple() {
	var lineStrength = 0.1;
	var airResistance = 0.005;

	// why does Phaser use negative width for flipped sprites? NO idea.
	var playerWidth = Math.abs(player.width);
	var offset = anchor.clone().subtract(player.body.position.x + playerWidth / 2, player.body.position.y + player.height / 2);
	var diff = offset.clone();
	offset.multiply(lineStrength, lineStrength);
	player.body.velocity.add(offset.x, offset.y);
	player.body.velocity.multiply(1 - airResistance, 1 - airResistance);

	var multPerBall = 1 / vineballs.length;
	vineballs.forEach(function(vb, i) {
		vb.position = diff.clone().multiply((i + 1) * multPerBall, (i + 1) * multPerBall).add(player.body.position.x + playerWidth / 2, player.body.position.y + player.height / 2); 
	});
}

function render() {
}
