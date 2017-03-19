/**
 * Functions for timing points
 * @author Rex Zeng
 */

/**
 * Define timing object function class
 * @class
 */
export default class Tick {
    /**
     * @constructor
     * @param {array} tp - Timing points
     */
    constructor() {
        this.tp = [];
        this.currentTp = 0;
        this.currentTick = 0;
        this.divisor = 4;
        this.nextTickTime1000 = 0;
        this.prevTickTime1000 = 0;
    }
    /**
     * Set timing points
     * @param {array} tp - Timing point array
     */
    setTp(tp) {
        this.tp = tp;
    }
    /**
     * Set divisor
     * @param {number} divisor - Divisor
     * @param {number} time1000 - Current time (1000x)
     */
    setDivisor(divisor, time1000) {
        this.divisor = divisor;
        this.setTime(time1000, true);
    }
    /**
     * Set current time
     * @param {number} time1000 - Current time (1000x)
     * @param {boolean} flush - Clear current process, start from new
     * @param {boolean} half - Whether half the divisor for tick se
     */
    setTime(time1000, flush = false, half = false) {
        let tick = false;
        if (flush) {
            const pos = this.findPositionByTime(time1000);
            this.currentTp = pos.tp;
            this.currentTick = pos.tick;
            this.getPrevTick();
            this.getNextTick();
        } else if (time1000 < this.prevTickTime1000) {
            this.getPrevTick(true);
            this.getNextTick();
        } else if (time1000 >= this.nextTickTime1000) {
            this.getPrevTick();
            this.getNextTick(true);
            const divisor = this.divisor >> (half ? 1 : 0);
            const metronome = this.tp[this.currentTp].metronome << (half ? 1 : 0);
            if (this.currentTick % divisor == 0) {
                tick = (Math.floor(this.currentTick / divisor) % metronome == 0) ? 'high' : 'low';
            }
        }
        return tick;
    }
    /**
     * Find timing point and tick by current time
     * @param {number} time1000 - Current time (1000x)
     */
    findPositionByTime(time1000) {
        let l = 0;
        let r = this.tp.length - 1;
        let tp = 0;
        while (l != r) {
            tp = (l + r + 1) >> 1;
            if (this.tp[tp].pos1000 > time1000) {
                r = tp - 1;
            } else {
                l = tp;
            }
        }
        tp = l;
        const tpObj = this.tp[tp];
        const timePerTick = 60000000 / (tpObj.bpm1000 * this.divisor);
        const tick = Math.floor((time1000 - tpObj.pos1000) / timePerTick);
        return { tp, tick };
    }
    /**
     * Update prev tick from now
     * @param {boolean} update - Update currentTick or currentTp
     * @param {number} currentTime - Provided current time
     */
    getPrevTick(update = false, currentTime = null) {
        let tp, tpObj, tick;
        let ret = {
            tick: 0,
            time: 0,
        };
        if (currentTime == null) {
            tp = this.currentTp;
            tpObj = this.tp[tp];
            tick = this.currentTick;
        } else {
            ret = this.findPositionByTime(currentTime);
            tp = ret.tp;
            tpObj = this.tp[tp];
            tick = ret.tick;
        }
        const timePerTick = 60000000 / (tpObj.bpm1000 * this.divisor);
        const prevTpTime1000 = (tp == 0) ? -Infinity : this.tp[tp - 1].pos1000;
        let prevTickTime1000 = 0;
        // fix for 'current time is in a tick time'
        if (currentTime == null) {
            prevTickTime1000 = Math.floor(tpObj.pos1000 + (tick - 1) * timePerTick);
        } else {
            const currentTickTime = Math.floor(tpObj.pos1000 + tick * timePerTick);
            if (currentTime == currentTickTime) {
                prevTickTime1000 = Math.floor(tpObj.pos1000 + (tick - 1) * timePerTick);
            } else {
                prevTickTime1000 = currentTickTime;
            }
        }
        if (prevTpTime1000 < prevTickTime1000) {
            if (update) {
                this.currentTick--;
            } else {
                ret.tick--;
            }
            prevTickTime1000 = Math.floor(prevTickTime1000);
            if (currentTime == null) {
                this.prevTickTime1000 = prevTickTime1000;
            }
            return {
                tick: {
                    index: ret.tick,
                    metronome: this.tp[this.currentTp].metronome,
                    divisor: this.divisor,
                },
                time: prevTickTime1000,
            };
        } else {
            const tick = Math.floor((currentTime - this.tp[this.currentTp].pos1000) / timePerTick);
            if (update) {
                this.currentTp--;
                this.currentTick = tick;
            } else {
                ret.tp--;
                ret.tick = tick;
            }
            prevTickTime1000 = Math.floor(prevTpTime1000);
            if (currentTime == null) {
                this.prevTickTime1000 = prevTickTime1000;
            }
            return {
                tick: {
                    index: ret.tick,
                    metronome: this.tp[this.currentTp].metronome,
                    divisor: this.divisor,
                },
                time: prevTickTime1000,
            };
        }
    }
    /**
     * Update next tick from now
     * @param {boolean} update - Update currentTick or currentTp
     * @param {number} currentTime - Provided current time
     */
    getNextTick(update = false, currentTime = null) {
        let tp, tpObj, tick;
        let ret = {
            tick: 0,
            time: 0,
        };
        if (currentTime == null) {
            tp = this.currentTp;
            tpObj = this.tp[tp];
            tick = this.currentTick;
        } else {
            // fix for float uncertainty
            ret = this.findPositionByTime(currentTime + 1);
            tp = ret.tp;
            tpObj = this.tp[tp];
            tick = ret.tick;
        }
        const timePerTick = 60000000 / (tpObj.bpm1000 * this.divisor);
        const nextTpTime1000 = (tp == this.tp.length - 1) ? Infinity : this.tp[tp + 1].pos1000;
        let nextTickTime1000 = Math.floor(tpObj.pos1000 + (tick + 1) * timePerTick);
        if (nextTpTime1000 > nextTickTime1000) {
            if (update) {
                this.currentTick++;
            } else {
                ret.tick++;
            }
            nextTickTime1000 = Math.floor(nextTickTime1000);
            if (currentTime == null) {
                this.nextTickTime1000 = nextTickTime1000;
            }
            return {
                tick: {
                    index: ret.tick,
                    metronome: this.tp[this.currentTp].metronome,
                    divisor: this.divisor,
                },
                time: nextTickTime1000,
            };
        } else {
            if (update) {
                this.currentTp++;
                this.currentTick = 0;
            } else {
                ret.tp++;
                ret.tick = 0;
            }
            nextTickTime1000 = Math.floor(nextTpTime1000);
            if (currentTime == null) {
                this.nextTickTime1000 = nextTickTime1000;
            }
            return {
                tick: {
                    index: ret.tick,
                    metronome: this.tp[this.currentTp].metronome,
                    divisor: this.divisor,
                },
                time: nextTickTime1000,
            };
        }
    }
}
