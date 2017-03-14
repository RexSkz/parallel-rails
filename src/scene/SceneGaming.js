/**
 * Gaming scene
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
} from '../Functions';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';

/**
 * Define gaming scene
 * @class
 */
export default class SceneGaming extends SceneBase {
    /**
     * @constructor
     */
    constructor(musicId) {
        super();
        this.name = 'gaming';
        this.musicId = musicId;
        this.music = G.musics[musicId];
        this.audioUrl = `songs/${this.music.audio}`;
        this.bgUrl = `songs/${this.music.bg}`;
        this.prUrl = `songs/${this.music.pr}`;
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        // loading text
        this.loadingTextSprite = new PIXI.Text('Loading music data...', {
            fontFamily: G.constant.MAIN_FONT,
            fontSize: 24,
            fill: '#FFF',
        });
        this.loadingTextSprite.anchor.x = 0.5;
        this.loadingTextSprite.anchor.y = 0.5;
        setPosition(this.loadingTextSprite, () => ({
            x: 0.5 * window.innerWidth,
            y: 0.5 * window.innerHeight,
        }));
        this.stage.addChild(this.loadingTextSprite);
        // background
        this.backgroundSprite = new PIXI.Sprite;
        // set anchor to image center
        this.backgroundSprite.anchor.x = 0.5;
        this.backgroundSprite.anchor.y = 0.5;
        this.stage.addChild(this.backgroundSprite);
        // add darken shadow
        this.darkenShadow = new PIXI.Graphics;
        this.darkenShadow.beginFill(0x000000);
        this.darkenShadow.drawRect(0, 0, 10000, 10000);
        this.darkenShadow.endFill();
        this.darkenShadow.alpha = 0.8;
        this.stage.addChild(this.darkenShadow);
        // load background and music
        this.loadBackground(G.musics[this.musicId].bg);
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        this.updateBackground(G.musics[this.musicId].bg);
        // deal with input
        if (G.input.isPressed(G.input.ESC)) {
            // press ESC to back to title
            G.scene = new SceneMusicSelect;
        }
    }
}
