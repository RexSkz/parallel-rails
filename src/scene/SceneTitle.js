/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
} from '../Functions';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';

/**
 * Define title scene
 * @class
 */
export default class SceneTitle extends SceneBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.name = 'title';
        this.titleTextTimer = 0;
        this.str = 'Parallel Rails';
        this.pos = -1;
        this.chrBak = '';
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        // title message
        this.titleMessageSprite = new PIXI.Text(this.str, {
            fontFamily: 'Courier',
            fontSize: 48,
            fill: '#FFF',
        });
        setPosition(this.titleMessageSprite,  () => ({
            x: 0.5 * (window.innerWidth - this.titleMessageSprite.width),
            y: 0.5 * (window.innerHeight - this.titleMessageSprite.height) - 32,
        }));
        this.stage.addChild(this.titleMessageSprite);
        // start message
        this.startMessageSprite = new PIXI.Text('Made by Rex Zeng using Pixi.js', {
            fontFamily: 'Courier',
            fontSize: 18,
            fill: '#FFF',
        });
        setPosition(this.startMessageSprite, () => ({
            x: 0.5 * (window.innerWidth - this.startMessageSprite.width),
            y: 0.5 * (window.innerHeight - this.startMessageSprite.height) + 15,
        }));
        this.stage.addChild(this.startMessageSprite);
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        this.updateTitleTextContent();
        // press ENTER to enter music select
        if (G.input.isPressed(G.input.ENTER)) {
            G.scene = new SceneMusicSelect;
        }
    }
    /**
     * Make title text more fancy by changing a character randomly
     */
    updateTitleTextContent() {
        this.titleTextTimer++;
        if (this.titleTextTimer < 20) {
            let rnd = 0, t = 0;
            do {
                rnd = Math.random();
                t = String(rnd * this.str.length);
                if (/\-/.test(t)) {
                    t = 0;
                } else {
                    t = parseInt(t);
                }
            } while (t == this.pos || this.str[t] == ' ');
            if (this.chrBak.length == 0) {
                this.pos = t;
                this.chrBak = this.str[this.pos];
            }
            this.str = this.str.slice(0, this.pos) + String.fromCharCode(rnd * 26 + (rnd > 0.5 ? 65 : 97)) + this.str.slice(this.pos + 1);
            this.titleMessageSprite.text = this.str;
        } else if (this.titleTextTimer == 20) {
            this.str = this.str.slice(0, this.pos) + this.chrBak + this.str.slice(this.pos + 1);
            this.titleMessageSprite.text = this.str;
            this.chrBak = '';
        } else if (this.titleTextTimer >= 120) {
            this.titleTextTimer = 0;
        }
    }
}
