/**
 * All used resources and its constants name
 * @author Rex Zeng
 */

export default class DataResources {
    constructor() {
        const resources = {};
        const result = [];
        for (const key of Object.keys(resources)) {
            result.push(resources[key]);
        }
        return result;
    }
}
