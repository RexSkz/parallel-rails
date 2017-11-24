/**
 * Hit object window in editor
 * @author Rex Zeng
 */

import G from '../Global';
import WindowBase from './WindowBase';

const {
    TIMING_WINDOW_HEIGHT,
    TIME_RULER_WINDOW_HEIGHT,
    HITOBJ_WINDOW_PADDING,
    HITOBJ_CIRCLE_RADIUS,
    HITOBJ_MARGIN_SIZE,
    JUDGEMENT_LINE_LEFT
} = G.constant;

/**
 * Window that shows hit objects at middle
 * @class
 */
export default class WindowHitObject extends WindowBase {
    /**
     * @constructor
     * @param {string} mode - Define it's in 'gaming' mode or 'editor' mode
     */
    constructor(data) {
        super();
        this.hitObjects = data.hitObjects;
        this.timingPoints = data.timingPoints;
        this.hitObjectSpriteList = [];
        // all CRUD is based on this index
        this.currentIndex = 0;
        const line = new PIXI.Graphics();
        line.lineStyle(3, 0xffffff, 1);
        line.moveTo(0, 0);
        line.lineTo(0, window.innerHeight - TIME_RULER_WINDOW_HEIGHT - (TIMING_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING) * 2);
        line.x = JUDGEMENT_LINE_LEFT;
        line.y = TIME_RULER_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING;
        line.id = 'LINE_JUDGEMENT';
        this.stage.addChild(line);
        this.initObjects();
    }
    /**
     * Draw parallel rails
     */
    initObjects() {
        this.hitObjectStage = G.graphics.createSprite({ x: 0, y: 0 });
        this.hitObjectStage.id = 'SPRITE_HITOBJECTS';
        this.stage.addChild(this.hitObjectStage);
        const colors = {
            0: 'graphics/hit-circle-green.png',
            1: 'graphics/hit-circle-orange.png'
        };
        let timingIndex = 0;
        let bpm = this.timingPoints[timingIndex].bpm1000;
        this.hitObjects.map((obj, objIndex) => {
            while (timingIndex < this.timingPoints.length - 1 && obj.pos1000 > this.timingPoints[timingIndex + 1].pos1000) {
                bpm = this.timingPoints[++timingIndex];
            }
            const positionX = bpm * obj.pos1000 / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT;
            // type: circle
            if (obj.type === 0) {
                const circle = G.graphics.createImage(colors[obj.color], (w, h, self) => ({
                    x: positionX - HITOBJ_CIRCLE_RADIUS,
                    // TODO: replace by specific rail's position
                    y: 0.5 * h - HITOBJ_CIRCLE_RADIUS,
                    width: HITOBJ_CIRCLE_RADIUS * 2,
                    height: HITOBJ_CIRCLE_RADIUS * 2
                }));
                circle.id = 'CIRCLE_' + obj.pos1000;
                this.hitObjectSpriteList[objIndex] = circle;
                this.hitObjectStage.addChild(circle);
                this.hitObjectStage.children.unshift(this.hitObjectStage.children.pop());
            }
            // type: hold
            // type: switch
        });
    }
    /**
     * Update
     */
    update() {
        console.log('update hit objects...');
    }
}
