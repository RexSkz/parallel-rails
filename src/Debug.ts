import { Container } from 'pixi.js';
import G from './Global';
import type { DebugApi, DebugEvent, RuntimeDebugSnapshot, SceneDebugSnapshot, StageTreeNode } from './types';

const MAX_EVENTS = 200;
const HUD_ID = 'parallel-rails-debug-hud';
const SNAPSHOT_WINDOW_FEATURES = 'height=700,width=720,top=20,left=20,menubar=no,scrollbars=yes,resizable=yes';

function clampEventList(events: DebugEvent[]) {
    if (events.length > MAX_EVENTS) {
        events.splice(0, events.length - MAX_EVENTS);
    }
}

export default class Debug implements DebugApi {
    private events: DebugEvent[];
    private hudVisible: boolean;
    private hudPre!: HTMLPreElement;

    constructor() {
        G.rootStage.label = 'ROOT';
        this.events = [];
        this.hudVisible = false;
        this.ensureHud();
    }

    text(om: Container = G.rootStage, indent = 0): string {
        const lines = this.collectTextLines(om, indent);
        const output = lines.join('\n');
        console.log(output);
        return output;
    }

    tree(om: Container = G.rootStage): string {
        return this.text(om);
    }

    object(om: Container = G.rootStage): StageTreeNode {
        const output: StageTreeNode = {
            label: (om.label || 'Untitled').slice(0, 60),
            x: Math.floor(om.x),
            y: Math.floor(om.y),
            width: Math.floor(om.width),
            height: Math.floor(om.height),
            visible: om.visible,
            alpha: Number(om.alpha.toFixed(3)),
            childCount: om.children.length
        };
        if (om.children.length > 0) {
            output.children = om.children.map(child => this.object(child));
        }
        return output;
    }

    scene(): SceneDebugSnapshot | null {
        const scene = G.scene as { debugSnapshot?: () => SceneDebugSnapshot } | null;
        if (!scene || typeof scene.debugSnapshot !== 'function') {
            return null;
        }
        try {
            return scene.debugSnapshot();
        } catch (error) {
            this.log('debug', 'Failed to build scene snapshot', error);
            return {
                scene: G.sceneName || 'UnknownScene',
                summary: ['debugSnapshot threw an error']
            };
        }
    }

    snapshot(): RuntimeDebugSnapshot {
        return {
            app: {
                sceneName: G.sceneName,
                mode: G.mode,
                window: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                rootChildren: G.rootStage.children.length,
                repaintItemCount: Object.keys(G.repaintList).length,
                resource: {
                    remains: G.resource.remains,
                    currentLoad: G.resource.currentLoad
                }
            },
            scene: this.scene(),
            stageTree: this.object(G.rootStage),
            repaintList: Object.keys(G.repaintList).sort(),
            recentEvents: this.getEvents(30)
        };
    }

    log(scope: string, message: string, data?: unknown): DebugEvent {
        const event: DebugEvent = {
            time: new Date().toISOString(),
            scene: G.sceneName || 'UnknownScene',
            scope,
            message,
            data
        };
        this.events.push(event);
        clampEventList(this.events);
        if (data === undefined) {
            console.log(`[${event.scene}] ${scope}: ${message}`);
        } else {
            console.log(`[${event.scene}] ${scope}: ${message}`, data);
        }
        this.renderHud();
        return event;
    }

    getEvents(limit = 20): DebugEvent[] {
        const safeLimit = Math.max(0, Math.floor(limit));
        return this.events.slice(-safeLimit);
    }

    toggleHud(force?: boolean): boolean {
        this.hudVisible = typeof force === 'boolean' ? force : !this.hudVisible;
        this.renderHud();
        return this.hudVisible;
    }

    openSnapshotWindow(): string {
        return this.openJsonWindow(`Parallel Rails Debug Snapshot - ${G.sceneName || 'UnknownScene'}`, this.snapshot());
    }

    openJsonWindow(title: string, data: unknown): string {
        const text = JSON.stringify(data, null, 2);
        const newWindow = window.open('', '', SNAPSHOT_WINDOW_FEATURES);
        if (newWindow) {
            newWindow.document.title = title;
            newWindow.document.body.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;font-family:Consolas, monospace;margin:16px"></pre>';
            const pre = newWindow.document.querySelector('pre');
            if (pre) {
                pre.textContent = text;
            }
        }
        return text;
    }

    private collectTextLines(om: Container, indent = 0): string[] {
        const prefix = ' '.repeat(indent);
        const current = `${prefix}${om.label || 'Untitled'} (${Math.floor(om.x)},${Math.floor(om.y)}) ${Math.floor(om.width)}x${Math.floor(om.height)} visible=${om.visible} alpha=${Number(om.alpha.toFixed(2))}`;
        const childLines = om.children.flatMap(child => this.collectTextLines(child, indent + 2));
        return [current, ...childLines];
    }

    private ensureHud() {
        let hud = document.getElementById(HUD_ID) as HTMLPreElement | null;
        if (!hud) {
            hud = document.createElement('pre');
            hud.id = HUD_ID;
            hud.style.position = 'fixed';
            hud.style.top = '8px';
            hud.style.right = '8px';
            hud.style.zIndex = '9999';
            hud.style.maxWidth = '38vw';
            hud.style.maxHeight = '45vh';
            hud.style.margin = '0';
            hud.style.padding = '10px 12px';
            hud.style.overflow = 'auto';
            hud.style.whiteSpace = 'pre-wrap';
            hud.style.wordBreak = 'break-word';
            hud.style.font = '12px/1.4 Consolas, monospace';
            hud.style.color = '#dff6dd';
            hud.style.background = 'rgba(12, 18, 12, 0.82)';
            hud.style.border = '1px solid rgba(180, 255, 180, 0.35)';
            hud.style.borderRadius = '6px';
            hud.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
            hud.style.pointerEvents = 'none';
            hud.style.display = 'none';
            document.body.appendChild(hud);
        }
        this.hudPre = hud;
    }

    private renderHud() {
        this.ensureHud();
        if (!this.hudVisible) {
            this.hudPre.style.display = 'none';
            return;
        }
        const sceneSnapshot = this.scene();
        const lines = [
            `Scene: ${G.sceneName || 'UnknownScene'} (${G.mode})`,
            `Window: ${window.innerWidth}x${window.innerHeight}`,
            `Repaint items: ${Object.keys(G.repaintList).length}`,
            `Resources pending: ${G.resource.remains}`
        ];
        if (sceneSnapshot?.summary?.length) {
            lines.push('', ...sceneSnapshot.summary.map(item => `- ${item}`));
        }
        const recentEvents = this.getEvents(5);
        if (recentEvents.length) {
            lines.push('', 'Events:');
            for (const event of recentEvents) {
                lines.push(`- ${event.scope}: ${event.message}`);
            }
        }
        this.hudPre.textContent = lines.join('\n');
        this.hudPre.style.display = 'block';
    }
}
