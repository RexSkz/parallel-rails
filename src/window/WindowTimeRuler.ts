/**
 * Time ruler window in editor
 * @author Rex Zeng
 */

import { Container, Graphics } from 'pixi.js';
import G from '../Global';
import { setPosition } from '../Functions';
import type { TimelineTick } from '../types';
import WindowBase from './WindowBase';

const {
    TIME_RULER_WINDOW_HEIGHT,
    TIME_RULER_LINE_TOP,
    TIME_RULER_LINE_HEIGHT,
    TIME_RULER_COLORS,
    JUDGEMENT_LINE_LEFT
} = G.constant;

export default class WindowTimeRuler extends WindowBase {
    zoom: number;
    timeLineObject: TimelineTick[];
    shadow: Graphics;
    shadowBorder: Graphics;
    timeLinesInner: Container;

    constructor() {
        super();
        this.zoom = 0.2;
        this.timeLineObject = [];
        this.shadow = new Graphics();
        this.shadow.label = 'RECT_SHADOW';
        this.shadow.rect(0, 0, 10000, TIME_RULER_WINDOW_HEIGHT).fill(0x000000);
        this.shadow.alpha = 0.3;
        this.stage.addChild(this.shadow);
        this.shadowBorder = new Graphics();
        this.shadowBorder.label = 'LINE_SHADOW_BORDER_BOTTOM';
        this.shadowBorder.moveTo(0, TIME_RULER_WINDOW_HEIGHT);
        this.shadowBorder.lineTo(10000, TIME_RULER_WINDOW_HEIGHT);
        this.shadowBorder.stroke({ width: 1, color: 0xffffff, alpha: 1 });
        this.stage.addChild(this.shadowBorder);
        this.timeLinesInner = new Container();
        this.timeLinesInner.label = 'SPRITE_TIME_LINES_INNER';
        this.timeLinesInner.width = 1000;
        this.timeLinesInner.height = TIME_RULER_LINE_HEIGHT;
        setPosition(this.timeLinesInner, () => ({ x: JUDGEMENT_LINE_LEFT }), true);
        const currentTimeLine = new Graphics();
        currentTimeLine.label = 'LINE_CURRENT_TIME';
        currentTimeLine.moveTo(0, 50);
        currentTimeLine.lineTo(0, TIME_RULER_WINDOW_HEIGHT);
        currentTimeLine.stroke({ width: 2, color: 0xffffff, alpha: 1 });
        currentTimeLine.x = JUDGEMENT_LINE_LEFT;
        currentTimeLine.y = -80;
        const timeLines = new Container();
        timeLines.label = 'SPRITE_TIME_LINES_CONTAINER';
        timeLines.addChild(this.timeLinesInner);
        timeLines.addChild(currentTimeLine);
        timeLines.y = TIME_RULER_LINE_TOP;
        this.stage.addChild(timeLines);
    }

    paintTpLeftTo(relativeTime: number) {
        setPosition(this.timeLinesInner, () => ({ x: Math.floor(-relativeTime * this.zoom) }), true);
        let position = -Infinity;
        while (this.timeLineObject.length > 0) {
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * this.timeLineObject[this.timeLineObject.length - 1].time);
            if (Math.floor(-relativeTime * this.zoom) + position > window.innerWidth) {
                this.timeLineObject.pop();
                this.timeLinesInner.removeChildAt(this.timeLinesInner.children.length - 1);
            } else {
                break;
            }
        }
        const first = this.timeLineObject[0];
        let prevPos = G.tick.createCursor(first.timingPointIndex, first.tickIndex);
        let timingPointIndex = prevPos.timingPointIndex;
        let tickIndex = prevPos.tickIndex;
        let time = prevPos.time;
        position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
        while (Math.floor(-relativeTime * this.zoom) + position >= 0) {
            prevPos = G.tick.prevCursor(prevPos, true);
            timingPointIndex = prevPos.timingPointIndex;
            tickIndex = prevPos.tickIndex;
            time = prevPos.time;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            const o = { x: position, mod: prevPos.mod, timingPointIndex, tickIndex, time };
            this.timeLineObject.unshift(o);
            this.timeLinesInner.addChildAt(this.getLineByObj(o), 0);
        }
    }

    paintTpRightTo(relativeTime: number) {
        setPosition(this.timeLinesInner, () => ({ x: Math.floor(-relativeTime * this.zoom) }), true);
        let position = -Infinity;
        while (this.timeLineObject.length > 0) {
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * this.timeLineObject[0].time);
            if (Math.floor(-relativeTime * this.zoom) + position < 0) {
                this.timeLineObject.shift();
                this.timeLinesInner.removeChildAt(0);
            } else {
                break;
            }
        }
        const last = this.timeLineObject[this.timeLineObject.length - 1];
        let nextPos = G.tick.createCursor(last.timingPointIndex, last.tickIndex);
        let timingPointIndex = nextPos.timingPointIndex;
        let tickIndex = nextPos.tickIndex;
        let time = nextPos.time;
        position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
        while (Math.floor(-relativeTime * this.zoom) + position <= window.innerWidth) {
            nextPos = G.tick.nextCursor(nextPos);
            timingPointIndex = nextPos.timingPointIndex;
            tickIndex = nextPos.tickIndex;
            time = nextPos.time;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            const o = { x: position, mod: nextPos.mod, timingPointIndex, tickIndex, time };
            this.timeLineObject.push(o);
            this.timeLinesInner.addChild(this.getLineByObj(o));
        }
    }

    getLineByObj(item: TimelineTick) {
        let height = 0;
        const color = TIME_RULER_COLORS[G.tick.divisor][Math.abs(item.mod.divisor)];
        if (item.mod.divisor === 0) {
            height = item.mod.tick === 0 ? 20 : 10;
        } else {
            height = 5;
        }
        const line = new Graphics();
        line.label = 'LINE_TICK_' + item.mod.tick + '_' + item.mod.divisor + '_' + item.time;
        line.moveTo(item.x, 0);
        line.lineTo(item.x, height);
        line.stroke({ width: 1, color, alpha: 1 });
        line.y = 20 - height;
        return line;
    }

    repaintAllTimingPoints(relativeTime: number) {
        this.timeLinesInner.removeChildren();
        setPosition(this.timeLinesInner, () => ({ x: Math.floor(-relativeTime * this.zoom) }), true);
        const pos = G.tick.createCursorByTime(relativeTime);
        let timingPointIndex = pos.timingPointIndex;
        let tickIndex = pos.tickIndex;
        let time = pos.time;
        let position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
        this.timeLineObject = [{ x: position, mod: pos.mod, timingPointIndex, tickIndex, time }];
        position = Infinity;
        let prevPos = pos;
        while (Math.floor(-relativeTime * this.zoom) + position >= -JUDGEMENT_LINE_LEFT) {
            prevPos = G.tick.prevCursor(prevPos, true);
            timingPointIndex = prevPos.timingPointIndex;
            tickIndex = prevPos.tickIndex;
            time = prevPos.time;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            this.timeLineObject.unshift({ x: position, mod: prevPos.mod, timingPointIndex, tickIndex, time });
        }
        position = -Infinity;
        let nextPos = pos;
        while (Math.floor(-relativeTime * this.zoom) + position <= window.innerWidth) {
            nextPos = G.tick.nextCursor(nextPos);
            timingPointIndex = nextPos.timingPointIndex;
            tickIndex = nextPos.tickIndex;
            time = nextPos.time;
            position = JUDGEMENT_LINE_LEFT + Math.floor(this.zoom * time);
            this.timeLineObject.push({ x: position, mod: nextPos.mod, timingPointIndex, tickIndex, time });
        }
        for (const item of this.timeLineObject) {
            this.timeLinesInner.addChild(this.getLineByObj(item));
        }
    }

}
