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
 * Define music select scene
 * @class
 */
export default class SceneMusicSelect extends SceneBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.name = 'music select';
        this.selected = 0;
        this.backgroundLoaded = false;
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
        // add texts
        this.loadingTextSprite = new PIXI.Text('Loading...', {
            fontFamily: 'Courier New',
            fontSize: 24,
            fill: '#FFF',
        });
        setPosition(this.loadingTextSprite, () => ({
            x: 0.6 * window.innerWidth,
            y: 0.5 * (window.innerHeight - this.loadingTextSprite.height),
        }));
        this.stage.addChild(this.loadingTextSprite);
        // add background
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
        this.darkenShadow.alpha = 0.3;
        this.stage.addChild(this.darkenShadow);
        this.musicListSprite = new PIXI.Container;
        setPosition(this.musicListSprite, () => ({
            x: 0.6 * window.innerWidth,
            y: 0,
        }));
        this.stage.addChild(this.musicListSprite);
        this.loadBackground(G.musics[0].bg);
        G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime);
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        this.updateBackground(G.musics[this.selected].bg);
        // judge if we have music list
        if (G.musics) {
            this.loadingTextSprite.visible = false;
            this.musicListSprite.visible = true;
            if (this.musicListSprite.children.length == 0) {
                this.buildMusicSprites();
            }
        } else {
            this.loadingTextSprite.visible = true;
            this.musicListSprite.visible = false;
        }
        // deal with input
        if (G.input.isPressed(G.input.ESC)) {
            // press ESC to back to title
            G.scene = new SceneTitle;
        } else if (G.input.isPressed(G.input.UP)) {
            // press UP to select music above
            this.selected = (this.selected - 1 + G.musics.length) % G.musics.length;
            this.loadBackground(G.musics[this.selected].bg);
            this.animateMusicSprites();
            G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime);
        } else if (G.input.isPressed(G.input.DOWN)) {
            // press DOWN to select music below
            this.selected = (this.selected + 1) % G.musics.length;
            this.loadBackground(G.musics[this.selected].bg);
            this.animateMusicSprites();
            G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime);
        }
    }
    /**
     * Build music sprites if we have music list
     */
    buildMusicSprites() {
        for (let i = 0; i < G.musics.length; i++) {
            const sprite = new PIXI.Container;
            this.animateSprite(sprite, i);
            // draw inner text
            const text = new PIXI.Graphics();
            text.beginFill(0x3498DB);
            text.drawRect(0, 0, 1024, G.constant.MUSIC_LIST_ITEM_HEIGHT);
            text.endFill();
            sprite.addChild(text);
            // setup sprite
            this.musicListSprite.addChild(sprite);
        }
    }
    /**
     * Load current music's bg
     */
    loadBackground(url) {
        G.resource.add(`songs/${url}`);
        this.backgroundLoaded = false;
    }
    /**
     * Update background image
     */
    updateBackground(url) {
        if (!this.backgroundLoaded) {
            const texture = G.resource.get(`songs/${url}`);
            if (texture) {
                this.backgroundSprite.texture = texture;
                setPosition(this.backgroundSprite, () => {
                    const width = this.backgroundSprite.width;
                    const height = this.backgroundSprite.height;
                    const newWidth = width;
                    const newHeight = height;
                    return {
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                        width: newWidth,
                        height: newHeight,
                    };
                });
                this.backgroundLoaded = true;
            }
        }
    }
    /**
     * Update music list
     */
    animateMusicSprites() {
        for (let i = 0; i < this.musicListSprite.children.length; i++) {
            const sprite = this.musicListSprite.children[i];
            this.animateSprite(sprite, i);
        }
    }
    /**
     * Calculate and set music name sprite position
     * @param {sprite} sprite - The sprite we want to set position
     * @param {number} i - The sprite's order in list
     */
    animateSprite(sprite, i) {
        // order relative to current selected
        const pos = i - this.selected;
        // item per screen
        const ips = window.innerHeight / G.constant.MUSIC_LIST_ITEM_HEIGHT;
        // vertical center position
        const center = 0.5 * (window.innerHeight - G.constant.MUSIC_LIST_ITEM_HEIGHT);
        const newX = Math.abs(pos) / ips * G.constant.MUSIC_LIST_ITEM_DELTA * window.innerWidth;
        const newY = center + pos * G.constant.MUSIC_LIST_ITEM_HEIGHT * 0.9;
        const newAlpha = 0.8 - Math.abs(pos) * 0.2;
        // set animation
        G.animation.set(sprite, {
            x: sprite.x,
            y: sprite.y,
            alpha: sprite.alpha,
        }, {
            x: newX,
            y: newY,
            alpha: newAlpha,
        }, G.constant.MUSIC_LIST_SWITCH_TIME, G.animation.EASE_OUT_EXPO);
    }
}
