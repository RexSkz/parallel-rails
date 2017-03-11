/**
 * Help calculate positions
 * @author Rex Zeng
 */

/**
 * Set sprite position with percent data provided
 * @param {PIXISprite} sprite - The object we want to move
 * @param {number} x - The x position (percent form)
 * @param {number} y - The y position (percent form)
 */
function moveTo(sprite, x, y) {
    const absoluteX = window.innerWidth * x - sprite.width / 2;
    const absoluteY = window.innerHeight * y - sprite.height / 2;
    sprite.position.set(absoluteX, absoluteY);
}

export default {
    moveTo,
}
