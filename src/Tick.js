/**
 * Functions for timing points
 * All time units are in millisecond, after Math.floor
 * @author Rex Zeng
 */

/**
 * Define class for timing points
 * @class
 */
export default class Tick {
    /**
     * @constructor
     */
    constructor() {
        this.divisor = 4;
        this.tp = [];
        this.currentTp = 0;
        this.currentTick = 0;
        this.currentTime = 0;
        this.prevTickTime = 0;
        this.nextTickTime = 0;
    }
    /**
     * Calculate time per tick
     * @param {number} tp - Timing point index
     */
    getTimePerTick(tp) {
        const o = this.tp[tp];
        return 60000000 / (o.bpm1000 * this.divisor);
    }
    /**
     * Get time by tp and tick index
     * @param {number} tp - Timing point index
     * @param {number} tick - Tick index
     */
    getTime(tp, tick) {
        if (tp < 0) {
            return -Infinity;
        } else if (tp >= this.tp.length) {
            return Infinity;
        } else {
            return this.tp[tp].pos1000 + Math.floor(this.getTimePerTick(tp) * tick);
        }
    }
    /**
     * Get total tick of last tp
     * @param {number} tp - Timing point index
     */
    getTotalTickOfPrevTp(tp) {
        if (tp == 0) {
            return 0;
        }
        const timeDiff = this.tp[tp].pos1000 - this.tp[tp - 1].pos1000;
        return Math.floor(timeDiff / this.getTimePerTick(tp - 1));
    }
    /**
     * Set divisor
     * @param {number} divisor - Divisor
     */
    setDivisor(divisor) {
        this.divisor = divisor;
    }
    /**
     * Get tick mod number, used for draw tick line
     * @param {number} tp - Timing point index
     * @param {number} tick - Tick index
     * @param {boolean} half - Whether half the divisor for tick se
     */
    getTickModNumber(tp, tick, half) {
        const divisor = this.divisor >> (half ? 1 : 0);
        const metronome = this.tp[tp].metronome << (half ? 1 : 0);
        if (tick % divisor == 0) {
            return Math.floor(tick / divisor) % metronome;
        } else {
            return false;
        }
    }
    /**
     * Find timing point, tick, edges by time
     * l and r means this time belongs to [l, r)
     * @param {number} time - Current time
     * @param {number} tp - Timing point index
     * @param {number} tick - Tick index
     */
    findPositionByTime(time, tp = null, tick = null) {
        if (tp == null) {
            let l = 0, r = this.tp.length - 1;
            while (l != r) {
                tp = (l + r + 1) >> 1;
                if (this.tp[tp].pos1000 > time) {
                    r = tp - 1;
                } else {
                    l = tp;
                }
            }
            tp = l;
        }
        const o = this.tp[tp];
        const timePerTick = this.getTimePerTick(tp);
        if (tick == null) {
            tick = Math.floor((time - o.pos1000) / timePerTick);
        }
        const nextTickTime = o.pos1000 + Math.floor((tick + 1) * timePerTick);
        const lEdge = o.pos1000 + Math.floor(tick * timePerTick);
        const rEdge = Math.min(nextTickTime, (tp + 1 == this.tp.length) ? Infinity : this.tp[tp + 1].pos1000);
        return {
            tp: tp,
            tick: tick,
            l: lEdge,
            r: rEdge,
        };
    }
    /**
     * Update prev tick from now
     * @param {number} tp - Current timing point index
     * @param {number} tick - Current tick index
     * @param {boolean} atEdge - Whether it's at edge
     */
    prev(tp, tick, atEdge = false) {
        const totalTick = this.getTotalTickOfPrevTp(tp);
        const lastTickTime = this.getTime(tp, atEdge ? (tick - 1) : tick);
        const lastTpTime = this.getTime(tp - 1, totalTick);
        if (lastTpTime >= lastTickTime) {
            // tp first
            const pos = this.findPositionByTime(lastTpTime, tp - 1, totalTick);
            return {
                tp: pos.tp,
                tick: pos.tick,
                metronome: this.tp[tp - 1].metronome,
                divisor: this.divisor,
                l: pos.l,
                r: pos.r,
            };
        } else {
            const pos = this.findPositionByTime(lastTickTime, tp, atEdge ? (tick - 1) : tick);
            return {
                tp: pos.tp,
                tick: pos.tick,
                metronome: this.tp[tp].metronome,
                divisor: this.divisor,
                l: pos.l,
                r: pos.r,
            };
        }
    }
    /**
     * Update next tick from now
     * @param {number} tp - Current timing point index
     * @param {number} tick - Current tick index
     */
    next(tp, tick) {
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
                r: pos.r,
            };
        } else {
            const pos = this.findPositionByTime(nextTickTime, tp, tick + 1);
            return {
                tp: pos.tp,
                tick: pos.tick,
                metronome: this.tp[tp].metronome,
                divisor: this.divisor,
                l: pos.l,
                r: pos.r,
            };
        }
    }
}
