/**
 * Help calculate positions
 * @author Rex Zeng
 */

import G from './Global';

/**
 * Make a render loop
 * @param {func} func - Function to loop, return false to stop loop
 */
export function renderLoop(func) {
    const l = () => {
        G.input.update();
        G.audio.update();
        G.animation.update();
        if (func() !== false) {
            G.renderer.render(G.rootStage);
            requestAnimationFrame(l);
        }
    };
    l();
}

/**
 * Set sprite position with percent data provided
 * @param {Sprite} sprite - The sprite we want to move
 * @param {function} func - Function with two numbers output
 * @param {boolean} forceUpdate - Whether force update the render function
 * @param {boolean} global - Whether set a global sprite, MUST BE DELETED MANUALLY
 */
export function setPosition(sprite, func, forceUpdate = false, global = false) {
    if (sprite.id && !forceUpdate) {
        // avoid adding to queue again
        return;
    }
    const painter = () => {
        const result = func(window.innerWidth, window.innerHeight, sprite);
        if (result) {
            for (const key in result) {
                sprite[key] = result[key];
            }
        }
    };
    painter.sprite = sprite;
    painter.sceneName = G.sceneName;
    // add to repaint list
    G.repaintList[sprite.id] = painter;
    // paint once
    painter();
}

/**
 * Get music pr data
 * @param {string} url - Url of the `.pr` file
 */
export function getPr(url) {
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

/**
 * Time formatting
 * @param {number} time - Seconds
 */
export function formatTime(time) {
    let minute = Math.floor(time / 60);
    if (minute < 10) {
        minute = '0' + minute;
    }
    time %= 60;
    let second = Math.floor(time);
    if (second < 10) {
        second = '0' + second;
    }
    // fix float error
    time = (time * 1000 - second * 1000) / 1000;
    let millsec = Math.floor(time * 1000);
    if (millsec < 10) {
        millsec = '00' + millsec;
    } else if (millsec < 100) {
        millsec = '0' + millsec;
    }
    return `${minute}:${second}:${millsec}`;
}

/**
 * Append timing point editing window
 * @param {function} timFunc - Function used to pass timing data
 * @param {function} divFunc - Function used to pass divisor data
 */
export function appendTimingPointEditingWindow(timFunc, divFunc) {
    const w = document.createElement('div');
    w.className = 'timing-editor-wrapper';
    w.innerHTML = `
        <fieldset>
            <legend>Timing point list</legend>
            <table width="100%" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Pos</th>
                        <th>BPM</th>
                        <th>Metronome</th>
                        <th>Kiai</th>
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
    const divisor = w.querySelector('#divisor');
    const divisorShow = w.querySelector('#divisor-show');
    const changeDivisor = () => {
        let value = 1;
        if (divisor.value <= 1.5) {
            value = 1;
        } else if (divisor.value <= 3) {
            value = 2;
        } else if (divisor.value <= 5) {
            value = 4;
        } else if (divisor.value <= 7) {
            value = 6;
        } else if (divisor.value <= 10) {
            value = 8;
        } else {
            value = 12;
        }
        divisorShow.innerText = value;
        divFunc(value);
    };
    divisor.addEventListener('input', changeDivisor);
    w.destroy = () => {
        divisor.removeEventListener('input', changeDivisor);
        w.removeEventListener('keydown', listener);
        document.body.removeChild(w);
    };
    const controls = w.querySelectorAll('input, select, button');
    for (let i = 0; i < controls.length; i++) {
        const control = controls[i];
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
