/**
 * Hit object window in editor
 * @author Rex Zeng
 */

import { Graphics } from 'pixi.js';
import G from '../Global';
import type { BeatmapData, HitObject, HitObjectSprite, TimingPoint } from '../types';
import WindowBase from './WindowBase';
import {
    calculateEditorGhostProgress,
    calculateHitObjectX,
    findBpmAtTime,
    findTimingPointIndex,
    shouldShowEditorGhost
} from './WindowHitObjectLayout';
import { animateHitObjectJudgement } from './WindowHitObjectAnimation';
import { buildHitObjectInsertCommand, findHitObjectIndex } from './WindowHitObjectEditorCommands';
import { advanceHitObjectCursor, rewindHitObjectCursor } from './WindowHitObjectUpdate';
import { renderHitObjectSprite } from './WindowHitObjectRenderer';

const {
    TIMING_WINDOW_HEIGHT,
    TIME_RULER_WINDOW_HEIGHT,
    HITOBJ_WINDOW_PADDING,
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
            timingIndex = findTimingPointIndex(this.timingPoints, obj.pos1000);
            const hitObj = this.createRenderedHitObject(obj, this.timingPoints[timingIndex].bpm1000);
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
            this.currentIndex = advanceHitObjectCursor(this.hitObjects, this.currentIndex, time1000);
        } else if (time1000 < this.lastUpdated) {
            this.lastUpdated = time1000;
            // TODO:
            // left push
            // right pop
            for (const index in this.hitObjects) {
                this.updateObjectPos(Number(index), time1000);
            }
            this.currentIndex = rewindHitObjectCursor(this.hitObjects, this.currentIndex, time1000);
        }
    }
    updateObjectPos(index: number, time1000: number) {
        const obj = this.hitObjects[index];
        const sprite = this.hitObjectSpriteList[index];
        const positionX = calculateHitObjectX(sprite.bpm1000, obj.pos1000, time1000);
        if (shouldShowEditorGhost(positionX) && this.isEditMode) {
            const t = calculateEditorGhostProgress(sprite.bpm1000, positionX);
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
        animateHitObjectJudgement(this.hitObjectSpriteList[index], hitJudgement, this.circleDefaultScale);
    }

    insertHitObjectAt(index: number, obj: HitObject) {
        this.currentIndex = index;
        this.hitObjects.splice(index, 0, obj);
        const bpm1000 = findBpmAtTime(this.timingPoints, obj.pos1000);
        const hitObj = this.createRenderedHitObject(obj, bpm1000);
        this.hitObjectSpriteList.splice(index, 0, hitObj);
        this.hitObjectStage.addChild(hitObj);
        this.hitObjectStage.setChildIndex(hitObj, 0);
        return true;
    }

    removeHitObjectAt(index: number) {
        if (index < 0 || index >= this.hitObjects.length) {
            return null;
        }
        const removedObject = this.hitObjects[index];
        const sprite = this.hitObjectSpriteList[index];
        if (sprite) {
            this.hitObjectStage.removeChild(sprite);
            sprite.destroy();
        }
        this.hitObjects.splice(index, 1);
        this.hitObjectSpriteList.splice(index, 1);
        this.currentIndex = Math.min(index, Math.max(this.hitObjects.length - 1, 0));
        return removedObject;
    }
    findObj(time1000: number) {
        return findHitObjectIndex(this.hitObjects, time1000);
    }
    insertHitObject({ type, color, last }: { type: number; color?: number; last?: number }) {
        // avoid insert at the same place
        if (this.findObj(this.lastUpdated) >= 0) {
            return false;
        }
        const { obj, insertIndex } = buildHitObjectInsertCommand(this.hitObjects, this.currentIndex, this.lastUpdated, { type, color, last });
        this.insertHitObjectAt(insertIndex, obj);
        if (type === 2) {
            // TODO: if insert a switch, right objs' position y must be updated
        }
        return true;
    }
    /**
     * Remove hit object at current time
     */
    removeHitObject() {
        const pos = this.findObj(this.lastUpdated);
        if (pos >= 0) {
            this.removeHitObjectAt(pos);
            return true;
        }
        return false;
    }
    createRenderedHitObject(obj: HitObject, bpm1000: number): HitObjectSprite {
        const sprite = renderHitObjectSprite(obj, bpm1000, {
            colors: this.colors,
            lastUpdated: this.lastUpdated,
            defaultRailY: (height) => 0.5 * height
        });
        this.circleDefaultScale = sprite.scale.x;
        return sprite;
    }
}
