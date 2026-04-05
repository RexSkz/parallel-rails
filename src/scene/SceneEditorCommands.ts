import type { TickCursor, TimingEditorWindow } from '../types';
import type WindowHelp from '../window/WindowHelp';
import type WindowHitObject from '../window/WindowHitObject';
import type WindowTimeRuler from '../window/WindowTimeRuler';
import type WindowTiming from '../window/WindowTiming';
import type { BeatmapData, SoundHandle } from '../types';
import type SceneEditorCommandHistory from './SceneEditorCommandHistory';
import { handleSceneEditorBeatmapCommands } from './SceneEditorBeatmapCommands';
import { handleSceneEditorPlaybackCommands } from './SceneEditorPlaybackCommands';
import { handleSceneEditorUiCommands } from './SceneEditorUiCommands';

export type SceneEditorCommandTarget = {
    audio: SoundHandle;
    data: BeatmapData;
    storageKey: string;
    uncached: boolean;
    atEdge: boolean;
    currentMode: string;
    pos: TickCursor;
    tpWindow: TimingEditorWindow;
    timeRulerWindow: WindowTimeRuler;
    timingWindow: WindowTiming;
    hitObjectWindow: WindowHitObject;
    helpWindow: WindowHelp;
    commandHistory: SceneEditorCommandHistory;
    setPlayFrom: (time: number) => void;
    updateFromCachedData: () => void;
};

export function runSceneEditorCommands(scene: SceneEditorCommandTarget) {
    return handleSceneEditorUiCommands(scene)
        || handleSceneEditorPlaybackCommands(scene)
        || handleSceneEditorBeatmapCommands(scene);
}
