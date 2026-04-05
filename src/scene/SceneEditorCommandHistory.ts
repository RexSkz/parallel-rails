import type { EditorCommand, EditorCommandSummary } from '../types';

type ImmutableStackNode = {
    command: EditorCommand;
    prev: ImmutableStackNode | null;
    size: number;
};

function pushNode(head: ImmutableStackNode | null, command: EditorCommand): ImmutableStackNode {
    return {
        command,
        prev: head,
        size: (head?.size || 0) + 1
    };
}

function collectSummaries(head: ImmutableStackNode | null, limit: number): EditorCommandSummary[] {
    const result: EditorCommandSummary[] = [];
    let current = head;
    let remaining = Math.max(0, Math.floor(limit));
    while (current && remaining > 0) {
        result.push(current.command.summary);
        current = current.prev;
        remaining -= 1;
    }
    return result.reverse();
}

export default class SceneEditorCommandHistory {
    private undoHead: ImmutableStackNode | null;
    private redoHead: ImmutableStackNode | null;

    constructor() {
        this.undoHead = null;
        this.redoHead = null;
    }

    execute(command: EditorCommand) {
        const result = command.execute();
        if (!result.changed) {
            return result;
        }
        this.undoHead = pushNode(this.undoHead, command);
        this.redoHead = null;
        return result;
    }

    undo() {
        if (!this.undoHead) {
            return {
                changed: false,
                description: 'Undo'
            };
        }
        const command = this.undoHead.command;
        const result = command.undo();
        if (!result.changed) {
            return result;
        }
        this.redoHead = pushNode(this.redoHead, command);
        this.undoHead = this.undoHead.prev;
        return result;
    }

    redo() {
        if (!this.redoHead) {
            return {
                changed: false,
                description: 'Redo'
            };
        }
        const command = this.redoHead.command;
        const result = command.execute();
        if (!result.changed) {
            return result;
        }
        this.undoHead = pushNode(this.undoHead, command);
        this.redoHead = this.redoHead.prev;
        return result;
    }

    getRecent(limit = 20) {
        return collectSummaries(this.undoHead, limit);
    }

    snapshot(limit = 20) {
        return {
            undoDepth: this.undoHead?.size || 0,
            redoDepth: this.redoHead?.size || 0,
            recentCommands: this.getRecent(limit)
        };
    }
}
