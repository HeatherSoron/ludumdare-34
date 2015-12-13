function makeTerrain() {
	var seaLevel = game.height - (game.height / 4);

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
			// compensate for the flip
			x += tileSize;
		}
		var frame = 4 - steps;
		var tile = islandGroup.create(x, Math.min(left, right), 'terrain');
		tile.body.immovable = true;
		tile.frame = frame;
		if (flip) {
			tile.scale.x = -1;
		}
	}
}
