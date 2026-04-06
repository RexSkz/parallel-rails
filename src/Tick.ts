/**
 * Functions for timing points
 * All time units are in millisecond, after Math.floor
 * @author Rex Zeng
 */

import type { TickCursor, TickMod } from './types';

export default class Tick {
    divisor: number;
    tp: Array<{ bpm1000: number; pos1000: number; metronome: number }>;
    currentTp: number;
    currentTick: number;
    currentTime: number;
    prevTickTime: number;
    nextTickTime: number;

    constructor() {
        this.divisor = 4;
        this.tp = [];
        this.currentTp = 0;
        this.currentTick = 0;
        this.currentTime = 0;
        this.prevTickTime = 0;
        this.nextTickTime = 0;
    }

    getTimePerTick(tp: number) {
        const o = this.tp[tp];
        if (!o) {
            return Infinity;
        }
        return 60000000 / (o.bpm1000 * this.divisor);
    }

    getTime(tp: number, tick: number) {
        if (tp < 0) return -Infinity;
        if (tp >= this.tp.length) return Infinity;
        return this.tp[tp].pos1000 + Math.floor(this.getTimePerTick(tp) * tick);
    }

    getTotalTickOfPrevTp(tp: number) {
        if (tp === 0) return 0;
        const timeDiff = this.tp[tp].pos1000 - this.tp[tp - 1].pos1000;
        return Math.floor(timeDiff / this.getTimePerTick(tp - 1));
    }

    getTickMod(timingPointIndex: number, tickIndex: number, half = false): TickMod {
        const divisor = this.divisor >> (half ? 1 : 0);
        const metronome = this.tp[timingPointIndex].metronome << (half ? 1 : 0);
        return {
            tick: Math.floor(tickIndex / divisor) % metronome,
            divisor: tickIndex % divisor
        };
    }

    createCursorByTime(time: number, timingPointIndex: number | null = null, tickIndex: number | null = null, half = false): TickCursor {
        let currentTimingPointIndex = timingPointIndex;
        const position = this.locateTickWindow(time, currentTimingPointIndex, tickIndex);
        return this.createCursor(position.timingPointIndex, position.tickIndex, half, position.startTime, position.endTime);
    }

    createCursor(timingPointIndex: number, tickIndex: number, half = false, startTime?: number, endTime?: number): TickCursor {
        const safeTimingPointIndex = Math.max(0, Math.min(timingPointIndex, Math.max(this.tp.length - 1, 0)));
        const baseStartTime = startTime ?? this.getTime(timingPointIndex, tickIndex);
        const baseEndTime = endTime ?? this.calculateTickEndTime(timingPointIndex, tickIndex);
        const metronome = this.tp[safeTimingPointIndex]?.metronome || 4;
        return {
            time: baseStartTime,
            startTime: baseStartTime,
            endTime: baseEndTime,
            timingPointIndex: safeTimingPointIndex,
            tickIndex,
            metronome,
            divisor: this.divisor,
            mod: this.tp.length ? this.getTickMod(safeTimingPointIndex, tickIndex, half) : { tick: 0, divisor: 0 }
        };
    }

    nextCursor(cursor: TickCursor, half = false): TickCursor {
        const nextTickTime = this.getTime(cursor.timingPointIndex, cursor.tickIndex + 1);
        const nextTpTime = this.getTime(cursor.timingPointIndex + 1, 0);
        if (!Number.isFinite(nextTickTime) && !Number.isFinite(nextTpTime)) {
            return {
                ...cursor,
                time: Infinity,
                startTime: Infinity,
                endTime: Infinity
            };
        }
        if (nextTpTime <= nextTickTime) {
            return this.createCursorByTime(nextTpTime, cursor.timingPointIndex + 1, 0, half);
        }
        return this.createCursorByTime(nextTickTime, cursor.timingPointIndex, cursor.tickIndex + 1, half);
    }

    prevCursor(cursor: TickCursor, atEdge = false, half = false): TickCursor {
        const totalTick = this.getTotalTickOfPrevTp(cursor.timingPointIndex);
        const lastTickTime = this.getTime(cursor.timingPointIndex, atEdge ? (cursor.tickIndex - 1) : cursor.tickIndex);
        const lastTpTime = this.getTime(cursor.timingPointIndex - 1, totalTick);
        if (!Number.isFinite(lastTickTime) && !Number.isFinite(lastTpTime)) {
            return {
                ...cursor,
                time: -Infinity,
                startTime: -Infinity,
                endTime: -Infinity
            };
        }
        if (lastTpTime >= lastTickTime) {
            return this.createCursorByTime(lastTpTime, cursor.timingPointIndex - 1, totalTick, half);
        }
        return this.createCursorByTime(lastTickTime, cursor.timingPointIndex, atEdge ? (cursor.tickIndex - 1) : cursor.tickIndex, half);
    }

    private locateTickWindow(time: number, timingPointIndex: number | null = null, tickIndex: number | null = null) {
        if (!this.tp.length) {
            return {
                timingPointIndex: 0,
                tickIndex: 0,
                startTime: 0,
                endTime: Infinity
            };
        }
        let currentTimingPointIndex = timingPointIndex;
        if (currentTimingPointIndex === null) {
            let l = 0;
            let r = this.tp.length - 1;
            while (l !== r) {
                const middle = (l + r + 1) >> 1;
                if (this.tp[middle].pos1000 > time) {
                    r = middle - 1;
                } else {
                    l = middle;
                }
            }
            currentTimingPointIndex = l;
        }
        const o = this.tp[currentTimingPointIndex];
        const timePerTick = this.getTimePerTick(currentTimingPointIndex);
        let currentTickIndex = tickIndex;
        if (currentTickIndex === null) {
            currentTickIndex = Math.floor((time - o.pos1000) / timePerTick);
        }
        const nextTickTime = o.pos1000 + Math.floor((currentTickIndex + 1) * timePerTick);
        const startTime = o.pos1000 + Math.floor(currentTickIndex * timePerTick);
        const endTime = Math.min(nextTickTime, (currentTimingPointIndex + 1 === this.tp.length) ? Infinity : this.tp[currentTimingPointIndex + 1].pos1000);
        return {
            timingPointIndex: currentTimingPointIndex,
            tickIndex: currentTickIndex,
            startTime,
            endTime
        };
    }

    private calculateTickEndTime(timingPointIndex: number, tickIndex: number) {
        const nextTickTime = this.getTime(timingPointIndex, tickIndex + 1);
        return Math.min(nextTickTime, (timingPointIndex + 1 === this.tp.length) ? Infinity : this.tp[timingPointIndex + 1].pos1000);
    }
}
