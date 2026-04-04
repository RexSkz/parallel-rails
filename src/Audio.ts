import type { SoundHandle } from './types';

export default class Audio {
    bgm: SoundHandle;

    constructor() {
        this.bgm = {
            name: '',
            playing: false,
            buffer: { duration: 0 },
            startOffset: 0,
            startTime: 0,
            fadeOut: () => {},
            fadeIn: () => {},
            playFrom: () => {},
            play: () => {},
            pause: () => {}
        };
    }

    playBGM(src: string, startTime = 0) {
        if (!sounds[src]) {
            console.error(`Resource ${src} not loaded!`);
            return false;
        }
        if (src === this.bgm.name && this.bgm.playing) {
            return false;
        }
        this.bgm.fadeOut(1);
        this.bgm = sounds[src] as SoundHandle;
        this.bgm.loop = true;
        this.bgm.playFrom(startTime);
        this.bgm.fadeIn(1);
        return true;
    }

    pauseBGM() {
        this.bgm.pause();
    }

    playSE(src: string) {
        if (!sounds[src]) {
            console.error(`Resource ${src} not loaded!`);
            return false;
        }
        sounds[src].loop = false;
        sounds[src].play();
        return true;
    }

    update() {}

    getCurrentPlayTime(audio: SoundHandle): number {
        return audio.soundNode ? (audio.startOffset + audio.soundNode.context.currentTime - audio.startTime) : 0;
    }
}
