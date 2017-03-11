/**
 * Resource loader
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Game main class
 * @class
 */
class Resource {
    /**
     * @constructor
     */
    constructor() {
        this.queue = [];
        PIXI.loader
            .on('progress', this.updateLoaderData)
            .on('error', this.setLoaderErrorMsg);
    }
    /**
     * Add resource url to queue
     * @param {string or array} url - Resource url
     */
    add(url) {
        this.queue.push(url);
    }
    /**
     * Load resources when queue not empty and Pixi.loader not locked
     */
    load() {
        if (!G.loaderLock) {
            while (this.queue.length > 0) {
                PIXI.loader.add(this.queue.shift());
            }
            G.loaderLock = true;
            PIXI.loader.load(this.setLoaderFinished);
        }
    }
    /**
     * Update loader data
     * @param {object} progress - Current loading progress
     * @param {object} url - Current loading url
     */
    updateLoaderData(progress, url) {
        G.loader.finished = false;
        G.loader.progress = progress.progress;
        G.loader.url = url.url || '';
    }
    /**
     * Set loader finished
     */
    setLoaderFinished() {
        G.loader.finished = true;
        G.loaderLock = false;
    }
    get(resourceName) {
        return PIXI.loader.resources[resourceName].texture;
    }
}

export default (new Resource);
