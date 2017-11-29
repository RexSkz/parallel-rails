/**
 * Gaming scene
 * @author Rex Zeng
 */

import G from '../Global';
import WindowHitObject from '../window/WindowHitObject';
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
        this.musicId = musicId;
        this.music = G.musics[musicId];
        this.audioUrl = `songs/${this.music.audio}`;
        this.bgUrl = `songs/${this.music.bg}`;
        this.prUrl = `songs/${this.music.pr}`;
        this.data = {
            artist: this.music.artist,
            name: this.music.name,
            creator: this.music.creator,
            timingPoints: [],
            hitObjects: [],
            currentTime: 0,
            duration: 1,
            playFromTime: -1,
            detail: 4
        };
        this.hitIndex = 0;
        this.resourceToLoad = {
            audio: [
                this.audioUrl
            ],
            graphics: [
                'graphics/hit-circle-green.png',
                'graphics/hit-circle-orange.png',
                this.bgUrl
            ]
        };
    }
    /**
     * Trigger when scene is initialized
     * @override
     */
    async onInitialize() {
        G.audio.pauseBGM();
        this.audio = G.resource.audio(this.audioUrl);
        // background
        this.stage.addChild(G.graphics.createImage(this.bgUrl, (w, h, self) => ({
            position: 'center',
            size: 'cover'
        })));
        // darken shadow
        this.stage.addChild(G.graphics.createRect({
            top: 0,
            left: 0,
            width: 9999,
            height: 9999,
            background: 0x000000,
            opacity: 0.3
        }));
        // load pr file
        const res = await fetch(this.prUrl);
        if (res.ok) {
            const data = await res.json();
            this.data.timingPoints = data.timingPoints;
            this.data.hitObjects = data.hitObjects;
        } else {
            console.error(`Get PR file '${this.data.artist} - ${this.data.name}' failed, code ${res.status}`); // eslint-disable-line no-console
        }
        // hit object window
        this.hitObjectWindow = new WindowHitObject(this.data);
        this.addWindow(this.hitObjectWindow);
        // make sure all hit objects' start position greater than 2000
        if (this.data.hitObjects[0].pos1000 < 2000) {
            this.countDownTime = (this.data.hitObjects[0].pos1000 - 2000) / 1000;
            this.hitObjectWindow.hitObjectStage.alpha = 0;
        } else {
            this.countDownTime = 1;
            this.hitObjectWindow.hitObjectStage.alpha = 1;
        }
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        // deal with input
        if (G.input.isPressed(G.input.ESC)) {
            this.audio.fadeOut(0.5);
            G.audio.playSE('se/menu-back.mp3');
            // press ESC to back to title
            G.scene = new SceneMusicSelect();
        }
        // some music may start too early, make some delay time
        let time = 0;
        if (this.countDownTime === null) {
            time = G.audio.getCurrentPlayTime(this.audio);
        } else if (this.countDownTime >= 0) {
            this.audio.playFrom(0);
            this.audio.fadeIn(0);
            this.countDownTime = null;
        } else if (this.countDownTime < 0) {
            time = this.countDownTime;
            this.countDownTime += 1 / 60;
            if (this.countDownTime >= -1) {
                this.hitObjectWindow.hitObjectStage.alpha = 1;
            } else {
                this.hitObjectWindow.hitObjectStage.alpha = 2 + this.countDownTime;
            }
        }
        this.hitObjectWindow.update(time);
        // hit judgement
        if (this.hitIndex >= this.data.hitObjects.length) {
            // finished playing, jump to score scene
        } else {
            const pos1000 = this.data.hitObjects[this.hitIndex].pos1000;
            const time1000 = time * 1000;
            const delta = Math.floor(Math.abs(time1000 - pos1000));
            const color = this.data.hitObjects[this.hitIndex].color || -1;
            let hitJudgement = null;
            if (delta > 150 && pos1000 < time1000) {
                // really miss
                hitJudgement = 0;
                ++this.hitIndex;
            } else if (delta <= 240) {
                // wrong key pressed
                if (
                    (color === 0 && (G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J))) ||
                    (color === 1 && (G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)))
                ) {
                    hitJudgement = -1;
                    ++this.hitIndex;
                } else if (
                    G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J) ||
                    G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)
                ) {
                    if (delta <= 60) {
                        hitJudgement = 300;
                    } else if (delta <= 120) {
                        hitJudgement = 100;
                    } else if (delta <= 180) {
                        hitJudgement = 50;
                    } else {
                        hitJudgement = 0;
                    }
                    ++this.hitIndex;
                }
            }
            if (hitJudgement !== null) {
                console.log(time1000 - pos1000, hitJudgement);
            }
        }
    }
}
