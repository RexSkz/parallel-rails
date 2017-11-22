/**
 * Timing window in editor
 * @author Rex Zeng
 */

/**
 * Timing window class
 * @class
 */
export default class WindowBase {
    /**
     * @constructor
     */
    constructor() {
        this.stage = new PIXI.Container();
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
