/**
 * Resource loader
 * @author Rex Zeng
 */

import { Assets, Texture } from 'pixi.js';

export default class Resource {
    remains: number;
    currentLoad: string;
    loadedGraphics: Set<string>;

    constructor() {
        this.remains = 0;
        this.currentLoad = '';
        this.loadedGraphics = new Set<string>();
        sounds.onProgress = this.updateLoaderData.bind(this);
        sounds.onFailed = this.setLoaderErrorMsg.bind(this);
        sounds.whenLoaded = () => {};
    }

    load(res: { audio?: string[]; graphics?: string[] }) {
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

    updateLoaderData(_: unknown, url: string | { url: string } | null) {
        --this.remains;
        this.currentLoad = typeof url === 'string' ? url : (url?.url || '');
    }

    setLoaderErrorMsg(msg: unknown) {
        console.error(msg);
    }

    graphics(resourceName: string) {
        if (!this.loadedGraphics.has(resourceName)) {
            return null;
        }
        const res = Texture.from(resourceName);
        return res || null;
    }

    audio(resourceName: string) {
        const res = sounds[resourceName];
        return (res && res.hasLoaded) ? res : null;
    }
}
