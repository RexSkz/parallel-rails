/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import Position from '../Position';
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
            fontFamily: 'Courier New',
            fontSize: 48,
            fill: '#FFF',
        });
        this.titleMessageSprite.position.set(0.5 * window.innerWidth - this.titleMessageSprite.width / 2, 0.5 * window.innerHeight - this.titleMessageSprite.height / 2 - 32);
        this.stage.addChild(this.titleMessageSprite);
        // start message
        this.startMessageSprite = new PIXI.Text('Made by Rex Zeng using Pixi.js', {
            fontFamily: 'Courier New',
            fontSize: 18,
            fill: '#FFF',
        });
        this.startMessageSprite.position.set(0.5 * window.innerWidth - this.startMessageSprite.width / 2, 0.5 * window.innerHeight - this.startMessageSprite.height / 2 + 15);
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
        if (G.Input.isPressed(G.Input.ENTER)) {
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
        if (G.windowResized) {
            this.titleMessageSprite.position.set(0.5 * window.innerWidth - this.titleMessageSprite.width / 2, 0.5 * window.innerHeight - this.titleMessageSprite.height / 2 - 20);
            this.startMessageSprite.position.set(0.5 * window.innerWidth - this.startMessageSprite.width / 2, 0.5 * window.innerHeight - this.startMessageSprite.height / 2 + 15);
        }
    }
}
