import G from '../Global';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';

export function handleSceneEditorPlaybackCommands(scene: SceneEditorCommandTarget): boolean {
    if (G.input.isPressed(G.input.SPACE)) {
        if (scene.audio.playing) {
            scene.audio.pause();
        } else if (scene.data.currentTime < scene.data.duration) {
            if (scene.data.playFromTime >= 0) {
                scene.audio.playFrom(scene.data.playFromTime);
                scene.data.playFromTime = -1;
            } else {
                scene.audio.play();
            }
            scene.audio.fadeIn(0);
        }
        return true;
    }
    if (G.input.isPressed(G.input.LEFT)) {
        if (scene.data.currentTime === 0) {
            return true;
        }
        if (G.input.isRepeated(G.input.CTRL)) {
            const count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
            scene.setPlayFrom(scene.data.currentTime - 0.001 * count);
            scene.timeRulerWindow.paintTpLeftTo(scene.data.currentTime * 1000);
            return true;
        }
        if (scene.data.timingPoints.length !== 0) {
            let count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
            let currentTime = 0;
            while (count--) {
                scene.pos = G.tick.prevCursor(scene.pos, scene.atEdge);
                currentTime = scene.pos.time;
            }
            scene.atEdge = true;
            scene.setPlayFrom(currentTime / 1000);
            scene.timeRulerWindow.paintTpLeftTo(scene.data.currentTime * 1000);
        }
        return true;
    }
    if (G.input.isPressed(G.input.RIGHT)) {
        if (scene.data.currentTime === scene.data.duration) {
            return true;
        }
        if (G.input.isRepeated(G.input.CTRL)) {
            const count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
            scene.setPlayFrom(scene.data.currentTime + 0.001 * count);
            scene.timeRulerWindow.paintTpRightTo(scene.data.currentTime * 1000);
            return true;
        }
        if (scene.data.timingPoints.length !== 0) {
            let count = G.input.isRepeated(G.input.SHIFT) ? 10 : 1;
            let currentTime = 0;
            while (count--) {
                scene.pos = G.tick.nextCursor(scene.pos);
                currentTime = scene.pos.time;
            }
            scene.atEdge = true;
            scene.setPlayFrom(currentTime / 1000);
            scene.timeRulerWindow.paintTpRightTo(scene.data.currentTime * 1000);
        }
        return true;
    }
    if (G.input.isPressed(G.input.HOME)) {
        scene.pos = G.tick.createCursorByTime(0);
        scene.atEdge = false;
        scene.setPlayFrom(0);
        scene.timeRulerWindow.repaintAllTimingPoints(0);
        return true;
    }
    if (G.input.isPressed(G.input.END)) {
        scene.pos = G.tick.createCursorByTime(scene.data.duration * 1000);
        scene.atEdge = false;
        scene.setPlayFrom(scene.data.duration);
        scene.timeRulerWindow.repaintAllTimingPoints(scene.data.duration * 1000);
        return true;
    }
    return false;
}
