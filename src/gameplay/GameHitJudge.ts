import type { HitInputState, HitJudgeDecision, HitObject } from '../types';

function buildContext(hitObject: HitObject, time: number, referenceTime1000 = hitObject.pos1000) {
    const time1000 = time * 1000;
    const delta = Math.floor(time1000 - referenceTime1000);
    const absDelta = Math.abs(delta);
    return {
        objectTime1000: referenceTime1000,
        currentTime1000: time1000,
        delta1000: delta,
        absDelta1000: absDelta
    };
}

function judgeBonusHit(hitObject: HitObject, time: number, input: HitInputState): HitJudgeDecision | null {
    const context = buildContext(hitObject, time);
    if (context.absDelta1000 > 200 && context.objectTime1000 < context.currentTime1000) {
        return {
            judgement: 0,
            type: '0',
            context,
            preserveCombo: true,
            showFeedback: false
        };
    }
    if (context.absDelta1000 > 300) {
        return null;
    }
    if (!input.bonusPressed) {
        return null;
    }
    if (context.absDelta1000 <= 20) {
        return { judgement: 300, type: '300g', context };
    }
    if (context.absDelta1000 <= 60) {
        return { judgement: 300, type: '300', context };
    }
    if (context.absDelta1000 <= 100) {
        return { judgement: 200, type: '200', context };
    }
    if (context.absDelta1000 <= 160) {
        return { judgement: 100, type: '100', context };
    }
    if (context.absDelta1000 <= 220) {
        return { judgement: 50, type: '50', context };
    }
    return {
        judgement: 0,
        type: '0',
        context,
        preserveCombo: true,
        showFeedback: false
    };
}

function judgeTapHit(hitObject: HitObject, time: number, input: HitInputState): HitJudgeDecision | null {
    const context = buildContext(hitObject, time);
    const color = hitObject.color === undefined ? -1 : hitObject.color;
    if (context.absDelta1000 > 200 && context.objectTime1000 < context.currentTime1000) {
        return {
            judgement: -2,
            type: '0',
            context
        };
    }
    if (context.absDelta1000 > 300) {
        return null;
    }
    if ((color === 0 && input.greenPressed) || (color === 1 && input.orangePressed)) {
        return {
            judgement: -1,
            type: '0',
            context
        };
    }
    if (!input.notePressed) {
        return null;
    }
    if (context.absDelta1000 <= 20) {
        return { judgement: 300, type: '300g', context };
    }
    if (context.absDelta1000 <= 60) {
        return { judgement: 300, type: '300', context };
    }
    if (context.absDelta1000 <= 100) {
        return { judgement: 200, type: '200', context };
    }
    if (context.absDelta1000 <= 160) {
        return { judgement: 100, type: '100', context };
    }
    if (context.absDelta1000 <= 220) {
        return { judgement: 50, type: '50', context };
    }
    return {
        judgement: 0,
        type: '0',
        context
    };
}

function judgeSliderHit(hitObject: HitObject, time: number, input: HitInputState): HitJudgeDecision | null {
    const headDecision = judgeTapHit(hitObject, time, input);
    if (!headDecision || headDecision.judgement <= 0) {
        return headDecision;
    }
    return {
        ...headDecision,
        consumeObject: false
    };
}

export function judgeSliderTail(hitObject: HitObject, time: number, input: HitInputState): HitJudgeDecision | null {
    const tailTime1000 = hitObject.pos1000 + (hitObject.last || 0);
    const context = buildContext(hitObject, time, tailTime1000);
    const holdActive = hitObject.color === 0 ? input.orangeHeld : input.greenHeld;
    const releasedNow = hitObject.color === 0 ? input.orangeReleased : input.greenReleased;
    if (context.delta1000 < -220) {
        if (!holdActive) {
            return {
                judgement: -2,
                type: '0',
                context,
                consumeObject: true
            };
        }
        return null;
    }
    if (holdActive && context.delta1000 > 220) {
        return {
            judgement: -2,
            type: '0',
            context,
            consumeObject: true
        };
    }
    if (!releasedNow) {
        return null;
    }
    if (context.absDelta1000 <= 20) {
        return { judgement: 300, type: '300g', context, consumeObject: true };
    }
    if (context.absDelta1000 <= 60) {
        return { judgement: 300, type: '300', context, consumeObject: true };
    }
    if (context.absDelta1000 <= 100) {
        return { judgement: 200, type: '200', context, consumeObject: true };
    }
    if (context.absDelta1000 <= 160) {
        return { judgement: 100, type: '100', context, consumeObject: true };
    }
    if (context.absDelta1000 <= 220) {
        return { judgement: 50, type: '50', context, consumeObject: true };
    }
    return {
        judgement: -2,
        type: '0',
        context,
        consumeObject: true
    };
}

export function judgeHit(hitObject: HitObject | null, time: number, input: HitInputState): HitJudgeDecision | null {
    if (!hitObject) {
        return null;
    }
    if (hitObject.type === 2) {
        return judgeBonusHit(hitObject, time, input);
    }
    if (hitObject.type === 1) {
        return judgeSliderHit(hitObject, time, input);
    }
    return judgeTapHit(hitObject, time, input);
}
