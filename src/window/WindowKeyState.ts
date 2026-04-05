import G from '../Global';
import WindowBase from './WindowBase';

const KEY_NAMES: Record<number, string> = {
    16: 'SHIFT',
    17: 'CTRL',
    18: 'ALT',
    32: 'SPACE',
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    68: 'D',
    70: 'F',
    72: 'H',
    74: 'J',
    75: 'K',
    90: 'Z'
};

export default class WindowKeyState extends WindowBase {
    title!: ReturnType<typeof G.graphics.createText>;
    content!: ReturnType<typeof G.graphics.createText>;

    constructor() {
        super();
        this.stage.addChild(G.graphics.createRect({
            left: 0,
            top: 0,
            width: 240,
            height: 84,
            background: 0x000000,
            opacity: 0.55,
            borderWidth: 1,
            borderColor: 0xffffff
        }));
        this.title = G.graphics.createText('Keys', { fontSize: 14 }, { x: 10, y: 8 });
        this.content = G.graphics.createText('-', { fontSize: 14 }, { x: 10, y: 30 });
        this.stage.addChild(this.title);
        this.stage.addChild(this.content);
        G.graphics.setPosition(this.stage, (w: number) => ({ x: w - 250, y: 10 }));
    }

    update() {
        const keys = G.input.getRepeatedKeys();
        this.content.text = keys.length
            ? keys.map(code => KEY_NAMES[code] || String.fromCharCode(code)).join(' ')
            : '-';
    }
}
