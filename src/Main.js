/**
 * Game Bootstrap file
 * @author Rex Zeng
 */

import G from './Global';
import SceneTitle from './scene/SceneTitle';

import Debug from './Debug';

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
        if (!(opt && opt.el && opt.el.nodeName)) {
            console.error('Parameter el must be an html element'); // eslint-disable-line no-console
            return false;
        }
        // setup the renderer
        this.setupRender(opt.el);
        // load the real game scene
        try {
            G.scene = new SceneTitle();
        } catch (e) {
            alert('Script error, open console to get more info.');
        }
    }
    /**
     * Setup the renderer
     * @param {HTMLElement} target - Setup the renderer
     */
    setupRender(target) {
        // make the renderer
        G.renderer = PIXI.autoDetectRenderer(0, 0, {
            antialias: false,
            transparent: true,
            resolution: window.devicePixelRatio || 1
        });
        // set renderer to fullscreen
        G.renderer.view.style.position = 'absolute';
        G.renderer.view.style.top = 0;
        G.renderer.view.style.left = 0;
        G.renderer.view.style.right = 0;
        G.renderer.view.style.bottom = 0;
        G.renderer.autoResize = true;
        G.renderer.resize(window.innerWidth, window.innerHeight);
        window.addEventListener('resize', () => {
            G.windowResized = true;
            G.renderer.resize(window.innerWidth, window.innerHeight);
        });
        // append the canvas of renverer's view to page
        target.appendChild(G.renderer.view);
    }
}

window.Debug = new Debug();

module.exports = ParallelRails;
