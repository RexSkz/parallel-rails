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
        if (src == this.bgmSrc && this.bgmObject && this.bgmObject.playing) {
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
    /**
     * Update all audio status
     */
    update() {
        this.bgmObject = G.resource.getAudio(this.bgmSrc);
        if (this.bgmStatus != this.bgmNeedStatus && this.bgmObject) {
            switch (this.bgmNeedStatus) {
            case 'update':
                this.bgmObject.loop = true;
                this.bgmObject.playFrom(this.bgmStartTime);
                this.bgmStatus = 'play';
                this.bgmNeedStatus = 'play';
                break;
            case 'pause':
                this.bgmObject.pause();
                this.bgmStatus = 'pause';
                break;
            default:
                break;
            }
        }
    }
}
