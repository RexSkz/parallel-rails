# Parallel Rails 文档索引

[English](./README.en.md)

这组文档先聚焦技术实现，方便后续继续补充玩法、关卡设计、谱面规范和美术音频流程。

## 文档列表

- `docs/architecture.md`
  - 运行时架构
  - 模块职责
  - 场景生命周期
  - 资源与渲染链路
- `docs/core-implementation.md`
  - 输入同步模型
  - Tick / Timing 计算
  - 时间尺与编辑器行为
  - Hit Object 位置计算
  - 判定与计分规则
- `docs/debug-and-dev.md`
  - 调试入口
  - 本地缓存与谱面导出
  - 构建、开发与资源目录说明

## 推荐阅读顺序

1. 先看 `docs/architecture.md`，建立整体结构认知。
2. 再看 `docs/core-implementation.md`，理解游戏和编辑器核心逻辑。
3. 最后看 `docs/debug-and-dev.md`，了解调试手段与开发运行方式。

## 当前范围

这些文档主要覆盖“代码现在是怎么工作的”。

暂未展开的内容包括：

- 游戏玩法说明
- 谱面设计原则
- 判定手感与数值调优思路
- 素材制作与导入流程
- 长条 / 换轨等未完成玩法设计
