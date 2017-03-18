/**
 * Functions for timing points
 * @author Rex Zeng
 */

/**
 * Define timing object function class
 * @class
 */
class Tick {
    /**
     * @constructor
     * @param {array} tp - Timing points
     */
    constructor() {
        this.tp = [];
        this.currentTp = 0;
        this.currentTick = 0;
        this.detail = 8;
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
     * Set current time
     * @param {number} time1000 - Current time (1000x)
     * @param {boolean} flush - Clear current process, start from new
     */
    setTime(time1000, flush = false) {
        let tick = false;
        if (flush) {
            const pos = this.findPositionByTime(time1000);
            this.currentTp = pos.tp;
            this.currentTick = pos.tick;
            this.updatePrevTick(time1000);
            this.updateNextTick(time1000);
        } else if (time1000 < this.prevTickTime1000) {
            this.updatePrevTick(time1000, true);
            this.updateNextTick(time1000);
        } else if (time1000 >= this.nextTickTime1000) {
            this.updatePrevTick(time1000);
            this.updateNextTick(time1000, true);
            if (this.currentTick % this.detail == 0) {
                tick = (Math.floor(this.currentTick / this.detail) % this.tp[this.currentTp].metronome == 0) ? 'high' : 'low';
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
        const timePerTick = 60000000 / (tpObj.bpm1000 * this.detail);
        const tick = Math.floor((time1000 - tpObj.pos1000) / timePerTick);
        return { tp, tick };
    }
    /**
     * Update prev tick from now
     * @param {number} currentTime - Current time
     * @param {boolean} update - Update currentTick or currentTp
     */
    updatePrevTick(currentTime, update = false) {
        const timePerTick = 60000000 / (this.tp[this.currentTp].bpm1000 * this.detail);
        const prevTpTime1000 = (this.currentTp == 0) ? -Infinity : this.tp[this.currentTp - 1].pos1000;
        const prevTickTime1000 = this.tp[this.currentTp].pos1000 + (this.currentTick - 1) * timePerTick;
        if (prevTpTime1000 < prevTickTime1000) {
            if (update) {
                this.currentTick--;
            }
            this.prevTickTime1000 = prevTickTime1000;
        } else {
            if (update) {
                this.currentTp--;
                this.currentTick = Math.floor((currentTime - this.tp[this.currentTp].pos1000) / timePerTick);
            }
            this.prevTickTime1000 = prevTpTime1000;
        }
    }
    /**
     * Update next tick from now
     * @param {number} currentTime - Current time
     * @param {boolean} update - Update currentTick or currentTp
     */
    updateNextTick(currentTime, update = false) {
        const timePerTick = 60000000 / (this.tp[this.currentTp].bpm1000 * this.detail);
        const nextTpTime1000 = (this.currentTp == this.tp.length - 1) ? Infinity : this.tp[this.currentTp + 1].pos1000;
        const nextTickTime1000 = this.tp[this.currentTp].pos1000 + (this.currentTick + 1) * timePerTick;
        if (nextTpTime1000 > nextTickTime1000) {
            if (update) {
                this.currentTick++;
            }
            this.nextTickTime1000 = nextTickTime1000;
        } else {
            if (update) {
                this.currentTp++;
                this.currentTick = 0;
            }
            this.nextTickTime1000 = nextTpTime1000;
        }
    }
}

export default new Tick;
