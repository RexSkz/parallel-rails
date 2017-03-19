/**
 * Help calculate positions
 * @author Rex Zeng
 */

import G from './Global';
import moment from 'moment';

/**
 * Set sprite position with percent data provided
 * @param {PixiSprite} sprite - The sprite we want to move
 * @param {function} func - Function with two numbers output
 * @param {boolean} forceUpdate - Whether force update the render function
 */
export function setPosition(sprite, func, forceUpdate = false) {
    if (sprite.queueId && !forceUpdate) {
        // avoid adding to queue again
        return;
    }
    // first adding or force update
    if (!sprite.queueId) {
        sprite.queueId = new Date().valueOf() + '-' + Math.random();
    }
    const painter = () => {
        const result = func();
        for (const key in result) {
            sprite[key] = result[key];
        }
    };
    painter.sprite = sprite;
    painter.sceneName = G.scene.name;
    G.windowResizePaintList[sprite.queueId] = painter;
    painter();
}

/**
 * Calculate the size of current sprite to fit the outer container
 * @param {number} width - Width of current sprite
 * @param {number} height - Height of current sprite
 * @param {number} outerWidth - Width of outer container
 * @param {number} outerHeight - Height of outer container
 * @return {object} Include width and height
 */
export function fitSize(width, height, outerWidth, outerHeight) {
    return Math.max(outerWidth / width, outerHeight / height);
}

/**
 * Update music list
 */
export function updateMusicList() {
    fetch('api/musics.json').then(res => {
        if (res.ok) {
            res.json().then(data => {
                G.musics = data;
            });
        } else {
            console.error(`Get music info failed, code ${res.status}`); // eslint-disable-line no-console
        }
    });
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
    time -= second;
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
    }
    divisor.addEventListener('input', changeDivisor);
    w.destroy = () => {
        divisor.removeEventListener('input', changeDivisor);
        w.removeEventListener('keydown', listener);
        document.body.removeChild(w);
    };
    w.show = () => w.className = 'timing-editor-wrapper show';
    w.hide = () => w.className = 'timing-editor-wrapper';
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
    for (const id in window._G.windowResizePaintList) {
        const item = window._G.windowResizePaintList[id];
        // don't recalculate the invisible item
        if (!item.sprite.visible) {
            continue;
        }
        // remove items that is not belongs to current scene
        if (item.sceneName != window._G.scene.name) {
            delete window._G.windowResizePaintList[id];
            continue;
        }
        item();
    }
});
