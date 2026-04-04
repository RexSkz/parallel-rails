import type { Container, Sprite, Text } from 'pixi.js';

export type TimingPoint = {
    bpm1000: number;
    pos1000: number;
    metronome: number;
    kiai?: boolean;
};

export type HitObject = {
    type: number;
    pos1000: number;
    color?: number;
    last?: number;
};

export type BeatmapData = {
    artist: string;
    name: string;
    creator: string;
    timingPoints: TimingPoint[];
    hitObjects: HitObject[];
    currentTime: number;
    duration: number;
    playFromTime: number;
    detail: number;
    isEditMode: boolean;
};

export type TickMod = {
    tick: number;
    divisor: number;
};

export type TickPosition = {
    tp: number;
    tick: number;
    l: number;
    r: number;
    metronome?: number;
    divisor?: number;
};

export type TimelineTick = {
    x: number;
    mod: TickMod;
    tp: number;
    tick: number;
    time: number;
};

export type PaintResult = Record<string, unknown> & {
    size?: 'cover';
    position?: 'center';
    positionX?: number | 'center';
    positionY?: number | 'center';
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    transformScale?: number;
};

export type PositionCallback<T extends Container = Container> = (width: number, height: number, sprite: T) => PaintResult;

export type PositionSpec<T extends Container = Container> = PaintResult | PositionCallback<T>;

export type RepaintRenderer<T extends Container = Container> = (() => void) & {
    sprite: T;
    sceneName: string;
};

export type AnimationFunction = (left: number, right: number, progress: number) => number;

export type AnimatableSprite = Container & {
    label: string;
};

export type HitObjectSprite = Sprite & {
    label: string;
    bpm1000: number;
    hitDone: boolean;
    transformScale?: number;
};

export type ScoreTextSprite = Text & {
    label: string;
    expireFrames: number;
};

export type TimingEditorWindow = HTMLDivElement & {
    timingPoints: TimingPoint[];
    destroy: () => void;
};

export type SoundHandle = {
    name: string;
    playing: boolean;
    loop?: boolean;
    hasLoaded?: boolean;
    buffer: {
        duration: number;
    };
    startOffset: number;
    startTime: number;
    soundNode?: {
        context: {
            currentTime: number;
        };
    };
    fadeOut: (duration: number) => void;
    fadeIn: (duration: number) => void;
    playFrom: (time: number) => void;
    play: () => void;
    pause: () => void;
};
