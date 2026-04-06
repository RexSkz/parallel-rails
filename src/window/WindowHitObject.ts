/**
 * Hit object window in editor
 * @author Rex Zeng
 */

import { Container, Graphics, Text } from 'pixi.js';
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
import { populateSliderMiddle, renderHitObjectSprite } from './WindowHitObjectRenderer';

const {
    DEFAULT_FONT,
    HITOBJ_CIRCLE_RADIUS,
    HITOBJ_WINDOW_PADDING,
    JUDGEMENT_LINE_LEFT,
    RAIL_MARGIN,
    TIMING_WINDOW_HEIGHT,
    TIME_RULER_WINDOW_HEIGHT
} = G.constant;

const BONUS_RADIUS = HITOBJ_CIRCLE_RADIUS * 0.5;

type RailSwitchState = {
    startTime1000: number;
    duration1000: number;
    fromRail: number;
    toRail: number;
};

type RailGuideDefinition = {
    sprite: Graphics;
    railIndex: number;
};

type BonusDurationGuide = {
    line: Graphics;
    startAnchor: Graphics;
    endAnchor: Graphics;
};

type EditableHighlight = {
    frame: Graphics;
    targetIndex: number | null;
};

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
    currentRailIndex: number;
    railSwitchState: RailSwitchState | null;
    railDeltaText: Map<number, Text>;
    railGuideLines: RailGuideDefinition[];
    bonusDurationGuides: Map<number, BonusDurationGuide>;
    editableHighlight: EditableHighlight;
    currentMode: string;

    constructor(data: BeatmapData) {
        super();
        this.isEditMode = data.isEditMode;
        this.hitObjects = data.hitObjects;
        this.timingPoints = data.timingPoints;
        this.hitObjectSpriteList = [];
        this.currentIndex = 0;
        this.lastUpdated = 0;
        this.colors = {
            0: 'graphics/hit-circle-green.png',
            1: 'graphics/hit-circle-orange.png'
        };
        this.currentRailIndex = 0;
        this.railSwitchState = null;
        this.railDeltaText = new Map();
        this.railGuideLines = [];
        this.bonusDurationGuides = new Map();
        this.editableHighlight = {
            frame: new Graphics(),
            targetIndex: null
        };
        this.currentMode = 'hitObject';
        const line = new Graphics();
        line.label = 'LINE_JUDGEMENT';
        line.moveTo(0, 0);
        line.lineTo(0, window.innerHeight - TIME_RULER_WINDOW_HEIGHT - (TIMING_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING) * 2);
        line.stroke({ width: 2, color: 0xffffff, alpha: 1 });
        line.x = JUDGEMENT_LINE_LEFT;
        line.y = TIME_RULER_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING;
        G.graphics.setPosition(line, (_w: number, h: number) => ({
            height: h - TIME_RULER_WINDOW_HEIGHT - (TIMING_WINDOW_HEIGHT + HITOBJ_WINDOW_PADDING) * 2
        }));
        this.stage.addChild(line);
        this.editableHighlight.frame.label = 'EDITABLE_HITOBJECT_FRAME';
        this.stage.addChild(this.editableHighlight.frame);
        this.initObjects();
    }

    initObjects() {
        this.hitObjectStage = G.graphics.createSprite({ x: 0, y: 0 });
        this.hitObjectStage.label = 'SPRITE_HITOBJECTS';
        this.drawRailGuides();
        this.stage.addChild(this.hitObjectStage);
        let timingIndex = 0;
        for (const objIndex in this.hitObjects) {
            const obj = this.hitObjects[objIndex];
            timingIndex = findTimingPointIndex(this.timingPoints, obj.pos1000);
            const hitObj = this.createRenderedHitObject(obj, this.timingPoints[timingIndex].bpm1000);
            this.hitObjectSpriteList[objIndex] = hitObj;
            this.hitObjectStage.addChild(hitObj);
            this.hitObjectStage.setChildIndex(hitObj, 0);
            this.attachBonusEditorLabel(obj, hitObj, Number(objIndex));
        }
        this.refreshRailIndices();
        this.refreshAllObjectPositions(this.lastUpdated);
    }

    drawRailGuides() {
        for (const guide of this.railGuideLines) {
            this.stage.removeChild(guide.sprite);
            guide.sprite.destroy();
        }
        this.railGuideLines = [];
        const renderedRailIndex = this.getRenderedRailIndex(this.lastUpdated);
        const centerWorldRailIndex = Math.round(renderedRailIndex);
        const visibleCount = Math.ceil(window.innerHeight / RAIL_MARGIN) + 4;
        for (let offset = -visibleCount; offset <= visibleCount; offset++) {
            const railIndex = centerWorldRailIndex + offset;
            const guide = new Graphics();
            guide.label = `RAIL_GUIDE_${railIndex}`;
            G.graphics.setPosition(guide, (_w: number, h: number) => ({
                x: 0,
                y: this.getRailY(railIndex - this.getRenderedRailIndex(this.lastUpdated), h)
            }));
            this.railGuideLines.push({ sprite: guide, railIndex });
            this.stage.addChildAt(guide, 1);
        }
    }

    update(time: number) {
        const time1000 = time * 1000;
        this.syncRailStateToTime(time1000);
        if (time1000 > this.lastUpdated) {
            this.lastUpdated = time1000;
            for (const index in this.hitObjects) {
                this.updateObjectPos(Number(index), time1000);
            }
            this.currentIndex = advanceHitObjectCursor(this.hitObjects, this.currentIndex, time1000);
        } else if (time1000 < this.lastUpdated) {
            this.lastUpdated = time1000;
            for (const index in this.hitObjects) {
                this.updateObjectPos(Number(index), time1000);
            }
            this.currentIndex = rewindHitObjectCursor(this.hitObjects, this.currentIndex, time1000);
        }
        this.repaintRailGuides();
        this.repaintEditableHighlight();
    }

    refreshAllObjectPositions(time1000: number) {
        for (let index = 0; index < this.hitObjects.length; index++) {
            this.updateObjectPos(index, time1000);
        }
        for (const [index, guide] of this.bonusDurationGuides.entries()) {
            const obj = this.hitObjects[index];
            const sprite = this.hitObjectSpriteList[index];
            if (obj && sprite) {
                this.updateBonusDurationGuide(index, obj, sprite, guide, time1000);
            }
        }
        this.repaintRailGuides();
        this.repaintEditableHighlight();
    }

    syncRailStateToTime(time1000: number) {
        let currentRailIndex = 0;
        let railSwitchState: RailSwitchState | null = null;
        for (const obj of this.hitObjects) {
            if (obj.type !== 2) {
                continue;
            }
            const delta = obj.delta || 0;
            const duration1000 = Math.max(obj.duration1000 || 0, 1);
            if (time1000 >= obj.pos1000 + duration1000) {
                currentRailIndex += delta;
                continue;
            }
            if (time1000 >= obj.pos1000) {
                railSwitchState = {
                    startTime1000: obj.pos1000,
                    duration1000,
                    fromRail: currentRailIndex,
                    toRail: currentRailIndex + delta
                };
            }
            break;
        }
        this.currentRailIndex = currentRailIndex;
        this.railSwitchState = railSwitchState;
    }

    repaintRailGuides() {
        const renderedRailIndex = this.getRenderedRailIndex(this.lastUpdated);
        const centerWorldRailIndex = Math.round(renderedRailIndex);
        const visibleCount = Math.ceil(window.innerHeight / RAIL_MARGIN) + 4;
        if (this.railGuideLines.length !== visibleCount * 2 + 1) {
            this.drawRailGuides();
        }
        for (const guide of this.railGuideLines) {
            const distance = Math.abs(guide.railIndex - renderedRailIndex);
            const alpha = Math.max(0.08, 1 - distance / 4.5);
            const highlight = Math.max(0, 1 - Math.pow(distance / 1.35, 2));
            guide.sprite.clear();
            guide.sprite.moveTo(0, 0);
            guide.sprite.lineTo(window.innerWidth, 0);
            if (highlight > 0.01) {
                guide.sprite.stroke({ width: 10, color: 0xffffff, alpha: 0.06 * highlight });
                guide.sprite.moveTo(0, 0);
                guide.sprite.lineTo(window.innerWidth, 0);
                guide.sprite.stroke({ width: 4, color: 0xffffff, alpha: 0.16 * highlight });
                guide.sprite.moveTo(0, 0);
                guide.sprite.lineTo(window.innerWidth, 0);
                guide.sprite.stroke({ width: 1.5, color: 0xffffff, alpha: Math.min(1, alpha + 0.18 * highlight) });
            } else if (distance < 1.8) {
                guide.sprite.stroke({ width: 6, color: 0xffffff, alpha: 0.05 });
                guide.sprite.moveTo(0, 0);
                guide.sprite.lineTo(window.innerWidth, 0);
                guide.sprite.stroke({ width: 1.5, color: 0xffffff, alpha: 1 });
            } else {
                guide.sprite.stroke({ width: 4, color: 0xffffff, alpha: 0.03 });
                guide.sprite.moveTo(0, 0);
                guide.sprite.lineTo(window.innerWidth, 0);
                guide.sprite.stroke({ width: 1, color: 0xffffff, alpha: 1 });
            }
            G.graphics.setPosition(guide.sprite, (_w: number, h: number) => ({
                x: 0,
                y: this.getRailY(guide.railIndex - renderedRailIndex, h),
                alpha
            }));
        }
    }

    getRenderedRailIndex(time1000: number): number {
        if (!this.railSwitchState) {
            return this.currentRailIndex;
        }
        const { duration1000, fromRail, startTime1000, toRail } = this.railSwitchState;
        const progress = Math.min(Math.max((time1000 - startTime1000) / duration1000, 0), 1);
        return G.animation.EASE_OUT_QUAD(fromRail, toRail, progress);
    }

    getRailY(railIndex: number, height: number): number {
        return 0.5 * height + railIndex * RAIL_MARGIN;
    }

    updateObjectPos(index: number, time1000: number) {
        const obj = this.hitObjects[index];
        const sprite = this.hitObjectSpriteList[index];
        if (!obj || !sprite) {
            return;
        }
        const renderedRailIndex = this.getRenderedRailIndex(time1000);
        const railY = this.getRailY(sprite.railIndex - renderedRailIndex, window.innerHeight);
        const positionX = calculateHitObjectX(sprite.bpm1000, obj.pos1000, time1000);
        sprite.railY = railY;
        if (obj.type === 1) {
            this.refreshSliderGeometry(sprite, obj, time1000);
        }
        const sliderTailTime1000 = obj.pos1000 + (obj.last || 0);
        const sliderExpired = obj.type === 1 && sprite.hitDone && time1000 > sliderTailTime1000 + 220;
        if (shouldShowEditorGhost(positionX) && this.isEditMode) {
            const t = calculateEditorGhostProgress(sprite.bpm1000, positionX);
            if (t <= 1) {
                const scale = G.animation.EASE_OUT_QUAD(this.circleDefaultScale, 3 * this.circleDefaultScale, t);
                sprite.scale.set(scale, scale);
                sprite.alpha = 1 - t;
                sprite.x = JUDGEMENT_LINE_LEFT;
                sprite.y = railY;
                sprite.visible = true;
            } else {
                sprite.visible = false;
            }
        } else if (!sprite.hitDone && !sliderExpired) {
            sprite.x = positionX;
            sprite.y = railY;
            sprite.scale.set(this.circleDefaultScale, this.circleDefaultScale);
            sprite.alpha = 1;
            sprite.visible = true;
        } else if (sliderExpired) {
            sprite.visible = false;
        }
        const label = this.railDeltaText.get(index);
        if (label) {
            label.x = sprite.x;
            label.y = railY - BONUS_RADIUS - 8;
            label.visible = this.isEditMode && obj.type === 2 && sprite.visible;
            label.alpha = sprite.alpha;
        }
        const durationGuide = this.bonusDurationGuides.get(index);
        if (durationGuide) {
            this.updateBonusDurationGuide(index, obj, sprite, durationGuide, time1000);
        }
    }

    repaintEditableHighlight() {
        const targetIndex = this.isEditMode ? this.findObj(this.lastUpdated) : -1;
        this.editableHighlight.targetIndex = targetIndex >= 0 ? targetIndex : null;
        const sprite = targetIndex >= 0 ? this.hitObjectSpriteList[targetIndex] : null;
        if (!sprite || !sprite.visible) {
            this.editableHighlight.frame.visible = false;
            return;
        }
        const width = Math.max(sprite.width || HITOBJ_CIRCLE_RADIUS * 2, HITOBJ_CIRCLE_RADIUS * 2);
        const height = HITOBJ_CIRCLE_RADIUS * 2;
        this.editableHighlight.frame.clear();
        this.editableHighlight.frame.rect(sprite.x - width * 0.5 - 4, sprite.y - height * 0.5 - 4, width + 8, height + 8);
        this.editableHighlight.frame.stroke({ width: 1.5, color: 0xe4c15c, alpha: 0.95 });
        this.editableHighlight.frame.visible = true;
    }

    objectHit(index: number, hitJudgement: number) {
        animateHitObjectJudgement(this.hitObjectSpriteList[index], hitJudgement, this.circleDefaultScale);
    }

    markSliderHeadHit(index: number) {
        const sprite = this.hitObjectSpriteList[index];
        if (!sprite) {
            return;
        }
        sprite.alpha = 0.85;
    }

    insertHitObjectAt(index: number, obj: HitObject) {
        this.currentIndex = index;
        this.hitObjects.splice(index, 0, obj);
        const bpm1000 = findBpmAtTime(this.timingPoints, obj.pos1000);
        const hitObj = this.createRenderedHitObject(obj, bpm1000);
        this.hitObjectSpriteList.splice(index, 0, hitObj);
        this.hitObjectStage.addChild(hitObj);
        this.hitObjectStage.setChildIndex(hitObj, 0);
        this.shiftBonusLabelMap(index, 1);
        this.attachBonusEditorLabel(obj, hitObj, index);
        this.attachBonusDurationGuide(obj, index);
        this.refreshRailIndices();
        this.refreshAllObjectPositions(this.lastUpdated);
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
            sprite.destroy({ children: true });
        }
        const label = this.railDeltaText.get(index);
        if (label) {
            this.stage.removeChild(label);
            label.destroy();
        }
        const durationGuide = this.bonusDurationGuides.get(index);
        if (durationGuide) {
            this.stage.removeChild(durationGuide.line);
            this.stage.removeChild(durationGuide.startAnchor);
            this.stage.removeChild(durationGuide.endAnchor);
            durationGuide.line.destroy();
            durationGuide.startAnchor.destroy();
            durationGuide.endAnchor.destroy();
            this.bonusDurationGuides.delete(index);
        }
        this.hitObjects.splice(index, 1);
        this.hitObjectSpriteList.splice(index, 1);
        this.shiftBonusLabelMap(index, -1);
        this.currentIndex = Math.min(index, Math.max(this.hitObjects.length - 1, 0));
        this.refreshRailIndices();
        this.refreshAllObjectPositions(this.lastUpdated);
        return removedObject;
    }

    shiftBonusLabelMap(index: number, delta: number) {
        const entries = Array.from(this.railDeltaText.entries());
        const guideEntries = Array.from(this.bonusDurationGuides.entries());
        this.railDeltaText.clear();
        this.bonusDurationGuides.clear();
        for (const [currentIndex, label] of entries) {
            if (currentIndex < index) {
                this.railDeltaText.set(currentIndex, label);
                continue;
            }
            if (delta < 0 && currentIndex === index) {
                continue;
            }
            this.railDeltaText.set(currentIndex + delta, label);
        }
        for (const [currentIndex, guide] of guideEntries) {
            if (currentIndex < index) {
                this.bonusDurationGuides.set(currentIndex, guide);
                continue;
            }
            if (delta < 0 && currentIndex === index) {
                continue;
            }
            this.bonusDurationGuides.set(currentIndex + delta, guide);
        }
    }

    attachBonusEditorLabel(obj: HitObject, sprite: HitObjectSprite, index: number) {
        if (!this.isEditMode || obj.type !== 2) {
            return;
        }
        const existing = this.railDeltaText.get(index);
        if (existing) {
            this.stage.removeChild(existing);
            existing.destroy();
        }
        const label = new Text({
            text: String(obj.delta || 0),
            style: {
                fontFamily: DEFAULT_FONT,
                fontSize: 32,
                fill: '#ffffff',
                align: 'center'
            }
        });
        label.label = `BONUS_EDITOR_LABEL_${obj.pos1000}`;
        label.anchor.set(0.5, 1);
        label.x = sprite.x;
        label.y = sprite.y - BONUS_RADIUS - 8;
        this.railDeltaText.set(index, label);
        this.stage.addChild(label);
    }

    refreshBonusEditorLabel(index: number) {
        const obj = this.hitObjects[index];
        const label = this.railDeltaText.get(index);
        if (!obj || !label) {
            return;
        }
        label.text = String(obj.delta || 0);
    }

    attachBonusDurationGuide(obj: HitObject, index: number) {
        if (!this.isEditMode || obj.type !== 2) {
            return;
        }
        const line = new Graphics();
        line.label = `BONUS_DURATION_LINE_${obj.pos1000}`;
        const startAnchor = new Graphics();
        startAnchor.label = `BONUS_DURATION_START_${obj.pos1000}`;
        const endAnchor = new Graphics();
        endAnchor.label = `BONUS_DURATION_END_${obj.pos1000}`;
        this.bonusDurationGuides.set(index, { line, startAnchor, endAnchor });
        this.stage.addChild(line);
        this.stage.addChild(startAnchor);
        this.stage.addChild(endAnchor);
    }

    updateBonusDurationGuide(index: number, obj: HitObject, sprite: HitObjectSprite, guide: BonusDurationGuide, time1000: number) {
        if (!this.isEditMode || obj.type !== 2 || !sprite.visible) {
            guide.line.visible = false;
            guide.startAnchor.visible = false;
            guide.endAnchor.visible = false;
            return;
        }
        const duration1000 = Math.max(1, obj.duration1000 || 1000);
        const targetX = calculateHitObjectX(sprite.bpm1000, obj.pos1000 + duration1000, time1000);
        const renderedRailIndex = this.getRenderedRailIndex(time1000);
        const targetRailY = this.getRailY(sprite.railIndex + (obj.delta || 0) - renderedRailIndex, window.innerHeight);
        const dash = 14;
        const gap = 10;
        const dx = targetX - sprite.x;
        const dy = targetRailY - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const segments = Math.max(1, Math.floor(distance / (dash + gap)));
        guide.line.clear();
        for (let segment = 0; segment < segments; segment++) {
            const startT = segment / segments;
            const endT = Math.min(1, startT + dash / Math.max(distance, 1));
            guide.line.moveTo(sprite.x + dx * startT, sprite.y + dy * startT);
            guide.line.lineTo(sprite.x + dx * endT, sprite.y + dy * endT);
        }
        guide.line.stroke({ width: 2, color: 0xe2c84f, alpha: 0.8 * sprite.alpha });
        guide.line.visible = true;
        guide.startAnchor.clear();
        guide.startAnchor.circle(sprite.x, sprite.y, 4).fill({ color: 0xe2c84f, alpha: 0.95 * sprite.alpha });
        guide.startAnchor.visible = true;
        guide.endAnchor.clear();
        guide.endAnchor.circle(targetX, targetRailY, 4).fill({ color: 0xe2c84f, alpha: 0.95 * sprite.alpha });
        guide.endAnchor.visible = true;
    }

    refreshRailIndices() {
        let railIndex = 0;
        for (let index = 0; index < this.hitObjects.length; index++) {
            const obj = this.hitObjects[index];
            const sprite = this.hitObjectSpriteList[index];
            sprite.railIndex = railIndex;
            if (obj.type === 2) {
                railIndex += obj.delta || 0;
            }
        }
    }

    findObj(time1000: number) {
        return findHitObjectIndex(this.hitObjects, time1000);
    }

    insertHitObject({ type, color, last, delta, duration1000 }: { type: number; color?: number; last?: number; delta?: number; duration1000?: number }) {
        if (this.findObj(this.lastUpdated) >= 0) {
            return false;
        }
        const { obj, insertIndex } = buildHitObjectInsertCommand(this.hitObjects, this.currentIndex, this.lastUpdated, { type, color, last, delta, duration1000 });
        this.insertHitObjectAt(insertIndex, obj);
        return true;
    }

    updateCurrentBonusHitObject(delta?: number, duration1000?: number) {
        const index = this.findObj(this.lastUpdated);
        const obj = index >= 0 ? this.hitObjects[index] : null;
        if (!obj || obj.type !== 2) {
            return false;
        }
        if (typeof delta === 'number') {
            obj.delta = delta;
        }
        if (typeof duration1000 === 'number') {
            obj.duration1000 = duration1000;
        }
        this.refreshBonusEditorLabel(index);
        this.refreshRailIndices();
        this.refreshAllObjectPositions(this.lastUpdated);
        return true;
    }

    getSliderDraft() {
        const index = this.findObj(this.lastUpdated);
        const obj = index >= 0 ? this.hitObjects[index] : null;
        if (!obj || obj.type !== 1) {
            return null;
        }
        return { index, obj };
    }

    getCurrentNormalHitObject() {
        const index = this.findObj(this.lastUpdated);
        const obj = index >= 0 ? this.hitObjects[index] : null;
        if (!obj || obj.type !== 0) {
            return null;
        }
        return { index, obj };
    }

    convertCurrentHitObjectToSlider(last: number) {
        const draft = this.getCurrentNormalHitObject();
        if (!draft) {
            return null;
        }
        draft.obj.type = 1;
        draft.obj.last = last;
        const sprite = this.hitObjectSpriteList[draft.index];
        if (sprite) {
            this.hitObjectStage.removeChild(sprite);
            sprite.destroy({ children: true });
        }
        const bpm1000 = findBpmAtTime(this.timingPoints, draft.obj.pos1000);
        const nextSprite = this.createRenderedHitObject(draft.obj, bpm1000);
        this.hitObjectSpriteList[draft.index] = nextSprite;
        this.hitObjectStage.addChild(nextSprite);
        this.hitObjectStage.setChildIndex(nextSprite, 0);
        this.refreshCurrentLayout();
        return draft;
    }

    refreshSliderGeometry(sprite: HitObjectSprite, obj: HitObject, time1000: number) {
        const tailX = calculateHitObjectX(sprite.bpm1000, obj.pos1000 + (obj.last || 0), time1000);
        const headX = calculateHitObjectX(sprite.bpm1000, obj.pos1000, time1000);
        const length = Math.max(HITOBJ_CIRCLE_RADIUS * 2, tailX - headX);
        const bar = sprite.children.find(child => child.label === `SLIDER_BAR_${obj.pos1000}`) as Container | undefined;
        const endCap = sprite.children[2] || null;
        if (bar) {
            const colorPath = this.colors[obj.color ?? 0];
            populateSliderMiddle(bar, colorPath, Math.max(0, length));
        }
        if (endCap) {
            endCap.x = length;
        }
    }

    refreshCurrentLayout() {
        this.refreshRailIndices();
        this.refreshAllObjectPositions(this.lastUpdated);
    }

    getCurrentBonusHitObject() {
        const index = this.findObj(this.lastUpdated);
        const obj = index >= 0 ? this.hitObjects[index] : null;
        if (!obj || obj.type !== 2) {
            return null;
        }
        return { index, obj };
    }

    syncCurrentTimeToObjectTime(index: number) {
        const obj = this.hitObjects[index];
        if (!obj) {
            return null;
        }
        this.lastUpdated = obj.pos1000;
        this.currentIndex = index;
        this.refreshAllObjectPositions(this.lastUpdated);
        return obj.pos1000;
    }

    removeHitObject() {
        const pos = this.findObj(this.lastUpdated);
        if (pos >= 0) {
            this.removeHitObjectAt(pos);
            return true;
        }
        return false;
    }

    beginRailSwitch(obj: HitObject, startTime1000: number) {
        const delta = obj.delta || 0;
        if (!delta) {
            return;
        }
        const duration1000 = Math.max(obj.duration1000 || 0, 1);
        this.railSwitchState = {
            startTime1000,
            duration1000,
            fromRail: this.currentRailIndex,
            toRail: this.currentRailIndex + delta
        };
    }

    isRailSwitching(time1000?: number) {
        if (!this.railSwitchState) {
            return false;
        }
        if (typeof time1000 === 'number') {
            return time1000 < this.railSwitchState.startTime1000 + this.railSwitchState.duration1000;
        }
        return true;
    }

    canAcceptGameplayInput(time1000: number) {
        return !this.isRailSwitching(time1000);
    }

    createRenderedHitObject(obj: HitObject, bpm1000: number): HitObjectSprite {
        const sprite = renderHitObjectSprite(obj, bpm1000, {
            colors: this.colors,
            lastUpdated: this.lastUpdated,
            defaultRailY: (height) => this.getRailY(0, height)
        });
        this.circleDefaultScale = sprite.scale.x || 1;
        return sprite;
    }
}
