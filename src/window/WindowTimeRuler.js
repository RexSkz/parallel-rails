/**
 * Time ruler window in editor
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
} from '../Functions';
import WindowBase from './WindowBase';

const {
    MAIN_FONT,
    MAIN_FONT_SIZE,
    TIME_RULER_WINDOW_HEIGHT,
    TIME_RULER_LINE_TOP,
    TIME_RULER_LINE_HEIGHT,
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
        // timeline cache array
        this.timeLineObject = [];
        // shadow
        this.shadow = new PIXI.Graphics;
        this.shadow.beginFill(0x000000);
        this.shadow.drawRect(0, 0, 10000, TIME_RULER_WINDOW_HEIGHT);
        this.shadow.endFill();
        this.shadow.x = 0;
        this.shadow.y = 0;
        this.shadow.alpha = 0.3;
        this.stage.addChild(this.shadow);
        // shadow border-bottom
        this.shadowBorder = new PIXI.Graphics;
        this.shadowBorder.lineStyle(1, 0xFFFFFF, 1);
        this.shadowBorder.moveTo(0, TIME_RULER_WINDOW_HEIGHT);
        this.shadowBorder.lineTo(10000, TIME_RULER_WINDOW_HEIGHT);
        this.shadowBorder.x = 0;
        this.shadowBorder.y = 0;
        this.stage.addChild(this.shadowBorder);
        // time lines
        this.timeLinesInner = new PIXI.Container;
        this.timeLinesInner.y = 0;
        this.timeLinesInner.width = 1000;
        this.timeLinesInner.height = TIME_RULER_LINE_HEIGHT;
        setPosition(this.timeLinesInner, () => {
            this.timeLinesInner.x = 300;
        }, true);
        // current time line
        const currentTimeLine = new PIXI.Graphics;
        currentTimeLine.lineStyle(3, 0xFFFFFF, 1);
        currentTimeLine.moveTo(0, 50);
        currentTimeLine.lineTo(0, TIME_RULER_WINDOW_HEIGHT);
        currentTimeLine.x = 300;
        currentTimeLine.y = -80;
        const timeLines = new PIXI.Container;
        timeLines.addChild(this.timeLinesInner);
        timeLines.addChild(currentTimeLine);
        timeLines.x = 0;
        timeLines.y = TIME_RULER_LINE_TOP;
        setPosition(timeLines, () => {
            timeLines.scale.x = window.innerWidth / 1000;
        });
        this.stage.addChild(timeLines);
    }
    /**
     * Re-paint timing points
     * @param {number} relativeTime - Relative time, will be painted at zero point
     */
    repaintAllTimingPoints(relativeTime) {
        this.timeLinesInner.removeChildren();
        const pxPerMs = 0.1;
        console.log(Math.floor(-relativeTime * pxPerMs));
        setPosition(this.timeLinesInner, () => {
            this.timeLinesInner.x = Math.floor(-relativeTime * pxPerMs);
        }, true);
        const pos = G.tick.findPositionByTime(relativeTime);
        let tp, tick, time, position;
        // draw current tick first
        tp = pos.tp;
        tick = pos.tick;
        time = pos.l;
        position = 300 + Math.floor(pxPerMs * time);
        if (pos.l == 436) {
            console.log(position);
        }
        this.timeLineObject = [{
            x: position,
            mod: G.tick.getTickModNumber(tp, tick),
        }];
        // draw previous ticks
        position = 0;
        let prevPos = {
            tp: pos.tp,
            tick: pos.tick,
        };
        while (position >= 0) {
            prevPos = G.tick.prev(prevPos.tp, prevPos.tick, true);
            tp = prevPos.tp;
            tick = prevPos.tick;
            time = prevPos.l;
            position = 300 + pxPerMs * (time - relativeTime);
            this.timeLineObject.unshift({
                x: position,
                mod: G.tick.getTickModNumber(tp, tick),
            });
        }
        // draw next ticks
        position = 0;
        let nextPos = {
            tp: pos.tp,
            tick: pos.tick,
        };
        while (position <= 1000) {
            nextPos = G.tick.next(nextPos.tp, nextPos.tick);
            tp = nextPos.tp;
            tick = nextPos.tick;
            time = nextPos.l;
            position = 300 + pxPerMs * (time - relativeTime);
            this.timeLineObject.push({
                x: position,
                mod: G.tick.getTickModNumber(tp, tick),
            });
        }
        // draw
        for (const item of this.timeLineObject) {
            const height = (item.mod !== false) ? 2 : 1;
            const realHeight = height * 10 - 5;
            const line = new PIXI.Graphics;
            line.lineStyle(1, 0xFFFFFF, 1);
            line.moveTo(item.x, 0);
            line.lineTo(item.x, realHeight);
            line.y = 20 - realHeight;
            this.timeLinesInner.addChild(line);
        }
    }
}
