import type { EditorCommand } from '../types';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';
import { buildHitObjectInsertCommand, findHitObjectIndex } from '../window/WindowHitObjectEditorCommands';

export function createInsertHitObjectCommand(
    scene: SceneEditorCommandTarget,
    payload: { type: number; color?: number; last?: number },
    description: string
): EditorCommand {
    const { obj, insertIndex } = buildHitObjectInsertCommand(
        scene.hitObjectWindow.hitObjects,
        scene.hitObjectWindow.currentIndex,
        scene.hitObjectWindow.lastUpdated,
        payload
    );
    return {
        summary: {
            description,
            kind: 'hitObject.insert',
            payload: {
                type: obj.type,
                color: obj.color,
                pos1000: obj.pos1000,
                index: insertIndex
            }
        },
        description,
        execute: () => {
            const inserted = scene.hitObjectWindow.insertHitObjectAt(insertIndex, obj);
            if (!inserted) {
                return {
                    changed: false,
                    description
                };
            }
            scene.uncached = true;
            window.Debug?.log('editor-command', description, {
                payload,
                currentTime: scene.data.currentTime
            });
            return {
                changed: true,
                description
            };
        },
        undo: () => {
            const removed = scene.hitObjectWindow.removeHitObjectAt(insertIndex);
            if (!removed) {
                return {
                    changed: false,
                    description: `Undo ${description}`
                };
            }
            scene.uncached = true;
            window.Debug?.log('editor-command', `Undo ${description}`, {
                payload,
                currentTime: scene.data.currentTime
            });
            return {
                changed: true,
                description: `Undo ${description}`
            };
        }
    };
}

export function createRemoveHitObjectCommand(scene: SceneEditorCommandTarget): EditorCommand {
    const targetIndex = findHitObjectIndex(scene.hitObjectWindow.hitObjects, scene.hitObjectWindow.lastUpdated);
    const removedObject = targetIndex >= 0 ? scene.hitObjectWindow.hitObjects[targetIndex] : null;
    return {
        summary: {
            description: 'Remove hit object',
            kind: 'hitObject.remove',
            payload: removedObject ? {
                type: removedObject.type,
                color: removedObject.color,
                pos1000: removedObject.pos1000,
                index: targetIndex
            } : {
                index: targetIndex
            }
        },
        description: 'Remove hit object',
        execute: () => {
            const removed = targetIndex >= 0 ? scene.hitObjectWindow.removeHitObjectAt(targetIndex) : null;
            if (!removed) {
                return {
                    changed: false,
                    description: 'Remove hit object'
                };
            }
            scene.uncached = true;
            window.Debug?.log('editor-command', 'Remove hit object', {
                currentTime: scene.data.currentTime
            });
            return {
                changed: true,
                description: 'Remove hit object'
            };
        },
        undo: () => {
            if (targetIndex < 0 || !removedObject) {
                return {
                    changed: false,
                    description: 'Undo remove hit object'
                };
            }
            scene.hitObjectWindow.insertHitObjectAt(targetIndex, removedObject);
            scene.uncached = true;
            window.Debug?.log('editor-command', 'Undo remove hit object', {
                currentTime: scene.data.currentTime,
                restoredPos1000: removedObject.pos1000
            });
            return {
                changed: true,
                description: 'Undo remove hit object'
            };
        }
    };
}
