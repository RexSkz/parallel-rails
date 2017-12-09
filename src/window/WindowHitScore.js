/**
 * Hit score window in editor
 * @author Rex Zeng
 */

import G from '../Global';
import WindowBase from './WindowBase';

/**
 * Window that shows hit score at middle
 * @class
 */
export default class WindowHitScore extends WindowBase {
    /**
     * @constructor
     */
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
            '300': 'Perfect'
        };
        this.numberToColor = {
            '-2': '#f44336',
            '-1': '#f44336',
            '0': '#f44336',
            '50': '#9e9e9e',
            '100': '#2196f3',
            '200': '#009688',
            '300': '#ff9800'
        };
    }
    /**
     * Call after hitting an object
     * @param {number} hitJudgement - Hit judgement score or 0 or -1
     */
    objectHit(hitJudgement) {
        const hitText = this.numberToText[hitJudgement];
        const sprite = G.graphics.createText(hitText, {
            fontSize: G.constant.SCORE_SPRITE_FONT_SIZE,
            color: this.numberToColor[hitJudgement]
        }, (w, h, self) => ({
            x: G.constant.JUDGEMENT_LINE_LEFT - self.width * 0.5,
            y: h * 0.5 - G.constant.SCORE_SPRITE_HEIGHT * 1.5
        }));
        sprite.expireFrames = G.constant.SCORE_SPRITE_EXPIRE_FRAMES;
        this.sprites.push(sprite);
        this.stage.addChild(sprite);
    }
    /**
     * Update all score sprites
     */
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
