import G from './Global';
import type { AnimatableSprite, AnimationFunction, PaintResult, PositionSpec } from './types';

export default class Animation {
    queue: Record<string, {
        sprite: AnimatableSprite;
        start: Record<string, unknown>;
        end: PositionSpec<AnimatableSprite>;
        totalFrames: number;
        currentFrames: number;
        func: AnimationFunction;
        loop: boolean;
        callback: (() => void) | null;
        sceneName: string;
    }>;
    LINEAR!: AnimationFunction;
    EASE_IN_QUAD!: AnimationFunction;
    EASE_OUT_QUAD!: AnimationFunction;
    EASE_IN_CUBIC!: AnimationFunction;
    EASE_OUT_CUBIC!: AnimationFunction;
    EASE_IN_EXPO!: AnimationFunction;
    EASE_OUT_EXPO!: AnimationFunction;

    constructor() {
        this.queue = {};
        this.initEasingFunctions();
    }

    initEasingFunctions() {
        this.LINEAR = (l: number, r: number, x: number) => l + (r - l) * x;
        this.EASE_IN_QUAD = (l: number, r: number, x: number) => l + (r - l) * Math.pow(x, 2);
        this.EASE_OUT_QUAD = (l: number, r: number, x: number) => l + (r - l) * Math.pow(x, 1 / 2);
        this.EASE_IN_CUBIC = (l: number, r: number, x: number) => l + (r - l) * Math.pow(x, 3);
        this.EASE_OUT_CUBIC = (l: number, r: number, x: number) => l + (r - l) * Math.pow(x, 1 / 3);
        this.EASE_IN_EXPO = (l: number, r: number, x: number) => l + (r - l) * Math.pow(2, (x - 1) * 7);
        this.EASE_OUT_EXPO = (l: number, r: number, x: number) => l + (r - l) * Math.log(x * 127 + 1) / Math.LN2 / 7;
    }

    set(sprite: AnimatableSprite, end: PositionSpec<AnimatableSprite>, totalFrames: number, func = this.EASE_OUT_EXPO, loop = false, callback: (() => void) | null = null) {
        if (this.queue[sprite.label]) {
            delete this.queue[sprite.label];
        }
        const start: Record<string, unknown> = {};
        let result: PaintResult = {};
        if (typeof end === 'function') {
            result = end(window.innerWidth, window.innerHeight, sprite);
        } else if (typeof end === 'object' && end) {
            result = end;
        } else {
            console.error('Param `end` must be a function or object!');
        }
        for (const key in result) {
            if (!(key in sprite)) {
                console.warn(`Sprite has no key: '${key}'!`, sprite);
            }
            start[key] = Reflect.get(sprite, key);
        }
        this.queue[sprite.label] = {
            sprite,
            start,
            end,
            totalFrames,
            currentFrames: 0,
            func,
            loop,
            callback,
            sceneName: G.sceneName
        };
    }

    update() {
        for (const item of Object.values(this.queue)) {
            if (item.sceneName !== G.sceneName) {
                delete this.queue[item.sprite.label];
                continue;
            }
            ++item.currentFrames;
            let result: PaintResult = {};
            if (typeof item.end === 'function') {
                result = item.end(window.innerWidth, window.innerHeight, item.sprite);
            } else if (typeof item.end === 'object' && item.end) {
                result = item.end;
            }
            for (const key in result) {
                if (key === 'transformScale') {
                    const scale = item.func(Number(item.start[key]), Number(result[key]), item.currentFrames / item.totalFrames);
                    item.sprite.scale.set(scale, scale);
                } else {
                    Reflect.set(item.sprite, key, item.func(Number(item.start[key]), Number(result[key]), item.currentFrames / item.totalFrames));
                }
            }
            if (item.currentFrames >= item.totalFrames) {
                if (item.loop) {
                    item.currentFrames = 0;
                } else {
                    delete this.queue[item.sprite.label];
                    G.graphics.setPosition(item.sprite, item.end);
                    if (typeof item.callback === 'function') {
                        item.callback();
                    }
                }
            }
        }
    }
}
