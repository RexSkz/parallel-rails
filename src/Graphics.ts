import { Container, Graphics as PixiGraphics, Sprite, Text, type TextStyle } from 'pixi.js';
import G from './Global';
import type { AnimatableSprite, PaintResult, PositionSpec, RepaintRenderer } from './types';
export default class Graphics {
    private makeLabel(prefix: string, suffix: string): string {
        return `${prefix}_${suffix}_${Math.trunc(Math.random() * 1e5)}`;
    }

    createImage(src: string, pos: PositionSpec<Sprite>, global = false): Sprite | false {
        const t = G.resource.graphics(src);
        if (!t) {
            console.error(`Resource ${src} not loaded!`);
            return false;
        }
        const sprite = new Sprite(G.resource.graphics(src));
        sprite.label = this.makeLabel('IMG', src.split('/').pop() || 'unknown');
        this.setPosition(sprite, pos, global);
        return sprite;
    }
    createText(str: string | number, style: Partial<TextStyle> = {}, pos: PositionSpec<Text>, global = false): Text {
        const text = String(str);
        const sprite = new Text({
            text,
            style: {
                fontFamily: style.fontFamily || G.constant.DEFAULT_FONT,
                fontSize: style.fontSize || G.constant.MUSIC_LIST_ITEM_CREATOR_SIZE,
                fill: style.fill || G.constant.DEFAULT_COLOR,
                align: style.align || 'left'
            }
        });
        sprite.label = this.makeLabel('TXT', text.replace(/\W+/g, ' ').replace(/\s+/g, '_'));
        this.setPosition(sprite, pos, global);
        return sprite;
    }
    createSprite(pos: PositionSpec<Container>, global = false): Container {
        const sprite = new Container();
        sprite.label = this.makeLabel('SPRITE', 'container');
        this.setPosition(sprite, pos, global);
        return sprite;
    }
    createRect(style: {
        left?: number;
        top?: number;
        width: number;
        height: number;
        background: number;
        borderWidth?: number;
        borderColor?: number;
        opacity?: number;
    }): PixiGraphics {
        const rect = new PixiGraphics();
        rect.label = this.makeLabel('RECT', 'shape');
        rect.rect(style.left || 0, style.top || 0, style.width, style.height);
        rect.fill(style.background);
        if (style.borderWidth) {
            rect.stroke({ width: style.borderWidth, color: style.borderColor, alpha: 1 });
        }
        rect.alpha = style.opacity ?? 1;
        return rect;
    }
    setPosition<T extends AnimatableSprite>(sprite: T, pos: PositionSpec<T>, global = false): void {
        const renderer: RepaintRenderer<T> = Object.assign(() => {
            const result = this.painter(sprite, pos);
            for (const key in result) {
                if (key === 'transformScale') {
                    sprite.scale.set(result.transformScale || 0, result.transformScale || 0);
                } else {
                    Reflect.set(sprite, key, result[key]);
                }
            }
        }, { sprite, sceneName: G.sceneName });
        // add to repaint list
        G.repaintList[sprite.label] = renderer;
        // paint once
        renderer();
    }
    painter<T extends Container>(sprite: T, pos: PositionSpec<T>): PaintResult {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let result: PaintResult = {};
        if (typeof pos === 'function') {
            result = pos(w, h, sprite);
        } else if (typeof pos === 'object') {
            result = pos;
        } else {
            console.error('Param `pos` must be a function or object!');
        }
        if (result.size === 'cover') {
            const ratio = Math.max(w / sprite.width, h / sprite.height);
            result.width = sprite.width * ratio;
            result.height = sprite.height * ratio;
        }
        if (result.position === 'center') {
            delete result.position;
            result.positionX = 'center';
            result.positionY = 'center';
        }
        if (result.positionX === 'center') {
            result.x = 0.5 * (w - (result.width || sprite.width));
        }
        if (result.positionY === 'center') {
            result.y = 0.5 * (h - (result.height || sprite.height));
        }
        return result;
    }
}
