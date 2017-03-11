/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import {
    setPosition,
} from '../Functions';
import SceneBase from './SceneBase';
import SceneTitle from './SceneTitle';

/**
 * Define music select scene
 * @class
 */
export default class SceneMusicSelect extends SceneBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.name = 'music select';
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        // press ESC to back to title
        if (G.Input.isPressed(G.Input.ESC)) {
            G.scene = new SceneTitle;
        }
    }
}
