/**
 * Super class for all scenes
 * @author Rex Zeng
 */

import G from '../Global';
import Resource from '../Resource';
import asyncTask from 'thenjs';

/**
 * Define base scene
 * @class
 */
export default class SceneBase {
    /**
     * @constructor
     */
    constructor() {
        G.switchingScene = true;
        // each scene has a stage
        this.stage = new PIXI.Container;
        this.stage.visible = false;
        G.stageContainer.addChild(this.stage);
        // set some variables
        this.isFadeIn = true;
        this.fadeInTime = 30;
        this.isFadeOut = true;
        this.fadeOutTime = 30;
        // do a series work
        asyncTask(next => this.onInitialize(next))
            .then(next => this.fadeIn(next))
            .then(next => this.startLoop(next))
            .then(next => this.fadeOut(next))
            .then(next => this.onTerminate(next));
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        next();
    }
    /**
     * Fade in from black screen
     * @param {function} next - Provided by then.js
     * @override
     */
    fadeIn(next) {
        if (!this.name) {
            console.error('This scene has no name! It will affect the GC process.');
        }
        if (!this.isFadeIn) {
            this.stage.visible = true;
            next();
            return;
        }
        let timer = this.fadeInTime;
        const shadow = new PIXI.Graphics;
        shadow.x = 0;
        shadow.y = 0;
        shadow.beginFill(0x000000);
        shadow.drawRect(0, 0, window.innerWidth, window.innerHeight);
        shadow.endFill();
        shadow.alpha = 1;
        this.stage.addChild(shadow);
        const fadeInLoop = () => {
            if (!G.switchingScene) {
                if (timer == 0) {
                    this.stage.removeChild(shadow);
                    next();
                    return;
                }
                this.stage.visible = true;
                timer--;
                shadow.alpha = timer / this.fadeInTime;
                if (G.windowResized) {
                    shadow.drawRect(0, 0, window.innerWidth, window.innerHeight);
                }
                G.renderer.render(G.stageContainer);
                G.windowResized = false;
            }
            requestAnimationFrame(fadeInLoop);
        };
        fadeInLoop();
    }
    /**
     * Mainloop for current scene
     * @param {function} next - Provided by then.js
     */
    startLoop(next) {
        const mainLoop = () => {
            // another mainloop is running, break this
            if (G.scene != this) {
                next();
                return;
            }
            Resource.load();
            this.update();
            G.renderer.render(G.stageContainer);
            G.windowResized = false;
            requestAnimationFrame(mainLoop);
        };
        mainLoop();
    }
    /**
     * Fade in from black screen
     * @param {function} next - Provided by then.js
     * @override
     */
    fadeOut(next) {
        if (!this.isFadeOut) {
            this.stage.visible = false;
            next();
            return;
        }
        let timer = 0;
        const shadow = new PIXI.Graphics;
        shadow.x = 0;
        shadow.y = 0;
        shadow.beginFill(0x000000);
        shadow.drawRect(0, 0, window.innerWidth, window.innerHeight);
        shadow.endFill();
        shadow.alpha = 0;
        this.stage.addChild(shadow);
        const fadeOutLoop = () => {
            if (timer == this.fadeOutTime) {
                this.stage.removeChild(shadow);
                this.stage.visible = false;
                G.switchingScene = false;
                G.stageContainer.removeChild(this.stage);
                next();
                return;
            }
            timer++;
            shadow.alpha = timer / this.fadeOutTime;
            if (G.windowResized) {
                shadow.drawRect(0, 0, window.innerWidth, window.innerHeight);
            }
            G.renderer.render(G.stageContainer);
            G.windowResized = false;
            requestAnimationFrame(fadeOutLoop);
        };
        fadeOutLoop();
    }
    /**
     * Trigger before the scene is terminated
     * @param {function} next - Provided by then.js
     * @override
     */
    onTerminate(next) {
        this.repaintListGC();
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {}
    /**
     * Garbage collect for window resize repaint list
     */
    repaintListGC() {
        for (const id in G.windowResizePaintList) {
            const item = G.windowResizePaintList[id];
            // remove items that is not belongs to current scene
            if (item.sceneName != G.scene.name) {
                delete G.windowResizePaintList[id];
                continue;
            }
        }
    }

}
