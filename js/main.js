var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });
var player;
var cursors;
var trees;
var islandGroup;
var anchor;

var tileSize = 32;
var stepSize = tileSize / 4;

var seaTiles = 10;

var terrainIterations = 6;
var islandTiles = Math.pow(2, terrainIterations + 1);

var islandWidth = islandTiles * tileSize;
var seaWidth = seaTiles * tileSize;

var lines = [];


function preload() {
	game.load.image('star', 'assets/star.png');
	game.load.image('diamond', 'assets/diamond.png');
	game.load.spritesheet('terrain', 'assets/terrain.png', tileSize, tileSize);
}

function create() {
	trees = [];

	game.world.setBounds(-seaWidth, 0, islandWidth + 2 * seaWidth, 600);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.stage.backgroundColor = 'rgb(0,0,255)';
	
	islandGroup = game.add.group();
	islandGroup.enableBody = true;

	makeTerrain();

	player = game.add.sprite(0, 0, 'star');
	makeTree(200, 200);
	makeTree(400, 200);

	game.physics.arcade.enable(player);
	player.body.gravity.y = 600;
	player.body.collideWorldBounds = true;

	cursors = game.input.keyboard.createCursorKeys();
	
	game.camera.follow(player);
}

function makeTree(x, y) {
	var tree = game.add.sprite(x, y, 'diamond');
	var center = tree.x + tree.width / 2;
	tree.trunk = new Phaser.Line(center, tree.y, center, game.height);
	trees.push(tree);

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
			trees.forEach(function(tree) {
				var p = ray.intersects(tree.trunk, true);
				if (p && (!anchor || p.distance(player.body.position) < anchor.distance(player.body.position))) {
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
