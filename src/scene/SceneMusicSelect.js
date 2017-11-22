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
        this.loadResource({
            audio: [
                'bgm/voltexes-ii.mp3',
                'se/menu-cursor.mp3',
                'se/menu-click.mp3',
                'se/menu-back.mp3'
            ],
            graphics: [
                'graphics/music-select-bg.jpg'
            ]
        });
    }
    /**
     * Trigger when scene is initialized
     * @override
     */
    async onInitialize() {
        G.audio.playBGM('bgm/voltexes-ii.mp3');
        // backgrounds
        this.stage.addChild(G.graphics.createImage('graphics/music-select-bg.jpg', {
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
            G.audio.playSE('se/menu-back.mp3');
            // press ESC to back to title
            G.scene = new SceneTitle();
            G.lastSelectMusic = this.selected;
        } else if (G.input.isPressed(G.input.UP) || G.input.isPressed(G.input.LEFT)) {
            // press UP or LEFT to select music above
            this.selected = (this.selected - 1 + G.musics.length) % G.musics.length;
            G.audio.playSE('se/menu-cursor.mp3');
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.DOWN) || G.input.isPressed(G.input.RIGHT)) {
            // press DOWN or RIGHT to select music below
            this.selected = (this.selected + 1) % G.musics.length;
            G.audio.playSE('se/menu-cursor.mp3');
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.ENTER)) {
            G.audio.playSE('se/menu-click.mp3');
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
                x: w,
                y: 0.3 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }));
            sprite.width = 9999;
            sprite.height = MUSIC_LIST_ITEM_HEIGHT;
            // draw background
            sprite.addChild(G.graphics.createRect({
                top: 0,
                left: 0,
                width: 9999,
                height: MUSIC_LIST_ITEM_HEIGHT,
                background: 0x3498db,
                borderColor: 0x2980b9,
                borderWidth: 1,
                opacity: 1
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
            G.animation.set(sprite, (w, h, self) => ({
                x: 0.5 * w + (Math.abs(offset) * 0.5 * w * MUSIC_LIST_ITEM_X_DELTA),
                y: 0.5 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }), MUSIC_LIST_SWITCH_TIME * 3);
        }
    }
    animateMusicSprites() {
        let index = 0;
        for (const sprite of this.musicListSprite.children) {
            const offset = index++ - this.selected;
            G.animation.set(sprite, (w, h, self) => ({
                x: 0.5 * w + (Math.abs(offset) * 0.5 * w * MUSIC_LIST_ITEM_X_DELTA),
                y: 0.5 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }), MUSIC_LIST_SWITCH_TIME);
        }
    }
}
