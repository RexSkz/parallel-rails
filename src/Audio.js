/**
 * Audio control
 * @author Rex Zeng
 */

/**
 * Audio class
 * @class
 */
export default class Audio {
    /**
     * @constructor
     */
    constructor() {
        this.bgm = {
            name: '',
            playing: false,
            fadeOut: () => {}
        };
    }
    /**
     * Play BGM
     * @param {string} src - BGM source
     * @param {number} startTime - Start time in unit 'second'
     */
    playBGM(src, startTime = 0) {
        if (!sounds[src]) {
            console.error(`Resource ${src} not loaded!`);
            return false;
        }
        // bgm only played once
        if (src === this.bgm.name && this.bgm.playing) {
            return false;
        }
        this.bgm.fadeOut(1);
        this.bgm = sounds[src];
        this.bgm.loop = true;
        this.bgm.playFrom(startTime);
        this.bgm.fadeIn(1);
    }
    /**
     * Pause bgm
     */
    pauseBGM() {
        this.bgm.pause();
    }
    /**
     * Play SE
     * @param {string} src - SE source
     */
    playSE(src) {
        if (!sounds[src]) {
            console.error(`Resource ${src} not loaded!`);
            return false;
        }
        sounds[src].loop = false;
        sounds[src].play();
    }
    /**
     * Update all audio status
     */
    update() {}
    /**
     * Get audio's current play time
     * @param {Audio} audio - The audio
     * @return {number} Audio's current play time
     */
    getCurrentPlayTime(audio) {
        return audio.soundNode ? (audio.startOffset + audio.soundNode.context.currentTime - audio.startTime) : 0;
    }
}
