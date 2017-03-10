/**
 * Game Bootstrap file
 * @author Rex Zeng
 */

import G from './Global';
import SceneTitle from './scene/SceneTitle';

/**
 * Game main class
 * @class
 */
class ParallelRails {
    /**
     * @constructor
     * @param {object} opt - Options
     */
    constructor(opt) {
        // check if parameter is valid
        if (!(opt.el && opt.el.nodeName)) {
            console.error('Parameter el must be an html element');
            return false;
        }
        // setup the renderer
        this.setupRender(opt.el);
        // load resources and then set scene
        // once scene is set, we enter the main loop
        // PIXI.loader.add(G.DataResources).load(() => {
        //     G.scene = G.SceneTitle;
        // });
        G.scene = new SceneTitle;
        return this;
    }
    /**
     * Setup the renderer
     * @param {HTMLElement} target - Setup the renderer
     */
    setupRender(target) {
        // make the renderer
        G.renderer = PIXI.autoDetectRenderer(0, 0, {
            antialias: true,
            transparent: false,
            resolution: 1,
        });
        // set renderer to fullscreen
        G.renderer.view.style.position = 'absolute';
        G.renderer.view.style.top = 0;
        G.renderer.view.style.left = 0;
        G.renderer.view.style.right = 0;
        G.renderer.view.style.bottom = 0;
        G.renderer.autoResize = true;
        G.renderer.resize(window.innerWidth, window.innerHeight);
        // append the canvas of renverer's view to page
        target.appendChild(G.renderer.view);
    }
}

module.exports = ParallelRails;
