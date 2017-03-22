/**
 * Game Bootstrap file
 * @author Rex Zeng
 */

import G from './Global';
import {
    updateMusicList,
} from './Functions';
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
            console.error('Parameter el must be an html element'); // eslint-disable-line no-console
            return false;
        }
        // setup the renderer
        this.setupRender(opt.el);
        // load resources
        G.resource.addAudio(`se/metronome-2.mp3`);
        G.resource.addAudio(`se/metronome-1.mp3`);
        // load music list
        if (!G.musics) {
            updateMusicList();
        }
        // loading scene don't need resources to be loaded
        G.scene = new SceneLoading;
        G.lock.sceneSwitch = false;
    }
    /**
     * Setup the renderer
     * @param {HTMLElement} target - Setup the renderer
     */
    setupRender(target) {
        // make the renderer
        G.renderer = PIXI.autoDetectRenderer(0, 0, {
            antialias: false,
            transparent: false,
            resolution: window.devicePixelRatio,
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

module.exports = ParallelRails;
