/**
 * Super class for all scenes
 * @author Rex Zeng
 */

import G from '../Global';
import asyncTask from 'thenjs';

/**
 * Define base scene
 * @class
 */
export default class SceneBase {
    /**
     * @constructor
     */
    constructor() {
        asyncTask(next => this.onInitialize(next))
            .then(next => this.startLoop(next))
            .then(next => this.onTerminate(next));
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        next();
    }
    /**
     * Mainloop for current scene
     * @param {function} next - Provided by then.js
     * @override
     */
    startLoop(next) {
        const mainLoop = () => {
            // another mainloop is running, break this
            if (G.scene != this) {
                next();
                return;
            }
            this.update();
            G.renderer
            requestAnimationFrame(mainLoop);
        };
        mainLoop();
    }
    /**
     * Trigger before the scene is terminated
     * @param {function} next - Provided by then.js
     * @override
     */
    onTerminate(next) {
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {}
}
