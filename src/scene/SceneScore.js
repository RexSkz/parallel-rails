/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';

/**
 * Define playing score scene
 * @class
 */
export default class SceneScore extends SceneBase {
    /**
     * Constructor
     * @constructor
     * @param {string} bgUrl - URL of current playing song
     * @param {array} scorePoints - Show score for each time
     * @param {array} hitResults - Show hit results for each time
     * @param {number} score - Total score gains
     * @param {number} combo - Max combo
     */
    constructor(bgUrl, scorePoints, hitResults, score, combo) {
        super();
        this.bgUrl = bgUrl;
        this.scorePoints = scorePoints;
        this.hitResults = hitResults;
        this.score = score;
        this.combo = combo;
        console.log(this.scorePoints);
        console.log(this.hitResults);
        console.log(this.score);
        console.log(this.combo);
    }
    /**
     * Trigger when scene is initialized
     * @override
     */
    async onInitialize() {
        // background
        this.stage.addChild(G.graphics.createImage(this.bgUrl, (w, h, self) => ({
            position: 'center',
            size: 'cover'
        })));
        // darken shadow
        this.stage.addChild(G.graphics.createRect({
            top: 0,
            left: 0,
            width: 9999,
            height: 9999,
            background: 0x000000,
            opacity: 0.5
        }));
        // rect
        this.stage.addChild(G.graphics.createRect({
            top: window.innerHeight * 0.5 - 250,
            left: window.innerWidth * 0.5 - 350,
            width: 700,
            height: 500,
            background: 0x000000,
            borderWidth: 1,
            borderColor: 0xffffff,
            opacity: 0.5
        }));
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        if (G.input.isPressed(G.input.ESC)) {
            G.audio.playSE('se/menu-back.mp3');
            G.mode = 'play';
            G.scene = new SceneMusicSelect();
        }
    }
}
