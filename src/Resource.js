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
        this.audioAdded = {};
        this.queue = [];
        this.audioQueue = [];
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
        if (!this.audioAdded[url]) {
            this.audioQueue.push(url);
            this.audioAdded[url] = true;
        }
    }
    /**
     * Load resources when queue not empty and Pixi.loader not locked
     */
    load() {
        if (!G.lock.loader && this.queue.length > 0) {
            this.loadAudio();
            this.loadNormal();
            G.lock.loader = true;
            PIXI.loader.load(this.unlockLoader);
        }
    }
    loadNormal() {
        while (this.queue.length > 0) {
            PIXI.loader.add(this.queue.shift());
        }
    }
    loadAudio() {
        while (this.audioQueue.length > 0) {
            const t = this.audioQueue.shift();
            PIXI.loader.add([{
                name: t,
                url: t,
            }]);
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
     * Set loader finished
     */
    unlockLoader() {
        G.lock.loader = false;
    }
    /**
     * Set error message when load failed
     * @param {string} msg - Error message
     */
    setLoaderErrorMsg(msg) {
        console.error(msg);
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
     * Get audio resource by name
     * @param {string} resourceName - Resource name
     */
    getAudio(resourceName) {
        const audio = PIXI.audioManager.getAudio(resourceName);
        return audio.data ? audio : null;
    }
}
