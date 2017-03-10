/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
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
        console.log('loading');
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        this.message = new PIXI.Text(`Loading 0%\nFile: [...]`, {
            fontFamily: "Arial",
            fontSize: 32,
            fill: '#FFF',
        });
        this.message.position.set(54, 96);
        this.stage.addChild(this.message);
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
        this.message.text = `Loading ${progress}%\nFile: [${url}]`;
    }
}
