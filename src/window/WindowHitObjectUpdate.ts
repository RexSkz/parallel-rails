import type { HitObject } from '../types';

export function advanceHitObjectCursor(hitObjects: HitObject[], currentIndex: number, time1000: number): number {
    let nextIndex = currentIndex;
    while (nextIndex < hitObjects.length - 1 && hitObjects[nextIndex].pos1000 < time1000) {
        ++nextIndex;
    }
    return nextIndex;
}

export function rewindHitObjectCursor(hitObjects: HitObject[], currentIndex: number, time1000: number): number {
    let nextIndex = currentIndex;
    while (nextIndex > 1 && hitObjects[nextIndex - 1].pos1000 >= time1000) {
        --nextIndex;
    }
    return nextIndex;
}
