/**
 * Editor scene
 * @author Rex Zeng
 */

import G from '../Global';
import { appendTimingPointEditingWindow } from '../Functions';
import { sanitizeBeatmapData } from '../gameplay/BeatmapSanitizer';
import WindowHelp from '../window/WindowHelp';
import WindowHitObject from '../window/WindowHitObject';
import WindowKeyState from '../window/WindowKeyState';
import WindowTimeRuler from '../window/WindowTimeRuler';
import WindowTiming from '../window/WindowTiming';
import SceneBase from './SceneBase';
import type { BeatmapData, MusicMeta, SceneDebugSnapshot, SoundHandle, TickCursor, TimingEditorWindow, TimingPoint } from '../types';
import SceneEditorCommandHistory from './SceneEditorCommandHistory';
import { runSceneEditorCommands } from './SceneEditorCommands';

function formatTimingPointRows(timingPoints: TimingPoint[]) {
    return timingPoints.map((item) => {
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

export default class SceneEditor extends SceneBase {
    name: string;
    musicId: number;
    music: MusicMeta;
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
    keyStateWindow!: WindowKeyState;
    pos!: TickCursor;
    commandHistory: SceneEditorCommandHistory;
    leftScrubStartedAt: number;
    leftScrubLastStepAt: number;
    rightScrubStartedAt: number;
    rightScrubLastStepAt: number;
    sliderAdjustStartedAt: number;
    sliderAdjustLastStepAt: number;

    constructor(musicId: number) {
        super();
        this.name = 'editor';
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
            playFromTime: 0,
            detail: 4,
            isEditMode: true
        };
        this.storageKey = `${this.music.creator}-${this.music.artist}-${this.music.name}-${this.music.version}`;
        this.uncached = false;
        this.atEdge = false;
        this.currentMode = 'hitObject';
        this.commandHistory = new SceneEditorCommandHistory();
        this.leftScrubStartedAt = 0;
        this.leftScrubLastStepAt = 0;
        this.rightScrubStartedAt = 0;
        this.rightScrubLastStepAt = 0;
        this.sliderAdjustStartedAt = 0;
        this.sliderAdjustLastStepAt = 0;
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
        if (!this.audio) {
            window.Debug?.log('editor', 'Audio resource missing, aborting editor', { audioUrl: this.audioUrl });
            G.scene = new SceneMusicSelect();
            return;
        }
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
            const rawData = await res.json();
            const sanitized = sanitizeBeatmapData({
                ...this.data,
                timingPoints: rawData.timingPoints,
                hitObjects: rawData.hitObjects,
                duration: this.audio.buffer.duration
            });
            this.data = sanitized;
        } else {
            console.error(`Get PR file '${this.data.artist} - ${this.data.name}' failed, code ${res.status}`);
            window.Debug?.log('editor', 'Failed to load beatmap file', {
                artist: this.data.artist,
                name: this.data.name,
                status: res.status
            });
        }
        const updateTimingPoint = (t: TimingPoint[]) => { this.data.timingPoints = t; };
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
        this.keyStateWindow = new WindowKeyState();
        this.addWindow(this.keyStateWindow);
        this.helpWindow = new WindowHelp([
            '      H: Toggle this window.',
            '      T: Timing current timing object\'s BPM.',
            '      `: Toggle timing point editing window.',
            ' Timing panel Add/Remove buttons are undoable.',
            ' Timing panel Apply button is undoable.',
            ' F/J or D/K + arrow: Add slider on current rail.',
            '   F, J: Add green note.',
            '   D, K: Add orange note.',
            'Ctrl+SPACE: Add bonus switch object.',
            'Alt+LEFT/RIGHT: normal note -> slider, or adjust slider/bonus duration.',
            'Alt+UP/DOWN: adjust bonus delta.',
            '    DEL: Delete current hit object.',
            ' Ctrl+Z: Undo last beatmap command.',
            ' Ctrl+Y: Redo last undone beatmap command.',
            '   LEFT: Time back (SHIFT: 10x, CTRL: in millisecond unit).',
            '  RIGHT: Time move (SHIFT: 10x, CTRL: in millisecond unit).',
            '   HOME: Jump to music start.',
            '    END: Jump to music end.',
            '  SPACE: Toggle play / pause.',
            'Ctrl+Shift+D: Toggle debug HUD.',
            'Ctrl+Shift+J: Open runtime debug snapshot.',
            '    ESC: Return to music select scene or cancel slider edition.'
        ]);
        this.addWindow(this.helpWindow);
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            const parsed = JSON.parse(savedData) as { time: string; data: any };
            if (confirm(`Found cached data at ${parsed.time}, would you like to load it?`)) {
                this.data = sanitizeBeatmapData({ ...parsed.data, duration: this.audio.buffer.duration, isEditMode: true });
                this.updateFromCachedData();
                localStorage.removeItem(this.storageKey);
                window.Debug?.log('editor', 'Restored beatmap from local cache', { storageKey: this.storageKey });
                alert('Data loaded, cache has been erased, you have to press Ctrl+S to cache it again.');
            } else if (confirm('Would you like to erase this cache?')) {
                localStorage.removeItem(this.storageKey);
                window.Debug?.log('editor', 'Removed local beatmap cache', { storageKey: this.storageKey });
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
        if (this.audio.playing && this.data.currentTime * 1000 >= this.pos.endTime) {
            this.pos = G.tick.nextCursor(this.pos, Boolean(G.input.isRepeated(G.input.CTRL)));
            if (this.tpWindow.style.opacity === '1') {
                const index = this.pos.mod;
                if (index.divisor === 0) {
                    const soundName = (index.tick === 0) ? 2 : 1;
                    G.audio.playSE(`se/metronome-${soundName}.mp3`);
                }
            }
        }
        if (this.audio.playing) {
            this.timeRulerWindow.paintTpRightTo(this.data.currentTime * 1000);
        }
        if (!this.pos) {
            this.updateTimingWindow();
            this.keyStateWindow.update();
            return;
        }
        this.updateInputs();
        this.updatePlayFromTime();
        this.updateTimingWindow();
        this.hitObjectWindow.update(this.data.currentTime);
        this.keyStateWindow.update();
    }

    onTerminate() {
        if (this.audio) {
            this.audio.fadeOut(0.5);
        }
        this.tpWindow?.destroy();
        setTimeout(() => this.audio?.pause(), 500);
    }

    updateFromCachedData() {
        this.data = sanitizeBeatmapData({ ...this.data, duration: this.audio.buffer.duration, isEditMode: true });
        G.tick.tp = this.data.timingPoints;
        this.pos = G.tick.createCursorByTime(this.data.currentTime * 1000, 0);
        this.timeRulerWindow.repaintAllTimingPoints(0);
        this.tpWindow.timingPoints = this.data.timingPoints;
        this.tpWindow.selectedTimingPointIndex = Math.min(this.tpWindow.selectedTimingPointIndex ?? 0, Math.max(this.data.timingPoints.length - 1, 0));
        const selectedTimingPoint = this.data.timingPoints[this.tpWindow.selectedTimingPointIndex] || this.data.timingPoints[0];
        if (!selectedTimingPoint) {
            return;
        }
        (this.tpWindow.querySelector('#bpm') as HTMLInputElement).value = String(selectedTimingPoint.bpm1000);
        (this.tpWindow.querySelector('#pos') as HTMLInputElement).value = String(selectedTimingPoint.pos1000);
        (this.tpWindow.querySelector('#metronome') as HTMLInputElement).value = String(selectedTimingPoint.metronome);
        (this.tpWindow.querySelector('#kiai-time') as HTMLInputElement).checked = Boolean(selectedTimingPoint.kiai);
        (this.tpWindow.querySelector('tbody') as HTMLTableSectionElement).innerHTML = formatTimingPointRows(this.data.timingPoints);
    }

    updateInputs() {
        runSceneEditorCommands(this);
    }

    updateTimingWindow() {
        if (this.audio?.playing) {
            this.data.currentTime = G.audio.getCurrentPlayTime(this.audio);
        }
        this.timingWindow.update(this.data.currentTime);
    }

    updatePlayFromTime() {
        if (!this.audio) {
            this.data.playFromTime = -1;
            return;
        }
        if (this.data.playFromTime >= 0) {
            const wasPlaying = Boolean(this.audio?.playing);
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

    debugSnapshot(): SceneDebugSnapshot {
        return {
            ...super.debugSnapshot(),
            scene: this.constructor.name,
            summary: this.debugSummary(),
            beatmap: {
                artist: this.data.artist,
                name: this.data.name,
                timingPoints: this.data.timingPoints.length,
                hitObjects: this.data.hitObjects.length,
                uncached: this.uncached,
                timingPointPreview: this.data.timingPoints.slice(0, 5).map(item => ({
                    pos1000: item.pos1000,
                    bpm1000: item.bpm1000,
                    metronome: item.metronome,
                    kiai: Boolean(item.kiai)
                }))
            },
            playback: {
                currentTime: Number(this.data.currentTime.toFixed(3)),
                duration: Number(this.data.duration.toFixed(3)),
                playFromTime: Number(this.data.playFromTime.toFixed(3)),
                audioPlaying: Boolean(this.audio?.playing)
            },
            cursor: this.pos ? {
                timingPointIndex: this.pos.timingPointIndex,
                tickIndex: this.pos.tickIndex,
                leftEdge: this.pos.startTime,
                rightEdge: this.pos.endTime,
                metronome: this.pos.metronome,
                divisor: this.pos.divisor,
                mod: this.pos.mod
            } : null,
            ui: {
                helpVisible: Boolean(this.helpWindow?.stage.visible),
                timingPanelVisible: this.tpWindow?.style.visibility === 'visible',
                currentMode: this.currentMode,
                commandHistory: this.commandHistory.snapshot(10)
            }
        };
    }

    protected debugSummary(): string[] {
        return [
            `time=${this.data.currentTime.toFixed(3)} / ${this.data.duration.toFixed(3)}`,
            `hitObjects=${this.data.hitObjects.length}, timingPoints=${this.data.timingPoints.length}`,
            `cursor=tp${this.pos?.timingPointIndex ?? '-'} tick${this.pos?.tickIndex ?? '-'}`,
            `audioPlaying=${Boolean(this.audio?.playing)}, uncached=${this.uncached}`
        ];
    }
}
