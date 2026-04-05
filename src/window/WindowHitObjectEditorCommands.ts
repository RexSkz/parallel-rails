import type { HitObject } from '../types';

export function findHitObjectIndex(hitObjects: HitObject[], time1000: number): number {
    let l = 0;
    let r = hitObjects.length - 1;
    while (l <= r) {
        const m = (l + r + 1) >> 1;
        if (hitObjects[m].pos1000 > time1000) {
            r = m - 1;
        } else if (hitObjects[m].pos1000 < time1000) {
            l = m + 1;
        } else {
            return m;
        }
    }
    return -1;
}

export function buildHitObjectInsertCommand(
    hitObjects: HitObject[],
    currentIndex: number,
    lastUpdated: number,
    payload: { type: number; color?: number; last?: number }
) {
    const obj: HitObject = {
        type: payload.type,
        pos1000: lastUpdated,
        color: payload.color,
        last: payload.last
    };
    let insertIndex = currentIndex;
    if (
        currentIndex === hitObjects.length - 1 &&
        hitObjects[currentIndex] &&
        hitObjects[currentIndex].pos1000 < lastUpdated
    ) {
        insertIndex += 1;
    }
    return { obj, insertIndex };
}
