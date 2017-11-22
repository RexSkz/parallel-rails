/**
 * Some debug functions
 * @author Rex Zeng
 */

import G from './Global';

export default class Debug {
    constructor() {
        G.rootStage.id = 'ROOT';
    }
    sprites(om = G.rootStage, indent = 0) {
        const output = [
            (om.id || 'Untitled').substr(0, 30),
            '(' + Math.floor(om.x) + ',' + Math.floor(om.y) + ')',
            Math.floor(om.width) + 'x' + Math.floor(om.height)
        ];
        for (let i = 0; i < indent; i++) {
            output.unshift('');
        }
        console.log(output.join(' '));
        for (const child of om.children) {
            this.sprites(child, indent + 2);
        }
        return true;
    }
}
