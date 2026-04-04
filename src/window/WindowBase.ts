// @ts-nocheck
/**
 * Timing window in editor
 * @author Rex Zeng
 */

import { Container } from 'pixi.js';

/**
 * Timing window class
 * @class
 */
export default class WindowBase {
    /**
     * @constructor
     */
    constructor() {
        this.stage = new Container();
        this.stage.id = this.constructor.name;
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
