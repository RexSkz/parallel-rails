/**
 * Resource loader
 * @author Rex Zeng
 */

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
        PIXI.loader
            .on('progress', this.updateLoaderData.bind(this))
            .on('error', this.setLoaderErrorMsg.bind(this));
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
        res.graphics = res.graphics ? res.graphics.filter(src => !PIXI.loader.resources[src]) : [];
        this.remains = res.audio.length + res.graphics.length;
        sounds.load(res.audio);
        PIXI.loader.reset().add(res.graphics).load();
    }
    /**
     * Update loader data
     * @param {object} progress - Current loading progress
     * @param {object} url - Current loading url
     */
    updateLoaderData(_, url) {
        --this.remains;
        this.currentLoad = url.url;
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
        const res = PIXI.Texture.fromImage(resourceName);
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
