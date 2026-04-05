import type { BeatmapData, HitObject, TimingPoint } from '../types';

const DEFAULT_TIMING_POINT: TimingPoint = {
    bpm1000: 120000,
    pos1000: 0,
    metronome: 4,
    kiai: false
};

function sanitizeTimingPoint(input: Partial<TimingPoint> | null | undefined): TimingPoint {
    const bpm1000 = Math.max(1, Math.round(Number(input?.bpm1000) || DEFAULT_TIMING_POINT.bpm1000));
    const pos1000 = Math.max(0, Math.round(Number(input?.pos1000) || 0));
    const metronome = Math.min(4, Math.max(2, Math.round(Number(input?.metronome) || DEFAULT_TIMING_POINT.metronome)));
    return {
        bpm1000,
        pos1000,
        metronome,
        kiai: Boolean(input?.kiai)
    };
}

function sanitizeHitObject(input: Partial<HitObject> | null | undefined): HitObject {
    const type = [0, 1, 2].includes(Number(input?.type)) ? Number(input?.type) : 0;
    const pos1000 = Math.max(0, Math.round(Number(input?.pos1000) || 0));
    if (type === 2) {
        return {
            type,
            pos1000,
            delta: Math.round(Number(input?.delta) || 0),
            duration1000: Math.max(1, Math.round(Number(input?.duration1000) || 1000))
        };
    }
    return {
        type,
        pos1000,
        color: Number(input?.color) === 0 ? 0 : 1,
        last: type === 1 ? Math.max(1, Math.round(Number(input?.last) || 1)) : undefined
    };
}

export function sanitizeBeatmapData(data: Partial<BeatmapData> | null | undefined): BeatmapData {
    const timingPoints = Array.isArray(data?.timingPoints) ? data.timingPoints.map(item => sanitizeTimingPoint(item)) : [];
    timingPoints.sort((left, right) => left.pos1000 - right.pos1000);
    if (!timingPoints.length || timingPoints[0].pos1000 !== 0) {
        timingPoints.unshift(DEFAULT_TIMING_POINT);
    }
    const dedupedTimingPoints: TimingPoint[] = [];
    for (const point of timingPoints) {
        if (dedupedTimingPoints.length && dedupedTimingPoints[dedupedTimingPoints.length - 1].pos1000 === point.pos1000) {
            dedupedTimingPoints[dedupedTimingPoints.length - 1] = point;
        } else {
            dedupedTimingPoints.push(point);
        }
    }

    const hitObjects = Array.isArray(data?.hitObjects) ? data.hitObjects.map(item => sanitizeHitObject(item)) : [];
    hitObjects.sort((left, right) => left.pos1000 - right.pos1000);
    const dedupedHitObjects: HitObject[] = [];
    for (const obj of hitObjects) {
        if (dedupedHitObjects.length && dedupedHitObjects[dedupedHitObjects.length - 1].pos1000 === obj.pos1000) {
            continue;
        }
        dedupedHitObjects.push(obj);
    }

    return {
        artist: String(data?.artist || ''),
        name: String(data?.name || ''),
        creator: String(data?.creator || ''),
        timingPoints: dedupedTimingPoints,
        hitObjects: dedupedHitObjects,
        currentTime: Math.max(0, Number(data?.currentTime) || 0),
        duration: Math.max(0, Number(data?.duration) || 0),
        playFromTime: Number(data?.playFromTime) || 0,
        detail: Math.max(1, Math.round(Number(data?.detail) || 4)),
        isEditMode: Boolean(data?.isEditMode)
    };
}

export function getHitObjectEndTime1000(hitObject: HitObject | null | undefined): number {
    if (!hitObject) {
        return 0;
    }
    if (hitObject.type === 1) {
        return hitObject.pos1000 + Math.max(1, hitObject.last || 1);
    }
    return hitObject.pos1000;
}
