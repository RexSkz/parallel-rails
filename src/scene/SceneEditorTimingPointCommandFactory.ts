import type { EditorCommand, TimingPoint, TimingPointDraft } from '../types';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';

function syncTimingPointEditor(scene: SceneEditorCommandTarget) {
    scene.updateFromCachedData();
}

export function createAddTimingPointCommand(scene: SceneEditorCommandTarget): EditorCommand {
    const newTimingPoint: TimingPoint = {
        bpm1000: Math.round(scene.data.timingPoints[0]?.bpm1000 || 120000),
        pos1000: Math.round(scene.data.currentTime * 1000),
        metronome: scene.data.timingPoints[0]?.metronome || 4,
        kiai: false
    };
    return {
        summary: {
            description: 'Add timing point',
            kind: 'timingPoint.add',
            payload: {
                pos1000: newTimingPoint.pos1000,
                bpm1000: newTimingPoint.bpm1000,
                metronome: newTimingPoint.metronome
            }
        },
        description: 'Add timing point',
        execute: () => {
            scene.data.timingPoints = [...scene.data.timingPoints, newTimingPoint].sort((a, b) => a.pos1000 - b.pos1000);
            scene.uncached = true;
            syncTimingPointEditor(scene);
            window.Debug?.log('editor-command', 'Add timing point', {
                pos1000: newTimingPoint.pos1000,
                bpm1000: newTimingPoint.bpm1000
            });
            return {
                changed: true,
                description: 'Add timing point'
            };
        },
        undo: () => {
            const index = scene.data.timingPoints.findIndex(item => (
                item.pos1000 === newTimingPoint.pos1000
                && item.bpm1000 === newTimingPoint.bpm1000
                && item.metronome === newTimingPoint.metronome
                && Boolean(item.kiai) === Boolean(newTimingPoint.kiai)
            ));
            if (index < 0 || scene.data.timingPoints.length <= 1) {
                return {
                    changed: false,
                    description: 'Undo add timing point'
                };
            }
            scene.data.timingPoints = scene.data.timingPoints.filter((_, itemIndex) => itemIndex !== index);
            scene.uncached = true;
            syncTimingPointEditor(scene);
            window.Debug?.log('editor-command', 'Undo add timing point', {
                pos1000: newTimingPoint.pos1000
            });
            return {
                changed: true,
                description: 'Undo add timing point'
            };
        }
    };
}

export function createRemoveTimingPointCommand(scene: SceneEditorCommandTarget, index: number): EditorCommand {
    const removedPoint = scene.data.timingPoints[index] || null;
    return {
        summary: {
            description: 'Remove timing point',
            kind: 'timingPoint.remove',
            payload: removedPoint ? {
                index,
                pos1000: removedPoint.pos1000,
                bpm1000: removedPoint.bpm1000,
                metronome: removedPoint.metronome
            } : { index }
        },
        description: 'Remove timing point',
        execute: () => {
            if (!removedPoint || scene.data.timingPoints.length <= 1) {
                return {
                    changed: false,
                    description: 'Remove timing point'
                };
            }
            scene.data.timingPoints = scene.data.timingPoints.filter((_, itemIndex) => itemIndex !== index);
            scene.uncached = true;
            syncTimingPointEditor(scene);
            window.Debug?.log('editor-command', 'Remove timing point', {
                index,
                pos1000: removedPoint.pos1000
            });
            return {
                changed: true,
                description: 'Remove timing point'
            };
        },
        undo: () => {
            if (!removedPoint) {
                return {
                    changed: false,
                    description: 'Undo remove timing point'
                };
            }
            const nextTimingPoints = [...scene.data.timingPoints];
            nextTimingPoints.splice(index, 0, removedPoint);
            scene.data.timingPoints = nextTimingPoints;
            scene.uncached = true;
            syncTimingPointEditor(scene);
            window.Debug?.log('editor-command', 'Undo remove timing point', {
                index,
                pos1000: removedPoint.pos1000
            });
            return {
                changed: true,
                description: 'Undo remove timing point'
            };
        }
    };
}

export function createUpdateTimingPointCommand(scene: SceneEditorCommandTarget, draft: TimingPointDraft): EditorCommand {
    const previousPoint = scene.data.timingPoints[draft.index] || null;
    const nextPoint: TimingPoint | null = previousPoint ? {
        ...previousPoint,
        bpm1000: draft.bpm1000,
        pos1000: draft.pos1000,
        metronome: draft.metronome,
        kiai: draft.kiai
    } : null;
    return {
        summary: {
            description: 'Update timing point',
            kind: 'timingPoint.update',
            payload: nextPoint ? {
                index: draft.index,
                bpm1000: nextPoint.bpm1000,
                pos1000: nextPoint.pos1000,
                metronome: nextPoint.metronome,
                kiai: Boolean(nextPoint.kiai)
            } : { index: draft.index }
        },
        description: 'Update timing point',
        execute: () => {
            if (!previousPoint || !nextPoint) {
                return {
                    changed: false,
                    description: 'Update timing point'
                };
            }
            if (
                previousPoint.bpm1000 === nextPoint.bpm1000
                && previousPoint.pos1000 === nextPoint.pos1000
                && previousPoint.metronome === nextPoint.metronome
                && Boolean(previousPoint.kiai) === Boolean(nextPoint.kiai)
            ) {
                return {
                    changed: false,
                    description: 'Update timing point'
                };
            }
            const nextTimingPoints = [...scene.data.timingPoints];
            nextTimingPoints[draft.index] = nextPoint;
            scene.data.timingPoints = nextTimingPoints.sort((a, b) => a.pos1000 - b.pos1000);
            scene.uncached = true;
            syncTimingPointEditor(scene);
            window.Debug?.log('editor-command', 'Update timing point', {
                index: draft.index,
                from: previousPoint,
                to: nextPoint
            });
            return {
                changed: true,
                description: 'Update timing point'
            };
        },
        undo: () => {
            if (!previousPoint || !nextPoint) {
                return {
                    changed: false,
                    description: 'Undo update timing point'
                };
            }
            const revertIndex = scene.data.timingPoints.findIndex(item => (
                item.pos1000 === nextPoint.pos1000
                && item.bpm1000 === nextPoint.bpm1000
                && item.metronome === nextPoint.metronome
                && Boolean(item.kiai) === Boolean(nextPoint.kiai)
            ));
            if (revertIndex < 0) {
                return {
                    changed: false,
                    description: 'Undo update timing point'
                };
            }
            const nextTimingPoints = [...scene.data.timingPoints];
            nextTimingPoints[revertIndex] = previousPoint;
            scene.data.timingPoints = nextTimingPoints.sort((a, b) => a.pos1000 - b.pos1000);
            scene.uncached = true;
            syncTimingPointEditor(scene);
            window.Debug?.log('editor-command', 'Undo update timing point', {
                index: revertIndex,
                restored: previousPoint
            });
            return {
                changed: true,
                description: 'Undo update timing point'
            };
        }
    };
}
