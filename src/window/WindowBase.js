/**
 * Timing window in editor
 * @author Rex Zeng
 */

import {
    setPosition,
} from '../Functions';

/**
 * Timing window class
 * @class
 */
export default class WindowBase {
    /**
     * @constructor
     */
    constructor() {
        this.stage = new PIXI.Container;
    }
    /**
     * Update window
     */
    update() {}
    /**
     * Dispose window
     */
    dispose() {}
}
