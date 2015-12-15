var game = new Phaser.Game(1200, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });
var player;
var cursors;
var trees;
var seeds = [];
var vineballs = [];
var anchor;

var vineballCount = 66;

var maxSeedCount = 4;

var tileSize = 32;
var stepSize = tileSize / 4;

var seaTiles = 10;

// how many tiles away from the eastern sea counts as a "win"
var winMargin = tileSize * 20;
var statsShown = false;

var terrainIterations = 6;
var islandTiles;

var islandWidth;
var seaWidth = seaTiles * tileSize;

var seaLevel = game.height - (game.height / 4);

// WAY higher than I expect anyone to reach. But, we'll give them a challenge!
var worldHeight = 4800;

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

var treeVariations = 15;

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

var stats;

var landedDist;

var treePeakHeights = [479, 489, 322, 539, 443, 480, 162, 410, 484, 481, 176, 0, 0, 0, 0];
// we don't want two zero-height trees in a row
var lastTreeHeight = 0;


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
	game.load.spritesheet('tree12', 'assets/tree12.png', treeWidth, 544);
	game.load.spritesheet('tree13', 'assets/tree13.png', treeWidth, 544);
	game.load.spritesheet('tree14', 'assets/tree14.png', treeWidth, 544);
	game.load.spritesheet('tree15', 'assets/tree15.png', treeWidth, 544);
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

	game.add.sprite(0, 0, myBitmap).fixedToCamera = true;
}

function addSea() {
	var myBitmap = game.add.bitmapData(islandWidth + 2 * seaWidth, game.height - (seaLevel + 10));

	var grd=myBitmap.context.createLinearGradient(0, 0, 0, game.height - (seaLevel + 10));
	grd.addColorStop(0, "rgba(255, 255, 255, 0)");
	grd.addColorStop(0.02, "rgba(255, 255, 255, 1)");
	grd.addColorStop(0.1, "rgba(0, 80, 200, 0.5)");
	grd.addColorStop(1, "rgba(0, 0, 50, 0.8)");
	myBitmap.context.fillStyle=grd;
	myBitmap.context.fillRect(0, 0, islandWidth + 2 * seaWidth, game.height - (seaLevel + 10));

	game.add.sprite(-seaWidth, seaLevel + 10, myBitmap);
}

function create() {
	trees = [];

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

	game.world.setBounds(-seaWidth, game.height - worldHeight, islandWidth + 2 * seaWidth, worldHeight);

	player = playerGroup.create(0, seaLevel - 200, 'player');
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

	addSea();

	stats = new Stats();
}

function makeTree(x, y) {
	do {
		var variation = Math.floor(Math.random() * treeVariations) + 1;
		var peakHeight = treePeakHeights[variation - 1];
	} while (lastTreeHeight == 0 && peakHeight == 0);
	var tree = treeGroup.create(x, y, 'tree' + variation);
	tree.animations.add('grow', [0, 1, 2, 3, 4, 5, 6, 7], 4, false);
	tree.animations.play('grow');
	var canopy = tree.height - peakHeight;
	var center = tree.x + tree.width / 2;
	tree.trunk = new Phaser.Line(center, tree.y + canopy, center, tree.y + tree.height); /////////////
	trees.push(tree);

	lastTreeHeight = peakHeight;

	stats.update('treeCount', 1);

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

	seed.anchor.setTo(0.5, 0.5);

	seed.body.velocity = new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY).subtract(player.body.position.x, player.body.position.y)
		.setMagnitude(throwStrength).add(player.body.velocity.x, player.body.velocity.y);
	seeds.push(seed);
}

function update() {
	// iterate backwards because we'll be removing elements
	for (var i = seeds.length - 1; i >= 0; --i) {
		var seed = seeds[i];
		if (game.physics.arcade.overlap(seeds[i], islandGroup)) {
			makeTree(seed.body.position.x - treeWidth / 2, heightAt(seed.body.position.x) - treeHeight);
			seed.destroy();
			seeds.splice(i, 1);
		} else if (seeds[i].position.y > game.height) {
			seed.destroy();
			seeds.splice(i, 1);
		} else {
			seed.angle += 90;	
		}
	}

	// we need to collide first, and THEN give the velocity a kick away from the collision site
	if (game.physics.arcade.collide(player, islandGroup)) {
		player.body.drag.x = horizontalDrag;
		if (!anchor) {
			player.animations.stop();
		}
		landedDist = player.body.position.x;
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
		if (!statsShown && maxPlayerDistance > islandWidth - winMargin) {
			stats.show();
			statsShown = true;
		}
	}

	if (player.body.velocity.x < -1) {
		player.scale.x = 1;
	} else if (player.body.velocity.x > 1) {
		player.scale.x = -1;
	}

	stats.update('maxSpeed', Math.round(player.body.velocity.getMagnitude()));
	stats.update('maxHeight', Math.round(game.height - player.body.position.y));

	stats.update('maxAirDistance', Math.round(Math.abs(player.body.position.x - landedDist)));
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
	//trees.forEach(function(tree) { game.debug.geom(tree.trunk); });
}
