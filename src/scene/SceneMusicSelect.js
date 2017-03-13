/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
    fitSize,
} from '../Functions';
import SceneBase from './SceneBase';
import SceneTitle from './SceneTitle';
import SceneEditor from './SceneEditor';
import SceneGaming from './SceneGaming';

const {
    MUSIC_LIST_ITEM_HEIGHT,
    MUSIC_LIST_ITEM_PADDING,
    MUSIC_LIST_ITEM_TITLE_SIZE,
    MUSIC_LIST_ITEM_TITLE_MARGIN_BOTTOM,
    MUSIC_LIST_ITEM_CREATOR_SIZE,
    MUSIC_LIST_ITEM_DELTA,
    MUSIC_LIST_SWITCH_TIME,
} = G.constant;

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
        let modeText = '';
        switch (G.mode) {
        case 'play':
            modeText = 'Choose a song to play!';
            break;
        case 'edit':
            modeText = 'Use your imagination!';
            break;
        default:
            modeText = '...';
            break;
        }
        // loading text
        this.loadingTextSprite = new PIXI.Text('Loading music list...', {
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
        this.darkenShadow.alpha = 0.5;
        this.stage.addChild(this.darkenShadow);
        // mode text
        this.modeTextSprite = new PIXI.Text(`Mode: ${G.mode}\n\n${modeText}`, {
            fontFamily: G.constant.MAIN_FONT,
            fontSize: 20,
            fill: '#FFF',
        });
        setPosition(this.modeTextSprite, () => ({
            x: 20,
            y: 20,
        }));
        this.stage.addChild(this.modeTextSprite);
        // music list sprite
        this.musicListSprite = new PIXI.Container;
        setPosition(this.musicListSprite, () => ({
            x: 0.55 * window.innerWidth,
            y: 0,
        }));
        this.stage.addChild(this.musicListSprite);
        // load background and music
        this.loadBackground(G.musics[0].bg);
        if (G.lastSelectMusic != -1) {
            this.selected = G.lastSelectMusic;
        }
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
            G.lastSelectMusic = this.selected;
        } else if (G.input.isPressed(G.input.UP)) {
            // press UP to select music above
            this.selected = (this.selected - 1 + G.musics.length) % G.musics.length;
            this.loadBackground(G.musics[this.selected].bg);
            G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime);
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.DOWN)) {
            // press DOWN to select music below
            this.selected = (this.selected + 1) % G.musics.length;
            this.loadBackground(G.musics[this.selected].bg);
            G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime);
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.ENTER)) {
            // press ENTER to enter playfield or editor
            switch (G.mode) {
            case 'play':
                G.scene = new SceneGaming(this.selected);
                break;
            case 'edit':
                G.scene = new SceneEditor(this.selected);
                break;
            default:
                break;
            }
            G.audio.pauseBGM();
            G.lastSelectMusic = this.selected;
        }
    }
    /**
     * Build music sprites if we have music list
     */
    buildMusicSprites() {
        for (let i = 0; i < G.musics.length; i++) {
            const music = G.musics[i];
            const sprite = new PIXI.Container;
            this.animateSprite(sprite, i);
            // draw background
            const itemBackground = new PIXI.Graphics();
            itemBackground.beginFill(0x000000);
            itemBackground.lineStyle(1, 0xFFFFFF, 1);
            itemBackground.drawRect(0, 0, 1024, MUSIC_LIST_ITEM_HEIGHT);
            itemBackground.endFill();
            itemBackground.alpha = 0.5;
            sprite.addChild(itemBackground);
            // draw inner text
            const musicName = new PIXI.Text(`${music.artist} - ${music.name}`, {
                fontFamily: G.constant.MAIN_FONT,
                fontSize: MUSIC_LIST_ITEM_TITLE_SIZE,
                fill: '#FFF',
            });
            musicName.position.set(MUSIC_LIST_ITEM_PADDING, MUSIC_LIST_ITEM_PADDING);
            sprite.addChild(musicName);
            const musicCreator = new PIXI.Text(`Created by ${music.creator}`, {
                fontFamily: G.constant.MAIN_FONT,
                fontSize: MUSIC_LIST_ITEM_CREATOR_SIZE,
                fill: '#FFF',
            });
            musicCreator.position.set(MUSIC_LIST_ITEM_PADDING, MUSIC_LIST_ITEM_PADDING + MUSIC_LIST_ITEM_TITLE_SIZE + MUSIC_LIST_ITEM_TITLE_MARGIN_BOTTOM);
            sprite.addChild(musicCreator);
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
                    const size = G.resource.getSize(`songs/${url}`);
                    const rate = fitSize(size.width, size.height, window.innerWidth, window.innerHeight);
                    return {
                        x: 0.5 * window.innerWidth,
                        y: 0.5 * window.innerHeight,
                        width: size.width * rate,
                        height: size.height * rate,
                    };
                }, true);
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
        const ips = window.innerHeight / MUSIC_LIST_ITEM_HEIGHT;
        // vertical center position
        const center = 0.5 * (window.innerHeight - MUSIC_LIST_ITEM_HEIGHT);
        const newX = Math.abs(pos) / ips * MUSIC_LIST_ITEM_DELTA * window.innerWidth;
        const newY = center + pos * MUSIC_LIST_ITEM_HEIGHT * 0.9;
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
        }, MUSIC_LIST_SWITCH_TIME, G.animation.EASE_OUT_EXPO);
    }
}
