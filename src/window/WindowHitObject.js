/**
 * Hit object window in editor
 * @author Rex Zeng
 */

// import G from '../Global';
// import {
//     setPosition,
// } from '../Functions';
import WindowBase from './WindowBase';

// const {
//     MAIN_FONT,
//     MAIN_FONT_SIZE,
// } = G.constant;

/**
 * Window that shows hit objects at middle
 * @class
 */
export default class WindowHitObject extends WindowBase {
    /**
     * @constructor
     * @param {string} mode - Define it's in 'gaming' mode or 'editor' mode
     */
    constructor(mode) {
        super();
        this.mode = mode;
    }
    /**
     * Draw parallel rails
     */
    drawParallelRails() {
        // 
    }
}
