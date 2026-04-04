/**
 * Hit object window in editor
 * @author Rex Zeng
 */

import { Graphics } from 'pixi.js';
import G from '../Global';
import type { BeatmapData, HitObject, HitObjectSprite, TimingPoint } from '../types';
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
    isEditMode: boolean;
    hitObjects: HitObject[];
    timingPoints: TimingPoint[];
    hitObjectSpriteList: HitObjectSprite[];
    currentIndex: number;
    lastUpdated: number;
    colors: Record<number, string>;
    hitObjectStage!: ReturnType<typeof G.graphics.createSprite>;
    circleDefaultScale!: number;

    constructor(data: BeatmapData) {
        super();
        this.isEditMode = data.isEditMode;
        this.hitObjects = data.hitObjects;
        this.timingPoints = data.timingPoints;
        this.hitObjectSpriteList = [];
        // all CRUD is based on this index
        this.currentIndex = 0;
        this.lastUpdated = 0;
        this.colors = {
            0: 'graphics/hit-circle-green.png',
            1: 'graphics/hit-circle-orange.png'
        };
        const line = new Graphics();
        line.label = 'LINE_JUDGEMENT';
        line.moveTo(0, 0);
        line.lineTo(0, window.innerHeight - TIME_RULER_WINDOW_HEIGHT - (TIMING_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING) * 2);
        line.stroke({ width: 2, color: 0xffffff, alpha: 1 });
        line.x = JUDGEMENT_LINE_LEFT;
        line.y = TIME_RULER_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING;
        G.graphics.setPosition(line, (_w: number, h: number, _self: any) => ({
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
        this.hitObjectStage.label = 'SPRITE_HITOBJECTS';
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
            this.hitObjectStage.setChildIndex(hitObj, 0);
        }
    }
    update(time: number) {
        const time1000 = time * 1000;
        if (time1000 > this.lastUpdated) {
            this.lastUpdated = time1000;
            // TODO:
            // left pop
            // right push
            for (const index in this.hitObjects) {
                this.updateObjectPos(Number(index), time1000);
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
                this.updateObjectPos(Number(index), time1000);
            }
            // currentIndex change
            while (this.currentIndex > 1 && this.hitObjects[this.currentIndex - 1].pos1000 >= time1000) {
                --this.currentIndex;
            }
        }
    }
    updateObjectPos(index: number, time1000: number) {
        const obj = this.hitObjects[index];
        const sprite = this.hitObjectSpriteList[index];
        const positionX = sprite.bpm1000 * (obj.pos1000 - time1000) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT;
        if (positionX < JUDGEMENT_LINE_LEFT && this.isEditMode) {
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
        } else if (!sprite.hitDone) {
            // TODO: replace y by specific rail's position
            G.graphics.setPosition(sprite, (_w: number, h: number, _self: any) => ({
                x: positionX,
                y: 0.5 * h
            }));
            sprite.scale.set(this.circleDefaultScale, this.circleDefaultScale);
            sprite.alpha = 1;
            sprite.visible = true;
        }
    }
    objectHit(index: number, hitJudgement: number) {
        const sprite = this.hitObjectSpriteList[index];
        sprite.hitDone = true;
        const currentX = sprite.x;
        if (hitJudgement > 0) {
            // normal score
            sprite.transformScale = this.circleDefaultScale;
            G.animation.set(sprite, (_w: number, h: number, _self: any) => ({
                x: currentX,
                y: 0.5 * h,
                transformScale: 3 * this.circleDefaultScale,
                alpha: 0
            }), 20, G.animation.EASE_OUT_QUAD);
        } else if (hitJudgement === 0 || hitJudgement === -2) {
            // miss
            G.animation.set(sprite, (_w: number, h: number, self: any) => ({
                x: currentX - HITOBJ_CIRCLE_RADIUS * self.bpm1000 / 32000,
                y: 0.5 * h,
                alpha: 0
            }), 20, G.animation.LINEAR);
        } else if (hitJudgement === -1) {
            // wrong key
            G.animation.set(sprite, (_w: number, h: number, _self: any) => ({
                x: currentX,
                y: 0.5 * h + HITOBJ_CIRCLE_RADIUS * 1.5,
                alpha: 0
            }), 20, G.animation.LINEAR);
        }
    }
    findObj(time1000: number) {
        let l = 0;
        let r = this.hitObjects.length - 1;
        while (l <= r) {
            let m = (l + r + 1) >> 1;
            if (this.hitObjects[m].pos1000 > time1000) {
                r = m - 1;
            } else if (this.hitObjects[m].pos1000 < time1000) {
                l = m + 1;
            } else {
                return m;
            }
        }
        return -1;
    }
    insertHitObject({ type, color, last }: { type: number; color?: number; last?: number }) {
        const obj = { type, pos1000: this.lastUpdated, color, last };
        // avoid insert at the same place
        if (this.findObj(this.lastUpdated) >= 0) {
            return;
        }
        if (this.currentIndex === this.hitObjects.length - 1 && this.hitObjects[this.currentIndex].pos1000 < this.lastUpdated) {
            ++this.currentIndex;
        }
        this.hitObjects.splice(this.currentIndex, 0, obj);
        const findBPM = (time: number) => {
            for (let index in this.timingPoints) {
                const numericIndex = Number(index);
                const item = this.timingPoints[index];
                if (item.pos1000 <= time && (
                    numericIndex === this.timingPoints.length - 1 ||
                    this.timingPoints[numericIndex + 1].pos1000 > time
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
        this.hitObjectStage.setChildIndex(hitObj, 0);
        if (type === 2) {
            // TODO: if insert a switch, right objs' position y must be updated
        }
    }
    /**
     * Remove hit object at current time
     */
    removeHitObject() {
        const pos = this.findObj(this.lastUpdated);
        if (pos >= 0) {
            const sprite = this.hitObjectSpriteList.filter((item) => item.label === 'CIRCLE_' + this.lastUpdated);
            if (sprite.length > 0) {
                this.hitObjectStage.removeChild(sprite[0]);
                sprite[0].destroy();
            }
            this.hitObjects.splice(pos, 1);
            this.hitObjectSpriteList.splice(pos, 1);
        }
    }
    createHitObj(obj: HitObject, bpm1000: number): HitObjectSprite {
        if (obj.type === 0) {
            return this.createHitCircle(obj, bpm1000);
        } else if (obj.type === 1) {
            // TODO:
            // type: hold
        } else if (obj.type === 2) {
            // TODO:
            // type: switch
        }
        return this.createHitCircle(obj, bpm1000);
    }
    createHitCircle(obj: HitObject, bpm1000: number | null = null): HitObjectSprite {
        const bpmValue = bpm1000 ?? 0;
        const positionX = bpmValue * (obj.pos1000 - this.lastUpdated) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT;
        const circle = G.graphics.createImage(this.colors[obj.color ?? 0], (_w: number, h: number, _self: any) => ({
            x: positionX,
            // TODO: replace by specific rail's position
            y: 0.5 * h
        })) as HitObjectSprite;
        circle.label = 'CIRCLE_' + obj.pos1000;
        circle.anchor.x = 0.5;
        circle.anchor.y = 0.5;
        circle.bpm1000 = bpm1000 ?? 0;
        circle.hitDone = false;
        circle.width = HITOBJ_CIRCLE_RADIUS * 2;
        circle.height = HITOBJ_CIRCLE_RADIUS * 2;
        this.circleDefaultScale = circle.scale.x;
        return circle;
    }
}
