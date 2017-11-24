/**
 * Time ruler window in editor
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition
} from '../Functions';
import WindowBase from './WindowBase';

const {
    TIME_RULER_WINDOW_HEIGHT,
    TIME_RULER_LINE_TOP,
    TIME_RULER_LINE_HEIGHT,
    TIME_RULER_COLORS,
    JUDGEMENT_LINE_LEFT
} = G.constant;

/**
 * Window that shows time ruler at top
 * @class
 */
export default class WindowTimeRuler extends WindowBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.zoom = 0.2;
        // timeline cache array
        this.timeLineObject = [];
        // shadow
        this.shadow = new PIXI.Graphics();
        this.shadow.id = 'RECT_SHADOW';
        this.shadow.beginFill(0x000000);
        this.shadow.drawRect(0, 0, 10000, TIME_RULER_WINDOW_HEIGHT);
        this.shadow.endFill();
        this.shadow.x = 0;
        this.shadow.y = 0;
        this.shadow.alpha = 0.3;
        this.stage.addChild(this.shadow);
        // shadow border-bottom
        this.shadowBorder = new PIXI.Graphics();
        this.shadowBorder.id = 'LINE_SHADOW_BORDER_BOTTOM';
        this.shadowBorder.lineStyle(1, 0xffffff, 1);
        this.shadowBorder.moveTo(0, TIME_RULER_WINDOW_HEIGHT);
        this.shadowBorder.lineTo(10000, TIME_RULER_WINDOW_HEIGHT);
        this.shadowBorder.x = 0;
        this.shadowBorder.y = 0;
        this.stage.addChild(this.shadowBorder);
        // time lines
        this.timeLinesInner = new PIXI.Container();
        this.timeLinesInner.id = 'SPRITE_TIME_LINES_INNER';
        this.timeLinesInner.y = 0;
        this.timeLinesInner.width = 1000;
        this.timeLinesInner.height = TIME_RULER_LINE_HEIGHT;
        setPosition(this.timeLinesInner, () => {
            this.timeLinesInner.x = JUDGEMENT_LINE_LEFT;
        }, true);
        // current time line
        const currentTimeLine = new PIXI.Graphics();
        currentTimeLine.id = 'LINE_CURRENT_TIME';
        currentTimeLine.lineStyle(3, 0xffffff, 1);
        currentTimeLine.moveTo(0, 50);
        currentTimeLine.lineTo(0, TIME_RULER_WINDOW_HEIGHT);
        currentTimeLine.x = JUDGEMENT_LINE_LEFT;
        currentTimeLine.y = -80;
        const timeLines = new PIXI.Container();
        timeLines.id = 'SPRITE_TIME_LINES_CONTAINER';
        timeLines.addChild(this.timeLinesInner);
        timeLines.addChild(currentTimeLine);
        timeLines.x = 0;
        timeLines.y = TIME_RULER_LINE_TOP;
        this.stage.addChild(timeLines);
    }
    /**
     * Delta paint to the left(<-) direction
     * @param {number} relativeTime - Current time
     */
    paintTpLeftTo(relativeTime) {
        setPosition(this.timeLinesInner, () => {
            this.timeLinesInner.x = Math.floor(-relativeTime * this.zoom);
        }, true);
        let position = -Infinity;
        // deque right
        while (this.timeLineObject.length > 0) {
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * this.timeLineObject[this.timeLineObject.length - 1].time);
            if (Math.floor(-relativeTime * this.zoom) + position > window.innerWidth) {
                this.timeLineObject.pop();
                this.timeLinesInner.removeChildAt(this.timeLinesInner.children.length - 1);
            } else {
                break;
            }
        }
        // enque left
        const first = this.timeLineObject[0];
        let prevPos = {
            tp: first.tp,
            tick: first.tick,
            time: first.time
        };
        let { tp, tick, time } = prevPos;
        position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
        while (Math.floor(-relativeTime * this.zoom) + position >= 0) {
            prevPos = G.tick.prev(prevPos.tp, prevPos.tick, true);
            tp = prevPos.tp;
            tick = prevPos.tick;
            time = prevPos.l;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            const o = {
                x: position,
                mod: G.tick.getTickModNumber(tp, tick),
                tp: tp,
                tick: tick,
                time: time
            };
            this.timeLineObject.unshift(o);
            this.timeLinesInner.addChildAt(this.getLineByObj(o), 0);
        }
    }
    /**
     * Delta paint to the right(->) direction
     * @param {number} relativeTime - Current time
     */
    paintTpRightTo(relativeTime) {
        setPosition(this.timeLinesInner, () => {
            this.timeLinesInner.x = Math.floor(-relativeTime * this.zoom);
        }, true);
        let position = -Infinity;
        // deque left
        while (this.timeLineObject.length > 0) {
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * this.timeLineObject[0].time);
            if (Math.floor(-relativeTime * this.zoom) + position < 0) {
                this.timeLineObject.shift();
                this.timeLinesInner.removeChildAt(0);
            } else {
                break;
            }
        }
        // enque right
        const last = this.timeLineObject[this.timeLineObject.length - 1];
        let nextPos = {
            tp: last.tp,
            tick: last.tick,
            time: last.time
        };
        let { tp, tick, time } = nextPos;
        position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
        while (Math.floor(-relativeTime * this.zoom) + position <= window.innerWidth) {
            nextPos = G.tick.next(nextPos.tp, nextPos.tick);
            tp = nextPos.tp;
            tick = nextPos.tick;
            time = nextPos.l;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            const o = {
                x: position,
                mod: G.tick.getTickModNumber(tp, tick),
                tp: tp,
                tick: tick,
                time: time
            };
            this.timeLineObject.push(o);
            this.timeLinesInner.addChild(this.getLineByObj(o));
        }
    }
    /**
     * Convert time line object to real PIXI graphics
     * @param {object} item - Object we want to convert
     */
    getLineByObj(item) {
        let height = 0;
        let color = TIME_RULER_COLORS[G.tick.divisor][Math.abs(item.mod.divisor)];
        if (item.mod.divisor === 0) {
            if (item.mod.tick === 0) {
                height = 20;
            } else {
                height = 10;
            }
        } else {
            height = 5;
        }
        const line = new PIXI.Graphics();
        line.id = 'LINE_TICK_' + item.mod.tick + '_' + item.mod.divisor + '_' + item.time;
        line.lineStyle(1, color, 1);
        line.moveTo(item.x, 0);
        line.lineTo(item.x, height);
        line.y = 20 - height;
        return line;
    }
    /**
     * Re-paint timing points
     * @param {number} relativeTime - Relative time, will be painted at zero point
     */
    repaintAllTimingPoints(relativeTime) {
        this.timeLinesInner.removeChildren();
        setPosition(this.timeLinesInner, () => {
            this.timeLinesInner.x = Math.floor(-relativeTime * this.zoom);
        }, true);
        const pos = G.tick.findPositionByTime(relativeTime);
        let tp, tick, time, position;
        // draw current tick first
        tp = pos.tp;
        tick = pos.tick;
        time = pos.l;
        position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
        this.timeLineObject = [{
            x: position,
            mod: G.tick.getTickModNumber(tp, tick),
            tp: tp,
            tick: tick,
            time: time
        }];
        // draw previous ticks
        position = Infinity;
        let prevPos = {
            tp: pos.tp,
            tick: pos.tick
        };
        while (Math.floor(-relativeTime * this.zoom) + position >= -JUDGEMENT_LINE_LEFT) {
            prevPos = G.tick.prev(prevPos.tp, prevPos.tick, true);
            tp = prevPos.tp;
            tick = prevPos.tick;
            time = prevPos.l;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            this.timeLineObject.unshift({
                x: position,
                mod: G.tick.getTickModNumber(tp, tick),
                tp: tp,
                tick: tick,
                time: time
            });
        }
        // draw next ticks
        position = -Infinity;
        let nextPos = {
            tp: pos.tp,
            tick: pos.tick
        };
        while (Math.floor(-relativeTime * this.zoom) + position <= window.innerWidth) {
            nextPos = G.tick.next(nextPos.tp, nextPos.tick);
            tp = nextPos.tp;
            tick = nextPos.tick;
            time = nextPos.l;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            this.timeLineObject.push({
                x: position,
                mod: G.tick.getTickModNumber(tp, tick),
                tp: tp,
                tick: tick,
                time: time
            });
        }
        // draw
        for (const item of this.timeLineObject) {
            this.timeLinesInner.addChild(this.getLineByObj(item));
        }
    }
}
