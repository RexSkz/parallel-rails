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
Debug.object()
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

这相当于一个临时导出器，适合：

- 检查数据结构
- 手工复制到 `.pr` 文件
- 快速确认 hit object / timing point 是否正确生成

## 3. 常见排查路径

### 3.1 画面正常但元素位置错乱

优先看：

- `Debug.text()` 的输出
- `G.repaintList`
- `window.innerWidth / innerHeight`
- 对应对象是否通过 `Graphics.setPosition()` 或 `Functions.setPosition()` 注册了 painter

相关文件：`src/Graphics.ts`、`src/Functions.ts`、`src/scene/SceneBase.ts`

### 3.2 按键无效或串键

优先看：

- `G.nativeInputFocused` 是否被原生输入框占用
- `G.input.isPressed()` / `isRepeated()` 的返回值
- 当前场景 `update()` 是否实际执行到对应分支

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
- `findPositionByTime()`、`prev()`、`next()` 的结果
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

### 6.2 TODO

- 减少剩余显式 `any`
- 补完整体类型模型，尤其是歌曲元数据和 `window._G`
- 补全长条、切轨等未实现物件
- 复查游玩判定中的颜色映射一致性
- 为结算页补正式展示与统计图形
