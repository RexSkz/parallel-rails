import G from '../Global';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';

const SCRUB_INITIAL_DELAY_MS = 250;
const SCRUB_REPEAT_INTERVAL_MS = 100;

function stepPlayback(scene: SceneEditorCommandTarget, direction: -1 | 1) {
    if (direction < 0) {
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
            let currentTime = scene.data.currentTime * 1000;
            while (count--) {
                const nextCursor = G.tick.prevCursor(scene.pos, scene.atEdge);
                if (nextCursor.time < 0 || !Number.isFinite(nextCursor.time)) {
                    scene.pos = G.tick.createCursorByTime(0, 0);
                    currentTime = 0;
                    break;
                }
                scene.pos = nextCursor;
                currentTime = scene.pos.time;
                if (currentTime <= 0) {
                    currentTime = 0;
                    scene.pos = G.tick.createCursorByTime(0, 0);
                    break;
                }
            }
            scene.atEdge = true;
            scene.setPlayFrom(currentTime / 1000);
            scene.timeRulerWindow.paintTpLeftTo(scene.data.currentTime * 1000);
        }
        return true;
    }
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

function tryContinuousScrub(scene: SceneEditorCommandTarget, direction: -1 | 1, holdStartedAtKey: 'left' | 'right') {
    const now = performance.now();
    const startedAt = holdStartedAtKey === 'left' ? scene.leftScrubStartedAt : scene.rightScrubStartedAt;
    const lastStepAt = holdStartedAtKey === 'left' ? scene.leftScrubLastStepAt : scene.rightScrubLastStepAt;
    const keyCode = direction < 0 ? G.input.LEFT : G.input.RIGHT;
    if (!G.input.isRepeated(keyCode)) {
        if (holdStartedAtKey === 'left') {
            scene.leftScrubStartedAt = 0;
            scene.leftScrubLastStepAt = 0;
        } else {
            scene.rightScrubStartedAt = 0;
            scene.rightScrubLastStepAt = 0;
        }
        return false;
    }
    if (G.input.isPressed(keyCode)) {
        if (holdStartedAtKey === 'left') {
            scene.leftScrubStartedAt = now;
            scene.leftScrubLastStepAt = now;
        } else {
            scene.rightScrubStartedAt = now;
            scene.rightScrubLastStepAt = now;
        }
        return stepPlayback(scene, direction);
    }
    if (!startedAt || now - startedAt < SCRUB_INITIAL_DELAY_MS) {
        return false;
    }
    if (now - lastStepAt < SCRUB_REPEAT_INTERVAL_MS) {
        return false;
    }
    if (holdStartedAtKey === 'left') {
        scene.leftScrubLastStepAt = now;
    } else {
        scene.rightScrubLastStepAt = now;
    }
    return stepPlayback(scene, direction);
}

export function handleSceneEditorPlaybackCommands(scene: SceneEditorCommandTarget): boolean {
    const noteHeld = Boolean(
        G.input.isRepeated(G.input.D)
        || G.input.isRepeated(G.input.F)
        || G.input.isRepeated(G.input.J)
        || G.input.isRepeated(G.input.K)
    );
    const altHeld = Boolean(G.input.isRepeated(G.input.ALT));
    if (G.input.isPressed(G.input.SPACE) && !G.input.isRepeated(G.input.CTRL)) {
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
    if (!noteHeld && !altHeld && tryContinuousScrub(scene, -1, 'left')) {
        return true;
    }
    if (!noteHeld && !altHeld && tryContinuousScrub(scene, 1, 'right')) {
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
