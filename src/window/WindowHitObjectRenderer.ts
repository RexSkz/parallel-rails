import G from '../Global';
import type { HitObject, HitObjectSprite } from '../types';
import { calculateHitObjectX } from './WindowHitObjectLayout';

const { HITOBJ_CIRCLE_RADIUS } = G.constant;

type RenderContext = {
    colors: Record<number, string>;
    lastUpdated: number;
    defaultRailY: (height: number) => number;
};

function createCircleHitObject(obj: HitObject, bpm1000: number, context: RenderContext): HitObjectSprite {
    const positionX = calculateHitObjectX(bpm1000, obj.pos1000, context.lastUpdated);
    const circle = G.graphics.createImage(context.colors[obj.color ?? 0], (_w: number, h: number, _self: any) => ({
        x: positionX,
        y: context.defaultRailY(h)
    })) as HitObjectSprite;
    circle.label = 'CIRCLE_' + obj.pos1000;
    circle.anchor.x = 0.5;
    circle.anchor.y = 0.5;
    circle.bpm1000 = bpm1000;
    circle.hitDone = false;
    circle.width = HITOBJ_CIRCLE_RADIUS * 2;
    circle.height = HITOBJ_CIRCLE_RADIUS * 2;
    return circle;
}

export function renderHitObjectSprite(obj: HitObject, bpm1000: number, context: RenderContext): HitObjectSprite {
    if (obj.type === 0) {
        return createCircleHitObject(obj, bpm1000, context);
    }
    if (obj.type === 1) {
        return createCircleHitObject(obj, bpm1000, context);
    }
    if (obj.type === 2) {
        return createCircleHitObject(obj, bpm1000, context);
    }
    return createCircleHitObject(obj, bpm1000, context);
}
