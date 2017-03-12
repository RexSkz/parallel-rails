/**
 * Audio control
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Audio class
 * @class
 */
export default class Audio {
    /**
     * @constructor
     */
    constructor() {
        this.bgm = '';
        this.bgmObject = null;
        this.bgmPlayed = false;
        this.bgmJump = 0;
        this.se = {};
    }
    /**
     * Play BGM
     * @param {string} src - BGM source
     */
    playBGM(src, startPos = 0) {
        // bgm only played once
        if (src == this.bgm) {
            return;
        }
        if (this.bgmObject) {
            this.bgmObject.stop();
            this.bgmObject.remove();
        }
        G.resource.addAudio(src);
        this.bgm = src;
        this.bgmPlayed = false;
        this.jumpTo(startPos);
    }
    /**
     * Jump to given audio position
     * @param {number} pos - Audio position
     */
    jumpTo(pos) {
        this.bgmJump = pos;
    }
    /**
     * Update all audio status
     */
    update() {
        if (!this.bgmPlayed) {
            this.bgmObject = G.resource.getAudio(this.bgm);
            if (this.bgmObject) {
                this.bgmObject.loop = true;
                this.bgmObject.play();
                this.bgmPlayed = true;
            }
        }
        if (this.bgmJump != 0) {
            if (this.bgmObject) {
                if (this.bgmObject.audio.context) {
                    this.bgmObject.audio.context.currentTime = this.bgmJump;
                } else {
                    this.bgmObject.audio.currentTime = this.bgmJump;
                }
                this.bgmJump = 0;
            }
        }
    }
}
