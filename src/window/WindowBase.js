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
        this.stage.id = this.constructor.name + '_' + parseInt(Math.random() * 1e5);
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
