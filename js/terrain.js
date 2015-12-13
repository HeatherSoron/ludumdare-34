var heights = [];

function makeTerrain() {
	// array of segment heights
	var segments = [0, 0.6, 0, 0.6, 0];

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

	islandTiles = segments.length - 1;
	islandWidth = islandTiles * tileSize;

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
			flip = true;
			steps = -steps;
		}
	
		var frameName;
		switch (steps) {
			case 0:
				frameName = 'full';
				break;
			case 1:
			case 2:
			case 3:
			case 4:
				frameName = 'slope' + steps;
				break;
		}
		var randVariation = Math.floor(Math.random() * terrainVariations);
		var frame = terrainFrames[frameName][randVariation];

		var tileHeight = Math.min(left, right);
		var tile = islandGroup.create(x + tileSize / 2, tileHeight + tileSize / 2, 'terrain');
		tile.anchor.setTo(0.5, 0.5);
		tile.body.immovable = true;
		tile.frame = frame;
		if (flip) {
			tile.scale.x = -1;
		}

		heights.push(left);

		while (tileHeight < game.height) {
			tileHeight += tileSize;
			randVariation = Math.floor(Math.random() * terrainVariations);
			// don't need physics on these (hopefully), so don't add them in the islandGroup
			game.add.sprite(x, tileHeight, 'terrain').frame = terrainFrames['full'][randVariation];
		}
	}
	// need to push ONE more entry onto heights, for the end. Luckily, it's the same height as the start.
	heights.push(segments[0]);
}

function heightAt(x) {
	// split x into tile (integer), and sub-tile position
	var temp = x / tileSize;
	var tile = Math.floor(temp);
	var subTile = temp - tile;

	var tileHeight = heights[tile];
	var diff = heights[tile + 1] - tileHeight;

	return tileHeight + diff * subTile;
}
