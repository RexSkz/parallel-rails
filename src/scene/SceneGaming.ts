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
import type { BeatmapData, GameplayScoreState, HitInputState, MusicMeta, SceneDebugSnapshot, SoundHandle, TickCursor } from '../types';
import { getHitObjectEndTime1000, sanitizeBeatmapData } from '../gameplay/BeatmapSanitizer';
import { judgeHit, judgeSliderTail } from '../gameplay/GameHitJudge';
import { applyScore, createScoreState } from '../gameplay/GameScoreTracker';

/**
 * Define gaming scene
 * @class
 */
export default class SceneGaming extends SceneBase {
    musicId: number;
    music: MusicMeta;
    audio!: SoundHandle;
    audioUrl: string;
    bgUrl: string;
    prUrl: string;
    data: BeatmapData;
    hitIndex: number;
    scoreState: GameplayScoreState;
    timingWindow!: WindowTiming;
    hitScoreWindow!: WindowHitScore;
    hitObjectWindow!: WindowHitObject;
    countDownTime!: number | null;
    timingCursor: TickCursor | null;
    activeSliderIndex: number | null;

    constructor(musicId: number) {
        super();
        this.musicId = musicId;
        this.music = G.musics[musicId] as MusicMeta;
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
        this.scoreState = createScoreState();
        this.timingCursor = null;
        this.activeSliderIndex = null;
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
        if (!this.audio) {
            window.Debug?.log('gameplay', 'Audio resource missing, aborting gameplay', { audioUrl: this.audioUrl });
            G.scene = new SceneMusicSelect();
            return;
        }
        // background
        this.stage.addChild(G.graphics.createImage(this.bgUrl, (_w: number, _h: number, _self: any) => ({
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
            const rawData = await res.json();
            const sanitized = sanitizeBeatmapData({
                ...this.data,
                timingPoints: rawData.timingPoints,
                hitObjects: rawData.hitObjects,
                duration: this.audio.buffer.duration
            });
            this.data.timingPoints = sanitized.timingPoints;
            this.data.hitObjects = sanitized.hitObjects;
            if (this.data.timingPoints.length > 0) {
                G.tick.tp = this.data.timingPoints;
                this.timingCursor = G.tick.createCursorByTime(0, 0);
            }
        } else {
            console.error(`Get PR file '${this.data.artist} - ${this.data.name}' failed, code ${res.status}`); // eslint-disable-line no-console
            window.Debug?.log('gameplay', 'Failed to load beatmap file', {
                artist: this.data.artist,
                name: this.data.name,
                status: res.status
            });
        }
        // hit object window
        this.hitObjectWindow = new WindowHitObject(this.data);
        this.addWindow(this.hitObjectWindow);
        // make sure all hit objects' start position greater than 2000
        const firstHitObject = this.data.hitObjects[0] || null;
        if (firstHitObject && firstHitObject.pos1000 < 2000) {
            this.countDownTime = (firstHitObject.pos1000 - 2000) / 1000;
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
            window.Debug?.log('gameplay', 'Exit gameplay scene via ESC', { musicId: this.musicId });
            G.scene = new SceneMusicSelect();
        }
        // some music may start too early, make some delay time
        let time = 0;
        if (this.countDownTime === null) {
            time = G.audio.getCurrentPlayTime(this.audio);
            this.updateTimingCursor(time * 1000);
        } else if (this.countDownTime >= 0) {
            this.audio.playFrom(0);
            this.audio.fadeIn(0);
            this.countDownTime = null;
            this.updateTimingCursor(0);
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
        const gameplayInputEnabled = this.hitObjectWindow.canAcceptGameplayInput(time * 1000);
        const hitInput = this.getHitInputState();
        if (gameplayInputEnabled && hitInput.greenPressed) {
            G.audio.playSE('se/hit-00.mp3');
        } else if (gameplayInputEnabled && hitInput.orangePressed) {
            G.audio.playSE('se/hit-01.mp3');
        } else if (gameplayInputEnabled && hitInput.bonusPressed) {
            G.audio.playSE('se/hit-00.mp3');
        }
        const hitObject = this.data.hitObjects[this.hitIndex] || null;
        const activeSliderObject = this.activeSliderIndex !== null ? this.data.hitObjects[this.activeSliderIndex] || null : null;
        const sliderTailResult = activeSliderObject
            ? judgeSliderTail(activeSliderObject, time, gameplayInputEnabled ? hitInput : {
                ...hitInput,
                greenPressed: false,
                orangePressed: false,
                greenReleased: false,
                orangeReleased: false,
                greenHeld: false,
                orangeHeld: false,
                bonusPressed: false,
                notePressed: false,
                anyPressed: false
            })
            : null;
        if (sliderTailResult && this.activeSliderIndex !== null) {
            this.hitObjectWindow.objectHit(this.activeSliderIndex, sliderTailResult.judgement);
            this.hitScoreWindow.objectHit(sliderTailResult.judgement);
            this.updateRecords(Math.max(sliderTailResult.judgement, 0), sliderTailResult.type, Math.trunc(time * 1000));
            if (sliderTailResult.consumeObject !== false) {
                const sliderSprite = this.hitObjectWindow.hitObjectSpriteList[this.activeSliderIndex];
                if (sliderSprite) {
                    sliderSprite.hitDone = true;
                }
                this.hitIndex = this.activeSliderIndex + 1;
                this.activeSliderIndex = null;
            }
        }
        if (this.activeSliderIndex !== null) {
            this.updateTimingWindow();
            this.hitScoreWindow.update();
            return;
        }
        const result = judgeHit(hitObject, time, gameplayInputEnabled ? hitInput : {
            ...hitInput,
            greenPressed: false,
            orangePressed: false,
            greenReleased: false,
            orangeReleased: false,
            greenHeld: false,
            orangeHeld: false,
            bonusPressed: false,
            notePressed: false,
            anyPressed: false
        });
        if (hitObject && result && this.hitIndex < this.data.hitObjects.length) {
            window.Debug?.log('gameplay-hit', `Judged ${result.type}`, {
                objectIndex: this.hitIndex,
                judgement: result.judgement,
                type: result.type,
                timing: result.context,
                cursor: this.timingCursor ? {
                    timingPointIndex: this.timingCursor.timingPointIndex,
                    tickIndex: this.timingCursor.tickIndex,
                    startTime: this.timingCursor.startTime,
                    endTime: this.timingCursor.endTime,
                    mod: this.timingCursor.mod
                } : null
            });
            if (result.showFeedback !== false) {
                if (hitObject.type === 1 && result.judgement > 0 && result.consumeObject === false) {
                    this.hitObjectWindow.markSliderHeadHit(this.hitIndex);
                } else {
                    this.hitObjectWindow.objectHit(this.hitIndex, result.judgement);
                }
                this.hitScoreWindow.objectHit(result.judgement, hitObject.type === 2 && result.judgement > 0 ? 'bonus' : undefined);
            }
            this.updateRecords(Math.max(result.judgement, 0), result.type, Math.trunc(time * 1000), Boolean(result.preserveCombo));
            if (hitObject.type === 2) {
                this.hitObjectWindow.beginRailSwitch(hitObject, hitObject.pos1000);
            }
            if (hitObject.type === 1 && result.judgement > 0 && result.consumeObject === false) {
                this.activeSliderIndex = this.hitIndex;
            } else {
                ++this.hitIndex;
            }
        } else if (!hitObject) {
            // 2s after the last hit object, jump to the score scene
            const lastHitObject = this.data.hitObjects[this.hitIndex - 1] || null;
            const endTime1000 = getHitObjectEndTime1000(lastHitObject);
            if (!lastHitObject || time * 1000 > endTime1000 + 1000) {
                window.Debug?.log('gameplay', 'Finished song and entering result scene', {
                    score: this.scoreState.currentScore,
                    maxCombo: this.scoreState.maxCombo,
                    timingCursor: this.timingCursor ? {
                        timingPointIndex: this.timingCursor.timingPointIndex,
                        tickIndex: this.timingCursor.tickIndex,
                        startTime: this.timingCursor.startTime,
                        endTime: this.timingCursor.endTime,
                        mod: this.timingCursor.mod
                    } : null
                });
                G.scene = new SceneScore(this.bgUrl, this.music, this.scoreState.scorePoints, this.scoreState.hitResults, this.scoreState.currentScore, this.scoreState.maxCombo, this.data.hitObjects.length);
            }
        }
        this.updateTimingWindow();
        this.hitScoreWindow.update();
    }
    /**
     * Update timing window
     */
    updateTimingWindow() {
        if (this.audio?.playing) {
            this.data.currentTime = G.audio.getCurrentPlayTime(this.audio);
            this.timingWindow.update(this.data.currentTime);
            return;
        }
        this.timingWindow.update(this.data.currentTime);
    }
    updateRecords(score: number, type: string, currentTime: number, preserveCombo = false) {
        applyScore(this.scoreState, score, type, currentTime, preserveCombo);
    }

    updateTimingCursor(currentTime1000: number) {
        if (!this.data.timingPoints.length) {
            this.timingCursor = null;
            return;
        }
        if (!this.timingCursor) {
            this.timingCursor = G.tick.createCursorByTime(currentTime1000, 0);
            return;
        }
        while (this.timingCursor && currentTime1000 >= this.timingCursor.endTime) {
            this.timingCursor = G.tick.nextCursor(this.timingCursor);
        }
        while (this.timingCursor && currentTime1000 < this.timingCursor.startTime) {
            this.timingCursor = G.tick.prevCursor(this.timingCursor, true);
        }
    }

    getHitInputState(): HitInputState {
        const greenPressed = Boolean(G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J));
        const orangePressed = Boolean(G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K));
        const greenReleased = Boolean(G.input.isReleased(G.input.F) || G.input.isReleased(G.input.J));
        const orangeReleased = Boolean(G.input.isReleased(G.input.D) || G.input.isReleased(G.input.K));
        const greenHeld = Boolean(G.input.isRepeated(G.input.F) || G.input.isRepeated(G.input.J));
        const orangeHeld = Boolean(G.input.isRepeated(G.input.D) || G.input.isRepeated(G.input.K));
        const bonusPressed = Boolean(G.input.isPressed(G.input.SPACE));
        const notePressed = greenPressed || orangePressed;
        return {
            greenPressed,
            orangePressed,
            greenReleased,
            orangeReleased,
            greenHeld,
            orangeHeld,
            bonusPressed,
            notePressed,
            anyPressed: notePressed || bonusPressed
        };
    }
    /**
     * Trigger before the scene is terminated
     * @override
     */
    onTerminate() {
        if (this.audio) {
            this.audio.fadeOut(0.5);
            setTimeout(() => this.audio.pause(), 500);
        }
    }

    debugSnapshot(): SceneDebugSnapshot {
        return {
            ...super.debugSnapshot(),
            scene: this.constructor.name,
            summary: this.debugSummary(),
            beatmap: {
                artist: this.data.artist,
                name: this.data.name,
                hitObjects: this.data.hitObjects.length,
                timingPoints: this.data.timingPoints.length
            },
            playback: {
                currentTime: Number(this.data.currentTime.toFixed(3)),
                duration: Number(this.data.duration.toFixed(3)),
                audioPlaying: Boolean(this.audio?.playing),
                countDownTime: this.countDownTime === null ? null : Number(this.countDownTime.toFixed(3))
            },
            timing: this.timingCursor ? {
                cursor: {
                    timingPointIndex: this.timingCursor.timingPointIndex,
                    tickIndex: this.timingCursor.tickIndex,
                    startTime: this.timingCursor.startTime,
                    endTime: this.timingCursor.endTime,
                    metronome: this.timingCursor.metronome,
                    divisor: this.timingCursor.divisor,
                    mod: this.timingCursor.mod
                }
            } : null,
            scoring: {
                hitIndex: this.hitIndex,
                score: this.scoreState.currentScore,
                combo: this.scoreState.currentCombo,
                maxCombo: this.scoreState.maxCombo,
                hitResults: this.scoreState.hitResults
            },
            nextObject: this.data.hitObjects[this.hitIndex] || null
        };
    }

    protected debugSummary(): string[] {
        return [
            `time=${this.data.currentTime.toFixed(3)} / ${this.data.duration.toFixed(3)}`,
            `hitIndex=${this.hitIndex}/${this.data.hitObjects.length}`,
            `score=${this.scoreState.currentScore}, combo=${this.scoreState.currentCombo}, maxCombo=${this.scoreState.maxCombo}`,
            `audioPlaying=${Boolean(this.audio?.playing)}, countDown=${this.countDownTime === null ? 'started' : this.countDownTime.toFixed(3)}`,
            `timingCursor=tp${this.timingCursor?.timingPointIndex ?? '-'} tick${this.timingCursor?.tickIndex ?? '-'}`
        ];
    }
}
