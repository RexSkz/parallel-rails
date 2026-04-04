import G from './Global';
import type { Container } from 'pixi.js';

export default class Debug {
    constructor() {
        G.rootStage.label = 'ROOT';
    }
    text(om: Container = G.rootStage, indent = 0) {
        const output = [
            (om.label || 'Untitled').substr(0, 25),
            '(' + Math.floor(om.x) + ',' + Math.floor(om.y) + ')',
            Math.floor(om.width) + 'x' + Math.floor(om.height)
        ];
        for (let i = 0; i < indent; i++) {
            output.unshift('');
        }
        console.log('%c' + output.join(' '), 'white-space:nowrap');
        for (const child of om.children) {
            this.text(child, indent + 2);
        }
        return true;
    }
    object(om: Container = G.rootStage) {
        const output: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
            sprite: Container;
            children?: ReturnType<Debug['object']>[];
        } = {
            id: (om.label || 'Untitled').substr(0, 30),
            x: Math.floor(om.x),
            y: Math.floor(om.y),
            width: Math.floor(om.width),
            height: Math.floor(om.height),
            sprite: om
        };
        if (om.children.length) {
            output.children = [];
            for (const child of om.children) {
                output.children.push(this.object(child));
            }
        }
        return output;
    }
}
