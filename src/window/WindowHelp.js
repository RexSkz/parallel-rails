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
     * @param {string} helpText - Help text to show
     * @param {string} align - Text align
     */
    constructor(helpTexts, align = 'left') {
        super();
        // shadow
        this.shadow = new PIXI.Graphics();
        this.shadow.beginFill(0x000000);
        this.shadow.drawRect(0, 0, 10000, helpTexts.length * DEFAULT_FONT_SIZE + HELP_WINDOW_PADDING * 2);
        this.shadow.endFill();
        this.shadow.x = 0;
        this.shadow.y = 0;
        this.shadow.alpha = 0.6;
        this.stage.addChild(this.shadow);
        // help text
        this.helpTextSprite = new PIXI.Text(helpTexts.join('\n'), {
            fontFamily: DEFAULT_FONT,
            fontSize: DEFAULT_FONT_SIZE,
            fill: '#FFF',
            align: align
        });
        setPosition(this.helpTextSprite, () => ({
            x: (window.innerWidth - this.helpTextSprite.width) * 0.5,
            y: (this.stage.height - this.helpTextSprite.height) * 0.5
        }));
        this.stage.addChild(this.helpTextSprite);
        setPosition(this.stage, () => ({
            x: 0,
            y: (window.innerHeight - this.stage.height) * 0.5
        }));
    }
}
