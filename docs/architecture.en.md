# Architecture

[中文](./architecture.md)

## 1. Overview

Parallel Rails is currently a browser rhythm-game prototype built around Pixi.js rendering and a global singleton runtime state. The app is organized into a few clear layers:

1. bootstrap layer: initialize the renderer, mount the canvas, enter the first scene
2. global service layer: input, audio, resources, graphics, animation, tick math
3. scene layer: title, music select, gameplay, editor, score
4. window layer: scene-local UI modules such as timing bars, hit-object view, help panel

Related files: `src/bootstrap.ts`, `src/Main.ts`, `src/Global.ts`

## 2. Bootstrap flow

### 2.1 HTML entry

- `index.html` provides the `#game-area` mount target.
- It loads `/lib/sound.js` as a global script.
- It then loads `/src/bootstrap.ts` as the module entry.

### 2.2 Application entry

- `src/bootstrap.ts` looks up `#game-area`.
- If found, it instantiates `ParallelRails`.

### 2.3 Renderer setup

`src/Main.ts` is responsible for:

- creating the Pixi renderer via `autoDetectRenderer()`
- stretching the canvas to fullscreen
- handling `resize`, resizing the renderer, and setting `G.windowResized = true`
- starting the first scene with `new SceneTitle()`

## 3. Global state model

`src/Global.ts` stores the shared runtime object on `window._G` and exports it as `G`.

Main members include:

- `animation`: tween queue and easing logic
- `input`: keyboard state machine
- `audio`: bgm/se wrapper
- `graphics`: sprite creation and responsive positioning
- `resource`: preload system
- `tick`: beat and timing math
- `rootStage`: Pixi root container
- `renderer`: global renderer
- `scene` / `sceneName`: active scene instance and its name
- `repaintList`: resize-driven layout callbacks
- `mode`: `play` or `edit`

This design keeps scene transitions simple and module access direct, at the cost of fairly high coupling.

## 4. Scene system

### 4.1 SceneBase lifecycle

`src/scene/SceneBase.ts` defines the shared scene lifecycle:

1. `waitLoading()`
2. `onInitialize()`
3. `fadeIn()`
4. `mainLoop()`
5. `fadeOut()`
6. `onTerminate()`

Each scene owns its own `stage` and attaches it to `G.rootStage`.

### 4.2 Scene switching

Scene switching is done directly by assignment:

```ts
G.scene = new SceneMusicSelect();
```

The old scene exits because its loop sees `G.scene !== this`, then runs fade-out and cleanup.

### 4.3 Current scene flow

- `SceneTitle`: title screen
- `SceneMusicSelect`: song selection
- `SceneGaming`: gameplay
- `SceneEditor`: editor
- `SceneScore`: result screen

Files: `src/scene/*.ts`

## 5. Window layer

The window layer is made of reusable scene-local sub-containers.

Base class: `src/window/WindowBase.ts`

Current window modules:

- `WindowTiming`: bottom timing bar and playback marker
- `WindowHitObject`: main hit-object rendering area
- `WindowHitScore`: floating judgement text
- `WindowTimeRuler`: editor ruler and beat lines
- `WindowHelp`: help overlay

This makes it possible for `SceneGaming` and `SceneEditor` to share some UI logic, especially `WindowTiming` and `WindowHitObject`.

## 6. Rendering and relayout

### 6.1 Per-frame loop

`src/Functions.ts` provides `renderLoop()`:

1. `G.input.update()`
2. `G.audio.update()`
3. `G.animation.update()`
4. run scene logic
5. `G.renderer.render({ container: G.rootStage })`
6. `requestAnimationFrame()`

### 6.2 repaintList

The app renders the full Pixi stage each frame. The repaint system is specifically for recomputing responsive layout after resize.

Files: `src/Graphics.ts`, `src/Functions.ts`, `src/scene/SceneBase.ts`

Flow:

- `Graphics.setPosition()` / `Functions.setPosition()` register painter callbacks.
- Those callbacks are stored in `G.repaintList`.
- On resize, `SceneBase.calcRepaintItems()` reruns painters for visible objects.

## 7. Graphics and animation

### 7.1 Graphics

`src/Graphics.ts` exposes the object factories:

- `createImage()`
- `createText()`
- `createSprite()`
- `createRect()`
- `setPosition()`

Pixi object identification now uses the built-in `label` property rather than project-specific global type augmentation.

### 7.2 Animation

`src/Animation.ts` implements a lightweight tween queue:

- keyed by sprite `label`
- stores `start`, `end`, `currentFrames`, easing, and callback
- interpolates properties every frame
- treats `transformScale` specially and maps it to `sprite.scale`

Main usage sites:

- music-list movement in `src/scene/SceneMusicSelect.ts`
- hit/miss effects in `src/window/WindowHitObject.ts`

## 8. Resource system

`src/Resource.ts` loads audio and images through separate paths:

- audio goes through the global `sounds` library
- images go through Pixi `Assets.load()`

`SceneBase.waitLoading()` waits until:

```ts
G.resource.remains <= 0
```

Note that the song list and beatmap JSON are not part of this preload path:

- `api/musics.json` is fetched directly in `SceneMusicSelect`
- `.pr` beatmaps are fetched directly in `SceneGaming` and `SceneEditor`

## 9. Vite and the `game/` asset tree

`vite.config.ts` sets:

```ts
publicDir: 'game'
```

So the entire `game/` directory is served and copied as public assets:

- `game/api`
- `game/bgm`
- `game/graphics`
- `game/lib`
- `game/se`
- `game/songs`
- `game/style.css`

That is why the runtime can use direct public paths such as:

- `graphics/...`
- `bgm/...`
- `se/...`
- `songs/...`
- `api/musics.json`
