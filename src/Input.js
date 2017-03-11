/**
 * Keyboard input event getter and setter
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Input class
 * @class
 */
class Input {
    /**
     * @constructor
     */
    constructor() {
        this.setKeyAlias();
        this.initKeyState();
        this.addEventListeners();
    }
    /**
     * Make it look like array
     */
    setKeyAlias() {
        // Not all keys are needed by my game, such as ALT
        // You can easily extend this object to support more keys
        this.A = 65;
        this.B = 66;
        this.C = 67;
        this.D = 68;
        this.E = 69;
        this.F = 70;
        this.G = 71;
        this.H = 72;
        this.I = 73;
        this.J = 74;
        this.K = 75;
        this.L = 76;
        this.M = 77;
        this.N = 78;
        this.O = 79;
        this.P = 80;
        this.Q = 81;
        this.R = 82;
        this.S = 83;
        this.T = 84;
        this.U = 85;
        this.V = 86;
        this.W = 87;
        this.X = 88;
        this.Y = 89;
        this.Z = 90;
        this.LEFT = 37;
        this.UP = 38;
        this.RIGHT = 39;
        this.DOWN = 40;
        this.F1 = 112;
        this.F2 = 113;
        this.F3 = 114;
        this.F4 = 115;
        this.F5 = 116;
        this.F6 = 117;
        this.F7 = 118;
        this.F8 = 119;
        this.F9 = 120;
        this.F10 = 121;
        this.F11 = 122;
        this.F12 = 123;
        this.CTRL = 17;
        this.SHIFT = 16;
        this.ESC = 27;
        this.SPACE = 32;
        this.ENTER = 13;
        this.BACKSPACE = 8;
        this.DELETE = 46;
    }
    /**
     * All keys are not pressed, released and repeated at first
     */
    initKeyState() {
        this.keyState = [];
        for (let keyCode = 1; keyCode < 128; keyCode++) {
            this.keyState[keyCode] = {
                isPressed: false, // nearly pressed down
                isReleased: false, // nearly released up
                isRepeated: false, // continuously pressed down
            };
        }
    }
    /**
     * Add keydown and keyup for window for updating key state
     */
    addEventListeners() {
        window.addEventListener('keydown', e => {
            e.preventDefault();
            const key = this.keyState[e.keyCode];
            if (!key) {
                return;
            }
            // special deal with isPressed
            // isPressed is true only if it was not at down state before
            if (!key.isRepeated) {
                key.isPressed = true;
            }
            key.isReleased = false;
            key.isRepeated = true;
        });
        window.addEventListener('keyup', e => {
            e.preventDefault();
            const key = this.keyState[e.keyCode];
            if (!key) {
                return;
            }
            // special deal with isPressed
            // isReleased is true only if it was at down state before
            if (key.isRepeated) {
                key.isReleased = true;
            }
            key.isPressed = false;
            key.isRepeated = false;
        });
    }
    /**
     * Judge if the key is just pressed down
     * @param {number} keyCode - The code of the key to judge
     */
    isPressed(keyCode) {
        return this.keyState[keyCode].isPressed;
    }
    /**
     * Judge if the key is just released up
     * @param {number} keyCode - The code of the key to judge
     */
    isPressed(keyCode) {
        return this.keyState[keyCode].isReleased;
    }
    /**
     * Judge if the key is continuously pressed down
     * @param {number} keyCode - The code of the key to judge
     */
    isPressed(keyCode) {
        return this.keyState[keyCode].isRepeated;
    }
}

module.exports = Input;
