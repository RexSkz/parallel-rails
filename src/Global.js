/**
 * All global vars such as Data, Scene and something else
 * Required by nearly every single file
 * @author Rex Zeng
 */

import DataConstants from './data/DataConstants';
import DataResources from './data/DataResources';

if (!window._G) {
    window._G = {
        // data structure objects
        dataConstants: new DataConstants(),
        dataResources: new DataResources(),
        // other variables
        loading: 0,
        scene: null,
    };
}

export default window._G;
