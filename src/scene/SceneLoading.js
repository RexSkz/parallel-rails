/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
} from '../Functions';
import SceneBase from './SceneBase';
import SceneTitle from './SceneTitle';

/**
 * Define loading scene
 * @class
 */
export default class SceneLoading extends SceneBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.name = 'loading';
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        this.loadingTextSprite = new PIXI.Text(`Loading 0%`, {
            fontFamily: 'Courier New',
            fontSize: 32,
            fill: '#FFF',
        });
        setPosition(this.loadingTextSprite, () => ({
            x: 0.5 * window.innerWidth - this.loadingTextSprite.width / 2,
            y: 0.5 * window.innerHeight - this.loadingTextSprite.height / 2 - 24,
        }));
        this.stage.addChild(this.loadingTextSprite);
        this.urlTextSprite = new PIXI.Text(`[...]`, {
            fontFamily: 'Courier New',
            fontSize: 12,
            fill: '#FFF',
        });
        setPosition(this.urlTextSprite, () => ({
            x: 0.5 * window.innerWidth - this.urlTextSprite.width / 2,
            y: 0.5 * window.innerHeight - this.urlTextSprite.height / 2 + 10,
        }));
        this.stage.addChild(this.urlTextSprite);
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        this.updateLoaderText(G.loader.progress, G.loader.url);
        if (G.loader.finished) {
            G.scene = new SceneTitle;
        }
    }
    /**
     * Update loader text sprite
     * @param {string} url - Current loading url
     * @param {number} progress - Current loading progress
     */
    updateLoaderText(progress, url) {
        this.loadingTextSprite.text = `Loading ${progress}%`;
        this.loadingTextSprite.position.set(0.5 * window.innerWidth - this.loadingTextSprite.width / 2, 0.5 * window.innerHeight - this.loadingTextSprite.height / 2 - 24);
        this.urlTextSprite.text = `[${url}]`;
        this.urlTextSprite.position.set(0.5 * window.innerWidth - this.urlTextSprite.width / 2, 0.5 * window.innerHeight - this.urlTextSprite.height / 2 + 10);
    }
}
