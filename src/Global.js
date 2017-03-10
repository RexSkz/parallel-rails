/**
 * All global vars such as Data, Scene and something else
 * Required by nearly every single file
 * @author Rex Zeng
 */

import Input from './Input';
import DataConstants from './data/DataConstants';
import DataResources from './data/DataResources';

if (!window._G) {
    window._G = {
        // data structure objects
        dataConstants: new DataConstants(),
        dataResources: new DataResources(),
        // input state
        Input: new Input(),
        // other variables
        loading: 0,
        scene: null,
        renderer: null,
    };
}

export default window._G;
