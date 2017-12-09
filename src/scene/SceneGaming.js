/**
 * Gaming scene
 * @author Rex Zeng
 */

import G from '../Global';
import WindowHitObject from '../window/WindowHitObject';
import WindowTiming from '../window/WindowTiming';
import WindowHitScore from '../window/WindowHitScore';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';
import SceneScore from './SceneScore';

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
            detail: 4,
            isEditMode: false
        };
        this.hitIndex = 0;
        this.currentScore = 0;
        this.currentCombo = 0;
        this.maxCombo = 0;
        this.scorePoints = {};
        this.hitResults = {
            '0': 0,
            '50': 0,
            '100': 0,
            '200': 0,
            '300': 0,
            '300g': 0
        };
        this.resourceToLoad = {
            audio: [
                'se/hit-00.mp3',
                'se/hit-01.mp3',
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
        // timing window
        this.timingWindow = new WindowTiming(0, this.data.duration = this.audio.buffer.duration);
        this.addWindow(this.timingWindow);
        this.hitScoreWindow = new WindowHitScore();
        this.addWindow(this.hitScoreWindow);
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
        // play hit se
        if (G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J)) {
            G.audio.playSE('se/hit-00.mp3');
        } else if (G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)) {
            G.audio.playSE('se/hit-01.mp3');
        }
        // hit judgement
        const hitObject = this.data.hitObjects[this.hitIndex] || null;
        if (hitObject !== null) {
            const pos1000 = hitObject.pos1000;
            const time1000 = time * 1000;
            const delta = Math.floor(time1000 - pos1000);
            const absDelta = Math.abs(delta);
            const color = hitObject.color === undefined ? -1 : hitObject.color;
            let hitJudgement = null;
            let hitJudgementType = '';
            if (absDelta > 200 && pos1000 < time1000) {
                // really miss
                hitJudgement = -2;
                hitJudgementType = '0';
            } else if (absDelta <= 300) {
                if (
                    (color === 0 && (G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J))) ||
                    (color === 1 && (G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)))
                ) {
                    // wrong key pressed
                    hitJudgement = -1;
                    hitJudgementType = '0';
                } else if (
                    G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J) ||
                    G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)
                ) {
                    if (absDelta <= 20) {
                        hitJudgement = 300;
                        hitJudgementType = '300g';
                    } else if (absDelta <= 60) {
                        hitJudgement = 300;
                        hitJudgementType = '300';
                    } else if (absDelta <= 100) {
                        hitJudgement = 200;
                        hitJudgementType = '200';
                    } else if (absDelta <= 160) {
                        hitJudgement = 100;
                        hitJudgementType = '100';
                    } else if (absDelta <= 220) {
                        hitJudgement = 50;
                        hitJudgementType = '50';
                    } else {
                        // hit too early
                        hitJudgement = 0;
                        hitJudgementType = '0';
                    }
                }
            }
            if (hitJudgement !== null && this.hitIndex < this.data.hitObjects.length) {
                this.hitObjectWindow.objectHit(this.hitIndex, hitJudgement);
                this.hitScoreWindow.objectHit(hitJudgement);
                this.updateRecords(Math.max(hitJudgement, 0), hitJudgementType, parseInt(time * 1000));
                ++this.hitIndex;
            }
        } else {
            // 2s after the last hit object, jump to the score scene
            if (time * 1000 > this.data.hitObjects[this.hitIndex - 1].pos1000 + 1000) {
                G.scene = new SceneScore(this.bgUrl, this.scorePoints, this.hitResults, this.currentScore, this.maxCombo);
            }
        }
        this.updateTimingWindow();
        this.hitScoreWindow.update();
    }
    /**
     * Update timing window
     */
    updateTimingWindow() {
        if (this.audio.playing) {
            this.data.currentTime = G.audio.getCurrentPlayTime(this.audio);
            this.timingWindow.update(this.data.currentTime);
        }
    }
    /**
     * Update records after hit a key
     * @param {number} score - Current hit score
     * @param {string} type - Current hit judgement type
     * @param {number} currentTime - Current time
     */
    updateRecords(score, type, currentTime) {
        this.scorePoints[currentTime] = score;
        ++this.hitResults[type];
        if (score > 0) {
            if (++this.currentCombo > this.maxCombo) {
                this.maxCombo = this.currentCombo;
            }
            // score addition grows after each 20 combos, max 3000
            this.currentScore += Math.min(3000, score * (Math.floor(combo / 20) + 1));
        } else {
            this.currentCombo = 0;
        }
    }
    /**
     * Trigger before the scene is terminated
     * @override
     */
    onTerminate() {
        this.audio.fadeOut(0.5);
        setTimeout(() => this.audio.pause(), 500);
    }
}
