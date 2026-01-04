# 雷蛇游戏 - 架构优化文档

## 📐 架构概述

本次重构将原来的单文件架构(game.js 434行)拆分为模块化的多文件架构，采用了以下设计模式和最佳实践：

### 核心设计模式
- **模块化设计 (ES6 Modules)**: 使用 ES6 import/export 实现模块化
- **事件驱动架构 (Event-Driven)**: 通过 EventBus 实现组件间解耦通信
- **单一职责原则 (SRP)**: 每个模块只负责一个特定功能
- **关注点分离 (SoC)**: 游戏逻辑、UI渲染、配置完全分离

## 📂 项目结构

```
package.nw/
├── index.html          # HTML入口文件
├── style.css           # 样式文件
├── config.js           # 游戏配置模块 ⭐新增
├── event-bus.js        # 事件总线系统 ⭐新增
├── snake.js            # 贪吃蛇游戏逻辑 ⭐新增
├── minesweeper.js      # 扫雷游戏逻辑 ⭐新增
├── ui-manager.js       # UI管理器 ⭐新增
├── main.js             # 主控制器 ⭐新增
└── game.js             # 旧版本（可删除）
```

## 🧩 模块详解

### 1️⃣ config.js - 配置模块
**职责**: 集中管理所有游戏配置常量

```javascript
- 网格设置 (GRID_SIZE, CELL_SIZE)
- 贪吃蛇设置 (速度、初始位置)
- 扫雷设置 (地雷数量)
- 分数配置
- 特效持续时间
```

**优点**:
- 便于调整游戏平衡性
- 避免魔法数字
- 统一配置管理

### 2️⃣ event-bus.js - 事件总线
**职责**: 提供发布/订阅模式的事件系统

```javascript
- on(event, callback)    // 订阅事件
- off(event, callback)   // 取消订阅
- emit(event, data)      // 发布事件
- clear()                // 清空所有监听器
```

**优点**:
- 组件间松耦合
- 易于扩展新功能
- 事件驱动的响应式设计

### 3️⃣ snake.js - 贪吃蛇模块
**职责**: 封装贪吃蛇的所有游戏逻辑

**核心方法**:
```javascript
- reset()                    // 重置游戏状态
- update()                   // 更新蛇的位置
- eatFood()                  // 吃食物逻辑
- grow(segments)             // 增长蛇身
- activateInvincible()       // 激活无敌状态
- changeDirection(dir)       // 改变移动方向
- getState()                 // 获取当前状态
```

**事件发射**:
- `snake:updated` - 蛇位置更新
- `snake:ate-food` - 吃到食物
- `snake:died` - 游戏结束
- `snake:invincible-activated/ended` - 无敌状态变化

### 4️⃣ minesweeper.js - 扫雷模块
**职责**: 封装扫雷的所有游戏逻辑

**核心方法**:
```javascript
- reset()                    // 重置游戏
- generateMines()            // 生成地雷
- toggleFlag(x, y)           // 标记/取消标记
- revealCell(x, y)           // 揭开单元格
- revealArea(cx, cy, size)   // 揭开区域
- floodFill(x, y)            // 洪水填充算法
- checkWinCondition()        // 检查胜利条件
- getState()                 // 获取状态
```

**事件发射**:
- `mine:correct-flag` - 正确标记
- `mine:hit` - 踩雷
- `mine:cells-revealed` - 揭开单元格
- `mine:board-cleared` - 清空棋盘
- `mine:board-regenerated` - 重新生成

### 5️⃣ ui-manager.js - UI管理器
**职责**: 处理所有UI渲染和DOM操作

**核心方法**:
```javascript
- renderSnake(state)              // 渲染贪吃蛇
- renderMinesweeper(state)        // 渲染扫雷
- updateScore(snake, mine)        // 更新分数
- showFeedback(type, msg)         // 显示反馈消息
- showGameOver(reason, scores)    // 显示游戏结束
- initializeMinesweeperCells()    // 初始化扫雷单元格
```

**优点**:
- UI渲染与游戏逻辑完全分离
- 便于修改UI而不影响逻辑
- 统一的DOM操作管理

### 6️⃣ main.js - 主控制器
**职责**: 协调各模块，管理游戏流程

**核心功能**:
```javascript
- initializeComponents()        // 初始化所有组件
- setupEventListeners()         // 设置事件监听
- setupKeyboardControls()       // 键盘控制
- startGameLoop()               // 启动游戏循环
- restart()                     // 重启游戏
- endGame(reason)               // 结束游戏
```

**事件协调**:
- 监听贪吃蛇事件 → 触发扫雷动作
- 监听扫雷事件 → 触发贪吃蛇奖励
- 统一管理分数更新和UI刷新

## 🔄 数据流

```
用户输入 (键盘/鼠标)
    ↓
Main Controller
    ↓
Snake/Minesweeper (游戏逻辑处理)
    ↓
EventBus (发射事件)
    ↓
Main Controller (监听事件)
    ↓
UIManager (更新界面)
```

## 📊 架构优势对比

### 旧架构 (game.js - 单文件)
❌ 434行代码在一个文件
❌ 所有逻辑耦合在一起
❌ 难以维护和测试
❌ 扩展功能困难

### 新架构 (模块化)
✅ 代码按功能分离到6个模块
✅ 组件间通过事件通信，松耦合
✅ 每个模块可独立测试
✅ 易于扩展新功能
✅ 代码可读性大幅提升
✅ 符合现代前端开发规范

## 🎯 扩展性示例

### 添加新功能只需：
1. **新增道具系统**: 创建 `power-ups.js` 模块
2. **监听事件**: `eventBus.on('snake:ate-food')`
3. **发射事件**: `eventBus.emit('powerup:collected')`
4. **不影响现有代码**: 无需修改其他模块

### 添加新游戏模式：
1. 创建新的游戏逻辑模块
2. 在 main.js 中初始化
3. 通过 EventBus 与其他模块通信

## 🛠️ 技术特性

- **ES6模块系统**: 使用 `import/export`
- **类的封装**: 面向对象设计
- **事件驱动**: 发布/订阅模式
- **状态管理**: 每个模块管理自己的状态
- **单向数据流**: 清晰的数据流动路径

## 📝 使用说明

### 开发环境
原来的单文件可直接运行，新架构需支持ES6模块:
- 通过HTTP服务器访问
- 或使用NW.js等支持ES6模块的运行环境

### 调试
每个模块可独立调试:
```javascript
// 获取游戏状态
console.log(game.snake.getState())
console.log(game.minesweeper.getState())

// 监听特定事件
game.eventBus.on('snake:ate-food', data => console.log(data))
```

## 🔧 配置调整

修改 `config.js` 即可调整游戏参数:
```javascript
// 增加难度
MINE_COUNT: 20,           // 更多地雷
MIN_SNAKE_SPEED: 50,      // 更快速度

// 调整奖励
FOOD_SCORE: 20,           // 更高分数
CLEAR_BOARD_BONUS: 100,   // 更高奖励
```

## 🎨 总结

这次架构优化实现了：
- ✅ **可维护性**: 代码结构清晰，易于理解
- ✅ **可扩展性**: 新增功能不影响现有代码
- ✅ **可测试性**: 每个模块可独立测试
- ✅ **可复用性**: 模块可在其他项目中复用
- ✅ **团队协作**: 多人可并行开发不同模块

这是一个符合现代软件工程最佳实践的架构设计！
