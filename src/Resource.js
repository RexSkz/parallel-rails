/**
 * Resource loader
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Resource loader class
 * @class
 */
export default class Resource {
    /**
     * @constructor
     */
    constructor() {
        this.added = {};
        this.soundAdded = {};
        this.queue = [];
        this.soundQueue = [];
        this.url = '';
        this.progress = 0;
        PIXI.loader
            .on('progress', this.updateLoaderData.bind(this))
            .on('error', this.setLoaderErrorMsg.bind(this));
    }
    /**
     * Add resource url to queue
     * @param {string or array} url - Resource url
     */
    add(url) {
        if (!this.added[url]) {
            this.queue.push(url);
            this.added[url] = true;
        }
    }
    /**
     * Add audio resource url to queue
     * @param {string or array} url - Resource url
     */
    addAudio(url) {
        if (!this.soundAdded[url]) {
            this.soundQueue.push(url);
            this.soundAdded[url] = true;
        }
    }
    /**
     * Load resources when queue not empty and Pixi.loader not locked
     */
    load() {
        if (!G.lock.soundLoader && this.soundQueue.length > 0) {
            while (this.soundQueue.length > 0) {
                const q = this.soundQueue;
                this.soundQueue = [];
                G.lock.soundLoader = true;
                sounds.load(q);
                // TODO: this is a hack for sound.js, waiting for author's next update
                this.updateLoaderData({ progress: 0 }, { url: q[0] });
                sounds.whenLoaded = () => G.lock.soundLoader = false;
            }
        }
        if (!G.lock.pixiLoader && this.queue.length > 0) {
            while (this.queue.length > 0) {
                PIXI.loader.add(this.queue.shift());
            }
            G.lock.pixiLoader = true;
            PIXI.loader.load(() => G.lock.pixiLoader = false);
        }
    }
    /**
     * Update loader data
     * @param {object} progress - Current loading progress
     * @param {object} url - Current loading url
     */
    updateLoaderData(progress, url) {
        this.progress = progress.progress;
        this.url = url.url || '';
    }
    /**
     * Set error message when load failed
     * @param {string} msg - Error message
     */
    setLoaderErrorMsg(msg) {
        console.error(msg); // eslint-disable-line no-console
    }
    /**
     * Get resource by name
     * @param {string} resourceName - Resource name
     */
    get(resourceName) {
        const res = PIXI.loader.resources[resourceName];
        return res ? res.texture : null;
    }
    /**
     * Get audio by name
     * @param {string} resourceName - Resource name
     */
    getAudio(resourceName) {
        const res = sounds[resourceName];
        return (res && res.hasLoaded) ? res : null;
    }
    /**
     * Get resource size by name
     * @param {string} resourceName - Resource name
     */
    getSize(resourceName) {
        const res = PIXI.loader.resources[resourceName];
        return res ? {
            width: res.data.width,
            height: res.data.height,
        } : null;
    }
    getCurrentPlayTime(audio) {
        return audio.soundNode ? (audio.startOffset + audio.soundNode.context.currentTime - audio.startTime) : 0;
    }
}
