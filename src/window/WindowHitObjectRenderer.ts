import { Container, Graphics, TilingSprite } from 'pixi.js';
import G from '../Global';
import type { HitObject, HitObjectSprite } from '../types';
import { calculateHitObjectX } from './WindowHitObjectLayout';

const { HITOBJ_CIRCLE_RADIUS } = G.constant;

type RenderContext = {
    colors: Record<number, string>;
    lastUpdated: number;
    defaultRailY: (height: number) => number;
};

const BONUS_RADIUS = HITOBJ_CIRCLE_RADIUS * 0.5;
const BONUS_RING_WIDTH = HITOBJ_CIRCLE_RADIUS * 0.1;
const BONUS_GAP = HITOBJ_CIRCLE_RADIUS * 0.3;
const SLIDER_BORDER_COLOR = 0xffffff;
const SLIDER_BORDER_WIDTH = 2;

function createBaseContainer(obj: HitObject, bpm1000: number, context: RenderContext, labelPrefix: string): HitObjectSprite {
    const positionX = calculateHitObjectX(bpm1000, obj.pos1000, context.lastUpdated);
    const container = new Container() as HitObjectSprite;
    container.label = `${labelPrefix}_${obj.pos1000}`;
    container.bpm1000 = bpm1000;
    container.hitDone = false;
    container.railIndex = 0;
    container.railY = 0;
    const size = obj.type === 2 ? BONUS_RADIUS * 2 : HITOBJ_CIRCLE_RADIUS * 2;
    container.pivot.set(size * 0.5, size * 0.5);
    container.x = positionX;
    container.y = context.defaultRailY(window.innerHeight);
    return container;
}

function createCircleBody(colorPath: string): Container {
    const body = new Container();
    const circle = G.graphics.createImage(colorPath, { x: 0, y: 0 }) as Container;
    circle.label = `BODY_${colorPath}`;
    circle.width = HITOBJ_CIRCLE_RADIUS * 2;
    circle.height = HITOBJ_CIRCLE_RADIUS * 2;
    circle.pivot.set(0, 0);
    circle.x = 0;
    circle.y = 0;
    body.addChild(circle);
    return body;
}

export function populateSliderMiddle(middle: Container, colorPath: string, width: number) {
    const children = middle.removeChildren();
    for (const child of children) {
        child.destroy();
    }
    const texture = G.resource.graphics(`${colorPath}_SLIDER_MIDDLE`);
    if (!texture) {
        const fallback = new Graphics();
        fallback.rect(0, -HITOBJ_CIRCLE_RADIUS, width, HITOBJ_CIRCLE_RADIUS * 2);
        fallback.fill(SLIDER_BORDER_COLOR);
        middle.addChild(fallback);
        return;
    }
    const fillWidth = Math.max(width - SLIDER_BORDER_WIDTH * 2, 1);
    const fill = new TilingSprite({
        texture,
        width: fillWidth,
        height: HITOBJ_CIRCLE_RADIUS * 2
    });
    fill.label = 'SLIDER_MIDDLE_FILL';
    fill.anchor.set(0, 0.5);
    fill.x = SLIDER_BORDER_WIDTH;
    fill.y = 0;
    fill.tileScale.set((HITOBJ_CIRCLE_RADIUS * 2) / texture.width, (HITOBJ_CIRCLE_RADIUS * 2) / texture.height);
    const topBorder = new Graphics();
    topBorder.rect(0, -HITOBJ_CIRCLE_RADIUS, width, SLIDER_BORDER_WIDTH).fill(0xffffff);
    const bottomBorder = new Graphics();
    bottomBorder.rect(0, HITOBJ_CIRCLE_RADIUS - SLIDER_BORDER_WIDTH, width, SLIDER_BORDER_WIDTH).fill(0xffffff);
    middle.addChild(fill);
    middle.addChild(topBorder);
    middle.addChild(bottomBorder);
}

function createSliderMiddle(colorPath: string, width: number): Container {
    const middle = new Container();
    middle.label = 'SLIDER_MIDDLE';
    populateSliderMiddle(middle, colorPath, width);
    return middle;
}

function createCircleHitObject(obj: HitObject, bpm1000: number, context: RenderContext): HitObjectSprite {
    const sprite = createBaseContainer(obj, bpm1000, context, 'CIRCLE');
    sprite.addChild(createCircleBody(context.colors[obj.color ?? 0]));
    return sprite;
}

function createSliderHitObject(obj: HitObject, bpm1000: number, context: RenderContext): HitObjectSprite {
    const slider = createBaseContainer(obj, bpm1000, context, 'SLIDER');
    const colorPath = context.colors[obj.color ?? 0];
    const body = createCircleBody(colorPath);
    const endCap = createCircleBody(colorPath);
    const tailTime1000 = obj.pos1000 + (obj.last || 0);
    const tailPositionX = calculateHitObjectX(bpm1000, tailTime1000, context.lastUpdated);
    const length = Math.max(HITOBJ_CIRCLE_RADIUS * 2, tailPositionX - slider.x);
    const bar = createSliderMiddle(colorPath, Math.max(0, length));
    bar.label = `SLIDER_BAR_${obj.pos1000}`;
    bar.x = HITOBJ_CIRCLE_RADIUS;
    bar.y = HITOBJ_CIRCLE_RADIUS;
    endCap.x = length;
    slider.width = length;
    slider.addChild(bar);
    slider.addChild(body);
    slider.addChild(endCap);
    return slider;
}

function createBonusHitObject(obj: HitObject, bpm1000: number, context: RenderContext): HitObjectSprite {
    const bonus = createBaseContainer(obj, bpm1000, context, 'BONUS');
    const outerRadius = BONUS_RADIUS;
    const fillRadius = Math.max(outerRadius - BONUS_GAP - BONUS_RING_WIDTH, outerRadius * 0.15);
    const ring = new Graphics();
    ring.label = `BONUS_RING_${obj.pos1000}`;
    ring.circle(0, 0, outerRadius - BONUS_RING_WIDTH * 0.5);
    ring.stroke({ width: BONUS_RING_WIDTH, color: 0x27c469, alpha: 1 });
    const fill = new Graphics();
    fill.label = `BONUS_FILL_${obj.pos1000}`;
    fill.circle(0, 0, fillRadius);
    fill.fill(0x27c469);
    bonus.addChild(ring);
    bonus.addChild(fill);
    bonus.pivot.set(0, 0);
    return bonus;
}

export function renderHitObjectSprite(obj: HitObject, bpm1000: number, context: RenderContext): HitObjectSprite {
    if (obj.type === 1) {
        return createSliderHitObject(obj, bpm1000, context);
    }
    if (obj.type === 2) {
        return createBonusHitObject(obj, bpm1000, context);
    }
    return createCircleHitObject(obj, bpm1000, context);
}
