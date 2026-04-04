import { Container } from 'pixi.js';

export default class WindowBase {
    stage: Container;

    constructor() {
        this.stage = new Container();
        this.stage.label = this.constructor.name;
    }

    update(..._args: unknown[]) {}

    dispose() {}
}
