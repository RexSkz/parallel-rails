/**
 * Timing window in editor
 * @author Rex Zeng
 */

import { Container, Graphics } from 'pixi.js';
import G from '../Global';
import { formatTime } from '../Functions';
import WindowBase from './WindowBase';

const {
    TIMING_WINDOW_WIDTH_PERCENT,
    TIMING_WINDOW_HEIGHT,
    TIMING_NUMBER_FONT_SIZE
} = G.constant;

/**
 * Timing window class
 * @class
 */
export default class WindowTiming extends WindowBase {
    currentTime: number;
    duration: number;
    line: Container;
    lineShadow: Graphics;
    timingTextSprite: ReturnType<typeof G.graphics.createText>;
    point: Container;

    constructor(currentTime = 0, duration = 1) {
        super();
        this.currentTime = currentTime;
        this.duration = duration;
        // horizonal line container
        this.line = new Container();
        this.line.label = 'SPRITE_OUTER';
        this.line.height = TIMING_WINDOW_HEIGHT;
        this.stage.addChild(this.line);
        // line shadow
        this.lineShadow = new Graphics();
        this.lineShadow.label = 'RECT_LINE_SHADOW';
        this.lineShadow.rect(0, -TIMING_WINDOW_HEIGHT * 0.5, 1000, TIMING_WINDOW_HEIGHT).fill(0x000000);
        this.lineShadow.alpha = 0.5;
        this.line.addChild(this.lineShadow);
        // line graph
        const lineGraph = new Graphics();
        lineGraph.label = 'LINE_CENTER_HORIZONAL';
        lineGraph.moveTo(0, 0);
        lineGraph.lineTo(1000, 0);
        lineGraph.stroke({ width: 1, color: 0xFFFFFF, alpha: 1 });
        G.graphics.setPosition(this.line, (w: number, h: number, _self: any) => ({
            width: w * TIMING_WINDOW_WIDTH_PERCENT,
            x: w * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5,
            y: h - TIMING_WINDOW_HEIGHT
        }));
        this.line.addChild(lineGraph);
        // timing number text
        this.stage.addChild(this.timingTextSprite = G.graphics.createText(`Time: ${formatTime(this.currentTime)} / ${formatTime(this.duration)}`, {
            fontSize: TIMING_NUMBER_FONT_SIZE
        }, (w: number, h: number, _self: any) => ({
            x: w * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5,
            y: h - TIMING_WINDOW_HEIGHT * 1.8 - TIMING_NUMBER_FONT_SIZE
        }))); 
        // playing point container
        this.point = new Container();
        this.point.label = 'SPRITE_LINES_PREVIEW';
        this.stage.addChild(this.point);
        // playing point line
        const pointLine = new Graphics();
        pointLine.label = 'LINE_CURRENT_TIME';
        pointLine.moveTo(0, 0);
        pointLine.lineTo(0, TIMING_WINDOW_HEIGHT);
        pointLine.stroke({ width: 2, color: 0xFFFFFF, alpha: 1 });
        G.graphics.setPosition(this.point, (w: number, h: number, _self: any) => ({
            x: w * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5 + w * TIMING_WINDOW_WIDTH_PERCENT * this.currentTime / this.duration,
            y: h - TIMING_WINDOW_HEIGHT * 1.5
        }));
        this.point.addChild(pointLine);
    }
    update(currentTime: number) {
        this.currentTime = currentTime;
        this.timingTextSprite.text = `Time: ${formatTime(this.currentTime)} / ${formatTime(this.duration)}`;
        G.graphics.setPosition(this.point, (w: number, h: number, _self: any) => ({
            x: w * (1 - TIMING_WINDOW_WIDTH_PERCENT) * 0.5 + w * TIMING_WINDOW_WIDTH_PERCENT * this.currentTime / this.duration,
            y: h - TIMING_WINDOW_HEIGHT * 1.5
        }));
    }
}
