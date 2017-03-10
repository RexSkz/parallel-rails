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
        this.x = 0;
    }
    /**
     * Do calculations only, DO NOT do any paint in this function
     * @override
     */
    update() {
        super.update();
        this.x++;
        if (this.x >= 120) {
            G.scene = new SceneMusicSelect;
        }
    }
}
