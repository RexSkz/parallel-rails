# 技术架构

[English](./architecture.en.md)

## 1. 总览

Parallel Rails 当前是一个以 Pixi.js 为渲染核心、以全局单例状态驱动的浏览器音游原型。整体入口非常薄，主要由以下几层组成：

1. 启动层：初始化 renderer、挂载 canvas、进入首个场景。
2. 全局服务层：输入、音频、资源、图形、动画、Tick 计算等单例。
3. 场景层：标题、选歌、游玩、编辑器、结算。
4. 窗口层：场景内的 UI 子模块，如时间轴、判定区、帮助面板。

相关文件：`src/bootstrap.ts`、`src/Main.ts`、`src/Global.ts`

## 2. 启动链路

### 2.1 页面入口

- `index.html` 提供 `#game-area` 容器。
- 先加载全局脚本 `/lib/sound.js`。
- 再加载模块入口 `/src/bootstrap.ts`。

### 2.2 程序入口

- `src/bootstrap.ts` 从 DOM 中取出 `#game-area`。
- 找到目标节点后实例化 `ParallelRails`。

### 2.3 Renderer 初始化

`src/Main.ts` 负责：

- 调用 `autoDetectRenderer()` 创建 Pixi renderer。
- 将 canvas 设为全屏铺满窗口。
- 监听 `resize`，更新 renderer 尺寸并设置 `G.windowResized = true`。
- 创建首个场景：`new SceneTitle()`。

## 3. 全局状态模型

`src/Global.ts` 将运行时共享对象挂到 `window._G`，并导出为默认全局对象 `G`。

主要内容包括：

- `animation`：动画队列与补间逻辑
- `input`：按键状态机
- `audio`：背景音乐与音效包装层
- `graphics`：图形创建与响应式定位
- `resource`：资源预载入
- `tick`：节拍与 timing 计算
- `rootStage`：Pixi 根舞台
- `renderer`：全局 renderer
- `scene` / `sceneName`：当前场景实例与名称
- `repaintList`：窗口尺寸变化后需要重新布局的对象
- `mode`：当前模式，`play` 或 `edit`

这个结构的特点是：

- 场景之间切换成本低；
- 模块互相调用简单；
- 但耦合度较高，后续若做大型重构，可考虑逐步收敛全局依赖边界。

## 4. 场景系统

### 4.1 SceneBase 生命周期

`src/scene/SceneBase.ts` 定义了所有场景共享的生命周期：

1. `waitLoading()`
2. `onInitialize()`
3. `fadeIn()`
4. `mainLoop()`
5. `fadeOut()`
6. `onTerminate()`

每个场景都有自己的 `stage`，并挂到 `G.rootStage` 下。

### 4.2 场景切换方式

场景切换不是路由系统，也不是状态机注册表，而是直接赋值：

```ts
G.scene = new SceneMusicSelect();
```

旧场景的主循环会在 `mainLoop()` 中检测 `G.scene !== this`，然后触发淡出和清理。

### 4.3 当前场景流转

- `SceneTitle`：标题场景
- `SceneMusicSelect`：选歌场景
- `SceneGaming`：游玩场景
- `SceneEditor`：编辑场景
- `SceneScore`：结算场景

对应文件：`src/scene/*.ts`

## 5. 窗口层

窗口层本质上是“场景内部可组合的子舞台容器”。

基类：`src/window/WindowBase.ts`

当前主要窗口：

- `WindowTiming`：底部时间显示与当前播放指针
- `WindowHitObject`：中间主判定区与物件渲染
- `WindowHitScore`：击打后的浮动判定文本
- `WindowTimeRuler`：编辑器上方时间尺 / 节拍线
- `WindowHelp`：快捷键帮助面板

这种拆分让 `SceneGaming` 和 `SceneEditor` 可以共享部分 UI 逻辑，例如：

- `WindowTiming`
- `WindowHitObject`

## 6. 渲染与重布局机制

### 6.1 每帧循环

`src/Functions.ts` 中的 `renderLoop()` 是当前核心帧循环：

1. `G.input.update()`
2. `G.audio.update()`
3. `G.animation.update()`
4. 执行场景逻辑
5. `G.renderer.render({ container: G.rootStage })`
6. `requestAnimationFrame()`

### 6.2 repaintList

项目不是增量重绘，而是每帧完整 render；`repaintList` 的职责其实是“窗口变化后重新计算布局”。

相关文件：`src/Graphics.ts`、`src/Functions.ts`、`src/scene/SceneBase.ts`

流程是：

- `Graphics.setPosition()` / `Functions.setPosition()` 注册一个 painter 回调。
- 回调会被放入 `G.repaintList`。
- 当窗口尺寸变化时，`SceneBase.calcRepaintItems()` 会重跑所有可见对象的 painter。

适合这种项目的原因是：

- 布局依赖 `window.innerWidth / innerHeight`；
- 多数元素是“相对屏幕位置”的，而不是静态坐标。

## 7. 图形与动画层

### 7.1 Graphics

`src/Graphics.ts` 提供了统一的图形工厂：

- `createImage()`
- `createText()`
- `createSprite()`
- `createRect()`
- `setPosition()`

现在统一使用 Pixi 自带的 `label` 作为对象标识，而不是给 Pixi 类型打全局补丁添加 `id`。

### 7.2 Animation

`src/Animation.ts` 提供一个非常轻量的 tween 队列：

- 队列按 sprite `label` 索引
- 记录 `start` / `end` / `currentFrames` / easing / callback
- 每帧插值并写回属性
- 对 `transformScale` 做专门处理，映射到 `sprite.scale`

主要使用位置：

- 选歌列表切换动画：`src/scene/SceneMusicSelect.ts`
- 物件命中 / Miss 动画：`src/window/WindowHitObject.ts`

## 8. 资源系统

`src/Resource.ts` 将音频和图像分开管理：

- 音频：交给全局 `sounds` 库处理
- 图像：交给 Pixi `Assets.load()` 处理

`SceneBase.waitLoading()` 会在场景初始化前等待：

```ts
G.resource.remains <= 0
```

注意：

- 歌曲列表 `api/musics.json` 不走这个预加载器，而是直接 `fetch`
- 谱面 `.pr` 文件也是在场景初始化时直接 `fetch`

## 9. 资源与 Vite 的关系

`vite.config.ts` 中：

```ts
publicDir: 'game'
```

因此 `game/` 整个目录会被当成 public 资源：

- `game/api`
- `game/bgm`
- `game/graphics`
- `game/lib`
- `game/se`
- `game/songs`
- `game/style.css`

代码里因此可以直接使用如下路径：

- `graphics/...`
- `bgm/...`
- `se/...`
- `songs/...`
- `api/musics.json`

这也是当前开发服和生产构建都能正确找到旧资源目录的关键。
