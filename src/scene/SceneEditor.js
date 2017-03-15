/**
 * Editor scene
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
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
        // loading text
        const audio = G.resource.get(this.audioUrl);
        if (!audio) {
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
        this.hintTextSprite = new PIXI.Text(`Editing \`${this.music.artist} - ${this.music.name}\`\n\nPress H for help.`, {
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
            '          H: Toggle this window.',
            '          T: Timing BPM.',
            '          D: Add green note.',
            '    SHIFT+D: Add green slider start point / end point.',
            '          F: Add orange note.',
            '    SHIFT+F: Add orange slider start point / end point.',
            '         UP: Switch to upper rail.',
            '       DOWN: Switch to lower rail.',
            '       LEFT: Set player back.',
            ' SHIFT+LEFT: Set player back ten times.',
            '      RIGHT: Set player move.',
            'SHIFT+RIGHT: Set player move ten times.',
            '       HOME: Jump to music start.',
            '        END: Jump to music end.',
            '      SPACE: Toggle play / pause.',
            '        ESC: Return to music select scene, or cancel if slider is being add.',
        ]);
        this.helpWindow.stage.visible = false;
        this.stage.addChild(this.helpWindow.stage);
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
            this.loadingTextSprite.visible = false;
            // auto pause when finish playing
            if (this.data.currentTime >= this.data.duration) {
                this.audio.pause();
                this.data.currentTime = this.data.duration;
            }
            this.updateInputs();
            this.updatePlayFromTime();
            this.updateTimingWindow();
            this.updateEditor();
        }
    }
    /**
     * Update inputs
     */
    updateInputs() {
        if (G.input.isPressed(G.input.H)) {
            this.helpWindow.stage.visible = !this.helpWindow.stage.visible;
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
                console.log(JSON.stringify(this.data)); // eslint-disable-line no-console
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
            this.setPlayFrom(this.data.currentTime - (G.input.isRepeated(G.input.SHIFT) ? 1 : 0.1));
        } else if (G.input.isRepeated(G.input.RIGHT)) {
            this.setPlayFrom(this.data.currentTime + (G.input.isRepeated(G.input.SHIFT) ? 1 : 0.1));
        } else if (G.input.isPressed(G.input.HOME)) {
            this.setPlayFrom(0);
        } else if (G.input.isPressed(G.input.END)) {
            this.setPlayFrom(this.data.duration);
        } else if (G.input.isPressed(G.input.ESC)) {
            // ESC to back to title
            if (this.uncached && !confirm('Your work has not been cached, quit by force?')) {
                return;
            }
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
