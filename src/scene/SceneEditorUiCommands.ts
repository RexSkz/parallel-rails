import { DateTime } from 'luxon';
import G from '../Global';
import type { TimingPointDraft } from '../types';
import type { SceneEditorCommandTarget } from './SceneEditorCommands';
import { createAddTimingPointCommand, createRemoveTimingPointCommand, createUpdateTimingPointCommand } from './SceneEditorTimingPointCommandFactory';

function syncTimingPointDetailForm(scene: SceneEditorCommandTarget, index: number) {
    const point = scene.data.timingPoints[index];
    if (!point) {
        return;
    }
    scene.tpWindow.selectedTimingPointIndex = index;
    (scene.tpWindow.querySelector('#bpm') as HTMLInputElement).value = String(point.bpm1000);
    (scene.tpWindow.querySelector('#pos') as HTMLInputElement).value = String(point.pos1000);
    (scene.tpWindow.querySelector('#metronome') as HTMLInputElement).value = String(point.metronome);
    (scene.tpWindow.querySelector('#kiai-time') as HTMLInputElement).checked = Boolean(point.kiai);
    const readOnly = Boolean(point.inferred);
    (scene.tpWindow.querySelector('#bpm') as HTMLInputElement).disabled = readOnly;
    (scene.tpWindow.querySelector('#pos') as HTMLInputElement).disabled = readOnly;
    (scene.tpWindow.querySelector('#metronome') as HTMLInputElement).disabled = readOnly;
    (scene.tpWindow.querySelector('#kiai-time') as HTMLInputElement).disabled = readOnly;
    (scene.tpWindow.querySelector('#timing-point-apply') as HTMLButtonElement).disabled = readOnly;
}

function readTimingPointDraft(scene: SceneEditorCommandTarget): TimingPointDraft | null {
    const index = scene.tpWindow.selectedTimingPointIndex ?? 0;
    if (!scene.data.timingPoints[index]) {
        return null;
    }
    return {
        index,
        bpm1000: Number((scene.tpWindow.querySelector('#bpm') as HTMLInputElement).value),
        pos1000: Number((scene.tpWindow.querySelector('#pos') as HTMLInputElement).value),
        metronome: Number((scene.tpWindow.querySelector('#metronome') as HTMLInputElement).value),
        kiai: Boolean((scene.tpWindow.querySelector('#kiai-time') as HTMLInputElement).checked)
    };
}

function ensureTimingPointCommandBindings(scene: SceneEditorCommandTarget) {
    if (scene.tpWindow.dataset.commandBindings === 'true') {
        return;
    }
    scene.tpWindow.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        const button = target.closest('button');
        if (!button) {
            return;
        }
        if (button.id === 'timing-point-apply') {
            const draft = readTimingPointDraft(scene);
            if (!draft) {
                return;
            }
            const command = createUpdateTimingPointCommand(scene, draft);
            scene.commandHistory.execute(command);
            return;
        }
        if (button.id === 'timing-point-add') {
            const command = createAddTimingPointCommand(scene);
            scene.commandHistory.execute(command);
            syncTimingPointDetailForm(scene, scene.data.timingPoints.length - 1);
            return;
        }
        if (button.id === 'timing-point-remove') {
            const row = button.closest('tr');
            const tbody = scene.tpWindow.querySelector('tbody');
            if (!row || !tbody) {
                return;
            }
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const index = rows.indexOf(row as HTMLTableRowElement);
            if (index < 0) {
                return;
            }
            if (scene.data.timingPoints[index]?.inferred) {
                return;
            }
            const command = createRemoveTimingPointCommand(scene, index);
            scene.commandHistory.execute(command);
            syncTimingPointDetailForm(scene, Math.max(index - 1, 0));
            return;
        }
        if (button.id === 'use-current-time') {
            (scene.tpWindow.querySelector('#pos') as HTMLInputElement).value = String(Math.round(scene.data.currentTime * 1000));
        }
    });
    scene.tpWindow.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        const row = target.closest('tr');
        const tbody = scene.tpWindow.querySelector('tbody');
        if (!row || !tbody) {
            return;
        }
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const index = rows.indexOf(row as HTMLTableRowElement);
        if (index >= 0) {
            syncTimingPointDetailForm(scene, index);
        }
    });
    scene.tpWindow.addEventListener('change', (event) => {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        if (!['bpm', 'pos', 'metronome', 'kiai-time'].includes(target.id)) {
            return;
        }
        const draft = readTimingPointDraft(scene);
        if (!draft) {
            return;
        }
        if (scene.data.timingPoints[draft.index]?.inferred) {
            syncTimingPointDetailForm(scene, draft.index);
            return;
        }
        const command = createUpdateTimingPointCommand(scene, draft);
        scene.commandHistory.execute(command);
    });
    scene.tpWindow.dataset.commandBindings = 'true';
}

export function handleSceneEditorUiCommands(scene: SceneEditorCommandTarget): boolean {
    ensureTimingPointCommandBindings(scene);
    if (G.input.isPressed(G.input.H)) {
        scene.helpWindow.stage.visible = !scene.helpWindow.stage.visible;
        scene.tpWindow.style.display = scene.helpWindow.stage.visible ? 'none' : 'block';
        return true;
    }
    if (G.input.isPressed(G.input.APOSTROPHE)) {
        scene.hitObjectWindow.stage.visible = !scene.hitObjectWindow.stage.visible;
        scene.tpWindow.style.opacity = String(1 - Number(scene.tpWindow.style.opacity));
        scene.tpWindow.style.visibility = Number(scene.tpWindow.style.opacity) ? 'visible' : 'hidden';
        return true;
    }
    if (G.input.isRepeated(G.input.CTRL) && G.input.isRepeated(G.input.S)) {
        const dt = DateTime.now().toFormat('yyyy-M-d H:m:s');
        localStorage.setItem(scene.storageKey, JSON.stringify({ time: dt, data: scene.data }));
        window.Debug?.log('editor', 'Cached beatmap to localStorage', {
            storageKey: scene.storageKey,
            timingPoints: scene.data.timingPoints.length,
            hitObjects: scene.data.hitObjects.length
        });
        alert(`Data has been cached in localStorage at ${dt}.`);
        scene.uncached = false;
        return true;
    }
    if (G.input.isPressed(G.input.F12)) {
        alert('Now I will show current data in a new window and assume you will save them into the .pr file.');
        const exportedData = {
            timingPoints: scene.data.timingPoints,
            hitObjects: scene.data.hitObjects
        };
        const data = window.Debug?.openJsonWindow(`Content of beatmap '${scene.storageKey}'`, exportedData)
            || JSON.stringify(exportedData, null, 2);
        window.Debug?.log('editor', 'Opened beatmap export window', {
            storageKey: scene.storageKey,
            length: data.length
        });
        scene.uncached = false;
        return true;
    }
    return false;
}
