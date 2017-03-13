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
            pixiLoader: false,
            soundLoader: false,
            sceneSwitch: false,
        },
        // current scene
        scene: null,
        // global renderer
        renderer: null,
        // music list
        musics: null,
        // current pr data
        currentPr: null,
        // last selected music
        lastSelectMusic: -1,
        // game mode
        mode: 'play',
    };
}

export default window._G;
