/**
 * Editor scene
 * @author Rex Zeng
 */

import G from '../Global';
import Tick from '../Tick';
import {
    setPosition,
    appendTimingPointEditingWindow,
} from '../Functions';
import WindowTiming from '../window/WindowTiming';
import WindowHelp from '../window/WindowHelp';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';
import moment from 'moment';

const {
    MAIN_FONT,
    MAIN_FONT_SIZE,
} = G.constant;

/**
 * Define editor scene
 * @class
 */
export default class SceneEditor extends SceneBase {
    /**
     * @constructor
     */
    constructor(musicId) {
        super();
        this.name = 'editor';
        this.musicId = musicId;
        this.music = G.musics[musicId];
        this.audio = null;
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
        };
        this.storageKey = `${this.music.creator}-${this.music.artist}-${this.music.name}-${this.music.version}`;
        this.uncached = false;
    }
    /**
     * Trigger when scene is initialized
     * @param {function} next - Provided by then.js
     * @override
     */
    onInitialize(next) {
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
        // load background
        this.loadBackground(this.bgUrl);
        // load pr file
        fetch(this.prUrl).then(res => {
            if (res.ok) {
                res.json().then(data => {
                    this.data.timingPoints = data.timingPoints;
                    this.data.hitObjects = data.hitObjects;
                    Tick.setTp(data.timingPoints);
                    Tick.setTime(this.data.currentTime * 1000, true);
                    this.updateFromCachedData();
                });
            } else {
                console.error(`Get PR file '${this.data.artist} - ${this.data.name}' failed, code ${res.status}`); // eslint-disable-line no-console
            }
        });
        // display loading text
        this.audio = G.resource.get(this.audioUrl);
        if (!this.audio) {
            this.loadingTextSprite = new PIXI.Text('Music must be preloaded for editor, please wait...', {
                fontFamily: MAIN_FONT,
                fontSize: MAIN_FONT_SIZE,
                fill: '#FFF',
            });
            this.loadingTextSprite.anchor.x = 0.5;
            this.loadingTextSprite.anchor.y = 0.5;
            setPosition(this.loadingTextSprite, () => ({
                x: 0.5 * window.innerWidth,
                y: 0.5 * window.innerHeight,
            }));
            this.stage.addChild(this.loadingTextSprite);
        }
        // hint text
        this.hintTextSprite = new PIXI.Text(`Editing \`${this.music.artist} - ${this.music.name}\`\nPress H for help.`, {
            fontFamily: MAIN_FONT,
            fontSize: MAIN_FONT_SIZE,
            fill: '#FFF',
        });
        setPosition(this.hintTextSprite, () => ({
            x: 20,
            y: 20,
        }));
        this.stage.addChild(this.hintTextSprite);
        // help window
        this.helpWindow = new WindowHelp([
            '      H: Toggle this window.',
            '      T: Timing current timing object\'s BPM.',
            '      `: Toggle timing point editing window.',
            '      D: Add green note.',
            'SHIFT+D: Add green slider start point / end point.',
            '      F: Add orange note.',
            'SHIFT+F: Add orange slider start point / end point.',
            '    DEL: Delete current hit object.',
            '     UP: Add object to switch to upper rail.',
            '   DOWN: Add object to switch to lower rail.',
            '   LEFT: Set player back (SHIFT to 10x it).',
            '  RIGHT: Set player move (SHIFT to 10x it).',
            '   HOME: Jump to music start.',
            '    END: Jump to music end.',
            '  SPACE: Toggle play / pause.',
            '    ESC: Return to music select scene or cancel slider edition.',
        ]);
        this.helpWindow.stage.visible = false;
        this.stage.addChild(this.helpWindow.stage);
        // window for editing timing points
        this.editWindow = appendTimingPointEditingWindow(t => this.data.timingPoints = t);
        this.editWindowShown = false;
        // load cached data
        let savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            savedData = JSON.parse(savedData);
            if (confirm(`Found cached data at ${savedData.time}, would you like to load it?`)) {
                this.data = savedData.data;
                localStorage.removeItem(this.storageKey);
                alert('Data loaded, cache has been erased, you have to press Ctrl+S to cache it again.');
            } else if (confirm('Would you like to erase this cache?')) {
                localStorage.removeItem(this.storageKey);
                alert('Cached data has been erased.');
            }
        }
        next();
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        this.updateBackground(this.bgUrl);
        this.audio = G.resource.getAudio(this.audioUrl);
        if (!this.audio) {
            // you can do nothing but return to music select scene before audio is loaded
            if (G.input.isPressed(G.input.ESC)) {
                G.scene = new SceneMusicSelect;
            }
        } else {
            if (!this.editWindowShown) {
                this.editWindow.show();
                this.editWindowShown = true;
            }
            this.loadingTextSprite.visible = false;
            // auto pause when finish playing
            if (this.data.currentTime >= this.data.duration) {
                this.audio.pause();
                this.data.currentTime = this.data.duration;
            }
            // update tick
            const tickReturn = Tick.setTime(this.data.currentTime * 1000);
            if (tickReturn && this.audio.playing) {
                sounds[`se/metronome-${tickReturn}.mp3`].play();
            }
            // other updates
            this.updateInputs();
            this.updatePlayFromTime();
            this.updateTimingWindow();
            this.updateEditor();
        }
    }
    /**
     * Trigger before the scene is terminated
     * @override
     */
    onTerminate() {
        super.onTerminate();
        this.editWindow.destroy();
    }
    /**
     * Update timing points and hit objects from cached data
     */
    updateFromCachedData() {
        this.editWindow.querySelector('tbody').innerHTML = this.data.timingPoints.map(item => {
            const kiai = (item.kiai) ? 'Yes' : '';
            return [
                '<tr>',
                    '<td>',
                        '<button id="timing-point-remove">Remove</button>',
                    '</td>',
                    `<td>${item.pos1000 / 1000}</td>`,
                    `<td>${item.bpm1000 / 1000}</td>`,
                    `<td>${item.metronome}/4</td>`,
                    `<td>${kiai}</td>`,
                '</tr>',
            ].join('');
        }).join('');
    }
    /**
     * Update inputs
     */
    updateInputs() {
        if (G.input.isPressed(G.input.H)) {
            this.helpWindow.stage.visible = !this.helpWindow.stage.visible;
            if (this.helpWindow.stage.visible) {
                this.editWindow.hide();
            } else if (this.audio) {
                this.editWindow.show();
            }
        } else if (G.input.isRepeated(G.input.CTRL) && G.input.isRepeated(G.input.S)) {
            // CTRL+S to save to localStorage
            const dt = moment().format('Y-m-d H:m:s');
            localStorage.setItem(this.storageKey, JSON.stringify({
                time: dt,
                data: this.data,
            }));
            this.uncached = false;
            alert(`Data has been cached in localStorage at ${dt}.`);
        } else if (G.input.isPressed(G.input.F12)) {
            // F12 to export data
            const newWindow = window.open('', this.storageKey, 'height=500,width=500,top=20,left=20,menubar=no,scrollbars=yes,resizable=yes');
            if (newWindow) {
                newWindow.document.body.innerText = JSON.stringify(this.data);
            } else {
                console.log(JSON.stringify({
                    timingPoints: this.data.timingPoints,
                    hitObjects: this.data.hitObjects,
                })); // eslint-disable-line no-console
                alert('Failed to open window! Please allow popup window. Data has logged to console.');
            }
        } else if (G.input.isPressed(G.input.SPACE)) {
            // SPACE to toggle play and pause
            if (this.audio) {
                if (this.audio.playing) {
                    this.audio.pause();
                } else if (this.data.currentTime < this.data.duration) {
                    if (this.data.playFromTime >= 0) {
                        this.audio.playFrom(this.data.playFromTime);
                        this.data.playFromTime = -1;
                    } else {
                        this.audio.play();
                    }
                }
            }
        } else if (G.input.isRepeated(G.input.LEFT)) {
            if (this.data.timingPoints.length == 0) {
                this.setPlayFrom(this.data.currentTime - (G.input.isRepeated(G.input.SHIFT) ? 1 : 0.1));
            } else {
                this.setPlayFrom(Tick.prevTickTime1000 / 1000);
                Tick.setTime(Tick.prevTickTime1000, true);
            }
        } else if (G.input.isRepeated(G.input.RIGHT)) {
            if (this.data.timingPoints.length == 0) {
                this.setPlayFrom(this.data.currentTime + (G.input.isRepeated(G.input.SHIFT) ? 1 : 0.1));
            } else {
                this.setPlayFrom(Tick.nextTickTime1000 / 1000);
                Tick.setTime(Tick.nextTickTime1000, true);
            }
        } else if (G.input.isPressed(G.input.HOME)) {
            this.setPlayFrom(0);
            Tick.setTime(0, true);
        } else if (G.input.isPressed(G.input.END)) {
            this.setPlayFrom(this.data.duration);
            Tick.setTime(this.data.duration * 1000, true);
        } else if (G.input.isPressed(G.input.ESC)) {
            // ESC to back to title
            if (this.uncached && !confirm('Your work has not been cached, quit by force?')) {
                return;
            }
            this.editWindow.hide();
            G.scene = new SceneMusicSelect;
        }
    }
    /**
     * Update timing window
     */
    updateTimingWindow() {
        if (this.timingWindow) {
            if (this.audio.playing) {
                this.data.currentTime = G.resource.getCurrentPlayTime(this.audio);
            }
            this.timingWindow.update(this.data.currentTime);
        } else {
            this.data.duration = this.audio.buffer.duration;
            this.timingWindow = new WindowTiming(this.data.currentTime, this.data.duration);
            this.audio.startOffset = 0;
            this.stage.addChild(this.timingWindow.stage);
        }
    }
    /**
     * Update play-from time
     */
    updatePlayFromTime() {
        if (this.data.playFromTime >= 0) {
            const wasPlaying = this.audio.playing;
            this.audio.pause();
            if (wasPlaying && this.currentTime < this.duration) {
                this.audio.playFrom(this.data.playFromTime);
                this.data.playFromTime = -1;
            }
        }
    }
    /**
     * Set play-from time
     * @param {number} time - Seconds
     */
    setPlayFrom(time) {
        // avoid side effects
        if (time < 0) {
            time = 0;
        } else if (time > this.data.duration) {
            time = this.data.duration;
        }
        this.data.playFromTime = time;
        this.data.currentTime = time;
    }
    /**
     * Update all editor elements
     */
    updateEditor() {

    }
}
