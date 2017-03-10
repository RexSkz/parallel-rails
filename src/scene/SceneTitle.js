/**
 * Title scene
 * @author Rex Zeng
 */

import G from '../Global';
import SceneBase from './SceneBase';
import SceneMusicSelect from './SceneMusicSelect';

/**
 * Define title scene
 * @class
 */
export default class SceneTitle extends SceneBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        console.log('title');
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        // press ENTER to enter music select
        if (G.Input.isPressed(G.Input.ENTER)) {
            G.scene = new SceneMusicSelect;
        }
    }
}
