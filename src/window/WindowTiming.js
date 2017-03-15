/**
 * Timing window in editor
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
    formatTime,
} from '../Functions';
import WindowBase from './WindowBase';

const {
    MAIN_FONT,
    TIMING_WINDOW_WIDTH_PERCENT,
    TIMING_WINDOW_HEIGHT,
    TIMING_NUMBER_FONT_SIZE,
} = G.constant;

/**
 * Timing window class
 * @class
 */
export default class WindowTiming extends WindowBase {
    /**
     * @constructor
     * @param {number} currentTime - Playing currentTime
     * @param {number} duration - Music total duration
     */
    constructor(currentTime = 0, duration = 1) {
        super();
        this.currentTime = currentTime;
        this.duration = duration;
        // horizonal line container
        this.line = new PIXI.Container;
        this.line.height = TIMING_WINDOW_HEIGHT;
        this.stage.addChild(this.line);
        // line shadow
        this.lineShadow = new PIXI.Graphics;
        this.lineShadow.beginFill(0x000000);
        this.lineShadow.drawRect(0, -TIMING_WINDOW_HEIGHT * 0.5, 1000, TIMING_WINDOW_HEIGHT);
        this.lineShadow.endFill();
        this.lineShadow.alpha = 0.5;
        this.line.addChild(this.lineShadow);
        // line graph
        const lineGraph = new PIXI.Graphics;
        lineGraph.lineStyle(1, 0xFFFFFF, 1);
        lineGraph.moveTo(0, 0);
        lineGraph.lineTo(1000, 0);
        setPosition(this.line, () => ({
            width: window.innerWidth * TIMING_WINDOW_WIDTH_PERCENT,
            x: window.innerWidth * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5,
            y: window.innerHeight - TIMING_WINDOW_HEIGHT,
        }));
        this.line.addChild(lineGraph);
        // timing number text
        this.timingTextSprite = new PIXI.Text(`Time: ${formatTime(this.currentTime)} / ${formatTime(this.duration)}`, {
            fontFamily: MAIN_FONT,
            fontSize: TIMING_NUMBER_FONT_SIZE,
            fill: '#FFF',
        });
        setPosition(this.timingTextSprite, () => ({
            x: window.innerWidth * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5,
            y: window.innerHeight - TIMING_WINDOW_HEIGHT * 1.8 - TIMING_NUMBER_FONT_SIZE,
        }));
        this.stage.addChild(this.timingTextSprite);
        // playing point container
        this.point = new PIXI.Container;
        this.stage.addChild(this.point);
        // playing point line
        const pointLine = new PIXI.Graphics;
        pointLine.lineStyle(2, 0xFFFFFF, 1);
        pointLine.moveTo(0, 0);
        pointLine.lineTo(0, TIMING_WINDOW_HEIGHT);
        setPosition(this.point, () => ({
            x: window.innerWidth * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5 + window.innerWidth * TIMING_WINDOW_WIDTH_PERCENT * this.currentTime / this.duration,
            y: window.innerHeight - TIMING_WINDOW_HEIGHT * 1.5,
        }));
        this.point.addChild(pointLine);
    }
    /**
     * Update timing point
     * @param {number} currentTime - Current playing time
     */
    update(currentTime) {
        this.currentTime = currentTime;
        this.timingTextSprite.text = `Time: ${formatTime(this.currentTime)} / ${formatTime(this.duration)}`;
        setPosition(this.point, () => ({
            x: window.innerWidth * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5 + window.innerWidth * TIMING_WINDOW_WIDTH_PERCENT * this.currentTime / this.duration,
            y: window.innerHeight - TIMING_WINDOW_HEIGHT * 1.5,
        }), true);
    }
}
