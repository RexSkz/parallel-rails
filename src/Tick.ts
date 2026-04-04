/**
 * Functions for timing points
 * All time units are in millisecond, after Math.floor
 * @author Rex Zeng
 */

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

    getTickModNumber(tp: number, tick: number, half = false) {
        const divisor = this.divisor >> (half ? 1 : 0);
        const metronome = this.tp[tp].metronome << (half ? 1 : 0);
        return {
            tick: Math.floor(tick / divisor) % metronome,
            divisor: tick % divisor
        };
    }

    findPositionByTime(time: number, tp: number | null = null, tick: number | null = null) {
        let currentTp = tp;
        if (currentTp === null) {
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
            currentTp = l;
        }
        const o = this.tp[currentTp];
        const timePerTick = this.getTimePerTick(currentTp);
        let currentTick = tick;
        if (currentTick === null) {
            currentTick = Math.floor((time - o.pos1000) / timePerTick);
        }
        const nextTickTime = o.pos1000 + Math.floor((currentTick + 1) * timePerTick);
        const lEdge = o.pos1000 + Math.floor(currentTick * timePerTick);
        const rEdge = Math.min(nextTickTime, (currentTp + 1 === this.tp.length) ? Infinity : this.tp[currentTp + 1].pos1000);
        return {
            tp: currentTp,
            tick: currentTick,
            l: lEdge,
            r: rEdge
        };
    }

    prev(tp: number, tick: number, atEdge = false) {
        const totalTick = this.getTotalTickOfPrevTp(tp);
        const lastTickTime = this.getTime(tp, atEdge ? (tick - 1) : tick);
        const lastTpTime = this.getTime(tp - 1, totalTick);
        if (lastTpTime >= lastTickTime) {
            const pos = this.findPositionByTime(lastTpTime, tp - 1, totalTick);
            return {
                tp: pos.tp,
                tick: pos.tick,
                metronome: this.tp[tp - 1].metronome,
                divisor: this.divisor,
                l: pos.l,
                r: pos.r
            };
        }
        const pos = this.findPositionByTime(lastTickTime, tp, atEdge ? (tick - 1) : tick);
        return {
            tp: pos.tp,
            tick: pos.tick,
            metronome: this.tp[tp].metronome,
            divisor: this.divisor,
            l: pos.l,
            r: pos.r
        };
    }

    next(tp: number, tick: number) {
        const nextTickTime = this.getTime(tp, tick + 1);
        const nextTpTime = this.getTime(tp + 1, 0);
        if (nextTpTime <= nextTickTime) {
            const pos = this.findPositionByTime(nextTpTime, tp + 1, 0);
            return {
                tp: pos.tp,
                tick: pos.tick,
                metronome: this.tp[tp + 1].metronome,
                divisor: this.divisor,
                l: pos.l,
                r: pos.r
            };
        }
        const pos = this.findPositionByTime(nextTickTime, tp, tick + 1);
        return {
            tp: pos.tp,
            tick: pos.tick,
            metronome: this.tp[tp].metronome,
            divisor: this.divisor,
            l: pos.l,
            r: pos.r
        };
    }
}
