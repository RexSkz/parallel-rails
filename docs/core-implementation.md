# 核心实现细节

[English](./core-implementation.en.md)

## 1. 输入：把异步 DOM 事件转成同步帧状态

相关文件：`src/Input.ts`

浏览器键盘事件天然是异步触发的，但游戏逻辑希望在“每一帧”里拿到一个稳定输入快照。因此这里采用了两段式模型：

### 1.1 事件采集

- `keydown` 只记录 `pressedKey`
- `keyup` 只记录 `releasedKey`

并不会直接在事件回调里执行游戏逻辑。

### 1.2 帧同步更新

每帧开始时，由 `renderLoop()` 先调用 `G.input.update()`，把挂起事件转成状态表：

- `isPressed`：这一帧刚按下
- `isReleased`：这一帧刚松开
- `isRepeated`：处于按住状态

这样场景只需要在自己的 `update()` 里同步轮询输入即可。

### 1.3 原生输入框焦点隔离

编辑器有 HTML 输入控件。`appendTimingPointEditingWindow()` 会在控件 `focus/blur` 时切换 `G.nativeInputFocused`，从而让游戏快捷键在输入框聚焦时暂停拦截。

相关文件：`src/Functions.ts`

### 1.4 当前限制

当前模型只有一个 `pressedKey` 和一个 `releasedKey` 缓冲位；如果同一帧内多个原生事件极快连续到达，后写入的可能覆盖前一个。这对当前原型问题不大，但如果后续要做更复杂的多键并发输入，可以改为事件队列。

## 2. Timing / Tick 计算

相关文件：`src/Tick.ts`

项目内部大量使用 `pos1000` / `bpm1000`，本质上是“毫秒 * 1000”精度的整数表示，用来规避浮点误差扩散。

### 2.1 基础公式

每个 timing point 至少包含：

- `bpm1000`
- `pos1000`
- `metronome`

每 tick 时长：

```ts
timePerTick = 60000000 / (bpm1000 * divisor)
```

某个 tick 的绝对时间：

```ts
time = pos1000 + floor(timePerTick * tick)
```

### 2.2 位置查找

`findPositionByTime(time)` 的工作分两步：

1. 二分找到 time 属于哪个 timing point 区段
2. 在该区段内计算当前 tick 序号

这让编辑器的跳拍、时间尺绘制、节拍吸附都能复用同一个入口。

### 2.3 跨 timing point 前后移动

`prev()` / `next()` 会在 tick 跨越 timing point 边界时自动切段，避免把不同 BPM 段当成连续等距时间轴。

## 3. 编辑器时间尺与节拍线

相关文件：`src/window/WindowTimeRuler.ts`、`src/scene/SceneEditor.ts`

### 3.1 基本结构

时间尺由三层组成：

- 固定阴影区
- 当前时间竖线
- 可滚动的 `timeLinesInner`

`timeLinesInner` 的横向偏移为：

```ts
x = -relativeTime * zoom
```

也就是说，“当前时间”本身不动，移动的是底下整条刻度内容。

### 3.2 增量维护

不是每一帧都重建全部刻度，而是分成三种操作：

- `repaintAllTimingPoints()`：整段重建
- `paintTpLeftTo()`：向左补线，移除右侧出屏刻度
- `paintTpRightTo()`：向右补线，移除左侧出屏刻度

因此播放或拖动时，时间尺的更新成本是可控的。

### 3.3 刻度语义

通过 `G.tick.getTickModNumber()` 区分：

- 小节线
- 拍线
- 细分线

并根据 `DataConstants.TIME_RULER_COLORS` 选择不同颜色和高度。

### 3.4 编辑器中的时间移动

`SceneEditor` 中的时间控制规则：

- `LEFT / RIGHT`：按 tick 移动
- `SHIFT + LEFT / RIGHT`：一次移动 10 个 tick
- `CTRL + LEFT / RIGHT`：按 1ms 移动
- `CTRL + SHIFT + LEFT / RIGHT`：按 10ms 移动
- `HOME / END`：跳到开头 / 结尾

## 4. Hit Object 的位置计算

相关文件：`src/window/WindowHitObject.ts`

这是当前项目最关键的视觉计算之一。

### 4.1 横坐标公式

每个 note 的横向位置通过下面公式计算：

```ts
positionX = bpm1000 * (obj.pos1000 - time1000) / 1e6 * HITOBJ_MARGIN_SIZE + JUDGEMENT_LINE_LEFT
```

可以拆成几部分理解：

- `obj.pos1000 - time1000`：note 与当前播放时间的距离
- `bpm1000 / 1e6`：把时间差转换成与 BPM 成比例的移动速度
- `HITOBJ_MARGIN_SIZE`：视觉上的横向缩放系数
- `JUDGEMENT_LINE_LEFT`：判定线固定位置

### 4.2 公式的含义

这个实现不是“按绝对时间线性移动”，而是“按拍速缩放后的相对位移”。因此：

- BPM 越高，物件横向移动越快
- 相同时间差在不同 BPM 段会有不同视觉距离

这是当前时间尺 / 判定区视觉统一的重要基础。

### 4.3 纵坐标现状

当前所有物件都放在屏幕中线：

```ts
y = 0.5 * h
```

代码里已经有 TODO，未来可继续扩展为：

- 多轨道 Y 分层
- 切轨物件
- 长条物件

### 4.4 编辑模式下的过线表现

在编辑模式中，note 过判定线后不会立刻消失，而是：

- 吸附到判定线
- 放大
- 淡出

这是为了编辑时更容易看清当前插入点和经过的 note。

## 5. 判定逻辑

相关文件：`src/scene/SceneGaming.ts`

### 5.1 判定入口

当前只对“下一个待判定物件”做判断：

- 使用 `hitIndex` 指向当前目标物件
- 算出 `delta = currentTime - noteTime`
- 根据时间差和按键颜色决定结果

### 5.2 当前时间窗口

代码中的规则为：

- 晚于 `200ms`：直接 Miss（`-2`）
- 其余在 `300ms` 内的输入才进入评分

具体区间：

- `<= 20ms`：`300g`
- `<= 60ms`：`300`
- `<= 100ms`：`200`
- `<= 160ms`：`100`
- `<= 220ms`：`50`
- 更早但仍落在 300ms 判定范围内：`0`

### 5.3 错键

如果时间差在可判定范围内，但按下的是错误颜色键，则记为 `-1`。

### 5.4 已知注意点

当前代码里，编辑器显示的绿 / 橙输入说明与游玩判定中的颜色映射存在可疑不一致，后续建议专门复查：

- `src/scene/SceneEditor.ts`
- `src/window/WindowHitObject.ts`
- `src/scene/SceneGaming.ts`

## 6. 计分与连击规则

相关文件：`src/scene/SceneGaming.ts`

### 6.1 记录结构

- `scorePoints[currentTime] = score`
- `hitResults[type]++`
- `currentCombo` / `maxCombo`
- `currentScore`

### 6.2 连击增长

只有 `score > 0` 的命中才增加连击；否则会清零。

### 6.3 分数增长公式

```ts
currentScore += min(3000, score * (floor(currentCombo / 20) + 1))
```

含义是：

- 每 20 combo 提升一个倍率档位
- 单 note 最高加分封顶 3000

这是一种很典型的“基础判定分 + 连击成长”的早期原型实现。

## 7. 命中反馈动画

相关文件：`src/window/WindowHitObject.ts`、`src/window/WindowHitScore.ts`、`src/Animation.ts`

### 7.1 Note 自身动画

`objectHit()` 根据判定结果触发不同动画：

- 正常命中：原地放大 + 淡出
- Miss：向左偏移 + 淡出
- Wrong key：向下偏移 + 淡出

### 7.2 判定文字

`WindowHitScore` 会生成一个文本 sprite，附带 `expireFrames`：

- 每帧向上移动
- alpha 线性衰减
- 到期后移除

## 8. 选歌列表动画

相关文件：`src/scene/SceneMusicSelect.ts`

每首歌对应一个 sprite 容器。切歌时不会立即跳位，而是用 `G.animation.set()` 做平滑过渡：

- 水平方向根据与当前选中项的 offset 偏移
- 垂直方向做列表式堆叠

因此选歌场景的手感很大程度上来自这个 tween 层，而不是布局层本身。

## 9. 编辑器附加能力

相关文件：`src/scene/SceneEditor.ts`、`src/Functions.ts`

目前编辑器除了谱面显示，还有几个关键机制：

- `Ctrl + S`：把当前谱面缓存到 `localStorage`
- 启动时检测缓存，可选择恢复或删除
- `F12`：把当前谱面 JSON 弹到新窗口，方便复制保存
- HTML timing 编辑面板：用于查看和编辑 timing point

这套机制说明当前编辑器主要目标还是“可用原型”和“便于人工调试”，还不是正式的完整谱面编辑器。
