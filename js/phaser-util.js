// it would be NICE to have these in the core Phaser lib... maybe I can submit a pull request.

function getMouseWorldPos() {
	return getPointerWorldPos(game.input.activePointer);
}

function getPointerWorldPos(pointer) {
	return new Phaser.Point(pointer.worldX, pointer.worldY);
}
