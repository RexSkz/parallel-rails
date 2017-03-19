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
        // current time line
        this.currentTimeLine = new PIXI.Graphics;
        this.currentTimeLine.lineStyle(3, 0xFFFFFF, 1);
        this.currentTimeLine.moveTo(0, 50);
        this.currentTimeLine.lineTo(0, TIME_RULER_WINDOW_HEIGHT);
        this.currentTimeLine.y = 0;
        setPosition(this.currentTimeLine, () => ({
            x: Math.floor(window.innerWidth * 0.3),
        }));
        this.stage.addChild(this.currentTimeLine);
        // time lines
        this.timeLines = new PIXI.Container;
        this.timeLines.x = 0;
        this.timeLines.y = TIME_RULER_LINE_TOP;
        // timeLines's width placeholder
        const placeholder = new PIXI.Graphics;
        placeholder.beginFill(0x000000);
        placeholder.drawRect(0, 0, 1000, TIME_RULER_WINDOW_HEIGHT - TIME_RULER_LINE_TOP);
        placeholder.endFill();
        placeholder.x = 0;
        placeholder.y = 0;
        placeholder.alpha = 0;
        this.timeLines.addChild(placeholder);
        setPosition(this.timeLines, () => ({
            width: window.innerWidth,
        }));
        this.stage.addChild(this.timeLines);
    }
    /**
     * Draw tick line
     * @param {number} x - X axis
     * @param {number} tick - Current tick
     */
    drawLine(x, tick) {
        let y = 15;
        let height = 5;
        if (tick.index % tick.divisor == 0 && Math.floor(tick.index / tick.divisor) % tick.metronome == 0) {
            y = 0;
            height = 20;
        }
        const line = new PIXI.Graphics;
        line.lineStyle(1, 0xFFFFFF, 1);
        line.moveTo(x, 0);
        line.lineTo(x, height);
        line.y = y;
        this.timeLines.addChild(line);
    }
    /**
     * Set timing points
     * @param {number} zeroTime1000 - Current zero time (1000x)
     */
    setTimingPoints(zeroTime1000) {
        this.timeLines.removeChildren();
        const zeroPos = 300;
        const pxPerMs = 0.125;
        let x = 0;
        let ret = G.tick.getPrevTick(false, 0);
        let tick = ret.tick;
        let time = ret.time;
        while (x > -43) {
            const timeDelta = zeroTime1000 - time;
            const distance = timeDelta * pxPerMs;
            this.drawLine(zeroPos - distance, tick);
            ret = G.tick.getPrevTick(false, time);
            tick = ret.tick;
            time = ret.time;
            x--;
        }
        x = 1;
        ret = G.tick.getNextTick(false, 0);
        tick = ret.tick;
        time = ret.time;
        while (x < 100) {
            const timeDelta = time - zeroTime1000;
            const distance = timeDelta * pxPerMs;
            this.drawLine(zeroPos + distance, tick);
            ret = G.tick.getNextTick(false, time);
            tick = ret.tick;
            time = ret.time;
            x++;
        }
    }
}
