/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import Position from '../Position';
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
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        this.messageSprite = new PIXI.Text(`Loading 0%`, {
            fontFamily: 'Courier New',
            fontSize: 32,
            fill: '#FFF',
        });
        this.messageSprite.position.set(0.5 * window.innerWidth - this.messageSprite.width / 2, 0.5 * window.innerHeight - this.messageSprite.height / 2);
        this.stage.addChild(this.messageSprite);
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
        this.messageSprite.text = `Loading ${progress}%`;
        if (G.windowResized) {
            this.messageSprite.position.set(0.5 * window.innerWidth - this.messageSprite.width / 2, 0.5 * window.innerHeight - this.messageSprite.height / 2);
        }
    }
}
