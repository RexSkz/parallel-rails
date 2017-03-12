/**
 * Help calculate positions
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Set sprite position with percent data provided
 * @param {PixiSprite} sprite - The sprite we want to move
 * @param {function} func - Function with two numbers output
 * @param {boolean} forceUpdate - Whether force update the render function
 */
export function setPosition(sprite, func, forceUpdate = false) {
    if (sprite.queueId && !forceUpdate) {
        // avoid adding to queue again
        return;
    }
    // first adding or force update
    if (!sprite.queueId) {
        sprite.queueId = new Date().valueOf() + '-' + Math.random();
    }
    let painter = () => {
        const result = func();
        if (result.x) sprite.x = result.x;
        if (result.y) sprite.y = result.y;
        if (result.width) sprite.width = result.width;
        if (result.height) sprite.height = result.height;
    };
    painter.sprite = sprite;
    painter.sceneName = G.scene.name;
    G.windowResizePaintList[sprite.queueId] = painter;
    painter();
}

/**
 * Update music list
 */
export function updateMusicList() {
    fetch('api/musics.json').then(res => {
        if (res.ok) {
            res.json().then(data => {
                G.musics = data;
            });
        } else {
            console.error(`Get music info failed, code ${res.status}`);
        }
    });
}
