/**
 * Timing window in editor
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition
} from '../Functions';
import WindowBase from './WindowBase';

const {
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE,
    HELP_WINDOW_PADDING
} = G.constant;

/**
 * Window that shows help text
 * @class
 */
export default class WindowHelp extends WindowBase {
    /**
     * @constructor
     * @param {array} helpTexts - Help text to show, each line is a string
     * @param {string} align - Text align
     */
    constructor(helpTexts, align = 'left') {
        super();
        // shadow
        this.stage.addChild(G.graphics.createRect({
            background: 0x000000,
            width: 9999,
            height: helpTexts.length * DEFAULT_FONT_SIZE + HELP_WINDOW_PADDING * 2,
            opacity: 0.6
        }));
        // help text
        this.stage.addChild(G.graphics.createText(helpTexts.join('\n'), { align }, () => ({
            positionX: 'center',
            y: HELP_WINDOW_PADDING
        })));
        G.graphics.setPosition(this.stage, { x: 0, positionY: 'center' });
        this.stage.visible = false;
    }
}
