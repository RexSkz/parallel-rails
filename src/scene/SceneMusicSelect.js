/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
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
    MUSIC_LIST_ITEM_X_DELTA,
    MUSIC_LIST_ITEM_Y_DELTA,
    MUSIC_LIST_SWITCH_TIME
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
        this.selected = 0;
    }
    /**
     * Trigger when scene is initialized
     * @override
     */
    async onInitialize() {
        if (!G.musics) {
            // loading text
            this.stage.addChild(this.loadingTextSprite = G.graphics.createText('Loading music list...', {
                fontSize: 24
            }, (w, h, self) => ({
                x: 0.5 * (w - self.width),
                y: 0.5 * (h - self.height)
            })));
            const res = await fetch('api/musics.json');
            if (res.ok) {
                G.musics = await res.json();
                this.stage.removeChild(this.loadingTextSprite);
            } else {
                console.error(`Get music info failed, code ${res.status}.`); // eslint-disable-line no-console
            }
        }
        // mode text
        const modeText = {
            'play': 'Choose a song to play!',
            'edit': 'Use your imagination!'
        };
        this.stage.addChild(G.graphics.createText(`Mode: ${G.mode}\n${modeText[G.mode]}`, {}, { x: 20, y: 20 }));
        // music list sprite
        this.stage.addChild(this.musicListSprite = G.graphics.createSprite({ x: 0, y: 0 }));
        // load last select music
        if (G.lastSelectMusic !== -1) {
            this.selected = G.lastSelectMusic;
        }
        this.buildMusicSprites();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        // deal with input
        if (G.input.isPressed(G.input.ESC)) {
            // press ESC to back to title
            G.scene = new SceneTitle();
            G.lastSelectMusic = this.selected;
        } else if (G.input.isPressed(G.input.UP)) {
            // press UP to select music above
            this.selected = (this.selected - 1 + G.musics.length) % G.musics.length;
            // G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime / 1000);
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.DOWN)) {
            // press DOWN to select music below
            this.selected = (this.selected + 1) % G.musics.length;
            // G.audio.playBGM(`songs/${G.musics[this.selected].audio}`, G.musics[this.selected].previewTime / 1000);
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.ENTER)) {
            // press ENTER to enter playfield or editor
            G.lastSelectMusic = this.selected;
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
        }
    }
    /**
     * Build music sprites if we have music list
     */
    buildMusicSprites() {
        let index = 0;
        for (const music of G.musics) {
            const offset = index++ - this.selected;
            const sprite = G.graphics.createSprite((w, h, self) => ({
                x: 0.5 * w + (Math.abs(offset) * 0.5 * w * MUSIC_LIST_ITEM_X_DELTA),
                y: 0.5 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }));
            sprite.width = 9999;
            sprite.height = MUSIC_LIST_ITEM_HEIGHT;
            // draw background
            sprite.addChild(G.graphics.createRect({
                top: 0,
                left: 0,
                width: 9999,
                height: MUSIC_LIST_ITEM_HEIGHT,
                background: 0x000000,
                borderColor: 0xffffff,
                borderWidth: 1,
                opacity: 0.95
            }));
            // draw inner text
            sprite.addChild(G.graphics.createText(`${music.artist} - ${music.name}`, {}, () => ({
                x: MUSIC_LIST_ITEM_PADDING,
                y: MUSIC_LIST_ITEM_PADDING
            })));
            sprite.addChild(G.graphics.createText(`Created by ${music.creator}`, {
                fontSize: MUSIC_LIST_ITEM_CREATOR_SIZE
            }, () => ({
                x: MUSIC_LIST_ITEM_PADDING,
                y: MUSIC_LIST_ITEM_PADDING + MUSIC_LIST_ITEM_TITLE_SIZE + MUSIC_LIST_ITEM_TITLE_MARGIN_BOTTOM
            })));
            // setup sprite
            this.musicListSprite.addChild(sprite);
        }
    }
    animateMusicSprites() {
        let index = 0;
        for (const sprite of this.musicListSprite.children) {
            const offset = index++ - this.selected;
            G.animation.set(sprite, (w, h, self) => ({
                x: 0.5 * w + (Math.abs(offset) * 0.5 * w * MUSIC_LIST_ITEM_X_DELTA),
                y: 0.5 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }), MUSIC_LIST_SWITCH_TIME, G.animation.EASE_OUT_EXPO);
        }
    }
}
