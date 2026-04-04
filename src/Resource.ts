// @ts-nocheck
/**
 * Resource loader
 * @author Rex Zeng
 */

import { Assets, Texture } from 'pixi.js';

/**
 * Resource loader class
 * @class
 */
export default class Resource {
    /**
     * @constructor
     */
    constructor() {
        this.remains = 0;
        this.currentLoad = '';
        this.loadedGraphics = new Set();
        sounds.onProgress = this.updateLoaderData.bind(this);
        sounds.onFailed = this.setLoaderErrorMsg.bind(this);
        sounds.whenLoaded = () => {};
    }
    /**
     * Start loading resources
     * @param {object} res - Contains `audio` and `graphics` array
     */
    load(res) {
        res.audio = res.audio ? res.audio.filter(src => !sounds[src]) : [];
        res.graphics = res.graphics ? res.graphics.filter(src => !this.loadedGraphics.has(src)) : [];
        this.remains = res.audio.length + res.graphics.length;
        if (res.audio.length > 0) {
            sounds.load(res.audio);
        }
        for (const src of res.graphics) {
            void Assets.load(src)
                .then(() => {
                    this.loadedGraphics.add(src);
                    this.updateLoaderData(null, { url: src });
                })
                .catch(this.setLoaderErrorMsg.bind(this));
        }
    }
    /**
     * Update loader data
     * @param {object} progress - Current loading progress
     * @param {object} url - Current loading url
     */
    updateLoaderData(_, url) {
        --this.remains;
        this.currentLoad = url?.url || url || '';
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
    graphics(resourceName) {
        if (!this.loadedGraphics.has(resourceName)) {
            return null;
        }
        const res = Texture.from(resourceName);
        return res || null;
    }
    /**
     * Get audio by name
     * @param {string} resourceName - Resource name
     */
    audio(resourceName) {
        const res = sounds[resourceName];
        return (res && res.hasLoaded) ? res : null;
    }
}
