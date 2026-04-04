/**
 * Editor scene
 * @author Rex Zeng
 */

import { DateTime } from 'luxon';
import G from '../Global';
import { appendTimingPointEditingWindow } from '../Functions';
import WindowHelp from '../window/WindowHelp';
import WindowHitObject from '../window/WindowHitObject';
import WindowTimeRuler from '../window/WindowTimeRuler';
import WindowTiming from '../window/WindowTiming';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';
import type { BeatmapData, SoundHandle, TickPosition, TimingEditorWindow } from '../types';

export default class SceneEditor extends SceneBase {
    name: string;
    musicId: number;
    music: any;
    audio!: SoundHandle;
    audioUrl: string;
    bgUrl: string;
    prUrl: string;
    data: BeatmapData;
    storageKey: string;
    uncached: boolean;
    atEdge: boolean;
    currentMode: string;
    timeRulerWindow!: WindowTimeRuler;
    timingWindow!: WindowTiming;
    tpWindow!: TimingEditorWindow;
    hitObjectWindow!: WindowHitObject;
    helpWindow!: WindowHelp;
    pos!: TickPosition;

    constructor(musicId: number) {
        super();
        this.name = 'editor';
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
            playFromTime: 0,
            detail: 4,
            isEditMode: true
        };
        this.storageKey = `${this.music.creator}-${this.music.artist}-${this.music.name}-${this.music.version}`;
        this.uncached = false;
        this.atEdge = false;
        this.currentMode = 'hitObject';
        this.resourceToLoad = {
            audio: [
                'se/hit-00.mp3',
                'se/hit-01.mp3',
                'se/metronome-1.mp3',
                'se/metronome-2.mp3',
                this.audioUrl
            ],
            graphics: [
                'graphics/hit-circle-green.png',
                'graphics/hit-circle-orange.png',
                this.bgUrl
            ]
        };
    }

    async onInitialize() {
        G.audio.pauseBGM();
        this.audio = G.resource.audio(this.audioUrl);
        this.stage.addChild(G.graphics.createImage(this.bgUrl, (_w: number, _h: number, _self: any) => ({
            position: 'center',
            size: 'cover'
        })));
        this.stage.addChild(G.graphics.createRect({
            top: 0,
            left: 0,
            width: 9999,
            height: 9999,
            background: 0x000000,
            opacity: 0.3
        }));
        this.addWindow(this.timeRulerWindow = new WindowTimeRuler());
        this.timingWindow = new WindowTiming(0, this.data.duration = this.audio.buffer.duration);
        this.addWindow(this.timingWindow);
        this.stage.addChild(G.graphics.createText(`Editing [${this.music.artist} - ${this.music.name}]\nPress H for help.`, {}, { x: 20, y: 20 }));
        const res = await fetch(this.prUrl);
        if (res.ok) {
            const data = await res.json();
            this.data.timingPoints = data.timingPoints;
            this.data.hitObjects = data.hitObjects;
        } else {
            console.error(`Get PR file '${this.data.artist} - ${this.data.name}' failed, code ${res.status}`);
        }
        const updateTimingPoint = (t: any[]) => { this.data.timingPoints = t; };
        const updateDivisor = (t: number) => {
            if (G.tick.divisor !== t) {
                G.tick.divisor = t;
                this.timeRulerWindow.repaintAllTimingPoints(this.data.currentTime * 1000);
            }
        };
        this.tpWindow = appendTimingPointEditingWindow(updateTimingPoint, updateDivisor);
        this.tpWindow.style.opacity = '0';
        this.tpWindow.style.visibility = 'hidden';
        this.hitObjectWindow = new WindowHitObject(this.data);
        this.addWindow(this.hitObjectWindow);
        this.helpWindow = new WindowHelp([
            '      H: Toggle this window.',
            '      T: Timing current timing object\'s BPM.',
            '      `: Toggle timing point editing window.',
            '   F, J: Add green note (SHIFT: add slider start / end).',
            '   D, K: Add orange note (SHIFT: add slider start / end).',
            '    DEL: Delete current hit object.',
            '     UP: Add object to switch to upper rail.',
            '   DOWN: Add object to switch to lower rail.',
            '   LEFT: Time back (SHIFT: 10x, CTRL: in millisecond unit).',
            '  RIGHT: Time move (SHIFT: 10x, CTRL: in millisecond unit).',
            '   HOME: Jump to music start.',
            '    END: Jump to music end.',
            '  SPACE: Toggle play / pause.',
            '    ESC: Return to music select scene or cancel slider edition.'
        ]);
        this.addWindow(this.helpWindow);
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            const parsed = JSON.parse(savedData) as { time: string; data: any };
            if (confirm(`Found cached data at ${parsed.time}, would you like to load it?`)) {
                this.data = parsed.data;
                this.updateFromCachedData();
                localStorage.removeItem(this.storageKey);
                alert('Data loaded, cache has been erased, you have to press Ctrl+S to cache it again.');
            } else if (confirm('Would you like to erase this cache?')) {
                localStorage.removeItem(this.storageKey);
                alert('Cached data has been erased.');
            }
        } else {
            this.updateFromCachedData();
        }
    }

    update() {
        if (this.data.currentTime >= this.data.duration) {
            this.audio.pause();
            this.data.currentTime = this.data.duration;
        }
        if (this.audio.playing && this.data.currentTime * 1000 >= this.pos.r) {
            this.pos = G.tick.next(this.pos.tp, this.pos.tick);
            if (this.tpWindow.style.opacity === '1') {
                const index = G.tick.getTickModNumber(this.pos.tp, this.pos.tick, G.input.isRepeated(G.input.CTRL));
                if (index.divisor === 0) {
                    const soundName = (index.tick === 0) ? 2 : 1;
                    G.audio.playSE(`se/metronome-${soundName}.mp3`);
                }
            }
        }
        if (this.audio.playing) {
            this.timeRulerWindow.paintTpRightTo(this.data.currentTime * 1000);
        }
        this.updateInputs();
        this.updatePlayFromTime();
        this.updateTimingWindow();
        this.hitObjectWindow.update(this.data.currentTime);
    }

    onTerminate() {
        this.audio.fadeOut(0.5);
        this.tpWindow.destroy();
        setTimeout(() => this.audio.pause(), 500);
    }

    updateFromCachedData() {
        G.tick.tp = this.data.timingPoints;
        this.pos = G.tick.findPositionByTime(this.data.currentTime * 1000, 0);
        this.timeRulerWindow.repaintAllTimingPoints(0);
        this.tpWindow.timingPoints = this.data.timingPoints;
        (this.tpWindow.querySelector('#bpm') as HTMLInputElement).value = String(this.data.timingPoints[0].bpm1000);
        (this.tpWindow.querySelector('#pos') as HTMLInputElement).value = String(this.data.timingPoints[0].pos1000);
        (this.tpWindow.querySelector('tbody') as HTMLTableSectionElement).innerHTML = this.data.timingPoints.map((item: any) => {
            const kiai = item.kiai ? 'Yes' : '';
            return [
                '<tr>',
                '<td><button id="timing-point-remove">Remove</button></td>',
                `<td>${item.pos1000 / 1000}</td>`,
                `<td>${item.bpm1000 / 1000}</td>`,
                `<td>${item.metronome}/4</td>`,
                `<td>${kiai}</td>`,
                '</tr>'
            ].join('');
        }).join('');
    }

    updateInputs() {
        if (G.input.isPressed(G.input.H)) {
            this.helpWindow.stage.visible = !this.helpWindow.stage.visible;
            this.tpWindow.style.display = this.helpWindow.stage.visible ? 'none' : 'block';
        } else if (G.input.isPressed(G.input.APOSTROPHE)) {
            this.hitObjectWindow.stage.visible = !this.hitObjectWindow.stage.visible;
            this.tpWindow.style.opacity = String(1 - Number(this.tpWindow.style.opacity));
            this.tpWindow.style.visibility = Number(this.tpWindow.style.opacity) ? 'visible' : 'hidden';
        } else if (G.input.isRepeated(G.input.CTRL) && G.input.isRepeated(G.input.S)) {
            const dt = DateTime.now().toFormat('yyyy-M-d H:m:s');
            localStorage.setItem(this.storageKey, JSON.stringify({ time: dt, data: this.data }));
            alert(`Data has been cached in localStorage at ${dt}.`);
            this.uncached = false;
        } else if (G.input.isPressed(G.input.F12)) {
            alert('Now I will show curren data in new window and assume you have saved them in .pr file.');
            const data = JSON.stringify({ timingPoints: this.data.timingPoints, hitObjects: this.data.hitObjects });
            const newWindow = window.open('', '', 'height=500,width=500,top=20,left=20,menubar=no,scrollbars=yes,resizable=yes');
            if (newWindow) {
                newWindow.document.title = `Content of beatmap '${this.storageKey}'`;
                newWindow.document.body.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-all"></pre>';
                (newWindow.document.querySelector('pre') as HTMLElement).innerText = data;
            } else {
                console.log(data);
                alert('Failed to open window! Please allow popup window. Data has logged to console.');
            }
            this.uncached = false;
        } else if (G.input.isPressed(G.input.SPACE)) {
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
                    this.audio.fadeIn(0);
                }
            }
        } else if (G.input.isPressed(G.input.LEFT)) {
            if (this.data.currentTime === 0) return;
            if (G.input.isRepeated(G.input.CTRL)) {
                const count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
                this.setPlayFrom(this.data.currentTime - 0.001 * count);
                this.timeRulerWindow.paintTpLeftTo(this.data.currentTime * 1000);
                return;
            }
            if (this.data.timingPoints.length !== 0) {
                let count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
                let currentTime = 0;
                while (count--) {
                    this.pos = G.tick.prev(this.pos.tp, this.pos.tick, this.atEdge);
                    currentTime = this.pos.l;
                }
                this.atEdge = true;
                this.setPlayFrom(currentTime / 1000);
                this.timeRulerWindow.paintTpLeftTo(this.data.currentTime * 1000);
            }
        } else if (G.input.isPressed(G.input.RIGHT)) {
            if (this.data.currentTime === this.data.duration) return;
            if (G.input.isRepeated(G.input.CTRL)) {
                const count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
                this.setPlayFrom(this.data.currentTime + 0.001 * count);
                this.timeRulerWindow.paintTpRightTo(this.data.currentTime * 1000);
                return;
            }
            if (this.data.timingPoints.length !== 0) {
                let count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
                let currentTime = 0;
                while (count--) {
                    this.pos = G.tick.next(this.pos.tp, this.pos.tick);
                    currentTime = this.pos.l;
                }
                this.atEdge = true;
                this.setPlayFrom(currentTime / 1000);
                this.timeRulerWindow.paintTpRightTo(this.data.currentTime * 1000);
            }
        } else if (G.input.isPressed(G.input.HOME)) {
            this.pos = G.tick.findPositionByTime(0);
            this.pos.metronome = G.tick.tp[this.pos.tp].metronome;
            this.pos.divisor = G.tick.divisor;
            this.atEdge = false;
            this.setPlayFrom(0);
            this.timeRulerWindow.repaintAllTimingPoints(0);
        } else if (G.input.isPressed(G.input.END)) {
            this.pos = G.tick.findPositionByTime(this.data.duration * 1000);
            this.pos.metronome = G.tick.tp[this.pos.tp].metronome;
            this.pos.divisor = G.tick.divisor;
            this.atEdge = false;
            this.setPlayFrom(this.data.duration);
            this.timeRulerWindow.repaintAllTimingPoints(this.data.duration * 1000);
        } else if (G.input.isPressed(G.input.ESC)) {
            if (this.uncached && !confirm('Your work has not been cached, quit by force?')) {
                return;
            }
            this.tpWindow.style.opacity = '0';
            G.audio.playSE('se/menu-back.mp3');
            G.scene = new SceneMusicSelect();
        } else if (G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)) {
            this.uncached = true;
            G.audio.playSE('se/hit-01.mp3');
            this.hitObjectWindow.insertHitObject({ type: G.input.isPressed(G.input.SHIFT) ? 1 : 0, color: 0 });
        } else if (G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J)) {
            this.uncached = true;
            G.audio.playSE('se/hit-00.mp3');
            this.hitObjectWindow.insertHitObject({ type: G.input.isPressed(G.input.SHIFT) ? 1 : 0, color: 1 });
        } else if (G.input.isPressed(G.input.DELETE)) {
            this.uncached = true;
            this.hitObjectWindow.removeHitObject();
        }
    }

    updateTimingWindow() {
        if (this.audio.playing) {
            this.data.currentTime = G.audio.getCurrentPlayTime(this.audio);
        }
        this.timingWindow.update(this.data.currentTime);
    }

    updatePlayFromTime() {
        if (this.data.playFromTime >= 0) {
            const wasPlaying = this.audio.playing;
            this.audio.pause();
            if (wasPlaying && this.data.currentTime < this.data.duration) {
                this.audio.playFrom(this.data.playFromTime);
                this.data.playFromTime = -1;
            }
        }
    }

    setPlayFrom(time: number) {
        if (time < 0) {
            time = 0;
        } else if (time > this.data.duration) {
            time = this.data.duration;
        }
        this.data.playFromTime = time;
        this.data.currentTime = time;
    }
}
