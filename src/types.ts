import type { Container, Text } from 'pixi.js';

export type MusicMeta = {
    artist: string;
    name: string;
    creator: string;
    audio: string;
    bg: string;
    pr: string;
    version?: string;
    [key: string]: unknown;
};

export type TimingPoint = {
    bpm1000: number;
    pos1000: number;
    metronome: number;
    kiai?: boolean;
    inferred?: boolean;
};

export type HitObject = {
    type: number;
    pos1000: number;
    color?: number;
    last?: number;
    delta?: number;
    duration1000?: number;
};

export type HitInputState = {
    greenPressed: boolean;
    orangePressed: boolean;
    greenReleased: boolean;
    orangeReleased: boolean;
    greenHeld: boolean;
    orangeHeld: boolean;
    bonusPressed: boolean;
    notePressed: boolean;
    anyPressed: boolean;
};

export type HitJudgementResult = {
    judgement: number;
    type: string;
};

export type HitJudgeContext = {
    objectTime1000: number;
    currentTime1000: number;
    delta1000: number;
    absDelta1000: number;
};

export type HitJudgeDecision = HitJudgementResult & {
    context: HitJudgeContext;
    preserveCombo?: boolean;
    showFeedback?: boolean;
    consumeObject?: boolean;
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

export type EditorCommandResult = {
    changed: boolean;
    description: string;
};

export type EditorCommandSummary = {
    description: string;
    kind: string;
    payload?: Record<string, unknown>;
};

export type TimingPointDraft = {
    index: number;
    bpm1000: number;
    pos1000: number;
    metronome: number;
    kiai: boolean;
};

export type EditorCommand = {
    summary: EditorCommandSummary;
    description: string;
    execute: () => EditorCommandResult;
    undo: () => EditorCommandResult;
};

export type TickMod = {
    tick: number;
    divisor: number;
};

export type TickCursor = {
    time: number;
    startTime: number;
    endTime: number;
    timingPointIndex: number;
    tickIndex: number;
    metronome: number;
    divisor: number;
    mod: TickMod;
};

export type TimelineTick = {
    x: number;
    mod: TickMod;
    timingPointIndex: number;
    tickIndex: number;
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

export type HitObjectSprite = Container & {
    label: string;
    bpm1000: number;
    hitDone: boolean;
    transformScale?: number;
    railIndex: number;
    railY: number;
};

export type ScoreTextSprite = Text & {
    label: string;
    expireFrames: number;
};

export type TimingEditorWindow = HTMLDivElement & {
    timingPoints: TimingPoint[];
    selectedTimingPointIndex?: number;
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

export type GameplayScoreState = {
    scorePoints: Record<number, number>;
    hitResults: Record<string, number>;
    currentScore: number;
    currentCombo: number;
    maxCombo: number;
};

export type StageTreeNode = {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    alpha: number;
    childCount: number;
    children?: StageTreeNode[];
};

export type DebugEvent = {
    time: string;
    scene: string;
    scope: string;
    message: string;
    data?: unknown;
};

export type SceneDebugSnapshot = {
    scene: string;
    summary?: string[];
    [key: string]: unknown;
};

export type RuntimeDebugSnapshot = {
    app: {
        sceneName: string;
        mode: string;
        window: {
            width: number;
            height: number;
        };
        rootChildren: number;
        repaintItemCount: number;
        resource: {
            remains: number;
            currentLoad: string;
        };
    };
    scene: SceneDebugSnapshot | null;
    stageTree: StageTreeNode;
    repaintList: string[];
    recentEvents: DebugEvent[];
};

export type DebugApi = {
    text: (om?: Container, indent?: number) => string;
    tree: (om?: Container) => string;
    object: (om?: Container) => StageTreeNode;
    scene: () => SceneDebugSnapshot | null;
    snapshot: () => RuntimeDebugSnapshot;
    log: (scope: string, message: string, data?: unknown) => DebugEvent;
    getEvents: (limit?: number) => DebugEvent[];
    toggleHud: (force?: boolean) => boolean;
    openSnapshotWindow: () => string;
    openJsonWindow: (title: string, data: unknown) => string;
};
