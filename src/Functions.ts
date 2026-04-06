import G from './Global';
import type { AnimatableSprite, PositionSpec, RepaintRenderer, TimingEditorWindow, TimingPoint } from './types';

export function renderLoop(func: () => boolean | void) {
    const l = () => {
        G.input.update();
        G.audio.update();
        G.animation.update();
        if (func() !== false) {
            G.renderer.render({ container: G.rootStage });
            requestAnimationFrame(l);
        }
    };
    l();
}

export function setPosition<T extends AnimatableSprite>(sprite: T, func: PositionSpec<T>, forceUpdate = false, global = false) {
    if (sprite.label && !forceUpdate) {
        // avoid adding to queue again
        return;
    }
    const painter: RepaintRenderer<T> = Object.assign(() => {
        const result = typeof func === 'function' ? func(window.innerWidth, window.innerHeight, sprite) : func;
        if (result) {
            for (const key in result) {
                Reflect.set(sprite, key, result[key]);
            }
        }
    }, { sprite, sceneName: G.sceneName });
    // add to repaint list
    G.repaintList[sprite.label] = painter;
    // paint once
    painter();
}

export function getPr(url: string) {
    fetch(url).then(res => {
        if (res.ok) {
            res.json().then(data => {
                G.currentPr = data;
            });
        } else {
            console.error(`Get pr failed, code ${res.status}`); // eslint-disable-line no-console
        }
    });
}

export function formatTime(time: number): string {
    const minuteNum = Math.floor(time / 60);
    let minute = String(minuteNum);
    if (minuteNum < 10) minute = '0' + minute;
    time %= 60;
    const secondNum = Math.floor(time);
    let second = String(secondNum);
    if (secondNum < 10) second = '0' + second;
    // fix float error
    time = (time * 1000 - secondNum * 1000) / 1000;
    const millsecNum = Math.floor(time * 1000);
    let millsec = String(millsecNum);
    if (millsecNum < 10) {
        millsec = '00' + millsec;
    } else if (millsecNum < 100) {
        millsec = '0' + millsec;
    }
    return `${minute}:${second}:${millsec}`;
}

export function appendTimingPointEditingWindow(timFunc: (timingPoints: TimingPoint[]) => void, divFunc: (divisor: number) => void): TimingEditorWindow {
    const w = document.createElement('div') as TimingEditorWindow;
    w.className = 'timing-editor-wrapper';
    w.timingPoints = [];
    w.innerHTML = `
        <fieldset>
            <legend>Timing point list</legend>
            <table width="100%" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th width="20%">Action</th>
                        <th width="20%">Pos</th>
                        <th width="20%">BPM</th>
                        <th width="20%">Metronome</th>
                        <th width="20%">Kiai</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <button id="timing-point-add">Add new timing point</button>
        </fieldset>
        <fieldset>
            <legend>Timing point detail</legend>
            <fieldset>
                <legend>BPM and position</legend>
                <p><span>BPM(×1000): </span><input type="number" min="1" id="bpm"></p>
                <p><span>POS(×1000): </span><input type="number" min="0" id="pos"></p>
                <p><button id="use-current-time">Use current time</button></p>
            </fieldset>
            <fieldset>
                <legend>Metronome</legend>
                <input type="number" min="2" max="4" id="metronome" value="4"><span> / 4 (For instance, 4 for common and 3 for waltz)</span>
            </fieldset>
            <fieldset>
                <legend>Kiai setting</legend>
                <label for="kiai-time">
                    <input type="checkbox" id="kiai-time" onchange="this.blur()">
                    <span>It's kiai time!</span>
                </label>
            </fieldset>
            <p><button id="timing-point-apply">Apply timing point changes</button></p>
        </fieldset>
        <fieldset>
            <legend>Beat snap divisor (1/<span id="divisor-show">4</span>)</legend>
            <p><input type="range" min="1" max="12" step="0.01" value="4" id="divisor" onchange="this.blur()"></p>
            <button id="scale-up">&lt;- Timeline zoom+ -&gt;</button>
            <button id="scale-down">-&gt; Timeline zoom- &lt;-</button>
        </fieldset>
    `;
    const listener = () => {
        timFunc(w.timingPoints);
    };
    w.addEventListener('keydown', listener);
    const divisor = w.querySelector('#divisor') as HTMLInputElement;
    const divisorShow = w.querySelector('#divisor-show') as HTMLSpanElement;
    const changeDivisor = () => {
        let value = 1;
        const currentValue = Number(divisor.value);
        if (currentValue <= 1.5) {
            value = 1;
        } else if (currentValue <= 3) {
            value = 2;
        } else if (currentValue <= 5) {
            value = 4;
        } else if (currentValue <= 7) {
            value = 6;
        } else if (currentValue <= 10) {
            value = 8;
        } else {
            value = 12;
        }
        divisorShow.innerText = String(value);
        divFunc(value);
    };
    divisor.addEventListener('input', changeDivisor);
    w.selectedTimingPointIndex = 0;
    w.destroy = () => {
        divisor.removeEventListener('input', changeDivisor);
        w.removeEventListener('keydown', listener);
        document.body.removeChild(w);
    };
    const controls = w.querySelectorAll('input, select, button');
    for (let i = 0; i < controls.length; i++) {
        const control = controls[i] as HTMLInputElement | HTMLSelectElement | HTMLButtonElement;
        control.onfocus = () => G.nativeInputFocused = true;
        control.onblur = () => G.nativeInputFocused = false;
    }
    document.body.appendChild(w);
    return w;
}

// when window is resized, recalculate the position of elements in paint list
window.addEventListener('resize', () => {
    G.windowResized = true;
});
