/**
 * All global vars such as Data, Scene and something else
 * Required by nearly every single file
 * @author Rex Zeng
 */

import Input from './Input';
import DataConstants from './data/DataConstants';

// prevent repeat assignment for window._G
if (!window._G) {
    window._G = {
        // data structure objects
        dataConstants: new DataConstants,
        // input state
        Input: new Input,
        // graphics cache
        cache: {},
        // root stage
        stageContainer: new PIXI.Container,
        // for window resizing
        windowResized: false,
        windowResizePaintList: {},
        // other variables
        loader: {
            url: '',
            progress: 0,
            finished: false,
        },
        scene: null,
        switchingScene: false,
        renderer: null,
    };
}

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
