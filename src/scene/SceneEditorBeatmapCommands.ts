import G from '../Global';
import SceneMusicSelect from './SceneMusicSelect';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';
import { createInsertHitObjectCommand, createRemoveHitObjectCommand } from './SceneEditorBeatmapCommandFactory';

const SLIDER_ADJUST_INITIAL_DELAY_MS = 250;
const SLIDER_ADJUST_REPEAT_INTERVAL_MS = 100;

function getSliderLength(scene: SceneEditorCommandTarget) {
    const currentTime1000 = Math.round(scene.data.currentTime * 1000);
    const nextTick = G.tick.nextCursor(scene.pos);
    return Math.max(nextTick.time - currentTime1000, 1);
}

function getCurrentSlider(scene: SceneEditorCommandTarget) {
    const draft = scene.hitObjectWindow.getSliderDraft();
    if (!draft) {
        return null;
    }
    if (Math.abs(draft.obj.pos1000 - Math.round(scene.data.currentTime * 1000)) > 1) {
        return null;
    }
    return draft;
}

function playInsertSe(type: number, color?: number) {
    if (type === 2) {
        G.audio.playSE('se/hit-00.mp3');
        return;
    }
    G.audio.playSE(color === 0 ? 'se/hit-01.mp3' : 'se/hit-00.mp3');
}

function syncSceneTimeToObject(scene: SceneEditorCommandTarget, index: number) {
    const time1000 = scene.hitObjectWindow.syncCurrentTimeToObjectTime(index);
    if (time1000 === null) {
        return;
    }
    scene.pos = G.tick.createCursorByTime(time1000, scene.pos?.timingPointIndex ?? 0);
    scene.atEdge = false;
    scene.setPlayFrom(time1000 / 1000);
    scene.timeRulerWindow.repaintAllTimingPoints(time1000);
}

function canRepeatSliderAdjust(scene: SceneEditorCommandTarget, keyCode: number) {
    if (!G.input.isRepeated(G.input.ALT) || !G.input.isRepeated(keyCode)) {
        scene.sliderAdjustStartedAt = 0;
        scene.sliderAdjustLastStepAt = 0;
        return false;
    }
    const now = performance.now();
    if (G.input.isPressed(keyCode)) {
        scene.sliderAdjustStartedAt = now;
        scene.sliderAdjustLastStepAt = now;
        return true;
    }
    if (!scene.sliderAdjustStartedAt || now - scene.sliderAdjustStartedAt < SLIDER_ADJUST_INITIAL_DELAY_MS) {
        return false;
    }
    if (now - scene.sliderAdjustLastStepAt < SLIDER_ADJUST_REPEAT_INTERVAL_MS) {
        return false;
    }
    scene.sliderAdjustLastStepAt = now;
    return true;
}

function tryAdjustCurrentBonusObject(scene: SceneEditorCommandTarget): boolean {
    const bonusDraft = scene.hitObjectWindow.getCurrentBonusHitObject();
    if (!bonusDraft || !G.input.isRepeated(G.input.ALT)) {
        return false;
    }
    if (G.input.isPressed(G.input.UP)) {
        scene.hitObjectWindow.updateCurrentBonusHitObject((bonusDraft.obj.delta || 0) - 1);
        syncSceneTimeToObject(scene, bonusDraft.index);
        scene.uncached = true;
        return true;
    }
    if (G.input.isPressed(G.input.DOWN)) {
        scene.hitObjectWindow.updateCurrentBonusHitObject((bonusDraft.obj.delta || 0) + 1);
        syncSceneTimeToObject(scene, bonusDraft.index);
        scene.uncached = true;
        return true;
    }
    if (canRepeatSliderAdjust(scene, G.input.LEFT)) {
        scene.hitObjectWindow.updateCurrentBonusHitObject(undefined, Math.max(100, (bonusDraft.obj.duration1000 || 1000) - 100));
        syncSceneTimeToObject(scene, bonusDraft.index);
        scene.uncached = true;
        return true;
    }
    if (canRepeatSliderAdjust(scene, G.input.RIGHT)) {
        scene.hitObjectWindow.updateCurrentBonusHitObject(undefined, (bonusDraft.obj.duration1000 || 1000) + 100);
        syncSceneTimeToObject(scene, bonusDraft.index);
        scene.uncached = true;
        return true;
    }
    return false;
}

function tryAdjustCurrentSlider(scene: SceneEditorCommandTarget): boolean {
    if (!G.input.isRepeated(G.input.ALT)) {
        return false;
    }
    const currentSlider = getCurrentSlider(scene);
    if (currentSlider) {
        if (canRepeatSliderAdjust(scene, G.input.LEFT)) {
            currentSlider.obj.last = Math.max(1, (currentSlider.obj.last || getSliderLength(scene)) - 100);
            scene.hitObjectWindow.refreshCurrentLayout();
            syncSceneTimeToObject(scene, currentSlider.index);
            scene.uncached = true;
            return true;
        }
        if (canRepeatSliderAdjust(scene, G.input.RIGHT)) {
            currentSlider.obj.last = (currentSlider.obj.last || getSliderLength(scene)) + 100;
            scene.hitObjectWindow.refreshCurrentLayout();
            syncSceneTimeToObject(scene, currentSlider.index);
            scene.uncached = true;
            return true;
        }
        return false;
    }
    const normalDraft = scene.hitObjectWindow.getCurrentNormalHitObject();
    if (!normalDraft) {
        return false;
    }
    if (canRepeatSliderAdjust(scene, G.input.LEFT) || canRepeatSliderAdjust(scene, G.input.RIGHT)) {
        scene.hitObjectWindow.convertCurrentHitObjectToSlider(getSliderLength(scene));
        syncSceneTimeToObject(scene, normalDraft.index);
        scene.uncached = true;
        return true;
    }
    return false;
}

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
    if (tryAdjustCurrentBonusObject(scene)) {
        return true;
    }
    if (tryAdjustCurrentSlider(scene)) {
        return true;
    }
    if (G.input.isRepeated(G.input.CTRL) && G.input.isPressed(G.input.SPACE)) {
        const command = createInsertHitObjectCommand(
            scene,
            { type: 2, delta: 1, duration1000: 1000 },
            'Insert bonus hit object'
        );
        playInsertSe(2);
        scene.commandHistory.execute(command);
        return true;
    }
    if (G.input.isRepeated(G.input.CTRL) || G.input.isRepeated(G.input.ALT) || G.input.isRepeated(G.input.SHIFT)) {
        return false;
    }
    if (G.input.isPressed(G.input.D) || G.input.isPressed(G.input.K)) {
        G.audio.playSE('se/hit-01.mp3');
        const command = createInsertHitObjectCommand(
            scene,
            { type: 0, color: 0 },
            'Insert orange hit object'
        );
        scene.commandHistory.execute(command);
        return true;
    }
    if (G.input.isPressed(G.input.F) || G.input.isPressed(G.input.J)) {
        G.audio.playSE('se/hit-00.mp3');
        const command = createInsertHitObjectCommand(
            scene,
            { type: 0, color: 1 },
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
