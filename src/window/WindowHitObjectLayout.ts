import G from '../Global';
import type { TimingPoint } from '../types';

const { HITOBJ_MARGIN_SIZE, JUDGEMENT_LINE_LEFT } = G.constant;

export function findTimingPointIndex(timingPoints: TimingPoint[], time1000: number): number {
    let timingIndex = 0;
    while (timingIndex < timingPoints.length - 1 && time1000 > timingPoints[timingIndex + 1].pos1000) {
        ++timingIndex;
    }
    return timingIndex;
}

export function findBpmAtTime(timingPoints: TimingPoint[], time1000: number): number {
    const timingPoint = timingPoints[findTimingPointIndex(timingPoints, time1000)] || timingPoints[0];
    return timingPoint?.bpm1000 || 0;
}

export function calculateHitObjectX(bpm1000: number, objectTime1000: number, currentTime1000: number): number {
    const safeBpm1000 = Math.max(1, bpm1000 || 0);
    return safeBpm1000 * (objectTime1000 - currentTime1000) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT;
}

export function shouldShowEditorGhost(positionX: number): boolean {
    return positionX < JUDGEMENT_LINE_LEFT;
}

export function calculateEditorGhostProgress(bpm1000: number, positionX: number): number {
    return (JUDGEMENT_LINE_LEFT - positionX) / Math.max(1, bpm1000 || 0) * 1e3;
}
