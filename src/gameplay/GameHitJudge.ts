import type { HitInputState, HitJudgeDecision, HitObject } from '../types';

export function judgeHit(hitObject: HitObject | null, time: number, input: HitInputState): HitJudgeDecision | null {
    if (!hitObject) {
        return null;
    }
    const pos1000 = hitObject.pos1000;
    const time1000 = time * 1000;
    const delta = Math.floor(time1000 - pos1000);
    const absDelta = Math.abs(delta);
    const color = hitObject.color === undefined ? -1 : hitObject.color;
    const context = {
        objectTime1000: pos1000,
        currentTime1000: time1000,
        delta1000: delta,
        absDelta1000: absDelta
    };

    if (absDelta > 200 && pos1000 < time1000) {
        return {
            judgement: -2,
            type: '0',
            context
        };
    }
    if (absDelta > 300) {
        return null;
    }
    if (
        (color === 0 && input.greenPressed) ||
        (color === 1 && input.orangePressed)
    ) {
        return {
            judgement: -1,
            type: '0',
            context
        };
    }
    if (!input.anyPressed) {
        return null;
    }
    if (absDelta <= 20) {
        return { judgement: 300, type: '300g', context };
    }
    if (absDelta <= 60) {
        return { judgement: 300, type: '300', context };
    }
    if (absDelta <= 100) {
        return { judgement: 200, type: '200', context };
    }
    if (absDelta <= 160) {
        return { judgement: 100, type: '100', context };
    }
    if (absDelta <= 220) {
        return { judgement: 50, type: '50', context };
    }
    return {
        judgement: 0,
        type: '0',
        context
    };
}
