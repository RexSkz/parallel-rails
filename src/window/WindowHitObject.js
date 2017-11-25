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
        this.lastUpdated = 0;
        this.currentTime = 0;
        this.colors = {
            0: 'graphics/hit-circle-green.png',
            1: 'graphics/hit-circle-orange.png'
        };
        const line = new PIXI.Graphics();
        line.id = 'LINE_JUDGEMENT';
        line.lineStyle(2, 0xffffff, 1);
        line.moveTo(0, 0);
        line.lineTo(0, window.innerHeight - TIME_RULER_WINDOW_HEIGHT - (TIMING_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING) * 2);
        line.x = JUDGEMENT_LINE_LEFT;
        line.y = TIME_RULER_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING;
        G.graphics.setPosition(line, (w, h, self) => ({
            height: h - TIME_RULER_WINDOW_HEIGHT - (TIMING_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING) * 2
        }));
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
        let timingIndex = 0;
        for (const objIndex in this.hitObjects) {
            const obj = this.hitObjects[objIndex];
            while (timingIndex < this.timingPoints.length - 1 && obj.pos1000 > this.timingPoints[timingIndex + 1].pos1000) {
                ++timingIndex;
            }
            const hitObj = this.createHitObj(obj, this.timingPoints[timingIndex].bpm1000);
            this.hitObjectSpriteList[objIndex] = hitObj;
            this.hitObjectStage.addChild(hitObj);
            this.hitObjectStage.children.unshift(this.hitObjectStage.children.pop());
        }
    }
    /**
     * Update time
     * @param {number} time - Current time, in second unit
     */
    update(time) {
        const time1000 = time * 1000;
        if (time1000 > this.lastUpdated) {
            this.lastUpdated = time1000;
            // TODO:
            // left pop
            // right push
            for (const index in this.hitObjects) {
                this.updateObjectPos(index, time1000);
            }
            // currentIndex change
            while (this.currentIndex < this.hitObjects.length - 1 && this.hitObjects[this.currentIndex].pos1000 < time1000) {
                ++this.currentIndex;
            }
        } else if (time1000 < this.lastUpdated) {
            this.lastUpdated = time1000;
            // TODO:
            // left push
            // right pop
            for (const index in this.hitObjects) {
                this.updateObjectPos(index, time1000);
            }
            // currentIndex change
            while (this.currentIndex > 1 && this.hitObjects[this.currentIndex - 1].pos1000 >= time1000) {
                --this.currentIndex;
            }
        }
    }
    /**
     * Update object's position according to current time
     * @param {number} index - Index of the object to change
     * @param {number} time1000 - Current time, in millisecond unit
     */
    updateObjectPos(index, time1000) {
        const obj = this.hitObjects[index];
        const sprite = this.hitObjectSpriteList[index];
        const positionX = sprite.bpm1000 * (obj.pos1000 - time1000) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT;
        // TODO: replace y by specific rail's position
        if (positionX < JUDGEMENT_LINE_LEFT) {
            // TODO: calculate scale and opacity!!!
            const t = (JUDGEMENT_LINE_LEFT - positionX) / sprite.bpm1000 * 1e3;
            if (t <= 1) {
                const scale = G.animation.EASE_OUT_QUAD(this.circleDefaultScale, 3 * this.circleDefaultScale, t);
                sprite.scale.set(scale, scale);
                sprite.alpha = 1 - t;
                sprite.x = JUDGEMENT_LINE_LEFT;
                sprite.y = 0.5 * window.innerHeight;
            } else {
                sprite.visible = false;
            }
        } else {
            G.graphics.setPosition(sprite, (w, h, self) => ({
                x: positionX,
                y: 0.5 * h
            }));
            sprite.scale.set(this.circleDefaultScale, this.circleDefaultScale);
            sprite.alpha = 1;
            sprite.visible = true;
        }
    }
    /**
     * Insert a hit object at current time index
     * @param {object} obj - Hit object to insert
     */
    insertHitObject({ type, color, last }) {
        const obj = { type, pos1000: this.lastUpdated, color, last };
        const findObj = time => {
            let l = 0;
            let r = this.hitObjects.length - 1;
            while (l <= r) {
                let m = (l + r + 1) >> 1;
                if (this.hitObjects[m].pos1000 > time) {
                    r = m - 1;
                } else if (this.hitObjects[m].pos1000 < time) {
                    l = m + 1;
                } else {
                    return true;
                }
            }
            return false;
        };
        // avoid insert at the same place
        if (findObj(this.lastUpdated)) {
            return;
        }
        if (this.currentIndex === this.hitObjects.length - 1 && this.hitObjects[this.currentIndex].pos1000 < this.lastUpdated) {
            ++this.currentIndex;
        }
        this.hitObjects.splice(this.currentIndex, 0, obj);
        const findBPM = time => {
            for (let index in this.timingPoints) {
                index = parseInt(index);
                const item = this.timingPoints[index];
                if (item.pos1000 <= time && (
                    index === this.timingPoints.length - 1 ||
                    this.timingPoints[index + 1].pos1000 > time
                )) {
                    return item.bpm1000;
                }
            }
            return this.timingPoints[0].bpm1000;
        };
        const bpm1000 = findBPM(this.lastUpdated);
        const hitObj = this.createHitObj(obj, bpm1000);
        this.hitObjectSpriteList.splice(this.currentIndex, 0, hitObj);
        this.hitObjectStage.addChild(hitObj);
        this.hitObjectStage.children.unshift(this.hitObjectStage.children.pop());
        if (type === 2) {
            // TODO: if insert a switch, right objs' position y must be updated
        }
    }
    /**
     * Convert data to hit object
     * @param {object} obj - Data to convert
     * @param {number} bpm1000  - Current bpm, in millisecond unit
     * @return {Sprite} Hit object, as PIXI sprite
     */
    createHitObj(obj, bpm1000) {
        if (obj.type === 0) {
            return this.createHitCircle(obj, bpm1000);
        } else if (obj.type === 1) {
            // TODO:
            // type: hold
        } else if (obj.type === 2) {
            // TODO:
            // type: switch
        }
    }
    /**
     * Create a hit circle object
     * @param {object} obj - Hit object in .pr file
     * @param {number} bpm1000 - Current BPM, in millisecond unit
     */
    createHitCircle(obj, bpm1000 = null) {
        const positionX = bpm1000 * (obj.pos1000 - this.lastUpdated) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT;
        const circle = G.graphics.createImage(this.colors[obj.color], (w, h, self) => ({
            x: positionX,
            // TODO: replace by specific rail's position
            y: 0.5 * h
        }));
        circle.id = 'CIRCLE_' + obj.pos1000;
        circle.anchor.x = 0.5;
        circle.anchor.y = 0.5;
        if (bpm1000) {
            circle.bpm1000 = bpm1000;
        }
        circle.width = HITOBJ_CIRCLE_RADIUS * 2;
        circle.height = HITOBJ_CIRCLE_RADIUS * 2;
        this.circleDefaultScale = circle.scale.x;
        return circle;
    }
}
