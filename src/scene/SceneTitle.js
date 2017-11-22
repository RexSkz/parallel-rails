/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
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
        this.titleText = 'Parallel Rails';
        this.randomChr = {
            pos: -1,
            bak: ''
        };
        this.loadResource({
            audio: [
                'bgm/sedap-malam.mp3',
                'se/menu-click.mp3'
            ],
            graphics: [
                'graphics/title-bg.jpg'
            ]
        });
    }
    /**
     * Trigger when scene is initialized
     * @override
     */
    onInitialize() {
        G.audio.playBGM('bgm/sedap-malam.mp3', 2);
        this.stage.addChild(G.graphics.createImage('graphics/title-bg.jpg', {
            position: 'center',
            size: 'cover'
        }));
        // darken shadow
        this.stage.addChild(G.graphics.createRect({
            top: 0,
            left: 0,
            width: 9999,
            height: 9999,
            background: 0x000000,
            opacity: 0.5
        }));
        this.stage.addChild(this.titleTextSprite = G.graphics.createText(this.titleText, { fontSize: 48 }, (w, h, self) => ({
            x: 0.5 * (w - self.width),
            y: 0.5 * (h - self.height) - 32
        })));
        this.stage.addChild(G.graphics.createText('Made by Rex Zeng using Pixi.js', {}, (w, h, self) => ({
            x: 0.5 * (w - self.width),
            y: 0.5 * (h - self.height) + 15
        })));
        // press button message
        this.stage.addChild(G.graphics.createText('[P] play beatmap\n\n[E] edit beatmap', {}, (w, h, self) => ({
            x: 0.5 * (w - self.width),
            y: 0.5 * (h - self.height) + 80
        })));
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        this.updateTitleTextContent();
        if (G.input.isPressed(G.input.P)) {
            G.audio.playSE('se/menu-click.mp3');
            // press P to enter music select
            G.mode = 'play';
            G.scene = new SceneMusicSelect();
        } else if (G.input.isPressed(G.input.E)) {
            G.audio.playSE('se/menu-click.mp3');
            G.mode = 'edit';
            G.scene = new SceneMusicSelect();
        }
    }
    /**
     * Make title text more fancy by changing a character randomly
     */
    updateTitleTextContent() {
        this.titleTextTimer++;
        if (this.titleTextTimer < 20) {
            let rnd = 0;
            let t = 0;
            do {
                rnd = Math.random();
                t = parseInt(rnd * this.titleText.length);
            } while (t === this.randomChr.pos || this.titleText[t] === ' ');
            if (this.randomChr.bak.length === 0) {
                this.randomChr.pos = t;
                this.randomChr.bak = this.titleText[t];
            }
            this.titleText = this.titleText.slice(0, this.randomChr.pos) + String.fromCharCode(rnd * 26 + (rnd > 0.5 ? 65 : 97)) + this.titleText.slice(this.randomChr.pos + 1);
            this.titleTextSprite.text = this.titleText;
        } else if (this.titleTextTimer === 20) {
            this.titleText = this.titleText.slice(0, this.randomChr.pos) + this.randomChr.bak + this.titleText.slice(this.randomChr.pos + 1);
            this.titleTextSprite.text = this.titleText;
            this.randomChr.bak = '';
        } else if (this.titleTextTimer >= 120) {
            this.titleTextTimer = 0;
        }
    }
}
