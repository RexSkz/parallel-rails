import G from '../Global';
import type { HitObjectSprite } from '../types';

const { HITOBJ_CIRCLE_RADIUS } = G.constant;

export function animateHitObjectJudgement(sprite: HitObjectSprite, hitJudgement: number, circleDefaultScale: number) {
    const currentX = sprite.x;
    sprite.hitDone = true;
    if (hitJudgement > 0) {
        sprite.transformScale = circleDefaultScale;
        G.animation.set(sprite, (_w: number, h: number, _self: any) => ({
            x: currentX,
            y: 0.5 * h,
            transformScale: 3 * circleDefaultScale,
            alpha: 0
        }), 20, G.animation.EASE_OUT_QUAD);
    } else if (hitJudgement === 0 || hitJudgement === -2) {
        G.animation.set(sprite, (_w: number, h: number, self: any) => ({
            x: currentX - HITOBJ_CIRCLE_RADIUS * self.bpm1000 / 32000,
            y: 0.5 * h,
            alpha: 0
        }), 20, G.animation.LINEAR);
    } else if (hitJudgement === -1) {
        G.animation.set(sprite, (_w: number, h: number, _self: any) => ({
            x: currentX,
            y: 0.5 * h + HITOBJ_CIRCLE_RADIUS * 1.5,
            alpha: 0
        }), 20, G.animation.LINEAR);
    }
}
