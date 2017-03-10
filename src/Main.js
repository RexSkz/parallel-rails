/**
 * Game Bootstrap file
 * @author Rex Zeng
 */

import G from './Global';
import SceneLoading from './scene/SceneLoading';

// define graphics path for further use
const GRAPHICS_PATH = 'graphics/sprites.json';

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
        // load resources
        PIXI.loader
            .add(GRAPHICS_PATH)
            .on('progress', this.updateLoaderData)
            .on('error', this.setLoaderErrorMsg)
            .load(this.setLoaderFinished);
        // loading scene don't need resources to be loaded
        G.scene = new SceneLoading;
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
    /**
     * Update loader data
     * @param {object} progress - Current loading progress
     * @param {object} url - Current loading url
     */
    updateLoaderData(progress, url) {
        G.loader.progress = progress.progress;
        G.loader.url = url.url || '';
    }
    /**
     * Set loader finished
     */
    setLoaderFinished() {
        G.loader.finished = true;
        G.cache = PIXI.loader.resources[GRAPHICS_PATH].textures;
    }
}

module.exports = ParallelRails;
