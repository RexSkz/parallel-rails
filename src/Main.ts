/**
 * Game Bootstrap file
 * @author Rex Zeng
 */

import { autoDetectRenderer } from 'pixi.js';
import G from './Global';
import SceneTitle from './scene/SceneTitle';

import Debug from './Debug';

class ParallelRails {
    constructor(opt: { el: HTMLElement }) {
        // check if parameter is valid
        if (!(opt && opt.el && opt.el.nodeName)) {
            console.error('Parameter el must be an html element'); // eslint-disable-line no-console
            return;
        }
        void this.init(opt.el);
    }

    async init(target: HTMLElement) {
        await this.setupRender(target);
        try {
            G.scene = new SceneTitle();
        } catch (e) {
            console.error(e); // eslint-disable-line no-console
            alert('Script error, open console to get more info.');
        }
    }

    async setupRender(target: HTMLElement) {
        G.renderer = await autoDetectRenderer({
            width: window.innerWidth,
            height: window.innerHeight,
            antialias: false,
            backgroundAlpha: 0,
            resolution: window.devicePixelRatio || 1
        });
        const canvas = G.renderer.canvas;
        // set renderer to fullscreen
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.right = '0';
        canvas.style.bottom = '0';
        G.renderer.resize(window.innerWidth, window.innerHeight);
        window.addEventListener('resize', () => {
            G.windowResized = true;
            G.renderer.resize(window.innerWidth, window.innerHeight);
        });
        // append the canvas of renverer's view to page
        target.appendChild(canvas);
    }
}

window.Debug = new Debug();

export default ParallelRails;
