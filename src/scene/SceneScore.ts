/**
 * Result scene
 * @author Rex Zeng
 */

import G from '../Global';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';
import type { MusicMeta, SceneDebugSnapshot } from '../types';

function getRank(score: number, totalObjects: number, hitResults: Record<string, number>) {
    if (totalObjects <= 0) {
        return 'N/A';
    }
    const perfect = (hitResults['300g'] || 0) + (hitResults['300'] || 0);
    const accuracy = score <= 0 ? 0 : perfect / totalObjects;
    if (accuracy >= 0.95) return 'SS';
    if (accuracy >= 0.85) return 'S';
    if (accuracy >= 0.7) return 'A';
    if (accuracy >= 0.5) return 'B';
    return 'C';
}

export default class SceneScore extends SceneBase {
    bgUrl: string;
    music: MusicMeta;
    scorePoints: Record<number, number>;
    hitResults: Record<string, number>;
    score: number;
    combo: number;
    totalObjects: number;

    constructor(bgUrl: string, music: MusicMeta, scorePoints: Record<number, number>, hitResults: Record<string, number>, score: number, combo: number, totalObjects: number) {
        super();
        this.bgUrl = bgUrl;
        this.music = music;
        this.scorePoints = scorePoints;
        this.hitResults = hitResults;
        this.score = score;
        this.combo = combo;
        this.totalObjects = totalObjects;
    }

    async onInitialize() {
        const rank = getRank(this.score, this.totalObjects, this.hitResults);
        const totalHits = Object.values(this.hitResults).reduce((sum, value) => sum + value, 0);
        const accuracyBase = this.totalObjects > 0 ? Math.min(100, totalHits <= 0 ? 0 : (
            ((this.hitResults['50'] || 0) * 50
            + (this.hitResults['100'] || 0) * 100
            + (this.hitResults['200'] || 0) * 200
            + ((this.hitResults['300'] || 0) + (this.hitResults['300g'] || 0)) * 300)
            / (this.totalObjects * 300) * 100
        )) : 0;

        this.stage.addChild(G.graphics.createImage(this.bgUrl, (_w: number, _h: number, _self: any) => ({
            position: 'center',
            size: 'cover'
        })));
        this.stage.addChild(G.graphics.createRect({
            top: 0,
            left: 0,
            width: 9999,
            height: 9999,
            background: 0x081018,
            opacity: 0.72
        }));

        this.stage.addChild(G.graphics.createRect({
            top: window.innerHeight * 0.5 - 290,
            left: window.innerWidth * 0.5 - 430,
            width: 860,
            height: 580,
            background: 0x0d1620,
            borderWidth: 2,
            borderColor: 0xffffff,
            opacity: 0.82
        }));

        this.stage.addChild(G.graphics.createText('Result', { fontSize: 54, fill: '#f6fbff' }, { x: window.innerWidth * 0.5 - 390, y: window.innerHeight * 0.5 - 220 }));
        this.stage.addChild(G.graphics.createText(`${this.music.artist} - ${this.music.name}`, { fontSize: 26, fill: '#c6d7e6' }, { x: window.innerWidth * 0.5 - 385, y: window.innerHeight * 0.5 - 155 }));

        const rankText = G.graphics.createText(rank, { fontSize: 160, fill: '#8be0ff' }, { x: 0, y: 0 });
        rankText.x = window.innerWidth * 0.5 + 360 - rankText.width;
        rankText.y = window.innerHeight * 0.5 - 220;
        this.stage.addChild(rankText);
        this.stage.addChild(G.graphics.createText(`Score\n${this.score.toString().padStart(7, '0')}`, { fontSize: 34, fill: '#ffffff' }, { x: window.innerWidth * 0.5 - 385, y: window.innerHeight * 0.5 - 70 }));
        this.stage.addChild(G.graphics.createText(`Max Combo\n${this.combo}`, { fontSize: 32, fill: '#ffd27a' }, { x: window.innerWidth * 0.5 - 385, y: window.innerHeight * 0.5 + 45 }));
        this.stage.addChild(G.graphics.createText(`Accuracy\n${accuracyBase.toFixed(2)}%`, { fontSize: 32, fill: '#9ff0b0' }, { x: window.innerWidth * 0.5 - 120, y: window.innerHeight * 0.5 + 45 }));

        const buckets = [
            ['Perfect+', this.hitResults['300g'] || 0, '#ffe082'],
            ['Perfect', this.hitResults['300'] || 0, '#ffca28'],
            ['Great', this.hitResults['200'] || 0, '#26c6da'],
            ['Good', this.hitResults['100'] || 0, '#42a5f5'],
            ['Normal', this.hitResults['50'] || 0, '#b0bec5'],
            ['Miss', (this.hitResults['0'] || 0) + (this.hitResults['-1'] || 0) + (this.hitResults['-2'] || 0), '#ef5350']
        ];

        buckets.forEach(([label, value, color], index) => {
            this.stage.addChild(G.graphics.createText(`${label}  ${value}`, { fontSize: 28, fill: String(color) }, {
                x: window.innerWidth * 0.5 + 110,
                y: window.innerHeight * 0.5 - 20 + index * 52
            }));
        });

        this.stage.addChild(G.graphics.createText('Press ESC or ENTER to return to music select.', { fontSize: 22, fill: '#d7e4f0' }, {
            x: window.innerWidth * 0.5 - 390,
            y: window.innerHeight * 0.5 + 250
        }));
    }

    update() {
        if (G.input.isPressed(G.input.ESC) || G.input.isPressed(G.input.ENTER)) {
            G.audio.playSE('se/menu-back.mp3');
            G.mode = 'play';
            G.scene = new SceneMusicSelect();
        }
    }

    debugSnapshot(): SceneDebugSnapshot {
        return {
            ...super.debugSnapshot(),
            scene: this.constructor.name,
            summary: this.debugSummary(),
            result: {
                score: this.score,
                combo: this.combo,
                totalObjects: this.totalObjects,
                hitResults: this.hitResults,
                scorePointCount: Object.keys(this.scorePoints).length
            }
        };
    }

    protected debugSummary(): string[] {
        return [
            `score=${this.score}`,
            `combo=${this.combo}`,
            `totalObjects=${this.totalObjects}`,
            `resultBuckets=${Object.keys(this.hitResults).length}`
        ];
    }
}
