# 调试与开发说明

[English](./debug-and-dev.en.md)

## 1. 调试入口

### 1.1 全局 Debug 对象

相关文件：`src/Main.ts`、`src/Debug.ts`

程序启动时会执行：

```ts
window.Debug = new Debug();
```

因此在浏览器控制台里可以直接使用：

```js
Debug.text()
Debug.tree()
Debug.object()
Debug.scene()
Debug.snapshot()
Debug.getEvents()
```

### 1.2 `Debug.text()`

输出当前 Pixi stage 树的简化文本结构，包含：

- label
- x / y
- width / height

适合快速看：

- 某个对象有没有被创建
- 是否挂到了预期父节点上
- 当前布局位置是否异常

### 1.3 `Debug.object()`

返回嵌套对象结构，适合在控制台里展开查看。

相比 `text()`，它更适合做：

- 精确排查树结构
- 观察 children 层级
- 定位具体 sprite

### 1.4 `Debug.scene()` / `Debug.snapshot()`

- `Debug.scene()` 返回当前场景的结构化摘要。
- `Debug.snapshot()` 返回更完整的运行时快照，包含：
  - 当前 scene / mode
  - 窗口大小
  - `repaintList`
  - 资源加载状态
  - 最近事件日志
  - Pixi stage 树

这两个接口比单纯看 console 更适合：

- 给 AI 粘贴当前运行态
- 报 issue 时附带现场信息
- 比较 editor / gameplay 的状态差异

### 1.5 调试 HUD 与快捷键

- `Ctrl + Shift + D`：显示或隐藏调试 HUD。
- `Ctrl + Shift + J`：弹出当前运行时快照 JSON。

HUD 会显示：

- 当前场景
- 窗口尺寸
- repaint 项数量
- 资源加载剩余数量
- 当前场景摘要
- 最近几条调试事件

## 2. 编辑器调试能力

相关文件：`src/scene/SceneEditor.ts`

### 2.1 本地缓存

在编辑器中按 `Ctrl + S`：

- 当前谱面会写入 `localStorage`
- key 由曲目元信息拼出
- 下次进入该谱面时，会提示是否恢复缓存

这对调试 timing、命中物件插入逻辑非常有用，因为不用每次都手动回填 `.pr` 文件。

### 2.2 导出当前谱面

按 `F12` 时：

- 会弹出一个新窗口
- 窗口里显示当前谱面 JSON
- 底层复用了统一的 JSON 调试窗口逻辑

这相当于一个临时导出器，适合：

- 检查数据结构
- 手工复制到 `.pr` 文件
- 快速确认 hit object / timing point 是否正确生成

### 2.3 命令历史与撤销/重做

编辑器当前已经支持：

- `Ctrl + Z`：撤销最近的编辑命令
- `Ctrl + Y`：重做最近撤销的编辑命令

目前进入命令系统的主要动作包括：

- hit object 的插入 / 删除
- timing point 的新增 / 删除
- timing point detail 的 Apply 修改

如果要确认某次编辑到底改了什么，可以看：

- `Debug.scene()` 里的 `ui.commandHistory`
- `Debug.getEvents()` 里的 `editor-command` 事件

## 3. 常见排查路径

### 3.1 画面正常但元素位置错乱

优先看：

- `Debug.text()` 的输出
- `G.repaintList`
- `window.innerWidth / innerHeight`
- 对应对象是否通过 `Graphics.setPosition()` 或 `Functions.setPosition()` 注册了 painter
- `Debug.snapshot().stageTree`
- `Debug.snapshot().repaintList`

相关文件：`src/Graphics.ts`、`src/Functions.ts`、`src/scene/SceneBase.ts`

### 3.2 按键无效或串键

优先看：

- `G.nativeInputFocused` 是否被原生输入框占用
- `G.input.isPressed()` / `isRepeated()` 的返回值
- 当前场景 `update()` 是否实际执行到对应分支
- `Debug.scene()` 里的场景摘要
- `Debug.getEvents()` 里的最近输入/切场景记录

相关文件：`src/Input.ts`、`src/scene/SceneEditor.ts`、`src/scene/SceneGaming.ts`

### 3.3 物件位置不对

优先检查：

- `obj.pos1000`
- 当前 `time1000`
- note 使用的 `bpm1000`
- `HITOBJ_MARGIN_SIZE`
- `JUDGEMENT_LINE_LEFT`

相关文件：`src/window/WindowHitObject.ts`、`src/data/DataConstants.ts`

### 3.4 时间尺刻度不对

优先检查：

- `G.tick.tp`
- `G.tick.divisor`
- `createCursorByTime()`、`prevCursor()`、`nextCursor()` 的结果
- `WindowTimeRuler.timeLineObject`

相关文件：`src/Tick.ts`、`src/window/WindowTimeRuler.ts`

## 4. 构建与运行

`package.json` 中当前常用脚本：

```bash
pnpm lint
pnpm build
pnpm serve
```

### 4.1 `pnpm serve`

启动 Vite 开发服务器，默认地址：

```text
http://127.0.0.1:3000
```

### 4.2 `pnpm build`

构建生产包。Vite 配置位于 `vite.config.ts`。

关键点：

- `publicDir: 'game'`
- 输出入口文件名固定为 `parallel-rails.min.js`

## 5. 资源目录约定

由于 `game/` 被作为 public 目录，以下资源都可以直接通过根路径访问：

- `game/api/musics.json`
- `game/bgm/*`
- `game/graphics/*`
- `game/lib/sound.js`
- `game/se/*`
- `game/songs/*`
- `game/style.css`

代码里的路径通常直接写成：

- `api/musics.json`
- `graphics/title-bg.jpg`
- `se/menu-click.mp3`
- `songs/...`

## 6. 当前已知事项与 TODO

### 6.1 当前状态

- TypeScript 以 `strict: true` 和 `noImplicitAny: true` 运行。
- Luxon 使用官方类型定义。
- Pixi 对象识别统一使用 `label`。
- `game/` 目录作为 Vite public 资源目录提供静态资源。
