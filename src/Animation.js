/**
 * Animation control
 * @author Rex Zeng
 */

import G from './Global';

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
        this.LINEAR = (l, r, x) => l + (r - l) * x;
        this.EASE_IN_QUAD = (l, r, x) => l + (r - l) * Math.pow(x, 2);
        this.EASE_OUT_QUAD = (l, r, x) => l + (r - l) * Math.pow(x, 1 / 2);
        this.EASE_IN_CUBIC = (l, r, x) => l + (r - l) * Math.pow(x, 3);
        this.EASE_OUT_CUBIC = (l, r, x) => l + (r - l) * Math.pow(x, 1 / 3);
        this.EASE_IN_EXPO = (l, r, x) => l + (r - l) * Math.pow(2, (x - 1) * 7);
        this.EASE_OUT_EXPO = (l, r, x) => l + (r - l) * Math.log(x * 127 + 1) / Math.LN2 / 7;
    }
    /**
     * Set a new animation
     * @param {Sprite} sprite - The sprite we want to animate
     * @param {function or object} end - End point
     * @param {number} totalFrames - Time last in frame unit
     * @param {function} func - Easing function
     * @param {boolean} loop - Whether the animation is looped
     * @param {function} callback - Executes when animation is over (disabled if loop)
     */
    set(sprite, end, totalFrames, func = this.EASE_OUT_EXPO, loop = false, callback = null) {
        if (this.queue[sprite.id]) {
            delete this.queue[sprite.id];
        }
        let start = {};
        let result = {};
        if (typeof end === 'function') {
            result = end(window.innerWidth, window.innerHeight, sprite);
        } else if (typeof end === 'object') {
            result = end;
        } else {
            console.error('Param `end` must be a function or object!');
        }
        for (const key in result) {
            if (!sprite[key]) {
                console.warn(`Sprite has no key: '${key}'!`, sprite);
            }
            start[key] = sprite[key];
        }
        const item = {
            sprite,
            start,
            end,
            totalFrames,
            currentFrames: 0,
            func,
            loop,
            callback,
            sceneName: G.sceneName
        };
        this.queue[sprite.id] = item;
    }
    /**
     * Update all animations
     */
    update() {
        for (const item of Object.values(this.queue)) {
            // GC start
            if (item.sceneName !== G.sceneName) {
                delete this.queue[item.sprite.id];
                continue;
            }
            // increase progress
            ++item.currentFrames;
            // change attributes
            let result = {};
            if (typeof item.end === 'function') {
                result = item.end(window.innerWidth, window.innerHeight, item.sprite);
            } else if (typeof item.end === 'object') {
                result = item.end;
            }
            for (const key in result) {
                if (key === 'transformScale') {
                    const scale = item.func(item.start[key], result[key], item.currentFrames / item.totalFrames);
                    item.sprite.scale.set(scale, scale);
                } else {
                    item.sprite[key] = item.func(item.start[key], result[key], item.currentFrames / item.totalFrames);
                }
            }
            // animation finished
            if (item.currentFrames >= item.totalFrames) {
                if (item.loop) {
                    item.currentFrames = 0;
                } else {
                    // delete, set final position, run callback
                    delete this.queue[item.sprite.id];
                    G.graphics.setPosition(item.sprite, item.end);
                    if (typeof item.callback === 'function') {
                        item.callback();
                    }
                }
            }
        }
    }
}
