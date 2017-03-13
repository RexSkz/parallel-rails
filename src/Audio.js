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
        this.bgmSrc = '';
        this.bgmObject = null;
        this.bgmStatus = '';
        this.bgmNeedStatus = '';
        this.bgmStartTime = 0;
        this.bgmFadeIn = 0;
        this.bgmFadeOut = 0;
        this.se = {};
    }
    /**
     * Play BGM
     * @param {string} src - BGM source
     * @param {number} previewTime - Start position
     * @param {number} fadeIn - Fade in time
     * @param {number} fadeOut - Fade out time
     */
    playBGM(src, previewTime = 0, fadeIn = 0, fadeOut = 0) {
        // bgm only played once
        if (src == this.bgmSrc) {
            return;
        }
        if (this.bgmObject) {
            this.bgmObject.pause();
        }
        G.resource.addAudio(src);
        this.bgmSrc = src;
        this.bgmNeedStatus = 'update';
        this.bgmStartTime = previewTime;
        this.bgmFadeIn = fadeIn;
        this.bgmFadeOut = fadeOut;
    }
    /**
     * Pause bgm
     */
    pauseBGM() {
        this.bgmNeedStatus = 'pause';
    }
    fadeOutBGM(sec) {
        this.bgmObject.fadeOut(sec);
        setTimeout(() => {
            this.bgmObject.pause();
            this.bgmObject.volume = 1;
        }, sec * 1000);
    }
    /**
     * Update all audio status
     */
    update() {
        if (this.bgmStatus != this.bgmNeedStatus) {
            if (sounds[this.bgmSrc] && sounds[this.bgmSrc].buffer) {
                this.bgmObject = sounds[this.bgmSrc];
                switch (this.bgmNeedStatus) {
                    case 'update':
                        debugger;
                        this.bgmObject.loop = true;
                        if (this.bgmFadeIn > 0) {
                            this.bgmObject.fadeIn(this.bgmFadeIn);
                            this.bgmFadeIn = 0;
                        } else {
                            this.bgmObject.playFrom(this.bgmStartTime);
                        }
                        this.bgmStatus = 'play';
                        this.bgmNeedStatus = 'play';
                        break;
                    case 'pause':
                        if (this.bgmFadeOut > 0) {
                            this.fadeOutBGM(this.bgmFadeOut);
                            this.bgmFadeOut = 0;
                        } else {
                            this.bgmObject.pause();
                        }
                        this.bgmStatus = 'pause';
                        break;
                }
            }
        }
    }
}
