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
        this.setupDebugShortcuts();
        window.Debug?.log('boot', 'Renderer initialized');
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

    setupDebugShortcuts() {
        window.addEventListener('keydown', (event) => {
            if (G.nativeInputFocused || !event.ctrlKey || !event.shiftKey) {
                return;
            }
            if (event.code === 'KeyD') {
                if (G.input.isRepeated(G.input.D)) {
                    return;
                }
                event.preventDefault();
                const visible = window.Debug?.toggleHud();
                window.Debug?.log('debug', `Debug HUD ${visible ? 'enabled' : 'disabled'}`);
            } else if (event.code === 'KeyJ') {
                if (G.input.isRepeated(G.input.J)) {
                    return;
                }
                event.preventDefault();
                const json = window.Debug?.openSnapshotWindow();
                if (json) {
                    window.Debug?.log('debug', 'Opened runtime snapshot window');
                }
            }
        });
    }
}

window.Debug = new Debug();

export default ParallelRails;
