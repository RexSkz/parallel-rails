/**
 * Graphics control
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Graphics class
 * @class
 */
export default class Graphics {
    /**
     * Create a responsive image
     * @param {string} src - Image src
     * @param {function or object} pos - Used by `setPosition`
     * @param {boolean} global - Whether draw a global image, MUST BE DELETED MANUALLY
     * @return {Sprite} Graphics created by this function
     */
    createImage(src, pos, global = false) {
        const t = G.resource.graphics(src);
        if (!t) {
            console.error(`Resource ${src} not loaded!`);
            return false;
        }
        const sprite = new PIXI.Sprite(G.resource.graphics(src));
        sprite.id = 'IMG_' + src.split('/').pop() + '_' + parseInt(Math.random() * 1e5);
        this.setPosition(sprite, pos, global);
        return sprite;
    }
    /**
     * Create a responsive text
     * TODO: make this responsive
     * @param {string} str - String to draw
     * @param {object} style - PIXI font style
     * @param {function or object} pos - Used by `setPosition`
     * @param {boolean} global - Whether draw a global text, MUST BE DELETED MANUALLY
     * @return {Sprite} Text created by this function
     */
    createText(str, style = {}, pos, global = false) {
        str = str.toString();
        const sprite = new PIXI.Text(str, {
            fontFamily: style.fontFamily || G.constant.DEFAULT_FONT,
            fontSize: style.fontSize || G.constant.MUSIC_LIST_ITEM_CREATOR_SIZE,
            fill: style.color || style.fill || G.constant.DEFAULT_COLOR,
            align: style.align || 'left'
        });
        sprite.id = 'TXT_' + str.replace(/\W+/g, ' ').replace(/\s+/g, '_') + '_' + parseInt(Math.random() * 1e5);
        this.setPosition(sprite, pos, global);
        return sprite;
    }
    /**
     * Create a responsive spirit
     * @param {function or object} pos - Used by `setPosition`
     * @param {boolean} global - Whether draw a global text, MUST BE DELETED MANUALLY
     * @return {Sprite} Spirit created by this function
     */
    createSprite(pos, global = false) {
        const sprite = new PIXI.Container();
        sprite.id = 'SPRITE_' + parseInt(Math.random() * 1e5);
        this.setPosition(sprite, pos, global);
        return sprite;
    }
    /**
     * Create a rect, not responsive
     * @param {object} style - Style info
     */
    createRect(style) {
        const rect = new PIXI.Graphics();
        rect.id = 'RECT_' + parseInt(Math.random() * 1e5);
        rect.beginFill(style.background);
        if (style.borderWidth) {
            rect.lineStyle(style.borderWidth, style.borderColor, 1);
        }
        rect.drawRect(style.top || 0, style.left || 0, style.width, style.height);
        rect.endFill();
        rect.alpha = style.opacity;
        return rect;
    }
    /**
     * Set sprite position with percent data provided
     * @param {Sprite} sprite - The sprite we want to move
     * @param {function or object} pos - Position information
     * @param {boolean} global - Whether set a global sprite, MUST BE DELETED MANUALLY
     */
    setPosition(sprite, pos, global = false) {
        const renderer = () => {
            const result = this.painter(sprite, pos);
            for (const key in result) {
                if (key === 'transformScale') {
                    sprite.scale.set(result.transformScale, result.transformScale);
                } else {
                    sprite[key] = result[key];
                }
            }
        };
        renderer.sprite = sprite;
        renderer.sceneName = G.sceneName;
        // add to repaint list
        G.repaintList[sprite.id] = renderer;
        // paint once
        renderer();
    }
    /**
     * Convert responsive data to fixed pixel
     * @param {Sprite} sprite - The sprite we want to move
     * @param {function or object} pos - Position information
     */
    painter(sprite, pos) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let result = {};
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
    };
}
