/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';

export default class SceneTitle extends SceneBase {
    titleTextTimer: number;
    titleText: string;
    randomChr: { pos: number; bak: string };
    titleTextSprite!: ReturnType<typeof G.graphics.createText>;

    constructor() {
        super();
        this.titleTextTimer = 0;
        this.titleText = 'Parallel Rails';
        this.randomChr = {
            pos: -1,
            bak: ''
        };
        this.loadResource({
            audio: ['bgm/sedap-malam.mp3', 'se/menu-click.mp3'],
            graphics: ['graphics/title-bg.jpg']
        });
    }

    onInitialize() {
        G.audio.playBGM('bgm/sedap-malam.mp3', 2);
        this.stage.addChild(G.graphics.createImage('graphics/title-bg.jpg', {
            position: 'center',
            size: 'cover'
        }));
        this.stage.addChild(G.graphics.createRect({
            top: 0,
            left: 0,
            width: 9999,
            height: 9999,
            background: 0x000000,
            opacity: 0.5
        }));
        this.stage.addChild(this.titleTextSprite = G.graphics.createText(this.titleText, { fontSize: 48 }, (w: number, h: number, self: any) => ({
            x: 0.5 * (w - self.width),
            y: 0.5 * (h - self.height) - 32
        })));
        this.stage.addChild(G.graphics.createText('Made by Rex Zeng using Pixi.js', {}, (w: number, h: number, self: any) => ({
            x: 0.5 * (w - self.width),
            y: 0.5 * (h - self.height) + 15
        })));
        this.stage.addChild(G.graphics.createText('[P] play beatmap\n\n[E] edit beatmap', {}, (w: number, h: number, self: any) => ({
            x: 0.5 * (w - self.width),
            y: 0.5 * (h - self.height) + 80
        })));
    }

    update() {
        this.updateTitleTextContent();
        if (G.input.isPressed(G.input.P)) {
            G.audio.playSE('se/menu-click.mp3');
            G.mode = 'play';
            G.scene = new SceneMusicSelect();
        } else if (G.input.isPressed(G.input.E)) {
            G.audio.playSE('se/menu-click.mp3');
            G.mode = 'edit';
            G.scene = new SceneMusicSelect();
        }
    }

    updateTitleTextContent() {
        this.titleTextTimer++;
        if (this.titleTextTimer < 20) {
            let rnd = 0;
            let t = 0;
            do {
                rnd = Math.random();
                t = Math.trunc(rnd * this.titleText.length);
            } while (t === this.randomChr.pos || this.titleText[t] === ' ');
            if (this.randomChr.bak.length === 0) {
                this.randomChr.pos = t;
                this.randomChr.bak = this.titleText[t];
            }
            this.titleText = this.titleText.slice(0, this.randomChr.pos)
                + String.fromCharCode(Math.trunc(rnd * 26 + (rnd > 0.5 ? 65 : 97)))
                + this.titleText.slice(this.randomChr.pos + 1);
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
