import { Container } from 'pixi.js';
import G from '../Global';
import { renderLoop } from '../Functions';
import type { RepaintRenderer, SceneDebugSnapshot } from '../types';

export default class SceneBase {
    stage: Container;
    fadeInTime: number;
    fadeOutTime: number;
    loadingRemains: number;
    resourceToLoad: { audio: string[]; graphics: string[] };
    loadingBar!: ReturnType<typeof G.graphics.createText>;

    constructor(fadeInTime = G.constant.SCENE_SWITCH_TIME, fadeOutTime = G.constant.SCENE_SWITCH_TIME) {
        if (fadeInTime < 1) fadeInTime = 1;
        if (fadeOutTime < 1) fadeOutTime = 1;
        G.sceneName = this.constructor.name;
        this.stage = new Container();
        this.stage.label = this.constructor.name;
        this.stage.alpha = 0;
        G.rootStage.addChild(this.stage);
        this.fadeInTime = fadeInTime;
        this.fadeOutTime = fadeOutTime;
        this.loadingRemains = -1;
        this.resourceToLoad = {
            audio: [],
            graphics: []
        };
        window.Debug?.log('scene', 'Constructed scene', { scene: this.constructor.name });
        setTimeout(() => this.work(), 0);
    }

    async work() {
        await this.waitLoading();
        this.onInitialize();
        await this.fadeIn();
        await this.mainLoop();
        await this.fadeOut();
        this.onTerminate();
        this.repaintListGC();
    }

    waitLoading() {
        return new Promise<void>((resolve) => {
            const loadingText = 'Loading resources...\nReceiving file...';
            G.rootStage.addChild(this.loadingBar = G.graphics.createText(loadingText, {}, (w: number, h: number, self: any) => ({
                x: 10,
                y: h - self.height - 10
            })));
            G.resource.load(this.resourceToLoad);
            window.Debug?.log('resource', 'Started scene resource load', {
                scene: this.constructor.name,
                audio: this.resourceToLoad.audio.length,
                graphics: this.resourceToLoad.graphics.length
            });
            renderLoop(() => {
                if (G.resource.remains <= 0) {
                    G.rootStage.removeChild(this.loadingBar);
                    window.Debug?.log('resource', 'Finished scene resource load', { scene: this.constructor.name });
                    resolve();
                    return false;
                }
                this.updateLoadingBar();
            });
        });
    }

    onInitialize() {}

    fadeIn() {
        return new Promise<void>((resolve) => {
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

    mainLoop() {
        return new Promise<void>((resolve) => {
            renderLoop(() => {
                if (G.scene !== this) {
                    G.lock.sceneSwitch = true;
                    window.Debug?.log('scene', 'Leaving scene loop', {
                        from: this.constructor.name,
                        to: G.scene?.constructor?.name || 'UnknownScene'
                    });
                    resolve();
                    return false;
                }
                this.calcRepaintItems();
                this.update();
            });
        });
    }

    fadeOut() {
        return new Promise<void>((resolve) => {
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

    onTerminate() {}

    update() {}

    debugSnapshot(): SceneDebugSnapshot {
        return {
            scene: this.constructor.name,
            summary: this.debugSummary(),
            stage: {
                alpha: Number(this.stage.alpha.toFixed(3)),
                visible: this.stage.visible,
                childCount: this.stage.children.length
            },
            resources: {
                audio: this.resourceToLoad.audio.length,
                graphics: this.resourceToLoad.graphics.length,
                loadingRemains: this.loadingRemains
            }
        };
    }

    protected debugSummary(): string[] {
        return [
            `stageChildren=${this.stage.children.length}`,
            `stageAlpha=${Number(this.stage.alpha.toFixed(3))}`,
            `resourceAudio=${this.resourceToLoad.audio.length}`,
            `resourceGraphics=${this.resourceToLoad.graphics.length}`
        ];
    }

    calcRepaintItems() {
        if (G.windowResized) {
            for (const id in G.repaintList) {
                const item = G.repaintList[id];
                if (!item.sprite.visible) {
                    continue;
                }
                (item as RepaintRenderer)();
            }
            G.windowResized = false;
        }
    }

    repaintListGC() {
        for (const id in G.repaintList) {
            const item = G.repaintList[id];
            if (item.sceneName !== G.sceneName) {
                delete G.repaintList[id];
            }
        }
        G.rootStage.removeChild(this.stage);
    }

    loadResource(res: { audio?: string[]; graphics?: string[] }) {
        if (res.audio) {
            this.resourceToLoad.audio = [...this.resourceToLoad.audio, ...res.audio];
        }
        if (res.graphics) {
            this.resourceToLoad.graphics = [...this.resourceToLoad.graphics, ...res.graphics];
        }
    }

    updateLoadingBar() {
        if (this.loadingRemains !== G.resource.remains) {
            this.loadingBar.text = `${G.resource.remains} resource(s) to load...\nReceived file '${G.resource.currentLoad}'.`;
        }
    }

    addWindow(wnd: { stage: Container }) {
        this.stage.addChild(wnd.stage);
    }
}
