var heights = [];

// deep magic here
function iterateTerrain(segments, iterations) {
	// how much outside the range of [left, right] we allow at each step.
	// allows slight hills and dips to occur
	var terrainDeviation = 0.1;

	for (var i = 0; i < iterations; ++i) {
		// increment by 2 each time, because we add another element each iteration
		// also, skip the last iteration, because otherwise j+1 is undefined
		for (var j = 0; j < segments.length - 1; j += 2) {
			var l = segments[j];
			var r = segments[j + 1];
			// math black magic: take a random percentage (0% to 100%) of the difference in height, and then add that on top of the initial height
			var mid = ((r - l) * randBetween(0 - terrainDeviation, 1 + terrainDeviation)) + l;
			// insert into the middle of the array
			segments.splice(j + 1, 0, mid);
		}
	}
}

function makeTerrain() {
	// array of segment heights
	var segments = [0, 0.6, -0.2, 1, 0.5, 0];
	
	// note that by having iterateTerrain as a function, we can do several passes. e.g., several separate islands
	iterateTerrain(segments, terrainIterations - 2);

	// put a few cliffs in
	for (var i = 1; i < segments.length - 2; ++i) {
		if (Math.random() * segments.length < 8) {
			segments[i] += Math.random() - 0.5;
		}
	}

	iterateTerrain(segments, 2);


	islandTiles = segments.length - 1;
	islandWidth = islandTiles * tileSize;

	var width = islandWidth / (segments.length - 1);

	segments = segments.map(function(elev) {
		var height = (1 - elev) * seaLevel;
		// round it to the step size of our tiles
		height = Math.round(height / stepSize) * stepSize;
		return height;
	});

	function calcSteps(i) {
		// do left - right because negative numbers are UP
		return (segments[i] - segments[i + 1]) / stepSize;
	}

	for (var i = 0; i < segments.length - 1; ++i) {
		var x = i * width;
		var left = segments[i];
		var right = segments[i + 1];
		
		var steps = calcSteps(i);
		var flip = false;
		if (steps < 0) {
			flip = true;
			steps = -steps;
		}
		if (steps > 4) {
			steps = 4;
		}

		var tileHeight = Math.min(left, right);

		if (steps == 0) {
			if (i > 0 && calcSteps(i - 1) < -4) {
				tileHeight -= stepSize;
				steps = 1;
				flip = true;
			} else if (calcSteps(i + 1) > 4) {
				tileHeight -= stepSize;
				steps = 1;
			}
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

		var tile = islandGroup.create(x + tileSize / 2, tileHeight + tileSize / 2, 'terrain');
		tile.anchor.setTo(0.5, 0.5);
		tile.body.immovable = true;
		tile.frame = frame;
		if (flip) {
			tile.scale.x = -1;
		}

		var heightObj = {};
		if (flip) {
			heightObj.left = tileHeight;
			heightObj.right = tileHeight + stepSize * steps;
		} else {
			heightObj.left = tileHeight + stepSize * steps;
			heightObj.right = tileHeight;
		}
		heights.push(heightObj);

		while (tileHeight < game.height) {
			tileHeight += tileSize;
			randVariation = Math.floor(Math.random() * terrainVariations);
			// don't need physics on these (hopefully), so don't add them in the islandGroup
			islandNoPhysGroup.create(x, tileHeight, 'terrain').frame = terrainFrames['full'][randVariation];
		}
	}

	heights.forEach(function(height, i) {
		var x = i * width;
		lines.push(new Phaser.Line(x, height.left, x + width, height.right));
	});
}

function heightAt(x) {
	// split x into tile (integer), and sub-tile position
	var temp = x / tileSize;
	var tile = Math.floor(temp);
	var subTile = temp - tile;

	tile = heights[tile];

	if (!tile) {
		return seaLevel;
	}

	var tileHeight = tile.left;
	var diff = tile.right - tileHeight;

	return tileHeight + diff * subTile;
}
