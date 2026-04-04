/**
 * Keyboard input event getter and setter
 * @author Rex Zeng
 */

import G from './Global';

type KeyState = {
    isPressed: boolean;
    isReleased: boolean;
    isRepeated: boolean;
};

export default class Input {
    A!: number; B!: number; C!: number; D!: number; E!: number; F!: number; G!: number; H!: number; I!: number; J!: number; K!: number; L!: number; M!: number; N!: number; O!: number; P!: number; Q!: number; R!: number; S!: number; T!: number; U!: number; V!: number; W!: number; X!: number; Y!: number; Z!: number;
    LEFT!: number; UP!: number; RIGHT!: number; DOWN!: number;
    APOSTROPHE!: number;
    F1!: number; F2!: number; F3!: number; F4!: number; F5!: number; F6!: number; F7!: number; F8!: number; F9!: number; F10!: number; F11!: number; F12!: number;
    CTRL!: number; SHIFT!: number; ESC!: number; SPACE!: number; ENTER!: number; BACKSPACE!: number; DELETE!: number; HOME!: number; END!: number; PAGEUP!: number; PAGEDN!: number;
    keyState!: KeyState[];
    pressedKey!: number;
    releasedKey!: number;

    constructor() {
        this.setKeyAlias();
        this.initKeyState();
        this.addEventListeners();
    }

    setKeyAlias() {
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
        this.APOSTROPHE = 192;
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
        this.HOME = 36;
        this.END = 35;
        this.PAGEUP = 33;
        this.PAGEDN = 34;
    }

    initKeyState() {
        this.keyState = [];
        this.pressedKey = 0;
        this.releasedKey = 0;
        for (let keyCode = 1; keyCode < 256; keyCode++) {
            this.keyState[keyCode] = {
                isPressed: false,
                isReleased: false,
                isRepeated: false
            };
        }
    }

    addEventListeners() {
        window.addEventListener('keydown', e => {
            if (!G.nativeInputFocused) {
                e.preventDefault();
                this.pressedKey = e.keyCode;
            }
        });
        window.addEventListener('keyup', e => {
            if (!G.nativeInputFocused) {
                e.preventDefault();
                this.releasedKey = e.keyCode;
            }
        });
    }

    update() {
        if (this.pressedKey) {
            const key = this.keyState[this.pressedKey];
            if (key) {
                if (key.isPressed) {
                    key.isPressed = false;
                    this.pressedKey = 0;
                } else if (key.isRepeated) {
                    this.pressedKey = 0;
                } else if (!key.isReleased) {
                    key.isPressed = true;
                    key.isReleased = false;
                    key.isRepeated = true;
                }
            }
        }
        if (this.releasedKey) {
            const key = this.keyState[this.releasedKey];
            if (key) {
                if (key.isReleased) {
                    key.isReleased = false;
                    this.releasedKey = 0;
                } else {
                    key.isReleased = true;
                    key.isPressed = false;
                    key.isRepeated = false;
                }
            }
        }
    }

    isPressed(keyCode: number) {
        if (!this.keyState[keyCode]) {
            console.error('Key code error!');
            return null;
        }
        return this.keyState[keyCode].isPressed;
    }

    isReleased(keyCode: number) {
        if (!this.keyState[keyCode]) {
            console.error('Key code error!');
            return null;
        }
        return this.keyState[keyCode].isReleased;
    }

    isRepeated(keyCode: number) {
        if (!this.keyState[keyCode]) {
            console.error('Key code error!');
            return null;
        }
        return this.keyState[keyCode].isRepeated;
    }
}
