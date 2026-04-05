# Core Implementation Details

[中文](./core-implementation.md)

## 1. Input: converting async DOM events into frame-synchronous state

Related file: `src/Input.ts`

Browser keyboard events are naturally asynchronous, but the game wants a stable input snapshot per frame. The current implementation uses a two-step model.

### 1.1 Event capture

- `keydown` only records `pressedKey`
- `keyup` only records `releasedKey`

No gameplay logic runs directly inside the DOM event handlers.

### 1.2 Frame update

At the start of each frame, `renderLoop()` calls `G.input.update()`, which converts pending DOM events into a key-state table:

- `isPressed`: pressed on this frame
- `isReleased`: released on this frame
- `isRepeated`: currently held

Scenes can then poll input synchronously inside their own `update()` methods.

### 1.3 Native form focus isolation

The editor uses HTML inputs. `appendTimingPointEditingWindow()` toggles `G.nativeInputFocused` on focus/blur so game hotkeys stop intercepting keyboard input while a form control is active.

Related file: `src/Functions.ts`

### 1.4 Current limitation

The current model only buffers one `pressedKey` and one `releasedKey`. Multiple very fast DOM events in the same frame can overwrite one another. That is acceptable for the current prototype, but a real event queue would be safer for more complex simultaneous input.

## 2. Timing / tick math

Related file: `src/Tick.ts`

The codebase heavily uses `pos1000` and `bpm1000`, effectively integer values with millisecond * 1000 precision to reduce floating-point drift.

### 2.1 Core formulas

Each timing point includes at least:

- `bpm1000`
- `pos1000`
- `metronome`

Time per tick:

```ts
timePerTick = 60000000 / (bpm1000 * divisor)
```

Absolute time of a tick:

```ts
time = pos1000 + floor(timePerTick * tick)
```

### 2.2 Cursor lookup

`createCursorByTime(time)` works in two phases:

1. binary-search the timing-point segment containing the requested time
2. compute the tick index inside that segment

This is the shared basis for editor scrubbing, ruler drawing, and beat snapping.

### 2.3 Moving across timing points

`prevCursor()` and `nextCursor()` step across timing-point boundaries correctly, instead of treating all BPM regions as one evenly spaced grid.

### 2.4 Cursor semantics

Upper layers mainly consume `TickCursor`.

`TickCursor` includes at least:

- `timingPointIndex`
- `tickIndex`
- `startTime`
- `endTime`
- `mod`

That gives the editor, gameplay, and debug tooling one shared timing vocabulary.

## 3. Editor ruler and beat lines

Related files: `src/window/WindowTimeRuler.ts`, `src/scene/SceneEditor.ts`

### 3.1 Structure

The ruler is built from three visual layers:

- a fixed shadow region
- the current-time vertical marker
- a scrollable `timeLinesInner` container

The inner container is shifted by:

```ts
x = -relativeTime * zoom
```

So the current-time marker stays fixed and the ruler content moves underneath it.

### 3.2 Incremental maintenance

The ruler does not rebuild everything every frame. It uses three operations:

- `repaintAllTimingPoints()`: full rebuild
- `paintTpLeftTo()`: extend left, prune right
- `paintTpRightTo()`: extend right, prune left

This keeps the playback/scrub update cost manageable.

### 3.3 Tick semantics

`G.tick.getTickMod()` distinguishes:

- bar lines
- beat lines
- subdivision lines

`DataConstants.TIME_RULER_COLORS` provides the colors, while the code varies line height by semantic weight.

### 3.4 Editor time movement

`SceneEditor` currently supports:

- `LEFT / RIGHT`: move by tick
- `SHIFT + LEFT / RIGHT`: move by 10 ticks
- `CTRL + LEFT / RIGHT`: move by 1 ms
- `CTRL + SHIFT + LEFT / RIGHT`: move by 10 ms
- `HOME / END`: jump to start / end

## 4. Hit object positioning

Related files: `src/window/WindowHitObject.ts`, `src/window/WindowHitObjectRenderer.ts`

This is one of the most important visual calculations in the project.

### 4.1 Horizontal position formula

Each note uses:

```ts
positionX = bpm1000 * (obj.pos1000 - time1000) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT
```

The terms mean:

- `obj.pos1000 - time1000`: note time distance from the current playback time
- `bpm1000 / 1e6`: convert the time distance into BPM-scaled movement
- `HITOBJ_MARGIN_SIZE`: visual horizontal scale factor
- `JUDGEMENT_LINE_LEFT`: fixed judgement-line anchor

### 4.2 What that implies

This is not pure absolute-time linear motion. It is beat-relative motion scaled by BPM. In practice that means:

- higher BPM pushes notes faster across the lane
- the same raw time difference can occupy different visual distances in different BPM regions

That behavior keeps the note lane aligned with the ruler / beat-based editing model.

### 4.3 Vertical position status

At the moment all objects are rendered at screen center:

```ts
y = 0.5 * h
```

The renderer entry already leaves room for extensions such as:

- multi-lane Y placement
- switch objects
- hold objects

### 4.4 Passed-note behavior in editor mode

In editor mode, a note that has crossed the judgement line does not disappear immediately. Instead it:

- snaps to the judgement line
- scales up
- fades out

That makes passed notes easier to track while editing.

## 5. Judgement logic

Related file: `src/scene/SceneGaming.ts`

### 5.1 Evaluation target

The game only evaluates the next pending object:

- `hitIndex` points at the current target note
- `delta = currentTime - noteTime`
- the result depends on timing distance and key color

### 5.2 Current timing windows

The implemented rules are:

- later than `200ms`: auto miss (`-2`)
- only inputs within `300ms` enter score evaluation

Detailed windows:

- `<= 20ms`: `300g`
- `<= 60ms`: `300`
- `<= 100ms`: `200`
- `<= 160ms`: `100`
- `<= 220ms`: `50`
- earlier than that but still inside the 300ms evaluation window: `0`

### 5.3 Wrong key

If the timing is close enough but the input color is wrong, the result becomes `-1`.

### 5.4 Known point worth rechecking

The displayed green/orange input mapping in the editor and the gameplay wrong-key logic look potentially inconsistent. That is worth a focused review later:

- `src/scene/SceneEditor.ts`
- `src/window/WindowHitObject.ts`
- `src/scene/SceneGaming.ts`

## 6. Scoring and combo

Related file: `src/scene/SceneGaming.ts`

### 6.1 Recorded state

- `scorePoints[currentTime] = score`
- `hitResults[type]++`
- `currentCombo` / `maxCombo`
- `currentScore`

### 6.2 Combo growth

Only positive scores increase combo. Non-positive results reset combo to zero.

### 6.3 Score formula

```ts
currentScore += min(3000, score * (floor(currentCombo / 20) + 1))
```

Meaning:

- the multiplier steps up every 20 combo
- per-note gain is capped at 3000

This is the current judgement-value-plus-combo-growth formula.

## 7. Hit feedback animation

Related files: `src/window/WindowHitObject.ts`, `src/window/WindowHitScore.ts`, `src/Animation.ts`

### 7.1 Note animation

`objectHit()` applies different motion depending on the result:

- normal hit: scale up in place and fade out
- miss: move left and fade out
- wrong key: move downward and fade out

### 7.2 Floating judgement text

`WindowHitScore` creates a text sprite with an `expireFrames` counter:

- it drifts upward every frame
- alpha decays linearly
- it is removed when the counter reaches zero

## 8. Music-select animation

Related file: `src/scene/SceneMusicSelect.ts`

Each song entry is a sprite container. Selection changes do not jump instantly; they tween through `G.animation.set()`:

- horizontal offset depends on distance from the selected row
- vertical position forms the stack layout

So the feel of music selection comes largely from the tween system, not just static layout math.

## 9. Extra editor features

Related files: `src/scene/SceneEditor.ts`, `src/Functions.ts`

The editor currently includes a few important support features beyond note display:

- `Ctrl + S`: save the current chart into `localStorage`
- startup cache detection with restore / erase prompt
- `F12`: dump current chart JSON into a new popup window
- HTML timing editor controls for timing-point inspection and editing
- core hit object and timing-point edits now go through the command system
- the editor now supports `Ctrl + Z` / `Ctrl + Y` for undo / redo

This keeps the editor in a practical, debuggable, maintainable state.
