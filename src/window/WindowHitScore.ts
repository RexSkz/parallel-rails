/**
 * Hit score window
 * @author Rex Zeng
 */

import G from '../Global';
import type { ScoreTextSprite } from '../types';
import WindowBase from './WindowBase';

export default class WindowHitScore extends WindowBase {
    sprites: ScoreTextSprite[];
    numberToText: Record<number, string>;
    numberToColor: Record<number, string>;

    constructor() {
        super();
        this.sprites = [];
        this.numberToText = {
            '-2': 'Miss',
            '-1': 'Miss',
            '0': 'Miss',
            '50': 'Normal',
            '100': 'Good',
            '200': 'Great',
            '300': 'Perfect',
            bonus: 'Bonus'
        };
        this.numberToColor = {
            '-2': '#f44336',
            '-1': '#f44336',
            '0': '#f44336',
            '50': '#9e9e9e',
            '100': '#2196f3',
            '200': '#009688',
            '300': '#ff9800',
            bonus: '#27c469'
        };
    }

    objectHit(hitJudgement: number, textKey?: string) {
        const key = textKey || String(hitJudgement);
        const hitText = this.numberToText[key] || this.numberToText[hitJudgement];
        const sprite = G.graphics.createText(hitText, {
            fontSize: G.constant.SCORE_SPRITE_FONT_SIZE,
            fill: this.numberToColor[key] || this.numberToColor[hitJudgement]
        }, (_w: number, h: number, self: any) => ({
            x: G.constant.JUDGEMENT_LINE_LEFT - self.width * 0.5,
            y: h * 0.5 - G.constant.SCORE_SPRITE_HEIGHT * 1.5
        })) as ScoreTextSprite;
        sprite.expireFrames = G.constant.SCORE_SPRITE_EXPIRE_FRAMES;
        this.sprites.push(sprite);
        this.stage.addChild(sprite);
    }

    update() {
        for (const sprite of this.sprites) {
            --sprite.expireFrames;
            if (sprite.expireFrames > 0) {
                sprite.y -= G.constant.SCORE_SPRITE_DISAPPEAR_RATE;
                sprite.alpha = sprite.expireFrames / G.constant.SCORE_SPRITE_EXPIRE_FRAMES;
            } else {
                this.stage.removeChild(sprite);
                this.sprites.shift();
            }
        }
    }
}
