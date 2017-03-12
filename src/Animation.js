/**
 * Animation control
 * @author Rex Zeng
 */

import G from './Global';
import {
    setPosition,
} from './Functions';

/**
 * Animation class
 * @class
 */
export default class Animation {
    /**
     * @constructor
     */
    constructor() {
        this.queue = {};
        this.initEasingFunctions();
    }
    /**
     * Init all easing functions
     */
    initEasingFunctions() {
        this.EASE_IN_EXPO = (l, r, x) => (l + (r - l) * Math.pow(2, (x - 1) * 7));
        // 0.14285714285714285 == (1 / log(2, 128))
        this.EASE_OUT_EXPO = (l, r, x) => (l + (r - l) * Math.log(x * 127 + 1) / Math.LN2 * 0.14285714285714285);
    }
    /**
     * Set a new animation
     * @param {PixiSprite} sprite - The sprite we want to animate
     * @param {number} start - Start point
     * @param {number} end - End point
     * @param {number} time - Time last (frame)
     * @param {function} func - Easing function
     * @param {boolean} loop - Whether the animation is looped
     */
    set(sprite, start, end, time, func, loop = false, callback = null) {
        sprite.animationProgress = 0;
        if (!sprite.animateQid) {
            sprite.animateQid = new Date().valueOf() + '-' + Math.random();
        }
        const item = { sprite, start, end, time, func, loop, callback, sceneName: G.scene.name };
        this.queue[sprite.animateQid] = item;
    }
    /**
     * Update all animations
     */
    update() {
        for (const id in this.queue) {
            const { sprite, start, end, time, func, loop, callback, sceneName } = this.queue[id];
            // GC start
            if (sceneName != G.scene.name) {
                delete this.queue[id];
                continue;
            }
            // increase progress
            sprite.animationProgress += 0.6 / time;
            // change attributes
            const keys = Object.keys(start);
            for (const i in keys) {
                if (end[keys[i]] != undefined) {
                    sprite[keys[i]] = func(start[keys[i]], end[keys[i]], sprite.animationProgress);
                }
            }
            // animation finished
            if (sprite.animationProgress >= 1) {
                if (loop) {
                    // replay
                    sprite.animationProgress = 0;
                } else {
                    // delete, set final position, run callback
                    delete this.queue[id];
                    setPosition(sprite, () => {
                        const x = (start.x != undefined) ? func(start.x, end.x, 1) : sprite.x;
                        const y = (start.y != undefined) ? func(start.y, end.y, 1) : sprite.y;
                        return { x, y };
                    });
                    if (callback) {
                        callback();
                    }
                }
            }
        }
    }
}
