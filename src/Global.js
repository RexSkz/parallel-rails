/**
 * All global vars such as Data, Scene and something else
 * Required by nearly every single file
 * @author Rex Zeng
 */

import Animation from './Animation';
import Audio from './Audio';
import Input from './Input';
import Resource from './Resource';
import DataConstants from './data/DataConstants';

// prevent repeat assignment for window._G
if (!window._G) {
    window._G = {
        // data structure objects
        constant: new DataConstants,
        // animation controller
        animation: new Animation,
        // input state
        input: new Input,
        // audio
        audio: new Audio,
        // root stage
        stageContainer: new PIXI.Container,
        // resource loader
        resource: new Resource,
        // for window resizing
        windowResized: false,
        windowResizePaintList: {},
        // locks
        lock: {
            loader: false,
            sceneSwitch: false,
        },
        // current scene
        scene: null,
        // global renderer
        renderer: null,
        // music list
        musics: null,
    };
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

export default window._G;
