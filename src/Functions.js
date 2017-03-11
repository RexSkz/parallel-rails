/**
 * Help calculate positions
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Set sprite position with percent data provided
 * @param {PixiSprite} sprite - The sprite we want to move
 * @param {function} func - Function with two numbers output
 */
export function setPosition(sprite, func) {
    let painter = () => {
        const result = func();
        sprite.position.set(result.x, result.y);
    };
    painter.sprite = sprite;
    painter.sceneName = G.scene.name;
    const id = new Date().valueOf() + '-' + Math.random();
    G.windowResizePaintList[id] = painter;
    painter();
}
