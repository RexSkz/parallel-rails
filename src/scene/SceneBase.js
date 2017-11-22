/**
 * Super class for all scenes
 * @author Rex Zeng
 */

import G from '../Global';
import { renderLoop } from '../Functions';

/**
 * Define base scene
 * @class
 */
export default class SceneBase {
    /**
     * @constructor
     */
    constructor(fadeInTime = G.constant.SCENE_SWITCH_TIME, fadeOutTime = G.constant.SCENE_SWITCH_TIME) {
        if (fadeInTime < 1) fadeInTime = 1;
        if (fadeOutTime < 1) fadeOutTime = 1;
        // for repaint sprite GC
        G.sceneName = this.constructor.name;
        // each scene has a stage
        this.stage = new PIXI.Container();
        this.stage.id = this.constructor.name;
        this.stage.alpha = 0;
        G.rootStage.addChild(this.stage);
        // set some variables
        this.fadeInTime = fadeInTime;
        this.fadeOutTime = fadeOutTime;
        this.loadingRemains = -1;
        this.resourceToLoad = {
            audio: [],
            graphics: []
        };
        setTimeout(() => this.work(), 0);
    }
    /**
     * A series of work
     */
    async work() {
        await this.waitLoading();
        this.onInitialize();
        await this.fadeIn();
        await this.mainLoop();
        await this.fadeOut();
        this.onTerminate();
        this.repaintListGC();
    }
    /**
     * Wait for resource loading finished
     */
    waitLoading() {
        return new Promise((resolve, reject) => {
            const loadingText = 'Loading resources...\nReceiving file...';
            G.rootStage.addChild(this.loadingBar = G.graphics.createText(loadingText, {}, (w, h, self) => ({
                x: 10,
                y: h - self.height - 10
            })));
            G.resource.load(this.resourceToLoad);
            renderLoop(() => {
                if (G.resource.remains <= 0) {
                    G.rootStage.removeChild(this.loadingBar);
                    resolve();
                    return false;
                }
                this.updateLoadingBar();
            });
        });
    }
    /**
     * Trigger when scene is initialized
     * @override
     */
    onInitialize() {}
    /**
     * Fade in from black screen
     */
    fadeIn() {
        return new Promise((resolve, reject) => {
            let timer = 0;
            renderLoop(() => {
                if (timer >= this.fadeInTime) {
                    resolve();
                    return false;
                }
                this.calcRepaintItems();
                if (!G.lock.sceneSwitch) {
                    this.stage.alpha = ++timer / this.fadeInTime;
                }
            });
        });
    }
    /**
     * Mainloop for current scene
     */
    mainLoop() {
        return new Promise((resolve, reject) => {
            renderLoop(() => {
                // switch to another scene
                if (G.scene !== this) {
                    G.lock.sceneSwitch = true;
                    resolve();
                    return false;
                }
                this.calcRepaintItems();
                this.update();
            });
        });
    }
    /**
     * Fade out to black screen
     */
    fadeOut() {
        return new Promise((resolve, reject) => {
            let timer = this.fadeOutTime;
            renderLoop(() => {
                if (timer <= 0) {
                    G.lock.sceneSwitch = false;
                    resolve();
                    return false;
                }
                this.calcRepaintItems();
                this.stage.alpha = --timer / this.fadeOutTime;
            });
        });
    }
    /**
     * Trigger before the scene is terminated
     * @override
     */
    onTerminate() {}
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {}
    /**
     * Recalculate items in repaint list
     */
    calcRepaintItems() {
        if (G.windowResized) {
            for (const id in G.repaintList) {
                const item = G.repaintList[id];
                // don't recalculate the invisible item
                if (!item.sprite.visible) {
                    continue;
                }
                item();
            }
            G.windowResized = false;
        }
    }
    /**
     * Garbage collect for window resize repaint list
     */
    repaintListGC() {
        for (const id in G.repaintList) {
            const item = G.repaintList[id];
            // remove items that is not belongs to current scene
            if (item.sceneName !== G.sceneName) {
                // G.repaintList[id].sprite.destroy();
                delete G.repaintList[id];
            }
        }
        G.rootStage.removeChild(this.stage);
        // this.stage.destroy();
    }
    /**
     * Set resource to load
     * @param {object} res - Contains `audio` and `graphics` array
     */
    loadResource(res) {
        if (res.audio) {
            this.resourceToLoad.audio = [
                ...this.resourceToLoad.audio,
                ...res.audio
            ];
        }
        if (res.graphics) {
            this.resourceToLoad.graphics = [
                ...this.resourceToLoad.graphics,
                ...res.graphics
            ];
        }
    }
    /**
     * Update resource loading bar text
     */
    updateLoadingBar() {
        if (this.loadingRemains !== G.resource.remains) {
            this.loadingBar.text = `${G.resource.remains} resource(s) to load...\nReceived file '${G.resource.currentLoad}'.`;
        }
    }
    /**
     * Add a window to current stage
     * @param {Window} wnd - Window variable
     */
    addWindow(wnd) {
        this.stage.addChild(wnd.stage);
    }
}
