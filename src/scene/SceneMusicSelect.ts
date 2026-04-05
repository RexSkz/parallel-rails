/**
 * Music select scene
 * @author Rex Zeng
 */

import G from '../Global';
import SceneBase from './SceneBase';
import SceneTitle from './SceneTitle';
import SceneEditor from './SceneEditor';
import SceneGaming from './SceneGaming';
import type { MusicMeta, SceneDebugSnapshot } from '../types';

const {
    MUSIC_LIST_ITEM_WIDTH,
    MUSIC_LIST_ITEM_HEIGHT,
    MUSIC_LIST_ITEM_PADDING,
    MUSIC_LIST_ITEM_TITLE_SIZE,
    MUSIC_LIST_ITEM_TITLE_MARGIN_BOTTOM,
    MUSIC_LIST_ITEM_CREATOR_SIZE,
    MUSIC_LIST_ITEM_X_DELTA,
    MUSIC_LIST_ITEM_Y_DELTA,
    MUSIC_LIST_SWITCH_TIME
} = G.constant;

export default class SceneMusicSelect extends SceneBase {
    selected: number;
    loadingTextSprite!: ReturnType<typeof G.graphics.createText>;
    musicListSprite!: ReturnType<typeof G.graphics.createSprite>;

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

    async onInitialize() {
        G.audio.playBGM('bgm/voltexes-ii.mp3');
        this.stage.addChild(G.graphics.createImage('graphics/music-select-bg.jpg', {
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
        if (!G.musics) {
            this.stage.addChild(this.loadingTextSprite = G.graphics.createText('Loading music list...', {
                fontSize: 24
            }, (w: number, h: number, self: any) => ({
                x: 0.5 * (w - self.width),
                y: 0.5 * (h - self.height)
            })));
            const res = await fetch('api/musics.json');
            if (res.ok) {
                G.musics = await res.json();
                this.stage.removeChild(this.loadingTextSprite);
                window.Debug?.log('music-select', 'Loaded music list', { total: G.musics.length });
            } else {
                console.error(`Get music info failed, code ${res.status}.`);
                window.Debug?.log('music-select', 'Failed to load music list', { status: res.status });
            }
        }
        const modeText: Record<string, string> = {
            play: 'Choose a song to play!',
            edit: 'Use your imagination!'
        };
        this.stage.addChild(G.graphics.createText(`Mode: ${G.mode}\n${modeText[G.mode]}`, {}, { x: 20, y: 20 }));
        this.stage.addChild(this.musicListSprite = G.graphics.createSprite({ x: 0, y: 0 }));
        if (G.lastSelectMusic !== -1) {
            this.selected = G.lastSelectMusic;
        }
        this.buildMusicSprites();
    }

    update() {
        if (G.input.isPressed(G.input.ESC)) {
            G.audio.playSE('se/menu-back.mp3');
            G.scene = new SceneTitle();
            G.lastSelectMusic = this.selected;
        } else if (G.input.isPressed(G.input.UP) || G.input.isPressed(G.input.LEFT)) {
            this.selected = (this.selected - 1 + G.musics.length) % G.musics.length;
            G.audio.playSE('se/menu-cursor.mp3');
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.DOWN) || G.input.isPressed(G.input.RIGHT)) {
            this.selected = (this.selected + 1) % G.musics.length;
            G.audio.playSE('se/menu-cursor.mp3');
            this.animateMusicSprites();
        } else if (G.input.isPressed(G.input.ENTER)) {
            G.audio.playSE('se/menu-click.mp3');
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

    buildMusicSprites() {
        let index = 0;
        for (const music of G.musics) {
            const offset = index++ - this.selected;
            const sprite = G.graphics.createSprite((w: number, h: number, _self: any) => ({
                x: w,
                y: 0.3 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }));
            sprite.width = 9999;
            sprite.height = MUSIC_LIST_ITEM_HEIGHT;
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
            this.musicListSprite.addChild(sprite);
            G.animation.set(sprite, (w: number, h: number, _self: any) => ({
                x: w - MUSIC_LIST_ITEM_WIDTH + (Math.pow(Math.abs(offset), 1.2) * MUSIC_LIST_ITEM_WIDTH * MUSIC_LIST_ITEM_X_DELTA),
                y: 0.5 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }), MUSIC_LIST_SWITCH_TIME * 3);
        }
    }

    animateMusicSprites() {
        let index = 0;
        for (const sprite of this.musicListSprite.children) {
            const offset = index++ - this.selected;
            G.animation.set(sprite, (w: number, h: number, _self: any) => ({
                x: w - MUSIC_LIST_ITEM_WIDTH + (Math.pow(Math.abs(offset), 1.2) * MUSIC_LIST_ITEM_WIDTH * MUSIC_LIST_ITEM_X_DELTA),
                y: 0.5 * h + MUSIC_LIST_ITEM_HEIGHT * (1 - MUSIC_LIST_ITEM_Y_DELTA) * (offset - 0.5)
            }), MUSIC_LIST_SWITCH_TIME);
        }
    }

    debugSnapshot(): SceneDebugSnapshot {
        const current = G.musics?.[this.selected] as MusicMeta | undefined;
        return {
            ...super.debugSnapshot(),
            scene: this.constructor.name,
            summary: this.debugSummary(),
            selected: {
                index: this.selected,
                total: G.musics?.length || 0,
                artist: current?.artist || '',
                name: current?.name || '',
                creator: current?.creator || ''
            }
        };
    }

    protected debugSummary(): string[] {
        const current = G.musics?.[this.selected] as MusicMeta | undefined;
        return [
            `selected=${this.selected}/${Math.max((G.musics?.length || 1) - 1, 0)}`,
            `mode=${G.mode}`,
            `music=${current ? `${current.artist} - ${current.name}` : 'loading'}`
        ];
    }
}
