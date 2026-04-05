import G from '../Global';
import SceneMusicSelect from './SceneMusicSelect';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';
import { createInsertHitObjectCommand, createRemoveHitObjectCommand } from './SceneEditorBeatmapCommandFactory';

export function handleSceneEditorBeatmapCommands(scene: SceneEditorCommandTarget): boolean {
    if (G.input.isPressed(G.input.ESC)) {
        if (scene.uncached && !confirm('Your work has not been cached, quit by force?')) {
            return true;
        }
        scene.tpWindow.style.opacity = '0';
        G.audio.playSE('se/menu-back.mp3');
        G.scene = new SceneMusicSelect();
        return true;
    }
    if (G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)) {
        G.audio.playSE('se/hit-01.mp3');
        const command = createInsertHitObjectCommand(
            scene,
            { type: G.input.isPressed(G.input.SHIFT) ? 1 : 0, color: 0 },
            'Insert orange hit object'
        );
        scene.commandHistory.execute(command);
        return true;
    }
    if (G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J)) {
        G.audio.playSE('se/hit-00.mp3');
        const command = createInsertHitObjectCommand(
            scene,
            { type: G.input.isPressed(G.input.SHIFT) ? 1 : 0, color: 1 },
            'Insert green hit object'
        );
        scene.commandHistory.execute(command);
        return true;
    }
    if (G.input.isPressed(G.input.DELETE)) {
        const command = createRemoveHitObjectCommand(scene);
        scene.commandHistory.execute(command);
        return true;
    }
    if (G.input.isRepeated(G.input.CTRL) && G.input.isPressed(G.input.Z)) {
        scene.commandHistory.undo();
        return true;
    }
    if (G.input.isRepeated(G.input.CTRL) && G.input.isPressed(G.input.Y)) {
        scene.commandHistory.redo();
        return true;
    }
    return false;
}
