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
        // other variables
        loader: {
            url: '',
            progress: 0,
            finished: false,
        },
        scene: null,
        renderer: null,
    };
}

export default window._G;
