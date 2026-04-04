# Debugging and Development Notes

[中文](./debug-and-dev.md)

## 1. Debug entry points

### 1.1 Global `Debug` object

Related files: `src/Main.ts`, `src/Debug.ts`

At startup the app runs:

```ts
window.Debug = new Debug();
```

So the browser console can directly use:

```js
Debug.text()
Debug.object()
```

### 1.2 `Debug.text()`

Prints a simplified Pixi stage tree including:

- label
- x / y
- width / height

Useful for quickly checking:

- whether an object exists
- whether it is attached to the expected parent
- whether its layout looks obviously wrong

### 1.3 `Debug.object()`

Returns a nested object structure suitable for interactive console inspection.

Compared with `text()`, it is better for:

- inspecting the full tree shape
- exploring children recursively
- locating a specific sprite instance

## 2. Editor-specific debugging helpers

Related file: `src/scene/SceneEditor.ts`

### 2.1 Local cache

Inside the editor, `Ctrl + S`:

- writes the current chart into `localStorage`
- uses a key derived from song metadata
- prompts on the next editor launch to restore or erase cached data

This is very useful while tuning timing or insertion logic because it avoids manually rewriting `.pr` files on every test.

### 2.2 Export current chart

Pressing `F12`:

- opens a popup window
- renders the current chart JSON inside it

This acts as a temporary export path for:

- checking the data structure
- copying JSON into a `.pr` file
- verifying timing points and hit objects after edits

## 3. Common debugging paths

### 3.1 Scene renders but positions are wrong

Check:

- `Debug.text()` output
- `G.repaintList`
- `window.innerWidth / innerHeight`
- whether the object was registered through `Graphics.setPosition()` or `Functions.setPosition()`

Relevant files: `src/Graphics.ts`, `src/Functions.ts`, `src/scene/SceneBase.ts`

### 3.2 Input does not work or feels inconsistent

Check:

- whether `G.nativeInputFocused` is blocking game hotkeys
- results of `G.input.isPressed()` / `isRepeated()`
- whether the active scene `update()` is actually entering the expected branch

Relevant files: `src/Input.ts`, `src/scene/SceneEditor.ts`, `src/scene/SceneGaming.ts`

### 3.3 Hit object position looks wrong

Check:

- `obj.pos1000`
- current `time1000`
- the note's `bpm1000`
- `HITOBJ_MARGIN_SIZE`
- `JUDGEMENT_LINE_LEFT`

Relevant files: `src/window/WindowHitObject.ts`, `src/data/DataConstants.ts`

### 3.4 Ruler ticks look wrong

Check:

- `G.tick.tp`
- `G.tick.divisor`
- results from `findPositionByTime()`, `prev()`, `next()`
- `WindowTimeRuler.timeLineObject`

Relevant files: `src/Tick.ts`, `src/window/WindowTimeRuler.ts`

## 4. Build and run

Current common scripts from `package.json`:

```bash
pnpm lint
pnpm build
pnpm serve
```

### 4.1 `pnpm serve`

Starts the Vite dev server at:

```text
http://127.0.0.1:3000
```

### 4.2 `pnpm build`

Builds the production bundle using `vite.config.ts`.

Important setup:

- `publicDir: 'game'`
- output entry filename fixed to `parallel-rails.min.js`

## 5. Asset layout

Because `game/` is the Vite public directory, these resources are exposed directly:

- `game/api/musics.json`
- `game/bgm/*`
- `game/graphics/*`
- `game/lib/sound.js`
- `game/se/*`
- `game/songs/*`
- `game/style.css`

Runtime code therefore uses direct public paths such as:

- `api/musics.json`
- `graphics/title-bg.jpg`
- `se/menu-click.mp3`
- `songs/...`

## 6. Current status and TODO

### 6.1 Current status

- TypeScript runs with `strict: true` and `noImplicitAny: true`.
- Luxon uses its official type definitions.
- Pixi objects are identified with `label`.
- The `game/` directory is treated as the Vite public asset tree.

### 6.2 TODO

- reduce the remaining explicit `any` usage
- strengthen the overall type model, especially song metadata and `window._G`
- finish hold and switch object implementations
- review gameplay color-mapping consistency
- build a fuller score/result presentation
